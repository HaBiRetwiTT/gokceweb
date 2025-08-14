// @ts-nocheck
import { Controller, Get, Post, Put, Body, Query } from '@nestjs/common';
import { HotelRunnerService } from './hotelrunner.service';

@Controller('hotelrunner')
export class HotelRunnerController {
  constructor(private readonly hrService: HotelRunnerService) {}

  // Manuel senkron tetiklemek için basit endpoint
  @Get('sync-reservations')
  async syncReservations(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const result = await this.hrService.fetchAndStoreReservations({ from, to });
    return {
      success: true,
      inserted: result.inserted,
      updated: result.updated,
      rawUpserted: result.rawUpserted,
    };
  }

  // Bekleyen (check-in zamanı gelmiş/geçmiş ve confirmed kalan) rezervasyonlar
  @Get('pending-reservations')
  async getPendingReservations() {
    const rows = await this.hrService.getPendingReservations();
    return { success: true, data: rows };
  }

  // Rezervasyonu HR portalında No-Show yap (proxy)
  @Post('no-show')
  async markNoShow(@Body() body: { hrResId: string }) {
    const hrResId = (body?.hrResId || '').toString();
    if (!hrResId) {
      return { success: false, message: 'hrResId zorunludur.' };
    }
    const result = await this.hrService.markReservationNoShow(hrResId);
    return result;
  }

  // Aynı işlemi PUT ile de destekle
  @Put('no-show')
  async markNoShowPut(@Body() body: { hrResId: string }) {
    return this.markNoShow(body);
  }

  // Rezervasyonu HR portalında Check-in yap (proxy)
  @Post('check-in')
  async markCheckIn(@Body() body: { hrResId: string }) {
    const hrResId = (body?.hrResId || '').toString();
    if (!hrResId) {
      return { success: false, message: 'hrResId zorunludur.' };
    }
    const result = await this.hrService.markReservationCheckIn(hrResId);
    return result;
  }

  // Aynı işlemi PUT ile de destekle
  @Put('check-in')
  async markCheckInPut(@Body() body: { hrResId: string }) {
    return this.markCheckIn(body);
  }

  // Lokal olarak sadece durum bilgisini değiştir (checked_in | no_show)
  @Post('local-status')
  async updateLocalStatus(
    @Body() body: { hrResId: string; status: 'checked_in' | 'no_show' },
  ) {
    const hrResId = (body?.hrResId || '').toString();
    const status = (body?.status || '').toString() as 'checked_in' | 'no_show';
    if (!hrResId || (status !== 'checked_in' && status !== 'no_show')) {
      return { success: false, message: 'Geçersiz parametreler' };
    }
    const result = await this.hrService.updateLocalReservationStatus(
      hrResId,
      status,
    );
    return result;
  }
}
