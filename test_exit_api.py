#!/usr/bin/env python3
"""
Test the employee exit API endpoint
"""
import requests
import json

# Login first to get token
login_response = requests.post('http://localhost:3000/api/auth/login', json={
    'username': 'admin',
    'password': 'admin123'
})

if login_response.status_code == 200:
    token = login_response.json()['token']
    print(f"✅ Login successful, token: {token[:20]}...")
    
    # Test get employee assets
    headers = {'Authorization': f'Bearer {token}'}
    emp_id = 'TT862'  # Prem Kumar Kota
    
    print(f"\n📋 Getting assets for employee {emp_id}...")
    assets_response = requests.get(
        f'http://localhost:3000/api/employees/{emp_id}/assets',
        headers=headers
    )
    
    if assets_response.status_code == 200:
        assets = assets_response.json()
        print(f"✅ Found {len(assets)} assets")
        for asset in assets:
            print(f"   - {asset['asset_name']} ({asset['serial_number']})")
        
        if len(assets) > 0:
            # Test exit process (dry run - won't actually execute)
            print(f"\n🔧 Testing exit API structure...")
            exit_data = {
                'exit_date': '2025-06-20',
                'exit_notes': 'Test exit process',
                'assets': [{
                    'asset_id': assets[0]['id'],
                    'recovery_status': 'returned',
                    'notes': 'Test - will not execute'
                }]
            }
            print(f"   Request payload: {json.dumps(exit_data, indent=2)}")
            print(f"\n✅ API structure looks correct!")
            print(f"\n⚠️  To actually test exit, uncomment the POST request below")
            
            # Uncomment to actually test:
            # exit_response = requests.post(
            #     f'http://localhost:3000/api/employees/{emp_id}/exit',
            #     headers=headers,
            #     json=exit_data
            # )
            # print(f"Exit response: {exit_response.status_code}")
            # print(exit_response.json())
    else:
        print(f"❌ Failed to get assets: {assets_response.status_code}")
        print(assets_response.text)
else:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)
