import { Injectable, Logger } from '@nestjs/common';
import { DatabaseTransactionService } from './database/database-transaction.service';
import { DatabaseConfigService } from './database/database-config.service';
import { CreateOdemeIslemDto } from './dto/create-odeme-islem.dto';

@Injectable()
export class OdemeIslemService {
  private readonly logger = new Logger(OdemeIslemService.name);

  constructor(
    private readonly transactionService: DatabaseTransactionService,
    private readonly dbConfig: DatabaseConfigService
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
  private async getMusteriBilgiByTCN(tcNo: string, queryRunner: any): Promise<{ MstrNo?: number } | null> {
    const result = await queryRunner.query('SELECT TOP 1 MstrNo FROM tblMusteri WHERE MstrTCN = @0', [tcNo]);
    return result[0] || null;
  }

  /**
   * Tahsilat işlemlerini transaction içinde, her birini stored procedure ile kaydeder.
   * Tüm işlemler başarılıysa commit, hata olursa rollback yapılır.
   */
  async kaydetIslemler(dto: CreateOdemeIslemDto) {
    const storedProcedures = this.dbConfig.getStoredProcedures();
    await this.transactionService.executeInTransaction(async (queryRunner) => {
      for (const islem of dto.islemler) {
        this.logger.log(`Kayıt ekleniyor: ${JSON.stringify(islem)}`);
        // Eğer musteriNo undefined ise, TC'den çek
        let musteriNo: number | undefined = islem.musteriNo;
        if (!musteriNo && islem.MstrTCN) {
          const musteriData = await this.getMusteriBilgiByTCN(islem.MstrTCN, queryRunner);
          musteriNo = musteriData?.MstrNo;
        }
        if (!musteriNo) {
          throw new Error('Müşteri numarası bulunamadı!');
        }
        const cariKod = islem.MstrHspTip === 'Kurumsal' ? `MK${musteriNo}` : `MB${musteriNo}`;
        // Oda ve yatak bilgisini ayır
        const [odaNo = '', yatakNo = ''] = (islem.MstrOdaYatak || '').split('-');
        const ilkDigit = odaNo.charAt(0) || '0';
        const blok = parseInt(ilkDigit) < 6 ? 'A' : 'B';
        const kat = ilkDigit;
        // Parametreleri, spr_islemEkleYn prosedürünün beklediği sırada hazırla
        const params = [
          this.getCurrentTransactionDate(), // @0 iKytTarihi
          islem.islemKllnc,                // @1 islemKllnc
          cariKod,                         // @2 islemCrKod
          islem.MstrKnklmTip,              // @3 islemOzel1
          `${blok}-BLOK - ${kat}. KAT`,    // @4 islemOzel2
          `${odaNo} - ${yatakNo}`,         // @5 islemOzel3
          '',                              // @6 islemOzel4 (boş)
          islem.islemArac,                 // @7 islemArac
          islem.islemTip,                  // @8 islemTip
          islem.islemGrup,                 // @9 islemGrup
          islem.MstrAdi,                   // @10 islemAltG (müşteri adı)
          islem.islemBilgi,                // @11 islemBilgi
          1,                               // @12 islemMiktar (tahsilat/depozito için 1)
          'ADET',                          // @13 islemBirim
          islem.islemTutar,                // @14 islemTutar
          'TL',                            // @15 islemDoviz
          1.00                             // @16 islemKur
        ];
        await this.transactionService.executeStoredProcedure(
          queryRunner,
          storedProcedures.islemEkle, // Doğru SP adı config'ten alınır
          params
        );
      }
    });
    return { success: true, message: 'Tahsilat işlemleri başarıyla kaydedildi.' };
  }
}