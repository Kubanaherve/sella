import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { labels, formatCurrency } from "@/lib/kinyarwanda";
import {
  addInventoryItem,
  deleteInventoryItem,
  listInventory,
  updateInventoryItem,
} from "@/db/api";
import type { InventoryItem as DbInventoryItem } from "@/db/types";
import { useAuth } from "@/contexts/AuthContext";
import { WriteGate } from "@/components/WriteGate";
import { toast } from "sonner";
import {
  Trash2,
  Plus,
  TrendingUp,
  Search,
  X,
  PackageOpen,
  Upload,
  AlertTriangle,
  Boxes,
  Pencil,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ListPageSkeleton } from "@/components/ListPageSkeleton";
import { pastelForName, stockTone } from "@/lib/uiTheme";
import { INVENTORY_UNITS } from "@/lib/inventoryUnits";
import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/haptics";

type InventoryItem = DbInventoryItem;
type FilterTab = "all" | "low" | "ok";

const InventoryPage: React.FC = () => {
  const { canWrite } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSellingPrice, setEditingSellingPrice] = useState("");
  const [editingCostPrice, setEditingCostPrice] = useState("");
  const [editingQuantity, setEditingQuantity] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newSellingPrice, setNewSellingPrice] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newUnit, setNewUnit] = useState("pcs");
  const [newSku, setNewSku] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      setItems(await listInventory());
    } catch (err) {
      console.error(err);
      toast.error("Habaye ikosa mu gufata ibintu");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
    const onUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener("inventoryUpdated", onUpdate);
    return () => window.removeEventListener("inventoryUpdated", onUpdate);
  }, [fetchItems]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems, refreshKey]);

  const stats = useMemo(() => {
    const totalCost = items.reduce(
      (s, i) => s + i.cost_price * i.quantity,
      0
    );
    const totalSell = items.reduce(
      (s, i) => s + i.selling_price * i.quantity,
      0
    );
    const units = items.reduce((s, i) => s + i.quantity, 0);
    const low = items.filter(
      (i) => i.quantity <= (i.min_quantity ?? 3)
    ).length;
    const profit = totalSell - totalCost;
    const margin = totalSell > 0 ? (profit / totalSell) * 100 : 0;
    return { totalCost, totalSell, units, low, profit, margin, skus: items.length };
  }, [items]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category?.trim()) set.add(i.category.trim());
    });
    return Array.from(set).sort();
  }, [items]);

  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (q) {
        const hay = [
          item.item_name,
          item.sku || "",
          item.barcode || "",
          item.category || "",
          item.brand || "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (categoryFilter !== "all" && (item.category || "") !== categoryFilter) {
        return false;
      }
      const low = item.quantity <= (item.min_quantity ?? 3);
      if (filter === "low" && !low) return false;
      if (filter === "ok" && low) return false;
      return true;
    });
  }, [items, searchQuery, filter, categoryFilter]);

  const handleSaveEdit = async (id: string) => {
    if (!canWrite) {
      toast.error("Subscription yarangiye — jya kuri Billing wishyure");
      return;
    }
    const sellingPrice = parseFloat(editingSellingPrice);
    const costPrice = parseFloat(editingCostPrice);
    const quantity = parseInt(editingQuantity, 10);
    if (
      isNaN(sellingPrice) ||
      sellingPrice < 0 ||
      isNaN(costPrice) ||
      costPrice < 0 ||
      isNaN(quantity) ||
      quantity < 0
    ) {
      toast.error("Andika neza amafaranga n'umubare");
      return;
    }
    const previous = [...items];
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              selling_price: sellingPrice,
              cost_price: costPrice,
              quantity,
            }
          : item
      )
    );
    try {
      await updateInventoryItem(id, {
        selling_price: sellingPrice,
        cost_price: costPrice,
        quantity,
      });
      toast.success("Byahinduwe neza");
      setEditingId(null);
      void hapticLight();
    } catch {
      setItems(previous);
      toast.error("Habaye ikosa mu guhindura");
    }
  };

  const handleDelete = async (id: string) => {
    if (!canWrite) {
      toast.error("Subscription yarangiye");
      return;
    }
    if (!confirm("Urashaka gusiba iki kicuruzwa?")) return;
    const previous = [...items];
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteInventoryItem(id);
      toast.success("Byasibwe");
    } catch {
      setItems(previous);
      toast.error("Habaye ikosa");
    }
  };

  const resetAddForm = () => {
    setNewName("");
    setNewQuantity("");
    setNewSellingPrice("");
    setNewCostPrice("");
    setNewCategory("");
    setNewUnit("pcs");
    setNewSku("");
  };

  const handleAddItem = async () => {
    if (!canWrite) {
      toast.error("Subscription yarangiye");
      return;
    }
    const quantity = parseInt(newQuantity, 10);
    const sellingPrice = parseFloat(newSellingPrice);
    const costPrice = parseFloat(newCostPrice);
    if (
      !newName.trim() ||
      isNaN(quantity) ||
      quantity < 0 ||
      isNaN(sellingPrice) ||
      sellingPrice < 0 ||
      isNaN(costPrice) ||
      costPrice < 0
    ) {
      toast.error("Andika neza izina, amafaranga n'umubare");
      return;
    }
    setIsAdding(true);
    try {
      const data = await addInventoryItem({
        item_name: newName.trim(),
        quantity,
        selling_price: sellingPrice,
        cost_price: costPrice,
        category: newCategory.trim() || null,
        unit: newUnit || "pcs",
        sku: newSku.trim() || null,
      });
      setItems((prev) => [data, ...prev]);
      toast.success("Ikintu cyongewe muri stock");
      resetAddForm();
      setShowAddForm(false);
      void hapticLight();
    } catch (err) {
      console.error(err);
      toast.error("Habaye ikosa mu kongera ikintu");
    } finally {
      setIsAdding(false);
    }
  };

  const fieldClass = "sella-input-glass rounded-xl";

  return (
    <div className="sella-page">
      <PageHeader
        title={labels.inventoryTitle}
        subtitle={`${stats.skus} ubwoko · ${stats.units} mu bubiko`}
        hideBack
        right={
          <div className="flex items-center gap-1.5">
            {canWrite && (
              <button
                type="button"
                onClick={() => navigate("/import-inventory")}
                className="sella-btn-glass h-9 px-2.5 rounded-xl text-xs"
                aria-label="Import"
              >
                <Upload size={14} />
                <span className="hidden xs:inline">CSV</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="sella-btn-glass-solid h-9 px-3 rounded-xl text-xs"
            >
              <Plus size={14} strokeWidth={2.5} />
              Ongeraho
            </button>
          </div>
        }
      />

      <div className="sella-page-body space-y-4">
        {!canWrite && <WriteGate actionLabel="Guhindura ububiko" />}

        {/* Glass hero value card */}
        <section className="glass-card-dark relative p-4">
          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/75">
              Agaciro k'ububiko
            </p>
            <p className="mt-1.5 text-[1.65rem] font-extrabold tabular-nums tracking-tight text-white">
              {formatCurrency(stats.totalSell)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white/95 backdrop-blur-md border border-white/20">
                Inyungu {formatCurrency(stats.profit)}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white/95 backdrop-blur-md border border-white/20">
                Margin {stats.margin.toFixed(1)}%
              </span>
            </div>
          </div>
        </section>

        {/* KPI strip */}
        <section className="grid grid-cols-2 gap-2.5">
          <div className="sella-stat flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A6FFF]/12 text-[#0B3FCC] flex items-center justify-center border border-white/60 backdrop-blur-sm">
              <Boxes size={18} />
            </div>
            <div>
              <p className="text-lg font-extrabold tabular-nums leading-none text-[#0B3FCC]">
                {stats.units}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Ibintu byose
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFilter(filter === "low" ? "all" : "low")}
            className={cn(
              "sella-stat text-left transition-shadow",
              filter === "low" && "ring-2 ring-[#1A6FFF]/35"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-700 flex items-center justify-center border border-white/50 backdrop-blur-sm">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-lg font-extrabold tabular-nums leading-none text-amber-800">
                  {stats.low}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Stock nke
                </p>
              </div>
            </div>
          </button>
        </section>

        {/* Search + filters */}
        {items.length > 0 && (
          <section className="space-y-2.5">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0B3FCC]/55"
              />
              <input
                type="search"
                placeholder="Shakisha izina, SKU, icyiciro…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sella-input-glass pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label="Clear"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {(
                [
                  ["all", "Byose"],
                  ["low", "Bike"],
                  ["ok", "Bihagije"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={cn(
                    "sella-chip-glass shrink-0",
                    filter === key && "sella-chip-glass-active"
                  )}
                >
                  {label}
                </button>
              ))}
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setCategoryFilter(categoryFilter === c ? "all" : c)
                  }
                  className={cn(
                    "sella-chip-glass shrink-0",
                    categoryFilter === c && "sella-chip-glass-active"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Product list */}
        <section className="space-y-2.5">
          {isLoading && items.length === 0 ? (
            <ListPageSkeleton rows={5} />
          ) : filteredItems.length === 0 ? (
            <div className="glass-card">
              <EmptyState
                icon={PackageOpen}
                title={
                  searchQuery || filter !== "all"
                    ? "Nta kintu kibonetse"
                    : "Ububiko burimo ubusa"
                }
                description={
                  searchQuery || filter !== "all"
                    ? "Hindura filter cyangwa search."
                    : "Ongeraho ibicuruzwa cyangwa kuzana CSV/Excel."
                }
                actionLabel={
                  searchQuery || filter !== "all" ? undefined : "Ongeraho ikintu"
                }
                onAction={
                  searchQuery || filter !== "all"
                    ? undefined
                    : () => setShowAddForm(true)
                }
              />
            </div>
          ) : (
            filteredItems.map((item) => {
              const pastel = pastelForName(item.item_name);
              const stock = stockTone(item.quantity);
              const profit = item.selling_price - item.cost_price;
              const low = item.quantity <= (item.min_quantity ?? 3);
              return (
                <article key={item.id} className="sella-list-card">
                  <div className="p-3.5 flex gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl font-extrabold flex items-center justify-center shrink-0 text-base border border-white/70 shadow-sm backdrop-blur-sm"
                      style={{ background: pastel.bg, color: pastel.fg }}
                    >
                      {item.item_name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-foreground truncate">
                            {item.item_name}
                          </h3>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {[item.category, item.unit || "pcs", item.sku]
                              .filter(Boolean)
                              .join(" · ") || "Ikicuruzwa"}
                          </p>
                        </div>
                        <span
                          className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/50 backdrop-blur-sm"
                          style={{ background: stock.bg, color: stock.color }}
                        >
                          {stock.label}
                        </span>
                      </div>

                      <div className="mt-2.5 grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-white/45 border border-white/60 px-2 py-1.5 backdrop-blur-sm">
                          <p className="text-[9px] text-muted-foreground font-medium">
                            Gurisha
                          </p>
                          <p className="text-xs font-extrabold tabular-nums truncate text-[#0B3FCC]">
                            {formatCurrency(item.selling_price)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white/45 border border-white/60 px-2 py-1.5 backdrop-blur-sm">
                          <p className="text-[9px] text-muted-foreground font-medium">
                            Stock
                          </p>
                          <p
                            className={cn(
                              "text-xs font-extrabold tabular-nums",
                              low && "text-amber-700"
                            )}
                          >
                            {item.quantity}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white/45 border border-white/60 px-2 py-1.5 backdrop-blur-sm">
                          <p className="text-[9px] text-muted-foreground font-medium">
                            Inyungu
                          </p>
                          <p
                            className={cn(
                              "text-xs font-extrabold tabular-nums truncate",
                              profit >= 0 ? "text-emerald-700" : "text-rose-600"
                            )}
                          >
                            {formatCurrency(profit)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditingSellingPrice(String(item.selling_price));
                            setEditingCostPrice(String(item.cost_price));
                            setEditingQuantity(String(item.quantity));
                          }}
                          className="sella-btn-glass flex-1 h-9 rounded-xl text-xs"
                        >
                          <Pencil size={13} />
                          Hindura
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(item.id)}
                          className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-200/60 flex items-center justify-center active:scale-95 backdrop-blur-sm"
                          aria-label="Siba"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {low && (
                    <div className="px-3.5 py-1.5 bg-amber-400/12 border-t border-amber-200/40 text-[10px] font-semibold text-amber-900 flex items-center gap-1.5 backdrop-blur-sm">
                      <AlertTriangle size={12} />
                      Ongera stock — hasigaye {item.quantity}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>

        {canWrite && items.length > 0 && (
          <button
            type="button"
            onClick={() => navigate("/import-inventory")}
            className="glass-card w-full px-4 py-3.5 flex items-center gap-3 text-left border-dashed"
          >
            <div className="relative z-10 w-10 h-10 rounded-xl bg-[#1A6FFF]/12 text-[#0B3FCC] flex items-center justify-center border border-white/60">
              <Upload size={18} />
            </div>
            <div className="relative z-10 min-w-0">
              <p className="text-sm font-bold text-foreground">
                Kuzana CSV / Excel
              </p>
              <p className="text-[11px] text-muted-foreground">
                Ibicuruzwa byinshi · map columns · preview
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Add sheet */}
      {showAddForm && (
        <div className="fixed inset-0 z-[80] sella-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="sella-sheet-glass w-full sm:max-w-md max-h-[90dvh] rounded-t-3xl sm:rounded-3xl">
            <div className="sella-sheet-top px-4 pb-3 border-b border-[#1A6FFF]/10 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base text-[#0B3FCC]">
                  Ongeraho ikicuruzwa
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Stock · igiciro · icyiciro
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="w-9 h-9 rounded-full sella-btn-glass"
                aria-label="Funga"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Izina *
                </label>
                <input
                  className={cn(fieldClass, "mt-1")}
                  placeholder="ex. Cement 50kg"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Umubare *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className={cn(fieldClass, "mt-1")}
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Igipimo
                  </label>
                  <select
                    className={cn(fieldClass, "mt-1")}
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                  >
                    {INVENTORY_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.labelRw}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Igiciro kugurisha *
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className={cn(fieldClass, "mt-1")}
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Igiciro kurangura *
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className={cn(fieldClass, "mt-1")}
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Icyiciro
                  </label>
                  <input
                    className={cn(fieldClass, "mt-1")}
                    placeholder="Paint, Grocery…"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    SKU
                  </label>
                  <input
                    className={cn(fieldClass, "mt-1")}
                    placeholder="CEM-50"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                  />
                </div>
              </div>
              {newSellingPrice && newCostPrice && (
                <div className="rounded-xl bg-emerald-400/12 border border-emerald-200/50 px-3 py-2.5 flex justify-between text-sm backdrop-blur-sm">
                  <span className="text-emerald-800/80 flex items-center gap-1.5">
                    <TrendingUp size={14} /> Inyungu
                  </span>
                  <span className="font-bold text-emerald-800 tabular-nums">
                    {formatCurrency(
                      (parseFloat(newSellingPrice) || 0) -
                        (parseFloat(newCostPrice) || 0)
                    )}
                  </span>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#1A6FFF]/10 flex gap-2 pb-[max(1rem,var(--sella-safe-bottom))]">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="sella-btn-glass flex-1 h-11 rounded-xl text-sm"
              >
                Bireke
              </button>
              <button
                type="button"
                disabled={isAdding || !canWrite}
                onClick={() => void handleAddItem()}
                className="sella-btn-glass-solid flex-[1.4] h-11 rounded-xl text-sm disabled:opacity-50"
              >
                {isAdding ? "…" : "Emeza"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit sheet */}
      {editingId && (
        <div className="fixed inset-0 z-[85] sella-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="sella-sheet-glass w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl">
            <div className="sella-sheet-top px-4 pb-3 border-b border-[#1A6FFF]/10 flex items-center justify-between">
              <h2 className="font-bold text-[#0B3FCC]">Hindura stock / igiciro</h2>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="w-9 h-9 rounded-full sella-btn-glass"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Umubare
                </label>
                <input
                  type="number"
                  className={cn(fieldClass, "mt-1")}
                  value={editingQuantity}
                  onChange={(e) => setEditingQuantity(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Kugurisha
                  </label>
                  <input
                    type="number"
                    className={cn(fieldClass, "mt-1")}
                    value={editingSellingPrice}
                    onChange={(e) => setEditingSellingPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Kurangura
                  </label>
                  <input
                    type="number"
                    className={cn(fieldClass, "mt-1")}
                    value={editingCostPrice}
                    onChange={(e) => setEditingCostPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[#1A6FFF]/10 flex gap-2 pb-[max(1rem,var(--sella-safe-bottom))]">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="sella-btn-glass flex-1 h-11 rounded-xl text-sm"
              >
                Bireke
              </button>
              <button
                type="button"
                onClick={() => void handleSaveEdit(editingId)}
                className="sella-btn-glass-solid flex-[1.4] h-11 rounded-xl text-sm"
              >
                Bika
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
