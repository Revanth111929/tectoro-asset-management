"""
inventory_validator.py
Phase 3: Inventory Validation & Asset Integrity

This module provides comprehensive validation for asset operations to ensure
inventory integrity and enforce business rules.

VALIDATION RULES:
1. Serial Number must exist in inventory
2. Asset Tag must be unique
3. Duplicate Serial Numbers are not allowed
4. Employee must exist in Employee Master
5. Only 'Available' assets can be assigned
6. Multiple assets per employee allowed (different categories)
7. Same physical asset cannot be assigned twice
"""

from models import db, Asset, Employee
from typing import Dict, Optional, List, Tuple
import logging

logger = logging.getLogger(__name__)


class ValidationError(Exception):
    """Custom exception for validation errors"""
    def __init__(self, message: str, field: str = None):
        self.message = message
        self.field = field
        super().__init__(self.message)


class InventoryValidator:
    """
    Comprehensive inventory validation for Phase 3
    Ensures data integrity across all asset operations
    """
    
    @staticmethod
    def validate_serial_number_exists(serial_number: str) -> Tuple[bool, Optional[str], Optional[Asset]]:
        """
        Validate that a serial number exists in inventory
        
        Args:
            serial_number: The serial number to validate
            
        Returns:
            Tuple of (is_valid, error_message, asset_object)
        """
        if not serial_number or not serial_number.strip():
            return False, "Serial Number is required", None
        
        serial_number = serial_number.strip()
        asset = Asset.query.filter_by(serial_number=serial_number).first()
        
        if not asset:
            return False, f"Serial Number '{serial_number}' does not exist in Inventory", None
        
        return True, None, asset
    
    @staticmethod
    def validate_serial_number_unique(serial_number: str, exclude_asset_id: Optional[int] = None) -> Tuple[bool, Optional[str]]:
        """
        Validate that a serial number is unique
        
        Args:
            serial_number: The serial number to validate
            exclude_asset_id: Asset ID to exclude from uniqueness check (for updates)
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not serial_number or not serial_number.strip():
            return False, "Serial Number is required"
        
        serial_number = serial_number.strip()
        query = Asset.query.filter_by(serial_number=serial_number)
        
        if exclude_asset_id:
            query = query.filter(Asset.id != exclude_asset_id)
        
        existing_asset = query.first()
        
        if existing_asset:
            return False, f"Serial Number '{serial_number}' already exists (Asset: {existing_asset.asset_name}, ID: {existing_asset.id})"
        
        return True, None
    
    @staticmethod
    def validate_asset_tag_unique(asset_tag: str, exclude_asset_id: Optional[int] = None) -> Tuple[bool, Optional[str]]:
        """
        Validate that an asset tag is unique (if asset tags are being used)
        
        Args:
            asset_tag: The asset tag to validate
            exclude_asset_id: Asset ID to exclude from uniqueness check (for updates)
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not asset_tag or not asset_tag.strip():
            return True, None  # Asset tag is optional
        
        asset_tag = asset_tag.strip()
        
        # Note: Asset model doesn't have asset_tag field yet
        # This is a placeholder for future enhancement
        # For now, we use asset_name as the identifier
        return True, None
    
    @staticmethod
    def validate_employee_exists(emp_id: str) -> Tuple[bool, Optional[str], Optional[Employee]]:
        """
        Validate that an employee exists in Employee Master
        
        Args:
            emp_id: The employee ID to validate
            
        Returns:
            Tuple of (is_valid, error_message, employee_object)
        """
        if not emp_id or not emp_id.strip():
            return False, "Employee ID is required", None
        
        emp_id = emp_id.strip()
        employee = Employee.query.filter_by(emp_id=emp_id).first()
        
        if not employee:
            return False, f"Employee '{emp_id}' not found in Employee Master", None
        
        # Check if employee is active
        if not employee.is_active or employee.status != 'Active':
            return False, f"Employee '{emp_id}' is not active (Status: {employee.status})", employee
        
        return True, None, employee
    
    @staticmethod
    def validate_asset_available(asset: Asset, include_details: bool = True) -> Tuple[bool, Optional[str], Optional[Dict]]:
        """
        Validate that an asset is available for assignment
        Only 'Available' status assets can be assigned
        
        Args:
            asset: The asset object to validate
            include_details: Whether to include actionable details in response
            
        Returns:
            Tuple of (is_valid, error_message, details_dict)
        """
        if not asset:
            return False, "Asset not found", None
        
        details = None
        
        if asset.status != 'Available':
            # Provide helpful message based on current status with actionable info
            status_messages = {
                'Assigned': f"Asset is already assigned to {asset.employee_name or 'another employee'} (Emp ID: {asset.emp_id or 'N/A'})",
                'Maintenance': "Asset is currently under maintenance or repair",
                'Under Repair': "Asset is currently under repair",
                'Reserved': "Asset is reserved and not available for assignment",
                'Retired': "Asset has been retired and cannot be assigned",
                'Lost': "Asset is marked as lost",
                'Damaged': "Asset is marked as damaged and needs repair"
            }
            
            message = status_messages.get(asset.status, f"Asset is not available (Status: {asset.status})")
            
            # Enhancement: Include actionable details
            if include_details:
                from datetime import datetime
                details = {
                    'current_status': asset.status,
                    'current_assignee': {
                        'emp_id': asset.emp_id or None,
                        'employee_name': asset.employee_name or None,
                        'employee_email': asset.employee_email or None
                    } if asset.status == 'Assigned' else None,
                    'assigned_date': asset.date.isoformat() if asset.date else None,
                    'available_actions': []
                }
                
                # Suggest available actions based on status
                if asset.status == 'Assigned':
                    details['available_actions'] = [
                        {'action': 'transfer', 'label': 'Transfer to Another Employee', 'description': 'Transfer this asset from current employee to a new employee'},
                        {'action': 'return', 'label': 'Return Asset', 'description': 'Return asset to inventory (make Available)'},
                        {'action': 'view_details', 'label': 'View Asset Details', 'description': 'View complete asset information'}
                    ]
                elif asset.status in ['Maintenance', 'Under Repair']:
                    details['available_actions'] = [
                        {'action': 'complete_repair', 'label': 'Complete Repair', 'description': 'Mark repair as complete and make asset Available'},
                        {'action': 'view_details', 'label': 'View Asset Details', 'description': 'View repair history and details'}
                    ]
                elif asset.status == 'Retired':
                    details['available_actions'] = [
                        {'action': 'reactivate', 'label': 'Reactivate Asset', 'description': 'Bring asset back into inventory (if applicable)'},
                        {'action': 'view_details', 'label': 'View Asset Details', 'description': 'View retirement details'}
                    ]
                else:
                    details['available_actions'] = [
                        {'action': 'change_status', 'label': 'Change Status', 'description': 'Update asset status to make it available'},
                        {'action': 'view_details', 'label': 'View Asset Details', 'description': 'View complete asset information'}
                    ]
            
            return False, message, details
        
        return True, None, None
    
    @staticmethod
    def validate_asset_not_duplicate_assignment(asset_id: int, emp_id: str) -> Tuple[bool, Optional[str]]:
        """
        Validate that the same asset is not already assigned to the employee
        
        Args:
            asset_id: The asset ID to check
            emp_id: The employee ID to check
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        asset = Asset.query.get(asset_id)
        
        if not asset:
            return False, "Asset not found"
        
        # Check if asset is already assigned to this employee
        if asset.emp_id == emp_id and asset.status == 'Assigned':
            return False, f"Asset '{asset.asset_name}' is already assigned to Employee '{emp_id}'"
        
        return True, None
    
    @staticmethod
    def get_employee_assigned_assets(emp_id: str) -> List[Asset]:
        """
        Get all assets currently assigned to an employee
        
        Args:
            emp_id: The employee ID
            
        Returns:
            List of Asset objects
        """
        return Asset.query.filter_by(emp_id=emp_id, status='Assigned').all()
    
    @staticmethod
    def validate_multiple_assets_per_employee(emp_id: str, new_asset: Asset) -> Tuple[bool, Optional[str], Optional[Dict]]:
        """
        Validate that multiple assets can be assigned to the same employee
        This is allowed for different categories (Laptop, Monitor, Phone, etc.)
        But not for the same physical asset twice
        
        Enhancement: Category-aware validation
        - If assigning same category (e.g., second Laptop), prompt for replace or keep both
        - Different categories always allowed
        
        Args:
            emp_id: The employee ID
            new_asset: The asset being assigned
            
        Returns:
            Tuple of (is_valid, error_message, details_dict)
        """
        # Get all assets currently assigned to employee
        assigned_assets = InventoryValidator.get_employee_assigned_assets(emp_id)
        
        details = {
            'assigned_assets_count': len(assigned_assets),
            'assigned_assets': [],
            'same_category_assets': [],
            'category_conflict': False,
            'suggested_action': None
        }
        
        # Check if the same asset is already assigned
        for asset in assigned_assets:
            asset_info = {
                'id': asset.id,
                'asset_name': asset.asset_name,
                'category': asset.category,
                'serial_number': asset.serial_number,
                'assigned_date': asset.date.isoformat() if asset.date else None
            }
            details['assigned_assets'].append(asset_info)
            
            if asset.id == new_asset.id:
                return False, f"This asset is already assigned to Employee '{emp_id}'", details
            
            # Check if same serial number (same physical device)
            if asset.serial_number == new_asset.serial_number:
                return False, f"Asset with serial number '{new_asset.serial_number}' is already assigned to Employee '{emp_id}'", details
            
            # Enhancement: Check for same category
            if asset.category == new_asset.category:
                details['same_category_assets'].append(asset_info)
                details['category_conflict'] = True
        
        # Enhancement: If assigning same category, provide guidance
        if details['category_conflict']:
            same_category_list = ', '.join([f"{a['asset_name']} ({a['serial_number']})" for a in details['same_category_assets']])
            
            # Determine suggested action based on category
            single_device_categories = ['Laptop', 'Desktop', 'Phone']  # Usually one per employee
            multiple_allowed_categories = ['Monitor', 'Keyboard', 'Mouse', 'Headset']  # Can have multiple
            
            if new_asset.category in single_device_categories:
                details['suggested_action'] = 'replace'
                details['warning_message'] = (
                    f"Employee already has a {new_asset.category}: {same_category_list}. "
                    f"Do you want to REPLACE the existing {new_asset.category} or KEEP BOTH?"
                )
                details['options'] = [
                    {
                        'action': 'replace',
                        'label': f'Replace Existing {new_asset.category}',
                        'description': f'Unassign current {new_asset.category} and assign new one'
                    },
                    {
                        'action': 'keep_both',
                        'label': f'Keep Both {new_asset.category}s',
                        'description': 'Assign new asset while keeping existing one'
                    }
                ]
            else:
                details['suggested_action'] = 'keep_both'
                details['warning_message'] = (
                    f"Employee already has {len(details['same_category_assets'])} {new_asset.category}(s): {same_category_list}. "
                    f"Adding another {new_asset.category} is allowed."
                )
                details['options'] = [
                    {
                        'action': 'keep_both',
                        'label': f'Add Another {new_asset.category}',
                        'description': 'Assign new asset alongside existing ones'
                    }
                ]
            
            # Still valid, but with warning and options
            return True, None, details
        
        # Different category or no existing assets - always allowed
        return True, None, details
    
    @staticmethod
    def validate_asset_assignment(asset_id: int, emp_id: str) -> Dict:
        """
        Comprehensive validation for asset assignment
        Validates all Phase 3 rules with actionable information
        
        Args:
            asset_id: The asset ID to assign
            emp_id: The employee ID to assign to
            
        Returns:
            Dictionary with validation result:
            {
                'valid': bool,
                'errors': List[str],
                'warnings': List[str],
                'asset': Asset object or None,
                'employee': Employee object or None,
                'details': Dict with actionable information,
                'category_options': Dict with replace/keep both options
            }
        """
        result = {
            'valid': True,
            'errors': [],
            'warnings': [],
            'asset': None,
            'employee': None,
            'details': {},
            'category_options': None,
            'employee_current_assets': []
        }
        
        # 1. Validate asset exists
        asset = Asset.query.get(asset_id)
        if not asset:
            result['valid'] = False
            result['errors'].append(f"Asset with ID {asset_id} not found in Inventory")
            return result
        result['asset'] = asset
        
        # 2. Validate serial number exists (redundant but defensive)
        is_valid, error, _ = InventoryValidator.validate_serial_number_exists(asset.serial_number)
        if not is_valid:
            result['valid'] = False
            result['errors'].append(error)
        
        # 3. Validate employee exists
        is_valid, error, employee = InventoryValidator.validate_employee_exists(emp_id)
        if not is_valid:
            result['valid'] = False
            result['errors'].append(error)
            return result
        result['employee'] = employee
        
        # Enhancement: Get employee's current assets BEFORE validation
        current_assets = InventoryValidator.get_employee_assigned_assets(emp_id)
        result['employee_current_assets'] = [
            {
                'id': a.id,
                'asset_name': a.asset_name,
                'category': a.category,
                'serial_number': a.serial_number,
                'assigned_date': a.date.isoformat() if a.date else None
            } for a in current_assets
        ]
        
        # 4. Validate asset is available (with actionable details)
        is_valid, error, availability_details = InventoryValidator.validate_asset_available(asset, include_details=True)
        if not is_valid:
            result['valid'] = False
            result['errors'].append(error)
            if availability_details:
                result['details'] = availability_details
        
        # 5. Validate not duplicate assignment
        is_valid, error = InventoryValidator.validate_asset_not_duplicate_assignment(asset_id, emp_id)
        if not is_valid:
            result['valid'] = False
            result['errors'].append(error)
        
        # 6. Validate multiple assets (with category-aware options)
        is_valid, error, multi_asset_details = InventoryValidator.validate_multiple_assets_per_employee(emp_id, asset)
        if not is_valid:
            result['valid'] = False
            result['errors'].append(error)
            if multi_asset_details:
                result['details'].update(multi_asset_details)
        else:
            # Enhancement: If category conflict, add options but keep valid=True
            if multi_asset_details and multi_asset_details.get('category_conflict'):
                result['warnings'].append(multi_asset_details.get('warning_message', ''))
                result['category_options'] = {
                    'has_conflict': True,
                    'suggested_action': multi_asset_details.get('suggested_action'),
                    'options': multi_asset_details.get('options', []),
                    'same_category_assets': multi_asset_details.get('same_category_assets', [])
                }
                result['details'].update(multi_asset_details)
            elif multi_asset_details:
                # No conflict, but employee has other assets
                if multi_asset_details['assigned_assets_count'] > 0:
                    asset_list = ', '.join([
                        f"{a['category']} ({a['asset_name']})" 
                        for a in multi_asset_details['assigned_assets']
                    ])
                    result['warnings'].append(
                        f"Employee already has {multi_asset_details['assigned_assets_count']} asset(s): {asset_list}"
                    )
        
        return result
    
    @staticmethod
    def validate_new_asset(data: Dict) -> Dict:
        """
        Validate new asset creation
        
        Args:
            data: Dictionary with asset data
            
        Returns:
            Dictionary with validation result
        """
        result = {
            'valid': True,
            'errors': [],
            'warnings': []
        }
        
        # 1. Validate required fields
        if not data.get('asset_name') or not data.get('asset_name').strip():
            result['valid'] = False
            result['errors'].append("Asset Name is required")
        
        if not data.get('serial_number') or not data.get('serial_number').strip():
            result['valid'] = False
            result['errors'].append("Serial Number is required")
        
        if not result['valid']:
            return result
        
        # 2. Validate serial number uniqueness
        is_valid, error = InventoryValidator.validate_serial_number_unique(data['serial_number'])
        if not is_valid:
            result['valid'] = False
            result['errors'].append(error)
        
        # 3. Validate employee if being assigned
        emp_id = data.get('emp_id', '').strip()
        if emp_id:
            is_valid, error, employee = InventoryValidator.validate_employee_exists(emp_id)
            if not is_valid:
                result['valid'] = False
                result['errors'].append(error)
        
        # 4. Validate category
        if data.get('category'):
            valid_categories = [
                'Laptop', 'Desktop', 'Phone', 'Monitor', 'Printer', 
                'Keyboard', 'Mouse', 'Headset', 'Dock', 'Server', 
                'Accessories', 'Hard Disk', 'UPS', 'Laptop Bag', 'SIM Card'
            ]
            if data['category'] not in valid_categories:
                result['warnings'].append(f"Category '{data['category']}' is not in standard list")
        
        return result
    
    @staticmethod
    def validate_asset_update(asset_id: int, data: Dict) -> Dict:
        """
        Validate asset update
        
        Args:
            asset_id: The asset ID being updated
            data: Dictionary with updated asset data
            
        Returns:
            Dictionary with validation result
        """
        result = {
            'valid': True,
            'errors': [],
            'warnings': []
        }
        
        # 1. Validate asset exists
        asset = Asset.query.get(asset_id)
        if not asset:
            result['valid'] = False
            result['errors'].append(f"Asset with ID {asset_id} not found")
            return result
        
        # 2. Validate serial number uniqueness if changed
        if 'serial_number' in data:
            new_serial = data['serial_number'].strip()
            if new_serial != asset.serial_number:
                is_valid, error = InventoryValidator.validate_serial_number_unique(new_serial, exclude_asset_id=asset_id)
                if not is_valid:
                    result['valid'] = False
                    result['errors'].append(error)
        
        # 3. Validate employee if changing assignment
        if 'emp_id' in data:
            emp_id = data['emp_id'].strip()
            if emp_id and emp_id != asset.emp_id:
                is_valid, error, employee = InventoryValidator.validate_employee_exists(emp_id)
                if not is_valid:
                    result['valid'] = False
                    result['errors'].append(error)
        
        # 4. Validate status transitions
        if 'status' in data:
            new_status = data['status']
            old_status = asset.status
            
            # Don't allow certain status transitions
            if old_status == 'Retired' and new_status != 'Retired':
                result['warnings'].append("Changing status of retired asset - verify this is intentional")
        
        return result
    
    @staticmethod
    def validate_bulk_import_row(row_data: Dict, row_number: int) -> Dict:
        """
        Validate a single row in bulk import
        
        Args:
            row_data: Dictionary with asset data from import
            row_number: Row number in the import file
            
        Returns:
            Dictionary with validation result
        """
        result = InventoryValidator.validate_new_asset(row_data)
        result['row_number'] = row_number
        return result
    
    @staticmethod
    def get_asset_status_info() -> Dict:
        """
        Get information about valid asset statuses and their meanings
        
        Returns:
            Dictionary with status information
        """
        return {
            'valid_statuses': [
                'Available',
                'Assigned',
                'Maintenance',
                'Under Repair',
                'Reserved',
                'Retired',
                'Lost',
                'Damaged'
            ],
            'assignable_statuses': ['Available'],
            'status_descriptions': {
                'Available': 'Asset is in inventory and can be assigned',
                'Assigned': 'Asset is currently assigned to an employee',
                'Maintenance': 'Asset is undergoing maintenance',
                'Under Repair': 'Asset is being repaired',
                'Reserved': 'Asset is reserved for specific purpose',
                'Retired': 'Asset has been retired and removed from active inventory',
                'Lost': 'Asset is lost or missing',
                'Damaged': 'Asset is damaged and needs attention'
            }
        }


# Convenience functions for backward compatibility
def validate_asset_assignment(asset_id: int, emp_id: str) -> Dict:
    """Convenience function - delegates to InventoryValidator"""
    return InventoryValidator.validate_asset_assignment(asset_id, emp_id)


def validate_new_asset(data: Dict) -> Dict:
    """Convenience function - delegates to InventoryValidator"""
    return InventoryValidator.validate_new_asset(data)


def validate_asset_update(asset_id: int, data: Dict) -> Dict:
    """Convenience function - delegates to InventoryValidator"""
    return InventoryValidator.validate_asset_update(asset_id, data)
