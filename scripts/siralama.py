# -*- coding: utf-8 -*-
"""Google sıralama takibi — izlenen kelimelerde servosteel.com.tr kaçıncı? Bkz. KONTROL.md §C.3.

Kullanım:
  python scripts/siralama.py                ölç, kaydet, raporla (en çok ~11 dk, kelime başına ~0,003 $)
  python scripts/siralama.py --canli        hepsi canlı uçtan (~2 dk, kelime başına ~0,01 $)
  python scripts/siralama.py --pazar tr,us  yalnızca bu pazarlar; bugünün kaydı varsa içine işler
  python scripts/siralama.py --eksik        bugünün kaydında olmayan (listeye yeni eklenen) kelimeleri ölç
  python scripts/siralama.py --rapor        ölçüm yok; son kaydı bir öncekiyle yeniden raporla
  python scripts/siralama.py --kuru         API'ye gitmeden kelime sayısı ve tahmini maliyet

Kelimeler: seo/izlenen-kelimeler.json · kayıtlar: seo/siralama/YYYY-AA-GG.json
Son rapor: seo/siralama/RAPOR.md · listeden çıkarılan kelime rapora girmez, eski kayıtta durur.

Sıra = Google masaüstü, ORGANİK sonuçlar içindeki yer (reklam, harita, video kutusu sayılmaz).
Search Console'daki "ortalama konum" gösterimlerin ortalamasıdır, farklı çıkar; raporda ayrı sütun.
Google her aramada 50 sonuç vermiyor (ABD "roll forming machine": 20); "yok (ilk N)" o kadarına
bakıldı demek.

Standart kuyrukta görevlerin çoğu 1-2 dakikada biter ama biri 25+ dakika bekleyebiliyor
(2026-09-17 ölçümü); --bekle dakika dolunca kalanlar canlı uçtan tamamlanır.

DataForSEO kimliği ~/.config/claude-seo/dataforseo.json'dan okunur, ASLA yazdırılmaz.
"""
import argparse
import base64
import datetime
import glob
import io
import json
import math
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

sys.stdout.reconfigure(encoding="utf-8")

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LISTE = os.path.join(KOK, "seo", "izlenen-kelimeler.json")
KAYITLAR = os.path.join(KOK, "seo", "siralama")
RAPOR = os.path.join(KAYITLAR, "RAPOR.md")
AYAR = os.path.expanduser("~/.config/claude-seo")
API = "https://api.dataforseo.com/v3/"
# Yalnızca --kuru tahmini için; gerçek maliyet API yanıtındaki "cost" alanından okunur.
# Ücret 10 sonuçluk sayfa başınadır (2026-09-17 ölçümü: derinlik 50 = 5 sayfa ücreti).
SAYFA_UCRETI = {"standart": 0.0006, "canli": 0.002}
# YouTube kanalımızın adı video kutusundaki öğelerde "YouTube · ServoSteel Coil Processing ..." diye geçiyor
KANAL = re.compile(r"servo\s*-?\s*steel", re.I)
AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül",
         "Ekim", "Kasım", "Aralık"]

_yetki = None


def yetki():
    global _yetki
    if _yetki is None:
        k = json.load(io.open(os.path.join(AYAR, "dataforseo.json"), encoding="utf-8"))
        _yetki = "Basic " + base64.b64encode(("%s:%s" % (k["login"], k["password"])).encode()).decode()
    return _yetki


def istek(yol, govde=None, deneme=3):
    veri = json.dumps(govde).encode() if govde is not None else None
    for i in range(deneme):
        try:
            r = urllib.request.Request(API + yol, data=veri, headers={
                "Authorization": yetki(), "Content-Type": "application/json"})
            with urllib.request.urlopen(r, timeout=180) as y:
                return json.load(y)
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            kalici = isinstance(e, urllib.error.HTTPError) and e.code < 500 and e.code != 429
            if kalici or i == deneme - 1:
                raise
            time.sleep(5 * (i + 1))


