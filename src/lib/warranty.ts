import { WARRANTY_DAYS } from "@/lib/constants";

export interface WarrantyStatus {
  /** Whether the order is still under warranty. */
  active: boolean;
  /** Days remaining (negative if expired). null if no delivery yet. */
  daysRemaining: number | null;
  /** ISO date string of when warranty expires. null if no delivery. */
  expiresAt: string | null;
  /** Reason: "ACTIVE" | "EXPIRED" | "NOT_DELIVERED" */
  reason: "ACTIVE" | "EXPIRED" | "NOT_DELIVERED";
}

/**
 * Determine warranty status for an order.
 * Warranty starts at actualDelivery and lasts WARRANTY_DAYS days.
 */
export function checkWarranty(
  actualDelivery: Date | null | undefined,
  now: Date = new Date(),
): WarrantyStatus {
  if (!actualDelivery) {
    return {
      active: false,
      daysRemaining: null,
      expiresAt: null,
      reason: "NOT_DELIVERED",
    };
  }
  const expires = new Date(actualDelivery);
  expires.setDate(expires.getDate() + WARRANTY_DAYS);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.ceil(
    (expires.getTime() - now.getTime()) / msPerDay,
  );
  return {
    active: daysRemaining > 0,
    daysRemaining,
    expiresAt: expires.toISOString(),
    reason: daysRemaining > 0 ? "ACTIVE" : "EXPIRED",
  };
}

/**
 * Suggest the maintenance type based on warranty status.
 * Active warranty → WARRANTY (free); else PAID.
 */
export function suggestMaintenanceType(
  status: WarrantyStatus,
): "WARRANTY" | "PAID" {
  return status.active ? "WARRANTY" : "PAID";
}
