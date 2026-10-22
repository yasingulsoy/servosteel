# Keşif CB — Google araması + otomatik doğrulama (2026-10-22)

Kaynak: Claude alt ajanı (web araması + sayfa okuma), Brezilya eyalet eyalet çok segmentli tarama — 22 Ekim 2026
"<ürün> üreticisi" aramaları (139 ülke, 11 arama, tur cb). `scripts/hedef-firma-kesif.py --tur cb`.

Her satır otomatik doğrulandı: site açılıyor; segmentin ürünü sayfada geçiyor; firma kendini
ÜRETİCİ olarak tanıtıyor — çelik servis merkezinde dilme/boy kesme/işleme, pres atölyesinde
metal pres/derin çekme işi de sayılır — (arama başlığı/özeti ya da sayfa başlığı, açıklaması, H1'i) ve
başlığında mağaza, kiralama, bayi, ithalatçı izi yok; ülke tutuyor (yerel uzantı ya da sitede
ülke telefon kodu; Dominik Cumhuriyeti için 809/829/849); e-posta firmanın kendi sitesinde
yazıyor ("sitede:" sayfası). Rehber/pazar yeri siteleri ve makine üreticileri (rakip) elendi.
"Ne üretiyor" sütunu Google'daki sayfa başlığı — elle doğrulanmadı.

**Doğrulanmış firma sayısı:** 28 (7 otomatik + 21 elle: ajanın gördüğü e-posta sayfası, ülke adı/telefon/uzantı kontrolü)

| Firma | Ülke | Web sitesi | Doğrulama sayfası | Ne üretiyor | E-posta / İletişim | Segment |
|---|---|---|---|---|---|---|
| Artefatos de Chapas | Brezilya | https://www.artefatosdechapas.com.br/ | https://www.artefatosdechapas.com.br/ | Artefatos de Chapas | contato@artefatosdechapas.com.br — sitede: https://www.artefatosdechapas.com.br/ | Çelik Servis Merkezi |
| Cozimax | Brezilya | https://www.cozimax.com.br/ | https://www.cozimax.com.br/ | Cozimax Móveis de Aço | atendimento@cozimax.com.br — sitede: https://www.cozimax.com.br/ | Çelik Mobilya |
| Decide Estruturas Metálicas | Brezilya | https://www.decideestruturas.com.br/ | https://www.decideestruturas.com.br/ | Decide Estruturas Metálicas | orcamento@decideestruturas.com.br — sitede: https://www.decideestruturas.com.br/ | Aşık ve Çelik Yapı |
| Ieklo | Brezilya | https://www.ieklo.com.br/ | https://www.ieklo.com.br/ | Ieklo Estruturas Metálicas | contato@ieklo.com.br — sitede: https://www.ieklo.com.br/ | Aşık ve Çelik Yapı |
| Master Fort Telhas | Brezilya | https://www.masterforttelhas.com.br/ | https://www.masterforttelhas.com.br/ | Master Fort Telhas | contato@masterforttelhas.com.br — sitede: https://www.masterforttelhas.com.br/ | Çatı ve Cephe Paneli |
| Telasul | Brezilya | https://www.telasul.com.br/ | https://www.telasul.com.br/ | Telasul | sac@telasul.com.br — sitede: https://www.telasul.com.br/ | Çelik Mobilya |
| Weloze | Brezilya | https://weloze.com.br/ | https://www.weloze.com.br/ | Weloze Parts | vendas@weloze.com.br — sitede: https://weloze.com.br/contato/ | Pres Atölyeleri |
| Proveraço Telhas Metálicas | Brezilya | https://proveracotelhas.com.br/ | https://www.proveracotelhas.com.br/ | Metal and thermoacoustic roofing tiles, panels and flashings maker, Piracicaba SP | contato@proveracotelhas.com.br — sitede: https://www.proveracotelhas.com.br/ | Çatı ve Cephe Paneli |
| Metalúrgica Goronci | Brezilya | https://metalurgicagoronci.com.br/ | https://metalurgicagoronci.com.br/contato | Steel sheet forming, stamping, laser/plasma cutting and electrical hardware, Serra ES | vendas@metalurgicagoronci.com.br — sitede: https://metalurgicagoronci.com.br/contato | Pres Atölyeleri |
| Metalrezende | Brezilya | https://www.metalrezende.com.br/ | https://www.metalrezende.com.br/ | Stamped and spot/projection-welded parts for automotive and electrical industry, Indaiatuba SP | metalrezende@metalrezende.com.br — sitede: https://www.metalrezende.com.br/ | Pres Atölyeleri |
| Aço Itália Indústria Metalúrgica | Brezilya | https://acoitalia.com.br/ | https://www.acoitalia.com.br/ | Steel plate cutting (laser, waterjet, guillotine), press-brake bending, profiles and roofing tiles, Aparecida de Goiânia GO | contato@acoitalia.com.br — sitede: https://www.acoitalia.com.br/ | Çelik Servis Merkezi |
| Estruturas Metálicas Broilo | Brezilya | https://estruturasbroilo.com.br/ | https://www.estruturasbroilo.com.br/ | Steel structures for industrial and commercial buildings, fabrication and erection, Estância Velha RS | atendimento@estruturasbroilo.com.br — sitede: https://www.estruturasbroilo.com.br/ | Aşık ve Çelik Yapı |
| Chaperfil | Brezilya | https://chaperfil.com.br/ | https://www.chaperfil.com.br/ | Steel coil/sheet processing, cut and bent profiles and roofing tiles, two plants in Contagem MG | chaperfil@chaperfil.com.br — sitede: https://www.chaperfil.com.br/ | Çelik Servis Merkezi |
| Malcon Metalúrgica | Brezilya | https://malconmetalurgica.com.br/ | https://www.malconmetalurgica.com.br/ | Custom sheet-metal parts and enclosures, Americana SP and São José da Lapa MG | vendas@malconmetalurgica.com.br — sitede: https://www.malconmetalurgica.com.br/ | Pres Atölyeleri |
| Unylaser | Brezilya | https://unylaser.com.br/pt/ | https://www.unylaser.com.br/ | Laser-cut and formed steel components for agricultural and construction equipment, Caxias do Sul RS | comercial@unylaser.com.br — sitede: https://www.unylaser.com.br/ | Pres Atölyeleri |
| Aços Riograndense | Brezilya | https://acosriograndense.com.br/ | https://acosriograndense.com.br/ | Steel plate stock with cut-to-size, corte e dobra and bent profiles, Porto Alegre RS | vendas@acosriograndense.com.br — sitede: https://acosriograndense.com.br/ | Çelik Servis Merkezi |
| Tecnostahl | Brezilya | https://tecnostahl.com.br/ | https://www.tecnostahl.com.br/ | Steel warehouse structures and mezzanines plus laser/plasma cutting and bending, Teutônia RS | vendas@tecnostahl.com.br — sitede: https://www.tecnostahl.com.br/ | Aşık ve Çelik Yapı |
| Contel | Brezilya | https://www.contel.com.br/ | https://www.contel.com.br/ | Steel structures for warehouses, mezzanines, roofs and solar ground mounts, Aparecida de Goiânia GO | contato@contel.com.br — sitede: https://www.contel.com.br/ | Aşık ve Çelik Yapı |
| Ferraris Metal Indústria e Engenharia | Brezilya | https://ferraris.com.br/ | https://ferraris.com.br/ | Steel shelving, mini pallet racks and steel lockers manufacturer, Campinas SP | contato@ferraris.com.br — sitede: https://ferraris.com.br/ | Raf Sistemleri |
| Telamix Metalurgia e Movelaria | Brezilya | https://www.telamix.com.br/ | https://www.telamix.com.br/ | Metal displays and gondolas, sheet cutting, bending, stamping and powder coating, Salvador BA | atendimento@telamix.com.br — sitede: https://www.telamix.com.br/ | Market Rafı |
| Grupo Amply | Brezilya | https://grupoamply.com.br/ | https://www.grupoamply.com.br/ | Steel cabinets, shelving, workbenches, gondolas and lockers maker, Sorocaba SP | comercial@grupoamply.com.br — sitede: https://www.grupoamply.com.br/ | Çelik Mobilya |
| Movimat Estruturas Metálicas | Brezilya | https://movimat.com.br/ | https://www.movimat.com.br/ | Steel structure fabricator with own plant, Blumenau SC | vendas@movimat.com.br — sitede: https://www.movimat.com.br/ | Aşık ve Çelik Yapı |
| Control Metalúrgica | Brezilya | https://controlmetalurgica.com.br/ | https://controlmetalurgica.com.br/ | Steel structures and modular steel buildings made in own plant, Almirante Tamandaré PR | modular@controlmetalurgica.com.br — sitede: https://controlmetalurgica.com.br/ | Aşık ve Çelik Yapı |
| Dynamo Estruturas | Brezilya | https://dynamoestruturas.com.br/ | https://dynamoestruturas.com.br/ | Galvanized steel PV ground-mount, carport and pole structures, plants in São José dos Pinhais PR and Betim MG | contato@dynamoestruturas.com.br — sitede: https://dynamoestruturas.com.br/ | Solar Profil |
| Fermara | Brezilya | https://fermara.com.br/ | https://www.fermara.com.br/ | Supermarket gondolas, checkouts and refrigerated counters maker since 1970, Santa Bárbara d'Oeste SP | vendas@fermara.com.br — sitede: https://www.fermara.com.br/ | Market Rafı |
| Perlima Metais Perfurados | Brezilya | https://www.perlima.ind.br/ | https://www.perlima.ind.br/ | Perforated and expanded plates and sieves for sugar mills, Cordeirópolis SP | vendas@perlima.com.br — sitede: https://www.perlima.ind.br/ | Pres Atölyeleri |
| IMF Lince Indústria Metalúrgica | Brezilya | https://imflince.com.br/ | https://imflince.com.br/contato/ | Steel gondolas, checkouts, displays and pallet racks for retail, Araçatuba SP | comercial@fabrao.com.br — sitede: https://imflince.com.br/contato/ | Market Rafı |
| Portoni Estruturas Metálicas | Brezilya | https://www.portoni.com.br/ | https://www.portoni.com.br/ | Structural steel fabrication, painting and erection, Lençóis Paulista SP | portoni@lpnet.com.br — sitede: https://www.portoni.com.br/ | Aşık ve Çelik Yapı |
