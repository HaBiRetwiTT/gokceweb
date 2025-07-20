/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Post, Get, Body, HttpStatus, HttpException, Param, Res, Query, Req } from '@nestjs/common';
import { Response } from 'express';
import { MusteriService } from './musteri.service';
import { CreateMusteriDto } from '../dto/create-musteri.dto';
import { CikisYapDto } from '../dto/cikis-yap.dto';
import { DatabaseTransactionService } from '../database/database-transaction.service';
import * as PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import jsPDF from 'jspdf';
//import { MusteriBilgi } from '../dto/musteri-bilgi.dto';

@Controller()
export class MusteriController {
  constructor(
    private readonly musteriService: MusteriService,
    private readonly transactionService: DatabaseTransactionService
  ) {}

  // Tarih formatı helper fonksiyonu
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  // Font dosyası kontrol fonksiyonu
  private getFontPath(): string {
    const possiblePaths = [
      './fonts/DejaVuSans.ttf',
      './backend/fonts/DejaVuSans.ttf',
      path.join(__dirname, '../fonts/DejaVuSans.ttf'),
      path.join(__dirname, '../../fonts/DejaVuSans.ttf'),
      path.join(process.cwd(), 'fonts/DejaVuSans.ttf'),
      path.join(process.cwd(), 'backend/fonts/DejaVuSans.ttf')
    ];

    for (const fontPath of possiblePaths) {
      console.log(`Checking font path: ${fontPath}`);
      if (fs.existsSync(fontPath)) {
        console.log(`Font found at: ${fontPath}`);
        return fontPath;
      }
    }

    console.error('Font file not found in any of the expected paths');
    throw new Error('Font dosyası bulunamadı');
  }

  @Post()
  async create(@Body() createMusteriDto: CreateMusteriDto) {
    try {
      return await this.musteriService.create(createMusteriDto);
    } catch (error) {
      // Güvenli şekilde string mesaj döndür
      if (error instanceof Error) {
        return error.message;
      }
      return String(error);
    }
  }

  @Post('musteri-ekle')
  async createMusteriEkle(@Body() createMusteriDto: CreateMusteriDto) {
    try {
      return await this.musteriService.create(createMusteriDto);
    } catch (error) {
      // Güvenli şekilde string mesaj döndür
      if (error instanceof Error) {
        return error.message;
      }
      return String(error);
    }
  }

  @Post('musteri-islem')
  async createMusteriIslem(@Body() musteriData: any, @Req() req) {
    try {
      console.log('=== musteri-islem endpoint called (Transaction-Safe) ===');
      console.log('musteriData.MstrTCN:', musteriData.MstrTCN);
      console.log('musteriData.OdaYatak:', musteriData.OdaYatak);
    
      const kullaniciAdi = req.user?.username || musteriData.kullaniciAdi;
      if (!kullaniciAdi) {
        throw new Error('Kullanıcı adı bulunamadı!');
      }
      // 🔒 TRANSACTION İÇİNDE TÜM İŞLEMLERİ GÜVENLİ ÇALIŞTIR
      const result = await this.transactionService.executeInTransaction(async (queryRunner) => {
        // 1. Önce oda-yatak müsaitlik kontrolü yap (race condition önlemi)
        const musaitlikKontrol = await this.musteriService.checkOdaYatakMusaitlik(
          musteriData.OdaYatak as string | { label?: string; value?: string }
        );
        if (!musaitlikKontrol.musait) {
          throw new Error(musaitlikKontrol.message);
        }
        
        // 2. TC kimlik kontrolü yap
        const tcExists = await this.musteriService.checkTCExists(String(musteriData.MstrTCN));
        let musteriNo: number;
        let message: string;
        let musteriDurumu: string;
        
        if (tcExists) {
          // Mevcut müşteri - sadece müşteri numarasını al
          console.log('Mevcut müşteri tespit edildi');
          const musteriData_existing = await this.musteriService.getMusteriBilgiByTCN(String(musteriData.MstrTCN));
          if (!musteriData_existing) {
            throw new Error('Müşteri kaydı bulunamadı');
          }
          musteriNo = musteriData_existing.MstrNo;
          message = 'Mevcut müşteri için konaklama kaydı başarıyla eklendi!';
          
          // Mevcut müşteri durumuna göre belirle
          const durumKontrol = await this.musteriService.checkMusteriDurum(String(musteriData.MstrTCN));
          musteriDurumu = durumKontrol.durum === 'AYRILDI' ? 'AYRILAN_MUSTERI' : 'MEVCUT_MUSTERI';
          
          // AYRILDI durumundaki müşteriyi tekrar KALIYOR yap (Transaction içinde)
          if (durumKontrol.durum === 'AYRILDI') {
            console.log('AYRILDI durumundaki müşteri KALIYOR durumuna güncelleniyor...');
            await this.transactionService.executeQuery(
              queryRunner,
              `UPDATE dbo.tblMusteri SET MstrDurum = 'KALIYOR' WHERE MstrTCN = @0`,
              [String(musteriData.MstrTCN)]
            );
            console.log('Müşteri durumu AYRILDI -> KALIYOR güncellendi (Transaction-Safe)');
          }
          
          console.log('Mevcut müşteri numarası:', musteriNo, 'Durum:', musteriDurumu);
        } else {
          // Yeni müşteri - müşteri ve cari kaydı yap (Transaction içinde)
          console.log('Yeni müşteri tespit edildi');
          const createResult = await this.musteriService.createMusteriIslemWithTransaction(
            queryRunner, 
            musteriData as CreateMusteriDto
          );
          musteriNo = createResult.musteriNo;
          message = 'Yeni müşteri ve konaklama kaydı başarıyla eklendi!';
          musteriDurumu = 'YENI';
          
          console.log('Yeni müşteri numarası:', musteriNo);
        }
        
        // Her durumda konaklama kaydı yap (Transaction içinde)
        console.log('Konaklama kaydı yapılıyor (Transaction-Safe)...');
        await this.musteriService.kaydetKonaklamaWithTransaction(queryRunner, { 
          ...musteriData, 
          MstrKllnc: kullaniciAdi,
          planlananCikisTarihi: musteriData.planlananCikisTarihi // Frontend'den gelen planlanan çıkış tarihi
        }, musteriNo);
        
        // İşlem kaydı yap (Transaction içinde)
        console.log('İşlem kaydı yapılıyor (Transaction-Safe)...');
        const islemDataWithExtras = {
          ...musteriData,
          musteriDurumu: musteriDurumu,
          OdemeVadesi: musteriData.OdemeVadesi || null, // 🔥 Ödeme vadesi bilgisi eklendi
          planlananCikisTarihi: musteriData.planlananCikisTarihi, // Frontend'den gelen planlanan çıkış tarihi
          depozito: musteriData.depozito || null
        };
        
        await this.musteriService.kaydetIslemWithTransaction(queryRunner, islemDataWithExtras, musteriNo);
        
        return {
          success: true,
          message: message,
          data: { musteriNo: musteriNo }
        };
      });
      
      return result;
      
    } catch (error) {
      console.error('Müşteri işlem hatası:', error);
      
      // HttpException ise direkt fırlat (oda-yatak dolu mesajları vs.)
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Güvenli şekilde string mesaj döndür
      if (error instanceof Error) {
        return {
          success: false,
          message: `Müşteri işlem başarısız (Transaction güvenliği ile): ${error.message}`
        };
      }
      return {
        success: false,
        message: `Müşteri işlem başarısız (Transaction güvenliği ile): ${String(error)}`
      };
    }
  }

