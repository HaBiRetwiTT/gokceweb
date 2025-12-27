import {
  Controller,
  Get,
  Put,
  Body,
  Post,
  Delete,
  Param,
  Patch,
  Req,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AdminService } from './admin.service';
import { IpRestrictionService, IPKisitlamaDto } from './ip-restriction.service';

@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private ipRestrictionService: IpRestrictionService,
    private httpService: HttpService,
  ) {}

  @Get('oda-tip-lifyat')
  async getOdaTipLifyat() {
    try {
      const data = await this.adminService.getOdaTipLifyat();
      return {
        success: true,
        data,
        message: 'Oda tip lifyat verileri başarıyla getirildi',
      };
    } catch (error) {
      console.error('Oda tip lifyat getirme hatası:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  }

  @Put('oda-tip-lifyat-guncelle')
  async updateOdaTipLifyat(@Body() body: { kayitlar: any[] }) {
    try {
      const result = await this.adminService.updateOdaTipLifyat(body.kayitlar);
      return {
        success: true,
        data: result,
        message: `${result.length} kayıt başarıyla güncellendi`,
      };
    } catch (error) {
      console.error('Oda tip lifyat güncelleme hatası:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  }

  @Post('oda-tip-lifyat-ekle')
  async createOdaTipLifyat(
    @Body()
    body: {
      OdTipAdi: string;
      OdLfytGun: number;
      OdLfytHft: number;
      OdLfytAyl: number;
      OdDpzt: number;
    },
  ) {
    try {
      await this.adminService.createOdaTipLifyat(body);
      return {
        success: true,
        message: 'Oda tipi başarıyla eklendi',
      };
    } catch (error) {
      console.error('Oda tip lifyat ekleme hatası:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  }

  // IP Kısıtlama Endpoint'leri

  /**
   * IP kısıtlama bilgilerini getirir (durum + IP listesi)
   */
  @Get('ip-restrictions')
  async getIpRestrictions() {
    try {
      const data = await this.ipRestrictionService.getIpRestrictionInfo();
      return {
        success: true,
        data,
        message: 'IP kısıtlama bilgileri başarıyla getirildi',
      };
    } catch (error) {
      console.error('IP kısıtlama bilgileri getirme hatası:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  }

  /**
   * Yeni IP adresi ekler
   */
  @Post('ip-restrictions')
  async addIpRestriction(
    @Body() body: IPKisitlamaDto & { kullaniciAdi: string },
  ) {
    try {
      const kullanici = body.kullaniciAdi || 'SYSTEM';
      const result = await this.ipRestrictionService.addIpRestriction(
        { ipAdres: body.ipAdres, aciklama: body.aciklama },
        kullanici,
      );
      return {
        success: true,
        data: result,
        message: 'IP adresi başarıyla eklendi',
      };
    } catch (error) {
      console.error('IP ekleme hatası:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  }

  /**
   * IP adresini siler
   */
  @Delete('ip-restrictions/:id')
  async deleteIpRestriction(@Param('id') id: string) {
    try {
      await this.ipRestrictionService.deleteIpRestriction(parseInt(id, 10));
      return {
        success: true,
        data: null,
        message: 'IP adresi başarıyla silindi',
      };
    } catch (error) {
      console.error('IP silme hatası:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  }

  /**
   * IP kısıtlama sistemini aktif/pasif yapar
   */
  @Patch('ip-restrictions/toggle')
  async toggleIpRestriction(
    @Body() body: { aktif: boolean; kullaniciAdi: string },
  ) {
    try {
      const kullanici = body.kullaniciAdi || 'SYSTEM';
      const result = await this.ipRestrictionService.toggleIpRestriction(
        body.aktif,
        kullanici,
      );
      return {
        success: true,
        data: result,
        message: `IP kısıtlama ${body.aktif ? 'aktif' : 'pasif'} edildi`,
      };
    } catch (error) {
      console.error('IP kısıtlama toggle hatası:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  }

  /**
   * Mevcut client IP adresini döndürür
   * Püf Nokta: Hem local hem de external IP gösterilir
   */
  @Get('current-ip')
  async getCurrentIp(@Req() request: any) {
    try {
      // Client IP'yi al (local/internal IP)
      const forwardedFor = request.headers['x-forwarded-for'];
      const realIp = request.headers['x-real-ip'];
      const localIp = forwardedFor
        ? forwardedFor.split(',')[0].trim()
        : realIp || request.ip || request.connection?.remoteAddress;

      const normalizedLocalIp = localIp === '::1' ? '127.0.0.1' : localIp;

      // External IP'yi al (third-party servisten)
      let externalIp = null;
      try {
        const response = await firstValueFrom(
          this.httpService.get('https://api.ipify.org?format=json', {
            timeout: 3000,
          }),
        );
        externalIp = response.data.ip;
      } catch (externalError) {
        console.warn('External IP alınamadı:', externalError);
      }

      return {
        success: true,
        data: {
          localIp: normalizedLocalIp,
          externalIp: externalIp,
          // Backward compatibility için
          ip: externalIp || normalizedLocalIp,
        },
        message: 'IP adresi başarıyla getirildi',
      };
    } catch (error) {
      console.error('IP getirme hatası:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  }
}
