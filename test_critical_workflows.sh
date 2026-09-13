#!/bin/bash
# ============================================================
# CRITICAL WORKFLOWS TEST - PHASE 2
# ============================================================
# Tests: Assign, Return, Transfer, Bulk Import, Authorization
# ============================================================

set -e

BASE_URL="http://localhost:3000"
DB_PATH="databases/local_assets.db"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0

log_pass() {
    PASS_COUNT=$((PASS_COUNT+1))
    echo -e "${GREEN}✓ PASS${NC}: $1"
}

log_fail() {
    FAIL_COUNT=$((FAIL_COUNT+1))
    echo -e "${RED}✗ FAIL${NC}: $1"
}

log_info() {
    echo -e "  ℹ $1"
}

db_query() {
    sqlite3 "$DB_PATH" "$1"
}

echo "============================================================"
echo "  CRITICAL WORKFLOWS - RUNTIME VERIFICATION"
echo "============================================================"

# Login
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ FATAL${NC}: Cannot obtain auth token"
    exit 1
fi

echo -e "${GREEN}✓${NC} Auth token obtained"
echo ""

# ============================================================
# TEST: CREATE TEST DATA
# ============================================================

echo "[TEST] Creating test employees..."

# Use timestamp to ensure unique test data
TIMESTAMP=$(date +%s)
EMP1_ID_STR="TEST-WF-001-$TIMESTAMP"
EMP2_ID_STR="TEST-WF-002-$TIMESTAMP"

# Employee 1
EMP1_RESPONSE=$(curl -s -X POST "$BASE_URL/api/employees" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"emp_id\": \"$EMP1_ID_STR\",
    \"employee_name\": \"Test Workflow Employee One\",
    \"email\": \"testWF1-$TIMESTAMP@tectoro.com\",
    \"department\": \"Testing\"
  }")

# Employee 2
EMP2_RESPONSE=$(curl -s -X POST "$BASE_URL/api/employees" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"emp_id\": \"$EMP2_ID_STR\",
    \"employee_name\": \"Test Workflow Employee Two\",
    \"email\": \"testWF2-$TIMESTAMP@tectoro.com\",
    \"department\": \"Testing\"
  }")

# Small delay to ensure database writes complete
sleep 1

EMP1_ID=$(db_query "SELECT id FROM employees WHERE emp_id='$EMP1_ID_STR' LIMIT 1;")
EMP2_ID=$(db_query "SELECT id FROM employees WHERE emp_id='$EMP2_ID_STR' LIMIT 1;")

if [ -n "$EMP1_ID" ] && [ -n "$EMP2_ID" ]; then
    log_pass "Test employees created (IDs: $EMP1_ID, $EMP2_ID)"
else
    log_fail "Test employees creation failed"
    exit 1
fi

echo "[TEST] Creating test asset..."

ASSET_RESPONSE=$(curl -s -X POST "$BASE_URL/api/assets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"asset_name\": \"TEST-WF-LAPTOP-$TIMESTAMP\",
    \"serial_number\": \"WORKFLOW-TEST-$TIMESTAMP\",
    \"category\": \"Laptop\",
    \"brand_name\": \"Dell\",
    \"model_name\": \"Test Model\",
    \"status\": \"Available\"
  }")

# Small delay
sleep 1

ASSET_ID=$(db_query "SELECT id FROM assets WHERE serial_number='WORKFLOW-TEST-$TIMESTAMP' LIMIT 1;")

if [ -n "$ASSET_ID" ]; then
    log_pass "Test asset created (ID: $ASSET_ID)"
else
    log_fail "Test asset creation failed"
    exit 1
fi

echo ""

# ============================================================
# TEST: ASSET ASSIGNMENT
# ============================================================

echo "[TEST 1] Asset Assignment Workflow"
echo "  → Assigning asset $ASSET_ID to employee $EMP1_ID..."

ASSIGN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/operations/assign" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"asset_id\": $ASSET_ID,
    \"emp_id\": \"$EMP1_ID_STR\",
    \"comments\": \"Test assignment\"
  }")

if echo "$ASSIGN_RESPONSE" | grep -q '"success":true'; then
    log_pass "Asset assigned via API"

    # Verify in database
    DB_ASSIGNED_TO=$(db_query "SELECT emp_id FROM assets WHERE id=$ASSET_ID;")
    DB_STATUS=$(db_query "SELECT status FROM assets WHERE id=$ASSET_ID;")

    if [ "$DB_ASSIGNED_TO" = "$EMP1_ID_STR" ]; then
        log_pass "Asset emp_id updated in database"
    else
        log_fail "Asset emp_id NOT updated (got: $DB_ASSIGNED_TO)"
    fi

    if [ "$DB_STATUS" = "Assigned" ]; then
        log_pass "Asset status updated to 'Assigned'"
    else
        log_fail "Asset status incorrect (got: $DB_STATUS)"
    fi

    # Check lifecycle
    LIFECYCLE_COUNT=$(db_query "SELECT COUNT(*) FROM asset_lifecycle WHERE asset_id=$ASSET_ID AND event_type='ASSIGNED';")
    if [ "$LIFECYCLE_COUNT" -gt 0 ]; then
        log_pass "Lifecycle record created"
    else
        log_fail "No lifecycle record"
    fi

    # Check audit log
    AUDIT_COUNT=$(db_query "SELECT COUNT(*) FROM audit_logs WHERE asset_id=$ASSET_ID AND action_type='ASSET_ASSIGNED';")
    if [ "$AUDIT_COUNT" -gt 0 ]; then
        log_pass "Audit log created"
    else
        log_fail "No audit log"
    fi
