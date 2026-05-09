"use client";

import { useTransition } from "react";
import { Pencil, Trash2, ExternalLink, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { deleteCustomer } from "@/lib/customers/actions";

interface Props {
  customerId: string;
  customerName: string;
  whatsapp?: string | null;
  phone: string;
}

export function CustomerRowActions({
  customerId,
  customerName,
  whatsapp,
  phone,
}: Props) {
  const t = useTranslations("common");
  const tC = useTranslations("customers");
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    if (
      !confirm(
        `${tC("confirmDelete")} "${customerName}"؟`,
      )
    )
      return;
    startTransition(async () => {
      const res = await deleteCustomer(customerId);
      if (res.ok) toast.success(tC("deleted"));
      else toast.error(res.error);
    });
  };

  // WhatsApp deep link (mock — opens whatsapp web)
  const wa = (whatsapp || phone).replace(/\D/g, "");
  const waLink = `https://wa.me/${wa}`;

  return (
    <div className="flex items-center justify-end gap-1">
      <a
        href={waLink}
        target="_blank"
        rel="noreferrer"
        title={tC("openWhatsapp")}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-success"
      >
        <MessageCircle className="h-4 w-4" />
      </a>
      <Link href={`/customers/${customerId}`}>
        <Button variant="ghost" size="icon" title={t("view")}>
          <ExternalLink className="h-4 w-4" />
        </Button>
      </Link>
      <Link href={`/customers/${customerId}/edit`}>
        <Button variant="ghost" size="icon" title={t("edit")}>
          <Pencil className="h-4 w-4" />
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        disabled={isPending}
        title={t("delete")}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
