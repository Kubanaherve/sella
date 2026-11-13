import { BLUE_GLASS_BACK, BLUE_GLASS_TAGLINE } from "@/lib/blueGlass/assets";

const LEFT = 47;
const RIGHT = 507;

export type BlueGlassBadge = "Paid" | "Partial" | "Unpaid" | "Received" | "Open debt";

export type BlueGlassInvoiceInput = {
  id: string;
  date: string;
  due: string;
  customer: string;
  email?: string;
  phone?: string;
  address?: string;
  currency: string;
  discount?: number;
  taxRate?: number;
  taxAmount?: number;
  paid: number;
  items: { description: string; qty: number; unit: number }[];
  note: string[];
  contacts: string[];
};

export type BlueGlassReceiptInput = {
  shop: string;
  customer: string;
  address?: string;
  date: string;
  id: string;
  invoice: string;
  method: string;
  ref: string;
  currency: string;
  previousBalance: number;
  payment: number;
  contacts: string[];
};

export type BlueGlassStatementInput = {
  shop: string;
  id: string;
  asOf: string;
  date: string;
  currency: string;
  rows: { name: string; due: string; original: number; paid: number }[];
  contacts?: string[];
};

function esc(x: string | number): string {
  return String(x).replace(
    /[<>&"']/g,
    (ch) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[
        ch
      ] as string
  );
}

function money(v: number, cur: string): string {
  if (cur === "RWF") return new Intl.NumberFormat("en-US").format(Math.round(v));
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
    }).format(v);
  } catch {
    return `${v} ${cur}`;
  }
}

function text(
  x: number,
  y: number,
  v: string | number,
  size = 12,
  opt: {
    color?: string;
    bold?: boolean;
    align?: "start" | "middle" | "end";
  } = {}
): string {
  return `<text x="${x}" y="${y}" font-family="Outfit,Sora,system-ui,sans-serif" font-size="${size}" fill="${opt.color || "#10156c"}" font-weight="${opt.bold ? "700" : "500"}" letter-spacing="${opt.bold ? "-0.02em" : "-0.01em"}" text-anchor="${opt.align || "start"}">${esc(v)}</text>`;
}

function line(
  x: number,
  y: number,
  r: number,
  b: number,
  colour = "#a3b6ec",
  w = 0.7
): string {
  return `<path d="M${x} ${y} L${r} ${b}" fill="none" stroke="${colour}" stroke-width="${w}"/>`;
}

/** Handwritten glass-bold Sella script (cyan → electric → navy). */
function mark(x: number, y: number, w: number, wordmarkHref: string): string {
  const h = w * 0.4;
  return `<image href="${wordmarkHref}" xlink:href="${wordmarkHref}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMinYMid meet"/>`;
}

function icon(x: number, y: number, w: number, iconHref: string, clipId: string): string {
  return `<svg x="${x}" y="${y}" width="${w}" height="${w}" viewBox="0 0 100 100"><defs><clipPath id="${clipId}"><rect width="100" height="100" rx="21"/></clipPath></defs><g clip-path="url(#${clipId})"><image href="${iconHref}" xlink:href="${iconHref}" x="-8.4" y="-6.9" width="116.5" height="116.5"/></g><rect x=".5" y=".5" width="99" height="99" rx="21" fill="none" stroke="#fbfaff"/></svg>`;
}

function top(
  meta: string[],
  recipientLabel: string,
  details: string[],
  badge: BlueGlassBadge,
  iconHref: string,
  wordmarkHref: string,
  clipPrefix: string
): string {
  const [first, ...rest] = details;
  const paidish = badge === "Paid" || badge === "Received";
  return (
    icon(48, 47, 81, iconHref, `${clipPrefix}topIcon`) +
    mark(142, 58, 118, wordmarkHref) +
    text(147, 113, BLUE_GLASS_TAGLINE, 11.1, { color: "#1a4fbf" }) +
    line(366.5, 71, 366.5, 117, "#3b6fe8", 1) +
    meta.map((s, i) => text(385, 83 + 16 * i, s, 11.5, { color: "#0b3fcc" })).join("") +
    text(LEFT, 175, recipientLabel, 11.6, { color: "#4c5794" }) +
    text(LEFT, 195, first, 15.1, { bold: true, color: "#0a1f6c" }) +
    rest.map((s, i) => text(LEFT, 212 + i * 15.5, s, 12, { color: "#1d327b" })).join("") +
    `<rect x="414" y="171" width="93" height="42" rx="21" fill="url(#status)" stroke="#f5faff"/>` +
    (paidish
      ? `<circle cx="441" cy="192" r="8.3" fill="url(#green)"/><path d="m437.1 192.1 2.8 2.8 5-5.6" fill="none" stroke="white" stroke-width="1.5"/>`
      : "") +
    text(
      badge === "Paid" ? 461 : badge === "Received" ? 453 : 460,
      197,
      badge,
      badge === "Paid" ? 15 : 11,
      {
        color: paidish ? "#31953c" : "#0b3fcc",
        align: paidish ? "start" : "middle",
      }
    )
  );
}

