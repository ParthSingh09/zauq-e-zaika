"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Printer, Share2 } from "lucide-react";
import { getSavedStatus, toggleSavedRecipe } from "@/server/actions/account";
import { useToast } from "@/components/ui/Toaster";
import { cn } from "@/lib/utils";

export function RecipeActions({ recipeId, slug, title }: { recipeId: string; slug: string; title: string }) {
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    getSavedStatus(recipeId).then((s) => setSaved(s.saved)).catch(() => {});
    // Count a view (rate-limited server-side).
    fetch(`/api/recipes/${recipeId}/view`, { method: "POST" }).catch(() => {});
  }, [recipeId]);

  const onSave = () =>
    start(async () => {
      const res = await toggleSavedRecipe(recipeId);
      if (res.needsLogin) {
        toast("Sign in to save recipes to your account.", "error");
        router.push(`/account/login?next=/recipes/${slug}`);
        return;
      }
      if (res.ok) {
        setSaved(Boolean(res.saved));
        toast(res.saved ? "Saved to your favourites." : "Removed from your favourites.");
      } else toast(res.message ?? "Something went wrong.", "error");
    });

  const onShare = async () => {
    const url = window.location.href.split("#")[0];
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title} — a recipe from Zauq-e-Zaika`, url });
      } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied — share it with someone you love.");
    } catch {
      toast("Could not copy the link.", "error");
    }
  };

  const btn = "btn-outline btn-sm h-10 px-4";
  return (
    <div className="flex flex-wrap gap-2" data-no-print>
      <button type="button" onClick={onSave} disabled={pending} aria-pressed={saved} className={cn(btn, saved && "border-spice-deep bg-spice-solid text-white hover:bg-spice-solid")}>
        <Heart className={cn("h-4 w-4", saved && "fill-current")} aria-hidden />
        {saved ? "Saved" : "Save"}
      </button>
      <button type="button" onClick={onShare} className={btn}>
        <Share2 className="h-4 w-4" aria-hidden /> Share
      </button>
      <button type="button" onClick={() => window.print()} className={btn}>
        <Printer className="h-4 w-4" aria-hidden /> Print
      </button>
    </div>
  );
}
