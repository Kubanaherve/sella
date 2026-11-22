import React from "react";
import { useAppLanguage } from "@/i18n/useAppLanguage";

interface StoreBadgeProps {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
  variant?: "dark" | "glass";
  onClick?: () => void;
}

/**
 * Official Google Play Store Badge
 * Implements the authentic Google Play brand badge specification:
 * - Crisp black surface (#000000)
 * - 1px fine silver border (#A6A6A6 / border-white/25)
 * - Official 4-color Google Play vector glyph
 * - Localized kicker ("DOWNLOADINGA KURI" / "GET IT ON" / "前往下载" / "احصل عليه من") + "Google Play" wordmark
 */
export function GooglePlayBadge({
  href = "https://play.google.com",
  className = "",
  size = "md",
  variant = "dark",
  onClick,
}: StoreBadgeProps) {
  const lang = useAppLanguage();
  const kicker =
    lang === "rw" || lang === "rn"
      ? "DOWNLOADINGA KURI"
      : lang === "lg"
      ? "DOWNLOADINGA KU"
      : lang === "zh"
      ? "前往下载"
      : lang === "ar"
      ? "احصل عليه من"
      : lang === "fr"
      ? "DISPONIBLE SUR"
      : lang === "sw"
      ? "IPATE KWENYE"
      : "GET IT ON";

  const sizeClasses = {
    sm: "h-[42px] px-3.5 py-1.5 gap-2.5 rounded-[9px]",
    md: "h-[48px] px-4 py-2 gap-3 rounded-[10px]",
    lg: "h-[54px] px-5 py-2.5 gap-3.5 rounded-[12px]",
    full: "h-[48px] w-full px-4 py-2 gap-3 justify-center rounded-[10px]",
  }[size];

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
    full: "w-6 h-6",
  }[size];

  const surfaceClasses =
    variant === "glass"
      ? "bg-slate-900/90 backdrop-blur-xl border border-white/25 hover:border-cyan-400/60 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.25)]"
      : "bg-black border border-[#a6a6a6]/90 hover:border-white shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.2)]";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      aria-label={`${kicker} Google Play`}
      className={`inline-flex items-center text-white transition-all duration-200 select-none hover:scale-[1.02] active:scale-[0.98] group ${sizeClasses} ${surfaceClasses} ${className}`}
    >
      {/* Official Google Play Vector Glyph */}
      <svg
        className={`${iconSizes} shrink-0 transition-transform duration-200 group-hover:scale-105`}
        viewBox="0 0 512 512"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M47.8 19.2C41.7 25.6 38.3 35.8 38.3 49v414c0 13.2 3.4 23.4 9.5 29.8l1.6 1.4L275 268.6v-5.2L49.4 17.8l-1.6 1.4z"
          fill="#4285F4"
        />
        <path
          d="M354.4 348l-79.4-79.4v-5.2l79.4-79.4 1.8 1 93.9 53.4c26.8 15.2 26.8 40.2 0 55.4l-93.9 53.4-1.8 1.2z"
          fill="#FBBC04"
        />
        <path
          d="M356.2 346.8L275 266 47.8 493.2c8.8 9.4 23.4 10.4 39.8 1.2l268.6-147.6z"
          fill="#EA4335"
        />
        <path
          d="M356.2 165.2L87.6 17.6C71.2 8.4 56.6 9.4 47.8 18.8L275 246l81.2-80.8z"
          fill="#34A853"
        />
      </svg>

      {/* 2-Line Typography Block */}
      <div className="flex flex-col text-start leading-none justify-center">
        <span className="text-[8.5px] sm:text-[9px] font-medium tracking-[0.14em] uppercase text-slate-300 group-hover:text-white transition-colors">
          {kicker}
        </span>
        <span className="text-[15px] sm:text-[16px] font-bold tracking-tight text-white mt-0.5 font-sans">
          Google Play
        </span>
      </div>
    </a>
  );
}

/**
 * Official Apple App Store Badge
 * Implements the authentic Apple App Store brand badge specification:
 * - Crisp black surface (#000000)
 * - 1px fine silver border (#A6A6A6 / border-white/25)
 * - Authentic Apple monochrome vector silhouette
 * - Localized kicker ("Downloadinga kuri" / "Download on the" / "前往下载" / "تنزيل من") + "App Store" wordmark
 */
