# Keşif CP — Google araması + otomatik doğrulama (2026-10-22)

Kaynak: Claude alt ajanı (web araması + sayfa okuma), İspanya ve Portekiz bölgesel çok segmentli tarama (CMM, ASIME rehberleri) — 22 Ekim 2026
"<ürün> üreticisi" aramaları (139 ülke, 16 arama, tur cp). `scripts/hedef-firma-kesif.py --tur cp`.

Her satır otomatik doğrulandı: site açılıyor; segmentin ürünü sayfada geçiyor; firma kendini
ÜRETİCİ olarak tanıtıyor — çelik servis merkezinde dilme/boy kesme/işleme, pres atölyesinde
metal pres/derin çekme işi de sayılır — (arama başlığı/özeti ya da sayfa başlığı, açıklaması, H1'i) ve
başlığında mağaza, kiralama, bayi, ithalatçı izi yok; ülke tutuyor (yerel uzantı ya da sitede
ülke telefon kodu; Dominik Cumhuriyeti için 809/829/849); e-posta firmanın kendi sitesinde
yazıyor ("sitede:" sayfası). Rehber/pazar yeri siteleri ve makine üreticileri (rakip) elendi.
"Ne üretiyor" sütunu Google'daki sayfa başlığı — elle doğrulanmadı.

**Doğrulanmış firma sayısı:** 30 (5 otomatik + 25 elle: ajanın gördüğü e-posta sayfası, ülke adı/telefon/uzantı kontrolü)

| Firma | Ülke | Web sitesi | Doğrulama sayfası | Ne üretiyor | E-posta / İletişim | Segment |
|---|---|---|---|---|---|---|
| FACLIMA | Portekiz | https://www.faclima.pt/ | https://www.faclima.pt/ | Faclima - Fábrica de Equipamentos de Ar Condicionado | info@faclima.pt — sitede: https://www.faclima.pt/ | Havalandırma Kanalı |
| Space Out | Portekiz | https://www.space-out.com/ | https://www.space-out.com/ | Space-Out | info@space-out.com — sitede: https://www.space-out.com/ | Çelik Mobilya |
| Arregui | İspanya | https://www.arregui.es/ | https://www.arregui.es/ | Arregui | arregui@arregui.es — sitede: https://www.arregui.es/ | Çelik Mobilya |
| Teczone | İspanya | https://teczone.es/ | https://www.teczone.es/ | Teczone | teczone@teczone.es — sitede: https://teczone.es/ | Çatı ve Cephe Paneli |
| Tuboven | İspanya | https://tuboven.es/ | https://tuboven.es/ | Tuboven | info@tuboven.es — sitede: https://tuboven.es/ | Havalandırma Kanalı |
| Fametal - Fábrica Portuguesa de Estruturas Metálicas | Portekiz | https://fametal.pt/ | https://www.fametal.pt/contactos | Steel structure plant with 24,000 m2 production area, Caxarias (Ourém) | geral@fametal.pt — sitede: https://www.fametal.pt/contactos | Aşık ve Çelik Yapı |
| Constálica - Elementos de Construção Metálicos | Portekiz | https://constalica.com/ | https://constalica.com/en/contacts | Cold-formed purlins (Madremax) and omega profiles for steel buildings, Vouzela | comercial@constalica.com — sitede: https://constalica.com/en/contacts | Aşık ve Çelik Yapı |
| Arestalfer | Portekiz | https://arestalfer.com/pt/home | https://www.arestalfer.com/ | Steel structure design, fabrication and assembly (6,000 t/yr), Sever do Vouga | geral@arestalfer.com — sitede: https://www.arestalfer.com/ | Aşık ve Çelik Yapı |
| Garsteel - Construções Metálicas | Portekiz | https://www.garsteel.pt/en/ | https://www.garsteel.pt/ | Steel structures, cladding and light metalwork fabricator, Guimarães | geral@garsteel.pt — sitede: https://www.garsteel.pt/ | Aşık ve Çelik Yapı |
| Metalpedro - Indústrias Metalúrgicas | Portekiz | https://metalpedro.pt/ | https://metalpedro.pt/contactos/ | Steel structures and metalwork fabricator, Sever do Vouga | geral@metalpedro.pt — sitede: https://metalpedro.pt/contactos/ | Aşık ve Çelik Yapı |
| Ferberto - Estruturas Metálicas | Portekiz | https://ferberto.pt/ | https://www.ferberto.pt/ | Steel structure fabrication with cutting, drilling, bending and painting, Porto de Mós | geral@ferberto.pt — sitede: https://www.ferberto.pt/ | Aşık ve Çelik Yapı |
| LusoSteel | Portekiz | https://www.lusosteel.pt/en/home-en-2/ | https://www.lusosteel.pt/ | Steel structures, mezzanines and profiled-sheet cladding fabricator, Vimieiro (Braga) | geral@lusosteel.pt — sitede: https://www.lusosteel.pt/ | Aşık ve Çelik Yapı |
| Seveme - Indústrias Metalúrgicas | Portekiz | https://seveme.com/pt/home | https://www.seveme.com/ | Steel constructions and aluminium systems fabricator, Sever do Vouga | geral@seveme.com — sitede: https://www.seveme.com/ | Aşık ve Çelik Yapı |
| MetaloViana - Metalúrgica de Viana | Portekiz | https://metaloviana.pt/ | https://www.metaloviana.pt/ | Heavy steel structures and metal fabrication (12,000 t/yr), Viana do Castelo | geral@metaloviana.pt — sitede: https://www.metaloviana.pt/ | Aşık ve Çelik Yapı |
| Casape - Indústria Metalomecânica | Portekiz | https://www.casape.pt/ | https://www.casape.pt/ | Steel structure fabrication and assembly, 6,000 t/yr, 70% exported, Leiria | casape@casape.pt — sitede: https://www.casape.pt/ | Aşık ve Çelik Yapı |
| Duartesfer Construções Metálicas | Portekiz | https://www.duartesfer.pt/pt/ | https://www.duartesfer.pt/pt/contactos | Steel structure fabrication and assembly, industrial halls and towers, Barcelos | geral@duartesfer.pt — sitede: https://www.duartesfer.pt/pt/contactos | Aşık ve Çelik Yapı |
| Momsteelpor | Portekiz | https://momsteel.com.pt/ | https://www.momsteel.com.pt/ | Steel building structures and PV mounting solutions, Abrantes | info@momsteel.com.pt — sitede: https://www.momsteel.com.pt/ | Aşık ve Çelik Yapı |
| Martins Ferreira (Masterferro) | Portekiz | https://masterferro.pt/pt | https://www.masterferro.pt/ | Steel products centre with cutting services and beam/tube rolling, Braga | geral@masterferro.pt — sitede: https://www.masterferro.pt/ | Çelik Servis Merkezi |
| WT Westtube | Portekiz | https://westtube.pt/ | https://www.westtube.pt/ | TIG-welded stainless steel tube manufacturer, northern Portugal (about one hour from Porto) | info@westtube.pt — sitede: https://www.westtube.pt/ | Çelik Servis Merkezi |
| Liscortes - Estruturas Metálicas | Portekiz | https://liscortes.pt/ | https://www.liscortes.pt/ | EN 1090 steel structure fabrication in own plant, Leiria | geral@liscortes.pt — sitede: https://www.liscortes.pt/ | Aşık ve Çelik Yapı |
| Coberaço - Estruturas Metálicas | Portekiz | https://coberaco.com/ | https://www.coberaco.com/ | Steel structures and metal roof/facade cladding fabricator, Leiria | geral@coberaco.com — sitede: https://www.coberaco.com/ | Aşık ve Çelik Yapı |
| RSteel - Fábrica de Tubos Metálicos | Portekiz | https://rsteel.pt/en/home-en/ | https://www.rsteel.pt/ | Welded steel tube mill, Lousado (Vila Nova de Famalicão) | geral@rsteel.pt — sitede: https://www.rsteel.pt/ | Çelik Servis Merkezi |
| Comevisa - Construcciones Metálicas de Vigo | İspanya | https://www.comevisa.com/ | https://www.comevisa.com/ | Sheet-metal subcontractor: punching, bending, rolling, welding, machining, Vigo | comevisa@comevisa.com — sitede: https://www.comevisa.com/ | Pres Atölyeleri |
| TM Rodrigo | İspanya | https://www.tmrodrigo.es/ | https://www.tmrodrigo.es/ | Profiled roofing sheet, sandwich panel, purlins and in-house sheet bending/flashings, Mota del Cuervo (Cuenca) | info@tmrodrigo.es — sitede: https://www.tmrodrigo.es/ | Çatı ve Cephe Paneli |
| URSSA | İspanya | https://www.urssa.es/ | https://www.urssa.es/ | Steel structures for buildings, bridges and industry, Vitoria-Gasteiz | urssa@urssa.es — sitede: https://www.urssa.es/ | Aşık ve Çelik Yapı |
| Freire Hermanos | İspanya | https://freirehnos.es/ | https://freirehnos.es/ | Steel distribution and processing centre (30,000 m2, rail siding), A Coruña | cac@freirehnos.es — sitede: https://freirehnos.es/ | Çelik Servis Merkezi |
| Spin HVAC | İspanya | https://spinhvac.com/ | https://www.spinhvac.com/ | Galvanized and stainless spiral ducts, silencers and dampers, 3,500 m2 site, Santa Perpètua de Mogoda (Barcelona) | info@spinhvac.com — sitede: https://www.spinhvac.com/ | Havalandırma Kanalı |
| Marques & Andrade - Indústria de Metalomecânica | Portekiz | https://www.marqueseandrade.pt/ | https://www.marqueseandrade.pt/ | Steel roof structures, metal warehouses, tanks and gutters fabricator, Barreiro | geral@marqueseandrade.pt — sitede: https://www.marqueseandrade.pt/ | Aşık ve Çelik Yapı |
| Reynober | İspanya | https://reynober.net/ | https://reynober.net/ | Steel and aluminium road sign manufacturer, 11,000 m2 plant, Leganés (Madrid) | administracion@reynober.com — sitede: https://reynober.net/ | Yol Bariyeri |
| Riscos e Diâmetros (MM Metálica) | Portekiz | https://mm-metalica.com/ | https://mm-metalica.com/pt/contactos/ | Circular, rectangular and oval sheet-metal HVAC ducts and attenuators, Fermentões (Guimarães) | geral@mm-metalica.com.pt — sitede: https://mm-metalica.com/pt/contactos/ | Havalandırma Kanalı |
