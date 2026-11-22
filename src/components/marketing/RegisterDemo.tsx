import { useState } from "react";
import { t, type CatalogueId } from "@/i18n";
import { useAppLanguage } from "@/i18n/useAppLanguage";

const PRICE = 9000;
const QTY = 2;
const TOTAL = PRICE * QTY;
const PAID = 12000;
const OWED = TOTAL - PAID;
const START = 8;
const LEFT = START - QTY;

type View = "sale" | "debt" | "stock";

const TABS: { id: View; label: CatalogueId }[] = [
  { id: "sale", label: "WEB-010" as CatalogueId },
  { id: "debt", label: "WEB-011" as CatalogueId },
  { id: "stock", label: "WEB-012" as CatalogueId },
];

function francs(amount: number) {
  return `${new Intl.NumberFormat("en-RW").format(amount)} RWF`;
}

export function RegisterDemo() {
  const lang = useAppLanguage();
  const [view, setView] = useState<View>("sale");
  const [played, setPlayed] = useState(true);

  const stock = played ? LEFT : START;
  const owed = played ? OWED : 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-[#4B4B4B]">{t("WEB-008" as CatalogueId)}</p>
        <button
          type="button"
          className="h-10 rounded-md border border-[#E6E6E6] bg-white px-3 text-[13px] font-medium"
          onClick={() => {
            setPlayed(false);
            setView("sale");
          }}
        >
          {t("WEB-009" as CatalogueId)}
        </button>
      </div>
      <div className="sella-glass-edge overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-[#E6E6E6] bg-white px-4 py-3">
          <p className="text-[13px] font-semibold">Isabune</p>
          <p className="text-[15px] font-semibold tabular-nums">{francs(played ? TOTAL : 0)}</p>
        </div>
        <div className="flex gap-1 border-b border-[#E6E6E6] bg-white px-2 py-2" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={view === tab.id}
              className={`h-10 rounded-md px-3 text-[13px] font-medium ${view === tab.id ? "sella-tab-on" : "text-[#4B4B4B]"}`}
              onClick={() => setView(tab.id)}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>
        <div className="sella-move bg-white p-4" key={`${view}-${played}-${lang}`}>
          {view === "sale" && (
            <div className="space-y-3 text-[14px]">
              <div className="flex justify-between"><span>Isabune</span><span className="tabular-nums">{QTY} × {francs(PRICE)}</span></div>
              <div className="flex justify-between border-t border-[#F0F0F0] pt-3"><span>{t("SALE-012" as CatalogueId)}</span><span className="font-semibold tabular-nums">{francs(TOTAL)}</span></div>
              <div className="flex justify-between"><span>{t("SALE-015" as CatalogueId)}</span><span className="tabular-nums">{played ? francs(PAID) : "—"}</span></div>
              <div className="flex justify-between"><span>{t("SALE-019" as CatalogueId)}</span><span className="font-semibold tabular-nums">{francs(owed)}</span></div>
              {!played && (
                <button type="button" className="mt-2 h-11 w-full rounded-md bg-[#0B3FCC] text-sm font-semibold text-white" onClick={() => setPlayed(true)}>
                  {t("WEB-013" as CatalogueId)}
                </button>
              )}
            </div>
          )}
          {view === "debt" && (
            <div className="space-y-2 text-[14px]">
              <p className="text-[#4B4B4B]">{t("WEB-011" as CatalogueId)}</p>
              <p className="text-[28px] font-semibold tabular-nums">{francs(owed)}</p>
              <p className="text-[13px] text-[#4B4B4B]">{played ? "Umukiliya w'igerageza" : t("CLI-012" as CatalogueId)}</p>
            </div>
          )}
          {view === "stock" && (
            <div className="space-y-2 text-[14px]">
              <p>Isabune</p>
              <p className="text-[28px] font-semibold tabular-nums">{t("SALE-004" as CatalogueId, lang, { count: stock })}</p>
              <p className="text-[13px] text-[#4B4B4B]">{played ? `${START} → ${LEFT}` : `${START}`}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
