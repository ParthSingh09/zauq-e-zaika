"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toaster";
import { cn } from "@/lib/utils";

/** Runs a server action after a confirmation prompt (used for deletes and destructive changes). */
export function ConfirmButton({
  action,
  confirm,
  children,
  className,
  redirectTo,
}: {
  action: () => Promise<{ ok: boolean; message?: string }>;
  confirm?: string;
  children: ReactNode;
  className?: string;
  redirectTo?: string;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      className={cn(confirm ? "btn-ghost btn-sm text-nonveg hover:bg-nonveg/10" : "btn-ghost btn-sm", className)}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const res = await action();
          toast(res.message ?? (res.ok ? "Done." : "Something went wrong."), res.ok ? "success" : "error");
          if (res.ok) {
            if (redirectTo) router.push(redirectTo);
            else router.refresh();
          }
        });
      }}
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}
