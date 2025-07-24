import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parametre } from './entities/parametre.entity';
import { DatabaseConfigService } from './database/database-config.service';

@Injectable()
export class ParametreService {
  constructor(
    @InjectRepository(Parametre)
    private readonly parametreRepository: Repository<Parametre>,
    private readonly dbConfig: DatabaseConfigService,
  ) {}

  async getEkHizmetler(): Promise<{ Prm01: string; PrmAdi: string; Prm04: number }[]> {
    const tables = this.dbConfig.getTables();
    const query = `
        SELECT Prm01, PrmAdi, Prm04
        FROM ${tables.parametreler}
        WHERE Prm01 IN ('1','2','3','4','5','6')
        ORDER BY Prm01
    `;
    console.log('🔥 PRODUCTION DEBUG - Environment:', process.env.NODE_ENV);
    console.log('🔥 PRODUCTION DEBUG - Table schema:', tables.parametreler);
    console.log('🔥 PRODUCTION DEBUG - Query:', query);
    
    try {
      const result = await this.parametreRepository.query(query);
      console.log('🔥 PRODUCTION DEBUG - Result:', result);
      return result;
    } catch (error) {
      console.error('🔥 PRODUCTION DEBUG - Query ERROR:', error);
      throw error;
    }
  }

  async getKomisyonOrani(): Promise<number | null> {
    const tables = this.dbConfig.getTables();
    const query = `
      SELECT TOP 1 Prm04
      FROM ${tables.parametreler}
      WHERE Prm01 = '8'
    `;
    console.log('🔥 KOMISYON DEBUG - Table schema:', tables.parametreler);
    console.log('🔥 KOMISYON DEBUG - Query:', query);
    
    try {
      const result = await this.parametreRepository.query(query);
      console.log('🔥 KOMISYON DEBUG - Result:', result);
      return result[0]?.Prm04 ?? null;
    } catch (error) {
      console.error('🔥 KOMISYON DEBUG - Query ERROR:', error);
      throw error;
    }
  }
} 