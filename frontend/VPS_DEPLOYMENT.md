# 🚀 Frontend VPS Deployment Kılavuzu

## ✅ Backend Durumu
- ✅ Backend çalışıyor (`http://77.245.151.173:3000`)
- ✅ `/auth/login` endpoint'i başarıyla yanıt veriyor
- ✅ CORS ayarları yapıldı

## 📋 Frontend Deployment Adımları

### 1. Yerel Bilgisayarda (Windows 11)

#### Frontend'i Build Edin:

```powershell
cd C:\Users\habir\GOKCE\gokceweb\frontend
npm run build
```

**Beklenen çıktı:**
- `dist/spa/` klasörü oluşmalı
- `dist/spa/index.html` dosyası olmalı
- `dist/spa/web.config` dosyası olmalı

#### Build Çıktısını Kontrol Edin:

```powershell
cd C:\Users\habir\GOKCE\gokceweb\frontend\dist\spa
Get-ChildItem
```

**Kontrol edilecekler:**
- `index.html` var mı?
- `web.config` var mı?
- `js/`, `css/`, `fonts/` klasörleri var mı?

---

### 2. VPS'te (RDP ile bağlanın)

#### IIS Site Klasörünü Kontrol Edin:

```powershell
cd C:\inetpub\wwwroot\gokce-frontend
Get-ChildItem
```

#### Eski Dosyaları Yedekleyin (Opsiyonel):

```powershell
cd C:\inetpub\wwwroot
Rename-Item -Path "gokce-frontend" -NewName "gokce-frontend-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path "gokce-frontend"
```

#### Yeni Dosyaları Kopyalayın:

**Yöntem 1: RDP ile Manuel Kopyalama**
1. Yerel bilgisayarınızda `C:\Users\habir\GOKCE\gokceweb\frontend\dist\spa` klasörünü açın
2. Tüm dosyaları seçin (Ctrl+A)
3. Kopyalayın (Ctrl+C)
4. VPS'te `C:\inetpub\wwwroot\gokce-frontend` klasörünü açın
5. Yapıştırın (Ctrl+V)
6. Tüm dosyaları değiştirin (üzerine yazın)

**Yöntem 2: PowerShell ile Kopyalama (RDP üzerinden paylaşılan klasör)**
```powershell
# Yerel bilgisayardan VPS'e kopyala
Copy-Item -Path "C:\Users\habir\GOKCE\gokceweb\frontend\dist\spa\*" -Destination "\\77.245.151.173\C$\inetpub\wwwroot\gokce-frontend\" -Recurse -Force
```

---

### 3. IIS'i Restart Edin

#### IIS Manager'dan:
1. IIS Manager'ı açın
2. "Sites" → "GokceFrontend" sitesine sağ tıklayın
3. "Restart" seçeneğini tıklayın

#### PowerShell'den:
```powershell
iisreset
```

VEYA sadece siteyi restart edin:
```powershell
Restart-WebAppPool -Name "DefaultAppPool"
```

---

### 4. Test Edin

#### Tarayıcıda:
1. `http://77.245.151.173` adresini açın
2. Login sayfası görünmeli
3. Giriş yapmayı deneyin
4. F12 → Network sekmesini açın
5. Login butonuna tıklayın
6. `/auth/login` isteğini kontrol edin:
   - **Request URL:** `http://77.245.151.173:3000/auth/login` olmalı
   - **Status:** `201 Created` veya `200 OK` olmalı
   - **Response Headers:** `Access-Control-Allow-Origin: http://77.245.151.173` görünmeli

---

## 🐛 Sorun Giderme

### Sorun 1: Frontend açılmıyor

**Kontrol:**
```powershell
# IIS site durumunu kontrol edin
Get-WebSite -Name "GokceFrontend"
```

**Çözüm:**
- IIS Manager'da siteyi kontrol edin
- `web.config` dosyasının var olduğundan emin olun
- IIS'i restart edin

### Sorun 2: CORS hatası

**Kontrol:**
- Backend CORS ayarlarında `http://77.245.151.173` var mı?
- Frontend API URL'i `http://77.245.151.173:3000` mi?

**Çözüm:**
- Backend'i restart edin: `pm2 restart gokce-backend`
- Tarayıcı cache'ini temizleyin (Ctrl+Shift+Delete)

### Sorun 3: 404 hatası

**Kontrol:**
- `web.config` dosyası `dist/spa` klasöründe mi?
- IIS URL Rewrite modülü yüklü mü?

**Çözüm:**
- `web.config` dosyasını kontrol edin
- IIS URL Rewrite modülünü yükleyin (gerekirse)

---

## ✅ Başarı Kontrolü

Frontend başarıyla deploy edildiyse:

1. **Tarayıcıda:**
   - `http://77.245.151.173` açılmalı
   - Login sayfası görünmeli

2. **Network sekmesinde:**
   - API istekleri `http://77.245.151.173:3000` adresine gitmeli
   - CORS hatası olmamalı
   - Login başarılı olmalı

3. **Console'da:**
   - JavaScript hataları olmamalı
   - API istekleri başarılı olmalı

---

## 📝 Özet

1. ✅ Yerel bilgisayarda: `npm run build`
2. ✅ Build çıktısını VPS'e kopyala
3. ✅ IIS'i restart et
4. ✅ Tarayıcıda test et

---

## 🎯 Sonraki Adımlar

1. Frontend'i build edin
2. VPS'e aktarın
3. IIS'i restart edin
4. Test edin ve sonuçları paylaşın

