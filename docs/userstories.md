# User Stories & Interaction Flow Document
**Project:** Next-Gen Video to GIF Converter
**Focus:** Application Logic & User Journey

---

## 1. Genel Bakış (Overview)
Uygulama, "Tek Sayfa, Tek Odak" (Single Page, Single Focus) mantığıyla çalışır. Kullanıcıyı sayfalar arasında dolaştırmaz; her şey (yükleme, düzenleme, indirme) aynı ekranda, dinamik olarak gerçekleşir.

**Temel Prensip:** "Kullanıcıya asla boş bir ekran gösterme veya ne yapacağını düşündürtme."

---

## 2. Kullanıcı Akışı (The Happy Path)
İdeal bir kullanım senaryosu adım adım şöyledir:

### Adım 1: Karşılama (Landing State)
* **Kullanıcı:** Siteyi açar.
* **Gördüğü:** Merkezde estetik, büyük bir "Dropzone" (Dosya Bırakma Alanı). Arka planda dikkat dağıtmayan hafif bir görsel veya degrade.
* **Aksiyon:** Kullanıcı videoyu sürükler **VEYA** kutuya tıklayıp dosya gezgininden seçer.

### Adım 2: Hazırlık ve Yükleme (Loading State)
* **Sistem:** Dosya seçildiği an (upload beklenmez, dosya yereldedir) FFmpeg motoru `ffmpeg.load()` ile hazırlanır.
* **Gördüğü:** Dropzone kaybolur. Yerine şık bir "Motor Hazırlanıyor..." veya "Video Analiz Ediliyor" animasyonu gelir.
* **Süre:** Bu işlem 1-3 saniye sürmelidir.

### Adım 3: Düzenleme Modu (Editor State)
* **Sistem:** Video belleğe alınır.
* **Gördüğü:** Ekran ikiye bölünür (Mobil için alt alta):
    * **Sol:** Videonun oynatılabilir bir önizlemesi. Altında **Zaman Çizelgesi (Timeline)**.
    * **Sağ:** Ayarlar Paneli (Platform Seçimi, FPS, Boyut).
* **Aksiyon (Trim):** Kullanıcı timeline üzerindeki kulpları (handles) sürükleyerek videoyu kırpar (Örn: 00:00 - 00:05 arası). Video önizlemesi sadece bu aralıkta döngüye girer (Loop).
* **Aksiyon (Ayar):** Kullanıcı "Discord Modu"nu seçer. Sistem otomatik olarak FPS'i 15'e, Genişliği 320px'e çeker.

### Adım 4: Dönüştürme (Processing State)
* **Kullanıcı:** "GIF'e Dönüştür" butonuna basar.
* **Gördüğü:** Buton kilitlenir (`disabled`). Butonun üzerinde veya altında bir **İlerleme Çubuğu (Progress Bar)** belirir: "%25... %50...".
* **Sistem:** Tarayıcı (Web Worker) arka planda videoyu kare kare işler. Arayüz donmaz.

### Adım 5: Sonuç ve İndirme (Result State)
* **Gördüğü:** İşlem bitince konfeti efekti (opsiyonel). Oluşan GIF ekranda belirir. Orijinal video ve GIF yan yana durabilir veya modal pencere açılır.
* **Aksiyon:**
    * **İndir:** GIF dosyasını bilgisayara kaydeder.
    * **Kopyala:** GIF'i panoya kopyalar (Doğrudan Discord/Slack'e yapıştırmak için).
    * **Başa Dön:** Yeni bir video için ekranı sıfırlar.

---

## 3. Detaylı Etkileşim Kuralları (Interaction Rules)

### A. Otomatik Doğrulama (Validation)
* Kullanıcı `.mp4` olmayan bir dosya (örn: `.pdf`) sürüklerse?
    * **Tepki:** Dropzone kırmızı yanıp söner (Shake animation).
    * **Mesaj:** "Sadece video dosyaları kabul edilir (MP4, MOV, WEBM)."

### B. Dosya Boyutu Uyarısı
* Kullanıcı 2GB'lık bir 4K film yüklemeye çalışırsa?
    * **Tepki:** Sistem uyarı verir.
    * **Mesaj:** "Tarayıcı performansı için lütfen 100MB altındaki videoları kullanın." (Bu bir hard limit değil, tavsiye olmalı).

### C. Platform Ön Ayarları (Smart Presets) Mantığı
Kullanıcı bir "Preset" seçtiğinde sistemin yapması gerekenler:
* **Discord:** Max boyut 8MB olacak şekilde kaliteyi düşür (FPS: 15, Width: 400px).
* **Twitter/X:** Dengeli kalite (FPS: 24, Width: 600px).
* **Email:** Düşük dosya boyutu (FPS: 10, Colors: 64).
* **Yüksek Kalite:** Sınır yok (Original FPS, Original Width).

---

## 4. Hata Yönetimi (Error Handling)
Yapay zeka kod yazarken hataları genelde atlar. Bunları özellikle belirtmeliyiz.

* **FFmpeg Yüklenemezse:** (Tarayıcı çok eskiyse veya WASM desteklemiyorsa)
    * **Aksiyon:** Ekrana tam sayfa uyarı gelir. "Tarayıcınız bu teknolojiyi desteklemiyor. Lütfen Chrome veya Edge'in güncel sürümünü deneyin."
* **Bellek Hatası (OOM):** Dönüştürme sırasında tarayıcı çökerse?
    * **Aksiyon:** Catch bloğu çalışır. "Video çok büyük, bellek yetmedi. Lütfen çözünürlüğü düşürüp tekrar deneyin." mesajı gösterilir.

---

## 5. İlerleme Göstergesi (Progress Feedback)
FFmpeg işlemi uzun sürebilir. Kullanıcı "dondu sanmasın" diye:
* FFmpeg'den gelen `progress` logları (0 ile 1 arası değer) yakalanmalı ve UI'daki barı güncellemelidir.
* Tahmini kalan süre (örn: "Yaklaşık 10 sn kaldı") gösterilmesi "nice-to-have" (olsa güzel olur) bir özelliktir.