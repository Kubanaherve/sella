import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listMarketplaceProducts, listMarketplaceStores } from "@/db/api";
import type { InventoryItem, Profile } from "@/db/types";
import { useCart } from "@/contexts/CartContext";
import { CartSheet } from "@/components/marketplace/CartSheet";
import { CheckoutModal } from "@/components/marketplace/CheckoutModal";
import {
  RWANDAN_BUSINESS_CATEGORIES,
  findCategoryById,
  getCategoryLabel,
} from "@/lib/businessCategories";
import { formatCurrency } from "@/lib/kinyarwanda";
import { formatUnitLabel } from "@/lib/inventoryUnits";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Tag,
  ArrowUpDown,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  Info,
  X,
  Phone,
  ShieldAlert,
} from "lucide-react";
import { Seo } from "@/components/marketing/Seo";

type SortOption = "newest" | "price_asc" | "price_desc" | "name_asc";

type MarketplaceProduct = InventoryItem & {
  shop_name?: string;
  shop_code?: string;
  shop_category?: string;
};

export default function MarketplacePage() {
  const navigate = useNavigate();
  const { addItem, totalCount, setIsCartOpen } = useCart();

  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [stores, setStores] = useState<Array<Profile & { product_count?: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<"products" | "stores">("products");

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<string>("");
  const [orderQuantity, setOrderQuantity] = useState(1);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodData, storeData] = await Promise.all([
        listMarketplaceProducts(),
        listMarketplaceStores(),
      ]);
      setProducts(prodData);
      setStores(storeData);
    } catch (e) {
      console.error("Marketplace fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const min = minPrice ? parseFloat(minPrice) : null;
    const max = maxPrice ? parseFloat(maxPrice) : null;

    let res = products.filter((item) => {
      if (inStockOnly && item.quantity <= 0) return false;
      if (min != null && !isNaN(min) && item.selling_price < min) return false;
      if (max != null && !isNaN(max) && item.selling_price > max) return false;

      if (selectedCategory !== "all") {
        const itemCat = (item.category || "").toLowerCase();
        const shopCat = (item.shop_category || "").toLowerCase();
        if (itemCat !== selectedCategory && shopCat !== selectedCategory) {
          return false;
        }
      }

      if (q) {
        const haystack = [
          item.item_name,
          item.shop_name || "",
          item.category || "",
          item.brand || "",
          item.description || "",
          item.sku || "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    res = [...res].sort((a, b) => {
      if (sortBy === "price_asc") return a.selling_price - b.selling_price;
      if (sortBy === "price_desc") return b.selling_price - a.selling_price;
      if (sortBy === "name_asc") return a.item_name.localeCompare(b.item_name);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return res;
  }, [products, searchQuery, selectedCategory, minPrice, maxPrice, inStockOnly, sortBy]);

  const filteredStores = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return stores.filter((s) => {
      if (selectedCategory !== "all") {
        if ((s.business_category || "").toLowerCase() !== selectedCategory) return false;
      }
      if (q) {
        const haystack = [
          s.business_name || "",
          s.owner_name || "",
          s.shop_code || "",
          s.store_address || "",
          s.store_description || "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [stores, searchQuery, selectedCategory]);

  const handleQuickAdd = (product: MarketplaceProduct) => {
    addItem({
      inventoryItemId: product.id,
      shopCode: product.shop_code || "SEL-GENERAL",
      shopName: product.shop_name || "Iduka",
      itemName: product.item_name,
      price: product.selling_price,
      quantity: 1,
      maxStock: product.quantity,
      unit: product.unit,
      variation: product.variant_label || null,
      imageUrl: product.image_url || null,
    });
  };

  const handleOpenDetail = (product: MarketplaceProduct) => {
    setSelectedProduct(product);
    setSelectedVariation(product.variant_label || "");
    setOrderQuantity(1);
  };

  const handleDetailAdd = () => {
    if (!selectedProduct) return;
    addItem({
      inventoryItemId: selectedProduct.id,
      shopCode: selectedProduct.shop_code || "SEL-GENERAL",
      shopName: selectedProduct.shop_name || "Iduka",
      itemName: selectedProduct.item_name,
      price: selectedProduct.selling_price,
      quantity: orderQuantity,
      maxStock: selectedProduct.quantity,
      unit: selectedProduct.unit,
      variation: selectedVariation || selectedProduct.variant_label || null,
      imageUrl: selectedProduct.image_url || null,
    });
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] text-slate-900 dark:text-slate-100 selection:bg-[#1A6FFF] selection:text-white transition-colors duration-300">
      <Seo
        title="Isoko rya Sella — Universal Rwandan Marketplace"
        description="Gura ibicuruzwa bitandukanye mu maduka n'abacuruzi bo mu Rwanda: imyenda, ibiribwa, ibyuma, ubwubatsi, ikoranabuhanga n'ibindi."
        path="/marketplace"
      />

      {/* ── Top Header Navigation ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-90">
              <BrandMark variant="icon" size="sm" framed={false} />
              <span className="font-black text-xl text-slate-900 dark:text-white tracking-tight">
                Sella <span className="text-primary font-bold text-sm">Isoko</span>
              </span>
            </Link>
          </div>

          {/* Search Box on Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-md relative mx-4">
            <Search className="absolute left-3 text-muted-foreground" size={15} />
            <input
              type="text"
              placeholder="Shakisha ibicuruzwa, amaduka, ibirango..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-none text-xs focus:ring-2 focus:ring-primary focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/orders"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span>Komande Zanjye</span>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCartOpen(true)}
              className="relative h-9 px-3 text-xs font-bold btn-navy flex items-center gap-1.5"
            >
              <ShoppingBag size={15} />
              <span className="hidden xs:inline">Agaseke</span>
              {totalCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {totalCount}
                </span>
              )}
            </Button>

            <Link
              to="/app"
              className="text-xs font-bold text-primary hover:underline px-2 hidden sm:inline"
            >
              Konti y'Iduka
            </Link>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={15} />
            <input
              type="text"
              placeholder="Shakisha ibicuruzwa, amaduka..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-none text-xs focus:ring-2 focus:ring-primary focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Subheader / Category Navigation ── */}
      <div className="border-b border-slate-200/80 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === "all"
                ? "bg-primary text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Byose (All Categories)
          </button>

          {RWANDAN_BUSINESS_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>{cat.nameRw}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground">Kureba:</span>
            <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode("products")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  viewMode === "products"
                    ? "bg-white dark:bg-slate-900 text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Ibicuruzwa ({filteredProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode("stores")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  viewMode === "stores"
                    ? "bg-white dark:bg-slate-900 text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Amaduka ({filteredStores.length})
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary w-3.5 h-3.5"
              />
              <span>Ibyo muri Stock gusa</span>
            </label>

            <div className="flex items-center gap-1.5 border-l border-border/60 pl-2.5">
              <ArrowUpDown size={13} className="text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="newest">Ibishya mbere</option>
                <option value="price_asc">Igiciro: Gito - Kinini</option>
                <option value="price_desc">Igiciro: Kinini - Gito</option>
                <option value="name_asc">Izina: A kugeza Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Products Grid View ── */}
        {viewMode === "products" && (
          <>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-3">
                <Package size={36} className="mx-auto text-slate-400" />
                <h3 className="font-bold text-sm">Nta bicuruzwa bihagaze muri iki cyiciro</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Gerageza guhindura ijambo ryo gushakisha cyangwa uhitemo "Byose".
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setInStockOnly(false);
                  }}
                  className="text-xs mt-2"
                >
                  Gusubiza ibipimo kuri Byose
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {filteredProducts.map((product) => {
                  const inStock = product.quantity > 0;
                  return (
                    <div
                      key={product.id}
                      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between"
                    >
                      {/* Product Image / Placeholder Card */}
                      <div
                        onClick={() => handleOpenDetail(product)}
                        className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center p-4 cursor-pointer overflow-hidden"
                      >
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.item_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Tag size={24} />
                          </div>
                        )}

                        {/* Top Stock Badge */}
                        <div className="absolute top-2 left-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight backdrop-blur-md ${
                              inStock
                                ? "bg-emerald-500/90 text-white"
                                : "bg-destructive/90 text-white"
                            }`}
                          >
                            {inStock ? `${product.quantity} ${product.unit || "pcs"}` : "Byashize"}
                          </span>
                        </div>
                      </div>

                      {/* Details & Actions */}
                      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
                            <Link
                              to={`/store/${product.shop_code}`}
                              className="font-medium text-primary hover:underline truncate max-w-[120px]"
                              title={product.shop_name}
                            >
                              {product.shop_name}
                            </Link>
                            <span className="shrink-0">{product.unit || "pcs"}</span>
                          </div>

                          <h3
                            onClick={() => handleOpenDetail(product)}
                            className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 mt-1 cursor-pointer hover:text-primary transition-colors"
                          >
                            {product.item_name}
                          </h3>

                          {product.variant_label && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] bg-slate-100 dark:bg-slate-800 text-muted-foreground font-mono">
                              {product.variant_label}
                            </span>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-1">
                          <div className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                            {formatCurrency(product.selling_price)}
                          </div>

                          <Button
                            size="sm"
                            disabled={!inStock}
                            onClick={() => handleQuickAdd(product)}
                            className="h-7 px-2.5 rounded-lg btn-navy text-[11px] font-bold"
                          >
                            Gura
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Stores Grid View ── */}
        {viewMode === "stores" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredStores.map((st) => (
              <div
                key={st.id}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 overflow-hidden">
                    {st.store_logo_url ? (
                      <img
                        src={st.store_logo_url}
                        alt={st.business_name || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store size={22} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {st.business_name || "Iduka"}
                    </h3>
                    <p className="text-[11px] text-primary font-mono font-semibold">
                      {st.shop_code}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {getCategoryLabel(st.business_category, "rw")}
                    </p>
                  </div>
                </div>

                {st.store_description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {st.store_description}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {st.product_count || 0} ibicuruzwa
                  </span>
                  <Link
                    to={`/store/${st.shop_code}`}
                    className="font-bold text-primary flex items-center gap-1 hover:underline"
                  >
                    <span>Sura Iduka</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Product Detail Modal ── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[90] sella-overlay flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90dvh]">
            <div className="p-4 border-b border-border/60 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">{selectedProduct.item_name}</h3>
                <p className="text-xs text-muted-foreground">{selectedProduct.shop_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="aspect-video w-full rounded-2xl bg-muted/40 flex items-center justify-center overflow-hidden">
                {selectedProduct.image_url ? (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.item_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Tag size={40} className="text-muted-foreground/40" />
                )}
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-xl font-black text-primary tabular-nums">
                  {formatCurrency(selectedProduct.selling_price)}
                </span>
                <span className="text-muted-foreground font-medium">
                  Mu bubiko: {selectedProduct.quantity} {selectedProduct.unit || "pcs"}
                </span>
              </div>

              {selectedProduct.description && (
                <div>
                  <p className="font-semibold text-muted-foreground mb-1">Ibisobanuro</p>
                  <p className="text-slate-700 dark:text-slate-300">
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              {/* Specifications / Warranty */}
              {(selectedProduct.warranty || selectedProduct.dimensions || selectedProduct.material) && (
                <div className="p-3 rounded-xl bg-muted/40 space-y-1.5">
                  <p className="font-semibold text-foreground">Ibiranga iki gicuruzwa (Specs):</p>
                  {selectedProduct.warranty && (
                    <p className="text-muted-foreground">
                      Garanti: <span className="font-medium text-foreground">{selectedProduct.warranty}</span>
                    </p>
                  )}
                  {selectedProduct.dimensions && (
                    <p className="text-muted-foreground">
                      Ingano/Ibipimo: <span className="font-medium text-foreground">{selectedProduct.dimensions}</span>
                    </p>
                  )}
                  {selectedProduct.material && (
                    <p className="text-muted-foreground">
                      Ibikoresho: <span className="font-medium text-foreground">{selectedProduct.material}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Quantity selector */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <span className="font-semibold">Umubare ushaka (Quantity):</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-sm tabular-nums">
                    {orderQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setOrderQuantity(Math.min(selectedProduct.quantity, orderQuantity + 1))
                    }
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border/60 bg-muted/20 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 text-xs h-10"
                onClick={() => setSelectedProduct(null)}
              >
                Funga
              </Button>
              <Button
                disabled={selectedProduct.quantity <= 0}
                className="flex-[1.5] btn-navy text-xs font-bold h-10"
                onClick={handleDetailAdd}
              >
                Ongeramo mu Gaseke
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-over Cart & Checkout Modals ── */}
      <CartSheet onProceedToCheckout={() => setIsCheckoutOpen(true)} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
    </div>
  );
}
