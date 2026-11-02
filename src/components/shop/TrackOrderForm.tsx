"use client";

import { trackOrder } from "@/server/actions/track";
import { Field, FormMessage, PendingProvider, SubmitButton, useFormAction } from "@/components/ui/Form";

export function TrackOrderForm() {
  const { state, pending, formProps } = useFormAction(trackOrder);
  return (
    <PendingProvider pending={pending}>
    <form {...formProps} className="space-y-4" noValidate>
      <Field label="Order number" name="orderNumber" required placeholder="ZZ-261102-A1B2C3" error={state.errors?.orderNumber} />
      <Field label="Email address" name="email" type="email" required autoComplete="email" error={state.errors?.email} />
      <FormMessage state={state} />
      <SubmitButton className="w-full" pendingLabel="Looking up…">Track order</SubmitButton>
    </form>
    </PendingProvider>
  );
}
