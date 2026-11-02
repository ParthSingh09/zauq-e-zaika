import { Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { AdminHeader, EmptyRow, Table, Td, Th } from "@/components/admin/AdminUI";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteSubscriber } from "@/server/actions/admin/content";

export const metadata = { title: "Newsletter" };

export default async function Newsletter() {
  const subs = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 1000 });
  return (
    <>
      <AdminHeader
        title="Newsletter subscribers"
        description="Export the list to your email provider (e.g. Mailchimp, Brevo) to send newsletters."
        actions={<a href="/api/admin/newsletter/export" className="btn-primary btn-sm"><Download className="h-4 w-4" /> Export CSV</a>}
      />
      <Table minWidth={480}>
        <thead><tr><Th>Email</Th><Th>Subscribed</Th><Th className="text-right">Actions</Th></tr></thead>
        <tbody>
          {subs.length === 0 && <EmptyRow cols={3}>No subscribers yet.</EmptyRow>}
          {subs.map((s) => (
            <tr key={s.id}>
              <Td>{s.email}</Td>
              <Td className="text-muted">{formatDate(s.createdAt)}</Td>
              <Td className="text-right"><ConfirmButton action={deleteSubscriber.bind(null, s.id)} confirm={`Remove ${s.email}?`}>Remove</ConfirmButton></Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
