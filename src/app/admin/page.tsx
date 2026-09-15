import Link from "next/link";
import { redirect } from "next/navigation";
import { oturum } from "@/lib/admin-auth";
import {
  DURUMLAR,
  DURUM_ETIKET,
  durumSayilari,
  olaySayilari,
  semaKur,
  talepler,
  type Talep,
} from "@/lib/leads-db";
import { cikisEylemi } from "./actions";
import { TalepEkleKutusu } from "./talep-ekle";

export const dynamic = "force-dynamic";

function tarih(s: string) {
  return new Date(s).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const DURUM_RENK: Record<string, string> = {
  yeni: "bg-accent/20 text-accent-strong",
  ulasildi: "bg-blue-500/15 text-blue-700",
  bilgi_verildi: "bg-violet-500/15 text-violet-700",
  teklif_gonderildi: "bg-amber-500/15 text-amber-700",
  kazanildi: "bg-emerald-500/15 text-emerald-700",
  kaybedildi: "bg-zinc-500/15 text-zinc-600",
  spam: "bg-red-500/15 text-red-700",
};

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
      <main className="mx-auto max-w-2xl px-6 py-16">
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
  const gercek = toplam - (Number(adet["spam"] ?? 0));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Talepler</h1>
          <p className="mt-1 text-sm text-muted">{gercek} gerçek · {toplam} kayıt · {kullanici}</p>
        </div>
        <form action={cikisEylemi}>
          <button className="rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-surface-alt">
            Çıkış
          </button>
        </form>
      </header>

      {hata ? (
        <p className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          Veritabanı hatası: {hata}
        </p>
      ) : null}

      {/* Tuş tıklamaları ve talep özeti.
          İkisi de SIFIRKEN DE gösteriliyor: "e-posta tuşu hiç tıklanmadı"
          bilgisi, satırın hiç görünmemesinden çok daha işe yarar — ilkinde
          ölçüm çalışıyor ve cevap sıfır, ikincisinde ölçümün çalışıp
          çalışmadığı bile belli değil. */}
      <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { etiket: "Telefon tuşu", deger: olay["telefon"] ?? 0, alt: "son 30 gün" },
          { etiket: "E-posta tuşu", deger: olay["eposta"] ?? 0, alt: "son 30 gün" },
          { etiket: "Yeni talep", deger: adet["yeni"] ?? 0, alt: "işlem bekleyen" },
          { etiket: "Gerçek talep", deger: gercek, alt: "spam hariç" },
        ].map((k) => (
          <div key={k.etiket} className="rounded-xl border border-line bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {k.etiket}
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold leading-none">
              {k.deger}
            </p>
            <p className="mt-1 text-xs text-muted">{k.alt}</p>
          </div>
        ))}
      </section>

      {/* Durum süzgeci */}
      <nav className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/admin"
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${!sp.durum ? "bg-shell text-white" : "border border-line hover:bg-surface-alt"}`}
        >
          Hepsi {toplam}
        </Link>
        {DURUMLAR.map((d) => (
          <Link
            key={d}
            href={`/admin?durum=${d}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${sp.durum === d ? "bg-shell text-white" : "border border-line hover:bg-surface-alt"}`}
          >
            {DURUM_ETIKET[d]} {adet[d] ?? 0}
          </Link>
        ))}
      </nav>

      <form className="mt-4" action="/admin">
        {sp.durum ? <input type="hidden" name="durum" value={sp.durum} /> : null}
        <input
          name="ara"
          defaultValue={sp.ara ?? ""}
          placeholder="Ad, e-posta, firma veya mesajda ara…"
          className="w-full max-w-sm rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus-visible:border-accent"
        />
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-surface-alt">
            <tr>
              {["Tarih", "Ad", "Firma", "Ülke", "Tür", "Durum"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {liste.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Kayıt yok.
                </td>
              </tr>
            ) : (
              liste.map((t) => (
                <tr key={t.id} className="border-t border-line hover:bg-surface-alt">
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{tarih(t.olusturuldu)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/talep/${t.id}`} className="font-medium underline-offset-4 hover:underline">
                      {t.ad || t.eposta || `#${t.id}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{t.firma || "—"}</td>
                  <td className="px-4 py-3 text-muted">{t.ulke || "—"}</td>
                  <td className="px-4 py-3 text-muted">
                    {t.tur === "rfq" ? "Teklif" : "İletişim"}
                    {t.kaynak === "elle" ? " · elle" : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${DURUM_RENK[t.durum] ?? ""}`}>
                      {DURUM_ETIKET[t.durum] ?? t.durum}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TalepEkleKutusu />
    </main>
  );
}
