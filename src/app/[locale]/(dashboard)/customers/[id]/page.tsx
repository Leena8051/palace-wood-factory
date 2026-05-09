import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Building2,
  Star,
  Calendar,
  Hash,
} from "lucide-react";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";

import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getCustomerById } from "@/lib/customers/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerProfileTabs } from "@/components/customers/customer-profile-tabs";

export default async function CustomerProfilePage({
  params,
}: PageProps<"/[locale]/customers/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireUser(locale as "ar" | "en");

  const customer = await getCustomerById(id);
  if (!customer) notFound();

  const t = await getTranslations({ locale, namespace: "customers" });
  const tFields = await getTranslations({
    locale,
    namespace: "customers.fields",
  });
  const tSources = await getTranslations({
    locale,
    namespace: "customers.sources",
  });

  const dateLocale = locale === "ar" ? arLocale : undefined;
  const wa = (customer.whatsapp || customer.phone).replace(/\D/g, "");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              {customer.isVip && (
                <Star className="h-5 w-5 text-accent fill-accent" />
              )}
              <h1 className="text-2xl font-bold tracking-tight">
                {customer.fullName}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Hash className="h-3 w-3" />
              <span className="font-mono">{customer.customerCode}</span>
              <span>•</span>
              <span>{tSources(customer.source)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">
            <Button variant="outline" className="text-success border-success/40">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </a>
          <Link href={`/customers/${customer.id}/edit`}>
            <Button>
              <Pencil className="h-4 w-4" />
              {t("edit")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Info card */}
      <Card>
        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoItem
            icon={<Phone className="h-4 w-4" />}
            label={tFields("phone")}
            value={<span className="font-mono" dir="ltr">{customer.phone}</span>}
          />
          {customer.whatsapp && (
            <InfoItem
              icon={<MessageCircle className="h-4 w-4 text-success" />}
              label={tFields("whatsapp")}
              value={<span className="font-mono" dir="ltr">{customer.whatsapp}</span>}
            />
          )}
          {customer.email && (
            <InfoItem
              icon={<Mail className="h-4 w-4" />}
              label={tFields("email")}
              value={<span dir="ltr">{customer.email}</span>}
            />
          )}
          <InfoItem
            icon={<MapPin className="h-4 w-4" />}
            label={tFields("city")}
            value={
              <>
                {customer.city}
                {customer.district ? ` — ${customer.district}` : ""}
              </>
            }
          />
          {customer.customerType === "COMPANY" && (
            <InfoItem
              icon={<Building2 className="h-4 w-4" />}
              label={tFields("companyName")}
              value={customer.companyName ?? "—"}
            />
          )}
          <InfoItem
            icon={<Calendar className="h-4 w-4" />}
            label={tFields("joinedAt")}
            value={format(customer.createdAt, "dd MMM yyyy", {
              locale: dateLocale,
            })}
          />
          {customer.address && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-muted-foreground mb-1">
                {tFields("address")}
              </p>
              <p className="text-sm">{customer.address}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatPill
          label={t("tabs.orders")}
          value={customer._count.orders}
          accent
        />
        <StatPill
          label={t("tabs.complaints")}
          value={customer._count.complaints}
          variant={customer._count.complaints > 0 ? "warning" : "default"}
        />
        <StatPill
          label={t("tabs.maintenance")}
          value={customer._count.maintenance}
        />
      </div>

      {/* Tabs */}
      <CustomerProfileTabs
        orders={customer.orders.map((o) => ({
          ...o,
          estimatedPrice: Number(o.estimatedPrice),
          finalPrice: o.finalPrice !== null ? Number(o.finalPrice) : null,
        }))}
        complaints={customer.complaints}
        maintenance={customer.maintenance}
        notes={customer.notes}
      />
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function StatPill({
  label,
  value,
  accent,
  variant,
}: {
  label: string;
  value: number;
  accent?: boolean;
  variant?: "warning" | "default";
}) {
  const bg =
    variant === "warning"
      ? "bg-warning/10 text-warning"
      : accent
      ? "bg-accent/10 text-accent"
      : "bg-secondary text-secondary-foreground";
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Badge className={`text-base px-3 py-1 ${bg}`}>{value}</Badge>
      </CardContent>
    </Card>
  );
}
