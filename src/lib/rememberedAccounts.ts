import { BRAND } from "@/lib/brand";

export interface RememberedAccount {
  phone: string;
  displayName: string;
  pinLength: number;
  shopCode?: string;
  shopName?: string;
  email?: string;
  role?: "owner" | "cashier" | "staff";
  isStaff?: boolean;
}

const ACCOUNTS_KEY = `${BRAND.storagePrefix}remembered_accounts`;
const LAST_PHONE_KEY = `${BRAND.storagePrefix}last_account_phone`;

function phoneKey(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) return phoneKey(digits.slice(2));
  if (digits.startsWith("250") && digits.length >= 12) return digits.slice(3, 12);
  if (digits.startsWith("0") && digits.length === 10) return digits.slice(1);
  if (digits.length > 9) return digits.slice(-9);
  return digits;
}

/** A label made only of digits and phone punctuation is not a person's name. */
export function looksLikePhoneLabel(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7) return false;
  return trimmed.replace(/[\d\s+\-().]/g, "").length === 0;
}

/** First candidate that is a real name. Phone numbers are skipped. */
export function personName(...candidates: Array<string | null | undefined>): string {
  for (const raw of candidates) {
    const name = String(raw ?? "").trim();
    if (!name || looksLikePhoneLabel(name)) continue;
    return name;
  }
  return "";
}

function withRealName(account: RememberedAccount): RememberedAccount {
  return {
    ...account,
    displayName: personName(account.displayName, account.shopName),
  };
}

export function loadRememberedAccounts(): RememberedAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RememberedAccount[];
    return Array.isArray(parsed) ? parsed.map(withRealName) : [];
  } catch {
    localStorage.removeItem(ACCOUNTS_KEY);
    return [];
  }
}

export function saveRememberedAccount(account: RememberedAccount): RememberedAccount[] {
  const existing = loadRememberedAccounts().filter(
    (a) => phoneKey(a.phone) !== phoneKey(account.phone)
  );
  const updated = [...existing, account];
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated));
  setLastAccountPhone(account.phone);
  return updated;
}

export function removeRememberedAccount(phone: string): RememberedAccount[] {
  const updated = loadRememberedAccounts().filter(
    (a) => phoneKey(a.phone) !== phoneKey(phone)
  );
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated));
  const last = getLastAccountPhone();
  if (last && phoneKey(last) === phoneKey(phone)) {
    if (updated.length > 0) setLastAccountPhone(updated[updated.length - 1].phone);
    else localStorage.removeItem(LAST_PHONE_KEY);
  }
  return updated;
}

export function setLastAccountPhone(phone: string) {
  localStorage.setItem(LAST_PHONE_KEY, phone);
}

export function getLastAccountPhone(): string | null {
  return localStorage.getItem(LAST_PHONE_KEY);
}

/** Prefer last-used shop; otherwise the only remembered shop. */
export function getPreferredAccount(
  accounts: RememberedAccount[] = loadRememberedAccounts()
): RememberedAccount | null {
  if (accounts.length === 0) return null;
  const last = getLastAccountPhone();
  if (last) {
    const match = accounts.find((a) => phoneKey(a.phone) === phoneKey(last));
    if (match) return match;
  }
  if (accounts.length === 1) return accounts[0];
  return null;
}

/**
 * Phone + PIN login does not know a name until the shop profile loads.
 * Never greet with the digits the cashier just typed.
 */
export function accountForPhoneLogin(
  phone: string,
  remembered: RememberedAccount[] = loadRememberedAccounts()
): RememberedAccount {
  const known = remembered.find((account) => phoneKey(account.phone) === phoneKey(phone));
  if (known) {
    return withRealName({ ...known, phone });
  }
  return { phone, displayName: "", pinLength: 4 };
}
