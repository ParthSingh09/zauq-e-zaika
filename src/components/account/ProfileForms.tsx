"use client";

import { changePassword, updateProfile } from "@/server/actions/account";
import { Field, FormMessage, PendingProvider, SubmitButton, useFormAction } from "@/components/ui/Form";

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const { state, pending, formProps } = useFormAction(updateProfile);
  return (
    <PendingProvider pending={pending}>
    <form {...formProps} className="space-y-4">
      <Field label="Full name" name="name" required defaultValue={name} error={state.errors?.name} />
      <Field label="Phone" name="phone" type="tel" defaultValue={phone} error={state.errors?.phone} />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
    </form>
    </PendingProvider>
  );
}

export function PasswordForm() {
  const { state, pending, formProps } = useFormAction(changePassword);
  return (
    <PendingProvider pending={pending}>
    <form {...formProps} className="space-y-4">
      <Field label="Current password" name="current" type="password" autoComplete="current-password" required error={state.errors?.current} />
      <Field label="New password" name="next" type="password" autoComplete="new-password" required error={state.errors?.next} hint="At least 10 characters, including a letter and a number." />
      <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" required error={state.errors?.confirm} />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Updating…">Change password</SubmitButton>
    </form>
    </PendingProvider>
  );
}
