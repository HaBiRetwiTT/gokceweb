import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import { IslemService } from './islem.service';

interface IslemKayit {
  iKytTarihi: string;
  islemKllnc: string;
  islemOzel1: string;
  islemOzel2: string;
  islemOzel3: string;
  islemOzel4: string;
  islemBirim: string;
  islemDoviz: string;
  islemKur: number;
  islemBilgi: string;
  islemCrKod: string;
  islemArac: string;
  islemTip: string;
  islemGrup: string;
  islemAltG: string;
  islemMiktar: number;
  islemTutar: number;
}

@Controller('islem')
export class IslemController {
  constructor(private readonly islemService: IslemService) {}

  private debugLog(...args: unknown[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  }

  @Post('kaydet')
  async kaydetIslem(@Body() body: { kayitlar: IslemKayit[] }) {
    try {
      this.debugLog('Gelen kayıtlar:', body.kayitlar);

      if (!body.kayitlar || body.kayitlar.length === 0) {
        throw new HttpException(
          'Kayıt listesi boş olamaz',
          HttpStatus.BAD_REQUEST,
        );
      }

      const sonuc = await this.islemService.kaydetIslemler(body.kayitlar);

      return {
        success: true,
        message: `${body.kayitlar.length} kayıt başarıyla kaydedildi`,
        kayitSayisi: body.kayitlar.length,
        sonuc,
      };
    } catch (error) {
      console.error('İşlem kaydetme hatası:', error);
      throw new HttpException(
        error.message || 'İşlem kaydedilirken hata oluştu',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Kasa işlemleri için günlük toplamları getirir
   */
  @Get('kasa-islemleri')
  async getKasaIslemleri(
    @Query('islemTuru') islemTuru: string,
    @Query('islemYonu') islemYonu: string,
    @Query('page') page: string = '1',
    @Query('rowsPerPage') rowsPerPage: string = '15',
  ) {
    try {
      const pageNum = parseInt(page, 10) || 1;
      const rowsPerPageNum = parseInt(rowsPerPage, 10) || 15;

      const data = await this.islemService.getKasaIslemleri(
        islemTuru,
        islemYonu,
        pageNum,
        rowsPerPageNum,
      );
      return {
        success: true,
        data: data.data,
        totalRecords: data.totalRecords,
        message: 'Kasa işlemleri başarıyla getirildi',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Kasa işlemleri getirilemedi',
        error: error,
      };
    }
  }

  /**
   * Detay işlemleri getirir
   */
  @Get('detay-islemler')
  async getDetayIslemler(
    @Query('tarih') tarih: string,
    @Query('islemTuru') islemTuru: string,
    @Query('islemYonu') islemYonu: string,
    @Query('selectedYonu') selectedYonu: string,
    @Query('page') page: string = '1',
    @Query('rowsPerPage') rowsPerPage: string = '15',
  ) {
    try {
      const pageNum = parseInt(page, 10) || 1;
      const rowsPerPageNum = parseInt(rowsPerPage, 10) || 15;

      const data = await this.islemService.getDetayIslemler(
        tarih,
        islemTuru,
        islemYonu,
        selectedYonu,
        pageNum,
        rowsPerPageNum,
      );
      return {
        success: true,
        data: data.data,
        totalRecords: data.totalRecords,
        message: 'Detay işlemler başarıyla getirildi',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Detay işlemler getirilemedi',
        error: error,
      };
    }
  }

  /**
   * Depozito işlemleri için özel endpoint
   */
  @Get('depozito-islemleri')
  async getDepozitoIslemleri() {
    try {
      const data = await this.islemService.getDepozitoIslemleri();
      return {
        success: true,
        data: data,
        message: 'Depozito işlemleri başarıyla getirildi',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Depozito işlemleri getirilemedi',
        error: error,
      };
    }
  }

  @Get('health')
  async health() {
    return { status: 'OK', message: 'İşlem servisi çalışıyor' };
  }

  // test endpoint kaldırıldı (gereksiz trafik)

  /**
   * Güncel bakiye getirir
   */
  @Get('guncel-bakiye')
  async getGuncelBakiye(
    @Query('islemTuru') islemTuru: string,
    @Query('islemYonu') islemYonu: string,
  ) {
    try {
      const bakiye = await this.islemService.getGuncelBakiye(
        islemTuru,
        islemYonu,
      );
      return {
        success: true,
        bakiye: bakiye,
        message: 'Güncel bakiye başarıyla hesaplandı',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Güncel bakiye hesaplanamadı',
        error: error,
      };
    }
  }

  /**
   * Seçilen gün bakiyesi getirir
   */
  @Get('secilen-gun-bakiyesi')
  async getSecilenGunBakiyesi(
    @Query('islemTuru') islemTuru: string,
    @Query('islemYonu') islemYonu: string,
    @Query('secilenTarih') secilenTarih: string,
  ) {
    try {
      const bakiye = await this.islemService.getSecilenGunBakiyesi(
        islemTuru,
        islemYonu,
        secilenTarih,
      );
      return {
        success: true,
        bakiye: bakiye,
        message: 'Seçilen gün bakiyesi başarıyla hesaplandı',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Seçilen gün bakiyesi hesaplanamadı',
        error: error,
      };
    }
  }

  /**
   * Kasa devir verileri getirir
   */
  @Get('kasa-devir-verileri')
  async getKasaDevirVerileri(
    @Query('page') page: string = '1',
    @Query('rowsPerPage') rowsPerPage: string = '3',
  ) {
    try {
      const pageNum = parseInt(page, 10) || 1;
      const rowsPerPageNum = parseInt(rowsPerPage, 10) || 3;

      const result = await this.islemService.getKasaDevirVerileri(
        pageNum,
        rowsPerPageNum,
      );
      return {
        success: true,
        data: result.data,
        totalRecords: result.totalRecords,
        message: 'Kasa devir verileri başarıyla getirildi',
      };
    } catch (error) {
      console.error('❌ Kasa devir verileri endpoint hatası:', error);
      return {
        success: false,
        message: 'Kasa devir verileri alınamadı',
        error: error.message,
      };
    }
  }

  @Post('kasa-aktarimi')
  async kasaAktarimi(
    @Body() body: { veren: string; alan: string; tutar: number },
  ) {
    try {
      this.debugLog('Kasa aktarımı başlatılıyor:', body);

      if (!body.veren || !body.alan || !body.tutar) {
        throw new HttpException(
          'Veren, alan ve tutar alanları zorunludur',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (body.veren === body.alan) {
        throw new HttpException(
          'Veren ve alan kasa aynı olamaz',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (body.tutar <= 0) {
        throw new HttpException(
          'Tutar pozitif olmalıdır',
          HttpStatus.BAD_REQUEST,
        );
      }

      const sonuc = await this.islemService.kasaAktarimi(
        body.veren,
        body.alan,
        body.tutar,
      );

      return {
        success: true,
        message: 'Kasa aktarımı başarıyla tamamlandı',
        sonuc,
      };
    } catch (error) {
      console.error('Kasa aktarımı hatası:', error);
      throw new HttpException(
        error.message || 'Kasa aktarımı sırasında hata oluştu',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Kasa devret onayı ile tblKasaDevir'e kayıt atar
   */
  @Post('kasa-devret')
  async kasaDevret(@Body() body: { kasaYekun: number }) {
    try {
      if (typeof body.kasaYekun !== 'number' || isNaN(body.kasaYekun)) {
        throw new HttpException('Geçersiz kasa tutarı', HttpStatus.BAD_REQUEST);
      }
      const sonuc = await this.islemService.saveKasaDevir(body.kasaYekun);
      return { success: true, message: 'Kasa devri kaydedildi', sonuc };
    } catch (error) {
      console.error('❌ /islem/kasa-devret hatası:', error);
      throw new HttpException(
        error?.message || 'Kasa devri kaydedilemedi',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
