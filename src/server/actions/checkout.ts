"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CheckoutError, checkoutSchema, createOrder } from "@/lib/orders";
import { createRazorpayOrder, razorpayPublicKey } from "@/lib/razorpay";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors, type ActionState } from "../action-state";

export async function placeOrder(_: ActionState, form: FormData): Promise<ActionState> {
  if (!(await rateLimit("checkout", 10, 600))) return { ok: false, message: "Too many attempts. Please wait a few minutes." };
  const parsed = checkoutSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fieldErrors(parsed.error);
  let items: unknown;
  try {
    items = JSON.parse(String(form.get("cart") ?? "[]"));
  } catch {
    return { ok: false, message: "Your cart could not be read. Please refresh and try again." };
  }

  const user = await getCurrentUser();
  let order;
  try {
    order = await createOrder(parsed.data, items, user?.id ?? null);
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, message: e.message };
    console.error("Order creation failed", e);
    return { ok: false, message: "We couldn’t place your order. Please try again." };
  }

  const confirmUrl = `/orders/${order.orderNumber}?token=${order.accessToken}`;
  if (order.paymentMethod === "RAZORPAY") {
    try {
      const rp = await createRazorpayOrder(order.totalPaise, order.orderNumber);
      await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: rp.id } });
      return {
        ok: true,
        message: "Opening secure payment…",
        data: {
          mode: "razorpay",
          razorpayOrderId: rp.id,
          keyId: razorpayPublicKey(),
          amount: String(order.totalPaise),
          orderNumber: order.orderNumber,
          token: order.accessToken,
          name: order.name,
          email: order.email,
          phone: order.phone,
          confirmUrl,
        },
      };
    } catch (e) {
      console.error("Razorpay order failed", e);
      return {
        ok: true,
        message: "Your order was saved, but online payment could not start. We will contact you to complete payment.",
        data: { mode: "redirect", confirmUrl },
      };
    }
  }
  return { ok: true, message: "Order placed!", data: { mode: "redirect", confirmUrl } };
}
