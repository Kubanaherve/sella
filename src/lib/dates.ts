/** Calendar date helpers for Rwanda business day (Africa/Kigali, UTC+2). */

const KIGALI_TZ = "Africa/Kigali";

/** YYYY-MM-DD in Africa/Kigali for an Instant (default: now). */
export function calendarDateKeyInKigali(when: Date | string = new Date()): string {
  const d = typeof when === "string" ? new Date(when) : when;
  if (Number.isNaN(d.getTime())) return "";
  // en-CA yields YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KIGALI_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Local midnight-ish week window using Kigali calendar days (inclusive last 7 days). */
export function isWithinLastDaysKigali(iso: string, days = 7, now = new Date()): boolean {
  const key = calendarDateKeyInKigali(iso);
  if (!key) return false;
  const today = calendarDateKeyInKigali(now);
  if (key === today) return true;
  const start = new Date(now);
  // Walk back in UTC ms then compare Kigali keys — approximate week window
  for (let i = 1; i < days; i++) {
    const past = new Date(now.getTime() - i * 86400000);
    if (calendarDateKeyInKigali(past) === key) return true;
  }
  return false;
}
