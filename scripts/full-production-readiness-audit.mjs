import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const EVIDENCE_DIR = path.resolve(process.cwd(), "tests/qa-evidence");
const BASE_URL = "http://localhost:8080";

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

// 8 Mandatory Device Viewports
const VIEWPORTS = [
  { name: "small_mobile", width: 320, height: 720, label: "320x720 (Small Mobile)" },
  { name: "standard_mobile", width: 390, height: 844, label: "390x844 (Standard Mobile)" },
  { name: "large_mobile", width: 430, height: 932, label: "430x932 (Large Mobile)" },
  { name: "tablet_portrait", width: 768, height: 1024, label: "768x1024 (Tablet Portrait)" },
  { name: "tablet_landscape", width: 1024, height: 768, label: "1024x768 (Tablet Landscape)" },
  { name: "compact_laptop", width: 1280, height: 800, label: "1280x800 (Compact Laptop)" },
  { name: "desktop", width: 1440, height: 900, label: "1440x900 (Desktop)" },
  { name: "large_desktop", width: 1920, height: 1080, label: "1920x1080 (Large Desktop)" },
];

const diagnostics = {
  timestamp: new Date().toISOString(),
  pagesAudited: [],
  consoleErrors: [],
  consoleWarnings: [],
  networkFailures: [],
  overflows: [],
  performanceMetrics: [],
  accessibilityWarnings: [],
  screenshots: [],
};

