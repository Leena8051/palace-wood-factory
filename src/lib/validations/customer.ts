import { z } from "zod";
import { CUSTOMER_SOURCES, CUSTOMER_TYPES } from "@/lib/constants";

/** Saudi mobile pattern after normalization to +9665XXXXXXXX. */
const phoneRegex = /^\+9665\d{8}$/;

export const customerInputSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "الاسم قصير جداً")
      .max(120, "الاسم طويل جداً"),
    phone: z.string().trim().min(9, "رقم الجوال غير صالح"),
    whatsapp: z.string().trim().optional().or(z.literal("")),
    email: z
      .union([z.string().email("بريد إلكتروني غير صالح"), z.literal("")])
      .optional(),
    city: z.string().trim().min(2, "المدينة مطلوبة"),
    district: z.string().trim().optional().or(z.literal("")),
    address: z.string().trim().optional().or(z.literal("")),
    customerType: z.enum(CUSTOMER_TYPES).default("INDIVIDUAL"),
    companyName: z.string().trim().optional().or(z.literal("")),
    notes: z.string().trim().optional().or(z.literal("")),
    source: z.enum(CUSTOMER_SOURCES).default("WALK_IN"),
    isVip: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.customerType === "COMPANY" && !data.companyName) {
      ctx.addIssue({
        code: "custom",
        path: ["companyName"],
        message: "اسم الشركة مطلوب لعميل من نوع شركة",
      });
    }
  });

/** Schema applied AFTER server-side phone normalization. */
export const customerNormalizedSchema = customerInputSchema.and(
  z.object({
    phone: z.string().regex(phoneRegex, "رقم جوال سعودي غير صحيح"),
  }),
);

/** Input shape (with optional fields & defaults) — used in forms. */
export type CustomerInput = z.input<typeof customerInputSchema>;
/** Output shape (after defaults applied) — used after parse(). */
export type CustomerParsed = z.output<typeof customerInputSchema>;
