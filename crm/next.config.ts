import path from "node:path";
import type { NextConfig } from "next";

/**
 * CRM sitenin deposunda ama ayrı bir uygulama: kendi bağımlılıkları, kendi
 * derlemesi, kendi Dokploy servisi (derleme yolu `/crm`). Sitenin tsconfig,
 * eslint ve Tailwind taraması bu klasörü hariç tutuyor; birindeki hata
 * ötekinin yayınını durdurmaz.
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
  /* Üst klasörde sitenin package-lock'u var; kök belirtilmezse Turbopack
     sitenin klasörünü proje sanıyor ve sitenin src/proxy.ts'ini derlemeye
     kalkıyor. */
  turbopack: { root: path.resolve(__dirname) },
  /* Teklif PDF'i ve müşteri çizimi sunucu eylemiyle yükleniyor; varsayılan 1 MB
     sınırı yetmez. Uygulamadaki dosya sınırı 15 MB, üstü çok parçalı form payı. */
  experimental: { serverActions: { bodySizeLimit: "16mb" } },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