  @Get('firma-listesi')
  async getFirmaList() {
    try {
      const firmaList = await this.musteriService.getFirmaList();
      return {
        success: true,
        data: firmaList
      };
    } catch {
      throw new HttpException({
        success: false,
        message: 'Firma listesi alınamadı'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('firma-detay/:firmaName')
  async getFirmaDetails(@Param('firmaName') firmaName: string) {
    try {
      const firmaDetails = await this.musteriService.getFirmaDetails(firmaName);
      return {
        success: true,
        data: firmaDetails
      };
    } catch {
      throw new HttpException({
        success: false,
        message: 'Firma detayları alınamadı'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('firma-guncelle')
  async updateFirmaInfo(@Body() updateData: { firmaName: string; MstrVD?: string; MstrVno?: string; MstrFrmTel?: string; MstrFrmMdr?: string; MstrMdrTel?: string }) {
    try {
      await this.musteriService.updateFirmaInfo(updateData.firmaName, updateData);
      return {
        success: true,
        message: 'Firma bilgileri güncellendi'
      };
    } catch (error) {
      // Güvenli şekilde string mesaj döndür
      if (error instanceof Error) {
        return error.message;
      }
      return String(error);
    }
  }

  @Get('oda-tipleri')
  async getOdaTipleri() {
    try {
      const odaTipleri = await this.musteriService.getOdaTipleri();
      return {
        success: true,
        data: odaTipleri
      };
    } catch {
      throw new HttpException({
        success: false,
        message: 'Oda tipleri alınamadı'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Sadece boş odaların bulunduğu oda tiplerini getir
  @Get('bos-oda-tipleri')
  async getBosOdaTipleri() {
    try {
      const bosOdaTipleri = await this.musteriService.getBosOdaTipleri();
      return {
        success: true,
        data: bosOdaTipleri
      };
    } catch {
      throw new HttpException({
        success: false,
        message: 'Boş oda tipleri alınamadı'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('bos-odalar/:odaTipi')
  async getBosOdalar(@Param('odaTipi') odaTipi: string) {
    try {
      const bosOdalar = await this.musteriService.getBosOdalar(odaTipi)
      return {
        success: true,
        data: bosOdalar
      }
    } catch (error) {
      // Güvenli şekilde string mesaj döndür
      if (error instanceof Error) {
        return error.message;
      }
      return String(error);
    }
  }

  @Get('oda-tip-fiyatlari/:odaTipi')
  async getOdaTipFiyatlari(@Param('odaTipi') odaTipi: string) {
    try {
      const fiyatlar = await this.musteriService.getOdaTipFiyatlari(odaTipi)
      return {
        success: true,
        data: fiyatlar
      }
    } catch (error) {
      // Güvenli şekilde string mesaj döndür
      if (error instanceof Error) {
        return error.message;
      }
      return String(error);
    }
  }

  @Get('musteri-kontrol/:tcn')
  async checkMusteriExists(@Param('tcn') tcn: string) {
    try {
      const exists = await this.musteriService.checkTCExists(tcn);
      return {
        success: true,
        exists: exists
      };
    } catch (error) {
      // Güvenli şekilde string mesaj döndür
      if (error instanceof Error) {
        return error.message;
      }
      return String(error);
    }
  }

  @Get('musteri-durum-kontrol/:tcn')
  async checkMusteriDurum(@Param('tcn') tcn: string) {
    try {
      const result = await this.musteriService.checkMusteriDurum(tcn);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      // Güvenli şekilde string mesaj döndür
      if (error instanceof Error) {
        return error.message;
      }
      return String(error);
    }
  }

  @Get('musteri-bilgi/:tcn')
  async getMusteriBilgi(@Param('tcn') tcn: string) {
    try {
      const musteriData = await this.musteriService.getMusteriBilgiByTCN(tcn);
      return {
        success: true,
        data: musteriData
      };
    } catch (error) {
      console.error('Müşteri bilgileri alınırken hata:', error);
      // Güvenli şekilde string mesaj döndür
      if (error instanceof Error) {
        return {
          success: false,
          data: null,
          message: error.message
        };
      }
      return {
        success: false,
        data: null,
        message: String(error)
      };
    }
  }

  @Get('musteri-bilgi-by-no/:mstrNo')
  async getMusteriBilgiByNo(@Param('mstrNo') mstrNo: string) {
    try {
      const musteriData = await this.musteriService.getMusteriBilgiByNo(parseInt(mstrNo));
      return {
        success: true,
        data: musteriData
      };
    } catch (error) {
      console.error('Müşteri bilgileri (MstrNo) alınırken hata:', error);
      // Güvenli şekilde string mesaj döndür
      if (error instanceof Error) {
        return {
          success: false,
          message: 'Müşteri bilgileri alınamadı',
          error: error.message
        };
      }
      return {
        success: false,
        message: 'Müşteri bilgileri alınamadı',
        error: String(error)
      };
    }
  }

  @Get('musteri-odeme-vadesi/:tcn')
  async getMusteriOdemeVadesi(@Param('tcn') tcn: string) {
    try {
      const odemeVadesi = await this.musteriService.getMusteriOdemeVadesi(tcn);
      return {
        success: true,
        data: { odemeVadesi }
      };
    } catch (error) {
      console.error('Müşteri ödeme vadesi alınırken hata:', error);
      // Güvenli şekilde string mesaj döndür
      if (error instanceof Error) {
        return {
          success: false,
          message: 'Müşteri ödeme vadesi alınamadı',
          error: error.message
        };
      }
      return {
        success: false,
        message: 'Müşteri ödeme vadesi alınamadı',
        error: String(error)
      };
    }
  }

  @Get('mevcut-konaklama/:tcn')
  async getMevcutKonaklama(@Param('tcn') tcn: string) {
    try {
      const konaklamaData = await this.musteriService.getMevcutKonaklamaBilgisi(tcn);
      return {
        success: true,
        data: konaklamaData
      };
    } catch (error) {
      console.error('Mevcut konaklama bilgileri alınırken hata:', error);
      // Güvenli şekilde string mesaj döndür
      if (error instanceof Error) {
        return {
          success: false,
          message: 'Mevcut konaklama bilgileri alınamadı',
          error: error.message
        };
      }
      return {
        success: false,
        message: 'Mevcut konaklama bilgileri alınamadı',
        error: String(error)
      };
    }
  }

  @Post('musteri-guncelle/:tcn')
  async updateMusteri(@Param('tcn') tcn: string, @Body() updateData: any, @Req() req) {
    try {
      const kullaniciAdi = req.user?.username || updateData.kullaniciAdi;
      const result = await this.musteriService.updateMusteriBilgileri(tcn, updateData, kullaniciAdi);
      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      console.error('Müşteri güncelleme hatası:', error);
      // Güvenli şekilde string mesaj döndür
      if (error instanceof Error) {
        return {
          success: false,
          message: error.message
        };
      }
      return {
        success: false,
        message: String(error)
      };
    }
  }

  @Post('oda-yatak-kontrol')
  async checkOdaYatakMusaitlik(@Body() body: { odaYatak: string }) {
    try {
      const result = await this.musteriService.checkOdaYatakMusaitlik(body.odaYatak);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      // Güvenli şekilde string mesaj döndür
      if (error instanceof Error) {
        return error.message;
      }
      return String(error);
    }
  }

  @Post('donem-yenileme')
  async donemYenileme(@Body() donemData: any, @Req() req) {
    try {
      console.log('=== donem-yenileme endpoint called (Transaction-Safe) ===');
      console.log('donemData.MstrTCN:', donemData.MstrTCN);
      console.log('donemData.eskiKnklmPlnTrh:', donemData.eskiKnklmPlnTrh);
      console.log('donemData.OdaYatak:', donemData.OdaYatak);
      console.log('donemData.KonaklamaSuresi:', donemData.KonaklamaSuresi);
      
      const kullaniciAdi = req.user?.username || donemData.kullaniciAdi;
      if (!kullaniciAdi) {
        throw new Error('Kullanıcı adı bulunamadı!');
      }
      // 🔒 TRANSACTION İÇİNDE TÜM İŞLEMLERİ GÜVENLİ ÇALIŞTIR
      const result = await this.transactionService.executeInTransaction(async (queryRunner) => {
        // 1. Mevcut konaklama kaydının KnklmCksTrh'ni KnklmPlnTrh ile güncelle
        console.log('Mevcut konaklama kaydı sonlandırılıyor (Transaction-Safe)...');
        await this.musteriService.sonlandirKonaklamaWithTransaction(
          queryRunner, 
          String(donemData.MstrTCN), 
          String(donemData.eskiKnklmPlnTrh)
        );
        
        // 2. Müşteri numarasını al
        const musteriData_existing = await this.musteriService.getMusteriBilgiByTCN(String(donemData.MstrTCN));
        const musteriNo = musteriData_existing.MstrNo;
        
        // 3. Yeni dönem konaklama kaydı yap (Transaction içinde)
        console.log('Yeni dönem konaklama kaydı yapılıyor (Transaction-Safe)...');
        const yeniKonaklamaData = {
          ...donemData,
          KnklmOdaTip: donemData.KnklmOdaTip,
          eskiKnklmPlnTrh: donemData.eskiKnklmPlnTrh,
          KonaklamaSuresi: donemData.KonaklamaSuresi,
          KonaklamaTipi: donemData.KonaklamaTipi,
          HesaplananBedel: donemData.HesaplananBedel,
          ToplamBedel: donemData.ToplamBedel,
          MstrKllnc: kullaniciAdi,
        };
        await this.musteriService.kaydetDonemYenilemeKonaklamaWithTransaction(
          queryRunner,
          yeniKonaklamaData,
          musteriNo
        );
        
        // 🔥 Eğer eski oda-yatak bilgisi varsa, eski oda-yatak kaydını BOŞ yap
        if (donemData.eskiOdaYatak) {
          await this.musteriService.bosaltOdaYatakWithTransaction(queryRunner, donemData.eskiOdaYatak, kullaniciAdi);
        }
        
        // 4. Yeni dönem işlem kaydı yap (Transaction içinde)
        console.log('Yeni dönem işlem kaydı yapılıyor (Transaction-Safe)...');
        const yeniIslemData = {
          ...donemData,
          eskiKnklmPlnTrh: donemData.eskiKnklmPlnTrh,
          MstrKllnc: kullaniciAdi,
        };
        await this.musteriService.kaydetDonemYenilemeIslemWithTransaction(
          queryRunner, 
          yeniIslemData as {
            OdaYatak: string | { label?: string; value?: string };
            KonaklamaSuresi: number;
            KonaklamaTipi: string;
            MstrHspTip: string;
            MstrKllnc: string;
            MstrAdi: string;
            ToplamBedel: number;
            eskiKnklmPlnTrh: string;
          }, 
          musteriNo
        );
        
        return {
          success: true,
          message: 'Dönem yenileme başarıyla tamamlandı!',
          data: { musteriNo: musteriNo }
        };
      });
      
      return result;
      
    } catch (error) {
      console.error('Dönem yenileme hatası:', error);
      
      // HttpException ise direkt fırlat (oda-yatak dolu mesajları vs.)
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Güvenli şekilde string mesaj döndür
      if (error instanceof Error) {
        return {
          success: false,
          message: 'Dönem yenileme sırasında hata oluştu (Transaction güvenliği ile)',
          error: error.message
        };
      }
      return {
        success: false,
        message: 'Dönem yenileme sırasında hata oluştu (Transaction güvenliği ile)',
        error: String(error)
      };
    }
  }

  @Post('cikis-yap')
  async cikisYap(@Body() cikisYapDto: CikisYapDto, @Req() req) {
    try {
      // Kullanıcı adını req'den al
      const kullaniciAdi = req.user?.username || cikisYapDto.kullaniciAdi || 'admin';
      
      // 🔒 TRANSACTION İÇİNDE TÜM İŞLEMLERİ GÜVENLİ ÇALIŞTIR
      await this.transactionService.executeInTransaction(async (queryRunner) => {
        await this.musteriService.musteriCikisYapWithTransaction(queryRunner, cikisYapDto, kullaniciAdi);
      });
      
      return { success: true, message: 'Müşteri çıkış işlemi başarıyla tamamlandı (Transaction güvenliği ile).' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
      console.error('Çıkış yapma hatası (controller):', errorMessage);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: `Çıkış işlemi başarısız (Transaction güvenliği ile): ${errorMessage}`,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('erken-cikis-yap')
  async erkenCikisYap(@Body() body: any, @Req() req) {
    try {
      console.log('=== /erken-cikis-yap endpoint çağrıldı ===');
      console.log('Gelen veri:', body);
      // Kullanıcı adı merkezi olarak alınır (JWT varsa req.user.username, yoksa body.kullaniciAdi)
      const kullaniciAdi = req.user?.username || body.kullaniciAdi;
      if (!kullaniciAdi) {
        throw new Error('Kullanıcı adı bulunamadı!');
      }
      // Tüm erken çıkış işlemleri ve MstrDurum güncellemesi service fonksiyonunda yapılacak
      await this.musteriService.erkenCikisYap({ ...body, kullaniciAdi });
      return { success: true, message: 'Erken çıkış işlemi başarıyla tamamlandı.' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
      return {
        success: false,
        message: `Erken çıkış işlemi başarısız: ${errorMessage}`
      };
    }
  }

  @Post('direkt-oda-degisikligi')
  async direktOdaDegisikligi(@Body() odaDegisikligiData: any, @Req() req) {
    try {
      console.log('=== direktOdaDegisikligi başlatıldı ===');
      console.log('Gelen veri:', odaDegisikligiData);
      const kullaniciAdi = req.user?.username || odaDegisikligiData.kullaniciAdi;
      if (!kullaniciAdi) {
        throw new Error('Kullanıcı adı bulunamadı!');
      }
      // Transaction içinde tüm işlemleri güvenli çalıştır
      const result = await this.transactionService.executeInTransaction(async (queryRunner) => {
        // 1. Müşteri bilgilerini al
        const musteriData = await this.musteriService.getMusteriBilgiByTCN(String(odaDegisikligiData.tcNo));
        if (!musteriData) {
          throw new Error('Müşteri bulunamadı');
        }
        const musteriNo = musteriData.MstrNo;

        // 2. tblKonaklama güncelle (transaction içinde)
        await this.musteriService.updateKonaklamaOdaDegisikligiWithTransaction(
          queryRunner,
          String(odaDegisikligiData.tcNo),
          String(odaDegisikligiData.yeniOdaTip),
          String(odaDegisikligiData.yeniOdaNo),
          String(odaDegisikligiData.yeniYatakNo),
          String(odaDegisikligiData.konaklamaNot || ''),
          Number(odaDegisikligiData.hesaplananBedel),
          kullaniciAdi
        );

        // 3. tblOdaYatak durumları güncelle (transaction içinde)
        await this.musteriService.updateOdaYatakDurumlariWithTransaction(
          queryRunner,
          String(odaDegisikligiData.eskiOdaNo),
          String(odaDegisikligiData.eskiYatakNo),
          String(odaDegisikligiData.yeniOdaNo),
          String(odaDegisikligiData.yeniYatakNo)
        );

        // 4. Eğer ücret farkı varsa tblislem kaydı ekle (transaction içinde)
        if (Number(odaDegisikligiData.hesaplananBedel) !== 0) {
          const islemTip = Number(odaDegisikligiData.hesaplananBedel) > 0 ? 'GELİR' : 'GİDER';
          const islemTutar = Math.abs(Number(odaDegisikligiData.hesaplananBedel));

          await this.musteriService.kaydetOdaDegisikligiIslemWithTransaction(
            queryRunner,
            {
              musteriNo,
              islemTip,
              islemTutar,
              islemBilgi: odaDegisikligiData.konaklamaNot,
              yeniOdaYatak: { value: String(odaDegisikligiData.yeniOdaYatak), label: String(odaDegisikligiData.yeniOdaYatak) },
              MstrAdi: musteriData.MstrAdi,
              MstrKllnc: kullaniciAdi,
              konaklamaTipi: odaDegisikligiData.konaklamaTipi || 'GÜNLÜK'
            }
          );
        }

        return { success: true, message: 'Oda değişikliği başarıyla tamamlandı' };
      });

      return result;

    } catch (error) {
      console.error('direktOdaDegisikligi hatası:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      return { 
        success: false, 
        message: `Oda değişikliği işlemi başarısız: ${errorMessage}` 
      };
    }
  }

  @Post('direkt-oda-degisikligi-konaklama-suresi-1')
  async direktOdaDegisikligiKonaklamaSuresi1(@Body() odaDegisikligiData: any, @Req() req) {
    try {
      console.log('=== direktOdaDegisikligiKonaklamaSuresi1 başlatıldı ===');
      console.log('Gelen veri:', odaDegisikligiData);
      console.log('Toplam Bedel:', odaDegisikligiData.toplamBedel);
      console.log('Konaklama Not:', odaDegisikligiData.konaklamaNot);
      console.log('Hesaplanan Bedel:', odaDegisikligiData.hesaplananBedel);
      const kullaniciAdi = req.user?.username || odaDegisikligiData.kullaniciAdi;
      if (!kullaniciAdi) {
        throw new Error('Kullanıcı adı bulunamadı!');
      }
      // Transaction içinde tüm işlemleri güvenli çalıştır
      const result = await this.transactionService.executeInTransaction(async (queryRunner) => {
        // 1. Müşteri bilgilerini al
        const musteriData = await this.musteriService.getMusteriBilgiByTCN(String(odaDegisikligiData.tcNo));
        if (!musteriData) {
          throw new Error('Müşteri bulunamadı');
        }
        const musteriNo = musteriData.MstrNo;

        // 2. tblKonaklama güncelle (transaction içinde) - knklmNot'tan "Dönem Yenileme: " kısmını çıkar
        console.log('Orijinal konaklamaNot:', odaDegisikligiData.konaklamaNot);
        console.log('Orijinal konaklamaNot tipi:', typeof odaDegisikligiData.konaklamaNot);
        
        const konaklamaNot = typeof odaDegisikligiData.konaklamaNot === 'string'
          ? (odaDegisikligiData.konaklamaNot as string).replace('Dönem Yenileme: ', '')
          : '';
        
        console.log('İşlenmiş konaklamaNot:', konaklamaNot);
        
        await this.musteriService.updateKonaklamaOdaDegisikligiWithTransaction(
          queryRunner,
          String(odaDegisikligiData.tcNo),
          String(odaDegisikligiData.yeniOdaTip),
          String(odaDegisikligiData.yeniOdaNo),
          String(odaDegisikligiData.yeniYatakNo),
          String(konaklamaNot),
          Number(odaDegisikligiData.toplamBedel),
          kullaniciAdi
        );

        // 3. tblOdaYatak durumları güncelle (transaction içinde)
        await this.musteriService.updateOdaYatakDurumlariWithTransaction(
          queryRunner,
          String(odaDegisikligiData.eskiOdaNo),
          String(odaDegisikligiData.eskiYatakNo),
          String(odaDegisikligiData.yeniOdaNo),
          String(odaDegisikligiData.yeniYatakNo)
        );

        // 4. Eğer ücret farkı varsa tblislem kaydı ekle (transaction içinde)
        if (Number(odaDegisikligiData.hesaplananBedel) !== 0) {
          const islemTip = Number(odaDegisikligiData.hesaplananBedel) > 0 ? 'GELİR' : 'GİDER';
          const islemTutar = Math.abs(Number(odaDegisikligiData.hesaplananBedel));

          await this.musteriService.kaydetOdaDegisikligiIslemWithTransaction(
            queryRunner,
            {
              musteriNo,
              islemTip,
              islemTutar,
              islemBilgi: String(odaDegisikligiData.ekNotlar || konaklamaNot),
              yeniOdaYatak: { value: String(odaDegisikligiData.yeniOdaYatak), label: String(odaDegisikligiData.yeniOdaYatak) },
              MstrAdi: String(musteriData.MstrAdi),
              MstrKllnc: kullaniciAdi,
              konaklamaTipi: odaDegisikligiData.konaklamaTipi || 'GÜNLÜK'
            }
          );
        }

        return { success: true, message: 'Oda değişikliği (1 gün) başarıyla tamamlandı' };
      });

      return result;

    } catch (error) {
      console.error('direktOdaDegisikligiKonaklamaSuresi1 hatası:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      return { 
        success: false, 
        message: `Oda değişikliği işlemi başarısız: ${errorMessage}` 
      };
    }
  }

  @Post('oda-degisikligi-onayla')
  async odaDegisikligiOnayla(@Body() odaDegisikligiData: any, @Req() req) {
    try {
      console.log('=== oda-degisikligi-onayla endpoint başlatıldı ===');
      console.log('Gelen veri:', odaDegisikligiData);
      const kullaniciAdi = req.user?.username || odaDegisikligiData.kullaniciAdi;
      if (!kullaniciAdi) {
        throw new Error('Kullanıcı adı bulunamadı!');
      }
      // 🔒 TRANSACTION İÇİNDE TÜM İŞLEMLERİ GÜVENLİ ÇALIŞTIR
      const result = await this.transactionService.executeInTransaction(async (queryRunner) => {
        // 1. Müşteri bilgilerini al
        const musteriData = await this.musteriService.getMusteriBilgiByTCN(String(odaDegisikligiData.tcNo));
        if (!musteriData) {
          throw new Error('Müşteri bulunamadı');
        }
        const musteriNo = musteriData.MstrNo;

        // 2. Mevcut konaklama kaydını güncelle (çıkış tarihi ve kullanıcı adı)
        await this.musteriService.sonlandirMevcutKonaklamaWithTransaction(
          queryRunner,
          String(odaDegisikligiData.tcNo),
          kullaniciAdi // Kullanıcı adı
        );

        // 3. Yeni konaklama kaydı oluştur
        const yeniKonaklamaData = {
          OdaYatak: odaDegisikligiData.yeniOdaYatak,
          KonaklamaSuresi: Number(odaDegisikligiData.konaklamaSuresi),
          KonaklamaTipi: String(odaDegisikligiData.konaklamaTipi),
          HesaplananBedel: Number(odaDegisikligiData.hesaplananBedel),
          ToplamBedel: Number(odaDegisikligiData.toplamBedel),
          MstrKllnc: kullaniciAdi,
          KnklmOdaTip: String(odaDegisikligiData.yeniOdaTip),
          KnklmNot: String(odaDegisikligiData.ekNotlar || ''),
          eskiKnklmPlnTrh: String(odaDegisikligiData.eskiPlnTrh) // Giriş tarihi olarak kullanılacak
        };

        await this.musteriService.kaydetYeniOdaKonaklamaWithTransaction(
          queryRunner,
          yeniKonaklamaData,
          Number(musteriNo)
        );

        // 4. Oda-yatak durumlarını güncelle (eski BOŞ, yeni DOLU)
        await this.musteriService.updateOdaYatakDurumlariWithTransaction(
          queryRunner,
          String(odaDegisikligiData.eskiOdaNo),
          String(odaDegisikligiData.eskiYatakNo),
          String(odaDegisikligiData.yeniOdaNo),
          String(odaDegisikligiData.yeniYatakNo)
        );

        // 5. İşlem kayıtları ekle (GİDER ve/veya GELİR)
        if (Number(odaDegisikligiData.giderBedel) > 0) {
          await this.musteriService.kaydetOdaDegisikligiIslemWithTransaction(
            queryRunner,
            {
              musteriNo: Number(musteriNo),
              islemTip: 'GİDER',
              islemTutar: Number(odaDegisikligiData.giderBedel),
              islemBilgi: `Oda Değişikliği - Eski Oda: ${odaDegisikligiData.eskiOdaNo}-${odaDegisikligiData.eskiYatakNo}`,
              yeniOdaYatak: { value: `${odaDegisikligiData.eskiOdaNo}-${odaDegisikligiData.eskiYatakNo}`, label: `${odaDegisikligiData.eskiOdaNo}-${odaDegisikligiData.eskiYatakNo}` },
              MstrAdi: String(musteriData.MstrAdi),
              MstrKllnc: kullaniciAdi,
              konaklamaTipi: odaDegisikligiData.konaklamaTipi || 'GÜNLÜK',
              OdemeVadesi: odaDegisikligiData.OdemeVadesi || musteriData.OdemeVadesi || null
            }
          );
        }

        if (Number(odaDegisikligiData.gelirBedel) > 0) {
          await this.musteriService.kaydetOdaDegisikligiIslemWithTransaction(
            queryRunner,
            {
              musteriNo: Number(musteriNo),
              islemTip: 'GELİR',
              islemTutar: Number(odaDegisikligiData.gelirBedel),
              islemBilgi: `Oda Değişikliği - Yeni Oda: ${odaDegisikligiData.yeniOdaNo}-${odaDegisikligiData.yeniYatakNo}`,
              yeniOdaYatak: { value: `${odaDegisikligiData.yeniOdaNo}-${odaDegisikligiData.yeniYatakNo}`, label: `${odaDegisikligiData.yeniOdaNo}-${odaDegisikligiData.yeniYatakNo}` },
              MstrAdi: String(musteriData.MstrAdi),
              MstrKllnc: kullaniciAdi,
              konaklamaTipi: odaDegisikligiData.konaklamaTipi || 'GÜNLÜK',
              OdemeVadesi: odaDegisikligiData.OdemeVadesi || musteriData.OdemeVadesi || null
            }
          );
        }

        return { 
          success: true, 
          message: 'Oda değişikliği başarıyla tamamlandı! Tüm işlemler güvenli bir şekilde kaydedildi.' 
        };
      });

      return result;

    } catch (error) {
      console.error('oda-degisikligi-onayla hatası:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: `Oda değişikliği onaylama işlemi başarısız (Transaction güvenliği ile): ${errorMessage}`,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @Get('test-endpoint')
  getTest() {
    return { message: 'Test endpoint çalışıyor!' };
  }

  // Konaklama Geçmişi PDF Raporu
  @Get('konaklama-gecmisi-pdf')
  async getKonaklamaGecmisiPDF(
    @Query('tcNo') tcNo: string,
    @Query('firmaAdi') firmaAdi: string,
    @Res() res: Response
  ) {
    try {
      let konaklamaGecmisi: any[] = [];
      let raporBaslik = '';

      if (firmaAdi) {
        // Firma konaklama geçmişi
        konaklamaGecmisi = await this.musteriService.getFirmaKonaklamaGecmisi(firmaAdi);
        raporBaslik = `${firmaAdi} - Firma Konaklama Geçmişi`;
      } else if (tcNo) {
        // Müşteri konaklama geçmişi
        const musteriBilgi = await this.musteriService.getMusteriBilgiByTCN(tcNo);
        konaklamaGecmisi = await this.musteriService.getKonaklamaGecmisi(tcNo);
        raporBaslik = `${musteriBilgi?.MstrAdi || tcNo} - Konaklama Geçmişi`;
      } else {
        throw new Error('TC No veya Firma Adı gerekli');
      }

      // Geçici olarak HTML tablosu döndür
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${raporBaslik}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>GÖKÇE PANSİYON</h1>
            <h2>${raporBaslik}</h2>
            <p>Rapor Tarihi: ${this.formatDate(new Date())}</p>
            <p>Kayıt Sayısı: ${konaklamaGecmisi.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Kayıt Tarihi</th>
                <th>Oda-Yatak</th>
                <th>Konaklama Tipi</th>
                <th>Tutar</th>
                <th>Giriş Tarihi</th>
                <th>Planlanan Çıkış</th>
                <th>Çıkış Tarihi</th>
                <th>Not</th>
              </tr>
            </thead>
            <tbody>
              ${konaklamaGecmisi.map(row => `
                <tr>
                  <td>${row.kKytTarihi ? this.formatDate(new Date(row.kKytTarihi)) : 'N/A'}</td>
                  <td>${row.KnklmOdaNo}-${row.KnklmYtkNo}</td>
                  <td>${row.KnklmTip || 'N/A'}</td>
                  <td>${row.KnklmNfyt?.toLocaleString('tr-TR') || 0} TL</td>
                  <td>${row.KnklmGrsTrh ? this.formatDate(new Date(row.KnklmGrsTrh)) : 'N/A'}</td>
                  <td>${row.KnklmPlnTrh ? this.formatDate(new Date(row.KnklmPlnTrh)) : 'N/A'}</td>
                  <td>${row.KnklmCksTrh ? this.formatDate(new Date(row.KnklmCksTrh)) : 'N/A'}</td>
                  <td>${row.KnklmNot || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      // Response headers
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="konaklama-gecmisi-${Date.now()}.html"`);
      
      // HTML'i gönder
      res.send(htmlContent);
    } catch (error) {
      console.error('PDF rapor hatası:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      res.status(500).json({ 
        success: false, 
        message: `PDF raporu oluşturulamadı: ${error.message}` 
      });
    }
  }

  // Konaklama Geçmişi Excel Raporu
  @Get('konaklama-gecmisi-excel')
  async getKonaklamaGecmisiExcel(
    @Query('tcNo') tcNo: string,
    @Query('firmaAdi') firmaAdi: string,
    @Res() res: Response
  ) {
    try {
      let konaklamaGecmisi: any[] = [];
      let raporBaslik = '';

      if (firmaAdi) {
        // Firma konaklama geçmişi
        konaklamaGecmisi = await this.musteriService.getFirmaKonaklamaGecmisi(firmaAdi);
        raporBaslik = `${firmaAdi} - Firma Konaklama Geçmişi`;
      } else if (tcNo) {
        // Müşteri konaklama geçmişi
        const musteriBilgi = await this.musteriService.getMusteriBilgiByTCN(tcNo);
        konaklamaGecmisi = await this.musteriService.getKonaklamaGecmisi(tcNo);
        raporBaslik = `${musteriBilgi?.MstrAdi || tcNo} - Konaklama Geçmişi`;
      } else {
        throw new Error('TC No veya Firma Adı gerekli');
      }

      // Excel verilerini hazırla
      const excelData = konaklamaGecmisi.map(row => ({
        'Kayıt Tarihi': this.formatDate(new Date(row.kKytTarihi)),
        'Oda-Yatak': `${row.KnklmOdaNo}-${row.KnklmYtkNo}`,
        'Konaklama Tipi': row.KnklmTip || 'N/A',
        'Tutar (TL)': row.KnklmNfyt || 0,
        'Giriş Tarihi': row.KnklmGrsTrh ? this.formatDate(new Date(row.KnklmGrsTrh)) : 'N/A',
        'Planlanan Çıkış': row.KnklmPlnTrh ? this.formatDate(new Date(row.KnklmPlnTrh)) : 'N/A',
        'Çıkış Tarihi': row.KnklmCksTrh ? this.formatDate(new Date(row.KnklmCksTrh)) : 'N/A',
        'Not': row.KnklmNot || ''
      }));

      // Excel workbook oluştur
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Sütun genişliklerini ayarla
      const columnWidths = [
        { wch: 12 }, // Kayıt Tarihi
        { wch: 10 }, // Oda-Yatak
        { wch: 15 }, // Konaklama Tipi
        { wch: 12 }, // Tutar
        { wch: 12 }, // Giriş Tarihi
        { wch: 12 }, // Planlanan Çıkış
        { wch: 12 }, // Çıkış Tarihi
        { wch: 10 }, // Durum
        { wch: 30 }  // Not
      ];
      worksheet['!cols'] = columnWidths;

      // Workbook'a worksheet ekle
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Konaklama Geçmişi');

      // Excel dosyasını oluştur
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="konaklama-gecmisi-${Date.now()}.xlsx"`);
      res.setHeader('Content-Length', excelBuffer.length);

      res.send(excelBuffer);
    } catch (error) {
      console.error('Excel rapor hatası:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Excel raporu oluşturulamadı' 
      });
    }
  }

  // Cari Hareketler PDF Raporu
  @Get('cari-hareketler-pdf')
  async getCariHareketlerPDF(
    @Query('tcNo') tcNo: string,
    @Query('firmaAdi') firmaAdi: string,
    @Res() res: Response
  ) {
    try {
      let hareketler: any[] = [];
      let raporBaslik = '';
      if (firmaAdi) {
        hareketler = await this.musteriService.getFirmaCariHareketler(firmaAdi);
        raporBaslik = `${firmaAdi} - Firma Cari Hareketler`;
      } else if (tcNo) {
        const musteriBilgi = await this.musteriService.getMusteriBilgiByTCN(tcNo);
        hareketler = await this.musteriService.getCariHareketler(tcNo);
        raporBaslik = `${musteriBilgi?.MstrAdi || tcNo} - Cari Hareketler`;
      } else {
        throw new Error('TC No veya Firma Adı gerekli');
      }
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      // Font kullanımını geçici olarak kaldırdık
      // const fontPath = this.getFontPath();
      // doc.font(fontPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="cari-hareketler-${Date.now()}.pdf"`);
      doc.pipe(res);
      doc.fontSize(20).text('GÖKÇE PANSİYON', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text(raporBaslik, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Rapor Tarihi: ${this.formatDate(new Date())}`, { align: 'right' });
      doc.moveDown(2);
      const headers = ['Tarih', 'İşlem Tipi', 'Açıklama', 'Tutar', 'Birim'];
      const columnWidths = [80, 80, 180, 70, 50];
      let yPosition = doc.y;
      doc.fontSize(9);
      headers.forEach((header, index) => {
        doc.text(header, 50 + columnWidths.slice(0, index).reduce((a, b) => a + b, 0), yPosition);
      });
              doc.fontSize(8);
      hareketler.forEach((row, index) => {
        const rowHeight = 20; // Varsayılan satır yüksekliği
        if (yPosition > 650) {
          doc.addPage();
          yPosition = 50;
        }
        const rowData = [
          row.iKytTarihi ? this.formatDate(new Date(row.iKytTarihi)) : '',
          row.islemTip || '',
          row.islemBilgi || '',
          `${row.islemTutar?.toLocaleString('tr-TR') || 0} TL`,
          row.islemBirim || ''
        ];

        // Hücreleri çiz - wrap text ile
        rowData.forEach((cell, cellIndex) => {
          const cellWidth = columnWidths[cellIndex];
          const cellX = 50 + columnWidths.slice(0, cellIndex).reduce((a, b) => a + b, 0);
          
          doc.text(cell, cellX, yPosition, { 
            width: cellWidth, 
            align: 'left'
          });
        });

        // Sabit satır yüksekliği (wrap text için biraz daha fazla)
        yPosition += 25; // 25px satır yüksekliği
      });
      doc.end();
    } catch (error) {
      console.error('Cari hareketler PDF rapor hatası:', error);
      res.status(500).json({ success: false, message: 'Cari hareketler PDF raporu oluşturulamadı' });
    }
  }

  // Cari Hareketler Excel Raporu
  @Get('cari-hareketler-excel')
  async getCariHareketlerExcel(
    @Query('tcNo') tcNo: string,
    @Query('firmaAdi') firmaAdi: string,
    @Res() res: Response
  ) {
    try {
      let hareketler: any[] = [];
      let raporBaslik = '';
      if (firmaAdi) {
        hareketler = await this.musteriService.getFirmaCariHareketler(firmaAdi);
        raporBaslik = `${firmaAdi} - Firma Cari Hareketler`;
      } else if (tcNo) {
        const musteriBilgi = await this.musteriService.getMusteriBilgiByTCN(tcNo);
        hareketler = await this.musteriService.getCariHareketler(tcNo);
        raporBaslik = `${musteriBilgi?.MstrAdi || tcNo} - Cari Hareketler`;
      } else {
        throw new Error('TC No veya Firma Adı gerekli');
      }
      const excelData = hareketler.map(row => ({
        'Tarih': row.iKytTarihi ? this.formatDate(new Date(row.iKytTarihi)) : '',
        'İşlem Tipi': row.islemTip || '',
        'Açıklama': row.islemBilgi || '',
        'Tutar (TL)': row.islemTutar || 0,
        'Birim': row.islemBirim || ''
      }));
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      worksheet['!cols'] = [ { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 8 } ];
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Cari Hareketler');
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="cari-hareketler-${Date.now()}.xlsx"`);
      res.setHeader('Content-Length', excelBuffer.length);
      res.send(excelBuffer);
    } catch (error) {
      console.error('Cari hareketler Excel rapor hatası:', error);
      res.status(500).json({ success: false, message: 'Cari hareketler Excel raporu oluşturulamadı' });
    }
  }
}
