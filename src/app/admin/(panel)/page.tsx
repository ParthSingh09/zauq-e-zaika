import Link from "next/link";
import { BookOpen, Package, ShoppingCart, Inbox, Users, Mail, CheckCircle2, Circle, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { razorpayConfigured, razorpayTestMode } from "@/lib/razorpay";
import { formatPaise } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABEL } from "@/lib/site";
import { AdminHeader, Badge, Panel } from "@/components/admin/AdminUI";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const [recipes, published, products, orders, pending, enquiries, customers, subscribers, recentOrders, recentEnquiries, regions, reviewPages, sampleRecipes, sampleProducts, revenue, settings] =
    await Promise.all([
      prisma.recipe.count(),
      prisma.recipe.count({ where: { published: true } }),
      prisma.product.count({ where: { status: { not: "ARCHIVED" } } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.enquiry.count({ where: { status: "NEW" } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.newsletterSubscriber.count({ where: { active: true } }),
      prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
      prisma.enquiry.findMany({ where: { status: { not: "RESOLVED" } }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.deliveryRegion.count({ where: { active: true } }),
      prisma.page.count({ where: { needsReview: true } }),
      prisma.recipe.count({ where: { isSample: true } }),
      prisma.product.count({ where: { isSample: true, status: { not: "ARCHIVED" } } }),
      prisma.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { totalPaise: true } }),
      getSettings(),
    ]);

  const stats = [
    { label: "Recipes", value: recipes, sub: `${published} published`, href: "/admin/recipes", icon: BookOpen },
    { label: "Products", value: products, sub: `${sampleProducts} demo`, href: "/admin/products", icon: Package },
    { label: "Orders", value: orders, sub: `${pending} awaiting action`, href: "/admin/orders", icon: ShoppingCart },
    { label: "New enquiries", value: enquiries, sub: "unread messages", href: "/admin/enquiries", icon: Inbox },
    { label: "Customers", value: customers, sub: "registered accounts", href: "/admin/customers", icon: Users },
    { label: "Subscribers", value: subscribers, sub: "newsletter", href: "/admin/newsletter", icon: Mail },
  ];

  const storage = process.env.STORAGE_DRIVER === "supabase" && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  const checklist = [
    { done: sampleRecipes === 0, label: "Replace sample recipes with your authentic recipes", href: "/admin/recipes" },
    { done: sampleProducts === 0, label: "Replace or remove demonstration products", href: "/admin/products" },
    { done: reviewPages === 0, label: "Complete and review About, FAQ & legal pages", href: "/admin/pages" },
    { done: Boolean(settings.contact.email || settings.contact.phone), label: "Add contact details (email, phone, WhatsApp)", href: "/admin/content#contact" },
    { done: Boolean(settings.social.instagram || settings.social.facebook), label: "Add social media links", href: "/admin/content#social" },
    { done: Boolean(storage), label: "Configure Supabase Storage for image uploads (production)", href: "/admin/security#environment" },
    { done: regions > 0 || settings.shop.allowPickup, label: "Set up delivery areas or pickup", href: "/admin/shop" },
    { done: razorpayConfigured() && !razorpayTestMode(), label: "Connect Razorpay live keys (optional)", href: "/admin/shop#payments" },
    { done: settings.shop.checkoutEnabled, label: "Open the shop for orders (when ready)", href: "/admin/shop" },
  ];
  const done = checklist.filter((c) => c.done).length;

  return (
    <>
      <AdminHeader
        title="Dashboard"
        description="Everything happening in the Zauq-e-Zaika kitchen."
        actions={
          <>
            <Link href="/admin/recipes/new" className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New recipe</Link>
            <Link href="/admin/products/new" className="btn-outline btn-sm"><Plus className="h-4 w-4" /> New product</Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map(({ label, value, sub, href, icon: Icon }) => (
          <Link key={label} href={href} className="rounded-2xl border border-line bg-card p-5 transition hover:border-gold hover:shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{label}</span>
              <Icon className="h-4 w-4 text-gold-deep" aria-hidden />
            </div>
            <p className="mt-2 font-serif text-3xl text-ink">{value}</p>
            <p className="mt-0.5 text-xs text-muted">{sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Panel title="Recent orders" className="lg:col-span-3">
          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No orders yet. Orders will appear here once the shop is open.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm hover:text-spice-deep">
                    <span><span className="font-semibold">{o.orderNumber}</span> · {o.name}</span>
                    <span className="flex items-center gap-3">
                      <Badge tone={o.status === "PENDING" ? "gold" : o.status === "CANCELLED" ? "red" : o.status === "DELIVERED" ? "green" : "gray"}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                      <span className="font-semibold">{formatPaise(o.totalPaise)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 border-t border-line pt-4 text-sm text-muted">Order value to date (excluding cancelled): <span className="font-semibold text-ink">{formatPaise(revenue._sum.totalPaise ?? 0)}</span></p>
        </Panel>

        <Panel title="Open enquiries" className="lg:col-span-2">
          {recentEnquiries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No open enquiries. 🎉</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentEnquiries.map((e) => (
                <li key={e.id} className="py-3 text-sm">
                  <Link href="/admin/enquiries" className="block hover:text-spice-deep">
                    <span className="flex justify-between gap-2"><span className="truncate font-semibold">{e.subject}</span><span className="shrink-0 text-xs text-muted">{formatDate(e.createdAt)}</span></span>
                    <span className="text-muted">{e.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title={`Launch checklist — ${done} of ${checklist.length} complete`} description="Items to finish before opening the website and shop to the public." className="mt-6">
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-sand"><div className="h-full rounded-full bg-veg transition-all" style={{ width: `${(done / checklist.length) * 100}%` }} /></div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {checklist.map((c) => (
            <li key={c.label}>
              <Link href={c.href} className="flex items-start gap-2.5 rounded-lg p-2 text-sm hover:bg-cream">
                {c.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-veg" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-beige" />}
                <span className={c.done ? "text-muted line-through" : "text-ink"}>{c.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">Website analytics will appear here once an analytics provider (e.g. Vercel Analytics or Google Analytics) is configured.</p>
      </Panel>
    </>
  );
}
