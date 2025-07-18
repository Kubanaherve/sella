import {
  getDashboardStats,
  listActiveDebts,
  listInventory,
  listClients,
} from "@/db/api";
import { formatCurrency } from "@/lib/kinyarwanda";

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: number;
};

type Intent =
  | "greeting"
  | "today_money"
  | "week_money"
  | "unpaid"
  | "list_debts"
  | "find_debtor"
  | "stock"
  | "low_stock"
  | "customers"
  | "help_sale"
  | "help_debt"
  | "help_pay"
  | "help_import"
  | "help_general"
  | "unknown";

function normalize(q: string): string {
  return q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .trim();
}

function includesAny(hay: string, needles: string[]): boolean {
  return needles.some((n) => hay.includes(n));
}

function detectIntent(raw: string): { intent: Intent; nameHint?: string } {
  const q = normalize(raw);

  if (
    includesAny(q, [
      "muraho",
      "mwaramutse",
      "mwiriwe",
      "bite",
      "hello",
      "hi ",
      "hi!",
    ]) &&
    q.length < 40
  ) {
    return { intent: "greeting" };
  }

  if (
    includesAny(q, [
      "icyumweru",
      "week",
      "iminsi 7",
      "iyi cyumweru",
      "iki cyumweru",
    ]) &&
    includesAny(q, [
      "amafaranga",
      "yinjiye",
      "yinjiriye",
      "collected",
      "sales",
      "igurisha",
      "nakoze",
      "nigezehe",
    ])
  ) {
    return { intent: "week_money" };
  }

  if (
    includesAny(q, [
      "uyu munsi",
      "uyu munsi",
      "today",
      "none",
      "ubu",
      "nigezehe",
      "yinjiye",
      "yinjiriye",
      "amafaranga",
      "nakiriye",
      "collected",
    ]) &&
    includesAny(q, [
      "amafaranga",
      "yinjiye",
      "yinjiriye",
      "igurisha",
      "sales",
      "nakoze",
      "nigezehe",
      "collected",
      "cash",
      "momo",
    ])
  ) {
    return { intent: "today_money" };
  }

  if (
    includesAny(q, ["amafaranga", "yinjiye", "yinjiriye", "nigezehe", "nakoze"]) &&
    !includesAny(q, ["ideni", "debt", "atarishyura"])
  ) {
    return { intent: "today_money" };
  }

  if (
    includesAny(q, [
      "ideni ritarishyurwa",
      "atarishyura",
      "total unpaid",
      "bari ku ideni",
      "amadeni yose",
      "ideni ryose",
    ])
  ) {
    return { intent: "unpaid" };
  }

  const findMatch = q.match(
    /(?:umukiriya|client|umuntu|ideni rya|ya)\s+([a-zA-Zà-žÀ-Ž'-]{2,})/i
  );
  if (
    findMatch ||
    includesAny(q, ["shakisha", "find", "where is", "uri he"])
  ) {
    const nameHint =
      findMatch?.[1] ||
      q
        .replace(
          /(?:umukiriya|client|umuntu|ideni|shakisha|find|uri|he|ya|rya|rwa)/gi,
          " "
        )
        .trim()
        .split(/\s+/)[0];
    if (nameHint && nameHint.length >= 2) {
      return { intent: "find_debtor", nameHint };
    }
  }

  if (
    includesAny(q, [
      "bande bafite ideni",
      "urutonde rw'ideni",
      "list debts",
      "abafite ideni",
      "madeni",
      "ideni",
      "debts",
    ])
  ) {
    return { intent: "list_debts" };
  }

  if (
    includesAny(q, [
      "byashize",
      "low stock",
      "stock nke",
      "bihagije",
      "bike mu bubiko",
      "out of stock",
    ])
  ) {
    return { intent: "low_stock" };
  }

  if (
    includesAny(q, [
      "ububiko",
      "stock",
      "ibicuruzwa",
      "inventory",
      "ibyo mfite",
      "ibi hari",
    ])
  ) {
    return { intent: "stock" };
  }

  if (
    includesAny(q, [
      "abakiriya bangahe",
      "customers",
      "abakiriya",
      "clients",
      "umubare w'abakiriya",
    ])
  ) {
    return { intent: "customers" };
  }

  if (
    includesAny(q, [
      "ni gute nagurisha",
      "uko nagurisha",
      "new sale",
      "igurisha",
      "gurisha",
      "checkout",
      "agatebo",
    ])
  ) {
    return { intent: "help_sale" };
  }

  if (
    includesAny(q, [
      "ni gute nandika ideni",
      "kwandika ideni",
      "give credit",
      "asigaye",
      "azishyura nyuma",
    ])
  ) {
    return { intent: "help_debt" };
  }

  if (
    includesAny(q, [
      "kwishyura ideni",
      "record payment",
      "yakishyuye",
      "andika ko yishyuye",
      "payment",
    ])
  ) {
    return { intent: "help_pay" };
  }

  if (
    includesAny(q, [
      "import",
      "csv",
      "excel",
      "xlsx",
      "kuzana ububiko",
      "kwinjiza ibicuruzwa",
      "spreadsheet",
      "template",
    ])
  ) {
    return { intent: "help_import" };
  }

  if (
    includesAny(q, [
      "fasha",
      "help",
      "ni gute",
      "ukora iki",
      "wakorera iki",
      "ubufasha",
    ])
  ) {
    return { intent: "help_general" };
  }

  return { intent: "unknown" };
}

function topDebtsLine(
  debts: Array<{ client_name: string; remaining_balance: number }>,
  limit = 5
): string {
  if (!debts.length) return "Nta deni rihari ubu.";
  const sorted = [...debts].sort(
    (a, b) => b.remaining_balance - a.remaining_balance
  );
  const lines = sorted.slice(0, limit).map((d, i) => {
    return `${i + 1}. ${d.client_name} — ${formatCurrency(d.remaining_balance)}`;
  });
  const more =
    sorted.length > limit
      ? `\n… n'andi ${sorted.length - limit} (fungura Ideni kuri tab).`
      : "";
  return lines.join("\n") + more;
}

/** Answer shop questions in Kinyarwanda using live DB stats. */
export async function answerShopQuestion(question: string): Promise<string> {
  const { intent, nameHint } = detectIntent(question);

  try {
    switch (intent) {
      case "greeting":
        return (
          "Muraho neza! Ndi ChatSella. Nshobora kukubwira:\n" +
          "• Amafaranga yinjiye uyu munsi cyangwa iki cyumweru\n" +
          "• Ideni ritarishyurwa n'abakiriya\n" +
          "• Ububiko / ibicuruzwa bike\n" +
          "• Uko wakora igurisha cyangwa kwishyura ideni\n\n" +
          "Ask ChatSella — andika ikibazo mu Kinyarwanda."
        );

      case "today_money": {
        const s = await getDashboardStats();
        return (
          `Uyu munsi:\n` +
          `• Amafaranga yinjiye (cash/MoMo): ${formatCurrency(s.todayCollected)}\n` +
          `• Agaciro k'ibicuruzwa byagurishijwe: ${formatCurrency(s.todaySalesVolume)}\n` +
          `• Ideni ryatanzwe: ${formatCurrency(s.todayDebt)}\n\n` +
          `Ibi biva ku byishyuwe byanditswe muri Sella — ntabwo ari SMS za MoMo.`
        );
      }

      case "week_money": {
        const s = await getDashboardStats();
        return (
          `Iki cyumweru (iminsi 7):\n` +
          `• Amafaranga yinjiye: ${formatCurrency(s.weekCollected ?? s.todayCollected)}\n` +
          `• Agaciro k'ibicuruzwa: ${formatCurrency(s.weekSalesVolume ?? s.todaySalesVolume)}\n` +
          `• Ideni ryatanzwe: ${formatCurrency(s.weekDebt ?? s.todayDebt)}`
        );
      }

      case "unpaid": {
        const s = await getDashboardStats();
        return (
          `Ideni ryose ritarishyurwa: ${formatCurrency(s.totalUnpaid)}.\n` +
          `Abakiriya: ${s.totalCustomers}.\n` +
          `Ushobora kubona urutonde ku tab ya «Ideni».`
        );
      }

      case "list_debts": {
        const debts = await listActiveDebts();
        const s = await getDashboardStats();
        return (
          `Ideni ritarishyurwa: ${formatCurrency(s.totalUnpaid)}.\n` +
          `Abafite ideni (abakuru):\n${topDebtsLine(debts)}`
        );
      }

      case "find_debtor": {
        const debts = await listActiveDebts();
        const hint = (nameHint || "").toLowerCase();
        const hits = debts.filter((d) =>
          d.client_name.toLowerCase().includes(hint)
        );
        if (!hits.length) {
          return `Nta mukiriya ufite izina risa na «${nameHint}» ufite ideni. Gerageza izina rindi cyangwa fungura Abakiriya.`;
        }
        return (
          `Nabonye ${hits.length}:\n` +
          hits
            .slice(0, 8)
            .map(
              (d) =>
                `• ${d.client_name}${d.client_phone ? ` (${d.client_phone})` : ""} — ${formatCurrency(d.remaining_balance)}`
            )
            .join("\n")
        );
      }

      case "stock": {
        const items = await listInventory();
        if (!items.length) return "Ububiko burimo ubusa. Ongeraho ibicuruzwa ku tab ya «Ububiko».";
        const lines = items
          .slice(0, 10)
          .map(
            (i) =>
              `• ${i.item_name}: ${i.quantity} · ${formatCurrency(i.selling_price)}`
          );
        const more =
          items.length > 10 ? `\n… n'andi ${items.length - 10} mu bubiko.` : "";
        return `Ibicuruzwa mu bubiko (${items.length}):\n${lines.join("\n")}${more}`;
      }

      case "low_stock": {
        const items = await listInventory();
        const low = items.filter((i) => i.quantity <= 3);
        if (!low.length) return "Nta kicuruzwa gifite stock nke (≤ 3) ubu. Byiza!";
        return (
          `Ibicuruzwa bike cyangwa byashize:\n` +
          low
            .slice(0, 12)
            .map((i) => `• ${i.item_name}: ${i.quantity}`)
            .join("\n")
        );
      }

      case "customers": {
        const [clients, s] = await Promise.all([listClients(), getDashboardStats()]);
        return `Ufite abakiriya ${clients.length} (stats: ${s.totalCustomers}). Urutonde ruzuye ruri ku «Abakiriya» mu Ibindi.`;
      }

      case "help_sale":
        return (
          "Uko wakora igurisha:\n" +
          "1. Kanda «Igurisha rishya» (cyangwa + ku screen)\n" +
          "2. Hitamo ibicuruzwa → Agatebo\n" +
          "3. Kwishyura: Cash, MoMo, Airtel, cyangwa Banki\n" +
          "4. Ushobora kwishyura igice (split) cyangwa gusiga ideni\n" +
          "5. Emeza — igurisha rirandikwa\n\n" +
          "Niba hari asigaye, andika izina ry'umukiriya."
        );

      case "help_debt":
        return (
          "Ideni ritangwa mu igurisha:\n" +
          "• Kora igurisha nk'ubisanzwe\n" +
          "• Kwishyura, shyira amafaranga make kuruta igiteranyo (cyangwa 0)\n" +
          "• Andika izina ry'umukiriya\n" +
          "• Emeza — asigaye bigira ideni\n\n" +
          "Urutonde rw'ideni ruri ku tab «Ideni»."
        );

      case "help_pay":
        return (
          "Iyo umukiriya yishyuye ideni:\n" +
          "1. Jya ku «Ideni»\n" +
          "2. Hitamo umukiriya\n" +
          "3. Andika amafaranga n'uburyo (Cash/MoMo…)\n" +
          "4. Emeza — asigaye bigabanyuka\n\n" +
          "Ushobora no kohereza ubutumwa bwo kwibutsa."
        );

      case "help_import":
        return (
          "Uko wakwinjiza ibicuruzwa byinshi (CSV / Excel):\n" +
          "1. Jya ku «Ububiko» → ikona Upload, cyangwa Ibindi → Kuzana ububiko\n" +
          "2. Kurura template CSV niba ushaka urugero\n" +
          "3. Shyiramo dosye yawe (.csv cyangwa .xlsx)\n" +
          "4. Huza inyuguti (izina, igiciro, umubare, SKU…)\n" +
          "5. Reba preview — emeza mbere yo gukora\n" +
          "6. Hitamo: gukora bishya / guhindura / gusiga duplicates\n\n" +
          "ChatSella ntishobora kwinjiza amafaranga cyangwa umubare idasuzumye. " +
          "Import ikoresha logic ya Sella gusa nyuma yo kwemeza.\n\n" +
          "Ikora kuri quincaillerie, paint, grocery, imyenda — units: pcs, box, litre, kg…"
        );

      case "help_general":
        return (
          "Nshobora gufasha kuri:\n" +
          "• «Amafaranga yinjiye uyu munsi?»\n" +
          "• «Bande bafite ideni?»\n" +
          "• «Hari icyo cyashize mu bubiko?»\n" +
          "• «Ni gute nagurisha?»\n" +
          "• «Ni gute ninjiza CSV?»\n" +
          "• «Umukiriya Jean»\n\n" +
          "Andika mu Kinyarwanda — ndasubiza hashingiye ku makuru ya shop yawe."
        );

      default:
        return (
          "Sinabyumvise neza. Gerageza urugero:\n" +
          "• Amafaranga yinjiye uyu munsi?\n" +
          "• Ideni ritarishyurwa?\n" +
          "• Bande bafite ideni?\n" +
          "• Hari icyo cyashize?\n" +
          "• Ni gute nagurisha?"
        );
    }
  } catch (e) {
    console.error("shopAssistant", e);
    return "Habaye ikosa mu gufata amakuru ya shop. Ongera ugerageze vuba.";
  }
}
