import Form from "next/form";
import Link from "next/link";
import {
  CornerUpLeft,
  Forward,
  Inbox,
  MailOpen,
  Paperclip,
  PenLine,
  RefreshCw,
  Search,
  Send,
  TriangleAlert,
  X,
} from "lucide-react";
import type { IletiOzeti, Klasor, OkunanIleti } from "@/lib/posta";
import { kutuKisaAdi } from "@/lib/posta-bicim";
import { goreli, tamTarih } from "@/lib/zaman";

/**
 * E-posta istemcisinin görünüm parçaları — veriyi PROP olarak alırlar, kendileri
 * bir şey okumazlar. Sayfa (page.tsx) kutudan okur ve buraya verir.
 *
 * Masaüstünde üç sütun: hesaplar · liste · okuma. Telefonda tek sütun: liste,
 * bir ileti açılınca yalnızca o (geri bağlantısıyla). Hesap ve klasör
 * telefonda üstte yatay düğmeler.
 */

export type HesapSatiri = { user: string; ad: string; bekleyen: number };
export type Sinif = { tur: string; firma_id: number | null; firma: string | null };
/** Tüm hesaplarda aramada her satır kendi kutusunu ve klasörünü taşır. */
export type ListeSatiri = IletiOzeti & {
  sinif: Sinif | null;
  firma: { id: number; firma: string } | null;
  kutu?: string;
  klasor?: Klasor;
};
/** Açık arama — bağlantılar aramayı kaybetmesin diye her yere taşınır. */
export type AramaBaglami = { ara: string; tum: boolean } | null;

export const TUR_ETIKET: Record<string, string> = {
  yanit: "Yanıt",
  geri_donus: "Geri döndü",
  gecici: "Gecikiyor",
  otomatik: "Otomatik",
  abonelik: "Çıktı",
};
const TUR_RENK: Record<string, string> = {
  yanit: "bg-violet-500/15 text-violet-700",
  geri_donus: "bg-red-500/15 text-red-700",
  gecici: "bg-amber-500/15 text-amber-800",
  otomatik: "bg-zinc-500/10 text-zinc-600",
  abonelik: "bg-amber-500/15 text-amber-800",
};

/** Panel içi bağlantı — boş parametreler yazılmaz. */
export function posta(
  kutu: string,
  klasor: Klasor,
  ek: { uid?: number; sayfa?: number; yaz?: string; kime?: string; arama?: AramaBaglami } = {}
): string {
  const p = new URLSearchParams({ kutu, klasor });
  if (ek.uid) p.set("uid", String(ek.uid));
  if (ek.sayfa && ek.sayfa > 1) p.set("sayfa", String(ek.sayfa));
  if (ek.yaz) p.set("yaz", ek.yaz);
  if (ek.kime) p.set("kime", ek.kime);
  if (ek.arama?.ara) {
    p.set("ara", ek.arama.ara);
    if (ek.arama.tum) p.set("kapsam", "tum");
  }
  return `/admin/eposta?${p.toString()}`;
}

