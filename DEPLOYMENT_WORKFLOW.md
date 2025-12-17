# 🚀 VPS Deployment Workflow Kılavuzu

## 📋 Önceki Sistem vs Yeni Sistem

### Önceki Sistem (Railway + Vercel):
```powershell
cd C:\Users\habir\GOKCE\gokceweb; git switch master;
cd backend; npm run build; cd ..;
cd frontend; npm version patch; npm run build; cd ..;
git add .; git commit -m "Sistem Sürüm Düzenlemeleri (auto)"; git push origin master
```
- ✅ Git push sonrası Railway ve Vercel otomatik deploy ediyordu
- ✅ Frontend sürüm numarası otomatik ilerliyordu

### Yeni Sistem (VPS):
- ✅ Git kurulumu gerekli (VPS'te)
- ✅ Manuel deployment script'leri
- ✅ Sürüm yönetimi korunuyor

---

## 🎯 Yeni Deployment Workflow

### Senaryo 1: Git Kurulu (Önerilen)

#### Yerel Bilgisayarda:

```powershell
cd C:\Users\habir\GOKCE\gokceweb
.\deploy.ps1
```

**Bu script:**
1. ✅ Git branch'i master'a geçirir
2. ✅ Frontend sürüm numarasını artırır (`npm version patch`)
3. ✅ Backend'i build eder
4. ✅ Frontend'i build eder
5. ✅ Git commit ve push yapar

#### VPS'te:

```powershell
cd C:\gokce-backend
.\deploy-vps.ps1
```

**Bu script:**
1. ✅ Git pull yapar (yeni kodları çeker)
2. ✅ Backend'i build eder
3. ✅ PM2 ile backend'i restart eder
4. ✅ Logları gösterir

**Frontend için:**
1. Yerel bilgisayardan `frontend/dist/spa` klasörünü VPS'e kopyalayın
2. `C:\inetpub\wwwroot\gokce-frontend` klasörüne yapıştırın
3. IIS'i restart edin: `iisreset`

---

### Senaryo 2: Git Kurulu Değil (Manuel)

#### Yerel Bilgisayarda:

```powershell
cd C:\Users\habir\GOKCE\gokceweb

# Frontend sürüm artır
cd frontend
npm version patch --no-git-tag-version
cd ..

# Backend build
cd backend
npm run build
cd ..

# Frontend build
cd frontend
npm run build
cd ..
```

#### VPS'te:

**Backend:**
1. Yerel bilgisayardan `backend/dist` klasörünü VPS'e kopyalayın
2. `C:\gokce-backend\backend\dist` klasörüne yapıştırın
3. PM2 restart: `pm2 restart gokce-backend`

**Frontend:**
1. Yerel bilgisayardan `frontend/dist/spa` klasörünü VPS'e kopyalayın
2. `C:\inetpub\wwwroot\gokce-frontend` klasörüne yapıştırın
3. IIS restart: `iisreset`

---

## 📝 Detaylı Adımlar

### 1. Git Kurulumu (VPS'te - İlk Kez)

1. VPS'te tarayıcıda: https://git-scm.com/download/win
2. Git'i indirip kurun
3. PowerShell'i yeniden başlatın
4. Test edin: `git --version`

### 2. Deployment Script'lerini Hazırlama

#### Yerel Bilgisayarda:

`deploy.ps1` dosyasını proje root'una kopyalayın:
```
C:\Users\habir\GOKCE\gokceweb\deploy.ps1
```

#### VPS'te:

`backend/deploy-vps.ps1` dosyasını VPS'e kopyalayın:
```
C:\gokce-backend\deploy-vps.ps1
```

### 3. İlk Deployment

#### Yerel Bilgisayarda:

```powershell
cd C:\Users\habir\GOKCE\gokceweb
.\deploy.ps1
```

#### VPS'te:

```powershell
cd C:\gokce-backend
.\deploy-vps.ps1
```

**Frontend için:**
- Yerel: `C:\Users\habir\GOKCE\gokceweb\frontend\dist\spa`
- VPS: `C:\inetpub\wwwroot\gokce-frontend`
- Kopyalayın ve IIS restart: `iisreset`

---

## 🔄 Günlük Kullanım

### Her Deployment İçin:

1. **Yerel bilgisayarda:**
   ```powershell
   cd C:\Users\habir\GOKCE\gokceweb
   .\deploy.ps1
   ```

2. **VPS'te:**
   ```powershell
   cd C:\gokce-backend
   .\deploy-vps.ps1
   ```

3. **Frontend'i kopyala:**
   - Yerel: `frontend/dist/spa` → VPS: `C:\inetpub\wwwroot\gokce-frontend`
   - IIS restart: `iisreset`

---

## 📊 Sürüm Yönetimi

### Frontend Sürüm Numarası:

- **Otomatik:** `deploy.ps1` script'i `npm version patch` çalıştırır
- **Manuel:** `cd frontend; npm version patch --no-git-tag-version`

### Sürüm Formatı:

- **Mevcut:** `1.5.3`
- **Patch:** `1.5.4` (bug fix)
- **Minor:** `1.6.0` (yeni özellik) - `npm version minor`
- **Major:** `2.0.0` (büyük değişiklik) - `npm version major`

### Sürüm Dosyası:

- `frontend/public/version.json` otomatik güncellenir
- Build sırasında `prebuild` script'i çalışır
- Frontend'de sürüm kontrolü için kullanılır

---

## 🎯 Otomatik Deployment (Opsiyonel - Gelecek)

### Webhook ile Otomatik Deployment:

1. **GitHub/GitLab Webhook** kurulumu
2. **VPS'te webhook listener** (Node.js/PowerShell)
3. **Otomatik git pull + build + restart**

**Örnek Webhook Script:**
```powershell
# webhook-listener.ps1
# GitHub webhook'tan gelen POST isteğini dinler
# deploy-vps.ps1'i otomatik çalıştırır
```

---

## 📋 Özet

### Önceki Sistem:
- ✅ Tek komut: `git push` → Otomatik deploy
- ❌ Railway/Vercel bağımlılığı

### Yeni Sistem:
- ✅ Tam kontrol: Her adımı görebilirsiniz
- ✅ Git kurulumu gerekli (VPS'te)
- ✅ 2 adım: Yerel script + VPS script
- ✅ Frontend manuel kopyalama (veya otomatik script)

---

## 🚀 Hızlı Başlangıç

1. **Git kur (VPS'te):** https://git-scm.com/download/win
2. **Script'leri kopyala:** `deploy.ps1` ve `deploy-vps.ps1`
3. **İlk deployment:** Yerel script → VPS script → Frontend kopyala
4. **Günlük kullanım:** Aynı adımlar

---

## 💡 İpuçları

1. **Git kurulumu önerilir:** Otomatik kod senkronizasyonu için
2. **Backup alın:** Deployment öncesi VPS'te backup
3. **Log kontrolü:** Her deployment sonrası PM2 loglarını kontrol edin
4. **Test edin:** Production'a geçmeden önce test edin

---

## 🐛 Sorun Giderme

### Git Pull Hatası:
```powershell
# VPS'te git durumunu kontrol edin
cd C:\gokce-backend
git status
git stash  # Yerel değişiklikleri sakla
git pull origin master
```

### PM2 Restart Hatası:
```powershell
# PM2 durumunu kontrol edin
pm2 status
pm2 logs gokce-backend --lines 50
```

### Frontend Build Hatası:
```powershell
# Yerel bilgisayarda
cd C:\Users\habir\GOKCE\gokceweb\frontend
npm install
npm run build
```

