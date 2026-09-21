# -*- coding: utf-8 -*-
"""Hedef firma tablolarindaki HER satiri otomatik dogrular.

  python scripts/hedef-firma-dogrula.py                      # rapor, hicbir dosyaya dokunmaz
  python scripts/hedef-firma-dogrula.py --dosya bolge-*.md   # yalnizca bu dosyalar
  python scripts/hedef-firma-dogrula.py --uygula             # duzeltmeleri dosyalara yaz

Uc kontrol:
  1. Site aciliyor mu (dogrulama sayfasi; acilmazsa ana sayfa).
  2. Sayfada segmentin urunu geciyor mu (segment basina cok dilli kelime listesi).
     Park edilmis alan adi da 200 doner; kelime kontrolu onu yakalar.
  3. E-posta sitede GERCEKTEN yaziyor mu (dogrulama sayfasi + ana sayfa +
     iletisim sayfalari). Bulunamayan e-posta silinir, yerine iletisim sayfasi
     yazilir — uydurma adrese taslak acilmasin.

--uygula ile 1 ya da 2'den kalan satir tablodan cikarilir ve "## Elenenler"
altina gerekcesiyle yazilir. Bu, arastirma ajani Haiku gibi kucuk bir modelle
calistiginda sart: ajan kurala uysa bile her satir bagimsiz dogrulanir.
"""
import argparse
import fnmatch
import io
import os
import re
import ssl
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

sys.stdout.reconfigure(encoding="utf-8")
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KLASOR = os.path.join(KOK, "seo", "hedef-firmalar")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

