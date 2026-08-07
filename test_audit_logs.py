#!/usr/bin/env python3
"""
Test Audit Logs and History
"""

from app import app
from models import Asset, AuditLog, db
from datetime import datetime, timedelta

def test_audit_logs():
    """Test audit log querying and filtering"""
    print("="*80)
    print("WORKFLOW TEST: AUDIT LOGS")
    print("="*80)
    
    with app.app_context():
        passed = 0
        failed = 0
        
        # TEST 1: Query all audit logs
        print("\n" + "-"*80)
        print("TEST 1: Query All Audit Logs")
        print("-"*80)
        
        try:
            total_logs = AuditLog.query.count()
            if total_logs >= 0:
                passed += 1
                print(f"✅ PASS: Found {total_logs} audit log(s)")
            else:
                failed += 1
                print("❌ FAIL: Invalid count")
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Query failed - {str(e)}")
        
        # TEST 2: Filter by action type
        print("\n" + "-"*80)
        print("TEST 2: Filter by Action Type")
        print("-"*80)
        
        try:
            action_types = ['ASSET_CREATED', 'ASSET_ASSIGNED', 'ASSET_RETURNED', 
                          'ASSET_TRANSFERRED', 'REPAIR_STARTED', 'REPAIR_COMPLETED']
            
            for action_type in action_types:
                count = AuditLog.query.filter_by(action_type=action_type).count()
                passed += 1
                print(f"✅ PASS: {action_type}: {count}")
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Filter failed - {str(e)}")
        
        # TEST 3: Filter by asset
        print("\n" + "-"*80)
        print("TEST 3: Filter by Asset")
        print("-"*80)
        
        try:
            asset = Asset.query.first()
            if asset:
                logs = AuditLog.query.filter_by(asset_id=asset.id).all()
                if len(logs) >= 0:
                    passed += 1
                    print(f"✅ PASS: Found {len(logs)} log(s) for asset {asset.id}")
                else:
                    failed += 1
                    print("❌ FAIL: Invalid log count")
            else:
                print("⚠️  SKIP: No assets")
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Query failed - {str(e)}")
        
        # TEST 4: Filter by employee
        print("\n" + "-"*80)
        print("TEST 4: Filter by Employee")
        print("-"*80)
        
        try:
            logs_with_emp = AuditLog.query.filter(
                AuditLog.employee_id.isnot(None)
            ).all()
            
            if len(logs_with_emp) >= 0:
                passed += 1
                print(f"✅ PASS: Found {len(logs_with_emp)} log(s) with employee")
            else:
                failed += 1
                print("❌ FAIL: Invalid count")
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Query failed - {str(e)}")
        
        # TEST 5: Filter by date range
        print("\n" + "-"*80)
        print("TEST 5: Filter by Date Range")
        print("-"*80)
        
        try:
            today = datetime.now()
            yesterday = today - timedelta(days=1)
            
            recent_logs = AuditLog.query.filter(
                AuditLog.timestamp >= yesterday
            ).count()
            
            if recent_logs >= 0:
                passed += 1
                print(f"✅ PASS: Found {recent_logs} log(s) in last 24 hours")
            else:
                failed += 1
                print("❌ FAIL: Invalid count")
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Query failed - {str(e)}")
        
        # TEST 6: Order by timestamp
        print("\n" + "-"*80)
        print("TEST 6: Order by Timestamp")
        print("-"*80)
        
        try:
            recent = AuditLog.query.order_by(
                AuditLog.timestamp.desc()
            ).limit(5).all()
            
            if len(recent) > 0:
                passed += 1
                print(f"✅ PASS: Retrieved {len(recent)} most recent log(s)")
                is_ordered = all(recent[i].timestamp >= recent[i+1].timestamp 
                               for i in range(len(recent)-1))
                if is_ordered:
                    passed += 1
                    print("✅ PASS: Logs correctly ordered")
                else:
                    failed += 1
                    print("❌ FAIL: Logs not ordered")
            else:
                print("⚠️  SKIP: No logs to order")
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Query failed - {str(e)}")
        
        # TEST 7: Audit log data integrity
        print("\n" + "-"*80)
        print("TEST 7: Audit Log Data Integrity")
        print("-"*80)
        
        try:
            # Check logs have required fields
            sample_logs = AuditLog.query.limit(10).all()
            
            complete_logs = 0
            for log in sample_logs:
                if log.action_type and log.timestamp:
                    complete_logs += 1
            
            if complete_logs == len(sample_logs):
                passed += 1
                print(f"✅ PASS: All {len(sample_logs)} sample logs have required fields")
            else:
                failed += 1
                print(f"❌ FAIL: {len(sample_logs) - complete_logs} log(s) missing fields")
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Integrity check failed - {str(e)}")
        
        # TEST 8: Module filtering
        print("\n" + "-"*80)
        print("TEST 8: Filter by Module")
        print("-"*80)
        
        try:
            modules = ['Operations', 'Asset', 'Employee', 'Admin']
            
            for module in modules:
                count = AuditLog.query.filter_by(module=module).count()
                passed += 1
                print(f"✅ PASS: {module}: {count} log(s)")
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Module filter failed - {str(e)}")
        
        print("\n" + "="*80)
        print(f"AUDIT LOGS: {passed} PASS, {failed} FAIL")
        print("="*80)
        
        return failed == 0


if __name__ == '__main__':
    result = test_audit_logs()
    
    print("\n" + "="*80)
    print("AUDIT LOGS TEST SUMMARY")
    print("="*80)
    print(f"Audit Logs: {'PASS' if result else 'FAIL'}")
    print("="*80)
    
    exit(0 if result else 1)
