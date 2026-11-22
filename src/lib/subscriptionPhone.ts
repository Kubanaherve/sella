/** Digits the subscription API accepts: 8 to 15, no stored example number. */
export function subscriptionPhoneDigits(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

export function groupDigits(digits: string): string {
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

export function maskPhone(digits: string): string {
  if (digits.length < 4) return "••••";
  return `•••• ${digits.slice(-3)}`;
}
