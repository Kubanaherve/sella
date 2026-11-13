import { cn } from "@/lib/utils";
import liquidScript from "@/assets/brand/sella-liquid-glass-script.png";

type Props = {
  className?: string;
  instant?: boolean;
};

/**
 * Liquid-glass “Sella” wordmark (capital S) with left→right write reveal.
 * Skin matched to SellaLogoMark blues.
 */
export function SellaSignature({ className, instant = false }: Props) {
  return (
    <div
      className={cn(
        "sella-signature relative mx-auto w-full",
        instant && "sella-signature--instant",
        className
      )}
      role="img"
      aria-label="Sella"
    >
      <div className="sella-signature-write">
        <img
          src={liquidScript}
          alt=""
          draggable={false}
          className="sella-signature-img pointer-events-none select-none h-auto w-full object-contain"
        />
      </div>
    </div>
  );
}
