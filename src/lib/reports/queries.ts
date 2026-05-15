import { prisma } from "@/lib/db";

export type ReportPeriod = "month" | "3m" | "6m" | "year";

function getPeriodDates(period: ReportPeriod = "6m") {
  const now = new Date();
  let from: Date;
  switch (period) {
    case "month":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "3m":
      from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      break;
    case "year":
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case "6m":
    default:
      from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  }
  return { from, to: now };
}

/** Top-level KPI cards */
export async function getReportStats(period: ReportPeriod = "6m") {
  const { from } = getPeriodDates(period);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalOrders,
    activeOrders,
    deliveredOrders,
    cancelledOrders,
    totalCustomers,
    newCustomersThisMonth,
    openComplaints,
    pendingMaintenance,
    revenueTotal,
    revenueThisMonth,
    revenueLastMonth,
    balanceDue,
    ordersInPeriod,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.customer.count(),
    prisma.customer.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.complaint.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.maintenanceRequest.count({ where: { status: { in: ["REQUESTED", "SCHEDULED"] } } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: startOfMonth } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
    // Balance due = sum of (finalPrice ?? estimatedPrice) - paidAmount for non-delivered/cancelled
    prisma.order.aggregate({
      _sum: { estimatedPrice: true, paidAmount: true },
      where: { status: { notIn: ["CANCELLED"] } },
    }),
    prisma.order.count({ where: { createdAt: { gte: from } } }),
  ]);

  const totalRevenue = revenueTotal._sum?.amount ?? 0;
  const monthRevenue = revenueThisMonth._sum?.amount ?? 0;
  const lastMonthRevenue = revenueLastMonth._sum?.amount ?? 0;

  const estimatedRevenue =
    totalRevenue === 0
      ? (await prisma.order.aggregate({ _sum: { estimatedPrice: true } }))._sum?.estimatedPrice ?? 0
      : totalRevenue;

  const totalExpected = balanceDue._sum?.estimatedPrice ?? 0;
  const totalPaid = balanceDue._sum?.paidAmount ?? 0;
  const outstandingBalance = Math.max(0, totalExpected - totalPaid);

  const completionRate =
    totalOrders > 0
      ? Math.round((deliveredOrders / totalOrders) * 100)
      : 0;

  return {
    totalOrders,
    activeOrders,
    deliveredOrders,
    cancelledOrders,
    ordersInPeriod,
    completionRate,
    totalCustomers,
    newCustomersThisMonth,
    openComplaints,
    pendingMaintenance,
    totalRevenue,
    estimatedRevenue,
    monthRevenue,
    lastMonthRevenue,
    outstandingBalance,
    revenueGrowth:
      lastMonthRevenue > 0
        ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : null,
  };
}

/** Orders grouped by product category */
export async function getOrdersByCategory(period: ReportPeriod = "6m") {
  const { from } = getPeriodDates(period);
  const rows = await prisma.order.groupBy({
    by: ["productCategory"],
    where: { createdAt: { gte: from } },
    _count: { _all: true },
    _sum: { estimatedPrice: true },
  });
  return rows.map((r) => ({
    category: r.productCategory,
    count: r._count._all,
    revenue: r._sum?.estimatedPrice ?? 0,
  }));
}

/** Orders grouped by status */
export async function getOrdersByStatus() {
  const rows = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  // Return in logical pipeline order
  const ORDER = ["NEW", "DESIGN", "APPROVED", "PRODUCTION", "FINISHING", "READY", "DELIVERED", "CANCELLED"];
  const map: Record<string, number> = {};
  for (const r of rows) map[r.status] = r._count._all;
  return ORDER.filter((s) => map[s]).map((s) => ({ status: s, count: map[s] }));
}

/** Monthly revenue for the last N months */
export async function getMonthlyRevenue(months = 6) {
  const now = new Date();
  const result: { month: string; revenue: number; orders: number; label: string }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);

    const [paymentSum, orderSum, orderCount] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paidAt: { gte: d, lt: end } },
      }),
      prisma.order.aggregate({
        _sum: { paidAmount: true },
        where: { createdAt: { gte: d, lt: end } },
      }),
      prisma.order.count({ where: { createdAt: { gte: d, lt: end } } }),
    ]);

    const revenue =
      (paymentSum._sum?.amount ?? 0) || (orderSum._sum?.paidAmount ?? 0);

    result.push({
      month: d.toISOString().slice(0, 7),
      label: d.toLocaleString("ar-SA", { month: "short", year: "2-digit" }),
      revenue,
      orders: orderCount,
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
  const ORDER = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
  const map: Record<string, number> = {};
  for (const r of rows) map[r.status] = r._count._all;
  return ORDER.filter((s) => map[s]).map((s) => ({ status: s, count: map[s] }));
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
    totalValue: c.orders.reduce((s, o) => s + (o.finalPrice ?? o.estimatedPrice), 0),
    totalPaid: c.orders.reduce((s, o) => s + o.paidAmount, 0),
  }));
}

/** Maintenance grouped by type and status */
export async function getMaintenanceStats() {
  const [byType, byStatus, completed] = await Promise.all([
    prisma.maintenanceRequest.groupBy({ by: ["type"], _count: { _all: true } }),
    prisma.maintenanceRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.maintenanceRequest.findMany({
      where: { status: "COMPLETED", completedDate: { not: null } },
      select: { createdAt: true, completedDate: true },
    }),
  ]);

  const avgDays =
    completed.length > 0
      ? Math.round(
          completed.reduce((s, r) => {
            if (!r.completedDate) return s;
            return s + (r.completedDate.getTime() - r.createdAt.getTime()) / 86400000;
          }, 0) / completed.length,
        )
      : null;

  return {
    byType: byType.map((r) => ({ type: r.type, count: r._count._all })),
    byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
    avgCompletionDays: avgDays,
    completedCount: completed.length,
  };
}
