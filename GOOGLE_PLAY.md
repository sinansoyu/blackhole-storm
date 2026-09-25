# Blackhole Storm · Google Play'e yayınlama rehberi

Oyun bir **PWA** (yüklenebilir web uygulaması). Google Play'e **Trusted Web Activity (TWA)** olarak,
yani siteyi tam ekran açan küçük bir Android uygulaması olarak girer. Android paketi **Bubblewrap**
ile GitHub Actions'ta otomatik üretilir; bilgisayarına Android Studio kurman gerekmez.

## Depoda hazır olanlar

| Dosya | Ne işe yarar |
|---|---|
| `.github/workflows/pages.yml` | `main` dalına her gönderimde oyunu GitHub Pages'e yayınlar |
| `.github/workflows/android-keystore.yml` | Android imza anahtarını **bir kez** üretir |
| `.github/workflows/android.yml` | İmzalı Play paketini (`.aab`) ve test APK'sını üretir |
| `android/twa-manifest.json` | Paket adı, adres, renkler, ikonlar (Bubblewrap ayarı) |
| `android/assetlinks.example.json` | Alan adı doğrulama dosyası şablonu |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA: yükleme, çevrimdışı çalışma, ikonlar |
| `privacy.html` | Gizlilik politikası (TR + EN) |
| `store/` | Tanıtım görseli (1024×500) ve 6 ekran görüntüsü (1080×1920) |
| `root-site/` | `sinansoyu.github.io` deposuna kopyalanacak dosyalar (adım 4) |
| `MONETIZATION.md` | Mağaza ürünleri, reklam yerleri, paranın hesaba geçişi |

Varsayılan adres ve paket adı:

- Site: `https://sinansoyu.github.io/blackhole-storm/`
- Paket adı: `io.github.sinansoyu.blackholestorm` (Play'e ilk yüklemeden sonra **değiştirilemez**)

---

## 1. Siteyi yayınla (GitHub Pages)

1. Bu dalı `main`'e birleştir (PR'ı merge et).
2. GitHub → depo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. **Actions** sekmesinde "Web sitesini yayınla" iş akışı yeşil olunca oyun
   `https://sinansoyu.github.io/blackhole-storm/` adresinde açılır.
4. Telefonda Chrome ile aç: menüde "Uygulamayı yükle" çıkmalı, uçak modunda da açılmalı.

> Gizlilik politikasının adresi: `https://sinansoyu.github.io/blackhole-storm/privacy.html`.
> Göndermeden önce `privacy.html` içindeki `[İLETİŞİM E-POSTASI]` ve `[CONTACT EMAIL]` yerine kendi e-postanı yaz.

## 2. İmza anahtarını oluştur (bir kez)

1. Depo → **Settings → Secrets and variables → Actions → New repository secret**:
   - Ad: `ANDROID_KEYSTORE_PASSWORD`, değer: en az 8 karakterlik güçlü bir şifre. Şifreyi bir yere de not et.
