/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Musteri } from '../entities/musteri.entity';
import { Cari } from '../entities/cari.entity';
import { OdaYatak, OdaTipLfyt } from '../entities/oda-yatak.entity';
import { CreateMusteriDto } from '../dto/create-musteri.dto';
import { DatabaseConfigService } from '../database/database-config.service';
import { DatabaseTransactionService } from '../database/database-transaction.service';
import { QueryRunner } from 'typeorm';

@Injectable()
export class MusteriService {
  private dbConfig: DatabaseConfigService;

  constructor(
    @InjectRepository(Musteri)
    private musteriRepository: Repository<Musteri>,
    @InjectRepository(Cari)
    private cariRepository: Repository<Cari>,
    @InjectRepository(OdaYatak)
    private odaYatakRepository: Repository<OdaYatak>,
    @InjectRepository(OdaTipLfyt)
    private odaTipLfytRepository: Repository<OdaTipLfyt>,
    private readonly transactionService: DatabaseTransactionService
  ) {
    this.dbConfig = new DatabaseConfigService();
  }

  async create(createMusteriDto: CreateMusteriDto) {
    console.log('=== Musteri Create Operation Started ===');
    console.log('Input data:', createMusteriDto);
    
    // TC Kimlik No kontrolü
    if (createMusteriDto.MstrTCN) {
      const existingMusteri = await this.checkTCExists(createMusteriDto.MstrTCN);
      if (existingMusteri) {
        throw new Error('Bu TC Kimlik numarası zaten kayıtlı!');
      }
    }
    
    // Use stored procedure for insertion
    // Note: mKytTarihi is auto-generated in SP with CONVERT(nchar, GetDate(), 104)
    const storedProcedures = this.dbConfig.getStoredProcedures();
    const query = `
      EXEC ${storedProcedures.musteriEkle} 
        @MstrKllnc = @0,
        @MstrHspTip = @1,
        @MstrTCN = @2,
        @MstrAdi = @3,
        @MstrDgmTarihi = @4,
        @MstrTelNo = @5,
        @MstrTel2 = @6,
        @MstrEposta = @7,
        @MstrMeslek = @8,
        @MstrYakini = @9,
        @MstrYknTel = @10,
        @MstrDurum = @11,
        @MstrFirma = @12,
        @MstrVD = @13,
        @MstrVno = @14,
        @MstrFrmTel = @15,
        @MstrFrmMdr = @16,
        @MstrMdrTel = @17,
        @MstrAdres = @18,
        @MstrResim = @19,
        @MstrNot = @20
    `;

    const parameters = [
      createMusteriDto.MstrKllnc,           // @0
      createMusteriDto.MstrHspTip,          // @1  
      createMusteriDto.MstrTCN,             // @2
      createMusteriDto.MstrAdi,             // @3
      createMusteriDto.MstrDgmTarihi || null, // @4
      createMusteriDto.MstrTelNo || null,   // @5
      createMusteriDto.MstrTel2 || null,    // @6
      createMusteriDto.MstrEposta || null,  // @7
      createMusteriDto.MstrMeslek || null,  // @8
      createMusteriDto.MstrYakini || null,  // @9
      createMusteriDto.MstrYknTel || null,  // @10
      createMusteriDto.MstrDurum || null,   // @11
      createMusteriDto.MstrFirma || null,   // @12
      createMusteriDto.MstrVD || null,      // @13
      createMusteriDto.MstrVno || null,     // @14
      createMusteriDto.MstrFrmTel || null,  // @15
      createMusteriDto.MstrFrmMdr || null,  // @16
      createMusteriDto.MstrMdrTel || null,  // @17
      createMusteriDto.MstrAdres || null,   // @18
      createMusteriDto.MstrResim || '0x9473FBCCBC01AF',                     // @19 - Fixed MstrResim value as binary
      createMusteriDto.MstrNot || null,     // @20
    ];

    console.log('SQL Query:', query);
    console.log('Parameters:', parameters);

    try {
      console.log('Executing database query...');
      const result: unknown = await this.musteriRepository.query(query, parameters);
      console.log('Database query result:', result);
      
      // Müşteri kaydı başarılı olduktan sonra Cari kaydı oluştur
      const insertedMstrNo = await this.getLastInsertedMstrNo();
      if (insertedMstrNo) {
        await this.createCariRecord(createMusteriDto, insertedMstrNo);
      }
      
      console.log('=== Musteri Create Operation Successful ===');
      return { success: true, message: 'Müşteri başarıyla eklendi' };
    } catch (error: unknown) {
      console.error('=== Database Error Details ===');
      console.error('Error object:', error);
      if (error && typeof error === 'object') {
        const err = error as Record<string, unknown>;
        console.error('Error message:', err.message);
        console.error('Error code:', err.code);
        console.error('Error number:', err.number);
        console.error('Error state:', err.state);
        console.error('Error severity:', err.severity);
        console.error('Full error stack:', err.stack);
      }
      console.error('=== End Database Error Details ===');
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error('Müşteri eklenirken bir hata oluştu: ' + errorMessage);
    }
  }

  async createMusteriIslem(createMusteriDto: CreateMusteriDto): Promise<any> {
    console.log('=== MusteriService.createMusteriIslem called ===');
    console.log('Input data:', createMusteriDto);
    
    // TC Kimlik No kontrolü artık controller'da yapılıyor
    // Bu fonksiyon sadece yeni müşteriler için çağrılıyor
    
    // Use stored procedure for insertion
    const storedProcedures = this.dbConfig.getStoredProcedures();
    const query = `
      EXEC ${storedProcedures.musteriEkle} 
        @MstrKllnc = @0,
        @MstrHspTip = @1,
        @MstrTCN = @2,
        @MstrAdi = @3,
        @MstrDgmTarihi = @4,
        @MstrTelNo = @5,
        @MstrTel2 = @6,
        @MstrEposta = @7,
        @MstrMeslek = @8,
        @MstrYakini = @9,
        @MstrYknTel = @10,
        @MstrDurum = @11,
        @MstrFirma = @12,
        @MstrVD = @13,
        @MstrVno = @14,
        @MstrFrmTel = @15,
        @MstrFrmMdr = @16,
        @MstrMdrTel = @17,
        @MstrAdres = @18,
        @MstrResim = @19,
        @MstrNot = @20
    `;

    const parameters = [
      createMusteriDto.MstrKllnc,           // @0
      createMusteriDto.MstrHspTip,          // @1  
      createMusteriDto.MstrTCN,             // @2
      createMusteriDto.MstrAdi,             // @3
      createMusteriDto.MstrDgmTarihi || null, // @4
      createMusteriDto.MstrTelNo || null,   // @5
      createMusteriDto.MstrTel2 || null,    // @6
      createMusteriDto.MstrEposta || null,  // @7
      createMusteriDto.MstrMeslek || null,  // @8
      createMusteriDto.MstrYakini || null,  // @9
      createMusteriDto.MstrYknTel || null,  // @10
      createMusteriDto.MstrDurum || null,   // @11
      createMusteriDto.MstrFirma || null,   // @12
      createMusteriDto.MstrVD || null,      // @13
      createMusteriDto.MstrVno || null,     // @14
      createMusteriDto.MstrFrmTel || null,  // @15
      createMusteriDto.MstrFrmMdr || null,  // @16
      createMusteriDto.MstrMdrTel || null,  // @17
      createMusteriDto.MstrAdres || null,   // @18
      createMusteriDto.MstrResim || '0x9473FBCCBC01AF', // @19 - Fixed MstrResim value as binary
      createMusteriDto.MstrNot || null,     // @20
    ];

    try {
      console.log('Executing database query...');
      const result: unknown = await this.musteriRepository.query(query, parameters);
      console.log('Database query result:', result);
      
      // Müşteri kaydı başarılı olduktan sonra Cari kaydı oluştur
      const insertedMstrNo = await this.getLastInsertedMstrNo();
      if (insertedMstrNo) {
        await this.createCariRecord(createMusteriDto, insertedMstrNo);
      }
      
      console.log('=== Musteri CreateIslem Operation Successful ===');
      return { 
        success: true, 
        message: 'Müşteri başarıyla eklendi',
        musteriNo: insertedMstrNo
      };
    } catch (error: unknown) {
      console.error('=== Database Error Details ===');
      console.error('Error object:', error);
      if (error && typeof error === 'object') {
        const err = error as Record<string, unknown>;
        console.error('Error message:', err.message);
      }
      console.error('=== End Database Error Details ===');
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error('Müşteri eklenirken bir hata oluştu: ' + errorMessage);
    }
  }

