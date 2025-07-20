# Tarih Formatı Kuralları

## 📅 Genel Kurallar

### 1. Veritabanı Tarih Alanları
- **Veri Tipi**: `nchar(10)`
- **Format**: `DD.MM.YYYY`
- **Örnek**: `19.07.2025`

### 2. Frontend Tarih Gösterimi
- **Format**: `DD.MM.YYYY`
- **Örnek**: `19.07.2025`

### 3. Backend Tarih İşlemleri
- **Giriş Formatı**: `DD.MM.YYYY` (string)
- **Çıkış Formatı**: `DD.MM.YYYY` (string)
- **Hesaplama**: Date objesi kullanılır, sonuç `DD.MM.YYYY` formatında döndürülür

## 🔧 Teknik Uygulama

### Backend Helper Fonksiyonları

#### `formatDate(date: Date): string`
```typescript
private formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}
```

#### `parseDate(dateString: string): Date`
```typescript
private parseDate(dateString: string): Date {
  const parts = dateString.split('.');
  if (parts.length !== 3) {
    throw new Error(`Geçersiz tarih formatı: ${dateString}`);
  }
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
  const year = parseInt(parts[2], 10);
  
  return new Date(year, month, day);
}
```

#### `getCurrentTransactionDate(): string`
```typescript
private getCurrentTransactionDate(): string {
  return this.formatDate(new Date());
}
```

### Frontend Tarih Hesaplama

#### Planlanan Çıkış Tarihi Hesaplama
```typescript
const planlananCikisTarihi = computed(() => {
  if (!form.value.KonaklamaSuresi || form.value.KonaklamaSuresi < 1) {
    return ''
  }
  
  const bugun = new Date()
  let cikisTarihi: Date
  
  // 30 günlük konaklama için özel hesaplama
  if (form.value.KonaklamaSuresi === 30) {
    const gun = bugun.getDate()
    const ay = bugun.getMonth() + 1
    const yil = bugun.getFullYear()
    
    let yeniAy = ay + 1
    let yeniYil = yil
    
    if (yeniAy > 12) {
      yeniAy = 1
      yeniYil = yil + 1
    }
    
    cikisTarihi = new Date(yeniYil, yeniAy - 1, gun)
  } else {
    cikisTarihi = new Date(bugun)
    cikisTarihi.setDate(bugun.getDate() + form.value.KonaklamaSuresi)
  }
  
  const day = cikisTarihi.getDate().toString().padStart(2, '0')
  const month = (cikisTarihi.getMonth() + 1).toString().padStart(2, '0')
  const year = cikisTarihi.getFullYear()
  
  return `${day}.${month}.${year}`
})
```

## 🚫 Yasaklı Kullanımlar

### 1. `toLocaleDateString()` Kullanımı
- **Neden**: Farklı locale'lerde farklı formatlar üretebilir
- **Yerine**: `formatDate()` fonksiyonu kullanılmalı

### 2. ISO Format Kullanımı
- **Neden**: `YYYY-MM-DD` formatı Türkçe tarih gösterimi için uygun değil
- **Yerine**: `DD.MM.YYYY` formatı kullanılmalı

### 3. Direkt Date Objesi Kullanımı
- **Neden**: Veritabanına kayıt edilemez
- **Yerine**: `formatDate()` ile string'e çevrilmeli

## ✅ Doğru Kullanım Örnekleri

### Backend'de Tarih İşleme
```typescript
// ✅ Doğru
const bugunTarihi = this.formatDate(new Date()); // "19.07.2025"
const planlananCikis = konaklamaData.planlananCikisTarihi; // Frontend'den gelen "19.08.2025"

// ❌ Yanlış
const bugunTarihi = new Date().toLocaleDateString('tr-TR');
const planlananCikis = new Date().toISOString().split('T')[0];
```

### Frontend'de Tarih Gösterimi
```typescript
// ✅ Doğru
const tarih = "19.07.2025"; // Direkt DD.MM.YYYY formatında

// ❌ Yanlış
const tarih = new Date().toLocaleDateString('tr-TR');
```

## 🔄 Tarih Dönüşümleri

### String → Date → String
```typescript
// DD.MM.YYYY string'ini Date'e çevir
const dateObj = this.parseDate("19.07.2025");

// Hesaplama yap
dateObj.setDate(dateObj.getDate() + 30);

// Tekrar DD.MM.YYYY string'ine çevir
const sonuc = this.formatDate(dateObj); // "18.08.2025"
```

### Veritabanından Gelen Tarih
```typescript
// Veritabanından gelen tarih zaten DD.MM.YYYY formatında
const dbTarih = "19.07.2025";

// Hesaplama için Date'e çevir
const dateObj = this.parseDate(dbTarih);

// İşlem yap ve tekrar string'e çevir
const yeniTarih = this.formatDate(dateObj);
```

## 📋 Kontrol Listesi

- [ ] Tüm tarih alanları `nchar(10)` veri tipinde
- [ ] Tüm tarih değerleri `DD.MM.YYYY` formatında
- [ ] `toLocaleDateString()` kullanımı kaldırıldı
- [ ] ISO format kullanımı kaldırıldı
- [ ] Tarih hesaplamaları `parseDate()` ve `formatDate()` ile yapılıyor
- [ ] Frontend'den gelen tarihler doğru format kontrolü yapılıyor
- [ ] Veritabanına kayıt edilen tarihler doğru formatta

## 🎯 Özel Durumlar

### 30 Günlük Konaklama
- **Kural**: Gün değeri korunur, sadece ay +1 olur
- **Örnek**: 19.07.2025 → 19.08.2025
- **Uygulama**: Frontend'de özel hesaplama, backend'de frontend'den gelen değer kullanılır

### Geç Saat Konaklama
- **Kural**: Çıkış tarihi = Giriş tarihi
- **Örnek**: 19.07.2025 → 19.07.2025
- **Uygulama**: Backend'de özel kontrol

### Rapor Tarihleri
- **Kural**: Rapor oluşturma tarihi `DD.MM.YYYY` formatında
- **Uygulama**: `formatDate(new Date())` kullanılır 