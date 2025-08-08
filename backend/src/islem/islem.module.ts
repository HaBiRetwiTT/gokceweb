import { Module } from '@nestjs/common';
import { IslemController } from './islem.controller';
import { IslemService } from './islem.service';
import { DatabaseConfigService } from '../database/database-config.service';
import { DatabaseTransactionService } from '../database/database-transaction.service';

@Module({
  controllers: [IslemController],
  providers: [IslemService, DatabaseConfigService, DatabaseTransactionService],
  exports: [IslemService],
})
export class IslemModule {}
