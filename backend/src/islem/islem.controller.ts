import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
  Query,
  Res,
  Param,
  Delete,
  Put,
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
   * Nakit akış verilerini sp_FonDokumY ile getirir
   */
  @Get('nakit-akis')
  async getNakitAkis(@Query('tarih') tarih?: string) {
    try {
      // Tarih belirtilmemişse bugünün tarihini kullan
      if (!tarih) {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        tarih = `${dd}.${mm}.${yyyy}`;
      }

      const veriler = await this.islemService.getNakitAkisByDate(tarih);
      
      return {
        success: true,
        data: veriler,
        message: `${veriler.length} kayıt bulundu`
      };
      
    } catch (error) {
      return {
        success: false,
        data: [],
        message: `Hata: ${error.message}`
      };
    }
  }

  /**
   * tblFonKasaY tablosuna yeni nakit akış kaydı ekler
   */
  @Post('nakit-akis-ekle')
  async addNakitAkis(@Body() body: any) {
    try {
      console.log('🔥 Controller - Gelen ham veri:', body);
      
      // 🔥 Sadece gerekli alanları al
      const cleanData = {
        OdmVade: body.OdmVade,
        islmArac: body.islmArac,
        islmGrup: body.islmGrup,
        islmAltG: body.islmAltG,
        islmTip: body.islmTip,
        islmTtr: body.islmTtr,
        islmTkst: body.islmTkst,
        islmBilgi: body.islmBilgi,
        OdmDrm: body.OdmDrm,
        ttrDrm: body.ttrDrm,
      };
      
      console.log('🔥 Controller - Temizlenmiş veri:', cleanData);
      
      // 🔥 Taksit formatını kontrol et
      console.log('🔥 Gelen taksit verisi:', cleanData.islmTkst);
      console.log('🔥 Taksit formatı kontrolü:', typeof cleanData.islmTkst, cleanData.islmTkst);
      
      // Taksit formatını kontrol et - string ise "/" içermeli, number ise geçerli
      if (typeof cleanData.islmTkst === 'string' && !cleanData.islmTkst.includes('/')) {
        throw new Error('Taksit formatı hatalı. Beklenen format: "1 / 1"');
      }
      
      const sonuc = await this.islemService.addNakitAkis(cleanData);
      
      const response = {
        success: true,
        message: 'Nakit akış kaydı başarıyla eklendi',
        data: sonuc
      };
      
      console.log('🔥 Controller - Döndürülen response:', response);
      return response;
      
    } catch (error) {
      console.error('🔥 Controller - Hata:', error);
      
      const errorResponse = {
        success: false,
        message: `Hata: ${error.message}`,
        data: null
      };
      
      console.log('🔥 Controller - Hata response:', errorResponse);
      return errorResponse;
    }
  }

  /**
   * tblFonKasaY tablosundan nakit akış kaydını siler
   */
  @Delete('nakit-akis-sil')
  async deleteNakitAkis(@Body() body: { fKasaNo: number; OdmVade: string; islmArac: string; islmTip: string; islmGrup: string; islmAltG: string; islmTtr: number; islmTkst: string }) {
    try {
      console.log('🔥 Controller - Silinecek kayıt bilgileri:', body);
      
      const sonuc = await this.islemService.deleteNakitAkis(body);
      
      console.log('🔥 Controller - Silme sonucu:', sonuc);
      
      const response = {
        success: true,
        message: 'Nakit akış kaydı başarıyla silindi',
        data: sonuc
      };
      
      console.log('🔥 Controller - Silme response:', response);
      return response;
      
    } catch (error) {
      console.error('🔥 Controller - Silme hatası:', error);
      
      const errorResponse = {
        success: false,
        message: `Hata: ${error.message}`,
        data: null
      };
      
      console.log('🔥 Controller - Silme hata response:', errorResponse);
      return errorResponse;
    }
  }

  /**
   * Kısmi ödeme yapar - mevcut kaydı günceller ve yeni kayıt ekler
   */
  @Post('kismi-odeme-yap')
  async kismiOdemeYap(@Body() body: { 
    odenenTutar: number;
    ertelemeTarihi: string;
    mevcutKayit: {
      OdmVade: string;
      islmArac: string;
      islmGrup: string;
      islmAltG: string;
      islmTip: string;
      islmTtr: number;
      islmTkst: string | number; // String veya number olabilir (örn: "1 / 1" veya 1)
      islmBilgi: string;
      OdmDrm: boolean;
      ttrDrm: boolean;
      fKasaNo: number;
    };
  }) {
    try {
      console.log('🔥 Controller - Kısmi ödeme yapılacak:', body);
      
      const sonuc = await this.islemService.kismiOdemeYap(body);
      
      console.log('🔥 Controller - Kısmi ödeme sonucu:', sonuc);
      
      const response = {
        success: true,
        message: 'Kısmi ödeme başarıyla yapıldı',
        data: sonuc
      };
      
      console.log('🔥 Controller - Kısmi ödeme response:', response);
      return response;
      
    } catch (error) {
      console.error('🔥 Controller - Kısmi ödeme hatası:', error);
      
      const errorResponse = {
        success: false,
        message: `Hata: ${error.message}`,
        data: null
      };
      
      console.log('🔥 Controller - Kısmi ödeme hata response:', errorResponse);
      return errorResponse;
    }
  }

  /**
   * tblFonKasaY tablosunda nakit akış kaydını günceller
   */
  @Put('nakit-akis-guncelle')
  async updateNakitAkis(@Body() body: { 
    OdmVade: string; 
    islmArac: string; 
    islmGrup: string; 
    islmAltG: string; 
    islmTip: string;
    islmTtr: number; 
    // islmTkst alanı güncelleme dışında bırakıldı
    islmBilgi: string;
    OdmDrm: boolean;
    ttrDrm: boolean;
    fKasaNo: number; // Güncelleme için gerekli (WHERE koşulu)
  }) {
    try {
      console.log('🔥 Controller - Güncellenecek kayıt bilgileri:', body);
      
      const sonuc = await this.islemService.updateNakitAkis(body);
      
      console.log('🔥 Controller - Güncelleme sonucu:', sonuc);
      
      const response = {
        success: true,
        message: 'Nakit akış kaydı başarıyla güncellendi',
        data: sonuc
      };
      
      console.log('🔥 Controller - Güncelleme response:', response);
      return response;
      
    } catch (error) {
      console.error('🔥 Controller - Güncelleme hatası:', error);
      
      const errorResponse = {
        success: false,
        message: `Hata: ${error.message}`,
        data: null
      };
      
      console.log('🔥 Controller - Güncelleme hata response:', errorResponse);
      return errorResponse;
    }
  }



  /**
   * Fon devir bakiyesini sp_FonDevirY ile getirir
   */
  @Get('fon-devir-y/:tarih')
  async getFonDevirY(@Param('tarih') tarih: string) {
    try {
      // Tarih formatını kontrol et
      if (!/^\d{2}\.\d{2}\.\d{4}$/.test(tarih)) {
        throw new Error('Geçersiz tarih formatı. DD.MM.YYYY formatında olmalıdır.');
      }

      const devirBakiye = await this.islemService.getFonDevirY(tarih);
      
      return {
        success: true,
        data: {
          devirBakiye: devirBakiye,
          tarih: tarih
        },
        message: 'Fon devir bakiyesi başarıyla alındı'
      };
      
    } catch (error) {
      return {
        success: false,
        data: {
          devirBakiye: 0,
          tarih: tarih
        },
        message: `Hata: ${error.message}`
      };
    }
  }

  /**
   * Kasa işlemleri için günlük toplamları getirir
   */
  @Get('kasa-islemleri')
  async getKasaIslemleri(
    @Query('islemArac') islemArac: string,
    @Query('islemTip') islemTip: string,
    @Query('page') page: string = '1',
    @Query('rowsPerPage') rowsPerPage: string = '15',
  ) {
    try {
      const pageNum = parseInt(page, 10) || 1;
      const rowsPerPageNum = parseInt(rowsPerPage, 10) || 15;

      const data = await this.islemService.getKasaIslemleri(
        islemArac,
        islemTip,
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
    @Query('islemArac') islemArac: string,
    @Query('islemTip') islemTip: string,
    @Query('page') page: string = '1',
    @Query('rowsPerPage') rowsPerPage: string = '15',
  ) {
    try {
      const pageNum = parseInt(page, 10) || 1;
      const rowsPerPageNum = parseInt(rowsPerPage, 10) || 15;

      const data = await this.islemService.getDetayIslemler(
        tarih,
        islemArac,
        islemTip,
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
    @Query('islemArac') islemArac: string,
    @Query('islemTip') islemTip: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const bakiye = await this.islemService.getGuncelBakiye(
        islemArac,
        islemTip,
        endDate,
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
    @Query('islemArac') islemArac: string,
    @Query('islemTip') islemTip: string,
    @Query('secilenTarih') secilenTarih: string,
  ) {
    try {
      const bakiye = await this.islemService.getSecilenGunBakiyesi(
        islemArac,
        islemTip,
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
    @Query('islemArac') islemArac: string,
    @Query('islemTip') islemTip: string,
    @Res() res: Response,
  ) {
    try {
      const buffer = (await this.islemService.generateDetayPDF(
        tarih,
        islemArac,
        islemTip,
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
    @Query('islemArac') islemArac: string,
    @Query('islemTip') islemTip: string,
    @Res() res: Response,
  ) {
    try {
      const buffer = (await this.islemService.generateDetayExcel(
        tarih,
        islemArac,
        islemTip,
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

  /**
   * tblislem tablosundan belirli kaydı getirir
   */
  @Get('detay/:islemNo')
  async getIslemDetay(@Param('islemNo') islemNo: string) {
    try {
      if (!islemNo) {
        throw new HttpException(
          'İşlem numarası gerekli',
          HttpStatus.BAD_REQUEST,
        );
      }

      const islemNoNum = parseInt(islemNo, 10);
      if (isNaN(islemNoNum)) {
        throw new HttpException(
          'Geçersiz işlem numarası',
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await this.islemService.getIslemDetay(islemNoNum);
      return {
        success: true,
        data: data,
        message: 'İşlem detayı başarıyla getirildi',
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: this.getErrorMessage(error) || 'İşlem detayı getirilemedi',
      };
    }
  }

  /**
   * tblislem tablosundan islemGrup distinct listesi getirir
   */
  @Get('islem-gruplari')
  async getIslemGruplari() {
    try {
      const data = await this.islemService.getIslemGruplari();
      return {
        success: true,
        data: data,
        message: 'İşlem grupları başarıyla getirildi',
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: this.getErrorMessage(error) || 'İşlem grupları getirilemedi',
      };
    }
  }

  /**
   * tblFonKasaY tablosundan islmGrup seçimine göre islmAltG distinct listesi getirir
   */
  @Get('islm-alt-gruplar')
  async getIslmAltGruplar(@Query('islmGrup') islmGrup: string) {
    try {
      if (!islmGrup) {
        throw new HttpException(
          'İslm grubu parametresi gerekli',
          HttpStatus.BAD_REQUEST,
        );
      }

      const altGruplar = await this.islemService.getIslmAltGruplar(islmGrup);
      
      return {
        success: true,
        data: altGruplar,
        message: `${altGruplar.length} alt grup bulundu`
      };
    } catch (error: unknown) {
      console.error('İslm alt grupları alınırken hata:', error);
      const msg = this.getErrorMessage(error);
      throw new HttpException(
        msg || 'İslm alt grupları alınamadı',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }



  /**
   * tblCari tablosundan CariAdi listesi getirir
   */
  @Get('cari-hesaplar')
  async getCariHesaplar() {
    try {
      const data = await this.islemService.getCariHesaplar();
      return {
        success: true,
        data: data,
        message: 'Cari hesaplar başarıyla getirildi',
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: this.getErrorMessage(error) || 'Cari hesaplar getirilemedi',
      };
    }
  }

  /**
   * tblislemRST tablosunda islemNo kontrolü yapar
   */
  @Get('islem-rst-kontrol/:islemNo')
  async checkIslemRST(@Param('islemNo') islemNo: string) {
    try {
      if (!islemNo) {
        throw new HttpException(
          'İşlem numarası gerekli',
          HttpStatus.BAD_REQUEST,
        );
      }

      const islemNoNum = parseInt(islemNo, 10);
      if (isNaN(islemNoNum)) {
        throw new HttpException(
          'Geçersiz işlem numarası',
          HttpStatus.BAD_REQUEST,
        );
      }

      const exists = await this.islemService.checkIslemRSTExists(islemNoNum);
      return {
        success: true,
        exists: exists,
        message: exists
          ? 'İşlem RST tablosunda mevcut'
          : 'İşlem RST tablosunda bulunamadı',
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: this.getErrorMessage(error) || 'İşlem RST kontrolü yapılamadı',
      };
    }
  }

  /**
   * tblislem tablosundan kaydı tblislemRST tablosuna aktarır
   */
  @Post('islem-rst-aktar')
  async aktarIslemRST(@Body() body: { islemNo: number }) {
    try {
      if (!body.islemNo || isNaN(body.islemNo)) {
        throw new HttpException(
          'Geçersiz işlem numarası',
          HttpStatus.BAD_REQUEST,
        );
      }

      const sonuc = await this.islemService.aktarIslemRST(body.islemNo);
      return {
        success: true,
        message: 'İşlem RST tablosuna başarıyla aktarıldı',
        sonuc,
      };
    } catch (error: unknown) {
      console.error('❌ /islem/islem-rst-aktar hatası:', error);
      const msg = this.getErrorMessage(error);
      throw new HttpException(
        msg || 'İşlem RST tablosuna aktarılamadı',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * tblislemRST tablosundan belirli kaydı getirir
   */
  @Get('islem-rst-detay/:islemNo')
  async getIslemRSTDetay(@Param('islemNo') islemNo: string) {
    try {
      if (!islemNo) {
        throw new HttpException(
          'İşlem numarası gerekli',
          HttpStatus.BAD_REQUEST,
        );
      }

      const islemNoNum = parseInt(islemNo, 10);
      if (isNaN(islemNoNum)) {
        throw new HttpException(
          'Geçersiz işlem numarası',
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await this.islemService.getIslemRSTDetay(islemNoNum);
      return {
        success: true,
        data: data,
        message: 'İşlem RST detayı başarıyla getirildi',
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: this.getErrorMessage(error) || 'İşlem RST detayı getirilemedi',
      };
    }
  }

  /**
   * tblislemRST tablosundan belirli kaydı siler
   */
  @Delete('islem-rst-sil/:islemNo')
  async silIslemRST(@Param('islemNo') islemNo: string) {
    try {
      if (!islemNo) {
        throw new HttpException(
          'İşlem numarası gerekli',
          HttpStatus.BAD_REQUEST,
        );
      }

      const islemNoNum = parseInt(islemNo, 10);
      if (isNaN(islemNoNum)) {
        throw new HttpException(
          'Geçersiz işlem numarası',
          HttpStatus.BAD_REQUEST,
        );
      }

      const sonuc = await this.islemService.silIslemRST(islemNoNum);
      return {
        success: true,
        message: 'İşlem RST tablosundan başarıyla silindi',
        sonuc,
      };
    } catch (error: unknown) {
      console.error('❌ /islem/islem-rst-sil hatası:', error);
      const msg = this.getErrorMessage(error);
      throw new HttpException(
        msg || 'İşlem RST tablosundan silinemedi',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * tblislem tablosunda mevcut kaydı günceller
   */
  @Put('guncelle/:islemNo')
  async guncelleIslem(
    @Param('islemNo') islemNo: string,
    @Body()
    body: {
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
    },
  ) {
    try {
      if (!islemNo) {
        throw new HttpException(
          'İşlem numarası gerekli',
          HttpStatus.BAD_REQUEST,
        );
      }

      const islemNoNum = parseInt(islemNo, 10);
      if (isNaN(islemNoNum)) {
        throw new HttpException(
          'Geçersiz işlem numarası',
          HttpStatus.BAD_REQUEST,
        );
      }

      const sonuc = await this.islemService.guncelleIslem(islemNoNum, body);
      return {
        success: true,
        message: 'İşlem başarıyla güncellendi',
        sonuc,
      };
    } catch (error: unknown) {
      console.error('❌ /islem/guncelle hatası:', error);
      const msg = this.getErrorMessage(error);
      throw new HttpException(
        msg || 'İşlem güncellenirken hata oluştu',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * tblislemRST tablosundaki verileri tblislem tablosuna geri yükler
   */
  @Post('islem-rst-reset')
  async resetIslemFromRST(@Body() body: { islemNo: number }) {
    try {
      if (!body.islemNo) {
        throw new HttpException(
          'İşlem numarası gerekli',
          HttpStatus.BAD_REQUEST,
        );
      }
      const sonuc = await this.islemService.resetIslemFromRST(body.islemNo);
      return {
        success: true,
        message: 'İşlem başarıyla orijinal verilerle güncellendi',
        sonuc,
      };
    } catch (error: unknown) {
      console.error('❌ /islem/islem-rst-reset hatası:', error);
      const msg = this.getErrorMessage(error);
      throw new HttpException(
        msg || 'İşlem orijinal verilerle güncellenirken hata oluştu',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * İşlem kaydını arşivler ve siler
   */
  @Post('sil/:islemNo')
  async silIslem(
    @Param('islemNo') islemNo: string,
    @Body() body: { username?: string }
  ) {
    try {
      if (!islemNo) {
        throw new HttpException(
          'İşlem numarası gerekli',
          HttpStatus.BAD_REQUEST,
        );
      }

      const islemNoNum = parseInt(islemNo, 10);
      if (isNaN(islemNoNum)) {
        throw new HttpException(
          'Geçersiz işlem numarası',
          HttpStatus.BAD_REQUEST,
        );
      }

      const sonuc = await this.islemService.silIslem(islemNoNum, body.username);
      return {
        success: true,
        message: 'İşlem başarıyla arşivlendi ve silindi',
        sonuc,
      };
    } catch (error: unknown) {
      console.error('❌ /islem/sil hatası:', error);
      const msg = this.getErrorMessage(error);
      throw new HttpException(
        msg || 'İşlem silinirken hata oluştu',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * tblislemARV tablosundan en büyük islemNo'ya sahip kaydı getirir
   */
  @Get('islem-arv-en-buyuk')
  async getIslemARVEnBuyuk() {
    try {
      const sonuc = await this.islemService.getIslemARVEnBuyuk();
      return {
        success: true,
        message: "En büyük islemNo'ya sahip arşiv kaydı getirildi",
        sonuc,
      };
    } catch (error: unknown) {
      console.error('❌ /islem/islem-arv-en-buyuk hatası:', error);
      const msg = this.getErrorMessage(error);
      throw new HttpException(
        msg || 'Arşiv kaydı getirilirken hata oluştu',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * tblislemARV tablosundan belirli bir islemNo'dan sonraki kaydı getirir
   */
  @Get('islem-arv-sonraki/:islemNo')
  async getIslemARVSonraki(@Param('islemNo') islemNo: string) {
    try {
      if (!islemNo) {
        throw new HttpException(
          'İşlem numarası gerekli',
          HttpStatus.BAD_REQUEST,
        );
      }

      const islemNoNum = parseInt(islemNo, 10);
      if (isNaN(islemNoNum)) {
        throw new HttpException(
          'Geçersiz işlem numarası',
          HttpStatus.BAD_REQUEST,
        );
      }

      const sonuc = await this.islemService.getIslemARVSonraki(islemNoNum);
      return {
        success: true,
        message: 'Sonraki arşiv kaydı getirildi',
        sonuc,
      };
    } catch (error: unknown) {
      console.error('❌ /islem/islem-arv-sonraki hatası:', error);
      const msg = this.getErrorMessage(error);
      throw new HttpException(
        msg || 'Sonraki arşiv kaydı getirilirken hata oluştu',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * tblislemARV tablosundan belirli bir islemNo'dan önceki kaydı getirir
   */
  @Get('islem-arv-onceki/:islemNo')
  async getIslemARVOnceki(@Param('islemNo') islemNo: string) {
    try {
      if (!islemNo) {
        throw new HttpException(
          'İşlem numarası gerekli',
          HttpStatus.BAD_REQUEST,
        );
      }

      const islemNoNum = parseInt(islemNo, 10);
      if (isNaN(islemNoNum)) {
        throw new HttpException(
          'Geçersiz işlem numarası',
          HttpStatus.BAD_REQUEST,
        );
      }

      const sonuc = await this.islemService.getIslemARVOnceki(islemNoNum);
      return {
        success: true,
        message: 'Önceki arşiv kaydı getirildi',
        sonuc,
      };
    } catch (error: unknown) {
      console.error('❌ /islem/islem-arv-onceki hatası:', error);
      const msg = this.getErrorMessage(error);
      throw new HttpException(
        msg || 'Önceki arşiv kaydı getirilirken hata oluştu',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * tblislemARV tablosundan belirli bir kaydı tblislem tablosuna geri yükler ve arşivden siler
   */
  @Post('islem-arv-geri-yukle')
  async geriYukleIslemARV(@Body() body: { islemNo: number }) {
    try {
      if (!body.islemNo) {
        throw new HttpException(
          'İşlem numarası gerekli',
          HttpStatus.BAD_REQUEST,
        );
      }

      const sonuc = await this.islemService.geriYukleIslemARV(body.islemNo);
      return {
        success: true,
        message: 'Arşiv kaydı başarıyla geri yüklendi ve arşivden silindi',
        sonuc,
      };
    } catch (error: unknown) {
      console.error('❌ /islem/islem-arv-geri-yukle hatası:', error);
      const msg = this.getErrorMessage(error);
      throw new HttpException(
        msg || 'Arşiv kaydı geri yüklenirken hata oluştu',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Tüm RST kayıtlarını getirir (debug amaçlı)
   */
  @Get('rst-records-all')
  async getAllRstRecords() {
    try {
      const rstRecords = await this.islemService.getAllRstRecords();
      
      return {
        success: true,
        data: rstRecords,
        message: `${rstRecords.length} RST kaydı bulundu`,
        count: rstRecords.length
      };
    } catch (error: unknown) {
      console.error('Tüm RST kayıtları getirme hatası:', error);
      const msg = this.getErrorMessage(error);
      throw new HttpException(
        msg || 'RST kayıtları alınırken hata oluştu',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Tüm ARV kayıtlarını getirir (listeleme)
   */
  @Get('arv-records-all')
  async getAllArvRecords() {
    try {
      const arvRecords = await this.islemService.getAllArvRecords();
      return {
        success: true,
        data: arvRecords,
        message: `${arvRecords.length} ARV kaydı bulundu`,
        count: arvRecords.length,
      };
    } catch (error: unknown) {
      const msg = this.getErrorMessage(error);
      throw new HttpException(
        msg || 'ARV kayıtları alınırken hata oluştu',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Onay güncelle: RST */
  @Post('rst-onay-guncelle')
  async setRstOnay(@Body() body: { islemNo: number; onay: number }) {
    const { islemNo, onay } = body || ({} as any)
    if (!islemNo || (onay !== 0 && onay !== 1)) {
      throw new HttpException('Geçersiz parametreler', HttpStatus.BAD_REQUEST)
    }
    const sonuc = await this.islemService.setIslemRSTOnay(islemNo, onay)
    return { success: true, data: sonuc }
  }

  /** Onay güncelle: ARV */
  @Post('arv-onay-guncelle')
  async setArvOnay(@Body() body: { islemNo: number; onay: number }) {
    const { islemNo, onay } = body || ({} as any)
    if (!islemNo || (onay !== 0 && onay !== 1)) {
      throw new HttpException('Geçersiz parametreler', HttpStatus.BAD_REQUEST)
    }
    const sonuc = await this.islemService.setIslemARVOnay(islemNo, onay)
    return { success: true, data: sonuc }
  }

  /** Kar/Zarar özeti */
  @Get('kar-zarar-ozet')
  async getKarZararOzet(
    @Query('start') start: string, 
    @Query('end') end: string,
    @Query('islemTipMode') islemTipMode?: string
  ) {
    if (!start || !end) {
      throw new HttpException('start ve end zorunludur (DD.MM.YYYY)', HttpStatus.BAD_REQUEST)
    }
    const data = await this.islemService.getKarZararOzet(start, end, islemTipMode)
    return { success: true, data }
  }

  /** Kar/Zarar seri (12 dilim) */
  @Get('kar-zarar-seri')
  async getKarZararSeri(
    @Query('period') period = 'gunler', 
    @Query('end') end: string,
    @Query('islemTipMode') islemTipMode?: string
  ) {
    if (!end) {
      throw new HttpException('end zorunludur (DD.MM.YYYY)', HttpStatus.BAD_REQUEST)
    }
    const data = await this.islemService.getKarZararSeri(period, end, islemTipMode)
    return { success: true, data }
  }

  /** Grup detay kayıtları */
  @Get('grup-detay')
  async getGrupDetay(@Query('grup') grup: string, @Query('islemTip') islemTip: string, @Query('start') start: string, @Query('end') end: string) {
    if (!grup || !islemTip || !start || !end) {
      throw new HttpException('grup, islemTip, start ve end zorunludur', HttpStatus.BAD_REQUEST)
    }
    const data = await this.islemService.getGrupDetay(grup, islemTip, start, end)
    return { success: true, data }
  }

  /** Bar chart detay kayıtları */
  @Get('bar-chart-detay')
  async getBarChartDetay(@Query('label') label: string, @Query('islemTip') islemTip: string, @Query('start') start: string, @Query('end') end: string) {
    if (!label || !islemTip || !start || !end) {
      throw new HttpException('label, islemTip, start ve end zorunludur', HttpStatus.BAD_REQUEST)
    }
    const data = await this.islemService.getBarChartDetay(label, islemTip, start, end)
    return { success: true, data }
  }

  /**
   * Birden fazla islemNo için RST kayıtlarını tek sorguda getirir (performans optimizasyonu)
   */
  @Post('rst-records-batch')
  async getRstRecordsBatch(@Body() body: { islemNoList: number[] }) {
    try {
      if (!body.islemNoList || body.islemNoList.length === 0) {
        throw new HttpException(
          'İşlem numarası listesi boş olamaz',
          HttpStatus.BAD_REQUEST,
        );
      }

      const rstRecords = await this.islemService.getRstRecordsForMultipleIslemNo(body.islemNoList);
      
      return {
        success: true,
        data: rstRecords,
        message: `${rstRecords.length} RST kaydı bulundu`,
        count: rstRecords.length
      };
    } catch (error: unknown) {
      console.error('RST kayıtları toplu getirme hatası:', error);
      const msg = this.getErrorMessage(error);
      throw new HttpException(
        msg || 'RST kayıtları alınırken hata oluştu',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
