import { setRequestLocale, getTranslations } from "next-intl/server";
import { Plus, ClipboardList, Star, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";

import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { listOrders } from "@/lib/orders/queries";
import { Button } from "@/components/ui/button";
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
import { OrdersFilters } from "@/components/orders/orders-filters";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderPriorityBadge } from "@/components/orders/order-priority-badge";
import { Pagination } from "@/components/shared/pagination";
import { formatCurrency } from "@/lib/utils";

interface SearchParams {
  q?: string;
  status?: string;
  priority?: string;
  category?: string;
  page?: string;
}

export default async function OrdersPage({
  params,
  searchParams,
}: PageProps<"/[locale]/orders">) {
  const { locale } = await params;
  const sp = (await searchParams) as SearchParams;
  setRequestLocale(locale);
  await requireUser(locale as "ar" | "en");

  const t = await getTranslations({ locale, namespace: "orders" });
  const tNav = await getTranslations({ locale, namespace: "navigation" });
  const tStatus = await getTranslations({ locale, namespace: "orders.statuses" });
  const tPriority = await getTranslations({ locale, namespace: "orders.priorities" });
  const tCat = await getTranslations({ locale, namespace: "orders.categories" });

  const page = Number(sp.page ?? 1);
  const dateLocale = locale === "ar" ? arLocale : undefined;

  const { items, total, totalPages } = await listOrders({
    search: sp.q,
    status: sp.status,
    priority: sp.priority,
    category: sp.category,
    page,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-accent" />
            {tNav("orders")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("listSubtitle")}
          </p>
        </div>
        <Link href="/orders/new">
          <Button>
            <Plus className="h-4 w-4" />
            {t("addNew")}
          </Button>
        </Link>
      </div>

      <Card className="p-4">
        <OrdersFilters />
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.orderNumber")}</TableHead>
              <TableHead>{t("table.customer")}</TableHead>
              <TableHead>{t("table.product")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.priority")}</TableHead>
              <TableHead>{t("table.price")}</TableHead>
              <TableHead>{t("table.created")}</TableHead>
              <TableHead className="text-end">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableEmpty colSpan={8}>
                <EmptyState
                  icon={<ClipboardList className="h-6 w-6" />}
                  title={t("emptyTitle")}
                  description={t("emptyDescription")}
                  action={
                    <Link href="/orders/new">
                      <Button>
                        <Plus className="h-4 w-4" />
                        {t("addNew")}
                      </Button>
                    </Link>
                  }
                />
              </TableEmpty>
            ) : (
              items.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link
                      href={`/orders/${o.id}`}
                      className="font-mono text-sm font-medium hover:text-accent"
                    >
                      {o.orderNumber}
                    </Link>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {tCat(o.productCategory)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {o.customer.isVip && (
                        <Star className="h-3.5 w-3.5 text-accent fill-accent shrink-0" />
                      )}
                      <Link
                        href={`/customers/${o.customer.id}`}
                        className="hover:text-accent text-sm"
                      >
                        {o.customer.fullName}
                      </Link>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5" dir="ltr">
                      {o.customer.phone}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="text-sm truncate">{o.productType}</p>
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} label={tStatus(o.status)} />
                  </TableCell>
                  <TableCell>
                    <OrderPriorityBadge
                      priority={o.priority}
                      label={tPriority(o.priority)}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="font-semibold">
                      {formatCurrency(
                        o.finalPrice ?? o.estimatedPrice,
                        locale as "ar" | "en",
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(o.createdAt, "dd MMM yyyy", { locale: dateLocale })}
                  </TableCell>
                  <TableCell className="text-end">
                    <Link href={`/orders/${o.id}`}>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
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
