import { api } from '../boot/axios';

export interface NakitAkisRecord {
  id?: number;
  OdmVade: string; // Ödeme vadesi (SP'den gelen)
  odemeAraci: string; // Ödeme aracı
  aciklama: string;
  tip: string;
  tutar: number;
  kategori: string;
  taksit: string; // Taksit
  digerBilgiler: string; // Diğer bilgiler
  odemeDurumu?: boolean; // Ödeme durumu
  tutarDurumu?: boolean; // Tutar durumu
}

export interface NakitAkisResponse {
  success: boolean;
  data: NakitAkisRecord[];
  message?: string;
}

export interface BugunTarihResponse {
  success: boolean;
  data: string;
  message: string;
}

/**
 * Nakit akış verilerini getirir
 * @param tarih DD.MM.YYYY formatında tarih (opsiyonel)
 * @returns Nakit akış kayıtları
 */
export async function getNakitAkisVerileri(tarih?: string): Promise<NakitAkisRecord[]> {
  try {
    const params = tarih ? { tarih } : {};
    const response = await api.get<NakitAkisResponse>('/islem/nakit-akis', { params });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Veri alınamadı');
    }
  } catch (error) {
    console.error('Nakit akış verileri alınırken hata:', error);
    throw new Error(`Nakit akış verileri alınamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
}

/**
 * Bugünün tarihini DD.MM.YYYY formatında getirir
 * @returns Bugünün tarihi
 */
export function getBugunTarih(): string {
  try {
    // Client-side tarih hesapla (daha hızlı)
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  } catch (error) {
    console.error('Bugünün tarihi alınırken hata:', error);
    // Hata durumunda client-side tarih hesapla
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }
}

/**
 * tblFonKasaY tablosundan islmGrup seçimine göre islmAltG distinct listesi getirir
 * @param islmGrup İslm grubu
 * @returns İslm alt grupları listesi
 */
export async function getIslmAltGruplar(islmGrup: string): Promise<string[]> {
  try {
    if (!islmGrup) {
      throw new Error('İslm grubu parametresi gerekli');
    }

    // Önce islm-alt-gruplar endpoint'ini dene
    try {
      const response = await api.get<{ success: boolean; data: string[]; message?: string }>(
        `/islem/islm-alt-gruplar`, 
        { params: { islmGrup } }
      );
      
      if (response.data.success) {
        return response.data.data;
      }
    } catch {
      console.log('islm-alt-gruplar endpoint çalışmıyor, alternatif yöntem deneniyor...');
    }

    // Alternatif yöntem: Mevcut islem-gruplari endpoint'ini kullan
    // Bu endpoint'te islemAltG bilgisi yok, bu yüzden sabit değerler döndür
    const staticAltGruplar: { [key: string]: string[] } = {
      'Kredi Kartları': ['Kredi Kartı Ödemesi', 'Kredi Kartı Komisyonu', 'Kredi Kartı Masrafı'],
      'Krediler': ['Kredi Ödemesi', 'Kredi Faizi', 'Kredi Masrafı'],
      'Ev Kiraları': ['Ev Kira Ödemesi', 'Ev Depozito', 'Ev Aidat'],
      'Ev Faturaları': ['Elektrik Faturası', 'Su Faturası', 'Doğalgaz Faturası', 'İnternet Faturası'],
      'Senet-Çek': ['Senet Ödemesi', 'Çek Ödemesi', 'Senet Masrafı'],
      'Genel Fon Ödm.': ['Genel Gider', 'Personel Maaşı', 'Vergi Ödemesi', 'Sigorta Ödemesi'],
      'Diğer(Şirket Ödm.)': ['Şirket Gideri', 'Ofis Masrafı', 'Pazarlama Gideri']
    };

    return staticAltGruplar[islmGrup] || [];
    
  } catch (error) {
    console.error('İşlem alt grupları alınırken hata:', error);
    throw new Error(`İşlem alt grupları alınamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
}

/**
 * Test amaçlı örnek veri döndürür
 * @returns Örnek nakit akış kayıtları
 */
export function getOrnekVeriler(): NakitAkisRecord[] {
  return [
    {
      id: 1,
      OdmVade: '18.08.2025',
      odemeAraci: 'Banka EFT',
      aciklama: 'Oda kirası geliri',
      tip: 'GELİR',
      tutar: 16500.00,
      kategori: 'Oda Gelirleri',
      taksit: '1/1',
      digerBilgiler: 'Aylık oda kirası',
      odemeDurumu: true,
      tutarDurumu: true,
    },
    {
      id: 2,
      OdmVade: '19.08.2025',
      odemeAraci: 'Nakit',
      aciklama: 'Market alışverişi',
      tip: 'GİDER',
      tutar: 250.50,
      kategori: 'Market',
      taksit: '1/1',
      digerBilgiler: 'Günlük ihtiyaçlar',
      odemeDurumu: false,
      tutarDurumu: true,
    },
    {
      id: 3,
      OdmVade: '20.08.2025',
      odemeAraci: 'Kredi Kartı',
      aciklama: 'Temizlik malzemeleri',
      tip: 'GİDER',
      tutar: 180.00,
      kategori: 'Temizlik',
      taksit: '1/1',
      digerBilgiler: 'Otel temizlik malzemeleri',
      odemeDurumu: false,
      tutarDurumu: true,
    }
  ];
}

// sp_FonDevirY için interface ekle
export interface FonDevirYResponse {
  success: boolean;
  data: {
    devirBakiye: number;
    tarih: string;
  };
  message: string;
}

// sp_FonDevirY fonksiyonu ekle
export async function getFonDevirY(tarih: string): Promise<number> {
  try {
    const response = await api.get<FonDevirYResponse>(`/islem/fon-devir-y/${tarih}`);
    
    if (response.data.success) {
      const devirBakiye = response.data.data.devirBakiye;
      return devirBakiye;
    } else {
      throw new Error('Fon devir bakiyesi alınamadı');
    }
    
  } catch (error) {
    console.error('Fon devir bakiyesi hatası:', error);
    throw new Error('Fon devir bakiyesi alınamadı');
  }
}

/**
 * Bugünün tarihini DD.MM.YYYY formatında döndürür
 * @returns Bugünün tarihi
 */
