import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { findShopByCode, type ShopInfo } from "@/lib/staff";
import { listMarketplaceProducts } from "@/db/api";
import type { InventoryItem, Profile } from "@/db/types";
import { useCart } from "@/contexts/CartContext";
import { CartSheet } from "@/components/marketplace/CartSheet";
import { CheckoutModal } from "@/components/marketplace/CheckoutModal";
import { getCategoryLabel } from "@/lib/businessCategories";
import { formatCurrency } from "@/lib/kinyarwanda";
import { Button } from "@/components/ui/button";
import {
  Store,
  MapPin,
  Phone,
  MessageCircle,
  Copy,
  Check,
  ShoppingBag,
  ArrowLeft,
  Tag,
  Package,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Seo } from "@/components/marketing/Seo";

export default function StoreProfilePage() {
  const { shopCode: rawShopCode } = useParams<{ shopCode: string }>();
  const { addItem, totalCount, setIsCartOpen } = useCart();

  const [shop, setShop] = useState<(ShopInfo & Partial<Profile>) | null>(null);
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [copiedCode, setCopiedCode] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    async function loadStore() {
      if (!rawShopCode) return;
      setIsLoading(true);
      try {
        const found = await findShopByCode(rawShopCode);
        setShop(found);

        const allProducts = await listMarketplaceProducts();
        const storeProducts = allProducts.filter(
          (p) =>
            (p.shop_code || "").toLowerCase() === rawShopCode.toLowerCase() ||
            p.profile_id === found.ownerId
        );
        setProducts(storeProducts);
      } catch (err) {
        console.error("Store profile error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    void loadStore();
  }, [rawShopCode]);

  const handleCopyCode = () => {
    if (!shop?.shopCode) return;
    navigator.clipboard.writeText(shop.shopCode);
    setCopiedCode(true);
    toast.success("Shop Code copied!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddToCart = (product: InventoryItem) => {
    if (!shop) return;
    addItem({
      inventoryItemId: product.id,
      shopCode: shop.shopCode,
      shopName: shop.businessName,
      itemName: product.item_name,
      price: product.selling_price,
      quantity: 1,
      maxStock: product.quantity,
      unit: product.unit,
      variation: product.variant_label || null,
      imageUrl: product.image_url || null,
    });
  };

  const categories = Array.from(
    new Set(products.map((p) => p.category?.trim()).filter(Boolean))
  );

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "all" && p.category?.trim() !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] text-slate-900 dark:text-slate-100 selection:bg-[#1A6FFF] selection:text-white pb-16">
      <Seo
        title={`${shop?.businessName || "Iduka"} — Sella Storefront`}
        description={`Sura ${shop?.businessName || "iduka"} ku isoko rya Sella. Reba ibicuruzwa n'ibiciro ubikande ukoresheje MoMo cyangwa Airtel.`}
        path={`/store/${rawShopCode || ""}`}
      />

      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to="/marketplace"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
            <span>Garuka ku Isoko</span>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCartOpen(true)}
            className="relative h-8 px-3 text-xs font-bold btn-navy flex items-center gap-1.5"
          >
            <ShoppingBag size={14} />
            <span>Agaseke</span>
            {totalCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-bold">
                {totalCount}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Banner / Store Header */}
      <div className="relative bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-b border-border/40 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/10 flex items-center justify-center text-primary text-2xl font-black shrink-0 overflow-hidden">
              {shop?.store_logo_url ? (
                <img
                  src={shop.store_logo_url}
                  alt={shop.businessName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store size={36} />
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {shop?.businessName || "Iduka"}
                </h1>
                {shop?.shopCode && (
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary flex items-center gap-1 hover:bg-primary/20"
                    title="Copy Shop Code"
                  >
                    <span>{shop.shopCode}</span>
                    {copiedCode ? (
                      <Check size={12} className="text-emerald-500" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {shop?.business_category && (
                  <span className="inline-flex items-center gap-1 text-foreground font-medium">
                    <Tag size={12} className="text-primary" />
                    {getCategoryLabel(shop.business_category, "rw")}
                  </span>
                )}
                {shop?.ownerName && <span>Nyiri iduka: {shop.ownerName}</span>}
                {shop?.store_address && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} />
                    {shop.store_address}
                  </span>
                )}
                {shop?.store_tin && (
                  <span className="inline-flex items-center gap-1 font-mono">
                    <FileText size={12} />
                    TIN: {shop.store_tin}
                  </span>
                )}
              </div>

              {shop?.store_description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl pt-1">
                  {shop.store_description}
                </p>
              )}
            </div>

            {/* Direct Contact Buttons */}
            {shop?.phone && (
              <div className="flex sm:flex-col gap-2 shrink-0 pt-2 sm:pt-0">
                <a
                  href={`tel:${shop.phone}`}
                  className="px-3 py-2 rounded-xl border border-border bg-white dark:bg-slate-900 text-xs font-bold flex items-center gap-1.5 hover:bg-muted"
                >
                  <Phone size={13} className="text-primary" />
                  <span>Hamagara</span>
                </a>
                <a
                  href={`https://wa.me/${shop.phone.replace(/\D/g, "")}?text=Muraho%20${encodeURIComponent(shop.businessName)}%2C%20nabonye%20iduka%20ryanyu%20kuri%20Sella`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <MessageCircle size={13} />
                  <span>WhatsApp</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <h2 className="font-bold text-base">
            Ibicuruzwa biboneka ({filteredProducts.length})
          </h2>

          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-2.5 py-1 rounded-lg font-semibold ${
                  selectedCategory === "all"
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Byose
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCategory(c!)}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap ${
                    selectedCategory === c
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 p-4 rounded-2xl border border-dashed border-border space-y-2">
            <Package size={32} className="mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-xs">Iki kiciro nta bicuruzwa birimo</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredProducts.map((p) => {
              const inStock = p.quantity > 0;
              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-border/70 p-3.5 flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square rounded-xl bg-muted/40 flex items-center justify-center overflow-hidden">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.item_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Tag size={28} className="text-muted-foreground/30" />
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground">
                      {p.category || p.unit || "pcs"}
                    </span>
                    <h3 className="font-bold text-xs line-clamp-2 mt-0.5">{p.item_name}</h3>
                    {p.variant_label && (
                      <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-muted font-mono">
                        {p.variant_label}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="font-black text-xs tabular-nums">
                      {formatCurrency(p.selling_price)}
                    </span>
                    <Button
                      size="sm"
                      disabled={!inStock}
                      onClick={() => handleAddToCart(p)}
                      className="h-7 px-2.5 rounded-lg btn-navy text-[10px] font-bold"
                    >
                      {inStock ? "Gura" : "Byashize"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <CartSheet onProceedToCheckout={() => setIsCheckoutOpen(true)} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
    </div>
  );
}
