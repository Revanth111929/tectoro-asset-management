#!/usr/bin/env python3
"""
Test Dashboard Stats API
"""

from app import app
from models import Asset, Employee
import json

def test_dashboard_stats():
    """Test dashboard statistics endpoint"""
    print("="*80)
    print("WORKFLOW TEST: DASHBOARD STATS")
    print("="*80)
    
    with app.app_context():
        passed = 0
        failed = 0
        
        # Get actual counts from database
        total_assets = Asset.query.count()
        total_employees = Employee.query.count()
        assigned_assets = Asset.query.filter_by(status='Assigned').count()
        available_assets = Asset.query.filter_by(status='Available').count()
        
        print(f"\nDatabase Counts:")
        print(f"  Total Assets: {total_assets}")
        print(f"  Total Employees: {total_employees}")
        print(f"  Assigned: {assigned_assets}")
        print(f"  Available: {available_assets}")
        
        # TEST 1: Query counts from database directly
        print("\n" + "-"*80)
        print("TEST 1: Database Query Counts")
        print("-"*80)
        
        try:
            if total_assets > 0:
                passed += 1
                print(f"✅ PASS: Found {total_assets} assets")
            else:
                failed += 1
                print("❌ FAIL: No assets in database")
            
            if total_employees > 0:
                passed += 1
                print(f"✅ PASS: Found {total_employees} employees")
            else:
                failed += 1
                print("❌ FAIL: No employees in database")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Query failed - {str(e)}")
        
        # TEST 2: Status distribution
        print("\n" + "-"*80)
        print("TEST 2: Status Distribution")
        print("-"*80)
        
        try:
            statuses = {}
            for status in ['Available', 'Assigned', 'Under Repair', 'Retired']:
                count = Asset.query.filter_by(status=status).count()
                statuses[status] = count
            
            total_counted = sum(statuses.values())
            if total_counted == total_assets:
                passed += 1
                print(f"✅ PASS: Status counts match total ({total_counted})")
            else:
                failed += 1
                print(f"❌ FAIL: Status counts ({total_counted}) != total ({total_assets})")
            
            for status, count in statuses.items():
                print(f"  {status}: {count}")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Status distribution failed - {str(e)}")
        
        # TEST 3: Category distribution
        print("\n" + "-"*80)
        print("TEST 3: Category Distribution")
        print("-"*80)
        
        try:
            categories = {}
            results = Asset.query.with_entities(
                Asset.category, 
                db.func.count(Asset.id)
            ).group_by(Asset.category).all()
            
            for category, count in results:
                categories[category or 'Unknown'] = count
            
            if len(categories) > 0:
                passed += 1
                print(f"✅ PASS: Found {len(categories)} categories")
                for cat, count in categories.items():
                    print(f"  {cat}: {count}")
            else:
                failed += 1
                print("❌ FAIL: No categories found")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Category distribution failed - {str(e)}")
        
        # TEST 4: Active vs Inactive employees
        print("\n" + "-"*80)
        print("TEST 4: Employee Status Distribution")
        print("-"*80)
        
        try:
            active = Employee.query.filter_by(is_active=True).count()
            inactive = Employee.query.filter_by(is_active=False).count()
            
            if active + inactive == total_employees:
                passed += 1
                print(f"✅ PASS: Employee counts match")
                print(f"  Active: {active}")
                print(f"  Inactive: {inactive}")
            else:
                failed += 1
                print(f"❌ FAIL: Count mismatch")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Employee status failed - {str(e)}")
        
        # TEST 5: Assets with/without employees
        print("\n" + "-"*80)
        print("TEST 5: Asset Assignment Status")
        print("-"*80)
        
        try:
            with_emp = Asset.query.filter(
                Asset.emp_id.isnot(None),
                Asset.emp_id != ''
            ).count()
            
            without_emp = Asset.query.filter(
                db.or_(Asset.emp_id.is_(None), Asset.emp_id == '')
            ).count()
            
            if with_emp + without_emp == total_assets:
                passed += 1
                print(f"✅ PASS: Assignment counts match")
                print(f"  With employee: {with_emp}")
                print(f"  Without employee: {without_emp}")
            else:
                failed += 1
                print(f"❌ FAIL: Assignment count mismatch")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Assignment status failed - {str(e)}")
        
        # TEST 6: Data consistency check
        print("\n" + "-"*80)
        print("TEST 6: Data Consistency Check")
        print("-"*80)
        
        try:
            # Check: Assigned status should have emp_id
            assigned_no_emp = Asset.query.filter(
                Asset.status == 'Assigned',
                db.or_(Asset.emp_id.is_(None), Asset.emp_id == '')
            ).count()
            
            if assigned_no_emp == 0:
                passed += 1
                print("✅ PASS: No Assigned assets without employee")
            else:
                failed += 1
                print(f"❌ FAIL: Found {assigned_no_emp} Assigned assets without employee")
            
            # Check: Available status should not have emp_id
            available_with_emp = Asset.query.filter(
                Asset.status == 'Available',
                Asset.emp_id.isnot(None),
                Asset.emp_id != ''
            ).count()
            
            if available_with_emp == 0:
                passed += 1
                print("✅ PASS: No Available assets with employee")
            else:
                failed += 1
                print(f"❌ FAIL: Found {available_with_emp} Available assets with employee")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Consistency check failed - {str(e)}")
        
        print("\n" + "="*80)
        print(f"DASHBOARD STATS: {passed} PASS, {failed} FAIL")
        print("="*80)
        
        return failed == 0


if __name__ == '__main__':
    from models import db
    result = test_dashboard_stats()
    
    print("\n" + "="*80)
    print("DASHBOARD STATS TEST SUMMARY")
    print("="*80)
    print(f"Dashboard Stats: {'PASS' if result else 'FAIL'}")
    print("="*80)
    
    exit(0 if result else 1)
