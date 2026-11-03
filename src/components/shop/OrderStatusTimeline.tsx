import { Check } from "lucide-react";
import { ORDER_STATUS_LABEL } from "@/lib/site";
import { cn } from "@/lib/utils";

type Status = keyof typeof ORDER_STATUS_LABEL;

export function OrderStatusTimeline({ status, fulfillment }: { status: Status; fulfillment: "DELIVERY" | "PICKUP" }) {
  if (status === "CANCELLED")
    return <p className="rounded-xl bg-nonveg/10 px-4 py-3 font-medium text-nonveg">This order has been cancelled.</p>;
  const flow: Status[] = ["PENDING", "CONFIRMED", "PREPARING", fulfillment === "PICKUP" ? "READY_FOR_PICKUP" : "OUT_FOR_DELIVERY", "DELIVERED"];
  const current = flow.indexOf(status);
  return (
    <ol className="grid grid-cols-5 gap-2" aria-label="Order progress">
      {flow.map((s, i) => (
        <li key={s} className="flex flex-col items-center text-center" aria-current={i === current ? "step" : undefined}>
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold", i <= current ? "border-ink bg-ink text-ivory" : "border-beige bg-card text-muted")}>
            {i < current ? <Check className="h-4 w-4" /> : i + 1}
          </span>
          <span className={cn("mt-2 text-[11px] leading-tight sm:text-xs", i <= current ? "font-semibold text-ink" : "text-muted")}>{ORDER_STATUS_LABEL[s]}</span>
        </li>
      ))}
    </ol>
  );
}
