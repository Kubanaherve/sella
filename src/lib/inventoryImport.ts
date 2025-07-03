import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { InventoryItem, InventoryWriteInput } from "@/db/types";
import { normalizeUnit } from "@/lib/inventoryUnits";
import { toRwf } from "@/lib/money";

export type InventoryFieldKey =
  | "item_name"
  | "sku"
  | "barcode"
  | "category"
  | "description"
  | "brand"
  | "unit"
  | "cost_price"
  | "selling_price"
  | "quantity"
  | "min_quantity"
  | "supplier"
  | "skip";

export const IMPORT_FIELDS: Array<{
  key: InventoryFieldKey;
  required?: boolean;
  labelRw: string;
  labelEn: string;
}> = [
  { key: "item_name", required: true, labelRw: "Izina", labelEn: "Product name" },
  { key: "sku", labelRw: "SKU", labelEn: "SKU" },
  { key: "barcode", labelRw: "Barcode", labelEn: "Barcode" },
  { key: "category", labelRw: "Icyiciro", labelEn: "Category" },
  { key: "description", labelRw: "Ibisobanuro", labelEn: "Description" },
  { key: "brand", labelRw: "Ikiran", labelEn: "Brand" },
  { key: "unit", labelRw: "Igipimo", labelEn: "Unit" },
  { key: "cost_price", labelRw: "Igiciro cyo kugura", labelEn: "Purchase price" },
  { key: "selling_price", labelRw: "Igiciro cyo kugurisha", labelEn: "Selling price" },
  { key: "quantity", labelRw: "Umubare", labelEn: "Stock qty" },
  { key: "min_quantity", labelRw: "Umubare muto", labelEn: "Min stock" },
  { key: "supplier", labelRw: "Uwatanze", labelEn: "Supplier" },
  { key: "skip", labelRw: "Kuraho (skip)", labelEn: "Ignore column" },
];

export type ColumnMapping = Record<string, InventoryFieldKey>;

export type ParsedSheet = {
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
  suggestedMapping: ColumnMapping;
};

export type ValidatedImportRow = {
  rowIndex: number;
  raw: Record<string, string>;
  data: InventoryWriteInput;
  warnings: string[];
  errors: string[];
  match?: InventoryItem | null;
  action: "create" | "update" | "skip" | "error";
};

export type DuplicateMode = "skip" | "update" | "create_anyway";

const HEADER_ALIASES: Record<string, InventoryFieldKey> = {
  name: "item_name",
  product: "item_name",
  product_name: "item_name",
  item: "item_name",
  item_name: "item_name",
  izina: "item_name",
  igicuruzwa: "item_name",
  sku: "sku",
  code: "sku",
  kode: "sku",
  barcode: "barcode",
  bar_code: "barcode",
  ean: "barcode",
  category: "category",
  icyiciro: "category",
  cat: "category",
  description: "description",
  desc: "description",
  brand: "brand",
  marque: "brand",
  unit: "unit",
  uom: "unit",
  igipimo: "unit",
  cost: "cost_price",
  cost_price: "cost_price",
  purchase: "cost_price",
  purchase_price: "cost_price",
  buy: "cost_price",
  buying_price: "cost_price",
  igiciro_cyo_kugura: "cost_price",
  sell: "selling_price",
  selling: "selling_price",
  selling_price: "selling_price",
  price: "selling_price",
  sale_price: "selling_price",
  igiciro: "selling_price",
  qty: "quantity",
  quantity: "quantity",
  stock: "quantity",
  umubare: "quantity",
  min: "min_quantity",
  min_qty: "min_quantity",
  min_quantity: "min_quantity",
  reorder: "min_quantity",
  supplier: "supplier",
  vendor: "supplier",
};

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, "_")
    .replace(/[^\w]/g, "");
}

export function suggestColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<InventoryFieldKey>();
  for (const header of headers) {
    const key = HEADER_ALIASES[normalizeHeader(header)];
    if (key && key !== "skip" && !used.has(key)) {
      mapping[header] = key;
      used.add(key);
    } else {
      mapping[header] = "skip";
    }
  }
  return mapping;
}

function cellString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return String(v).trim();
}

