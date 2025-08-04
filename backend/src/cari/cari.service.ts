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
      const tables = this.dbConfig.getTables();
      const query = `
        SELECT CariKod, CariAdi
        FROM ${tables.cari}
        WHERE CariKod LIKE 'A%' OR CariKod LIKE 'CT%'
        ORDER BY CariAdi
      `;
      
      const result = await this.cariRepository.query(query);
      return result;
    } catch (error) {
      console.error('Tedarikçi listesi alınırken hata:', error);
      throw new Error('Tedarikçi listesi alınamadı');
    }
  }

  async getMusteriListesi() {
    try {
      const tables = this.dbConfig.getTables();
      const query = `
        SELECT CariKod, CariAdi
        FROM ${tables.cari}
        WHERE CariKod LIKE 'M%'
        ORDER BY CariAdi
      `;
      
      const result = await this.cariRepository.query(query);
      return result;
    } catch (error) {
      console.error('Müşteri listesi alınırken hata:', error);
      throw new Error('Müşteri listesi alınamadı');
    }
  }
} 