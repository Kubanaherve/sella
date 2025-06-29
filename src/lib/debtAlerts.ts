import { formatCurrency, formatDate } from "@/lib/kinyarwanda";
import { getOwnerPhone } from "@/db/api";
import { phoneToWhatsAppDigits } from "@/lib/phone";

/** Owner phone is stored in settings — never hardcoded in source. */
export async function resolveOwnerPhone(): Promise<string | null> {
  return getOwnerPhone();
}

export interface DebtAlertCustomer {
  id: string;
  name: string | null;
  phone: string | null;
  amount: number | null;
  created_at: string;
  due_date?: string | null;
  is_paid: boolean;
}

export interface DebtAlert {
  id: string;
  title: string;
  message: string;
  amount: number;
  customerId: string;
  customerName: string;
  phone: string | null;
  createdAt: string;
}

const NOTIFICATION_STORAGE_KEY = "sella_debt_alert_notifications";
const LAST_ACTIVE_STORAGE_KEY = "sella_last_active_at";
const TEN_HOURS_MS = 10 * 60 * 60 * 1000;

const normalizeCustomerKey = (customer: DebtAlertCustomer) => {
  const cleanedPhone = (customer.phone || "").replace(/\D/g, "");
  if (cleanedPhone) return `phone:${cleanedPhone}`;
  return `name:${(customer.name || "unknown").trim().toLowerCase()}`;
};

export const buildDebtAlerts = (customers: DebtAlertCustomer[]): DebtAlert[] => {
  const unpaidCustomers = customers
    .filter((customer) => !customer.is_paid && Number(customer.amount || 0) > 0)
    .sort(
      (left, right) =>
        new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
    );

  if (unpaidCustomers.length === 0) {
    return [];
  }

  const alerts: DebtAlert[] = [];
  const oldestDebt = unpaidCustomers[0];
  const oldestAmount = Number(oldestDebt.amount || 0);

  alerts.push({
    id: `oldest-${oldestDebt.id}-${oldestDebt.created_at}`,
    title: "Ideni rishaje",
    message: `Uyu mukiriya afite ideni rimaze igihe kinini kurusha abandi: ${
      oldestDebt.name || "Umukiriya"
    }. Afite ${formatCurrency(oldestAmount)} kuva ${formatDate(oldestDebt.created_at)}.`,
    amount: oldestAmount,
    customerId: oldestDebt.id,
    customerName: oldestDebt.name || "Umukiriya",
    phone: oldestDebt.phone,
    createdAt: oldestDebt.created_at,
  });

  const grouped = unpaidCustomers.reduce<
    Record<
      string,
      {
        customerName: string;
        phone: string | null;
        totalAmount: number;
        count: number;
        oldestCreatedAt: string;
      }
    >
  >((acc, customer) => {
    const key = normalizeCustomerKey(customer);

    if (!acc[key]) {
      acc[key] = {
        customerName: customer.name || "Umukiriya",
        phone: customer.phone,
        totalAmount: 0,
        count: 0,
        oldestCreatedAt: customer.created_at,
      };
    }

    acc[key].totalAmount += Number(customer.amount || 0);
    acc[key].count += 1;

    if (
      new Date(customer.created_at).getTime() <
      new Date(acc[key].oldestCreatedAt).getTime()
    ) {
      acc[key].oldestCreatedAt = customer.created_at;
    }

    return acc;
  }, {});

  const largestDebtGroup = Object.entries(grouped).sort(
    (left, right) => right[1].totalAmount - left[1].totalAmount
  )[0];

  if (largestDebtGroup) {
    const [groupKey, largest] = largestDebtGroup;
    const countMessage =
      largest.count > 1
        ? `Agaragara inshuro ${largest.count} mu madeni.`
        : "Ni we ufite ideni rinini cyane.";

    alerts.push({
      id: `largest-${groupKey}-${largest.oldestCreatedAt}`,
      title: "Ideni rinini",
      message: `Uyu mukiriya afite ideni rinini cyane kurusha abandi: ${
        largest.customerName
      }. ${countMessage} Amafaranga yose hamwe ni ${formatCurrency(
        largest.totalAmount
      )}. Reba muri message.`,
      amount: largest.totalAmount,
      customerId:
        unpaidCustomers.find(
          (customer) =>
            normalizeCustomerKey(customer) === groupKey
        )?.id || unpaidCustomers[0].id,
      customerName: largest.customerName,
      phone: largest.phone,
      createdAt: largest.oldestCreatedAt,
    });
  }

  return alerts;
};

export const notifyDebtAlerts = async (alerts: DebtAlert[]) => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  const notifiedIds = JSON.parse(localStorage.getItem(NOTIFICATION_STORAGE_KEY) || "[]") as string[];

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    return;
  }

  const freshIds = [...notifiedIds];

  alerts.forEach((alert) => {
    if (freshIds.includes(alert.id)) {
      return;
    }

    const notification = new Notification(alert.title, {
      body: alert.message,
      tag: alert.id,
    });

    notification.onclick = () => {
      window.focus();
    };

    freshIds.push(alert.id);
  });

  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(freshIds.slice(-20)));
};

export const buildOwnerSmsLink = async (message: string) => {
  const ownerPhone = await getOwnerPhone();
  if (!ownerPhone) return null;
  return `sms:${ownerPhone}?body=${encodeURIComponent(message)}`;
};

export const buildOwnerCallLink = async () => {
  const ownerPhone = await getOwnerPhone();
  if (!ownerPhone) return null;
  return `tel:${ownerPhone}`;
};

export const buildOwnerWhatsAppLink = async (message: string) => {
  const ownerPhone = await getOwnerPhone();
  if (!ownerPhone) return null;
  const cleanPhone = phoneToWhatsAppDigits(ownerPhone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

export const recordAppActivity = () => {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_ACTIVE_STORAGE_KEY, new Date().toISOString());
};

export const notifyIfInactiveForTenHours = async () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  const lastActive = localStorage.getItem(LAST_ACTIVE_STORAGE_KEY);
  recordAppActivity();

  if (!lastActive) {
    return;
  }

  const inactiveMs = Date.now() - new Date(lastActive).getTime();
  if (inactiveMs < TEN_HOURS_MS) {
    return;
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    return;
  }

  new Notification("Sella", {
    body: "Hashize amasaha 10 udakoresha porogaramu yawe. Reba amadeni n'ubutumwa bushya muri inbox.",
    tag: "inactive-10-hours",
  });
};
