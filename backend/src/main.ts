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
    'https://*.vercel.app', // Tüm Vercel subdomain'leri
  ];
  
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Backend running on port ${process.env.PORT ?? 3000}`);
}
void bootstrap();
