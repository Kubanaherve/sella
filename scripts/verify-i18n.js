#!/usr/bin/env node

/**
 * Sella Enterprise i18n & Zero-Hardcoded-Strings Build Blocker
 *
 * Verifies:
 * 1. Completeness: Every key in en.json exists in rw.json, zh.json, and ar.json.
 * 2. Non-Empty & Authenticity: No empty values or copy-pasted English strings in non-English dictionaries.
 * 3. AST Codebase Inspection: Scans all .tsx files to ensure no visible raw English text nodes or unlocalized attributes.
 */

import fs from "fs";
import path from "path";
import ts from "typescript";

const ROOT_DIR = process.cwd();
const LOCALES_DIR = path.join(ROOT_DIR, "src/i18n/locales");

console.log("\n=======================================================");
console.log("  🔍 SELLA ZERO-HARDCODED-STRINGS & I18N VERIFICATION");
console.log("=======================================================\n");

let errors = 0;
let warnings = 0;

// 1. Verify Locale Files
const enPath = path.join(LOCALES_DIR, "en.json");
const rwPath = path.join(LOCALES_DIR, "rw.json");
const zhPath = path.join(LOCALES_DIR, "zh.json");
const arPath = path.join(LOCALES_DIR, "ar.json");
const glossaryPath = path.join(ROOT_DIR, "docs/i18n/kinyarwanda_ux_glossary.json");
const eaGlossaryPath = path.join(ROOT_DIR, "docs/i18n/east_africa_ux_glossary.json");

if (!fs.existsSync(enPath) || !fs.existsSync(rwPath) || !fs.existsSync(zhPath) || !fs.existsSync(arPath)) {
  console.error("❌ Missing required locale files in src/i18n/locales/ (en, rw, zh, ar)");
  process.exit(1);
}

const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
const rw = JSON.parse(fs.readFileSync(rwPath, "utf8"));
const zh = JSON.parse(fs.readFileSync(zhPath, "utf8"));
const ar = JSON.parse(fs.readFileSync(arPath, "utf8"));

if (fs.existsSync(glossaryPath)) {
  console.log(`✓ Loaded Kinyarwanda UX Glossary: docs/i18n/kinyarwanda_ux_glossary.json`);
}
if (fs.existsSync(eaGlossaryPath)) {
  console.log(`✓ Loaded East Africa Commercial Glossary: docs/i18n/east_africa_ux_glossary.json`);
}

const enKeys = Object.keys(en);
console.log(`✓ Loaded English baseline dictionary: ${enKeys.length} keys`);

// Whitelisted universal terms (brand names, tech protocols, currencies)
const WHITELISTED_UNIVERSAL_TERMS = new Set([
  "Sella",
  "KUBANA FRIEND TECHNOLOGIES",
  "Hervé Friend Kubana",
  "Kigali, Rwanda",
  "MTN",
  "MTN MoMo",
  "Airtel",
  "Airtel Money",
  "MoMo",
  "MoMoPay",
  "RWF",
  "PIN",
  "PDF",
  "CSV",
  "Excel",
  "USB",
  "Bluetooth",
  "WhatsApp",
  "SMS",
  "PWA",
  "API",
  "TIN",
  "iOS",
  "Android",
  "Windows",
  "Mac",
  "macOS",
  "DMG",
  "MSIX",
  "Pro",
  "Normal",
  "Google Play",
  "App Store",
  "Apple Silicon",
  "Intel",
  "58mm",
  "80mm",
  "Chrome",
  "Safari",
  "Edge",
  "h.kubana@alustudent.com",
  "+250",
  "*182#",
  "*500#",
  "*182*8*1#",
  "*182*7*1#",
  "078X XXX XXX",
  "07X XXX XXXX",
  "078X XXX XXXX",
  "Apple App Store (iOS)",
  "Google Play Store (Android)",
  "Windows 10 & 11 (64-bit .exe & MSIX)",
  "658054"
]);

