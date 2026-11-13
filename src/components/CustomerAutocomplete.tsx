import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CustomerSuggestion {
  name: string;
  phone: string | null;
}

interface CustomerAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (customer: CustomerSuggestion) => void;
  suggestions: CustomerSuggestion[];
  placeholder?: string;
  className?: string;
}

export function CustomerAutocomplete({
  value,
  onChange,
  onSelect,
  suggestions = [],
  placeholder,
  className,
}: CustomerAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState<CustomerSuggestion[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = value.trim().toLowerCase();
    if (query.length >= 2) {
      const list = Array.isArray(suggestions) ? suggestions : [];
      const filtered = list
        .filter((s) => typeof s?.name === "string" && s.name.toLowerCase().includes(query))
        .slice(0, 5);
      setActiveSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setActiveSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value, suggestions]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (customer: CustomerSuggestion) => {
    onSelect(customer);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative min-w-0">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={cn("bg-white/50 input-glow min-w-0", className)}
        onFocus={() => {
          if (activeSuggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
      />
      {showSuggestions && activeSuggestions.length > 0 && (
        <div className="sella-popup-glass absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl">
          {activeSuggestions.map((customer, index) => (
            <button
              key={`${customer.name}-${customer.phone ?? ""}-${index}`}
              type="button"
              onClick={() => handleSelect(customer)}
              className="w-full px-3 py-2.5 text-left hover:bg-muted transition-colors flex justify-between items-center gap-2 min-w-0"
            >
              <span className="font-medium text-sm truncate">{customer.name}</span>
              {customer.phone && (
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {customer.phone}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
