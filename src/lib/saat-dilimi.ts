/**
 * Hedef firmanın kendi saati. Gönderim penceresi 24 saate açıldığında bu olmadan
 * Meksikalı firmaya sabahın dördünde e-posta gider — açılan pencere kazanç değil
 * zarar olur. Burası "şu an hangi ülkede iş saati" sorusunu cevaplıyor; otomatik
 * gönderim sırayı ona göre diziyor (bkz. otomatikSiradakiler).
 *
 * Saf modül: veritabanı, ağ, server-only yok — testten doğrudan içe aktarılıyor.
 * Sapma hesabı elle yapılmıyor, Intl'e bırakılıyor; yaz saati kendiliğinden doğru.
 */

/** hedef_firmalar.ulke (Türkçe ad) → IANA saat dilimi. Çok dilimli ülkede sanayinin bulunduğu dilim. */
export const ULKE_DILIMI: Record<string, string> = {
  ABD: "America/Chicago", // doğu ile batı arası — orta yol
  Almanya: "Europe/Berlin",
  Angola: "Africa/Luanda",
  Arjantin: "America/Argentina/Buenos_Aires",
  Arnavutluk: "Europe/Tirane",
  Avustralya: "Australia/Sydney",
  Avusturya: "Europe/Vienna",
  Azerbaycan: "Asia/Baku",
  BAE: "Asia/Dubai",
  Bahreyn: "Asia/Bahrain",
  Bangladeş: "Asia/Dhaka",
  Belçika: "Europe/Brussels",
  Benin: "Africa/Porto-Novo",
  "Birleşik Krallık": "Europe/London",
  Bolivya: "America/La_Paz",
  "Bosna-Hersek": "Europe/Sarajevo",
  Botsvana: "Africa/Gaborone",
  Brezilya: "America/Sao_Paulo",
  Bulgaristan: "Europe/Sofia",
  Çekya: "Europe/Prague",
  Cezayir: "Africa/Algiers",
  "Dominik Cumhuriyeti": "America/Santo_Domingo",
  Ekvador: "America/Guayaquil",
  "El Salvador": "America/El_Salvador",
  Endonezya: "Asia/Jakarta",
  Ermenistan: "Asia/Yerevan",
  Etiyopya: "Africa/Addis_Ababa",
  Fas: "Africa/Casablanca",
  Fiji: "Pacific/Fiji",
  "Fildişi Sahili": "Africa/Abidjan",
  Filipinler: "Asia/Manila",
  Finlandiya: "Europe/Helsinki",
  Fransa: "Europe/Paris",
  Gana: "Africa/Accra",
  Guatemala: "America/Guatemala",
  "Güney Afrika": "Africa/Johannesburg",
  Gürcistan: "Asia/Tbilisi",
  Hindistan: "Asia/Kolkata",
  Hırvatistan: "Europe/Zagreb",
  Hollanda: "Europe/Amsterdam",
  Honduras: "America/Tegucigalpa",
  Irak: "Asia/Baghdad",
  İrlanda: "Europe/Dublin",
  İspanya: "Europe/Madrid",
  İsveç: "Europe/Stockholm",
  İtalya: "Europe/Rome",
  Kamboçya: "Asia/Phnom_Penh",
  Kamerun: "Africa/Douala",
  Kanada: "America/Toronto",
  Katar: "Asia/Qatar",
  Kazakistan: "Asia/Almaty",
  Kenya: "Africa/Nairobi",
  Kırgızistan: "Asia/Bishkek",
  Kolombiya: "America/Bogota",
  "Kongo DC": "Africa/Kinshasa",
  "Kosta Rika": "America/Costa_Rica",
  Kuveyt: "Asia/Kuwait",
  "Kuzey Makedonya": "Europe/Skopje",
  Libya: "Africa/Tripoli",
  Litvanya: "Europe/Vilnius",
  Lübnan: "Asia/Beirut",
  Macaristan: "Europe/Budapest",
  Madagaskar: "Indian/Antananarivo",
  Malavi: "Africa/Blantyre",
  Malezya: "Asia/Kuala_Lumpur",
  Mali: "Africa/Bamako",
  Mauritius: "Indian/Mauritius",
  Meksika: "America/Mexico_City",
  Mısır: "Africa/Cairo",
  Moğolistan: "Asia/Ulaanbaatar",
  Moldova: "Europe/Chisinau",
  Moritanya: "Africa/Nouakchott",
  Mozambik: "Africa/Maputo",
  Namibya: "Africa/Windhoek",
  Nepal: "Asia/Kathmandu",
  Nijerya: "Africa/Lagos",
  Nikaragua: "America/Managua",
  Norveç: "Europe/Oslo",
  Özbekistan: "Asia/Tashkent",
  Pakistan: "Asia/Karachi",
  Panama: "America/Panama",
  "Papua Yeni Gine": "Pacific/Port_Moresby",
  Paraguay: "America/Asuncion",
  Peru: "America/Lima",
  Polonya: "Europe/Warsaw",
  Portekiz: "Europe/Lisbon",
  Romanya: "Europe/Bucharest",
  Ruanda: "Africa/Kigali",
  Senegal: "Africa/Dakar",
  Şili: "America/Santiago",
  Singapur: "Asia/Singapore",
  Sırbistan: "Europe/Belgrade",
  Slovakya: "Europe/Bratislava",
  "Sri Lanka": "Asia/Colombo",
  "Suudi Arabistan": "Asia/Riyadh",
  Tacikistan: "Asia/Dushanbe",
  Tanzanya: "Africa/Dar_es_Salaam",
  Tayland: "Asia/Bangkok",
  Togo: "Africa/Lome",
  Tunus: "Africa/Tunis",
  Türkiye: "Europe/Istanbul",
  Uganda: "Africa/Kampala",
  Ukrayna: "Europe/Kyiv",
  Umman: "Asia/Muscat",
  Ürdün: "Asia/Amman",
  Uruguay: "America/Montevideo",
  Vietnam: "Asia/Ho_Chi_Minh",
  "Yeni Zelanda": "Pacific/Auckland",
  Yunanistan: "Europe/Athens",
  Zambiya: "Africa/Lusaka",
  Zimbabve: "Africa/Harare",
};

