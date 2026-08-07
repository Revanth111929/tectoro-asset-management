/**
 * dateUtils.js
 * Centralized date/time formatting utility for the entire frontend.
 * Handles timezone conversion to IST (Asia/Kolkata) and provides consistent formatting.
 * 
 * ALL date/time display in the application MUST use these formatters to ensure consistency.
 */

// IST Timezone (Asia/Kolkata, UTC+05:30)
const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Format a datetime string/object to IST with date and time
 * Format: MM/DD/YYYY, HH:MM:SS
 * Example: 07/08/2026, 18:09:04
 * 
 * @param {string|Date|number} dateInput - Date string, Date object, or timestamp
 * @returns {string} Formatted datetime string in IST
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '—';
  
  try {
    const date = new Date(dateInput);
    
    // Check if valid date
    if (isNaN(date.getTime())) {
      console.warn('[dateUtils] Invalid date:', dateInput);
      return '—';
    }
    
    // Format to IST timezone with locale string
    return date.toLocaleString('en-US', {
      timeZone: IST_TIMEZONE,
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('[dateUtils] Error formatting date:', error, dateInput);
    return '—';
  }
}

/**
 * Format a datetime string to IST without seconds
 * Format: MM/DD/YYYY, HH:MM
 * Example: 07/08/2026, 18:09
 * 
 * @param {string|Date|number} dateInput - Date string, Date object, or timestamp
 * @returns {string} Formatted datetime string without seconds
 */
export function formatDateTimeShort(dateInput) {
  if (!dateInput) return '—';
  
  try {
    const date = new Date(dateInput);
    
    if (isNaN(date.getTime())) {
      console.warn('[dateUtils] Invalid date:', dateInput);
      return '—';
    }
    
    return date.toLocaleString('en-US', {
      timeZone: IST_TIMEZONE,
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('[dateUtils] Error formatting date:', error, dateInput);
    return '—';
  }
}

/**
 * Format a date string to IST date only (no time)
 * Format: MM/DD/YYYY
 * Example: 07/08/2026
 * 
 * @param {string|Date|number} dateInput - Date string, Date object, or timestamp
 * @returns {string} Formatted date string
 */
export function formatDate(dateInput) {
  if (!dateInput) return '—';
  
  try {
    const date = new Date(dateInput);
    
    if (isNaN(date.getTime())) {
      console.warn('[dateUtils] Invalid date:', dateInput);
      return '—';
    }
    
    return date.toLocaleDateString('en-US', {
      timeZone: IST_TIMEZONE,
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('[dateUtils] Error formatting date:', error, dateInput);
    return '—';
  }
}

/**
 * Format a time string to IST time only (no date)
 * Format: HH:MM:SS
 * Example: 18:09:04
 * 
 * @param {string|Date|number} dateInput - Date string, Date object, or timestamp
 * @returns {string} Formatted time string
 */
export function formatTime(dateInput) {
  if (!dateInput) return '—';
  
  try {
    const date = new Date(dateInput);
    
    if (isNaN(date.getTime())) {
      console.warn('[dateUtils] Invalid date:', dateInput);
      return '—';
    }
    
    return date.toLocaleTimeString('en-US', {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('[dateUtils] Error formatting time:', error, dateInput);
    return '—';
  }
}

/**
 * Calculate days until a future date from today (IST)
 * Returns negative number if date is in the past
 * 
 * @param {string|Date} dateInput - Future date
 * @returns {number} Number of days until the date (negative if past)
 */
export function daysUntil(dateInput) {
  if (!dateInput) return null;
  
  try {
    const target = new Date(dateInput);
    const now = new Date();
    
    if (isNaN(target.getTime())) {
      return null;
    }
    
    const diff = target - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('[dateUtils] Error calculating days until:', error, dateInput);
    return null;
  }
}

/**
 * Get warranty status class based on days until expiry
 * 
 * @param {number|null} days - Days until warranty expiry
 * @returns {string} CSS class name
 */
export function getWarrantyClass(days) {
  if (days === null || days === undefined) return 'text-muted';
  if (days < 0) return 'text-danger fw-bold';
  if (days <= 30) return 'text-danger';
  if (days <= 90) return 'text-warning';
  return 'text-success';
}

/**
 * Format date for input fields (YYYY-MM-DD)
 * 
 * @param {string|Date|number} dateInput - Date to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function formatDateForInput(dateInput) {
  if (!dateInput) return '';
  
  try {
    const date = new Date(dateInput);
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Convert to IST then extract date components
    const istString = date.toLocaleString('en-US', {
      timeZone: IST_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    // Parse MM/DD/YYYY to YYYY-MM-DD
    const [month, day, year] = istString.split('/');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('[dateUtils] Error formatting date for input:', error, dateInput);
    return '';
  }
}

/**
 * Get current date/time in IST
 * 
 * @returns {string} Current datetime formatted in IST
 */
export function getCurrentDateTime() {
  return formatDateTime(new Date());
}

/**
 * Parse a date string and return Date object
 * Handles various input formats
 * 
 * @param {string|Date|number} dateInput - Date string to parse
 * @returns {Date|null} Parsed Date object or null if invalid
 */
export function parseDate(dateInput) {
  if (!dateInput) return null;
  
  try {
    const date = new Date(dateInput);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error('[dateUtils] Error parsing date:', error, dateInput);
    return null;
  }
}

/**
 * Check if a date is in the past (compared to current IST time)
 * 
 * @param {string|Date|number} dateInput - Date to check
 * @returns {boolean} True if date is in the past
 */
export function isPast(dateInput) {
  const date = parseDate(dateInput);
  if (!date) return false;
  return date < new Date();
}

/**
 * Check if a date is today (in IST timezone)
 * 
 * @param {string|Date|number} dateInput - Date to check
 * @returns {boolean} True if date is today
 */
export function isToday(dateInput) {
  const date = parseDate(dateInput);
  if (!date) return false;
  
  const today = new Date();
  const dateInIST = new Date(date.toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
  const todayInIST = new Date(today.toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
  
  return dateInIST.getDate() === todayInIST.getDate() &&
         dateInIST.getMonth() === todayInIST.getMonth() &&
         dateInIST.getFullYear() === todayInIST.getFullYear();
}

// Export timezone constant for reference
export const TIMEZONE = IST_TIMEZONE;
export const TIMEZONE_OFFSET = '+05:30';
export const TIMEZONE_NAME = 'IST';
