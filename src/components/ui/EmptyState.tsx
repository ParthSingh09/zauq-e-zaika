import type { ReactNode } from "react";
import { LogoMark } from "@/components/layout/Logo";

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-beige bg-cream/50 px-6 py-16 text-center">
      <LogoMark className="mb-5 h-14 w-14 opacity-80" />
      <h3 className="text-2xl text-ink">{title}</h3>
      {body && <p className="mt-2 max-w-md text-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
