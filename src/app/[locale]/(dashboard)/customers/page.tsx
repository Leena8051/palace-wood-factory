import { setRequestLocale, getTranslations } from "next-intl/server";
import { Plus, Users, Star, Phone, Building2, Download } from "lucide-react";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";

import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { listCustomers, getDistinctCities } from "@/lib/customers/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { CustomersFilters } from "@/components/customers/customers-filters";
import { CustomerRowActions } from "@/components/customers/customer-row-actions";
import { Pagination } from "@/components/shared/pagination";
import { formatNumber } from "@/lib/utils";

interface SearchParams {
  q?: string;
  city?: string;
  type?: "INDIVIDUAL" | "COMPANY";
  vip?: string;
  source?: string;
  page?: string;
}

export default async function CustomersPage({
  params,
  searchParams,
}: PageProps<"/[locale]/customers">) {
  const { locale } = await params;
  const sp = (await searchParams) as SearchParams;
  setRequestLocale(locale);
  await requireUser(locale as "ar" | "en");

  const t = await getTranslations({ locale, namespace: "customers" });
  const tNav = await getTranslations({ locale, namespace: "navigation" });

  const page = Number(sp.page ?? 1);
  const dateLocale = locale === "ar" ? arLocale : undefined;

  const [{ items, total, totalPages }, cities] = await Promise.all([
    listCustomers({
      search: sp.q,
      city: sp.city,
      type: sp.type,
      vipOnly: sp.vip === "1",
      source: sp.source,
      page,
    }),
    getDistinctCities(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-accent" />
            {tNav("customers")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("listSubtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/${locale}/customers/export`}>
            <Button variant="outline">
              <Download className="h-4 w-4" />
              {t("exportCsv")}
            </Button>
          </a>
          <Link href="/customers/new">
            <Button>
              <Plus className="h-4 w-4" />
              {t("addNew")}
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-4">
        <CustomersFilters cities={cities} />
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.code")}</TableHead>
              <TableHead>{t("table.name")}</TableHead>
              <TableHead>{t("table.phone")}</TableHead>
              <TableHead>{t("table.city")}</TableHead>
              <TableHead>{t("table.orders")}</TableHead>
              <TableHead>{t("table.lastOrder")}</TableHead>
              <TableHead>{t("table.source")}</TableHead>
              <TableHead className="text-end">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableEmpty colSpan={8}>
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title={t("emptyTitle")}
                  description={t("emptyDescription")}
                  action={
                    <Link href="/customers/new">
                      <Button>
                        <Plus className="h-4 w-4" />
                        {t("addNew")}
                      </Button>
                    </Link>
                  }
                />
              </TableEmpty>
            ) : (
              items.map((c) => {
                const lastOrder = c.orders[0];
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {c.isVip && (
                          <Star className="h-4 w-4 text-accent fill-accent" />
                        )}
                        <span className="font-mono text-xs">
                          {c.customerCode}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/customers/${c.id}`}
                        className="font-medium hover:text-accent"
                      >
                        {c.fullName}
                      </Link>
                      {c.customerType === "COMPANY" && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3" />
                          {c.companyName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm" dir="ltr">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono">{c.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>{c.city}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {formatNumber(c._count.orders, locale as "ar" | "en")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {lastOrder
                        ? format(lastOrder.createdAt, "dd MMM yyyy", {
                            locale: dateLocale,
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {t(`sources.${c.source}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <CustomerRowActions
                        customerId={c.id}
                        customerName={c.fullName}
                        whatsapp={c.whatsapp}
                        phone={c.phone}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Pagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}
