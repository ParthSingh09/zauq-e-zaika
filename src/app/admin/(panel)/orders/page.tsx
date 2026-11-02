import Link from "next/link";
import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/site";
import { AdminHeader, Badge, EmptyRow, Table, Td, Th } from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils";

export const metadata = { title: "Orders" };

const tone = (s: OrderStatus) => (s === "PENDING" ? "gold" : s === "CANCELLED" ? "red" : s === "DELIVERED" ? "green" : "gray") as "gold" | "red" | "green" | "gray";

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; email?: string }> }) {
  const { status, q, email } = await searchParams;
  const where: Prisma.OrderWhereInput = {
    ...(status && status in ORDER_STATUS_LABEL ? { status: status as OrderStatus } : {}),
    ...(email ? { email: email.toLowerCase() } : {}),
    ...(q ? { OR: [{ orderNumber: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
  };
  const [orders, counts] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { _count: { select: { items: true } } } }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <>
      <AdminHeader title="Orders" description={email ? `Orders for ${email}` : "View and manage customer orders."} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/orders" className={cn("chip", !status && "border-ink bg-ink text-ivory hover:text-ivory")}>All</Link>
        {Object.entries(ORDER_STATUS_LABEL).map(([k, label]) => (
          <Link key={k} href={`/admin/orders?status=${k}`} className={cn("chip", status === k && "border-ink bg-ink text-ivory hover:text-ivory")}>{label} ({count(k)})</Link>
        ))}
      </div>
      <form className="mb-4 flex gap-2" method="get">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder="Search order no., name, email, phone…" aria-label="Search orders" className="field max-w-sm py-2 text-sm" />
        <button className="btn-outline btn-sm">Search</button>
      </form>
      <Table minWidth={900}>
        <thead><tr><Th>Order</Th><Th>Date</Th><Th>Customer</Th><Th>Type</Th><Th>Total</Th><Th>Status</Th><Th>Payment</Th></tr></thead>
        <tbody>
          {orders.length === 0 && <EmptyRow cols={7}>No orders found.</EmptyRow>}
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-cream/40">
              <Td><Link href={`/admin/orders/${o.id}`} className="font-semibold text-spice-deep hover:underline">{o.orderNumber}</Link><span className="block text-xs text-muted">{o._count.items} item(s)</span></Td>
              <Td className="text-muted">{formatDate(o.createdAt, { dateStyle: "medium", timeStyle: "short" })}</Td>
              <Td>{o.name}<span className="block text-xs text-muted">{o.phone}</span></Td>
              <Td>{o.fulfillment === "PICKUP" ? "Pickup" : `Delivery${o.postalCode ? ` · ${o.postalCode}` : ""}`}</Td>
              <Td className="font-semibold">{formatPaise(o.totalPaise)}</Td>
              <Td><Badge tone={tone(o.status)}>{ORDER_STATUS_LABEL[o.status]}</Badge></Td>
              <Td><Badge tone={o.paymentStatus === "PAID" ? "green" : o.paymentStatus === "FAILED" ? "red" : "gray"}>{PAYMENT_STATUS_LABEL[o.paymentStatus]}</Badge></Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