/** Listede tarih: bugünse saat, bu yılsa gün ay, değilse gün.ay.yıl — İstanbul saatiyle. */
function listeTarihi(iso: string | null): string {
  if (!iso) return "";
  const t = new Date(iso);
  const tz = "Europe/Istanbul";
  const gun = (d: Date) => d.toLocaleDateString("tr-TR", { timeZone: tz });
  const simdi = new Date();
  if (gun(t) === gun(simdi)) return t.toLocaleTimeString("tr-TR", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
  const buYil = t.toLocaleDateString("tr-TR", { timeZone: tz, year: "numeric" }) === simdi.toLocaleDateString("tr-TR", { timeZone: tz, year: "numeric" });
  return buYil
    ? t.toLocaleDateString("tr-TR", { timeZone: tz, day: "numeric", month: "short" })
    : t.toLocaleDateString("tr-TR", { timeZone: tz, day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ------------------------------------------------------------- hesaplar */

export function HesapPaneli({
  hesaplar,
  kutu,
  klasor,
  tarama,
  taraEylemi,
}: {
  hesaplar: HesapSatiri[];
  kutu: string;
  klasor: Klasor;
  tarama: { bitti: string | null; son_hata: string } | null;
  taraEylemi: () => Promise<void>;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Link
          href={posta(kutu, klasor, { yaz: "yeni" })}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-zinc-950"
        >
          <PenLine className="size-4" aria-hidden /> Yeni e-posta
        </Link>
      </div>

      <p className="px-4 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Hesaplar</p>
      <nav className="mt-1 flex-1 overflow-y-auto px-2 pb-3" aria-label="E-posta hesapları">
        <ul className="space-y-0.5">
          {hesaplar.map((h) => {
            const secili = h.user === kutu;
            return (
              <li key={h.user}>
                <Link
                  href={posta(h.user, "gelen")}
                  aria-current={secili ? "true" : undefined}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm ${
                    secili ? "bg-surface-alt font-semibold text-ink" : "text-muted hover:bg-surface-alt hover:text-ink"
                  }`}
                  title={`${h.ad} <${h.user}>`}
                >
                  <span className="min-w-0 flex-1 truncate">{h.user}</span>
                  {h.bekleyen > 0 ? (
                    <span className="shrink-0 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-violet-700" title="Elden geçmemiş yanıt">
                      {h.bekleyen}
                    </span>
                  ) : null}
                </Link>
                {secili ? (
                  <ul className="mb-1 ml-3 mt-0.5 space-y-0.5 border-l border-line pl-2">
                    {(
                      [
                        ["gelen", "Gelen", Inbox],
                        ["giden", "Gönderilmiş", Send],
                      ] as const
                    ).map(([k, ad, Ikon]) => (
                      <li key={k}>
                        <Link
                          href={posta(h.user, k)}
                          aria-current={klasor === k ? "page" : undefined}
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                            klasor === k ? "bg-accent/15 font-semibold text-ink" : "text-muted hover:text-ink"
                          }`}
                        >
                          <Ikon className="size-4 shrink-0" aria-hidden /> {ad}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line px-4 py-3 text-xs text-muted">
        <p>
          {tarama?.son_hata ? (
            <span className="text-red-700">Tarama hatası: {tarama.son_hata}</span>
          ) : tarama?.bitti ? (
            <>
              Yanıtlar <span title={tamTarih(tarama.bitti)}>{goreli(tarama.bitti)}</span> işlendi
            </>
          ) : (
            "Henüz taranmadı"
          )}
        </p>
        <form action={taraEylemi} className="mt-1.5">
          <button className="inline-flex items-center gap-1.5 font-semibold text-ink hover:underline">
            <RefreshCw className="size-3.5" aria-hidden /> Şimdi tara
          </button>
        </form>
      </div>
    </div>
  );
}

/** Telefonda üstte: hesap ve klasör düğmeleri, yatay kayar. */
export function MobilSecici({ hesaplar, kutu, klasor }: { hesaplar: HesapSatiri[]; kutu: string; klasor: Klasor }) {
  const dugme = (secili: boolean) =>
    `shrink-0 rounded-full border px-3 py-1.5 text-sm ${
      secili ? "border-accent bg-accent/15 font-semibold text-ink" : "border-line bg-card text-muted"
    }`;
  return (
    <div className="mb-3 space-y-2 lg:hidden">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {hesaplar.map((h) => (
          <Link key={h.user} href={posta(h.user, klasor)} className={dugme(h.user === kutu)}>
            {kutuKisaAdi(h.user)}
            {h.bekleyen > 0 ? <span className="ml-1 font-semibold text-violet-700">{h.bekleyen}</span> : null}
          </Link>
        ))}
      </div>
      <div className="flex gap-2">
        <Link href={posta(kutu, "gelen")} className={dugme(klasor === "gelen")}>
          Gelen
        </Link>
        <Link href={posta(kutu, "giden")} className={dugme(klasor === "giden")}>
          Gönderilmiş
        </Link>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- liste */

/**
 * Arama kutusu — adres çubuğuna `ara` (ve istenirse `kapsam=tum`) yazan düz
 * bir GET formu; sayfa yenilenmeden gezinir (next/form). Aramayı sunucu yapar.
 */
function AramaKutusu({ kutu, klasor, arama }: { kutu: string; klasor: Klasor; arama: AramaBaglami }) {
  return (
    <Form action="/admin/eposta" className="border-b border-line px-3 py-2.5">
      <input type="hidden" name="kutu" value={kutu} />
      <input type="hidden" name="klasor" value={klasor} />
      <div className="flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
        <Search className="size-4 shrink-0 text-muted" aria-hidden />
        <input
          key={arama?.ara ?? ""}
          type="text"
          enterKeyHint="search"
          name="ara"
          defaultValue={arama?.ara ?? ""}
          maxLength={100}
          placeholder="Kişi, adres, konu ya da metin…"
          aria-label="E-postalarda ara"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
        />
        {arama ? (
          <Link href={posta(kutu, klasor)} className="rounded p-1 text-muted hover:text-ink" aria-label="Aramayı temizle">
            <X className="size-4" aria-hidden />
          </Link>
        ) : null}
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input
            key={arama ? String(arama.tum) : "yok"}
            type="checkbox"
            name="kapsam"
            value="tum"
            defaultChecked={arama?.tum ?? false}
          />
          Tüm hesaplarda (Gelen + Gönderilmiş)
        </label>
        <button className="rounded-md px-2 py-1 text-xs font-semibold text-ink hover:bg-surface-alt">Ara</button>
      </div>
    </Form>
  );
}

export function IletiListesi({
  kutu,
  klasor,
  satirlar,
  toplam,
  sayfa,
  sayfaSayisi,
  seciliUid,
  hata,
  uyari,
  klasorYok,
  arama = null,
}: {
  kutu: string;
  klasor: Klasor;
  satirlar: ListeSatiri[];
  toplam: number;
  sayfa: number;
  sayfaSayisi: number;
  seciliUid?: number;
  hata?: string | null;
  /** Liste gösterilir ama üstünde not: bazı kutular aranamadı, sonuçlar kesildi… */
  uyari?: string | null;
  klasorYok?: boolean;
  arama?: AramaBaglami;
}) {
  const klasorAdi = klasor === "gelen" ? "Gelen" : "Gönderilmiş";
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-baseline justify-between gap-2 border-b border-line px-4 py-3">
        <h2 className="min-w-0 truncate font-semibold">
          {arama ? (
            <>
              “{arama.ara}”
              <span className="ml-1.5 font-normal text-muted">
                · {arama.tum ? "tüm hesaplar" : `${klasorAdi} · ${kutuKisaAdi(kutu)}`}
              </span>
            </>
          ) : (
            <>
              {klasorAdi}
              <span className="ml-1.5 font-normal text-muted">· {kutuKisaAdi(kutu)}</span>
            </>
          )}
        </h2>
        <span className="shrink-0 text-xs text-muted">
          {toplam.toLocaleString("tr-TR")} {arama ? "sonuç" : "ileti"}
        </span>
      </div>

      <AramaKutusu kutu={kutu} klasor={klasor} arama={arama} />

      {uyari ? <p className="border-b border-line bg-amber-50 px-4 py-2 text-xs text-amber-900">{uyari}</p> : null}

      {hata ? (
        <p className="m-4 flex gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-800">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{hata}</span>
        </p>
      ) : klasorYok ? (
        <p className="m-4 text-sm text-muted">Bu kutuda Gönderilmiş klasörü yok. İlk gönderimde kendiliğinden oluşturulur.</p>
      ) : satirlar.length === 0 ? (
        <p className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted">
          <MailOpen className="size-6 opacity-40" aria-hidden />
          {arama ? `“${arama.ara}” için sonuç yok.` : "Klasör boş."}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
          {satirlar.map((m) => {
            const mKutu = m.kutu ?? kutu;
            const mKlasor = m.klasor ?? klasor;
            const secili = m.uid === seciliUid && mKutu === kutu && mKlasor === klasor;
            const okunmadi = !m.okundu && mKlasor === "gelen";
            const tur = m.sinif?.tur && TUR_ETIKET[m.sinif.tur] ? m.sinif.tur : null;
            const firma = m.sinif?.firma ?? m.firma?.firma ?? null;
            return (
              <li key={`${mKutu}-${mKlasor}-${m.uid}`}>
                <Link
                  href={posta(mKutu, mKlasor, { uid: m.uid, sayfa, arama })}
                  aria-current={secili ? "true" : undefined}
                  className={`block px-4 py-2.5 ${secili ? "bg-accent/10" : "hover:bg-surface-alt"}`}
                >
                  {m.kutu ? (
                    <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {kutuKisaAdi(m.kutu)} · {mKlasor === "gelen" ? "Gelen" : "Gönderilmiş"}
                    </p>
                  ) : null}
                  <div className="flex items-baseline gap-2">
                    {okunmadi ? <span className="size-2 shrink-0 translate-y-[-1px] rounded-full bg-accent" aria-label="okunmadı" /> : null}
                    <span className={`min-w-0 flex-1 truncate text-sm ${okunmadi ? "font-bold text-ink" : "font-medium"}`}>
                      {mKlasor === "giden" ? <span className="font-normal text-muted">Kime: </span> : null}
                      {m.kisi}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted">{listeTarihi(m.tarih)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {m.yanitlandi ? <CornerUpLeft className="size-3.5 shrink-0 text-muted" aria-label="yanıtlandı" /> : null}
                    <span className={`min-w-0 flex-1 truncate text-sm ${okunmadi ? "text-ink" : "text-muted"}`}>
                      {m.konu || "(konusuz)"}
                    </span>
                    {m.ekVar ? <Paperclip className="size-3.5 shrink-0 text-muted" aria-label="ek var" /> : null}
                  </div>
                  {tur || firma ? (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {tur ? (
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${TUR_RENK[tur]}`}>
                          {TUR_ETIKET[tur]}
                        </span>
                      ) : null}
                      {firma ? <span className="truncate text-[11px] text-muted">{firma}</span> : null}
                    </div>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {sayfaSayisi > 1 ? (
        <nav className="flex items-center justify-between border-t border-line px-4 py-2 text-sm" aria-label="Sayfalar">
          {sayfa > 1 ? (
            <Link href={posta(kutu, klasor, { sayfa: sayfa - 1, arama })} className="rounded-md px-2 py-1 hover:bg-surface-alt">
              ← Yeni
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted">
            {sayfa} / {sayfaSayisi}
          </span>
          {sayfa < sayfaSayisi ? (
            <Link href={posta(kutu, klasor, { sayfa: sayfa + 1, arama })} className="rounded-md px-2 py-1 hover:bg-surface-alt">
              Eski →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- okuma */

export function IletiOkuyucu({
  ileti,
  kutu,
  klasor,
  sayfa,
  sinif,
  firma,
  arama = null,
}: {
  ileti: OkunanIleti;
  kutu: string;
  klasor: Klasor;
  sayfa: number;
  sinif: Sinif | null;
  firma: { id: number; firma: string } | null;
  arama?: AramaBaglami;
}) {
  const tur = sinif?.tur && TUR_ETIKET[sinif.tur] ? sinif.tur : null;
  const firmaId = sinif?.firma_id ?? firma?.id ?? null;
  const firmaAdi = sinif?.firma ?? firma?.firma ?? null;
  const dugme =
    "inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:bg-surface-alt";
  return (
    <article className="flex h-full min-h-0 flex-col">
      <header className="border-b border-line px-5 py-4">
        <Link href={posta(kutu, klasor, { sayfa, arama })} className="mb-2 inline-block text-sm text-muted hover:text-ink lg:hidden">
          ← {arama ? "Sonuçlara dön" : "Listeye dön"}
        </Link>
        {arama?.tum ? (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
            {kutuKisaAdi(kutu)} · {klasor === "gelen" ? "Gelen" : "Gönderilmiş"}
          </p>
        ) : null}
        <h2 className="break-words text-lg font-semibold leading-snug">{ileti.konu || "(konusuz)"}</h2>
        <dl className="mt-2 grid grid-cols-[3.5rem_1fr] gap-x-2 gap-y-0.5 text-sm">
          <dt className="text-muted">Kimden</dt>
          <dd className="min-w-0 break-words">{ileti.kimden}</dd>
          <dt className="text-muted">Kime</dt>
          <dd className="min-w-0 break-words text-muted">{ileti.kime}</dd>
          {ileti.bilgi ? (
            <>
              <dt className="text-muted">Bilgi</dt>
              <dd className="min-w-0 break-words text-muted">{ileti.bilgi}</dd>
            </>
          ) : null}
          <dt className="text-muted">Tarih</dt>
          <dd className="text-muted">{ileti.tarih ? tamTarih(ileti.tarih) : "—"}</dd>
        </dl>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {klasor === "gelen" ? (
            <Link href={posta(kutu, klasor, { uid: ileti.uid, sayfa, yaz: "yanit", arama })} className={dugme}>
              <CornerUpLeft className="size-4" aria-hidden /> Yanıtla
            </Link>
          ) : null}
          <Link href={posta(kutu, klasor, { uid: ileti.uid, sayfa, yaz: "ilet", arama })} className={dugme}>
            <Forward className="size-4" aria-hidden /> İlet
          </Link>
          {tur ? (
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TUR_RENK[tur]}`}>{TUR_ETIKET[tur]}</span>
          ) : null}
          {firmaId ? (
            <Link href={`/admin/firmalar/${firmaId}`} className="text-sm font-semibold underline underline-offset-4">
              {firmaAdi ?? "Firma sayfası"} →
            </Link>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-ink">{ileti.metin}</pre>
        {ileti.kirpildi ? <p className="mt-3 text-xs text-muted">İleti uzun olduğu için kırpıldı — tamamı kutuda.</p> : null}
      </div>

      {ileti.ekler.length ? (
        <footer className="border-t border-line px-5 py-3 text-sm">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <Paperclip className="size-3.5" aria-hidden /> Ekler
          </p>
          <p className="mt-1 break-words text-muted">{ileti.ekler.join(" · ")}</p>
          <p className="mt-1 text-xs text-muted">Ekleri açmak için kutuyu Thunderbird&apos;de açın — panel dosya indirmez.</p>
        </footer>
      ) : null}
    </article>
  );
}

export function BosOkuyucu() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center text-sm text-muted">
      <MailOpen className="size-8 opacity-30" aria-hidden />
      Okumak için soldan bir ileti seçin.
    </div>
  );
}
