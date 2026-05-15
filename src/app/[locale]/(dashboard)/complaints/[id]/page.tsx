import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import {
  ArrowLeft,
  MessageCircleWarning,
  Star,
  User,
  Hash,
  Calendar,
  Tag,
  Link2,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getComplaintById } from "@/lib/complaints/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComplaintStatusBadge } from "@/components/complaints/complaint-status-badge";
import { OrderPriorityBadge } from "@/components/orders/order-priority-badge";
import { ResponseThread } from "@/components/complaints/response-thread";
import { ResolveButton } from "@/components/complaints/resolve-button";

export default async function ComplaintDetailPage({
  params,
}: PageProps<"/[locale]/complaints/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireUser(locale as "ar" | "en");

  const complaint = await getComplaintById(id);
  if (!complaint) notFound();

  const t = await getTranslations({ locale, namespace: "complaints" });
  const tStatus = await getTranslations({ locale, namespace: "complaints.statuses" });
  const tCat = await getTranslations({ locale, namespace: "complaints.categories" });
  const tPriority = await getTranslations({ locale, namespace: "orders.priorities" });

  const dateLocale = locale === "ar" ? arLocale : undefined;
  const canResolve =
    complaint.status === "OPEN" || complaint.status === "IN_PROGRESS";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/complaints">
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <MessageCircleWarning className="h-5 w-5 text-accent" />
                {complaint.ticketNumber}
              </h1>
              <ComplaintStatusBadge
                status={complaint.status}
                label={tStatus(complaint.status)}
              />
              <OrderPriorityBadge
                priority={complaint.priority}
                label={tPriority(complaint.priority)}
              />
            </div>
            <p className="text-lg font-semibold mt-1">{complaint.title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {tCat(complaint.category)}
            </p>
          </div>
        </div>
        {canResolve && <ResolveButton complaintId={complaint.id} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: info cards */}
        <div className="lg:col-span-1 space-y-4">
          {/* Customer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-accent" />
                {t("fields.customer")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-1.5">
                {complaint.customer.isVip && (
                  <Star className="h-3.5 w-3.5 text-accent fill-accent shrink-0" />
                )}
                <Link
                  href={`/customers/${complaint.customer.id}`}
                  className="font-semibold hover:text-accent"
                >
                  {complaint.customer.fullName}
                </Link>
              </div>
              <p className="text-muted-foreground font-mono text-xs" dir="ltr">
                {complaint.customer.phone}
              </p>
            </CardContent>
          </Card>

          {/* Meta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="h-4 w-4 text-accent" />
                {t("fields.category")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {complaint.ticketNumber}
                </span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(complaint.createdAt, "dd MMM yyyy", { locale: dateLocale })}
                </span>
              </div>
              {complaint.order && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Link2 className="h-3 w-3 text-muted-foreground" />
                  <Link
                    href={`/orders/${complaint.order.id}`}
                    className="font-mono hover:text-accent"
                  >
                    {complaint.order.orderNumber}
                  </Link>
                  {complaint.order.productType && (
                    <span className="text-muted-foreground">
                      — {complaint.order.productType}
                    </span>
                  )}
                </div>
              )}
              {complaint.assignedTo && (
                <p className="text-xs text-muted-foreground">
                  {t("assignedTo")}: {complaint.assignedTo.name}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Resolution (if resolved) */}
          {complaint.status === "RESOLVED" && complaint.resolution && (
            <Card className="border-success/30 bg-success/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-success">
                  ✓ {t("resolution")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="whitespace-pre-wrap leading-relaxed">
                  {complaint.resolution}
                </p>
                {complaint.resolvedAt && (
                  <p className="text-xs text-muted-foreground">
                    {format(complaint.resolvedAt, "dd MMM yyyy HH:mm", {
                      locale: dateLocale,
                    })}
                    {complaint.resolvedBy && ` · ${complaint.resolvedBy.name}`}
                  </p>
                )}
                {complaint.rating && (
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-4 w-4 ${
                          n <= complaint.rating!
                            ? "text-accent fill-accent"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: description + thread */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("fields.description")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </p>
            </CardContent>
          </Card>

          {/* Response thread */}
          <Card>
            <CardContent className="pt-6">
              <ResponseThread
                complaintId={complaint.id}
                responses={complaint.responses}
                canRespond={complaint.status !== "CLOSED"}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
