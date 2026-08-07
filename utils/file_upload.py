"""
File Upload Utility
Handles invoice attachment uploads with validation and security
"""

import os
import re
from datetime import datetime
from werkzeug.utils import secure_filename
from typing import Tuple, Optional

# Configuration
UPLOAD_FOLDER = 'uploads/invoices'
ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB in bytes


def allowed_file(filename: str) -> bool:
    """
    Check if file extension is allowed
    
    Args:
        filename: Name of the file
        
    Returns:
        True if extension is allowed, False otherwise
    """
    has_extension = '.' in filename
    if not has_extension:
        print(f"[FILE VALIDATION] No extension in filename: {filename}")
        return False
    
    extension = filename.rsplit('.', 1)[1].lower()
    is_allowed = extension in ALLOWED_EXTENSIONS
    
    print(f"[FILE VALIDATION] Filename: {filename}")
    print(f"[FILE VALIDATION] Extension: {extension}")
    print(f"[FILE VALIDATION] Allowed extensions: {ALLOWED_EXTENSIONS}")
    print(f"[FILE VALIDATION] Is allowed: {is_allowed}")
    
    return is_allowed


def sanitize_filename(filename: str) -> str:
    """
    Sanitize and secure the filename
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    # Use werkzeug's secure_filename
    filename = secure_filename(filename)
    
    # Additional sanitization: remove any remaining special characters
    filename = re.sub(r'[^\w\s\-\.]', '', filename)
    
    # Limit filename length (keep extension)
    name, ext = os.path.splitext(filename)
    if len(name) > 100:
        name = name[:100]
    
    return f"{name}{ext}"


def generate_unique_filename(original_filename: str) -> str:
    """
    Generate a unique filename with timestamp prefix
    
    Args:
        original_filename: Original filename from user
        
    Returns:
        Unique filename with timestamp
        
    Example:
        "invoice.pdf" -> "20260805_153045_invoice.pdf"
    """
    # Sanitize the original filename
    safe_filename = sanitize_filename(original_filename)
    
    # Generate timestamp prefix
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Combine timestamp with sanitized filename
    return f"{timestamp}_{safe_filename}"


def validate_file_size(file_obj) -> Tuple[bool, Optional[str]]:
    """
    Validate file size
    
    Args:
        file_obj: File object from request.files
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Get file size by seeking to end
    file_obj.seek(0, os.SEEK_END)
    file_size = file_obj.tell()
    file_obj.seek(0)  # Reset to beginning
    
    if file_size > MAX_FILE_SIZE:
        size_mb = file_size / (1024 * 1024)
        return False, f"File size ({size_mb:.2f} MB) exceeds maximum allowed size (10 MB)"
    
    if file_size == 0:
        return False, "File is empty"
    
    return True, None


