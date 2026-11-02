"use server";

import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { restockOrder } from "@/lib/orders";
import { str } from "../../form";
import type { ActionState } from "../../action-state";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "READY_FOR_PICKUP", "DELIVERED", "CANCELLED"];
const PAY: PaymentStatus[] = ["UNPAID", "PENDING", "PAID", "FAILED", "REFUNDED"];

export async function updateOrder(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(f, "id");
  const status = str(f, "status") as OrderStatus;
  const paymentStatus = str(f, "paymentStatus") as PaymentStatus;
  const note = str(f, "note", 500) || null;
  if (!STATUSES.includes(status) || !PAY.includes(paymentStatus)) return { ok: false, message: "Invalid status." };
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return { ok: false, message: "Order not found." };
  if (order.status === "CANCELLED" && status !== "CANCELLED") return { ok: false, message: "Cancelled orders cannot be reopened. Ask the customer to place a new order." };

  const cancelling = status === "CANCELLED" && order.status !== "CANCELLED";
  if (cancelling && !note) return { ok: false, message: "Please add a note explaining the cancellation.", errors: { note: "Required when cancelling." } };

  await prisma.order.update({
    where: { id },
    data: {
      status,
      paymentStatus,
      cancelReason: cancelling ? note : undefined,
      events:
        status !== order.status || note || paymentStatus !== order.paymentStatus
          ? {
              create: {
                status,
                note: [note, paymentStatus !== order.paymentStatus ? `Payment: ${paymentStatus.toLowerCase()}` : null].filter(Boolean).join(" · ") || null,
              },
            }
          : undefined,
    },
  });
  if (cancelling) await restockOrder(id);
  return { ok: true, message: cancelling ? "Order cancelled and stock returned." : "Order updated." };
}
