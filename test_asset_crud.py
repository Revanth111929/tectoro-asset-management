#!/usr/bin/env python3
"""
Test Asset CRUD Operations
"""

from app import app, db
from models import Asset, AuditLog
from datetime import datetime

def test_asset_crud():
    """Test asset create, read, update, delete operations"""
    print("="*80)
    print("WORKFLOW TEST: ASSET CRUD")
    print("="*80)
    
    with app.app_context():
        passed = 0
        failed = 0
        
        # TEST 1: Create asset
        print("\n" + "-"*80)
        print("TEST 1: Create Asset")
        print("-"*80)
        
        new_serial = f"TEST-SN-{datetime.now().strftime('%H%M%S')}"
        
        try:
            asset = Asset(
                serial_number=new_serial,
                asset_name='Test Laptop',
                category='Laptop',
                status='Available',
                model_name='Test Model',
                ram='16GB',
                os='Windows 11'
            )
            db.session.add(asset)
            db.session.commit()
            
            # Verify created
            created = Asset.query.filter_by(serial_number=new_serial).first()
            if created:
                passed += 1
                print(f"✅ PASS: Asset created - {new_serial}")
            else:
                failed += 1
                print("❌ FAIL: Asset not found")
            
            if created and created.asset_name == 'Test Laptop':
                passed += 1
                print("✅ PASS: Asset name correct")
            else:
                failed += 1
                print("❌ FAIL: Asset name incorrect")
            
            if created and created.status == 'Available':
                passed += 1
                print("✅ PASS: Default status correct")
            else:
                failed += 1
                print("❌ FAIL: Status incorrect")
            
            asset_id = created.id if created else None
            
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Create failed - {str(e)}")
            asset_id = None
        
        # TEST 2: Read asset
        print("\n" + "-"*80)
        print("TEST 2: Read Asset")
        print("-"*80)
        
        try:
            asset = Asset.query.filter_by(serial_number=new_serial).first()
            if asset:
                passed += 1
                print(f"✅ PASS: Asset found - {asset.asset_name}")
            else:
                failed += 1
                print("❌ FAIL: Asset not found")
            
            # Test to_dict()
            if asset:
                asset_dict = asset.to_dict()
                if 'serial_number' in asset_dict and asset_dict['serial_number'] == new_serial:
                    passed += 1
                    print("✅ PASS: to_dict() works")
                else:
                    failed += 1
                    print("❌ FAIL: to_dict() incorrect")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Read failed - {str(e)}")
        
        # TEST 3: Update asset
        print("\n" + "-"*80)
        print("TEST 3: Update Asset")
        print("-"*80)
        
        try:
            asset = Asset.query.filter_by(serial_number=new_serial).first()
            if asset:
                asset.asset_name = 'Updated Test Laptop'
                asset.ram = '32GB'
                db.session.commit()
                
                db.session.refresh(asset)
                if asset.asset_name == 'Updated Test Laptop':
                    passed += 1
                    print("✅ PASS: Asset name updated")
                else:
                    failed += 1
                    print("❌ FAIL: Name not updated")
                
                if asset.ram == '32GB':
                    passed += 1
                    print("✅ PASS: RAM updated")
                else:
                    failed += 1
                    print("❌ FAIL: RAM not updated")
            else:
                failed += 1
                print("❌ FAIL: Asset not found")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Update failed - {str(e)}")
        
        # TEST 4: Duplicate serial number (SHOULD FAIL)
        print("\n" + "-"*80)
        print("TEST 4: Try Create Duplicate Serial Number (SHOULD FAIL)")
        print("-"*80)
        
        try:
            duplicate = Asset(
                serial_number=new_serial,
                asset_name='Duplicate',
                category='Laptop',
                status='Available'
            )
            db.session.add(duplicate)
            db.session.commit()
            
            failed += 1
            print("❌ FAIL: Should have rejected duplicate")
            db.session.rollback()
        
        except Exception as e:
            passed += 1
            print(f"✅ PASS: Correctly rejected duplicate - {type(e).__name__}")
            db.session.rollback()
        
        # TEST 5: Search assets
        print("\n" + "-"*80)
        print("TEST 5: Search Assets")
        print("-"*80)
        
        try:
            results = Asset.query.filter(
                Asset.asset_name.ilike('%Test Laptop%')
            ).all()
            
            if len(results) > 0:
                passed += 1
                print(f"✅ PASS: Search found {len(results)} asset(s)")
            else:
                failed += 1
                print("❌ FAIL: Search found nothing")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Search failed - {str(e)}")
        
        # TEST 6: Filter by status
        print("\n" + "-"*80)
        print("TEST 6: Filter by Status")
        print("-"*80)
        
        try:
            available = Asset.query.filter_by(status='Available').all()
            if len(available) > 0:
                passed += 1
                print(f"✅ PASS: Found {len(available)} Available assets")
            else:
                failed += 1
                print("❌ FAIL: No Available assets found")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Filter failed - {str(e)}")
        
        # TEST 7: Filter by category
        print("\n" + "-"*80)
        print("TEST 7: Filter by Category")
        print("-"*80)
        
        try:
            laptops = Asset.query.filter_by(category='Laptop').all()
            if len(laptops) > 0:
                passed += 1
                print(f"✅ PASS: Found {len(laptops)} Laptop(s)")
            else:
                failed += 1
                print("❌ FAIL: No Laptops found")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Filter failed - {str(e)}")
        
        # TEST 8: Delete asset
        print("\n" + "-"*80)
        print("TEST 8: Delete Asset")
        print("-"*80)
        
        try:
            asset = Asset.query.filter_by(serial_number=new_serial).first()
            if asset:
                db.session.delete(asset)
                db.session.commit()
                
                # Verify deleted
                deleted = Asset.query.filter_by(serial_number=new_serial).first()
                if not deleted:
                    passed += 1
                    print("✅ PASS: Asset deleted")
                else:
                    failed += 1
                    print("❌ FAIL: Asset still exists")
            else:
                failed += 1
                print("❌ FAIL: Asset not found")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Delete failed - {str(e)}")
        
        print("\n" + "="*80)
        print(f"ASSET CRUD: {passed} PASS, {failed} FAIL")
        print("="*80)
        
        return failed == 0


if __name__ == '__main__':
    result = test_asset_crud()
    
    print("\n" + "="*80)
    print("ASSET CRUD TEST SUMMARY")
    print("="*80)
    print(f"Asset CRUD: {'PASS' if result else 'FAIL'}")
    print("="*80)
    
    exit(0 if result else 1)
