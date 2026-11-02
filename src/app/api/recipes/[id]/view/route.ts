import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

/** Counts a recipe view at most once per visitor (IP) per recipe every 6 hours. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return NextResponse.json({ ok: false }, { status: 400 });
  const allowed = await rateLimit(`view:${id}`, 1, 6 * 3600);
  if (allowed) await prisma.recipe.updateMany({ where: { id, published: true }, data: { views: { increment: 1 } } });
  return NextResponse.json({ ok: true });
}
