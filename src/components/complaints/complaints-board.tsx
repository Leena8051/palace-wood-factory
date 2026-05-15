"use client";

import { useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { Star, MessageSquare, AlertCircle, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { OrderPriorityBadge } from "@/components/orders/order-priority-badge";
import { COMPLAINT_STATUSES } from "@/lib/constants";
import { updateComplaintStatus } from "@/lib/complaints/actions";
import { cn } from "@/lib/utils";

interface ComplaintItem {
  id: string;
  ticketNumber: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: Date;
  customer: { id: string; fullName: string; isVip: boolean };
  order: { orderNumber: string } | null;
  _count: { responses: number };
}

interface Props {
  complaints: ComplaintItem[];
}

const COLUMN_TINTS: Record<string, string> = {
  OPEN:        "bg-warning/5 border-warning/20",
  IN_PROGRESS: "bg-info/5 border-info/20",
  RESOLVED:    "bg-success/5 border-success/20",
  CLOSED:      "bg-muted/50 border-border",
};

export function ComplaintsBoard({ complaints }: Props) {
  const t = useTranslations("complaints");
  const tStatus = useTranslations("complaints.statuses");
  const tCat = useTranslations("complaints.categories");
  const tPriority = useTranslations("orders.priorities");
  const locale = useLocale() as "ar" | "en";
  const dateLocale = locale === "ar" ? arLocale : undefined;
  const [isPending, startTransition] = useTransition();

  const move = (id: string, status: string) => {
    startTransition(async () => {
      const res = await updateComplaintStatus(id, status);
      if (res.ok) toast.success(t("statusUpdated"));
      else toast.error(res.error);
    });
  };

  const grouped: Record<string, ComplaintItem[]> = {
    OPEN: [],
    IN_PROGRESS: [],
    RESOLVED: [],
    CLOSED: [],
  };
  for (const c of complaints) {
    (grouped[c.status] ??= []).push(c);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COMPLAINT_STATUSES.map((status) => {
        const items = grouped[status] ?? [];
        return (
          <div
            key={status}
            className={cn(
              "rounded-xl border-2 border-dashed p-3 min-h-[200px] flex flex-col gap-3",
              COLUMN_TINTS[status],
            )}
          >
            <div className="flex items-center justify-between sticky top-0">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                {status === "OPEN" && <AlertCircle className="h-4 w-4 text-warning" />}
                {tStatus(status)}
              </h3>
              <Badge variant="outline" className="text-[10px]">
                {items.length}
              </Badge>
            </div>

            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center mt-4">
                —
              </p>
            ) : (
              items.map((c) => {
                const idx = COMPLAINT_STATUSES.indexOf(status);
                const next = COMPLAINT_STATUSES[idx + 1];
                const prev = COMPLAINT_STATUSES[idx - 1];

                return (
                  <div
                    key={c.id}
                    className="rounded-lg bg-card border border-border shadow-sm p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/complaints/${c.id}`}
                        className="font-mono text-[10px] text-muted-foreground hover:text-accent"
                      >
                        {c.ticketNumber}
                      </Link>
                      <OrderPriorityBadge
                        priority={c.priority}
                        label={tPriority(c.priority)}
                        showIcon={false}
                        className="text-[9px] py-0"
                      />
                    </div>
                    <Link
                      href={`/complaints/${c.id}`}
                      className="block mt-1 font-medium text-sm hover:text-accent line-clamp-2"
                    >
                      {c.title}
                    </Link>
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      {c.customer.isVip && (
                        <Star className="h-3 w-3 text-accent fill-accent" />
                      )}
                      <span className="truncate">{c.customer.fullName}</span>
                    </div>
                    {c.order && (
                      <p className="text-[10px] text-muted-foreground font-mono mt-1">
                        ↳ {c.order.orderNumber}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{tCat(c.category)}</span>
                      <span>
                        {format(c.createdAt, "dd MMM", { locale: dateLocale })}
                      </span>
                    </div>
                    {c._count.responses > 0 && (
                      <p className="mt-1 text-[10px] text-info flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {c._count.responses}
                      </p>
                    )}
                    {/* Move buttons */}
                    <div className="mt-2 pt-2 border-t border-border flex justify-between gap-1">
                      {prev ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => move(c.id, prev)}
                          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                          title={tStatus(prev)}
                        >
                          {isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ChevronRight className="h-3 w-3 rtl:hidden" />
                          )}
                          <ChevronLeft className="h-3 w-3 ltr:hidden" />
                          {tStatus(prev)}
                        </button>
                      ) : (
                        <span />
                      )}
                      {next && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => move(c.id, next)}
                          className="text-[10px] text-accent hover:underline flex items-center gap-1"
                          title={tStatus(next)}
                        >
                          {tStatus(next)}
                          {isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ChevronLeft className="h-3 w-3 rtl:hidden" />
                          )}
                          <ChevronRight className="h-3 w-3 ltr:hidden" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}
