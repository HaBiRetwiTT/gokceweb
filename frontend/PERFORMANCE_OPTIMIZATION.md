# 🚀 Kartli-Islem Sayfası Performans Optimizasyonu

## 🔍 Sorun Analizi

### Mevcut Durum:
- Sayfa yüklendiğinde `refreshData()` fonksiyonu çağrılıyor
- `selectBestCard()` fonksiyonu her kart için **ayrı ayrı API çağrısı** yapıyor
- Toplam **10+ API çağrısı** yapılıyor (sequential olarak)

### Neden Railway/Vercel'de Daha Hızlıydı?
1. **CDN Cache**: Vercel CDN cache kullanıyordu
2. **Database Proximity**: Railway ve Vercel'in database'e daha yakın olması
3. **Optimized Infrastructure**: Railway/Vercel'in optimize edilmiş altyapısı

---

## ✅ Çözüm 1: selectBestCard() Optimizasyonu

### Sorun:
`selectBestCard()` fonksiyonu her kart için ayrı API çağrısı yapıyor:

```typescript
// ❌ KÖTÜ: Her kart için ayrı API çağrısı
for (const cardType of cardTypes) {
  const list = await loadMusteriListesiReturn(cardType); // Her biri ayrı API çağrısı
}
```

### Çözüm:
Stats verisini kullan, gereksiz API çağrılarını kaldır:

```typescript
// ✅ İYİ: Stats verisini kullan
async function selectBestCard() {
  // Stats zaten yüklenmiş, onu kullan
  const stats = stats.value;
  
  // Öncelik sırasına göre kontrol et
  if (stats.SuresiGecentKonaklama > 0) {
    void loadFilteredData('suresi-dolan');
    return;
  }
  
  if (stats.DevamEdenKonaklama > 0) {
    void loadFilteredData('toplam-aktif');
    return;
  }
  
  // Diğer kartlar için stats kullan
  const cardPriorities = [
    { key: 'AlacakliMusteriSayisi', card: 'alacakli-musteriler' },
    { key: 'BorcluMusteriSayisi', card: 'borclu-musteriler' },
    { key: 'YeniMusteriKonaklama', card: 'yeni-musteri' },
    { key: 'YeniGirisKonaklama', card: 'yeni-giris' },
    { key: 'BugünCikanKonaklama', card: 'bugun-cikan' },
  ];
  
  let bestCard = null;
  let maxCount = 0;
  
  for (const { key, card } of cardPriorities) {
    const count = stats[key] || 0;
    if (count > maxCount) {
      maxCount = count;
      bestCard = card;
    }
  }
  
  if (bestCard) {
    void loadFilteredData(bestCard);
  }
}
```

---

## ✅ Çözüm 2: Backend Caching

### Backend'de Cache Ekle:

```typescript
// backend/src/dashboard/dashboard.service.ts
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    // ...
  ) {}

  async getStats() {
    const cacheKey = 'dashboard:stats';
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const stats = await this.calculateStats();
    await this.cacheManager.set(cacheKey, stats, 60000); // 60 saniye cache
    return stats;
  }
}
```

---

## ✅ Çözüm 3: Database Query Optimizasyonu

### Index Kontrolü:

```sql
-- Önemli sorgular için index'ler
CREATE INDEX IX_tblKonaklama_MstrDurum ON tblKonaklama(MstrDurum);
CREATE INDEX IX_tblKonaklama_KnklmGrsTrh ON tblKonaklama(KnklmGrsTrh);
CREATE INDEX IX_tblKonaklama_KnklmPlnTrh ON tblKonaklama(KnklmPlnTrh);
```

---

## ✅ Çözüm 4: Frontend Lazy Loading

### Sadece Gerekli Verileri Yükle:

```typescript
// ❌ KÖTÜ: Tüm verileri yükle
async function refreshData() {
  await Promise.all([
    loadStats(),
    loadKonaklamaTipleri(),
    loadOdaTipleri(),
    loadCikisYapanlarSayisi(),
    loadDinamikKonaklamaTipleri(),
    loadDinamikOdaTipleri()
  ]);
}

// ✅ İYİ: Sadece gerekli verileri yükle
async function refreshData() {
  // İlk yüklemede sadece kritik veriler
  await Promise.all([
    loadStats(),
    loadKonaklamaTipleri(),
    loadOdaTipleri(),
    loadCikisYapanlarSayisi()
  ]);
  
  // Dinamik listeleri sadece kart seçildiğinde yükle
  // (zaten loadSelectedCardData içinde yapılıyor)
}
```

---

## 🎯 Öncelikli Düzeltmeler

### 1. selectBestCard() Optimizasyonu (En Önemli)
- Stats verisini kullan
- Gereksiz API çağrılarını kaldır
- **Beklenen İyileştirme: %70-80 daha hızlı**

### 2. Backend Caching
- Stats için 60 saniye cache
- Müşteri listeleri için 30 saniye cache
- **Beklenen İyileştirme: %50-60 daha hızlı**

### 3. Database Index'leri
- Önemli sorgular için index ekle
- **Beklenen İyileştirme: %30-40 daha hızlı**

---

## 📋 Uygulama Adımları

### 1. Frontend Optimizasyonu (Hemen)

`frontend/src/pages/kartli-islem.vue` dosyasında:

```typescript
// selectBestCard() fonksiyonunu değiştir
async function selectBestCard() {
  // Stats verisini kullan (zaten yüklenmiş)
  const stats = stats.value;
  
  // Öncelik sırasına göre kontrol et
  if (stats.SuresiGecentKonaklama > 0) {
    void loadFilteredData('suresi-dolan');
    return;
  }
  
  if (stats.DevamEdenKonaklama > 0) {
    void loadFilteredData('toplam-aktif');
    return;
  }
  
  // Diğer kartlar için stats kullan
  const priorities = [
    { count: stats.AlacakliMusteriSayisi || 0, card: 'alacakli-musteriler' },
    { count: stats.BorcluMusteriSayisi || 0, card: 'borclu-musteriler' },
    { count: stats.YeniMusteriKonaklama || 0, card: 'yeni-musteri' },
    { count: stats.YeniGirisKonaklama || 0, card: 'yeni-giris' },
    { count: stats.BugünCikanKonaklama || 0, card: 'bugun-cikan' },
  ];
  
  const best = priorities.reduce((max, current) => 
    current.count > max.count ? current : max
  , priorities[0]);
  
  if (best.count > 0) {
    void loadFilteredData(best.card);
  } else {
    // Varsayılan olarak toplam-aktif'i seç
    void loadFilteredData('toplam-aktif');
  }
}
```

### 2. Backend Caching (Sonra)

Backend'e cache ekle (opsiyonel, ama önerilir).

---

## 🎯 Beklenen Sonuçlar

### Önce:
- Sayfa yükleme: **5-10 saniye**
- API çağrıları: **10+ çağrı**

### Sonra:
- Sayfa yükleme: **1-2 saniye**
- API çağrıları: **4-5 çağrı**

**Toplam İyileştirme: %70-80 daha hızlı**

---

## 📝 Notlar

1. **Stats verisi zaten yükleniyor** - `refreshData()` içinde `loadStats()` çağrılıyor
2. **selectBestCard() gereksiz API çağrıları yapıyor** - Stats verisini kullanmalı
3. **Backend caching** opsiyonel ama önerilir
4. **Database index'leri** kontrol edilmeli

