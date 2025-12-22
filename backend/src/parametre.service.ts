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

  async getEkHizmetler(): Promise<
    { Prm01: string; PrmAdi: string; Prm04: number }[]
  > {
    const tables = this.dbConfig.getTables();
    const query = `
        SELECT Prm01, PrmAdi, Prm04
        FROM ${tables.parametreler}
        WHERE Prm01 IN (@0, @1, @2, @3, @4, @5)
        ORDER BY Prm01
    `;
    // debug
    // this.debugLog('Table:', tables.parametreler, 'Query:', query);

    try {
      const resultUnknown = await this.parametreRepository.query(query, [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
      ]);
      const result = resultUnknown as Array<{
        Prm01: string;
        PrmAdi: string;
        Prm04: number;
      }>;
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
      WHERE Prm01 = @0
    `;
    // debug
    // this.debugLog('Komisyon table:', tables.parametreler, 'Query:', query);

    try {
      const resultUnknown = await this.parametreRepository.query(query, ['8']);
      const result = resultUnknown as Array<{ Prm04: number | null }>;
      return result[0]?.Prm04 ?? null;
    } catch (error) {
      console.error('🔥 KOMISYON DEBUG - Query ERROR:', error);
      throw error;
    }
  }

  async getGecSaatSonu(): Promise<number> {
    const tables = this.dbConfig.getTables();
    const query = `
      SELECT TOP 1 Prm04
      FROM ${tables.parametreler}
      WHERE PrmAdi = @0
    `;

    try {
      const resultUnknown = await this.parametreRepository.query(query, [
        'GecSaatSonu',
      ]);
      const result = resultUnknown as Array<{ Prm04: number | null }>;
      return result[0]?.Prm04 ?? 6; // Default 6 (saat)
    } catch (error) {
      console.error('🔥 GecSaatSonu Query ERROR:', error);
      return 6; // Hata durumunda default
    }
  }

  async updateGecSaatSonu(yeniSaat: number): Promise<boolean> {
    const tables = this.dbConfig.getTables();
    const query = `
      UPDATE ${tables.parametreler}
      SET Prm04 = @0
      WHERE PrmAdi = @1
    `;

    try {
      await this.parametreRepository.query(query, [yeniSaat, 'GecSaatSonu']);
      console.log(`✅ GecSaatSonu güncellendi: ${yeniSaat}:00`);
      return true;
    } catch (error) {
      console.error('🔥 GecSaatSonu UPDATE ERROR:', error);
      return false;
    }
  }
}
