# Design & UI/UX Requirements Document
**Project:** Next-Gen Video to GIF Converter
**Style:** Modern SaaS, Dark Mode, Minimalist
**Framework:** Tailwind CSS

---

## 1. Tasarım Felsefesi (Design Philosophy)
Bu araç, bir "dosya dönüştürücü sitesi" gibi değil, profesyonel bir "video düzenleme yazılımı" (örn: Linear, Vercel Dashboard, DaVinci Resolve) gibi hissettirmelidir.
* **Anahtar Kelimeler:** Premium, Temiz, Odaklanmış, Akıcı, Karanlık.
* **İlham:** `bento.gr`, `linear.app`, `vercel.com` tasarımları.
* **Kaçınılacaklar:** Parlak beyaz arka planlar, eski tip gölgeler, standart Bootstrap/HTML butonları, karmaşık menüler.

---

## 2. Renk Paleti (Color Palette - Tailwind)
Uygulama **Dark Mode** (Karanlık Mod) varsayılan ve tek seçenek olacaktır.

* **Arka Plan (Background):** Simsiyah değil, derin gri tonları.
    * `bg-zinc-950` (Ana Sayfa Zemini)
    * `bg-zinc-900` (Kartlar ve Paneller)
* **Borders (Kenarlıklar):** Çok ince ve zarif ayrımlar.
    * `border-white/10` (Hafif geçirgen beyaz)
* **Metin (Typography):**
    * Başlıklar: `text-white` (Tam beyaz)
    * Açıklamalar: `text-zinc-400` (Okunabilir gri)
* **Aksan/Hareket Rengi (Primary Action):**
    * Kullanıcıyı yönlendiren butonlar ve aktif sliderlar için: `bg-indigo-600` veya canlı bir `bg-blue-600`.
    * Gradient kullanımı: Butonlarda hafifçe `from-indigo-500 to-purple-600` geçişi olabilir.

---

## 3. Tipografi (Typography)
* **Font Ailesi:** `Inter`, `Geist Sans` veya sistem varsayılanı `sans-serif`.
* **Hiyerarşi:**
    * Büyük, iddialı başlıklar (Tracking-tight / Harf aralığı dar).
    * Küçük, teknik detaylar için `text-xs` veya `text-sm` ve `font-mono` (örn: dosya boyutu, süre).

---

## 4. Layout & Grid Yapısı (The "Bento" Style)
Arayüz, ekranı verimli kullanan kutucuklardan (Grid) oluşmalıdır.

* **Container:** `max-w-5xl` ve `mx-auto` (Ortalanmış geniş içerik).
* **Kart Yapısı:** Her modül (Video Önizleme, Ayarlar, Çıktı) yuvarlatılmış köşelere (`rounded-2xl`) ve hafif bir iç dolguya (`p-6`) sahip olmalı.
* **Glassmorphism (Opsiyonel):** Kartların arkasında hafif bir bulanıklık (`backdrop-blur-md` ve `bg-zinc-900/50`) modern bir hava katar.

---

## 5. UI Bileşen Detayları (Component Specs)

### A. Sürükle-Bırak Alanı (Dropzone)
* Sayfanın merkezinde.
* Kesikli çizgi kenarlık (`border-dashed border-2 border-zinc-700`).
* Hover durumunda: `border-indigo-500` ve arka plan `bg-zinc-800/50`.
* İçerik: Büyük bir ikon (Upload icon) ve "Videonuzu sürükleyin veya seçin" yazısı.

### B. Video Oynatıcı & Timeline
* Video köşeleri yuvarlatılmış (`rounded-lg`).
* Altında **Timeline Slider**: Çift kulplu (double-thumb) bir slider olmalı. Videonun başını ve sonunu kesmek için görsel bir şerit.

### C. Kontrol Paneli (Settings)
* Karmaşık inputlar yerine görsel seçimler.
* **Buton Grupları:** FPS seçimi için yan yana butonlar [10] [15] [24] [30]. Seçili olanın rengi değişmeli.
* **Switch/Toggle:** "Sesi Kapat", "Boyutu Küçült" gibi ayarlar için iOS tarzı toggle switchler.

### D. Ana Aksiyon Butonu ("Convert")
* Ekranın en belirgin öğesi olmalı.
* Geniş (`w-full`), Yüksek (`h-12`).
* Yükleniyor durumunda: İçinde dönen bir ikon (Spinner) ve butonun tıklanamaz (`disabled`) olması.

---

## 6. Animasyonlar ve Etkileşimler (Micro-Interactions)
Uygulama canlı hissettirmeli.

* **Hover Efektleri:** Butonların üzerine gelince hafifçe parlaması veya yukarı kalkması (`hover:-translate-y-0.5`).
* **Tıklama Efekti:** Tıklandığında içeri göçme hissi (`active:scale-95`).
* **Sayfa Geçişleri:** Video yüklendiğinde editör arayüzünün `fade-in` (yavaşça belirme) ile gelmesi. Sert geçişlerden kaçınılmalı.

---

## 7. Responsive (Mobil Uyumluluk)
* **Masaüstü:** Video solda, Ayarlar sağda (2 sütunlu yapı).
* **Mobil:** Video üstte, Ayarlar altta (Tek sütun).
* Mobilde dokunmatik hedefler (Touch targets) en az 44px olmalı.