import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { labels } from "@/lib/kinyarwanda";
import {
  DESKTOP_GROUPS,
  type DesktopNavItem,
} from "@/components/desktop/desktopNav";
import { isNativeApp } from "@/lib/platform";
import { useAccountStatus } from "@/contexts/AccountStatusContext";

type Action = {
  id: string;
  label: string;
  hint?: string;
  keys?: string;
  keywords?: string;
  icon: typeof Plus;
  run: () => void;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: DesktopNavItem[];
  canWrite: boolean;
};

export function CommandPalette({ open, onOpenChange, items, canWrite }: Props) {
  const navigate = useNavigate();
  const { openAccountStatusModal } = useAccountStatus();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const actions = useMemo<Action[]>(() => {
    const jump: Action[] = items.map((item) => ({
      id: item.id,
      label: item.label,
      hint: item.hint,
      keys: item.keys,
      keywords: `${item.keywords ?? ""} ${item.label}`,
      icon: item.icon,
      run: () => {
        if (item.id === "billing" && isNativeApp()) {
          openAccountStatusModal("Billing");
          return;
        }
        navigate(item.to);
      },
    }));
    const extra: Action[] = canWrite
      ? [
          {
            id: "new-sale",
            label: labels.newSale,
            hint: "Fungura agatebo",
            keys: "⌘N",
            keywords: "new sale igurisha checkout",
            icon: Plus,
            run: () => navigate("/new-sale"),
          },
        ]
      : [];
    return [...extra, ...jump];
  }, [items, canWrite, navigate, openAccountStatusModal]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((action) =>
      `${action.label} ${action.hint ?? ""} ${action.keywords ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [actions, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [active, filtered.length]);

  const choose = (action: Action | undefined) => {
    if (!action) return;
    onOpenChange(false);
    action.run();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sella-command-dialog max-w-xl gap-0 overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Shakisha</DialogTitle>
          <DialogDescription>
            Jya ku rupapuro cyangwa utangire igurisha rishya.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-border/70 px-4">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Shakisha ibikoresho, cyangwa jya ahandi…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                choose(filtered[active]);
              }
            }}
          />
        </div>
        <div ref={listRef} className="max-h-[min(24rem,50vh)] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nta kintu gihuye na «{query.trim()}».
            </p>
          ) : (
            DESKTOP_GROUPS.map((group) => {
              const groupItems = filtered.filter((action) => {
                if (action.id === "new-sale") return group.id === "work";
                return items.find((item) => item.id === action.id)?.group === group.id;
              });
              if (groupItems.length === 0) return null;
              return (
                <div key={group.id} className="mb-1">
                  <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                  {groupItems.map((action) => {
                    const index = filtered.indexOf(action);
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        data-index={index}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left",
                          index === active
                            ? "bg-primary/10 text-foreground"
                            : "text-foreground hover:bg-muted/70"
                        )}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => choose(action)}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">
                            {action.label}
                          </span>
                          {action.hint && (
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {action.hint}
                            </span>
                          )}
                        </span>
                        {action.keys && (
                          <kbd className="sella-kbd">{action.keys.replace("⌘", modLabel())}</kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-center gap-3 border-t border-border/70 px-4 py-2 text-[11px] text-muted-foreground">
          <span>
            <kbd className="sella-kbd">↑↓</kbd> hitamo
          </span>
          <span>
            <kbd className="sella-kbd">Enter</kbd> fungura
          </span>
          <span>
            <kbd className="sella-kbd">Esc</kbd> funga
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function modLabel(): string {
  if (typeof navigator === "undefined") return "Ctrl";
  return /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl";
}
