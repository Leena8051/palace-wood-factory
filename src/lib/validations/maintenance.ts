import { z } from "zod";
import { MAINTENANCE_TYPES } from "@/lib/constants";

export const maintenanceInputSchema = z.object({
  customerId: z.string().min(1, "اختر عميلاً"),
  originalOrderId: z.string().optional().or(z.literal("")),
  type: z.enum(MAINTENANCE_TYPES),
  description: z.string().trim().min(5, "الوصف قصير جداً").max(2000),
  reportedIssue: z.string().trim().min(5, "وصف المشكلة قصير جداً").max(1000),
  scheduledDate: z.string().trim().optional().or(z.literal("")),
  technicianId: z.string().optional().or(z.literal("")),
  estimatedCost: z.coerce.number().min(0).optional().or(z.nan().transform(() => undefined)),
});
export type MaintenanceInput = z.input<typeof maintenanceInputSchema>;

export const maintenanceCompleteSchema = z.object({
  finalCost: z.coerce.number().min(0).optional().or(z.nan().transform(() => undefined)),
  customerSignature: z.string().min(20, "توقيع العميل مطلوب"),
  notes: z.string().trim().optional().or(z.literal("")),
});
export type MaintenanceCompleteInput = z.input<typeof maintenanceCompleteSchema>;

export const maintenanceScheduleSchema = z.object({
  scheduledDate: z.string().trim().min(1, "حدّد التاريخ"),
  technicianId: z.string().min(1, "اختر فنياً"),
});
export type MaintenanceScheduleInput = z.input<typeof maintenanceScheduleSchema>;
