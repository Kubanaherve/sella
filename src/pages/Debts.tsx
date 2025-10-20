import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { labels, formatCurrency, formatDate } from "@/lib/kinyarwanda";
import { getDateKeyFromIso } from "@/lib/reporting";
import { deleteDebt, listActiveDebts, recordPayment } from "@/db/api";
import type { PaymentMethod } from "@/db/types";
import { useAuth } from "@/contexts/AuthContext";
import { WriteGate } from "@/components/WriteGate";
import { toast } from "sonner";
import PaymentModal from "@/components/PaymentModal";
import {
  Plus,
  Phone,
  MessageCircle,
  Check,
  Users,
  Trash2,
  Download,
  FileText,
  List,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ListPageSkeleton } from "@/components/ListPageSkeleton";
import { hapticSuccess } from "@/lib/haptics";
import {
  buildDebtWhatsAppMessage,
  downloadDebtReportPdf,
  downloadInvoicePdf,
  formatItemsParen,
  type InvoiceData,
  type InvoiceLine,
} from "@/lib/invoicePdf";
import { getAppLanguage } from "@/lib/appLanguage";
import {
  openPdfBlob,
  runDebtReminderShare,
  shareDebtReminderNative,
  type ReminderStatus,
} from "@/lib/whatsappReminder";
import { WhatsAppReminderOverlay } from "@/components/WhatsAppReminderOverlay";
import { BrandMark } from "@/components/BrandMark";

interface Customer {
  id: string;
  name: string | null;
  phone: string | null;
  items: string | null;
  amount: number | null;
  due_date: string | null;
  is_paid: boolean;
  created_at: string;
  line_items: InvoiceLine[];
  total_amount?: number;
}

const PAGE_SIZE = 50;

