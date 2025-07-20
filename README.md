# GÖKÇE PANSİYON YÖNETİM SİSTEMİ

## 📅 Tarih Formatı Kuralları

Bu projede tüm tarih değerleri aşağıdaki kurallara göre yönetilir:

### Veritabanı Tarih Alanları
- **Veri Tipi**: `nchar(10)`
- **Format**: `DD.MM.YYYY`
- **Örnek**: `19.07.2025`

### Frontend Tarih Gösterimi
- **Format**: `DD.MM.YYYY`
- **Örnek**: `19.07.2025`

### Backend Tarih İşlemleri
- **Giriş Formatı**: `DD.MM.YYYY` (string)
- **Çıkış Formatı**: `DD.MM.YYYY` (string)
- **Hesaplama**: Date objesi kullanılır, sonuç `DD.MM.YYYY` formatında döndürülür

### Yasaklı Kullanımlar
- ❌ `toLocaleDateString()` kullanımı
- ❌ ISO format (`YYYY-MM-DD`) kullanımı
- ❌ Direkt Date objesi veritabanına kayıt

### Doğru Kullanım
- ✅ `formatDate()` fonksiyonu ile tarih formatlama
- ✅ `parseDate()` fonksiyonu ile string'den Date'e çevirme
- ✅ `DD.MM.YYYY` formatında string kullanımı

Detaylı kurallar için [DATE_FORMAT_RULES.md](DATE_FORMAT_RULES.md) dosyasını inceleyin.

## 🚀 Kurulum

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📋 Özellikler

- Müşteri kayıt ve yönetimi
- Konaklama işlemleri
- Oda-yatak yönetimi
- Cari hesap takibi
- Raporlama (PDF/Excel)
- Transaction güvenliği

## 🔧 Teknik Detaylar

- **Backend**: NestJS, TypeScript, SQL Server
- **Frontend**: Vue.js 3, Quasar Framework
- **Veritabanı**: Microsoft SQL Server
- **Raporlama**: PDF (PDFKit), Excel (XLSX)

## 📁 Proje Yapısı

```
gokceweb/
├── backend/          # NestJS API
├── frontend/         # Vue.js UI
├── DATE_FORMAT_RULES.md  # Tarih formatı kuralları
└── README.md         # Bu dosya
```

## 🎯 Özel Durumlar

### 30 Günlük Konaklama
- **Kural**: Gün değeri korunur, sadece ay +1 olur
- **Örnek**: 19.07.2025 → 19.08.2025

### Geç Saat Konaklama
- **Kural**: Çıkış tarihi = Giriş tarihi
- **Örnek**: 19.07.2025 → 19.07.2025
