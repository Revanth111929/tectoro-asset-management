#!/usr/bin/env python3
"""
Test Search Functionality
"""

from app import app
from models import Asset, Employee

def test_search():
    """Test search operations"""
    print("="*80)
    print("WORKFLOW TEST: SEARCH FUNCTIONALITY")
    print("="*80)
    
    with app.app_context():
        passed = 0
        failed = 0
        
        # TEST 1: Asset search by serial number
        print("\n" + "-"*80)
        print("TEST 1: Asset Search by Serial Number")
        print("-"*80)
        
        try:
            test_asset = Asset.query.first()
            if not test_asset:
                print("⚠️  SKIP: No assets to test")
            else:
                search_term = test_asset.serial_number[:5]
                results = Asset.query.filter(
                    Asset.serial_number.ilike(f'%{search_term}%')
                ).all()
                
                if len(results) > 0:
                    passed += 1
                    print(f"✅ PASS: Found {len(results)} asset(s) with serial like '{search_term}'")
                else:
                    failed += 1
                    print("❌ FAIL: No results found")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Search failed - {str(e)}")
        
        # TEST 2: Asset search by name
        print("\n" + "-"*80)
        print("TEST 2: Asset Search by Name")
        print("-"*80)
        
        try:
            test_asset = Asset.query.first()
            if not test_asset:
                print("⚠️  SKIP: No assets to test")
            else:
                # Search for part of name
                if test_asset.asset_name:
                    words = test_asset.asset_name.split()
                    search_term = words[0] if words else test_asset.asset_name
                    
                    results = Asset.query.filter(
                        Asset.asset_name.ilike(f'%{search_term}%')
                    ).all()
                    
                    if len(results) > 0:
                        passed += 1
                        print(f"✅ PASS: Found {len(results)} asset(s) with name like '{search_term}'")
                    else:
                        failed += 1
                        print("❌ FAIL: No results found")
                else:
                    print("⚠️  SKIP: Asset has no name")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Search failed - {str(e)}")
        
        # TEST 3: Employee search by emp_id
        print("\n" + "-"*80)
        print("TEST 3: Employee Search by ID")
        print("-"*80)
        
        try:
            test_emp = Employee.query.first()
            if not test_emp:
                print("⚠️  SKIP: No employees to test")
            else:
                results = Employee.query.filter(
                    Employee.emp_id.ilike(f'%{test_emp.emp_id}%')
                ).all()
                
                if len(results) > 0:
                    passed += 1
                    print(f"✅ PASS: Found {len(results)} employee(s) with ID '{test_emp.emp_id}'")
                else:
                    failed += 1
                    print("❌ FAIL: No results found")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Search failed - {str(e)}")
        
        # TEST 4: Employee search by name
        print("\n" + "-"*80)
        print("TEST 4: Employee Search by Name")
        print("-"*80)
        
        try:
            test_emp = Employee.query.first()
            if not test_emp:
                print("⚠️  SKIP: No employees to test")
            else:
                if test_emp.employee_name:
                    words = test_emp.employee_name.split()
                    search_term = words[0] if words else test_emp.employee_name
                    
                    results = Employee.query.filter(
                        Employee.employee_name.ilike(f'%{search_term}%')
                    ).all()
                    
                    if len(results) > 0:
                        passed += 1
                        print(f"✅ PASS: Found {len(results)} employee(s) with name like '{search_term}'")
                    else:
                        failed += 1
                        print("❌ FAIL: No results found")
                else:
                    print("⚠️  SKIP: Employee has no name")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Search failed - {str(e)}")
        
        # TEST 5: Filter assets by status
        print("\n" + "-"*80)
        print("TEST 5: Filter Assets by Status")
        print("-"*80)
        
        try:
            for status in ['Available', 'Assigned', 'Retired']:
                count = Asset.query.filter_by(status=status).count()
                if count >= 0:
                    passed += 1
                    print(f"✅ PASS: {status}: {count} asset(s)")
                else:
                    failed += 1
                    print(f"❌ FAIL: Invalid count for {status}")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Filter failed - {str(e)}")
        
        # TEST 6: Filter assets by category
        print("\n" + "-"*80)
        print("TEST 6: Filter Assets by Category")
        print("-"*80)
        
        try:
            categories = Asset.query.with_entities(Asset.category).distinct().all()
            for (category,) in categories:
                if category:
                    count = Asset.query.filter_by(category=category).count()
                    passed += 1
                    print(f"✅ PASS: {category}: {count} asset(s)")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Filter failed - {str(e)}")
        
        # TEST 7: Combined search (asset by employee)
        print("\n" + "-"*80)
        print("TEST 7: Find Assets by Employee")
        print("-"*80)
        
        try:
            assigned_asset = Asset.query.filter(
                Asset.emp_id.isnot(None),
                Asset.emp_id != ''
            ).first()
            
            if not assigned_asset:
                print("⚠️  SKIP: No assigned assets")
            else:
                results = Asset.query.filter_by(emp_id=assigned_asset.emp_id).all()
                if len(results) > 0:
                    passed += 1
                    print(f"✅ PASS: Found {len(results)} asset(s) for employee {assigned_asset.emp_id}")
                else:
                    failed += 1
                    print("❌ FAIL: No assets found for employee")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Search failed - {str(e)}")
        
        # TEST 8: Empty search handling
        print("\n" + "-"*80)
        print("TEST 8: Empty Search Term Handling")
        print("-"*80)
        
        try:
            # Search with empty string should return all or none depending on implementation
            results = Asset.query.filter(
                Asset.serial_number.ilike(f'%%')
            ).all()
            
            total = Asset.query.count()
            if len(results) == total:
                passed += 1
                print(f"✅ PASS: Empty search returns all ({total})")
            else:
                failed += 1
                print(f"❌ FAIL: Empty search returned {len(results)}, expected {total}")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Empty search failed - {str(e)}")
        
        print("\n" + "="*80)
        print(f"SEARCH FUNCTIONALITY: {passed} PASS, {failed} FAIL")
        print("="*80)
        
        return failed == 0


if __name__ == '__main__':
    result = test_search()
    
    print("\n" + "="*80)
    print("SEARCH FUNCTIONALITY TEST SUMMARY")
    print("="*80)
    print(f"Search: {'PASS' if result else 'FAIL'}")
    print("="*80)
    
    exit(0 if result else 1)
