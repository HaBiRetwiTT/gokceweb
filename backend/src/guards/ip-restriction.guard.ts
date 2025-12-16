/* eslint-disable prettier/prettier */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IpRestrictionService } from '../admin/ip-restriction.service';

/**
 * IP Kısıtlama Guard'ı
 * Püf Nokta: Her request'te client IP'sini kontrol eder
 * X-Forwarded-For header'ı proxy/nginx arkasında çalışma durumu için kontrol edilir
 */
@Injectable()
export class IpRestrictionGuard implements CanActivate {
  // IP kontrolünden muaf kullanıcılar
  private readonly exemptUsers = ['SAadmin', 'HARUN', 'KADİR'];

  constructor(
    private ipRestrictionService: IpRestrictionService,
    private reflector: Reflector,
  ) {}

  /**
   * Client IP adresini alır
   * Püf Nokta: Proxy arkasında çalışma durumu için X-Forwarded-For header'ını kontrol eder
   */
  private getClientIp(request: any): string {
    // X-Forwarded-For header'ından IP al (nginx/proxy arkasında)
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      // Birden fazla IP varsa ilkini al (client IP)
      return forwardedFor.split(',')[0].trim();
    }

    // X-Real-IP header'ından IP al
    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return realIp;
    }

    // Direkt connection için req.ip kullan
    return request.ip || request.connection?.remoteAddress || 'unknown';
  }

  /**
   * Request'in IP kısıtlamasından muaf olup olmadığını kontrol eder
   * Püf Nokta: Admin IP ayarları endpoint'leri hariç tutulmalı ki ayarları yapabilelim
   */
  private isExemptRoute(request: any): boolean {
    const exemptRoutes = [
      '/auth/login',                    // Login endpoint'i hariç tut
      '/health',                        // Health check
      '/api/docs',                      // API documentation
      '/admin/ip-restrictions',         // IP yönetim endpoint'leri
      '/admin/current-ip',              // Mevcut IP endpoint'i
    ];

    const path = request.route?.path || request.url;
    return exemptRoutes.some(route => path.includes(route));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Belirli route'lar IP kontrolünden muaf
    if (this.isExemptRoute(request)) {
      return true;
    }

    // Belirli kullanıcılar IP kontrolünden muaf
    // Püf Nokta: Super admin ve yetkili kullanıcılar her zaman erişebilir
    const user = request.user;
    if (user && this.exemptUsers.includes(user.username)) {
      if (process.env.NODE_ENV === 'development' || process.env.DEBUG_IP_CHECK === 'true') {
        console.log(`IP Restriction - ${user.username} user bypassed (exempt user)`);
      }
      return true;
    }

    // Client IP adresini al
    const clientIp = this.getClientIp(request);

    // Debug için console'a yazdır (sadece development modunda)
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_IP_CHECK === 'true') {
      console.log(`IP Restriction Check - Client IP: ${clientIp}, Route: ${request.url}, User: ${user?.username || 'anonymous'}`);
    }

    // IPv6 localhost'u IPv4'e çevir
    const normalizedIp = clientIp === '::1' ? '127.0.0.1' : clientIp;

    // IP'nin izin listesinde olup olmadığını kontrol et
    const isAllowed = await this.ipRestrictionService.isIpAllowed(normalizedIp);

    if (!isAllowed) {
      console.log(`IP Restriction - Access Denied for IP: ${normalizedIp}, User: ${user?.username || 'anonymous'}`);
      throw new ForbiddenException(
        'Erişim reddedildi. IP adresiniz izin listesinde değil.',
      );
    }

    return true;
  }
}

