import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CariController } from './cari.controller';
import { CariService } from './cari.service';
import { Cari } from '../entities/cari.entity';
import { DatabaseConfigService } from '../database/database-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cari])],
  controllers: [CariController],
  providers: [CariService, DatabaseConfigService],
  exports: [CariService]
})
export class CariModule {} 