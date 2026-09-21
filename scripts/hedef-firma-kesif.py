# -*- coding: utf-8 -*-
"""Yeni hedef firma kesfi: ulke konumlu Google aramasi + otomatik dogrulama.

  python scripts/hedef-firma-kesif.py --plan      # sorgu sayisi ve tahmini ucret, hicbir sey cekmez
  python scripts/hedef-firma-kesif.py             # ara (onbellekte yoksa) + dogrula + .md yaz

1. Her hedef ulkede, o ulkenin is dilinde, 12 segment icin "<urun> ureticisi"
   aramasi (DataForSEO standart kuyruk, ilk 20 sonuc). Sonuclar
   seo/hedef-firmalar/kesif/serp-<tarih>.json'a yazilir; ayni gun ikinci
   calistirmada yeniden ucret odenmez.
2. Rehber/pazar yeri/sosyal ag sonuclari, makine ureticileri (rakip) ve listede
   zaten olan (ya da daha once elenmis) alan adlari atilir.
3. Kalan her aday taranir. Satira girmesi icin HEPSI gerekli:
     - site aciliyor, segmentin urunu sayfada geciyor (hedef-firma-dogrula.py KELIME)
     - uretim izi var; sepet var ama uretim izi yoksa dukkan sayilir, elenir
     - ulke tutuyor: alan adi o ulkenin uzantisinda ya da sitede ulkenin telefon kodu var
       (yerel aramada cikan Cinli/Hintli ihracatci bu kontrolde dusuyor)
     - e-posta firmanin KENDI sitesinde yaziyor (eposta_bulucu.py)
4. Sonuc: seo/hedef-firmalar/bolge-kesif-<tarih>.md — bolge dosyasi bicimi
   (Segment sutunlu); Excel betigi ve dogrulayici dogrudan okur.

Kapsam disi: AB'de B2B e-postaya da onceden izin arayan ulkeler (DE, AT, PL, ES,
IT, CZ, RO — mevcut satirlari duruyor, yenisi eklenmiyor) ve yaptirim altindaki
pazarlar (Rusya, Belarus, Iran, Suriye).
"""
import argparse
import base64
import importlib.util
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor, as_completed
from datetime import date

sys.stdout.reconfigure(encoding="utf-8")
BURASI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BURASI)
import eposta_bulucu as B  # noqa: E402

_spec = importlib.util.spec_from_file_location("dogrula", os.path.join(BURASI, "hedef-firma-dogrula.py"))
D = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(D)

KLASOR = D.KLASOR
KESIF = os.path.join(KLASOR, "kesif")
API = "https://api.dataforseo.com/v3/"
AYAR = os.path.expanduser("~/.config/claude-seo/dataforseo.json")
DERINLIK = 20
SAYFA_UCRETI = 0.0006   # standart kuyruk, 10 sonuc (bkz. siralama.py)

SEGMENT_ADI = {
    "kablo-kanali": "Kablo Kanalı", "solar-profil": "Solar Profil", "raf-sistemleri": "Raf Sistemleri",
    "yol-bariyeri": "Yol Bariyeri", "cati-cephe-paneli": "Çatı ve Cephe Paneli",
    "celik-servis-merkezi": "Çelik Servis Merkezi", "asik-celik-yapi": "Aşık ve Çelik Yapı",
    "iskele-kalasi": "İskele Kalası", "market-rafi": "Market Rafı", "havalandirma-kanali": "Havalandırma Kanalı",
    "metal-mobilya": "Çelik Mobilya", "alcipan-profili": "Alçıpan Profili",
}

