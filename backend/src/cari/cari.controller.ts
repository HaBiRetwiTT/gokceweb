import { Controller, Get } from '@nestjs/common';
import { CariService } from './cari.service';

@Controller('cari')
export class CariController {
  constructor(private readonly cariService: CariService) {}

  @Get('tedarikci')
  async getTedarikciListesi() {
    return await this.cariService.getTedarikciListesi();
  }

  @Get('musteri')
  async getMusteriListesi() {
    return await this.cariService.getMusteriListesi();
  }
} 