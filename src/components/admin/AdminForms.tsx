"use client";

import type { DeliveryRegion, Page, Testimonial } from "@prisma/client";
import { ActionForm } from "./ActionForm";
import { ImageUploader } from "./ImageUploader";
import { Checkbox } from "./AdminUI";
import { Field, SubmitButton, TextArea } from "@/components/ui/Form";
import { createAdmin, saveRegion, savePage, saveSettingsGroup, saveTestimonial } from "@/server/actions/admin/content";
import type { Settings } from "@/lib/settings";
import { paiseToRupeesString } from "@/lib/money";

// ───────── Testimonials ─────────
export function TestimonialForm({ t }: { t?: Testimonial }) {
  return (
    <ActionForm action={saveTestimonial} className="space-y-3" resetOnSuccess={!t}>
      {(e) => (
        <>
          {t && <input type="hidden" name="id" value={t.id} />}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Customer name" name="name" required defaultValue={t?.name} error={e.name || undefined} />
            <Field label="Location (optional)" name="location" defaultValue={t?.location ?? ""} />
            <Field label="Sort order" name="sortOrder" type="number" min={0} defaultValue={t?.sortOrder ?? 0} />
          </div>
          <TextArea label="Their words" name="quote" required rows={3} defaultValue={t?.quote} error={e.quote || undefined} />
          <div className="flex items-center justify-between gap-4">
            <Checkbox name="published" label="Show on homepage" defaultChecked={t?.published} />
            <SubmitButton className="btn-sm" pendingLabel="Saving…">{t ? "Save" : "Add testimonial"}</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}

// ───────── Delivery regions ─────────
export function RegionForm({ region }: { region?: DeliveryRegion }) {
  return (
    <ActionForm action={saveRegion} className="space-y-3" resetOnSuccess={!region}>
      {(e) => (
        <>
          {region && <input type="hidden" name="id" value={region.id} />}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Area name" name="name" required defaultValue={region?.name} placeholder="e.g. South Delhi" error={e.name} />
            <Field label="PIN codes or prefixes" name="postalCodes" required defaultValue={region?.postalCodes.join(", ")} placeholder="110017, 110019, 1100" error={e.postalCodes} hint="Comma-separated. A prefix like 1100 matches every PIN starting with 1100." />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Delivery charge (₹)" name="charge" inputMode="decimal" defaultValue={paiseToRupeesString(region?.chargePaise ?? 0)} error={e.charge} />
            <Field label="Free delivery above (₹)" name="freeAbove" inputMode="decimal" defaultValue={paiseToRupeesString(region?.freeAbovePaise)} hint="Optional" />
            <Field label="Minimum order (₹)" name="minOrder" inputMode="decimal" defaultValue={paiseToRupeesString(region?.minOrderPaise ?? 0)} />
          </div>
          <div className="flex items-center justify-between">
            <Checkbox name="active" label="Active" defaultChecked={region?.active ?? true} />
            <SubmitButton className="btn-sm" pendingLabel="Saving…">{region ? "Save area" : "Add delivery area"}</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}

// ───────── Site settings ─────────
const G = ({ group }: { group: string }) => <input type="hidden" name="group" value={group} />;

export function AnnouncementForm({ s }: { s: Settings["announcement"] }) {
  return (
    <ActionForm action={saveSettingsGroup} className="space-y-4">
      <G group="announcement" />
      <Checkbox name="enabled" label="Show announcement bar" defaultChecked={s.enabled} />
      <Field label="Message" name="text" defaultValue={s.text} maxLength={200} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Link label" name="linkLabel" defaultValue={s.linkLabel} />
        <Field label="Link URL" name="linkHref" defaultValue={s.linkHref} placeholder="/recipes or https://…" />
      </div>
      <SubmitButton className="btn-sm">Save announcement</SubmitButton>
    </ActionForm>
  );
}

export function HeroForm({ s }: { s: Settings["hero"] }) {
  return (
    <ActionForm action={saveSettingsGroup} className="space-y-4">
      <G group="hero" />
      <Field label="Small heading above title" name="eyebrow" defaultValue={s.eyebrow} />
      <Field label="Headline" name="title" defaultValue={s.title} />
      <TextArea label="Supporting text" name="subtitle" rows={2} defaultValue={s.subtitle} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Primary button label" name="primaryCtaLabel" defaultValue={s.primaryCtaLabel} />
        <Field label="Primary button link" name="primaryCtaHref" defaultValue={s.primaryCtaHref} />
        <Field label="Secondary button label" name="secondaryCtaLabel" defaultValue={s.secondaryCtaLabel} />
        <Field label="Secondary button link" name="secondaryCtaHref" defaultValue={s.secondaryCtaHref} />
      </div>
      <ImageUploader name="image" label="Hero image" defaultValue={s.image} folder="banners" hint="Portrait (6:7) food photography works best." />
      <Field label="Hero image description (alt text)" name="imageAlt" defaultValue={s.imageAlt} />
      <SubmitButton className="btn-sm">Save hero</SubmitButton>
    </ActionForm>
  );
}

export function HomeForm({ s }: { s: Settings["home"] }) {
  const why = [0, 1, 2, 3].map((i) => s.whyChoose[i] ?? { title: "", body: "" });
  return (
    <ActionForm action={saveSettingsGroup} className="space-y-4">
      <G group="home" />
      <Field label="Introduction heading" name="introTitle" defaultValue={s.introTitle} />
      <TextArea label="Introduction text" name="introBody" rows={4} defaultValue={s.introBody} />
      <Field label="Philosophy heading" name="philosophyTitle" defaultValue={s.philosophyTitle} />
      <TextArea label="Philosophy text" name="philosophyBody" rows={4} defaultValue={s.philosophyBody} />
      <ImageUploader name="philosophyImage" label="Philosophy section image" defaultValue={s.philosophyImage} folder="banners" />
      <fieldset className="space-y-3">
        <legend className="field-label">“Why choose us” points</legend>
        {why.map((w, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[14rem_1fr]">
            <input name={`why.${i}.title`} defaultValue={w.title} placeholder="Title" aria-label={`Point ${i + 1} title`} className="field py-2 text-sm" />
            <input name={`why.${i}.body`} defaultValue={w.body} placeholder="Description" aria-label={`Point ${i + 1} description`} className="field py-2 text-sm" />
          </div>
        ))}
      </fieldset>
      <SubmitButton className="btn-sm">Save homepage sections</SubmitButton>
    </ActionForm>
  );
}

export function ContactSettingsForm({ s }: { s: Settings["contact"] }) {
  return (
    <ActionForm action={saveSettingsGroup} className="space-y-4">
      {(e) => (
        <>
          <G group="contact" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" name="email" type="email" defaultValue={s.email} error={e.email} />
            <Field label="Phone" name="phone" defaultValue={s.phone} />
            <Field label="WhatsApp number" name="whatsappNumber" defaultValue={s.whatsappNumber} placeholder="919876543210" hint="Country code + number, digits only. Leave blank to hide WhatsApp buttons." />
            <Field label="WhatsApp pre-filled message" name="whatsappMessage" defaultValue={s.whatsappMessage} />
          </div>
          <TextArea label="Address (optional)" name="address" rows={2} defaultValue={s.address} hint="Only add a business address you are happy to publish." />
          <Field label="Hours (optional)" name="hours" defaultValue={s.hours} placeholder="e.g. Mon–Sat, 10am–7pm" />
          <SubmitButton className="btn-sm">Save contact details</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function SocialForm({ s }: { s: Settings["social"] }) {
  return (
    <ActionForm action={saveSettingsGroup} className="space-y-4">
      <G group="social" />
      <div className="grid gap-4 sm:grid-cols-2">
        {(["instagram", "facebook", "pinterest", "x"] as const).map((k) => (
          <Field key={k} label={k === "x" ? "X (Twitter)" : k[0].toUpperCase() + k.slice(1)} name={k} defaultValue={s[k]} placeholder="https://…" />
        ))}
      </div>
      <SubmitButton className="btn-sm">Save social links</SubmitButton>
    </ActionForm>
  );
}

export function ShopSettingsForm({ s, razorpayConfigured, testMode }: { s: Settings["shop"]; razorpayConfigured: boolean; testMode: boolean }) {
  return (
    <ActionForm action={saveSettingsGroup} className="space-y-6">
      <G group="shop" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Checkbox name="enabled" label="Show the shop on the website" defaultChecked={s.enabled} />
        <Checkbox name="checkoutEnabled" label="Accept orders (enable checkout)" defaultChecked={s.checkoutEnabled} hint="Turn on only once products, prices, delivery areas and policies are final." />
      </div>
      <TextArea label="Notice shown while ordering is closed" name="notice" rows={2} defaultValue={s.notice} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Checkbox name="allowDelivery" label="Offer home delivery" defaultChecked={s.allowDelivery} hint="Only to the delivery areas below." />
        <Checkbox name="allowPickup" label="Offer pickup" defaultChecked={s.allowPickup} />
        <TextArea label="Pickup address" name="pickupAddress" rows={2} defaultValue={s.pickupAddress} />
        <TextArea label="Pickup instructions" name="pickupInstructions" rows={2} defaultValue={s.pickupInstructions} />
        <Field label="Preparation time" name="preparationTime" defaultValue={s.preparationTime} placeholder="e.g. 24–48 hours" />
        <Field label="Order cut-off" name="orderCutoff" defaultValue={s.orderCutoff} placeholder="e.g. 6 pm for next-day delivery" />
        <Field label="Minimum order for all orders (₹)" name="minOrder" inputMode="decimal" defaultValue={paiseToRupeesString(s.minOrderPaise)} />
      </div>
      <div id="payments" className="space-y-3 rounded-xl border border-line bg-cream/40 p-4">
        <p className="text-sm font-semibold text-ink">Payment methods</p>
        <Checkbox name="allowPayOnDelivery" label="Pay on delivery / pickup (cash or UPI)" defaultChecked={s.allowPayOnDelivery} />
        <Checkbox name="razorpayEnabled" label="Online payments via Razorpay" defaultChecked={s.razorpayEnabled}
          hint={razorpayConfigured ? `Razorpay keys detected (${testMode ? "TEST mode" : "LIVE mode"}).` : "Razorpay keys are not configured — online payments stay off until RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set."} />
      </div>
      <SubmitButton className="btn-sm">Save shop settings</SubmitButton>
    </ActionForm>
  );
}

// ───────── Pages ─────────
export function PageForm({ page }: { page: Page }) {
  return (
    <ActionForm action={savePage} className="space-y-4">
      {(e) => (
        <>
          <input type="hidden" name="slug" value={page.slug} />
          <Field label="Page title" name="title" required defaultValue={page.title} error={e.title} />
          <TextArea label="Content" name="body" rows={24} defaultValue={page.body} className="font-mono" hint="Formatting: ## Heading, ### Sub-heading, - bullet, 1. numbered, **bold**, *italic*, [link text](https://…). Leave a blank line between paragraphs." />
          <Checkbox name="needsReview" label="Show “needs review before launch” notice" defaultChecked={page.needsReview} hint="Untick once the content is final (and legally reviewed, for policies)." />
          <SubmitButton pendingLabel="Saving…">Save page</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

// ───────── Admins ─────────
export function CreateAdminForm() {
  return (
    <ActionForm action={createAdmin} className="grid gap-3 sm:grid-cols-3" resetOnSuccess>
      {(e) => (
        <>
          <Field label="Name" name="name" required error={e.name} />
          <Field label="Email" name="email" type="email" required error={e.email} />
          <Field label="Temporary password" name="password" type="password" autoComplete="new-password" required error={e.password} hint="12+ characters. Ask them to change it." />
          <div className="sm:col-span-3"><SubmitButton className="btn-sm" pendingLabel="Creating…">Add admin</SubmitButton></div>
        </>
      )}
    </ActionForm>
  );
}
