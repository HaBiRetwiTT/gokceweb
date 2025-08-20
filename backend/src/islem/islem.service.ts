import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DatabaseConfigService } from '../database/database-config.service';
import * as PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';

// Types for stronger typing and to avoid any-unsafe lint warnings
type KasaGunlukOzet = { tarih: string; gelir: number; gider: number };
type DetayIslem = {
  id: number;
  islemNo?: number;
  iKytTarihi: string;
  islemAltG: string;
  islemGrup: string;
  islemTutar: number;
  islemBilgi: string;
};
type KasaDevirKaydi = {
  DevirTarihi: string;
  DevirEden: string;
  KasaYekun: number;
};

@Injectable()
export class IslemService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly dbConfig: DatabaseConfigService,
  ) {}

  /**
   * Nakit akış verilerini sp_FonDokumY stored procedure ile getirir
   * @param tarih DD.MM.YYYY formatında tarih
   * @returns Nakit akış kayıtları
   */
  async getNakitAkisByDate(tarih: string): Promise<any[]> {
    try {
      // Tarih formatını kontrol et (DD.MM.YYYY)
      if (!this.isValidDateFormat(tarih)) {
        throw new Error(`Geçersiz tarih formatı: ${tarih}. Beklenen format: DD.MM.YYYY`);
      }

      const spName = this.dbConfig.getSpName('sp_FonDokumY');
      const queryRunner = this.dataSource.createQueryRunner();
      
      try {
        await queryRunner.connect();
        
        // Stored procedure'ü çağır
        const execQuery = `EXEC ${spName} @SecTarih = '${tarih}'`;
        
        const result = await queryRunner.query(execQuery);
        
        // Verileri frontend'in beklediği formata dönüştür
        if (result && Array.isArray(result)) {
          const mappedData = result.map((row: any, index: number) => {
            const convertedOdmVade = this.convertExcelDateToDDMMYYYY(row.OdVade);
            
            return {
              id: index + 1,
              OdmVade: convertedOdmVade,
              odemeAraci: row.islmArac || '',
              kategori: row.islmGrup || '',
              aciklama: row.islmAltG || '',
              tip: row.islmTip || '',
              tutar: this.parseAmount(row.islmTtr),
              taksit: row.islmTkst || '',
              digerBilgiler: row.islmBilgi || '',
              odemeDurumu: row.OdmDrm === true || row.OdmDrm === 1 || row.OdmDrm === '1',
              tutarDurumu: row.ttrDrm === true || row.ttrDrm === 1 || row.ttrDrm === '1'
            };
          });
          
          return mappedData;
        }
        
        return result || [];
        
      } finally {
        await queryRunner.release();
      }
      
    } catch (error) {
      throw new Error(`Nakit akış verileri alınamadı: ${error.message}`);
    }
  }

  /**
   * tblFonKasaY tablosundan islmGrup seçimine göre islmAltG distinct listesi getirir
   * @param islmGrup İslm grubu (islmGrup alanı)
   * @returns İslm alt grupları listesi
   */
  async getIslmAltGruplar(islmGrup: string): Promise<string[]> {
    try {
      if (!islmGrup) {
        throw new Error('İslm grubu parametresi gerekli');
      }

      const queryRunner = this.dataSource.createQueryRunner();
      
      try {
        await queryRunner.connect();
        
        // tblFonKasaY tablosundan islmGrup alanına göre islmAltG distinct listesi
        const query = `
          SELECT DISTINCT islmAltG 
          FROM [gokcepansiyon2010].[harunta].[tblFonKasaY] 
          WHERE islmGrup = '${islmGrup}' 
          ORDER BY islmAltG
        `;
        
        const result = await queryRunner.query(query);
        
        // Sonuçları string array olarak döndür
        if (result && Array.isArray(result)) {
          return result.map((row: any) => row.islmAltG || '').filter((value: string) => value !== '');
        }
        
        return [];
        
      } finally {
        await queryRunner.release();
      }
      
    } catch (error) {
      throw new Error(`İslm alt grupları alınamadı: ${error.message}`);
    }
  }

  /**
   * Tutar alanını parse eder ve number'a çevirir
   * @param amount Tutar değeri (string veya number olabilir)
   * @returns Parse edilmiş tutar
   */
  private parseAmount(amount: any): number {
    if (amount === null || amount === undefined) return 0;
    
    if (typeof amount === 'number') return amount;
    
    if (typeof amount === 'string') {
      // "₺ 16.500,00" formatındaki string'i temizle
      const cleaned = amount.replace(/[₺\s]/g, '').replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    return 0;
  }

  /**
   * Tarih formatının geçerli olup olmadığını kontrol eder
   * @param tarih Kontrol edilecek tarih string'i
   * @returns Geçerli ise true
   */
  private isValidDateFormat(tarih: string): boolean {
    const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
    if (!dateRegex.test(tarih)) {
      return false;
    }
    
    const parts = tarih.split('.');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    // Basit tarih validasyonu
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
      return false;
    }
    
    return true;
  }

  /**
   * Kasa işlemleri için günlük toplamları getirir
   */
  async getKasaIslemleri(
    islemArac: string,
    islemTip?: string,
    page: number = 1,
    rowsPerPage: number = 15,
  ): Promise<{ data: KasaGunlukOzet[]; totalRecords: number }> {
    try {
      console.log('🔍 getKasaIslemleri çağrıldı:', { islemArac, islemTip, page, rowsPerPage })
      console.log('🔍 getKasaIslemleri parametreleri:', { 
        islemArac: typeof islemArac, 
        islemTip: typeof islemTip, 
        page: typeof page, 
        rowsPerPage: typeof rowsPerPage 
      })
      
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislem');
      
      console.log('🔍 Veritabanı bilgileri:', { schemaName, tableName })

      // Tarih filtresi kaldırıldı - sadece islemArac ve islemTip seçimlerine göre günlük gruplama

      // İşlem türü filtresi (6'lı radio için islemArac alanı)
      let islemAracFilter = '';
      if (islemArac) {
        // Frontend'den gelen değerleri veritabanındaki gerçek değerlere eşleştir
        let dbIslemArac = '';
        switch (islemArac) {
          case 'cari':
            dbIslemArac = 'Cari İşlem';
            break;
          case 'nakit':
            dbIslemArac = 'Nakit Kasa(TL)';
            break;
          case 'kart':
            dbIslemArac = 'Kredi Kartları';
            break;
          case 'eft':
            dbIslemArac = 'Banka EFT';
            break;
          case 'acenta':
            dbIslemArac = 'Acenta Tahsilat';
            break;
          case 'depozito':
            dbIslemArac = 'Depozito';
            break;
          default:
            dbIslemArac = islemArac;
        }
        islemAracFilter = `AND islemArac = '${dbIslemArac}'`;
      }

      // İşlem yönü filtresi (2'li radio için islemTip alanı) - ANA TABLO İÇİN GEREKSİZ
      let islemTipFilter = '';
      // Ana tablo günlük özet olduğu için islemTip filtresi eklenmiyor
      // Detay tabloda islemTip filtresi kullanılıyor

      console.log('🔍 Filtreler:', { islemAracFilter, islemTipFilter })

      // Toplam kayıt sayısını al
      const countQuery = `
        SELECT COUNT(*) as total
        FROM ${schemaName}.${tableName}
        WHERE 1=1
        ${islemAracFilter}
      `;

      console.log('🔍 Count Query:', countQuery)

      const countResult = await this.dataSource.query(countQuery);
      const totalRecords = countResult[0]?.total || 0;

      console.log('🔍 Toplam kayıt sayısı:', totalRecords)

      // Sayfalama hesaplamaları
      const offset = (page - 1) * rowsPerPage;

      // Ana sorgu
      const query = `
        SELECT 
          CONVERT(VARCHAR(10), iKytTarihi, 104) as iKytTarihi,
          SUM(CASE WHEN ${islemArac === 'cari' ? "islemTip = 'GELİR'" : "islemTip = 'Giren'"} THEN islemTutar ELSE 0 END) as gelir,
          SUM(CASE WHEN ${islemArac === 'cari' ? "islemTip = 'GİDER'" : "islemTip = 'Çıkan'"} THEN islemTutar ELSE 0 END) as gider
        FROM ${schemaName}.${tableName}
        WHERE 1=1
        ${islemAracFilter}
        GROUP BY CONVERT(VARCHAR(10), iKytTarihi, 104), CONVERT(DATE, iKytTarihi, 104)
        ORDER BY CONVERT(DATE, iKytTarihi, 104) DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${rowsPerPage} ROWS ONLY
      `;

      console.log('🔍 Ana Query:', query)

      const params = [];
      
      const result = await this.dataSource.query(query, params);

      console.log('🔍 Query sonucu:', result)

      return {
        data: result.map((row: any) => ({
          tarih: row.iKytTarihi,
          gelir: parseFloat(row.gelir) || 0,
          gider: parseFloat(row.gider) || 0,
        })),
        totalRecords,
      };
    } catch (error) {
      console.error('❌ getKasaIslemleri hatası:', error)
      throw new Error(`Kasa işlemleri alınamadı: ${error.message}`);
    }
  }

  /**
   * Kasa devri kaydı ekler (tblKasaDevir)
   */
  async saveKasaDevir(
    kasaYekun: number,
    overrideKullanici?: string,
  ): Promise<{ success: boolean }> {
    try {
      if (!Number.isFinite(kasaYekun)) {
        throw new Error('Geçersiz kasa tutarı');
      }
      // Nokta/virgül ve TL içeren stringleri normalize et
      const normalizeKasaYekun = (val: number | string): string => {
        if (typeof val === 'number') {
          return Number.isFinite(val) ? val.toFixed(2) : '0.00';
        }
        const raw = String(val || '').trim();
        if (!raw) return '0.00';
        const cleaned = raw.replace(/[₺\s]/g, '');
        let num = 0;
        if (cleaned.includes(',') && /,\d{1,2}$/.test(cleaned)) {
          num = Number(cleaned.replace(/\./g, '').replace(',', '.'));
        } else {
          const noThousands = cleaned.replace(/,(?=\d{3}(?:\D|$))/g, '');
          num = Number(noThousands);
        }
        return Number.isFinite(num) ? num.toFixed(2) : '0.00';
      };
      const kasaYekunFixed = normalizeKasaYekun(kasaYekun);
      // Tarihi DD.MM.YYYY formatında hazırla (nchar(10))
      const bugun = new Date();
      const nKytTarihi =
        bugun.getDate().toString().padStart(2, '0') +
        '.' +
        (bugun.getMonth() + 1).toString().padStart(2, '0') +
        '.' +
        bugun.getFullYear();

      // Aktif kullanıcı adı (tblPersonel.PrsnUsrNm) - override öncelikli
      let aktifKullanici =
        (overrideKullanici && String(overrideKullanici).trim()) ||
        (await this.getAktifKullaniciAdi());
      // Kullanıcıyı tblPersonel'de doğrula ve varsa PrsnUsrNm tam değeriyle yaz
      try {
        const prsnQuery = `SELECT TOP 1 PrsnUsrNm FROM ${this.dbConfig.getTableSchema()}.tblPersonel WHERE PrsnUsrNm = @0`;
        const prsnUnknown = (await this.dataSource.query(prsnQuery, [
          aktifKullanici,
        ])) as unknown;
        const prsn = prsnUnknown as Array<{ PrsnUsrNm: string }>;
        if (prsn && prsn[0]?.PrsnUsrNm) {
          aktifKullanici = prsn[0].PrsnUsrNm;
        }
      } catch {
        // ignore
      }

      // nKasaNo sütunu bazı ortamlarda IDENTITY, bazı ortamlarda manuel olabilir.
      // Dinamik tespit et ve uygun INSERT stratejisini uygula.
      const tableFullName = `${this.dbConfig.getTableSchema()}.tblKasaDevir`;
      const identityCheckQuery = `SELECT COLUMNPROPERTY(OBJECT_ID('${tableFullName}'),'nKasaNo','IsIdentity') as isIdentity`;
      const idChkUnknown = (await this.dataSource.query(
        identityCheckQuery,
      )) as unknown;
      const idChk = idChkUnknown as Array<{
        isIdentity: number | string | null;
      }>;
      const isIdentity = Number(idChk?.[0]?.isIdentity ?? 0) === 1;

      if (isIdentity) {
        const insertQuery = `
          INSERT INTO ${tableFullName} (nKytTarihi, nKasaDvrAln, nKasaYekun)
          VALUES (@0, @1, TRY_CONVERT(DECIMAL(18,2), CAST(@2 AS NVARCHAR(50))))
        `;
        const params = [nKytTarihi, aktifKullanici, String(kasaYekunFixed)];
        await this.dataSource.query(insertQuery, params);
      } else {
        const nextIdQuery = `
          SELECT ISNULL(MAX(nKasaNo), 0) + 1 AS nextId
          FROM ${tableFullName} WITH (TABLOCKX)
        `;
        const nextIdResUnknown = (await this.dataSource.query(
          nextIdQuery,
        )) as unknown;
        const nextIdRes = nextIdResUnknown as Array<{
          nextId: number | string;
        }>;
        const nextId = parseInt(String(nextIdRes?.[0]?.nextId ?? 1), 10);

        const insertQuery = `
          INSERT INTO ${tableFullName} (nKasaNo, nKytTarihi, nKasaDvrAln, nKasaYekun)
          VALUES (CAST(@0 AS BIGINT), @1, @2, TRY_CONVERT(DECIMAL(18,2), CAST(@3 AS NVARCHAR(50))))
        `;
        const params = [
          String(nextId),
          nKytTarihi,
          aktifKullanici,
          String(kasaYekunFixed),
        ];
        await this.dataSource.query(insertQuery, params);
      }

      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Kasa devir kaydı ekleme hatası:', message);
      throw new Error(`Kasa devir kaydı eklenemedi: ${message}`);
    }
  }

  /**
   * Detay işlemleri getirir
   */
  async getDetayIslemler(
    tarih: string,
    islemArac: string,
    islemTip: string,
    page: number = 1,
    rowsPerPage: number = 15,
  ): Promise<{ data: DetayIslem[]; totalRecords: number }> {
    try {
      console.log('🔍 getDetayIslemler çağrıldı:', { tarih, islemArac, islemTip, page, rowsPerPage })
      console.log('🔍 getDetayIslemler parametreleri:', { 
        tarih: typeof tarih, 
        islemArac: typeof islemArac, 
        islemTip: typeof islemTip, 
        page: typeof page, 
        rowsPerPage: typeof rowsPerPage 
      })
      
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislem');
      
      console.log('🔍 Detay veritabanı bilgileri:', { schemaName, tableName })

      // İşlem türü filtresi (6'lı radio için islemArac alanı)
      let islemAracFilter = '';
      if (islemArac) {
        // Frontend'den gelen değerleri veritabanındaki gerçek değerlere eşleştir
        let dbIslemArac = '';
        switch (islemArac) {
          case 'cari':
            dbIslemArac = 'Cari İşlem';
            break;
          case 'nakit':
            dbIslemArac = 'Nakit Kasa(TL)';
            break;
          case 'kart':
            dbIslemArac = 'Kredi Kartları';
            break;
          case 'eft':
            dbIslemArac = 'Banka EFT';
            break;
          case 'acenta':
            dbIslemArac = 'Acenta Tahsilat';
            break;
          case 'depozito':
            dbIslemArac = 'Depozito';
            break;
          default:
            dbIslemArac = islemArac;
        }
        islemAracFilter = `AND islemArac = '${dbIslemArac}'`;
      }

      // İşlem yönü filtresi (2'li radio için islemTip alanı)
      let islemTipFilter = '';
      if (islemTip) {
        // Frontend'den gelen islemTip değerini islemArac seçimine göre doğru veritabanı değerine çevir
        let dbIslemTip = '';
        if (islemArac === 'cari') {
          // Cari İşlem için GELİR/GİDER kullan
          dbIslemTip = islemTip === 'GELİR' ? 'GELİR' : 'GİDER';
        } else {
          // Diğer islemArac seçimleri için Giren/Çıkan kullan
          dbIslemTip = islemTip === 'Giren' ? 'Giren' : 'Çıkan';
        }
        islemTipFilter = `AND islemTip = '${dbIslemTip}'`;
      }

      console.log('🔍 Detay filtreler:', { islemAracFilter, islemTipFilter })
      console.log('🔍 Tarih parametresi:', { 
        tarih: tarih, 
        tarihTipi: typeof tarih,
        tarihUzunluk: tarih ? tarih.length : 0
      })

      // Toplam kayıt sayısını al
      const countQuery = `
        SELECT COUNT(*) as total
        FROM ${schemaName}.${tableName}
        WHERE CONVERT(DATE, iKytTarihi, 104) = CONVERT(DATE, @0, 104)
        ${islemAracFilter}
        ${islemTipFilter}
      `;

      console.log('🔍 Detay Count Query:', countQuery)

      const countParams = [tarih];
      console.log('🔍 Count Query parametreleri:', countParams);
      const countDetay = await this.dataSource.query(countQuery, countParams);
      const totalRecords = countDetay[0]?.total || 0;

      console.log('🔍 Detay toplam kayıt sayısı:', totalRecords)

      // Sayfalama hesaplamaları
      const offset = (page - 1) * rowsPerPage;

      // Ana sorgu
      const query = `
        SELECT 
          islemNo,
          iKytTarihi,
          islemAltG as islemAltG,
          islemGrup as islemGrup,
          islemTutar as islemTutar,
          islemBilgi as islemBilgi
        FROM ${schemaName}.${tableName}
        WHERE CONVERT(DATE, iKytTarihi, 104) = CONVERT(DATE, @0, 104)
        ${islemAracFilter}
        ${islemTipFilter}
        ORDER BY islemNo DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${rowsPerPage} ROWS ONLY
      `;

      console.log('🔍 Detay Ana Query:', query)
      console.log('🔍 Tarih parametresi (ana sorgu):', { 
        tarih: tarih, 
        tarihTipi: typeof tarih,
        tarihUzunluk: tarih ? tarih.length : 0,
        tarihDeger: tarih
      })

      const params = [tarih, offset, rowsPerPage];
      console.log('🔍 Query parametreleri:', params);
      const result = await this.dataSource.query(query, params);

      console.log('🔍 Detay Query sonucu:', result)

      return {
        data: result.map((row: any) => ({
          id: row.id,
          islemNo: row.islemNo,
          iKytTarihi: row.iKytTarihi,
          islemAltG: row.islemAltG,
          islemGrup: row.islemGrup,
          islemTutar: parseFloat(row.islemTutar) || 0,
          islemBilgi: row.islemBilgi,
        })),
        totalRecords,
      };
    } catch (error) {
      console.error('❌ getDetayIslemler hatası:', error)
      throw new Error(`Detay işlemler alınamadı: ${error.message}`);
    }
  }

  // Detay PDF üretimi
  async generateDetayPDF(
    tarih: string,
    islemArac: string,
    islemTip: string,
  ): Promise<Buffer> {
    const data = await this.getDetayIslemler(
      tarih,
      islemArac,
      islemTip,
      1,
      10000,
    );
    return await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 36 });
      let turkishFontLoaded = false;
      try {
        // Türkçe karakter uyumu için mevcut fontu kaydetmeye çalış
        const fontPathCandidates = [
          './fonts/DejaVuSans.ttf',
          './backend/fonts/DejaVuSans.ttf',
          require('path').join(process.cwd(), 'fonts/DejaVuSans.ttf'),
          require('path').join(process.cwd(), 'backend/fonts/DejaVuSans.ttf'),
        ];
        const fs = require('fs');
        for (const p of fontPathCandidates) {
          if (p && fs.existsSync(p)) {
            doc.registerFont('Turkish', p);
            doc.font('Turkish');
            turkishFontLoaded = true;
            break;
          }
        }
      } catch {
        // Varsayılan font kalsın
      }
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Başlık ve metinlerde daima Türkçe desteği olan fontu kullan (yüklendiyse)
      if (turkishFontLoaded) {
        doc.font('Turkish');
      }
      doc.fontSize(14).text('Detay İşlemler', { align: 'center' });
      doc.moveDown(0.5);
      const turLabelMap: Record<string, string> = {
        cari: 'Cari',
        nakit: 'Nakit',
        kart: 'Kart',
        eft: 'EFT',
        acenta: 'Acenta',
        depozito: 'Depozito',
      };
      const turLabel =
        turLabelMap[String(islemArac).toLowerCase()] || islemArac;
      const yonLabel =
        String(islemTip) === 'GELİR' || String(islemTip) === 'Giren'
          ? 'GELİR'
          : 'GİDER';
      doc
        .fontSize(10)
        .text(`Tarih: ${tarih}  |  Tür: ${turLabel}  |  Yön: ${yonLabel}`);
      doc.moveDown();

      // Basit tablo yerleşimi: sabit kolon genişlikleri ve satır yüksekliği hesaplama
      const marginLeft = doc.page.margins.left;
      const marginRight = doc.page.margins.right;
      const contentWidth = doc.page.width - marginLeft - marginRight;
      const startX = marginLeft;
      let y = doc.y + 4;

      // Kolonlar: Tarih | No | Alt Grup | Grup | Tutar | Bilgi
      const colWidths = {
        tarih: 70,
        no: 55,
        altGrup: 140,
        grup: 60,
        tutar: 50,
      } as const;
      const colGap = 10; // Tutar ile Bilgi sütunu arasına ekstra boşluk
      const usedWidth =
        colWidths.tarih +
        colWidths.no +
        colWidths.altGrup +
        colWidths.grup +
        colWidths.tutar +
        colGap;
      const bilgiWidth = Math.max(120, contentWidth - usedWidth - 5); // kalan genişlik (gap dahil)

      // Hücre yazma yardımcı fonksiyonu
      const writeCell = (
        text: string,
        x: number,
        width: number,
        align: 'left' | 'right' = 'left',
      ) => {
        doc.text(text ?? '', x, y, { width, align });
        return doc.heightOfString(text ?? '', { width });
      };

      // Başlık satırı
      doc.fontSize(11).text('', startX, y); // y'yi kilitle
      const headerHeight = Math.max(
        writeCell('Tarih', startX, colWidths.tarih),
        writeCell('İşlem No', startX + colWidths.tarih, colWidths.no),
        writeCell(
          'Cari Adı',
          startX + colWidths.tarih + colWidths.no,
          colWidths.altGrup,
        ),
        writeCell(
          'İşlem Tipi',
          startX + colWidths.tarih + colWidths.no + colWidths.altGrup,
          colWidths.grup,
        ),
        writeCell(
          'Tutar',
          startX +
            colWidths.tarih +
            colWidths.no +
            colWidths.altGrup +
            colWidths.grup,
          colWidths.tutar,
          'right',
        ),
        writeCell(
          'Bilgi',
          startX +
            colWidths.tarih +
            colWidths.no +
            colWidths.altGrup +
            colWidths.grup +
            colWidths.tutar +
            colGap,
          bilgiWidth,
        ),
      );
      y += headerHeight + 6;
      doc
        .moveTo(startX, y - 2)
        .lineTo(startX + contentWidth, y - 2)
        .strokeColor('#aaaaaa')
        .lineWidth(0.5)
        .stroke();

      // Satırlar
      doc.fontSize(10);
      for (const r of data.data) {
        // Sayfa sonu kontrol
        const estimatedRowHeight = Math.max(
          doc.heightOfString(String(r.iKytTarihi || ''), {
            width: colWidths.tarih,
          }),
          doc.heightOfString(String(r.islemNo ?? ''), { width: colWidths.no }),
          doc.heightOfString(String(r.islemAltG || ''), {
            width: colWidths.altGrup,
          }),
          doc.heightOfString(String(r.islemGrup || ''), {
            width: colWidths.grup,
          }),
          doc.heightOfString(
            (Number(r.islemTutar) || 0).toLocaleString('tr-TR'),
            { width: colWidths.tutar },
          ),
          doc.heightOfString(String(r.islemBilgi || ''), { width: bilgiWidth }),
        );
        if (
          y + estimatedRowHeight >
          doc.page.height - doc.page.margins.bottom
        ) {
          doc.addPage();
          y = doc.page.margins.top;
        }

        const h = Math.max(
          writeCell(String(r.iKytTarihi || ''), startX, colWidths.tarih),
          writeCell(
            String(r.islemNo ?? ''),
            startX + colWidths.tarih,
            colWidths.no,
          ),
          writeCell(
            String(r.islemAltG || ''),
            startX + colWidths.tarih + colWidths.no,
            colWidths.altGrup,
          ),
          writeCell(
            String(r.islemGrup || ''),
            startX + colWidths.tarih + colWidths.no + colWidths.altGrup,
            colWidths.grup,
          ),
          writeCell(
            (Number(r.islemTutar) || 0).toLocaleString('tr-TR'),
            startX +
              colWidths.tarih +
              colWidths.no +
              colWidths.altGrup +
              colWidths.grup,
            colWidths.tutar,
            'right',
          ),
          writeCell(
            String(r.islemBilgi || ''),
            startX +
              colWidths.tarih +
              colWidths.no +
              colWidths.altGrup +
              colWidths.grup +
              colWidths.tutar +
              colGap,
            bilgiWidth,
          ),
        );
        y += h + 6;
      }

      doc.end();
    });
  }

  // Detay Excel üretimi
  async generateDetayExcel(
    tarih: string,
    islemArac: string,
    islemTip: string,
  ): Promise<Buffer> {
    const data = await this.getDetayIslemler(
      tarih,
      islemArac,
      islemTip,
      1,
      10000,
    );
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Detay İşlemler');
    sheet.columns = [
      { header: 'Tarih', key: 'iKytTarihi', width: 12 },
      { header: 'İşlem No', key: 'islemNo', width: 10 },
      { header: 'Alt Grup', key: 'islemAltG', width: 24 },
      { header: 'Grup', key: 'islemGrup', width: 24 },
      { header: 'Tutar', key: 'islemTutar', width: 12 },
      { header: 'Bilgi', key: 'islemBilgi', width: 60 },
    ];
    data.data.forEach((r) => {
      sheet.addRow({
        iKytTarihi: r.iKytTarihi,
        islemNo: r.islemNo ?? '',
        islemAltG: r.islemAltG,
        islemGrup: r.islemGrup,
        islemTutar: Number(r.islemTutar) || 0,
        islemBilgi: r.islemBilgi,
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
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
      const baslangicTarihi =
        birYilOnce.getDate().toString().padStart(2, '0') +
        '.' +
        (birYilOnce.getMonth() + 1).toString().padStart(2, '0') +
        '.' +
        birYilOnce.getFullYear();
      const bitisTarihi =
        bugun.getDate().toString().padStart(2, '0') +
        '.' +
        (bugun.getMonth() + 1).toString().padStart(2, '0') +
        '.' +
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

      const depoUnknown = (await this.dataSource.query(query, [
        baslangicTarihi,
        bitisTarihi,
      ])) as unknown;
      const result = depoUnknown as Array<{
        tarih: string;
        gelir: number | string | null;
        gider: number | string | null;
      }>;

      // Bakiye hesaplama
      const baslangicBakiye = 107695; // Depozito başlangıç bakiyesi
      let currentBakiye = baslangicBakiye;

      const processedData = result.map((row) => {
        const gelir = Number(row.gelir) || 0;
        const gider = Number(row.gider) || 0;

        currentBakiye = currentBakiye + gelir - gider;

        return {
          tarih: row.tarih,
          gelir: gelir,
          gider: gider,
          bakiye: currentBakiye,
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
      if (!Array.isArray(kayitlar) || kayitlar.length === 0) {
        return [];
      }

      const spName = this.dbConfig.getSpName('spr_islemEkleYn');
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const results: Array<{
          index: number;
          success: boolean;
          message: string;
        }> = [];

        for (let i = 0; i < kayitlar.length; i++) {
          const k = kayitlar[i] || {};

          // Zorunlu alanlar ve güvenli defaultlar
          const iKytTarihi: string = String(k.iKytTarihi || '').trim(); // DD.MM.YYYY (nchar(10))
          const islemKllnc: string = String(k.islemKllnc || 'SAadmin').trim();
          const islemCrKod: string = String(k.islemCrKod || '').trim();
          const islemOzel1: string = String(k.islemOzel1 || '').trim();
          const islemOzel2: string = String(k.islemOzel2 || '').trim();
          const islemOzel3: string = String(k.islemOzel3 || '').trim();
          const islemOzel4: string = String(k.islemOzel4 || '').trim();
          const islemArac: string = String(k.islemArac || 'Cari İşlem').trim();
          const islemTip: string = String(k.islemTip || '').trim(); // 'GELİR' | 'GİDER' | 'Giren' | 'Çıkan'
          const islemGrup: string = String(k.islemGrup || '').trim();
          const islemAltG: string = String(k.islemAltG || '').trim();
          const islemBilgi: string = String(k.islemBilgi || '').trim();
          const islemMiktar: number = Number(k.islemMiktar ?? 1) || 1;
          const islemBirim: string = String(k.islemBirim || 'ADET').trim();
          const islemTutar: number = Number(k.islemTutar ?? 0) || 0;
          const islemDoviz: string = String(k.islemDoviz || 'TL').trim();
          const islemKur: number = Number(k.islemKur ?? 1) || 1;

          const execQuery = `
            EXEC ${spName}
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

          const params = [
            iKytTarihi,
            islemKllnc,
            islemCrKod,
            islemOzel1,
            islemOzel2,
            islemOzel3,
            islemOzel4,
            islemArac,
            islemTip,
            islemGrup,
            islemAltG,
            islemBilgi,
            islemMiktar,
            islemBirim,
            islemTutar,
            islemDoviz,
            islemKur,
          ];

          await queryRunner.query(execQuery, params);
          results.push({ index: i, success: true, message: 'OK' });
        }

        await queryRunner.commitTransaction();
        return results;
      } catch (innerError) {
        await queryRunner.rollbackTransaction();
        console.error(
          '❌ İşlem kayıtları yazılamadı, rollback yapıldı:',
          innerError,
        );
        throw innerError;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      console.error('İşlem kaydetme hatası:', error);
      throw new Error('İşlem kayıtları kaydedilemedi');
    }
  }

  /**
   * Güncel bakiye hesaplar (tüm günlerin toplamı)
   */
  async getGuncelBakiye(
    islemArac: string,
    islemTip?: string,
  ): Promise<number> {
    try {
      console.log('🔍 getGuncelBakiye çağrıldı:', { islemArac, islemTip })
      
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislem');

      let islemAracim = '';

      // İşlem Aracına göre filtreleme
      switch (islemArac) {
        case 'cari':
          islemAracim = `WHERE i.islemArac = 'Cari İşlem'`;
          break;
        case 'nakit':
          islemAracim = `WHERE i.islemArac = 'Nakit Kasa(TL)'`;
          break;
        case 'kart':
          islemAracim = `WHERE i.islemArac = 'Kredi Kartları'`;
          break;
        case 'eft':
          islemAracim = `WHERE i.islemArac = 'Banka EFT'`;
          break;
        case 'acenta':
          islemAracim = `WHERE i.islemArac = 'Acenta Tahsilat'`;
          break;
        case 'depozito':
          islemAracim = `WHERE (i.islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' OR i.islemBilgi LIKE '%=DEPOZİTO İADESİ=%')`;
          break;
        default:
          islemAracim = `WHERE i.islemArac = 'Cari İşlem'`;
      }

      console.log('🔍 islemAracim:', islemAracim)

      // İşlem tipine göre gelir/gider hesaplama - bakiye için her iki yön de gerekli
      let gelirCondition = '';
      let giderCondition = '';

      // Seçilen islemTip'e göre gelir ve gider koşullarını belirle
      if (islemTip === 'GELİR' || islemTip === 'Giren') {
        // Gelir seçilmişse, gelirleri ve giderleri ayrı ayrı topla
        gelirCondition = `i.islemTip = '${islemTip}'`;
        giderCondition = `i.islemTip = '${islemTip === 'GELİR' ? 'GİDER' : 'Çıkan'}'`;
      } else if (islemTip === 'GİDER' || islemTip === 'Çıkan') {
        // Gider seçilmişse, gelirleri ve giderleri ayrı ayrı topla
        gelirCondition = `i.islemTip = '${islemTip === 'GİDER' ? 'GELİR' : 'Giren'}'`;
        giderCondition = `i.islemTip = '${islemTip}'`;
      }

      console.log('🔍 Gelir/Gider koşulları:', { gelirCondition, giderCondition })

      const bakiyeQuery = `
        SELECT 
          SUM(CASE WHEN ${gelirCondition} THEN i.islemTutar ELSE 0 END) as toplamGelir,
          SUM(CASE WHEN ${giderCondition} THEN i.islemTutar ELSE 0 END) as toplamGider
        FROM ${schemaName}.${tableName} i
        ${islemAracim}
        AND i.islemBilgi NOT LIKE '%=DEPOZİTO ALACAĞI=%'
      `;

      console.log('🔍 Bakiye Query:', bakiyeQuery)

      const bakiyeUnknown = (await this.dataSource.query(
        bakiyeQuery,
      )) as unknown;
      const bakiyeRes = bakiyeUnknown as Array<{
        toplamGelir: number | string | null;
        toplamGider: number | string | null;
      }>;
      const toplamGelir = Number(bakiyeRes[0]?.toplamGelir) || 0;
      const toplamGider = Number(bakiyeRes[0]?.toplamGider) || 0;
      const guncelBakiye = toplamGelir - toplamGider;

      console.log('🔍 Bakiye hesaplama sonucu:', { toplamGelir, toplamGider, guncelBakiye })

      return guncelBakiye;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Güncel bakiye hesaplama hatası:', message);
      return 0;
    }
  }

  /**
   * Seçilen güne kadar olan bakiye hesaplar
   */
  async getSecilenGunBakiyesi(
    islemArac: string,
    islemTip: string,
    secilenTarih: string,
  ): Promise<number> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislem');

      let islemAracim = '';

      // İşlem Aracına göre filtreleme
      switch (islemArac) {
        case 'cari':
          islemAracim = `WHERE i.islemArac = 'Cari İşlem'`;
          break;
        case 'nakit':
          islemAracim = `WHERE i.islemArac = 'Nakit Kasa(TL)'`;
          break;
        case 'kart':
          islemAracim = `WHERE i.islemArac = 'Kredi Kartları'`;
          break;
        case 'eft':
          islemAracim = `WHERE i.islemArac = 'Banka EFT'`;
          break;
        case 'acenta':
          islemAracim = `WHERE i.islemArac = 'Acenta Tahsilat'`;
          break;
        case 'depozito':
          islemAracim = `WHERE (i.islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' OR i.islemBilgi LIKE '%=DEPOZİTO İADESİ=%')`;
          break;
        default:
          islemAracim = `WHERE i.islemArac = 'Cari İşlem'`;
      }

      // İşlem tipine göre gelir/gider hesaplama - bakiye için her iki yön de gerekli
      let gelirCondition = '';
      let giderCondition = '';

      // Seçilen islemTip'e göre gelir ve gider koşullarını belirle
      if (islemTip === 'GELİR' || islemTip === 'Giren') {
        // Gelir seçilmişse, gelirleri ve giderleri ayrı ayrı topla
        gelirCondition = `i.islemTip = '${islemTip}'`;
        giderCondition = `i.islemTip = '${islemTip === 'GELİR' ? 'GİDER' : 'Çıkan'}'`;
      } else if (islemTip === 'GİDER' || islemTip === 'Çıkan') {
        // Gider seçilmişse, gelirleri ve giderleri ayrı ayrı topla
        gelirCondition = `i.islemTip = '${islemTip === 'GİDER' ? 'GELİR' : 'Giren'}'`;
        giderCondition = `i.islemTip = '${islemTip}'`;
      }

      const bakiyeQuery = `
        SELECT 
          SUM(CASE WHEN ${gelirCondition} THEN i.islemTutar ELSE 0 END) as toplamGelir,
          SUM(CASE WHEN ${giderCondition} THEN i.islemTutar ELSE 0 END) as toplamGider
        FROM ${schemaName}.${tableName} i
        ${islemAracim}
        AND i.islemBilgi NOT LIKE '%=DEPOZİTO ALACAĞI=%'
        AND CONVERT(DATE, i.iKytTarihi, 104) <= CONVERT(DATE, @0, 104)
      `;

      const secilenUnknown = (await this.dataSource.query(bakiyeQuery, [
        secilenTarih,
      ])) as unknown;
      const secilenRes = secilenUnknown as Array<{
        toplamGelir: number | string | null;
        toplamGider: number | string | null;
      }>;
      const toplamGelir = Number(secilenRes[0]?.toplamGelir) || 0;
      const toplamGider = Number(secilenRes[0]?.toplamGider) || 0;
      const secilenGunBakiyesi = toplamGelir - toplamGider;

      return secilenGunBakiyesi;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Seçilen gün bakiyesi hesaplama hatası:', message);
      return 0;
    }
  }

  /**
   * tblislem tablosundan belirli kaydı getirir
   */
  async getIslemDetay(islemNo: number): Promise<any> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislem');

      const query = `
        SELECT 
          islemNo,
          iKytTarihi,
          islemKllnc,
          islemOzel1,
          islemOzel2,
          islemOzel3,
          islemOzel4,
          islemBirim,
          islemDoviz,
          islemKur,
          islemBilgi,
          islemCrKod,
          islemArac,
          islemTip,
          islemGrup,
          islemAltG,
          islemMiktar,
          islemTutar
        FROM ${schemaName}.${tableName}
        WHERE islemNo = @0
      `;

      const result = await this.dataSource.query(query, [islemNo]);

      if (result && result.length > 0) {
        return result[0];
      } else {
        throw new Error('İşlem bulunamadı');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * tblislem tablosundan islemGrup distinct listesi getirir
   */
  async getIslemGruplari(): Promise<string[]> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislem');

      const query = `
        SELECT DISTINCT islemGrup
        FROM ${schemaName}.${tableName}
        WHERE islemGrup IS NOT NULL AND islemGrup <> '' AND islemGrup NOT LIKE '%Kasa%' AND islemAltG NOT LIKE '%FON KAYIT%'
        ORDER BY islemGrup
      `;

      const result = await this.dataSource.query(query);
      return result.map((row: any) => row.islemGrup);
    } catch (error) {
      throw error;
    }
  }



  /**
   * tblCari tablosundan CariAdi listesi getirir
   */
  async getCariHesaplar(): Promise<string[]> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblCari');

      const query = `
        SELECT CariAdi
        FROM ${schemaName}.${tableName}
        WHERE CariAdi IS NOT NULL AND CariAdi <> ''
        ORDER BY CariAdi
      `;

      const result = await this.dataSource.query(query);
      return result.map((row: any) => row.CariAdi);
    } catch (error) {
      throw error;
    }
  }

  /**
   * tblKasaDevir tablosundan sayfalanmış verileri getirir
   */
  async getKasaDevirVerileri(
    page: number = 1,
    rowsPerPage: number = 3,
  ): Promise<{ data: KasaDevirKaydi[]; totalRecords: number }> {
    try {
      const offset = (page - 1) * rowsPerPage;

      // Toplam kayıt sayısını al
      const countQuery = `
        SELECT COUNT(*) as total
        FROM ${this.dbConfig.getTableSchema()}.tblKasaDevir
      `;

      const countDevirUnknown = (await this.dataSource.query(
        countQuery,
      )) as unknown;
      const countDevir = countDevirUnknown as Array<{ total: number }>;
      const totalRecords = Number(countDevir[0]?.total || 0);

      // Sayfalanmış verileri al
      const query = `
        SELECT 
          kd.nKytTarihi as DevirTarihi,
          kd.nKasaDvrAln as DevirEden,
          kd.nKasaYekun as KasaYekun
        FROM ${this.dbConfig.getTableSchema()}.tblKasaDevir kd
        ORDER BY kd.nKasaNo DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${rowsPerPage} ROWS ONLY
      `;

      const devirUnknown = (await this.dataSource.query(query)) as unknown;
      const result = devirUnknown as Array<{
        DevirTarihi: string;
        DevirEden: string;
        KasaYekun: number | string;
      }>;

      const typed: KasaDevirKaydi[] = (
        result as Array<{
          DevirTarihi: string;
          DevirEden: string;
          KasaYekun: number | string;
        }>
      ).map((row) => ({
        DevirTarihi: row.DevirTarihi,
        DevirEden: row.DevirEden,
        KasaYekun: Number(row.KasaYekun) || 0,
      }));

      return {
        data: typed,
        totalRecords: totalRecords,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Kasa devir verileri alma hatası:', message);
      return {
        data: [],
        totalRecords: 0,
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

      const userUnknown = (await this.dataSource.query(query)) as unknown;
      const result = userUnknown as Array<{ PrsnUsrNm: string }>;
      const kullaniciAdi = result[0]?.PrsnUsrNm ?? 'SAadmin';

      return kullaniciAdi;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Kullanıcı bilgisi alma hatası:', message);
      return 'SAadmin'; // Fallback değer
    }
  }

  /**
   * Kasalar arası aktarım işlemi - islemEKLE stored procedure kullanarak
   */
  async kasaAktarimi(veren: string, alan: string, tutar: number): Promise<any> {
    try {
      // Bugünün tarihini DD.MM.YYYY formatında al
      const bugun = new Date();
      const iKytTarihi =
        bugun.getDate().toString().padStart(2, '0') +
        '.' +
        (bugun.getMonth() + 1).toString().padStart(2, '0') +
        '.' +
        bugun.getFullYear();

      // Kasa parametrelerini belirle
      const kasaParametreleri = {
        nakit: {
          islemCrKod: 'PN10000',
          islemArac: 'Nakit Kasa(TL)',
          islemAltG: 'PANSİYON NAKİT GİDERLERİ',
        },
        kart: {
          islemCrKod: 'PK10000',
          islemArac: 'Kredi Kartları',
          islemAltG: 'PANSİYON KREDİ KARTI GİDERLERİ',
        },
        eft: {
          islemCrKod: 'PB10000',
          islemArac: 'Banka EFT',
          islemAltG: 'PANSİYON BANKA GİDERLERİ',
        },
        acenta: {
          islemCrKod: 'PA10000',
          islemArac: 'Acenta Tahsilat',
          islemAltG: 'PANSİYON ACENTA KASASI',
        },
        depozito: {
          islemCrKod: 'PD10000',
          islemArac: 'Depozito Kasası',
          islemAltG: 'PANSİYON DEPOZİTO KASASI',
        },
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
          iKytTarihi, // @0 iKytTarihi
          islemKllnc, // @1 islemKllnc
          verenParametreleri.islemCrKod, // @2 islemCrKod
          '', // @3 islemOzel1
          '', // @4 islemOzel2
          '', // @5 islemOzel3
          '', // @6 islemOzel4
          verenParametreleri.islemArac, // @7 islemArac
          'Çıkan', // @8 islemTip
          'Kasaya Verilen', // @9 islemGrup
          verenParametreleri.islemAltG, // @10 islemAltG
          `${alanParametreleri.islemArac} Kasasına Verilen Tutar`, // @11 islemBilgi (alan kasa adı yazılır)
          1, // @12 islemMiktar
          'ADET', // @13 islemBirim
          tutar, // @14 islemTutar
          'TL', // @15 islemDoviz
          1, // @16 islemKur
        ];

        await queryRunner.query(verenIslemQuery, verenIslemParams);

        // 2. Alan kasaya giriş işlemi
        const alanIslemParams = [
          iKytTarihi, // @0 iKytTarihi
          islemKllnc, // @1 islemKllnc
          alanParametreleri.islemCrKod, // @2 islemCrKod
          '', // @3 islemOzel1
          '', // @4 islemOzel2
          '', // @5 islemOzel3
          '', // @6 islemOzel4
          alanParametreleri.islemArac, // @7 islemArac
          'Giren', // @8 islemTip
          'Kasadan Alınan', // @9 islemGrup
          alanParametreleri.islemAltG, // @10 islemAltG
          `${verenParametreleri.islemArac} Kasasından Alınan Tutar`, // @11 islemBilgi (veren kasa adı yazılır)
          1, // @12 islemMiktar
          'ADET', // @13 islemBirim
          tutar, // @14 islemTutar
          'TL', // @15 islemDoviz
          1, // @16 islemKur
        ];

        await queryRunner.query(verenIslemQuery, alanIslemParams);

        // Transaction'ı commit et
        await queryRunner.commitTransaction();

        const basariliMesaj = `✅ Kasa aktarımı başarıyla tamamlandı!\n\n💰 ${verenParametreleri.islemArac} → ${alanParametreleri.islemArac}\n💵 Tutar: ${tutar.toLocaleString('tr-TR')} TL\n👤 İşlemi Yapan: ${islemKllnc}\n📅 Tarih: ${iKytTarihi}`;

        return {
          success: true,
          message: basariliMesaj,
          details: {
            veren: verenParametreleri.islemArac,
            alan: alanParametreleri.islemArac,
            tutar: tutar,
            kullanici: islemKllnc,
            tarih: iKytTarihi,
          },
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
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Kasa aktarımı genel hatası:', message);
      throw error; // Zaten formatlanmış hata mesajını tekrar formatlamaya gerek yok
    }
  }

  /**
   * tblislemRST tablosunda islemNo kontrolü yapar
   */
  async checkIslemRSTExists(islemNo: number): Promise<boolean> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislemRST');

      const query = `
        SELECT COUNT(*) as count
        FROM ${schemaName}.${tableName}
        WHERE islemNo = @0
      `;

      const result = await this.dataSource.query(query, [islemNo]);
      const count = result[0]?.count || 0;

      return count > 0;
    } catch (error) {
      console.error('❌ tblislemRST kontrol hatası:', error);
      throw new Error('İşlem RST kontrolü yapılamadı');
    }
  }

  /**
   * tblislem tablosundan kaydı tblislemRST tablosuna aktarır
   */
  async aktarIslemRST(islemNo: number): Promise<any> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const islemTableName = this.dbConfig.getTableName('tblislem');
      const islemRSTTableName = this.dbConfig.getTableName('tblislemRST');

      // Önce tblislem tablosundan kaydı getir
      const getIslemQuery = `
        SELECT *
        FROM ${schemaName}.${islemTableName}
        WHERE islemNo = @0
      `;

      const islemResult = await this.dataSource.query(getIslemQuery, [islemNo]);

      if (!islemResult || islemResult.length === 0) {
        throw new Error(`İşlem numarası ${islemNo} bulunamadı`);
      }

      const islemData = islemResult[0];

      // tblislemRST tablosuna aktar
      const insertQuery = `
        INSERT INTO ${schemaName}.${islemRSTTableName} (
          islemNo, iKytTarihi, islemKllnc, islemOzel1, islemOzel2, islemOzel3, islemOzel4,
          islemBirim, islemDoviz, islemKur, islemBilgi, islemCrKod, islemArac, islemTip,
          islemGrup, islemAltG, islemMiktar, islemTutar
        ) VALUES (
          @0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17
        )
      `;

      const insertParams = [
        islemData.islemNo,
        islemData.iKytTarihi,
        islemData.islemKllnc,
        islemData.islemOzel1,
        islemData.islemOzel2,
        islemData.islemOzel3,
        islemData.islemOzel4,
        islemData.islemBirim,
        islemData.islemDoviz,
        islemData.islemKur,
        islemData.islemBilgi,
        islemData.islemCrKod,
        islemData.islemArac,
        islemData.islemTip,
        islemData.islemGrup,
        islemData.islemAltG,
        islemData.islemMiktar,
        islemData.islemTutar,
      ];

      await this.dataSource.query(insertQuery, insertParams);

      return {
        success: true,
        islemNo: islemNo,
        message: 'İşlem RST tablosuna başarıyla aktarıldı',
      };
    } catch (error) {
      console.error('❌ İşlem RST aktarım hatası:', error);
      throw new Error(`İşlem RST tablosuna aktarılamadı: ${error.message}`);
    }
  }

  /**
   * tblislemRST tablosundan belirli kaydı getirir
   */
  async getIslemRSTDetay(islemNo: number): Promise<any> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislemRST');

      const query = `
        SELECT *
        FROM ${schemaName}.${tableName}
        WHERE islemNo = @0
      `;

      const result = await this.dataSource.query(query, [islemNo]);

      if (!result || result.length === 0) {
        throw new Error(`İşlem RST numarası ${islemNo} bulunamadı`);
      }

      return result[0];
    } catch (error) {
      console.error('❌ İşlem RST detay getirme hatası:', error);
      throw new Error(`İşlem RST detayı getirilemedi: ${error.message}`);
    }
  }

  /**
   * tblislemRST tablosundan belirli kaydı siler
   */
  async silIslemRST(islemNo: number): Promise<any> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislemRST');

      const query = `
        DELETE FROM ${schemaName}.${tableName}
        WHERE islemNo = @0
      `;

      const result = await this.dataSource.query(query, [islemNo]);

      return {
        success: true,
        islemNo: islemNo,
        message: 'İşlem RST tablosundan başarıyla silindi',
      };
    } catch (error) {
      console.error('❌ İşlem RST silme hatası:', error);
      throw new Error(`İşlem RST tablosundan silinemedi: ${error.message}`);
    }
  }

  /**
   * tblislem tablosunda mevcut kaydı günceller
   */
  async guncelleIslem(islemNo: number, updateData: any): Promise<any> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislem');

      const query = `
        UPDATE ${schemaName}.${tableName}
        SET 
          iKytTarihi = @1,
          islemKllnc = @2,
          islemOzel1 = @3,
          islemOzel2 = @4,
          islemOzel3 = @5,
          islemOzel4 = @6,
          islemBirim = @7,
          islemDoviz = @8,
          islemKur = @9,
          islemBilgi = @10,
          islemCrKod = @11,
          islemArac = @12,
          islemTip = @13,
          islemGrup = @14,
          islemAltG = @15,
          islemMiktar = @16,
          islemTutar = @17
        WHERE islemNo = @0
      `;

      const params = [
        islemNo,
        updateData.iKytTarihi,
        updateData.islemKllnc,
        updateData.islemOzel1,
        updateData.islemOzel2,
        updateData.islemOzel3,
        updateData.islemOzel4,
        updateData.islemBirim,
        updateData.islemDoviz,
        updateData.islemKur,
        updateData.islemBilgi,
        updateData.islemCrKod,
        updateData.islemArac,
        updateData.islemTip,
        updateData.islemGrup,
        updateData.islemAltG,
        updateData.islemMiktar,
        updateData.islemTutar,
      ];

      const result = await this.dataSource.query(query, params);

      return {
        success: true,
        islemNo: islemNo,
        message: 'İşlem başarıyla güncellendi',
        affectedRows: result && result.affectedRows ? result.affectedRows : 0,
      };
    } catch (error) {
      console.error('❌ İşlem güncelleme hatası:', error);
      throw new Error(`İşlem güncellenemedi: ${error.message}`);
    }
  }

  /**
   * tblislemRST tablosundaki verileri tblislem tablosuna geri yükler
   */
  async resetIslemFromRST(islemNo: number): Promise<any> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tblIslemRST = this.dbConfig.getTableName('tblislemRST');
      const tblIslem = this.dbConfig.getTableName('tblislem');

      // tblislemRST'den ilgili kaydı çek
      const rstRecord = await this.dataSource.query(
        `SELECT * FROM ${schemaName}.${tblIslemRST} WHERE islemNo = @0`,
        [islemNo],
      );

      if (!rstRecord || rstRecord.length === 0) {
        throw new Error(
          `tblislemRST tablosunda islemNo ${islemNo} bulunamadı.`,
        );
      }

      const dataToUpdate = rstRecord[0];

      // tblislem tablosunu güncelle
      const query = `
        UPDATE ${schemaName}.${tblIslem}
        SET
          iKytTarihi = @1,
          islemKllnc = @2,
          islemOzel1 = @3,
          islemOzel2 = @4,
          islemOzel3 = @5,
          islemOzel4 = @6,
          islemBirim = @7,
          islemDoviz = @8,
          islemKur = @9,
          islemBilgi = @10,
          islemCrKod = @11,
          islemArac = @12,
          islemTip = @13,
          islemGrup = @14,
          islemAltG = @15,
          islemMiktar = @16,
          islemTutar = @17
        WHERE islemNo = @0
      `;

      const params = [
        islemNo,
        dataToUpdate.iKytTarihi,
        dataToUpdate.islemKllnc,
        dataToUpdate.islemOzel1,
        dataToUpdate.islemOzel2,
        dataToUpdate.islemOzel3,
        dataToUpdate.islemOzel4,
        dataToUpdate.islemBirim,
        dataToUpdate.islemDoviz,
        dataToUpdate.islemKur,
        dataToUpdate.islemBilgi,
        dataToUpdate.islemCrKod,
        dataToUpdate.islemArac,
        dataToUpdate.islemTip,
        dataToUpdate.islemGrup,
        dataToUpdate.islemAltG,
        dataToUpdate.islemMiktar,
        dataToUpdate.islemTutar,
      ];

      const result = await this.dataSource.query(query, params);

      return {
        success: true,
        islemNo: islemNo,
        message: 'İşlem başarıyla orijinal verilerle güncellendi',
        affectedRows: result && result.affectedRows ? result.affectedRows : 0,
      };
    } catch (error) {
      console.error('❌ İşlem resetleme hatası:', error);
      throw new Error(
        `İşlem orijinal verilerle güncellenemedi: ${error.message}`,
      );
    }
  }

  /**
   * İşlem kaydını arşivler ve siler
   */
  async silIslem(islemNo: number, username?: string): Promise<any> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tblIslem = this.dbConfig.getTableName('tblislem');
      const tblIslemARV = this.dbConfig.getTableName('tblislemARV');

      // Aktif kullanıcı bilgisini al (parametre olarak gelen username veya fallback)
      const aktifKullanici = username || await this.getAktifKullaniciAdi();

      // Önce tblislem tablosundan kaydı çek
      const islemRecord = await this.dataSource.query(
        `SELECT * FROM ${schemaName}.${tblIslem} WHERE islemNo = @0`,
        [islemNo],
      );

      if (!islemRecord || islemRecord.length === 0) {
        throw new Error(`tblislem tablosunda islemNo ${islemNo} bulunamadı.`);
      }

      const dataToArchive = islemRecord[0];

      // tblislemARV tablosuna arşiv kaydı ekle
      const archiveQuery = `
        INSERT INTO ${schemaName}.${tblIslemARV} (
          islemNo, iKytTarihi, islemKllnc, islemOzel1, islemOzel2, islemOzel3, 
          islemOzel4, islemBirim, islemDoviz, islemKur, islemBilgi, islemCrKod, 
          islemArac, islemTip, islemGrup, islemAltG, islemMiktar, islemTutar
        ) VALUES (
          @0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17
        )
      `;

      const archiveParams = [
        dataToArchive.islemNo,
        dataToArchive.iKytTarihi,
        aktifKullanici, // islemKllnc alanına aktif kullanıcı username'i yazılıyor
        dataToArchive.islemOzel1,
        dataToArchive.islemOzel2,
        dataToArchive.islemOzel3,
        dataToArchive.islemOzel4,
        dataToArchive.islemBirim,
        dataToArchive.islemDoviz,
        dataToArchive.islemKur,
        dataToArchive.islemBilgi,
        dataToArchive.islemCrKod,
        dataToArchive.islemArac,
        dataToArchive.islemTip,
        dataToArchive.islemGrup,
        dataToArchive.islemAltG,
        dataToArchive.islemMiktar,
        dataToArchive.islemTutar,
      ];

      await this.dataSource.query(archiveQuery, archiveParams);

      // Şimdi tblislem tablosundan kaydı sil
      const deleteQuery = `
        DELETE FROM ${schemaName}.${tblIslem} WHERE islemNo = @0
      `;

      const deleteResult = await this.dataSource.query(deleteQuery, [islemNo]);

      return {
        success: true,
        islemNo: islemNo,
        message: 'İşlem başarıyla arşivlendi ve silindi',
        archived: true,
        deleted: true,
        affectedRows:
          deleteResult && deleteResult.affectedRows
            ? deleteResult.affectedRows
            : 0,
      };
    } catch (error) {
      console.error('❌ İşlem silme hatası:', error);
      throw new Error(`İşlem silinemedi: ${error.message}`);
    }
  }

  /**
   * tblislemARV tablosundan en büyük islemNo'ya sahip kaydı getirir
   */
  async getIslemARVEnBuyuk(): Promise<any> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tblIslemARV = this.dbConfig.getTableName('tblislemARV');

      const query = `
        SELECT TOP 1 * FROM ${schemaName}.${tblIslemARV}
        ORDER BY islemNo DESC
      `;

      const result = await this.dataSource.query(query);

      if (!result || result.length === 0) {
        return null;
      }

      return result[0];
    } catch (error) {
      console.error('❌ Arşiv kaydı getirme hatası:', error);
      throw new Error(`Arşiv kaydı getirilemedi: ${error.message}`);
    }
  }

  /**
   * tblislemARV tablosundan belirli bir islemNo'dan sonraki kaydı getirir
   * Basit sıralama bazlı navigasyon kullanır
   */
  async getIslemARVSonraki(islemNo: number): Promise<any> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tblIslemARV = this.dbConfig.getTableName('tblislemARV');

      // Basit yaklaşım: mevcut islemNo'dan büyük olan en küçük islemNo'yu bul
      const nextRecordQuery = `
        SELECT TOP 1 *
        FROM ${schemaName}.${tblIslemARV}
        WHERE islemNo > @0
        ORDER BY islemNo ASC
      `;

      const nextRecordResult = await this.dataSource.query(nextRecordQuery, [islemNo]);

      if (!nextRecordResult || nextRecordResult.length === 0) {
        return null;
      }

      return nextRecordResult[0];
    } catch (error) {
      console.error('❌ Sonraki arşiv kaydı getirme hatası:', error);
      throw new Error(`Sonraki arşiv kaydı getirilemedi: ${error.message}`);
    }
  }

  /**
   * tblislemARV tablosundan belirli bir islemNo'dan önceki kaydı getirir
   * Basit sıralama bazlı navigasyon kullanır
   */
  async getIslemARVOnceki(islemNo: number): Promise<any> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tblIslemARV = this.dbConfig.getTableName('tblislemARV');

      // Basit yaklaşım: mevcut islemNo'dan küçük olan en büyük islemNo'yu bul
      const previousRecordQuery = `
        SELECT TOP 1 *
        FROM ${schemaName}.${tblIslemARV}
        WHERE islemNo < @0
        ORDER BY islemNo DESC
      `;

      const previousRecordResult = await this.dataSource.query(previousRecordQuery, [islemNo]);

      if (!previousRecordResult || previousRecordResult.length === 0) {
        return null;
      }

      return previousRecordResult[0];
    } catch (error) {
      console.error('❌ Önceki arşiv kaydı getirme hatası:', error);
      throw new Error(`Önceki arşiv kaydı getirilemedi: ${error.message}`);
    }
  }

  /**
   * tblislemARV tablosundan belirli bir kaydı tblislem tablosuna geri yükler
   */
  async geriYukleIslemARV(islemNo: number): Promise<any> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tblIslemARV = this.dbConfig.getTableName('tblislemARV');
      const tblIslem = this.dbConfig.getTableName('tblislem');

      // Arşiv kaydını getir
      const arvRecord = await this.dataSource.query(
        `SELECT * FROM ${schemaName}.${tblIslemARV} WHERE islemNo = @0`,
        [islemNo],
      );

      if (!arvRecord || arvRecord.length === 0) {
        throw new Error('Arşiv kaydı bulunamadı');
      }

      const arvData = arvRecord[0];

      // tblislem tablosuna geri yükle
      const insertQuery = `
        INSERT INTO ${schemaName}.${tblIslem} (
          iKytTarihi, islemKllnc, islemCrKod, islemOzel1, islemOzel2,
          islemOzel3, islemOzel4, islemArac, islemTip, islemGrup,
          islemAltG, islemBilgi, islemMiktar, islemBirim, islemTutar,
          islemDoviz, islemKur
        ) VALUES (
          @0, @1, @2, @3, @4, @5, @6, @7, @8, @9,
          @10, @11, @12, @13, @14, @15, @16
        )
      `;

      const insertParams = [
        arvData.iKytTarihi,
        arvData.islemKllnc,
        arvData.islemCrKod,
        arvData.islemOzel1,
        arvData.islemOzel2,
        arvData.islemOzel3,
        arvData.islemOzel4,
        arvData.islemArac,
        arvData.islemTip,
        arvData.islemGrup,
        arvData.islemAltG,
        arvData.islemBilgi,
        arvData.islemMiktar,
        arvData.islemBirim,
        arvData.islemTutar,
        arvData.islemDoviz,
        arvData.islemKur,
      ];

      const insertResult = await this.dataSource.query(insertQuery, insertParams);

      if (!insertResult || insertResult.affectedRows === 0) {
        throw new Error('İşlem geri yüklenemedi');
      }

      // Arşiv kaydını sil
      const deleteResult = await this.dataSource.query(
        `DELETE FROM ${schemaName}.${tblIslemARV} WHERE islemNo = @0`,
        [islemNo],
      );

      return {
        success: true,
        message: 'Arşiv kaydı başarıyla geri yüklendi ve arşivden silindi',
        affectedRows: insertResult.affectedRows || 0,
      };
    } catch (error) {
      console.error('❌ Arşiv kaydı geri yükleme hatası:', error);
      throw new Error(`Arşiv kaydı geri yüklenemedi: ${error.message}`);
    }
  }

  /**
   * Excel serial date'i DD.MM.YYYY formatına çevirir
   * @param serialDate Excel serial date (örn: 45934)
   * @returns DD.MM.YYYY formatında tarih string'i
   */
  private convertExcelDateToDDMMYYYY(serialDate: any): string {
    if (!serialDate || isNaN(serialDate)) return '';
    try {
      const excelEpoch = new Date(1900, 0, 1);
      // Excel'de 1900 artık yıl olarak kabul ediliyor ama aslında değil
      // Bu yüzden 1 gün fazla hesaplanıyor, 1 gün çıkarıyoruz
      const targetDate = new Date(excelEpoch.getTime() + (serialDate - 2) * 24 * 60 * 60 * 1000);
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const yyyy = targetDate.getFullYear();
      return `${dd}.${mm}.${yyyy}`;
    } catch (error) {
      return '';
    }
  }

  /**
   * Fon devir bakiyesini sp_FonDevirY stored procedure ile getirir
   * @param tarih DD.MM.YYYY formatında tarih
   * @returns Devir bakiyesi
   */
  async getFonDevirY(tarih: string): Promise<number> {
    try {
      // Tarih formatını kontrol et (DD.MM.YYYY)
      if (!this.isValidDateFormat(tarih)) {
        throw new Error(`Geçersiz tarih formatı: ${tarih}. Beklenen format: DD.MM.YYYY`);
      }

      const spName = this.dbConfig.getSpName('sp_FonDevirY');
      const queryRunner = this.dataSource.createQueryRunner();
      
      try {
        await queryRunner.connect();
        
        // Stored procedure'ü çağır
        const execQuery = `EXEC ${spName} @Sectarih = @0`;
        const params = [tarih];
        
        const result = await queryRunner.query(execQuery, params);
        
        // Tek değer döndür - Stored procedure anonim kolon döndürüyor
        if (result && result.length > 0) {
          // İlk kolonun değerini al (kolon adı yok)
          const firstRow = result[0];
          const firstColumnValue = Object.values(firstRow)[0];
          return Number(firstColumnValue) || 0;
        }
        
        return 0;
        
      } finally {
        await queryRunner.release();
      }
      
    } catch (error) {
      throw new Error(`Fon devir bakiyesi alınamadı: ${error.message}`);
    }
  }

  /**
   * Birden fazla islemNo için RST kayıtlarını tek sorguda getirir (performans optimizasyonu)
   * @param islemNoList İşlem numaraları dizisi
   * @returns RST kayıtları
   */
  async getRstRecordsForMultipleIslemNo(islemNoList: number[]): Promise<any[]> {
    try {
      if (!islemNoList || islemNoList.length === 0) {
        return [];
      }

      // IN clause için parametreleri hazırla
      const placeholders = islemNoList.map((_, index) => `@${index}`).join(',');
      const params = islemNoList.map((islemNo, index) => ({ [`@${index}`]: islemNo }));

      const query = `
        SELECT islemNo, iKytTarihi, islemKllnc, islemOzel1, islemOzel2, 
               islemOzel3, islemOzel4, islemBirim, islemDoviz, islemKur, 
               islemBilgi, islemCrKod, islemArac, islemTip, islemGrup, 
               islemAltG, islemMiktar, islemTutar
        FROM tblislemRST 
        WHERE islemNo IN (${placeholders})
        ORDER BY islemNo DESC
      `;

      const queryRunner = this.dataSource.createQueryRunner();
      
      try {
        await queryRunner.connect();
        
        // Parametreleri query'e bind et
        let finalQuery = query;
        params.forEach((param, index) => {
          const paramName = `@${index}`;
          const paramValue = param[paramName];
          finalQuery = finalQuery.replace(new RegExp(paramName, 'g'), paramValue.toString());
        });

        const result = await queryRunner.query(finalQuery);
        return result || [];
        
      } finally {
        await queryRunner.release();
      }
      
    } catch (error) {
      throw new Error(`RST kayıtları alınamadı: ${error.message}`);
    }
  }

  /**
   * Tüm RST kayıtlarını getirir (debug amaçlı)
   * @returns Tüm RST kayıtları
   */
  async getAllRstRecords(): Promise<any[]> {
    try {
      const query = `
        SELECT islemNo, iKytTarihi, islemKllnc, islemOzel1, islemOzel2, 
               islemOzel3, islemOzel4, islemBirim, islemDoviz, islemKur, 
               islemBilgi, islemCrKod, islemArac, islemTip, islemGrup, 
               islemAltG, islemMiktar, islemTutar
        FROM tblislemRST 
        ORDER BY islemNo DESC
      `;

      const queryRunner = this.dataSource.createQueryRunner();
      
      try {
        await queryRunner.connect();
        const result = await queryRunner.query(query);
        return result || [];
        
      } finally {
        await queryRunner.release();
      }
      
    } catch (error) {
      throw new Error(`Tüm RST kayıtları alınamadı: ${error.message}`);
    }
  }
}
