import { redirect } from "next/navigation";
import { oturum, panelAcik } from "@/lib/admin-auth";
import { GirisFormu } from "./giris-formu";

export default async function GirisSayfasi() {
  if (await oturum()) redirect("/admin");

  if (!panelAcik()) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
          Panel yapılandırılmamış
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Giriş açılabilmesi için sunucuda üç değer tanımlı olmalı:
          <code className="mx-1 rounded bg-surface-alt px-1.5 py-0.5 text-xs">ADMIN_USER</code>,
          <code className="mx-1 rounded bg-surface-alt px-1.5 py-0.5 text-xs">ADMIN_PASSWORD_HASH</code> ve
          <code className="mx-1 rounded bg-surface-alt px-1.5 py-0.5 text-xs">ADMIN_SESSION_SECRET</code>.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Karmayı üretmek için:{" "}
          <code className="rounded bg-surface-alt px-1.5 py-0.5 text-xs">
            node scripts/admin-parola.mjs &quot;parolanız&quot;
          </code>
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Varsayılan parola bilerek konmadı — yanlışlıkla canlıda kalan bir
          varsayılan, kapıyı açık bırakmakla aynı şeydir.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
        Servosteel Yönetim
      </h1>
      <p className="mt-2 text-sm text-muted">Talepler ve ölçüm paneli.</p>
      <GirisFormu />
    </main>
  );
}
