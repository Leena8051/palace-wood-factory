import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export interface ComplaintListParams {
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
  customerId?: string;
}

/** Fetch all complaints (no pagination — Kanban shows full board). */
export async function listComplaints(params: ComplaintListParams = {}) {
  const where: Prisma.ComplaintWhereInput = {};

  if (params.search?.trim()) {
    const term = params.search.trim();
    where.OR = [
      { ticketNumber: { contains: term } },
      { title: { contains: term } },
      { customer: { fullName: { contains: term } } },
    ];
  }
  if (params.status) where.status = params.status;
  if (params.category) where.category = params.category;
  if (params.priority) where.priority = params.priority;
  if (params.customerId) where.customerId = params.customerId;

  return prisma.complaint.findMany({
    where,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: {
      customer: { select: { id: true, fullName: true, phone: true, isVip: true } },
      order: { select: { id: true, orderNumber: true } },
      _count: { select: { responses: true } },
    },
  });
}

export async function getComplaintById(id: string) {
  return prisma.complaint.findUnique({
    where: { id },
    include: {
      customer: true,
      order: { select: { id: true, orderNumber: true, productType: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      resolvedBy: { select: { id: true, name: true } },
      responses: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
      },
      attachments: true,
    },
  });
}

/** Compute average resolution time (in hours) for resolved complaints. */
export async function getComplaintStats() {
  const resolved = await prisma.complaint.findMany({
    where: { resolvedAt: { not: null } },
    select: { createdAt: true, resolvedAt: true, rating: true },
  });

  if (resolved.length === 0) {
    return { count: 0, avgHours: 0, avgRating: 0 };
  }

  const totalMs = resolved.reduce((sum, c) => {
    if (!c.resolvedAt) return sum;
    return sum + (c.resolvedAt.getTime() - c.createdAt.getTime());
  }, 0);
  const ratings = resolved.filter((c) => c.rating !== null).map((c) => c.rating!);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r, 0) / ratings.length
      : 0;

  return {
    count: resolved.length,
    avgHours: Math.round(totalMs / resolved.length / 1000 / 60 / 60),
    avgRating: Math.round(avgRating * 10) / 10,
  };
}

export type ComplaintListItem = Awaited<ReturnType<typeof listComplaints>>[number];
export type ComplaintWithRelations = NonNullable<
  Awaited<ReturnType<typeof getComplaintById>>
>;
