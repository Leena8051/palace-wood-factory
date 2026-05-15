import { z } from "zod";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
  PRIORITIES,
} from "@/lib/constants";

export const complaintInputSchema = z.object({
  customerId: z.string().min(1, "اختر عميلاً"),
  orderId: z.string().optional().or(z.literal("")),
  category: z.enum(COMPLAINT_CATEGORIES),
  priority: z.enum(PRIORITIES).default("NORMAL"),
  title: z.string().trim().min(3, "العنوان قصير جداً").max(150),
  description: z.string().trim().min(10, "الوصف قصير جداً").max(2000),
});

export type ComplaintInput = z.input<typeof complaintInputSchema>;

export const complaintResponseSchema = z.object({
  message: z.string().trim().min(1, "الرسالة فارغة").max(2000),
  isInternal: z.boolean().default(false),
});
export type ComplaintResponseInput = z.input<typeof complaintResponseSchema>;

export const complaintResolutionSchema = z.object({
  resolution: z.string().trim().min(5, "اكتب الحل بالتفصيل").max(2000),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});
export type ComplaintResolutionInput = z.input<typeof complaintResolutionSchema>;

export const complaintStatusUpdateSchema = z.object({
  status: z.enum(COMPLAINT_STATUSES),
});
