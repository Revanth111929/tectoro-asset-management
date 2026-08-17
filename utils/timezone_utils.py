"""
Centralized Timezone Utilities for IST (Asia/Kolkata)

This module provides a single source of truth for all date/time operations
in the application. The business timezone is Asia/Kolkata (IST, UTC+05:30).

Usage:
    from utils.timezone_utils import get_ist_now, get_ist_today, format_ist_datetime
    
    # Get current IST datetime
    now = get_ist_now()
    
    # Get current IST date
    today = get_ist_today()
    
    # Format for display
    display_str = format_ist_datetime(some_utc_datetime)
"""

from datetime import datetime, date, time
from zoneinfo import ZoneInfo

# Application timezone - Indian Standard Time
APP_TIMEZONE = ZoneInfo("Asia/Kolkata")

# Timezone name for display
TIMEZONE_NAME = "IST"
TIMEZONE_DISPLAY = "Asia/Kolkata"


def get_ist_now():
    """
    Get current datetime in IST.
    
    Returns:
        datetime: Current datetime in Asia/Kolkata timezone
        
    Example:
        >>> now = get_ist_now()
        >>> print(now)  # 2026-08-17 14:48:00+05:30
    """
    return datetime.now(APP_TIMEZONE)


def get_ist_today():
    """
    Get current date in IST (business date).
    
    This is the correct "today" for business operations, reports,
    date validation, and user-facing features.
    
    Returns:
        date: Current date in Asia/Kolkata timezone
        
    Example:
        >>> today = get_ist_today()
        >>> print(today)  # 2026-08-17
    """
    return get_ist_now().date()


def get_ist_date_at_time(target_date, hour=0, minute=0, second=0):
    """
    Create an IST datetime for a specific date and time.
    
    Args:
        target_date: date object
        hour: Hour (0-23)
        minute: Minute (0-59)
        second: Second (0-59)
        
    Returns:
        datetime: IST datetime for the specified date and time
    """
    return datetime.combine(target_date, time(hour, minute, second), tzinfo=APP_TIMEZONE)


def utc_to_ist(utc_datetime):
    """
    Convert UTC datetime to IST.
    
    Args:
        utc_datetime: datetime object in UTC (can be naive or aware)
        
    Returns:
        datetime: Datetime converted to IST
        
    Example:
        >>> utc_dt = datetime(2026, 8, 17, 9, 18, 0)  # UTC
        >>> ist_dt = utc_to_ist(utc_dt)
        >>> print(ist_dt)  # 2026-08-17 14:48:00+05:30
    """
    if utc_datetime is None:
        return None
    
    # If naive, assume UTC
    if utc_datetime.tzinfo is None:
        utc_datetime = utc_datetime.replace(tzinfo=ZoneInfo("UTC"))
    
    return utc_datetime.astimezone(APP_TIMEZONE)


def ist_to_utc(ist_datetime):
    """
    Convert IST datetime to UTC.
    
    Args:
        ist_datetime: datetime object in IST (can be naive or aware)
        
    Returns:
        datetime: Datetime converted to UTC
    """
    if ist_datetime is None:
        return None
    
    # If naive, assume IST
    if ist_datetime.tzinfo is None:
        ist_datetime = ist_datetime.replace(tzinfo=APP_TIMEZONE)
    
    return ist_datetime.astimezone(ZoneInfo("UTC"))


def format_ist_datetime(dt, include_timezone=True):
    """
    Format datetime for display in IST.
    
    Args:
        dt: datetime object (can be UTC or IST)
        include_timezone: Whether to include timezone name
        
    Returns:
        str: Formatted datetime string
        
    Example:
        >>> dt = datetime(2026, 8, 17, 9, 18, 32)  # UTC
        >>> format_ist_datetime(dt)
        '17/08/2026 14:48:32 IST'
        >>> format_ist_datetime(dt, include_timezone=False)
        '17/08/2026 14:48:32'
    """
    if dt is None:
        return ''
    
    # Convert to IST if needed
    if dt.tzinfo is None or dt.tzinfo != APP_TIMEZONE:
        dt = utc_to_ist(dt) if dt.tzinfo is None or str(dt.tzinfo) == 'UTC' else dt.astimezone(APP_TIMEZONE)
    
    formatted = dt.strftime('%d/%m/%Y %H:%M:%S')
    
    if include_timezone:
        formatted += f' {TIMEZONE_NAME}'
    
    return formatted


