# Keşif BP — Google araması + otomatik doğrulama (2026-10-22)

Kaynak: Claude alt ajanı (web araması + sayfa okuma), Avrupa çelik mobilya (dolap, soyunma dolabı, kasa) üreticileri — 22 Ekim 2026
"<ürün> üreticisi" aramaları (139 ülke, 19 arama, tur bp). `scripts/hedef-firma-kesif.py --tur bp`.

Her satır otomatik doğrulandı: site açılıyor; segmentin ürünü sayfada geçiyor; firma kendini
ÜRETİCİ olarak tanıtıyor — çelik servis merkezinde dilme/boy kesme/işleme, pres atölyesinde
metal pres/derin çekme işi de sayılır — (arama başlığı/özeti ya da sayfa başlığı, açıklaması, H1'i) ve
başlığında mağaza, kiralama, bayi, ithalatçı izi yok; ülke tutuyor (yerel uzantı ya da sitede
ülke telefon kodu; Dominik Cumhuriyeti için 809/829/849); e-posta firmanın kendi sitesinde
yazıyor ("sitede:" sayfası). Rehber/pazar yeri siteleri ve makine üreticileri (rakip) elendi.
"Ne üretiyor" sütunu Google'daki sayfa başlığı — elle doğrulanmadı.

**Doğrulanmış firma sayısı:** 17 (4 otomatik + 13 elle: ajanın gördüğü e-posta sayfası, ülke adı/telefon/uzantı kontrolü)

| Firma | Ülke | Web sitesi | Doğrulama sayfası | Ne üretiyor | E-posta / İletişim | Segment |
|---|---|---|---|---|---|---|
| Bigla | İsviçre | https://bigla.ch/ | https://bigla.ch/ | Bigla AG | info@bigla.ch — sitede: https://bigla.ch/ | Çelik Mobilya |
| Zesar.ch | İsviçre | https://zesar.ch/ | https://zesar.ch/ | Zesar.ch AG | info@zesar.ch — sitede: https://zesar.ch/ | Çelik Mobilya |
| Favero Health Projects | İtalya | https://www.favero.it/ | https://www.favero.it/ | Favero Health Projects | info@favero.it — sitede: https://www.favero.it/ | Çelik Mobilya |
| Storage solutions for industries and workshops | İtalya | https://www.fameplastorage.com/ | https://www.fameplastorage.com/ | Famepla S.r.l. | commerce@fameplastorage.com — sitede: https://www.fameplastorage.com/en-us/contacts | Çelik Mobilya |
| SCG - Fábrica de Cofres de Gondezende | Portekiz | https://scgcofres.com/ | https://scgcofres.com/ | High-security steel safes and strong doors made in own factory, Esmoriz | geral@scgcofres.com — sitede: https://scgcofres.com/ | Çelik Mobilya |
| JOMA (José María Gallastegui y Cía) | İspanya | https://joma.es/en/home | https://joma.es/en/home | Mailboxes, key cabinets, cash boxes and safes made in own plant, Legutio (Álava) | joma@joma.es — sitede: https://joma.es/en/home | Çelik Mobilya |
| Industrial Laborum | Portekiz | https://www.industriallaborum.com/ | https://www.industriallaborum.com/contactos/ | Laboratory, hospital and school technical furniture, benches and fume hoods made in own plant, Albergaria-a-Velha | comercial@industriallaborum.com — sitede: https://www.industriallaborum.com/contactos/ | Çelik Mobilya |
| Scrosati Arredamenti Metallici | İtalya | https://scrosati.com/ | https://www.scrosati.com/ | Metal furniture for schools, offices and healthcare plus tube/sheet processing, Lonate Pozzolo (VA) | scrosati@scrosati.com — sitede: https://www.scrosati.com/ | Çelik Mobilya |
| Metalpharm | İtalya | https://www.metalpharm.com/ | http://www.metalpharm.com/en/company.html | Stainless steel furniture for pharma, hospital, lab, storage and changing rooms, San Polo di Piave (TV) | info@metalpharm.com — sitede: http://www.metalpharm.com/en/company.html | Çelik Mobilya |
| Riva Office (Ricardo & Vaz) | Portekiz | https://www.riva-office.fr/fr/ | https://www.riva-office.fr/fr/ | Steel office furniture, metal cabinets and lockers maker, Braga (Parque Industrial de Sequeira) | info@riva-office.fr — sitede: https://www.riva-office.fr/fr/ | Çelik Mobilya |
| Silmec Zardini | İtalya | https://www.silmec.it/ | https://www.silmec.it/ | Made-in-Italy steel safes, armoured and gun cabinets, Sona (VR) | info@silmec.it — sitede: https://www.silmec.it/ | Çelik Mobilya |
| Armeco S.r.l. | İtalya | https://www.armeco.it/ | https://www.armeco.it/ | Metal furniture for industry and offices: workbenches, cabinets, changing-room lockers, filing units, Galbiate (LC) | armeco@armeco.it — sitede: https://www.armeco.it/ | Çelik Mobilya |
| Sarpsborg Metall AS | Norveç | https://www.sarpsborgmetall.no/ | https://www.sarpsborgmetall.no/ | Steel wardrobe lockers and storage cabinets for schools, offices and industry, Borgenhaugen (Sarpsborg) | post@sarpsborgmetall.no — sitede: https://www.sarpsborgmetall.no/ | Çelik Mobilya |
| PROMACOM s.r.o. | Çekya | https://www.promacom.cz/ | https://www.promacom.cz/kontakty/ | Metal workshop, laboratory and changing-room furniture made in Czechia, Kuřim | promacom@promacom.cz — sitede: https://www.promacom.cz/kontakty/ | Çelik Mobilya |
| Facilitas S.r.l. | İtalya | https://facilitas.it/ | https://www.facilitas.it/ | Stainless steel locker, storage and changing-room cabinets made in-house, Castelnuovo Rangone (MO) | facilitas@facilitas.it — sitede: https://www.facilitas.it/ | Çelik Mobilya |
| L'Italiana Casseforti | İtalya | https://www.italianacassefortifirenze.it/ | https://www.italianacassefortifirenze.it/ | Safes, security cabinets, strongrooms and vault doors built in own factory, Castelfiorentino (FI) | info@italianacasseforti.it — sitede: https://www.italianacassefortifirenze.it/ | Çelik Mobilya |
| SAM Outillage | Fransa | https://www.sam-outillage.com/ | https://www.sam-outillage.com/ | Tools plus roller cabinets, workbenches and workshop storage designed and made in Saint-Étienne | sam@sam.eu — sitede: https://www.sam-outillage.com/ | Çelik Mobilya |