def oku(yol):
    return json.load(io.open(yol, encoding="utf-8"))


def alan_mi(domain, alan):
    d = (domain or "").lower()
    return d == alan or d.endswith("." + alan)


def coz(t, alan):
    """DataForSEO görev yanıtından bizim sıramızı ve SERP özetini çıkarır."""
    if t.get("status_code") != 20000:
        return {"hata": "%s %s" % (t.get("status_code"), t.get("status_message"))}
    s = (t.get("result") or [None])[0] or {}
    ogeler = s.get("items") or []
    organik = sorted((o for o in ogeler if o.get("type") == "organic"),
                     key=lambda o: o.get("rank_group") or 999)
    bizim = [o for o in organik if alan_mi(o.get("domain"), alan)]
    ilk = bizim[0] if bizim else None
    # Eski blogspot / .com kopyaları çıkarsa görülsün
    diger = sorted({o["domain"] for o in organik
                    if "servosteel" in (o.get("domain") or "") and not alan_mi(o.get("domain"), alan)})
    sonuc = {
        "sira": ilk["rank_group"] if ilk else None,
        "sira_mutlak": ilk["rank_absolute"] if ilk else None,
        "url": ilk["url"] if ilk else None,
        "bizden": len(bizim),
        "organik": len(organik),
        "ilk5": [[o.get("domain"), (o.get("title") or "")[:90]] for o in organik[:5]],
        "ozellik": sorted({o.get("type") for o in ogeler} - {"organic"}),
        # Site çıkmasa da kanalımızın videosu Google'ın video kutusunda çıkabiliyor
        "video": any(KANAL.search("%s %s" % (v.get("source") or "", v.get("title") or ""))
                     for o in ogeler if o.get("type") in ("video", "short_videos")
                     for v in (o.get("items") or [])),
        "kontrol": s.get("check_url"),
    }
    if diger:
        sonuc["diger_mulk"] = diger
    return sonuc


def gorev(k, liste, etiket, konum=None):
    p = liste["pazarlar"][k["pazar"]]
    return {"keyword": k["kelime"], "language_code": p["dil"], "location_code": konum or p["konum"],
            "device": liste["cihaz"], "depth": liste["derinlik"], "tag": etiket}


def birlestir(x, ana, ek):
    """İki konumdan ölçülen pazarda (Türkiye: ülke geneli + İstanbul) sıra ikisinin iyisidir.
    Tek konum Türkçe kelimelerde tutmadı: "rulo sac açıcı" ülke 7 / İstanbul yok, "dilme hattı"
    ülke 30 / İstanbul 7 — Search Console ikisinde de iyi olanı doğruladı (8,4 ve 8,7)."""
    temel = ek if ana.get("hata") and not ek.get("hata") else ana
    x.update(temel)
    x["konumlar"] = ["hata" if r.get("hata") else r.get("sira") for r in (ana, ek)]
    x["video"] = bool(ana.get("video") or ek.get("video"))
    if ana.get("hata") or ek.get("hata"):
        return
    if ek.get("sira") and (not ana.get("sira") or ek["sira"] < ana["sira"]):
        x.update({k: ek[k] for k in ("sira", "sira_mutlak", "url", "bizden")})
    elif not ana.get("sira") and not ek.get("sira"):
        x["organik"] = min(ana["organik"], ek["organik"])


def olc_canli(gorevler):
    """Canlı uç görev başına tek istek kabul ediyor; 6 paralel. Döner: (yanıtlar, maliyet)"""
    def tek(g):
        try:
            return istek("serp/google/organic/live/advanced", [g])["tasks"][0]
        except Exception as e:
            return {"status_code": 0, "status_message": str(e)[:80]}

    with ThreadPoolExecutor(6) as h:
        yanitlar = list(h.map(tek, gorevler))
    return yanitlar, sum(t.get("cost") or 0 for t in yanitlar)


