/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

function debugLog(...args: unknown[]): void {
  // Production'da logging kapalı
  console.log(...args);
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
  
  // Püf Nokta: Tüm gelen istekleri loglayarak debug yapıyoruz
  // Özellikle "+" karakteri içeren URL'lerin nasıl geldiğini görmek için
  app.use((req, res, next) => {
    // Sadece musteri endpoint'leri için detaylı log
    if (req.url.includes('bos-odalar') || req.url.includes('oda-tip-fiyatlari')) {
      console.log('🌐 [REQUEST LOG]', {
        method: req.method,
        url: req.url,
        originalUrl: req.originalUrl,
        path: req.path,
        query: req.query,
        params: req.params,
        headers: {
          host: req.headers.host,
          'user-agent': req.headers['user-agent']
        }
      });
    }
    next();
  });
  
  // Enable CORS for frontend communication
  // VPS'te frontend ve backend aynı sunucuda olduğu için CORS ayarları basitleştirilebilir
  app.enableCors({
    origin: (origin, callback) => {
      // Püf Nokta: origin undefined olabilir (same-origin istekleri için)
      // Bu durumda izin ver (backend'den backend'e istekler için)
      if (!origin) {
        return callback(null, true);
      }
      
      const allowedOrigins = [
        'http://localhost:9000', // Development
        'http://localhost:80', // VPS'te IIS varsayılan port (HTTP)
        'http://localhost:443', // VPS'te IIS varsayılan port (HTTPS)
        // Domain adresi (HTTPS)
        'https://gokcepms.com', // Ana domain (HTTPS)
        'http://gokcepms.com', // Ana domain (HTTP - yönlendirme için)
        'https://www.gokcepms.com', // www subdomain (HTTPS)
        'http://www.gokcepms.com', // www subdomain (HTTP - yönlendirme için)
      ];
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400, // 24 saat - preflight cache süresi
  });
  
  // Püf Nokta: Backend'i sadece localhost'tan erişilebilir yaparak güvenliği artırıyoruz
  // IIS reverse proxy üzerinden /api istekleri backend'e yönlendirilecek
  // Bu sayede port 3000'i dışarıya açmadan güvenli bir şekilde API istekleri yapabiliyoruz
  await app.listen(3000, '127.0.0.1');
  debugLog(`Backend running on port 3000 (localhost only - accessible via IIS reverse proxy)`);
  
  // Graceful shutdown: PM2 restart/reload sırasında aktif isteklerin tamamlanmasını sağlar
  // Püf Nokta: SIGTERM ve SIGINT sinyalleri geldiğinde, NestJS aktif bağlantıları kapatmadan önce
  // mevcut isteklerin tamamlanmasını bekler (varsayılan 10 saniye timeout)
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server gracefully');
    await app.close();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server gracefully');
    await app.close();
    process.exit(0);
  });
}
void bootstrap();
