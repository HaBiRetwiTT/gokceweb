import { boot } from 'quasar/wrappers';
import axios, { type AxiosInstance } from 'axios';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

// Configure API instance with correct backend URL
//const getApiBaseUrl = () => {
  // Production'da environment variable'dan al, development'ta localhost kullan
//  if (import.meta.env.PROD && import.meta.env.VITE_API_URL) {
//    return import.meta.env.VITE_API_URL;
//  }
//  return 'http://localhost:3000'; // Development default
//};

// Püf Nokta: IIS reverse proxy kullanarak backend'e /api üzerinden erişiyoruz
// Bu sayede port 3000'i dışarıya açmadan güvenli bir şekilde API istekleri yapabiliyoruz
// IIS web.config dosyasında /api istekleri localhost:3000'e yönlendiriliyor
const getApiBaseUrl = () => {
  // Production'da IIS reverse proxy üzerinden /api kullanıyoruz
  if (import.meta.env.PROD) {
    // IIS reverse proxy: https://gokcepms.com/api -> http://localhost:3000
    // Relative path kullanarak otomatik olarak mevcut domain'i kullanır
    return '/api';
  }
  // Development'ta localhost kullan
  return 'http://localhost:3000';
};

const api = axios.create({ 
  baseURL: getApiBaseUrl(),
  timeout: 60000, // 60 saniye - büyük veri setleri için
});

// Request interceptor - her API çağrısına kullanıcı adını ekle
api.interceptors.request.use((config) => {
  // localStorage'dan kullanıcı adını al
  const username = localStorage.getItem('username');
  
  if (username && config.data) {
    // POST/PUT isteklerinde body'ye kullanıcı adını ekle
    config.data.kullaniciAdi = username;
  } else if (username && config.params) {
    // GET isteklerinde query parametresine kullanıcı adını ekle
    config.params.kullaniciAdi = username;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error instanceof Error ? error : new Error(String(error)));
});

export default boot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api;
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
});

export { api };
