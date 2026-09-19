import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Phone, Mail } from "lucide-react";
import { oturum } from "@/lib/admin-auth";
import { DURUMLAR, DURUM_ETIKET, notlar, talep } from "@/lib/leads-db";
import { talepAcildi } from "@/lib/panel-kayit";
import { goreli, tamTarih } from "@/lib/zaman";
import { durumEylemi, notEylemi, silEylemi } from "../../actions";
import { Kabuk } from "../../kabuk";

export const dynamic = "force-dynamic";

export default async function TalepSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ben = await oturum();
  if (!ben) redirect("/admin/giris");

  const { id } = await params;
  const no = Number(id);
  if (!Number.isInteger(no)) notFound();

  const t = await talep(no);
  if (!t) notFound();
  const n = await notlar(no);
  await talepAcildi(ben, no, [t.ad, t.firma].filter(Boolean).join(" · ") || t.eposta || `Talep #${no}`);

  const tel = t.telefon.replace(/\s/g, "");

  const satir = (etiket: string, deger: string, href?: string) =>
    deger ? (
      <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-3">
        <dt className="shrink-0 text-xs text-muted sm:w-28 sm:text-sm">{etiket}</dt>
        <dd className="break-words text-sm font-medium">
          {href ? (
            <a href={href} className="underline-offset-4 hover:underline">
              {deger}
            </a>
          ) : (
            deger
          )}
        </dd>
      </div>
    ) : null;

  return (
    <Kabuk aktif="talepler" kullanici={ben}>
    <main>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Talepler
      </Link>

      <h1 className="font-display mt-4 text-xl font-bold uppercase tracking-tight sm:text-2xl">
        {t.ad || t.eposta || `Talep #${t.id}`}
      </h1>
      <p className="mt-1 text-sm text-muted">
        <span title={tamTarih(t.olusturuldu)}>{goreli(t.olusturuldu)}</span>
        {" · "}
        {t.tur === "rfq" ? "Teklif talebi" : "İletişim formu"}
        {t.kaynak === "elle" ? " · elle girildi" : ""}
        {t.kaynak === "form-mail-gitmedi" ? (
          <span className="font-medium text-red-700">
            {" · "}bildirim maili gitmedi — müşteriye buradan dönün
          </span>
        ) : null}
      </p>

      {/* İki sütun yalnızca geniş ekranda: solda mesaj ve notlar, sağda
          arama tuşları, durum ve künye. Mobilde TEK sütun ve sıra farklı —
          arama tuşları en üstte, çünkü panelin telefonda açılma sebebi
          aramak. İki sıralamayı tek işaretlemeyle kurmak için sütun
          kutuları mobilde `contents` (kutu yok sayılır) ve `order` ile
          diziliyor. */}
      <div className="mt-6 flex flex-col gap-7 xl:grid xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start xl:gap-6">
        <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-6">
          {t.mesaj ? (
            <section className="order-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Mesaj</h2>
              <p className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-line bg-card p-4 text-sm leading-relaxed sm:p-5">
                {t.mesaj}
              </p>
            </section>
          ) : null}

          <section className="order-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Notlar ({n.length})
            </h2>

            <form action={notEylemi} className="mt-3">
              <input type="hidden" name="id" value={t.id} />
              <textarea
                name="govde"
                rows={3}
                required
                placeholder="Ne konuşuldu, ne söz verildi, sıradaki adım ne?"
                className="w-full rounded-lg border border-line bg-card px-3 py-2.5 text-base outline-none focus-visible:border-accent sm:text-sm"
              />
              <button className="mt-2 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-zinc-950 sm:w-auto">
                Not ekle
              </button>
            </form>

            <ul className="mt-5 space-y-3">
              {n.map((x) => (
                <li key={x.id} className="rounded-xl border border-line bg-card p-4">
                  <p className="text-xs text-muted">
                    <span title={tamTarih(x.olusturuldu)}>{goreli(x.olusturuldu)}</span>
                    {x.yazan ? ` · ${x.yazan}` : ""}
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {x.govde}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="contents xl:flex xl:flex-col xl:gap-6">
          {tel || t.eposta ? (
            <div className="order-1 flex gap-3">
              {tel ? (
                <a
                  href={`tel:${tel}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-sm font-bold text-zinc-950 active:opacity-90"
                >
                  <Phone className="size-4" strokeWidth={2.4} aria-hidden />
                  Ara
                </a>
              ) : null}
              {t.eposta ? (
                <a
                  href={`mailto:${t.eposta}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-3.5 text-sm font-bold active:bg-surface-alt"
                >
                  <Mail className="size-4" strokeWidth={2.4} aria-hidden />
                  E-posta
                </a>
              ) : null}
            </div>
          ) : null}

          {/* Durum — mobilde tek sıra, yatay kaydırmalı */}
          <section className="order-2 xl:rounded-xl xl:border xl:border-line xl:bg-card xl:p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Durum</h2>
            <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 xl:mt-3">
              {DURUMLAR.map((d) => (
                <form key={d} action={durumEylemi} className="shrink-0">
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="durum" value={d} />
                  <button
                    className={`rounded-full px-3 py-2 text-sm font-medium ${
                      t.durum === d ? "bg-shell text-white" : "border border-line active:bg-surface-alt"
                    }`}
                  >
                    {DURUM_ETIKET[d]}
                  </button>
                </form>
              ))}
            </div>
          </section>

          <section className="order-3 rounded-xl border border-line bg-card px-4 py-2 sm:px-5 sm:py-3">
            <dl className="divide-y divide-line">
              {satir("E-posta", t.eposta, t.eposta ? `mailto:${t.eposta}` : undefined)}
              {satir("Telefon", t.telefon, tel ? `tel:${tel}` : undefined)}
              {satir("Firma", t.firma)}
              {satir("Ülke", t.ulke)}
              {satir("Dil", t.dil)}
              {satir("Sayfa", t.sayfa)}
            </dl>
          </section>

          <form action={silEylemi} className="order-6 border-t border-line pt-6 xl:border-0 xl:pt-0">
            <input type="hidden" name="id" value={t.id} />
            <button className="text-sm font-medium text-red-600 underline-offset-4 hover:underline">
              Bu talebi sil
            </button>
          </form>
        </div>
      </div>
    </main>
    </Kabuk>
  );
}
