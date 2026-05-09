import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/components/customers/customer-form";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import type { CustomerType, CustomerSource } from "@/lib/constants";

export default async function EditCustomerPage({
  params,
}: PageProps<"/[locale]/customers/[id]/edit">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireUser(locale as "ar" | "en");

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  const t = await getTranslations({ locale, namespace: "customers" });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/customers/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Pencil className="h-6 w-6 text-accent" />
            {t("editTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {customer.fullName} • {customer.customerCode}
          </p>
        </div>
      </div>

      <CustomerForm
        mode="edit"
        customerId={id}
        initial={{
          fullName: customer.fullName,
          phone: customer.phone,
          whatsapp: customer.whatsapp ?? "",
          email: customer.email ?? "",
          city: customer.city,
          district: customer.district ?? "",
          address: customer.address ?? "",
          customerType: customer.customerType as CustomerType,
          companyName: customer.companyName ?? "",
          notes: customer.notes ?? "",
          source: customer.source as CustomerSource,
          isVip: customer.isVip,
        }}
      />
    </div>
  );
}
