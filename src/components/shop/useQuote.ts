"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "./CartProvider";

export type QuoteLine = {
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  variantName: string | null;
  image: string | null;
  unitPaise: number;
  quantity: number;
  purchasable: boolean;
  problem: string | null;
};
export type Quote = {
  lines: QuoteLine[];
  subtotalPaise: number;
  allPurchasable: boolean;
  deliveryPaise?: number;
  totalPaise?: number;
  regionMatched?: boolean;
  problems?: string[];
};

/** Fetches authoritative prices for the cart from the server. */
export function useQuote(items: CartItem[], ready: boolean, extra?: { fulfillment?: string; postalCode?: string }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify({ items, extra });
  useEffect(() => {
    if (!ready) return;
    if (!items.length) {
      setQuote({ lines: [], subtotalPaise: 0, allPurchasable: false });
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      fetch("/api/cart/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, ...extra }),
        signal: ctrl.signal,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((q) => {
          if (q) setQuote(q);
          setLoading(false);
        })
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);
  return { quote, loading };
}
