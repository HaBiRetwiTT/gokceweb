// @ts-nocheck
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HotelRunnerController } from './hotelrunner.controller';
import { HotelRunnerService } from './hotelrunner.service';
import { DatabaseTransactionService } from '../database/database-transaction.service';
import { DatabaseConfigService } from '../database/database-config.service';

@Module({
  imports: [HttpModule],
  controllers: [HotelRunnerController],
  providers: [
    HotelRunnerService,
    DatabaseTransactionService,
    DatabaseConfigService,
  ],
  exports: [HotelRunnerService],
})
export class HotelRunnerModule {}
