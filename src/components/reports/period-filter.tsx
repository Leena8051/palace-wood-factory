"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

const PERIODS = ["month", "3m", "6m", "year"] as const;

export function PeriodFilter({ current }: { current: string }) {
  const t = useTranslations("reports.periods");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const set = (period: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1 gap-1">
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => set(p)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
            current === p
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t(p)}
        </button>
      ))}
    </div>
  );
}
