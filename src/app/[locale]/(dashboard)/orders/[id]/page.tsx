import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Hash,
  Phone,
  MessageCircle,
  User,
  Star,
  Package,
  Ruler,
  Palette,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";

import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getOrderById } from "@/lib/orders/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderPriorityBadge } from "@/components/orders/order-priority-badge";
import { OrderStageTimeline } from "@/components/orders/order-stage-timeline";
import { formatCurrency } from "@/lib/utils";

export default async function OrderDetailPage({
  params,
}: PageProps<"/[locale]/orders/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireUser(locale as "ar" | "en");

  const order = await getOrderById(id);
  if (!order) notFound();

  const t = await getTranslations({ locale, namespace: "orders" });
  const tStatus = await getTranslations({ locale, namespace: "orders.statuses" });
  const tPriority = await getTranslations({ locale, namespace: "orders.priorities" });
  const tCat = await getTranslations({ locale, namespace: "orders.categories" });

  const dateLocale = locale === "ar" ? arLocale : undefined;
  const wa = (order.customer.whatsapp || order.customer.phone).replace(/\D/g, "");
  const balanceDue = (order.finalPrice ?? order.estimatedPrice) - order.paidAmount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight font-mono">
                {order.orderNumber}
              </h1>
              <OrderStatusBadge status={order.status} label={tStatus(order.status)} />
              <OrderPriorityBadge
                priority={order.priority}
                label={tPriority(order.priority)}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {tCat(order.productCategory)} • {order.productType}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">
            <Button variant="outline" className="text-success border-success/40">
              <MessageCircle className="h-4 w-4" />
              {t("notifyCustomer")}
            </Button>
          </a>
        </div>
      </div>

      {/* Stage Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>{t("timeline")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <OrderStageTimeline stages={order.stages} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer + Pricing */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("customerInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                {order.customer.isVip && (
                  <Star className="h-4 w-4 text-accent fill-accent" />
                )}
                <Link
                  href={`/customers/${order.customer.id}`}
                  className="font-medium hover:text-accent"
                >
                  {order.customer.fullName}
                </Link>
              </div>
              <p className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                <Hash className="h-3 w-3" />
                {order.customer.customerCode}
              </p>
              <p className="text-sm flex items-center gap-1.5" dir="ltr">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono">{order.customer.phone}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {order.customer.city}
                {order.customer.district ? ` — ${order.customer.district}` : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {t("pricing")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <PriceRow
                label={t("estimatedPrice")}
                value={formatCurrency(
                  order.estimatedPrice,
                  locale as "ar" | "en",
                )}
              />
              {order.finalPrice !== null && (
                <PriceRow
                  label={t("finalPrice")}
                  value={formatCurrency(
                    order.finalPrice,
                    locale as "ar" | "en",
                  )}
                  bold
                />
              )}
              {order.deposit !== null && order.deposit > 0 && (
                <PriceRow
                  label={t("deposit")}
                  value={formatCurrency(order.deposit, locale as "ar" | "en")}
                />
              )}
              <PriceRow
                label={t("paid")}
                value={formatCurrency(
                  order.paidAmount,
                  locale as "ar" | "en",
                )}
                className="text-success"
              />
              <div className="border-t border-border pt-2 mt-2">
                <PriceRow
                  label={t("balance")}
                  value={formatCurrency(
                    Math.max(0, balanceDue),
                    locale as "ar" | "en",
                  )}
                  className={
                    balanceDue > 0 ? "text-warning font-bold" : "text-success font-bold"
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Specs + Description */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t("specifications")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <SpecItem
                icon={<Package className="h-3 w-3" />}
                label={t("category")}
                value={tCat(order.productCategory)}
              />
              <SpecItem
                icon={<Package className="h-3 w-3" />}
                label={t("productType")}
                value={order.productType}
              />
              {(order.width || order.height || order.depth) && (
                <SpecItem
                  icon={<Ruler className="h-3 w-3" />}
                  label={t("dimensions")}
                  value={`${order.width ?? "?"} × ${order.height ?? "?"} × ${order.depth ?? "?"} cm`}
                />
              )}
              {order.woodType && (
                <SpecItem
                  icon={<Package className="h-3 w-3" />}
                  label={t("woodType")}
                  value={order.woodType}
                />
              )}
              {order.color && (
                <SpecItem
                  icon={<Palette className="h-3 w-3" />}
                  label={t("color")}
                  value={order.color}
                />
              )}
              {order.finishType && (
                <SpecItem
                  icon={<Palette className="h-3 w-3" />}
                  label={t("finishType")}
                  value={order.finishType}
                />
              )}
              <SpecItem
                icon={<Calendar className="h-3 w-3" />}
                label={t("orderDate")}
                value={format(order.createdAt, "dd MMM yyyy", {
                  locale: dateLocale,
                })}
              />
              {order.estimatedDelivery && (
                <SpecItem
                  icon={<Calendar className="h-3 w-3" />}
                  label={t("estimatedDelivery")}
                  value={format(order.estimatedDelivery, "dd MMM yyyy", {
                    locale: dateLocale,
                  })}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("description")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {order.description}
              </p>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t("internalNotes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {order.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Phase 4 placeholders */}
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              📁 {t("filesPhase4Hint")}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PriceRow({
  label,
  value,
  bold,
  className,
}: {
  label: string;
  value: string;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-bold" : "font-medium"}>{value}</span>
    </div>
  );
}

function SpecItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
        {icon} {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
