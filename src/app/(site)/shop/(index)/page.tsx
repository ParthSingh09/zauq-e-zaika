import Link from "next/link";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { searchProducts } from "@/lib/queries";
import { ProductCard } from "@/components/shop/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = pageMetadata({
  title: "Shop Homemade Food",
  description: "Homemade Indian sweets, snacks, pickles, masalas and meals from the Zauq e Zaika kitchen — prepared in small batches with love.",
  path: "/shop",
});

type SP = Promise<{ q?: string; category?: string }>;

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const { q, category } = await searchParams;
  const settings = await getSettings();
  if (!settings.shop.enabled) notFound();
  const [categories, products] = await Promise.all([
    prisma.productCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    searchProducts({ q, category }),
  ]);
  const qs = (c?: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (c) p.set("category", c);
    return p.size ? `/shop?${p}` : "/shop";
  };

  return (
    <>
      <section className="border-b border-line bg-cream/60">
        <div className="container-page py-14 text-center sm:py-20">
          <p className="eyebrow mb-3">The Zauq e Zaika pantry</p>
          <h1 className="text-4xl text-ink sm:text-5xl lg:text-6xl">Homemade, From Our Kitchen</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            Sweets, snacks, pickles, masalas and meals — prepared in small batches, the traditional way.
          </p>
        </div>
      </section>

      <div className="container-page py-10 sm:py-14">
        {!settings.shop.checkoutEnabled && settings.shop.notice && (
          <div className="mb-10 rounded-2xl border border-gold/40 bg-gold/5 px-5 py-4 text-center text-sm text-cocoa">{settings.shop.notice}</div>
        )}

        <form action="/shop" method="get" role="search" className="relative mx-auto max-w-xl">
          {category && <input type="hidden" name="category" value={category} />}
          <label htmlFor="shop-q" className="sr-only">Search products</label>
          <Search className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
          <input id="shop-q" name="q" type="search" defaultValue={q} maxLength={100} placeholder="Search the shop" className="field h-13 rounded-full pr-28 pl-13" />
          <button className="btn-primary absolute top-1 right-1 h-11">Search</button>
        </form>

        <nav aria-label="Product categories" className="mt-8 flex flex-wrap justify-center gap-2">
          <Link href={qs()} className={cn("chip", !category && "border-ink bg-ink text-ivory hover:text-ivory")} aria-current={!category ? "page" : undefined}>All</Link>
          {categories.map((c) => (
            <Link key={c.id} href={qs(c.slug)} className={cn("chip", category === c.slug && "border-ink bg-ink text-ivory hover:text-ivory")} aria-current={category === c.slug ? "page" : undefined}>
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="mt-12">
          {products.length === 0 ? (
            <EmptyState
              title={q || category ? "No products found" : "Our shelves are being stocked"}
              body={q || category ? "Try a different search or category." : "New homemade products will appear here soon."}
              action={(q || category) && <Link href="/shop" className="btn-primary">View all products</Link>}
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
