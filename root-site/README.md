# sinansoyu.github.io için dosyalar

Bu klasörün içeriği `sinansoyu.github.io` adlı **ayrı ve herkese açık** bir depoya kopyalanır
(GOOGLE_PLAY.md, adım 4). Android bu adresteki `/.well-known/assetlinks.json` dosyasından
uygulamanın siteye ait olduğunu doğrular; kök adreste durması zorunlu.

- `.nojekyll`: GitHub Pages'in `.well-known` klasörünü yayınlaması için gerekli.
- `.well-known/assetlinks.json`: iki parmak izini yaz (yükleme anahtarı + Play uygulama imzalama anahtarı).
- `index.html`: kök adrese gelenleri oyuna yönlendirir.