def olc_standart(gorevler, bekleme_dk):
    """Ucuz kuyruk. Süre dolunca bitmeyenler canlı uçtan ölçülür (onlar iki kez ücretlenir).
    Döner: (sıra no → yanıt, maliyet)

    Hazır olanı bulmak için her görev doğrudan sorulur (ücretsiz; bekleyenin yanıtı küçük).
    tasks_ready ilk ölçümde (2026-09-17) biten görevleri dakikalarca geç gösterdi."""
    bekleyen, gelen, maliyet = {}, {}, 0.0
    for i in range(0, len(gorevler), 100):
        for t in istek("serp/google/organic/task_post", gorevler[i:i + 100])["tasks"]:
            maliyet += t.get("cost") or 0
            no = int(((t.get("data") or {}).get("tag") or "").rsplit(":", 1)[-1])
            if t.get("status_code") == 20100:
                bekleyen[t["id"]] = no
            else:
                gelen[no] = t
    print("  %d görev kuyrukta" % len(bekleyen), flush=True)
    def sor(gid):
        try:
            return gid, istek("serp/google/organic/task_get/advanced/" + gid)["tasks"][0]
        except Exception:
            return gid, None  # ağ hatası: sonraki turda yine sorulur

    son, onceki_sayi = time.time() + bekleme_dk * 60, -1
    while bekleyen and time.time() < son:
        time.sleep(15)
        with ThreadPoolExecutor(8) as h:
            for gid, t in h.map(sor, list(bekleyen)):
                if t is None or t.get("status_code") in (40601, 40602):  # işleniyor / sırada
                    continue
                gelen[bekleyen.pop(gid)] = t
        if len(bekleyen) != onceki_sayi:
            onceki_sayi = len(bekleyen)
            print("  hazır %d/%d" % (len(gorevler) - len(bekleyen), len(gorevler)), flush=True)
    if bekleyen:
        kalan = sorted(bekleyen.values())
        print("  %d görev %d dakikada bitmedi, canlı uçtan ölçülüyor" % (len(kalan), bekleme_dk), flush=True)
        yanitlar, ek = olc_canli([gorevler[no] for no in kalan])
        gelen.update(zip(kalan, yanitlar))
        maliyet += ek
    return gelen, maliyet


def gsc_verisi(liste):
    """Sorguların Search Console'daki son 28 günü: ülke kırılımlı, son görüldüğü gün dahil.
    Döner: (tablo, [başlangıç, bitiş]) — kurulum yoksa (None, sebep)."""
    try:
        sys.path.insert(0, AYAR)
        from _common import get_session
        s, _, _ = get_session(["https://www.googleapis.com/auth/webmasters.readonly"])
    except (Exception, SystemExit) as e:
        return None, "Search Console atlandı: %s" % str(e)[:80]
    bit = datetime.date.today() - datetime.timedelta(days=1)
    bas = bit - datetime.timedelta(days=27)
    url = ("https://searchconsole.googleapis.com/webmasters/v3/sites/%s/searchAnalytics/query"
           % urllib.parse.quote("sc-domain:" + liste["alan"], safe=""))
    tablo, satir = {}, 0
    while True:
        r = s.post(url, json={"startDate": bas.isoformat(), "endDate": bit.isoformat(),
                              "dimensions": ["query", "country", "date"], "rowLimit": 25000,
                              "startRow": satir, "type": "web", "dataState": "all"})
        if r.status_code != 200:
            return None, "Search Console hatası %s" % r.status_code
        rows = r.json().get("rows") or []
        for x in rows:
            q, u, gun = x["keys"]
            d = tablo.setdefault((q.lower(), u), {"g": 0, "t": 0, "p": 0.0, "son": gun})
            d["g"] += x["impressions"]
            d["t"] += x["clicks"]
            d["p"] += x["position"] * x["impressions"]
            d["son"] = max(d["son"], gun)
        if len(rows) < 25000:
            break
        satir += 25000
    return tablo, [bas.isoformat(), bit.isoformat()]


