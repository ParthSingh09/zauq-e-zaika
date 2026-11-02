"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { useFormStatus } from "react-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { initialState, type ActionState } from "@/server/action-state";

const PendingContext = createContext<boolean | null>(null);

/**
 * Like useActionState, but submits through startTransition so React does not
 * auto-reset the form — visitors keep what they typed when validation fails.
 * The native `action` stays on the form as a no-JavaScript fallback.
 */
export function useFormAction(action: (state: ActionState, form: FormData) => Promise<ActionState>) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  };
  return { state, pending, formProps: { action: formAction, onSubmit } };
}

export function PendingProvider({ pending, children }: { pending: boolean; children: ReactNode }) {
  return <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>;
}

export function SubmitButton({ children, className, pendingLabel }: { children: ReactNode; className?: string; pendingLabel?: string }) {
  const status = useFormStatus();
  const ctx = useContext(PendingContext);
  const pending = ctx ?? status.pending;
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={cn("btn-primary", className)}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending ? pendingLabel ?? "Please wait…" : children}
    </button>
  );
}

/** Hidden anti-spam fields: a honeypot input and a render timestamp. */
export function SpamGuard() {
  const [ts, setTs] = useState("");
  useEffect(() => setTs(String(Date.now())), []);
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
      <input type="hidden" name="_ts" value={ts} />
    </div>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <div
      role={state.ok ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2 rounded-xl px-4 py-3 text-sm",
        state.ok ? "bg-veg/10 text-veg" : "bg-nonveg/10 text-nonveg",
      )}
    >
      {state.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{state.message}</span>
    </div>
  );
}

type Base = { label: string; name: string; error?: string; hint?: string; className?: string };

export function Field({ label, name, error, hint, className, ...rest }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const id = rest.id ?? `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {rest.required && <span className="text-spice-deep"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        className="field"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
      {hint && !error && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      {error && <p id={`${id}-err`} className="field-error">{error}</p>}
    </div>
  );
}

export function TextArea({ label, name, error, hint, className, ...rest }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = rest.id ?? `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {rest.required && <span className="text-spice-deep"> *</span>}
      </label>
      <textarea
        id={id}
        name={name}
        className="field min-h-28"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
      {hint && !error && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      {error && <p id={`${id}-err`} className="field-error">{error}</p>}
    </div>
  );
}

export function Select({ label, name, error, hint, className, children, ...rest }: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = rest.id ?? `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {rest.required && <span className="text-spice-deep"> *</span>}
      </label>
      <select id={id} name={name} className="field" aria-invalid={error ? true : undefined} {...rest}>
        {children}
      </select>
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
