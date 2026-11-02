"use client";

import Link from "next/link";
import { login, register } from "@/server/actions/account";
import { Field, FormMessage, PendingProvider, SpamGuard, SubmitButton, useFormAction } from "@/components/ui/Form";

export function LoginForm({ next, area }: { next?: string; area?: "admin" }) {
  const { state, pending, formProps } = useFormAction(login);
  return (
    <PendingProvider pending={pending}>
    <form {...formProps} className="space-y-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {area && <input type="hidden" name="area" value={area} />}
      <Field label="Email" name="email" type="email" required autoComplete="email" error={state.errors?.email} />
      <Field label="Password" name="password" type="password" required autoComplete="current-password" error={state.errors?.password} />
      <FormMessage state={state} />
      <SubmitButton className="w-full" pendingLabel="Signing in…">Sign in</SubmitButton>
      {!area && (
        <p className="text-center text-sm text-muted">
          New here? <Link href={`/account/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-spice-deep underline">Create an account</Link>
        </p>
      )}
    </form>
    </PendingProvider>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const { state, pending, formProps } = useFormAction(register);
  const e = state.errors ?? {};
  return (
    <PendingProvider pending={pending}>
    <form {...formProps} className="relative space-y-5" noValidate>
      <SpamGuard />
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Full name" name="name" required autoComplete="name" error={e.name} />
      <Field label="Email" name="email" type="email" required autoComplete="email" error={e.email} />
      <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" error={e.phone} />
      <Field label="Password" name="password" type="password" required autoComplete="new-password" minLength={10} error={e.password} hint="At least 10 characters, including a letter and a number." />
      <FormMessage state={state} />
      <SubmitButton className="w-full" pendingLabel="Creating account…">Create account</SubmitButton>
      <p className="text-center text-sm text-muted">
        Already have an account? <Link href={`/account/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-spice-deep underline">Sign in</Link>
      </p>
    </form>
    </PendingProvider>
  );
}
