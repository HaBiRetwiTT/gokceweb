/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

function debugLog(...args: unknown[]): void {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Add global validation pipe
  app.useGlobalPipes(new ValidationPipe());
  
  // Set timeout for large datasets
  app.use((req, res, next) => {
    res.setTimeout(120000); // 2 dakika timeout
    next();
  });
  
  // Enable CORS for frontend communication
  const allowedOrigins = [
    'http://localhost:9000', // Development
    'https://gokceweb.vercel.app', // Production - Vercel URL'inizi buraya ekleyin
    'https://gokcepansiyon-pyxgdccln-habiretwitt-6937s-projects.vercel.app', // Mevcut Vercel URL'iniz
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
  debugLog(`Backend running on port ${process.env.PORT ?? 3000}`);
}
void bootstrap();
