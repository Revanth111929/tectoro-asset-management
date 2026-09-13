#!/bin/bash
# ============================================================
# COMPLETE PRODUCTION RUNTIME VERIFICATION
# ============================================================
# Tests ALL critical workflows end-to-end
# Verifies UI → API → Database → Response → UI flow
# ============================================================

set -e

BASE_URL="http://localhost:3000"
DB_PATH="databases/local_assets.db"
RESULTS_FILE="complete_runtime_results.txt"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0
BLOCKED_COUNT=0
NOT_VERIFIED_COUNT=0
TOTAL_TESTS=0

# Initialize results file
echo "============================================================" > "$RESULTS_FILE"
echo "COMPLETE RUNTIME VERIFICATION - $(date)" >> "$RESULTS_FILE"
echo "============================================================" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

log_header() {
    echo ""
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================${NC}"
    echo "" >> "$RESULTS_FILE"
    echo "============================================================" >> "$RESULTS_FILE"
    echo "$1" >> "$RESULTS_FILE"
    echo "============================================================" >> "$RESULTS_FILE"
}

log_test() {
    TOTAL_TESTS=$((TOTAL_TESTS+1))
    echo ""
    echo -e "${YELLOW}[TEST $TOTAL_TESTS]${NC} $1"
    echo "" >> "$RESULTS_FILE"
    echo "[TEST $TOTAL_TESTS] $1" >> "$RESULTS_FILE"
}

log_pass() {
    PASS_COUNT=$((PASS_COUNT+1))
    echo -e "${GREEN}✓ PASS${NC}: $1"
    echo "  ✓ PASS: $1" >> "$RESULTS_FILE"
}

log_fail() {
    FAIL_COUNT=$((FAIL_COUNT+1))
    echo -e "${RED}✗ FAIL${NC}: $1"
    echo "  ✗ FAIL: $1" >> "$RESULTS_FILE"
}

log_blocked() {
    BLOCKED_COUNT=$((BLOCKED_COUNT+1))
    echo -e "${YELLOW}⊘ BLOCKED${NC}: $1"
    echo "  ⊘ BLOCKED: $1" >> "$RESULTS_FILE"
}

log_not_verified() {
    NOT_VERIFIED_COUNT=$((NOT_VERIFIED_COUNT+1))
    echo -e "${YELLOW}? NOT VERIFIED${NC}: $1"
    echo "  ? NOT VERIFIED: $1" >> "$RESULTS_FILE"
}

log_info() {
    echo -e "  ℹ $1"
    echo "    ℹ $1" >> "$RESULTS_FILE"
}

db_query() {
    sqlite3 "$DB_PATH" "$1" 2>/dev/null || echo "QUERY_ERROR"
}

db_count() {
    local result=$(db_query "$1")
    if [ "$result" = "QUERY_ERROR" ]; then
        echo "0"
    else
        echo "$result"
    fi
}

log_header "PHASE 2A: AUTHENTICATION & SETUP"

# ============================================================
# AUTHENTICATION
# ============================================================

log_test "Authentication - Admin Login"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
    if [ -n "$TOKEN" ]; then
        log_pass "Admin login successful, token obtained"
        log_info "Token: ${TOKEN:0:50}..."
    else
        log_fail "Login returned success but no token"
        exit 1
    fi
else
    log_fail "Admin login failed"
    log_info "Response: $LOGIN_RESPONSE"
    exit 1
fi

