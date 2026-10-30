import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText, Info, Mail, Phone } from "lucide-react";
import { DosyaFormu, FirmaBilgiFormu, KisiFormu, TeklifFormu, TemasFormu } from "@/components/formlar";
import { IlgiSecimi } from "@/components/ilgi-secimi";
import { IlgiEtiketleri, PotansiyelRozeti, Rozet } from "@/components/rozet";
import { TakipSecici } from "@/components/takip-secici";
import { para, sayi, tarih, zaman } from "@/lib/bicim";
import { oturumZorunlu, yazabilir } from "@/lib/oturum";
import { DOVIZ, FIRMA_DURUMU, KANAL, RED_SEBEBI, TEKLIF_DURUMU, TEKLIF_RENK } from "@/lib/sabitler";
import { bolgesi } from "@/lib/ulkeler";
import {
  etkinlikler,
  firma,
  firmaDosyalari,
  firmaIlgiKodlari,
  firmaKisileri,
  firmaNotlari,
  firmaTeklifleri,
  firmaTemaslari,
  ilgiAlanlari,
} from "@/lib/veri";
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

const Bolum = ({ baslik, children }: { baslik: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{baslik}</h2>
    {children}
  </section>
);

export default async function FirmaKarti(props: PageProps<"/firmalar/[id]">) {
  const ben = await oturumZorunlu();
  const no = sayi((await props.params).id);
  const sp = await props.searchParams;
  if (!no) notFound();
  const f = await firma(no);
  if (!f) notFound();

  const [kisiler, temaslar, notlar, secili, ilgiler, ets, teklifListesi, dosyalar] = await Promise.all([
    firmaKisileri(no),
    firmaTemaslari(no),
    firmaNotlari(no),
    firmaIlgiKodlari(no),
    ilgiAlanlari(),
    etkinlikler(),
    firmaTeklifleri(no),
    firmaDosyalari(no),
  ]);
  const yaz = yazabilir(ben);
  const ilgiAdlari = ilgiler.filter((i) => secili.includes(i.kod)).map((i) => i.ad);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/firmalar" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft size={14} /> Firmalar
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold">{f.ad}</h1>
          <PotansiyelRozeti p={f.potansiyel} />
          <Rozet sinif="bg-zinc-900 text-white">{FIRMA_DURUMU[f.durum]}</Rozet>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted">
          <span>
            {[f.sehir, f.ulke].filter(Boolean).join(", ") || "Ülke yok"}
            {f.bolge ?? bolgesi(f.ulke) ? ` · ${f.bolge ?? bolgesi(f.ulke)}` : ""}
          </span>
          {f.web ? (
            <a href={f.web} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-ink">
              {f.alan_adi ?? f.web} <ExternalLink size={12} />
            </a>
          ) : null}
          {f.sektor ? <span>{f.sektor}</span> : null}
        </p>
        {f.faaliyet ? <p className="mt-2 max-w-3xl whitespace-pre-line text-sm">{f.faaliyet}</p> : null}
        {f.notlar ? (
          <p className="mt-2 max-w-3xl whitespace-pre-line rounded-lg bg-amber-50 px-3 py-2 text-sm">{f.notlar}</p>
        ) : null}
        <div className="mt-2">
          <IlgiEtiketleri ilgiler={ilgiAdlari} />
        </div>
      </div>

      {sp.mevcut ? (
        <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <Info size={16} /> Bu firma zaten kayıtlıydı; yeni kişi ve görüşme bu karta eklendi.
        </div>
      ) : null}

      <Bolum baslik={`Kurum yetkilileri (${kisiler.length})`}>
        {kisiler.length === 0 ? <p className="text-sm text-muted">Kayıtlı kişi yok.</p> : null}
        <div className="grid gap-3 md:grid-cols-2">
          {kisiler.map((k) => (
            <div key={k.id} className="kart p-4">
              <p className="font-semibold">{k.ad}</p>
              {k.unvan ? <p className="text-sm text-muted">{k.unvan}</p> : null}
              <div className="mt-2 space-y-0.5 text-sm">
                {[k.eposta, k.eposta2].filter(Boolean).map((e) => (
                  <a key={e} href={`mailto:${e}`} className="flex items-center gap-1.5 hover:underline">
                    <Mail size={13} /> {e}
                  </a>
                ))}
                {k.telefon ? (
                  <a href={`tel:${k.telefon.replace(/[^\d+]/g, "")}`} className="flex items-center gap-1.5 hover:underline">
                    <Phone size={13} /> {k.telefon}
                  </a>
                ) : null}
                {k.notlar ? <p className="text-muted">{k.notlar}</p> : null}
              </div>
              {yaz ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-semibold text-muted">Düzenle</summary>
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
          <details className="kart p-4">
            <summary className="cursor-pointer text-sm font-semibold">Kişi ekle</summary>
            <div className="mt-4">
              <KisiFormu eylem={kisiKaydet} firmaId={f.id} />
            </div>
          </details>
        ) : null}
      </Bolum>

      <Bolum baslik={`Görüşmeler (${temaslar.length})`}>
        {temaslar.length === 0 ? <p className="text-sm text-muted">Kayıtlı görüşme yok.</p> : null}
        <div className="space-y-3">
          {temaslar.map((t) => (
            <div key={t.id} className="kart p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <TakipSecici eylem={takipDegistir} temasId={t.id} takip={t.takip} geri={`/firmalar/${f.id}`} yazabilir={yaz} />
                {t.etkinlik_ad ? (
                  <Link href={`/etkinlikler/${t.etkinlik_id}`} className="text-sm font-medium hover:underline">
                    {t.etkinlik_ad}
                  </Link>
                ) : (
                  <span className="text-sm font-medium">{KANAL[t.kanal]}</span>
                )}
                {t.kisi_ad ? <span className="text-sm">{t.kisi_ad}</span> : null}
                <span className="ml-auto text-xs text-muted">
                  {t.tarih ? `görüşme ${tarih(t.tarih)}` : ""}
                  {t.tarih && t.son_temas ? " · " : ""}
                  {t.son_temas ? `son temas ${tarih(t.son_temas)}` : ""}
                </span>
              </div>
              {t.talep ? <p className="mt-2 whitespace-pre-line text-sm">{t.talep}</p> : null}
              {t.notlar ? <p className="mt-1 whitespace-pre-line text-sm text-muted">{t.notlar}</p> : null}
              {yaz ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-semibold text-muted">Düzenle</summary>
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
          <details className="kart p-4">
            <summary className="cursor-pointer text-sm font-semibold">Görüşme ekle</summary>
            <div className="mt-4">
              <TemasFormu eylem={temasKaydet} firmaId={f.id} kisiler={kisiler} etkinlikler={ets} />
            </div>
          </details>
        ) : null}
      </Bolum>

      <Bolum baslik={`Teklifler (${teklifListesi.length})`}>
        {teklifListesi.length === 0 ? <p className="text-sm text-muted">Kayıtlı teklif yok.</p> : null}
        <div className="space-y-3">
          {teklifListesi.map((tk) => (
            <div key={tk.id} className="kart p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Rozet sinif={TEKLIF_RENK[tk.durum]}>{TEKLIF_DURUMU[tk.durum]}</Rozet>
                <span className="font-semibold">{tk.teklif_no ?? "Numarasız teklif"}</span>
                {tk.tutar ? (
                  <span className="text-sm font-semibold">
                    {para(tk.tutar)} {DOVIZ[tk.doviz]}
                  </span>
                ) : null}
                <span className="ml-auto text-xs text-muted">
                  {tarih(tk.tarih)}
                  {tk.gecerlilik ? ` · geçerlilik ${tarih(tk.gecerlilik)}` : ""}
                </span>
              </div>
              {tk.konu ? <p className="mt-1 text-sm">{tk.konu}</p> : null}
              {tk.red_sebebi ? <p className="mt-1 text-sm text-red-800">Red sebebi: {RED_SEBEBI[tk.red_sebebi]}</p> : null}
              {tk.notlar ? <p className="mt-1 text-sm text-muted">{tk.notlar}</p> : null}
              {tk.dosya_id ? (
                <a href={`/dosya/${tk.dosya_id}`} target="_blank" className="mt-2 inline-flex items-center gap-1 text-sm hover:underline">
                  <FileText size={14} /> {tk.dosya_ad}
                </a>
              ) : null}
              {yaz ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-semibold text-muted">Düzenle</summary>
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
          <details className="kart p-4">
            <summary className="cursor-pointer text-sm font-semibold">Teklif ekle</summary>
            <div className="mt-4">
              <TeklifFormu eylem={teklifKaydet} firmaId={f.id} temaslar={temaslar} />
            </div>
          </details>
        ) : null}
      </Bolum>

      <Bolum baslik={`Dosyalar (${dosyalar.length})`}>
        {dosyalar.length ? (
          <ul className="kart divide-y divide-line">
            {dosyalar.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 text-sm">
                <a href={`/dosya/${d.id}`} target="_blank" className="inline-flex items-center gap-1 font-medium hover:underline">
                  <FileText size={14} /> {d.ad}
                </a>
                <span className="text-xs text-muted">
                  {Math.max(1, Math.round(d.boyut / 1024))} KB · {d.yukleyen} · {zaman(d.olusturuldu)}
                </span>
                {yaz ? (
                  <form action={dosyaSil} className="ml-auto">
                    <input type="hidden" name="firma_id" value={f.id} />
                    <input type="hidden" name="dosya_id" value={d.id} />
                    <button type="submit" className="text-xs text-red-700 hover:underline">
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

      <Bolum baslik="Notlar">
        {yaz ? (
          <form action={notEkle} className="flex gap-2">
            <input type="hidden" name="firma_id" value={f.id} />
            <input name="metin" required placeholder="Not ekle…" className="alan" />
            <button type="submit" className="dugme shrink-0">
              Ekle
            </button>
          </form>
        ) : null}
        {notlar.length ? (
          <ul className="space-y-2">
            {notlar.map((n) => (
              <li key={n.id} className="kart p-3 text-sm">
                <p className="whitespace-pre-line">{n.metin}</p>
                <p className="mt-1 text-xs text-muted">
                  {n.yazan} · {zaman(n.olusturuldu)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Not yok.</p>
        )}
      </Bolum>

      {yaz ? (
        <>
          <details className="kart p-4">
            <summary className="cursor-pointer text-sm font-semibold">İlgi alanlarını düzenle</summary>
            <form action={ilgiKaydet} className="mt-4 space-y-4">
              <input type="hidden" name="id" value={f.id} />
              <IlgiSecimi ilgiler={ilgiler} secili={secili} />
              <button type="submit" className="dugme">
                Kaydet
              </button>
            </form>
          </details>
          <details className="kart p-4">
            <summary className="cursor-pointer text-sm font-semibold">Firma bilgilerini düzenle</summary>
            <div className="mt-4">
              <FirmaBilgiFormu eylem={firmaGuncelle} f={f} />
            </div>
          </details>
        </>
      ) : null}

      {ben.rol === "yonetici" ? (
        <details className="rounded-xl border border-red-200 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-red-700">Firmayı sil</summary>
          <form action={firmaSil} className="mt-3 flex flex-wrap items-end gap-2">
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

      <p className="text-xs text-muted">
        Kaydeden {f.olusturan ?? "—"} · {zaman(f.olusturuldu)} · son değişiklik {zaman(f.guncellendi)}
      </p>
    </div>
  );
}
