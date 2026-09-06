import { cn } from "@/lib/utils";
import { config } from "@/lib/config";

/**
 * Brand wordmark. An ascending, horizon-motif mark suggests a new beginning,
 * paired with the serif wordmark for a premium, calm feel.
 */
export function Logo({ className, textClassName }: { className?: string; textClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 32 32"
        className="h-8 w-8 shrink-0"
        aria-hidden="true"
        fill="none"
      >
        <circle cx="16" cy="16" r="15.5" stroke="#B9963F" strokeWidth="1.2" opacity="0.5" />
        <path
          d="M7 21.5c3.2-1.4 4.5-4.5 5.5-8 1 3.8 2.6 6.4 5.6 7.4 1.8.6 3.6.4 5.9-1.4C21.4 24 17.5 25 15.5 24.2 11.8 22.7 9.5 20.4 7 21.5Z"
          fill="#B9963F"
          opacity="0.85"
        />
        <path
          d="M4 16.5h24"
          stroke="#7E6526"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.55"
        />
        <circle cx="16" cy="16" r="3.4" fill="#7E6526" />
      </svg>
      <span
        className={cn(
          "font-serif text-2xl font-semibold tracking-tight text-charcoal-900",
          textClassName,
        )}
      >
        {config.app.productName}
      </span>
    </span>
  );
}
