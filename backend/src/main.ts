/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Add global validation pipe
  app.useGlobalPipes(new ValidationPipe());
  
  // Enable CORS for frontend communication
  const allowedOrigins = [
    'http://localhost:9000', // Development
    'https://gokceweb.vercel.app', // Production - Vercel URL'inizi buraya ekleyin
    'https://gokcepansiyon-bzyq5q6br-habiretwitt-6937s-projects.vercel.app', // Mevcut Vercel URL'iniz
    'https://*.vercel.app', // Tüm Vercel subdomain'leri
  ];
  
  app.enableCors({
    origin: [
      'http://localhost:9000',
      'http://localhost:3000',
      'https://*.vercel.app',
      'https://vercel.app',
      /^https:\/\/.*\.vercel\.app$/,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Backend running on port ${process.env.PORT ?? 3000}`);
}
void bootstrap();