def gsc_satiri(tablo, kelime, pazar):
    xs = [tablo[(kelime.lower(), u)] for u in pazar["gsc"] if (kelime.lower(), u) in tablo]
    g = sum(x["g"] for x in xs)
    if not g:
        return None
    return {"gosterim": g, "tik": sum(x["t"] for x in xs), "sira": round(sum(x["p"] for x in xs) / g, 1),
            "son": max(x["son"] for x in xs)}


def bakiye():
    try:
        return round(istek("appendix/user_data")["tasks"][0]["result"][0]["money"]["balance"], 2)
    except Exception:
        return None


def olc(kelimeler, liste, etiket, a):
    """Kelimeleri ölçer, Search Console sütununu ekler. Döner: (sonuçlar, maliyet, GSC dönemi | None)"""
    sonuclar = [{"pazar": k["pazar"], "grup": k["grup"], "kelime": k["kelime"], "hacim": k.get("hacim")}
                for k in kelimeler]
    gorevler = [gorev(k, liste, "siralama:%s:%d" % (etiket, i)) for i, k in enumerate(kelimeler)]
    ekler = {}  # sıra no → ek konum görevinin sırası
    for i, k in enumerate(kelimeler):
        ek_konum = liste["pazarlar"][k["pazar"]].get("ek_konum")
        if ek_konum:
            ekler[i] = len(gorevler)
            gorevler.append(gorev(k, liste, "siralama:%s:%d" % (etiket, len(gorevler)), ek_konum))
    print("%d kelime, %d görev ölçülüyor (%s)..." % (
        len(kelimeler), len(gorevler), "canlı" if a.canli else "standart kuyruk"), flush=True)
    if a.canli:
        yanitlar, maliyet = olc_canli(gorevler)
        gelen = dict(enumerate(yanitlar))
    else:
        gelen, maliyet = olc_standart(gorevler, a.bekle)
    for no, x in enumerate(sonuclar):
        ana = coz(gelen[no], liste["alan"])
        if no in ekler:
            birlestir(x, ana, coz(gelen[ekler[no]], liste["alan"]))
        else:
            x.update(ana)
    gsc, donem = gsc_verisi(liste)
    if gsc is None:
        print("  " + donem)
        return sonuclar, maliyet, None
    for x in sonuclar:
        g = gsc_satiri(gsc, x["kelime"], liste["pazarlar"][x["pazar"]])
        if g:
            x["gsc"] = g
    return sonuclar, maliyet, donem


def json_yaz(yol, kayit):
    """Sonuçlar satır satır: git farkında hangi kelimenin değiştiği okunsun."""
    parca = []
    for k, v in kayit.items():
        if isinstance(v, list) and v and isinstance(v[0], dict):
            ic = ",\n".join("    " + json.dumps(x, ensure_ascii=False) for x in v)
            parca.append("  %s: [\n%s\n  ]" % (json.dumps(k), ic))
        else:
            parca.append("  %s: %s" % (json.dumps(k), json.dumps(v, ensure_ascii=False)))
    os.makedirs(os.path.dirname(yol), exist_ok=True)
    io.open(yol, "w", encoding="utf-8", newline="\n").write("{\n" + ",\n".join(parca) + "\n}\n")


def kayit_dosyalari():
    return sorted(glob.glob(os.path.join(KAYITLAR, "????-??-??.json")))


# ---------------------------------------------------------------- rapor

def uzun_tarih(iso):
    d = datetime.date.fromisoformat(iso)
    return "%d %s %d" % (d.day, AYLAR[d.month - 1], d.year)


def kisa_tarih(iso):
    d = datetime.date.fromisoformat(iso)
    return "%d %s" % (d.day, AYLAR[d.month - 1][:3])


def virgul(x, basamak=1):
    return ("%.*f" % (basamak, x)).replace(".", ",")


def sira_yazi(x, derinlik):
    if x.get("hata"):
        return "hata"
    if x.get("sira"):
        return str(x["sira"])
    return "yok (ilk %d)" % (x.get("organik") or derinlik)


