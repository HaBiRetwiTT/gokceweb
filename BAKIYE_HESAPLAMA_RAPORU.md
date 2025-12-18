# 📊 Bakiye Hesaplama Sorguları Raporu

## 📋 Özet

Bu rapor, kazanc-tablo, kasa-islem ve nakit-tablo sayfalarında kullanılan bakiye hesaplama sorgularını detaylandırmaktadır.

---

## 🔍 Sayfa Bazında Analiz

### 1. Kazanc-Tablo Sayfası

**Chip Etiketleri:** Nakit, Kart, Banka (EFT), Acenta

**Endpoint:** `/islem/guncel-bakiye`

**Frontend Kullanımı:**
```typescript
// frontend/src/pages/kazanc-tablo.vue (satır 1292-1331)
const loadKasaBakiyeleri = async () => {
  const endDate: string | undefined = undefined; // ❌ Tarih filtresi YOK
  
  // Nakit
  await api.get('/islem/guncel-bakiye', {
    params: { islemArac: 'nakit', islemTip: 'Giren', endDate }
  });
  
  // Kart
  await api.get('/islem/guncel-bakiye', {
    params: { islemArac: 'kart', islemTip: 'Giren', endDate }
  });
  
  // EFT
  await api.get('/islem/guncel-bakiye', {
    params: { islemArac: 'eft', islemTip: 'Giren', endDate }
  });
  
  // Acenta
  await api.get('/islem/guncel-bakiye', {
    params: { islemArac: 'acenta', islemTip: 'Giren', endDate }
  });
}
```

**Backend Fonksiyonu:** `getGuncelBakiye()` (satır 1333-1442)

**Backend Sorgusu:**
```sql
SELECT 
  SUM(CASE WHEN i.islemTip IN ('GELİR', 'Giren') THEN i.islemTutar ELSE 0 END) as toplamGelir,
  SUM(CASE WHEN i.islemTip IN ('GİDER', 'Çıkan') THEN i.islemTutar ELSE 0 END) as toplamGider
FROM tblislem i
WHERE 1=1
  AND i.islemArac = 'Nakit Kasa(TL)'  -- veya 'Kredi Kartları', 'Banka EFT', 'Acenta Tahsilat'
  AND (i.islemBilgi IS NULL OR i.islemBilgi NOT LIKE '%=DEPOZİTO ALACAĞI=%')
  -- ❌ Tarih filtresi YOK (endDate undefined olduğu için)
```

**Hesaplama:** `toplamGelir - toplamGider = Bakiye`

**Mantık:** ✅ Tüm zamanlar Giren - Tüm zamanlar Çıkan = Bakiye (DOĞRU)

**Sorun:** ❌ `islemTip IN ('GELİR', 'Giren')` ve `islemTip IN ('GİDER', 'Çıkan')` kullanılıyor
- Beklenen: Sadece `islemTip = 'Giren'` ve `islemTip = 'Çıkan'`
- Mevcut: Hem `'GELİR'/'GİDER'` hem de `'Giren'/'Çıkan'` dahil ediliyor

---

### 2. Kasa-İşlem Sayfası

**Chip Etiketleri:** Cari, Nakit, Kart, EFT, Acenta, Depozito

**Endpoint:** `/islem/guncel-bakiye` veya `/islem/secilen-gun-bakiyesi`

**Frontend Kullanımı:**
```typescript
// frontend/src/pages/kasa-islem.vue (satır 3198-3242)
const loadTumKasaBakiyeleri = async () => {
  // Seçili tarih varsa seçili gün bakiyesi, yoksa güncel bakiye
  const endpoint = selectedDate.value 
    ? '/islem/secilen-gun-bakiyesi'  // ✅ Tarih filtresi VAR
    : '/islem/guncel-bakiye';         // ❌ Tarih filtresi YOK
  
  for (const kasaTipi of ['cari', 'nakit', 'kart', 'eft', 'acenta', 'depozito']) {
    const params = {
      islemArac: kasaTipi,
      islemTip: getIslemTipForKasa(kasaTipi) // 'GELİR' veya 'Giren'
    };
    
    if (selectedDate.value) {
      params.secilenTarih = selectedDate.value;
    }
    
    await api.get(endpoint, { params });
  }
}
```

