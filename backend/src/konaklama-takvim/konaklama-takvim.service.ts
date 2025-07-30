/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Musteri } from '../entities/musteri.entity';
import { DatabaseConfigService } from '../database/database-config.service';

export interface KonaklamaDetay {
  musteriAdi: string;
  odaNo: string;
  yatakNo: string;
}

export interface OdaTipDoluluk {
  odaTipi: string;
  dolulukTarihleri: { 
    tarih: string; 
    dolu: boolean;
    konaklamaDetaylari: KonaklamaDetay[];
    bosYatakSayisi: number;
  }[];
  maxPlanlananTarih: string | null;
}

export interface KonaklamaTakvimData {
  gunler: string[]; // Tarihler array'i
  odaTipleri: OdaTipDoluluk[];
}

@Injectable()
export class KonaklamaTakvimService {
  constructor(
    @InjectRepository(Musteri)
    private musteriRepository: Repository<Musteri>,
    private dbConfig: DatabaseConfigService,
  ) {}

  /**
   * Oda doluluk takvimini getirir
   * @param baslangicTarihi Başlangıç tarihi (opsiyonel, varsayılan bugün)
   * @param gunSayisi Kaç gün gösterilecek (varsayılan 32)
   */
  async getOdaDolulukTakvimi(baslangicTarihi?: string, gunSayisi: number = 32): Promise<KonaklamaTakvimData> {
    try {
      // Başlangıç tarihini belirle (bugün veya verilen tarih)
      const startDate = baslangicTarihi ? new Date(this.parseDate(baslangicTarihi)) : new Date();
      console.log(`📍 Başlangıç tarihi belirlendi: ${this.formatDate(startDate)} (parametre: ${baslangicTarihi || 'bugün'})`);
      
      // Tarih dizisini oluştur
      const gunler = this.createDateArray(startDate, gunSayisi);
      console.log(`🗓️ Takvim oluşturuluyor: ${gunSayisi} gün, ilk tarih: ${this.formatDate(startDate)}`);
      console.log(`📅 İlk tarih: ${gunler[0]}, Son tarih: ${gunler[gunler.length - 1]}, Toplam: ${gunler.length}`);
      
      // Aktif konaklamaları v_MusteriKonaklama view'ından getir
      const aktifKonaklamalar = await this.getAktifKonaklamalar();
      
      // Oda tiplerini gruplandır ve her tip için max tarih bul
      const odaTipGruplari = this.groupByOdaTipi(aktifKonaklamalar);
      
      // Her oda tipi için doluluk durumunu hesapla
      const odaTipleri = await this.calculateOdaDoluluk(odaTipGruplari, gunler);
      
      return {
        gunler,
        odaTipleri
      };
    } catch (error) {
      console.error('getOdaDolulukTakvimi hatası:', error);
      throw new Error('Konaklama takvimi alınamadı');
    }
  }

  /**
   * v_MusteriKonaklama view'ından aktif konaklamaları getirir
   */
  private async getAktifKonaklamalar(): Promise<any[]> {
    try {
      const views = this.dbConfig.getViews();
      const query = `
        SELECT 
          v.KnklmOdaTip,
          v.KnklmPlnTrh,
          v.MstrAdi,
          v.KnklmOdaNo,
          v.KnklmYtkNo,
          v.KnklmGrsTrh
        FROM ${views.musteriKonaklama} v
        WHERE v.MstrDurum = 'KALIYOR' 
          AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
          AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
          AND v.KnklmPlnTrh IS NOT NULL
          AND v.KnklmPlnTrh <> ''
        ORDER BY v.KnklmOdaTip, CONVERT(Date, v.KnklmPlnTrh, 104) DESC
      `;
      
      const result = await this.musteriRepository.query(query);
      console.log('Aktif konaklamalar:', result.length, 'kayıt bulundu');
      
      // Debug için ilk birkaç kaydı logla
      if (result.length > 0) {
        console.log('İlk 3 aktif konaklama kaydı:', result.slice(0, 3));
      }
      
      return result;
    } catch (error) {
      console.error('getAktifKonaklamalar hatası:', error);
      return [];
    }
  }

