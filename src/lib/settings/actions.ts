"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function saveSettings(
  data: Record<string, string>,
): Promise<ActionResult<void>> {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "OPERATIONS_MANAGER") {
    return { ok: false, error: "غير مصرح" };
  }

  try {
    await Promise.all(
      Object.entries(data).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value, category: "factory" },
        }),
      ),
    );
    revalidatePath("/settings", "page");
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("[saveSettings]", e);
    return { ok: false, error: "حدث خطأ أثناء الحفظ" };
  }
}
