import { TrackOrderForm } from "@/components/shop/TrackOrderForm";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Track Your Order", path: "/track-order", noIndex: true });

export default function TrackOrderPage() {
  return (
    <div className="container-page max-w-md py-16 sm:py-24">
      <h1 className="text-center text-4xl text-ink">Track your order</h1>
      <p className="mt-3 mb-8 text-center text-muted">Enter your order number and the email you used at checkout.</p>
      <div className="card p-6 sm:p-8"><TrackOrderForm /></div>
    </div>
  );
}
