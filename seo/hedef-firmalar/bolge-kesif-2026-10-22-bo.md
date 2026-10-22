# Keşif BO — Google araması + otomatik doğrulama (2026-10-22)

Kaynak: Claude alt ajanı (web araması + sayfa okuma), kıta Avrupası galvaniz havalandırma kanalı üreticileri — 22 Ekim 2026
"<ürün> üreticisi" aramaları (139 ülke, 18 arama, tur bo). `scripts/hedef-firma-kesif.py --tur bo`.

Her satır otomatik doğrulandı: site açılıyor; segmentin ürünü sayfada geçiyor; firma kendini
ÜRETİCİ olarak tanıtıyor — çelik servis merkezinde dilme/boy kesme/işleme, pres atölyesinde
metal pres/derin çekme işi de sayılır — (arama başlığı/özeti ya da sayfa başlığı, açıklaması, H1'i) ve
başlığında mağaza, kiralama, bayi, ithalatçı izi yok; ülke tutuyor (yerel uzantı ya da sitede
ülke telefon kodu; Dominik Cumhuriyeti için 809/829/849); e-posta firmanın kendi sitesinde
yazıyor ("sitede:" sayfası). Rehber/pazar yeri siteleri ve makine üreticileri (rakip) elendi.
"Ne üretiyor" sütunu Google'daki sayfa başlığı — elle doğrulanmadı.

**Doğrulanmış firma sayısı:** 33 (13 otomatik + 20 elle: ajanın gördüğü e-posta sayfası, ülke adı/telefon/uzantı kontrolü)

| Firma | Ülke | Web sitesi | Doğrulama sayfası | Ne üretiyor | E-posta / İletişim | Segment |
|---|---|---|---|---|---|---|
| Airtech | Belçika | https://airtech.be/ | https://www.airtech.be/ | Airtech B.V. | info@airtech.be — sitede: https://airtech.be/ | Havalandırma Kanalı |
| NTN OOD | Bulgaristan | https://ntnood.com/ | https://ntnood.com/ | NTN OOD | office@ntnood.com — sitede: https://ntnood.com/kontakti | Havalandırma Kanalı |
| Enpro | Karadağ | https://enpro.me/ | https://enpro.me/ | ENPRO | info@enpro.me — sitede: https://enpro.me/me | Havalandırma Kanalı |
| UAB Glori ir Ko | Litvanya | https://glori.lt/ | http://www.glori.lt/en/ | GLORI IR KO, UAB | info@glori.lt — sitede: https://glori.lt/en/ | Havalandırma Kanalı |
| Condutar | Portekiz | https://condutar.pt/ | https://condutar.pt/ | Condutar Lda | geral@condutar.pt — sitede: https://condutar.pt/ | Havalandırma Kanalı |
| Sandometal | Portekiz | https://www.sandometal.pt/ | https://www.sandometal.pt/ | Sandometal - Metalomecânica e Ar Condicionado | sandometal@sandometal.pt — sitede: https://www.sandometal.pt/ | Havalandırma Kanalı |
| Ch. Neris & Son E.E | Yunanistan | https://www.nerisx.gr/ | https://www.nerisx.gr/ | Ch. Neris & Son E.E. | aeragogoi@nerisx.gr — sitede: https://www.nerisx.gr/ | Havalandırma Kanalı |
| Klempo KV Karlovy Vary | Çekya | https://www.klempokv.cz/ | https://www.klempokv.cz/ | Klempo KV, s.r.o. | klempokv@klempokv.cz — sitede: https://www.klempokv.cz/ | Havalandırma Kanalı |
| Vakkos | Çekya | https://www.vakkos.cz/ | https://www.vakkos.cz/ | VAKKOS Vzduchotechnika s.r.o. | vakkos@vakkos.cz — sitede: https://www.vakkos.cz/ | Havalandırma Kanalı |
| GALVANICA 96 | İspanya | https://galvanica96.com/ | https://galvanica96.com/ | GALVANICA 96 | galvanica96@galvanica96.com — sitede: https://galvanica96.com/contacto | Havalandırma Kanalı |
| Hirsiger | İsviçre | https://www.hirsiger.ch/ | https://www.hirsiger.ch/ | Walter Hirsiger AG | info@hirsiger.ch — sitede: https://www.hirsiger.ch/ | Havalandırma Kanalı |
| Luftech.ch | İsviçre | https://luftech.ch/ | https://luftech.ch/ | Luftech Schweiz AG | info@luftech.ch — sitede: https://luftech.ch/ | Havalandırma Kanalı |
| Schmidlin AG | İsviçre | https://schmidlinag.ch/ | https://schmidlinag.ch/ | Schmidlin AG | affoltern@schmidlinag.ch — sitede: https://schmidlinag.ch/ | Havalandırma Kanalı |
| Zinko Instal SRL | Romanya | https://zinko.ro/ | https://zinko.ro/ | Producer of spiro and rectangular galvanized ventilation ducts (direct from producer), Bucharest | office@zinko.ro — sitede: https://zinko.ro/ | Havalandırma Kanalı |
| Fluid 62 EOOD | Bulgaristan | https://fluid62steel.com/ | https://fluid62steel.com/ | Ducts and ventilation elements from galvanized sheet made in own production base, Gorni Bogrov (Sofia) | fluid62@abv.bg — sitede: https://fluid62steel.com/ | Havalandırma Kanalı |
| FESZT Q Légtechnika Kft. | Macaristan | https://fesztqkft.hu/ | https://fesztqkft.hu/ | Rectangular galvanized duct and fitting manufacturer (since 1993, own production line), Dombóvár | info@fesztqkft.hu — sitede: https://fesztqkft.hu/ | Havalandırma Kanalı |
| Aerodynamiki E.B.E.E. | Yunanistan | https://aerodin.gr/ | http://www.aerodin.gr/contact.php | Rectangular air ducts in galvanized, black, stainless and DCP sheet, spiral ducts, Thessaloniki area | info@aerodin.gr — sitede: http://www.aerodin.gr/contact.php | Havalandırma Kanalı |
| SVMK d.o.o. | Slovenya | https://www.svmk.si/si/ | http://www.svmk.si/ | Own production of round and rectangular air distribution ducts and elements, Idrija | info@svmk.si — sitede: http://www.svmk.si/ | Havalandırma Kanalı |
| VENTCOMMERCE d.o.o. | Hırvatistan | https://www.ventcommerce.hr/ | https://www.ventcommerce.hr/ | Spiro duct and fittings programme in galvanized and stainless sheet, custom square and spiro ducts from own production, Zagreb-Lučko | info@ventcommerce.hr — sitede: https://www.ventcommerce.hr/ | Havalandırma Kanalı |
| SpiroDuct / Outas | Yunanistan | https://spiroduct.gr/ | https://spiroduct.gr/epikinonia/ | Flue gas exhaust products industry: spiral-seam ducts and fittings, Edessa | info@spiroduct.gr — sitede: https://spiroduct.gr/epikinonia/ | Havalandırma Kanalı |
| LEMA-WENT | Polonya | https://lema-went.com.pl/ | https://lema-went.com.pl/ | Spiro ducts of own production from galvanized sheet, ventilation and air-conditioning elements, Chorzów | lema-went@lema-went.com.pl — sitede: https://lema-went.com.pl/ | Havalandırma Kanalı |
| L'EUROSPYRO S.R.L. | İtalya | https://www.leurospyro.it/ | https://www.leurospyro.it/ | In-house production of spiral ducts and air distribution components, Campi Bisenzio (Florence) | info@leurospyro.it — sitede: https://www.leurospyro.it/ | Havalandırma Kanalı |
| TNA CVM (Tôlerie Nantes Atlantique) | Fransa | https://www.tnacvm.com/ | https://www.tnacvm.com/contactez-nous | 3,500 m2 workshop making spiral (80-1250) and rectangular galvanized ducts and fittings, Saint-Herblain | accueil@tnacvm.com — sitede: https://www.tnacvm.com/contactez-nous | Havalandırma Kanalı |
| Interduct | Hollanda | https://interduct.nl/ | https://interduct.nl/ | Spiro ducts produced on own spiro machines (80-1000 mm), ducts and fittings, Ittervoort | info@interduct.nl — sitede: https://interduct.nl/ | Havalandırma Kanalı |
| GMM Luchttechniek B.V. | Hollanda | https://gmmluchttechniek.nl/ | https://gmmluchttechniek.nl/ | Produces custom galvanized spiro ducts and fittings (LUKA standard) and installs them, Vaassen | info@gmmluchttechniek.nl — sitede: https://gmmluchttechniek.nl/ | Havalandırma Kanalı |
| Imgrüth AG | İsviçre | https://imgruethag.ch/home.aspx?lang=DE | https://imgruethag.ch/ | Ventilation sheet-metal shop making steel-sheet ducts, fittings and spiral pipes to measure, Küssnacht am Rigi | info@imgruethag.ch — sitede: https://imgruethag.ch/ | Havalandırma Kanalı |
| Sini Isolamenti S.r.l. | İtalya | https://www.sinisolamenti.it/ | https://www.sinisolamenti.it/ | Galvanized sheet air ducts and special pieces for HVAC, spiral tubes and fittings, Muros (Sassari, Sardinia) | info@sinisolamenti.it — sitede: https://www.sinisolamenti.it/ | Havalandırma Kanalı |
| ROHNERLUFT AG | İsviçre | https://rohnerluft.ch/ | https://rohnerluft.ch/ | Produces galvanized ventilation ducts, silencers and spiral-seam pipes, Urdorf | info@rohnerluft.ch — sitede: https://rohnerluft.ch/ | Havalandırma Kanalı |
| Klammer | Macaristan | https://www.klammer.hu/ | https://www.klammer.hu/telephelyek/ | Manufacture and assembly of galvanized and stainless round ducts, fittings and hoods, Nyíregyháza | nyiregyhaza@klammer.hu — sitede: https://www.klammer.hu/telephelyek/ | Havalandırma Kanalı |
| Spirocentro – Ventilação e Ar Condicionado, Lda. | Portekiz | https://spirocentro.com/ | https://spirocentro.com/contactos/ | Manufacturer of galvanized and stainless spiro ducts and fittings, Tentúgal | geral@spirocentro.pt — sitede: https://spirocentro.com/contactos/ | Havalandırma Kanalı |
| Aéraulique Construction | Fransa | https://aeraulique-construction.fr/ | https://aeraulique-construction.fr/ | Custom rectangular galvanized and stainless ventilation ducts made in own workshops, Chevigny-Saint-Sauveur (Dijon) | aeraulique.dijon@acsas.fr — sitede: https://aeraulique-construction.fr/ | Havalandırma Kanalı |
| Debevre Ventilation | Fransa | https://www.debevre-ventilation.com/ | https://www.debevre-ventilation.com/ | Workshop making circular and rectangular galvanized and stainless ventilation ducts, Merris | contact@debevre.com — sitede: https://www.debevre-ventilation.com/ | Havalandırma Kanalı |
| Robair Groep | Hollanda | https://www.robair.nl/ | https://www.robair.nl/luchtkanalen/ | Produces galvanized steel, aluminium and stainless metal ducts and PIR ducts, Heino | info@robairgroep.nl — sitede: https://www.robair.nl/luchtkanalen/ | Havalandırma Kanalı |