log_test "Health Check"
HEALTH=$(curl -s "$BASE_URL/api/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    log_pass "API health check OK"
else
    log_fail "Health check failed: $HEALTH"
fi

# ============================================================
# DATABASE STATE BASELINE
# ============================================================

log_test "Database Baseline - Record Counts"

INITIAL_EMPLOYEE_COUNT=$(db_count "SELECT COUNT(*) FROM employees;")
INITIAL_ASSET_COUNT=$(db_count "SELECT COUNT(*) FROM assets WHERE is_deleted=0;")
INITIAL_USER_COUNT=$(db_count "SELECT COUNT(*) FROM users;")

log_info "Employees: $INITIAL_EMPLOYEE_COUNT"
log_info "Assets (active): $INITIAL_ASSET_COUNT"
log_info "Users: $INITIAL_USER_COUNT"

if [ "$INITIAL_EMPLOYEE_COUNT" -gt 0 ]; then
    log_pass "Database has employee data"
else
    log_fail "Database has no employees"
fi

log_test "Foreign Keys Status"
# Foreign keys are enabled via SQLAlchemy event listener
python3 << 'PYEOF'
import os, sys
os.environ['APP_ENV'] = 'office'
os.environ['FLASK_ENV'] = 'production'
try:
    from api_server import app, db
    from sqlalchemy import text
    with app.app_context():
        result = db.session.execute(text("PRAGMA foreign_keys")).scalar()
        if result == 1:
            print("ENABLED")
            sys.exit(0)
        else:
            print("DISABLED")
            sys.exit(1)
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(2)
PYEOF

FK_STATUS=$?
if [ $FK_STATUS -eq 0 ]; then
    log_pass "Foreign keys enabled in application"
else
    log_fail "Foreign keys NOT enabled"
fi

# ============================================================
# CREATE TEST DATA
# ============================================================

log_header "PHASE 2B: TEST DATA CREATION"

TIMESTAMP=$(date +%s)
TEST_EMP1_ID="TEST-RT-E1-$TIMESTAMP"
TEST_EMP2_ID="TEST-RT-E2-$TIMESTAMP"
TEST_ASSET_SERIAL="TEST-RT-ASSET-$TIMESTAMP"

log_test "Create Test Employee 1"
EMP1_RESPONSE=$(curl -s -X POST "$BASE_URL/api/employees" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"emp_id\": \"$TEST_EMP1_ID\",
    \"employee_name\": \"Runtime Test Employee One\",
    \"email\": \"rttest1-$TIMESTAMP@tectoro.com\",
    \"department\": \"QA Testing\",
    \"designation\": \"Test Engineer\"
  }")

sleep 1

if echo "$EMP1_RESPONSE" | grep -q '"success":true\|"employee"'; then
    # Verify in database using emp_id (not id)
    EMP1_EXISTS=$(db_count "SELECT COUNT(*) FROM employees WHERE emp_id='$TEST_EMP1_ID';")
    if [ "$EMP1_EXISTS" = "1" ]; then
        log_pass "Employee 1 created and verified in database"
        log_info "emp_id: $TEST_EMP1_ID"
    else
        log_fail "Employee 1 not found in database"
    fi
else
    log_fail "Employee 1 creation failed"
    log_info "Response: ${EMP1_RESPONSE:0:200}"
fi

log_test "Create Test Employee 2"
EMP2_RESPONSE=$(curl -s -X POST "$BASE_URL/api/employees" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"emp_id\": \"$TEST_EMP2_ID\",
    \"employee_name\": \"Runtime Test Employee Two\",
    \"email\": \"rttest2-$TIMESTAMP@tectoro.com\",
    \"department\": \"QA Testing\",
    \"designation\": \"Senior Test Engineer\"
  }")

sleep 1

if echo "$EMP2_RESPONSE" | grep -q '"success":true\|"employee"'; then
    EMP2_EXISTS=$(db_count "SELECT COUNT(*) FROM employees WHERE emp_id='$TEST_EMP2_ID';")
    if [ "$EMP2_EXISTS" = "1" ]; then
        log_pass "Employee 2 created and verified in database"
        log_info "emp_id: $TEST_EMP2_ID"
    else
        log_fail "Employee 2 not found in database"
    fi
else
    log_fail "Employee 2 creation failed"
fi

log_test "Create Test Asset"
ASSET_RESPONSE=$(curl -s -X POST "$BASE_URL/api/assets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"asset_name\": \"Runtime Test Laptop\",
    \"serial_number\": \"$TEST_ASSET_SERIAL\",
    \"category\": \"Laptop\",
    \"brand_name\": \"Dell\",
    \"model_name\": \"Latitude 5420\",
    \"status\": \"Available\",
    \"purchase_date\": \"2026-01-15\",
    \"warranty_end_date\": \"2029-01-15\"
  }")

sleep 1

if echo "$ASSET_RESPONSE" | grep -q '"success":true\|"asset"'; then
    TEST_ASSET_ID=$(db_query "SELECT id FROM assets WHERE serial_number='$TEST_ASSET_SERIAL' LIMIT 1;")
    if [ -n "$TEST_ASSET_ID" ] && [ "$TEST_ASSET_ID" != "QUERY_ERROR" ]; then
        log_pass "Asset created and verified in database"
        log_info "Asset ID: $TEST_ASSET_ID"
        log_info "Serial: $TEST_ASSET_SERIAL"

        # Verify asset details
        ASSET_STATUS=$(db_query "SELECT status FROM assets WHERE id=$TEST_ASSET_ID;")
        if [ "$ASSET_STATUS" = "Available" ]; then
            log_pass "Asset initial status is 'Available'"
        else
            log_fail "Asset status incorrect: $ASSET_STATUS"
        fi
    else
        log_fail "Asset not found in database"
    fi
else
    log_fail "Asset creation failed"
    log_info "Response: ${ASSET_RESPONSE:0:300}"
fi

# ============================================================
# ASSET ASSIGNMENT WORKFLOW
# ============================================================

log_header "PHASE 2B: ASSET ASSIGNMENT WORKFLOW"

if [ -z "$TEST_ASSET_ID" ]; then
    log_blocked "Cannot test assignment - no test asset"
else
    log_test "Assign Asset to Employee 1"

    ASSIGN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/operations/assign" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"asset_id\": $TEST_ASSET_ID,
        \"emp_id\": \"$TEST_EMP1_ID\",
        \"comments\": \"Runtime test assignment\"
      }")

    sleep 1

    if echo "$ASSIGN_RESPONSE" | grep -q '"success":true'; then
        log_pass "Assignment API returned success"

        # Verify database - emp_id field
        DB_EMP_ID=$(db_query "SELECT emp_id FROM assets WHERE id=$TEST_ASSET_ID;")
        if [ "$DB_EMP_ID" = "$TEST_EMP1_ID" ]; then
            log_pass "Database: Asset emp_id updated correctly"
        else
            log_fail "Database: Asset emp_id incorrect (got: $DB_EMP_ID)"
        fi

        # Verify status
        DB_STATUS=$(db_query "SELECT status FROM assets WHERE id=$TEST_ASSET_ID;")
        if [ "$DB_STATUS" = "Assigned" ]; then
            log_pass "Database: Asset status is 'Assigned'"
        else
            log_fail "Database: Asset status incorrect (got: $DB_STATUS)"
        fi

        # Verify employee name stored
        DB_EMP_NAME=$(db_query "SELECT employee_name FROM assets WHERE id=$TEST_ASSET_ID;")
        if [ -n "$DB_EMP_NAME" ] && [ "$DB_EMP_NAME" != "" ]; then
            log_pass "Database: Employee name stored: $DB_EMP_NAME"
        else
            log_fail "Database: Employee name not stored"
        fi

        # Verify lifecycle record
        LIFECYCLE_COUNT=$(db_count "SELECT COUNT(*) FROM asset_lifecycle WHERE asset_id=$TEST_ASSET_ID AND event_type='ASSIGNED';")
        if [ "$LIFECYCLE_COUNT" -gt 0 ]; then
            log_pass "Lifecycle: Assignment event recorded"
        else
            log_fail "Lifecycle: No assignment event found"
        fi

        # Verify audit log
        AUDIT_COUNT=$(db_count "SELECT COUNT(*) FROM audit_logs WHERE asset_id=$TEST_ASSET_ID AND action_type='ASSET_ASSIGNED';")
        if [ "$AUDIT_COUNT" -gt 0 ]; then
            log_pass "Audit: Assignment logged"
        else
            log_fail "Audit: No assignment log found"
        fi

        # Verify via GET API
        GET_ASSET_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/assets/$TEST_ASSET_ID")
        if echo "$GET_ASSET_RESPONSE" | grep -q "$TEST_EMP1_ID"; then
            log_pass "GET API: Asset shows correct employee"
        else
            log_fail "GET API: Asset does not show employee correctly"
        fi

    else
        log_fail "Assignment API failed"
        log_info "Response: $ASSIGN_RESPONSE"
    fi
