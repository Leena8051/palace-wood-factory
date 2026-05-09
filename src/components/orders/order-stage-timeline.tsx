import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import {
  Pencil,
  Scissors,
  Wrench,
  PaintBucket,
  Truck,
  Check,
  Clock,
  Ban,
  CircleDashed,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StageItem {
  id: string;
  stageNumber: number;
  stageName: string;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
}

const STAGE_ICONS: Record<number, typeof Pencil> = {
  1: Pencil,
  2: Scissors,
  3: Wrench,
  4: PaintBucket,
  5: Truck,
};

const STATUS_DOT: Record<string, string> = {
  COMPLETED:   "bg-success text-success-foreground",
  IN_PROGRESS: "bg-accent text-accent-foreground animate-pulse",
  BLOCKED:     "bg-destructive text-destructive-foreground",
  PENDING:     "bg-muted text-muted-foreground",
};

const STATUS_LINE: Record<string, string> = {
  COMPLETED:   "bg-success",
  IN_PROGRESS: "bg-accent",
  BLOCKED:     "bg-destructive",
  PENDING:     "bg-border",
};

interface Props {
  stages: StageItem[];
}

export function OrderStageTimeline({ stages }: Props) {
  const t = useTranslations("orders.stages");
  const tStatus = useTranslations("orders.stageStatus");
  const locale = useLocale() as "ar" | "en";
  const dateLocale = locale === "ar" ? arLocale : undefined;

  return (
    <div className="space-y-1">
      {/* Desktop: horizontal */}
      <div className="hidden md:flex items-start">
        {stages.map((s, i) => {
          const Icon = STAGE_ICONS[s.stageNumber] ?? CircleDashed;
          const StatusIcon =
            s.status === "COMPLETED" ? Check
            : s.status === "BLOCKED" ? Ban
            : s.status === "IN_PROGRESS" ? Clock
            : null;
          return (
            <div key={s.id} className="flex-1 flex flex-col items-center relative">
              {/* connector line to next stage */}
              {i < stages.length - 1 && (
                <div
                  className={cn(
                    "absolute top-6 ltr:left-1/2 rtl:right-1/2 h-1 w-full",
                    STATUS_LINE[s.status] ?? STATUS_LINE.PENDING,
                  )}
                />
              )}
              <div
                className={cn(
                  "relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-card shadow-md",
                  STATUS_DOT[s.status] ?? STATUS_DOT.PENDING,
                )}
              >
                <Icon className="h-5 w-5" />
                {StatusIcon && (
                  <div className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-card">
                    <StatusIcon className="h-3 w-3" />
                  </div>
                )}
              </div>
              <div className="mt-2 text-center">
                <p className="text-xs font-semibold">{t(s.stageName)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {tStatus(s.status)}
                </p>
                {s.completedAt && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {format(s.completedAt, "dd MMM", { locale: dateLocale })}
                  </p>
                )}
                {s.startedAt && !s.completedAt && (
                  <p className="text-[10px] text-accent mt-0.5">
                    {format(s.startedAt, "dd MMM", { locale: dateLocale })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical */}
      <div className="md:hidden space-y-3">
        {stages.map((s, i) => {
          const Icon = STAGE_ICONS[s.stageNumber] ?? CircleDashed;
          return (
            <div key={s.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    STATUS_DOT[s.status] ?? STATUS_DOT.PENDING,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {i < stages.length - 1 && (
                  <div
                    className={cn(
                      "w-1 flex-1 mt-1",
                      STATUS_LINE[s.status] ?? STATUS_LINE.PENDING,
                    )}
                  />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{t(s.stageName)}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {tStatus(s.status)}
                  </span>
                </div>
                {s.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{s.notes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
