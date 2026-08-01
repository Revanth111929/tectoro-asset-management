#!/usr/bin/env python3
"""
Comprehensive Database Verification Script
Checks: Connection, Schema, Queries, Relationships, Data Validation, Duplicates, Indexes, Performance
"""

import os
import sys
import sqlite3
from datetime import datetime
from collections import defaultdict

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import db, Asset, User, Employee, AuditLog, ActivityLog, AssetLifecycle, TemporaryAssignment, AssetReplacement, EmployeeExit, EmailConfig, Onboarding
from flask import Flask
from dotenv import load_dotenv

load_dotenv()

from db_config import resolve_database_uri, DatabaseConfigError

basedir = os.path.dirname(os.path.abspath(__file__))

# Initialize Flask app
app = Flask(__name__)
try:
    _db_uri, _app_env = resolve_database_uri(basedir)
except DatabaseConfigError as exc:
    raise SystemExit(str(exc))
app.config['SQLALCHEMY_DATABASE_URI'] = _db_uri
print(f"Environment: {_app_env}")
print(f"Database: {_db_uri.replace('sqlite:///', '')}")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

class DatabaseVerifier:
    def __init__(self):
        self.issues = []
        self.warnings = []
        self.successes = []
        self.db_path = os.path.join(os.path.dirname(__file__), 'assets.db')
        
    def log_issue(self, category, message):
        self.issues.append(f"[{category}] {message}")
        
    def log_warning(self, category, message):
        self.warnings.append(f"[{category}] {message}")
        
    def log_success(self, category, message):
        self.successes.append(f"[{category}] {message}")
    
    def print_header(self, title):
        print("\n" + "=" * 70)
        print(f"  {title}")
        print("=" * 70)
    
    def print_results(self, category):
        if self.issues:
            print(f"\n❌ ISSUES FOUND ({len(self.issues)}):")
            for issue in self.issues[-5:]:  # Show last 5
                print(f"  {issue}")
        if self.warnings:
            print(f"\n⚠️  WARNINGS ({len(self.warnings)}):")
            for warning in self.warnings[-5:]:  # Show last 5
                print(f"  {warning}")
        if self.successes:
            print(f"\n✅ CHECKS PASSED ({len(self.successes)}):")
            for success in self.successes[-5:]:  # Show last 5
                print(f"  {success}")
    
    def verify_connection(self):
        """Verify database connection and accessibility"""
        self.print_header("1. DATABASE CONNECTION VERIFICATION")
        
        try:
            # Check if database file exists
            if not os.path.exists(self.db_path):
                self.log_issue("CONNECTION", f"Database file not found: {self.db_path}")
                return False
            self.log_success("CONNECTION", f"Database file found: {self.db_path}")
            
            # Check file permissions
            if not os.access(self.db_path, os.R_OK):
                self.log_issue("CONNECTION", "Database file is not readable")
                return False
            if not os.access(self.db_path, os.W_OK):
                self.log_warning("CONNECTION", "Database file is not writable")
            self.log_success("CONNECTION", "Database file has proper permissions")
            
            # Check file size
            size = os.path.getsize(self.db_path)
            size_mb = size / (1024 * 1024)
            self.log_success("CONNECTION", f"Database size: {size_mb:.2f} MB")
            
            if size_mb > 100:
                self.log_warning("CONNECTION", f"Database is large ({size_mb:.2f} MB) - consider archiving old data")
            
            # Test SQLAlchemy connection
            with app.app_context():
                result = db.session.execute(db.text("SELECT 1")).scalar()
                if result == 1:
                    self.log_success("CONNECTION", "SQLAlchemy connection successful")
                else:
                    self.log_issue("CONNECTION", "SQLAlchemy connection test failed")
                    return False
            
            # Test direct SQLite connection
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT sqlite_version()")
            version = cursor.fetchone()[0]
            self.log_success("CONNECTION", f"SQLite version: {version}")
            conn.close()
            
            return True
            
        except Exception as e:
            self.log_issue("CONNECTION", f"Connection error: {e}")
            return False
    
    def verify_schema(self):
        """Verify database schema consistency"""
        self.print_header("2. SCHEMA CONSISTENCY VERIFICATION")
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get all tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            tables = [row[0] for row in cursor.fetchall()]
            
            expected_tables = [
                'users', 'assets', 'employees', 'audit_logs', 'activity_logs',
                'asset_lifecycle', 'temporary_assignments', 'asset_replacements',
                'employee_exits', 'exit_asset_collection', 'email_config',
                'onboarding', 'onboarding_asset_assignments'
            ]
            
            # Check for expected tables
            for table in expected_tables:
                if table in tables:
                    self.log_success("SCHEMA", f"Table '{table}' exists")
                else:
                    self.log_issue("SCHEMA", f"Missing table: {table}")
            
            # Check for unexpected tables
            for table in tables:
                if table not in expected_tables and not table.startswith('sqlite_'):
                    self.log_warning("SCHEMA", f"Unexpected table found: {table}")
            
            # Verify critical columns in key tables
            critical_checks = {
                'assets': ['id', 'serial_number', 'asset_name', 'category', 'status', 'emp_id', 'employee_name'],
                'employees': ['emp_id', 'employee_name', 'email', 'designation', 'status'],
                'users': ['id', 'username', 'password_hash', 'role', 'email'],
                'audit_logs': ['id', 'timestamp', 'action_type', 'module', 'performed_by'],
            }
            
            for table, columns in critical_checks.items():
                if table in tables:
                    cursor.execute(f"PRAGMA table_info({table})")
                    table_columns = [row[1] for row in cursor.fetchall()]
                    
                    for col in columns:
                        if col in table_columns:
                            self.log_success("SCHEMA", f"{table}.{col} exists")
                        else:
                            self.log_issue("SCHEMA", f"Missing column: {table}.{col}")
            
            conn.close()
            
        except Exception as e:
            self.log_issue("SCHEMA", f"Schema verification error: {e}")
    
    def verify_indexes(self):
        """Verify database indexes"""
        self.print_header("3. INDEX VERIFICATION")
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get all indexes
            cursor.execute("SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'")
            indexes = cursor.fetchall()
            
            print(f"\nFound {len(indexes)} indexes:")
            
            expected_indexes = {
                'assets': ['emp_id', 'employee_name', 'asset_name', 'category', 'serial_number', 'status'],
                'employees': ['emp_id', 'employee_name', 'email'],
                'audit_logs': ['timestamp', 'action_type', 'asset_id', 'employee_id'],
            }
            
            # Check for expected indexes
            for table, columns in expected_indexes.items():
                for column in columns:
                    # Check if any index exists for this column
                    cursor.execute(f"PRAGMA index_list({table})")
                    table_indexes = cursor.fetchall()
                    
                    found = False
                    for idx in table_indexes:
                        idx_name = idx[1]
                        cursor.execute(f"PRAGMA index_info({idx_name})")
                        idx_columns = [row[2] for row in cursor.fetchall()]
                        if column in idx_columns:
                            found = True
                            break
                    
                    if found:
                        self.log_success("INDEX", f"Index exists for {table}.{column}")
                    else:
                        self.log_warning("INDEX", f"Missing index for {table}.{column}")
            
            conn.close()
            
        except Exception as e:
            self.log_issue("INDEX", f"Index verification error: {e}")
    
    def verify_data_integrity(self):
        """Verify data integrity and relationships"""
        self.print_header("4. DATA INTEGRITY VERIFICATION")
        
        try:
            with app.app_context():
                # Check for orphaned records
                # Assets with invalid employee IDs
                orphaned_assets = Asset.query.filter(
                    Asset.emp_id != '',
                    Asset.emp_id.isnot(None)
                ).all()
                
                for asset in orphaned_assets:
                    emp = Employee.query.filter_by(emp_id=asset.emp_id).first()
                    if not emp:
                        self.log_warning("INTEGRITY", f"Asset {asset.id} references non-existent employee {asset.emp_id}")
                
                self.log_success("INTEGRITY", f"Checked {len(orphaned_assets)} assigned assets for employee references")
                
                # Check for audit logs with invalid asset IDs
                audit_logs = AuditLog.query.filter(AuditLog.asset_id.isnot(None)).limit(100).all()
                for log in audit_logs:
                    asset = Asset.query.get(log.asset_id)
                    if not asset:
                        self.log_warning("INTEGRITY", f"Audit log {log.id} references deleted asset {log.asset_id}")
                
                self.log_success("INTEGRITY", f"Checked {len(audit_logs)} audit logs for asset references")
                
                # Check temporary assignments
                temp_assignments = TemporaryAssignment.query.all()
                for assignment in temp_assignments:
                    if assignment.original_asset_id:
                        asset = Asset.query.get(assignment.original_asset_id)
                        if not asset:
                            self.log_warning("INTEGRITY", f"Temp assignment {assignment.id} references deleted original asset")
                    
                    if assignment.temp_asset_id:
                        asset = Asset.query.get(assignment.temp_asset_id)
                        if not asset:
                            self.log_warning("INTEGRITY", f"Temp assignment {assignment.id} references deleted temp asset")
                
                self.log_success("INTEGRITY", f"Checked {len(temp_assignments)} temporary assignments")
                
        except Exception as e:
            self.log_issue("INTEGRITY", f"Data integrity check error: {e}")
    
    def verify_duplicates(self):
        """Check for duplicate records"""
        self.print_header("5. DUPLICATE RECORDS CHECK")
        
        try:
            with app.app_context():
                # Check for duplicate serial numbers
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT serial_number, COUNT(*) as count 
                    FROM assets 
                    GROUP BY serial_number 
                    HAVING count > 1
                """)
                duplicate_serials = cursor.fetchall()
                
                if duplicate_serials:
                    for serial, count in duplicate_serials:
                        self.log_issue("DUPLICATES", f"Duplicate serial number: {serial} ({count} occurrences)")
                else:
                    self.log_success("DUPLICATES", "No duplicate serial numbers found")
                
                # Check for duplicate usernames
                cursor.execute("""
                    SELECT username, COUNT(*) as count 
                    FROM users 
                    GROUP BY username 
                    HAVING count > 1
                """)
                duplicate_users = cursor.fetchall()
                
                if duplicate_users:
                    for username, count in duplicate_users:
                        self.log_issue("DUPLICATES", f"Duplicate username: {username} ({count} occurrences)")
                else:
                    self.log_success("DUPLICATES", "No duplicate usernames found")
                
                # Check for duplicate employee IDs
                cursor.execute("""
                    SELECT emp_id, COUNT(*) as count 
                    FROM employees 
                    GROUP BY emp_id 
                    HAVING count > 1
                """)
                duplicate_employees = cursor.fetchall()
                
                if duplicate_employees:
                    for emp_id, count in duplicate_employees:
                        self.log_issue("DUPLICATES", f"Duplicate employee ID: {emp_id} ({count} occurrences)")
                else:
                    self.log_success("DUPLICATES", "No duplicate employee IDs found")
                
                conn.close()
                
        except Exception as e:
            self.log_issue("DUPLICATES", f"Duplicate check error: {e}")
    
    def verify_queries(self):
        """Test common queries for performance and correctness"""
        self.print_header("6. QUERY PERFORMANCE VERIFICATION")
        
        try:
            with app.app_context():
                import time
                
                # Test 1: Get all assets
                start = time.time()
                assets = Asset.query.all()
                elapsed = time.time() - start
                self.log_success("QUERY", f"Get all assets: {len(assets)} records in {elapsed*1000:.2f}ms")
                if elapsed > 1.0:
                    self.log_warning("QUERY", "Asset query took > 1 second")
                
                # Test 2: Filter assets by status
                start = time.time()
                available = Asset.query.filter_by(status='Available').all()
                elapsed = time.time() - start
                self.log_success("QUERY", f"Filter by status: {len(available)} records in {elapsed*1000:.2f}ms")
                
                # Test 3: Search employees
                start = time.time()
                employees = Employee.query.filter(Employee.employee_name.like('%Rev%')).all()
                elapsed = time.time() - start
                self.log_success("QUERY", f"Employee search: {len(employees)} records in {elapsed*1000:.2f}ms")
                
                # Test 4: Get audit logs
                start = time.time()
                logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(100).all()
                elapsed = time.time() - start
                self.log_success("QUERY", f"Recent audit logs: {len(logs)} records in {elapsed*1000:.2f}ms")
                
                # Test 5: Complex join query
                start = time.time()
                result = db.session.execute(db.text("""
                    SELECT COUNT(*) FROM assets WHERE status = 'Assigned'
                """)).scalar()
                elapsed = time.time() - start
                self.log_success("QUERY", f"Count assigned assets: {result} in {elapsed*1000:.2f}ms")
                
        except Exception as e:
            self.log_issue("QUERY", f"Query test error: {e}")
    
    def verify_data_validation(self):
        """Verify data validation rules"""
        self.print_header("7. DATA VALIDATION VERIFICATION")
        
        try:
            with app.app_context():
                # Check for assets with empty serial numbers
                invalid_assets = Asset.query.filter(
                    db.or_(
                        Asset.serial_number == '',
                        Asset.serial_number.is_(None)
                    )
                ).all()
                
                if invalid_assets:
                    self.log_issue("VALIDATION", f"Found {len(invalid_assets)} assets with empty serial numbers")
                else:
                    self.log_success("VALIDATION", "All assets have serial numbers")
                
                # Check for users with empty passwords
                invalid_users = User.query.filter(
                    db.or_(
                        User.password_hash == '',
                        User.password_hash.is_(None)
                    )
                ).all()
                
                if invalid_users:
                    self.log_issue("VALIDATION", f"Found {len(invalid_users)} users with empty passwords")
                else:
                    self.log_success("VALIDATION", "All users have passwords")
                
                # Check for employees with empty emp_id
                invalid_employees = Employee.query.filter(
                    db.or_(
                        Employee.emp_id == '',
                        Employee.emp_id.is_(None)
                    )
                ).all()
                
                if invalid_employees:
                    self.log_issue("VALIDATION", f"Found {len(invalid_employees)} employees with empty IDs")
                else:
                    self.log_success("VALIDATION", "All employees have IDs")
                
                # Check for invalid status values
                valid_statuses = ['Available', 'Assigned', 'Maintenance', 'Retired', 'Under Repair', 'Temporary Assignment']
                invalid_status_assets = Asset.query.filter(
                    Asset.status.notin_(valid_statuses)
                ).all()
                
                if invalid_status_assets:
                    statuses = set(a.status for a in invalid_status_assets)
                    self.log_warning("VALIDATION", f"Found assets with non-standard status: {statuses}")
                else:
                    self.log_success("VALIDATION", "All assets have valid status values")
                
        except Exception as e:
            self.log_issue("VALIDATION", f"Validation check error: {e}")
    
    def generate_report(self):
        """Generate comprehensive report"""
        self.print_header("DATABASE VERIFICATION SUMMARY")
        
        total_checks = len(self.issues) + len(self.warnings) + len(self.successes)
        
        print(f"\nTotal Checks: {total_checks}")
        print(f"✅ Passed: {len(self.successes)}")
        print(f"⚠️  Warnings: {len(self.warnings)}")
        print(f"❌ Issues: {len(self.issues)}")
        
        if self.issues:
            print(f"\n{'='*70}")
            print("CRITICAL ISSUES REQUIRING ATTENTION:")
            print(f"{'='*70}")
            for issue in self.issues:
                print(f"  {issue}")
        
        if self.warnings:
            print(f"\n{'='*70}")
            print("WARNINGS (Non-Critical):")
            print(f"{'='*70}")
            for warning in self.warnings:
                print(f"  {warning}")
        
        # Overall status
        print(f"\n{'='*70}")
        if len(self.issues) == 0:
            print("✅ DATABASE STATUS: HEALTHY")
            if len(self.warnings) > 0:
                print(f"   ({len(self.warnings)} warnings - review recommended)")
        else:
            print(f"❌ DATABASE STATUS: NEEDS ATTENTION ({len(self.issues)} issues)")
        print(f"{'='*70}")
        
        return len(self.issues) == 0

def main():
    print("=" * 70)
    print("  TECTORO ASSET MANAGEMENT - DATABASE VERIFICATION")
    print("=" * 70)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    verifier = DatabaseVerifier()
    
    # Run all verification checks
    verifier.verify_connection()
    verifier.print_results("CONNECTION")
    
    verifier.verify_schema()
    verifier.print_results("SCHEMA")
    
    verifier.verify_indexes()
    verifier.print_results("INDEX")
    
    verifier.verify_data_integrity()
    verifier.print_results("INTEGRITY")
    
    verifier.verify_duplicates()
    verifier.print_results("DUPLICATES")
    
    verifier.verify_queries()
    verifier.print_results("QUERY")
    
    verifier.verify_data_validation()
    verifier.print_results("VALIDATION")
    
    # Generate final report
    is_healthy = verifier.generate_report()
    
    print(f"\nCompleted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return 0 if is_healthy else 1

if __name__ == '__main__':
    sys.exit(main())
