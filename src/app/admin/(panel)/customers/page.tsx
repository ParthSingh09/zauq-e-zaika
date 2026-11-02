import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { AdminHeader, EmptyRow, Table, Td, Th } from "@/components/admin/AdminUI";

export const metadata = { title: "Customers" };

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER", ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}) },
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { orders: { select: { totalPaise: true, status: true } }, _count: { select: { savedRecipes: true, reviews: true } } },
  });
  const guests = await prisma.order.groupBy({ by: ["email"], where: { userId: null }, _count: true, _sum: { totalPaise: true } });

  return (
    <>
      <AdminHeader title="Customers" description="Registered customers and guest buyers." />
      <form className="mb-4 flex gap-2" method="get">
        <input name="q" defaultValue={q} placeholder="Search name or email…" aria-label="Search customers" className="field max-w-xs py-2 text-sm" />
        <button className="btn-outline btn-sm">Search</button>
      </form>
      <Table minWidth={820}>
        <thead><tr><Th>Customer</Th><Th>Phone</Th><Th>Joined</Th><Th>Orders</Th><Th>Spent</Th><Th>Saved / reviews</Th></tr></thead>
        <tbody>
          {customers.length === 0 && <EmptyRow cols={6}>No registered customers yet.</EmptyRow>}
          {customers.map((c) => {
            const valid = c.orders.filter((o) => o.status !== "CANCELLED");
            return (
              <tr key={c.id}>
                <Td><span className="font-medium">{c.name}</span><span className="block text-xs text-muted">{c.email}</span></Td>
                <Td>{c.phone ?? <span className="text-muted">—</span>}</Td>
                <Td className="text-muted">{formatDate(c.createdAt)}</Td>
                <Td>{c.orders.length ? <Link href={`/admin/orders?email=${encodeURIComponent(c.email)}`} className="font-semibold text-spice-deep underline">{c.orders.length}</Link> : 0}</Td>
                <Td>{formatPaise(valid.reduce((s, o) => s + o.totalPaise, 0))}</Td>
                <Td className="text-muted">{c._count.savedRecipes} / {c._count.reviews}</Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      {guests.length > 0 && (
        <>
          <h2 className="mt-10 mb-4 text-2xl text-ink">Guest buyers</h2>
          <Table minWidth={520}>
            <thead><tr><Th>Email</Th><Th>Orders</Th><Th>Total</Th></tr></thead>
            <tbody>
              {guests.map((g) => (
                <tr key={g.email}>
                  <Td>{g.email}</Td>
                  <Td><Link href={`/admin/orders?email=${encodeURIComponent(g.email)}`} className="font-semibold text-spice-deep underline">{g._count}</Link></Td>
                  <Td>{formatPaise(g._sum.totalPaise ?? 0)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </>
  );
}
