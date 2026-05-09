/**
 * Next.js 16 proxy (formerly middleware).
 * Runs on the Node.js runtime and combines:
 *  1. next-intl locale routing
 *  2. NextAuth-based auth gate (via authConfig.callbacks.authorized)
 */
import createIntlMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import { routing } from "@/i18n/routing";
import { authConfig } from "@/auth.config";

const intlMiddleware = createIntlMiddleware(routing);
const { auth } = NextAuth(authConfig);

// Wrap auth so it runs intl after authorization check passes/redirects.
export default auth((req) => {
  return intlMiddleware(req);
});

export const config = {
  // Match all routes except Next internals, static files, API routes, and auth API.
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
