"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { submitEnquiry } from "@/server/actions/public";
import { Field, FormMessage, PendingProvider, SpamGuard, SubmitButton, TextArea, useFormAction } from "@/components/ui/Form";

export function ContactForm() {
  const { state, pending, formProps } = useFormAction(submitEnquiry);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);
  const e = state.errors ?? {};
  return (
    <PendingProvider pending={pending}>
    <form ref={form} {...formProps} className="relative space-y-5" noValidate>
      <SpamGuard />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" name="name" required autoComplete="name" maxLength={100} error={e.name} />
        <Field label="Email" name="email" type="email" required autoComplete="email" maxLength={160} error={e.email} />
        <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" maxLength={20} error={e.phone} />
        <Field label="Subject" name="subject" required maxLength={150} error={e.subject} />
      </div>
      <TextArea label="Message" name="message" required rows={6} maxLength={5000} error={e.message} />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Sending…">Send message</SubmitButton>
      <p className="text-xs text-muted">We use your details only to reply to your message. See our <Link href="/policies/privacy-policy" className="underline">Privacy Policy</Link>.</p>
    </form>
    </PendingProvider>
  );
}
