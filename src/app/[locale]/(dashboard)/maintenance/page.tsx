import { setRequestLocale, getTranslations } from "next-intl/server";
import { Plus, Wrench, ExternalLink, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";

import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { listMaintenance } from "@/lib/maintenance/queries";
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
import { MaintenanceStatusBadge } from "@/components/maintenance/maintenance-status-badge";
import { Pagination } from "@/components/shared/pagination";

interface SearchParams {
  q?: string;
  status?: string;
  type?: string;
  page?: string;
}

export default async function MaintenancePage({
  params,
  searchParams,
}: PageProps<"/[locale]/maintenance">) {
  const { locale } = await params;
  const sp = (await searchParams) as SearchParams;
  setRequestLocale(locale);
  await requireUser(locale as "ar" | "en");

  const t = await getTranslations({ locale, namespace: "maintenance" });
  const tNav = await getTranslations({ locale, namespace: "navigation" });
  const tStatus = await getTranslations({ locale, namespace: "maintenance.statuses" });
  const tType = await getTranslations({ locale, namespace: "maintenance.types" });

  const page = Number(sp.page ?? 1);
  const dateLocale = locale === "ar" ? arLocale : undefined;

  const { items, total, totalPages } = await listMaintenance({
    search: sp.q,
    status: sp.status,
    type: sp.type,
    page,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="h-7 w-7 text-accent" />
            {tNav("maintenance")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("listSubtitle")}
          </p>
        </div>
        <Link href="/maintenance/new">
          <Button>
            <Plus className="h-4 w-4" />
            {t("addNew")}
          </Button>
        </Link>
      </div>

      {/* Filters (inline, simple) */}
      <Card className="p-4">
        <form method="GET" className="flex flex-wrap gap-3 items-center">
          <input
            name="q"
            defaultValue={sp.q}
            placeholder={t("filters.searchPlaceholder")}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring flex-1 min-w-[200px]"
          />
          <select
            name="status"
            defaultValue={sp.status ?? ""}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">{t("filters.allStatuses")}</option>
            {["REQUESTED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => (
              <option key={s} value={s}>{tStatus(s)}</option>
            ))}
          </select>
          <select
            name="type"
            defaultValue={sp.type ?? ""}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">{t("filters.allTypes")}</option>
            {["WARRANTY", "PAID", "FREE_GOODWILL"].map((tt) => (
              <option key={tt} value={tt}>{tType(tt)}</option>
            ))}
          </select>
          <Button type="submit" variant="secondary" size="sm">
            {t("filters.clear")}
          </Button>
          {(sp.q || sp.status || sp.type) && (
            <Link href="/maintenance">
              <Button type="button" variant="ghost" size="sm">
                ✕
              </Button>
            </Link>
          )}
        </form>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.requestNumber")}</TableHead>
              <TableHead>{t("table.customer")}</TableHead>
              <TableHead>{t("table.type")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.scheduled")}</TableHead>
              <TableHead>{t("table.technician")}</TableHead>
              <TableHead className="text-end">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableEmpty colSpan={7}>
                <EmptyState
                  icon={<Wrench className="h-6 w-6" />}
                  title={t("emptyTitle")}
                  description={t("emptyDescription")}
                  action={
                    <Link href="/maintenance/new">
                      <Button>
                        <Plus className="h-4 w-4" />
                        {t("addNew")}
                      </Button>
                    </Link>
                  }
                />
              </TableEmpty>
            ) : (
              items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <Link
                      href={`/maintenance/${m.id}`}
                      className="font-mono text-sm font-medium hover:text-accent"
                    >
                      {m.requestNumber}
                    </Link>
                    {m.originalOrder && (
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        ↳ {m.originalOrder.orderNumber}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/customers/${m.customer.id}`}
                      className="text-sm hover:text-accent"
                    >
                      {m.customer.fullName}
                    </Link>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5" dir="ltr">
                      {m.customer.phone}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{tType(m.type)}</TableCell>
                  <TableCell>
                    <MaintenanceStatusBadge
                      status={m.status}
                      label={tStatus(m.status)}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {m.scheduledDate ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(m.scheduledDate, "dd MMM yyyy HH:mm", {
                          locale: dateLocale,
                        })}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {m.technician?.name ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-end">
                    <Link href={`/maintenance/${m.id}`}>
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
