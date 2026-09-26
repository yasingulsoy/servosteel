import Link from "next/link";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { PenLine } from "lucide-react";
import { oturum } from "@/lib/admin-auth";
import { firmaEslesmeleri, gelenDurumu, gelenSiniflari, kutuBasinaBekleyenYanit } from "@/lib/gelen-db";
import { gelenKutulariTara } from "@/lib/gelen-tarama";
import { outreachSemaKur } from "@/lib/outreach-db";
import { ayarlariOku } from "@/lib/outreach-kurallar";
import { kutuGorunumu, postaKutulari, type Klasor } from "@/lib/posta";
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
  type ListeSatiri,
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
 * Adres çubuğu durumu taşıyor (kutu, klasor, uid, sayfa, yaz) — geri tuşu,
 * yer imi ve paylaşılan bağlantı çalışır. Her gezinme kutuya BİR kez bağlanır
 * (liste + seçili ileti aynı oturumda).
 */

type Arama = { kutu?: string; klasor?: string; sayfa?: string; uid?: string; yaz?: string; kime?: string };

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

  const [g, bekleyen, durum] = await Promise.all([
    kutuGorunumu(kutu, klasor, sayfa, uid),
    kutuBasinaBekleyenYanit().catch(() => new Map<string, number>()),
    gelenDurumu(0).catch(() => null),
  ]);

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

  /* Listeyi veritabanıyla zenginleştir: Gelen'de taramanın sınıfı (yanıt,
     geri dönüş…), her iki klasörde de karşı tarafın hangi hedef firma olduğu. */
  let satirlar: ListeSatiri[] = [];
  let seciliSinif = null;
  let seciliFirma = null;
  if (g.tamam) {
    const [siniflar, firmalar] = await Promise.all([
      klasor === "gelen"
        ? gelenSiniflari(kutu, g.uidvalidity, g.iletiler.map((m) => m.uid)).catch(() => new Map())
        : Promise.resolve(new Map()),
      firmaEslesmeleri([...g.iletiler.map((m) => m.kisiAdres), g.secili?.kimdenAdres ?? ""]).catch(() => new Map()),
    ]);
    satirlar = g.iletiler.map((m) => ({ ...m, sinif: siniflar.get(m.uid) ?? null, firma: firmalar.get(m.kisiAdres) ?? null }));
    if (g.secili) {
      seciliSinif = siniflar.get(g.secili.uid) ?? null;
      seciliFirma = firmalar.get(g.secili.kimdenAdres) ?? null;
    }
  }

  const hesaplar = kutular.map((k) => ({ ...k, bekleyen: bekleyen.get(k.user) ?? 0 }));
  const tarama = durum?.kutular.find((k) => k.kutu === kutu) ?? null;
  const secili = g.tamam ? g.secili : null;
  const okumaVar = Boolean(yaz || uid);
  const kapat = posta(kutu, klasor, { uid: yaz ? uid : undefined, sayfa: g.tamam ? g.sayfa : sayfa });

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
        sayfa={g.tamam ? g.sayfa : sayfa}
        sinif={seciliSinif}
        firma={seciliFirma}
      />
    );
  } else if (g.tamam && g.seciliHata) {
    sag = <p className="m-5 text-sm text-red-700">{g.seciliHata}</p>;
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
              satirlar={satirlar}
              toplam={g.tamam ? g.toplam : 0}
              sayfa={g.tamam ? g.sayfa : 1}
              sayfaSayisi={g.tamam ? g.sayfaSayisi : 1}
              seciliUid={uid}
              hata={g.tamam ? null : g.hata}
              klasorYok={g.tamam && !g.klasorYolu}
            />
          </section>

          <section className={`${okumaVar ? "flex" : "hidden lg:flex"} min-h-0 flex-col`}>{sag}</section>
        </div>
      </main>
    </Kabuk>
  );
}
