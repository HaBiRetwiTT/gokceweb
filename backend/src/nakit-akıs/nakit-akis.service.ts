import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DatabaseConfigService } from '../database/database-config.service';

export interface NakitAkisRecord {
  id?: number;
  tarih: string;
  aciklama: string;
  tip: string;
  tutar: number;
  kategori: string;
  islemler?: string;
}

@Injectable()
export class NakitAkisService {
  private readonly logger = new Logger(NakitAkisService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly dbConfig: DatabaseConfigService,
  ) {}

  /**
   * Belirli bir tarih için nakit akış verilerini getirir
   * @param tarih DD.MM.YYYY formatında tarih
   * @returns Nakit akış kayıtları
   */
  async getNakitAkisByDate(tarih: string): Promise<NakitAkisRecord[]> {
    try {
      this.logger.log(`📊 ${tarih} tarihi için nakit akış verileri getiriliyor...`);

      // Tarih formatını kontrol et (DD.MM.YYYY)
      if (!this.isValidDateFormat(tarih)) {
        throw new Error(`Geçersiz tarih formatı: ${tarih}. Beklenen format: DD.MM.YYYY`);
      }

      const spName = this.dbConfig.getStoredProcedures().fonDokumY;
      const queryRunner = this.dataSource.createQueryRunner();
      
      try {
        await queryRunner.connect();
        
        // Stored procedure'ü çağır
        const execQuery = `EXEC ${spName} @Sectarih = @0`;
        const params = [tarih];
        
        this.logger.debug(`🔍 SP çağrılıyor: ${execQuery}`, { params });
        
        const result = await queryRunner.query(execQuery, params);
        
        this.logger.log(`✅ ${result?.length || 0} kayıt bulundu`);
        
        // Sonuçları dönüştür
        const records: NakitAkisRecord[] = this.transformSpResult(result);
        
        return records;
        
      } finally {
        await queryRunner.release();
      }
      
    } catch (error) {
      this.logger.error(`❌ Nakit akış verileri alınırken hata: ${error.message}`, error.stack);
      throw new Error(`Nakit akış verileri alınamadı: ${error.message}`);
    }
  }

  /**
   * Bugünün tarihini DD.MM.YYYY formatında döndürür
   * @returns Bugünün tarihi
   */
  getTodayFormatted(): string {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  /**
   * Tarih formatının geçerli olup olmadığını kontrol eder
   * @param tarih Kontrol edilecek tarih string'i
   * @returns Geçerli ise true
   */
  private isValidDateFormat(tarih: string): boolean {
    const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
    if (!dateRegex.test(tarih)) {
      return false;
    }
    
    const parts = tarih.split('.');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    // Basit tarih validasyonu
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
      return false;
    }
    
    return true;
  }

  /**
   * Stored procedure sonucunu NakitAkisRecord formatına dönüştürür
   * @param spResult Stored procedure sonucu
   * @returns Dönüştürülmüş kayıtlar
   */
  private transformSpResult(spResult: any[]): NakitAkisRecord[] {
    if (!Array.isArray(spResult)) {
      this.logger.warn('⚠️ SP sonucu array değil, boş array döndürülüyor');
      return [];
    }

    return spResult.map((row, index) => {
      // SP'den dönen alanları map et
      // Bu kısım SP'nin döndürdüğü gerçek alan adlarına göre ayarlanmalı
      const record: NakitAkisRecord = {
        id: index + 1, // Geçici ID
        tarih: row.Tarih || row.tarih || row.TARIH || '',
        aciklama: row.Aciklama || row.aciklama || row.ACIKLAMA || row.Acik || row.acik || '',
        tip: row.Tip || row.tip || row.TIP || row.IslemTip || row.islemTip || '',
        tutar: parseFloat(row.Tutar || row.tutar || row.TUTAR || row.Miktar || row.miktar || '0') || 0,
        kategori: row.Kategori || row.kategori || row.KATEGORI || row.Grup || row.grup || '',
        islemler: '', // Boş bırak, frontend'de doldurulacak
      };

      // Boş alanları temizle
      Object.keys(record).forEach(key => {
        if (typeof record[key] === 'string' && record[key].trim() === '') {
          record[key] = '-';
        }
      });

      return record;
    });
  }

