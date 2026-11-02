import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logout } from "@/server/actions/account";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · Zauq e Zaika" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [newOrders, newEnquiries] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.enquiry.count({ where: { status: "NEW" } }),
  ]);
  return (
    <div className="min-h-screen bg-[#FBF8F2]">
      <AdminNav badges={{ "/admin/orders": newOrders, "/admin/enquiries": newEnquiries }} />
      <div className="lg:pl-64">
        <header className="hidden h-14 items-center justify-end gap-4 border-b border-line bg-white/70 px-8 text-sm backdrop-blur lg:flex">
          <span className="text-muted">Signed in as <span className="font-medium text-ink">{admin.email}</span></span>
          <form action={logout}><button className="inline-flex items-center gap-1.5 text-muted hover:text-ink"><LogOut className="h-4 w-4" /> Sign out</button></form>
        </header>
        <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
