import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText, Timer, Trophy } from "lucide-react";
import { Bos, Panel, SayfaBasligi, SayiKarti } from "@/components/sayfa";
import { para } from "@/lib/bicim";
import { oturumZorunlu } from "@/lib/oturum";
import { DOVIZ, KANAL, RED_SEBEBI, TEKLIF_DURUMU } from "@/lib/sabitler";
import { huni, kirilim, redSebepleri, sorumluYuku, teklifHizi, teklifToplamlari, type KirilimSatiri } from "@/lib/veri";

export const metadata: Metadata = { title: "Raporlar" };

const yuzde = (pay: number, payda: number) => (payda ? `%${Math.round((pay / payda) * 100)}` : "—");

function KirilimTablosu({
  baslik,
  satirlar,
  ad,
  etiket,
}: {
  baslik: string;
  satirlar: KirilimSatiri[];
  ad: string;
  etiket?: (s: string) => string;
}) {
  return (
    <Panel baslik={baslik}>
      {!satirlar.length ? (
        <Bos>Veri yok.</Bos>
      ) : (
        <div className="overflow-x-auto">
          <table className="tablo min-w-[420px]">
            <thead>
              <tr>
                <th>{ad}</th>
                <th className="text-right">Firma</th>
                <th className="text-right">Teklif giden</th>
                <th className="text-right">Kabul</th>
                <th className="text-right">Teklif oranı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {satirlar.map((s) => (
                <tr key={s.anahtar}>
                  <td className="font-medium text-gray-800">{etiket ? etiket(s.anahtar) : s.anahtar}</td>
                  <td className="text-right">{s.firma}</td>
                  <td className="text-right">{s.teklif}</td>
                  <td className="text-right">{s.kabul}</td>
                  <td className="text-right">{yuzde(s.teklif, s.firma)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export default async function Raporlar() {
  await oturumZorunlu();
  const [h, kanal, ulke, ilgi, red, hiz, toplamlar, yuk] = await Promise.all([
    huni(),
    kirilim("kanal"),
    kirilim("ulke"),
    kirilim("ilgi"),
    redSebepleri(),
    teklifHizi(),
    teklifToplamlari(),
    sorumluYuku(),
  ]);
  const enBuyuk = Math.max(1, ...h.map((x) => x.firma));

  return (
    <div className="space-y-4 md:space-y-6">
      <SayfaBasligi
        baslik="Raporlar"
        ek={
          /* Düz bağlantı bilerek: bunlar sayfa değil, dosya indiren uçlar (route handler). */
          <>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/firmalar/disa-aktar" className="dugme-ikincil">
              <Download size={18} /> Firmalar (Excel)
            </a>
            <a href="/teklifler/disa-aktar" className="dugme-ikincil">
              <Download size={18} /> Teklifler (Excel)
            </a>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <SayiKarti ad="İlk görüşmeden ilk teklife ortalama gün" deger={hiz.ort_gun ?? "—"} simge={Timer} />
        <SayiKarti ad="Teklif (iptaller hariç)" deger={hiz.teklif} simge={FileText} />
        <SayiKarti
          ad="Kazanma oranı"
          deger={yuzde(hiz.kabul, hiz.sonuclanan)}
          simge={Trophy}
          alt={`${hiz.kabul} kabul / ${hiz.sonuclanan} sonuçlanan`}
        />
      </div>

      <Panel baslik="Huni">
        <div className="space-y-3 px-5 py-5 sm:px-6">
          {h.map((x, i) => (
            <div key={x.adim} className="flex items-center gap-3 text-sm">
              <span className="w-36 shrink-0 text-gray-700">{x.adim}</span>
              <div className="h-7 flex-1 rounded-lg bg-gray-100">
                <div
                  className="flex h-7 items-center rounded-lg bg-brand-500 px-2.5 text-theme-xs font-semibold text-white"
                  style={{ width: `${Math.max(4, (x.firma / enBuyuk) * 100)}%` }}
                >
                  {x.firma}
                </div>
              </div>
              <span className="w-14 text-right text-theme-xs text-gray-500">{i ? yuzde(x.firma, h[i - 1].firma) : ""}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel baslik="Teklif tutarları">
        {toplamlar.length ? (
          <div className="divide-y divide-gray-100 text-sm">
            {toplamlar.map((t) => (
              <div key={`${t.durum}-${t.doviz}`} className="flex justify-between gap-3 px-5 py-4 sm:px-6">
                <span className="text-gray-700">
                  {TEKLIF_DURUMU[t.durum]} · {t.adet} teklif
                </span>
                <span className="font-semibold text-gray-800">{t.toplam ? `${para(t.toplam)} ${DOVIZ[t.doviz]}` : "—"}</span>
              </div>
            ))}
          </div>
        ) : (
          <Bos>Henüz teklif girilmedi.</Bos>
        )}
      </Panel>

      <KirilimTablosu baslik="Kanal" satirlar={kanal} ad="Nereden geldi" etiket={(k) => KANAL[k as keyof typeof KANAL] ?? k} />

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <KirilimTablosu baslik="Ülke" satirlar={ulke} ad="Ülke" />
        <KirilimTablosu baslik="İlgi alanı" satirlar={ilgi} ad="Ürün" />
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Panel baslik="Kayıp sebepleri">
          {red.length ? (
            <div className="divide-y divide-gray-100 text-sm">
              {red.map((r) => (
                <div key={r.sebep} className="flex justify-between gap-3 px-5 py-4 sm:px-6">
                  <span className="text-gray-700">{RED_SEBEBI[r.sebep]}</span>
                  <span className="font-semibold text-gray-800">{r.adet}</span>
                </div>
              ))}
            </div>
          ) : (
            <Bos>Reddedilen teklif yok.</Bos>
          )}
        </Panel>
        <Panel baslik="Sorumlu başına açık iş">
          {yuk.length ? (
            <div className="overflow-x-auto">
              <table className="tablo">
                <thead>
                  <tr>
                    <th>Kim</th>
                    <th className="text-right">Firma</th>
                    <th className="text-right">Açık görev</th>
                    <th className="text-right">Geciken</th>
                    <th className="text-right">Açık teklif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {yuk.map((y) => (
                    <tr key={y.kim}>
                      <td>
                        <Link href={`/gorevler?g=herkes`} className="font-medium text-gray-800 hover:text-brand-500">
                          {y.kim}
                        </Link>
                      </td>
                      <td className="text-right">{y.firma}</td>
                      <td className="text-right">{y.gorev}</td>
                      <td className={`text-right ${y.geciken ? "font-semibold text-error-600" : ""}`}>{y.geciken}</td>
                      <td className="text-right">{y.teklif}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Bos>Henüz sorumlu atanmış firma ya da görev yok.</Bos>
          )}
        </Panel>
      </div>
    </div>
  );
}
