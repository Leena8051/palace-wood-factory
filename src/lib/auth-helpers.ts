import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import type { UserRole } from "@/lib/constants";

export async function requireUser(locale: "ar" | "en" = "ar") {
  const session = await auth();
  if (!session?.user) {
    redirect({ href: "/login", locale });
  }
  return session!.user;
}

export async function requireRole(
  roles: UserRole[],
  locale: "ar" | "en" = "ar",
) {
  const user = await requireUser(locale);
  if (!roles.includes(user.role as UserRole)) {
    redirect({ href: "/dashboard", locale });
  }
  return user;
}
