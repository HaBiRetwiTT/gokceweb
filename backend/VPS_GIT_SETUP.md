# 🔧 VPS'te Git Kurulumu

## Adım Adım Git Kurulumu

### 1. Git İndirme
1. VPS'te tarayıcıda şu adresi açın: https://git-scm.com/download/win
2. "Download for Windows" butonuna tıklayın
3. İndirilen `.exe` dosyasını çalıştırın

### 2. Git Kurulumu
1. Kurulum sihirbazında "Next" butonlarına tıklayın
2. Varsayılan ayarları kabul edin
3. "Install" butonuna tıklayın
4. Kurulum tamamlandığında "Finish" butonuna tıklayın

### 3. PowerShell'i Yeniden Başlatın
- PowerShell penceresini kapatın ve yeniden açın
- Veya RDP bağlantısını kapatıp yeniden bağlanın

### 4. Git Kurulumunu Test Edin
```powershell
git --version
```

Eğer bir versiyon numarası görürseniz (örn: `git version 2.43.0`), git başarıyla kurulmuştur.

### 5. Git Repository'yi Klonlayın (İlk Kurulum İçin)

Eğer VPS'te henüz repository yoksa:

```powershell
cd C:\
git clone <repository-url> gokce-backend
```

**Not:** `<repository-url>` yerine gerçek git repository URL'inizi yazın (örn: `https://github.com/kullaniciadi/gokceweb.git`)

---

## ⚠️ Alternatif: Manuel Dosya Kopyalama

Git kurmak istemiyorsanız, manuel dosya kopyalama yöntemini kullanabilirsiniz. Detaylar için `DEPLOYMENT_GUIDE.md` dosyasına bakın.

