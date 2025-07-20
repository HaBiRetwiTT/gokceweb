# İşlem Tipi ve Ödeme Vadesi Kuralları

## 📋 Genel Kural

**`tblislem` tablosundaki `islemTip` alanı "GELİR" veya "GİDER" olan tüm işlemlerde, `islemBilgi` alanına otomatik olarak ödeme vadesi bilgisi eklenmelidir.**

## 🔧 Teknik Uygulama

### Helper Fonksiyon
```typescript
private addOdemeVadesiToIslemBilgi(islemBilgi: string, odemeVadesi?: string): string {
  if (!odemeVadesi || odemeVadesi.trim() === '') {
    return islemBilgi;
  }
  
  // Eğer islemBilgi zaten ödeme vadesi içeriyorsa, değiştirme
  if (islemBilgi.includes('BAKİYE ÖDEME VADESİ:')) {
    return islemBilgi;
  }
  
  // Ödeme vadesi bilgisini başa ekle
  return `BAKİYE ÖDEME VADESİ: ${odemeVadesi} -/- ${islemBilgi}`;
}
```

### Format
- **Ödeme Vadesi**: `DD.MM.YYYY` formatında
- **İşlem Bilgisi**: `BAKİYE ÖDEME VADESİ: 19.07.2025 -/- [Orijinal İşlem Bilgisi]`

## ✅ Uygulanan Fonksiyonlar

### 1. Oda Değişikliği İşlemleri
- `kaydetOdaDegisikligiIslemWithTransaction()` - ✅ Güncellendi
- `kaydetOdaDegisikligiIslem()` - ✅ Güncellendi

### 2. Dönem Yenileme İşlemleri
- `kaydetDonemYenilemeIslemWithTransaction()` - ✅ Güncellendi

### 3. Erken Çıkış İşlemleri
- `erkenCikisYap()` - ✅ Güncellendi

### 4. Ana İşlem Kayıtları
- `kaydetIslemWithTransaction()` - ✅ Zaten mevcut
- `kaydetIslem()` - ✅ Zaten mevcut

## 🔄 Controller Güncellemeleri

### Oda Değişikliği Controller
```typescript
// Ödeme vadesi parametresi eklendi
OdemeVadesi: odaDegisikligiData.OdemeVadesi || musteriData.OdemeVadesi || null
```

## 📝 Örnek Kullanım

### Giriş İşlemi
```typescript
// Önceki
islemBilgi: "19.07.2025 - 19.08.2025 DÖNEMİ KONAKLAMA"

// Sonraki
islemBilgi: "BAKİYE ÖDEME VADESİ: 19.07.2025 -/- 19.07.2025 - 19.08.2025 DÖNEMİ KONAKLAMA"
```

### Oda Değişikliği İşlemi
```typescript
// Önceki
islemBilgi: "Oda Değişikliği - Yeni Oda: 101-1"

// Sonraki
islemBilgi: "BAKİYE ÖDEME VADESİ: 19.07.2025 -/- Oda Değişikliği - Yeni Oda: 101-1"
```

### Erken Çıkış İşlemi
```typescript
// Önceki
islemBilgi: "ERKEN ÇIKIŞ FARKI"

// Sonraki
islemBilgi: "BAKİYE ÖDEME VADESİ: 19.07.2025 -/- ERKEN ÇIKIŞ FARKI"
```

## 🎯 Püf Noktaları

1. **Ödeme Vadesi Önceliği**: 
   - Frontend'den gelen ödeme vadesi
   - Müşteri bilgilerinden alınan ödeme vadesi
   - Boş ise ödeme vadesi eklenmez

2. **Mevcut Vade Kontrolü**: 
   - İşlem bilgisinde zaten "BAKİYE ÖDEME VADESİ:" varsa tekrar eklenmez

3. **Tarih Formatı**: 
   - Tüm tarihler `DD.MM.YYYY` formatında olmalı

4. **Transaction Güvenliği**: 
   - Tüm işlemler transaction-safe fonksiyonlarda yapılır

## 🔍 Kontrol Edilecek Alanlar

- [x] `kaydetOdaDegisikligiIslemWithTransaction`
- [x] `kaydetOdaDegisikligiIslem`
- [x] `kaydetDonemYenilemeIslemWithTransaction`
- [x] `erkenCikisYap`
- [x] `kaydetIslemWithTransaction` (zaten mevcut)
- [x] `kaydetIslem` (zaten mevcut)

## 📊 Test Senaryoları

1. **Yeni Konaklama**: Ödeme vadesi ile işlem kaydı
2. **Oda Değişikliği**: GİDER ve GELİR işlemlerinde ödeme vadesi
3. **Dönem Yenileme**: Yeni dönem işleminde ödeme vadesi
4. **Erken Çıkış**: GİDER işleminde ödeme vadesi
5. **Ödeme Vadesi Yok**: İşlem bilgisi değişmez

## 🚀 Sonraki Adımlar

1. Frontend'den ödeme vadesi bilgisinin doğru gönderildiğini kontrol et
2. Test senaryolarını çalıştır
3. Veritabanında işlem kayıtlarını kontrol et
4. Raporlarda ödeme vadesi bilgisinin görüntülendiğini doğrula 