SORGU = {
    "en": {"kablo-kanali": "cable tray manufacturer", "solar-profil": "solar mounting structure manufacturer",
           "raf-sistemleri": "pallet racking manufacturer", "yol-bariyeri": "crash barrier guardrail manufacturer",
           "cati-cephe-paneli": "roofing sheet manufacturer", "celik-servis-merkezi": "steel coil slitting service center",
           "asik-celik-yapi": "steel purlin manufacturer", "iskele-kalasi": "scaffolding manufacturer",
           "market-rafi": "supermarket shelving manufacturer", "havalandirma-kanali": "HVAC duct manufacturer",
           "metal-mobilya": "steel lockers cabinets manufacturer", "alcipan-profili": "drywall metal stud manufacturer"},
    "es": {"kablo-kanali": "fabricante de bandejas portacables", "solar-profil": "fabricante de estructuras para paneles solares",
           "raf-sistemleri": "fabricante de racks industriales", "yol-bariyeri": "fabricante de defensas metálicas para carreteras",
           "cati-cephe-paneli": "fabricante de techos metálicos y panel sándwich", "celik-servis-merkezi": "centro de servicio de acero corte de bobinas",
           "asik-celik-yapi": "fabricante de perfiles metálicos C y Z", "iskele-kalasi": "fabricante de andamios",
           "market-rafi": "fabricante de góndolas para supermercado", "havalandirma-kanali": "fabricante de ductos para aire acondicionado",
           "metal-mobilya": "fabricante de lockers metálicos", "alcipan-profili": "fabricante de perfiles para drywall"},
    "pt": {"kablo-kanali": "fabricante de eletrocalhas", "solar-profil": "fabricante de estruturas para painéis solares",
           "raf-sistemleri": "fabricante de porta paletes", "yol-bariyeri": "fabricante de defensas metálicas rodovias",
           "cati-cephe-paneli": "fabricante de telhas metálicas", "celik-servis-merkezi": "centro de serviços de aço corte de bobinas",
           "asik-celik-yapi": "fabricante de perfis estruturais U enrijecido", "iskele-kalasi": "fabricante de andaimes",
           "market-rafi": "fabricante de gôndolas para supermercado", "havalandirma-kanali": "fabricante de dutos de ar condicionado",
           "metal-mobilya": "fabricante de armários de aço", "alcipan-profili": "fabricante de perfis para drywall"},
    "fr": {"kablo-kanali": "fabricant de chemins de câbles", "solar-profil": "fabricant de structures pour panneaux solaires",
           "raf-sistemleri": "fabricant de rayonnage industriel", "yol-bariyeri": "fabricant de glissières de sécurité",
           "cati-cephe-paneli": "fabricant de tôles de couverture panneaux sandwich", "celik-servis-merkezi": "centre de service acier découpe de bobines",
           "asik-celik-yapi": "fabricant de profilés pannes acier", "iskele-kalasi": "fabricant d'échafaudages",
           "market-rafi": "fabricant de gondoles supermarché", "havalandirma-kanali": "fabricant de gaines de ventilation",
           "metal-mobilya": "fabricant de mobilier métallique armoires vestiaires", "alcipan-profili": "fabricant de profilés pour plaques de plâtre"},
    "ru": {"kablo-kanali": "производитель кабельных лотков", "solar-profil": "производство конструкций для солнечных панелей",
           "raf-sistemleri": "производство стеллажей", "yol-bariyeri": "производство дорожных ограждений",
           "cati-cephe-paneli": "производство профнастила", "celik-servis-merkezi": "металлосервис продольная резка рулонной стали",
           "asik-celik-yapi": "производство ЛСТК профилей", "iskele-kalasi": "производство строительных лесов",
           "market-rafi": "производство торгового оборудования стеллажи", "havalandirma-kanali": "производство воздуховодов",
           "metal-mobilya": "производство металлической мебели", "alcipan-profili": "производство профиля для гипсокартона"},
    "vi": {"kablo-kanali": "sản xuất máng cáp", "solar-profil": "sản xuất khung giá đỡ pin năng lượng mặt trời",
           "raf-sistemleri": "sản xuất kệ kho hàng", "yol-bariyeri": "sản xuất tôn lượn sóng hộ lan",
           "cati-cephe-paneli": "sản xuất tôn lợp", "celik-servis-merkezi": "xẻ băng thép cuộn",
           "asik-celik-yapi": "sản xuất xà gồ thép", "iskele-kalasi": "sản xuất giàn giáo",
           "market-rafi": "sản xuất kệ siêu thị", "havalandirma-kanali": "sản xuất ống gió",
           "metal-mobilya": "sản xuất tủ sắt văn phòng", "alcipan-profili": "sản xuất khung trần thạch cao"},
    "id": {"kablo-kanali": "produsen kabel tray", "solar-profil": "produsen mounting panel surya",
           "raf-sistemleri": "produsen rak gudang", "yol-bariyeri": "produsen guardrail jalan",
           "cati-cephe-paneli": "pabrik atap spandek", "celik-servis-merkezi": "slitting coil baja",
           "asik-celik-yapi": "pabrik baja ringan kanal C", "iskele-kalasi": "produsen scaffolding",
           "market-rafi": "produsen rak minimarket", "havalandirma-kanali": "produsen ducting",
           "metal-mobilya": "produsen lemari besi", "alcipan-profili": "produsen rangka plafon hollow"},
}

