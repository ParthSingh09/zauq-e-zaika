import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/account/AuthForms";
import { pageMetadata } from "@/lib/seo";
import { safeRedirect } from "@/lib/utils";

export const metadata = pageMetadata({ title: "Create an Account", path: "/account/register", noIndex: true });

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next ? safeRedirect(next, "/account") : undefined;
  if (await getCurrentUser()) redirect(safeNext ?? "/account");
  return (
    <div className="container-page max-w-md py-16 sm:py-24">
      <h1 className="text-center text-4xl text-ink">Join the family</h1>
      <p className="mt-3 mb-8 text-center text-muted">Save your favourite recipes, keep a wishlist and track your orders.</p>
      <div className="card p-6 sm:p-8"><RegisterForm next={safeNext} /></div>
    </div>
  );
}
