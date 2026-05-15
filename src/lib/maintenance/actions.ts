"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateMaintenanceCode } from "@/lib/codes";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";
import {
  maintenanceInputSchema,
  maintenanceCompleteSchema,
  maintenanceScheduleSchema,
  type MaintenanceInput,
  type MaintenanceCompleteInput,
  type MaintenanceScheduleInput,
} from "@/lib/validations/maintenance";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session.user;
}

export async function createMaintenanceRequest(
  raw: MaintenanceInput,
): Promise<ActionResult<{ id: string; requestNumber: string }>> {
  await requireSession();

  const parsed = maintenanceInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "بيانات غير صالحة",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const d = parsed.data;

  try {
    const requestNumber = await generateMaintenanceCode();
    const created = await prisma.maintenanceRequest.create({
      data: {
        requestNumber,
        customerId: d.customerId,
        originalOrderId: d.originalOrderId || null,
        type: d.type,
        description: d.description,
        reportedIssue: d.reportedIssue,
        scheduledDate: d.scheduledDate ? new Date(d.scheduledDate) : null,
        technicianId: d.technicianId || null,
        estimatedCost: d.estimatedCost ?? null,
        status: d.scheduledDate ? "SCHEDULED" : "REQUESTED",
      },
      select: { id: true, requestNumber: true },
    });

    revalidatePath("/maintenance", "page");
    revalidatePath(`/customers/${d.customerId}`, "page");
    return { ok: true, data: created };
  } catch (e) {
    console.error("[createMaintenanceRequest]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

export async function scheduleMaintenance(
  id: string,
  raw: MaintenanceScheduleInput,
): Promise<ActionResult<{ id: string }>> {
  await requireSession();
  const parsed = maintenanceScheduleSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "بيانات غير صالحة",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        scheduledDate: new Date(parsed.data.scheduledDate),
        technicianId: parsed.data.technicianId,
        status: "SCHEDULED",
      },
    });
    revalidatePath(`/maintenance/${id}`, "page");
    revalidatePath("/maintenance", "page");
    return { ok: true, data: { id } };
  } catch (e) {
    console.error("[scheduleMaintenance]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

export async function startMaintenance(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  await requireSession();
  try {
    await prisma.maintenanceRequest.update({
      where: { id },
      data: { status: "IN_PROGRESS" },
    });
    revalidatePath(`/maintenance/${id}`, "page");
    revalidatePath("/maintenance", "page");
    return { ok: true, data: { id } };
  } catch (e) {
    console.error("[startMaintenance]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

export async function completeMaintenance(
  id: string,
  raw: MaintenanceCompleteInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireSession();
  const parsed = maintenanceCompleteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "بيانات غير صالحة",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!request) return { ok: false, error: "طلب الصيانة غير موجود" };

    await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedDate: new Date(),
        finalCost: parsed.data.finalCost ?? null,
        customerSignature: parsed.data.customerSignature,
        notes: parsed.data.notes || null,
      },
    });

    sendWhatsApp({
      to: request.customer.whatsapp ?? request.customer.phone,
      message: `تمت صيانة طلبك ${request.requestNumber} بنجاح ✅\nنتمنى لك تجربة ممتازة معنا.\n— مصنع أخشاب القصور`,
      notifyUserIds: [user.id],
      link: `/maintenance/${id}`,
      type: "MAINTENANCE_COMPLETED",
      title: `Maintenance ${request.requestNumber} completed`,
    }).catch((e) => console.error("[maintenance complete notify]", e));

    revalidatePath(`/maintenance/${id}`, "page");
    revalidatePath("/maintenance", "page");
    return { ok: true, data: { id } };
  } catch (e) {
    console.error("[completeMaintenance]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

export async function cancelMaintenance(
  id: string,
  reason?: string,
): Promise<ActionResult<{ id: string }>> {
  await requireSession();
  try {
    await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: "CANCELLED",
        notes: reason ? `[إلغاء] ${reason}` : undefined,
      },
    });
    revalidatePath(`/maintenance/${id}`, "page");
    revalidatePath("/maintenance", "page");
    return { ok: true, data: { id } };
  } catch (e) {
    console.error("[cancelMaintenance]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

/** Search delivered orders for the maintenance form's "linked order" picker. */
export async function searchDeliveredOrders(customerId: string, query: string) {
  await requireSession();
  return prisma.order.findMany({
    where: {
      customerId,
      OR: [
        { orderNumber: { contains: query } },
        { productType: { contains: query } },
      ],
    },
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      productType: true,
      status: true,
      actualDelivery: true,
    },
  });
}

/** Pull the list of technicians (users with TECHNICIAN role). */
export async function listTechnicians() {
  await requireSession();
  return prisma.user.findMany({
    where: { role: "TECHNICIAN", isActive: true },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
  });
}
