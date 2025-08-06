# 🤖 GÖKÇE AI Agent Kurulum Rehberi

## 📋 Genel Bakış

Bu rehber, GÖKÇE Pansiyon Yönetim Sistemi'ne AI Agent özelliklerinin nasıl entegre edildiğini açıklar. Sistem, mevcut NestJS backend ve Quasar/Vue.js frontend yapısına AI destekli öneriler ve analizler ekler.

## 🎯 AI Agent Özellikleri

### ✅ Mevcut Özellikler
- **Müşteri Analizi**: Müşteri tercihlerini analiz eder ve kişiselleştirilmiş öneriler sunar
- **Fiyat Optimizasyonu**: Piyasa koşullarına göre optimal fiyatlandırma önerileri
- **Oda Yönetimi**: Oda doluluk oranları ve bakım planlaması önerileri
- **Finansal Analiz**: Gelir analizi ve karlılık optimizasyonu önerileri
- **Asenkron Görev Yönetimi**: Uzun süren analizler için arka plan görevleri

### 🔧 Teknik Özellikler
- **Backend**: NestJS + TypeScript + AI algoritmaları
- **Frontend**: Vue.js 3 + Quasar Framework + AI bileşenleri
- **API Endpoints**: RESTful AI analiz endpoint'leri
- **Real-time**: Canlı görev durumu takibi
- **Responsive**: Mobil ve masaüstü uyumlu tasarım

## 🚀 Kurulum Adımları

### 1. Backend Kurulumu

```bash
# Backend dizinine git
cd backend

# Bağımlılıkları yükle
npm install

# AI Agent modülünü kontrol et
ls src/agent/
```

**Beklenen Dosyalar:**
- `src/agent/agent.module.ts`
- `src/agent/agent.service.ts`
- `src/agent/agent.controller.ts`

### 2. Frontend Kurulumu

```bash
# Frontend dizinine git
cd frontend

# Bağımlılıkları yükle
npm install

# AI Agent bileşenini kontrol et
ls src/components/AIAgent.vue
ls src/pages/ai-agent.vue
```

### 3. Servisleri Başlatma

```bash
# Backend'i başlat (Terminal 1)
cd backend
npm run start:dev

# Frontend'i başlat (Terminal 2)
cd frontend
npm run dev
```

### 4. Erişim Kontrolü

- **Frontend**: `http://localhost:9000`
- **Backend API**: `http://localhost:3000`
- **AI Agent Sayfası**: `http://localhost:9000/ai-agent`

## 📊 API Endpoint'leri

### AI Agent Endpoint'leri

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/agent/health` | GET | AI Agent sağlık kontrolü |
| `/agent/analyze-customer` | POST | Müşteri analizi |
| `/agent/optimize-pricing` | POST | Fiyat optimizasyonu |
| `/agent/manage-rooms` | POST | Oda yönetimi |
| `/agent/analyze-financial` | POST | Finansal analiz |
| `/agent/create-task` | POST | Asenkron görev oluşturma |
| `/agent/task/:taskId` | GET | Görev durumu kontrolü |
| `/agent/tasks` | GET | Tüm görevleri listele |
| `/agent/recommendations` | GET | Genel AI önerileri |

### Örnek API Kullanımı

```bash
# Müşteri analizi
curl -X POST http://localhost:3000/agent/analyze-customer \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Bireysel",
    "odaTipi": "Standart",
    "konaklamaSuresi": 7,
    "butce": "Orta"
  }'

