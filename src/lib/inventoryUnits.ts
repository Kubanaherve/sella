/** Supported units for multi-vertical retail shops. */
export const INVENTORY_UNITS = [
  { value: "pcs", labelRw: "Ingero (pcs)", labelEn: "Pieces" },
  { value: "box", labelRw: "Agasanduku", labelEn: "Boxes" },
  { value: "litre", labelRw: "Litiro", labelEn: "Litres" },
  { value: "kg", labelRw: "Kg", labelEn: "Kilograms" },
  { value: "metre", labelRw: "Metero", labelEn: "Metres" },
  { value: "roll", labelRw: "Umuzingo", labelEn: "Rolls" },
  { value: "bag", labelRw: "Isaho", labelEn: "Bags" },
  { value: "bottle", labelRw: "Icupa", labelEn: "Bottles" },
  { value: "set", labelRw: "Seti", labelEn: "Sets" },
  { value: "other", labelRw: "Ikindi", labelEn: "Other" },
] as const;

export function normalizeUnit(raw: string | null | undefined): string {
  if (!raw) return "pcs";
  const v = raw.trim().toLowerCase();
  const aliases: Record<string, string> = {
    piece: "pcs",
    pieces: "pcs",
    pc: "pcs",
    pcs: "pcs",
    unit: "pcs",
    units: "pcs",
    box: "box",
    boxes: "box",
    carton: "box",
    l: "litre",
    lt: "litre",
    liter: "litre",
    litre: "litre",
    litres: "litre",
    kg: "kg",
    kilo: "kg",
    kilogram: "kg",
    kilograms: "kg",
    m: "metre",
    meter: "metre",
    metre: "metre",
    meters: "metre",
    metres: "metre",
    roll: "roll",
    rolls: "roll",
    bag: "bag",
    bags: "bag",
    bottle: "bottle",
    bottles: "bottle",
    set: "set",
    sets: "set",
  };
  return aliases[v] || (v.length <= 12 ? v : "other");
}
