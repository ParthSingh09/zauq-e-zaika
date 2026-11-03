import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { RecipeListing, parseFilters, type SearchParams } from "@/components/recipes/RecipeListing";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }>; searchParams: SearchParams };

const getCategory = cache((slug: string) => prisma.recipeCategory.findUnique({ where: { slug } }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCategory(slug);
  if (!c) notFound();
  return pageMetadata({
    title: `${c.name} Recipes`,
    description: c.description || `Homemade ${c.name.toLowerCase()} recipes from Zauq-e-Zaika.`,
    path: `/recipes/category/${c.slug}`,
    image: c.image,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const filters = parseFilters(await searchParams);
  return (
    <>
      <section className="border-b border-line bg-cream/60">
        <div className="container-page py-12 sm:py-16">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Recipes", path: "/recipes" }, { name: category.name, path: `/recipes/category/${category.slug}` }]} />
          <h1 className="mt-6 text-4xl text-ink sm:text-5xl">{category.name} Recipes</h1>
          {category.description && <p className="mt-4 max-w-2xl text-lg text-muted">{category.description}</p>}
        </div>
      </section>
      <div className="container-page py-10 sm:py-14">
        <RecipeListing basePath={`/recipes/category/${category.slug}`} filters={filters} lockedCategory={category.slug} />
      </div>
    </>
  );
}
