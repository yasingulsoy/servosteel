# -*- coding: utf-8 -*-
"""seo/hedef-firmalar/*.md icindeki dogrulanmis firma tablolarini tek Excel'e cevirir.

  python scripts/hedef-firma-excel.py

Cikti: seo/hedef-firmalar/Servosteel-Hedef-Firmalar.xlsx

Her segment bir sayfa; bastaki "TUM FIRMALAR" sayfasi hepsini birlestirir.
Calisma dosyasi oldugu icin her satira Durum / Gonderim / Yanit / Not sutunlari
eklenir — liste okunacak degil, uzerinde calisilacak.

Tablolar farkli ajanlardan geldigi icin BASLIKLAR NORMALLESTIRILIR: "Company",
"Firma", "Company Name" hepsi tek sutuna oturur. Taninmayan sutun atilmaz,
sona eklenir — veri kaybetmektense fazladan sutun iyidir.
"""
import io
import os
import re
import sys
import unicodedata
from datetime import date

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KLASOR = os.path.join(KOK, "seo", "hedef-firmalar")
CIKTI = os.path.join(KLASOR, "Servosteel-Hedef-Firmalar.xlsx")

ADLAR = {
    "kablo-kanali": "Kablo Kanalı",
    "solar-profil": "Solar Profil",
    "celik-servis-merkezi": "Çelik Servis Merkezi",
    "yol-bariyeri": "Yol Bariyeri",
    "raf-sistemleri": "Raf Sistemleri",
    "alcipan-profili": "Alçıpan Profili",
    "cati-cephe-paneli": "Çatı ve Cephe Paneli",
    "pres-atolyeleri": "Pres Atölyeleri",
}

# Kanonik sutunlar ve onlara isaret eden kaliplar (once eslesen kazanir)
SEMA = [
    ("Firma",              r"^(firma|company|company name|şirket|sirket|name)$"),
    ("Ülke",               r"^(ülke|ulke|country|location)$"),
    ("Web sitesi",         r"^(web sitesi|website|web site|site|url|web)$"),
    ("Doğrulama sayfası",  r"(doğrulama|dogrulama|verification|evidence|kanıt|kanit|proof)"),
    ("Ne üretiyor",        r"(ne üretiyor|ne uretiyor|what|ürün|urun|product|note|not|açıklama|aciklama|size|büyüklük)"),
    ("E-posta / İletişim", r"(e-?posta|e-?mail|mail|iletişim|iletisim|contact)"),
]
TAKIP = ["Durum", "Gönderim tarihi", "Yanıt", "Not"]

