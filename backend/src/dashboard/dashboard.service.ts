/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Musteri } from '../entities/musteri.entity';
import { DatabaseConfigService } from '../database/database-config.service';

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
  KnklmNot: string;
  KnklmKrLst?: string; // 🚨 Kara Liste Flag
  odemeVadesi?: string;
}

@Injectable()
export class DashboardService {
  private dbConfig: DatabaseConfigService;

  constructor(
    @InjectRepository(Musteri)
    private musteriRepository: Repository<Musteri>,
  ) {
    this.dbConfig = new DatabaseConfigService();
  }

  // sp_bOdGunMusteriListeY stored procedure'ünü çağır
  async getMusteriListesi(knklmTipi: string = 'TÜMÜ'): Promise<MusteriKonaklamaData[]> {
    try {
      console.log('=== getMusteriListesi called ===');
      console.log('knklmTipi:', knklmTipi);

      // Direkt view'dan sorgulayalım (SP'de tarih filtresi çok kısıtlayıcı)
      console.log('View sorgusu kullanılacak');
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
      console.log('View sorgusu sonucu:', result.length, 'kayıt bulundu');
      
      // Debug için sorguyu logla
      console.log('Executed query:', query);
      console.log('Parameters:', parameters);
      
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
      console.log('🔥 getOdaTipleriByKonaklama çağrıldı - konaklamaTip:', konaklamaTip, 'kartTip:', kartTip);
      
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
      
      console.log('🔥 getOdaTipleriByKonaklama musteriListesi length:', musteriListesi.length);
      
      // Müşteri listesinden konaklama tipine göre filtreleme yap
      let filteredList = musteriListesi;
      if (konaklamaTip && konaklamaTip !== 'TÜMÜ') {
        filteredList = musteriListesi.filter(m => m.KnklmTip === konaklamaTip);
        console.log('🔥 getOdaTipleriByKonaklama filtered by konaklamaTip:', konaklamaTip, 'filtered length:', filteredList.length);
      }
      
      // Filtrelenmiş listeden distinct oda tiplerini çıkar
      const odaTipleri = [...new Set(filteredList.map(m => m.KnklmOdaTip))].filter(tip => tip && tip.trim() !== '');
      console.log('🔥 getOdaTipleriByKonaklama odaTipleri:', odaTipleri);
      
      const finalResult = ['TÜMÜ', ...odaTipleri.sort()];
      console.log('🔥 getOdaTipleriByKonaklama final result:', finalResult);
      
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
      console.log('🔥 getKonaklamaTipleriByOda çağrıldı - odaTip:', odaTip, 'decodedOdaTip:', decodedOdaTip, 'kartTip:', kartTip);
      
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
      
      console.log('🔥 getKonaklamaTipleriByOda musteriListesi length:', musteriListesi.length);
      
      // Müşteri listesinden oda tipine göre filtreleme yap (decoded oda tipini kullan)
      let filteredList = musteriListesi;
      if (decodedOdaTip && decodedOdaTip !== 'TÜMÜ') {
        // 🔥 DEBUG: Veritabanındaki oda tiplerini kontrol et
        const uniqueOdaTipleri = [...new Set(musteriListesi.map(m => m.KnklmOdaTip))];
        console.log('🔥 getKonaklamaTipleriByOda - Veritabanındaki oda tipleri:', uniqueOdaTipleri);
        console.log('🔥 getKonaklamaTipleriByOda - Aranan oda tipi:', decodedOdaTip);
        
        filteredList = musteriListesi.filter(m => m.KnklmOdaTip === decodedOdaTip);
        console.log('🔥 getKonaklamaTipleriByOda filtered by odaTip:', decodedOdaTip, 'filtered length:', filteredList.length);
      }
      
      // Filtrelenmiş listeden distinct konaklama tiplerini çıkar
      const konaklamaTipleri = [...new Set(filteredList.map(m => m.KnklmTip))].filter(tip => tip && tip.trim() !== '');
      console.log('🔥 getKonaklamaTipleriByOda konaklamaTipleri:', konaklamaTipleri);
      
      const finalResult = ['TÜMÜ', ...konaklamaTipleri.sort()];
      console.log('🔥 getKonaklamaTipleriByOda final result:', finalResult);
      
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

  // Dashboard istatistikleri (SP mantığı ile uyumlu)
  async getDashboardStats(): Promise<any> {
    try {
      const views = this.dbConfig.getViews();
      const tables = this.dbConfig.getTables();
      const query = `
        SELECT 
          (SELECT COUNT(*) FROM ${views.musteriKonaklama} v
           WHERE v.MstrDurum = 'KALIYOR' 
             AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
             AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
             AND CONVERT(Date, v.KnklmPlnTrh, 104) > CONVERT(Date, GETDATE(), 104)
             AND NOT (CONVERT(Date, v.KnklmGrsTrh, 104) = CONVERT(Date, GETDATE(), 104) AND v.KnklmNot LIKE ' - Yeni Müşteri:%')
             AND NOT (CONVERT(Date, v.KnklmGrsTrh, 104) = CONVERT(Date, GETDATE(), 104) AND v.KnklmNot LIKE ' - Yeni Giriş:%')
             AND v.knklmNo = (
               SELECT MAX(v2.knklmNo) 
               FROM ${views.musteriKonaklama} v2 
               WHERE v2.MstrTCN = v.MstrTCN
                 AND v2.MstrDurum = 'KALIYOR'
                 AND LEFT(v2.MstrAdi, 9) <> 'PERSONEL '
             )) as ToplamAktifKonaklama,
          (SELECT COUNT(*) FROM ${views.musteriKonaklama} v
           WHERE v.MstrDurum = 'KALIYOR' 
             AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
             AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
             AND v.KnklmTip = 'GÜNLÜK') as GunlukKonaklama,
          (SELECT COUNT(*) FROM ${views.musteriKonaklama} v
           WHERE v.MstrDurum = 'KALIYOR' 
             AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
             AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
             AND v.KnklmTip = 'HAFTALIK') as HaftalikKonaklama,
          (SELECT COUNT(*) FROM ${views.musteriKonaklama} v
           WHERE v.MstrDurum = 'KALIYOR' 
             AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
             AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
             AND v.KnklmTip = 'AYLIK') as AylikKonaklama,
          COUNT(*) as SuresiGecentKonaklama,
          (SELECT COUNT(*) FROM ${tables.konaklama} k
           INNER JOIN ${tables.musteri} m ON k.knklmMstrNo = m.MstrNo
           WHERE CONVERT(Date, k.knklmCksTrh, 104) = CONVERT(Date, GETDATE(), 104)
             AND LEFT(m.MstrAdi, 9) <> 'PERSONEL '
             AND k.knklmNo = (
               SELECT MAX(k2.knklmNo) 
               FROM ${tables.konaklama} k2 
               WHERE k2.knklmMstrNo = k.knklmMstrNo
             )) as BugünCikanKonaklama,
          (SELECT COUNT(*) FROM ${views.musteriKonaklama} v
           WHERE v.MstrDurum = 'KALIYOR' 
             AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
             AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
             AND CONVERT(Date, v.KnklmGrsTrh, 104) = CONVERT(Date, GETDATE(), 104)
             AND v.KnklmNot LIKE ' - Yeni Müşteri:%') as YeniMusteriKonaklama,
          (SELECT COUNT(*) FROM ${views.musteriKonaklama} v
           WHERE v.MstrDurum = 'KALIYOR' 
             AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
             AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
             AND CONVERT(Date, v.KnklmGrsTrh, 104) = CONVERT(Date, GETDATE(), 104)
             AND v.KnklmNot LIKE ' - Yeni Giriş:%') as YeniGirisKonaklama,
          (SELECT COUNT(*) FROM ${views.musteriKonaklama} v
           LEFT JOIN ${tables.musteri} m ON v.MstrTCN = m.MstrTCN
           WHERE v.MstrDurum = 'KALIYOR' 
             AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
             AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
             AND CONVERT(Date, v.KnklmPlnTrh, 104) > CONVERT(Date, GETDATE(), 104)
             AND v.KnklmNot NOT LIKE '%Yeni Müşteri:%' AND v.KnklmNot NOT LIKE '%Yeni Giriş:%') as DevamEdenKonaklama,
          (SELECT COUNT(DISTINCT islemCrKod)
           FROM (
             SELECT 
               islemCrKod,
               SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) -
               SUM(CASE WHEN islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) as MusteriBakiye
             FROM ${tables.islem}
             GROUP BY islemCrKod
             HAVING left(islemCrKod,1) = 'M' and (SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) -
                    SUM(CASE WHEN islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) > 0)
           ) BorcluMusteriler) as BorcluMusteriSayisi,
          (SELECT COUNT(DISTINCT islemCrKod)
           FROM (
             SELECT 
               islemCrKod,
               SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) -
               SUM(CASE WHEN islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) as MusteriBakiye
             FROM ${tables.islem}
             GROUP BY islemCrKod
             HAVING left(islemCrKod,1) = 'M' and (SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) -
                    SUM(CASE WHEN islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) < 0)
           ) AlacakliMusteriler) as AlacakliMusteriSayisi,
          SUM(v.KnklmNfyt) as ToplamGelir,
          AVG(v.KnklmNfyt) as OrtalamaGelir
        FROM ${views.musteriKonaklama} v
        WHERE v.MstrDurum = 'KALIYOR' 
          AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
          AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
          AND CONVERT(Date, v.KnklmPlnTrh, 104) <= GETDATE()
          AND v.knklmNo = (
            SELECT MAX(v2.knklmNo) 
            FROM ${views.musteriKonaklama} v2 
            WHERE v2.MstrTCN = v.MstrTCN
              AND v2.MstrDurum = 'KALIYOR'
              AND LEFT(v2.MstrAdi, 9) <> 'PERSONEL '
          )
      `;
      
      const result: any[] = await this.musteriRepository.query(query);
      console.log('Stats query result:', result[0]);
      return result[0] || {};
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
      
      const result: any[] = await this.musteriRepository.query(query);
      return result;
    } catch (error) {
      console.error('getOdaDolulukDurumu hatası:', error);
      return [];
    }
  }

  // Toplam Aktif - konaklama yapan tüm müşterilerin listesi (süresi dolmayanlar)
  // 🔥 GÜNCELLEME: Müşterinin en büyük knklmNo kaydına göre filtreleme
  async getToplamAktifMusteri(knklmTipi: string = 'TÜMÜ', odaTipi: string = 'TÜMÜ'): Promise<MusteriKonaklamaData[]> {
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
          AND CONVERT(Date, v.KnklmPlnTrh, 104) > CONVERT(Date, GETDATE(), 104)
          AND NOT (CONVERT(Date, v.KnklmGrsTrh, 104) = CONVERT(Date, GETDATE(), 104) AND v.KnklmNot LIKE ' - Yeni Müşteri:%')
          AND NOT (CONVERT(Date, v.KnklmGrsTrh, 104) = CONVERT(Date, GETDATE(), 104) AND v.KnklmNot LIKE ' - Yeni Giriş:%')
          AND v.knklmNo = (
            SELECT MAX(v2.knklmNo) 
            FROM ${views.musteriKonaklama} v2 
            WHERE v2.MstrTCN = v.MstrTCN
              AND v2.MstrDurum = 'KALIYOR'
              AND LEFT(v2.MstrAdi, 9) <> 'PERSONEL '
          )
      `;

      const parameters: string[] = [];
      let paramIndex = 0;
      
      if (knklmTipi && knklmTipi !== 'TÜMÜ') {
        query += ` AND v.KnklmTip = @${paramIndex}`;
        parameters.push(knklmTipi);
        paramIndex++;
      }

      if (odaTipi && odaTipi !== 'TÜMÜ') {
        query += ` AND v.KnklmOdaTip = @${paramIndex}`;
        parameters.push(odaTipi);
        paramIndex++;
      }

      query += ` ORDER BY CONVERT(Date, v.KnklmPlnTrh, 104), v.KnklmTip DESC, CONVERT(Date, v.KnklmGrsTrh, 104) DESC`;

      const result: MusteriKonaklamaData[] = await this.musteriRepository.query(query, parameters);   
      return result;
    } catch (error) {
      console.error('getToplamAktifMusteri hatası:', error);
      throw new Error('Toplam aktif müşteri listesi alınamadı');
    }
  }

  // Süresi Dolan - knklmPlnTrh değeri bugün ve bugünden eski, knklmCksTrh boş olan müşteriler
  // 🔥 GÜNCELLEME: Müşterinin en büyük knklmNo kaydına göre filtreleme
  async getSuresiDolanMusteri(knklmTipi: string = 'TÜMÜ'): Promise<MusteriKonaklamaData[]> {
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
          AND CONVERT(Date, v.KnklmPlnTrh, 104) <= CONVERT(Date, GETDATE(), 104)
          AND v.knklmNo = (
            SELECT MAX(v2.knklmNo) 
            FROM ${views.musteriKonaklama} v2 
            WHERE v2.MstrTCN = v.MstrTCN
              AND v2.MstrDurum = 'KALIYOR'
              AND LEFT(v2.MstrAdi, 9) <> 'PERSONEL '
          )
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
      console.log('getBugunCikanMusteri sonucu:', result.length, 'kayıt bulundu');
      return result;
    } catch (error) {
      console.error('getBugunCikanMusteri hatası:', error);
      throw new Error('Bugün çıkan müşteri listesi alınamadı');
    }
  }

  // Bugün Giren - knklmGrsTrh bugün olup knklmNot "Yeni Müşteri:" ile başlayan müşteriler
  // 🔥 YENİ MÜŞTERİ - Bugün giren ve KnklmNot "Yeni Müşteri" ile başlayan kayıtlar
  async getYeniMusteri(knklmTipi: string = 'TÜMÜ'): Promise<MusteriKonaklamaData[]> {
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
          AND v.KnklmNot LIKE ' - Yeni Müşteri:%'
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
      console.error('getYeniMusteri hatası:', error);
      throw new Error('Yeni müşteri listesi alınamadı');
    }
  }

  // 🔥 YENİ GİRİŞ - Bugün giren ve KnklmNot "Yeni Giriş" ile başlayan kayıtlar  
  async getYeniGiris(knklmTipi: string = 'TÜMÜ'): Promise<MusteriKonaklamaData[]> {
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
          AND v.KnklmNot LIKE ' - Yeni Giriş:%'
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
          AND (v.KnklmNot LIKE ' - Yeni Müşteri:%' OR v.KnklmNot LIKE ' - Yeni Giriş:%')
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
  async getBorcluMusteriler(page: number = 1, limit: number = 100): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    try {
      console.log(`🔥 getBorcluMusteriler çağrıldı - page: ${page}, limit: ${limit}`);
      
      const tables = this.dbConfig.getTables();
      const offset = (page - 1) * limit;
      
      // Önce toplam sayıyı al
      const countQuery = `
        SELECT COUNT(*) as TotalCount
        FROM ${tables.cari} c
        WHERE left(c.CariKod,1)='M' and c.CariKod IN (
          SELECT DISTINCT islemCrKod
          FROM (
            SELECT 
              islemCrKod,
              SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) -
              SUM(CASE WHEN islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) as MusteriBakiye
            FROM ${tables.islem}
            GROUP BY islemCrKod
            HAVING left(islemCrKod,1) = 'M' and (SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) -
                   SUM(CASE WHEN islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) > 0)
          ) BorcluMusteriler
        )
      `;
      
      const countResult: { TotalCount: number }[] = await this.musteriRepository.query(countQuery);
      const total = countResult[0]?.TotalCount || 0;
      
      console.log(`🔥 getBorcluMusteriler toplam kayıt: ${total}`);
      
      // Ana sorgu - pagination ile
      const query = `
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
          (
            SELECT 
              SUM(CASE WHEN i.islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN i.islemTutar ELSE 0 END) -
              SUM(CASE WHEN i.islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN i.islemTutar ELSE 0 END)
            FROM ${tables.islem} i 
            GROUP BY i.islemCrKod
            HAVING i.islemCrKod = c.CariKod and (SUM(CASE WHEN i.islemTip IN ('GELİR', 'Çıkan') and (i.islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and i.islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN i.islemTutar ELSE 0 END) -
                   SUM(CASE WHEN islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) > 0)
          ) as BorcTutari
        FROM ${tables.cari} c
        LEFT JOIN ${tables.musteri} m ON (
          (c.CariKod LIKE 'MB%' AND m.MstrNo = CAST(SUBSTRING(c.CariKod, 3, LEN(c.CariKod) - 2) AS INT)) OR
          (c.CariKod LIKE 'MK%' AND m.MstrNo = CAST(SUBSTRING(c.CariKod, 3, LEN(c.CariKod) - 2) AS INT))
        )
        WHERE left(c.CariKod,1)='M' AND c.CariKod IN (
          SELECT DISTINCT islemCrKod
          FROM (
            SELECT 
              islemCrKod,
              SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) -
              SUM(CASE WHEN islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) as MusteriBakiye
            FROM ${tables.islem}
            GROUP BY islemCrKod
            HAVING SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) -
                   SUM(CASE WHEN islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) > 0
          ) BorcluMusteriler
        )
        ORDER BY BorcTutari DESC, CONVERT(Date, c.cKytTarihi, 104) DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${limit} ROWS ONLY
      `;
      
      const result: any[] = await this.musteriRepository.query(query);
      console.log(`🔥 getBorcluMusteriler sayfa ${page} için ${result.length} kayıt bulundu`);
      
      // Her müşteri için ödeme vadesi hesapla (sadece bu sayfadaki)
      for (const musteri of result) {
        musteri.odemeVadesi = await this.hesaplaOdemeVadesi(musteri.CariKod);
      }
      
      // Ödeme vadesine göre küçükten büyüğe sırala, null/boş olanlar en sonda
      result.sort((a, b) => {
        if (!a.odemeVadesi && !b.odemeVadesi) return 0;
        if (!a.odemeVadesi) return 1;
        if (!b.odemeVadesi) return -1;
        // Tarih formatı: DD.MM.YYYY
        const [gA, aA, yA] = a.odemeVadesi.split('.').map(Number);
        const [gB, aB, yB] = b.odemeVadesi.split('.').map(Number);
        const tA = new Date(yA, aA - 1, gA).getTime();
        const tB = new Date(yB, aB - 1, gB).getTime();
        return tA - tB;
      });
      
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

  // Alacaklı Müşteriler - bakiyesi negatif olan müşteriler (işletme müşteriye borçlu)
  async getAlacakliMusteriler(): Promise<any[]> {
    try {
      const tables = this.dbConfig.getTables();
      
      // Önce alacaklı müşterileri bul
      const alacakliQuery = `
        SELECT 
          islemCrKod,
          SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) -
          SUM(CASE WHEN islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) as MusteriBakiye
        FROM ${tables.islem}
        GROUP BY islemCrKod
        HAVING SUM(CASE WHEN islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) -
               SUM(CASE WHEN islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar ELSE 0 END) < 0
      `;
      
      const alacakliMusteriler: { islemCrKod: string }[] = await this.musteriRepository.query(alacakliQuery);
      console.log('Alacaklı müşteri kodları:', alacakliMusteriler.length, 'kayıt bulundu');
      
      if (alacakliMusteriler.length === 0) {
        return [];
      }
      
      // Alacaklı müşteri kodlarını al
      const alacakliKodlar = alacakliMusteriler.map(m => m.islemCrKod).join("','");
      
      // Detaylı bilgileri getir
      const query = `
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
          ABS((
            SELECT 
              SUM(CASE WHEN i.islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN i.islemTutar ELSE 0 END) -
              SUM(CASE WHEN i.islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN i.islemTutar ELSE 0 END)
            FROM ${tables.islem} i 
            GROUP BY i.islemCrKod
            HAVING i.islemCrKod = c.CariKod and (SUM(CASE WHEN i.islemTip IN ('GELİR', 'Çıkan') and (i.islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and i.islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN i.islemTutar ELSE 0 END) -
                   SUM(CASE WHEN i.islemTip IN ('GİDER', 'Giren') and (i.islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and i.islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN i.islemTutar ELSE 0 END) < 0)
          )) as AlacakTutari
        FROM ${tables.cari} c
        LEFT JOIN ${tables.musteri} m ON (
          (c.CariKod LIKE 'MB%' AND m.MstrNo = CAST(SUBSTRING(c.CariKod, 3, LEN(c.CariKod) - 2) AS INT)) OR
          (c.CariKod LIKE 'MK%' AND m.MstrNo = CAST(SUBSTRING(c.CariKod, 3, LEN(c.CariKod) - 2) AS INT))
        )
        WHERE left(c.CariKod,1)='M' AND c.CariKod IN ('${alacakliKodlar}')
        ORDER BY AlacakTutari DESC, CONVERT(Date, c.cKytTarihi, 104) DESC
      `;
      
      const result: any[] = await this.musteriRepository.query(query);
      return result;
    } catch (error) {
      console.error('getAlacakliMusteriler hatası:', error);
      throw new Error('Alacaklı müşteri listesi alınamadı');
    }
  }

  // Cari Hareketler - seçilen müşterinin tüm işlemleri
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
      console.log(`${cariKod} için ${result.length} cari hareket bulundu`);
      return result;
    } catch (error) {
      console.error('getCariHareketler hatası:', error);
      throw new Error('Cari hareketler alınamadı');
    }
  }

  // Çıkış yapanlar - Her müşteri için en son konaklama kaydının çıkış tarihi bugünden küçük olanların sayısı
  async getCikisYapanlarSayisi(): Promise<number> {
    try {
      const tables = this.dbConfig.getTables();
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
          AND k2.kKytTarihi IS NOT NULL
          AND k2.kKytTarihi != ''
          AND CONVERT(Date, k2.kKytTarihi, 104) >= DATEADD(YEAR, -1, GETDATE())
      `;
      
      const result: { CikisYapanSayisi: number }[] = await this.musteriRepository.query(query);
      const sayisi = Number(result[0]?.CikisYapanSayisi || 0);
      console.log('Çıkış yapanlar sayısı:', sayisi);
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
      
      const result: any[] = await this.musteriRepository.query(query, [tcKimlik]);
      
      if (result.length > 0) {
        const kayit = result[0] as { KnklmKrLst: string; KnklmNot: string; knklmNo: number; MstrAdi: string; MstrTelNo: string; MstrFirma: string };
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
      console.log('🔥 getCikisYapanlarListesi - odaTipi:', odaTipi, 'decodedOdaTipi:', decodedOdaTipi);
      
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
            AND CONVERT(Date, k2.kKytTarihi, 104) >= DATEADD(YEAR, -1, GETDATE())
          GROUP BY KnklmOdaTip
          ORDER BY KnklmOdaTip
        `;
        
        try {
          const odaTipiKontrol = await this.musteriRepository.query(odaTipiKontrolQuery);
          console.log('🔥 DEBUG - Veritabanındaki oda tipleri:', odaTipiKontrol);
        } catch (error) {
          console.log('🔥 DEBUG - Oda tipi kontrol hatası:', error);
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
          AND CONVERT(Date, k2.kKytTarihi, 104) >= DATEADD(YEAR, -1, GETDATE())
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

      const result: MusteriKonaklamaData[] = await this.musteriRepository.query(query, parameters);
      console.log('Çıkış yapanlar listesi:', result.length, 'kayıt bulundu');
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
      console.log('Müşteri konaklama geçmişi:', result.length, 'kayıt bulundu');
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
      console.log(`Firma ${firmaAdi} için ${result.length} cari hareket bulundu`);
      return result;
    } catch (error) {
      console.error('getFirmaGenelCariHareketler hatası:', error);
      throw new Error('Firma genel cari hareketler alınamadı');
    }
  }

  // 🚨 KARA LİSTEDEN ÇIKARMA - Müşterinin son konaklama kaydındaki KnklmKrLst alanını NULL yapar
  async karaListedenCikar(tcKimlik: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('=== karaListedenCikar çağrıldı ===');
      console.log('TC Kimlik:', tcKimlik);
      
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
      
      console.log('Kara listeden çıkarma işlemi tamamlandı');
      console.log('Update result:', updateResult);
      
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
      console.log('Aylık gelir trendi sonucu:', result.length, 'ay bulundu');
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
      console.log('Oda tipi analizi sonucu:', result.length, 'oda tipi bulundu');
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
      const query = `
        SELECT 
          v.KnklmTip as KonaklamaTipi,
          COUNT(*) as MusteriSayisi,
          SUM(v.KnklmNfyt) as ToplamGelir,
          AVG(v.KnklmNfyt) as OrtalamaGelir,
          CAST(ROUND((COUNT(*) * 100.0) / (
            SELECT COUNT(*) 
            FROM ${views.musteriKonaklama} v2
            WHERE v2.MstrDurum = 'KALIYOR' 
              AND (v2.KnklmCksTrh = '' OR v2.KnklmCksTrh IS NULL)
              AND LEFT(v2.MstrAdi, 9) <> 'PERSONEL '
          ), 1) as DECIMAL(5,1)) as Yuzde
        FROM ${views.musteriKonaklama} v
        WHERE v.MstrDurum = 'KALIYOR' 
          AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
          AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
        GROUP BY v.KnklmTip
        ORDER BY MusteriSayisi DESC
      `;
      
      const result: any[] = await this.musteriRepository.query(query);
      console.log('Konaklama tipi dağılımı sonucu:', result.length, 'tip bulundu');
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
      console.log('Son 7 gün aktivite sonucu:', result.length, 'gün bulundu');
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
      
      const result: any[] = await this.musteriRepository.query(query);
      console.log('Firma analizi sonucu:', result.length, 'firma bulundu');
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
    console.log('🔍 Ödeme vadesi hesaplanıyor:', cariKod);
    const tables = this.dbConfig.getTables();
    const islemList: any[] = await this.musteriRepository.query(`
      SELECT islemTip, islemBilgi, islemTutar, iKytTarihi
      FROM ${tables.islem}
      WHERE islemCrKod = @0
      ORDER BY CONVERT(Date, iKytTarihi, 104) ASC
    `, [cariKod]);

    console.log('🔍 İşlem kayıtları bulundu:', islemList.length);

    let toplamTutar = 0;
    let toplamGun = 0;
    const now = new Date();

    for (const islem of islemList) {
      // Eğer islemBilgi'de 'DEPOZİTO' ifadesi geçiyorsa bu kaydı hesap dışı bırak
      // (Büyük/küçük harf duyarsız kontrol)
      if ((islem.islemBilgi || '').toUpperCase().includes('DEPOZİTO')) {
        console.log('🔍 DEPOZİTO kaydı atlandı:', islem.islemBilgi);
        continue;
      }
      
      let vadeTarihi: Date;
      const { islemTip, islemBilgi, islemTutar, iKytTarihi } = islem;

      if (islemTip === 'GELİR') {
        // islemBilgi'den vade tarihi çek (büyük/küçük harf duyarsız)
        const match = (islem.islemBilgi || '').match(/BAKİYE ÖDEME VADESİ: (\d{2}\.\d{2}\.\d{4})/i);
        if (match) {
          const [gun, ay, yil] = match[1].split('.').map(Number);
          vadeTarihi = new Date(yil, ay - 1, gun);
          console.log('🔍 GELİR vadesi bulundu:', match[1], 'Tutar:', islemTutar);
        } else {
          // Vade tarihi yoksa iKytTarihi'ni kullan
          vadeTarihi = this.parseDate(iKytTarihi);
          console.log('🔍 GELİR vadesi bulunamadı, iKytTarihi kullanılıyor:', iKytTarihi, 'Tutar:', islemTutar);
        }
      } else if (islemTip === 'Giren') {
        // Giren için iKytTarihi kullan
        vadeTarihi = this.parseDate(iKytTarihi);
        console.log('🔍 Giren işlemi kullanıldı, tarih:', iKytTarihi, 'Tutar:', islemTutar);
      } else if (islemTip === 'GİDER' || islemTip === 'Çıkan') {
        // GİDER/Çıkan için önce islemBilgi'den vade tarihi çek, yoksa iKytTarihi kullan
        const match = (islem.islemBilgi || '').match(/BAKİYE ÖDEME VADESİ: (\d{2}\.\d{2}\.\d{4})/i);
        if (match) {
          const [gun, ay, yil] = match[1].split('.').map(Number);
          vadeTarihi = new Date(yil, ay - 1, gun);
          console.log('🔍 GİDER/Çıkan vadesi bulundu:', match[1], 'Tutar:', islemTutar);
        } else {
          // Vade tarihi yoksa iKytTarihi'ni kullan
          vadeTarihi = this.parseDate(iKytTarihi);
          console.log('🔍 GİDER/Çıkan vadesi bulunamadı, iKytTarihi kullanılıyor:', iKytTarihi, 'Tutar:', islemTutar);
        }
      } else {
        console.log('🔍 Bilinmeyen işlem tipi atlandı:', islemTip);
        continue; // Tanımsız işlem tipleri atla
      }

      // Ağırlıklı ortalama hesaplama
      const fark = vadeTarihi.getTime() - now.getTime();
      const gun = fark / (24 * 60 * 60 * 1000);
      
      toplamTutar += Math.abs(islemTutar);
      toplamGun += gun * Math.abs(islemTutar);
      
      console.log('🔍 İşlem eklendi - Tip:', islemTip, 'Gün:', gun.toFixed(1), 'Tutar:', islemTutar);
    }

    if (toplamTutar === 0) {
      console.log('🔍 Toplam tutar sıfır, ödeme vadesi hesaplanamadı');
      return null;
    }

    const ortalamaGun = toplamGun / toplamTutar;
    const ortTarih = new Date(now.getTime() + (ortalamaGun * 24 * 60 * 60 * 1000));
    // Hesaplanan tarihe 1 gün ekle (iş kuralı gereği)
    ortTarih.setDate(ortTarih.getDate());
    // DD.MM.YYYY formatı
    const pad = (n: number) => n < 10 ? '0' + n : n;
    const tarihStr = pad(ortTarih.getDate()) + '.' + pad(ortTarih.getMonth() + 1) + '.' + ortTarih.getFullYear();
    
    console.log('🔍 Hesaplanan ödeme vadesi:', tarihStr, 'Ortalama gün:', ortalamaGun.toFixed(1));
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

} 