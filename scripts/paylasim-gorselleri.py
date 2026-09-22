# -*- coding: utf-8 -*-
"""Sosyal paylasim gorselleri: public/gorseller/{slug}.jpg -> public/paylasim/{slug}.jpg

  python scripts/paylasim-gorselleri.py

Neden ayri kopya: site fotograflari 340-780 KB ve degisik oranlarda. LinkedIn ve
WhatsApp onizlemesi 1200x630 bekliyor; WhatsApp buyuk dosyalarda onizlemeyi bazen
hic gostermiyor. Kaynak fotograflar DEGISMEZ, yalnizca kucuk kopya uretilir.

Oran 1,7-2,1 arasindaysa kirpilir (770x414 zaten 1,86 — kayip yok), daha kare ya da
dik olanlar beyaz zemine oturtulur (makine kesilmesin).
"""
import io, os, sys

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KAYNAK = os.path.join(KOK, "public", "gorseller")
HEDEF = os.path.join(KOK, "public", "paylasim")
W, H, KALITE = 1200, 630, 80


def uret(im):
    oran = im.width / im.height
    if 1.7 <= oran <= 2.1:
        hedef = W / H
        if oran > hedef:
            yw = int(im.height * hedef)
            im = im.crop(((im.width - yw) // 2, 0, (im.width - yw) // 2 + yw, im.height))
        else:
            yh = int(im.width / hedef)
            im = im.crop((0, (im.height - yh) // 2, im.width, (im.height - yh) // 2 + yh))
        return im.resize((W, H), Image.LANCZOS)
    kopya = im.copy()
    kopya.thumbnail((W, H), Image.LANCZOS)
    zemin = Image.new("RGB", (W, H), "white")
    zemin.paste(kopya, ((W - kopya.width) // 2, (H - kopya.height) // 2))
    return zemin


os.makedirs(HEDEF, exist_ok=True)
toplam = 0
for ad in sorted(os.listdir(KAYNAK)):
    if not ad.endswith(".jpg"):
        continue
    im = Image.open(os.path.join(KAYNAK, ad)).convert("RGB")
    tampon = io.BytesIO()
    uret(im).save(tampon, "JPEG", quality=KALITE, optimize=True, progressive=False)
    veri = tampon.getvalue()
    open(os.path.join(HEDEF, ad), "wb").write(veri)
    toplam += len(veri)
    print("%-32s %6.1f KB  (kaynak %6.1f KB, %dx%d)" % (
        ad, len(veri) / 1024, os.path.getsize(os.path.join(KAYNAK, ad)) / 1024, im.width, im.height))
print("toplam %.1f KB" % (toplam / 1024))
