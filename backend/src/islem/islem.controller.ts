import { Controller, Post, Body, HttpException, HttpStatus, Get, Query } from '@nestjs/common'
import { IslemService } from './islem.service'

interface IslemKayit {
  iKytTarihi: string
  islemKllnc: string
  islemOzel1: string
  islemOzel2: string
  islemOzel3: string
  islemOzel4: string
  islemBirim: string
  islemDoviz: string
  islemKur: number
  islemBilgi: string
  islemCrKod: string
  islemArac: string
  islemTip: string
  islemGrup: string
  islemAltG: string
  islemMiktar: number
  islemTutar: number
}

@Controller('islem')
export class IslemController {
  constructor(private readonly islemService: IslemService) {}

  @Post('kaydet')
  async kaydetIslem(@Body() body: { kayitlar: IslemKayit[] }) {
    try {
      console.log('Gelen kayıtlar:', body.kayitlar)
      
      if (!body.kayitlar || body.kayitlar.length === 0) {
        throw new HttpException('Kayıt listesi boş olamaz', HttpStatus.BAD_REQUEST)
      }

      const sonuc = await this.islemService.kaydetIslemler(body.kayitlar)
      
      return {
        success: true,
        message: `${body.kayitlar.length} kayıt başarıyla kaydedildi`,
        kayitSayisi: body.kayitlar.length,
        sonuc
      }
    } catch (error) {
      console.error('İşlem kaydetme hatası:', error)
      throw new HttpException(
        error.message || 'İşlem kaydedilirken hata oluştu',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
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
    @Query('rowsPerPage') rowsPerPage: string = '15'
  ) {
    try {
      const pageNum = parseInt(page, 10) || 1
      const rowsPerPageNum = parseInt(rowsPerPage, 10) || 15
      
      const data = await this.islemService.getKasaIslemleri(islemTuru, islemYonu, pageNum, rowsPerPageNum);
      return {
        success: true,
        data: data.data,
        totalRecords: data.totalRecords,
        message: 'Kasa işlemleri başarıyla getirildi'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Kasa işlemleri getirilemedi',
        error: error
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
    @Query('rowsPerPage') rowsPerPage: string = '15'
  ) {
    try {
      const pageNum = parseInt(page, 10) || 1
      const rowsPerPageNum = parseInt(rowsPerPage, 10) || 15
      
      const data = await this.islemService.getDetayIslemler(tarih, islemTuru, islemYonu, selectedYonu, pageNum, rowsPerPageNum);
      return {
        success: true,
        data: data.data,
        totalRecords: data.totalRecords,
        message: 'Detay işlemler başarıyla getirildi'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Detay işlemler getirilemedi',
        error: error
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
        message: 'Depozito işlemleri başarıyla getirildi'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Depozito işlemleri getirilemedi',
        error: error
      };
    }
  }

  @Get('health')
  async health() {
    return { status: 'OK', message: 'İşlem servisi çalışıyor' }
  }

  @Get('test')
  async test() {
    return { 
      success: true, 
      message: 'Test endpoint çalışıyor',
      timestamp: new Date().toISOString()
    }
  }
} 