function parseMoney(raw: string): number | null {
  if (!raw.trim()) return null;
  const cleaned = raw.replace(/[^\d.,\-]/g, "").replace(/,/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return toRwf(n);
}

function parseQty(raw: string): number | null {
  if (!raw.trim()) return null;
  const cleaned = raw.replace(/,/g, "").replace(/[^\d.\-]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return n;
}

export async function parseInventoryFile(file: File): Promise<ParsedSheet> {
  const name = file.name || "import";
  const lower = name.toLowerCase();

  if (lower.endsWith(".csv") || file.type.includes("csv") || file.type.includes("text")) {
    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
    });
    if (parsed.errors.length && !parsed.data.length) {
      throw new Error(parsed.errors[0]?.message || "CSV parse failed");
    }
    const headers =
      parsed.meta.fields?.filter(Boolean) ||
      Object.keys(parsed.data[0] || {});
    const rows = parsed.data.map((row) => {
      const out: Record<string, string> = {};
      for (const h of headers) out[h] = cellString(row[h]);
      return out;
    });
    return {
      fileName: name,
      headers,
      rows,
      suggestedMapping: suggestColumnMapping(headers),
    };
  }

  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) throw new Error("Excel file has no sheets");
    const sheet = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });
    const headers = Object.keys(json[0] || {});
    if (!headers.length) throw new Error("Excel sheet is empty");
    const rows = json.map((row) => {
      const out: Record<string, string> = {};
      for (const h of headers) out[h] = cellString(row[h]);
      return out;
    });
    return {
      fileName: name,
      headers,
      rows,
      suggestedMapping: suggestColumnMapping(headers),
    };
  }

  throw new Error("Use a CSV or Excel (.xlsx) file");
}

export function mapRowToInput(
  raw: Record<string, string>,
  mapping: ColumnMapping
): Partial<InventoryWriteInput> & { _blank?: boolean } {
  const get = (field: InventoryFieldKey): string => {
    for (const [col, key] of Object.entries(mapping)) {
      if (key === field) return raw[col] || "";
    }
    return "";
  };
  const item_name = get("item_name").trim();
  const allEmpty = Object.values(raw).every((v) => !String(v || "").trim());
  return {
    _blank: allEmpty,
    item_name,
    sku: get("sku").trim() || null,
    barcode: get("barcode").trim() || null,
    category: get("category").trim() || null,
    description: get("description").trim() || null,
    brand: get("brand").trim() || null,
    unit: normalizeUnit(get("unit") || "pcs"),
    cost_price: parseMoney(get("cost_price")) ?? undefined,
    selling_price: parseMoney(get("selling_price")) ?? undefined,
    quantity: parseQty(get("quantity")) ?? undefined,
    min_quantity: parseQty(get("min_quantity")) ?? null,
    supplier: get("supplier").trim() || null,
  };
}