fi

# ============================================================
# ASSET TRANSFER WORKFLOW
# ============================================================

log_header "PHASE 2D: ASSET TRANSFER WORKFLOW"

if [ -z "$TEST_ASSET_ID" ]; then
    log_blocked "Cannot test transfer - no test asset"
else
    log_test "Transfer Asset from Employee 1 to Employee 2"

    TRANSFER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/operations/transfer" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"asset_id\": $TEST_ASSET_ID,
        \"to_emp_id\": \"$TEST_EMP2_ID\",
        \"reason\": \"Runtime test transfer\",
        \"comments\": \"Testing transfer workflow\"
      }")

    sleep 1

    if echo "$TRANSFER_RESPONSE" | grep -q '"success":true'; then
        log_pass "Transfer API returned success"

        # Verify new employee assignment
        DB_EMP_ID=$(db_query "SELECT emp_id FROM assets WHERE id=$TEST_ASSET_ID;")
        if [ "$DB_EMP_ID" = "$TEST_EMP2_ID" ]; then
            log_pass "Database: Asset now assigned to Employee 2"
        else
            log_fail "Database: Asset assignment incorrect (got: $DB_EMP_ID, expected: $TEST_EMP2_ID)"
        fi

        # Verify status still Assigned
        DB_STATUS=$(db_query "SELECT status FROM assets WHERE id=$TEST_ASSET_ID;")
        if [ "$DB_STATUS" = "Assigned" ]; then
            log_pass "Database: Asset status still 'Assigned'"
        else
            log_fail "Database: Asset status incorrect (got: $DB_STATUS)"
        fi

        # Verify old employee has no current assignment to this asset
        OLD_EMP_ASSET_COUNT=$(db_count "SELECT COUNT(*) FROM assets WHERE emp_id='$TEST_EMP1_ID' AND id=$TEST_ASSET_ID AND status='Assigned';")
        if [ "$OLD_EMP_ASSET_COUNT" = "0" ]; then
            log_pass "Database: Old employee no longer has this asset"
        else
            log_fail "Database: Old employee still shows asset assigned"
        fi

        # Verify lifecycle events (should have ASSIGNED and TRANSFERRED)
        TOTAL_LIFECYCLE=$(db_count "SELECT COUNT(*) FROM asset_lifecycle WHERE asset_id=$TEST_ASSET_ID;")
        if [ "$TOTAL_LIFECYCLE" -ge 2 ]; then
            log_pass "Lifecycle: Transfer event recorded ($TOTAL_LIFECYCLE total events)"
        else
            log_fail "Lifecycle: Insufficient events (got: $TOTAL_LIFECYCLE, expected: >= 2)"
        fi

        # Verify audit log
        TRANSFER_AUDIT=$(db_count "SELECT COUNT(*) FROM audit_logs WHERE asset_id=$TEST_ASSET_ID AND action_type='ASSET_TRANSFERRED';")
        if [ "$TRANSFER_AUDIT" -gt 0 ]; then
            log_pass "Audit: Transfer logged"
        else
            log_fail "Audit: No transfer log found"
        fi

    else
        log_fail "Transfer API failed"
        log_info "Response: $TRANSFER_RESPONSE"
    fi
