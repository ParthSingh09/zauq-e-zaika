import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import { AdminHeader, Badge, EmptyRow, Table, Td, Th } from "@/components/admin/AdminUI";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteProduct, quickUpdateProduct } from "@/server/actions/admin/products";

export const metadata = { title: "Products" };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const products = await prisma.product.findMany({
    where: q ? { name: { contains: q.slice(0, 100), mode: "insensitive" } } : {},
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: { category: true, variants: true },
  });
  return (
    <>
      <AdminHeader title="Products" description="Manage your shop catalogue, prices and stock." actions={<Link href="/admin/products/new" className="btn-primary btn-sm"><Plus className="h-4 w-4" /> Add product</Link>} />
      <form className="mb-4 flex gap-2" method="get">
        <input name="q" defaultValue={q} placeholder="Search products…" aria-label="Search products" className="field max-w-xs py-2 text-sm" />
        <button className="btn-outline btn-sm">Search</button>
      </form>
      <Table minWidth={860}>
        <thead><tr><Th>Product</Th><Th>Category</Th><Th>Price</Th><Th>Stock</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
        <tbody>
          {products.length === 0 && <EmptyRow cols={6}>No products yet. <Link href="/admin/products/new" className="font-semibold text-spice-deep underline">Add a product</Link></EmptyRow>}
          {products.map((p) => {
            const prices = p.variants.length ? p.variants.map((v) => v.pricePaise) : [p.pricePaise];
            const stock = p.variants.length ? p.variants.reduce((s, v) => s + v.stock, 0) : p.stock;
            return (
              <tr key={p.id}>
                <Td>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-medium text-ink hover:text-spice-deep">
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-cream">{p.images[0] && <Image src={p.images[0]} alt="" fill sizes="44px" className="object-cover" />}</span>
                    <span>{p.name}{p.variants.length > 0 && <span className="block text-xs font-normal text-muted">{p.variants.length} options</span>}</span>
                  </Link>
                </Td>
                <Td>{p.category?.name ?? <span className="text-muted">—</span>}</Td>
                <Td>{p.isSample ? <span className="text-muted">Demo</span> : prices.length > 1 ? `${formatPaise(Math.min(...prices))} – ${formatPaise(Math.max(...prices))}` : formatPaise(prices[0])}</Td>
                <Td>{p.trackStock ? <span className={stock <= 0 ? "font-semibold text-nonveg" : ""}>{stock}</span> : <span className="text-muted">Not tracked</span>}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={p.status === "ACTIVE" ? "green" : p.status === "ARCHIVED" ? "red" : "gray"}>{p.status.toLowerCase()}</Badge>
                    {!p.available && <Badge tone="gold">Unavailable</Badge>}
                    {p.isSample && <Badge tone="ink">Demo</Badge>}
                  </div>
                </Td>
                <Td className="text-right whitespace-nowrap">
                  <ConfirmButton action={quickUpdateProduct.bind(null, p.id, { available: !p.available })}>{p.available ? "Mark unavailable" : "Mark available"}</ConfirmButton>
                  <ConfirmButton action={deleteProduct.bind(null, p.id)} confirm={`Delete “${p.name}”?`}>Delete</ConfirmButton>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
}
