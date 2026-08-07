# -*- coding: utf-8 -*-
"""Deploy sonrasi canli regresyon kontrolu — bkz. KONTROL.md B.1.

Kullanim:  python scripts/canli-kontrol.py
Cikis 0 = 12 kontrol de gecti. Yeni kalici degisiklikler eklendikce buraya
yeni satir eklenir; gecici kontroller (o gunku deploy'a ozel) eklenmez.
"""
import sys, urllib.request, re
sys.stdout.reconfigure(encoding="utf-8")
B = "https://servosteel.com.tr"

def cek(yol):
    req = urllib.request.Request(B + yol, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, r.read().decode("utf-8", "replace")

KONTROL = [
    ("/akademi/roll-form-nedir", "yeni yazi 200", lambda s, h: s == 200),
    ("/akademi/roll-form-nedir", "yazi basligi", lambda s, h: "Roll Form Nedir" in h),
    ("/dilme-hatlari", "video bolumu (ytimg)", lambda s, h: "i.ytimg.com/vi/" in h),
    ("/dilme-hatlari", "VideoObject semasi", lambda s, h: '"VideoObject"' in h),
    ("/roll-form-hatlari/kablo-kanali", "video 1 adet", lambda s, h: h.count("i.ytimg.com/vi/") >= 1),
    ("/roll-form-hatlari/yol-bariyeri", "video YOK (durust eslesme)", lambda s, h: "i.ytimg.com/vi/" not in h),
    ("/roll-form-hatlari", "TR hub title", lambda s, h: "Rollform Makineleri ve Roll Form" in h),
    ("/en/roll-forming-lines", "EN manufacturer title", lambda s, h: "Roll Forming Machine Manufacturer" in h),
    ("/makineler/servo-suruculer", "servo metaTitle", lambda s, h: "Pres Besleme Sistemleri" in h),
    ("/roll-form-hatlari/trapez-cephe-paneli", "trapez yeni SSS", lambda s, h: "fiyatını ne belirler" in h),
    ("/en/roll-forming-lines/cable-tray", "EN kablo SSS", lambda s, h: "What is a cable tray roll forming machine" in h),
    ("/sitemap.xml", "sitemap yeni yazi", lambda s, h: "roll-form-nedir" in h),
]

hepsi = True
onceki = {}
for yol, ad, test in KONTROL:
    if yol not in onceki:
        try:
            onceki[yol] = cek(yol)
        except Exception as e:
            onceki[yol] = (0, f"HATA {e}")
    s, h = onceki[yol]
    ok = False
    try:
        ok = test(s, h)
    except Exception:
        pass
    if not ok: hepsi = False
    print(f"  {'OK ' if ok else 'YOK'}  {ad:<32} {yol}")
print("\nSONUC:", "HEPSI CANLIDA" if hepsi else "deploy henuz inmedi / eksik var")
sys.exit(0 if hepsi else 1)
