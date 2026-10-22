# Keşif CL — Google araması + otomatik doğrulama (2026-10-22)

Kaynak: Claude alt ajanı (web araması + sayfa okuma), ABD bölgesel çok segmentli tarama (Thomasnet tedarikçi sayfaları) — 22 Ekim 2026
"<ürün> üreticisi" aramaları (139 ülke, 13 arama, tur cl). `scripts/hedef-firma-kesif.py --tur cl`.

Her satır otomatik doğrulandı: site açılıyor; segmentin ürünü sayfada geçiyor; firma kendini
ÜRETİCİ olarak tanıtıyor — çelik servis merkezinde dilme/boy kesme/işleme, pres atölyesinde
metal pres/derin çekme işi de sayılır — (arama başlığı/özeti ya da sayfa başlığı, açıklaması, H1'i) ve
başlığında mağaza, kiralama, bayi, ithalatçı izi yok; ülke tutuyor (yerel uzantı ya da sitede
ülke telefon kodu; Dominik Cumhuriyeti için 809/829/849); e-posta firmanın kendi sitesinde
yazıyor ("sitede:" sayfası). Rehber/pazar yeri siteleri ve makine üreticileri (rakip) elendi.
"Ne üretiyor" sütunu Google'daki sayfa başlığı — elle doğrulanmadı.

**Doğrulanmış firma sayısı:** 26 (11 otomatik + 15 elle: ajanın gördüğü e-posta sayfası, ülke adı/telefon/uzantı kontrolü)

| Firma | Ülke | Web sitesi | Doğrulama sayfası | Ne üretiyor | E-posta / İletişim | Segment |
|---|---|---|---|---|---|---|
| Carolina Carports | ABD | https://carolinacarportsinc.com/ | https://carolinacarportsinc.com/ | Carolina Carports, Inc. | cci@carolinacarportsinc.com — sitede: https://carolinacarportsinc.com/ | Aşık ve Çelik Yapı |
| Coast To Coast Carports | ABD | https://www.coast-to-coastcarports.com/ | https://www.coast-to-coastcarports.com/ | Coast to Coast Carports | info@coast-to-coastcarports.com — sitede: https://www.coast-to-coastcarports.com/ | Aşık ve Çelik Yapı |
| Danser Inc | ABD | https://danserinc.com/ | https://danserinc.com/ | Danser, Inc. | sales@danserinc.com — sitede: https://danserinc.com/ | Havalandırma Kanalı |
| DSKA Steel Inc | ABD | https://dskasteel.com/ | https://dskasteel.com/ | DSKA Steel Incorporated | quotes@dskasteel.com — sitede: https://dskasteel.com/ | Alçıpan Profili |
| Jamar Carports & Portable Buildings | ABD | https://jamarcarports.com/ | https://www.jamarcarports.com/ | Jamar Carports & Portable Buildings | carports1991@gmail.com — sitede: https://jamarcarports.com/ | Aşık ve Çelik Yapı |
| James C. White Company (JCWCO) Instrumentation Support Syste | ABD | https://jcwco.com/ | https://jcwco.com/ | James C. White Co., Inc. | sales@jcwco.com — sitede: https://jcwco.com/ | Kablo Kanalı |
| Keystone Lockers | ABD | https://keystonelockers.com/ | https://keystonelockers.com/ | Keystone Locker Co. | tkling@keystonelockers.com — sitede: https://keystonelockers.com/ | Çelik Mobilya |
| Quality Steel Buildings | ABD | https://www.qualitysteelbuildings.com/ | https://www.qualitysteelbuildings.com/ | Quality Steel Buildings | info@qualitysteelbuildings.com — sitede: https://www.qualitysteelbuildings.com/ | Aşık ve Çelik Yapı |
| Steel Framing Engineering & Manufacturing | ABD | https://texassteelframing.com/ | https://texassteelframing.com/ | Texas Steel Framing | info@texassteelframing.com — sitede: https://texassteelframing.com/ | Aşık ve Çelik Yapı |
| Superior Structural Corporation | ABD | https://superiorstructural.com/ | https://superiorstructural.com/ | Superior Structural Corp. | info@superiorstructural.com — sitede: https://superiorstructural.com/ | Aşık ve Çelik Yapı |
| Vitruvian Steel | ABD | https://www.vitruvian-steel.com/ | https://www.vitruvian-steel.com/ | Vitruvian Steel | projects@vitruvian-steel.com — sitede: https://www.vitruvian-steel.com/ | Aşık ve Çelik Yapı |
| Roof Hugger | ABD | https://roofhugger.com/ | http://roofhugger.com/ | Factory-notched galvanized steel sub-purlin retrofit systems, Lutz FL | sales@roofhugger.com — sitede: http://roofhugger.com/ | Aşık ve Çelik Yapı |
| LTH Steel Structures | ABD | https://www.lthsteelstructures.com/ | https://www.lthsteelstructures.com/ | Steel framing, truss buildings and roof and wall panels, Cumming GA | info@lthsteelstructures.com — sitede: https://www.lthsteelstructures.com/ | Aşık ve Çelik Yapı |
| Tri-State Cold-formed Steel Components | ABD | https://tristatecfs.com/ | https://tristatecfs.com/ | Cold-formed steel roof and floor trusses and load-bearing wall panels, Shepherdsville KY | dcecil@tristatecfs.com — sitede: https://tristatecfs.com/ | Aşık ve Çelik Yapı |
| Sweetwater Steel Co. | ABD | https://sweetwatersteel.net/ | http://www.sweetwatersteel.net/ | Metal roofing and siding run to length on own rolling mill, trim shop, Sweetwater TX | sweetwater@sweetwatersteel.net — sitede: http://www.sweetwatersteel.net/ | Çatı ve Cephe Paneli |
| Steel2Go | ABD | https://steel2go.co/ | https://steel2go.co/ | Light-gauge steel framing and trusses, Winter Springs FL | josec@steel2go.co — sitede: https://steel2go.co/ | Aşık ve Çelik Yapı |
| Promet Processing Corp. | ABD | https://www.prometco.net/ | https://www.prometco.net/ | Stainless steel and aluminum coil slitting, Naperville and Elgin IL | jack@prometco.net — sitede: https://www.prometco.net/ | Çelik Servis Merkezi |
| Grayhawk, LLC | ABD | https://grayhawk-ky.com/ | https://grayhawk-ky.com/ | Cold-formed steel trusses and prefabricated exterior wall panels, Lexington KY | info@grayhawk-ky.com — sitede: https://grayhawk-ky.com/ | Aşık ve Çelik Yapı |
| Pan-Oston | ABD | https://www.panoston.com/ | https://www.panoston.com/contact | Steel checkout lanes, counters and store fixtures, Bowling Green KY | info@panoston.com — sitede: https://www.panoston.com/contact | Market Rafı |
| Mier Products, Inc. | ABD | https://mierproducts.com/ | https://mierproducts.com/ | Sheet metal electrical enclosures and custom metal fabrication, Kokomo IN | info@mierproducts.com — sitede: https://mierproducts.com/ | Pres Atölyeleri |
| Zilla Corporation | ABD | https://zillarac.com/ | https://www.zillarac.com/ | Steel and aluminum tubing solar mounting products made in USA, Lafayette CO | sales@zillarac.com — sitede: https://www.zillarac.com/ | Solar Profil |
| CF Steel LLC | ABD | https://www.flattruss.com/ | https://www.flattruss.com/ | Cold-formed light-gauge steel roof and floor trusses, plants in Midland NC and Walnut Ridge AR | info@cf-steel.com — sitede: https://www.flattruss.com/ | Aşık ve Çelik Yapı |
| R&B Metal Structures | ABD | https://randbmetalstructures.com/ | https://randbmetalstructures.com/ | Custom metal carports, garages and steel buildings fabricated in-house, Jackson GA | help@rbmetal.com — sitede: https://randbmetalstructures.com/ | Aşık ve Çelik Yapı |
| Renfro Industries, Inc. | ABD | https://renfroindustries.com/ | https://renfroindustries.com/ | Bread racks, store display racks and wire and steel POP fixtures, Terrell TX | info@renfromail.com — sitede: https://renfroindustries.com/ | Market Rafı |
| Tri-State Guardrail (formerly Southern Guard Rail Co.) | ABD | https://tristateguardrail.com/ | https://tristateguardrail.com/ | Highway guardrail fabricated to state DOT specs, delivered and installed, Collierville TN | grdrail@bellsouth.net — sitede: https://tristateguardrail.com/ | Yol Bariyeri |
| Louisiana CSI, LLC | ABD | https://www.duct-supply.com/ | http://www.duct-supply.com/ | Spiral and rectangular HVAC duct fabricated in-house, Port Allen LA | sales@la-csi.com — sitede: http://www.duct-supply.com/ | Havalandırma Kanalı |
