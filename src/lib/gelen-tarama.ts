import "server-only";
import { simpleParser } from "mailparser";
import { gelenSiniflandir, mesajKimlikleri, type Siniflama } from "@/lib/gelen-kurallar";
import {
  gelenIslendiMi,
  gelenKaydet,
  gonderimeEsle,
  ilkGonderimTarihi,
  taramaBitir,
  taramaKilidiAl,
  type Eslesme,
} from "@/lib/gelen-db";
import { gelenOzeti } from "@/lib/gelen-ozet";
import { engelle, hedefDurumDegistir, hedefNotEkle, outreachSemaKur } from "@/lib/outreach-db";
import { imapIstemcisi } from "@/lib/outreach";
import type { GonderenKutusu, OutreachAyarlari } from "@/lib/outreach-kurallar";

/**
 * Gönderen kutularının GELEN kutusunu okur: yanıt, geri dönüş, abonelik
 * iptali, otomatik yanıt (sınıflandırma: gelen-kurallar.ts).
 *
 * Kutuya DOKUNMAZ: INBOX salt okunur açılır (EXAMINE) ve ileti gövdesi
 * BODY.PEEK ile alınır — hiçbir ileti okundu işaretlenmez, taşınmaz,
 * silinmez; Liza kutuyu Thunderbird'de açınca her şeyi olduğu gibi görür.
 * Aynı şifreyle (OUTREACH_SMTP_PASS_n) IMAP'e girilir; sunucu verilmezse
 * gönderen kutusunun sunucusu, port 993 (OUTREACH_IMAP_HOST / _PORT).
 *
 * Ne yapar (yalnızca e-posta GÖNDERDİĞİMİZ firmayla eşleşen iletide):
 *   kalıcı geri dönüş → firma "Adres hatalı" (geri dönüş eşiği böyle çalışır)
 *   yanıt             → firma "Yanıt geldi" (Gönderildi ise) + yanıtın başı not
 *   abonelik iptali   → adres engel listesine (eşleşmese de: bir daha yazılmasın)
 *   otomatik / geçici → yalnızca not
 * Aynı ileti iki kez işlenmez (gelen_eposta: kutu + UID).
 */

export type TaramaSonucu = {
  kutu: string;
  islenen: number;
  yanit: number;
  geriDonus: number;
  abonelik: number;
  otomatik: number;
  /** Tarama yapılmadıysa neden (ör. az önce tarandı) */
  atlandi?: string;
  hata?: string;
};

/** Bir taramada kutu başına en çok bu kadar ileti; kalanı sonraki taramada. */
const KUTU_BASINA_EN_COK = 100;
/** İletinin en çok bu kadarı indirilir — ek (katalog, PDF) gerekmiyor. */
const ILETI_EN_COK_BAYT = 300_000;

async function uygula(
  kutu: GonderenKutusu,
  s: Siniflama,
  e: Eslesme | null,
  kimden: string,
  konu: string
): Promise<{ tur: string; ozet: string }> {
  const yazan = "gelen kutusu";
  if (s.tur === "geri_donus") {
    if (!e) return { tur: "ilgisiz", ozet: s.sebep };
    if (!s.kalici) {
      await hedefNotEkle(e.firma_id, `Teslim gecikiyor (${kutu.user}): ${s.sebep}`, yazan);
      return { tur: "gecici", ozet: s.sebep };
    }
    if (["bekliyor", "gonderildi", "yanit"].includes(e.durum)) await hedefDurumDegistir(e.firma_id, "hatali");
    await hedefNotEkle(e.firma_id, `E-posta geri döndü (${e.eposta}, ${kutu.user} kutusuna): ${s.sebep}`, yazan);
    return { tur: "geri_donus", ozet: s.sebep };
  }
  if (s.tur === "abonelik") {
    /* Eşleşmese de engellenir: panelden gitmemiş olabilir (Liza'nın kampanyası),
       ama "bir daha yazmayın" diyen adrese panel de yazmasın. */
    const adres = e?.eposta ?? kimden;
    if (adres && !adres.endsWith(`@${kutu.alan}`)) await engelle(adres, `yanıtla abonelikten çıktı (${kutu.user})`);
    if (e) await hedefNotEkle(e.firma_id, `Abonelikten çıkmak istedi (${kutu.user}): ${s.sebep}`, yazan);
    return { tur: "abonelik", ozet: s.sebep };
  }
  if (!e) return { tur: "ilgisiz", ozet: "" };
  if (s.tur === "otomatik") {
    await hedefNotEkle(e.firma_id, `Otomatik yanıt (${kutu.user}): ${konu.slice(0, 200)}`, yazan);
    return { tur: "otomatik", ozet: s.sebep };
  }
  if (e.durum === "gonderildi") await hedefDurumDegistir(e.firma_id, "yanit");
  await hedefNotEkle(
    e.firma_id,
    `Yanıt geldi (${kimden} → ${kutu.user}): ${s.ozet || "(metin yok — kutuda bakın)"}`,
    yazan
  );
  return { tur: "yanit", ozet: s.ozet };
}

