import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/AdminUI";
import { RecipeForm } from "@/components/admin/RecipeForm";

export const metadata = { title: "New recipe" };

export default async function NewRecipe() {
  const categories = await prisma.recipeCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } });
  return (
    <>
      <AdminHeader title="New recipe" back={{ href: "/admin/recipes", label: "All recipes" }} />
      <RecipeForm categories={categories} />
    </>
  );
}
