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
  debtReportPdfBlob,
  downloadDebtReportPdf,
  formatItemsParen,
  invoicePdfBlob,
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
import { printPdfBlob, sharePdfBlob } from "@/lib/sharePdf";
import { WhatsAppReminderOverlay } from "@/components/WhatsAppReminderOverlay";
import { BrandMark } from "@/components/BrandMark";
import { GlassDocPreviewModal } from "@/components/GlassDocPreviewModal";

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
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewFileName, setPreviewFileName] = useState("sella.pdf");
  const [previewLoading, setPreviewLoading] = useState(false);
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

  useEffect(() => {
    const onSync = () => {
      void fetchCustomers(1, searchQuery);
      setPage(1);
    };
    window.addEventListener("sella:outbox-synced", onSync);
    return () => window.removeEventListener("sella:outbox-synced", onSync);
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

  const revokePreviewUrl = useCallback(() => {
    setPreviewPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPreviewBlob(null);
  }, []);

  const statementOptsFromList = (list: Customer[], today: string, grandTotal: number) => ({
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
          remaining <= 0
            ? ("paid" as const)
            : paid > 0
              ? ("partial" as const)
              : ("credit" as const),
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
  });

  const openPdfPreview = async () => {
    setPreviewLoading(true);
    revokePreviewUrl();
    try {
      const debts = await listActiveDebts();
      const list = debts.map(mapDebtToCustomer);
      const grandTotal = list.reduce((sum, c) => sum + Number(c.amount || 0), 0);
      const today = new Date().toLocaleDateString(
        getAppLanguage() === "en" ? "en-GB" : "fr-RW",
        { year: "numeric", month: "long", day: "numeric" }
      );
      setPdfPreview({ list, grandTotal, today });
      const fileName = `ideni-sella-${new Date().toISOString().split("T")[0]}.pdf`;
      setPreviewFileName(fileName);
      const blob = await debtReportPdfBlob(
        statementOptsFromList(list, today, grandTotal)
      );
      setPreviewBlob(blob);
      setPreviewPdfUrl(URL.createObjectURL(blob));
    } catch {
      toast.error("Habaye ikosa mu gutegura preview");
      setPdfPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const openClientInvoicePreview = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setClientInvoicePreview(true);
    setPreviewLoading(true);
    revokePreviewUrl();
    try {
      const invoice = invoiceFromCustomer(customer);
      const fileName = `invoice-sella-${invoice.invoiceNumber.replace(/[^\w-]+/g, "")}.pdf`;
      setPreviewFileName(fileName);
      const blob = await invoicePdfBlob(invoice);
      setPreviewBlob(blob);
      setPreviewPdfUrl(URL.createObjectURL(blob));
    } catch {
      toast.error("Habaye ikosa mu gutegura preview");
      setClientInvoicePreview(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closeStatementPreview = () => {
    setPdfPreview(null);
    revokePreviewUrl();
  };

  const closeInvoicePreview = () => {
    setClientInvoicePreview(false);
    revokePreviewUrl();
  };

  const sendPreviewPdf = async () => {
    if (!previewBlob) return toast.error("PDF ntirateguwe");
    setIsDownloading(true);
    try {
      const result = await sharePdfBlob({
        blob: previewBlob,
        fileName: previewFileName,
        title: "Sella PDF",
        text: `${shopName} · ${previewFileName}`,
      });
      if (result === "shared") toast.success("PDF yoherejwe");
      else if (result === "downloaded") toast.success("PDF yamanitswe");
    } catch {
      toast.error("Kohereza byanze");
    } finally {
      setIsDownloading(false);
    }
  };

  const printPreviewPdf = async () => {
    if (!previewBlob) return toast.error("PDF ntirateguwe");
    setIsDownloading(true);
    try {
      await printPdfBlob(previewBlob);
    } catch {
      toast.error("Printinga byanze");
    } finally {
      setIsDownloading(false);
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
        statementOptsFromList(list, today, grandTotal),
        `ideni-sella-${new Date().toISOString().split("T")[0]}.pdf`
      );

      toast.success(`PDF y'abakiriya ${list.length} yamanitswe!`);
      closeStatementPreview();
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
      if (previewBlob) {
        await sharePdfBlob({
          blob: previewBlob,
          fileName: previewFileName,
          title: "Sella Invoice",
        });
      } else {
        const blob = await invoicePdfBlob(invoiceFromCustomer(customer));
        await sharePdfBlob({
          blob,
          fileName: `invoice-sella-${customer.id.slice(0, 8)}.pdf`,
          title: "Sella Invoice",
        });
      }
      toast.success("Invoice PDF yoherejwe / yamanitswe");
      closeInvoicePreview();
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
    closeInvoicePreview();
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
      closeInvoicePreview();
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
              className="btn-navy h-8 px-2.5 text-xs max-w-[9.5rem]"
            >
              <Plus size={14} className="mr-1 shrink-0" />
              <span className="truncate">Ongera</span>
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
          className="pl-3 bg-white/70 dark:bg-white/5 border-border dark:border-white/10 input-glow"
        />

        <div className="glass-card-dark relative rounded-2xl p-4 flex items-center justify-between">
          <div className="relative z-10">
            <p className="text-xs text-white/75">{labels.totalDebt}</p>
            <p className="text-xl font-bold tabular-nums text-white">
              {formatCurrency(totalUnpaid)}
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <button
              type="button"
              onClick={() => void openPdfPreview()}
              disabled={isDownloading}
              className="flex items-center gap-1 text-xs text-white/90 hover:text-white transition-colors bg-white/15 rounded-full px-2.5 py-1.5 border border-white/20 backdrop-blur-md"
              title="Reba PDF mbere"
            >
              <FileText size={14} />
              <span className="text-[11px]">PDF</span>
            </button>
            <div className="flex items-center gap-1 text-white/85">
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
                className="sella-list-card w-full text-left p-4 active:scale-[0.99] transition-transform"
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
                    <p className="font-extrabold tabular-nums text-sm text-amber-600 dark:text-amber-400">
                      {formatCurrency(customer.amount)}
                    </p>
                    <span className="text-[9px] font-bold uppercase text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 border border-transparent dark:border-amber-500/30 px-2 py-0.5 rounded-full">
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
            className="sella-popup-glass rounded-[28px] w-full max-w-[380px] aspect-auto max-h-[min(92vh,640px)] animate-scale-in flex flex-col relative z-10"
            role="dialog"
            aria-modal="true"
          >
            <div className="sella-popup-header-glass px-5 pt-5 pb-4 relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null);
                  closeInvoicePreview();
                }}
                className="absolute right-3 top-3 z-10 w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white backdrop-blur-md"
                aria-label="Funga"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
              <div className="relative z-10 flex items-center gap-2 mb-2">
                <BrandMark variant="icon" size="xs" framed={false} />
                <p className="text-xs text-white/80 font-medium">Umukiriya · Ideni</p>
              </div>
              <h2 className="relative z-10 text-xl font-bold truncate pr-10">
                {selectedCustomer.name}
              </h2>
              <p className="relative z-10 text-3xl font-extrabold tabular-nums mt-2 text-amber-100">
                {formatCurrency(selectedCustomer.amount)}
              </p>
              <span className="relative z-10 inline-flex mt-2 text-[10px] font-bold uppercase tracking-wide bg-white/20 border border-white/30 text-white px-2.5 py-1 rounded-full backdrop-blur-md">
                Ideni
              </span>
              <p className="relative z-10 text-[10px] text-white/70 mt-2">
                Yafashe: {formatDate(selectedCustomer.created_at)}
              </p>
            </div>

            <div className="relative z-10 px-4 py-3 space-y-3 overflow-y-auto flex-1">
              <div className="rounded-2xl bg-white/50 border border-white/70 p-3 space-y-1 text-[13px] backdrop-blur-sm">
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
                onClick={() => void openClientInvoicePreview(selectedCustomer)}
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

      {/* Invoice preview — glass sheet fitted to device */}
      <GlassDocPreviewModal
        open={!!selectedCustomer && clientInvoicePreview}
        onClose={closeInvoicePreview}
        title="Preview ya Invoice"
        subtitle="Uko PDF izagaragara ku telephone yawe"
        pdfUrl={previewPdfUrl}
        loading={previewLoading}
        busy={isDownloading}
        sendLabel="Send"
        printLabel="Print"
        onSend={() => {
          if (selectedCustomer) void downloadClientInvoice(selectedCustomer);
        }}
        onPrint={() => void printPreviewPdf()}
      />

      {/* Debtors statement preview — glass sheet fitted to device */}
      <GlassDocPreviewModal
        open={!!pdfPreview}
        onClose={closeStatementPreview}
        title="Preview ya PDF"
        subtitle={
          pdfPreview
            ? `Inyandiko y'abadenyi · ${pdfPreview.list.length} · ${pdfPreview.today}`
            : "Inyandiko y'abadenyi"
        }
        pdfUrl={previewPdfUrl}
        loading={previewLoading}
        busy={isDownloading}
        sendLabel="Send"
        printLabel="Print"
        onSend={() => void sendPreviewPdf()}
        onPrint={() => void printPreviewPdf()}
      />

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
