import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/account/AuthForms";
import { pageMetadata } from "@/lib/seo";
import { safeRedirect } from "@/lib/utils";
import { GoogleButton, OAuthError } from "@/components/account/GoogleButton";

export const metadata = pageMetadata({ title: "Sign In", path: "/account/login", noIndex: true });

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const safeNext = next ? safeRedirect(next, "/account") : undefined;
  if (await getCurrentUser()) redirect(safeNext ?? "/account");
  return (
    <div className="container-page max-w-md py-16 sm:py-24">
      <h1 className="text-center text-4xl text-ink">Welcome back</h1>
      <p className="mt-3 mb-8 text-center text-muted">Sign in to see your orders, saved recipes and wishlist.</p>
      <div className="card p-6 sm:p-8"><OAuthError code={error} /><GoogleButton next={safeNext} /><LoginForm next={safeNext} /></div>
    </div>
  );
}
