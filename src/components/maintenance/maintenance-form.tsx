"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Loader2, Save, X, ShieldCheck } from "lucide-react";

import {
  maintenanceInputSchema,
  type MaintenanceInput,
} from "@/lib/validations/maintenance";
import { createMaintenanceRequest } from "@/lib/maintenance/actions";
import { MAINTENANCE_TYPES } from "@/lib/constants";
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

interface Technician {
  id: string;
  name: string;
}

interface Props {
  technicians: Technician[];
}

export function MaintenanceForm({ technicians }: Props) {
  const t = useTranslations("maintenance");
  const tFields = useTranslations("maintenance.fields");
  const tType = useTranslations("maintenance.types");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [customer, setCustomer] = useState<PickedCustomer | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<MaintenanceInput>({
    resolver: zodResolver(maintenanceInputSchema) as never,
    defaultValues: {
      customerId: "",
      originalOrderId: "",
      type: "PAID",
      description: "",
      reportedIssue: "",
      scheduledDate: "",
      technicianId: "",
      estimatedCost: undefined,
    },
  });

  const orderRef = watch("originalOrderId");

  // Best-effort warranty hint when user types an order number — checks via API would
  // be needed for a real autocomplete. For now simply suggest WARRANTY when an order
  // ref is provided.
  useEffect(() => {
    if (orderRef && orderRef.length > 5) {
      setValue("type", "WARRANTY", { shouldDirty: false });
    }
  }, [orderRef, setValue]);

  const onSubmit = (data: MaintenanceInput) => {
    startTransition(async () => {
      const res = await createMaintenanceRequest(data);
      if (!res.ok) {
        toast.error(res.error);
        if (res.fieldErrors) {
          for (const [f, msgs] of Object.entries(res.fieldErrors)) {
            setError(f as keyof MaintenanceInput, {
              message: (msgs as string[])[0],
            });
          }
        }
        return;
      }
      toast.success(t("createdSuccess", { number: res.data.requestNumber }));
      router.push(`/maintenance/${res.data.id}`);
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
            <Label htmlFor="originalOrderId">
              {tFields("originalOrder")}
            </Label>
            <Input
              id="originalOrderId"
              {...register("originalOrderId")}
              placeholder="ORD-2026-XXXX"
              dir="ltr"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-success" />
              {tFields("originalOrderHint")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("issueDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">
              {tFields("type")} <span className="text-destructive">*</span>
            </Label>
            <Select id="type" {...register("type")}>
              {MAINTENANCE_TYPES.map((tt) => (
                <option key={tt} value={tt}>
                  {tType(tt)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimatedCost">{tFields("estimatedCost")}</Label>
            <Input
              id="estimatedCost"
              type="number"
              step="0.01"
              dir="ltr"
              {...register("estimatedCost")}
              placeholder="0.00"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="reportedIssue">
              {tFields("reportedIssue")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reportedIssue"
              rows={3}
              {...register("reportedIssue")}
              placeholder={tFields("reportedIssuePlaceholder")}
            />
            {errors.reportedIssue && (
              <p className="text-xs text-destructive">
                {errors.reportedIssue.message}
              </p>
            )}
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="description">
              {tFields("description")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              rows={4}
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

      <Card>
        <CardHeader>
          <CardTitle>{t("scheduling")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="scheduledDate">{tFields("scheduledDate")}</Label>
            <Input
              id="scheduledDate"
              type="datetime-local"
              {...register("scheduledDate")}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="technicianId">{tFields("technician")}</Label>
            <Select id="technicianId" {...register("technicianId")}>
              <option value="">{tFields("technicianUnassigned")}</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </Select>
            {technicians.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {tFields("noTechnicians")}
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
