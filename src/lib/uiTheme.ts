/** Shopkeeper-friendly traffic-light + brand payment colors */
export const UI = {
  cash: "#16A34A",
  cashBg: "#DCFCE7",
  credit: "#D97706",
  creditBg: "#FEF3C7",
  lowStock: "#D97706",
  goodStock: "#16A34A",
  confirm: "#16A34A",
  momo: "#FFCC00",
  momoText: "#1A1A1A",
  airtel: "#E60000",
  bank: "#1A6FFF",
  overlay: "rgba(0,0,0,0.45)",
  brand: "#1A6FFF",
  brandDeep: "#0B3FCC",
  neonCyan: "#5AC8FA",
  neonMagenta: "#D033FF",
} as const;

/** Soft pastel chip for product / category tiles */
export function pastelForName(name: string): { bg: string; fg: string } {
  const palette = [
    { bg: "#FEF3C7", fg: "#92400E" }, // gold / warm
    { bg: "#DBEAFE", fg: "#1E40AF" }, // blue / silver
    { bg: "#FCE7F3", fg: "#9D174D" }, // rose
    { bg: "#D1FAE5", fg: "#065F46" }, // mint
    { bg: "#E0E7FF", fg: "#3730A3" }, // indigo
    { bg: "#FFEDD5", fg: "#9A3412" }, // orange
    { bg: "#E0F2FE", fg: "#075985" }, // sky
    { bg: "#F3E8FF", fg: "#6B21A8" }, // soft violet (accent only)
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % 997;
  return palette[h % palette.length];
}

export function stockTone(qty: number): { label: string; color: string; bg: string } {
  if (qty <= 0) return { label: "Byashize", color: "#B91C1C", bg: "#FEE2E2" };
  if (qty < 5) return { label: "Bike", color: UI.lowStock, bg: UI.creditBg };
  return { label: "Hariho", color: UI.goodStock, bg: UI.cashBg };
}

export function paymentMethodStyle(method: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (method) {
    case "cash":
      return { bg: UI.cash, text: "#FFFFFF", border: UI.cash };
    case "momo":
      return { bg: UI.momo, text: UI.momoText, border: "#E6B800" };
    case "airtel":
      return { bg: UI.airtel, text: "#FFFFFF", border: UI.airtel };
    case "bank":
      return { bg: UI.bank, text: "#FFFFFF", border: UI.brandDeep };
    default:
      return { bg: "#E2E8F0", text: "#0F172A", border: "#CBD5E1" };
  }
}
