import { CartView } from "@/components/shop/CartView";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Your Cart", path: "/cart", noIndex: true });

export default async function CartPage() {
  const { shop } = await getSettings();
  return (
    <div className="container-page py-12 sm:py-16">
      <h1 className="mb-10 text-4xl text-ink sm:text-5xl">Your Cart</h1>
      <CartView checkoutEnabled={shop.enabled && shop.checkoutEnabled} notice={shop.notice} />
    </div>
  );
}