# AI Agent sağlık kontrolü
curl http://localhost:3000/agent/health
```

## 🎨 Frontend Kullanımı

### AI Agent Sayfasına Erişim

1. **Navigasyon**: Sol menüden "AI Asistan" linkine tıklayın
2. **Ana Sayfa**: AI Agent dashboard'u görüntülenir
3. **Özellikler**: 4 ana AI özelliği kartları görünür

### AI Özelliklerini Kullanma

#### 1. Müşteri Analizi
- Kart'a tıklayın
- Müşteri verilerini girin
- "Analiz Et" butonuna tıklayın
- Sonuçları ve önerileri görüntüleyin

#### 2. Fiyat Optimizasyonu
- Kart'a tıklayın
- Oda ve piyasa verilerini girin
- "Optimize Et" butonuna tıklayın
- Optimal fiyat önerilerini görüntüleyin

#### 3. Oda Yönetimi
- Kart'a tıklayın
- Oda durumu verilerini girin
- "Analiz Et" butonuna tıklayın
- Yönetim önerilerini görüntüleyin

#### 4. Finansal Analiz
- Kart'a tıklayın
- Finansal verileri girin
- "Analiz Et" butonuna tıklayın
- Finansal önerileri görüntüleyin

## 🔧 Konfigürasyon

### Environment Variables

**Backend (.env.development):**
```bash
NODE_ENV=development
DB_TABLE_SCHEMA=dbo
DB_SP_SCHEMA=dbo
```

**Backend (.env.production):**
```bash
NODE_ENV=production
DB_TABLE_SCHEMA=harunta
DB_SP_SCHEMA=dbo
```

### AI Algoritma Ayarları

`backend/src/agent/agent.service.ts` dosyasında AI algoritmalarını özelleştirebilirsiniz:

```typescript
// Risk skoru hesaplama
private calculateRiskScore(customerData: any): number {
  let score = 50; // Başlangıç skoru
  
  if (customerData.type === 'Kurumsal') score += 20;
  if (customerData.odemeGecmisi === 'İyi') score += 15;
  if (customerData.konaklamaSuresi > 30) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

// Fiyat optimizasyonu
private calculateOptimalPrice(roomData: any, marketData: any): number {
  const basePrice = roomData.price;
  const marketAverage = marketData.averagePrice || basePrice;
  const demandFactor = marketData.demandFactor || 1;
  
  return Math.round(basePrice * demandFactor * 0.95);
}
```

## 🧪 Test Etme

### 1. Backend Testleri

```bash
# Backend test dizinine git
cd backend

# Unit testleri çalıştır
npm run test

# E2E testleri çalıştır
npm run test:e2e
```

### 2. API Testleri

```bash
# AI Agent sağlık kontrolü
curl http://localhost:3000/agent/health

# Müşteri analizi testi
curl -X POST http://localhost:3000/agent/analyze-customer \
  -H "Content-Type: application/json" \
  -d '{"type": "Bireysel", "odaTipi": "Standart"}'
```

### 3. Frontend Testleri

```bash
# Frontend test dizinine git
cd frontend

# Lint kontrolü
npm run lint

# Build testi
npm run build
```

## 🐛 Sorun Giderme

### Yaygın Sorunlar

#### 1. Backend Başlatma Hatası
```bash
# Port kontrolü
netstat -ano | findstr :3000

# Port temizleme
taskkill /PID [PROCESS_ID] /F
```

#### 2. Frontend Bağlantı Hatası
```bash
# Backend'in çalıştığından emin olun
curl http://localhost:3000/agent/health

# CORS ayarlarını kontrol edin
```

#### 3. AI Agent Çevrimdışı
```bash
# Backend loglarını kontrol edin
cd backend
npm run start:dev

# AI Agent modülünün yüklendiğinden emin olun
```

### Debug Modu

```bash
# Backend debug modu
cd backend
npm run start:debug

# Frontend debug modu
cd frontend
npm run dev
```

## 📈 Performans Optimizasyonu

### 1. Backend Optimizasyonu

- **Caching**: Redis cache ekleyin
- **Database**: Query optimizasyonu yapın
- **Memory**: Garbage collection ayarları

### 2. Frontend Optimizasyonu

- **Lazy Loading**: Bileşenleri lazy load edin
- **Code Splitting**: Route bazlı code splitting
- **Caching**: Service worker cache

### 3. AI Algoritma Optimizasyonu

- **Async Processing**: Uzun süren işlemler için async
- **Batch Processing**: Toplu veri işleme
- **Memory Management**: Bellek kullanımını optimize edin

## 🔒 Güvenlik

### 1. API Güvenliği

- **Authentication**: JWT token kontrolü
- **Authorization**: Role-based access control
- **Rate Limiting**: API rate limiting

### 2. Data Güvenliği

- **Input Validation**: Girdi doğrulama
- **SQL Injection**: Prepared statements
- **XSS Protection**: Cross-site scripting koruması

## 📚 Geliştirme Rehberi

### Yeni AI Özelliği Ekleme

1. **Backend Service'e metod ekleyin:**
```typescript
async newFeature(data: any): Promise<AgentResponse> {
  // AI algoritması
  const result = await this.performNewFeature(data);
  
  return {
    success: true,
    data: result,
    suggestions: ['Öneri 1', 'Öneri 2']
  };
}
```

2. **Controller'a endpoint ekleyin:**
```typescript
@Post('new-feature')
async newFeature(@Body() data: any): Promise<AgentResponse> {
  return await this.agentService.newFeature(data);
}
```

3. **Frontend'e bileşen ekleyin:**
```vue
<template>
  <q-card class="ai-feature-card" @click="openNewFeature">
    <!-- UI bileşenleri -->
  </q-card>
</template>
```

### AI Algoritma Geliştirme

```typescript
// Yeni algoritma ekleme
private async performNewFeature(data: any): Promise<any> {
  // 1. Veri analizi
  const analysis = this.analyzeData(data);
  
  // 2. Pattern recognition
  const patterns = this.recognizePatterns(analysis);
  
  // 3. Prediction
  const prediction = this.predictOutcome(patterns);
  
  // 4. Optimization
  const optimization = this.optimizeResults(prediction);
  
  return {
    analysis,
    patterns,
    prediction,
    optimization
  };
}
```

## 🚀 Production Deployment

### 1. Backend Deployment

```bash
# Production build
cd backend
npm run build

# Environment variables
export NODE_ENV=production
export DB_TABLE_SCHEMA=harunta
export DB_SP_SCHEMA=dbo

# Start production server
npm run start:prod
```

### 2. Frontend Deployment

```bash
# Production build
cd frontend
npm run build

# Deploy to server
# dist/spa klasörünü web sunucusuna yükleyin
```

### 3. Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

## 📞 Destek

### İletişim
- **Geliştirici**: HaBiRetwiTT
- **Email**: habiretwitt@gmail.com
- **Proje**: GÖKÇE Pansiyon Yönetim Sistemi

### Kaynaklar
- [NestJS Dokümantasyonu](https://nestjs.com/)
- [Quasar Framework](https://quasar.dev/)
- [Vue.js Dokümantasyonu](https://vuejs.org/)

---

## 🎉 Başarılı Kurulum!

AI Agent sistemi başarıyla kuruldu! Artık GÖKÇE Pansiyon Yönetim Sistemi'nde:

✅ **Akıllı müşteri analizi** yapabilirsiniz  
✅ **Otomatik fiyat optimizasyonu** kullanabilirsiniz  
✅ **Oda yönetimi önerileri** alabilirsiniz  
✅ **Finansal analiz** yapabilirsiniz  
✅ **Asenkron görev yönetimi** kullanabilirsiniz  

**Püf Noktası**: AI önerilerini düzenli olarak kontrol edin ve iş süreçlerinize entegre edin. Bu sayede sürekli iyileştirme yapabilir ve pansiyon yönetiminizi optimize edebilirsiniz! 🚀 