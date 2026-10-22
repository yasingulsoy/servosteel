# Keşif CM — Google araması + otomatik doğrulama (2026-10-22)

Kaynak: Claude alt ajanı (web araması + sayfa okuma), İtalya bölge bölge çok segmentli tarama — 22 Ekim 2026
"<ürün> üreticisi" aramaları (139 ülke, 12 arama, tur cm). `scripts/hedef-firma-kesif.py --tur cm`.

Her satır otomatik doğrulandı: site açılıyor; segmentin ürünü sayfada geçiyor; firma kendini
ÜRETİCİ olarak tanıtıyor — çelik servis merkezinde dilme/boy kesme/işleme, pres atölyesinde
metal pres/derin çekme işi de sayılır — (arama başlığı/özeti ya da sayfa başlığı, açıklaması, H1'i) ve
başlığında mağaza, kiralama, bayi, ithalatçı izi yok; ülke tutuyor (yerel uzantı ya da sitede
ülke telefon kodu; Dominik Cumhuriyeti için 809/829/849); e-posta firmanın kendi sitesinde
yazıyor ("sitede:" sayfası). Rehber/pazar yeri siteleri ve makine üreticileri (rakip) elendi.
"Ne üretiyor" sütunu Google'daki sayfa başlığı — elle doğrulanmadı.

**Doğrulanmış firma sayısı:** 24 (4 otomatik + 20 elle: ajanın gördüğü e-posta sayfası, ülke adı/telefon/uzantı kontrolü)

| Firma | Ülke | Web sitesi | Doğrulama sayfası | Ne üretiyor | E-posta / İletişim | Segment |
|---|---|---|---|---|---|---|
| Etermet | İtalya | https://www.etermet.com/ | https://www.etermet.com/ | Etermet s.r.l. | info@etermet.com — sitede: https://www.etermet.com/ | Raf Sistemleri |
| Italiana Carpenterie | İtalya | https://www.italianacarpenterie.it/ | https://www.italianacarpenterie.it/ | Italiana Carpenterie | info@italianacarpenterie.it — sitede: https://www.italianacarpenterie.it/ | Aşık ve Çelik Yapı |
| Massignani | İtalya | https://www.massignani.it/ | https://www.massignani.it/ | Massignani & C. Srl | info@massignani.it — sitede: https://www.massignani.it/ | Solar Profil |
| Memstampaggio | İtalya | https://www.memstampaggio.it/ | https://www.memstampaggio.it/ | M&M S.r.l. | info@memstampaggio.it — sitede: https://www.memstampaggio.it/ | Pres Atölyeleri |
| De Dominicis Lamiere | İtalya | https://www.dedominicislamiere.com/ | https://www.dedominicislamiere.com/contatti.php | Coil slitting, levelling, profiling, corrugated sheets and insulated panels, Villanova di Cepagatti (PE) | info@dedominicislamiere.com — sitede: https://www.dedominicislamiere.com/contatti.php | Çelik Servis Merkezi |
| Cremonini Virgilio Scaffalature | İtalya | https://www.cremoniniscaffali.it/ | https://www.cremoniniscaffali.it/ | Shelving producer since 1965 with own sheet cutting/bending department, incl. shop shelving, Crevalcore (BO) | cremonini@cremoniniscaffali.it — sitede: https://www.cremoniniscaffali.it/ | Market Rafı |
| Sidertirrenica S.r.l. | İtalya | https://sidertirrenica.it/ | http://www.sidertirrenica.it/ | Steel service centre with two slitter and two levelling lines for coils up to 1,860 mm, Follonica (GR) | info@sidertirrenica.it — sitede: http://www.sidertirrenica.it/ | Çelik Servis Merkezi |
| Bono Roch Elvo & C. snc | İtalya | https://www.bonorochsnc.com/ | https://www.bonorochsnc.com/ | Production and sale of corrugated roofing sheets and insulated panels, Torre Canavese (TO) | bonorochf@gmail.com — sitede: https://www.bonorochsnc.com/ | Çatı ve Cephe Paneli |
| IperProfil | İtalya | https://iperprofil.it/ | https://iperprofil.it/ | Special cold-formed steel profiles from galvanized, pre-painted and stainless coils, Villa Lagarina (TN) | commerciale@iperprofil.it — sitede: https://iperprofil.it/ | Aşık ve Çelik Yapı |
| Italprofili Srl | İtalya | https://italprofili.it/ | https://www.italprofili.it/ | Sheet-metal forming: custom profiles, cladding panels, box sections and corrugated sheets, Torgiano (PG) | info@italprofili.it — sitede: https://www.italprofili.it/ | Çatı ve Cephe Paneli |
| Mec System Srl | İtalya | https://www.mec-system.net/ | https://www.mec-system.net/ | Industrial metal shelving, pallet racking and mezzanines (CISI member), Roseto degli Abruzzi (TE) | info@mec-system.net — sitede: https://www.mec-system.net/ | Raf Sistemleri |
| Sell Condotte | İtalya | https://www.sellcondotte.it/ | https://www.sellcondotte.it/contatti/ | Production and installation of rectangular and circular galvanized air ducts, Collegno (TO) | contatti@sellcondotte.it — sitede: https://www.sellcondotte.it/contatti/ | Havalandırma Kanalı |
| AirSystem Impianti | İtalya | https://airsystemimpianti.com/ | https://www.airsystemimpianti.com/servizi/canalizzazioni-e-reti-aerauliche.html | Produces air distribution ducts in galvanized sheet and pre-insulated aluminium, Torino | info@airsystemimpianti.com — sitede: https://www.airsystemimpianti.com/servizi/canalizzazioni-e-reti-aerauliche.html | Havalandırma Kanalı |
| Ideal Profil Srl | İtalya | https://idealprofil.com/it/ | http://www.idealprofil.com/ | Cold-formed commercial and special steel profiles and shaped tubes, Beinasco (TO) | info@idealprofil.com — sitede: http://www.idealprofil.com/ | Aşık ve Çelik Yapı |
| Caschera Profilati S.r.l. | İtalya | https://cascheraprofilati.com/ | https://cascheraprofilati.com/ | Coil processing (main activity): flat products, corrugated sheets, floor decks, profiles and tubes, Castelliri (FR) | info@cascheraprofilati.com — sitede: https://cascheraprofilati.com/ | Çelik Servis Merkezi |
| De.Sco. S.r.l. | İtalya | https://www.descosrl.com/ | https://www.descosrl.com/ | Production of industrial and metal furniture and shelving, Campodarsego (PD) | info@descosrl.com — sitede: https://www.descosrl.com/ | Çelik Mobilya |
| Eco Due | İtalya | https://www.ecodue.com/ | https://www.ecodue.com/ | Makes rectangular and circular galvanized/stainless air ducts in own production workshop, Porcia (PN) | info@ecodue.com — sitede: https://www.ecodue.com/ | Havalandırma Kanalı |
| Ferlat Acciai S.p.A. | İtalya | https://www.ferlatacciai.com/it/ | https://www.ferlatacciai.com/it/contatti/ | Steel service centre: coil flattening and reduction, shearing, plasma cutting; sites Altavilla Vicentina (VI) and Modugno (BA) | info@ferlatacciai.com — sitede: https://www.ferlatacciai.com/it/contatti/ | Çelik Servis Merkezi |
| Nekso S.r.l. | İtalya | https://www.nekso.it/ | https://www.nekso.it/ | Produces galvanized steel profiles (Metalliko) for plasterboard walls and ceilings, San Martino di Lupari (PD) | info@nekso.it — sitede: https://www.nekso.it/ | Alçıpan Profili |
| ICAM Arredamenti S.r.l. | İtalya | https://icamarredamenti.it/ | https://www.icamarredamenti.it/ | Producer of metal office furniture, cabinets and filing units since 1968, Saronno (VA) | icam@icamarredamenti.it — sitede: https://www.icamarredamenti.it/ | Çelik Mobilya |
| Block Sistem | İtalya | https://www.blocksistem.com/ | https://www.blocksistem.com/contatti/ | Producer of certified metal shelving, pallet and cantilever racking, Monteprandone (AP) | info@blocksistem.it — sitede: https://www.blocksistem.com/contatti/ | Raf Sistemleri |
| Muzzolon Industries (Msolar) | İtalya | https://www.msolar.it/ | https://www.msolar.it/carport-fotovoltaico-verona.php?lang=en | Galvanized steel PV carports and canopies made in 45,000 m2 plant, Strà-Montanara-Pieve (VR) | info@muzzolonindustries.com — sitede: https://www.msolar.it/carport-fotovoltaico-verona.php?lang=en | Solar Profil |
| Tubi S.p.A. | İtalya | https://www.tubi-spa.com/ | https://www.tubi-spa.com/en/contact-us/ | Production and trade of welded and seamless steel pipes, plants Rieti and Rovigo, HQ Chieti | info@tubi-spa.it — sitede: https://www.tubi-spa.com/en/contact-us/ | Çelik Servis Merkezi |
| Aldo Del Carlo Lamiere | İtalya | https://www.aldodelcarlolamiere.it/ | https://www.aldodelcarlolamiere.it/ | Coil processing into galvanized/pre-painted sheets, corrugated roofing sheets and formed profiles, Porcari (LU) | aldodelcarlolamiere@aruba.it — sitede: https://www.aldodelcarlolamiere.it/ | Çatı ve Cephe Paneli |
