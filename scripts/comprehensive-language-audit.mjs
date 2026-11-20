import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE_URL = "http://localhost:8080";
const SCREENSHOT_BASE = path.resolve(process.cwd(), "screenshots");

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, label: "desktop" },
  tablet: { width: 768, height: 1024, label: "tablet" },
  mobile: { width: 390, height: 844, label: "mobile" },
};

// Seed script to inject rich test data into Dexie
const SEED_DATA_SCRIPT = `
(async () => {
  localStorage.setItem("sella_app_unlocked", "1");
  localStorage.setItem("sella_splash_seen_v9_capital_Sella", "1");
  sessionStorage.setItem("sella_splash_seen_v9_capital_Sella", "1");
  const { db } = await import("/src/db/localDb.ts");
  
  // 1. Profile
  const ownerProfile = {
    id: "owner-demo-mxa8tt",
    business_name: "Demo Jewel Kigali",
    display_name: "Demo Owner A",
    owner_name: "Demo Owner A",
    shop_code: "SEL-MXA8TT",
    phone: "+250780000001",
    phone_normalized: "+250780000001",
    email: "owner@jewelkigali.rw",
    owner_pin_hash: "abcd",
    currency: "FRW",
    role: "owner",
    is_superadmin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  await db.profiles.put(ownerProfile, "local_user");

  // 2. Inventory Items
  await db.inventory_items.clear();
  await db.inventory_items.bulkPut([
    {
      id: "inv-1",
      profile_id: "owner-demo-mxa8tt",
      item_name: "Amashanyarazi / Bulb LED 15W",
      cost_price: 1500,
      selling_price: 2500,
      quantity: 45,
      category: "Electronics",
      unit: "pcs",
      barcode: "6001234567890",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "inv-2",
      profile_id: "owner-demo-mxa8tt",
      item_name: "Isaha y'ukuboko / Wristwatch Gold",
      cost_price: 25000,
      selling_price: 45000,
      quantity: 8,
      category: "Jewelry",
      unit: "pcs",
      barcode: "6001234567891",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "inv-3",
      profile_id: "owner-demo-mxa8tt",
      item_name: "Amavuta ya Coco / Pure Coconut Oil",
      cost_price: 3000,
      selling_price: 5000,
      quantity: 30,
      category: "Cosmetics",
      unit: "bottle",
      barcode: "6001234567892",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "inv-4",
      profile_id: "owner-demo-mxa8tt",
      item_name: "Umukandara w'uruhu / Leather Belt",
      cost_price: 7000,
      selling_price: 12000,
      quantity: 15,
      category: "Accessories",
      unit: "pcs",
      barcode: "6001234567893",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "inv-5",
      profile_id: "owner-demo-mxa8tt",
      item_name: "Iherena rya zahabu / Gold Earrings",
      cost_price: 60000,
      selling_price: 95000,
      quantity: 3,
      category: "Jewelry",
      unit: "pair",
      barcode: "6001234567894",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "inv-6",
      profile_id: "owner-demo-mxa8tt",
      item_name: "Impeta ya diyama / Diamond Ring",
      cost_price: 180000,
      selling_price: 280000,
      quantity: 0,
      category: "Jewelry",
      unit: "pcs",
      barcode: "6001234567895",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);

  // 3. Clients
  await db.clients.clear();
  await db.clients.bulkPut([
    {
      id: "client-1",
      profile_id: "owner-demo-mxa8tt",
      name: "Mugisha Jean",
      phone: "+250788111222",
      phone_normalized: "250788111222",
      notes: "VIP Client Kigali Downtown",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "client-2",
      profile_id: "owner-demo-mxa8tt",
      name: "Uwase Claire",
      phone: "+250788333444",
      phone_normalized: "250788333444",
      notes: "Remind on Fridays",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "client-3",
      profile_id: "owner-demo-mxa8tt",
      name: "Kalisa Eric",
      phone: "+250788555666",
      phone_normalized: "250788555666",
      notes: "Pays via MTN MoMo",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);

  // 4. Debts
  await db.debts.clear();
  await db.debts.bulkPut([
    {
      id: "debt-1",
      profile_id: "owner-demo-mxa8tt",
      client_id: "client-1",
      total_amount: 95000,
      remaining_balance: 45000,
      due_date: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
      status: "active",
      receipt_number: "R-95A10B22",
      discount_amount: 0,
      change_given: 0,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "debt-2",
      profile_id: "owner-demo-mxa8tt",
      client_id: "client-2",
      total_amount: 45000,
      remaining_balance: 45000,
      due_date: new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10), // overdue!
      status: "active",
      receipt_number: "R-45B88C11",
      discount_amount: 0,
      change_given: 0,
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "debt-3",
      profile_id: "owner-demo-mxa8tt",
      client_id: "client-3",
      total_amount: 24000,
      remaining_balance: 0,
      due_date: null,
      status: "paid",
      paid_at: new Date().toISOString(),
      receipt_number: "R-24C77D33",
      discount_amount: 0,
      change_given: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);

  // 5. Debt Items
  await db.debt_items.clear();
  await db.debt_items.bulkPut([
    {
      id: "di-1",
      profile_id: "owner-demo-mxa8tt",
      debt_id: "debt-1",
      inventory_item_id: "inv-5",
      item_name: "Iherena rya zahabu / Gold Earrings",
      quantity: 1,
      unit_price: 95000,
      created_at: new Date().toISOString()
    },
    {
      id: "di-2",
      profile_id: "owner-demo-mxa8tt",
      debt_id: "debt-2",
      inventory_item_id: "inv-2",
      item_name: "Isaha y'ukuboko / Wristwatch Gold",
      quantity: 1,
      unit_price: 45000,
      created_at: new Date().toISOString()
    },
    {
      id: "di-3",
      profile_id: "owner-demo-mxa8tt",
      debt_id: "debt-3",
      inventory_item_id: "inv-4",
      item_name: "Umukandara w'uruhu / Leather Belt",
      quantity: 2,
      unit_price: 12000,
      created_at: new Date().toISOString()
    }
  ]);

  // 6. Payments
  await db.payments.clear();
  await db.payments.bulkPut([
    {
      id: "pay-1",
      profile_id: "owner-demo-mxa8tt",
      debt_id: "debt-1",
      client_id: "client-1",
      amount: 50000,
      payment_method: "momo",
      reference_number: "MOMO-98721345",
      notes: "Avansi yishyuwe na MTN MoMo",
      cashier_user_id: "staff-1",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: "pay-2",
      profile_id: "owner-demo-mxa8tt",
      debt_id: "debt-3",
      client_id: "client-3",
      amount: 24000,
      payment_method: "cash",
      reference_number: null,
      notes: "Yishyuwe yose mu ntoki (Cash)",
      cashier_user_id: "owner-demo-mxa8tt",
      created_at: new Date().toISOString()
    }
  ]);

  // 7. Sales
  await db.sales.clear();
  await db.sales.bulkPut([
    {
      id: "sale-1",
      profile_id: "owner-demo-mxa8tt",
      debt_id: "debt-1",
      client_id: "client-1",
      inventory_item_id: "inv-5",
      item_name: "Iherena rya zahabu / Gold Earrings",
      quantity: 1,
      cost_price: 60000,
      sale_price: 95000,
      payment_method: "momo",
      payment_status: "partial",
      cashier_user_id: "staff-1",
      cashier_name: "Mugisha Jean",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: "sale-2",
      profile_id: "owner-demo-mxa8tt",
      debt_id: "debt-2",
      client_id: "client-2",
      inventory_item_id: "inv-2",
      item_name: "Isaha y'ukuboko / Wristwatch Gold",
      quantity: 1,
      cost_price: 25000,
      sale_price: 45000,
      payment_method: "cash",
      payment_status: "credit",
      cashier_user_id: "staff-1",
      cashier_name: "Mugisha Jean",
      created_at: new Date(Date.now() - 86400000 * 7).toISOString()
    },
    {
      id: "sale-3",
      profile_id: "owner-demo-mxa8tt",
      debt_id: "debt-3",
      client_id: "client-3",
      inventory_item_id: "inv-4",
      item_name: "Umukandara w'uruhu / Leather Belt",
      quantity: 2,
      cost_price: 7000,
      sale_price: 12000,
      payment_method: "cash",
      payment_status: "paid",
      cashier_user_id: "owner-demo-mxa8tt",
      cashier_name: "Demo Owner A",
      created_at: new Date().toISOString()
    }
  ]);

  // 8. Staff
  await db.staff.clear();
  await db.staff.bulkPut([
    {
      id: "staff-1",
      profile_id: "owner-demo-mxa8tt",
      owner_id: "owner-demo-mxa8tt",
      shop_code: "SEL-MXA8TT",
      name: "Mugisha Jean",
      phone: "0788111222",
      phone_normalized: "+250788111222",
      role: "cashier",
      status: "active",
      pin_hash: "abcd",
      last_active_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "staff-2",
      profile_id: "owner-demo-mxa8tt",
      owner_id: "owner-demo-mxa8tt",
      shop_code: "SEL-MXA8TT",
      name: "Mutesi Aline",
      phone: "0788333444",
      phone_normalized: "+250788333444",
      role: "cashier",
      status: "deactivated",
      pin_hash: "efgh",
      last_active_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
})();
`;

