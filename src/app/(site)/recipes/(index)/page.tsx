import { RecipeListing, parseFilters, type SearchParams } from "@/components/recipes/RecipeListing";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Traditional Indian Recipes",
  description:
    "Explore easy, authentic homemade Indian recipes — breakfast, curries, sweets, snacks, street food and festival specials, with step-by-step instructions.",
  path: "/recipes",
});

export default async function RecipesPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilters(await searchParams);
  return (
    <>
      <section className="border-b border-line bg-cream/60">
        <div className="container-page py-14 text-center sm:py-20">
          <p className="eyebrow mb-3">The recipe collection</p>
          <h1 className="text-4xl text-ink sm:text-5xl lg:text-6xl">Recipes Made with Love</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            Traditional Indian family recipes, written clearly and tested at home — from everyday dal to festive sweets.
          </p>
        </div>
      </section>
      <div className="container-page py-10 sm:py-14">
        <RecipeListing basePath="/recipes" filters={filters} />
      </div>
    </>
  );
}
