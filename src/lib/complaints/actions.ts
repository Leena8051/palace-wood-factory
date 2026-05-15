"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateComplaintCode } from "@/lib/codes";
import {
  complaintInputSchema,
  complaintResolutionSchema,
  complaintResponseSchema,
  complaintStatusUpdateSchema,
  type ComplaintInput,
  type ComplaintResolutionInput,
  type ComplaintResponseInput,
} from "@/lib/validations/complaint";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session.user;
}

export async function createComplaint(
  raw: ComplaintInput,
): Promise<ActionResult<{ id: string; ticketNumber: string }>> {
  await requireSession();

  const parsed = complaintInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "بيانات غير صالحة",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const d = parsed.data;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: d.customerId },
      select: { id: true },
    });
    if (!customer) return { ok: false, error: "العميل غير موجود" };

    const ticketNumber = await generateComplaintCode();
    const created = await prisma.complaint.create({
      data: {
        ticketNumber,
        customerId: d.customerId,
        orderId: d.orderId || null,
        category: d.category,
        priority: d.priority,
        status: "OPEN",
        title: d.title,
        description: d.description,
      },
      select: { id: true, ticketNumber: true },
    });

    revalidatePath("/complaints", "page");
    revalidatePath(`/customers/${d.customerId}`, "page");
    return { ok: true, data: created };
  } catch (e) {
    console.error("[createComplaint]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

export async function updateComplaintStatus(
  id: string,
  status: string,
): Promise<ActionResult<{ id: string }>> {
  await requireSession();

  const parsed = complaintStatusUpdateSchema.safeParse({ status });
  if (!parsed.success) {
    return { ok: false, error: "حالة غير صالحة" };
  }

  try {
    await prisma.complaint.update({
      where: { id },
      data: {
        status: parsed.data.status,
        ...(parsed.data.status === "CLOSED" && { closedAt: new Date() }),
      },
    });
    revalidatePath("/complaints", "page");
    revalidatePath(`/complaints/${id}`, "page");
    return { ok: true, data: { id } };
  } catch (e) {
    console.error("[updateComplaintStatus]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

export async function addComplaintResponse(
  complaintId: string,
  raw: ComplaintResponseInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireSession();

  const parsed = complaintResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "بيانات غير صالحة",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    // Auto-bump status to IN_PROGRESS if it was OPEN
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      select: { status: true },
    });
    if (!complaint) return { ok: false, error: "الشكوى غير موجودة" };

    const created = await prisma.complaintResponse.create({
      data: {
        complaintId,
        authorId: user.id,
        message: parsed.data.message,
        isInternal: parsed.data.isInternal,
      },
      select: { id: true },
    });

    if (complaint.status === "OPEN") {
      await prisma.complaint.update({
        where: { id: complaintId },
        data: { status: "IN_PROGRESS" },
      });
    }

    revalidatePath(`/complaints/${complaintId}`, "page");
    revalidatePath("/complaints", "page");
    return { ok: true, data: created };
  } catch (e) {
    console.error("[addComplaintResponse]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

export async function resolveComplaint(
  id: string,
  raw: ComplaintResolutionInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireSession();

  const parsed = complaintResolutionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "بيانات غير صالحة",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await prisma.complaint.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolution: parsed.data.resolution,
        rating: parsed.data.rating ?? null,
        resolvedById: user.id,
        resolvedAt: new Date(),
      },
    });
    revalidatePath(`/complaints/${id}`, "page");
    revalidatePath("/complaints", "page");
    return { ok: true, data: { id } };
  } catch (e) {
    console.error("[resolveComplaint]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

export async function deleteComplaint(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  await requireSession();
  try {
    await prisma.complaint.delete({ where: { id } });
    revalidatePath("/complaints", "page");
    return { ok: true, data: { id } };
  } catch (e) {
    console.error("[deleteComplaint]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}
