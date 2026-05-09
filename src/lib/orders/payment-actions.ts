"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { sendWhatsApp, whatsappTemplates } from "@/lib/notifications/whatsapp";
import {
  paymentInputSchema,
  type PaymentInput,
} from "@/lib/validations/payment";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session.user;
}

async function generatePaymentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const startOfNextYear = new Date(year + 1, 0, 1);
  const count = await prisma.payment.count({
    where: { paidAt: { gte: startOfYear, lt: startOfNextYear } },
  });
  return `PAY-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function recordPayment(
  orderId: string,
  raw: PaymentInput,
): Promise<ActionResult<{ paymentId: string; paymentNumber: string }>> {
  const user = await requireSession();

  const parsed = paymentInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "بيانات غير صالحة",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const data = parsed.data;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order) return { ok: false, error: "الطلب غير موجود" };

    const paymentNumber = await generatePaymentNumber();

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          paymentNumber,
          orderId,
          amount: data.amount,
          type: data.type,
          method: data.method,
          notes: data.notes || null,
          receivedById: user.id,
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { paidAmount: { increment: data.amount } },
      }),
    ]);

    sendWhatsApp({
      to: order.customer.whatsapp ?? order.customer.phone,
      message: whatsappTemplates.paymentReceived(order.orderNumber, data.amount),
      notifyUserIds: [user.id],
      link: `/orders/${orderId}`,
      type: "PAYMENT_RECEIVED",
      title: `Payment ${paymentNumber}`,
    }).catch((e) => console.error("[payment notify]", e));

    revalidatePath(`/orders/${orderId}`, "page");
    revalidatePath("/payments", "page");
    revalidatePath("/dashboard", "page");
    return {
      ok: true,
      data: { paymentId: payment.id, paymentNumber: payment.paymentNumber },
    };
  } catch (e) {
    console.error("[recordPayment]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}
