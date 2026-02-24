#!/bin/bash

# Integration test for on-premise deployment flow
# Tests configuration validation, SSH key generation, and inventory creation

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   On-Premise Deployment Integration Tests                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="http://localhost:3001"
TESTS_PASSED=0
TESTS_FAILED=0

# Test counter
test_num=0

# Function to print test header
print_test() {
    test_num=$((test_num + 1))
    echo -e "${BLUE}[TEST $test_num] $1${NC}"
}

# Function to check test result
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAILED${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
}

# Check if backend is running
echo -e "${YELLOW}Checking if backend is running...${NC}"
curl -s ${BASE_URL}/health > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}Backend is not running at ${BASE_URL}${NC}"
    echo "Please start the backend first: cd backend && npm start"
    exit 1
fi
echo -e "${GREEN}✓ Backend is running${NC}"
echo ""

# Test 1: Get config template
print_test "Download on-premise configuration template"
RESPONSE=$(curl -s -w "\n%{http_code}" ${BASE_URL}/api/onpremise/config/template)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] && echo "$BODY" | grep -q "clusterName"; then
    echo "Template downloaded successfully"
    check_result
else
    echo "Failed to download template. HTTP Code: $HTTP_CODE"
    false
    check_result
fi

# Test 2: Validate valid configuration
print_test "Validate valid on-premise configuration"
VALID_CONFIG='{
  "config": {
    "clusterName": "test-cluster",
    "sshConfig": {
      "user": "ubuntu",
      "privateKeyPath": "/tmp/test-key.pem"
    },
    "controlPlane": {
      "nodes": [
        {"ip": "192.168.1.10", "hostname": "master-1"}
      ]
    },
    "workerNodes": [
      {
        "groupName": "workers",
        "labels": {"node-role": "worker"},
        "taints": [],
        "nodes": [
          {"ip": "192.168.1.20", "hostname": "worker-1"},
          {"ip": "192.168.1.21", "hostname": "worker-2"}
        ]
      }
    ]
  }
}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/onpremise/config/validate \
  -H "Content-Type: application/json" \
  -d "$VALID_CONFIG")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] && echo "$BODY" | grep -q '"valid":true'; then
    echo "Valid configuration accepted"
    check_result
else
    echo "Failed to validate configuration. HTTP Code: $HTTP_CODE"
    echo "Response: $BODY"
    false
    check_result
fi

# Test 3: Validate invalid configuration (missing cluster name)
print_test "Reject invalid configuration (missing cluster name)"
INVALID_CONFIG='{
  "config": {
    "clusterName": "",
    "sshConfig": {
      "user": "ubuntu",
      "privateKeyPath": "/tmp/test-key.pem"
    },
    "controlPlane": {
      "nodes": [{"ip": "192.168.1.10"}]
    },
    "workerNodes": []
  }
}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/onpremise/config/validate \
  -H "Content-Type: application/json" \
  -d "$INVALID_CONFIG")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 400 ] && echo "$BODY" | grep -q '"valid":false'; then
    echo "Invalid configuration rejected as expected"
    check_result
else
    echo "Should have rejected invalid configuration. HTTP Code: $HTTP_CODE"
    false
    check_result
fi

# Test 4: Validate configuration with duplicate IPs
print_test "Reject configuration with duplicate IP addresses"
DUPLICATE_IP_CONFIG='{
  "config": {
    "clusterName": "test-cluster",
    "sshConfig": {
      "user": "ubuntu",
      "privateKeyPath": "/tmp/test-key.pem"
    },
    "controlPlane": {
      "nodes": [{"ip": "192.168.1.10"}]
    },
    "workerNodes": [
      {
        "groupName": "workers",
        "nodes": [
          {"ip": "192.168.1.10"},
          {"ip": "192.168.1.20"}
        ]
      }
    ]
  }
}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/onpremise/config/validate \
  -H "Content-Type: application/json" \
  -d "$DUPLICATE_IP_CONFIG")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 400 ] && echo "$BODY" | grep -q "Duplicate"; then
    echo "Duplicate IPs rejected as expected"
    check_result
else
    echo "Should have rejected duplicate IPs. HTTP Code: $HTTP_CODE"
    echo "Response: $BODY"
    false
    check_result
fi