# (listede kullanilan Turkce ad, ISO, dil, telefon kodu, sorguya eklenecek ulke adi)
ULKELER = [
    ("Hindistan", "IN", "en", "91", "India"), ("BAE", "AE", "en", "971", "UAE"),
    ("Suudi Arabistan", "SA", "en", "966", "Saudi Arabia"), ("Mısır", "EG", "en", "20", "Egypt"),
    ("Katar", "QA", "en", "974", "Qatar"), ("Kuveyt", "KW", "en", "965", "Kuwait"),
    ("Umman", "OM", "en", "968", "Oman"), ("Bahreyn", "BH", "en", "973", "Bahrain"),
    ("Ürdün", "JO", "en", "962", "Jordan"), ("Irak", "IQ", "en", "964", "Iraq"),
    ("Nijerya", "NG", "en", "234", "Nigeria"), ("Kenya", "KE", "en", "254", "Kenya"),
    ("Güney Afrika", "ZA", "en", "27", "South Africa"), ("Gana", "GH", "en", "233", "Ghana"),
    ("Tanzanya", "TZ", "en", "255", "Tanzania"), ("Etiyopya", "ET", "en", "251", "Ethiopia"),
    ("Uganda", "UG", "en", "256", "Uganda"), ("Pakistan", "PK", "en", "92", "Pakistan"),
    ("Bangladeş", "BD", "en", "880", "Bangladesh"), ("Sri Lanka", "LK", "en", "94", "Sri Lanka"),
    ("Malezya", "MY", "en", "60", "Malaysia"), ("Filipinler", "PH", "en", "63", "Philippines"),
    ("Tayland", "TH", "en", "66", "Thailand"), ("Singapur", "SG", "en", "65", "Singapore"),
    ("Birleşik Krallık", "GB", "en", "44", "UK"), ("ABD", "US", "en", "1", "USA"),
    ("Kanada", "CA", "en", "1", "Canada"), ("Avustralya", "AU", "en", "61", "Australia"),
    ("Yeni Zelanda", "NZ", "en", "64", "New Zealand"),
    ("Meksika", "MX", "es", "52", "México"), ("Kolombiya", "CO", "es", "57", "Colombia"),
    ("Peru", "PE", "es", "51", "Perú"), ("Şili", "CL", "es", "56", "Chile"),
    ("Arjantin", "AR", "es", "54", "Argentina"), ("Ekvador", "EC", "es", "593", "Ecuador"),
    ("Guatemala", "GT", "es", "502", "Guatemala"), ("Kosta Rika", "CR", "es", "506", "Costa Rica"),
    ("Panama", "PA", "es", "507", "Panamá"), ("Dominik Cumhuriyeti", "DO", "es", "1", "República Dominicana"),
    ("Bolivya", "BO", "es", "591", "Bolivia"), ("Paraguay", "PY", "es", "595", "Paraguay"),
    ("Uruguay", "UY", "es", "598", "Uruguay"),
    ("Brezilya", "BR", "pt", "55", "Brasil"), ("Portekiz", "PT", "pt", "351", "Portugal"),
    ("Angola", "AO", "pt", "244", "Angola"), ("Mozambik", "MZ", "pt", "258", "Moçambique"),
    ("Fas", "MA", "fr", "212", "Maroc"), ("Cezayir", "DZ", "fr", "213", "Algérie"),
    ("Tunus", "TN", "fr", "216", "Tunisie"), ("Senegal", "SN", "fr", "221", "Sénégal"),
    ("Fildişi Sahili", "CI", "fr", "225", "Côte d'Ivoire"), ("Kamerun", "CM", "fr", "237", "Cameroun"),
    ("Fransa", "FR", "fr", "33", "France"), ("Belçika", "BE", "fr", "32", "Belgique"),
    ("Kazakistan", "KZ", "ru", "7", "Казахстан"), ("Özbekistan", "UZ", "ru", "998", "Узбекистан"),
    ("Kırgızistan", "KG", "ru", "996", "Кыргызстан"),
    ("Vietnam", "VN", "vi", "84", ""), ("Endonezya", "ID", "id", "62", "Indonesia"),
]

# Rehber, pazar yeri, sosyal ag, haber, kamu — firma sitesi degil
KARA_LISTE = re.compile(
    r"(indiamart|tradeindia|exportersindia|justdial|sulekha|alibaba|aliexpress|made-in-china|globalsources|"
    r"dhgate|europages|kompass|yellowpages|yelp|linkedin|facebook|instagram|youtube|twitter|tiktok|pinterest|"
    r"wikipedia|wikimedia|amazon\.|ebay\.|mercadoli[bv]re|olx\.|jiji\.|tokopedia|shopee|lazada|bukalapak|"
    r"blibli|avito|satu\.kz|prom\.ua|pulscen|blizko|tiu\.ru|yandex|google\.|bing\.|medium\.com|quora|reddit|"
    r"issuu|scribd|slideshare|glassdoor|indeed|zoominfo|dnb\.com|bloomberg|crunchbase|opencorporates|cylex|"
    r"hotfrog|businesslist|tuugo|infoisinfo|paginasamarillas|amarillas|guiamais|pagesjaunes|tradekey|ec21|"
    r"ecplaza|exporthub|go4worldbusiness|thomasnet|manta\.com|bizapedia|mapquest|waze|foursquare|tripadvisor|"
    r"ensun|machinematcher|enfsolar|solarfeeds|kellysearch|directindustry|archiexpo|b2b|marketplace|"
    r"\.gov|\.gob\.|\.edu|\.ac\.|news|noticias|blogspot|wordpress\.com|wix\.com|weebly|jimdo|sites\.google|"
    r"statista|researchandmarkets|marketsandmarkets|mordorintelligence|6wresearch|grandviewresearch|"
    r"imarcgroup|expertmarketresearch|zaubacorp|tofler|infobel|ghanayello|kenyayello|nigeriagalleria|"
    r"businesslistings|africa-business|vymaps|dubaidirectory|yello|zawya|arabianbusiness|construction\.com|"
    r"houzz|bark\.com|checkatrade|homeadvisor|angi\.com|trustpilot|clutch\.co|goodfirms|upwork|fiverr)", re.I)

