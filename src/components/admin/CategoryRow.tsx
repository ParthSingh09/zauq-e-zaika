"use client";

import { ActionForm } from "./ActionForm";
import { ConfirmButton } from "./ConfirmButton";
import { ImageUploader } from "./ImageUploader";
import { SubmitButton } from "@/components/ui/Form";
import { deleteCategory, saveCategory } from "@/server/actions/admin/recipes";

type Cat = { id: string; name: string; slug: string; description: string | null; sortOrder: number; image?: string | null; count: number };

export function CategoryRow({ kind, cat }: { kind: "recipe" | "product"; cat?: Cat }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <ActionForm action={saveCategory} resetOnSuccess={!cat}>
        {(e) => (
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_5rem]">
            <input type="hidden" name="kind" value={kind} />
            {cat && <input type="hidden" name="id" value={cat.id} />}
            <div>
              <label className="field-label" htmlFor={`n-${cat?.id ?? kind}`}>Name</label>
              <input id={`n-${cat?.id ?? kind}`} name="name" defaultValue={cat?.name} required className="field py-2 text-sm" aria-invalid={e.name ? true : undefined} />
            </div>
            <div>
              <label className="field-label" htmlFor={`s-${cat?.id ?? kind}`}>URL slug</label>
              <input id={`s-${cat?.id ?? kind}`} name="slug" defaultValue={cat?.slug} placeholder="auto" className="field py-2 text-sm" />
              {e.slug && <p className="field-error">{e.slug}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor={`o-${cat?.id ?? kind}`}>Order</label>
              <input id={`o-${cat?.id ?? kind}`} name="sortOrder" type="number" min={0} defaultValue={cat?.sortOrder ?? 0} className="field py-2 text-sm" />
            </div>
            <div className="sm:col-span-3">
              <label className="field-label" htmlFor={`d-${cat?.id ?? kind}`}>Description</label>
              <input id={`d-${cat?.id ?? kind}`} name="description" defaultValue={cat?.description ?? ""} className="field py-2 text-sm" />
            </div>
            {kind === "recipe" && (
              <div className="sm:col-span-3"><ImageUploader name="image" label="Category image" defaultValue={cat?.image} folder="categories" /></div>
            )}
            <div className="flex items-center gap-2 sm:col-span-3">
              <SubmitButton className="btn-sm" pendingLabel="Saving…">{cat ? "Save" : "Add category"}</SubmitButton>
              {cat && <span className="text-xs text-muted">{cat.count} item{cat.count === 1 ? "" : "s"}</span>}
              {cat && (
                <span className="ml-auto">
                  <ConfirmButton action={deleteCategory.bind(null, kind, cat.id)} confirm={`Delete the “${cat.name}” category? Its ${cat.count} item(s) will become uncategorised.`}>Delete</ConfirmButton>
                </span>
              )}
            </div>
          </div>
        )}
      </ActionForm>
    </div>
  );
}
