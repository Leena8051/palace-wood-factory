import { prisma } from "@/lib/db";

/**
 * Generate the next sequential code for an entity within the current year.
 * Format: PREFIX-YYYY-NNN  (e.g. CUS-2026-001, ORD-2026-0001)
 *
 * The number is derived by counting existing rows for the year. For high
 * concurrency we'd switch to a dedicated counters table — for a single-branch
 * factory this is fine.
 */
export async function generateCustomerCode(): Promise<string> {
  const year = new Date().getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const startOfNextYear = new Date(year + 1, 0, 1);

  const count = await prisma.customer.count({
    where: {
      createdAt: { gte: startOfYear, lt: startOfNextYear },
    },
  });

  const seq = String(count + 1).padStart(3, "0");
  return `CUS-${year}-${seq}`;
}

export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const startOfNextYear = new Date(year + 1, 0, 1);

  const count = await prisma.order.count({
    where: { createdAt: { gte: startOfYear, lt: startOfNextYear } },
  });
  return `ORD-${year}-${String(count + 1).padStart(4, "0")}`;
}
