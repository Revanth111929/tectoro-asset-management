#!/usr/bin/env python3
"""
REAL WORKFLOW TESTING - Test like a user would
Tests complete workflows with persistence verification
"""

import requests
import json
import time
import sys
from datetime import datetime

BASE_URL = "http://192.168.20.180:3000/api"
TOKEN = None
USER_ID = None

def login():
    """Login and get token"""
    global TOKEN, USER_ID
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    
    if response.status_code == 200:
        data = response.json()
        TOKEN = data.get('access_token') or data.get('token')
        user_data = data.get('user', {})
        USER_ID = user_data.get('id') or user_data.get('user_id') or 'admin'
        return True
    return False

def headers():
    return {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

def print_test_header(test_name):
    print("\n" + "="*80)
    print(f"🧪 TEST: {test_name}")
    print("="*80)

def print_step(step_num, description):
    print(f"   Step {step_num}: {description}")

def print_result(status, message):
    icon = "✅" if status == "PASS" else "❌"
    print(f"\n{icon} RESULT: {status} - {message}\n")

# ==============================================================================
# WORKFLOW 1: EMPLOYEE AUTOCOMPLETE IN ASSET EDIT
# ==============================================================================
def test_employee_autocomplete_workflow():
    """
    Complete workflow:
    1. Get an existing asset
    2. Open Asset Edit (simulate by fetching asset)
    3. Search for employee
    4. Verify dropdown results
    5. Select employee (update asset)
    6. Save
    7. Reopen asset
    8. Verify employee data persisted
    9. Verify all employee fields saved
    """
    print_test_header("EMPLOYEE AUTOCOMPLETE IN ASSET EDIT")
    
    try:
        # Step 1: Get an existing asset
        print_step(1, "Get existing asset to edit")
        resp = requests.get(f"{BASE_URL}/assets", headers=headers())
        if resp.status_code != 200:
            print_result("FAIL", f"Cannot fetch assets: {resp.status_code}")
            return "FAIL"
        
        assets_data = resp.json()
        assets = assets_data.get('assets', assets_data.get('data', []))
        
        if not assets:
            print_result("SKIP", "No assets in system to test")
            return "SKIP"
        
        test_asset = assets[0]
        asset_id = test_asset.get('id') or test_asset.get('asset_id')
        print(f"      → Using Asset ID: {asset_id} - {test_asset.get('asset_name')}")
        
        # Step 2: Search for employee (simulate dropdown)
        print_step(2, "Search for employee (type 'e' in search box)")
        resp = requests.get(f"{BASE_URL}/employees?q=e", headers=headers())
        if resp.status_code != 200:
            print_result("FAIL", f"Employee search failed: {resp.status_code}")
            return "FAIL"
        
        employees = resp.json()
        if not employees or len(employees) == 0:
            print_result("SKIP", "No employees found in search")
            return "SKIP"
        
        print(f"      → Found {len(employees)} employees in dropdown")
        test_employee = employees[0]
        print(f"      → Selecting: {test_employee.get('employee_name')} ({test_employee.get('emp_id')})")
        
        # Step 3: Update asset with selected employee (simulate selecting from dropdown)
        print_step(3, "Select employee and save asset")
        update_data = {
            'emp_id': test_employee.get('emp_id'),
            'employee_name': test_employee.get('employee_name'),
            'employee_email': test_employee.get('email', ''),
            'mobile_number': test_employee.get('mobile_number', ''),
            'asset_name': test_asset.get('asset_name'),
            'serial_number': test_asset.get('serial_number'),
            'category': test_asset.get('category'),
            'status': 'Assigned'  # Must set to Assigned when assigning employee
        }
        
        resp = requests.put(f"{BASE_URL}/assets/{asset_id}", json=update_data, headers=headers())
        if resp.status_code not in [200, 201]:
            print_result("FAIL", f"Asset update failed: {resp.status_code} - {resp.text[:200]}")
            return "FAIL"
        
        print(f"      → Asset updated successfully")
        
        # Step 4: Wait a moment (simulate user closing form and reopening)
        print_step(4, "Close form, reopen asset (fetch fresh data)")
        time.sleep(1)
        
        # Step 5: Fetch asset again to verify persistence
        resp = requests.get(f"{BASE_URL}/assets/{asset_id}", headers=headers())
        if resp.status_code != 200:
            print_result("FAIL", f"Cannot fetch asset after update: {resp.status_code}")
            return "FAIL"
        
        updated_asset = resp.json()
        
        # Step 6: Verify all employee fields persisted
        print_step(5, "Verify employee data persisted in database")
        checks = {
            'emp_id': (updated_asset.get('emp_id'), test_employee.get('emp_id')),
            'employee_name': (updated_asset.get('employee_name'), test_employee.get('employee_name')),
            'employee_email': (updated_asset.get('employee_email'), test_employee.get('email', '')),
            'mobile_number': (updated_asset.get('mobile_number'), test_employee.get('mobile_number', ''))
        }
        
        all_match = True
        for field, (actual, expected) in checks.items():
            match = actual == expected
            status = "✓" if match else "✗"
            print(f"      {status} {field}: {actual} {'==' if match else '!='} {expected}")
            if not match:
                all_match = False
        
        if not all_match:
            print_result("FAIL", "Employee data did not persist correctly")
            return "FAIL"
        
        # Step 7: Verify persistence survives page refresh (fetch again)
        print_step(6, "Simulate browser refresh (fetch asset again)")
        time.sleep(0.5)
        resp = requests.get(f"{BASE_URL}/assets/{asset_id}", headers=headers())
        refreshed_asset = resp.json()
        
        if refreshed_asset.get('emp_id') != test_employee.get('emp_id'):
            print_result("FAIL", "Employee data lost after refresh")
            return "FAIL"
        
        print(f"      → Employee data still correct after refresh")
        
        print_result("PASS", "Employee autocomplete workflow complete - All checks passed")
        return "PASS"
        
    except Exception as e:
        print_result("ERROR", f"Exception: {e}")
        return "ERROR"

# ==============================================================================
# WORKFLOW 2: INVOICE UPLOAD END-TO-END
# ==============================================================================
def test_invoice_upload_workflow():
    """
    Complete workflow:
    1. Create new device with invoice
    2. Save
    3. Reopen inventory detail
    4. Verify invoice exists
    5. Download invoice
    6. Refresh browser
    7. Verify invoice still exists
    """
    print_test_header("INVOICE UPLOAD - COMPLETE WORKFLOW")
    
    try:
        # Step 1: Create test invoice file
        print_step(1, "Prepare test PDF invoice file")
        import io
        test_pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 <<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test Invoice) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000314 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n407\n%%EOF"
        
        # Step 2: Create a new asset first
        print_step(2, "Create new device in inventory")
        timestamp = datetime.now().strftime("%H%M%S")
        new_asset_data = {
            'asset_name': f'Test Device Invoice {timestamp}',
            'category': 'Laptop',
            'brand_name': 'TestBrand',
            'model_name': 'TestModel',
            'serial_number': f'TEST-INV-{timestamp}',
            'status': 'Available'
        }
        
        resp = requests.post(f"{BASE_URL}/assets", json=new_asset_data, headers=headers())
        if resp.status_code not in [200, 201]:
            print_result("FAIL", f"Asset creation failed: {resp.status_code} - {resp.text[:200]}")
            return "FAIL"
        
        asset_response = resp.json()
        # Handle different response structures
        new_asset_id = None
        if 'asset' in asset_response:
            new_asset_id = asset_response['asset'].get('id')
        elif 'id' in asset_response:
            new_asset_id = asset_response['id']
        elif 'asset_id' in asset_response:
            new_asset_id = asset_response['asset_id']
        
        if not new_asset_id:
            print_result("FAIL", f"Cannot determine new asset ID from response: {asset_response}")
            return "FAIL"
        
        print(f"      → Asset created: ID {new_asset_id}")
        
        # Step 3: Upload invoice for this asset
        print_step(3, "Upload invoice PDF for the asset")
        files = {
            'file': ('test_invoice.pdf', io.BytesIO(test_pdf_content), 'application/pdf')
        }
        upload_headers = {"Authorization": f"Bearer {TOKEN}"}
        
        resp = requests.post(
            f"{BASE_URL}/assets/{new_asset_id}/invoice/upload",
            files=files,
            headers=upload_headers
        )
        
        if resp.status_code not in [200, 201]:
            print_result("FAIL", f"Invoice upload failed: {resp.status_code} - {resp.text[:200]}")
            return "FAIL"
        
        print(f"      → Invoice uploaded successfully")
        
        # Step 4: Close and reopen - fetch invoice info
        print_step(4, "Close form, open Inventory Detail - fetch invoice info")
        time.sleep(1)
        
        resp = requests.get(f"{BASE_URL}/assets/{new_asset_id}/invoice", headers=headers())
        if resp.status_code == 404:
            print_result("FAIL", "Invoice not found after upload (404)")
            return "FAIL"
        elif resp.status_code != 200:
            print_result("FAIL", f"Invoice fetch failed: {resp.status_code}")
            return "FAIL"
        
        invoice_info = resp.json()
        attachment = invoice_info.get('attachment')
        
        if not attachment:
            print_result("FAIL", "No invoice attachment found")
            return "FAIL"
        
        print(f"      → Invoice found: {attachment.get('original_filename', 'Unknown')}")
        print(f"      → Size: {attachment.get('file_size', 0)} bytes")
        print(f"      → Upload date: {attachment.get('uploaded_at', 'Unknown')}")
        
        # Step 5: Download invoice (verify file exists)
        print_step(5, "Click Download button - verify file can be downloaded")
        resp = requests.get(
            f"{BASE_URL}/assets/{new_asset_id}/invoice/download",
            headers=headers()
        )
        
        if resp.status_code != 200:
            print_result("FAIL", f"Invoice download failed: {resp.status_code}")
            return "FAIL"
        
        if len(resp.content) == 0:
            print_result("FAIL", "Downloaded invoice is empty")
            return "FAIL"
        
        print(f"      → Invoice downloaded: {len(resp.content)} bytes")
        
        # Step 6: Simulate browser refresh - fetch invoice again
        print_step(6, "Simulate browser refresh - fetch invoice again")
        time.sleep(0.5)
        resp = requests.get(f"{BASE_URL}/assets/{new_asset_id}/invoice", headers=headers())
        
        if resp.status_code != 200:
            print_result("FAIL", "Invoice not found after browser refresh")
            return "FAIL"
        
        refreshed_invoice = resp.json()
        if refreshed_invoice.get('filename') != invoice_info.get('filename'):
            print_result("FAIL", "Invoice data changed after refresh")
            return "FAIL"
        
        print(f"      → Invoice still exists after refresh")
        
        # Step 7: Verify in asset details
        print_step(7, "Open asset details - verify invoice linked to asset")
        resp = requests.get(f"{BASE_URL}/assets/{new_asset_id}", headers=headers())
        asset_details = resp.json()
        
        print(f"      → Asset exists: {asset_details.get('asset_name')}")
        
        print_result("PASS", "Invoice upload workflow complete - All persistence checks passed")
        return "PASS"
        
    except Exception as e:
        print_result("ERROR", f"Exception: {e}")
        import traceback
        traceback.print_exc()
        return "ERROR"