# Rakip: makine uretenler (baslik/ozette)
MAKINE = re.compile(
    r"roll\s*-?\s*form(ing|er)?\s*machine|forming machine|machinery|machines?\b|máquina|maquinaria|perfiladora|"
    r"machine à profiler|profileuse|станок|оборудование для|máy cán|máy sản xuất|mesin|makine|"
    r"equipamento para|equipment manufacturer", re.I)

ULKE_UZANTI = {"GB": "uk"}


def yetki():
    k = json.load(io.open(AYAR, encoding="utf-8"))
    return "Basic " + base64.b64encode(("%s:%s" % (k["login"], k["password"])).encode()).decode()


def istek(yol, govde=None, deneme=3):
    veri = json.dumps(govde).encode() if govde is not None else None
    for i in range(deneme):
        try:
            r = urllib.request.Request(API + yol, data=veri, headers={"Authorization": yetki(),
                                                                        "Content-Type": "application/json"})
            with urllib.request.urlopen(r, timeout=120) as y:
                return json.load(y)
        except Exception:
            if i == deneme - 1:
                raise
            time.sleep(5 * (i + 1))


def konum_kodlari():
    yol = os.path.join(KESIF, "konumlar.json")
    if os.path.exists(yol):
        return json.load(io.open(yol, encoding="utf-8"))
    kodlar = {}
    for _, iso, _, _, _ in ULKELER:
        t = istek("serp/google/locations/" + iso.lower())["tasks"][0]
        ulke = [x for x in (t.get("result") or []) if x.get("location_type") == "Country"]
        if ulke:
            kodlar[iso] = ulke[0]["location_code"]
    json.dump(kodlar, io.open(yol, "w", encoding="utf-8"))
    return kodlar


def gorevler(kodlar):
    liste = []
    for ad, iso, dil, _, sorgu_ulke in ULKELER:
        if iso not in kodlar:
            continue
        for seg, ifade in SORGU[dil].items():
            kelime = ("%s %s" % (ifade, sorgu_ulke)).strip()
            liste.append({"keyword": kelime, "location_code": kodlar[iso], "language_code": dil,
                          "depth": DERINLIK, "tag": "%s|%s" % (iso, seg)})
    return liste


def serp_cek(liste, yol):
    """Standart kuyruk: gonder, hazir oldukca al. Doner: [{iso, seg, sonuclar:[{url,domain,title,description}]}]"""
    bekleyen, gelen, maliyet = {}, [], 0.0
    for i in range(0, len(liste), 100):
        for t in istek("serp/google/organic/task_post", liste[i:i + 100])["tasks"]:
            maliyet += t.get("cost") or 0
            if t.get("status_code") == 20100:
                bekleyen[t["id"]] = t["data"]["tag"]
    print("  %d arama kuyrukta (gönderim ücreti %.3f $)" % (len(bekleyen), maliyet), flush=True)

    def sor(gid):
        try:
            return gid, istek("serp/google/organic/task_get/regular/" + gid)["tasks"][0]
        except Exception:
            return gid, None

    son = time.time() + 40 * 60
    while bekleyen and time.time() < son:
        time.sleep(20)
        with ThreadPoolExecutor(8) as h:
            for gid, t in h.map(sor, list(bekleyen)):
                if t is None or t.get("status_code") in (40601, 40602):
                    continue
                etiket = bekleyen.pop(gid)
                iso, seg = etiket.split("|")
                sonuc = []
                for r in ((t.get("result") or [{}])[0] or {}).get("items") or []:
                    if r.get("type") == "organic":
                        sonuc.append({k: r.get(k) for k in ("url", "domain", "title", "description")})
                gelen.append({"iso": iso, "seg": seg, "sonuclar": sonuc})
        print("  hazır %d/%d" % (len(liste) - len(bekleyen), len(liste)), flush=True)
    json.dump({"tarih": date.today().isoformat(), "maliyet": round(maliyet, 4), "aramalar": gelen},
              io.open(yol, "w", encoding="utf-8"), ensure_ascii=False)
    if bekleyen:
        print("  [uyarı] %d arama 40 dakikada bitmedi, atlandı" % len(bekleyen))
    return gelen, maliyet