2. **Actions → "Android imza anahtarı oluştur (bir kez)" → Run workflow**.
3. Bitince çalıştırmanın sayfasında:
   - Özet bölümünde **SHA-256 parmak izi** yazar. Kopyala (adım 4'te lazım).
   - **android-keystore-GIZLI** dosyasını indir. İçinde iki dosya var:
     - `ANDROID_KEYSTORE_B64.txt` → içindeki metnin tamamını yeni bir secret'a yapıştır: ad `ANDROID_KEYSTORE_B64`.
     - `android.keystore` → güvenli bir yerde sakla (ör. şifreli bulut klasörü). **Kaybolursa güncelleme yükleyemezsin.**
4. İndirdikten sonra o çalıştırmayı sil (sağ üst "…" → Delete workflow run). Dosya zaten 1 gün sonra kendiliğinden silinir.

## 3. Android paketini üret

1. **Actions → "Android paketi üret" → Run workflow**:
   - Sürüm kodu: ilk yükleme için `1`. Her yeni yüklemede bir artır (2, 3, …).
   - Sürüm adı: `1.0.0` gibi.
2. Bitince çalıştırmanın altındaki dosyayı indir:
   - `app-release-bundle.aab` → Play Console'a yüklenecek paket.
   - `app-release-signed.apk` → kendi telefonuna kurup denemek için.

> Paket, ikonları yayındaki siteden indirir; bu yüzden adım 1 tamamlanmış olmalı.

## 4. Alan adı doğrulaması (adres çubuğunu gizler)

Android, uygulamanın siteye ait olduğunu `https://sinansoyu.github.io/.well-known/assetlinks.json`
dosyasından doğrular. Bu dosya alan adının **kökünde** olmalı; `blackhole-storm` deposunun Pages
adresi `/blackhole-storm/` altında olduğu için oraya konamaz. Çözüm, tek dosyalık ikinci bir depo:

1. GitHub'da `sinansoyu.github.io` adında **herkese açık** yeni bir depo oluştur.
2. Bu depodaki `root-site/` klasörünün içeriğini oraya kopyala:
   - `.nojekyll` (boş dosya)
   - `.well-known/assetlinks.json`: `android/assetlinks.example.json` şablonunu kopyala, parmak izlerini yaz:
     - adım 2'deki **yükleme anahtarı** SHA-256'sı,
     - Play Console → uygulaman → **Test ve yayınla → Kurulum → Uygulama bütünlüğü → Uygulama imzalama**
       sayfasındaki **uygulama imzalama anahtarı** SHA-256'sı (Play, uygulamayı kendi anahtarıyla yeniden imzalar).
3. O depoda **Settings → Pages → Source: Deploy from a branch → main / (root)**.
4. Kontrol: `https://sinansoyu.github.io/.well-known/assetlinks.json` tarayıcıda JSON göstermeli.

Doğrulama olmadan da uygulama çalışır, sadece üstte ince bir adres çubuğu görünür. Kapalı teste bununla başlanabilir.

## 5. Play Console

1. **Geliştirici hesabı**: [play.google.com/console](https://play.google.com/console) (tek seferlik kayıt ücreti).
2. **Uygulama oluştur**: ad "Blackhole Storm", varsayılan dil Türkçe, **Oyun**, **Ücretsiz**.
3. **Kapalı test zorunluluğu**: 13 Kasım 2023'ten sonra açılan kişisel hesaplarda üretime çıkmadan önce
   **en az 12 test kullanıcısı 14 gün kesintisiz** kapalı teste katılmış olmalı. Kapalı test kanalı
   oluştur, test kullanıcılarının e-postalarını ekle, `.aab` dosyasını yükle, katılım linkini paylaş.
4. **Mağaza girişi** (aşağıdaki metinler hazır): ikon `icons/icon-512.png`, tanıtım görseli
   `store/feature-graphic-1024x500.jpg`, telefon ekran görüntüleri `store/screenshot-*.jpg`.
5. **Uygulama içeriği** formları için cevaplar:

| Form | Cevap |
|---|---|
| Gizlilik politikası | `https://sinansoyu.github.io/blackhole-storm/privacy.html` |
| Uygulama erişimi | Tüm işlevler giriş gerektirmeden kullanılabilir |
| Reklamlar | Reklam ağı eklenene kadar **Hayır**; eklenince **Evet** (bkz. MONETIZATION.md) |
| İçerik derecelendirme | Kategori: Oyun. Şiddet, korku, kumar, cinsellik, küfür yok; kullanıcılar arası iletişim yok; **dijital ürün satın alma var**. Beklenen sonuç: 3+ / Herkes |
| Hedef kitle | **13 yaş ve üzeri** önerilir (13 yaş altını seçmek "Aileler" politikasının ek şartlarını getirir) |
| Veri güvenliği | Veri **toplanmıyor** ve **paylaşılmıyor**. Skorlar, ayarlar ve kayıtlı klipler yalnızca cihazda kalır; paylaşım sadece kullanıcı "Paylaş"a bastığında telefonun paylaşım menüsüyle yapılır |
| Kamu sağlığı, haber, finans, devlet | Hayır |

6. **Uygulama içi ürünler:** Play Console → Para kazanma → Ürünler → Uygulama içi ürünler. Ürün kimlikleri, içerikleri ve önerilen fiyatlar `MONETIZATION.md` içinde. Bunun için önce Ödemeler profili (banka hesabı) oluşturulmalı.
7. **Sürüm**: yeni bir `.aab` her zaman daha büyük bir sürüm koduyla yüklenir (adım 3).

## 6. Görseller ve lisanslar

- Bölge fotoğrafları: NASA, ESA, CSA, STScI (Hubble ve Webb), **CC BY 4.0**. Kaynak belirtmek zorunlu; oyunda
  *Ayarlar → Emeği geçenler* bunu karşılıyor, mağaza açıklamasının sonunda da satır var.
- Gezegen dokuları: Solar System Scope, CC BY 4.0. Sesler ve müzik: Kenney.nl ve OpenGameArt, CC0.
- **Astronot portreleri** (Eve Dönüş görevi) proje sahibinin Google Gemini (Nano Banana) ile ürettiği görsellerden
  kırpıldı. NASA logosu ve bayrak bilerek kadraj dışında bırakıldı (NASA amblemi izinsiz kullanılamaz).
  Üretim tarihini ve kullanılan komutu sakla.
- Seviye haritasının arka planı kod ile üretiliyor, lisans gerektirmiyor.

---

## Mağaza metinleri

### Türkçe

**Uygulama adı (30):** Blackhole Storm

**Kısa açıklama (80):**
> Kara deliği yönet: gök cismi halkaya girince dokun, yut ve evrimleş!

**Uzun açıklama:**
> Gerçek Hubble ve James Webb fotoğraflarıyla kurulmuş beş bölgede, ışığı büken bir kara deliği yönetiyorsun. Bir gök cismi halkaya girince halka yeşil yanar: dokun ve yut. Merkeze ne kadar yakınsa o kadar puan.
>
> • 5 bölge: Derin Uzay, Westerlund 2, Orion, Karina ve Webb'in Kozmik Uçurumları
> • Bosslar: nefes alan Kızıl Dev ve radyasyon ışınları saçan Magnetar
> • Eve Dönüş görevleri: kara deliğe çekilen filoyu kurtar, tek şansın var
> • Sapan Kurtarma: mekiği tam zamanında fırlat
> • Kuyruklu yıldız, pulsar, antimadde, nötron yıldızı, görünmez karanlık madde ve daha fazlası
> • Kara deliğin büyüdükçe evrimleşir, sonunda jetler fışkıran bir kuasara dönüşür
> • Seviye haritası ve yıldızlar: eski seviyeleri tekrar oyna, üç yıldızın peşine düş
> • Günlük Kozmos: herkes aynı evrende 60 saniye yarışır; sonucunu paylaş, arkadaşına meydan oku
> • Kozmik Atlas: yuttuğun her cismin gerçek bilimsel bilgisi
>
> Reklam yok, hesap yok, veri toplama yok. İnternetsiz de oynanır.
>
> Görseller: NASA, ESA, CSA, STScI (CC BY 4.0) · Gezegen dokuları: Solar System Scope (CC BY 4.0) · Ses: Kenney.nl, OpenGameArt (CC0)

### English

**Short description (80):**
> Guide a black hole: tap when a world enters the ring, swallow it and evolve!

**Full description:**
> Command a light-bending black hole across five regions built from real Hubble and James Webb images. When a body enters the ring it glows green: tap to swallow it. The closer to the centre, the higher the score.
>
> • 5 regions: Deep Field, Westerlund 2, Orion, Carina and Webb's Cosmic Cliffs
> • Bosses: a breathing Red Giant and a Magnetar sweeping radiation beams
> • Homecoming missions: save a fleet caught in the pull, one chance only
> • Slingshot Rescue: release the shuttle at exactly the right moment
> • Comets, pulsars, antimatter, neutron stars, invisible dark matter and more
> • Your black hole evolves as it grows, until it becomes a jet-blasting quasar
> • Level map with stars: replay levels and chase three stars
> • Daily Cosmos: everyone plays the same 60-second universe; share your result and challenge friends
> • Cosmic Atlas: real science about every body you swallow
>
> No ads, no account, no data collection. Plays offline.
>
> Images: NASA, ESA, CSA, STScI (CC BY 4.0) · Planet textures: Solar System Scope (CC BY 4.0) · Audio: Kenney.nl, OpenGameArt (CC0)