def format_ist_date(d):
    """
    Format date for display (DD/MM/YYYY).
    
    Args:
        d: date object or datetime object
        
    Returns:
        str: Formatted date string
        
    Example:
        >>> d = date(2026, 8, 17)
        >>> format_ist_date(d)
        '17/08/2026'
    """
    if d is None:
        return ''
    
    if isinstance(d, datetime):
        d = d.date()
    
    return d.strftime('%d/%m/%Y')


def parse_date_safe(date_string):
    """
    Safely parse a date string in YYYY-MM-DD or DD/MM/YYYY format.
    
    Args:
        date_string: Date string to parse
        
    Returns:
        date: Parsed date object, or None if invalid
        
    Example:
        >>> parse_date_safe('2026-08-17')
        date(2026, 8, 17)
        >>> parse_date_safe('17/08/2026')
        date(2026, 8, 17)
    """
    if not date_string or not isinstance(date_string, str):
        return None
    
    date_string = date_string.strip()
    
    # Try YYYY-MM-DD format (API/database format)
    try:
        return datetime.strptime(date_string, '%Y-%m-%d').date()
    except ValueError:
        pass
    
    # Try DD/MM/YYYY format (display format)
    try:
        return datetime.strptime(date_string, '%d/%m/%Y').date()
    except ValueError:
        pass
    
    # Try DD-MM-YYYY format
    try:
        return datetime.strptime(date_string, '%d-%m-%Y').date()
    except ValueError:
        pass
    
    return None


def is_date_in_future(check_date, reference_date=None):
    """
    Check if a date is in the future relative to IST business date.
    
    Args:
        check_date: date object to check
        reference_date: Reference date (defaults to today in IST)
        
    Returns:
        bool: True if check_date is in the future
        
    Example:
        >>> # Assuming today is 2026-08-17 in IST
        >>> is_date_in_future(date(2026, 8, 18))
        True
        >>> is_date_in_future(date(2026, 8, 17))
        False
        >>> is_date_in_future(date(2026, 8, 16))
        False
    """
    if check_date is None:
        return False
    
    if reference_date is None:
        reference_date = get_ist_today()
    
    return check_date > reference_date


def is_date_in_past(check_date, reference_date=None):
    """
    Check if a date is in the past relative to IST business date.
    
    Args:
        check_date: date object to check
        reference_date: Reference date (defaults to today in IST)
        
    Returns:
        bool: True if check_date is in the past
    """
    if check_date is None:
        return False
    
    if reference_date is None:
        reference_date = get_ist_today()
    
    return check_date < reference_date


def validate_date_not_future(date_value, field_name="Date"):
    """
    Validate that a date is not in the future (IST).
    
    Args:
        date_value: date object or date string
        field_name: Name of the field for error message
        
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
        
    Example:
        >>> validate_date_not_future(date(2026, 8, 17))
        (True, None)
        >>> validate_date_not_future(date(2026, 8, 18))
        (False, 'Date cannot be in the future')
    """
    if isinstance(date_value, str):
        date_value = parse_date_safe(date_value)
    
    if date_value is None:
        return False, f'{field_name} is invalid'
    
    if is_date_in_future(date_value):
        return False, f'{field_name} cannot be in the future'
    
    return True, None


# Legacy function name for backward compatibility
def get_current_ist_date():
    """Alias for get_ist_today()"""
    return get_ist_today()


def get_current_ist_datetime():
    """Alias for get_ist_now()"""
    return get_ist_now()