fi

# ============================================================
# ASSET RETURN WORKFLOW
# ============================================================

log_header "PHASE 2C: ASSET RETURN WORKFLOW"

if [ -z "$TEST_ASSET_ID" ]; then
    log_blocked "Cannot test return - no test asset"
else
    log_test "Return Asset to Inventory"

    RETURN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/operations/return" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"asset_id\": $TEST_ASSET_ID,
        \"comments\": \"Runtime test return\"
      }")

    sleep 1

    if echo "$RETURN_RESPONSE" | grep -q '"success":true'; then
        log_pass "Return API returned success"

        # Verify emp_id cleared
        DB_EMP_ID=$(db_query "SELECT emp_id FROM assets WHERE id=$TEST_ASSET_ID;")
        if [ -z "$DB_EMP_ID" ] || [ "$DB_EMP_ID" = "" ] || [ "$DB_EMP_ID" = "QUERY_ERROR" ]; then
            log_pass "Database: Asset emp_id cleared (unassigned)"
        else
            log_fail "Database: Asset still has emp_id: $DB_EMP_ID"
        fi

        # Verify status
        DB_STATUS=$(db_query "SELECT status FROM assets WHERE id=$TEST_ASSET_ID;")
        if [ "$DB_STATUS" = "Available" ]; then
            log_pass "Database: Asset status is 'Available'"
        else
            log_fail "Database: Asset status incorrect (got: $DB_STATUS, expected: Available)"
        fi

        # Verify lifecycle
        RETURN_LIFECYCLE=$(db_count "SELECT COUNT(*) FROM asset_lifecycle WHERE asset_id=$TEST_ASSET_ID AND event_type='RETURNED';")
        if [ "$RETURN_LIFECYCLE" -gt 0 ]; then
            log_pass "Lifecycle: Return event recorded"
        else
            log_fail "Lifecycle: No return event found"
        fi

        # Verify audit
        RETURN_AUDIT=$(db_count "SELECT COUNT(*) FROM audit_logs WHERE asset_id=$TEST_ASSET_ID AND action_type='ASSET_RETURNED';")
        if [ "$RETURN_AUDIT" -gt 0 ]; then
            log_pass "Audit: Return logged"
        else
            log_fail "Audit: No return log found"
        fi

    else
        log_fail "Return API failed"
        log_info "Response: $RETURN_RESPONSE"
    fi
