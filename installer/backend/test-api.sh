#!/bin/bash

# API Testing Script for Ascendra Installer Backend

API_URL="${API_URL:-http://localhost:3001}"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   Ascendra Installer Backend - API Test Script           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Testing API at: $API_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS=0
PASSED=0
FAILED=0

# Helper function to run test
run_test() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local data=$4
    
    TESTS=$((TESTS + 1))
    echo -n "[$TESTS] Testing $name... "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$API_URL$url")
    else
        response=$(curl -s -w "\n%{http_code}" "$API_URL$url")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        echo "   Response: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Health check
run_test "Health Check" "/health"

# Cloud providers
run_test "Get Providers" "/api/providers"

# Regions
run_test "Get AWS Regions" "/api/aws/region/list"

# Machine types
run_test "Get AWS Machine Types" "/api/aws/machine-type/list?region=us-east-1"

# VPCs
run_test "Get AWS VPCs" "/api/aws/vpc/list?region=us-east-1"

# Subnets
run_test "Get AWS Subnets" "/api/aws/subnet/list?region=us-east-1"

# Deployments
run_test "Get All Deployments" "/api/deployment/list"

# Create deployment (will fail if validation not working)
deployment_data='{
  "cloudProvider": "aws",
  "clusterConfig": {
    "name": "test-cluster",
    "region": "us-east-1",
    "vpc": "vpc-test",
    "subnet": "subnet-test",
    "nodePools": [{
      "id": "pool-1",
      "name": "Workers",
      "machines": [{
        "id": "m1",
        "machineType": "t3.large",
        "nodeCount": 2
      }],
      "storageClass": "standard",
      "storageSize": 100
    }]
  },
  "selectedComponents": {
    "backend-api": true
  }
}'

if run_test "Create Deployment" "/api/deployment/create" "POST" "$deployment_data"; then
    # Extract deployment ID from response
    deployment_id=$(echo "$body" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$deployment_id" ]; then
        echo "   Created deployment: $deployment_id"
        
        # Get deployment
        run_test "Get Deployment by ID" "/api/deployment/$deployment_id"
        
        # Get deployment config
        run_test "Get Deployment Config" "/api/deployment/$deployment_id/config"
        
        # Note: We don't actually start the deployment in tests
        echo -e "   ${YELLOW}Note: Not starting actual deployment in test${NC}"
    else
        echo -e "   ${YELLOW}Warning: Could not extract deployment ID${NC}"
    fi
fi

# Test invalid requests
echo ""
echo "Testing error handling..."
TESTS=$((TESTS + 1))
echo -n "[$TESTS] Testing invalid deployment creation... "
response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d '{}' "$API_URL/api/deployment/create")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" -eq 400 ]; then
    echo -e "${GREEN}✓ PASS${NC} (correctly rejected)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} (should return 400)"
    FAILED=$((FAILED + 1))
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Test Summary:"
echo "  Total:  $TESTS"
echo -e "  Passed: ${GREEN}$PASSED${NC}"
echo -e "  Failed: ${RED}$FAILED${NC}"
echo "═══════════════════════════════════════════════════════════"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi


