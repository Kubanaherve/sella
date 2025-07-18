import { BRAND } from "@/lib/brand";

/** Cache keys safe to wipe on account switch — never wipe remembered shops / last phone. */
const EPHEMERAL_PREFIXES = [
  "dashboard_stats_cache",
  `${BRAND.storagePrefix}active_workspace_id`,
  `${BRAND.storagePrefix}session_profile_id`,
];

const PRESERVE_KEYS = new Set([
  `${BRAND.storagePrefix}remembered_accounts`,
  `${BRAND.storagePrefix}last_account_phone`,
]);

/** Clear ephemeral caches when switching users. Keeps remembered shops for PIN unlock. */
export function clearAccountLocalCaches(options?: { wipeLocalDb?: boolean }) {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (PRESERVE_KEYS.has(k)) continue;
    if (EPHEMERAL_PREFIXES.some((p) => k === p || k.startsWith(p))) {
      keys.push(k);
      continue;
    }
    // Legacy: wipe other sella_ keys except preserved
    if (k.startsWith(BRAND.storagePrefix) && !PRESERVE_KEYS.has(k)) {
      // Keep unlock is sessionStorage only; skip remembered
      if (
        k.includes("remembered") ||
        k.includes("last_account")
      ) {
        continue;
      }
      keys.push(k);
    }
  }
  keys.forEach((k) => localStorage.removeItem(k));

  if (options?.wipeLocalDb) {
    try {
      indexedDB.deleteDatabase(BRAND.localDbName);
    } catch {
      /* ignore */
    }
  }
}

export function onAccountSwitch(previousUserId: string | null, nextUserId: string | null) {
  // Different cloud user on same device — clear ephemeral caches only
  if (previousUserId && nextUserId && previousUserId !== nextUserId) {
    clearAccountLocalCaches({ wipeLocalDb: false });
  }
  // Logout: do NOT wipe remembered accounts or Dexie (PIN unlock + offline data)
  if (previousUserId && !nextUserId) {
    clearAccountLocalCaches({ wipeLocalDb: false });
  }
}
