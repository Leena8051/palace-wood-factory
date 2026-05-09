"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";

import {
  customerInputSchema,
  type CustomerInput,
} from "@/lib/validations/customer";
import { createCustomer, updateCustomer } from "@/lib/customers/actions";
import { CUSTOMER_SOURCES, SAUDI_CITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  mode: "create" | "edit";
  customerId?: string;
  initial?: Partial<CustomerInput>;
}

export function CustomerForm({ mode, customerId, initial }: Props) {
  const t = useTranslations("customers");
  const tFields = useTranslations("customers.fields");
  const tSources = useTranslations("customers.sources");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CustomerInput>({
    // zodResolver's input/output mismatch with .default() — cast to satisfy generic
    resolver: zodResolver(customerInputSchema) as never,
    defaultValues: {
      fullName: initial?.fullName ?? "",
      phone: initial?.phone ?? "",
      whatsapp: initial?.whatsapp ?? "",
      email: initial?.email ?? "",
      city: initial?.city ?? "الرياض",
      district: initial?.district ?? "",
      address: initial?.address ?? "",
      customerType: initial?.customerType ?? "INDIVIDUAL",
      companyName: initial?.companyName ?? "",
      notes: initial?.notes ?? "",
      source: initial?.source ?? "WALK_IN",
      isVip: initial?.isVip ?? false,
    },
  });

  const customerType = watch("customerType");
  const isVip = watch("isVip");

  const onSubmit = (values: CustomerInput) => {
    setServerError(null);
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createCustomer(values)
          : await updateCustomer(customerId!, values);

      if (!res.ok) {
        setServerError(res.error);
        if (res.fieldErrors) {
          for (const [field, msgs] of Object.entries(res.fieldErrors)) {
            setError(field as keyof CustomerInput, {
              message: (msgs as string[])[0],
            });
          }
        }
        toast.error(res.error);
        return;
      }

      toast.success(
        mode === "create" ? t("createdSuccess") : t("updatedSuccess"),
      );
      if (mode === "create" && "customerCode" in res.data) {
        router.push(`/customers/${(res.data as { id: string }).id}`);
      } else {
        router.push(`/customers/${customerId}`);
      }
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("sections.basic")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="fullName">
              {tFields("fullName")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              {...register("fullName")}
              placeholder={tFields("fullNamePlaceholder")}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerType">{tFields("customerType")}</Label>
            <Select
              id="customerType"
              {...register("customerType")}
            >
              <option value="INDIVIDUAL">{t("type.INDIVIDUAL")}</option>
              <option value="COMPANY">{t("type.COMPANY")}</option>
            </Select>
          </div>

          {customerType === "COMPANY" && (
            <div className="space-y-2">
              <Label htmlFor="companyName">
                {tFields("companyName")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input id="companyName" {...register("companyName")} />
              {errors.companyName && (
                <p className="text-xs text-destructive">
                  {errors.companyName.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="source">{tFields("source")}</Label>
            <Select id="source" {...register("source")}>
              {CUSTOMER_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {tSources(s)}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="vipSwitch" className="cursor-pointer">
                ⭐ {tFields("isVip")}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {tFields("isVipHint")}
              </p>
            </div>
            <Switch
              id="vipSwitch"
              checked={isVip ?? false}
              onCheckedChange={(v) => setValue("isVip", v, { shouldDirty: true })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.contact")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">
              {tFields("phone")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              dir="ltr"
              {...register("phone")}
              placeholder="05XXXXXXXX"
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">{tFields("whatsapp")}</Label>
            <Input
              id="whatsapp"
              dir="ltr"
              {...register("whatsapp")}
              placeholder={tFields("whatsappPlaceholder")}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="email">{tFields("email")}</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              {...register("email")}
              placeholder="customer@example.com"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.address")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">
              {tFields("city")} <span className="text-destructive">*</span>
            </Label>
            <Select id="city" {...register("city")}>
              {SAUDI_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            {errors.city && (
              <p className="text-xs text-destructive">{errors.city.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="district">{tFields("district")}</Label>
            <Input id="district" {...register("district")} />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="address">{tFields("address")}</Label>
            <Textarea id="address" rows={2} {...register("address")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.notes")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            rows={4}
            placeholder={tFields("notesPlaceholder")}
            {...register("notes")}
          />
        </CardContent>
      </Card>

      {serverError && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </div>
      )}

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
          {mode === "create" ? tCommon("create") : tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
