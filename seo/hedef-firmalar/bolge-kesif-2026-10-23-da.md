# Keşif DA — Google araması + otomatik doğrulama (2026-10-23)

Kaynak: Claude alt ajanı (web araması + sayfa okuma), Körfez ülkeleri çok segmentli yeniden tarama — 23 Ekim 2026
"<ürün> üreticisi" aramaları (139 ülke, 20 arama, tur da). `scripts/hedef-firma-kesif.py --tur da`.

Her satır otomatik doğrulandı: site açılıyor; segmentin ürünü sayfada geçiyor; firma kendini
ÜRETİCİ olarak tanıtıyor — çelik servis merkezinde dilme/boy kesme/işleme, pres atölyesinde
metal pres/derin çekme işi de sayılır — (arama başlığı/özeti ya da sayfa başlığı, açıklaması, H1'i) ve
başlığında mağaza, kiralama, bayi, ithalatçı izi yok; ülke tutuyor (yerel uzantı ya da sitede
ülke telefon kodu; Dominik Cumhuriyeti için 809/829/849); e-posta firmanın kendi sitesinde
yazıyor ("sitede:" sayfası). Rehber/pazar yeri siteleri ve makine üreticileri (rakip) elendi.
"Ne üretiyor" sütunu Google'daki sayfa başlığı — elle doğrulanmadı.

**Doğrulanmış firma sayısı:** 21 (6 otomatik + 15 elle: ajanın gördüğü e-posta sayfası, ülke adı/telefon/uzantı kontrolü)

| Firma | Ülke | Web sitesi | Doğrulama sayfası | Ne üretiyor | E-posta / İletişim | Segment |
|---|---|---|---|---|---|---|
| Alpha | BAE | https://www.alphaducts.com/ | https://www.alphaducts.com/ | Alpha Ducts LLC | info@alphaducts.com — sitede: https://www.alphaducts.com/ | Havalandırma Kanalı |
| Arfuf Alkhaleej metal ind Co LLC | BAE | https://www.arfuf.ae/ | http://www.arfuf.ae/ | Arfuf AlKhaleej Metal Industries Co. LLC | info@arfuf.ae — sitede: https://www.arfuf.ae/contactus | Raf Sistemleri |
| Ascend Metal Industries LLC | BAE | https://ascendmetal.com/ | https://ascendmetal.com/ | Ascend Metal Industries L.L.C | info@ascendmetal.com — sitede: https://ascendmetal.com/ | Çelik Servis Merkezi |
| Brooer Metal Industries UAE | BAE | https://brooer.com/ | https://brooer.com/ | Brooer Metal Industries L.L.C | info@brooer.com — sitede: https://brooer.com/ | Alçıpan Profili |
| Sigma Metal Industries | Katar | https://sigma-industries.com/ | https://sigma-industries.com/ | Sigma Metal Industries | info@sigma-industries.com — sitede: https://sigma-industries.com/contact.php | Yol Bariyeri |
| Ataiksa | Suudi Arabistan | https://ataiksa.com/ | https://ataiksa.com/ | Arabian Thermal Aire Industries Co. Ltd. (ATAI) | info@ataiksa.com — sitede: https://ataiksa.com/ | Havalandırma Kanalı |
| AKKA Metallic Industries Co. LLC | BAE | https://akkametallic.com/ | https://akkametallic.com/contact | Steel furniture, fire hose cabinets, network cabinets, fire-rated doors and garbage chutes factory, Industrial Area 3, Sharjah | info@akkametallic.com — sitede: https://akkametallic.com/contact | Çelik Mobilya |
| Overseas Cans & Containers LLC | BAE | https://overseascans.com/ | https://overseascans.com/ | Metal cans, printed tinplate and pressed components (lids, caps, closures) for food, paint and lubricants, Umm Al Thuoob, Umm Al Quwain | info@overseascans.com — sitede: https://overseascans.com/ | Pres Atölyeleri |
| T S I Metal Industries L.L.C | BAE | https://tsim-industries.com/ | https://tsim-industries.com/ | ERW steel tube and pipe mills in Al Qusais, Dubai and ICAD II, Mussafah, Abu Dhabi | info@tsim-industries.com — sitede: https://tsim-industries.com/ | Çelik Servis Merkezi |
| Vogue Steel Factory LLC | BAE | https://www.vogue-steel.com/ | https://vogue-steel.com/ | Metal fabrication and service centre: structural steel, CNC cutting, architectural metal works, Al Sajaa Industrial Area, Sharjah | info@vogue-steel.com — sitede: https://vogue-steel.com/ | Aşık ve Çelik Yapı |
| Isotherm Insulation FZC | BAE | https://isothermuae.com/ | https://isothermuae.com/ | PUR/PIR insulated sandwich and cold-store panels with metal facers, galvanized profile sheets, Hamriyah Free Zone, Sharjah | gm@isothermuae.com — sitede: https://isothermuae.com/ | Çatı ve Cephe Paneli |
| Create Steel Industry L.L.C | BAE | https://createsteelllc.com/ | https://createsteelllc.com/ | Stainless steel tube and pipe production plus laser cutting, CNC bending and metal fabrication, Dubai Investment Park 2 | info@createsteelllc.com — sitede: https://createsteelllc.com/ | Çelik Servis Merkezi |
| Sabro Metals Co. W.L.L | Bahreyn | https://sabrometals.com/ | https://sabrometals.com/ | Structural steel (mezzanines, warehouses), lift and column cladding, CNC metal partitions and architectural metalwork, Salmabad | sabrometals@gmail.com — sitede: https://sabrometals.com/ | Aşık ve Çelik Yapı |
| Gate Gulf Manufacturing Company (Gate Corpus) | Suudi Arabistan | https://gatecorpus.com/ | https://gatecorpus.com/sheet-metal-stamping.php | Sheet metal stamping, bending and fabrication of OEM components, Fawzan Industrial City, Riyadh (Indian group) | enquiry@gatecorpus.com — sitede: https://gatecorpus.com/sheet-metal-stamping.php | Pres Atölyeleri |
| Q-Tec AirCondition W.L.L (QTEC Group) | Katar | https://qtecqatar.com/ | https://qtecqatar.com/ | GI, stainless, black steel and fire-rated HVAC duct factory (approx. 300,000 m2/yr), New Industrial Area, Doha | info@qtecqatar.com — sitede: https://qtecqatar.com/ | Havalandırma Kanalı |
| Development Salalah International (DSI) | Umman | https://dsioman.com/ | https://dsioman.com/?page_id=43 | GI HVAC duct manufacturing works (CNC folding, shearing, auto-seaming) to DW144/SMACNA, Salalah | info@dsioman.com — sitede: https://dsioman.com/?page_id=43 | Havalandırma Kanalı |
| Taj for Steel Industries LLC | Umman | https://tajglb.com/ | https://tajglb.com/ | Steel sheet service centre: slitting, cut-to-length, trapezoidal profiling of GI, PPGI, HR and CR sheet, Barka Industrial Area | sales@tajglb.com — sitede: https://tajglb.com/ | Çelik Servis Merkezi |
| Al Prince Metal Manufacture W.L.L. | Bahreyn | https://alprincebh.com/ | https://alprincebh.com/ | Structural and custom steel, stainless steel and wrought iron fabrication plus drywall/gypsum works, factory in Salmabad | sales@alprincebh.com — sitede: https://alprincebh.com/ | Aşık ve Çelik Yapı |
| Texon Steel Factory (Texon Middle East) | Kuveyt | https://texonmiddleeast.com/ | https://texonmiddleeast.com/contact-fullwidth-map/ | Steel and stainless fabrication: stainless kitchen equipment, fire cabinets, storage/racking, cabins, Shuwaikh Industrial Area | sales@texonmiddleast.com — sitede: https://texonmiddleeast.com/contact-fullwidth-map/ | Çelik Mobilya |
| JMB Panel (Al-Buhsain Steel Industries) | Katar | https://www.jmbpanel.com/ | https://www.jmbpanel.com/ | PUR/PIR sandwich roof, wall and cold-room panels on a continuous line, plus flashings and Z/C purlins, New Industrial Area, Doha | info@jmb.qa — sitede: https://www.jmbpanel.com/ | Çatı ve Cephe Paneli |
| Embosal Tube Mills LLC | BAE | https://embosal.com/ | https://embosal.com/ | ERW, LSAW and SSAW steel pipe and square/rectangular tube mill, Al Ghail, Ras Al Khaimah | mail@embosal.com — sitede: https://embosal.com/ | Çelik Servis Merkezi |
