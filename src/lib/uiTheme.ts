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

/** Soft glass-blue pastel chips for product / category tiles */
export function pastelForName(name: string): { bg: string; fg: string } {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  if (isDark) {
    const darkPalette = [
      { bg: "rgba(30, 58, 138, 0.45)", fg: "#93C5FD" }, // ice blue glass
      { bg: "rgba(14, 116, 144, 0.45)", fg: "#67E8F9" }, // cyan glass
      { bg: "rgba(67, 56, 202, 0.45)", fg: "#A5B4FC" }, // indigo glass
      { bg: "rgba(88, 28, 135, 0.45)", fg: "#D8B4FE" }, // purple glass
      { bg: "rgba(3, 105, 161, 0.45)", fg: "#7DD3FC" }, // sky glass
      { bg: "rgba(29, 78, 216, 0.45)", fg: "#93C5FD" }, // royal glass
      { bg: "rgba(19, 78, 74, 0.45)", fg: "#5EEAD4" }, // teal glass
      { bg: "rgba(76, 29, 149, 0.45)", fg: "#C4B5FD" }, // violet glass
    ];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % 997;
    return darkPalette[h % darkPalette.length];
  }

  const palette = [
    { bg: "rgba(219, 234, 254, 0.92)", fg: "#1E40AF" }, // ice blue
    { bg: "rgba(224, 242, 254, 0.92)", fg: "#0369A1" }, // sky
    { bg: "rgba(224, 231, 255, 0.92)", fg: "#3730A3" }, // indigo glass
    { bg: "rgba(207, 250, 254, 0.9)", fg: "#0E7490" }, // cyan glass
    { bg: "rgba(236, 254, 255, 0.92)", fg: "#155E75" }, // aqua
    { bg: "rgba(239, 246, 255, 0.95)", fg: "#1D4ED8" }, // soft primary
    { bg: "rgba(219, 234, 254, 0.85)", fg: "#1E3A8A" }, // deep ice
    { bg: "rgba(186, 230, 253, 0.88)", fg: "#075985" }, // bright sky
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % 997;
  return palette[h % palette.length];
}

export function stockTone(qty: number): { label: string; color: string; bg: string } {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  if (isDark) {
    if (qty <= 0) return { label: "Byashize", color: "#F87171", bg: "rgba(239, 68, 68, 0.2)" };
    if (qty < 5) return { label: "Bike", color: "#FBBF24", bg: "rgba(245, 158, 11, 0.2)" };
    return { label: "Hariho", color: "#4ADE80", bg: "rgba(34, 197, 94, 0.2)" };
  }

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
