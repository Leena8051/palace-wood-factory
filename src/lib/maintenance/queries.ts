import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { checkWarranty } from "@/lib/warranty";

export interface MaintenanceListParams {
  search?: string;
  status?: string;
  type?: string;
  technicianId?: string;
  upcoming?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listMaintenance(params: MaintenanceListParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.MaintenanceRequestWhereInput = {};

  if (params.search?.trim()) {
    const term = params.search.trim();
    where.OR = [
      { requestNumber: { contains: term } },
      { customer: { fullName: { contains: term } } },
      { reportedIssue: { contains: term } },
    ];
  }
  if (params.status) where.status = params.status;
  if (params.type) where.type = params.type;
  if (params.technicianId) where.technicianId = params.technicianId;
  if (params.upcoming) {
    where.scheduledDate = { gte: new Date() };
    where.status = { in: ["SCHEDULED", "REQUESTED"] };
  }

  const [items, total] = await Promise.all([
    prisma.maintenanceRequest.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [
        { scheduledDate: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        technician: { select: { id: true, name: true } },
        originalOrder: { select: { id: true, orderNumber: true } },
      },
    }),
    prisma.maintenanceRequest.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getMaintenanceById(id: string) {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: {
      customer: true,
      technician: { select: { id: true, name: true, email: true, phone: true } },
      originalOrder: {
        select: {
          id: true,
          orderNumber: true,
          productType: true,
          actualDelivery: true,
        },
      },
      photos: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!request) return null;

  // Compute warranty status if linked to an order
  const warranty = request.originalOrder
    ? checkWarranty(request.originalOrder.actualDelivery)
    : null;

  return { ...request, warranty };
}

export type MaintenanceListItem = Awaited<
  ReturnType<typeof listMaintenance>
>["items"][number];
export type MaintenanceWithRelations = NonNullable<
  Awaited<ReturnType<typeof getMaintenanceById>>
>;
