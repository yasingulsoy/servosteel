/**
 * Tanıtım e-postasındaki bağlantıdan gelen ziyareti kendi veritabanımıza
 * yazan sayfa içi betik (bkz. components/analytics.tsx, api/olay).
 *
 * `utm_content` o maili alan firmanın alan adı, yani panelde "kim tıkladı"
 * görünür; GA4 bunu firma bazında söyleyemiyor. Çerez ve IP yok.
 *
 * İKİ İŞARET, TEK SATIR. Kurumsal alıcıların güvenlik tarayıcısı (Microsoft
 * Defender, Mimecast, Proofpoint…) mail teslim edilir edilmez içindeki bütün
 * bağlantıları gerçek bir tarayıcıda açıyor; bu betik orada da çalışıyor.
 * 25-27 Eylül 2026'daki 77 tıklamanın 71'i böyleydi. Tarayıcıların çoğu
 * sayfayı açıp hiçbir şey yapmadan kapatıyor; insan fareyi oynatıyor,
 * kaydırıyor, dokunuyor. Bu yüzden açılışta `etkilesim: false` gider, ilk
 * gerçek hareketle aynı `gorunum` kimliğiyle `true` gider; sunucu ikisini tek
 * satırda birleştirir.
 *
 * Hareket kesin kanıt DEĞİL: bir tarayıcı türü ilk turda fare/tuş olayı
 * üretiyor (28 Eylül). Onu açılış düzeni ele veriyor: aynı saniyede birden
 * çok bağlantı açılıyor, 20-40 sn sonra aynı sayfalara ikinci tur geliyor.
 * Karar sunucuda veriliyor: bkz. outreach-db TIKLAMALAR.
 *
 * Kaydırma (`scroll`) bilerek sayılmıyor: betikle kaydırılabilir. Fare
 * hareketinde yer değişimi sıfırsa sayılmıyor: tarayıcı, sayfa imlecin
 * altında kayınca kendiliğinden sıfır hareketli `mousemove` üretiyor.
 * Betikle üretilen olay (`isTrusted` false) da sayılmıyor.
 *
 * Eski tarayıcıda da çalışsın diye ES5 — sayfanın geri kalanı gibi.
 */
export const OUTREACH_BETIGI = `try{var q=new URLSearchParams(location.search);
if(q.get('utm_source')==='outreach'&&navigator.sendBeacon){
  var id=typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  var gonder=function(e){navigator.sendBeacon('/api/olay',new Blob([JSON.stringify({
    tur:'outreach',
    yol:location.pathname,
    dil:document.documentElement.lang||'',
    kaynak:(q.get('utm_content')||''),
    gorunum:id,
    etkilesim:e
  })],{type:'application/json'}))};
  gonder(false);
  var turler=['mousemove','pointerdown','keydown','wheel','touchstart'],bitti=false;
  var hareket=function(ev){
    if(bitti||!ev.isTrusted)return;
    if(ev.type==='mousemove'&&ev.movementX===0&&ev.movementY===0)return;
    bitti=true;
    turler.forEach(function(t){removeEventListener(t,hareket,true)});
    gonder(true);
  };
  turler.forEach(function(t){addEventListener(t,hareket,{capture:true,passive:true})});
}}catch(e){}`;
