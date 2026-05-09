"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search, User, Star, Check, X, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { searchCustomers } from "@/lib/orders/actions";
import { cn } from "@/lib/utils";

export interface PickedCustomer {
  id: string;
  fullName: string;
  phone: string;
  city: string;
  customerCode: string;
  isVip: boolean;
}

interface Props {
  value?: PickedCustomer | null;
  onChange: (c: PickedCustomer | null) => void;
}

export function CustomerPicker({ value, onChange }: Props) {
  const t = useTranslations("orders.customerPicker");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedCustomer[]>([]);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Debounce search
  useEffect(() => {
    if (!open) return;
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        const res = await searchCustomers(query);
        setResults(res);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [query, open]);

  if (value) {
    return (
      <div className="rounded-lg border border-accent/40 bg-accent/5 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-accent">
            {value.isVip ? <Star className="h-5 w-5 fill-accent" /> : <User className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-medium">{value.fullName}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground" dir="ltr">
              <span className="font-mono">{value.customerCode}</span>
              <span>•</span>
              <span className="font-mono">{value.phone}</span>
              <span>•</span>
              <span dir="auto">{value.city}</span>
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t("placeholder")}
          className="ps-9"
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
          {query.length < 2 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t("startTyping")}
            </div>
          ) : isPending ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t("searching")}
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center space-y-3">
              <p className="text-sm text-muted-foreground">{t("noResults")}</p>
              <Link href="/customers/new" target="_blank">
                <Button type="button" size="sm" variant="outline">
                  <UserPlus className="h-4 w-4" />
                  {t("createNew")}
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "w-full text-start px-3 py-2 hover:bg-secondary transition-colors flex items-center gap-3",
                    )}
                  >
                    {c.isVip ? (
                      <Star className="h-4 w-4 text-accent fill-accent" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{c.fullName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground" dir="ltr">
                        <span className="font-mono">{c.phone}</span>
                        <span>•</span>
                        <span dir="auto">{c.city}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {c.customerCode}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
