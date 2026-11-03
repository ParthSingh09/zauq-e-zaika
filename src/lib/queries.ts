import "server-only";
import { cache } from "react";
import type { Diet, Difficulty, Prisma } from "@prisma/client";
import { prisma } from "./db";

// ───────────── Recipes ─────────────

export const recipeCardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  image: true,
  imageAlt: true,
  diet: true,
  difficulty: true,
  prepMinutes: true,
  cookMinutes: true,
  isSample: true,
  cuisine: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.RecipeSelect;

export type RecipeCardData = Prisma.RecipeGetPayload<{ select: typeof recipeCardSelect }>;

export const PUBLISHED = { published: true } as const;

export async function getFeaturedRecipes(take = 3) {
  const featured = await prisma.recipe.findMany({
    where: { ...PUBLISHED, featured: true },
    orderBy: { publishedAt: "desc" },
    take,
    select: recipeCardSelect,
  });
  if (featured.length >= take) return featured;
  const more = await prisma.recipe.findMany({
    where: { ...PUBLISHED, id: { notIn: featured.map((r) => r.id) } },
    orderBy: { publishedAt: "desc" },
    take: take - featured.length,
    select: recipeCardSelect,
  });
  return [...featured, ...more];
}

export async function getPopularRecipes(take = 4) {
  return prisma.recipe.findMany({
    where: PUBLISHED,
    orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
    take,
    select: recipeCardSelect,
  });
}

export type RecipeFilters = {
  q?: string;
  category?: string;
  cuisine?: string;
  diet?: string;
  time?: string; // "15" | "30" | "60" | "61" (61 = over an hour)
  difficulty?: string;
  sort?: string; // "newest" | "popular" | "quickest"
  page?: number;
};

export const RECIPE_PAGE_SIZE = 9;
const DIETS = ["VEG", "NON_VEG", "EGG", "VEGAN"];
const DIFFS = ["EASY", "MEDIUM", "HARD"];

export async function searchRecipes(f: RecipeFilters) {
  const where: Prisma.RecipeWhereInput = { ...PUBLISHED };
  const and: Prisma.RecipeWhereInput[] = [];
  const q = f.q?.trim().slice(0, 100);
  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { excerpt: { contains: q, mode: "insensitive" } },
        { tags: { has: q.toLowerCase() } },
        { cuisine: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (f.category) and.push({ category: { slug: f.category } });
  if (f.cuisine) and.push({ cuisine: { equals: f.cuisine, mode: "insensitive" } });
  if (f.diet && DIETS.includes(f.diet)) {
    // "Vegetarian" also includes vegan dishes.
    and.push(f.diet === "VEG" ? { diet: { in: ["VEG", "VEGAN"] } } : { diet: f.diet as Diet });
  }
  if (f.difficulty && DIFFS.includes(f.difficulty)) and.push({ difficulty: f.difficulty as Difficulty });
  if (and.length) where.AND = and;

  const orderBy: Prisma.RecipeOrderByWithRelationInput[] =
    f.sort === "popular" ? [{ views: "desc" }, { publishedAt: "desc" }] : [{ publishedAt: "desc" }, { createdAt: "desc" }];

  // Total time isn't a stored column, so time filtering + "quickest" sort happen in memory.
  // Recipe catalogues for a single brand stay small, so this remains fast.
  const all = await prisma.recipe.findMany({ where, orderBy, select: recipeCardSelect });
  let list = all;
  const maxTime = Number(f.time);
  if (maxTime) {
    list = list.filter((r) => {
      const total = r.prepMinutes + r.cookMinutes;
      return maxTime === 61 ? total > 60 : total <= maxTime;
    });
  }
  if (f.sort === "quickest") list = [...list].sort((a, b) => a.prepMinutes + a.cookMinutes - (b.prepMinutes + b.cookMinutes));

  const page = Math.max(1, f.page ?? 1);
  return { recipes: list.slice(0, page * RECIPE_PAGE_SIZE), total: list.length, page };
}

export async function getRecipeFilterOptions() {
  const [categories, cuisines] = await Promise.all([
    prisma.recipeCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.recipe.findMany({ where: { ...PUBLISHED, cuisine: { not: null } }, distinct: ["cuisine"], select: { cuisine: true } }),
  ]);
  return {
    categories,
    cuisines: cuisines.map((c) => c.cuisine!).filter(Boolean).sort(),
  };
}

export const getRecipeBySlug = cache(async (slug: string) => {
  return prisma.recipe.findFirst({
    where: { slug, ...PUBLISHED },
    include: {
      category: true,
      reviews: {
        where: { approved: true },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { name: true } } },
      },
    },
  });
});

export async function getRecipeRating(recipeId: string) {
  const agg = await prisma.recipeReview.aggregate({
    where: { recipeId, approved: true },
    _avg: { rating: true },
    _count: true,
  });
  return { average: agg._avg.rating ?? 0, count: agg._count };
}

export async function getRelatedRecipes(recipeId: string, categoryId: string | null, take = 3) {
  const sameCat = categoryId
    ? await prisma.recipe.findMany({
        where: { ...PUBLISHED, categoryId, id: { not: recipeId } },
        orderBy: { publishedAt: "desc" },
        take,
        select: recipeCardSelect,
      })
    : [];
  if (sameCat.length >= take) return sameCat;
  const others = await prisma.recipe.findMany({
    where: { ...PUBLISHED, id: { notIn: [recipeId, ...sameCat.map((r) => r.id)] } },
    orderBy: { views: "desc" },
    take: take - sameCat.length,
    select: recipeCardSelect,
  });
  return [...sameCat, ...others];
}

export async function getCategoriesWithCounts() {
  return prisma.recipeCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { recipes: { where: PUBLISHED } } } },
  });
}

// ───────────── Products ─────────────

export const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  images: true,
  pricePaise: true,
  compareAtPaise: true,
  available: true,
  isSample: true,
  diet: true,
  trackStock: true,
  stock: true,
  category: { select: { name: true, slug: true } },
  variants: { select: { id: true, name: true, pricePaise: true, stock: true }, orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export async function getFeaturedProducts(take = 4) {
  return prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take,
    select: productCardSelect,
  });
}

export async function searchProducts({ q, category }: { q?: string; category?: string }) {
  const and: Prisma.ProductWhereInput[] = [{ status: "ACTIVE" }];
  const query = q?.trim().slice(0, 100);
  if (query)
    and.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { shortDescription: { contains: query, mode: "insensitive" } },
      ],
    });
  if (category) and.push({ category: { slug: category } });
  return prisma.product.findMany({
    where: { AND: and },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    select: productCardSelect,
  });
}

export const getProductBySlug = cache(async (slug: string) => {
  return prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: { category: true, variants: { orderBy: { sortOrder: "asc" } } },
  });
});