**Backend Fonksiyonu:** 
- `getGuncelBakiye()` (tarih yoksa)
- `getSecilenGunBakiyesi()` (tarih varsa)

**Backend Sorgusu (Seçili Tarih Varsa):**
```sql
SELECT 
  SUM(CASE WHEN i.islemTip IN ('GELİR', 'Giren') THEN i.islemTutar ELSE 0 END) as toplamGelir,
  SUM(CASE WHEN i.islemTip IN ('GİDER', 'Çıkan') THEN i.islemTutar ELSE 0 END) as toplamGider
FROM tblislem i
WHERE 1=1
  AND i.islemArac = 'Nakit Kasa(TL)'  -- veya diğer kasa tipleri
  AND (i.islemBilgi IS NULL OR i.islemBilgi NOT LIKE '%=DEPOZİTO ALACAĞI=%')
  AND CONVERT(DATE, i.iKytTarihi, 104) <= CONVERT(DATE, @secilenTarih, 104)  -- ✅ Tarih filtresi VAR
```

**Hesaplama:** `toplamGelir - toplamGider = Bakiye`

**Mantık:** ✅ İlk günden seçilen güne kadar Giren - Çıkan = Bakiye (DOĞRU)

**Sorun:** ❌ `islemTip IN ('GELİR', 'Giren')` ve `islemTip IN ('GİDER', 'Çıkan')` kullanılıyor
- Beklenen: Sadece `islemTip = 'Giren'` ve `islemTip = 'Çıkan'`
- Mevcut: Hem `'GELİR'/'GİDER'` hem de `'Giren'/'Çıkan'` dahil ediliyor

---

### 3. Nakit-Tablo Sayfası

**Chip Etiketleri:** Nakit, Banka (EFT), Kart, Acenta

**Endpoint:** `/islem/secilen-gun-bakiyesi`

**Frontend Kullanımı:**
```typescript
// frontend/src/pages/nakit-tablo.vue (satır 2335-2381)
async function loadKasaBakiyeleri(tarih: string) {
  const [nakitRes, bankaRes, kartRes, acentaRes, depozitoRes] = await Promise.all([
    apiInstance.get('/islem/secilen-gun-bakiyesi', {
      params: { islemArac: 'nakit', islemTip: 'Giren', secilenTarih: tarih }
    }),
    apiInstance.get('/islem/secilen-gun-bakiyesi', {
      params: { islemArac: 'eft', islemTip: 'Giren', secilenTarih: tarih }
    }),
    apiInstance.get('/islem/secilen-gun-bakiyesi', {
      params: { islemArac: 'kart', islemTip: 'Giren', secilenTarih: tarih }
    }),
    apiInstance.get('/islem/secilen-gun-bakiyesi', {
      params: { islemArac: 'acenta', islemTip: 'Giren', secilenTarih: tarih }
    }),
    apiInstance.get('/islem/secilen-gun-bakiyesi', {
      params: { islemArac: 'depozito', islemTip: 'Giren', secilenTarih: tarih }
    })
  ]);
}
```

**Backend Fonksiyonu:** `getSecilenGunBakiyesi()` (satır 1447-1547)

**Backend Sorgusu:**
```sql
SELECT 
  SUM(CASE WHEN i.islemTip IN ('GELİR', 'Giren') THEN i.islemTutar ELSE 0 END) as toplamGelir,
  SUM(CASE WHEN i.islemTip IN ('GİDER', 'Çıkan') THEN i.islemTutar ELSE 0 END) as toplamGider
FROM tblislem i
WHERE 1=1
  AND i.islemArac = 'Nakit Kasa(TL)'  -- veya 'Banka EFT', 'Kredi Kartları', 'Acenta Tahsilat'
  AND (i.islemBilgi IS NULL OR i.islemBilgi NOT LIKE '%=DEPOZİTO ALACAĞI=%')
  AND CONVERT(DATE, i.iKytTarihi, 104) <= CONVERT(DATE, @secilenTarih, 104)  -- ✅ Tarih filtresi VAR
```

