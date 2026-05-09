/**
 * Domain enums (mirrored as strings in Prisma since SQLite has no native enum).
 * Use these for type safety + Zod validation.
 */

export const CUSTOMER_TYPES = ["INDIVIDUAL", "COMPANY"] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const CUSTOMER_SOURCES = [
  "INSTAGRAM",
  "WHATSAPP",
  "REFERRAL",
  "WALK_IN",
  "GOOGLE",
  "OTHER",
] as const;
export type CustomerSource = (typeof CUSTOMER_SOURCES)[number];

export const USER_ROLES = [
  "ADMIN",
  "OPERATIONS_MANAGER",
  "CUSTOMER_SERVICE",
  "DESIGNER",
  "PRODUCTION_SUPERVISOR",
  "WAREHOUSE_KEEPER",
  "TECHNICIAN",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ORDER_STATUSES = [
  "NEW",
  "DESIGN",
  "APPROVED",
  "PRODUCTION",
  "FINISHING",
  "READY",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRODUCT_CATEGORIES = [
  "DOORS",
  "FURNITURE",
  "INTERIOR_DECOR",
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const STAGE_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "BLOCKED",
] as const;
export type StageStatus = (typeof STAGE_STATUSES)[number];

/** The 5 stages every order goes through, in order. */
export const ORDER_STAGES = [
  { number: 1, name: "DESIGN" },
  { number: 2, name: "CUTTING" },
  { number: 3, name: "ASSEMBLY" },
  { number: 4, name: "FINISHING" },
  { number: 5, name: "DELIVERY" },
] as const;
export type OrderStageName = (typeof ORDER_STAGES)[number]["name"];

/** Maps order status -> the stage number it currently sits at. */
export const STATUS_TO_STAGE: Record<OrderStatus, number> = {
  NEW: 1,
  DESIGN: 1,
  APPROVED: 2,
  PRODUCTION: 3,
  FINISHING: 4,
  READY: 5,
  DELIVERED: 5,
  CANCELLED: 0,
};

/** Common wood materials used in the factory. */
export const WOOD_TYPES = [
  "زان",
  "سنديان (بلوط)",
  "ماهوجني",
  "خشب الجوز",
  "MDF",
  "MDF لاكيه",
  "خشب الصنوبر",
  "خشب البتولا",
  "أبلكاش",
  "خشب أحمر",
  "خشب طبيعي مستورد",
  "أخرى",
] as const;

/** Available finish types. */
export const FINISH_TYPES = [
  "لاكيه لامع",
  "لاكيه مطفي",
  "دهان طبيعي",
  "ورنيش",
  "بياض",
  "خشب طبيعي بدون دهان",
  "تشطيب خاص",
] as const;

/** Common Saudi cities for the city dropdown. */
export const SAUDI_CITIES = [
  "الرياض",
  "جدة",
  "مكة المكرمة",
  "المدينة المنورة",
  "الدمام",
  "الخبر",
  "الظهران",
  "الطائف",
  "تبوك",
  "أبها",
  "خميس مشيط",
  "حائل",
  "نجران",
  "جازان",
  "بريدة",
  "عنيزة",
  "ينبع",
  "الجبيل",
  "الأحساء",
  "القطيف",
  "أخرى",
] as const;
