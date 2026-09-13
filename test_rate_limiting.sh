#!/bin/bash
# Test rate limiting on expensive operations

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Login as admin
echo "=== Logging in as Admin ==="
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}Failed to get admin token${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Admin login successful${NC}"
echo ""

# Test rate limiting on dashboard stats (60 per minute)
echo "=== Testing Rate Limiting on /api/dashboard/stats (60/minute) ==="
echo "Sending 62 requests rapidly..."

SUCCESS_COUNT=0
RATE_LIMITED_COUNT=0

for i in {1..62}; do
  HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    http://localhost:3000/api/dashboard/stats)

  if [ "$HTTP_CODE" = "200" ]; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  elif [ "$HTTP_CODE" = "429" ]; then
    RATE_LIMITED_COUNT=$((RATE_LIMITED_COUNT + 1))
  fi

  # Show progress every 10 requests
  if [ $((i % 10)) -eq 0 ]; then
    echo "  Progress: $i/62 requests sent..."
  fi
done

echo ""
echo "Results:"
echo "  Success (200): $SUCCESS_COUNT"
echo "  Rate Limited (429): $RATE_LIMITED_COUNT"

if [ $RATE_LIMITED_COUNT -gt 0 ]; then
  echo -e "${GREEN}✓ Rate limiting is working! Blocked $RATE_LIMITED_COUNT requests.${NC}"
else
  echo -e "${YELLOW}⚠ Rate limiting may not be working - no 429 responses received${NC}"
fi
echo ""

# Test rate limiting on bulk import (10 per minute)
echo "=== Testing Rate Limiting on /api/assets/import (10/minute) ==="
echo "Sending 12 requests rapidly..."

SUCCESS_COUNT=0
RATE_LIMITED_COUNT=0
CLIENT_ERROR_COUNT=0

for i in {1..12}; do
  HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -X POST http://localhost:3000/api/assets/import)

  if [ "$HTTP_CODE" = "200" ]; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  elif [ "$HTTP_CODE" = "429" ]; then
    RATE_LIMITED_COUNT=$((RATE_LIMITED_COUNT + 1))
  elif [ "$HTTP_CODE" = "400" ]; then
    # 400 = validation error, but endpoint was accessed (not rate limited)
    CLIENT_ERROR_COUNT=$((CLIENT_ERROR_COUNT + 1))
  fi
done

echo ""
echo "Results:"
echo "  Success/Access granted (200/400): $((SUCCESS_COUNT + CLIENT_ERROR_COUNT))"
echo "  Rate Limited (429): $RATE_LIMITED_COUNT"

if [ $RATE_LIMITED_COUNT -gt 0 ]; then
  echo -e "${GREEN}✓ Rate limiting is working! Blocked $RATE_LIMITED_COUNT requests.${NC}"
else
  echo -e "${YELLOW}⚠ Rate limiting may not be working - no 429 responses received${NC}"
fi
echo ""

# Test rate limiting on bulk delete (5 per minute)
echo "=== Testing Rate Limiting on /api/employees/bulk-delete (5/minute) ==="
echo "Sending 7 requests rapidly..."

SUCCESS_COUNT=0
RATE_LIMITED_COUNT=0
CLIENT_ERROR_COUNT=0

for i in {1..7}; do
  HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -X POST http://localhost:3000/api/employees/bulk-delete \
    -d '{"employee_ids":[]}')

  if [ "$HTTP_CODE" = "200" ]; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  elif [ "$HTTP_CODE" = "429" ]; then
    RATE_LIMITED_COUNT=$((RATE_LIMITED_COUNT + 1))
  elif [ "$HTTP_CODE" = "400" ]; then
    CLIENT_ERROR_COUNT=$((CLIENT_ERROR_COUNT + 1))
  fi
done

echo ""
echo "Results:"
echo "  Success/Access granted (200/400): $((SUCCESS_COUNT + CLIENT_ERROR_COUNT))"
echo "  Rate Limited (429): $RATE_LIMITED_COUNT"

if [ $RATE_LIMITED_COUNT -gt 0 ]; then
  echo -e "${GREEN}✓ Rate limiting is working! Blocked $RATE_LIMITED_COUNT requests.${NC}"
else
  echo -e "${YELLOW}⚠ Rate limiting may not be working - no 429 responses received${NC}"
fi
echo ""

echo "=== Test Complete ==="
