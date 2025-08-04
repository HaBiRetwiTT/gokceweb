import { Controller, Get } from '@nestjs/common';
import { CariService } from './cari.service';

@Controller('cari')
export class CariController {
  constructor(private readonly cariService: CariService) {}

  @Get('health')
  async healthCheck() {
    return { status: 'OK', message: 'Cari API is running', timestamp: new Date().toISOString() };
  }

  @Get('tedarikci')
  async getTedarikciListesi() {
    try {
      console.log('Tedarikçi listesi endpoint\'i çağrıldı');
      const result = await this.cariService.getTedarikciListesi();
      console.log('Tedarikçi listesi başarıyla döndürüldü, kayıt sayısı:', result.length);
      return result;
    } catch (error) {
      console.error('Tedarikçi listesi controller hatası:', error);
      throw error;
    }
  }

  @Get('musteri')
  async getMusteriListesi() {
    try {
      console.log('Müşteri listesi endpoint\'i çağrıldı');
      const result = await this.cariService.getMusteriListesi();
      console.log('Müşteri listesi başarıyla döndürüldü, kayıt sayısı:', result.length);
      return result;
    } catch (error) {
      console.error('Müşteri listesi controller hatası:', error);
      throw error;
    }
  }
} 