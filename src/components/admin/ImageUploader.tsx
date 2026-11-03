"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X, Link2 } from "lucide-react";
import { useToast } from "@/components/ui/Toaster";

/**
 * Uploads images to /api/admin/upload and stores resulting URLs in hidden inputs.
 * `multiple` keeps an ordered list (first image = main image).
 */
export function ImageUploader({
  name,
  label,
  defaultValue,
  multiple = false,
  folder = "misc",
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string | string[] | null;
  multiple?: boolean;
  folder?: string;
  hint?: string;
}) {
  const initial = (Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []).filter(Boolean);
  const [urls, setUrls] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files).slice(0, multiple ? 8 : 1)) {
        if (file.size > 5 * 1024 * 1024) {
          toast(`${file.name} is larger than 5 MB.`, "error");
          continue;
        }
        const body = new FormData();
        body.append("file", file);
        body.append("folder", folder);
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast(json.error ?? "Upload failed.", "error");
          continue;
        }
        setUrls((u) => (multiple ? [...u, json.url] : [json.url]));
      }
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const addManual = () => {
    const v = manual.trim();
    if (!v) return;
    if (!/^(https:\/\/|\/)/.test(v)) {
      toast("Image URL must start with https:// or /", "error");
      return;
    }
    setUrls((u) => (multiple ? [...u, v] : [v]));
    setManual("");
  };

  return (
    <div>
      <span className="field-label">{label}</span>
      {multiple ? urls.map((u, i) => <input key={i} type="hidden" name={name} value={u} />) : <input type="hidden" name={name} value={urls[0] ?? ""} />}
      <div className="flex flex-wrap gap-3">
        {urls.map((u, i) => (
          <div key={`${u}-${i}`} className="group relative h-28 w-28 overflow-hidden rounded-xl bg-cream ring-1 ring-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-full w-full object-cover" />
            {multiple && i === 0 && <span className="absolute bottom-1 left-1 rounded bg-ink/80 px-1.5 text-[10px] text-ivory">Main</span>}
            <button type="button" onClick={() => setUrls((all) => all.filter((_, j) => j !== i))} className="absolute top-1 right-1 rounded-full bg-ivory/90 p-1 text-ink shadow hover:bg-card" aria-label="Remove image">
              <X className="h-3.5 w-3.5" />
            </button>
            {multiple && i > 0 && (
              <button type="button" onClick={() => setUrls((all) => [all[i], ...all.filter((_, j) => j !== i)])} className="absolute bottom-1 left-1 rounded bg-ivory/90 px-1.5 text-[10px] text-ink opacity-0 group-hover:opacity-100">
                Make main
              </button>
            )}
          </div>
        ))}
        {(multiple || urls.length === 0) && (
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-beige text-xs text-muted transition hover:border-gold hover:text-ink">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            {busy ? "Uploading…" : "Upload"}
          </button>
        )}
        {!multiple && urls.length > 0 && (
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn-outline btn-sm self-end">
            {busy ? "Uploading…" : "Replace"}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} className="hidden" onChange={(e) => upload(e.target.files)} />
      <div className="mt-2 flex max-w-md gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="…or paste an image URL" className="field py-1.5 pl-9 text-sm" aria-label={`${label} URL`} />
        </div>
        <button type="button" onClick={addManual} className="btn-outline btn-sm">Add</button>
      </div>
      <p className="field-hint">{hint ?? "JPG, PNG, WebP or AVIF up to 5 MB. Landscape 4:3 photos work best."}</p>
    </div>
  );
}
