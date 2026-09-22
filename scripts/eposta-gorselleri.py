# -*- coding: utf-8 -*-
"""Tanitim e-postasindaki urun kucuk resimleri: public/gorseller/{slug}.jpg -> public/eposta/{slug}.jpg

  python scripts/eposta-gorselleri.py

Kaynak fotograflar sitenin kendi urun gorselleri (eski siteden alinan gercek
makine fotograflari); ONLAR DEGISMEZ, yalnizca e-posta icin kucuk kopya uretilir
(Yasin 2026-09-22: "makine urun gorselleri koysak, ufaltip"). 336x252 (4:3),
e-postada 176x132 gosterilir — keskin ekranda ~1,9 kat cozunurluk. JPEG, satir
satir (progressive degil: eski Outlook surumleri icin), meta veri yok.

Iletiye gomulu (cid) gidiyor, uzak adres degil: bkz. src/lib/eposta-sablon.ts.
logo.png = imza logosunun AYNI baytlari (src/lib/eposta-logo.ts) — panel
onizlemesi ve Giden sayfasi bu adresten gosterir.
"""
import base64, io, os, re, sys

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KAYNAK = os.path.join(KOK, "public", "gorseller")
HEDEF = os.path.join(KOK, "public", "eposta")
W, H, KALITE = 336, 252, 68

# Beyaz zeminde tek urun: kirpilmaz, 4:3 cercevenin icine oturtulur (ust kolu kesilmesin)
SIGDIR = {"rulo-acicilar"}
SLUGLAR = [
    "kablo-kanali", "solar-profil", "agir-raf", "iskele-kalas", "yol-bariyeri", "gurultu-bariyeri",
    "c-sigma-omega", "dilme-hatlari", "boy-kesme-hatlari", "rulo-acicilar", "servo-suruculer",
    "dogrultmali-servo-suruculer", "kompakt-hatlar", "otomatik-istifleyici", "tesis-uretim",
]


def kapla(im):
    """4:3 kapla: genis gorselde yanlar, kare/uzunda ust-alt esit kirpilir."""
    oran = W / H
    w, h = im.size
    if w / h > oran:
        yw = int(h * oran)
        x = (w - yw) // 2
        return im.crop((x, 0, x + yw, h)).resize((W, H), Image.LANCZOS)
    yh = int(w / oran)
    y = (h - yh) // 2
    return im.crop((0, y, w, y + yh)).resize((W, H), Image.LANCZOS)


def sigdir(im):
    kopya = im.copy()
    kopya.thumbnail((W, H), Image.LANCZOS)
    zemin = Image.new("RGB", (W, H), "white")
    zemin.paste(kopya, ((W - kopya.width) // 2, (H - kopya.height) // 2))
    return zemin


os.makedirs(HEDEF, exist_ok=True)
toplam = 0
for slug in SLUGLAR:
    im = Image.open(os.path.join(KAYNAK, slug + ".jpg")).convert("RGB")
    k = sigdir(im) if slug in SIGDIR else kapla(im)
    tampon = io.BytesIO()
    k.save(tampon, "JPEG", quality=KALITE, optimize=True, progressive=False)
    veri = tampon.getvalue()
    open(os.path.join(HEDEF, slug + ".jpg"), "wb").write(veri)
    toplam += len(veri)
    print("%-30s %5.1f KB" % (slug, len(veri) / 1024))

kod = io.open(os.path.join(KOK, "src", "lib", "eposta-logo.ts"), encoding="utf-8").read()
govde = kod[kod.index("LOGO_PNG_BASE64 ="):].split(";")[0]
logo = base64.b64decode("".join(re.findall(r'"([^"]*)"', govde)))
open(os.path.join(HEDEF, "logo.png"), "wb").write(logo)
print("%-30s %5.1f KB" % ("logo.png", len(logo) / 1024))
print("urun gorselleri toplam %.1f KB (%d dosya)" % (toplam / 1024, len(SLUGLAR)))
