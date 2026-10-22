# Keşif CX — Google araması + otomatik doğrulama (2026-10-22)

Kaynak: Claude alt ajanı (web araması + sayfa okuma), Pakistan, Bangladeş, Sri Lanka, Nepal çok segmentli tarama (MES onaylı firmalar listesi) — 22 Ekim 2026
"<ürün> üreticisi" aramaları (139 ülke, 10 arama, tur cx). `scripts/hedef-firma-kesif.py --tur cx`.

Her satır otomatik doğrulandı: site açılıyor; segmentin ürünü sayfada geçiyor; firma kendini
ÜRETİCİ olarak tanıtıyor — çelik servis merkezinde dilme/boy kesme/işleme, pres atölyesinde
metal pres/derin çekme işi de sayılır — (arama başlığı/özeti ya da sayfa başlığı, açıklaması, H1'i) ve
başlığında mağaza, kiralama, bayi, ithalatçı izi yok; ülke tutuyor (yerel uzantı ya da sitede
ülke telefon kodu; Dominik Cumhuriyeti için 809/829/849); e-posta firmanın kendi sitesinde
yazıyor ("sitede:" sayfası). Rehber/pazar yeri siteleri ve makine üreticileri (rakip) elendi.
"Ne üretiyor" sütunu Google'daki sayfa başlığı — elle doğrulanmadı.

**Doğrulanmış firma sayısı:** 15 (6 otomatik + 9 elle: ajanın gördüğü e-posta sayfası, ülke adı/telefon/uzantı kontrolü)

| Firma | Ülke | Web sitesi | Doğrulama sayfası | Ne üretiyor | E-posta / İletişim | Segment |
|---|---|---|---|---|---|---|
| Real SS by OMC Steel Limited | Bangladeş | https://omcsteel.com.bd/ | https://omcsteel.com.bd/ | OMC Steel Limited (Real SS) | info@omcsteel.com.bd — sitede: https://omcsteel.com.bd/ | Çelik Servis Merkezi |
| Electroline | Pakistan | https://electroline.com.pk/ | https://electroline.com.pk/ | Electroline | info@electroline.com.pk — sitede: https://electroline.com.pk/ | Kablo Kanalı |
| Ibrahim Porta Cabin | Pakistan | https://ibrahimportacabin.pk/ | https://ibrahimportacabin.pk/ | Ibrahim Porta Cabin Manufacturing Company | info@ibrahimportacabin.pk — sitede: https://ibrahimportacabin.pk/ | Aşık ve Çelik Yapı |
| KEFAB | Pakistan | https://kefab.com.pk/ | https://kefab.com.pk/ | KEFAB (Kashif Enterprise) | info@kefab.com.pk — sitede: https://kefab.com.pk/ | Aşık ve Çelik Yapı |
| Premengg | Pakistan | https://premengg.com/ | http://premengg.com/ | Premium Engineering | info@premengg.com — sitede: https://premengg.com/ | Aşık ve Çelik Yapı |
| Hit Engineering | Sri Lanka | https://www.hiteng.lk/ | https://www.hiteng.lk/ | Hit Engineering (HitEng) | info@hiteng.lk — sitede: https://www.hiteng.lk/ | Çelik Mobilya |
| SECCO PAK (Pvt) Ltd | Pakistan | https://seccopak.com/ | http://seccopak.com/ | Steel and fire-rated doors, porta cabins, PEB and light gauge steel buildings, Sheikhupura Road, Lahore | info@seccopak.com — sitede: http://seccopak.com/ | Aşık ve Çelik Yapı |
| BBJ Pipe Industries | Pakistan | https://bbj.com.pk/ | https://www.bbj.com.pk/our_company.html | ERW steel line pipes, tubes and hollow structural sections mill, Lahore | info@bbj.com.pk — sitede: https://www.bbj.com.pk/our_company.html | Çelik Servis Merkezi |
| CIVOOOL Steel (Pvt) Ltd | Pakistan | https://civoool.com/ | http://civoool.com/ | PEB, H-beams, C/Z purlins, roof sheets and deck profiles with own lines, Lahore | info@civoool.com — sitede: http://civoool.com/ | Aşık ve Çelik Yapı |
| SA Engineering | Pakistan | https://saengineering.com.pk/ | https://saengineering.com.pk/ | Pre-engineered steel buildings and modular sandwich panel buildings, Lahore | info@saengineering.com.pk — sitede: https://saengineering.com.pk/ | Aşık ve Çelik Yapı |
| Nahee SS Pipes Industries Ltd | Bangladeş | https://www.nahee.com.bd/ | https://www.nahee.com.bd/nahee_ss_pipe/index.html | Stainless steel round/box/design pipes, sheets and slitting coils plant, Sreepur, Gazipur | info@nahee.com.bd — sitede: https://www.nahee.com.bd/nahee_ss_pipe/index.html | Çelik Servis Merkezi |
| Steelex (Pvt) Ltd | Pakistan | https://steelex.com.pk/ | http://steelex.com.pk/ | MS/GI pipes, HRC tubes and sections and scaffolding plant (plus plastic pipes), Karachi | sales@steelex.com.pk — sitede: http://steelex.com.pk/ | Çelik Servis Merkezi |
| strykerSafe | Pakistan | https://www.strykersafe.com/ | https://www.strykersafe.com/ | Steel lockers, office cabinets, fireproof safes and security cabinets maker, Gujranwala | sales@strykersafe.com — sitede: https://www.strykersafe.com/ | Çelik Mobilya |
| Victory Pipe Industries (Pvt) Ltd | Pakistan | https://victorypipe.com.pk/ | http://victorypipe.com.pk/ | Scaffolding pipes, steel tubes and electrical poles plus plastic pipes, Islamabad | info@victorypipe.com.pk — sitede: http://victorypipe.com.pk/ | Çelik Servis Merkezi |
| Jamal Pipe Industries | Pakistan | https://jamalpipe.com.pk/ | https://jamalpipe.com.pk/ | MS and GI steel pipes, tubular poles, scaffolding and guardrails, Lahore | info@jamalpipes.com.pk — sitede: https://jamalpipe.com.pk/ | Çelik Servis Merkezi |
