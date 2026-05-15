"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";

import {
  complaintInputSchema,
  type ComplaintInput,
} from "@/lib/validations/complaint";
import { createComplaint } from "@/lib/complaints/actions";
import { COMPLAINT_CATEGORIES, PRIORITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CustomerPicker,
  type PickedCustomer,
} from "@/components/orders/customer-picker";

export function ComplaintForm() {
  const t = useTranslations("complaints");
  const tFields = useTranslations("complaints.fields");
  const tCat = useTranslations("complaints.categories");
  const tPriority = useTranslations("orders.priorities");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [customer, setCustomer] = useState<PickedCustomer | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<ComplaintInput>({
    resolver: zodResolver(complaintInputSchema) as never,
    defaultValues: {
      customerId: "",
      orderId: "",
      category: "QUALITY",
      priority: "NORMAL",
      title: "",
      description: "",
    },
  });

  const onSubmit = (data: ComplaintInput) => {
    startTransition(async () => {
      const res = await createComplaint(data);
      if (!res.ok) {
        toast.error(res.error);
        if (res.fieldErrors) {
          for (const [f, msgs] of Object.entries(res.fieldErrors)) {
            setError(f as keyof ComplaintInput, {
              message: (msgs as string[])[0],
            });
          }
        }
        return;
      }
      toast.success(t("createdSuccess", { number: res.data.ticketNumber }));
      router.push(`/complaints/${res.data.id}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{tFields("customer")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            control={control}
            name="customerId"
            render={({ field }) => (
              <CustomerPicker
                value={customer}
                onChange={(c) => {
                  setCustomer(c);
                  field.onChange(c?.id ?? "");
                }}
              />
            )}
          />
          {errors.customerId && (
            <p className="text-xs text-destructive">{errors.customerId.message}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="orderId">{tFields("orderIdOptional")}</Label>
            <Input
              id="orderId"
              {...register("orderId")}
              placeholder="ORD-2026-XXXX"
              dir="ltr"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {tFields("orderIdHint")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("complaintDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">
              {tFields("category")} <span className="text-destructive">*</span>
            </Label>
            <Select id="category" {...register("category")}>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {tCat(c)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">{tFields("priority")}</Label>
            <Select id="priority" {...register("priority")}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {tPriority(p)}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="title">
              {tFields("title")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder={tFields("titlePlaceholder")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="description">
              {tFields("description")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              rows={5}
              {...register("description")}
              placeholder={tFields("descriptionPlaceholder")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pb-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          <X className="h-4 w-4" />
          {tCommon("cancel")}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {t("create")}
        </Button>
      </div>
    </form>
  );
}