function grid(
  head: string[],
  rows: (string | number)[][],
  xs: number[],
  align: ("start" | "middle" | "end")[]
): string {
  let out = line(LEFT, 259, RIGHT, 259, "#a0b4ff", 0.8);
  head.forEach((h, j) => {
    out += text(xs[j], 285, h, 12, {
      bold: true,
      align: align[j],
      color: j === 0 ? "#11196e" : "#304997",
    });
  });
  out += line(34, 300, 522, 300, "#c7d4f9", 0.7);
  rows.forEach((r, i) => {
    const y = 322 + 30 * i;
    r.forEach((v, j) => {
      out += text(xs[j], y, v, 12, { align: align[j] });
    });
    out += line(LEFT, y + 11, 522, y + 11, "#d1daf4", 0.65);
  });
  return out;
}

function totals(
  y: number,
  rows: [string, string][],
  label: string,
  value: string
): string {
  let out = "";
  let yy = y;
  for (const [name, v] of rows) {
    out += text(327, yy, name, 12) + text(506, yy, v, 12, { align: "end" });
    yy += 21;
  }
  const boxY = yy - 12;
  return (
    out +
    `<rect x="313.5" y="${boxY}" width="207" height="39" rx="11" fill="url(#pill)" stroke="#fafaff"/>` +
    text(328, boxY + 25, label, 16, { bold: true }) +
    text(506, boxY + 25, value, 16, { bold: true, align: "end" })
  );
}

function note(label: string, lines: string[], y = 510): string {
  return (
    `<rect x="47" y="${y - 15}" width="20" height="21" rx="4.5" fill="url(#info)" stroke="#eef7ff"/><circle cx="57" cy="${y - 5}" r="5.1" fill="#dce8ff"/>` +
    text(57, y - 2, "i", 8, { bold: true, align: "middle", color: "#5374de" }) +
    text(77, y, label, 13, { bold: true, color: "#264bc5" }) +
    lines.map((s, i) => text(77, y + 19 + i * 15, s, 10, { color: "#1d327b" })).join("")
  );
}

const globe = `<g stroke="#4169e9" fill="none" stroke-width=".9"><circle r="5"/><ellipse rx="2.5" ry="5"/><path d="M-4.6 -2H4.6M-4.6 2H4.6M-5 0H5"/></g>`;
const mail = `<g stroke="#4169e9" fill="none" stroke-width="1"><rect x="-5" y="-3.5" width="10" height="7" rx=".4"/><path d="m-5 -3.4 5 3.9 5-3.9"/></g>`;

function foot(
  contacts: string[],
  iconHref: string,
  wordmarkHref: string,
  clipPrefix: string,
  invoice = false
): string {
  let out = line(47, 581.5, 519, 581.5, "#3b6fe8", 0.95);
  if (invoice) {
    out +=
      `<g transform="translate(56 620)">${globe}</g><g transform="translate(162 620)">${mail}</g>` +
      text(68, 624, contacts[0] || "", 8.4, { color: "#0b3fcc" }) +
      line(141.5, 612, 141.5, 628, "#1a6fff", 0.9) +
      text(175, 624, contacts[1] || "", 8.4, { color: "#0b3fcc" }) +
      line(264, 612, 264, 628, "#1a6fff", 0.9) +
      text(278, 624, contacts[2] || "", 8.4, { color: "#0b3fcc" });
  } else {
    out += text(48, 624, contacts.filter(Boolean).join("   ·   "), 9, {
      color: "#0b3fcc",
    });
  }
  return (
    out +
    icon(418, 602, 34, iconHref, `${clipPrefix}footIcon`) +
    mark(456, 604, 62, wordmarkHref)
  );
}

