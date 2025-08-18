import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NakitAkisController } from './nakit-akis.controller';
import { NakitAkisService } from './nakit-akis.service';
import { DatabaseConfigService } from '../database/database-config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([]), // Entity yok, sadece raw query kullanıyoruz
  ],
  controllers: [NakitAkisController],
  providers: [NakitAkisService, DatabaseConfigService],
  exports: [NakitAkisService],
})
export class NakitAkisModule {}
