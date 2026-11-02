import "server-only";
import { z } from "zod";
import type { DeliveryRegion } from "@prisma/client";
import { prisma } from "./db";

export const cartItemSchema = z.object({
  productId: z.string().min(1).max(40),
  variantId: z.string().max(40).nullish(),
  quantity: z.number().int().min(1).max(50),
});
export const cartSchema = z.array(cartItemSchema).max(50);
export type CartItemInput = z.infer<typeof cartItemSchema>;

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

/**
 * Re-prices a cart from the database. Client-side prices are never trusted.
 * Each line reports whether it can currently be purchased and why not.
 */
export async function quoteCart(items: CartItemInput[]) {
  const ids = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: { variants: { orderBy: { sortOrder: "asc" } } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: QuoteLine[] = [];
  for (const item of items) {
    const p = byId.get(item.productId);
    if (!p || p.status === "ARCHIVED") continue; // silently drop deleted products
    const variant = item.variantId ? p.variants.find((v) => v.id === item.variantId) ?? null : null;
    let problem: string | null = null;
    if (p.isSample) problem = "Demonstration product — not available for purchase.";
    else if (p.status !== "ACTIVE") problem = "This product is not currently listed.";
    else if (!p.available) problem = "Currently unavailable.";
    else if (p.variants.length && !variant) problem = "Please choose an option.";
    else if (p.trackStock) {
      const stock = variant ? variant.stock : p.stock;
      if (stock <= 0) problem = "Out of stock.";
      else if (stock < item.quantity) problem = `Only ${stock} left in stock.`;
    }
    lines.push({
      productId: p.id,
      variantId: variant?.id ?? null,
      slug: p.slug,
      name: p.name,
      variantName: variant?.name ?? null,
      image: p.images[0] ?? null,
      unitPaise: variant?.pricePaise ?? p.pricePaise,
      quantity: item.quantity,
      purchasable: !problem,
      problem,
    });
  }
  const subtotalPaise = lines.reduce((s, l) => s + l.unitPaise * l.quantity, 0);
  return { lines, subtotalPaise, allPurchasable: lines.length > 0 && lines.every((l) => l.purchasable) };
}

/** Finds the active delivery region serving a postal code (exact code or prefix match). */
export function matchRegion(regions: DeliveryRegion[], postalCode: string) {
  const code = postalCode.replace(/\s/g, "");
  if (!code) return null;
  let best: { region: DeliveryRegion; len: number } | null = null;
  for (const region of regions) {
    if (!region.active) continue;
    for (const pattern of region.postalCodes) {
      const p = pattern.replace(/\s/g, "");
      if (p && code.startsWith(p) && (!best || p.length > best.len)) best = { region, len: p.length };
    }
  }
  return best?.region ?? null;
}

export function deliveryCharge(region: DeliveryRegion, subtotalPaise: number) {
  if (region.freeAbovePaise !== null && subtotalPaise >= region.freeAbovePaise) return 0;
  return region.chargePaise;
}
