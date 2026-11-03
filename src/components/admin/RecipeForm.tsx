"use client";

import type { Recipe } from "@prisma/client";
import { ActionForm } from "./ActionForm";
import { ImageUploader } from "./ImageUploader";
import { IngredientsEditor, StepsEditor } from "./ListEditors";
import { Checkbox, Panel } from "./AdminUI";
import { Field, Select, SubmitButton, TextArea } from "@/components/ui/Form";
import { saveRecipe } from "@/server/actions/admin/recipes";
import { asIngredients, asNutrition, asSteps, asStrings } from "@/lib/recipe-data";

const NUTRITION = [
  ["calories", "Calories", "e.g. 320 kcal"],
  ["proteinContent", "Protein", "e.g. 9 g"],
  ["carbohydrateContent", "Carbohydrates", "e.g. 45 g"],
  ["fatContent", "Fat", "e.g. 12 g"],
  ["fiberContent", "Fibre", ""],
  ["sugarContent", "Sugar", ""],
  ["sodiumContent", "Sodium", ""],
] as const;

export function RecipeForm({ recipe, categories }: { recipe?: Recipe; categories: { id: string; name: string }[] }) {
  const nutrition = asNutrition(recipe?.nutrition) ?? {};
  return (
    <ActionForm action={saveRecipe} className="grid gap-6 lg:grid-cols-3">
      {(e) => (
        <>
          {recipe && <input type="hidden" name="id" value={recipe.id} />}
          <div className="space-y-6 lg:col-span-2">
            <Panel title="Basics">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Recipe title" name="title" required defaultValue={recipe?.title} error={e.title} className="sm:col-span-2" />
                <Field label="URL slug" name="slug" defaultValue={recipe?.slug} error={e.slug} hint="Leave blank to generate from the title, e.g. kheer-puri" />
                <Field label="Cuisine" name="cuisine" defaultValue={recipe?.cuisine ?? ""} placeholder="e.g. North Indian" />
                <TextArea label="Short description" name="excerpt" required rows={2} maxLength={300} defaultValue={recipe?.excerpt} error={e.excerpt} hint="Shown on recipe cards and in Google results (≈150 characters)." className="sm:col-span-2" />
                <TextArea label="Introduction" name="intro" rows={6} defaultValue={recipe?.intro} hint="Supports **bold**, *italic*, [links](https://…), lists (- item) and ## headings." className="sm:col-span-2" />
              </div>
            </Panel>

            <Panel title="Ingredients">
              <IngredientsEditor defaultValue={asIngredients(recipe?.ingredients)} error={e.ingredients} />
            </Panel>

            <Panel title="Method">
              <StepsEditor defaultValue={asSteps(recipe?.steps)} error={e.steps} />
            </Panel>

            <Panel title="Tips & substitutions">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextArea label="Cooking tips" name="tips" rows={5} defaultValue={asStrings(recipe?.tips).join("\n")} hint="One tip per line." />
                <TextArea label="Substitutions" name="substitutions" rows={5} defaultValue={asStrings(recipe?.substitutions).join("\n")} hint="One per line." />
              </div>
            </Panel>

            <Panel title="Nutrition (optional)" description="Only fill this in with reliable, calculated data — it appears in Google results. Leave blank otherwise.">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {NUTRITION.map(([k, label, ph]) => (
                  <Field key={k} label={label} name={`nutrition.${k}`} defaultValue={nutrition[k] ?? ""} placeholder={ph} />
                ))}
              </div>
            </Panel>

            <Panel title="Search engine (SEO)">
              <div className="grid gap-4">
                <Field label="SEO title (optional)" name="seoTitle" maxLength={70} defaultValue={recipe?.seoTitle ?? ""} hint="Defaults to “<Title> Recipe”." />
                <TextArea label="SEO description (optional)" name="seoDescription" rows={2} maxLength={170} defaultValue={recipe?.seoDescription ?? ""} hint="Defaults to the short description." />
                <Field label="Tags" name="tags" defaultValue={recipe?.tags.join(", ")} hint="Comma-separated, e.g. kheer, festival, sweet. Used by recipe search." />
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Publishing">
              <div className="space-y-4">
                <Checkbox name="published" label="Published" defaultChecked={recipe?.published} hint="Visible on the website." />
                <Checkbox name="featured" label="Featured on homepage" defaultChecked={recipe?.featured} />
                <Checkbox name="isSample" label="Mark as sample content" defaultChecked={recipe?.isSample} hint="Shows a “Sample content” label. Untick once this is your real recipe." />
                <SubmitButton className="w-full" pendingLabel="Saving…">{recipe ? "Save changes" : "Create recipe"}</SubmitButton>
              </div>
            </Panel>

            <Panel title="Photo">
              <div className="space-y-4">
                <ImageUploader name="image" label="Featured image" defaultValue={recipe?.image} folder="recipes" />
                <Field label="Image description (alt text)" name="imageAlt" defaultValue={recipe?.imageAlt ?? ""} hint="Describe the photo for screen readers and Google." />
              </div>
            </Panel>

            <Panel title="Details">
              <div className="grid grid-cols-2 gap-4">
                <Select label="Category" name="categoryId" defaultValue={recipe?.categoryId ?? ""} className="col-span-2">
                  <option value="">Uncategorised</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Select label="Diet" name="diet" defaultValue={recipe?.diet ?? "VEG"}>
                  <option value="VEG">Vegetarian</option>
                  <option value="VEGAN">Vegan</option>
                  <option value="EGG">Contains egg</option>
                  <option value="NON_VEG">Non-vegetarian</option>
                </Select>
                <Select label="Difficulty" name="difficulty" defaultValue={recipe?.difficulty ?? "EASY"}>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Challenging</option>
                </Select>
                <Field label="Prep (min)" name="prepMinutes" type="number" min={0} defaultValue={recipe?.prepMinutes ?? 0} />
                <Field label="Cook (min)" name="cookMinutes" type="number" min={0} defaultValue={recipe?.cookMinutes ?? 0} />
                <Field label="Servings" name="servings" type="number" min={1} defaultValue={recipe?.servings ?? 4} className="col-span-2" />
              </div>
            </Panel>

          </div>
        </>
      )}
    </ActionForm>
  );
}
