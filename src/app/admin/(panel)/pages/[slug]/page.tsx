import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminHeader, Panel } from "@/components/admin/AdminUI";
import { PageForm } from "@/components/admin/AdminForms";

export const metadata = { title: "Edit page" };

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) notFound();
  return (
    <>
      <AdminHeader title={`Edit: ${page.title}`} back={{ href: "/admin/pages", label: "All pages" }} />
      <Panel><PageForm page={page} /></Panel>
    </>
  );
}
