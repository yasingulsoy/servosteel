import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

/* Next 16: middleware yerine proxy. Locale tespiti + / -> /tr yönlendirmesi */
const handleI18n = createIntlMiddleware(routing);

export function proxy(request: NextRequest) {
  return handleI18n(request);
}

export const config = {
  /* api, _next ve uzantılı dosyalar (sitemap.xml, icon.png...) hariç her yol */
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
