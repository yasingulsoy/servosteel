# -*- coding: utf-8 -*-
"""Bir firmanin KENDI sitesinde yayimladigi e-posta adresini bulur.

Iki betik kullanir: hedef-firma-eposta-bul.py (listede adresi olmayan firmalar)
ve hedef-firma-kesif.py (yeni bulunan firmalar). Kural ikisinde de ayni:

  - Adres firmanin sitesinde YAZILI olmali. Tahmin (info@alanadi) yok: dogrulanmamis
    adrese giden e-posta geri doner, geri donme orani itibari bozar.
  - Kabul: sitenin kendi alan adindaki adres, ya da sitede yazan ucretsiz posta
    adresi (Latin Amerika ve Afrika'da kucuk ureticiler gmail/hotmail kullaniyor).
    Baska bir alan adindaki adres (cogunlukla siteyi yapan ajans) ALINMAZ.
  - Ise, gizlilige, faturaya giden adres (jobs@, privacy@, billing@...) ve
    sistem adresi (noreply@, postmaster@...) alinmaz; satis/info adresi one gecer.

Sitelerin gizleme yontemleri: Cloudflare e-posta korumasi (data-cfemail — XOR ile
cozulur), mailto: baglantisi, HTML varlik kodlari (&#64;), "ad [at] alan [dot] com".
"""
import html as html_mod
import os
import re
import ssl
import subprocess
import urllib.parse
import urllib.request

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

EPOSTA = re.compile(r"[a-z0-9][a-z0-9._%+-]{0,63}@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}")

ILETISIM = re.compile(
    r"contact|kontakt|contacto|contato|contatti|contactez|nous-contacter|iletisim|iletişim|impressum|"
    r"about|empresa|nosotros|quienes|sobre|a-propos|chi-siamo|o-nas|o-firmie|lien-he|lienhe|hubungi|kontak|"
    r"контакт|связ|تواصل|اتصل|enquir|inquir|reach-us|get-in-touch|location|oficinas|sucursal", re.I)

UCRETSIZ = re.compile(
    r"^(gmail|googlemail|yahoo|ymail|rocketmail|hotmail|outlook|live|msn|aol|icloud|me|mac|proton(mail)?|pm|"
    r"zoho(mail)?|gmx|mail|yandex|ya|rambler|bk|inbox|list|rediffmail|rediff|qq|163|126|sina|uol|bol|terra|ig|"
    r"libero|virgilio|tiscali|alice|orange|wanadoo|free|sfr|laposte|seznam|centrum|wp|o2|interia|onet|op|"
    r"freemail|citromail|abv|t-online|web|arnet|fibertel|prodigy|telmex|cantv|etb|movistar|hotmail|windowslive)\.",
    re.I)

KOTU_KULLANICI = re.compile(
    r"^(no-?reply|donotreply|do-not-reply|noresponder|postmaster|abuse|mailer-daemon|hostmaster|webmaster|"
    r"privacy|gdpr|dpo|rgpd|lgpd|datenschutz|protecciondedatos|dataprotection|legal|compliance|"
    r"jobs?|careers?|career|rrhh|hr|cv|curriculum|recruit\w*|recrutement|empleo|empleos|trabajo|vagas|talento|"
    r"invoice\w*|factura\w*|facturacion|billing|accounts?|accounting|contabilidad|finance|payables?|"
    r"press|prensa|media|marketing|newsletter|unsubscribe|support-noreply|example|test|user|usuario|name|"
    r"your\.?name|youremail|email|correo|mail|whistle-?blow\w*|ethics?|etica|etik|denuncias?|complaints?|"
    r"quejas|reclam\w*|compliance\w*|"
    # form yer tutuculari: <input placeholder="company@gmail.com">
    r"company|empresa|nombre|seunome|votrenom|someone|john\.?doe|jane\.?doe|abc|xyz|demo|sample|yourcompany)$",
    re.I)

SATIS = re.compile(
    r"^(sales|ventas|vendas|venda|comercial|commercial|export|exports|exportacion|exportaciones|info|informacion|"
    r"contact|contacto|contato|kontakt|office|oficina|enquir\w*|inquir\w*|sac|atendimento|cotizaciones|"
    r"cotacao|orcamento|pedidos|ventes|vente|vendite|sprzedaz|biuro|obchod|prodaja|marketing\.sales)", re.I)

KOTU_ALAN = re.compile(
    r"(example\.|domain\.|yourdomain|yoursite|mysite|company\.com$|email\.com$|sentry|wixpress|godaddy|"
    r"schema\.org|w3\.org|jquery|cloudflare|googleapis|gstatic|facebook|twitter|instagram|linkedin|"
    r"youtube|wordpress\.(com|org)|squarespace|shopify|hubspot|mailchimp|sendgrid|amazonaws|"
    r"domainsbyproxy|whoisguard|privacyguard|contactprivacy)", re.I)

DOSYA_UZANTISI = re.compile(r"\.(png|jpe?g|gif|webp|svg|css|js|ico|pdf|woff2?|ttf|mp4)$", re.I)

