# Blackhole Storm · Satın almalar ve reklamlar

## Oyunda ne var

Mağaza ve reklamlar yalnızca **Google Play sürümünde** açılır. Web sürümü (paylaşılan link, GitHub Pages)
reklamsız ve mağazasız kalır. Önizlemede "test modu" var: sahte reklam ve sahte ödeme, para çekilmez.

### Satın alınabilir ürünler (Play Console → Ürünler → Uygulama içi ürünler)

Aşağıdaki **ürün kimliklerini aynen** oluştur (oyun bu kimlikleri arıyor). Fiyatlar öneri; Play Console'da
her ülke için değiştirilebilir, oyun gerçek fiyatı Google Play'den okur.

| Ürün kimliği | Ad | İçerik | Tür (oyunun davranışı) | Önerilen fiyat |
|---|---|---|---|---|
| `starter` | Başlangıç Paketi | 150 💎 · 1.500 ⭐ · 5 yedek can · 3 kalkan | Tek sefer (tüketilmez) | ₺39,99 |
| `captain` | Kaptan Seti | 5 kalkan · 5 yedek can · 3 zaman kristali · 100 💎 | Tekrar alınabilir | ₺69,99 |
| `no_ads` | Reklamsız Oyna | Araya giren reklamlar kalkar, reklamlı ödüller reklamsız gelir | Tek sefer, kalıcı | ₺99,99 |
| `gems_s` | Avuç Elmas | 60 💎 | Tekrar alınabilir | ₺29,99 |
| `gems_m` | Kese Elmas | 200 💎 (+%25) | Tekrar alınabilir | ₺79,99 |
| `gems_l` | Sandık Elmas | 550 💎 (+%40) | Tekrar alınabilir | ₺179,99 |
| `stars_pack` | Yıldız Yığını | 2.000 ⭐ | Tekrar alınabilir | ₺24,99 |
| `lives_pack` | Can Deposu | 10 yedek can | Tekrar alınabilir | ₺34,99 |
| `time_pack` | Zaman Kristalleri | 5 × (+15 sn) | Tekrar alınabilir | ₺24,99 |

Elmasla alınanlar (gerçek para yok): 🛡 kalkan 30 💎 · ❤️ yedek can 25 💎 · ⏱ zaman kristali 20 💎 · 500 ⭐ 40 💎.

### Eşyalar

- **🛡 Kalkan:** Can kaybedeceğin anda kendiliğinden devreye girer, can gitmez. Günlük Kozmos ve meydan okumalarda çalışmaz (adil yarış).
- **❤️ Yedek can:** Canların bitince "Yedek can kullan" ile 1 canla devam.
- **⏱ Zaman kristali:** Eve Dönüş görevinde süre bitince +15 saniye.

### Nerede çıkıyor

| Yer | Ne |
|---|---|
| Ana menü | 🛒 Mağaza düğmesi; 3. seviyeden sonra Başlangıç Paketi şeridi (alınınca kaybolur) |
| Duraklatma menüsü | 🛒 Mağaza |
| Canın bitince | **▶ Reklam izle · 1 canla devam** (seviye başına 1 kez), **❤️ Yedek can kullan**, 100 ⭐ ile devam |
| Seviye sonu | **▶ Reklam izle · +25 ⭐** |
| Günlük bonus | **▶ Reklamla 2 katını al** |
| Eve Dönüş, süre bitince | **⏱ Zaman kristali +15 sn** veya **▶ Reklam izle +15 sn** (görev başına 1 kez) |
| Mağaza | **▶ Reklam izle +5 💎** (günde 3) |
| Seviye geçişi | Araya giren reklam: 6. seviyeden sonra, her 3 seviyede bir, en az 3 dakika arayla. Oyun sırasında asla. **Reklamsız** paketiyle tamamen kalkar |

## Teknik durum

