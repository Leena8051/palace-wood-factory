import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export interface OrderListParams {
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  customerId?: string;
  page?: number;
  pageSize?: number;
}

export async function listOrders(params: OrderListParams) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.OrderWhereInput = {};

  if (params.search?.trim()) {
    const term = params.search.trim();
    where.OR = [
      { orderNumber: { contains: term } },
      { productType: { contains: term } },
      { customer: { fullName: { contains: term } } },
      { customer: { phone: { contains: term.replace(/\D/g, "") } } },
    ];
  }

  if (params.status) where.status = params.status;
  if (params.priority) where.priority = params.priority;
  if (params.category) where.productCategory = params.category;
  if (params.customerId) where.customerId = params.customerId;

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        customer: {
          select: { id: true, fullName: true, phone: true, isVip: true },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      stages: { orderBy: { stageNumber: "asc" } },
      payments: { orderBy: { paidAt: "desc" } },
      files: { orderBy: { createdAt: "desc" } },
      assignedDesigner: { select: { id: true, name: true, email: true } },
      assignedSupervisor: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export type OrderListItem = Awaited<ReturnType<typeof listOrders>>["items"][number];
export type OrderWithRelations = NonNullable<
  Awaited<ReturnType<typeof getOrderById>>
>;
