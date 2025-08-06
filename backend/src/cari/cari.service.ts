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
      
      // Müşteri listesini tblCari tablosundan al (M% ile başlayan kodlar)
      const musteriQuery = `
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
        WHERE c.CariKod LIKE 'M%'
          AND (i.islemBilgi IS NULL OR (i.islemBilgi NOT LIKE '%=DEPOZİTO TAHSİLATI=%' AND i.islemBilgi NOT LIKE '%=DEPOZİTO İADESİ=%'))
        GROUP BY c.CariKod, c.CariAdi
        ORDER BY c.CariAdi ASC
      `;
      
      console.log('Müşteri sorgusu çalıştırılıyor...');
      const result = await this.cariRepository.query(musteriQuery);
      console.log('Müşteri sorgusu sonucu:', result.length, 'kayıt bulundu');
      
      console.log('Müşteri listesi sonucu:', result.length, 'kayıt');
      console.log('Müşteri sayısı:', result.length);
      
      return result;
    } catch (error) {
      console.error('Müşteri listesi alınırken hata:', error);
      console.error('Hata detayı:', error.message);
      console.error('Hata stack:', error.stack);
      
      // Hata durumunda test verilerini döndür
      console.log('Hata durumunda test verileri döndürülüyor...');
      return [
        { CariKod: 'MB10001', CariAdi: 'TEST MÜŞTERİ 1', CariBakiye: 0 },
        { CariKod: 'MB10002', CariAdi: 'TEST MÜŞTERİ 2', CariBakiye: 0 },
        { CariKod: 'MB10003', CariAdi: 'TEST MÜŞTERİ 3', CariBakiye: 0 }
      ];
    }
  }
} 