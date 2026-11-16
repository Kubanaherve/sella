import { DownloadCenter } from "@/components/marketing/DownloadCenter";
import { MarketingIntro, MarketingShell } from "@/components/marketing/MarketingShell";
import { Seo } from "@/components/marketing/Seo";

export default function DownloadPage() {
  return (
    <MarketingShell>
      <Seo
        title="Download Sella"
        description="Open Sella on the web today. iPhone, Android, Mac, and Windows downloads appear here only when those builds are published."
        path="/download"
      />
      <MarketingIntro
        kicker="Download"
        title="Pick the device in front of you"
        lede="The web application is available now. App Store, Google Play, Mac, and Windows links stay hidden until KUBANA Friend TECHNOLOGIES publishes them."
      />
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <DownloadCenter />
      </div>
    </MarketingShell>
  );
}
