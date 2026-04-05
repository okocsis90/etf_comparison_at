/**
 * Validates an ISIN (International Securities Identification Number).
 * Format: 2 uppercase letters (country code) + 9 alphanumeric + 1 check digit.
 * Uses the Luhn mod-10 algorithm on the numeric expansion.
 */
export function isValidIsin(isin) {
  if (typeof isin !== 'string') return false;
  if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin)) return false;

  // Expand each character: digits stay, letters become two-digit numbers (A=10…Z=35)
  const digits = isin
    .split('')
    .map((c) => (c >= 'A' && c <= 'Z' ? (c.charCodeAt(0) - 55).toString() : c))
    .join('');

  // Luhn algorithm
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

