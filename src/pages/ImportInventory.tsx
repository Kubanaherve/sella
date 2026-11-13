import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { WriteGate } from "@/components/WriteGate";
import { useAuth } from "@/contexts/AuthContext";
import {
  addInventoryItem,
  listInventory,
  updateInventoryItem,
} from "@/db/api";
import {
  IMPORT_FIELDS,
  commitInventoryImport,
  inventoryCsvTemplate,
  parseInventoryFile,
  validateMappedRows,
  type ColumnMapping,
  type DuplicateMode,
  type ParsedSheet,
  type ValidatedImportRow,
} from "@/lib/inventoryImport";
import { getAppLanguage } from "@/lib/appLanguage";
import { formatCurrency } from "@/lib/kinyarwanda";
import { toast } from "sonner";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  AlertTriangle,
} from "lucide-react";

type Step =
  | "upload"
  | "map"
  | "preview"
  | "confirm"
  | "importing"
  | "done";

const STEPS: Step[] = ["upload", "map", "preview", "confirm", "importing", "done"];

export default function ImportInventoryPage() {
  const navigate = useNavigate();
  const { canWrite } = useAuth();
  const lang = getAppLanguage();
  const en = lang === "en";
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>("skip");
  const [validated, setValidated] = useState<ValidatedImportRow[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [cancelFlag, setCancelFlag] = useState(false);
  const [summary, setSummary] = useState<{
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const stepIndex = STEPS.indexOf(step);

  const counts = useMemo(() => {
    const create = validated.filter((r) => r.action === "create").length;
    const update = validated.filter((r) => r.action === "update").length;
    const skip = validated.filter((r) => r.action === "skip").length;
    const error = validated.filter((r) => r.action === "error").length;
    const warnings = validated.filter((r) => r.warnings.length).length;
    return { create, update, skip, error, warnings };
  }, [validated]);

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const parsed = await parseInventoryFile(file);
      if (!parsed.rows.length) {
        toast.error(en ? "File has no data rows" : "Dosye nta makuru ifite");
        return;
      }
      setSheet(parsed);
      setMapping(parsed.suggestedMapping);
      setStep("map");
      toast.success(
        en
          ? `${parsed.rows.length} rows · ${parsed.headers.length} columns`
          : `${parsed.rows.length} imirongo · ${parsed.headers.length} inyuguti`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Parse failed");
    } finally {
      setBusy(false);
    }
  };

  const runValidate = async () => {
    if (!sheet) return;
    if (!Object.values(mapping).includes("item_name")) {
      toast.error(en ? "Map the Product name column" : "Hitamo inyuguti y'izina");
      return;
    }
    setBusy(true);
    try {
      const existing = await listInventory();
      const rows = validateMappedRows(
        sheet.rows,
        mapping,
        existing,
        duplicateMode
      );
      setValidated(rows);
      setStep("preview");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setBusy(false);
    }
  };

  const startImport = async () => {
    if (!canWrite) return;
    if (duplicateMode === "update" && counts.update > 0) {
      const ok = window.confirm(
        en
          ? `Update ${counts.update} existing products? This cannot be undone easily.`
          : `Hindura ibicuruzwa ${counts.update} bisanzwe? Ntibyagaruka byoroshye.`
      );
      if (!ok) return;
    }
    setCancelFlag(false);
    setStep("importing");
    setProgress({ done: 0, total: validated.filter((r) => r.action !== "error").length });
    try {
      const result = await commitInventoryImport(validated, {
        create: (input) => addInventoryItem(input),
        update: (id, input) =>
          updateInventoryItem(id, {
            item_name: input.item_name,
            quantity: input.quantity,
            selling_price: input.selling_price,
            cost_price: input.cost_price,
            category: input.category,
            notes: input.notes,
            sku: input.sku,
            barcode: input.barcode,
            unit: input.unit,
            brand: input.brand,
            supplier: input.supplier,
            min_quantity: input.min_quantity,
            description: input.description,
          }),
        shouldCancel: () => cancelFlag,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      setSummary(result);
      setStep("done");
      window.dispatchEvent(new Event("inventoryUpdated"));
      toast.success(
        en
          ? `Imported: ${result.created} new, ${result.updated} updated`
          : `Byinjijwe: ${result.created} bishya, ${result.updated} byahinduwe`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
      setStep("confirm");
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([inventoryCsvTemplate()], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sella-inventory-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewSlice = validated.filter((r) => r.action !== "skip").slice(0, 40);

  return (
    <div className="sella-page">
      <PageHeader
        title={en ? "Import inventory" : "Kuzana ububiko"}
        subtitle={en ? "CSV or Excel · map columns · preview · import" : "CSV cyangwa Excel"}
        backTo="/inventory"
      />

      <div className="sella-page-body space-y-4">
        {!canWrite && <WriteGate actionLabel={en ? "Import stock" : "Kuzana ububiko"} />}

        <div className="flex gap-1 overflow-x-auto pb-1">
          {(["upload", "map", "preview", "confirm", "done"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                STEPS.indexOf(step) >= i
                  ? "bg-primary text-white border-primary"
                  : "bg-white/70 dark:bg-white/10 text-muted-foreground border-border/80 dark:border-white/10 backdrop-blur-sm"
              }`}
            >
              {i + 1}. {s}
            </div>
          ))}
        </div>

        {step === "upload" && (
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <p className="font-bold">
                  {en ? "Upload your product list" : "Shyiramo urutonde rw'ibicuruzwa"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {en
                    ? "Works for hardware, paint, grocery, clothing — any unit."
                    : "Ikora kuri quincaillerie, paint, grocery, imyenda."}
                </p>
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => void onPickFile(e.target.files?.[0] || null)}
            />

            <Button
              className="w-full h-12"
              disabled={!canWrite || busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
              <span className="ml-2">
                {en ? "Choose CSV / Excel file" : "Hitamo dosye CSV / Excel"}
              </span>
            </Button>

            <button
              type="button"
              onClick={downloadTemplate}
              className="w-full text-sm text-primary font-semibold flex items-center justify-center gap-2 py-2"
            >
              <Download size={16} />
              {en ? "Download sample CSV template" : "Kurura urugero rwa CSV"}
            </button>
          </div>
        )}

        {step === "map" && sheet && (
          <div className="space-y-3">
            <div className="glass-card p-4">
              <p className="font-semibold text-sm truncate">{sheet.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {sheet.rows.length} {en ? "rows" : "imirongo"} · {sheet.headers.length}{" "}
                {en ? "columns" : "inyuguti"}
              </p>
            </div>

            <div className="glass-card p-0 overflow-hidden divide-y">
              {sheet.headers.map((header) => (
                <div
                  key={header}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <p className="flex-1 text-sm font-medium truncate">{header}</p>
                  <select
                    className="h-9 rounded-lg border border-border/80 dark:border-white/10 bg-white/70 dark:bg-white/10 text-foreground text-xs px-2 max-w-[48%] backdrop-blur-md"
                    value={mapping[header] || "skip"}
                    onChange={(e) =>
                      setMapping((m) => ({
                        ...m,
                        [header]: e.target.value as ColumnMapping[string],
                      }))
                    }
                  >
                    {IMPORT_FIELDS.map((f) => (
                      <option key={f.key} value={f.key}>
                        {en ? f.labelEn : f.labelRw}
                        {f.required ? " *" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="glass-card p-4 space-y-2">
              <p className="text-sm font-semibold">
                {en ? "When a product already exists" : "Iyo igicuruzwa gisanzwe kihari"}
              </p>
              {(
                [
                  ["skip", en ? "Skip duplicates" : "Siga bisanzwe"],
                  ["update", en ? "Update matching products" : "Hindura bisanzwe"],
                  ["create_anyway", en ? "Always create new" : "Kora bishya buri gihe"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="dup"
                    checked={duplicateMode === value}
                    onChange={() => setDuplicateMode(value)}
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("upload")}>
                {en ? "Back" : "Subira"}
              </Button>
              <Button className="flex-1" disabled={busy} onClick={() => void runValidate()}>
                {busy ? <Loader2 className="animate-spin" size={16} /> : null}
                {en ? "Preview" : "Reba mbere"}
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                [en ? "New" : "Bishya", counts.create, "text-emerald-700"],
                [en ? "Update" : "Guhindura", counts.update, "text-amber-700"],
                [en ? "Skip" : "Gusiga", counts.skip, "text-slate-600"],
                [en ? "Errors" : "Amakosa", counts.error, "text-rose-700"],
              ].map(([label, n, tone]) => (
                <div key={String(label)} className="glass-card p-3">
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className={`text-xl font-bold ${tone}`}>{n as number}</p>
                </div>
              ))}
            </div>

            {counts.error > 0 && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 flex gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                {en
                  ? "Rows with errors will not be imported."
                  : "Imirongo ifite amakosa ntizajya mu bubiko."}
              </div>
            )}

            <div className="glass-card p-0 overflow-hidden max-h-[50vh] overflow-y-auto">
              {previewSlice.map((row) => (
                <div
                  key={row.rowIndex}
                  className="px-3 py-2.5 border-b border-border/60 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold truncate">
                      #{row.rowIndex} {row.data.item_name || "—"}
                    </p>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {row.action}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {row.data.quantity} {row.data.unit || "pcs"} ·{" "}
                    {formatCurrency(row.data.selling_price)}
                    {row.data.sku ? ` · SKU ${row.data.sku}` : ""}
                  </p>
                  {row.errors.map((e) => (
                    <p key={e} className="text-[11px] text-rose-600 mt-0.5">
                      {e}
                    </p>
                  ))}
                  {row.warnings.map((w) => (
                    <p key={w} className="text-[11px] text-amber-700 mt-0.5">
                      {w}
                    </p>
                  ))}
                </div>
              ))}
              {validated.length > 40 && (
                <p className="text-center text-xs text-muted-foreground py-2">
                  {en
                    ? `Showing 40 of ${validated.length} rows`
                    : `Byerekana 40 kuri ${validated.length}`}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("map")}>
                {en ? "Back" : "Subira"}
              </Button>
              <Button
                className="flex-1"
                disabled={counts.create + counts.update === 0}
                onClick={() => setStep("confirm")}
              >
                {en ? "Continue" : "Komeza"}
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="glass-card p-5 space-y-4">
            <p className="font-bold text-base">
              {en ? "Confirm import" : "Emeza kuzana"}
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>
                {en ? "Create" : "Gukora"}:{" "}
                <strong className="text-foreground">{counts.create}</strong>
              </li>
              <li>
                {en ? "Update" : "Guhindura"}:{" "}
                <strong className="text-foreground">{counts.update}</strong>
              </li>
              <li>
                {en ? "Skip" : "Gusiga"}:{" "}
                <strong className="text-foreground">{counts.skip}</strong>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              {en
                ? "Prices and quantities come only from your file — Sella does not invent stock numbers."
                : "Amafaranga n'umubare biva muri dosye yawe gusa — Sella ntabwo ikora umubare."}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("preview")}>
                {en ? "Back" : "Subira"}
              </Button>
              <Button className="flex-1" disabled={!canWrite} onClick={() => void startImport()}>
                {en ? "Import now" : "Kuzana nonaha"}
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="glass-card p-6 text-center space-y-3">
            <Loader2 className="mx-auto animate-spin text-primary" size={28} />
            <p className="font-semibold">
              {en ? "Importing…" : "Birimo kwinjira…"} {progress.done}/{progress.total}
            </p>
            <Button variant="outline" size="sm" onClick={() => setCancelFlag(true)}>
              {en ? "Cancel" : "Hagarika"}
            </Button>
          </div>
        )}

        {step === "done" && summary && (
          <div className="glass-card p-6 space-y-4 text-center">
            <CheckCircle2 className="mx-auto text-emerald-600" size={36} />
            <p className="font-bold text-lg">{en ? "Import complete" : "Byarangiye"}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-muted-foreground text-xs">{en ? "Created" : "Bishya"}</p>
                <p className="font-bold text-lg">{summary.created}</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <p className="text-muted-foreground text-xs">{en ? "Updated" : "Byahinduwe"}</p>
                <p className="font-bold text-lg">{summary.updated}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-muted-foreground text-xs">{en ? "Skipped" : "Byasigaye"}</p>
                <p className="font-bold text-lg">{summary.skipped}</p>
              </div>
              <div className="rounded-xl bg-rose-50 p-3">
                <p className="text-muted-foreground text-xs">{en ? "Failed" : "Byanze"}</p>
                <p className="font-bold text-lg">{summary.failed}</p>
              </div>
            </div>
            <Button className="w-full" onClick={() => navigate("/inventory")}>
              {en ? "Open inventory" : "Fungura ububiko"}
            </Button>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground text-center pb-2">
          Step {Math.min(stepIndex + 1, 5)} · Sella import
        </p>
      </div>
    </div>
  );
}
