import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Store, MapPin, FileText, Sparkles, ExternalLink, Copy, Check } from "lucide-react";
import {
  BUSINESS_CATEGORIES,
  businessCategoryLabel,
  normalizeBusinessCategory,
} from "@/lib/businessCategories";
import { updateStoreProfile } from "@/db/api";
import { Link } from "react-router-dom";

export const StoreProfileCard: React.FC = () => {
  const { profile, refreshProfile } = useAuth();

  const [businessName, setBusinessName] = useState(
    (profile && "business_name" in profile && profile.business_name) || ""
  );
  const [category, setCategory] = useState(
    (profile && "business_category" in profile && profile.business_category) ||
      "general_merchandise"
  );
  const [description, setDescription] = useState(
    (profile && "store_description" in profile && profile.store_description) || ""
  );
  const [address, setAddress] = useState(
    (profile && "store_address" in profile && profile.store_address) || ""
  );
  const [tin, setTin] = useState(
    (profile && "store_tin" in profile && profile.store_tin) || ""
  );
  const [logoUrl, setLogoUrl] = useState(
    (profile && "store_logo_url" in profile && profile.store_logo_url) || ""
  );
  const [coverUrl, setCoverUrl] = useState(
    (profile && "store_cover_url" in profile && profile.store_cover_url) || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const shopCode = (profile && "shop_code" in profile && profile.shop_code) || "";

  const handleCopyCode = () => {
    if (!shopCode) return;
    navigator.clipboard.writeText(shopCode);
    setCopiedCode(true);
    toast.success("Shop Code copied!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || businessName.trim().length < 2) {
      toast.error("Andika izina ry'iduka (nibura inyuguti 2)");
      return;
    }

    setIsSaving(true);
    try {
      await updateStoreProfile({
        business_name: businessName.trim(),
        business_category: normalizeBusinessCategory(category),
        store_description: description.trim() || null,
        store_address: address.trim() || null,
        store_tin: tin.trim() || null,
        store_logo_url: logoUrl.trim() || null,
        store_cover_url: coverUrl.trim() || null,
      });

      await refreshProfile();
      toast.success("Amakuru y'iduka yabitswe neza!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Habaye ikosa mu kubika");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-border/60 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Store size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Amakuru y'Iduka (Store Profile)</h3>
            <p className="text-[11px] text-muted-foreground">
              Ibyiciro by'ubucuruzi, aderesi, n'ibigize isoko rya Sella
            </p>
          </div>
        </div>

        {shopCode && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-xs flex items-center gap-1 font-mono bg-muted/60 px-2 py-1 rounded-md text-primary font-semibold hover:bg-muted transition-colors"
              title="Copy Shop Code"
            >
              <span>{shopCode}</span>
              {copiedCode ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            </button>
            <Link
              to={`/store/${shopCode}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary flex items-center gap-1 hover:underline"
              title="Reba uko iduka rigaragara ku isoko"
            >
              <span>Storefront</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-3.5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-muted-foreground block mb-1 font-medium">
              Izina ry'Iduka / Business Name *
            </label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Kigali Modern Fashion"
              className="h-9 text-xs"
              required
            />
          </div>

          <div>
            <label className="text-muted-foreground block mb-1 font-medium">
              Icyiciro cy'Ubucuruzi (Business Category) *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary"
            >
              {BUSINESS_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.rw} ({cat.en})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-muted-foreground block mb-1 font-medium flex items-center gap-1">
            <MapPin size={12} />
            Aho Iduka Riherereye / Physical Address or Market Stall
          </label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Kigali, Nyarugenge Market, Stall #45 / CHIC Building 1st Floor"
            className="h-9 text-xs"
          />
        </div>

        <div>
          <label className="text-muted-foreground block mb-1 font-medium">
            Ibisobanuro by'Iduka / Store Description & Services
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Sobanura ibicuruzwa byawe, igihe ufungurira, delivery itangwa, n'ibindi..."
            rows={2}
            className="text-xs resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-muted-foreground block mb-1 font-medium flex items-center gap-1">
              <FileText size={12} />
              Numero ya TIN (RRA, niba uyifite)
            </label>
            <Input
              value={tin}
              onChange={(e) => setTin(e.target.value)}
              placeholder="e.g. 109876543"
              className="h-9 text-xs"
            />
          </div>

          <div>
            <label className="text-muted-foreground block mb-1 font-medium">
              Logo Image URL (Ikirango)
            </label>
            <Input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://.../logo.png"
              className="h-9 text-xs"
            />
          </div>

          <div>
            <label className="text-muted-foreground block mb-1 font-medium">
              Cover Banner URL (Ifoto yo hejuru)
            </label>
            <Input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://.../banner.jpg"
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={isSaving}
            className="btn-navy text-xs h-9 px-4 flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            <span>{isSaving ? "Birabika..." : "Bika Amakuru y'Iduka"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
