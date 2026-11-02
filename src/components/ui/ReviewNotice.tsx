import { AlertTriangle } from "lucide-react";

export function ReviewNotice({ kind = "legal" }: { kind?: "legal" | "content" }) {
  return (
    <div role="note" className="mb-10 flex gap-3 rounded-2xl border border-gold/50 bg-gold/10 px-5 py-4 text-sm text-cocoa">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" aria-hidden />
      <p>
        {kind === "legal"
          ? "Template — this page must be completed with business details and reviewed by a qualified professional before launch. Items in [square brackets] are placeholders."
          : "Placeholder content — items in [square brackets] will be replaced with the brand’s own story."}
      </p>
    </div>
  );
}