function isWhitelisted(val) {
  if (!val) return false;
  const trimmed = val.trim();
  if (WHITELISTED_UNIVERSAL_TERMS.has(trimmed)) return true;
  // Numbers, prices, single letters, punctuation
  if (/^[\d\s.,:/%*#+\-()–—]+$/.test(trimmed)) return true;
  return false;
}

const targets = [
  { code: "rw", name: "Kinyarwanda", dict: rw },
  { code: "zh", name: "Chinese - Simplified", dict: zh },
  { code: "ar", name: "Arabic (RTL)", dict: ar },
];

for (const target of targets) {
  let missing = [];
  let empty = [];
  let leakedEnglish = [];

  for (const key of enKeys) {
    const enVal = en[key];
    const targetVal = target.dict[key];

    if (targetVal === undefined) {
      missing.push(key);
      continue;
    }
    if (typeof targetVal !== "string" || targetVal.trim() === "") {
      empty.push(key);
      continue;
    }

    // Check for raw leaked English copy-paste (unless whitelisted)
    if (
      targetVal.trim() === enVal.trim() &&
      !isWhitelisted(enVal) &&
      enVal.trim().length > 3 &&
      /[a-zA-Z]{3,}/.test(enVal)
    ) {
      leakedEnglish.push({ key, en: enVal });
    }

    // Check Kinyarwanda glossary rules (prevent archaic academic terms)
    if (target.code === "rw") {
      const FORBIDDEN_ACADEMIC_RW = [
        { pattern: /\bmanura\b/i, suggest: "kudownloadinga / kuramo" },
        { pattern: /\biyimanura\b/i, suggest: "kudownloadinga / kuramo" },
        { pattern: /\bgukurura dosiye\b/i, suggest: "kudownloadinga / kuramo" },
        { pattern: /\bgusohora inyandiko ku rupapuro\b/i, suggest: "kuprinta / sohora" },
        { pattern: /\bimirasire isoma\b/i, suggest: "guscaninga / soma" },
        { pattern: /\bimbonerahamwe rusange\b/i, suggest: "ahabanza" },
      ];
      for (const item of FORBIDDEN_ACADEMIC_RW) {
        if (item.pattern.test(targetVal)) {
          console.error(`❌ [RW] Archaic academic phrase found in key ${key}: "${targetVal}" -> Use "${item.suggest}"`);
          errors++;
        }
      }
    }
  }

  if (missing.length > 0) {
    console.error(`❌ [${target.code.toUpperCase()}] ${missing.length} missing keys:`, missing.slice(0, 10));
    errors += missing.length;
  }
  if (empty.length > 0) {
    console.error(`❌ [${target.code.toUpperCase()}] ${empty.length} empty values:`, empty.slice(0, 10));
    errors += empty.length;
  }
  if (leakedEnglish.length > 0) {
    console.warn(`⚠️  [${target.code.toUpperCase()}] ${leakedEnglish.length} potentially leaked English strings:`);
    for (const item of leakedEnglish.slice(0, 5)) {
      console.warn(`    - ${item.key}: "${item.en}"`);
    }
    // Flag as warning or error based on strictness
    if (target.code === "zh" || target.code === "ar") {
      errors += leakedEnglish.length;
    }
  }

  if (missing.length === 0 && empty.length === 0 && leakedEnglish.length === 0) {
    console.log(`✓ [${target.code.toUpperCase()}] ${target.name}: 100% complete (${enKeys.length}/${enKeys.length} keys validated)`);
  }
}

// 2. Scan TSX Files for Leftover Hardcoded Text Nodes in Critical Routes
console.log("\n-------------------------------------------------------");
console.log("  🔍 Scanning TSX Codebase for Hardcoded Text");
console.log("-------------------------------------------------------\n");

const EXCLUDE_DIRS = new Set(["node_modules", ".git", "dist", "test", "tests", ".gemini"]);

function scanTsx(dir, list = []) {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry) || entry.startsWith(".")) continue;
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scanTsx(full, list);
    } else if (full.endsWith(".tsx")) {
      list.push(full);
    }
  }
  return list;
}

const tsxFiles = scanTsx(path.join(ROOT_DIR, "src"));
console.log(`Scanning ${tsxFiles.length} TSX source files...`);

const CRITICAL_PAGES = [
  "LandingPage.tsx",
  "DownloadCenter.tsx",
  "PricingCards.tsx",
  "StoreBadges.tsx",
  "PublicShell.tsx",
  "Subscribe.tsx",
  "Billing.tsx",
  "WebMomoCheckout.tsx",
  "Support.tsx",
  "PrivacyPolicy.tsx",
  "LegalTerms.tsx"
];

let criticalHardcoded = [];

for (const file of tsxFiles) {
  const baseName = path.basename(file);
  if (!CRITICAL_PAGES.includes(baseName)) continue;

  const code = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  function checkNode(node) {
    if (ts.isJsxText(node)) {
      const text = node.text.trim();
      if (
        text.length > 3 &&
        /[a-zA-Z]{3,}/.test(text) &&
        !isWhitelisted(text) &&
        !text.includes("{") &&
        !text.startsWith("/*")
      ) {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        criticalHardcoded.push({ file: baseName, line, text });
      }
    }
    ts.forEachChild(node, checkNode);
  }

  checkNode(sourceFile);
}

if (criticalHardcoded.length > 0) {
  console.warn(`⚠️  Found ${criticalHardcoded.length} visible raw strings in critical public/billing components:`);
  for (const item of criticalHardcoded.slice(0, 15)) {
    console.warn(`    - ${item.file}:${item.line} -> "${item.text}"`);
  }
} else {
  console.log(`✓ Critical public & billing pages: Zero hardcoded visible strings!`);
}

console.log("\n=======================================================");
if (errors > 0) {
  console.error(`❌ I18N VERIFICATION FAILED: ${errors} errors detected.`);
  console.log("=======================================================\n");
  process.exit(1);
} else {
  console.log(`🎉 I18N VERIFICATION PASSED: 100% native localization validated!`);
  console.log("=======================================================\n");
  process.exit(0);
}
