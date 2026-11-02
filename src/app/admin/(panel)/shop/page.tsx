import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { razorpayConfigured, razorpayTestMode } from "@/lib/razorpay";
import { formatPaise } from "@/lib/money";
import { AdminHeader, Badge, Panel } from "@/components/admin/AdminUI";
import { RegionForm, ShopSettingsForm } from "@/components/admin/AdminForms";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteRegion } from "@/server/actions/admin/content";

export const metadata = { title: "Shop & delivery" };

export default async function ShopSettings() {
  const [s, regions] = await Promise.all([getSettings(), prisma.deliveryRegion.findMany({ orderBy: { name: "asc" } })]);
  return (
    <>
      <AdminHeader title="Shop & delivery" description="Control ordering, delivery areas, pickup and payment methods." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Shop settings"><ShopSettingsForm s={s.shop} razorpayConfigured={razorpayConfigured()} testMode={razorpayTestMode()} /></Panel>
        <div className="space-y-6">
          <Panel title="Delivery areas" description="Customers can only order delivery to PIN codes listed here. Nothing is promised elsewhere.">
            <div className="space-y-4">
              {regions.length === 0 && <p className="rounded-xl bg-cream p-4 text-sm text-cocoa">No delivery areas yet — delivery orders cannot be placed until you add one.</p>}
              {regions.map((r) => (
                <details key={r.id} className="rounded-xl border border-line p-4">
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-ink">{r.name}</span>
                    <span className="flex items-center gap-2 text-sm text-muted">
                      {r.active ? <Badge tone="green">Active</Badge> : <Badge>Paused</Badge>}
                      {formatPaise(r.chargePaise)} · {r.postalCodes.length} code(s)
                    </span>
                  </summary>
                  <div className="mt-4"><RegionForm region={r} /></div>
                  <div className="mt-2 text-right"><ConfirmButton action={deleteRegion.bind(null, r.id)} confirm={`Delete the “${r.name}” delivery area?`}>Delete area</ConfirmButton></div>
                </details>
              ))}
              <div className="rounded-xl border border-dashed border-beige p-4">
                <p className="mb-3 text-sm font-semibold text-ink">Add a delivery area</p>
                <RegionForm />
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
