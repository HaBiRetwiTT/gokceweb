/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Musteri } from '../entities/musteri.entity';
import { DatabaseConfigService } from '../database/database-config.service';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

export interface MusteriKonaklamaData {
  MstrTCN: string;
  MstrHspTip: string;
  MstrFirma: string;
  MstrAdi: string;
  MstrTelNo: string;
  KnklmOdaTip: string;
  KnklmOdaNo: string;
  KnklmYtkNo: string;
  KnklmTip: string;
  KnklmNfyt: number;
  KnklmGrsTrh: string;
  KnklmPlnTrh: string;
  KnklmCksTrh: string;
  KnklmNot: string;
  KnklmKrLst?: string; // 🚨 Kara Liste Flag
  odemeVadesi?: string;
}

// Tip güvenliği: Dashboard birleşik istatistik satırı
type UnifiedStatsRow = {
  ToplamAktifKonaklama: number | string | null;
  GunlukKonaklama: number | string | null;
  HaftalikKonaklama: number | string | null;
  AylikKonaklama: number | string | null;
  ToplamGelir: number | string | null;
  OrtalamaGelir: number | string | null;
  YeniMusteriKonaklama: number | string | null;
  YeniGirisKonaklama: number | string | null;
  DevamEdenKonaklama: number | string | null;
  BugünCikanKonaklama: number | string | null;
  BorcluMusteriSayisi: number | string | null;
  AlacakliMusteriSayisi: number | string | null;
  BakiyesizHesaplarSayisi: number | string | null;
  SuresiGecentKonaklama: number | string | null;
};

// Tip güvenliği: Borçlu müşteri satırı (liste sorgusu)
type BorcluMusteriRow = {
  cKytTarihi: string;
  CariKllnc: string;
  CariKod: string;
  CariAdi: string;
  CariVD: string;
  CariVTCN: string;
  CariYetkili: string;
  CariTelNo: string;
  MstrFirma: string;
  MstrHspTip: string;
  BorcTutari: number | string | null;
  CikisTarihi: string | null;
  KnklmCksTrh: string | null;
  KnklmPlnTrh: string | null;
  MstrDurum: string | null;
  odemeVadesi?: string | null;
};

// Tip güvenliği: Cari hareket satırı (Excel)
type CariHareketRow = {
  iKytTarihi: string;
  islemTip?: string | null;
  islemBilgi?: string | null;
  islemTutar?: number | null;
};

// Tip güvenliği: Konaklama geçmişi satırı (PDF)
type KonaklamaGecmisRow = {
  kKytTarihi: string;
  KnklmOdaTip?: string | null;
  KnklmOdaNo?: string | number | null;
  KnklmYtkNo?: string | number | null;
  KnklmTip?: string | null;
  KnklmNfyt?: number | null;
};

