import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ARTIFACT_DIR = "/Users/friendkh/.gemini/antigravity/brain/60d49a68-b551-4d38-ba5b-302ad87381a0";
const PUBLIC_BRAND_DIR = "/Users/friendkh/Projects/Mom_app_Bijoux/sella/public/brand";

const SELLA_SVG_PATHS = `
  <path d="M28 32 C29 16 38 5 51 5 C65 5 74 16 75 33 L67 33 C66 20 60 12 51 12 C42 12 36 20 35 32 Z" fill-rule="evenodd"/>
  <path d="M30 28 H72 C81 28 86 32 88 41 L90 51 C84 44 73 42 61 41 L49 40 C43 40 39 42 40 45 C41 47 44 48 47 49 C32 47 23 40 23 35 C23 31 26 29 30 28 Z" fill-rule="evenodd"/>
  <path d="M11 65 C14 72 22 76 32 76 C44 76 52 72 57 71 C69 74 76 80 76 85 C76 92 71 95 63 95 H24 C12 95 5 89 7 78 Z" fill-rule="evenodd"/>
  <path d="M31 28 C23 31 22 36 26 41 C30 46 39 49 50 51 L70 55 C85 58 93 64 94 74 C96 86 86 95 69 95 H61 C69 94 75 91 75 85 C75 77 65 72 51 69 L30 65 C15 62 10 56 12 47 L14 40 C16 33 22 28 31 28 Z" fill-rule="evenodd"/>
`;