const DebtsPage = () => {
  const navigate = useNavigate();
  const { canWrite, profile } = useAuth();

  const shopName =
    (profile && "business_name" in profile && profile.business_name) ||
    (profile && "display_name" in profile && profile.display_name) ||
    "Sella";
  const shopPhone =
    (profile && "phone" in profile && profile.phone) ||
    (profile && "phone_normalized" in profile && profile.phone_normalized) ||
    "";
  const shopEmail =
    profile && "email" in profile ? (profile.email as string | null) : null;
  const payPhone = shopPhone || "—";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{
    list: Customer[];
    grandTotal: number;
    today: string;
  } | null>(null);
  const [clientInvoicePreview, setClientInvoicePreview] = useState(false);
  const [reminderStatus, setReminderStatus] = useState<ReminderStatus>("idle");
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [reminderCustomerName, setReminderCustomerName] = useState<string | null>(
    null
  );
  const preparedReminderRef = useRef<{
    message: string;
    fileName: string;
    blob: Blob;
    waDigits: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const isMobileDevice = () =>
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const canSendSMS = () => {
    if (!isMobileDevice()) {
      toast.error("SMS ntishobora koherezwa kuri desktop, gerageza kuri telefone.");
      return false;
    }
    return true;
  };

  const mapDebtToCustomer = (
    debt: Awaited<ReturnType<typeof listActiveDebts>>[number]
  ): Customer => ({
    id: debt.id,
    name: debt.client_name || "Unknown",
    phone: debt.client_phone || null,
    items: debt.items_label || "",
    amount: debt.remaining_balance ?? 0,
    due_date: debt.due_date || null,
    is_paid: false,
    created_at: debt.created_at,
    total_amount: debt.total_amount,
    line_items: (debt.line_items || []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      takenAt: i.created_at,
    })),
  });

  const invoiceFromCustomer = (c: Customer): InvoiceData => {
    const total = c.total_amount ?? c.amount ?? 0;
    const remaining = c.amount ?? 0;
    const paid = Math.max(0, total - remaining);
    return {
      invoiceNumber: `INV-${c.id.slice(0, 8).toUpperCase()}`,
      createdAt: c.created_at,
      dueDate: c.due_date,
      shopName: String(shopName),
      shopPhone: String(shopPhone),
      shopEmail,
      shopLocation: "Kigali, Rwanda",
      customerName: c.name || "Umukiriya",
      customerPhone: c.phone,
      customerLocation: "Kigali, Rwanda",
      lines: c.line_items.length
        ? c.line_items
        : [
            {
              name: c.items || "Ideni",
              quantity: 1,
              unitPrice: c.amount || 0,
              takenAt: c.created_at,
            },
          ],
      total,
      remaining,
      paid,
      payPhone: String(payPhone),
      kind: "invoice",
      status: remaining <= 0 ? "paid" : paid > 0 ? "partial" : "credit",
      language: getAppLanguage(),
    };
  };

  const itemsParenFor = (c: Customer) =>
    formatItemsParen(
      c.line_items.length
        ? c.line_items
        : [{ name: c.items || "Ibintu", quantity: 1, unitPrice: c.amount || 0 }]
    );

  const debtMessageFor = (c: Customer) =>
    buildDebtWhatsAppMessage({
      itemsParen: itemsParenFor(c),
      shopName: String(shopName),
      payPhone: String(payPhone),
    });

  // ── Fetch paginated customers ──────────────────────────────────────────────
  const fetchCustomers = useCallback(async (pageNumber = 1, query = "") => {
    setLoading(true);
    try {
      const debts = await listActiveDebts();
      let mapped = debts.map(mapDebtToCustomer);

      if (query) {
        const q = query.toLowerCase();
        mapped = mapped.filter((c) => (c.name || "").toLowerCase().includes(q));
      }

      setAllCustomers(mapped);
      const pageSlice = mapped.slice(0, pageNumber * PAGE_SIZE);
      setCustomers(pageSlice);
      setHasMore(pageSlice.length < mapped.length);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Habaye ikosa mu gufata amakuru");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(1, searchQuery);
    setPage(1);
  }, [fetchCustomers, searchQuery]);

  // ── Infinite scroll ────────────────────────────────────────────────────────
  const handleScroll = () => {
    if (!containerRef.current || loading || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      const nextPage = page + 1;
      const pageSlice = allCustomers.slice(0, nextPage * PAGE_SIZE);
      setCustomers(pageSlice);
      setHasMore(pageSlice.length < allCustomers.length);
      setPage(nextPage);
    }
  };

  // ── Parse items stored as JSON ─────────────────────────────────────────────
  const parseItems = (raw: string | null): string => {
    if (!raw) return "Ntabwo byanditswe";
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return "Ntabwo byanditswe";
        // ["Gold ring 2", "Bracelet 1"]  ← string array
        if (typeof parsed[0] === "string") return parsed.join(", ");
        // [{name, quantity}]             ← object array
        if (typeof parsed[0] === "object") {
          return parsed
            .map((p: { name?: string; quantity?: number }) =>
              `${p.name ?? "?"} x${p.quantity ?? 1}`
            )
            .join(", ");
        }
      }
      return String(raw);
    } catch {
      return String(raw);
    }
  };

  const openPdfPreview = async () => {
    try {
      const debts = await listActiveDebts();
      const list = debts.map(mapDebtToCustomer);
      const grandTotal = list.reduce((sum, c) => sum + Number(c.amount || 0), 0);
      const today = new Date().toLocaleDateString("fr-RW", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      setPdfPreview({ list, grandTotal, today });
    } catch {
      toast.error("Habaye ikosa mu gutegura preview");
    }
  };

  // ── Download full PDF (shared glass design system) ────────────────────────
  const downloadFullList = async (fromPreview?: {
    list: Customer[];
    grandTotal: number;
    today: string;
  }) => {
    setIsDownloading(true);
    toast.info("Gutegura PDF...");

    try {
      let list = fromPreview?.list;
      let grandTotal = fromPreview?.grandTotal ?? 0;
      let today = fromPreview?.today ?? "";
      if (!list) {
        const debts = await listActiveDebts();
        list = debts.map(mapDebtToCustomer);
        grandTotal = list.reduce((sum, c) => sum + Number(c.amount || 0), 0);
        today = new Date().toLocaleDateString(
          getAppLanguage() === "en" ? "en-GB" : "fr-RW",
          { year: "numeric", month: "long", day: "numeric" }
        );
      }

      await downloadDebtReportPdf(
        {
          shopName: String(shopName),
          shopPhone: String(shopPhone || ""),
          shopEmail,
          shopLocation: "Kigali, Rwanda",
          shopPayPhone: String(payPhone || shopPhone || ""),
          reportDate: today,
          generatedAtIso: new Date().toISOString(),
          grandTotal,
          language: getAppLanguage(),
          rows: list.map((c) => {
            const original = Number(c.total_amount ?? c.amount ?? 0);
            const remaining = Number(c.amount || 0);
            const paid = Math.max(0, original - remaining);
            return {
              name: c.name || "—",
              phone: c.phone,
              createdAt: c.created_at,
              dueDate: c.due_date,
              originalAmount: original,
              paidAmount: paid,
              remainingAmount: remaining,
              status:
                remaining <= 0 ? "paid" : paid > 0 ? "partial" : "credit",
              lines: c.line_items.length
                ? c.line_items
                : [
                    {
                      name: parseItems(c.items),
                      quantity: 1,
                      unitPrice: remaining,
                      takenAt: c.created_at,
                    },
                  ],
            };
          }),
        },
        `ideni-sella-${new Date().toISOString().split("T")[0]}.pdf`
      );

      toast.success(`PDF y'abakiriya ${list.length} yamanitswe!`);
      setPdfPreview(null);
    } catch (err) {
      console.error("PDF error:", err);
      toast.error("Habaye ikosa mu gutegura PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Communication handlers ─────────────────────────────────────────────────
  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone.replace(/\s/g, "")}`;
  };

  const handleSMS = (customer: Customer) => {
    if (!customer.phone) return toast.error("Umukiriya nta numero afite");
    if (!canSendSMS()) return;
    const message = debtMessageFor(customer);
    window.location.href = `sms:${customer.phone.replace(/\s/g, "")}?body=${encodeURIComponent(message)}`;
  };

  /**
   * One-tap WhatsApp reminder:
   * refresh debt → validate phone → build latest PDF + Kinyarwanda message → native share.
   * Shop owner only presses Send in WhatsApp.
   */
  const handleWhatsAppReminder = async (customer: Customer) => {
    setReminderCustomerName(customer.name);
    setReminderError(null);
    preparedReminderRef.current = null;
    setReminderStatus("preparing");

    try {
      // Always use the freshest outstanding debt from the database
      const debts = await listActiveDebts();
      const fresh = debts.find((d) => d.id === customer.id);
      const source = fresh ? mapDebtToCustomer(fresh) : customer;
      const remaining = source.amount ?? 0;

      if (remaining <= 0) {
        setReminderStatus("error");
        setReminderError(
          "Uyu mukiriya nta deni asigaye. Nta ubutumwa bwo kwibutsa bukenewe."
        );
        return;
      }

      const invoice = invoiceFromCustomer(source);
      const result = await runDebtReminderShare({
        invoice,
        remaining,
        onStatus: (s, detail) => {
          setReminderStatus(s);
          if (detail) setReminderError(detail);
        },
      });

      if (result.prepared) {
        preparedReminderRef.current = {
          message: result.prepared.message,
          fileName: result.prepared.fileName,
          blob: result.prepared.blob,
          waDigits: result.prepared.waDigits,
        };
      }

      if (result.error && !result.prepared) {
        setReminderStatus("error");
        setReminderError(result.error);
        return;
      }

      if (
        result.share?.ok &&
        result.share.mode !== "whatsapp_text" &&
        result.share.mode !== "saved_fallback"
      ) {
        setReminderStatus("idle");
        toast.success("Hitamo WhatsApp, hanyuma kanda Send");
        return;
      }

      if (preparedReminderRef.current) {
        setReminderStatus("fallback");
        setReminderError(
          "PDF n'ubutumwa biri ready. Kanda « Share PDF and Message »."
        );
      }
    } catch (e) {
      console.error(e);
      setReminderStatus("error");
      setReminderError(
        preparedReminderRef.current
          ? "Gusangira byanze. PDF iracyariho — kanda Share cyangwa Fungura PDF."
          : "Ntibashoboye gutegura statement. Ongera ugerageze."
      );
    }
  };

  const retrySharePreparedReminder = async () => {
    const prepared = preparedReminderRef.current;
    if (!prepared) {
      setReminderStatus("error");
      setReminderError("Nta PDF yabitswe. Ongera utangire.");
      return;
    }
    setReminderStatus("opening");
    setReminderError(null);
    try {
      const share = await shareDebtReminderNative(prepared);
      if (share.ok && share.mode !== "whatsapp_text" && share.mode !== "saved_fallback") {
        setReminderStatus("idle");
        toast.success("Hitamo WhatsApp, hanyuma kanda Send");
        return;
      }
      setReminderStatus("fallback");
      setReminderError(
        "Kanda « Share PDF and Message » cyangwa fungura PDF."
      );
    } catch (e) {
      console.error(e);
      setReminderStatus("fallback");
      setReminderError("Gusangira byanze. Gerageza Share cyangwa Fungura PDF.");
    }
  };

  const openPreparedReminderPdf = () => {
    const prepared = preparedReminderRef.current;
    if (!prepared) {
      toast.error("Nta PDF yabitswe");
      return;
    }
    openPdfBlob(prepared.blob, prepared.fileName);
  };

  const downloadClientInvoice = async (customer: Customer) => {
    setIsDownloading(true);
    try {
      await downloadInvoicePdf(invoiceFromCustomer(customer));
      toast.success("Invoice PDF yamanitswe");
      setClientInvoicePreview(false);
    } catch (e) {
      console.error(e);
      toast.error("Ntibashoboye gutegura PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const openPayment = (customer: Customer) => {
    if (!customer.phone) {
      toast.warning("Ntushobora kohereza ubutumwa kuri uyu mukiriya mbere yo kwishyura.");
    }
    // Close stacked overlays first so Kwishyura isn't trapped under the debt card
    setClientInvoicePreview(false);
    setSelectedCustomer(customer);
    setPaymentModalOpen(true);
  };

  // ── Payment handler ────────────────────────────────────────────────────────
  const handlePayment = async (
    paymentAmount: number,
    thankYouMessage: string,
    paymentMethod: PaymentMethod,
    referenceNumber: string | null = null
  ) => {
    if (!selectedCustomer) return;
    if (!canWrite) {
      toast.error("Subscription yarangiye — jya kuri Billing wishyure to record payments");
      return;
    }

    // ✅ WhatsApp FIRST — synchronous before any await (avoids popup blocker)
    if (selectedCustomer.phone) {
      let cleanPhone = selectedCustomer.phone.replace(/\s/g, "");
      if (cleanPhone.startsWith("0")) cleanPhone = "250" + cleanPhone.substring(1);
      else if (!cleanPhone.startsWith("250") && !cleanPhone.startsWith("+"))
        cleanPhone = "250" + cleanPhone;
      cleanPhone = cleanPhone.replace("+", "");

      const remainingPreview = (selectedCustomer.amount || 0) - paymentAmount;
      const message =
        remainingPreview <= 0
          ? thankYouMessage
          : `${thankYouMessage}\n\nAmafaranga asigaye: ${formatCurrency(remainingPreview)}`;

      window.open(
        `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
        "_blank"
      );
    }

    try {
      const todayKey = getDateKeyFromIso(new Date().toISOString());

      await recordPayment({
        debtId: selectedCustomer.id,
        amount: paymentAmount,
        paymentMethod,
        notes: thankYouMessage,
        referenceNumber,
      });

      await hapticSuccess();
      toast.success("Byashyizweho neza");
      setPaymentModalOpen(false);
      setSelectedCustomer(null);
      setClientInvoicePreview(false);
      fetchCustomers(1, searchQuery);
      setPage(1);

      window.dispatchEvent(
        new CustomEvent("paymentMade", {
          detail: {
            paymentAmount,
            affectsTodayDebt:
              getDateKeyFromIso(selectedCustomer.created_at) === todayKey,
          },
        })
      );
    } catch (err) {
      console.error("Payment error:", err);
      toast.error(err instanceof Error ? err.message : "Habaye ikosa mu kwishyura");
    }
  };

  // ── Delete handler ─────────────────────────────────────────────────────────
  const handleDelete = async (customer: Customer) => {
    if (!canWrite) {
      toast.error("Subscription yarangiye — jya kuri Billing wishyure to delete");
      return;
    }
    if (!confirm(`${labels.confirmDelete} ${customer.name}?`)) return;

    try {
      await deleteDebt(customer.id);

      toast.success("Byasibwe neza kandi inventory yongerewe");
      setSelectedCustomer(null);
      fetchCustomers(1, searchQuery);
      setPage(1);
      window.dispatchEvent(new CustomEvent("inventoryUpdated"));
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Habaye ikosa");
    }
  };

  const totalUnpaid = customers.reduce((sum, c) => sum + (c.amount || 0), 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="sella-page">
      <PageHeader
        title={labels.debtList}
        hideBack
        right={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => void openPdfPreview()}
              disabled={isDownloading}
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/5"
            >
              <FileText size={14} />
              PDF
            </Button>
            <Button
              onClick={() => navigate("/new-sale")}
              size="sm"
              className="btn-navy h-8 px-3 text-xs"
            >
              <Plus size={14} className="mr-1" />
              {labels.addNew}
            </Button>
          </div>
        }
      />

      <main
        className="sella-page-body space-y-4 overflow-auto"
        ref={containerRef}
        onScroll={handleScroll}
      >
        {!canWrite && <WriteGate actionLabel="Kwishyura cyangwa gusiba ideni" />}
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={labels.search + "..."}
          className="pl-3 bg-white border-slate-200 input-glow"
        />

        <div className="rounded-2xl p-4 flex items-center justify-between shadow-navy text-white bg-gradient-to-br from-[#0b4fd9] to-[#1a6fff]">
          <div>
            <p className="text-xs text-white/75">{labels.totalDebt}</p>
            <p className="text-xl font-bold tabular-nums">
              {formatCurrency(totalUnpaid)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void openPdfPreview()}
              disabled={isDownloading}
              className="flex items-center gap-1 text-xs text-white/85 hover:text-white transition-colors bg-white/15 rounded-full px-2.5 py-1.5"
              title="Reba PDF mbere"
            >
              <FileText size={14} />
              <span className="text-[11px]">PDF</span>
            </button>
            <div className="flex items-center gap-1 text-white/80">
              <Users size={16} />
              <span className="text-sm">{customers.length}</span>
            </div>
          </div>
        </div>

        {loading && customers.length === 0 ? (
          <ListPageSkeleton rows={5} />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={List}
            title={labels.noDebts}
            description="Kora igurisha rishya (credit) kugira ngo utangire gukurikirana ideni."
            actionLabel={labels.newSale}
            onAction={() => navigate("/new-sale")}
          />
        ) : (
          <div className="space-y-2">
            {customers.map((customer) => (
              <button
                type="button"
                key={customer.id}
                className="w-full text-left rounded-2xl border border-border bg-white p-4 shadow-sm active:scale-[0.99] transition-transform"
                onClick={() => setSelectedCustomer(customer)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                    {(customer.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate">{customer.name}</p>
                    {customer.items && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {parseItems(customer.items)}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="font-extrabold tabular-nums text-sm"
                      style={{ color: "#D97706" }}
                    >
                      {formatCurrency(customer.amount)}
                    </p>
                    <span className="text-[9px] font-bold uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                      Ideni
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Centered square client card — hidden while payment dialog is open */}
      {selectedCustomer && !paymentModalOpen && (
        <div className="fixed inset-0 z-[100] sella-overlay flex items-center justify-center p-4">
          <div
            className="bg-white rounded-[28px] w-full max-w-[380px] aspect-auto max-h-[min(92vh,640px)] shadow-2xl animate-scale-in overflow-hidden flex flex-col relative z-10 border border-white/40"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-gradient-to-br from-[#0b4fd9] to-[#1a6fff] px-5 pt-5 pb-4 text-white relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null);
                  setClientInvoicePreview(false);
                }}
                className="absolute right-3 top-3 w-9 h-9 rounded-[10px] bg-white/20 flex items-center justify-center text-white"
                aria-label="Funga"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <BrandMark variant="icon" size="xs" framed={false} />
                <p className="text-xs text-white/80 font-medium">Umukiriya · Ideni</p>
              </div>
              <h2 className="text-xl font-bold truncate pr-10">{selectedCustomer.name}</h2>
              <p className="text-3xl font-extrabold tabular-nums mt-2 text-amber-100">
                {formatCurrency(selectedCustomer.amount)}
              </p>
              <span className="inline-flex mt-2 text-[10px] font-bold uppercase tracking-wide bg-amber-400 text-amber-950 px-2.5 py-1 rounded-[8px]">
                Ideni
              </span>
              <p className="text-[10px] text-white/70 mt-2">
                Yafashe: {formatDate(selectedCustomer.created_at)}
              </p>
            </div>

            <div className="px-4 py-3 space-y-3 overflow-y-auto flex-1 bg-white">
              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3 space-y-1 text-[13px]">
                <p>
                  <span className="text-amber-800/70 font-medium">Ibyafashe: </span>
                  <span className="font-semibold text-slate-900">
                    {itemsParenFor(selectedCustomer)}
                  </span>
                </p>
                {selectedCustomer.due_date && (
                  <p>
                    <span className="text-amber-800/70">Azishyura: </span>
                    {formatDate(selectedCustomer.due_date)}
                  </p>
                )}
                {selectedCustomer.phone && (
                  <p>
                    <span className="text-amber-800/70">Telefone: </span>
                    {selectedCustomer.phone}
                  </p>
                )}
                <p className="text-[11px] text-slate-500 pt-1">
                  Ishura kuri shop: <span className="font-bold text-slate-800">{payPhone}</span>
                </p>
              </div>

              {/* One-tap WhatsApp reminder — primary action */}
              <button
                type="button"
                disabled={
                  reminderStatus === "preparing" || reminderStatus === "opening"
                }
                onClick={() => void handleWhatsAppReminder(selectedCustomer)}
                className="w-full min-h-[58px] rounded-2xl bg-[#25D366] text-white text-[16px] font-extrabold flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] disabled:opacity-70"
              >
                <MessageCircle size={22} />
                Send WhatsApp Reminder
              </button>

              {/* Secondary quick actions */}
              <div className="grid grid-cols-3 gap-2">
                {selectedCustomer.phone && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSMS(selectedCustomer)}
                      className="flex flex-col items-center gap-1.5 active:scale-95"
                    >
                      <span className="w-12 h-12 rounded-[14px] bg-[#0EA5E9] text-white flex items-center justify-center shadow-sm">
                        <MessageCircle size={20} />
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">
                        Ubutumwa
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCall(selectedCustomer.phone!)}
                      className="flex flex-col items-center gap-1.5 active:scale-95"
                    >
                      <span className="w-12 h-12 rounded-[14px] bg-[#1A6FFF] text-white flex items-center justify-center shadow-sm">
                        <Phone size={20} />
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">
                        Hamagara
                      </span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => openPayment(selectedCustomer)}
                  className="flex flex-col items-center gap-1.5 active:scale-95"
                >
                  <span className="w-12 h-12 rounded-[14px] bg-[#16A34A] text-white flex items-center justify-center shadow-sm">
                    <Check size={20} />
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">
                    Kwishyura
                  </span>
                </button>
              </div>

              {/* Mini invoice preview */}
              <button
                type="button"
                onClick={() => setClientInvoicePreview(true)}
                className="w-full text-left rounded-2xl border border-slate-200 overflow-hidden shadow-sm active:scale-[0.99]"
              >
                <div className="bg-[#0B4FD9] px-3 py-2.5 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <BrandMark variant="icon" size="xs" framed={false} />
                    <span className="font-bold text-sm">INVOICE</span>
                  </div>
                  <span className="text-[10px] opacity-80">
                    Preview · PDF
                  </span>
                </div>
                <div className="bg-white px-3 py-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Bill To: {selectedCustomer.name}</span>
                    <span>From: {shopName}</span>
                  </div>
                  {(selectedCustomer.line_items.length
                    ? selectedCustomer.line_items
                    : [{ name: selectedCustomer.items || "—", quantity: 1, unitPrice: selectedCustomer.amount || 0 }]
                  )
                    .slice(0, 3)
                    .map((l, i) => (
                      <div key={i} className="flex justify-between text-[11px] text-slate-800">
                        <span className="truncate mr-2">
                          {l.name} × {l.quantity}
                        </span>
                        <span className="font-semibold shrink-0">
                          {formatCurrency(l.unitPrice * l.quantity)}
                        </span>
                      </div>
                    ))}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-[9px] text-slate-400">Generated by Sella</span>
                    <span className="text-[10px] font-bold bg-[#0B4FD9] text-white px-2 py-0.5 rounded">
                      {formatCurrency(selectedCustomer.amount)}
                    </span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => openPayment(selectedCustomer)}
                className="sella-btn-confirm"
              >
                <Check size={18} /> Emeza Kwishyura
              </button>
              <button
                type="button"
                onClick={() => handleDelete(selectedCustomer)}
                className="w-full min-h-[48px] rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-bold flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Siba ideni
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full invoice preview before download / WhatsApp */}
      {selectedCustomer && clientInvoicePreview && (
        <div className="fixed inset-0 z-[110] sella-overlay flex items-center justify-center p-4">
          <div className="bg-slate-100 rounded-[24px] w-full max-w-md max-h-[92vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-white px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold">Preview ya Invoice</h3>
                <p className="text-[11px] text-muted-foreground">
                  Uko PDF izagaragara · Generated by Sella
                </p>
              </div>
              <button
                type="button"
                className="w-9 h-9 rounded-[10px] bg-muted flex items-center justify-center"
                onClick={() => setClientInvoicePreview(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="bg-white rounded-sm shadow border border-slate-200 overflow-hidden mx-auto max-w-sm">
                <div className="bg-[#0B4FD9] text-white px-3 py-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <BrandMark variant="icon" size="xs" framed={false} />
                      <span className="font-extrabold text-lg tracking-tight">INVOICE</span>
                    </div>
                    <p className="text-[10px] text-blue-100">Sella</p>
                  </div>
                  <p className="text-[10px] text-right text-blue-100">
                    NO: INV-{selectedCustomer.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 px-3 py-3 text-[11px] border-b border-slate-100">
                  <div>
                    <p className="font-bold text-slate-700">Bill To:</p>
                    <p className="text-slate-600">{selectedCustomer.name}</p>
                    <p className="text-slate-500">{selectedCustomer.phone}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">From:</p>
                    <p className="text-slate-600">{shopName}</p>
                    <p className="text-slate-500">{payPhone}</p>
                  </div>
                </div>
                <p className="px-3 text-[10px] text-slate-500 pb-2">
                  Date: {formatDate(selectedCustomer.created_at)}
                </p>
                <div className="bg-[#0B4FD9] text-white grid grid-cols-4 px-2 py-1.5 text-[9px] font-bold">
                  <span className="col-span-2">Description</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Total</span>
                </div>
                {(selectedCustomer.line_items.length
                  ? selectedCustomer.line_items
                  : [
                      {
                        name: selectedCustomer.items || "Ideni",
                        quantity: 1,
                        unitPrice: selectedCustomer.amount || 0,
                      },
                    ]
                ).map((l, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-4 px-2 py-2 text-[10px] border-b border-slate-100 gap-1"
                  >
                    <span className="col-span-2 truncate">{l.name}</span>
                    <span className="text-center">{l.quantity}</span>
                    <span className="text-right font-semibold">
                      {formatCurrency(l.unitPrice * l.quantity)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-end p-3">
                  <div className="bg-[#0B4FD9] text-white text-xs font-bold px-3 py-2 rounded-md">
                    Sub Total {formatCurrency(selectedCustomer.amount)}
                  </div>
                </div>
                <div className="px-3 pb-2 text-[10px] text-slate-600">
                  <p className="font-bold">Kwishyura (MoMo): {payPhone}</p>
                  <p className="text-right text-[#0B4FD9] font-bold text-sm mt-2">
                    Murakoze kugana {shopName}
                  </p>
                </div>
                <p className="text-center text-[9px] text-slate-400 border-t border-slate-100 py-2">
                  Generated by Sella
                </p>
              </div>
            </div>
            <div className="bg-white border-t border-border px-4 py-3 flex gap-2">
              <button
                type="button"
                className="flex-1 h-[52px] rounded-2xl border border-border font-bold text-sm"
                onClick={() => setClientInvoicePreview(false)}
              >
                Subira
              </button>
              <button
                type="button"
                className="sella-btn-confirm flex-[1.3]"
                disabled={isDownloading}
                onClick={() => void downloadClientInvoice(selectedCustomer)}
              >
                <Download size={16} />
                {isDownloading ? "…" : "Manura PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF preview before download — mirrors glass debtors statement */}
      {pdfPreview && (
        <div className="fixed inset-0 z-[60] sella-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-xl flex flex-col overflow-hidden animate-fade-in bg-gradient-to-br from-sky-100 via-violet-100 to-cyan-100">
            <div className="bg-white/90 backdrop-blur px-4 py-3 border-b border-white/60 flex items-center justify-between">
              <div>
                <h2 className="font-bold">Preview ya PDF</h2>
                <p className="text-[11px] text-muted-foreground">
                  Inyandiko y&apos;abadenyi · urutonde rwuzuye
                </p>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                onClick={() => setPdfPreview(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <div className="mx-auto max-w-md rounded-2xl bg-white/95 border border-sky-100 shadow-lg overflow-hidden">
                <div className="px-4 pt-4 pb-3 border-b border-sky-100 flex items-start gap-3">
                  <BrandMark variant="icon" size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#0b4fd9] truncate text-base">
                      {String(shopName)}
                    </p>
                    <p className="text-[11px] text-sky-600/80">
                      Inyandiko y&apos;Abadenyi
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {pdfPreview.today}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2.5 text-[11px] text-slate-600 space-y-0.5 border-b border-slate-100">
                  {shopPhone ? <p>Telefone: {String(shopPhone)}</p> : null}
                  {shopEmail ? <p>Email: {shopEmail}</p> : null}
                  <p className="font-semibold text-[#0b4fd9] bg-sky-50 rounded-lg px-2 py-1.5 mt-1">
                    Numero yo kwishyura (shop): {String(payPhone)}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 border-b border-slate-100">
                  <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wide">
                      Abadenyi
                    </p>
                    <p className="font-bold text-sm tabular-nums">
                      {pdfPreview.list.length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-rose-50 p-2.5 text-center col-span-2">
                    <p className="text-[9px] text-rose-500 uppercase tracking-wide">
                      Ideni ryose
                    </p>
                    <p className="font-bold text-sm text-rose-700 tabular-nums">
                      {formatCurrency(pdfPreview.grandTotal)}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {pdfPreview.list.slice(0, 8).map((c, i) => {
                    const original = Number(c.total_amount ?? c.amount ?? 0);
                    const remaining = Number(c.amount || 0);
                    const paid = Math.max(0, original - remaining);
                    return (
                      <div key={c.id} className="px-3 py-3 text-[11px]">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {i + 1}. {c.name}
                            </p>
                            <p className="text-slate-500">
                              Telefone y&apos;umukiriya: {c.phone || "—"}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              paid > 0
                                ? "bg-amber-100 text-amber-800"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {paid > 0 ? "Igice" : "Ideni"}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1.5 leading-snug">
                          {c.line_items.length
                            ? c.line_items
                                .map(
                                  (l) =>
                                    `${l.name} ×${l.quantity} (${formatCurrency(l.unitPrice)})`
                                )
                                .join(" · ")
                            : parseItems(c.items)}
                        </p>
                        <div className="mt-2 grid grid-cols-3 gap-1 text-[10px]">
                          <div>
                            <p className="text-slate-400">Byose</p>
                            <p className="font-semibold tabular-nums">
                              {formatCurrency(original)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Yishyuwe</p>
                            <p className="font-semibold tabular-nums">
                              {formatCurrency(paid)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Asigaye</p>
                            <p className="font-bold text-rose-600 tabular-nums">
                              {formatCurrency(remaining)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {pdfPreview.list.length > 8 && (
                    <p className="px-3 py-2.5 text-[11px] text-slate-500 text-center">
                      … n&apos;andi {pdfPreview.list.length - 8} mu PDF yuzuye
                      (urupapuro, tables, summary)
                    </p>
                  )}
                </div>

                <div className="bg-slate-50 px-3 py-3 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between text-xs font-bold text-rose-700">
                    <span>Ideni ryose</span>
                    <span className="tabular-nums">
                      {formatCurrency(pdfPreview.grandTotal)}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 text-right">
                    Generated by Sella
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={() => setPdfPreview(null)}
              >
                Hagarika
              </Button>
              <Button
                className="flex-[1.4] h-11 btn-navy font-bold gap-1.5"
                disabled={isDownloading}
                onClick={() => void downloadFullList(pdfPreview)}
              >
                <Download size={16} />
                {isDownloading ? "…" : "Manura PDF"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment modal ── */}
      {selectedCustomer && paymentModalOpen && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onConfirm={handlePayment}
          customerName={selectedCustomer.name!}
          totalAmount={selectedCustomer.amount!}
        />
      )}

      <WhatsAppReminderOverlay
        status={reminderStatus}
        errorMessage={reminderError}
        customerName={reminderCustomerName}
        onShareAgain={() => void retrySharePreparedReminder()}
        onOpenPdf={openPreparedReminderPdf}
        onClose={() => {
          setReminderStatus("idle");
          setReminderError(null);
        }}
      />
    </div>
  );
};

export default DebtsPage;
