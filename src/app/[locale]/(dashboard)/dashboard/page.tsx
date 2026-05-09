import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  TrendingUp,
  UserPlus,
  Star,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

function greetingKey(): "welcomeMorning" | "welcomeAfternoon" | "welcomeEvening" {
  const h = new Date().getHours();
  if (h < 12) return "welcomeMorning";
  if (h < 18) return "welcomeAfternoon";
  return "welcomeEvening";
}

export default async function DashboardPage({
  params,
}: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "dashboard" });
  const tRoles = await getTranslations({ locale, namespace: "roles" });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [activeOrders, monthlyRevenueAgg, newCustomers, recentOrders] =
    await Promise.all([
      prisma.order.count({
        where: {
          status: { notIn: ["DELIVERED", "CANCELLED"] },
        },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paidAt: { gte: startOfMonth } },
      }),
      prisma.customer.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: true },
      }),
    ]);

  const monthlyRevenue = monthlyRevenueAgg._sum.amount ?? 0;

  const stats = [
    {
      label: t("stats.activeOrders"),
      value: formatNumber(activeOrders, locale as "ar" | "en"),
      icon: ClipboardList,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      label: t("stats.monthlyRevenue"),
      value: formatCurrency(monthlyRevenue, locale as "ar" | "en"),
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: t("stats.newCustomers"),
      value: formatNumber(newCustomers, locale as "ar" | "en"),
      icon: UserPlus,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: t("stats.satisfaction"),
      value: "—",
      icon: Star,
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {t(greetingKey())}، {session?.user?.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tRoles(session?.user?.role || "ADMIN")}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold mt-2">{s.value}</p>
                  </div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg} ${s.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent orders + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("recentOrders")}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {t("noOrders")}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.customer.fullName}
                      </p>
                    </div>
                    <Badge variant="secondary">{order.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              {t("alerts")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-10 text-center text-sm text-muted-foreground">
              {t("noAlerts")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
