"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors, type ActionState } from "../action-state";

export async function trackOrder(_: ActionState, form: FormData): Promise<ActionState> {
  if (!(await rateLimit("track", 10, 900))) return { ok: false, message: "Too many attempts. Please try again in 15 minutes." };
  const parsed = z
    .object({
      orderNumber: z.string().trim().toUpperCase().min(5, "Enter your order number.").max(30),
      email: z.string().trim().toLowerCase().email("Enter the email used for the order."),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return fieldErrors(parsed.error);
  const order = await prisma.order.findUnique({ where: { orderNumber: parsed.data.orderNumber } });
  if (!order || order.email !== parsed.data.email) return { ok: false, message: "We couldn’t find an order with those details." };
  redirect(`/orders/${order.orderNumber}?token=${order.accessToken}`);
}