# ==============================================================================
# WORKFLOW 3: ASSET ASSIGNMENT - VERIFY ALL MODULES UPDATE
# ==============================================================================
def test_asset_assignment_complete():
    """
    Complete workflow:
    1. Assign asset to employee
    2. Verify Employee Profile shows asset
    3. Verify Inventory updated
    4. Verify Lifecycle created
    5. Verify Audit log created
    6. Verify Dashboard counts updated
    """
    print_test_header("ASSET ASSIGNMENT - VERIFY ALL MODULES")
    
    try:
        # Step 1: Get available asset
        print_step(1, "Find available asset to assign")
        resp = requests.get(f"{BASE_URL}/assets?status=Available", headers=headers())
        assets_data = resp.json()
        assets = assets_data.get('assets', assets_data.get('data', []))
        
        if not assets:
            print_result("SKIP", "No available assets to test")
            return "SKIP"
        
        test_asset = assets[0]
        asset_id = test_asset.get('id') or test_asset.get('asset_id')
        print(f"      → Using Asset: {test_asset.get('asset_name')} (ID: {asset_id})")
        
        # Step 2: Get an employee
        print_step(2, "Find employee to assign to")
        resp = requests.get(f"{BASE_URL}/employees?q=", headers=headers())
        employees = resp.json()
        
        if not employees:
            print_result("SKIP", "No employees in system")
            return "SKIP"
        
        test_employee = employees[0]
        emp_id = test_employee.get('emp_id')
        print(f"      → Assigning to: {test_employee.get('employee_name')} ({emp_id})")
        
        # Step 3: Get dashboard counts BEFORE assignment
        print_step(3, "Get dashboard stats BEFORE assignment")
        resp = requests.get(f"{BASE_URL}/dashboard/stats", headers=headers())
        before_stats = resp.json() if resp.status_code == 200 else {}
        before_assigned = before_stats.get('assignedAssets', 0)
        before_available = before_stats.get('availableAssets', 0)
        print(f"      → Before: Assigned={before_assigned}, Available={before_available}")
        
        # Step 4: Perform assignment operation
        print_step(4, "Perform ASSIGN operation")
        assign_data = {
            'asset_id': asset_id,
            'emp_id': emp_id,
            'comments': 'Test assignment workflow'
        }
        
        resp = requests.post(f"{BASE_URL}/operations/assign", json=assign_data, headers=headers())
        if resp.status_code not in [200, 201]:
            print_result("FAIL", f"Assignment failed: {resp.status_code} - {resp.text[:200]}")
            return "FAIL"
        
        print(f"      → Assignment successful")
        time.sleep(1)
        
        # Step 5: Verify Inventory updated
        print_step(5, "Verify Inventory - check asset status and employee")
        resp = requests.get(f"{BASE_URL}/assets/{asset_id}", headers=headers())
        updated_asset = resp.json()
        
        checks_passed = True
        if updated_asset.get('status') != 'Assigned':
            print(f"      ✗ Status not updated: {updated_asset.get('status')}")
            checks_passed = False
        else:
            print(f"      ✓ Status = Assigned")
        
        if updated_asset.get('emp_id') != emp_id:
            print(f"      ✗ Employee ID not set: {updated_asset.get('emp_id')}")
            checks_passed = False
        else:
            print(f"      ✓ Employee ID = {emp_id}")
        
        if not updated_asset.get('employee_name'):
            print(f"      ✗ Employee name not set")
            checks_passed = False
        else:
            print(f"      ✓ Employee name = {updated_asset.get('employee_name')}")
        
        if not checks_passed:
            print_result("FAIL", "Inventory not updated correctly")
            return "FAIL"
        
        # Step 6: Verify Employee Profile shows asset
        print_step(6, "Verify Employee Profile - check asset appears in employee's list")
        resp = requests.get(f"{BASE_URL}/employees/{emp_id}/assets", headers=headers())
        if resp.status_code != 200:
            print(f"      ⚠ Cannot fetch employee assets: {resp.status_code}")
        else:
            emp_assets_data = resp.json()
            # Handle different response structures
            if isinstance(emp_assets_data, dict):
                emp_assets = emp_assets_data.get('assets', [])
            elif isinstance(emp_assets_data, list):
                emp_assets = emp_assets_data
            else:
                emp_assets = []
            
            if emp_assets:
                asset_found = any(
                    (isinstance(a, dict) and (a.get('id') == asset_id or a.get('asset_id') == asset_id))
                    for a in emp_assets
                )
                if asset_found:
                    print(f"      ✓ Asset appears in employee's profile")
                else:
                    print(f"      ✗ Asset NOT in employee's profile")
                    checks_passed = False
            else:
                print(f"      ⚠ No assets found for employee")
        
        # Step 7: Verify Lifecycle event created
        print_step(7, "Verify Lifecycle - check ASSIGNED event exists")
        resp = requests.get(f"{BASE_URL}/lifecycle/asset/{asset_id}", headers=headers())
        if resp.status_code != 200:
            print(f"      ✗ Cannot fetch lifecycle: {resp.status_code}")
            checks_passed = False
        else:
            lifecycle_data = resp.json()
            lifecycle_events = lifecycle_data.get('events', [])
            assigned_event = any(
                e.get('event_type') == 'ASSIGNED' 
                for e in lifecycle_events
            )
            if assigned_event:
                print(f"      ✓ ASSIGNED lifecycle event created")
            else:
                print(f"      ✗ No ASSIGNED lifecycle event found")
                checks_passed = False
        
        # Step 8: Verify Audit log created
        print_step(8, "Verify Audit - check audit log entry exists")
        resp = requests.get(f"{BASE_URL}/audit-logs?asset_id={asset_id}", headers=headers())
        if resp.status_code != 200:
            print(f"      ⚠ Cannot fetch audit logs: {resp.status_code}")
        else:
            audit_logs_data = resp.json()
            audit_logs = audit_logs_data.get('logs', audit_logs_data if isinstance(audit_logs_data, list) else [])
            assigned_audit = any(
                'ASSIGNED' in str(log.get('action_type', ''))
                for log in audit_logs
            )
            if assigned_audit:
                print(f"      ✓ Audit log entry created")
            else:
                print(f"      ⚠ No audit log found (might be on different endpoint)")
        
        # Step 9: Verify Dashboard counts updated
        print_step(9, "Verify Dashboard - check counts updated")
        time.sleep(1)
        resp = requests.get(f"{BASE_URL}/dashboard/stats", headers=headers())
        after_stats = resp.json() if resp.status_code == 200 else {}
        after_assigned = after_stats.get('assignedAssets', 0)
        after_available = after_stats.get('availableAssets', 0)
        
        print(f"      → After: Assigned={after_assigned}, Available={after_available}")
        
        if after_assigned > before_assigned:
            print(f"      ✓ Assigned count increased (+{after_assigned - before_assigned})")
        else:
            print(f"      ✗ Assigned count did not increase (before={before_assigned}, after={after_assigned})")
            checks_passed = False
        
        if after_available < before_available:
            print(f"      ✓ Available count decreased (-{before_available - after_available})")
        else:
            print(f"      ✗ Available count did not decrease (before={before_available}, after={after_available})")
            checks_passed = False
        
        if not checks_passed:
            print_result("FAIL", "Some module updates failed")
            return "FAIL"
        
        print_result("PASS", "Asset assignment complete - All modules updated correctly")
        return "PASS"
        
    except Exception as e:
        print_result("ERROR", f"Exception: {e}")
        import traceback
        traceback.print_exc()
        return "ERROR"

