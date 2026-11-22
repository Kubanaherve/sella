import { spawn } from "child_process";
import fs from "fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ARTIFACT_DIR = "/Users/friendkh/.gemini/antigravity/brain/33c5dee2-6d38-4222-8883-68314d7ca689";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function captureShot(url, outputName, width = 1440, height = 900, delay = 2500) {
  const dest = `${ARTIFACT_DIR}/${outputName}`;
  console.log(`Capturing ${outputName} from ${url}...`);
  return new Promise((resolve, reject) => {
    const proc = spawn(CHROME, [
      "--headless=new",
      "--disable-gpu",
      `--window-size=${width},${height}`,
      `--virtual-time-budget=${delay}`,
      `--screenshot=${dest}`,
      url,
    ]);
    proc.on("close", (code) => {
      if (code === 0) {
        console.log(`Saved ${outputName}`);
        resolve();
      } else {
        reject(new Error(`Failed with code ${code}`));
      }
    });
  });
}

async function main() {
  // 1. Landing Page Hero Desktop
  await captureShot("http://localhost:8080/", "preview-landing.png", 1440, 960, 3000);

  // 2. Interactive Showcase Section
  await captureShot("http://localhost:8080/#demo", "preview-demo.png", 1440, 1100, 2500);

  // 3. Download Hub (Store Badges, Windows, Mac, QR Code)
  await captureShot("http://localhost:8080/#downloads", "preview-downloads.png", 1440, 1100, 2500);

  // 4. Pricing Dedicated Page
  await captureShot("http://localhost:8080/pricing", "preview-pricing.png", 1440, 1100, 2500);

  // 5. Web Checkout Flow
  await captureShot("http://localhost:8080/subscribe?plan=pro&interval=month", "preview-checkout.png", 1440, 960, 2500);

  // 6. Mobile Viewport (iPhone 390x844)
  await captureShot("http://localhost:8080/", "preview-mobile.png", 390, 844, 2500);

  // 4. Login Page
  await captureShot("http://localhost:8080/login", "preview-login.png", 1440, 960, 2500);

  // 5. Signup Page
  await captureShot("http://localhost:8080/signup", "preview-signup.png", 1440, 1050, 2500);

  // 6. Billing Hub
  await captureShot("http://localhost:8080/billing", "preview-billing.png", 1440, 1050, 2500);

  // 7. Settings Page
  await captureShot("http://localhost:8080/settings", "preview-settings.png", 1440, 1050, 2500);

  // 8. Support & Reviewer Hub
  await captureShot("http://localhost:8080/support", "preview-support.png", 1440, 1050, 2500);

  // 9. Privacy Policy
  await captureShot("http://localhost:8080/privacy", "preview-privacy.png", 1440, 1000, 2500);

  // 10. Mobile Viewport (iPhone 390x844)
  await captureShot("http://localhost:8080/", "preview-mobile.png", 390, 844, 2500);

  console.log("All website screenshots captured successfully!");
}

main().catch(console.error);
