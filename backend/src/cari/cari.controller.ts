import { Controller, Get } from '@nestjs/common';
import { CariService } from './cari.service';

@Controller('cari')
export class CariController {
  constructor(private readonly cariService: CariService) {}

  private debugLog(...args: unknown[]): void {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  }

  @Get('health')
  async healthCheck() {
    return { status: 'OK', message: 'Cari API is running', timestamp: new Date().toISOString() };
  }

  @Get('tedarikci')
  async getTedarikciListesi() {
    try {
      this.debugLog('Tedarikçi listesi endpoint\'i çağrıldı');
      const result = await this.cariService.getTedarikciListesi();
      this.debugLog('Tedarikçi listesi başarıyla döndürüldü, kayıt sayısı:', result.length);
      return result;
    } catch (error) {
      console.error('Tedarikçi listesi controller hatası:', error);
      throw error;
    }
  }

  @Get('musteri')
  async getMusteriListesi() {
    try {
      this.debugLog('Müşteri listesi endpoint\'i çağrıldı');
      const result = await this.cariService.getMusteriListesi();
      this.debugLog('Müşteri listesi başarıyla döndürüldü, kayıt sayısı:', result.length);
      return result;
    } catch (error) {
      console.error('Müşteri listesi controller hatası:', error);
      throw error;
    }
  }
} 