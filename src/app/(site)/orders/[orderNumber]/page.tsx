import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPaise } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { PAYMENT_STATUS_LABEL, ORDER_STATUS_LABEL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { OrderStatusTimeline } from "@/components/shop/OrderStatusTimeline";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({ title: "Your Order", path: "/orders", noIndex: true });

const safeEq = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export default async function OrderPage({ params, searchParams }: { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ token?: string }> }) {
  const { orderNumber } = await params;
  const { token } = await searchParams;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();
  const user = await getCurrentUser();
  const allowed =
    (typeof token === "string" && safeEq(token, order.accessToken)) ||
    (user && (user.id === order.userId || user.role === "ADMIN"));
  if (!allowed) notFound();

  const fresh = Date.now() - order.createdAt.getTime() < 15 * 60 * 1000;

  return (
    <div className="container-page max-w-4xl py-12 sm:py-16">
      {fresh && order.status === "PENDING" && (
        <div className="mb-10 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-veg" aria-hidden />
          <h1 className="mt-4 text-4xl text-ink sm:text-5xl">Thank you, {order.name.split(" ")[0]}!</h1>
          <p className="mt-3 text-lg text-muted">Your order has been received. We’ll be in touch to confirm the details.</p>
        </div>
      )}
      <div className="rounded-[var(--radius-card)] border border-line bg-card p-6 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Order</p>
            {fresh && order.status === "PENDING" ? <p className="mt-1 font-serif text-3xl text-ink">{order.orderNumber}</p> : <h1 className="mt-1 font-serif text-3xl text-ink">{order.orderNumber}</h1>}
            <p className="mt-1 text-sm text-muted">Placed {formatDate(order.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold text-ink">{ORDER_STATUS_LABEL[order.status]}</p>
            <p className="text-muted">{PAYMENT_STATUS_LABEL[order.paymentStatus]} · {order.paymentMethod === "RAZORPAY" ? "Online payment" : `Pay on ${order.fulfillment === "PICKUP" ? "pickup" : "delivery"}`}</p>
          </div>
        </div>

        <div className="mt-8"><OrderStatusTimeline status={order.status} fulfillment={order.fulfillment} /></div>

        <ul className="mt-10 divide-y divide-line border-y border-line">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-4 text-sm">
              <span><span className="font-medium text-ink">{i.name}</span>{i.variantName && <span className="text-muted"> · {i.variantName}</span>} <span className="text-muted">× {i.quantity}</span></span>
              <span className="font-semibold">{formatPaise(i.unitPaise * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPaise(order.subtotalPaise)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">{order.fulfillment === "PICKUP" ? "Pickup" : "Delivery"}</dt><dd>{order.deliveryPaise ? formatPaise(order.deliveryPaise) : "Free"}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt>Total</dt><dd>{formatPaise(order.totalPaise)}</dd></div>
        </dl>

        <div className="mt-10 grid gap-6 text-sm sm:grid-cols-2">
          <div>
            <h2 className="mb-2 font-sans text-xs font-semibold tracking-[0.18em] text-gold-deep uppercase">Contact</h2>
            <p>{order.name}<br />{order.email}<br />{order.phone}</p>
          </div>
          <div>
            <h2 className="mb-2 font-sans text-xs font-semibold tracking-[0.18em] text-gold-deep uppercase">{order.fulfillment === "PICKUP" ? "Pickup" : "Delivery address"}</h2>
            {order.fulfillment === "PICKUP" ? <p>You’ll collect this order from our kitchen.</p> : (
              <p>{order.addressLine1}{order.addressLine2 && <><br />{order.addressLine2}</>}<br />{order.city}{order.state && `, ${order.state}`} {order.postalCode}</p>
            )}
          </div>
        </div>
        {order.status === "CANCELLED" && order.cancelReason && <p className="mt-6 text-sm text-muted">Reason: {order.cancelReason}</p>}
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Keep this page’s link to check your order status. Questions? <Link href="/contact" className="font-medium text-spice-deep underline">Contact us</Link> with your order number.
      </p>
    </div>
  );
}
