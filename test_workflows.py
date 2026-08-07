#!/usr/bin/env python3
"""
Comprehensive Workflow Testing
Tests all major business workflows end-to-end
"""

from app import app, db
from models import Asset, Employee, AuditLog
from services.operations_service import OperationsService, OperationError
from utils.inventory_validator import InventoryValidator
import json
from datetime import date

class WorkflowTester:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.tests = []
    
    def test(self, name, condition, expected=True):
        """Record test result"""
        result = condition == expected
        status = "✅ PASS" if result else "❌ FAIL"
        self.tests.append({
            'name': name,
            'status': status,
            'result': result,
            'value': condition
        })
        if result:
            self.passed += 1
        else:
            self.failed += 1
        return result
    
    def report(self):
        """Print test report"""
        for test in self.tests:
            print(f"{test['status']}: {test['name']}")
            if not test['result']:
                print(f"         Expected: True, Got: {test['value']}")
        print(f"\n{'='*80}")
        print(f"TOTAL: {self.passed} passed, {self.failed} failed")
        print(f"{'='*80}")
        return self.failed == 0

def test_assignment_workflow():
    """Test complete assignment workflow"""
    print("="*80)
    print("WORKFLOW TEST #1: ASSET ASSIGNMENT")
    print("="*80)
    
    tester = WorkflowTester()
    
    with app.app_context():
        # Setup: Get available asset and active employee
        asset = Asset.query.filter_by(status='Available').first()
        employee = Employee.query.filter_by(emp_id='TT694').first()
        
        if not asset:
            print("❌ No available asset found for testing")
            return False
        
        if not employee:
            print("❌ Employee TT694 not found for testing")
            return False
        
        asset_id = asset.id
        original_status = asset.status
        
        print(f"\nTest Asset: ID={asset.id}, Serial={asset.serial_number}, Status={asset.status}")
        print(f"Test Employee: {employee.emp_id} - {employee.employee_name}")
        
        # TEST 1: Successful Assignment
        print("\n" + "-"*80)
        print("TEST 1: Assign Available Asset to Active Employee")
        print("-"*80)
        
        try:
            result = OperationsService.assign_asset(
                asset_id=asset.id,
                emp_id=employee.emp_id,
                performed_by='test_admin',
                comments='Automated workflow test'
            )
            
            # Refresh asset from database
            db.session.refresh(asset)
            
            # Verify results
            tester.test("Operation returned success", result['success'])
            tester.test("Asset status changed to Assigned", asset.status == 'Assigned')
            tester.test("Asset emp_id set correctly", asset.emp_id == employee.emp_id)
            tester.test("Asset employee_name set correctly", asset.employee_name == employee.employee_name)
            
            # Email might be empty if employee doesn't have one
            if employee.email and employee.email.strip():
                tester.test("Asset employee_email populated", asset.employee_email == employee.email)
            else:
                print("ℹ️  Employee has no email - skipping email check")
                tester.test("Asset employee_email matches employee", asset.employee_email == (employee.email or ''))
            
            # Check audit log
            audit = AuditLog.query.filter_by(
                asset_id=asset.id,
                action_type='ASSET_ASSIGNED'
            ).order_by(AuditLog.timestamp.desc()).first()
            
            tester.test("Audit log created", audit is not None)
            if audit:
                tester.test("Audit log module correct", audit.module == 'Operations')
                tester.test("Audit log employee correct", audit.employee_id == employee.emp_id)
            
            print("\n✅ Assignment workflow PASSED")
            
        except OperationError as e:
            tester.test("Assignment should succeed", False)
            print(f"\n❌ Assignment FAILED: {e.message}")
        
        # TEST 2: Try to assign already assigned asset (SHOULD FAIL)
        print("\n" + "-"*80)
        print("TEST 2: Try to Assign Already Assigned Asset (SHOULD FAIL)")
        print("-"*80)
        
        try:
            result = OperationsService.assign_asset(
                asset_id=asset.id,
                emp_id=employee.emp_id,
                performed_by='test_admin'
            )
            tester.test("Should reject already assigned asset", False)
            print("❌ FAILED: Should have rejected this!")
        except OperationError as e:
            tester.test("Correctly rejected assigned asset", e.code == 'INVALID_STATUS')
            print(f"✅ Correctly rejected: {e.message}")
        
        # TEST 3: Try to assign to non-existent employee (SHOULD FAIL)
        print("\n" + "-"*80)
        print("TEST 3: Try to Assign to Non-existent Employee (SHOULD FAIL)")
        print("-"*80)
        
        # First return the asset
        try:
            OperationsService.return_asset(
                asset_id=asset.id,
                performed_by='test_admin',
                comments='Cleanup for next test'
            )
        except:
            pass
        
        try:
            result = OperationsService.assign_asset(
                asset_id=asset.id,
                emp_id='INVALID999',
                performed_by='test_admin'
            )
            tester.test("Should reject non-existent employee", False)
            print("❌ FAILED: Should have rejected this!")
        except OperationError as e:
            tester.test("Correctly rejected invalid employee", e.code == 'EMPLOYEE_NOT_FOUND')
            print(f"✅ Correctly rejected: {e.message}")
        
        print("\n")
        success = tester.report()
        
        # Cleanup: Return asset to original state if needed
        db.session.refresh(asset)
        if asset.status != original_status:
            if original_status == 'Available' and asset.status == 'Assigned':
                try:
                    OperationsService.return_asset(
                        asset_id=asset.id,
                        performed_by='test_admin',
                        comments='Test cleanup'
                    )
                    print("\n✅ Test cleanup: Asset returned to Available")
                except:
                    print("\n⚠️  Warning: Could not return asset to original state")
        
        return success


