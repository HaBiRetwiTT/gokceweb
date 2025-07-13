# 🏨 Gökçe Web Frontend

## ⚠️ CRITICAL DATABASE RULE

**🔒 DATABASE SCHEMA COMPATIBILITY REQUIRED**

This frontend interfaces with the **`gokcepansiyon2010`** SQL Server database that is **ACTIVELY RUNNING IN PRODUCTION**.

### **FRONTEND DEVELOPMENT RULES:**
- ❌ **NEVER** request changes to database field names or structure
- ❌ **NEVER** expect database modifications to accommodate frontend needs
- ✅ **ALWAYS** adapt frontend models to match existing database schema
- ✅ **ALWAYS** use exact field names as they exist in production database
- ✅ **ALWAYS** maintain compatibility with existing SQL structure

**⚡ Frontend must adapt to the database, not the other way around!**

---

Vue.js + Quasar Framework based frontend for **Gökçe Pension Management System** - a modern, responsive customer registration and room management interface.

## 📋 Project Description

Modern web frontend for pension/hotel management with advanced features including:

### 🎯 Key Features
- **Advanced Customer Registration Form** with container-based layout
- **Intelligent Pricing System** with economic optimization algorithms
- **Room & Accommodation Management** with real-time availability
- **Corporate Account Management** with automatic data synchronization
- **Responsive Design** with desktop-first, mobile-adaptive containers
- **Dynamic Form Validation** with real-time feedback

### 🏗️ Architecture Overview
- **Framework**: Vue.js 3 with Composition API
- **UI Framework**: Quasar Framework with Material Design
- **Language**: TypeScript for type safety
- **State Management**: Pinia stores
- **HTTP Client**: Axios with custom configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Backend API running on `http://localhost:3000`

### Installation
```bash
npm install
```

### Development Mode
```bash
# Hot-reload development server
npm run dev
# or
quasar dev
```

**Access Application:**
- Frontend: `http://localhost:9000`
- Backend API: `http://localhost:3000`

### Production Build
```bash
quasar build
```

### Code Quality
```bash
# Lint files
npm run lint

# Format files  
npm run format
```

## 🏗️ Container-Based Form Architecture

### 5-Container System

The customer registration form uses an advanced container architecture:

#### **1. Corporate Fields Container (Orange Theme)**
```vue
<!-- Company information for corporate customers -->
<div class="corporate-container">
  <q-input v-model="formData.MstrFirma" label="Firma" />
  <q-input v-model="formData.MstrVD" label="Vergi Dairesi" />
  <q-input v-model="formData.MstrVno" label="Vergi No" />
  <q-input v-model="formData.MstrFrmMdr" label="Firma Müdürü" />
</div>
```

#### **2. Customer Information Container (Blue Theme)**
```vue
<!-- Personal customer information -->
<div class="customer-container">
  <q-input v-model="formData.MstrTCN" label="TC Kimlik No" />
  <q-input v-model="formData.MstrTelNo" label="Telefon" />
  <q-input v-model="formData.MstrAdi" label="Müşteri Adı" />
</div>
```

#### **3. Room & Accommodation Container (Green Theme)**
```vue
<!-- Room selection and accommodation details -->
<div class="accommodation-container">
  <q-select v-model="formData.OdaTipi" :options="odaTipleri" />
  <q-select v-model="formData.OdaYatak" :options="bosOdalar" />
  <q-input v-model="formData.KonaklamaSuresi" type="number" />
</div>
```

#### **4. Payment & Actions Container (Purple Theme)**
```vue
<!-- Pricing calculations and form actions -->
<div class="payment-container">
  <q-input v-model="formData.HesaplananBedel" readonly />
  <q-input v-model="formData.ToplamBedel" />
  <q-btn @click="submitForm" color="primary">Kaydet</q-btn>
</div>
```

#### **5. Extra Information Container (Teal Theme)**
```vue
<!-- Additional customer details -->
<div class="extra-info-container">
  <q-input v-model="formData.MstrDgmTarihi" type="date" />
  <q-input v-model="formData.MstrAdres" type="textarea" />
  <q-input v-model="formData.MstrNot" type="textarea" />
</div>
```

