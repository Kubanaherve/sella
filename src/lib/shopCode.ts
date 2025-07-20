/** Local shop codes — same shape as cloud `SEL-XXXXXX`. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateLocalShopCode(): string {
  let code = "SEL-";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}
