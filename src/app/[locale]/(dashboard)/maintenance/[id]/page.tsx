import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import {
  ArrowLeft,
  Wrench,
  User,
  Calendar,
  Hash,
  Link2,
  DollarSign,
  FileText,
  PenLine,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getMaintenanceById } from "@/lib/maintenance/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaintenanceStatusBadge } from "@/components/maintenance/maintenance-status-badge";
import { WarrantyBadge } from "@/components/maintenance/warranty-badge";
import { MaintenanceActions } from "@/components/maintenance/maintenance-actions";
import { formatCurrency } from "@/lib/utils";

export default async function MaintenanceDetailPage({
  params,
}: PageProps<"/[locale]/maintenance/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireUser(locale as "ar" | "en");

  const request = await getMaintenanceById(id);
  if (!request) notFound();

  const t = await getTranslations({ locale, namespace: "maintenance" });
  const tStatus = await getTranslations({ locale, namespace: "maintenance.statuses" });
  const tType = await getTranslations({ locale, namespace: "maintenance.types" });
  const tWarranty = await getTranslations({ locale, namespace: "maintenance.warranty" });

  const dateLocale = locale === "ar" ? arLocale : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/maintenance">
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight font-mono flex items-center gap-2">
                <Wrench className="h-5 w-5 text-accent" />
                {request.requestNumber}
              </h1>
              <MaintenanceStatusBadge
                status={request.status}
                label={tStatus(request.status)}
              />
              <span className="text-xs border border-border rounded-full px-2 py-0.5 text-muted-foreground">
                {tType(request.type)}
              </span>
              {request.warranty && (
                <WarrantyBadge
                  warranty={request.warranty}
                  labels={{
                    active: tWarranty("active"),
                    expired: tWarranty("expired"),
                    notDelivered: tWarranty("notDelivered"),
                  }}
                />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {format(request.createdAt, "dd MMM yyyy", { locale: dateLocale })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: info cards */}
        <div className="lg:col-span-1 space-y-4">
          {/* Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("table.actions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <MaintenanceActions
                id={request.id}
                status={request.status}
                estimatedCost={request.estimatedCost}
              />
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-accent" />
                {t("customerInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link
                href={`/customers/${request.customer.id}`}
                className="font-semibold hover:text-accent block"
              >
                {request.customer.fullName}
              </Link>
              <p className="text-muted-foreground font-mono text-xs" dir="ltr">
                {request.customer.phone}
              </p>
              {request.customer.city && (
                <p className="text-xs text-muted-foreground">
                  {request.customer.city}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Meta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Hash className="h-4 w-4 text-accent" />
                {t("requestInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              {/* Linked order */}
              {request.originalOrder ? (
                <div className="flex items-center gap-1.5">
                  <Link2 className="h-3 w-3" />
                  <Link
                    href={`/orders/${request.originalOrder.id}`}
                    className="font-mono hover:text-accent"
                  >
                    {request.originalOrder.orderNumber}
                  </Link>
                  {request.originalOrder.productType && (
                    <span>— {request.originalOrder.productType}</span>
                  )}
                </div>
              ) : (
                <p>{t("noLinkedOrder")}</p>
              )}

              {/* Scheduled */}
              {request.scheduledDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(request.scheduledDate, "dd MMM yyyy HH:mm", {
                      locale: dateLocale,
                    })}
                  </span>
                </div>
              )}

              {/* Technician */}
              <div className="flex items-center gap-1.5">
                <Wrench className="h-3 w-3" />
                <span>
                  {request.technician?.name ?? t("unassigned")}
                </span>
              </div>

              {/* Costs */}
              {request.estimatedCost !== null && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3" />
                  <span>
                    {t("estimatedCostLabel")}:{" "}
                    {formatCurrency(request.estimatedCost, locale as "ar" | "en")}
                  </span>
                </div>
              )}
              {request.finalCost !== null && (
                <div className="flex items-center gap-1.5 text-success font-semibold">
                  <DollarSign className="h-3 w-3" />
                  <span>
                    {t("finalCostLabel")}:{" "}
                    {formatCurrency(request.finalCost, locale as "ar" | "en")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: issue + notes + signature */}
        <div className="lg:col-span-2 space-y-4">
          {/* Reported issue */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                {t("fields.reportedIssue")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {request.reportedIssue}
              </p>
            </CardContent>
          </Card>

          {/* Additional description */}
          {request.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {t("fields.description")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {request.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Completion info */}
          {request.status === "COMPLETED" && (
            <>
              {request.notes && (
                <Card className="border-success/30 bg-success/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-success">
                      {t("completionNotes")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {request.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
              {request.customerSignature && (
                <Card className="border-success/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <PenLine className="h-4 w-4 text-accent" />
                      {t("customerSignatureLabel")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={request.customerSignature}
                      alt="Customer signature"
                      className="max-h-[150px] rounded-lg border border-border bg-white object-contain"
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Cancellation reason */}
          {request.status === "CANCELLED" && request.notes && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-destructive">
                  {t("cancelReasonLabel")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{request.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
