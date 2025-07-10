/** Normalize Rwanda phone numbers to E.164 (+250…). */
export function normalizePhoneE164(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("250") && digits.length >= 12) {
    return `+${digits.slice(0, 12)}`;
  }
  // Local RW mobiles are 07XXXXXXXX (exactly 10 digits). Longer inputs are invalid — do not truncate into collisions.
  if (digits.startsWith("0") && digits.length === 10) {
    return `+250${digits.slice(1)}`;
  }
  if (digits.length === 9 && digits.startsWith("7")) {
    return `+250${digits}`;
  }
  if (digits.startsWith("0") && digits.length !== 10) {
    return "";
  }
  return `+${digits}`;
}

export function phoneToWhatsAppDigits(raw: string): string {
  return normalizePhoneE164(raw).replace("+", "");
}
