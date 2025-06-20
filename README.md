# Hostel Yönetim Sistemi - Vue.js + Quasar Fullstack Projesi

## Proje Amacı

A ve B olmak üzere 2 blok, toplam 9 katlı ve 500 yatak kapasiteli bir hostel için; işletme yönetimi, personel, müşteri, finans, oda/yatak, hizmet ve raporlama işlemlerini kapsayan, **modern, güvenli ve kullanıcı dostu** bir web tabanlı yönetim yazılımı.

---

## Kullanılan Teknolojiler

### **Frontend (Kullanıcı Arayüzü)**
- **Vue.js 3** (Composition API, TypeScript desteğiyle)
- **Quasar Framework** (Material Design, responsive, zengin UI component'ları)
- **Pinia** (State management)
- **Vue Router** (Sayfa yönlendirme)
- **Axios** (API istekleri)
- **Chart.js / ECharts** (Görsel raporlar)

### **Backend (API & İş Mantığı)**
- **NestJS** (Node.js + TypeScript tabanlı framework)
- **TypeORM** (MS-SQL ile tam uyumlu ORM, şema desteğiyle)
- **JWT Authentication** (rol tabanlı yetkilendirme)
- **Harici API/Donanım Entegrasyonları** (HotelRunner, yazıcı, WiFi, vb.)

### **Veritabanı**
- **MS-SQL (SQL Server)**

---

## Temel Özellikler

- Kullanıcı adı/şifre ile giriş, rol tabanlı yetkilendirme
- Personel, oda, yatak, müşteri, hizmet, kasa, fiyat, borç/alacak, ödeme, rapor ve dashboard modülleri
- Kapsamlı görsel analiz ve raporlama
- Donanım ve harici API entegrasyonları (yazıcı, WiFi, HotelRunner)
- Modern, responsive ve erişilebilir arayüz
- Veri güvenliği ve güncel mimari

---

## Klasör Yapısı (Öneri)

```
/hostel-management-vue
├── backend/                # NestJS + TypeORM API
│   ├── src/
│   │   ├── modules/        # Her işlev için ayrı modül (user, room, staff, etc.)
│   │   ├── main.ts         # Uygulama giriş noktası
│   │   └── ...
│   ├── ormconfig.ts        # TypeORM ayarları
│   └── package.json
├── frontend/               # Quasar projesi
│   ├── src/
│   │   ├── pages/          # Sayfalar (Login, Dashboard, Personel, Oda, vb.)
│   │   ├── components/     # Ortak component'lar
│   │   ├── stores/         # Pinia store'lar
│   │   ├── router/         # Vue Router ayarları
│   │   ├── boot/           # Başlangıç script'leri (örn. axios, auth)
│   │   ├── assets/         # Görseller, ikonlar
│   │   └── ...
│   ├── public/
│   ├── quasar.config.js
│   └── package.json
└── README.md
```

---

## Geliştirme ve Kurulum Adımları

### 1. **Veritabanı**
- Test ortamında: localhost:1433 port da MS-SQL üzerinde, remote hostta kurulu mevcut MS-SQL veri tabanının birebir kopyası kurularak kullanılır.
- Prod ortamında: Sadece bağlantı parametreleri değiştirilerek remote hostta kurulu mevcut MS-SQL veritabanına geçilir.

### 2. **Backend (NestJS + TypeORM)**
- `cd backend`
- `npm install`
- `ormconfig.ts` dosyasında veritabanı bağlantı ayarlarını yapın.
- `npm run start:dev` ile başlatın.
- Modüller: Kullanıcı, Personel, Oda, Yatak, Müşteri, Kasa, Hizmet, Rapor, vb.
- JWT authentication ve rol tabanlı yetkilendirme entegre edilir.

### 3. **Frontend (Quasar + Vue.js)**
- Quasar CLI kurulu değilse: `npm install -g @quasar/cli`
- `cd frontend`
- `quasar dev` ile başlatın.
- Ana sayfalar: Login, Dashboard, Personel, Oda, Müşteri, Kasa, Rapor, vb.
- Pinia ile state yönetimi, Vue Router ile sayfa yönlendirme.
- API istekleri için Axios kullanın.
- Chart.js/ECharts ile raporlama ve dashboard.

### 4. **Entegrasyonlar**
- Termal yazıcı, WiFi, HotelRunner API gibi harici sistemler için backend modülleri oluşturun.
- Gerekirse masaüstü agent veya küçük servisler ile donanım entegrasyonu sağlayın.

---

## Örnek Kullanıcı Akışı

1. **Giriş:** Kullanıcı adı/şifre ile giriş yapılır, rolüne göre yetkiler atanır.
2. **Dashboard:** Boş/dolu/arıza/temizlikte odalar, finansal özet, müşteri hareketleri, anlık raporlar.
3. **Personel:** Personel ekleme, ücret/maaş/avans işlemleri, borç/alacak takibi.
4. **Oda/Yatak:** Oda ve yatak tipleri, durumları, fiyatlandırma, konaklama seçenekleri.
5. **Müşteri:** Konaklama kaydı, borç/alacak, hizmet ekleme, ödeme, makbuz yazdırma.
6. **Kasa:** Nakit, kart, EFT, acenta, depozito kasaları, transferler, fon hesabı, harcamalar.
7. **Raporlama:** Günlük/haftalık/aylık raporlar, analizler, grafikler, PDF/Excel çıktıları.

---

## Geliştirme Notları ve İpuçları

- **Quasar ile SPA, SSR, PWA, mobil ve masaüstü uygulama geliştirebilirsiniz.**
- **Vue 3 Composition API** ile modern ve okunabilir kod yazın.
- **Pinia** ile state yönetimi sade ve güçlüdür.
- **Quasar boot dosyaları** ile global ayarları (örn. axios, auth) kolayca yönetin.
- **Quasar Layout** sistemi ile sayfa iskeletini hızlıca kurabilirsiniz.
- **Quasar'ın hazır component'ları** ile formlar, tablolar, dialoglar, bildirimler ve daha fazlasını kolayca ekleyin.
- **Kapsamlı dökümantasyon ve örnekler** için Quasar ve Vue'nun resmi sitelerini kullanın.
- **API ve veri validasyonu:** Backend'de DTO ve validation pipe'ları, frontend'de form validasyonları kullanın.
- **Yetkilendirme:** Her endpoint ve sayfa için rol tabanlı kontrol uygulayın.
- **Veri güvenliği:** Şifreleri hash'leyin, hassas verileri şifreleyin.
- **Deployment:** Test ve prod ortamları için ayrı .env dosyaları ve connection string'ler kullanın.
- **Dokümantasyon:** Kodunuzu ve API'nizi mutlaka dokümante edin.

---

## Kaynaklar ve Öğrenme

- [Quasar Framework Resmi Dokümantasyon](https://quasar.dev/)
- [Vue.js 3 Resmi Dokümantasyon](https://vuejs.org/)
- [Pinia State Management](https://pinia.vuejs.org/)
- [Vue Router](https://router.vuejs.org/)
- [Chart.js](https://www.chartjs.org/)
- [ECharts](https://echarts.apache.org/)
- [NestJS Resmi Dokümantasyon](https://docs.nestjs.com/)
- [TypeORM Resmi Dokümantasyon](https://typeorm.io/)
- [MS-SQL (SQL Server) Belgeleri](https://learn.microsoft.com/tr-tr/sql/sql-server/)

---

## Sıkça Sorulan Sorular

**Q: Mevcut MS-SQL veritabanı ile birebir uyumlu mu?**  
A: Evet, TypeORM ile şema ve tablo adlarını doğrudan belirtebilirsiniz.

**Q: Testten prod'a geçişte ne değişecek?**  
A: Sadece veritabanı bağlantı parametreleri değişecek, kodda başka değişiklik gerekmez.

**Q: Donanım entegrasyonları nasıl olacak?**  
A: Backend'de ilgili modüllerle veya küçük masaüstü servislerle sağlanacak.

**Q: Yetkilendirme ve güvenlik nasıl sağlanacak?**  
A: JWT ve rol tabanlı erişim, şifre hash'leme, HTTPS, CORS, XSS, SQL Injection korumaları ile.

---

## Son Söz

Vue.js + Quasar ile modern, sürdürülebilir, güvenli ve geliştirici dostu bir hostel yönetim sistemi geliştirebilirsiniz. 
Her adımda örneklerle ve dökümantasyonla ilerleyebilirsiniz. 
Sorularınızda veya geliştirme sürecinde her zaman destek alabilirsiniz!
