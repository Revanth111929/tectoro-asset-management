#!/usr/bin/env python3
"""Test the asset replacement endpoint directly"""

import requests
import json

BASE_URL = "http://localhost:3000/api"

# Login first
login_response = requests.post(f"{BASE_URL}/auth/login", json={
    "username": "admin",
    "password": "admin"
})

if login_response.status_code != 200:
    print(f"Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json().get("access_token")
print(f"✓ Logged in successfully, token: {token[:20]}...")

# Test replacement endpoint
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

payload = {
    "employee_id": "TT919",
    "employee_name": "Ajay Budidha",
    "employee_email": "Ajay.Budidha@tectoro.com",
    "old_asset_id": 22,
    "new_asset_id": 31,
    "reason": "Test replacement via script",
    "replacement_date": "2026-08-17",
    "old_asset_condition": "Good",
    "remarks": "Testing endpoint directly"
}

print("\n" + "="*60)
print("TESTING POST /api/asset-replacements")
print("="*60)
print("Payload:")
print(json.dumps(payload, indent=2))
print()

response = requests.post(f"{BASE_URL}/asset-replacements", 
                         json=payload, 
                         headers=headers)

print(f"Status Code: {response.status_code}")
print(f"Response:")
print(json.dumps(response.json(), indent=2))

if response.status_code == 201:
    print("\n✓ Replacement created successfully!")
else:
    print(f"\n✗ Replacement failed!")
