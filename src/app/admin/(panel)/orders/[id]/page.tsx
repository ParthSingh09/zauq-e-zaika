import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Mail } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/site";
import { AdminHeader, Panel } from "@/components/admin/AdminUI";
import { OrderUpdateForm } from "@/components/admin/OrderUpdateForm";

export const metadata = { title: "Order" };

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, events: { orderBy: { createdAt: "desc" } }, user: { select: { id: true, email: true } }, deliveryRegion: true },
  });
  if (!order) notFound();

  return (
    <>
      <AdminHeader title={`Order ${order.orderNumber}`} description={`Placed ${formatDate(order.createdAt, { dateStyle: "full", timeStyle: "short" })}`} back={{ href: "/admin/orders", label: "All orders" }} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Items">
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 py-3 text-sm">
                  <span><span className="font-medium">{i.name}</span>{i.variantName && <span className="text-muted"> · {i.variantName}</span>}<span className="text-muted"> × {i.quantity} @ {formatPaise(i.unitPaise)}</span></span>
                  <span className="font-semibold">{formatPaise(i.unitPaise * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 ml-auto max-w-xs space-y-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPaise(order.subtotalPaise)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery{order.deliveryRegion && ` (${order.deliveryRegion.name})`}</dt><dd>{formatPaise(order.deliveryPaise)}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatPaise(order.totalPaise)}</dd></div>
            </dl>
          </Panel>

          <div className="grid gap-6 sm:grid-cols-2">
            <Panel title="Customer">
              <p className="font-medium">{order.name}</p>
              <a href={`mailto:${order.email}`} className="mt-1 flex items-center gap-2 text-sm text-spice-deep"><Mail className="h-4 w-4" /> {order.email}</a>
              <a href={`tel:${order.phone}`} className="mt-1 flex items-center gap-2 text-sm text-spice-deep"><Phone className="h-4 w-4" /> {order.phone}</a>
              <p className="mt-3 text-xs text-muted">{order.user ? "Registered customer" : "Guest checkout"} · <Link href={`/admin/orders?email=${encodeURIComponent(order.email)}`} className="underline">All orders from this email</Link></p>
            </Panel>
            <Panel title={order.fulfillment === "PICKUP" ? "Pickup" : "Delivery address"}>
              {order.fulfillment === "PICKUP" ? <p className="text-sm">Customer will collect from the kitchen.</p> : (
                <p className="text-sm leading-relaxed">{order.addressLine1}{order.addressLine2 && <><br />{order.addressLine2}</>}<br />{order.city}{order.state && `, ${order.state}`} {order.postalCode}</p>
              )}
              {order.notes && <p className="mt-3 rounded-lg bg-cream p-3 text-sm"><span className="font-semibold">Note:</span> {order.notes}</p>}
            </Panel>
          </div>

          <Panel title="History">
            <ol className="space-y-3">
              {order.events.map((e) => (
                <li key={e.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <span><span className="font-medium">{ORDER_STATUS_LABEL[e.status]}</span>{e.note && <span className="text-muted"> — {e.note}</span>}<span className="block text-xs text-muted">{formatDate(e.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span></span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Update order">
            <OrderUpdateForm id={order.id} status={order.status} paymentStatus={order.paymentStatus} />
          </Panel>
          <Panel title="Payment">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Method</dt><dd>{order.paymentMethod === "RAZORPAY" ? "Razorpay (online)" : "Pay on delivery/pickup"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Status</dt><dd>{PAYMENT_STATUS_LABEL[order.paymentStatus]}</dd></div>
              {order.razorpayOrderId && <div className="flex justify-between gap-2"><dt className="text-muted">Razorpay order</dt><dd className="truncate font-mono text-xs">{order.razorpayOrderId}</dd></div>}
              {order.razorpayPaymentId && <div className="flex justify-between gap-2"><dt className="text-muted">Payment ID</dt><dd className="truncate font-mono text-xs">{order.razorpayPaymentId}</dd></div>}
            </dl>
          </Panel>
          <Link href={`/orders/${order.orderNumber}?token=${order.accessToken}`} target="_blank" className="btn-outline btn-sm w-full">View customer’s order page</Link>
        </div>
      </div>
    </>
  );
}
