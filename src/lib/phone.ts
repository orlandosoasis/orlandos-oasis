/**
 * Format a US phone number for display: (407) 555-1234
 * Accepts any input (digits, dashes, parens, country code). Strips
 * non-digits, takes the last 10, and formats. Returns the original
 * input unchanged if it doesn't reduce to exactly 10 digits.
 */
export function formatUsPhone(value: string): string {
  if (!value) return value;
  const digits = value.replace(/\D/g, "");
  const last10 = digits.length > 10 ? digits.slice(-10) : digits;
  if (last10.length !== 10) return value;
  return `(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6)}`;
}

/**
 * Returns true if the value contains exactly 10 digits, ignoring formatting.
 * Use to validate phone fields without requiring a specific format.
 */
export function isValidUsPhone(value: string): boolean {
  if (!value) return false;
  return value.replace(/\D/g, "").length === 10;
}
