import React from "react";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency } from "@/lib/kinyarwanda";
import { Button } from "@/components/ui/button";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";

interface CartSheetProps {
  onProceedToCheckout: () => void;
}

export const CartSheet: React.FC<CartSheetProps> = ({ onProceedToCheckout }) => {
  const { items, updateQuantity, removeItem, clearCart, totalCount, totalAmountRwf, isCartOpen, setIsCartOpen } =
    useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] sella-overlay flex justify-end">
      <div
        className="fixed inset-0"
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-white/10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base">Agaseke k'Ibicuruzwa (Cart)</h2>
              <p className="text-xs text-muted-foreground">{totalCount} ibintu byatoranyijwe</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <ShoppingBag size={28} className="text-slate-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Agaseke nta kintu kirimo</p>
                <p className="text-xs mt-1">Shakisha ibicuruzwa ku isoko maze ubyongeremo.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCartOpen(false)}
                className="mt-2 text-xs"
              >
                Gukomeza Guhaha
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Ibicuruzwa
                </span>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] text-destructive hover:underline"
                >
                  Gusiba Byose
                </button>
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate">{item.itemName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {item.shopName} {item.variation ? `· ${item.variation}` : ""}
                    </p>
                    <p className="text-xs font-bold text-primary mt-0.5 tabular-nums">
                      {formatCurrency(item.price)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center font-bold text-xs tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="w-7 h-7 ml-1 rounded-lg text-destructive/70 hover:text-destructive flex items-center justify-center"
                      title="Siba"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 space-y-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Ibyatoranyijwe:</span>
                <span>{totalCount} items</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-white/10">
                <span>Amafaranga Yose hamwe:</span>
                <span className="text-[#0B3FCC] dark:text-[#3B82F6] tabular-nums">
                  {formatCurrency(totalAmountRwf)}
                </span>
              </div>
            </div>

            <Button
              className="w-full btn-navy h-11 text-xs font-bold flex items-center justify-center gap-2"
              onClick={() => {
                setIsCartOpen(false);
                onProceedToCheckout();
              }}
            >
              <span>Komeza kuri Checkout</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
