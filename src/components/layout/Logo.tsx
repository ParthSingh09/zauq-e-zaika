import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("shrink-0", className)}>
      <path d="M32 23.5c-8.6-6-7.4-14.6-2-13.2 1.3.4 2 1.6 2 1.6s.7-1.2 2-1.6c5.4-1.4 6.6 7.2-2 13.2z" fill="var(--color-spice)" />
      <rect x="17" y="27" width="30" height="5" rx="2.5" fill="var(--color-gold)" />
      <path d="M15 33.5h34c0 12.5-7.4 21.5-17 21.5S15 46 15 33.5z" fill="var(--color-gold)" />
      <path d="M17.6 41h28.8" stroke="var(--color-ink)" strokeWidth="1.6" strokeLinecap="round" opacity=".35" />
    </svg>
  );
}

/** Text-based logo treatment — replace with the final logo file when available. */
export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Zauq e Zaika — home">
      <LogoMark className="h-9 w-9 transition-transform duration-500 group-hover:-rotate-6" />
      <span className="flex flex-col leading-none">
        <span className={cn("font-serif text-[1.35rem] font-medium tracking-tight", tone === "dark" ? "text-ink" : "text-paper")}>
          Zauq <span className={cn("italic", tone === "dark" ? "text-gold-deep" : "text-gold")}>e</span> Zaika
        </span>
        <span className={cn("mt-1 text-[0.58rem] font-semibold tracking-[0.16em] whitespace-nowrap uppercase sm:text-[0.62rem] sm:tracking-[0.24em]", tone === "dark" ? "text-muted" : "text-paper/60")}>
          Har Zaika, Dil Se ♡
        </span>
      </span>
    </Link>
  );
}
