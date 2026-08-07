#!/usr/bin/env python3
"""
Test Transfer and Swap Workflows
"""

from app import app, db
from models import Asset, Employee, AuditLog
from services.operations_service import OperationsService, OperationError

def test_transfer_workflow():
    """Test asset transfer between employees"""
    print("="*80)
    print("WORKFLOW TEST: ASSET TRANSFER")
    print("="*80)
    
    with app.app_context():
        passed = 0
        failed = 0
        
        # Setup: Need 2 employees and 1 assigned asset
        employees = Employee.query.filter_by(is_active=True).limit(2).all()
        if len(employees) < 2:
            print("❌ Need at least 2 active employees for transfer test")
            return False
        
        emp1 = employees[0]
        emp2 = employees[1]
        
        # Get or create assigned asset for emp1
        asset = Asset.query.filter_by(status='Assigned', emp_id=emp1.emp_id).first()
        
        if not asset:
            # Assign an available asset to emp1 first
            available = Asset.query.filter_by(status='Available').first()
            if not available:
                print("❌ No available assets for testing")
                return False
            
            OperationsService.assign_asset(
                asset_id=available.id,
                emp_id=emp1.emp_id,
                performed_by='test_admin',
                comments='Setup for transfer test'
            )
            db.session.refresh(available)
            asset = available
        
        print(f"\nTest Asset: ID={asset.id}, Serial={asset.serial_number}")
        print(f"From Employee: {emp1.emp_id} - {emp1.employee_name}")
        print(f"To Employee: {emp2.emp_id} - {emp2.employee_name}")
        
        # TEST 1: Simple Transfer
        print("\n" + "-"*80)
        print("TEST 1: Transfer Asset Between Employees")
        print("-"*80)
        
        try:
            result = OperationsService.transfer_asset(
                asset_id=asset.id,
                to_emp_id=emp2.emp_id,
                reason='Transfer for testing',
                performed_by='test_admin',
                comments='Automated transfer test'
            )
            
            db.session.refresh(asset)
            
            # Verify
            if result['success']:
                passed += 1
                print("✅ PASS: Operation returned success")
            else:
                failed += 1
                print("❌ FAIL: Operation did not return success")
            
            if asset.emp_id == emp2.emp_id:
                passed += 1
                print("✅ PASS: Asset transferred to new employee")
            else:
                failed += 1
                print(f"❌ FAIL: Asset emp_id is {asset.emp_id}, expected {emp2.emp_id}")
            
            if asset.employee_name == emp2.employee_name:
                passed += 1
                print("✅ PASS: Employee name updated")
            else:
                failed += 1
                print(f"❌ FAIL: Employee name is {asset.employee_name}")
            
            if asset.status == 'Assigned':
                passed += 1
                print("✅ PASS: Status remains Assigned")
            else:
                failed += 1
                print(f"❌ FAIL: Status is {asset.status}")
            
            # Check audit log
            audit = AuditLog.query.filter_by(
                asset_id=asset.id,
                action_type='ASSET_TRANSFERRED'
            ).order_by(AuditLog.timestamp.desc()).first()
            
            if audit:
                passed += 1
                print("✅ PASS: Audit log created")
                
                if audit.module == 'Operations':
                    passed += 1
                    print("✅ PASS: Audit module correct")
                else:
                    failed += 1
                    print(f"❌ FAIL: Audit module is {audit.module}")
            else:
                failed += 1
                print("❌ FAIL: Audit log not created")
            
        except OperationError as e:
            failed += 1
            print(f"❌ FAIL: Transfer failed: {e.message}")
        
        # TEST 2: Try to transfer non-assigned asset (SHOULD FAIL)
        print("\n" + "-"*80)
        print("TEST 2: Try Transfer Available Asset (SHOULD FAIL)")
        print("-"*80)
        
        available_asset = Asset.query.filter_by(status='Available').first()
        if available_asset:
            try:
                result = OperationsService.transfer_asset(
                    asset_id=available_asset.id,
                    to_emp_id=emp1.emp_id,
                    reason='Test transfer',
                    performed_by='test_admin'
                )
                failed += 1
                print("❌ FAIL: Should have rejected available asset")
            except OperationError as e:
                if e.code == 'INVALID_STATUS':
                    passed += 1
                    print(f"✅ PASS: Correctly rejected - {e.message}")
                else:
                    failed += 1
                    print(f"❌ FAIL: Wrong error code: {e.code}")
        else:
            print("⚠️  SKIP: No available asset to test rejection")
        
        # TEST 3: Try to transfer to non-existent employee (SHOULD FAIL)
        print("\n" + "-"*80)
        print("TEST 3: Try Transfer to Invalid Employee (SHOULD FAIL)")
        print("-"*80)
        
        try:
            result = OperationsService.transfer_asset(
                asset_id=asset.id,
                to_emp_id='INVALID999',
                reason='Test transfer',
                performed_by='test_admin'
            )
            failed += 1
            print("❌ FAIL: Should have rejected invalid employee")
        except OperationError as e:
            if e.code == 'EMPLOYEE_NOT_FOUND':
                passed += 1
                print(f"✅ PASS: Correctly rejected - {e.message}")
            else:
                failed += 1
                print(f"❌ FAIL: Wrong error code: {e.code}")
        
        # TEST 4: Transfer without reason (SHOULD FAIL)
        print("\n" + "-"*80)
        print("TEST 4: Try Transfer Without Reason (SHOULD FAIL)")
        print("-"*80)
        
        try:
            result = OperationsService.transfer_asset(
                asset_id=asset.id,
                to_emp_id=emp1.emp_id,
                reason='',
                performed_by='test_admin'
            )
            failed += 1
            print("❌ FAIL: Should have rejected empty reason")
        except OperationError as e:
            if e.code == 'REASON_REQUIRED':
                passed += 1
                print(f"✅ PASS: Correctly rejected - {e.message}")
            else:
                failed += 1
                print(f"❌ FAIL: Wrong error code: {e.code}")
        
        # Cleanup: Transfer back to original employee
        try:
            OperationsService.transfer_asset(
                asset_id=asset.id,
                to_emp_id=emp1.emp_id,
                reason='Test cleanup',
                performed_by='test_admin'
            )
            print("\n✅ Cleanup: Asset transferred back to original employee")
        except:
            print("\n⚠️  Warning: Could not restore original state")
        
        print("\n" + "="*80)
        print(f"TRANSFER WORKFLOW: {passed} PASS, {failed} FAIL")
        print("="*80)
        
        return failed == 0


