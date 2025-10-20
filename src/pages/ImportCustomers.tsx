import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/integrations/supabase/client";
import { findOrCreateClient } from "@/db/api";
import { toast } from "sonner";

type PreviewRow = { name?: string; phone?: string; external_key?: string; id?: string };

const ImportCustomersPage = () => {
  const navigate = useNavigate();
  const { canWrite, mode } = useAuth();
  const [raw, setRaw] = useState("");
  const [importing, setImporting] = useState(false);

  const preview = useMemo(() => {
    try {
      const parsed = JSON.parse(raw || "[]");
      if (!Array.isArray(parsed)) return { rows: [] as PreviewRow[], error: "JSON must be an array" };
      const rows = parsed as PreviewRow[];
      const invalid = rows.filter((r) => !String(r.name || "").trim()).length;
      return { rows, invalid, error: null as string | null };
    } catch {
      return { rows: [] as PreviewRow[], invalid: 0, error: "Invalid JSON" };
    }
  }, [raw]);

  const runImport = async () => {
    if (!canWrite) return toast.error("Subscription expired — renew to import");
    if (preview.error) return toast.error(preview.error);
    if (!preview.rows.length) return toast.error("No rows");

    setImporting(true);
    try {
      if (mode === "cloud") {
        const sb = getSupabase();
        const { data, error } = await sb.rpc("import_clients_for_user", {
          p_rows: preview.rows,
        });
        if (error) throw error;
        toast.success(
          `Import done — inserted ${data.inserted}, skipped ${data.skipped}, invalid ${data.invalid}`
        );
      } else {
        let inserted = 0;
        let skipped = 0;
        let invalid = 0;
        for (const row of preview.rows) {
          const name = String(row.name || "").trim();
          if (!name) {
            invalid += 1;
            continue;
          }
          try {
            await findOrCreateClient(name, row.phone || null);
            inserted += 1;
          } catch {
            skipped += 1;
          }
        }
        toast.success(`Import done — inserted ${inserted}, skipped ${skipped}, invalid ${invalid}`);
      }
      navigate("/clients");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="sella-page">
      <PageHeader title="Import customers" backTo="/more" />
      <main className="sella-page-body space-y-4">
        <p className="text-sm text-muted-foreground">
          Paste a JSON array of customers. Rows with the same name + phone are skipped.
        </p>
        <textarea
          className="w-full h-56 rounded-xl border border-slate-200 p-3 text-xs font-mono bg-white"
          placeholder='[{"name":"Marie","phone":"0788..."}]'
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
        <div className="glass-card p-3 text-sm">
          <p>Rows: {preview.rows.length}</p>
          <p>Invalid (missing name): {preview.invalid ?? 0}</p>
          {preview.error && <p className="text-destructive">{preview.error}</p>}
        </div>
        <Button className="w-full btn-navy" disabled={importing || !!preview.error} onClick={runImport}>
          <Upload size={16} className="mr-2" />
          {importing ? "Importing…" : "Import customers"}
        </Button>
      </main>
    </div>
  );
};

export default ImportCustomersPage;
