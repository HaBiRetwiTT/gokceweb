# 🔍 Backend Endpoint Kontrolü

## Sorun: `/auth/login` 404 Hatası

### Kontrol Adımları:

#### 1. PM2 Loglarını Kontrol Edin

VPS'te PowerShell'de:

```powershell
pm2 logs gokce-backend --lines 200
```

**Kontrol edilecekler:**
- "Backend running on port 3000" mesajı görünmeli
- "Nest application successfully started" mesajı görünmeli
- Database bağlantı mesajları görünmeli
- Hata mesajı olmamalı

#### 2. Backend'in Gerçekten Başladığını Test Edin

**Root endpoint (GET):**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/" -Method GET
```

**Auth endpoint (POST - Doğru metod):**
```powershell
$body = @{
    username = "test"
    password = "test"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/auth/login" -Method POST -Body $body -ContentType "application/json"
```

#### 3. Backend Route'larını Kontrol Edin

Backend'in tüm route'larını listelemek için PM2 loglarında şunları arayın:
- "Mapped {/auth/login, POST} route"
- Veya benzer route mapping mesajları

#### 4. Backend'i Yeniden Build Edin

Eğer route'lar yüklenmiyorsa:

```powershell
cd C:\gokce-backend
npm run build
pm2 restart gokce-backend
pm2 logs gokce-backend --lines 100
```

#### 5. dist Klasörünü Kontrol Edin

```powershell
cd C:\gokce-backend\dist
Get-ChildItem -Recurse -Filter "*.js" | Select-Object FullName
```

**Beklenen dosyalar:**
- `dist/main.js` (ana dosya)
- `dist/auth/auth.controller.js` (auth controller)
- `dist/app.module.js` (app module)

---

## ✅ main.d.ts Dosyası Hakkında

**Sorun değil!** `main.d.ts` dosyası TypeScript'in otomatik oluşturduğu bir declaration dosyasıdır.

**Neden var?**
- `tsconfig.json` dosyasında `"declaration": true` ayarı var
- Bu ayar, TypeScript'in `.d.ts` dosyaları oluşturmasına neden olur

**İçeriği neden `export {};`?**
- `main.ts` dosyası bir modül export etmiyor
- Sadece `bootstrap()` fonksiyonunu çalıştırıyor
- Bu yüzden boş bir export yeterli

**Yapılacak bir şey yok!** Bu dosya sorun değil, normal bir build çıktısı.

---

## 🐛 Olası Sorunlar ve Çözümleri

### Sorun 1: Route'lar yüklenmiyor

**Çözüm:**
```powershell
cd C:\gokce-backend
npm run build
pm2 restart gokce-backend
```

### Sorun 2: Module bulunamıyor

**Çözüm:**
```powershell
cd C:\gokce-backend
npm install
npm run build
pm2 restart gokce-backend
```

### Sorun 3: Database bağlantı hatası

**Çözüm:**
- `.env.production` dosyasını kontrol edin
- Database bağlantı bilgilerini doğrulayın
- SQL Server'ın çalıştığını kontrol edin

---

## 📋 Test Komutları

### PowerShell'de Test:

```powershell
# Root endpoint
Invoke-WebRequest -Uri "http://localhost:3000/" -Method GET

# Auth endpoint (POST)
$body = @{
    username = "test"
    password = "test"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/auth/login" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
}
```

### Tarayıcıda Test:

1. `http://77.245.151.173:3000/` → "Hello World!" görünmeli
2. `http://77.245.151.173:3000/auth/login` → 404 hatası normal (GET isteği)
3. POST isteği için Postman veya PowerShell kullanın

---

## 🔍 PM2 Log Analizi

PM2 loglarında şunları arayın:

**Başarılı başlangıç:**
```
[Nest] 12345  - 12/17/2025, 3:00:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 12/17/2025, 3:00:00 PM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 12/17/2025, 3:00:00 PM     LOG [RoutesResolver] AuthController {/auth}: 
[Nest] 12345  - 12/17/2025, 3:00:00 PM     LOG [RoutesResolver] Mapped {/auth/login, POST} route
[Nest] 12345  - 12/17/2025, 3:00:00 PM     LOG [NestApplication] Nest application successfully started
Backend running on port 3000
```

**Hata durumu:**
```
Error: Cannot find module '...'
Error: Database connection failed
```

---

## 📞 Sonraki Adımlar

1. PM2 loglarını kontrol edin
2. Backend'i yeniden build edin (gerekirse)
3. POST isteği ile test edin
4. Sonuçları paylaşın

