"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SAUDI_CITIES, CUSTOMER_SOURCES } from "@/lib/constants";

interface Props {
  cities: string[];
}

export function CustomersFilters({ cities }: Props) {
  const t = useTranslations("customers");
  const tFilters = useTranslations("customers.filters");
  const tSources = useTranslations("customers.sources");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(params.get("q") ?? "");

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(params.toString());
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${newParams.toString()}`);
    });
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("q", search.trim());
  };

  const clearAll = () => {
    setSearch("");
    startTransition(() => router.push(pathname));
  };

  const hasFilters = !!(
    params.get("q") ||
    params.get("city") ||
    params.get("type") ||
    params.get("vip") ||
    params.get("source")
  );

  // Combine seed cities + cities discovered from DB
  const allCities = Array.from(
    new Set([...SAUDI_CITIES.filter((c) => c !== "أخرى"), ...cities, "أخرى"]),
  );

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <form onSubmit={onSearchSubmit} className="flex-1 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tFilters("searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <Button type="submit" variant="outline">
          {t("search")}
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Select
          value={params.get("city") ?? ""}
          onChange={(e) => updateParam("city", e.target.value)}
          className="w-[160px]"
        >
          <option value="">{tFilters("allCities")}</option>
          {allCities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        <Select
          value={params.get("type") ?? ""}
          onChange={(e) => updateParam("type", e.target.value)}
          className="w-[140px]"
        >
          <option value="">{tFilters("allTypes")}</option>
          <option value="INDIVIDUAL">{t("type.INDIVIDUAL")}</option>
          <option value="COMPANY">{t("type.COMPANY")}</option>
        </Select>

        <Select
          value={params.get("source") ?? ""}
          onChange={(e) => updateParam("source", e.target.value)}
          className="w-[150px]"
        >
          <option value="">{tFilters("allSources")}</option>
          {CUSTOMER_SOURCES.map((s) => (
            <option key={s} value={s}>
              {tSources(s)}
            </option>
          ))}
        </Select>

        <Button
          type="button"
          variant={params.get("vip") ? "accent" : "outline"}
          onClick={() => updateParam("vip", params.get("vip") ? "" : "1")}
        >
          ⭐ VIP
        </Button>

        {hasFilters && (
          <Button type="button" variant="ghost" onClick={clearAll}>
            <X className="h-4 w-4" />
            {tFilters("clear")}
          </Button>
        )}
      </div>
    </div>
  );
}