def degisim(x, o):
    """(yazı, sayı) — sayı pozitifse yükseldi. Önceki ölçümde yoksa ("", None)."""
    if o is None or x.get("hata") or o.get("hata"):
        return "", None
    a, b = o.get("sira"), x.get("sira")
    if a == b:
        return "=", 0
    if a is None:
        return "girdi", 100
    if b is None:
        return "çıktı", -100
    return ("▲%d" % (a - b), a - b) if a > b else ("▼%d" % (b - a), a - b)


def sayfa_yolu(url):
    if not url:
        return ""
    return urllib.parse.unquote(urllib.parse.urlsplit(url).path) or "/"


def birinci(x, alan):
    if not x.get("ilk5"):
        return ""
    d = x["ilk5"][0][0] or ""
    return "**biz**" if alan_mi(d, alan) else d.removeprefix("www.")


def gsc_yazi(g, donem):
    if not g:
        return "—"
    y = "%d · %s" % (g["gosterim"], virgul(g["sira"]))
    # Son günlerde hiç görünmediyse söyle: sıra düşmüş olabilir
    if donem and g.get("son") and g["son"] < (datetime.date.fromisoformat(donem[1])
                                               - datetime.timedelta(days=3)).isoformat():
        y += " · son %s" % kisa_tarih(g["son"])
    return y


def talep_ayir(kayit, liste):
    """Talep kelimeleri ve "talep": false işaretli olanlar (marka, hesaplayıcı) ayrı raporlanır."""
    disari = {(k["pazar"], k["kelime"]) for k in liste["kelimeler"] if k.get("talep") is False}
    xs = kayit["sonuclar"]
    return ([x for x in xs if (x["pazar"], x["kelime"]) not in disari],
            [x for x in xs if (x["pazar"], x["kelime"]) in disari])


def konum_yazi(x, liste):
    """İki konumdan ölçülen satırda konumlar farklı çıktıysa ikisini de göster."""
    k = x.get("konumlar")
    if not k or k[0] == k[1]:
        return ""
    adlar = liste["pazarlar"][x["pazar"]].get("konum_adlari") or ["1", "2"]
    return " (%s)" % " · ".join("%s %s" % (ad, "yok" if s is None else s) for ad, s in zip(adlar, k))


def tablo_satiri(x, o, der, alan, donem, liste, on=()):
    s = sira_yazi(x, der)
    if x.get("sira") and x["sira"] <= 10:
        s = "**%s**" % s
    s += konum_yazi(x, liste)
    return "| %s |" % " | ".join(list(on) + [
        x["kelime"], x["grup"], str(x.get("hacim") or "—"), s,
        sira_yazi(o, der) if o else "—", degisim(x, o)[0],
        sayfa_yolu(x.get("url")), "▶" if x.get("video") else "", birinci(x, alan), gsc_yazi(x.get("gsc"), donem)])


def hacme_gore(x):
    return -(x.get("hacim") or 0), x["kelime"]