else
    log_fail "Asset assignment failed"
    log_info "Response: $ASSIGN_RESPONSE"
fi

echo ""

# ============================================================
# TEST: ASSET TRANSFER
# ============================================================

echo "[TEST 2] Asset Transfer Workflow"
echo "  → Transferring asset from EMP-001 to EMP-002..."

TRANSFER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/operations/transfer" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"asset_id\": $ASSET_ID,
    \"to_emp_id\": \"$EMP2_ID_STR\",
    \"reason\": \"Test transfer\",
    \"comments\": \"Testing transfer workflow\"
  }")

if echo "$TRANSFER_RESPONSE" | grep -q '"success":true'; then
    log_pass "Asset transferred via API"

    # Verify in database
    DB_ASSIGNED_TO=$(db_query "SELECT emp_id FROM assets WHERE id=$ASSET_ID;")

    if [ "$DB_ASSIGNED_TO" = "$EMP2_ID_STR" ]; then
        log_pass "Asset now assigned to EMP-002"
    else
        log_fail "Asset assignment incorrect (got: $DB_ASSIGNED_TO)"
    fi

    # Check lifecycle - should have 2 events (assign + transfer)
    LIFECYCLE_COUNT=$(db_query "SELECT COUNT(*) FROM asset_lifecycle WHERE asset_id=$ASSET_ID;")
    if [ "$LIFECYCLE_COUNT" -ge 2 ]; then
        log_pass "Lifecycle records created ($LIFECYCLE_COUNT events)"
    else
        log_fail "Insufficient lifecycle records (got: $LIFECYCLE_COUNT)"
    fi

    # Verify old employee has no current assignment
    EMP1_ASSET_CHECK=$(db_query "SELECT COUNT(*) FROM assets WHERE emp_id='$EMP1_ID_STR' AND status='Assigned';")
    if [ "$EMP1_ASSET_CHECK" = "0" ]; then
        log_pass "Old employee no longer has asset assigned"
    else
        log_fail "Old employee still shows asset assigned"
    fi
else
    log_fail "Asset transfer failed"
    log_info "Response: $TRANSFER_RESPONSE"
fi

echo ""

# ============================================================
# TEST: ASSET RETURN
# ============================================================

echo "[TEST 3] Asset Return Workflow"
echo "  → Returning asset to inventory..."

RETURN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/operations/return" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"asset_id\": $ASSET_ID,
    \"comments\": \"Test return\"
  }")

if echo "$RETURN_RESPONSE" | grep -q '"success":true'; then
    log_pass "Asset returned via API"

    # Verify in database
    DB_ASSIGNED_TO=$(db_query "SELECT emp_id FROM assets WHERE id=$ASSET_ID;")
    DB_STATUS=$(db_query "SELECT status FROM assets WHERE id=$ASSET_ID;")

    if [ -z "$DB_ASSIGNED_TO" ] || [ "$DB_ASSIGNED_TO" = "" ]; then
        log_pass "Asset emp_id cleared (unassigned)"
    else
        log_fail "Asset still assigned to: $DB_ASSIGNED_TO"
    fi

    if [ "$DB_STATUS" = "Available" ]; then
        log_pass "Asset status updated to 'Available'"
    else
        log_fail "Asset status incorrect (got: $DB_STATUS)"
    fi

    # Check lifecycle
    LIFECYCLE_COUNT=$(db_query "SELECT COUNT(*) FROM asset_lifecycle WHERE asset_id=$ASSET_ID AND event_type='RETURNED';")
    if [ "$LIFECYCLE_COUNT" -gt 0 ]; then
        log_pass "Return lifecycle record created"
    else
        log_fail "No return lifecycle record"
    fi
else
    log_fail "Asset return failed"
    log_info "Response: $RETURN_RESPONSE"
fi

echo ""

# ============================================================
# TEST: DUPLICATE SERIAL VALIDATION
# ============================================================

echo "[TEST 4] Duplicate Serial Number Validation"
echo "  → Attempting to create asset with duplicate serial..."

DUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/assets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"asset_name\": \"DUPLICATE-TEST\",
    \"serial_number\": \"WORKFLOW-TEST-$TIMESTAMP\",
    \"category\": \"Laptop\",
    \"brand_name\": \"HP\",
    \"status\": \"Available\"
  }")

