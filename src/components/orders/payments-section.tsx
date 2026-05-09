"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { toast } from "sonner";
import { Plus, Loader2, Receipt, CreditCard, Banknote, Building2, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  paymentInputSchema,
  type PaymentInput,
  PAYMENT_METHODS,
  PAYMENT_TYPES,
} from "@/lib/validations/payment";
import { recordPayment } from "@/lib/orders/payment-actions";
import { formatCurrency } from "@/lib/utils";

interface PaymentItem {
  id: string;
  paymentNumber: string;
  amount: number;
  type: string;
  method: string;
  notes: string | null;
  paidAt: Date;
  receivedBy?: { name: string } | null;
}

interface Props {
  orderId: string;
  payments: PaymentItem[];
  balanceDue: number;
  canRecord: boolean;
}

const METHOD_ICONS: Record<string, typeof Banknote> = {
  CASH: Banknote,
  BANK_TRANSFER: Building2,
  CARD: CreditCard,
  CHECK: FileText,
};

export function PaymentsSection({
  orderId,
  payments,
  balanceDue,
  canRecord,
}: Props) {
  const t = useTranslations("orders.payments");
  const tType = useTranslations("orders.payments.types");
  const tMethod = useTranslations("orders.payments.methods");
  const tCommon = useTranslations("common");
  const locale = useLocale() as "ar" | "en";
  const dateLocale = locale === "ar" ? arLocale : undefined;
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentInputSchema) as never,
    defaultValues: {
      amount: undefined,
      type: balanceDue > 0 ? "INSTALLMENT" : "FINAL",
      method: "CASH",
      notes: "",
    },
  });

  const onSubmit = (data: PaymentInput) => {
    startTransition(async () => {
      const res = await recordPayment(orderId, data);
      if (!res.ok) {
        toast.error(res.error);
        if (res.fieldErrors) {
          for (const [field, msgs] of Object.entries(res.fieldErrors)) {
            setError(field as keyof PaymentInput, {
              message: (msgs as string[])[0],
            });
          }
        }
        return;
      }
      toast.success(t("recorded", { number: res.data.paymentNumber }));
      reset();
      setOpen(false);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Receipt className="h-4 w-4 text-accent" />
          {t("title")} ({payments.length})
        </h3>
        {canRecord && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("recordNew")}
          </Button>
        )}
      </div>

      {payments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          {t("noPayments")}
        </p>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => {
            const Icon = METHOD_ICONS[p.method] ?? Banknote;
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/15 text-success shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">
                      {p.paymentNumber}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {tType(p.type)}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {tMethod(p.method)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(p.paidAt, "dd MMM yyyy HH:mm", {
                      locale: dateLocale,
                    })}
                    {p.receivedBy && ` • ${p.receivedBy.name}`}
                  </p>
                  {p.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      {p.notes}
                    </p>
                  )}
                </div>
                <div className="text-end shrink-0">
                  <p className="font-bold text-success">
                    +{formatCurrency(p.amount, locale)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{t("recordNew")}</DialogTitle>
              {balanceDue > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("remainingBalance")}:{" "}
                  <span className="font-semibold text-warning">
                    {formatCurrency(balanceDue, locale)}
                  </span>
                </p>
              )}
            </DialogHeader>
            <DialogBody>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    {t("amount")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    dir="ltr"
                    placeholder="0.00"
                    {...register("amount")}
                  />
                  {errors.amount && (
                    <p className="text-xs text-destructive">
                      {errors.amount.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="type">{t("type")}</Label>
                    <Select id="type" {...register("type")}>
                      {PAYMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {tType(t)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">{t("method")}</Label>
                    <Select id="method" {...register("method")}>
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {tMethod(m)}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{t("notes")}</Label>
                  <Textarea
                    id="notes"
                    rows={2}
                    {...register("notes")}
                    placeholder={t("notesPlaceholder")}
                  />
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <Receipt className="h-4 w-4" />
                {t("record")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