  /**
   * Test amaçlı örnek veri döndürür
   * @returns Örnek nakit akış kayıtları
   */
  getSampleData(): NakitAkisRecord[] {
    return [
      {
        id: 1,
        tarih: this.getTodayFormatted(),
        aciklama: 'Oda kirası geliri',
        tip: 'GELİR',
        tutar: 150.00,
        kategori: 'Konaklama',
        islemler: 'Düzenle | Sil'
      },
      {
        id: 2,
        tarih: this.getTodayFormatted(),
        aciklama: 'Market alışverişi',
        tip: 'GİDER',
        tutar: 85.50,
        kategori: 'Gıda',
        islemler: 'Düzenle | Sil'
      },
      {
        id: 3,
        tarih: this.getTodayFormatted(),
        aciklama: 'Temizlik malzemeleri',
        tip: 'GİDER',
        tutar: 45.00,
        kategori: 'Temizlik',
        islemler: 'Düzenle | Sil'
      }
    ];
  }

  /**
   * OdmVade bilgisi günün tarihinden eski olan ve OdmDrm = 0 olan kayıtların
   * OdmVade bilgisini günün tarihi ile günceller
   * @returns Güncellenen kayıt sayısı
   */
  async updateEskiOdmVadeKayitlari(): Promise<{ success: boolean; updatedCount: number; message: string }> {
    try {
      this.logger.log('🔄 Eski OdmVade kayıtları güncelleniyor...');

      const queryRunner = this.dataSource.createQueryRunner();
      
      try {
        await queryRunner.connect();
        
        // tblFonKasaY tablo adını al
        const fonKasaYTableName = this.dbConfig.getTableName('tblFonKasaY');
        
        // Önce güncellenecek kayıt sayısını bul
        // CONVERT(DATE, OdmVade, 104) ile DD.MM.YYYY formatındaki tarihi DATE'e çeviriyoruz
        // GETDATE() ile SQL Server'ın bugünün tarihini alıyoruz
        const yearCutoff = '2024';
        const countQuery = `
          SELECT COUNT(*) as count
          FROM ${fonKasaYTableName}
          WHERE Right(RTRIM(OdmVade),4) > @0 
            AND TRY_CONVERT(DATE, OdmVade, 104) < CAST(GETDATE() AS DATE)
            AND OdmDrm = 0
        `;
        
        const countResult = await queryRunner.query(countQuery, [yearCutoff]);
        const count = countResult?.[0]?.count || 0;
        
        if (count === 0) {
          this.logger.log('ℹ️ Güncellenecek kayıt bulunamadı');
          return {
            success: true,
            updatedCount: 0,
            message: 'Güncellenecek kayıt bulunamadı'
          };
        }
        
        // OdmVade < bugünün tarihi ve OdmDrm = 0 olan kayıtları bul ve güncelle
        // CONVERT(nchar(10), GETDATE(), 104) ile bugünün tarihini DD.MM.YYYY formatında string olarak alıyoruz
        const updateQuery = `
          UPDATE ${fonKasaYTableName}
          SET OdmVade = CONVERT(nchar(10), GETDATE(), 104), ttrDrm = 1
          WHERE Right(RTRIM(OdmVade),4) > @0 
            AND TRY_CONVERT(DATE, OdmVade, 104) < CAST(GETDATE() AS DATE)
            AND OdmDrm = 0
        `;
        
        this.logger.debug(`🔍 Update query: ${updateQuery}`);
        
        await queryRunner.query(updateQuery, [yearCutoff]);
        
        this.logger.log(`✅ ${count} kayıt güncellendi`);
        
        return {
          success: true,
          updatedCount: count,
          message: `${count} kayıt güncellendi`
        };
        
      } finally {
        await queryRunner.release();
      }
      
    } catch (error) {
      this.logger.error(`❌ Eski OdmVade kayıtları güncellenirken hata: ${error.message}`, error.stack);
      return {
        success: false,
        updatedCount: 0,
        message: `Hata: ${error.message}`
      };
    }
  }
}