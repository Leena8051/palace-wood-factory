"use client";

import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import { Moon, Sun, Languages, LogOut, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const t = useTranslations("common");
  const tRoles = useTranslations("roles");
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const { data: session } = useSession();

  const otherLocale = locale === "ar" ? "en" : "ar";

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          {/* mobile menu button placeholder */}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <a
          href={`/${otherLocale}/dashboard`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium hover:bg-secondary transition-colors"
        >
          <Languages className="h-4 w-4" />
          <span>{otherLocale === "ar" ? "العربية" : "EN"}</span>
        </a>

        {session?.user && (
          <div className="flex items-center gap-3 ps-3 ms-1 border-s border-border">
            <div className="text-end leading-tight hidden sm:block">
              <p className="text-sm font-medium">{session.user.name}</p>
              <Badge variant="secondary" className="text-[10px] mt-0.5">
                {tRoles(session.user.role)}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Logout"
              onClick={() =>
                signOut({ callbackUrl: `/${locale}/login` })
              }
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