  /**
   * Belirli oda tipi için toplam yatak sayısını getirir (BOŞ + DOLU)
   */
  private async getToplamYatakSayisi(odaTipi: string): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as toplamYatakSayisi
        FROM tblOdaYatak 
        WHERE odYatOdaTip = @0 AND odYatDurum IN ('BOŞ', 'DOLU')
      `;
      
      const result = await this.musteriRepository.query(query, [odaTipi]);
      return result[0]?.toplamYatakSayisi || 0;
    } catch (error) {
      console.error('getToplamYatakSayisi hatası:', error);
      return 0;
    }
  }

  /**
   * Konaklamaları oda tipine göre gruplandırır
   */
  private groupByOdaTipi(konaklamalar: any[]): { [odaTipi: string]: any[] } {
    const grup: { [odaTipi: string]: any[] } = {};
    
    konaklamalar.forEach(konaklama => {
      const odaTipi = konaklama.KnklmOdaTip || 'Belirtilmemiş';
      if (!grup[odaTipi]) {
        grup[odaTipi] = [];
      }
      grup[odaTipi].push(konaklama);
    });
    
    console.log('Oda tipi grupları:', Object.keys(grup));
    return grup;
  }

  /**
   * Her oda tipi için doluluk durumunu hesaplar
   */
  private async calculateOdaDoluluk(odaTipGruplari: { [odaTipi: string]: any[] }, gunler: string[]): Promise<OdaTipDoluluk[]> {
    const odaTipleri: OdaTipDoluluk[] = [];
    
    for (const odaTipi of Object.keys(odaTipGruplari)) {
      const konaklamalar = odaTipGruplari[odaTipi];
      
      // Bu oda tipindeki en büyük planlanan çıkış tarihini bul
      let maxPlanlananTarih: Date | null = null;
      
      konaklamalar.forEach(konaklama => {
        if (konaklama.KnklmPlnTrh) {
          const planTarih = this.parseDate(konaklama.KnklmPlnTrh);
          const tarihObj = new Date(planTarih);
          
          if (!maxPlanlananTarih || tarihObj > maxPlanlananTarih) {
            maxPlanlananTarih = tarihObj;
          }
        }
      });
      
      // Doluluk durumunu hesapla - her gün için kontrol et
      const dolulukTarihleri = gunler.map(gunTarihi => {
        // DD.MM.YYYY formatını ISO'ya çevir
        const gunDate = new Date(this.parseDate(gunTarihi));
        
        // Bu günde konaklama yapan müşterileri bul
        const konaklamaDetaylari: KonaklamaDetay[] = [];
        
        konaklamalar.forEach(konaklama => {
          if (!konaklama.KnklmGrsTrh || !konaklama.KnklmPlnTrh) return;
          
          try {
            const girisTarih = new Date(this.parseDate(konaklama.KnklmGrsTrh));
            const cikisTarih = new Date(this.parseDate(konaklama.KnklmPlnTrh));
            
            // Tarih parse edilemezse skip et
            if (isNaN(girisTarih.getTime()) || isNaN(cikisTarih.getTime())) {
              console.warn('Tarih parse hatası:', konaklama.KnklmGrsTrh, konaklama.KnklmPlnTrh);
              return;
            }
            
            // Gün, giriş ve çıkış tarihleri arasında mı?
            if (gunDate >= girisTarih && gunDate <= cikisTarih) {
              konaklamaDetaylari.push({
                musteriAdi: konaklama.MstrAdi || 'Bilinmeyen',
                odaNo: konaklama.KnklmOdaNo || '-',
                yatakNo: konaklama.KnklmYtkNo || '-'
              });
              
              // Debug için
              if (gunTarihi === this.formatDateForDisplay(new Date())) {
                console.log('Bugün konaklama bulundu:', {
                  odaTipi,
                  musteriAdi: konaklama.MstrAdi,
                  odaNo: konaklama.KnklmOdaNo,
                  yatakNo: konaklama.KnklmYtkNo,
                  girisTarih: this.formatDate(girisTarih),
                  cikisTarih: this.formatDate(cikisTarih),
                  gunTarihi
                });
              }
            }
          } catch (error) {
            console.error('Tarih karşılaştırma hatası:', error, konaklama);
          }
        });
        
        // Oda no - yatak no'ya göre sırala
        konaklamaDetaylari.sort((a, b) => {
          const odaA = parseInt(a.odaNo) || 0;
          const odaB = parseInt(b.odaNo) || 0;
          
          if (odaA === odaB) {
            const yatakA = parseInt(a.yatakNo) || 0;
            const yatakB = parseInt(b.yatakNo) || 0;
            return yatakA - yatakB;
          }
          
          return odaA - odaB;
        });
        
        return {
          tarih: gunTarihi,
          dolu: konaklamaDetaylari.length > 0,
          konaklamaDetaylari,
          bosYatakSayisi: 0 // Geçici, aşağıda güncellenecek
        };
      });
      
      // Bu oda tipi için toplam yatak sayısını al
      const toplamYatakSayisi = await this.getToplamYatakSayisi(odaTipi);
      
      // Her güne göre boş yatak sayısını hesapla (toplam - o günkü konaklama sayısı)
      dolulukTarihleri.forEach(doluluk => {
        doluluk.bosYatakSayisi = toplamYatakSayisi - doluluk.konaklamaDetaylari.length;
      });
      
      odaTipleri.push({
        odaTipi,
        dolulukTarihleri,
        maxPlanlananTarih: maxPlanlananTarih ? this.formatDate(maxPlanlananTarih) : null
      });
    }
    
    // Oda tiplerini alfabetik sırala
    odaTipleri.sort((a, b) => a.odaTipi.localeCompare(b.odaTipi, 'tr'));
    
    return odaTipleri;
  }

  /**
   * Tarih dizisi oluşturur
   */
  private createDateArray(startDate: Date, gunSayisi: number): string[] {
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    
    console.log(`🏁 Tarih dizisi başlangıç: ${this.formatDate(currentDate)}, hedef gün sayısı: ${gunSayisi}`);
    
    for (let i = 0; i < gunSayisi; i++) {
      const dateToAdd = new Date(currentDate);
      const formattedDate = this.formatDateForDisplay(dateToAdd);
      dates.push(formattedDate);
      
      if (i < 3 || i >= gunSayisi - 3) {
        console.log(`📅 Gün ${i + 1}: ${formattedDate}`);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`✅ Tarih dizisi tamamlandı: ${dates.length} gün oluşturuldu`);
    return dates;
  }

  /**
   * DD.MM.YYYY formatındaki tarihi ISO formatına çevirir
   */
  private parseDate(dateStr: string): string {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      // DD.MM.YYYY -> YYYY-MM-DD
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateStr;
  }

  /**
   * Date objesini DD.MM.YYYY formatına çevirir
   */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  /**
   * Date objesini display için formatlar (DD.MM.YYYY)
   */
  private formatDateForDisplay(date: Date): string {
    return this.formatDate(date);
  }
}