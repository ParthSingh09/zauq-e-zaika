import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/AdminUI";
import { ProductForm } from "@/components/admin/ProductForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteProduct } from "@/server/actions/admin/products";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { variants: { orderBy: { sortOrder: "asc" } } } }),
    prisma.productCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  if (!product) notFound();
  return (
    <>
      <AdminHeader
        title={product.name}
        back={{ href: "/admin/products", label: "All products" }}
        actions={
          <>
            {product.status === "ACTIVE" && <Link href={`/shop/${product.slug}`} target="_blank" className="btn-outline btn-sm"><ExternalLink className="h-4 w-4" /> View</Link>}
            <ConfirmButton action={deleteProduct.bind(null, product.id)} confirm={`Delete “${product.name}”?`} redirectTo="/admin/products">Delete product</ConfirmButton>
          </>
        }
      />
      <ProductForm product={product} categories={categories} />
    </>
  );
}