export function AppStoreBadge({
  href = "https://apps.apple.com",
  className = "",
  size = "md",
  variant = "dark",
  onClick,
}: StoreBadgeProps) {
  const lang = useAppLanguage();
  const kicker =
    lang === "rw" || lang === "rn"
      ? "Downloadinga kuri"
      : lang === "lg"
      ? "Downloadinga ku"
      : lang === "zh"
      ? "前往下载"
      : lang === "ar"
      ? "تنزيل من"
      : lang === "fr"
      ? "Télécharger dans"
      : lang === "sw"
      ? "Pakua kwenye"
      : "Download on the";

  const sizeClasses = {
    sm: "h-[42px] px-3.5 py-1.5 gap-2.5 rounded-[9px]",
    md: "h-[48px] px-4 py-2 gap-3 rounded-[10px]",
    lg: "h-[54px] px-5 py-2.5 gap-3.5 rounded-[12px]",
    full: "h-[48px] w-full px-4 py-2 gap-3 justify-center rounded-[10px]",
  }[size];

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
    full: "w-6 h-6",
  }[size];

  const surfaceClasses =
    variant === "glass"
      ? "bg-slate-900/90 backdrop-blur-xl border border-white/25 hover:border-cyan-400/60 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.25)]"
      : "bg-black border border-[#a6a6a6]/90 hover:border-white shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.2)]";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      aria-label={`${kicker} App Store`}
      className={`inline-flex items-center text-white transition-all duration-200 select-none hover:scale-[1.02] active:scale-[0.98] group ${sizeClasses} ${surfaceClasses} ${className}`}
    >
      {/* Official Apple Logo SVG */}
      <svg
        className={`${iconSizes} shrink-0 fill-current transition-transform duration-200 group-hover:scale-105`}
        viewBox="0 0 170 170"
        aria-hidden="true"
      >
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.66-7.85-11.9-14.34-6.3-9.74-11.2-20.89-14.7-33.44-3.5-12.56-5.25-24.3-5.25-35.24 0-14.07 3.5-25.75 10.5-35.05 7-9.3 15.82-14.05 26.47-14.25 4.9 0 10.27 1.25 16.12 3.75 5.85 2.5 9.77 3.75 11.75 3.75 1.74 0 5.76-1.29 12.06-3.87 6.3-2.58 11.8-3.72 16.5-3.41 12.55.76 22.42 5.37 29.62 13.84-11.08 6.74-16.51 16.03-16.3 27.87.21 9.35 3.86 17.15 10.95 23.4 7.09 6.25 15.54 9.8 25.35 10.66-2.5 7.4-5.38 14.67-8.65 21.82zM119.22 31.85c0-7.07 2.61-13.78 7.82-20.13 5.22-6.35 11.74-10.25 19.58-11.72.33 1.09.5 2.07.5 2.94 0 6.96-2.67 13.6-8.02 19.93-5.34 6.32-11.74 10.23-19.19 11.73-.22-.98-.44-1.93-.69-2.85v.1z" />
      </svg>

      {/* 2-Line Typography Block */}
      <div className="flex flex-col text-start leading-none justify-center">
        <span className="text-[8.5px] sm:text-[9px] font-medium tracking-[0.06em] text-slate-300 group-hover:text-white transition-colors">
          {kicker}
        </span>
        <span className="text-[15px] sm:text-[16px] font-bold tracking-tight text-white mt-0.5 font-sans">
          App Store
        </span>
      </div>
    </a>
  );
}

/**
 * Official Microsoft Windows Desktop App Badge
 */
export function WindowsBadge({
  href = "/download/windows",
  className = "",
  size = "md",
  variant = "dark",
  onClick,
}: StoreBadgeProps) {
  const lang = useAppLanguage();
  const kicker =
    lang === "rw" || lang === "rn"
      ? "DOWNLOADINGA KURI"
      : lang === "lg"
      ? "DOWNLOADINGA KU"
      : lang === "zh"
      ? "前往下载"
      : lang === "ar"
      ? "تحميل لـ"
      : lang === "fr"
      ? "TÉLÉCHARGER POUR"
      : lang === "sw"
      ? "PAKUA KWA"
      : "DOWNLOAD FOR";

  const sizeClasses = {
    sm: "h-[42px] px-3.5 py-1.5 gap-2.5 rounded-[9px]",
    md: "h-[48px] px-4 py-2 gap-3 rounded-[10px]",
    lg: "h-[54px] px-5 py-2.5 gap-3.5 rounded-[12px]",
    full: "h-[48px] w-full px-4 py-2 gap-3 justify-center rounded-[10px]",
  }[size];

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
    full: "w-6 h-6",
  }[size];

  const surfaceClasses =
    variant === "glass"
      ? "bg-slate-900/90 backdrop-blur-xl border border-white/25 hover:border-cyan-400/60 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.25)]"
      : "bg-slate-900 border border-[#a6a6a6]/90 hover:border-[#0078D7] shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.2)]";

  return (
    <a
      href={href}
      onClick={onClick}
      aria-label={`${kicker} Windows PC`}
      className={`inline-flex items-center text-white transition-all duration-200 select-none hover:scale-[1.02] active:scale-[0.98] group ${sizeClasses} ${surfaceClasses} ${className}`}
    >
      {/* Official Microsoft Windows Vector Logo */}
      <svg
        className={`${iconSizes} shrink-0 fill-[#0078D7] transition-transform duration-200 group-hover:scale-105`}
        viewBox="0 0 88 88"
        aria-hidden="true"
      >
        <path d="M0 12.402l35.689-4.86.016 34.423-35.67.203zm35.67 33.529l.028 34.453L.028 75.48.016 45.719zm4.326-39.027L87.914 0v41.527l-47.918.378zm47.929 44.925v41.77L39.996 81.02V46.685z" />
      </svg>

      {/* 2-Line Typography Block */}
      <div className="flex flex-col text-start leading-none justify-center">
        <span className="text-[8.5px] sm:text-[9px] font-medium tracking-[0.12em] uppercase text-slate-300 group-hover:text-white transition-colors">
          {kicker}
        </span>
        <span className="text-[15px] sm:text-[16px] font-bold tracking-tight text-white mt-0.5 font-sans">
          Windows PC
        </span>
      </div>
    </a>
  );
}

