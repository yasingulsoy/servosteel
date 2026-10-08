# Tek adayi dogrular: stdin'den aday (JSON), stdout'a [satir, neden] (JSON).
# hedef-firma-kesif-kalan.py her aday icin bunu AYRI SURECTE calistirir: bir sitenin sayfasi
# Python regex'inde GIL'i tutup sureci kilitleyebiliyor (M turu, 2026-10-08); is parcacigi
# zaman asimi o zaman ise yaramiyor, ayri surec oldurulebiliyor.
import importlib.util, json, os, sys

BURASI = os.path.dirname(os.path.abspath(__file__))
os.chdir(os.path.dirname(BURASI))
sys.argv = ["x"]
spec = importlib.util.spec_from_file_location("kesif", os.path.join(BURASI, "hedef-firma-kesif.py"))
k = importlib.util.module_from_spec(spec)
spec.loader.exec_module(k)
x = json.loads(sys.stdin.buffer.read().decode("utf-8"))
r = k.parca_isle([x])
_, satir, n = r[0] if r else (None, None, "sonuc yok")
sys.stdout.buffer.write(json.dumps([satir, n], ensure_ascii=False).encode("utf-8"))
sys.stdout.flush()
os._exit(0)
