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
  getMaintenanceStats,
} from "@/lib/reports/queries";
import { getComplaintStats } from "@/lib/complaints/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdersByCategoryChart } from "@/components/reports/orders-by-category-chart";
import { OrdersByStatusChart } from "@/components/reports/orders-by-status-chart";
import { MonthlyRevenueChart } from "@/components/reports/monthly-revenue-chart";
import { formatCurrency } from "@/lib/utils";

export default async function ReportsPage({
  params,
}: PageProps<"/[locale]/reports">) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser(locale as "ar" | "en");

  const t = await getTranslations({ locale, namespace: "reports" });
  const tCat = await getTranslations({ locale, namespace: "orders.categories" });
  const tMainType = await getTranslations({ locale, namespace: "maintenance.types" });

  const dateLocale = locale === "ar" ? arLocale : undefined;

  const [
    stats,
    byCategory,
    byStatus,
    monthlyRevenue,
    topCustomers,
    complaintsByCategory,
    complaintStats,
    maintenanceStats,
  ] = await Promise.all([
    getReportStats(),
    getOrdersByCategory(),
    getOrdersByStatus(),
    getMonthlyRevenue(6),
    getTopCustomers(5),
    getComplaintsByCategory(),
    getComplaintStats(),
    getMaintenanceStats(),
  ]);

  const revenueDisplay =
    stats.totalRevenue > 0 ? stats.totalRevenue : stats.estimatedRevenue;
  const revenueLabel =
    stats.totalRevenue === 0 ? ` (${t("estimated")})` : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-accent" />
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
              {t("kpi.revenue")}{revenueLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">
              {formatCurrency(revenueDisplay, locale as "ar" | "en")}
            </p>
            {stats.revenueGrowth !== null ? (
              <p className={`text-xs mt-1 flex items-center gap-1 ${
                stats.revenueGrowth >= 0 ? "text-success" : "text-destructive"
              }`}>
                {stats.revenueGrowth >= 0
                  ? <TrendingUp className="h-3 w-3" />
                  : <TrendingDown className="h-3 w-3" />}
                {stats.revenueGrowth >= 0 ? "+" : ""}{stats.revenueGrowth}%{" "}
                {t("kpi.vsLastMonth")}
              </p>
            ) : (
              <p className="text-xs mt-1 text-muted-foreground flex items-center gap-1">
                <Minus className="h-3 w-3" />
                {t("kpi.noComparison")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal uppercase tracking-wide flex items-center gap-1">
              <Package className="h-3 w-3" />
              {t("kpi.orders")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
            <p className="text-xs mt-1 text-muted-foreground">
              {stats.activeOrders} {t("kpi.active")}
            </p>
          </CardContent>
        </Card>

        {/* Customers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal uppercase tracking-wide flex items-center gap-1">
              <Users className="h-3 w-3" />
              {t("kpi.customers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalCustomers}</p>
            <p className="text-xs mt-1 text-success">
              +{stats.newCustomersThisMonth} {t("kpi.thisMonth")}
            </p>
          </CardContent>
        </Card>

        {/* Complaints + Maintenance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
              {t("kpi.openIssues")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xl font-bold text-warning flex items-center gap-1">
                  <MessageCircleWarning className="h-4 w-4" />
                  {stats.openComplaints}
                </p>
                <p className="text-[10px] text-muted-foreground">{t("kpi.complaints")}</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-xl font-bold text-info flex items-center gap-1">
                  <Wrench className="h-4 w-4" />
                  {stats.pendingMaintenance}
                </p>
                <p className="text-[10px] text-muted-foreground">{t("kpi.maintenance")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("charts.monthlyRevenue")}</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyRevenueChart data={monthlyRevenue} />
          </CardContent>
        </Card>

        {/* Orders by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("charts.ordersByCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersByCategoryChart data={byCategory} />
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("charts.ordersByStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersByStatusChart data={byStatus} />
          </CardContent>
        </Card>

        {/* Complaints breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("charts.complaintBreakdown")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-lg font-bold">{complaintStats.count}</p>
                <p className="text-[10px] text-muted-foreground">{t("complaints.resolved")}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-lg font-bold">{complaintStats.avgHours}h</p>
                <p className="text-[10px] text-muted-foreground">{t("complaints.avgTime")}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-lg font-bold flex items-center justify-center gap-1">
                  {complaintStats.avgRating > 0 ? complaintStats.avgRating : "—"}
                  {complaintStats.avgRating > 0 && (
                    <Star className="h-3.5 w-3.5 text-accent fill-accent" />
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground">{t("complaints.avgRating")}</p>
              </div>
            </div>
            {/* By category bars */}
            <div className="space-y-2 mt-2">
              {complaintsByCategory.map((c) => {
                const total = complaintsByCategory.reduce((s, x) => s + x.count, 0);
                const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
                return (
                  <div key={c.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        {/* inline label lookup since server */}
                        {c.category === "QUALITY" && (locale === "ar" ? "جودة" : "Quality")}
                        {c.category === "DELAY" && (locale === "ar" ? "تأخير" : "Delay")}
                        {c.category === "DAMAGE" && (locale === "ar" ? "تلف" : "Damage")}
                        {c.category === "WRONG_SPEC" && (locale === "ar" ? "مواصفات خاطئة" : "Wrong Spec")}
                        {c.category === "OTHER" && (locale === "ar" ? "أخرى" : "Other")}
                      </span>
                      <span className="font-medium">{c.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-warning"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: top customers + maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("tables.topCustomers")}</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">—</p>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((c, idx) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm w-4">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/customers/${c.id}`}
                        className="text-sm font-medium hover:text-accent flex items-center gap-1 truncate"
                      >
                        {c.isVip && <Star className="h-3 w-3 text-accent fill-accent shrink-0" />}
                        {c.fullName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {c.orderCount} {locale === "ar" ? "طلب" : "orders"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-accent shrink-0">
                      {formatCurrency(c.totalValue, locale as "ar" | "en")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("tables.maintenanceSummary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {maintenanceStats.avgCompletionDays !== null && (
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold">{maintenanceStats.avgCompletionDays}</p>
                <p className="text-xs text-muted-foreground">{t("maintenance.avgDays")}</p>
              </div>
            )}
            {/* By type */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {t("maintenance.byType")}
              </p>
              {maintenanceStats.byType.map((r) => (
                <div key={r.type} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{tMainType(r.type)}</span>
                  <span className="font-medium">{r.count}</span>
                </div>
              ))}
            </div>
            {/* By status */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {t("maintenance.byStatus")}
              </p>
              {maintenanceStats.byStatus.map((r) => (
                <div key={r.status} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {r.status === "REQUESTED" && (locale === "ar" ? "مطلوبة" : "Requested")}
                    {r.status === "SCHEDULED" && (locale === "ar" ? "مجدولة" : "Scheduled")}
                    {r.status === "IN_PROGRESS" && (locale === "ar" ? "جارية" : "In Progress")}
                    {r.status === "COMPLETED" && (locale === "ar" ? "مكتملة" : "Completed")}
                    {r.status === "CANCELLED" && (locale === "ar" ? "ملغاة" : "Cancelled")}
                  </span>
                  <span className="font-medium">{r.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center pb-4">
        {t("lastUpdated")}{" "}
        {format(new Date(), "dd MMM yyyy HH:mm", { locale: dateLocale })}
      </p>
    </div>
  );
}
