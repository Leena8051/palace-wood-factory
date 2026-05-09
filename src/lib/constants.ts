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
