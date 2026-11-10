import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Rozet } from "@/components/rozet";
import { SayfaBasligi } from "@/components/sayfa";
import { zaman } from "@/lib/bicim";
import { sorgu } from "@/lib/db";
import { oturumZorunlu, panelHesaplariniEsle } from "@/lib/oturum";
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
  panel_bagli: boolean;
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
  /* Sitenin panelinde yeni açılan hesaplar listede hemen görünsün. */
  await panelHesaplariniEsle();
  const liste = await sorgu<Satir>(
    `SELECT id, kullanici, ad, eposta, rol, aktif, son_giris, panel_bagli FROM crm_kullanici ORDER BY aktif DESC, kullanici`
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <SayfaBasligi baslik="Kullanıcılar" yol={[]}>
      <p className="max-w-3xl text-sm text-gray-500">
        Yönetici her şeyi görür ve kullanıcıları yönetir. Satış ve pazarlama kayıt girer ve düzenler. Görüntüleyici
        yalnız okur. Pasifleşen kullanıcının açık oturumu hemen kapanır. Sitenin yönetim paneli hesapları da
        buraya kendiliğinden gelir ve panel parolasıyla girer (panelin yöneticisi burada yönetici, diğerleri satış
        olarak başlar; rolü buradan değiştirebilirsiniz). Onların parolası panelden değişir.
      </p>
      </SayfaBasligi>

      <div className="space-y-3">
        {liste.map((k) => (
          <details key={k.id} className={`kart p-5 ${k.aktif ? "" : "opacity-60"}`}>
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 [&::-webkit-details-marker]:hidden">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-500">
                {(k.ad || k.kullanici).trim().slice(0, 2).toLocaleUpperCase("tr")}
              </span>
              <span className="min-w-0">
                <span className="block text-theme-sm font-medium text-gray-800">{k.ad || k.kullanici}</span>
                <span className="block text-theme-xs text-gray-500">{k.kullanici}</span>
              </span>
              <Rozet sinif="bg-gray-100 text-gray-700">{ROL[k.rol]}</Rozet>
              {k.panel_bagli ? <Rozet sinif="bg-brand-50 text-brand-500">panel hesabı</Rozet> : null}
              {!k.aktif ? <Rozet sinif="bg-error-50 text-error-600">pasif</Rozet> : null}
              <span className="ml-auto text-theme-xs text-gray-500">
                {k.son_giris ? `son giriş ${zaman(k.son_giris)}` : "hiç girmedi"}
              </span>
            </summary>
            <div className="mt-5 grid gap-6 border-t border-gray-100 pt-5 lg:grid-cols-2">
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
                  <label className="flex items-end gap-2 pb-3 text-sm text-gray-700">
                    <input type="checkbox" name="aktif" defaultChecked={k.aktif} className="accent-brand-500" /> Aktif
                  </label>
                </div>
                <button type="submit" className="dugme">
                  Kaydet
                </button>
              </form>
              {k.panel_bagli ? (
                <p className="text-sm text-gray-500">
                  Bu hesap sitenin yönetim paneliyle aynı parolayı kullanır; parola panelin Kullanıcılar sayfasından
                  değişir.
                </p>
              ) : (
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
              )}
            </div>
          </details>
        ))}
      </div>

      <details className="kart p-5">
        <summary className="kart-baslik">Yeni kullanıcı</summary>
        <form action={kullaniciEkle} className="mt-5 border-t border-gray-100 pt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
