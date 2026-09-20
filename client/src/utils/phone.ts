/**
 * Formats any raw phone string into a clean Indian phone representation (+91 XXXXX XXXXX).
 */
export function formatIndianPhone(phone?: string | null): string {
  if (!phone) return '—';

  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // Strip leading 91 or 0 if present
  if (digits.startsWith('91') && digits.length > 10) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  // If 10 digits, format nicely
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  // Fallback to original string
  return phone;
}