@Injectable()
export class DashboardService {
  private dbConfig: DatabaseConfigService;
  private debugLog(...args: unknown[]): void {
    if (process.env.NODE_ENV !== 'production') {
       
      console.log(...args);
    }
  }
  private statsCache: { data: any; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 0; // Cache devre dışı - her zaman güncel veri

  constructor(
    @InjectRepository(Musteri)
    private musteriRepository: Repository<Musteri>,
  ) {
    this.dbConfig = new DatabaseConfigService();
  }

  // Global arama: v_MusteriKonaklama üzerinde karttan bağımsız arama
  async searchMusteriKonaklama(queryText: string, page = 1, limit = 50): Promise<{ data: MusteriKonaklamaData[] & { targetKart: string }[]; total: number; page: number; limit: number; }>
  {
    const views = this.dbConfig.getViews();
    const offset = (Math.max(1, page) - 1) * Math.max(1, limit);
    const pageSize = Math.max(1, Math.min(limit, 100));

    if (!queryText || queryText.trim().length < 2) {
      return { data: [], total: 0, page: Math.max(1, page), limit: pageSize };
    }

    // Telefon numarası aramalarında tire/boşluk temizleme için normalize edilmiş versiyon
    const q = `%${queryText.trim()}%`;

    // Toplam sayıyı hesapla
    const countSql = `
      WITH src AS (
        SELECT v.MstrTCN, v.knklmNo
        FROM ${views.musteriKonaklama} v
        WHERE 
          v.MstrTCN LIKE @0 OR 
          v.MstrAdi LIKE @0 OR 
          v.MstrTelNo LIKE @0 OR 
          v.MstrFirma LIKE @0 OR 
          v.KnklmOdaTip LIKE @0 OR 
          CAST(v.KnklmOdaNo AS NVARCHAR(50)) LIKE @0 OR 
          CAST(v.KnklmYtkNo AS NVARCHAR(50)) LIKE @0 OR 
          v.KnklmTip LIKE @0
      ), ranked AS (
        SELECT 
          s.MstrTCN,
          s.knklmNo,
          ROW_NUMBER() OVER (PARTITION BY s.MstrTCN ORDER BY s.knklmNo DESC) AS rn
        FROM src s
      )
      SELECT COUNT(1) AS total FROM ranked WHERE rn = 1
    `;

    // Hedef kartı belirle: öncelik Bugün Çıkan > Süresi Dolan > Devam Eden > Yeni Müşteri > Yeni Giriş
    const dataSql = `
      WITH src AS (
        SELECT 
          v.MstrTCN,
          v.MstrHspTip,
          v.MstrFirma,
          v.MstrAdi,
          v.MstrTelNo,
          v.KnklmOdaTip,
          v.KnklmOdaNo,
          v.KnklmYtkNo,
          v.KnklmTip,
          v.KnklmGrsTrh,
          v.KnklmPlnTrh,
          v.KnklmLfyt,
          v.Knklmisk,
          v.KnklmNfyt,
          v.KnklmNot,
          v.knklmNo,
          -- Eğer view KnklmCksTrh içermiyorsa NULL kalır; mevcut kart kuralları diğer alanlarla da çalışır
          CAST(NULL AS NVARCHAR(10)) AS KnklmCksTrh
        FROM ${views.musteriKonaklama} v
        WHERE 
          v.MstrTCN LIKE @0 OR 
          v.MstrAdi LIKE @0 OR 
          v.MstrTelNo LIKE @0 OR 
          v.MstrFirma LIKE @0 OR 
          v.KnklmOdaTip LIKE @0 OR 
          CAST(v.KnklmOdaNo AS NVARCHAR(50)) LIKE @0 OR 
          CAST(v.KnklmYtkNo AS NVARCHAR(50)) LIKE @0 OR 
          v.KnklmTip LIKE @0
      ), ranked AS (
        SELECT 
          s.*,
          ROW_NUMBER() OVER (PARTITION BY s.MstrTCN ORDER BY s.knklmNo DESC) AS rn
        FROM src s
      )
      SELECT 
        r.MstrTCN,
        r.MstrHspTip,
        r.MstrFirma,
        r.MstrAdi,
        r.MstrTelNo,
        r.KnklmOdaTip,
        r.KnklmOdaNo,
        r.KnklmYtkNo,
        r.KnklmTip,
        r.KnklmGrsTrh,
        r.KnklmPlnTrh,
        r.KnklmLfyt,
        r.Knklmisk,
        r.KnklmNfyt,
        r.KnklmNot,
        r.knklmNo,
        CASE 
          WHEN TRY_CONVERT(date, r.KnklmCksTrh, 104) = CONVERT(date, GETDATE(), 104) THEN 'bugun-cikan'
          WHEN r.KnklmCksTrh IS NULL AND TRY_CONVERT(date, r.KnklmPlnTrh, 104) <= CONVERT(date, GETDATE(), 104) THEN 'suresi-dolan'
          WHEN r.KnklmCksTrh IS NULL THEN 'toplam-aktif'
          WHEN r.KnklmNot LIKE 'Yeni Müşteri%' THEN 'yeni-musteri'
          WHEN r.KnklmNot LIKE 'Yeni Giriş%' THEN 'yeni-giris'
          ELSE 'toplam-aktif'
        END AS targetKart
      FROM ranked r
      WHERE r.rn = 1
      ORDER BY 
        TRY_CONVERT(date, r.KnklmPlnTrh, 104) ASC,
        r.KnklmTip DESC,
        TRY_CONVERT(date, r.KnklmGrsTrh, 104) DESC
      OFFSET @1 ROWS FETCH NEXT @2 ROWS ONLY
    `;

    try {
      const countRes = await this.musteriRepository.query(countSql, [q]);
      const total = Number(countRes?.[0]?.total || 0);

      const data: (MusteriKonaklamaData & { targetKart: string })[] = await this.musteriRepository.query(
        dataSql,
        [q, offset, pageSize]
      );

      return { data, total, page: Math.max(1, page), limit: pageSize };
    } catch (error) {
      console.error('searchMusteriKonaklama hatası:', error);
      throw new Error('Global arama başarısız');
    }
  }

  // sp_bOdGunMusteriListeY stored procedure'ünü çağır
  async getMusteriListesi(knklmTipi: string = 'TÜMÜ'): Promise<MusteriKonaklamaData[]> {
    try {
      this.debugLog('=== getMusteriListesi called ===');
      this.debugLog('knklmTipi:', knklmTipi);

      // Direkt view'dan sorgulayalım (SP'de tarih filtresi çok kısıtlayıcı)
      this.debugLog('View sorgusu kullanılacak');
      return await this.getMusteriKonaklamaView(knklmTipi);
    } catch (error) {
      console.error('getMusteriListesi hatası:', error);
      throw new Error('Müşteri listesi alınamadı');
    }
  }

  // v_MusteriKonaklama view'ından sorgulama (TOPLAM AKTİF MÜŞTERİLER - süresi dolmayan aktif müşteriler)
  async getMusteriKonaklamaView(knklmTipi?: string): Promise<MusteriKonaklamaData[]> {
    try {
      const views = this.dbConfig.getViews();
      const tables = this.dbConfig.getTables();
      let query = `
        SELECT 
          v.MstrTCN, 
          ISNULL(m.MstrHspTip, 'Bireysel') as MstrHspTip,
          v.MstrFirma, 
          v.MstrAdi, 
          v.MstrTelNo, 
          v.KnklmOdaTip, 
          v.KnklmOdaNo, 
          v.KnklmYtkNo, 
          v.KnklmTip, 
          v.KnklmNfyt, 
          v.KnklmGrsTrh, 
          v.KnklmPlnTrh, 
          v.KnklmNot 
        FROM ${views.musteriKonaklama} v
        LEFT JOIN ${tables.musteri} m ON v.MstrTCN = m.MstrTCN
        WHERE v.MstrDurum = 'KALIYOR' 
          AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
          AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
          AND CONVERT(Date, v.KnklmGrsTrh, 104) < GETDATE()
          AND CONVERT(Date, v.KnklmPlnTrh, 104) > GETDATE()
      `;

      const parameters: string[] = [];
      
      if (knklmTipi && knklmTipi !== 'TÜMÜ') {
        query += ` AND v.KnklmTip = @0`;
        parameters.push(knklmTipi);
      }

      query += ` ORDER BY CONVERT(Date, v.KnklmPlnTrh, 104), v.KnklmTip DESC, CONVERT(Date, v.KnklmGrsTrh, 104) DESC`;

      const result: MusteriKonaklamaData[] = await this.musteriRepository.query(query, parameters);
      this.debugLog('View sorgusu sonucu:', result.length, 'kayıt bulundu');
      this.debugLog('Executed query:', query);
      this.debugLog('Parameters:', parameters);
      
      return result;
    } catch (error) {
      console.error('getMusteriKonaklamaView hatası:', error);
      throw new Error('View sorgusu başarısız');
    }
  }

  // Konaklama tiplerini getir
  async getKonaklamaTipleri(): Promise<string[]> {
    try {
      const views = this.dbConfig.getViews();
      const query = `
        SELECT DISTINCT KnklmTip 
        FROM ${views.musteriKonaklama} 
        WHERE KnklmTip IS NOT NULL 
          AND KnklmTip != ''
          AND MstrDurum = 'KALIYOR'
        ORDER BY KnklmTip
      `;
      const result: any[] = await this.musteriRepository.query(query);
      const tipler = result.map((item: any) => (item as { KnklmTip: string }).KnklmTip);
      return ['TÜMÜ', ...tipler];
    } catch (error) {
      console.error('getKonaklamaTipleri hatası:', error);
      return ['TÜMÜ', 'GÜNLÜK', 'HAFTALIK', 'AYLIK'];
    }
  }

  // Oda tiplerini getir
  async getOdaTipleri(): Promise<string[]> {
    try {
      const views = this.dbConfig.getViews();
      const query = `
        SELECT DISTINCT KnklmOdaTip 
        FROM ${views.musteriKonaklama} 
        WHERE KnklmOdaTip IS NOT NULL 
          AND KnklmOdaTip != ''
          AND MstrDurum = 'KALIYOR'
        ORDER BY KnklmOdaTip
      `;
      const result: any[] = await this.musteriRepository.query(query);
      const tipler = result.map((item: any) => (item as { KnklmOdaTip: string }).KnklmOdaTip);
      return ['TÜMÜ', ...tipler];
    } catch (error) {
      console.error('getOdaTipleri hatası:', error);
      return ['TÜMÜ', 'STANDART', 'DELUXE', 'SUIT'];
    }
  }

  // 🔥 KOORDİNELİ ÇALIŞMA: Seçili konaklama tipine göre uygun oda tiplerini getir
  async getOdaTipleriByKonaklama(konaklamaTip: string, kartTip: string = 'toplam-aktif'): Promise<string[]> {
    try {
      
      // Seçili karta göre müşteri listesini al
      let musteriListesi: MusteriKonaklamaData[] = [];
      
      switch (kartTip) {
        case 'toplam-aktif':
          musteriListesi = await this.getToplamAktifMusteri('TÜMÜ', 'TÜMÜ');
          break;
        case 'suresi-dolan':
          musteriListesi = await this.getSuresiDolanMusteri('TÜMÜ');
          break;
        case 'bugun-cikan':
          musteriListesi = await this.getBugunCikanMusteri('TÜMÜ');
          break;
        case 'yeni-musteri':
          musteriListesi = await this.getYeniMusteri('TÜMÜ');
          break;
        case 'yeni-giris':
          musteriListesi = await this.getYeniGiris('TÜMÜ');
          break;
        case 'cikis-yapanlar':
          musteriListesi = await this.getCikisYapanlarListesi('TÜMÜ');
          break;
        default:
          musteriListesi = await this.getToplamAktifMusteri('TÜMÜ', 'TÜMÜ');
      }
      
      // Müşteri listesinden konaklama tipine göre filtreleme yap
      let filteredList = musteriListesi;
      if (konaklamaTip && konaklamaTip !== 'TÜMÜ') {
        filteredList = musteriListesi.filter(m => m.KnklmTip === konaklamaTip);
      }
      
      // Filtrelenmiş listeden distinct oda tiplerini çıkar
      const odaTipleri = [...new Set(filteredList.map(m => m.KnklmOdaTip))].filter(tip => tip && tip.trim() !== '');
      
      const finalResult = ['TÜMÜ', ...odaTipleri.sort()];
      
      return finalResult;
    } catch (error) {
      console.error('getOdaTipleriByKonaklama hatası:', error);
      return ['TÜMÜ', 'STANDART', 'DELUXE', 'SUIT'];
    }
  }

  // 🔥 KOORDİNELİ ÇALIŞMA: Seçili oda tipine göre uygun konaklama tiplerini getir
  async getKonaklamaTipleriByOda(odaTip: string, kartTip: string = 'toplam-aktif'): Promise<string[]> {
    try {
      // 🔥 URL DECODING: Sadece gerçekten URL encoding'den gelen + karakterlerini boşluk yap
      // Eğer odaTip'te + karakteri varsa ve bu gerçek bir oda tipi ise, URL encoding yapma
      const decodedOdaTip = odaTip;
      
      // Seçili karta göre müşteri listesini al
      let musteriListesi: MusteriKonaklamaData[] = [];
      
      switch (kartTip) {
        case 'toplam-aktif':
          musteriListesi = await this.getToplamAktifMusteri('TÜMÜ', 'TÜMÜ');
          break;
        case 'suresi-dolan':
          musteriListesi = await this.getSuresiDolanMusteri('TÜMÜ');
          break;
        case 'bugun-cikan':
          musteriListesi = await this.getBugunCikanMusteri('TÜMÜ');
          break;
        case 'yeni-musteri':
          musteriListesi = await this.getYeniMusteri('TÜMÜ');
          break;
        case 'yeni-giris':
          musteriListesi = await this.getYeniGiris('TÜMÜ');
          break;
        case 'cikis-yapanlar':
          musteriListesi = await this.getCikisYapanlarListesi('TÜMÜ');
          break;
        default:
          musteriListesi = await this.getToplamAktifMusteri('TÜMÜ', 'TÜMÜ');
      }
      
      // Müşteri listesinden oda tipine göre filtreleme yap (decoded oda tipini kullan)
      let filteredList = musteriListesi;
      if (decodedOdaTip && decodedOdaTip !== 'TÜMÜ') {
        filteredList = musteriListesi.filter(m => m.KnklmOdaTip === decodedOdaTip);
      }
      
      // Filtrelenmiş listeden distinct konaklama tiplerini çıkar
      const konaklamaTipleri = [...new Set(filteredList.map(m => m.KnklmTip))].filter(tip => tip && tip.trim() !== '');
      
      const finalResult = ['TÜMÜ', ...konaklamaTipleri.sort()];
      
      return finalResult;
    } catch (error) {
      console.error('getKonaklamaTipleriByOda hatası:', error);
      return ['TÜMÜ', 'GÜNLÜK', 'HAFTALIK', 'AYLIK'];
    }
  }

  // 🔥 DİNAMİK LİSTE: Seçili kartın müşteri listesinden konaklama tiplerini getir
  async getDinamikKonaklamaTipleri(kartTip: string): Promise<string[]> {
    try {
      let musteriListesi: MusteriKonaklamaData[] = [];
      
      // Seçili karta göre müşteri listesini al
      switch (kartTip) {
        case 'toplam-aktif':
          musteriListesi = await this.getToplamAktifMusteri('TÜMÜ', 'TÜMÜ');
          break;
        case 'suresi-dolan':
          musteriListesi = await this.getSuresiDolanMusteri('TÜMÜ');
          break;
        case 'bugun-cikan':
          musteriListesi = await this.getBugunCikanMusteri('TÜMÜ');
          break;
        case 'yeni-musteri':
          musteriListesi = await this.getYeniMusteri('TÜMÜ');
          break;
        case 'yeni-giris':
          musteriListesi = await this.getYeniGiris('TÜMÜ');
          break;
        case 'cikis-yapanlar':
          musteriListesi = await this.getCikisYapanlarListesi('TÜMÜ');
          break;
        default:
          musteriListesi = await this.getToplamAktifMusteri('TÜMÜ', 'TÜMÜ');
      }
      
      // Müşteri listesinden distinct konaklama tiplerini çıkar
      const konaklamaTipleri = [...new Set(musteriListesi.map(m => m.KnklmTip))].filter(tip => tip && tip.trim() !== '');
      
      return ['TÜMÜ', ...konaklamaTipleri.sort()];
    } catch (error) {
      console.error('getDinamikKonaklamaTipleri hatası:', error);
      return ['TÜMÜ', 'GÜNLÜK', 'HAFTALIK', 'AYLIK'];
    }
  }

  // 🔥 DİNAMİK LİSTE: Seçili kartın müşteri listesinden oda tiplerini getir
  async getDinamikOdaTipleri(kartTip: string): Promise<string[]> {
    try {
      let musteriListesi: MusteriKonaklamaData[] = [];
      
      // Seçili karta göre müşteri listesini al
      switch (kartTip) {
        case 'toplam-aktif':
          musteriListesi = await this.getToplamAktifMusteri('TÜMÜ', 'TÜMÜ');
          break;
        case 'suresi-dolan':
          musteriListesi = await this.getSuresiDolanMusteri('TÜMÜ');
          break;
        case 'bugun-cikan':
          musteriListesi = await this.getBugunCikanMusteri('TÜMÜ');
          break;
        case 'yeni-musteri':
          musteriListesi = await this.getYeniMusteri('TÜMÜ');
          break;
        case 'yeni-giris':
          musteriListesi = await this.getYeniGiris('TÜMÜ');
          break;
        case 'cikis-yapanlar':
          musteriListesi = await this.getCikisYapanlarListesi('TÜMÜ');
          break;
        default:
          musteriListesi = await this.getToplamAktifMusteri('TÜMÜ', 'TÜMÜ');
      }
      
      // Müşteri listesinden distinct oda tiplerini çıkar
      const odaTipleri = [...new Set(musteriListesi.map(m => m.KnklmOdaTip))].filter(tip => tip && tip.trim() !== '');
      
      return ['TÜMÜ', ...odaTipleri.sort()];
    } catch (error) {
      console.error('getDinamikOdaTipleri hatası:', error);
      return ['TÜMÜ', 'STANDART', 'DELUXE', 'SUIT'];
    }
  }

  // Dashboard istatistikleri (SP mantığı ile uyumlu) - OPTIMIZED VERSION
  async getDashboardStats(): Promise<any> {
    try {
      // Cache kontrolü - devre dışı
      // const now = Date.now();
      // if (this.statsCache && (now - this.statsCache.timestamp) < this.CACHE_DURATION) {
      //   console.log('Stats cache hit - returning cached data');
      //   return this.statsCache.data;
      // }
      
      // console.log('Stats cache miss - fetching fresh data');
      
      const views = this.dbConfig.getViews();
      const tables = this.dbConfig.getTables();
      
      // 🔥 TEK SORGU OPTİMİZASYONU: Tüm istatistikleri tek CTE ile hesapla
      const unifiedStatsQuery = `
        WITH AktifKonaklamalar AS (
          -- Ana aktif konaklama verileri
          SELECT 
            v.MstrTCN,
            v.MstrAdi,
            v.KnklmTip,
            v.KnklmNfyt,
            v.KnklmGrsTrh,
            v.KnklmPlnTrh,
            v.KnklmNot,
            v.knklmNo,
            ROW_NUMBER() OVER (PARTITION BY v.MstrTCN ORDER BY v.knklmNo DESC) as rn
          FROM ${views.musteriKonaklama} v
          WHERE v.MstrDurum = 'KALIYOR' 
            AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
            AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
        ),
        ToplamAktifStats AS (
          -- Toplam aktif konaklama istatistikleri
          SELECT 
            COUNT(*) as ToplamAktifKonaklama,
            SUM(CASE WHEN KnklmTip = 'GÜNLÜK' THEN 1 ELSE 0 END) as GunlukKonaklama,
            SUM(CASE WHEN KnklmTip = 'HAFTALIK' THEN 1 ELSE 0 END) as HaftalikKonaklama,
            SUM(CASE WHEN KnklmTip = 'AYLIK' THEN 1 ELSE 0 END) as AylikKonaklama,
            SUM(KnklmNfyt) as ToplamGelir,
            AVG(KnklmNfyt) as OrtalamaGelir
          FROM AktifKonaklamalar
          WHERE CONVERT(Date, KnklmPlnTrh, 104) > CONVERT(Date, GETDATE(), 104)
            AND KnklmNot NOT LIKE '%- Yeni Müşteri:%'
            AND KnklmNot NOT LIKE '%- Yeni Giriş:%'
            AND rn = 1
        ),
        YeniMusteriStats AS (
          -- Yeni müşteri istatistikleri
          SELECT COUNT(*) as YeniMusteriKonaklama
          FROM AktifKonaklamalar
          WHERE CONVERT(Date, KnklmGrsTrh, 104) = CONVERT(Date, GETDATE(), 104)
            AND KnklmNot LIKE '%- Yeni Müşteri:%'
            AND rn = 1
        ),
        YeniGirisStats AS (
          -- Yeni giriş istatistikleri
          SELECT COUNT(*) as YeniGirisKonaklama
          FROM AktifKonaklamalar
          WHERE CONVERT(Date, KnklmGrsTrh, 104) = CONVERT(Date, GETDATE(), 104)
            AND KnklmNot LIKE '%- Yeni Giriş:%'
            AND rn = 1
        ),
        DevamEdenStats AS (
          -- Devam eden konaklama istatistikleri
          SELECT COUNT(*) as DevamEdenKonaklama
          FROM AktifKonaklamalar
          WHERE CONVERT(Date, KnklmPlnTrh, 104) > CONVERT(Date, GETDATE(), 104)
            AND KnklmNot NOT LIKE '%- Yeni Müşteri:%'
            AND KnklmNot NOT LIKE '%- Yeni Giriş:%'
            AND NOT (CONVERT(Date, KnklmGrsTrh, 104) = CONVERT(Date, GETDATE(), 104) AND KnklmNot LIKE '%- Yeni Müşteri:%')
            AND NOT (CONVERT(Date, KnklmGrsTrh, 104) = CONVERT(Date, GETDATE(), 104) AND KnklmNot LIKE '%- Yeni Giriş:%')
            AND rn = 1
        ),
        SuresiDolanStats AS (
          -- Süresi dolan konaklama istatistikleri (grid tablo ile uyumlu)
          SELECT COUNT(*) as SuresiGecentKonaklama
          FROM ${views.musteriKonaklama} v
          WHERE v.MstrDurum = 'KALIYOR' 
            AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
            AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
            AND CONVERT(Date, v.KnklmPlnTrh, 104) <= CONVERT(Date, GETDATE(), 104)
            AND v.knklmNo = (
              SELECT MAX(v2.knklmNo) 
              FROM ${views.musteriKonaklama} v2 
              WHERE v2.MstrTCN = v.MstrTCN
                AND v2.MstrDurum = 'KALIYOR'
                AND LEFT(v2.MstrAdi, 9) <> 'PERSONEL '
            )
        ),
        BugunCikanStats AS (
          -- Bugün çıkan müşteri istatistikleri
          SELECT COUNT(*) as BugünCikanKonaklama
          FROM ${tables.konaklama} k
          INNER JOIN ${tables.musteri} m ON k.knklmMstrNo = m.MstrNo
          WHERE CONVERT(Date, k.knklmCksTrh, 104) = CONVERT(Date, GETDATE(), 104)
            AND LEFT(m.MstrAdi, 9) <> 'PERSONEL '
            AND k.knklmNo = (
              SELECT MAX(k2.knklmNo) 
              FROM ${tables.konaklama} k2 
              WHERE k2.knklmMstrNo = k.knklmMstrNo
            )
        ),
        MusteriBakiyeleri AS (
          -- Müşteri bakiye hesaplamaları (yeni mantık)
          SELECT 
            islemCrKod,
            SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') AND islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%' THEN islemTutar 
			 WHEN islemTip IN ('GİDER', 'Giren') AND islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%' THEN -islemTutar ELSE 0 END) as MusteriBakiye,
            SUM(CASE WHEN islemTip = 'Giren' AND islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' THEN islemTutar WHEN islemTip = 'Çıkan' AND islemBilgi LIKE '%=DEPOZİTO İADESİ=%' THEN -islemTutar ELSE 0 END) as DepozitoBakiye
          FROM ${tables.islem}
          WHERE islemCrKod LIKE 'M%'
          GROUP BY islemCrKod
        ),
        BorcluAlacakliStats AS (
          -- Borçlu ve alacaklı müşteri istatistikleri (yeni mantık)
          SELECT 
            COUNT(CASE WHEN mb.MusteriBakiye > 0 THEN 1 END) as BorcluMusteriSayisi,
            COUNT(CASE WHEN mb.MusteriBakiye < 0 THEN 1 END) as AlacakliMusteriSayisi,
            COUNT(CASE WHEN mb.MusteriBakiye = 0 AND mb.DepozitoBakiye = 0 THEN 1 END) as BakiyesizHesaplarSayisi
          FROM ${tables.cari} c
          INNER JOIN MusteriBakiyeleri mb ON c.CariKod = mb.islemCrKod
          WHERE left(c.CariKod,1)='M'
        )
        SELECT 
          tas.ToplamAktifKonaklama,
          tas.GunlukKonaklama,
          tas.HaftalikKonaklama,
          tas.AylikKonaklama,
          tas.ToplamGelir,
          tas.OrtalamaGelir,
          yms.YeniMusteriKonaklama,
          ygs.YeniGirisKonaklama,
          des.DevamEdenKonaklama,
          bcs.BugünCikanKonaklama,
          bas.BorcluMusteriSayisi,
          bas.AlacakliMusteriSayisi,
          bas.BakiyesizHesaplarSayisi,
          sds.SuresiGecentKonaklama
        FROM ToplamAktifStats tas
        CROSS JOIN YeniMusteriStats yms
        CROSS JOIN YeniGirisStats ygs
        CROSS JOIN DevamEdenStats des
        CROSS JOIN BugunCikanStats bcs
        CROSS JOIN BorcluAlacakliStats bas
        CROSS JOIN SuresiDolanStats sds
      `;
      
      const resultUnknown = (await this.musteriRepository.query(unifiedStatsQuery)) as unknown;
      const result = resultUnknown as UnifiedStatsRow[];
      

      
      // Cache'e kaydet - devre dışı
      // this.statsCache = { data: result[0], timestamp: Date.now() };
      
      const row = result[0];
      return row;
    } catch (error) {
      console.error('getDashboardStats hatası:', error);
      return {};
    }
  }

  // Oda doluluk durumu
  async getOdaDolulukDurumu(): Promise<any[]> {
    try {
      const views = this.dbConfig.getViews();
      const query = `
        SELECT 
          KnklmOdaTip,
          COUNT(*) as DoluOdaSayisi,
          COUNT(CASE WHEN CONVERT(Date, KnklmPlnTrh, 104) <= GETDATE() THEN 1 END) as SuresiGecentOda
        FROM ${views.musteriKonaklama} 
        WHERE MstrDurum = 'KALIYOR' 
          AND KnklmCksTrh = ''
        GROUP BY KnklmOdaTip
        ORDER BY KnklmOdaTip
      `;
      
      const resultUnknown = (await this.musteriRepository.query(query)) as unknown;
      const result = resultUnknown as Array<{
        KnklmOdaTip: string;
        DoluOdaSayisi: number | string | null;
        SuresiGecentOda: number | string | null;
      }>;
      return result;
    } catch (error) {
      console.error('getOdaDolulukDurumu hatası:', error);
      return [];
    }
  }

  // Toplam Aktif - konaklama yapan tüm müşterilerin listesi (süresi dolmayanlar)
  // 🔥 CTE OPTİMİZASYONU: Stats ile uyumlu CTE kullanımı
  async getToplamAktifMusteri(knklmTipi: string = 'TÜMÜ', odaTipi: string = 'TÜMÜ'): Promise<MusteriKonaklamaData[]> {
    try {
      const views = this.dbConfig.getViews();
      const tables = this.dbConfig.getTables();
      
      // 🔥 DEBUG: Stats sorgusu ile aynı mantığı kullan
      let query = `
        WITH AktifKonaklamalar AS (
          -- Ana aktif konaklama verileri (stats ile uyumlu)
          SELECT 
            v.MstrTCN,
            v.MstrAdi,
            v.KnklmTip,
            v.KnklmNfyt,
            v.KnklmGrsTrh,
            v.KnklmPlnTrh,
            v.KnklmNot,
            v.knklmNo,
            v.MstrFirma,
            v.MstrTelNo,
            v.KnklmOdaTip,
            v.KnklmOdaNo,
            v.KnklmYtkNo,
            ROW_NUMBER() OVER (PARTITION BY v.MstrTCN ORDER BY v.knklmNo DESC) as rn
          FROM ${views.musteriKonaklama} v
          WHERE v.MstrDurum = 'KALIYOR' 
            AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
            AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
        )
        SELECT 
          ak.MstrTCN, 
          ISNULL(m.MstrHspTip, 'Bireysel') as MstrHspTip,
          ak.MstrFirma, 
          ak.MstrAdi, 
          ak.MstrTelNo, 
          ak.KnklmOdaTip, 
          ak.KnklmOdaNo, 
          ak.KnklmYtkNo, 
          ak.KnklmTip, 
          ak.KnklmNfyt, 
          ak.KnklmGrsTrh, 
          ak.KnklmPlnTrh, 
          ak.KnklmNot,
          ISNULL(k.KnklmKrLst, '') as KnklmKrLst
        FROM AktifKonaklamalar ak
        LEFT JOIN ${tables.musteri} m ON ak.MstrTCN = m.MstrTCN
        LEFT JOIN ${tables.konaklama} k ON ak.knklmNo = k.knklmNo
        WHERE ak.rn = 1
          AND CONVERT(Date, ak.KnklmPlnTrh, 104) > CONVERT(Date, GETDATE(), 104)
          AND ak.KnklmNot NOT LIKE '%- Yeni Müşteri:%'
          AND ak.KnklmNot NOT LIKE '%- Yeni Giriş:%'
          AND NOT (CONVERT(Date, ak.KnklmGrsTrh, 104) = CONVERT(Date, GETDATE(), 104) AND ak.KnklmNot LIKE '%- Yeni Müşteri:%')
          AND NOT (CONVERT(Date, ak.KnklmGrsTrh, 104) = CONVERT(Date, GETDATE(), 104) AND ak.KnklmNot LIKE '%- Yeni Giriş:%')
      `;

      const parameters: string[] = [];
      let paramIndex = 0;
      
      if (knklmTipi && knklmTipi !== 'TÜMÜ') {
        query += ` AND ak.KnklmTip = @${paramIndex}`;
        parameters.push(knklmTipi);
        paramIndex++;
      }

      if (odaTipi && odaTipi !== 'TÜMÜ') {
        query += ` AND ak.KnklmOdaTip = @${paramIndex}`;
        parameters.push(odaTipi);
        paramIndex++;
      }

      query += ` ORDER BY CONVERT(Date, ak.KnklmPlnTrh, 104), ak.KnklmTip DESC, CONVERT(Date, ak.KnklmGrsTrh, 104) DESC`;

      const result: MusteriKonaklamaData[] = await this.musteriRepository.query(query, parameters);
      
      return result;
    } catch (error) {
      console.error('getToplamAktifMusteri hatası:', error);
      throw new Error('Toplam aktif müşteri listesi alınamadı');
    }
  }

  // Süresi Dolan - knklmPlnTrh değeri bugün ve bugünden eski, knklmCksTrh boş olan müşteriler
  // 🔥 CTE OPTİMİZASYONU: Stats ile uyumlu CTE kullanımı
  async getSuresiDolanMusteri(knklmTipi: string = 'TÜMÜ'): Promise<MusteriKonaklamaData[]> {
    try {
      const views = this.dbConfig.getViews();
      const tables = this.dbConfig.getTables();
      let query = `
        WITH AktifKonaklamalar AS (
          -- Ana aktif konaklama verileri (stats ile uyumlu)
          SELECT 
            v.MstrTCN,
            v.MstrAdi,
            v.KnklmTip,
            v.KnklmNfyt,
            v.KnklmGrsTrh,
            v.KnklmPlnTrh,
            v.KnklmNot,
            v.knklmNo,
            v.MstrFirma,
            v.MstrTelNo,
            v.KnklmOdaTip,
            v.KnklmOdaNo,
            v.KnklmYtkNo,
            ROW_NUMBER() OVER (PARTITION BY v.MstrTCN ORDER BY v.knklmNo DESC) as rn
          FROM ${views.musteriKonaklama} v
          WHERE v.MstrDurum = 'KALIYOR' 
            AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
            AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
        )
        SELECT 
          ak.MstrTCN, 
          ISNULL(m.MstrHspTip, 'Bireysel') as MstrHspTip,
          ak.MstrFirma, 
          ak.MstrAdi, 
          ak.MstrTelNo, 
          ak.KnklmOdaTip, 
          ak.KnklmOdaNo, 
          ak.KnklmYtkNo, 
          ak.KnklmTip, 
          ak.KnklmNfyt, 
          ak.KnklmGrsTrh, 
          ak.KnklmPlnTrh, 
          ak.KnklmNot,
          ISNULL(k.KnklmKrLst, '') as KnklmKrLst
        FROM AktifKonaklamalar ak
        LEFT JOIN ${tables.musteri} m ON ak.MstrTCN = m.MstrTCN
        LEFT JOIN ${tables.konaklama} k ON ak.knklmNo = k.knklmNo
        WHERE ak.rn = 1
          AND CONVERT(Date, ak.KnklmPlnTrh, 104) <= CONVERT(Date, GETDATE(), 104)
      `;

      const parameters: string[] = [];
      
      if (knklmTipi && knklmTipi !== 'TÜMÜ') {
        query += ` AND ak.KnklmTip = @0`;
        parameters.push(knklmTipi);
      }

      query += ` ORDER BY CONVERT(Date, ak.KnklmPlnTrh, 104), ak.KnklmTip DESC, CONVERT(Date, ak.KnklmGrsTrh, 104) DESC`;

      const result: MusteriKonaklamaData[] = await this.musteriRepository.query(query, parameters);

      return result;
    } catch (error) {
      console.error('getSuresiDolanMusteri hatası:', error);
      throw new Error('Süresi dolan müşteri listesi alınamadı');
    }
  }

  // Bugün Çıkan - knklmCksTrh bugün olan ve o müşterinin en son konaklama kaydı olan müşteriler
  async getBugunCikanMusteri(knklmTipi: string = 'TÜMÜ'): Promise<MusteriKonaklamaData[]> {
    try {
      const tables = this.dbConfig.getTables();
      let query = `
        SELECT 
          m.MstrTCN,
          ISNULL(m.MstrHspTip, 'Bireysel') as MstrHspTip,
          m.MstrFirma, 
          m.MstrAdi, 
          m.MstrTelNo, 
          k.knklmOdaTip as KnklmOdaTip, 
          k.knklmOdaNo as KnklmOdaNo, 
          k.knklmYtkNo as KnklmYtkNo, 
          k.knklmTip as KnklmTip, 
          k.knklmNfyt as KnklmNfyt, 
          k.knklmGrsTrh as KnklmGrsTrh, 
          k.knklmPlnTrh as KnklmPlnTrh, 
          k.knklmCksTrh as KnklmCksTrh,
          k.knklmNot as KnklmNot,
          ISNULL(k.knklmKrLst, '') as KnklmKrLst
        FROM ${tables.konaklama} k
        INNER JOIN ${tables.musteri} m ON k.knklmMstrNo = m.MstrNo
        WHERE CONVERT(Date, k.knklmCksTrh, 104) = CONVERT(Date, GETDATE(), 104)
          AND LEFT(m.MstrAdi, 9) <> 'PERSONEL '
          AND k.knklmNo = (
            SELECT MAX(k2.knklmNo) 
            FROM ${tables.konaklama} k2 
            WHERE k2.knklmMstrNo = k.knklmMstrNo
          )
      `;

      const parameters: string[] = [];
      
      if (knklmTipi && knklmTipi !== 'TÜMÜ') {
        query += ` AND k.knklmTip = @0`;
        parameters.push(knklmTipi);
      }

      query += ` ORDER BY CONVERT(Date, k.knklmCksTrh, 104), k.knklmTip DESC, CONVERT(Date, k.knklmGrsTrh, 104) DESC`;

      const result: MusteriKonaklamaData[] = await this.musteriRepository.query(query, parameters);
      this.debugLog('getBugunCikanMusteri sonucu:', result.length, 'kayıt bulundu');
      return result;
    } catch (error) {
      console.error('getBugunCikanMusteri hatası:', error);
      throw new Error('Bugün çıkan müşteri listesi alınamadı');
    }
  }

  // Bugün Giren - knklmGrsTrh bugün olup knklmNot "Yeni Müşteri:" ile başlayan müşteriler
  // 🔥 YENİ MÜŞTERİ - Bugün giren ve KnklmNot "Yeni Müşteri" ile başlayan kayıtlar
  // 🔥 CTE OPTİMİZASYONU: Stats ile uyumlu CTE kullanımı
  async getYeniMusteri(knklmTipi: string = 'TÜMÜ'): Promise<MusteriKonaklamaData[]> {
    try {
      const views = this.dbConfig.getViews();
      const tables = this.dbConfig.getTables();

      let query = `
        WITH AktifKonaklamalar AS (
          -- Ana aktif konaklama verileri (stats ile uyumlu)
          SELECT 
            v.MstrTCN,
            v.MstrAdi,
            v.KnklmTip,
            v.KnklmNfyt,
            v.KnklmGrsTrh,
            v.KnklmPlnTrh,
            v.KnklmNot,
            v.knklmNo,
            v.MstrFirma,
            v.MstrTelNo,
            v.KnklmOdaTip,
            v.KnklmOdaNo,
            v.KnklmYtkNo,
            ROW_NUMBER() OVER (PARTITION BY v.MstrTCN ORDER BY v.knklmNo DESC) as rn
          FROM ${views.musteriKonaklama} v
          WHERE v.MstrDurum = 'KALIYOR' 
            AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
            AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
        )
        SELECT 
          ak.MstrTCN, 
          ISNULL(m.MstrHspTip, 'Bireysel') as MstrHspTip,
          ak.MstrFirma, 
          ak.MstrAdi, 
          ak.MstrTelNo, 
          ak.KnklmOdaTip, 
          ak.KnklmOdaNo, 
          ak.KnklmYtkNo, 
          ak.KnklmTip, 
          ak.KnklmNfyt, 
          ak.KnklmGrsTrh, 
          ak.KnklmPlnTrh, 
          ak.KnklmNot,
          ISNULL(k.KnklmKrLst, '') as KnklmKrLst
        FROM AktifKonaklamalar ak
        LEFT JOIN ${tables.musteri} m ON ak.MstrTCN = m.MstrTCN
        LEFT JOIN ${tables.konaklama} k ON ak.knklmNo = k.knklmNo
        WHERE ak.rn = 1
          AND CONVERT(Date, ak.KnklmGrsTrh, 104) = CONVERT(Date, GETDATE(), 104)
          AND ak.KnklmNot LIKE '%- Yeni Müşteri:%'
      `;

      const parameters: string[] = [];
      
      if (knklmTipi && knklmTipi !== 'TÜMÜ') {
        query += ` AND ak.KnklmTip = @0`;
        parameters.push(knklmTipi);
      }

      query += ` ORDER BY CONVERT(Date, ak.KnklmPlnTrh, 104), ak.KnklmTip DESC, CONVERT(Date, ak.KnklmGrsTrh, 104) DESC`;

      const result: MusteriKonaklamaData[] = await this.musteriRepository.query(query, parameters);
      
      return result;
    } catch (error) {
      console.error('getYeniMusteri hatası:', error);
      throw new Error('Yeni müşteri listesi alınamadı');
    }
  }

  // 🔥 YENİ GİRİŞ - Bugün giren ve KnklmNot "Yeni Giriş" ile başlayan kayıtlar  
  // 🔥 CTE OPTİMİZASYONU: Stats ile uyumlu CTE kullanımı
  async getYeniGiris(knklmTipi: string = 'TÜMÜ'): Promise<MusteriKonaklamaData[]> {
    try {
      const views = this.dbConfig.getViews();
      const tables = this.dbConfig.getTables();

      let query = `
        WITH AktifKonaklamalar AS (
          -- Ana aktif konaklama verileri (stats ile uyumlu)
          SELECT 
            v.MstrTCN,
            v.MstrAdi,
            v.KnklmTip,
            v.KnklmNfyt,
            v.KnklmGrsTrh,
            v.KnklmPlnTrh,
            v.KnklmNot,
            v.knklmNo,
            v.MstrFirma,
            v.MstrTelNo,
            v.KnklmOdaTip,
            v.KnklmOdaNo,
            v.KnklmYtkNo,
            ROW_NUMBER() OVER (PARTITION BY v.MstrTCN ORDER BY v.knklmNo DESC) as rn
          FROM ${views.musteriKonaklama} v
          WHERE v.MstrDurum = 'KALIYOR' 
            AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
            AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
        )
        SELECT 
          ak.MstrTCN, 
          ISNULL(m.MstrHspTip, 'Bireysel') as MstrHspTip,
          ak.MstrFirma, 
          ak.MstrAdi, 
          ak.MstrTelNo, 
          ak.KnklmOdaTip, 
          ak.KnklmOdaNo, 
          ak.KnklmYtkNo, 
          ak.KnklmTip, 
          ak.KnklmNfyt, 
          ak.KnklmGrsTrh, 
          ak.KnklmPlnTrh, 
          ak.KnklmNot,
          ISNULL(k.KnklmKrLst, '') as KnklmKrLst
        FROM AktifKonaklamalar ak
        LEFT JOIN ${tables.musteri} m ON ak.MstrTCN = m.MstrTCN
        LEFT JOIN ${tables.konaklama} k ON ak.knklmNo = k.knklmNo
        WHERE ak.rn = 1
          AND CONVERT(Date, ak.KnklmGrsTrh, 104) = CONVERT(Date, GETDATE(), 104)
          AND ak.KnklmNot LIKE '%- Yeni Giriş:%'
      `;

      const parameters: string[] = [];
      
      if (knklmTipi && knklmTipi !== 'TÜMÜ') {
        query += ` AND ak.KnklmTip = @0`;
        parameters.push(knklmTipi);
      }

      query += ` ORDER BY CONVERT(Date, ak.KnklmPlnTrh, 104), ak.KnklmTip DESC, CONVERT(Date, ak.KnklmGrsTrh, 104) DESC`;

      const result: MusteriKonaklamaData[] = await this.musteriRepository.query(query, parameters);
      
      return result;
    } catch (error) {
      console.error('getYeniGiris hatası:', error);
      throw new Error('Yeni giriş listesi alınamadı');
    }
  }

  // 📝 ESKİ FONKSİYON (Geriye uyumluluk için korundu) - Artık sadece Yeni + Yeni Giriş toplam sayısını verir
  async getBugunGirenMusteri(knklmTipi: string = 'TÜMÜ'): Promise<MusteriKonaklamaData[]> {
    try {
      const views = this.dbConfig.getViews();
      const tables = this.dbConfig.getTables();

      let query = `
        SELECT 
          v.MstrTCN, 
          ISNULL(m.MstrHspTip, 'Bireysel') as MstrHspTip,
          v.MstrFirma, 
          v.MstrAdi, 
          v.MstrTelNo, 
          v.KnklmOdaTip, 
          v.KnklmOdaNo, 
          v.KnklmYtkNo, 
          v.KnklmTip, 
          v.KnklmNfyt, 
          v.KnklmGrsTrh, 
          v.KnklmPlnTrh, 
          v.KnklmNot,
          ISNULL(k.KnklmKrLst, '') as KnklmKrLst
        FROM ${views.musteriKonaklama} v
        LEFT JOIN ${tables.musteri} m ON v.MstrTCN = m.MstrTCN
        LEFT JOIN ${tables.konaklama} k ON v.knklmNo = k.knklmNo
        WHERE v.MstrDurum = 'KALIYOR' 
          AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
          AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
          AND CONVERT(Date, v.KnklmGrsTrh, 104) = CONVERT(Date, GETDATE(), 104)
          AND (v.KnklmNot LIKE '%- Yeni Müşteri:%' OR v.KnklmNot LIKE '%- Yeni Giriş:%')
          AND v.KnklmNot NOT LIKE '%Dönem Yenileme:%'
      `;

      const parameters: string[] = [];
      
      if (knklmTipi && knklmTipi !== 'TÜMÜ') {
        query += ` AND v.KnklmTip = @0`;
        parameters.push(knklmTipi);
      }

      query += ` ORDER BY CONVERT(Date, v.KnklmPlnTrh, 104), v.KnklmTip DESC, CONVERT(Date, v.KnklmGrsTrh, 104) DESC`;

      const result: MusteriKonaklamaData[] = await this.musteriRepository.query(query, parameters);
      
      return result;
    } catch (error) {
      console.error('getBugunGirenMusteri hatası:', error);
      throw new Error('Bugün giren müşteri listesi alınamadı');
    }
  }

  // Borçlu Müşteriler - tblCari bilgileri ve hesaplanan borç tutarları
  async getBorcluMusteriler(page: number = 1, limit: number = 100): Promise<{ data: BorcluMusteriRow[]; total: number; page: number; limit: number }> {
    try {
      const tables = this.dbConfig.getTables();
      const views = this.dbConfig.getViews();
      const offset = (page - 1) * limit;
      const usePagination = limit < 1000;
      
      // 🔥 Optimize edilmiş sorgu - CTE kullanarak tek seferde bakiye hesaplama
      const query = `
        WITH MusteriBakiyeleri AS (
          SELECT 
            islemCrKod,
            SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) -
            SUM(CASE WHEN islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) as MusteriBakiye
          FROM ${tables.islem}
          WHERE left(islemCrKod,1) = 'M'
          GROUP BY islemCrKod
        ),
        BorcluMusteriler AS (
          SELECT c.CariKod
          FROM ${tables.cari} c
          INNER JOIN MusteriBakiyeleri mb ON c.CariKod = mb.islemCrKod
          WHERE left(c.CariKod,1)='M' AND mb.MusteriBakiye > 0
        ),
        SonKonaklamaBilgileri AS (
          SELECT 
            v.MstrTCN,
            v.MstrNo,
            v.KnklmCksTrh,
            v.KnklmPlnTrh,
            v.MstrDurum,
            ROW_NUMBER() OVER (PARTITION BY v.MstrTCN ORDER BY v.knklmNo DESC) as rn
          FROM ${views.musteriKonaklama} v
          WHERE v.MstrDurum IN ('KALIYOR', 'AYRILDI')
        )
        SELECT 
          c.cKytTarihi,
          c.CariKllnc,
          c.CariKod,
          c.CariAdi,
          c.CariVD,
          c.CariVTCN,
          c.CariYetkili,
          c.CariTelNo,
          ISNULL(m.MstrFirma, '') as MstrFirma,
          ISNULL(m.MstrHspTip, 'Bireysel') as MstrHspTip,
          mb.MusteriBakiye as BorcTutari,
          CASE 
            WHEN skb.KnklmCksTrh IS NOT NULL AND skb.KnklmCksTrh != '' THEN skb.KnklmCksTrh
            ELSE skb.KnklmPlnTrh
          END as CikisTarihi,
          skb.KnklmCksTrh,
          skb.KnklmPlnTrh,
          skb.MstrDurum
        FROM BorcluMusteriler bm
        INNER JOIN ${tables.cari} c ON bm.CariKod = c.CariKod
        INNER JOIN MusteriBakiyeleri mb ON c.CariKod = mb.islemCrKod
        LEFT JOIN ${tables.musteri} m ON (
          (c.CariKod LIKE 'MB%' AND m.MstrNo = CAST(SUBSTRING(c.CariKod, 3, LEN(c.CariKod) - 2) AS INT)) OR
          (c.CariKod LIKE 'MK%' AND m.MstrNo = CAST(SUBSTRING(c.CariKod, 3, LEN(c.CariKod) - 2) AS INT))
        )
        LEFT JOIN SonKonaklamaBilgileri skb ON (
          (skb.MstrTCN = m.MstrTCN AND m.MstrTCN IS NOT NULL AND skb.rn = 1) OR
          (skb.MstrNo = m.MstrNo AND m.MstrTCN IS NULL AND skb.rn = 1)
        )
        ORDER BY mb.MusteriBakiye DESC, CONVERT(Date, c.cKytTarihi, 104) DESC
        ${usePagination ? `OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY` : ''}
      `;
      
      const resultUnknown = (await this.musteriRepository.query(query)) as unknown;
      const result = resultUnknown as BorcluMusteriRow[];
      
      // Her müşteri için ödeme vadesi hesapla (sadece bu sayfadaki)
      for (const musteri of result) {
        const vade = await this.hesaplaOdemeVadesi(musteri.CariKod);
        musteri.odemeVadesi = vade;
      }
      
      // Ödeme vadesine göre küçükten büyüğe sırala, null/boş olanlar en sonda
      result.sort((a, b) => {
        const vA = a.odemeVadesi;
        const vB = b.odemeVadesi;
        if (!vA && !vB) return 0;
        if (!vA) return 1;
        if (!vB) return -1;
        const [gA, aA, yA] = vA.split('.').map(Number);
        const [gB, aB, yB] = vB.split('.').map(Number);
        const tA = new Date(yA, aA - 1, gA).getTime();
        const tB = new Date(yB, aB - 1, gB).getTime();
        return tA - tB;
      });
      
      // Toplam sayıyı ayrı hesapla (daha hızlı)
      const countQuery = `
        WITH MusteriBakiyeleri AS (
          SELECT 
            islemCrKod,
            SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) -
            SUM(CASE WHEN islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) as MusteriBakiye
          FROM ${tables.islem}
          WHERE left(islemCrKod,1) = 'M'
          GROUP BY islemCrKod
        )
        SELECT COUNT(*) as TotalCount
        FROM ${tables.cari} c
        INNER JOIN MusteriBakiyeleri mb ON c.CariKod = mb.islemCrKod
        WHERE left(c.CariKod,1)='M' AND mb.MusteriBakiye > 0
      `;
      
      const countResult: { TotalCount: number }[] = await this.musteriRepository.query(countQuery);
      const total = countResult[0]?.TotalCount || 0;
      
      return {
        data: result,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('getBorcluMusteriler hatası:', error);
      throw new Error('Borçlu müşteri listesi alınamadı');
    }
  }

  // 🔥 Bakiyesiz Hesaplar - hem bakiye hem de depozito bakiyesi 0 olan müşteriler
  async getBakiyesizHesaplar(page: number = 1, limit: number = 1000): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    try {
      const tables = this.dbConfig.getTables();
      const views = this.dbConfig.getViews();
      const offset = (page - 1) * limit;
      const usePagination = limit < 1000;
      
      // 🔥 Basit sıralama - eskiden yeniye tarih sıralaması
      const orderByClause = 'ORDER BY CONVERT(Date, c.cKytTarihi, 104) ASC, c.CariAdi ASC';
      
      // 🔥 Bakiyesiz Hesaplar - YENİ SORGU KODU
      const query = `
        WITH MusteriBakiyeleri AS (SELECT islemCrKod,
            SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') AND islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%' THEN islemTutar 
			 WHEN islemTip IN ('GİDER', 'Giren') AND islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%' THEN -islemTutar ELSE 0 END) as MusteriBakiye,
            SUM(CASE WHEN islemTip = 'Giren' AND islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' THEN islemTutar WHEN islemTip = 'Çıkan' AND islemBilgi LIKE '%=DEPOZİTO İADESİ=%' THEN -islemTutar ELSE 0 END) as DepozitoBakiye
            FROM ${tables.islem} WHERE islemCrKod LIKE 'M%' GROUP BY islemCrKod
            HAVING SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') AND islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%' THEN islemTutar 
					WHEN islemTip IN ('GİDER', 'Giren') AND islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%' THEN -islemTutar ELSE 0 END) = 0
					AND SUM(CASE WHEN islemTip = 'Giren' AND islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' THEN islemTutar WHEN islemTip = 'Çıkan' AND islemBilgi LIKE '%=DEPOZİTO İADESİ=%' THEN -islemTutar ELSE 0 END) = 0
        ),
        SonKonaklamaBilgileri AS (SELECT CariKod, CksPlnTrh
		FROM (SELECT IIF(v.MstrHspTip = 'BİREYSEL', 'MB', 'MK') + CAST(v.MstrNo AS NVARCHAR) as CariKod, COALESCE(NULLIF(v.KnklmCksTrh, ''), v.KnklmPlnTrh) as CksPlnTrh,
			ROW_NUMBER() OVER (PARTITION BY IIF(v.MstrHspTip = 'BİREYSEL', 'MB', 'MK') + CAST(v.MstrNo AS NVARCHAR) ORDER BY COALESCE(NULLIF(v.KnklmCksTrh, ''), v.KnklmPlnTrh) DESC) as rn
    FROM ${views.musteriKonaklama} v WHERE v.MstrHspTip IN ('BİREYSEL', 'KURUMSAL')) ranked WHERE rn = 1
        )
        SELECT c.cKytTarihi, c.CariKllnc, mb.islemCrKod as CariKod, c.CariAdi, c.CariVD, c.CariVTCN, c.CariYetkili, c.CariTelNo, 0 as BorcTutari, skb.CksPlnTrh as CksPlnTrh FROM MusteriBakiyeleri mb 
        INNER JOIN ${tables.cari} c ON mb.islemCrKod = c.CariKod LEFT JOIN SonKonaklamaBilgileri skb ON mb.islemCrKod = skb.CariKod
        ${orderByClause}
        ${usePagination ? `OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY` : ''}
      `;
      
      const result: any[] = await this.musteriRepository.query(query);
      
      // Toplam sayıyı ayrı hesapla (daha hızlı) - YENİ SORGU KODU
      const countQuery = `
        WITH MusteriBakiyeleri AS (SELECT islemCrKod,
            SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') AND islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%' THEN islemTutar 
			 WHEN islemTip IN ('GİDER', 'Giren') AND islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%' THEN -islemTutar ELSE 0 END) as MusteriBakiye,
            SUM(CASE WHEN islemTip = 'Giren' AND islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' THEN islemTutar WHEN islemTip = 'Çıkan' AND islemBilgi LIKE '%=DEPOZİTO İADESİ=%' THEN -islemTutar ELSE 0 END) as DepozitoBakiye
            FROM ${tables.islem} WHERE islemCrKod LIKE 'M%' GROUP BY islemCrKod
            HAVING SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') AND islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%' THEN islemTutar 
					WHEN islemTip IN ('GİDER', 'Giren') AND islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%' THEN -islemTutar ELSE 0 END) = 0
					AND SUM(CASE WHEN islemTip = 'Giren' AND islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' THEN islemTutar WHEN islemTip = 'Çıkan' AND islemBilgi LIKE '%=DEPOZİTO İADESİ=%' THEN -islemTutar ELSE 0 END) = 0
        )
        SELECT COUNT(*) as TotalCount
        FROM MusteriBakiyeleri mb 
        INNER JOIN ${tables.cari} c ON mb.islemCrKod = c.CariKod
      `;
      
      const countResult: { TotalCount: number }[] = await this.musteriRepository.query(countQuery);
      const total = countResult[0]?.TotalCount || 0;
      
      const response = {
        data: result,
        total: total,
        page: page,
        limit: limit
      };
      
      return response;
    } catch (error) {
      console.error('getBakiyesizHesaplar hatası:', error);
      throw new Error('Bakiyesiz hesaplar listesi alınamadı');
    }
  }

  // Alacaklı Müşteriler - bakiyesi negatif olan müşteriler (işletme müşteriye borçlu)
  async getAlacakliMusteriler(page: number = 1, limit: number = 100): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    try {
      const tables = this.dbConfig.getTables();
      const views = this.dbConfig.getViews();
      const offset = (page - 1) * limit;
      const usePagination = limit < 1000;
      
      // 🔥 Optimize edilmiş sorgu - CTE kullanarak tek seferde bakiye hesaplama
      const query = `
        WITH MusteriBakiyeleri AS (
          SELECT 
            islemCrKod,
            SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) -
            SUM(CASE WHEN islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) as MusteriBakiye
          FROM ${tables.islem}
          WHERE left(islemCrKod,1) = 'M'
          GROUP BY islemCrKod
        ),
        AlacakliMusteriler AS (
          SELECT c.CariKod
          FROM ${tables.cari} c
          INNER JOIN MusteriBakiyeleri mb ON c.CariKod = mb.islemCrKod
          WHERE left(c.CariKod,1)='M' AND mb.MusteriBakiye < 0
        ),
        SonKonaklamaBilgileri AS (
          SELECT 
            v.MstrTCN,
            v.MstrNo,
            v.KnklmCksTrh,
            v.KnklmPlnTrh,
            v.MstrDurum,
            ROW_NUMBER() OVER (PARTITION BY v.MstrTCN ORDER BY v.knklmNo DESC) as rn
          FROM ${views.musteriKonaklama} v
          WHERE v.MstrDurum IN ('KALIYOR', 'AYRILDI')
        )
        SELECT 
          c.cKytTarihi,
          c.CariKllnc,
          c.CariKod,
          c.CariAdi,
          c.CariVD,
          c.CariVTCN,
          c.CariYetkili,
          c.CariTelNo,
          ISNULL(m.MstrFirma, '') as MstrFirma,
          ISNULL(m.MstrHspTip, 'Bireysel') as MstrHspTip,
          ABS(mb.MusteriBakiye) as AlacakTutari,
          CASE 
            WHEN skb.KnklmCksTrh IS NOT NULL AND skb.KnklmCksTrh != '' THEN skb.KnklmCksTrh
            ELSE skb.KnklmPlnTrh
          END as CikisTarihi,
          skb.KnklmCksTrh,
          skb.KnklmPlnTrh,
          skb.MstrDurum
        FROM AlacakliMusteriler am
        INNER JOIN ${tables.cari} c ON am.CariKod = c.CariKod
        INNER JOIN MusteriBakiyeleri mb ON c.CariKod = mb.islemCrKod
        LEFT JOIN ${tables.musteri} m ON (
          (c.CariKod LIKE 'MB%' AND m.MstrNo = CAST(SUBSTRING(c.CariKod, 3, LEN(c.CariKod) - 2) AS INT)) OR
          (c.CariKod LIKE 'MK%' AND m.MstrNo = CAST(SUBSTRING(c.CariKod, 3, LEN(c.CariKod) - 2) AS INT))
        )
        LEFT JOIN SonKonaklamaBilgileri skb ON (
          (skb.MstrTCN = m.MstrTCN AND m.MstrTCN IS NOT NULL AND skb.rn = 1) OR
          (skb.MstrNo = m.MstrNo AND m.MstrTCN IS NULL AND skb.rn = 1)
        )
        ORDER BY ABS(mb.MusteriBakiye) DESC, CONVERT(Date, c.cKytTarihi, 104) DESC
        ${usePagination ? `OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY` : ''}
      `;
      
      const result: any[] = await this.musteriRepository.query(query);
      
      // Toplam sayıyı ayrı hesapla (daha hızlı)
      const countQuery = `
        WITH MusteriBakiyeleri AS (
          SELECT 
            islemCrKod,
            SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) -
            SUM(CASE WHEN islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) as MusteriBakiye
          FROM ${tables.islem}
          WHERE left(islemCrKod,1) = 'M'
          GROUP BY islemCrKod
        )
        SELECT COUNT(*) as TotalCount
        FROM ${tables.cari} c
        INNER JOIN MusteriBakiyeleri mb ON c.CariKod = mb.islemCrKod
        WHERE left(c.CariKod,1)='M' AND mb.MusteriBakiye < 0
      `;
      
      const countResult: { TotalCount: number }[] = await this.musteriRepository.query(countQuery);
      const total = countResult[0]?.TotalCount || 0;
      
      return {
        data: result,
        total: total,
        page: page,
        limit: limit
      };
    } catch (error) {
      console.error('getAlacakliMusteriler hatası:', error);
      throw new Error('Alacaklı müşteri listesi alınamadı');
    }
  }

