import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { oturum, yoneticiler } from "@/lib/admin-auth";
import { tamTarih } from "@/lib/zaman";
import { KullaniciFormu, SilTusu } from "./formlar";

export const dynamic = "force-dynamic";

export default async function KullanicilarSayfasi() {
  const ben = await oturum();
  if (!ben) redirect("/admin/giris");

  const liste = await yoneticiler();

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Talepler
      </Link>

      <h1 className="font-display mt-4 text-xl font-bold uppercase tracking-tight sm:text-2xl">
        Kullanıcılar
      </h1>
      <p className="mt-1 text-sm text-muted">
        Panele girebilen hesaplar. {liste.length} kayıt.
      </p>

      <ul className="mt-6 space-y-2">
        {liste.map((k) => (
          <li
            key={k.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3"
          >
            <div className="min-w-0">
              <p className="font-semibold">
                {k.kullanici}
                {k.kullanici === ben ? (
                  <span className="ml-2 rounded-full bg-accent/25 px-2 py-0.5 text-xs font-semibold text-accent-strong">
                    siz
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 text-xs text-muted">{tamTarih(k.olusturuldu)}</p>
            </div>
            {k.kullanici === ben ? null : <SilTusu kullanici={k.kullanici} />}
          </li>
        ))}
      </ul>

      <section className="mt-8 rounded-xl border border-line bg-card p-5">
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">
          Kullanıcı ekle
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Var olan bir kullanıcı adını yazarsanız <strong>parolası değişir</strong>.
          Parolayı kimseye iletmeyin; kullanıcı kendi parolasını buradan
          değiştirebilir.
        </p>
        <KullaniciFormu />
      </section>

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Parolalar düz metin olarak saklanmaz — yalnızca scrypt karması tutulur,
        unutulan parola geri getirilemez, yenisi verilir. Son kullanıcı
        silinemez; silinseydi panele giriş yolu kalmazdı.
      </p>
    </main>
  );
}