async function main() {
  console.log("=== Sella Complete UI Language Audit & Screenshot Runner ===");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  const capturedEvidence = [];

  async function takeSnap(module, name, lang, vpKey) {
    const vp = VIEWPORTS[vpKey];
    const dir = path.join(SCREENSHOT_BASE, module);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `${name}-${lang}_${vp.width}x${vp.height}.png`;
    const filepath = path.join(dir, filename);
    await page.setViewport({ width: vp.width, height: vp.height });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`[Screenshot] ${module}/${filename} (${lang.toUpperCase()}, ${vp.label})`);
    capturedEvidence.push({
      module,
      name,
      lang,
      viewport: vp.label,
      dimensions: `${vp.width}x${vp.height}`,
      filepath,
    });
  }

  async function setLangAndSeed(lang) {
    await page.evaluate((targetLang) => {
      localStorage.setItem("sella_app_language_v1", targetLang);
    }, lang);
    await page.evaluate(SEED_DATA_SCRIPT);
    await new Promise((r) => setTimeout(r, 300));
  }

  try {
    // -------------------------------------------------------------
    // MODULE 1: AUTHENTICATION & ENTRY FLOW
    // -------------------------------------------------------------
    console.log("\n--- AUDITING: Authentication & Onboarding ---");
    for (const lang of ["rw", "en"]) {
      // 1.1 Welcome / Login Tab
      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
      await page.evaluate((l) => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem("sella_app_language_v1", l);
      }, lang);
      await page.reload({ waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 500));

      // Click Language button in UI if needed
      await page.evaluate((l) => {
        const btns = Array.from(document.querySelectorAll("button"));
        const targetBtn = btns.find((b) => b.textContent?.trim().toUpperCase() === l.toUpperCase());
        if (targetBtn) targetBtn.click();
      }, lang);
      await new Promise((r) => setTimeout(r, 400));

      await takeSnap("authentication", "welcome-login", lang, "desktop");
      await takeSnap("authentication", "welcome-login", lang, "tablet");
      await takeSnap("authentication", "welcome-login", lang, "mobile");

      // 1.2 Register Tab
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const regBtn = btns.find((b) => b.textContent?.includes("Tangira") || b.textContent?.includes("Create") || b.textContent?.includes("Iyandikishe") || b.textContent?.includes("Register"));
        if (regBtn) regBtn.click();
      });
      await new Promise((r) => setTimeout(r, 500));
      await takeSnap("authentication", "register-form", lang, "desktop");
      await takeSnap("authentication", "register-form", lang, "mobile");

      // 1.3 Cashier Join Tab
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const cashierBtn = btns.find((b) => b.textContent?.includes("Umukozi") || b.textContent?.includes("Cashier"));
        if (cashierBtn) cashierBtn.click();
      });
      await new Promise((r) => setTimeout(r, 500));
      await takeSnap("authentication", "cashier-join-empty", lang, "desktop");
      await takeSnap("authentication", "cashier-join-empty", lang, "mobile");

      // 1.4 Cashier PIN Setup (Dial Pad)
      await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll("input"));
        if (inputs[0]) { inputs[0].value = "SEL-MXA8TT"; inputs[0].dispatchEvent(new Event("input", { bubbles: true })); }
        if (inputs[1]) { inputs[1].value = "0788111222"; inputs[1].dispatchEvent(new Event("input", { bubbles: true })); }
        if (inputs[2]) { inputs[2].value = "Mugisha Jean"; inputs[2].dispatchEvent(new Event("input", { bubbles: true })); }
      });
      await new Promise((r) => setTimeout(r, 400));
      await page.evaluate(() => {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
      });
      await new Promise((r) => setTimeout(r, 1500));
      await takeSnap("authentication", "cashier-set-pin", lang, "desktop");
      await takeSnap("authentication", "cashier-set-pin", lang, "mobile");

      // 1.5 Forgot Password & Reset Password
      await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 400));
      await takeSnap("authentication", "forgot-password", lang, "desktop");
      await takeSnap("authentication", "forgot-password", lang, "mobile");

      await page.goto(`${BASE_URL}/reset-password`, { waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 400));
      await takeSnap("authentication", "reset-password", lang, "desktop");
      await takeSnap("authentication", "reset-password", lang, "mobile");
    }

    // -------------------------------------------------------------
    // MODULE 2: DASHBOARD
    // -------------------------------------------------------------
    console.log("\n--- AUDITING: Dashboard ---");
    for (const lang of ["rw", "en"]) {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle2" });
      await setLangAndSeed(lang);
      await page.reload({ waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 800));

      await takeSnap("dashboard", "dashboard-overview", lang, "desktop");
      await takeSnap("dashboard", "dashboard-overview", lang, "tablet");
      await takeSnap("dashboard", "dashboard-overview", lang, "mobile");
    }

    // -------------------------------------------------------------
    // MODULE 3: SALES & POS REGISTER
    // -------------------------------------------------------------
    console.log("\n--- AUDITING: Sales & POS Register ---");
    for (const lang of ["rw", "en"]) {
      // 3.1 POS Register Empty & Populated
      await page.goto(`${BASE_URL}/new-sale`, { waitUntil: "networkidle2" });
      await setLangAndSeed(lang);
      await page.reload({ waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 800));

      await takeSnap("sales", "pos-register-empty", lang, "desktop");
      await takeSnap("sales", "pos-register-empty", lang, "tablet");
      await takeSnap("sales", "pos-register-empty", lang, "mobile");

      // Add item to cart
      await page.evaluate(() => {
        const itemButtons = Array.from(document.querySelectorAll("button, [role='button']"));
        const product = itemButtons.find((b) => b.textContent?.includes("Amashanyarazi") || b.textContent?.includes("Bulb") || b.textContent?.includes("Wristwatch"));
        if (product) product.click();
      });
      await new Promise((r) => setTimeout(r, 500));
      await takeSnap("sales", "pos-register-cart-item", lang, "desktop");
      await takeSnap("sales", "pos-register-cart-item", lang, "mobile");

      // Click Checkout / Kwishyura to open payment modal
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const payBtn = btns.find((b) => b.textContent?.includes("Kwishyura") || b.textContent?.includes("Checkout") || b.textContent?.includes("Pay"));
        if (payBtn) payBtn.click();
      });
      await new Promise((r) => setTimeout(r, 600));
      await takeSnap("sales", "payment-modal", lang, "desktop");
      await takeSnap("sales", "payment-modal", lang, "mobile");

      // 3.2 Sales History Page
      await page.goto(`${BASE_URL}/sales`, { waitUntil: "networkidle2" });
      await setLangAndSeed(lang);
      await page.reload({ waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 800));

      await takeSnap("sales", "sales-history-list", lang, "desktop");
      await takeSnap("sales", "sales-history-list", lang, "tablet");
      await takeSnap("sales", "sales-history-list", lang, "mobile");
    }

    // -------------------------------------------------------------
    // MODULE 4: INVENTORY MANAGEMENT
    // -------------------------------------------------------------
    console.log("\n--- AUDITING: Inventory ---");
    for (const lang of ["rw", "en"]) {
      // 4.1 Product List
      await page.goto(`${BASE_URL}/inventory`, { waitUntil: "networkidle2" });
      await setLangAndSeed(lang);
      await page.reload({ waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 800));

      await takeSnap("inventory", "inventory-list", lang, "desktop");
      await takeSnap("inventory", "inventory-list", lang, "tablet");
      await takeSnap("inventory", "inventory-list", lang, "mobile");

      // Open Add Product Modal
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const addBtn = btns.find((b) => b.textContent?.includes("Ongeraho") || b.textContent?.includes("Add") || b.textContent?.includes("New Product"));
        if (addBtn) addBtn.click();
      });
      await new Promise((r) => setTimeout(r, 600));
      await takeSnap("inventory", "add-product-modal", lang, "desktop");
      await takeSnap("inventory", "add-product-modal", lang, "mobile");

      // Close modal
      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 300));

      // 4.2 Import Inventory Page
      await page.goto(`${BASE_URL}/import-inventory`, { waitUntil: "networkidle2" });
      await setLangAndSeed(lang);
      await page.reload({ waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 600));

      await takeSnap("inventory", "import-inventory-page", lang, "desktop");
      await takeSnap("inventory", "import-inventory-page", lang, "mobile");
    }

    // -------------------------------------------------------------
    // MODULE 5: CLIENTS MANAGEMENT
    // -------------------------------------------------------------
    console.log("\n--- AUDITING: Clients ---");
    for (const lang of ["rw", "en"]) {
      await page.goto(`${BASE_URL}/clients`, { waitUntil: "networkidle2" });
      await setLangAndSeed(lang);
      await page.reload({ waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 800));

      await takeSnap("clients", "clients-list", lang, "desktop");
      await takeSnap("clients", "clients-list", lang, "tablet");
      await takeSnap("clients", "clients-list", lang, "mobile");

      // Open Add Client modal
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const addBtn = btns.find((b) => b.textContent?.includes("Ongeraho") || b.textContent?.includes("Add") || b.textContent?.includes("New Client"));
        if (addBtn) addBtn.click();
      });
      await new Promise((r) => setTimeout(r, 600));
      await takeSnap("clients", "add-client-modal", lang, "desktop");
      await takeSnap("clients", "add-client-modal", lang, "mobile");

      // Close modal
      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 300));

      // 5.2 Import Customers Page
      await page.goto(`${BASE_URL}/import-customers`, { waitUntil: "networkidle2" });
      await setLangAndSeed(lang);
      await page.reload({ waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 600));
      await takeSnap("clients", "import-customers-page", lang, "desktop");
      await takeSnap("clients", "import-customers-page", lang, "mobile");
    }

    // -------------------------------------------------------------
    // MODULE 6: DEBTS & PAYMENTS
    // -------------------------------------------------------------
    console.log("\n--- AUDITING: Debts & Payments ---");
    for (const lang of ["rw", "en"]) {
      await page.goto(`${BASE_URL}/debts`, { waitUntil: "networkidle2" });
      await setLangAndSeed(lang);
      await page.reload({ waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 800));

      await takeSnap("debts", "debts-list", lang, "desktop");
      await takeSnap("debts", "debts-list", lang, "tablet");
      await takeSnap("debts", "debts-list", lang, "mobile");

      // Click on a debtor card to open details / payment modal
      await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll("div, button"));
        const target = cards.find((c) => c.textContent?.includes("Mugisha Jean") || c.textContent?.includes("95,000"));
        if (target) target.click();
      });
      await new Promise((r) => setTimeout(r, 600));
      await takeSnap("debts", "debt-details-modal", lang, "desktop");
      await takeSnap("debts", "debt-details-modal", lang, "mobile");

      // Click Pay / Ishyura
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const payBtn = btns.find((b) => b.textContent?.includes("Ishyura") || b.textContent?.includes("Pay") || b.textContent?.includes("Andika ko yishyuye"));
        if (payBtn) payBtn.click();
      });
      await new Promise((r) => setTimeout(r, 600));
      await takeSnap("payments", "record-payment-modal", lang, "desktop");
      await takeSnap("payments", "record-payment-modal", lang, "mobile");

      // Close modal
      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 300));
    }

    // -------------------------------------------------------------
    // MODULE 7: STAFF MANAGEMENT
    // -------------------------------------------------------------
    console.log("\n--- AUDITING: Staff Management ---");
    for (const lang of ["rw", "en"]) {
      await page.goto(`${BASE_URL}/staff`, { waitUntil: "networkidle2" });
      await setLangAndSeed(lang);
      await page.reload({ waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 800));

      await takeSnap("staff", "staff-management-roster", lang, "desktop");
      await takeSnap("staff", "staff-management-roster", lang, "tablet");
      await takeSnap("staff", "staff-management-roster", lang, "mobile");

      // Open Add Staff Modal
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const addBtn = btns.find((b) => b.textContent?.includes("Ongeraho umukozi") || b.textContent?.includes("Add Staff"));
        if (addBtn) addBtn.click();
      });
      await new Promise((r) => setTimeout(r, 600));
      await takeSnap("staff", "add-staff-modal", lang, "desktop");
      await takeSnap("staff", "add-staff-modal", lang, "mobile");

      // Close modal
      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 300));
    }

    // -------------------------------------------------------------
    // MODULE 8: SETTINGS & ACCOUNT
    // -------------------------------------------------------------
    console.log("\n--- AUDITING: Settings & Account ---");
    for (const lang of ["rw", "en"]) {
      // 8.1 Account Page
      await page.goto(`${BASE_URL}/account`, { waitUntil: "networkidle2" });
      await setLangAndSeed(lang);
      await page.reload({ waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 800));

      await takeSnap("settings", "account-page", lang, "desktop");
      await takeSnap("settings", "account-page", lang, "tablet");
      await takeSnap("settings", "account-page", lang, "mobile");

      // 8.2 Receipt Settings Page
      await page.goto(`${BASE_URL}/receipt-settings`, { waitUntil: "networkidle2" });
      await setLangAndSeed(lang);
      await page.reload({ waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 800));

      await takeSnap("settings", "receipt-settings-page", lang, "desktop");
      await takeSnap("settings", "receipt-settings-page", lang, "mobile");

      // 8.3 More Menu
      await page.goto(`${BASE_URL}/more`, { waitUntil: "networkidle2" });
      await setLangAndSeed(lang);
      await page.reload({ waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 800));

      await takeSnap("settings", "more-hub-page", lang, "desktop");
      await takeSnap("settings", "more-hub-page", lang, "mobile");
    }

    // -------------------------------------------------------------
    // MODULE 9: SUBSCRIPTION & BILLING
    // -------------------------------------------------------------
    console.log("\n--- AUDITING: Subscription & Billing ---");
    for (const lang of ["rw", "en"]) {
      // 9.1 Subscribe Plans
      await page.goto(`${BASE_URL}/subscribe`, { waitUntil: "networkidle2" });
      await setLangAndSeed(lang);
      await page.reload({ waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 800));

      await takeSnap("subscription", "subscribe-plans-page", lang, "desktop");
      await takeSnap("subscription", "subscribe-plans-page", lang, "tablet");
      await takeSnap("subscription", "subscribe-plans-page", lang, "mobile");

      // 9.2 Billing Management
      await page.goto(`${BASE_URL}/billing`, { waitUntil: "networkidle2" });
      await setLangAndSeed(lang);
      await page.reload({ waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 800));

      await takeSnap("subscription", "billing-history-page", lang, "desktop");
      await takeSnap("subscription", "billing-history-page", lang, "mobile");
    }

    // -------------------------------------------------------------
    // MODULE 10: INBOX & CHATSELLA ASSISTANT
    // -------------------------------------------------------------
    console.log("\n--- AUDITING: Inbox & ChatSella Assistant ---");
    for (const lang of ["rw", "en"]) {
      // 10.1 Inbox Reminders
      await page.goto(`${BASE_URL}/inbox`, { waitUntil: "networkidle2" });
      await setLangAndSeed(lang);
      await page.reload({ waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 800));

      await takeSnap("inbox", "inbox-reminders-page", lang, "desktop");
      await takeSnap("inbox", "inbox-reminders-page", lang, "tablet");
      await takeSnap("inbox", "inbox-reminders-page", lang, "mobile");

      // 10.2 ChatSella Assistant
      await page.goto(`${BASE_URL}/assistant`, { waitUntil: "networkidle2" });
      await setLangAndSeed(lang);
      await page.reload({ waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 800));

      await takeSnap("inbox", "assistant-chatsella-page", lang, "desktop");
      await takeSnap("inbox", "assistant-chatsella-page", lang, "mobile");
    }

    // -------------------------------------------------------------
    // MODULE 11: MARKETING & DOCUMENTATION PAGES
    // -------------------------------------------------------------
    console.log("\n--- AUDITING: Marketing & Legal Pages ---");
    const marketingRoutes = [
      { route: "/", name: "landing-page" },
      { route: "/features", name: "features-page" },
      { route: "/benefits", name: "benefits-page" },
      { route: "/how-it-works", name: "how-it-works-page" },
      { route: "/pricing", name: "pricing-page" },
      { route: "/download", name: "download-page" },
      { route: "/docs", name: "documentation-page" },
      { route: "/faq", name: "faq-page" },
      { route: "/support", name: "support-page" },
      { route: "/contact", name: "contact-page" },
      { route: "/about", name: "about-page" },
      { route: "/terms", name: "terms-page" },
      { route: "/privacy", name: "privacy-page" },
    ];

    for (const { route, name } of marketingRoutes) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 600));
      await takeSnap("marketing", name, "en", "desktop");
      await takeSnap("marketing", name, "en", "mobile");
    }

    console.log(`\nSuccessfully captured ${capturedEvidence.length} screenshots across modules!`);
    fs.writeFileSync(
      path.join(SCREENSHOT_BASE, "manifest.json"),
      JSON.stringify(capturedEvidence, null, 2)
    );
  } catch (err) {
    console.error("Audit error:", err);
  } finally {
    await browser.close();
  }
}

main();
