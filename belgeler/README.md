
# Belgeler

`Servosteel-Filiz-Hanim.docx` — Filiz Hanım'a giden doğrulama ve soru belgesi.
Kaynağı yanındaki `.docx.js` dosyası; içerik değişince onu düzenleyip
`node belgeler/Servosteel-Filiz-Hanim.docx.js` ile yeniden üretilir (docx npm paketi gerekir).
İçerik kaynakları: KONTROL.md bölüm A + oturum soru listesi.

`SERVOSTEEL-KATALOG.pdf` — 40 sayfalık ürün kataloğu, A4 yatay. **35,1 MB.**

Firmadan gelen özgün dosya **1.343,9 MB**'tı. Şişkinliğin sebebi içerik değildi:
40 sayfanın her birinde `/PieceInfo <</Illustrator …>>` duruyordu ve zincirin
ucunda **20.913 adet 64 KB'lık `AIPDFPrivateData` akışı = 1.307 MB** vardı —
Illustrator'ın "düzenleme yeteneklerini koru" seçeneğiyle PDF'in içine gömdüğü
düzenlenebilir .ai belgesi. Görüntülemede hiç kullanılmıyor. Gerçek fotoğraflar
toplam yalnızca ~30 MB.

Sayfalardan `/PieceInfo` silinip `garbage=1` ile kaydedildi. Doğrulama: 40
sayfanın her biri 100 dpi bitmap'e çizilip piksel özetleri karşılaştırıldı —
**farklı sayfa 0/40**, kayıp görsel 0, değişen görsel 0, metin özeti birebir
aynı (`b9fb47475d29`). Yani görünüm bit düzeyinde korundu.

Kaybedilen tek şey dosyayı Illustrator'da katmanlarıyla yeniden açabilmek;
tasarımcıdaki `.ai` kaynağı bunun için zaten var. Özgün 1,3 GB'lık dosya bu
depoya **girmedi**.

Not: fotoğraflar hâlâ A4 için fazla büyük (6240×4160'a kadar). Ekran için
yeniden boyutlandırılırsa 10-15 MB'a iner, ama o **kayıplı** olur — karar
kullanıcıya bırakıldı, yapılmadı.
