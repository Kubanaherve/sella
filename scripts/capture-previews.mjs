import { spawn } from "child_process";
import fs from "fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ARTIFACT_DIR = "/Users/friendkh/.gemini/antigravity/brain/60d49a68-b551-4d38-ba5b-302ad87381a0";

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
  console.log("Capturing responsive multi-device previews...");

  // 1. MacBook Light Mode
  await runChrome([
    "--headless",
    "--disable-gpu",
    "--window-size=1440,920",
    "--virtual-time-budget=2000",
    `--screenshot=${ARTIFACT_DIR}/preview-macbook-light.png`,
    "http://localhost:5173/?theme=light",
  ]);

  // 2. MacBook Dark Mode
  await runChrome([
    "--headless",
    "--disable-gpu",
    "--window-size=1440,920",
    "--virtual-time-budget=2000",
    `--screenshot=${ARTIFACT_DIR}/preview-macbook-dark.png`,
    "http://localhost:5173/?theme=dark",
  ]);

  // 3. Mobile iPhone / Android (390 x 844)
  await runChrome([
    "--headless",
    "--disable-gpu",
    "--window-size=390,844",
    "--virtual-time-budget=2000",
    `--screenshot=${ARTIFACT_DIR}/preview-mobile-light.png`,
    "http://localhost:5173/?theme=light",
  ]);

  await runChrome([
    "--headless",
    "--disable-gpu",
    "--window-size=390,844",
    "--virtual-time-budget=2000",
    `--screenshot=${ARTIFACT_DIR}/preview-mobile-dark.png`,
    "http://localhost:5173/?theme=dark",
  ]);

  // 4. Docs in Light and Dark
  await runChrome([
    "--headless",
    "--disable-gpu",
    "--window-size=1440,920",
    "--virtual-time-budget=2000",
    `--screenshot=${ARTIFACT_DIR}/preview-docs-light.png`,
    "http://localhost:5173/docs?theme=light",
  ]);

  await runChrome([
    "--headless",
    "--disable-gpu",
    "--window-size=1440,920",
    "--virtual-time-budget=2000",
    `--screenshot=${ARTIFACT_DIR}/preview-docs-dark.png`,
    "http://localhost:5173/docs?theme=dark",
  ]);

  // 5. Dual Device Showcase Section in Light and Dark
  await runChrome([
    "--headless",
    "--disable-gpu",
    "--window-size=1440,1100",
    "--virtual-time-budget=2000",
    `--screenshot=${ARTIFACT_DIR}/preview-showcase-light.png`,
    "http://localhost:5173/?theme=light#showcase",
  ]);

  await runChrome([
    "--headless",
    "--disable-gpu",
    "--window-size=1440,1100",
    "--virtual-time-budget=2000",
    `--screenshot=${ARTIFACT_DIR}/preview-showcase-dark.png`,
    "http://localhost:5173/?theme=dark#showcase",
  ]);

  console.log("Previews captured successfully!");
}

main().catch(console.error);
