import { inputTarih } from "@/lib/bicim";
import { DOVIZ, ETKINLIK_TURU, FIRMA_DURUMU, KANAL, POTANSIYEL, RED_SEBEBI, TAKIP, TEKLIF_DURUMU } from "@/lib/sabitler";
import { BOLGELER, ULKELER } from "@/lib/ulkeler";
import type { Etkinlik, Firma, IlgiAlani, Kisi, Teklif, Temas } from "@/lib/veri";
import { IlgiSecimi } from "./ilgi-secimi";

/* Sunucu bileşenleri: düz <form> + sunucu eylemi. JavaScript yüklenmeden de çalışır
   (fuarda zayıf bağlantıda önemli). */

type Eylem = (fd: FormData) => Promise<void>;

function Alan({
  ad,
  etiket,
  deger,
  tur = "text",
  zorunlu,
  liste,
  ipucu,
  sinif = "",
}: {
  ad: string;
  etiket: string;
  deger?: string | null;
  tur?: string;
  zorunlu?: boolean;
  liste?: string;
  ipucu?: string;
  sinif?: string;
}) {
  return (
    <label className={`block ${sinif}`}>
      <span className="etiket">
        {etiket}
        {zorunlu ? " *" : ""}
      </span>
      <input
        name={ad}
        type={tur}
        defaultValue={deger ?? ""}
        required={zorunlu}
        list={liste}
        placeholder={ipucu}
        className="alan"
      />
    </label>
  );
}

