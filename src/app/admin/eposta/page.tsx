import Link from "next/link";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { PenLine } from "lucide-react";
import { oturum } from "@/lib/admin-auth";
import { firmaEslesmeleri, gelenDurumu, gelenSiniflari, kutuBasinaBekleyenYanit } from "@/lib/gelen-db";
import { gelenKutulariTara } from "@/lib/gelen-tarama";
import { outreachSemaKur } from "@/lib/outreach-db";
import { ayarlariOku } from "@/lib/outreach-kurallar";
import {
  ARAMA_EN_COK,
  aramaTemizle,
  herYerdeAra,
  iletiOku,
  kutuGorunumu,
  postaKutulari,
  type Klasor,
  type OkunanIleti,
} from "@/lib/posta";
import { IMZA, alintiTarihi, alintila, iletBlogu, iletKonusu, yanitKonusu } from "@/lib/posta-bicim";
import { Kabuk } from "../kabuk";
import { gelenTaraEylemi } from "../firmalar/actions";
import {
  BosOkuyucu,
  HesapPaneli,
  IletiListesi,
  IletiOkuyucu,
  MobilSecici,
  posta,
  type AramaBaglami,
  type ListeSatiri,
  type Sinif,
} from "./gorunum";
import { YazmaFormu } from "./yazma-formu";

export const dynamic = "force-dynamic";

/**
 * E-posta — gönderen kutularının posta istemcisi.
 *
 * Yasin, 26 Eylül 2026: "e-posta uygulaması gibi, hesapları tek tek seçip
 * geleni gideni görüp e-posta çıkabilmeliyim". Önceki gelen kutusu yalnızca
 * taramanın işlediği iletileri gösteriyordu ve Giden başka sayfadaydı.
 *
 * Adres çubuğu durumu taşıyor (kutu, klasor, uid, sayfa, yaz, ara, kapsam) —
 * geri tuşu, yer imi ve paylaşılan bağlantı çalışır. Normal gezinme kutuya
 * BİR kez bağlanır (liste + seçili ileti aynı oturumda). "Tüm hesaplarda"
 * arama her kutuya bir oturum açar; okunan ileti ayrıca çekilir.
 */

type Arama = {
  kutu?: string;
  klasor?: string;
  sayfa?: string;
  uid?: string;
  yaz?: string;
  kime?: string;
  ara?: string;
  kapsam?: string;
};

type Liste = {
  satirlar: ListeSatiri[];
  toplam: number;
  sayfa: number;
  sayfaSayisi: number;
  hata: string | null;
  uyari: string | null;
  klasorYok: boolean;
};

type Firma = { id: number; firma: string };

