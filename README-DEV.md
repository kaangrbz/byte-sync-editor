# 🛠️ ByteSync Editor - Geliştirici Dokümantasyonu

Bu dokümantasyon, ByteSync Editor projesinin geliştirilmesi, kurulumu ve yönetimi için gerekli tüm bilgileri içerir.

---

## 🏗️ Proje Genel Yapısı

### Proje Tipi
ByteSync Editor, **Progressive Web App (PWA)** özellikli bir **web uygulamasıdır**. Hem web tarayıcısında çalışabilir hem de PWA olarak yüklenip offline çalışabilir.

### Klasör Yapısı

```
byte-sync-editor/
├── .github/                    # GitHub workflow dosyaları
│   └── workflows/
│       ├── jekyll-gh-pages.yml # GitHub Pages deployment
│       └── static.yml          # Static site deployment
├── AppIcon.iconset/            # PWA ve uygulama ikonları
├── assets/                     # Statik varlıklar (logo, vb.)
├── src/                        # Kaynak kod dosyaları
│   ├── components/             # UI bileşenleri
│   │   ├── ascii-table.ts      # ASCII referans tablosu
│   │   ├── context-menu.ts     # Sağ tık menüsü
│   │   ├── cookie-consent.ts   # Çerez onayı
│   │   └── feedback-form.ts    # Geri bildirim formu
│   ├── modes/                  # Özel modlar
│   │   └── four-in-one-mode.ts # 4-in-1 görünüm modu
│   ├── types/                  # TypeScript tip tanımları
│   │   └── index.ts
│   ├── ads-manager.ts          # Reklam yönetimi
│   ├── app.ts                  # Ana uygulama dosyası
│   ├── docklight-ptp-parser.ts # Docklight PTP parser
│   ├── file-handler.ts         # Dosya işleme
│   ├── grid-manager.ts         # Grid yönetimi
│   ├── notification-helper.ts  # Bildirim yardımcısı
│   ├── pwa-update-manager.ts   # PWA güncelleme yöneticisi
│   ├── state-manager.ts        # Durum yönetimi
│   ├── tab-manager.ts          # Sekme yönetimi
│   ├── theme.ts                # Tema yönetimi
│   └── utils.ts                # Yardımcı fonksiyonlar
├── tests/                      # Test dosyaları
│   ├── data-analysis.test.ts
│   ├── karakter-donusum.test.ts
│   ├── kopyalama.test.ts
│   ├── tab-islemleri.test.ts
│   └── utils.test.ts
├── .babelrc                    # Babel konfigürasyonu
├── .gitignore                  # Git ignore kuralları
├── browserconfig.xml           # Windows tile konfigürasyonu
├── index.html                  # Ana HTML dosyası
├── jest.config.js              # Jest test konfigürasyonu
├── manifest.json               # PWA manifest dosyası
├── package.json                # NPM paket tanımları
├── styles.css                  # Ana stil dosyası
├── tsconfig.json               # TypeScript konfigürasyonu
├── update-version.js           # Versiyon güncelleme scripti
└── vite.config.ts              # Vite build konfigürasyonu
```

### Kullanılan Teknolojiler

#### Core Technologies
- **TypeScript** (^5.4.5) - Ana programlama dili
- **Vite** (^5.2.11) - Build tool ve development server
- **ES Modules** - Modern JavaScript modül sistemi

#### Testing
- **Jest** (^30.1.3) - Test framework
- **@swc/jest** (^0.2.36) - Hızlı TypeScript/JavaScript derleyici
- **jest-environment-jsdom** (^30.1.2) - DOM ortamı simülasyonu
- **@types/jest** (^29.5.12) - Jest tip tanımları

#### Build & Development Tools
- **@babel/preset-env** (^7.28.3) - Babel preset
- **vite-plugin-pwa** (^0.20.5) - PWA desteği
- **identity-obj-proxy** (^3.0.0) - CSS import proxy
- **baseline-browser-mapping** (^2.9.14) - Browser mapping

