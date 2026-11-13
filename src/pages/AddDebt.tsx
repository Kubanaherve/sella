import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createSaleOrder, listInventory } from "@/db/api";
import { useAuth } from "@/contexts/AuthContext";
import { WriteGate } from "@/components/WriteGate";
import type { InventoryItem, PaymentMethod, SalePaymentSlice } from "@/db/types";
import { formatCurrency, labels } from "@/lib/kinyarwanda";
import { lineTotal, sumRwf, toRwf } from "@/lib/money";
import {
  ArrowLeft,
  Check,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { CustomerAutocomplete } from "@/components/CustomerAutocomplete";
import { useCustomerSuggestions } from "@/hooks/useCustomerSuggestions";
import { SaleComplete } from "@/components/sale/SaleComplete";
import type { ReceiptData } from "@/lib/receipt";
import { getReceiptPrefs } from "@/lib/receiptPrefs";
import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/haptics";
import { pastelForName, paymentMethodStyle, stockTone, UI } from "@/lib/uiTheme";

type CartLine = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  stock: number;
  category: string;
};

type Step = "cart" | "checkout";

const METHODS: { value: PaymentMethod; label: string; short: string }[] = [
  { value: "cash", label: "Cash", short: "Cash" },
  { value: "momo", label: "MTN MoMo", short: "MoMo" },
  { value: "airtel", label: "Airtel Money", short: "Airtel" },
  { value: "bank", label: "Banki", short: "Banki" },
];

