import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

/* Next 16: middleware yerine proxy. Locale tespiti + / -> /tr yönlendirmesi */
const handleI18n = createIntlMiddleware(routing);

export function proxy(request: NextRequest) {
  return handleI18n(request);
}

export const config = {
  /* api, admin, _next ve uzantılı dosyalar hariç her yol.

     `admin` DIŞARIDA: panel çok dilli değil, `[locale]` ağacının dışında
     yaşıyor. Buradan geçseydi next-intl `/admin`'i `/tr/admin`'e yönlendirir,
     o yol da bulunamazdı. */
  matcher: "/((?!api|admin|_next|_vercel|.*\\..*).*)",
};