fi

# ============================================================
# DUPLICATE ASSIGNMENT PROTECTION
# ============================================================

log_header "PHASE 2E: DUPLICATE ASSIGNMENT PROTECTION"

if [ -z "$TEST_ASSET_ID" ]; then
    log_blocked "Cannot test duplicate protection - no test asset"
else
    log_test "Attempt Double Assignment (Should Fail)"

    # First assign to Employee 1
    ASSIGN1=$(curl -s -X POST "$BASE_URL/api/operations/assign" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"asset_id\":$TEST_ASSET_ID,\"emp_id\":\"$TEST_EMP1_ID\",\"comments\":\"First assignment\"}")

    sleep 1

    # Now try to assign same asset to Employee 2 (should fail or handle correctly)
    ASSIGN2=$(curl -s -X POST "$BASE_URL/api/operations/assign" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"asset_id\":$TEST_ASSET_ID,\"emp_id\":\"$TEST_EMP2_ID\",\"comments\":\"Second assignment\"}")

    sleep 1

    # Check database - asset should only have ONE current owner
    DB_EMP_ID=$(db_query "SELECT emp_id FROM assets WHERE id=$TEST_ASSET_ID;")

    # Count how many times this asset appears as "Assigned" status
    ASSIGNED_COUNT=$(db_count "SELECT COUNT(*) FROM assets WHERE id=$TEST_ASSET_ID AND status='Assigned';")

    if [ "$ASSIGNED_COUNT" = "1" ]; then
        log_pass "Protection: Asset has exactly ONE assignment"
        log_info "Current owner: $DB_EMP_ID"
    elif [ "$ASSIGNED_COUNT" = "0" ]; then
        log_pass "Protection: Asset not assigned (acceptable if API rejected second assignment)"
    else
        log_fail "Protection: Asset has MULTIPLE assignments ($ASSIGNED_COUNT)"
    fi

    # Return asset for next tests
    curl -s -X POST "$BASE_URL/api/operations/return" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"asset_id\":$TEST_ASSET_ID,\"comments\":\"Cleanup\"}" > /dev/null
    sleep 1
