import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Request interface'ini extend et
declare global {
  namespace Express {
    interface Request {
      user?: {
        username: string;
        id: number;
        isAdmin: boolean;
      };
    }
  }
}

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Frontend'den gelen kullanıcı adını request body'den al
    const kullaniciAdi = req.body?.kullaniciAdi || req.query?.kullaniciAdi;

    if (kullaniciAdi) {
      // Request nesnesine user bilgisini ekle
      req.user = {
        username: kullaniciAdi,
        id: 0, // Şimdilik 0, gerçek implementasyonda JWT'den alınacak
        isAdmin: kullaniciAdi === 'admin',
      };
    }

    next();
  }
}
