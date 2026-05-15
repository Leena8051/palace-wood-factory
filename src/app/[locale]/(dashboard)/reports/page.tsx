import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  MessageCircleWarning,
  Wrench,
  Star,
  Minus,
  CheckCircle2,
  Wallet,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";

import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth-helpers";
import {
  getReportStats,
  getOrdersByCategory,
  getOrdersByStatus,
  getMonthlyRevenue,
  getTopCustomers,
  getComplaintsByCategory,
  getComplaintsByStatus,
  getMaintenanceStats,
  type ReportPeriod,
} from "@/lib/reports/queries";
import { getComplaintStats } from "@/lib/complaints/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdersByCategoryChart } from "@/components/reports/orders-by-category-chart";
import { OrdersByStatusChart } from "@/components/reports/orders-by-status-chart";
import { RevenueAreaChart } from "@/components/reports/revenue-area-chart";
import { PeriodFilter } from "@/components/reports/period-filter";
import { formatCurrency } from "@/lib/utils";

const COMPLAINT_CAT_LABELS: Record<string, { ar: string; en: string }> = {
  QUALITY:    { ar: "جودة",            en: "Quality" },
  DELAY:      { ar: "تأخير",           en: "Delay" },
  DAMAGE:     { ar: "تلف",             en: "Damage" },
  WRONG_SPEC: { ar: "مواصفات خاطئة",  en: "Wrong Spec" },
  OTHER:      { ar: "أخرى",            en: "Other" },
};

const COMPLAINT_STATUS_COLORS: Record<string, string> = {
  OPEN:        "bg-warning",
  IN_PROGRESS: "bg-info",
  RESOLVED:    "bg-success",
  CLOSED:      "bg-muted-foreground",
};

const MAINTENANCE_TYPE_COLORS: Record<string, string> = {
  WARRANTY:     "bg-success",
  PAID:         "bg-accent",
  FREE_GOODWILL: "bg-info",
};

const MAINTENANCE_STATUS_COLORS: Record<string, string> = {
  REQUESTED:   "bg-warning",
  SCHEDULED:   "bg-info",
  IN_PROGRESS: "bg-accent",
  COMPLETED:   "bg-success",
  CANCELLED:   "bg-destructive",
};

interface SearchParams { period?: string }