/**
 * Official Apple Mac Desktop App Badge
 */
export function MacBadge({
  href = "/download/mac",
  className = "",
  size = "md",
  variant = "dark",
  onClick,
}: StoreBadgeProps) {
  const lang = useAppLanguage();
  const kicker =
    lang === "rw" || lang === "rn"
      ? "DOWNLOADINGA KURI"
      : lang === "lg"
      ? "DOWNLOADINGA KU"
      : lang === "zh"
      ? "前往下载"
      : lang === "ar"
      ? "تحميل لـ"
      : lang === "fr"
      ? "TÉLÉCHARGER POUR"
      : lang === "sw"
      ? "PAKUA KWA"
      : "DOWNLOAD FOR";

  const sizeClasses = {
    sm: "h-[42px] px-3.5 py-1.5 gap-2.5 rounded-[9px]",
    md: "h-[48px] px-4 py-2 gap-3 rounded-[10px]",
    lg: "h-[54px] px-5 py-2.5 gap-3.5 rounded-[12px]",
    full: "h-[48px] w-full px-4 py-2 gap-3 justify-center rounded-[10px]",
  }[size];

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
    full: "w-6 h-6",
  }[size];

  const surfaceClasses =
    variant === "glass"
      ? "bg-slate-900/90 backdrop-blur-xl border border-white/25 hover:border-cyan-400/60 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.25)]"
      : "bg-slate-900 border border-[#a6a6a6]/90 hover:border-white shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.2)]";

  return (
    <a
      href={href}
      onClick={onClick}
      aria-label={`${kicker} Mac`}
      className={`inline-flex items-center text-white transition-all duration-200 select-none hover:scale-[1.02] active:scale-[0.98] group ${sizeClasses} ${surfaceClasses} ${className}`}
    >
      {/* Official Apple Logo SVG */}
      <svg
        className={`${iconSizes} shrink-0 fill-current transition-transform duration-200 group-hover:scale-105`}
        viewBox="0 0 170 170"
        aria-hidden="true"
      >
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.66-7.85-11.9-14.34-6.3-9.74-11.2-20.89-14.7-33.44-3.5-12.56-5.25-24.3-5.25-35.24 0-14.07 3.5-25.75 10.5-35.05 7-9.3 15.82-14.05 26.47-14.25 4.9 0 10.27 1.25 16.12 3.75 5.85 2.5 9.77 3.75 11.75 3.75 1.74 0 5.76-1.29 12.06-3.87 6.3-2.58 11.8-3.72 16.5-3.41 12.55.76 22.42 5.37 29.62 13.84-11.08 6.74-16.51 16.03-16.3 27.87.21 9.35 3.86 17.15 10.95 23.4 7.09 6.25 15.54 9.8 25.35 10.66-2.5 7.4-5.38 14.67-8.65 21.82zM119.22 31.85c0-7.07 2.61-13.78 7.82-20.13 5.22-6.35 11.74-10.25 19.58-11.72.33 1.09.5 2.07.5 2.94 0 6.96-2.67 13.6-8.02 19.93-5.34 6.32-11.74 10.23-19.19 11.73-.22-.98-.44-1.93-.69-2.85v.1z" />
      </svg>

      {/* 2-Line Typography Block */}
      <div className="flex flex-col text-start leading-none justify-center">
        <span className="text-[8.5px] sm:text-[9px] font-medium tracking-[0.08em] uppercase text-slate-300 group-hover:text-white transition-colors">
          {kicker}
        </span>
        <span className="text-[15px] sm:text-[16px] font-bold tracking-tight text-white mt-0.5 font-sans">
          macOS
        </span>
      </div>
    </a>
  );
}
