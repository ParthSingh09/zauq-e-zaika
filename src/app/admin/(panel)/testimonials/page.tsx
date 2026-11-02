import { prisma } from "@/lib/db";
import { AdminHeader, Badge, Panel } from "@/components/admin/AdminUI";
import { TestimonialForm } from "@/components/admin/AdminForms";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteTestimonial } from "@/server/actions/admin/content";

export const metadata = { title: "Testimonials" };

export default async function Testimonials() {
  const items = await prisma.testimonial.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return (
    <>
      <AdminHeader title="Testimonials" description="Only add genuine feedback from real customers, with their permission. The homepage section shows published testimonials only." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Add a testimonial"><TestimonialForm /></Panel>
        <div className="space-y-4">
          {items.length === 0 && <Panel><p className="py-6 text-center text-muted">No testimonials yet. The homepage invites visitors to share their experience instead.</p></Panel>}
          {items.map((t) => (
            <Panel key={t.id}>
              <div className="mb-3 flex items-center justify-between">{t.published ? <Badge tone="green">Published</Badge> : <Badge>Hidden</Badge>}<ConfirmButton action={deleteTestimonial.bind(null, t.id)} confirm="Delete this testimonial?">Delete</ConfirmButton></div>
              <TestimonialForm t={t} />
            </Panel>
          ))}
        </div>
      </div>
    </>
  );
}