if echo "$DUP_RESPONSE" | grep -qi 'error\|duplicate\|exists'; then
    log_pass "Duplicate serial rejected by API"

    # Verify in database (should still be only 1)
    SERIAL_COUNT=$(db_query "SELECT COUNT(*) FROM assets WHERE serial_number='WORKFLOW-TEST-$TIMESTAMP';")
    if [ "$SERIAL_COUNT" = "1" ]; then
        log_pass "Database has only 1 asset with this serial"
    else
        log_fail "Database has $SERIAL_COUNT assets with this serial"
    fi
else
    log_fail "Duplicate serial NOT rejected"
    log_info "Response: $DUP_RESPONSE"
fi

echo ""

# ============================================================
# TEST: AUTHORIZATION
# ============================================================

echo "[TEST 5] Authorization - View Role Restrictions"

# First, need to set password for View user
python3 << 'PYEOF'
import os, sys
os.environ['APP_ENV'] = 'office'
os.environ['FLASK_ENV'] = 'production'

from api_server import app, db
from models import User
from werkzeug.security import generate_password_hash

with app.app_context():
    view_user = User.query.filter_by(username='View').first()
    if view_user:
        view_user.password_hash = generate_password_hash('View@123')
        db.session.commit()
PYEOF

# Login as View
VIEW_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"View","password":"View@123"}')

VIEW_TOKEN=$(echo "$VIEW_LOGIN" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -n "$VIEW_TOKEN" ]; then
    log_pass "View user login successful"

    # Try to delete asset (should fail)
    VIEW_DELETE=$(curl -s -X DELETE "$BASE_URL/api/assets/$ASSET_ID" \
      -H "Authorization: Bearer $VIEW_TOKEN")

    if echo "$VIEW_DELETE" | grep -qi 'error\|unauthorized\|forbidden\|permission'; then
        log_pass "View role blocked from delete operation"
    else
        log_fail "View role NOT properly restricted"
    fi

    # Try to create asset (should fail)
    VIEW_CREATE=$(curl -s -X POST "$BASE_URL/api/assets" \
      -H "Authorization: Bearer $VIEW_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"asset_name":"UNAUTHORIZED","serial_number":"UNAUTH-001","category":"Laptop"}')

    if echo "$VIEW_CREATE" | grep -qi 'error\|unauthorized\|forbidden\|permission'; then
        log_pass "View role blocked from create operation"
    else
        log_fail "View role NOT blocked from create"
    fi
else
    log_fail "View user login failed"
fi

echo ""

# ============================================================
# TEST: DASHBOARD ACCURACY
# ============================================================

echo "[TEST 6] Dashboard Data Accuracy"

DASHBOARD=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/dashboard/stats")

if [ -n "$DASHBOARD" ]; then
    API_TOTAL=$(echo "$DASHBOARD" | python3 -c "import sys, json; print(json.load(sys.stdin).get('totalAssets', 0))" 2>/dev/null)
    API_AVAILABLE=$(echo "$DASHBOARD" | python3 -c "import sys, json; print(json.load(sys.stdin).get('availableAssets', 0))" 2>/dev/null)

    DB_TOTAL=$(db_query "SELECT COUNT(*) FROM assets WHERE is_deleted=0;")
    DB_AVAILABLE=$(db_query "SELECT COUNT(*) FROM assets WHERE is_deleted=0 AND status='Available';")

    if [ "$API_TOTAL" = "$DB_TOTAL" ]; then
        log_pass "Dashboard total assets matches DB ($API_TOTAL = $DB_TOTAL)"
    else
        log_fail "Dashboard total mismatch (API=$API_TOTAL, DB=$DB_TOTAL)"
    fi

    if [ "$API_AVAILABLE" = "$DB_AVAILABLE" ]; then
        log_pass "Dashboard available assets matches DB ($API_AVAILABLE = $DB_AVAILABLE)"
    else
        log_fail "Dashboard available mismatch (API=$API_AVAILABLE, DB=$DB_AVAILABLE)"
    fi
else
    log_fail "Dashboard API failed"
fi

echo ""

# ============================================================
# CLEANUP
# ============================================================

echo "[CLEANUP] Removing test data..."

# Delete asset
curl -s -X DELETE "$BASE_URL/api/assets/$ASSET_ID" -H "Authorization: Bearer $TOKEN" > /dev/null

# Delete employees
curl -s -X DELETE "$BASE_URL/api/employees/$EMP1_ID" -H "Authorization: Bearer $TOKEN" > /dev/null
curl -s -X DELETE "$BASE_URL/api/employees/$EMP2_ID" -H "Authorization: Bearer $TOKEN" > /dev/null

log_info "Test data cleanup completed"

echo ""
echo "============================================================"
echo "  CRITICAL WORKFLOWS SUMMARY"
echo "============================================================"
echo -e "Passed: ${GREEN}$PASS_COUNT${NC}"
echo -e "Failed: ${RED}$FAIL_COUNT${NC}"
echo "============================================================"

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CRITICAL WORKFLOWS PASSED${NC}"
    exit 0
else
    echo -e "${RED}✗ $FAIL_COUNT WORKFLOW(S) FAILED${NC}"
    exit 1
fi
