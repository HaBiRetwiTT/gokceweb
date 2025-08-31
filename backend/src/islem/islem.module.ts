import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IslemController } from './islem.controller';
import { IslemService } from './islem.service';
import { DatabaseConfigService } from '../database/database-config.service';
import { DatabaseTransactionService } from '../database/database-transaction.service';
import { Islem } from '../entities/islem.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Islem])],
  controllers: [IslemController],
  providers: [IslemService, DatabaseConfigService, DatabaseTransactionService],
  exports: [IslemService],
})
export class IslemModule {}
