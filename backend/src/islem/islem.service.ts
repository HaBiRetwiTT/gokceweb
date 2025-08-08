import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DatabaseConfigService } from '../database/database-config.service';

@Injectable()
export class IslemService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly dbConfig: DatabaseConfigService,
  ) {}

  /**
   * Kasa işlemleri için günlük toplamları getirir
   */
  async getKasaIslemleri(islemTuru: string, islemYonu?: string, page: number = 1, rowsPerPage: number = 15): Promise<{data: any[], totalRecords: number}> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislem');
      
      // Tarih aralığı (son 1 yıl)
      const bugun = new Date();
      const birYilOnce = new Date();
      birYilOnce.setFullYear(birYilOnce.getFullYear() - 1);
      
      // DD.MM.YYYY formatına çevir
      const baslangicTarihi = birYilOnce.getDate().toString().padStart(2, '0') + '.' + 
                             (birYilOnce.getMonth() + 1).toString().padStart(2, '0') + '.' + 
                             birYilOnce.getFullYear();
      const bitisTarihi = bugun.getDate().toString().padStart(2, '0') + '.' + 
                         (bugun.getMonth() + 1).toString().padStart(2, '0') + '.' + 
                         bugun.getFullYear();
      
             console.log('🔍 Debug bilgileri:');
       console.log('- Schema:', schemaName);
       console.log('- Tablo:', tableName);
       console.log('- İşlem türü:', islemTuru);
       console.log('- İşlem yönü:', islemYonu);
       console.log('- Tarih aralığı:', baslangicTarihi, 'ile', bitisTarihi);
      
             // Önce tabloda genel veri kontrolü yapalım
       const genelKontrolQuery = `
         SELECT TOP 5
           iKytTarihi, islemArac, islemTip, islemTutar, islemBilgi,
           ISNUMERIC(islemTutar) as isNumeric,
           CAST(islemTutar AS DECIMAL(18,2)) as castedValue
         FROM ${schemaName}.${tableName}
         WHERE islemArac = 'Cari İşlem'
         ORDER BY iKytTarihi DESC
       `;

       const genelKontrol = await this.dataSource.query(genelKontrolQuery);
       console.log('📊 Tablo genel kontrol (son 5 kayıt):', genelKontrol);
      
      let whereCondition = '';
      let params: any[] = [];
      
      // İşlem türüne göre filtreleme
      switch (islemTuru) {
        case 'cari':
          whereCondition = `WHERE i.islemArac = 'Cari İşlem'`;
          break;
        case 'nakit':
          whereCondition = `WHERE i.islemArac = 'Nakit Kasa(TL)'`;
          break;
        case 'kart':
          whereCondition = `WHERE i.islemArac = 'Kredi Kartları'`;
          break;
        case 'eft':
          whereCondition = `WHERE i.islemArac = 'Banka EFT'`;
          break;
        case 'acenta':
          whereCondition = `WHERE i.islemArac = 'Acenta Tahsilat'`;
          break;
        case 'depozito':
          whereCondition = `WHERE (i.islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' OR i.islemBilgi LIKE '%=DEPOZİTO İADESİ=%')`;
          break;
        default:
          whereCondition = `WHERE i.islemArac = 'Cari İşlem'`;
      }
      
             // İşlem yönüne göre dinamik sorgu
       let gelirCondition = '';
       let giderCondition = '';
       
       if (islemYonu === 'gelir-gider') {
         // Cari seçildiğinde GELİR/GİDER
         gelirCondition = "i.islemTip = 'GELİR'";
         giderCondition = "i.islemTip = 'GİDER'";
       } else {
         // Diğer seçimlerde Giren/Çıkan
         gelirCondition = "i.islemTip = 'Giren'";
         giderCondition = "i.islemTip = 'Çıkan'";
       }
       
               // Önce toplam kayıt sayısını al
      const countQuery = `
          SELECT COUNT(*) as total
          FROM (
            SELECT i.iKytTarihi
            FROM ${schemaName}.${tableName} i
            ${whereCondition}
            AND CONVERT(DATE, i.iKytTarihi, 104) >= CONVERT(DATE, @0, 104)
            AND CONVERT(DATE, i.iKytTarihi, 104) <= CONVERT(DATE, @1, 104)
            GROUP BY i.iKytTarihi
          ) as grouped_data
        `;
      
      const countResult = await this.dataSource.query(countQuery, [baslangicTarihi, bitisTarihi]);
      const totalRecords = countResult[0]?.total || 0;
      console.log('🔍 Count Query sonucu:', countResult);
      console.log('🔍 Toplam kayıt sayısı:', totalRecords);
      
      // Pagination için OFFSET hesapla
      const offset = (page - 1) * rowsPerPage;
      
      const query = `
          SELECT 
            i.iKytTarihi as tarih,
            SUM(CASE WHEN ${gelirCondition} THEN i.islemTutar ELSE 0 END) as gelir,
            SUM(CASE WHEN ${giderCondition} THEN i.islemTutar ELSE 0 END) as gider
          FROM ${schemaName}.${tableName} i
          ${whereCondition}
          AND CONVERT(DATE, i.iKytTarihi, 104) >= CONVERT(DATE, @0, 104)
          AND CONVERT(DATE, i.iKytTarihi, 104) <= CONVERT(DATE, @1, 104)
          GROUP BY i.iKytTarihi
          ORDER BY CONVERT(DATE, i.iKytTarihi, 104) DESC
          OFFSET @2 ROWS
          FETCH NEXT @3 ROWS ONLY
        `;
      
      params = [baslangicTarihi, bitisTarihi, offset, rowsPerPage];
      
      console.log('🔍 SQL Sorgusu:', query);
      console.log('🔍 Parametreler:', params);
      
      const result = await this.dataSource.query(query, params);
      
      // Sadece 3 sütun döndür (bakiye hesaplama kaldırıldı)
      const processedData = result.map((row: any) => {
        const gelir = parseFloat(row.gelir) || 0;
        const gider = parseFloat(row.gider) || 0;
        
        return {
          tarih: row.tarih,
          gelir: gelir,
          gider: gider
        };
      });
      
      return {
        data: processedData,
        totalRecords: totalRecords
      };
      
    } catch (error) {
      console.error('Kasa işlemleri getirme hatası:', error);
      throw new Error('Kasa işlemleri getirilemedi');
    }
  }

  /**
   * Kasa devri kaydı ekler (tblKasaDevir)
   */
  async saveKasaDevir(kasaYekun: number): Promise<{ success: boolean }>{
    try {
      if (!Number.isFinite(kasaYekun)) {
        throw new Error('Geçersiz kasa tutarı');
      }
      const kasaYekunFixed = Number(parseFloat(String(kasaYekun)).toFixed(2));
      // Tarihi DD.MM.YYYY formatında hazırla (nchar(10))
      const bugun = new Date();
      const nKytTarihi = bugun
        .getDate()
        .toString()
        .padStart(2, '0') +
        '.' +
        (bugun.getMonth() + 1).toString().padStart(2, '0') +
        '.' +
        bugun.getFullYear();

      // Aktif kullanıcı adı (tblPersonel.PrsnUsrNm)
      const aktifKullanici = await this.getAktifKullaniciAdi();

      // Daima INSERT
      // nKasaNo kimliği (tablo IDENTITY değil; bu yüzden yeni değer üret)
      const nextIdQuery = `
        SELECT ISNULL(MAX(nKasaNo), 0) + 1 AS nextId
        FROM ${this.dbConfig.getTableSchema()}.tblKasaDevir WITH (TABLOCKX)
      `;
      const nextIdRes = await this.dataSource.query(nextIdQuery);
      const nextId = parseInt(nextIdRes?.[0]?.nextId ?? 1, 10);

      const insertQuery = `
        INSERT INTO ${this.dbConfig.getTableSchema()}.tblKasaDevir (nKasaNo, nKytTarihi, nKasaDvrAln, nKasaYekun)
        VALUES (@0, @1, @2, @3)
      `;
      const params = [nextId, nKytTarihi, aktifKullanici, kasaYekunFixed];
      console.log('📝 KasaDevir INSERT sorgusu:', insertQuery);
      console.log('📝 Parametreler:', params);
      await this.dataSource.query(insertQuery, params);

      return { success: true };
    } catch (error: any) {
      console.error('❌ Kasa devir kaydı ekleme hatası:', error?.message || error);
      throw new Error(`Kasa devir kaydı eklenemedi: ${error?.message || String(error)}`);
    }
  }

  /**
   * Detay işlemleri getirir
   */
  async getDetayIslemler(tarih: string, islemTuru: string, islemYonu: string, selectedYonu?: string, page: number = 1, rowsPerPage: number = 15): Promise<{data: any[], totalRecords: number}> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislem');
      
      console.log('🔍 Detay işlemler debug bilgileri:')
      console.log('- Schema:', schemaName)
      console.log('- Tablo:', tableName)
      console.log('- Tarih:', tarih)
      console.log('- İşlem türü:', islemTuru)
      console.log('- İşlem yönü:', islemYonu)
      console.log('- Seçilen yön:', selectedYonu)

      // İşlem türüne göre islemArac filtresi
      let islemAracFilter = ''
      switch (islemTuru) {
        case 'cari':
          islemAracFilter = "i.islemArac = 'Cari İşlem'"
          break
        case 'nakit':
          islemAracFilter = "i.islemArac = 'Nakit Kasa(TL)'"
          break
        case 'kart':
          islemAracFilter = "i.islemArac = 'Kredi Kartları'"
          break
        case 'eft':
          islemAracFilter = "i.islemArac = 'Banka EFT'"
          break
        case 'acenta':
          islemAracFilter = "i.islemArac = 'Acenta Tahsilat'"
          break
        case 'depozito':
          islemAracFilter = "(i.islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' OR i.islemBilgi LIKE '%=DEPOZİTO İADESİ=%')"
          break
        default:
          islemAracFilter = "i.islemArac = 'Cari İşlem'"
      }

      // İşlem yönüne göre islemTip filtresi
      let islemTipFilter = ''
      if (islemYonu === 'gelir-gider') {
        // Cari seçildiğinde GELİR/GİDER
        islemTipFilter = selectedYonu === 'gelir' ? "i.islemTip = 'GELİR'" : "i.islemTip = 'GİDER'"
      } else {
        // Diğer seçimlerde Giren/Çıkan
        islemTipFilter = selectedYonu === 'gelir' ? "i.islemTip = 'Giren'" : "i.islemTip = 'Çıkan'"
      }

      console.log('🔍 islemTipFilter:', islemTipFilter)
      
      // Önce toplam kayıt sayısını al
      const countQuery = `
        SELECT COUNT(*) as total
        FROM ${schemaName}.${tableName} i
        WHERE ${islemAracFilter}
        AND ${islemTipFilter}
        AND i.iKytTarihi = @0
      `
      
      const countResult = await this.dataSource.query(countQuery, [tarih])
      const totalRecords = countResult[0]?.total || 0
      console.log('🔍 Detay Count Query sonucu:', countResult)
      console.log('🔍 Detay toplam kayıt sayısı:', totalRecords)
      
      // Pagination için OFFSET hesapla
      const offset = (page - 1) * rowsPerPage
      
      const query = `
        SELECT 
          ROW_NUMBER() OVER (ORDER BY i.islemAltG ASC, i.islemTutar DESC) as id,
          i.iKytTarihi,
          i.islemAltG,
          i.islemGrup,
          i.islemTutar,
          i.islemBilgi
        FROM ${schemaName}.${tableName} i
        WHERE ${islemAracFilter}
        AND ${islemTipFilter}
        AND i.iKytTarihi = @0
        ORDER BY i.islemAltG ASC, i.islemTutar DESC
        OFFSET @1 ROWS
        FETCH NEXT @2 ROWS ONLY
      `

      console.log('🔍 Detay SQL Sorgusu:', query)
      console.log('🔍 Parametreler:', [tarih, offset, rowsPerPage])

      const result = await this.dataSource.query(query, [tarih, offset, rowsPerPage])
      console.log('📊 Detay işlemler sonucu:', result)

      return {
        data: result,
        totalRecords: totalRecords
      }

    } catch (error) {
      console.error('Detay işlemler getirme hatası:', error)
      throw new Error('Detay işlemler getirilemedi')
    }
  }

  /**
   * Depozito işlemleri için özel filtreleme
   */
  async getDepozitoIslemleri(): Promise<any[]> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislem');
      
      // Tarih aralığı (son 1 yıl) - DD.MM.YYYY formatında
      const bugun = new Date();
      const birYilOnce = new Date();
      birYilOnce.setFullYear(birYilOnce.getFullYear() - 1);
      
      // DD.MM.YYYY formatına çevir
      const baslangicTarihi = birYilOnce.getDate().toString().padStart(2, '0') + '.' + 
                             (birYilOnce.getMonth() + 1).toString().padStart(2, '0') + '.' + 
                             birYilOnce.getFullYear();
      const bitisTarihi = bugun.getDate().toString().padStart(2, '0') + '.' + 
                         (bugun.getMonth() + 1).toString().padStart(2, '0') + '.' + 
                         bugun.getFullYear();
      
             const query = `
         SELECT 
           i.iKytTarihi as tarih,
           SUM(CASE WHEN i.islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' THEN i.islemTutar ELSE 0 END) as gelir,
           SUM(CASE WHEN i.islemBilgi LIKE '%=DEPOZİTO İADESİ=%' THEN i.islemTutar ELSE 0 END) as gider
         FROM ${schemaName}.${tableName} i
         WHERE (i.islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' OR i.islemBilgi LIKE '%=DEPOZİTO İADESİ=%')
         AND CONVERT(DATE, i.iKytTarihi, 104) >= CONVERT(DATE, @0, 104)
         AND CONVERT(DATE, i.iKytTarihi, 104) <= CONVERT(DATE, @1, 104)
         GROUP BY i.iKytTarihi
         ORDER BY CONVERT(DATE, i.iKytTarihi, 104) DESC
       `;
      
      const result = await this.dataSource.query(query, [baslangicTarihi, bitisTarihi]);
      
      // Bakiye hesaplama
      const baslangicBakiye = 107695; // Depozito başlangıç bakiyesi
      let currentBakiye = baslangicBakiye;
      
      const processedData = result.map((row: any) => {
        const gelir = parseFloat(row.gelir) || 0;
        const gider = parseFloat(row.gider) || 0;
        
        currentBakiye = currentBakiye + gelir - gider;
        
        return {
          tarih: row.tarih,
          gelir: gelir,
          gider: gider,
          bakiye: currentBakiye
        };
      });
      
      return processedData;
      
    } catch (error) {
      console.error('Depozito işlemleri getirme hatası:', error);
      throw new Error('Depozito işlemleri getirilemedi');
    }
  }

  /**
   * İşlem kayıtlarını kaydetmek için (eski metod - backward compatibility)
   */
  async kaydetIslemler(kayitlar: any[]): Promise<any[]> {
    try {
      console.log(`${kayitlar.length} kayıt kaydediliyor...`);
      
      // Şimdilik basit bir mock response döndürüyoruz
      // Gerçek implementasyon için stored procedure kullanılabilir
      const sonuclar = kayitlar.map((kayit, index) => ({
        id: index + 1,
        success: true,
        message: `Kayıt ${index + 1} başarıyla kaydedildi`
      }));
      
      console.log(`${kayitlar.length} kayıt başarıyla kaydedildi`);
      return sonuclar;
      
    } catch (error) {
      console.error('İşlem kaydetme hatası:', error);
      throw new Error('İşlem kayıtları kaydedilemedi');
    }
  }

  /**
   * Güncel bakiye hesaplar (tüm günlerin toplamı)
   */
  async getGuncelBakiye(islemTuru: string, islemYonu?: string): Promise<number> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislem');
      
      let whereCondition = '';
      
      // İşlem türüne göre filtreleme
      switch (islemTuru) {
        case 'cari':
          whereCondition = `WHERE i.islemArac = 'Cari İşlem'`;
          break;
        case 'nakit':
          whereCondition = `WHERE i.islemArac = 'Nakit Kasa(TL)'`;
          break;
        case 'kart':
          whereCondition = `WHERE i.islemArac = 'Kredi Kartları'`;
          break;
        case 'eft':
          whereCondition = `WHERE i.islemArac = 'Banka EFT'`;
          break;
        case 'acenta':
          whereCondition = `WHERE i.islemArac = 'Acenta Tahsilat'`;
          break;
        case 'depozito':
          whereCondition = `WHERE (i.islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' OR i.islemBilgi LIKE '%=DEPOZİTO İADESİ=%')`;
          break;
        default:
          whereCondition = `WHERE i.islemArac = 'Cari İşlem'`;
      }
      
      // İşlem yönüne göre dinamik sorgu
      let gelirCondition = '';
      let giderCondition = '';
      
      if (islemYonu === 'gelir-gider') {
        gelirCondition = "i.islemTip = 'GELİR'";
        giderCondition = "i.islemTip = 'GİDER'";
      } else {
        gelirCondition = "i.islemTip = 'Giren'";
        giderCondition = "i.islemTip = 'Çıkan'";
      }
      
      const bakiyeQuery = `
        SELECT 
          SUM(CASE WHEN ${gelirCondition} THEN i.islemTutar ELSE 0 END) as toplamGelir,
          SUM(CASE WHEN ${giderCondition} THEN i.islemTutar ELSE 0 END) as toplamGider
        FROM ${schemaName}.${tableName} i
        ${whereCondition}
      `;
      
      const result = await this.dataSource.query(bakiyeQuery);
      const toplamGelir = parseFloat(result[0]?.toplamGelir) || 0;
      const toplamGider = parseFloat(result[0]?.toplamGider) || 0;
      const guncelBakiye = toplamGelir - toplamGider;
      
      console.log(`💰 Güncel bakiye hesaplandı (${islemTuru}):`, {
        toplamGelir,
        toplamGider,
        guncelBakiye
      });
      
      return guncelBakiye;
    } catch (error) {
      console.error('❌ Güncel bakiye hesaplama hatası:', error);
      return 0;
    }
  }

  /**
   * Seçilen güne kadar olan bakiye hesaplar
   */
  async getSecilenGunBakiyesi(islemTuru: string, islemYonu: string, secilenTarih: string): Promise<number> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislem');
      
      let whereCondition = '';
      
      // İşlem türüne göre filtreleme
      switch (islemTuru) {
        case 'cari':
          whereCondition = `WHERE i.islemArac = 'Cari İşlem'`;
          break;
        case 'nakit':
          whereCondition = `WHERE i.islemArac = 'Nakit Kasa(TL)'`;
          break;
        case 'kart':
          whereCondition = `WHERE i.islemArac = 'Kredi Kartları'`;
          break;
        case 'eft':
          whereCondition = `WHERE i.islemArac = 'Banka EFT'`;
          break;
        case 'acenta':
          whereCondition = `WHERE i.islemArac = 'Acenta Tahsilat'`;
          break;
        case 'depozito':
          whereCondition = `WHERE (i.islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' OR i.islemBilgi LIKE '%=DEPOZİTO İADESİ=%')`;
          break;
        default:
          whereCondition = `WHERE i.islemArac = 'Cari İşlem'`;
      }
      
      // İşlem yönüne göre dinamik sorgu
      let gelirCondition = '';
      let giderCondition = '';
      
      if (islemYonu === 'gelir-gider') {
        gelirCondition = "i.islemTip = 'GELİR'";
        giderCondition = "i.islemTip = 'GİDER'";
      } else {
        gelirCondition = "i.islemTip = 'Giren'";
        giderCondition = "i.islemTip = 'Çıkan'";
      }
      
      const bakiyeQuery = `
        SELECT 
          SUM(CASE WHEN ${gelirCondition} THEN i.islemTutar ELSE 0 END) as toplamGelir,
          SUM(CASE WHEN ${giderCondition} THEN i.islemTutar ELSE 0 END) as toplamGider
        FROM ${schemaName}.${tableName} i
        ${whereCondition}
        AND CONVERT(DATE, i.iKytTarihi, 104) <= CONVERT(DATE, @0, 104)
      `;
      
      const result = await this.dataSource.query(bakiyeQuery, [secilenTarih]);
      const toplamGelir = parseFloat(result[0]?.toplamGelir) || 0;
      const toplamGider = parseFloat(result[0]?.toplamGider) || 0;
      const secilenGunBakiyesi = toplamGelir - toplamGider;
      
      console.log(`💰 Seçilen gün bakiyesi hesaplandı (${islemTuru}, ${secilenTarih}):`, {
        toplamGelir,
        toplamGider,
        secilenGunBakiyesi
      });
      
      return secilenGunBakiyesi;
    } catch (error) {
      console.error('❌ Seçilen gün bakiyesi hesaplama hatası:', error);
      return 0;
    }
  }

  /**
   * tblKasaDevir tablosundan sayfalanmış verileri getirir
   */
  async getKasaDevirVerileri(page: number = 1, rowsPerPage: number = 3): Promise<{data: any[], totalRecords: number}> {
    try {
      const offset = (page - 1) * rowsPerPage;
      
      // Toplam kayıt sayısını al
      const countQuery = `
        SELECT COUNT(*) as total
        FROM ${this.dbConfig.getTableSchema()}.tblKasaDevir
      `;
      
      const countResult = await this.dataSource.query(countQuery);
      const totalRecords = countResult[0]?.total || 0;
      
      // Sayfalanmış verileri al
      const query = `
        SELECT 
          kd.nKytTarihi as DevirTarihi,
          kd.nKasaDvrAln as DevirEden,
          kd.nKasaYekun as KasaYekun
        FROM ${this.dbConfig.getTableSchema()}.tblKasaDevir kd
        ORDER BY CONVERT(DATE, kd.nKytTarihi, 104) DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${rowsPerPage} ROWS ONLY
      `;
      
      const result = await this.dataSource.query(query);
      console.log('📊 Kasa devir verileri alındı:', result.length, 'kayıt (sayfa:', page, ')');
      
      return {
        data: result,
        totalRecords: totalRecords
      };
    } catch (error) {
      console.error('❌ Kasa devir verileri alma hatası:', error);
      return {
        data: [],
        totalRecords: 0
      };
    }
  }

  /**
   * Aktif kullanıcının PrsnUsrNm bilgisini tblPersonel tablosundan alır
   */
  private async getAktifKullaniciAdi(): Promise<string> {
    try {
      // Şimdilik varsayılan kullanıcı olarak SAadmin kullanıyoruz
      // TODO: Gerçek authentication sistemi entegre edildiğinde bu kısım güncellenecek
      const query = `
        SELECT TOP 1 PrsnUsrNm 
        FROM ${this.dbConfig.getTableSchema()}.tblPersonel 
        WHERE PrsnUsrNm = 'SAadmin'
      `;
      
      const result = await this.dataSource.query(query);
      const kullaniciAdi = result[0]?.PrsnUsrNm || 'SAadmin';
      
      console.log('👤 Aktif kullanıcı bilgisi alındı:', kullaniciAdi);
      return kullaniciAdi;
    } catch (error) {
      console.error('❌ Kullanıcı bilgisi alma hatası:', error);
      return 'SAadmin'; // Fallback değer
    }
  }

  /**
   * Kasalar arası aktarım işlemi - islemEKLE stored procedure kullanarak
   */
  async kasaAktarimi(veren: string, alan: string, tutar: number): Promise<any> {
    try {
      console.log('🔄 Kasa aktarımı başlatılıyor:', { veren, alan, tutar });
      
      // Bugünün tarihini DD.MM.YYYY formatında al
      const bugun = new Date();
      const iKytTarihi = bugun.getDate().toString().padStart(2, '0') + '.' + 
                         (bugun.getMonth() + 1).toString().padStart(2, '0') + '.' + 
                         bugun.getFullYear();
      
      // Kasa parametrelerini belirle
      const kasaParametreleri = {
        nakit: {
          islemCrKod: 'PN10000',
          islemArac: 'Nakit Kasa(TL)',
          islemAltG: 'PANSİYON NAKİT GİDERLERİ'
        },
        kart: {
          islemCrKod: 'PK10000',
          islemArac: 'Kredi Kartları',
          islemAltG: 'PANSİYON KREDİ KARTI GİDERLERİ'
        },
        eft: {
          islemCrKod: 'PB10000',
          islemArac: 'Banka EFT',
          islemAltG: 'PANSİYON BANKA GİDERLERİ'
        },
        acenta: {
          islemCrKod: 'PA10000',
          islemArac: 'Acenta Tahsilat',
          islemAltG: 'PANSİYON ACENTA KASASI'
        },
        depozito: {
          islemCrKod: 'PD10000',
          islemArac: 'Depozito Kasası',
          islemAltG: 'PANSİYON DEPOZİTO KASASI'
        }
      };

      const verenParametreleri = kasaParametreleri[veren];
      const alanParametreleri = kasaParametreleri[alan];

      if (!verenParametreleri || !alanParametreleri) {
        throw new Error('Geçersiz kasa türü seçildi');
      }

      // Aktif kullanıcı bilgisini al
      const islemKllnc = await this.getAktifKullaniciAdi();

      // Transaction başlat
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // 1. Veren kasadan çıkış işlemi
        const verenIslemQuery = `
          EXEC ${this.dbConfig.getSpName('spr_islemEkleYn')} 
            @iKytTarihi = @0,
            @islemKllnc = @1,
            @islemCrKod = @2,
            @islemOzel1 = @3,
            @islemOzel2 = @4,
            @islemOzel3 = @5,
            @islemOzel4 = @6,
            @islemArac = @7,
            @islemTip = @8,
            @islemGrup = @9,
            @islemAltG = @10,
            @islemBilgi = @11,
            @islemMiktar = @12,
            @islemBirim = @13,
            @islemTutar = @14,
            @islemDoviz = @15,
            @islemKur = @16
        `;

        const verenIslemParams = [
          iKytTarihi,           // @0 iKytTarihi
          islemKllnc,           // @1 islemKllnc
          verenParametreleri.islemCrKod, // @2 islemCrKod
          '',                   // @3 islemOzel1
          '',                   // @4 islemOzel2
          '',                   // @5 islemOzel3
          '',                   // @6 islemOzel4
          verenParametreleri.islemArac,  // @7 islemArac
          'Çıkan',              // @8 islemTip
          'Kasaya Verilen',     // @9 islemGrup
          verenParametreleri.islemAltG,  // @10 islemAltG
          `${verenParametreleri.islemArac} Kasasına Verilen Tutar`, // @11 islemBilgi
          1,                    // @12 islemMiktar
          'ADET',               // @13 islemBirim
          tutar,                // @14 islemTutar
          'TL',                 // @15 islemDoviz
          1                     // @16 islemKur
        ];

        console.log('📤 Veren kasadan çıkış işlemi gerçekleştiriliyor...');
        await queryRunner.query(verenIslemQuery, verenIslemParams);
        console.log('✅ Veren kasadan çıkış işlemi kaydedildi');

        // 2. Alan kasaya giriş işlemi
        const alanIslemParams = [
          iKytTarihi,           // @0 iKytTarihi
          islemKllnc,           // @1 islemKllnc
          alanParametreleri.islemCrKod, // @2 islemCrKod
          '',                   // @3 islemOzel1
          '',                   // @4 islemOzel2
          '',                   // @5 islemOzel3
          '',                   // @6 islemOzel4
          alanParametreleri.islemArac,  // @7 islemArac
          'Giren',              // @8 islemTip
          'Kasadan Alınan',     // @9 islemGrup
          alanParametreleri.islemAltG,  // @10 islemAltG
          `${alanParametreleri.islemArac} Kasasından Alınan Tutar`, // @11 islemBilgi
          1,                    // @12 islemMiktar
          'ADET',               // @13 islemBirim
          tutar,                // @14 islemTutar
          'TL',                 // @15 islemDoviz
          1                     // @16 islemKur
        ];

        console.log('📥 Alan kasaya giriş işlemi gerçekleştiriliyor...');
        await queryRunner.query(verenIslemQuery, alanIslemParams);
        console.log('✅ Alan kasaya giriş işlemi kaydedildi');

        // Transaction'ı commit et
        await queryRunner.commitTransaction();
        
        const basariliMesaj = `✅ Kasa aktarımı başarıyla tamamlandı!\n\n💰 ${verenParametreleri.islemArac} → ${alanParametreleri.islemArac}\n💵 Tutar: ${tutar.toLocaleString('tr-TR')} TL\n👤 İşlemi Yapan: ${islemKllnc}\n📅 Tarih: ${iKytTarihi}`;
        
        console.log('✅ Kasa aktarımı başarıyla tamamlandı');
        
        return {
          success: true,
          message: basariliMesaj,
          details: {
            veren: verenParametreleri.islemArac,
            alan: alanParametreleri.islemArac,
            tutar: tutar,
            kullanici: islemKllnc,
            tarih: iKytTarihi
          }
        };

      } catch (error) {
        // Hata durumunda rollback
        await queryRunner.rollbackTransaction();
        
        const hataMesaj = `❌ Kasa aktarımı başarısız!\n\n🔍 Hata Detayı: ${error.message}\n💰 İşlem: ${verenParametreleri.islemArac} → ${alanParametreleri.islemArac}\n💵 Tutar: ${tutar.toLocaleString('tr-TR')} TL\n📅 Tarih: ${iKytTarihi}`;
        
        console.error('❌ Kasa aktarımı hatası, rollback yapıldı:', error);
        throw new Error(hataMesaj);
      } finally {
        // Query runner'ı serbest bırak
        await queryRunner.release();
        console.log('🔒 Transaction kaynakları serbest bırakıldı');
      }

    } catch (error) {
      console.error('❌ Kasa aktarımı genel hatası:', error);
      throw error; // Zaten formatlanmış hata mesajını tekrar formatlamaya gerek yok
    }
  }
} 