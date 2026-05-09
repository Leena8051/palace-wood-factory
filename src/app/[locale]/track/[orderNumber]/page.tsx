import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  Trees,
  Phone,
  Hash,
  Package,
  Clock,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";

import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderStageTimeline } from "@/components/orders/order-stage-timeline";

export const dynamic = "force-dynamic";

export default async function TrackOrderPage({
  params,
}: PageProps<"/[locale]/track/[orderNumber]">) {
  const { locale, orderNumber } = await params;
  setRequestLocale(locale);

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      customer: {
        select: { fullName: true, phone: true, city: true },
      },
      stages: { orderBy: { stageNumber: "asc" } },
    },
  });

  if (!order) notFound();

  const t = await getTranslations({ locale, namespace: "track" });
  const tApp = await getTranslations({ locale, namespace: "app" });
  const tStatus = await getTranslations({ locale, namespace: "orders.statuses" });
  const tCat = await getTranslations({ locale, namespace: "orders.categories" });

  const dateLocale = locale === "ar" ? arLocale : undefined;

  // Mask phone for privacy on a public page
  const maskedPhone = (() => {
    const digits = order.customer.phone.replace(/\D/g, "");
    if (digits.length < 6) return "•••";
    return `••• ••• ${digits.slice(-4)}`;
  })();

  const totalCompleted = order.stages.filter(
    (s) => s.status === "COMPLETED",
  ).length;
  const progressPct = Math.round((totalCompleted / order.stages.length) * 100);

  return (
    <div className="min-h-screen wood-grain py-6 md:py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Brand header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-3">
            <Trees className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">{tApp("name")}</h1>
          <p className="text-sm text-muted-foreground">{tApp("tagline")}</p>
        </div>

        {/* Order summary */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{t("orderNumber")}</p>
                <p className="text-2xl font-bold font-mono mt-0.5">
                  {order.orderNumber}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {tCat(order.productCategory)} • {order.productType}
                </p>
              </div>
              <OrderStatusBadge
                status={order.status}
                label={tStatus(order.status)}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3" /> {t("customer")}
                </p>
                <p className="font-medium mt-0.5">{order.customer.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {t("phone")}
                </p>
                <p className="font-mono mt-0.5" dir="ltr">{maskedPhone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {t("orderDate")}
                </p>
                <p className="font-medium mt-0.5">
                  {format(order.orderDate, "dd MMM yyyy", { locale: dateLocale })}
                </p>
              </div>
              {order.estimatedDelivery && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" /> {t("estimatedDelivery")}
                  </p>
                  <p className="font-medium mt-0.5">
                    {format(order.estimatedDelivery, "dd MMM yyyy", {
                      locale: dateLocale,
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {t("progress")}
                </p>
                <p className="text-sm font-bold text-accent">{progressPct}%</p>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              {t("manufacturingStages")}
            </h2>
            <OrderStageTimeline stages={order.stages} />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>{t("contactHint")}</p>
          <p className="mt-2">© {new Date().getFullYear()} {tApp("name")}</p>
        </div>
      </div>
    </div>
  );
}
