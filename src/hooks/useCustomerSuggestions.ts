import { useState, useEffect, useMemo } from "react";
import { listClients } from "@/db/api";

interface CustomerSuggestion {
  name: string;
  phone: string | null;
}

export function useCustomerSuggestions() {
  const [customers, setCustomers] = useState<CustomerSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await listClients();
        const uniqueCustomers = data.reduce((acc, customer) => {
          const existing = acc.find(
            (c) => c.name.toLowerCase() === customer.name.toLowerCase()
          );
          if (!existing) {
            acc.push({ name: customer.name, phone: customer.phone });
          }
          return acc;
        }, [] as CustomerSuggestion[]);
        setCustomers(uniqueCustomers);
      } catch (error) {
        console.error("Customer suggestions error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const getSuggestions = useMemo(() => {
    return (query: string): CustomerSuggestion[] => {
      if (!query.trim()) return [];
      const lowerQuery = query.toLowerCase();
      return customers
        .filter((c) => c.name.toLowerCase().includes(lowerQuery))
        .slice(0, 5);
    };
  }, [customers]);

  const getCustomerByName = (name: string): CustomerSuggestion | undefined => {
    return customers.find((c) => c.name.toLowerCase() === name.toLowerCase());
  };

  return { customers, getSuggestions, getCustomerByName, isLoading };
}
