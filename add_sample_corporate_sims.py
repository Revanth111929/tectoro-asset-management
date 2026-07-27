#!/usr/bin/env python3
"""
Add Sample Corporate SIM Data

This script adds sample SIM card data for testing.
"""

from app import create_app
from models import db, CorporateSIM
from datetime import date, timedelta

print("📱 Adding Sample Corporate SIM Data...")
print("=" * 60)

app = create_app()

with app.app_context():
    try:
        # Check if SIMs already exist
        existing = CorporateSIM.query.count()
        if existing > 0:
            print(f"⚠️  {existing} Corporate SIMs already exist.")
            response = input("Do you want to add more sample data? (y/n): ")
            if response.lower() != 'y':
                print("Aborted.")
                exit(0)
        
        # Sample SIM data
        sample_sims = [
            {
                'iccid': '8991012345678901234',
                'mobile_number': '9876543210',
                'carrier': 'Airtel',
                'plan_type': 'Postpaid',
                'monthly_cost': 599.00,
                'data_limit_gb': 50,
                'corporate_account': 'CORP-ACC-001',
                'account_manager': 'Ravi Kumar',
                'status': 'Assigned',
                'assigned_employee_id': 'TT001',
                'assigned_employee_name': 'Revanth Maddela',
                'assigned_employee_email': 'revanth4511@gmail.com',
                'assignment_date': date.today() - timedelta(days=30),
                'purchase_date': date.today() - timedelta(days=90),
                'activation_date': date.today() - timedelta(days=60),
                'vendor': 'Airtel Corporate Solutions',
                'sim_type': 'Nano',
                'puk_code': '12345678',
                'remarks': 'Primary SIM for employee',
                'created_by': 'admin'
            },
            {
                'iccid': '8991023456789012345',
                'mobile_number': '9876543211',
                'carrier': 'Jio',
                'plan_type': 'Postpaid',
                'monthly_cost': 499.00,
                'data_limit_gb': 75,
                'corporate_account': 'CORP-ACC-001',
                'account_manager': 'Priya Sharma',
                'status': 'Available',
                'purchase_date': date.today() - timedelta(days=60),
                'activation_date': date.today() - timedelta(days=50),
                'vendor': 'Reliance Jio Corporate',
                'sim_type': 'Nano',
                'puk_code': '23456789',
                'remarks': 'Spare SIM for new employees',
                'created_by': 'admin'
            },
            {
                'iccid': '8991034567890123456',
                'mobile_number': '9876543212',
                'carrier': 'Vi (Vodafone Idea)',
                'plan_type': 'Postpaid',
                'monthly_cost': 549.00,
                'data_limit_gb': 60,
                'corporate_account': 'CORP-ACC-002',
                'account_manager': 'Amit Patel',
                'status': 'Assigned',
                'assigned_employee_id': 'TT002',
                'assigned_employee_name': 'Rajini',
                'assigned_employee_email': 'revanth4511@gmail.com',
                'assignment_date': date.today() - timedelta(days=20),
                'purchase_date': date.today() - timedelta(days=80),
                'activation_date': date.today() - timedelta(days=70),
                'vendor': 'Vi Enterprise',
                'sim_type': 'Nano',
                'puk_code': '34567890',
                'remarks': 'Employee SIM card',
                'created_by': 'admin'
            },
            {
                'iccid': '8991045678901234567',
                'mobile_number': '9876543213',
                'carrier': 'Airtel',
                'plan_type': 'Prepaid',
                'monthly_cost': 299.00,
                'data_limit_gb': 25,
                'corporate_account': 'CORP-ACC-001',
                'account_manager': 'Ravi Kumar',
                'status': 'Available',
                'purchase_date': date.today() - timedelta(days=45),
                'activation_date': date.today() - timedelta(days=40),
                'vendor': 'Airtel Corporate Solutions',
                'sim_type': 'Nano',
                'puk_code': '45678901',
                'remarks': 'Backup SIM',
                'created_by': 'admin'
            },
            {
                'iccid': '8991056789012345678',
                'mobile_number': '9876543214',
                'carrier': 'BSNL',
                'plan_type': 'Postpaid',
                'monthly_cost': 399.00,
                'data_limit_gb': 40,
                'corporate_account': 'CORP-ACC-003',
                'account_manager': 'Sunita Reddy',
                'status': 'Suspended',
                'assigned_employee_id': 'TT927',
                'assigned_employee_name': 'Suresh Kumar Sasi Kumar',
                'assignment_date': date.today() - timedelta(days=100),
                'purchase_date': date.today() - timedelta(days=120),
                'activation_date': date.today() - timedelta(days=110),
                'vendor': 'BSNL Corporate',
                'sim_type': 'Micro',
                'puk_code': '56789012',
                'remarks': 'Suspended due to non-payment',
                'created_by': 'admin'
            },
            {
                'iccid': '8991067890123456789',
                'mobile_number': '',  # No number assigned yet
                'carrier': 'Jio',
                'plan_type': 'Postpaid',
                'monthly_cost': 699.00,
                'data_limit_gb': 100,
                'corporate_account': 'CORP-ACC-001',
                'account_manager': 'Priya Sharma',
                'status': 'Available',
                'purchase_date': date.today() - timedelta(days=10),
                'activation_date': date.today() - timedelta(days=5),
                'vendor': 'Reliance Jio Corporate',
                'sim_type': 'eSIM',
                'puk_code': '67890123',
                'remarks': 'New eSIM for management',
                'created_by': 'admin'
            },
        ]
        
        # Add SIMs to database
        added_count = 0
        for sim_data in sample_sims:
            # Check if ICCID already exists
            if CorporateSIM.query.filter_by(iccid=sim_data['iccid']).first():
                print(f"⚠️  SIM with ICCID {sim_data['iccid']} already exists, skipping...")
                continue
            
            sim = CorporateSIM(**sim_data)
            db.session.add(sim)
            added_count += 1
            print(f"✅ Added: {sim_data['iccid']} - {sim_data['carrier']} - {sim_data['status']}")
        
        db.session.commit()
        
        print("\n" + "=" * 60)
        print(f"✅ Added {added_count} sample Corporate SIMs!")
        
        # Show summary
        total = CorporateSIM.query.count()
        available = CorporateSIM.query.filter_by(status='Available').count()
        assigned = CorporateSIM.query.filter_by(status='Assigned').count()
        suspended = CorporateSIM.query.filter_by(status='Suspended').count()
        
        print(f"\n📊 Current Statistics:")
        print(f"   Total SIMs: {total}")
        print(f"   Available: {available}")
        print(f"   Assigned: {assigned}")
        print(f"   Suspended: {suspended}")
        
    except Exception as e:
        print(f"❌ Error adding sample data: {e}")
        import traceback
        traceback.print_exc()
