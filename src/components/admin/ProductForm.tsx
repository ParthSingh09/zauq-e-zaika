"use client";

import type { Product, ProductVariant } from "@prisma/client";
import { ActionForm } from "./ActionForm";
import { ImageUploader } from "./ImageUploader";
import { VariantsEditor } from "./ListEditors";
import { Checkbox, Panel } from "./AdminUI";
import { Field, Select, SubmitButton, TextArea } from "@/components/ui/Form";
import { saveProduct } from "@/server/actions/admin/products";
import { paiseToRupeesString } from "@/lib/money";

export function ProductForm({ product, categories }: { product?: Product & { variants: ProductVariant[] }; categories: { id: string; name: string }[] }) {
  return (
    <ActionForm action={saveProduct} className="grid gap-6 lg:grid-cols-3">
      {(e) => (
        <>
          {product && <input type="hidden" name="id" value={product.id} />}
          <div className="space-y-6 lg:col-span-2">
            <Panel title="Product">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product name" name="name" required defaultValue={product?.name} error={e.name} className="sm:col-span-2" />
                <Field label="URL slug" name="slug" defaultValue={product?.slug} error={e.slug} hint="Leave blank to generate from the name." />
                <Select label="Category" name="categoryId" defaultValue={product?.categoryId ?? ""}>
                  <option value="">Uncategorised</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <TextArea label="Short description" name="shortDescription" rows={2} maxLength={300} defaultValue={product?.shortDescription} className="sm:col-span-2" />
                <TextArea label="Full description" name="description" rows={6} defaultValue={product?.description} className="sm:col-span-2" />
              </div>
            </Panel>
            <Panel title="Photos">
              <ImageUploader name="images" label="Product photos" defaultValue={product?.images} multiple folder="products" hint="Up to 8 photos. The first is the main image. Square photos work best." />
            </Panel>
            <Panel title="Pricing & options">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Price (₹)" name="price" inputMode="decimal" defaultValue={paiseToRupeesString(product?.pricePaise ?? 0)} error={e.price} hint="Used when the product has no options." />
                <Field label="Compare-at price (₹, optional)" name="compareAt" inputMode="decimal" defaultValue={paiseToRupeesString(product?.compareAtPaise)} error={e.compareAt} hint="Shown struck through to indicate a discount." />
              </div>
              <div className="mt-5">
                <VariantsEditor
                  trackStockHint
                  error={e.variants}
                  defaultValue={(product?.variants ?? []).map((v) => ({ id: v.id, name: v.name, price: paiseToRupeesString(v.pricePaise), stock: String(v.stock), sku: v.sku ?? "" }))}
                />
              </div>
            </Panel>
            <Panel title="Food information" description="Accurate ingredient and allergen information is important for customer safety.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Weight / size" name="weight" defaultValue={product?.weight ?? ""} placeholder="e.g. 500 g" />
                <Select label="Diet" name="diet" defaultValue={product?.diet ?? "VEG"}>
                  <option value="VEG">Vegetarian</option><option value="VEGAN">Vegan</option><option value="EGG">Contains egg</option><option value="NON_VEG">Non-vegetarian</option>
                </Select>
                <TextArea label="Ingredients" name="ingredientsText" rows={3} defaultValue={product?.ingredientsText ?? ""} className="sm:col-span-2" />
                <Field label="Allergens" name="allergens" defaultValue={product?.allergens ?? ""} placeholder="e.g. Contains milk, nuts" />
                <Field label="Shelf life & storage" name="shelfLife" defaultValue={product?.shelfLife ?? ""} placeholder="e.g. 7 days refrigerated" />
              </div>
            </Panel>
          </div>
          <div className="space-y-6">
            <Panel title="Status">
              <div className="space-y-4">
                <Select label="Visibility" name="status" defaultValue={product?.status ?? "DRAFT"}>
                  <option value="ACTIVE">Active — shown in shop</option>
                  <option value="DRAFT">Draft — hidden</option>
                  <option value="ARCHIVED">Archived — hidden</option>
                </Select>
                <Checkbox name="available" label="Available to order" defaultChecked={product?.available ?? true} hint="Untick to show as “Currently unavailable”." />
                <Checkbox name="featured" label="Featured on homepage" defaultChecked={product?.featured} />
                <Checkbox name="isSample" label="Demonstration product" defaultChecked={product?.isSample} hint="Can never be purchased; shows a “Demo” label." />
                <SubmitButton className="w-full" pendingLabel="Saving…">{product ? "Save changes" : "Create product"}</SubmitButton>
              </div>
            </Panel>
            <Panel title="Inventory">
              <div className="space-y-4">
                <Checkbox name="trackStock" label="Track stock" defaultChecked={product?.trackStock} hint="Prevents overselling. Leave off for made-to-order items." />
                <Field label="Stock quantity" name="stock" type="number" min={0} defaultValue={product?.stock ?? 0} hint="Used when the product has no options." />
              </div>
            </Panel>
          </div>
        </>
      )}
    </ActionForm>
  );
}
