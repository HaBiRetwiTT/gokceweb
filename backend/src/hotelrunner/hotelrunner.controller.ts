// @ts-nocheck
import { Controller, Get, Query } from '@nestjs/common';
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
    return { success: true, inserted: result.inserted, updated: result.updated };
  }
}


