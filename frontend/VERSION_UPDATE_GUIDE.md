# 🔄 Sürüm Güncelleme Sistemi Kullanım Kılavuzu

Bu doküman, GÖKÇE Pansiyon Yönetim Sistemi'nin otomatik sürüm güncelleme sisteminin nasıl çalıştığını ve nasıl kullanılacağını açıklar.

## 📋 Özellikler

### ✅ Otomatik Sürüm Kontrolü
- Uygulama her 5 dakikada bir sunucudan yeni sürüm kontrolü yapar
- Sadece production ortamında çalışır
- Kullanıcıyı rahatsız etmez, arka planda sessizce çalışır

### 🔔 Akıllı Bildirimler
- Yeni sürüm bulunduğunda kullanıcıya bildirim gösterir
- Bildirim otomatik kapanmaz, kullanıcı karar verir
- "Yenile" ve "Daha Sonra" seçenekleri sunar

### 🎯 Manuel Kontrol
- Dashboard'da manuel sürüm kontrolü butonu
- Anlık güncelleme durumu kontrolü
- Kullanıcı dostu arayüz

## 🚀 Nasıl Çalışır?

### 1. Build Sırasında
```bash
npm run build
```
Bu komut çalıştırıldığında:
- `prebuild` script'i otomatik olarak çalışır
- `scripts/update-version.js` dosyası çalıştırılır
- `public/version.json` dosyası güncel sürüm bilgileriyle güncellenir

### 2. Sürüm Dosyası Yapısı
```json
{
  "version": "0.0.1",
  "buildTime": "2024-01-01T00:00:00.000Z",
  "hash": "1704067200000-abc123",
  "environment": "production"
}
```

### 3. Kontrol Mekanizması
- Uygulama başladığında `version-checker.service.ts` devreye girer
- Her 5 dakikada bir `/version.json` dosyasını kontrol eder
- Sürüm karşılaştırması yapar
- Yeni sürüm varsa bildirim gösterir

## 📝 Kullanım Senaryoları

### Yeni Sürüm Yayınlama
1. `package.json` dosyasındaki sürümü güncelleyin
2. Değişiklikleri commit edin ve push edin
3. CI/CD pipeline'ı build işlemini başlatır
4. Build sırasında `version.json` otomatik güncellenir
5. Kullanıcılar yeni sürümü otomatik olarak alır

### Manuel Sürüm Kontrolü
1. Dashboard sayfasına gidin
2. "Güncellemeleri Kontrol Et" butonuna tıklayın
3. Sistem anlık kontrol yapar
4. Sonuç bildirim olarak gösterilir

## 🔧 Teknik Detaylar

### Dosya Yapısı
```
frontend/
├── src/
│   ├── services/
│   │   └── version-checker.service.ts    # Ana servis
│   ├── App.vue                           # Uygulama başlangıcı
│   └── pages/
│       └── DashboardPage.vue             # Manuel kontrol
├── public/
│   └── version.json                      # Sürüm bilgileri
├── scripts/
│   └── update-version.js                 # Build script'i
└── package.json                          # Sürüm tanımı
```

### Environment Değişkenleri
- `VITE_APP_VERSION`: Uygulama sürümü (package.json'dan alınır)

### API Endpoint
- `GET /version.json`: Sürüm bilgilerini döndürür
- Cache kontrolü: `no-cache` header'ları ile

## 🎨 Özelleştirme

### Kontrol Aralığını Değiştirme
```typescript
// version-checker.service.ts
private checkInterval: number = 5 * 60 * 1000 // 5 dakika
```

### Bildirim Stillerini Değiştirme
```scss
// app.scss
.version-update-notification {
  // Özel stiller buraya
}
```

### Sürüm Karşılaştırma Mantığını Değiştirme
```typescript
// version-checker.service.ts
private compareVersions(version1: string, version2: string): number {
  // Özel karşılaştırma mantığı
}
```

## 🐛 Sorun Giderme

### Sürüm Kontrolü Çalışmıyor
1. Console'da hata mesajlarını kontrol edin
2. Network sekmesinde `/version.json` isteğini kontrol edin
3. Production ortamında olduğunuzdan emin olun

### Bildirim Görünmüyor
1. Quasar Notify plugin'inin yüklü olduğunu kontrol edin
2. CSS stillerinin doğru yüklendiğini kontrol edin
3. Browser console'da JavaScript hatalarını kontrol edin

### Build Hatası
1. `scripts/update-version.js` dosyasının çalıştırılabilir olduğunu kontrol edin
2. `public/version.json` dosyasının yazılabilir olduğunu kontrol edin
3. Node.js sürümünün uyumlu olduğunu kontrol edin

## 📚 Püf Noktaları

### 💡 Performans Optimizasyonu
- Sürüm kontrolü sadece production'da çalışır
- Network istekleri cache'lenmez
- Kontrol aralığı 5 dakika olarak ayarlanmıştır

### 🔒 Güvenlik
- Sürüm dosyası public klasöründe bulunur
- Hassas bilgi içermez
- Sadece sürüm bilgilerini paylaşır

### 🌐 Browser Uyumluluğu
- Modern browser'lar desteklenir
- Service Worker desteği opsiyonel
- Fallback mekanizması mevcuttur

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Console loglarını kontrol edin
2. Network isteklerini inceleyin
3. Browser developer tools'u kullanın
4. Gerekirse manuel kontrol yapın

---

**Not:** Bu sistem, kullanıcı deneyimini iyileştirmek ve güncellemeleri otomatik olarak yönetmek için tasarlanmıştır. Herhangi bir sorun yaşarsanız, sistem güvenli bir şekilde devre dışı kalır ve uygulama normal şekilde çalışmaya devam eder. 