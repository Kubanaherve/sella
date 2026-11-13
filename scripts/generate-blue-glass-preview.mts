import { writeFileSync, readFileSync } from "fs";
import {
  renderInvoiceSvgPages,
  renderReceiptSvgPages,
  renderStatementSvgPages,
} from "../src/lib/blueGlass/renderSvg";

const icon = `data:image/png;base64,${readFileSync(
  "./src/assets/brand/sella-blueglass-icon.png"
).toString("base64")}`;
const wordmark = `data:image/png;base64,${readFileSync(
  "./src/assets/brand/sella-glass-script-pdf.png"
).toString("base64")}`;

const invoice = renderInvoiceSvgPages(
  {
    id: "INV-2026-1047",
    date: "Nov 12, 2026",
    due: "Nov 20, 2026",
    customer: "Aline Mukamana",
    email: "0788001122",
    address: "Kacyiru, Kigali",
    currency: "RWF",
    paid: 15000,
    items: [
      { description: "Chainette gold", qty: 2, unit: 25000 },
      { description: "Bracelet", qty: 1, unit: 10000 },
      { description: "Ear rings", qty: 1, unit: 8000 },
    ],
    note: [
      "Thank you for choosing Isoko rya Kacyiru.",
      "Pay to shop: 0781111111.",
    ],
    contacts: ["www.sella.app", "support@sella.app", "0781111111"],
  },
  icon,
  wordmark
);

const receipt = renderReceiptSvgPages(
  {
    shop: "Isoko rya Kacyiru",
    customer: "Aline Mukamana",
    address: "Kacyiru, Kigali",
    date: "Nov 12, 2026",
    id: "RC-2026-0018",
    invoice: "INV-2026-1047",
    method: "MTN MoMo",
    ref: "MOMO-12018",
    currency: "RWF",
    previousBalance: 60000,
    payment: 15000,
    contacts: ["Isoko rya Kacyiru", "Kacyiru, Kigali", "0781111111"],
  },
  icon,
  wordmark
);

const statement = renderStatementSvgPages(
  {
    shop: "Isoko rya Kacyiru",
    id: "ST-261112",
    asOf: "2026-11-12",
    date: "Nov 12, 2026",
    currency: "RWF",
    rows: [
      {
        name: "Claude Nkurunziza",
        due: "2026-11-08",
        original: 78000,
        paid: 18000,
      },
      {
        name: "Aline Mukamana",
        due: "2026-11-20",
        original: 85000,
        paid: 35000,
      },
      { name: "Diane Uwase", due: "2026-11-25", original: 47500, paid: 0 },
    ],
    contacts: ["Isoko rya Kacyiru", "0781111111", "Kigali, Rwanda"],
  },
  icon,
  wordmark
);

const pages = [...invoice, ...receipt, ...statement];
const html = `<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width, initial-scale=1"><title>Sella Blue Glass Preview</title>
<style>*{box-sizing:border-box}body{margin:0;background:#edf0fa;font-family:system-ui,sans-serif}header{padding:16px 20px;color:#10156c}main{padding:12px 12px 40px;display:grid;gap:24px;justify-items:center}article{width:min(558px,100%);line-height:0;filter:drop-shadow(0 18px 40px rgba(40,70,160,.18))}svg{max-width:100%;height:auto}h1{font-size:18px;margin:0}p{margin:4px 0 0;font-size:13px;opacity:.75}</style></head>
<body><header><h1>Sella blue-glass docs</h1><p>Invoice · Receipt · Statement — live app renderer</p></header><main>
${pages.map((s) => `<article>${s}</article>`).join("")}
</main></body></html>`;

writeFileSync("./public/blue-glass-preview.html", html);
console.log("wrote public/blue-glass-preview.html", pages.length, "pages");