- **Satın almalar:** Google Play Billing, Digital Goods API ile bağlandı (`android/twa-manifest.json` → `playBilling`).
  Android paketi bu ayarla derlendi (izin: `com.android.vending.BILLING`, en düşük Android 6.0).
  Kalıcı ürünler (`starter`, `no_ads`) cihaz değişince **Satın alımları geri yükle** ile geri gelir.
- **Reklamlar:** Oyun, reklamları `window.BHS_ADS` adında bir bağlantı üzerinden istiyor
  (`rewarded()` ve `interstitial()`). Bu bağlantıyı sağlayacak reklam ağı **henüz seçilmedi** (aşağıya bak).
  Seçilene kadar Play sürümünde reklam düğmeleri gizli kalır; satın almalar çalışır.

### Reklam ağı seçimi

1. **AdMob + Capacitor (önerilen):** Android kabuğu TWA yerine Capacitor olur, oyun dosyası aynı kalır.
   AdMob, Play oyunlarında standart reklam ağı; ödüllü ve geçiş reklamları doğrudan desteklenir, gelir genelde en yüksek olanıdır.
   Android derleme iş akışı değişir.
2. **Mevcut TWA + Google H5 Games Ads (AdSense):** Kabuk değişmez, ama AdSense'in oyun reklamları programına
   başvuru ve onay gerekir. TWA içindeki kullanımı ve gelir seviyesi AdMob kadar net değil.

Reklam eklendiğinde yapılacaklar: gizlilik politikasına reklam bölümü, Play Console'da "Reklam içerir" işareti,
Veri güvenliği formunda reklam SDK'sının topladığı veriler (reklam kimliği vb.), AB/İngiltere için izin (onay) ekranı.

## Para hesaba nasıl geçer

### Uygulama içi satın almalar (Google Play)

1. Oyuncu Google Play hesabıyla öder (kart, Google Play bakiyesi, operatör faturası vb.). Ödeme bilgileri Google'da kalır.
2. Google kendi **hizmet ücretini** keser: kayıtlı olduğun ilk yıllık 1 milyon dolara kadar olan kazançta %15 (Play Console'dan
   %15 hizmet ücreti kademesine kaydolman gerekir), üstünde %30.
3. Satış vergileri (KDV vb.): Türkiye dahil birçok ülkede vergiyi Google hesaplayıp öder; fiyatlar kullanıcıya vergi dahil gösterilir.
   Hangi ülkede kimin ödediği Play Console yardımında listelenir.
4. Kalan tutar **Play Console → Ödemeler profili**'ne eklediğin banka hesabına (Türk bankası, IBAN, TL) aylık olarak gönderilir:
   bir ayın kazancı, eşik tutarı aştıysa ertesi ayın ortasına doğru ödenir. Raporlar: Play Console → Finansal raporlar.

### Reklamlar (AdMob seçilirse)

1. Reklam gösterim ve tıklamalarından gelir oluşur (AdMob hesabında günlük görünür).
2. AdMob hesabına banka bilgisi ve vergi bilgisi girilir; ilk ödeme öncesi adres doğrulama PIN'i postayla gelir.
3. Bakiye ödeme eşiğini (yaklaşık 100 ABD doları karşılığı) geçince ertesi ay banka havalesiyle ödenir.

### Vergi (Türkiye)

Uygulama mağazası ve reklam gelirleri Türkiye'de vergiye tabidir. Mobil uygulama geliştiricileri için
**Gelir Vergisi Kanunu 20/B istisnası** var: kazancın bu iş için açılan özel bir Türk banka hesabına gelmesi
şartıyla banka stopaj keser ve belirli bir yıllık tutara kadar ayrıca beyanname gerekmez. Şartlar ve güncel tutarlar
değiştiği için başlamadan önce bir **mali müşavire** danış. Google'ın ABD kaynaklı satışlar için istediği vergi formunu
(W-8BEN) Play Console → Ödemeler profili'nden doldurmayı unutma.
