import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const WORKSPACE_DIR = "/Users/friendkh/Projects/Mom_app_Bijoux/sella";
const ARTIFACT_DIR = "/Users/friendkh/.gemini/antigravity/brain/ac34b0df-6dd4-4a33-852d-4af49e4958e8";
const DOCS_DIR = path.join(WORKSPACE_DIR, "documents/mtn");
const BRAND_DIR = path.join(WORKSPACE_DIR, "public/brand");

fs.mkdirSync(DOCS_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

// Load brand assets
const sigBuffer = fs.readFileSync(path.join(BRAND_DIR, "sella-herve-signature-transparent.png"));
const sigDataUri = `data:image/png;base64,${sigBuffer.toString("base64")}`;

const logoBuffer = fs.readFileSync(path.join(BRAND_DIR, "sella-icon-192.png"));
const logoDataUri = `data:image/png;base64,${logoBuffer.toString("base64")}`;

const SELLA_SVG_PATHS = `
  <path d="M28 32 C29 16 38 5 51 5 C65 5 74 16 75 33 L67 33 C66 20 60 12 51 12 C42 12 36 20 35 32 Z" fill-rule="evenodd"/>
  <path d="M30 28 H72 C81 28 86 32 88 41 L90 51 C84 44 73 42 61 41 L49 40 C43 40 39 42 40 45 C41 47 44 48 47 49 C32 47 23 40 23 35 C23 31 26 29 30 28 Z" fill-rule="evenodd"/>
  <path d="M11 65 C14 72 22 76 32 76 C44 76 52 72 57 71 C69 74 76 80 76 85 C76 92 71 95 63 95 H24 C12 95 5 89 7 78 Z" fill-rule="evenodd"/>
  <path d="M31 28 C23 31 22 36 26 41 C30 46 39 49 50 51 L70 55 C85 58 93 64 94 74 C96 86 86 95 69 95 H61 C69 94 75 91 75 85 C75 77 65 72 51 69 L30 65 C15 62 10 56 12 47 L14 40 C16 33 22 28 31 28 Z" fill-rule="evenodd"/>
`;

function getStampSvg(color = "#153a8a", dateStr = "19 NOV 2026") {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 520" width="100%" height="100%">
  <defs>
    <filter id="ink-bleed" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.0" xChannelSelector="R" yChannelSelector="G" />
    </filter>
    <path id="topTextArc" d="M 68,260 A 192,192 0 1,1 452,260" fill="none" />
    <path id="bottomTextArc" d="M 80,260 A 180,180 0 0,0 440,260" fill="none" />
  </defs>

  <style>
    .stamp-text {
      fill: ${color};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Montserrat', sans-serif;
      text-rendering: geometricPrecision;
    }
  </style>

  <g filter="url(#ink-bleed)" class="stamp-text">
    <!-- Outer Heavy Ring -->
    <circle cx="260" cy="260" r="244" fill="none" stroke="${color}" stroke-width="7" />
    <circle cx="260" cy="260" r="233" fill="none" stroke="${color}" stroke-width="2" />
    <circle cx="260" cy="260" r="224" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="3,4.5" />
    <circle cx="260" cy="260" r="148" fill="none" stroke="${color}" stroke-width="3.5" />
    <circle cx="260" cy="260" r="141" fill="none" stroke="${color}" stroke-width="1.5" />

    <!-- Top Text -->
    <text font-size="26px" font-weight="900" letter-spacing="4px" stroke="none">
      <textPath href="#topTextArc" startOffset="50%" text-anchor="middle">
        ★ KUBANA FRIEND TECHNOLOGIES ★
      </textPath>
    </text>

    <!-- Bottom Text -->
    <text font-size="24px" font-weight="800" letter-spacing="6px" stroke="none">
      <textPath href="#bottomTextArc" startOffset="50%" text-anchor="middle">
        ★ KIGALI - RWANDA ★
      </textPath>
    </text>

    <!-- Rosettes -->
    <g transform="translate(72, 260) scale(0.95)"><polygon points="0,-10 3,-3 10,-3 4,2 6,9 0,5 -6,9 -4,2 -10,-3 -3,-3" fill="${color}" stroke="none" /></g>
    <g transform="translate(448, 260) scale(0.95)"><polygon points="0,-10 3,-3 10,-3 4,2 6,9 0,5 -6,9 -4,2 -10,-3 -3,-3" fill="${color}" stroke="none" /></g>

    <!-- Sella Icon -->
    <g transform="translate(235, 142) scale(0.50)" fill="${color}" stroke="none">
      ${SELLA_SVG_PATHS}
    </g>

    <text font-size="22px" font-weight="900" letter-spacing="2px" x="260" y="208" text-anchor="middle" stroke="none">SELLA</text>
    <line x1="168" y1="216" x2="352" y2="216" stroke="${color}" stroke-width="2" />
    <line x1="188" y1="219" x2="332" y2="219" stroke="${color}" stroke-width="0.8" />

    <text font-size="14.5px" font-weight="900" letter-spacing="1.5px" x="260" y="238" text-anchor="middle" stroke="none">HERVE FRIEND KUBANA</text>
    <text font-size="11.5px" font-weight="800" letter-spacing="1.8px" x="260" y="256" text-anchor="middle" stroke="none">MANAGING DIRECTOR &amp; CEO</text>
    
    <line x1="175" y1="264" x2="345" y2="264" stroke="${color}" stroke-width="1.5" />

    <text font-size="13px" font-weight="700" letter-spacing="1.2px" x="260" y="284" text-anchor="middle" stroke="none">REG: RDB / KIGALI</text>
    <text font-size="14px" font-weight="800" letter-spacing="2px" x="260" y="308" text-anchor="middle" stroke="none">DATE: ${dateStr}</text>
    <text font-size="13px" font-weight="800" letter-spacing="2px" x="260" y="330" text-anchor="middle" stroke="none">OFFICIAL SEAL</text>
  </g>
</svg>
`;
}

function runChrome(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(CHROME, args);
    let stderr = "";
    proc.stderr.on("data", (data) => (stderr += data.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Chrome failed (code ${code}): ${stderr}`));
    });
  });
}

