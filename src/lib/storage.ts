import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Detect image type from magic bytes — never trust the client-provided MIME type or extension. */
export function sniffImageType(buf: Buffer): { ext: string; mime: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { ext: "png", mime: "image/png" };
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP")
    return { ext: "webp", mime: "image/webp" };
  if (buf.toString("ascii", 4, 8) === "ftyp" && /avif|avis/.test(buf.toString("ascii", 8, 12)))
    return { ext: "avif", mime: "image/avif" };
  return null;
}

/** Stores an image and returns its public URL. Driver is chosen by STORAGE_DRIVER. */
export async function storeImage(buf: Buffer, folder: string): Promise<string> {
  const type = sniffImageType(buf);
  if (!type) throw new Error("Unsupported image type. Please upload JPG, PNG, WebP or AVIF.");
  if (buf.length > MAX_UPLOAD_BYTES) throw new Error("Image is larger than 5 MB.");
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "") || "misc";
  const name = `${safeFolder}/${new Date().getFullYear()}/${randomUUID()}.${type.ext}`;

  const driver = process.env.STORAGE_DRIVER || "local";
  if (driver === "supabase") {
    const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
    if (!url || !key) throw new Error("Supabase storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
    const res = await fetch(`${url}/storage/v1/object/${bucket}/${name}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": type.mime,
        "Cache-Control": "31536000",
        "x-upsert": "false",
      },
      body: new Uint8Array(buf),
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status}): ${await res.text()}`);
    return `${url}/storage/v1/object/public/${bucket}/${name}`;
  }

  if (process.env.VERCEL) {
    throw new Error("Local uploads are not persistent on Vercel. Set STORAGE_DRIVER=supabase.");
  }
  const dest = path.join(process.cwd(), "public", "uploads", name);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return `/uploads/${name}`;
}
