import ExcelJS from "exceljs";
import path from "path";
import { allModules, terminologyGlossary } from "./catalog-data.mjs";

async function generateMasterExcelCatalogue() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Antigravity Localization QA Engine";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.properties.date1904 = true;

  // Header styles
  const headerFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0B3FCC" }, // Sella Brand Blue
  };

  const headerFont = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };

  const headerBorder = {
    top: { style: "thin", color: { argb: "FF072780" } },
    left: { style: "thin", color: { argb: "FF072780" } },
    bottom: { style: "medium", color: { argb: "FF072780" } },
    right: { style: "thin", color: { argb: "FF072780" } },
  };

  const userColumnFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFEF9C3" }, // Soft inviting yellow tint for user input
  };

  const thinBorder = {
    top: { style: "thin", color: { argb: "FFE2E8F0" } },
    left: { style: "thin", color: { argb: "FFE2E8F0" } },
    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
    right: { style: "thin", color: { argb: "FFE2E8F0" } },
  };

  // 1. Terminology Glossary Sheet
  const glossarySheet = workbook.addWorksheet("Terminology Glossary", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });

  glossarySheet.columns = [
    { header: "English Business Concept", key: "termEn", width: 28 },
    { header: "Current Sella Term", key: "termRwCurrent", width: 32 },
    { header: "Recommended Standard Term", key: "termRwSuggested", width: 34 },
    { header: "Context in Rwandan Commerce", key: "context", width: 44 },
    { header: "Status", key: "status", width: 22 },
    { header: "Linguistic & Retail Analysis", key: "notes", width: 50 },
  ];

  glossarySheet.getRow(1).height = 28;
  glossarySheet.getRow(1).eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.border = headerBorder;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });

  glossarySheet.autoFilter = "A1:F1";

  terminologyGlossary.forEach((item, idx) => {
    const row = glossarySheet.addRow({
      termEn: item.termEn,
      termRwCurrent: item.termRwCurrent,
      termRwSuggested: item.termRwSuggested,
      context: item.context,
      status: item.status,
      notes: item.notes,
    });
    row.height = 36;
    row.eachCell((cell, colNumber) => {
      cell.border = thinBorder;
      cell.alignment = { vertical: "middle", wrapText: true };
      if (colNumber === 5) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
        if (item.status === "Correct") {
          cell.font = { bold: true, color: { argb: "FF166534" } };
        } else if (item.status === "Needs correction") {
          cell.font = { bold: true, color: { argb: "FFC2410C" } };
        } else if (item.status === "Inconsistent terminology") {
          cell.font = { bold: true, color: { argb: "FF7C3AED" } };
        }
      }
    });
  });

  // 2. Module Sheets
  for (const mod of allModules) {
    const sanitizedSheetName = mod.name.replace(/[\/\*\?:\\\[\]]/g, "&").slice(0, 31);
    const sheet = workbook.addWorksheet(sanitizedSheetName, {
      views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
    });

    sheet.columns = [
      { header: "ID", key: "id", width: 14 },
      { header: "Module / Page", key: "module", width: 28 },
      { header: "UI Element", key: "element", width: 26 },
      { header: "English Text", key: "en", width: 42 },
      { header: "Current Kinyarwanda", key: "rwCurrent", width: 42 },
      { header: "Suggested Kinyarwanda", key: "rwSuggested", width: 42 },
      { header: "My Final Kinyarwanda Translation", key: "rwFinal", width: 44 },
      { header: "Status", key: "status", width: 22 },
    ];

    sheet.getRow(1).height = 30;
    sheet.getRow(1).eachCell((cell, colNumber) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.border = headerBorder;
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      if (colNumber === 7) {
        // Highlight the user column header
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0E3696" },
        };
      }
    });

    sheet.autoFilter = "A1:H1";

    mod.catalog.forEach((item) => {
      const row = sheet.addRow({
        id: item.id,
        module: item.module,
        element: item.element,
        en: item.en,
        rwCurrent: item.rwCurrent,
        rwSuggested: item.rwSuggested,
        rwFinal: "", // STRICTLY EMPTY STRING FOR USER ENTRY
        status: item.status,
      });

      row.height = 34;

      row.eachCell((cell, colNumber) => {
        cell.border = thinBorder;
        cell.alignment = { vertical: "middle", wrapText: true };

        if (colNumber === 1) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.font = { bold: true, color: { argb: "FF0F172A" } };
        } else if (colNumber === 7) {
          // Column 7: My Final Kinyarwanda Translation
          cell.fill = userColumnFill;
          cell.border = {
            top: { style: "thin", color: { argb: "FFEAB308" } },
            left: { style: "thin", color: { argb: "FFEAB308" } },
            bottom: { style: "thin", color: { argb: "FFEAB308" } },
            right: { style: "thin", color: { argb: "FFEAB308" } },
          };
        } else if (colNumber === 8) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
          if (item.status === "Correct") {
            cell.font = { bold: true, color: { argb: "FF166534" } };
          } else if (item.status === "Needs correction") {
            cell.font = { bold: true, color: { argb: "FFC2410C" } };
          } else if (item.status === "Inconsistent terminology") {
            cell.font = { bold: true, color: { argb: "FF7C3AED" } };
          } else if (item.status === "Missing translation") {
            cell.font = { bold: true, color: { argb: "FFDC2626" } };
          } else if (item.status === "Source-only / Not visually verified") {
            cell.font = { bold: true, color: { argb: "FF64748B" } };
          }
        }
      });
    });
  }

  const outputPath = path.resolve(process.cwd(), "sella_master_translation_catalogue.xlsx");
  await workbook.xlsx.writeFile(outputPath);
  console.log(`[EXCEL READY] Master Translation Catalogue written to: ${outputPath}`);
}

generateMasterExcelCatalogue().catch(console.error);
