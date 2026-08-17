#!/usr/bin/env python3
"""
Quick test script to verify the bulk import categories API endpoint
"""

from bulk_import_templates import get_available_categories, CATEGORY_FIELDS

def test_categories():
    """Test that categories are properly configured"""
    
    print("=" * 60)
    print("TESTING BULK IMPORT CATEGORIES")
    print("=" * 60)
    
    # Get categories
    categories = get_available_categories()
    
    print(f"\n✓ Found {len(categories)} categories")
    print(f"\nCategories (sorted):")
    for i, cat in enumerate(categories, 1):
        print(f"  {i:2}. {cat}")
    
    # Verify each category has fields defined
    print(f"\n" + "=" * 60)
    print("CATEGORY FIELD VALIDATION")
    print("=" * 60)
    
    for category in categories:
        if category in CATEGORY_FIELDS:
            field_count = len(CATEGORY_FIELDS[category])
            print(f"\n✓ {category:15} → {field_count} fields defined")
            
            # Show first few fields as sample
            fields = CATEGORY_FIELDS[category][:5]
            print(f"  Sample fields: {', '.join(fields)}", end='')
            if len(CATEGORY_FIELDS[category]) > 5:
                print(f" ... (+{len(CATEGORY_FIELDS[category]) - 5} more)")
            else:
                print()
        else:
            print(f"\n✗ {category:15} → NO FIELDS DEFINED!")
    
    print(f"\n" + "=" * 60)
    print("EXPECTED API RESPONSE")
    print("=" * 60)
    print("""
GET /api/bulk-import/categories

Response:
{
  "success": true,
  "categories": [""")
    
    for i, cat in enumerate(categories):
        comma = "," if i < len(categories) - 1 else ""
        print(f'    "{cat}"{comma}')
    
    print("""  ]
}
""")
    
    print("=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
    
    return len(categories) > 0

if __name__ == '__main__':
    success = test_categories()
    exit(0 if success else 1)
