import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { AdminHeader, Badge, EmptyRow, Table, Td, Th } from "@/components/admin/AdminUI";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Stars } from "@/components/recipes/Stars";
import { deleteReview, setReviewApproved } from "@/server/actions/admin/content";

export const metadata = { title: "Reviews" };

export default async function Reviews() {
  const reviews = await prisma.recipeReview.findMany({ orderBy: { createdAt: "desc" }, take: 300, include: { recipe: { select: { title: true, slug: true } }, user: { select: { name: true, email: true } } } });
  return (
    <>
      <AdminHeader title="Recipe reviews" description="Reviews come from signed-in customers. Hide anything inappropriate." />
      <Table minWidth={860}>
        <thead><tr><Th>Review</Th><Th>Recipe</Th><Th>Customer</Th><Th>Date</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
        <tbody>
          {reviews.length === 0 && <EmptyRow cols={6}>No reviews yet.</EmptyRow>}
          {reviews.map((r) => (
            <tr key={r.id}>
              <Td className="max-w-sm"><Stars value={r.rating} /><p className="mt-1 line-clamp-3 text-cocoa">{r.comment || <span className="text-muted">No comment</span>}</p></Td>
              <Td><Link href={`/recipes/${r.recipe.slug}`} target="_blank" className="text-spice-deep hover:underline">{r.recipe.title}</Link></Td>
              <Td>{r.user.name}<span className="block text-xs text-muted">{r.user.email}</span></Td>
              <Td className="text-muted">{formatDate(r.createdAt)}</Td>
              <Td>{r.approved ? <Badge tone="green">Visible</Badge> : <Badge tone="red">Hidden</Badge>}</Td>
              <Td className="text-right whitespace-nowrap">
                <ConfirmButton action={setReviewApproved.bind(null, r.id, !r.approved)}>{r.approved ? "Hide" : "Show"}</ConfirmButton>
                <ConfirmButton action={deleteReview.bind(null, r.id)} confirm="Delete this review permanently?">Delete</ConfirmButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
