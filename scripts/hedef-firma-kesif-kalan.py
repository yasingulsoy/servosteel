# Kesif turunun adaylarini (SERP onbelleginden) aday basina AYRI SURECTE, sure siniriyla dogrular.
# kullanim: python scripts/hedef-firma-kesif-kalan.py TARIH TUR   (ornek: 2026-10-09 r)
#   KESIF_ES=10  ayni anda kac aday (varsayilan 8)
# Her sonuc hemen kesif/dogrulama-<tarih>-<tur>.jsonl'a eklenir; yarida kalirsa kaldigi yerden
# devam eder. Bittikten sonra `hedef-firma-kesif.py --tur TUR --tarih TARIH` sifir aday bulur,
# yalniz siki/ince suzgeci uygulayip .md'yi yazar. Adaylar ana betikteki kuralla secilir
# (kara liste, makine basligi, zaten listede olan alan adi).
import importlib.util, io, json, os, subprocess, sys, threading
from concurrent.futures import ThreadPoolExecutor

BURASI = os.path.dirname(os.path.abspath(__file__))
os.chdir(os.path.dirname(BURASI))
TARIH, TUR = sys.argv[1], sys.argv[2]
sys.argv = ["x"]
spec = importlib.util.spec_from_file_location("kesif", os.path.join(BURASI, "hedef-firma-kesif.py"))
k = importlib.util.module_from_spec(spec)
spec.loader.exec_module(k)

ulkeler, _, ek = k.tur_tanimi(TUR)
serp = json.load(io.open(os.path.join(k.KESIF, "serp-%s%s.json" % (TARIH, ek)), encoding="utf-8"))["aramalar"]
ulke = {iso: (ad, tel) for ad, iso, _, tel, _ in ulkeler}
yol = os.path.join(k.KLASOR, "bolge-kesif-%s%s.md" % (TARIH, ek))
bilinen = k.bilinen_alanlar(haric=yol)
adaylar = {}
for s in serp:
    for r in s["sonuclar"]:
        alan = k.B.url_alani(r.get("url") or "")
        if not alan or k.KARA_LISTE.search(r.get("domain") or "") or k.KARA_LISTE.search(alan):
            continue
        if k.MAKINE.search(r.get("title") or "") or alan in bilinen:
            continue
        anahtar = (alan, s["iso"], s["seg"])
        if anahtar not in adaylar:
            ad, tel = ulke[s["iso"]]
            adaylar[anahtar] = {"alan": alan, "domain": r.get("domain") or alan, "iso": s["iso"], "ulke": ad,
                                "tel": tel, "seg": s["seg"], "url": r["url"], "title": r.get("title") or "",
                                "description": r.get("description") or ""}
ara = os.path.join(k.KESIF, "dogrulama-%s%s.jsonl" % (TARIH, ek))
bitmis = {tuple(json.loads(l)["anahtar"]) for l in io.open(ara, encoding="utf-8")} if os.path.exists(ara) else set()
kalan = [x for a, x in adaylar.items() if a not in bitmis]
print("kalan aday:", len(kalan), flush=True)

TEK = os.path.join(BURASI, "hedef-firma-kesif-tek.py")
f_ara = io.open(ara, "a", encoding="utf-8")
kilit = threading.Lock()


def dogrula(x):
    anahtar = [x["alan"], x["iso"], x["seg"]]
    try:
        p = subprocess.run([sys.executable, TEK], input=json.dumps(x, ensure_ascii=False).encode("utf-8"),
                           capture_output=True, timeout=120)
        if p.stdout.strip():
            satir, n = json.loads(p.stdout.rsplit(b"\n", 1)[-1].decode("utf-8"))
        else:
            satir, n = None, "hata: " + p.stderr.decode("utf-8", "replace")[-80:]
    except subprocess.TimeoutExpired:
        satir, n = None, "zaman asimi (sayfa 120 sn icinde islenemedi)"
    with kilit:
        f_ara.write(json.dumps({"anahtar": anahtar, "satir": satir, "neden": n}, ensure_ascii=False) + "\n")
        f_ara.flush()
        print("  ", x["alan"], "->", "gecti" if satir else n, flush=True)


with ThreadPoolExecutor(int(os.environ.get("KESIF_ES", "8"))) as h:
    list(h.map(dogrula, kalan))
f_ara.close()
print("bitti", flush=True)
os._exit(0)
