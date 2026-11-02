"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import type { ActionState } from "@/server/action-state";
import { initialState } from "@/server/action-state";
import { FormMessage, PendingProvider, useFormAction } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toaster";

type Action = (state: ActionState, form: FormData) => Promise<ActionState>;

/**
 * Wraps an admin server action: shows validation errors, toasts on success,
 * and follows `data.redirect` when the action returns one.
 * Children may be a render function receiving field errors.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
}: {
  action: Action;
  children: ReactNode | ((errors: Record<string, string>) => ReactNode);
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const { state, pending, formProps } = useFormAction(action);
  const toast = useToast();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const last = useRef<ActionState | null>(null);

  useEffect(() => {
    if (state === initialState || last.current === state) return;
    last.current = state;
    if (state.ok) {
      toast(state.message || "Saved.");
      if (resetOnSuccess) ref.current?.reset();
      if (state.data?.redirect) router.push(state.data.redirect);
      else router.refresh();
    } else if (state.message && !state.errors) {
      toast(state.message, "error");
    }
  }, [state, toast, router, resetOnSuccess]);

  return (
    <PendingProvider pending={pending}>
    <form ref={ref} {...formProps} className={className} noValidate>
      {typeof children === "function" ? children(state.errors ?? {}) : children}
      {!state.ok && state.errors && <div className="mt-4"><FormMessage state={state} /></div>}
    </form>
    </PendingProvider>
  );
}
