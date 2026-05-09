"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Package,
  MessageSquareWarning,
  Wrench,
  Boxes,
  Wallet,
  BarChart3,
  Settings,
  Trees,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/customers", labelKey: "customers", icon: Users },
  { href: "/orders", labelKey: "orders", icon: ClipboardList },
  { href: "/products", labelKey: "products", icon: Package },
  { href: "/complaints", labelKey: "complaints", icon: MessageSquareWarning },
  { href: "/maintenance", labelKey: "maintenance", icon: Wrench },
  { href: "/inventory", labelKey: "inventory", icon: Boxes },
  { href: "/payments", labelKey: "payments", icon: Wallet },
  { href: "/reports", labelKey: "reports", icon: BarChart3 },
  { href: "/settings", labelKey: "settings", icon: Settings },
] as const;

export function Sidebar() {
  const t = useTranslations("navigation");
  const tApp = useTranslations("app");
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-e border-border bg-card">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Trees className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="font-bold text-sm">{tApp("name")}</p>
          <p className="text-xs text-muted-foreground">{tApp("tagline")}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground text-center">
        © {new Date().getFullYear()} {tApp("shortName")}
      </div>
    </aside>
  );
}
