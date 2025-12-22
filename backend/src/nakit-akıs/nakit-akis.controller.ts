import { Controller, Get, Query, Logger } from '@nestjs/common';
import { NakitAkisService, NakitAkisRecord } from './nakit-akis.service';

@Controller('nakit-akis')
export class NakitAkisController {
  private readonly logger = new Logger(NakitAkisController.name);

  constructor(private readonly nakitAkisService: NakitAkisService) {}

  /**
   * Belirli bir tarih için nakit akış verilerini getirir
   * @param tarih DD.MM.YYYY formatında tarih (opsiyonel, varsayılan: bugün)
   * @returns Nakit akış kayıtları
   */
  @Get('veriler')
  async getNakitAkisVerileri(
    @Query('tarih') tarih?: string,
  ): Promise<{ success: boolean; data: NakitAkisRecord[]; message?: string }> {
    try {
      this.logger.log(
        `📊 Nakit akış verileri isteniyor. Tarih: ${tarih || 'bugün'}`,
      );

      // Tarih belirtilmemişse bugünün tarihini kullan
      const targetDate = tarih || this.nakitAkisService.getTodayFormatted();

      const veriler =
        await this.nakitAkisService.getNakitAkisByDate(targetDate);

      this.logger.log(`✅ ${veriler.length} kayıt başarıyla getirildi`);

      return {
        success: true,
        data: veriler,
        message: `${veriler.length} kayıt bulundu`,
      };
    } catch (error) {
      this.logger.error(
        `❌ Nakit akış verileri alınırken hata: ${error.message}`,
      );

      return {
        success: false,
        data: [],
        message: `Hata: ${error.message}`,
      };
    }
  }

  /**
   * Bugünün tarihini DD.MM.YYYY formatında döndürür
   * @returns Bugünün tarihi
   */
  @Get('bugun-tarih')
  getBugunTarih(): { success: boolean; data: string; message: string } {
    try {
      const bugunTarih = this.nakitAkisService.getTodayFormatted();

      return {
        success: true,
        data: bugunTarih,
        message: 'Bugünün tarihi başarıyla getirildi',
      };
    } catch (error) {
      this.logger.error(`❌ Bugünün tarihi alınırken hata: ${error.message}`);

      return {
        success: false,
        data: '',
        message: `Hata: ${error.message}`,
      };
    }
  }

  /**
   * Test amaçlı örnek veri döndürür
   * @returns Örnek nakit akış kayıtları
   */
  @Get('ornek-veri')
  getOrnekVeri(): {
    success: boolean;
    data: NakitAkisRecord[];
    message: string;
  } {
    try {
      const ornekVeriler = this.nakitAkisService.getSampleData();

      return {
        success: true,
        data: ornekVeriler,
        message: 'Örnek veriler başarıyla getirildi',
      };
    } catch (error) {
      this.logger.error(`❌ Örnek veri alınırken hata: ${error.message}`);

      return {
        success: false,
        data: [],
        message: `Hata: ${error.message}`,
      };
    }
  }

  /**
   * OdmVade bilgisi günün tarihinden eski olan ve OdmDrm = 0 olan kayıtların
   * OdmVade bilgisini günün tarihi ile günceller
   * @returns Güncellenen kayıt sayısı
   */
  @Get('guncelle-eski-odmvade')
  async guncelleEskiOdmVade(): Promise<{
    success: boolean;
    updatedCount: number;
    message: string;
  }> {
    try {
      this.logger.log('🔄 Eski OdmVade kayıtları güncelleniyor...');

      const result = await this.nakitAkisService.updateEskiOdmVadeKayitlari();

      this.logger.log(`✅ ${result.updatedCount} kayıt güncellendi`);

      return result;
    } catch (error) {
      this.logger.error(
        `❌ Eski OdmVade kayıtları güncellenirken hata: ${error.message}`,
      );

      return {
        success: false,
        updatedCount: 0,
        message: `Hata: ${error.message}`,
      };
    }
  }
}
