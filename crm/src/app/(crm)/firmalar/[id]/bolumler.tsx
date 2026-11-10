import { CalendarClock, Inbox, Mail, MessageSquare, MousePointerClick, Package, Send, StickyNote, Wrench } from "lucide-react";
import { GorevFormu, MakineFormu, ServisFormu, SiparisFormu } from "@/components/formlar";
import { GorevListesi } from "@/components/gorev-listesi";
import { Rozet } from "@/components/rozet";
import { para, tarih, zaman } from "@/lib/bicim";
import { DOVIZ, SERVIS_DURUMU, SERVIS_RENK, SERVIS_TURU, SIPARIS_DURUMU } from "@/lib/sabitler";
import type { CizelgeOgesi, Gorev, Makine, Servis, Siparis } from "@/lib/veri";
import { gorevDurum, gorevKaydet, gorevSil } from "../../gorevler/actions";
import { makineKaydet, makineSil, servisKaydet, servisSil, siparisKaydet, siparisSil } from "../../servis/actions";

/* Firma kartının görev, satış sonrası ve zaman çizelgesi bölümleri. */

type KullaniciListesi = { kullanici: string; ad: string }[];

export const Bolum = ({ baslik, children }: { baslik: string; children: React.ReactNode }) => (
  <section className="space-y-4">
    <h2 className="bolum-baslik">{baslik}</h2>
    {children}
  </section>
);

