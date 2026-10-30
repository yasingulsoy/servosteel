/**
 * Ülke adları Türkçe ve tek yazımla tutulur; bölge ülkeden türetilir.
 * Listede olmayan ülke de yazılabilir, o zaman bölge elle seçilir.
 */

export const BOLGELER = [
  "Türkiye",
  "Batı Avrupa",
  "Kuzey Avrupa",
  "Güney Avrupa",
  "Orta ve Doğu Avrupa",
  "Balkanlar",
  "Rusya ve Orta Asya",
  "Ortadoğu",
  "Afrika",
  "Kuzey ve Orta Amerika",
  "Güney Amerika",
  "Asya",
  "Okyanusya",
] as const;

const B: Record<string, (typeof BOLGELER)[number]> = {
  Türkiye: "Türkiye",

  Almanya: "Batı Avrupa", Avusturya: "Batı Avrupa", Belçika: "Batı Avrupa", Fransa: "Batı Avrupa",
  Hollanda: "Batı Avrupa", İsviçre: "Batı Avrupa", Lüksemburg: "Batı Avrupa", Lihtenştayn: "Batı Avrupa",

  "Birleşik Krallık": "Kuzey Avrupa", İrlanda: "Kuzey Avrupa", Danimarka: "Kuzey Avrupa",
  İsveç: "Kuzey Avrupa", Norveç: "Kuzey Avrupa", Finlandiya: "Kuzey Avrupa", İzlanda: "Kuzey Avrupa",
  Estonya: "Kuzey Avrupa", Letonya: "Kuzey Avrupa", Litvanya: "Kuzey Avrupa",

  İtalya: "Güney Avrupa", İspanya: "Güney Avrupa", Portekiz: "Güney Avrupa", Yunanistan: "Güney Avrupa",
  Malta: "Güney Avrupa", "Kıbrıs": "Güney Avrupa",

  Polonya: "Orta ve Doğu Avrupa", Çekya: "Orta ve Doğu Avrupa", Slovakya: "Orta ve Doğu Avrupa",
  Macaristan: "Orta ve Doğu Avrupa", Romanya: "Orta ve Doğu Avrupa", Moldova: "Orta ve Doğu Avrupa",
  Ukrayna: "Orta ve Doğu Avrupa", Slovenya: "Orta ve Doğu Avrupa", Hırvatistan: "Orta ve Doğu Avrupa",

  Sırbistan: "Balkanlar", "Bosna-Hersek": "Balkanlar", Karadağ: "Balkanlar", "Kuzey Makedonya": "Balkanlar",
  Arnavutluk: "Balkanlar", Bulgaristan: "Balkanlar", Kosova: "Balkanlar",

  Rusya: "Rusya ve Orta Asya", Belarus: "Rusya ve Orta Asya", Kazakistan: "Rusya ve Orta Asya",
  Özbekistan: "Rusya ve Orta Asya", Azerbaycan: "Rusya ve Orta Asya", Gürcistan: "Rusya ve Orta Asya",
  Türkmenistan: "Rusya ve Orta Asya", Kırgızistan: "Rusya ve Orta Asya", Ermenistan: "Rusya ve Orta Asya",

  İsrail: "Ortadoğu", BAE: "Ortadoğu", "Suudi Arabistan": "Ortadoğu", Katar: "Ortadoğu", Kuveyt: "Ortadoğu",
  Umman: "Ortadoğu", Bahreyn: "Ortadoğu", Ürdün: "Ortadoğu", Lübnan: "Ortadoğu", Irak: "Ortadoğu",
  İran: "Ortadoğu",

  Mısır: "Afrika", Fas: "Afrika", Cezayir: "Afrika", Tunus: "Afrika", Libya: "Afrika", Nijerya: "Afrika",
  Gana: "Afrika", Kenya: "Afrika", Tanzanya: "Afrika", Etiyopya: "Afrika", "Güney Afrika": "Afrika",
  "Fildişi Sahili": "Afrika", Senegal: "Afrika", Kamerun: "Afrika", Angola: "Afrika", Uganda: "Afrika",

  ABD: "Kuzey ve Orta Amerika", Kanada: "Kuzey ve Orta Amerika", Meksika: "Kuzey ve Orta Amerika",
  Guatemala: "Kuzey ve Orta Amerika", "Kosta Rika": "Kuzey ve Orta Amerika", Panama: "Kuzey ve Orta Amerika",
  "Dominik Cumhuriyeti": "Kuzey ve Orta Amerika",

  Brezilya: "Güney Amerika", Arjantin: "Güney Amerika", Şili: "Güney Amerika", Kolombiya: "Güney Amerika",
  Peru: "Güney Amerika", Ekvador: "Güney Amerika", Uruguay: "Güney Amerika", Paraguay: "Güney Amerika",
  Bolivya: "Güney Amerika", Venezuela: "Güney Amerika",

  Hindistan: "Asya", Pakistan: "Asya", Bangladeş: "Asya", "Sri Lanka": "Asya", Vietnam: "Asya",
  Tayland: "Asya", Malezya: "Asya", Endonezya: "Asya", Filipinler: "Asya", Singapur: "Asya",
  Japonya: "Asya", "Güney Kore": "Asya", Çin: "Asya", Tayvan: "Asya",

  Avustralya: "Okyanusya", "Yeni Zelanda": "Okyanusya",
};

export const ULKELER = Object.keys(B).sort((a, b) => a.localeCompare(b, "tr"));

export function bolgesi(ulke: string | null | undefined): string | null {
  return ulke ? (B[ulke.trim()] ?? null) : null;
}