# Segment -> sayfada gecmesi beklenen kelimelerden en az biri (kucuk harf, alt dizgi)
KELIME = {
    "kablo-kanali": [ "portacavi", "canali", "canalizz", "kabelové", "žlab", "kabelov", "trays", "ladder","cable tray", "cable ladder", "trunking", "kabelrinne", "kabeltrasse", "chemin de c", "chemins de c",
                     "portacable", "bandeja", "eletrocalha", "leito", "passerell", "korytk", "kabelgoot", "máng cáp",
                     "kabel tray", "лоток", "лотк", "kabelstege", "kábeltálca", "jgheab", "kablovsk", "σχάρ", "cable management"],
    "solar-profil": [ "napelem", "fotowoltai", "panou", "pv-","solar", "photovolt", "fotovolt", "fotowolt", "pv ", "mounting structure", "солнечн", "surya", "mặt trời"],
    "raf-sistemleri": [ "regál", "scaffalature", "estantería","rack", "regal", "regał", "estanter", "rayonnage", "scaffal", "stelling", "стеллаж", "rak ", "kệ",
                       "shelving", "porta-palete", "porta palete", "polc", "raft", "стелаж", "mezzanin"],
    "yol-bariyeri": [ "svodid", "szalagkorlát", "parapet", "glisier", "bariere","guardrail", "guard rail", "crash barrier", "w-beam", "w beam", "thrie", "glissi", "schutzplank",
                     "leitplank", "bariera", "bariery", "odbojn", "defensa", "barreira", "hộ lan", "огражд", "road safety",
                     "barrier", "barandas", "sicurvia"],
    "cati-cephe-paneli": [ "tablă", "tabla", "țiglă", "tigla", "acoperi", "střeš", "trapézlemez", "lemez", "tető", "blachodach", "pokryc", "genteng", "techo", "metal sheet", "profiled sheet","roof", "cladding", "sandwich", "trapez", "corrugat", "standing seam", "bac acier", "tôle", "tole ",
                          "teja", "lámina", "lamina", "telha", "lamier", "grecat", "dakplat", "профнастил", "сэндвич", "кровл",
                          "tôn", "atap", "facade", "façade", "fachada", "cubierta", "blacha", "plech"],
    "celik-servis-merkezi": [ "dělení", "podélné", "hosszvágás", "debitare", "rozcinanie", "servicecenter", "service center","slitting", "slitter", "cut to length", "cut-to-length", "coil", "service cent", "refendage",
                             "spalt", "längsteil", "querteil", "corte longitudinal", "corte transversal", "cięcie", "rozkr",
                             "продольн", "поперечн", "bobin", "desbobin", "rotoli", "nastri"],
    "pres-atolyeleri": [ "lisov", "présel", "ştanţ", "stant", "stamp", "pressed", "presswork", "stampi","stamping", "pressing", "press", "emboutiss", "stanz", "estampad", "troquel", "estamparia",
                        "stampagg", "tłocz", "lisován", "штамп", "dập", "progressive die", "deep draw", "metal forming"],
    "alcipan-profili": [ "tablaroca", "panel de yeso", "durock", "sadrokarton", "gipszkarton", "rigips", "profile c", "profile u","drywall", "plasterboard", "gypsum", "ceiling", "stud", "placo", "plâtre", "platre", "trockenbau",
                        "cartongesso", "pladur", "gipskarton", "гипсокартон", "baja ringan", "furring", "t-grid", "t grid",
                        "light gauge", "steel frame", "steel framing"],
    "asik-celik-yapi": [ "ocelové konstrukce", "acélszerkezet", "structuri metalice", "konstrukcje stalowe", "hangar","purlin", "sigma", "pre-engineered", "pre engineered", "peb", "steel building", "steel structure",
                        "light gauge", "lgs", "лстк", "прогон", "correa", "terça", "terca", "arcarecc", "panne", "pfette",
                        "xà gồ", "galpón", "galpao", "galpão", "charpente", "estructura met", "metal building", "c-section",
                        "z-section", "c section", "z section", "profil c", "profile c"],
    "iskele-kalasi": [ "skele", "lešenje", "állvány", "schele","scaffold", "plank", "walk board", "walkboard", "catwalk", "andamio", "andaime", "échafaud", "echafaud",
                      "gerüst", "gerust", "ponteggi", "rusztow", "леса", "lešen", "ringlock", "cuplock", "steel deck"],
    "market-rafi": [ "gondol", "regál", "polc", "raft","gondola", "góndola", "gôndola", "gondole", "supermarket", "retail", "shop shelving", "store fixture",
                    "shopfit", "ladenbau", "negozi", "sklepow", "торгов", "siêu thị", "minimarket", "display", "shelving",
                    "estanter", "prateleira", "rayonnage", "regał", "stellaggi"],
    "gurultu-bariyeri": [ "hluk", "zajvéd", "zgomot", "hałas", "rumore", "noise","noise barrier", "noise wall", "acoustic", "sound barrier", "écran acoustique", "ecran acoustique",
                         "lärmschutz", "larmschutz", "acústic", "acustic", "antirumore", "akustycz", "шумозащит", "protihluk",
                         "zajvédő", "fonoassorb", "fonoabsorb", "sound wall"],
    "havalandirma-kanali": [ "klima", "vzduchotech", "légtechn", "wentyl", "condotte", "air duct", "ductos","duct", "hvac", "ventilat", "air distribution", "damper", "diffuser", "gaine", "lüftung",
                            "luftung", "ducto", "conducto", "duto", "canali", "kanały", "воздуховод", "вентиляц", "ống gió",
                            "ventilasi", "spiral", "air handling"],
    "metal-mobilya": [ "skříň", "szekrény", "dulap", "tresor", "caja fuerte", "archiv", "armadi","furniture", "locker", "cabinet", "filing", "cupboard", "almirah", "safe", "mobilier", "möbel", "mobel",
                      "mueble", "móveis", "moveis", "mobili", "meble", "мебел", "tủ", "lemari", "workbench", "shelving",
                      "armoire", "armario", "schrank"],
}
ADDAN = {  # Segment sutununda yazan ad -> anahtar
    "kablo kanalı": "kablo-kanali", "solar profil": "solar-profil", "raf sistemleri": "raf-sistemleri",
    "yol bariyeri": "yol-bariyeri", "çatı ve cephe paneli": "cati-cephe-paneli", "çelik servis merkezi": "celik-servis-merkezi",
    "pres atölyeleri": "pres-atolyeleri", "alçıpan profili": "alcipan-profili", "aşık ve çelik yapı": "asik-celik-yapi",
    "i̇skele kalası": "iskele-kalasi", "iskele kalası": "iskele-kalasi", "market rafı": "market-rafi",
    "gürültü bariyeri": "gurultu-bariyeri", "havalandırma kanalı": "havalandirma-kanali", "çelik mobilya": "metal-mobilya",
}
ILETISIM_YOLLARI = ["contact", "contact-us", "contacts", "kontakt", "contacto", "contato", "contatti", "contactez-nous",
                    "iletisim", "about", "about-us", "kontakty", "контакты"]
DUR = re.compile(r"^#{1,6}\s*.*(elenen|reddedilen|rejected|excluded)", re.I)
EPOSTA = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")

