import { setRequestLocale, getTranslations } from "next-intl/server";
import { Boxes, Plus, AlertTriangle } from "lucide-react";

import { requireUser } from "@/lib/auth-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function InventoryPage({
  params,
}: PageProps<"/[locale]/inventory">) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser(locale as "ar" | "en");

  const isAr = locale === "ar";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Boxes className="h-7 w-7 text-accent" />
            {isAr ? "المخزون" : "Inventory"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? "إدارة مواد الخام والمستلزمات" : "Manage raw materials and supplies"}
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4" />
          {isAr ? "إضافة مادة" : "Add Material"}
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="rounded-full bg-warning/10 p-5">
            <AlertTriangle className="h-10 w-10 text-warning" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {isAr ? "هذه الوحدة قيد التطوير" : "This module is under development"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              {isAr
                ? "وحدة المخزون ستتيح تتبع: الأخشاب، الدهانات، الأقفال، والمستلزمات — مع تنبيهات عند نقص المخزون."
                : "The inventory module will track: wood, paints, hardware, and supplies — with low-stock alerts."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
