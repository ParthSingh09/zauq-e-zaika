"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { getSessionInfo, submitReview } from "@/server/actions/account";
import { FormMessage, PendingProvider, SubmitButton, TextArea, useFormAction } from "@/components/ui/Form";
import { cn } from "@/lib/utils";

export function ReviewForm({ recipeId, slug }: { recipeId: string; slug: string }) {
  const { state, pending, formProps } = useFormAction(submitReview);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  useEffect(() => {
    getSessionInfo().then((s) => setLoggedIn(s.loggedIn)).catch(() => setLoggedIn(false));
  }, []);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (loggedIn === null) return <div className="skeleton h-40" aria-hidden />;
  if (!loggedIn)
    return (
      <div className="rounded-2xl border border-dashed border-beige bg-cream/50 p-6 text-center">
        <p className="text-cocoa">Cooked this recipe? Sign in to share your rating and review.</p>
        <Link href={`/account/login?next=/recipes/${slug}%23reviews`} className="btn-primary mt-4">Sign in to review</Link>
      </div>
    );

  return (
    <PendingProvider pending={pending}>
    <form {...formProps} className="space-y-4 rounded-2xl border border-line bg-white p-6">
      <input type="hidden" name="recipeId" value={recipeId} />
      <input type="hidden" name="rating" value={rating || ""} />
      <fieldset>
        <legend className="field-label">Your rating</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
              className="rounded p-0.5"
            >
              <Star className={cn("h-7 w-7 transition", n <= (hover || rating) ? "fill-gold text-gold" : "text-beige")} />
            </button>
          ))}
        </div>
        {state.errors?.rating && <p className="field-error">{state.errors.rating}</p>}
      </fieldset>
      <TextArea label="Your review (optional)" name="comment" maxLength={2000} placeholder="How did it turn out? Any tips for other cooks?" error={state.errors?.comment} />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Posting…">Post review</SubmitButton>
    </form>
    </PendingProvider>
  );
}
