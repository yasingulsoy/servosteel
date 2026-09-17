/**
 * Sayfadaki videoları TEK TEK indiren sıra.
 *
 * NEDEN: videolar iyi kodlanmış (1080p, 2–3 Mbps, moov başta) ama anasayfa
 * açılır açılmaz birden çok video AYNI ANDA iniyordu — masaüstünde 3 video
 * (36,5 MB), telefonda 4 video (43,7 MB), çünkü her bant ekrandan 1400 px
 * önce yüklemeye başlıyordu ve açılıştaki bantların hepsi o mesafedeydi.
 * Bağlantı bölününce ilk video takılıyordu (2026-09-17 ölçümü).
 *
 * KURAL: aynı anda bir video iner. Sıradaki, öncekinin "takılmadan
 * oynayabilir" (canplaythrough) olmasını, hata vermesini ya da süre dolmasını
 * bekler. Ekranda görünen video sırayı BEKLEMEZ — ziyaretçi ona bakıyor.
 *
 * Videoların dosyasına, boyutuna, kalitesine dokunulmaz; değişen yalnızca
 * indirmenin zamanlaması.
 */

type Kayit = { video: HTMLVideoElement; bitti: boolean; basladi: boolean };

/* Bir video 12 sn'de hazır olamazsa sıra yine de ilerler — yavaş bir
   bağlantıda tek video bütün sayfayı kilitlemesin. */
const BEKLEME_MS = 12_000;

const kayitlar = new Map<HTMLVideoElement, Kayit>();
const sira: HTMLVideoElement[] = [];
let calisan: HTMLVideoElement | null = null;

/** Takılmadan oynayacak kadar veri var mı (tarayıcının kendi tahmini). */
export function oynamayaHazir(v: HTMLVideoElement) {
  return v.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA;
}

function baslat(k: Kayit) {
  if (k.basladi) return;
  k.basladi = true;
  const v = k.video;

  const bitir = () => {
    if (k.bitti) return;
    k.bitti = true;
    clearTimeout(zaman);
    v.removeEventListener("canplaythrough", bitir);
    v.removeEventListener("error", bitir);
    if (calisan === v) {
      calisan = null;
      sonraki();
    }
  };
  const zaman = setTimeout(bitir, BEKLEME_MS);
  v.addEventListener("canplaythrough", bitir);
  v.addEventListener("error", bitir);

  v.preload = "auto";
  v.load();
}

function sonraki() {
  while (!calisan && sira.length) {
    const v = sira.shift()!;
    const k = kayitlar.get(v);
    if (!k || k.basladi) continue;
    calisan = v;
    baslat(k);
  }
}

/**
 * Videonun indirilmesini ister. `simdi`: ekranda görünüyor, sırayı bekleme.
 * Aynı video için tekrar çağırmak zararsız.
 */
export function yuklemeIste(video: HTMLVideoElement, simdi = false) {
  let k = kayitlar.get(video);
  if (!k) {
    k = { video, bitti: false, basladi: false };
    kayitlar.set(video, k);
  }
  if (k.basladi) return;

  if (simdi) {
    const i = sira.indexOf(video);
    if (i >= 0) sira.splice(i, 1);
    /* Sıradaki iş bitince ilerleyebilsin diye çalışan yoksa onun yerine geçer;
       varsa ikisi birden iner — ekrandaki videoyu bekletmekten iyidir. */
    if (!calisan) calisan = video;
    baslat(k);
    return;
  }

  if (!sira.includes(video)) sira.push(video);
  sonraki();
}

/** Bileşen sökülürken: sıradan çıkar, iniyorsa sırayı serbest bırak. */
export function siradanCik(video: HTMLVideoElement) {
  const i = sira.indexOf(video);
  if (i >= 0) sira.splice(i, 1);
  kayitlar.delete(video);
  if (calisan === video) {
    calisan = null;
    sonraki();
  }
}
