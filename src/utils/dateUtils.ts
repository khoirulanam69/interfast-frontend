/**
 * Date utility functions for WIB (UTC+7) timezone
 * All dates are converted and displayed in Asia/Jakarta timezone
 */

const WIB_TIMEZONE = 'Asia/Jakarta';

/**
 * Format a date string to WIB locale date (dd-MM-yyyy)
 */
export function formatDateWIB(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    timeZone: WIB_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format a date string to WIB readable date (e.g., "12 Mar 2026")
 */
export function formatDateLongWIB(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    timeZone: WIB_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date string to WIB datetime (dd-MM-yyyy HH:mm)
 */
export function formatDateTimeWIB(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('id-ID', {
    timeZone: WIB_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Get today's date in YYYY-MM-DD format, in WIB timezone.
 * Use this instead of `new Date().toISOString().split('T')[0]`
 */
export function getTodayWIB(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: WIB_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

/**
 * Convert a date string (possibly ISO/UTC) to YYYY-MM-DD in WIB.
 * Useful for pre-filling date input fields.
 */
export function toDateInputWIB(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: WIB_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

/**
 * Format date for WhatsApp message (dd-MM-yyyy) in WIB
 */
export function formatDateForMessage(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const parts = new Intl.DateTimeFormat('id-ID', {
    timeZone: WIB_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date);

  const day = parts.find(p => p.type === 'day')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const year = parts.find(p => p.type === 'year')?.value;
  return `${day}-${month}-${year}`;
}
