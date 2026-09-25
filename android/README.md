# Android (Google Play) paketi

Bu klasörde sadece `twa-manifest.json` tutulur. Android projesi her derlemede GitHub Actions'ta
Bubblewrap ile bu dosyadan yeniden üretilir ("Android paketi üret" iş akışı).

- `twa-manifest.json`: paket adı, site adresi, renkler, ikonlar, sürüm. Sürüm kodu/adı iş akışını
  çalıştırırken girilir, dosyayı elle değiştirmen gerekmez.
- `assetlinks.example.json`: sitenin kök adresine (`https://<kullanıcı>.github.io/.well-known/assetlinks.json`)
  konacak dosyanın şablonu. Adım adım anlatım: `../GOOGLE_PLAY.md`.

İmza anahtarı (`android.keystore`) asla depoya konmaz; GitHub secret'ı olarak saklanır.
