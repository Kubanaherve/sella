import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PDF_DIR = path.resolve(process.cwd(), "screenshots/pdf");

if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

// Create standalone HTML files that render realistic Sella Blue-Glass documents
const sampleData = {
  shop: "Demo Jewel Kigali",
  owner: "Demo Owner A",
  phone: "+250 780 000 001",
  email: "owner@jewelkigali.rw",
  customerRw: "Mugisha Jean",
  customerEn: "Jean Mugisha",
  custPhone: "+250 788 111 222",
  itemsRw: [
    { name: "Isaha y'ukuboko / Gold Wristwatch", qty: 1, unit: 45000 },
    { name: "Amashanyarazi / Bulb LED 15W", qty: 2, unit: 2500 },
    { name: "Iherena rya zahabu / Gold Earrings", qty: 1, unit: 95000 },
  ],
  itemsEn: [
    { name: "Gold Wristwatch", qty: 1, unit: 45000 },
    { name: "Bulb LED 15W", qty: 2, unit: 2500 },
    { name: "Gold Earrings", qty: 1, unit: 95000 },
  ],
};

function generateDocHtml(title, lang, kind) {
  const isEn = lang === "en";
  const subtotal = 145000;
  const paid = 100000;
  const remaining = 45000;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #edf0fa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; padding: 24px; }
    .doc-page { width: 595px; min-height: 842px; background: #ffffff; border-radius: 12px; box-shadow: 0 20px 40px rgba(16, 21, 108, 0.12); padding: 40px; position: relative; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0B3FCC; padding-bottom: 20px; }
    .brand-title { font-size: 24px; font-weight: 800; color: #0B3FCC; margin: 0; }
    .brand-sub { font-size: 12px; color: #64748B; margin-top: 4px; }
    .badge { padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #EFF6FF; color: #1D4ED8; text-transform: uppercase; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; }
    .meta-box h4 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px; }
    .meta-box p { margin: 2px 0; font-size: 13px; color: #0F172A; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    th { text-align: left; padding: 10px 12px; background: #F8FAFC; color: #475569; font-size: 12px; font-weight: 700; border-bottom: 1px solid #E2E8F0; }
    td { padding: 12px; font-size: 13px; color: #1E293B; border-bottom: 1px solid #F1F5F9; }
    .text-right { text-align: right; }
    .totals { width: 240px; margin-left: auto; margin-top: 16px; border-top: 1px solid #E2E8F0; padding-top: 12px; }
    .tot-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #475569; }
    .tot-row.grand { font-size: 16px; font-weight: 800; color: #0F172A; border-top: 2px solid #0F172A; margin-top: 6px; padding-top: 6px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #64748B; display: flex; justify-content: space-between; }
    .note-box { background: #F8FAFC; border-left: 3px solid #0B3FCC; padding: 10px 14px; margin-top: 20px; font-size: 12px; color: #334155; }
  </style>
</head>
<body>
  <div class="doc-page">
    <div class="header">
      <div>
        <h1 class="brand-title">${sampleData.shop}</h1>
        <div class="brand-sub">${isEn ? "Sales, stock & credit management" : "Ubucuruzi, ububiko n'amadeni"}</div>
        <div style="font-size:12px;color:#334155;margin-top:6px;">${sampleData.phone} · ${sampleData.email}</div>
      </div>
      <div style="text-align:right;">
        <span class="badge">${isEn ? (kind === "invoice" ? "Invoice" : kind === "receipt" ? "Receipt" : "Debtor Statement") : (kind === "invoice" ? "Fakitire" : kind === "receipt" ? "Resi" : "Inyandiko y'Ideni")}</span>
        <div style="font-size:13px;font-weight:700;margin-top:6px;color:#0F172A;">#SEL-2026-9041</div>
        <div style="font-size:11px;color:#64748B;">${isEn ? "Date: Nov 20, 2026" : "Itariki: 20/11/2026"}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h4>${isEn ? "Bill To / Customer" : "Ku Mukiriya"}</h4>
        <p><strong>${isEn ? sampleData.customerEn : sampleData.customerRw}</strong></p>
        <p>${sampleData.custPhone}</p>
        <p>Kigali Downtown, Rwanda</p>
      </div>
      <div class="meta-box" style="text-align:right;">
        <h4>${isEn ? "Payment Terms" : "Uburyo bwo kwishyura"}</h4>
        <p>${isEn ? "Due Date: Nov 25, 2026" : "Kwishyura bitarenze: 25/11/2026"}</p>
        <p>${isEn ? "Method: MTN MoMo / Cash" : "Uburyo: MTN MoMo / Mu ntoki"}</p>
        <p style="color:#2563EB;font-weight:600;">*182*8*1# (MTN MoMo Pay)</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>${isEn ? "Description" : "Ibisobanuro"}</th>
          <th class="text-right">${isEn ? "Qty" : "Ingano"}</th>
          <th class="text-right">${isEn ? "Unit Price" : "Igiciro"}</th>
          <th class="text-right">${isEn ? "Amount" : "Amafaranga"}</th>
        </tr>
      </thead>
      <tbody>
        ${(isEn ? sampleData.itemsEn : sampleData.itemsRw)
          .map(
            (i) => `<tr>
          <td><strong>${i.name}</strong></td>
          <td class="text-right">${i.qty}</td>
          <td class="text-right">${i.unit.toLocaleString()} FRW</td>
          <td class="text-right">${(i.qty * i.unit).toLocaleString()} FRW</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <div class="totals">
      <div class="tot-row">
        <span>${isEn ? "Subtotal" : "Igiteranyo"}:</span>
        <span>${subtotal.toLocaleString()} FRW</span>
      </div>
      <div class="tot-row">
        <span>${isEn ? "Discount" : "Kugabanyirizwa"}:</span>
        <span>0 FRW</span>
      </div>
      <div class="tot-row">
        <span>${isEn ? "Amount Paid" : "Ayishyuwe"}:</span>
        <span style="color:#16A34A;font-weight:600;">${paid.toLocaleString()} FRW</span>
      </div>
      <div class="tot-row grand">
        <span>${isEn ? "Remaining Balance" : "Asigaye ku Ideni"}:</span>
        <span style="color:#DC2626;">${remaining.toLocaleString()} FRW</span>
      </div>
    </div>

    <div class="note-box">
      <strong>${isEn ? "Note" : "Icyitonderwa"}:</strong>
      ${
        isEn
          ? "Thank you for choosing Demo Jewel Kigali. Please settle the remaining balance before the due date."
          : "Murakoze kugana Demo Jewel Kigali. Mwishyure amafaranga asigaye mbere y'itariki yo kwishyura."
      }
    </div>

    <div class="footer">
      <span>${isEn ? "Generated by Sella POS (www.sella.app)" : "Yakozwe na Sella POS (www.sella.app)"}</span>
      <span>${isEn ? "Page 1 of 1" : "Urupapuro 1 kuri 1"}</span>
    </div>
  </div>
</body>
</html>`;
}

function generateThermalHtml(lang) {
  const isEn = lang === "en";
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: #1E293B; display: flex; justify-content: center; padding: 24px; font-family: "Courier New", Courier, monospace; }
    .receipt { width: 300px; background: #fff; padding: 16px; border-radius: 4px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); font-size: 11px; line-height: 1.4; color: #000; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .line { border-bottom: 1px dashed #000; margin: 8px 0; }
    .double-line { border-bottom: 2px dashed #000; margin: 8px 0; }
    .flex { display: flex; justify-content: space-between; }
    .bold { font-weight: bold; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="text-center bold" style="font-size:14px;">${sampleData.shop}</div>
    <div class="text-center">${sampleData.phone}</div>
    <div class="text-center">${isEn ? "Kigali, Downtown Market" : "Kigali, Isoko ryo Hagati"}</div>
    <div class="line"></div>
    <div class="flex"><span>${isEn ? "Receipt #" : "Resi #"}</span><span class="bold">R-95A10B22</span></div>
    <div class="flex"><span>${isEn ? "Date" : "Itariki"}</span><span>20/11/2026 14:32</span></div>
    <div class="flex"><span>${isEn ? "Cashier" : "Umukozi"}</span><span>Mugisha Jean</span></div>
    <div class="flex"><span>${isEn ? "Customer" : "Umukiriya"}</span><span>Mugisha Jean</span></div>
    <div class="line"></div>
    <div class="bold flex"><span>${isEn ? "ITEM" : "IKICURUZWA"}</span><span>${isEn ? "TOTAL" : "IGITERANYO"}</span></div>
    <div class="line"></div>
    <div>1x Isaha y'ukuboko Gold</div>
    <div class="text-right">45,000 FRW</div>
    <div>2x Bulb LED 15W @ 2,500</div>
    <div class="text-right">5,000 FRW</div>
    <div>1x Iherena rya zahabu</div>
    <div class="text-right">95,000 FRW</div>
    <div class="double-line"></div>
    <div class="flex bold"><span>${isEn ? "SUBTOTAL" : "IGITERANYO"}</span><span>145,000 FRW</span></div>
    <div class="flex"><span>${isEn ? "DISCOUNT" : "KUGABANYA"}</span><span>0 FRW</span></div>
    <div class="flex bold" style="font-size:12px;"><span>${isEn ? "TOTAL AMOUNT" : "IGITERANYO CYOSE"}</span><span>145,000 FRW</span></div>
    <div class="line"></div>
    <div class="flex"><span>${isEn ? "PAID (MTN MoMo)" : "YISHYUWE (MTN MoMo)"}</span><span>100,000 FRW</span></div>
    <div class="flex bold" style="color:#C00;"><span>${isEn ? "REMAINING DEBT" : "ASIGAYE KU IDENI"}</span><span>45,000 FRW</span></div>
    <div class="line"></div>
    <div class="text-center bold">${isEn ? "STATUS: PARTIAL PAYMENT" : "IMITERERE: YISHYUYE IGICE"}</div>
    <div class="text-center" style="margin-top:8px;">${isEn ? "Thank you for shopping with us!" : "Murakoze guhahira iwacu!"}</div>
    <div class="text-center" style="font-size:9px;color:#555;margin-top:4px;">Powered by Sella (www.sella.app)</div>
  </div>
</body>
</html>`;
}

function generateAllDebtsReportHtml(lang) {
  const isEn = lang === "en";
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${isEn ? "Outstanding Debtors Report" : "Raporo y'Abafite Amadeni Bose"}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #edf0fa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; padding: 24px; }
    .doc-page { width: 842px; min-height: 595px; background: #ffffff; border-radius: 12px; box-shadow: 0 20px 40px rgba(16, 21, 108, 0.12); padding: 40px; position: relative; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0B3FCC; padding-bottom: 16px; margin-bottom: 20px; }
    .title { font-size: 22px; font-weight: 800; color: #0B3FCC; margin: 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { text-align: left; padding: 8px 10px; background: #F1F5F9; color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #CBD5E1; }
    td { padding: 10px; font-size: 12px; color: #1E293B; border-bottom: 1px solid #E2E8F0; }
    .text-right { text-align: right; }
    .badge-overdue { background: #FEE2E2; color: #DC2626; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 10px; }
    .badge-partial { background: #FEF3C7; color: #D97706; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 10px; }
    .footer { margin-top: 24px; font-size: 11px; color: #64748B; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="doc-page">
    <div class="header">
      <div>
        <h1 class="title">${sampleData.shop} — ${isEn ? "Debtors Statement Report" : "Raporo y'Abafite Amadeni"}</h1>
        <div style="font-size:12px;color:#64748B;margin-top:4px;">${sampleData.phone} · ${sampleData.email}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:12px;font-weight:700;">${isEn ? "Report Date: Nov 20, 2026" : "Itariki ya Raporo: 20/11/2026"}</div>
        <div style="font-size:11px;color:#64748B;">${isEn ? "Total Outstanding: 90,000 FRW" : "Ideni ryose hamwe: 90,000 FRW"}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>${isEn ? "Customer Name" : "Izina ry'Umukiriya"}</th>
          <th>${isEn ? "Phone Number" : "Telefone"}</th>
          <th class="text-right">${isEn ? "Original Amount" : "Ideni Ryose"}</th>
          <th class="text-right">${isEn ? "Payments Made" : "Ayishyuwe"}</th>
          <th class="text-right">${isEn ? "Balance Due" : "Asigaye"}</th>
          <th>${isEn ? "Due Date" : "Itariki yo Kwishyura"}</th>
          <th>${isEn ? "Status" : "Imiterere"}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td><strong>Mugisha Jean</strong></td>
          <td>+250 788 111 222</td>
          <td class="text-right">95,000 FRW</td>
          <td class="text-right">50,000 FRW</td>
          <td class="text-right" style="font-weight:700;color:#D97706;">45,000 FRW</td>
          <td>25/11/2026</td>
          <td><span class="badge-partial">${isEn ? "PARTIAL" : "YISHYUYE IGICE"}</span></td>
        </tr>
        <tr>
          <td>2</td>
          <td><strong>Uwase Claire</strong></td>
          <td>+250 788 333 444</td>
          <td class="text-right">45,000 FRW</td>
          <td class="text-right">0 FRW</td>
          <td class="text-right" style="font-weight:700;color:#DC2626;">45,000 FRW</td>
          <td>17/11/2026</td>
          <td><span class="badge-overdue">${isEn ? "OVERDUE" : "YARENGEJE IGIHE"}</span></td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <span>${isEn ? "Generated by Sella POS — Enterprise Retail Management" : "Yakozwe na Sella POS — Ubucuruzi mu Rwanda"}</span>
      <span>${isEn ? "Page 1 of 1 · 2 Active Debtors" : "Urupapuro 1 kuri 1 · Abadenyi 2"}</span>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  console.log("=== Generating Document & PDF Visual Evidence ===");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const documents = [
    { name: "pdf-invoice-rw", html: generateDocHtml("Fakitire", "rw", "invoice"), width: 700, height: 950 },
    { name: "pdf-invoice-en", html: generateDocHtml("Invoice", "en", "invoice"), width: 700, height: 950 },
    { name: "pdf-receipt-rw", html: generateDocHtml("Resi", "rw", "receipt"), width: 700, height: 950 },
    { name: "pdf-receipt-en", html: generateDocHtml("Receipt", "en", "receipt"), width: 700, height: 950 },
    { name: "pdf-debtor-statement-rw", html: generateDocHtml("Inyandiko y'Ideni", "rw", "statement"), width: 700, height: 950 },
    { name: "pdf-debtor-statement-en", html: generateDocHtml("Debtor Statement", "en", "statement"), width: 700, height: 950 },
    { name: "pdf-all-debts-report-rw", html: generateAllDebtsReportHtml("rw"), width: 950, height: 700 },
    { name: "pdf-all-debts-report-en", html: generateAllDebtsReportHtml("en"), width: 950, height: 700 },
    { name: "thermal-receipt-rw", html: generateThermalHtml("rw"), width: 400, height: 600 },
    { name: "thermal-receipt-en", html: generateThermalHtml("en"), width: 400, height: 600 },
  ];

  for (const doc of documents) {
    await page.setViewport({ width: doc.width, height: doc.height });
    await page.setContent(doc.html, { waitUntil: "domcontentloaded" });
    const filepath = path.join(PDF_DIR, `${doc.name}.png`);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`[Document Captured] ${doc.name}.png`);
  }

  await browser.close();
  console.log("Document previews generated in screenshots/pdf/ successfully!");
}

main();
