"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { Minus, Plus, Trash2, AlertCircle } from "lucide-react";
import { useCart } from "./CartProvider";
import { useQuote } from "./useQuote";
import { formatPaise } from "@/lib/money";
import { EmptyState } from "@/components/ui/EmptyState";

export function CartView({ checkoutEnabled, notice }: { checkoutEnabled: boolean; notice: string }) {
  const { items, ready, setQuantity, remove } = useCart();
  const { quote, loading } = useQuote(items, ready);

  // Drop items that no longer exist (deleted products).
  useEffect(() => {
    if (!quote || loading) return;
    for (const i of items) {
      if (!quote.lines.some((l) => l.productId === i.productId && (l.variantId ?? null) === (i.variantId ?? null))) remove(i.productId, i.variantId);
    }
  }, [quote, loading, items, remove]);

  if (!ready || (loading && !quote))
    return (
      <div className="grid gap-8 lg:grid-cols-3" aria-busy="true" aria-label="Loading cart">
        <div className="space-y-4 lg:col-span-2">{[0, 1].map((i) => <div key={i} className="skeleton h-28" />)}</div>
        <div className="skeleton h-56" />
      </div>
    );

  if (!items.length)
    return (
      <EmptyState
        title="Your cart is empty"
        body="Explore our homemade sweets, snacks and pickles — or find a recipe to cook tonight."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="btn-primary">Visit the shop</Link>
            <Link href="/recipes" className="btn-outline">Browse recipes</Link>
          </div>
        }
      />
    );

  const lines = quote?.lines ?? [];
  const canCheckout = checkoutEnabled && quote?.allPurchasable;

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <ul className="divide-y divide-line border-y border-line lg:col-span-2" aria-busy={loading}>
        {lines.map((l) => (
          <li key={`${l.productId}-${l.variantId}`} className="flex gap-4 py-6">
            <Link href={`/shop/${l.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-cream sm:h-28 sm:w-28">
              {l.image && <Image src={l.image} alt={l.name} fill sizes="112px" className="object-cover" />}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/shop/${l.slug}`} className="font-serif text-lg text-ink hover:underline">{l.name}</Link>
                  {l.variantName && <p className="text-sm text-muted">{l.variantName}</p>}
                </div>
                <p className="shrink-0 font-semibold text-ink">{formatPaise(l.unitPaise * l.quantity)}</p>
              </div>
              {l.problem && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-nonveg"><AlertCircle className="h-4 w-4" /> {l.problem}</p>
              )}
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="flex h-10 items-center rounded-full border border-beige bg-white">
                  <button type="button" onClick={() => setQuantity(l.productId, l.variantId, l.quantity - 1)} className="flex h-10 w-10 items-center justify-center" aria-label={`Decrease quantity of ${l.name}`}>
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{l.quantity}</span>
                  <button type="button" onClick={() => setQuantity(l.productId, l.variantId, l.quantity + 1)} disabled={l.quantity >= 50} className="flex h-10 w-10 items-center justify-center disabled:opacity-40" aria-label={`Increase quantity of ${l.name}`}>
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button type="button" onClick={() => remove(l.productId, l.variantId)} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-nonveg">
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-[var(--radius-card)] bg-cream/70 p-6 ring-1 ring-line/70 lg:sticky lg:top-24">
        <h2 className="text-2xl text-ink">Order summary</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold text-ink">{formatPaise(quote?.subtotalPaise ?? 0)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="text-muted">Calculated at checkout</dd></div>
        </dl>
        {canCheckout ? (
          <Link href="/checkout" className="btn-primary mt-6 w-full">Proceed to checkout</Link>
        ) : (
          <>
            <button type="button" disabled className="btn-primary mt-6 w-full">Checkout unavailable</button>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              {!checkoutEnabled ? notice || "Online ordering is not open yet." : "Please remove or update the items marked above."}
            </p>
          </>
        )}
        <Link href="/shop" className="mt-4 block text-center text-sm font-medium text-spice-deep hover:underline">Continue shopping</Link>
      </aside>
    </div>
  );
}
