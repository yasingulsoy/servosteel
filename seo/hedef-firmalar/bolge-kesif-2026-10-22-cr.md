# Keşif CR — Google araması + otomatik doğrulama (2026-10-22)

Kaynak: Claude alt ajanı (web araması + sayfa okuma), İngiltere ve İrlanda bölgesel çok segmentli tarama — 22 Ekim 2026
"<ürün> üreticisi" aramaları (139 ülke, 9 arama, tur cr). `scripts/hedef-firma-kesif.py --tur cr`.

Her satır otomatik doğrulandı: site açılıyor; segmentin ürünü sayfada geçiyor; firma kendini
ÜRETİCİ olarak tanıtıyor — çelik servis merkezinde dilme/boy kesme/işleme, pres atölyesinde
metal pres/derin çekme işi de sayılır — (arama başlığı/özeti ya da sayfa başlığı, açıklaması, H1'i) ve
başlığında mağaza, kiralama, bayi, ithalatçı izi yok; ülke tutuyor (yerel uzantı ya da sitede
ülke telefon kodu; Dominik Cumhuriyeti için 809/829/849); e-posta firmanın kendi sitesinde
yazıyor ("sitede:" sayfası). Rehber/pazar yeri siteleri ve makine üreticileri (rakip) elendi.
"Ne üretiyor" sütunu Google'daki sayfa başlığı — elle doğrulanmadı.

**Doğrulanmış firma sayısı:** 18 (10 otomatik + 8 elle: ajanın gördüğü e-posta sayfası, ülke adı/telefon/uzantı kontrolü)

| Firma | Ülke | Web sitesi | Doğrulama sayfası | Ne üretiyor | E-posta / İletişim | Segment |
|---|---|---|---|---|---|---|
| Benchmaster | Birleşik Krallık | https://www.benchmaster.uk/ | https://www.benchmaster.uk/ | Benchmaster (GHG Group) | sales@benchmaster.uk — sitede: https://www.benchmaster.uk/get-in-touch/ | Çelik Mobilya |
| Flgb | Birleşik Krallık | https://www.flgb.co.uk/ | https://www.flgb.co.uk/ | Fowler & Gilbert Ltd | sales@flgb.co.uk — sitede: https://www.flgb.co.uk/contact/ | Aşık ve Çelik Yapı |
| Jet Press | Birleşik Krallık | https://www.jetpress.com/ | https://www.jetpress.com/ | Jet Press | webenquiries@jetpress.com — sitede: https://www.jetpress.com/ | Pres Atölyeleri |
| JRC Steel (John Ruck Construction) | Birleşik Krallık | https://jrcsteel.co.uk/ | https://jrcsteel.co.uk/ | JRC Steel (John Ruck Construction) | enquiries@jrcsteel.co.uk — sitede: https://jrcsteel.co.uk/ | Aşık ve Çelik Yapı |
| Lloyd & Son Ltd | Birleşik Krallık | https://jlloydandson.co.uk/ | https://www.jlloydandson.co.uk/ | J. Lloyd & Son Ltd | info@jlloydandson.co.uk — sitede: https://jlloydandson.co.uk/ | Aşık ve Çelik Yapı |
| Sanda | Birleşik Krallık | https://www.s-and-a.co.uk/ | https://www.s-and-a.co.uk/ | S&A Fabrications | fabs@s-and-a.co.uk — sitede: https://www.s-and-a.co.uk/ | Aşık ve Çelik Yapı |
| South West Steel Construction Ltd | Birleşik Krallık | https://southweststeelconstruction.co.uk/ | https://southweststeelconstruction.co.uk/ | South West Steel Construction | info@southweststeelconstruction.co.uk — sitede: https://southweststeelconstruction.co.uk/ | Aşık ve Çelik Yapı |
| duggansteel-ie | İrlanda | https://www.duggansteel.ie/ | https://www.duggansteel.ie/ | J & F Duggan Steel Buildings (Duggan Steel) | tenders@duggansteel.ie — sitede: https://www.duggansteel.ie/contact-us | Aşık ve Çelik Yapı |
| Dunphy Engineering | İrlanda | https://www.dunphyengineering.ie/ | https://www.dunphyengineering.ie/ | Dunphy Engineering | info@dunphyengineering.ie — sitede: https://www.dunphyengineering.ie/ | Aşık ve Çelik Yapı |
| PanelDuct | İrlanda | https://panelduct.ie/ | https://panelduct.ie/ | PanelDuct | info@panelduct.ie — sitede: https://panelduct.ie/ | Havalandırma Kanalı |
| Barton Storage Systems | Birleşik Krallık | https://bartonstorage.com/ | https://www.bartonstorage.com/ | British-made shelving, lockers, workbenches and small-parts storage (trade supplier with own production), West Midlands | enquiries@bartonstorage.com — sitede: https://www.bartonstorage.com/ | Raf Sistemleri |
| K. W. Timmins & Sons Ltd | Birleşik Krallık | https://www.timminscontracting.co.uk/ | https://www.timminscontracting.co.uk/ | Steel frame agricultural and industrial buildings with welding and fabrication, Sturton by Stow (Lincoln) | will@timminscontracting.co.uk — sitede: https://www.timminscontracting.co.uk/ | Aşık ve Çelik Yapı |
| Robinsons (Scotland) Ltd / Robinsons Group | Birleşik Krallık | https://www.robinsons-group.com/ | https://www.robinsons-group.com/contact-us/ | Steel-framed agricultural and industrial buildings manufacturer, Lockerbie | sales@robinsons-group.com — sitede: https://www.robinsons-group.com/contact-us/ | Aşık ve Çelik Yapı |
| Norris Bros Ltd | İrlanda | https://www.norrisbrothers.eu/ | https://www.norrisbrothers.eu/ | Structural steel and agricultural buildings fabricator (35,000 sq ft works), Stradbally (Co. Waterford) | info@norrisbrothers.eu — sitede: https://www.norrisbrothers.eu/ | Aşık ve Çelik Yapı |
| Noel C Duggan Ltd | İrlanda | https://www.noelcduggan.com/ | https://www.noelcduggan.com/ | Structural steel fabrication, metal deck flooring and cladding, Millstreet (Co. Cork) | info@noelcduggan.com — sitede: https://www.noelcduggan.com/ | Aşık ve Çelik Yapı |
| Jaques Int Ltd | Birleşik Krallık | https://jaquesint.com/ | https://jaquesint.com/contact-us/ | Poultry, agricultural and industrial buildings with in-house structural steel fabrication, Shobdon (Leominster) | sales@jaquesint.com — sitede: https://jaquesint.com/contact-us/ | Aşık ve Çelik Yapı |
| F.W. Yelland & Son (Northlew) Ltd | Birleşik Krallık | http://www.yelland-construction.co.uk/ | http://www.yelland-construction.co.uk/ | Steel frame buildings with in-house fabrication, Northlew (Okehampton, Devon) | mail@yellandconstruction.co.uk — sitede: http://www.yelland-construction.co.uk/ | Aşık ve Çelik Yapı |
| Adman Steel Sheds | İrlanda | https://admansteelsheds.com/ | https://admansteelsheds.com/ | PVC-coated steel garden sheds, garages and garden rooms on galvanised steel frames, Gorey (Co. Wexford) | info@admansteelsheds.ie — sitede: https://admansteelsheds.com/ | Aşık ve Çelik Yapı |
