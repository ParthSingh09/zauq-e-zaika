import type { EnquiryStatus } from "@prisma/client";
import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { AdminHeader, Badge, Panel } from "@/components/admin/AdminUI";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteEnquiry, setEnquiryStatus } from "@/server/actions/admin/content";
import { cn } from "@/lib/utils";

export const metadata = { title: "Enquiries" };
const LABEL: Record<EnquiryStatus, string> = { NEW: "New", IN_PROGRESS: "In progress", RESOLVED: "Resolved" };

export default async function Enquiries({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = status && status in LABEL ? (status as EnquiryStatus) : undefined;
  const items = await prisma.enquiry.findMany({ where: filter ? { status: filter } : {}, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <AdminHeader title="Customer enquiries" description="Messages sent through the contact form." />
      <div className="mb-5 flex gap-2">
        <Link href="/admin/enquiries" className={cn("chip", !filter && "border-ink bg-ink text-ivory hover:text-ivory")}>All</Link>
        {Object.entries(LABEL).map(([k, v]) => <Link key={k} href={`/admin/enquiries?status=${k}`} className={cn("chip", filter === k && "border-ink bg-ink text-ivory hover:text-ivory")}>{v}</Link>)}
      </div>
      <div className="space-y-4">
        {items.length === 0 && <Panel><p className="py-8 text-center text-muted">No enquiries here.</p></Panel>}
        {items.map((q) => (
          <Panel key={q.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{q.subject}</p>
                <p className="text-sm text-muted">{q.name} · {formatDate(q.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
              <Badge tone={q.status === "NEW" ? "gold" : q.status === "RESOLVED" ? "green" : "gray"}>{LABEL[q.status]}</Badge>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-cocoa">{q.message}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <a href={`mailto:${q.email}?subject=${encodeURIComponent(`Re: ${q.subject}`)}`} className="btn-primary btn-sm"><Mail className="h-4 w-4" /> Reply</a>
              {q.phone && <a href={`tel:${q.phone}`} className="btn-outline btn-sm"><Phone className="h-4 w-4" /> {q.phone}</a>}
              <span className="flex-1" />
              {q.status !== "IN_PROGRESS" && <ConfirmButton action={setEnquiryStatus.bind(null, q.id, "IN_PROGRESS")}>Mark in progress</ConfirmButton>}
              {q.status !== "RESOLVED" && <ConfirmButton action={setEnquiryStatus.bind(null, q.id, "RESOLVED")}>Mark resolved</ConfirmButton>}
              <ConfirmButton action={deleteEnquiry.bind(null, q.id)} confirm="Delete this enquiry?">Delete</ConfirmButton>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
