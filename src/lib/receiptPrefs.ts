const KEY = "sella_receipt_prefs_v1";

export type ReceiptPrefs = {
  enabled: boolean;
  autoGenerate: boolean;
  allowPdf: boolean;
  allowPrint: boolean;
  allowWhatsApp: boolean;
  showAnimation: boolean;
  thankYouMessage: string;
};

const DEFAULTS: ReceiptPrefs = {
  enabled: true,
  autoGenerate: false,
  allowPdf: true,
  allowPrint: true,
  allowWhatsApp: true,
  showAnimation: true,
  thankYouMessage: "Murakoze kuduhitamo! Thank you for shopping with us.",
};

export function getReceiptPrefs(): ReceiptPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setReceiptPrefs(patch: Partial<ReceiptPrefs>) {
  const next = { ...getReceiptPrefs(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
