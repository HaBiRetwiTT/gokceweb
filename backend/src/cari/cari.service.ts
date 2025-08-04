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
      
      const tables = this.dbConfig.getTables();
      console.log('Tablo adı:', tables.cari);
      
      const query = `
        SELECT CariKod, CariAdi
        FROM ${tables.cari}
        WHERE CariKod LIKE 'A%' OR CariKod LIKE 'CT%'
        ORDER BY CariAdi
      `;
      
      console.log('SQL Query:', query);
      
      const result = await this.cariRepository.query(query);
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
      
      const tables = this.dbConfig.getTables();
      console.log('Tablo adı:', tables.cari);
      
      const query = `
        SELECT CariKod, CariAdi
        FROM ${tables.cari}
        WHERE CariKod LIKE 'M%'
        ORDER BY CariAdi
      `;
      
      console.log('SQL Query:', query);
      
      const result = await this.cariRepository.query(query);
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