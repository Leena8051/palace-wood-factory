import { setRequestLocale, getTranslations } from "next-intl/server";
import { LayoutGrid, Plus, AlertTriangle } from "lucide-react";

import { requireUser } from "@/lib/auth-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ProductsPage({
  params,
}: PageProps<"/[locale]/products">) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser(locale as "ar" | "en");

  const isAr = locale === "ar";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <LayoutGrid className="h-7 w-7 text-accent" />
            {isAr ? "المنتجات" : "Products"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? "كتالوج المنتجات القياسية" : "Standard product catalog"}
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4" />
          {isAr ? "إضافة منتج" : "Add Product"}
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
                ? "كتالوج المنتجات سيتيح تعريف المنتجات القياسية مع صور ومواصفات وأسعار ابتدائية — لتسريع إنشاء الطلبات."
                : "The product catalog will let you define standard products with photos, specs and base prices — to speed up order creation."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