const NewSalePage: React.FC = () => {
  const navigate = useNavigate();
  const { canWrite, profile } = useAuth();
  const { customers } = useCustomerSuggestions();

  const [step, setStep] = useState<Step>("cart");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInv, setLoadingInv] = useState(true);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [qtyItem, setQtyItem] = useState<InventoryItem | null>(null);
  const [qtyDraft, setQtyDraft] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [discount, setDiscount] = useState("0");
  const [paySlices, setPaySlices] = useState<SalePaymentSlice[]>([
    { method: "cash", amount: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState<ReceiptData | null>(null);

  const loadInventory = async () => {
    setLoadingInv(true);
    try {
      setInventory(await listInventory());
    } catch (e) {
      console.error(e);
      toast.error("Ntibashoboye kubona ibicuruzwa");
    } finally {
      setLoadingInv(false);
    }
  };

  useEffect(() => {
    void loadInventory();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const i of inventory) {
      const c = (i as InventoryItem & { category?: string }).category?.trim();
      if (c) set.add(c);
    }
    return ["all", ...Array.from(set).sort()];
  }, [inventory]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inventory.filter((i) => {
      const cat =
        (i as InventoryItem & { category?: string }).category || "Uncategorized";
      if (category !== "all" && cat !== category) return false;
      if (!q) return true;
      return i.item_name.toLowerCase().includes(q);
    });
  }, [inventory, query, category]);

  const merchandise = useMemo(
    () => sumRwf(cart.map((c) => lineTotal(c.unitPrice, c.quantity))),
    [cart]
  );
  const discountRwf = Math.min(toRwf(discount), merchandise);
  const orderTotal = Math.max(0, merchandise - discountRwf);
  const paidNow = sumRwf(paySlices.map((p) => toRwf(p.amount)));
  const remaining = Math.max(0, orderTotal - paidNow);
  const changeDue = Math.max(0, paidNow - orderTotal);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const openQtyPicker = (item: InventoryItem) => {
    if (item.quantity <= 0) {
      toast.error(labels.outOfStock);
      return;
    }
    void hapticLight();
    const existing = cart.find((c) => c.id === item.id);
    setQtyItem(item);
    setQtyDraft(existing?.quantity || 1);
  };

  const confirmQty = () => {
    if (!qtyItem) return;
    const stock = qtyItem.quantity;
    const qty = Math.max(1, Math.min(stock, Math.floor(qtyDraft) || 1));
    if (qty > stock) {
      toast.error(labels.notEnoughStock);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.id === qtyItem.id);
      if (existing) {
        return prev.map((c) =>
          c.id === qtyItem.id ? { ...c, quantity: qty } : c
        );
      }
      return [
        ...prev,
        {
          id: qtyItem.id,
          name: qtyItem.item_name,
          quantity: qty,
          unitPrice: toRwf(qtyItem.selling_price),
          stock,
          category:
            (qtyItem as InventoryItem & { category?: string }).category ||
            "Uncategorized",
        },
      ];
    });
    setQtyItem(null);
    toast.success(`${qtyItem.item_name} × ${qty}`);
  };

  const setQty = (id: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.id !== id) return c;
          const next = Math.max(0, Math.min(c.stock, Math.floor(qty)));
          return { ...c, quantity: next };
        })
        .filter((c) => c.quantity > 0)
    );
  };

  const syncPayAmount = (idx: number, amount: string) => {
    setPaySlices((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, amount: toRwf(amount) } : p))
    );
  };

  const addPaySlice = () => {
    setPaySlices((prev) => [...prev, { method: "momo", amount: 0 }]);
  };

  const removePaySlice = (idx: number) => {
    setPaySlices((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)
    );
  };

  const fillRemainingOnSlice = (idx: number) => {
    const others = paySlices.reduce(
      (s, p, i) => (i === idx ? s : s + toRwf(p.amount)),
      0
    );
    const need = Math.max(0, orderTotal - others);
    setPaySlices((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, amount: need } : p))
    );
  };

  const requestConfirm = () => {
    if (!canWrite) {
      toast.error(labels.subscriptionExpired);
      return;
    }
    if (!cart.length) {
      toast.error("Banza wongereho ibicuruzwa");
      return;
    }
    if (remaining > 0 && !customerName.trim()) {
      toast.error(labels.customerRequired);
      return;
    }
    if (remaining > 0 && !customerPhone.trim()) {
      toast.error("Andika numero ya telefone y'umukiriya ku ideni");
      return;
    }
    setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    setConfirmOpen(false);
    const slices = paySlices
      .map((p) => ({
        method: p.method,
        amount: toRwf(p.amount),
        referenceNumber: p.referenceNumber || null,
      }))
      .filter((p) => p.amount > 0);

    setSaving(true);
    try {
      const result = await createSaleOrder({
        clientName: customerName.trim() || undefined,
        phone: customerPhone.trim() || undefined,
        dueDate: remaining > 0 ? dueDate : undefined,
        amount: orderTotal,
        discountAmount: discountRwf,
        payments: slices,
        changeGiven: changeDue,
        items: cart.map((c) => ({
          inventory_item_id: c.id,
          item_name: c.name,
          quantity: c.quantity,
          unit_price: c.unitPrice,
        })),
      });

      if (result.queuedOffline) {
        toast.message(
          "Nta interineti — sale yabitswe offline. Izohereza iyo wahuye (idempotent)."
        );
      }

      window.dispatchEvent(
        new CustomEvent("newDebtAdded", {
          detail: {
            amount: orderTotal,
            isPaid: remaining <= 0,
            queuedOffline: !!result.queuedOffline,
          },
        })
      );

      const prefs = getReceiptPrefs();
      const receipt: ReceiptData = {
        shopName:
          (profile && "business_name" in profile && profile.business_name) ||
          "Sella Shop",
        shopPhone: profile && "phone" in profile ? profile.phone : null,
        shopEmail:
          profile && "email" in profile
            ? (profile.email as string | null)
            : null,
        receiptNumber: result.receiptNumber,
        createdAt: new Date().toISOString(),
        customerName: customerName.trim() || "Umukiriya wanyuze",
        customerPhone: customerPhone.trim() || null,
        lines: cart.map((c) => ({
          name: c.name,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
        })),
        discountAmount: discountRwf || undefined,
        total: orderTotal,
        paid: result.paid,
        remaining: result.remaining,
        payments: result.payments.map((p) => ({
          method: p.payment_method,
          amount: p.amount,
          referenceNumber: p.reference_number,
        })),
        thankYouMessage: prefs.thankYouMessage,
        paymentStatus:
          result.remaining <= 0
            ? "paid"
            : result.paid > 0
              ? "partial"
              : "credit",
      };

      setComplete(receipt);
      setCart([]);
      setPaySlices([{ method: "cash", amount: 0 }]);
      setDiscount("0");
      setCustomerName("");
      setCustomerPhone("");
      setStep("cart");
      void loadInventory();
      toast.success(labels.saleRecorded);
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : labels.saleFailed
      );
    } finally {
      setSaving(false);
    }
  };

  const sheetOpen = catalogOpen || !!qtyItem || confirmOpen;

  return (
    <div className="min-h-[100dvh] max-h-[100dvh] bg-[hsl(214_60%_98%)] flex flex-col overflow-hidden">
      <header className="sella-app-header shrink-0">
        <button
          type="button"
          onClick={() =>
            step === "checkout" ? setStep("cart") : navigate("/dashboard")
          }
          className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate text-foreground">
            {step === "cart" ? labels.newSale : labels.checkout}
          </h1>
          <p className="text-[11px] text-muted-foreground truncate">
            {step === "cart"
              ? "Hitamo ibicuruzwa · hindura umubare"
              : "Ishura, gabanya, cyangwa siga ideni"}
          </p>
        </div>
        {cartCount > 0 && (
          <div className="h-9 min-w-9 px-2.5 rounded-xl bg-primary text-white text-sm font-bold flex items-center justify-center gap-1 shrink-0">
            <ShoppingCart size={14} />
            {cartCount}
          </div>
        )}
      </header>

      {!canWrite && (
        <div className="px-3 pt-3">
          <WriteGate actionLabel="Kugurisha" />
        </div>
      )}

      {step === "cart" ? (
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-3 pb-4">
          <button
            type="button"
            onClick={() => {
              void hapticLight();
              setCatalogOpen(true);
            }}
            className="w-full rounded-2xl border-2 border-dashed border-primary/35 bg-primary/5 px-4 py-5 flex items-center gap-3 text-left sella-press"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0b4fd9] to-[#1a6fff] text-white flex items-center justify-center shadow-navy">
              <Package size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground">Hitamo ibicuruzwa</p>
              <p className="text-xs text-muted-foreground">
                Fungura urutonde · shakisha · shyira umubare
              </p>
            </div>
            <Plus className="text-primary shrink-0" size={22} />
          </button>

          {cart.length === 0 ? (
            <div className="sella-list-card p-8 text-center">
              <ShoppingCart className="mx-auto text-primary/40 mb-3" size={36} />
              <p className="font-semibold text-foreground">Agatebo karimo ubusa</p>
              <p className="text-xs text-muted-foreground mt-1">
                Kanda «Hitamo ibicuruzwa» utangire
              </p>
            </div>
          ) : (
            <section className="sella-list-card overflow-hidden divide-y divide-border/60">
              {cart.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 flex flex-wrap items-center gap-x-3 gap-y-2"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                    {c.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatCurrency(c.unitPrice)} × {c.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
                      onClick={() => setQty(c.id, c.quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      className="w-10 text-center text-sm font-bold bg-transparent"
                      value={c.quantity}
                      inputMode="numeric"
                      onChange={(e) =>
                        setQty(c.id, Number(e.target.value.replace(/\D/g, "")) || 0)
                      }
                    />
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"
                      onClick={() => setQty(c.id, c.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="text-right shrink-0 min-w-[4.5rem]">
                    <p className="text-sm font-bold tabular-nums">
                      {formatCurrency(lineTotal(c.unitPrice, c.quantity))}
                    </p>
                    <button
                      type="button"
                      className="text-[10px] text-rose-500 font-medium"
                      onClick={() => setQty(c.id, 0)}
                    >
                      Siba
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}
        </main>
      ) : (
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-4 pb-4">
          <section className="sella-list-card p-3 space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Agatebo
            </h2>
            {cart.map((c) => (
              <div
                key={c.id}
                className="flex justify-between text-sm py-1.5 border-b border-border/60 last:border-0"
              >
                <span className="truncate mr-2">
                  {c.name} × {c.quantity}
                </span>
                <span className="font-semibold tabular-nums shrink-0">
                  {formatCurrency(lineTotal(c.unitPrice, c.quantity))}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-1">
              <span className="text-muted-foreground">{labels.subtotal}</span>
              <span className="font-semibold">{formatCurrency(merchandise)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{labels.discount}</span>
              <Input
                className="h-9 w-28 text-right"
                value={discount}
                inputMode="numeric"
                onChange={(e) => setDiscount(e.target.value.replace(/[^\d]/g, ""))}
              />
            </div>
            <div className="flex justify-between text-base font-bold pt-1 border-t border-border">
              <span>{labels.total}</span>
              <span className="text-primary">{formatCurrency(orderTotal)}</span>
            </div>
          </section>

          <section className="sella-list-card p-3 space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Umukiriya {remaining > 0 ? "(ngombwa)" : "(si ngombwa)"}
            </h2>
            <CustomerAutocomplete
              value={customerName}
              onChange={setCustomerName}
              onSelect={(c) => {
                setCustomerName(c.name);
                setCustomerPhone(c.phone || "");
              }}
              suggestions={customers}
              placeholder={labels.customerName}
            />
            <Input
              placeholder="Telefone 07X…"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              inputMode="tel"
            />
            {remaining > 0 && (
              <div>
                <label className="text-[11px] text-muted-foreground">
                  {labels.dueDate}
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </section>

          <section className="sella-list-card p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Ubwishyu
              </h2>
              <button
                type="button"
                onClick={addPaySlice}
                className="text-xs font-semibold text-primary"
              >
                + Gabanya
              </button>
            </div>
            {paySlices.map((p, idx) => (
              <div key={idx} className="space-y-2 rounded-xl bg-muted/50 p-2.5">
                <div className="flex gap-1.5 flex-wrap items-center">
                  {METHODS.map((m) => {
                    const style = paymentMethodStyle(m.value);
                    const active = p.method === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() =>
                          setPaySlices((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, method: m.value } : x
                            )
                          )
                        }
                        className={cn(
                          "h-11 px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold border-2 transition-transform active:scale-95 shrink-0",
                          active ? "scale-[1.02] shadow-sm" : "opacity-55"
                        )}
                        style={{
                          background: style.bg,
                          color: style.text,
                          borderColor: active ? style.border : "transparent",
                        }}
                      >
                        <span className="sm:hidden">{m.short}</span>
                        <span className="hidden sm:inline">{m.label}</span>
                      </button>
                    );
                  })}
                  {paySlices.length > 1 && (
                    <button
                      type="button"
                      className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center ml-auto"
                      onClick={() => removePaySlice(idx)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    inputMode="numeric"
                    placeholder={labels.amount}
                    value={p.amount || ""}
                    onChange={(e) => syncPayAmount(idx, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => fillRemainingOnSlice(idx)}
                  >
                    Asigaye
                  </Button>
                </div>
                {(p.method === "momo" || p.method === "airtel") && (
                  <Input
                    placeholder="Referansi ya Tx (si ngombwa)"
                    value={p.referenceNumber || ""}
                    onChange={(e) =>
                      setPaySlices((prev) =>
                        prev.map((x, i) =>
                          i === idx
                            ? { ...x, referenceNumber: e.target.value }
                            : x
                        )
                      )
                    }
                  />
                )}
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2 text-sm pt-1">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2.5">
                <p className="text-[10px] text-emerald-700">{labels.payingNow}</p>
                <p className="font-bold text-emerald-800 tabular-nums">
                  {formatCurrency(Math.min(paidNow, orderTotal))}
                </p>
              </div>
              <div
                className="rounded-xl border p-2.5"
                style={{
                  background: remaining > 0 ? UI.creditBg : UI.cashBg,
                  borderColor: remaining > 0 ? "#FCD34D" : "#86EFAC",
                }}
              >
                <p
                  className="text-[10px] font-semibold"
                  style={{ color: remaining > 0 ? UI.credit : UI.cash }}
                >
                  {remaining > 0 ? "Ideni / Credit" : labels.changeDue}
                </p>
                <p
                  className="font-bold tabular-nums"
                  style={{ color: remaining > 0 ? UI.credit : UI.cash }}
                >
                  {formatCurrency(remaining > 0 ? remaining : changeDue)}
                </p>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Bottom bar — sticky in flex column so it stays in the viewport */}
      {!sheetOpen && (
        <div className="sella-fixed-bottom-bar">
          {step === "cart" ? (
            <button
              type="button"
              className="sella-btn-confirm text-base px-3"
              disabled={!cart.length}
              onClick={() => {
                void hapticLight();
                setStep("checkout");
              }}
            >
              <ShoppingCart size={18} className="shrink-0" />
              <span className="truncate">
                Komeza · {formatCurrency(merchandise)}
              </span>
            </button>
          ) : (
            <div className="flex gap-2 min-w-0">
              <Button
                variant="outline"
                className="h-[52px] flex-1 rounded-2xl shrink-0"
                onClick={() => setStep("cart")}
              >
                {labels.back}
              </Button>
              <button
                type="button"
                className="sella-btn-confirm flex-[1.6] text-sm sm:text-base px-2 min-w-0"
                disabled={saving || !cart.length}
                onClick={requestConfirm}
              >
                <Check size={18} className="shrink-0" />
                <span className="truncate">
                  {saving
                    ? labels.saving
                    : `Emeza · ${formatCurrency(orderTotal)}`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Catalog popup */}
      {catalogOpen && (
        <div className="fixed inset-0 z-[70] sella-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="sella-sheet-glass w-full sm:max-w-lg h-[min(92dvh,100%)] rounded-t-3xl sm:rounded-3xl animate-fade-in">
            <div className="sella-sheet-top px-4 pb-3 border-b border-[#1A6FFF]/10 flex items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-lg text-[#0B3FCC]">Ibicuruzwa</h2>
                <p className="text-[11px] text-muted-foreground">
                  Hitamo ikintu · shyira umubare
                </p>
              </div>
              <button
                type="button"
                className="w-9 h-9 rounded-full sella-btn-glass"
                onClick={() => setCatalogOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-4 py-3 space-y-2 border-b border-[#1A6FFF]/10">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0B3FCC]/55"
                />
                <Input
                  className="sella-input-glass pl-9 h-11"
                  placeholder={labels.searchProducts}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>
              {categories.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-0.5">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={cn(
                        "sella-chip-glass shrink-0",
                        category === c && "sella-chip-glass-active"
                      )}
                    >
                      {c === "all" ? labels.allCategories : c}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {loadingInv ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  Birimo gufata ibicuruzwa…
                </p>
              ) : filtered.length === 0 ? (
                <div className="text-center p-6">
                  <p className="text-sm font-medium">{labels.noProducts}</p>
                  <Button
                    className="mt-3"
                    variant="outline"
                    onClick={() => {
                      setCatalogOpen(false);
                      navigate("/inventory");
                    }}
                  >
                    {labels.addStock}
                  </Button>
                </div>
              ) : (
                filtered.map((item) => {
                  const inCart =
                    cart.find((c) => c.id === item.id)?.quantity || 0;
                  const out = item.quantity <= 0;
                  const pastel = pastelForName(item.item_name);
                  const stock = stockTone(item.quantity);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={out}
                      onClick={() => openQtyPicker(item)}
                      className={cn(
                        "w-full text-left rounded-2xl border-2 p-3 flex items-center gap-3 transition-all active:scale-[0.99]",
                        out
                          ? "opacity-45 border-border bg-muted/40"
                          : inCart
                            ? "border-emerald-400 bg-emerald-50/80 shadow-sm"
                            : "border-transparent bg-white shadow-sm"
                      )}
                    >
                      <div
                        className="w-14 h-14 rounded-2xl font-extrabold text-lg flex items-center justify-center shrink-0"
                        style={{ background: pastel.bg, color: pastel.fg }}
                      >
                        {item.item_name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate text-slate-900">
                          {item.item_name}
                        </p>
                        <span
                          className="inline-flex mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: stock.bg, color: stock.color }}
                        >
                          {stock.label} · {item.quantity}
                          {inCart ? ` · Agatebo ${inCart}` : ""}
                        </span>
                      </div>
                      <p className="text-base font-extrabold text-slate-900 tabular-nums shrink-0">
                        {formatCurrency(item.selling_price)}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
            <div className="p-3 border-t border-border pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                className="sella-btn-confirm"
                onClick={() => setCatalogOpen(false)}
              >
                {cartCount ? `Funga · ${cartCount} mu gatebo` : "Funga"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quantity popup */}
      {qtyItem && (
        <div className="fixed inset-0 z-[80] sella-overlay flex items-center justify-center p-4">
          <div className="sella-popup-glass w-full max-w-sm rounded-3xl p-5 space-y-4 animate-scale-in">
            <div className="relative z-10 flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Umubare</p>
                <h3 className="font-bold text-lg leading-tight text-[#0B3FCC]">
                  {qtyItem.item_name}
                </h3>
                <p className="text-sm text-primary font-semibold mt-0.5">
                  {formatCurrency(qtyItem.selling_price)} / kimwe
                </p>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full sella-btn-glass"
                onClick={() => setQtyItem(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="relative z-10 flex items-center justify-center gap-4 py-2">
              <button
                type="button"
                className="w-12 h-12 rounded-2xl sella-btn-glass"
                onClick={() => setQtyDraft((q) => Math.max(1, q - 1))}
              >
                <Minus size={20} />
              </button>
              <input
                className="w-20 text-center text-3xl font-extrabold tabular-nums bg-transparent"
                value={qtyDraft}
                inputMode="numeric"
                onChange={(e) =>
                  setQtyDraft(
                    Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)
                  )
                }
              />
              <button
                type="button"
                className="w-12 h-12 rounded-2xl sella-btn-glass-solid"
                onClick={() =>
                  setQtyDraft((q) => Math.min(qtyItem.quantity, q + 1))
                }
              >
                <Plus size={20} />
              </button>
            </div>
            <p className="relative z-10 text-center text-xs text-muted-foreground">
              Max {qtyItem.quantity} · Igiteranyo{" "}
              <span className="font-bold text-foreground">
                {formatCurrency(
                  lineTotal(toRwf(qtyItem.selling_price), qtyDraft)
                )}
              </span>
            </p>
            <div className="relative z-10 grid grid-cols-3 gap-2">
              {[1, 2, 3, 5, 10].filter((n) => n <= qtyItem.quantity).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQtyDraft(n)}
                  className={cn(
                    "sella-chip-glass h-10 justify-center",
                    qtyDraft === n && "sella-chip-glass-active"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="relative z-10 sella-btn-confirm"
              onClick={confirmQty}
            >
              <Plus size={18} /> Ongeraho mu gatebo
            </button>
          </div>
        </div>
      )}

      {/* Perfect confirmation */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[85] sella-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="sella-sheet-glass w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl animate-fade-in">
            <div className="sella-popup-header-glass px-5 pt-5 pb-4">
              <p className="relative z-10 text-xs text-white/75 font-medium">
                Emeza igurisha
              </p>
              <p className="relative z-10 text-3xl font-extrabold tabular-nums mt-1">
                {formatCurrency(orderTotal)}
              </p>
              <p className="relative z-10 text-xs text-white/80 mt-1">
                {customerName.trim() || "Umukiriya wanyuze"} · {cartCount}{" "}
                {cartCount === 1 ? "ikintu" : "ibintu"}
              </p>
            </div>
            <div className="relative z-10 px-5 py-4 space-y-3 max-h-[40vh] overflow-y-auto">
              {cart.map((c) => (
                <div key={c.id} className="flex justify-between text-sm gap-2">
                  <span className="text-muted-foreground truncate">
                    {c.name} × {c.quantity}
                  </span>
                  <span className="font-semibold tabular-nums shrink-0">
                    {formatCurrency(lineTotal(c.unitPrice, c.quantity))}
                  </span>
                </div>
              ))}
              {discountRwf > 0 && (
                <div className="flex justify-between text-sm text-amber-700">
                  <span>Kugabanya</span>
                  <span>-{formatCurrency(discountRwf)}</span>
                </div>
              )}
              <div className="border-t border-border pt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-emerald-50 p-2.5">
                  <p className="text-[10px] text-emerald-700">Yishyuye nonaha</p>
                  <p className="font-bold text-emerald-800">
                    {formatCurrency(Math.min(paidNow, orderTotal))}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 p-2.5">
                  <p className="text-[10px] text-amber-700">
                    {remaining > 0 ? "Ideni" : "Gusubiza"}
                  </p>
                  <p className="font-bold text-amber-800">
                    {formatCurrency(remaining > 0 ? remaining : changeDue)}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative z-10 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 flex gap-2">
              <Button
                variant="outline"
                className="sella-btn-glass flex-1 h-12 rounded-xl border-0"
                onClick={() => setConfirmOpen(false)}
                disabled={saving}
              >
                Hindura
              </Button>
              <button
                type="button"
                className="sella-btn-confirm flex-[1.3]"
                onClick={() => void handleSubmit()}
                disabled={saving}
              >
                <Check size={18} />
                {saving ? labels.saving : "Emeza Kwishyura"}
              </button>
            </div>
          </div>
        </div>
      )}

      {complete && (
        <SaleComplete
          data={complete}
          onClose={() => {
            const goDebts = complete.remaining > 0;
            setComplete(null);
            navigate(goDebts ? "/debts" : "/sales");
          }}
        />
      )}
    </div>
  );
};

export default NewSalePage;
