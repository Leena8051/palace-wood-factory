import { z } from "zod";

export const PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "CARD",
  "CHECK",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_TYPES = ["DEPOSIT", "INSTALLMENT", "FINAL"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const paymentInputSchema = z.object({
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  type: z.enum(PAYMENT_TYPES).default("INSTALLMENT"),
  method: z.enum(PAYMENT_METHODS).default("CASH"),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type PaymentInput = z.input<typeof paymentInputSchema>;
