import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";

/**
 * Razorpay webhook (configure in Razorpay Dashboard → Webhooks):
 *   URL: https://YOUR-DOMAIN/api/payments/razorpay/webhook
 *   Events: payment.captured, payment.failed, refund.processed
 * Acts as the source of truth if the customer closes the browser before verification.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } }; refund?: { entity?: { payment_id?: string } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }
  const payment = event.payload?.payment?.entity;
  if (event.event === "payment.captured" && payment?.order_id) {
    const order = await prisma.order.findUnique({ where: { razorpayOrderId: payment.order_id } });
    if (order && order.paymentStatus !== "PAID") {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "PAID", razorpayPaymentId: payment.id, events: { create: { status: order.status, note: "Payment captured (webhook)" } } },
      });
    }
  } else if (event.event === "payment.failed" && payment?.order_id) {
    await prisma.order.updateMany({ where: { razorpayOrderId: payment.order_id, paymentStatus: { not: "PAID" } }, data: { paymentStatus: "FAILED" } });
  } else if (event.event === "refund.processed") {
    const paymentId = event.payload?.refund?.entity?.payment_id;
    if (paymentId) await prisma.order.updateMany({ where: { razorpayPaymentId: paymentId }, data: { paymentStatus: "REFUNDED" } });
  }
  return NextResponse.json({ ok: true });
}
