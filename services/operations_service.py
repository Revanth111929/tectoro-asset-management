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
    def transfer_asset(asset_id: int, to_emp_id: str, reason: str, 
                       performed_by: str, swap_asset_id: Optional[int] = None,
                       comments: Optional[str] = None) -> Dict:
        """
        Operation 3: Transfer Asset Between Employees
        
        Supports two modes:
        1. Simple Transfer: Asset from Employee A to Employee B (B has no asset)
        2. Swap: Asset A from Employee A ↔ Asset B from Employee B
        
        Validates:
        - Asset exists and is Assigned
        - Target employee exists and is Active
        - If swap: Swap asset exists and is Assigned
        
        Updates:
        - Asset employee assignments
        - Lifecycle events (one or two, depending on mode)
        - Audit logs
        
        Returns operation result
        """
        try:
            # Get source asset
            asset = Asset.query.get(asset_id)
            if not asset:
                raise OperationError(f"Asset ID {asset_id} not found", "ASSET_NOT_FOUND")
            
            # Validate source asset status
            if asset.status != 'Assigned':
                raise OperationError(
                    f"Asset is not assigned (Status: {asset.status}). "
                    f"Only 'Assigned' assets can be transferred.",
                    "INVALID_STATUS"
                )
            
            # Validate reason (mandatory)
            if not reason or not reason.strip():
                raise OperationError("Transfer reason is required", "REASON_REQUIRED")
            
            # Get source employee (current owner)
            from_emp_id = asset.emp_id
            from_emp_name = asset.employee_name
            
            # Get target employee
            to_employee = Employee.query.filter_by(emp_id=to_emp_id).first()
            if not to_employee:
                raise OperationError(f"Target employee {to_emp_id} not found", "EMPLOYEE_NOT_FOUND")
            
            if not to_employee.is_active or to_employee.status != 'Active':
                raise OperationError(
                    f"Target employee {to_emp_id} is not active (Status: {to_employee.status})",
                    "EMPLOYEE_INACTIVE"
                )
            
            # Check if this is a swap operation
            is_swap = swap_asset_id is not None
            
            if is_swap:
                # SWAP MODE: Exchange assets between two employees
                swap_asset = Asset.query.get(swap_asset_id)
                if not swap_asset:
                    raise OperationError(f"Swap asset ID {swap_asset_id} not found", "SWAP_ASSET_NOT_FOUND")
                
                if swap_asset.status != 'Assigned':
                    raise OperationError(
                        f"Swap asset is not assigned (Status: {swap_asset.status})",
                        "SWAP_ASSET_NOT_ASSIGNED"
                    )
                
                if swap_asset.emp_id != to_emp_id:
                    raise OperationError(
                        f"Swap asset is not assigned to target employee {to_emp_id}",
                        "SWAP_ASSET_WRONG_EMPLOYEE"
                    )
                
                # Perform swap
                swap_from_emp_id = swap_asset.emp_id
                swap_from_emp_name = swap_asset.employee_name
                
                # Update main asset (to target employee)
                asset.emp_id = to_employee.emp_id
                asset.employee_name = to_employee.employee_name
                asset.employee_email = to_employee.email
                asset.mobile_number = to_employee.mobile_number
                asset.date = date.today()
                if comments:
                    asset.comments = comments
                
                # Update swap asset (to source employee - from the main asset's original owner)
                # Get the source employee details
                from_employee = Employee.query.filter_by(emp_id=from_emp_id).first()
                if not from_employee:
                    raise OperationError(f"Source employee {from_emp_id} not found", "SOURCE_EMPLOYEE_NOT_FOUND")
                
                swap_asset.emp_id = from_employee.emp_id
                swap_asset.employee_name = from_employee.employee_name
                swap_asset.employee_email = from_employee.email
                swap_asset.mobile_number = from_employee.mobile_number
                swap_asset.date = date.today()
                if comments:
                    swap_asset.comments = comments
                
                # Create lifecycle events for both assets
                LifecycleService.record_event(
                    asset_id=asset.id,
                    event_type='TRANSFERRED',
                    from_employee_id=from_emp_id,
                    from_employee=from_emp_name,
                    to_employee_id=to_employee.emp_id,
                    to_employee=to_employee.employee_name,
                    from_status='Assigned',
                    to_status='Assigned',
                    reason=f"SWAP: {reason}",
                    performed_by=performed_by,
                    remarks=comments
                )
                
                LifecycleService.record_event(
                    asset_id=swap_asset.id,
                    event_type='TRANSFERRED',
                    from_employee_id=swap_from_emp_id,
                    from_employee=swap_from_emp_name,
                    to_employee_id=from_employee.emp_id,
                    to_employee=from_employee.employee_name,
                    from_status='Assigned',
                    to_status='Assigned',
                    reason=f"SWAP: {reason}",
                    performed_by=performed_by,
                    remarks=comments
                )
                
                # Create audit logs for both assets
                AuditService.log(
                    action_type='ASSET_TRANSFERRED',
                    module='Operations',
                    asset_id=asset.id,
                    asset_name=asset.asset_name,
                    asset_serial=asset.serial_number,
                    category=asset.category,
                    employee_id=to_employee.emp_id,
                    employee_name=to_employee.employee_name,
                    old_value=f"Employee: {from_emp_name} ({from_emp_id})",
                    new_value=f"Employee: {to_employee.employee_name} ({to_employee.emp_id})",
                    performed_by=performed_by,
                    remarks=f"SWAP with asset {swap_asset.asset_name} - Reason: {reason}"
                )
                
                AuditService.log(
                    action_type='ASSET_TRANSFERRED',
                    module='Operations',
                    asset_id=swap_asset.id,
                    asset_name=swap_asset.asset_name,
                    asset_serial=swap_asset.serial_number,
                    category=swap_asset.category,
                    employee_id=from_employee.emp_id,
                    employee_name=from_employee.employee_name,
                    old_value=f"Employee: {swap_from_emp_name} ({swap_from_emp_id})",
                    new_value=f"Employee: {from_employee.employee_name} ({from_employee.emp_id})",
                    performed_by=performed_by,
                    remarks=f"SWAP with asset {asset.asset_name} - Reason: {reason}"
                )
                
                db.session.commit()
                
                logger.info(f"Assets swapped: {asset.id} and {swap_asset.id} between {from_emp_id} and {to_emp_id}")
                
                return {
                    'success': True,
                    'operation': 'transfer_swap',
                    'message': f"Assets swapped: '{asset.asset_name}' ↔ '{swap_asset.asset_name}'",
                    'asset': asset.to_dict(),
                    'swap_asset': swap_asset.to_dict(),
                    'from_employee': from_emp_name,
                    'to_employee': to_employee.employee_name
                }
                
            else:
                # SIMPLE TRANSFER MODE: Move asset from Employee A to Employee B
                # Update asset
                asset.emp_id = to_employee.emp_id
                asset.employee_name = to_employee.employee_name
                asset.employee_email = to_employee.email
                asset.mobile_number = to_employee.mobile_number
                asset.date = date.today()
                if comments:
                    asset.comments = comments
                
                # Create lifecycle event
                LifecycleService.record_event(
                    asset_id=asset.id,
                    event_type='TRANSFERRED',
                    from_employee_id=from_emp_id,
                    from_employee=from_emp_name,
                    to_employee_id=to_employee.emp_id,
                    to_employee=to_employee.employee_name,
                    from_status='Assigned',
                    to_status='Assigned',
                    reason=reason,
                    performed_by=performed_by,
                    remarks=comments
                )
                
                # Create audit log
                AuditService.log(
                    action_type='ASSET_TRANSFERRED',
                    module='Operations',
                    asset_id=asset.id,
                    asset_name=asset.asset_name,
                    asset_serial=asset.serial_number,
                    category=asset.category,
                    employee_id=to_employee.emp_id,
                    employee_name=to_employee.employee_name,
                    old_value=f"Employee: {from_emp_name} ({from_emp_id})",
                    new_value=f"Employee: {to_employee.employee_name} ({to_employee.emp_id})",
                    performed_by=performed_by,
                    remarks=f"Reason: {reason}"
                )
                
                db.session.commit()
                
                logger.info(f"Asset {asset.id} transferred from {from_emp_id} to {to_emp_id}")
                
                return {
                    'success': True,
                    'operation': 'transfer_simple',
                    'message': f"Asset '{asset.asset_name}' transferred from {from_emp_name} to {to_employee.employee_name}",
                    'asset': asset.to_dict(),
                    'from_employee': from_emp_name,
                    'to_employee': to_employee.employee_name
                }
            
        except OperationError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error in transfer_asset: {e}")
            raise OperationError(f"Failed to transfer asset: {str(e)}", "TRANSFER_FAILED")


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


    @staticmethod
    def send_for_repair(asset_id: int, issue_category: str, issue_description: str,
                       priority: str, performed_by: str, vendor: str = None,
                       engineer: str = None, expected_date: str = None,
                       comments: str = None) -> Dict:
        """
        Operation 4: Send Asset For Repair
        
        Validates:
        - Asset exists and is Assigned
        
        Updates:
        - Asset status → Under Repair
        - Clear employee assignment
        - Create repair record
        - Lifecycle event
        - Audit log
        
        Returns operation result with repair_id
        """
        from models import AssetRepair
        
        try:
            # Get asset
            asset = Asset.query.get(asset_id)
            if not asset:
                raise OperationError(f"Asset ID {asset_id} not found", "ASSET_NOT_FOUND")
            
            # Validate status
            if asset.status != 'Assigned':
                raise OperationError(
                    f"Asset is not assigned (Status: {asset.status}). "
                    f"Only 'Assigned' assets can be sent for repair.",
                    "INVALID_STATUS"
                )
            
            # Validate required fields
            if not issue_category or not issue_description or not priority:
                raise OperationError("Issue category, description, and priority are required", "MISSING_REQUIRED_FIELDS")
            
            # Store employee context
            previous_emp_id = asset.emp_id
            previous_emp_name = asset.employee_name
            old_status = asset.status
            
            # Generate repair number
            from datetime import datetime as dt
            repair_count = AssetRepair.query.count() + 1
            repair_number = f"REP-{dt.now().year}-{repair_count:04d}"
            
            # Create repair record
            repair = AssetRepair(
                repair_number=repair_number,
                asset_id=asset.id,
                issue_category=issue_category,
                issue_description=issue_description,
                priority=priority,
                reported_by=performed_by,
                reported_date=date.today(),
                vendor=vendor,
                engineer=engineer,
                expected_completion_date=datetime.strptime(expected_date, '%Y-%m-%d').date() if expected_date else None,
                remarks=comments,
                status='In Progress',
                previous_emp_id=previous_emp_id,
                previous_employee_name=previous_emp_name
            )
            db.session.add(repair)
            
            # Update asset
            asset.status = 'Under Repair'
            asset.emp_id = ''
            asset.employee_name = ''
            asset.employee_email = ''
            asset.mobile_number = ''
            if comments:
                asset.comments = comments
            
            # Create lifecycle event
            LifecycleService.record_event(
                asset_id=asset.id,
                event_type='REPAIR_STARTED',
                from_employee_id=previous_emp_id,
                from_employee=previous_emp_name,
                from_status=old_status,
                to_status='Under Repair',
                reason=f"{issue_category}: {issue_description[:100]}",
                performed_by=performed_by,
                remarks=f"Repair #{repair_number} - Priority: {priority}"
            )
            
            # Create audit log
            AuditService.log(
                action_type='REPAIR_STARTED',
                module='Operations',
                asset_id=asset.id,
                asset_name=asset.asset_name,
                asset_serial=asset.serial_number,
                category=asset.category,
                employee_id=previous_emp_id,
                employee_name=previous_emp_name,
                old_value=f"Status: {old_status}, Employee: {previous_emp_name}",
                new_value=f"Status: Under Repair, Repair #{repair_number}",
                performed_by=performed_by,
                remarks=f"{issue_category} - {priority} priority"
            )
            
            db.session.commit()
            
            logger.info(f"Asset {asset.id} sent for repair ({repair_number}) by {performed_by}")
            
            return {
                'success': True,
                'operation': 'send_for_repair',
                'message': f"Asset '{asset.asset_name}' sent for repair",
                'asset': asset.to_dict(),
                'repair': repair.to_dict(),
                'repair_number': repair_number
            }
            
        except OperationError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error in send_for_repair: {e}")
            raise OperationError(f"Failed to send asset for repair: {str(e)}", "REPAIR_START_FAILED")


    @staticmethod
    def complete_repair(repair_id: int, completion_action: str, performed_by: str,
                       diagnosis: str = None, resolution: str = None,
                       repair_cost: float = 0.0, comments: str = None) -> Dict:
        """
        Operation 5: Complete Repair
        
        Completion actions:
        - return_to_employee: Return to previous employee
        - return_to_inventory: Make Available
        - retire: Mark as Retired
        
        Validates:
        - Repair exists and is In Progress
        - Asset status is Under Repair
        
        Updates:
        - Repair record completed
        - Asset status based on action
        - Lifecycle event
        - Audit log
        
        Returns operation result
        """
        from models import AssetRepair
        
        try:
            # Get repair
            repair = AssetRepair.query.get(repair_id)
            if not repair:
                raise OperationError(f"Repair ID {repair_id} not found", "REPAIR_NOT_FOUND")
            
            if repair.status != 'In Progress':
                raise OperationError(
                    f"Repair is not in progress (Status: {repair.status})",
                    "INVALID_REPAIR_STATUS"
                )
            
            # Get asset
            asset = Asset.query.get(repair.asset_id)
            if not asset:
                raise OperationError(f"Asset ID {repair.asset_id} not found", "ASSET_NOT_FOUND")
            
            if asset.status != 'Under Repair':
                raise OperationError(
                    f"Asset is not under repair (Status: {asset.status})",
                    "INVALID_ASSET_STATUS"
                )
            
            # Validate completion action
            valid_actions = ['return_to_employee', 'return_to_inventory', 'retire']
            if completion_action not in valid_actions:
                raise OperationError(
                    f"Invalid completion action: {completion_action}. Must be one of: {', '.join(valid_actions)}",
                    "INVALID_COMPLETION_ACTION"
                )
            
            old_status = asset.status
            
            # Update repair record
            repair.status = 'Completed'
            repair.completion_action = completion_action
            repair.diagnosis = diagnosis
            repair.resolution = resolution
            repair.repair_cost = repair_cost or 0.0
            repair.actual_completion_date = date.today()
            repair.completed_at = datetime.now()
            if comments:
                repair.remarks = (repair.remarks or '') + '\n' + comments
            
            # Execute completion action
            if completion_action == 'return_to_employee':
                # Return to previous employee
                if not repair.previous_emp_id:
                    raise OperationError("No previous employee found for this repair", "NO_PREVIOUS_EMPLOYEE")
                
                # Verify employee still exists and is active
                employee = Employee.query.filter_by(emp_id=repair.previous_emp_id).first()
                if not employee or not employee.is_active:
                    raise OperationError(
                        f"Previous employee {repair.previous_emp_id} is no longer active. "
                        f"Please choose 'return_to_inventory' instead.",
                        "EMPLOYEE_INACTIVE"
                    )
                
                # Validate employee has all required information for assignment
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
                    raise OperationError(
                        f"Cannot return asset to employee {employee.emp_id}. Missing required information: {', '.join(missing_fields)}. "
                        f"Please update employee record or choose 'return_to_inventory'.",
                        "INCOMPLETE_EMPLOYEE_INFO"
                    )
                
                asset.status = 'Assigned'
                asset.emp_id = employee.emp_id
                asset.employee_name = employee.employee_name
                asset.employee_email = employee.email
                asset.mobile_number = employee.mobile_number
                asset.date = date.today()
                
                new_status_desc = f"Assigned to {employee.employee_name}"
                
            elif completion_action == 'return_to_inventory':
                # Make Available
                asset.status = 'Available'
                asset.emp_id = ''
                asset.employee_name = ''
                asset.employee_email = ''
                asset.mobile_number = ''
                
                new_status_desc = "Available (Inventory)"
                
            elif completion_action == 'retire':
                # Retire asset
                asset.status = 'Retired'
                asset.emp_id = ''
                asset.employee_name = ''
                asset.employee_email = ''
                asset.mobile_number = ''
                
                new_status_desc = "Retired"
            
            # Create lifecycle event
            LifecycleService.record_event(
                asset_id=asset.id,
                event_type='REPAIR_COMPLETED',
                to_employee_id=asset.emp_id if completion_action == 'return_to_employee' else None,
                to_employee=asset.employee_name if completion_action == 'return_to_employee' else None,
                from_status=old_status,
                to_status=asset.status,
                reason=f"Repair completed - {repair.repair_number}",
                performed_by=performed_by,
                remarks=f"Action: {completion_action}, Cost: ${repair_cost}"
            )
            
            # Create audit log
            AuditService.log(
                action_type='REPAIR_COMPLETED',
                module='Operations',
                asset_id=asset.id,
                asset_name=asset.asset_name,
                asset_serial=asset.serial_number,
                category=asset.category,
                employee_id=asset.emp_id if completion_action == 'return_to_employee' else None,
                employee_name=asset.employee_name if completion_action == 'return_to_employee' else None,
                old_value=f"Status: {old_status}, Repair: {repair.repair_number}",
                new_value=f"Status: {new_status_desc}",
                performed_by=performed_by,
                remarks=f"Repair cost: ${repair_cost}, Action: {completion_action}"
            )
            
            db.session.commit()
            
            logger.info(f"Repair {repair_id} completed for asset {asset.id} by {performed_by}")
            
            return {
                'success': True,
                'operation': 'complete_repair',
                'message': f"Repair completed - Asset {new_status_desc}",
                'asset': asset.to_dict(),
                'repair': repair.to_dict(),
                'completion_action': completion_action
            }
            
        except OperationError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error in complete_repair: {e}")
            raise OperationError(f"Failed to complete repair: {str(e)}", "REPAIR_COMPLETE_FAILED")


    @staticmethod
    def add_repair_part(repair_id: int, part_name: str, vendor: str = None,
                       cost: float = 0.0, replacement_date: str = None,
                       warranty: str = None, remarks: str = None) -> Dict:
        """
        Operation 6: Add Part Replacement to Repair
        
        Validates:
        - Repair exists
        - Part name provided
        
        Creates:
        - RepairPart record
        - Updates repair cost
        
        Returns operation result
        """
        from models import AssetRepair, RepairPart
        
        try:
            # Get repair
            repair = AssetRepair.query.get(repair_id)
            if not repair:
                raise OperationError(f"Repair ID {repair_id} not found", "REPAIR_NOT_FOUND")
            
            if not part_name or not part_name.strip():
                raise OperationError("Part name is required", "PART_NAME_REQUIRED")
            
            # Create part record
            part = RepairPart(
                repair_id=repair_id,
                part_name=part_name,
                vendor=vendor,
                cost=cost or 0.0,
                replacement_date=datetime.strptime(replacement_date, '%Y-%m-%d').date() if replacement_date else date.today(),
                warranty=warranty,
                remarks=remarks
            )
            db.session.add(part)
            
            # Update repair total cost
            repair.repair_cost = (repair.repair_cost or 0.0) + (cost or 0.0)
            
            db.session.commit()
            
            logger.info(f"Part '{part_name}' added to repair {repair_id}")
            
            return {
                'success': True,
                'operation': 'add_repair_part',
                'message': f"Part '{part_name}' added to repair",
                'part': part.to_dict(),
                'repair': repair.to_dict()
            }
            
        except OperationError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error in add_repair_part: {e}")
            raise OperationError(f"Failed to add repair part: {str(e)}", "ADD_PART_FAILED")