const COMMON_CSS = `
  @page {
    size: A4 portrait;
    margin: 0;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #0f172a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .a4-page {
    width: 210mm;
    height: 297mm;
    max-height: 297mm;
    margin: 0 auto;
    background: #ffffff;
    padding: 16mm 18mm 14mm 18mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }
  .header-rule {
    height: 3px;
    background: linear-gradient(90deg, #1e3a8a 0%, #3b82f6 50%, #f59e0b 100%);
    margin-top: 10px;
    margin-bottom: 14px;
    border-radius: 2px;
  }
  .badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }
  .badge-navy {
    background: #eff6ff;
    color: #1e3a8a;
    border: 1px solid #bfdbfe;
  }
  .badge-gold {
    background: #fefce8;
    color: #854d0e;
    border: 1px solid #fef08a;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT 1: Corporate Application Letter
// ─────────────────────────────────────────────────────────────────────────────
function buildApplicationLetterHtml() {
  const stampSvg = getStampSvg("#153a8a", "19 NOV 2026");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Application Letter - Corporate SIM & MTN MoMo Open API</title>
  <style>
    ${COMMON_CSS}
    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .letterhead-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .company-name {
      font-size: 19px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .company-sub {
      font-size: 10px;
      color: #475569;
      font-weight: 600;
      margin: 2px 0 0;
    }
    .letterhead-right {
      text-align: right;
      font-size: 9.5px;
      color: #334155;
      line-height: 1.45;
    }
    .meta-bar {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      margin-bottom: 12px;
      color: #1e293b;
    }
    .recipient-box {
      font-size: 10px;
      line-height: 1.45;
      color: #0f172a;
      margin-bottom: 12px;
      background: #f8fafc;
      padding: 10px 12px;
      border-radius: 6px;
      border-left: 3px solid #1e3a8a;
    }
    .subject-line {
      font-size: 12px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #e2e8f0;
    }
    .body-text {
      font-size: 10px;
      line-height: 1.55;
      color: #1e293b;
      margin-bottom: 10px;
    }
    .body-text strong {
      color: #0f172a;
    }
    .numbered-list {
      margin: 6px 0 10px 18px;
      padding: 0;
      font-size: 10px;
      line-height: 1.5;
      color: #1e293b;
    }
    .numbered-list li {
      margin-bottom: 4px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 12px;
      font-size: 9.5px;
    }
    .info-table th, .info-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
      text-align: left;
    }
    .info-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      width: 32%;
    }
    .sign-stamp-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
    }
    .sign-box {
      width: 55%;
    }
    .signature-wrap {
      position: relative;
      height: 60px;
      margin-bottom: -12px;
    }
    .signature-img {
      position: absolute;
      top: -10px;
      left: 10px;
      height: 65px;
      z-index: 10;
    }
    .stamp-container {
      width: 155px;
      height: 155px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .footer-note {
      font-size: 8px;
      color: #64748b;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 8px;
    }
  </style>
</head>
<body>
<div class="a4-page">
  <div>
    <!-- Letterhead -->
    <div class="letterhead">
      <div class="letterhead-left">
        <img src="${logoDataUri}" style="width: 44px; height: 44px; border-radius: 8px;" alt="Logo" />
        <div>
          <h1 class="company-name">KUBANA FRIEND TECHNOLOGIES</h1>
          <p class="company-sub">Enterprise Software Development • Cloud Systems • Digital Payments</p>
        </div>
      </div>
      <div class="letterhead-right">
        <strong>Head Office:</strong> Kigali, Rwanda<br />
        <strong>Email:</strong> h.kubana@alustudent.com<br />
        <strong>Tel:</strong> +250 796 580 545<br />
        <strong>MoMo Dev ID:</strong> h.kubana@alustudent.com
      </div>
    </div>

    <div class="header-rule"></div>

    <!-- Date & Ref -->
    <div class="meta-bar">
      <span><strong>Ref:</strong> KFT/MTN-MOMO/2026/01</span>
      <span><strong>Date:</strong> 19 November 2026</span>
    </div>

    <!-- Recipient -->
    <div class="recipient-box">
      <strong>TO:</strong><br />
      The Head of Enterprise Business &amp; Mobile Money<br />
      <strong>Mobile Money Rwanda Ltd (MTN Rwanda)</strong><br />
      MTN Center Nyarutarama / Grand Pension Plaza Service Center<br />
      Kigali, Republic of Rwanda
    </div>

    <!-- Subject -->
    <div class="subject-line">
      SUBJECT: APPLICATION FOR NEW CORPORATE SIM REGISTRATION &amp; MTN MOMO OPEN API (COLLECTION / C2B) INTEGRATION
    </div>

    <!-- Body -->
    <div class="body-text">
      Dear Sir/Madam,
    </div>
    <div class="body-text">
      I have the honor to write to your office on behalf of <strong>KUBANA FRIEND TECHNOLOGIES</strong>, a legally incorporated technology enterprise in Rwanda, to formally request the registration of a new corporate Mobile Money line and integration with the <strong>MTN MoMo Open API (Collection / Request-to-Pay / C2B)</strong>.
    </div>
    <div class="body-text">
      Specifically, we request Mobile Money Rwanda Ltd to facilitate:
    </div>

    <ol class="numbered-list">
      <li><strong>Corporate SIM Registration:</strong> Issuance and corporate KYC registration of a new MTN SIM card under the legal business name of <strong>KUBANA FRIEND TECHNOLOGIES</strong>.</li>
      <li><strong>Corporate MoMo Merchant Wallet:</strong> Creation of a corporate Mobile Money merchant account directly anchored to this registered SIM to receive commercial software revenue.</li>
      <li><strong>MoMo Open API Production Credentials:</strong> Provisioning of live Collection API credentials (User ID, API Key, and Subscription Key) to automate customer subscription payments and instant USSD push checkout.</li>
    </ol>

    <div class="body-text">
      <strong>Business Context &amp; Purpose of Integration:</strong><br />
      KUBANA FRIEND TECHNOLOGIES is the creator of <strong>Sella</strong>, a high-performance Point of Sale (POS), stock inventory management, and customer credit recovery software application engineered specifically for retail shops and merchants across Kigali. Merchants use MTN Mobile Money to settle their recurring monthly subscriptions (Pro Tier: 15,000 RWF / month; Enterprise Tier: 40,000 RWF / month). Automated collection via MoMo Open API will allow seamless 1-click USSD payment prompts directly inside the Sella application.
    </div>

    <table class="info-table">
      <tr>
        <th>Legal Entity</th>
        <td><strong>KUBANA FRIEND TECHNOLOGIES</strong> (Republic of Rwanda)</td>
      </tr>
      <tr>
        <th>Authorized Signatory &amp; Ownership</th>
        <td><strong>Hervé Friend Kubana</strong> — Founder, Sole Shareholder &amp; Managing Director (Tel: +250 796 580 545)</td>
      </tr>
      <tr>
        <th>Product &amp; Application</th>
        <td><strong>SELLA</strong> — Retail POS &amp; Store Management Software Application</td>
      </tr>
      <tr>
        <th>MTN MoMo Developer Portal Account</th>
        <td><code>momodeveloper.mtn.co.rw</code> — Username: <strong>h.kubana@alustudent.com</strong> (Registered with Ericsson / MTN)</td>
      </tr>
      <tr>
        <th>API Product Requested</th>
        <td><strong>Collection API v1.0 (Request-to-Pay / C2B)</strong> — Currency: <strong>RWF</strong></td>
      </tr>
      <tr>
        <th>Webhook Callback URL</th>
        <td><code>https://ixihbqubatyfulnurpco.supabase.co/functions/v1/paypack-webhook</code></td>
      </tr>
    </table>

    <div class="body-text">
      <strong>Enclosed KYC &amp; Verification Documents:</strong><br />
      In compliance with Mobile Money Rwanda Ltd KYC standards, we enclose: (1) RDB Full Registration Certificate (Single-Member Company), (2) RRA TIN Registration Certificate, (3) Color Copy of National ID of Managing Director, (4) Certified Sole Shareholder Resolution, and (5) Sella Technical Integration Architecture Specification.
    </div>

    <div class="body-text">
      We appreciate your swift assistance in enabling this commercial integration to power retail digitalization in Rwanda.
    </div>
  </div>

  <div>
    <!-- Signature & Stamp Section -->
    <div class="sign-stamp-row">
      <div class="sign-box">
        <div style="font-size: 10px; font-weight: 700; color: #334155;">Respectfully submitted,</div>
        <div class="signature-wrap">
          <img src="${sigDataUri}" class="signature-img" alt="Herve Friend Kubana Signature" />
        </div>
        <div style="font-size: 11px; font-weight: 900; color: #0f172a; margin-top: 6px;">HERVÉ FRIEND KUBANA</div>
        <div style="font-size: 9.5px; font-weight: 700; color: #1e3a8a;">Founder, Sole Shareholder &amp; Managing Director</div>
        <div style="font-size: 9px; color: #475569;">KUBANA FRIEND TECHNOLOGIES</div>
      </div>

      <div class="stamp-container">
        <div style="width: 145px; height: 145px;">
          ${stampSvg}
        </div>
      </div>
    </div>

    <div class="footer-note">
      KUBANA FRIEND TECHNOLOGIES • RDB Registered Entity • Kigali, Rwanda • h.kubana@alustudent.com • MoMo Dev: h.kubana@alustudent.com • Ref: KFT/MTN-MOMO/2026/01
    </div>
  </div>
</div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT 2: Board / Managing Director Resolution
// ─────────────────────────────────────────────────────────────────────────────
function buildCorporateResolutionHtml() {
  const stampSvg = getStampSvg("#153a8a", "19 NOV 2026");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Corporate Resolution - Mobile Money Rwanda Ltd Account Opening</title>
  <style>
    ${COMMON_CSS}
    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .company-name {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .company-sub {
      font-size: 10px;
      color: #475569;
      font-weight: 600;
      margin: 2px 0 0;
    }
    .letterhead-right {
      text-align: right;
      font-size: 9.5px;
      color: #334155;
      line-height: 1.45;
    }
    .title-banner {
      text-align: center;
      margin: 12px 0 14px;
      padding: 10px;
      background: #f8fafc;
      border: 1.5px solid #0f172a;
      border-radius: 6px;
    }
    .title-banner h2 {
      margin: 0 0 4px;
      font-size: 13.5px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0f172a;
    }
    .title-banner p {
      margin: 0;
      font-size: 9.5px;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .resolution-body {
      font-size: 10px;
      line-height: 1.55;
      color: #1e293b;
    }
    .preamble {
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px dashed #cbd5e1;
    }
    .resolution-item {
      margin-bottom: 11px;
    }
    .resolution-item strong.res-title {
      color: #0f172a;
      font-weight: 900;
      text-transform: uppercase;
      display: block;
      margin-bottom: 2px;
      font-size: 10.5px;
    }
    .sign-stamp-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
    }
    .sign-box {
      width: 55%;
    }
    .signature-wrap {
      position: relative;
      height: 60px;
      margin-bottom: -12px;
    }
    .signature-img {
      position: absolute;
      top: -10px;
      left: 10px;
      height: 65px;
      z-index: 10;
    }
    .stamp-container {
      width: 155px;
      height: 155px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .footer-note {
      font-size: 8px;
      color: #64748b;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 8px;
    }
  </style>
</head>
<body>
<div class="a4-page">
  <div>
    <!-- Letterhead -->
    <div class="letterhead">
      <div>
        <h1 class="company-name">KUBANA FRIEND TECHNOLOGIES</h1>
        <p class="company-sub">Company Incorporated under the Laws of the Republic of Rwanda (RDB)</p>
      </div>
      <div class="letterhead-right">
        <strong>Head Office:</strong> Kigali, Rwanda<br />
        <strong>Official Email:</strong> h.kubana@alustudent.com<br />
        <strong>Telephone:</strong> +250 796 580 545
      </div>
    </div>

    <div class="header-rule"></div>

    <!-- Title Banner -->
    <div class="title-banner">
      <h2>SPECIAL RESOLUTION OF THE SOLE SHAREHOLDER &amp; MANAGING DIRECTOR</h2>
      <p>Pursuant to Law N° 007/2021 Governing Companies in Rwanda • Single-Shareholder Company</p>
    </div>

    <!-- Resolution Content -->
    <div class="resolution-body">
      <div class="preamble">
        I, the undersigned, <strong>HERVÉ FRIEND KUBANA</strong>, being the Founder, 100% Sole Shareholder, and Managing Director of <strong>KUBANA FRIEND TECHNOLOGIES</strong>, a private company duly incorporated under the laws of the Republic of Rwanda with the Rwanda Development Board (RDB), having full, exclusive legal and operational capacity, hereby adopt and certify the following formal corporate resolutions on this <strong>19th day of November, 2026</strong>:
      </div>

      <div class="resolution-item">
        <strong class="res-title">1. Establishment of Corporate Mobile Money Account</strong>
        IT IS RESOLVED that the Company establish, maintain, and operate a corporate Mobile Money account and registered corporate SIM card with <strong>Mobile Money Rwanda Ltd (MTN Rwanda)</strong> under the official registered company name <strong>KUBANA FRIEND TECHNOLOGIES</strong>.
      </div>

      <div class="resolution-item">
        <strong class="res-title">2. Appointment of Sole Authorized Signatory &amp; Custodian</strong>
        IT IS RESOLVED that the undersigned, <strong>HERVÉ FRIEND KUBANA</strong>, in his official capacity as <strong>Founder, Sole Shareholder &amp; Managing Director</strong>, is hereby designated, authorized, and empowered as the sole authorized signatory, administrator, and custodian of the corporate Mobile Money SIM card and account. He holds full unilateral authority to sign applications, execute merchant contracts, configure account PINs, withdraw or disburse corporate funds, and direct all commercial interactions with Mobile Money Rwanda Ltd.
      </div>

      <div class="resolution-item">
        <strong class="res-title">3. Authorization of MoMo Open API Collection &amp; C2B Integration</strong>
        IT IS RESOLVED that the Company approve and mandate the technical integration of <strong>MTN MoMo Open API (Collection / Request-to-Pay / C2B)</strong> into the Company's proprietary retail software application, <strong>Sella</strong> (Retail POS &amp; Store Management System developed by KUBANA FRIEND TECHNOLOGIES), to collect monthly customer subscription fees and transaction settlements directly into the corporate MoMo wallet.
      </div>

      <div class="resolution-item">
        <strong class="res-title">4. Authorization to Receive Electronic &amp; API Payments</strong>
        IT IS RESOLVED that all customer subscription payments deposited via MTN Mobile Money into this corporate account shall constitute legitimate company revenue, and that the Managing Director is empowered to manage and reallocate such funds in furtherance of the Company's commercial activities.
      </div>

      <div class="resolution-item">
        <strong class="res-title">5. Validity and Reliance</strong>
        IT IS RESOLVED that a certified copy of this Sole Shareholder Resolution be furnished to Mobile Money Rwanda Ltd (MTN Rwanda), and that Mobile Money Rwanda Ltd shall be fully protected in relying upon this Resolution as conclusive evidence of sole signing authority until formal written notice of modification or revocation is officially served by the Company.
      </div>
    </div>
  </div>

  <div>
    <!-- Execution Section -->
    <div style="font-size: 10px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">
      IN WITNESS WHEREOF, I, HERVÉ FRIEND KUBANA, Founder, Sole Shareholder, and Managing Director, have executed and sealed this Resolution under the corporate authority of KUBANA FRIEND TECHNOLOGIES on this 19th day of November, 2026.
    </div>

    <div class="sign-stamp-row">
      <div class="sign-box">
        <div class="signature-wrap">
          <img src="${sigDataUri}" class="signature-img" alt="Herve Friend Kubana Signature" />
        </div>
        <div style="font-size: 11px; font-weight: 900; color: #0f172a; margin-top: 6px;">HERVÉ FRIEND KUBANA</div>
        <div style="font-size: 9.5px; font-weight: 700; color: #1e3a8a;">Founder, Sole Shareholder &amp; Managing Director</div>
        <div style="font-size: 9px; color: #475569;">KUBANA FRIEND TECHNOLOGIES • Registered in Rwanda</div>
      </div>

      <div class="stamp-container">
        <div style="width: 145px; height: 145px;">
          ${stampSvg}
        </div>
      </div>
    </div>

    <div class="footer-note">
      CERTIFIED SOLE SHAREHOLDER RESOLUTION • KUBANA FRIEND TECHNOLOGIES • KIGALI, RWANDA • VERIFIED DOCUMENT REF: KFT-RES-2026-MOMO
    </div>
  </div>
</div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT 3: Technical API Specification Sheet
// ─────────────────────────────────────────────────────────────────────────────
function buildTechnicalSpecHtml() {
  const stampSvg = getStampSvg("#153a8a", "19 NOV 2026");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Technical Integration Specification - MTN MoMo Open API</title>
  <style>
    ${COMMON_CSS}
    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .company-name {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .company-sub {
      font-size: 10px;
      color: #475569;
      font-weight: 600;
      margin: 2px 0 0;
    }
    .title-banner {
      background: #0f172a;
      color: #ffffff;
      padding: 9px 14px;
      border-radius: 6px;
      margin: 10px 0 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title-banner h2 {
      margin: 0;
      font-size: 12.5px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .spec-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .spec-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 9px 12px;
      background: #f8fafc;
    }
    .spec-card h3 {
      margin: 0 0 6px;
      font-size: 10px;
      font-weight: 900;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .spec-item {
      font-size: 9px;
      line-height: 1.45;
      margin-bottom: 4px;
      color: #1e293b;
    }
    .spec-item strong {
      color: #0f172a;
    }
    .code-box {
      background: #1e293b;
      color: #38bdf8;
      font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
      font-size: 8.5px;
      padding: 7px 10px;
      border-radius: 5px;
      margin: 6px 0;
      word-break: break-all;
    }
    .security-box {
      border: 1px solid #94a3b8;
      border-radius: 6px;
      padding: 8px 12px;
      background: #ffffff;
      margin-bottom: 10px;
    }
    .security-box h3 {
      margin: 0 0 5px;
      font-size: 10px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
    }
    .security-list {
      margin: 0;
      padding-left: 16px;
      font-size: 9px;
      line-height: 1.45;
      color: #334155;
    }
    .security-list li {
      margin-bottom: 2px;
    }
    .sign-stamp-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 6px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
    }
    .sign-box {
      width: 55%;
    }
    .signature-wrap {
      position: relative;
      height: 55px;
      margin-bottom: -10px;
    }
    .signature-img {
      position: absolute;
      top: -10px;
      left: 10px;
      height: 60px;
      z-index: 10;
    }
    .stamp-container {
      width: 140px;
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .footer-note {
      font-size: 8px;
      color: #64748b;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 5px;
      margin-top: 6px;
    }
  </style>
</head>
<body>
<div class="a4-page">
  <div>
    <!-- Letterhead -->
    <div class="letterhead">
      <div>
        <h1 class="company-name">KUBANA FRIEND TECHNOLOGIES</h1>
        <p class="company-sub">Engineering &amp; Cloud Payment Integration Division</p>
      </div>
      <div style="text-align: right; font-size: 9.5px; color: #334155;">
        <strong>Product:</strong> SELLA (Retail POS &amp; Store OS)<br />
        <strong>Tech Lead:</strong> Hervé Friend Kubana<br />
        <strong>MoMo Dev Account:</strong> h.kubana@alustudent.com
      </div>
    </div>

    <div class="header-rule"></div>

    <!-- Banner -->
    <div class="title-banner">
      <h2>MTN MOMO OPEN API — TECHNICAL INTEGRATION SPECIFICATION</h2>
      <span class="badge badge-gold">API v1.0 • COLLECTION PRODUCT</span>
    </div>

    <!-- Spec Grid -->
    <div class="spec-grid">
      <div class="spec-card">
        <h3>1. Integration &amp; Target Product</h3>
        <div class="spec-item"><strong>Requested API:</strong> MTN MoMo Collection API v1.0</div>
        <div class="spec-item"><strong>Transaction Type:</strong> Request-to-Pay (C2B / Push USSD)</div>
        <div class="spec-item"><strong>Target Currency:</strong> Rwandan Francs (RWF)</div>
        <div class="spec-item"><strong>Target Account:</strong> New Corporate SIM (Assigned at desk)</div>
        <div class="spec-item"><strong>Testing Status:</strong> Sandbox Fully Validated &amp; Tested</div>
      </div>

      <div class="spec-card">
        <h3>2. Architecture &amp; Client Platform</h3>
        <div class="spec-item"><strong>Frontend Client:</strong> Vite + React 18 PWA + Capacitor 8</div>
        <div class="spec-item"><strong>Backend Services:</strong> Supabase Cloud (PostgreSQL 15 + Edge)</div>
        <div class="spec-item"><strong>Data Layer:</strong> Multi-tenant isolation with Row-Level Security</div>
        <div class="spec-item"><strong>Offline Engine:</strong> IndexedDB / Dexie with sync queue</div>
        <div class="spec-item"><strong>Hosting / CDN:</strong> Vercel Global Edge Network</div>
      </div>
    </div>

    <!-- Webhook Box -->
    <div class="spec-card" style="margin-bottom: 10px;">
      <h3>3. Webhook Endpoints &amp; Integration URIs</h3>
      <div class="spec-item"><strong>Live Webhook Notification Endpoint (Supabase Edge Function):</strong></div>
      <div class="code-box">https://ixihbqubatyfulnurpco.supabase.co/functions/v1/paypack-webhook</div>
      <div class="spec-item"><strong>Production Client:</strong> Sella Mobile, Desktop &amp; Cloud (Edge API Engine)</div>
      <div class="spec-item"><strong>Registered Developer Account:</strong> <code>momodeveloper.mtn.co.rw</code> (User: <strong>h.kubana@alustudent.com</strong>)</div>
      <div class="spec-item"><strong>Callback Processing:</strong> Asynchronous listener verifying transaction status (<code>SUCCESSFUL</code>, <code>FAILED</code>) and triggering automatic database license provisioning.</div>
    </div>

    <!-- Security Box -->
    <div class="security-box">
      <h3>4. Security Protocols, Idempotency &amp; Data Protection</h3>
      <ul class="security-list">
        <li><strong>End-to-End Encryption:</strong> All API communication takes place exclusively over TLS 1.3 with modern cipher suites.</li>
        <li><strong>Strict Idempotency:</strong> Every transaction initiates a unique UUID v4 passed in the <code>X-Reference-Id</code> header to guarantee zero duplicate charges.</li>
        <li><strong>Zero PIN Storage:</strong> Sella never prompts, captures, transmits, or stores customer PINs. All authorization occurs natively on MTN USSD dialogs.</li>
        <li><strong>Signature &amp; Bearer Tokens:</strong> API requests utilize OAuth 2.0 Bearer tokens with 3600-second TTL and HMAC signature verification.</li>
        <li><strong>IP Whitelisting &amp; RLS:</strong> Webhook ingestion endpoints are guarded against unauthorized replay attacks.</li>
      </ul>
    </div>

    <!-- Commercial Ticket Sizes -->
    <div class="spec-card" style="margin-bottom: 6px;">
      <h3>5. Transaction Profiles &amp; Ticket Volumes</h3>
      <div class="spec-item"><strong>Monthly Pro Subscription:</strong> 15,000 RWF / month per merchant store</div>
      <div class="spec-item"><strong>Annual Pro Subscription:</strong> 150,000 RWF / year per merchant store</div>
      <div class="spec-item"><strong>Enterprise Boss Tier:</strong> 40,000 RWF / month per enterprise client</div>
      <div class="spec-item"><strong>Projected Initial Volume:</strong> 200 - 1,000 transactions / month growing to 2,000+ active merchants</div>
    </div>
  </div>

  <div>
    <!-- Execution Section -->
    <div class="sign-stamp-row">
      <div class="sign-box">
        <div style="font-size: 9.5px; font-weight: 700; color: #334155;">Verified &amp; Submitted by:</div>
        <div class="signature-wrap">
          <img src="${sigDataUri}" class="signature-img" alt="Herve Friend Kubana Signature" />
        </div>
        <div style="font-size: 11px; font-weight: 900; color: #0f172a; margin-top: 6px;">HERVÉ FRIEND KUBANA</div>
        <div style="font-size: 9.5px; font-weight: 700; color: #1e3a8a;">Founder, Sole Shareholder &amp; Principal Software Architect</div>
        <div style="font-size: 9px; color: #475569;">KUBANA FRIEND TECHNOLOGIES</div>
      </div>

      <div class="stamp-container">
        <div style="width: 135px; height: 135px;">
          ${stampSvg}
        </div>
      </div>
    </div>

    <div class="footer-note">
      TECHNICAL SPECIFICATION • KUBANA FRIEND TECHNOLOGIES • MTN RWANDA OPEN API INTEGRATION • REF: KFT-SPEC-2026-MOMO
    </div>
  </div>
</div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT 4: Sella Executive Product & Business Profile
// ─────────────────────────────────────────────────────────────────────────────
function buildProductProfileHtml() {
  const stampSvg = getStampSvg("#153a8a", "19 NOV 2026");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Sella - Executive Product Profile & Commercial Overview</title>
  <style>
    ${COMMON_CSS}
    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .company-name {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .company-sub {
      font-size: 10px;
      color: #475569;
      font-weight: 600;
      margin: 2px 0 0;
    }
    .title-banner {
      background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 6px;
      margin: 10px 0 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title-banner h2 {
      margin: 0;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }
    .feature-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      background: #f8fafc;
    }
    .feature-card h4 {
      margin: 0 0 4px;
      font-size: 9.5px;
      font-weight: 800;
      color: #1e3a8a;
      text-transform: uppercase;
    }
    .feature-card p {
      margin: 0;
      font-size: 8.5px;
      line-height: 1.4;
      color: #334155;
    }
    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 10px;
      font-size: 9px;
    }
    .pricing-table th, .pricing-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      text-align: left;
    }
    .pricing-table th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
    }
    .pricing-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    .why-momo-box {
      border: 1px solid #1e3a8a;
      background: #eff6ff;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 10px;
    }
    .why-momo-box h3 {
      margin: 0 0 4px;
      font-size: 10px;
      font-weight: 900;
      color: #1e3a8a;
      text-transform: uppercase;
    }
    .why-momo-box p {
      margin: 0;
      font-size: 9px;
      line-height: 1.45;
      color: #1e293b;
    }
    .sign-stamp-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 6px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
    }
    .sign-box {
      width: 55%;
    }
    .signature-wrap {
      position: relative;
      height: 55px;
      margin-bottom: -10px;
    }
    .signature-img {
      position: absolute;
      top: -10px;
      left: 10px;
      height: 60px;
      z-index: 10;
    }
    .stamp-container {
      width: 140px;
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .footer-note {
      font-size: 8px;
      color: #64748b;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 5px;
      margin-top: 6px;
    }
  </style>
</head>
<body>
<div class="a4-page">
  <div>
    <!-- Letterhead -->
    <div class="letterhead">
      <div style="display: flex; align-items: center; gap: 10px;">
        <img src="${logoDataUri}" style="width: 42px; height: 42px; border-radius: 8px;" alt="Sella" />
        <div>
          <h1 class="company-name">KUBANA FRIEND TECHNOLOGIES</h1>
          <p class="company-sub">Software Provider of SELLA (Proprietary Retail OS)</p>
        </div>
      </div>
      <div style="text-align: right; font-size: 9px; color: #334155;">
        <strong>HQ:</strong> Kigali, Rwanda<br />
        <strong>Direct Contact:</strong> +250 796 580 545<br />
        <strong>Business Email:</strong> h.kubana@alustudent.com
      </div>
    </div>

    <div class="header-rule"></div>

    <!-- Banner -->
    <div class="title-banner">
      <h2>PRODUCT PROFILE: SELLA RETAIL OS &amp; CREDIT RECOVERY</h2>
      <span class="badge badge-gold">COMMERCIAL OVERVIEW</span>
    </div>

    <!-- Product Overview -->
    <div style="font-size: 9.5px; line-height: 1.5; color: #1e293b; margin-bottom: 10px;">
      <strong>Sella</strong> is an intelligent retail operating system and Point of Sale (POS) application engineered specifically to digitize Rwandan micro, small, and medium businesses (MSMEs). Developed by KUBANA FRIEND TECHNOLOGIES, Sella enables shopkeepers to track inventory, eliminate cash leaks, record sales via barcode scanning, and recover customer store credit (amadeni) through automated SMS payment reminders.
    </div>

    <!-- Feature Grid -->
    <div class="feature-grid">
      <div class="feature-card">
        <h4>High-Speed POS &amp; Receipts</h4>
        <p>Instant sale recording, barcode/QR camera scanning, digital WhatsApp/SMS receipts, and offline transaction queuing.</p>
      </div>
      <div class="feature-card">
        <h4>Smart Stock Tracking</h4>
        <p>Real-time inventory levels, low-stock alerts, shrinkage reduction, and automated cost-of-goods calculation.</p>
      </div>
      <div class="feature-card">
        <h4>Credit Recovery Engine</h4>
        <p>Complete ledger of customer store credit with automated SMS payment reminders to recover overdue money.</p>
      </div>
    </div>

    <!-- Commercial Pricing Table -->
    <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; margin-bottom: 4px; text-transform: uppercase;">
      Commercial Pricing Tiers &amp; MoMo Collection Model
    </div>
    <table class="pricing-table">
      <thead>
        <tr>
          <th>Plan Tier</th>
          <th>Monthly Fee (RWF)</th>
          <th>Annual Fee (RWF)</th>
          <th>Target Customer &amp; Features</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Free Starter</strong></td>
          <td>0 RWF</td>
          <td>0 RWF</td>
          <td>Single-counter entry merchants, basic inventory tracking up to 50 items.</td>
        </tr>
        <tr>
          <td><strong>Pro Plan (Standard)</strong></td>
          <td><strong>15,000 RWF / mo</strong></td>
          <td>150,000 RWF / yr</td>
          <td>Full inventory tracking, SMS credit recovery, daily sales analytics, multi-device sync.</td>
        </tr>
        <tr>
          <td><strong>Enterprise Boss Tier</strong></td>
          <td><strong>40,000 RWF / mo</strong></td>
          <td>400,000 RWF / yr</td>
          <td>Multi-branch stores, VIP priority support, staff permission controls, full tax audit logging.</td>
        </tr>
      </tbody>
    </table>

    <!-- Why MoMo -->
    <div class="why-momo-box">
      <h3>Why MTN Mobile Money Collection is Critical to Sella's Operations</h3>
      <p>
        In Rwanda, cash and Mobile Money are the dominant payment rails for retail commerce. Integrating the MTN MoMo Open API directly into Sella allows retail subscribers to pay their monthly software subscriptions with 1 click via USSD prompt. Recurring revenue settles immediately into the corporate MoMo wallet of KUBANA FRIEND TECHNOLOGIES, guaranteeing financial transparency and auditability.
      </p>
    </div>
  </div>

  <div>
    <!-- Execution Section -->
    <div class="sign-stamp-row">
      <div class="sign-box">
        <div style="font-size: 9.5px; font-weight: 700; color: #334155;">Authorized Corporate Representative:</div>
        <div class="signature-wrap">
          <img src="${sigDataUri}" class="signature-img" alt="Herve Friend Kubana Signature" />
        </div>
        <div style="font-size: 11px; font-weight: 900; color: #0f172a; margin-top: 6px;">HERVÉ FRIEND KUBANA</div>
        <div style="font-size: 9.5px; font-weight: 700; color: #1e3a8a;">Founder, Sole Shareholder &amp; Managing Director</div>
        <div style="font-size: 9px; color: #475569;">KUBANA FRIEND TECHNOLOGIES</div>
      </div>

      <div class="stamp-container">
        <div style="width: 135px; height: 135px;">
          ${stampSvg}
        </div>
      </div>
    </div>

    <div class="footer-note">
      PRODUCT PROFILE • KUBANA FRIEND TECHNOLOGIES • SELLA PLATFORM • momodeveloper.mtn.co.rw • KIGALI, RWANDA
    </div>
  </div>
</div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTE GENERATION
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Generating Official MTN Documents...");

  const docs = [
    {
      id: "mtn-momo-application-letter",
      title: "Doc 1: Corporate Application & Authorization Letter",
      htmlFn: buildApplicationLetterHtml,
    },
    {
      id: "corporate-resolution-mtn-momo",
      title: "Doc 2: Sole Shareholder & Managing Director Corporate Resolution",
      htmlFn: buildCorporateResolutionHtml,
    },
    {
      id: "sella-momo-technical-spec",
      title: "Doc 3: Technical API Specification & KYC Architecture",
      htmlFn: buildTechnicalSpecHtml,
    },
    {
      id: "sella-product-profile",
      title: "Doc 4: Sella Executive Product & Commercial Profile",
      htmlFn: buildProductProfileHtml,
    },
  ];

  for (const doc of docs) {
    const html = doc.htmlFn();
    const tempHtmlPath = `/tmp/${doc.id}.html`;
    fs.writeFileSync(tempHtmlPath, html);

    const pdfTargetWorkspace = path.join(DOCS_DIR, `${doc.id}.pdf`);
    const pdfTargetArtifact = path.join(ARTIFACT_DIR, `${doc.id}.pdf`);
    const pngTargetArtifact = path.join(ARTIFACT_DIR, `${doc.id}-preview.png`);

    console.log(`Rendering PDF: ${doc.title}...`);

    // Print to single A4 PDF
    await runChrome([
      "--headless",
      "--disable-gpu",
      "--no-pdf-header-footer",
      `--print-to-pdf=${pdfTargetWorkspace}`,
      `file://${tempHtmlPath}`,
    ]);

    // Copy to artifact directory
    fs.copyFileSync(pdfTargetWorkspace, pdfTargetArtifact);

    // Generate crisp PNG preview
    await runChrome([
      "--headless",
      "--disable-gpu",
      "--window-size=920,1300",
      "--default-background-color=ffffffff",
      `--screenshot=${pngTargetArtifact}`,
      `file://${tempHtmlPath}`,
    ]);

    const stats = fs.statSync(pdfTargetWorkspace);
    console.log(`  ✓ Created: ${pdfTargetWorkspace} (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  console.log("\nAll 4 official MTN Mobile Money registration PDFs generated successfully!");
}

main().catch((err) => {
  console.error("Error generating documents:", err);
  process.exit(1);
});