def test_swap_workflow():
    """Test asset swap between employees"""
    print("\n" + "="*80)
    print("WORKFLOW TEST: ASSET SWAP")
    print("="*80)
    
    with app.app_context():
        passed = 0
        failed = 0
        
        # Setup: Need 2 employees, each with 1 assigned asset
        employees = Employee.query.filter_by(is_active=True).limit(2).all()
        if len(employees) < 2:
            print("❌ Need at least 2 active employees")
            return False
        
        emp1 = employees[0]
        emp2 = employees[1]
        
        # Get or create assets for both employees
        asset1 = Asset.query.filter_by(status='Assigned', emp_id=emp1.emp_id).first()
        asset2 = Asset.query.filter_by(status='Assigned', emp_id=emp2.emp_id).first()
        
        # Create assignments if needed
        if not asset1:
            available = Asset.query.filter_by(status='Available').first()
            if not available:
                print("❌ No available assets")
                return False
            OperationsService.assign_asset(available.id, emp1.emp_id, 'test_admin', 'Swap test setup')
            db.session.refresh(available)
            asset1 = available
        
        if not asset2:
            available = Asset.query.filter_by(status='Available').first()
            if not available:
                print("❌ Need 2 available assets for swap test")
                return False
            OperationsService.assign_asset(available.id, emp2.emp_id, 'test_admin', 'Swap test setup')
            db.session.refresh(available)
            asset2 = available
        
        print(f"\nAsset 1: ID={asset1.id}, Serial={asset1.serial_number}, Employee={emp1.emp_id}")
        print(f"Asset 2: ID={asset2.id}, Serial={asset2.serial_number}, Employee={emp2.emp_id}")
        
        # TEST 1: Swap Assets
        print("\n" + "-"*80)
        print("TEST 1: Swap Assets Between Employees")
        print("-"*80)
        
        try:
            result = OperationsService.transfer_asset(
                asset_id=asset1.id,
                to_emp_id=emp2.emp_id,
                reason='Testing swap functionality',
                performed_by='test_admin',
                swap_asset_id=asset2.id,
                comments='Automated swap test'
            )
            
            db.session.refresh(asset1)
            db.session.refresh(asset2)
            
            # Verify
            if result['success']:
                passed += 1
                print("✅ PASS: Operation returned success")
            else:
                failed += 1
                print("❌ FAIL: Operation did not return success")
            
            if asset1.emp_id == emp2.emp_id:
                passed += 1
                print(f"✅ PASS: Asset1 now with {emp2.emp_id}")
            else:
                failed += 1
                print(f"❌ FAIL: Asset1 emp_id is {asset1.emp_id}, expected {emp2.emp_id}")
            
            if asset2.emp_id == emp1.emp_id:
                passed += 1
                print(f"✅ PASS: Asset2 now with {emp1.emp_id}")
            else:
                failed += 1
                print(f"❌ FAIL: Asset2 emp_id is {asset2.emp_id}, expected {emp1.emp_id}")
            
            # Check audit logs for both assets
            audit1 = AuditLog.query.filter_by(
                asset_id=asset1.id,
                action_type='ASSET_TRANSFERRED'
            ).order_by(AuditLog.timestamp.desc()).first()
            
            audit2 = AuditLog.query.filter_by(
                asset_id=asset2.id,
                action_type='ASSET_TRANSFERRED'
            ).order_by(AuditLog.timestamp.desc()).first()
            
            if audit1 and audit2:
                passed += 1
                print("✅ PASS: Audit logs created for both assets")
            else:
                failed += 1
                print("❌ FAIL: Missing audit logs")
            
        except OperationError as e:
            failed += 1
            print(f"❌ FAIL: Swap failed: {e.message}")
        
        # TEST 2: Try to swap with non-assigned asset (SHOULD FAIL)
        print("\n" + "-"*80)
        print("TEST 2: Try Swap With Available Asset (SHOULD FAIL)")
        print("-"*80)
        
        available = Asset.query.filter_by(status='Available').first()
        if available:
            try:
                result = OperationsService.transfer_asset(
                    asset_id=asset1.id,
                    to_emp_id=emp1.emp_id,
                    reason='Test swap',
                    performed_by='test_admin',
                    swap_asset_id=available.id
                )
                failed += 1
                print("❌ FAIL: Should have rejected available swap asset")
            except OperationError as e:
                if 'SWAP_ASSET' in e.code:
                    passed += 1
                    print(f"✅ PASS: Correctly rejected - {e.message}")
                else:
                    failed += 1
                    print(f"❌ FAIL: Wrong error code: {e.code}")
        else:
            print("⚠️  SKIP: No available asset to test rejection")
        
        # Cleanup: Swap back
        try:
            OperationsService.transfer_asset(
                asset_id=asset1.id,
                to_emp_id=emp1.emp_id,
                reason='Test cleanup',
                performed_by='test_admin',
                swap_asset_id=asset2.id
            )
            print("\n✅ Cleanup: Assets swapped back to original state")
        except:
            print("\n⚠️  Warning: Could not restore original state")
        
        print("\n" + "="*80)
        print(f"SWAP WORKFLOW: {passed} PASS, {failed} FAIL")
        print("="*80)
        
        return failed == 0


if __name__ == '__main__':
    result1 = test_transfer_workflow()
    result2 = test_swap_workflow()
    
    print("\n" + "="*80)
    print("TRANSFER & SWAP TEST SUMMARY")
    print("="*80)
    print(f"Transfer Workflow: {'PASS' if result1 else 'FAIL'}")
    print(f"Swap Workflow: {'PASS' if result2 else 'FAIL'}")
    print("="*80)
    
    exit(0 if (result1 and result2) else 1)
