import { CheckCircle2, XCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { razorpayConfigured, razorpayTestMode } from "@/lib/razorpay";
import { AdminHeader, Panel, Table, Td, Th } from "@/components/admin/AdminUI";
import { CreateAdminForm } from "@/components/admin/AdminForms";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { PasswordForm } from "@/components/account/ProfileForms";
import { revokeAdmin } from "@/server/actions/admin/content";

export const metadata = { title: "Admins & security" };

export default async function Security() {
  const me = await getCurrentUser();
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
  const env = [
    { label: "Public site URL (NEXT_PUBLIC_SITE_URL)", ok: Boolean(process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")) },
    { label: "Database (DATABASE_URL)", ok: Boolean(process.env.DATABASE_URL) },
    { label: "Image storage: Supabase (STORAGE_DRIVER=supabase + keys)", ok: process.env.STORAGE_DRIVER === "supabase" && Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) },
    { label: `Razorpay keys${razorpayConfigured() ? (razorpayTestMode() ? " (test mode)" : " (live mode)") : ""}`, ok: razorpayConfigured() },
    { label: "Razorpay webhook secret", ok: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET) },
    { label: "Google sign-in (GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET)", ok: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) },
    { label: "YouTube API (optional auto-import)", ok: Boolean(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_CHANNEL_ID) },
  ];
  return (
    <>
      <AdminHeader title="Admins & security" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Change your password"><PasswordForm /></Panel>
        <Panel title="Configuration status" description="Values are read from environment variables — they are never shown here." className="scroll-mt-20">
          <ul id="environment" className="space-y-2.5">
            {env.map((e) => (
              <li key={e.label} className="flex items-start gap-2.5 text-sm">
                {e.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-veg" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-beige" />}
                <span className={e.ok ? "text-ink" : "text-muted"}>{e.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">See README.md → “Environment variables” for how to set these in Vercel.</p>
        </Panel>
      </div>
      <Panel title="Admin accounts" className="mt-6">
        <Table minWidth={520}>
          <thead><tr><Th>Name</Th><Th>Email</Th><Th>Since</Th><Th className="text-right" /></tr></thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <Td>{a.name}{a.id === me?.id && <span className="text-muted"> (you)</span>}</Td>
                <Td>{a.email}</Td>
                <Td className="text-muted">{formatDate(a.createdAt)}</Td>
                <Td className="text-right">{a.id !== me?.id && <ConfirmButton action={revokeAdmin.bind(null, a.id)} confirm={`Remove admin access for ${a.email}?`}>Remove admin</ConfirmButton>}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div className="mt-6 border-t border-line pt-5">
          <p className="mb-3 text-sm font-semibold text-ink">Add another admin</p>
          <CreateAdminForm />
        </div>
      </Panel>
    </>
  );
}
