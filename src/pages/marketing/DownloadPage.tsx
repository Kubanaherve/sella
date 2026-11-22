import { PublicShell } from "@/components/marketing/PublicShell";
import { DownloadCenter } from "@/components/marketing/DownloadCenter";
import { Seo } from "@/components/marketing/Seo";
import { t, type CatalogueId } from "@/i18n";

export default function DownloadPage() {
  return (
    <PublicShell>
      <Seo
        title="Download Sella"
        description="Open Sella in the browser. iPhone, Android, and Windows links appear only when those builds are published."
        path="/download"
      />
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-[36px] font-semibold tracking-tight">{t("WEB-003" as CatalogueId)}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#4B4B4B]">{t("WEB-047" as CatalogueId)}</p>
        <div className="mt-8">
          <DownloadCenter />
        </div>
      </div>
    </PublicShell>
  );
}
