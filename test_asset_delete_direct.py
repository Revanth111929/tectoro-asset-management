#!/usr/bin/env python3
"""
Direct test of asset deletion API - simulates frontend behavior
"""
import requests
import json

API_BASE = 'http://192.168.20.180:5000/api'

def test_delete():
    print("=" * 60)
    print("ASSET DELETION TEST - Frontend Simulation")
    print("=" * 60)
    
    # Step 1: Login
    print("\n1. Logging in as admin...")
    login_resp = requests.post(f'{API_BASE}/auth/login', json={
        'username': 'admin',
        'password': 'admin123'
    })
    
    if login_resp.status_code != 200:
        print(f"❌ Login failed: {login_resp.status_code}")
        print(f"Response: {login_resp.text}")
        return
    
    login_data = login_resp.json()
    token = login_data.get('access_token') or login_data.get('token')
    print(f"✅ Login successful. Token: {token[:20]}...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Step 2: Check user info
    print("\n2. Checking user info...")
    me_resp = requests.get(f'{API_BASE}/auth/me', headers=headers)
    if me_resp.status_code == 200:
        user_data = me_resp.json()
        print(f"✅ User: {user_data['username']}, Role: {user_data['role']}")
    else:
        print(f"⚠️ Could not fetch user info: {me_resp.status_code}")
    
    # Step 3: Get assets
    print("\n3. Fetching assets...")
    assets_resp = requests.get(f'{API_BASE}/assets?per_page=5', headers=headers)
    
    if assets_resp.status_code != 200:
        print(f"❌ Failed to fetch assets: {assets_resp.status_code}")
        print(f"Response: {assets_resp.text}")
        return
    
    assets_data = assets_resp.json()
    assets = assets_data.get('assets', [])
    
    if not assets:
        print("⚠️ No assets available for testing")
        return
    
    print(f"✅ Found {len(assets)} assets:")
    for asset in assets[:3]:
        print(f"  - ID {asset['id']}: {asset['asset_name']} ({asset['serial_number']})")
    
    # Step 4: Test delete on first asset
    test_asset = assets[0]
    print(f"\n4. Testing DELETE on Asset ID {test_asset['id']}: {test_asset['asset_name']}")
    print(f"   URL: {API_BASE}/assets/{test_asset['id']}")
    print(f"   Method: DELETE")
    print(f"   Headers: Authorization: Bearer {token[:20]}...")
    
    # ASK USER FOR CONFIRMATION
    confirm = input(f"\n⚠️ This will ACTUALLY DELETE the asset. Continue? (type 'yes'): ")
    if confirm.lower() != 'yes':
        print("❌ Test cancelled by user")
        return
    
    # Perform delete
    print(f"\n5. Sending DELETE request...")
    delete_resp = requests.delete(f'{API_BASE}/assets/{test_asset["id"]}', headers=headers)
    
    print(f"   Status Code: {delete_resp.status_code}")
    print(f"   Response: {delete_resp.text}")
    
    if delete_resp.status_code == 200:
        print("\n✅ DELETE SUCCESSFUL!")
        print("The asset has been deleted.")
        
        # Verify deletion
        print("\n6. Verifying deletion...")
        verify_resp = requests.get(f'{API_BASE}/assets/{test_asset["id"]}', headers=headers)
        if verify_resp.status_code == 404:
            print("✅ Asset no longer exists (404)")
        else:
            print(f"⚠️ Unexpected status: {verify_resp.status_code}")
    else:
        print(f"\n❌ DELETE FAILED!")
        print(f"Status: {delete_resp.status_code}")
        print(f"Response: {delete_resp.text}")
        
        # Try to get more info
        try:
            error_data = delete_resp.json()
            print(f"Error details: {json.dumps(error_data, indent=2)}")
        except:
            pass

if __name__ == '__main__':
    test_delete()
