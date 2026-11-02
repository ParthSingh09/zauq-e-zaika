import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/AdminUI";
import { RecipeForm } from "@/components/admin/RecipeForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteRecipe } from "@/server/actions/admin/recipes";

export const metadata = { title: "Edit recipe" };

export default async function EditRecipe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [recipe, categories] = await Promise.all([
    prisma.recipe.findUnique({ where: { id } }),
    prisma.recipeCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  if (!recipe) notFound();
  return (
    <>
      <AdminHeader
        title={recipe.title}
        back={{ href: "/admin/recipes", label: "All recipes" }}
        actions={
          <>
            {recipe.published && <Link href={`/recipes/${recipe.slug}`} target="_blank" className="btn-outline btn-sm"><ExternalLink className="h-4 w-4" /> View</Link>}
            <ConfirmButton action={deleteRecipe.bind(null, recipe.id)} confirm={`Delete “${recipe.title}”? This cannot be undone.`} redirectTo="/admin/recipes">Delete recipe</ConfirmButton>
          </>
        }
      />
      <RecipeForm recipe={recipe} categories={categories} />
    </>
  );
}