### Responsive Layout System

```scss
// Desktop: Side-by-side layout (1200px width)
.form-layout-desktop {
  display: flex;
  gap: 20px;
  
  .main-containers {
    flex: 1;
    max-width: 800px;
  }
  
  .extra-info-container {
    width: 400px;
    height: auto; // Syncs with main container height
  }
}

// Mobile: Stacked layout
.form-layout-mobile {
  flex-direction: column;
  
  .extra-info-container {
    width: 100%;
    height: auto;
  }
}
```

## 🧮 Intelligent Pricing Algorithm

### Economic Optimization System

The pricing system automatically calculates the most cost-effective accommodation type:

```typescript
// Advanced pricing calculation
const calculateOptimalPricing = (duration: number, rates: PricingRates) => {
  const { daily, weekly, monthly } = rates;
  
  // Algorithm conditions for optimal pricing
  if (duration <= 7 && duration * daily <= weekly) {
    return { type: 'GÜNLÜK', amount: duration * daily };
  }
  
  if (duration > 7 && (duration - 7) * daily + weekly <= 2 * weekly) {
    return { type: '1 HAFTALIK', amount: (duration - 7) * daily + weekly };
  }
  
  if (duration > 14 && (duration - 14) * daily + 2 * weekly <= 3 * weekly) {
    return { type: '2 HAFTALIK', amount: (duration - 14) * daily + 2 * weekly };
  }
  
  if (duration > 21 && (duration - 21) * daily + 3 * weekly <= monthly) {
    return { type: '3 HAFTALIK', amount: (duration - 21) * daily + 3 * weekly };
  }
  
  return { type: 'AYLIK', amount: monthly };
};
```

### Real-time Price Updates

```vue
<script setup lang="ts">
// Reactive pricing system
watch([() => formData.KonaklamaSuresi, () => formData.OdaTipi], 
  async ([duration, roomType]) => {
    if (duration && roomType) {
      const pricing = await calculatePricing(duration, roomType);
      formData.HesaplananBedel = pricing.amount;
      formData.KonaklamaTipi = pricing.type;
    }
  }
);
</script>
```

## 🎨 Dynamic Container Height Synchronization

### Advanced Height Management

```typescript
// Container height synchronization system
const adjustContainerHeights = () => {
  const mainContainer = document.querySelector('.main-containers');
  const extraContainer = document.querySelector('.extra-info-container');
  
  if (mainContainer && extraContainer) {
    // Reset heights for accurate measurement
    extraContainer.style.height = 'auto';
    
    // Measure and synchronize
    setTimeout(() => {
      const mainHeight = mainContainer.offsetHeight;
      extraContainer.style.height = `${mainHeight}px`;
    }, 50);
  }
};

// Real-time monitoring with ResizeObserver
const observer = new ResizeObserver(() => {
  adjustContainerHeights();
});

onMounted(() => {
  const mainContainer = document.querySelector('.main-containers');
  if (mainContainer) {
    observer.observe(mainContainer);
  }
});
```

## 🔗 Backend Integration

### API Service Configuration

```typescript
// axios configuration
import { boot } from 'quasar/wrappers';
import axios, { AxiosInstance } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use((config) => {
  console.log('API Request:', config.method?.toUpperCase(), config.url);
  return config;
});

// Response interceptor  
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
```

### API Integration Examples