function Secim({
  ad,
  etiket,
  secenekler,
  deger,
  bos,
  sinif = "",
}: {
  ad: string;
  etiket: string;
  secenekler: Record<string, string> | [string, string][];
  deger?: string | number | null;
  bos?: string;
  sinif?: string;
}) {
  const liste = Array.isArray(secenekler) ? secenekler : Object.entries(secenekler);
  return (
    <label className={`block ${sinif}`}>
      <span className="etiket">{etiket}</span>
      <select name={ad} defaultValue={deger == null ? "" : String(deger)} className="alan">
        {bos !== undefined ? <option value="">{bos}</option> : null}
        {liste.map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}

function Metin({ ad, etiket, deger, satir = 2, ipucu }: { ad: string; etiket: string; deger?: string | null; satir?: number; ipucu?: string }) {
  return (
    <label className="block">
      <span className="etiket">{etiket}</span>
      <textarea name={ad} rows={satir} defaultValue={deger ?? ""} placeholder={ipucu} className="alan" />
    </label>
  );
}

/** Ülke ve sektör öneri listeleri; düzende bir kez basılır, formlar list="…" ile kullanır. */
export function Listeler({ sektorler = [] }: { sektorler?: string[] }) {
  return (
    <>
      <datalist id="ulkeler">
        {ULKELER.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
      <datalist id="sektorler">
        {sektorler.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </>
  );
}

const Baslik = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-bold text-ink">{children}</h3>
);

/** Firma + kurum yetkilisi + görüşme tek formda. Etkinlik sayfasında ve "Yeni firma"da. */
export function HizliKayitFormu({
  eylem,
  ilgiler,
  etkinlikler,
  etkinlikId,
  geri,
}: {
  eylem: Eylem;
  ilgiler: IlgiAlani[];
  etkinlikler: Pick<Etkinlik, "id" | "ad">[];
  etkinlikId?: number;
  geri: "etkinlik" | "firma";
}) {
  return (
    <form action={eylem} className="space-y-6">
      <input type="hidden" name="geri" value={geri} />

      <section className="space-y-3">
        <Baslik>Firma</Baslik>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Alan ad="firma_ad" etiket="Firma adı" zorunlu sinif="lg:col-span-2" />
          <Alan ad="web" etiket="Web sitesi" ipucu="firma.com" sinif="lg:col-span-2" />
          <Alan ad="ulke" etiket="Ülke" liste="ulkeler" />
          <Alan ad="sehir" etiket="Şehir" />
          <Alan ad="sektor" etiket="Sektör" liste="sektorler" />
          <Secim ad="potansiyel" etiket="Potansiyel" secenekler={POTANSIYEL} deger="belirsiz" />
        </div>
        <Metin ad="faaliyet" etiket="Ne iş yapıyor" ipucu="Ürettikleri, kullandıkları profiller…" />
      </section>

      <section className="space-y-3">
        <Baslik>İlgi alanları</Baslik>
        <IlgiSecimi ilgiler={ilgiler} />
      </section>

      <section className="space-y-3">
        <Baslik>Kurum yetkilisi</Baslik>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Alan ad="kisi_ad" etiket="Ad soyad" />
          <Alan ad="unvan" etiket="Unvan" />
          <Alan ad="eposta" etiket="E-posta" tur="email" />
          <Alan ad="telefon" etiket="Telefon / WhatsApp" tur="tel" />
        </div>
      </section>

      <section className="space-y-3">
        <Baslik>Görüşme</Baslik>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Secim
            ad="etkinlik_id"
            etiket="Etkinlik"
            secenekler={etkinlikler.map((e) => [String(e.id), e.ad] as [string, string])}
            deger={etkinlikId ?? ""}
            bos="— etkinlik yok —"
          />
          <Secim ad="kanal" etiket="Nereden geldi" secenekler={KANAL} deger={etkinlikId ? "fuar" : "diger"} />
          <Secim ad="takip" etiket="Takip durumu" secenekler={TAKIP} deger="gorusuldu" />
          <Alan ad="tarih" etiket="Görüşme günü" tur="date" />
          <Alan ad="son_temas" etiket="Son temas" tur="date" />
        </div>
        <Metin ad="talep" etiket="Müşterinin talebi" ipucu="Ne istedi, ne sordu, ne gönderecek…" />
        <Metin ad="not" etiket="Not (firma kartına)" satir={1} />
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" className="dugme">
          Kaydet
        </button>
        <p className="text-xs text-muted">
          Aynı web sitesi ya da aynı adla kayıtlı firma varsa yenisi açılmaz; kişi ve görüşme ona eklenir.
        </p>
      </div>
    </form>
  );
}

export function EtkinlikFormu({ eylem, e }: { eylem: Eylem; e?: Etkinlik | null }) {
  return (
    <form action={eylem} className="space-y-3">
      {e ? <input type="hidden" name="id" value={e.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Alan ad="ad" etiket="Etkinlik adı" zorunlu deger={e?.ad} sinif="sm:col-span-2" />
        <Secim ad="tur" etiket="Tür" secenekler={ETKINLIK_TURU} deger={e?.tur ?? "fuar"} />
        <Alan ad="yer" etiket="Salon / stand / adres" deger={e?.yer} />
        <Alan ad="baslangic" etiket="Başlangıç" tur="date" deger={inputTarih(e?.baslangic)} />
        <Alan ad="bitis" etiket="Bitiş" tur="date" deger={inputTarih(e?.bitis)} />
        <Alan ad="sehir" etiket="Şehir" deger={e?.sehir} />
        <Alan ad="ulke" etiket="Ülke" liste="ulkeler" deger={e?.ulke} />
      </div>
      <Metin ad="aciklama" etiket="Açıklama" deger={e?.aciklama} />
      <button type="submit" className="dugme">
        {e ? "Kaydet" : "Etkinliği oluştur"}
      </button>
    </form>
  );
}

export function FirmaBilgiFormu({ eylem, f }: { eylem: Eylem; f: Firma }) {
  return (
    <form action={eylem} className="space-y-3">
      <input type="hidden" name="id" value={f.id} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Alan ad="firma_ad" etiket="Firma adı" zorunlu deger={f.ad} sinif="sm:col-span-2" />
        <Alan ad="web" etiket="Web sitesi" deger={f.web} sinif="sm:col-span-2" />
        <Alan ad="ulke" etiket="Ülke" liste="ulkeler" deger={f.ulke} />
        <Secim
          ad="bolge"
          etiket="Bölge"
          secenekler={BOLGELER.map((b) => [b, b] as [string, string])}
          deger={f.bolge}
          bos="— ülkeden —"
        />
        <Alan ad="sehir" etiket="Şehir" deger={f.sehir} />
        <Alan ad="sektor" etiket="Sektör" liste="sektorler" deger={f.sektor} />
        <Secim ad="potansiyel" etiket="Potansiyel" secenekler={POTANSIYEL} deger={f.potansiyel} />
        <Secim ad="durum" etiket="Durum" secenekler={FIRMA_DURUMU} deger={f.durum} />
      </div>
      <Metin ad="faaliyet" etiket="Ne iş yapıyor" deger={f.faaliyet} />
      <Metin ad="notlar" etiket="Kalıcı not" deger={f.notlar} />
      <button type="submit" className="dugme">
        Kaydet
      </button>
    </form>
  );
}

export function KisiFormu({ eylem, firmaId, k }: { eylem: Eylem; firmaId: number; k?: Kisi }) {
  return (
    <form action={eylem} className="space-y-3">
      <input type="hidden" name="firma_id" value={firmaId} />
      {k ? <input type="hidden" name="kisi_id" value={k.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Alan ad="kisi_ad" etiket="Ad soyad" deger={k?.ad} zorunlu />
        <Alan ad="unvan" etiket="Unvan" deger={k?.unvan} />
        <Alan ad="telefon" etiket="Telefon / WhatsApp" tur="tel" deger={k?.telefon} />
        <Alan ad="eposta" etiket="E-posta" tur="email" deger={k?.eposta} />
        <Alan ad="eposta2" etiket="İkinci e-posta" tur="email" deger={k?.eposta2} />
        <Alan ad="notlar" etiket="Not" deger={k?.notlar} />
      </div>
      <button type="submit" className="dugme">
        {k ? "Kaydet" : "Kişiyi ekle"}
      </button>
    </form>
  );
}

export function TemasFormu({
  eylem,
  firmaId,
  t,
  kisiler,
  etkinlikler,
}: {
  eylem: Eylem;
  firmaId: number;
  t?: Temas;
  kisiler: Kisi[];
  etkinlikler: Pick<Etkinlik, "id" | "ad">[];
}) {
  return (
    <form action={eylem} className="space-y-3">
      <input type="hidden" name="firma_id" value={firmaId} />
      {t ? <input type="hidden" name="temas_id" value={t.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Secim
          ad="kisi_id"
          etiket="Kişi"
          secenekler={kisiler.map((k) => [String(k.id), k.ad] as [string, string])}
          deger={t?.kisi_id ?? ""}
          bos="— kişi yok —"
        />
        <Secim
          ad="etkinlik_id"
          etiket="Etkinlik"
          secenekler={etkinlikler.map((e) => [String(e.id), e.ad] as [string, string])}
          deger={t?.etkinlik_id ?? ""}
          bos="— etkinlik yok —"
        />
        <Secim ad="kanal" etiket="Nereden geldi" secenekler={KANAL} deger={t?.kanal ?? "diger"} />
        <Secim ad="takip" etiket="Takip durumu" secenekler={TAKIP} deger={t?.takip ?? "gorusuldu"} />
        <Alan ad="tarih" etiket="Görüşme günü" tur="date" deger={inputTarih(t?.tarih)} />
        <Alan ad="son_temas" etiket="Son temas" tur="date" deger={inputTarih(t?.son_temas)} />
      </div>
      <Metin ad="talep" etiket="Müşterinin talebi" deger={t?.talep} />
      <Metin ad="notlar" etiket="Not" deger={t?.notlar} satir={1} />
      <button type="submit" className="dugme">
        {t ? "Kaydet" : "Görüşmeyi ekle"}
      </button>
    </form>
  );
}

/** Teklif özeti + PDF. Satış teklifi kendi dosyasında hazırlar, burada kaydeder. */
export function TeklifFormu({
  eylem,
  firmaId,
  t,
  temaslar,
  geri,
}: {
  eylem: Eylem;
  firmaId: number;
  t?: Teklif;
  temaslar: Temas[];
  geri?: string;
}) {
  const bugun = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
  return (
    <form action={eylem} className="space-y-3">
      <input type="hidden" name="firma_id" value={firmaId} />
      {t ? <input type="hidden" name="teklif_id" value={t.id} /> : null}
      {geri ? <input type="hidden" name="geri" value={geri} /> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Alan ad="teklif_no" etiket="Teklif no" deger={t?.teklif_no} />
        <Alan ad="konu" etiket="Ne teklif edildi" deger={t?.konu} ipucu="Ör. C/Z aşık hattı, 3,5 mm" sinif="lg:col-span-3" />
        <Alan ad="tarih" etiket="Tarih" tur="date" deger={inputTarih(t?.tarih) || bugun} zorunlu />
        <Alan ad="gecerlilik" etiket="Geçerlilik" tur="date" deger={inputTarih(t?.gecerlilik)} />
        <Alan ad="tutar" etiket="Tutar" deger={t?.tutar ? String(Number(t.tutar)).replace(".", ",") : ""} ipucu="125.000" />
        <Secim ad="doviz" etiket="Döviz" secenekler={Object.keys(DOVIZ).map((d) => [d, d] as [string, string])} deger={t?.doviz ?? "EUR"} />
        <Secim ad="durum" etiket="Durum" secenekler={TEKLIF_DURUMU} deger={t?.durum ?? "gonderildi"} />
        <Secim ad="red_sebebi" etiket="Red sebebi (reddedildiyse)" secenekler={RED_SEBEBI} deger={t?.red_sebebi ?? ""} bos="—" />
        <Secim
          ad="temas_id"
          etiket="Hangi görüşmeye"
          secenekler={temaslar.map(
            (g) =>
              [
                String(g.id),
                [g.etkinlik_ad ?? KANAL[g.kanal], g.kisi_ad, g.talep?.slice(0, 40)].filter(Boolean).join(" · "),
              ] as [string, string]
          )}
          deger={t?.temas_id ?? (temaslar.length === 1 ? temaslar[0].id : "")}
          bos="— bağlama —"
          sinif="lg:col-span-2"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="etiket">
            {t?.dosya_ad ? `PDF (yüklü: ${t.dosya_ad}; yenisini seçerseniz değişir)` : "Teklif dosyası (PDF, en çok 15 MB)"}
          </span>
          <input name="dosya" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" className="alan" />
        </label>
        <Alan ad="notlar" etiket="Not" deger={t?.notlar} />
      </div>
      <button type="submit" className="dugme">
        {t ? "Kaydet" : "Teklifi kaydet"}
      </button>
    </form>
  );
}

export function DosyaFormu({ eylem, firmaId }: { eylem: Eylem; firmaId: number }) {
  return (
    <form action={eylem} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="firma_id" value={firmaId} />
      <label className="block min-w-0 flex-1">
        <span className="etiket">Dosya (çizim, katalog…; en çok 15 MB)</span>
        <input name="dosya" type="file" required className="alan" />
      </label>
      <button type="submit" className="dugme">
        Yükle
      </button>
    </form>
  );
}
