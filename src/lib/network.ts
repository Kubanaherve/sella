function errorText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message: unknown }).message || "");
  }
  return String(err || "");
}

/** Detect offline / transport failures (vs business/validation errors). */
export function isNetworkFailure(err: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  return /failed to fetch|networkerror|network request failed|load failed|timeout|ECONNREFUSED|ERR_NETWORK|FetchError|offline/i.test(
    errorText(err)
  );
}
