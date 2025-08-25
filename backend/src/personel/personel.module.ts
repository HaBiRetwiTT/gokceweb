import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonelController } from './personel.controller';
import { PersonelService } from './personel.service';
import { DatabaseTransactionService } from '../database/database-transaction.service';
import { DatabaseConfigService } from '../database/database-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([Object])], // Personel entity'si yok, Object kullanıyoruz
  controllers: [PersonelController],
  providers: [PersonelService, DatabaseTransactionService, DatabaseConfigService],
  exports: [PersonelService]
})
export class PersonelModule {}