def rapor(kayit, onceki, liste):
    der, alan, donem = kayit["derinlik"], liste["alan"], kayit.get("gsc_donem")
    once = {(x["pazar"], x["kelime"]): x for x in (onceki or {}).get("sonuclar", [])}
    xs, diger = talep_ayir(kayit, liste)
    L = ["# Google sıralama durumu — %s" % uzun_tarih(kayit["tarih"]), ""]
    L.append("Google **masaüstü**, ilk %d organik sonuç · %d kelime · ölçüm saati %s · maliyet %s $%s" % (
        der, len(kayit["sonuclar"]), kayit.get("saat", "?"), virgul(kayit["maliyet_usd"], 3),
        " · kalan bakiye %s $" % virgul(kayit["bakiye_usd"], 2) if kayit.get("bakiye_usd") is not None else ""))
    L.append("")
    L.append("Karşılaştırma: " + ("%s ölçümü" % uzun_tarih(onceki["tarih"]) if onceki
                                  else "yok — bu ilk ölçüm"))
    if donem:
        L += ["", "GSC sütunu: aynı sorgu Search Console'da, %s → %s, tüm cihazlar — gösterim · ortalama "
                  "konum. Sıra sütunuyla aynı şey değildir. \"son\" yazıyorsa o tarihten beri hiç "
                  "gösterim yok." % (kisa_tarih(donem[0]), kisa_tarih(donem[1]))]
    L += ["", "## Özet", "",
          "| pazar | kelime | 1–3 | 4–10 | 11–20 | 21–%d | bulunamadı | video kutusunda | yükselen | düşen |" % der,
          "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|"]
    bantlar = [(1, 3), (4, 10), (11, 20), (21, der)]

    def ozet_satiri(ad, grup):
        olculen = [x for x in grup if not x.get("hata")]
        say = [sum(1 for x in olculen if x.get("sira") and a <= x["sira"] <= b) for a, b in bantlar]
        yok = sum(1 for x in olculen if not x.get("sira"))
        farklar = [degisim(x, once.get((x["pazar"], x["kelime"])))[1] for x in grup]
        yuk = sum(1 for f in farklar if f and f > 0) if onceki else "—"
        dus = sum(1 for f in farklar if f and f < 0) if onceki else "—"
        video = sum(1 for x in olculen if x.get("video"))
        return "| %s | %d | %s | %d | %d | %s | %s |" % (
            ad, len(grup), " | ".join(str(n) for n in say), yok, video, yuk, dus)

    for pk, p in liste["pazarlar"].items():
        grup = [x for x in xs if x["pazar"] == pk]
        if grup:
            L.append(ozet_satiri(p["ad"], grup))
    L.append(ozet_satiri("**toplam**", xs))
    if diger:
        L += ["", "Marka ve hesaplayıcı kelimeleri özete girmez (teklif getirmezler); en alttaki ayrı tabloda."]

    if onceki:
        hareket = []
        for x in xs + diger:
            yazi, f = degisim(x, once.get((x["pazar"], x["kelime"])))
            if f is not None and abs(f) >= 3:
                hareket.append((abs(f), x, yazi))
        L += ["", "## Hareketler (3 sıra ve üstü)", ""]
        if hareket:
            L += ["| kelime | pazar | önceki | şimdi | değişim |", "|---|---|---:|---:|---|"]
            for _, x, yazi in sorted(hareket, key=lambda h: -h[0]):
                o = once[(x["pazar"], x["kelime"])]
                L.append("| %s | %s | %s | %s | %s |" % (x["kelime"], liste["pazarlar"][x["pazar"]]["ad"],
                                                        sira_yazi(o, der), sira_yazi(x, der), yazi))
        else:
            L.append("3 sıradan büyük hareket yok.")

    esik = [x for x in xs if x.get("sira") and 11 <= x["sira"] <= 20]
    L += ["", "## İlk sayfanın eşiğinde (11–20)", ""]
    if esik:
        L += ["| kelime | pazar | hacim/ay | sıra | sayfa |", "|---|---|---:|---:|---|"]
        for x in sorted(esik, key=lambda x: (-(x.get("hacim") or 0), x["sira"])):
            L.append("| %s | %s | %s | %d | %s |" % (x["kelime"], liste["pazarlar"][x["pazar"]]["ad"],
                                                    x.get("hacim") or "—", x["sira"], sayfa_yolu(x.get("url"))))
    else:
        L.append("Bu aralıkta kelime yok.")

    baslik = "| kelime | grup | hacim/ay | sıra | önceki | değişim | sıralanan sayfa | video | 1. sırada | GSC 28 gün |"
    for pk, p in liste["pazarlar"].items():
        grup = [x for x in xs if x["pazar"] == pk]
        if not grup:
            continue
        L += ["", "## %s" % p["ad"], "", baslik, "|---|---|---:|---:|---:|---|---|:-:|---|---|"]
        for x in sorted(grup, key=hacme_gore):
            L.append(tablo_satiri(x, once.get((x["pazar"], x["kelime"])), der, alan, donem, liste))
    if diger:
        L += ["", "## Marka ve hesaplayıcılar — talep değil", "",
              "Marka aramasında ilk sıra korunmalı. Hesaplayıcılar teklif getirmez; link ve otorite "
              "için izleniyor.", "", "| pazar " + baslik, "|---|---|---|---:|---:|---:|---|---|:-:|---|---|"]
        for x in sorted(diger, key=hacme_gore):
            L.append(tablo_satiri(x, once.get((x["pazar"], x["kelime"])), der, alan, donem, liste,
                                  on=[liste["pazarlar"][x["pazar"]]["ad"]]))
    L += ["", "---", "",
          "**Sıra:** Google masaüstü sonucunda organik sonuçlar içindeki yerimiz; reklam, harita ve video "
          "kutusu sayılmaz. **▶ / video kutusunda:** Google'ın video kutusunda YouTube kanalımızdan bir video var "
          "(site sonuçlarda olmasa bile). **yok (ilk N):** Google o aramada N sonuç verdi, aralarında yokuz. Kendi "
          "tarayıcında kişiselleştirme yüzünden birkaç sıra farklı görebilirsin; her satırın doğrulama "
          "bağlantısı kayıt dosyasında (`kontrol`). **Türkiye iki yerden ölçülür**, ülke geneli ve İstanbul "
          "(TR organik ziyaretin ~%60'ı): sıra ikisinin iyisidir, farklıysa parantezde ikisi de yazar. Tek "
          "konum iki kelimede Search Console'la çelişti. Rusça, Google Rusya ölçülemediği için Kazakistan'dan.", ""]
    return "\n".join(L)


