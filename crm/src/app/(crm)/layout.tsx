import Link from "next/link";
import { LogOut } from "lucide-react";
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
