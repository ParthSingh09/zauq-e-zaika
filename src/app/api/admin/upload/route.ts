import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, storeImage } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await rateLimit("upload", 60, 600, admin.id))) return NextResponse.json({ error: "Too many uploads. Please wait." }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Image is larger than 5 MB." }, { status: 413 });
  const folder = String(form?.get("folder") ?? "misc");

  try {
    const url = await storeImage(Buffer.from(await file.arrayBuffer()), folder);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed." }, { status: 400 });
  }
}
