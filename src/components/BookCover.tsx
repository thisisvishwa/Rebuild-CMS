import { config } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * The eBook cover, rendered as self-contained CSS/SVG (no external image) so it
 * looks crisp in any context and loads instantly. The gradient suggests a dawn
 * horizon — the "new beginning" motif — while staying calm and premium.
 */
export function BookCover({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex aspect-[3/4] w-full flex-col justify-between overflow-hidden rounded-r-lg rounded-l-md bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-700 p-5 text-cream-50 shadow-lift",
        className,
      )}
    >
      {/* sunrise / horizon motif */}
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-sunrise-200/40 blur-2xl" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-gold-600/40 to-transparent" />
        <svg
          viewBox="0 0 300 180"
          className="absolute bottom-4 left-0 w-full opacity-80"
          fill="none"
        >
          <path
            d="M0 150c40-14 60-44 78-86 22 44 46 72 84 78 26 4 50-4 78-32-26 30-58 44-88 42-48-3-80-34-152-2Z"
            fill="url(#g1)"
            opacity="0.9"
          />
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#EBB87E" />
              <stop offset="1" stopColor="#B9963F" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative flex items-center justify-between">
        <span className="h-px w-10 bg-gold-400/70" />
        <span className="text-[9px] uppercase tracking-[0.32em] text-cream-100/70">
          Recovery system
        </span>
      </div>

      <div className="relative">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold-200">
          A practical guide
        </p>
        <h3 className="mt-2 font-serif text-4xl font-semibold leading-[0.95] text-cream-50 sm:text-5xl">
          Rebuild
        </h3>
        <p className="mt-3 max-w-[15rem] font-serif text-base italic leading-snug text-cream-100/85">
          Heal, detach, and become more fully yourself after relationship loss.
        </p>
      </div>

      <div className="relative flex items-end justify-between border-t border-white/15 pt-3">
        <span className="text-[10px] uppercase tracking-[0.22em] text-cream-100/60">
          {config.app.productName}
        </span>
        <span className="h-6 w-6 rounded-full border border-gold-400/70" />
      </div>
    </div>
  );
}