# Uretim izi: saticiyi ureticiden ayiran kelimeler (sayfada ya da ana sayfada en az biri)
URETIM = ["manufactur", "factory", "fabric", "fabrik", "werk", "produc", "produz", "produkc", "výrob", "vyrob", "gyárt",
          "usine", "fábrica", "fabrica", "завод", "производ", "pabrik", "sản xuất", "planta", "hersteller", "made in",
          "plant ", "own production", "üretim", "atelier", "fabbrica", "stabiliment", "zakład", "fabryka", "závod",
          "fabricant", "fabricante", "fabbricant", "manufacture", "producer", "производител", "виробни"]
# Sepet izi: e-ticaret sitesi
SEPET = ["add to cart", "add-to-cart", "warenkorb", "carrito", "carrinho", "košík", "kosár", "koszyk", "panier",
         "sepete ekle", "в корзину", "keranjang", "giỏ hàng", "woocommerce-cart", "cdn.shopify"]

_onbellek = {}


def getir(url):
    """(durum, html_kucuk_harf). Onbellekli; SSL hatasinda bir kez dogrulamasiz dener."""
    if url in _onbellek:
        return _onbellek[url]
    sonuc = (0, "")
    for dogrula in (True, False):
        ctx = ssl.create_default_context() if dogrula else ssl._create_unverified_context()
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en;q=0.9,*;q=0.5"})
            with urllib.request.urlopen(req, timeout=25, context=ctx) as r:
                sonuc = (r.status, r.read(1_500_000).decode("utf-8", "replace").lower())
                break
        except urllib.error.HTTPError as e:
            sonuc = (e.code, "")
            break
        except Exception:
            continue
    _onbellek[url] = sonuc
    return sonuc


def curl_acilir_mi(url):
    """urllib'in TLS parmak izini engelleyen siteler icin ikinci istemci."""
    import subprocess
    try:
        r = subprocess.run(["curl", "-s", "-o", os.devnull, "-w", "%{http_code}", "-L", "--max-time", "25", "-A", UA, url],
                           capture_output=True, text=True, timeout=40)
        return r.stdout.strip() == "200"
    except Exception:
        return False


def metin(html):
    # <title> ve meta aciklama da aransin: etiketler soyulunca kayboluyordu
    meta = " ".join(re.findall(r'<meta[^>]+(?:name|property)="(?:description|keywords|og:title|og:description)"[^>]+content="([^"]*)"', html))
    t = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.S)
    return meta + " " + re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", t))


def kok_adres(url):
    p = urllib.parse.urlparse(url)
    return "%s://%s/" % (p.scheme or "https", p.netloc) if p.netloc else ""


def eposta_var_mi(eposta, htmller):
    e = eposta.lower()
    kul, _, alan = e.partition("@")
    varyant = [e, e.replace("@", "&#64;"), e.replace("@", "&#x40;"), "%s [at] %s" % (kul, alan), "%s(at)%s" % (kul, alan),
               "%s [@] %s" % (kul, alan), "%s at %s" % (kul, alan)]
    return any(v in h for h in htmller for v in varyant)


