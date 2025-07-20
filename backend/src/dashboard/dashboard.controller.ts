/* eslint-disable prettier/prettier */
import { Controller, Get, Query, HttpException, HttpStatus, Param, Put } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // Ana müşteri listesi - sp_bOdGunMusteriListeY kullanarak
  @Get('musteri-listesi')
  async getMusteriListesi(@Query('tip') tip: string = 'TÜMÜ') {
    try {
      const data = await this.dashboardService.getMusteriListesi(tip);
      return {
        success: true,
        data: data,
        count: data.length,
        tip: tip
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Müşteri listesi alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Alternatif: View'dan direkt sorgulama
  @Get('musteri-konaklama-view')
  async getMusteriKonaklamaView(@Query('tip') tip?: string) {
    try {
      const data = await this.dashboardService.getMusteriKonaklamaView(tip);
      return {
        success: true,
        data: data,
        count: data.length,
        tip: tip || 'TÜMÜ'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `View sorgusu başarısız: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Konaklama tiplerini getir
  @Get('konaklama-tipleri')
  async getKonaklamaTipleri() {
    try {
      const data = await this.dashboardService.getKonaklamaTipleri();
      return {
        success: true,
        data: data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Konaklama tipleri alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Oda tiplerini getir
  @Get('oda-tipleri')
  async getOdaTipleri() {
    try {
      const data = await this.dashboardService.getOdaTipleri();
      return {
        success: true,
        data: data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Oda tipleri alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 🔥 KOORDİNELİ ÇALIŞMA: Seçili konaklama tipine göre uygun oda tiplerini getir
  @Get('oda-tipleri-by-konaklama')
  async getOdaTipleriByKonaklama(@Query('konaklamaTip') konaklamaTip: string, @Query('kartTip') kartTip: string = 'toplam-aktif') {
    try {
      const data = await this.dashboardService.getOdaTipleriByKonaklama(konaklamaTip, kartTip);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Oda tipleri alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 🔥 KOORDİNELİ ÇALIŞMA: Seçili oda tipine göre uygun konaklama tiplerini getir
  @Get('konaklama-tipleri-by-oda')
  async getKonaklamaTipleriByOda(@Query('odaTip') odaTip: string, @Query('kartTip') kartTip: string = 'toplam-aktif') {
    try {
      const data = await this.dashboardService.getKonaklamaTipleriByOda(odaTip, kartTip);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Konaklama tipleri alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 🔥 DİNAMİK LİSTE: Seçili kartın müşteri listesinden konaklama tiplerini getir
  @Get('dinamik-konaklama-tipleri')
  async getDinamikKonaklamaTipleri(@Query('kartTip') kartTip: string = 'toplam-aktif') {
    try {
      const data = await this.dashboardService.getDinamikKonaklamaTipleri(kartTip);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Dinamik konaklama tipleri alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 🔥 DİNAMİK LİSTE: Seçili kartın müşteri listesinden oda tiplerini getir
  @Get('dinamik-oda-tipleri')
  async getDinamikOdaTipleri(@Query('kartTip') kartTip: string = 'toplam-aktif') {
    try {
      const data = await this.dashboardService.getDinamikOdaTipleri(kartTip);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Dinamik oda tipleri alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Dashboard istatistikleri
  @Get('stats')
  async getDashboardStats() {
    try {
      const data = await this.dashboardService.getDashboardStats() as Record<string, unknown>;
      return {
        success: true,
        data: data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Dashboard istatistikleri alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Oda doluluk durumu
  @Get('oda-doluluk')
  async getOdaDolulukDurumu() {
    try {
      const data = await this.dashboardService.getOdaDolulukDurumu();
      return {
        success: true,
        data: data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Oda doluluk durumu alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Toplam Aktif Müşteri Listesi
  @Get('toplam-aktif')
  async getToplamAktifMusteri(@Query('tip') tip: string = 'TÜMÜ', @Query('odaTip') odaTip: string = 'TÜMÜ') {
    try {
      const data = await this.dashboardService.getToplamAktifMusteri(tip, odaTip);
      return {
        success: true,
        data: data,
        count: data.length,
        tip: tip,
        odaTip: odaTip
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Toplam aktif müşteri listesi alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Süresi Dolan Müşteri Listesi
  @Get('suresi-dolan')
  async getSuresiDolanMusteri(@Query('tip') tip: string = 'TÜMÜ') {
    try {
      const data = await this.dashboardService.getSuresiDolanMusteri(tip);
      return {
        success: true,
        data: data,
        count: data.length,
        tip: tip
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Süresi dolan müşteri listesi alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Bugün Çıkan Müşteri Listesi
  @Get('bugun-cikan')
  async getBugunCikanMusteri(@Query('tip') tip: string = 'TÜMÜ') {
    try {
      const data = await this.dashboardService.getBugunCikanMusteri(tip);
      return {
        success: true,
        data: data,
        count: data.length,
        tip: tip
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Bugün çıkan müşteri listesi alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 🔥 Yeni Müşteri Listesi - Bugün giren ve KnklmNot "Yeni Müşteri" ile başlayan
  @Get('yeni-musteri')
  async getYeniMusteri(@Query('tip') tip: string = 'TÜMÜ') {
    try {
      const data = await this.dashboardService.getYeniMusteri(tip);
      return {
        success: true,
        data: data,
        count: data.length,
        tip: tip
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Yeni müşteri listesi alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 🔥 Yeni Giriş Listesi - Bugün giren ve KnklmNot "Yeni Giriş" ile başlayan
  @Get('yeni-giris')
  async getYeniGiris(@Query('tip') tip: string = 'TÜMÜ') {
    try {
      const data = await this.dashboardService.getYeniGiris(tip);
      return {
        success: true,
        data: data,
        count: data.length,
        tip: tip
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Yeni giriş listesi alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Bugün Giren Müşteri Listesi (Eski endpoint - geriye uyumluluk için)
  @Get('bugun-giren')
  async getBugunGirenMusteri(@Query('tip') tip: string = 'TÜMÜ') {
    try {
      const data = await this.dashboardService.getBugunGirenMusteri(tip);
      return {
        success: true,
        data: data,
        count: data.length,
        tip: tip
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Bugün giren müşteri listesi alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Borçlu Müşteri Listesi - tblCari bilgileri ve hesaplanan borç tutarları
  @Get('borclu-musteriler')
  async getBorcluMusteriler(@Query('page') page: string = '1', @Query('limit') limit: string = '100') {
    try {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 100;
      
      console.log(`🔥 getBorcluMusteriler endpoint çağrıldı - page: ${pageNum}, limit: ${limitNum}`);
      
      const result = await this.dashboardService.getBorcluMusteriler(pageNum, limitNum);
      return {
        success: true,
        data: result.data,
        count: result.data.length,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Borçlu müşteri listesi alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Alacaklı Müşteri Listesi - bakiyesi negatif olan müşteriler (işletme müşteriye borçlu)
  @Get('alacakli-musteriler')
  async getAlacakliMusteriler() {
    try {
      const data = await this.dashboardService.getAlacakliMusteriler();
      return {
        success: true,
        data: data,
        count: data.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Alacaklı müşteri listesi alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Cari Hareketler - seçilen müşterinin tüm işlemleri
  @Get('cari-hareketler')
  async getCariHareketler(@Query('cariKod') cariKod: string) {
    try {
      if (!cariKod) {
        throw new HttpException({
          success: false,
          message: 'Cari kod parametresi gereklidir'
        }, HttpStatus.BAD_REQUEST);
      }

      const data = await this.dashboardService.getCariHareketler(cariKod);
      return {
        success: true,
        data: data,
        count: data.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Cari hareketler alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Çıkış Yapanlar Sayısı
  @Get('cikis-yapanlar-sayisi')
  async getCikisYapanlarSayisi() {
    try {
      const sayisi = await this.dashboardService.getCikisYapanlarSayisi();
      return {
        success: true,
        data: sayisi
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Çıkış yapanlar sayısı alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Çıkış Yapanlar Listesi
  @Get('cikis-yapanlar')
  async getCikisYapanlarListesi(@Query('tip') tip: string = 'TÜMÜ', @Query('odaTip') odaTip: string = 'TÜMÜ') {
    try {
      const data = await this.dashboardService.getCikisYapanlarListesi(tip, odaTip);
      return {
        success: true,
        data: data,
        count: data.length,
        tip: tip,
        odaTip: odaTip
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Çıkış yapanlar listesi alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Müşteri Konaklama Geçmişi
  @Get('musteri-konaklama-gecmisi/:tcKimlik')
  async getMusteriKonaklamaGecmisi(@Param('tcKimlik') tcKimlik: string) {
    try {
      const data = await this.dashboardService.getMusteriKonaklamaGecmisi(tcKimlik);
      return {
        success: true,
        data: data,
        count: data.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Müşteri konaklama geçmişi alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 🔥 MÜŞTERİ BAKİYE HESAPLAMA
  @Get('musteri-bakiye/:cariKod')
  async getMusteriBakiye(@Param('cariKod') cariKod: string) {
    try {
      const bakiye = await this.dashboardService.getMusteriBakiye(cariKod);
      return {
        success: true,
        bakiye: bakiye,
        cariKod: cariKod
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Müşteri bakiye hesaplama hatası: ${errorMessage}`,
        bakiye: 0
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 🔥 FİRMA BAKİYE HESAPLAMA - Aynı firmadaki tüm müşterilerin toplam bakiyesi
  @Get('firma-bakiye/:firmaAdi')
  async getFirmaBakiye(@Param('firmaAdi') firmaAdi: string) {
    try {
      const bakiye = await this.dashboardService.getFirmaBakiye(firmaAdi);
      return {
        success: true,
        bakiye: bakiye,
        firmaAdi: firmaAdi
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Firma bakiye hesaplama hatası: ${errorMessage}`,
        bakiye: 0
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 🔥 FİRMA GENELİ KONAKLAMA GEÇMİŞİ
  @Get('firma-konaklama-gecmisi/:firmaAdi')
  async getFirmaGenelKonaklamaGecmisi(@Param('firmaAdi') firmaAdi: string) {
    try {
      const data = await this.dashboardService.getFirmaGenelKonaklamaGecmisi(firmaAdi);
      return {
        success: true,
        data: data,
        count: data.length,
        firmaAdi: firmaAdi
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Firma genel konaklama geçmişi alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 🔥 FİRMA GENELİ CARİ HAREKETLER
  @Get('firma-cari-hareketler/:firmaAdi')
  async getFirmaGenelCariHareketler(@Param('firmaAdi') firmaAdi: string) {
    try {
      const data = await this.dashboardService.getFirmaGenelCariHareketler(firmaAdi);
      return {
        success: true,
        data: data,
        count: data.length,
        firmaAdi: firmaAdi
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Firma genel cari hareketler alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }



  // 🚨 KARA LİSTE KONTROLÜ
  @Get('kara-liste-kontrol/:tcKimlik')
  async checkKaraListeDurum(@Param('tcKimlik') tcKimlik: string) {
    try {
      const data = await this.dashboardService.checkKaraListeDurum(tcKimlik);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Kara liste kontrolü yapılamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 🚨 KARA LİSTEDEN ÇIKARMA
  @Put('kara-listeden-cikar/:tcKimlik')
  async karaListedenCikar(@Param('tcKimlik') tcKimlik: string) {
    try {
      const data: { success: boolean; message: string } = await this.dashboardService.karaListedenCikar(tcKimlik);
      return {
        success: true,
        data: data,
        message: 'Müşteri kara listeden başarıyla çıkarıldı'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Kara listeden çıkarma işlemi başarısız: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 📊 GELİŞMİŞ DASHBOARD İSTATİSTİKLERİ

  // Aylık Gelir Trendi (Son 12 Ay)
  @Get('aylik-gelir-trendi')
  async getAylikGelirTrendi() {
    try {
      const data = await this.dashboardService.getAylikGelirTrendi();
      return {
        success: true,
        data: data,
        count: data.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Aylık gelir trendi alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Oda Tipi Analizi
  @Get('oda-tipi-analizi')
  async getOdaTipiAnalizi() {
    try {
      const data = await this.dashboardService.getOdaTipiAnalizi();
      return {
        success: true,
        data: data,
        count: data.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Oda tipi analizi alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Konaklama Tipi Dağılımı
  @Get('konaklama-tipi-dagilimi')
  async getKonaklamaTipiDagilimi() {
    try {
      const data = await this.dashboardService.getKonaklamaTipiDagilimi();
      return {
        success: true,
        data: data,
        count: data.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Konaklama tipi dağılımı alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Son 7 Gün Aktivite
  @Get('son-7-gun-aktivite')
  async getSon7GunAktivite() {
    try {
      const data = await this.dashboardService.getSon7GunAktivite();
      return {
        success: true,
        data: data,
        count: data.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Son 7 gün aktivite verisi alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Firma Analizi
  @Get('firma-analizi')
  async getFirmaAnalizi() {
    try {
      const data = await this.dashboardService.getFirmaAnalizi();
      return {
        success: true,
        data: data,
        count: data.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new HttpException({
        success: false,
        message: `Firma analizi alınamadı: ${errorMessage}`
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('musteri-odeme-vadesi/:tcKimlik')
  async getMusteriOdemeVadesiByTC(@Param('tcKimlik') tcKimlik: string) {
    try {
      // Dashboard service üzerinden ödeme vadesi hesapla
      const result = await this.dashboardService.hesaplaMusteriOdemeVadesiByTC(tcKimlik);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('TC ile ödeme vadesi hesaplama hatası:', error);
      return {
        success: false,
        message: 'Ödeme vadesi hesaplanamadı',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

} 