#### Styling
- **Tailwind CSS** (CDN) - Utility-first CSS framework
- **CSS Custom Properties** - Tema yönetimi için

#### PWA Features
- Service Worker (otomatik oluşturulur)
- Web App Manifest
- Offline desteği
- Install prompt

---

## 🎯 Proje Amacı

ByteSync Editor, **byte düzenleme** için güçlü bir araçtır. Kullanıcıların verileri farklı formatlarda (ASCII, Hex, Decimal, Binary) görüntüleyip düzenlemesine olanak tanır.

### Temel Özellikler

1. **Çoklu Format Düzenleme**
   - ASCII formatında düzenleme
   - Hexadecimal (Hex) formatında düzenleme
   - Decimal formatında düzenleme
   - Binary formatında düzenleme
   - 4-in-1 mod: Tüm formatların aynı anda görüntülenmesi

2. **Gerçek Zamanlı Senkronizasyon**
   - Bir formatta yapılan değişiklikler tüm formatlara anında yansır
   - Cross-tab highlighting (sekmeler arası vurgulama)

3. **Akıllı Özellikler**
   - Otomatik navigasyon (hücre limitine ulaşıldığında sonraki hücreye geçiş)
   - Akıllı kopyala/yapıştır (format algılama)
   - Veri analizi (istatistikler, entropy hesaplama, pattern detection)

4. **Kullanıcı Deneyimi**
   - Klavye kısayolları
   - Sağ tık menüsü (context menu)
   - Tema desteği (Light/Dark)
   - Responsive tasarım

5. **PWA Özellikleri**
   - Offline çalışma
   - Native app gibi kurulum
   - Service Worker ile cache yönetimi

### Hedef Kullanıcı Kitlesi

- **Yazılım geliştiricileri** - Binary dosya analizi ve düzenleme
- **Sistem yöneticileri** - Sistem dosyalarını inceleme
- **Güvenlik araştırmacıları** - Binary veri analizi
- **Eğitim amaçlı kullanıcılar** - Byte ve format kavramlarını öğrenme

---

## 🔄 Kullanım Akışı

### Web Uygulaması Olarak Kullanım

1. **Başlatma**
   - `index.html` dosyası doğrudan tarayıcıda açılabilir
   - Veya bir web sunucusu üzerinden servis edilir

2. **Dosya Yükleme**
   - Dosya yükleme butonu ile binary dosya seçilir
   - Veya boş bir editör başlatılır

3. **Format Seçimi**
   - Üst kısımdaki sekmelerden format seçilir:
     - ASCII
     - Hex
     - Decimal
     - Binary
     - 4-in-1 (tüm formatlar)
     - Docklight PTP

4. **Düzenleme**
   - Grid üzerinde hücreler tıklanarak düzenlenir
   - Klavye ile navigasyon yapılır
   - Değişiklikler tüm formatlara anında yansır

5. **Kaydetme/Kopyalama**
   - Format bazlı kopyalama butonları
   - Dosya indirme özelliği

### PWA Olarak Kullanım

1. **Kurulum**
   - Tarayıcı "Install" (Kur) butonunu gösterir
   - Kurulum sonrası native app gibi çalışır

2. **Offline Kullanım**
   - Service Worker sayesinde offline çalışabilir
   - Cache'lenmiş dosyalar kullanılır

### Development Modu

