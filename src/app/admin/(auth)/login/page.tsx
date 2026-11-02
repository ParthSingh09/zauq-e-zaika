import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/account/AuthForms";
import { LogoMark } from "@/components/layout/Logo";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Admin Sign In", path: "/admin/login", noIndex: true });

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect("/admin");
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream/70 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <LogoMark className="mx-auto h-14 w-14" />
          <h1 className="mt-4 text-3xl text-ink">Zauq e Zaika Admin</h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage your website.</p>
        </div>
        {(error === "forbidden" || user) && (
          <p role="alert" className="mb-4 rounded-xl bg-nonveg/10 px-4 py-3 text-sm text-nonveg">
            Your account does not have admin access. Sign in with an admin account.
          </p>
        )}
        <div className="card p-6"><LoginForm area="admin" /></div>
      </div>
    </main>
  );
}
