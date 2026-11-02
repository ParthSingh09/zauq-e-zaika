import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { POLICY_PAGES } from "@/lib/site";
import { siteUrl } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics = ["/", "/recipes", "/videos", "/shop", "/about", "/contact", "/faq"].map((p) => ({
    url: siteUrl(p),
    changeFrequency: "weekly" as const,
    priority: p === "/" ? 1 : 0.8,
  }));
  try {
    const [recipes, categories, products] = await Promise.all([
      prisma.recipe.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
      prisma.recipeCategory.findMany({ select: { slug: true } }),
      prisma.product.findMany({ where: { status: "ACTIVE", isSample: false }, select: { slug: true, updatedAt: true } }),
    ]);
    return [
      ...statics,
      ...recipes.map((r) => ({ url: siteUrl(`/recipes/${r.slug}`), lastModified: r.updatedAt, priority: 0.9 })),
      ...categories.map((c) => ({ url: siteUrl(`/recipes/category/${c.slug}`), priority: 0.6 })),
      ...products.map((p) => ({ url: siteUrl(`/shop/${p.slug}`), lastModified: p.updatedAt, priority: 0.7 })),
      ...POLICY_PAGES.map((p) => ({ url: siteUrl(`/policies/${p.slug}`), priority: 0.2 })),
    ];
  } catch {
    return statics;
  }
}
