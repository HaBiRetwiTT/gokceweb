/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
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

  @Get('kat-oda-plan')
  async getKatOdaPlan() {
    return this.konaklamaTakvimService.getKatOdaPlan();
  }

  @Post('oda-ariza')
  async setOdaAriza(@Body() body: { odaNo: number; ariza: boolean }) {
    const { odaNo, ariza } = body || ({} as { odaNo: number; ariza: boolean });
    return this.konaklamaTakvimService.setOdaArizaDurum(odaNo, ariza);
  }

  @Post('oda-kirli')
  async setOdaKirli(@Body() body: { odaNo: number; kirli: boolean }) {
    const { odaNo, kirli } = body || ({} as { odaNo: number; kirli: boolean });
    return this.konaklamaTakvimService.setOdaKirliDurum(odaNo, kirli);
  }

  @Get('oda-yatak-durum')
  async getOdaYatakDurum(
    @Query('odaNo') odaNo: string,
    @Query('yatakNo') yatakNo: string
  ) {
    return this.konaklamaTakvimService.getOdaYatakDurum(odaNo, yatakNo);
  }

  @Post('oda-yatak-durum')
  async updateOdaYatakDurum(@Body() body: { odaNo: string; yatakNo: string; durum: string }) {
    const { odaNo, yatakNo, durum } = body || ({} as { odaNo: string; yatakNo: string; durum: string });
    return this.konaklamaTakvimService.updateOdaYatakDurum(odaNo, yatakNo, durum);
  }
}