# Iki seviyeli ulke uzantilari: alan adinin "kayit" kismi uc parcadir (firma.com.mx)
IKI_SEVIYE = re.compile(
    r"\.(com|co|net|org|gov|edu|ac|or|ne|go|in|ind|biz|info|ltd|plc|nom|web|gob|mil|sch|me)\.[a-z]{2}$", re.I)

# Sinirli onbellek: kesifte binlerce sayfa taraniyor; sinirsiz tutmak GB'larca bellek demek.
from collections import OrderedDict  # noqa: E402
import threading  # noqa: E402
_onbellek = OrderedDict()
_kilit = threading.Lock()
ONBELLEK_EN_COK = 1500


def kayit_alani(alan):
    """ventas.firma.com.mx -> firma.com.mx ; www.firma.com -> firma.com"""
    alan = alan.lower().strip(".")
    if alan.startswith("www."):
        alan = alan[4:]
    parca = alan.split(".")
    n = 3 if IKI_SEVIYE.search(alan) and len(parca) >= 3 else 2
    return ".".join(parca[-n:])


def url_alani(url):
    return kayit_alani(urllib.parse.urlparse(url).netloc.split(":")[0]) if url else ""


def getir(url, zaman=20):
    """(durum, html, son_url). Onbellekli. urllib olmazsa curl (bazi siteler urllib'in
    TLS parmak izini engelliyor). HTML kucultulmez — adres buyuk harf de icerebilir."""
    with _kilit:
        if url in _onbellek:
            _onbellek.move_to_end(url)
            return _onbellek[url]
    sonuc = (0, "", url)
    for dogrula in (True, False):
        ctx = ssl.create_default_context() if dogrula else ssl._create_unverified_context()
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": UA, "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
                "Accept-Language": "en;q=0.9,es;q=0.8,*;q=0.5"})
            with urllib.request.urlopen(req, timeout=zaman, context=ctx) as r:
                ham = r.read(2_000_000)
                cs = r.headers.get_content_charset() or "utf-8"
                sonuc = (r.status, ham.decode(cs, "replace"), r.geturl())
                break
        except urllib.error.HTTPError as e:
            sonuc = (e.code, "", url)
            break
        except Exception:
            continue
    if sonuc[0] in (0, 403, 429, 503):
        try:
            r = subprocess.run(["curl", "-s", "-L", "--compressed", "--max-time", str(zaman), "-A", UA,
                                "-w", "\n%{http_code} %{url_effective}", url],
                               capture_output=True, timeout=zaman + 10)
            cikti = r.stdout.decode("utf-8", "replace")
            govde, _, son = cikti.rpartition("\n")
            kod, _, son_url = son.partition(" ")
            if kod.isdigit() and int(kod) == 200 and govde:
                sonuc = (200, govde, son_url or url)
        except Exception:
            pass
    with _kilit:
        _onbellek[url] = sonuc
        while len(_onbellek) > ONBELLEK_EN_COK:
            _onbellek.popitem(last=False)
    return sonuc


def cf_coz(hexmetin):
    """Cloudflare e-posta korumasi: ilk bayt anahtar, gerisi XOR'lu."""
    try:
        anahtar = int(hexmetin[:2], 16)
        return "".join(chr(int(hexmetin[i:i + 2], 16) ^ anahtar) for i in range(2, len(hexmetin), 2))
    except ValueError:
        return ""


def adresler(html):
    """Sayfadaki aday adresler: {adres: gorunur_mu}.

    Gorunur = ziyaretcinin gordugu metinde, mailto'da ya da Cloudflare korumasinda.
    Gorunmeyen = etiket/JSON icinde (sema kaydi, form yer tutucusu, betik). Ucretsiz
    posta adresi YALNIZ gorunurse alinir: placeholder="company@gmail.com" boyle yakalandi."""
    bulunan = {}
    # Betik/JSON icindeki kacisli karakterler: ">" cozulmezse adres "u003e@firma" oluyordu
    html = re.sub(r"\\u00([0-9a-fA-F]{2})", lambda m: chr(int(m.group(1), 16)), html)

    def ekle(e, gorunur):
        e = (e or "").strip().strip(".,;:").lower()
        if EPOSTA.fullmatch(e):
            bulunan[e] = bulunan.get(e, False) or gorunur

    for m in re.finditer(r'data-cfemail="([0-9a-fA-F]+)"', html):
        ekle(cf_coz(m.group(1)), True)
    for m in re.finditer(r"/cdn-cgi/l/email-protection#([0-9a-fA-F]+)", html):
        ekle(cf_coz(m.group(1)), True)
    acik = html_mod.unescape(html)
    for m in re.finditer(r"mailto:([^\"'?<>\s]+)", acik, re.I):
        ekle(urllib.parse.unquote(m.group(1)), True)
    t = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", acik, flags=re.S | re.I)
    t = re.sub(r"<[^>]+>", " ", t)
    t = re.sub(r"\s*[\[\(\{]\s*(?:at|@|arroba|arobase|chiocciola)\s*[\]\)\}]\s*", "@", t, flags=re.I)
    t = re.sub(r"\s*[\[\(\{]\s*(?:dot|punto|punkt|nokta|ponto|point)\s*[\]\)\}]\s*", ".", t, flags=re.I)
    t = re.sub(r"\s+@\s+", "@", t)
    for m in EPOSTA.finditer(t.lower()):
        ekle(m.group(0), True)
    for m in EPOSTA.finditer(acik.lower()):   # etiket icindeki (data-*, JSON-LD) adresler
        ekle(m.group(0), False)
    return bulunan


