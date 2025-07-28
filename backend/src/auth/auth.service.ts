import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Personel } from '../entities/personel.entity';

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    username: string;
    fullName: string;
    isAdmin: boolean;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Personel)
    private personelRepository: Repository<Personel>,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    try {
      const { username, password } = loginDto;

      // Case insensitive kontrol için
      const normalizedUsername = username.toLowerCase().trim();
      const normalizedPassword = password.toLowerCase().trim();

      // Personel tablosundan kullanıcı kontrolü
      const personel = await this.personelRepository
        .createQueryBuilder('personel')
        .where('LOWER(personel.PrsnUsrNm) = LOWER(:username)', {
          username: normalizedUsername,
        })
        .andWhere('LOWER(personel.PrsnPassw) = LOWER(:password)', {
          password: normalizedPassword,
        })
        .andWhere('personel.PrsnDurum = :durum', { durum: 'ÇALIŞIYOR' })
        .getOne();

      if (personel) {
        return {
          success: true,
          message: 'Giriş başarılı',
          user: {
            id: personel.PrsnNo,
            username: personel.PrsnUsrNm,
            fullName: personel.PrsnAdi || personel.PrsnUsrNm,
            isAdmin: false,
          },
        };
      }

      return {
        success: false,
        message: 'Kullanıcı adı veya şifre hatalı!',
      };
    } catch (error) {
      console.error('Login hatası:', error);
      return {
        success: false,
        message: 'Giriş işlemi sırasında bir hata oluştu',
      };
    }
  }

  async validateUser(username: string, password: string): Promise<boolean> {
    try {
      const normalizedUsername = username.toLowerCase().trim();
      const normalizedPassword = password.toLowerCase().trim();

      // Personel kontrolü
      const personel = await this.personelRepository
        .createQueryBuilder('personel')
        .where('LOWER(personel.PrsnUsrNm) = LOWER(:username)', {
          username: normalizedUsername,
        })
        .andWhere('LOWER(personel.PrsnPassw) = LOWER(:password)', {
          password: normalizedPassword,
        })
        .andWhere('personel.PrsnDurum = :durum', { durum: 'ÇALIŞIYOR' })
        .getOne();

      return !!personel;
    } catch (error) {
      console.error('Kullanıcı doğrulama hatası:', error);
      return false;
    }
  }
}