def bilinen_alanlar():
    """Listede ya da Elenenler'de gecen her alan adi — yeniden eklenmesin."""
    alanlar = set()
    for f in os.listdir(KLASOR):
        if f.endswith(".md"):
            for u in re.findall(r"https?://[^\s|)\]]+", io.open(os.path.join(KLASOR, f), encoding="utf-8").read()):
                alanlar.add(B.url_alani(u))
    return alanlar


def metin(html):
    return D.metin(html.lower())


def firma_adi(html, alan):
    m = re.search(r'<meta[^>]+property=["\']og:site_name["\'][^>]+content=["\']([^"\']{2,60})', html, re.I) \
        or re.search(r'<meta[^>]+content=["\']([^"\']{2,60})["\'][^>]+property=["\']og:site_name', html, re.I)
    if m:
        return re.sub(r"\s+", " ", m.group(1)).strip()
    baslik = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
    etiket = alan.split(".")[0]
    if baslik:
        parcalar = [p.strip() for p in re.split(r"\s[|\-–—:·»]\s", re.sub(r"\s+", " ", baslik.group(1))) if p.strip()]
        for p in parcalar:
            if etiket[:4].lower() in re.sub(r"[^a-z0-9]", "", p.lower()):
                return p[:60]
    return etiket.replace("-", " ").title()


def hucre(s):
    return re.sub(r"\s+", " ", (s or "").replace("|", "/")).strip()


def aday_dogrula(a):
    """a: {alan, iso, ulke, tel, seg, url, title, description}. Doner: satir dict ya da (None, neden)."""
    kok = "https://" + a["domain"].lstrip(".") + "/"
    k1, h1, s1 = B.getir(a["url"])      # aramada cikan sayfa
    k0, h0, s0 = B.getir(kok)           # ana sayfa (ayniysa onbellekten)
    if k0 != 200 and k1 != 200:
        return None, "açılmadı"
    sayfa_metni = metin(h1) if k1 == 200 else ""
    ana_metni = metin(h0) if k0 == 200 else ""
    birlikte = sayfa_metni + " " + ana_metni
    kelimeler = D.KELIME.get(a["seg"], [])
    if not any(w in birlikte for w in kelimeler):
        return None, "ürün kelimesi yok"
    baslik = re.search(r"<title[^>]*>(.*?)</title>", h0 or h1 or "", re.I | re.S)
    if baslik and MAKINE.search(baslik.group(1)):
        return None, "makine üreticisi"
    uretim = any(w in birlikte for w in D.URETIM)
    if not uretim and any(w in (h0 or "").lower() + (h1 or "").lower() for w in D.SEPET):
        return None, "dükkân"
    if not uretim:
        return None, "üretim izi yok"
    eposta, esayfa, _, _ = B.site_eposta(s0 if k0 == 200 else kok, ek_sayfalar=[a["url"]])
    if not eposta:
        return None, "e-posta yok"
    # Ulke: yerel uzanti ya da sitede ulke telefon kodu
    alan = B.url_alani(s0 if k0 == 200 else a["url"])
    uzanti = alan.rsplit(".", 1)[-1]
    beklenen = ULKE_UZANTI.get(a["iso"], a["iso"].lower())
    if uzanti != beklenen:
        tum = (h0 or "") + (h1 or "")
        for u in (esayfa,):
            k2, h2, _ = B.getir(u) if u else (0, "", "")
            tum += h2 if k2 == 200 else ""
        if a["tel"] == "1":
            # ABD/Kanada siteleri numarayi +1'siz yaziyor: (555) 123-4567 / 555-123-4567
            tel = re.compile(r"\+1[\s\-.(]|\(\d{3}\)\s?\d{3}[\s\-.]\d{4}|\d{3}[\-.]\d{3}[\-.]\d{4}")
        else:
            tel = re.compile(r"(\+|00|\()\s?%s[\s\-().]" % a["tel"])
        if len(uzanti) == 2 and uzanti not in ("co", "io", "me", "tv", "cc", "ai"):
            return None, "başka ülkenin uzantısı (.%s)" % uzanti
        if not tel.search(tum):
            return None, "ülke tutmuyor (telefon kodu yok)"
    return {
        "firma": hucre(firma_adi(h0 if k0 == 200 else h1, alan)),
        "ulke": a["ulke"],
        "web": "https://" + (urllib.parse.urlparse(s0).netloc if k0 == 200 else a["domain"]) + "/",
        "dogrulama": a["url"],
        "urun": hucre(a["title"])[:120],
        "eposta": "%s — sitede: %s" % (eposta, esayfa),
        "segment": SEGMENT_ADI[a["seg"]],
    }, ""


