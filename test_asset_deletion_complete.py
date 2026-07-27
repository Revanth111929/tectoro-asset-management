#!/usr/bin/env python3
"""
Comprehensive Asset Deletion Test
Tests both single and bulk asset deletion
"""

from api_server import app
from models import Asset, db
import sys

def test_single_asset_deletion():
    """Test single asset deletion"""
    print("=" * 80)
    print("TEST 1: SINGLE ASSET DELETION")
    print("=" * 80)
    
    with app.test_client() as client:
        # Login
        print("\n1. Logging in as admin...")
        login = client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
        token = login.json['token']
        headers = {'Authorization': f'Bearer {token}'}
        print("✓ Login successful")
        
        # Get initial count
        assets_response = client.get('/api/assets?per_page=1000', headers=headers)
        initial_count = assets_response.json['total']
        print(f"\n2. Initial asset count: {initial_count}")
        
        # Create test asset
        print("\n3. Creating test asset...")
        create_response = client.post('/api/assets',
                                      headers=headers,
                                      json={
                                          'asset_name': 'Test Single Delete',
                                          'serial_number': 'TEST-SINGLE-001',
                                          'category': 'Laptop',
                                          'status': 'Available'
                                      })
        
        if create_response.status_code != 201:
            print(f"❌ Failed to create asset: {create_response.status_code}")
            return False
        
        asset_id = create_response.json['asset']['id']
        print(f"✓ Test asset created with ID: {asset_id}")
        
        # Delete asset
        print(f"\n4. Deleting asset {asset_id}...")
        delete_response = client.delete(f'/api/assets/{asset_id}', headers=headers)
        
        print(f"   Response status: {delete_response.status_code}")
        
        if delete_response.status_code != 200:
            print(f"❌ DELETE failed")
            return False
        
        print("✓ DELETE successful")
        
        # Verify deletion
        print("\n5. Verifying deletion...")
        assets_response = client.get('/api/assets?per_page=1000', headers=headers)
        final_count = assets_response.json['total']
        
        if final_count == initial_count:
            print(f"✓ Asset removed from database")
            print(f"✓ Count: {initial_count} → {initial_count + 1} → {final_count}")
            print("\n✅ SINGLE ASSET DELETION: PASSED")
            return True
        else:
            print(f"❌ Count mismatch: {final_count} != {initial_count}")
            return False


def test_bulk_asset_deletion():
    """Test bulk asset deletion"""
    print("\n\n" + "=" * 80)
    print("TEST 2: BULK ASSET DELETION")
    print("=" * 80)
    
    with app.test_client() as client:
        # Login
        print("\n1. Logging in as admin...")
        login = client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
        token = login.json['token']
        headers = {'Authorization': f'Bearer {token}'}
        print("✓ Login successful")
        
        # Get initial count
        assets_response = client.get('/api/assets?per_page=1000', headers=headers)
        initial_count = assets_response.json['total']
        print(f"\n2. Initial asset count: {initial_count}")
        
        # Create 3 test assets
        print("\n3. Creating 3 test assets...")
        test_asset_ids = []
        for i in range(1, 4):
            create_response = client.post('/api/assets',
                                          headers=headers,
                                          json={
                                              'asset_name': f'Test Bulk {i}',
                                              'serial_number': f'TEST-BULK-{i:03d}',
                                              'category': 'Laptop',
                                              'status': 'Available'
                                          })
            
            if create_response.status_code == 201:
                asset_id = create_response.json['asset']['id']
                test_asset_ids.append(asset_id)
                print(f"✓ Created Test Bulk {i} (ID: {asset_id})")
            else:
                print(f"❌ Failed to create Test Bulk {i}")
                return False
        
        print(f"✓ Test asset IDs: {test_asset_ids}")
        
        # Delete assets
        print(f"\n4. Bulk deleting {len(test_asset_ids)} assets...")
        deleted_count = 0
        failed_count = 0
        
        for asset_id in test_asset_ids:
            delete_response = client.delete(f'/api/assets/{asset_id}', headers=headers)
            if delete_response.status_code == 200:
                deleted_count += 1
                print(f"✓ Deleted asset {asset_id}")
            else:
                failed_count += 1
                print(f"❌ Failed to delete asset {asset_id}")
        
        print(f"\n   Deleted: {deleted_count}/{len(test_asset_ids)}")
        print(f"   Failed: {failed_count}/{len(test_asset_ids)}")
        
        if failed_count > 0:
            print(f"\n❌ Some deletions failed")
            return False
        
        # Verify deletion
        print("\n5. Verifying bulk deletion...")
        assets_response = client.get('/api/assets?per_page=1000', headers=headers)
        final_count = assets_response.json['total']
        
        if final_count == initial_count:
            print(f"✓ All assets removed from database")
            print(f"✓ Count: {initial_count} → {initial_count + 3} → {final_count}")
            print("\n✅ BULK ASSET DELETION: PASSED")
            return True
        else:
            print(f"❌ Count mismatch: {final_count} != {initial_count}")
            return False


def main():
    """Run all tests"""
    print("\n")
    print("╔" + "═" * 78 + "╗")
    print("║" + " " * 18 + "ASSET DELETION COMPLETE TEST" + " " * 32 + "║")
    print("╚" + "═" * 78 + "╝")
    
    results = []
    
    # Test 1: Single asset deletion
    try:
        result1 = test_single_asset_deletion()
        results.append(("Single Asset Deletion", result1))
    except Exception as e:
        print(f"\n❌ Test 1 failed with exception: {e}")
        import traceback
        traceback.print_exc()
        results.append(("Single Asset Deletion", False))
    
    # Test 2: Bulk asset deletion
    try:
        result2 = test_bulk_asset_deletion()
        results.append(("Bulk Asset Deletion", result2))
    except Exception as e:
        print(f"\n❌ Test 2 failed with exception: {e}")
        import traceback
        traceback.print_exc()
        results.append(("Bulk Asset Deletion", False))
    
    # Summary
    print("\n\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status:15} {test_name}")
    
    all_passed = all(result for _, result in results)
    
    print("\n" + "=" * 80)
    if all_passed:
        print("✅ ALL TESTS PASSED")
        print("=" * 80)
        print("\nAsset deletion functionality is working correctly!")
        print("- Single asset deletion: Working")
        print("- Bulk asset deletion: Working")
        return 0
    else:
        print("❌ SOME TESTS FAILED")
        print("=" * 80)
        return 1


if __name__ == '__main__':
    sys.exit(main())
