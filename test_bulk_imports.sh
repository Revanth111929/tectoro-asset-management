#!/bin/bash
# ============================================================
# BULK IMPORT TESTING - Employee and Asset
# ============================================================

set -e

BASE_URL="http://localhost:3000"
DB_PATH="databases/local_assets.db"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_pass() { echo -e "${GREEN}✓ PASS${NC}: $1"; }
log_fail() { echo -e "${RED}✗ FAIL${NC}: $1"; }
log_info() { echo -e "  ℹ $1"; }
log_header() { echo -e "\n${YELLOW}$1${NC}"; }

db_count() { sqlite3 "$DB_PATH" "$1" 2>/dev/null || echo "0"; }

log_header "============================================================"
log_header "PHASE 2F: EMPLOYEE BULK IMPORT TEST"
log_header "============================================================"

# Login
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

if [ -z "$TOKEN" ]; then
    log_fail "Cannot obtain auth token"
    exit 1
fi

log_info "Auth token obtained"

# Backup database first
log_info "Creating database backup..."
cp "$DB_PATH" "${DB_PATH}.backup_$(date +%Y%m%d_%H%M%S)"

# Get baseline employee count
BEFORE_COUNT=$(db_count "SELECT COUNT(*) FROM employees;")
log_info "Current employee count: $BEFORE_COUNT"

# Test with actual file
EMPLOYEE_FILE="employee Bulk Upload.xlsx"

if [ ! -f "$EMPLOYEE_FILE" ]; then
    log_fail "Employee bulk upload file not found: $EMPLOYEE_FILE"
    exit 1
fi

log_info "Testing file: $EMPLOYEE_FILE"

# Analyze file first
log_info "File analysis:"
python3 << 'PYEOF'
import openpyxl
wb = openpyxl.load_workbook("employee Bulk Upload.xlsx", data_only=True)
ws = wb.active
print(f"  - Total rows: {ws.max_row - 1}")
emp_ids = set()
for row in range(2, ws.max_row + 1):
    emp_id = ws.cell(row, 1).value
    if emp_id:
        emp_ids.add(str(emp_id).strip())
print(f"  - Unique emp_id values: {len(emp_ids)}")
wb.close()
PYEOF

# Upload file
log_info "Uploading file to API..."

IMPORT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/employees/bulk-import" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@${EMPLOYEE_FILE}")