def uygun_mu(eposta, site_alani, gorunur=True):
    """(kabul?, tur) tur: 'ayni' | 'ucretsiz' | ''"""
    kul, _, alan = eposta.partition("@")
    if DOSYA_UZANTISI.search(eposta) or KOTU_ALAN.search(alan) or KOTU_KULLANICI.match(kul):
        return False, ""
    if len(kul) > 40 or re.fullmatch(r"[0-9a-f]{16,}", kul):   # izleme kimligi
        return False, ""
    if ".." in kul or kul.startswith(".") or kul.endswith("."):  # ekranda kirpilmis: "aten...@firma"
        return False, ""
    if re.match(r"^(u00[0-9a-f]{2}|x[0-9a-f]{2}|%[0-9a-f]{2})", kul):   # kacis artigi
        return False, ""
    if site_alani and kayit_alani(alan) == site_alani:
        return True, "ayni"
    if UCRETSIZ.match(alan) and gorunur:
        return True, "ucretsiz"
    return False, ""


def puan(eposta, tur):
    kul = eposta.partition("@")[0]
    return (0 if tur == "ayni" else 1, 0 if SATIS.match(kul) else 1, len(eposta))


def iletisim_baglantilari(html, taban, site_alani, en_cok=5):
    """Ana sayfadaki iletisim/hakkimizda baglantilari (ayni alan adi)."""
    bulunan = []
    for m in re.finditer(r"<a\b[^>]*href=[\"']([^\"'#]+)[\"'][^>]*>(.*?)</a>", html, re.I | re.S):
        href, yazi = m.group(1).strip(), re.sub(r"<[^>]+>", " ", m.group(2))
        if href.startswith(("mailto:", "tel:", "javascript:", "whatsapp:")):
            continue
        if not (ILETISIM.search(href) or ILETISIM.search(yazi)):
            continue
        tam = urllib.parse.urljoin(taban, href)
        if url_alani(tam) != site_alani or DOSYA_UZANTISI.search(urllib.parse.urlparse(tam).path):
            continue
        tam = tam.split("#")[0]
        if tam not in bulunan:
            bulunan.append(tam)
        if len(bulunan) >= en_cok:
            break
    return bulunan


STANDART_YOLLAR = ["contact", "contact-us", "contacto", "contato", "contatti", "contactez-nous", "kontakt",
                   "about", "about-us", "lien-he", "hubungi-kami", "kontak"]


def site_eposta(web, ek_sayfalar=()):
    """Sitede yazan en iyi adres. Doner: (eposta|None, bulundugu_sayfa, taranan_sayfa_sayisi, ana_durum)"""
    kok = web if re.match(r"https?://", web or "") else ("https://" + web if web else "")
    if not kok:
        return None, "", 0, 0
    site_alani = url_alani(kok)
    kod, html, son_url = getir(kok)
    if kod != 200 and kok.startswith("https://"):
        kod, html, son_url = getir("http://" + kok[8:])
    if kod == 200 and url_alani(son_url) and url_alani(son_url) != site_alani:
        site_alani = url_alani(son_url)          # alan adi yonlendirmesi (firma.com -> firma.com.mx)
    sayfalar = []
    if kod == 200:
        sayfalar.append((son_url, html))
    for u in ek_sayfalar:
        if u and u != kok:
            k2, h2, s2 = getir(u)
            if k2 == 200:
                sayfalar.append((s2, h2))
    adaylar = {}   # eposta -> (tur, sayfa)

    def topla(url, h):
        for e, gorunur in adresler(h).items():
            ok, tur = uygun_mu(e, site_alani, gorunur)
            if ok and e not in adaylar:
                adaylar[e] = (tur, url)

    for url, h in sayfalar:
        topla(url, h)
    if not any(t == "ayni" for t, _ in adaylar.values()) and kod == 200:
        taban = son_url
        diger = iletisim_baglantilari(html, taban, site_alani)
        if not diger:
            diger = [urllib.parse.urljoin(taban, "/" + y) for y in STANDART_YOLLAR[:6]]
        for u in diger:
            k2, h2, s2 = getir(u)
            if k2 == 200:
                sayfalar.append((s2, h2))
                topla(s2, h2)
            if any(t == "ayni" for t, _ in adaylar.values()):
                break
    if not adaylar:
        return None, "", len(sayfalar), kod
    en_iyi = min(adaylar, key=lambda e: puan(e, adaylar[e][0]))
    return en_iyi, adaylar[en_iyi][1], len(sayfalar), kod
