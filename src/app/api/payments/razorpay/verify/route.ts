import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { razorpayConfigured, verifyPaymentSignature } from "@/lib/razorpay";
import { rateLimit } from "@/lib/rate-limit";

const body = z.object({
  orderNumber: z.string().max(30),
  token: z.string().max(100),
  razorpay_order_id: z.string().max(100),
  razorpay_payment_id: z.string().max(100),
  razorpay_signature: z.string().max(200),
});

/** Called by the browser after Razorpay checkout succeeds. The signature proves authenticity. */
export async function POST(req: Request) {
  if (!razorpayConfigured()) return NextResponse.json({ error: "Payments not configured" }, { status: 400 });
  if (!(await rateLimit("rzp-verify", 20, 600))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const d = parsed.data;
  const order = await prisma.order.findUnique({ where: { orderNumber: d.orderNumber } });
  if (!order || order.accessToken !== d.token || order.razorpayOrderId !== d.razorpay_order_id)
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  if (!verifyPaymentSignature(d.razorpay_order_id, d.razorpay_payment_id, d.razorpay_signature))
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  if (order.paymentStatus !== "PAID") {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", razorpayPaymentId: d.razorpay_payment_id, events: { create: { status: order.status, note: "Online payment received" } } },
    });
  }
  return NextResponse.json({ ok: true });
}
