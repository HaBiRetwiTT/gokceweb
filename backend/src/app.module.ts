/* eslint-disable prettier/prettier */
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Reflector } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MusteriModule } from './musteri/musteri.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuthModule } from './auth/auth.module';
import { ParametreModule } from './parametre.module';
import { KonaklamaTakvimModule } from './konaklama-takvim/konaklama-takvim.module';
import { CariModule } from './cari/cari.module';
import { IslemModule } from './islem/islem.module';
import { AgentModule } from './agent/agent.module';
import { DatabaseConfigService } from './database/database-config.service';
import { JwtMiddleware } from './auth/jwt.middleware';
import { OdemeIslemController } from './odeme-islem.controller';
import { OdemeIslemService } from './odeme-islem.service';
import { DatabaseTransactionService } from './database/database-transaction.service';
import { HotelRunnerModule } from './hotelrunner/hotelrunner.module';
import { PersonelModule } from './personel/personel.module';
import { AdminModule } from './admin/admin.module';
import { IpRestrictionGuard } from './guards/ip-restriction.guard';
import * as dotenv from 'dotenv';

// Production environment variables yükle
dotenv.config({ path: '.env.production' });

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const dbConfigService = new DatabaseConfigService();
        return dbConfigService.getDatabaseConfig();
      },
    }),
    HttpModule,
    MusteriModule,
    DashboardModule,
    AuthModule,
    ParametreModule,
    KonaklamaTakvimModule,
    CariModule,
    IslemModule,
    AgentModule,
    HotelRunnerModule,
    PersonelModule,
    AdminModule,
  ],
  controllers: [AppController, OdemeIslemController],
  providers: [
    AppService, 
    DatabaseConfigService, 
    OdemeIslemService, 
    DatabaseTransactionService,
    Reflector,
    {
      provide: APP_GUARD,
      useClass: IpRestrictionGuard,
    },
  ],
  //controllers: [OdemeIslemController, ...],
  //providers: [OdemeIslemService, ...],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes('*'); // Tüm route'larda middleware'i kullan
  }
}