#!/usr/bin/env python3
"""
Verify that frontend and backend categories are in sync for Import Excel
"""

from bulk_import_templates import CATEGORY_FIELDS

print("=" * 70)
print("CATEGORY SYNC VERIFICATION")
print("=" * 70)

backend_categories = sorted(CATEGORY_FIELDS.keys())
print(f"\n📦 Backend Categories ({len(backend_categories)}):")
for i, cat in enumerate(backend_categories, 1):
    print(f"  {i:2}. {cat}")

# Frontend categories (from categoryFields.js)
frontend_all = ['Laptop', 'Desktop', 'Monitor', 'Printer', 'Phone', 'Server', 
                'Mouse', 'Headphones', 'Hard Disk', 'UPS', 'Laptop Bag', 'Other']
frontend_importable = [c for c in frontend_all if c not in ['Laptop Bag', 'Other']]

print(f"\n🎨 Frontend All Categories ({len(frontend_all)}):")
for i, cat in enumerate(frontend_all, 1):
    status = "❌ No template" if cat in ['Laptop Bag', 'Other'] else "✅ Importable"
    print(f"  {i:2}. {cat:15} - {status}")

print(f"\n✅ Frontend Importable Categories ({len(frontend_importable)}):")
for i, cat in enumerate(sorted(frontend_importable), 1):
    print(f"  {i:2}. {cat}")

# Check for mismatches
print(f"\n" + "=" * 70)
print("SYNC CHECK")
print("=" * 70)

backend_set = set(backend_categories)
frontend_set = set(frontend_importable)

# Categories in frontend but not backend
frontend_only = frontend_set - backend_set
if frontend_only:
    print(f"\n⚠️  Categories in FRONTEND but NOT in BACKEND:")
    for cat in sorted(frontend_only):
        print(f"  - {cat}")
else:
    print(f"\n✅ All frontend importable categories have backend templates")

# Categories in backend but not frontend
backend_only = backend_set - frontend_set
if backend_only:
    print(f"\n⚠️  Categories in BACKEND but NOT in FRONTEND:")
    for cat in sorted(backend_only):
        print(f"  - {cat}")
    print(f"  Note: These templates exist but won't appear in Import Excel dropdown")
else:
    print(f"\n✅ All backend categories are available in frontend")

# Common categories
common = backend_set & frontend_set
print(f"\n✅ Common Categories ({len(common)}) - These work in Import Excel:")
for i, cat in enumerate(sorted(common), 1):
    print(f"  {i:2}. {cat}")

print(f"\n" + "=" * 70)
if frontend_only or backend_only:
    print("⚠️  WARNING: Categories are out of sync!")
    if 'CPU' in backend_only:
        print("  Note: 'CPU' in backend is legacy, 'Desktop' is used instead")
else:
    print("✅ SUCCESS: Categories are in perfect sync!")
print("=" * 70)
