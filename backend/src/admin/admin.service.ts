import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DatabaseConfigService } from '../database/database-config.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly dbConfig: DatabaseConfigService,
  ) {}

  /**
   * tblOdaTipLfyt tablosundan tüm kayıtları getirir
   */
  async getOdaTipLifyat(): Promise<any[]> {
    try {
      const odaTipLifyatTableName = this.dbConfig.getTableName('tblOdaTipLfyt');
      const query = `
        SELECT 
          OdTipNo,
          OdTipAdi,
          OdLfytGun,
          OdLfytHft,
          OdLfytAyl,
          OdDpzt
        FROM ${odaTipLifyatTableName}
        ORDER BY OdTipNo
      `;

      console.log('🔥 Admin - Oda Tip Lifyat Query:', query);

      const result = await this.dataSource.query(query);
      console.log('🔥 Admin - Oda Tip Lifyat Result:', result);

      return result;
    } catch (error) {
      console.error('🔥 Admin - Oda Tip Lifyat getirme hatası:', error);
      throw new Error(
        `Oda tip lifyat verileri alınırken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
      );
    }
  }

  /**
   * tblOdaTipLfyt tablosunda kayıtları günceller
   */
  async updateOdaTipLifyat(kayitlar: any[]): Promise<any[]> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Transaction timeout'u artır (60 saniye)
      await queryRunner.manager.query('SET LOCK_TIMEOUT 60000');

      const guncellenenKayitlar: any[] = [];

      for (const kayit of kayitlar) {
        try {
          // UPDATE sorgusu
          const odaTipLifyatTableName =
            this.dbConfig.getTableName('tblOdaTipLfyt');
          const updateQuery = `
            UPDATE ${odaTipLifyatTableName}
            SET 
              OdLfytGun = @0,
              OdLfytHft = @1,
              OdLfytAyl = @2,
              OdDpzt = @3
            WHERE OdTipNo = @4
          `;

          const updateParams = [
            kayit.OdLfytGun || 0, // @0 - OdLfytGun (Günlük Lifyat)
            kayit.OdLfytHft || 0, // @1 - OdLfytHft (Haftalık Lifyat)
            kayit.OdLfytAyl || 0, // @2 - OdLfytAyl (Aylık Lifyat)
            kayit.OdDpzt || 0, // @3 - OdDpzt (Depozito)
            kayit.OdTipNo, // @4 - OdTipNo (WHERE koşulu)
          ];

          console.log('🔥 Admin - UPDATE Query:', updateQuery);
          console.log('🔥 Admin - UPDATE Params:', updateParams);

          const updateResult = await queryRunner.manager.query(
            updateQuery,
            updateParams,
          );
          console.log('🔥 Admin - UPDATE Result:', updateResult);

          // Güncellenen kaydı listeye ekle
          guncellenenKayitlar.push({
            OdTipNo: kayit.OdTipNo,
            OdTipAdi: kayit.OdTipAdi,
            OdLfytGun: kayit.OdLfytGun || 0,
            OdLfytHft: kayit.OdLfytHft || 0,
            OdLfytAyl: kayit.OdLfytAyl || 0,
            OdDpzt: kayit.OdDpzt || 0,
          });

          console.log(`🔥 Admin - Kayıt güncellendi: OdTipNo=${kayit.OdTipNo}`);
        } catch (kayitError) {
          console.error(
            `🔥 Admin - Kayıt güncelleme hatası (OdTipNo=${kayit.OdTipNo}):`,
            kayitError,
          );
          throw new Error(
            `OdTipNo=${kayit.OdTipNo} kaydı güncellenirken hata: ${kayitError instanceof Error ? kayitError.message : 'Bilinmeyen hata'}`,
          );
        }
      }

      // Transaction'ı commit et
      await queryRunner.commitTransaction();
      console.log('🔥 Admin - Transaction commit edildi');

      return guncellenenKayitlar;
    } catch (error) {
      // Hata durumunda rollback yap
      await queryRunner.rollbackTransaction();
      console.error('🔥 Admin - Transaction rollback edildi, hata:', error);
      throw error;
    } finally {
      // QueryRunner'ı serbest bırak
      await queryRunner.release();
    }
  }

  async createOdaTipLifyat(body: {
    OdTipAdi: string;
    OdLfytGun: number;
    OdLfytHft: number;
    OdLfytAyl: number;
    OdDpzt: number;
  }): Promise<void> {
    const odaTipAdi = String(body?.OdTipAdi ?? '').trim();
    if (!odaTipAdi) {
      throw new Error('OdaTipi Adı boş olamaz');
    }

    const toBigint = (v: unknown) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return 0;
      return Math.max(0, Math.trunc(n));
    };

    const gun = toBigint(body?.OdLfytGun);
    const hft = toBigint(body?.OdLfytHft);
    const ayl = toBigint(body?.OdLfytAyl);
    const dpzt = toBigint(body?.OdDpzt);

    const odaTipLifyatTableName = this.dbConfig.getTableName('tblOdaTipLfyt');
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager.query('SET LOCK_TIMEOUT 60000');

      const existsQuery = `
        SELECT TOP 1 OdTipNo
        FROM ${odaTipLifyatTableName} WITH (UPDLOCK, HOLDLOCK)
        WHERE LOWER(LTRIM(RTRIM(OdTipAdi))) = LOWER(@0)
      `;
      const existing = await queryRunner.manager.query(existsQuery, [
        odaTipAdi,
      ]);
      if (existing?.length) {
        throw new Error('Bu oda tipi adı zaten mevcut.');
      }

      const insertQuery = `
        INSERT INTO ${odaTipLifyatTableName} (OdTipAdi, OdLfytGun, OdLfytHft, OdLfytAyl, OdDpzt)
        VALUES (@0, @1, @2, @3, @4)
      `;
      await queryRunner.manager.query(insertQuery, [
        odaTipAdi,
        gun,
        hft,
        ayl,
        dpzt,
      ]);

      await queryRunner.commitTransaction();
    } catch (error) {
      try {
        await queryRunner.rollbackTransaction();
      } catch {
        // ignore
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
