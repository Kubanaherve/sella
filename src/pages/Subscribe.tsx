import { useNavigate } from "react-router-dom";
import { isNativeApp } from "@/lib/platform";
import { ProMembershipNotice } from "@/components/ProMembershipNotice";
import { WebMomoCheckout } from "@/components/payments/WebMomoCheckout";
import { useAuth } from "@/contexts/AuthContext";
import { accessLabel } from "@/lib/entitlements";
import { BrandMark } from "@/components/BrandMark";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function SubscribePage() {
  const navigate = useNavigate();
  const { subscription } = useAuth();

  if (isNativeApp()) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
        <ProMembershipNotice
          status={accessLabel(subscription)}
          onDismiss={() => navigate("/dashboard")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071126] text-white font-sans selection:bg-amber-400/30 relative overflow-x-hidden">
      {/* Top Header */}
      <header className="border-b border-white/10 bg-[#091630]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>

          <Link to="/" className="flex items-center gap-2">
            <BrandMark variant="icon" size="xs" framed={false} />
            <span className="font-bold text-sm text-white">Sella</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <WebMomoCheckout />
      </main>
    </div>
  );
}