export default async function ReportsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/reports">) {
  const { locale } = await params;
  const sp = (await searchParams) as SearchParams;
  setRequestLocale(locale);
  await requireUser(locale as "ar" | "en");

  const period = (sp.period ?? "6m") as ReportPeriod;
  const isAr = locale === "ar";
  const dateLocale = isAr ? arLocale : undefined;

  const t = await getTranslations({ locale, namespace: "reports" });
  const tStatus = await getTranslations({ locale, namespace: "maintenance.statuses" });
  const tMainType = await getTranslations({ locale, namespace: "maintenance.types" });

  const months = period === "month" ? 1 : period === "3m" ? 3 : period === "year" ? 12 : 6;

  const [
    stats,
    byCategory,
    byStatus,
    monthlyRevenue,
    topCustomers,
    complaintsByCategory,
    complaintsByStatus,
    complaintStats,
    maintenanceStats,
  ] = await Promise.all([
    getReportStats(period),
    getOrdersByCategory(period),
    getOrdersByStatus(),
    getMonthlyRevenue(months),
    getTopCustomers(5),
    getComplaintsByCategory(),
    getComplaintsByStatus(),
    getComplaintStats(),
    getMaintenanceStats(),
  ]);

  const revenueDisplay =
    stats.totalRevenue > 0 ? stats.totalRevenue : stats.estimatedRevenue;
  const isEstimated = stats.totalRevenue === 0;

  const totalComplaints = complaintsByStatus.reduce((s, c) => s + c.count, 0);
  const totalMaintenanceByType = maintenanceStats.byType.reduce((s, r) => s + r.count, 0);
  const totalMaintenanceByStatus = maintenanceStats.byStatus.reduce((s, r) => s + r.count, 0);
  const maxCustomerValue = Math.max(...topCustomers.map((c) => c.totalValue), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-accent" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <PeriodFilter current={period} />
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Revenue */}
        <Card className="xl:col-span-1 col-span-2 border-l-4 border-l-accent dark:border-l-accent">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {t("kpi.revenue")}
                  {isEstimated && (
                    <span className="ms-1 text-[10px] text-muted-foreground normal-case">({t("estimated")})</span>
                  )}
                </p>
                <p className="text-2xl font-bold text-accent mt-1">
                  {formatCurrency(revenueDisplay, locale as "ar" | "en")}
                </p>
                {stats.revenueGrowth !== null ? (
                  <p className={`text-xs mt-1.5 flex items-center gap-1 font-medium ${
                    stats.revenueGrowth >= 0 ? "text-success" : "text-destructive"
                  }`}>
                    {stats.revenueGrowth >= 0
                      ? <TrendingUp className="h-3 w-3" />
                      : <TrendingDown className="h-3 w-3" />}
                    {stats.revenueGrowth >= 0 ? "+" : ""}{stats.revenueGrowth}%
                    <span className="text-muted-foreground font-normal">{t("kpi.vsLastMonth")}</span>
                  </p>
                ) : (
                  <p className="text-xs mt-1.5 text-muted-foreground flex items-center gap-1">
                    <Minus className="h-3 w-3" />
                    {t("kpi.noComparison")}
                  </p>
                )}
              </div>
              <div className="rounded-xl bg-accent/10 p-2.5">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
            </div>
            {stats.outstandingBalance > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Wallet className="h-3 w-3 text-warning" />
                  {t("kpi.outstanding")}:{" "}
                  <span className="text-warning font-semibold">
                    {formatCurrency(stats.outstandingBalance, locale as "ar" | "en")}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders */}
        <Card className="border-l-4 border-l-primary dark:border-l-primary">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {t("kpi.orders")}
                </p>
                <p className="text-2xl font-bold mt-1">{stats.totalOrders}</p>
                <p className="text-xs mt-1.5 text-muted-foreground">
                  <span className="text-info font-medium">{stats.activeOrders}</span>{" "}
                  {t("kpi.active")}
                  {" · "}
                  <span className="text-success font-medium">{stats.deliveredOrders}</span>{" "}
                  {isAr ? "مُسلَّم" : "delivered"}
                </p>
              </div>
              <div className="rounded-xl bg-primary/10 p-2.5">
                <Package className="h-5 w-5 text-primary" />
              </div>
            </div>
            {/* Completion rate bar */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{t("kpi.completionRate")}</span>
                <span className="font-semibold text-foreground">{stats.completionRate}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-success transition-all"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers */}
        <Card className="border-l-4 border-l-info dark:border-l-info">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {t("kpi.customers")}
                </p>
                <p className="text-2xl font-bold mt-1">{stats.totalCustomers}</p>
                <p className="text-xs mt-1.5 flex items-center gap-1">
                  <span className="text-success font-medium">+{stats.newCustomersThisMonth}</span>
                  <span className="text-muted-foreground">{t("kpi.thisMonth")}</span>
                </p>
              </div>
              <div className="rounded-xl bg-info/10 p-2.5">
                <Users className="h-5 w-5 text-info" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground">
                {t("kpi.ordersInPeriod")}:{" "}
                <span className="font-semibold text-foreground">{stats.ordersInPeriod}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Open Issues */}
        <Card className="border-l-4 border-l-warning dark:border-l-warning">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {t("kpi.openIssues")}
                </p>
                <div className="flex items-center gap-4 mt-1">
                  <div>
                    <p className="text-2xl font-bold text-warning">{stats.openComplaints}</p>
                    <p className="text-[10px] text-muted-foreground">{t("kpi.complaints")}</p>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div>
                    <p className="text-2xl font-bold text-info">{stats.pendingMaintenance}</p>
                    <p className="text-[10px] text-muted-foreground">{t("kpi.maintenance")}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-warning/10 p-2.5">
                <Target className="h-5 w-5 text-warning" />
              </div>
            </div>
            {complaintStats.avgRating > 0 && (
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-1">
                <Star className="h-3 w-3 text-accent fill-accent" />
                <span className="text-xs text-muted-foreground">
                  {t("kpi.avgRating")}: <span className="font-semibold text-foreground">{complaintStats.avgRating}</span>/5
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 1: Revenue + Category ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart — wider */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">{t("charts.monthlyRevenue")}</CardTitle>
              <span className="text-xs text-muted-foreground">
                {format(new Date(), "MMM yyyy", { locale: dateLocale })}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueAreaChart data={monthlyRevenue} />
          </CardContent>
        </Card>

        {/* Orders by Category — narrower */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("charts.ordersByCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersByCategoryChart data={byCategory} />
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 2: Status + Complaints ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("charts.ordersByStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersByStatusChart data={byStatus} />
          </CardContent>
        </Card>

        {/* Complaint breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("charts.complaintBreakdown")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: t("complaints.resolved"), value: complaintStats.count, color: "text-success" },
                { label: t("complaints.avgTime"), value: `${complaintStats.avgHours}h`, color: "text-info" },
                { label: t("complaints.avgRating"), value: complaintStats.avgRating > 0 ? `${complaintStats.avgRating}★` : "—", color: "text-accent" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-muted/50 px-2 py-2.5 text-center">
                  <p className={`text-base font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>

            {/* By status */}
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {isAr ? "حسب الحالة" : "By Status"}
              </p>
              {complaintsByStatus.map((c) => {
                const pct = totalComplaints > 0 ? Math.round((c.count / totalComplaints) * 100) : 0;
                const color = COMPLAINT_STATUS_COLORS[c.status] ?? "bg-muted-foreground";
                const labels: Record<string, { ar: string; en: string }> = {
                  OPEN:        { ar: "مفتوحة",       en: "Open" },
                  IN_PROGRESS: { ar: "قيد المعالجة", en: "In Progress" },
                  RESOLVED:    { ar: "محلولة",        en: "Resolved" },
                  CLOSED:      { ar: "مغلقة",         en: "Closed" },
                };
                return (
                  <div key={c.status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        {isAr ? labels[c.status]?.ar : labels[c.status]?.en}
                      </span>
                      <span className="font-medium">{c.count} <span className="text-muted-foreground">({pct}%)</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${color} opacity-80 transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* By category */}
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {isAr ? "حسب الفئة" : "By Category"}
              </p>
              {complaintsByCategory.map((c) => {
                const pct = totalComplaints > 0 ? Math.round((c.count / totalComplaints) * 100) : 0;
                const label = COMPLAINT_CAT_LABELS[c.category];
                return (
                  <div key={c.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{isAr ? label?.ar : label?.en}</span>
                      <span className="font-medium">{c.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-warning/70 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Row: Top Customers + Maintenance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Customers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("tables.topCustomers")}</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">—</p>
            ) : (
              <div className="space-y-4">
                {topCustomers.map((c, idx) => {
                  const barPct = Math.round((c.totalValue / maxCustomerValue) * 100);
                  return (
                    <div key={c.id}>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`text-xs font-bold w-5 text-center rounded-full py-0.5 ${
                          idx === 0 ? "bg-accent/20 text-accent"
                          : idx === 1 ? "bg-muted text-muted-foreground"
                          : "text-muted-foreground"
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/customers/${c.id}`}
                            className="text-sm font-medium hover:text-accent flex items-center gap-1 truncate"
                          >
                            {c.isVip && <Star className="h-3 w-3 text-accent fill-accent shrink-0" />}
                            {c.fullName}
                          </Link>
                        </div>
                        <div className="text-end shrink-0">
                          <p className="text-sm font-bold text-accent">
                            {formatCurrency(c.totalValue, locale as "ar" | "en")}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {c.orderCount} {isAr ? "طلب" : "orders"}
                          </p>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden ms-8">
                        <div
                          className="h-full rounded-full bg-accent/60 transition-all"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Summary */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">{t("tables.maintenanceSummary")}</CardTitle>
              {maintenanceStats.avgCompletionDays !== null && (
                <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  <span className="text-xs font-semibold text-success">
                    {maintenanceStats.avgCompletionDays} {isAr ? "يوم" : "days avg"}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* By type */}
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {t("maintenance.byType")}
              </p>
              {maintenanceStats.byType.map((r) => {
                const pct = totalMaintenanceByType > 0 ? Math.round((r.count / totalMaintenanceByType) * 100) : 0;
                const color = MAINTENANCE_TYPE_COLORS[r.type] ?? "bg-muted-foreground";
                return (
                  <div key={r.type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{tMainType(r.type)}</span>
                      <span className="font-medium">{r.count} <span className="text-muted-foreground">({pct}%)</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${color} opacity-80 transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* By status */}
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {t("maintenance.byStatus")}
              </p>
              {maintenanceStats.byStatus.map((r) => {
                const pct = totalMaintenanceByStatus > 0 ? Math.round((r.count / totalMaintenanceByStatus) * 100) : 0;
                const color = MAINTENANCE_STATUS_COLORS[r.status] ?? "bg-muted-foreground";
                return (
                  <div key={r.status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{tStatus(r.status)}</span>
                      <span className="font-medium">{r.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${color} opacity-70 transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <p className="text-xs text-muted-foreground text-center pb-4">
        {t("lastUpdated")}{" "}
        {format(new Date(), "dd MMM yyyy · HH:mm", { locale: dateLocale })}
      </p>
    </div>
  );
}
