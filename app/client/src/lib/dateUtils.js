import { format, isValid, parse } from 'date-fns';

/** 
 * Formats a date to YYYY-MM-DD string for API requests
 * @param {Date|string} date - Date object or date string
 * @returns {string} Date in YYYY-MM-DD format
 */
export const toDateOnlyISOString = (date) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, 'yyyy-MM-dd');
};

/**
 * Safely formats a date string using a specified format
 * @param {Date|string} date - Date to format
 * @param {string} formatString - Format pattern to use
 * @returns {string} Formatted date string or empty string if invalid
 */
export const formatDateSafe = (date, formatString = 'MMM dd, yyyy') => {
  if (!date) return '';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (!isValid(dateObj)) return '';
    
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format date for HTML input[type="date"] element
 * @param {Date|string} date - Date to format
 * @returns {string} Date formatted as YYYY-MM-DD
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (!isValid(dateObj)) return '';
    
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

/**
 * Parses a date string and preserves the day correctly
 * (fixes timezone issues where the day might shift)
 * @param {string} dateString - Date string to parse
 * @returns {Date} Parsed date object
 */
export const parseDatePreservingDay = (dateString) => {
  if (!dateString) return new Date();
  
  try {
    // Handle ISO format strings (from input[type="date"])
    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      // Month is 0-indexed in JS Date
      return new Date(year, month - 1, day);
    }
    
    // For other formats, use parse from date-fns
    const parsed = parse(dateString, 'yyyy-MM-dd', new Date());
    if (isValid(parsed)) return parsed;
    
    // Fallback to standard parsing but fix timezone issues
    const date = new Date(dateString);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};
