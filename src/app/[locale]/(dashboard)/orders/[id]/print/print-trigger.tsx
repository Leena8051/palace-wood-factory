"use client";

import { useTranslations } from "next-intl";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintTrigger() {
  const t = useTranslations("orders.invoice");
  return (
    <div className="no-print max-w-[210mm] mx-auto mb-4 flex justify-end gap-2">
      <Button variant="outline" onClick={() => window.close()}>
        <X className="h-4 w-4" />
        {t("close")}
      </Button>
      <Button onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        {t("print")}
      </Button>
    </div>
  );
}
