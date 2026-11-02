"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = { productId: string; variantId: string | null; quantity: number };

type CartCtx = {
  items: CartItem[];
  count: number;
  ready: boolean;
  add: (item: CartItem) => void;
  setQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  remove: (productId: string, variantId: string | null) => void;
  clear: () => void;
};

const KEY = "zz_cart_v1";
const Ctx = createContext<CartCtx | null>(null);

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

const same = (a: CartItem, productId: string, variantId: string | null) =>
  a.productId === productId && (a.variantId ?? null) === (variantId ?? null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed.filter((i) => i && typeof i.productId === "string"));
      }
    } catch {}
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        try {
          setItems(JSON.parse(e.newValue || "[]"));
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = useCallback((item: CartItem) => {
    setItems((all) => {
      const existing = all.find((i) => same(i, item.productId, item.variantId));
      if (existing)
        return all.map((i) =>
          same(i, item.productId, item.variantId) ? { ...i, quantity: Math.min(50, i.quantity + item.quantity) } : i,
        );
      return [...all, { ...item, quantity: Math.min(50, item.quantity) }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, variantId: string | null, quantity: number) => {
    setItems((all) =>
      quantity <= 0
        ? all.filter((i) => !same(i, productId, variantId))
        : all.map((i) => (same(i, productId, variantId) ? { ...i, quantity: Math.min(50, quantity) } : i)),
    );
  }, []);

  const remove = useCallback(
    (productId: string, variantId: string | null) => setItems((all) => all.filter((i) => !same(i, productId, variantId))),
    [],
  );
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, count: items.reduce((s, i) => s + i.quantity, 0), ready, add, setQuantity, remove, clear }),
    [items, ready, add, setQuantity, remove, clear],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