**Hesaplama:** `toplamGelir - toplamGider = Bakiye`

**Mantık:** ✅ İlk günden seçilen güne kadar Giren - Çıkan = Bakiye (DOĞRU)

**Sorun:** ❌ `islemTip IN ('GELİR', 'Giren')` ve `islemTip IN ('GİDER', 'Çıkan')` kullanılıyor
- Beklenen: Sadece `islemTip = 'Giren'` ve `islemTip = 'Çıkan'`
- Mevcut: Hem `'GELİR'/'GİDER'` hem de `'Giren'/'Çıkan'` dahil ediliyor

---

## 🔍 Sorun Analizi

### Mevcut Durum:

**Backend sorguları şu mantıkla çalışıyor:**
```sql
-- Mevcut sorgu
SUM(CASE WHEN i.islemTip IN ('GELİR', 'Giren') THEN i.islemTutar ELSE 0 END) as toplamGelir
SUM(CASE WHEN i.islemTip IN ('GİDER', 'Çıkan') THEN i.islemTutar ELSE 0 END) as toplamGider
```

**Bu sorgu şu işlem tiplerini dahil ediyor:**
- ✅ `islemTip = 'Giren'` → Gelir olarak sayılıyor
- ✅ `islemTip = 'GELİR'` → Gelir olarak sayılıyor
- ✅ `islemTip = 'Çıkan'` → Gider olarak sayılıyor
- ✅ `islemTip = 'GİDER'` → Gider olarak sayılıyor

### Beklenen Durum:

**Kullanıcının istediği basit sorgu:**
```sql
-- Beklenen sorgu
SELECT 
  SUM(IIF(islemTip = 'Giren', islemTutar, 0)) - 
  SUM(IIF(islemTip = 'Çıkan', islemTutar, 0)) as Bakiye
FROM tblislem
WHERE islemArac = 'Nakit Kasa(TL)'
```

**Bu sorgu sadece şu işlem tiplerini dahil eder:**
- ✅ `islemTip = 'Giren'` → Gelir olarak sayılıyor
- ✅ `islemTip = 'Çıkan'` → Gider olarak sayılıyor
- ❌ `islemTip = 'GELİR'` → Dahil edilmiyor
- ❌ `islemTip = 'GİDER'` → Dahil edilmiyor

---

## 📊 Karşılaştırma Tablosu

| Sayfa | Endpoint | Tarih Filtresi | İşlem Tipi Mantığı | Beklenen Mantık |
|-------|----------|---------------|-------------------|-----------------|
| **kazanc-tablo** | `/islem/guncel-bakiye` | ❌ YOK | `IN ('GELİR', 'Giren')` | `= 'Giren'` |
| **kasa-islem** (tarih yok) | `/islem/guncel-bakiye` | ❌ YOK | `IN ('GELİR', 'Giren')` | `= 'Giren'` |
| **kasa-islem** (tarih var) | `/islem/secilen-gun-bakiyesi` | ✅ VAR | `IN ('GELİR', 'Giren')` | `= 'Giren'` |
| **nakit-tablo** | `/islem/secilen-gun-bakiyesi` | ✅ VAR | `IN ('GELİR', 'Giren')` | `= 'Giren'` |

---

## 🎯 Önerilen Değişiklikler

### 1. Backend Sorgularını Basitleştir

**Mevcut:**
```typescript
const gelirTypes = ['GELİR', 'Giren'];
const giderTypes = ['GİDER', 'Çıkan'];
```

**Önerilen:**
```typescript
// Kasa bakiyeleri için sadece Giren/Çıkan kullan
const gelirTypes = ['Giren'];
const giderTypes = ['Çıkan'];
```

### 2. Cari İşlemler İçin Ayrı Mantık

**Not:** Cari işlemler için `'GELİR'/'GİDER'` kullanılabilir, ancak kasa bakiyeleri için sadece `'Giren'/'Çıkan'` kullanılmalı.

---

## 📝 Detaylı Sorgu Örnekleri

### Kazanc-Tablo (Nakit Kasa):