export default async function EpostaSayfasi({ searchParams }: { searchParams: Promise<Arama> }) {
  const ben = await oturum();
  if (!ben) redirect("/admin/giris");
  const sp = await searchParams;
  await outreachSemaKur();

  const kutular = postaKutulari();
  if (!kutular.length) {
    return (
      <Kabuk aktif="eposta" kullanici={ben}>
        <main className="max-w-2xl">
          <h1 className="font-display text-xl font-bold uppercase tracking-tight sm:text-2xl">E-posta</h1>
          <p className="mt-4 rounded-xl border border-line bg-card px-4 py-6 text-sm text-muted">
            Tanımlı e-posta hesabı yok. Hesaplar sunucudaki gönderim ayarlarından okunur
            (<code>OUTREACH_SMTP_USER_n</code> / <code>_PASS_n</code>).
          </p>
        </main>
      </Kabuk>
    );
  }

  const kutu = kutular.find((k) => k.user === (sp.kutu ?? "").trim().toLowerCase())?.user ?? kutular[0].user;
  const klasor: Klasor = sp.klasor === "giden" ? "giden" : "gelen";
  const sayfa = Math.max(1, Math.floor(Number(sp.sayfa)) || 1);
  const uid = Math.floor(Number(sp.uid)) || undefined;
  const yaz = sp.yaz === "yeni" || sp.yaz === "yanit" || sp.yaz === "ilet" ? sp.yaz : null;
  const ara = aramaTemizle(sp.ara);
  const arama: AramaBaglami = ara ? { ara, tum: sp.kapsam === "tum" } : null;

  /* Yanıtlar sayfa gönderildikten SONRA işlenir — sayfa beklemez. Tarama kutu
     başına en çok 10 dakikada bir çalışır, fazlası kendiliğinden atlanır. */
  const ayar = ayarlariOku(process.env);
  if (!ayar.eksik.length) {
    after(async () => {
      try {
        await gelenKutulariTara(ayar, { aralikSn: 600 });
      } catch (e) {
        console.error("gelen kutusu taraması:", (e as Error).message);
      }
    });
  }

  const [bekleyen, durum] = await Promise.all([
    kutuBasinaBekleyenYanit().catch(() => new Map<string, number>()),
    gelenDurumu(0).catch(() => null),
  ]);

  let liste: Liste;
  let secili: OkunanIleti | null = null;
  let seciliHata: string | null = null;
  let seciliSinif: Sinif | null = null;
  let seciliFirma: Firma | null = null;

  if (arama?.tum) {
    /* ------------------------------------------ bütün kutularda arama */
    const [bulunan, okunan] = await Promise.all([herYerdeAra(ara), uid ? iletiOku(kutu, klasor, uid) : null]);
    if (okunan?.tamam) secili = okunan.ileti;
    else if (okunan) seciliHata = okunan.hata;

    /* Sınıf, kutu + klasör sürümüyle (uidvalidity) eşleşiyor — Gelen
       satırları kutu kutu sorulur. */
    const gruplar = new Map<string, { kutu: string; uidvalidity: number; uidler: number[] }>();
    for (const m of bulunan.satirlar) {
      if (m.klasor !== "gelen") continue;
      const anahtar = `${m.kutu}|${m.uidvalidity}`;
      const g = gruplar.get(anahtar) ?? { kutu: m.kutu, uidvalidity: m.uidvalidity, uidler: [] };
      g.uidler.push(m.uid);
      gruplar.set(anahtar, g);
    }
    const [siniflar, firmalar, okunanSinif] = await Promise.all([
      Promise.all(
        [...gruplar.values()].map((g) =>
          gelenSiniflari(g.kutu, g.uidvalidity, g.uidler)
            .then((s) => [...s].map(([u, x]) => [`${g.kutu}|${u}`, x] as const))
            .catch(() => [])
        )
      ).then((l) => new Map<string, Sinif>(l.flat())),
      firmaEslesmeleri([...bulunan.satirlar.map((m) => m.kisiAdres), secili?.kimdenAdres ?? ""]).catch(
        () => new Map<string, Firma>()
      ),
      okunan?.tamam && klasor === "gelen"
        ? gelenSiniflari(kutu, okunan.uidvalidity, [okunan.ileti.uid]).catch(() => new Map<number, Sinif>())
        : Promise.resolve(new Map<number, Sinif>()),
    ]);

    const hataliKutular = bulunan.hatalar;
    liste = {
      satirlar: bulunan.satirlar.map((m) => ({
        ...m,
        sinif: siniflar.get(`${m.kutu}|${m.uid}`) ?? null,
        firma: firmalar.get(m.kisiAdres) ?? null,
      })),
      toplam: bulunan.toplam,
      sayfa: 1,
      sayfaSayisi: 1,
      hata: hataliKutular.length && !bulunan.satirlar.length && hataliKutular.length === kutular.length
        ? hataliKutular.join(" · ")
        : null,
      uyari:
        [
          hataliKutular.length && hataliKutular.length < kutular.length
            ? `Aranamayan kutu: ${hataliKutular.join(" · ")}`
            : null,
          bulunan.toplam > bulunan.satirlar.length
            ? `En yeni ${ARAMA_EN_COK} sonuç gösteriliyor (toplam ${bulunan.toplam.toLocaleString("tr-TR")}) — aramayı daraltın.`
            : null,
        ]
          .filter(Boolean)
          .join(" ") || null,
      klasorYok: false,
    };
    if (secili) {
      seciliSinif = okunanSinif.get(secili.uid) ?? null;
      seciliFirma = firmalar.get(secili.kimdenAdres) ?? null;
    }
  } else {
    /* ------------------------------- tek kutu: klasör ya da içinde arama */
    const g = await kutuGorunumu(kutu, klasor, sayfa, uid, ara);
    if (g.tamam) {
      /* Listeyi veritabanıyla zenginleştir: Gelen'de taramanın sınıfı (yanıt,
         geri dönüş…), her iki klasörde de karşı tarafın hangi hedef firma olduğu. */
      const [siniflar, firmalar] = await Promise.all([
        klasor === "gelen"
          ? gelenSiniflari(kutu, g.uidvalidity, [...g.iletiler.map((m) => m.uid), ...(g.secili ? [g.secili.uid] : [])]).catch(
              () => new Map<number, Sinif>()
            )
          : Promise.resolve(new Map<number, Sinif>()),
        firmaEslesmeleri([...g.iletiler.map((m) => m.kisiAdres), g.secili?.kimdenAdres ?? ""]).catch(
          () => new Map<string, Firma>()
        ),
      ]);
      liste = {
        satirlar: g.iletiler.map((m) => ({ ...m, sinif: siniflar.get(m.uid) ?? null, firma: firmalar.get(m.kisiAdres) ?? null })),
        toplam: g.toplam,
        sayfa: g.sayfa,
        sayfaSayisi: g.sayfaSayisi,
        hata: null,
        uyari: null,
        klasorYok: !g.klasorYolu,
      };
      secili = g.secili;
      seciliHata = g.seciliHata;
      if (g.secili) {
        seciliSinif = siniflar.get(g.secili.uid) ?? null;
        seciliFirma = firmalar.get(g.secili.kimdenAdres) ?? null;
      }
    } else {
      liste = { satirlar: [], toplam: 0, sayfa: 1, sayfaSayisi: 1, hata: g.hata, uyari: null, klasorYok: false };
    }
  }

  const hesaplar = kutular.map((k) => ({ ...k, bekleyen: bekleyen.get(k.user) ?? 0 }));
  const tarama = durum?.kutular.find((k) => k.kutu === kutu) ?? null;
  const okumaVar = Boolean(yaz || uid);
  const kapat = posta(kutu, klasor, { uid: yaz ? uid : undefined, sayfa: liste.sayfa, arama });

  /* ---------------------------------------------- sağ panel: ne gösterilecek */
  let sag: React.ReactNode;
  if (yaz === "yeni") {
    sag = (
      <YazmaFormu
        kutular={kutular}
        kutu={kutu}
        baslik="Yeni e-posta"
        kime={(sp.kime ?? "").slice(0, 500)}
        metin={`\n\n${IMZA}`}
        kapatHref={kapat}
      />
    );
  } else if ((yaz === "yanit" || yaz === "ilet") && secili) {
    const yanit = yaz === "yanit";
    sag = (
      <YazmaFormu
        key={`${yaz}-${secili.uid}`}
        kutular={kutular}
        kutu={kutu}
        baslik={yanit ? "Yanıtla" : "İlet"}
        kime={yanit ? secili.yanitAdresi : ""}
        konu={yanit ? yanitKonusu(secili.konu) : iletKonusu(secili.konu)}
        metin={
          yanit
            ? `\n\n${IMZA}${alintila(secili.metin, secili.kimden, alintiTarihi(secili.tarih))}`
            : `\n\n${IMZA}${iletBlogu(secili)}`
        }
        mesajKimligi={yanit ? secili.mesajKimligi : ""}
        referanslar={yanit ? secili.referanslar : ""}
        yanitUid={yanit && klasor === "gelen" ? secili.uid : undefined}
        kapatHref={kapat}
      />
    );
  } else if (secili) {
    sag = (
      <IletiOkuyucu
        ileti={secili}
        kutu={kutu}
        klasor={klasor}
        sayfa={liste.sayfa}
        sinif={seciliSinif}
        firma={seciliFirma}
        arama={arama}
      />
    );
  } else if (seciliHata) {
    sag = <p className="m-5 text-sm text-red-700">{seciliHata}</p>;
  } else {
    sag = <BosOkuyucu />;
  }

  return (
    <Kabuk aktif="eposta" kullanici={ben}>
      <main>
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold uppercase tracking-tight sm:text-2xl">E-posta</h1>
            <p className="text-sm text-muted">{kutular.length} hesap · okumak iletiyi kutuda &ldquo;okundu&rdquo; yapmaz</p>
          </div>
          <Link
            href={posta(kutu, klasor, { yaz: "yeni" })}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-zinc-950 lg:hidden"
          >
            <PenLine className="size-4" aria-hidden /> Yeni e-posta
          </Link>
        </header>

        <MobilSecici hesaplar={hesaplar} kutu={kutu} klasor={klasor} />

        <div className="overflow-hidden rounded-xl border border-line bg-card lg:grid lg:h-[calc(100dvh-11rem)] lg:min-h-[32rem] lg:grid-cols-[15rem_minmax(0,22rem)_minmax(0,1fr)]">
          <aside className="hidden min-h-0 border-r border-line lg:block">
            <HesapPaneli hesaplar={hesaplar} kutu={kutu} klasor={klasor} tarama={tarama} taraEylemi={gelenTaraEylemi} />
          </aside>

          <section className={`${okumaVar ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-line lg:border-r`}>
            <IletiListesi
              kutu={kutu}
              klasor={klasor}
              satirlar={liste.satirlar}
              toplam={liste.toplam}
              sayfa={liste.sayfa}
              sayfaSayisi={liste.sayfaSayisi}
              seciliUid={uid}
              hata={liste.hata}
              uyari={liste.uyari}
              klasorYok={liste.klasorYok}
              arama={arama}
            />
          </section>

          <section className={`${okumaVar ? "flex" : "hidden lg:flex"} min-h-0 flex-col`}>{sag}</section>
        </div>
      </main>
    </Kabuk>
  );
}
