# 🚀 Backend VPS Deployment Guide

## 📋 VPS'e Backend Güncelleme Yöntemleri

### ✅ Yöntem 1: Git ile Güncelleme (Önerilen)

#### Yerel Bilgisayarda (Windows 11):

1. **Değişiklikleri commit edin:**
```powershell
cd C:\Users\habir\GOKCE\gokceweb
git add .
git commit -m "Backend güncellemesi: CORS ayarları düzeltildi"
git push origin master
```

#### VPS'te (Windows VPS - RDP ile bağlanın):

1. **Git repository'yi güncelleyin:**
```powershell
cd C:\gokce-backend
git pull origin master
```

2. **Yeni paketleri yükleyin (eğer package.json değiştiyse):**
```powershell
cd C:\gokce-backend\backend
npm install
```

3. **Backend'i yeniden build edin:**
```powershell
npm run build
```

4. **PM2 ile backend'i restart edin:**
```powershell
pm2 restart gokce-backend
```

5. **Logları kontrol edin:**
```powershell
pm2 logs gokce-backend --lines 50
```

---

### ✅ Yöntem 2: Manuel Dosya Kopyalama (Alternatif)

#### Yerel Bilgisayarda (Windows 11):

1. **Backend'i build edin:**
```powershell
cd C:\Users\habir\GOKCE\gokceweb\backend
npm run build
```

2. **Değişen dosyaları belirleyin:**
   - `src/` klasöründeki değişen `.ts` dosyaları
   - `package.json` (eğer değiştiyse)
   - `.env.production` (eğer değiştiyse)

#### VPS'te (Windows VPS - RDP ile bağlanın):

1. **Backend'i durdurun:**
```powershell
pm2 stop gokce-backend
```

2. **Dosyaları kopyalayın:**
   - Yerel bilgisayardan VPS'e RDP ile bağlanın
   - Windows Explorer'da yerel bilgisayarınızın `C:\Users\habir\GOKCE\gokceweb\backend\src\` klasörünü açın
   - VPS'te `C:\gokce-backend\backend\src\` klasörünü açın
   - Değişen dosyaları kopyalayın (üzerine yazın)

3. **Yeni paketleri yükleyin (eğer package.json değiştiyse):**
```powershell
cd C:\gokce-backend\backend
npm install
```

4. **Backend'i yeniden build edin:**
```powershell
npm run build
```

5. **Backend'i başlatın:**
```powershell
pm2 start gokce-backend
```

6. **Logları kontrol edin:**
```powershell
pm2 logs gokce-backend --lines 50
```

---

## 🔄 Otomatik Deployment Script'i

### VPS'te Deployment Script'i Oluşturma:

VPS'te PowerShell'de:

```powershell
# Script dosyasını oluşturun
New-Item -Path "C:\gokce-backend\deploy.ps1" -ItemType File -Force

# Script içeriğini düzenleyin (Notepad ile)
notepad C:\gokce-backend\deploy.ps1
```

**Script içeriği (`deploy.ps1`):**
```powershell
# Backend Deployment Script
Write-Host "🚀 Backend güncelleme başlatılıyor..." -ForegroundColor Green

# Git repository'yi güncelle
Write-Host "📥 Git repository güncelleniyor..." -ForegroundColor Yellow
cd C:\gokce-backend
git pull origin master

# Yeni paketleri yükle
Write-Host "📦 Paketler yükleniyor..." -ForegroundColor Yellow
cd backend
npm install

# Build et
Write-Host "🔨 Backend build ediliyor..." -ForegroundColor Yellow
npm run build

# PM2 ile restart et
Write-Host "🔄 Backend restart ediliyor..." -ForegroundColor Yellow
pm2 restart gokce-backend

# Logları göster
Write-Host "📋 Son loglar:" -ForegroundColor Green
pm2 logs gokce-backend --lines 20 --nostream

Write-Host "✅ Deployment tamamlandı!" -ForegroundColor Green
```

**Script'i çalıştırma:**
```powershell
cd C:\gokce-backend
.\deploy.ps1
```

---

## 📝 Hızlı Güncelleme Adımları (Özet)

### Git Kullanarak:
1. **Yerel:** `git add .` → `git commit -m "..."` → `git push`
2. **VPS:** `cd C:\gokce-backend` → `git pull` → `cd backend` → `npm run build` → `pm2 restart gokce-backend`

### Manuel Kopyalama:
1. **Yerel:** `npm run build` → Dosyaları kopyala
2. **VPS:** `pm2 stop gokce-backend` → Dosyaları yapıştır → `npm run build` → `pm2 start gokce-backend`

---

## ⚠️ Önemli Notlar

1. **Her zaman build yapın:** TypeScript dosyaları `.js`'e compile edilmelidir
2. **PM2 restart:** Değişikliklerin aktif olması için restart gerekir
3. **Log kontrolü:** Her deployment sonrası logları kontrol edin
4. **Environment variables:** `.env.production` dosyasını kontrol edin
5. **Database bağlantısı:** Her deployment sonrası database bağlantısını test edin

---

## 🐛 Sorun Giderme

### Backend başlamıyor:
```powershell
pm2 logs gokce-backend --lines 100
```

### Build hatası:
```powershell
cd C:\gokce-backend\backend
npm run build
# Hata mesajlarını kontrol edin
```

### Git pull hatası:
```powershell
cd C:\gokce-backend
git status
git stash  # Yerel değişiklikleri sakla
git pull origin master
```

---

## 📞 Yardım

Sorun yaşarsanız:
1. PM2 loglarını kontrol edin: `pm2 logs gokce-backend`
2. Backend'in çalıştığını kontrol edin: `pm2 status`
3. Port 3000'in açık olduğunu kontrol edin: `netstat -ano | findstr :3000`

