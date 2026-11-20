import { SellaLogoMark } from "@/components/SellaLogoMark";

/** Light branded boot screen for the Electron app. */
export function DesktopSplash({
  failed = false,
  onRetry,
}: {
  failed?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#F7F8FB] text-[#0F172A]">
      <SellaLogoMark size="md" />
      <p className="mt-5 text-[22px] font-semibold tracking-tight">Sella</p>
      {failed ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-sm text-[#475569]">Sella could not finish starting.</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full bg-[#1A6FFF] px-5 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      ) : (
        <div
          className="mt-6 h-5 w-5 animate-spin rounded-full border-2 border-[#1A6FFF]/25 border-t-[#1A6FFF]"
          aria-label="Loading"
        />
      )}
    </div>
  );
}