export function GorevBolumu({
  firmaId,
  gorevler,
  kisiler,
  ben,
  yaz,
}: {
  firmaId: number;
  gorevler: Gorev[];
  kisiler: KullaniciListesi;
  ben: string;
  yaz: boolean;
}) {
  const acik = gorevler.filter((g) => g.durum === "acik");
  const biten = gorevler.filter((g) => g.durum !== "acik").slice(0, 5);
  const geri = `/firmalar/${firmaId}`;
  return (
    <Bolum baslik={`Görevler (${acik.length} açık)`}>
      <GorevListesi gorevler={acik} durumEylemi={gorevDurum} geri={geri} firmaGoster={false} yazabilir={yaz} />
      {biten.length ? (
        <details>
          <summary className="kucuk-ac">Tamamlananlar ({biten.length})</summary>
          <div className="mt-2">
            <GorevListesi gorevler={biten} durumEylemi={gorevDurum} geri={geri} firmaGoster={false} yazabilir={yaz} />
          </div>
        </details>
      ) : null}
      {yaz ? (
        <details className="kart p-5">
          <summary className="kart-baslik">Görev ekle</summary>
          <div className="mt-5 border-t border-gray-100 pt-5">
            <GorevFormu eylem={gorevKaydet} firmaId={firmaId} kisiler={kisiler} varsayilanAtanan={ben} geri={geri} />
          </div>
        </details>
      ) : null}
      {yaz && acik.length ? (
        <details>
          <summary className="kucuk-ac">Görev düzenle / sil</summary>
          <div className="mt-2 space-y-3">
            {acik.map((g) => (
              <div key={g.id} className="kart space-y-3 p-4">
                <GorevFormu eylem={gorevKaydet} g={g} firmaId={firmaId} kisiler={kisiler} geri={geri} />
                <form action={gorevSil}>
                  <input type="hidden" name="gorev_id" value={g.id} />
                  <input type="hidden" name="geri" value={geri} />
                  <button type="submit" className="dugme-tehlike">
                    Görevi sil
                  </button>
                </form>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </Bolum>
  );
}

export function SatisSonrasiBolumu({
  firmaId,
  siparisler,
  makineler,
  servisler,
  kisiler,
  yaz,
}: {
  firmaId: number;
  siparisler: Siparis[];
  makineler: Makine[];
  servisler: Servis[];
  kisiler: KullaniciListesi;
  yaz: boolean;
}) {
  return (
    <Bolum baslik={`Sipariş, makine ve servis`}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-base font-medium text-gray-800">
            <Package size={18} className="text-gray-500" /> Siparişler ({siparisler.length})
          </h3>
          {siparisler.map((s) => (
            <div key={s.id} className="kart p-5 text-sm">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Rozet sinif="bg-gray-700 text-white">{SIPARIS_DURUMU[s.durum]}</Rozet>
                <span className="font-medium text-gray-800">{s.siparis_no ?? "Sipariş"}</span>
                {s.tutar ? (
                  <span className="font-semibold">
                    {para(s.tutar)} {DOVIZ[s.doviz]}
                  </span>
                ) : null}
                <span className="ml-auto text-theme-xs text-gray-500">
                  {tarih(s.tarih)}
                  {s.teslim_tarihi ? ` · teslim ${tarih(s.teslim_tarihi)}` : ""}
                </span>
              </div>
              {s.konu ? <p className="mt-1">{s.konu}</p> : null}
              {s.notlar ? <p className="mt-1 text-muted">{s.notlar}</p> : null}
              {yaz ? (
                <details className="mt-3">
                  <summary className="kucuk-ac">Düzenle</summary>
                  <div className="mt-3 space-y-3">
                    <SiparisFormu eylem={siparisKaydet} firmaId={firmaId} s={s} />
                    <form action={siparisSil}>
                      <input type="hidden" name="firma_id" value={firmaId} />
                      <input type="hidden" name="siparis_id" value={s.id} />
                      <button type="submit" className="dugme-tehlike">
                        Siparişi sil
                      </button>
                    </form>
                  </div>
                </details>
              ) : null}
            </div>
          ))}
          {yaz ? (
            <details className="kart p-5">
              <summary className="kart-baslik">Sipariş ekle</summary>
              <div className="mt-5 border-t border-gray-100 pt-5">
                <SiparisFormu eylem={siparisKaydet} firmaId={firmaId} />
              </div>
            </details>
          ) : null}

          <h3 className="flex items-center gap-2 pt-2 text-base font-medium text-gray-800">
            <Wrench size={18} className="text-gray-500" /> Kurulu makineler ({makineler.length})
          </h3>
          {makineler.map((m) => (
            <div key={m.id} className="kart p-5 text-sm">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium text-gray-800">{m.ad}</span>
                {m.seri_no ? <span className="text-muted">SN {m.seri_no}</span> : null}
                {m.garanti_bitis ? (
                  <Rozet sinif={m.garantide ? "bg-success-50 text-success-600" : "bg-gray-100 text-gray-600"}>
                    {m.garantide ? "garantide" : "garanti bitti"} · {tarih(m.garanti_bitis)}
                  </Rozet>
                ) : null}
                {m.kurulum_tarihi ? <span className="ml-auto text-theme-xs text-gray-500">kurulum {tarih(m.kurulum_tarihi)}</span> : null}
              </div>
              {m.notlar ? <p className="mt-1 text-muted">{m.notlar}</p> : null}
              {yaz ? (
                <details className="mt-3">
                  <summary className="kucuk-ac">Düzenle</summary>
                  <div className="mt-3 space-y-3">
                    <MakineFormu eylem={makineKaydet} firmaId={firmaId} m={m} siparisler={siparisler} />
                    <form action={makineSil}>
                      <input type="hidden" name="firma_id" value={firmaId} />
                      <input type="hidden" name="makine_id" value={m.id} />
                      <button type="submit" className="dugme-tehlike">
                        Makineyi sil
                      </button>
                    </form>
                  </div>
                </details>
              ) : null}
            </div>
          ))}
          {yaz ? (
            <details className="kart p-5">
              <summary className="kart-baslik">Makine ekle</summary>
              <div className="mt-5 border-t border-gray-100 pt-5">
                <MakineFormu eylem={makineKaydet} firmaId={firmaId} siparisler={siparisler} />
              </div>
            </details>
          ) : null}
        </div>

        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-base font-medium text-gray-800">
            <Wrench size={18} className="text-gray-500" /> Servis talepleri ({servisler.filter((s) => s.durum !== "kapandi").length} açık)
          </h3>
          {servisler.map((s) => (
            <div key={s.id} className="kart p-5 text-sm">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Rozet sinif={SERVIS_RENK[s.durum]}>{SERVIS_DURUMU[s.durum]}</Rozet>
                <span className="font-medium text-gray-800">{SERVIS_TURU[s.tur]}</span>
                {s.makine_ad ? <span className="text-muted">{s.makine_ad}</span> : null}
                {s.garantide ? <Rozet sinif="bg-success-50 text-success-600">garanti kapsamında</Rozet> : null}
                <span className="ml-auto text-theme-xs text-gray-500">
                  {tarih(s.acildi)}
                  {s.kapandi ? ` → ${tarih(s.kapandi)}` : ""}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-line">{s.aciklama}</p>
              {s.sonuc ? <p className="mt-1 text-muted">Yapılan: {s.sonuc}</p> : null}
              {s.atanan ? <p className="mt-1 text-theme-xs text-gray-500">İlgilenen: {s.atanan}</p> : null}
              {yaz ? (
                <details className="mt-3">
                  <summary className="kucuk-ac">Düzenle / kapat</summary>
                  <div className="mt-3 space-y-3">
                    <ServisFormu eylem={servisKaydet} firmaId={firmaId} s={s} makineler={makineler} kisiler={kisiler} />
                    <form action={servisSil}>
                      <input type="hidden" name="firma_id" value={firmaId} />
                      <input type="hidden" name="servis_id" value={s.id} />
                      <button type="submit" className="dugme-tehlike">
                        Talebi sil
                      </button>
                    </form>
                  </div>
                </details>
              ) : null}
            </div>
          ))}
          {yaz ? (
            <details className="kart p-5">
              <summary className="kart-baslik">Servis talebi aç</summary>
              <div className="mt-5 border-t border-gray-100 pt-5">
                <ServisFormu eylem={servisKaydet} firmaId={firmaId} makineler={makineler} kisiler={kisiler} />
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </Bolum>
  );
}

const SIMGE: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  gorusme: MessageSquare,
  not: StickyNote,
  teklif: Send,
  gorev: CalendarClock,
  siparis: Package,
  servis: Wrench,
  tanitim: Mail,
  gelen: Inbox,
  ziyaret: MousePointerClick,
  panel_not: StickyNote,
};

/** Tek zaman çizelgesi: CRM'deki her şey ve panelin bu firmayla ilgili kayıtları. */
export function ZamanCizelgesi({ ogeler }: { ogeler: CizelgeOgesi[] }) {
  if (!ogeler.length) return <p className="text-sm text-muted">Henüz kayıt yok.</p>;
  return (
    <ol className="relative space-y-3 border-s border-line ps-5">
      {ogeler.map((o, i) => {
        const Simge = SIMGE[o.tur] ?? StickyNote;
        const panelden = ["tanitim", "gelen", "ziyaret", "panel_not"].includes(o.tur);
        return (
          <li key={`${o.tur}-${o.zaman}-${i}`} className="relative">
            <span
              className={`absolute -start-[29px] top-0.5 flex size-[18px] items-center justify-center rounded-full ring-4 ring-surface ${
                panelden ? "bg-blue-light-100 text-blue-light-600" : "bg-warning-100 text-warning-700"
              }`}
            >
              <Simge size={11} />
            </span>
            <p className="text-sm">
              <span className="font-medium text-gray-800">{o.baslik}</span>
              <span className="ms-2 text-theme-xs text-gray-500">
                {zaman(o.zaman)}
                {o.kim ? ` · ${o.kim}` : ""}
                {panelden ? " · panel" : ""}
              </span>
            </p>
            {o.ayrinti ? <p className="mt-0.5 line-clamp-3 whitespace-pre-line text-sm text-muted">{o.ayrinti}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
