"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, Lock, ShieldCheck } from "lucide-react";
import { placeOrder } from "@/server/actions/checkout";
import { useCart } from "./CartProvider";
import { useQuote } from "./useQuote";
import { Field, FormMessage, PendingProvider, SubmitButton, TextArea, useFormAction } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toaster";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";

type Options = {
  allowDelivery: boolean;
  allowPickup: boolean;
  pickupAddress: string;
  pickupInstructions: string;
  allowPayOnDelivery: boolean;
  razorpayAvailable: boolean;
  razorpayTestMode: boolean;
  preparationTime: string;
  orderCutoff: string;
  hasRegions: boolean;
};

type RazorpayHandlerResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: () => void) => void };
  }
}

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function CheckoutForm({ options, defaults }: { options: Options; defaults: { name: string; email: string; phone: string } }) {
  const { items, ready, clear } = useCart();
  const router = useRouter();
  const toast = useToast();
  const { state, pending, formProps } = useFormAction(placeOrder);
  const [fulfillment, setFulfillment] = useState<"DELIVERY" | "PICKUP">(options.allowDelivery ? "DELIVERY" : "PICKUP");
  const [postal, setPostal] = useState("");
  const [payment, setPayment] = useState(options.razorpayAvailable ? "RAZORPAY" : "PAY_ON_DELIVERY");
  const handled = useRef<unknown>(null);
  const validPostal = /^\d{6}$/.test(postal) ? postal : "";
  const { quote, loading } = useQuote(items, ready, { fulfillment, postalCode: fulfillment === "DELIVERY" ? validPostal : "" });

  useEffect(() => {
    if (!state.ok || !state.data || handled.current === state) return;
    handled.current = state;
    const d = state.data;
    if (d.mode === "redirect") {
      clear();
      router.push(d.confirmUrl);
      return;
    }
    (async () => {
      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) {
        toast("Could not load the payment window. Your order is saved — we will contact you.", "error");
        clear();
        router.push(d.confirmUrl);
        return;
      }
      const rzp = new window.Razorpay({
        key: d.keyId,
        amount: Number(d.amount),
        currency: "INR",
        name: "Zauq e Zaika",
        description: `Order ${d.orderNumber}`,
        order_id: d.razorpayOrderId,
        prefill: { name: d.name, email: d.email, contact: d.phone },
        theme: { color: "#39271E" },
        handler: async (resp: RazorpayHandlerResponse) => {
          await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderNumber: d.orderNumber, token: d.token, ...resp }),
          }).catch(() => {});
          clear();
          router.push(d.confirmUrl);
        },
        modal: {
          ondismiss: () => {
            toast("Payment was not completed. You can retry from your order page.", "error");
            clear();
            router.push(d.confirmUrl);
          },
        },
      });
      rzp.open();
    })();
  }, [state, clear, router, toast]);

  if (ready && !items.length && !state.ok)
    return (
      <div className="rounded-2xl border border-line bg-card p-10 text-center">
        <p className="text-lg text-cocoa">Your cart is empty.</p>
        <Link href="/shop" className="btn-primary mt-6">Visit the shop</Link>
      </div>
    );

  const e = state.errors ?? {};
  const problems = quote?.problems ?? [];
  const blocking = problems.length > 0 || (fulfillment === "DELIVERY" && !quote?.regionMatched);

  return (
    <PendingProvider pending={pending}>
    <form {...formProps} className="grid gap-10 lg:grid-cols-5" noValidate>
      <input type="hidden" name="cart" value={JSON.stringify(items)} />
      <input type="hidden" name="fulfillment" value={fulfillment} />
      <input type="hidden" name="paymentMethod" value={payment} />

      <div className="space-y-10 lg:col-span-3">
        <section aria-labelledby="contact-h">
          <h2 id="contact-h" className="mb-5 text-2xl text-ink">1. Your details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" name="name" required autoComplete="name" defaultValue={defaults.name} error={e.name} className="sm:col-span-2" />
            <Field label="Email" name="email" type="email" required autoComplete="email" defaultValue={defaults.email} error={e.email} hint="Your order confirmation link is tied to this email." />
            <Field label="Phone" name="phone" type="tel" required autoComplete="tel" defaultValue={defaults.phone} error={e.phone} hint="We may call to confirm your order." />
          </div>
        </section>

        <section aria-labelledby="fulfil-h">
          <h2 id="fulfil-h" className="mb-5 text-2xl text-ink">2. Delivery or pickup</h2>
          {options.allowDelivery && options.allowPickup && (
            <div className="mb-5 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Fulfilment method">
              {(["DELIVERY", "PICKUP"] as const).map((f) => (
                <button key={f} type="button" role="radio" aria-checked={fulfillment === f} onClick={() => setFulfillment(f)}
                  className={cn("rounded-2xl border p-4 text-left transition", fulfillment === f ? "border-ink bg-ink text-ivory" : "border-line bg-card hover:border-gold")}>
                  <span className="font-semibold">{f === "DELIVERY" ? "Home delivery" : "Pickup"}</span>
                  <span className={cn("mt-1 block text-xs", fulfillment === f ? "text-ivory/70" : "text-muted")}>
                    {f === "DELIVERY" ? "To serviceable PIN codes" : "Collect from our kitchen"}
                  </span>
                </button>
              ))}
            </div>
          )}
          {fulfillment === "DELIVERY" ? (
            options.hasRegions ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Address" name="addressLine1" required autoComplete="address-line1" error={e.addressLine1} className="sm:col-span-2" />
                <Field label="Apartment, landmark (optional)" name="addressLine2" autoComplete="address-line2" className="sm:col-span-2" />
                <Field label="City" name="city" required autoComplete="address-level2" error={e.city} />
                <Field label="State" name="state" autoComplete="address-level1" />
                <Field label="PIN code" name="postalCode" required inputMode="numeric" maxLength={6} autoComplete="postal-code" value={postal}
                  onChange={(ev) => setPostal(ev.target.value.replace(/\D/g, "").slice(0, 6))}
                  error={e.postalCode ?? (validPostal && !loading && !quote?.regionMatched ? "Sorry — we don’t deliver to this PIN code yet." : undefined)}
                  hint="We’ll confirm whether we deliver to your area." />
              </div>
            ) : (
              <p className="rounded-xl bg-cream px-4 py-3 text-sm text-cocoa">Delivery areas have not been set up yet, so delivery orders can’t be placed.</p>
            )
          ) : (
            <div className="rounded-2xl border border-line bg-card p-5 text-sm text-cocoa">
              <p className="font-semibold text-ink">Pickup location</p>
              <p className="mt-1 whitespace-pre-line">{options.pickupAddress || "Pickup details will be shared after your order is confirmed."}</p>
              {options.pickupInstructions && <p className="mt-2 text-muted">{options.pickupInstructions}</p>}
            </div>
          )}
          <TextArea label="Order notes (optional)" name="notes" maxLength={1000} className="mt-4" placeholder="Allergies, preferred delivery time, gate code…" />
          {(options.preparationTime || options.orderCutoff) && (
            <p className="mt-3 text-xs text-muted">
              {options.preparationTime && <>Preparation time: {options.preparationTime}. </>}
              {options.orderCutoff && <>Order cut-off: {options.orderCutoff}.</>}
            </p>
          )}
        </section>

        <section aria-labelledby="pay-h">
          <h2 id="pay-h" className="mb-5 text-2xl text-ink">3. Payment</h2>
          <div className="space-y-3" role="radiogroup" aria-label="Payment method">
            {options.razorpayAvailable && (
              <button type="button" role="radio" aria-checked={payment === "RAZORPAY"} onClick={() => setPayment("RAZORPAY")}
                className={cn("flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition", payment === "RAZORPAY" ? "border-ink ring-1 ring-ink" : "border-line bg-card hover:border-gold")}>
                <span className={cn("mt-1 h-4 w-4 shrink-0 rounded-full border-2", payment === "RAZORPAY" ? "border-ink bg-ink" : "border-beige")} />
                <span>
                  <span className="font-semibold text-ink">Pay online — UPI, cards, netbanking</span>
                  <span className="block text-xs text-muted">Secured by Razorpay. We never see or store your card details.{options.razorpayTestMode && " (TEST MODE — no real money is charged.)"}</span>
                </span>
              </button>
            )}
            {options.allowPayOnDelivery && (
              <button type="button" role="radio" aria-checked={payment === "PAY_ON_DELIVERY"} onClick={() => setPayment("PAY_ON_DELIVERY")}
                className={cn("flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition", payment === "PAY_ON_DELIVERY" ? "border-ink ring-1 ring-ink" : "border-line bg-card hover:border-gold")}>
                <span className={cn("mt-1 h-4 w-4 shrink-0 rounded-full border-2", payment === "PAY_ON_DELIVERY" ? "border-ink bg-ink" : "border-beige")} />
                <span>
                  <span className="font-semibold text-ink">Pay on {fulfillment === "PICKUP" ? "pickup" : "delivery"}</span>
                  <span className="block text-xs text-muted">Pay by cash or UPI when you receive your order. We’ll confirm your order by phone.</span>
                </span>
              </button>
            )}
            {!options.razorpayAvailable && !options.allowPayOnDelivery && (
              <p className="rounded-xl bg-cream px-4 py-3 text-sm text-cocoa">No payment methods are available yet.</p>
            )}
          </div>
          <label className="mt-6 flex items-start gap-3 text-sm text-cocoa">
            <input type="checkbox" name="acceptTerms" className="mt-0.5 h-4 w-4 accent-[var(--color-ink)]" />
            <span>
              I agree to the <Link href="/policies/terms-and-conditions" className="underline" target="_blank">Terms</Link>,{" "}
              <Link href="/policies/returns-and-refunds" className="underline" target="_blank">Refund</Link> and{" "}
              <Link href="/policies/cancellation-policy" className="underline" target="_blank">Cancellation</Link> policies.
            </span>
          </label>
          {e.acceptTerms && <p className="field-error">{e.acceptTerms}</p>}
        </section>
      </div>

      <aside className="h-fit space-y-5 rounded-[var(--radius-card)] bg-cream/70 p-6 ring-1 ring-line/70 lg:sticky lg:top-24 lg:col-span-2">
        <h2 className="text-2xl text-ink">Order summary</h2>
        <ul className="divide-y divide-line/70" aria-busy={loading}>
          {(quote?.lines ?? []).map((l) => (
            <li key={`${l.productId}-${l.variantId}`} className="flex items-center gap-3 py-3">
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-card">
                {l.image && <Image src={l.image} alt="" fill sizes="56px" className="object-cover" />}
                <span className="absolute -top-0 -right-0 rounded-bl-lg bg-ink px-1.5 text-[11px] font-bold text-ivory">{l.quantity}</span>
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="block truncate font-medium text-ink">{l.name}</span>
                {l.variantName && <span className="text-muted">{l.variantName}</span>}
              </span>
              <span className="text-sm font-semibold">{formatPaise(l.unitPaise * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPaise(quote?.subtotalPaise ?? 0)}</dd></div>
          <div className="flex justify-between">
            <dt className="text-muted">{fulfillment === "PICKUP" ? "Pickup" : "Delivery"}</dt>
            <dd>{fulfillment === "PICKUP" ? "Free" : quote?.regionMatched ? (quote.deliveryPaise ? formatPaise(quote.deliveryPaise) : "Free") : "Enter PIN code"}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-ink">
            <dt>Total</dt><dd>{formatPaise(quote?.totalPaise ?? quote?.subtotalPaise ?? 0)}</dd>
          </div>
        </dl>
        {problems.length > 0 && (
          <ul className="space-y-1.5 rounded-xl bg-nonveg/10 p-3 text-sm text-nonveg">
            {problems.map((p) => <li key={p} className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {p}</li>)}
          </ul>
        )}
        <FormMessage state={state} />
        <SubmitButton className="h-12 w-full" pendingLabel="Placing order…">
          <Lock className="h-4 w-4" aria-hidden /> {payment === "RAZORPAY" ? "Pay & place order" : "Place order"}
        </SubmitButton>
        {blocking && !problems.length && fulfillment === "DELIVERY" && (
          <p className="text-center text-xs text-muted">Enter a serviceable PIN code to continue.</p>
        )}
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted"><ShieldCheck className="h-4 w-4" /> Prices are confirmed securely on our server.</p>
      </aside>
    </form>
    </PendingProvider>
  );
}
