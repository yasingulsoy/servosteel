import type { Metadata } from "next";
import Link from "next/link";
import { para } from "@/lib/bicim";
import { oturumZorunlu } from "@/lib/oturum";
import { DOVIZ, KANAL, RED_SEBEBI, TEKLIF_DURUMU } from "@/lib/sabitler";
import { huni, kirilim, redSebepleri, sorumluYuku, teklifHizi, teklifToplamlari, type KirilimSatiri } from "@/lib/veri";

export const metadata: Metadata = { title: "Raporlar" };

const yuzde = (pay: number, payda: number) => (payda ? `%${Math.round((pay / payda) * 100)}` : "—");

function Baslik({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">{children}</h2>;
}

function KirilimTablosu({ satirlar, ad, etiket }: { satirlar: KirilimSatiri[]; ad: string; etiket?: (s: string) => string }) {
  if (!satirlar.length) return <p className="text-sm text-muted">Veri yok.</p>;
  return (
    <div className="kart overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="p-3">{ad}</th>
            <th className="p-3 text-right">Firma</th>
            <th className="p-3 text-right">Teklif giden</th>
            <th className="p-3 text-right">Kabul</th>
            <th className="p-3 text-right">Teklif oranı</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {satirlar.map((s) => (
            <tr key={s.anahtar}>
              <td className="p-3">{etiket ? etiket(s.anahtar) : s.anahtar}</td>
              <td className="p-3 text-right">{s.firma}</td>
              <td className="p-3 text-right">{s.teklif}</td>
              <td className="p-3 text-right">{s.kabul}</td>
              <td className="p-3 text-right text-muted">{yuzde(s.teklif, s.firma)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">Raporlar</h1>
        {/* Düz bağlantı bilerek: bunlar sayfa değil, dosya indiren uçlar (route handler). */}
        <div className="ml-auto flex gap-2">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/firmalar/disa-aktar" className="dugme-ikincil">
            Firmalar (Excel)
          </a>
          <a href="/teklifler/disa-aktar" className="dugme-ikincil">
            Teklifler (Excel)
          </a>
        </div>
      </div>

      <section>
        <Baslik>Huni</Baslik>
        <div className="kart space-y-2 p-4">
          {h.map((x, i) => (
            <div key={x.adim} className="flex items-center gap-3 text-sm">
              <span className="w-36 shrink-0">{x.adim}</span>
              <div className="h-6 flex-1 rounded bg-surface">
                <div className="flex h-6 items-center rounded bg-accent px-2 text-xs font-semibold" style={{ width: `${Math.max(4, (x.firma / enBuyuk) * 100)}%` }}>
                  {x.firma}
                </div>
              </div>
              <span className="w-14 text-right text-xs text-muted">{i ? yuzde(x.firma, h[i - 1].firma) : ""}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="kart p-4">
          <p className="text-2xl font-bold">{hiz.ort_gun ?? "—"}</p>
          <p className="text-xs text-muted">İlk görüşmeden ilk teklife ortalama gün</p>
        </div>
        <div className="kart p-4">
          <p className="text-2xl font-bold">{hiz.teklif}</p>
          <p className="text-xs text-muted">Teklif (iptaller hariç)</p>
        </div>
        <div className="kart p-4">
          <p className="text-2xl font-bold">{yuzde(hiz.kabul, hiz.sonuclanan)}</p>
          <p className="text-xs text-muted">
            Kazanma oranı ({hiz.kabul} kabul / {hiz.sonuclanan} sonuçlanan)
          </p>
        </div>
      </section>

      <section>
        <Baslik>Teklif tutarları</Baslik>
        {toplamlar.length ? (
          <div className="kart divide-y divide-line text-sm">
            {toplamlar.map((t) => (
              <div key={`${t.durum}-${t.doviz}`} className="flex justify-between p-3">
                <span>
                  {TEKLIF_DURUMU[t.durum]} · {t.adet} teklif
                </span>
                <span className="font-semibold">{t.toplam ? `${para(t.toplam)} ${DOVIZ[t.doviz]}` : "—"}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Henüz teklif girilmedi.</p>
        )}
      </section>

      <section>
        <Baslik>Kanal</Baslik>
        <KirilimTablosu satirlar={kanal} ad="Nereden geldi" etiket={(k) => KANAL[k as keyof typeof KANAL] ?? k} />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <Baslik>Ülke</Baslik>
          <KirilimTablosu satirlar={ulke} ad="Ülke" />
        </section>
        <section>
          <Baslik>İlgi alanı</Baslik>
          <KirilimTablosu satirlar={ilgi} ad="Ürün" />
        </section>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <Baslik>Kayıp sebepleri</Baslik>
          {red.length ? (
            <div className="kart divide-y divide-line text-sm">
              {red.map((r) => (
                <div key={r.sebep} className="flex justify-between p-3">
                  <span>{RED_SEBEBI[r.sebep]}</span>
                  <span className="font-semibold">{r.adet}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Reddedilen teklif yok.</p>
          )}
        </section>
        <section>
          <Baslik>Sorumlu başına açık iş</Baslik>
          {yuk.length ? (
            <div className="kart overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="p-3">Kim</th>
                    <th className="p-3 text-right">Firma</th>
                    <th className="p-3 text-right">Açık görev</th>
                    <th className="p-3 text-right">Geciken</th>
                    <th className="p-3 text-right">Açık teklif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {yuk.map((y) => (
                    <tr key={y.kim}>
                      <td className="p-3">
                        <Link href={`/gorevler?g=herkes`} className="hover:underline">
                          {y.kim}
                        </Link>
                      </td>
                      <td className="p-3 text-right">{y.firma}</td>
                      <td className="p-3 text-right">{y.gorev}</td>
                      <td className={`p-3 text-right ${y.geciken ? "font-semibold text-red-700" : ""}`}>{y.geciken}</td>
                      <td className="p-3 text-right">{y.teklif}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted">Henüz sorumlu atanmış firma ya da görev yok.</p>
          )}
        </section>
      </div>
    </div>
  );
}
