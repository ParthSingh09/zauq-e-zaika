import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Plus, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { AdminHeader, Badge, EmptyRow, Table, Td, Th } from "@/components/admin/AdminUI";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteRecipe, setRecipePublished } from "@/server/actions/admin/recipes";

export const metadata = { title: "Recipes" };

export default async function AdminRecipes({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;
  const where: Prisma.RecipeWhereInput = {
    ...(q ? { title: { contains: q.slice(0, 100), mode: "insensitive" } } : {}),
    ...(status === "published" ? { published: true } : status === "draft" ? { published: false } : status === "sample" ? { isSample: true } : {}),
  };
  const recipes = await prisma.recipe.findMany({ where, orderBy: { updatedAt: "desc" }, include: { category: true, _count: { select: { reviews: true } } } });

  return (
    <>
      <AdminHeader title="Recipes" description="Add, edit and publish your recipes." actions={<Link href="/admin/recipes/new" className="btn-primary btn-sm"><Plus className="h-4 w-4" /> Add recipe</Link>} />
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <input name="q" defaultValue={q} placeholder="Search recipes…" aria-label="Search recipes" className="field max-w-xs py-2 text-sm" />
        <select name="status" defaultValue={status ?? ""} aria-label="Filter by status" className="field w-auto py-2 text-sm">
          <option value="">All</option><option value="published">Published</option><option value="draft">Drafts</option><option value="sample">Sample content</option>
        </select>
        <button className="btn-outline btn-sm">Filter</button>
      </form>
      <Table minWidth={820}>
        <thead><tr><Th>Recipe</Th><Th>Category</Th><Th>Status</Th><Th>Views</Th><Th>Updated</Th><Th className="text-right">Actions</Th></tr></thead>
        <tbody>
          {recipes.length === 0 && <EmptyRow cols={6}>No recipes found. <Link href="/admin/recipes/new" className="font-semibold text-spice-deep underline">Add your first recipe</Link></EmptyRow>}
          {recipes.map((r) => (
            <tr key={r.id}>
              <Td>
                <Link href={`/admin/recipes/${r.id}`} className="flex items-center gap-3 font-medium text-ink hover:text-spice-deep">
                  <span className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-cream">{r.image && <Image src={r.image} alt="" fill sizes="56px" className="object-cover" />}</span>
                  <span>{r.title}<span className="block text-xs font-normal text-muted">/recipes/{r.slug}</span></span>
                </Link>
              </Td>
              <Td>{r.category?.name ?? <span className="text-muted">—</span>}</Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {r.published ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>}
                  {r.featured && <Badge tone="gold">Featured</Badge>}
                  {r.isSample && <Badge tone="ink">Sample</Badge>}
                </div>
              </Td>
              <Td>{r.views}</Td>
              <Td className="text-muted">{formatDate(r.updatedAt)}</Td>
              <Td className="text-right whitespace-nowrap">
                <ConfirmButton action={setRecipePublished.bind(null, r.id, !r.published)}>{r.published ? "Unpublish" : "Publish"}</ConfirmButton>
                {r.published && <Link href={`/recipes/${r.slug}`} target="_blank" className="btn-ghost btn-sm" aria-label={`View ${r.title}`}><ExternalLink className="h-4 w-4" /></Link>}
                <ConfirmButton action={deleteRecipe.bind(null, r.id)} confirm={`Delete “${r.title}”? This cannot be undone.`}>Delete</ConfirmButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
