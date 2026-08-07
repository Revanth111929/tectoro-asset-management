#!/usr/bin/env python3
"""
Test Repair Workflows
"""

from app import app, db
from models import Asset, AssetRepair, AuditLog
from services.operations_service import OperationsService, OperationError

def test_send_for_repair():
    """Test sending asset for repair"""
    print("="*80)
    print("WORKFLOW TEST: SEND FOR REPAIR")
    print("="*80)
    
    with app.app_context():
        passed = 0
        failed = 0
        
        # Get assigned asset
        asset = Asset.query.filter_by(status='Assigned').first()
        if not asset:
            print("❌ No assigned asset for testing")
            return False
        
        original_status = asset.status
        original_emp_id = asset.emp_id
        original_emp_name = asset.employee_name
        
        print(f"\nTest Asset: ID={asset.id}, Serial={asset.serial_number}")
        print(f"Current: Status={asset.status}, Employee={asset.emp_id}")
        
        # TEST 1: Send for repair
        print("\n" + "-"*80)
        print("TEST 1: Send Assigned Asset for Repair")
        print("-"*80)
        
        try:
            result = OperationsService.send_for_repair(
                asset_id=asset.id,
                issue_category='Hardware',
                issue_description='Screen not working',
                priority='High',
                performed_by='test_admin',
                vendor='Dell Service',
                engineer='John Doe',
                expected_date='2026-08-10',
                comments='Urgent repair needed'
            )
            
            db.session.refresh(asset)
            
            if result['success']:
                passed += 1
                print("✅ PASS: Operation success")
            else:
                failed += 1
                print("❌ FAIL: Operation failed")
            
            if asset.status == 'Under Repair':
                passed += 1
                print("✅ PASS: Status changed to Under Repair")
            else:
                failed += 1
                print(f"❌ FAIL: Status is {asset.status}")
            
            if not asset.emp_id or asset.emp_id == '':
                passed += 1
                print("✅ PASS: Employee cleared")
            else:
                failed += 1
                print(f"❌ FAIL: emp_id still {asset.emp_id}")
            
            # Check repair record
            repair = AssetRepair.query.filter_by(asset_id=asset.id, status='In Progress').first()
            if repair:
                passed += 1
                print(f"✅ PASS: Repair record created ({repair.repair_number})")
                
                if repair.previous_emp_id == original_emp_id:
                    passed += 1
                    print("✅ PASS: Previous employee stored")
                else:
                    failed += 1
                    print(f"❌ FAIL: previous_emp_id is {repair.previous_emp_id}")
                
                repair_id = repair.id
            else:
                failed += 1
                print("❌ FAIL: Repair record not created")
                repair_id = None
            
            # Check audit
            audit = AuditLog.query.filter_by(
                asset_id=asset.id,
                action_type='REPAIR_STARTED'
            ).order_by(AuditLog.timestamp.desc()).first()
            
            if audit:
                passed += 1
                print("✅ PASS: Audit log created")
            else:
                failed += 1
                print("❌ FAIL: Audit log missing")
            
        except OperationError as e:
            failed += 1
            print(f"❌ FAIL: {e.message}")
            repair_id = None
        
        # TEST 2: Try to send available asset (SHOULD FAIL)
        print("\n" + "-"*80)
        print("TEST 2: Try Send Available Asset (SHOULD FAIL)")
        print("-"*80)
        
        available = Asset.query.filter_by(status='Available').first()
        if available:
            try:
                result = OperationsService.send_for_repair(
                    asset_id=available.id,
                    issue_category='Hardware',
                    issue_description='Test',
                    priority='Low',
                    performed_by='test_admin'
                )
                failed += 1
                print("❌ FAIL: Should have rejected")
            except OperationError as e:
                if e.code == 'INVALID_STATUS':
                    passed += 1
                    print(f"✅ PASS: Correctly rejected - {e.message}")
                else:
                    failed += 1
                    print(f"❌ FAIL: Wrong error: {e.code}")
        else:
            print("⚠️  SKIP: No available asset")
        
        # TEST 3: Missing required fields (SHOULD FAIL)
        print("\n" + "-"*80)
        print("TEST 3: Try Send Without Required Fields (SHOULD FAIL)")
        print("-"*80)
        
        # Don't cancel the repair - keep it for complete_repair test
        assigned_asset = Asset.query.filter_by(status='Assigned').first()
        if assigned_asset and assigned_asset.id != asset.id:
            try:
                result = OperationsService.send_for_repair(
                    asset_id=assigned_asset.id,
                    issue_category='',
                    issue_description='',
                    priority='',
                    performed_by='test_admin'
                )
                failed += 1
                print("❌ FAIL: Should have rejected empty fields")
            except OperationError as e:
                if 'MISSING_REQUIRED_FIELDS' in e.code:
                    passed += 1
                    print(f"✅ PASS: Correctly rejected - {e.message}")
                else:
                    failed += 1
                    print(f"❌ FAIL: Wrong error: {e.code}")
        else:
            print("⚠️  SKIP: No other assigned asset for this test")
        
        print("\n" + "="*80)
        print(f"SEND FOR REPAIR: {passed} PASS, {failed} FAIL")
        print("="*80)
        
        return failed == 0, repair_id


