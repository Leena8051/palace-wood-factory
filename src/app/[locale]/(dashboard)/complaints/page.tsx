import { setRequestLocale, getTranslations } from "next-intl/server";
import { Plus, MessageCircleWarning } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { listComplaints } from "@/lib/complaints/queries";
import { Button } from "@/components/ui/button";
import { ComplaintsBoard } from "@/components/complaints/complaints-board";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ComplaintsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/complaints">) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  await requireUser(locale as "ar" | "en");

  const t = await getTranslations({ locale, namespace: "complaints" });
  const tNav = await getTranslations({ locale, namespace: "navigation" });

  const complaints = await listComplaints({
    search: sp.q as string | undefined,
    status: sp.status as string | undefined,
    category: sp.category as string | undefined,
    priority: sp.priority as string | undefined,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageCircleWarning className="h-7 w-7 text-accent" />
            {tNav("complaints")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("listSubtitle")}
          </p>
        </div>
        <Link href="/complaints/new">
          <Button>
            <Plus className="h-4 w-4" />
            {t("addNew")}
          </Button>
        </Link>
      </div>

      {/* Kanban board */}
      {complaints.length === 0 ? (
        <EmptyState
          icon={<MessageCircleWarning className="h-6 w-6" />}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Link href="/complaints/new">
              <Button>
                <Plus className="h-4 w-4" />
                {t("addNew")}
              </Button>
            </Link>
          }
        />
      ) : (
        <ComplaintsBoard complaints={complaints} />
      )}
    </div>
  );
}
