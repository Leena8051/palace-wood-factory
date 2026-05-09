"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ClipboardList, MessageSquareWarning, Wrench } from "lucide-react";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { useLocale } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

interface OrderItem {
  id: string;
  orderNumber: string;
  status: string;
  productCategory: string;
  productType: string;
  estimatedPrice: number;
  finalPrice: number | null;
  createdAt: Date;
}

interface ComplaintItem {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  createdAt: Date;
}

interface MaintenanceItem {
  id: string;
  requestNumber: string;
  type: string;
  status: string;
  scheduledDate: Date | null;
  createdAt: Date;
}

interface Props {
  orders: OrderItem[];
  complaints: ComplaintItem[];
  maintenance: MaintenanceItem[];
  notes: string | null;
}

const statusVariant = (
  status: string,
): "secondary" | "info" | "warning" | "success" | "destructive" => {
  if (["DELIVERED", "COMPLETED", "RESOLVED", "CLOSED"].includes(status))
    return "success";
  if (["CANCELLED"].includes(status)) return "destructive";
  if (["READY", "APPROVED"].includes(status)) return "info";
  if (["NEW", "REQUESTED", "OPEN"].includes(status)) return "warning";
  return "secondary";
};

export function CustomerProfileTabs({
  orders,
  complaints,
  maintenance,
  notes,
}: Props) {
  const t = useTranslations("customers.tabs");
  const tStatus = useTranslations("orders.statuses");
  const locale = useLocale() as "ar" | "en";
  const dateLocale = locale === "ar" ? arLocale : undefined;

  return (
    <Tabs defaultValue="orders">
      <TabsList>
        <TabsTrigger value="orders">
          <ClipboardList className="h-4 w-4 me-1" />
          {t("orders")} ({orders.length})
        </TabsTrigger>
        <TabsTrigger value="complaints">
          <MessageSquareWarning className="h-4 w-4 me-1" />
          {t("complaints")} ({complaints.length})
        </TabsTrigger>
        <TabsTrigger value="maintenance">
          <Wrench className="h-4 w-4 me-1" />
          {t("maintenance")} ({maintenance.length})
        </TabsTrigger>
        <TabsTrigger value="notes">{t("notes")}</TabsTrigger>
      </TabsList>

      <TabsContent value="orders">
        {orders.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-6 w-6" />}
            title={t("noOrders")}
          />
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {o.orderNumber}
                    </span>
                    <Badge variant={statusVariant(o.status)} className="text-[10px]">
                      {tStatus(o.status)}
                    </Badge>
                  </div>
                  <p className="text-sm mt-1">{o.productType}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(o.createdAt, "dd MMM yyyy", { locale: dateLocale })}
                  </p>
                </div>
                <div className="text-end">
                  <p className="font-semibold text-sm">
                    {formatCurrency(o.finalPrice ?? o.estimatedPrice, locale)}
                  </p>
                  <Link href={`/orders/${o.id}`}>
                    <Button variant="ghost" size="sm" className="mt-1">
                      <ExternalLink className="h-3 w-3" />
                      {t("view")}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="complaints">
        {complaints.length === 0 ? (
          <EmptyState
            icon={<MessageSquareWarning className="h-6 w-6" />}
            title={t("noComplaints")}
          />
        ) : (
          <div className="space-y-2">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {c.ticketNumber}
                    </p>
                    <p className="font-medium mt-1">{c.title}</p>
                  </div>
                  <Badge variant={statusVariant(c.status)} className="text-[10px]">
                    {c.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="maintenance">
        {maintenance.length === 0 ? (
          <EmptyState
            icon={<Wrench className="h-6 w-6" />}
            title={t("noMaintenance")}
          />
        ) : (
          <div className="space-y-2">
            {maintenance.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {m.requestNumber}
                    </p>
                    <p className="text-sm mt-1">{m.type}</p>
                  </div>
                  <Badge variant={statusVariant(m.status)} className="text-[10px]">
                    {m.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="notes">
        {notes ? (
          <div className="rounded-lg border border-border bg-card p-4 whitespace-pre-wrap text-sm">
            {notes}
          </div>
        ) : (
          <EmptyState title={t("noNotes")} />
        )}
      </TabsContent>
    </Tabs>
  );
}
