import { describe, expect, it } from "vitest";
import {
  suggestColumnMapping,
  validateMappedRows,
  inventoryCsvTemplate,
  commitInventoryImport,
} from "@/lib/inventoryImport";
import { normalizeUnit } from "@/lib/inventoryUnits";
import type { InventoryItem } from "@/db/types";

const emptyExisting: InventoryItem[] = [];

describe("inventory import", () => {
  it("suggests column mapping for English and Kinyarwanda headers", () => {
    const mapping = suggestColumnMapping([
      "Product Name",
      "SKU",
      "Selling Price",
      "Quantity",
      "Unit",
      "Icyiciro",
    ]);
    expect(mapping["Product Name"]).toBe("item_name");
    expect(mapping.SKU).toBe("sku");
    expect(mapping["Selling Price"]).toBe("selling_price");
    expect(mapping.Quantity).toBe("quantity");
    expect(mapping.Unit).toBe("unit");
    expect(mapping.Icyiciro).toBe("category");
  });

  it("normalizes retail units across verticals", () => {
    expect(normalizeUnit("kg")).toBe("kg");
    expect(normalizeUnit("Litres")).toBe("litre");
    expect(normalizeUnit("boxes")).toBe("box");
    expect(normalizeUnit("pcs")).toBe("pcs");
  });

  it("validates hardware / paint / grocery sample rows", () => {
    const headers = [
      "Product Name",
      "SKU",
      "Category",
      "Unit",
      "Purchase Price",
      "Selling Price",
      "Quantity",
    ];
    const mapping = suggestColumnMapping(headers);
    const rows = [
      {
        "Product Name": "Cement 50kg",
        SKU: "CEM-50",
        Category: "Building",
        Unit: "bag",
        "Purchase Price": "9000",
        "Selling Price": "11000",
        Quantity: "40",
      },
      {
        "Product Name": "Paint white 4L",
        SKU: "PNT-W4",
        Category: "Paint",
        Unit: "litre",
        "Purchase Price": "12000",
        "Selling Price": "15000",
        Quantity: "20",
      },
      {
        "Product Name": "Cooking oil 1L",
        SKU: "OIL-1L",
        Category: "Grocery",
        Unit: "bottle",
        "Purchase Price": "2500",
        "Selling Price": "3000",
        Quantity: "60",
      },
      {
        "Product Name": "",
        SKU: "",
        Category: "",
        Unit: "",
        "Purchase Price": "",
        "Selling Price": "",
        Quantity: "",
      },
    ];
    const validated = validateMappedRows(rows, mapping, emptyExisting, "skip");
    expect(validated.filter((r) => r.action === "create")).toHaveLength(3);
    expect(validated.some((r) => r.action === "skip")).toBe(true);
    expect(validated[0].data.unit).toBe("bag");
    expect(validated[1].data.category).toBe("Paint");
  });

  it("detects duplicates and respects skip mode", () => {
    const existing: InventoryItem[] = [
      {
        id: "1",
        item_name: "Cement 50kg",
        quantity: 10,
        selling_price: 10000,
        cost_price: 8000,
        date_bought: "2026-01-01",
        notes: null,
        sku: "CEM-50",
        created_at: "",
        updated_at: "",
      },
    ];
    const mapping = suggestColumnMapping([
      "Product Name",
      "SKU",
      "Selling Price",
      "Quantity",
      "Purchase Price",
    ]);
    const validated = validateMappedRows(
      [
        {
          "Product Name": "Cement 50kg",
          SKU: "CEM-50",
          "Selling Price": "11000",
          Quantity: "5",
          "Purchase Price": "9000",
        },
      ],
      mapping,
      existing,
      "skip"
    );
    expect(validated[0].action).toBe("skip");
    expect(validated[0].match?.id).toBe("1");
  });

  it("commits creates in batches without inventing prices", async () => {
    const mapping = suggestColumnMapping([
      "Product Name",
      "Selling Price",
      "Purchase Price",
      "Quantity",
    ]);
    const validated = validateMappedRows(
      [
        {
          "Product Name": "Nails 3 inch",
          "Selling Price": "500",
          "Purchase Price": "300",
          Quantity: "100",
        },
      ],
      mapping,
      emptyExisting,
      "skip"
    );
    const created: unknown[] = [];
    const result = await commitInventoryImport(validated, {
      create: async (input) => {
        created.push(input);
      },
      update: async () => {},
    });
    expect(result.created).toBe(1);
    expect(created[0]).toMatchObject({
      item_name: "Nails 3 inch",
      selling_price: 500,
      cost_price: 300,
      quantity: 100,
    });
  });

  it("ships a usable CSV template", () => {
    const csv = inventoryCsvTemplate();
    expect(csv).toContain("Product Name");
    expect(csv).toContain("Cement");
    expect(csv).toContain("Paint");
  });
});