# Check response
if echo "$IMPORT_RESPONSE" | grep -q '"success":true'; then
    log_pass "Import API returned success"

    # Extract counts from response
    IMPORTED=$(echo "$IMPORT_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('results', {}).get('imported', 0))" 2>/dev/null || echo "0")
    UPDATED=$(echo "$IMPORT_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('results', {}).get('updated', 0))" 2>/dev/null || echo "0")
    FAILED=$(echo "$IMPORT_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('results', {}).get('failed', 0))" 2>/dev/null || echo "0")

    log_info "Import results: Imported=$IMPORTED, Updated=$UPDATED, Failed=$FAILED"

    # Check for name conflicts
    CONFLICTS=$(echo "$IMPORT_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(len(d.get('results', {}).get('name_conflicts', [])))" 2>/dev/null || echo "0")

    if [ "$CONFLICTS" -gt 0 ]; then
        log_info "Name conflicts detected: $CONFLICTS"
        echo "$IMPORT_RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for conflict in d.get('results', {}).get('name_conflicts', [])[:5]:
    print(f\"  - {conflict.get('emp_id')}: {conflict.get('conflicting_names')}\")
" 2>/dev/null
    fi

    # Verify database
    sleep 2
    AFTER_COUNT=$(db_count "SELECT COUNT(*) FROM employees;")
    log_info "Employee count after import: $AFTER_COUNT"

    # Check for duplicate emp_id in database
    DUPLICATES=$(db_count "SELECT COUNT(*) FROM (SELECT emp_id FROM employees GROUP BY emp_id HAVING COUNT(*) > 1);")

    if [ "$DUPLICATES" = "0" ]; then
        log_pass "Database: No duplicate emp_id records"
    else
        log_fail "Database: Found $DUPLICATES duplicate emp_id values"
        log_info "Duplicate emp_ids:"
        sqlite3 "$DB_PATH" "SELECT emp_id, COUNT(*) as count FROM employees GROUP BY emp_id HAVING count > 1 LIMIT 5;" 2>/dev/null
    fi

    # Check specific known IDs
    log_info "Checking specific emp_ids:"
    for emp_id in TT694 TT341 TT407; do
        COUNT=$(db_count "SELECT COUNT(*) FROM employees WHERE emp_id='$emp_id';")
        if [ "$COUNT" = "1" ]; then
            log_pass "  - $emp_id: Exactly 1 record"
        elif [ "$COUNT" = "0" ]; then
            log_info "  - $emp_id: Not found (may not be in file)"
        else
            log_fail "  - $emp_id: Found $COUNT records (should be 1)"
        fi
    done

else
    log_fail "Import API failed"
    log_info "Response: ${IMPORT_RESPONSE:0:500}"
fi

log_header "\n============================================================"
log_header "PHASE 2G: ASSET BULK IMPORT TEST"
log_header "============================================================"

ASSET_FILE="Asset_Import.xlsx"

if [ ! -f "$ASSET_FILE" ]; then
    log_fail "Asset bulk import file not found: $ASSET_FILE"
    log_info "Skipping asset import test"
else
    log_info "Testing file: $ASSET_FILE"

    # Analyze file
    python3 << 'PYEOF'
import openpyxl
try:
    wb = openpyxl.load_workbook("Asset_Import.xlsx", data_only=True)
    ws = wb.active
    headers = [cell.value for cell in ws[1]]
    print(f"  - Columns: {len(headers)}")
    print(f"  - Total rows: {ws.max_row - 1}")

    # Find CATEGORY and SERIAL NUMBER columns
    cat_col = None
    serial_col = None
    emp_col = None
    for idx, header in enumerate(headers, 1):
        if header and 'CATEGORY' in str(header).upper():
            cat_col = idx
        if header and 'SERIAL' in str(header).upper():
            serial_col = idx
        if header and 'EMP' in str(header).upper() and 'ID' in str(header).upper():
            emp_col = idx

    if cat_col:
        categories = {}
        serials = {}
        for row in range(2, ws.max_row + 1):
            cat = ws.cell(row, cat_col).value
            if cat:
                categories[str(cat)] = categories.get(str(cat), 0) + 1

            if serial_col:
                serial = ws.cell(row, serial_col).value
                emp_id = ws.cell(row, emp_col).value if emp_col else None
                if serial:
                    serial_str = str(serial).strip()
                    if serial_str not in serials:
                        serials[serial_str] = []
                    serials[serial_str].append(str(emp_id) if emp_id else 'None')

        print(f"  - Categories: {dict(categories)}")

        # Check for duplicate serials with different employees
        conflicts = {k: v for k, v in serials.items() if len(set(v)) > 1}
        duplicates = {k: v for k, v in serials.items() if len(v) > 1 and len(set(v)) == 1}

        print(f"  - Duplicate serials (conflict): {len(conflicts)}")
        print(f"  - Duplicate serials (same emp): {len(duplicates)}")

        if conflicts:
            print(f"\n  Sample conflicts:")
            for serial, emps in list(conflicts.items())[:5]:
                print(f"    {serial}: {set(emps)}")

    wb.close()
except Exception as e:
    print(f"  Error analyzing file: {e}")
PYEOF

    log_info "\nAttempting asset import..."
    log_info "NOTE: This may take a while for large files"

    # Check if there's a unified import endpoint
    ASSET_IMPORT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/assets/import/unified" \
      -H "Authorization: Bearer $TOKEN" \
      -F "file=@${ASSET_FILE}" \
      --max-time 120)

    if echo "$ASSET_IMPORT_RESPONSE" | grep -q '"success":true'; then
        log_pass "Asset import API returned success"

        IMPORTED=$(echo "$ASSET_IMPORT_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('imported', 0))" 2>/dev/null || echo "0")
        FAILED=$(echo "$ASSET_IMPORT_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('failed', 0))" 2>/dev/null || echo "0")

        log_info "Import results: Imported=$IMPORTED, Failed=$FAILED"

        # Verify database
        sleep 2
        ASSET_COUNT=$(db_count "SELECT COUNT(*) FROM assets WHERE is_deleted=0;")
        log_info "Active asset count after import: $ASSET_COUNT"

        if [ "$ASSET_COUNT" -gt 0 ]; then
            log_pass "Assets imported into database"

            # Check for duplicate serial conflicts
            DUP_SERIALS=$(db_count "SELECT COUNT(*) FROM (SELECT serial_number FROM assets WHERE is_deleted=0 GROUP BY serial_number HAVING COUNT(*) > 1);")
            if [ "$DUP_SERIALS" = "0" ]; then
                log_pass "No duplicate serial numbers"
            else
                log_fail "Found $DUP_SERIALS duplicate serial numbers"
            fi
        else
            log_info "No assets imported (may have validation errors)"
        fi
    else
        log_fail "Asset import API failed or endpoint not found"
        log_info "Response: ${ASSET_IMPORT_RESPONSE:0:300}"
    fi
fi

log_header "\n============================================================"
log_header "TEST COMPLETE"
log_header "============================================================"

echo ""
echo "Database backups created in databases/"
echo "Review import results above"
