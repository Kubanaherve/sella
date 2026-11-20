/**
 * Universal Rwandan Business Categories for Sella Marketplace.
 * Supports all 20 officially identified trader types in Rwanda with
 * specialized units, variation templates, and bilingual metadata.
 */

export interface BusinessCategory {
  id: string;
  code: string;
  nameRw: string;
  nameEn: string;
  descriptionRw: string;
  descriptionEn: string;
  icon: string;
  defaultUnits: string[];
  suggestedTags: string[];
  typicalVariations: Array<{
    name: string;
    nameRw: string;
    options: string[];
  }>;
  hasSpecifications?: boolean;
  hasWarranty?: boolean;
  hasExpiryDate?: boolean;
  hasDimensions?: boolean;
}

export const RWANDAN_BUSINESS_CATEGORIES: BusinessCategory[] = [
  {
    id: "clothing_fashion",
    code: "CLOTH",
    nameRw: "Imyenda n'Imidero",
    nameEn: "Clothing & Fashion",
    descriptionRw: "Amaduka y'imyenda y'abagabo, abagore, abana, n'imidero inyuranye.",
    descriptionEn: "Men's, women's, and children's apparel, boutique wear, and fashion accessories.",
    icon: "Shirt",
    defaultUnits: ["pcs", "set", "box"],
    suggestedTags: ["Imyenda", "Amakanzu", "Amakote", "Amashati", "Amakabutura"],
    typicalVariations: [
      {
        name: "Size",
        nameRw: "Ingano",
        options: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
      },
      {
        name: "Color",
        nameRw: "Ibara",
        options: ["Umukara (Black)", "Umweru (White)", "Ubururu (Blue)", "Umutuku (Red)", "Icyatsi (Green)"],
      },
    ],
  },
  {
    id: "shoes_footwear",
    code: "SHOES",
    nameRw: "Inkweto n'Ibikoresho byazo",
    nameEn: "Shoes & Footwear",
    descriptionRw: "Inkweto z'akazi, siporo, abana, abagore n'abagabo hamwe n'amasogisi n'imikandara.",
    descriptionEn: "Footwear for formal wear, sports, casual, children, plus socks, belts, and shoe care.",
    icon: "Footprints",
    defaultUnits: ["pair", "pcs", "box"],
    suggestedTags: ["Inkweto", "Sandali", "Boti", "Sneakers", "Imikandara"],
    typicalVariations: [
      {
        name: "Shoe Size (EU)",
        nameRw: "Ingano y'Inkweto",
        options: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
      },
      {
        name: "Color",
        nameRw: "Ibara",
        options: ["Umukara (Black)", "Igitaka (Brown)", "Umweru (White)", "Ubururu (Navy)"],
      },
    ],
  },
  {
    id: "electronics_accessories",
    code: "ELEC",
    nameRw: "Ibyuma by'Ikoranabuhanga & Accessories",
    nameEn: "Electronics & Accessories",
    descriptionRw: "Telefone, mudasobwa, televiziyo, ecouteurs, chargeurs, n'ibindi byuma by'amashanyarazi.",
    descriptionEn: "Smartphones, laptops, TVs, audio headphones, chargers, cables, and electronic gadgets.",
    icon: "Smartphone",
    defaultUnits: ["pcs", "set", "box"],
    suggestedTags: ["Telefone", "Laptop", "Chargeur", "Ecouteur", "Screen Guard"],
    typicalVariations: [
      {
        name: "Storage / RAM",
        nameRw: "Ububiko",
        options: ["64GB / 4GB", "128GB / 6GB", "256GB / 8GB", "512GB / 16GB", "1TB"],
      },
      {
        name: "Warranty",
        nameRw: "Garanti",
        options: ["Ukwezi 1 (1 Month)", "Amezi 6 (6 Months)", "Umwaka 1 (1 Year)", "Imyaka 2 (2 Years)"],
      },
    ],
    hasSpecifications: true,
    hasWarranty: true,
  },
  {
    id: "grocery_supermarket",
    code: "GROC",
    nameRw: "Alimentation / Ibiribwa & Ibikoresho",
    nameEn: "Grocery Stores",
    descriptionRw: "Umuceri, amavuta yo guteka, ifu, isukari, ibinyobwa, amasabune n'ibiribwa bya buri munsi.",
    descriptionEn: "Rice, cooking oil, flour, sugar, beverages, soaps, toiletries, and daily provisions.",
    icon: "ShoppingBag",
    defaultUnits: ["kg", "g", "litre", "pcs", "box", "bag", "bottle"],
    suggestedTags: ["Umuceri", "Amavuta", "Isukari", "Ifu", "Ibinyobwa"],
    typicalVariations: [
      {
        name: "Weight / Packaging",
        nameRw: "Uburemere / Ipaki",
        options: ["250g", "500g", "1kg", "2kg", "5kg", "25kg", "50kg"],
      },
    ],
    hasExpiryDate: true,
  },
  {
    id: "supermarkets",
    code: "SUPER",
    nameRw: "Supermarishe (Supermarkets)",
    nameEn: "Supermarkets",
    descriptionRw: "Amaduka manini acuruza ibicuruzwa by'ingeri zose ku giciro cy'icyiciro cyo hejuru.",
    descriptionEn: "Large retail stores offering a wide variety of food, beverages, and household products.",
    icon: "Store",
    defaultUnits: ["pcs", "kg", "litre", "box", "pack"],
    suggestedTags: ["Supermarket", "Groceries", "Household", "Snacks", "Drinks"],
    typicalVariations: [],
    hasExpiryDate: true,
  },
  {
    id: "minimarkets",
    code: "MINI",
    nameRw: "Minimarishe (Mini-Markets)",
    nameEn: "Mini-Markets",
    descriptionRw: "Amaduka yegereye abaturage acuruza ibiribwa n'ibikoresho by'ibanze byo mu rugo.",
    descriptionEn: "Neighborhood convenience stores providing quick access to essential food and home supplies.",
    icon: "ShoppingBasket",
    defaultUnits: ["pcs", "kg", "litre", "bottle", "pack"],
    suggestedTags: ["Minimarket", "Ibiribwa", "Amata", "Umugati", "Ibinyobwa"],
    typicalVariations: [],
    hasExpiryDate: true,
  },
  {
    id: "hardware_quincaillerie",
    code: "HARD",
    nameRw: "Quincaillerie (Ibyuma & Ibikoresho)",
    nameEn: "Hardware Stores (Quincailleries)",
    descriptionRw: "Ibyuma, imisumari, amarangi, imigozi, imikasi, sima, n'ibikoresho byo gusana.",
    descriptionEn: "Hardware tools, nails, paint, locks, pipes, plumbing, electrical fittings, and repairs.",
    icon: "Wrench",
    defaultUnits: ["pcs", "kg", "metre", "box", "roll", "can"],
    suggestedTags: ["Amarangi", "Imisumari", "Ingufuri", "Ibitembo", "Umutsinga"],
    typicalVariations: [
      {
        name: "Size / Diameter",
        nameRw: "Ingano / Ubugari",
        options: ["1/2 inch", "3/4 inch", "1 inch", "2 inch", "4 inch"],
      },
      {
        name: "Color / Finish",
        nameRw: "Ibara ry'Irangi",
        options: ["Umweru (White)", "Cream", "Grey", "Blue", "Green"],
      },
    ],
    hasDimensions: true,
  },
  {
    id: "construction_materials",
    code: "CONST",
    nameRw: "Ibikoresho by'Ubwubatsi Buhambaye",
    nameEn: "Construction Material Suppliers",
    descriptionRw: "Sima (Ciment), fer a beton, amabuye, umusenyi, amatafari, amategura n'amabati.",
    descriptionEn: "Cement bags, steel rebars, sand, gravel, bricks, roofing sheets, and structural supplies.",
    icon: "Hammer",
    defaultUnits: ["bag", "tonne", "pcs", "kg", "sqm"],
    suggestedTags: ["Ciment", "Fer a Beton", "Amabati", "Amatafari", "Umusenyi"],
    typicalVariations: [
      {
        name: "Rebar Diameter",
        nameRw: "Ubugari bwa Fer (mm)",
        options: ["8mm", "10mm", "12mm", "14mm", "16mm", "20mm"],
      },
      {
        name: "Roofing Gauge / Color",
        nameRw: "Ubwoko bw'Ibati",
        options: ["BG 28 (Umutuku)", "BG 28 (Icyatsi)", "BG 30", "Versatile Tile"],
      },
    ],
    hasDimensions: true,
  },
  {
    id: "pharmacy_health",
    code: "PHARM",
    nameRw: "Farumasi n'Ubuvuzi",
    nameEn: "Pharmacies & Health Stores",
    descriptionRw: "Imiti yemewe n'amategeko, ibikoresho by'ubuvuzi, vitamine, n'isuku y'umubiri.",
    descriptionEn: "Licensed pharmaceuticals, over-the-counter medicines, first aid, vitamins, and clinical items.",
    icon: "HeartPulse",
    defaultUnits: ["pcs", "box", "bottle", "pack"],
    suggestedTags: ["Imiti", "Panadol", "Vitamins", "Bandage", "Antiseptic"],
    typicalVariations: [
      {
        name: "Dosage / Strength",
        nameRw: "Ingano y'Umuti",
        options: ["250mg", "500mg", "1000mg", "100ml", "200ml"],
      },
    ],
    hasExpiryDate: true,
  },
  {
    id: "beauty_cosmetics",
    code: "BEAUTY",
    nameRw: "Ubwiza n'Amavuta (Beauty & Cosmetics)",
    nameEn: "Beauty & Cosmetics Shops",
    descriptionRw: "Amavuta yo kwisiga, imibavu, ibirungo by'amaso, amavuta y'imisatsi, n'ibikoresho by'isuku.",
    descriptionEn: "Skincare lotions, perfumes, makeup, haircare creams, soaps, and beauty parlor products.",
    icon: "Sparkles",
    defaultUnits: ["pcs", "bottle", "box", "set"],
    suggestedTags: ["Amavuta", "Parfum", "Shampoo", "Makeup", "Lotion"],
    typicalVariations: [
      {
        name: "Volume / Size",
        nameRw: "Ingano y'Icupa",
        options: ["50ml", "100ml", "250ml", "400ml", "500ml"],
      },
      {
        name: "Shade / Tone",
        nameRw: "Ibara ry'Ibirungo",
        options: ["Warm Sand", "Espresso", "Honey", "Golden Brown", "Caramel"],
      },
    ],
    hasExpiryDate: true,
  },
  {
    id: "restaurant_food",
    code: "FOOD",
    nameRw: "Amafunguro & Resitora (Food & Restaurants)",
    nameEn: "Restaurants & Food Businesses",
    descriptionRw: "Amafunguro ateguye, amapaki y'ibiribwa, ibinyobwa bikonje, amasupu na keke.",
    descriptionEn: "Prepared meals, lunch packs, bakery items, snacks, fresh coffee, and takeaway dishes.",
    icon: "Utensils",
    defaultUnits: ["portion", "pack", "pcs", "bottle"],
    suggestedTags: ["Ifunguro", "Ibiryo", "Keke", "Takeaway", "Ikinyobwa"],
    typicalVariations: [
      {
        name: "Portion Size",
        nameRw: "Ingano y'Ifunguro",
        options: ["Small (Nto)", "Medium (Iringaniye)", "Large (Nini)", "Family Pack"],
      },
    ],
  },
  {
    id: "agriculture_produce",
    code: "AGRI",
    nameRw: "Umusaruro w'Ubuhinzi n'Ubworozi",
    nameEn: "Agricultural Product Sellers",
    descriptionRw: "Ibigori, ibishyimbo, ibirayi, amata, amagi, imbuto, imboga n'ifumbire.",
    descriptionEn: "Maize, beans, Irish potatoes, fresh milk, eggs, fruits, vegetables, seeds, and fertilizer.",
    icon: "Wheat",
    defaultUnits: ["kg", "bag", "tonne", "litre", "bundle"],
    suggestedTags: ["Ibishyimbo", "Ibigori", "Ibirayi", "Amata", "Amagi"],
    typicalVariations: [
      {
        name: "Grade / Quality",
        nameRw: "Icyiciro cy'Umusaruro",
        options: ["Grade 1 (Rwiyongereye)", "Grade 2 (Bisanzwe)", "Organic"],
      },
    ],
  },
  {
    id: "furniture_decor",
    code: "FURN",
    nameRw: "Amamebure n'Ibikoresho by'Inzu",
    nameEn: "Furniture Stores",
    descriptionRw: "Ibitanda, intebe z'uruganiriro, ameza yo kuriraho, amakabati n'ibirere.",
    descriptionEn: "Sofas, dining sets, wooden beds, wardrobes, office desks, and interior decor.",
    icon: "Armchair",
    defaultUnits: ["pcs", "set"],
    suggestedTags: ["Intebe", "Igitanda", "Ameza", "Ikabati", "Matorasi"],
    typicalVariations: [
      {
        name: "Wood / Material",
        nameRw: "Ubwoko bw'Igiti / Ibikoresho",
        options: ["Libuyu", "Mahogany", "Pine", "Metal", "Fabric / Leather"],
      },
      {
        name: "Bed Dimensions",
        nameRw: "Ingano y'Igitanda",
        options: ["3x6 (Single)", "4x6", "5x6 (Queen)", "6x6 (King)"],
      },
    ],
    hasDimensions: true,
  },
  {
    id: "household_equipment",
    code: "HOUSE",
    nameRw: "Ibikoresho byo mu Rugo (Household)",
    nameEn: "Household Equipment Sellers",
    descriptionRw: "Amasafuriya, amasahani, utuyiko, frigo, gazi zo guteka, n'ibikoresho by'isuku yo mu rugo.",
    descriptionEn: "Cookware pots, dinner plates, gas cookers, blenders, kettles, and house cleaning items.",
    icon: "Home",
    defaultUnits: ["pcs", "set", "box"],
    suggestedTags: ["Amasafuriya", "Gazi", "Kettle", "Amasahani", "Blender"],
    typicalVariations: [
      {
        name: "Capacity / Size",
        nameRw: "Ingano y'Igikoresho",
        options: ["1.5L", "2.0L", "3.0L", "5.0L", "6kg Cylinder", "12kg Cylinder"],
      },
    ],
  },
  {
    id: "stationery_bookstore",
    code: "STAT",
    nameRw: "Papeterie & Ibitabo (Stationery & Books)",
    nameEn: "Stationery & Bookstores",
    descriptionRw: "Amakaye, amakaramu, impapuro za A4, ibitabo by'amashuri, ibikoresho by'ibiro.",
    descriptionEn: "Notebooks, pens, printing paper (A4), school textbooks, staplers, and office supplies.",
    icon: "BookOpen",
    defaultUnits: ["pcs", "box", "pack", "set"],
    suggestedTags: ["Amakaye", "Amakaramu", "A4 Ream", "Ibitabo", "Envelopes"],
    typicalVariations: [
      {
        name: "Pages / Sheets",
        nameRw: "Umubare w'Impapuro",
        options: ["Amakaye 48p", "Amakaye 96p", "Amakaye 120p", "Amakaye 200p", "Ream (Impapuro 500)"],
      },
    ],
  },
  {
    id: "wholesale_trade",
    code: "WHOLE",
    nameRw: "Kuranguza (Wholesale Businesses)",
    nameEn: "Wholesale Businesses",
    descriptionRw: "Ububiko n'amaduka aranguza ibicuruzwa ku bwinshi ku bacuruzi bato.",
    descriptionEn: "Wholesale warehouses selling bulk cartons, pallets, and sacks to retailers.",
    icon: "Boxes",
    defaultUnits: ["box", "bag", "tonne", "pcs", "roll"],
    suggestedTags: ["Kuranguza", "Carton", "Umufuka", "Gross", "Wholesale"],
    typicalVariations: [
      {
        name: "Case Pack Quantity",
        nameRw: "Ingano y'Ikarito",
        options: ["12 pcs/box", "24 pcs/box", "50 pcs/box", "100 pcs/box"],
      },
    ],
  },
  {
    id: "retail_general",
    code: "RETAIL",
    nameRw: "Kudandaza Bisanzwe (Retail Businesses)",
    nameEn: "Retail Businesses",
    descriptionRw: "Amaduka asanzwe adandaza ibicuruzwa bitandukanye ku muguzi w'umunsi.",
    descriptionEn: "Standard retail shops catering to walk-in neighborhood consumer demand.",
    icon: "Store",
    defaultUnits: ["pcs", "kg", "metre", "box", "bottle"],
    suggestedTags: ["Kudandaza", "Ibicuruzwa", "Iduka", "Retail"],
    typicalVariations: [],
  },
  {
    id: "general_merchandise",
    code: "GEN",
    nameRw: "Ubucuruzi Rusange (General Merchandise)",
    nameEn: "General Merchandise Traders",
    descriptionRw: "Ubucuruzi buhuza ibintu byinshi bitandukanye: imyenda, ibikoresho, ibiribwa, n'ibindi.",
    descriptionEn: "Multi-category trade dealing in diverse consumer goods under one roof.",
    icon: "Package",
    defaultUnits: ["pcs", "box", "set", "pack"],
    suggestedTags: ["Rusange", "Binyuranye", "General"],
    typicalVariations: [],
  },
  {
    id: "informal_business",
    code: "INFORMAL",
    nameRw: "Ubucuruzi Buciriritse & Mu Masoko",
    nameEn: "Small & Informal Businesses",
    descriptionRw: "Abacuruzi bo mu masoko (Kimironko, Nyabugogo, n'ahandi), ibibanza bito, n'abikorera ku giti cyabo.",
    descriptionEn: "Market stall traders (Kimironko, Nyabugogo, etc.), small kiosks, and self-employed micro-enterprises.",
    icon: "BadgePercent",
    defaultUnits: ["pcs", "kg", "bundle", "portion", "pair"],
    suggestedTags: ["Isoko", "Stall", "Kiosque", "Buciriritse"],
    typicalVariations: [],
  },
  {
    id: "other_commercial",
    code: "OTHER",
    nameRw: "Ubundi Bucuruzi Bwemewe n'Amategeko",
    nameEn: "Other Permitted Businesses",
    descriptionRw: "Ubundi bucuruzi bwose bwemewe n'amategeko y'u Rwanda budashyizwe mu byiciro byavuzwe haruguru.",
    descriptionEn: "Any other legally compliant commercial trading business in Rwanda.",
    icon: "Layers",
    defaultUnits: ["pcs", "other", "set", "box"],
    suggestedTags: ["Ubundi", "Other", "Commercial"],
    typicalVariations: [],
  },
];