def konsol(kayit, onceki, liste):
    der = kayit["derinlik"]
    once = {(x["pazar"], x["kelime"]): x for x in (onceki or {}).get("sonuclar", [])}
    print("\n%s %s · %d kelime · maliyet %.3f $ · bakiye %s $ · karşılaştırma: %s" % (
        kayit["tarih"], kayit.get("saat", ""), len(kayit["sonuclar"]), kayit["maliyet_usd"],
        kayit.get("bakiye_usd"), onceki["tarih"] if onceki else "yok (ilk ölçüm)"))
    xs, diger = talep_ayir(kayit, liste)
    bolumler = [(p["ad"], [x for x in xs if x["pazar"] == pk]) for pk, p in liste["pazarlar"].items()]
    for ad, grup in bolumler + [("Marka ve hesaplayıcılar (talep değil)", diger)]:
        if not grup:
            continue
        print("\n## %s" % ad)
        for x in sorted(grup, key=hacme_gore):
            o = once.get((x["pazar"], x["kelime"]))
            print("  %12s %-6s %-3s %-38s %5s/ay %s %-36s 1.: %s%s" % (
                sira_yazi(x, der), degisim(x, o)[0], x["pazar"], x["kelime"][:38], x.get("hacim") or "—",
                "▶" if x.get("video") else " ", sayfa_yolu(x.get("url"))[:36],
                birinci(x, liste["alan"]).replace("*", ""), konum_yazi(x, liste)))


