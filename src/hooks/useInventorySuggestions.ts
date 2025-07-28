import { useState, useEffect, useCallback } from "react";
import { listInventory, updateInventoryItem } from "@/db/api";
import type { InventoryItem as DbInventoryItem } from "@/db/types";

export type InventoryItem = DbInventoryItem;

export const useInventorySuggestions = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listInventory();
      setItems(data.filter((i) => i.quantity > 0).sort((a, b) => a.item_name.localeCompare(b.item_name)));
    } catch (error) {
      console.error("Inventory suggestions error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const decreaseQuantity = async (itemName: string, quantitySold: number = 1) => {
    const item = items.find((i) => i.item_name.toLowerCase() === itemName.toLowerCase());
    if (!item) return false;

    const newQuantity = Math.max(0, item.quantity - quantitySold);

    try {
      await updateInventoryItem(item.id, { quantity: newQuantity });
      setItems((prev) =>
        prev
          .map((i) => (i.id === item.id ? { ...i, quantity: newQuantity } : i))
          .filter((i) => i.quantity > 0)
      );
      return true;
    } catch {
      return false;
    }
  };

  const getItemByName = (name: string) => {
    return items.find((i) => i.item_name.toLowerCase() === name.toLowerCase());
  };

  return { items, isLoading, fetchItems, decreaseQuantity, getItemByName };
}
