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
      
      const result = await this.cariRepository
        .createQueryBuilder('cari')
        .select(['cari.CariKod as CariKod', 'cari.CariAdi as CariAdi'])
        .where('cari.CariKod LIKE :prefix1 OR cari.CariKod LIKE :prefix2', {
          prefix1: 'A%',
          prefix2: 'CT%'
        })
        .orderBy('cari.CariAdi', 'ASC')
        .getRawMany();
      
      // Test amaçlı bakiye bilgisi ekle
      const resultWithBakiye = result.map(item => ({
        ...item,
        CariBakiye: (Math.random() * 10000 - 5000).toFixed(2) // -5000 ile +5000 arası rastgele bakiye
      }));
      
      console.log('Tedarikçi listesi sonucu:', resultWithBakiye);
      console.log('Tedarikçi sayısı:', resultWithBakiye.length);
      
      return resultWithBakiye;
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
      
      const result = await this.cariRepository
        .createQueryBuilder('cari')
        .select(['cari.CariKod as CariKod', 'cari.CariAdi as CariAdi'])
        .where('cari.CariKod LIKE :prefix', { prefix: 'M%' })
        .orderBy('cari.CariAdi', 'ASC')
        .getRawMany();
      
      // Test amaçlı bakiye bilgisi ekle
      const resultWithBakiye = result.map(item => ({
        ...item,
        CariBakiye: (Math.random() * 10000 - 5000).toFixed(2) // -5000 ile +5000 arası rastgele bakiye
      }));
      
      console.log('Müşteri listesi sonucu:', resultWithBakiye);
      console.log('Müşteri sayısı:', resultWithBakiye.length);
      
      return resultWithBakiye;
    } catch (error) {
      console.error('Müşteri listesi alınırken hata:', error);
      console.error('Hata detayı:', error.message);
      console.error('Hata stack:', error.stack);
      throw new Error(`Müşteri listesi alınamadı: ${error.message}`);
    }
  }
} 