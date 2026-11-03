"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "./CartProvider";
import { useToast } from "@/components/ui/Toaster";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";

type Variant = { id: string; name: string; pricePaise: number; stock: number };

export function AddToCart({
  productId,
  basePricePaise,
  variants,
  trackStock,
  stock,
  blockedReason,
  isSample,
}: {
  productId: string;
  basePricePaise: number;
  variants: Variant[];
  trackStock: boolean;
  stock: number;
  /** When set, purchasing is disabled and this reason is shown. */
  blockedReason: string | null;
  isSample: boolean;
}) {
  const { add } = useCart();
  const toast = useToast();
  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const variant = variants.find((v) => v.id === variantId) ?? null;
  const price = variant?.pricePaise ?? basePricePaise;
  const available = trackStock ? (variant ? variant.stock : stock) : 50;
  const soldOut = trackStock && available <= 0;
  const disabled = Boolean(blockedReason) || soldOut;

  return (
    <div className="space-y-6">
      <p className="font-serif text-3xl text-ink">
        {isSample ? <span className="text-xl text-muted">Price to be announced</span> : formatPaise(price)}
      </p>

      {variants.length > 0 && (
        <fieldset>
          <legend className="field-label">Choose an option</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <label key={v.id} className={cn("chip cursor-pointer", v.id === variantId && "border-ink bg-ink text-ivory hover:text-ivory")}>
                <input type="radio" name="variant" value={v.id} checked={v.id === variantId} onChange={() => setVariantId(v.id)} className="sr-only" />
                {v.name}
                {!isSample && <span className="opacity-70">· {formatPaise(v.pricePaise)}</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex h-12 items-center rounded-full border border-beige bg-card">
          <button type="button" className="flex h-12 w-12 items-center justify-center disabled:opacity-40" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={disabled || qty <= 1} aria-label="Decrease quantity">
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center font-semibold" aria-live="polite" aria-label={`Quantity ${qty}`}>{qty}</span>
          <button type="button" className="flex h-12 w-12 items-center justify-center disabled:opacity-40" onClick={() => setQty((q) => Math.min(Math.min(50, available), q + 1))} disabled={disabled || qty >= Math.min(50, available)} aria-label="Increase quantity">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            add({ productId, variantId, quantity: qty });
            toast("Added to your cart.");
          }}
          className="btn-primary h-12 flex-1"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden /> {soldOut ? "Sold out" : "Add to cart"}
        </button>
      </div>
      {blockedReason && <p className="rounded-xl bg-cream px-4 py-3 text-sm text-cocoa">{blockedReason}</p>}
      {!disabled && (
        <Link href="/cart" className="inline-block text-sm font-medium text-spice-deep hover:underline">View cart →</Link>
      )}
    </div>
  );
}