# Test 5: Validate YAML configuration
print_test "Validate YAML configuration format"
YAML_CONFIG='clusterName: "yaml-test-cluster"
sshConfig:
  user: "ubuntu"
  privateKeyPath: "/tmp/key.pem"
controlPlane:
  nodes:
    - ip: "10.0.1.10"
workerNodes:
  - groupName: "workers"
    nodes:
      - ip: "10.0.1.20"'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/onpremise/config/validate \
  -H "Content-Type: application/json" \
  -d "{\"yaml\": $(echo "$YAML_CONFIG" | jq -Rs .)}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] && echo "$BODY" | grep -q '"valid":true'; then
    echo "YAML configuration parsed and validated"
    check_result
else
    echo "Failed to validate YAML. HTTP Code: $HTTP_CODE"
    echo "Response: $BODY"
    false
    check_result
fi

# Test 6: Generate SSH key
print_test "Generate SSH key pair for on-premise deployment"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/onpremise/ssh-key/generate \
  -H "Content-Type: application/json" \
  -d '{"clusterName": "test-ssh-cluster"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] && echo "$BODY" | grep -q '"success":true'; then
    echo "SSH key generated successfully"
    PRIVATE_KEY_PATH=$(echo "$BODY" | jq -r '.privateKeyPath')
    echo "Private key path: $PRIVATE_KEY_PATH"
    
    # Verify file exists
    if [ -f "../../$PRIVATE_KEY_PATH" ]; then
        echo "✓ Private key file exists"
        check_result
    else
        echo "✗ Private key file not found at: ../../$PRIVATE_KEY_PATH"
        false
        check_result
    fi
else
    echo "Failed to generate SSH key. HTTP Code: $HTTP_CODE"
    echo "Response: $BODY"
    false
    check_result
fi

# Test 7: Validate invalid taint effect
print_test "Reject invalid taint effect"
INVALID_TAINT_CONFIG='{
  "config": {
    "clusterName": "test-cluster",
    "sshConfig": {
      "user": "ubuntu",
      "privateKeyPath": "/tmp/test-key.pem"
    },
    "controlPlane": {
      "nodes": [{"ip": "192.168.1.10"}]
    },
    "workerNodes": [
      {
        "groupName": "workers",
        "taints": [
          {"key": "test", "value": "true", "effect": "InvalidEffect"}
        ],
        "nodes": [{"ip": "192.168.1.20"}]
      }
    ]
  }
}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/onpremise/config/validate \
  -H "Content-Type: application/json" \
  -d "$INVALID_TAINT_CONFIG")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 400 ] && echo "$BODY" | grep -q "taint"; then
    echo "Invalid taint effect rejected as expected"
    check_result
else
    echo "Should have rejected invalid taint. HTTP Code: $HTTP_CODE"
    false
    check_result
fi

# Test 8: Validate multiple worker groups
print_test "Validate configuration with multiple worker groups"
MULTI_GROUP_CONFIG='{
  "config": {
    "clusterName": "multi-group-cluster",
    "sshConfig": {
      "user": "ubuntu",
      "privateKeyPath": "/tmp/test-key.pem"
    },
    "controlPlane": {
      "nodes": [{"ip": "192.168.1.10"}]
    },
    "workerNodes": [
      {
        "groupName": "compute",
        "labels": {"role": "compute"},
        "nodes": [
          {"ip": "192.168.1.20"},
          {"ip": "192.168.1.21"}
        ]
      },
      {
        "groupName": "storage",
        "labels": {"role": "storage"},
        "taints": [{"key": "storage", "value": "true", "effect": "NoSchedule"}],
        "nodes": [
          {"ip": "192.168.1.30"},
          {"ip": "192.168.1.31"}
        ]
      }
    ]
  }
}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/onpremise/config/validate \
  -H "Content-Type: application/json" \
  -d "$MULTI_GROUP_CONFIG")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] && echo "$BODY" | grep -q '"valid":true'; then
    echo "Multiple worker groups configuration valid"
    check_result
else
    echo "Failed to validate multi-group config. HTTP Code: $HTTP_CODE"
    echo "Response: $BODY"
    false
    check_result
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${BLUE}Test Summary${NC}"
echo "═══════════════════════════════════════════════════════════"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi


