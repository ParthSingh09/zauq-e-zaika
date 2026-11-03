"use client";

import { subscribeNewsletter } from "@/server/actions/public";
import { FormMessage, PendingProvider, SpamGuard, SubmitButton, useFormAction } from "@/components/ui/Form";
import { cn } from "@/lib/utils";

export function NewsletterForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { state, pending, formProps } = useFormAction(subscribeNewsletter);
  return (
    <PendingProvider pending={pending}>
    <form {...formProps} className="relative w-full max-w-md space-y-3" noValidate>
      <SpamGuard />
      <div className={cn("flex flex-col gap-2", tone === "light" && "sm:flex-row")}>
        <label htmlFor={`nl-${tone}`} className="sr-only">Email address</label>
        <input
          id={`nl-${tone}`}
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          aria-invalid={state.errors?.email ? true : undefined}
          className={cn(
            "field flex-1 rounded-full",
            tone === "dark" && "border-white/15 bg-white/10 text-paper placeholder:text-paper/60 focus:bg-white/15",
          )}
        />
        <SubmitButton className={cn(tone === "dark" && "bg-gold text-night hover:bg-[#e2b061]")} pendingLabel="Subscribing…">
          Subscribe
        </SubmitButton>
      </div>
      {state.errors?.email ? (
        <p className={cn("text-sm", tone === "dark" ? "text-[#F2A07B]" : "text-nonveg")} role="alert">{state.errors.email}</p>
      ) : (
        <FormMessage state={state} />
      )}
    </form>
    </PendingProvider>
  );
}
