export const DAILY_CUSTOMER_PAYMENTS_PREFIX = "daily_customer_payments_";
export const DAILY_NEW_DEBT_PREFIX = "daily_new_debt_";

export const getDateKeyFromIso = (isoString: string) => isoString.split("T")[0];

export const isDateInFilter = (
  dateKey: string,
  filter: "today" | "week" | "month" | "all",
  now = new Date()
) => {
  const date = new Date(`${dateKey}T00:00:00`);
  const todayKey = getDateKeyFromIso(now.toISOString());

  if (filter === "today") {
    return dateKey === todayKey;
  }

  if (filter === "week") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    return date >= start;
  }

  if (filter === "month") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }

  return true;
};
