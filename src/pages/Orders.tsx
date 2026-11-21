import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMarketplaceOrders, updateMarketplaceOrderStatus } from "@/db/api";
import type { MarketplaceOrder, MarketplaceOrderStatus } from "@/db/types";
import { orderPreparingMessage } from "@/i18n/customerMessages";
import { formatCurrency } from "@/lib/kinyarwanda";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Phone,
  MessageCircle,
  XCircle,
  RefreshCw,
  Search,
  ExternalLink,
} from "lucide-react";

type OrderTab = "all" | "pending" | "preparing" | "ready" | "completed" | "cancelled";

export default function OrdersPage() {
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listMarketplaceOrders();
      setOrders(data);
    } catch (e) {
      console.error("Orders list error:", e);
      toast.error("Habaye ikosa mu gufata komande");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (
    orderId: string,
    newStatus: MarketplaceOrderStatus,
    paid = false
  ) => {
    setUpdatingId(orderId);
    try {
      const updated = await updateMarketplaceOrderStatus(
        orderId,
        newStatus,
        paid ? "paid" : undefined
      );
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      toast.success(`Status ya komande yahinduwe: ${newStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ikosa mu guhindura status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab !== "all" && o.status !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q);
      if (!match) return false;
    }
    return true;
  });

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  return (
    <div className="sella-page">
      <PageHeader
        title="Komande z'Isoko (Orders)"
        subtitle={`${counts.pending} zitegereje kwemezwa · ${counts.all} zose hamwe`}
        right={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            className="h-9 px-3 text-xs flex items-center gap-1.5 btn-navy"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Kuvugurura</span>
          </Button>
        }
      />

      <div className="sella-page-body space-y-4">
        {/* Search & Tabs */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={15} />
            <input
              type="text"
              placeholder="Shakisha nimero ya komande, izina, telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-9 rounded-xl sella-input-glass text-xs focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs pb-1">
            {[
              { id: "all", label: "Byose", count: counts.all },
              { id: "pending", label: "Itegereje", count: counts.pending },
              { id: "preparing", label: "Iri Gutegurwa", count: counts.preparing },
              { id: "ready", label: "Yiteguye", count: counts.ready },
              { id: "completed", label: "Yarangiye", count: counts.completed },
              { id: "cancelled", label: "Yarahagaritswe", count: counts.cancelled },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as OrderTab)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15 dark:bg-white/15">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 p-6 rounded-3xl glass-card border border-border/60 space-y-2">
            <ShoppingBag size={32} className="mx-auto text-muted-foreground" />
            <p className="font-semibold text-xs">Nta komande zibonetse hano</p>
            <p className="text-[11px] text-muted-foreground">
              Abakiriya nibatumiza ibicuruzwa ku isoko biraza kugaragara hano.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isBusy = updatingId === order.id;
              return (
                <div
                  key={order.id}
                  className="glass-card rounded-2xl border border-border/70 p-4 space-y-3 shadow-xs"
                >
                  {/* Top Bar of Card */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-primary">
                          {order.order_number}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            order.status === "completed"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : order.status === "cancelled"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-primary/15 text-primary"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(order.created_at).toLocaleString("rw-RW")}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-sm tabular-nums text-foreground">
                        {formatCurrency(order.total_amount)}
                      </p>
                      <span className="text-[10px] font-semibold text-muted-foreground capitalize">
                        {order.delivery_type === "pickup" ? "Kwidurira mu iduka" : "Kukugezaho"}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info & Contact */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-bold text-foreground">{order.customer_name}</p>
                      <p className="text-muted-foreground font-mono">{order.customer_phone}</p>
                      {order.delivery_address && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Aderesi: {order.delivery_address}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="h-8 px-2.5 rounded-lg border border-border bg-background flex items-center gap-1 font-bold text-[11px] hover:bg-muted"
                      >
                        <Phone size={12} className="text-primary" />
                        <span>Hamagara</span>
                      </a>
                      <a
                        href={`https://wa.me/${order.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(orderPreparingMessage(order.customer_name, order.order_number))}`}
                        target="_blank"
                        rel="noreferrer"
                        className="h-8 px-2.5 rounded-lg bg-emerald-600 text-white flex items-center gap-1 font-bold text-[11px] hover:bg-emerald-700"
                      >
                        <MessageCircle size={12} />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Items List */}
                  {order.items && order.items.length > 0 && (
                    <div className="bg-muted/30 rounded-xl p-2.5 space-y-1.5 text-xs">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-[11px]">
                          <span>
                            {item.quantity}× {item.item_name}
                            {item.selected_variation ? ` (${item.selected_variation})` : ""}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatCurrency(item.total_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-1 flex flex-wrap items-center justify-end gap-1.5 border-t border-border/40">
                    {order.status === "pending" && (
                      <Button
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleStatusChange(order.id, "confirmed")}
                        className="h-8 text-xs font-bold btn-navy"
                      >
                        <CheckCircle2 size={13} className="mr-1" />
                        Emeza Komande
                      </Button>
                    )}

                    {order.status === "confirmed" && (
                      <Button
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleStatusChange(order.id, "preparing")}
                        className="h-8 text-xs font-bold btn-navy"
                      >
                        <Package size={13} className="mr-1" />
                        Tangira Kuyitegura
                      </Button>
                    )}

                    {order.status === "preparing" && (
                      <Button
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleStatusChange(order.id, "ready")}
                        className="h-8 text-xs font-bold btn-navy"
                      >
                        <Truck size={13} className="mr-1" />
                        Yiteguye / Mu Nzira
                      </Button>
                    )}

                    {order.status === "ready" && (
                      <Button
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleStatusChange(order.id, "completed", true)}
                        className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 size={13} className="mr-1" />
                        Yarangiye & Yishyuwe
                      </Button>
                    )}

                    {order.status !== "completed" && order.status !== "cancelled" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => {
                          if (confirm("Urashaka guhagarika iyi komande?")) {
                            void handleStatusChange(order.id, "cancelled");
                          }
                        }}
                        className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <XCircle size={13} className="mr-1" />
                        Hagarika
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
