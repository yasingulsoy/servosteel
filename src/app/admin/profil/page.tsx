import { redirect } from "next/navigation";
import { oturum } from "@/lib/admin-auth";
import { Kabuk } from "../kabuk";
import { ParolaFormu } from "./parola-formu";

export const dynamic = "force-dynamic";

export default async function ProfilSayfasi() {
  const ben = await oturum();
  if (!ben) redirect("/admin/giris");

  return (
    <Kabuk aktif="profil" kullanici={ben}>
      <main className="mx-auto max-w-lg px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="font-display text-xl font-bold uppercase tracking-tight sm:text-2xl">
          Profil
        </h1>
        <p className="mt-1 text-sm text-muted">
          Giriş yaptığınız hesap: <strong className="text-ink">{ben}</strong>
        </p>

        <section className="mt-7 rounded-xl border border-line bg-card p-5">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">
            Parolamı değiştir
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Mevcut parolanız soruluyor — çerezi ele geçiren biri parolayı
            değiştirip sizi dışarıda bırakamasın diye.
          </p>
          <ParolaFormu />
        </section>

        <p className="mt-6 text-xs leading-relaxed text-muted">
          Parolalar düz metin olarak saklanmaz; yalnızca scrypt karması tutulur.
          Unuttuğunuzda geri getirilemez, panelden yenisi verilir. Oturum 12 saat
          sonra kendiliğinden düşer.
        </p>
      </main>
    </Kabuk>
  );
}