def satir_dogrula(satir):
    """satir: dict (firma, web, dogrulama, eposta, segment). Doner: dict sonuc."""
    s = dict(satir)
    url = satir["dogrulama"] or satir["web"]
    kod, html = getir(url)
    if kod != 200 and satir["web"] and satir["web"] != url:
        kod, html = getir(satir["web"])
    s["kod"] = kod
    if kod != 200:
        if kod in (404, 410) or kod == 0:
            # Kesin olu say ama once curl ile bir kez daha dene (tek istemcinin hatasi olmasin)
            if curl_acilir_mi(url) or (satir["web"] and curl_acilir_mi(satir["web"])):
                s["karar"] = "tut"; s["eposta_durum"] = "yok"; s["not"] = "yalnızca curl ile açılıyor"
                return s
            s["karar"] = "ele"; s["neden"] = "site açılmıyor (HTTP %s)" % kod
            return s
        # 403/429/5xx/3xx dongusu: bot korumasi ya da gecici hata — olu sayilmaz, isaretlenir
        s["karar"] = "tut"; s["eposta_durum"] = "yok"; s["not"] = "otomatik doğrulanamadı (HTTP %s)" % kod
        return s
    kelimeler = KELIME.get(satir["segment"], [])
    govde = metin(html)
    bulunan = [k for k in kelimeler if k in govde]
    if kelimeler and not bulunan:
        kok = kok_adres(url)
        k2, h2 = getir(kok) if kok else (0, "")
        if k2 == 200 and any(k in metin(h2) for k in kelimeler):
            bulunan = ["(ana sayfada)"]
    if kelimeler and not bulunan:
        s["karar"] = "ele"; s["neden"] = "sayfada segmentin ürünü geçmiyor"
        return s
    s["karar"] = "tut"
    # Dukkan/bayi suzgeci: sepet izi var ve uretim izi hic yoksa, satici sayilir
    kok = kok_adres(url)
    kok_metin = metin(getir(kok)[1]) if kok else ""
    uretim_var = any(k in govde or k in kok_metin for k in URETIM)
    sepet_var = any(k in html for k in SEPET)
    if sepet_var and not uretim_var:
        s["karar"] = "ele"; s["neden"] = "e-ticaret sitesi, üretim izi yok"
        return s
    if not uretim_var:
        s["not"] = "üretim izi bulunamadı — ilk temasta sorulmalı"
    # E-posta
    e = EPOSTA.search(satir["eposta"] or "")
    s["eposta_durum"] = "yok"
    if e:
        htmller = [html]
        kok = kok_adres(url)
        if kok:
            htmller.append(getir(kok)[1])
            for y in ILETISIM_YOLLARI:
                if eposta_var_mi(e.group(0), htmller):
                    break
                htmller.append(getir(kok + y)[1])
        iletisim_url = re.search(r"https?://\S+", satir["eposta"] or "")
        if iletisim_url:
            htmller.append(getir(iletisim_url.group(0))[1])
        s["eposta_durum"] = "dogru" if eposta_var_mi(e.group(0), htmller) else "bulunamadi"
    return s


def tablo_satirlari(metin_):
    """(onceki_metin, basliklar, [(satir_no, hucreler)], elenenler_baslangic)"""
    satirlar = metin_.split("\n")
    son = next((i for i, s in enumerate(satirlar) if DUR.match(s.strip())), len(satirlar))
    basliklar, veri = None, []
    for i, s in enumerate(satirlar[:son]):
        ayracli = i + 1 < len(satirlar) and re.match(r"^\s*\|[\s:|-]+\|\s*$", satirlar[i + 1])
        ayracsiz = re.match(r"^\s*\|\s*(#\s*\|\s*)?(firma|company)\s*\|", s, re.I)
        if s.lstrip().startswith("|") and (ayracli or ayracsiz):
            b = [h.strip() for h in s.strip().strip("|").split("|")]
            if basliklar is None:
                basliklar = b
            continue
        if s.lstrip().startswith("|") and not re.match(r"^\s*\|[\s:|-]+\|\s*$", s) and basliklar:
            h = [x.strip() for x in s.strip().strip("|").split("|")]
            if [x.lower() for x in h] != [x.lower() for x in basliklar]:
                veri.append((i, h, basliklar))
    return satirlar, basliklar, veri, son


