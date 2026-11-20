import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const EVIDENCE_DIR = path.resolve(process.cwd(), "tests/qa-evidence");
const BASE_URL = "http://localhost:8080";

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const viewports = {
  iphone_standard: { width: 390, height: 844, label: "390x844 (Mobile)" },
  iphone_max: { width: 430, height: 932, label: "430x932 (Large Mobile)" },
  ipad: { width: 768, height: 1024, label: "768x1024 (Tablet)" },
  desktop_compact: { width: 1280, height: 800, label: "1280x800 (Desktop)" },
  desktop_large: { width: 1440, height: 900, label: "1440x900 (Large Desktop)" },
};

async function run() {
  console.log("Launching Chrome at:", CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--window-size=1440,900"],
  });

  const screenshots = [];

  async function snap(page, name, vpKey) {
    const vp = viewports[vpKey];
    const filename = `${name}_${vp.width}x${vp.height}.png`;
    const filepath = path.join(EVIDENCE_DIR, filename);
    await page.setViewport({ width: vp.width, height: vp.height });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`Saved screenshot: ${filename} [${vp.label}]`);
    screenshots.push({
      file: filename,
      screen: name,
      viewport: `${vp.width}x${vp.height}`,
      description: vp.label,
    });
  }

  try {
    const page = await browser.newPage();

    // ---------------------------------------------------------
    // STEP 1: WELCOME / ENTRY SCREEN (/login)
    // ---------------------------------------------------------
    console.log("\n--- STEP 1: Entry / Welcome Screen ---");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 600));

    // Capture Welcome Screen across viewports
    await snap(page, "01_welcome_screen", "iphone_standard");
    await snap(page, "01_welcome_screen", "iphone_max");
    await snap(page, "01_welcome_screen", "ipad");
    await snap(page, "01_welcome_screen", "desktop_compact");
    await snap(page, "01_welcome_screen", "desktop_large");

    // ---------------------------------------------------------
    // STEP 2: JOIN AS CASHIER - EMPTY FORM
    // ---------------------------------------------------------
    console.log("\n--- STEP 2: Join Store as Cashier (Empty Form) ---");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find((b) => b.textContent?.includes("Umukozi") || b.textContent?.includes("Cashier"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    await snap(page, "02_cashier_join_empty_form", "iphone_standard");
    await snap(page, "02_cashier_join_empty_form", "desktop_compact");

    // ---------------------------------------------------------
    // STEP 3: SUBMIT INVALID SHOP CODE (SEL-999999)
    // ---------------------------------------------------------
    console.log("\n--- STEP 3: Invalid Shop Code Rejection ---");
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll("input"));
      if (inputs[0]) inputs[0].value = "SEL-999999";
      if (inputs[0]) inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
      if (inputs[1]) inputs[1].value = "0788111222";
      if (inputs[1]) inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
      if (inputs[2]) inputs[2].value = "Mugisha Jean";
      if (inputs[2]) inputs[2].dispatchEvent(new Event("input", { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 400));
    await snap(page, "03_invalid_shop_code_entered", "iphone_standard");

    // Click submit
    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
    await snap(page, "04_invalid_shop_code_toast_error", "iphone_standard");

    // ---------------------------------------------------------
    // STEP 4: ENTER CRITICAL CODE SEL-MXA8TT (DEMO JEWEL KIGALI)
    // ---------------------------------------------------------
    console.log("\n--- STEP 4: Submit Valid Shop Code SEL-MXA8TT ---");
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
    await snap(page, "05_sel_mxa8tt_entered", "iphone_standard");

    // Click submit button
    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1800));

    // ---------------------------------------------------------
    // STEP 5: VERIFIED SHOP INFO & PIN CREATION SCREEN
    // ---------------------------------------------------------
    console.log("\n--- STEP 5: Verified Shop Banner + PIN Dial Pad ---");
    await snap(page, "06_shop_verified_set_pin", "iphone_standard");
    await snap(page, "06_shop_verified_set_pin", "iphone_max");
    await snap(page, "06_shop_verified_set_pin", "ipad");
    await snap(page, "06_shop_verified_set_pin", "desktop_compact");
    await snap(page, "06_shop_verified_set_pin", "desktop_large");

    // Helper to click dial pad digits
    async function tapPinDigits(digits) {
      for (const d of digits) {
        await page.evaluate((digit) => {
          const btns = Array.from(document.querySelectorAll("button"));
          const btn = btns.find((b) => b.textContent?.trim() === digit);
          if (btn) btn.click();
        }, d);
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    // ---------------------------------------------------------
    // STEP 6: PIN CONFIRMATION & MISMATCH TEST
    // ---------------------------------------------------------
    console.log("\n--- STEP 6: PIN Confirmation & Mismatch Handling ---");
    // Enter initial PIN: 1 2 3 4
    await tapPinDigits(["1", "2", "3", "4"]);
    await new Promise((r) => setTimeout(r, 800));

    // Now on Confirm PIN screen
    await snap(page, "07_confirm_pin_screen", "iphone_standard");

    // Enter wrong PIN: 9 9 9 9 to test mismatch detection
    await tapPinDigits(["9", "9", "9", "9"]);
    await new Promise((r) => setTimeout(r, 800));
    await snap(page, "08_pin_mismatch_error", "iphone_standard");

    // Re-enter matching PIN:
    // First enters 1 2 3 4
    await tapPinDigits(["1", "2", "3", "4"]);
    await new Promise((r) => setTimeout(r, 600));
    // Confirm 1 2 3 4
    await tapPinDigits(["1", "2", "3", "4"]);
    await new Promise((r) => setTimeout(r, 2500));

    // ---------------------------------------------------------
    // STEP 7: CASHIER POS REGISTER / NEW SALE SCREEN
    // ---------------------------------------------------------
    console.log("\n--- STEP 7: Cashier POS Register ---");
    await page.goto(`${BASE_URL}/new-sale`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));

    await snap(page, "09_cashier_pos_register", "iphone_standard");
    await snap(page, "09_cashier_pos_register", "iphone_max");
    await snap(page, "09_cashier_pos_register", "ipad");
    await snap(page, "09_cashier_pos_register", "desktop_compact");
    await snap(page, "09_cashier_pos_register", "desktop_large");

    // ---------------------------------------------------------
    // STEP 8: CASHIER ATTEMPTING OWNER-ONLY STAFF PAGE
    // ---------------------------------------------------------
    console.log("\n--- STEP 8: Cashier Restricted from Staff Page ---");
    await page.goto(`${BASE_URL}/staff`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 800));
    await snap(page, "10_cashier_staff_page_blocked", "iphone_standard");
    await snap(page, "10_cashier_staff_page_blocked", "desktop_compact");

    // ---------------------------------------------------------
    // STEP 9: RETURNING CASHIER QUICK PIN LOGIN
    // ---------------------------------------------------------
    console.log("\n--- STEP 9: Returning Cashier Quick PIN Login ---");
    await page.evaluate(() => {
      // Simulate next day lock: clear in-memory unlock flag
      localStorage.removeItem("sella_app_unlocked");
      sessionStorage.clear();
    });
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 800));

    await snap(page, "11_returning_cashier_pin_login", "iphone_standard");
    await snap(page, "11_returning_cashier_pin_login", "iphone_max");
    await snap(page, "11_returning_cashier_pin_login", "ipad");
    await snap(page, "11_returning_cashier_pin_login", "desktop_compact");
    await snap(page, "11_returning_cashier_pin_login", "desktop_large");

    // Unlock with PIN 1 2 3 4
    await tapPinDigits(["1", "2", "3", "4"]);
    await new Promise((r) => setTimeout(r, 2000));
    await snap(page, "12_returning_cashier_unlocked_pos", "iphone_standard");

    // ---------------------------------------------------------
    // STEP 10: OWNER'S DEDICATED STAFF MANAGEMENT SCREEN
    // ---------------------------------------------------------
    console.log("\n--- STEP 10: Owner Dedicated Staff Management Page ---");
    // Switch to Owner mode in local DB
    await page.evaluate(async () => {
      localStorage.removeItem("sella_cashier_mode");
      localStorage.setItem("sella_app_unlocked", "1");
      const { db } = await import("/src/db/localDb.ts");
      const ownerProfile = {
        id: "owner-demo-mxa8tt",
        business_name: "Demo Jewel Kigali",
        display_name: "Demo Owner A",
        shop_code: "SEL-MXA8TT",
        phone: "+250780000001",
        owner_pin_hash: "abcd",
        created_at: new Date().toISOString(),
      };
      await db.profiles.put(ownerProfile, "local_user");
      // Populate demo staff members
      await db.staff.bulkPut([
        {
          id: "staff-1",
          shop_id: "owner-demo-mxa8tt",
          name: "Mugisha Jean",
          phone: "0788111222",
          role: "cashier",
          status: "active",
          total_sales_volume: 485000,
          total_sales_count: 24,
          last_active_at: new Date().toISOString(),
          created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
        {
          id: "staff-2",
          shop_id: "owner-demo-mxa8tt",
          name: "Uwase Aline",
          phone: "0788333444",
          role: "cashier",
          status: "active",
          total_sales_volume: 320000,
          total_sales_count: 17,
          last_active_at: new Date(Date.now() - 3600000).toISOString(),
          created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        },
        {
          id: "staff-3",
          shop_id: "owner-demo-mxa8tt",
          name: "Gasana Eric",
          phone: "0788555666",
          role: "cashier",
          status: "deactivated",
          total_sales_volume: 85000,
          total_sales_count: 5,
          last_active_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        },
      ]);
    });

    await page.goto(`${BASE_URL}/staff`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1200));

    await snap(page, "13_owner_staff_management", "iphone_standard");
    await snap(page, "13_owner_staff_management", "ipad");
    await snap(page, "13_owner_staff_management", "desktop_compact");
    await snap(page, "13_owner_staff_management", "desktop_large");

    // Open Add Staff Modal
    await page.evaluate(() => {
      const addBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Ongera Umukozi")
      );
      if (addBtn) addBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await snap(page, "14_owner_add_staff_modal", "iphone_standard");
    await snap(page, "14_owner_add_staff_modal", "desktop_compact");

    // Close modal
    await page.keyboard.press("Escape");
    await new Promise((r) => setTimeout(r, 400));

    // Open Reset PIN Modal for Mugisha Jean
    await page.evaluate(() => {
      const resetBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Hindura PIN") || b.getAttribute("title")?.includes("Hindura PIN")
      );
      if (resetBtn) resetBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await snap(page, "15_owner_reset_pin_modal", "iphone_standard");
    await snap(page, "15_owner_reset_pin_modal", "desktop_compact");

    console.log(`\n========================================`);
    console.log(`SUCCESS: Captured ${screenshots.length} visual evidence screenshots!`);
    console.log(`========================================\n`);

    fs.writeFileSync(
      path.join(EVIDENCE_DIR, "screenshots_manifest.json"),
      JSON.stringify(screenshots, null, 2)
    );
  } catch (err) {
    console.error("Fatal error during screenshot capture:", err);
  } finally {
    await browser.close();
  }
}

run();
