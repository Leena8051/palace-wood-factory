"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateOrderNumber } from "@/lib/codes";
import { buildInitialStages } from "@/lib/orders/stages";
import {
  orderInputSchema,
  updateOrderSchema,
  type OrderInput,
  type UpdateOrderInput,
} from "@/lib/validations/order";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session.user;
}

export async function createOrder(
  raw: OrderInput,
): Promise<ActionResult<{ id: string; orderNumber: string }>> {
  const user = await requireSession();

  const parsed = orderInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "بيانات غير صالحة",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  // Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
    select: { id: true },
  });
  if (!customer) {
    return {
      ok: false,
      error: "العميل غير موجود",
      fieldErrors: { customerId: ["العميل غير موجود"] },
    };
  }

  try {
    const orderNumber = await generateOrderNumber();
    const created = await prisma.order.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        productCategory: data.productCategory,
        productType: data.productType,
        description: data.description,
        width: data.width,
        height: data.height,
        depth: data.depth,
        woodType: data.woodType || null,
        color: data.color || null,
        finishType: data.finishType || null,
        priority: data.priority,
        estimatedPrice: data.estimatedPrice,
        deposit: data.deposit,
        paidAmount: 0,
        notes: data.notes || null,
        estimatedDelivery: data.estimatedDelivery
          ? new Date(data.estimatedDelivery)
          : null,
        status: "DESIGN", // start at design stage
        currentStage: 1,
        createdById: user.id,
        stages: { create: buildInitialStages(user.id) },
      },
      select: { id: true, orderNumber: true },
    });

    // TODO Phase 4: dispatch WhatsApp notification to customer

    revalidatePath("/orders", "page");
    revalidatePath("/dashboard", "page");
    revalidatePath(`/customers/${data.customerId}`, "page");

    return { ok: true, data: created };
  } catch (e) {
    console.error("[createOrder]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

export async function updateOrder(
  id: string,
  raw: UpdateOrderInput,
): Promise<ActionResult<{ id: string }>> {
  await requireSession();

  const parsed = updateOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "بيانات غير صالحة",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const d = parsed.data;
  try {
    await prisma.order.update({
      where: { id },
      data: {
        productCategory: d.productCategory,
        productType: d.productType,
        description: d.description,
        width: d.width,
        height: d.height,
        depth: d.depth,
        woodType: d.woodType ?? undefined,
        color: d.color ?? undefined,
        finishType: d.finishType ?? undefined,
        priority: d.priority,
        estimatedPrice: d.estimatedPrice,
        finalPrice: d.finalPrice,
        deposit: d.deposit,
        notes: d.notes ?? undefined,
        estimatedDelivery: d.estimatedDelivery
          ? new Date(d.estimatedDelivery)
          : undefined,
      },
    });
    revalidatePath("/orders", "page");
    revalidatePath(`/orders/${id}`, "page");
    return { ok: true, data: { id } };
  } catch (e) {
    console.error("[updateOrder]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

export async function cancelOrder(
  id: string,
  reason?: string,
): Promise<ActionResult<{ id: string }>> {
  await requireSession();
  try {
    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: {
          status: "CANCELLED",
          notes: reason
            ? `[إلغاء] ${reason}`
            : undefined,
        },
      }),
      prisma.orderStage.updateMany({
        where: { orderId: id, status: { in: ["PENDING", "IN_PROGRESS"] } },
        data: { status: "BLOCKED" },
      }),
    ]);
    revalidatePath("/orders", "page");
    revalidatePath(`/orders/${id}`, "page");
    return { ok: true, data: { id } };
  } catch (e) {
    console.error("[cancelOrder]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

/** Search customers for the picker. Returns up to 10 matches. */
export async function searchCustomers(query: string) {
  await requireSession();
  const term = query.trim();
  if (term.length < 2) return [];
  return prisma.customer.findMany({
    where: {
      OR: [
        { fullName: { contains: term } },
        { phone: { contains: term.replace(/\D/g, "") } },
        { customerCode: { contains: term } },
      ],
    },
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      phone: true,
      city: true,
      customerCode: true,
      isVip: true,
    },
  });
}
