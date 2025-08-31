import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Express global type augmentation using declare module (ES module friendly)
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      username: string;
      id: number;
      isAdmin: boolean;
    };
  }
}

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Frontend'den gelen kullanıcı adını güvenli şekilde al
    const body = (req.body ?? {}) as Record<string, unknown>;
    const query = (req.query ?? {}) as Record<string, unknown>;
    const rawKullaniciAdi = body.kullaniciAdi ?? query.kullaniciAdi;
    const kullaniciAdi =
      typeof rawKullaniciAdi === 'string' ? rawKullaniciAdi : undefined;

    if (kullaniciAdi) {
      // Production ortamında sadece username aktar, id/isAdmin belirleme
      req.user = {
        username: kullaniciAdi,
        id: -1, // bilinmiyor
        isAdmin: false,
      };
    }

    next();
  }
}
