/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KonaklamaTakvimController } from './konaklama-takvim.controller';
import { KonaklamaTakvimService } from './konaklama-takvim.service';
import { Musteri } from '../entities/musteri.entity';
import { DatabaseConfigService } from '../database/database-config.service';
import { DatabaseTransactionService } from '../database/database-transaction.service';

@Module({
  imports: [TypeOrmModule.forFeature([Musteri])],
  controllers: [KonaklamaTakvimController],
  providers: [KonaklamaTakvimService, DatabaseConfigService, DatabaseTransactionService],
  exports: [KonaklamaTakvimService],
})
export class KonaklamaTakvimModule {}
