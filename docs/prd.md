# Product Requirements Document (PRD)
**Project Name:** Next-Gen Video to GIF Converter
**Version:** 1.0 (MVP)
**Status:** Draft

---

## 1. Yönetici Özeti (Executive Summary)
Bu proje, piyasadaki hantal, çirkin ve gizlilik riski taşıyan video dönüştürme araçlarına (örn: Ezgif) modern bir alternatif oluşturmayı hedefler. Amacımız, **Astro ve React** gücünü kullanarak, kullanıcının videosunu sunucuya yüklemeden (client-side), doğrudan tarayıcı içinde çalışan, %100 gizli, ultra hızlı ve görsel olarak **"premium"** hissettiren bir araç geliştirmektir.

**Vizyon:** "Video araçlarının 'Linear' veya 'Vercel'i olmak." (Fonksiyonel, minimalist, estetik ve hızlı).

---

## 2. Problem Tanımı
Mevcut çözümlerin (Ezgif, CloudConvert vb.) temel sorunları:
* **Gizlilik:** Videoların işlenmek için sunucuya yüklenmesi gerekiyor.
* **Hız:** Yükleme ve indirme süreleri zaman kaybı yaratıyor.
* **UX/UI:** 1990'lardan kalma, karmaşık ve reklam dolu arayüzler kullanıcıyı yoruyor.
* **Teknik Bilgi Gereksinimi:** FPS, Bitrate gibi terimler son kullanıcı için kafa karıştırıcı.

---

## 3. Çözüm ve Değer Önermesi
Tamamen tarayıcı tabanlı (**FFmpeg.wasm** teknolojisi ile) çalışan, sunucusuz bir mimari.

* **Sıfır Yükleme Süresi:** Video kullanıcının cihazından çıkmaz.
* **Maksimum Gizlilik:** Veriler sunucuda depolanmaz.
* **Akıllı Ön Ayarlar:** Teknik terimler yerine "Discord için", "Slack için", "Email için" gibi hedef odaklı modlar.
* **Modern Estetik:** Karanlık mod (Dark Mode), akıcı animasyonlar ve temiz tipografi.

---

## 4. Hedef Kitle
* **Topluluk Yöneticileri (Discord/Slack):** Hızlıca tepki GIF'leri veya duyuru görselleri oluşturmak isteyenler.
* **Yazılımcılar/Tasarımcılar:** Projelerini sergilemek (demo) için yüksek kaliteli, düşük boyutlu GIF arayanlar.
* **İçerik Üreticileri:** Videolarını hızlıca "meme" formatına çevirmek isteyen sosyal medya kullanıcıları.

---

## 5. Temel Özellikler (MVP Kapsamı)

### A. Giriş ve Yükleme
* Şık, geniş bir "Drag & Drop" (Sürükle Bırak) alanı.
* Desteklenen formatlar: `.mp4`, `.mov`, `.webm`.
* Dosya seçildiği anda sayfa yenilenmeden editör arayüzüne geçiş (React State).

### B. Editör ve İşleme
* **Timeline (Zaman Çizelges):** Videonun başlangıç ve bitiş noktalarını (Trim) seçmek için görsel kaydırıcı.
* **Hazır Ayarlar (Presets):**
    * *Balanced:* Standart kalite.
    * *Discord Optimized:* <8MB dosya boyutu garantisi.
    * *High Quality:* Yüksek FPS, büyük boyut.
* **Manuel Ayarlar (İsteğe Bağlı):** FPS (10-60), Genişlik (Scale), Hız (Speed).
* **Anlık Tahmin:** Seçilen ayarlara göre tahmini GIF boyutunun gösterilmesi.

### C. Çıktı ve Etkileşim
* İşlem sırasında görsel bir ilerleme çubuğu (Progress Bar).
* İşlem bitince yan yana "Orijinal Video" ve "Oluşan GIF" karşılaştırması (opsiyonel) veya direkt sonuç.
* "İndir" ve "Panoya Kopyala" butonları.

---

## 6. Tasarım ve Kullanıcı Deneyimi (UX/UI) Gereksinimleri
Tasarım, bu projenin en büyük rekabet avantajıdır.

* **Stil:** Modern, Minimalist, "Bento Grid" yapısı.
* **Tema:** Varsayılan olarak **Dark Mode**. Göz yormayan gri tonları (`zinc-900`), neon aksan renkleri (Mor veya Yeşil).
* **Hissiyat:** Bir "web sitesi" değil, bir "uygulama" (Native App) gibi hissettirmeli.
* **Font:** Inter, Geist Sans veya benzeri modern sans-serif fontlar.
* **Responsive:** Mobilde de masaüstünde de kusursuz çalışmalı.

---

## 7. Teknik Kısıtlar ve Gereksinimler (High-Level)
* **Framework:** Astro (SSG/Routing için) + React (Interactive Island).
* **Styling:** Tailwind CSS.
* **Core Engine:** `@ffmpeg/ffmpeg` (WebAssembly).
* **Hosting:** Cloudflare Pages (Tercih edilen) veya GitHub Pages.
* **Güvenlik:** `SharedArrayBuffer` kullanımı için gerekli COOP/COEP başlıkları (headers) yapılandırılmalı.
* **Backend:** **YOK.** Tüm işlemler istemci tarafında (Browser) yapılacak.

---

## 8. Başarı Kriterleri
* Kullanıcının siteye girip GIF'i indirmesi arasındaki sürenin (işlem süresi hariç) minimuma inmesi.
* Arayüzün, teknik bilgisi olmayan bir kullanıcı tarafından bile rehbersiz kullanılabilmesi.
* Lighthouse performans skorunun (LCP, CLS) 90+ olması (Astro sayesinde).