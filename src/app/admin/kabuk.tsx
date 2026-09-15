import Link from "next/link";
import { Inbox, Users, UserCog, LogOut } from "lucide-react";
import { cikisEylemi } from "./actions";

/**
 * Panel kabuğu — masaüstünde sol menü, mobilde üst şerit.
 *
 * Mobilde açılır çekmece YAPILMADI. Üç bağlantı için çekmece, bir dokunuş
 * daha ekler ve gizler; üç ikon üst şeride zaten sığıyor. Çekmece on
 * bağlantıdan sonra anlamlı olur.
 *
 * Aktif bağlantı sunucuda belirleniyor (`aktif` prop) — `usePathname` için
 * bu kabuğu istemci bileşenine çevirmek gerekirdi ve o zaman içindeki tüm
 * sayfa ağacı da istemciye kayardı.
 */

const BAGLANTILAR = [
  { yol: "/admin", etiket: "Talepler", ikon: Inbox, anahtar: "talepler" },
  { yol: "/admin/kullanicilar", etiket: "Kullanıcılar", ikon: Users, anahtar: "kullanicilar" },
  { yol: "/admin/profil", etiket: "Profil", ikon: UserCog, anahtar: "profil" },
] as const;

export type PanelBolum = (typeof BAGLANTILAR)[number]["anahtar"];

export function Kabuk({
  aktif,
  kullanici,
  children,
}: {
  aktif: PanelBolum;
  kullanici: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:flex">
      {/* ------------------------------------------- masaüstü: sol menü */}
      <aside className="hidden w-56 shrink-0 border-r border-line bg-card lg:flex lg:flex-col">
        <div className="px-5 py-6">
          <p className="font-display text-sm font-bold uppercase tracking-wide">
            Servosteel
          </p>
          <p className="mt-0.5 text-xs text-muted">Yönetim</p>
        </div>

        <nav className="flex-1 px-3">
          {BAGLANTILAR.map((b) => (
            <Link
              key={b.yol}
              href={b.yol}
              aria-current={aktif === b.anahtar ? "page" : undefined}
              className={`mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
                aktif === b.anahtar
                  ? "bg-shell text-white"
                  : "text-ink hover:bg-surface-alt"
              }`}
            >
              <b.ikon className="size-4 shrink-0" strokeWidth={2.2} aria-hidden />
              {b.etiket}
            </Link>
          ))}
        </nav>

        <div className="border-t border-line px-5 py-4">
          <p className="truncate text-sm font-medium">{kullanici}</p>
          <form action={cikisEylemi}>
            <button className="mt-2 flex items-center gap-1.5 text-sm text-muted hover:text-ink">
              <LogOut className="size-3.5" aria-hidden />
              Çıkış
            </button>
          </form>
        </div>
      </aside>

      {/* ---------------------------------------------- mobil: üst şerit */}
      <header className="sticky top-0 z-10 border-b border-line bg-card/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5">
          <nav className="flex gap-1">
            {BAGLANTILAR.map((b) => (
              <Link
                key={b.yol}
                href={b.yol}
                aria-current={aktif === b.anahtar ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium ${
                  aktif === b.anahtar ? "bg-shell text-white" : "text-ink"
                }`}
              >
                <b.ikon className="size-4 shrink-0" strokeWidth={2.2} aria-hidden />
                <span className={aktif === b.anahtar ? "" : "sr-only"}>{b.etiket}</span>
              </Link>
            ))}
          </nav>
          <form action={cikisEylemi}>
            <button
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-muted"
              aria-label="Çıkış"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      </header>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
