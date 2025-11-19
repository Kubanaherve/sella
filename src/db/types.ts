export type PaymentMethod = "momo" | "cash" | "airtel" | "bank";
export type DebtStatus = "active" | "paid" | "bad_debt";
export type SalePaymentStatus = "paid" | "credit" | "partial";

export interface Profile {
  id: string;
  phone: string;
  phone_normalized: string;
  display_name: string;
  business_name?: string | null;
  email?: string | null;
  email_normalized?: string | null;
  shop_code?: string | null;
  pin_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  /** Local multi-shop isolation (Dexie). Required for new rows. */
  profile_id?: string;
  name: string;
  phone: string | null;
  phone_normalized: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: string;
  profile_id?: string;
  client_id: string;
  total_amount: number;
  remaining_balance: number;
  due_date: string | null;
  status: DebtStatus;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DebtItem {
  id: string;
  profile_id?: string;
  debt_id: string;
  inventory_item_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface Payment {
  id: string;
  profile_id?: string;
  debt_id: string | null;
  client_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

/** Common retail units — shops may also store a free-text unit. */
export type InventoryUnit =
  | "pcs"
  | "box"
  | "litre"
  | "kg"
  | "metre"
  | "roll"
  | "bag"
  | "bottle"
  | "set"
  | "other"
  | string;

export interface InventoryItem {
  id: string;
  profile_id?: string;
  item_name: string;
  quantity: number;
  selling_price: number;
  cost_price: number;
  date_bought: string;
  notes: string | null;
  category?: string | null;
  image_url?: string | null;
  sku?: string | null;
  barcode?: string | null;
  unit?: InventoryUnit | null;
  brand?: string | null;
  supplier?: string | null;
  min_quantity?: number | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export type InventoryWriteInput = {
  item_name: string;
  quantity: number;
  selling_price: number;
  cost_price: number;
  category?: string | null;
  notes?: string | null;
  sku?: string | null;
  barcode?: string | null;
  unit?: InventoryUnit | null;
  brand?: string | null;
  supplier?: string | null;
  min_quantity?: number | null;
  description?: string | null;
  image_url?: string | null;
  date_bought?: string | null;
};

export type InventoryUpdatePatch = Partial<
  Pick<
    InventoryItem,
    | "item_name"
    | "quantity"
    | "selling_price"
    | "cost_price"
    | "category"
    | "notes"
    | "sku"
    | "barcode"
    | "unit"
    | "brand"
    | "supplier"
    | "min_quantity"
    | "description"
    | "image_url"
  >
>;

export interface Sale {
  id: string;
  profile_id?: string;
  client_id: string | null;
  item_name: string;
  quantity: number;
  cost_price: number;
  sale_price: number;
  inventory_item_id: string | null;
  payment_method: PaymentMethod | null;
  payment_status: SalePaymentStatus;
  debt_id: string | null;
  created_at: string;
}

export type SalePaymentSlice = {
  method: PaymentMethod;
  amount: number;
  referenceNumber?: string | null;
};

export type CreateSaleOrderInput = {
  clientName?: string;
  phone?: string;
  dueDate?: string;
  /** @deprecated prefer `payments` slices; true = treat as fully paid with paymentMethod */
  paidNow?: boolean;
  /** Gross merchandise total before discount */
  amount: number;
  discountAmount?: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string | null;
  /** Split / partial payments at checkout (sum may be < amount) */
  payments?: SalePaymentSlice[];
  changeGiven?: number;
  items: Array<{
    inventory_item_id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
  }>;
};

export type CreateSaleOrderResult = {
  debt: Debt;
  sales: Sale[];
  payments: Payment[];
  /** @deprecated first payment or null */
  payment: Payment | null;
  paid: number;
  remaining: number;
  changeDue: number;
  receiptNumber: string;
};

export interface SaleRefund {
  id: string;
  debt_id: string;
  amount: number;
  reason: string | null;
  payment_method: PaymentMethod;
  restock: boolean;
  created_at: string;
}

export interface AppSetting {
  id: string;
  profile_id?: string;
  setting_key: string;
  setting_value: string;
  created_at: string;
}

export interface SessionRecord {
  id: string;
  profile_id: string;
  created_at: string;
}