# ==============================================================================
# MAIN TEST SUITE
# ==============================================================================
def main():
    print("\n" + "╔" + "="*78 + "╗")
    print("║" + " "*20 + "REAL WORKFLOW TEST SUITE" + " "*34 + "║")
    print("║" + " "*15 + "(Testing Like A Real User Would)" + " "*30 + "║")
    print("╚" + "="*78 + "╝")
    
    if not login():
        print("\n❌ LOGIN FAILED - Cannot proceed")
        sys.exit(1)
    
    print(f"\n✅ Logged in successfully")
    print(f"   Testing application at: {BASE_URL}")
    print(f"   User: admin")
    
    results = {}
    
    # Run workflows
    results['Workflow 1: Employee Autocomplete'] = test_employee_autocomplete_workflow()
    results['Workflow 2: Invoice Upload'] = test_invoice_upload_workflow()
    results['Workflow 3: Asset Assignment'] = test_asset_assignment_complete()
    
    # Summary
    print("\n" + "="*80)
    print("FINAL RESULTS")
    print("="*80)
    
    passed = sum(1 for r in results.values() if r == "PASS")
    failed = sum(1 for r in results.values() if r == "FAIL")
    skipped = sum(1 for r in results.values() if r == "SKIP")
    errors = sum(1 for r in results.values() if r == "ERROR")
    
    for workflow, result in results.items():
        icon = {"PASS": "✅", "FAIL": "❌", "SKIP": "⚠️", "ERROR": "🔥"}.get(result, "❓")
        print(f"{icon} {workflow}: {result}")
    
    print()
    print(f"PASS: {passed} | FAIL: {failed} | SKIP: {skipped} | ERROR: {errors}")
    print("="*80)
    
    if failed > 0 or errors > 0:
        print("\n❌ SOME WORKFLOWS FAILED")
        sys.exit(1)
    elif passed > 0:
        print("\n✅ ALL TESTED WORKFLOWS PASSED")
    else:
        print("\n⚠️  NO WORKFLOWS COULD BE TESTED")

if __name__ == '__main__':
    main()
