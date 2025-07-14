import { BRAND } from "@/lib/brand";

export interface RememberedAccount {
  phone: string;
  displayName: string;
  pinLength: number;
  shopCode?: string;
  shopName?: string;
  email?: string;
}

const ACCOUNTS_KEY = `${BRAND.storagePrefix}remembered_accounts`;
const LAST_PHONE_KEY = `${BRAND.storagePrefix}last_account_phone`;

function phoneKey(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function loadRememberedAccounts(): RememberedAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RememberedAccount[];
    return Array.isArray(parsed) ? parsed : [];
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
