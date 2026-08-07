#!/usr/bin/env python3
"""
Test Employee CRUD Operations
"""

from app import app, db
from models import Employee, AuditLog
from datetime import datetime

def test_employee_crud():
    """Test employee create, read, update operations"""
    print("="*80)
    print("WORKFLOW TEST: EMPLOYEE CRUD")
    print("="*80)
    
    with app.app_context():
        passed = 0
        failed = 0
        
        # TEST 1: Create employee
        print("\n" + "-"*80)
        print("TEST 1: Create Employee")
        print("-"*80)
        
        new_emp_id = f"TEST{datetime.now().strftime('%H%M%S')}"
        
        try:
            employee = Employee(
                emp_id=new_emp_id,
                employee_name='Test Employee Create',
                email=f'{new_emp_id.lower()}@example.com',
                mobile_number='9876543210',
                department='Engineering',
                designation='Software Engineer',
                is_active=True,
                status='Active'
            )
            db.session.add(employee)
            db.session.commit()
            
            # Verify created
            created = Employee.query.filter_by(emp_id=new_emp_id).first()
            if created:
                passed += 1
                print(f"✅ PASS: Employee created - {new_emp_id}")
            else:
                failed += 1
                print("❌ FAIL: Employee not found after create")
            
            if created and created.employee_name == 'Test Employee Create':
                passed += 1
                print("✅ PASS: Employee name correct")
            else:
                failed += 1
                print("❌ FAIL: Employee name incorrect")
            
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Create failed - {str(e)}")
        
        # TEST 2: Read employee
        print("\n" + "-"*80)
        print("TEST 2: Read Employee")
        print("-"*80)
        
        try:
            employee = Employee.query.filter_by(emp_id=new_emp_id).first()
            if employee:
                passed += 1
                print(f"✅ PASS: Employee found - {employee.employee_name}")
            else:
                failed += 1
                print("❌ FAIL: Employee not found")
            
            # Verify to_dict() works
            if employee:
                emp_dict = employee.to_dict()
                if emp_dict['emp_id'] == new_emp_id:
                    passed += 1
                    print("✅ PASS: to_dict() works correctly")
                else:
                    failed += 1
                    print("❌ FAIL: to_dict() incorrect")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Read failed - {str(e)}")
        
        # TEST 3: Update employee
        print("\n" + "-"*80)
        print("TEST 3: Update Employee")
        print("-"*80)
        
        try:
            employee = Employee.query.filter_by(emp_id=new_emp_id).first()
            if employee:
                employee.employee_name = 'Test Employee Updated'
                employee.designation = 'Senior Engineer'
                db.session.commit()
                
                # Verify update
                db.session.refresh(employee)
                if employee.employee_name == 'Test Employee Updated':
                    passed += 1
                    print("✅ PASS: Employee name updated")
                else:
                    failed += 1
                    print("❌ FAIL: Name not updated")
                
                if employee.designation == 'Senior Engineer':
                    passed += 1
                    print("✅ PASS: Designation updated")
                else:
                    failed += 1
                    print("❌ FAIL: Designation not updated")
            else:
                failed += 1
                print("❌ FAIL: Employee not found for update")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Update failed - {str(e)}")
        
        # TEST 4: Disable employee
        print("\n" + "-"*80)
        print("TEST 4: Disable Employee")
        print("-"*80)
        
        try:
            employee = Employee.query.filter_by(emp_id=new_emp_id).first()
            if employee:
                employee.is_active = False
                employee.status = 'Inactive'
                db.session.commit()
                
                db.session.refresh(employee)
                if not employee.is_active:
                    passed += 1
                    print("✅ PASS: Employee disabled")
                else:
                    failed += 1
                    print("❌ FAIL: Employee still active")
                
                if employee.status == 'Inactive':
                    passed += 1
                    print("✅ PASS: Status set to Inactive")
                else:
                    failed += 1
                    print("❌ FAIL: Status not updated")
            else:
                failed += 1
                print("❌ FAIL: Employee not found")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Disable failed - {str(e)}")
        
        # TEST 5: Duplicate emp_id should fail
        print("\n" + "-"*80)
        print("TEST 5: Try Create Duplicate emp_id (SHOULD FAIL)")
        print("-"*80)
        
        try:
            duplicate = Employee(
                emp_id=new_emp_id,
                employee_name='Duplicate',
                email='dup@example.com'
            )
            db.session.add(duplicate)
            db.session.commit()
            
            failed += 1
            print("❌ FAIL: Should have rejected duplicate emp_id")
            db.session.rollback()
        
        except Exception as e:
            passed += 1
            print(f"✅ PASS: Correctly rejected duplicate - {type(e).__name__}")
            db.session.rollback()
        
        # TEST 6: Search employee
        print("\n" + "-"*80)
        print("TEST 6: Search Employee")
        print("-"*80)
        
        try:
            results = Employee.query.filter(
                Employee.employee_name.ilike('%Test Employee%')
            ).all()
            
            if len(results) > 0:
                passed += 1
                print(f"✅ PASS: Search found {len(results)} employee(s)")
            else:
                failed += 1
                print("❌ FAIL: Search found nothing")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Search failed - {str(e)}")
        
        # Cleanup
        print("\n" + "-"*80)
        print("CLEANUP")
        print("-"*80)
        
        try:
            employee = Employee.query.filter_by(emp_id=new_emp_id).first()
            if employee:
                db.session.delete(employee)
                db.session.commit()
                print(f"✅ Cleanup: Deleted test employee {new_emp_id}")
        except:
            print("⚠️  Warning: Could not delete test employee")
        
        print("\n" + "="*80)
        print(f"EMPLOYEE CRUD: {passed} PASS, {failed} FAIL")
        print("="*80)
        
        return failed == 0


if __name__ == '__main__':
    result = test_employee_crud()
    
    print("\n" + "="*80)
    print("EMPLOYEE CRUD TEST SUMMARY")
    print("="*80)
    print(f"Employee CRUD: {'PASS' if result else 'FAIL'}")
    print("="*80)
    
    exit(0 if result else 1)