async function audit() {
  console.log("==================================================================");
  console.log("SELLA COMPLETE AUTONOMOUS PRODUCTION AUDIT & VISUAL QA");
  console.log("Chrome:", CHROME_PATH);
  console.log("Target Base URL:", BASE_URL);
  console.log("==================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1920,1080",
    ],
  });

  const page = await browser.newPage();

  // Wire Console and Network Listeners
  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === "error") {
      diagnostics.consoleErrors.push({ url: page.url(), text });
      console.error(`[BROWSER ERROR] ${text}`);
    } else if (type === "warning") {
      diagnostics.consoleWarnings.push({ url: page.url(), text });
    }
  });

  page.on("requestfailed", (req) => {
    diagnostics.networkFailures.push({
      url: req.url(),
      method: req.method(),
      error: req.failure()?.errorText || "failed",
    });
    console.warn(`[NETWORK FAIL] ${req.method()} ${req.url()}: ${req.failure()?.errorText}`);
  });

  async function snap(name, vp, opts = {}) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await new Promise((r) => setTimeout(r, opts.delay || 400));

    // Check for Horizontal Overflow
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > window.innerWidth;
    });

    if (overflow) {
      const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
      diagnostics.overflows.push({
        screen: name,
        viewport: `${vp.width}x${vp.height}`,
        scrollWidth: scrollW,
        viewportWidth: vp.width,
      });
      console.warn(`[LAYOUT OVERFLOW] ${name} @ ${vp.width}x${vp.height}: scrollWidth ${scrollW} > ${vp.width}`);
    }

    const filename = `${name}_${vp.width}x${vp.height}.png`;
    const filepath = path.join(EVIDENCE_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: false });
    diagnostics.screenshots.push({
      name,
      viewport: `${vp.width}x${vp.height}`,
      file: filename,
    });
    console.log(`  ✓ Captured: ${filename}`);
  }

  async function captureAllViewports(name, opts = {}) {
    for (const vp of VIEWPORTS) {
      await snap(name, vp, opts);
    }
  }

  try {
    // -------------------------------------------------------------
    // PHASE 1: PUBLIC & MARKETING SCREENS
    // -------------------------------------------------------------
    console.log("\n[PHASE 1] Auditing Marketing & Landing Pages...");

    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });
    await snap("landing_page", VIEWPORTS[1]); // 390x844
    await snap("landing_page", VIEWPORTS[6]); // 1440x900
    await snap("landing_page", VIEWPORTS[7]); // 1920x1080

    for (const route of ["/pricing", "/features", "/faq", "/terms", "/privacy", "/docs"]) {
      const cleanName = route.replace("/", "");
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle2" });
      await snap(`marketing_${cleanName}`, VIEWPORTS[1]); // 390x844
      await snap(`marketing_${cleanName}`, VIEWPORTS[6]); // 1440x900
      diagnostics.pagesAudited.push(route);
    }

    // -------------------------------------------------------------
    // PHASE 2: AUTHENTICATION FLOWS & ALL 8 VIEWPORTS
    // -------------------------------------------------------------
    console.log("\n[PHASE 2] Auditing Authentication Across All 8 Viewports...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 600));

    console.log("  -> Capturing Entry / Welcome Screen (8 viewports)...");
    await captureAllViewports("auth_welcome");

    // Click "Injira nk'Umukozi"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find((b) => b.textContent?.includes("Umukozi") || b.textContent?.includes("Cashier"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    console.log("  -> Capturing Cashier Shop Code Form (8 viewports)...");
    await captureAllViewports("cashier_join_form");

    // Enter SEL-MXA8TT (Demo Jewel Kigali)
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll("input"));
      if (inputs[0]) inputs[0].value = "SEL-MXA8TT";
      if (inputs[0]) inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
      if (inputs[1]) inputs[1].value = "0788111222";
      if (inputs[1]) inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
      if (inputs[2]) inputs[2].value = "Mugisha Jean";
      if (inputs[2]) inputs[2].dispatchEvent(new Event("input", { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 400));

    // Submit Shop Code
    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1800));

    console.log("  -> Capturing Shop Verified + PIN Creation Screen (8 viewports)...");
    await captureAllViewports("cashier_set_pin");

    // Dial 1 2 3 4 on PinDialPad
    for (const d of ["1", "2", "3", "4"]) {
      await page.evaluate((digit) => {
        const btns = Array.from(document.querySelectorAll("button"));
        const btn = btns.find((b) => b.textContent?.trim() === digit);
        if (btn) btn.click();
      }, d);
      await new Promise((r) => setTimeout(r, 150));
    }
    await new Promise((r) => setTimeout(r, 800));

    console.log("  -> Capturing Confirm PIN Screen...");
    await snap("cashier_confirm_pin", VIEWPORTS[1]); // 390x844
    await snap("cashier_confirm_pin", VIEWPORTS[6]); // 1440x900

    // Confirm 1 2 3 4
    for (const d of ["1", "2", "3", "4"]) {
      await page.evaluate((digit) => {
        const btns = Array.from(document.querySelectorAll("button"));
        const btn = btns.find((b) => b.textContent?.trim() === digit);
        if (btn) btn.click();
      }, d);
      await new Promise((r) => setTimeout(r, 150));
    }
    await new Promise((r) => setTimeout(r, 2500));

    // -------------------------------------------------------------
    // PHASE 3: SEED DEMO STORE DATA FOR OWNER & CASHIER POS AUDIT
    // -------------------------------------------------------------
    console.log("\n[PHASE 3] Seeding Realistic Retail POS Data in IndexedDB...");
    await page.evaluate(async () => {
      const { db } = await import("/src/db/localDb.ts");
      localStorage.setItem("sella_app_unlocked", "1");

      const ownerId = "owner-demo-mxa8tt";

      // 1. Profile
      await db.profiles.put(
        {
          id: ownerId,
          business_name: "Demo Jewel Kigali",
          display_name: "Demo Owner A",
          shop_code: "SEL-MXA8TT",
          phone: "+250780000001",
          currency: "RWF",
          owner_pin_hash: "1234",
          created_at: new Date().toISOString(),
        },
        "local_user"
      );

      // 2. Products / Inventory Items
      const sampleItems = [
        {
          id: "prod-1",
          name: "Amayugi ya Zahabu 18K (Gold Earrings)",
          item_name: "Amayugi ya Zahabu 18K (Gold Earrings)",
          sku: "JEW-GLD-001",
          barcode: "600123456789",
          category: "Amayugi (Earrings)",
          cost_price: 65000,
          selling_price: 95000,
          price: 95000,
          quantity: 14,
          stock: 14,
          min_stock_alert: 3,
          created_at: new Date().toISOString(),
        },
        {
          id: "prod-2",
          name: "Impeta ya Diyama (Diamond Engagement Ring)",
          item_name: "Impeta ya Diyama (Diamond Engagement Ring)",
          sku: "JEW-RNG-002",
          barcode: "600123456790",
          category: "Impeta (Rings)",
          cost_price: 250000,
          selling_price: 380000,
          price: 380000,
          quantity: 5,
          stock: 5,
          min_stock_alert: 2,
          created_at: new Date().toISOString(),
        },
        {
          id: "prod-3",
          name: "Urunyuzuzi rwa Feza (Sterling Silver Bracelet)",
          item_name: "Urunyuzuzi rwa Feza (Sterling Silver Bracelet)",
          sku: "JEW-SLV-003",
          barcode: "600123456791",
          category: "Iminyururu (Chains)",
          cost_price: 28000,
          selling_price: 45000,
          price: 45000,
          quantity: 2, // Low stock warning!
          stock: 2,
          min_stock_alert: 4,
          created_at: new Date().toISOString(),
        },
        {
          id: "prod-4",
          name: "Isaha ya Rolex Oyster Replica (Watch)",
          item_name: "Isaha ya Rolex Oyster Replica (Watch)",
          sku: "JEW-WTC-004",
          barcode: "600123456792",
          category: "Amasaha (Watches)",
          cost_price: 75000,
          selling_price: 120000,
          price: 120000,
          quantity: 8,
          stock: 8,
          min_stock_alert: 2,
          created_at: new Date().toISOString(),
        },
      ];
      await db.inventory_items.clear();
      await db.inventory_items.bulkPut(sampleItems);

      // 3. Clients
      const sampleClients = [
        {
          id: "client-1",
          name: "Mutesi Divine",
          phone: "0788444555",
          phone_normalized: "+250788444555",
          total_debt: 75000,
          total_spent: 420000,
          created_at: new Date().toISOString(),
        },
        {
          id: "client-2",
          name: "Kagabo Patrick",
          phone: "0788777888",
          phone_normalized: "+250788777888",
          total_debt: 0,
          total_spent: 190000,
          created_at: new Date().toISOString(),
        },
      ];
      await db.clients.clear();
      await db.clients.bulkPut(sampleClients);

      // 4. Debts
      await db.debts.clear();
      await db.debts.bulkPut([
        {
          id: "debt-1",
          customer_id: "client-1",
          client_name: "Mutesi Divine",
          client_phone: "0788444555",
          total_amount: 140000,
          remaining_amount: 75000,
          paid_amount: 65000,
          status: "partial",
          due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
      ]);

      // 5. Staff
      await db.staff.clear();
      await db.staff.bulkPut([
        {
          id: "staff-1",
          shop_id: ownerId,
          owner_id: ownerId,
          name: "Mugisha Jean",
          phone: "0788111222",
          phone_normalized: "+250788111222",
          shop_code: "SEL-MXA8TT",
          role: "cashier",
          status: "active",
          total_sales_volume: 485000,
          total_sales_count: 24,
          last_active_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ]);
    });

    // -------------------------------------------------------------
    // PHASE 4: POINT OF SALE (POS) FULL WORKFLOW & ALL 8 VIEWPORTS
    // -------------------------------------------------------------
    console.log("\n[PHASE 4] Auditing Point of Sale (POS) Across All 8 Viewports...");
    await page.goto(`${BASE_URL}/new-sale`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1200));

    console.log("  -> Capturing POS Register (8 viewports)...");
    await captureAllViewports("pos_register");

    // Add items to cart
    console.log("  -> Interacting with POS Cart...");
    await page.evaluate(() => {
      // Find add to cart buttons
      const cards = Array.from(document.querySelectorAll("button, div[role='button']"));
      const addBtn = cards.find((c) => c.textContent?.includes("Amayugi") || c.textContent?.includes("Gold"));
      if (addBtn) addBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    await snap("pos_cart_item_added", VIEWPORTS[1]); // 390x844
    await snap("pos_cart_item_added", VIEWPORTS[6]); // 1440x900

    // Click checkout / payment button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const checkoutBtn = btns.find(
        (b) =>
          b.textContent?.includes("Kwishyura") ||
          b.textContent?.includes("Checkout") ||
          b.textContent?.includes("Emeza") ||
          b.textContent?.includes("Pay")
      );
      if (checkoutBtn) checkoutBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    await snap("pos_checkout_payment_modal", VIEWPORTS[1]); // 390x844
    await snap("pos_checkout_payment_modal", VIEWPORTS[6]); // 1440x900

    // Close payment modal
    await page.keyboard.press("Escape");
    await new Promise((r) => setTimeout(r, 400));

    // -------------------------------------------------------------
    // PHASE 5: AUDITING ALL APPLICATION ROUTES
    // -------------------------------------------------------------
    console.log("\n[PHASE 5] Auditing Core Application Screens...");

    const appRoutes = [
      { path: "/dashboard", name: "dashboard" },
      { path: "/sales", name: "sales_history" },
      { path: "/debts", name: "debts_ledger" },
      { path: "/inventory", name: "inventory_table" },
      { path: "/clients", name: "clients_directory" },
      { path: "/staff", name: "staff_management" },
      { path: "/account", name: "account_settings" },
      { path: "/notifications", name: "notifications_feed" },
      { path: "/receipt-settings", name: "receipt_settings" },
      { path: "/subscribe", name: "subscription_billing" },
      { path: "/billing", name: "billing_invoices" },
      { path: "/assistant", name: "ai_assistant" },
      { path: "/inbox", name: "customer_inbox" },
      { path: "/sync-conflicts", name: "sync_conflicts" },
      { path: "/import-inventory", name: "import_inventory" },
      { path: "/import-customers", name: "import_customers" },
    ];

    for (const r of appRoutes) {
      console.log(`  -> Visiting ${r.path} (${r.name})...`);
      const t0 = Date.now();
      await page.goto(`${BASE_URL}${r.path}`, { waitUntil: "networkidle2" });
      const duration = Date.now() - t0;
      diagnostics.performanceMetrics.push({ route: r.path, loadDurationMs: duration });

      // Measure performance & accessibility
      const perf = await page.evaluate(() => {
        const timing = performance.getEntriesByType("navigation")[0];
        const domCount = document.getElementsByTagName("*").length;
        return {
          domCount,
          domInteractive: timing?.domInteractive || 0,
          loadEventEnd: timing?.loadEventEnd || 0,
        };
      });

      console.log(`     Loaded in ${duration}ms, DOM Nodes: ${perf.domCount}`);

      // Snap Mobile, Tablet & Desktop for each page
      await snap(`app_${r.name}`, VIEWPORTS[1]); // 390x844
      await snap(`app_${r.name}`, VIEWPORTS[3]); // 768x1024
      await snap(`app_${r.name}`, VIEWPORTS[6]); // 1440x900
      diagnostics.pagesAudited.push(r.path);
    }

    // -------------------------------------------------------------
    // PHASE 6: RETURN CASHIER QUICK LOGIN ACROSS ALL 8 VIEWPORTS
    // -------------------------------------------------------------
    console.log("\n[PHASE 6] Auditing Returning Cashier Quick PIN Screen (8 viewports)...");
    await page.evaluate(() => {
      localStorage.removeItem("sella_app_unlocked");
      sessionStorage.clear();
    });
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 800));

    await captureAllViewports("returning_cashier_login");

    console.log("\n==================================================================");
    console.log(`AUDIT COMPLETE: Generated ${diagnostics.screenshots.length} screenshots!`);
    console.log(`Console Errors Caught: ${diagnostics.consoleErrors.length}`);
    console.log(`Console Warnings: ${diagnostics.consoleWarnings.length}`);
    console.log(`Network Failures: ${diagnostics.networkFailures.length}`);
    console.log(`Overflow Violations: ${diagnostics.overflows.length}`);
    console.log("==================================================================\n");

    fs.writeFileSync(
      path.join(EVIDENCE_DIR, "audit_diagnostics.json"),
      JSON.stringify(diagnostics, null, 2)
    );
  } catch (err) {
    console.error("Fatal audit execution error:", err);
  } finally {
    await browser.close();
  }
}

audit();