# ---------------------------------------------------------------- siki suzgec
# Ilk kontrol (urun kelimesi + "uretim izi" + e-posta + ulke) yetmedi: 21 Eylul ornek
# incelemesinde kabul edilenlerin yarisi kiralama (andamios venta y alquiler), perakende
# (Do It Center), bayi/ithalatci ("Top Dealers & Suppliers", "trading") ve dagiticiydi.
# "Uretim izi" listesi "produc" gibi zayif kokler iceriyordu ("products" bile geciyordu).
# Ikinci suzgec: firma KENDINI URETICI olarak tanitmali — arama basliginda/ozetinde ya da
# sayfanin basligi, aciklamasi, H1'inde — ve baslikta perakende/kiralama/bayi izi olmamali.

IMALATCI = re.compile(
    r"manufactur|fabricante|fabricamos|fabricaci[oó]n|f[aá]brica\b|fabricant|fabbric|produttor|"
    r"producent|производ|завод|s[aả]n xu[aấ]t|nh[aà] m[aá]y|produsen|pabrik|factory|fabricator|"
    r"fabrication|we produce|producimos|produzimos|fabrik|hersteller|roll[ -]?form|industr(ies|ia[sl]?) ",
    re.I)
NEGATIF = re.compile(
    r"alquiler|arriendo|renta de|\brental|\bhire\b|aluguel|loca[cç][aã]o|location d|tienda|\bloja\b|"
    r"\bstore\b|\bshop\b|ferreter|home ?cent|hardware|wholesal|mayorista|atacad|importador|importer|"
    r"\btrading\b|dealer|revendedor|precio|price list|pre[cç]o|\bprix\b|comprar|buy online|marketplace|"
    r"cotiza en l[ií]nea|supermercado de|installer|instalador|contractor|contratista|consult", re.I)
# Dominik Cumhuriyeti de +1 kullaniyor: ABD bicimli her numara gecmesin, alan kodu sart
DO_TELEFON = re.compile(r"\b8[024]9[\s\-.)]*\d{3}[\s\-.]?\d{4}\b")
BOZUK_KULLANICI = re.compile(r"^(u00[0-9a-f]{2}|x[0-9a-f]{2}|%[0-9a-f]{2})", re.I)


def baslik_bilgisi(html):
    """<title>, meta/og aciklama, ilk H1 — firmanin kendini tanittigi yerler."""
    if not html:
        return ""
    parca = []
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
    if m:
        parca.append(m.group(1))
    parca += re.findall(r'<meta[^>]+(?:name|property)=["\'](?:description|og:description|og:title)["\'][^>]+content=["\']([^"\']*)', html, re.I)
    parca += re.findall(r'<meta[^>]+content=["\']([^"\']*)["\'][^>]+(?:name|property)=["\'](?:description|og:description|og:title)', html, re.I)
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.I | re.S)
    if h1:
        parca.append(re.sub(r"<[^>]+>", " ", h1.group(1)))
    return re.sub(r"\s+", " ", " ".join(parca))


def ad_sec(html, alan, serp_baslik):
    """Firma adi: alan adiyla ortak parcasi olan aday; yoksa alan adi."""
    etiket = re.sub(r"[^a-z0-9]", "", alan.split(".")[0].lower())
    adaylar = []
    m = re.search(r'<meta[^>]+property=["\']og:site_name["\'][^>]+content=["\']([^"\']{2,60})', html or "", re.I) \
        or re.search(r'<meta[^>]+content=["\']([^"\']{2,60})["\'][^>]+property=["\']og:site_name', html or "", re.I)
    if m:
        adaylar.append(m.group(1))
    t = re.search(r"<title[^>]*>(.*?)</title>", html or "", re.I | re.S)
    for kaynak in ((t.group(1) if t else ""), serp_baslik or ""):
        adaylar += [p.strip() for p in re.split(r"\s[|\-–—:·»]\s|\s[|·]\s?", re.sub(r"\s+", " ", kaynak)) if p.strip()]
    for a in adaylar:
        sade_a = re.sub(r"[^a-z0-9]", "", a.lower())
        if len(etiket) >= 4 and (etiket[:5] in sade_a or (len(sade_a) >= 4 and sade_a[:5] in etiket)):
            return re.sub(r"\s+", " ", a).strip()[:60]
    return etiket.replace("-", " ").title() if etiket else alan


def siki_dogrula(is_):
    """is_: (satir, aday). Doner: (satir|None, neden)."""
    satir, aday = is_
    eposta = satir["eposta"].split(" — ")[0]
    if BOZUK_KULLANICI.match(eposta.partition("@")[0]):
        return None, "bozuk adres"
    k1, h1, _ = B.getir(satir["dogrulama"])
    k0, h0, _ = B.getir(satir["web"])
    baslik = " ".join([aday.get("title", ""), aday.get("description", ""), baslik_bilgisi(h1), baslik_bilgisi(h0)])
    serp_ve_sayfa_basligi = " ".join([aday.get("title", ""),
                                      (re.search(r"<title[^>]*>(.*?)</title>", h1 or "", re.I | re.S) or [None, ""])[1],
                                      (re.search(r"<title[^>]*>(.*?)</title>", h0 or "", re.I | re.S) or [None, ""])[1]])
    if NEGATIF.search(serp_ve_sayfa_basligi) and not IMALATCI.search(serp_ve_sayfa_basligi):
        return None, "başlıkta mağaza/kiralama/bayi izi"
    if not IMALATCI.search(baslik):
        return None, "kendini üretici olarak tanıtmıyor"
    if aday.get("iso") == "DO":
        alan = B.url_alani(satir["web"])
        if not alan.endswith(".do") and not DO_TELEFON.search((h0 or "") + (h1 or "")):
            return None, "Dominik alan kodu yok (809/829/849)"
    yeni = dict(satir)
    yeni["firma"] = hucre(ad_sec(h0 or h1, B.url_alani(satir["web"]), aday.get("title", "")))
    return yeni, ""


