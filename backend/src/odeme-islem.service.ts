import { Injectable, Logger } from '@nestjs/common';
import { DatabaseTransactionService } from './database/database-transaction.service';
import { DatabaseConfigService } from './database/database-config.service';
import { CreateOdemeIslemDto } from './dto/create-odeme-islem.dto';

@Injectable()
export class OdemeIslemService {
  private readonly logger = new Logger(OdemeIslemService.name);

  constructor(
    private readonly transactionService: DatabaseTransactionService,
    private readonly dbConfig: DatabaseConfigService,
  ) {}

  /**
   * Şu anki tarihi (işlem tarihi olarak) DD.MM.YYYY HH:mm:ss formatında döndürür
   */
  private getCurrentTransactionDate(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  /**
   * TC kimlik numarasından müşteri numarasını çeker (gerçek DB sorgusu)
   */
  private async getMusteriBilgiByTCN(
    tcNo: string,
    queryRunner: {
      query: (sql: string, params?: unknown[]) => Promise<unknown>;
    },
  ): Promise<{ MstrNo?: number } | null> {
    const resultUnknown = await queryRunner.query(
      'SELECT TOP 1 MstrNo FROM tblMusteri WHERE MstrTCN = @0',
      [tcNo],
    );
    const result = resultUnknown as Array<{ MstrNo: number }>;
    return result[0] || null;
  }

  /**
   * tblislem tablosundaki maksimum islemno değerini getirir
   */
  async getMaxIslemno(): Promise<{ maxIslemno: number }> {
    try {
      const result = await this.transactionService.executeInTransaction(
        async (queryRunner) => {
          return await this.transactionService.executeQuery(
            queryRunner,
            'SELECT ISNULL(MAX(islemno), 0) as maxIslemno FROM tblislem',
          );
        },
      );

      const maxIslemno = result[0]?.maxIslemno || 0;
      this.logger.log(`Maksimum islemno: ${maxIslemno}`);

      return { maxIslemno: Number(maxIslemno) };
    } catch (error) {
      this.logger.error('Maksimum islemno getirilirken hata:', error);
      throw new Error('Maksimum islemno getirilemedi');
    }
  }

  /**
   * Tahsilat işlemlerini transaction içinde, her birini stored procedure ile kaydeder.
   * Tüm işlemler başarılıysa commit, hata olursa rollback yapılır.
   * Her işlem için islemno değerini döndürür.
   */
  async kaydetIslemler(dto: CreateOdemeIslemDto) {
    const storedProcedures = this.dbConfig.getStoredProcedures();
    const islemNoList: number[] = [];

    await this.transactionService.executeInTransaction(async (queryRunner) => {
      // Depozito tahsilatı sırasında kullanılan islemArac bilgisini cache'le
      let lastDepositArac: string | null = null;
      for (const islem of dto.islemler) {
        this.logger.log(`Kayıt ekleniyor: ${JSON.stringify(islem)}`);
        // Eğer musteriNo undefined ise, TC'den çek
        let musteriNo: number | undefined = islem.musteriNo;
        if (!musteriNo && islem.MstrTCN) {
          const musteriData = await this.getMusteriBilgiByTCN(
            islem.MstrTCN,
            queryRunner,
          );
          musteriNo = musteriData?.MstrNo;
        }
        if (!musteriNo) {
          throw new Error('Müşteri numarası bulunamadı!');
        }
        const cariKod =
          islem.MstrHspTip === 'Kurumsal' ? `MK${musteriNo}` : `MB${musteriNo}`;
        // Oda ve yatak bilgisini ayır
        const [odaNo = '', yatakNo = ''] = (islem.MstrOdaYatak || '').split(
          '-',
        );
        const ilkDigit = odaNo.charAt(0) || '0';
        const blok = parseInt(ilkDigit) < 6 ? 'A' : 'B';
        const kat = ilkDigit;
        // Parametreleri, spr_islemEkleYn prosedürünün beklediği sırada hazırla
        const params = [
          this.getCurrentTransactionDate(), // @0 iKytTarihi
          islem.islemKllnc, // @1 islemKllnc
          cariKod, // @2 islemCrKod
          islem.MstrKnklmTip, // @3 islemOzel1
          `${blok}-BLOK - ${kat}. KAT`, // @4 islemOzel2
          `${odaNo} - ${yatakNo}`, // @5 islemOzel3
          '', // @6 islemOzel4 (boş)
          islem.islemArac, // @7 islemArac
          islem.islemTip, // @8 islemTip
          islem.islemGrup, // @9 islemGrup
          islem.MstrAdi, // @10 islemAltG (müşteri adı)
          islem.islemBilgi, // @11 islemBilgi
          1, // @12 islemMiktar (tahsilat/depozito için 1)
          'ADET', // @13 islemBirim
          islem.islemTutar, // @14 islemTutar
          'TL', // @15 islemDoviz
          1.0, // @16 islemKur
        ];

        // Stored procedure'ü çalıştır ve sonucu al
        const resultUnknown =
          await this.transactionService.executeStoredProcedure(
            queryRunner,
            storedProcedures.islemEkle, // Doğru SP adı config'ten alınır
            params,
          );
        const result = resultUnknown as Array<Record<string, unknown>>;

        // Stored procedure'den dönen islemno'yu al
        // SQL Server'da OUTPUT parametresi veya SELECT sonucu olarak dönebilir
        if (result && result.length > 0) {
          const raw = result[0];
          const islemno = (raw.islemno ?? raw.IslemNo ?? raw.ISLEMNO) as
            | number
            | string
            | undefined;
          if (islemno) {
            islemNoList.push(Number(islemno));
            this.logger.log(`İşlem kaydedildi, islemno: ${islemno}`);
          } else {
            this.logger.warn(
              'Stored procedure islemno döndürmedi, sonuç:',
              result,
            );
          }
        } else {
          this.logger.warn('Stored procedure sonuç döndürmedi');
        }

        // Depozito tahsilatı ise son kullanılan arac'ı cache'le
        if (
          islem.islemBilgi &&
          String(islem.islemBilgi).includes('=DEPOZİTO TAHSİLATI=')
        ) {
          lastDepositArac = islem.islemArac;
        }
      }

      // Eğer bu transaction'da depozito tahsilatı yapıldıysa, ilgili müşterinin
      // tblislem tablosunda islemBilgi LIKE '%DEPOZİTO ALACAĞI%' olan son kaydının islemArac alanını güncelle
      try {
        if (lastDepositArac && dto.islemler && dto.islemler.length > 0) {
          // Müşteri TCN veya MusteriNo'dan cari kodu üret
          const first = dto.islemler[0];
          let musteriNo: number | undefined = first.musteriNo;
          if (!musteriNo && first.MstrTCN) {
            const musteriData = await this.getMusteriBilgiByTCN(
              first.MstrTCN,
              queryRunner,
            );
            musteriNo = musteriData?.MstrNo;
          }
          if (musteriNo) {
            const cariKod =
              first.MstrHspTip === 'Kurumsal'
                ? `MK${musteriNo}`
                : `MB${musteriNo}`;
            const tableName = this.dbConfig.getTableName('tblislem');
            const updateQuery = `
              WITH lastRow AS (
                SELECT TOP (1) islemNo
                FROM ${tableName}
                WHERE islemCrKod = @1 AND islemBilgi LIKE '%=DEPOZİTO ALACAĞI=%'
                ORDER BY islemNo DESC
              )
              UPDATE t
              SET t.islemArac = @0
              FROM ${tableName} AS t
              INNER JOIN lastRow lr ON lr.islemNo = t.islemNo
            `;
            await this.transactionService.executeQuery(
              queryRunner,
              updateQuery,
              [lastDepositArac, cariKod],
            );
            this.logger.log(
              'Depozito alacağı son kaydın islemArac alanı güncellendi',
            );
          }
        }
      } catch (e) {
        this.logger.warn('Depozito alacağı islemArac güncelleme uyarısı:', e);
        // Bu adım kritik değil; ana transaction'ı bozmayalım.
      }
    });

    return {
      success: true,
      message: 'Tahsilat işlemleri başarıyla kaydedildi.',
      islemNoList: islemNoList,
    };
  }
}