def save_invoice_file(file_obj, asset_id: int = None) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Save invoice file to uploads directory
    
    Args:
        file_obj: File object from request.files
        asset_id: Optional asset ID for filename context
        
    Returns:
        Tuple of (success, error_message, file_path)
        file_path is relative path: "uploads/invoices/filename.pdf"
    """
    try:
        # Check if file exists
        if not file_obj or file_obj.filename == '':
            return False, "No file provided", None
        
        # STEP 1: Log original file info
        print(f"\n{'='*80}")
        print(f"[UPLOAD] ========== FILE UPLOAD DEBUG ==========")
        print(f"[UPLOAD] Original filename: {file_obj.filename}")
        print(f"[UPLOAD] Content type: {file_obj.content_type}")
        print(f"[UPLOAD] File object type: {type(file_obj)}")
        
        # Validate file extension
        if not allowed_file(file_obj.filename):
            return False, f"File type not allowed. Supported types: {', '.join(ALLOWED_EXTENSIONS).upper()}", None
        
        # Validate file size
        is_valid, error_msg = validate_file_size(file_obj)
        if not is_valid:
            return False, error_msg, None
        
        # Get file size before save
        file_obj.seek(0, os.SEEK_END)
        original_size = file_obj.tell()
        file_obj.seek(0)  # Reset to beginning
        print(f"[UPLOAD] Original file size: {original_size} bytes ({original_size / 1024:.2f} KB)")
        
        # Read first 8 bytes for signature validation (without consuming the stream)
        file_obj.seek(0)
        first_bytes = file_obj.read(8)
        file_obj.seek(0)  # Reset for actual save
        
        hex_str = ' '.join(f'{b:02x}' for b in first_bytes)
        print(f"[UPLOAD] First 8 bytes (hex): {hex_str}")
        
        # Validate file signature based on extension
        file_ext = file_obj.filename.rsplit('.', 1)[1].lower()
        
        if file_ext == 'pdf':
            # PDF files must start with %PDF (25 50 44 46)
            if not first_bytes.startswith(b'%PDF'):
                print(f"[UPLOAD] ⚠️  Invalid PDF signature!")
                print(f"[UPLOAD] Expected: 25 50 44 46 (%PDF)")
                print(f"[UPLOAD] Got: {hex_str[:11]}")
                return False, "Invalid PDF file: File does not have a valid PDF signature. The file may be corrupted or is not a real PDF.", None
            print(f"[UPLOAD] ✅ Valid PDF signature detected")
            
        elif file_ext == 'png':
            # PNG signature: 89 50 4E 47 0D 0A 1A 0A
            png_signature = bytes([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
            if not first_bytes.startswith(png_signature):
                print(f"[UPLOAD] ⚠️  Invalid PNG signature!")
                return False, "Invalid PNG file: File does not have a valid PNG signature.", None
            print(f"[UPLOAD] ✅ Valid PNG signature detected")
            
        elif file_ext in ('jpg', 'jpeg'):
            # JPEG signature: FF D8
            if not first_bytes[:2] == bytes([0xFF, 0xD8]):
                print(f"[UPLOAD] ⚠️  Invalid JPEG signature!")
                return False, "Invalid JPEG file: File does not have a valid JPEG signature.", None
            print(f"[UPLOAD] ✅ Valid JPEG signature detected")
        
        print(f"{'='*80}\n")
        
        # Generate unique filename
        unique_filename = generate_unique_filename(file_obj.filename)
        print(f"[UPLOAD] Unique filename: {unique_filename}")
        
        # Ensure upload directory exists
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        # Full file path
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        print(f"[UPLOAD] Saving to: {file_path}")
        
        # Save the file in binary mode (werkzeug handles this automatically)
        file_obj.save(file_path)
        
        # Verify saved file
        if os.path.exists(file_path):
            saved_size = os.path.getsize(file_path)
            print(f"[UPLOAD] File saved successfully!")
            print(f"[UPLOAD] Saved file size: {saved_size} bytes ({saved_size / 1024:.2f} KB)")
            print(f"[UPLOAD] Size match: {saved_size == original_size}")
            
            # Verify saved file signature
            try:
                with open(file_path, 'rb') as f:
                    saved_first_bytes = f.read(8)
                saved_hex = ' '.join(f'{b:02x}' for b in saved_first_bytes)
                print(f"[UPLOAD] Saved file - First 8 bytes (hex): {saved_hex}")
                
                if file_ext == 'pdf':
                    if saved_first_bytes.startswith(b'%PDF'):
                        print(f"[UPLOAD] ✅ Saved file has valid PDF signature")
                    else:
                        print(f"[UPLOAD] ⚠️  WARNING: Saved file lost PDF signature!")
                        
            except Exception as e:
                print(f"[UPLOAD] Error verifying saved file: {e}")
        else:
            print(f"[UPLOAD] ⚠️  ERROR: File was not saved!")
            return False, "File save failed - file does not exist after save", None
        
        # Return relative path for database storage
        return True, None, file_path
        
    except Exception as e:
        print(f"[UPLOAD] Exception during save: {e}")
        import traceback
        traceback.print_exc()
        return False, f"Failed to save file: {str(e)}", None


def delete_invoice_file(file_path: str) -> Tuple[bool, Optional[str]]:
    """
    Delete invoice file from storage
    
    Args:
        file_path: Relative or absolute path to file
        
    Returns:
        Tuple of (success, error_message)
    """
    try:
        if not file_path:
            return True, None  # Nothing to delete
        
        # Handle both relative and absolute paths
        if not os.path.isabs(file_path):
            # Relative path - no need to prepend anything
            full_path = file_path
        else:
            full_path = file_path
        
        # Check if file exists
        if os.path.exists(full_path):
            # Security check: ensure file is within uploads directory
            real_path = os.path.realpath(full_path)
            upload_dir = os.path.realpath(UPLOAD_FOLDER)
            
            if not real_path.startswith(upload_dir):
                return False, "Security error: File path outside uploads directory"
            
            # Delete the file
            os.remove(full_path)
            return True, None
        else:
            # File doesn't exist - consider it successfully deleted
            return True, None
            
    except Exception as e:
        return False, f"Failed to delete file: {str(e)}"


def get_invoice_file_info(file_path: str) -> dict:
    """
    Get information about an invoice file
    
    Args:
        file_path: Relative path to file
        
    Returns:
        Dictionary with file information
    """
    if not file_path or not os.path.exists(file_path):
        return {
            'exists': False,
            'filename': None,
            'size': 0,
            'extension': None
        }
    
    filename = os.path.basename(file_path)
    file_size = os.path.getsize(file_path)
    _, ext = os.path.splitext(filename)
    
    return {
        'exists': True,
        'filename': filename,
        'size': file_size,
        'size_mb': round(file_size / (1024 * 1024), 2),
        'extension': ext.lower(),
        'path': file_path
    }


def get_file_url(file_path: str, base_url: str = '/api/assets/invoice') -> Optional[str]:
    """
    Generate URL for accessing the file
    
    Args:
        file_path: Relative path to file
        base_url: Base URL for file access endpoint
        
    Returns:
        Full URL to access the file, or None if no file
    """
    if not file_path:
        return None
    
    filename = os.path.basename(file_path)
    return f"{base_url}/{filename}"
