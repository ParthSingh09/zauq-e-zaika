import Link from "next/link";
import { RecipeCard } from "./RecipeCard";
import { RecipeFilters } from "./RecipeFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRecipeFilterOptions, searchRecipes, type RecipeFilters as F } from "@/lib/queries";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function parseFilters(sp: Record<string, string | string[] | undefined>): F {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.slice(0, 100) || undefined;
  };
  return {
    q: one("q"),
    category: one("category"),
    cuisine: one("cuisine"),
    diet: one("diet"),
    time: one("time"),
    difficulty: one("difficulty"),
    sort: one("sort"),
    page: Math.min(50, Math.max(1, Number(one("page")) || 1)),
  };
}

export async function RecipeListing({ basePath, filters, lockedCategory }: { basePath: string; filters: F; lockedCategory?: string }) {
  const effective = lockedCategory ? { ...filters, category: lockedCategory } : filters;
  const [{ recipes, total, page }, options] = await Promise.all([searchRecipes(effective), getRecipeFilterOptions()]);

  const nextParams = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v && k !== "page" && !(lockedCategory && k === "category")) nextParams.set(k, String(v));
  nextParams.set("page", String(page + 1));

  return (
    <>
      <RecipeFilters
        action={basePath}
        filters={filters}
        hideCategory={Boolean(lockedCategory)}
        categories={options.categories.map((c) => ({ value: c.slug, label: c.name }))}
        cuisines={options.cuisines}
      />
      <div id="results" className="scroll-mt-28 pt-10">
        <p className="mb-6 text-sm text-muted" aria-live="polite">
          {total === 0 ? "No recipes found" : `Showing ${recipes.length} of ${total} ${total === 1 ? "recipe" : "recipes"}`}
          {filters.q && <> for “<span className="text-ink">{filters.q}</span>”</>}
        </p>
        {recipes.length === 0 ? (
          <EmptyState
            title="Nothing cooking here yet"
            body="We couldn’t find a recipe matching those filters. Try a different search, or explore all our recipes."
            action={<Link href={basePath} className="btn-primary">Clear filters</Link>}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((r, i) => (
              <RecipeCard key={r.id} recipe={r} priority={i < 3} headingLevel="h2" />
            ))}
          </div>
        )}
        {recipes.length < total && (
          <div className="mt-12 flex justify-center">
            <Link href={`${basePath}?${nextParams}`} scroll={false} className="btn-outline px-10">
              Load more recipes
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
