import { api } from '../boot/axios';
 
export async function fetchEkHizmetler() {
  const response = await api.get('/parametre/ek-hizmetler');
  return response.data.data; // [{ Prm01, PrmAdi, Prm04 }]
} 

export async function saveEkHizmetler(payload: {
  musteriNo: number;
  MstrAdi: string;
  MstrKllnc: string;
  MstrHspTip: string;
  MstrKnklmTip: string;
  MstrOdaYatak: string;
  ekHizmetler: Array<{ label: string; miktar: number; toplamTutar: number }>;
}) {
  const response = await api.post('/musteri/ek-hizmetler', payload);
  
  // 🔥 STATS GÜNCELLEME EVENT'İ GÖNDER
  if (response.data.success) {
    window.dispatchEvent(new Event('statsNeedsUpdate'));
  }
  
  return response.data;
} 