async function kutuTara(
  kutu: GonderenKutusu,
  aralikSn: number,
  bitis: number,
  kendiAdreslerimiz: Set<string>
): Promise<TaramaSonucu> {
  const sonuc: TaramaSonucu = { kutu: kutu.user, islenen: 0, yanit: 0, geriDonus: 0, abonelik: 0, otomatik: 0 };
  const kayit = await taramaKilidiAl(kutu.user, aralikSn);
  if (!kayit) return { ...sonuc, atlandi: "az önce tarandı" };

  let uidvalidity = kayit.uidvalidity;
  let sonUid = kayit.son_uid;
  const istemci = imapIstemcisi(kutu);
  try {
    await istemci.connect();
    const kilit = await istemci.getMailboxLock("INBOX", { readOnly: true });
    try {
      const kutuBilgisi = istemci.mailbox;
      const gecerlilik = kutuBilgisi ? Number(kutuBilgisi.uidValidity) : 0;
      if (uidvalidity !== gecerlilik) {
        /* Kutu yeniden kurulmuş ya da ilk tarama: UID'ler baştan */
        uidvalidity = gecerlilik;
        sonUid = 0;
      }
      let uidler: number[];
      if (sonUid > 0) {
        uidler = ((await istemci.search({ uid: `${sonUid + 1}:*` }, { uid: true })) || []).filter((u) => u > sonUid);
      } else {
        /* İlk tarama: ilk gönderimden (yoksa iki gün önceden) bu yana gelenler */
        const ilk = await ilkGonderimTarihi();
        const since = new Date((ilk ?? new Date()).getTime() - 2 * 86_400_000);
        uidler = (await istemci.search({ since }, { uid: true })) || [];
      }
      uidler.sort((a, b) => a - b);

      for (const uid of uidler.slice(0, KUTU_BASINA_EN_COK)) {
        if (Date.now() > bitis) break;
        if (!(await gelenIslendiMi(kutu.user, uidvalidity, uid))) {
          const ileti = await istemci.fetchOne(
            String(uid),
            { uid: true, source: { maxLength: ILETI_EN_COK_BAYT } },
            { uid: true }
          );
          if (ileti && ileti.source) {
            const p = await simpleParser(ileti.source);
            const o = gelenOzeti(p);
            let tur = "ilgisiz";
            let ozet = "";
            if (!kendiAdreslerimiz.has(o.kimden)) {
              const s = gelenSiniflandir(o);
              const e =
                s.tur === "geri_donus"
                  ? await gonderimeEsle([], s.adresler)
                  : await gonderimeEsle(mesajKimlikleri(p.inReplyTo, p.references), [o.kimden]);
              ({ tur, ozet } = await uygula(kutu, s, e, o.kimden, o.konu));
              await gelenKaydet({
                kutu: kutu.user, uidvalidity, uid, mesajKimligi: p.messageId ?? "", kimden: o.kimden,
                konu: o.konu, tur, firmaId: e?.firma_id ?? null, ozet, zaman: p.date ?? null,
              });
            } else {
              await gelenKaydet({
                kutu: kutu.user, uidvalidity, uid, mesajKimligi: p.messageId ?? "", kimden: o.kimden,
                konu: o.konu, tur, firmaId: null, ozet, zaman: p.date ?? null,
              });
            }
            sonuc.islenen++;
            if (tur === "yanit") sonuc.yanit++;
            else if (tur === "geri_donus") sonuc.geriDonus++;
            else if (tur === "abonelik") sonuc.abonelik++;
            else if (tur === "otomatik") sonuc.otomatik++;
          }
        }
        sonUid = uid;
      }
    } finally {
      kilit.release();
    }
    await istemci.logout();
    await taramaBitir(kutu.user, uidvalidity, sonUid, "");
    return sonuc;
  } catch (h) {
    const x = h as { message?: string; authenticationFailed?: boolean; responseText?: string };
    const mesaj = x.authenticationFailed
      ? "IMAP girişi reddedildi — kutunun şifresi kontrol edilmeli."
      : `${x.responseText || x.message || String(h)}`.slice(0, 300);
    istemci.close();
    await taramaBitir(kutu.user, uidvalidity, sonUid, mesaj);
    return { ...sonuc, hata: mesaj };
  }
}

/**
 * Bütün gönderen kutularını tarar. `aralikSn`: bir kutu bu kadar saniye içinde
 * taranmışsa atlanır (sayfa açılışında 600, elle taramada 60). `enCokSn`:
 * toplam süre sınırı — kalan iletiler sonraki taramaya kalır.
 */
export async function gelenKutulariTara(
  ayar: OutreachAyarlari,
  secenek: { aralikSn: number; enCokSn?: number }
): Promise<TaramaSonucu[]> {
  if (!ayar.kutular.length || !(await outreachSemaKur())) return [];
  const bitis = Date.now() + (secenek.enCokSn ?? 50) * 1000;
  const kendi = new Set(ayar.kutular.map((k) => k.user));
  const sonuclar: TaramaSonucu[] = [];
  for (const kutu of ayar.kutular) {
    if (Date.now() > bitis) {
      sonuclar.push({ kutu: kutu.user, islenen: 0, yanit: 0, geriDonus: 0, abonelik: 0, otomatik: 0, atlandi: "süre doldu" });
      continue;
    }
    sonuclar.push(await kutuTara(kutu, secenek.aralikSn, bitis, kendi));
  }
  return sonuclar;
}
