import { redirect } from "next/navigation";
import { oturum, rolu } from "@/lib/admin-auth";
import { Kabuk } from "../kabuk";
import { ParolaFormu } from "./parola-formu";

export const dynamic = "force-dynamic";

export default async function ProfilSayfasi() {
  const ben = await oturum();
  if (!ben) redirect("/admin/giris");
  const admin = (await rolu(ben)) === "admin";

  return (
    <Kabuk aktif="profil" kullanici={ben}>
      <main>
        <h1 className="font-display text-xl font-bold uppercase tracking-tight sm:text-2xl">
          Profil
        </h1>
        <p className="mt-1 text-sm text-muted">Hesabınız ve parolanız.</p>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <section className="rounded-xl border border-line bg-card p-5">
            <div className="flex items-center gap-4">
              <span
                className="grid size-14 shrink-0 place-items-center rounded-full bg-shell text-xl font-bold uppercase text-accent"
                aria-hidden
              >
                {ben.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{ben}</p>
                <p className="text-sm text-muted">{admin ? "Yönetici" : "Kullanıcı"}</p>
              </div>
            </div>

            <dl className="mt-5 divide-y divide-line border-t border-line text-sm">
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-muted">Yetki</dt>
                <dd className="text-right font-medium">
                  {admin ? "Talepler ve kullanıcılar" : "Talepler"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-muted">Oturum süresi</dt>
                <dd className="text-right font-medium">12 saat</dd>
              </div>
            </dl>

            <p className="mt-2 text-xs leading-relaxed text-muted">
              {admin
                ? "Kullanıcı eklemek, silmek ve başkasının parolasını değiştirmek yalnızca sizde."
                : "Parolanızı unutursanız yönetici yenisini verir."}
            </p>
          </section>

          <section className="rounded-xl border border-line bg-card p-5">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight">
              Parolamı değiştir
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Mevcut parolanız soruluyor — çerezi ele geçiren biri parolayı
              değiştirip sizi dışarıda bırakamasın diye.
            </p>
            <ParolaFormu />
            <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-muted">
              Parolalar düz metin olarak saklanmaz; yalnızca scrypt karması tutulur.
              Unutulan parola geri getirilemez, yenisi verilir.
            </p>
          </section>
        </div>
      </main>
    </Kabuk>
  );
}
