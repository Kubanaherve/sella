import { useState } from "react";
import {
  CreditCard,
  MessageCircle,
  Package,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Printer,
  ShieldCheck,
  Send,
  User,
} from "lucide-react";
import { useAppLanguage } from "@/i18n/useAppLanguage";

export type DemoView = "sale" | "debt" | "stock";

export function RegisterTaskDemo() {
  const lang = useAppLanguage();
  const rw = lang === "rw";

  const [activeView, setActiveView] = useState<DemoView>("sale");
  const [played, setPlayed] = useState(true);

  // Consistent transaction data
  const item = {
    name: "Igitenge Wax Hollandais",
    sku: "WAX-HOL-01",
    unitPrice: 9000,
    startStock: 8,
    qtySold: 2,
    totalSale: 18000,
    momoPaid: 12000,
    debtBalance: 6000,
    endStock: 6,
    customer: "Umukiliya w'igerageza",
      };

  const stockNow = played ? item.endStock : item.startStock;
  const owedNow = played ? item.debtBalance : 0;
  const paidNow = played ? item.momoPaid : 0;

  const handleReset = () => {
    setPlayed(false);
    setActiveView("sale");
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden text-slate-900 font-sans">
      {/* Top Demo Banner: Clearly labeled as interactive local preview */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-700">
            {rw ? "Urugero nyarwanda rwo muri shop" : "Live interactive counter task"}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">
            {rw
              ? "Urugero: Ibikoresho 8 muri sitoki → Kugurisha 2 kuri 9,000 RWF (Yose: 18,000 RWF)"
              : "Scenario: 8 units in stock → Sell 2 @ 9,000 RWF (Total: 18,000 RWF)"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          title={rw ? "Ongera utangire" : "Replay scenario"}
        >
          <RotateCcw size={12} />
          <span>{rw ? "Ongera utangire" : "Replay"}</span>
        </button>
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-200 bg-white px-4 pt-3 flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => setActiveView("sale")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeView === "sale"
              ? "border-[#0B3FCC] text-[#0B3FCC] bg-blue-50/40 rounded-t-lg"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg"
          }`}
        >
          <CreditCard size={15} />
          <span>{rw ? "1. Igurisha (Counter Sale)" : "1. Register Sale"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView("debt")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeView === "debt"
              ? "border-[#0B3FCC] text-[#0B3FCC] bg-blue-50/40 rounded-t-lg"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg"
          }`}
        >
          <MessageCircle size={15} />
          <span>{rw ? "2. Ideni & WhatsApp" : "2. Customer Credit (Ideni)"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView("stock")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeView === "stock"
              ? "border-[#0B3FCC] text-[#0B3FCC] bg-blue-50/40 rounded-t-lg"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg"
          }`}
        >
          <Package size={15} />
          <span>{rw ? "3. Ububiko (Stock)" : "3. Stock Tracker"}</span>
        </button>
      </div>

      {/* Transaction Cross-View Summary Anchor */}
      <div className="bg-slate-50/70 border-b border-slate-200/80 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="font-mono font-semibold text-slate-900">Sale #184</span>
          <span>·</span>
          <span>{item.name} (×{item.qtySold})</span>
          <span>·</span>
          <span className="font-mono font-bold text-slate-900">
            {item.totalSale.toLocaleString("en-RW")} RWF
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            MTN MoMo: {paidNow.toLocaleString("en-RW")} RWF
          </span>
          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Ideni: {owedNow.toLocaleString("en-RW")} RWF
          </span>
          <span className="text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Stock Left: {stockNow}
          </span>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="p-4 sm:p-6">
        {/* ── VIEW 1: IGURISHA / SALE ── */}
        {activeView === "sale" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {rw ? "Igurisha rishya ku meza (Counter Checkout)" : "New Counter Sale Checkout"}
                </h4>
                <p className="text-xs text-slate-500">
                  {rw
                    ? "Ubwishyu buvanze: Umukiliya yishyuye igice kuri MoMo, asigarana ideni."
                    : "Split payment: Customer pays partial via MoMo (*182#), balance saved to credit."}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>{played ? (rw ? "Igurisha ryemejwe" : "Sale recorded") : (rw ? "Ntirarandikwa" : "Not recorded yet")}</span>
              {!played && (
                <button type="button" className="h-10 rounded-md bg-[#0B3FCC] px-3 text-xs font-semibold text-white" onClick={() => setPlayed(true)}>
                  {rw ? "Andika iri gurisha" : "Record this sale"}
                </button>
              )}
              </span>
            </div>

            {/* Receipt / Register Card */}
            <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center text-xs text-slate-600 font-mono">
                <span>RESI #184 · Karegeya Boutique</span>
                <span>Kigali, Rwanda</span>
              </div>

              <div className="p-4 space-y-3">
                {/* Cart Line */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-sm">
                  <div>
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {item.qtySold} × {item.unitPrice.toLocaleString("en-RW")} RWF
                    </div>
                  </div>
                  <div className="font-mono font-bold text-slate-900">
                    {item.totalSale.toLocaleString("en-RW")} RWF
                  </div>
                </div>

                {/* Subtotal & Split Details */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{rw ? "Igiteranyo cyose (Total due)" : "Total due"}</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {item.totalSale.toLocaleString("en-RW")} RWF
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                    <span className="flex items-center gap-1.5">
                      <Smartphone size={13} className="text-[#0B3FCC]" />
                      <span>{rw ? "MTN MoMo (*182#) yakiriwe" : "MTN MoMo received"}</span>

                    </span>
                    <span className="font-mono font-semibold text-emerald-700">
                      {paidNow.toLocaleString("en-RW")} RWF
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-700 bg-amber-50/70 p-2 rounded-lg border border-amber-200/80">
                    <span className="flex items-center gap-1.5">
                      <User size={13} className="text-amber-700" />
                      <span>
                        {rw ? "Ideni ryanditswe kuri" : "Credit balance for"}{" "}
                        <strong>{item.customer}</strong>
                      </span>
                    </span>
                    <span className="font-mono font-bold text-amber-800">
                      {owedNow.toLocaleString("en-RW")} RWF
                    </span>
                  </div>
                </div>

                {/* Next Step Action */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveView("debt")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B3FCC] hover:underline"
                  >
                    <span>{rw ? "Reba uko byageze mu bitabo by'amadeni" : "See debt ledger record"}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 2: IDENI / DEBT LEDGER ── */}
        {activeView === "debt" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {rw ? "Igitabo cy'amadeni (Ideni) n'ubutumwa bwa WhatsApp" : "Customer Debt Ledger & WhatsApp"}
                </h4>
                <p className="text-xs text-slate-500">
                  {rw
                    ? (played ? "Ideni rya 6,000 RWF riri ku mukiliya w'igerageza." : "Nta deni rirandikwa. Andika igurisha mbere.")
                    : (played ? "6,000 RWF is still owed on this sample customer." : "No credit yet. Record the sample sale first.")}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 self-start sm:self-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{rw ? "Ideni ritarishyurwa" : "Outstanding Debt"}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Customer Account Card */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h5 className="font-bold text-sm text-slate-900">{item.customer}</h5>
                    <p className="text-xs text-slate-500">{played ? (rw ? "Urugero" : "Sample") : (rw ? "Ntarandikwa" : "Not recorded")}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      {rw ? "Ideni ryose" : "Total Due"}
                    </span>
                    <span className="text-base font-mono font-bold text-amber-700">
                      {owedNow.toLocaleString("en-RW")} RWF
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{rw ? "Ideni rya mbere" : "Previous balance"}</span>
                    <span className="font-mono">0 RWF</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-semibold">
                    <span>{rw ? "Sale #184 (Uyu munsi)" : "Sale #184 (Today)"}</span>
                    <span className="font-mono text-amber-800">
                      +{owedNow.toLocaleString("en-RW")} RWF
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                    <span>{rw ? "Igihe byafatiwe" : "Date recorded"}</span>
                    <span>{new Date().toLocaleDateString("fr-RW")}</span>
                  </div>
                </div>
              </div>

              {/* Right: WhatsApp 1-Tap Reminder Preview */}
              <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/40 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <MessageCircle size={15} className="text-emerald-600" />
                    <span>{rw ? "Ubutumwa bwa WhatsApp bwo kwibutsa" : "1-Tap WhatsApp Reminder Preview"}</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-emerald-200 text-xs text-slate-700 leading-relaxed font-sans shadow-2xs">
                    "Muraho {item.customer}! Tubibukije ko mufite ideni rya{" "}
                    <strong>{owedNow.toLocaleString("en-RW")} RWF</strong> muri Karegeya Boutique
                    ku bicuruzwa bya {item.name}. Mwishyure kuri MoMo 0788... Murakoze!"
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">
                    {rw ? "Kanda ohereze nta kiguzi" : "Opens WhatsApp directly"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveView("stock")}
                    className="inline-flex items-center gap-1 font-semibold text-[#0B3FCC] hover:underline"
                  >
                    <span>{rw ? "Komeza ku bubiko (Stock)" : "Next: Check stock"}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 3: UBUBIKO / STOCK TRACKER ── */}
        {activeView === "stock" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {rw ? "Ububiko buhita buvugururwa (Stock Inventory)" : "Live Inventory & Stock Deduction"}
                </h4>
                <p className="text-xs text-slate-500">
                  {rw
                    ? "Kugurisha 2 byagabanije sitoki iva ku 8 isigara kuri 6 mu buryo bwikora."
                    : "Selling 2 units deducted inventory from 8 to 6 automatically."}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200 self-start sm:self-auto">
                <CheckCircle2 size={13} className="text-[#0B3FCC]" />
                <span>{rw ? "Sitoki yavuguruwe" : "Stock Synced"}</span>
              </span>
            </div>

            {/* Inventory Row Card */}
            <div className="border border-slate-200 rounded-xl bg-white p-4 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h5 className="font-bold text-sm text-slate-900">{item.name}</h5>
                  <p className="text-xs text-slate-500 font-mono">SKU: {item.sku}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    {rw ? "Igiciro cyo kugurisha" : "Unit Price"}
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {item.unitPrice.toLocaleString("en-RW")} RWF
                  </span>
                </div>
              </div>

              {/* Before vs After Stock Counters */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    {rw ? "Sitoki yatangiye" : "Starting Stock"}
                  </span>
                  <span className="text-xl font-mono font-bold text-slate-700">
                    {item.startStock}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{rw ? "Ibipimo" : "units"}</span>
                </div>

                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                  <span className="text-[10px] uppercase font-semibold text-amber-700 block">
                    {rw ? "Ibyagurishijwe (#184)" : "Sold (Sale #184)"}
                  </span>
                  <span className="text-xl font-mono font-bold text-amber-800">
                    -{item.qtySold}
                  </span>
                  <span className="text-[10px] text-amber-700 block">{rw ? "Ibipimo" : "units"}</span>
                </div>

                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                  <span className="text-[10px] uppercase font-semibold text-[#0B3FCC] block">
                    {rw ? "Sitoki isigaye" : "Remaining Stock"}
                  </span>
                  <span className="text-xl font-mono font-bold text-[#0B3FCC]">
                    {stockNow}
                  </span>
                  <span className="text-[10px] text-blue-600 block">{rw ? "Hasigaye muri shop" : "in shop now"}</span>
                </div>
              </div>

              {/* Total Stock Value Calculation */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  {rw ? "Agaciro k'ibisigaye muri sitoki (6 × 9,000 RWF):" : "Remaining inventory asset value (6 × 9,000 RWF):"}
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {(item.endStock * item.unitPrice).toLocaleString("en-RW")} RWF
                </span>
              </div>
            </div>

            {/* Loop Back Action */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {rw
                  ? "Sella ihuza igurisha, amadeni, na sitoki mu gikoresho kimwe."
                  : "The sale, the credit, and the stock stay on the same sample."}
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 font-semibold text-[#0B3FCC] hover:underline"
              >
                <RotateCcw size={13} />
                <span>{rw ? "Ongera ugerageze kuva ku ntangiriro" : "Replay from beginning"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
