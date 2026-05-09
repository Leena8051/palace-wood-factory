"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  Package,
  Ruler,
  CreditCard,
  ClipboardCheck,
} from "lucide-react";

import {
  orderInputSchema,
  orderStep1,
  orderStep2,
  orderStep3,
  orderStep4,
  type OrderInput,
} from "@/lib/validations/order";
import { createOrder } from "@/lib/orders/actions";
import {
  PRODUCT_CATEGORIES,
  PRIORITIES,
  WOOD_TYPES,
  FINISH_TYPES,
} from "@/lib/constants";

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
import { cn, formatCurrency } from "@/lib/utils";

const steps = [
  { id: 1, key: "customer", icon: User },
  { id: 2, key: "product", icon: Package },
  { id: 3, key: "specs", icon: Ruler },
  { id: 4, key: "pricing", icon: CreditCard },
  { id: 5, key: "review", icon: ClipboardCheck },
] as const;

export function OrderWizard() {
  const t = useTranslations("orders.wizard");
  const tCat = useTranslations("orders.categories");
  const tPriority = useTranslations("orders.priorities");
  const tCommon = useTranslations("common");
  const locale = useLocale() as "ar" | "en";
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState<PickedCustomer | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<OrderInput>({
    resolver: zodResolver(orderInputSchema) as never,
    mode: "onChange",
    defaultValues: {
      customerId: "",
      productCategory: "DOORS",
      productType: "",
      description: "",
      width: undefined,
      height: undefined,
      depth: undefined,
      woodType: "",
      color: "",
      finishType: "",
      estimatedPrice: undefined,
      deposit: undefined,
      priority: "NORMAL",
      estimatedDelivery: "",
      notes: "",
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = form;

  const values = watch();

  // Validate the current step before allowing next
  const next = async () => {
    let valid = false;
    if (step === 1) {
      valid = await trigger("customerId");
    } else if (step === 2) {
      valid = await trigger(["productCategory", "productType", "description"]);
    } else if (step === 3) {
      valid = await trigger(["width", "height", "depth", "woodType", "color", "finishType"]);
    } else if (step === 4) {
      valid = await trigger(["estimatedPrice", "deposit", "priority", "estimatedDelivery"]);
    } else valid = true;

    if (valid) setStep((s) => Math.min(5, s + 1));
  };

  const prev = () => setStep((s) => Math.max(1, s - 1));

  const onSubmit = (data: OrderInput) => {
    startTransition(async () => {
      const res = await createOrder(data);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(t("createdSuccess", { number: res.data.orderNumber }));
      router.push(`/orders/${res.data.id}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center justify-between gap-1 md:gap-2 overflow-x-auto">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isCurrent = step === s.id;
          const isDone = step > s.id;
          return (
            <div key={s.id} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full transition-colors shrink-0",
                    isDone
                      ? "bg-success text-success-foreground"
                      : isCurrent
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <p
                  className={cn(
                    "mt-1 text-[10px] md:text-xs text-center",
                    isCurrent ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {t(`steps.${s.key}`)}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mb-5",
                    isDone ? "bg-success" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("step1.title")}</CardTitle>
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
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("step2.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productCategory">
                {t("step2.category")} <span className="text-destructive">*</span>
              </Label>
              <Select id="productCategory" {...register("productCategory")}>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {tCat(c)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="productType">
                {t("step2.type")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="productType"
                {...register("productType")}
                placeholder={t("step2.typePlaceholder")}
              />
              {errors.productType && (
                <p className="text-xs text-destructive">{errors.productType.message}</p>
              )}
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">
                {t("step2.description")} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                rows={5}
                {...register("description")}
                placeholder={t("step2.descriptionPlaceholder")}
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("step3.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">{t("step3.width")} (cm)</Label>
              <Input
                id="width"
                type="number"
                step="0.5"
                {...register("width")}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">{t("step3.height")} (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.5"
                {...register("height")}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depth">{t("step3.depth")} (cm)</Label>
              <Input
                id="depth"
                type="number"
                step="0.5"
                {...register("depth")}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="woodType">{t("step3.woodType")}</Label>
              <Select id="woodType" {...register("woodType")}>
                <option value="">{t("step3.selectMaterial")}</option>
                {WOOD_TYPES.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">{t("step3.color")}</Label>
              <Input
                id="color"
                {...register("color")}
                placeholder={t("step3.colorPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finishType">{t("step3.finishType")}</Label>
              <Select id="finishType" {...register("finishType")}>
                <option value="">{t("step3.selectFinish")}</option>
                {FINISH_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("step4.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedPrice">
                {t("step4.estimatedPrice")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="estimatedPrice"
                type="number"
                step="0.01"
                {...register("estimatedPrice")}
                dir="ltr"
                placeholder="0.00"
              />
              {errors.estimatedPrice && (
                <p className="text-xs text-destructive">
                  {errors.estimatedPrice.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">{t("step4.deposit")}</Label>
              <Input
                id="deposit"
                type="number"
                step="0.01"
                {...register("deposit")}
                dir="ltr"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">{t("step4.priority")}</Label>
              <Select id="priority" {...register("priority")}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {tPriority(p)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedDelivery">
                {t("step4.estimatedDelivery")}
              </Label>
              <Input
                id="estimatedDelivery"
                type="date"
                {...register("estimatedDelivery")}
                dir="ltr"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("step5.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <ReviewRow label={t("step1.title")} value={customer?.fullName ?? "—"} />
              <ReviewRow
                label={t("step2.category")}
                value={tCat(values.productCategory ?? "DOORS")}
              />
              <ReviewRow label={t("step2.type")} value={values.productType} />
              <ReviewRow
                label={t("step4.priority")}
                value={tPriority(values.priority ?? "NORMAL")}
              />
              <ReviewRow
                label={t("step3.dimensions")}
                value={
                  values.width || values.height || values.depth
                    ? `${values.width ?? "?"} × ${values.height ?? "?"} × ${values.depth ?? "?"} cm`
                    : "—"
                }
              />
              <ReviewRow label={t("step3.woodType")} value={values.woodType || "—"} />
              <ReviewRow label={t("step3.color")} value={values.color || "—"} />
              <ReviewRow label={t("step3.finishType")} value={values.finishType || "—"} />
              <ReviewRow
                label={t("step4.estimatedPrice")}
                value={
                  values.estimatedPrice
                    ? formatCurrency(Number(values.estimatedPrice), locale)
                    : "—"
                }
              />
              <ReviewRow
                label={t("step4.deposit")}
                value={
                  values.deposit
                    ? formatCurrency(Number(values.deposit), locale)
                    : "—"
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t("step5.notes")}</Label>
              <Textarea
                id="notes"
                rows={3}
                {...register("notes")}
                placeholder={t("step5.notesPlaceholder")}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nav buttons */}
      <div className="flex justify-between gap-2 pb-4">
        <Button
          type="button"
          variant="outline"
          onClick={prev}
          disabled={step === 1 || isPending}
        >
          <ChevronRight className="h-4 w-4 rtl:hidden" />
          <ChevronLeft className="h-4 w-4 ltr:hidden" />
          {tCommon("previous")}
        </Button>

        {step < 5 ? (
          <Button type="button" onClick={next}>
            {tCommon("next")}
            <ChevronLeft className="h-4 w-4 rtl:hidden" />
            <ChevronRight className="h-4 w-4 ltr:hidden" />
          </Button>
        ) : (
          <Button type="submit" disabled={isPending} variant="accent">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {t("createOrder")}
          </Button>
        )}
      </div>
    </form>
  );
}

function ReviewRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium mt-0.5">{value}</p>
    </div>
  );
}

// Silence unused import warnings — these are referenced for type imports & potential future use
void orderStep1;
void orderStep2;
void orderStep3;
void orderStep4;
