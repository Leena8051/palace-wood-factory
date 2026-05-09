"use server";

import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { saveOrderFile, inferFileType } from "@/lib/storage";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session.user;
}

/**
 * Upload one or more files to an order via FormData.
 * Used by client form action.
 */
export async function uploadOrderFiles(
  orderId: string,
  formData: FormData,
): Promise<ActionResult<{ count: number }>> {
  const user = await requireSession();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  const explicitType = (formData.get("fileType") as string | null) ?? null;

  if (files.length === 0) return { ok: false, error: "لم يتم اختيار ملفات" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });
  if (!order) return { ok: false, error: "الطلب غير موجود" };

  let saved = 0;
  for (const f of files) {
    try {
      const { url, fileName } = await saveOrderFile(orderId, f);
      await prisma.orderFile.create({
        data: {
          orderId,
          url,
          fileType: explicitType ?? inferFileType(f.type),
          fileName,
          fileSize: f.size,
          mimeType: f.type,
          uploadedBy: user.id,
        },
      });
      saved++;
    } catch (e) {
      console.error("[uploadOrderFiles]", e);
    }
  }

  revalidatePath(`/orders/${orderId}`, "page");
  return { ok: true, data: { count: saved } };
}

export async function deleteOrderFile(
  fileId: string,
): Promise<ActionResult<{ id: string }>> {
  await requireSession();
  const file = await prisma.orderFile.findUnique({ where: { id: fileId } });
  if (!file) return { ok: false, error: "الملف غير موجود" };

  // Best-effort: delete from disk too
  try {
    const diskPath = path.join(process.cwd(), "public", file.url);
    await unlink(diskPath);
  } catch (e) {
    console.warn("[deleteOrderFile] disk unlink failed", e);
  }

  await prisma.orderFile.delete({ where: { id: fileId } });
  revalidatePath(`/orders/${file.orderId}`, "page");
  return { ok: true, data: { id: fileId } };
}