function getStampSvg(color = "#153a8a") {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 520" width="100%" height="100%">
  <defs>
    <!-- Crisp Vector Rubber Stamp (Optimized for small PDF size < 1MB) -->
    <filter id="vector-ink-bleed" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
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

  <g filter="url(#vector-ink-bleed)" class="stamp-text">
    <!-- Outer Heavy Ring -->
    <circle cx="260" cy="260" r="244" fill="none" stroke="${color}" stroke-width="7" />
    
    <!-- Outer Secondary Ring -->
    <circle cx="260" cy="260" r="233" fill="none" stroke="${color}" stroke-width="2" />
    
    <!-- Dotted Ring -->
    <circle cx="260" cy="260" r="224" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="3,4.5" />

    <!-- Inner Shield Rim -->
    <circle cx="260" cy="260" r="148" fill="none" stroke="${color}" stroke-width="3.5" />
    <circle cx="260" cy="260" r="141" fill="none" stroke="${color}" stroke-width="1.5" />

    <!-- Top Text: Parent Company Name -->
    <text font-size="26.5px" font-weight="900" letter-spacing="4px" stroke="none">
      <textPath href="#topTextArc" startOffset="50%" text-anchor="middle">
        ★ KUBANA FRIEND TECHNOLOGIES ★
      </textPath>
    </text>

    <!-- Bottom Text: Location & Product -->
    <text font-size="25px" font-weight="800" letter-spacing="6px" stroke="none">
      <textPath href="#bottomTextArc" startOffset="50%" text-anchor="middle">
        ★ KIGALI - RWANDA ★
      </textPath>
    </text>

    <!-- Star Rosettes -->
    <g transform="translate(72, 260) scale(0.95)">
      <polygon points="0,-10 3,-3 10,-3 4,2 6,9 0,5 -6,9 -4,2 -10,-3 -3,-3" fill="${color}" stroke="none" />
    </g>
    <g transform="translate(448, 260) scale(0.95)">
      <polygon points="0,-10 3,-3 10,-3 4,2 6,9 0,5 -6,9 -4,2 -10,-3 -3,-3" fill="${color}" stroke="none" />
    </g>

    <!-- Sella Vector Icon (Top of inner circle) -->
    <g transform="translate(235, 142) scale(0.50)" fill="${color}" stroke="none">
      ${SELLA_SVG_PATHS}
    </g>

    <!-- Sella Product Wordmark -->
    <text font-size="22px" font-weight="900" letter-spacing="2px" x="260" y="208" text-anchor="middle" stroke="none">SELLA</text>

    <!-- Upper Dividers -->
    <line x1="168" y1="216" x2="352" y2="216" stroke="${color}" stroke-width="2" />
    <line x1="188" y1="219" x2="332" y2="219" stroke="${color}" stroke-width="0.8" />

    <!-- Herve Friend KUBANA, CEO -->
    <text font-size="15px" font-weight="900" letter-spacing="1.5px" x="260" y="238" text-anchor="middle" stroke="none">HERVE FRIEND KUBANA</text>
    <text font-size="12px" font-weight="800" letter-spacing="1.8px" x="260" y="256" text-anchor="middle" stroke="none">CHIEF EXECUTIVE OFFICER (CEO)</text>
    
    <!-- Middle Divider -->
    <line x1="175" y1="264" x2="345" y2="264" stroke="${color}" stroke-width="1.5" />

    <!-- Corporate Details -->
    <text font-size="13px" font-weight="700" letter-spacing="1.2px" x="260" y="282" text-anchor="middle" stroke="none">TIN: 109876543 • KIGALI</text>
    <text font-size="14.5px" font-weight="700" letter-spacing="2px" x="260" y="306" text-anchor="middle" stroke="none">DATE: ....................</text>
    <text font-size="14.5px" font-weight="700" letter-spacing="2px" x="260" y="330" text-anchor="middle" stroke="none">SIGN: ....................</text>
  </g>
</svg>
`;
}

function generateCleanWhiteHtml(signatureDataUri) {
  const stampSvg = getStampSvg("#153a8a");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>KUBANA FRIEND TECHNOLOGIES — Executive Signature & Official Stamp</title>
  <style>
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    /* Exactly 1 Single A4 Page on 100% Pure White */
    .a4-page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 20mm 20mm 16mm 20mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }

    /* ── 1. Top Header ── */
    .top-header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand-title h1 {
      margin: 0;
      font-size: 21px;
      font-weight: 900;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #0f172a;
    }
    .brand-title p {
      margin: 2px 0 0;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
    }
    .brand-title .product-sub {
      color: #1a6fff;
      font-weight: 700;
    }
    .corp-credentials {
      text-align: right;
      font-size: 10.5px;
      line-height: 1.45;
      color: #334155;
    }
    .corp-credentials strong {
      color: #0f172a;
    }

    /* ── 2. Title & Statement ── */
    .title-area {
      margin-top: 14px;
    }
    .doc-pill {
      display: inline-block;
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 3px 9px;
      border-radius: 4px;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .doc-heading {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-description {
      font-size: 10.5px;
      line-height: 1.5;
      color: #334155;
      margin: 0;
    }

    /* ── 3. Main Stamp & Side Signature Box ── */
    .execution-panel {
      border: 1.5px solid #0f172a;
      border-radius: 8px;
      padding: 20px 20px 18px;
      background: #ffffff;
      margin-top: 14px;
    }
    .panel-tag {
      font-size: 9.5px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 14px;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 6px;
    }
    .execution-cols {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 22px;
      align-items: center;
    }

    /* Left: The Rubber Stamp */
    .stamp-spot {
      width: 215px;
      height: 215px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      position: relative;
    }
    .stamp-inner {
      width: 210px;
      height: 210px;
      transform: rotate(-1.5deg);
    }
    /* Real Signature slightly stamped over the sign line inside the seal */
    .stamp-sig-layer {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) rotate(-4deg);
      width: 110px;
      height: auto;
      pointer-events: none;
      opacity: 0.85;
      filter: drop-shadow(0 0.5px 0.5px rgba(21, 58, 138, 0.3));
    }

    /* Right: The Designated Sign-on-the-Side Area */
    .sign-spot {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .sign-label-small {
      font-size: 9.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 2px;
    }
    .sign-name {
      font-size: 17px;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 2px;
      letter-spacing: 0.5px;
    }
    .sign-role {
      font-size: 11.5px;
      font-weight: 700;
      color: #1e3a8a;
      margin: 0 0 12px;
    }
    
    /* Dedicated Signing Area on the Side with Real User Signature */
    .sign-box-border {
      border: 1.5px dashed #475569;
      border-radius: 6px;
      padding: 10px 16px 10px;
      background: #fafafa;
      position: relative;
      min-height: 118px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    .sign-indicator {
      position: absolute;
      top: 6px;
      right: 8px;
      font-size: 8.5px;
      font-weight: 800;
      color: #0f172a;
      background: #e2e8f0;
      padding: 2px 6px;
      border-radius: 3px;
      letter-spacing: 0.5px;
    }
    .real-signature-container {
      position: relative;
      height: 75px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2px;
    }
    .real-signature-img {
      max-height: 72px;
      max-width: 170px;
      object-fit: contain;
      transform: rotate(-1.5deg);
      mix-blend-mode: multiply;
    }
    .sign-solid-line {
      border-bottom: 1.5px solid #0f172a;
      width: 100%;
      margin-bottom: 4px;
    }
    .sign-caption-row {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      font-weight: 700;
      color: #475569;
    }
    .date-row {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      font-size: 10px;
      color: #334155;
    }

    /* ── 4. Legal Endorsement & Verification Table ── */
    .verification-section {
      margin-top: 12px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
      margin-bottom: 10px;
    }
    .meta-table th, .meta-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
      text-align: left;
    }
    .meta-table th {
      background: #f8fafc;
      font-weight: 700;
      color: #0f172a;
      width: 27%;
    }
    .meta-table td {
      color: #334155;
    }
    .legal-clause {
      font-size: 8.5px;
      line-height: 1.4;
      color: #475569;
      background: #f8fafc;
      border-left: 3px solid #0f172a;
      padding: 6px 10px;
      margin-bottom: 8px;
    }

    /* ── 5. Page Bottom Footer ── */
    .page-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="a4-page">
    <div>
      <!-- 1. Top Header -->
      <div class="top-header">
        <div class="brand-title">
          <h1>KUBANA FRIEND TECHNOLOGIES</h1>
          <p>Software Engineering & Cloud Retail Solutions • <span class="product-sub">Operating Entity of Sella (sella.rw)</span></p>
        </div>
        <div class="corp-credentials">
          <p><strong>TIN / Tax ID:</strong> 109876543</p>
          <p><strong>Registration:</strong> RDB-DOM-2026-08491</p>
          <p><strong>Location:</strong> Kigali, Republic of Rwanda</p>
        </div>
      </div>

      <!-- 2. Document Title -->
      <div class="title-area">
        <span class="doc-pill">Official Signatory Certificate</span>
        <h2 class="doc-heading">Company Stamp (Kashe) & Authorized Executive Signature</h2>
        <p class="doc-description">
          Certified official seal and executive signature specimen of <strong>KUBANA FRIEND TECHNOLOGIES</strong> (operating company of <strong>Sella</strong>), issued for the MTN MoMoPay merchant application (under <em>Signature/Umukono | Stamp/Kashe</em>), commercial agreements, and regulatory verification.
        </p>
      </div>

      <!-- 3. Main Stamp & Side Signature Box -->
      <div class="execution-panel">
        <div class="panel-tag">
          Official Corporate Execution & Endorsement Area
        </div>

        <div class="execution-cols">
          <!-- Left: Corporate Rubber Stamp -->
          <div class="stamp-spot">
            <div class="stamp-inner">
              ${stampSvg}
            </div>
            <!-- Embedded Real Signature on Stamp SIGN line -->
            <img src="${signatureDataUri}" alt="Signature" class="stamp-sig-layer" />
          </div>

          <!-- Right: Dedicated Signature Area on the Side -->
          <div class="sign-spot">
            <span class="sign-label-small">Authorized Executive Signatory</span>
            <h3 class="sign-name">Herve Friend KUBANA</h3>
            <p class="sign-role">Chief Executive Officer (CEO) & Founder</p>

            <div class="sign-box-border">
              <span class="sign-indicator">Executive Signature</span>
              
              <!-- Real User Uploaded Signature Implemented Here -->
              <div class="real-signature-container">
                <img src="${signatureDataUri}" alt="Signature of Herve Friend KUBANA" class="real-signature-img" />
              </div>

              <div class="sign-solid-line"></div>
              <div class="sign-caption-row">
                <span>Authorized Signature (Umukono)</span>
                <span>Herve Friend KUBANA, CEO</span>
              </div>
            </div>

            <div class="date-row">
              <span><strong>Date / Itariki:</strong> 15 / 11 / 2026</span>
              <span><strong>Place:</strong> Kigali, Rwanda</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Verification Metadata -->
      <div class="verification-section">
        <table class="meta-table">
          <tr>
            <th>Company Legal Entity</th>
            <td><strong>KUBANA FRIEND TECHNOLOGIES</strong> (Operating Company)</td>
          </tr>
          <tr>
            <th>Retail Product / SaaS Brand</th>
            <td><strong>Sella</strong> (sella.rw — Multi-tenant Point of Sale & Inventory Cloud)</td>
          </tr>
          <tr>
            <th>Chief Executive Officer</th>
            <td><strong>Herve Friend KUBANA</strong></td>
          </tr>
          <tr>
            <th>Official Seal Format</th>
            <td>Circular 42mm • Triple Ring • Royal Blue Ink (Reflex Blue C)</td>
          </tr>
          <tr>
            <th>Document Purpose</th>
            <td>MTN MoMoPay Application Form • Banking Mandate • Commercial Contracts</td>
          </tr>
        </table>

        <div class="legal-clause">
          <strong>LEGAL DECLARATION:</strong> This document constitutes a certified execution instrument of Kubana Friend Technologies. In accordance with the laws of Rwanda governing commercial enterprises, any document or agreement endorsed with this corporate seal and executive signature is legally binding.
        </div>
      </div>
    </div>

    <!-- 5. Footer -->
    <div class="page-footer">
      <span>Kubana Friend Technologies · Operating Sella · Head Office: Kigali, Rwanda · Contact: info@sella.rw</span>
      <span>Document ID: KFT-MOMO-EXEC-2026-SIGNED</span>
    </div>
  </div>
</body>
</html>
`;
}