export function findCategoryById(idOrCode: string | null | undefined): BusinessCategory {
  if (!idOrCode) return RWANDAN_BUSINESS_CATEGORIES[0];
  const normalized = idOrCode.toLowerCase().trim();
  const match = RWANDAN_BUSINESS_CATEGORIES.find(
    (c) =>
      c.id.toLowerCase() === normalized ||
      c.code.toLowerCase() === normalized ||
      c.nameEn.toLowerCase() === normalized ||
      c.nameRw.toLowerCase() === normalized
  );
  return match || RWANDAN_BUSINESS_CATEGORIES[RWANDAN_BUSINESS_CATEGORIES.length - 1];
}

export function getCategoryLabel(idOrCode: string | null | undefined, lang: "rw" | "en" = "rw"): string {
  const cat = findCategoryById(idOrCode);
  return lang === "rw" ? cat.nameRw : cat.nameEn;
}

/** Shape used by registration and account screens. */
export const BUSINESS_CATEGORIES = RWANDAN_BUSINESS_CATEGORIES.map((category) => ({
  id: category.id,
  en: category.nameEn,
  rw: category.nameRw,
}));

export type BusinessCategoryId = (typeof BUSINESS_CATEGORIES)[number]["id"];

const CATEGORY_IDS = new Set<string>(BUSINESS_CATEGORIES.map((category) => category.id));

export function normalizeBusinessCategory(raw: string | null | undefined): BusinessCategoryId {
  const id = (raw || "").trim().toLowerCase();
  if (CATEGORY_IDS.has(id)) return id as BusinessCategoryId;
  const byCode = RWANDAN_BUSINESS_CATEGORIES.find((category) => category.code.toLowerCase() === id);
  return (byCode?.id || "general_merchandise") as BusinessCategoryId;
}

export function businessCategoryLabel(
  raw: string | null | undefined,
  lang: "en" | "rw" = "en"
): string {
  return getCategoryLabel(normalizeBusinessCategory(raw), lang);
}
