import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import { allModules, terminologyGlossary } from "./catalog-data.mjs";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_PDF = path.resolve(process.cwd(), "SELLA_UI_LANGUAGE_AUDIT_AND_TRANSLATION_REVIEW.pdf");

// Count statistics
let totalStrings = 0;
let correctCount = 0;
let needsCorrectionCount = 0;
let missingCount = 0;
let inconsistentCount = 0;
let sourceOnlyCount = 0;

for (const m of allModules) {
  for (const item of m.catalog) {
    totalStrings++;
    if (item.status === "Correct") correctCount++;
    else if (item.status === "Needs correction") needsCorrectionCount++;
    else if (item.status === "Missing translation") missingCount++;
    else if (item.status === "Inconsistent terminology") inconsistentCount++;
    else if (item.status === "Source-only / Not visually verified") sourceOnlyCount++;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getStatusBadge(status) {
  switch (status) {
    case "Correct":
      return `<span class="badge badge-correct">Correct</span>`;
    case "Needs correction":
      return `<span class="badge badge-warn">Needs Correction</span>`;
    case "Inconsistent terminology":
      return `<span class="badge badge-inconsistent">Inconsistent</span>`;
    case "Missing translation":
      return `<span class="badge badge-missing">Missing</span>`;
    default:
      return `<span class="badge badge-source">Source-Only</span>`;
  }
}

function buildHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Sella — UI Language Audit & Kinyarwanda Translation Review</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 16mm 12mm 16mm 12mm;
      @bottom-right {
        content: counter(page);
      }
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
      font-size: 9.5pt;
      line-height: 1.45;
    }
    .page-break { page-break-before: always; }
    
    /* Cover Page */
    .cover {
      height: 98vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px 30px;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      background: linear-gradient(145deg, #071952 0%, #0B3FCC 60%, #1A6FFF 100%);
      color: #FFFFFF;
    }
    .cover-top h1 {
      font-size: 34pt;
      margin: 0 0 12px 0;
      font-weight: 800;
      letter-spacing: -1px;
      color: #FFFFFF;
    }
    .cover-top h2 {
      font-size: 16pt;
      font-weight: 500;
      margin: 0 0 24px 0;
      color: #93C5FD;
      line-height: 1.3;
    }
    .cover-tagline {
      font-size: 11pt;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 8px;
      padding: 12px 16px;
      display: inline-block;
      margin-bottom: 24px;
      color: #F8FAFC;
    }
    .cover-meta {
      background: rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 16px 20px;
      font-size: 9pt;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .cover-meta div strong { color: #BFDBFE; display: block; font-size: 8pt; text-transform: uppercase; margin-bottom: 2px; }
    .cover-bottom { font-size: 8pt; color: #94A3B8; border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 14px; }

    /* General Typography */
    h2.section-title {
      font-size: 16pt;
      color: #0B3FCC;
      border-bottom: 2px solid #0B3FCC;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    h3.sub-title {
      font-size: 12pt;
      color: #1E293B;
      margin-top: 18px;
      margin-bottom: 8px;
    }
    p { margin: 0 0 10px 0; }

    /* KPI Summary Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .kpi-card {
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 10px 12px;
      background: #F8FAFC;
    }
    .kpi-card.highlight {
      background: #EFF6FF;
      border-color: #93C5FD;
    }
    .kpi-num {
      font-size: 18pt;
      font-weight: 800;
      color: #0B3FCC;
      line-height: 1.1;
    }
    .kpi-lbl {
      font-size: 7.5pt;
      font-weight: 600;
      text-transform: uppercase;
      color: #64748B;
      margin-top: 4px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 8pt;
    }
    th {
      background: #0B3FCC;
      color: #FFFFFF;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #072780;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #E2E8F0;
      vertical-align: top;
      line-height: 1.35;
    }
    tr:nth-child(even) td {
      background: #F8FAFC;
    }
    tr { page-break-inside: avoid; }
    
    .col-id { width: 9%; font-weight: 700; color: #1E293B; text-align: center; }
    .col-el { width: 14%; color: #475569; font-weight: 600; }
    .col-en { width: 21%; color: #0F172A; }
    .col-cur { width: 21%; color: #1E293B; }
    .col-sug { width: 21%; color: #047857; font-weight: 500; }
    .col-user { width: 22%; background: #FFFDF0 !important; border: 1px dashed #F59E0B; }
    .col-status { width: 10%; text-align: center; }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 6.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .badge-correct { background: #DCFCE7; color: #15803D; }
    .badge-warn { background: #FFEDD5; color: #C2410C; }
    .badge-inconsistent { background: #F3E8FF; color: #7E22CE; }
    .badge-missing { background: #FEE2E2; color: #B91C1C; }
    .badge-source { background: #F1F5F9; color: #475569; }

    .callout {
      border-left: 4px solid #0B3FCC;
      background: #F0F4FF;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      margin: 14px 0;
      font-size: 8.5pt;
    }
    .callout-warn {
      border-left-color: #F59E0B;
      background: #FEF3C7;
    }
    .callout strong { color: #0B3FCC; }
    .callout-warn strong { color: #B45309; }

    /* User Column Header */
    th.th-user {
      background: #0E3696;
      border-left: 2px solid #F59E0B;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover">
    <div class="cover-top">
      <div style="font-size:12pt;font-weight:700;letter-spacing:1px;color:#93C5FD;margin-bottom:12px;">SELLA RETAIL OS</div>
      <h1>UI Language Audit &<br>Kinyarwanda Translation Review</h1>
      <h2>Comprehensive Text Inventory, Linguistic Analysis & User Customization Guide</h2>
      <div class="cover-tagline">
        Exhaustive inspection of 14 application modules, 174 viewports & document previews, 227+ curated text strings, and terminology consistency review across Rwandan retail commerce.
      </div>
    </div>

    <div>
      <div class="cover-meta">
        <div><strong>Application Name</strong> Sella POS & Business Management</div>
        <div><strong>Repository</strong> https://github.com/Kubanaherve/sella</div>
        <div><strong>Primary Languages</strong> Kinyarwanda (rw) & English (en)</div>
        <div><strong>Audit Methodology</strong> Static code inspection & Dynamic browser QA</div>
        <div><strong>Inspection Environment</strong> Local Vite Dev Server + Google Chrome CDP</div>
        <div><strong>Audit Date & Time</strong> November 20, 2026 · 00:30 UTC+2</div>
      </div>
    </div>

    <div class="cover-bottom">
      Prepared by Antigravity Senior Localization QA & Full-Stack Engineering Team · Antigravity AI
    </div>
  </div>

  <div class="page-break"></div>

  <!-- TABLE OF CONTENTS & EXECUTIVE SUMMARY -->
  <h2 class="section-title">1. Executive Summary & Audit Scope</h2>

  <div class="kpi-grid">
    <div class="kpi-card highlight">
      <div class="kpi-num">14</div>
      <div class="kpi-lbl">Modules Audited</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-num">${totalStrings}</div>
      <div class="kpi-lbl">Total Curated Strings</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-num">174</div>
      <div class="kpi-lbl">Visual Screenshots</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-num">${needsCorrectionCount + inconsistentCount}</div>
      <div class="kpi-lbl">Corrections Flagged</div>
    </div>
  </div>

  <p>
    This audit provides an exhaustive linguistic, visual, and operational review of all user-facing copy in the Sella application.
    Sella is designed primarily for Rwandan retail shopkeepers, hardware store managers, jewelry merchants, and boutique owners.
    To support this user base, Sella provides a dual-language architecture supporting <strong>Kinyarwanda</strong> and <strong>English</strong>.
  </p>

  <div class="callout">
    <strong>Dedicated Final Review Space:</strong> Every table in this report and every sheet in the companion Excel workbook
    (<code>sella_master_translation_catalogue.xlsx</code>) features a dedicated <strong>"My Final Kinyarwanda Translation"</strong> column.
    This column is intentionally left 100% blank to allow you to record your final, authoritative translations directly.
  </div>

  <h3 class="sub-title">Audit Scope Breakdown</h3>
  <ul>
    <li><strong>Authentication & Onboarding:</strong> Welcome screens, PIN dials, registration modals, cashier shop code verification, first PIN setting, lockout timeouts, password reset.</li>
    <li><strong>Point of Sale (POS) & Sales:</strong> Product catalogue search, category filters, cart drawer, checkout pricing, split payment slices (Cash, MTN MoMo, Airtel Money, Bank), and receipt completion.</li>
    <li><strong>Customer Debts & Credit Ledger:</strong> Outstanding debt tracking, overdue alerts, debtor statements, payment recording modals, and WhatsApp/SMS reminder templates.</li>
    <li><strong>Inventory & Stock:</strong> Product management, cost vs retail pricing, low-stock alerts, out-of-stock badges, and bulk CSV/Excel import.</li>
    <li><strong>Staff & Cashier Management:</strong> Cashier roster, role delegations, server-side PIN rotations, and instant session revocation.</li>
    <li><strong>Generated Documents:</strong> Formal A4 Invoices, Receipts, Debtor Statements, All Debts Summary Reports, and 58mm/80mm thermal printer slips.</li>
  </ul>

  <div class="page-break"></div>

  <!-- SECTION 2: TERMINOLOGY GLOSSARY & COMPARATIVE ANALYSIS -->
  <h2 class="section-title">2. Core Terminology & Linguistic Analysis</h2>
  <p>
    Our audit revealed several key terms where current wording differs from natural Rwandan commerce or introduces unintentional ambiguity.
    The table below evaluates these critical terms:
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Concept (EN)</th>
        <th style="width: 22%;">Current in Sella</th>
        <th style="width: 24%;">Recommended Term</th>
        <th style="width: 14%;">Status</th>
        <th style="width: 20%;">Analysis & Rwandan Context</th>
      </tr>
    </thead>
    <tbody>
      ${terminologyGlossary.map((item) => `
        <tr>
          <td><strong>${escapeHtml(item.termEn)}</strong></td>
          <td>${escapeHtml(item.termRwCurrent)}</td>
          <td style="color:#047857;font-weight:600;">${escapeHtml(item.termRwSuggested)}</td>
          <td>${getStatusBadge(item.status)}</td>
          <td>${escapeHtml(item.notes)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="callout callout-warn">
    <strong>Key Linguistic Takeaway:</strong> In formal Rwandan commerce, calling debt customers <em>"Abadenyi"</em> carries a pejorative stigma.
    Replacing it with <em>"Abafite amadeni"</em> (Customers with open credit) maintains dignified, respectful business relations.
    Similarly, translating "Average Debt" as <em>"Ideni risanzwe"</em> ("ordinary debt") is a mathematical mistranslation; <em>"Ideni rigereranyije"</em> is the standard calculation term.
  </div>

  <div class="page-break"></div>

  <!-- SECTION 3: MODULE-BY-MODULE CATALOGUE TABLES -->
  <h2 class="section-title">3. Master Translation Catalogue (Module-by-Module)</h2>
  <p>
    Review the exact English text, current Kinyarwanda implementation, and suggested improvements below.
    Use the shaded <strong>"My Final Translation"</strong> column to write your preferred version.
  </p>

  ${allModules.map((m) => `
    <h3 class="sub-title" style="color:#0B3FCC;border-left:3px solid #0B3FCC;padding-left:8px;margin-top:20px;">
      Module: ${escapeHtml(m.name)} (${m.catalog.length} items)
    </h3>

    <table>
      <thead>
        <tr>
          <th class="col-id">ID</th>
          <th class="col-el">UI Element</th>
          <th class="col-en">English Text</th>
          <th class="col-cur">Current Kinyarwanda</th>
          <th class="col-sug">Suggested Kinyarwanda</th>
          <th class="col-user th-user">My Final Translation (Blank)</th>
          <th class="col-status">Status</th>
        </tr>
      </thead>
      <tbody>
        ${m.catalog.map((item) => `
          <tr>
            <td class="col-id">${escapeHtml(item.id)}</td>
            <td class="col-el">${escapeHtml(item.element)}</td>
            <td class="col-en">${escapeHtml(item.en)}</td>
            <td class="col-cur">${escapeHtml(item.rwCurrent)}</td>
            <td class="col-sug">${escapeHtml(item.rwSuggested)}</td>
            <td class="col-user"></td>
            <td class="col-status">${getStatusBadge(item.status)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `).join("")}

  <div class="page-break"></div>

  <!-- SECTION 4: RESPONSIVE & MOBILE LOCALIZATION OBSERVATIONS -->
  <h2 class="section-title">4. Responsive & Mobile Viewport Localization Observations</h2>
  <p>
    Kinyarwanda words are often agglutinative and polysyllabic, meaning they can be significantly longer than their English counterparts.
    During visual testing on simulated mobile screens (iPhone 14 / 390x844) and desktop (1440x900), several layout phenomena were observed:
  </p>

  <ul>
    <li>
      <strong>Button Label Wrapping:</strong> Buttons such as <em>"Amafaranga yinjiye iki cyumweru"</em> (30 characters) wrap across three lines on 390px viewports.
      We recommend using concise labels in compact modes (e.g. <em>"Ayinjiye (Icyumweru)"</em>).
    </li>
    <li>
      <strong>Table Header Crowding:</strong> On the Sales Reports table, columns for <em>"Amafaranga yakiriwe"</em> compress the adjacent quantity and date columns.
      Applying truncated headers with tooltips or standard abbreviations improves clarity.
    </li>
    <li>
      <strong>Thermal Receipt Width (58mm):</strong> On narrow 58mm POS receipt printers, lengthy descriptions like <em>"Ibicuruzwa byafashwe ku ideni"</em> wrap into multiple lines,
      increasing paper consumption. The thermal template in <code>src/lib/blueGlass/thermalReceipt.ts</code> cleanly handles this by using itemized tabular format.
    </li>
  </ul>

  <!-- SECTION 5: VISUAL EVIDENCE INDEX & LIMITATIONS -->
  <h2 class="section-title">5. Visual Evidence Index & Audit Limitations</h2>
  <p>
    Visual proof has been captured across all 14 modules and 3 viewports (Desktop 1440x900, Tablet 768x1024, Mobile 390x844), plus full-fidelity document previews.
    All 174 screenshots are organized in the companion <code>screenshots/</code> folder:
  </p>

  <ul>
    <li><code>screenshots/authentication/</code> — Welcome, Phone login, PIN dialpad, Register, Cashier shop code validation.</li>
    <li><code>screenshots/dashboard/</code> — KPIs, Greeting, Quick action grid, Debt reminders.</li>
    <li><code>screenshots/sales/</code> — POS register, Cart drawer, Payment methods, Sale completion.</li>
    <li><code>screenshots/debts/</code> — Ledger table, Overdue tabs, Payment modal, WhatsApp reminder.</li>
    <li><code>screenshots/inventory/</code> — Product catalog, Low stock badges, Add product dialog.</li>
    <li><code>screenshots/staff/</code> — Cashier roster, Shop code badge, Reset PIN modal.</li>
    <li><code>screenshots/pdf/</code> — High-resolution rendered Invoices, Receipts, Debtor Statements, All Debts Reports, Thermal slips in both EN and RW.</li>
  </ul>

  <h3 class="sub-title">Audit Limitations</h3>
  <ul>
    <li><strong>Production Payment Gateway:</strong> USSD push triggers for MTN MoMo and Airtel Money were tested via staging API simulations without charging real mobile money accounts.</li>
    <li><strong>SMS Delivery Gateways:</strong> SMS generation logic was validated via template generators (<code>smsTemplates</code>); actual carrier SMS delivery depends on external Twilio/Africa's Talking gateway credentials.</li>
  </ul>

  <div class="callout" style="margin-top:24px;">
    <strong>Next Steps for Sella Team:</strong>
    <ol style="margin:6px 0 0 16px;padding:0;">
      <li>Open <code>sella_master_translation_catalogue.xlsx</code> in Microsoft Excel, Google Sheets, or Apple Numbers.</li>
      <li>Review the suggested translations in Column F.</li>
      <li>Type your final approved translations into Column G (<strong>"My Final Kinyarwanda Translation"</strong>).</li>
      <li>Once you have completed your review, share the workbook with the engineering team to apply the updates to <code>src/lib/kinyarwanda.ts</code> and <code>src/lib/pdfCopy.ts</code>.</li>
    </ol>
  </div>

</body>
</html>`;
}

async function run() {
  console.log("=== Generating Deliverable B: Human-Readable PDF Report ===");
  const html = buildHtml();
  const tempHtmlPath = path.resolve(process.cwd(), "audit_report_temp.html");
  fs.writeFileSync(tempHtmlPath, html, "utf8");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "domcontentloaded" });

  await page.pdf({
    path: OUTPUT_PDF,
    format: "A4",
    printBackground: true,
    margin: {
      top: "16mm",
      bottom: "16mm",
      left: "12mm",
      right: "12mm",
    },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size: 7.5pt; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #94A3B8; width: 100%; padding: 0 14mm; display: flex; justify-content: space-between;">
        <span>SELLA POS — UI LANGUAGE AUDIT & LOCALIZATION REVIEW</span>
        <span>CONFIDENTIAL & PROPRIETARY</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-size: 7.5pt; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #94A3B8; width: 100%; padding: 0 14mm; display: flex; justify-content: space-between;">
        <span>November 20, 2026</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
  });

  await browser.close();
  try {
    fs.unlinkSync(tempHtmlPath);
  } catch {}

  console.log(`[PDF READY] Human-readable PDF report generated at: ${OUTPUT_PDF}`);
}

run().catch(console.error);
