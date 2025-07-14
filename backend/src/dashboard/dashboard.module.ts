/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Musteri } from '../entities/musteri.entity';
import { DatabaseConfigService } from '../database/database-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([Musteri])],
  controllers: [DashboardController],
  providers: [DashboardService, DatabaseConfigService],
})
export class DashboardModule {} 