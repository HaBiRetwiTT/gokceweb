import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cari } from '../entities/cari.entity';
import { DatabaseConfigService } from '../database/database-config.service';

@Injectable()
export class CariService {
  constructor(
    @InjectRepository(Cari)
    private cariRepository: Repository<Cari>,
    private dbConfig: DatabaseConfigService
  ) {}

  async getTedarikciListesi() {
    try {
      console.log('Tedarikçi listesi isteniyor...');
      
      // Kartli-islem sayfasında kullanılan bakiye hesaplama sorgusu
      const bakiyeQuery = `
        SELECT 
          c.CariKod,
          c.CariAdi,
          ISNULL(SUM(
            CASE 
              WHEN i.islemTip IN ('GELİR', 'Çıkan') and (i.islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and i.islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN i.islemTutar 
              WHEN i.islemTip IN ('GİDER', 'Giren') and (i.islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and i.islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN -i.islemTutar
              ELSE 0
            END
          ), 0) as CariBakiye
        FROM tblCari c
        LEFT JOIN tblislem i ON c.CariKod = i.islemCrKod
        WHERE (c.CariKod LIKE 'A%' OR c.CariKod LIKE 'CT%')
          AND (i.islemBilgi IS NULL OR (i.islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND i.islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%'))
        GROUP BY c.CariKod, c.CariAdi
        ORDER BY c.CariAdi ASC
      `;
      
      const result = await this.cariRepository.query(bakiyeQuery);
      
      console.log('Tedarikçi listesi sonucu:', result);
      console.log('Tedarikçi sayısı:', result.length);
      
      return result;
    } catch (error) {
      console.error('Tedarikçi listesi alınırken hata:', error);
      console.error('Hata detayı:', error.message);
      console.error('Hata stack:', error.stack);
      throw new Error(`Tedarikçi listesi alınamadı: ${error.message}`);
    }
  }

  async getMusteriListesi() {
    try {
      console.log('Müşteri listesi isteniyor...');
      
      // Müşteri listesini tblMusteri tablosundan al ve cari kodları oluştur
      const musteriQuery = `
        SELECT 
          IIF(MstrHspTip = 'Kurumsal', 'MK' + CAST(MstrNo AS VARCHAR(10)), 'MB' + CAST(MstrNo AS VARCHAR(10))) as CariKod,
          MstrAdi as CariAdi,
          MstrNo,
          MstrHspTip
        FROM tblMusteri
        WHERE MstrAdi IS NOT NULL 
          AND MstrAdi <> ''
          AND LEFT(MstrAdi, 9) <> 'PERSONEL '
        ORDER BY MstrAdi ASC
      `;
      
      const musteriler = await this.cariRepository.query(musteriQuery);
      
      // Her müşteri için bakiye hesapla
      const result: Array<{ CariKod: string; CariAdi: string; CariBakiye: number }> = [];
      for (const musteri of musteriler) {
        const bakiyeQuery = `
          SELECT 
            ISNULL(SUM(
              CASE 
                WHEN islemTip IN ('GELİR', 'Çıkan') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN islemTutar 
                WHEN islemTip IN ('GİDER', 'Giren') and (islemBilgi not like '%=DEPOZİTO TAHSİLATI=%' and islemBilgi not like '%=DEPOZİTO İADESİ=%') THEN -islemTutar
                ELSE 0
              END
            ), 0) as CariBakiye
          FROM tblislem
          WHERE islemCrKod = @0
            AND (islemBilgi IS NULL OR (islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%'))
        `;
        
        const bakiyeResult = await this.cariRepository.query(bakiyeQuery, [musteri.CariKod]);
        const bakiye = Number(bakiyeResult[0]?.CariBakiye || 0);
        
        result.push({
          CariKod: musteri.CariKod,
          CariAdi: musteri.CariAdi,
          CariBakiye: bakiye
        });
      }
      
      console.log('Müşteri listesi sonucu:', result);
      console.log('Müşteri sayısı:', result.length);
      
      return result;
    } catch (error) {
      console.error('Müşteri listesi alınırken hata:', error);
      console.error('Hata detayı:', error.message);
      console.error('Hata stack:', error.stack);
      throw new Error(`Müşteri listesi alınamadı: ${error.message}`);
    }
  }
} 