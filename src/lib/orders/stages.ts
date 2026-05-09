import { ORDER_STAGES } from "@/lib/constants";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Build the 5 default OrderStage rows for a freshly-created order.
 * Stage 1 starts in IN_PROGRESS, the others remain PENDING.
 */
export function buildInitialStages(
  userId: string,
): Prisma.OrderStageCreateWithoutOrderInput[] {
  return ORDER_STAGES.map((s) => ({
    stageNumber: s.number,
    stageName: s.name,
    status: s.number === 1 ? "IN_PROGRESS" : "PENDING",
    startedAt: s.number === 1 ? new Date() : null,
    updatedById: userId,
  }));
}
