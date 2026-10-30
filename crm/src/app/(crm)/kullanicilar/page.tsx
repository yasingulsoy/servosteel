import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { zaman } from "@/lib/bicim";
import { sorgu } from "@/lib/db";
import { oturumZorunlu } from "@/lib/oturum";
import { ROL } from "@/lib/sabitler";
import { kullaniciEkle, kullaniciGuncelle, parolaSifirla } from "./actions";

export const metadata: Metadata = { title: "Kullanıcılar" };

type Satir = {
  id: number;
  kullanici: string;
  ad: string;
  eposta: string | null;
  rol: keyof typeof ROL;
  aktif: boolean;
  son_giris: Date | null;
};

const RolSecimi = ({ deger }: { deger?: string }) => (
  <select name="rol" defaultValue={deger ?? "satis"} className="alan">
    {Object.entries(ROL).map(([k, v]) => (
      <option key={k} value={k}>
        {v}
      </option>
    ))}
  </select>
);

export default async function Kullanicilar() {
  const ben = await oturumZorunlu();
  if (ben.rol !== "yonetici") redirect("/");
  const liste = await sorgu<Satir>(
    `SELECT id, kullanici, ad, eposta, rol, aktif, son_giris FROM crm_kullanici ORDER BY aktif DESC, kullanici`
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Kullanıcılar</h1>
      <p className="max-w-3xl text-sm text-muted">
        Yönetici her şeyi görür ve kullanıcıları yönetir. Satış ve pazarlama kayıt girer ve düzenler. Görüntüleyici
        yalnız okur. Pasifleşen kullanıcının açık oturumu hemen kapanır.
      </p>

      <div className="space-y-3">
        {liste.map((k) => (
          <details key={k.id} className={`kart p-4 ${k.aktif ? "" : "opacity-60"}`}>
            <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-semibold">{k.kullanici}</span>
              <span className="text-sm">{k.ad}</span>
              <span className="text-sm text-muted">{ROL[k.rol]}</span>
              {!k.aktif ? <span className="text-xs font-semibold text-red-700">pasif</span> : null}
              <span className="ml-auto text-xs text-muted">
                {k.son_giris ? `son giriş ${zaman(k.son_giris)}` : "hiç girmedi"}
              </span>
            </summary>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <form action={kullaniciGuncelle} className="space-y-3">
                <input type="hidden" name="id" value={k.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="etiket">Ad soyad</label>
                    <input name="ad" defaultValue={k.ad} className="alan" />
                  </div>
                  <div>
                    <label className="etiket">E-posta</label>
                    <input name="eposta" type="email" defaultValue={k.eposta ?? ""} className="alan" />
                  </div>
                  <div>
                    <label className="etiket">Rol</label>
                    <RolSecimi deger={k.rol} />
                  </div>
                  <label className="flex items-end gap-2 pb-2 text-sm">
                    <input type="checkbox" name="aktif" defaultChecked={k.aktif} className="accent-amber-600" /> Aktif
                  </label>
                </div>
                <button type="submit" className="dugme">
                  Kaydet
                </button>
              </form>
              <form action={parolaSifirla} className="space-y-3">
                <input type="hidden" name="id" value={k.id} />
                <div>
                  <label className="etiket">Yeni parola</label>
                  <input name="parola" type="password" minLength={10} required autoComplete="new-password" className="alan" />
                </div>
                <button type="submit" className="dugme-ikincil">
                  Parolayı değiştir
                </button>
              </form>
            </div>
          </details>
        ))}
      </div>

      <details className="kart p-4">
        <summary className="cursor-pointer text-sm font-semibold">Yeni kullanıcı</summary>
        <form action={kullaniciEkle} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="etiket">Kullanıcı adı *</label>
            <input name="kullanici" required pattern="[a-z0-9._\-]{3,40}" autoCapitalize="none" className="alan" />
          </div>
          <div>
            <label className="etiket">Ad soyad</label>
            <input name="ad" className="alan" />
          </div>
          <div>
            <label className="etiket">E-posta</label>
            <input name="eposta" type="email" className="alan" />
          </div>
          <div>
            <label className="etiket">Rol</label>
            <RolSecimi />
          </div>
          <div>
            <label className="etiket">Parola * (en az 10)</label>
            <input name="parola" type="password" minLength={10} required autoComplete="new-password" className="alan" />
          </div>
          <div className="lg:col-span-5">
            <button type="submit" className="dugme">
              Kullanıcıyı aç
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}
