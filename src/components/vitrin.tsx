import Image from "next/image";

export type VitrinFoto = { src: string; alt: string; width: number; height: number };

/**
 * Ürün sayfasında başlığın hemen altındaki vitrin (bkz. lib/catalog.ts
 * showcaseOf). Fotoğraflar kendi en-boy oranında, kırpılmadan gösterilir:
 * tek fotoğraf tam genişlik, iki fotoğraf yan yana; tek sayıda fotoğrafta
 * ilki tam genişlikte, kalanlar altında ikişer. Yan yana duranların oranı
 * aynı seçildiği için boyları eşit çıkar.
 */
export function Vitrin({ fotolar }: { fotolar: VitrinFoto[] }) {
  if (!fotolar.length) return null;
  const tekIlk = fotolar.length % 2 === 1;
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 lg:pt-14">
      <div className="grid gap-4 sm:grid-cols-2 lg:gap-6">
        {fotolar.map((f, i) => {
          const genis = tekIlk && i === 0;
          return (
            <Image
              key={f.src}
              src={f.src}
              alt={f.alt}
              width={f.width}
              height={f.height}
              sizes={genis ? "(max-width: 1280px) 100vw, 1216px" : "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 616px"}
              loading="eager"
              className={`h-auto w-full rounded-2xl border border-line bg-surface-alt ${genis ? "sm:col-span-2" : ""}`}
            />
          );
        })}
      </div>
    </div>
  );
}
