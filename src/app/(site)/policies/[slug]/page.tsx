import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPage } from "@/lib/pages";
import { POLICY_PAGES } from "@/lib/site";
import { Markdown } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ReviewNotice } from "@/components/ui/ReviewNotice";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 3600;

export function generateStaticParams() {
  return POLICY_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = POLICY_PAGES.find((x) => x.slug === slug);
  if (!p) notFound();
  return pageMetadata({ title: p.label, description: `${p.label} for Zauq e Zaika.`, path: `/policies/${slug}` });
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  if (!POLICY_PAGES.some((p) => p.slug === slug)) notFound();
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <div className="container-page grid gap-12 py-12 sm:py-16 lg:grid-cols-12">
      <aside className="lg:col-span-3">
        <nav aria-label="Policies" className="lg:sticky lg:top-28">
          <p className="eyebrow mb-4">Policies</p>
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {POLICY_PAGES.map((p) => (
              <li key={p.slug}>
                <Link href={`/policies/${p.slug}`} aria-current={p.slug === slug ? "page" : undefined}
                  className={cn("block rounded-lg px-3 py-2 text-sm transition", p.slug === slug ? "bg-sand font-semibold text-ink" : "text-muted hover:bg-cream hover:text-ink")}>
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <article className="lg:col-span-8">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: page.title, path: `/policies/${slug}` }]} />
        <h1 className="mt-6 mb-3 text-4xl text-ink sm:text-5xl">{page.title}</h1>
        <p className="mb-8 text-sm text-muted">Last updated {formatDate(page.updatedAt)}</p>
        {page.needsReview && <ReviewNotice />}
        <div className="prose-zz"><Markdown source={page.body} /></div>
      </article>
    </div>
  );
}
