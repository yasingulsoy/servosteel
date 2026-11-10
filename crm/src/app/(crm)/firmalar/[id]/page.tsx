import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, ExternalLink, FileText, Info, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { DosyaFormu, FirmaBilgiFormu, KisiFormu, TeklifFormu, TemasFormu } from "@/components/formlar";
import { IlgiSecimi } from "@/components/ilgi-secimi";
import { IlgiEtiketleri, PotansiyelRozeti, Rozet } from "@/components/rozet";
import { SayfaBasligi, Uyari } from "@/components/sayfa";
import { TakipSecici } from "@/components/takip-secici";
import { para, sayi, tarih, zaman } from "@/lib/bicim";
import { oturumZorunlu, yazabilir } from "@/lib/oturum";
import { DOVIZ, FIRMA_DURUMU, KANAL, RED_SEBEBI, TEKLIF_DURUMU, TEKLIF_RENK } from "@/lib/sabitler";
import { bolgesi } from "@/lib/ulkeler";
import {
  etkinlikler,
  firma,
  firmaDosyalari,
  firmaGorevleri,
  firmaIlgiKodlari,
  firmaKisileri,
  firmaMakineleri,
  firmaServisleri,
  firmaSiparisleri,
  firmaTeklifleri,
  firmaTemaslari,
  ilgiAlanlari,
  kullanicilar,
  zamanCizelgesi,
} from "@/lib/veri";
import { siparisTekliften } from "../../servis/actions";
import { Bolum, GorevBolumu, SatisSonrasiBolumu, ZamanCizelgesi } from "./bolumler";
import {
  firmaGuncelle,
  firmaSil,
  ilgiKaydet,
  kisiKaydet,
  kisiSil,
  notEkle,
  takipDegistir,
  temasKaydet,
  temasSil,
} from "../actions";
import { dosyaSil, dosyaYukle, teklifKaydet, teklifSil } from "../../teklifler/actions";

export async function generateMetadata(props: PageProps<"/firmalar/[id]">): Promise<Metadata> {
  const no = sayi((await props.params).id);
  const f = no ? await firma(no) : null;
  return { title: f?.ad ?? "Firma" };
}

