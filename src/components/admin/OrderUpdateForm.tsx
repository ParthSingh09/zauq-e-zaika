"use client";

import { ActionForm } from "./ActionForm";
import { Select, SubmitButton, TextArea } from "@/components/ui/Form";
import { updateOrder } from "@/server/actions/admin/orders";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/site";

export function OrderUpdateForm({ id, status, paymentStatus }: { id: string; status: string; paymentStatus: string }) {
  const cancelled = status === "CANCELLED";
  return (
    <ActionForm action={updateOrder} className="space-y-4">
      {(e) => (
        <>
          <input type="hidden" name="id" value={id} />
          {cancelled ? (
            <>
              <input type="hidden" name="status" value="CANCELLED" />
              <p className="rounded-lg bg-nonveg/10 px-3 py-2 text-sm text-nonveg">This order is cancelled.</p>
            </>
          ) : (
            <Select label="Order status" name="status" defaultValue={status}>
              {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          )}
          <Select label="Payment status" name="paymentStatus" defaultValue={paymentStatus}>
            {Object.entries(PAYMENT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <TextArea label="Note (optional; required to cancel)" name="note" rows={3} error={e.note} hint="Saved to the order history. Customers see the cancellation reason." />
          <SubmitButton className="w-full" pendingLabel="Updating…">Update order</SubmitButton>
          <p className="text-xs text-muted">Cancelling returns tracked stock to inventory. Refund online payments from your Razorpay dashboard, then set payment to “Refunded”.</p>
        </>
      )}
    </ActionForm>
  );
}
