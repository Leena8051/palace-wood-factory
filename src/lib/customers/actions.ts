"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateCustomerCode } from "@/lib/codes";
import { normalizeSaudiPhone } from "@/lib/utils";
import {
  customerInputSchema,
  customerNormalizedSchema,
  type CustomerInput,
} from "@/lib/validations/customer";
import { Prisma } from "@/generated/prisma/client";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session.user;
}

function emptyToNull<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const k of Object.keys(out)) {
    if (out[k] === "") (out as Record<string, unknown>)[k] = null;
  }
  return out;
}

export async function createCustomer(
  raw: CustomerInput,
): Promise<ActionResult<{ id: string; customerCode: string }>> {
  await requireSession();

  // Phase 1: shape validation
  const parsed = customerInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "بيانات غير صالحة",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Phase 2: normalize phone, then validate format
  const normalized = {
    ...parsed.data,
    phone: normalizeSaudiPhone(parsed.data.phone),
    whatsapp: parsed.data.whatsapp
      ? normalizeSaudiPhone(parsed.data.whatsapp)
      : "",
  };

  const fullCheck = customerNormalizedSchema.safeParse(normalized);
  if (!fullCheck.success) {
    return {
      ok: false,
      error: "رقم الجوال غير صحيح",
      fieldErrors: fullCheck.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const customerCode = await generateCustomerCode();
    const data = emptyToNull(normalized);
    const created = await prisma.customer.create({
      data: {
        customerCode,
        fullName: data.fullName,
        phone: data.phone,
        whatsapp: (data.whatsapp as string | null) ?? null,
        email: (data.email as string | null) ?? null,
        city: data.city,
        district: (data.district as string | null) ?? null,
        address: (data.address as string | null) ?? null,
        customerType: data.customerType,
        companyName: (data.companyName as string | null) ?? null,
        notes: (data.notes as string | null) ?? null,
        source: data.source,
        isVip: data.isVip,
      },
      select: { id: true, customerCode: true },
    });

    revalidatePath("/customers", "page");
    return { ok: true, data: created };
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        ok: false,
        error: "رقم الجوال مسجل لعميل آخر",
        fieldErrors: { phone: ["رقم الجوال مسجل لعميل آخر"] },
      };
    }
    console.error("[createCustomer]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

export async function updateCustomer(
  id: string,
  raw: CustomerInput,
): Promise<ActionResult<{ id: string }>> {
  await requireSession();

  const parsed = customerInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "بيانات غير صالحة",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const normalized = {
    ...parsed.data,
    phone: normalizeSaudiPhone(parsed.data.phone),
    whatsapp: parsed.data.whatsapp
      ? normalizeSaudiPhone(parsed.data.whatsapp)
      : "",
  };

  const fullCheck = customerNormalizedSchema.safeParse(normalized);
  if (!fullCheck.success) {
    return {
      ok: false,
      error: "رقم الجوال غير صحيح",
      fieldErrors: fullCheck.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const data = emptyToNull(normalized);
    await prisma.customer.update({
      where: { id },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        whatsapp: (data.whatsapp as string | null) ?? null,
        email: (data.email as string | null) ?? null,
        city: data.city,
        district: (data.district as string | null) ?? null,
        address: (data.address as string | null) ?? null,
        customerType: data.customerType,
        companyName: (data.companyName as string | null) ?? null,
        notes: (data.notes as string | null) ?? null,
        source: data.source,
        isVip: data.isVip,
      },
    });
    revalidatePath("/customers", "page");
    revalidatePath(`/customers/${id}`, "page");
    return { ok: true, data: { id } };
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        ok: false,
        error: "رقم الجوال مسجل لعميل آخر",
        fieldErrors: { phone: ["رقم الجوال مسجل لعميل آخر"] },
      };
    }
    console.error("[updateCustomer]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

export async function deleteCustomer(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  await requireSession();

  // Refuse delete if customer has orders
  const orderCount = await prisma.order.count({ where: { customerId: id } });
  if (orderCount > 0) {
    return {
      ok: false,
      error: "لا يمكن حذف عميل لديه طلبات. عطّله بدلاً من ذلك.",
    };
  }

  try {
    await prisma.customer.delete({ where: { id } });
    revalidatePath("/customers", "page");
    return { ok: true, data: { id } };
  } catch (e) {
    console.error("[deleteCustomer]", e);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

export async function toggleVip(
  id: string,
  isVip: boolean,
): Promise<ActionResult<{ id: string }>> {
  await requireSession();
  await prisma.customer.update({ where: { id }, data: { isVip } });
  revalidatePath("/customers", "page");
  revalidatePath(`/customers/${id}`, "page");
  return { ok: true, data: { id } };
}
