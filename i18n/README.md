# Oyun çevirileri

Oyun 10 dilde: Türkçe (kaynak), English, Kurdî (Kurmancî), Español, Português, Français, Deutsch, Русский, العربية, Bahasa Indonesia.

- Her dil bir dosya: `en.json`, `ku.json`, `es.json`, `pt.json`, `fr.json`, `de.json`, `ru.json`, `ar.json`, `id.json`.
- Anahtar (soldaki) oyundaki **Türkçe metindir**, değer (sağdaki) o dildeki karşılığı. Anahtarı değiştirme, sadece sağ tarafı düzelt.
- `{n}` bir sayının yeridir (seviye, puan, saniye…). Çeviride aynı sayıda `{n}` kalmalı. Sıra değişmesi gerekirse `{n1}`, `{n2}` yazılabilir
  (ör. `"{n} saniyede {n} tanesini yut"` → `"swallow {n2} of them in {n1} seconds"`).
- `{s}` bir bölge/boss adının yeridir, `{p}` oyuncu adı, `{d}` puan farkı, `{l}` seviye.
- Oyun açılışta telefonun dilini seçer; oyuncu Ayarlar › Dil'den değiştirebilir. Arapçada ekran sağdan sola döner.
- Oyunda karşılığı olmayan bir metin Türkçe görünür (oyun bozulmaz).
- Dosyalar oyuna derleme sırasında gömülür (`index.html` içinde `window.I18N`).

**Kontrol önerisi:** Çeviriler makine desteğiyle yazıldı. Yayından önce özellikle Kürtçe ve Arapçayı anadili olan birine okutmak iyi olur.
