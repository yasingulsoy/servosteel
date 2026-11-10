import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

/**
 * Sayfa başlığı (TailAdmin PageBreadCrumb): solda başlık, sağda ya sayfanın
 * düğmeleri ya da "Pano › … › konum" yolu. Altına açıklama gelebilir.
 */
export function SayfaBasligi({
  baslik,
  yanina,
  ek,
  yol,
  konum,
  children,
}: {
  baslik: string;
  /** Başlığın hemen yanında: rozet, sayaç. */
  yanina?: React.ReactNode;
  /** Sağda: düğmeler. Verilmezse ve `yol` varsa sağda gezinme yolu durur. */
  ek?: React.ReactNode;
  /** Pano ile bu sayfa arasındaki üst sayfalar (üst düzey sayfada boş dizi). */
  yol?: { ad: string; href: string }[];
  /** Yolun son halkası; verilmezse başlık. */
  konum?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-xl font-semibold text-gray-800">{baslik}</h1>
          {yanina}
        </div>
        {ek ? (
          <div className="flex flex-wrap items-center gap-2">{ek}</div>
        ) : yol ? (
          <nav aria-label="Konum">
            <ol className="flex flex-wrap items-center gap-1.5">
              {[{ ad: "Pano", href: "/" }, ...(yol ?? [])].map((h) => (
                <li key={h.href}>
                  <Link href={h.href} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-500">
                    {h.ad}
                    <ChevronRight size={16} strokeWidth={1.5} />
                  </Link>
                </li>
              ))}
              <li className="text-sm text-gray-800">{konum ?? baslik}</li>
            </ol>
          </nav>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** Başlıklı kart (TailAdmin RecentOrders): üstte başlık ve düğmeler, altta içerik. */
export function Panel({
  baslik,
  ek,
  children,
  className = "",
}: {
  baslik: React.ReactNode;
  ek?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`kart overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <h2 className="bolum-baslik">{baslik}</h2>
        {ek ? <div className="flex flex-wrap items-center gap-2">{ek}</div> : null}
      </div>
      <div className="border-t border-gray-100">{children}</div>
    </section>
  );
}

/** Panelin içindeki boş durum yazısı. */
export const Bos = ({ children }: { children: React.ReactNode }) => (
  <p className="px-5 py-4 text-sm text-gray-500 sm:px-6">{children}</p>
);

/** Pano ve rapor sayıları (TailAdmin EcommerceMetrics kartı). */
export function SayiKarti({
  ad,
  deger,
  simge: Simge,
  href,
  alt,
}: {
  ad: string;
  deger: React.ReactNode;
  simge: LucideIcon;
  href?: string;
  alt?: React.ReactNode;
}) {
  const ic = (
    <>
      <div className="flex size-12 items-center justify-center rounded-xl bg-gray-100 text-gray-800">
        <Simge size={24} strokeWidth={1.75} />
      </div>
      <div className="mt-5">
        <span className="text-sm text-gray-500">{ad}</span>
        <h4 className="mt-2 text-title-sm font-bold text-gray-800">{deger}</h4>
        {alt ? <p className="mt-1 text-theme-xs text-gray-500">{alt}</p> : null}
      </div>
    </>
  );
  const sinif = "kart block p-4 sm:p-5 md:p-6";
  return href ? (
    <Link href={href} className={`${sinif} transition hover:border-brand-300 hover:shadow-theme-md`}>
      {ic}
    </Link>
  ) : (
    <div className={sinif}>{ic}</div>
  );
}

/** Bilgi / başarı kutusu (TailAdmin Alert). */
export function Uyari({
  tur,
  simge: Simge,
  children,
}: {
  tur: "basari" | "bilgi";
  simge: LucideIcon;
  children: React.ReactNode;
}) {
  const renk =
    tur === "basari"
      ? "border-success-500 bg-success-50 [&>svg]:text-success-500"
      : "border-blue-light-500 bg-blue-light-50 [&>svg]:text-blue-light-500";
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm text-gray-700 ${renk}`}>
      <Simge size={20} className="mt-px shrink-0" />
      <div>{children}</div>
    </div>
  );
}
