import Link from "next/link";
import { CircleCheck, ShieldAlert } from "lucide-react";
import { IKINCI_TUR_GUN, KATEGORILER, KATEGORI_ADI, type OtomatikSiradaki } from "@/lib/outreach-db";
import type { KutuSatiri } from "@/lib/outreach-kurallar";
import type { OtomatikAyar } from "@/lib/otomatik-gonderim";
import { goreli, tamTarih } from "@/lib/zaman";
import { hedefDurumEylemi, otomatikAyarEylemi, sigortaSifirlaEylemi } from "../firmalar/actions";

/*
 * Kampanya sayfasının parçaları. Hedef firmalar sayfasından TAŞINDI
 * (26 Eylül 2026): o sayfa kampanya panosu, kutu durumu, ayarlar,
 * istatistikler ve firma listesini üst üste taşıyordu. Kod aynı; yalnızca
 * yeri değişti.
 */

/**
 * Gönderen kutuları — her biri bugün kaç gönderdi, tavanı (ısınmayla), alan
 * adının toplamı ve şu anki durumu. Tek kutuyken de aynı tablo: "neden
 * gönderemiyorum" sorusunun cevabı hep aynı yerde.
 */
export function KutuTablosu({
  secim,
  aralikSn,
  admin,
  duran,
}: {
  secim: KutuSatiri[];
  aralikSn: number;
  admin: boolean;
  duran: number;
}) {
  const hazir = secim.some((x) => x.engel === null || x.bekle !== null);
  return (
    <section
      className={`mt-4 rounded-xl border px-4 py-3.5 text-sm ${
        hazir ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-800"
      }`}
    >
      <p className="flex items-center gap-2 font-semibold">
        {hazir ? <CircleCheck className="size-5 shrink-0" aria-hidden /> : <ShieldAlert className="size-5 shrink-0" aria-hidden />}
        {hazir ? "Gönderime hazır" : "Şu an gönderilemiyor"} · {secim.length} kutu · aynı kutudan iki e-posta arası en az{" "}
        {aralikSn} sn
      </p>
      <ul className="mt-2 divide-y divide-black/10">
        {secim.map((x) => (
          <li key={x.kutu.user} className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:items-baseline sm:gap-3">
            {/* Yalnızca adres: gönderen adı dört kutuda da aynı ("Servosteel
                Export"), yanına yazılınca adres iki satıra taşıyordu. */}
            <span className="min-w-0 break-all font-medium sm:w-64 sm:shrink-0" title={`${x.kutu.ad} <${x.kutu.user}>`}>
              {x.kutu.user}
            </span>
            <span className="tabular-nums">
              bugün {x.durum.bugun}/{x.tavan}
              {x.asama ? ` (${x.asama})` : ""} · {x.kutu.alan} {x.alanBugun}/{x.alanTavani}
              {x.alanAsamasi ? ` (${x.alanAsamasi})` : ""}
            </span>
            <span className="break-words sm:ml-auto sm:text-right">
              {x.engel === null
                ? "hazır"
                : x.durum.durdu && x.durum.durduBitis
                  ? `durdu — ${tamTarih(x.durum.durduBitis)}'e kadar: ${x.durum.durduSebep}`
                  : x.engel}
            </span>
          </li>
        ))}
      </ul>
      {admin && duran ? (
        <details className="mt-2">
          <summary className="cursor-pointer font-medium underline-offset-4 hover:underline">
            Sigortayı şimdi kaldır ({duran} kutu)…
          </summary>
          <p className="mt-2">
            Yalnızca sebep giderildiyse (ör. parola düzeltildi). Hız sınırı ya da spam engeli
            yüzünden durduysa beklemek gerekir; üstüne gitmek alan adını kara listeye sokar.
          </p>
          <form action={sigortaSifirlaEylemi} className="mt-2">
            <button className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white">
              Evet, bütün kutuları aç
            </button>
          </form>
        </details>
      ) : null}
    </section>
  );
}


/**
 * Otomatik gönderim — durum, aç/durdur ve ayarlar (yönetici), bugün sırada
 * olan firmalar. Sıradaki firmayı "Çıkar" göndermeden önce listeden alır
 * ("Geçildi" olur; firma sayfasından geri alınabilir).
 */
