#!/usr/bin/env python3
"""
Comprehensive User Deletion Test
Tests both single user deletion and bulk user deletion
"""

from api_server import app
from models import User, db
import sys

def test_single_user_deletion():
    """Test single user deletion"""
    print("=" * 80)
    print("TEST 1: SINGLE USER DELETION")
    print("=" * 80)
    
    with app.test_client() as client:
        # Login
        print("\n1. Logging in as admin...")
        login = client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
        token = login.json['token']
        headers = {'Authorization': f'Bearer {token}'}
        print("✓ Login successful")
        
        # Get initial user count
        users_response = client.get('/api/users', headers=headers)
        initial_count = len(users_response.json)
        print(f"\n2. Initial user count: {initial_count}")
        
        # Create test user
        print("\n3. Creating test user...")
        create_response = client.post('/api/users', 
                                      headers=headers,
                                      json={
                                          'username': 'test_single_delete',
                                          'email': 'test1@test.com',
                                          'password': 'testpass123',
                                          'role': 'standard'
                                      })
        
        if create_response.status_code != 201:
            print(f"❌ Failed to create user: {create_response.status_code}")
            print(f"   Response: {create_response.data.decode()}")
            return False
        
        print("✓ Test user created")
        
        # Get user ID
        users_response = client.get('/api/users', headers=headers)
        users = users_response.json
        test_user = [u for u in users if u['username'] == 'test_single_delete'][0]
        user_id = test_user['id']
        print(f"✓ Test user ID: {user_id}")
        
        # Delete user
        print(f"\n4. Deleting user {user_id}...")
        delete_response = client.delete(f'/api/users/{user_id}', headers=headers)
        
        print(f"   Response status: {delete_response.status_code}")
        print(f"   Response body: {delete_response.data.decode()}")
        
        if delete_response.status_code != 200:
            print(f"❌ DELETE failed with status {delete_response.status_code}")
            return False
        
        print("✓ DELETE request successful")
        
        # Verify deletion
        print("\n5. Verifying deletion...")
        users_response = client.get('/api/users', headers=headers)
        final_count = len(users_response.json)
        
        user_exists = any(u['id'] == user_id for u in users_response.json)
        
        if user_exists:
            print(f"❌ User still exists in database!")
            return False
        
        print(f"✓ User removed from database")
        print(f"✓ User count: {initial_count} → {initial_count + 1} → {final_count}")
        
        if final_count == initial_count:
            print("\n✅ SINGLE USER DELETION: PASSED")
            return True
        else:
            print(f"\n❌ SINGLE USER DELETION: FAILED (count mismatch)")
            return False


def test_bulk_user_deletion():
    """Test bulk user deletion"""
    print("\n\n" + "=" * 80)
    print("TEST 2: BULK USER DELETION")
    print("=" * 80)
    
    with app.test_client() as client:
        # Login
        print("\n1. Logging in as admin...")
        login = client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
        token = login.json['token']
        headers = {'Authorization': f'Bearer {token}'}
        print("✓ Login successful")
        
        # Get initial user count
        users_response = client.get('/api/users', headers=headers)
        initial_count = len(users_response.json)
        print(f"\n2. Initial user count: {initial_count}")
        
        # Create multiple test users
        print("\n3. Creating 3 test users...")
        test_users = []
        for i in range(1, 4):
            create_response = client.post('/api/users', 
                                          headers=headers,
                                          json={
                                              'username': f'test_bulk_{i}',
                                              'email': f'bulk{i}@test.com',
                                              'password': 'testpass123',
                                              'role': 'standard'
                                          })
            
            if create_response.status_code == 201:
                print(f"✓ Created test_bulk_{i}")
            else:
                print(f"❌ Failed to create test_bulk_{i}")
                return False
        
        # Get user IDs
        users_response = client.get('/api/users', headers=headers)
        users = users_response.json
        test_user_ids = [u['id'] for u in users if u['username'].startswith('test_bulk_')]
        
        print(f"✓ Test user IDs: {test_user_ids}")
        print(f"✓ Current user count: {len(users)}")
        
        # Delete users one by one (bulk deletion)
        print(f"\n4. Bulk deleting {len(test_user_ids)} users...")
        deleted_count = 0
        failed_count = 0
        
        for user_id in test_user_ids:
            delete_response = client.delete(f'/api/users/{user_id}', headers=headers)
            if delete_response.status_code == 200:
                deleted_count += 1
                print(f"✓ Deleted user {user_id}")
            else:
                failed_count += 1
                print(f"❌ Failed to delete user {user_id}: {delete_response.status_code}")
        
        print(f"\n   Deleted: {deleted_count}/{len(test_user_ids)}")
        print(f"   Failed: {failed_count}/{len(test_user_ids)}")
        
        # Verify deletion
        print("\n5. Verifying bulk deletion...")
        users_response = client.get('/api/users', headers=headers)
        final_count = len(users_response.json)
        
        remaining_test_users = [u for u in users_response.json if u['username'].startswith('test_bulk_')]
        
        if len(remaining_test_users) > 0:
            print(f"❌ {len(remaining_test_users)} users still exist!")
            for u in remaining_test_users:
                print(f"   - {u['username']} (ID: {u['id']})")
            return False
        
        print(f"✓ All test users removed from database")
        print(f"✓ User count: {initial_count} → {initial_count + 3} → {final_count}")
        
        if final_count == initial_count:
            print("\n✅ BULK USER DELETION: PASSED")
            return True
        else:
            print(f"\n❌ BULK USER DELETION: FAILED (count mismatch)")
            return False


