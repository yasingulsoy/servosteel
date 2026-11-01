import Link from "next/link";
import { LogOut, Search } from "lucide-react";
import { Listeler } from "@/components/formlar";
import { UstMenu } from "@/components/ust-menu";
import { oturumZorunlu } from "@/lib/oturum";
import { ROL } from "@/lib/sabitler";
import { kullanilanSektorler } from "@/lib/veri";
import { cikisEylemi } from "../giris/actions";

export const dynamic = "force-dynamic";

export default async function CrmDuzeni({ children }: { children: React.ReactNode }) {
  const ben = await oturumZorunlu();
  const sektorler = await kullanilanSektorler();
  return (
    <>
      <Listeler sektorler={sektorler} />
      <header className="bg-shell text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/" className="text-sm font-bold tracking-wide">
            <span className="text-accent">SERVOSTEEL</span> CRM
          </Link>
          <UstMenu yonetici={ben.rol === "yonetici"} />
          <div className="ml-auto flex items-center gap-3 text-xs text-zinc-400">
            <form action="/ara" className="relative">
              <Search size={13} className="pointer-events-none absolute start-2 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                name="q"
                placeholder="Ara…"
                aria-label="Firma, kişi, teklif ara"
                className="w-32 rounded-md border border-white/10 bg-white/5 py-1 ps-7 pe-2 text-xs text-white outline-none placeholder:text-zinc-500 focus:w-48 focus:border-accent"
              />
            </form>
            <span>
              {ben.ad || ben.kullanici} · {ROL[ben.rol]}
            </span>
            <form action={cikisEylemi}>
              <button type="submit" className="flex items-center gap-1 hover:text-white" title="Çıkış">
                <LogOut size={14} /> Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
