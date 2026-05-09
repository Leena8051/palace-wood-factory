"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { sendWhatsApp, whatsappTemplates } from "@/lib/notifications/whatsapp";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session.user;
}

const STAGE_TO_STATUS: Record<number, string> = {
  1: "DESIGN",
  2: "APPROVED",
  3: "PRODUCTION",
  4: "FINISHING",
  5: "READY",
};

/**
 * Mark a stage as IN_PROGRESS, setting startedAt.
 * Updates parent order.currentStage and order.status accordingly.
 */
export async function startStage(
  orderId: string,
  stageNumber: number,
): Promise<ActionResult<{ orderId: string }>> {
  const user = await requireSession();
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order) return { ok: false, error: "الطلب غير موجود" };
    if (order.status === "CANCELLED") {
      return { ok: false, error: "لا يمكن تعديل طلب ملغي" };
    }

    const stage = await prisma.orderStage.findUnique({
      where: { orderId_stageNumber: { orderId, stageNumber } },
    });
    if (!stage) return { ok: false, error: "المرحلة غير موجودة" };
    if (stage.status === "IN_PROGRESS") {
      return { ok: false, error: "المرحلة قيد التنفيذ بالفعل" };
    }

    await prisma.$transaction([
      prisma.orderStage.update({
        where: { orderId_stageNumber: { orderId, stageNumber } },
        data: {
          status: "IN_PROGRESS",
          startedAt: stage.startedAt ?? new Date(),
          updatedById: user.id,
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: {
          currentStage: stageNumber,
          status: STAGE_TO_STATUS[stageNumber] ?? order.status,
        },
      }),
    ]);

    // Notify customer (mock)
    const stageNames: Record<string, string> = {
      DESIGN: "التصميم",
      CUTTING: "القص والتشكيل",
      ASSEMBLY: "التجميع",
      FINISHING: "التشطيب والدهان",
      DELIVERY: "التسليم والتركيب",
    };
    sendWhatsApp({
      to: order.customer.whatsapp ?? order.customer.phone,
      message: whatsappTemplates.stageStarted(
        order.orderNumber,
        stageNames[stage.stageName] ?? stage.stageName,
      ),
      notifyUserIds: [user.id],
      link: `/orders/${orderId}`,
      type: "ORDER_STAGE_STARTED",
      title: `Stage started — ${order.orderNumber}`,
    }).catch((e) => console.error("[stageStarted notify]", e));

    revalidatePath(`/orders/${orderId}`, "page");
    revalidatePath("/orders", "page");
    revalidatePath("/dashboard", "page");
    return { ok: true, data: { orderId } };
  } catch (e) {
    console.error("[startStage]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

/**
 * Mark stage as COMPLETED, setting completedAt + duration.
 * If next stage exists, set parent order.currentStage to next.
 * If this is stage 5, set order.status=READY (or DELIVERED if explicitly chosen).
 */
export async function completeStage(
  orderId: string,
  stageNumber: number,
  notes?: string,
): Promise<ActionResult<{ orderId: string }>> {
  const user = await requireSession();
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, stages: true },
    });
    if (!order) return { ok: false, error: "الطلب غير موجود" };
    if (order.status === "CANCELLED") {
      return { ok: false, error: "لا يمكن تعديل طلب ملغي" };
    }

    const stage = order.stages.find((s) => s.stageNumber === stageNumber);
    if (!stage) return { ok: false, error: "المرحلة غير موجودة" };
    if (stage.status === "COMPLETED") {
      return { ok: false, error: "المرحلة مكتملة بالفعل" };
    }

    const now = new Date();
    const startedAt = stage.startedAt ?? now;
    const durationMin = Math.max(
      1,
      Math.round((now.getTime() - startedAt.getTime()) / 60000),
    );

    const stageUpdate = prisma.orderStage.update({
      where: { orderId_stageNumber: { orderId, stageNumber } },
      data: {
        status: "COMPLETED",
        startedAt,
        completedAt: now,
        durationMin,
        notes: notes ?? stage.notes ?? null,
        updatedById: user.id,
      },
    });

    // Auto-advance order pointer
    const orderUpdate =
      stageNumber < 5
        ? prisma.order.update({
            where: { id: orderId },
            data: {
              currentStage: stageNumber + 1,
              status: STAGE_TO_STATUS[stageNumber + 1] ?? order.status,
            },
          })
        : prisma.order.update({
            where: { id: orderId },
            data: { status: "READY", currentStage: 5 },
          });

    await prisma.$transaction([stageUpdate, orderUpdate]);

    // Notify
    const stageNames: Record<string, string> = {
      DESIGN: "التصميم",
      CUTTING: "القص والتشكيل",
      ASSEMBLY: "التجميع",
      FINISHING: "التشطيب والدهان",
      DELIVERY: "التسليم والتركيب",
    };
    sendWhatsApp({
      to: order.customer.whatsapp ?? order.customer.phone,
      message: whatsappTemplates.stageCompleted(
        order.orderNumber,
        stageNames[stage.stageName] ?? stage.stageName,
      ),
      notifyUserIds: [user.id],
      link: `/orders/${orderId}`,
      type: "ORDER_STAGE_COMPLETED",
      title: `Stage completed — ${order.orderNumber}`,
    }).catch((e) => console.error("[stageCompleted notify]", e));

    if (stageNumber === 5) {
      sendWhatsApp({
        to: order.customer.whatsapp ?? order.customer.phone,
        message: whatsappTemplates.orderReady(order.orderNumber),
        notifyUserIds: [user.id],
        link: `/orders/${orderId}`,
        type: "ORDER_READY",
        title: `Order READY — ${order.orderNumber}`,
      }).catch((e) => console.error("[orderReady notify]", e));
    }

    revalidatePath(`/orders/${orderId}`, "page");
    revalidatePath("/orders", "page");
    revalidatePath("/dashboard", "page");
    return { ok: true, data: { orderId } };
  } catch (e) {
    console.error("[completeStage]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

/** Mark a stage as BLOCKED (manual hold). */
export async function blockStage(
  orderId: string,
  stageNumber: number,
  reason: string,
): Promise<ActionResult<{ orderId: string }>> {
  const user = await requireSession();
  try {
    await prisma.orderStage.update({
      where: { orderId_stageNumber: { orderId, stageNumber } },
      data: {
        status: "BLOCKED",
        notes: reason,
        updatedById: user.id,
      },
    });
    revalidatePath(`/orders/${orderId}`, "page");
    return { ok: true, data: { orderId } };
  } catch (e) {
    console.error("[blockStage]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

/** Mark order as DELIVERED (only allowed when stage 5 completed). */
export async function markDelivered(
  orderId: string,
): Promise<ActionResult<{ orderId: string }>> {
  const user = await requireSession();
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { stages: true, customer: true },
    });
    if (!order) return { ok: false, error: "الطلب غير موجود" };
    const stage5 = order.stages.find((s) => s.stageNumber === 5);
    if (stage5?.status !== "COMPLETED") {
      return {
        ok: false,
        error: "لا يمكن وضع الطلب كمسلَّم قبل اكتمال مرحلة التسليم",
      };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "DELIVERED", actualDelivery: new Date() },
    });

    sendWhatsApp({
      to: order.customer.whatsapp ?? order.customer.phone,
      message: `شكراً لك! تم تسليم طلبك ${order.orderNumber} بنجاح. نرجو تقييم تجربتك معنا.\n— مصنع أخشاب القصور`,
      notifyUserIds: [user.id],
      link: `/orders/${orderId}`,
      type: "ORDER_DELIVERED",
      title: `Delivered — ${order.orderNumber}`,
    }).catch((e) => console.error("[delivered notify]", e));

    revalidatePath(`/orders/${orderId}`, "page");
    revalidatePath("/orders", "page");
    return { ok: true, data: { orderId } };
  } catch (e) {
    console.error("[markDelivered]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}
