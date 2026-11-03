import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/site";

/** The official Zauq-e-Zaika emblem (public/brand/logo.png). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/logo.png"
      alt=""
      width={160}
      height={160}
      className={cn("shrink-0 rounded-full", className)}
      aria-hidden="true"
    />
  );
}

/** Emblem + wordmark. The emblem is the real logo; the text keeps the name readable at small sizes. */
export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5 sm:gap-3", className)} aria-label={`${BRAND.name} — home`}>
      <LogoMark className="h-10 w-10 shadow-sm sm:h-11 sm:w-11 transition-transform duration-500 group-hover:-rotate-6" />
      <span className="flex flex-col leading-none">
        <span className={cn("font-serif text-[1.15rem] font-medium sm:text-[1.35rem] tracking-tight", tone === "dark" ? "text-ink" : "text-paper")}>
          {BRAND.name}
        </span>
        <span className={cn("mt-1 text-[0.54rem] font-semibold tracking-[0.12em] whitespace-nowrap uppercase sm:text-[0.62rem] sm:tracking-[0.24em]", tone === "dark" ? "text-muted" : "text-paper/60")}>
          {BRAND.tagline}
        </span>
      </span>
    </Link>
  );
}
