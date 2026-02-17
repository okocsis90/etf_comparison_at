export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parses a German date string (DD.MM.YYYY) into a JavaScript Date object.
 * @param {string} dateStr - Date string in format "DD.MM.YYYY"
 * @returns {Date} Parsed date object
 */
export function parseGermanDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    throw new Error(`Invalid date string: ${dateStr}`);
  }

  const parts = dateStr.trim().split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid German date format: ${dateStr}. Expected DD.MM.YYYY`);
  }

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
  const year = parseInt(parts[2], 10);

  const date = new Date(year, month, day);

  if (isNaN(date.getTime())) {
    throw new Error(`Failed to parse date: ${dateStr}`);
  }

  return date;
}

