import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { IpRestrictionService } from './ip-restriction.service';
import { DatabaseConfigService } from '../database/database-config.service';
import { IPKisitlama } from '../entities/ip-kisitlama.entity';
import { SistemAyar } from '../entities/sistem-ayar.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([IPKisitlama, SistemAyar]),
    HttpModule
  ],
  controllers: [AdminController],
  providers: [AdminService, IpRestrictionService, DatabaseConfigService],
  exports: [AdminService, IpRestrictionService]
})
export class AdminModule {}