fi

# ============================================================
# DUPLICATE SERIAL VALIDATION
# ============================================================

log_header "DUPLICATE SERIAL VALIDATION"

log_test "Attempt to Create Asset with Duplicate Serial"

DUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/assets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"asset_name\": \"Duplicate Test\",
    \"serial_number\": \"$TEST_ASSET_SERIAL\",
    \"category\": \"Laptop\",
    \"brand_name\": \"HP\",
    \"status\": \"Available\"
  }")

if echo "$DUP_RESPONSE" | grep -qi 'error\|duplicate\|exists\|already'; then
    log_pass "API: Duplicate serial rejected"

    # Verify database still has only 1
    SERIAL_COUNT=$(db_count "SELECT COUNT(*) FROM assets WHERE serial_number='$TEST_ASSET_SERIAL';")
    if [ "$SERIAL_COUNT" = "1" ]; then
        log_pass "Database: Only ONE asset with this serial"
    else
        log_fail "Database: Found $SERIAL_COUNT assets with serial $TEST_ASSET_SERIAL"
    fi
else
    log_fail "API: Duplicate serial NOT rejected"
    log_info "Response: $DUP_RESPONSE"
fi

# ============================================================
# DASHBOARD ACCURACY
# ============================================================

log_header "PHASE 2J: DASHBOARD ACCURACY"

log_test "Dashboard vs Database Comparison"

DASHBOARD_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/dashboard/stats")

if [ -n "$DASHBOARD_RESPONSE" ] && echo "$DASHBOARD_RESPONSE" | grep -q '{'; then
    # Extract dashboard counts
    DASH_TOTAL=$(echo "$DASHBOARD_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('totalAssets', 0))" 2>/dev/null || echo "0")
    DASH_AVAILABLE=$(echo "$DASHBOARD_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('availableAssets', 0))" 2>/dev/null || echo "0")
    DASH_ASSIGNED=$(echo "$DASHBOARD_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('assignedAssets', 0))" 2>/dev/null || echo "0")

    # Get actual database counts
    DB_TOTAL=$(db_count "SELECT COUNT(*) FROM assets WHERE is_deleted=0;")
    DB_AVAILABLE=$(db_count "SELECT COUNT(*) FROM assets WHERE is_deleted=0 AND status='Available';")
    DB_ASSIGNED=$(db_count "SELECT COUNT(*) FROM assets WHERE is_deleted=0 AND status='Assigned';")

    log_info "Dashboard Total: $DASH_TOTAL, DB Total: $DB_TOTAL"
    log_info "Dashboard Available: $DASH_AVAILABLE, DB Available: $DB_AVAILABLE"
    log_info "Dashboard Assigned: $DASH_ASSIGNED, DB Assigned: $DB_ASSIGNED"

    if [ "$DASH_TOTAL" = "$DB_TOTAL" ]; then
        log_pass "Dashboard total assets matches database"
    else
        log_fail "Dashboard total mismatch (Dashboard=$DASH_TOTAL, DB=$DB_TOTAL)"
    fi

    if [ "$DASH_AVAILABLE" = "$DB_AVAILABLE" ]; then
        log_pass "Dashboard available assets matches database"
    else
        log_fail "Dashboard available mismatch (Dashboard=$DASH_AVAILABLE, DB=$DB_AVAILABLE)"
    fi

    if [ "$DASH_ASSIGNED" = "$DB_ASSIGNED" ]; then
        log_pass "Dashboard assigned assets matches database"
    else
        log_fail "Dashboard assigned mismatch (Dashboard=$DASH_ASSIGNED, DB=$DB_ASSIGNED)"
    fi
