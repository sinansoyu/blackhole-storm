# Blackhole Storm — Kod denetim rehberi

Bu dosya, oyunu dışarıdan inceleyecek biri (insan ya da yapay zekâ) için hazırlandı.

## Nereden okunmalı

| Dosya | Ne |
|---|---|
| `src/game.src.html` | **Asıl kaynak.** Tüm HTML, CSS ve JavaScript (~3.300 satır). Denetim buradan yapılmalı. |
| `src/v2.js` | **V2 oynanış motoru**: sürükleyerek kontrol edilen kara delik, combo, Rage, güçler, seviye 1 öğretici senaryosu, dev gezegen boss'u. Derlemede `game.src.html` içine gömülür. |
| `src/build.py` | `index.html`'i üretir: kaynaktaki yer tutuculara font, görsel, ses ve çevirileri gömer. |
| `src/blocks/*.html` | Gömülü ikili veriler (base64 font, sprite, ses, arka plan). Kod değil, okumaya gerek yok. |
| `i18n/*.json` | 9 dilin çevirileri (kaynak dil Türkçe, anahtarlar Türkçe metnin kendisi). |
| `index.html` | Derlenmiş tek dosyalık oyun (~4,5 MB, çoğu base64). **Okumak için değil**, çalıştırmak için. |
| `sw.js`, `manifest.webmanifest` | PWA: çevrimdışı önbellek ve kurulum bilgisi. |
| `.github/workflows/` | GitHub Pages yayını, Android imza anahtarı üretimi, Android (TWA) paket derlemesi. |
| `android/`, `root-site/` | Play Store için Trusted Web Activity ayarları ve alan doğrulama. |
| `privacy.html`, `MONETIZATION.md`, `GOOGLE_PLAY.md` | Gizlilik politikası, gelir modeli, yayın rehberi. |

Derleme: `python3 src/build.py` → kökteki `index.html` birebir yeniden üretilir.

## Mimari (src/game.src.html içinde)

Tek sayfa, çerçeve yok, sunucu yok. Oyun durumu `localStorage`'da tutulur.

- **Yardımcılar ve ikonlar** (~790–890): rastgele sayı, SVG ikon sistemi (`ICO`, `icoFill`), foto avatarlar (`AV_IMG`, `setAv`).
- **Çok dil** (~890–950): `T()`, `trLookup`, `i18Piece` (sayı/isim kalıpları), DOM gözlemcisi `trTree`, `setLang` (Arapça için RTL).
- **Kayıt** (`saveG`/`loadG`, ~952): yıldız, elmas, rekor, ayarlar, mağaza durumu.
- **Ses** (`SND`, `sfx`, ~960–1070): Web Audio, gömülü MP3/WAV.
- **Görüntü** (~1077–1310): sprite üretimi, WebGL kara delik ve bükülmüş gökyüzü (`glInit`, `glDraw`), 2D canvas yedeği.
- **Seviye düzeni** (~1308–1420): bölgeler, `levelTarget`, `baseR` (halka yarıçapı), zorluk eğrisi, başarımlar, kara delik evrimi.
- **Harita, atlas, günlük görevler, skor listesi** (~1420–1740).
- **Mağaza / gelir** (~1743–1860): `IAP` kataloğu, `VIP` aboneliği, `MON` (play / test / off kipleri), ödüllü reklam.
- **Cisimler** (`class Ball`, ~1929–2060): hareket, çekim, özel cisimler; `Lens` (kütle çekim merceği) ve `Worm` (solucan deliği).
- **Eve Dönüş görevi** (~2150–2260) ve **Sapan kurtarma görevi** (~2451–2580): yörünge fiziği, öngörü çizgisi, asteroitler.
- **Oyun akışı** (~2583–2860): `handleShot` (dokunma), `penalty`/`graceMiss`/`loseLife`, `levelSuccess`, `gameOver`.
- **Günlük Kozmos sprint, paylaşım, video kaydı** (~2877–3030).
- **Ana döngü** `loop(ts)` (~3033) ve başlangıç. `G2.on` iken döngü `v2Frame`'e (src/v2.js) devreder; seviye, Hayatta Kal ve Günlük Kozmos V2 motoruyla oynanır.

## Bilinen tasarım kararları (hata sanılmasın)

- Kayıt yalnızca cihazda, sunucu yok. Oyuncu yerel veriyi değiştirebilir; bu tek oyunculu bir oyunda bilinçli bir tercih. `loadG` her alanı tip ve aralık kontrolünden geçirir; bozuk kayıt oyunu çökertmez.
- Satın alma onayı (acknowledge) ve jeton doğrulaması için sunucu henüz yok; tek seferlik ürünler ve VIP bu yüzden yayında açılmayacak. Ayrıntı: `MONETIZATION.md` → "Satın alma onayı".
- Cihaz saati geri alınınca tarihe bağlı ödüller kilitlenir (`clockOk`). Saati ileri almak yalnızca ödülü erken almayı sağlar, fazladan ödül vermez.
- Service worker `sw.js` depoda ayrı dosya: `skipWaiting`, `clients.claim`, eski önbellek silme ve sayfa için önce ağdan yükleme zaten var.
- `MON.mode`: web sürümünde mağaza ve reklamlar gizli (`off`); `test` kipinde sahte ödeme ve sahte reklam kullanılır; gerçek ödeme/reklam sağlayıcısı henüz takılmadı.
- Seviye 1, 60 saniyelik senaryolu öğreticidir: oyun bitmez, reklam ve satın alma çıkmaz.
- V2 değerleri (`V2K`, `OBJ2`) tasarım belgesinden alınmıştır; doğma aralığı (`v2Rules`) oyun testine göre ayarlandı.
- Görseller NASA kamu malı fotoğraflarından; fontlar IBM Plex (SIL OFL).

## Denetimde bakılması istenenler

1. Hatalar ve uç durumlar (oyun akışı, can/skor, kayıt bozulması, seviye geçişi).
2. Performans (düşük seviye Android telefonda 60 FPS; bellek sızıntısı; her karede yapılan gereksiz iş).
3. Güvenlik (XSS: `innerHTML` kullanımları, paylaşım/meydan okuma linklerinden gelen parametreler; service worker önbelleği).
4. Play Store uygunluğu (gizlilik, reklam/satın alma akışları, geri tuşu, çevrimdışı çalışma).
5. Çeviri sistemi (eksik anahtar, sayı biçimi, RTL yerleşimi).
6. Kod kalitesi ve bakım kolaylığı (tek dosya yapısının riskleri, bölme önerileri).
