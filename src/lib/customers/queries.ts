import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { normalizeSaudiPhone } from "@/lib/utils";

export interface CustomerListParams {
  search?: string;
  city?: string;
  type?: "INDIVIDUAL" | "COMPANY";
  vipOnly?: boolean;
  source?: string;
  page?: number;
  pageSize?: number;
}

export async function listCustomers(params: CustomerListParams) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.CustomerWhereInput = {};

  if (params.search) {
    const term = params.search.trim();
    if (term) {
      // Try to match as phone (normalized) OR substring of name
      const maybePhone = /^[+\d]/.test(term)
        ? normalizeSaudiPhone(term)
        : null;
      where.OR = [
        { fullName: { contains: term } },
        { customerCode: { contains: term } },
        ...(maybePhone ? [{ phone: { contains: maybePhone } }] : []),
        { phone: { contains: term.replace(/\D/g, "") } },
      ];
    }
  }

  if (params.city) where.city = params.city;
  if (params.type) where.customerType = params.type;
  if (params.vipOnly) where.isVip = true;
  if (params.source) where.source = params.source;

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { orders: true, complaints: true } },
        orders: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { orderNumber: true, createdAt: true, status: true },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          productCategory: true,
          productType: true,
          estimatedPrice: true,
          finalPrice: true,
          createdAt: true,
        },
      },
      complaints: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      },
      maintenance: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          requestNumber: true,
          type: true,
          status: true,
          scheduledDate: true,
          createdAt: true,
        },
      },
      _count: {
        select: { orders: true, complaints: true, maintenance: true },
      },
    },
  });
}

export async function getDistinctCities() {
  const rows = await prisma.customer.findMany({
    distinct: ["city"],
    select: { city: true },
    orderBy: { city: "asc" },
  });
  return rows.map((r) => r.city);
}

export type CustomerListItem = Awaited<
  ReturnType<typeof listCustomers>
>["items"][number];
export type CustomerWithRelations = NonNullable<
  Awaited<ReturnType<typeof getCustomerById>>
>;