**Mevcut Sorgu:**
```sql
SELECT 
  SUM(CASE WHEN i.islemTip IN ('GELİR', 'Giren') THEN i.islemTutar ELSE 0 END) as toplamGelir,
  SUM(CASE WHEN i.islemTip IN ('GİDER', 'Çıkan') THEN i.islemTutar ELSE 0 END) as toplamGider
FROM tblislem i
WHERE 1=1
  AND i.islemArac = 'Nakit Kasa(TL)'
  AND (i.islemBilgi IS NULL OR i.islemBilgi NOT LIKE '%=DEPOZİTO ALACAĞI=%')
```

**Beklenen Sorgu:**
```sql
SELECT 
  SUM(CASE WHEN i.islemTip = 'Giren' THEN i.islemTutar ELSE 0 END) as toplamGelir,
  SUM(CASE WHEN i.islemTip = 'Çıkan' THEN i.islemTutar ELSE 0 END) as toplamGider
FROM tblislem i
WHERE i.islemArac = 'Nakit Kasa(TL)'
  AND (i.islemBilgi IS NULL OR i.islemBilgi NOT LIKE '%=DEPOZİTO ALACAĞI=%')
```

### Nakit-Tablo (Nakit Kasa - Seçilen Tarih):

**Mevcut Sorgu:**
```sql
SELECT 
  SUM(CASE WHEN i.islemTip IN ('GELİR', 'Giren') THEN i.islemTutar ELSE 0 END) as toplamGelir,
  SUM(CASE WHEN i.islemTip IN ('GİDER', 'Çıkan') THEN i.islemTutar ELSE 0 END) as toplamGider
FROM tblislem i
WHERE 1=1
  AND i.islemArac = 'Nakit Kasa(TL)'
  AND (i.islemBilgi IS NULL OR i.islemBilgi NOT LIKE '%=DEPOZİTO ALACAĞI=%')
  AND CONVERT(DATE, i.iKytTarihi, 104) <= CONVERT(DATE, '17.12.2025', 104)
```

**Beklenen Sorgu:**
```sql
SELECT 
  SUM(CASE WHEN i.islemTip = 'Giren' THEN i.islemTutar ELSE 0 END) as toplamGelir,
  SUM(CASE WHEN i.islemTip = 'Çıkan' THEN i.islemTutar ELSE 0 END) as toplamGider
FROM tblislem i
WHERE i.islemArac = 'Nakit Kasa(TL)'
  AND (i.islemBilgi IS NULL OR i.islemBilgi NOT LIKE '%=DEPOZİTO ALACAĞI=%')
  AND CONVERT(DATE, i.iKytTarihi, 104) <= CONVERT(DATE, '17.12.2025', 104)
```

---

## 🔧 Çözüm Önerisi

### Backend Değişikliği:

`backend/src/islem/islem.service.ts` dosyasında:

1. **`getGuncelBakiye()` fonksiyonu:**
   - `islemArac === 'cari'` ise: `['GELİR', 'GİDER']` kullan (Cari işlemler için)
   - Diğer kasa tipleri için: `['Giren', 'Çıkan']` kullan

2. **`getSecilenGunBakiyesi()` fonksiyonu:**
   - `islemArac === 'cari'` ise: `['GELİR', 'GİDER']` kullan
   - Diğer kasa tipleri için: `['Giren', 'Çıkan']` kullan

---

## 📋 Sonuç

### Mevcut Durum:
- ✅ Tarih filtreleri doğru çalışıyor
- ❌ İşlem tipi mantığı karmaşık (`IN ('GELİR', 'Giren')`)
- ❌ Beklenen basit sorgu kullanılmıyor

### Beklenen Durum:
- ✅ Tarih filtreleri aynı kalacak
- ✅ İşlem tipi mantığı basitleştirilecek (`= 'Giren'` ve `= 'Çıkan'`)
- ✅ Basit sorgu kullanılacak

---

## 🎯 Öncelik

1. **Yüksek Öncelik:** Backend sorgularını basitleştir
2. **Orta Öncelik:** Cari işlemler için ayrı mantık ekle
3. **Düşük Öncelik:** Test ve doğrulama

