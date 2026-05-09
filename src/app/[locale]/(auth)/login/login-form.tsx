"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Trees } from "lucide-react";

import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm() {
  const t = useTranslations("auth");
  const tApp = useTranslations("app");
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginInput) => {
    setServerError(null);
    startTransition(async () => {
      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (!res || res.error) {
        setServerError(t("invalidCredentials"));
        toast.error(t("invalidCredentials"));
        return;
      }

      toast.success(t("login"));
      router.replace("/dashboard");
      router.refresh();
    });
  };

  return (
    <Card className="border-wood-300 shadow-xl">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Trees className="h-7 w-7" />
        </div>
        <div>
          <CardTitle className="text-2xl">{tApp("name")}</CardTitle>
          <CardDescription className="mt-1">{tApp("tagline")}</CardDescription>
        </div>
        <div className="pt-2">
          <h2 className="text-lg font-semibold">{t("loginTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("loginSubtitle")}</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              dir="ltr"
              placeholder={t("emailPlaceholder")}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              dir="ltr"
              placeholder={t("passwordPlaceholder")}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t("loggingIn") : t("loginButton")}
          </Button>

          <div className="text-center text-xs text-muted-foreground pt-2">
            <a
              href={locale === "ar" ? "/en/login" : "/ar/login"}
              className="underline hover:text-accent"
            >
              {locale === "ar" ? "English" : "العربية"}
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
