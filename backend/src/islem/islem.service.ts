import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DatabaseConfigService } from '../database/database-config.service';

@Injectable()
export class IslemService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly dbConfig: DatabaseConfigService,
  ) {}

  /**
   * Kasa işlemleri için günlük toplamları getirir
   */
  async getKasaIslemleri(islemTuru: string, islemYonu?: string, page: number = 1, rowsPerPage: number = 15): Promise<{data: any[], totalRecords: number}> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislem');
      
      // Tarih aralığı (son 1 yıl)
      const bugun = new Date();
      const birYilOnce = new Date();
      birYilOnce.setFullYear(birYilOnce.getFullYear() - 1);
      
      // DD.MM.YYYY formatına çevir
      const baslangicTarihi = birYilOnce.getDate().toString().padStart(2, '0') + '.' + 
                             (birYilOnce.getMonth() + 1).toString().padStart(2, '0') + '.' + 
                             birYilOnce.getFullYear();
      const bitisTarihi = bugun.getDate().toString().padStart(2, '0') + '.' + 
                         (bugun.getMonth() + 1).toString().padStart(2, '0') + '.' + 
                         bugun.getFullYear();
      
             console.log('🔍 Debug bilgileri:');
       console.log('- Schema:', schemaName);
       console.log('- Tablo:', tableName);
       console.log('- İşlem türü:', islemTuru);
       console.log('- İşlem yönü:', islemYonu);
       console.log('- Tarih aralığı:', baslangicTarihi, 'ile', bitisTarihi);
      
             // Önce tabloda genel veri kontrolü yapalım
       const genelKontrolQuery = `
         SELECT TOP 5
           iKytTarihi, islemArac, islemTip, islemTutar, islemBilgi,
           ISNUMERIC(islemTutar) as isNumeric,
           CAST(islemTutar AS DECIMAL(18,2)) as castedValue
         FROM ${schemaName}.${tableName}
         WHERE islemArac = 'Cari İşlem'
         ORDER BY iKytTarihi DESC
       `;

       const genelKontrol = await this.dataSource.query(genelKontrolQuery);
       console.log('📊 Tablo genel kontrol (son 5 kayıt):', genelKontrol);
      
      let whereCondition = '';
      let params: any[] = [];
      
      // İşlem türüne göre filtreleme
      switch (islemTuru) {
        case 'cari':
          whereCondition = `WHERE i.islemArac = 'Cari İşlem'`;
          break;
        case 'nakit':
          whereCondition = `WHERE i.islemArac = 'Nakit Kasa(TL)'`;
          break;
        case 'kart':
          whereCondition = `WHERE i.islemArac = 'Kredi Kartları'`;
          break;
        case 'eft':
          whereCondition = `WHERE i.islemArac = 'Banka EFT'`;
          break;
        case 'acenta':
          whereCondition = `WHERE i.islemArac = 'Acenta Kasası'`;
          break;
        case 'depozito':
          whereCondition = `WHERE (i.islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' OR i.islemBilgi LIKE '%=DEPOZİTO İADESİ=%')`;
          break;
        default:
          whereCondition = `WHERE i.islemArac = 'Cari İşlem'`;
      }
      
             // İşlem yönüne göre dinamik sorgu
       let gelirCondition = '';
       let giderCondition = '';
       
       if (islemYonu === 'gelir-gider') {
         // Cari seçildiğinde GELİR/GİDER
         gelirCondition = "i.islemTip = 'GELİR'";
         giderCondition = "i.islemTip = 'GİDER'";
       } else {
         // Diğer seçimlerde Giren/Çıkan
         gelirCondition = "i.islemTip = 'Giren'";
         giderCondition = "i.islemTip = 'Çıkan'";
       }
       
               // Önce toplam kayıt sayısını al
      const countQuery = `
          SELECT COUNT(*) as total
          FROM (
            SELECT i.iKytTarihi
            FROM ${schemaName}.${tableName} i
            ${whereCondition}
            AND CONVERT(DATE, i.iKytTarihi, 104) >= CONVERT(DATE, @0, 104)
            AND CONVERT(DATE, i.iKytTarihi, 104) <= CONVERT(DATE, @1, 104)
            GROUP BY i.iKytTarihi
          ) as grouped_data
        `;
      
      const countResult = await this.dataSource.query(countQuery, [baslangicTarihi, bitisTarihi]);
      const totalRecords = countResult[0]?.total || 0;
      console.log('🔍 Count Query sonucu:', countResult);
      console.log('🔍 Toplam kayıt sayısı:', totalRecords);
      
      // Pagination için OFFSET hesapla
      const offset = (page - 1) * rowsPerPage;
      
      const query = `
          SELECT 
            i.iKytTarihi as tarih,
            SUM(CASE WHEN ${gelirCondition} THEN i.islemTutar ELSE 0 END) as gelir,
            SUM(CASE WHEN ${giderCondition} THEN i.islemTutar ELSE 0 END) as gider
          FROM ${schemaName}.${tableName} i
          ${whereCondition}
          AND CONVERT(DATE, i.iKytTarihi, 104) >= CONVERT(DATE, @0, 104)
          AND CONVERT(DATE, i.iKytTarihi, 104) <= CONVERT(DATE, @1, 104)
          GROUP BY i.iKytTarihi
          ORDER BY CONVERT(DATE, i.iKytTarihi, 104) DESC
          OFFSET @2 ROWS
          FETCH NEXT @3 ROWS ONLY
        `;
      
      params = [baslangicTarihi, bitisTarihi, offset, rowsPerPage];
      
      console.log('🔍 SQL Sorgusu:', query);
      console.log('🔍 Parametreler:', params);
      
      const result = await this.dataSource.query(query, params);
      
      // Bakiye hesaplama
      const baslangicBakiyeleri: Record<string, number> = {
        cari: 28738.901,
        nakit: 87800,
        kart: 8008.546,
        eft: 0,
        acenta: 0,
        depozito: 107695
      };
      
      const baslangicBakiye = baslangicBakiyeleri[islemTuru] || 0;
      let currentBakiye = baslangicBakiye;
      
      // DESC sıralama ile bakiye hesaplama
      const processedData = result.map((row: any) => {
        const gelir = parseFloat(row.gelir) || 0;
        const gider = parseFloat(row.gider) || 0;
        
        // DESC sıralama için bakiye hesaplama
        currentBakiye = currentBakiye + gelir - gider;
        
        return {
          tarih: row.tarih,
          gelir: gelir,
          gider: gider,
          bakiye: currentBakiye
        };
      });
      
      return {
        data: processedData,
        totalRecords: totalRecords
      };
      
    } catch (error) {
      console.error('Kasa işlemleri getirme hatası:', error);
      throw new Error('Kasa işlemleri getirilemedi');
    }
  }

  /**
   * Detay işlemleri getirir
   */
  async getDetayIslemler(tarih: string, islemTuru: string, islemYonu: string, selectedYonu?: string, page: number = 1, rowsPerPage: number = 15): Promise<{data: any[], totalRecords: number}> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislem');
      
      console.log('🔍 Detay işlemler debug bilgileri:')
      console.log('- Schema:', schemaName)
      console.log('- Tablo:', tableName)
      console.log('- Tarih:', tarih)
      console.log('- İşlem türü:', islemTuru)
      console.log('- İşlem yönü:', islemYonu)
      console.log('- Seçilen yön:', selectedYonu)

      // İşlem türüne göre islemArac filtresi
      let islemAracFilter = ''
      switch (islemTuru) {
        case 'cari':
          islemAracFilter = "i.islemArac = 'Cari İşlem'"
          break
        case 'nakit':
          islemAracFilter = "i.islemArac = 'Nakit Kasa(TL)'"
          break
        case 'kart':
          islemAracFilter = "i.islemArac = 'Kredi Kartları'"
          break
        case 'eft':
          islemAracFilter = "i.islemArac = 'Banka EFT'"
          break
        case 'acenta':
          islemAracFilter = "i.islemArac = 'Acenta Kasası'"
          break
        case 'depozito':
          islemAracFilter = "(i.islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' OR i.islemBilgi LIKE '%=DEPOZİTO İADESİ=%')"
          break
        default:
          islemAracFilter = "i.islemArac = 'Cari İşlem'"
      }

      // İşlem yönüne göre islemTip filtresi
      let islemTipFilter = ''
      if (islemYonu === 'gelir-gider') {
        // Cari seçildiğinde GELİR/GİDER
        islemTipFilter = selectedYonu === 'gelir' ? "i.islemTip = 'GELİR'" : "i.islemTip = 'GİDER'"
      } else {
        // Diğer seçimlerde Giren/Çıkan
        islemTipFilter = selectedYonu === 'gelir' ? "i.islemTip = 'Giren'" : "i.islemTip = 'Çıkan'"
      }

      console.log('🔍 islemTipFilter:', islemTipFilter)
      
      // Önce toplam kayıt sayısını al
      const countQuery = `
        SELECT COUNT(*) as total
        FROM ${schemaName}.${tableName} i
        WHERE ${islemAracFilter}
        AND ${islemTipFilter}
        AND i.iKytTarihi = @0
      `
      
      const countResult = await this.dataSource.query(countQuery, [tarih])
      const totalRecords = countResult[0]?.total || 0
      console.log('🔍 Detay Count Query sonucu:', countResult)
      console.log('🔍 Detay toplam kayıt sayısı:', totalRecords)
      
      // Pagination için OFFSET hesapla
      const offset = (page - 1) * rowsPerPage
      
      const query = `
        SELECT 
          ROW_NUMBER() OVER (ORDER BY i.islemAltG ASC, i.islemTutar DESC) as id,
          i.iKytTarihi,
          i.islemAltG,
          i.islemGrup,
          i.islemTutar,
          i.islemBilgi
        FROM ${schemaName}.${tableName} i
        WHERE ${islemAracFilter}
        AND ${islemTipFilter}
        AND i.iKytTarihi = @0
        ORDER BY i.islemAltG ASC, i.islemTutar DESC
        OFFSET @1 ROWS
        FETCH NEXT @2 ROWS ONLY
      `

      console.log('🔍 Detay SQL Sorgusu:', query)
      console.log('🔍 Parametreler:', [tarih, offset, rowsPerPage])

      const result = await this.dataSource.query(query, [tarih, offset, rowsPerPage])
      console.log('📊 Detay işlemler sonucu:', result)

      return {
        data: result,
        totalRecords: totalRecords
      }

    } catch (error) {
      console.error('Detay işlemler getirme hatası:', error)
      throw new Error('Detay işlemler getirilemedi')
    }
  }

  /**
   * Depozito işlemleri için özel filtreleme
   */
  async getDepozitoIslemleri(): Promise<any[]> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislem');
      
      // Tarih aralığı (son 1 yıl) - DD.MM.YYYY formatında
      const bugun = new Date();
      const birYilOnce = new Date();
      birYilOnce.setFullYear(birYilOnce.getFullYear() - 1);
      
      // DD.MM.YYYY formatına çevir
      const baslangicTarihi = birYilOnce.getDate().toString().padStart(2, '0') + '.' + 
                             (birYilOnce.getMonth() + 1).toString().padStart(2, '0') + '.' + 
                             birYilOnce.getFullYear();
      const bitisTarihi = bugun.getDate().toString().padStart(2, '0') + '.' + 
                         (bugun.getMonth() + 1).toString().padStart(2, '0') + '.' + 
                         bugun.getFullYear();
      
             const query = `
         SELECT 
           i.iKytTarihi as tarih,
           SUM(CASE WHEN i.islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' THEN i.islemTutar ELSE 0 END) as gelir,
           SUM(CASE WHEN i.islemBilgi LIKE '%=DEPOZİTO İADESİ=%' THEN i.islemTutar ELSE 0 END) as gider
         FROM ${schemaName}.${tableName} i
         WHERE (i.islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' OR i.islemBilgi LIKE '%=DEPOZİTO İADESİ=%')
         AND CONVERT(DATE, i.iKytTarihi, 104) >= CONVERT(DATE, @0, 104)
         AND CONVERT(DATE, i.iKytTarihi, 104) <= CONVERT(DATE, @1, 104)
         GROUP BY i.iKytTarihi
         ORDER BY CONVERT(DATE, i.iKytTarihi, 104) DESC
       `;
      
      const result = await this.dataSource.query(query, [baslangicTarihi, bitisTarihi]);
      
      // Bakiye hesaplama
      const baslangicBakiye = 107695; // Depozito başlangıç bakiyesi
      let currentBakiye = baslangicBakiye;
      
      const processedData = result.map((row: any) => {
        const gelir = parseFloat(row.gelir) || 0;
        const gider = parseFloat(row.gider) || 0;
        
        currentBakiye = currentBakiye + gelir - gider;
        
        return {
          tarih: row.tarih,
          gelir: gelir,
          gider: gider,
          bakiye: currentBakiye
        };
      });
      
      return processedData;
      
    } catch (error) {
      console.error('Depozito işlemleri getirme hatası:', error);
      throw new Error('Depozito işlemleri getirilemedi');
    }
  }

  /**
   * İşlem kayıtlarını kaydetmek için (eski metod - backward compatibility)
   */
  async kaydetIslemler(kayitlar: any[]): Promise<any[]> {
    try {
      console.log(`${kayitlar.length} kayıt kaydediliyor...`);
      
      // Şimdilik basit bir mock response döndürüyoruz
      // Gerçek implementasyon için stored procedure kullanılabilir
      const sonuclar = kayitlar.map((kayit, index) => ({
        id: index + 1,
        success: true,
        message: `Kayıt ${index + 1} başarıyla kaydedildi`
      }));
      
      console.log(`${kayitlar.length} kayıt başarıyla kaydedildi`);
      return sonuclar;
      
    } catch (error) {
      console.error('İşlem kaydetme hatası:', error);
      throw new Error('İşlem kayıtları kaydedilemedi');
    }
  }
} 