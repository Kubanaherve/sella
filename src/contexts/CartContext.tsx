import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/kinyarwanda";

export interface CartItem {
  id: string; // unique item variation ID: `${inventoryItemId}-${variation || 'default'}`
  inventoryItemId?: string | null;
  shopCode: string;
  shopName: string;
  itemName: string;
  price: number;
  quantity: number;
  maxStock?: number;
  variation?: string | null;
  imageUrl?: string | null;
  unit?: string | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalAmountRwf: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "sella_marketplace_cart_v1";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Cart storage write error:", e);
    }
  }, [items]);

  const addItem = (newItem: Omit<CartItem, "id">) => {
    const id = `${newItem.inventoryItemId || newItem.itemName}-${newItem.variation || "default"}`;

    setItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        const nextQty = existing.quantity + newItem.quantity;
        if (existing.maxStock != null && nextQty > existing.maxStock) {
          toast.warning(`Mu bubiko hasigaye ibigera kuri ${existing.maxStock}`);
          return prev;
        }
        toast.success(`Byongerewe mu gaseke (${nextQty})`);
        return prev.map((i) => (i.id === id ? { ...i, quantity: nextQty } : i));
      }

      toast.success(`${newItem.itemName} byashyizwe mu gaseke`);
      return [...prev, { ...newItem, id }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.info("Byakuwe mu gaseke");
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const next = i.quantity + delta;
            if (next <= 0) return null;
            if (i.maxStock != null && next > i.maxStock) {
              toast.warning(`Mu bubiko hasigaye ${i.maxStock}`);
              return i;
            }
            return { ...i, quantity: next };
          }
          return i;
        })
        .filter((i): i is CartItem => i !== null)
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalAmountRwf = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        totalAmountRwf,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
};
