# Keşif CU — Google araması + otomatik doğrulama (2026-10-22)

Kaynak: Claude alt ajanı (web araması + sayfa okuma), Avustralya ve Yeni Zelanda taşra çok segmentli tarama — 22 Ekim 2026
"<ürün> üreticisi" aramaları (139 ülke, 13 arama, tur cu). `scripts/hedef-firma-kesif.py --tur cu`.

Her satır otomatik doğrulandı: site açılıyor; segmentin ürünü sayfada geçiyor; firma kendini
ÜRETİCİ olarak tanıtıyor — çelik servis merkezinde dilme/boy kesme/işleme, pres atölyesinde
metal pres/derin çekme işi de sayılır — (arama başlığı/özeti ya da sayfa başlığı, açıklaması, H1'i) ve
başlığında mağaza, kiralama, bayi, ithalatçı izi yok; ülke tutuyor (yerel uzantı ya da sitede
ülke telefon kodu; Dominik Cumhuriyeti için 809/829/849); e-posta firmanın kendi sitesinde
yazıyor ("sitede:" sayfası). Rehber/pazar yeri siteleri ve makine üreticileri (rakip) elendi.
"Ne üretiyor" sütunu Google'daki sayfa başlığı — elle doğrulanmadı.

**Doğrulanmış firma sayısı:** 21 (11 otomatik + 10 elle: ajanın gördüğü e-posta sayfası, ülke adı/telefon/uzantı kontrolü)

| Firma | Ülke | Web sitesi | Doğrulama sayfası | Ne üretiyor | E-posta / İletişim | Segment |
|---|---|---|---|---|---|---|
| Airflow Duct Systems | Avustralya | https://airflowductsystems.com.au/ | https://www.airflowductsystems.com.au/ | Airflow Duct Systems | info@airflowductsystems.com.au — sitede: https://airflowductsystems.com.au/ | Havalandırma Kanalı |
| Ausdeck Building Systems | Avustralya | https://ausdeck.com.au/ | https://ausdeck.com.au/ | Ausdeck | reception@ausdeck.com.au — sitede: https://ausdeck.com.au/contact/ | Çatı ve Cephe Paneli |
| DD Smith | Avustralya | https://ddsmith.com.au/ | https://ddsmith.com.au/ | D&D Smith Metal Pressers | enquiries@ddsmith.com.au — sitede: https://ddsmith.com.au/ | Pres Atölyeleri |
| Kspan | Avustralya | https://kspan.com.au/ | https://kspan.com.au/ | Kspan | admin@kspan.com.au — sitede: https://kspan.com.au/ | Alçıpan Profili |
| MB Precision | Avustralya | https://mbprecision.com.au/ | https://mbprecision.com.au/ | MB Precision | team@mbprecision.com.au — sitede: https://mbprecision.com.au/ | Pres Atölyeleri |
| Mecano Sheds and Kit Homes | Avustralya | https://mecano.com.au/ | https://mecano.com.au/ | Mecano Sheds and Kit Homes | sales@mecano.com.au — sitede: https://mecano.com.au/ | Aşık ve Çelik Yapı |
| Metal Line Coffs Harbour | Avustralya | https://metalline.net.au/ | https://www.metalline.net.au/ | Metal Line | admin@metalline.net.au — sitede: https://metalline.net.au/ | Çatı ve Cephe Paneli |
| Steel House Frames Mudgee | Avustralya | https://www.steelframecompany.com.au/ | https://www.steelframecompany.com.au/ | Steel Frame Company | info@steelframecompany.com.au — sitede: https://www.steelframecompany.com.au/ | Aşık ve Çelik Yapı |
| Air Care Sheet Metal | Yeni Zelanda | https://aircaresheetmetals.co.nz/ | https://aircaresheetmetals.co.nz/ | Air Care Sheet Metals | sales@aircaresheetmetals.co.nz — sitede: https://aircaresheetmetals.co.nz/ | Havalandırma Kanalı |
| Continuous Group | Yeni Zelanda | https://continuous.co.nz/ | https://www.continuous.co.nz/ | Continuous Group | cg@continuous.co.nz — sitede: https://continuous.co.nz/ | Çatı ve Cephe Paneli |
| ProForm Steel | Yeni Zelanda | https://proformsteel.co.nz/ | https://proformsteel.co.nz/ | Proform Steel | info@proformsteel.co.nz — sitede: https://proformsteel.co.nz/ | Çatı ve Cephe Paneli |
| Coffs Metal Market | Avustralya | https://coffsmetalmarket.com.au/ | https://www.coffsmetalmarket.com.au/ | Steel supply with in-house cutting, punching and processing plus gate manufacturing, Coffs Harbour NSW | sales@coffsmetalmarket.com.au — sitede: https://www.coffsmetalmarket.com.au/ | Çelik Servis Merkezi |
| Academy Sheetmetal | Avustralya | https://academysheetmetal.com.au/ | https://www.academysheetmetal.com.au/ | Sheet metal fabrication with turret punching, laser cutting and roofing flashings, Cardiff (Newcastle) NSW | cs@academysheetmetal.com.au — sitede: https://www.academysheetmetal.com.au/ | Pres Atölyeleri |
| Spanbild | Yeni Zelanda | https://www.spanbild.co.nz/ | https://www.spanbild.co.nz/manufacture | Steel building components, roll-formed cladding and roofing for Totalspan buildings, plants in Christchurch and Matamata | info@spanbild.co.nz — sitede: https://www.spanbild.co.nz/manufacture | Aşık ve Çelik Yapı |
| Lundia | Yeni Zelanda | https://lundia.co.nz/ | https://lundia.co.nz/ | Modular and high-density mobile shelving made in New Zealand, Mangere (Auckland) | info@lundia.co.nz — sitede: https://lundia.co.nz/ | Raf Sistemleri |
| ProSteel Systems | Yeni Zelanda | https://prosteelsystems.co.nz/ | https://prosteelsystems.co.nz/ | Cold-rolled and hot-rolled steel kitset sheds and farm buildings, New Zealand | info@prosteelsystems.co.nz — sitede: https://prosteelsystems.co.nz/ | Aşık ve Çelik Yapı |
| X Span | Yeni Zelanda | https://xspan.co.nz/ | https://www.xspan.co.nz/ | Steel shed and farm building kitsets with cold-rolled steel portal frames, New Zealand | info@xspan.co.nz — sitede: https://www.xspan.co.nz/ | Aşık ve Çelik Yapı |
| Top End Steel Supplies | Avustralya | https://www.topendsteelsupplies.com.au/ | https://www.topendsteelsupplies.com.au/ | Steel supply and processing (cutting, punching, fabrication) workshop, Pinelands (Darwin) NT | sales@topendsteel.com.au — sitede: https://www.topendsteelsupplies.com.au/ | Çelik Servis Merkezi |
| Garden Master Sheds | Yeni Zelanda | https://www.gardenmastersheds.co.nz/ | https://www.gardenmastersheds.co.nz/contact/ | Steel kitset sheds roll-formed in own New Zealand factory, family owned since 1974 | info@gardenmaster.co.nz — sitede: https://www.gardenmastersheds.co.nz/contact/ | Aşık ve Çelik Yapı |
| Ashburton Long Run Iron | Yeni Zelanda | https://longruniron.co.nz/ | https://longruniron.co.nz/ | Long-run roofing and cladding manufacturer (MRMA member), Ashburton, Canterbury | office@longruniron.com — sitede: https://longruniron.co.nz/ | Çatı ve Cephe Paneli |
| Alpha Engineering | Yeni Zelanda | https://alphaengineering.co.nz/ | https://alphaengineering.co.nz/services/metal-pressing-stamping/ | Metal pressing and stamping (30-60 t presses), in-house toolmaking and sheet metal work, Manukau (Auckland) | mail@alphaengineering.co.nz — sitede: https://alphaengineering.co.nz/services/metal-pressing-stamping/ | Pres Atölyeleri |
