"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ORDER_STATUSES,
  PRIORITIES,
  PRODUCT_CATEGORIES,
} from "@/lib/constants";

export function OrdersFilters() {
  const t = useTranslations("orders");
  const tFilters = useTranslations("orders.filters");
  const tCat = useTranslations("orders.categories");
  const tStatus = useTranslations("orders.statuses");
  const tPriority = useTranslations("orders.priorities");
  const tCommon = useTranslations("common");

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(params.get("q") ?? "");

  const updateParam = (key: string, value: string) => {
    const np = new URLSearchParams(params.toString());
    if (value) np.set(key, value);
    else np.delete(key);
    np.delete("page");
    startTransition(() => router.push(`${pathname}?${np.toString()}`));
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("q", search.trim());
  };

  const clear = () => {
    setSearch("");
    startTransition(() => router.push(pathname));
  };

  const hasFilters = !!(
    params.get("q") ||
    params.get("status") ||
    params.get("priority") ||
    params.get("category")
  );

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <form onSubmit={onSearch} className="flex-1 flex gap-2">
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
          {tCommon("search")}
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Select
          value={params.get("status") ?? ""}
          onChange={(e) => updateParam("status", e.target.value)}
          className="w-[140px]"
        >
          <option value="">{tFilters("allStatuses")}</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {tStatus(s)}
            </option>
          ))}
        </Select>

        <Select
          value={params.get("priority") ?? ""}
          onChange={(e) => updateParam("priority", e.target.value)}
          className="w-[130px]"
        >
          <option value="">{tFilters("allPriorities")}</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {tPriority(p)}
            </option>
          ))}
        </Select>

        <Select
          value={params.get("category") ?? ""}
          onChange={(e) => updateParam("category", e.target.value)}
          className="w-[150px]"
        >
          <option value="">{tFilters("allCategories")}</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {tCat(c)}
            </option>
          ))}
        </Select>

        {hasFilters && (
          <Button type="button" variant="ghost" onClick={clear}>
            <X className="h-4 w-4" />
            {t("filters.clear")}
          </Button>
        )}
      </div>
    </div>
  );
}