# Ulke sutunu suzgecle kullanilacak; ajanlar "BAE", "Birleşik Arap Emirlikleri",
# "BAE (Dubai/Ajman)" diye uc ayri deger yaziyor ve suzgec bolunuyor.
# Once parantezli sehir bilgisi atilir, sonra ad tek yazima cekilir.
ULKE_ESI = {
    "bae": "BAE", "birleşik arap emirlikleri": "BAE", "uae": "BAE",
    "birlesik arap emirlikleri": "BAE", "united arab emirates": "BAE",
    "suudi arabistan": "Suudi Arabistan", "saudi arabia": "Suudi Arabistan",
    "hindistan": "Hindistan", "india": "Hindistan",
    "polonya": "Polonya", "poland": "Polonya",
    "italya": "İtalya", "i̇talya": "İtalya", "italy": "İtalya",
    "ispanya": "İspanya", "i̇spanya": "İspanya", "spain": "İspanya",
    "mısır": "Mısır", "misir": "Mısır", "egypt": "Mısır",
    "fas": "Fas", "morocco": "Fas", "maroc": "Fas",
    "birleşik krallık": "Birleşik Krallık", "birlesik krallik": "Birleşik Krallık",
    "uk": "Birleşik Krallık", "united kingdom": "Birleşik Krallık",
    "ingiltere": "Birleşik Krallık", "i̇ngiltere": "Birleşik Krallık",
    "abd": "ABD", "usa": "ABD", "amerika": "ABD", "united states": "ABD",
    "almanya": "Almanya", "germany": "Almanya",
    "romanya": "Romanya", "romania": "Romanya",
    "brezilya": "Brezilya", "brazil": "Brezilya",
    "kolombiya": "Kolombiya", "colombia": "Kolombiya",
    "meksika": "Meksika", "mexico": "Meksika",
    "güney afrika": "Güney Afrika", "guney afrika": "Güney Afrika",
    "south africa": "Güney Afrika",
    "endonezya": "Endonezya", "indonesia": "Endonezya",
    "kenya": "Kenya", "vietnam": "Vietnam", "litvanya": "Litvanya",
    "lithuania": "Litvanya", "özbekistan": "Özbekistan", "ozbekistan": "Özbekistan",
    "uzbekistan": "Özbekistan", "türkiye": "Türkiye", "turkiye": "Türkiye",
    "turkey": "Türkiye", "nijerya": "Nijerya", "nigeria": "Nijerya",
    "kazakistan": "Kazakistan", "kazakhstan": "Kazakistan",
    "çekya": "Çekya", "cekya": "Çekya", "czechia": "Çekya",
    "portekiz": "Portekiz", "portugal": "Portekiz",
    "malezya": "Malezya", "malaysia": "Malezya",
    "tayland": "Tayland", "thailand": "Tayland",
    "filipinler": "Filipinler", "philippines": "Filipinler",
    "katar": "Katar", "qatar": "Katar", "irak": "Irak", "iraq": "Irak",
    "peru": "Peru", "şili": "Şili", "sili": "Şili", "chile": "Şili",
    "gana": "Gana", "ghana": "Gana", "tanzanya": "Tanzanya",
    "azerbaycan": "Azerbaycan", "gürcistan": "Gürcistan",
}


# Ayni firmanin iki alan adi. Kanit: iki alan adindaki satirda da ayni tuzel kisi
# ("Dana Steel Processing Industry LLC") yaziyor.
ALAN_ESI = {"danagroups.com": "danasteeluae.com"}


def firma_anahtari(satir):
    """Tekillestirme anahtari: alan adi + ulke.

    Ad yetmez — "PRK Steel" ile "PRK Steel Products" ayni firma, iki satir
    kaliyordu. Alan adi da tek basina yetmez — NS BlueScope Endonezya ve
    Vietnam ayni alan adinda ama ayri tesis, ayri muhatap."""
    m = re.search(r"https?://(?:www\.)?([^/\s|]+)", str(satir[2] or "")) \
        or re.search(r"https?://(?:www\.)?([^/\s|]+)", str(satir[3] or ""))
    if not m:
        return "ad:" + sade(satir[0]) + "|" + sade(satir[1])
    alan = m.group(1).lower().rstrip(".")
    return ALAN_ESI.get(alan, alan) + "|" + sade(satir[1])


def ulke_duzelt(ham):
    """'BAE (Dubai/Ajman)' -> 'BAE'. Coklu ulke ise ilkini alir."""
    d = re.sub(r"\(.*?\)", " ", str(ham or ""))          # parantezli sehir bilgisi
    d = d.replace("*", "").strip(" .,")
    d = re.split(r"\s*(?:/|,|·|;| ve | and )\s*", d)[0].strip()
    return ULKE_ESI.get(sade(d), d)

BASLIK = PatternFill("solid", fgColor="1F2937")
BASLIK_YAZI = Font(bold=True, color="FFFFFF", size=11)
LINK = Font(color="0563C1", underline="single")
VURGU = PatternFill("solid", fgColor="FFF4CE")


def sade(s):
    s = unicodedata.normalize("NFKC", str(s or "")).strip().lower()
    return re.sub(r"\s+", " ", s.replace("*", "").replace("`", ""))


# Bu baslik gorulunce dosyanin geri kalani okunmaz — oradan sonrasi
# ELENEN firmalar. Onlari hedef listesine karistirmak listeyi coper.
DUR = re.compile(r"^#{1,6}\s*.*(elenen|reddedilen|rejected|excluded|dışarıda|disarida)",
                 re.I)


