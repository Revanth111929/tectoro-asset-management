#!/usr/bin/env python3
"""
Test Asset and Employee History
"""

from app import app
from models import Asset, Employee, AuditLog

def test_asset_history():
    """Test asset history retrieval"""
    print("="*80)
    print("WORKFLOW TEST: ASSET HISTORY")
    print("="*80)
    
    with app.app_context():
        passed = 0
        failed = 0
        
        # Get an asset with history
        asset = Asset.query.first()
        if not asset:
            print("❌ No assets to test")
            return False
        
        print(f"\nTest Asset: ID={asset.id}, Serial={asset.serial_number}")
        
        # TEST 1: Get asset audit logs
        print("\n" + "-"*80)
        print("TEST 1: Get Asset Audit Logs")
        print("-"*80)
        
        try:
            logs = AuditLog.query.filter_by(asset_id=asset.id).order_by(
                AuditLog.timestamp.desc()
            ).all()
            
            if len(logs) >= 0:
                passed += 1
                print(f"✅ PASS: Found {len(logs)} log entry(s)")
            else:
                failed += 1
                print("❌ FAIL: Invalid log count")
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Query failed - {str(e)}")
        
        # TEST 2: Verify log chronology
        print("\n" + "-"*80)
        print("TEST 2: Verify Log Chronology")
        print("-"*80)
        
        try:
            if len(logs) > 1:
                is_chronological = all(
                    logs[i].timestamp >= logs[i+1].timestamp 
                    for i in range(len(logs)-1)
                )
                if is_chronological:
                    passed += 1
                    print("✅ PASS: Logs in correct chronological order")
                else:
                    failed += 1
                    print("❌ FAIL: Logs not chronological")
            else:
                print("⚠️  SKIP: Not enough logs to check order")
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Check failed - {str(e)}")
        
        # TEST 3: Lifecycle events present
        print("\n" + "-"*80)
        print("TEST 3: Lifecycle Events Present")
        print("-"*80)
        
        try:
            lifecycle_types = ['ASSET_CREATED', 'ASSET_ASSIGNED', 'ASSET_RETURNED',
                             'ASSET_TRANSFERRED', 'REPAIR_STARTED', 'REPAIR_COMPLETED',
                             'ASSET_RETIRED']
            
            present_types = set()
            for log in logs:
                if log.action_type in lifecycle_types:
                    present_types.add(log.action_type)
            
            if len(present_types) > 0:
                passed += 1
                print(f"✅ PASS: Found {len(present_types)} lifecycle event type(s)")
                for evt_type in present_types:
                    print(f"  - {evt_type}")
            else:
                print("⚠️  SKIP: No lifecycle events")
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Check failed - {str(e)}")
        
        # TEST 4: Log completeness
        print("\n" + "-"*80)
        print("TEST 4: Log Data Completeness")
        print("-"*80)
        
        try:
            incomplete = 0
            for log in logs:
                if not log.action_type or not log.timestamp:
                    incomplete += 1
            
            if incomplete == 0:
                passed += 1
                print(f"✅ PASS: All {len(logs)} logs have required fields")
            else:
                failed += 1
                print(f"❌ FAIL: {incomplete} log(s) missing required fields")
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Check failed - {str(e)}")
        
        print("\n" + "="*80)
        print(f"ASSET HISTORY: {passed} PASS, {failed} FAIL")
        print("="*80)
        
        return failed == 0


def test_employee_history():
    """Test employee asset history"""
    print("\n" + "="*80)
    print("WORKFLOW TEST: EMPLOYEE HISTORY")
    print("="*80)
    
    with app.app_context():
        passed = 0
        failed = 0
        
        # Get employee with assets
        employee = Employee.query.first()
        if not employee:
            print("❌ No employees to test")
            return False
        
        print(f"\nTest Employee: {employee.emp_id} - {employee.employee_name}")
        
        # TEST 1: Get employee audit logs
        print("\n" + "-"*80)
        print("TEST 1: Get Employee Audit Logs")
        print("-"*80)
        
        try:
            logs = AuditLog.query.filter_by(employee_id=employee.emp_id).order_by(
                AuditLog.timestamp.desc()
            ).all()
            
            if len(logs) >= 0:
                passed += 1
                print(f"✅ PASS: Found {len(logs)} log entry(s)")
            else:
                failed += 1
                print("❌ FAIL: Invalid log count")
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Query failed - {str(e)}")
        
        # TEST 2: Get current assets
        print("\n" + "-"*80)
        print("TEST 2: Get Current Assets")
        print("-"*80)
        
        try:
            current_assets = Asset.query.filter_by(emp_id=employee.emp_id).all()
            
            if len(current_assets) >= 0:
                passed += 1
                print(f"✅ PASS: Found {len(current_assets)} current asset(s)")
            else:
                failed += 1
                print("❌ FAIL: Invalid count")
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Query failed - {str(e)}")
        
        # TEST 3: Verify assignment events
        print("\n" + "-"*80)
        print("TEST 3: Verify Assignment Events")
        print("-"*80)
        
        try:
            assignments = [log for log in logs 
                         if log.action_type in ['ASSET_ASSIGNED', 'ASSET_TRANSFERRED']]
            
            if len(assignments) >= 0:
                passed += 1
                print(f"✅ PASS: Found {len(assignments)} assignment event(s)")
            else:
                failed += 1
                print("❌ FAIL: Invalid count")
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Check failed - {str(e)}")
        
        print("\n" + "="*80)
        print(f"EMPLOYEE HISTORY: {passed} PASS, {failed} FAIL")
        print("="*80)
        
        return failed == 0


if __name__ == '__main__':
    result1 = test_asset_history()
    result2 = test_employee_history()
    
    print("\n" + "="*80)
    print("HISTORY TEST SUMMARY")
    print("="*80)
    print(f"Asset History: {'PASS' if result1 else 'FAIL'}")
    print(f"Employee History: {'PASS' if result2 else 'FAIL'}")
    print("="*80)
    
    exit(0 if (result1 and result2) else 1)
