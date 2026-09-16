import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { oturum } from "@/lib/admin-auth";
import {
  DURUMLAR,
  DURUM_ETIKET,
  durumSayilari,
  olaySayilari,
  semaKur,
  talepler,
  type Durum,
  type Talep,
} from "@/lib/leads-db";
import { TalepEkleKutusu } from "./talep-ekle";
import { TalepListesi } from "./talep-listesi";
import { Kabuk } from "./kabuk";

export const dynamic = "force-dynamic";

export default async function AdminSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; ara?: string }>;
}) {
  const kullanici = await oturum();
  if (!kullanici) redirect("/admin/giris");

  const sp = await searchParams;
  const kuruldu = await semaKur();

  if (!kuruldu) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-2xl font-bold uppercase">Veritabanı bağlı değil</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          <code className="rounded bg-surface-alt px-1.5 py-0.5 text-xs">DATABASE_URL</code>{" "}
          tanımlı değil ya da bağlantı kurulamadı. Form çalışmaya devam ediyor —
          talepler e-posta olarak gidiyor, yalnızca bu panelde görünmüyorlar.
        </p>
      </main>
    );
  }

  let liste: Talep[] = [];
  let sayilar: { durum: string; adet: string }[] = [];
  let olaylar: { tur: string; adet: string }[] = [];
  let hata: string | null = null;
  try {
    [liste, sayilar, olaylar] = await Promise.all([
      talepler({ durum: sp.durum, ara: sp.ara }),
      durumSayilari(),
      olaySayilari(30),
    ]);
  } catch (e) {
    hata = (e as Error).message;
  }

  const adet = Object.fromEntries(sayilar.map((s) => [s.durum, Number(s.adet)]));
  const olay = Object.fromEntries(olaylar.map((o) => [o.tur, Number(o.adet)]));
  const toplam = sayilar.reduce((a, s) => a + Number(s.adet), 0);
  /* Spam gerçek talep değil — kartlardaki sayıdan düşülüyor ki dönüşüm
     rakamı şişmesin. Süzgeçte kendi sekmesiyle görünmeye devam ediyor. */
  const gercek = toplam - Number(adet["spam"] ?? 0);

  return (
    <Kabuk
      aktif="talepler"
      durum={sp.durum && DURUMLAR.includes(sp.durum as Durum) ? sp.durum : "tumu"}
      kullanici={kullanici}
    >
    <main>
      <header>
        <h1 className="font-display text-xl font-bold uppercase tracking-tight sm:text-2xl">
          Talepler
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          {gercek} gerçek · {toplam} kayıt
        </p>
      </header>

      {hata ? (
        <p className="mt-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          Veritabanı hatası: {hata}
        </p>
      ) : null}

      {/* Sayaçlar — mobilde 2×2, masaüstünde tek sıra.
          Sıfırken de gösteriliyor: "e-posta tuşu hiç tıklanmadı" bilgisi,
          satırın hiç görünmemesinden çok daha işe yarar. */}
      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { etiket: "Telefon tuşu", deger: olay["telefon"] ?? 0, alt: "son 30 gün" },
          { etiket: "E-posta tuşu", deger: olay["eposta"] ?? 0, alt: "son 30 gün" },
          { etiket: "Yeni talep", deger: adet["yeni"] ?? 0, alt: "işlem bekleyen" },
          { etiket: "Gerçek talep", deger: gercek, alt: "spam hariç" },
        ].map((k) => (
          <div key={k.etiket} className="rounded-xl border border-line bg-card p-3.5">
            <p className="text-[11px] font-semibold uppercase leading-tight tracking-wide text-muted">
              {k.etiket}
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold leading-none sm:text-3xl">
              {k.deger}
            </p>
            <p className="mt-1 text-[11px] text-muted">{k.alt}</p>
          </div>
        ))}
      </section>

      {/* Durum süzgeci — mobilde TEK SIRA, yatay kaydırmalı. Sarmalı
          bırakınca üç satır yer kaplıyor ve listeyi ekrandan aşağı itiyordu.
          `-mx-4 px-4`: kaydırma alanı ekran kenarına kadar uzasın ama
          içerik hizalı kalsın. */}
      <nav className="mt-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
        <Link
          href="/admin"
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${!sp.durum ? "bg-shell text-white" : "border border-line"}`}
        >
          Hepsi {toplam}
        </Link>
        {DURUMLAR.map((d) => (
          <Link
            key={d}
            href={`/admin?durum=${d}`}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${sp.durum === d ? "bg-shell text-white" : "border border-line"}`}
          >
            {DURUM_ETIKET[d]} {adet[d] ?? 0}
          </Link>
        ))}
      </nav>

      {/* Arama — tuş GÖRÜNÜR. Öncesinde yalnızca klavyeden "git"e basınca
          gönderiliyordu; mobilde bunu bilmeyen için form çalışmıyor gibiydi.
          `text-base`: 16 px'in altındaki yazı tipi iOS'ta odaklanınca sayfayı
          yakınlaştırıyor. */}
      <form className="mt-4 flex gap-2" action="/admin">
        {sp.durum ? <input type="hidden" name="durum" value={sp.durum} /> : null}
        <input
          name="ara"
          type="search"
          defaultValue={sp.ara ?? ""}
          placeholder="Ad, e-posta, firma, mesaj…"
          className="min-w-0 flex-1 rounded-lg border border-line bg-card px-3 py-2.5 text-base outline-none focus-visible:border-accent sm:max-w-sm sm:text-sm"
        />
        <button
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-4 py-2.5 text-sm font-medium active:bg-surface-alt"
          aria-label="Ara"
        >
          <Search className="size-4" strokeWidth={2.2} aria-hidden />
          <span className="hidden sm:inline">Ara</span>
        </button>
        {sp.ara ? (
          <Link
            href={sp.durum ? `/admin?durum=${sp.durum}` : "/admin"}
            className="flex shrink-0 items-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted"
          >
            Temizle
          </Link>
        ) : null}
      </form>

      <div className="mt-5">
        <TalepListesi liste={liste} />
      </div>

      <TalepEkleKutusu />
    </main>
    </Kabuk>
  );
}