/**
 * Hafta sonunun hangi günlere düştüğü. Körfez ve çevresinde Cuma-Cumartesi;
 * BAE 2022'de Cumartesi-Pazar'a geçti, o yüzden listede yok. Nepal'de yalnızca
 * Cumartesi tatil. Geri kalan her yerde Cumartesi-Pazar.
 */
export const CUMA_CUMARTESI_TATIL = new Set([
  "Suudi Arabistan",
  "Kuveyt",
  "Katar",
  "Bahreyn",
  "Umman",
  "Mısır",
  "Ürdün",
  "Irak",
  "Libya",
  "Bangladeş",
]);

/** Yalnızca Cumartesi tatil olan ülkeler. */
export const CUMARTESI_TATIL = new Set(["Nepal"]);

export type YerelZaman = { saat: number; haftaGunu: number };

const bicimler = new Map<string, Intl.DateTimeFormat>();
const GUNLER: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Ülkedeki yerel saat (0-23) ve hafta günü (0 pazar). Ülke tabloda yoksa null. */
export function yerelZaman(ulke: string, simdi: Date): YerelZaman | null {
  const dilim = ULKE_DILIMI[ulke];
  if (!dilim) return null;
  let b = bicimler.get(dilim);
  if (!b) {
    b = new Intl.DateTimeFormat("en-US", {
      timeZone: dilim,
      hour: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    });
    bicimler.set(dilim, b);
  }
  const parca = Object.fromEntries(b.formatToParts(simdi).map((p) => [p.type, p.value]));
  const saat = Number(parca.hour);
  if (!Number.isFinite(saat)) return null;
  return { saat, haftaGunu: GUNLER[parca.weekday] ?? 1 };
}

/** O ülkede o gün çalışılıyor mu? */
export function isGunu(ulke: string, haftaGunu: number): boolean {
  if (CUMA_CUMARTESI_TATIL.has(ulke)) return haftaGunu !== 5 && haftaGunu !== 6;
  if (CUMARTESI_TATIL.has(ulke)) return haftaGunu !== 6;
  return haftaGunu !== 0 && haftaGunu !== 6;
}

/**
 * Şu an gönderim için ülkelerin sırası:
 *   sabah  — yerel 08:00-11:00, iş günü. Soğuk e-postanın açılma oranı en yüksek dilim.
 *   mesai  — yerel 11:00-17:00, iş günü.
 * Kalan her ülke (gece, hafta sonu, tanımsız saat dilimi) listede yer almaz;
 * sıralamada en sona düşer ama elenmez — sıra boş kalmasın diye.
 */
export function gonderimSirasi(simdi: Date): { sabah: string[]; mesai: string[] } {
  const sabah: string[] = [];
  const mesai: string[] = [];
  for (const ulke of Object.keys(ULKE_DILIMI)) {
    const z = yerelZaman(ulke, simdi);
    if (!z || !isGunu(ulke, z.haftaGunu)) continue;
    if (z.saat >= 8 && z.saat < 11) sabah.push(ulke);
    else if (z.saat >= 11 && z.saat < 17) mesai.push(ulke);
  }
  return { sabah, mesai };
}
