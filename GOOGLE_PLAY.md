# Blackhole Storm'u Google Play'e taşıma rehberi

Oyun artık bir **PWA** (yüklenebilir web uygulaması): `manifest.webmanifest`, `sw.js` (çevrimdışı çalışma) ve `icons/` klasörü hazır. Google Play'e, Google'ın **Trusted Web Activity (TWA)** yöntemiyle, web sitesini saran bir Android paketi olarak yüklenir. Aşağıdaki adımların bazıları sizin hesaplarınızla yapılmak zorunda.

## 1. Oyunu kendi HTTPS adresinde yayınla

TWA ve meydan okuma linkleri için oyunun herkese açık bir HTTPS adresi olmalı. En kolayı GitHub Pages:

1. GitHub'da depo → **Settings → Pages**.
2. *Source*: `Deploy from a branch`, dal: `main`, klasör: `/ (root)`.
3. Birkaç dakika sonra oyun `https://<kullanıcı-adı>.github.io/blackhole-storm/` adresinde açılır.

> Özel (private) depolarda GitHub Pages ücretli plan gerektirebilir. Alternatifler: Netlify, Cloudflare Pages, Vercel (hepsinde ücretsiz katman var).

Kontrol: Chrome'da adresi aç → menüde **"Uygulamayı yükle / Ana ekrana ekle"** çıkmalı; oyun menüsünde de **📲 Ana ekrana ekle** butonu görünür. Uçak modunda da açılmalı.

## 2. Android paketini üret (Bubblewrap)

Bilgisayarda Node.js kurulu olmalı. İlk çalıştırmada Bubblewrap, Java JDK ve Android SDK'yı kendisi indirmeyi teklif eder.

```bash
npm i -g @bubblewrap/cli
mkdir blackhole-storm-android && cd blackhole-storm-android
bubblewrap init --manifest https://<adresin>/manifest.webmanifest
bubblewrap build
```

- `init` sırasında uygulama kimliği (ör. `io.github.<kullanıcı>.blackholestorm`), ad ve renkler sorulur; varsayılanlar manifest'ten gelir.
- İmza anahtarı (keystore) oluşturulur. **Bu dosyayı ve şifresini kaybetme**: güncellemeler aynı anahtarla imzalanmak zorunda.
- `build` sonunda iki dosya çıkar: test için `app-release-signed.apk`, Play'e yüklemek için `app-release-bundle.aab`.

## 3. Alan adı doğrulaması (assetlinks.json)

Bubblewrap bir `assetlinks.json` üretir. Bunu sitenin şu adresine koy:

```
https://<adresin>/.well-known/assetlinks.json
```

GitHub Pages'te bu dosya depoda `.well-known/assetlinks.json` yolunda durmalı; nokta ile başlayan klasörlerin yayınlanması için depoya boş bir `.nojekyll` dosyası ekle. Doğrulama olmazsa uygulama açılınca üstte tarayıcı adres çubuğu görünür.

> Play App Signing kullanılıyorsa (varsayılan), Play Console → *Kurulum → Uygulama imzalama* sayfasındaki SHA-256 parmak izini de `assetlinks.json`'a eklemen gerekir.

## 4. Play Console

1. **Geliştirici hesabı**: tek seferlik kayıt ücreti vardır ([play.google.com/console](https://play.google.com/console)).
2. **Yeni kişisel hesaplar için kapalı test zorunlu**: 13 Kasım 2023'ten sonra açılan kişisel hesaplarda, üretime çıkmadan önce **en az 12 test kullanıcısının 14 gün boyunca kesintisiz** kapalı teste katılmış olması gerekir. Test kullanıcılarının oyunu gerçekten açıp oynaması önemli.
3. **Mağaza sayfası** için gerekenler:
   - Uygulama ikonu 512×512: `icons/icon-512.png`
   - Tanıtım görseli 1024×500 ve telefon ekran görüntüleri: `store/` klasöründe hazır: `feature-graphic-1024x500.jpg` ve 1080×1920 ekran görüntüleri
   - Kısa ve uzun açıklama (öneri aşağıda)
   - **Gizlilik politikası** adresi: depodaki `privacy.html` hazır (Türkçe + İngilizce). Yayınlandıktan sonra `https://<adresin>/privacy.html` adresini gir. Göndermeden önce sayfadaki `[İLETİŞİM E-POSTASI]` / `[CONTACT EMAIL]` yerine kendi iletişim e-postanı yaz.
   - İçerik derecelendirme anketi, hedef kitle ve **Veri güvenliği** formu (veri toplanmıyor / paylaşılmıyor)
4. `app-release-bundle.aab` dosyasını önce **Kapalı test**, sonra **Üretim** kanalına yükle.

## 5. Görseller ve lisanslar

**Astronot portreleri** (Eve Dönüş görevi) proje sahibinin sağladığı fotoğraflardan kırpıldı; NASA logosu ve bayrak bilerek kadraj dışında bırakıldı (NASA amblemi izinsiz kullanılamaz). Mağazaya göndermeden önce bu fotoğrafların kullanım hakkının sende olduğundan emin ol.

Oyundaki görseller CC BY 4.0 lisanslı (NASA/ESA/CSA Hubble ve Webb, Solar System Scope); sesler ve müzik CC0. CC BY 4.0 ticari kullanıma izin verir ama **kaynak belirtmek zorunludur**. Oyunda *Ayarlar → Emeği geçenler* bölümü bunu karşılıyor; mağaza açıklamasına da kısa bir satır eklemen iyi olur.

## Öneri mağaza metinleri

**Kısa açıklama (80 karakter):**
> Kara delik dolaşıyor: gezegen halkaya girince dokun, yut, büyü!

**Uzun açıklama (başlangıç):**
> Gerçek Hubble ve James Webb fotoğraflarıyla oluşturulmuş 5 bölgede, ışığı büken bir kara deliği yönetiyorsun. Gezegen halkaya girince dokun; merkeze ne kadar yakınsa o kadar puan. Kuyruklu yıldızlar, pulsarlar, antimadde ve görünmez karanlık madde seni bekliyor. Yuttukça kara deliğin evrimleşir, sonunda jetler fışkıran bir kuasara dönüşür. Her gün herkes aynı "Günlük Kozmos"ta yarışır; sonucunu paylaş, arkadaşlarına meydan oku!
>
> Görseller: NASA, ESA, CSA, STScI (CC BY 4.0) · Gezegen dokuları: Solar System Scope (CC BY 4.0) · Ses: Kenney.nl, OpenGameArt (CC0)
