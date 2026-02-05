# ByteSync Editor – Genel İşleyiş ve İnceleme Raporu

## 1. Mimari Özet

Uygulama **tek kaynaklı veri (single source of truth)** mantığıyla çalışıyor: tüm byte verisi `state-manager` içindeki tek bir `Uint8Array` ve `touchedIndices` ile tutuluyor. ASCII, Hex, Decimal, Binary sekmeleri aynı veriyi farklı formatlarda gösteriyor; bir sekmede yapılan değişiklik anında diğerlerine yansıyor.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   index.html    │────▶│    app.ts         │────▶│ state-manager   │
│   (DOM/UI)      │     │ (başlatma, config)│     │ (data, touched) │
└────────┬────────┘     └────────┬──────────┘     └────────┬────────┘
         │                       │                          │
         ▼                       ▼                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ grid-manager    │◀───▶│ tab-manager      │     │ utils           │
│ (input, grid)   │     │ (sekme geçişi)   │     │ (parse/format)  │
└────────┬────────┘     └──────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ context-menu    │     │ four-in-one, PTP  │
│ file-handler    │     │ theme, PWA, ads   │
└─────────────────┘     └──────────────────┘
```

---

## 2. Çalışma Mantığı

### 2.1 State (state-manager.ts)

- **data**: Byte dizisi (`Uint8Array`). Başlangıç 256, gerektikçe `expandDataArray` ile büyüyor.
- **touchedIndices**: Kullanıcının dokunduğu (doldurduğu veya sildiği) index’ler. `getDataSize()` = `max(touchedIndices) + 1`, boşsa 1. Grid’de gösterilen hücre sayısı `getInputCount() = getDataSize() + 1` (sondaki boş “yeni veri” hücresi için).
- **setByte(i, 0)**: Değer 0 yapılınca `i` touched’dan çıkarılıyor → silerek geri gelirken grid kısalıyor.
- **insertByteAt(i, 0)**: `i` konumuna 0 ekleyip sonrakileri sağa kaydırıyor (Space ile boş hücre ekleme).

### 2.2 Grid (grid-manager.ts)

- Her sekme (hex, ascii, decimal, binary) kendi grid’ine sahip; `createGrid` her seferinde `getInputCount()` kadar input üretiyor.
- Olaylar: `focus`, `beforeinput`, `input`, `keydown`, `paste`. Yazılan metin `parseTextToBytes` ile byte’a çevriliyor, `setByte` ile state güncelleniyor, `updateAllViews(true)` ile tüm sekmeler senkronize ediliyor.
- Değer “tamamlanınca” (örn. hex’te 2 karakter) bir sonraki hücreye geçiş **aktif sekme** içinde `getActiveTab()?.querySelector([data-index="..."])` ile yapılıyor; böylece odak yanlış (gizli) sekmeye gitmiyor.
- Space (seçim yokken): `insertByteAt(index, 0)` + grid yeniden oluşturma + aynı index’e odak.
- Backspace (boş hücrede): Bir önceki hücreye git.
- Silme (boş input): `setByte(index, 0)` + `recreateAllGrids()` + `updateAllViews` → grid kısalıyor.

### 2.3 Sekmeler (tab-manager.ts)

- Sekme değişince sadece görünür içerik ve buton stilleri değişiyor; veri state’te aynı kalıyor.
- Aktif sekme `localStorage`’a yazılıyor; son açılan sekme korunuyor.
- Tab değişince seçim temizleniyor, aktif hücre varsa o index’teki input’a odak veriliyor.

### 2.4 Veri dönüşümü (utils.ts)

- **parseTextToBytes**: Metin → byte dizisi. ASCII (UTF-8), hex (virgül/boşluk ayrılmış), decimal, binary formatları destekleniyor; paste için çoklu değer parse ediliyor.
- **formatBytesToText**: Byte dizisi → metin. Delimiter (virgül, boşluk, none, custom) ve format seçenekleri var.
- **getDelimiter**: Radio/custom ayarlarından delimiter string’i üretiyor.

### 2.5 Diğer modüller

- **context-menu**: Sağ tık menüsü; copy/paste/cut, Select All, Clear, CR/LF ekleme, Refresh. State ve grid-manager fonksiyonlarını kullanıyor.
- **file-handler**: Dosya açma (File System Access API / fallback). State’e yüklenen byte’lar yazılıyor.
- **four-in-one-mode**: Aynı veriyi 4 format (ASCII, hex, decimal, binary) textarea’da gösteriyor; senkronize güncelleniyor.
- **docklight-ptp-parser**: PTP dosyası parse, SEND blokları listesi ve byte düzenleme.
- **theme, notification-helper, pwa-update-manager, ads-manager, cookie-consent, feedback-form**: UI / PWA / reklam / kullanıcı geri bildirimi.

---

## 3. Artılar

| Konu | Açıklama |
|------|----------|
| Tek veri kaynağı | Tüm görünümler aynı state’e bağlı; tutarlılık ve senkronizasyon doğal. |
| Modüler yapı | state, grid, tab, utils, modlar ayrı dosyalarda; sorumluluklar net. |
| Tip güvenliği | TypeScript, `GridFormat` / `DelimiterOption` gibi tipler kullanılıyor. |
| UTF-8 / çoklu byte | ASCII modunda UTF-8 (ğ, ü, ş vb.) tek karakterde doğru byte’lara çevriliyor. |
| Klavye odaklı kullanım | Cmd+1..6 sekme, Cmd+Enter CR, Cmd+Shift+Enter LF, Space boş hücre ekleme, Backspace önceki hücre. |
| Grid boyutu | `touchedIndices` ile “dolu” kısım hesaplanıyor; silince grid kısalıyor, ekleyince uzuyor. |
| PWA / tema | Offline çalışma, tema, bildirimler ve versiyon script’i (patch/minor/major/manual) mevcut. |
| Test altyapısı | Jest ile utils ve diğer modüller test edilebilir. |

---

## 4. Eksiler ve Riskler

| Konu | Açıklama |
|------|----------|
| `document.querySelector` kullanımı | `getActiveInput(index)` ve context-menu’daki `document.querySelector(\`[data-index="${activeIndex}"]\`)` tüm dokümanda ilk eşleşeni buluyor. Görünür sekme farklıysa, odaklanan veya işlem yapılan input gizli sekmedeki hücre olabilir. **Öneri**: Her zaman aktif sekme içinde arama yap: `getActiveTab()?.querySelector(...)`. |
| `recreateAllGrids` maliyeti | Her veri değişikliğinde (tek byte yazma, silme, Space ile ekleme) tüm grid’ler yeniden oluşturuluyor. Çok büyük veride (binlerce byte) performans düşebilir. **Öneri**: Sadece boyut değiştiğinde veya belirli eylemlerde recreate; tek hücre güncellemesinde sadece `updateAllViews`. |
| Genişleme üst sınırı | `expandDataArray` ve `checkAndExpandIfNeeded` ile büyüme var; sabit bir üst limit (örn. 1024) kodda geçiyor. Çok büyük dosyalar için bellek ve UI performansı ayrıca değerlendirilmeli. |
| “0” değeri gösterimi | `setByte(i, 0)` ile 0 yazıldığında index touched’dan çıkarılıyor; bu yüzden o hücre boş görünüyor. Bilinçli “0” yazıp gösterme ile “sildim” ayrımı yok. (Bazı hex editörlerinde 0’ı göstermek tercih edilebilir.) |
| beforeinput + keydown | Space hem `keydown`’da özel işleniyor hem `beforeinput`’a düşebilir. `preventDefault` ile engelleme doğru; farklı tarayıcılarda test edilmesi iyi olur. |
| Bağımlılık / başlatma sırası | `app.ts` içinde DOM ve modül yükleme sırası (grid → tab → four-in-one → PTP → context menu) sabit. Yeni modül eklerken sıra ve bağımlılıklar dikkate alınmalı. |

---

## 5. Özet Tablo

| Alan | Değerlendirme |
|------|----------------|
| Mimari | Tek state, modüler; anlaşılır ve genişletilebilir. |
| Veri akışı | State → grid/tab/utils tutarlı; senkronizasyon doğru tasarlanmış. |
| Kullanıcı deneyimi | Sekmeler, klavye, Space/Backspace ile akıcı; odak aktif sekmede doğru yerde. |
| Performans | Küçük/orta veri için yeterli; büyük veride `recreateAllGrids` sınırlayıcı olabilir. |
| Bakım / risk | `querySelector` ile index aramada aktif sekme kapsamı eksik yerler var; düzeltme önerilir. |

---

## 6. Kısa Öneri Listesi

1. **getActiveInput ve context-menu**: `[data-index="..."]` aramasını her yerde **aktif sekme** ile sınırla (`getActiveTab()?.querySelector`).
2. **recreateAllGrids**: Sadece `getInputCount()` değiştiğinde veya paste/clear gibi toplu işlemlerde çağır; tek hücre input’ta sadece `updateAllViews`.
3. **Büyük veri**: Örneğin 10K+ byte için sanal listeleme (sadece görünen satırları DOM’da tutma) düşünülebilir.
4. **0 değeri**: İsteğe bağlı “show zeros” veya “explicit zero” modu eklenebilir; 0 yazıldığında touched’da tutulup hücrede 0 gösterilebilir.

Bu rapor, mevcut kod tabanının genel işleyişini, artılarını, eksilerini ve çalışma biçimini özetler.
