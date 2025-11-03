import { Controller, Get, Put, Body } from '@nestjs/common';
import { ParametreService } from './parametre.service';
import { ParametreAlternativeService } from './parametre-alternative.service';

@Controller('parametre')
export class ParametreController {
  constructor(
    private readonly parametreService: ParametreService,
    private readonly parametreAltService: ParametreAlternativeService,
  ) {}

  private extractMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    try {
      return JSON.stringify(error);
    } catch {
      return 'Bilinmeyen hata';
    }
  }

  @Get('ek-hizmetler')
  async getEkHizmetler() {
    // Önce raw query ile dene
    try {
      const data = await this.parametreService.getEkHizmetler();
      return { success: true, data, method: 'raw-query' };
    } catch (rawError: unknown) {
      console.log('🔥 Raw query failed, trying entity method...');

      // Raw query başarısızsa, entity method kullan
      try {
        const data = await this.parametreAltService.getEkHizmetlerWithEntity();
        return {
          success: true,
          data,
          method: 'entity-method',
          rawError: this.extractMessage(rawError),
        };
      } catch (entityError: unknown) {
        console.error('🔥 Both methods failed:', { rawError, entityError });
        throw entityError;
      }
    }
  }

  @Get('komisyon-orani')
  async getKomisyonOrani() {
    // Önce raw query ile dene
    try {
      const oran = await this.parametreService.getKomisyonOrani();
      return { success: true, oran, method: 'raw-query' };
    } catch (rawError: unknown) {
      console.log('🔥 Raw query failed for komisyon, trying entity method...');

      // Raw query başarısızsa, entity method kullan
      try {
        const oran =
          await this.parametreAltService.getKomisyonOraniWithEntity();
        return {
          success: true,
          oran,
          method: 'entity-method',
          rawError: this.extractMessage(rawError),
        };
      } catch (entityError: unknown) {
        console.error('🔥 Both methods failed for komisyon:', {
          rawError,
          entityError,
        });
        throw entityError;
      }
    }
  }

  @Get('gec-saat-sonu')
  async getGecSaatSonu() {
    try {
      const saat = await this.parametreService.getGecSaatSonu();
      return { success: true, saat };
    } catch (error: unknown) {
      console.error('🔥 getGecSaatSonu failed:', error);
      return { success: false, saat: 6 }; // Fallback
    }
  }

  @Put('gec-saat-sonu')
  async updateGecSaatSonu(@Body() body: { saat: number }) {
    try {
      const basarili = await this.parametreService.updateGecSaatSonu(body.saat);
      return {
        success: basarili,
        message: basarili
          ? 'Geç Saat Konaklama sonu başarıyla güncellendi'
          : 'Güncelleme başarısız',
      };
    } catch (error: unknown) {
      console.error('🔥 updateGecSaatSonu failed:', error);
      return { success: false, message: 'Güncelleme hatası' };
    }
  }
}