  async checkTCExists(tcNo: string): Promise<boolean> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `SELECT COUNT(*) as count FROM ${tables.musteri} WHERE MstrTCN = @0`;
      const result: { count: number }[] = await this.musteriRepository.query(query, [tcNo]);
      return result[0]?.count > 0;
    } catch (error) {
      console.error('TC kontrolü sırasında hata:', error);
      return false;
    }
  }

  async checkMusteriDurum(tcNo: string): Promise<{ exists: boolean; durum?: string; message: string }> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `SELECT MstrDurum FROM ${tables.musteri} WHERE MstrTCN = @0`;
      const result: { MstrDurum: string }[] = await this.musteriRepository.query(query, [tcNo]);
      
      if (result.length === 0) {
        return {
          exists: false,
          message: 'TC kimlik no kayıtlarda bulunamadı'
        };
      }

      const durum = result[0].MstrDurum;
      
      if (durum === 'AYRILDI') {
        return {
          exists: true,
          durum: durum,
          message: 'Müşteri daha önce kayıtlı ancak ayrılmış - Yeni kayıt yapılabilir'
        };
      } else {
        return {
          exists: true,
          durum: durum,
          message: 'Müşteri Halen Konaklıyor'
        };
      }
    } catch (error) {
      console.error('Müşteri durum kontrolü sırasında hata:', error);
      return {
        exists: false,
        message: 'Durum kontrolü yapılamadı'
      };
    }
  }

  // 🔥 MÜŞTERİ DURUMU GÜNCELLEME FONKSİYONU - AYRILDI -> KALIYOR
  async updateMusteriDurumu(tcNo: string, yeniDurum: string): Promise<{ success: boolean; message: string }> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `UPDATE ${tables.musteri} SET MstrDurum = @1 WHERE MstrTCN = @0`;
      await this.musteriRepository.query(query, [tcNo, yeniDurum]);
      
      console.log(`TC ${tcNo} - Müşteri durumu ${yeniDurum} olarak güncellendi`);
      return {
        success: true,
        message: `Müşteri durumu ${yeniDurum} olarak güncellendi`
      };
    } catch (error) {
      console.error('Müşteri durumu güncelleme hatası:', error);
      return {
        success: false,
        message: 'Müşteri durumu güncellenemedi'
      };
    }
  }

  async getMusteriBilgiByTCN(tcNo: string): Promise<any> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `SELECT * FROM ${tables.musteri} WHERE MstrTCN = @0`;
      const result: any[] = await this.musteriRepository.query(query, [tcNo]);
      return result[0] || null;
    } catch (error) {
      console.error('Müşteri bilgileri alınırken hata:', error);
      throw new Error('Müşteri bilgileri alınamadı');
    }
  }

  async getMusteriBilgiByNo(mstrNo: number): Promise<any> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `SELECT * FROM ${tables.musteri} WHERE MstrNo = @0`;
      const result: any[] = await this.musteriRepository.query(query, [mstrNo]);
      return result[0] || null;
    } catch (error) {
      console.error('Müşteri bilgileri (MstrNo) alınırken hata:', error);
      throw new Error('Müşteri bilgileri alınamadı');
    }
  }

  async getMusteriOdemeVadesi(tcNo: string): Promise<string | null> {
    try {
      const tables = this.dbConfig.getTables();
      
      // Önce müşteri bilgilerini al
      const musteriData = await this.getMusteriBilgiByTCN(tcNo) as { MstrHspTip?: string; MstrNo?: number } | null;
      if (!musteriData || !musteriData.MstrNo || !musteriData.MstrHspTip) {
        return null;
      }

      // Cari kod oluştur
      const cariKod = musteriData.MstrHspTip === 'Bireysel' ? `MB${musteriData.MstrNo}` : `MK${musteriData.MstrNo}`;
      
      // En son konaklama işlem kaydını bul - iKytTarihi alanını da dahil et
      const query = `
        SELECT TOP 1 islemBilgi, iKytTarihi
        FROM ${tables.islem}
        WHERE islemCrKod = @0 
          AND islemGrup = 'Konaklama' 
          AND islemTip = 'GELİR'
        ORDER BY islemNo DESC
      `;
      
      const result: { islemBilgi?: string; iKytTarihi?: string }[] = await this.musteriRepository.query(query, [cariKod]);
      
      if (result.length > 0) {
        const islemBilgi = result[0].islemBilgi;
        const iKytTarihi = result[0].iKytTarihi;
        
        // Önce islemBilgi'den "BAKİYE ÖDEME VADESİ: " kısmını çıkar
        if (islemBilgi && typeof islemBilgi === 'string') {
        const vadeMatch = islemBilgi.match(/BAKİYE ÖDEME VADESİ:\s*([^-]+)/);
        if (vadeMatch && vadeMatch[1]) {
          return vadeMatch[1].trim();
          }
        }
        
        // Eğer islemBilgi'de vade yoksa, iKytTarihi'ni DD.MM.YYYY formatına çevirerek döndür
        if (iKytTarihi && typeof iKytTarihi === 'string') {
          console.log(`Vade bilgisi islemBilgi'de bulunamadı, iKytTarihi kullanılıyor: ${iKytTarihi}`);
          // iKytTarihi'ni Date objesine çevir ve DD.MM.YYYY formatında döndür
          try {
            const dateObj = new Date(iKytTarihi);
            if (!isNaN(dateObj.getTime())) {
              return this.formatDate(dateObj);
            }
          } catch (error) {
            console.error('iKytTarihi format hatası:', error);
          }
          return iKytTarihi; // Hata durumunda orijinal değeri döndür
        }
      }
      
      return null;
    } catch (error) {
      console.error('Müşteri ödeme vadesi alınırken hata:', error);
      return null;
    }
  }

  async getMevcutKonaklamaBilgisi(tcNo: string): Promise<any> {
    try {
      const tables = this.dbConfig.getTables();
      const views = this.dbConfig.getViews();
      // Mevcut aktif konaklama bilgisini v_MusteriKonaklama view'dan al
      const query = `
        SELECT 
          v.MstrTCN,
          v.MstrAdi,
          v.MstrTelNo,
          v.MstrHspTip,
          v.MstrFirma,
          v.KnklmOdaTip,
          v.KnklmOdaNo,
          v.KnklmYtkNo,
          v.KnklmTip,
          v.KnklmGrsTrh,
          v.KnklmPlnTrh,
          v.KnklmLfyt,
          v.Knklmisk,
          v.KnklmNfyt,
          v.KnklmNot,
          m.MstrNo,
          m.MstrDgmTarihi,
          m.MstrTel2,
          m.MstrEposta,
          m.MstrMeslek,
          m.MstrYakini,
          m.MstrYknTel,
          m.MstrAdres,
          m.MstrVD,
          m.MstrVno,
          m.MstrFrmTel,
          m.MstrFrmMdr,
          m.MstrMdrTel
        FROM ${views.musteriKonaklama} v
        LEFT JOIN ${tables.musteri} m ON v.MstrTCN = m.MstrTCN
        WHERE v.MstrTCN = @0 
          AND v.MstrDurum = 'KALIYOR'
          AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
      `;
      
      const result: any[] = await this.musteriRepository.query(query, [tcNo]);
      return result[0] || null;
    } catch (error) {
      console.error('Mevcut konaklama bilgileri alınırken hata:', error);
      throw new Error('Mevcut konaklama bilgileri alınamadı');
    }
  }

  async updateMusteriBilgileri(tcNo: string, updateData: Partial<Musteri>, username?: string): Promise<any> {
    return this.transactionService.executeInTransaction(async (queryRunner) => {
      const tables = this.dbConfig.getTables();
      const musteriRepo = queryRunner.manager.getRepository(Musteri);
      
      // Kullanıcı adını belirle
      const kullaniciAdi = username || 'admin';
      
      // 1. Mevcut müşteri bilgilerini al
      const mevcutMusteri = await musteriRepo.findOne({ where: { MstrTCN: tcNo } });
      if (!mevcutMusteri) {
        throw new NotFoundException(`TC No'su ${tcNo} olan müşteri bulunamadı.`);
      }

      // 2. tblMusteri için UPDATE sorgusunu hazırla ve çalıştır
      const musteriUpdateQuery = `
        UPDATE ${tables.musteri}
        SET 
          MstrAdi = @1, MstrTelNo = @2, MstrHspTip = @3, MstrDgmTarihi = @4, MstrTel2 = @5,
          MstrEposta = @6, MstrMeslek = @7, MstrYakini = @8, MstrYknTel = @9, MstrAdres = @10,
          MstrNot = @11, MstrFirma = @12, MstrVD = @13, MstrVno = @14, MstrFrmTel = @15,
          MstrFrmMdr = @16, MstrMdrTel = @17
        WHERE MstrTCN = @0`;
      
      const musteriParams = [
        tcNo,
        updateData.MstrAdi || mevcutMusteri.MstrAdi,
        updateData.MstrTelNo || mevcutMusteri.MstrTelNo,
        updateData.MstrHspTip || mevcutMusteri.MstrHspTip,
        updateData.MstrDgmTarihi || mevcutMusteri.MstrDgmTarihi,
        updateData.MstrTel2 || mevcutMusteri.MstrTel2,
        updateData.MstrEposta || mevcutMusteri.MstrEposta,
        updateData.MstrMeslek || mevcutMusteri.MstrMeslek,
        updateData.MstrYakini || mevcutMusteri.MstrYakini,
        updateData.MstrYknTel || mevcutMusteri.MstrYknTel,
        updateData.MstrAdres || mevcutMusteri.MstrAdres,
        updateData.MstrNot || mevcutMusteri.MstrNot,
        updateData.MstrFirma !== undefined ? updateData.MstrFirma : mevcutMusteri.MstrFirma,
        updateData.MstrVD || mevcutMusteri.MstrVD,
        updateData.MstrVno || mevcutMusteri.MstrVno,
        updateData.MstrFrmTel || mevcutMusteri.MstrFrmTel,
        updateData.MstrFrmMdr || mevcutMusteri.MstrFrmMdr,
        updateData.MstrMdrTel || mevcutMusteri.MstrMdrTel,
      ];

      await queryRunner.query(musteriUpdateQuery, musteriParams);

      // 3. tblCari için UPDATE sorgusunu ve ilgili işlemleri yönet
      const yeniHesapTipi = updateData.MstrHspTip || mevcutMusteri.MstrHspTip;
      const eskiHesapTipi = mevcutMusteri.MstrHspTip;

      // Kural: Eğer yeni hesap tipi Bireysel ise, cariYetkili (firma adı) NULL olmalı.
      // Aksi takdirde, güncellenen firma adını kullan.
      const cariYetkili = yeniHesapTipi === 'Bireysel'
        ? null
        : (updateData.MstrFirma !== undefined ? updateData.MstrFirma : mevcutMusteri.MstrFirma);

      // Eğer hesap tipi değiştiyse, CariKod da değişir. Bu durumu ele almalıyız.
      if (yeniHesapTipi !== eskiHesapTipi) {
        const eskiCariKod = `${eskiHesapTipi === 'Bireysel' ? 'MB' : 'MK'}${mevcutMusteri.MstrNo}`;
        const yeniCariKod = `${yeniHesapTipi === 'Bireysel' ? 'MB' : 'MK'}${mevcutMusteri.MstrNo}`;

        console.log(`Hesap tipi değişti: ${eskiHesapTipi} -> ${yeniHesapTipi}. CariKod güncelleniyor: ${eskiCariKod} -> ${yeniCariKod}`);

        // Adım 3a: tblCari'yi güncelle (eski koda göre bul, yeni kod dahil tüm verileri güncelle)
        const cariUpdateQuery = `
          UPDATE ${tables.cari}
          SET
            CariKod = @1,
            cKytTarihi = @2,
            cariKllnc = @3,
            cariTip = @4,
            cariAdi = @5,
            cariVD = @6,
            cariYetkili = @7,
            cariTelNo = @8,
            cariEposta = @9,
            cariAdres = @10
          WHERE CariKod = @0`;

        const cariUpdateParams = [
          eskiCariKod,
          yeniCariKod,
          this.formatDate(new Date()), // gg.aa.yyyy formatında tarih
          kullaniciAdi,
          'ALACAK',
          updateData.MstrAdi || mevcutMusteri.MstrAdi,
          yeniHesapTipi,
          cariYetkili, // MstrFirma ile eşleştirildi, Bireysel ise NULL
          updateData.MstrTelNo || mevcutMusteri.MstrTelNo,
          updateData.MstrEposta || mevcutMusteri.MstrEposta,
          updateData.MstrAdres || mevcutMusteri.MstrAdres,
        ];
        await queryRunner.query(cariUpdateQuery, cariUpdateParams);

        // Adım 3b: tblislem'deki ilgili tüm kayıtları yeni CariKod ile güncelle
        const islemUpdateQuery = `
          UPDATE ${tables.islem}
          SET islemCrKod = @1
          WHERE islemCrKod = @0`;
        const islemUpdateParams = [eskiCariKod, yeniCariKod];
        await queryRunner.query(islemUpdateQuery, islemUpdateParams);

      } else {
        // Hesap tipi değişmedi. Sadece diğer bilgileri güncelle.
        const cariKod = `${yeniHesapTipi === 'Bireysel' ? 'MB' : 'MK'}${mevcutMusteri.MstrNo}`;
        const cariUpdateQuery = `
          UPDATE ${tables.cari}
          SET
            cKytTarihi = @1,
            cariKllnc = @2,
            cariTip = @3,
            cariAdi = @4,
            cariVD = @5,
            cariYetkili = @6,
            cariTelNo = @7,
            cariEposta = @8,
            cariAdres = @9
          WHERE CariKod = @0`;

        const cariParams = [
          cariKod,
          this.formatDate(new Date()), // gg.aa.yyyy formatında tarih
          kullaniciAdi,
          'ALACAK',
          updateData.MstrAdi || mevcutMusteri.MstrAdi,
          yeniHesapTipi,
          cariYetkili, // MstrFirma ile eşleştirildi, Bireysel ise NULL
          updateData.MstrTelNo || mevcutMusteri.MstrTelNo,
          updateData.MstrEposta || mevcutMusteri.MstrEposta,
          updateData.MstrAdres || mevcutMusteri.MstrAdres,
        ];
        await queryRunner.query(cariUpdateQuery, cariParams);
      }

      // 4. Başarılı sonuç döndür
      const guncellenmisMusteri = await musteriRepo.findOne({ where: { MstrTCN: tcNo } });
      return { success: true, message: 'Müşteri ve cari bilgileri başarıyla güncellendi.', data: guncellenmisMusteri };
    });
  }

  // Helper fonksiyonlar
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  // İşlem bilgisine ödeme vadesi ekleme helper fonksiyonu
  private addOdemeVadesiToIslemBilgi(islemBilgi: string, odemeVadesi?: string): string {
    if (!odemeVadesi || odemeVadesi.trim() === '') {
      return islemBilgi;
    }
    
    // Eğer islemBilgi zaten ödeme vadesi içeriyorsa, değiştirme
    if (islemBilgi.includes('BAKİYE ÖDEME VADESİ:')) {
      return islemBilgi;
    }
    
    // Ödeme vadesi bilgisini başa ekle
    return `BAKİYE ÖDEME VADESİ: ${odemeVadesi} -/- ${islemBilgi}`;
  }

  /**
   * İşlem kayıt tarihi için güncel tarihi döndürür
   * iKytTarihi alanı her zaman işlemin yapıldığı günün tarihi olmalıdır
   */
  private getCurrentTransactionDate(): string {
    return this.formatDate(new Date());
  }

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  private generateSecOdYat(odaNo: string, yatakNo: string): string {
    const ilkDigit = parseInt(odaNo.charAt(0));
    
    // Blok belirleme: ilk digit < 6 ise A, >= 6 ise B
    const blok = ilkDigit < 6 ? 'A' : 'B';
    
    // Kat belirleme: ilk digit
    const kat = ilkDigit.toString().padStart(2, '0');
    
    // Padding
    const odaPadded = odaNo.padStart(4, '0');
    const yatakPadded = yatakNo.padStart(2, '0');
    
    return `MER${blok}${kat}${odaPadded}${yatakPadded}`;
  }

  private parseOdaYatak(odaYatakData: string | { label?: string; value?: string }): { odaNo: string, yatakNo: string } {
    console.log('parseOdaYatak input:', odaYatakData, 'type:', typeof odaYatakData);
    
    // Eğer obje ise, ÖNCE value, sonra label'ı kullan (value genelde '508-1' formatında gelir)
    let odaYatakStr: string;
    if (typeof odaYatakData === 'object' && odaYatakData !== null) {
      if (odaYatakData.value) {
        odaYatakStr = odaYatakData.value;
      } else if (odaYatakData.label) {
        odaYatakStr = odaYatakData.label;
      } else {
        odaYatakStr = JSON.stringify(odaYatakData);
      }
    } else {
      odaYatakStr = String(odaYatakData);
    }
    
    console.log('parseOdaYatak string:', odaYatakStr);
    
    // Önce basit format kontrolü: "123-1" veya arada boşluklu "123 - 1"
    const simpleMatch = odaYatakStr.match(/^(\d+)\s*-\s*(\d+)$/);
    if (simpleMatch) {
      const result = {
        odaNo: simpleMatch[1],
        yatakNo: simpleMatch[2]
      };
      console.log('parseOdaYatak simple result:', result);
      return result;
    }
    
    // Eğer basit format değilse, label formatını dene: "Oda: 123 - Yatak: 1"
    const odaMatch = odaYatakStr.match(/Oda:\s*(\d+)/);
    const yatakMatch = odaYatakStr.match(/Yatak:\s*(\d+)/);
    
    if (!odaMatch || !yatakMatch) {
      console.error('Oda-Yatak parse hatası:', odaYatakStr);
      throw new Error(`Oda-Yatak formatı hatalı: ${odaYatakStr}`);
    }
    
    const result = {
      odaNo: odaMatch[1],
      yatakNo: yatakMatch[1]
    };
    
    console.log('parseOdaYatak label result:', result);
    return result;
  }

  async kaydetKonaklama(konaklamaData: { 
    OdaYatak: string | { label?: string; value?: string };
    KonaklamaSuresi: number;
    KonaklamaTipi: string;
    HesaplananBedel: number;
    ToplamBedel: number;
    MstrKllnc: string;
    OdaTipi: string;
    OdemeTakvimGunu?: number | null; // 🔥 Ö.T.G. alanı eklendi
    planlananCikisTarihi?: string; // Frontend'den gelen planlanan çıkış tarihi
    ekNotlar?: string;
    ekBilgiler?: {
      kahvaltiDahil?: boolean;
      havluVerildi?: boolean;
      prizVerildi?: boolean;
      geceKonaklama?: boolean;
    };
  }, musteriNo: number): Promise<any> {
    try {
      console.log('=== kaydetKonaklama called ===');
      console.log('konaklamaData:', konaklamaData);
      console.log('konaklamaData.OdaYatak:', konaklamaData.OdaYatak);
      console.log('konaklamaData.ekBilgiler:', konaklamaData.ekBilgiler);
      
      const now = new Date();
      const { odaNo, yatakNo } = this.parseOdaYatak(konaklamaData.OdaYatak);
      
      // Tarihleri hesapla - Geç Saat Konaklama kontrolü ile
      const girisTarihi = this.formatDate(now);
      let planlananCikis: string;
      

      
      // Daima frontend'den gelen planlanan çıkış tarihini kullan
      if (konaklamaData.planlananCikisTarihi) {
        console.log('📅 Frontend\'den gelen planlanan çıkış tarihi kullanılıyor (Transaction):', konaklamaData.planlananCikisTarihi);
        planlananCikis = konaklamaData.planlananCikisTarihi;
      } else if (konaklamaData.ekBilgiler?.geceKonaklama) {
        console.log('🌙 Geç Saat Konaklama seçili - Planlanan çıkış tarihi giriş tarihi olarak ayarlanıyor');
        planlananCikis = girisTarihi; // Aynı gün çıkış
      } else {
        // Frontend'den tarih gelmemişse hata fırlat
        throw new Error('Planlanan çıkış tarihi frontend\'den gelmedi!');
      }
      
      console.log('📅 Tarih hesaplamaları:', {
        girisTarihi,
        konaklamaSuresi: konaklamaData.KonaklamaSuresi,
        geceKonaklama: konaklamaData.ekBilgiler?.geceKonaklama || false,
        planlananCikis
      });
      
      // Konaklama tipini parse et (örn: "2 HAFTALIK" -> "HAFTALIK")
      const konaklamaTipi = this.parseKonaklamaTipi(konaklamaData.KonaklamaTipi);
      
      // İskonto hesapla (yüzde olarak)
      let iskonto = 0;
      if (konaklamaData.HesaplananBedel > 0) {
        iskonto = ((konaklamaData.HesaplananBedel - konaklamaData.ToplamBedel) / konaklamaData.HesaplananBedel) * 100;
        iskonto = Math.round(iskonto * 100) / 100; // 2 ondalık basamak
      }
      
      // Blok ve kat bilgisi
      const ilkDigit = parseInt(odaNo.charAt(0));
      const blok = ilkDigit < 6 ? 'A' : 'B';
      const kat = ilkDigit.toString();
      
      // Ödeme takip günü - frontend'den gelen değer varsa onu kullan, yoksa boş bırak
      const odmTkvGun = konaklamaData.OdemeTakvimGunu ? konaklamaData.OdemeTakvimGunu.toString() : '';
      
      // SecOdYat oluştur
      const secOdYat = this.generateSecOdYat(odaNo, yatakNo);
      
      // Not ile zaman damgası (stored procedure zaten ekliyor, biz eklemeyelim)
      const notlarZamanli = konaklamaData.ekNotlar || '';
      
      const storedProcedures = this.dbConfig.getStoredProcedures();
      const query = `EXEC ${storedProcedures.konaklamaEkle} 
        @KnklmKllnc = @0, @KnklmMstrNo = @1, @KnklmSube = @2, @KnklmBlok = @3, @KnklmKat = @4,
        @KnklmOdaTip = @5, @KnklmOdaNo = @6, @KnklmYtkNo = @7, @KnklmTip = @8, @KnklmLfyt = @9,
        @Knklmisk = @10, @KnklmNfyt = @11, @KnklmOdmTkvGun = @12, @KnklmGrsTrh = @13, @KnklmPlnTrh = @14,
        @KnklmCksTrh = @15, @KnklmKrLst = @16, @KnklmNot = @17, @SecOdYat = @18`;
      
      await this.musteriRepository.query(query, [
        konaklamaData.MstrKllnc,  // @0
        musteriNo,                // @1
        'MERKEZ',                 // @2
        blok + '-BLOK',           // @3
        kat + '. KAT',            // @4
        konaklamaData.OdaTipi,    // @5
        odaNo,                    // @6
        yatakNo,                  // @7
        konaklamaTipi,            // @8
        konaklamaData.HesaplananBedel, // @9
        iskonto,                  // @10
        konaklamaData.ToplamBedel, // @11
        odmTkvGun,                // @12
        girisTarihi,              // @13
        planlananCikis,           // @14 - Geç Saat Konaklama kontrolü ile hesaplanmış
        null,                     // @15 - KnklmCksTrh
        null,                     // @16 - KnklmKrLst
        notlarZamanli,            // @17
        secOdYat                  // @18
      ]);
      
      return { success: true };
    } catch (error) {
      console.error('Konaklama kaydı hatası:', error);
      throw new Error('Konaklama kaydı yapılamadı');
    }
  }

  async kaydetIslem(islemData: {
    OdaYatak: string | { label?: string; value?: string };
    KonaklamaSuresi: number;
    KonaklamaTipi: string;
    MstrHspTip: string;
    MstrKllnc: string;
    MstrAdi: string;
    ToplamBedel: number;
    planlananCikisTarihi?: string; // Frontend'den gelen planlanan çıkış tarihi
    musteriDurumu?: string; // 'YENI' veya 'AYRILAN_MUSTERI' 
    OdemeVadesi?: string; // 🔥 Ödeme vadesi bilgisi eklendi
    depozito?: {
      dahil: boolean;
      bedel: number;
    };
  }, musteriNo: number): Promise<any> {
    try {
      const now = new Date();
      const { odaNo, yatakNo } = this.parseOdaYatak(islemData.OdaYatak);
      
      // Tarihleri hesapla
      const girisTarihi = this.formatDate(now);
      let planlananCikis: string;
      

      
      // Daima frontend'den gelen planlanan çıkış tarihini kullan
      if (islemData.planlananCikisTarihi) {
        console.log('📅 İşlem kaydında frontend\'den gelen planlanan çıkış tarihi kullanılıyor (Transaction):', islemData.planlananCikisTarihi);
        planlananCikis = islemData.planlananCikisTarihi;
      } else {
        // Frontend'den tarih gelmemişse hata fırlat
        throw new Error('Planlanan çıkış tarihi frontend\'den gelmedi!');
      }
      
      // Cari kod oluştur
      const cariKod = islemData.MstrHspTip === 'Kurumsal' ? `MK${musteriNo}` : `MB${musteriNo}`;
      
      // Konaklama tipini parse et
      const konaklamaTipi = this.parseKonaklamaTipi(islemData.KonaklamaTipi);
      
      // Blok ve kat bilgisi
      const ilkDigit = parseInt(odaNo.charAt(0));
      const blok = ilkDigit < 6 ? 'A' : 'B';
      const kat = ilkDigit.toString();
      
      // İşlem bilgisi oluştur - ödeme vadesi ile birlikte (stored procedure zaten zaman damgası ekliyor)
      const islemBilgi = `BAKİYE ÖDEME VADESİ: ${islemData.OdemeVadesi || 'Belirtilmemiş'} -/- ${girisTarihi} - ${planlananCikis} DÖNEMİ KONAKLAMA`;
      
      const storedProcedures = this.dbConfig.getStoredProcedures();
      const query = `EXEC ${storedProcedures.islemEkle} 
        @iKytTarihi = @0, @islemKllnc = @1, @islemCrKod = @2, @islemOzel1 = @3, @islemOzel2 = @4,
        @islemOzel3 = @5, @islemOzel4 = @6, @islemArac = @7, @islemTip = @8, @islemGrup = @9,
        @islemAltG = @10, @islemBilgi = @11, @islemMiktar = @12, @islemBirim = @13, @islemTutar = @14,
        @islemDoviz = @15, @islemKur = @16`;
      
      await this.musteriRepository.query(query, [
        this.getCurrentTransactionDate(), // @0 - iKytTarihi: Her zaman işlemin yapıldığı günün tarihi
        islemData.MstrKllnc || 'admin', // @1 - Kullanıcı adı (varsayılan: admin)
        cariKod,                       // @2
        konaklamaTipi,                 // @3
        `${blok}-BLOK - ${kat}. KAT`,  // @4
        `${odaNo} - ${yatakNo}`,       // @5
        '',                            // @6 - islemOzel4 boş
        'Cari İşlem',                  // @7
        'GELİR',                       // @8
        'Konaklama',                   // @9
        islemData.MstrAdi,             // @10
        islemBilgi,                    // @11
        1.00,                          // @12
        'ADET',                        // @13
        islemData.ToplamBedel,         // @14
        'TL',                          // @15
        1.00                           // @16
      ]);
      
      // 🔥 DEPOZİTO KAYDI - Eğer depozito dahil ve bedel > 0 ise
      if (islemData.depozito?.dahil === true && islemData.depozito.bedel > 0) {
        console.log('Depozito kaydı ekleniyor:', {
          musteriDurumu: islemData.musteriDurumu,
          depozitoBedel: islemData.depozito.bedel,
          depozitoDahil: islemData.depozito.dahil
        });
        
        // İşlem bilgisi - müşteri durumuna göre
        let depozitoBilgi: string;
        if (islemData.musteriDurumu === 'YENI') {
          depozitoBilgi = 'İLK KONAKLAMA =DEPOZİTO ALACAĞI=';
        } else {
          depozitoBilgi = 'KONAKLAMA =DEPOZİTO ALACAĞI=';
        }
        
        const depozitQuery = `EXEC ${storedProcedures.islemEkle} 
          @iKytTarihi = @0, @islemKllnc = @1, @islemCrKod = @2, @islemOzel1 = @3, @islemOzel2 = @4,
          @islemOzel3 = @5, @islemOzel4 = @6, @islemArac = @7, @islemTip = @8, @islemGrup = @9,
          @islemAltG = @10, @islemBilgi = @11, @islemMiktar = @12, @islemBirim = @13, @islemTutar = @14,
          @islemDoviz = @15, @islemKur = @16`;
        
        await this.musteriRepository.query(depozitQuery, [
          this.getCurrentTransactionDate(), // @0 - iKytTarihi: Her zaman işlemin yapıldığı günün tarihi
          islemData.MstrKllnc || 'admin', // @1 - Kullanıcı adı (varsayılan: admin)
          cariKod,                       // @2
          konaklamaTipi,                 // @3
          `${blok}-BLOK - ${kat}. KAT`,  // @4
          `${odaNo} - ${yatakNo}`,       // @5
          '',                            // @6 - islemOzel4 boş
          'Nakit Kasa(TL)',              // @7 - DEĞİŞTİ: 'Cari İşlem' -> 'Nakit Kasa(TL)'
          'Çıkan',                       // @8 - DEĞİŞTİ: 'GELİR' -> 'Çıkan'
          'Konaklama',                   // @9
          islemData.MstrAdi,             // @10
          depozitoBilgi,                 // @11 - DEĞİŞTİ: Depozito bilgisi
          1.00,                          // @12
          'ADET',                        // @13
          islemData.depozito.bedel,      // @14 - DEĞİŞTİ: Depozito bedeli
          'TL',                          // @15
          1.00                           // @16
        ]);
        
        console.log('Depozito kaydı başarıyla eklendi');
      }
      
      return { success: true };
    } catch (error) {
      console.error('İşlem kaydı hatası:', error);
      throw new Error('İşlem kaydı yapılamadı');
    }
  }

  async getFirmaList(): Promise<string[]> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `SELECT DISTINCT MstrFirma FROM ${tables.musteri} WHERE MstrFirma IS NOT NULL AND MstrFirma != '' ORDER BY MstrFirma`;
      const result: { MstrFirma: string }[] = await this.musteriRepository.query(query);
      return result.map(item => item.MstrFirma);
    } catch (error) {
      console.error('Firma listesi alınırken hata:', error);
      return [];
    }
  }

  async getFirmaDetails(firmaName: string): Promise<{ MstrVD?: string; MstrVno?: string; MstrFrmTel?: string; MstrFrmMdr?: string; MstrMdrTel?: string } | null> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `
        SELECT TOP 1 MstrVD, MstrVno, MstrFrmTel, MstrFrmMdr, MstrMdrTel 
        FROM ${tables.musteri} 
        WHERE MstrFirma = @0 
        ORDER BY MstrNo DESC
      `;
      const result: { MstrVD?: string; MstrVno?: string; MstrFrmTel?: string; MstrFrmMdr?: string; MstrMdrTel?: string }[] = await this.musteriRepository.query(query, [firmaName]);
      return result[0] || null;
    } catch (error) {
      console.error('Firma detayları alınırken hata:', error);
      return null;
    }
  }

  async updateFirmaInfo(firmaName: string, updateData: { MstrVD?: string; MstrVno?: string; MstrFrmTel?: string; MstrFrmMdr?: string; MstrMdrTel?: string }): Promise<void> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `
        UPDATE ${tables.musteri} 
        SET 
          MstrVD = @1,
          MstrVno = @2,
          MstrFrmTel = @3,
          MstrFrmMdr = @4,
          MstrMdrTel = @5
        WHERE MstrFirma = @0
      `;
      await this.musteriRepository.query(query, [
        firmaName,
        updateData.MstrVD || null,
        updateData.MstrVno || null,
        updateData.MstrFrmTel || null,
        updateData.MstrFrmMdr || null,
        updateData.MstrMdrTel || null
      ]);
    } catch (error) {
      console.error('Firma bilgileri güncellenirken hata:', error);
      throw new Error('Firma bilgileri güncellenemedi');
    }
  }

  async getLastInsertedMstrNo(): Promise<number | null> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `SELECT TOP 1 MstrNo FROM ${tables.musteri} ORDER BY MstrNo DESC`;
      const result: { MstrNo: number }[] = await this.musteriRepository.query(query);
      return result[0]?.MstrNo || null;
    } catch (error) {
      console.error('Son eklenen MstrNo alınamadı:', error);
      return null;
    }
  }

  async createCariRecord(musteriData: CreateMusteriDto, mstrNo: number): Promise<void> {
    try {
      // CariKod oluştur: Bireysel için BM, Kurumsal için KM + MstrNo
      const cariKod = musteriData.MstrHspTip === 'Bireysel' ? `MB${mstrNo}` : `MK${mstrNo}`;
      
      // CariVD belirle
      let cariVD: string;
      if (musteriData.MstrHspTip === 'Bireysel') {
        cariVD = 'Bireysel';
      } else {
        cariVD = musteriData.MstrVD || 'Kurumsal';
      }
      
      // CariVTCN belirle
      let cariVTCN: string;
      if (musteriData.MstrHspTip === 'Bireysel') {
        cariVTCN = musteriData.MstrTCN || '';
      } else {
        cariVTCN = musteriData.MstrVno || musteriData.MstrTCN || '';
      }

      const storedProcedures = this.dbConfig.getStoredProcedures();
      const query = `
        EXEC ${storedProcedures.cariEkle} 
          @CariKllnc = @0,
          @CariKod = @1,
          @CariTip = @2,
          @CariAdi = @3,
          @CariVD = @4,
          @CariVTCN = @5,
          @CariYetkili = @6,
          @CariTelNo = @7,
          @CariEposta = @8,
          @CariAdres = @9
      `;

      const parameters = [
        musteriData.MstrKllnc,                    // @0 - CariKllnc
        cariKod,                                  // @1 - CariKod
        'ALACAK',                                 // @2 - CariTip
        musteriData.MstrAdi,                      // @3 - CariAdi
        cariVD,                                   // @4 - CariVD
        cariVTCN,                                 // @5 - CariVTCN
        musteriData.MstrFrmMdr || null,           // @6 - CariYetkili
        musteriData.MstrTelNo || null,            // @7 - CariTelNo (MstrTelNo kullan)
        musteriData.MstrEposta || null,           // @8 - CariEposta
        musteriData.MstrAdres || null,            // @9 - CariAdres
      ];

      console.log('Cari SQL Query:', query);
      console.log('Cari Parameters:', parameters);

      await this.cariRepository.query(query, parameters);
      console.log('Cari kaydı başarıyla oluşturuldu');
    } catch (error) {
      console.error('Cari kaydı oluşturulurken hata:', error);
      throw new Error('Cari kaydı oluşturulamadı');
    }
  }

  async getOdaTipleri(): Promise<string[]> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `SELECT DISTINCT OdYatOdaTip FROM ${tables.odaYatak} WHERE OdYatOdaTip IS NOT NULL AND OdYatOdaTip != '' ORDER BY OdYatOdaTip`;
      const result: { OdYatOdaTip: string }[] = await this.odaYatakRepository.query(query);
      return result.map(item => item.OdYatOdaTip);
    } catch (error) {
      console.error('Oda tipleri alınırken hata:', error);
      return [];
    }
  }

  // Sadece boş odaların bulunduğu oda tiplerini getir (gerçek zamanlı boş oda sayısı ile)
  async getBosOdaTipleri(): Promise<{odaTipi: string, bosOdaSayisi: number}[]> {
    try {
      const tables = this.dbConfig.getTables();
      const views = this.dbConfig.getViews();
      
      // Bugünün tarihini al
      const bugun = new Date();
      const bugunStr = this.formatDateForComparison(bugun);
      
      // 🔥 OPTİMİZE EDİLMİŞ CTE SORGUSU: Daha verimli bakiye hesaplama
      const query = `
        WITH ToplamYataklar AS (
          -- Her oda tipi için toplam yatak sayısı (BOŞ + DOLU)
          SELECT 
            OdYatOdaTip,
            COUNT(*) as ToplamYatak
          FROM ${tables.odaYatak} 
          WHERE OdYatOdaTip IS NOT NULL 
            AND OdYatOdaTip != '' 
            AND OdYatDurum IN ('BOŞ', 'DOLU')
          GROUP BY OdYatOdaTip
        ),
        AktifKonaklamalar AS (
          -- Bugün aktif olan konaklamalar - ROW_NUMBER ile optimize edilmiş
          SELECT 
            v.KnklmOdaTip,
            COUNT(*) as DoluYatak
          FROM ${views.musteriKonaklama} v
          WHERE v.MstrDurum = 'KALIYOR' 
            AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
            AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
            AND v.KnklmPlnTrh IS NOT NULL
            AND v.KnklmPlnTrh <> ''
            AND v.KnklmGrsTrh IS NOT NULL
            AND v.KnklmGrsTrh <> ''
            AND CONVERT(Date, v.KnklmGrsTrh, 104) <= '${bugunStr}'
            AND CONVERT(Date, v.KnklmPlnTrh, 104) >= '${bugunStr}'
            AND v.knklmNo = (
              SELECT MAX(v2.knklmNo) 
              FROM ${views.musteriKonaklama} v2 
              WHERE v2.MstrTCN = v.MstrTCN
                AND v2.MstrDurum = 'KALIYOR'
                AND LEFT(v2.MstrAdi, 9) <> 'PERSONEL '
            )
          GROUP BY v.KnklmOdaTip
        ),
        BosOdaHesaplama AS (
          -- Boş oda hesaplama - tek seferde tüm hesaplamalar
          SELECT 
            t.OdYatOdaTip as OdaTipi,
            ISNULL(t.ToplamYatak, 0) as ToplamYatak,
            ISNULL(a.DoluYatak, 0) as DoluYatak,
            ISNULL(t.ToplamYatak, 0) - ISNULL(a.DoluYatak, 0) as BosOdaSayisi
          FROM ToplamYataklar t
          LEFT JOIN AktifKonaklamalar a ON t.OdYatOdaTip = a.KnklmOdaTip
        )
        SELECT 
          OdaTipi,
          BosOdaSayisi
        FROM BosOdaHesaplama
        WHERE BosOdaSayisi > 0
        ORDER BY OdaTipi
      `;
      
      const result: { OdaTipi: string; BosOdaSayisi: number }[] = await this.odaYatakRepository.query(query);
      return result.map(item => ({
        odaTipi: item.OdaTipi,
        bosOdaSayisi: Number(item.BosOdaSayisi)
      }));
    } catch (error) {
      console.error('Boş oda tipleri alınırken hata:', error);
      return [];
    }
  }

  // Tarih formatını SQL karşılaştırması için uygun hale getir
  private formatDateForComparison(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async getBosOdalar(odaTipi: string): Promise<{ value: string; label: string }[]> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `
        SELECT OdYatOdaNo, OdYatYtkNo, OdYatDurum 
        FROM ${tables.odaYatak} 
        WHERE OdYatOdaTip = @0 AND OdYatDurum <> 'DOLU'
        ORDER BY OdYatOdaNo, OdYatYtkNo
      `;
      const result: { OdYatOdaNo: string; OdYatYtkNo: string; OdYatDurum?: string }[] = await this.odaYatakRepository.query(query, [odaTipi]);
      // Combobox için sade label; ek olarak mevcut-rezerve tooltip'inde kullanmak üzere durum alanını da döndür
      return result.map(item => ({
        value: `${item.OdYatOdaNo}-${item.OdYatYtkNo}`,
        label: `${item.OdYatOdaNo} - ${item.OdYatYtkNo}`,
        durum: item.OdYatDurum ?? ''
      }));
    } catch (error) {
      console.error('Boş odalar alınırken hata:', error);
      return [];
    }
  }

  async checkOdaYatakMusaitlik(odaYatakStr: string | { label?: string; value?: string }): Promise<{ musait: boolean, message: string }> {
    try {
      console.log('=== checkOdaYatakMusaitlik called ===');
      console.log('odaYatakStr:', odaYatakStr);
      
      const { odaNo, yatakNo } = this.parseOdaYatak(odaYatakStr);
      console.log('Parse edilen oda-yatak:', { odaNo, yatakNo });
      
      const tables = this.dbConfig.getTables();
      const query = `
        SELECT OdYatDurum, OdYatKllnc, oKytTarihi
        FROM ${tables.odaYatak} 
        WHERE OdYatOdaNo = @0 AND OdYatYtkNo = @1
      `;
      
      const result: { OdYatDurum: string; OdYatKllnc?: string; oKytTarihi?: string }[] = await this.odaYatakRepository.query(query, [odaNo, yatakNo]);
      console.log('Oda-yatak durum sorgusu sonucu:', result);
      
      if (result.length === 0) {
        return {
          musait: false,
          message: `Oda ${odaNo} - Yatak ${yatakNo} bulunamadı!`
        };
      }
      
      const odaYatakDurum = result[0];
      
      if (odaYatakDurum.OdYatDurum === 'BOŞ') {
        return {
          musait: true,
          message: 'Oda-yatak müsait'
        };
      } else {
        const dolulukBilgisi = odaYatakDurum.OdYatKllnc ? 
          ` (${odaYatakDurum.OdYatKllnc} tarafından ${odaYatakDurum.oKytTarihi} tarihinde doldurulmuş)` : '';
        
        return {
          musait: false,
          message: `Oda ${odaNo} - Yatak ${yatakNo} artık dolu!${dolulukBilgisi} Lütfen başka bir oda-yatak seçin.`
        };
      }
    } catch (error) {
      console.error('Oda-yatak müsaitlik kontrolü hatası:', error);
      return {
        musait: false,
        message: 'Oda-yatak durumu kontrol edilemedi!'
      };
    }
  }

  // Oda tip fiyatlarını getir
  async getOdaTipFiyatlari(odaTipi: string): Promise<any> {
    try {
      console.log('=== getOdaTipFiyatlari çağrıldı ===')
      console.log('Aranan oda tipi:', odaTipi)
      
      // Raw SQL ile direkt sorgula
      const tables = this.dbConfig.getTables();
      const query = `SELECT * FROM ${tables.odaTipLfyt} WHERE OdTipAdi = @0`
      const result: any[] = await this.musteriRepository.query(query, [odaTipi])
      console.log('Raw SQL sonucu:', result)
      
      return result[0] || null
    } catch (error) {
      console.error('Oda tip fiyatları getirilemedi:', error)
      return null
    }
  }

  // Mevcut konaklama kaydını sonlandır (dönem yenileme için)
  async sonlandirKonaklama(tcNo: string, eskiPlnTrh: string): Promise<void> {
    try {
      console.log('=== sonlandirKonaklama çağrıldı ===');
      console.log('TC Kimlik:', tcNo);
      console.log('Eski planlanan tarih:', eskiPlnTrh);
      
      // Önce TC kimlik numarasından müşteri numarasını al
      const musteriData = await this.getMusteriBilgiByTCN(tcNo) as { MstrNo?: number } | null;
      if (!musteriData || !musteriData.MstrNo) {
        throw new Error('Müşteri bulunamadı');
      }
      
      const musteriNo = musteriData.MstrNo;
      console.log('Müşteri numarası:', musteriNo);
      
      const tables = this.dbConfig.getTables();
      
      // Mevcut konaklama kaydının KnklmCksTrh'ni KnklmPlnTrh ile güncelle
      const query = `
        UPDATE ${tables.konaklama} 
        SET KnklmCksTrh = KnklmPlnTrh
        WHERE KnklmMstrNo = @0 
          AND (KnklmCksTrh = '' OR KnklmCksTrh IS NULL)
          AND KnklmPlnTrh = @1
      `;
      
      await this.musteriRepository.query(query, [musteriNo, eskiPlnTrh]);
      console.log('Konaklama sonlandırma sorgusu tamamlandı - KnklmCksTrh = KnklmPlnTrh');
      
    } catch (error) {
      console.error('Konaklama sonlandırma hatası:', error);
      throw new Error('Konaklama kaydı sonlandırılamadı');
    }
  }

  // Oda değişimi durumunda eski oda-yatak'ı boşalt (dönem yenileme için)
  async bosaltOdaYatak(odaYatakStr: string | { label?: string; value?: string }, username?: string): Promise<void> {
    try {
      console.log('=== bosaltOdaYatak çağrıldı ===');
      console.log('Boşaltılacak oda-yatak:', odaYatakStr);
      
      const { odaNo, yatakNo } = this.parseOdaYatak(odaYatakStr);
      console.log('Parse edilen oda-yatak:', { odaNo, yatakNo });
      
      // İşlem tarihi ve kullanıcı bilgisi
      const bugunTarihi = this.formatDate(new Date()); // DD.MM.YYYY formatında
      const kullaniciAdi = username || 'admin'; // Fallback kullanıcı adı - gerçek kullanımda sisteme giriş yapan kullanıcının adı olacak
      
      console.log('Boşaltma işlemi bilgileri:', {
        tarih: bugunTarihi,
        kullanici: kullaniciAdi
      });
      
      const tables = this.dbConfig.getTables();
      const query = `
        UPDATE ${tables.odaYatak} 
        SET OdYatDurum = 'BOŞ', 
            OdYatKllnc = @2, 
            oKytTarihi = @3
        WHERE OdYatOdaNo = @0 AND OdYatYtkNo = @1
      `;
      
      await this.odaYatakRepository.query(query, [odaNo, yatakNo, kullaniciAdi, bugunTarihi]);
      console.log(`Oda ${odaNo}-${yatakNo} başarıyla boşaltıldı (${bugunTarihi} - ${kullaniciAdi})`);
      
    } catch (error) {
      console.error('Oda-yatak boşaltma hatası:', error);
      const odaYatakStrFormatted = typeof odaYatakStr === 'object' ? 
        (odaYatakStr.label || odaYatakStr.value || JSON.stringify(odaYatakStr)) : 
        String(odaYatakStr);
      throw new Error(`Oda-yatak boşaltılamadı: ${odaYatakStrFormatted}`);
    }
  }

  // Dönem yenileme için özel konaklama kaydı (giriş tarihi = önceki kaydın çıkış tarihi)
  async kaydetDonemYenilemeKonaklama(konaklamaData: { 
    OdaYatak: string | { label?: string; value?: string };
    KonaklamaSuresi: number;
    KonaklamaTipi: string;
    HesaplananBedel: number;
    ToplamBedel: number;
    MstrKllnc: string;
    KnklmOdaTip: string;
    eskiKnklmPlnTrh: string; // Önceki kaydın planlanan tarihi (yeni kaydın giriş tarihi olacak)
    planlananCikisTarihi?: string; // Frontend'den gelen planlanan çıkış tarihi
    OdemeTakvimGunu?: number | null; // 🔥 Ö.T.G. alanı eklendi
    ekNotlar?: string;
    KnklmNot?: string; // Ek notlar alanı eklendi
    ekBilgiler?: {
      kahvaltiDahil?: boolean;
      havluVerildi?: boolean;
      prizVerildi?: boolean;
      geceKonaklama?: boolean;
    };
  }, musteriNo: number): Promise<any> {
    try {
      console.log('=== kaydetDonemYenilemeKonaklama called ===');
      console.log('konaklamaData:', konaklamaData);
      console.log('konaklamaData.ekBilgiler:', konaklamaData.ekBilgiler);
      console.log('musteriNo:', musteriNo);
      
      const { odaNo, yatakNo } = this.parseOdaYatak(konaklamaData.OdaYatak);
      
      // Giriş tarihi = önceki kaydın planlanan tarihi (eskiKnklmPlnTrh)
      const girisTarihi = konaklamaData.eskiKnklmPlnTrh;
      
      // Çıkış tarihi hesaplaması - Geç Saat Konaklama kontrolü ile
      let planlananCikis: string;
      
      // Geç Saat Konaklama seçilmişse, planlanan çıkış tarihi giriş tarihi olur
      if (konaklamaData.ekBilgiler?.geceKonaklama) {
        console.log('🌙 Dönem yenilemede Geç Saat Konaklama seçili - Planlanan çıkış tarihi giriş tarihi olarak ayarlanıyor');
        planlananCikis = girisTarihi; // Aynı gün çıkış
      } else {
        // Normal dönem yenileme - giriş tarihi + konaklama süresi
        const girisTarihiDate = this.parseDate(girisTarihi); // DD.MM.YYYY formatından Date objesine
        const cikisTarihi = new Date(girisTarihiDate);
        cikisTarihi.setDate(cikisTarihi.getDate() + konaklamaData.KonaklamaSuresi);
        planlananCikis = this.formatDate(cikisTarihi);
      }
      
      console.log('📅 Dönem yenileme tarih hesaplamaları:', {
        eskiPlnTrh: konaklamaData.eskiKnklmPlnTrh,
        yeniGirisTarihi: girisTarihi,
        konaklamaSuresi: konaklamaData.KonaklamaSuresi,
        geceKonaklama: konaklamaData.ekBilgiler?.geceKonaklama || false,
        yeniPlanlananCikis: planlananCikis
      });
      
      // Konaklama tipini parse et (örn: "2 HAFTALIK" -> "HAFTALIK")
      const konaklamaTipi = this.parseKonaklamaTipi(konaklamaData.KonaklamaTipi);
      
      // İskonto hesapla (yüzde olarak)
      let iskonto = 0;
      if (konaklamaData.HesaplananBedel > 0) {
        iskonto = ((konaklamaData.HesaplananBedel - konaklamaData.ToplamBedel) / konaklamaData.HesaplananBedel) * 100;
        iskonto = Math.round(iskonto * 100) / 100; // 2 ondalık basamak
      }
      
      // Blok ve kat bilgisi
      const ilkDigit = parseInt(odaNo.charAt(0));
      const blok = ilkDigit < 6 ? 'A' : 'B';
      const kat = ilkDigit.toString();
      
      // Ödeme takip günü - frontend'den gelen değer varsa onu kullan, yoksa boş bırak
      const odmTkvGun = konaklamaData.OdemeTakvimGunu ? konaklamaData.OdemeTakvimGunu.toString() : '';
      
      // SecOdYat oluştur
      const secOdYat = this.generateSecOdYat(odaNo, yatakNo);
      
      // Not bilgisi - frontend'den gelen KnklmNot kullan (stored procedure zaten zaman damgası ekliyor)
      const notlarZamanli = konaklamaData.KnklmNot || konaklamaData.ekNotlar || '';
     
      const storedProcedures = this.dbConfig.getStoredProcedures();
      const query = `EXEC ${storedProcedures.konaklamaEkle} 
        @KnklmKllnc = @0, @KnklmMstrNo = @1, @KnklmSube = @2, @KnklmBlok = @3, @KnklmKat = @4,
        @KnklmOdaTip = @5, @KnklmOdaNo = @6, @KnklmYtkNo = @7, @KnklmTip = @8, @KnklmLfyt = @9,
        @Knklmisk = @10, @KnklmNfyt = @11, @KnklmOdmTkvGun = @12, @KnklmGrsTrh = @13, @KnklmPlnTrh = @14,
        @KnklmCksTrh = @15, @KnklmKrLst = @16, @KnklmNot = @17, @SecOdYat = @18`;
      
      await this.musteriRepository.query(query, [
        konaklamaData.MstrKllnc,  // @0 - KnklmKllnc (kullanıcı adı)
        musteriNo,                // @1
        'MERKEZ',                 // @2
        blok + '-BLOK',           // @3
        kat + '. KAT',            // @4
        konaklamaData.KnklmOdaTip, // @5 - Oda tipi
        odaNo,                    // @6
        yatakNo,                  // @7
        konaklamaTipi,            // @8
        konaklamaData.HesaplananBedel, // @9
        iskonto,                  // @10
        konaklamaData.ToplamBedel, // @11
        odmTkvGun,                // @12
        girisTarihi,              // @13 - Yeni giriş tarihi (önceki kaydın planlanan tarihi)
        planlananCikis,           // @14 - Geç Saat Konaklama kontrolü ile hesaplanmış
        null,                     // @15 - KnklmCksTrh
        null,                     // @16 - KnklmKrLst
        notlarZamanli,            // @17
        secOdYat                  // @18
      ]);
      
      console.log('Dönem yenileme konaklama kaydı başarıyla oluşturuldu');
      return { success: true };
    } catch (error) {
      console.error('Dönem yenileme konaklama kaydı hatası:', error);
      throw new Error('Dönem yenileme konaklama kaydı yapılamadı');
    }
  }

  // DD.MM.YYYY formatındaki string'i Date objesine çevir
  private parseDate(dateString: string): Date {
    const parts = dateString.split('.');
    if (parts.length !== 3) {
      throw new Error(`Geçersiz tarih formatı: ${dateString}`);
    }
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
    const year = parseInt(parts[2], 10);
    
    return new Date(year, month, day);
  }

  // Planlanan çıkış tarihini hesapla (30 gün için özel mantık)
  private hesaplaPlanlananCikisTarihi(baslangicTarihi: Date, konaklamaSuresi: number): Date {
    if (konaklamaSuresi === 30) {
      // 30 gün için: gün aynı, ay +1
      const gun = baslangicTarihi.getDate();
      let ay = baslangicTarihi.getMonth() + 1;
      let yil = baslangicTarihi.getFullYear();
      
      ay += 1;
      if (ay > 12) {
        ay = 1;
        yil += 1;
      }
      return new Date(yil, ay - 1, gun);
    } else {
      // Diğerleri için klasik ekleme
      const cikis = new Date(baslangicTarihi);
      cikis.setDate(cikis.getDate() + konaklamaSuresi);
      return cikis;
    }
  }

  // Konaklama tipini parse eden fonksiyon
  private parseKonaklamaTipi(konaklamaTipi: string): string {
    if (!konaklamaTipi) return 'GÜNLÜK';
    
    const tip = konaklamaTipi.toUpperCase().trim();
    
    // "1 HAFTALIK", "2 HAFTALIK", "3 HAFTALIK" gibi ifadeleri "HAFTALIK" olarak parse et
    if (tip.includes('HAFTALIK')) {
      return 'HAFTALIK';
    }
    
    // "AYLIK" kontrolü
    if (tip.includes('AYLIK')) {
      return 'AYLIK';
    }
    
    // "GÜNLÜK" kontrolü
    if (tip.includes('GÜNLÜK')) {
      return 'GÜNLÜK';
    }
    
    // Varsayılan olarak GÜNLÜK döndür
    return 'GÜNLÜK';
  }

  // Dönem yenileme için özel işlem kaydı
  async kaydetDonemYenilemeIslem(islemData: {
    OdaYatak: string | { label?: string; value?: string };
    KonaklamaSuresi: number;
    KonaklamaTipi: string;
    MstrHspTip: string;
    MstrKllnc: string;
    MstrAdi: string;
    ToplamBedel: number;
    planlananCikisTarihi?: string; // Frontend'den gelen planlanan çıkış tarihi
    eskiKnklmPlnTrh: string; // Önceki kaydın planlanan tarihi (yeni kaydın giriş tarihi)
  }, musteriNo: number): Promise<any> {
    try {
      console.log('=== kaydetDonemYenilemeIslem called ===');
      console.log('islemData:', islemData);
      
      const { odaNo, yatakNo } = this.parseOdaYatak(islemData.OdaYatak);
      
      // Giriş tarihi = önceki kaydın planlanan tarihi
      const girisTarihi = islemData.eskiKnklmPlnTrh;
      
      // Çıkış tarihi = giriş tarihi + konaklama süresi (yeni hesaplama fonksiyonu ile)
      const girisTarihiDate = this.parseDate(girisTarihi);
      const cikisTarihi = this.hesaplaPlanlananCikisTarihi(girisTarihiDate, islemData.KonaklamaSuresi);
      const planlananCikis = this.formatDate(cikisTarihi);
      
      // Cari kod oluştur
      const cariKod = islemData.MstrHspTip === 'Kurumsal' ? `MK${musteriNo}` : `MB${musteriNo}`;
      
      // Konaklama tipini parse et
      const konaklamaTipi = this.parseKonaklamaTipi(islemData.KonaklamaTipi);
      
      // Blok ve kat bilgisi
      const ilkDigit = parseInt(odaNo.charAt(0));
      const blok = ilkDigit < 6 ? 'A' : 'B';
      const kat = ilkDigit.toString();
      
      // İşlem bilgisi oluştur - dönem yenileme özel mesajı
      const islemBilgi = `${girisTarihi} - ${planlananCikis} DÖNEM YENİLEME KONAKLAMA`;
      
      const storedProcedures = this.dbConfig.getStoredProcedures();
      const query = `EXEC ${storedProcedures.islemEkle} 
        @iKytTarihi = @0, @islemKllnc = @1, @islemCrKod = @2, @islemOzel1 = @3, @islemOzel2 = @4,
        @islemOzel3 = @5, @islemOzel4 = @6, @islemArac = @7, @islemTip = @8, @islemGrup = @9,
        @islemAltG = @10, @islemBilgi = @11, @islemMiktar = @12, @islemBirim = @13, @islemTutar = @14,
        @islemDoviz = @15, @islemKur = @16`;
      
      const parameters = [
        this.getCurrentTransactionDate(), // @0 - iKytTarihi: Her zaman işlemin yapıldığı günün tarihi
        islemData.MstrKllnc || 'admin', // @1 - Kullanıcı adı (varsayılan: admin)
        cariKod,                       // @2
        konaklamaTipi,                 // @3
        `${blok}-BLOK - ${kat}. KAT`,  // @4
        `${odaNo} - ${yatakNo}`,       // @5
        '',                            // @6 - islemOzel4 boş
        'Cari İşlem',                  // @7
        'GELİR',                       // @8
        'Konaklama',                   // @9
        islemData.MstrAdi,             // @10
        islemBilgi,                    // @11
        1.00,                          // @12
        'ADET',                        // @13
        islemData.ToplamBedel,         // @14
        'TL',                          // @15
        1.00                           // @16
      ];
     
      await this.musteriRepository.query(query, parameters);
      
      console.log('Dönem yenileme işlem kaydı başarıyla oluşturuldu');
      return { success: true };
    } catch (error) {
      console.error('=== DÖNEM YENİLEME İŞLEM KAYDI HATA ===');
      console.error('Error type:', typeof error);
      const errorObj = error as { message?: string; code?: string };
      console.error('Error message:', errorObj.message || 'Bilinmeyen hata');
      console.error('Error code:', errorObj.code);
      console.error('Error details:', error);
      
      if (errorObj.message?.includes('spr_islemEkleYn') || errorObj.message?.includes('islemEkle')) {
        throw new Error(`Stored procedure hatası: ${errorObj.message}`);
      }
      
      throw new Error(`Dönem yenileme işlem kaydı yapılamadı: ${errorObj.message || 'Bilinmeyen hata'}`);
    }
  }

  // Müşteri çıkış işlemi
  async musteriCikisYap(cikisData: { tcNo: string; plnTrh: string; odaYatak: any; knklmKrLst?: string; knklmNot?: string }): Promise<void> {
    try {
      console.log('=== musteriCikisYap çağrıldı ===');
      console.log('Çıkış verisi:', cikisData);
      
      // 🔥 1. KARA LİSTE BİLGİLERİNİ GÜNCELLE (konaklama sonlandırmadan ÖNCE!)
      if (cikisData.knklmKrLst && cikisData.knklmNot) {
        await this.updateKaraListeBilgileri(cikisData.tcNo, cikisData.plnTrh, cikisData.knklmKrLst, cikisData.knklmNot);
      }
      
      // 2. Mevcut konaklama kaydını sonlandır (Çıkış tarihini ayarla)
      // Bu fonksiyon zaten MstrNo'yu TC'den buluyor.
      await this.sonlandirKonaklama(cikisData.tcNo, cikisData.plnTrh);
      
      // 3. Oda-yatak kaydını 'BOŞ' olarak güncelle
      await this.bosaltOdaYatak(cikisData.odaYatak as string | { label?: string; value?: string });

      // 4. Müşteri durumunu 'AYRILDI' yap
      const tables = this.dbConfig.getTables();
      const query = `UPDATE ${tables.musteri} SET MstrDurum = 'AYRILDI' WHERE MstrTCN = @0`;
      await this.musteriRepository.query(query, [cikisData.tcNo]);
      
      console.log(`Müşteri ${cikisData.tcNo} çıkış işlemi tamamlandı. Durum 'AYRILDI' olarak güncellendi.`);
    } catch (error) {
      console.error('Müşteri çıkış işlemi sırasında hata:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
      throw new Error(`Müşteri çıkış işlemi yapılamadı: ${errorMessage}`);
    }
  }

  // 🔥 KARA LİSTE BİLGİLERİNİ GÜNCELLEME FONKSİYONU
  private async updateKaraListeBilgileri(tcNo: string, plnTrh: string, knklmKrLst: string, knklmNot: string): Promise<void> {
    try {
      console.log('=== Kara liste bilgileri güncelleniyor ===');
      console.log('TC:', tcNo, 'PlnTrh:', plnTrh, 'KrLst:', knklmKrLst, 'Not uzunluğu:', knklmNot.length);
      
      // Önce TC kimlik numarasından müşteri numarasını al
      const musteriData = await this.getMusteriBilgiByTCN(tcNo) as { MstrNo?: number } | null;
      if (!musteriData || !musteriData.MstrNo) {
        throw new Error('Müşteri bulunamadı');
      }
      
      const musteriNo = musteriData.MstrNo;
      console.log('Müşteri numarası:', musteriNo);
      
      const tables = this.dbConfig.getTables();
      const query = `
        UPDATE ${tables.konaklama} 
        SET KnklmKrLst = @0, KnklmNot = @1 
        WHERE KnklmMstrNo = @2 AND KnklmPlnTrh = @3 AND KnklmCksTrh IS NULL
      `;
      
      const result: unknown = await this.musteriRepository.query(query, [knklmKrLst, knklmNot, musteriNo, plnTrh]);
      
      console.log('Kara liste güncelleme sonucu:', result);
      console.log('✅ Kara liste bilgileri başarıyla güncellendi');
    } catch (error) {
      console.error('❌ Kara liste güncellemesi sırasında hata:', error);
      throw new Error(`Kara liste bilgileri güncellenemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  // 🔥 DİREKT ODA DEĞİŞİKLİĞİ İÇİN YENİ FONKSİYONLAR
  
  /**
   * tblKonaklama tablosunda direkt oda değişikliği update işlemi (Transaction-Safe)
   */
  async updateKonaklamaOdaDegisikligiWithTransaction(
    queryRunner: QueryRunner,
    tcNo: string, 
    yeniOdaTip: string, 
    yeniOdaNo: string, 
    yeniYatakNo: string, 
    konaklamaNot: string,
    toplamKonaklamaBedeli: number, // Modal formundaki "Toplam Konaklama Bedeli" değeri
    KnklmKllnc: string // kullanıcı adı parametresi eklendi
  ): Promise<void> {
    try {
      console.log('=== updateKonaklamaOdaDegisikligiWithTransaction başlatıldı ===');
      console.log('Parametreler:', { tcNo, yeniOdaTip, yeniOdaNo, yeniYatakNo, konaklamaNot, toplamKonaklamaBedeli });
      console.log('Konaklama Not (string):', typeof konaklamaNot, konaklamaNot);
      console.log('Toplam Konaklama Bedeli (number):', typeof toplamKonaklamaBedeli, toplamKonaklamaBedeli);
      
      const schemaName = this.dbConfig.getTableSchema();
      
      // Önce TC'den müşteri numarasını al
      const musteriData = await this.getMusteriBilgiByTCN(tcNo) as { MstrNo?: number } | null;
      if (!musteriData || !musteriData.MstrNo) {
        throw new Error('Müşteri bulunamadı');
      }
      const musteriNo = musteriData.MstrNo;
      console.log('Müşteri numarası:', musteriNo);
      
      // Oda tip fiyatlarını al
      const fiyatQuery = `
        SELECT OdLfytGun 
        FROM ${schemaName}.tblOdaTipLfyt 
        WHERE OdTipAdi = @0
      `;
      const fiyatResult: { OdLfytGun: number }[] = await this.transactionService.executeQuery(
        queryRunner, fiyatQuery, [yeniOdaTip]
      ) as { OdLfytGun: number }[];
      
      let odaLfyt = 0;
      if (fiyatResult && fiyatResult.length > 0) {
        odaLfyt = Number(fiyatResult[0].OdLfytGun) || 0;
      }
      
      // Mevcut konaklama kaydından iskonto bilgisini al
      const eskiKonaklamaQuery = `
        SELECT Knklmisk, KnklmLfyt 
        FROM ${schemaName}.tblKonaklama 
        WHERE KnklmMstrNo = @0 AND KnklmCksTrh IS NULL
      `;
      const eskiKonaklamaResult: { Knklmisk: number; KnklmLfyt: number }[] = await this.transactionService.executeQuery(
        queryRunner, eskiKonaklamaQuery, [musteriNo]
      ) as { Knklmisk: number; KnklmLfyt: number }[];
      
      // İskonto hesaplama - mevcut iskonto oranını koruyarak yeni fiyat üzerinden hesapla
      let iskonto = 0;
      if (eskiKonaklamaResult && eskiKonaklamaResult.length > 0) {
        const mevcutIskonto = Number(eskiKonaklamaResult[0].Knklmisk) || 0;
        const eskiListeFiyat = Number(eskiKonaklamaResult[0].KnklmLfyt) || 0;
        
        // Eğer mevcut iskonto varsa, aynı oranı yeni fiyata uygula
        if (mevcutIskonto > 0 && eskiListeFiyat > 0) {
          iskonto = mevcutIskonto; // Aynı iskonto oranını koru
        } else {
          // Yeni iskonto hesaplama
          if (odaLfyt > 0 && toplamKonaklamaBedeli < odaLfyt) {
            iskonto = ((odaLfyt - toplamKonaklamaBedeli) / odaLfyt) * 100;
            iskonto = Math.round(iskonto * 100) / 100; // 2 ondalık basamak
          }
        }
      }
      
      console.log('İskonto hesaplama detayları:', {
        eskiIskonto: eskiKonaklamaResult?.[0]?.Knklmisk || 0,
        yeniListeFiyat: odaLfyt,
        yeniNfyt: toplamKonaklamaBedeli,
        hesaplananIskonto: iskonto
      });
      
      // tblKonaklama güncelleme - knklmisk alanı da dahil
      const updateQuery = `
        UPDATE ${schemaName}.tblKonaklama 
        SET 
          KnklmKllnc = @0,
          KnklmOdaTip = @1,
          KnklmOdaNo = @2,
          KnklmYtkNo = @3,
          KnklmLfyt = @4,
          Knklmisk = @5,
          KnklmNfyt = @6,
          KnklmNot = @7
        WHERE KnklmMstrNo = @8
          AND KnklmCksTrh IS NULL
      `;
      
      const updateParams = [
        KnklmKllnc, // KnklmKllnc (artık dinamik, zorunlu)
        yeniOdaTip, // KnklmOdaTip
        yeniOdaNo, // KnklmOdaNo
        yeniYatakNo, // KnklmYtkNo
        odaLfyt, // KnklmLfyt
        iskonto, // Knklmisk - İskonto alanı eklendi
        toplamKonaklamaBedeli, // KnklmNfyt
        konaklamaNot, // KnklmNot
        musteriNo // KnklmMstrNo
      ];
      
      await this.transactionService.executeQuery(queryRunner, updateQuery, updateParams);
      
      console.log('=== tblKonaklama güncelleme tamamlandı (Transaction-Safe) ===');
      console.log('Güncellenen alanlar:', {
        KnklmKllnc: KnklmKllnc,
        KnklmOdaTip: yeniOdaTip,
        KnklmOdaNo: yeniOdaNo,
        KnklmYtkNo: yeniYatakNo,
        KnklmLfyt: odaLfyt,
        Knklmisk: iskonto,
        KnklmNfyt: toplamKonaklamaBedeli,
        KnklmNot: konaklamaNot
      });
    } catch (error) {
      console.error('updateKonaklamaOdaDegisikligiWithTransaction hatası:', error);
      throw new Error(`Konaklama kaydı güncellenirken hata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * tblOdaYatak tablosunda eski oda BOŞ, yeni oda DOLU yapma (Transaction-Safe)
   */
  async updateOdaYatakDurumlariWithTransaction(
    queryRunner: QueryRunner,
    eskiOdaNo: string,
    eskiYatakNo: string,
    yeniOdaNo: string,
    yeniYatakNo: string
  ): Promise<void> {
    try {
      console.log('=== updateOdaYatakDurumlariWithTransaction başlatıldı ===');
      console.log({ eskiOdaNo, eskiYatakNo, yeniOdaNo, yeniYatakNo });
      
      const schemaName = this.dbConfig.getTableSchema();
      
      // 1. Eski odayı BOŞ yap
      const eskiOdaQuery = `
        UPDATE ${schemaName}.tblOdaYatak 
        SET odYatDurum = 'BOŞ'
        WHERE odYatOdaNo = @0 AND odYatYtkNo = @1
      `;
      
      await this.transactionService.executeQuery(queryRunner, eskiOdaQuery, [eskiOdaNo, eskiYatakNo]);
      console.log(`Eski oda ${eskiOdaNo}-${eskiYatakNo} BOŞ yapıldı (Transaction-Safe)`);
      
      // 2. Yeni odayı DOLU yap
      const yeniOdaQuery = `
        UPDATE ${schemaName}.tblOdaYatak 
        SET odYatDurum = 'DOLU'
        WHERE odYatOdaNo = @0 AND odYatYtkNo = @1
      `;
      
      await this.transactionService.executeQuery(queryRunner, yeniOdaQuery, [yeniOdaNo, yeniYatakNo]);
      console.log(`Yeni oda ${yeniOdaNo}-${yeniYatakNo} DOLU yapıldı (Transaction-Safe)`);
      
      console.log('=== OdaYatak durumları güncelleme tamamlandı (Transaction-Safe) ===');
    } catch (error) {
      console.error('updateOdaYatakDurumlariWithTransaction hatası:', error);
      throw new Error(`Oda-yatak durumları güncellenirken hata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * tblIslem tablosuna oda değişikliği işlem kaydı ekleme (Transaction-Safe)
   */
  async kaydetOdaDegisikligiIslemWithTransaction(
    queryRunner: QueryRunner,
    islemData: {
      musteriNo: number;
      islemTip: string; // 'GELİR' veya 'GİDER'
      islemTutar: number;
      islemBilgi: string;
      yeniOdaYatak: { value: string; label: string };
      MstrAdi: string; // Müşteri adı
      MstrKllnc?: string; // Kullanıcı adı (opsiyonel, dinamik)
      MstrHspTip: string;
      konaklamaTipi: string; // Konaklama tipi
      OdemeVadesi?: string; // 🔥 Ödeme vadesi bilgisi eklendi
    }
  ): Promise<void> {
    try {
      console.log('=== kaydetOdaDegisikligiIslemWithTransaction başlatıldı ===');
      console.log('islemData:', islemData);
      
      const { odaNo, yatakNo } = this.parseOdaYatak(islemData.yeniOdaYatak);
      
      const currentDate = new Date();
      const formattedDate = this.formatDate(currentDate);
      
      // Cari kod oluştur
      const cariKod = islemData.MstrHspTip === 'Kurumsal' ? `MK${islemData.musteriNo}` : `MB${islemData.musteriNo}`;
      
      // Blok ve kat bilgisi
      const ilkDigit = parseInt(odaNo.charAt(0));
      const blok = ilkDigit < 6 ? 'A' : 'B';
      const kat = ilkDigit.toString();
      const konaklamaTipi = this.parseKonaklamaTipi(islemData.konaklamaTipi);

      const storedProcedures = this.dbConfig.getStoredProcedures();
      const parameters = [
        this.getCurrentTransactionDate(), // @0 - iKytTarihi: Her zaman işlemin yapıldığı günün tarihi
        islemData.MstrKllnc || 'admin', // @1 - Kullanıcı adı (öncelik dinamik, yoksa fallback)
        cariKod,                       // @2 - Cari kod
        konaklamaTipi,                 // @3 - İşlem özel 1 (konaklama tipi)
        `${blok}-BLOK - ${kat}. KAT`,  // @4 - İşlem özel 2
        `${odaNo} - ${yatakNo}`,       // @5 - İşlem özel 3
        '',                            // @6 - İşlem özel 4 (boş)
        'Cari İşlem',                  // @7 - İşlem aracı
        islemData.islemTip,            // @8 - İşlem tipi ('GELİR' veya 'GİDER')
        'Konaklama',                   // @9 - İşlem grubu
        islemData.MstrAdi,             // @10 - İşlem alt grubu (müşteri adı)
        this.addOdemeVadesiToIslemBilgi(islemData.islemBilgi, islemData.OdemeVadesi), // @11 - İşlem bilgisi (ödeme vadesi ile)
        1.00,                          // @12 - İşlem miktarı
        'ADET',                        // @13 - İşlem birimi
        islemData.islemTutar,          // @14 - İşlem tutarı
        'TL',                          // @15 - İşlem dövizi
        1.00                           // @16 - İşlem kuru
      ];
      
      await this.transactionService.executeStoredProcedure(
        queryRunner, 
        storedProcedures.islemEkle, 
        parameters
      );
      
      console.log('=== Oda değişikliği işlem kaydı ekleme tamamlandı (Transaction-Safe) ===');
    } catch (error) {
      console.error('kaydetOdaDegisikligiIslemWithTransaction hatası:', error);
      throw new Error(`İşlem kaydı eklenirken hata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * tblKonaklama tablosunda direkt oda değişikliği update işlemi (Eski Versiyon - Backward Compatibility)
   */
  async updateKonaklamaOdaDegisikligi(
    tcNo: string, 
    yeniOdaTip: string, 
    yeniOdaNo: string, 
    yeniYatakNo: string, 
    konaklamaNot: string,
    hesaplananBedel: number,
    username?: string
  ): Promise<void> {
    try {
      console.log('=== updateKonaklamaOdaDegisikligi başlatıldı ===');
      console.log({ tcNo, yeniOdaTip, yeniOdaNo, yeniYatakNo, konaklamaNot, hesaplananBedel });
      
      // Kullanıcı adını belirle
      const kullaniciAdi = username || 'admin';
      
      const schemaName = this.dbConfig.getTableSchema();
      
      // Önce TC'den müşteri numarasını al
      const musteriData = await this.getMusteriBilgiByTCN(tcNo) as { MstrNo?: number } | null;
      if (!musteriData || !musteriData.MstrNo) {
        throw new Error('Müşteri bulunamadı');
      }
      const musteriNo = musteriData.MstrNo;
      console.log('Müşteri numarası:', musteriNo);
      
      // Oda tip fiyatlarını al
      const fiyatQuery = `
        SELECT OdLfytGun 
        FROM ${schemaName}.tblOdaTipLfyt 
        WHERE OdTipAdi = @0
      `;
      const fiyatResult: { OdLfytGun: number }[] = await this.musteriRepository.query(fiyatQuery, [yeniOdaTip]);
      
      let odaLfyt = 0;
      if (fiyatResult && fiyatResult.length > 0) {
        odaLfyt = Number(fiyatResult[0].OdLfytGun) || 0;
      }
      
      // Mevcut konaklama kaydından iskonto bilgisini al
      const eskiKonaklamaQuery = `
        SELECT Knklmisk, KnklmLfyt 
        FROM ${schemaName}.tblKonaklama 
        WHERE KnklmMstrNo = @0 AND KnklmCksTrh IS NULL
      `;
      const eskiKonaklamaResult: { Knklmisk: number; KnklmLfyt: number }[] = await this.musteriRepository.query(eskiKonaklamaQuery, [musteriNo]);
      
      // İskonto hesaplama - mevcut iskonto oranını koruyarak yeni fiyat üzerinden hesapla
      let iskonto = 0;
      if (eskiKonaklamaResult && eskiKonaklamaResult.length > 0) {
        const mevcutIskonto = Number(eskiKonaklamaResult[0].Knklmisk) || 0;
        const eskiListeFiyat = Number(eskiKonaklamaResult[0].KnklmLfyt) || 0;
        
        // Eğer mevcut iskonto varsa, aynı oranı yeni fiyata uygula
        if (mevcutIskonto > 0 && eskiListeFiyat > 0) {
          iskonto = mevcutIskonto; // Aynı iskonto oranını koru
        } else {
          // Yeni iskonto hesaplama
          if (odaLfyt > 0 && hesaplananBedel < odaLfyt) {
            iskonto = ((odaLfyt - hesaplananBedel) / odaLfyt) * 100;
            iskonto = Math.round(iskonto * 100) / 100; // 2 ondalık basamak
          }
        }
      }
      
      // tblKonaklama güncelleme - knklmisk alanı da dahil
      const updateQuery = `
        UPDATE ${schemaName}.tblKonaklama 
        SET 
          KnklmKllnc = @0,
          KnklmOdaTip = @1,
          KnklmOdaNo = @2,
          KnklmYtkNo = @3,
          KnklmLfyt = @4,
          Knklmisk = @5,
          KnklmNfyt = @6,
          KnklmNot = @7
        WHERE KnklmMstrNo = @8
          AND KnklmCksTrh IS NULL
      `;
      
      const updateParams = [
        kullaniciAdi, // KnklmKllnc
        yeniOdaTip, // KnklmOdaTip
        yeniOdaNo, // KnklmOdaNo
        yeniYatakNo, // KnklmYtkNo
        odaLfyt, // KnklmLfyt
        iskonto, // Knklmisk - İskonto alanı eklendi
        hesaplananBedel, // KnklmNfyt
        konaklamaNot, // KnklmNot
        musteriNo // KnklmMstrNo
      ];
      
      await this.musteriRepository.query(updateQuery, updateParams);
      
      console.log('=== tblKonaklama güncelleme tamamlandı ===');
      console.log('Güncellenen alanlar:', {
        KnklmKllnc: kullaniciAdi,
        KnklmOdaTip: yeniOdaTip,
        KnklmOdaNo: yeniOdaNo,
        KnklmYtkNo: yeniYatakNo,
        KnklmLfyt: odaLfyt,
        Knklmisk: iskonto,
        KnklmNfyt: hesaplananBedel,
        KnklmNot: konaklamaNot
      });
    } catch (error) {
      console.error('updateKonaklamaOdaDegisikligi hatası:', error);
      throw new Error(`Konaklama kaydı güncellenirken hata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * tblOdaYatak tablosunda eski oda BOŞ, yeni oda DOLU yapma (Eski Versiyon - Backward Compatibility)
   */
  async updateOdaYatakDurumlari(
    eskiOdaNo: string,
    eskiYatakNo: string,
    yeniOdaNo: string,
    yeniYatakNo: string
  ): Promise<void> {
    try {
      console.log('=== updateOdaYatakDurumlari başlatıldı ===');
      console.log({ eskiOdaNo, eskiYatakNo, yeniOdaNo, yeniYatakNo });
      
      const schemaName = this.dbConfig.getTableSchema();
      
      // 1. Eski odayı BOŞ yap
      const eskiOdaQuery = `
        UPDATE ${schemaName}.tblOdaYatak 
        SET odYatDurum = 'BOŞ'
        WHERE odYatOdaNo = @0 AND odYatYtkNo = @1
      `;
      
      await this.musteriRepository.query(eskiOdaQuery, [eskiOdaNo, eskiYatakNo]);
      console.log(`Eski oda ${eskiOdaNo}-${eskiYatakNo} BOŞ yapıldı`);
      
      // 2. Yeni odayı DOLU yap
      const yeniOdaQuery = `
        UPDATE ${schemaName}.tblOdaYatak 
        SET odYatDurum = 'DOLU'
        WHERE odYatOdaNo = @0 AND odYatYtkNo = @1
      `;
      
      await this.musteriRepository.query(yeniOdaQuery, [yeniOdaNo, yeniYatakNo]);
      console.log(`Yeni oda ${yeniOdaNo}-${yeniYatakNo} DOLU yapıldı`);
      
      console.log('=== OdaYatak durumları güncelleme tamamlandı ===');
    } catch (error) {
      console.error('updateOdaYatakDurumlari hatası:', error);
      throw new Error(`Oda-yatak durumları güncellenirken hata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * tblIslem tablosuna oda değişikliği işlem kaydı ekleme (Eski Versiyon - Backward Compatibility)
   */
  async kaydetOdaDegisikligiIslem(islemData: {
    musteriNo: number;
    islemTip: string; // 'GELİR' veya 'GİDER'
    islemTutar: number;
    islemBilgi: string;
    yeniOdaYatak: { value: string; label: string };
    MstrAdi: string; // Müşteri adı
    MstrKllnc?: string; // Kullanıcı adı (opsiyonel)
    MstrHspTip: string;
    konaklamaTipi?: string; // Konaklama tipi (opsiyonel)
    OdemeVadesi?: string; // 🔥 Ödeme vadesi bilgisi eklendi
  }): Promise<void> {
    try {
      console.log('=== kaydetOdaDegisikligiIslem başlatıldı ===');
      console.log('islemData:', islemData);
      
      const { odaNo, yatakNo } = this.parseOdaYatak(islemData.yeniOdaYatak);
      
      const currentDate = new Date();
      const formattedDate = this.formatDate(currentDate);
      
      // Cari kod oluştur
      const cariKod = islemData.MstrHspTip === 'Kurumsal' ? `MK${islemData.musteriNo}` : `MB${islemData.musteriNo}`;
      
      // Blok ve kat bilgisi
      const ilkDigit = parseInt(odaNo.charAt(0));
      const blok = ilkDigit < 6 ? 'A' : 'B';
      const kat = ilkDigit.toString();
      
      // Konaklama tipini parse et (varsa)
      const konaklamaTipi = islemData.konaklamaTipi ? 
        this.parseKonaklamaTipi(islemData.konaklamaTipi) : 'GÜNLÜK';
      
      const storedProcedures = this.dbConfig.getStoredProcedures();
      const query = `EXEC ${storedProcedures.islemEkle} 
        @iKytTarihi = @0, @islemKllnc = @1, @islemCrKod = @2, @islemOzel1 = @3, @islemOzel2 = @4,
        @islemOzel3 = @5, @islemOzel4 = @6, @islemArac = @7, @islemTip = @8, @islemGrup = @9,
        @islemAltG = @10, @islemBilgi = @11, @islemMiktar = @12, @islemBirim = @13, @islemTutar = @14,
        @islemDoviz = @15, @islemKur = @16`;
      
      const parameters = [
        this.getCurrentTransactionDate(), // @0 - iKytTarihi: Her zaman işlemin yapıldığı günün tarihi
        islemData.MstrKllnc || 'admin', // @1 - Kullanıcı adı
        cariKod,                       // @2 - Cari kod
        konaklamaTipi,                 // @3 - İşlem özel 1 (konaklama tipi) - Dinamik
        `${blok}-BLOK - ${kat}. KAT`,  // @4 - İşlem özel 2
        `${odaNo} - ${yatakNo}`,       // @5 - İşlem özel 3
        '',                            // @6 - İşlem özel 4 (boş)
        'Cari İşlem',                  // @7 - İşlem aracı
        islemData.islemTip,            // @8 - İşlem tipi ('GELİR' veya 'GİDER')
        'Konaklama',                   // @9 - İşlem grubu
        islemData.MstrAdi,             // @10 - İşlem alt grubu (müşteri adı)
        this.addOdemeVadesiToIslemBilgi(islemData.islemBilgi, islemData.OdemeVadesi), // @11 - İşlem bilgisi (ödeme vadesi ile)
        1.00,                          // @12 - İşlem miktarı
        'ADET',                        // @13 - İşlem birimi
        islemData.islemTutar,          // @14 - İşlem tutarı
        'TL',                          // @15 - İşlem dövizi
        1.00                           // @16 - İşlem kuru
      ];
      
      await this.musteriRepository.query(query, parameters);
      
      console.log('=== Oda değişikliği işlem kaydı ekleme tamamlandı ===');
    } catch (error) {
      console.error('kaydetOdaDegisikligiIslem hatası:', error);
      throw new Error(`İşlem kaydı eklenirken hata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Yeni müşteri kaydı için transaction-safe wrapper
   */
  async createMusteriIslemWithTransaction(
    queryRunner: QueryRunner,
    createMusteriDto: CreateMusteriDto
  ): Promise<{ success: boolean; message: string; musteriNo: number }> {
    try {
      console.log('=== createMusteriIslemWithTransaction başlatıldı ===');
      
      // Müşteri ekleme stored procedure'ü
      const storedProcedures = this.dbConfig.getStoredProcedures();
      const parameters = [
        createMusteriDto.MstrKllnc,           // @0
        createMusteriDto.MstrHspTip,          // @1  
        createMusteriDto.MstrTCN,             // @2
        createMusteriDto.MstrAdi,             // @3
        createMusteriDto.MstrDgmTarihi || null, // @4
        createMusteriDto.MstrTelNo || null,   // @5
        createMusteriDto.MstrTel2 || null,    // @6
        createMusteriDto.MstrEposta || null,  // @7
        createMusteriDto.MstrMeslek || null,  // @8
        createMusteriDto.MstrYakini || null,  // @9
        createMusteriDto.MstrYknTel || null,  // @10
        createMusteriDto.MstrDurum || null,   // @11
        createMusteriDto.MstrFirma || null,   // @12
        createMusteriDto.MstrVD || null,      // @13
        createMusteriDto.MstrVno || null,     // @14
        createMusteriDto.MstrFrmTel || null,  // @15
        createMusteriDto.MstrFrmMdr || null,  // @16
        createMusteriDto.MstrMdrTel || null,  // @17
        createMusteriDto.MstrAdres || null,   // @18
        '0x9473FBCCBC01AF',                   // @19 - Fixed MstrResim value as binary
        createMusteriDto.MstrNot || null,     // @20
      ];

      // Müşteri ekleme
      await this.transactionService.executeStoredProcedure(
        queryRunner,
        storedProcedures.musteriEkle,
        parameters
      );
      
      // Müşteri numarasını al
      const schemaName = this.dbConfig.getTableSchema();
      const musteriNoQuery = `SELECT TOP 1 MstrNo FROM ${schemaName}.tblMusteri ORDER BY MstrNo DESC`;
      const musteriNoResult: { MstrNo: number }[] = await this.transactionService.executeQuery(
        queryRunner, 
        musteriNoQuery, 
        []
      ) as { MstrNo: number }[];
      
      if (!musteriNoResult || musteriNoResult.length === 0) {
        throw new Error('Eklenen müşteri numarası alınamadı');
      }
      
      const insertedMstrNo = musteriNoResult[0].MstrNo;
      
      // Cari kaydı oluştur
      await this.createCariRecordWithTransaction(queryRunner, createMusteriDto, insertedMstrNo);
      
      console.log('=== createMusteriIslemWithTransaction tamamlandı (Transaction-Safe) ===');
      return { 
        success: true, 
        message: 'Müşteri başarıyla eklendi',
        musteriNo: insertedMstrNo
      };
    } catch (error) {
      console.error('createMusteriIslemWithTransaction hatası:', error);
      throw new Error(`Müşteri kaydı eklenirken hata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Cari kaydı için transaction-safe wrapper
   */
  async createCariRecordWithTransaction(
    queryRunner: QueryRunner,
    musteriData: CreateMusteriDto, 
    mstrNo: number
  ): Promise<void> {
    try {
      // CariKod oluştur: Bireysel için BM, Kurumsal için KM + MstrNo
      const cariKod = musteriData.MstrHspTip === 'Bireysel' ? `MB${mstrNo}` : `MK${mstrNo}`;
      
      // CariVD belirle
      let cariVD: string;
      if (musteriData.MstrHspTip === 'Bireysel') {
        cariVD = 'Bireysel';
      } else {
        cariVD = musteriData.MstrVD || 'Kurumsal';
      }
      
      // CariVTCN belirle
      let cariVTCN: string;
      if (musteriData.MstrHspTip === 'Bireysel') {
        cariVTCN = musteriData.MstrTCN || '';
      } else {
        cariVTCN = musteriData.MstrVno || musteriData.MstrTCN || '';
      }

      const storedProcedures = this.dbConfig.getStoredProcedures();
      const parameters = [
        musteriData.MstrKllnc,                    // @0 - CariKllnc
        cariKod,                                  // @1 - CariKod
        'ALACAK',                                 // @2 - CariTip
        musteriData.MstrAdi,                      // @3 - CariAdi
        cariVD,                                   // @4 - CariVD
        cariVTCN,                                 // @5 - CariVTCN
        musteriData.MstrFrmMdr || null,           // @6 - CariYetkili
        musteriData.MstrTelNo || null,            // @7 - CariTelNo (MstrTelNo kullan)
        musteriData.MstrEposta || null,           // @8 - CariEposta
        musteriData.MstrAdres || null,            // @9 - CariAdres
      ];

      await this.transactionService.executeStoredProcedure(
        queryRunner,
        storedProcedures.cariEkle,
        parameters
      );
      
      console.log('Cari kaydı başarıyla oluşturuldu (Transaction-Safe)');
    } catch (error) {
      console.error('Cari kaydı oluşturulurken hata (Transaction):', error);
      throw new Error('Cari kaydı oluşturulamadı');
    }
  }

  /**
   * Konaklama kaydı için transaction-safe wrapper
   */
  async kaydetKonaklamaWithTransaction(
    queryRunner: QueryRunner,
    konaklamaData: { 
      OdaYatak: string | { label?: string; value?: string };
      KonaklamaSuresi: number;
      KonaklamaTipi: string;
      HesaplananBedel: number;
      ToplamBedel: number;
      MstrKllnc: string;
      OdaTipi: string;
      OdemeTakvimGunu?: number | null; // 🔥 Ö.T.G. alanı eklendi
      planlananCikisTarihi?: string; // Frontend'den gelen planlanan çıkış tarihi
      ekNotlar?: string;
      ekBilgiler?: {
        kahvaltiDahil?: boolean;
        havluVerildi?: boolean;
        prizVerildi?: boolean;
        geceKonaklama?: boolean;
      };
    }, 
    musteriNo: number
  ): Promise<void> {
    try {
      console.log('=== kaydetKonaklamaWithTransaction başlatıldı ===');
      
      const now = new Date();
      const { odaNo, yatakNo } = this.parseOdaYatak(konaklamaData.OdaYatak);
      

      
      // Tarihleri hesapla
      const girisTarihi = this.formatDate(now);
      let planlananCikis: string;
      
      // Daima frontend'den gelen planlanan çıkış tarihini kullan
      if (konaklamaData.planlananCikisTarihi) {
        console.log('📅 kaydetKonaklamaWithTransaction\'da frontend\'den gelen planlanan çıkış tarihi kullanılıyor:', konaklamaData.planlananCikisTarihi);
        planlananCikis = konaklamaData.planlananCikisTarihi;
      } else if (konaklamaData.ekBilgiler?.geceKonaklama) {
        console.log('🌙 Geç Saat Konaklama seçili - Planlanan çıkış tarihi giriş tarihi olarak ayarlanıyor');
        planlananCikis = girisTarihi; // Aynı gün çıkış
      } else {
        // Frontend'den tarih gelmemişse hata fırlat
        throw new Error('Planlanan çıkış tarihi frontend\'den gelmedi!');
      }
      
      // Konaklama tipini parse et (örn: "2 HAFTALIK" -> "HAFTALIK")
      const konaklamaTipi = this.parseKonaklamaTipi(konaklamaData.KonaklamaTipi);                     
      
      // İskonto hesapla (yüzde olarak)
      let iskonto = 0;
      if (konaklamaData.HesaplananBedel > 0) {
        iskonto = ((konaklamaData.HesaplananBedel - konaklamaData.ToplamBedel) / konaklamaData.HesaplananBedel) * 100;
        iskonto = Math.round(iskonto * 100) / 100; // 2 ondalık basamak
      }
      
      // Blok ve kat bilgisi
      const ilkDigit = parseInt(odaNo.charAt(0));
      const blok = ilkDigit < 6 ? 'A' : 'B';
      const kat = ilkDigit.toString();
      
      // Ödeme takip günü - frontend'den gelen değer varsa onu kullan, yoksa boş bırak
      const odmTkvGun = konaklamaData.OdemeTakvimGunu ? konaklamaData.OdemeTakvimGunu.toString() : '';
      
      // SecOdYat oluştur
      const secOdYat = this.generateSecOdYat(odaNo, yatakNo);
      
      // Not ile zaman damgası (stored procedure zaten ekliyor, biz eklemeyelim)
      const notlarZamanli = konaklamaData.ekNotlar || '';
      
      const storedProcedures = this.dbConfig.getStoredProcedures();
      const parameters = [
        konaklamaData.MstrKllnc,  // @0
        musteriNo,                // @1
        'MERKEZ',                 // @2
        blok + '-BLOK',           // @3
        kat + '. KAT',            // @4
        konaklamaData.OdaTipi,    // @5
        odaNo,                    // @6
        yatakNo,                  // @7
        konaklamaTipi,            // @8
        konaklamaData.HesaplananBedel, // @9
        iskonto,                  // @10
        konaklamaData.ToplamBedel, // @11
        odmTkvGun,                // @12
        girisTarihi,              // @13
        planlananCikis,           // @14 - Geç Saat Konaklama kontrolü ile hesaplanmış
        null,                     // @15 - KnklmCksTrh
        null,                     // @16 - KnklmKrLst
        notlarZamanli,            // @17
        secOdYat                  // @18
      ];
      
      await this.transactionService.executeStoredProcedure(
        queryRunner,
        storedProcedures.konaklamaEkle,
        parameters
      );
      
      console.log('=== kaydetKonaklamaWithTransaction tamamlandı (Transaction-Safe) ===');
    } catch (error) {
      console.error('Konaklama kaydı hatası (Transaction):', error);
      throw new Error('Konaklama kaydı yapılamadı');
    }
  }

  /**
   * İşlem kaydı için transaction-safe wrapper
   */
  async kaydetIslemWithTransaction(
    queryRunner: QueryRunner,
    islemData: {
      OdaYatak: string | { label?: string; value?: string };
      KonaklamaSuresi: number;
      KonaklamaTipi: string;
      MstrHspTip: string;
      MstrKllnc: string;
      MstrAdi: string;
      planlananCikisTarihi?: string; // Frontend'den gelen planlanan çıkış tarihi
      ToplamBedel: number;
      musteriDurumu?: string; // 'YENI' veya 'AYRILAN_MUSTERI' 
      OdemeVadesi?: string; // 🔥 Ödeme vadesi bilgisi eklendi
      depozito?: {
        dahil: boolean;
        bedel: number;
      };
    }, 
    musteriNo: number
  ): Promise<void> {
    try {
      console.log('=== kaydetIslemWithTransaction başlatıldı ===');
      
      const now = new Date();
      const { odaNo, yatakNo } = this.parseOdaYatak(islemData.OdaYatak);
      

      
      // Tarihleri hesapla
      const girisTarihi = this.formatDate(now);
      let planlananCikis: string;
      
      // Daima frontend'den gelen planlanan çıkış tarihini kullan
      if (islemData.planlananCikisTarihi) {
        console.log('📅 kaydetIslemWithTransaction\'da frontend\'den gelen planlanan çıkış tarihi kullanılıyor:', islemData.planlananCikisTarihi);
        planlananCikis = islemData.planlananCikisTarihi;
      } else {
        // Frontend'den tarih gelmemişse hata fırlat
        throw new Error('Planlanan çıkış tarihi frontend\'den gelmedi!');
      }
      
      // Cari kod oluştur
      const cariKod = islemData.MstrHspTip === 'Kurumsal' ? `MK${musteriNo}` : `MB${musteriNo}`;
      
      // Konaklama tipini parse et
      const konaklamaTipi = this.parseKonaklamaTipi(islemData.KonaklamaTipi);
      
      // Blok ve kat bilgisi
      const ilkDigit = parseInt(odaNo.charAt(0));
      const blok = ilkDigit < 6 ? 'A' : 'B';
      const kat = ilkDigit.toString();
      
      // İşlem bilgisi oluştur - ödeme vadesi ile birlikte (stored procedure zaten zaman damgası ekliyor)
      const islemBilgi = `BAKİYE ÖDEME VADESİ: ${islemData.OdemeVadesi || 'Belirtilmemiş'} -/- ${girisTarihi} - ${planlananCikis} DÖNEMİ KONAKLAMA`;
      
      const storedProcedures = this.dbConfig.getStoredProcedures();
      const parameters = [
        this.getCurrentTransactionDate(), // @0 - iKytTarihi: Her zaman işlemin yapıldığı günün tarihi
        islemData.MstrKllnc || 'admin', // @1 - Kullanıcı adı (varsayılan: admin)
        cariKod,                       // @2
        konaklamaTipi,                 // @3
        `${blok}-BLOK - ${kat}. KAT`,  // @4
        `${odaNo} - ${yatakNo}`,       // @5
        '',                            // @6 - islemOzel4 boş
        'Cari İşlem',                  // @7
        'GELİR',                       // @8
        'Konaklama',                   // @9
        islemData.MstrAdi,             // @10
        islemBilgi,                    // @11
        1.00,                          // @12
        'ADET',                        // @13
        islemData.ToplamBedel,         // @14
        'TL',                          // @15
        1.00                           // @16
      ];
      
      await this.transactionService.executeStoredProcedure(
        queryRunner,
        storedProcedures.islemEkle,
        parameters
      );
      
      // 🔥 DEPOZİTO KAYDI - Eğer depozito dahil ve bedel > 0 ise
      if (islemData.depozito?.dahil === true && islemData.depozito.bedel > 0) {
        console.log('Depozito kaydı ekleniyor (Transaction-Safe):', {
          musteriDurumu: islemData.musteriDurumu,
          depozitoBedel: islemData.depozito.bedel,
          depozitoDahil: islemData.depozito.dahil
        });
        
        // İşlem bilgisi - müşteri durumuna göre
        let depozitoBilgi: string;
        if (islemData.musteriDurumu === 'YENI') {
          depozitoBilgi = 'İLK KONAKLAMA =DEPOZİTO ALACAĞI=';
        } else {
          depozitoBilgi = 'KONAKLAMA =DEPOZİTO ALACAĞI=';
        }
        
        const depozitParameters = [
          this.getCurrentTransactionDate(), // @0 - iKytTarihi: Her zaman işlemin yapıldığı günün tarihi
          islemData.MstrKllnc || 'admin', // @1 - Kullanıcı adı (varsayılan: admin)
          cariKod,                       // @2
          konaklamaTipi,                 // @3
          `${blok}-BLOK - ${kat}. KAT`,  // @4
          `${odaNo} - ${yatakNo}`,       // @5
          '',                            // @6 - islemOzel4 boş
          'Nakit Kasa(TL)',              // @7 - DEĞİŞTİ: 'Cari İşlem' -> 'Nakit Kasa(TL)'
          'Çıkan',                       // @8 - DEĞİŞTİ: 'GELİR' -> 'Çıkan'
          'Konaklama',                   // @9
          islemData.MstrAdi,             // @10
          depozitoBilgi,                 // @11 - DEĞİŞTİ: Depozito bilgisi
          1.00,                          // @12
          'ADET',                        // @13
          islemData.depozito.bedel,      // @14 - DEĞİŞTİ: Depozito bedeli
          'TL',                          // @15
          1.00                           // @16
        ];
        
        await this.transactionService.executeStoredProcedure(
          queryRunner,
          storedProcedures.islemEkle,
          depozitParameters
        );
        
        console.log('Depozito kaydı başarıyla eklendi (Transaction-Safe)');
      }
      
      console.log('=== kaydetIslemWithTransaction tamamlandı (Transaction-Safe) ===');
    } catch (error) {
      console.error('İşlem kaydı hatası (Transaction):', error);
      throw new Error('İşlem kaydı yapılamadı');
    }
  }

  /**
   * Konaklama sonlandırma için transaction-safe wrapper
   */
  async sonlandirKonaklamaWithTransaction(
    queryRunner: QueryRunner,
    tcNo: string, 
    eskiPlnTrh: string
  ): Promise<void> {
    try {
      console.log('=== sonlandirKonaklamaWithTransaction başlatıldı ===');
      console.log('TC Kimlik:', tcNo);
      console.log('Eski planlanan tarih:', eskiPlnTrh);
      
      // Önce TC kimlik numarasından müşteri numarasını al
      const musteriData = await this.getMusteriBilgiByTCN(tcNo) as { MstrNo?: number } | null;
      if (!musteriData || !musteriData.MstrNo) {
        throw new Error('Müşteri bulunamadı');
      }
      
      const musteriNo = musteriData.MstrNo;
      console.log('Müşteri numarası:', musteriNo);
      
      const schemaName = this.dbConfig.getTableSchema();
      
      // Mevcut konaklama kaydının KnklmCksTrh'ni KnklmPlnTrh ile güncelle
      const query = `
        UPDATE ${schemaName}.tblKonaklama 
        SET KnklmCksTrh = KnklmPlnTrh
        WHERE KnklmMstrNo = @0 
          AND (KnklmCksTrh = '' OR KnklmCksTrh IS NULL)
          AND KnklmPlnTrh = @1
      `;
      
      await this.transactionService.executeQuery(queryRunner, query, [musteriNo, eskiPlnTrh]);
      console.log('Konaklama sonlandırma sorgusu tamamlandı - KnklmCksTrh = KnklmPlnTrh (Transaction-Safe)');
      
    } catch (error) {
      console.error('Konaklama sonlandırma hatası (Transaction):', error);
      throw new Error('Konaklama kaydı sonlandırılamadı');
    }
  }

  /**
   * Dönem yenileme konaklama kaydı için transaction-safe wrapper
   */
  async kaydetDonemYenilemeKonaklamaWithTransaction(
    queryRunner: QueryRunner,
    konaklamaData: { 
      OdaYatak: string | { label?: string; value?: string };
      KonaklamaSuresi: number;
      KonaklamaTipi: string;
      HesaplananBedel: number;
      ToplamBedel: number;
      MstrKllnc: string;
      KnklmOdaTip: string;
      eskiKnklmPlnTrh: string; // Önceki kaydın planlanan tarihi (yeni kaydın giriş tarihi olacak)
      planlananCikisTarihi?: string; // Frontend'den gelen planlanan çıkış tarihi
      OdemeTakvimGunu?: number | null; // 🔥 Ö.T.G. alanı eklendi
      ekNotlar?: string;
      KnklmNot?: string; // Ek notlar alanı eklendi
      ekBilgiler?: {
        kahvaltiDahil?: boolean;
        havluVerildi?: boolean;
        prizVerildi?: boolean;
        geceKonaklama?: boolean;
      };
    }, 
    musteriNo: number
  ): Promise<void> {
    try {
      console.log('=== kaydetDonemYenilemeKonaklamaWithTransaction başlatıldı ===');
      
      const { odaNo, yatakNo } = this.parseOdaYatak(konaklamaData.OdaYatak);
      
      // Giriş tarihi = önceki kaydın planlanan tarihi (eskiKnklmPlnTrh)
      const girisTarihi = konaklamaData.eskiKnklmPlnTrh;
      
      // Çıkış tarihi hesaplaması - Geç Saat Konaklama kontrolü ile
      let planlananCikis: string;
      
      // Geç Saat Konaklama seçilmişse, planlanan çıkış tarihi giriş tarihi olur
      if (konaklamaData.ekBilgiler?.geceKonaklama) {
        console.log('🌙 Dönem yenilemede Geç Saat Konaklama seçili - Planlanan çıkış tarihi giriş tarihi olarak ayarlanıyor');
        planlananCikis = girisTarihi; // Aynı gün çıkış
      } else {
        // Normal dönem yenileme - giriş tarihi + konaklama süresi
        const girisTarihiDate = this.parseDate(girisTarihi); // DD.MM.YYYY formatından Date objesine
        const cikisTarihi = new Date(girisTarihiDate);
        cikisTarihi.setDate(cikisTarihi.getDate() + konaklamaData.KonaklamaSuresi);
        planlananCikis = this.formatDate(cikisTarihi);
      }
      
      // Konaklama tipini parse et (örn: "2 HAFTALIK" -> "HAFTALIK")
        const konaklamaTipi = this.parseKonaklamaTipi(konaklamaData.KonaklamaTipi);
      // İskonto hesapla (yüzde olarak)
      let iskonto = 0;
      if (konaklamaData.HesaplananBedel > 0) {
        iskonto = ((konaklamaData.HesaplananBedel - konaklamaData.ToplamBedel) / konaklamaData.HesaplananBedel) * 100;
        iskonto = Math.round(iskonto * 100) / 100; // 2 ondalık basamak
      }
      
      // Blok ve kat bilgisi
      const ilkDigit = parseInt(odaNo.charAt(0));
      const blok = ilkDigit < 6 ? 'A' : 'B';
      const kat = ilkDigit.toString();
      
      // Ödeme takip günü - frontend'den gelen değer varsa onu kullan, yoksa boş bırak
      const odmTkvGun = konaklamaData.OdemeTakvimGunu ? konaklamaData.OdemeTakvimGunu.toString() : '';
      
      // SecOdYat oluştur
      const secOdYat = this.generateSecOdYat(odaNo, yatakNo);
      
      // Not bilgisi - frontend'den gelen KnklmNot kullan (stored procedure zaten zaman damgası ekliyor)
      const notlarZamanli = konaklamaData.KnklmNot || konaklamaData.ekNotlar || '';
      
      const storedProcedures = this.dbConfig.getStoredProcedures();
      const parameters = [
        konaklamaData.MstrKllnc || 'admin',  // @0 - KnklmKllnc (kullanıcı adı)
        musteriNo,                // @1
        'MERKEZ',                 // @2
        blok + '-BLOK',           // @3
        kat + '. KAT',            // @4
        konaklamaData.KnklmOdaTip, // @5 - Oda tipi
        odaNo,                    // @6
        yatakNo,                  // @7
        konaklamaTipi,            // @8
        konaklamaData.HesaplananBedel, // @9
        iskonto,                  // @10
        konaklamaData.ToplamBedel, // @11
        odmTkvGun,                // @12
        girisTarihi,              // @13 - Yeni giriş tarihi (önceki kaydın planlanan tarihi)
        planlananCikis,           // @14 - Geç Saat Konaklama kontrolü ile hesaplanmış yeni planlanan çıkış tarihi
        null,                     // @15 - KnklmCksTrh
        null,                     // @16 - KnklmKrLst
        notlarZamanli,            // @17
        secOdYat                  // @18
      ];
      
      await this.transactionService.executeStoredProcedure(
        queryRunner,
        storedProcedures.konaklamaEkle,
        parameters
      );
      
      console.log('Dönem yenileme konaklama kaydı başarıyla oluşturuldu (Transaction-Safe)');
    } catch (error) {
      console.error('Dönem yenileme konaklama kaydı hatası (Transaction):', error);
      throw new Error('Dönem yenileme konaklama kaydı yapılamadı');
    }
  }

  /**
   * Dönem yenileme işlem kaydı için transaction-safe wrapper
   */
  async kaydetDonemYenilemeIslemWithTransaction(
    queryRunner: QueryRunner,
    islemData: {
      OdaYatak: string | { label?: string; value?: string };
      KonaklamaSuresi: number;
      KonaklamaTipi: string;
      MstrHspTip: string;
      MstrKllnc: string;
      MstrAdi: string;
      ToplamBedel: number;
      planlananCikisTarihi?: string; // Frontend'den gelen planlanan çıkış tarihi
      eskiKnklmPlnTrh: string; // Önceki kaydın planlanan tarihi (yeni kaydın giriş tarihi)
      OdemeVadesi?: string; // 🔥 Ödeme vadesi bilgisi eklendi
    }, 
    musteriNo: number
  ): Promise<void> {
    try {
      console.log('=== kaydetDonemYenilemeIslemWithTransaction başlatıldı ===');
      
      const { odaNo, yatakNo } = this.parseOdaYatak(islemData.OdaYatak);
      
      // Giriş tarihi = önceki kaydın planlanan tarihi
      const girisTarihi = islemData.eskiKnklmPlnTrh;
      
      // Çıkış tarihi = giriş tarihi + konaklama süresi (yeni hesaplama fonksiyonu ile)
      const girisTarihiDate = this.parseDate(girisTarihi);
      const cikisTarihi = this.hesaplaPlanlananCikisTarihi(girisTarihiDate, islemData.KonaklamaSuresi);
      const planlananCikis = this.formatDate(cikisTarihi);
      
      // Cari kod oluştur
      const cariKod = islemData.MstrHspTip === 'Kurumsal' ? `MK${musteriNo}` : `MB${musteriNo}`;
      
      // Konaklama tipini parse et
      const konaklamaTipi = this.parseKonaklamaTipi(islemData.KonaklamaTipi);
      
      // Blok ve kat bilgisi
      const ilkDigit = parseInt(odaNo.charAt(0));
      const blok = ilkDigit < 6 ? 'A' : 'B';
      const kat = ilkDigit.toString();
      
      // İşlem bilgisi oluştur - dönem yenileme özel mesajı
      const islemBilgi = `${girisTarihi} - ${planlananCikis} DÖNEM YENİLEME KONAKLAMA`;
      
      const storedProcedures = this.dbConfig.getStoredProcedures();
      const parameters = [
        this.getCurrentTransactionDate(), // @0 - iKytTarihi: Her zaman işlemin yapıldığı günün tarihi
        islemData.MstrKllnc || 'admin', // @1 - Kullanıcı adı (varsayılan: admin)
        cariKod,                       // @2
        konaklamaTipi,                 // @3
        `${blok}-BLOK - ${kat}. KAT`,  // @4
        `${odaNo} - ${yatakNo}`,       // @5
        '',                            // @6 - islemOzel4 boş
        'Cari İşlem',                  // @7
        'GELİR',                       // @8
        'Konaklama',                   // @9
        islemData.MstrAdi,             // @10
        islemBilgi,                    // @11
        1.00,                          // @12
        'ADET',                        // @13
        islemData.ToplamBedel,         // @14
        'TL',                          // @15
        1.00                           // @16
      ];

      await this.transactionService.executeStoredProcedure(
        queryRunner,
        storedProcedures.islemEkle,
        parameters
      );
      
      console.log('Dönem yenileme işlem kaydı başarıyla oluşturuldu (Transaction-Safe)');
    } catch (error) {
      console.error('Dönem yenileme işlem kaydı hatası (Transaction):', error);
      throw new Error(`Dönem yenileme işlem kaydı yapılamadı: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Müşteri çıkış işlemi için transaction-safe wrapper
   */
  async musteriCikisYapWithTransaction(
    queryRunner: QueryRunner,
    cikisData: { tcNo: string; plnTrh: string; odaYatak: any; knklmKrLst?: string; knklmNot?: string },
    kullaniciAdi?: string
  ): Promise<void> {
    try {
      console.log('=== musteriCikisYapWithTransaction başlatıldı ===');
      console.log('Çıkış verisi:', cikisData);
      
      // 🔥 1. KARA LİSTE BİLGİLERİNİ GÜNCELLE (konaklama sonlandırmadan ÖNCE!)
      if (cikisData.knklmKrLst && cikisData.knklmNot) {
        await this.updateKaraListeBilgileriWithTransaction(
          queryRunner, 
          cikisData.tcNo, 
          cikisData.plnTrh, 
          cikisData.knklmKrLst, 
          cikisData.knklmNot
        );
      }
      
      // 2. Mevcut konaklama kaydını sonlandır (Çıkış tarihini ayarla)
      await this.sonlandirKonaklamaWithTransaction(queryRunner, cikisData.tcNo, cikisData.plnTrh);
      
      // 3. Oda-yatak kaydını 'BOŞ' olarak güncelle
      await this.bosaltOdaYatakWithTransaction(
        queryRunner, 
        cikisData.odaYatak as string | { label?: string; value?: string },
        kullaniciAdi
      );

      // 4. Müşteri durumunu 'AYRILDI' yap
      const schemaName = this.dbConfig.getTableSchema();
      const query = `UPDATE ${schemaName}.tblMusteri SET MstrDurum = 'AYRILDI' WHERE MstrTCN = @0`;
      await this.transactionService.executeQuery(queryRunner, query, [cikisData.tcNo]);
      
      console.log(`Müşteri ${cikisData.tcNo} çıkış işlemi tamamlandı. Durum 'AYRILDI' olarak güncellendi (Transaction-Safe).`);
    } catch (error) {
      console.error('Müşteri çıkış işlemi sırasında hata (Transaction):', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
      throw new Error(`Müşteri çıkış işlemi yapılamadı: ${errorMessage}`);
    }
  }

  /**
   * Kara liste bilgileri güncelleme için transaction-safe wrapper
   */
  private async updateKaraListeBilgileriWithTransaction(
    queryRunner: QueryRunner,
    tcNo: string, 
    plnTrh: string, 
    knklmKrLst: string, 
    knklmNot: string
  ): Promise<void> {
    try {
      console.log('=== Kara liste bilgileri güncelleniyor (Transaction-Safe) ===');
      console.log('TC:', tcNo, 'PlnTrh:', plnTrh, 'KrLst:', knklmKrLst, 'Not uzunluğu:', knklmNot.length);
      
      // Önce TC kimlik numarasından müşteri numarasını al
      const musteriData = await this.getMusteriBilgiByTCN(tcNo) as { MstrNo?: number } | null;
      if (!musteriData || !musteriData.MstrNo) {
        throw new Error('Müşteri bulunamadı');
      }
      
      const musteriNo = musteriData.MstrNo;
      console.log('Müşteri numarası:', musteriNo);
      
      const schemaName = this.dbConfig.getTableSchema();
      const query = `
        UPDATE ${schemaName}.tblKonaklama 
        SET KnklmKrLst = @0, KnklmNot = @1 
        WHERE KnklmMstrNo = @2 AND KnklmPlnTrh = @3 AND KnklmCksTrh IS NULL
      `;
      
      const result: unknown = await this.transactionService.executeQuery(
        queryRunner, 
        query, 
        [knklmKrLst, knklmNot, musteriNo, plnTrh]
      );
      
      console.log('Kara liste güncelleme sonucu:', result);
      console.log('✅ Kara liste bilgileri başarıyla güncellendi (Transaction-Safe)');
    } catch (error) {
      console.error('❌ Kara liste güncellemesi sırasında hata (Transaction):', error);
      throw new Error(`Kara liste bilgileri güncellenemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  /**
   * Oda-yatak boşaltma için transaction-safe wrapper
   */
  async bosaltOdaYatakWithTransaction(
    queryRunner: QueryRunner,
    odaYatakStr: string | { label?: string; value?: string },
    kullaniciAdi?: string
  ): Promise<void> {
    try {
      console.log('=== bosaltOdaYatakWithTransaction başlatıldı ===');
      console.log('Boşaltılacak oda-yatak:', odaYatakStr);
      
      const { odaNo, yatakNo } = this.parseOdaYatak(odaYatakStr);
      console.log('Parse edilen oda-yatak:', { odaNo, yatakNo });
      
      // İşlem tarihi ve kullanıcı bilgisi
      const bugunTarihi = this.formatDate(new Date()); // DD.MM.YYYY formatında
      const kullaniciAdiFinal = kullaniciAdi || 'admin';
      
      console.log('Boşaltma işlemi bilgileri:', {
        tarih: bugunTarihi,
        kullanici: kullaniciAdiFinal
      });
      
      const schemaName = this.dbConfig.getTableSchema();
      const query = `
        UPDATE ${schemaName}.tblOdaYatak 
        SET odYatDurum = 'BOŞ', 
            odYatKllnc = @2, 
            oKytTarihi = @3
        WHERE odYatOdaNo = @0 AND odYatYtkNo = @1
      `;
      
      await this.transactionService.executeQuery(queryRunner, query, [odaNo, yatakNo, kullaniciAdiFinal, bugunTarihi]);
      console.log(`Oda ${odaNo}-${yatakNo} başarıyla boşaltıldı (${bugunTarihi} - ${kullaniciAdiFinal}) (Transaction-Safe)`);
      
    } catch (error) {
      console.error('Oda-yatak boşaltma hatası (Transaction):', error);
      const odaYatakStrFormatted = typeof odaYatakStr === 'object' ? 
        (odaYatakStr.label || odaYatakStr.value || JSON.stringify(odaYatakStr)) : 
        String(odaYatakStr);
      throw new Error(`Oda-yatak boşaltılamadı: ${odaYatakStrFormatted}`);
    }
  }

  /**
   * Mevcut konaklama kaydını sonlandırma (oda değişikliği için) - Transaction-Safe
   */
  async sonlandirMevcutKonaklamaWithTransaction(
    queryRunner: QueryRunner,
    tcNo: string,
    kullaniciAdi: string
  ): Promise<void> {
    try {
      console.log('=== sonlandirMevcutKonaklamaWithTransaction başlatıldı ===');
      console.log('TC Kimlik:', tcNo);
      console.log('Kullanıcı adı:', kullaniciAdi);
      
      // Önce TC kimlik numarasından müşteri numarasını al
      const musteriData = await this.getMusteriBilgiByTCN(tcNo) as { MstrNo?: number } | null;
      if (!musteriData || !musteriData.MstrNo) {
        throw new Error('Müşteri bulunamadı');
      }
      
      const musteriNo = musteriData.MstrNo;
      console.log('Müşteri numarası:', musteriNo);
      
      const schemaName = this.dbConfig.getTableSchema();
      const bugunTarihi = this.formatDate(new Date()); // DD.MM.YYYY formatında
      
      // Mevcut konaklama kaydının KnklmCksTrh'ni bugünün tarihi ile güncelle
      const query = `
        UPDATE ${schemaName}.tblKonaklama 
        SET 
          KnklmCksTrh = @0,
          KnklmKllnc = @1
        WHERE KnklmMstrNo = @2 
          AND (KnklmCksTrh = '' OR KnklmCksTrh IS NULL)
      `;
      
      await this.transactionService.executeQuery(queryRunner, query, [bugunTarihi, kullaniciAdi, musteriNo]);
      console.log('Mevcut konaklama sonlandırma sorgusu tamamlandı (Transaction-Safe)');
      
    } catch (error) {
      console.error('Mevcut konaklama sonlandırma hatası (Transaction):', error);
      throw new Error('Mevcut konaklama kaydı sonlandırılamadı');
    }
  }

  /**
   * Yeni oda konaklama kaydı oluşturma (oda değişikliği için) - Transaction-Safe
   */
  async kaydetYeniOdaKonaklamaWithTransaction(
    queryRunner: QueryRunner,
    konaklamaData: {
      OdaYatak: string | { label?: string; value?: string };
      KonaklamaSuresi: number;
      KonaklamaTipi: string;
      HesaplananBedel: number;
      ToplamBedel: number;
      MstrKllnc: string;
      KnklmOdaTip: string;
      KnklmNot: string;
      eskiKnklmPlnTrh: string; // Planlanan çıkış tarihi olarak kullanılacak
      OdemeTakvimGunu?: number | null;
      ekNotlar?: string;
      ekBilgiler?: {
        kahvaltiDahil?: boolean;
        havluVerildi?: boolean;
        prizVerildi?: boolean;
        geceKonaklama?: boolean;
      };
    },
    musteriNo: number
  ): Promise<void> {
    try {
      console.log('=== kaydetYeniOdaKonaklamaWithTransaction başlatıldı ===');
      const { odaNo, yatakNo } = this.parseOdaYatak(konaklamaData.OdaYatak);
      // Giriş tarihi: bugünün tarihi
      const girisTarihi = this.formatDate(new Date());
      // Çıkış tarihi: ana formdaki planlanan çıkış tarihi
      const planlananCikis = konaklamaData.eskiKnklmPlnTrh;
      // Konaklama tipini parse et (örn: "2 HAFTALIK" -> "HAFTALIK")
      const konaklamaTipi = this.parseKonaklamaTipi(konaklamaData.KonaklamaTipi);  
      // İskonto hesapla (yüzde olarak)
      let iskonto = 0;
      if (konaklamaData.HesaplananBedel > 0) {
        iskonto = ((konaklamaData.HesaplananBedel - konaklamaData.ToplamBedel) / konaklamaData.HesaplananBedel) * 100;
        iskonto = Math.round(iskonto * 100) / 100;
      }
      // Blok ve kat bilgisi
      const ilkDigit = parseInt(odaNo.charAt(0));
      const blok = ilkDigit < 6 ? 'A-BLOK' : 'B-BLOK';
      const kat = ilkDigit.toString() + '. KAT';
      // Ödeme takip günü - frontend'den gelen değer varsa onu kullan, yoksa boş bırak
      const odmTkvGun = konaklamaData.OdemeTakvimGunu ? konaklamaData.OdemeTakvimGunu.toString() : '';
      // SecOdYat oluştur
      const secOdYat = this.generateSecOdYat(odaNo, yatakNo);
      // Not bilgisi - frontend'den gelen KnklmNot kullan (stored procedure zaten zaman damgası ekliyor)
      const notlarZamanli = konaklamaData.KnklmNot || konaklamaData.ekNotlar || '';
      const storedProcedures = this.dbConfig.getStoredProcedures();
      const parameters = [
        konaklamaData.MstrKllnc || 'admin',  // @0 - KnklmKllnc (kullanıcı adı)
        musteriNo,                // @1
        'MERKEZ',                 // @2
        blok,                     // @3
        kat,                      // @4
        konaklamaData.KnklmOdaTip, // @5 - Oda tipi
        odaNo,                    // @6
        yatakNo,                  // @7
        konaklamaTipi,            // @8
        konaklamaData.HesaplananBedel, // @9
        iskonto,                  // @10
        konaklamaData.ToplamBedel, // @11
        odmTkvGun,                // @12
        girisTarihi,              // @13 - Giriş tarihi: bugünün tarihi
        planlananCikis,           // @14 - Planlanan çıkış tarihi: ana formdan
        null,                     // @15 - KnklmCksTrh
        null,                     // @16 - KnklmKrLst
        notlarZamanli,            // @17
        secOdYat                  // @18
      ];
      await this.transactionService.executeStoredProcedure(
        queryRunner,
        storedProcedures.konaklamaEkle,
        parameters
      );
      console.log('Yeni oda konaklama kaydı başarıyla oluşturuldu (Transaction-Safe)');
    } catch (error) {
      console.error('Yeni oda konaklama kaydı hatası (Transaction):', error);
      throw new Error('Yeni oda konaklama kaydı yapılamadı');
    }
  }

  async erkenCikisYap(body: any): Promise<void> {
    // Oda no ve yatak no'yu body.odaYatak.value'dan al
    let odaNo = '', yatakNo = '';
    if (body.odaYatak && body.odaYatak.value) {
      const parts = String(body.odaYatak.value).split('-');
      odaNo = parts[0]?.trim() || '';
      yatakNo = parts[1]?.trim() || '';
    }
    // islemOzel1: knklmTip (konaklama tipi) - 'GÜNLÜK', 'HAFTALIK', 'AYLIK'
    let islemOzel1 = '';
    if (body.knklmTip) {
      islemOzel1 = body.knklmTip;
    } else if (body.KonaklamaTipi) {
      islemOzel1 = body.KonaklamaTipi;
    } else {
      islemOzel1 = 'GÜNLÜK'; // fallback
    }
    // islemOzel2: blok ve kat
    let blok = '', kat = '';
    if (odaNo) {
      const odaNoNum = parseInt(odaNo, 10);
      blok = odaNoNum < 600 ? 'A-BLOK' : 'B-BLOK';
      kat = odaNo.charAt(0); // ilk rakam kat numarası
    }
    const islemOzel2 = blok && kat ? `${blok} - ${kat}. KAT` : '';
    // islemOzel3: oda no - yatak no
    const islemOzel3 = odaNo && yatakNo ? `${odaNo} - ${yatakNo}` : '';

    await this.transactionService.executeInTransaction(async (queryRunner) => {
      // 1. Konaklama kaydında çıkış tarihi güncelle (en büyük KnklmNo'lu kayıt)
      const musteriData = await this.getMusteriBilgiByTCN(body.tcNo);
      if (!musteriData || !musteriData.MstrNo) throw new Error('Müşteri bulunamadı');
      const musteriNo = musteriData.MstrNo;
      const schemaName = this.dbConfig.getTableSchema();
      // CariKod oluştur
      const cariKod = musteriData.MstrHspTip === 'Bireysel' ? `MB${musteriNo}` : `MK${musteriNo}`;
      // Günün tarihi (işlem tarihi parametresi)
      const cikisTarihi = body.islemTarihi ? body.islemTarihi.split('T')[0].split('-').reverse().join('.') : this.formatDate(new Date());
      // En büyük KnklmNo'lu kaydı güncelle
      // KnklmNot bilgisini güncelle: mevcut KnklmNot + ' -/- ERKEN ÇIKIŞ FARKI: ${body.giderTutar}'
      const updateKonaklamaQuery = `
        UPDATE ${schemaName}.tblKonaklama
        SET KnklmCksTrh = @1,
            KnklmNot = ISNULL(KnklmNot, '') + ' -/- ERKEN ÇIKIŞ FARKI: ${body.giderTutar}'
        WHERE KnklmMstrNo = @0
          AND KnklmNo = (SELECT MAX(KnklmNo) FROM ${schemaName}.tblKonaklama WHERE KnklmMstrNo = @0)
      `;
      await this.transactionService.executeQuery(queryRunner, updateKonaklamaQuery, [musteriNo, cikisTarihi]);

      // 2. Oda-yatak kaydını BOŞ yap
      await this.bosaltOdaYatakWithTransaction(queryRunner, body.odaYatak, body.kullaniciAdi);

      // 3. tblislem'e GİDER kaydı ekle
      const storedProcedures = this.dbConfig.getStoredProcedures();
      await this.transactionService.executeStoredProcedure(queryRunner, storedProcedures.islemEkle, [
        this.getCurrentTransactionDate(), // @0 - iKytTarihi: Her zaman işlemin yapıldığı günün tarihi
        body.kullaniciAdi, // @1 - islemKllnc (artık dinamik, zorunlu)
        cariKod, // @2 - islemCrKod
        islemOzel1, // @3 - islemOzel1
        islemOzel2, // @4 - islemOzel2
        islemOzel3, // @5 - islemOzel3
        '', // @6 - islemOzel4
        'Cari İşlem', // @7 - islemArac
        'GİDER', // @8 - islemTip
        'Konaklama', // @9 - islemGrup
        musteriData.MstrAdi, // @10 - islemAltG
        this.addOdemeVadesiToIslemBilgi('ERKEN ÇIKIŞ FARKI', body.odemeVadesi), // @11 - islemBilgi (ödeme vadesi ile)
        1.00, // @12 - islemMiktar
        'ADET', // @13 - islemBirim
        body.giderTutar, // @14 - islemTutar
        'TL', // @15 - islemDoviz
        1.00 // @16 - islemKur
      ]);

      // 4. EN SON: tblMusteri'de MstrDurum 'AYRILDI' yap
      const updateDurumQuery = `UPDATE ${schemaName}.tblMusteri SET MstrDurum = 'AYRILDI' WHERE MstrTCN = @0`;
      await this.transactionService.executeQuery(queryRunner, updateDurumQuery, [body.tcNo]);
    });
  }

  // Konaklama Geçmişi Raporları için metodlar
  async getKonaklamaGecmisi(tcNo: string): Promise<any[]> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `
        SELECT 
          k.kKytTarihi,
          k.KnklmOdaNo,
          k.KnklmYtkNo,
          k.KnklmTip,
          k.KnklmNfyt,
          k.KnklmGrsTrh,
          k.KnklmPlnTrh,
          k.KnklmCksTrh,
          k.KnklmNot,
          k.KnklmKrLst
        FROM ${tables.konaklama} k
        INNER JOIN ${tables.musteri} m ON k.KnklmMstrNo = m.MstrNo
        WHERE m.MstrTCN = @0
        ORDER BY CONVERT(Date, k.kKytTarihi, 104) DESC
      `;
      
      const result = await this.musteriRepository.query(query, [tcNo]);
      return result;
    } catch (error) {
      console.error('Konaklama geçmişi alınırken hata:', error);
      throw new Error('Konaklama geçmişi alınamadı');
    }
  }

  async getFirmaKonaklamaGecmisi(firmaAdi: string): Promise<any[]> {
    try {
      const tables = this.dbConfig.getTables();
      const query = `
        SELECT 
          k.kKytTarihi,
          k.KnklmOdaNo,
          k.KnklmYtkNo,
          k.KnklmTip,
          k.KnklmNfyt,
          k.KnklmGrsTrh,
          k.KnklmPlnTrh,
          k.KnklmCksTrh,
          k.KnklmNot,
          k.KnklmKrLst,
          m.MstrAdi
        FROM ${tables.konaklama} k
        INNER JOIN ${tables.musteri} m ON k.KnklmMstrNo = m.MstrNo
        WHERE m.MstrFirma = @0
        ORDER BY CONVERT(Date, k.kKytTarihi, 104) DESC
      `;
      
      const result = await this.musteriRepository.query(query, [firmaAdi]);
      return result;
    } catch (error) {
      console.error('Firma konaklama geçmişi alınırken hata:', error);
      throw new Error('Firma konaklama geçmişi alınamadı');
    }
  }

  // Seçili müşteri için cari hareketler
  async getCariHareketler(tcNo: string): Promise<any[]> {
    try {
      const tables = this.dbConfig.getTables();
      
      // 🔥 CTE OPTİMİZASYONU: Cari hareketleri daha verimli getir
      const query = `
        WITH MusteriCariKod AS (
          -- TC'den cari kod bulma
          SELECT 
            CASE 
              WHEN m.MstrHspTip = 'Kurumsal' THEN 'MK' + CAST(m.MstrNo AS VARCHAR(10))
              ELSE 'MB' + CAST(m.MstrNo AS VARCHAR(10))
            END as CariKod
          FROM ${tables.musteri} m
          WHERE m.MstrTCN = @0
            AND LEFT(m.MstrAdi, 9) <> 'PERSONEL '
        ),
        CariHareketler AS (
          -- Cari hareketleri getir
          SELECT 
            i.iKytTarihi,
            i.islemKllnc,
            i.islemOzel1,
            i.islemOzel2,
            i.islemOzel3,
            i.islemArac,
            i.islemTip,
            i.islemGrup,
            i.islemBilgi,
            i.islemTutar,
            ROW_NUMBER() OVER (ORDER BY CONVERT(Date, i.iKytTarihi, 104) DESC, i.islemNo DESC) as rn
          FROM ${tables.islem} i
          INNER JOIN MusteriCariKod mck ON i.islemCrKod = mck.CariKod
        )
        SELECT 
          iKytTarihi,
          islemKllnc,
          islemOzel1,
          islemOzel2,
          islemOzel3,
          islemArac,
          islemTip,
          islemGrup,
          islemBilgi,
          islemTutar
        FROM CariHareketler
        ORDER BY CONVERT(Date, iKytTarihi, 104) DESC, rn
      `;
      
      const result: any[] = await this.musteriRepository.query(query, [tcNo]);
      console.log(`TC: ${tcNo} için ${result.length} cari hareket bulundu`);
      return result;
    } catch (error) {
      console.error('getCariHareketler hatası:', error);
      throw new Error('Cari hareketler alınamadı');
    }
  }

  // Seçili firma için cari hareketler
  async getFirmaCariHareketler(firmaAdi: string): Promise<any[]> {
    try {
      const tables = this.dbConfig.getTables();
      
      // 🔥 CTE OPTİMİZASYONU: Firma cari hareketlerini tek sorguda getir
      const query = `
        WITH FirmaMusterileri AS (
          -- Firma müşterilerini ve cari kodlarını hesapla
          SELECT 
            MstrNo,
            MstrHspTip,
            CASE 
              WHEN MstrHspTip = 'Bireysel' THEN 'MB' + CAST(MstrNo AS VARCHAR(10))
              ELSE 'MK' + CAST(MstrNo AS VARCHAR(10))
            END as CariKod
          FROM ${tables.musteri} 
          WHERE MstrFirma = @0
        ),
        FirmaCariHareketleri AS (
          -- Firma müşterilerinin cari hareketlerini getir
          SELECT 
            i.iKytTarihi,
            i.islemTip,
            i.islemBilgi,
            i.islemTutar,
            i.islemBirim,
            ROW_NUMBER() OVER (ORDER BY CONVERT(Date, i.iKytTarihi, 104) DESC, i.islemNo DESC) as rn
          FROM ${tables.islem} i
          INNER JOIN FirmaMusterileri fm ON i.islemCrKod = fm.CariKod
        )
        SELECT 
          iKytTarihi,
          islemTip,
          islemBilgi,
          islemTutar,
          islemBirim
        FROM FirmaCariHareketleri
        ORDER BY CONVERT(Date, iKytTarihi, 104) DESC, rn
      `;
      
      const hareketler = await this.musteriRepository.query(query, [firmaAdi]);
      console.log(`[FirmaCariHareketler] ${firmaAdi} için bulunan hareket sayısı:`, hareketler.length);
      return hareketler;
    } catch (error) {
      console.error('getFirmaCariHareketler hatası:', error);
      return [];
    }
  }

  /**
   * Ek Hizmetler için toplu işlem kaydı (Transaction-Safe)
   * @param queryRunner Transaction context
   * @param ekHizmetler Array<{ label: string; miktar: number; toplamTutar: number; }>
   * @param musteriData { musteriNo, MstrAdi, MstrKllnc, MstrHspTip, ... }
   * @returns { success: boolean; message: string }
   */
  async kaydetEkHizmetlerWithTransaction(
    queryRunner: QueryRunner,
    ekHizmetler: Array<{ label: string; miktar: number; toplamTutar: number }>,
    musteriData: {
      musteriNo: number;
      MstrAdi: string;
      MstrKllnc: string;
      MstrHspTip: string;
      MstrKnklmTip: string;
      MstrOdaYatak: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const storedProcedures = this.dbConfig.getStoredProcedures();
      const cariKod = musteriData.MstrHspTip === 'Kurumsal' ? `MK${musteriData.musteriNo}` : `MB${musteriData.musteriNo}`;
      // Konaklama tipini parse et
      //const konaklamaTipi = this.parseKonaklamaTipi( musteriData.MstrKnklmTip);
      
      // Blok ve kat bilgisi
      const { odaNo, yatakNo } = this.parseOdaYatak(musteriData.MstrOdaYatak);
      const ilkDigit = parseInt(odaNo.charAt(0));
      const blok = ilkDigit < 6 ? 'A' : 'B';
      const kat = ilkDigit.toString();

      for (const hizmet of ekHizmetler) {
        const query = `EXEC ${storedProcedures.islemEkle} 
          @iKytTarihi = @0, @islemKllnc = @1, @islemCrKod = @2, @islemOzel1 = @3, @islemOzel2 = @4,
          @islemOzel3 = @5, @islemOzel4 = @6, @islemArac = @7, @islemTip = @8, @islemGrup = @9,
          @islemAltG = @10, @islemBilgi = @11, @islemMiktar = @12, @islemBirim = @13, @islemTutar = @14,
          @islemDoviz = @15, @islemKur = @16`;
        const params = [
          this.getCurrentTransactionDate(), // @0
          musteriData.MstrKllnc || 'admin', // @1
          cariKod, // @2
          musteriData.MstrKnklmTip, // @3 - islemOzel1
          `${blok}-BLOK - ${kat}. KAT`, // @4 - islemOzel2
          `${odaNo} - ${yatakNo}`, // @5 - islemOzel3
          '', // @6 - islemOzel4
          'Cari İşlem', // @7 - islemArac
          'GELİR', // @8 - islemTip
          hizmet.label, // @9 - islemGrup (combobox label)
          musteriData.MstrAdi, // @10 - islemAltG (müşteri adı)
          `${hizmet.label} (${hizmet.miktar})`, // @11 - islemBilgi
          hizmet.miktar, // @12 - islemMiktar
          'ADET', // @13 - islemBirim
          hizmet.toplamTutar, // @14 - islemTutar
          'TL', // @15 - islemDoviz
          1.00 // @16 - islemKur
        ];
        await this.transactionService.executeStoredProcedure(queryRunner, storedProcedures.islemEkle, params);
      }
      return { success: true, message: 'Ek hizmetler başarıyla kaydedildi.' };
    } catch (error) {
      console.error('Ek hizmetler kaydı sırasında hata:', error);
      throw new Error('Ek hizmetler kaydedilemedi. Tüm işlemler geri alındı.');
    }
  }

  // Doğrudan cariKod ile hareketleri getir
  async getCariHareketlerByCariKod(cariKod: string): Promise<any[]> {
    const tables = this.dbConfig.getTables();
    const query = `
      SELECT iKytTarihi, islemTip, islemBilgi, islemTutar, islemBirim
      FROM ${tables.islem}
      WHERE islemCrKod = @0
      ORDER BY CONVERT(Date, iKytTarihi, 104) DESC
    `;
    return await this.musteriRepository.query(query, [cariKod]);
  }
} 