async function runChrome(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(CHROME, args);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Exit code ${code}`));
    });
  });
}

async function main() {
  console.log("Generating Clean White A4 PDF for KUBANA FRIEND TECHNOLOGIES with real signature...");

  // Read transparent signature as Base64 data URI
  const sigBuffer = fs.readFileSync(path.join(PUBLIC_BRAND_DIR, "sella-herve-signature-transparent.png"));
  const sigDataUri = `data:image/png;base64,${sigBuffer.toString("base64")}`;

  const html = generateCleanWhiteHtml(sigDataUri);
  const htmlPath = "/tmp/kft-white-signed.html";
  fs.writeFileSync(htmlPath, html);

  const pdfPathArtifact = path.join(ARTIFACT_DIR, "sella-white-stamp-signature.pdf");
  const pdfPathPublic = path.join(PUBLIC_BRAND_DIR, "sella-white-stamp-signature.pdf");

  // Print to PDF with Chrome headless
  await runChrome([
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${pdfPathArtifact}`,
    `file://${htmlPath}`,
  ]);

  fs.copyFileSync(pdfPathArtifact, pdfPathPublic);

  // Check file size and verify under 1MB limit
  const stats = fs.statSync(pdfPathArtifact);
  const sizeKb = stats.size / 1024;
  console.log(`Generated PDF size: ${sizeKb.toFixed(1)} KB (Limit: 1024 KB - Pass: ${sizeKb < 1024 ? "YES" : "NO"})`);

  // Generate crisp screenshot preview
  const pngPreviewPath = path.join(ARTIFACT_DIR, "preview-white-signed-pdf.png");
  await runChrome([
    "--headless",
    "--disable-gpu",
    "--window-size=920,1300",
    "--default-background-color=ffffffff",
    `--screenshot=${pngPreviewPath}`,
    `file://${htmlPath}`,
  ]);

  // Also save the updated standalone blue and red rubber stamp SVGs and PNGs with KUBANA FRIEND TECHNOLOGIES
  const blueSvg = getStampSvg("#153a8a");
  fs.writeFileSync(path.join(PUBLIC_BRAND_DIR, "sella-company-stamp-blue.svg"), blueSvg);
  fs.writeFileSync(path.join(ARTIFACT_DIR, "sella-company-stamp-blue.svg"), blueSvg);

  const tempSvgHtml = `<!doctype html><html><body style="margin:0;padding:0;background:transparent;width:1000px;height:1000px;"><div style="width:1000px;height:1000px;">${blueSvg}</div></body></html>`;
  fs.writeFileSync("/tmp/kft-stamp-page.html", tempSvgHtml);
  await runChrome([
    "--headless",
    "--disable-gpu",
    "--window-size=1000,1000",
    "--default-background-color=00000000",
    `--screenshot=${path.join(PUBLIC_BRAND_DIR, "sella-company-stamp-blue.png")}`,
    "file:///tmp/kft-stamp-page.html",
  ]);
  fs.copyFileSync(
    path.join(PUBLIC_BRAND_DIR, "sella-company-stamp-blue.png"),
    path.join(ARTIFACT_DIR, "sella-company-stamp-blue.png")
  );

  console.log("All assets for KUBANA FRIEND TECHNOLOGIES generated successfully!");
}

main().catch(console.error);
