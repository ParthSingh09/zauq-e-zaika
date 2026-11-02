"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { getWishlistStatus, toggleWishlist } from "@/server/actions/account";
import { useToast } from "@/components/ui/Toaster";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId, slug }: { productId: string; slug: string }) {
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  useEffect(() => {
    getWishlistStatus(productId).then((s) => setSaved(s.saved)).catch(() => {});
  }, [productId]);

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={saved}
      onClick={() =>
        start(async () => {
          const res = await toggleWishlist(productId);
          if (res.needsLogin) {
            toast("Sign in to use your wishlist.", "error");
            router.push(`/account/login?next=/shop/${slug}`);
            return;
          }
          if (res.ok) {
            setSaved(Boolean(res.saved));
            toast(res.saved ? "Added to your wishlist." : "Removed from your wishlist.");
          }
        })
      }
      className={cn("btn-outline btn-sm h-10", saved && "border-spice-deep text-spice-deep")}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-current")} aria-hidden /> {saved ? "In wishlist" : "Add to wishlist"}
    </button>
  );
}
