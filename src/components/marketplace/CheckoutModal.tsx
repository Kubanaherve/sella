import React, { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency } from "@/lib/kinyarwanda";
import { normalizePhoneE164 } from "@/lib/phone";
import { createMarketplaceOrder } from "@/db/api";
import type { MarketplaceDeliveryType, MarketplaceOrder, PaymentMethod } from "@/db/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  X,
  CheckCircle2,
  Phone,
  User,
  MapPin,
  Store,
  Truck,
  CreditCard,
  Copy,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { items, totalAmountRwf, clearCart } = useCart();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<MarketplaceDeliveryType>("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("momo");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<MarketplaceOrder | null>(null);
  const [copiedOrder, setCopiedOrder] = useState(false);

  if (!isOpen) return null;

  const handleCopyOrderNumber = () => {
    if (!completedOrder) return;
    navigator.clipboard.writeText(completedOrder.order_number);
    setCopiedOrder(true);
    toast.success("Order number copied!");
    setTimeout(() => setCopiedOrder(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || customerName.trim().length < 2) {
      toast.error("Andika amazina yawe neza");
      return;
    }

    const normPhone = normalizePhoneE164(customerPhone);
    if (!normPhone) {
      toast.error("Andika numero ya telefone nyayo y'u Rwanda (urugero: 0788... cyangwa 079...)");
      return;
    }

    if (deliveryType === "delivery" && !deliveryAddress.trim()) {
      toast.error("Andika aderesi yo kugezaho ibicuruzwa (Akarere, Umurenge, Akagari, cyangwa Inzira)");
      return;
    }

    if (items.length === 0) {
      toast.error("Agaseke nta bicuruzwa birimo");
      return;
    }

    setIsSubmitting(true);
    try {
      // Primary shop code from first item in cart
      const shopCode = items[0]?.shopCode || "SEL-GENERAL";

      const order = await createMarketplaceOrder({
        shopCode,
        customerName: customerName.trim(),
        customerPhone: normPhone,
        deliveryType,
        deliveryAddress: deliveryType === "delivery" ? deliveryAddress.trim() : null,
        paymentMethod,
        notes: notes.trim() || null,
        items: items.map((i) => ({
          inventoryItemId: i.inventoryItemId || null,
          itemName: i.itemName,
          quantity: i.quantity,
          unitPrice: i.price,
          selectedVariation: i.variation || null,
        })),
      });

      setCompletedOrder(order);
      clearCart();
      toast.success("Komande yoherejwe neza mu iduka!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Habaye ikosa mu kohereza komande");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] sella-overlay flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 max-h-[92dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              {completedOrder ? "Komande Yemejwe!" : "Kuzuza Komande (Checkout)"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {completedOrder ? "Nimero ya komande yaremwe" : "Amafaranga yose hamwe: " + formatCurrency(totalAmountRwf)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {completedOrder ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Murakoze, Komande Yakiriwe!
                </h3>
                <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                  Nyir'iduka yakiriye komande yawe. Bari gutegura ibicuruzwa byawe.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/80 bg-slate-50 dark:bg-white/[0.02] max-w-sm mx-auto space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nimero ya Komande:</span>
                  <button
                    type="button"
                    onClick={handleCopyOrderNumber}
                    className="font-mono font-bold text-primary flex items-center gap-1 hover:underline"
                  >
                    <span>{completedOrder.order_number}</span>
                    {copiedOrder ? (
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Umuguzi:</span>
                  <span className="font-semibold">{completedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefone:</span>
                  <span className="font-semibold">{completedOrder.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uburyo bwo kuyakira:</span>
                  <span className="font-semibold capitalize">
                    {completedOrder.delivery_type === "pickup" ? "Kwidurira mu iduka" : "Kukugezaho"}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border/60 font-bold">
                  <span>Yose hamwe:</span>
                  <span className="text-primary tabular-nums">
                    {formatCurrency(completedOrder.total_amount)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center max-w-sm mx-auto">
                <Button
                  className="btn-navy h-10 text-xs font-bold w-full"
                  onClick={() => {
                    onClose();
                    navigate(`/orders/${completedOrder.order_number}`);
                  }}
                >
                  Kora Track ya Komande
                </Button>
                <Button
                  variant="outline"
                  className="h-10 text-xs w-full"
                  onClick={onClose}
                >
                  Funga
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer Info */}
              <div className="space-y-3">
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-border/40 pb-1">
                  <User size={13} className="text-primary" />
                  Amakuru y'Umuguzi (Customer Details)
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-foreground block mb-1 font-medium">
                      Amazina yose / Full Name *
                    </label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Jean Claude Munyaneza"
                      className="h-9 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground block mb-1 font-medium flex items-center gap-1">
                      <Phone size={12} />
                      Telefone (MTN cyangwa Airtel) *
                    </label>
                    <Input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="078... cyangwa 079..."
                      className="h-9 text-xs font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Choice */}
              <div className="space-y-2">
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-border/40 pb-1">
                  <Truck size={13} className="text-primary" />
                  Uburyo bwo Kwakira Ibicuruzwa (Fulfillment)
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeliveryType("pickup")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      deliveryType === "pickup"
                        ? "border-primary bg-primary/5 text-primary font-semibold ring-1 ring-primary/40"
                        : "border-border/70 hover:bg-muted/50"
                    }`}
                  >
                    <Store size={16} className="mb-1" />
                    <p className="font-semibold text-xs">Kwidurira mu Iduka</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Pickup at store (Ubuntu)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType("delivery")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      deliveryType === "delivery"
                        ? "border-primary bg-primary/5 text-primary font-semibold ring-1 ring-primary/40"
                        : "border-border/70 hover:bg-muted/50"
                    }`}
                  >
                    <Truck size={16} className="mb-1" />
                    <p className="font-semibold text-xs">Kukugezaho</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Delivery to address</p>
                  </button>
                </div>

                {deliveryType === "delivery" && (
                  <div className="pt-1">
                    <label className="text-muted-foreground block mb-1 font-medium flex items-center gap-1">
                      <MapPin size={12} />
                      Aderesi n'Aho Iduka Rizakugezaho *
                    </label>
                    <Input
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Akarere (e.g. Gasabo, Kicukiro), Umurenge, Inzu/Inzira"
                      className="h-9 text-xs"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-border/40 pb-1">
                  <CreditCard size={13} className="text-primary" />
                  Uburyo bwo Kwishyura (Payment Method)
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "momo", label: "MTN MoMo", sub: "*182*8*1#" },
                    { id: "airtel", label: "Airtel Money", sub: "*500*1#" },
                    { id: "cash", label: "Cash / Izo Muri Ntoki", sub: "Pay on delivery" },
                    { id: "bank", label: "Bank Transfer", sub: "Zigama / BK" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        paymentMethod === m.id
                          ? "border-primary bg-primary/5 text-primary font-semibold ring-1 ring-primary/30"
                          : "border-border/70 hover:bg-muted/50"
                      }`}
                    >
                      <p className="font-semibold text-xs">{m.label}</p>
                      <p className="text-[10px] text-muted-foreground">{m.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <label className="text-muted-foreground block mb-1 font-medium">
                  Ibyifuzo Byihariye / Special Order Notes
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Urugero: Muzantelefone mbere yo kuza, cyangwa ibara ryeru gusa"
                  className="h-9 text-xs"
                />
              </div>

              {/* Order Summary & Submit */}
              <div className="pt-2 border-t border-border/60 space-y-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span>Amafaranga Yose Agiye Kwishyurwa:</span>
                  <span className="text-[#0B3FCC] dark:text-[#3B82F6] tabular-nums text-base">
                    {formatCurrency(totalAmountRwf)}
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-navy h-11 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={16} />
                  <span>{isSubmitting ? "Iri kohereza komande..." : "Emeza Komande Nonaha"}</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