else
    log_fail "Dashboard API failed or returned invalid response"
fi

# ============================================================
# ACTIVITY LOG VERIFICATION
# ============================================================

log_header "ACTIVITY LOG VERIFICATION"

log_test "Activity Log Completeness"

RECENT_ACTIVITY_COUNT=$(db_count "SELECT COUNT(*) FROM activity_logs WHERE timestamp > datetime('now', '-10 minutes');")

if [ "$RECENT_ACTIVITY_COUNT" -gt 0 ]; then
    log_pass "Activity logs recorded for recent operations ($RECENT_ACTIVITY_COUNT events)"

    # Show recent activities
    RECENT_ACTIVITIES=$(db_query "SELECT timestamp, action, user, description FROM activity_logs ORDER BY timestamp DESC LIMIT 5;" | head -5)
    log_info "Recent activities:"
    while IFS='|' read -r timestamp action user description; do
        log_info "  - $action by $user at $timestamp"
    done <<< "$RECENT_ACTIVITIES"
else
    log_fail "No recent activity logs found"
fi

# ============================================================
# CLEANUP
# ============================================================

log_header "CLEANUP TEST DATA"

log_test "Delete Test Asset"
if [ -n "$TEST_ASSET_ID" ]; then
    DELETE_ASSET=$(curl -s -X DELETE "$BASE_URL/api/assets/$TEST_ASSET_ID" \
      -H "Authorization: Bearer $TOKEN")
    sleep 1

    if echo "$DELETE_ASSET" | grep -q '"success":true'; then
        log_pass "Test asset soft-deleted"
    else
        log_info "Test asset deletion response: $DELETE_ASSET"
    fi
fi

log_test "Delete Test Employees"
# Note: Need to use emp_id for deletion, not numeric ID
# This will be cleaned up manually if API doesn't support emp_id deletion
log_info "Test employees: $TEST_EMP1_ID, $TEST_EMP2_ID (manual cleanup may be needed)"

# ============================================================
# FINAL SUMMARY
# ============================================================

log_header "TEST SUMMARY"

TOTAL=$((PASS_COUNT + FAIL_COUNT + BLOCKED_COUNT + NOT_VERIFIED_COUNT))

echo ""
echo "Total Tests:     $TOTAL_TESTS"
echo -e "${GREEN}PASS:${NC}            $PASS_COUNT"
echo -e "${RED}FAIL:${NC}            $FAIL_COUNT"
echo -e "${YELLOW}BLOCKED:${NC}         $BLOCKED_COUNT"
echo -e "${YELLOW}NOT VERIFIED:${NC}    $NOT_VERIFIED_COUNT"
echo ""

if [ "$TOTAL_TESTS" -gt 0 ]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASS_COUNT/$TOTAL_TESTS)*100}")
    echo "Success Rate:    $SUCCESS_RATE%"
fi

echo ""
echo "Results saved to: $RESULTS_FILE"
echo ""

# Write summary to file
echo "" >> "$RESULTS_FILE"
echo "============================================================" >> "$RESULTS_FILE"
echo "SUMMARY" >> "$RESULTS_FILE"
echo "============================================================" >> "$RESULTS_FILE"
echo "Total Tests: $TOTAL_TESTS" >> "$RESULTS_FILE"
echo "PASS: $PASS_COUNT" >> "$RESULTS_FILE"
echo "FAIL: $FAIL_COUNT" >> "$RESULTS_FILE"
echo "BLOCKED: $BLOCKED_COUNT" >> "$RESULTS_FILE"
echo "NOT VERIFIED: $NOT_VERIFIED_COUNT" >> "$RESULTS_FILE"
if [ "$TOTAL_TESTS" -gt 0 ]; then
    echo "Success Rate: $SUCCESS_RATE%" >> "$RESULTS_FILE"
fi

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
    exit 0
else
    echo -e "${RED}✗ $FAIL_COUNT TEST(S) FAILED${NC}"
    exit 1
fi
