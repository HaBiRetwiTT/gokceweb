import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parametre } from './entities/parametre.entity';
import { ParametreService } from './parametre.service';
import { ParametreAlternativeService } from './parametre-alternative.service';
import { ParametreController } from './parametre.controller';
import { DatabaseConfigService } from './database/database-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([Parametre])],
  controllers: [ParametreController],
  providers: [ParametreService, ParametreAlternativeService, DatabaseConfigService],
  exports: [ParametreService, ParametreAlternativeService],
})
export class ParametreModule {} 