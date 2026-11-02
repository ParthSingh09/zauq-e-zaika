import { NextResponse } from "next/server";
import { z } from "zod";
import { cartSchema, quoteCart } from "@/lib/shop";
import { priceCheckout } from "@/lib/orders";
import { rateLimit } from "@/lib/rate-limit";

const body = z.object({
  items: cartSchema,
  fulfillment: z.enum(["DELIVERY", "PICKUP"]).optional(),
  postalCode: z.string().max(12).optional(),
});

/** Re-prices the visitor's cart from the database (and delivery, when a fulfilment option is given). */
export async function POST(req: Request) {
  if (!(await rateLimit("quote", 120, 60))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  const { items, fulfillment, postalCode } = parsed.data;
  if (!fulfillment) {
    const q = await quoteCart(items);
    return NextResponse.json(q);
  }
  const p = await priceCheckout(items, fulfillment, postalCode ?? "");
  return NextResponse.json({
    lines: p.lines,
    subtotalPaise: p.subtotalPaise,
    deliveryPaise: p.deliveryPaise,
    totalPaise: p.totalPaise,
    allPurchasable: p.allPurchasable,
    regionMatched: Boolean(p.regionId),
    problems: p.problems,
  });
}