def sutun(basliklar, *adlar):
    for i, b in enumerate(basliklar):
        bb = b.lower().replace("*", "").strip()
        if any(re.search(a, bb) for a in adlar):
            return i
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dosya", default="*.md", help="glob, ornek: bolge-*.md")
    ap.add_argument("--uygula", action="store_true")
    a = ap.parse_args()
    dosyalar = sorted(f for f in os.listdir(KLASOR) if f.endswith(".md") and fnmatch.fnmatch(f, a.dosya))

    is_listesi = []   # (dosya, satir_no, hucreler, idx_haritasi, satir_dict)
    for f in dosyalar:
        yol = os.path.join(KLASOR, f)
        satirlar, basliklar, veri, _ = tablo_satirlari(io.open(yol, encoding="utf-8").read())
        if not basliklar:
            continue
        iw = sutun(basliklar, r"^web", r"^website", r"^site")
        idg = sutun(basliklar, r"doğrulama|dogrulama|verification|kanıt|kanit|evidence")
        ie = sutun(basliklar, r"e-?posta|e-?mail|iletişim|iletisim|contact")
        isg = sutun(basliklar, r"^segment$")
        ifi = sutun(basliklar, r"^firma$|^company")
        for no, h, _b in veri:
            g = lambda i: (h[i] if i is not None and i < len(h) else "")
            seg = ADDAN.get(g(isg).lower().strip(), "") if isg is not None else f[:-3]
            web = (re.search(r"https?://\S+", g(iw)) or [None])
            dog = (re.search(r"https?://\S+", g(idg)) or [None])
            is_listesi.append((f, no, h, {"eposta": ie}, {
                "_satir": satirlar[no],
                "firma": g(ifi) or h[0], "segment": seg,
                "web": web[0].rstrip(").,;") if web[0] else "", "dogrulama": dog[0].rstrip(").,;") if dog[0] else "",
                "eposta": g(ie)}))

    print("dogrulanacak satir: %d (%d dosya)" % (len(is_listesi), len(dosyalar)), flush=True)
    with ThreadPoolExecutor(16) as ex:
        sonuclar = list(ex.map(lambda x: satir_dogrula(x[4]), is_listesi))

    elenen = [(x, s) for x, s in zip(is_listesi, sonuclar) if s["karar"] == "ele"]
    eposta_kotu = [(x, s) for x, s in zip(is_listesi, sonuclar) if s.get("eposta_durum") == "bulunamadi"]
    print("\nTUTULAN: %d | ELENECEK: %d | e-postası sitede bulunamayan: %d"
          % (len(sonuclar) - len(elenen), len(elenen), len(eposta_kotu)))
    for (f, no, h, _, d), s in elenen:
        print("  ELE  %-30s %-28s %s" % (f[:30], d["firma"][:28], s["neden"]))
    notlu = [(x, s) for x, s in zip(is_listesi, sonuclar) if s["karar"] == "tut" and s.get("not")]
    print("  (tutulan ama notlu: %d)" % len(notlu))
    for (f, no, h, _, d), s in notlu:
        print("  NOT  %-30s %-28s %s" % (f[:30], d["firma"][:28], s["not"]))
    for (f, no, h, _, d), s in eposta_kotu:
        print("  E-POSTA?  %-26s %-28s %s" % (f[:26], d["firma"][:28], d["eposta"][:50]))

    if not a.uygula:
        print("\n(rapor modu — dosyalara dokunulmadı; uygulamak için --uygula)")
        return

    # --- dosyalara yaz ---
    dosya_isleri = {}
    for (x, s) in zip(is_listesi, sonuclar):
        dosya_isleri.setdefault(x[0], []).append((x, s))
    for f, isler in dosya_isleri.items():
        yol = os.path.join(KLASOR, f)
        satirlar = io.open(yol, encoding="utf-8").read().split("\n")
        # Ajan dosyaya bu arada satir eklemis olabilir: sira numarasi kayar, metin kaymaz.
        konum = {}
        for i, sat in enumerate(satirlar):
            konum.setdefault(sat.strip(), i)
        cikar, ele_notlari, kayip = set(), [], 0
        for (f_, no, h, idx, d), s in isler:
            i = konum.get(d["_satir"].strip())
            if i is None:
                kayip += 1          # satir bu arada degismis: dokunma, bir sonraki turda denetlenir
                continue
            if s["karar"] == "ele":
                cikar.add(i)
                ele_notlari.append("- **%s** — otomatik doğrulamada elendi (2026-09-21): %s" % (d["firma"], s["neden"]))
            elif s.get("eposta_durum") == "bulunamadi" and idx["eposta"] is not None:
                h2 = list(h)
                yedek = d["dogrulama"] or d["web"]
                h2[idx["eposta"]] = "e-posta sitede doğrulanamadı — iletişim: %s" % yedek
                satirlar[i] = "| " + " | ".join(h2) + " |"
        if kayip:
            print("  [uyarı] %s — %d satır doğrulama sırasında değişmiş, dokunulmadı" % (f, kayip))
        yeni = [s for i, s in enumerate(satirlar) if i not in cikar]
        if ele_notlari:
            son = next((i for i, s in enumerate(yeni) if DUR.match(s.strip())), None)
            if son is None:
                yeni += ["", "## Elenenler", ""] + ele_notlari
            else:
                yeni = yeni[:son + 1] + [""] + ele_notlari + yeni[son + 1:]
        # sayac
        metin_ = "\n".join(yeni)
        kalan = len(tablo_satirlari(metin_)[2])
        metin_ = re.sub(r"(\*\*Doğrulanmış firma sayısı:\*\*\s*)\d+", lambda m: m.group(1) + str(kalan), metin_, count=1)
        io.open(yol, "w", encoding="utf-8").write(metin_)
        print("  yazıldı: %s — %d tutuldu, %d elendi" % (f, kalan, len(cikar)))


if __name__ == "__main__":
    main()
