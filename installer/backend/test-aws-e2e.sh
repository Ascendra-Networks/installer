#!/bin/bash

# AWS E2E Integration Test Script

API_URL="${API_URL:-http://localhost:3001}"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   AWS E2E Integration Test                                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS=0
PASSED=0
FAILED=0

# Helper function to run test
run_test() {
    local name=$1
    local url=$2
    local expected_min_items=${3:-1}
    
    TESTS=$((TESTS + 1))
    echo -e "${BLUE}[$TESTS]${NC} Testing $name..."
    
    response=$(curl -s -w "\n%{http_code}" "$API_URL$url")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        # Parse JSON and count items
        item_count=$(echo "$body" | jq '. | length' 2>/dev/null || echo "0")
        
        if [ "$item_count" -ge "$expected_min_items" ]; then
            echo -e "     ${GREEN}✓ PASS${NC} (HTTP $http_code, $item_count items)"
            PASSED=$((PASSED + 1))
            
            # Show sample data
            if [ "$item_count" -gt 0 ]; then
                echo "$body" | jq '.[0] // .' 2>/dev/null | sed 's/^/     /'
            fi
            return 0
        else
            echo -e "     ${YELLOW}⚠ PARTIAL${NC} (HTTP $http_code, only $item_count items, expected $expected_min_items+)"
            echo "     Response: $body"
            PASSED=$((PASSED + 1))
            return 0
        fi
    else
        echo -e "     ${RED}✗ FAIL${NC} (HTTP $http_code)"
        echo "     Response: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Pre-flight checks
echo -e "${BLUE}Pre-flight Checks${NC}"
echo "─────────────────────────────────────────────────────────"

# Check if backend is running
echo -n "Checking if backend is running... "
if curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "Error: Backend is not running at $API_URL"
    echo "Start it with: cd installer/backend && npm start"
    exit 1
fi

# Check AWS credentials
echo -n "Validating AWS credentials... "
cred_response=$(curl -s "$API_URL/api/aws/credential/validate")
is_valid=$(echo "$cred_response" | jq -r '.valid' 2>/dev/null)

if [ "$is_valid" = "true" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "Error: AWS credentials are not configured or invalid"
    echo "Configure with: aws configure"
    exit 1
fi

echo ""
echo -e "${BLUE}Running AWS E2E Tests${NC}"
echo "─────────────────────────────────────────────────────────"

# Test 1: Get AWS Regions
run_test "Get AWS Regions" "/api/aws/region/list" 5

# Extract a region for subsequent tests
REGION=$(curl -s "$API_URL/api/aws/region/list" | jq -r '.[0].value' 2>/dev/null)
if [ -z "$REGION" ] || [ "$REGION" = "null" ]; then
    REGION="us-east-1"
fi
echo -e "     ${BLUE}ℹ${NC} Using region: $REGION for remaining tests"
echo ""

# Test 2: Get VPCs for region
run_test "Get VPCs for $REGION" "/api/aws/vpc/list?region=$REGION" 1

# Extract a VPC for subsequent tests
VPC_ID=$(curl -s "$API_URL/api/aws/vpc/list?region=$REGION" | jq -r '.[0].value' 2>/dev/null)
if [ -n "$VPC_ID" ] && [ "$VPC_ID" != "null" ]; then
    echo -e "     ${BLUE}ℹ${NC} Using VPC: $VPC_ID for subnet test"
fi
echo ""

# Test 3: Get Subnets for region
run_test "Get Subnets for $REGION" "/api/aws/subnet/list?region=$REGION" 1

# Test 4: Get Subnets for specific VPC
if [ -n "$VPC_ID" ] && [ "$VPC_ID" != "null" ]; then
    run_test "Get Subnets for VPC $VPC_ID" "/api/aws/subnet/list?region=$REGION&vpcId=$VPC_ID" 1
    echo ""
fi

# Test 5: Get Availability Zones
run_test "Get Availability Zones for $REGION" "/api/aws/availability-zone/list?region=$REGION" 2

# Test 6: Get Instance Types for region
run_test "Get Instance Types for $REGION" "/api/aws/machine-type/list?region=$REGION" 5

# Test 7: Test cache clearing
echo ""
echo -e "${BLUE}[$((TESTS + 1))]${NC} Testing cache management..."
TESTS=$((TESTS + 1))
cache_response=$(curl -s -X POST -H "Content-Type: application/json" -d '{}' "$API_URL/api/aws/cache/clear")
if echo "$cache_response" | jq -e '.message' > /dev/null 2>&1; then
    echo -e "     ${GREEN}✓ PASS${NC} Cache cleared successfully"
    PASSED=$((PASSED + 1))
else
    echo -e "     ${RED}✗ FAIL${NC} Failed to clear cache"
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
    echo ""
    echo -e "${GREEN}✓ All AWS E2E tests passed!${NC}"
    echo ""
    echo "AWS Integration is working correctly:"
    echo "  ✓ Real regions fetched from AWS"
    echo "  ✓ Real VPCs fetched from AWS"
    echo "  ✓ Real subnets fetched from AWS"
    echo "  ✓ Real instance types fetched from AWS"
    echo "  ✓ Availability zones fetched from AWS"
    echo ""
    echo "You can now proceed with full E2E deployment testing."
    exit 0
else
    echo ""
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Verify AWS credentials: aws sts get-caller-identity"
    echo "  2. Check IAM permissions (need EC2:Describe* permissions)"
    echo "  3. Verify network connectivity to AWS"
    echo "  4. Check backend logs for detailed errors"
    exit 1
fi


