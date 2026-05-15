"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSettings } from "@/lib/settings/actions";

interface Props {
  settings: Record<string, string>;
}

const FACTORY_KEYS = [
  { key: "factory_name_ar", labelKey: "factoryNameAr", dir: "rtl" },
  { key: "factory_name_en", labelKey: "factoryNameEn", dir: "ltr" },
  { key: "factory_phone", labelKey: "phone", dir: "ltr" },
  { key: "factory_email", labelKey: "email", dir: "ltr" },
  { key: "factory_city", labelKey: "city", dir: "rtl" },
  { key: "factory_address", labelKey: "address", dir: "rtl" },
  { key: "warranty_days", labelKey: "warrantyDays", dir: "ltr" },
  { key: "vat_number", labelKey: "vatNumber", dir: "ltr" },
  { key: "cr_number", labelKey: "crNumber", dir: "ltr" },
] as const;

export function SettingsForm({ settings }: Props) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(settings);

  const set = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const onSave = () => {
    startTransition(async () => {
      const res = await saveSettings(values);
      if (res.ok) toast.success(t("saved"));
      else toast.error(res.error);
    });
  };

  return (
    <div className="space-y-5">
      {FACTORY_KEYS.map(({ key, labelKey, dir }) => (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={key}>{t(`fields.${labelKey}`)}</Label>
          <Input
            id={key}
            dir={dir}
            value={values[key] ?? ""}
            onChange={(e) => set(key, e.target.value)}
            placeholder={t(`placeholders.${labelKey}`)}
          />
        </div>
      ))}

      <div className="pt-2 flex justify-end">
        <Button onClick={onSave} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {tCommon("save")}
        </Button>
      </div>
    </div>
  );
}
