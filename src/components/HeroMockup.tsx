import { BookCover } from "@/components/BookCover";
import { cn } from "@/lib/utils";

/** A stylised interior page that peeks out from behind the cover. */
function InteriorPage({ className, label }: { className?: string; label: string }) {
  return (
    <div
      className={cn(
        "absolute flex aspect-[3/4] w-[7rem] flex-col gap-2 overflow-hidden rounded-lg bg-cream-50 p-3 shadow-card sm:w-[8.5rem]",
        className,
      )}
    >
      <div className="h-1.5 w-8 rounded-full bg-gold-400/70" />
      <div className="mt-1 space-y-1.5">
        <div className="h-1 w-full rounded-full bg-charcoal-100" />
        <div className="h-1 w-5/6 rounded-full bg-charcoal-100" />
        <div className="h-1 w-11/12 rounded-full bg-charcoal-100" />
        <div className="h-1 w-4/5 rounded-full bg-charcoal-100" />
        <div className="h-1 w-3/4 rounded-full bg-charcoal-100" />
      </div>
      <div className="mt-2 space-y-1.5">
        <div className="border-t border-cream-200 pt-2">
          <div className="h-2 w-2 rounded-full bg-sage-300" />
        </div>
      </div>
      <span className="mt-auto text-[7px] uppercase tracking-[0.2em] text-charcoal-400">
        {label}
      </span>
    </div>
  );
}

/**
 * Hero device composition: a laptop/tablet showing the cover, a phone showing
 * an interior "exercise" page, a floating cover, and layered page peeks — all
 * assembled with shadows for a premium, presentational feel.
 */
export function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      {/* ambient glow */}
      <div
        aria-hidden="true"
        className="absolute -inset-10 rounded-full bg-gradient-to-tr from-sunrise-200/30 via-cream-200/0 to-sage-200/30 blur-3xl"
      />

      <div className="relative flex items-center justify-center">
        {/* Tablet frame */}
        <div className="relative z-10 w-[68%] rounded-[1.6rem] border border-charcoal-200/60 bg-charcoal-900 p-3 shadow-lift sm:w-[60%]">
          <div className="overflow-hidden rounded-[1.1rem]">
            <BookCover className="rounded-none" />
          </div>
          {/* tablet notch/stand suggestion */}
          <div className="pointer-events-none absolute left-1/2 top-2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-charcoal-950" />
        </div>

        {/* Phone frame */}
        <div className="absolute -right-2 top-8 z-20 w-[30%] rounded-[1.6rem] border border-charcoal-200/60 bg-charcoal-900 p-2 shadow-lift sm:right-0 sm:w-[27%]">
          <div className="overflow-hidden rounded-[1.2rem] bg-cream-50 p-3">
            <div className="space-y-2">
              <div className="h-1.5 w-10 rounded-full bg-gold-400/70" />
              <div className="font-serif text-sm font-semibold text-charcoal-800">
                Today&apos;s reflection
              </div>
              <div className="space-y-1.5">
                <div className="h-1.5 w-full rounded-full bg-charcoal-100" />
                <div className="h-1.5 w-5/6 rounded-full bg-charcoal-100" />
                <div className="h-1.5 w-11/12 rounded-full bg-charcoal-100" />
                <div className="h-1.5 w-3/5 rounded-full bg-charcoal-100" />
              </div>
              <div className="mt-1 h-6 rounded-md bg-sage-200/70" />
            </div>
          </div>
          <div className="pointer-events-none absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-charcoal-950" />
        </div>

        {/* Floating cover */}
        <div className="absolute -left-4 bottom-0 z-30 w-[38%] animate-float sm:-left-8">
          <div className="rotate-[-6deg]">
            <BookCover className="rounded-lg shadow-gold" />
          </div>
        </div>

        {/* Peeks */}
        <InteriorPage label="Workbook" className="-left-10 top-6 -rotate-6 sm:-left-20" />
        <InteriorPage label="Journal" className="-right-16 top-24 rotate-6 hidden sm:block" />
      </div>
    </div>
  );
}
