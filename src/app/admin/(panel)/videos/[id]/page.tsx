import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminHeader, Panel } from "@/components/admin/AdminUI";
import { VideoForm } from "@/components/admin/AdminForms";

export const metadata = { title: "Edit video" };

export default async function EditVideo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [video, recipes] = await Promise.all([
    prisma.video.findUnique({ where: { id } }),
    prisma.recipe.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  if (!video) notFound();
  return (
    <>
      <AdminHeader title="Edit video" back={{ href: "/admin/videos", label: "All videos" }} />
      <Panel className="max-w-2xl"><VideoForm video={video} recipes={recipes} /></Panel>
    </>
  );
}
