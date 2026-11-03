import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logout } from "@/server/actions/account";
import { recipeCardSelect, productCardSelect } from "@/lib/queries";
import { formatPaise } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProfileForm, PasswordForm } from "@/components/account/ProfileForms";

export const metadata = pageMetadata({ title: "My Account", path: "/account", noIndex: true });

export default async function AccountPage() {
  const user = await requireUser("/account");
  const [orders, saved, wishlist] = await Promise.all([
    prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50, include: { _count: { select: { items: true } } } }),
    prisma.savedRecipe.findMany({ where: { userId: user.id, recipe: { published: true } }, orderBy: { createdAt: "desc" }, include: { recipe: { select: recipeCardSelect } } }),
    prisma.wishlistItem.findMany({ where: { userId: user.id, product: { status: "ACTIVE" } }, orderBy: { createdAt: "desc" }, include: { product: { select: productCardSelect } } }),
  ]);

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">My account</p>
          <h1 className="text-4xl text-ink sm:text-5xl">Namaste, {user.name.split(" ")[0]}</h1>
        </div>
        <div className="flex gap-2">
          {user.role === "ADMIN" && <Link href="/admin" className="btn-outline btn-sm">Admin dashboard</Link>}
          <form action={logout}><button className="btn-ghost btn-sm"><LogOut className="h-4 w-4" /> Sign out</button></form>
        </div>
      </div>

      <nav aria-label="Account sections" className="mt-8 flex flex-wrap gap-2">
        {[["#orders", `Orders (${orders.length})`], ["#saved", `Saved recipes (${saved.length})`], ["#wishlist", `Wishlist (${wishlist.length})`], ["#profile", "Profile"]].map(([href, label]) => (
          <a key={href} href={href} className="chip">{label}</a>
        ))}
      </nav>

      <section id="orders" className="mt-14 scroll-mt-28">
        <h2 className="mb-6 text-3xl text-ink">Order history</h2>
        {orders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-beige bg-cream/50 p-8 text-center text-muted">You haven’t placed any orders yet. <Link href="/shop" className="font-semibold text-spice-deep underline">Visit the shop</Link></p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-cream/60 text-xs tracking-wide text-muted uppercase">
                <tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Payment</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-5 py-4"><Link href={`/orders/${o.orderNumber}`} className="font-semibold text-spice-deep hover:underline">{o.orderNumber}</Link></td>
                    <td className="px-5 py-4">{formatDate(o.createdAt)}</td>
                    <td className="px-5 py-4">{o._count.items}</td>
                    <td className="px-5 py-4 font-semibold">{formatPaise(o.totalPaise)}</td>
                    <td className="px-5 py-4">{ORDER_STATUS_LABEL[o.status]}</td>
                    <td className="px-5 py-4">{PAYMENT_STATUS_LABEL[o.paymentStatus]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section id="saved" className="mt-16 scroll-mt-28">
        <h2 className="mb-6 text-3xl text-ink">Saved recipes</h2>
        {saved.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-beige bg-cream/50 p-8 text-center text-muted">Tap “Save” on any recipe to keep it here. <Link href="/recipes" className="font-semibold text-spice-deep underline">Browse recipes</Link></p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{saved.map((s) => <RecipeCard key={s.recipeId} recipe={s.recipe} />)}</div>
        )}
      </section>

      <section id="wishlist" className="mt-16 scroll-mt-28">
        <h2 className="mb-6 text-3xl text-ink">Wishlist</h2>
        {wishlist.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-beige bg-cream/50 p-8 text-center text-muted">Your wishlist is empty. <Link href="/shop" className="font-semibold text-spice-deep underline">Explore the shop</Link></p>
        ) : (
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">{wishlist.map((w) => <ProductCard key={w.productId} product={w.product} />)}</div>
        )}
      </section>

      <section id="profile" className="mt-16 grid scroll-mt-28 gap-8 lg:grid-cols-2">
        <div className="card p-6 sm:p-8">
          <h2 className="mb-1 text-2xl text-ink">Profile</h2>
          <p className="mb-6 text-sm text-muted">{user.email}</p>
          <ProfileForm name={user.name} phone={user.phone ?? ""} />
        </div>
        <div className="card p-6 sm:p-8">
          <h2 className="mb-6 text-2xl text-ink">Change password</h2>
          <PasswordForm />
        </div>
      </section>
    </div>
  );
}
