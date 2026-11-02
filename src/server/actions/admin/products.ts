"use server";

import type { Diet, ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { rupeesToPaise } from "@/lib/money";
import { bool, int, json, optStr, refreshSite, safeUrl, str } from "../../form";
import type { ActionState } from "../../action-state";

type VariantInput = { id?: string; name: string; price: string; stock: string; sku?: string };
const STATUSES: ProductStatus[] = ["ACTIVE", "DRAFT", "ARCHIVED"];
const DIETS: Diet[] = ["VEG", "NON_VEG", "EGG", "VEGAN"];

export async function saveProduct(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(f, "id");
  const errors: Record<string, string> = {};
  const name = str(f, "name", 160);
  if (name.length < 2) errors.name = "Please enter a product name.";
  const slug = slugify(str(f, "slug", 100) || name);
  if (!slug) errors.slug = "Please enter a valid URL slug.";
  const price = rupeesToPaise(str(f, "price"));
  if (price === null) errors.price = "Enter a valid price in rupees.";
  const compareRaw = str(f, "compareAt");
  const compareAt = compareRaw ? rupeesToPaise(compareRaw) : null;
  if (compareRaw && compareAt === null) errors.compareAt = "Enter a valid amount.";
  const variants = json<VariantInput[]>(f, "variants", [])
    .filter((v) => v && typeof v.name === "string" && v.name.trim())
    .slice(0, 30)
    .map((v, i) => ({ id: v.id, name: v.name.trim().slice(0, 80), pricePaise: rupeesToPaise(v.price), stock: Math.max(0, Math.round(Number(v.stock) || 0)), sku: v.sku?.trim().slice(0, 60) || null, sortOrder: i }));
  if (variants.some((v) => v.pricePaise === null)) errors.variants = "Every option needs a valid price.";
  const status = STATUSES.includes(str(f, "status") as ProductStatus) ? (str(f, "status") as ProductStatus) : "DRAFT";
  const isSample = bool(f, "isSample");
  if (status === "ACTIVE" && !isSample && (price ?? 0) <= 0 && !variants.length) errors.price = "Active products need a price above ₹0.";
  const clash = await prisma.product.findFirst({ where: { slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
  if (clash) errors.slug = "Another product already uses this URL.";
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  const categoryId = str(f, "categoryId") || null;
  const images = f.getAll("images").map((v) => safeUrl(String(v))).filter((v): v is string => Boolean(v)).slice(0, 8);
  const data = {
    name,
    slug,
    shortDescription: str(f, "shortDescription", 300),
    description: str(f, "description", 10000),
    images,
    pricePaise: price ?? 0,
    compareAtPaise: compareAt,
    trackStock: bool(f, "trackStock"),
    stock: int(f, "stock", 0, 0, 100000),
    status,
    available: bool(f, "available"),
    isSample,
    featured: bool(f, "featured"),
    diet: DIETS.includes(str(f, "diet") as Diet) ? (str(f, "diet") as Diet) : "VEG",
    weight: optStr(f, "weight", 80),
    shelfLife: optStr(f, "shelfLife", 300),
    ingredientsText: optStr(f, "ingredientsText", 2000),
    allergens: optStr(f, "allergens", 300),
    categoryId: categoryId && (await prisma.productCategory.findUnique({ where: { id: categoryId } })) ? categoryId : null,
  };

  const productId = await prisma.$transaction(async (tx) => {
    const p = id ? await tx.product.update({ where: { id }, data }) : await tx.product.create({ data });
    const existing = await tx.productVariant.findMany({ where: { productId: p.id } });
    const keep = new Set(variants.map((v) => v.id).filter(Boolean));
    // Remove deleted options (order history keeps its own copy of names and prices).
    await tx.productVariant.deleteMany({ where: { productId: p.id, id: { notIn: [...keep] as string[] } } });
    for (const v of variants) {
      const vData = { name: v.name, pricePaise: v.pricePaise!, stock: v.stock, sku: v.sku, sortOrder: v.sortOrder };
      if (v.id && existing.some((e) => e.id === v.id)) await tx.productVariant.update({ where: { id: v.id }, data: vData });
      else await tx.productVariant.create({ data: { ...vData, productId: p.id } });
    }
    return p.id;
  });
  refreshSite();
  return { ok: true, message: id ? "Product saved." : "Product created.", data: id ? undefined : { redirect: `/admin/products/${productId}` } };
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const orders = await prisma.orderItem.count({ where: { productId: id } });
  if (orders > 0) {
    await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    refreshSite();
    return { ok: true, message: "This product has orders, so it was archived (hidden) instead of deleted." };
  }
  await prisma.product.delete({ where: { id } }).catch(() => null);
  refreshSite();
  return { ok: true, message: "Product deleted." };
}

export async function quickUpdateProduct(id: string, patch: { available?: boolean; status?: ProductStatus }) {
  await requireAdmin();
  if (patch.status && !STATUSES.includes(patch.status)) return { ok: false, message: "Invalid status." };
  await prisma.product.update({ where: { id }, data: patch });
  refreshSite();
  return { ok: true, message: "Product updated." };
}
