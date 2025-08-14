import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
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

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    try {
      return JSON.stringify(error);
    } catch {
      return 'Bilinmeyen hata';
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
    } catch (error: unknown) {
      console.error('İşlem kaydetme hatası:', error);
      const msg = this.getErrorMessage(error);
      throw new HttpException(
        msg || 'İşlem kaydedilirken hata oluştu',
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
    } catch (error: unknown) {
      return {
        success: false,
        message: this.getErrorMessage(error) || 'Kasa işlemleri getirilemedi',
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
    } catch (error: unknown) {
      return {
        success: false,
        message: this.getErrorMessage(error) || 'Detay işlemler getirilemedi',
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
    } catch (error: unknown) {
      return {
        success: false,
        message:
          this.getErrorMessage(error) || 'Depozito işlemleri getirilemedi',
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
    } catch (error: unknown) {
      return {
        success: false,
        message: this.getErrorMessage(error) || 'Güncel bakiye hesaplanamadı',
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
    } catch (error: unknown) {
      return {
        success: false,
        message:
          this.getErrorMessage(error) || 'Seçilen gün bakiyesi hesaplanamadı',
      };
    }
  }

  // Detay PDF
  @Get('detay-pdf')
  async getDetayPDF(
    @Query('tarih') tarih: string,
    @Query('islemTuru') islemTuru: string,
    @Query('islemYonu') islemYonu: string,
    @Query('selectedYonu') selectedYonu: string,
    @Res() res: Response,
  ) {
    try {
      const buffer = (await this.islemService.generateDetayPDF(
        tarih,
        islemTuru,
        islemYonu,
        selectedYonu,
      )) as unknown as Buffer;
      const fileName = `kasa-detay-${tarih || 'tum'}.pdf`;
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length,
      });
      return res.send(buffer);
    } catch (error: unknown) {
      const msg = this.getErrorMessage(error) || 'Detay PDF oluşturulamadı';
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: msg });
    }
  }

  // Detay Excel
  @Get('detay-excel')
  async getDetayExcel(
    @Query('tarih') tarih: string,
    @Query('islemTuru') islemTuru: string,
    @Query('islemYonu') islemYonu: string,
    @Query('selectedYonu') selectedYonu: string,
    @Res() res: Response,
  ) {
    try {
      const buffer = (await this.islemService.generateDetayExcel(
        tarih,
        islemTuru,
        islemYonu,
        selectedYonu,
      )) as unknown as Buffer;
      const fileName = `kasa-detay-${tarih || 'tum'}.xlsx`;
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length,
      });
      return res.send(buffer);
    } catch (error: unknown) {
      const msg = this.getErrorMessage(error) || 'Detay Excel oluşturulamadı';
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: msg });
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
    } catch (error: unknown) {
      console.error('❌ Kasa devir verileri endpoint hatası:', error);
      return {
        success: false,
        message: this.getErrorMessage(error) || 'Kasa devir verileri alınamadı',
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
    } catch (error: unknown) {
      console.error('Kasa aktarımı hatası:', error);
      const msg = this.getErrorMessage(error);
      throw new HttpException(
        msg || 'Kasa aktarımı sırasında hata oluştu',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Kasa devret onayı ile tblKasaDevir'e kayıt atar
   */
  @Post('kasa-devret')
  async kasaDevret(@Body() body: { kasaYekun: number; kullaniciAdi?: string }) {
    try {
      if (typeof body.kasaYekun !== 'number' || isNaN(body.kasaYekun)) {
        throw new HttpException('Geçersiz kasa tutarı', HttpStatus.BAD_REQUEST);
      }
      const sonuc = await this.islemService.saveKasaDevir(
        body.kasaYekun,
        body.kullaniciAdi,
      );
      return { success: true, message: 'Kasa devri kaydedildi', sonuc };
    } catch (error: unknown) {
      console.error('❌ /islem/kasa-devret hatası:', error);
      const msg = this.getErrorMessage(error);
      throw new HttpException(
        msg || 'Kasa devri kaydedilemedi',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
