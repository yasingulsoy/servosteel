import Form from "next/form";
import Link from "next/link";
import {
  Archive,
  CornerUpLeft,
  Download,
  ExternalLink,
  File as DosyaIkon,
  FileArchive,
  FileImage,
  FilePen,
  FileText,
  Flag,
  Folder,
  Forward,
  Inbox,
  Mail,
  MailOpen,
  Paperclip,
  PenLine,
  RefreshCw,
  Reply,
  ReplyAll,
  Search,
  Send,
  ShieldAlert,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import type { IletiOzeti, Klasor, KlasorBilgisi, OkunanIleti } from "@/lib/posta";
import { KLASOR_TURU_ADI, ONIZLENEBILIR, boyutYaz, kutuKisaAdi, type Ek } from "@/lib/posta-bicim";
import { goreli, tamTarih } from "@/lib/zaman";
import { IletiIslemleri } from "./islemler";

/**
 * E-posta istemcisinin görünüm parçaları — veriyi PROP olarak alırlar, kendileri
 * bir şey okumazlar. Sayfa (page.tsx) kutudan okur ve buraya verir.
 *
 * Masaüstünde üç sütun: hesaplar · liste · okuma. Telefonda tek sütun: liste,
 * bir ileti açılınca yalnızca o (geri bağlantısıyla). Hesap ve klasör
 * telefonda üstte yatay düğmeler.
 */

export type HesapSatiri = { user: string; ad: string; bekleyen: number; tanitim: boolean };

/** Klasör simgesi — Outlook'taki gibi türüne göre */
const KLASOR_IKONU = {
  gelen: Inbox,
  taslak: FilePen,
  giden: Send,
  arsiv: Archive,
  onemsiz: ShieldAlert,
  cop: Trash2,
} as const;
const klasorIkonu = (k: { tur: string | null }) => (k.tur ? KLASOR_IKONU[k.tur as keyof typeof KLASOR_IKONU] : Folder);

/** Klasörün adı — tüm hesaplarda aramada satırlar "gelen"/"giden" taşır */
export function klasorAdi(klasorler: KlasorBilgisi[], anahtar: Klasor): string {
  return (
    klasorler.find((k) => k.anahtar === anahtar)?.ad ??
    (KLASOR_TURU_ADI as Record<string, string>)[anahtar] ??
    anahtar
  );
}

/** Okunmamış sayısı anlamsız klasörler: kendi gönderdiklerimiz ve taslaklar */
const alicidan = (anahtar: Klasor) => anahtar === "giden" || anahtar === "taslak";
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
  klasorler,
  tarama,
  taraEylemi,
}: {
  hesaplar: HesapSatiri[];
  kutu: string;
  klasor: Klasor;
  /** Seçili hesabın klasörleri, okunmamış sayılarıyla */
  klasorler: KlasorBilgisi[];
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
                  {!h.tanitim ? (
                    <span className="shrink-0 text-[10px] font-semibold uppercase text-muted" title="Sitenin form kutusu — tanıtım e-postası buradan gitmez">
                      form
                    </span>
                  ) : null}
                  {h.bekleyen > 0 ? (
                    <span className="shrink-0 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-violet-700" title="Elden geçmemiş yanıt">
                      {h.bekleyen}
                    </span>
                  ) : null}
                </Link>
                {secili ? (
                  <ul className="mb-1 ml-3 mt-0.5 space-y-0.5 border-l border-line pl-2">
                    {(klasorler.length
                      ? klasorler
                      : [
                          { anahtar: "gelen", ad: "Gelen", tur: "gelen", okunmamis: 0, toplam: 0, derinlik: 0, yol: "INBOX" },
                        ]
                    ).map((k) => {
                      const Ikon = klasorIkonu(k);
                      /* Taslaklar'da okunmamış yok, kaç taslak olduğu yazılır */
                      const sayi = k.tur === "taslak" ? k.toplam : alicidan(k.anahtar) ? 0 : k.okunmamis;
                      return (
                        <li key={k.anahtar}>
                          <Link
                            href={posta(h.user, k.anahtar)}
                            aria-current={klasor === k.anahtar ? "page" : undefined}
                            style={k.derinlik ? { paddingLeft: `${0.5 + k.derinlik * 0.75}rem` } : undefined}
                            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                              klasor === k.anahtar ? "bg-accent/15 font-semibold text-ink" : "text-muted hover:text-ink"
                            }`}
                          >
                            <Ikon className="size-4 shrink-0" aria-hidden />
                            <span className="min-w-0 flex-1 truncate">{k.ad}</span>
                            {sayi > 0 ? (
                              <span className={`shrink-0 text-xs tabular-nums ${k.tur === "taslak" ? "text-muted" : "font-semibold text-ink"}`}>
                                {sayi}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
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
export function MobilSecici({
  hesaplar,
  kutu,
  klasor,
  klasorler,
}: {
  hesaplar: HesapSatiri[];
  kutu: string;
  klasor: Klasor;
  klasorler: KlasorBilgisi[];
}) {
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
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(klasorler.length ? klasorler : [{ anahtar: "gelen", ad: "Gelen", tur: "gelen", okunmamis: 0 }]).map((k) => (
          <Link key={k.anahtar} href={posta(kutu, k.anahtar)} className={dugme(klasor === k.anahtar)}>
            {k.ad}
            {k.okunmamis > 0 && !alicidan(k.anahtar) ? <span className="ml-1 font-semibold text-ink">{k.okunmamis}</span> : null}
          </Link>
        ))}
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
  klasorler = [],
}: {
  kutu: string;
  klasor: Klasor;
  /** Kutunun klasörleri — başlıktaki ad */
  klasorler?: KlasorBilgisi[];
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
  const acikAd = klasorAdi(klasorler, klasor);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-baseline justify-between gap-2 border-b border-line px-4 py-3">
        <h2 className="min-w-0 truncate font-semibold">
          {arama ? (
            <>
              “{arama.ara}”
              <span className="ml-1.5 font-normal text-muted">
                · {arama.tum ? "tüm hesaplar" : `${acikAd} · ${kutuKisaAdi(kutu)}`}
              </span>
            </>
          ) : (
            <>
              {acikAd}
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
        <p className="m-4 text-sm text-muted">Bu klasör kutuda yok. Gönderilmiş ve Taslaklar ilk kullanımda kendiliğinden açılır.</p>
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
            const okunmadi = !m.okundu && !alicidan(mKlasor);
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
                      {kutuKisaAdi(m.kutu)} · {klasorAdi(klasorler, mKlasor)}
                    </p>
                  ) : null}
                  <div className="flex items-baseline gap-2">
                    {okunmadi ? <span className="size-2 shrink-0 translate-y-[-1px] rounded-full bg-accent" aria-label="okunmadı" /> : null}
                    <span className={`min-w-0 flex-1 truncate text-sm ${okunmadi ? "font-bold text-ink" : "font-medium"}`}>
                      {alicidan(mKlasor) ? <span className="font-normal text-muted">Kime: </span> : null}
                      {m.kisi}
                    </span>
                    {m.bayrakli ? <Flag className="size-3.5 shrink-0 fill-red-500 text-red-600" aria-label="bayraklı" /> : null}
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
  klasorler = [],
  sayfa,
  sinif,
  firma,
  arama = null,
}: {
  ileti: OkunanIleti;
  kutu: string;
  klasor: Klasor;
  /** Kutunun klasörleri — başlıktaki ad ve "Taşı…" listesi */
  klasorler?: KlasorBilgisi[];
  sayfa: number;
  sinif: Sinif | null;
  firma: { id: number; firma: string } | null;
  arama?: AramaBaglami;
}) {
  const tur = sinif?.tur && TUR_ETIKET[sinif.tur] ? sinif.tur : null;
  const firmaId = sinif?.firma_id ?? firma?.id ?? null;
  const firmaAdi = sinif?.firma ?? firma?.firma ?? null;
  /* Açık klasörün türü: tüm hesaplarda aramada klasör listesi yok, anahtar türün kendisi ("gelen"/"giden") */
  const klasorTuru =
    klasorler.find((k) => k.anahtar === klasor)?.tur ?? (klasor in KLASOR_IKONU ? (klasor as keyof typeof KLASOR_IKONU) : null);
  const taslak = klasorTuru === "taslak";
  const dugme =
    "inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:bg-surface-alt";
  const yazBag = (yaz: string) => posta(kutu, klasor, { uid: ileti.uid, sayfa, yaz, arama });
  return (
    <article className="flex h-full min-h-0 flex-col">
      <header className="border-b border-line px-5 py-4">
        <Link href={posta(kutu, klasor, { sayfa, arama })} className="mb-2 inline-block text-sm text-muted hover:text-ink lg:hidden">
          ← {arama ? "Sonuçlara dön" : "Listeye dön"}
        </Link>
        {arama?.tum ? (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
            {kutuKisaAdi(kutu)} · {klasorAdi(klasorler, klasor)}
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
          {ileti.gizli ? (
            <>
              <dt className="text-muted">Gizli</dt>
              <dd className="min-w-0 break-words text-muted">{ileti.gizli}</dd>
            </>
          ) : null}
          <dt className="text-muted">Tarih</dt>
          <dd className="text-muted">{ileti.tarih ? tamTarih(ileti.tarih) : "—"}</dd>
        </dl>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {taslak ? (
            <Link href={yazBag("taslak")} className={`${dugme} border-accent bg-accent/15`}>
              <FilePen className="size-4" aria-hidden /> Taslağı düzenle
            </Link>
          ) : (
            <>
              <Link href={yazBag("yanit")} className={dugme}>
                <Reply className="size-4" aria-hidden /> Yanıtla
              </Link>
              <Link href={yazBag("yanit-tum")} className={dugme}>
                <ReplyAll className="size-4" aria-hidden /> Tümünü yanıtla
              </Link>
              <Link href={yazBag("ilet")} className={dugme}>
                <Forward className="size-4" aria-hidden /> İlet
              </Link>
            </>
          )}
          {tur ? (
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TUR_RENK[tur]}`}>{TUR_ETIKET[tur]}</span>
          ) : null}
          {firmaId ? (
            <Link href={`/admin/firmalar/${firmaId}`} className="text-sm font-semibold underline underline-offset-4">
              {firmaAdi ?? "Firma sayfası"} →
            </Link>
          ) : null}
        </div>
        <div className="mt-2">
          <IletiIslemleri
            kutu={kutu}
            klasor={klasor}
            tur={klasorTuru}
            uid={ileti.uid}
            okundu={ileti.okundu}
            bayrakli={ileti.bayrakli}
            klasorler={klasorler.map((k) => ({ anahtar: k.anahtar, ad: k.ad, derinlik: k.derinlik }))}
            listeHref={posta(kutu, klasor, { sayfa, arama })}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-ink">{ileti.metin}</pre>
        {ileti.kirpildi ? (
          <p className="mt-3 text-xs text-muted">Metnin sonu kırpıldı (ileti çok uzun) — ekler aşağıda eksiksiz.</p>
        ) : null}
      </div>

      {ileti.ekler.length ? <EkListesi ekler={ileti.ekler} kutu={kutu} klasor={klasor} uid={ileti.uid} /> : null}
    </article>
  );
}

/* ---------------------------------------------------------------- ekler */

/** Ekin panel adresi — açmak için `goster`, yoksa indirir (bkz. eposta/ek/route.ts). */
export function ekAdresi(kutu: string, klasor: Klasor, uid: number, parca: string, goster = false): string {
  const p = new URLSearchParams({ kutu, klasor, uid: String(uid), parca });
  if (goster) p.set("goster", "1");
  return `/admin/eposta/ek?${p.toString()}`;
}

function ekTuru(tur: string, ad: string): { ikon: typeof DosyaIkon; ad: string } {
  const uzanti = ad.split(".").pop()?.toLowerCase() ?? "";
  if (tur.startsWith("image/")) return { ikon: FileImage, ad: "Görsel" };
  if (tur === "application/pdf") return { ikon: FileText, ad: "PDF" };
  if (tur === "message/rfc822") return { ikon: Mail, ad: "E-posta" };
  if (/zip|rar|7z|tar|gzip/.test(tur) || ["zip", "rar", "7z", "tar", "gz"].includes(uzanti)) return { ikon: FileArchive, ad: "Arşiv" };
  if (/word/.test(tur) || ["doc", "docx"].includes(uzanti)) return { ikon: FileText, ad: "Word" };
  if (/sheet|excel/.test(tur) || ["xls", "xlsx", "csv"].includes(uzanti)) return { ikon: FileText, ad: "Excel" };
  if (["dwg", "dxf", "step", "stp", "igs", "iges"].includes(uzanti)) return { ikon: DosyaIkon, ad: "Çizim" };
  if (tur.startsWith("text/")) return { ikon: FileText, ad: "Metin" };
  return { ikon: DosyaIkon, ad: uzanti ? uzanti.toUpperCase() : "Dosya" };
}

/**
 * Okuyucunun altı: ekler (Aç / İndir, görselde küçük önizleme) ve iletinin
 * içindeki görseller (imza logosu, yapıştırılmış çizim). Görseller ve PDF
 * tarayıcıda açılır; diğer türler yalnızca indirilir.
 */
function EkListesi({ ekler, kutu, klasor, uid }: { ekler: Ek[]; kutu: string; klasor: Klasor; uid: number }) {
  const dosyalar = ekler.filter((e) => !e.satirIci);
  const gorseller = ekler.filter((e) => e.satirIci);
  const dugme =
    "inline-flex shrink-0 items-center gap-1 rounded-md border border-line px-2 py-1 text-xs font-semibold hover:bg-surface-alt";
  const onizleme = (e: Ek) => ONIZLENEBILIR.has(e.tur) && e.tur.startsWith("image/") && e.boyut < 8 * 1024 * 1024;
  return (
    <footer className="max-h-[45%] shrink-0 overflow-y-auto border-t border-line px-5 py-3">
      {dosyalar.length ? (
        <section aria-label="Ekler">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <Paperclip className="size-3.5" aria-hidden /> Ekler ({dosyalar.length})
          </p>
          <ul className="mt-2 space-y-2">
            {dosyalar.map((e) => {
              const { ikon: Ikon, ad } = ekTuru(e.tur, e.ad);
              return (
                <li key={e.parca} className="flex min-w-0 items-center gap-3 rounded-lg border border-line p-2">
                  {onizleme(e) ? (
                    <a href={ekAdresi(kutu, klasor, uid, e.parca, true)} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element -- oturumla kutudan akan ek; next/image iyileştiricisi çerezsiz ister */}
                      <img
                        src={ekAdresi(kutu, klasor, uid, e.parca, true)}
                        alt=""
                        loading="lazy"
                        className="size-12 rounded border border-line bg-white object-cover"
                      />
                    </a>
                  ) : (
                    <Ikon className="size-9 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={e.ad}>
                      {e.ad}
                    </p>
                    <p className="text-xs text-muted">
                      {ad} · {boyutYaz(e.boyut)}
                    </p>
                  </div>
                  {ONIZLENEBILIR.has(e.tur) ? (
                    <a href={ekAdresi(kutu, klasor, uid, e.parca, true)} target="_blank" rel="noopener noreferrer" className={dugme}>
                      <ExternalLink className="size-3.5" aria-hidden /> Aç
                    </a>
                  ) : null}
                  <a href={ekAdresi(kutu, klasor, uid, e.parca)} download={e.ad} className={dugme}>
                    <Download className="size-3.5" aria-hidden /> İndir
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {gorseller.length ? (
        <section aria-label="İletideki görseller" className={dosyalar.length ? "mt-3" : ""}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">İletideki görseller ({gorseller.length})</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {gorseller.slice(0, 12).map((e) =>
              onizleme(e) ? (
                <a
                  key={e.parca}
                  href={ekAdresi(kutu, klasor, uid, e.parca, true)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${e.ad} · ${boyutYaz(e.boyut)}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- oturumla kutudan akan ek */}
                  <img
                    src={ekAdresi(kutu, klasor, uid, e.parca, true)}
                    alt={e.ad}
                    loading="lazy"
                    className="h-16 max-w-32 rounded border border-line bg-white object-contain"
                  />
                </a>
              ) : (
                <a key={e.parca} href={ekAdresi(kutu, klasor, uid, e.parca)} download={e.ad} className={dugme}>
                  <Download className="size-3.5" aria-hidden /> {e.ad}
                </a>
              )
            )}
          </div>
        </section>
      ) : null}
    </footer>
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
