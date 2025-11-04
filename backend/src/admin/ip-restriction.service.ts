/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPKisitlama } from '../entities/ip-kisitlama.entity';
import { SistemAyar } from '../entities/sistem-ayar.entity';

export interface IPKisitlamaDto {
  ipAdres: string;
  aciklama?: string;
}

export interface IPKisitlamaResponse {
  IpKstNo: number;
  IpKstAdres: string;
  IpKstAktif: boolean;
  IpKstKytTarihi: string;
  IpKstKllnc: string;
  IpKstAciklama?: string;
}

@Injectable()
export class IpRestrictionService {
  private readonly IP_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  private readonly MAX_IP_COUNT = 5;
  private readonly AYAR_ANAHTAR = 'IP_KISITLAMA_AKTIF';

  constructor(
    @InjectRepository(IPKisitlama)
    private ipKisitlamaRepository: Repository<IPKisitlama>,
    @InjectRepository(SistemAyar)
    private sistemAyarRepository: Repository<SistemAyar>,
  ) {}

  /**
   * IP adresini validate eder
   * Püf Nokta: IPv4 formatını kontrol eder ve her oktetin 0-255 aralığında olmasını sağlar
   */
  private validateIPAddress(ip: string): boolean {
    const match = ip.match(this.IP_REGEX);
    if (!match) return false;

    // Her oktetin 0-255 aralığında olduğunu kontrol et
    for (let i = 1; i <= 4; i++) {
      const octet = parseInt(match[i], 10);
      if (octet < 0 || octet > 255) return false;
    }

    return true;
  }

  /**
   * Tarih string'ini DD.MM.YYYY formatında döndürür
   */
  private getCurrentDate(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}.${month}.${year}`;
  }

  /**
   * Tüm IP kısıtlamalarını getirir
   */
  async getAllIpRestrictions(): Promise<IPKisitlamaResponse[]> {
    const restrictions = await this.ipKisitlamaRepository.find({
      where: { IpKstAktif: true },
      order: { IpKstKytTarihi: 'DESC' },
    });

    return restrictions;
  }

  /**
   * IP kısıtlaması ekleme
   * Püf Nokta: Maksimum 5 IP kontrolü ve duplicate IP kontrolü yapılır
   */
  async addIpRestriction(
    dto: IPKisitlamaDto,
    kullanici: string,
  ): Promise<IPKisitlamaResponse> {
    // IP formatı kontrolü
    if (!this.validateIPAddress(dto.ipAdres)) {
      throw new BadRequestException(
        'Geçersiz IP adresi formatı. Format: xxx.xxx.xxx.xxx',
      );
    }

    // Maksimum IP sayısı kontrolü
    const count = await this.ipKisitlamaRepository.count({
      where: { IpKstAktif: true },
    });

    if (count >= this.MAX_IP_COUNT) {
      throw new BadRequestException(
        `Maksimum ${this.MAX_IP_COUNT} IP adresi tanımlayabilirsiniz`,
      );
    }

    // Duplicate IP kontrolü
    const existing = await this.ipKisitlamaRepository.findOne({
      where: { IpKstAdres: dto.ipAdres, IpKstAktif: true },
    });

    if (existing) {
      throw new BadRequestException('Bu IP adresi zaten kayıtlı');
    }

    // Yeni IP kaydı oluştur
    const newIP = this.ipKisitlamaRepository.create({
      IpKstAdres: dto.ipAdres,
      IpKstAktif: true,
      IpKstKytTarihi: this.getCurrentDate(),
      IpKstKllnc: kullanici,
      IpKstAciklama: dto.aciklama || undefined,
    });

    const saved = await this.ipKisitlamaRepository.save(newIP);
    return saved as IPKisitlamaResponse;
  }

  /**
   * IP kısıtlaması silme (soft delete)
   */
  async deleteIpRestriction(id: number): Promise<void> {
    const ip = await this.ipKisitlamaRepository.findOne({
      where: { IpKstNo: id },
    });

    if (!ip) {
      throw new BadRequestException('IP kaydı bulunamadı');
    }

    // Soft delete - aktif durumunu false yap
    ip.IpKstAktif = false;
    await this.ipKisitlamaRepository.save(ip);
  }

  /**
   * IP kısıtlama sistemini aktif/pasif yapar
   * Püf Nokta: Sistem ayarları tablosunda merkezi bir anahtar ile yönetilir
   */
  async toggleIpRestriction(
    aktif: boolean,
    kullanici: string,
  ): Promise<{ aktif: boolean }> {
    let ayar = await this.sistemAyarRepository.findOne({
      where: { SysAyrAnahtar: this.AYAR_ANAHTAR },
    });

    if (!ayar) {
      // İlk kez ayar oluşturuluyor
      ayar = this.sistemAyarRepository.create({
        SysAyrAnahtar: this.AYAR_ANAHTAR,
        SysAyrDeger: aktif ? '1' : '0',
        SysAyrAciklama: 'IP Kısıtlama Sistemi Aktif/Pasif Durumu',
        SysAyrGncTarihi: this.getCurrentDate(),
        SysAyrKllnc: kullanici,
      });
    } else {
      ayar.SysAyrDeger = aktif ? '1' : '0';
      ayar.SysAyrGncTarihi = this.getCurrentDate();
      ayar.SysAyrKllnc = kullanici;
    }

    await this.sistemAyarRepository.save(ayar);
    return { aktif };
  }

  /**
   * IP kısıtlama sisteminin durumunu getirir
   */
  async getIpRestrictionStatus(): Promise<boolean> {
    const ayar = await this.sistemAyarRepository.findOne({
      where: { SysAyrAnahtar: this.AYAR_ANAHTAR },
    });

    return ayar ? ayar.SysAyrDeger === '1' : false;
  }

  /**
   * Belirli bir IP adresinin izin listesinde olup olmadığını kontrol eder
   * Püf Nokta: Bu metod guard tarafından kullanılacak
   */
  async isIpAllowed(ipAddress: string): Promise<boolean> {
    // IP kısıtlama sistemi aktif mi kontrol et
    const isActive = await this.getIpRestrictionStatus();
    
    // Sistem pasifse tüm IP'lere izin ver
    if (!isActive) {
      return true;
    }

    // IP listesinde var mı kontrol et
    const allowed = await this.ipKisitlamaRepository.findOne({
      where: { IpKstAdres: ipAddress, IpKstAktif: true },
    });

    return !!allowed;
  }

  /**
   * IP kısıtlama sistem bilgilerini getirir (durum + liste)
   */
  async getIpRestrictionInfo(): Promise<{
    aktif: boolean;
    ipListesi: IPKisitlamaResponse[];
    maksimumIP: number;
  }> {
    const aktif = await this.getIpRestrictionStatus();
    const ipListesi = await this.getAllIpRestrictions();

    return {
      aktif,
      ipListesi,
      maksimumIP: this.MAX_IP_COUNT,
    };
  }
}

