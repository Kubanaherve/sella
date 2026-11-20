/**
 * Last successful cloud reads, scoped by auth user.
 * Served when the network fails so the counter can still look up stock and debts.
 */
import Dexie, { type Table } from "dexie";
import { isNetworkFailure } from "@/lib/network";

interface CacheRow<T = unknown> {
  key: string;
  saved_at: string;
  value: T;
}

class ReadCacheDB extends Dexie {
  entries!: Table<CacheRow, string>;

  constructor() {
    super("sella_read_cache");
    this.version(1).stores({
      entries: "key",
    });
  }
}

const db = new ReadCacheDB();

function cacheKey(ownerKey: string, bucket: string): string {
  return `${ownerKey}:${bucket}`;
}

export async function writeReadCache<T>(
  ownerKey: string,
  bucket: string,
  value: T
): Promise<void> {
  if (!ownerKey) return;
  await db.entries.put({
    key: cacheKey(ownerKey, bucket),
    saved_at: new Date().toISOString(),
    value,
  });
}

export async function readReadCache<T>(
  ownerKey: string,
  bucket: string
): Promise<T | null> {
  if (!ownerKey) return null;
  const row = await db.entries.get(cacheKey(ownerKey, bucket));
  return row ? (row.value as T) : null;
}

export async function clearReadCache(ownerKey?: string): Promise<void> {
  if (!ownerKey) {
    await db.entries.clear();
    return;
  }
  const prefix = `${ownerKey}:`;
  await db.entries.filter((row) => row.key.startsWith(prefix)).delete();
}

/** Fetch, remember the result, and fall back to this owner's last copy on network failure. */
export async function withReadCache<T>(
  ownerKey: string,
  bucket: string,
  load: () => Promise<T>
): Promise<T> {
  try {
    const fresh = await load();
    await writeReadCache(ownerKey, bucket, fresh);
    return fresh;
  } catch (err) {
    if (!isNetworkFailure(err)) throw err;
    const cached = await readReadCache<T>(ownerKey, bucket);
    if (cached) return cached;
    throw err;
  }
}
