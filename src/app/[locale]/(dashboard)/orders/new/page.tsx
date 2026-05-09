import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { OrderWizard } from "@/components/orders/order-wizard";
import { requireUser } from "@/lib/auth-helpers";

export default async function NewOrderPage({
  params,
}: PageProps<"/[locale]/orders/new">) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser(locale as "ar" | "en");

  const t = await getTranslations({ locale, namespace: "orders" });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-accent" />
            {t("addNew")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("addNewSubtitle")}</p>
        </div>
      </div>

      <OrderWizard />
    </div>
  );
}
