import { formatCurrency, smsTemplates } from "@/lib/kinyarwanda";
import { phoneToWhatsAppDigits } from "@/lib/phone";

/** Unpaid debt reminder via WhatsApp (blueprint-corrected language). */
export const sendWhatsAppMessage = (
  phone: string,
  items: { name: string; qty: number; price: number }[],
  amount: number,
  dueDate?: string
) => {
  const formattedItems = items.length
    ? items.map((item) => `${item.name} x${item.qty}`).join(", ")
    : "ibicuruzwa";

  const message = smsTemplates.debtReminder(
    formattedItems,
    formatCurrency(amount).replace(" FRW", ""),
    dueDate
  );

  const normalizedPhone = phoneToWhatsAppDigits(phone);
  window.open(
    `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
};
