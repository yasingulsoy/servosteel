"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BAGLANTILAR = [
  { href: "/", ad: "Pano" },
  { href: "/etkinlikler", ad: "Etkinlikler" },
  { href: "/firmalar", ad: "Firmalar" },
  { href: "/teklifler", ad: "Teklifler" },
];

export function UstMenu({ yonetici }: { yonetici: boolean }) {
  const yol = usePathname();
  const liste = yonetici ? [...BAGLANTILAR, { href: "/kullanicilar", ad: "Kullanıcılar" }] : BAGLANTILAR;
  return (
    <nav className="flex gap-1 overflow-x-auto text-sm">
      {liste.map((b) => {
        const etkin = b.href === "/" ? yol === "/" : yol.startsWith(b.href);
        return (
          <Link
            key={b.href}
            href={b.href}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 font-medium ${
              etkin ? "bg-white/15 text-white" : "text-zinc-300 hover:text-white"
            }`}
          >
            {b.ad}
          </Link>
        );
      })}
    </nav>
  );
}
