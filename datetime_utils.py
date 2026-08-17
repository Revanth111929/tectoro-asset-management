"""
datetime_utils.py
Single source of truth for date/time handling across the application.

Rules this module enforces:
  - "Today" for business-date defaults and comparisons is always computed
    in India Standard Time (Asia/Kolkata), never from the server's own
    system clock or from UTC — so behavior is identical in the local
    office environment and on Render, regardless of each deployment's
    OS timezone configuration.
  - True instants (created_at, updated_at, timestamp, etc.) continue to
    be stored internally as naive UTC via datetime.utcnow(), per existing
    convention — this module does not change that. It only fixes how
    they are SERIALIZED (utc_iso) so the frontend can never misinterpret
    them as already being local time, and provides a correct helper
    (ist_midnight_utc) for the one case where a UTC-stored instant column
    needs to be compared against "today" in IST.

Imported identically by models.py, routes.py, api_lifecycle.py, and
services/pdf_generator.py so every part of the app agrees on "today".
"""

from datetime import datetime, timezone
from zoneinfo import ZoneInfo

IST = ZoneInfo('Asia/Kolkata')


def today_ist():
    """Current calendar date in India Standard Time. Use this for every
    business-date default or comparison (assignment dates, onboarding/
    offboarding dates, warranty windows, export filenames, etc.) instead
    of date.today() or datetime.utcnow().date()."""
    return datetime.now(IST).date()


def now_ist():
    """Current instant, as an aware datetime in India Standard Time.
    Use for anything that needs the current moment expressed in IST
    (e.g. human-readable 'generated at' timestamps in PDFs)."""
    return datetime.now(IST)


def ist_midnight_utc(d=None):
    """Naive UTC datetime for the instant 00:00:00 IST on date d
    (defaults to today in IST). Use this — not date.today() combined
    with datetime.min.time() — when filtering/comparing against a
    UTC-stored instant/DateTime column (e.g. AuditLog.timestamp) for
    'since the start of today [in IST]'."""
    if d is None:
        d = today_ist()
    aware = datetime(d.year, d.month, d.day, tzinfo=IST)
    return aware.astimezone(timezone.utc).replace(tzinfo=None)


def utc_iso(dt):
    """Serialize a naive UTC datetime (as produced by datetime.utcnow())
    into an unambiguous ISO-8601 string with an explicit 'Z' suffix, so
    the frontend's Date parser can never mistake it for already being in
    local time. Use only for true instant/DateTime fields — never for
    calendar-only Date fields (warranty_date, invoice_date, etc.), which
    have no time-of-day component and should not carry a timezone marker."""
    return (dt.isoformat() + 'Z') if dt else ''


def to_ist_string(dt):
    """
    Convert a naive UTC datetime to IST timezone and return as ISO string.
    
    This function is used for displaying timestamps to users in the frontend.
    All timestamps displayed in the UI should use IST (Asia/Kolkata, UTC+05:30).
    
    Args:
        dt: naive UTC datetime object (as stored in database)
        
    Returns:
        ISO format string in IST timezone, or empty string if dt is None
        
    Example:
        Input:  datetime(2026, 8, 7, 14, 6, 28)  # UTC
        Output: '2026-08-07T19:36:28+05:30'      # IST
    """
    if not dt:
        return ''
    
    # Assume naive datetime is UTC (as per our database convention)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    # Convert to IST
    ist_dt = dt.astimezone(IST)
    
    # Return ISO format string with timezone
    return ist_dt.isoformat()
