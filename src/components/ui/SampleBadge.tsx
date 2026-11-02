import { cn } from "@/lib/utils";

/** Visible marker for demonstration content that must be replaced before launch. */
export function SampleBadge({ className, label = "Sample content" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-ivory uppercase backdrop-blur",
        className,
      )}
    >
      {label}
    </span>
  );
}