export default async function FirmaKarti(props: PageProps<"/firmalar/[id]">) {
  const ben = await oturumZorunlu();
  const no = sayi((await props.params).id);
  const sp = await props.searchParams;
  if (!no) notFound();
  const f = await firma(no);
  if (!f) notFound();

  const [kisiler, temaslar, secili, ilgiler, ets, teklifListesi, dosyalar, gorevListesi, siparisler, makineler, servisListesi, cizelge, kullanicilarListesi] =
    await Promise.all([
      firmaKisileri(no),
      firmaTemaslari(no),
      firmaIlgiKodlari(no),
      ilgiAlanlari(),
      etkinlikler(),
      firmaTeklifleri(no),
      firmaDosyalari(no),
      firmaGorevleri(no),
      firmaSiparisleri(no),
      firmaMakineleri(no),
      firmaServisleri(no),
      zamanCizelgesi(f),
      kullanicilar(),
    ]);
  const siparisliTeklifler = new Set(siparisler.map((s) => s.teklif_id));
  const yaz = yazabilir(ben);
  const ilgiAdlari = ilgiler.filter((i) => secili.includes(i.kod)).map((i) => i.ad);

  return (
    <div className="space-y-6 md:space-y-8">
      <SayfaBasligi
        baslik={f.ad}
        yanina={
          <>
            <PotansiyelRozeti p={f.potansiyel} />
            <Rozet sinif="bg-gray-700 text-white">{FIRMA_DURUMU[f.durum]}</Rozet>
          </>
        }
        yol={[{ ad: "Firmalar", href: "/firmalar" }]}
        konum="Firma kartı"
      />

      {/* Firma özeti (TailAdmin profil kartı) */}
      <div className="kart p-5 lg:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-brand-50 text-lg font-semibold text-brand-500">
            {f.ad.trim().slice(0, 2).toLocaleUpperCase("tr")}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={16} className="text-gray-400" />
                {[f.sehir, f.ulke].filter(Boolean).join(", ") || "Ülke yok"}
                {f.bolge ?? bolgesi(f.ulke) ? ` · ${f.bolge ?? bolgesi(f.ulke)}` : ""}
              </span>
              {f.web ? (
                <a
                  href={f.web}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-brand-500 hover:text-brand-600"
                >
                  {f.alan_adi ?? f.web} <ExternalLink size={14} />
                </a>
              ) : null}
              {f.sektor ? (
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase size={16} className="text-gray-400" /> {f.sektor}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <UserRound size={16} className="text-gray-400" /> {f.sorumlu ?? "sorumlu yok"}
              </span>
            </div>
            {f.faaliyet ? <p className="max-w-3xl text-sm whitespace-pre-line text-gray-700">{f.faaliyet}</p> : null}
            {f.notlar ? (
              <p className="max-w-3xl rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm whitespace-pre-line text-gray-700">
                {f.notlar}
              </p>
            ) : null}
            <IlgiEtiketleri ilgiler={ilgiAdlari} />
          </div>
        </div>
      </div>

      {sp.mevcut ? (
        <Uyari tur="bilgi" simge={Info}>
          Bu firma zaten kayıtlıydı; yeni kişi ve görüşme bu karta eklendi.
        </Uyari>
      ) : null}

      <Bolum baslik={`Kurum yetkilileri (${kisiler.length})`}>
        {kisiler.length === 0 ? <p className="text-sm text-muted">Kayıtlı kişi yok.</p> : null}
        <div className="grid gap-3 md:grid-cols-2">
          {kisiler.map((k) => (
            <div key={k.id} className="kart p-5">
              <p className="text-base font-medium text-gray-800">{k.ad}</p>
              {k.unvan ? <p className="text-sm text-gray-500">{k.unvan}</p> : null}
              <div className="mt-3 space-y-1 text-sm text-gray-700">
                {[k.eposta, k.eposta2].filter(Boolean).map((e) => (
                  <a key={e} href={`mailto:${e}`} className="flex items-center gap-2 hover:text-brand-500">
                    <Mail size={16} className="text-gray-400" /> {e}
                  </a>
                ))}
                {k.telefon ? (
                  <a href={`tel:${k.telefon.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 hover:text-brand-500">
                    <Phone size={16} className="text-gray-400" /> {k.telefon}
                  </a>
                ) : null}
                {k.notlar ? <p className="text-gray-500">{k.notlar}</p> : null}
              </div>
              {yaz ? (
                <details className="mt-3">
                  <summary className="kucuk-ac">Düzenle</summary>
                  <div className="mt-3 space-y-3">
                    <KisiFormu eylem={kisiKaydet} firmaId={f.id} k={k} />
                    <form action={kisiSil}>
                      <input type="hidden" name="firma_id" value={f.id} />
                      <input type="hidden" name="kisi_id" value={k.id} />
                      <button type="submit" className="dugme-tehlike">
                        Kişiyi sil
                      </button>
                    </form>
                  </div>
                </details>
              ) : null}
            </div>
          ))}
        </div>
        {yaz ? (
          <details className="kart p-5">
            <summary className="kart-baslik">Kişi ekle</summary>
            <div className="mt-5 border-t border-gray-100 pt-5">
              <KisiFormu eylem={kisiKaydet} firmaId={f.id} />
            </div>
          </details>
        ) : null}
      </Bolum>

      <Bolum baslik={`Görüşmeler (${temaslar.length})`}>
        {temaslar.length === 0 ? <p className="text-sm text-muted">Kayıtlı görüşme yok.</p> : null}
        <div className="space-y-3">
          {temaslar.map((t) => (
            <div key={t.id} className="kart p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <TakipSecici eylem={takipDegistir} temasId={t.id} takip={t.takip} geri={`/firmalar/${f.id}`} yazabilir={yaz} />
                {t.etkinlik_ad ? (
                  <Link href={`/etkinlikler/${t.etkinlik_id}`} className="text-sm font-medium text-gray-800 hover:text-brand-500">
                    {t.etkinlik_ad}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-gray-800">{KANAL[t.kanal]}</span>
                )}
                {t.kisi_ad ? <span className="text-sm text-gray-500">{t.kisi_ad}</span> : null}
                <span className="ml-auto text-theme-xs text-gray-500">
                  {t.tarih ? `görüşme ${tarih(t.tarih)}` : ""}
                  {t.tarih && t.son_temas ? " · " : ""}
                  {t.son_temas ? `son temas ${tarih(t.son_temas)}` : ""}
                </span>
              </div>
              {t.talep ? <p className="mt-3 text-sm whitespace-pre-line text-gray-700">{t.talep}</p> : null}
              {t.notlar ? <p className="mt-1 text-sm whitespace-pre-line text-gray-500">{t.notlar}</p> : null}
              {yaz ? (
                <details className="mt-3">
                  <summary className="kucuk-ac">Düzenle</summary>
                  <div className="mt-3 space-y-3">
                    <TemasFormu eylem={temasKaydet} firmaId={f.id} t={t} kisiler={kisiler} etkinlikler={ets} />
                    <form action={temasSil}>
                      <input type="hidden" name="firma_id" value={f.id} />
                      <input type="hidden" name="temas_id" value={t.id} />
                      <button type="submit" className="dugme-tehlike">
                        Görüşmeyi sil
                      </button>
                    </form>
                  </div>
                </details>
              ) : null}
            </div>
          ))}
        </div>
        {yaz ? (
          <details className="kart p-5">
            <summary className="kart-baslik">Görüşme ekle</summary>
            <div className="mt-5 border-t border-gray-100 pt-5">
              <TemasFormu eylem={temasKaydet} firmaId={f.id} kisiler={kisiler} etkinlikler={ets} />
            </div>
          </details>
        ) : null}
      </Bolum>

      <GorevBolumu firmaId={f.id} gorevler={gorevListesi} kisiler={kullanicilarListesi} ben={ben.kullanici} yaz={yaz} />

      <Bolum baslik={`Teklifler (${teklifListesi.length})`}>
        {teklifListesi.length === 0 ? <p className="text-sm text-muted">Kayıtlı teklif yok.</p> : null}
        <div className="space-y-3">
          {teklifListesi.map((tk) => (
            <div key={tk.id} className="kart p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Rozet sinif={TEKLIF_RENK[tk.durum]}>{TEKLIF_DURUMU[tk.durum]}</Rozet>
                <span className="font-medium text-gray-800">{tk.teklif_no ?? "Numarasız teklif"}</span>
                {tk.tutar ? (
                  <span className="text-sm font-semibold text-gray-800">
                    {para(tk.tutar)} {DOVIZ[tk.doviz]}
                  </span>
                ) : null}
                <span className="ml-auto text-theme-xs text-gray-500">
                  {tarih(tk.tarih)}
                  {tk.gecerlilik ? ` · geçerlilik ${tarih(tk.gecerlilik)}` : ""}
                </span>
              </div>
              {tk.konu ? <p className="mt-2 text-sm text-gray-700">{tk.konu}</p> : null}
              {tk.red_sebebi ? <p className="mt-1 text-sm text-error-600">Red sebebi: {RED_SEBEBI[tk.red_sebebi]}</p> : null}
              {tk.notlar ? <p className="mt-1 text-sm text-gray-500">{tk.notlar}</p> : null}
              {tk.dosya_id ? (
                <a
                  href={`/dosya/${tk.dosya_id}`}
                  target="_blank"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600"
                >
                  <FileText size={16} /> {tk.dosya_ad}
                </a>
              ) : null}
              {yaz && (tk.durum === "kabul" || tk.durum === "gonderildi") && !siparisliTeklifler.has(tk.id) ? (
                <form action={siparisTekliften} className="mt-3">
                  <input type="hidden" name="firma_id" value={f.id} />
                  <input type="hidden" name="teklif_id" value={tk.id} />
                  <button type="submit" className="dugme-ikincil">
                    {tk.durum === "kabul" ? "Siparişe çevir" : "Kabul edildi, siparişe çevir"}
                  </button>
                </form>
              ) : null}
              {yaz ? (
                <details className="mt-3">
                  <summary className="kucuk-ac">Düzenle</summary>
                  <div className="mt-3 space-y-3">
                    <TeklifFormu eylem={teklifKaydet} firmaId={f.id} t={tk} temaslar={temaslar} />
                    <form action={teklifSil}>
                      <input type="hidden" name="firma_id" value={f.id} />
                      <input type="hidden" name="teklif_id" value={tk.id} />
                      <button type="submit" className="dugme-tehlike">
                        Teklifi sil
                      </button>
                    </form>
                  </div>
                </details>
              ) : null}
            </div>
          ))}
        </div>
        {yaz ? (
          <details className="kart p-5">
            <summary className="kart-baslik">Teklif ekle</summary>
            <div className="mt-5 border-t border-gray-100 pt-5">
              <TeklifFormu eylem={teklifKaydet} firmaId={f.id} temaslar={temaslar} />
            </div>
          </details>
        ) : null}
      </Bolum>

      <SatisSonrasiBolumu
        firmaId={f.id}
        siparisler={siparisler}
        makineler={makineler}
        servisler={servisListesi}
        kisiler={kullanicilarListesi}
        yaz={yaz}
      />

      <Bolum baslik={`Dosyalar (${dosyalar.length})`}>
        {dosyalar.length ? (
          <ul className="kart divide-y divide-gray-100">
            {dosyalar.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-4 text-sm">
                <a href={`/dosya/${d.id}`} target="_blank" className="inline-flex items-center gap-2 font-medium text-gray-800 hover:text-brand-500">
                  <FileText size={16} className="text-gray-400" /> {d.ad}
                </a>
                <span className="text-theme-xs text-gray-500">
                  {Math.max(1, Math.round(d.boyut / 1024))} KB · {d.yukleyen} · {zaman(d.olusturuldu)}
                </span>
                {yaz ? (
                  <form action={dosyaSil} className="ml-auto">
                    <input type="hidden" name="firma_id" value={f.id} />
                    <input type="hidden" name="dosya_id" value={d.id} />
                    <button type="submit" className="text-theme-sm font-medium text-error-600 hover:text-error-700">
                      Sil
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Dosya yok.</p>
        )}
        {yaz ? <DosyaFormu eylem={dosyaYukle} firmaId={f.id} /> : null}
      </Bolum>

      <Bolum baslik="Zaman çizelgesi">
        {yaz ? (
          <form action={notEkle} className="flex gap-2">
            <input type="hidden" name="firma_id" value={f.id} />
            <input name="metin" required placeholder="Not ekle…" className="alan" />
            <button type="submit" className="dugme shrink-0">
              Ekle
            </button>
          </form>
        ) : null}
        <p className="text-theme-xs text-gray-500">
          Sarı: CRM&apos;de girilenler. Mavi: panelden (tanıtım mailleri, gelen yanıtlar, mailden siteye gelişler).
        </p>
        <ZamanCizelgesi ogeler={cizelge} />
      </Bolum>

      {yaz ? (
        <>
          <details className="kart p-5">
            <summary className="kart-baslik">İlgi alanlarını düzenle</summary>
            <form action={ilgiKaydet} className="mt-5 border-t border-gray-100 pt-5 space-y-4">
              <input type="hidden" name="id" value={f.id} />
              <IlgiSecimi ilgiler={ilgiler} secili={secili} />
              <button type="submit" className="dugme">
                Kaydet
              </button>
            </form>
          </details>
          <details className="kart p-5">
            <summary className="kart-baslik">Firma bilgilerini düzenle</summary>
            <div className="mt-5 border-t border-gray-100 pt-5">
              <FirmaBilgiFormu eylem={firmaGuncelle} f={f} kisiler={kullanicilarListesi} />
            </div>
          </details>
        </>
      ) : null}

      {ben.rol === "yonetici" ? (
        <details className="kart border-error-200 p-5">
          <summary className="kart-baslik text-error-600 hover:text-error-700">Firmayı sil</summary>
          <form action={firmaSil} className="mt-5 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-5">
            <input type="hidden" name="id" value={f.id} />
            <div>
              <label className="etiket" htmlFor="onay">
                Kişileri, görüşmeleri ve notlarıyla birlikte silinir. Onay için SIL yazın.
              </label>
              <input id="onay" name="onay" required pattern="SIL" className="alan max-w-40" />
            </div>
            <button type="submit" className="dugme-tehlike">
              Sil
            </button>
          </form>
        </details>
      ) : null}

      <p className="text-theme-xs text-gray-500">
        Kaydeden {f.olusturan ?? "—"} · {zaman(f.olusturuldu)} · son değişiklik {zaman(f.guncellendi)}
      </p>
    </div>
  );
}
