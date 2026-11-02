import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

const csvCell = (v: string) => {
  // Prevent CSV/formula injection when opened in spreadsheet apps.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const subs = await prisma.newsletterSubscriber.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } });
  const rows = [["email", "subscribed_at"], ...subs.map((s) => [s.email, s.createdAt.toISOString()])];
  const body = rows.map((r) => r.map(csvCell).join(",")).join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zauq-e-zaika-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