def test_return_workflow():
    """Test complete return workflow"""
    print("\n" + "="*80)
    print("WORKFLOW TEST #2: ASSET RETURN")
    print("="*80)
    
    tester = WorkflowTester()
    
    with app.app_context():
        # Setup: Get assigned asset
        asset = Asset.query.filter_by(status='Assigned').first()
        
        if not asset:
            print("❌ No assigned asset found for testing")
            # Try to create one
            available = Asset.query.filter_by(status='Available').first()
            employee = Employee.query.filter_by(emp_id='TT694').first()
            
            if available and employee:
                print("Creating assigned asset for testing...")
                try:
                    OperationsService.assign_asset(
                        asset_id=available.id,
                        emp_id=employee.emp_id,
                        performed_by='test_admin',
                        comments='Setup for return test'
                    )
                    db.session.refresh(available)
                    asset = available
                    print(f"✅ Created assigned asset: ID={asset.id}")
                except:
                    print("❌ Could not create assigned asset")
                    return False
            else:
                return False
        
        asset_id = asset.id
        original_emp_id = asset.emp_id
        original_emp_name = asset.employee_name
        
        print(f"\nTest Asset: ID={asset.id}, Serial={asset.serial_number}")
        print(f"Currently assigned to: {asset.emp_id} - {asset.employee_name}")
        
        # TEST 1: Successful Return
        print("\n" + "-"*80)
        print("TEST 1: Return Assigned Asset to Inventory")
        print("-"*80)
        
        try:
            result = OperationsService.return_asset(
                asset_id=asset.id,
                performed_by='test_admin',
                comments='Automated workflow test'
            )
            
            # Refresh asset from database
            db.session.refresh(asset)
            
            # Verify results
            tester.test("Operation returned success", result['success'])
            tester.test("Asset status changed to Available", asset.status == 'Available')
            tester.test("Asset emp_id cleared", asset.emp_id == '' or asset.emp_id is None)
            tester.test("Asset employee_name cleared", asset.employee_name == '' or asset.employee_name is None)
            tester.test("Asset employee_email cleared", asset.employee_email == '' or asset.employee_email is None)
            
            # Check audit log
            audit = AuditLog.query.filter_by(
                asset_id=asset.id,
                action_type='ASSET_RETURNED'
            ).order_by(AuditLog.timestamp.desc()).first()
            
            tester.test("Audit log created", audit is not None)
            if audit:
                tester.test("Audit log module correct", audit.module == 'Operations')
                tester.test("Audit log shows correct transition", 'Available' in audit.new_value)
            
            print("\n✅ Return workflow PASSED")
            
        except OperationError as e:
            tester.test("Return should succeed", False)
            print(f"\n❌ Return FAILED: {e.message}")
        
        # TEST 2: Try to return already available asset (SHOULD FAIL)
        print("\n" + "-"*80)
        print("TEST 2: Try to Return Already Available Asset (SHOULD FAIL)")
        print("-"*80)
        
        try:
            result = OperationsService.return_asset(
                asset_id=asset.id,
                performed_by='test_admin'
            )
            tester.test("Should reject available asset", False)
            print("❌ FAILED: Should have rejected this!")
        except OperationError as e:
            tester.test("Correctly rejected available asset", e.code == 'INVALID_STATUS')
            print(f"✅ Correctly rejected: {e.message}")
        
        print("\n")
        success = tester.report()
        
        # Restore asset to assigned state for future tests
        if original_emp_id and asset.status == 'Available':
            try:
                OperationsService.assign_asset(
                    asset_id=asset.id,
                    emp_id=original_emp_id,
                    performed_by='test_admin',
                    comments='Test cleanup - restore original state'
                )
                print(f"\n✅ Test cleanup: Asset re-assigned to {original_emp_id}")
            except:
                print("\n⚠️  Warning: Could not restore asset to original assigned state")
        
        return success


