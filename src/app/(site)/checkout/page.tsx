import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { razorpayConfigured, razorpayTestMode } from "@/lib/razorpay";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Checkout", path: "/checkout", noIndex: true });

export default async function CheckoutPage() {
  const [{ shop }, user, regionCount] = await Promise.all([
    getSettings(),
    getCurrentUser(),
    prisma.deliveryRegion.count({ where: { active: true } }),
  ]);

  if (!shop.enabled || !shop.checkoutEnabled) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-4xl text-ink">Ordering opens soon</h1>
        <p className="mx-auto mt-4 max-w-lg text-muted">{shop.notice || "Online ordering is not open yet."}</p>
        <Link href="/shop" className="btn-primary mt-8">Back to the shop</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12 sm:py-16">
      <h1 className="text-4xl text-ink sm:text-5xl">Checkout</h1>
      <p className="mt-3 mb-10 text-muted">
        {user ? `Signed in as ${user.email}.` : <>Checking out as a guest. <Link href="/account/login?next=/checkout" className="font-medium text-spice-deep underline">Sign in</Link> to track orders in your account.</>}
      </p>
      <CheckoutForm
        defaults={{ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" }}
        options={{
          allowDelivery: shop.allowDelivery,
          allowPickup: shop.allowPickup,
          pickupAddress: shop.pickupAddress,
          pickupInstructions: shop.pickupInstructions,
          allowPayOnDelivery: shop.allowPayOnDelivery,
          razorpayAvailable: shop.razorpayEnabled && razorpayConfigured(),
          razorpayTestMode: razorpayTestMode(),
          preparationTime: shop.preparationTime,
          orderCutoff: shop.orderCutoff,
          hasRegions: regionCount > 0,
        }}
      />
    </div>
  );
}
