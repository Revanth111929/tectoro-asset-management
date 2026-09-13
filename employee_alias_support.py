"""
Employee Alias Support for Shared/Common Employee IDs
======================================================

This module provides support for Employee IDs that can have multiple names/aliases.

Examples of shared IDs:
- TT → Server Room, Fiddler, HR cabin
- DD → Drogo Drones

Normal employees (TT001, TT002, etc.) still have name conflict protection.
"""

from datetime import datetime
from sqlalchemy import text


class EmployeeAliasService:
    """Service for managing employee aliases for shared/common Employee IDs"""

    @staticmethod
    def is_shared_employee(db, emp_id):
        """Check if an employee ID is configured as shared/common"""
        query = text("SELECT is_shared FROM employees WHERE emp_id = :emp_id")
        result = db.session.execute(query, {'emp_id': emp_id}).fetchone()
        return result and result[0] == 1 if result else False

    @staticmethod
    def get_employee_aliases(db, emp_id):
        """Get all known aliases for an employee ID"""
        query = text("""
            SELECT alias_name
            FROM employee_aliases
            WHERE emp_id = :emp_id
            ORDER BY created_at
        """)
        results = db.session.execute(query, {'emp_id': emp_id}).fetchall()
        return [row[0] for row in results]

    @staticmethod
    def alias_exists(db, emp_id, alias_name):
        """Check if a specific alias already exists for an employee ID"""
        query = text("""
            SELECT COUNT(*)
            FROM employee_aliases
            WHERE emp_id = :emp_id AND alias_name = :alias_name
        """)
        result = db.session.execute(query, {
            'emp_id': emp_id,
            'alias_name': alias_name
        }).fetchone()
        return result[0] > 0 if result else False

    @staticmethod
    def add_alias(db, emp_id, alias_name):
        """Add a new alias for an employee ID if it doesn't exist"""
        if not EmployeeAliasService.alias_exists(db, emp_id, alias_name):
            query = text("""
                INSERT INTO employee_aliases (emp_id, alias_name, created_at)
                VALUES (:emp_id, :alias_name, :created_at)
            """)
            db.session.execute(query, {
                'emp_id': emp_id,
                'alias_name': alias_name,
                'created_at': datetime.now()
            })
            db.session.flush()
            return True
        return False

    @staticmethod
    def validate_employee_for_asset(db, emp_id, employee_name):
        """
        Validate employee for asset import.

        For SHARED employees: Accept any alias (auto-register if new)
        For NORMAL employees: Strict name matching (conflict protection)

        Returns: (is_valid, error_message, normalized_name)
        """
        from models import Employee

        # Check if employee exists
        employee = Employee.query.filter_by(emp_id=emp_id).first()
        if not employee:
            return False, f'Employee ID "{emp_id}" not found', None

        # Check if this is a shared/common employee ID
        is_shared = EmployeeAliasService.is_shared_employee(db, emp_id)

        if is_shared:
            # SHARED ID: Accept any alias
            # Auto-register new alias if not already known
            if employee_name and employee_name.strip():
                EmployeeAliasService.add_alias(db, emp_id, employee_name.strip())
            # Use the provided name (assets store denormalized employee_name)
            return True, None, employee_name
        else:
            # NORMAL EMPLOYEE: Strict validation
            # Check if name matches or is an existing alias
            if EmployeeAliasService.alias_exists(db, emp_id, employee_name):
                return True, None, employee_name
            else:
                # Name doesn't match - this is a conflict for normal employees
                known_aliases = EmployeeAliasService.get_employee_aliases(db, emp_id)
                return False, (
                    f'Employee ID "{emp_id}" name mismatch. '
                    f'Expected: {", ".join(known_aliases)}, '
                    f'Got: {employee_name}'
                ), None

    @staticmethod
    def handle_employee_import(db, emp_id, employee_name, existing_employee):
        """
        Handle employee bulk import with alias support.

        For SHARED employees: Add new alias without conflict
        For NORMAL employees: Detect name conflicts

        Returns: (should_update, conflict_detected, message)
        """
        is_shared = EmployeeAliasService.is_shared_employee(db, emp_id)

        if is_shared:
            # SHARED ID: Add new alias
            was_new = EmployeeAliasService.add_alias(db, emp_id, employee_name)
            if was_new:
                return False, False, f"New alias registered for shared ID {emp_id}"
            else:
                return False, False, f"Alias already exists for shared ID {emp_id}"
        else:
            # NORMAL EMPLOYEE: Check for name conflict
            if existing_employee.employee_name != employee_name:
                # Name conflict detected for normal employee
                return False, True, (
                    f"Name conflict for {emp_id}: "
                    f"existing '{existing_employee.employee_name}' vs new '{employee_name}'"
                )
            else:
                # Name matches - proceed with update
                return True, False, None
