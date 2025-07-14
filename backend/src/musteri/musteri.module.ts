/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Musteri } from '../entities/musteri.entity';
import { MusteriService } from './musteri.service';
import { MusteriController } from './musteri.controller';
import { Cari } from '../entities/cari.entity';
import { OdaYatak, OdaTipLfyt } from '../entities/oda-yatak.entity';
import { DatabaseConfigService } from '../database/database-config.service';
import { DatabaseTransactionService } from '../database/database-transaction.service';

@Module({
  imports: [TypeOrmModule.forFeature([Musteri, Cari, OdaYatak, OdaTipLfyt])],
  controllers: [MusteriController],
  providers: [MusteriService, DatabaseConfigService, DatabaseTransactionService],
})
export class MusteriModule {}
