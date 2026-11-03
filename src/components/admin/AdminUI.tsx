import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminHeader({ title, description, actions, back }: { title: string; description?: string; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && <Link href={back.href} className="mb-2 inline-block text-sm text-muted hover:text-ink">← {back.label}</Link>}
        <h1 className="text-3xl text-ink sm:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, children, className }: { title?: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-card p-5 sm:p-6", className)}>
      {title && <h2 className="font-sans text-base font-semibold text-ink">{title}</h2>}
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      <div className={cn(title && "mt-5")}>{children}</div>
    </section>
  );
}

const tones = {
  green: "bg-veg/10 text-veg",
  red: "bg-nonveg/10 text-nonveg",
  gold: "bg-gold/15 text-gold-deep",
  gray: "bg-sand text-cocoa",
  ink: "bg-ink text-ivory",
} as const;

export function Badge({ tone = "gray", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", tones[tone])}>{children}</span>;
}

export function Table({ children, minWidth = 720 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-card">
      <table className="w-full text-left text-sm" style={{ minWidth }}>{children}</table>
    </div>
  );
}
export const Th = ({ children, className }: { children?: ReactNode; className?: string }) => (
  <th className={cn("bg-cream/60 px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase", className)}>{children}</th>
);
export const Td = ({ children, className }: { children?: ReactNode; className?: string }) => <td className={cn("border-t border-line px-4 py-3 align-middle", className)}>{children}</td>;

export function Checkbox({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 h-4 w-4 accent-[var(--color-ink)]" />
      <span>
        <span className="text-sm font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function EmptyRow({ cols, children }: { cols: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={cols} className="border-t border-line px-4 py-12 text-center text-muted">{children}</td>
    </tr>
  );
}
