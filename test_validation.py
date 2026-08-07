#!/usr/bin/env python3
"""
Test Data Integrity Validation
Tests the new validation rules to prevent status+emp_id inconsistency
"""

from app import app, db
from models import Asset, Employee
from utils.inventory_validator import InventoryValidator
import json

def test_validation():
    with app.app_context():
        print("=" * 80)
        print("DATA INTEGRITY VALIDATION TESTS")
        print("=" * 80)
        
        # Get Asset 3 (currently Assigned to TT694)
        asset = Asset.query.get(3)
        if not asset:
            print("❌ Asset 3 not found")
            return
        
        print(f"\nAsset 3 Current State:")
        print(f"  Name: {asset.asset_name}")
        print(f"  Status: {asset.status}")
        print(f"  Employee: {asset.emp_id} - {asset.employee_name}")
        
        # TEST 1: Try to clear emp_id while status='Assigned' (SHOULD FAIL)
        print("\n" + "=" * 80)
        print("TEST 1: Clear emp_id while status='Assigned' (SHOULD FAIL)")
        print("=" * 80)
        result = InventoryValidator.validate_asset_update(3, {
            'emp_id': '',
            'employee_name': ''
        })
        print(f"Valid: {result['valid']}")
        if result['errors']:
            print(f"✅ CORRECTLY REJECTED:")
            for error in result['errors']:
                print(f"   - {error}")
        else:
            print(f"❌ BUG: Should have rejected this!")
        
        # TEST 2: Set status='Assigned' with no emp_id (SHOULD FAIL)
        print("\n" + "=" * 80)
        print("TEST 2: Set status='Assigned' with no emp_id (SHOULD FAIL)")
        print("=" * 80)
        result = InventoryValidator.validate_asset_update(3, {
            'status': 'Assigned',
            'emp_id': ''
        })
        print(f"Valid: {result['valid']}")
        if result['errors']:
            print(f"✅ CORRECTLY REJECTED:")
            for error in result['errors']:
                print(f"   - {error}")
        else:
            print(f"❌ BUG: Should have rejected this!")
        
        # TEST 3: Set status='Available' with emp_id (SHOULD FAIL)
        print("\n" + "=" * 80)
        print("TEST 3: Set status='Available' with emp_id (SHOULD FAIL)")
        print("=" * 80)
        result = InventoryValidator.validate_asset_update(3, {
            'status': 'Available',
            'emp_id': 'TT694'
        })
        print(f"Valid: {result['valid']}")
        if result['errors']:
            print(f"✅ CORRECTLY REJECTED:")
            for error in result['errors']:
                print(f"   - {error}")
        else:
            print(f"❌ BUG: Should have rejected this!")
        
        # TEST 4: Clear emp_id AND set status='Available' (SHOULD PASS)
        print("\n" + "=" * 80)
        print("TEST 4: Clear emp_id AND set status='Available' (SHOULD PASS)")
        print("=" * 80)
        result = InventoryValidator.validate_asset_update(3, {
            'status': 'Available',
            'emp_id': '',
            'employee_name': ''
        })
        print(f"Valid: {result['valid']}")
        if result['valid']:
            print(f"✅ CORRECTLY ACCEPTED")
        else:
            print(f"❌ BUG: Should have accepted this!")
            for error in result['errors']:
                print(f"   - {error}")
        
        # TEST 5: Add emp_id AND set status='Assigned' (SHOULD PASS)
        print("\n" + "=" * 80)
        print("TEST 5: Add emp_id='TT694' AND set status='Assigned' (SHOULD PASS)")
        print("=" * 80)
        
        # First set asset to Available for this test
        asset.status = 'Available'
        asset.emp_id = ''
        asset.employee_name = ''
        db.session.commit()
        
        result = InventoryValidator.validate_asset_update(3, {
            'status': 'Assigned',
            'emp_id': 'TT694',
            'employee_name': 'Revanth Maddela'
        })
        print(f"Valid: {result['valid']}")
        if result['valid']:
            print(f"✅ CORRECTLY ACCEPTED")
        else:
            print(f"❌ BUG: Should have accepted this!")
            for error in result['errors']:
                print(f"   - {error}")
        
        # Restore asset to Assigned for cleanup
        asset.status = 'Assigned'
        asset.emp_id = 'TT694'
        asset.employee_name = 'Revanth Maddela'
        db.session.commit()
        
        print("\n" + "=" * 80)
        print("VALIDATION TESTS COMPLETE")
        print("=" * 80)

if __name__ == '__main__':
    test_validation()
