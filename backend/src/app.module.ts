/* eslint-disable prettier/prettier */
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MusteriModule } from './musteri/musteri.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseConfigService } from './database/database-config.service';
import { JwtMiddleware } from './auth/jwt.middleware';
import * as dotenv from 'dotenv';

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
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseConfigService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes('*'); // Tüm route'larda middleware'i kullan
  }
}