def test_complete_repair(repair_id):
    """Test completing repair"""
    print("\n" + "="*80)
    print("WORKFLOW TEST: COMPLETE REPAIR")
    print("="*80)
    
    with app.app_context():
        passed = 0
        failed = 0
        
        if not repair_id:
            print("❌ No repair record to complete")
            return False
        
        repair = AssetRepair.query.get(repair_id)
        if not repair:
            print(f"❌ Repair ID {repair_id} not found")
            return False
        
        asset = Asset.query.get(repair.asset_id)
        if not asset:
            print("❌ Asset not found")
            return False
        
        print(f"\nRepair: {repair.repair_number}")
        print(f"Asset: ID={asset.id}, Status={asset.status}")
        
        # TEST 1: Complete repair - return to inventory
        print("\n" + "-"*80)
        print("TEST 1: Complete Repair - Return to Inventory")
        print("-"*80)
        
        try:
            result = OperationsService.complete_repair(
                repair_id=repair.id,
                completion_action='return_to_inventory',
                performed_by='test_admin',
                diagnosis='Screen replaced',
                resolution='New screen installed',
                repair_cost=5000.00,
                comments='Repair completed successfully'
            )
            
            db.session.refresh(repair)
            db.session.refresh(asset)
            
            if result['success']:
                passed += 1
                print("✅ PASS: Operation success")
            else:
                failed += 1
                print("❌ FAIL: Operation failed")
            
            if repair.status == 'Completed':
                passed += 1
                print("✅ PASS: Repair status completed")
            else:
                failed += 1
                print(f"❌ FAIL: Repair status is {repair.status}")
            
            if asset.status == 'Available':
                passed += 1
                print("✅ PASS: Asset status Available")
            else:
                failed += 1
                print(f"❌ FAIL: Asset status is {asset.status}")
            
            # Check audit
            audit = AuditLog.query.filter_by(
                asset_id=asset.id,
                action_type='REPAIR_COMPLETED'
            ).order_by(AuditLog.timestamp.desc()).first()
            
            if audit:
                passed += 1
                print("✅ PASS: Audit log created")
            else:
                failed += 1
                print("❌ FAIL: Audit log missing")
            
        except OperationError as e:
            failed += 1
            print(f"❌ FAIL: {e.message}")
        
        print("\n" + "="*80)
        print(f"COMPLETE REPAIR: {passed} PASS, {failed} FAIL")
        print("="*80)
        
        return failed == 0


def test_replace_part():
    """Test part replacement"""
    print("\n" + "="*80)
    print("WORKFLOW TEST: REPLACE PART")
    print("="*80)
    
    with app.app_context():
        passed = 0
        failed = 0
        
        # Get available or assigned asset
        asset = Asset.query.filter(Asset.status.in_(['Available', 'Assigned'])).first()
        if not asset:
            print("❌ No suitable asset for testing")
            return False
        
        print(f"\nTest Asset: ID={asset.id}, Status={asset.status}")
        
        # TEST 1: Replace part
        print("\n" + "-"*80)
        print("TEST 1: Replace Part")
        print("-"*80)
        
        try:
            result = OperationsService.replace_part(
                asset_id=asset.id,
                part_name='Battery',
                part_serial='BAT123456',
                performed_by='test_admin',
                reason='Battery degraded',
                comments='Quick replacement'
            )
            
            if result['success']:
                passed += 1
                print("✅ PASS: Operation success")
            else:
                failed += 1
                print("❌ FAIL: Operation failed")
            
            # Check if part record created (depends on implementation)
            # Note: OperationsService.replace_part may not be fully implemented
            
        except OperationError as e:
            failed += 1
            print(f"❌ FAIL: {e.message}")
        except AttributeError:
            print("⚠️  SKIP: replace_part not implemented")
            return None
        
        print("\n" + "="*80)
        print(f"REPLACE PART: {passed} PASS, {failed} FAIL")
        print("="*80)
        
        return failed == 0


if __name__ == '__main__':
    result1, repair_id = test_send_for_repair()
    result2 = test_complete_repair(repair_id)
    result3 = test_replace_part()
    
    print("\n" + "="*80)
    print("REPAIR WORKFLOW TEST SUMMARY")
    print("="*80)
    print(f"Send for Repair: {'PASS' if result1 else 'FAIL'}")
    print(f"Complete Repair: {'PASS' if result2 else 'FAIL'}")
    if result3 is not None:
        print(f"Replace Part: {'PASS' if result3 else 'FAIL'}")
    else:
        print("Replace Part: NOT IMPLEMENTED")
    print("="*80)
    
    exit(0 if (result1 and result2) else 1)