def markdown_tablosu(metin):
    """Dosyadaki TUM markdown tablolarini birlestirip (basliklar, satirlar) dondurur.

    Ajanlar tabloyu bazen ulke ulke boluyor ("## Hindistan (9 firma)" + tablo,
    "## Almanya (1 firma)" + tablo...). Tek tablo okumak sessizce veri kaybettirir:
    33 firmalik dosyadan 9 firma cikmisti. O yuzden hepsi taranir.
    "Elenenler" baslinda tarama durur.
    """
    satirlar = [s.rstrip() for s in metin.split("\n")]

    def hucreler(s):
        return [h.strip() for h in s.strip().strip("|").split("|")]

    def gereksiz(b):
        return sade(b) in ("#", "no", "sıra", "sira", "nr", "")

    basliklar, veri = [], []
    i = 0
    while i < len(satirlar):
        s = satirlar[i]
        if DUR.match(s.strip()):
            break
        if s.lstrip().startswith("|") and i + 1 < len(satirlar) \
           and re.match(r"^\s*\|[\s:|-]+\|\s*$", satirlar[i + 1]):
            ham = hucreler(s)
            tut = [k for k, b in enumerate(ham) if not gereksiz(b)]
            bu = [ham[k] for k in tut]
            if not basliklar:
                basliklar = bu
            j = i + 2
            while j < len(satirlar) and satirlar[j].lstrip().startswith("|"):
                h = hucreler(satirlar[j])
                satir = [(h[k] if k < len(h) else "") for k in tut]
                if any(x for x in satir):
                    # Basliklari ayni olmayan tabloyu kendi sirasina gore hizala
                    if bu != basliklar:
                        eslesme = {sade(b): d for b, d in zip(bu, satir)}
                        satir = [eslesme.get(sade(b), "") for b in basliklar]
                    veri.append((satir + [""] * len(basliklar))[: len(basliklar)])
                j += 1
            i = j
            continue
        i += 1
    return basliklar, veri


def esle(basliklar):
    """Gelen basliklari kanonik semaya oturtur. Doner: (kanonik_basliklar, indeksler)."""
    kalan = list(range(len(basliklar)))
    indeks = {}
    for kanonik, kalip in SEMA:
        for i in list(kalan):
            if re.search(kalip, sade(basliklar[i])):
                indeks[kanonik] = i
                kalan.remove(i)
                break
    cikti = [k for k, _ in SEMA]
    ek = [basliklar[i] for i in kalan]
    return cikti + ek, [indeks.get(k) for k, _ in SEMA] + kalan


def sayfa_yaz(ws, basliklar, satirlar, segment_sutunu=False):
    tum = basliklar + (["Segment"] if segment_sutunu else []) + TAKIP
    ws.append(tum)
    for h in ws[1]:
        h.fill, h.font = BASLIK, BASLIK_YAZI
        h.alignment = Alignment(vertical="center", horizontal="left")
    ws.row_dimensions[1].height = 24

    baglanti = [i for i, b in enumerate(tum)
                if re.search(r"site|url|sayfa|iletişim|e-posta", sade(b))]

    for satir in satirlar:
        ws.append(list(satir) + [""] * (len(tum) - len(satir)))
        n = ws.max_row
        for i in baglanti:
            h = ws.cell(row=n, column=i + 1)
            d = str(h.value or "").strip()
            m = re.search(r"https?://\S+", d)
            hedef = None
            if m:
                hedef = m.group(0).rstrip(").,;")
            elif re.fullmatch(r"[^@\s]+@[^@\s]+\.[A-Za-z]{2,}", d):
                hedef = "mailto:" + d
            if hedef and len(hedef) < 255:
                h.hyperlink, h.font = hedef, LINK
        # Takip sutunlarini goze carpar yap — doldurulacak alan orasi
        for k in range(len(TAKIP)):
            ws.cell(row=n, column=len(tum) - k).fill = VURGU

    for i, b in enumerate(tum, start=1):
        en = max([len(str(b))] + [len(str(ws.cell(row=r, column=i).value or ""))
                                  for r in range(2, ws.max_row + 1)] or [10])
        ws.column_dimensions[get_column_letter(i)].width = min(max(en + 2, 12), 48)
        if sade(b) in ("ne üretiyor", "doğrulama sayfası"):
            ws.column_dimensions[get_column_letter(i)].width = 46

    ws.freeze_panes = "B2"
    if ws.max_row > 1:
        t = Table(displayName="T" + re.sub(r"\W", "", ws.title)[:20] + str(ws.max_row),
                  ref="A1:%s%d" % (get_column_letter(len(tum)), ws.max_row))
        t.tableStyleInfo = TableStyleInfo(name="TableStyleLight9", showRowStripes=True)
        ws.add_table(t)


