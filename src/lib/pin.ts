/** Simple browser-side PIN hash (local DB mode). Not a substitute for server auth. */
export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`jfj-v2:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPin(pin: string, pinHash: string): Promise<boolean> {
  const next = await hashPin(pin);
  return next === pinHash;
}
