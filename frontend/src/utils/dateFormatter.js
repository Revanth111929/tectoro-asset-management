/**
 * Centralized Date/Time Formatting Utilities
 *
 * Application Timezone: Asia/Kolkata (IST, UTC+05:30)
 *
 * All timestamps in the application should be displayed in IST,
 * regardless of the user's browser timezone.
 */

const IST_TIMEZONE = 'Asia/Kolkata';
const IST_LOCALE = 'en-IN';

/**
 * Format a datetime string to IST with full date and time
 *
 * @param {string|Date} dateString - ISO datetime string or Date object
 * @param {boolean} includeSeconds - Whether to include seconds (default: true)
 * @returns {string} Formatted datetime string in IST (e.g., "18/08/2026, 02:58:56")
 */
export function formatDateTimeIST(dateString, includeSeconds = true) {
  if (!dateString) return '—';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';

    const options = {
      timeZone: IST_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // Use 24-hour format to match Activity History
    };

    if (includeSeconds) {
      options.second = '2-digit';
    }

    return date.toLocaleString(IST_LOCALE, options);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '—';
  }
}

/**
 * Format a datetime string to IST with short format for timelines
 *
 * @param {string|Date} dateString - ISO datetime string or Date object
 * @returns {string} Formatted datetime string (e.g., "18 Aug 2026, 02:58 pm")
 */
export function formatTimelineDate(dateString) {
  if (!dateString) return '—';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';

    return date.toLocaleString(IST_LOCALE, {
      timeZone: IST_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting timeline date:', error);
    return '—';
  }
}

/**
 * Format a date string to IST (date only, no time)
 *
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted date string (e.g., "18/08/2026")
 */
export function formatDateIST(dateString) {
  if (!dateString) return '—';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';

    return date.toLocaleDateString(IST_LOCALE, {
      timeZone: IST_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '—';
  }
}

/**
 * Format a date string to readable format (e.g., "18 Aug 2026")
 *
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted date string
 */
export function formatDateReadable(dateString) {
  if (!dateString) return '—';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';

    return date.toLocaleDateString(IST_LOCALE, {
      timeZone: IST_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '—';
  }
}

/**
 * Get current IST datetime
 *
 * @returns {Date} Current date/time in IST
 */
export function getCurrentISTDate() {
  return new Date(new Date().toLocaleString(IST_LOCALE, { timeZone: IST_TIMEZONE }));
}

/**
 * Check if a date is in the future (IST)
 *
 * @param {string|Date} dateString - Date to check
 * @returns {boolean} True if date is in the future
 */
export function isDateInFuture(dateString) {
  if (!dateString) return false;

  try {
    const date = new Date(dateString);
    const now = getCurrentISTDate();
    return date > now;
  } catch (error) {
    return false;
  }
}

// Export default object with all functions
const dateFormatter = {
  formatDateTimeIST,
  formatTimelineDate,
  formatDateIST,
  formatDateReadable,
  getCurrentISTDate,
  isDateInFuture,
};

export default dateFormatter;