def main():
    ap = argparse.ArgumentParser(description="Google sıralama takibi (DataForSEO)")
    ap.add_argument("--canli", action="store_true", help="hepsi canlı uçtan: hızlı, 3,3 kat pahalı")
    ap.add_argument("--pazar", help="yalnızca bu pazarlar, virgülle")
    ap.add_argument("--eksik", action="store_true", help="bugünün kaydında olmayan kelimeleri ölç, ekle")
    ap.add_argument("--rapor", action="store_true", help="son kaydı yeniden raporla")
    ap.add_argument("--kuru", action="store_true", help="maliyet tahmini, API çağrısı yok")
    ap.add_argument("--bekle", type=int, default=10, help="standart kuyrukta en çok kaç dakika beklensin")
    a = ap.parse_args()
    liste = oku(LISTE)
    tarih = datetime.date.today().isoformat()
    bugun = os.path.join(KAYITLAR, tarih + ".json")
    dosyalar = kayit_dosyalari()
    kelimeler = liste["kelimeler"]
    if a.pazar:
        secili = set(a.pazar.split(","))
        kelimeler = [k for k in kelimeler if k["pazar"] in secili]

    if a.kuru:
        mod = "canli" if a.canli else "standart"
        sayfa = math.ceil(liste["derinlik"] / 10)
        gorev_sayisi = sum(2 if liste["pazarlar"][k["pazar"]].get("ek_konum") else 1 for k in kelimeler)
        print("%d kelime, %d görev × %d sayfa × %s $ = ~%.3f $ (%s)" % (
            len(kelimeler), gorev_sayisi, sayfa, SAYFA_UCRETI[mod], gorev_sayisi * sayfa * SAYFA_UCRETI[mod], mod))
        return

    kaydedildi = False
    if a.rapor:
        if not dosyalar:
            raise SystemExit("Kayıt yok.")
        kayit = oku(dosyalar[-1])
        onceki = oku(dosyalar[-2]) if len(dosyalar) > 1 else None
        kaydedildi = True
    else:
        eski = [d for d in dosyalar if os.path.basename(d) < tarih + ".json"]
        onceki = oku(eski[-1]) if eski else None
        var = oku(bugun) if os.path.exists(bugun) else None
        if a.eksik:
            if not var:
                raise SystemExit("Bugün ölçüm yok; önce seçeneksiz çalıştır.")
            olculmus = {(x["pazar"], x["kelime"]) for x in var["sonuclar"]}
            kelimeler = [k for k in kelimeler if (k["pazar"], k["kelime"]) not in olculmus]
            if not kelimeler:
                raise SystemExit("Bugünün kaydında eksik kelime yok.")
        t0 = time.time()
        sonuclar, maliyet, donem = olc(kelimeler, liste, tarih, a)
        if (a.pazar or a.eksik) and var:
            # Bugünün kaydına işle: aynı kelimenin eski satırı yenisiyle değişir
            yeni = {(x["pazar"], x["kelime"]) for x in sonuclar}
            var["sonuclar"] = [x for x in var["sonuclar"] if (x["pazar"], x["kelime"]) not in yeni] + sonuclar
            var["maliyet_usd"] = round(var["maliyet_usd"] + maliyet, 4)
            var["bakiye_usd"] = bakiye()
            var["gsc_donem"] = donem or var.get("gsc_donem")
            kayit = var
        else:
            kayit = {"tarih": tarih, "saat": datetime.datetime.now().strftime("%H:%M"),
                     "mod": "canli" if a.canli else "standart", "cihaz": liste["cihaz"],
                     "derinlik": liste["derinlik"], "maliyet_usd": round(maliyet, 4), "bakiye_usd": bakiye(),
                     "sure_sn": round(time.time() - t0), "gsc_donem": donem, "sonuclar": sonuclar}
        # Tek pazar denemesi, günün tam kaydının yerine geçmesin
        if var or not a.pazar:
            json_yaz(bugun, kayit)
            kaydedildi = True

    # Listeden çıkarılan kelimeler rapora girmez (kayıtta verisi durur)
    aktif = {(k["pazar"], k["kelime"]) for k in liste["kelimeler"]}
    gorunen = dict(kayit, sonuclar=[x for x in kayit["sonuclar"] if (x["pazar"], x["kelime"]) in aktif])
    konsol(gorunen, onceki, liste)
    if kaydedildi:
        io.open(RAPOR, "w", encoding="utf-8", newline="\n").write(rapor(gorunen, onceki, liste))
        print("\nRapor: %s" % os.path.relpath(RAPOR, KOK))


if __name__ == "__main__":
    main()
