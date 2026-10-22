# Keşif CI — Google araması + otomatik doğrulama (2026-10-22)

Kaynak: Claude alt ajanı (web araması + sayfa okuma), Arjantin, Şili, Uruguay, Paraguay, Ekvador, Bolivya çok segmentli tarama — 22 Ekim 2026
"<ürün> üreticisi" aramaları (139 ülke, 22 arama, tur ci). `scripts/hedef-firma-kesif.py --tur ci`.

Her satır otomatik doğrulandı: site açılıyor; segmentin ürünü sayfada geçiyor; firma kendini
ÜRETİCİ olarak tanıtıyor — çelik servis merkezinde dilme/boy kesme/işleme, pres atölyesinde
metal pres/derin çekme işi de sayılır — (arama başlığı/özeti ya da sayfa başlığı, açıklaması, H1'i) ve
başlığında mağaza, kiralama, bayi, ithalatçı izi yok; ülke tutuyor (yerel uzantı ya da sitede
ülke telefon kodu; Dominik Cumhuriyeti için 809/829/849); e-posta firmanın kendi sitesinde
yazıyor ("sitede:" sayfası). Rehber/pazar yeri siteleri ve makine üreticileri (rakip) elendi.
"Ne üretiyor" sütunu Google'daki sayfa başlığı — elle doğrulanmadı.

**Doğrulanmış firma sayısı:** 24 (5 otomatik + 19 elle: ajanın gördüğü e-posta sayfası, ülke adı/telefon/uzantı kontrolü)

| Firma | Ülke | Web sitesi | Doğrulama sayfası | Ne üretiyor | E-posta / İletişim | Segment |
|---|---|---|---|---|---|---|
| Emlujan | Arjantin | https://emlujan.com.ar/ | https://www.emlujan.com.ar/ | Estructuras Metálicas Luján (Tinglados Luján) | info@emlujan.com.ar — sitede: https://emlujan.com.ar/ | Aşık ve Çelik Yapı |
| Galeano Hnos S.R.L | Arjantin | https://www.galeanohnos.com.ar/ | https://www.galeanohnos.com.ar/ | Galeano Hnos S.R.L. | galeanohnos@yahoo.com.ar — sitede: https://www.galeanohnos.com.ar/ | Aşık ve Çelik Yapı |
| Millerbi | Arjantin | https://millerbi.net/ | https://millerbi.net/ | Miller Building International | info@millerbi.net — sitede: https://millerbi.net/ | Aşık ve Çelik Yapı |
| TISI Estructuras Metálicas | Arjantin | https://www.tisi.com.ar/ | https://www.tisi.com.ar/ | TISI S.A. (Constantino D. Tisi y Hnos.) | info@tisi.com.ar — sitede: https://www.tisi.com.ar/ | Aşık ve Çelik Yapı |
| SICAL Ingeniería | Ekvador | https://sical.com.ec/ | https://sical.com.ec/ | SICAL Ingeniería | proyectos@sical.com.ec — sitede: https://sical.com.ec/ | Kablo Kanalı |
| Perfiles y Tubos de Acero Almarza S.A. | Şili | https://almarza.cl/ | https://almarza.cl/ | Road guardrails (NCh 2032 / EN 1317), open and closed steel profiles, tubes and sign posts, Til Til, Santiago, Chile | ventas@almarza.cl — sitede: https://almarza.cl/ | Yol Bariyeri |
| Metal Luras SpA | Şili | https://www.metalluras.cl/ | https://www.metalluras.cl/ | CNC steel plate cutting, bending, cylindering and light structures, Cerrillos, Santiago, Chile | ventas@metalluras.cl — sitede: https://www.metalluras.cl/ | Çelik Servis Merkezi |
| Galvanizadora y Metales S.A. (GYMSA) | Şili | https://gymsa.cl/ | https://gymsa.cl/ | Ladder, smooth and slotted galvanized cable trays plus hot-dip galvanizing, San Bernardo, Santiago, Chile | ventas@gymsa.cl — sitede: https://gymsa.cl/ | Kablo Kanalı |
| Ferrocentro (Maestranza Maipú) | Şili | https://www.ferrocentro.cl/index/ | https://www.ferrocentro.cl/ | Welded and press-folded steel profiles, sized plates, coil leveling, piping and boilermaking, Maipú, Santiago, Chile | ferrocentro@ferrocentro.cl — sitede: https://www.ferrocentro.cl/ | Çelik Servis Merkezi |
| ETC S.A. | Arjantin | https://etc.com.ar/ | https://etc.com.ar/ | Expanded metal and perforated steel sheet manufacturer, plus finishing profiles and gratings, Buenos Aires, Argentina | ventas@etc.com.ar — sitede: https://etc.com.ar/ | Çelik Servis Merkezi |
| Aceros Diezco S.A. | Şili | https://acerosdiezco.cl/ | https://acerosdiezco.cl/ | Custom cut-and-folded steel profiles, galvanized profiles and galvanizing service, Talcahuano, Biobío, Chile | ventas@acerosdiezco.cl — sitede: https://acerosdiezco.cl/ | Çelik Servis Merkezi |
| Metalúrgica Bermúdez - Tecnotril S.A. | Uruguay | https://tecnotril.com/ | https://www.tecnotril.com/ | Sheet-metal cutting, guillotine shearing, folding, rolling and punching services, Montevideo, Uruguay | info@tecnotril.com — sitede: https://www.tecnotril.com/ | Çelik Servis Merkezi |
| Gebi Ingeniería Metálica | Uruguay | https://gebi.com.uy/ | https://www.gebi.com.uy/ | Guillotine cutting, CNC folding, rolling, punching and laser cutting of steel sheet, Montevideo, Uruguay | gebi@gebi.com.uy — sitede: https://www.gebi.com.uy/ | Çelik Servis Merkezi |
| MTA Ingeniería | Uruguay | https://mtaingenieria.com/ | https://www.mtaingenieria.com/ | Fabrication and erection of steel structures and industrial sheds (galpones), Medabil building-system builder, Montevideo, Uruguay | mtaingenieria@mtaingenieria.com — sitede: https://www.mtaingenieria.com/ | Aşık ve Çelik Yapı |
| Metalúrgica Vera | Paraguay | https://metalurgicavera.com.py/ | https://www.metalurgicavera.com.py/ | Welded built-up steel profiles, metal buildings, industrial sheds and roofing, steel bridges and silos, plant in Ypané, Paraguay | contacto@metalurgicavera.com.py — sitede: https://www.metalurgicavera.com.py/ | Aşık ve Çelik Yapı |
| Talleres Filippini S.R.L. | Arjantin | https://filippinisrl.com.ar/ | https://filippinisrl.com.ar/ | Stamped steel parts on automatic presses with in-house dies, laser/plasma cutting, bending and welded agricultural assemblies, Villa Gobernador Gálvez, Santa Fe | talleresfilippinisrl@gmail.com — sitede: https://filippinisrl.com.ar/ | Pres Atölyeleri |
| Tecnimetal | Paraguay | https://tecnimetal.com.py/ | https://www.tecnimetal.com.py/ | Fabrication and installation of metal, thermo-acoustic roofs and sheds (tinglados) with own steel structures, Luque, Paraguay | info@tecnimetal.com.py — sitede: https://www.tecnimetal.com.py/ | Aşık ve Çelik Yapı |
| B. Salgado | Uruguay | https://salgado.com.uy/ | https://www.salgado.com.uy/ | Metal school and office furniture, benches and playground equipment from own factory, Montevideo, Uruguay | ventas@salgado.com.uy — sitede: https://www.salgado.com.uy/ | Çelik Mobilya |
| Imel - Industria Metalúrgica Ltda. | Şili | https://imel-steel.com/ | https://imel-steel.com/ | Steel pipes, tubes and galvanized profiles, cutting and straightening, pre-painted roofing, San Bernardo, Santiago, Chile | contacto@imel.cl — sitede: https://imel-steel.com/ | Çelik Servis Merkezi |
| Acirón Metales | Paraguay | https://www.acironmetales.com/ | https://www.acironmetales.com/ | Steel sheet cutting, folding and rolling with own press brakes, guillotines and rolls, plus steel products, Asunción, Paraguay | digital@aciron.com.py — sitede: https://www.acironmetales.com/ | Çelik Servis Merkezi |
| Indumac - Industria Metalúrgica Aconcagua Ltda. | Şili | https://www.indumacequipamientos.cl/ | https://www.indumacequipamientos.cl/ | Metal school and office furniture, lockers and storage furniture, San Felipe, Valparaíso, Chile | ventas@indumac.cl — sitede: https://www.indumacequipamientos.cl/ | Çelik Mobilya |
| ROTA S.A. | Arjantin | https://www.rota.com.ar/ | https://www.rota.com.ar/ | Steel structures, industrial buildings, sheds and solid-web frames plus metal roofing and facade systems (U-45 profile), plant in Villa Mercedes, San Luis, Arge | ventas@rota-sa.com — sitede: https://www.rota.com.ar/ | Aşık ve Çelik Yapı |
| Stanfor S.R.L. | Arjantin | https://www.stanfor.com.ar/ | https://www.stanfor.com.ar/ | Metal office, industrial and hospital furniture manufacturer since 1944, José Ingenieros, Buenos Aires, Argentina | info@stanforsrl.com.ar — sitede: https://www.stanfor.com.ar/ | Çelik Mobilya |
| Zambon Acerorack | Şili | https://zambonacerorack.com/ | https://zambonacerorack.com/ | Selective, drive-in, cantilever and push-back pallet racks and mezzanines, 25,000 m2 plants in San Bernardo and Champa, Chile | ventas@acerorack.cl — sitede: https://zambonacerorack.com/ | Raf Sistemleri |
