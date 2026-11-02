import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/AdminUI";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "New product" };

export default async function NewProduct() {
  const categories = await prisma.productCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } });
  return (
    <>
      <AdminHeader title="New product" back={{ href: "/admin/products", label: "All products" }} />
      <ProductForm categories={categories} />
    </>
  );
}