```typescript
// Customer registration
const submitCustomer = async (customerData: CustomerFormData) => {
  try {
    const response = await api.post('/musteri-ekle', customerData);
    return response.data;
  } catch (error) {
    throw new Error('Müşteri kayıt hatası');
  }
};

// Room pricing fetch
const getRoomPricing = async (roomType: string) => {
  try {
    const response = await api.get(`/oda-tip-fiyatlari/${encodeURIComponent(roomType)}`);
    return response.data;
  } catch (error) {
    console.error('Fiyat bilgisi alınamadı:', error);
    return null;
  }
};

// Available rooms fetch
const getAvailableRooms = async (roomType: string) => {
  try {
    const response = await api.get(`/bos-odalar/${encodeURIComponent(roomType)}`);
    return response.data;
  } catch (error) {
    console.error('Boş oda listesi alınamadı:', error);
    return [];
  }
};
```

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── EssentialLink.vue          # Navigation component
│   │   └── models.ts                  # TypeScript interfaces
│   ├── pages/
│   │   ├── IndexPage.vue              # Dashboard
│   │   ├── LoginPage.vue              # Authentication
│   │   ├── musteri-islem.vue          # Main customer form
│   │   ├── musteri-islem-BACKUP-v1.0.vue  # Form backup v1
│   │   └── musteri-islem-BACKUP-v2.0.vue  # Form backup v2
│   ├── layouts/
│   │   └── MainLayout.vue             # Main application layout
│   ├── router/
│   │   ├── index.ts                   # Vue Router configuration
│   │   └── routes.ts                  # Route definitions
│   ├── stores/
│   │   ├── index.ts                   # Pinia store configuration
│   │   └── example-store.ts           # Example Pinia store
│   ├── boot/
│   │   └── axios.ts                   # Axios configuration
│   ├── css/
│   │   ├── app.scss                   # Global styles
│   │   └── quasar.variables.scss      # Quasar customization
│   └── App.vue                        # Root component
├── public/
│   ├── favicon.ico                    # Application icon
│   └── icons/                         # Various icon sizes
└── quasar.config.ts                   # Quasar framework configuration
```

## 🔧 Development Guidelines

### Form Development Best Practices

1. **Container Organization**: Keep related fields in themed containers
2. **Reactive Updates**: Use Vue 3 watch functions for form reactivity
3. **Type Safety**: Define TypeScript interfaces for all form data
4. **Validation**: Implement real-time validation with Quasar rules
5. **Error Handling**: Provide user-friendly error messages

### Component Development

```vue
<script setup lang="ts">
// Type-safe component with Composition API
interface CustomerFormData {
  MstrAdi: string;
  MstrHspTip: 'Bireysel' | 'Kurumsal';
  MstrTCN: string;
  // ... other fields
}

const formData = ref<CustomerFormData>({
  MstrAdi: '',
  MstrHspTip: 'Bireysel',
  MstrTCN: '',
});

// Reactive form handling
const handleSubmit = async () => {
  try {
    await submitCustomer(formData.value);
    showSuccessNotification();
  } catch (error) {
    showErrorNotification(error.message);
  }
};
</script>
```

### Styling Guidelines

```scss
// Container themes with consistent styling
.corporate-container {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-left: 4px solid #ff9800;
}

.customer-container {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-left: 4px solid #2196f3;
}

.accommodation-container {
  background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
  border-left: 4px solid #4caf50;
}
```

## 🐛 Troubleshooting

### Common Issues

**Container Height Sync Problems:**
```javascript
// Manual height adjustment trigger
adjustContainerHeights();
```

**API Connection Issues:**
```javascript
// Check backend connection
console.log('Backend Status:', await api.get('/health'));
```

**Form Validation Errors:**
```vue
<!-- Add validation rules -->
<q-input 
  v-model="formData.MstrTCN"
  :rules="[val => val.length === 11 || 'TC 11 haneli olmalı']"
/>
```

## 📦 Build & Deployment

### Production Build
```bash
# Build for production
quasar build

# Output in: dist/spa/
```

### Environment Configuration
```typescript
// quasar.config.ts
const config = {
  build: {
    env: {
      API_BASE_URL: process.env.NODE_ENV === 'production' 
        ? 'https://your-backend-api.com' 
        : 'http://localhost:3000'
    }
  }
};
```

## 📞 Support & Resources

- **Vue.js Documentation**: [https://vuejs.org](https://vuejs.org)
- **Quasar Framework**: [https://quasar.dev](https://quasar.dev)  
- **TypeScript Guide**: [https://www.typescriptlang.org](https://www.typescriptlang.org)
- **Backend Integration**: See `../backend/README.md`

## 📄 License

This project is licensed under the MIT License.
