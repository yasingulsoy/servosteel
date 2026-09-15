import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { oturum } from "@/lib/admin-auth";
import { DURUMLAR, DURUM_ETIKET, notlar, talep } from "@/lib/leads-db";
import { durumEylemi, notEylemi, silEylemi } from "../../actions";

export const dynamic = "force-dynamic";

function tarih(s: string) {
  return new Date(s).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function TalepSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await oturum())) redirect("/admin/giris");

  const { id } = await params;
  const no = Number(id);
  if (!Number.isInteger(no)) notFound();

  const t = await talep(no);
  if (!t) notFound();
  const n = await notlar(no);

  const satir = (etiket: string, deger: string, href?: string) =>
    deger ? (
      <div className="flex gap-3 py-2.5">
        <dt className="w-28 shrink-0 text-sm text-muted">{etiket}</dt>
        <dd className="text-sm font-medium break-all">
          {href ? (
            <a href={href} className="underline-offset-4 hover:underline">{deger}</a>
          ) : (
            deger
          )}
        </dd>
      </div>
    ) : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/admin" className="text-sm text-muted underline-offset-4 hover:underline">
        ← Talepler
      </Link>

      <h1 className="font-display mt-4 text-2xl font-bold uppercase tracking-tight">
        {t.ad || t.eposta || `Talep #${t.id}`}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {tarih(t.olusturuldu)} · {t.tur === "rfq" ? "Teklif talebi" : "İletişim formu"}
        {t.kaynak === "elle" ? " · elle girildi" : ""}
      </p>

      {/* Durum — CRM adımları */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Durum</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {DURUMLAR.map((d) => (
            <form key={d} action={durumEylemi}>
              <input type="hidden" name="id" value={t.id} />
              <input type="hidden" name="durum" value={d} />
              <button
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  t.durum === d
                    ? "bg-shell text-white"
                    : "border border-line hover:bg-surface-alt"
                }`}
              >
                {DURUM_ETIKET[d]}
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-line bg-card px-5 py-3">
        <dl className="divide-y divide-line">
          {satir("E-posta", t.eposta, t.eposta ? `mailto:${t.eposta}` : undefined)}
          {satir("Telefon", t.telefon, t.telefon ? `tel:${t.telefon.replace(/\s/g, "")}` : undefined)}
          {satir("Firma", t.firma)}
          {satir("Ülke", t.ulke)}
          {satir("Dil", t.dil)}
          {satir("Sayfa", t.sayfa)}
        </dl>
      </section>

      {t.mesaj ? (
        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Mesaj</h2>
          <p className="mt-2 whitespace-pre-wrap rounded-xl border border-line bg-card p-5 text-sm leading-relaxed">
            {t.mesaj}
          </p>
        </section>
      ) : null}

      {/* Notlar */}
      <section className="mt-8">
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
            className="w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm outline-none focus-visible:border-accent"
          />
          <button className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-zinc-950">
            Not ekle
          </button>
        </form>

        <ul className="mt-6 space-y-3">
          {n.map((x) => (
            <li key={x.id} className="rounded-xl border border-line bg-card p-4">
              <p className="text-xs text-muted">
                {tarih(x.olusturuldu)}
                {x.yazan ? ` · ${x.yazan}` : ""}
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{x.govde}</p>
            </li>
          ))}
        </ul>
      </section>

      <form action={silEylemi} className="mt-12 border-t border-line pt-6">
        <input type="hidden" name="id" value={t.id} />
        <button className="text-sm font-medium text-red-600 underline-offset-4 hover:underline">
          Bu talebi sil
        </button>
      </form>
    </main>
  );
}
