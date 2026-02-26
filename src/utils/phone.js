/**
 * Normalize phone for consistent matching across formats:
 * +919949249432, 919949249432, 9949249432 -> 9949249432 (last 10 digits)
 */
export function normalizePhoneForMatch(v) {
  if (!v || typeof v !== 'string') return '';
  const digits = String(v).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}
