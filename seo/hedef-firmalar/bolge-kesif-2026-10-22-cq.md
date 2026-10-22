# Keşif CQ — Google araması + otomatik doğrulama (2026-10-22)

Kaynak: Claude alt ajanı (web araması + sayfa okuma), Polonya, Çekya, Slovakya bölgesel çok segmentli tarama (firmy.cz, zoznam.sk, Europages PL) — 22 Ekim 2026
"<ürün> üreticisi" aramaları (139 ülke, 17 arama, tur cq). `scripts/hedef-firma-kesif.py --tur cq`.

Her satır otomatik doğrulandı: site açılıyor; segmentin ürünü sayfada geçiyor; firma kendini
ÜRETİCİ olarak tanıtıyor — çelik servis merkezinde dilme/boy kesme/işleme, pres atölyesinde
metal pres/derin çekme işi de sayılır — (arama başlığı/özeti ya da sayfa başlığı, açıklaması, H1'i) ve
başlığında mağaza, kiralama, bayi, ithalatçı izi yok; ülke tutuyor (yerel uzantı ya da sitede
ülke telefon kodu; Dominik Cumhuriyeti için 809/829/849); e-posta firmanın kendi sitesinde
yazıyor ("sitede:" sayfası). Rehber/pazar yeri siteleri ve makine üreticileri (rakip) elendi.
"Ne üretiyor" sütunu Google'daki sayfa başlığı — elle doğrulanmadı.

**Doğrulanmış firma sayısı:** 33 (17 otomatik + 16 elle: ajanın gördüğü e-posta sayfası, ülke adı/telefon/uzantı kontrolü)

| Firma | Ülke | Web sitesi | Doğrulama sayfası | Ne üretiyor | E-posta / İletişim | Segment |
|---|---|---|---|---|---|---|
| DRABEST Spółka z o.o | Polonya | https://drabest.pl/ | https://drabest.pl/ | DRABEST Sp. z o.o. | sklep@drabest.pl — sitede: https://drabest.pl/ | İskele Kalası |
| ENSON | Polonya | https://enson.pl/ | https://enson.pl/ | ENSON | info@enson.pl — sitede: https://enson.pl/ | Solar Profil |
| Frapol | Polonya | https://www.frapol.com.pl/ | https://www.frapol.com.pl/ | FRAPOL Sp. z o.o. | biuro@frapol.com.pl — sitede: https://www.frapol.com.pl/ | Havalandırma Kanalı |
| Klimawent | Polonya | https://klimawent.com.pl/ | https://klimawent.com.pl/ | Klimawent S.A. | klimawent@klimawent.com.pl — sitede: https://klimawent.com.pl/ | Havalandırma Kanalı |
| Rapmet | Polonya | https://www.rapmet.pl/ | https://www.rapmet.pl/ | RAPMET Sp. z o.o. | handel@rapmet.pl — sitede: https://www.rapmet.pl/ | Aşık ve Çelik Yapı |
| umstahl.pl | Polonya | https://umstahl.pl/ | https://umstahl.pl/ | UMSTAHL Sp. z o.o. | biuro@umstahl.pl — sitede: https://umstahl.pl/ | Çelik Mobilya |
| AUCTUS | Slovakya | https://www.auctus.sk/ | https://www.auctus.sk/ | AUCTUS, s. r. o. | info@auctus.sk — sitede: https://www.auctus.sk/ | Aşık ve Çelik Yapı |
| HALY NA MIERU | Slovakya | https://www.halynamieru.sk/ | https://www.halynamieru.sk/ | DevArt s. r. o. | panely@halynamieru.sk — sitede: https://www.halynamieru.sk/ | Aşık ve Çelik Yapı |
| KOJA form s.r.o | Slovakya | https://www.kojaform.sk/ | https://www.kojaform.sk/ | KOJA form, s.r.o. | kojaform@kojaform.sk — sitede: https://www.kojaform.sk/ | Çatı ve Cephe Paneli |
| Technov s.r.o | Slovakya | https://technov.sk/ | https://technov.sk/ | TECHNOV, s.r.o. | sales@technov.sk — sitede: https://technov.sk/kontakty/ | Havalandırma Kanalı |
| Cic | Çekya | https://www.cic.cz/ | https://www.cic.cz/ | C.I.C. Jan Hřebec s.r.o. | info@cic.cz — sitede: https://www.cic.cz/ | Havalandırma Kanalı |
| Kovos-Slavicin | Çekya | https://www.kovos-slavicin.cz/ | https://www.kovos-slavicin.cz/ | KOVOS, spol. s r.o. | akepak@kovos-slavicin.cz — sitede: https://www.kovos-slavicin.cz/ | Raf Sistemleri |
| Ohybaneprofily | Çekya | https://ohybaneprofily.cz/ | https://ohybaneprofily.cz/ | OHÝBANÉ PROFILY, a.s. | info@ohybaneprofily.cz — sitede: https://ohybaneprofily.cz/ | Çelik Servis Merkezi |
| PELIFER | Çekya | https://pelifer.cz/ | https://pelifer.cz/ | PELIFER s.r.o. | vaclav.mikulica@pelifer.cz — sitede: https://pelifer.cz/ | Pres Atölyeleri |
| Regal | Çekya | https://www.regal.cz/ | https://www.regal.cz/ | Bláha Ús s.r.o. | dilna@regal.cz — sitede: https://www.regal.cz/ | Raf Sistemleri |
| Rosso Steel Service Center | Çekya | https://www.rosso.cz/ | https://www.rosso.cz/ | ROSSO STEEL, a.s. | info@rosso.cz — sitede: https://www.rosso.cz/kontakt/ | Çelik Servis Merkezi |
| VLAVE LISOVNA s.r.o | Çekya | https://www.vlave.cz/ | https://www.vlave.cz/ | VlaVe Lisovna s.r.o. | info@vlave.cz — sitede: https://www.vlave.cz/ | Pres Atölyeleri |
| STAGO Group Sp. z o.o. | Polonya | https://stago.com.pl/ | https://stago.com.pl/kontakt/ | Modular steel pavilions, containers and steel halls from own plant, Jędrzejów | kontakt@stago.com.pl — sitede: https://stago.com.pl/kontakt/ | Aşık ve Çelik Yapı |
| MANDÍK, a.s. | Çekya | https://mandik.cz/ | https://www.mandik.cz/ | Fire dampers, smoke control dampers and air distribution elements, Hostomice | mandik@mandik.cz — sitede: https://www.mandik.cz/ | Havalandırma Kanalı |
| GELSO, s.r.o. | Çekya | http://www.gelso.cz/en/ | https://www.gelso.cz/ | Ventilation and air-exhaust equipment for the timber industry, sheet metalwork, Okříšky | gelso@gelso.cz — sitede: https://www.gelso.cz/ | Havalandırma Kanalı |
| Ocelová konstrukce s.r.o. | Çekya | https://okcz.cz/ | https://www.okcz.cz/ | Steel halls, light prefabricated halls and canopies from own production, České Budějovice | rene@okcz.cz — sitede: https://www.okcz.cz/ | Aşık ve Çelik Yapı |
| LUCID spol. s r.o. | Çekya | https://www.lucid.cz/ | https://www.lucid.cz/ | Sheet-metal products and technical stampings for automotive and electrical industry, Jablonec nad Nisou | info@lucid.cz — sitede: https://www.lucid.cz/ | Pres Atölyeleri |
| KOVOMAX s.r.o. | Çekya | https://kovomax.cz/ | https://www.kovomax.cz/ | Precision sheet-metal cabinets and profile structures with powder coating, Rožnov pod Radhoštěm | kovomax@kovomax.cz — sitede: https://www.kovomax.cz/ | Çelik Mobilya |
| METALLURGICAL & STEEL SERVICE s.r.o. | Çekya | https://masservice.cz/en/ | https://masservice.cz/de/kontakt/ | Steel structures for halls and hangars, crane runways and building cladding from own production halls, Vratimov | masservice@masservice.cz — sitede: https://masservice.cz/de/kontakt/ | Aşık ve Çelik Yapı |
| Ermont - Erik Melichárčík | Slovakya | https://ermont-bs.sk/ | https://ermont-bs.sk/ | Design, production and erection of steel structures and prefabricated steel halls, Banská Štiavnica | info@ermont-bs.sk — sitede: https://ermont-bs.sk/ | Aşık ve Çelik Yapı |
| SUBAL S.C. | Polonya | https://subal.com.pl/en/ | https://subal.com.pl/#kontakt | Retail display shelving, POS stands and wire products from own production halls, Bytów | biuro@subal.com.pl — sitede: https://subal.com.pl/#kontakt | Market Rafı |
| METAL STEEL FORMING s.r.o. | Slovakya | https://www.metalsteelforming.sk/ | https://www.metalsteelforming.sk/kontakt/ | Sheet-metal forming, sheet parts and structures in own plant, Liptovský Mikuláš | info@metalsteelforming.sk — sitede: https://www.metalsteelforming.sk/kontakt/ | Pres Atölyeleri |
| HERN s.r.o. | Slovakya | https://www.hern.sk/ | http://www.hern.sk/ | Formed, cut and welded steel assemblies for agricultural and construction machinery, Námestovo | hern@hern.sk — sitede: http://www.hern.sk/ | Pres Atölyeleri |
| STALFA Sp. z o.o. | Polonya | https://stalfa.com.pl/ | https://stalfa.com.pl/ | Construction props, scaffolding, steel towers, construction pallets and containers, Sokołów Podlaski | stalfa@stalfa.pl — sitede: https://stalfa.com.pl/ | İskele Kalası |
| VOSSE Sp. z o.o. | Polonya | http://vosse.pl/ | http://vosse.pl/kontakt/ | Light steel structures, steel components, tanks and ventilation ducts, Miechucino (Pomorskie) | biuro@vosse.com — sitede: http://vosse.pl/kontakt/ | Aşık ve Çelik Yapı |
| POLAK CZ s.r.o. | Çekya | https://www.haly-polak.cz/ | https://www.haly-polak.cz/cs/m-2-kontakt | Prefabricated steel halls and workshop furniture from own production, Dětřichov/Opatov | obchod.haly@polakcz.cz — sitede: https://www.haly-polak.cz/cs/m-2-kontakt | Aşık ve Çelik Yapı |
| NYPRO hutní prodej, a.s. | Çekya | https://nyprohutni.cz/ | https://nyprohutni.cz/kontakt | Steel stockholder with coil slitting (1.5-12 mm), plate cutting and blasting, Malé Svatoňovice | nypro@nypro.cz — sitede: https://nyprohutni.cz/kontakt | Çelik Servis Merkezi |
| FIVING, s.r.o. | Slovakya | https://fiving.eu/ | https://fiving.eu/ | Manufacture and installation of ventilation and air-conditioning systems for industry, Liptovský Mikuláš | obchod@fiving.sk — sitede: https://fiving.eu/ | Havalandırma Kanalı |
