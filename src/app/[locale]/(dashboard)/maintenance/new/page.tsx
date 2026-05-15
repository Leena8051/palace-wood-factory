import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, Wrench } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { listTechnicians } from "@/lib/maintenance/actions";
import { Button } from "@/components/ui/button";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";

export default async function NewMaintenancePage({
  params,
}: PageProps<"/[locale]/maintenance/new">) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser(locale as "ar" | "en");

  const t = await getTranslations({ locale, namespace: "maintenance" });

  const technicians = await listTechnicians();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/maintenance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="h-6 w-6 text-accent" />
            {t("addNew")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("addNewSubtitle")}
          </p>
        </div>
      </div>

      <MaintenanceForm technicians={technicians} />
    </div>
  );
}
