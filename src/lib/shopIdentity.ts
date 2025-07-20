/** Shop system ID — unique even when business names collide. */
export function formatShopCode(code: string | null | undefined): string {
  if (!code) return "—";
  return code.toUpperCase();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

/** Rwanda national ID is typically 16 digits; keep flexible for diaspora. */
export function normalizeNationalId(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function isValidNationalId(raw: string): boolean {
  const n = normalizeNationalId(raw);
  return n.length >= 5 && n.length <= 32;
}