function page(body: string, id: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="558" height="678" viewBox="0 0 558 678">${BLUE_GLASS_BACK}${body}</svg>`;
  return svg
    .replace(/id="([A-Za-z]+)"/g, (_, s: string) => `id="${id}${s}"`)
    .replace(/url\(#([A-Za-z]+)\)/g, (_, s: string) => `url(#${id}${s})`);
}

function invoiceBadge(d: BlueGlassInvoiceInput): BlueGlassBadge {
  const subtotal = d.items.reduce((s, l) => s + l.qty * l.unit, 0);
  const due = subtotal - (d.discount || 0) + (d.taxAmount || 0);
  if (d.paid >= due) return "Paid";
  if (d.paid > 0) return "Partial";
  return "Unpaid";
}

/** Build SVG page strings for an invoice (3 line-items per page). */
export function renderInvoiceSvgPages(
  d: BlueGlassInvoiceInput,
  iconHref: string,
  wordmarkHref: string
): string[] {
  const subtotal = d.items.reduce((s, l) => s + l.qty * l.unit, 0);
  const due = subtotal - (d.discount || 0) + (d.taxAmount || 0);
  const amt = (x: number) => money(x, d.currency);
  const sum: [string, string][] = [
    ["Subtotal", amt(subtotal)],
    ...((d.discount || 0) > 0 ? ([["Discount", amt(-(d.discount || 0))]] as [string, string][]) : []),
    [`Tax (${d.taxRate || 0}%)`, amt(d.taxAmount || 0)],
  ];
  const badge = invoiceBadge(d);
  const sections: string[] = [];
  const items = d.items.length ? d.items : [{ description: "—", qty: 0, unit: 0 }];
  for (let i = 0; i < items.length; i += 3) {
    const chunk = items.slice(i, i + 3);
    const last = i + 3 >= items.length;
    const clip = `inv${i}`;
    let body = top(
      [`Invoice #${d.id}`, `Date: ${d.date}`, `Due: ${d.due}`],
      "Bill To",
      [d.customer, d.email || d.phone || "", d.address || ""].filter(Boolean),
      badge,
      iconHref,
      wordmarkHref,
      clip
    );
    body += grid(
      ["Description", "Qty", "Unit Price", "Amount"],
      chunk.map((l) => [l.description, l.qty, amt(l.unit), amt(l.qty * l.unit)]),
      [47, 285, 372, 507],
      ["start", "middle", "middle", "end"]
    );
    if (last) {
      body += totals(421, sum, "Total", amt(due));
      body += note("Note", d.note, 510 + 21 * (sum.length - 2));
    } else {
      body += note("Continued", ["Additional items appear on the next page."]);
    }
    sections.push(body + foot(d.contacts, iconHref, wordmarkHref, clip, true));
  }
  return sections.map((body, i) => page(body, `g${i}`));
}

export function renderReceiptSvgPages(
  r: BlueGlassReceiptInput,
  iconHref: string,
  wordmarkHref: string
): string[] {
  const a = (v: number) => `${money(v, r.currency)} ${r.currency}`;
  const clip = "rc0";
  const body =
    top(
      [`Receipt #${r.id}`, `Date: ${r.date}`, `Invoice: ${r.invoice}`],
      "Received From",
      [r.customer, r.address || ""].filter(Boolean),
      "Received",
      iconHref,
      wordmarkHref,
      clip
    ) +
    grid(
      ["Reference", "Payment method", "Amount"],
      [[r.ref, r.method, a(r.payment)]],
      [47, 280, 507],
      ["start", "middle", "end"]
    ) +
    totals(
      392,
      [
        ["Previous balance", a(r.previousBalance)],
        ["This payment", a(r.payment)],
      ],
      "Balance",
      a(Math.max(0, r.previousBalance - r.payment))
    ) +
    note("Payment received", [
      `Thank you for your payment to ${r.shop}.`,
      "Please keep this receipt for your records.",
    ]) +
    foot(r.contacts, iconHref, wordmarkHref, clip, false);
  return [page(body, "g0")];
}

export function renderStatementSvgPages(
  s: BlueGlassStatementInput,
  iconHref: string,
  wordmarkHref: string
): string[] {
  const a = (v: number) => money(v, s.currency);
  const rows = s.rows
    .filter((r) => r.original > r.paid)
    .sort((x, y) => x.due.localeCompare(y.due));
  const list = rows.length ? rows : [];
  const sections: string[] = [];
  const pagesNeeded = Math.max(1, Math.ceil(Math.max(list.length, 1) / 3));
  for (let p = 0; p < pagesNeeded; p++) {
    const i = p * 3;
    const chunk = list.slice(i, i + 3);
    const last = p === pagesNeeded - 1;
    const clip = `st${p}`;
    let body = top(
      [`Statement #${s.id}`, `As of: ${s.date}`, `Currency: ${s.currency}`],
      "Prepared For",
      [s.shop, "Outstanding customer balances", "Internal shop copy"],
      "Open debt",
      iconHref,
      wordmarkHref,
      clip
    );
    body += grid(
      ["Customer", "Due date", "Paid", "Balance"],
      chunk.length
        ? chunk.map((r) => [
            r.name,
            r.due,
            a(r.paid),
            a(r.original - r.paid),
          ])
        : [["—", "—", a(0), a(0)]],
      [47, 268, 386, 507],
      ["start", "middle", "end", "end"]
    );
    if (last) {
      const orig = list.reduce((n, r) => n + r.original, 0);
      const paid = list.reduce((n, r) => n + r.paid, 0);
      const overdue = list
        .filter((r) => r.due < s.asOf)
        .reduce((n, r) => n + (r.original - r.paid), 0);
      body += totals(
        421,
        [
          ["Invoice totals", a(orig)],
          ["Payments received", a(paid)],
        ],
        "Balance due",
        a(orig - paid)
      );
      body += note("Collection note", [
        `Overdue balance as of ${s.date}: ${a(overdue)} ${s.currency}.`,
        "Balances are ordered by payment due date.",
      ]);
    }
    sections.push(
      body +
        foot(
          s.contacts || [s.shop, "Internal use"],
          iconHref,
          wordmarkHref,
          clip,
          false
        )
    );
  }
  return sections.map((body, i) => page(body, `g${i}`));
}
