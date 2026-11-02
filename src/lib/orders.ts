import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { getSettings } from "./settings";
import { cartSchema, deliveryCharge, matchRegion, quoteCart } from "./shop";
import { razorpayConfigured } from "./razorpay";

export const checkoutSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name.").max(100),
    email: z.string().trim().toLowerCase().email("Please enter a valid email.").max(160),
    phone: z.string().trim().min(8, "Please enter a valid phone number.").max(20).regex(/^[+()\d\s-]+$/, "Please enter a valid phone number."),
    fulfillment: z.enum(["DELIVERY", "PICKUP"]),
    addressLine1: z.string().trim().max(200).optional().default(""),
    addressLine2: z.string().trim().max(200).optional().default(""),
    city: z.string().trim().max(100).optional().default(""),
    state: z.string().trim().max(100).optional().default(""),
    postalCode: z.string().trim().max(12).optional().default(""),
    notes: z.string().trim().max(1000).optional().default(""),
    paymentMethod: z.enum(["PAY_ON_DELIVERY", "RAZORPAY"]),
    acceptTerms: z.literal("on", { errorMap: () => ({ message: "Please accept the terms and policies." }) }),
  })
  .superRefine((d, ctx) => {
    if (d.fulfillment === "DELIVERY") {
      if (d.addressLine1.length < 4) ctx.addIssue({ code: "custom", path: ["addressLine1"], message: "Please enter your address." });
      if (d.city.length < 2) ctx.addIssue({ code: "custom", path: ["city"], message: "Please enter your city." });
      if (!/^\d{6}$/.test(d.postalCode)) ctx.addIssue({ code: "custom", path: ["postalCode"], message: "Please enter a valid 6-digit PIN code." });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Full server-side pricing: items, delivery eligibility, charges and minimums. */
export async function priceCheckout(rawItems: unknown, fulfillment: "DELIVERY" | "PICKUP", postalCode: string) {
  const settings = await getSettings();
  const items = cartSchema.parse(rawItems);
  const quote = await quoteCart(items);
  const problems: string[] = [];
  let deliveryPaise = 0;
  let regionId: string | null = null;

  if (!settings.shop.enabled || !settings.shop.checkoutEnabled) problems.push("Online ordering is not open yet.");
  if (!quote.lines.length) problems.push("Your cart is empty.");
  if (!quote.allPurchasable && quote.lines.length) problems.push("Some items in your cart cannot be ordered right now.");

  if (fulfillment === "PICKUP") {
    if (!settings.shop.allowPickup) problems.push("Pickup is not available.");
  } else {
    if (!settings.shop.allowDelivery) problems.push("Delivery is not available.");
    else if (postalCode) {
      const regions = await prisma.deliveryRegion.findMany({ where: { active: true } });
      const region = matchRegion(regions, postalCode);
      if (!region) problems.push("Sorry — we don’t deliver to this PIN code yet.");
      else {
        regionId = region.id;
        deliveryPaise = deliveryCharge(region, quote.subtotalPaise);
        if (quote.subtotalPaise < region.minOrderPaise)
          problems.push(`The minimum order for ${region.name} is ₹${(region.minOrderPaise / 100).toFixed(0)}.`);
      }
    }
  }
  if (settings.shop.minOrderPaise && quote.subtotalPaise < settings.shop.minOrderPaise)
    problems.push(`The minimum order value is ₹${(settings.shop.minOrderPaise / 100).toFixed(0)}.`);

  return {
    ...quote,
    items,
    deliveryPaise,
    regionId,
    totalPaise: quote.subtotalPaise + deliveryPaise,
    problems,
    settings,
  };
}

function orderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `ZZ-${ymd}-${rand}`;
}

export class CheckoutError extends Error {}

/** Creates an order atomically: re-prices the cart, checks stock and decrements it. */
export async function createOrder(input: CheckoutInput, rawItems: unknown, userId: string | null) {
  const priced = await priceCheckout(rawItems, input.fulfillment, input.postalCode);
  if (input.fulfillment === "DELIVERY" && !priced.regionId && !priced.problems.length)
    priced.problems.push("Please enter a PIN code we deliver to.");
  if (priced.problems.length) throw new CheckoutError(priced.problems[0]);

  const { shop } = priced.settings;
  if (input.paymentMethod === "PAY_ON_DELIVERY" && !shop.allowPayOnDelivery)
    throw new CheckoutError("Pay on delivery is not available.");
  if (input.paymentMethod === "RAZORPAY" && !(shop.razorpayEnabled && razorpayConfigured()))
    throw new CheckoutError("Online payment is not available yet.");

  return prisma.$transaction(async (tx) => {
    // Re-check & decrement tracked stock inside the transaction.
    for (const line of priced.lines) {
      const product = await tx.product.findUniqueOrThrow({ where: { id: line.productId } });
      if (!product.trackStock) continue;
      if (line.variantId) {
        const res = await tx.productVariant.updateMany({
          where: { id: line.variantId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (!res.count) throw new CheckoutError(`${line.name} (${line.variantName}) just sold out.`);
      } else {
        const res = await tx.product.updateMany({
          where: { id: line.productId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (!res.count) throw new CheckoutError(`${line.name} just sold out.`);
      }
    }

    const delivery = input.fulfillment === "DELIVERY";
    const data: Prisma.OrderCreateInput = {
      orderNumber: orderNumber(),
      accessToken: randomBytes(24).toString("base64url"),
      user: userId ? { connect: { id: userId } } : undefined,
      name: input.name,
      email: input.email,
      phone: input.phone,
      fulfillment: input.fulfillment,
      addressLine1: delivery ? input.addressLine1 : null,
      addressLine2: delivery ? input.addressLine2 || null : null,
      city: delivery ? input.city : null,
      state: delivery ? input.state || null : null,
      postalCode: delivery ? input.postalCode : null,
      deliveryRegion: priced.regionId ? { connect: { id: priced.regionId } } : undefined,
      notes: input.notes || null,
      subtotalPaise: priced.subtotalPaise,
      deliveryPaise: priced.deliveryPaise,
      totalPaise: priced.totalPaise,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentMethod === "RAZORPAY" ? "PENDING" : "UNPAID",
      items: {
        create: priced.lines.map((l) => ({
          product: { connect: { id: l.productId } },
          variant: l.variantId ? { connect: { id: l.variantId } } : undefined,
          name: l.name,
          variantName: l.variantName,
          unitPaise: l.unitPaise,
          quantity: l.quantity,
        })),
      },
      events: { create: { status: "PENDING", note: "Order placed" } },
    };
    return tx.order.create({ data });
  });
}

/** Returns stock to inventory when an order is cancelled. */
export async function restockOrder(orderId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId }, include: { product: true } });
  for (const it of items) {
    if (!it.product?.trackStock) continue;
    if (it.variantId) await prisma.productVariant.update({ where: { id: it.variantId }, data: { stock: { increment: it.quantity } } }).catch(() => {});
    else if (it.productId) await prisma.product.update({ where: { id: it.productId }, data: { stock: { increment: it.quantity } } }).catch(() => {});
  }
}
