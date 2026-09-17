import Link from "next/link";
import {
  OLAY_ETIKET,
  type KayitSatiri,
  type KullaniciOzeti,
  type OturumSatiri,
} from "@/lib/panel-kayit";
import { goreli, sureYaz, tamTarih } from "@/lib/zaman";
import { DURUM_YAZISI, cihazEtiketi, oturumDurumu, talepNo } from "./bicim";

const DURUM_RENK = {
  cikti: "bg-zinc-500/15 text-zinc-600",
  panelde: "bg-emerald-500/15 text-emerald-700",
  birakti: "bg-amber-500/15 text-amber-700",
} as const;

/**
 * Kayıtlar sayfasının çizimi — veri ve yetki `page.tsx`'te. Ayrı dosyada,
 * çünkü veritabanı ve oturum olmadan örnek veriyle de çizilebilmeli.
 */
export function KayitlarGorunumu({
  hesaplar,
  secili,
  ozet,
  oturumListesi,
  islemler,
  okunamadi,
}: {
  hesaplar: { id: number; kullanici: string }[];
  secili?: string;
  ozet: KullaniciOzeti[];
  oturumListesi: OturumSatiri[];
  islemler: KayitSatiri[];
  okunamadi: boolean;
}) {
  const suzgec = (etkin: boolean) =>
    `rounded-full px-3 py-1.5 text-sm font-medium ${
      etkin ? "bg-shell text-white" : "border border-line bg-card hover:bg-surface-alt"
    }`;

  return (
    <main>
      <h1 className="font-display text-xl font-bold uppercase tracking-tight sm:text-2xl">
        Kayıtlar
      </h1>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
        Panele kim ne zaman girdi, ne kadar kaldı, ne yaptı. Yalnızca yönetici görür; kayıtlar 12
        ay saklanır. Süre girişten son harekete kadar sayılır — panel açık bırakılıp başından
        kalkılan zaman sayılmaz.
      </p>

      <nav aria-label="Kullanıcıya göre süz" className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/admin/kayitlar"
          className={suzgec(!secili)}
          aria-current={!secili ? "page" : undefined}
        >
          Tümü
        </Link>
        {hesaplar.map((h) => (
          <Link
            key={h.id}
            href={`/admin/kayitlar?kullanici=${encodeURIComponent(h.kullanici)}`}
            className={suzgec(secili === h.kullanici)}
            aria-current={secili === h.kullanici ? "page" : undefined}
          >
            {h.kullanici}
          </Link>
        ))}
      </nav>

      {okunamadi ? (
        <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          Kayıtlar okunamadı — veritabanına şu an ulaşılamıyor.
        </p>
      ) : (
        <>
          {/* ---------------------------------------------- son 30 gün */}
          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Son 30 gün</h2>
            {ozet.length === 0 ? (
              <Bos metin="Son 30 günde kayıt yok. Kayıt tutma bu sürümle başladı; önceki girişler görünmez." />
            ) : (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {ozet.map((o) => (
                  <li
                    key={o.kullanici}
                    className={`rounded-xl border bg-card p-4 ${
                      secili === o.kullanici ? "border-accent" : "border-line"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold">{o.kullanici}</span>
                      {o.son_giris ? (
                        <span className="text-xs text-muted" title={tamTarih(o.son_giris)}>
                          son giriş {goreli(o.son_giris)}
                        </span>
                      ) : null}
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <Olcu etiket="Giriş" deger={String(o.oturum)} />
                      <Olcu etiket="Panelde" deger={o.oturum ? sureYaz(o.saniye) : "—"} />
                      <Olcu etiket="Açtığı talep" deger={String(o.acilan)} />
                      <Olcu etiket="İşlem" deger={String(o.islem)} />
                    </dl>
                    {o.hatali > 0 ? (
                      <p className="mt-3 text-xs font-medium text-red-700">
                        {o.hatali} hatalı giriş denemesi
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ----------------------------------------------- oturumlar */}
          <section className="mt-10">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Oturumlar{secili ? ` — ${secili}` : ""}
            </h2>
            {oturumListesi.length === 0 ? (
              <Bos metin="Oturum kaydı yok." />
            ) : (
              <>
                <ul className="mt-3 space-y-3 lg:hidden">
                  {oturumListesi.map((o) => {
                    const d = oturumDurumu(o);
                    return (
                      <li key={o.id} className="rounded-xl border border-line bg-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-semibold">{o.kullanici}</span>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${DURUM_RENK[d]}`}
                          >
                            {DURUM_YAZISI[d]}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">
                          {tamTarih(o.giris)} · <strong>{sureYaz(o.saniye)}</strong>
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {cihazEtiketi(o.cihaz)}
                          {o.ip ? ` · ${o.ip}` : ""}
                        </p>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-3 hidden overflow-x-auto rounded-xl border border-line lg:block">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-alt">
                      <tr>
                        {["Kullanıcı", "Giriş", "Son hareket", "Süre", "Durum", "Cihaz", "IP"].map(
                          (h) => (
                            <th key={h} className="px-4 py-3 font-semibold">
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {oturumListesi.map((o) => {
                        const d = oturumDurumu(o);
                        return (
                          <tr key={o.id} className="border-t border-line">
                            <td className="px-4 py-3 font-medium">{o.kullanici}</td>
                            <td className="whitespace-nowrap px-4 py-3">{tamTarih(o.giris)}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-muted">
                              {tamTarih(o.cikis ?? o.son_etkinlik)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 font-semibold">
                              {sureYaz(o.saniye)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${DURUM_RENK[d]}`}
                              >
                                {DURUM_YAZISI[d]}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-muted" title={o.cihaz}>
                              {cihazEtiketi(o.cihaz)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted">
                              {o.ip || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          {/* ------------------------------------------------ işlemler */}
          <section className="mt-10">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Ne yaptı{secili ? ` — ${secili}` : ""}
            </h2>
            {islemler.length === 0 ? (
              <Bos metin="İşlem kaydı yok." />
            ) : (
              <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-card">
                {islemler.map((k) => {
                  const no = talepNo(k.hedef);
                  const hatali = k.olay === "giris_hatali";
                  return (
                    <li
                      key={k.id}
                      className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:gap-4"
                    >
                      <span className="shrink-0 tabular-nums text-muted sm:w-36">
                        {tamTarih(k.zaman)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="font-semibold">{k.kullanici}</strong>{" "}
                        <span className={hatali ? "font-medium text-red-700" : ""}>
                          {OLAY_ETIKET[k.olay] ?? k.olay}
                        </span>
                        {no !== null && k.olay !== "talep_sil" ? (
                          <>
                            {" · "}
                            <Link
                              href={`/admin/talep/${no}`}
                              className="underline-offset-4 hover:underline"
                            >
                              #{no}
                            </Link>
                          </>
                        ) : null}
                        {no === null && k.hedef ? (
                          <span className="text-muted"> · {k.hedef}</span>
                        ) : null}
                        {k.ayrinti ? (
                          <span className="mt-0.5 block break-words text-muted">{k.ayrinti}</span>
                        ) : null}
                      </span>
                      {hatali && k.ip ? (
                        <span className="shrink-0 text-xs tabular-nums text-muted">{k.ip}</span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function Olcu({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{etiket}</dt>
      <dd className="font-semibold tabular-nums">{deger}</dd>
    </div>
  );
}

function Bos({ metin }: { metin: string }) {
  return (
    <p className="mt-3 rounded-xl border border-line bg-card px-4 py-8 text-center text-sm text-muted">
      {metin}
    </p>
  );
}
