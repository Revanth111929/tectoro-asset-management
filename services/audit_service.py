# services/audit_service.py
# Comprehensive Audit Logging Service
# Automatically tracks all actions in the system

from models import db, AuditLog, AssetLifecycle
from datetime import datetime
from flask import request
import json

class AuditService:
    """
    Centralized audit logging service.
    Every action in the system should go through this service.
    """
    
    @staticmethod
    def log(action_type, module, **kwargs):
        """
        Create an audit log entry.
        
        Args:
            action_type (str): Type of action (CREATED, UPDATED, DELETED, ASSIGNED, etc.)
            module (str): Module name (Asset, Employee, User, etc.)
            **kwargs: Additional parameters
                - asset_id: Asset ID if applicable
                - asset_name: Asset name
                - asset_serial: Asset serial number
                - category: Asset category
                - employee_id: Employee ID
                - employee_name: Employee name
                - field_name: Field that was changed
                - old_value: Previous value
                - new_value: New value
                - performed_by: User who performed the action
                - user_role: Role of the user
                - remarks: Additional remarks
                - extra_data: Dict of additional data (will be JSON serialized)
        
        Returns:
            AuditLog: The created audit log entry
        """
        try:
            # Get IP address from request context
            ip_address = None
            if request:
                ip_address = request.remote_addr
            
            # Serialize extra_data if provided
            extra_data = kwargs.get('extra_data')
            if extra_data and isinstance(extra_data, dict):
                extra_data = json.dumps(extra_data)
            
            log_entry = AuditLog(
                timestamp=datetime.utcnow(),
                action_type=action_type,
                module=module,
                asset_id=kwargs.get('asset_id'),
                asset_name=kwargs.get('asset_name'),
                asset_serial=kwargs.get('asset_serial'),
                category=kwargs.get('category'),
                employee_id=kwargs.get('employee_id'),
                employee_name=kwargs.get('employee_name'),
                field_name=kwargs.get('field_name'),
                old_value=kwargs.get('old_value'),
                new_value=kwargs.get('new_value'),
                performed_by=kwargs.get('performed_by', 'System'),
                user_role=kwargs.get('user_role'),
                ip_address=ip_address or kwargs.get('ip_address'),
                remarks=kwargs.get('remarks'),
                extra_data=extra_data
            )
            
            db.session.add(log_entry)
            # Don't commit here - let the caller commit
            # db.session.commit()
            
            return log_entry
            
        except Exception as e:
            print(f"Error creating audit log: {e}")
            # Don't rollback here either
            # db.session.rollback()
            return None
    
    @staticmethod
    def log_asset_created(asset, performed_by, **kwargs):
        """Log asset creation"""
        return AuditService.log(
            action_type='ASSET_CREATED',
            module='Asset',
            asset_id=asset.id,
            asset_name=asset.asset_name,
            asset_serial=asset.serial_number,
            category=asset.category,
            performed_by=performed_by,
            remarks=kwargs.get('remarks'),
            extra_data={
                'brand': asset.brand_name,
                'model': asset.model_name,
                'status': asset.status
            }
        )
    
    @staticmethod
    def log_asset_updated(asset, changed_fields, performed_by, **kwargs):
        """
        Log asset update with field-level tracking.
        
        Args:
            asset: Asset object
            changed_fields: Dict of {field_name: (old_value, new_value)}
            performed_by: User who made the change
        """
        logs = []
        for field_name, (old_val, new_val) in changed_fields.items():
            log = AuditService.log(
                action_type='ASSET_UPDATED',
                module='Asset',
                asset_id=asset.id,
                asset_name=asset.asset_name,
                asset_serial=asset.serial_number,
                category=asset.category,
                field_name=field_name,
                old_value=str(old_val) if old_val else '',
                new_value=str(new_val) if new_val else '',
                performed_by=performed_by,
                remarks=kwargs.get('remarks')
            )
            logs.append(log)
        return logs
    
    @staticmethod
    def log_asset_deleted(asset, performed_by, **kwargs):
        """Log asset deletion"""
        return AuditService.log(
            action_type='ASSET_DELETED',
            module='Asset',
            asset_id=asset.id,
            asset_name=asset.asset_name,
            asset_serial=asset.serial_number,
            category=asset.category,
            performed_by=performed_by,
            remarks=kwargs.get('remarks')
        )
    
    @staticmethod
    def log_asset_assigned(asset, employee_name, employee_id, performed_by, **kwargs):
        """Log asset assignment"""
        return AuditService.log(
            action_type='ASSET_ASSIGNED',
            module='Asset',
            asset_id=asset.id,
            asset_name=asset.asset_name,
            asset_serial=asset.serial_number,
            category=asset.category,
            employee_id=employee_id,
            employee_name=employee_name,
            old_value=kwargs.get('old_status', 'Available'),
            new_value='Assigned',
            performed_by=performed_by,
            remarks=kwargs.get('remarks')
        )
    
    @staticmethod
    def log_asset_returned(asset, employee_name, employee_id, performed_by, **kwargs):
        """Log asset return"""
        return AuditService.log(
            action_type='ASSET_RETURNED',
            module='Asset',
            asset_id=asset.id,
            asset_name=asset.asset_name,
            asset_serial=asset.serial_number,
            category=asset.category,
            employee_id=employee_id,
            employee_name=employee_name,
            old_value='Assigned',
            new_value=kwargs.get('new_status', 'Available'),
            performed_by=performed_by,
            remarks=kwargs.get('remarks')
        )
    
    @staticmethod
    def log_status_change(asset, old_status, new_status, performed_by, **kwargs):
        """Log status change"""
        return AuditService.log(
            action_type='STATUS_CHANGED',
            module='Asset',
            asset_id=asset.id,
            asset_name=asset.asset_name,
            asset_serial=asset.serial_number,
            category=asset.category,
            field_name='status',
            old_value=old_status,
            new_value=new_status,
            performed_by=performed_by,
            remarks=kwargs.get('remarks')
        )
    
    @staticmethod
    def get_asset_history(asset_id, limit=None):
        """Get complete audit history for an asset"""
        query = AuditLog.query.filter_by(asset_id=asset_id).order_by(AuditLog.timestamp.desc())
        if limit:
            query = query.limit(limit)
        return query.all()
    
    @staticmethod
    def get_employee_history(employee_id, limit=None):
        """Get complete audit history for an employee"""
        query = AuditLog.query.filter_by(employee_id=employee_id).order_by(AuditLog.timestamp.desc())
        if limit:
            query = query.limit(limit)
        return query.all()
    
    @staticmethod
    def get_recent_activities(limit=20):
        """Get recent activities for dashboard"""
        return AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    
    @staticmethod
    def search_logs(filters, page=1, per_page=50):
        """
        Search audit logs with filters.
        
        Args:
            filters (dict): Search filters
                - action_type: Filter by action type
                - module: Filter by module
                - asset_id: Filter by asset
                - employee_id: Filter by employee
                - performed_by: Filter by user
                - date_from: Start date
                - date_to: End date
                - search: Text search in asset_name, employee_name, remarks
            page (int): Page number
            per_page (int): Results per page
        
        Returns:
            dict: Paginated results with logs and metadata
        """
        query = AuditLog.query
        
        # Apply filters
        if filters.get('action_type'):
            query = query.filter_by(action_type=filters['action_type'])
        
        if filters.get('module'):
            query = query.filter_by(module=filters['module'])
        
        if filters.get('asset_id'):
            query = query.filter_by(asset_id=filters['asset_id'])
        
        if filters.get('employee_id'):
            query = query.filter_by(employee_id=filters['employee_id'])
        
        if filters.get('performed_by'):
            query = query.filter_by(performed_by=filters['performed_by'])
        
        if filters.get('date_from'):
            query = query.filter(AuditLog.timestamp >= filters['date_from'])
        
        if filters.get('date_to'):
            query = query.filter(AuditLog.timestamp <= filters['date_to'])
        
        if filters.get('search'):
            search_term = f"%{filters['search']}%"
            query = query.filter(
                db.or_(
                    AuditLog.asset_name.like(search_term),
                    AuditLog.employee_name.like(search_term),
                    AuditLog.remarks.like(search_term),
                    AuditLog.asset_serial.like(search_term)
                )
            )
        
        # Order by most recent first
        query = query.order_by(AuditLog.timestamp.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return {
            'logs': [log.to_dict() for log in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'per_page': per_page,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }


class LifecycleService:
    """
    Asset Lifecycle Tracking Service.
    Records major lifecycle events for assets.
    """
    
    @staticmethod
    def record_event(asset_id, event_type, **kwargs):
        """
        Record a lifecycle event.
        
        Args:
            asset_id: Asset ID
            event_type: Event type (PROCURED, ASSIGNED, RETURNED, REPAIR_SENT, REPAIR_COMPLETED, REPLACED, RETIRED)
            **kwargs: Additional parameters
                - from_employee_id, from_employee
                - to_employee_id, to_employee
                - from_status, to_status
                - reason, location
                - performed_by, remarks
        
        Returns:
            AssetLifecycle: The created lifecycle event
        """
        try:
            event = AssetLifecycle(
                asset_id=asset_id,
                event_type=event_type,
                event_date=kwargs.get('event_date', datetime.utcnow()),
                from_employee_id=kwargs.get('from_employee_id'),
                from_employee=kwargs.get('from_employee'),
                to_employee_id=kwargs.get('to_employee_id'),
                to_employee=kwargs.get('to_employee'),
                from_status=kwargs.get('from_status'),
                to_status=kwargs.get('to_status'),
                reason=kwargs.get('reason'),
                location=kwargs.get('location'),
                performed_by=kwargs.get('performed_by', 'System'),
                remarks=kwargs.get('remarks')
            )
            
            db.session.add(event)
            # Don't commit here - let the caller commit
            # db.session.commit()
            
            return event
            
        except Exception as e:
            print(f"Error recording lifecycle event: {e}")
            # Don't rollback here either
            # db.session.rollback()
            return None
    
    @staticmethod
    def get_asset_timeline(asset_id):
        """Get chronological timeline for an asset"""
        return AssetLifecycle.query.filter_by(asset_id=asset_id).order_by(AssetLifecycle.event_date.desc()).all()
    
    @staticmethod
    def get_asset_holders(asset_id):
        """Get all employees who have held this asset"""
        events = AssetLifecycle.query.filter_by(asset_id=asset_id).filter(
            AssetLifecycle.to_employee_id.isnot(None)
        ).order_by(AssetLifecycle.event_date.desc()).all()
        
        holders = []
        seen = set()
        for event in events:
            if event.to_employee_id and event.to_employee_id not in seen:
                holders.append({
                    'employee_id': event.to_employee_id,
                    'employee_name': event.to_employee,
                    'assigned_date': event.event_date.isoformat() if event.event_date else '',
                    'reason': event.reason or ''
                })
                seen.add(event.to_employee_id)
        
        return holders