1. **Development Server**
   ```bash
   yarn dev
   ```
   - Vite development server başlatılır
   - Hot Module Replacement (HMR) aktif
   - Port: 3000 (vite.config.ts'de tanımlı)

2. **Preview Modu**
   ```bash
   yarn preview
   ```
   - Production build'i preview eder
   - Port: 5500 (vite.config.ts'de tanımlı)

---

## 🛠️ Geliştirme Ortamı Kurulumu

### Gereksinimler

#### Zorunlu Gereksinimler
- **Node.js** - v18.0.0 veya üzeri (önerilen: LTS versiyonu)
- **Yarn** - Paket yöneticisi (npm yerine Yarn kullanılmalı)

#### Opsiyonel Gereksinimler
- **Git** - Versiyon kontrolü için
- Modern web tarayıcısı (Chrome, Firefox, Safari, Edge)

### Node.js Kurulumu

#### macOS (Homebrew)
```bash
# Homebrew ile kurulum
brew install node

# Veya NVM (Node Version Manager) ile
brew install nvm
nvm install --lts
nvm use --lts
```

#### Linux
```bash
# NVM ile kurulum (önerilen)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
nvm use --lts
```

#### Windows
- [Node.js resmi sitesinden](https://nodejs.org/) LTS versiyonunu indirin
- Veya [NVM for Windows](https://github.com/coreybutler/nvm-windows) kullanın

#### Versiyon Kontrolü
```bash
node --version  # v18.x.x veya üzeri olmalı
npm --version   # npm versiyonu (yarn kullanılacak ama kontrol için)
```

### Yarn Kurulumu

#### macOS (Homebrew)
```bash
brew install yarn
```

#### Linux/Windows (npm ile)
```bash
npm install -g yarn
```

#### Versiyon Kontrolü
```bash
yarn --version  # v1.22.0 veya üzeri olmalı
```

### IDE/Editor Önerileri

- **Visual Studio Code** (önerilen)
  - TypeScript desteği
  - Git entegrasyonu
  - Debugging özellikleri
- **Cursor** (AI destekli editor)
- **WebStorm** (JetBrains)

### Önerilen VS Code Eklentileri

- **ESLint** - Kod kalitesi
- **Prettier** - Kod formatlama
- **TypeScript and JavaScript Language Features** - TS desteği
- **GitLens** - Git görselleştirme
- **Jest Runner** - Test çalıştırma

---

## 🚀 Projeyi Ayakta Kaldırma

### 1. Repository'yi Klonlama

```bash
# HTTPS ile
git clone https://github.com/kaangrbz/byte-sync-editor.git

# SSH ile (eğer SSH key yapılandırılmışsa)
git clone git@github.com:kaangrbz/byte-sync-editor.git

# Proje dizinine geç
cd byte-sync-editor
```

### 2. Bağımlılıkları Yükleme

```bash
# Tüm bağımlılıkları yükle
yarn install
```

Bu komut şunları yapar:
- `package.json` dosyasındaki tüm `devDependencies` paketlerini yükler
- `node_modules/` klasörünü oluşturur
- `yarn.lock` dosyasını kullanarak versiyonları sabitler

### 3. Environment Variables

**Not:** Bu projede şu anda environment variable kullanılmamaktadır. Tüm konfigürasyon dosyalarda (vite.config.ts, manifest.json, vb.) yapılandırılmıştır.

Eğer gelecekte environment variable'lar eklenecekse:
- `.env` dosyası oluşturulmalı
- `.env.example` dosyası template olarak eklenmeli
- `.gitignore`'da `.env` zaten mevcut

### 4. Veritabanı Kurulumu

**Not:** Bu proje veritabanı kullanmamaktadır. Tüm veri tarayıcıda (browser) localStorage veya memory'de tutulur.

### 5. İlk Çalıştırma

#### Development Server ile
```bash
# Development server'ı başlat
yarn dev
```

Tarayıcıda `http://localhost:3000` adresine gidin.

#### Doğrudan HTML Dosyası ile
```bash
# index.html dosyasını tarayıcıda aç
open index.html  # macOS
# veya
xdg-open index.html  # Linux
# veya
start index.html  # Windows
```

**Not:** Doğrudan HTML açıldığında bazı özellikler (Service Worker, PWA) çalışmayabilir. Bu durumda bir web sunucusu kullanılmalıdır.

### 6. Watch Modları ve Hot-Reload

Vite otomatik olarak **Hot Module Replacement (HMR)** sağlar:

- TypeScript dosyaları değiştirildiğinde otomatik yeniden derlenir
- CSS değişiklikleri anında yansır
- Tarayıcı otomatik yenilenir (gerekirse)

**Manuel yenileme:** `Ctrl+R` (Windows/Linux) veya `Cmd+R` (macOS)

---

## 📦 Build İşlemleri

### CSS/SCSS Derleme

**Not:** Bu projede SCSS kullanılmamaktadır. Stil dosyası (`styles.css`) doğrudan CSS'tir ve Vite tarafından işlenir.

- Tailwind CSS CDN üzerinden yüklenir (`index.html` içinde)
- `styles.css` Vite tarafından otomatik olarak bundle'a dahil edilir

### TypeScript Derleme

TypeScript derleme işlemi Vite tarafından otomatik yapılır:

```bash
# Production build
yarn build
```

Bu komut:
1. TypeScript dosyalarını (`src/**/*.ts`) derler
2. ES Modules formatına çevirir
3. `dist/` klasörüne output verir
4. Source map'ler oluşturulur (`sourcemap: true`)

**Derleme ayarları:** `tsconfig.json` ve `vite.config.ts` dosyalarında tanımlıdır.

### Production Build

```bash
# Production build oluştur
yarn build
```

**Build çıktısı:**
- `dist/` klasörü oluşturulur
- Tüm dosyalar optimize edilir
- Service Worker otomatik oluşturulur (PWA için)
- Manifest dosyası kopyalanır

**Build sonrası kontrol:**
```bash
# Build çıktısını preview et
yarn preview
```

### Paketleme/Dağıtım

#### GitHub Pages Deployment

Proje `.github/workflows/` klasöründe GitHub Actions workflow'ları içerir:

- `jekyll-gh-pages.yml` - Jekyll tabanlı deployment
- `static.yml` - Static site deployment

**Otomatik deployment:**
- `main` branch'ine push yapıldığında otomatik deploy edilir
- GitHub Pages'de yayınlanır

**Manuel deployment:**
```bash
# Build oluştur
yarn build

# dist/ klasörünü GitHub Pages'e push et
# (gh-pages branch veya docs/ klasörü)
```

#### Static Hosting

Build çıktısı (`dist/`) herhangi bir static hosting servisine deploy edilebilir:

- **Netlify**
- **Vercel**
- **Firebase Hosting**
- **AWS S3 + CloudFront**
- **Nginx** (kendi sunucunuzda)

---

## 🔢 Versiyon Yönetimi

### Kullanılan Versiyonlar

#### Node.js
- **Minimum:** v18.0.0
- **Önerilen:** LTS versiyonu (şu anda v20.x.x)

#### Paket Versiyonları

Ana paketlerin versiyonları `package.json` dosyasında tanımlıdır:

```json
{
  "devDependencies": {
    "typescript": "^5.4.5",
    "vite": "^5.2.11",
    "jest": "^30.1.3",
    "@swc/jest": "^0.2.36",
    "vite-plugin-pwa": "^0.20.5"
  }
}
```

**Versiyon semantikleri:**
- `^5.4.5` - 5.4.5 ve üzeri, 6.0.0 altı (minor ve patch güncellemeleri kabul edilir)
- `^7.28.3` - 7.28.3 ve üzeri, 8.0.0 altı

### Proje Versiyonu

Proje versiyonu şu anda: **v1.42.4**

Versiyon bilgisi şu dosyalarda tutulur:
- `package.json` - `version` alanı
- `manifest.json` - `version` alanı
- `src/app.ts` - Fallback version (kod içinde)
- `index.html` - Title'da görünen versiyon

### Versiyon Güncelleme Yöntemleri

#### Otomatik Versiyon Güncelleme (Önerilen)

Proje, otomatik versiyon güncelleme scripti içerir:

```bash
# Patch versiyonu güncelle (1.42.4 → 1.42.5)
yarn version:patch

# Minor versiyonu güncelle (1.42.4 → 1.43.0)
yarn version:minor

# Major versiyonu güncelle (1.42.4 → 2.0.0)
yarn version:major
```

**Script ne yapar:**
1. `package.json` dosyasındaki versiyonu okur
2. Yeni versiyonu hesaplar (patch/minor/major)
3. Şu dosyaları günceller:
   - `package.json` - `version` alanı
   - `manifest.json` - `version` alanı
   - `sw.js` - `CACHE_NAME` değeri (eğer varsa)
   - `index.html` - Title'daki versiyon
   - `src/app.ts` - Fallback version

**Versiyon türleri:**
- **patch** - Hata düzeltmeleri, küçük iyileştirmeler (1.42.4 → 1.42.5)
- **minor** - Yeni özellikler, iyileştirmeler (1.42.4 → 1.43.0)
- **major** - Büyük değişiklikler, uyumsuzluklar (1.42.4 → 2.0.0)

#### Manuel Versiyon Güncelleme

Eğer otomatik script kullanılmak istenmiyorsa:

1. `package.json` dosyasındaki `version` alanını güncelleyin
2. `manifest.json` dosyasındaki `version` alanını güncelleyin
3. `src/app.ts` dosyasındaki fallback version'ı güncelleyin
4. `index.html` dosyasındaki title'daki versiyonu güncelleyin

**Not:** Manuel güncelleme hataya açıktır. Otomatik script kullanılması önerilir.

### Versiyon Güncelleme Sonrası

Versiyon güncellemesi yapıldıktan sonra:

```bash
# Değişiklikleri commit et
git add .
git commit -m "chore: versiyon 1.42.5 güncellendi"

# Tag oluştur
git tag v1.42.5

# Push et
git push origin main --tags
```

---

## 🔀 GitLab/Git Kullanımı

### Repository Klonlama

```bash
# HTTPS ile
git clone https://github.com/kaangrbz/byte-sync-editor.git

# SSH ile
git clone git@github.com:kaangrbz/byte-sync-editor.git
```

### Git Konfigürasyonu

```bash
# Kullanıcı adı ve email ayarla (ilk kez)
git config --global user.name "Adınız Soyadınız"
git config --global user.email "email@example.com"

# Konfigürasyonu kontrol et
git config --list
```

### Branch Yönetimi

#### Mevcut Branch'leri Görüntüleme
```bash
# Tüm branch'leri listele
git branch -a

# Sadece local branch'leri
git branch

# Remote branch'leri
git branch -r
```

#### Yeni Branch Oluşturma
```bash
# Yeni branch oluştur ve geçiş yap
git checkout -b feature/yeni-ozellik

# Veya (Git 2.23+)
git switch -c feature/yeni-ozellik
```

#### Branch Değiştirme
```bash
# Branch değiştir
git checkout main
# veya
git switch main
```

#### Branch Silme
```bash
# Local branch sil
git branch -d feature/yeni-ozellik

# Zorla sil (merge edilmemiş değişiklikler varsa)
git branch -D feature/yeni-ozellik

# Remote branch sil
git push origin --delete feature/yeni-ozellik
```

### Commit İşlemleri

#### Değişiklikleri Staging'e Ekleme
```bash
# Tüm değişiklikleri ekle
git add .

# Belirli dosyaları ekle
git add src/app.ts
git add styles.css

# Klasör ekle
git add src/
```

#### Commit Oluşturma
```bash
# Commit mesajı ile
git commit -m "feat: yeni özellik eklendi"

# Detaylı commit mesajı
git commit -m "feat: yeni özellik eklendi" -m "Açıklama detayları buraya"
```

#### Commit Mesaj Formatı

Proje **Conventional Commits** formatını kullanır:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type'lar:**
- `feat` - Yeni özellik
- `fix` - Hata düzeltmesi
- `docs` - Dokümantasyon değişikliği
- `style` - Kod formatlama (çalışan kodu etkilemez)
- `refactor` - Kod refactoring
- `test` - Test ekleme/düzeltme
- `chore` - Build süreçleri, versiyon güncelleme, vb.

**Örnekler:**
```bash
git commit -m "feat: 4-in-1 mod eklendi"
git commit -m "fix: select all hatası düzeltildi"
git commit -m "docs: README güncellendi"
git commit -m "chore: versiyon 1.42.5 güncellendi"
```

#### Son Commit'i Düzenleme
```bash
# Son commit mesajını değiştir
git commit --amend -m "Yeni commit mesajı"

# Son commit'e dosya ekle
git add .
git commit --amend --no-edit
```

### Push ve Pull İşlemleri

#### Push (Gönderme)
```bash
# İlk push (branch'i remote'a ekle)
git push -u origin feature/yeni-ozellik

# Sonraki push'lar
git push

# Tüm branch'leri push et
git push --all

# Tag'leri push et
git push --tags
```

#### Pull (Çekme)
```bash
# Remote değişiklikleri çek ve merge et
git pull

# Sadece çek, merge etme
git fetch

# Belirli branch'i çek
git pull origin main
```

### Merge Request (Pull Request) Oluşturma

#### GitHub'da Pull Request

1. **Branch'i push et:**
   ```bash
   git push -u origin feature/yeni-ozellik
   ```

2. **GitHub'da PR oluştur:**
   - Repository sayfasına git
   - "Pull requests" sekmesine tıkla
   - "New pull request" butonuna tıkla
   - Base branch: `main`, Compare branch: `feature/yeni-ozellik`
   - Başlık ve açıklama ekle
   - "Create pull request" butonuna tıkla

3. **PR açıklaması örneği:**
   ```markdown
   ## Değişiklik Özeti
   - Yeni özellik eklendi
   - Hata düzeltmesi yapıldı

   ## Test Edildi
   - [x] Local'de test edildi
   - [x] Testler geçti

   ## Ekran Görüntüleri
   (varsa ekle)
   ```

#### GitLab'da Merge Request

1. **Branch'i push et:**
   ```bash
   git push -u origin feature/yeni-ozellik
   ```

2. **GitLab'da MR oluştur:**
   - Repository sayfasına git
   - "Merge requests" sekmesine tıkla
   - "New merge request" butonuna tıkla
   - Source branch: `feature/yeni-ozellik`, Target branch: `main`
   - Başlık ve açıklama ekle
   - "Create merge request" butonuna tıkla

### Çakışma Çözümü (Merge Conflict)

#### Çakışma Durumu
```bash
# Pull yaparken çakışma oluştu
git pull
# CONFLICT (content): Merge conflict in src/app.ts
```

#### Çakışmayı Çözme

1. **Çakışmalı dosyaları aç:**
   ```bash
   # Çakışmalı dosyaları listele
   git status
   ```

2. **Dosyayı düzenle:**
   Çakışma işaretleri:
   ```typescript
   <<<<<<< HEAD
   // Mevcut branch'deki kod
   =======
   // Gelen branch'deki kod
   >>>>>>> feature/yeni-ozellik
   ```

3. **Çakışmayı çöz:**
   - İstenen kodu seç
   - Çakışma işaretlerini (`<<<<<<<`, `=======`, `>>>>>>>`) sil
   - Dosyayı kaydet

4. **Çözümü işaretle:**
   ```bash
   # Çözülen dosyaları staging'e ekle
   git add src/app.ts

   # Merge'i tamamla
   git commit
   ```

#### Çakışmayı İptal Etme
```bash
# Merge'i iptal et
git merge --abort
```

### Önemli Git Komutları

```bash
# Durum kontrolü
git status

# Değişiklik geçmişi
git log
git log --oneline
git log --graph --oneline --all

# Değişiklikleri görüntüle
git diff
git diff --staged

# Remote repository bilgisi
git remote -v

# Branch'leri görüntüle
git branch -a

# Tag oluştur
git tag v1.42.5
git tag -a v1.42.5 -m "Versiyon 1.42.5"

# Tag'leri listele
git tag

# Tag'i push et
git push origin v1.42.5
```

### Best Practices

1. **Küçük ve sık commit yapın**
   - Her commit tek bir değişikliği temsil etmeli
   - Anlamlı commit mesajları kullanın

2. **Branch stratejisi**
   - `main` branch her zaman çalışır durumda olmalı
   - Yeni özellikler için `feature/` branch'leri kullanın
   - Hata düzeltmeleri için `fix/` branch'leri kullanın

3. **Pull Request öncesi**
   - Kodunuzu test edin
   - Linter hatalarını düzeltin
   - Gerekli dokümantasyonu güncelleyin

4. **Merge öncesi**
   - `main` branch'i pull edin
   - Çakışmaları çözün
   - Testleri çalıştırın

5. **Commit mesajları**
   - Conventional Commits formatını kullanın
   - Türkçe veya İngilizce tutarlı olun
   - Açıklayıcı mesajlar yazın

---

## 📝 Önemli Notlar

### Veritabanı

**Bu proje veritabanı kullanmamaktadır.** Tüm veri:
- Tarayıcıda (browser) memory'de tutulur
- localStorage kullanılmaz (şu an için)
- Session-based çalışır (sayfa yenilendiğinde sıfırlanır)

### Native Modül Sorunları

**Bu proje native modül kullanmamaktadır.** Tüm kod:
- TypeScript ile yazılmış
- Tarayıcıda çalışır
- Node.js native modülleri gerektirmez

### Port Çakışmaları

Vite development server varsayılan olarak **port 3000** kullanır. Eğer port kullanımdaysa:

**Çözüm 1: Vite config'de port değiştir**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 3001, // Farklı port
  },
});
```

**Çözüm 2: Komut satırından port belirt**
```bash
yarn dev --port 3001
```

**Preview server** varsayılan olarak **port 5500** kullanır.

### Environment-Specific Notlar

#### Development
- Source map'ler aktif (`sourcemap: true`)
- HMR (Hot Module Replacement) aktif
- Detaylı hata mesajları

#### Production
- Kod minify edilir
- Source map'ler oluşturulur (debug için)
- Service Worker aktif
- PWA manifest dahil

### Bilinen Sorunlar ve Çözümleri

#### 1. Service Worker Cache Sorunları

**Sorun:** Eski versiyon cache'lenmiş, yeni versiyon görünmüyor.

**Çözüm:**
```bash
# Tarayıcıda:
# 1. Developer Tools'u aç (F12)
# 2. Application > Service Workers
# 3. "Unregister" butonuna tıkla
# 4. Cache Storage'ı temizle
# 5. Sayfayı yenile (Ctrl+Shift+R veya Cmd+Shift+R)
```

#### 2. TypeScript Derleme Hataları

**Sorun:** TypeScript derleme hataları alınıyor.

**Çözüm:**
```bash
# TypeScript'i kontrol et
npx tsc --noEmit

# Hataları düzelt
# Vite config'de skipLibCheck: true olduğundan emin ol
```

#### 3. Jest Test Hataları

**Sorun:** Testler çalışmıyor veya hata veriyor.

**Çözüm:**
```bash
# node_modules'ü temizle ve yeniden yükle
rm -rf node_modules yarn.lock
yarn install

# Testleri tekrar çalıştır
yarn test
```

#### 4. PWA Install Prompt Görünmüyor

**Sorun:** PWA install butonu görünmüyor.

**Çözüm:**
- HTTPS veya localhost üzerinde çalıştığından emin olun
- Manifest.json dosyasının doğru yüklendiğini kontrol edin
- Service Worker'ın kayıtlı olduğunu kontrol edin

#### 5. Tailwind CSS Stilleri Uygulanmıyor

**Sorun:** Tailwind utility class'ları çalışmıyor.

**Çözüm:**
- Tailwind CDN'in `index.html`'de yüklendiğini kontrol edin
- Tarayıcı console'unda hata olup olmadığını kontrol edin
- CDN bağlantısının çalıştığını kontrol edin

---

## 🔗 İlgili Dosyalar

### Konfigürasyon Dosyaları

- **`package.json`** - NPM paket tanımları, script'ler, versiyon
- **`tsconfig.json`** - TypeScript derleyici ayarları
- **`vite.config.ts`** - Vite build tool ayarları, PWA plugin
- **`jest.config.js`** - Jest test framework ayarları
- **`.babelrc`** - Babel transpiler ayarları
- **`manifest.json`** - PWA manifest, uygulama metadata
- **`.gitignore`** - Git ignore kuralları

### Dokümantasyon Dosyaları

- **`README.md`** - Kullanıcı dokümantasyonu
- **`README-WEB.md`** - Web deployment dokümantasyonu
- **`README-DEV.md`** - Bu dosya (geliştirici dokümantasyonu)
- **`CHANGELOG.md`** - Versiyon geçmişi ve değişiklikler

### Script Dosyaları

- **`update-version.js`** - Otomatik versiyon güncelleme scripti
- **`package.json` scripts:**
  - `yarn test` - Testleri çalıştır
  - `yarn test:watch` - Testleri watch modunda çalıştır
  - `yarn test:coverage` - Test coverage raporu
  - `yarn test:ci` - CI için test
  - `yarn build` - Production build
  - `yarn preview` - Build preview
  - `yarn version:patch` - Patch versiyon güncelle
  - `yarn version:minor` - Minor versiyon güncelle
  - `yarn version:major` - Major versiyon güncelle

### Önemli Kaynak Dosyalar

- **`src/app.ts`** - Ana uygulama giriş noktası
- **`src/state-manager.ts`** - Uygulama durum yönetimi
- **`src/grid-manager.ts`** - Grid (16x16 byte grid) yönetimi
- **`src/tab-manager.ts`** - Sekme yönetimi
- **`src/utils.ts`** - Yardımcı fonksiyonlar
- **`index.html`** - Ana HTML dosyası
- **`styles.css`** - Ana stil dosyası

### Test Dosyaları

- **`tests/data-analysis.test.ts`** - Veri analizi testleri
- **`tests/karakter-donusum.test.ts`** - Karakter dönüşüm testleri
- **`tests/kopyalama.test.ts`** - Kopyalama işlevi testleri
- **`tests/tab-islemleri.test.ts`** - Sekme işlemleri testleri
- **`tests/utils.test.ts`** - Yardımcı fonksiyon testleri

---

## 📚 Ek Kaynaklar

### Proje İlgili
- [GitHub Repository](https://github.com/kaangrbz/byte-sync-editor)
- [Live Demo](https://kaangrbz.github.io/byte-sync-editor/)

### Teknoloji Dokümantasyonları
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Jest Documentation](https://jestjs.io/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Yardımcı Araçlar
- [Node.js Downloads](https://nodejs.org/)
- [Yarn Installation](https://yarnpkg.com/getting-started/install)
- [Git Documentation](https://git-scm.com/doc)

---

## 🤝 Katkıda Bulunma

Katkıda bulunmak için:

1. Repository'yi fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m "feat: yeni özellik"`)
4. Branch'inizi push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request oluşturun

---

## 📄 Lisans

ISC License - Projeyi özgürce kullanabilirsiniz!

---

**Son Güncelleme:** 2026-01-27  
**Versiyon:** 1.42.4
