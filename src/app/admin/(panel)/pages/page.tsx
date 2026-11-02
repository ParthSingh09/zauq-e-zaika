import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { AdminHeader, Badge, Table, Td, Th } from "@/components/admin/AdminUI";

export const metadata = { title: "Pages & policies" };

const PUBLIC_PATH: Record<string, string> = { about: "/about", faq: "/faq" };

export default async function Pages() {
  const pages = await prisma.page.findMany({ orderBy: { slug: "asc" } });
  return (
    <>
      <AdminHeader title="Pages & policies" description="Edit your About story, FAQ and legal policies." />
      <Table minWidth={620}>
        <thead><tr><Th>Page</Th><Th>URL</Th><Th>Status</Th><Th>Updated</Th></tr></thead>
        <tbody>
          {pages.map((p) => {
            const path = PUBLIC_PATH[p.slug] ?? `/policies/${p.slug}`;
            return (
              <tr key={p.slug}>
                <Td><Link href={`/admin/pages/${p.slug}`} className="font-medium text-spice-deep hover:underline">{p.title}</Link></Td>
                <Td><Link href={path} target="_blank" className="text-muted hover:text-ink">{path}</Link></Td>
                <Td>{p.needsReview ? <Badge tone="gold">Needs review</Badge> : <Badge tone="green">Final</Badge>}</Td>
                <Td className="text-muted">{formatDate(p.updatedAt)}</Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
}
