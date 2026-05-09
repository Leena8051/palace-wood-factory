import type { NextAuthConfig } from "next-auth";

/**
 * Auth config without database/bcrypt imports — safe for use in proxy / edge.
 * Database-backed providers and adapter live in src/auth.ts (Node only).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Strip /ar or /en locale prefix for path matching
      const stripped = pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";

      const isOnLogin = stripped.startsWith("/login");
      const isPublic =
        stripped === "/" ||
        stripped.startsWith("/track");

      if (isOnLogin) {
        if (isLoggedIn) {
          const locale = pathname.match(/^\/(ar|en)/)?.[1] ?? "ar";
          return Response.redirect(new URL(`/${locale}/dashboard`, nextUrl));
        }
        return true;
      }

      if (isPublic) return true;

      // Everything else requires auth
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "CUSTOMER_SERVICE";
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  providers: [], // Real providers added in src/auth.ts
} satisfies NextAuthConfig;
