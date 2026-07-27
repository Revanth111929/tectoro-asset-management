#!/usr/bin/env python3
"""
Test All API Endpoints

This script tests all major API endpoints to verify data is fetching correctly.
"""

import requests
import json

BASE_URL = "http://192.168.20.180:3000/api"

def test_endpoint(name, url, requires_auth=False):
    """Test a single endpoint"""
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"✅ {name}: {len(data)} records")
            elif isinstance(data, dict):
                if 'assets' in data:
                    print(f"✅ {name}: {len(data['assets'])} assets")
                elif 'totalAssets' in data:
                    print(f"✅ {name}: {data['totalAssets']} total assets")
                else:
                    print(f"✅ {name}: OK (dict with {len(data)} keys)")
            else:
                print(f"✅ {name}: OK")
            return True
        elif response.status_code == 401:
            print(f"🔒 {name}: Requires authentication")
            return False
        elif response.status_code == 404:
            print(f"❌ {name}: Not found (404)")
            return False
        else:
            print(f"⚠️  {name}: HTTP {response.status_code}")
            return False
    except requests.exceptions.Timeout:
        print(f"⏱️  {name}: Timeout")
        return False
    except requests.exceptions.ConnectionError:
        print(f"❌ {name}: Connection error")
        return False
    except Exception as e:
        print(f"❌ {name}: {str(e)}")
        return False

print("🧪 Testing All API Endpoints")
print("=" * 60)

# Test authentication endpoints
print("\n📋 Authentication Endpoints:")
print("-" * 60)
test_endpoint("Auth Me", f"{BASE_URL}/auth/me", requires_auth=True)

# Test dashboard endpoints
print("\n📊 Dashboard Endpoints:")
print("-" * 60)
test_endpoint("Dashboard Stats", f"{BASE_URL}/dashboard/stats")
test_endpoint("Dashboard Activity", f"{BASE_URL}/dashboard/activity")
test_endpoint("Lifecycle Stats", f"{BASE_URL}/dashboard/lifecycle-stats")

# Test asset endpoints
print("\n📦 Asset Endpoints:")
print("-" * 60)
test_endpoint("All Assets", f"{BASE_URL}/assets")
test_endpoint("Search Assets", f"{BASE_URL}/assets?search=Dell")
test_endpoint("Expiring Warranties", f"{BASE_URL}/assets/warranty/expiring")

# Test employee endpoints
print("\n👥 Employee Endpoints:")
print("-" * 60)
test_endpoint("All Employees", f"{BASE_URL}/employees")
test_endpoint("Search Employees (Raj)", f"{BASE_URL}/employees?q=Raj")
test_endpoint("Search Employees (Suresh)", f"{BASE_URL}/employees?q=Suresh")
test_endpoint("Get Employee TT002", f"{BASE_URL}/employees/TT002")

# Test onboarding endpoints
print("\n🆕 Onboarding Endpoints:")
print("-" * 60)
test_endpoint("All Onboarding", f"{BASE_URL}/onboarding")

# Test report endpoints
print("\n📈 Report Endpoints:")
print("-" * 60)
test_endpoint("Activity Log", f"{BASE_URL}/reports/activity")

# Test static files
print("\n🖼️  Static Files:")
print("-" * 60)
try:
    response = requests.get("http://192.168.20.180:3000/static/media/tectoro-login-logo.cac63a34d48239d7957e.png", timeout=5)
    if response.status_code == 200:
        print(f"✅ Login Logo: OK ({len(response.content)} bytes)")
    else:
        print(f"❌ Login Logo: HTTP {response.status_code}")
except:
    print(f"❌ Login Logo: Error")

try:
    response = requests.get("http://192.168.20.180:3000/static/media/tectoro-icon-only.29253f2e57ef6301c8d5.png", timeout=5)
    if response.status_code == 200:
        print(f"✅ Icon Logo: OK ({len(response.content)} bytes)")
    else:
        print(f"❌ Icon Logo: HTTP {response.status_code}")
except:
    print(f"❌ Icon Logo: Error")

print("\n" + "=" * 60)
print("✅ Test complete!")
print("\n💡 If you see 🔒 (Requires authentication), you need to:")
print("   1. Open http://192.168.20.180:3000 in your browser")
print("   2. Login with your credentials")
print("   3. Then the data will load properly")
