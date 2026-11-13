/** Detect offline / transport failures (vs business/validation errors). */
export function isNetworkFailure(err: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const msg = err instanceof Error ? err.message : String(err || "");
  return /failed to fetch|networkerror|network request failed|load failed|timeout|ECONNREFUSED|ERR_NETWORK|FetchError|offline/i.test(
    msg
  );
}
