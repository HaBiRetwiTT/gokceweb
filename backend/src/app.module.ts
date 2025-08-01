/* eslint-disable prettier/prettier */
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MusteriModule } from './musteri/musteri.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuthModule } from './auth/auth.module';
import { ParametreModule } from './parametre.module';
import { KonaklamaTakvimModule } from './konaklama-takvim/konaklama-takvim.module';
import { DatabaseConfigService } from './database/database-config.service';
import { JwtMiddleware } from './auth/jwt.middleware';
import * as dotenv from 'dotenv';
import { OdemeIslemController } from './odeme-islem.controller';
import { OdemeIslemService } from './odeme-islem.service';
import { DatabaseTransactionService } from './database/database-transaction.service';

// Load environment variables
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
});

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const dbConfigService = new DatabaseConfigService();
        return dbConfigService.getDatabaseConfig();
      },
    }),
    MusteriModule,
    DashboardModule,
    AuthModule,
    ParametreModule,
    KonaklamaTakvimModule,
  ],
  controllers: [AppController, OdemeIslemController],
  providers: [AppService, DatabaseConfigService, OdemeIslemService, DatabaseTransactionService],
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