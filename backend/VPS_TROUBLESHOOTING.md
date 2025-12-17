# 🔧 VPS Backend Sorun Giderme Kılavuzu

## Sorun 1: `/auth/login` 404 Hatası

### Neden:
- `/auth/login` endpoint'i **POST** metodu için tanımlı
- Tarayıcıda GET isteği yapıldığında 404 hatası alınıyor

### Çözüm:
Backend'in çalıştığını test etmek için POST isteği yapın.

---

## Sorun 2: Backend Klasör Yapısı

### Mevcut Durum:
- Backend dosyaları: `C:\gokce-backend\` klasöründe
- PM2'nin çalışma dizini yanlış olabilir

### Çözüm:
PM2'nin çalışma dizinini kontrol edin ve düzeltin.

---

## Sorun 3: PowerShell curl Komutu

### Neden:
PowerShell'de `curl` komutu `Invoke-WebRequest`'e alias edilmiş ve farklı syntax kullanıyor.

### Çözüm:
PowerShell için doğru komutları kullanın.

---

## ✅ Adım Adım Çözüm

### 1. PM2 Durumunu Kontrol Edin

VPS'te PowerShell'de:

```powershell
pm2 status
pm2 info gokce-backend
```

**Önemli:** `cwd` (çalışma dizini) ve `script` değerlerini kontrol edin.

### 2. PM2 Process'i Durdurun

```powershell
pm2 stop gokce-backend
pm2 delete gokce-backend
```

### 3. PM2 Process'ini Doğru Dizinde Başlatın

```powershell
cd C:\gokce-backend
pm2 start npm --name "gokce-backend" -- run start:prod
```

**VEYA** eğer `dist` klasörü varsa:

```powershell
cd C:\gokce-backend
pm2 start dist/main.js --name "gokce-backend"
```

### 4. Backend'i Build Edin (Eğer Gerekirse)

```powershell
cd C:\gokce-backend
npm run build
```

### 5. PM2 Loglarını Kontrol Edin

```powershell
pm2 logs gokce-backend --lines 100
```

**Kontrol edilecekler:**
- "Backend running on port 3000" mesajı görünmeli
- Hata mesajı olmamalı
- Database bağlantısı başarılı olmalı

### 6. Backend'i Test Edin

#### PowerShell'de POST İsteği:

```powershell
# PowerShell için Invoke-WebRequest kullanın
$body = @{
    username = "test"
    password = "test"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/auth/login" -Method POST -Body $body -ContentType "application/json"
```

#### Veya curl.exe kullanın (Git ile birlikte gelir):

```powershell
curl.exe -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"username\":\"test\",\"password\":\"test\"}"
```

---

## 🔍 Backend Klasör Yapısını Kontrol Edin

VPS'te PowerShell'de:

```powershell
cd C:\gokce-backend
Get-ChildItem -Recurse -Filter "main.js" | Select-Object FullName
Get-ChildItem -Recurse -Filter "package.json" | Select-Object FullName
```

**Beklenen yapı:**
```
C:\gokce-backend\
├── package.json
├── dist\
│   └── main.js
├── src\
│   └── main.ts
└── node_modules\
```

**Eğer yapı farklıysa:**
- `dist` klasörü yoksa: `npm run build` çalıştırın
- `node_modules` yoksa: `npm install` çalıştırın

---

## 🐛 Yaygın Hatalar ve Çözümleri

### Hata: "Cannot find module"
```powershell
cd C:\gokce-backend
npm install
npm run build
pm2 restart gokce-backend
```

### Hata: "Port 3000 already in use"
```powershell
netstat -ano | findstr :3000
# Çıktıdaki PID'yi kullanın:
taskkill /PID <PID> /F
pm2 restart gokce-backend
```

### Hata: "Database connection failed"
- `.env.production` dosyasını kontrol edin
- Database bağlantı bilgilerini doğrulayın
- SQL Server'ın çalıştığını kontrol edin

---

## 📋 PM2 Startup Ayarları

PM2'nin Windows başlangıcında otomatik başlaması için:

```powershell
pm2 save
pm2 startup
```

**Not:** `pm2 startup` komutu size bir komut verecek, onu yönetici olarak çalıştırın.

---

## ✅ Başarı Kontrolü

Backend başarıyla çalışıyorsa:

1. **PM2 Status:**
```powershell
pm2 status
# gokce-backend "online" görünmeli
```

2. **Port Kontrolü:**
```powershell
netstat -ano | findstr :3000
# Port 3000 dinleniyor olmalı
```

3. **Root Endpoint:**
Tarayıcıda: `http://77.245.151.173:3000/`
- "Hello World!" görünmeli

4. **Auth Endpoint (POST):**
PowerShell'de:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/auth/login" -Method POST -Body '{"username":"test","password":"test"}' -ContentType "application/json"
```
- 401 (Unauthorized) veya 200 (Success) dönmeli
- 404 dönmemeli!

---

## 📞 Yardım

Sorun devam ederse:
1. PM2 loglarını kontrol edin: `pm2 logs gokce-backend --lines 200`
2. Backend klasör yapısını kontrol edin
3. Environment variables'ı kontrol edin: `.env.production`
4. Database bağlantısını test edin

