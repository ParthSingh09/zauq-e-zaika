import { prisma } from "@/lib/db";
import { AdminHeader, Panel } from "@/components/admin/AdminUI";
import { CategoryRow } from "@/components/admin/CategoryRow";

export const metadata = { title: "Categories" };

export default async function Categories() {
  const [recipeCats, productCats] = await Promise.all([
    prisma.recipeCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { recipes: true } } } }),
    prisma.productCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } }),
  ]);
  return (
    <>
      <AdminHeader title="Categories" description="Organise recipes and shop products." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Recipe categories">
          <div className="space-y-3">
            {recipeCats.map((c) => <CategoryRow key={c.id} kind="recipe" cat={{ ...c, count: c._count.recipes }} />)}
            <p className="pt-3 text-sm font-semibold text-ink">Add a recipe category</p>
            <CategoryRow kind="recipe" />
          </div>
        </Panel>
        <Panel title="Product categories">
          <div className="space-y-3">
            {productCats.map((c) => <CategoryRow key={c.id} kind="product" cat={{ ...c, count: c._count.products }} />)}
            <p className="pt-3 text-sm font-semibold text-ink">Add a product category</p>
            <CategoryRow kind="product" />
          </div>
        </Panel>
      </div>
    </>
  );
}
