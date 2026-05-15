import { prisma } from "@/lib/db";

/** Top-level KPI cards */
export async function getReportStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalOrders,
    activeOrders,
    totalCustomers,
    newCustomersThisMonth,
    openComplaints,
    pendingMaintenance,
    revenueTotal,
    revenueThisMonth,
    revenueLastMonth,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
    prisma.customer.count(),
    prisma.customer.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.complaint.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.maintenanceRequest.count({ where: { status: { in: ["REQUESTED", "SCHEDULED"] } } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: startOfMonth } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
  ]);

  const totalRevenue = revenueTotal._sum?.amount ?? 0;
  const monthRevenue = revenueThisMonth._sum?.amount ?? 0;
  const lastMonthRevenue = revenueLastMonth._sum?.amount ?? 0;

  // If no payments yet, fall back to order estimatedPrices for context
  const estimatedRevenue =
    totalRevenue === 0
      ? (await prisma.order.aggregate({ _sum: { estimatedPrice: true } }))._sum.estimatedPrice ?? 0
      : totalRevenue;

  return {
    totalOrders,
    activeOrders,
    totalCustomers,
    newCustomersThisMonth,
    openComplaints,
    pendingMaintenance,
    totalRevenue,
    estimatedRevenue,
    monthRevenue,
    lastMonthRevenue,
    revenueGrowth:
      lastMonthRevenue > 0
        ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : null,
  };
}

/** Orders grouped by product category */
export async function getOrdersByCategory() {
  const rows = await prisma.order.groupBy({
    by: ["productCategory"],
    _count: { _all: true },
    _sum: { estimatedPrice: true },
  });
  return rows.map((r) => ({
    category: r.productCategory,
    count: r._count._all,
    revenue: r._sum.estimatedPrice ?? 0,
  }));
}

/** Orders grouped by status */
export async function getOrdersByStatus() {
  const rows = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  return rows.map((r) => ({ status: r.status, count: r._count._all }));
}

/** Monthly revenue for the last N months (from payments, fallback to paidAmount) */
export async function getMonthlyRevenue(months = 6) {
  const now = new Date();
  const result: { month: string; revenue: number; label: string }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);

    const [paymentSum, orderSum] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paidAt: { gte: d, lt: end } },
      }),
      prisma.order.aggregate({
        _sum: { paidAmount: true },
        where: { createdAt: { gte: d, lt: end } },
      }),
    ]);

    const revenue =
      (paymentSum._sum?.amount ?? 0) ||
      (orderSum._sum?.paidAmount ?? 0);

    result.push({
      month: d.toISOString().slice(0, 7), // YYYY-MM
      label: d.toLocaleString("ar-SA", { month: "short", year: "2-digit" }),
      revenue,
    });
  }
  return result;
}

/** Complaints grouped by category */
export async function getComplaintsByCategory() {
  const rows = await prisma.complaint.groupBy({
    by: ["category"],
    _count: { _all: true },
  });
  return rows.map((r) => ({ category: r.category, count: r._count._all }));
}

/** Complaints grouped by status */
export async function getComplaintsByStatus() {
  const rows = await prisma.complaint.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  return rows.map((r) => ({ status: r.status, count: r._count._all }));
}

/** Top 5 customers by order count + total estimated value */
export async function getTopCustomers(limit = 5) {
  const rows = await prisma.customer.findMany({
    take: limit,
    orderBy: { orders: { _count: "desc" } },
    include: {
      _count: { select: { orders: true } },
      orders: {
        select: { estimatedPrice: true, paidAmount: true, finalPrice: true },
      },
    },
  });

  return rows.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    isVip: c.isVip,
    orderCount: c._count.orders,
    totalValue: c.orders.reduce(
      (s, o) => s + (o.finalPrice ?? o.estimatedPrice),
      0,
    ),
    totalPaid: c.orders.reduce((s, o) => s + o.paidAmount, 0),
  }));
}

/** Maintenance grouped by type and status */
export async function getMaintenanceStats() {
  const [byType, byStatus, avgCompletionDays] = await Promise.all([
    prisma.maintenanceRequest.groupBy({ by: ["type"], _count: { _all: true } }),
    prisma.maintenanceRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.maintenanceRequest.findMany({
      where: { status: "COMPLETED", completedDate: { not: null } },
      select: { createdAt: true, completedDate: true },
    }),
  ]);

  const avgDays =
    avgCompletionDays.length > 0
      ? Math.round(
          avgCompletionDays.reduce((s, r) => {
            if (!r.completedDate) return s;
            return s + (r.completedDate.getTime() - r.createdAt.getTime()) / 86400000;
          }, 0) / avgCompletionDays.length,
        )
      : null;

  return {
    byType: byType.map((r) => ({ type: r.type, count: r._count._all })),
    byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
    avgCompletionDays: avgDays,
  };
}
