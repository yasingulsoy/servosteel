import { redirect } from "next/navigation";
import { oturum, rolu, yoneticiler } from "@/lib/admin-auth";
import { tamTarih } from "@/lib/zaman";
import { KullaniciFormu, KullaniciSatiri } from "./formlar";
import { Kabuk } from "../kabuk";

export const dynamic = "force-dynamic";

export default async function KullanicilarSayfasi() {
  const ben = await oturum();
  if (!ben) redirect("/admin/giris");
  /* Menüden gizlemek yetmez — adresi bilen yazıp açabilirdi. */
  if ((await rolu(ben)) !== "admin") redirect("/admin");

  const liste = await yoneticiler();

  return (
    <Kabuk aktif="kullanicilar" kullanici={ben}>
      <main>
        <h1 className="font-display text-xl font-bold uppercase tracking-tight sm:text-2xl">
          Kullanıcılar
        </h1>
        <p className="mt-1 text-sm text-muted">
          Panele girebilen hesaplar. {liste.length} kayıt.
        </p>

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="overflow-hidden rounded-xl border border-line bg-card">
            <ul className="divide-y divide-line">
              {liste.map((k) => (
                <KullaniciSatiri
                  key={k.id}
                  kullanici={k.kullanici}
                  yonetici={k.rol === "admin"}
                  ben={k.kullanici === ben}
                  tarih={`Eklendi: ${tamTarih(k.olusturuldu)}`}
                />
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-line bg-card p-5">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight">
              Kullanıcı ekle
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Yeni hesap <strong className="text-ink">kullanıcı</strong> yetkisiyle açılır:
              talepleri görür ve işler, kullanıcı ekleyemez. Kişi girdikten sonra kendi
              parolasını Profil&apos;den belirleyebilir.
            </p>
            <KullaniciFormu />
            <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-muted">
              Parolalar düz metin olarak saklanmaz — yalnızca scrypt karması tutulur,
              unutulan parola geri getirilemez, yenisi verilir. Son kullanıcı
              silinemez; silinseydi panele giriş yolu kalmazdı.
            </p>
          </section>
        </div>
      </main>
    </Kabuk>
  );
}