def siki_parca(parca):
    B.ONBELLEK_EN_COK = 300
    with ThreadPoolExecutor(8) as ex:
        return list(ex.map(siki_dogrula, parca))


def parca_isle(parca):
    """Bir surecte bir grup aday (ayni alan adinin adaylari ayni parcada: sayfalar bir
    kez indirilir). Doner: [(aday, satir|None, neden)]"""
    B.ONBELLEK_EN_COK = 300      # sekiz surec x 1500 sayfa bellegi sisirirdi
    with ThreadPoolExecutor(8) as ex:
        return [(x, *sonuc) for x, sonuc in zip(parca, ex.map(aday_dogrula, parca))]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", action="store_true")
    ap.add_argument("--tarih", default=date.today().isoformat())
    a = ap.parse_args()
    os.makedirs(KESIF, exist_ok=True)
    serp_yolu = os.path.join(KESIF, "serp-%s.json" % a.tarih)

    if a.plan or not os.path.exists(serp_yolu):
        kodlar = konum_kodlari()
        liste = gorevler(kodlar)
        tahmin = len(liste) * (DERINLIK // 10) * SAYFA_UCRETI
        print("%d ülke × 12 segment = %d arama, tahmini %.2f $" % (len(kodlar), len(liste), tahmin))
        if a.plan:
            return
        aramalar, maliyet = serp_cek(liste, serp_yolu)
        print("Arama ücreti: %.3f $" % maliyet)
    else:
        aramalar = json.load(io.open(serp_yolu, encoding="utf-8"))["aramalar"]
        print("Önbellekten: %s (%d arama)" % (serp_yolu, len(aramalar)))

    ulke = {iso: (ad, tel) for ad, iso, _, tel, _ in ULKELER}
    bilinen = bilinen_alanlar()
    adaylar, elenen = {}, {"rehber/pazar yeri": 0, "makine (rakip)": 0, "zaten listede": 0}
    for s in aramalar:
        for r in s["sonuclar"]:
            alan = B.url_alani(r.get("url") or "")
            if not alan:
                continue
            if KARA_LISTE.search(r.get("domain") or "") or KARA_LISTE.search(alan):
                elenen["rehber/pazar yeri"] += 1
                continue
            # Yalniz baslik: ozette "makinelerimizle uretiyoruz" diyen gercek uretici elenmesin
            if MAKINE.search(r.get("title") or ""):
                elenen["makine (rakip)"] += 1
                continue
            if alan in bilinen:
                elenen["zaten listede"] += 1
                continue
            anahtar = (alan, s["iso"], s["seg"])
            if anahtar not in adaylar:
                ad, tel = ulke[s["iso"]]
                adaylar[anahtar] = {"alan": alan, "domain": r.get("domain") or alan, "iso": s["iso"], "ulke": ad,
                                    "tel": tel, "seg": s["seg"], "url": r["url"], "title": r.get("title") or "",
                                    "description": r.get("description") or ""}
    # Ayni alan adi birden fazla segmentte: her segment ayri dogrulanir (ayri satir; Excel birlestirir)
    print("Aday: %d (alan adı × segment) · elenen: %s" % (len(adaylar), elenen), flush=True)

    # Tek surec bir cekirdege takiliyordu (8.732 aday ~saatler): 8 surec x 8 is parcacigi.
    # Ara kayit: her biten parca kesif/dogrulama-<tarih>.jsonl'a yazilir; yarida kalirsa
    # ayni komut kaldigi yerden surer.
    ara = os.path.join(KESIF, "dogrulama-%s.jsonl" % a.tarih)
    bitmis = {}
    if os.path.exists(ara):
        for satir in io.open(ara, encoding="utf-8"):
            k = json.loads(satir)
            bitmis[tuple(k["anahtar"])] = (k["satir"], k["neden"])
    gruplar = {}
    for anahtar, x in adaylar.items():
        if anahtar not in bitmis:
            gruplar.setdefault(x["alan"], []).append(x)
    parcalar, parca = [], []
    for liste in gruplar.values():
        parca.extend(liste)
        if len(parca) >= 60:
            parcalar.append(parca)
            parca = []
    if parca:
        parcalar.append(parca)
    print("Doğrulanacak: %d aday (%d önceden bitmiş), %d parça" % (
        sum(len(p) for p in parcalar), len(bitmis), len(parcalar)), flush=True)
    basla = time.time()
    with ProcessPoolExecutor(8) as ex, io.open(ara, "a", encoding="utf-8") as kayit:
        isler = [ex.submit(parca_isle, p) for p in parcalar]
        for i, f in enumerate(as_completed(isler), 1):
            for x, satir, n in f.result():
                anahtar = (x["alan"], x["iso"], x["seg"])
                bitmis[anahtar] = (satir, n)
                kayit.write(json.dumps({"anahtar": anahtar, "satir": satir, "neden": n}, ensure_ascii=False) + "\n")
            kayit.flush()
            if i % 5 == 0 or i == len(isler):
                gecen = time.time() - basla
                print("  %d/%d parça · %d dk · kalan tahmini %d dk" % (
                    i, len(isler), gecen / 60, gecen / i * (len(isler) - i) / 60), flush=True)

    ilk, neden = [], {}
    for anahtar, x in adaylar.items():
        satir, n = bitmis.get(anahtar, (None, "doğrulanmadı"))
        if satir:
            ilk.append((satir, x))
        else:
            neden[n] = neden.get(n, 0) + 1
    print("İlk kontrolden geçen: %d satır — sıkı süzgeç (üretici mi, mağaza/kiralama/bayi mi)…" % len(ilk), flush=True)
    gruplar = {}
    for satir, x in ilk:
        gruplar.setdefault(x["alan"], []).append((satir, x))
    parcalar, parca = [], []
    for liste in gruplar.values():
        parca.extend(liste)
        if len(parca) >= 40:
            parcalar.append(parca)
            parca = []
    if parca:
        parcalar.append(parca)
    satirlar = []
    with ProcessPoolExecutor(8) as ex:
        for p_, sonuc in zip(parcalar, ex.map(siki_parca, parcalar)):
            for (satir, n) in sonuc:
                if satir:
                    satirlar.append(satir)
                else:
                    neden["sıkı süzgeç — " + n] = neden.get("sıkı süzgeç — " + n, 0) + 1
    # Ayni alan adi + ulke tek firma: segmentleri ayri satir kalir, sira ulke/firma
    satirlar.sort(key=lambda s: (s["ulke"], s["firma"].lower(), s["segment"]))
    firma_sayisi = len({(B.url_alani(s["web"]), s["ulke"]) for s in satirlar})
    print("\nDOĞRULANAN: %d satır, %d firma" % (len(satirlar), firma_sayisi))
    for n, adet in sorted(neden.items(), key=lambda x: -x[1]):
        print("  elendi — %s: %d" % (n, adet))

    yol = os.path.join(KLASOR, "bolge-kesif-%s.md" % a.tarih)
    basliklar = ["Firma", "Ülke", "Web sitesi", "Doğrulama sayfası", "Ne üretiyor", "E-posta / İletişim", "Segment"]
    govde = [
        "# Keşif — Google araması + otomatik doğrulama (%s)" % a.tarih, "",
        "Kaynak: DataForSEO Google organik sonuçları — ülke konumlu, o ülkenin iş dilinde",
        "\"<ürün> üreticisi\" aramaları (%d ülke × 12 segment). `scripts/hedef-firma-kesif.py`." % len(ulke), "",
        "Her satır otomatik doğrulandı: site açılıyor; segmentin ürünü sayfada geçiyor; firma kendini",
        "ÜRETİCİ olarak tanıtıyor (arama başlığı/özeti ya da sayfa başlığı, açıklaması, H1'i) ve",
        "başlığında mağaza, kiralama, bayi, ithalatçı izi yok; ülke tutuyor (yerel uzantı ya da sitede",
        "ülke telefon kodu; Dominik Cumhuriyeti için 809/829/849); e-posta firmanın kendi sitesinde",
        "yazıyor (\"sitede:\" sayfası). Rehber/pazar yeri siteleri ve makine üreticileri (rakip) elendi.",
        "\"Ne üretiyor\" sütunu Google'daki sayfa başlığı — elle doğrulanmadı.", "",
        "**Doğrulanmış firma sayısı:** %d" % firma_sayisi, "",
        "| " + " | ".join(basliklar) + " |",
        "|" + "---|" * len(basliklar),
    ]
    for s in satirlar:
        govde.append("| %s |" % " | ".join(
            hucre(s[k]) for k in ("firma", "ulke", "web", "dogrulama", "urun", "eposta", "segment")))
    io.open(yol, "w", encoding="utf-8", newline="\n").write("\n".join(govde) + "\n")
    print("\nYazıldı: %s" % yol)


if __name__ == "__main__":
    main()
