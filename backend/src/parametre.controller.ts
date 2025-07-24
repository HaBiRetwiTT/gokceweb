import { Controller, Get } from '@nestjs/common';
import { ParametreService } from './parametre.service';
import { ParametreAlternativeService } from './parametre-alternative.service';

@Controller('parametre')
export class ParametreController {
  constructor(
    private readonly parametreService: ParametreService,
    private readonly parametreAltService: ParametreAlternativeService,
  ) {}

  @Get('ek-hizmetler')
  async getEkHizmetler() {
    // Önce raw query ile dene
    try {
      const data = await this.parametreService.getEkHizmetler();
      return { success: true, data, method: 'raw-query' };
    } catch (rawError) {
      console.log('🔥 Raw query failed, trying entity method...');
      
      // Raw query başarısızsa, entity method kullan
      try {
        const data = await this.parametreAltService.getEkHizmetlerWithEntity();
        return { success: true, data, method: 'entity-method', rawError: rawError.message };
      } catch (entityError) {
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
    } catch (rawError) {
      console.log('🔥 Raw query failed for komisyon, trying entity method...');
      
      // Raw query başarısızsa, entity method kullan
      try {
        const oran = await this.parametreAltService.getKomisyonOraniWithEntity();
        return { success: true, oran, method: 'entity-method', rawError: rawError.message };
      } catch (entityError) {
        console.error('🔥 Both methods failed for komisyon:', { rawError, entityError });
        throw entityError;
      }
    }
  }
} 