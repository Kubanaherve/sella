import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMarketplaceOrder, listMarketplaceOrders } from "@/db/api";
import type { MarketplaceOrder } from "@/db/types";
import { formatCurrency } from "@/lib/kinyarwanda";
import { normalizePhoneE164 } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Store,
  CreditCard,
  ShoppingBag,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Seo } from "@/components/marketing/Seo";

export default function CustomerOrdersPage() {
  const { orderId } = useParams<{ orderId?: string }>();

  const [searchKey, setSearchKey] = useState(orderId || "");
  const [order, setOrder] = useState<MarketplaceOrder | null>(null);
  const [recentOrders, setRecentOrders] = useState<MarketplaceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchOrder = async (key: string) => {
    if (!key.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await getMarketplaceOrder(key.trim());
      setOrder(res);
    } catch (e) {
      console.error(e);
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      void fetchOrder(orderId);
    } else {
      // Load recent orders from local storage/database
      void listMarketplaceOrders().then((list) => {
        setRecentOrders(list.slice(0, 5));
      });
    }
  }, [orderId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchOrder(searchKey);
  };

  const statusSteps = [
    { key: "pending", label: "Itegereje", desc: "Order placed" },
    { key: "confirmed", label: "Yemejwe", desc: "Confirmed by shop" },
    { key: "preparing", label: "Iri Gutegurwa", desc: "Packing / Preparing" },
    { key: "ready", label: "Yiteguye", desc: "Ready for pickup / Out for delivery" },
    { key: "completed", label: "Yarangiye", desc: "Delivered & Completed" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "pending":
        return 0;
      case "confirmed":
        return 1;
      case "preparing":
        return 2;
      case "ready":
        return 3;
      case "completed":
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = order ? getStepIndex(order.status) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] text-slate-900 dark:text-slate-100 selection:bg-[#1A6FFF] selection:text-white pb-16">
      <Seo
        title="Gukurikirana Komande (Order Tracking) — Sella"
        description="Reba aho komande yawe igeze, igihe igereza mu ntoki zawe, n'ibisubizo byo kwishyura."
        path="/orders"
      />

      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to="/marketplace"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
            <span>Garuka ku Isoko</span>
          </Link>

          <Link
            to="/marketplace"
            className="text-xs font-bold text-primary hover:underline"
          >
            Sella Isoko
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Gukurikirana Komande yawe
          </h1>
          <p className="text-xs text-muted-foreground">
            Andika nimero ya komande (urugero: ORD-XXXX) kugira ngo urebe aho igeze
          </p>
        </div>

        {/* Search input form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-muted-foreground" size={16} />
            <Input
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              placeholder="Andika nimero ya komande (ORD-...)"
              className="pl-10 h-11 text-xs font-mono"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="btn-navy h-11 px-5 text-xs font-bold">
            Shakisha
          </Button>
        </form>

        {/* Order Details View */}
        {isLoading ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-border flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : order ? (
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-lg space-y-6">
            {/* Order Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Komande
                </span>
                <h2 className="text-lg font-black font-mono text-primary">{order.order_number}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Iduka: <span className="font-semibold text-foreground">{order.shop_name}</span> (
                  {order.shop_code})
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Yose hamwe
                </span>
                <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(order.total_amount)}
                </p>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    order.payment_status === "paid"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-amber-500/10 text-amber-600"
                  }`}
                >
                  {order.payment_status === "paid" ? "Yishyuwe" : "Itegereje Kwishyurwa"}
                </span>
              </div>
            </div>

            {/* Stepper / Timeline */}
            <div className="space-y-3">
              <p className="font-bold text-xs">Aho Komande Igeze:</p>
              <div className="grid grid-cols-5 gap-1.5 text-center">
                {statusSteps.map((step, idx) => {
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;
                  return (
                    <div key={step.key} className="space-y-1">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isDone
                            ? "bg-primary"
                            : "bg-slate-200 dark:bg-slate-800"
                        } ${isCurrent ? "ring-2 ring-primary/40 ring-offset-1" : ""}`}
                      />
                      <p
                        className={`text-[10px] font-bold leading-tight ${
                          isDone ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery & Items details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-border/40">
              <div className="p-3.5 rounded-2xl bg-muted/30 space-y-1.5">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <Truck size={13} className="text-primary" />
                  Kugezwaho Ibicuruzwa
                </p>
                <p className="text-muted-foreground">
                  Uburyo:{" "}
                  <span className="font-semibold text-foreground capitalize">
                    {order.delivery_type === "pickup" ? "Kwidurira mu Iduka" : "Kukugezaho"}
                  </span>
                </p>
                {order.delivery_address && (
                  <p className="text-muted-foreground">
                    Aderesi: <span className="font-semibold text-foreground">{order.delivery_address}</span>
                  </p>
                )}
                <p className="text-muted-foreground">
                  Telefone: <span className="font-semibold text-foreground font-mono">{order.customer_phone}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/30 space-y-1.5">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <CreditCard size={13} className="text-primary" />
                  Kwishyura
                </p>
                <p className="text-muted-foreground">
                  Uburyo:{" "}
                  <span className="font-semibold text-foreground uppercase">
                    {order.payment_method}
                  </span>
                </p>
                {order.payment_reference && (
                  <p className="text-muted-foreground">
                    Ref: <span className="font-mono text-foreground">{order.payment_reference}</span>
                  </p>
                )}
                <p className="text-muted-foreground">
                  Igihe cyo gukora:{" "}
                  <span className="text-foreground">
                    {new Date(order.created_at).toLocaleString("rw-RW")}
                  </span>
                </p>
              </div>
            </div>

            {/* Items List */}
            {order.items && order.items.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
                <p className="font-bold">Ibicuruzwa biri muri iyi Komande:</p>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-border/60 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold">{item.item_name}</p>
                        {item.selected_variation && (
                          <p className="text-[10px] text-muted-foreground">
                            {item.selected_variation}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <span className="font-bold tabular-nums">
                        {formatCurrency(item.total_price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : hasSearched ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border space-y-2">
            <AlertCircle size={32} className="mx-auto text-muted-foreground" />
            <h3 className="font-bold text-sm">Komande ntibonetse</h3>
            <p className="text-xs text-muted-foreground">
              Reba neza ko wanditse nimero nyayo ya komande (urugero: ORD-XXXX)
            </p>
          </div>
        ) : (
          recentOrders.length > 0 && (
            <div className="space-y-3 pt-4">
              <p className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
                Komande zaherutse kuri iki gikoresho
              </p>
              <div className="space-y-2">
                {recentOrders.map((ro) => (
                  <button
                    key={ro.id}
                    type="button"
                    onClick={() => {
                      setSearchKey(ro.order_number);
                      void fetchOrder(ro.order_number);
                    }}
                    className="w-full p-3 rounded-2xl border border-border/70 bg-white dark:bg-slate-900 text-left flex items-center justify-between hover:border-primary transition-all text-xs"
                  >
                    <div>
                      <p className="font-bold font-mono text-primary">{ro.order_number}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {ro.shop_name} · {formatCurrency(ro.total_amount)}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                      {ro.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}