def test_deletion_permissions():
    """Test deletion permission checks"""
    print("\n\n" + "=" * 80)
    print("TEST 3: DELETION PERMISSION CHECKS")
    print("=" * 80)
    
    with app.test_client() as client:
        # Login
        login = client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
        token = login.json['token']
        headers = {'Authorization': f'Bearer {token}'}
        
        print("\n1. Testing admin user deletion protection...")
        # Try to delete admin user
        admin_user = User.query.filter_by(username='admin').first()
        delete_response = client.delete(f'/api/users/{admin_user.id}', headers=headers)
        
        if delete_response.status_code == 400:
            print("✓ Admin user deletion blocked correctly")
            print(f"   Error message: {delete_response.json.get('error')}")
        else:
            print(f"❌ Admin user deletion should be blocked!")
            return False
        
        print("\n2. Testing self-deletion protection...")
        current_user_response = client.get('/api/auth/me', headers=headers)
        current_user_id = current_user_response.json['id']
        
        delete_response = client.delete(f'/api/users/{current_user_id}', headers=headers)
        
        if delete_response.status_code == 400:
            print("✓ Self-deletion blocked correctly")
            print(f"   Error message: {delete_response.json.get('error')}")
        else:
            print(f"❌ Self-deletion should be blocked!")
            return False
        
        print("\n✅ PERMISSION CHECKS: PASSED")
        return True


def main():
    """Run all tests"""
    print("\n")
    print("╔" + "═" * 78 + "╗")
    print("║" + " " * 20 + "USER DELETION COMPLETE TEST" + " " * 31 + "║")
    print("╚" + "═" * 78 + "╝")
    
    results = []
    
    # Test 1: Single user deletion
    try:
        result1 = test_single_user_deletion()
        results.append(("Single User Deletion", result1))
    except Exception as e:
        print(f"\n❌ Test 1 failed with exception: {e}")
        import traceback
        traceback.print_exc()
        results.append(("Single User Deletion", False))
    
    # Test 2: Bulk user deletion
    try:
        result2 = test_bulk_user_deletion()
        results.append(("Bulk User Deletion", result2))
    except Exception as e:
        print(f"\n❌ Test 2 failed with exception: {e}")
        import traceback
        traceback.print_exc()
        results.append(("Bulk User Deletion", False))
    
    # Test 3: Permission checks
    try:
        result3 = test_deletion_permissions()
        results.append(("Permission Checks", result3))
    except Exception as e:
        print(f"\n❌ Test 3 failed with exception: {e}")
        import traceback
        traceback.print_exc()
        results.append(("Permission Checks", False))
    
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
        print("\nUser deletion functionality is working correctly!")
        print("- Single user deletion: Working")
        print("- Bulk user deletion: Working")
        print("- Permission checks: Working")
        return 0
    else:
        print("❌ SOME TESTS FAILED")
        print("=" * 80)
        return 1


if __name__ == '__main__':
    sys.exit(main())
