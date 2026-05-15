import { setRequestLocale, getTranslations } from "next-intl/server";
import { CreditCard, TrendingUp, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";

import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Pagination } from "@/components/shared/pagination";
import { formatCurrency } from "@/lib/utils";

interface SearchParams { page?: string; method?: string; type?: string }

export default async function PaymentsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/payments">) {
  const { locale } = await params;
  const sp = (await searchParams) as SearchParams;
  setRequestLocale(locale);
  await requireUser(locale as "ar" | "en");

  const t = await getTranslations({ locale, namespace: "payments" });
  const tNav = await getTranslations({ locale, namespace: "navigation" });
  const tOrder = await getTranslations({ locale, namespace: "orders.payments" });

  const page = Math.max(1, Number(sp.page ?? 1));
  const pageSize = 20;
  const dateLocale = locale === "ar" ? arLocale : undefined;

  const where = {
    ...(sp.method ? { method: sp.method } : {}),
    ...(sp.type ? { type: sp.type } : {}),
  };

  const [items, total, totalAmount, thisMonthAmount] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { paidAt: "desc" },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customer: { select: { id: true, fullName: true } },
          },
        },
        receivedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        paidAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const TYPE_COLORS: Record<string, string> = {
    DEPOSIT: "text-info",
    INSTALLMENT: "text-accent",
    FINAL: "text-success",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-7 w-7 text-accent" />
          {tNav("payments")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
              {t("stats.totalCollected")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              {formatCurrency(totalAmount._sum.amount ?? 0, locale as "ar" | "en")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal uppercase tracking-wide flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {t("stats.thisMonth")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">
              {formatCurrency(thisMonthAmount._sum?.amount ?? 0, locale as "ar" | "en")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
              {t("stats.totalTransactions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
              {t("stats.avgTransaction")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {total > 0
                ? formatCurrency(
                    (totalAmount._sum.amount ?? 0) / total,
                    locale as "ar" | "en",
                  )
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <form method="GET" className="flex flex-wrap gap-3 items-center">
          <select
            name="type"
            defaultValue={sp.type ?? ""}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">{t("filters.allTypes")}</option>
            {["DEPOSIT", "INSTALLMENT", "FINAL"].map((tt) => (
              <option key={tt} value={tt}>{tOrder(`types.${tt}`)}</option>
            ))}
          </select>
          <select
            name="method"
            defaultValue={sp.method ?? ""}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">{t("filters.allMethods")}</option>
            {["CASH", "BANK_TRANSFER", "CARD", "CHECK"].map((m) => (
              <option key={m} value={m}>{tOrder(`methods.${m}`)}</option>
            ))}
          </select>
          {(sp.type || sp.method) && (
            <Link href="/payments">
              <button type="button" className="text-xs text-muted-foreground hover:text-destructive">
                ✕ {t("filters.clear")}
              </button>
            </Link>
          )}
        </form>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.number")}</TableHead>
              <TableHead>{t("table.order")}</TableHead>
              <TableHead>{t("table.customer")}</TableHead>
              <TableHead>{t("table.type")}</TableHead>
              <TableHead>{t("table.method")}</TableHead>
              <TableHead>{t("table.amount")}</TableHead>
              <TableHead>{t("table.date")}</TableHead>
              <TableHead>{t("table.recordedBy")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableEmpty colSpan={8}>
                <EmptyState
                  icon={<CreditCard className="h-6 w-6" />}
                  title={t("emptyTitle")}
                  description={t("emptyDescription")}
                />
              </TableEmpty>
            ) : (
              items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.paymentNumber}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/orders/${p.order?.id}`}
                      className="font-mono text-sm font-medium hover:text-accent flex items-center gap-1"
                    >
                      {p.order?.orderNumber}
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/customers/${p.order?.customer.id}`}
                      className="text-sm hover:text-accent"
                    >
                      {p.order?.customer.fullName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium ${TYPE_COLORS[p.type] ?? ""}`}>
                      {tOrder(`types.${p.type}`)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {tOrder(`methods.${p.method}`)}
                  </TableCell>
                  <TableCell className="font-semibold text-success">
                    {formatCurrency(p.amount, locale as "ar" | "en")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(p.paidAt, "dd MMM yyyy", { locale: dateLocale })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.receivedBy?.name ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Pagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}
