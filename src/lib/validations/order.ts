import { z } from "zod";
import { PRIORITIES, PRODUCT_CATEGORIES } from "@/lib/constants";

/**
 * Master input schema for the create-order wizard.
 * Each step is also a partial schema for per-step validation in the UI.
 */
export const orderInputSchema = z.object({
  // Step 1 — customer
  customerId: z.string().min(1, "اختر عميلاً"),

  // Step 2 — product
  productCategory: z.enum(PRODUCT_CATEGORIES),
  productType: z.string().trim().min(2, "نوع المنتج مطلوب"),
  description: z
    .string()
    .trim()
    .min(5, "الوصف قصير جداً (5 أحرف على الأقل)")
    .max(2000, "الوصف طويل جداً"),

  // Step 3 — specs (all optional but cleaner if filled)
  width: z.coerce.number().positive("القيمة يجب أن تكون موجبة").optional().or(z.nan().transform(() => undefined)),
  height: z.coerce.number().positive().optional().or(z.nan().transform(() => undefined)),
  depth: z.coerce.number().positive().optional().or(z.nan().transform(() => undefined)),
  woodType: z.string().trim().optional().or(z.literal("")),
  color: z.string().trim().optional().or(z.literal("")),
  finishType: z.string().trim().optional().or(z.literal("")),

  // Step 4 — pricing
  estimatedPrice: z.coerce.number().positive("السعر يجب أن يكون أكبر من صفر"),
  deposit: z.coerce.number().min(0).optional().or(z.nan().transform(() => undefined)),
  priority: z.enum(PRIORITIES).default("NORMAL"),
  estimatedDelivery: z.string().trim().optional().or(z.literal("")),

  // Step 5 — review (notes only)
  notes: z.string().trim().optional().or(z.literal("")),
});

export type OrderInput = z.input<typeof orderInputSchema>;
export type OrderParsed = z.output<typeof orderInputSchema>;

// Per-step partials for in-wizard validation
export const orderStep1 = orderInputSchema.pick({ customerId: true });
export const orderStep2 = orderInputSchema.pick({
  productCategory: true,
  productType: true,
  description: true,
});
export const orderStep3 = orderInputSchema.pick({
  width: true,
  height: true,
  depth: true,
  woodType: true,
  color: true,
  finishType: true,
});
export const orderStep4 = orderInputSchema.pick({
  estimatedPrice: true,
  deposit: true,
  priority: true,
  estimatedDelivery: true,
});

export const updateOrderSchema = orderInputSchema.partial().extend({
  finalPrice: z.coerce.number().positive().optional(),
});
export type UpdateOrderInput = z.input<typeof updateOrderSchema>;