def test_validation_enforcement():
    """Test that validation is enforced in actual update operations"""
    print("\n" + "="*80)
    print("WORKFLOW TEST #3: VALIDATION ENFORCEMENT")
    print("="*80)
    
    tester = WorkflowTester()
    
    with app.app_context():
        # Get any assigned asset
        asset = Asset.query.filter_by(status='Assigned').first()
        
        if not asset:
            print("❌ No assigned asset found for testing")
            return False
        
        print(f"\nTest Asset: ID={asset.id}, Status={asset.status}, Employee={asset.emp_id}")
        
        # TEST 1: Validation prevents clearing emp_id while status='Assigned'
        print("\n" + "-"*80)
        print("TEST 1: Validation Prevents Invalid State (Assigned + No Employee)")
        print("-"*80)
        
        result = InventoryValidator.validate_asset_update(asset.id, {
            'emp_id': '',
            'employee_name': ''
        })
        
        tester.test("Validation rejects clearing employee while Assigned", not result['valid'])
        tester.test("Error message provided", len(result['errors']) > 0)
        
        if not result['valid']:
            print(f"✅ Correctly rejected:")
            for error in result['errors']:
                print(f"   - {error}")
        else:
            print("❌ FAILED: Should have been rejected!")
        
        # TEST 2: Validation allows proper return (emp_id cleared + status='Available')
        print("\n" + "-"*80)
        print("TEST 2: Validation Allows Valid State Change")
        print("-"*80)
        
        result = InventoryValidator.validate_asset_update(asset.id, {
            'emp_id': '',
            'employee_name': '',
            'status': 'Available'
        })
        
        tester.test("Validation accepts clearing employee with status change", result['valid'])
        
        if result['valid']:
            print("✅ Correctly accepted valid state change")
        else:
            print(f"❌ FAILED: Should have been accepted!")
            for error in result['errors']:
                print(f"   - {error}")
        
        print("\n")
        return tester.report()


def main():
    """Run all workflow tests"""
    print("\n" + "="*80)
    print("COMPREHENSIVE WORKFLOW TESTING")
    print("="*80)
    print("Testing all major business workflows end-to-end")
    print("="*80 + "\n")
    
    results = []
    
    # Test 1: Assignment Workflow
    results.append(('Assignment Workflow', test_assignment_workflow()))
    
    # Test 2: Return Workflow
    results.append(('Return Workflow', test_return_workflow()))
    
    # Test 3: Validation Enforcement
    results.append(('Validation Enforcement', test_validation_enforcement()))
    
    # Final Summary
    print("\n" + "="*80)
    print("FINAL TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    failed = len(results) - passed
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print("="*80)
    print(f"WORKFLOWS TESTED: {len(results)}")
    print(f"PASSED: {passed}")
    print(f"FAILED: {failed}")
    print("="*80)
    
    if failed == 0:
        print("\n🎉 ALL WORKFLOWS PASSED!")
        return True
    else:
        print(f"\n⚠️  {failed} WORKFLOW(S) FAILED")
        return False


if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
