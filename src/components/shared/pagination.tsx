"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

interface Props {
  page: number;
  totalPages: number;
  total: number;
}

export function Pagination({ page, totalPages, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useTranslations("common");
  const locale = useLocale() as "ar" | "en";

  if (totalPages <= 1) {
    return (
      <p className="text-xs text-muted-foreground text-center py-2">
        {formatNumber(total, locale)} {t("results")}
      </p>
    );
  }

  const goto = (p: number) => {
    const newParams = new URLSearchParams(params.toString());
    if (p === 1) newParams.delete("page");
    else newParams.set("page", String(p));
    router.push(`${pathname}?${newParams.toString()}`);
  };

  // RTL: flip arrows visually but keep semantics (prev = older page)
  return (
    <div className="flex items-center justify-between gap-2 pt-2">
      <p className="text-xs text-muted-foreground">
        {formatNumber(total, locale)} {t("results")} • {t("page")}{" "}
        {formatNumber(page, locale)} / {formatNumber(totalPages, locale)}
      </p>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goto(page - 1)}
          disabled={page <= 1}
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          {t("previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goto(page + 1)}
          disabled={page >= totalPages}
        >
          {t("next")}
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