export function OtomatikGonderim({
  a,
  sira,
  hatirlatma,
  admin,
  kalan,
}: {
  a: OtomatikAyar;
  sira: OtomatikSiradaki[];
  /** İlk tur bittiyse hatırlatma sırasında bekleyen firma sayısı */
  hatirlatma: number;
  admin: boolean;
  kalan: number;
}) {
  const kapsam = [
    `hafta içi${a.hafta_sonu ? " ve hafta sonu" : ""} ${a.baslangic}:00–${a.bitis}:00`,
    `gruplar ${a.gruplar.join(", ")}`,
    a.ab_dahil ? "AB dahil" : "AB hariç",
    a.kesif_dahil ? "otomatik keşif dahil" : "yalnızca elle araştırılan",
  ].join(" · ");
  return (
    <section
      className={`mt-3 rounded-xl border px-4 py-3.5 text-sm ${
        a.acik ? "border-emerald-300 bg-emerald-50/60" : "border-line bg-card"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">
          Otomatik gönderim —{" "}
          <span className={a.acik ? "text-emerald-700" : "text-muted"}>{a.acik ? "AÇIK" : "kapalı"}</span>
          <span className="font-normal text-muted"> · {kapsam}</span>
        </p>
        {admin ? (
          <form action={otomatikAyarEylemi}>
            <input type="hidden" name="islem" value={a.acik ? "durdur" : "ac"} />
            <button
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                a.acik ? "bg-red-700 text-white" : "bg-emerald-700 text-white"
              }`}
            >
              {a.acik ? "Durdur" : "Aç"}
            </button>
          </form>
        ) : null}
      </div>
      <p className="mt-1 text-muted">
        {a.acik ? (
          <>
            {a.son_sonuc ? <>Son: {a.son_sonuc}</> : "Henüz tur çalışmadı (dakikada bir)."}
            {a.son_tik ? <span title={tamTarih(a.son_tik)}> · tur {goreli(a.son_tik)}</span> : null}
            {a.sonraki && a.sonraki_bekliyor ? (
              <> · sıradaki gönderim {tamTarih(a.sonraki).slice(-5)}</>
            ) : null}
          </>
        ) : (
          "Açınca bugünün kalan kapasitesi pencereye eşit yayılır; elle gönderimle aynı kurallar (tavan, aralık, sigorta, geri dönüş eşiği, aynı adres) geçerli."
        )}
      </p>
      {/* Ayarlar AÇIK geliyor: kapalıyken ayar değiştirilip Kaydet'e basılmadan
          kapatıldı ve hiçbir şey yazılmadı (25 Eylül 2026). Ayar görünmeyen
          yerde durmamalı. */}
      {admin ? (
        <details className="mt-3 rounded-lg border border-line bg-card px-3 py-2" open>
          <summary className="cursor-pointer text-xs font-semibold underline-offset-4 hover:underline">
            Ayarlar — değiştirdikten sonra <strong>Kaydet</strong>&apos;e basmayı unutmayın
          </summary>
          <form action={otomatikAyarEylemi} className="mt-2 flex flex-col gap-2 text-xs">
            <input type="hidden" name="islem" value="kaydet" />
            <fieldset className="flex flex-wrap gap-x-4 gap-y-1">
              <legend className="mb-1 font-semibold">Ürün grupları</legend>
              {KATEGORILER.map((k) => (
                <label key={k} className="flex items-center gap-1.5">
                  <input type="checkbox" name="grup" value={k} defaultChecked={a.gruplar.includes(k)} />
                  {k} · {KATEGORI_ADI[k]}
                </label>
              ))}
            </fieldset>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" name="ab_dahil" defaultChecked={a.ab_dahil} />
              AB ülkelerine de gönder (kurallar ülkeden ülkeye değişiyor; bazıları şirketlere de önceden izin arıyor)
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" name="kesif_dahil" defaultChecked={a.kesif_dahil} />
              Otomatik keşif firmalarını da dahil et (~%15&apos;i hedef dışı olabilir — sıradakileri aşağıdan kontrol edin)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <span>Saat (İstanbul):</span>
              <select name="baslangic" defaultValue={a.baslangic} className="rounded border border-line bg-card px-1.5 py-1">
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
              <span>–</span>
              <select name="bitis" defaultValue={a.bitis} className="rounded border border-line bg-card px-1.5 py-1">
                {Array.from({ length: 24 }, (_, i) => i + 1).map((i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
              <label className="ml-2 flex items-center gap-1.5">
                <input type="checkbox" name="hafta_sonu" defaultChecked={a.hafta_sonu} />
                hafta sonu da
              </label>
            </div>
            <button className="w-fit rounded-lg border border-line px-3 py-1.5 font-semibold hover:bg-surface-alt">
              Kaydet
            </button>
          </form>
        </details>
      ) : null}
      <div className="mt-3 border-t border-line pt-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Bugün sırada ({sira.length}
          {kalan > sira.length ? ` / ${kalan}` : ""})
        </p>
        {sira.length ? (
          <ol className="mt-1 divide-y divide-line">
            {sira.map((f, i) => (
              <li key={f.id} className="flex items-center gap-3 py-1.5">
                <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted">{i + 1}</span>
                <Link href={`/admin/firmalar/${f.id}`} className="min-w-0 flex-1 truncate font-medium underline-offset-4 hover:underline">
                  {f.firma}
                </Link>
                <span className="hidden shrink-0 text-xs text-muted sm:inline">
                  {f.ulke} · {KATEGORI_ADI[f.kategori]}
                  {f.kesif ? " · keşif" : ""}
                </span>
                <form action={hedefDurumEylemi}>
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="durum" value="gecildi" />
                  <button
                    className="rounded border border-line px-2 py-0.5 text-xs hover:bg-surface-alt"
                    title="Bu firmaya otomatik gönderilmesin (Geçildi)"
                  >
                    Çıkar
                  </button>
                </form>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-1 text-xs text-muted">
            {kalan <= 0
              ? "Bugünkü tavan doldu."
              : hatirlatma > 0
                ? `İlk tur bitti. ${hatirlatma} firma hatırlatma sırasında — ilk mektuba dönüş gelmeyenlere, ${IKINCI_TUR_GUN} gün sonra, farklı metinle yazılır.`
                : "Kapsama uyan gönderilebilir firma yok."}
          </p>
        )}
      </div>
    </section>
  );
}