def main():
    if not os.path.isdir(KLASOR):
        sys.exit("[HATA] klasör yok: " + KLASOR)
    dosyalar = sorted(f for f in os.listdir(KLASOR) if f.endswith(".md"))
    if not dosyalar:
        sys.exit("[HATA] seo/hedef-firmalar içinde .md yok — araştırma henüz bitmemiş.")

    wb = Workbook()
    wb.remove(wb.active)
    ozet = wb.create_sheet("TÜM FİRMALAR")
    kanonik = [k for k, _ in SEMA]
    hepsi, kayit, gorulen = [], [], {}

    for dosya in dosyalar:
        anahtar = dosya[:-3]
        ad = ADLAR.get(anahtar, anahtar.replace("-", " ").title())
        basliklar, satirlar = markdown_tablosu(
            io.open(os.path.join(KLASOR, dosya), encoding="utf-8").read())
        if not satirlar:
            print("  [atlandı] %s — tablo bulunamadı" % dosya)
            continue
        yeni_basliklar, indeksler = esle(basliklar)
        duzgun = [[(satir[i] if i is not None and i < len(satir) else "") for i in indeksler]
                  for satir in satirlar]

        # Ulke sutununu tek yazima cek; icindeki sehir bilgisini "Ne üretiyor"a tasi
        # ki suzgec calissin ama bilgi kaybolmasin.
        for satir in duzgun:
            ham = str(satir[1] or "")
            temiz = ulke_duzelt(ham)
            if temiz != ham.strip():
                artik = re.sub(r"[*]", "", ham).replace(temiz, "").strip(" ()/,.·;")
                if artik and sade(artik) not in sade(satir[4]):
                    satir[4] = (artik + " — " + str(satir[4] or "")).strip(" —")
            satir[1] = temiz
        sayfa_yaz(wb.create_sheet(ad[:31]), yeni_basliklar, duzgun)

        for satir in duzgun:
            anahtar_firma = firma_anahtari(satir)
            if anahtar_firma in gorulen:
                if ad not in gorulen[anahtar_firma]:
                    gorulen[anahtar_firma].append(ad)
                continue
            gorulen[anahtar_firma] = [ad]
            hepsi.append((anahtar_firma,
                          [satir[i] if i < len(satir) else "" for i in range(len(kanonik))]))
        kayit.append((ad, len(satirlar)))
        print("  %s: %d firma" % (ad, len(satirlar)))

    if hepsi:
        # Iki segmentte cikan firma tek satir olur ama segmentlerin HEPSI yazilir:
        # kablo kanali + raf ureten firmaya iki hat birden teklif edilir.
        sayfa_yaz(ozet, kanonik,
                  [satir + [" + ".join(gorulen[k])] for k, satir in hepsi],
                  segment_sutunu=True)
    else:
        ozet.append(["Hiçbir dosyada tablo bulunamadı."])

    wb.move_sheet("TÜM FİRMALAR", offset=-len(wb.sheetnames) + 1)
    wb.save(CIKTI)

    cift = sum(1 for v in gorulen.values() if len(v) > 1)
    print("\n" + CIKTI)
    print("Toplam %d benzersiz firma, %d segment — %s" % (len(hepsi), len(kayit), date.today()))
    if cift:
        print("%d firma birden fazla segmentte çıktı, TÜM FİRMALAR sayfasında bir kez yazıldı." % cift)


if __name__ == "__main__":
    main()
