#!/usr/bin/env python3
"""
Database Integrity Check
Verifies no orphan records, invalid foreign keys, or impossible states exist
"""

from models import db, Asset, Employee, AuditLog, AssetLifecycle, TemporaryAssignment, AssetReplacement, ExitAssetCollection, OnboardingAssetAssignment, AssetRepair, RepairPart
from api_server import app

def check_integrity():
    with app.app_context():
        issues = []
        
        print("=" * 60)
        print("DATABASE INTEGRITY CHECK")
        print("=" * 60)
        
        # 1. Check for Assigned assets without employees
        print("\n1. Checking Assigned assets without employees...")
        orphan_assigned = Asset.query.filter(
            Asset.status == 'Assigned',
            db.or_(Asset.emp_id == '', Asset.emp_id == None)
        ).all()
        
        if orphan_assigned:
            for asset in orphan_assigned:
                issues.append(f"Asset {asset.id} ({asset.asset_name}): Status='Assigned' but no employee")
        else:
            print("   ✓ No orphan assigned assets")
        
        # 2. Check for Available assets with employees
        print("\n2. Checking Available assets with employees...")
        invalid_available = Asset.query.filter(
            Asset.status == 'Available',
            Asset.emp_id != '',
            Asset.emp_id != None
        ).all()
        
        if invalid_available:
            for asset in invalid_available:
                issues.append(f"Asset {asset.id} ({asset.asset_name}): Status='Available' but has emp_id={asset.emp_id}")
        else:
            print("   ✓ No available assets with employees")
        
        # 3. Check for assets assigned to non-existent employees
        print("\n3. Checking assets assigned to non-existent employees...")
        assigned_assets = Asset.query.filter(Asset.emp_id != '', Asset.emp_id != None).all()
        
        for asset in assigned_assets:
            emp = Employee.query.filter_by(emp_id=asset.emp_id).first()
            if not emp:
                issues.append(f"Asset {asset.id} ({asset.asset_name}): Assigned to non-existent employee {asset.emp_id}")
        
        if not issues:
            print(f"   ✓ All {len(assigned_assets)} assigned assets have valid employees")
        
        # 4. Check for assets assigned to inactive employees
        print("\n4. Checking assets assigned to inactive employees...")
        inactive_count = 0
        for asset in assigned_assets:
            emp = Employee.query.filter_by(emp_id=asset.emp_id).first()
            if emp and (not emp.is_active or emp.status != 'Active'):
                issues.append(f"Asset {asset.id} ({asset.asset_name}): Assigned to inactive employee {asset.emp_id} (status={emp.status})")
                inactive_count += 1
        
        if inactive_count == 0:
            print(f"   ✓ All assigned assets have active employees")
        
        # 5. Check for temporary assignments with invalid assets
        print("\n5. Checking temporary assignments...")
        temp_assignments = TemporaryAssignment.query.all()
        
        for ta in temp_assignments:
            orig = Asset.query.get(ta.original_asset_id)
            temp = Asset.query.get(ta.temp_asset_id)
            
            if not orig:
                issues.append(f"TempAssignment {ta.id}: Original asset {ta.original_asset_id} does not exist")
            if not temp:
                issues.append(f"TempAssignment {ta.id}: Temp asset {ta.temp_asset_id} does not exist")
        
        if not issues:
            print(f"   ✓ All {len(temp_assignments)} temporary assignments have valid assets")
        
        # 6. Check for asset replacements with invalid assets
        print("\n6. Checking asset replacements...")
        replacements = AssetReplacement.query.all()
        
        for repl in replacements:
            if repl.old_asset_id:
                old = Asset.query.get(repl.old_asset_id)
                if not old:
                    issues.append(f"Replacement {repl.id}: Old asset {repl.old_asset_id} does not exist")
            
            if repl.new_asset_id:
                new = Asset.query.get(repl.new_asset_id)
                if not new:
                    issues.append(f"Replacement {repl.id}: New asset {repl.new_asset_id} does not exist")
        
        if not issues:
            print(f"   ✓ All {len(replacements)} replacements have valid assets")
        
        # 7. Check for repairs with invalid assets
        print("\n7. Checking asset repairs...")
        repairs = AssetRepair.query.all()
        
        for repair in repairs:
            asset = Asset.query.get(repair.asset_id)
            if not asset:
                issues.append(f"Repair {repair.id} ({repair.repair_number}): Asset {repair.asset_id} does not exist")
        
        if not issues:
            print(f"   ✓ All {len(repairs)} repairs have valid assets")
        
        # 8. Check for audit logs with invalid asset_id (should be NULL, not dangling)
        print("\n8. Checking audit logs...")
        audit_logs = AuditLog.query.filter(AuditLog.asset_id != None).all()
        
        dangling_audits = 0
        for log in audit_logs:
            asset = Asset.query.get(log.asset_id)
            if not asset:
                dangling_audits += 1
        
        if dangling_audits > 0:
            issues.append(f"Found {dangling_audits} audit logs referencing deleted assets (should be NULL)")
        else:
            print(f"   ✓ All {len(audit_logs)} audit logs have valid asset references")
        
        # 9. Check for duplicate serial numbers
        print("\n9. Checking for duplicate serial numbers...")
        from sqlalchemy import func
        duplicates = db.session.query(
            Asset.serial_number,
            func.count(Asset.id).label('count')
        ).group_by(Asset.serial_number).having(func.count(Asset.id) > 1).all()
        
        if duplicates:
            for serial, count in duplicates:
                issues.append(f"Duplicate serial number '{serial}' found on {count} assets")
        else:
            print("   ✓ No duplicate serial numbers")
        
        # Summary
        print("\n" + "=" * 60)
        if issues:
            print(f"❌ INTEGRITY CHECK FAILED: {len(issues)} issues found")
            print("=" * 60)
            for issue in issues:
                print(f"  • {issue}")
        else:
            print("✅ INTEGRITY CHECK PASSED: No issues found")
            print("=" * 60)
        
        return len(issues) == 0

if __name__ == '__main__':
    success = check_integrity()
    exit(0 if success else 1)
