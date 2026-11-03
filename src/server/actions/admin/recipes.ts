"use server";

import { z } from "zod";
import { Prisma, type Diet, type Difficulty } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { asIngredients, asSteps } from "@/lib/recipe-data";
import { bool, int, json, lines, optStr, refreshSite, safeUrl, str } from "../../form";
import type { ActionState } from "../../action-state";

const DIETS: Diet[] = ["VEG", "NON_VEG", "EGG", "VEGAN"];
const DIFFS: Difficulty[] = ["EASY", "MEDIUM", "HARD"];
const NUTRITION_KEYS = ["calories", "proteinContent", "carbohydrateContent", "fatContent", "fiberContent", "sugarContent", "sodiumContent"];

export async function saveRecipe(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(f, "id");
  const title = str(f, "title", 160);
  const errors: Record<string, string> = {};
  if (title.length < 2) errors.title = "Please enter a title.";
  const slug = slugify(str(f, "slug", 100) || title);
  if (!slug) errors.slug = "Please enter a valid URL slug.";
  const excerpt = str(f, "excerpt", 300);
  if (excerpt.length < 10) errors.excerpt = "Add a short description (at least 10 characters).";
  const ingredients = asIngredients(json(f, "ingredients", [])).filter((i) => i.name.trim());
  const steps = asSteps(json(f, "steps", [])).filter((s) => s.text.trim());
  const published = bool(f, "published");
  if (published && !ingredients.length) errors.ingredients = "Add at least one ingredient before publishing.";
  if (published && !steps.length) errors.steps = "Add at least one step before publishing.";
  const clash = await prisma.recipe.findFirst({ where: { slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
  if (clash) errors.slug = "Another recipe already uses this URL.";
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  const nutrition = Object.fromEntries(NUTRITION_KEYS.map((k) => [k, str(f, `nutrition.${k}`, 40)]).filter(([, v]) => v));
  const categoryId = str(f, "categoryId") || null;
  const diet = DIETS.includes(str(f, "diet") as Diet) ? (str(f, "diet") as Diet) : "VEG";
  const difficulty = DIFFS.includes(str(f, "difficulty") as Difficulty) ? (str(f, "difficulty") as Difficulty) : "EASY";

  const data = {
    title,
    slug,
    excerpt,
    intro: str(f, "intro", 20000),
    image: safeUrl(str(f, "image")),
    imageAlt: optStr(f, "imageAlt", 200),
    cuisine: optStr(f, "cuisine", 60),
    diet,
    difficulty,
    prepMinutes: int(f, "prepMinutes", 0, 0, 2000),
    cookMinutes: int(f, "cookMinutes", 0, 0, 2000),
    servings: int(f, "servings", 2, 1, 100),
    ingredients: ingredients.map((i) => ({ ...i, name: i.name.slice(0, 200), unit: i.unit.slice(0, 40), note: i.note?.slice(0, 200), group: i.group?.slice(0, 80) })),
    steps: steps.map((s) => ({ title: s.title?.slice(0, 120), text: s.text.slice(0, 3000) })),
    tips: lines(f, "tips").slice(0, 30),
    substitutions: lines(f, "substitutions").slice(0, 30),
    nutrition: Object.keys(nutrition).length ? nutrition : Prisma.DbNull,
    tags: str(f, "tags", 500).split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 20),
    seoTitle: optStr(f, "seoTitle", 70),
    seoDescription: optStr(f, "seoDescription", 170),
    isSample: bool(f, "isSample"),
    published,
    featured: bool(f, "featured"),
    categoryId: categoryId && (await prisma.recipeCategory.findUnique({ where: { id: categoryId } })) ? categoryId : null,
  };

  let recipeId = id;
  if (id) {
    const existing = await prisma.recipe.findUnique({ where: { id }, select: { publishedAt: true } });
    if (!existing) return { ok: false, message: "Recipe not found." };
    await prisma.recipe.update({
      where: { id },
      data: { ...data, publishedAt: published && !existing.publishedAt ? new Date() : undefined },
    });
  } else {
    const created = await prisma.recipe.create({ data: { ...data, publishedAt: published ? new Date() : null } });
    recipeId = created.id;
  }
  refreshSite();
  return { ok: true, message: id ? "Recipe saved." : "Recipe created.", data: id ? undefined : { redirect: `/admin/recipes/${recipeId}` } };
}

export async function deleteRecipe(id: string) {
  await requireAdmin();
  await prisma.recipe.delete({ where: { id } }).catch(() => null);
  refreshSite();
  return { ok: true, message: "Recipe deleted." };
}

export async function setRecipePublished(id: string, published: boolean) {
  await requireAdmin();
  const r = await prisma.recipe.findUnique({ where: { id } });
  if (!r) return { ok: false, message: "Recipe not found." };
  if (published && (!asIngredients(r.ingredients).length || !asSteps(r.steps).length))
    return { ok: false, message: "Add ingredients and steps before publishing." };
  await prisma.recipe.update({ where: { id }, data: { published, publishedAt: published && !r.publishedAt ? new Date() : undefined } });
  refreshSite();
  return { ok: true, message: published ? "Recipe published." : "Recipe unpublished." };
}

// ───────── Categories (recipe + product) ─────────

const catSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(80),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(300).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export async function saveCategory(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const kind = str(f, "kind") === "product" ? "product" : "recipe";
  const id = str(f, "id");
  const parsed = catSchema.safeParse(Object.fromEntries(f));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message, errors: { name: parsed.error.issues[0].message } };
  const slug = slugify(parsed.data.slug || parsed.data.name);
  const data = { name: parsed.data.name, slug, description: parsed.data.description || null, sortOrder: parsed.data.sortOrder ?? 0 };
  try {
    if (kind === "recipe") {
      const image = safeUrl(str(f, "image"));
      if (id) await prisma.recipeCategory.update({ where: { id }, data: { ...data, image } });
      else await prisma.recipeCategory.create({ data: { ...data, image } });
    } else {
      if (id) await prisma.productCategory.update({ where: { id }, data });
      else await prisma.productCategory.create({ data });
    }
  } catch {
    return { ok: false, message: "A category with this URL slug already exists.", errors: { slug: "Already in use." } };
  }
  refreshSite();
  return { ok: true, message: id ? "Category saved." : "Category added." };
}

export async function deleteCategory(kind: "recipe" | "product", id: string) {
  await requireAdmin();
  if (kind === "recipe") await prisma.recipeCategory.delete({ where: { id } }).catch(() => null);
  else await prisma.productCategory.delete({ where: { id } }).catch(() => null);
  refreshSite();
  return { ok: true, message: "Category deleted. Items in it are now uncategorised." };
}
