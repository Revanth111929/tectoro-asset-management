"""
operations_service.py
Phase 4: Operations Engine

This service handles ALL asset operations throughout the application.
Every asset movement goes through this service for automatic synchronization.

OPERATIONS:
1. Assign Asset (Available → Assigned)
2. Return Asset (Assigned → Available)
3. Transfer Asset (Employee A → Employee B)
4. Send For Repair (Assigned → Under Repair)
5. Complete Repair (Under Repair → Available/Assigned)
6. Replace Part (Track part replacements)
7. Retire Asset (Any → Retired)

AUTOMATIC SYNCHRONIZATION:
- Inventory status updated
- Employee assignments updated
- Asset history created
- Lifecycle events logged
- Audit log created
- Dashboard counters refreshed
"""

from models import db, Asset, Employee, AssetLifecycle, AuditLog
from services.audit_service import AuditService, LifecycleService
from datetime import datetime, date
from typing import Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class OperationError(Exception):
    """Custom exception for operation errors"""
    def __init__(self, message: str, code: str = None):
        self.message = message
        self.code = code
        super().__init__(self.message)


class OperationsService:
    """
    Core Operations Engine
    Handles all asset operations with automatic synchronization
    """

    @staticmethod
    def assign_asset(asset_id: int, emp_id: str, performed_by: str, 
                     comments: Optional[str] = None) -> Dict:
        """
        Operation 1: Assign Asset to Employee
        
        Validates:
        - Asset exists and is Available
        - Employee exists and is Active
        
        Updates:
        - Asset status → Assigned
        - Asset employee fields
        - Lifecycle event
        - Audit log
        
        Returns operation result
        """
        try:
            # Get asset
            asset = Asset.query.get(asset_id)
            if not asset:
                raise OperationError(f"Asset ID {asset_id} not found", "ASSET_NOT_FOUND")
            
            # Validate status
            if asset.status != 'Available':
                raise OperationError(
                    f"Asset is not available (Status: {asset.status}). "
                    f"Only 'Available' assets can be assigned.",
                    "INVALID_STATUS"
                )
            
            # Get employee
            employee = Employee.query.filter_by(emp_id=emp_id).first()
            if not employee:
                raise OperationError(f"Employee {emp_id} not found", "EMPLOYEE_NOT_FOUND")
            
            if not employee.is_active or employee.status != 'Active':
                raise OperationError(
                    f"Employee {emp_id} is not active (Status: {employee.status})",
                    "EMPLOYEE_INACTIVE"
                )

            # Store old values for audit
            old_status = asset.status
            old_emp_id = asset.emp_id
            
            # Update asset
            asset.status = 'Assigned'
            asset.emp_id = employee.emp_id
            asset.employee_name = employee.employee_name
            asset.employee_email = employee.email
            asset.mobile_number = employee.mobile_number
            asset.date = date.today()
            if comments:
                asset.comments = comments
            
            # Create lifecycle event
            LifecycleService.record_event(
                asset_id=asset.id,
                event_type='ASSIGNED',
                to_employee_id=employee.emp_id,
                to_employee=employee.employee_name,
                from_status=old_status,
                to_status='Assigned',
                reason='Asset assigned to employee',
                performed_by=performed_by,
                remarks=comments
            )
            
            # Create audit log
            AuditService.log(
                action_type='ASSET_ASSIGNED',
                module='Operations',
                asset_id=asset.id,
                asset_name=asset.asset_name,
                asset_serial=asset.serial_number,
                category=asset.category,
                employee_id=employee.emp_id,
                employee_name=employee.employee_name,
                old_value=f"Status: {old_status}",
                new_value=f"Status: Assigned to {employee.employee_name}",
                performed_by=performed_by,
                remarks=comments
            )
            
            db.session.commit()
            
            logger.info(f"Asset {asset.id} assigned to {employee.emp_id} by {performed_by}")
            
            return {
                'success': True,
                'operation': 'assign',
                'message': f"Asset '{asset.asset_name}' assigned to {employee.employee_name}",
                'asset': asset.to_dict(),
                'employee': employee.to_dict()
            }
            
        except OperationError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error in assign_asset: {e}")
            raise OperationError(f"Failed to assign asset: {str(e)}", "ASSIGN_FAILED")

    @staticmethod
    def return_asset(asset_id: int, performed_by: str, 
                     comments: Optional[str] = None) -> Dict:
        """
        Operation 2: Return Asset to Inventory
        
        Validates:
        - Asset exists and is Assigned
        
        Updates:
        - Asset status → Available
        - Clear employee fields
        - Lifecycle event
        - Audit log
        
        Returns operation result
        """
        try:
            # Get asset
            asset = Asset.query.get(asset_id)
            if not asset:
                raise OperationError(f"Asset ID {asset_id} not found", "ASSET_NOT_FOUND")
            
            # Validate status
            if asset.status != 'Assigned':
                raise OperationError(
                    f"Asset is not assigned (Status: {asset.status}). "
                    f"Only 'Assigned' assets can be returned.",
                    "INVALID_STATUS"
                )
            
            # Store old values for audit
            old_emp_id = asset.emp_id
            old_emp_name = asset.employee_name
            old_status = asset.status
            
            # Update asset
            asset.status = 'Available'
            returned_from_emp_id = asset.emp_id
            returned_from_emp_name = asset.employee_name
            asset.emp_id = ''
            asset.employee_name = ''
            asset.employee_email = ''
            asset.mobile_number = ''
            if comments:
                asset.comments = comments

            # Create lifecycle event
            LifecycleService.record_event(
                asset_id=asset.id,
                event_type='RETURNED',
                from_employee_id=returned_from_emp_id,
                from_employee=returned_from_emp_name,
                from_status=old_status,
                to_status='Available',
                reason='Asset returned to inventory',
                performed_by=performed_by,
                remarks=comments
            )
            
            # Create audit log
            AuditService.log(
                action_type='ASSET_RETURNED',
                module='Operations',
                asset_id=asset.id,
                asset_name=asset.asset_name,
                asset_serial=asset.serial_number,
                category=asset.category,
                employee_id=old_emp_id,
                employee_name=old_emp_name,
                old_value=f"Status: {old_status}, Employee: {old_emp_name}",
                new_value=f"Status: Available, Employee: None",
                performed_by=performed_by,
                remarks=comments
            )
            
            db.session.commit()
            
            logger.info(f"Asset {asset.id} returned from {old_emp_name} by {performed_by}")
            
            return {
                'success': True,
                'operation': 'return',
                'message': f"Asset '{asset.asset_name}' returned to inventory",
                'asset': asset.to_dict(),
                'returned_from': {
                    'emp_id': returned_from_emp_id,
                    'employee_name': returned_from_emp_name
                }
            }
            
        except OperationError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error in return_asset: {e}")
            raise OperationError(f"Failed to return asset: {str(e)}", "RETURN_FAILED")


    @staticmethod
    def get_available_operations(asset_id: int) -> Dict:
        """
        Get list of valid operations for an asset based on its current status
        
        Returns:
        {
            'asset_id': int,
            'current_status': str,
            'available_operations': [...]
        }
        """
        asset = Asset.query.get(asset_id)
        if not asset:
            return {
                'asset_id': asset_id,
                'current_status': None,
                'available_operations': [],
                'error': 'Asset not found'
            }
        
        operations = []
        
        # Define operations based on status
        if asset.status == 'Available':
            operations.append({
                'operation': 'assign',
                'label': 'Assign to Employee',
                'icon': 'person-plus',
                'description': 'Assign this asset to an employee',
                'color': 'primary'
            })
        
        elif asset.status == 'Assigned':
            operations.extend([
                {
                    'operation': 'return',
                    'label': 'Return to Inventory',
                    'icon': 'arrow-return-left',
                    'description': 'Return asset to inventory (make Available)',
                    'color': 'success'
                },
                {
                    'operation': 'transfer',
                    'label': 'Transfer Asset',
                    'icon': 'arrow-left-right',
                    'description': 'Transfer to another employee',
                    'color': 'info'
                },
                {
                    'operation': 'repair',
                    'label': 'Send for Repair',
                    'icon': 'tools',
                    'description': 'Mark asset as under repair',
                    'color': 'warning'
                }
            ])
        
        elif asset.status in ['Under Repair', 'Maintenance']:
            operations.append({
                'operation': 'complete_repair',
                'label': 'Complete Repair',
                'icon': 'check-circle',
                'description': 'Mark repair as complete',
                'color': 'success'
            })
        
        # Retire is available for most statuses except Retired
        if asset.status != 'Retired':
            operations.append({
                'operation': 'retire',
                'label': 'Retire Asset',
                'icon': 'archive',
                'description': 'Mark asset as retired',
                'color': 'danger'
            })
        
        return {
            'asset_id': asset.id,
            'current_status': asset.status,
            'available_operations': operations,
            'asset': asset.to_dict()
        }
