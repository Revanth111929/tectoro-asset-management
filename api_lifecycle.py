# api_lifecycle.py
# REST API endpoints for Asset Lifecycle Tracking
# Handles: Audit logs, Lifecycle events, Temporary assignments, Replacements, Employee exits

from flask import Blueprint, request, jsonify, send_file
from flask_login import login_required, current_user
from models import (db, Asset, AuditLog, AssetLifecycle, TemporaryAssignment,
                    AssetReplacement, EmployeeExit, ExitAssetCollection)
from services.audit_service import AuditService, LifecycleService
from datetime import datetime, date, timedelta
from datetime_utils import today_ist, ist_midnight_utc
from sqlalchemy import or_, and_
import io
import csv

# Create Blueprint
lifecycle_bp = Blueprint('lifecycle', __name__, url_prefix='/api')

# Helper function to get current user info
def get_current_user_info():
    if current_user.is_authenticated:
        return {
            'username': current_user.username,
            'role': getattr(current_user, 'role', 'user')
        }
    # Fallback for API token auth (if implemented)
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return {'username': 'api_user', 'role': 'admin'}
    return {'username': 'system', 'role': 'system'}


# ══════════════════════════════════════════════════════════════════════════════
# AUDIT LOG ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@lifecycle_bp.route('/audit-logs', methods=['GET'])
def get_audit_logs():
    """
    Get audit logs with filtering and pagination.
    Query params:
        - action_type: Filter by action type
        - module: Filter by module
        - asset_id: Filter by asset
        - employee_id: Filter by employee
        - performed_by: Filter by user
        - date_from: Start date (YYYY-MM-DD)
        - date_to: End date (YYYY-MM-DD)
        - search: Text search
        - page: Page number (default: 1)
        - per_page: Results per page (default: 50)
    """
    try:
        filters = {
            'action_type': request.args.get('action_type'),
            'module': request.args.get('module'),
            'asset_id': request.args.get('asset_id', type=int),
            'employee_id': request.args.get('employee_id'),
            'performed_by': request.args.get('performed_by'),
            'search': request.args.get('search'),
        }
        
        # Parse dates
        if request.args.get('date_from'):
            try:
                filters['date_from'] = datetime.strptime(request.args.get('date_from'), '%Y-%m-%d')
            except:
                pass
        
        if request.args.get('date_to'):
            try:
                filters['date_to'] = datetime.strptime(request.args.get('date_to'), '%Y-%m-%d')
            except:
                pass
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        result = AuditService.search_logs(filters, page, per_page)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/audit-logs/recent', methods=['GET'])
def get_recent_audit_logs():
    """Get recent activities for dashboard"""
    try:
        limit = request.args.get('limit', 20, type=int)
        logs = AuditService.get_recent_activities(limit)
        
        return jsonify({
            'logs': [log.to_dict() for log in logs],
            'total': len(logs)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/audit-logs/asset/<int:asset_id>', methods=['GET'])
def get_asset_audit_history(asset_id):
    """Get complete audit history for an asset"""
    try:
        limit = request.args.get('limit', type=int)
        logs = AuditService.get_asset_history(asset_id, limit)
        
        return jsonify({
            'asset_id': asset_id,
            'logs': [log.to_dict() for log in logs],
            'total': len(logs)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/audit-logs/employee/<employee_id>', methods=['GET'])
def get_employee_audit_history(employee_id):
    """Get complete audit history for an employee"""
    try:
        limit = request.args.get('limit', type=int)
        logs = AuditService.get_employee_history(employee_id, limit)
        
        return jsonify({
            'employee_id': employee_id,
            'logs': [log.to_dict() for log in logs],
            'total': len(logs)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/audit-logs/export', methods=['GET'])
def export_audit_logs():
    """Export audit logs to CSV"""
    try:
        # Get filters from query params (same as search)
        filters = {
            'action_type': request.args.get('action_type'),
            'module': request.args.get('module'),
            'asset_id': request.args.get('asset_id', type=int),
            'employee_id': request.args.get('employee_id'),
            'performed_by': request.args.get('performed_by'),
            'search': request.args.get('search'),
        }
        
        # Parse dates
        if request.args.get('date_from'):
            try:
                filters['date_from'] = datetime.strptime(request.args.get('date_from'), '%Y-%m-%d')
            except:
                pass
        
        if request.args.get('date_to'):
            try:
                filters['date_to'] = datetime.strptime(request.args.get('date_to'), '%Y-%m-%d')
            except:
                pass
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        # Get all matching logs (no pagination for export)
        result = AuditService.search_logs(filters, page=1, per_page=10000)
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            'Timestamp', 'Action Type', 'Module', 'Asset ID', 'Asset Name', 'Asset Serial',
            'Category', 'Employee ID', 'Employee Name', 'Field', 'Old Value', 'New Value',
            'Performed By', 'Role', 'IP Address', 'Remarks'
        ])
        
        # Data rows
        for log in result['logs']:
            writer.writerow([
                log.get('timestamp', ''),
                log.get('action_type', ''),
                log.get('module', ''),
                log.get('asset_id', ''),
                log.get('asset_name', ''),
                log.get('asset_serial', ''),
                log.get('category', ''),
                log.get('employee_id', ''),
                log.get('employee_name', ''),
                log.get('field_name', ''),
                log.get('old_value', ''),
                log.get('new_value', ''),
                log.get('performed_by', ''),
                log.get('user_role', ''),
                log.get('ip_address', ''),
                log.get('remarks', '')
            ])
        
        output.seek(0)
        
        # Return as downloadable file
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8-sig')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'audit_logs_{today_ist()}.csv'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# ASSET LIFECYCLE ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@lifecycle_bp.route('/lifecycle/asset/<int:asset_id>', methods=['GET'])
def get_asset_lifecycle(asset_id):
    """Get complete lifecycle timeline for an asset"""
    try:
        timeline = LifecycleService.get_asset_timeline(asset_id)
        
        return jsonify({
            'asset_id': asset_id,
            'events': [event.to_dict() for event in timeline],
            'total': len(timeline)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/lifecycle/holders/<int:asset_id>', methods=['GET'])
def get_asset_holders(asset_id):
    """Get all employees who have held this asset"""
    try:
        holders = LifecycleService.get_asset_holders(asset_id)
        
        return jsonify({
            'asset_id': asset_id,
            'holders': holders,
            'total': len(holders)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# TEMPORARY ASSIGNMENT ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@lifecycle_bp.route('/temporary-assignments', methods=['POST'])
def create_temporary_assignment():
    """
    Create a temporary assignment (loaner device).
    Request body:
    {
        "employee_id": "EMP001",
        "employee_name": "John Smith",
        "employee_email": "john@company.com",
        "original_asset_id": 123,
        "temp_asset_id": 456,
        "reason": "Original device under repair",
        "expected_return_date": "2024-02-01"
    }
    """
    try:
        data = request.get_json()
        user_info = get_current_user_info()
        
        # Validate required fields
        required = ['employee_id', 'employee_name', 'original_asset_id', 'temp_asset_id', 'reason']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Get assets
        original_asset = Asset.query.get(data['original_asset_id'])
        temp_asset = Asset.query.get(data['temp_asset_id'])
        
        if not original_asset:
            return jsonify({'error': 'Original asset not found'}), 404
        if not temp_asset:
            return jsonify({'error': 'Temporary asset not found'}), 404
        
        # Check temp asset is available
        if temp_asset.status != 'Available':
            return jsonify({'error': 'Temporary asset is not available'}), 400
        
        # Parse expected return date
        expected_return = None
        if data.get('expected_return_date'):
            try:
                expected_return = datetime.strptime(data['expected_return_date'], '%Y-%m-%d').date()
            except:
                pass
        
        # Create temporary assignment
        assignment = TemporaryAssignment(
            employee_id=data['employee_id'],
            employee_name=data['employee_name'],
            employee_email=data.get('employee_email'),
            original_asset_id=original_asset.id,
            original_asset_name=original_asset.asset_name,
            original_asset_serial=original_asset.serial_number,
            temp_asset_id=temp_asset.id,
            temp_asset_name=temp_asset.asset_name,
            temp_asset_serial=temp_asset.serial_number,
            reason=data['reason'],
            start_date=today_ist(),
            expected_return_date=expected_return,
            status='Active',
            created_by=user_info['username'],
            remarks=data.get('remarks')
        )
        
        # Update asset statuses
        original_asset.status = 'Under Repair'
        temp_asset.status = 'Temporary Assignment'
        temp_asset.emp_id = data['employee_id']
        temp_asset.employee_name = data['employee_name']
        temp_asset.employee_email = data.get('employee_email', '')
        temp_asset.mobile_number = data.get('mobile_number', '')
        
        db.session.add(assignment)
        db.session.commit()
        
        # Create audit logs
        AuditService.log(
            action_type='TEMP_ASSIGNMENT_CREATED',
            module='TemporaryAssignment',
            asset_id=temp_asset.id,
            asset_name=temp_asset.asset_name,
            employee_id=data['employee_id'],
            employee_name=data['employee_name'],
            performed_by=user_info['username'],
            remarks=f"Temporary replacement for {original_asset.asset_name} - {data['reason']}"
        )
        
        # Create lifecycle events
        LifecycleService.record_event(
            asset_id=original_asset.id,
            event_type='REPAIR_SENT',
            from_status='Assigned',
            to_status='Under Repair',
            reason=data['reason'],
            performed_by=user_info['username']
        )
        
        LifecycleService.record_event(
            asset_id=temp_asset.id,
            event_type='TEMP_ASSIGNED',
            to_employee_id=data['employee_id'],
            to_employee=data['employee_name'],
            from_status='Available',
            to_status='Temporary Assignment',
            reason=f"Temporary replacement for {original_asset.asset_name}",
            performed_by=user_info['username']
        )
        
        return jsonify({
            'success': True,
            'message': 'Temporary assignment created successfully',
            'assignment': assignment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/temporary-assignments', methods=['GET'])
def get_temporary_assignments():
    """Get all temporary assignments with optional filters"""
    try:
        query = TemporaryAssignment.query
        
        # Apply filters
        if request.args.get('status'):
            query = query.filter_by(status=request.args.get('status'))
        
        if request.args.get('employee_id'):
            query = query.filter_by(employee_id=request.args.get('employee_id'))
        
        # Order by most recent
        assignments = query.order_by(TemporaryAssignment.created_at.desc()).all()
        
        return jsonify({
            'assignments': [a.to_dict() for a in assignments],
            'total': len(assignments)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/temporary-assignments/active', methods=['GET'])
def get_active_temporary_assignments():
    """Get all active temporary assignments"""
    try:
        assignments = TemporaryAssignment.query.filter_by(status='Active').order_by(
            TemporaryAssignment.start_date.desc()
        ).all()
        
        # Check for overdue
        today = today_ist()
        for assignment in assignments:
            if assignment.expected_return_date and assignment.expected_return_date < today:
                assignment.status = 'Overdue'
        
        db.session.commit()
        
        return jsonify({
            'assignments': [a.to_dict() for a in assignments],
            'total': len(assignments)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/temporary-assignments/<int:assignment_id>', methods=['GET'])
def get_temporary_assignment(assignment_id):
    """Get specific temporary assignment details"""
    try:
        assignment = TemporaryAssignment.query.get_or_404(assignment_id)
        
        return jsonify(assignment.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/temporary-assignments/<int:assignment_id>/complete', methods=['POST'])
def complete_temporary_assignment(assignment_id):
    """
    Complete a temporary assignment (return temp device, reassign original).
    Request body:
    {
        "remarks": "Original device repaired and ready"
    }
    """
    try:
        assignment = TemporaryAssignment.query.get_or_404(assignment_id)
        data = request.get_json() or {}
        user_info = get_current_user_info()
        
        if assignment.status != 'Active':
            return jsonify({'error': 'Assignment is not active'}), 400
        
        # Get assets
        original_asset = Asset.query.get(assignment.original_asset_id)
        temp_asset = Asset.query.get(assignment.temp_asset_id)
        
        # Update assignment
        assignment.status = 'Completed'
        assignment.actual_return_date = today_ist()
        assignment.completed_by = user_info['username']
        if data.get('remarks'):
            assignment.remarks = (assignment.remarks or '') + '\n' + data['remarks']
        
        # Get complete employee information to restore asset
        from models import Employee
        employee = Employee.query.filter_by(emp_id=assignment.employee_id).first()
        if not employee:
            return jsonify({
                'success': False,
                'error': f'Employee {assignment.employee_id} not found. Cannot complete temporary assignment.'
            }), 400
        
        # Validate employee has all required information
        missing_fields = []
        if not employee.emp_id or not str(employee.emp_id).strip():
            missing_fields.append('Employee ID')
        if not employee.employee_name or not str(employee.employee_name).strip():
            missing_fields.append('Employee Name')
        if not employee.email or not str(employee.email).strip():
            missing_fields.append('Employee Email')
        if not employee.mobile_number or not str(employee.mobile_number).strip():
            missing_fields.append('Mobile Number')
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Cannot restore asset to employee {employee.emp_id}. Missing required information: {", ".join(missing_fields)}. Please update employee record first.'
            }), 400
        
        # Update asset statuses - restore complete employee information
        original_asset.status = 'Assigned'
        original_asset.emp_id = employee.emp_id
        original_asset.employee_name = employee.employee_name
        original_asset.employee_email = employee.email
        original_asset.mobile_number = employee.mobile_number
        
        temp_asset.status = 'Available'
        temp_asset.emp_id = None
        temp_asset.employee_name = None
        temp_asset.employee_email = None
        temp_asset.mobile_number = None
        
        db.session.commit()
        
        # Create audit logs
        AuditService.log(
            action_type='TEMP_ASSIGNMENT_COMPLETED',
            module='TemporaryAssignment',
            asset_id=temp_asset.id,
            asset_name=temp_asset.asset_name,
            employee_id=assignment.employee_id,
            employee_name=assignment.employee_name,
            performed_by=user_info['username'],
            remarks=f"Returned temp device. Original {original_asset.asset_name} back in service."
        )
        
        # Create lifecycle events
        LifecycleService.record_event(
            asset_id=original_asset.id,
            event_type='REPAIR_COMPLETED',
            from_status='Under Repair',
            to_status='Assigned',
            to_employee_id=assignment.employee_id,
            to_employee=assignment.employee_name,
            performed_by=user_info['username']
        )
        
        LifecycleService.record_event(
            asset_id=temp_asset.id,
            event_type='RETURNED',
            from_employee_id=assignment.employee_id,
            from_employee=assignment.employee_name,
            from_status='Temporary Assignment',
            to_status='Available',
            performed_by=user_info['username']
        )
        
        return jsonify({
            'success': True,
            'message': 'Temporary assignment completed successfully',
            'assignment': assignment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/temporary-assignments/<int:assignment_id>', methods=['DELETE'])
def delete_temporary_assignment(assignment_id):
    """
    Delete a temporary assignment.
    WARNING: This does not automatically update asset statuses.
    Use this only for cleaning up erroneous/test records.
    """
    try:
        assignment = TemporaryAssignment.query.get_or_404(assignment_id)
        user_info = get_current_user_info()
        
        # Store info for audit log before deletion
        employee_name = assignment.employee_name
        original_asset_name = assignment.original_asset_name
        temp_asset_name = assignment.temp_asset_name
        
        # Create audit log before deletion
        AuditService.log(
            action_type='TEMP_ASSIGNMENT_DELETED',
            module='TemporaryAssignment',
            asset_id=assignment.temp_asset_id,
            asset_name=temp_asset_name,
            employee_id=assignment.employee_id,
            employee_name=employee_name,
            performed_by=user_info['username'],
            remarks=f"Deleted temp assignment record. Original: {original_asset_name}, Temp: {temp_asset_name}"
        )
        
        # Delete the assignment
        db.session.delete(assignment)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Temporary assignment deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Continue in next message due to length...

# ══════════════════════════════════════════════════════════════════════════════
# ASSET REPLACEMENT ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@lifecycle_bp.route('/asset-replacements', methods=['POST'])
def create_asset_replacement():
    """
    Create an asset replacement (upgrade/swap).
    Request body:
    {
        "employee_id": "EMP001",
        "employee_name": "John Smith",
        "employee_email": "john@company.com",
        "old_asset_id": 123,
        "new_asset_id": 456,
        "reason": "Hardware upgrade",
        "old_asset_condition": "Good",
        "replacement_date": "2024-02-01"
    }
    """
    try:
        data = request.get_json()
        user_info = get_current_user_info()
        
        # Validate required fields
        required = ['employee_id', 'employee_name', 'old_asset_id', 'new_asset_id', 'reason']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Get assets
        old_asset = Asset.query.get(data['old_asset_id'])
        new_asset = Asset.query.get(data['new_asset_id'])
        
        if not old_asset:
            return jsonify({'error': 'Old asset not found'}), 404
        if not new_asset:
            return jsonify({'error': 'New asset not found'}), 404
        
        # Check new asset is available
        if new_asset.status != 'Available':
            return jsonify({'error': 'New asset is not available'}), 400
        
        # Parse replacement date
        replacement_date = today_ist()
        if data.get('replacement_date'):
            try:
                replacement_date = datetime.strptime(data['replacement_date'], '%Y-%m-%d').date()
            except:
                pass
        
        # Create replacement record
        replacement = AssetReplacement(
            employee_id=data['employee_id'],
            employee_name=data['employee_name'],
            employee_email=data.get('employee_email'),
            old_asset_id=old_asset.id,
            old_asset_name=old_asset.asset_name,
            old_asset_serial=old_asset.serial_number,
            new_asset_id=new_asset.id,
            new_asset_name=new_asset.asset_name,
            new_asset_serial=new_asset.serial_number,
            replacement_date=replacement_date,
            reason=data['reason'],
            old_asset_condition=data.get('old_asset_condition', 'Good'),
            performed_by=user_info['username'],
            remarks=data.get('remarks')
        )
        
        # Update old asset
        old_asset.status = 'Returned'
        old_asset.emp_id = None
        old_asset.employee_name = None
        old_asset.employee_email = None
        old_asset.mobile_number = None
        
        # Update new asset - get complete employee information
        from models import Employee
        employee = Employee.query.filter_by(emp_id=data['employee_id']).first()
        if not employee:
            return jsonify({
                'success': False,
                'error': f'Employee {data["employee_id"]} not found. Cannot assign new asset.'
            }), 400
        
        # Validate employee has all required information
        missing_fields = []
        if not employee.emp_id or not str(employee.emp_id).strip():
            missing_fields.append('Employee ID')
        if not employee.employee_name or not str(employee.employee_name).strip():
            missing_fields.append('Employee Name')
        if not employee.email or not str(employee.email).strip():
            missing_fields.append('Employee Email')
        if not employee.mobile_number or not str(employee.mobile_number).strip():
            missing_fields.append('Mobile Number')
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Cannot assign new asset to employee {employee.emp_id}. Missing required information: {", ".join(missing_fields)}. Please update employee record first.'
            }), 400
        
        new_asset.status = 'Assigned'
        new_asset.emp_id = employee.emp_id
        new_asset.employee_name = employee.employee_name
        new_asset.employee_email = employee.email
        new_asset.mobile_number = employee.mobile_number
        
        db.session.add(replacement)
        db.session.commit()
        
        # Create audit logs
        AuditService.log(
            action_type='ASSET_REPLACED',
            module='AssetReplacement',
            asset_id=new_asset.id,
            asset_name=new_asset.asset_name,
            employee_id=data['employee_id'],
            employee_name=data['employee_name'],
            performed_by=user_info['username'],
            old_value=old_asset.asset_name,
            new_value=new_asset.asset_name,
            remarks=f"{data['reason']} - Old: {old_asset.asset_name}, New: {new_asset.asset_name}"
        )
        
        # Create lifecycle events
        LifecycleService.record_event(
            asset_id=old_asset.id,
            event_type='REPLACED',
            from_employee_id=data['employee_id'],
            from_employee=data['employee_name'],
            from_status='Assigned',
            to_status='Returned',
            reason=f"Replaced by {new_asset.asset_name}",
            performed_by=user_info['username']
        )
        
        LifecycleService.record_event(
            asset_id=new_asset.id,
            event_type='ASSIGNED',
            to_employee_id=data['employee_id'],
            to_employee=data['employee_name'],
            from_status='Available',
            to_status='Assigned',
            reason=f"Replacement for {old_asset.asset_name}",
            performed_by=user_info['username']
        )
        
        return jsonify({
            'success': True,
            'message': 'Asset replacement completed successfully',
            'replacement': replacement.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/asset-replacements', methods=['GET'])
def get_asset_replacements():
    """Get all asset replacements with optional filters"""
    try:
        query = AssetReplacement.query
        
        # Apply filters
        if request.args.get('employee_id'):
            query = query.filter_by(employee_id=request.args.get('employee_id'))
        
        if request.args.get('old_asset_id'):
            query = query.filter_by(old_asset_id=request.args.get('old_asset_id', type=int))
        
        if request.args.get('new_asset_id'):
            query = query.filter_by(new_asset_id=request.args.get('new_asset_id', type=int))
        
        # Order by most recent
        replacements = query.order_by(AssetReplacement.replacement_date.desc()).all()
        
        return jsonify({
            'replacements': [r.to_dict() for r in replacements],
            'total': len(replacements)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/asset-replacements/<int:replacement_id>', methods=['GET'])
def get_asset_replacement(replacement_id):
    """Get specific replacement details"""
    try:
        replacement = AssetReplacement.query.get_or_404(replacement_id)
        
        return jsonify(replacement.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/asset-replacements/<int:replacement_id>', methods=['DELETE'])
def delete_asset_replacement(replacement_id):
    """
    Delete an asset replacement.
    WARNING: This does not automatically update asset statuses.
    Use this only for cleaning up erroneous/test records.
    """
    try:
        replacement = AssetReplacement.query.get_or_404(replacement_id)
        user_info = get_current_user_info()
        
        # Store info for audit log before deletion
        employee_name = replacement.employee_name
        old_asset_name = replacement.old_asset_name
        new_asset_name = replacement.new_asset_name
        
        # Create audit log before deletion
        AuditService.log(
            action_type='ASSET_REPLACEMENT_DELETED',
            module='AssetReplacement',
            asset_id=replacement.new_asset_id,
            asset_name=new_asset_name,
            employee_id=replacement.employee_id,
            employee_name=employee_name,
            performed_by=user_info['username'],
            remarks=f"Deleted replacement record. Old: {old_asset_name}, New: {new_asset_name}"
        )
        
        # Delete the replacement
        db.session.delete(replacement)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Asset replacement deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# EMPLOYEE EXIT ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@lifecycle_bp.route('/employee-exits', methods=['POST'])
def create_employee_exit():
    """
    Initiate employee exit process.
    Request body:
    {
        "employee_id": "EMP001",
        "employee_name": "John Smith",
        "employee_email": "john@company.com",
        "department": "IT",
        "exit_date": "2024-02-01",
        "exit_type": "Resignation",
        "last_working_day": "2024-02-15"
    }
    """
    try:
        data = request.get_json()
        user_info = get_current_user_info()
        
        # Validate required fields
        required = ['employee_id', 'employee_name', 'exit_date']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if exit already exists
        existing = EmployeeExit.query.filter_by(employee_id=data['employee_id']).first()
        if existing and existing.exit_status != 'Completed':
            return jsonify({'error': 'Exit process already in progress for this employee'}), 400
        
        # Parse dates
        exit_date = datetime.strptime(data['exit_date'], '%Y-%m-%d').date()
        last_working_day = None
        if data.get('last_working_day'):
            try:
                last_working_day = datetime.strptime(data['last_working_day'], '%Y-%m-%d').date()
            except:
                pass
        
        # Get all assets assigned to this employee
        assigned_assets = Asset.query.filter_by(emp_id=data['employee_id']).all()
        
        # Create exit record
        exit_record = EmployeeExit(
            employee_id=data['employee_id'],
            employee_name=data['employee_name'],
            employee_email=data.get('employee_email'),
            department=data.get('department'),
            exit_date=exit_date,
            exit_type=data.get('exit_type', 'Resignation'),
            last_working_day=last_working_day,
            total_assets_assigned=len(assigned_assets),
            exit_status='In Progress',
            clearance_status='Pending',
            processed_by=user_info['username'],
            remarks=data.get('remarks')
        )
        
        db.session.add(exit_record)
        db.session.flush()  # Get exit_record.id
        
        # Create collection records for each assigned asset
        for asset in assigned_assets:
            collection = ExitAssetCollection(
                exit_id=exit_record.id,
                asset_id=asset.id,
                asset_name=asset.asset_name,
                asset_serial=asset.serial_number,
                category=asset.category,
                collection_status='Pending'
            )
            db.session.add(collection)
        
        db.session.commit()
        
        # Create audit log
        AuditService.log(
            action_type='EMPLOYEE_EXIT_INITIATED',
            module='EmployeeExit',
            employee_id=data['employee_id'],
            employee_name=data['employee_name'],
            performed_by=user_info['username'],
            remarks=f"Exit process initiated. {len(assigned_assets)} assets to be collected."
        )
        
        return jsonify({
            'success': True,
            'message': 'Employee exit process initiated successfully',
            'exit': exit_record.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/employee-exits', methods=['GET'])
def get_employee_exits():
    """Get all employee exits with optional filters"""
    try:
        query = EmployeeExit.query
        
        # Apply filters
        if request.args.get('employee_id'):
            query = query.filter_by(employee_id=request.args.get('employee_id'))
        
        if request.args.get('exit_status'):
            query = query.filter_by(exit_status=request.args.get('exit_status'))
        
        if request.args.get('clearance_status'):
            query = query.filter_by(clearance_status=request.args.get('clearance_status'))
        
        # Order by most recent
        exits = query.order_by(EmployeeExit.created_at.desc()).all()
        
        return jsonify({
            'exits': [e.to_dict() for e in exits],
            'total': len(exits)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/employee-exits/<int:exit_id>', methods=['GET'])
def get_employee_exit(exit_id):
    """Get specific exit details with all asset collections"""
    try:
        exit_record = EmployeeExit.query.get_or_404(exit_id)
        
        return jsonify(exit_record.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/employee-exits/<int:exit_id>/collect-asset', methods=['POST'])
def collect_exit_asset(exit_id):
    """
    Mark an asset as collected during exit.
    Request body:
    {
        "asset_id": 123,
        "collection_status": "Returned",
        "asset_condition": "Good",
        "damage_description": "",
        "estimated_cost": 0
    }
    """
    try:
        exit_record = EmployeeExit.query.get_or_404(exit_id)
        data = request.get_json()
        user_info = get_current_user_info()
        
        if not data.get('asset_id'):
            return jsonify({'error': 'asset_id is required'}), 400
        
        # Find the collection record
        collection = ExitAssetCollection.query.filter_by(
            exit_id=exit_id,
            asset_id=data['asset_id']
        ).first()
        
        if not collection:
            return jsonify({'error': 'Asset not found in exit process'}), 404
        
        # Update collection
        collection.collection_status = data.get('collection_status', 'Returned')
        collection.asset_condition = data.get('asset_condition', 'Good')
        collection.collected_date = today_ist()
        collection.collected_by = user_info['username']
        collection.damage_description = data.get('damage_description')
        collection.estimated_cost = data.get('estimated_cost', 0)
        collection.remarks = data.get('remarks')
        
        # Update asset status
        asset = Asset.query.get(data['asset_id'])
        if collection.collection_status == 'Returned':
            asset.status = 'Available'
            asset.emp_id = None
            asset.employee_name = None
            asset.employee_email = None
            exit_record.total_assets_returned += 1
        elif collection.collection_status == 'Damaged':
            asset.status = 'Damaged'
            exit_record.total_assets_damaged += 1
        elif collection.collection_status in ['Missing', 'Lost']:
            asset.status = 'Lost'
            exit_record.total_assets_missing += 1
        
        # Check if all assets collected
        all_collections = ExitAssetCollection.query.filter_by(exit_id=exit_id).all()
        pending = [c for c in all_collections if c.collection_status == 'Pending']
        
        if not pending:
            exit_record.exit_status = 'Completed'
            exit_record.completed_by = user_info['username']
            exit_record.completed_at = datetime.utcnow()
            if exit_record.total_assets_damaged == 0 and exit_record.total_assets_missing == 0:
                exit_record.clearance_status = 'Approved'
        
        db.session.commit()
        
        # Create audit log
        AuditService.log(
            action_type='EXIT_ASSET_COLLECTED',
            module='EmployeeExit',
            asset_id=asset.id,
            asset_name=asset.asset_name,
            employee_id=exit_record.employee_id,
            employee_name=exit_record.employee_name,
            performed_by=user_info['username'],
            new_value=collection.collection_status,
            remarks=f"Asset {collection.collection_status.lower()} during exit process"
        )
        
        # Create lifecycle event
        LifecycleService.record_event(
            asset_id=asset.id,
            event_type='EXIT_COLLECTED',
            from_employee_id=exit_record.employee_id,
            from_employee=exit_record.employee_name,
            from_status='Assigned',
            to_status=asset.status,
            reason=f"Employee exit - {collection.collection_status}",
            performed_by=user_info['username']
        )
        
        return jsonify({
            'success': True,
            'message': 'Asset collection recorded successfully',
            'collection': collection.to_dict(),
            'exit_status': exit_record.exit_status,
            'pending_assets': len(pending)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/employee-exits/<int:exit_id>/complete', methods=['POST'])
def complete_employee_exit(exit_id):
    """
    Manually complete an employee exit process.
    Request body:
    {
        "clearance_status": "Approved",
        "remarks": "All assets returned in good condition"
    }
    """
    try:
        exit_record = EmployeeExit.query.get_or_404(exit_id)
        data = request.get_json() or {}
        user_info = get_current_user_info()
        
        if exit_record.exit_status == 'Completed':
            return jsonify({'error': 'Exit process already completed'}), 400
        
        # Update exit record
        exit_record.exit_status = 'Completed'
        exit_record.clearance_status = data.get('clearance_status', 'Approved')
        exit_record.completed_by = user_info['username']
        exit_record.completed_at = datetime.utcnow()
        if data.get('remarks'):
            exit_record.remarks = (exit_record.remarks or '') + '\n' + data['remarks']
        
        db.session.commit()
        
        # Create audit log
        AuditService.log(
            action_type='EMPLOYEE_EXIT_COMPLETED',
            module='EmployeeExit',
            employee_id=exit_record.employee_id,
            employee_name=exit_record.employee_name,
            performed_by=user_info['username'],
            new_value=exit_record.clearance_status,
            remarks=f"Exit process completed with clearance: {exit_record.clearance_status}"
        )
        
        return jsonify({
            'success': True,
            'message': 'Employee exit completed successfully',
            'exit': exit_record.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# DASHBOARD LIFECYCLE STATS
# ══════════════════════════════════════════════════════════════════════════════

@lifecycle_bp.route('/dashboard/lifecycle-stats', methods=['GET'])
def get_lifecycle_stats():
    """
    Get real-time lifecycle metrics for dashboard.
    Returns:
    {
        "assets_under_repair": 5,
        "active_temp_assignments": 3,
        "pending_exits": 2,
        "recent_replacements": 8,
        "overdue_temp_assignments": 1,
        "total_audit_logs": 1234,
        "recent_activities": [...]
    }
    """
    try:
        # Get counts
        assets_under_repair = Asset.query.filter_by(status='Under Repair').count()
        active_temp_assignments = TemporaryAssignment.query.filter_by(status='Active').count()
        pending_exits = EmployeeExit.query.filter_by(exit_status='In Progress').count()
        
        # Recent replacements (last 30 days)
        thirty_days_ago = today_ist() - timedelta(days=30)
        recent_replacements = AssetReplacement.query.filter(
            AssetReplacement.replacement_date >= thirty_days_ago
        ).count()
        
        # Overdue temp assignments
        today = today_ist()
        overdue_assignments = TemporaryAssignment.query.filter(
            TemporaryAssignment.status == 'Active',
            TemporaryAssignment.expected_return_date < today
        ).count()
        
        # Total audit logs
        total_audit_logs = AuditLog.query.count()
        
        # Recent activities (last 20)
        recent_activities = AuditService.get_recent_activities(20)
        
        # Assets by status
        assets_available = Asset.query.filter_by(status='Available').count()
        assets_assigned = Asset.query.filter_by(status='Assigned').count()
        assets_temp = Asset.query.filter_by(status='Temporary Assignment').count()
        assets_returned = Asset.query.filter_by(status='Returned').count()
        
        # Today's activity count — compares against AuditLog.timestamp, a
        # true UTC instant, so we need the UTC instant corresponding to
        # midnight IST today, not just today's calendar date.
        today_start = ist_midnight_utc()
        today_activities = AuditLog.query.filter(AuditLog.timestamp >= today_start).count()
        
        return jsonify({
            'success': True,
            'stats': {
                'assets_under_repair': assets_under_repair,
                'active_temp_assignments': active_temp_assignments,
                'pending_exits': pending_exits,
                'recent_replacements': recent_replacements,
                'overdue_temp_assignments': overdue_assignments,
                'total_audit_logs': total_audit_logs,
                'today_activities': today_activities,
                'assets_by_status': {
                    'available': assets_available,
                    'assigned': assets_assigned,
                    'temporary_assignment': assets_temp,
                    'under_repair': assets_under_repair,
                    'returned': assets_returned
                }
            },
            'recent_activities': [log.to_dict() for log in recent_activities]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# UTILITY ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@lifecycle_bp.route('/action-types', methods=['GET'])
def get_action_types():
    """Get list of all action types for filtering"""
    try:
        # Query distinct action types from audit logs
        action_types = db.session.query(AuditLog.action_type).distinct().all()
        action_types = [at[0] for at in action_types if at[0]]
        
        return jsonify({
            'action_types': sorted(action_types)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/modules', methods=['GET'])
def get_modules():
    """Get list of all modules for filtering"""
    try:
        # Query distinct modules from audit logs
        modules = db.session.query(AuditLog.module).distinct().all()
        modules = [m[0] for m in modules if m[0]]
        
        return jsonify({
            'modules': sorted(modules)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# ASSET HELPER ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@lifecycle_bp.route('/assets/by-employee/<emp_id>', methods=['GET'])
def get_assets_by_employee(emp_id):
    """
    Get all assets assigned to a specific employee.
    Returns complete asset details for each asset.
    """
    try:
        assets = Asset.query.filter_by(emp_id=emp_id).all()
        
        return jsonify({
            'success': True,
            'employee_id': emp_id,
            'employee_name': assets[0].employee_name if assets else '',
            'assets': [asset.to_dict() for asset in assets],
            'count': len(assets)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lifecycle_bp.route('/assets/<int:asset_id>/details', methods=['GET'])
def get_asset_full_details(asset_id):
    """
    Get complete details for a specific asset.
    Used for auto-filling forms when asset is selected.
    """
    try:
        asset = Asset.query.get_or_404(asset_id)
        
        return jsonify({
            'success': True,
            'asset': asset.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
