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
}
