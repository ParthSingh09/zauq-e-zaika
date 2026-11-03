import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logout } from "@/server/actions/account";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
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
    <div className="min-h-screen bg-admin">
      <AdminNav badges={{ "/admin/orders": newOrders, "/admin/enquiries": newEnquiries }} />
      <div className="lg:pl-64">
        <header className="hidden h-14 items-center justify-end gap-3 border-b border-line bg-card/70 px-8 text-sm backdrop-blur lg:flex">
          <ThemeToggle className="rounded-full p-2 text-ink transition hover:bg-sand" />
          <span className="text-muted">Signed in as <span className="font-medium text-ink">{admin.email}</span></span>
          <form action={logout}><button className="inline-flex items-center gap-1.5 text-muted hover:text-ink"><LogOut className="h-4 w-4" /> Sign out</button></form>
        </header>
        <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
