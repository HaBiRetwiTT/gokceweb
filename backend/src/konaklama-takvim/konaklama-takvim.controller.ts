/* eslint-disable prettier/prettier */
import { Controller, Get, Query } from '@nestjs/common';
import { KonaklamaTakvimService } from './konaklama-takvim.service';

@Controller('konaklama-takvim')
export class KonaklamaTakvimController {
  constructor(private readonly konaklamaTakvimService: KonaklamaTakvimService) {}

  @Get('oda-doluluk')
  async getOdaDolulukTakvimi(
    @Query('baslangicTarihi') baslangicTarihi?: string,
    @Query('gunSayisi') gunSayisi?: string
  ) {
    const gunSayisiInt = gunSayisi ? parseInt(gunSayisi) : 32; // Varsayılan 32 gün
    console.log(`🎯 API çağrısı: gunSayisi param = ${gunSayisi}, parsed = ${gunSayisiInt}`);
    return this.konaklamaTakvimService.getOdaDolulukTakvimi(baslangicTarihi, gunSayisiInt);
  }
}