export function validateMappedRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  existing: InventoryItem[],
  duplicateMode: DuplicateMode
): ValidatedImportRow[] {
  const hasName = Object.values(mapping).includes("item_name");
  const seenKeys = new Set<string>();
  const bySku = new Map(
    existing
      .filter((i) => i.sku)
      .map((i) => [i.sku!.trim().toLowerCase(), i] as const)
  );
  const byBarcode = new Map(
    existing
      .filter((i) => i.barcode)
      .map((i) => [i.barcode!.trim().toLowerCase(), i] as const)
  );
  const byName = new Map(
    existing.map((i) => [i.item_name.trim().toLowerCase(), i] as const)
  );

  return rows.map((raw, rowIndex) => {
    const mapped = mapRowToInput(raw, mapping);
    const warnings: string[] = [];
    const errors: string[] = [];

    if (mapped._blank) {
      return {
        rowIndex: rowIndex + 2,
        raw,
        data: {
          item_name: "",
          quantity: 0,
          selling_price: 0,
          cost_price: 0,
        },
        warnings,
        errors: ["Empty row"],
        action: "skip" as const,
      };
    }

    if (!hasName) errors.push("Map a Product name column");
    if (!mapped.item_name) errors.push("Product name is required");

    const selling = mapped.selling_price;
    const cost = mapped.cost_price;
    const qty = mapped.quantity;

    if (selling == null) errors.push("Selling price is required");
    else if (selling < 0) errors.push("Selling price cannot be negative");

    if (cost == null) {
      warnings.push("Purchase price missing — using 0");
    } else if (cost < 0) errors.push("Purchase price cannot be negative");

    if (qty == null) {
      warnings.push("Quantity missing — using 0");
    } else if (qty < 0) errors.push("Quantity cannot be negative");

    if (
      selling != null &&
      cost != null &&
      selling > 0 &&
      cost > selling
    ) {
      warnings.push("Purchase price is higher than selling price");
    }

    const data: InventoryWriteInput = {
      item_name: mapped.item_name || "",
      quantity: qty ?? 0,
      selling_price: selling ?? 0,
      cost_price: cost ?? 0,
      sku: mapped.sku,
      barcode: mapped.barcode,
      category: mapped.category,
      description: mapped.description,
      brand: mapped.brand,
      unit: mapped.unit || "pcs",
      supplier: mapped.supplier,
      min_quantity: mapped.min_quantity ?? 0,
    };

    const dupKey = [
      data.sku?.toLowerCase() || "",
      data.barcode?.toLowerCase() || "",
      data.item_name.toLowerCase(),
    ].join("|");
    if (seenKeys.has(dupKey) && data.item_name) {
      warnings.push("Duplicate row in this file");
    }
    seenKeys.add(dupKey);

    let match: InventoryItem | null = null;
    if (data.sku && bySku.has(data.sku.toLowerCase())) {
      match = bySku.get(data.sku.toLowerCase()) || null;
    } else if (data.barcode && byBarcode.has(data.barcode.toLowerCase())) {
      match = byBarcode.get(data.barcode.toLowerCase()) || null;
    } else if (data.item_name && byName.has(data.item_name.toLowerCase())) {
      match = byName.get(data.item_name.toLowerCase()) || null;
    }

    let action: ValidatedImportRow["action"] = "create";
    if (errors.length) action = "error";
    else if (match) {
      if (duplicateMode === "skip") action = "skip";
      else if (duplicateMode === "update") action = "update";
      else action = "create";
    }

    return {
      rowIndex: rowIndex + 2,
      raw,
      data,
      warnings,
      errors,
      match,
      action,
    };
  });
}

export type ImportCommitResult = {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
};

export async function commitInventoryImport(
  rows: ValidatedImportRow[],
  handlers: {
    create: (input: InventoryWriteInput) => Promise<unknown>;
    update: (id: string, patch: InventoryWriteInput) => Promise<unknown>;
    shouldCancel?: () => boolean;
    onProgress?: (done: number, total: number) => void;
  }
): Promise<ImportCommitResult> {
  const result: ImportCommitResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };
  const actionable = rows.filter((r) => r.action !== "error");
  let done = 0;
  for (const row of actionable) {
    if (handlers.shouldCancel?.()) break;
    try {
      if (row.action === "skip") {
        result.skipped += 1;
      } else if (row.action === "update" && row.match) {
        await handlers.update(row.match.id, row.data);
        result.updated += 1;
      } else if (row.action === "create") {
        await handlers.create(row.data);
        result.created += 1;
      } else {
        result.skipped += 1;
      }
    } catch (err) {
      result.failed += 1;
      result.errors.push({
        row: row.rowIndex,
        message: err instanceof Error ? err.message : "Import failed",
      });
    }
    done += 1;
    handlers.onProgress?.(done, actionable.length);
  }
  return result;
}

/** Downloadable CSV template for shop owners. */
export function inventoryCsvTemplate(): string {
  return [
    "Product Name,SKU,Barcode,Category,Brand,Unit,Purchase Price,Selling Price,Quantity,Min Stock,Supplier,Description",
    "Cement 50kg,CEM-50,,Building,Simba,bag,9000,11000,40,5,Local depot,Portland cement",
    "Paint white 4L,PNT-W4,,Paint,Crown,litre,12000,15000,20,3,Crown Rwanda,Interior emulsion",
    "Cooking oil 1L,OIL-1L,,Grocery,,bottle,2500,3000,60,10,,",
  ].join("\n");
}