  // Cari Hareketler - seçilen müşterinin tüm işlemleri (Cari Kod ile)
  async getCariHareketler(cariKod: string): Promise<any[]> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `
        SELECT 
          i.iKytTarihi,
          i.islemKllnc,
          i.islemOzel1,
          i.islemOzel2,
          i.islemOzel3,
          i.islemArac,
          i.islemTip,
          i.islemGrup,
          i.islemBilgi,
          i.islemTutar
        FROM ${tables.islem} i
        WHERE i.islemCrKod = @0
        ORDER BY CONVERT(Date, i.iKytTarihi, 104) DESC, i.islemNo DESC, i.islemTutar DESC, i.islemCrKod
      `;
      
      const result: any[] = await this.musteriRepository.query(query, [cariKod]);
      return result;
    } catch (error) {
      console.error('getCariHareketler hatası:', error);
      throw new Error('Cari hareketler alınamadı');
    }
  }

  // Cari Hareketler - seçilen müşterinin tüm işlemleri (TC Kimlik ile)
  async getCariHareketlerByTC(tcKimlik: string): Promise<any[]> {
    try {
      const tables = this.dbConfig.getTables();
      
      // 🔥 CTE OPTİMİZASYONU: Cari hareketleri daha verimli getir
      const query = `
        WITH MusteriCariKod AS (
          -- TC'den cari kod bulma
          SELECT 
            CASE 
              WHEN m.MstrHspTip = 'Kurumsal' THEN 'MK' + CAST(m.MstrNo AS VARCHAR(10))
              ELSE 'MB' + CAST(m.MstrNo AS VARCHAR(10))
            END as CariKod
          FROM ${tables.musteri} m
          WHERE m.MstrTCN = @0
            AND LEFT(m.MstrAdi, 9) <> 'PERSONEL '
        ),
        CariHareketler AS (
          -- Cari hareketleri getir
          SELECT 
            i.iKytTarihi,
            i.islemKllnc,
            i.islemOzel1,
            i.islemOzel2,
            i.islemOzel3,
            i.islemArac,
            i.islemTip,
            i.islemGrup,
            i.islemBilgi,
            i.islemTutar,
            ROW_NUMBER() OVER (ORDER BY CONVERT(Date, i.iKytTarihi, 104) DESC, i.islemNo DESC) as rn
          FROM ${tables.islem} i
          INNER JOIN MusteriCariKod mck ON i.islemCrKod = mck.CariKod
        )
        SELECT 
          iKytTarihi,
          islemKllnc,
          islemOzel1,
          islemOzel2,
          islemOzel3,
          islemArac,
          islemTip,
          islemGrup,
          islemBilgi,
          islemTutar
        FROM CariHareketler
        ORDER BY CONVERT(Date, iKytTarihi, 104) DESC, rn
      `;
      
      const result: any[] = await this.musteriRepository.query(query, [tcKimlik]);
      this.debugLog(`TC: ${tcKimlik} için ${result.length} cari hareket bulundu`);
      return result;
    } catch (error) {
      console.error('getCariHareketlerByTC hatası:', error);
      throw new Error('Cari hareketler alınamadı');
    }
  }

  // Çıkış yapanlar - Her müşteri için en son konaklama kaydının çıkış tarihi bugünden küçük olanların sayısı
  async getCikisYapanlarSayisi(): Promise<number> {
    try {
      const tables = this.dbConfig.getTables();
      
      // 🔥 UYUM SAĞLAMA: Liste fonksiyonu ile aynı filtreleme mantığını kullan
      const query = `
        SELECT COUNT(*) as CikisYapanSayisi
        FROM (
          SELECT 
            k.knklmMstrNo,
            MAX(k.knklmNo) as SonKnklmNo
          FROM ${tables.konaklama} k
          GROUP BY k.knklmMstrNo
        ) SonKayitlar
        INNER JOIN ${tables.konaklama} k2 ON SonKayitlar.knklmMstrNo = k2.knklmMstrNo 
                                           AND SonKayitlar.SonKnklmNo = k2.knklmNo
        INNER JOIN ${tables.musteri} m ON k2.knklmMstrNo = m.MstrNo
        WHERE k2.knklmCksTrh IS NOT NULL 
          AND k2.knklmCksTrh != ''
          AND CONVERT(Date, k2.knklmCksTrh, 104) < CONVERT(Date, GETDATE(), 104)
          AND LEFT(m.MstrAdi, 9) <> 'PERSONEL '
      `;
      
      const result: { CikisYapanSayisi: number }[] = await this.musteriRepository.query(query);
      const sayisi = Number(result[0]?.CikisYapanSayisi || 0);
      
      this.debugLog('🔍 getCikisYapanlarSayisi sonucu:', sayisi, 'kayıt bulundu');
      return sayisi;
    } catch (error) {
      console.error('getCikisYapanlarSayisi hatası:', error);
      return 0;
    }
  }

  // 🚨 KARA LİSTE KONTROLÜ - TC Kimlik numarasına göre en son konaklama kaydının kara liste durumunu kontrol et
  async checkKaraListeDurum(tcKimlik: string): Promise<{ isKaraListe: boolean; karaListeNot?: string; knklmNo?: number; musteriAdi?: string; musteriTelNo?: string; musteriFirma?: string } | null> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `
        SELECT TOP 1 
          k.KnklmKrLst,
          k.KnklmNot,
          k.knklmNo,
          m.MstrAdi,
          m.MstrTelNo,
          ISNULL(m.MstrFirma, '') as MstrFirma
        FROM ${tables.konaklama} k
        INNER JOIN ${tables.musteri} m ON k.knklmMstrNo = m.MstrNo
        WHERE m.MstrTCN = @0
          AND LEFT(m.MstrAdi, 9) <> 'PERSONEL '
        ORDER BY k.knklmNo DESC
      `;
      
      const resultUnknown = (await this.musteriRepository.query(query, [tcKimlik])) as unknown;
      const result = resultUnknown as Array<{ KnklmKrLst: string | null; KnklmNot: string | null; knklmNo: number; MstrAdi: string | null; MstrTelNo: string | null; MstrFirma: string | null }>;
      
      if (result.length > 0) {
        const kayit = result[0];
        return {
          isKaraListe: kayit.KnklmKrLst === 'EVET',
          karaListeNot: kayit.KnklmNot || '',
          knklmNo: kayit.knklmNo,
          musteriAdi: kayit.MstrAdi || '',
          musteriTelNo: kayit.MstrTelNo || '',
          musteriFirma: kayit.MstrFirma || ''
        };
      }
      
      return null;
    } catch (error) {
      console.error('checkKaraListeDurum hatası:', error);
      return null;
    }
  }

  // Çıkış yapanlar listesi - Her müşteri için en son konaklama kaydının detayları
  async getCikisYapanlarListesi(knklmTipi: string = 'TÜMÜ', odaTipi: string = 'TÜMÜ'): Promise<MusteriKonaklamaData[]> {
    try {
      const tables = this.dbConfig.getTables();
      
      // 🔥 URL DECODING: URL encoding'den gelen + karakterlerini boşluk yap
      const decodedOdaTipi = decodeURIComponent(odaTipi);

      
      // 🔥 DEBUG: Canlı veritabanındaki oda tipi değerlerini kontrol et
      if (odaTipi !== 'TÜMÜ') {
        const odaTipiKontrolQuery = `
          SELECT DISTINCT KnklmOdaTip, COUNT(*) as KayitSayisi
          FROM ${tables.konaklama} k2
          INNER JOIN ${tables.musteri} m ON k2.knklmMstrNo = m.MstrNo
          WHERE k2.knklmCksTrh IS NOT NULL 
            AND k2.knklmCksTrh != ''
            AND CONVERT(Date, k2.knklmCksTrh, 104) < CONVERT(Date, GETDATE(), 104)
            AND LEFT(m.MstrAdi, 9) <> 'PERSONEL '
          GROUP BY KnklmOdaTip
          ORDER BY KnklmOdaTip
        `;
        
        try {
          await this.musteriRepository.query(odaTipiKontrolQuery);
        } catch (_error) {
          // Devam et
        }
      }
      let query = `
        SELECT 
          m.MstrTCN,
          ISNULL(m.MstrHspTip, 'Bireysel') as MstrHspTip,
          ISNULL(m.MstrFirma, '') as MstrFirma,
          m.MstrAdi,
          m.MstrTelNo,
          k2.KnklmOdaTip,
          k2.KnklmOdaNo,
          k2.KnklmYtkNo,
          k2.KnklmTip,
          k2.KnklmNfyt,
          k2.KnklmGrsTrh,
          k2.KnklmPlnTrh,
          k2.KnklmCksTrh,
          ISNULL(k2.KnklmNot, '') as KnklmNot,
          ISNULL(k2.KnklmKrLst, '') as KnklmKrLst
        FROM (
          SELECT 
            k.knklmMstrNo,
            MAX(k.knklmNo) as SonKnklmNo
          FROM ${tables.konaklama} k
          GROUP BY k.knklmMstrNo
        ) SonKayitlar
        INNER JOIN ${tables.konaklama} k2 ON SonKayitlar.knklmMstrNo = k2.knklmMstrNo 
                                           AND SonKayitlar.SonKnklmNo = k2.knklmNo
        INNER JOIN ${tables.musteri} m ON k2.knklmMstrNo = m.MstrNo
        WHERE k2.knklmCksTrh IS NOT NULL 
          AND k2.knklmCksTrh != ''
          AND CONVERT(Date, k2.knklmCksTrh, 104) < CONVERT(Date, GETDATE(), 104)
          AND LEFT(m.MstrAdi, 9) <> 'PERSONEL '
      `;

      const parameters: string[] = [];
      
      if (knklmTipi && knklmTipi !== 'TÜMÜ') {
        query += ` AND k2.KnklmTip = @${parameters.length}`;
        parameters.push(knklmTipi);
      }

      if (decodedOdaTipi && decodedOdaTipi !== 'TÜMÜ') {
        query += ` AND k2.KnklmOdaTip = @${parameters.length}`;
        parameters.push(decodedOdaTipi);
      }

      query += ` ORDER BY CONVERT(Date, k2.knklmCksTrh, 104) DESC, k2.KnklmTip DESC`;

      this.debugLog('🔍 SQL SORGUSU:', query);
      this.debugLog('🔍 PARAMETRELER:', parameters);

      const result: MusteriKonaklamaData[] = await this.musteriRepository.query(query, parameters);
      
      // Debug: İlk 3 kaydın KnklmCksTrh değerlerini kontrol et
      if (result.length > 0) {
        this.debugLog('🔍 DEBUG - İlk 3 kayıt KnklmCksTrh değerleri:');
        result.slice(0, 3).forEach((item, index) => {
          this.debugLog(`Kayıt ${index + 1}:`, {
            MstrAdi: item.MstrAdi,
            KnklmCksTrh: item.KnklmCksTrh,
            KnklmPlnTrh: item.KnklmPlnTrh,
            KnklmCksTrhType: typeof item.KnklmCksTrh
          });
        });
      }
      
      this.debugLog('Çıkış yapanlar listesi:', result.length, 'kayıt bulundu');
      this.debugLog('Çıkış yapanlar listesi:', result.length, 'kayıt bulundu');
      
      // Debug: İlk 3 kaydın KnklmCksTrh değerlerini kontrol et
      if (result.length > 0) {
        this.debugLog('🔍 DEBUG - İlk 3 kayıt KnklmCksTrh değerleri:');
        result.slice(0, 3).forEach((item, index) => {
          this.debugLog(`Kayıt ${index + 1}:`, {
            MstrAdi: item.MstrAdi,
            KnklmCksTrh: item.KnklmCksTrh,
            KnklmPlnTrh: item.KnklmPlnTrh,
            KnklmCksTrhType: typeof item.KnklmCksTrh
          });
        });
      }
      
      return result;
    } catch (error) {
      console.error('getCikisYapanlarListesi hatası:', error);
      throw new Error('Çıkış yapanlar listesi alınamadı');
    }
  }

  // Müşterinin tüm konaklama kayıtlarını getir
  async getMusteriKonaklamaGecmisi(tcKimlik: string): Promise<any[]> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `
        SELECT 
          k.kKytTarihi,
          k.KnklmOdaTip,
          k.KnklmOdaNo,
          k.KnklmYtkNo,
          k.KnklmTip,
          k.KnklmNfyt,
          k.KnklmGrsTrh,
          k.KnklmPlnTrh,
          ISNULL(k.KnklmCksTrh, '') as KnklmCksTrh,
          k.KnklmKllnc,
          k.KnklmLfyt,
          k.Knklmisk,
          k.KnklmOdmTkvGun,
          k.KnklmKrLst,
          ISNULL(k.KnklmNot, '') as KnklmNot,
          k.knklmNo
        FROM ${tables.konaklama} k
        INNER JOIN ${tables.musteri} m ON k.knklmMstrNo = m.MstrNo
        WHERE m.MstrTCN = @0
          AND LEFT(m.MstrAdi, 9) <> 'PERSONEL '
        ORDER BY k.knklmNo DESC
      `;
      
      const result: any[] = await this.musteriRepository.query(query, [tcKimlik]);
      this.debugLog('Müşteri konaklama geçmişi:', result.length, 'kayıt bulundu');
      return result;
    } catch (error) {
      console.error('getMusteriKonaklamaGecmisi hatası:', error);
      throw new Error('Müşteri konaklama geçmişi alınamadı');
    }
  }

  // 🔥 MÜŞTERİ BAKİYE HESAPLAMA
  async getMusteriBakiye(cariKod: string): Promise<number> {
    try {
      const tables = this.dbConfig.getTables();
      
      const query = `
        SELECT 
          SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) -
          SUM(CASE WHEN islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) as MusteriBakiye
        FROM ${tables.islem}
        WHERE islemCrKod = @0
          AND (islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%')
      `;
      
      const result: { MusteriBakiye: number }[] = await this.musteriRepository.query(query, [cariKod]);
      const bakiye = Number(result[0]?.MusteriBakiye || 0);
      
      return bakiye;
    } catch (error) {
      console.error('getMusteriBakiye hatası:', error);
      throw new Error('Müşteri bakiye hesaplama hatası');
    }
  }

  // 🔥 FİRMA BAKİYE HESAPLAMA - Aynı firmadaki tüm müşterilerin toplam bakiyesi
  async getFirmaBakiye(firmaAdi: string): Promise<number> {
    try {
      const tables = this.dbConfig.getTables();
      
      // Önce firmadaki tüm müşterilerin MstrNo'larını bul
      const musteriQuery = `
        SELECT MstrNo, MstrHspTip, MstrAdi, MstrFirma
        FROM ${tables.musteri}
        WHERE MstrFirma = @0
          AND MstrHspTip = 'Kurumsal'
          AND LEFT(MstrAdi, 9) <> 'PERSONEL '
      `;
      
      const musteriler: { MstrNo: number; MstrHspTip: string; MstrAdi: string; MstrFirma: string }[] = await this.musteriRepository.query(musteriQuery, [firmaAdi]);
      
      if (musteriler.length === 0) {
        return 0;
      }
      
      // Her müşteri için MK{MstrNo} formatında cari kod oluştur ve toplam bakiyeyi hesapla
      const cariKodlar = musteriler.map(m => `MK${m.MstrNo}`);
      const cariKodParametreleri = cariKodlar.map((_, index) => `@${index}`).join(',');
      
      const bakiyeQuery = `
        SELECT 
          SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) -
          SUM(CASE WHEN islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) as ToplamFirmaBakiye
        FROM ${tables.islem}
        WHERE islemCrKod IN (${cariKodParametreleri})
          AND (islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%')
      `;
      
      const result: { ToplamFirmaBakiye: number }[] = await this.musteriRepository.query(bakiyeQuery, cariKodlar);
      const firmaBakiye = Number(result[0]?.ToplamFirmaBakiye || 0);
      
      return firmaBakiye;
    } catch (error) {
      console.error('getFirmaBakiye hatası:', error);
      throw new Error('Firma bakiye hesaplama hatası');
    }
  }

  // 🔥 FİRMA GENELİ KONAKLAMA GEÇMİŞİ - Firmadaki tüm müşterilerin konaklama kayıtları
  async getFirmaGenelKonaklamaGecmisi(firmaAdi: string): Promise<any[]> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `
        SELECT 
          k.kKytTarihi,
          k.KnklmOdaTip,
          k.KnklmOdaNo,
          k.KnklmYtkNo,
          k.KnklmTip,
          k.KnklmNfyt,
          k.KnklmGrsTrh,
          k.KnklmPlnTrh,
          ISNULL(k.KnklmCksTrh, '') as KnklmCksTrh,
          k.KnklmKllnc,
          k.KnklmLfyt,
          k.Knklmisk,
          k.KnklmOdmTkvGun,
          k.KnklmKrLst,
          ISNULL(k.KnklmNot, '') as KnklmNot,
          k.knklmNo,
          m.MstrAdi,
          m.MstrTCN
        FROM ${tables.konaklama} k
        INNER JOIN ${tables.musteri} m ON k.knklmMstrNo = m.MstrNo
        WHERE m.MstrFirma = @0
          AND m.MstrHspTip = 'Kurumsal'
          AND LEFT(m.MstrAdi, 9) <> 'PERSONEL '
        ORDER BY CONVERT(Date, k.kKytTarihi, 104) DESC, k.knklmNo DESC
      `;
      
      const result: any[] = await this.musteriRepository.query(query, [firmaAdi]);
      return result;
    } catch (error) {
      console.error('getFirmaGenelKonaklamaGecmisi hatası:', error);
      throw new Error('Firma genel konaklama geçmişi alınamadı');
    }
  }

  // 🔥 FİRMA GENELİ CARİ HAREKETLER - Firmadaki tüm müşterilerin cari hareketleri
  async getFirmaGenelCariHareketler(firmaAdi: string): Promise<any[]> {
    try {
      const tables = this.dbConfig.getTables();
      
      // Önce firmadaki tüm müşterilerin cari kodlarını bul
      const musteriQuery = `
        SELECT MstrNo, MstrAdi, MstrTCN
        FROM ${tables.musteri}
        WHERE MstrFirma = @0
          AND MstrHspTip = 'Kurumsal'
          AND LEFT(MstrAdi, 9) <> 'PERSONEL '
      `;
      
      const musteriler: { MstrNo: number; MstrAdi: string; MstrTCN: string }[] = await this.musteriRepository.query(musteriQuery, [firmaAdi]);
      
      if (musteriler.length === 0) {
        return [];
      }
      
      // Her müşteri için MK{MstrNo} formatında cari kod oluştur
      const cariKodlar = musteriler.map(m => `MK${m.MstrNo}`);
      const cariKodParametreleri = cariKodlar.map((_, index) => `@${index}`).join(',');
      
      const cariHareketlerQuery = `
        SELECT 
          i.iKytTarihi,
          i.islemKllnc,
          i.islemOzel1,
          i.islemOzel2,
          i.islemOzel3,
          i.islemArac,
          i.islemTip,
          i.islemGrup,
          i.islemBilgi,
          i.islemTutar,
          i.islemCrKod,
          c.CariAdi
        FROM ${tables.islem} i
        LEFT JOIN ${tables.cari} c ON i.islemCrKod = c.CariKod
        WHERE i.islemCrKod IN (${cariKodParametreleri})
        ORDER BY CONVERT(Date, i.iKytTarihi, 104) DESC, i.islemNo DESC, i.islemTutar DESC, i.islemCrKod
      `;
      
      const result: any[] = await this.musteriRepository.query(cariHareketlerQuery, cariKodlar);
      this.debugLog(`Firma ${firmaAdi} için ${result.length} cari hareket bulundu`);
      return result;
    } catch (error) {
      console.error('getFirmaGenelCariHareketler hatası:', error);
      throw new Error('Firma genel cari hareketler alınamadı');
    }
  }

  // 🚨 KARA LİSTEDEN ÇIKARMA - Müşterinin son konaklama kaydındaki KnklmKrLst alanını NULL yapar
  async karaListedenCikar(tcKimlik: string): Promise<{ success: boolean; message: string }> {
    try {
      this.debugLog('=== karaListedenCikar çağrıldı ===');
      this.debugLog('TC Kimlik:', tcKimlik);
      
      const tables = this.dbConfig.getTables();
      
      // Önce müşteriyi bul
      const musteriQuery = `
        SELECT MstrNo
        FROM ${tables.musteri}
        WHERE MstrTCN = @0
          AND LEFT(MstrAdi, 9) <> 'PERSONEL '
      `;
      
      const musteriResult: { MstrNo: number }[] = await this.musteriRepository.query(musteriQuery, [tcKimlik]);
      
      if (musteriResult.length === 0) {
        throw new Error('Müşteri bulunamadı');
      }
      
      const mstrNo = musteriResult[0].MstrNo;
      
      // Son konaklama kaydını bul ve KnklmKrLst alanını NULL yap
      const updateQuery = `
        UPDATE ${tables.konaklama} 
        SET KnklmKrLst = NULL
        WHERE knklmMstrNo = @0
          AND knklmNo = (
            SELECT MAX(knklmNo) 
            FROM ${tables.konaklama} 
            WHERE knklmMstrNo = @0
          )
      `;
      
      const updateResult: unknown = await this.musteriRepository.query(updateQuery, [mstrNo]);
      
      this.debugLog('Kara listeden çıkarma işlemi tamamlandı');
      this.debugLog('Update result:', updateResult);
      
      return {
        success: true,
        message: `TC: ${tcKimlik} müşteri kara listeden başarıyla çıkarıldı`
      };
    } catch (error) {
      console.error('karaListedenCikar hatası:', error);
      throw new Error('Kara listeden çıkarma hatası');
    }
  }

  // 📊 GELİŞMİŞ DASHBOARD İSTATİSTİKLERİ

  // Aylık Gelir Trendi (Son 12 Ay)
  async getAylikGelirTrendi(): Promise<any[]> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `
        WITH AylikGelir AS (
          SELECT 
            YEAR(CONVERT(date, k.kKytTarihi, 104)) as Yil,
            MONTH(CONVERT(date, k.kKytTarihi, 104)) as Ay,
            DATENAME(month, CONVERT(date, k.kKytTarihi, 104)) + ' ' + 
            CAST(YEAR(CONVERT(date, k.kKytTarihi, 104)) as VARCHAR(4)) as AyAdi,
            SUM(k.KnklmNfyt) as ToplamGelir,
            COUNT(*) as MusteriSayisi
          FROM ${tables.konaklama} k
          INNER JOIN ${tables.musteri} m ON k.knklmMstrNo = m.MstrNo
          WHERE CONVERT(date, k.kKytTarihi, 104) >= DATEADD(month, -12, GETDATE())
            AND LEFT(m.MstrAdi, 9) <> 'PERSONEL '
            AND k.KnklmNfyt > 0
          GROUP BY 
            YEAR(CONVERT(date, k.kKytTarihi, 104)),
            MONTH(CONVERT(date, k.kKytTarihi, 104)),
            DATENAME(month, CONVERT(date, k.kKytTarihi, 104))
        )
        SELECT TOP 12 *
        FROM AylikGelir
        ORDER BY Yil DESC, Ay DESC
      `;
      
      const result: any[] = await this.musteriRepository.query(query);
      this.debugLog('Aylık gelir trendi sonucu:', result.length, 'ay bulundu');
      return result.reverse(); // En eski aydan başlasın
    } catch (error) {
      console.error('getAylikGelirTrendi hatası:', error);
      return [];
    }
  }

  // Oda Tipi Dağılımı ve Doluluk Oranları
  async getOdaTipiAnalizi(): Promise<any[]> {
    try {
      const views = this.dbConfig.getViews();
      const tables = this.dbConfig.getTables();
      const query = `
        WITH OdaBilgileri AS (
          SELECT DISTINCT 
            oy.OdaNo,
            oy.YtkNo,
            oy.OdaTip
          FROM ${tables.odaYatak} oy
        ),
        DoluOdalar AS (
          SELECT 
            v.KnklmOdaTip as OdaTip,
            COUNT(*) as DoluSayi
          FROM ${views.musteriKonaklama} v
          WHERE v.MstrDurum = 'KALIYOR' 
            AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
            AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
          GROUP BY v.KnklmOdaTip
        )
        SELECT 
          ob.OdaTip,
          COUNT(ob.OdaNo) as ToplamOda,
          ISNULL(do.DoluSayi, 0) as DoluOda,
          (COUNT(ob.OdaNo) - ISNULL(do.DoluSayi, 0)) as BosOda,
          CASE 
            WHEN COUNT(ob.OdaNo) > 0 
            THEN CAST(ROUND((ISNULL(do.DoluSayi, 0) * 100.0) / COUNT(ob.OdaNo), 1) as DECIMAL(5,1))
            ELSE 0 
          END as DolulukOrani
        FROM OdaBilgileri ob
        LEFT JOIN DoluOdalar do ON ob.OdaTip = do.OdaTip
        GROUP BY ob.OdaTip, do.DoluSayi
        ORDER BY ob.OdaTip
      `;
      
      const result: any[] = await this.musteriRepository.query(query);
      this.debugLog('Oda tipi analizi sonucu:', result.length, 'oda tipi bulundu');
      return result;
    } catch (error) {
      console.error('getOdaTipiAnalizi hatası:', error);
      return [];
    }
  }

  // Konaklama Tipi Dağılımı
  async getKonaklamaTipiDagilimi(): Promise<any[]> {
    try {
      const views = this.dbConfig.getViews();
      
      // 🔥 CTE OPTİMİZASYONU: Konaklama tipi dağılımını daha verimli hesapla
      const query = `
        WITH AktifKonaklamalar AS (
          -- Aktif konaklamaları getir
          SELECT 
            v.KnklmTip,
            v.KnklmNfyt,
            COUNT(*) OVER() as ToplamAktifSayisi
          FROM ${views.musteriKonaklama} v
          WHERE v.MstrDurum = 'KALIYOR' 
            AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
            AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
        ),
        KonaklamaTipiDagilimi AS (
          -- Konaklama tipi bazında istatistikler
          SELECT 
            KnklmTip as KonaklamaTipi,
            COUNT(*) as MusteriSayisi,
            SUM(KnklmNfyt) as ToplamGelir,
            AVG(KnklmNfyt) as OrtalamaGelir,
            MAX(ToplamAktifSayisi) as ToplamAktifSayisi
          FROM AktifKonaklamalar
          GROUP BY KnklmTip
        )
        SELECT 
          KonaklamaTipi,
          MusteriSayisi,
          ToplamGelir,
          OrtalamaGelir,
          CAST(ROUND((MusteriSayisi * 100.0) / ToplamAktifSayisi, 1) as DECIMAL(5,1)) as Yuzde
        FROM KonaklamaTipiDagilimi
        ORDER BY MusteriSayisi DESC
      `;
      
      const result: any[] = await this.musteriRepository.query(query);
      this.debugLog('Konaklama tipi dağılımı sonucu:', result.length, 'tip bulundu');
      return result;
    } catch (error) {
      console.error('getKonaklamaTipiDagilimi hatası:', error);
      return [];
    }
  }

  // Son 7 Gün Aktivite (Giriş/Çıkış)
  async getSon7GunAktivite(): Promise<any[]> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `
        WITH Son7Gun AS (
          SELECT 
            CONVERT(date, DATEADD(day, -6, GETDATE())) as Tarih
          UNION ALL SELECT CONVERT(date, DATEADD(day, -5, GETDATE()))
          UNION ALL SELECT CONVERT(date, DATEADD(day, -4, GETDATE()))
          UNION ALL SELECT CONVERT(date, DATEADD(day, -3, GETDATE()))
          UNION ALL SELECT CONVERT(date, DATEADD(day, -2, GETDATE()))
          UNION ALL SELECT CONVERT(date, DATEADD(day, -1, GETDATE()))
          UNION ALL SELECT CONVERT(date, GETDATE())
        ),
        GirisAktivite AS (
          SELECT 
            CONVERT(date, k.KnklmGrsTrh, 104) as Tarih,
            COUNT(*) as GirisSayisi
          FROM ${tables.konaklama} k
          INNER JOIN ${tables.musteri} m ON k.knklmMstrNo = m.MstrNo
          WHERE CONVERT(date, k.KnklmGrsTrh, 104) >= DATEADD(day, -6, GETDATE())
            AND LEFT(m.MstrAdi, 9) <> 'PERSONEL '
          GROUP BY CONVERT(date, k.KnklmGrsTrh, 104)
        ),
        CikisAktivite AS (
          SELECT 
            CONVERT(date, k.knklmCksTrh, 104) as Tarih,
            COUNT(*) as CikisSayisi
          FROM ${tables.konaklama} k
          INNER JOIN ${tables.musteri} m ON k.knklmMstrNo = m.MstrNo
          WHERE CONVERT(date, k.knklmCksTrh, 104) >= DATEADD(day, -6, GETDATE())
            AND LEFT(m.MstrAdi, 9) <> 'PERSONEL '
            AND k.knklmCksTrh IS NOT NULL
            AND k.knklmCksTrh <> ''
          GROUP BY CONVERT(date, k.knklmCksTrh, 104)
        )
        SELECT 
          sg.Tarih,
          DATENAME(weekday, sg.Tarih) + ', ' + 
          FORMAT(sg.Tarih, 'dd MMM', 'tr-TR') as TarihAdi,
          ISNULL(ga.GirisSayisi, 0) as GirisSayisi,
          ISNULL(ca.CikisSayisi, 0) as CikisSayisi
        FROM Son7Gun sg
        LEFT JOIN GirisAktivite ga ON sg.Tarih = ga.Tarih
        LEFT JOIN CikisAktivite ca ON sg.Tarih = ca.Tarih
        ORDER BY sg.Tarih
      `;
      
      const result: any[] = await this.musteriRepository.query(query);
      this.debugLog('Son 7 gün aktivite sonucu:', result.length, 'gün bulundu');
      return result;
    } catch (error) {
      console.error('getSon7GunAktivite hatası:', error);
      return [];
    }
  }

  // Firma Analizi (En Çok Gelir Getiren Firmalar)
  async getFirmaAnalizi(): Promise<any[]> {
    try {
      const views = this.dbConfig.getViews();
      const query = `
        SELECT TOP 10
          CASE 
            WHEN v.MstrFirma IS NULL OR v.MstrFirma = '' 
            THEN 'Bireysel Müşteriler' 
            ELSE v.MstrFirma 
          END as FirmaAdi,
          COUNT(*) as AktifMusteriSayisi,
          SUM(v.KnklmNfyt) as ToplamGelir,
          AVG(v.KnklmNfyt) as OrtalamaGelir
        FROM ${views.musteriKonaklama} v
        WHERE v.MstrDurum = 'KALIYOR' 
          AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
          AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
        GROUP BY 
          CASE 
            WHEN v.MstrFirma IS NULL OR v.MstrFirma = '' 
            THEN 'Bireysel Müşteriler' 
            ELSE v.MstrFirma 
          END
        ORDER BY ToplamGelir DESC
      `;
      
      const resultUnknown = (await this.musteriRepository.query(query)) as unknown;
      const result = resultUnknown as Array<{
        FirmaAdi: string;
        AktifMusteriSayisi: number | string | null;
        ToplamGelir: number | string | null;
        OrtalamaGelir: number | string | null;
      }>;
      this.debugLog('Firma analizi sonucu:', result.length, 'firma bulundu');
      return result;
    } catch (error) {
      console.error('getFirmaAnalizi hatası:', error);
      return [];
    }
  }

  // DD.MM.YYYY formatındaki string'i Date objesine çevir
  private parseDate(dateString: string): Date {
    const parts = dateString.split('.');
    if (parts.length !== 3) {
      throw new Error(`Geçersiz tarih formatı: ${dateString}`);
    }
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
    const year = parseInt(parts[2], 10);
    
    return new Date(year, month, day);
  }

  // Borçlu müşteriler için ağırlıklı ortalama ödeme vadesi hesapla
  private async hesaplaOdemeVadesi(cariKod: string): Promise<string | null> {
    this.debugLog('🔍 Ödeme vadesi hesaplanıyor:', cariKod);
    const tables = this.dbConfig.getTables();
    type IslemRow = { islemTip: string; islemBilgi?: string | null; islemTutar: number; iKytTarihi: string };
    const islemListUnknown = (await this.musteriRepository.query(`
      SELECT islemTip, islemBilgi, islemTutar, iKytTarihi
      FROM ${tables.islem}
      WHERE islemCrKod = @0
      ORDER BY CONVERT(Date, iKytTarihi, 104) ASC
    `, [cariKod])) as unknown;
    const islemList = islemListUnknown as IslemRow[];

    this.debugLog('🔍 İşlem kayıtları bulundu:', islemList.length);

    let toplamTutar = 0;
    let toplamGun = 0;
    const now = new Date();

    for (const islem of islemList) {
      // Eğer islemBilgi'de 'DEPOZİTO' ifadesi geçiyorsa bu kaydı hesap dışı bırak
      // (Büyük/küçük harf duyarsız kontrol)
      if ((islem.islemBilgi || '').toUpperCase().includes('DEPOZİTO')) {
        this.debugLog('🔍 DEPOZİTO kaydı atlandı:', islem.islemBilgi);
        continue;
      }
      
      let vadeTarihi: Date;
      const { islemTip, islemTutar, iKytTarihi } = islem;

      if (islemTip === 'GELİR') {
        // islemBilgi'den vade tarihi çek (büyük/küçük harf duyarsız)
        const match = (islem.islemBilgi || '').match(/BAKİYE ÖDEME VADESİ: (\d{2}\.\d{2}\.\d{4})/i);
        if (match) {
          const [gun, ay, yil] = match[1].split('.').map(Number);
          vadeTarihi = new Date(yil, ay - 1, gun);
          this.debugLog('🔍 GELİR vadesi bulundu:', match[1], 'Tutar:', islemTutar);
        } else {
          // Vade tarihi yoksa iKytTarihi'ni kullan
          vadeTarihi = this.parseDate(iKytTarihi);
          this.debugLog('🔍 GELİR vadesi bulunamadı, iKytTarihi kullanılıyor:', iKytTarihi, 'Tutar:', islemTutar);
        }
      } else if (islemTip === 'Giren') {
        // Giren için iKytTarihi kullan
        vadeTarihi = this.parseDate(iKytTarihi);
        this.debugLog('🔍 Giren işlemi kullanıldı, tarih:', iKytTarihi, 'Tutar:', islemTutar);
      } else if (islemTip === 'GİDER' || islemTip === 'Çıkan') {
        // GİDER/Çıkan için önce islemBilgi'den vade tarihi çek, yoksa iKytTarihi kullan
        const match = (islem.islemBilgi || '').match(/BAKİYE ÖDEME VADESİ: (\d{2}\.\d{2}\.\d{4})/i);
        if (match) {
          const [gun, ay, yil] = match[1].split('.').map(Number);
          vadeTarihi = new Date(yil, ay - 1, gun);
          this.debugLog('🔍 GİDER/Çıkan vadesi bulundu:', match[1], 'Tutar:', islemTutar);
        } else {
          // Vade tarihi yoksa iKytTarihi'ni kullan
          vadeTarihi = this.parseDate(iKytTarihi);
          this.debugLog('🔍 GİDER/Çıkan vadesi bulunamadı, iKytTarihi kullanılıyor:', iKytTarihi, 'Tutar:', islemTutar);
        }
      } else {
        this.debugLog('🔍 Bilinmeyen işlem tipi atlandı:', islemTip);
        continue; // Tanımsız işlem tipleri atla
      }

      // Ağırlıklı ortalama hesaplama
      const fark = vadeTarihi.getTime() - now.getTime();
      const gun = fark / (24 * 60 * 60 * 1000);
      
      toplamTutar += Math.abs(islemTutar);
      toplamGun += gun * Math.abs(islemTutar);
      
      this.debugLog('🔍 İşlem eklendi - Tip:', islemTip, 'Gün:', gun.toFixed(1), 'Tutar:', islemTutar);
    }

    if (toplamTutar === 0) {
      this.debugLog('🔍 Toplam tutar sıfır, ödeme vadesi hesaplanamadı');
      return null;
    }

    const ortalamaGun = toplamGun / toplamTutar;
    const ortTarih = new Date(now.getTime() + (ortalamaGun * 24 * 60 * 60 * 1000));
    // Hesaplanan tarihe 1 gün ekle (iş kuralı gereği)
    ortTarih.setDate(ortTarih.getDate());
    // DD.MM.YYYY formatı
    const pad = (n: number) => n < 10 ? '0' + n : n;
    const tarihStr = pad(ortTarih.getDate()) + '.' + pad(ortTarih.getMonth() + 1) + '.' + ortTarih.getFullYear();
    
    this.debugLog('🔍 Hesaplanan ödeme vadesi:', tarihStr, 'Ortalama gün:', ortalamaGun.toFixed(1));
    return tarihStr;
  }

  // Public metod: TC kimlik numarasından ödeme vadesi hesapla
  async hesaplaMusteriOdemeVadesiByTC(tcKimlik: string): Promise<{ odemeVadesi: string | null; musteriAdi: string; cariKod: string } | null> {
    try {      
      // TC'den müşteri bilgilerini al
      const musteriData: any = await this.musteriRepository.query(`
        SELECT MstrNo, MstrHspTip, MstrAdi 
        FROM ${this.dbConfig.getTables().musteri} 
        WHERE MstrTCN = @0
      `, [tcKimlik]);

      if (!musteriData || musteriData.length === 0) {
        return null;
      }
      const musteri = musteriData[0];
      const cariKod = musteri.MstrHspTip === 'Kurumsal' ? `MK${musteri.MstrNo}` : `MB${musteri.MstrNo}`;      
      // Ödeme vadesi hesapla
      const odemeVadesi = await this.hesaplaOdemeVadesi(cariKod);      
      return {
        odemeVadesi,
        musteriAdi: musteri.MstrAdi,
        cariKod
      };
    } catch (error) {
      console.error('🔥 TC ile ödeme vadesi hesaplama hatası:', error);
      return null;
    }
  }

  // 🔥 DEPOZİTO BAKİYE HESAPLAMA FONKSİYONU
  async getMusteriDepozitoBakiye(cariKod: string): Promise<number> {
    try {
      const result: any = await this.musteriRepository.query(`
        SELECT 
          SUM(CASE WHEN islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' THEN islemTutar ELSE 0 END) as DepozitoTahsilat,
          SUM(CASE WHEN islemBilgi LIKE '%=DEPOZİTO İADESİ=%' THEN islemTutar ELSE 0 END) as DepozitoIade
        FROM ${this.dbConfig.getTables().islem} 
        WHERE islemCrKod = @0
      `, [cariKod]);

      if (!result || result.length === 0) {
        return 0;
      }

      const depozitoTahsilat = result[0].DepozitoTahsilat || 0;
      const depozitoIade = result[0].DepozitoIade || 0;
      const depozitoBakiye = depozitoTahsilat - depozitoIade;

      return depozitoBakiye;
    } catch (error) {
      console.error('🔥 Depozito bakiyesi hesaplama hatası:', error);
      return 0;
    }
  }

  // Cache temizleme fonksiyonu
  clearStatsCache(): void {
    this.statsCache = null;
  }

  // 🔥 GÜVENLİ BAKİYESİZ HESAPLAR STATS HESAPLAMA
  async getBakiyesizHesaplarStats(): Promise<number> {
    try {
      const tables = this.dbConfig.getTables();
      
      // 🔥 Bakiyesiz Hesaplar - YENİ SORGU KODU (hem bakiye hem depozito 0 olan müşteriler)
      const query = `
        WITH MusteriBakiyeleri AS (SELECT islemCrKod,
            SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') AND islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%' THEN islemTutar 
			 WHEN islemTip IN ('GİDER', 'Giren') AND islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%' THEN -islemTutar ELSE 0 END) as MusteriBakiye,
            SUM(CASE WHEN islemTip = 'Giren' AND islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' THEN islemTutar WHEN islemTip = 'Çıkan' AND islemBilgi LIKE '%=DEPOZİTO İADESİ=%' THEN -islemTutar ELSE 0 END) as DepozitoBakiye
            FROM ${tables.islem} WHERE islemCrKod LIKE 'M%' GROUP BY islemCrKod
            HAVING SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') AND islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%' THEN islemTutar 
					WHEN islemTip IN ('GİDER', 'Giren') AND islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%' THEN -islemTutar ELSE 0 END) = 0
					AND SUM(CASE WHEN islemTip = 'Giren' AND islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' THEN islemTutar WHEN islemTip = 'Çıkan' AND islemBilgi LIKE '%=DEPOZİTO İADESİ=%' THEN -islemTutar ELSE 0 END) = 0
        )
        SELECT COUNT(*) as BakiyesizHesaplarSayisi
        FROM MusteriBakiyeleri mb 
        INNER JOIN ${tables.cari} c ON mb.islemCrKod = c.CariKod
      `;
      
      const result = await this.musteriRepository.query(query);
      const count = result[0]?.BakiyesizHesaplarSayisi || 0;
      
      return count;
    } catch (error) {
      console.error('Bakiyesiz hesaplar stats hesaplama hatası:', error);
      return 0;
    }
  }

  // 🔥 TC KİMLİK İLE CİRİ HAREKETLER PDF OLUŞTURMA
  async generateCariHareketlerByTCPDF(tcKimlik: string): Promise<any> {
    try {
      const data = (await this.getCariHareketlerByTC(tcKimlik)) as CariHareketRow[];
      
      // Müşteri adını al
      let musteriAdi = '';
      if (data.length > 0) {
        try {
          const musteriQuery = `SELECT MstrAdi FROM [harunta].[tblMusteri] WHERE MstrTCN = @0`;
          const musteriResult = await this.musteriRepository.query(musteriQuery, [tcKimlik]);
          if (musteriResult.length > 0) {
            musteriAdi = musteriResult[0].MstrAdi;
          }
        } catch (error) {
          this.debugLog('Müşteri adı alınamadı:', error);
        }
      }
      
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
        doc.on('error', (error) => {
          reject(error);
        });

        // Türkçe karakter desteği için font yükle
        try {
          doc.font('./fonts/DejaVuSans.ttf');
        } catch (error) {
          this.debugLog('Türkçe font yüklenemedi, varsayılan font kullanılacak:', error);
        }

        // PDF başlığı
        const baslik = musteriAdi ? `${musteriAdi} - Cari Hareketler` : 'Cari Hareketler Raporu';
        doc.fontSize(16).text(baslik, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`TC Kimlik: ${tcKimlik}`, { align: 'center' });
        doc.moveDown();

        // Tablo başlıkları
        const headers = ['Tarih', 'İşlem Tipi', 'Açıklama', 'Tutar'];
        const columnWidths = [80, 80, 280, 80];
        let y = doc.y;

        // Başlık satırı
        headers.forEach((header, index) => {
          doc.fontSize(10).text(header, 50 + columnWidths.slice(0, index).reduce((a, b) => a + b, 0), y);
        });

        y += 20;

        // Veri satırları
        data.forEach((row: CariHareketRow) => {
          if (y > 700) {
            doc.addPage();
            y = 50;
          }

          const values = [
            this.formatDate(row.iKytTarihi),
            row.islemTip || '',
            row.islemBilgi || '',
            this.formatCurrency(row.islemTutar ?? 0)
          ];

          values.forEach((value, index) => {
            const x = 50 + columnWidths.slice(0, index).reduce((a, b) => a + b, 0);
            const width = columnWidths[index];
            
            // Tutar sütunu için sağa dayalı hizalama
            const align = index === 3 ? 'right' : 'left';
            doc.fontSize(8).text(value, x, y, { width: width, align: align });
          });

          y += 25; // Satır aralığını artırdık (12'den 18'e)
        });

        doc.end();
      });
    } catch (error) {
      console.error('🔥 TC ile Cari Hareketler PDF oluşturma hatası:', error);
      throw new Error('PDF oluşturulamadı');
    }
  }

  // 🔥 TC KİMLİK İLE CİRİ HAREKETLER EXCEL OLUŞTURMA
  async generateCariHareketlerByTCExcel(tcKimlik: string): Promise<any> {
    try {
      this.debugLog('🔥 Excel oluşturma başladı, TC:', tcKimlik);
      
      const data = await this.getCariHareketlerByTC(tcKimlik);
      this.debugLog('🔥 Veri alındı, satır sayısı:', data.length);
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Cari Hareketler');

      // Başlık satırı
      worksheet.addRow(['Tarih', 'İşlem Tipi', 'Açıklama', 'Tutar']);

      // Veri satırları
      data.forEach((row: any, index: number) => {
        try {
          worksheet.addRow([
            this.formatDate(row.iKytTarihi),
            row.islemTip || '',
            row.islemBilgi || '',
            row.islemTutar || 0
          ]);
        } catch (rowError) {
          console.error(`🔥 Satır ${index} hatası:`, rowError, row);
        }
      });

      // Sütun genişliklerini ayarla
      worksheet.columns.forEach((column) => {
        column.width = 15;
      });

      this.debugLog('🔥 Excel buffer oluşturuluyor...');
      const buffer = await workbook.xlsx.writeBuffer();
      this.debugLog('🔥 Excel buffer oluşturuldu, boyut:', buffer.byteLength);
      
      return buffer;
    } catch (error) {
      console.error('🔥 TC ile Cari Hareketler Excel oluşturma hatası:', error);
      throw new Error(`Excel oluşturulamadı: ${error.message}`);
    }
  }

  // 🔥 TC KİMLİK İLE KONAKLAMA GEÇMİŞİ PDF OLUŞTURMA
  async generateKonaklamaGecmisiByTCPDF(tcKimlik: string): Promise<any> {
    try {
      const data = (await this.getMusteriKonaklamaGecmisi(tcKimlik)) as KonaklamaGecmisRow[];
      
      // Müşteri adını al
      let musteriAdi = '';
      if (data.length > 0) {
        try {
          const musteriQuery = `SELECT MstrAdi FROM [harunta].[tblMusteri] WHERE MstrTCN = @0`;
          const musteriResult = await this.musteriRepository.query(musteriQuery, [tcKimlik]);
          if (musteriResult.length > 0) {
            musteriAdi = musteriResult[0].MstrAdi;
          }
        } catch (error) {
          this.debugLog('Müşteri adı alınamadı:', error);
        }
      }
      
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
        doc.on('error', (error) => {
          reject(error);
        });

        // Türkçe karakter desteği için font yükle
        try {
          doc.font('./fonts/DejaVuSans.ttf');
        } catch (error) {
          this.debugLog('Türkçe font yüklenemedi, varsayılan font kullanılacak:', error);
        }

        // PDF başlığı
        const baslik = musteriAdi ? `${musteriAdi} - Konaklama Geçmişi` : 'Konaklama Geçmişi Raporu';
        doc.fontSize(16).text(baslik, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`TC Kimlik: ${tcKimlik}`, { align: 'center' });
        doc.moveDown();

        // Tablo başlıkları
        const headers = ['Tarih', 'İşlem Tipi', 'Açıklama', 'Tutar'];
        const columnWidths = [80, 80, 280, 80];
        let y = doc.y;

        // Başlık satırı
        headers.forEach((header, index) => {
          doc.fontSize(10).text(header, 50 + columnWidths.slice(0, index).reduce((a, b) => a + b, 0), y);
        });

        y += 20;

        // Veri satırları
        data.forEach((row: KonaklamaGecmisRow) => {
          if (y > 700) {
            doc.addPage();
            y = 50;
          }

          const values = [
            this.formatDate(row.kKytTarihi),
            row.KnklmTip || '',
            `${row.KnklmOdaTip} - ${row.KnklmOdaNo}-${row.KnklmYtkNo}`,
            this.formatCurrency(Number(row.KnklmNfyt ?? 0))
          ];

          values.forEach((value, index) => {
            const x = 50 + columnWidths.slice(0, index).reduce((a, b) => a + b, 0);
            const width = columnWidths[index];
            
            // Tutar sütunu için sağa dayalı hizalama
            const align = index === 3 ? 'right' : 'left';
            doc.fontSize(8).text(value, x, y, { width: width, align: align });
          });

          y += 12; // Satır aralığını azalttık
        });

        doc.end();
      });
    } catch (error) {
      console.error('🔥 TC ile Konaklama Geçmişi PDF oluşturma hatası:', error);
      throw new Error('PDF oluşturulamadı');
    }
  }

  // 🔥 TC KİMLİK İLE KONAKLAMA GEÇMİŞİ EXCEL OLUŞTURMA
  async generateKonaklamaGecmisiByTCExcel(tcKimlik: string): Promise<any> {
    try {
      const data = await this.getMusteriKonaklamaGecmisi(tcKimlik);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Konaklama Geçmişi');

      // Başlık satırı
      worksheet.addRow(['Kayıt Tarihi', 'Oda Tipi', 'Oda-Yatak', 'Konaklama Tipi', 'Tutar']);

      // Veri satırları
      data.forEach((row: any) => {
        worksheet.addRow([
            this.formatDate(row.kKytTarihi),
            row.KnklmOdaTip || '',
            `${row.KnklmOdaNo ?? ''}-${row.KnklmYtkNo ?? ''}`,
            row.KnklmTip || '',
            row.KnklmNfyt ?? 0
        ]);
      });

      // Sütun genişliklerini ayarla
      worksheet.columns.forEach((column) => {
        column.width = 15;
      });

      return await workbook.xlsx.writeBuffer();
    } catch (error) {
      console.error('🔥 TC ile Konaklama Geçmişi Excel oluşturma hatası:', error);
      throw new Error('Excel oluşturulamadı');
    }
  }

  // Yardımcı fonksiyonlar
  private formatDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      // SQL Server'dan gelen tarih formatını kontrol et
      // nchar(10) formatında DD.MM.YYYY geliyor olabilir
      if (typeof dateString === 'string' && dateString.includes('.')) {
        // DD.MM.YYYY formatında ise direkt kullan
        const parts = dateString.split('.');
        if (parts.length === 3) {
          return dateString; // Zaten doğru formatta
        }
      }
      
      // ISO format veya diğer formatlar için
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Geçersiz tarih ise orijinal string'i döndür
        return dateString;
      }
      return date.toLocaleDateString('tr-TR');
    } catch {
      // Hata durumunda orijinal string'i döndür
      return dateString;
    }
  }

  private formatCurrency(amount: number): string {
    if (!amount) return '0,00 ₺';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  }

}