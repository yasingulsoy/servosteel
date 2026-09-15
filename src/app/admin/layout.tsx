import type { Metadata } from "next";
import "../globals.css";

/**
 * Yönetim paneli düzeni — sitenin `[locale]` düzeninden TAMAMEN ayrı.
 *
 * Neden ayrı: panel çok dilli değil, site başlığı/altbilgisi burada anlamsız,
 * ve en önemlisi `proxy.ts`'teki next-intl ara katmanı `/admin`'i `/tr/admin`'e
 * yönlendirirdi. Yol `[locale]` dışında tutularak bu tamamen engelleniyor.
 *
 * `noindex, nofollow`: panel canlı sitede duruyor. Arama motorunun giriş
 * ekranını indekslemesi için hiçbir sebep yok; `robots.txt`'te de ayrıca
 * kapalı.
 */
export const metadata: Metadata = {
  title: "Servosteel — Yönetim",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-surface text-ink antialiased">{children}</body>
    </html>
  );
}
