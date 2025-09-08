import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { DatabaseConfigService } from '../database/database-config.service';
import { Islem } from '../entities/islem.entity';
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
    @InjectRepository(Islem)
    private readonly islemRepository: Repository<Islem>,
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
        
        // 🔥 DEBUG: sp_FonDokumY'den gelen ham veriyi incele
        console.log('🔥 sp_FonDokumY raw result:', JSON.stringify(result?.[0], null, 2));
        if (result && result.length > 0) {
          console.log('🔥 sp_FonDokumY alan adları:', Object.keys(result[0]));
        }
        
        // Verileri frontend'in beklediği formata dönüştür
        if (result && Array.isArray(result)) {
          const mappedData = result.map((row: any, index: number) => {
            // 🔥 DEBUG: Her satır için gelen verileri logla
            console.log(`🔥 Row ${index} raw data:`, row);
            
            const convertedOdmVade = this.convertExcelDateToDDMMYYYY(row.OdVade);
            
            return {
              fKasaNo: row.fKasaNo || 0,
              OdmVade: convertedOdmVade,
              islmArac: row.islmArac || '',
              islmGrup: row.islmGrup || '',
              islmAltG: row.islmAltG || '',
              islmTip: row.islmTip || '',
              islmTtr: this.parseAmount(row.islmTtr),
              islmTkst: row.islmTkst || '',
              islmBilgi: row.islmBilgi || '',
              OdmDrm: row.OdmDrm === true || row.OdmDrm === 1 || row.OdmDrm === '1',
              ttrDrm: row.ttrDrm === true || row.ttrDrm === 1 || row.ttrDrm === '1'
            };
          });
          
          console.log('🔥 sp_FonDokumY final mapped data count:', mappedData.length);
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
   * Kar/Zarar özeti: Belirtilen tarih aralığında islemTip bazında (GELİR/GİDER) islemGrup toplamları
   */
  async getKarZararOzet(
    startDDMMYYYY: string,
    endDDMMYYYY: string,
  ): Promise<{ gelir: Array<{ islemGrup: string; toplam: number }>; gider: Array<{ islemGrup: string; toplam: number }> }> {
    try {
      const tableName = this.dbConfig.getTableName('tblislem');

      const baseWhere = `CONVERT(DATE, iKytTarihi, 104) BETWEEN CONVERT(DATE, @0, 104) AND CONVERT(DATE, @1, 104)`;

      const gelirQuery = `
        SELECT islemGrup, SUM(CAST(ISNULL(islemTutar, 0) AS DECIMAL(18,2))) AS toplam
        FROM ${tableName}
        WHERE ${baseWhere} AND islemTip = 'GELİR'
        GROUP BY islemGrup
        ORDER BY toplam DESC
      `;

      const giderQuery = `
        SELECT islemGrup, SUM(CAST(ISNULL(islemTutar, 0) AS DECIMAL(18,2))) AS toplam
        FROM ${tableName}
        WHERE ${baseWhere} AND islemTip = 'GİDER'
        GROUP BY islemGrup
        ORDER BY toplam DESC
        `;

      const gelir = await this.dataSource.query(gelirQuery, [startDDMMYYYY, endDDMMYYYY]);
      const gider = await this.dataSource.query(giderQuery, [startDDMMYYYY, endDDMMYYYY]);

      return {
        gelir: (gelir || []).map((r: any) => ({ islemGrup: r.islemGrup || '', toplam: Number(r.toplam) || 0 })),
        gider: (gider || []).map((r: any) => ({ islemGrup: r.islemGrup || '', toplam: Number(r.toplam) || 0 })),
      };
    } catch (error) {
      throw new Error(`Kar/Zarar özeti alınamadı: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Kar/Zarar seri: seçilen perioda göre 12 dilimlik GELİR/GİDER toplamları
   * Şimdilik 'gunler' desteklenir; diğer periodlar ilerletilecektir.
   */
  async getKarZararSeri(
    period: string,
    endDDMMYYYY: string,
  ): Promise<Array<{ label: string; gelir: number; gider: number; dateISO?: string }>> {
    const tableName = this.dbConfig.getTableName('tblislem');
    // Period parametresini güvenli şekilde normalize et (trim + küçük harf + Türkçe karakter dönüşümleri)
    const rawPeriod = (period ?? 'gunler').toString();
    const periodLower = rawPeriod
      .trim()
      .toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ş/g, 's')
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');

    let query = '';
    if (periodLower === 'haftalar') {
      query = `
        WITH Seq AS (
          SELECT 0 AS i UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL
          SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
        ), Weeks AS (
          SELECT 
            i,
            -- Haftanın pazartesi başlangıcı ve pazar bitişi
            DATEADD(DAY, - (DATEPART(WEEKDAY, CONVERT(DATE, @0, 104)) + 5) % 7, CONVERT(DATE, DATEADD(WEEK, - (11 - i), CONVERT(DATE, @0, 104)), 104)) AS weekStart,
            DATEADD(DAY, + (6 - (DATEPART(WEEKDAY, CONVERT(DATE, @0, 104)) + 5) % 7), CONVERT(DATE, DATEADD(WEEK, - (11 - i), CONVERT(DATE, @0, 104)), 104)) AS weekEnd
          FROM Seq
        ), Sums AS (
          SELECT 
            w.i,
            SUM(CASE WHEN t.islemTip = 'GELİR' THEN CAST(ISNULL(t.islemTutar,0) AS DECIMAL(18,2)) ELSE 0 END) AS gelir,
            SUM(CASE WHEN t.islemTip = 'GİDER' THEN CAST(ISNULL(t.islemTutar,0) AS DECIMAL(18,2)) ELSE 0 END) AS gider
          FROM Weeks w
          LEFT JOIN ${tableName} t
            ON CONVERT(DATE, t.iKytTarihi, 104) BETWEEN w.weekStart AND w.weekEnd
          GROUP BY w.i
        )
        SELECT 
          CONCAT(CONVERT(VARCHAR(5), weekStart, 104), '-', CONVERT(VARCHAR(5), weekEnd, 104)) AS label,
          ISNULL(s.gelir,0) AS gelir,
          ISNULL(s.gider,0) AS gider,
          CONVERT(VARCHAR(10), weekEnd, 23) AS dateISO
        FROM Weeks w
        LEFT JOIN Sums s ON s.i = w.i
        ORDER BY w.i ASC;`
    } else if (periodLower === 'aylar') {
      query = `
        WITH Seq AS (
          SELECT 0 AS i UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL
          SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
        ), Months AS (
          SELECT 
            i,
            DATEADD(DAY, 1, EOMONTH(DATEADD(MONTH, - (11 - i), CONVERT(DATE, @0, 104)), -1)) AS monthStart,
            EOMONTH(DATEADD(MONTH, - (11 - i), CONVERT(DATE, @0, 104))) AS monthEnd
          FROM Seq
        ), Sums AS (
          SELECT 
            m.i,
            SUM(CASE WHEN t.islemTip = 'GELİR' THEN CAST(ISNULL(t.islemTutar,0) AS DECIMAL(18,2)) ELSE 0 END) AS gelir,
            SUM(CASE WHEN t.islemTip = 'GİDER' THEN CAST(ISNULL(t.islemTutar,0) AS DECIMAL(18,2)) ELSE 0 END) AS gider
          FROM Months m
          LEFT JOIN ${tableName} t
            ON CONVERT(DATE, t.iKytTarihi, 104) BETWEEN m.monthStart AND m.monthEnd
          GROUP BY m.i
        )
        SELECT 
          RIGHT('0' + CAST(DATEPART(month, monthStart) AS VARCHAR(2)), 2) + '.' + CAST(DATEPART(year, monthStart) AS VARCHAR(4)) AS label,
          ISNULL(s.gelir,0) AS gelir,
          ISNULL(s.gider,0) AS gider,
          CONVERT(VARCHAR(10), monthEnd, 23) AS dateISO
        FROM Months m
        LEFT JOIN Sums s ON s.i = m.i
        ORDER BY m.i ASC;`
    } else if (periodLower === 'ceyrekler') {
      query = `
        WITH Seq AS (
          SELECT 0 AS i UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL
          SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
        ), Quarters AS (
          SELECT 
            i,
            DATEADD(quarter, DATEDIFF(quarter, 0, CONVERT(DATE, @0, 104)) - (11 - i), 0) AS qStart,
            DATEADD(day, -1, DATEADD(quarter, 1, DATEADD(quarter, DATEDIFF(quarter, 0, CONVERT(DATE, @0, 104)) - (11 - i), 0))) AS qEnd
          FROM Seq
        ), Sums AS (
          SELECT 
            q.i,
            SUM(CASE WHEN t.islemTip = 'GELİR' THEN CAST(ISNULL(t.islemTutar,0) AS DECIMAL(18,2)) ELSE 0 END) AS gelir,
            SUM(CASE WHEN t.islemTip = 'GİDER' THEN CAST(ISNULL(t.islemTutar,0) AS DECIMAL(18,2)) ELSE 0 END) AS gider
          FROM Quarters q
          LEFT JOIN ${tableName} t
            ON CONVERT(DATE, t.iKytTarihi, 104) BETWEEN q.qStart AND q.qEnd
          GROUP BY q.i
        )
        SELECT 
          CONCAT('Q', DATEPART(quarter, qStart), '.', DATEPART(year, qStart)) AS label,
          ISNULL(s.gelir,0) AS gelir,
          ISNULL(s.gider,0) AS gider,
          CONVERT(VARCHAR(10), qEnd, 23) AS dateISO
        FROM Quarters q
        LEFT JOIN Sums s ON s.i = q.i
        ORDER BY q.i ASC;`;
    } else if (periodLower === 'yari' || periodLower === 'yari-yillar') {
      query = `
        WITH Seq AS (
          SELECT 0 AS i UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL
          SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
        ), HalfYears AS (
          SELECT 
            i,
            DATEADD(month, ((DATEDIFF(month, 0, CONVERT(DATE, @0, 104)) / 6) - (11 - i)) * 6, 0) AS hStart,
            DATEADD(day, -1, DATEADD(month, 6, DATEADD(month, ((DATEDIFF(month, 0, CONVERT(DATE, @0, 104)) / 6) - (11 - i)) * 6, 0))) AS hEnd
          FROM Seq
        ), Sums AS (
          SELECT 
            h.i,
            SUM(CASE WHEN t.islemTip = 'GELİR' THEN CAST(ISNULL(t.islemTutar,0) AS DECIMAL(18,2)) ELSE 0 END) AS gelir,
            SUM(CASE WHEN t.islemTip = 'GİDER' THEN CAST(ISNULL(t.islemTutar,0) AS DECIMAL(18,2)) ELSE 0 END) AS gider
          FROM HalfYears h
          LEFT JOIN ${tableName} t
            ON CONVERT(DATE, t.iKytTarihi, 104) BETWEEN h.hStart AND h.hEnd
          GROUP BY h.i
        )
        SELECT 
          CONCAT('Y', CASE WHEN DATEPART(month, hStart) = 1 THEN '1' ELSE '2' END, '.', DATEPART(year, hStart)) AS label,
          ISNULL(s.gelir,0) AS gelir,
          ISNULL(s.gider,0) AS gider,
          CONVERT(VARCHAR(10), hEnd, 23) AS dateISO
        FROM HalfYears h
        LEFT JOIN Sums s ON s.i = h.i
        ORDER BY h.i ASC;`;
    } else if (periodLower === 'yillar') {
      query = `
        WITH Seq AS (
          SELECT 0 AS i UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL
          SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
        ), Years AS (
          SELECT 
            i,
            DATEADD(year, DATEDIFF(year, 0, CONVERT(DATE, @0, 104)) - (11 - i), 0) AS yStart,
            DATEADD(day, -1, DATEADD(year, 1, DATEADD(year, DATEDIFF(year, 0, CONVERT(DATE, @0, 104)) - (11 - i), 0))) AS yEnd
          FROM Seq
        ), Sums AS (
          SELECT 
            y.i,
            SUM(CASE WHEN t.islemTip = 'GELİR' THEN CAST(ISNULL(t.islemTutar,0) AS DECIMAL(18,2)) ELSE 0 END) AS gelir,
            SUM(CASE WHEN t.islemTip = 'GİDER' THEN CAST(ISNULL(t.islemTutar,0) AS DECIMAL(18,2)) ELSE 0 END) AS gider
          FROM Years y
          LEFT JOIN ${tableName} t
            ON CONVERT(DATE, t.iKytTarihi, 104) BETWEEN y.yStart AND y.yEnd
          GROUP BY y.i
        )
        SELECT 
          CAST(DATEPART(year, yStart) AS VARCHAR(4)) AS label,
          ISNULL(s.gelir,0) AS gelir,
          ISNULL(s.gider,0) AS gider,
          CONVERT(VARCHAR(10), yEnd, 23) AS dateISO
        FROM Years y
        LEFT JOIN Sums s ON s.i = y.i
        ORDER BY y.i ASC;`;
    } else {
      // 12 gün: son gün end, geriye 11 gün
      query = `
      WITH Seq AS (
        SELECT 0 AS i UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL
        SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
      ), Days AS (
        SELECT 
          i,
          CONVERT(DATE, DATEADD(DAY, - (11 - i), CONVERT(DATE, @0, 104)), 104) AS d
        FROM Seq
              ), Sums AS (
          SELECT 
            d.d,
            SUM(CASE WHEN t.islemTip = 'GELİR' THEN CAST(ISNULL(t.islemTutar,0) AS DECIMAL(18,2)) ELSE 0 END) AS gelir,
            SUM(CASE WHEN t.islemTip = 'GİDER' THEN CAST(ISNULL(t.islemTutar,0) AS DECIMAL(18,2)) ELSE 0 END) AS gider
          FROM Days d
          LEFT JOIN ${tableName} t
            ON CONVERT(DATE, t.iKytTarihi, 104) = d.d
          GROUP BY d.d
        )
      SELECT 
        CONVERT(VARCHAR(5), d.d, 104) AS label,
        ISNULL(s.gelir,0) AS gelir,
        ISNULL(s.gider,0) AS gider,
        CONVERT(VARCHAR(10), d.d, 23) AS dateISO
      FROM Days d
      LEFT JOIN Sums s ON s.d = d.d
      ORDER BY d.d ASC
      OPTION (MAXDOP 2);`;
    }

    const rows = await this.dataSource.query(query, [endDDMMYYYY]);
    return (rows || []).map((r: any) => ({
      label: r.label,
      gelir: Number(r.gelir) || 0,
      gider: Number(r.gider) || 0,
      dateISO: r.dateISO,
    }));
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
          FROM ${this.dbConfig.getTableName('tblFonKasaY')} 
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
      
      const tableName = this.dbConfig.getTableName('tblislem');
      
      console.log('🔍 Veritabanı bilgileri:', { tableName })

      // Tarih filtresi kaldırıldı - sadece islemArac ve islemTip seçimlerine göre günlük gruplama

      // İşlem türü filtresi (6'lı radio için islemArac alanı)
      let islemAracFilter = '';
      let depozitoFilter = '';
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
            // Depozito kayıtları çoğunlukla islemArac alanında değil, islemBilgi içinde işaretleniyor.
            // Bu yüzden islemArac filtresi uygulamak yerine, islemBilgi bazlı filtre kullanıyoruz.
            dbIslemArac = 'Depozito';
            depozitoFilter = `AND (islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' OR islemBilgi LIKE '%=DEPOZİTO İADESİ=%')`;
            break;
          default:
            dbIslemArac = islemArac;
        }
        // Depozito seçildiyse islemArac filtresi uygulanmaz; diğerlerinde uygulanır
        if (islemArac !== 'depozito') {
        islemAracFilter = `AND islemArac = '${dbIslemArac}'`;
        }
      }

      // İşlem yönü filtresi (2'li radio için islemTip alanı) - ANA TABLO İÇİN GEREKSİZ
      let islemTipFilter = '';
      // Ana tablo günlük özet olduğu için islemTip filtresi eklenmiyor
      // Detay tabloda islemTip filtresi kullanılıyor

      console.log('🔍 Filtreler:', { islemAracFilter, depozitoFilter, islemTipFilter })

      // Toplam kayıt sayısını al
      const countQuery = `
        SELECT COUNT(*) as total
        FROM ${tableName}
        WHERE 1=1
        ${islemAracFilter}
        ${depozitoFilter}
      `;

      console.log('🔍 Count Query:', countQuery)

      const countResult = await this.dataSource.query(countQuery);
      const totalRecords = countResult[0]?.total || 0;

      console.log('🔍 Toplam kayıt sayısı:', totalRecords)

      // Sayfalama hesaplamaları
      const offset = (page - 1) * rowsPerPage;

      // Ana sorgu - Depozito için gelir/gider islemBilgi'ye göre toplanır
      const gelirExpr =
        islemArac === 'depozito'
          ? "SUM(CASE WHEN islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' THEN islemTutar ELSE 0 END)"
          : `SUM(CASE WHEN ${islemArac === 'cari' ? "islemTip = 'GELİR'" : "islemTip = 'Giren'"} THEN islemTutar ELSE 0 END)`;
      const giderExpr =
        islemArac === 'depozito'
          ? "SUM(CASE WHEN islemBilgi LIKE '%=DEPOZİTO İADESİ=%' THEN islemTutar ELSE 0 END)"
          : `SUM(CASE WHEN ${islemArac === 'cari' ? "islemTip = 'GİDER'" : "islemTip = 'Çıkan'"} THEN islemTutar ELSE 0 END)`;

      const query = `
        SELECT 
          CONVERT(VARCHAR(10), iKytTarihi, 104) as iKytTarihi,
          ${gelirExpr} as gelir,
          ${giderExpr} as gider
        FROM ${tableName}
        WHERE 1=1
        ${islemAracFilter}
        ${depozitoFilter}
        GROUP BY CONVERT(VARCHAR(10), iKytTarihi, 104), CONVERT(DATE, iKytTarihi, 104)
        ORDER BY CONVERT(DATE, iKytTarihi, 104) DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${rowsPerPage} ROWS ONLY
        OPTION (MAXDOP 2);
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
        const personelTableName = this.dbConfig.getTableName('tblPersonel');
      const prsnQuery = `SELECT TOP 1 PrsnUsrNm FROM ${personelTableName} WHERE PrsnUsrNm = @0`;
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
      const kasaDevirTableName = this.dbConfig.getTableName('tblKasaDevir');
      const tableFullName = kasaDevirTableName;
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
      

      const tableName = this.dbConfig.getTableName('tblislem');
      
      console.log('🔍 Detay veritabanı bilgileri:', { tableName })

      // İşlem türü filtresi (6'lı radio için islemArac alanı)
      let islemAracFilter = '';
      let depozitoFilter = '';
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
            // Depozito kayıtları çoğunlukla islemArac alanında tutulmuyor; islemBilgi ile belirleniyor
            depozitoFilter = `AND (islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' OR islemBilgi LIKE '%=DEPOZİTO İADESİ=%')`;
            break;
          default:
            dbIslemArac = islemArac;
        }
        // Depozito seçildiyse islemArac filtresi uygulama; diğerlerinde uygula
        if (islemArac !== 'depozito') {
        islemAracFilter = `AND islemArac = '${dbIslemArac}'`;
        }
      }

      // İşlem yönü filtresi (2'li radio için islemTip alanı)
      let islemTipFilter = '';
      if (islemTip) {
        // Depozito için yön filtrelemesini islemBilgi ile yap
        if (islemArac === 'depozito') {
          if (islemTip === 'Giren') {
            islemTipFilter = `AND islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%'`;
          } else if (islemTip === 'Çıkan') {
            islemTipFilter = `AND islemBilgi LIKE '%=DEPOZİTO İADESİ=%'`;
          }
        } else {
          // Diğerleri için mevcut eşleme
        let dbIslemTip = '';
        if (islemArac === 'cari') {
          dbIslemTip = islemTip === 'GELİR' ? 'GELİR' : 'GİDER';
        } else {
          dbIslemTip = islemTip === 'Giren' ? 'Giren' : 'Çıkan';
        }
        islemTipFilter = `AND islemTip = '${dbIslemTip}'`;
        }
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
        FROM ${tableName}
        WHERE CONVERT(DATE, iKytTarihi, 104) = CONVERT(DATE, @0, 104)
        ${islemAracFilter}
        ${islemTipFilter}
        ${depozitoFilter}
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
        FROM ${tableName}
        WHERE CONVERT(DATE, iKytTarihi, 104) = CONVERT(DATE, @0, 104)
        ${islemAracFilter}
        ${islemTipFilter}
        ${depozitoFilter}
        ORDER BY islemNo DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${rowsPerPage} ROWS ONLY
        OPTION (MAXDOP 2);
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
         FROM ${tableName} i
         WHERE (i.islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' OR i.islemBilgi LIKE '%=DEPOZİTO İADESİ=%')
         AND CONVERT(DATE, i.iKytTarihi, 104) >= CONVERT(DATE, @0, 104)
         AND CONVERT(DATE, i.iKytTarihi, 104) <= CONVERT(DATE, @1, 104)
         GROUP BY i.iKytTarihi
         ORDER BY CONVERT(DATE, i.iKytTarihi, 104) DESC
         OPTION (MAXDOP 2);
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
        FROM ${tableName} i
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
        FROM ${tableName} i
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
        FROM ${tableName}
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

      const tableName = this.dbConfig.getTableName('tblislem');

      const query = `
        SELECT DISTINCT islemGrup
        FROM ${tableName}
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

      const tableName = this.dbConfig.getTableName('tblCari');

      const query = `
        SELECT CariAdi
        FROM ${tableName}
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
      const kasaDevirTableName = this.dbConfig.getTableName('tblKasaDevir');
      const countQuery = `
        SELECT COUNT(*) as total
        FROM ${kasaDevirTableName}
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
        FROM ${kasaDevirTableName} kd
        ORDER BY kd.nKasaNo DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${rowsPerPage} ROWS ONLY
        OPTION (MAXDOP 2);
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
      const personelTableName = this.dbConfig.getTableName('tblPersonel');
      const query = `
        SELECT TOP 1 PrsnUsrNm 
        FROM ${personelTableName} 
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

      const tableName = this.dbConfig.getTableName('tblislemRST');

      const query = `
        SELECT COUNT(*) as count
        FROM ${tableName}
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

      const islemTableName = this.dbConfig.getTableName('tblislem');
      const islemRSTTableName = this.dbConfig.getTableName('tblislemRST');

      // Önce tblislem tablosundan kaydı getir
      const getIslemQuery = `
        SELECT *
        FROM ${islemTableName}
        WHERE islemNo = @0
      `;

      const islemResult = await this.dataSource.query(getIslemQuery, [islemNo]);

      if (!islemResult || islemResult.length === 0) {
        throw new Error(`İşlem numarası ${islemNo} bulunamadı`);
      }

      const islemData = islemResult[0];

      // tblislemRST tablosuna aktar
      const insertQuery = `
        INSERT INTO ${islemRSTTableName} (
          islemNo, iKytTarihi, islemKllnc, islemOzel1, islemOzel2, islemOzel3, islemOzel4,
          islemBirim, islemDoviz, islemKur, islemBilgi, islemCrKod, islemArac, islemTip,
          islemGrup, islemAltG, islemMiktar, islemTutar, Onay
        ) VALUES (
          @0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17, @18
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
        0
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

      const tableName = this.dbConfig.getTableName('tblislemRST');

      const query = `
        SELECT *
        FROM ${tableName}
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

      const tableName = this.dbConfig.getTableName('tblislemRST');

      const query = `
        DELETE FROM ${tableName}
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

      const tableName = this.dbConfig.getTableName('tblislem');

      const query = `
        UPDATE ${tableName}
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

      const tblIslemRST = this.dbConfig.getTableName('tblislemRST');
      const tblIslem = this.dbConfig.getTableName('tblislem');

      // tblislemRST'den ilgili kaydı çek
      const rstRecord = await this.dataSource.query(
        `SELECT * FROM ${tblIslemRST} WHERE islemNo = @0`,
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
        UPDATE ${tblIslem}
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

      const tblIslem = this.dbConfig.getTableName('tblislem');
      const tblIslemARV = this.dbConfig.getTableName('tblislemARV');

      // Aktif kullanıcı bilgisini al (parametre olarak gelen username veya fallback)
      const aktifKullanici = username || await this.getAktifKullaniciAdi();

      // Önce tblislem tablosundan kaydı çek
      const islemRecord = await this.dataSource.query(
        `SELECT * FROM ${tblIslem} WHERE islemNo = @0`,
        [islemNo],
      );

      if (!islemRecord || islemRecord.length === 0) {
        throw new Error(`tblislem tablosunda islemNo ${islemNo} bulunamadı.`);
      }

      const dataToArchive = islemRecord[0];

      // tblislemARV tablosuna arşiv kaydı ekle
      const archiveQuery = `
        INSERT INTO ${tblIslemARV} (
          islemNo, iKytTarihi, islemKllnc, islemOzel1, islemOzel2, islemOzel3, 
          islemOzel4, islemBirim, islemDoviz, islemKur, islemBilgi, islemCrKod, 
          islemArac, islemTip, islemGrup, islemAltG, islemMiktar, islemTutar, Onay
        ) VALUES (
          @0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17, @18
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
        0
      ];

      await this.dataSource.query(archiveQuery, archiveParams);

      // Şimdi tblislem tablosundan kaydı sil
      const deleteQuery = `
        DELETE FROM ${tblIslem} WHERE islemNo = @0
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

      const tblIslemARV = this.dbConfig.getTableName('tblislemARV');

      const query = `
        SELECT TOP 1 * FROM ${tblIslemARV}
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

      const tblIslemARV = this.dbConfig.getTableName('tblislemARV');

      // Basit yaklaşım: mevcut islemNo'dan büyük olan en küçük islemNo'yu bul
      const nextRecordQuery = `
        SELECT TOP 1 *
        FROM ${tblIslemARV}
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

      const tblIslemARV = this.dbConfig.getTableName('tblislemARV');

      // Basit yaklaşım: mevcut islemNo'dan küçük olan en büyük islemNo'yu bul
      const previousRecordQuery = `
        SELECT TOP 1 *
        FROM ${tblIslemARV}
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

      const tblIslemARV = this.dbConfig.getTableName('tblislemARV');
      const tblIslem = this.dbConfig.getTableName('tblislem');

      // Arşiv kaydını getir
      const arvRecord = await this.dataSource.query(
        `SELECT * FROM ${tblIslemARV} WHERE islemNo = @0`,
        [islemNo],
      );

      if (!arvRecord || arvRecord.length === 0) {
        throw new Error('Arşiv kaydı bulunamadı');
      }

      const arvData = arvRecord[0];

      // tblislem tablosuna geri yükle
      const insertQuery = `
        INSERT INTO ${tblIslem} (
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
        `DELETE FROM ${tblIslemARV} WHERE islemNo = @0`,
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
   * tblislemRST.Onay alanını günceller
   */
  async setIslemRSTOnay(islemNo: number, onay: number): Promise<{ success: boolean }> {

    const tableName = this.dbConfig.getTableName('tblislemRST');
    const query = `UPDATE ${tableName} SET Onay = @1 WHERE islemNo = @0`;
    await this.dataSource.query(query, [islemNo, onay]);
    return { success: true };
  }

  /**
   * tblislemARV.Onay alanını günceller
   */
  async setIslemARVOnay(islemNo: number, onay: number): Promise<{ success: boolean }> {

    const tableName = this.dbConfig.getTableName('tblislemARV');
    const query = `UPDATE ${tableName} SET Onay = @1 WHERE islemNo = @0`;
    await this.dataSource.query(query, [islemNo, onay]);
    return { success: true };
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
   * Güncel işlem tarihini DD.MM.YYYY formatında döndürür
   */
  private getCurrentTransactionDate(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
  }

  /**
   * spr_islemEkleYn stored procedure ile tblislem tablosuna kayıt ekler
   */
  private async ekleIslemKaydi(queryRunner: QueryRunner, data: {
    iKytTarihi: string;
    islemKllnc: string;
    islemCrKod: string;
    islemOzel1: string;
    islemOzel2: string;
    islemOzel3: string;
    islemOzel4: string;
    islemArac: string;
    islemTip: string;
    islemGrup: string;
    islemAltG: string;
    islemBilgi: string;
    islemMiktar: number;
    islemBirim: string;
    islemTutar: number;
    islemDoviz: string;
    islemKur: number;
  }): Promise<void> {
    try {
      const storedProcedures = this.dbConfig.getStoredProcedures();
      const spQuery = `
        EXEC ${storedProcedures.islemEkle}
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
      
      const spParams = [
        data.iKytTarihi,           // @0 - iKytTarihi
        data.islemKllnc,           // @1 - islemKllnc
        data.islemCrKod,           // @2 - islemCrKod
        data.islemOzel1,           // @3 - islemOzel1
        data.islemOzel2,           // @4 - islemOzel2
        data.islemOzel3,           // @5 - islemOzel3
        data.islemOzel4,           // @6 - islemOzel4
        data.islemArac,            // @7 - islemArac
        data.islemTip,             // @8 - islemTip
        data.islemGrup,            // @9 - islemGrup
        data.islemAltG,            // @10 - islemAltG
        data.islemBilgi,           // @11 - islemBilgi
        data.islemMiktar,          // @12 - islemMiktar
        data.islemBirim,           // @13 - islemBirim
        data.islemTutar,           // @14 - islemTutar
        data.islemDoviz,           // @15 - islemDoviz
        data.islemKur               // @16 - islemKur
      ];
      
      console.log('🔥 Stored procedure çağrısı:', spQuery);
      console.log('🔥 Stored procedure parametreleri:', spParams);
      
      const result = await queryRunner.manager.query(spQuery, spParams);
      console.log('🔥 Stored procedure sonucu:', result);
      
    } catch (error) {
      console.error('🔥 Stored procedure hatası:', error);
      throw new Error(`İşlem kaydı eklenirken hata: ${error.message}`);
    }
  }

  /**
   * tblFonKasaY tablosuna yeni nakit akış kaydı ekler ve gerekli işlem kayıtlarını oluşturur
   */
  async addNakitAkis(data: {
    OdmVade: string;
    islmArac: string;
    islmGrup: string;
    islmAltG: string;
    islmTip: string;
    islmTtr: number;
    islmTkst: string | number; // String veya number olabilir (örn: "1 / 1" veya 1)
    islmBilgi: string;
    OdmDrm: boolean;
    ttrDrm: boolean;
  }): Promise<{ success: boolean; message: string; islmNo?: number }> {
      const queryRunner = this.dataSource.createQueryRunner();
      
      try {
        await queryRunner.connect();
      await queryRunner.startTransaction();
      
      // Transaction timeout'u artır (60 saniye)
      await queryRunner.manager.query('SET LOCK_TIMEOUT 60000');
      
      // Bugünün tarihini al
      const bugunTarihi = this.getCurrentTransactionDate();
      
      // Taksit bilgisini kontrol et - mevcut değer direkt kullanılır
      let taksitSayisi = 1;
      let taksitSira = 1;
      
      // Taksit parsing kaldırıldı - mevcut değer direkt kullanılır
      console.log('🔥 Taksit bilgisi (parsing yapılmadan):', data.islmTkst);
      
      // Sadece bugünün tarihindeki kayıtlar için ek işlem yap
      const bugunTarihliMi = data.OdmVade === bugunTarihi;
      const ilkTaksitMi = true; // Taksit parsing kaldırıldı, her zaman true
      
      if (bugunTarihliMi && ilkTaksitMi) {
        console.log('🔥 Bugünün tarihinde ve ilk taksit - ek işlem kayıtları oluşturulacak');
        
        // tblFonKasaY tablosuna INSERT
        const fonKasaYTableName = this.dbConfig.getTableName('tblFonKasaY');
        const insertQuery = `
          INSERT INTO ${fonKasaYTableName} (
            OdmVade, islmArac, islmGrup, islmAltG, islmTip, 
            islmTtr, islmTkst, islmBilgi, OdmDrm, ttrDrm
          ) VALUES (
            @0, @1, @2, @3, @4, @5, @6, @7, @8, @9
          );
          SELECT SCOPE_IDENTITY() as fKasaNo;
        `;
        
        const insertParams = [
          data.OdmVade,           // @0 - OdmVade
          data.islmArac,          // @1 - islmArac
          data.islmGrup,          // @2 - islmGrup
          data.islmAltG,          // @3 - islmAltG
          data.islmTip,           // @4 - islmTip
          data.islmTtr,           // @5 - islmTtr
          data.islmTkst,          // @6 - islmTkst
          data.islmBilgi,         // @7 - islmBilgi
          data.OdmDrm ? 1 : 0,    // @8 - OdmDrm (boolean -> int)
          data.ttrDrm ? 1 : 0    // @9 - ttrDrm (boolean -> int)
        ];
        
        console.log('🔥 INSERT Query:', insertQuery);
        console.log('🔥 INSERT Params:', insertParams);
        
        const result = await queryRunner.manager.query(insertQuery, insertParams);
        console.log('🔥 INSERT Result:', result);
        
        // fKasaNo'yu al
        let fKasaNo: number | undefined;
        console.log('🔥 INSERT Result detayı:', JSON.stringify(result, null, 2));
        
        if (result && Array.isArray(result) && result.length > 0) {
          const firstResult = result[0];
          console.log('🔥 First result:', firstResult);
          
          if (firstResult && typeof firstResult === 'object' && 'fKasaNo' in firstResult) {
            fKasaNo = firstResult.fKasaNo;
            console.log('🔥 Parsed fKasaNo:', fKasaNo);
          }
        }
        
        if (!fKasaNo) {
          throw new Error('tblFonKasaY kaydından fKasaNo alınamadı');
        }
        
        console.log('🔥 Alınan fKasaNo:', fKasaNo);
        
        // Aktif kullanıcı bilgisini al
        const aktifKullanici = await this.getAktifKullaniciAdi();
        console.log('🔥 Aktif kullanıcı:', aktifKullanici);
        
        // İşlem Kategorisi = "Diğer(Şirket Ödm.)" kontrolü
        if (data.islmGrup === 'Diğer(Şirket Ödm.)') {
          console.log('🔥 İşlem Kategorisi "Diğer(Şirket Ödm.)" - GİDER/GELİR kaydı eklenecek');
          
          // İşlem Tipi "Çıkan" ise "GİDER", "Giren" ise "GELİR" kaydı ekle
          const islemTipi = data.islmTip === 'Çıkan' ? 'GİDER' : 'GELİR';
          
          await this.ekleIslemKaydi(queryRunner, {
            iKytTarihi: bugunTarihi,
            islemKllnc: aktifKullanici,
            islemCrKod: 'AF10001',
            islemOzel1: '',
            islemOzel2: '',
            islemOzel3: '',
            islemOzel4: '',
            islemArac: 'Cari İşlem',
            islemTip: islemTipi,
            islemGrup: data.islmAltG,
            islemAltG: `pgFON KAYIT: ${fKasaNo}`,
            islemBilgi: data.islmBilgi,
            islemMiktar: 1.00,
            islemBirim: 'Adet',
            islemTutar: data.islmTtr,
            islemDoviz: 'TL',
            islemKur: 1.00
          });
          
          console.log(`🔥 ${islemTipi} kaydı eklendi`);
        }
        
        // Ödendi checkbox true olan kayıtlar için ek kayıt ekle
        if (data.OdmDrm) {
          console.log('🔥 Ödendi checkbox true - ek kayıt eklenecek');
          
          // İşlem Aracına göre islemCrKod belirle
          let islemCrKod = '';
          switch (data.islmArac) {
            case 'Nakit Kasa(TL)':
              islemCrKod = 'PN10000';
              break;
            case 'Banka EFT':
              islemCrKod = 'PB10000';
              break;
            case 'Kredi Kartları':
              islemCrKod = 'PK10000';
              break;
            default:
              islemCrKod = 'PN10000'; // Varsayılan
          }
          
          // islemAltG için ön ek belirle
          const islemAltGOnEk = data.islmGrup === 'Diğer(Şirket Ödm.)' ? 'pgFON KAYIT:' : 'FON KAYIT:';
          
          await this.ekleIslemKaydi(queryRunner, {
            iKytTarihi: bugunTarihi,
            islemKllnc: aktifKullanici,
            islemCrKod: islemCrKod,
            islemOzel1: '',
            islemOzel2: '',
            islemOzel3: '',
            islemOzel4: '',
            islemArac: data.islmArac,
            islemTip: data.islmTip,
            islemGrup: data.islmAltG,
            islemAltG: `${islemAltGOnEk} ${fKasaNo}`,
            islemBilgi: data.islmBilgi,
            islemMiktar: 1.00,
            islemBirim: 'Adet',
            islemTutar: data.islmTtr,
            islemDoviz: 'TL',
            islemKur: 1.00
          });
          
          console.log(`🔥 ${data.islmTip} kaydı eklendi (islemCrKod: ${islemCrKod})`);
        }
        
        // Transaction'ı commit et
        await queryRunner.commitTransaction();
        
        const response = {
          success: true,
          message: 'Nakit akış kaydı ve ek işlem kayıtları başarıyla eklendi',
          fKasaNo: fKasaNo
        };
        
        console.log('🔥 Service response:', response);
        return response;
        
      } else {
        // Sadece tblFonKasaY tablosuna INSERT (ek işlem yok)
        console.log('🔥 Sadece tblFonKasaY kaydı - ek işlem yok');
        
        const fonKasaYTableName = this.dbConfig.getTableName('tblFonKasaY');
        const insertQuery = `
          INSERT INTO ${fonKasaYTableName} (
            OdmVade, islmArac, islmGrup, islmAltG, islmTip, 
            islmTtr, islmTkst, islmBilgi, OdmDrm, ttrDrm
          ) VALUES (
            @0, @1, @2, @3, @4, @5, @6, @7, @8, @9
          )
        `;
        
        const insertParams = [
          data.OdmVade,           // @0 - OdmVade
          data.islmArac,          // @1 - islmArac
          data.islmGrup,          // @2 - islmGrup
          data.islmAltG,          // @3 - islmAltG
          data.islmTip,           // @4 - islmTip
          data.islmTtr,           // @5 - islmTtr
          data.islmTkst,          // @6 - islmTkst
          data.islmBilgi,         // @7 - islmBilgi
          data.OdmDrm ? 1 : 0,    // @8 - OdmDrm (boolean -> int)
          data.ttrDrm ? 1 : 0    // @9 - ttrDrm (boolean -> int)
        ];
        
        console.log('🔥 INSERT Query:', insertQuery);
        console.log('🔥 INSERT Params:', insertParams);
        
        const result = await queryRunner.manager.query(insertQuery, insertParams);
        console.log('🔥 INSERT Result:', result);
        
        // Transaction'ı commit et
        await queryRunner.commitTransaction();
        
        const response = {
          success: true,
          message: 'Nakit akış kaydı başarıyla eklendi'
        };
        
        console.log('🔥 Service response:', response);
        return response;
      }
      
    } catch (error) {
      console.error('🔥 Hata oluştu, transaction rollback yapılıyor:', error);
      await queryRunner.rollbackTransaction();
      throw new Error(`Nakit akış kaydı eklenirken hata: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * tblFonKasaY tablosundan nakit akış kaydını siler ve ilgili tblislem kayıtlarını da temizler
   */
  async deleteNakitAkis(data: {
    fKasaNo: number; // Silme için gerekli (WHERE koşulu)
  }): Promise<{ success: boolean; message: string }> {
      const queryRunner = this.dataSource.createQueryRunner();
      
      try {
        await queryRunner.connect();
      await queryRunner.startTransaction();
      
      // Transaction timeout'u artır (60 saniye)
      await queryRunner.manager.query('SET LOCK_TIMEOUT 60000');
      
      // 1. ÖNCE İLGİLİ tblislem KAYITLARINI SİL
      console.log('🔥 İlgili tblislem kayıtları siliniyor, fKasaNo:', data.fKasaNo);
      
      const tableName = this.dbConfig.getTableName('tblislem');
      // Önce mevcut kayıt bilgilerini al (islmGrup için)
      const fonKasaYTableName = this.dbConfig.getTableName('tblFonKasaY');
      const getKayitQuery = `
        SELECT islmGrup FROM ${fonKasaYTableName} WHERE fKasaNo = @0
      `;
      
      const kayitResult = await queryRunner.manager.query(getKayitQuery, [data.fKasaNo]);
      
      if (kayitResult && kayitResult.length > 0) {
        const islmGrup = kayitResult[0].islmGrup;
        
        // İşlem Kategorisi = "Diğer(Şirket Ödm.)" kontrolü
        const islemAltGOnEk = islmGrup === 'Diğer(Şirket Ödm.)' ? 'pgFON KAYIT:' : 'FON KAYIT:';
        const silinecekIslemAltG = `${islemAltGOnEk} ${data.fKasaNo}`;
        
        console.log('🔥 Silinecek islemAltG pattern:', silinecekIslemAltG);
        
        // tblislem tablosundan ilgili kayıtları sil
        const deleteIslemQuery = `
          DELETE FROM ${tableName} 
          WHERE islemAltG = @0
        `;
        
        const deleteIslemParams = [silinecekIslemAltG];
        
        console.log('🔥 DELETE tblislem Query:', deleteIslemQuery);
        console.log('🔥 DELETE tblislem Params:', deleteIslemParams);
        
        const deleteIslemResult = await queryRunner.manager.query(deleteIslemQuery, deleteIslemParams);
        console.log('🔥 DELETE tblislem Result:', deleteIslemResult);
        
        console.log('🔥 tblislem kayıtları silindi');
      }
      
      // 2. tblFonKasaY tablosundan DELETE
      console.log('🔥 tblFonKasaY kaydı siliniyor');
      
      const deleteFonQuery = `
          DELETE FROM ${fonKasaYTableName} 
          WHERE fKasaNo = @0
        `;
        
      const deleteFonParams = [
          data.fKasaNo,           // @0 - fKasaNo (WHERE koşulu)
        ];
        
        // 🔥 DEBUG: DELETE query ve parametreleri logla
      console.log('🔥 DELETE tblFonKasaY Query:', deleteFonQuery);
      console.log('🔥 DELETE tblFonKasaY Params:', deleteFonParams);
        
      const result = await queryRunner.manager.query(deleteFonQuery, deleteFonParams);
        
        // 🔥 DEBUG: DELETE sonucunu logla
      console.log('🔥 DELETE tblFonKasaY Result:', result);
      console.log('🔥 DELETE tblFonKasaY affectedRows:', result?.affectedRows);
        
        // SQL Server'da DELETE sonucu undefined olabilir ama kayıt silinmiş olabilir
        if (!result) {
          console.log('🔥 DELETE Result undefined - SQL Server davranışı, kayıt silinmiş olabilir');
        } else if (result.affectedRows === 0) {
          console.error('🔥 DELETE başarısız - affectedRows: 0');
          throw new Error('Kayıt bulunamadı veya silinemedi');
        }
        
        console.log('🔥 DELETE başarılı - affectedRows:', result?.affectedRows || 'undefined (SQL Server)');
      
      // Transaction'ı commit et
      await queryRunner.commitTransaction();
        
        const response = {
          success: true,
        message: 'Nakit akış kaydı ve ilgili işlem kayıtları başarıyla silindi'
        };
        
        console.log('🔥 Service DELETE response:', response);
        return response;
        
    } catch (error) {
      console.error('🔥 Hata oluştu, transaction rollback yapılıyor:', error);
      await queryRunner.rollbackTransaction();
      throw new Error(`Nakit akış kaydı silinirken hata: ${error.message}`);
      } finally {
        await queryRunner.release();
    }
  }

  /**
   * Kısmi ödeme yapar - mevcut ek işlem kayıtlarını siler, yeni kayıt ekler ve mevcut kaydı günceller
   */
  async kismiOdemeYap(data: {
    odenenTutar: number;
    ertelemeTarihi: string;
    mevcutKayit: {
      OdmVade: string;
      islmArac: string;
      islmGrup: string;
      islmAltG: string;
      islmTip: string;
      islmTtr: number;
      islmTkst: string | number; // String veya number olabilir (örn: "1 / 1" veya 1)
      islmBilgi: string;
      OdmDrm: boolean;
      ttrDrm: boolean;
      fKasaNo: number;
    };
  }): Promise<{ success: boolean; message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      
      console.log('🔥 Kısmi ödeme başlıyor:', {
        fKasaNo: data.mevcutKayit.fKasaNo,
        odenenTutar: data.odenenTutar,
        ertelemeTarihi: data.ertelemeTarihi,
        mevcutTutar: data.mevcutKayit.islmTtr
      });
      
      // Kalan tutarı hesapla
      const kalanTutar = data.mevcutKayit.islmTtr - data.odenenTutar;
      
      // Transaction timeout'u artır (60 saniye)
      await queryRunner.manager.query('SET LOCK_TIMEOUT 60000');
      
      // 1. ÖNCE MEVCUT EK İŞLEM KAYITLARINI SİL (mevcut kayıt için)
      console.log('🔥 Mevcut ek işlem kayıtları siliniyor, fKasaNo:', data.mevcutKayit.fKasaNo);
      
      // İşlem Kategorisi = "Diğer(Şirket Ödm.)" kontrolü
      const islemAltGOnEk = data.mevcutKayit.islmGrup === 'Diğer(Şirket Ödm.)' ? 'pgFON KAYIT:' : 'FON KAYIT:';
      const silinecekIslemAltG = `${islemAltGOnEk} ${data.mevcutKayit.fKasaNo}`;
      
      console.log('🔥 Silinecek islemAltG pattern:', silinecekIslemAltG);
      
      // tblislem tablosundan mevcut ek işlem kayıtlarını sil
      const tableName = this.dbConfig.getTableName('tblislem');
      const deleteQuery = `
        DELETE FROM ${tableName} 
        WHERE islemAltG = @0
      `;
      
      const deleteParams = [silinecekIslemAltG];
      
      console.log('🔥 DELETE Query:', deleteQuery);
      console.log('🔥 DELETE Params:', deleteParams);
      
      const deleteResult = await queryRunner.manager.query(deleteQuery, deleteParams);
      console.log('🔥 DELETE Result:', deleteResult);
      
      // 1.5. YENİ EK İŞLEM KAYITLARINI EKLE (sadece gerekli olanlar)
      console.log('🔥 Yeni ek işlem kayıtları ekleniyor');
      
      // Bugünün tarihini al
      const bugunTarihi = this.getCurrentTransactionDate();
      
      // Aktif kullanıcı bilgisini al
      const aktifKullanici = await this.getAktifKullaniciAdi();
      console.log('🔥 Aktif kullanıcı:', aktifKullanici);
      
      // İşlem Kategorisi = "Diğer(Şirket Ödm.)" kontrolü
      if (data.mevcutKayit.islmGrup === 'Diğer(Şirket Ödm.)') {
        console.log('🔥 İşlem Kategorisi "Diğer(Şirket Ödm.)" - GİDER/GELİR kaydı eklenecek');
        
        // İşlem Tipi "Çıkan" ise "GİDER", "Giren" ise "GELİR" kaydı ekle
        const islemTipi = data.mevcutKayit.islmTip === 'Çıkan' ? 'GİDER' : 'GELİR';
        
        await this.ekleIslemKaydi(queryRunner, {
          iKytTarihi: bugunTarihi,
          islemKllnc: aktifKullanici,
          islemCrKod: 'AF10001',
          islemOzel1: '',
          islemOzel2: '',
          islemOzel3: '',
          islemOzel4: '',
          islemArac: 'Cari İşlem',
          islemTip: islemTipi,
          islemGrup: data.mevcutKayit.islmAltG,
          islemAltG: `pgFON KAYIT: ${data.mevcutKayit.fKasaNo}`,
          islemBilgi: data.mevcutKayit.islmBilgi,
          islemMiktar: 1.00,
          islemBirim: 'Adet',
          islemTutar: data.odenenTutar, // Ödenen tutar
          islemDoviz: 'TL',
          islemKur: 1.00
        });
        
        console.log(`🔥 ${islemTipi} kaydı eklendi (tutar: ${data.odenenTutar})`);
      }
      
      // Ödendi checkbox true olan kayıtlar için ek kayıt ekle
      if (data.mevcutKayit.OdmDrm) {
        console.log('🔥 Ödendi checkbox true - ek kayıt eklenecek');
        
        // İşlem Aracına göre islemCrKod belirle
        let islemCrKod = '';
        switch (data.mevcutKayit.islmArac) {
          case 'Nakit Kasa(TL)':
            islemCrKod = 'PN10000';
            break;
          case 'Banka EFT':
            islemCrKod = 'PB10000';
            break;
          case 'Kredi Kartları':
            islemCrKod = 'PK10000';
            break;
          default:
            islemCrKod = 'PN10000'; // Varsayılan
        }
        
        // islemAltG için ön ek belirle
        const islemAltGOnEk = data.mevcutKayit.islmGrup === 'Diğer(Şirket Ödm.)' ? 'pgFON KAYIT:' : 'FON KAYIT:';
        
        await this.ekleIslemKaydi(queryRunner, {
          iKytTarihi: bugunTarihi,
          islemKllnc: aktifKullanici,
          islemCrKod: islemCrKod,
          islemOzel1: '',
          islemOzel2: '',
          islemOzel3: '',
          islemOzel4: '',
          islemArac: data.mevcutKayit.islmArac,
          islemTip: data.mevcutKayit.islmTip,
          islemGrup: data.mevcutKayit.islmAltG,
          islemAltG: `${islemAltGOnEk} ${data.mevcutKayit.fKasaNo}`,
          islemBilgi: data.mevcutKayit.islmBilgi,
          islemMiktar: 1.00,
          islemBirim: 'Adet',
          islemTutar: data.odenenTutar, // Ödenen tutar
          islemDoviz: 'TL',
          islemKur: 1.00
        });
        
        console.log(`🔥 ${data.mevcutKayit.islmTip} kaydı eklendi (islemCrKod: ${islemCrKod}, tutar: ${data.odenenTutar})`);
      }
      
      // 2. YENİ KAYIT EKLE (kalan tutar için) - direkt INSERT
      console.log('🔥 Yeni kayıt ekleniyor (kalan tutar için)');
      
      const fonKasaYTableName = this.dbConfig.getTableName('tblFonKasaY');
      const yeniKayitQuery = `
        INSERT INTO ${fonKasaYTableName} (
          OdmVade, islmArac, islmGrup, islmAltG, islmTip, 
          islmTtr, islmTkst, islmBilgi, OdmDrm, ttrDrm
        ) VALUES (
          @0, @1, @2, @3, @4, @5, @6, @7, @8, @9
        )
      `;
      
      const yeniKayitParams = [
        data.ertelemeTarihi,           // @0 - OdmVade
        data.mevcutKayit.islmArac,     // @1 - islmArac
        data.mevcutKayit.islmGrup,     // @2 - islmGrup
        data.mevcutKayit.islmAltG,     // @3 - islmAltG
        data.mevcutKayit.islmTip,      // @4 - islmTip
        kalanTutar,                    // @5 - islmTtr (kalan tutar)
        data.mevcutKayit.islmTkst,     // @6 - islmTkst (orijinal taksit bilgisi)
        data.mevcutKayit.islmBilgi,    // @7 - islmBilgi
        0,                             // @8 - OdmDrm (false)
        data.mevcutKayit.ttrDrm ? 1 : 0 // @9 - ttrDrm
      ];
      
      console.log('🔥 Yeni kayıt INSERT Query:', yeniKayitQuery);
      console.log('🔥 Yeni kayıt INSERT Params:', yeniKayitParams);
      
      const insertResult = await queryRunner.manager.query(yeniKayitQuery, yeniKayitParams);
      console.log('🔥 Yeni kayıt INSERT Result:', insertResult);
      
      // 3. MEVCUT KAYDI GÜNCELLE (ödenen tutar için) - direkt UPDATE
      console.log('🔥 Mevcut kayıt güncelleniyor (ödenen tutar için)');
      
      const updateQuery = `
        UPDATE ${fonKasaYTableName} 
        SET 
          islmTtr = @0
        WHERE fKasaNo = @1
      `;
      
      const updateParams = [
        data.odenenTutar,       // @0 - islmTtr (ödenen tutar)
        data.mevcutKayit.fKasaNo // @1 - fKasaNo (WHERE clause)
      ];
      
      console.log('🔥 UPDATE Query:', updateQuery);
      console.log('🔥 UPDATE Params:', updateParams);
      
      const updateResult = await queryRunner.manager.query(updateQuery, updateParams);
      console.log('🔥 UPDATE Result:', updateResult);
      
      // Transaction'ı commit et
      await queryRunner.commitTransaction();
      
      const response = {
        success: true,
        message: `Kısmi ödeme başarıyla yapıldı. Kalan tutar: ${kalanTutar}`
      };
      
      console.log('🔥 Kısmi ödeme response:', response);
      return response;
      
    } catch (error) {
      console.error('🔥 Hata oluştu, transaction rollback yapılıyor:', error);
      await queryRunner.rollbackTransaction();
      throw new Error(`Kısmi ödeme yapılırken hata: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * tblFonKasaY tablosunda nakit akış kaydını günceller ve ek işlem kayıtlarını yeniden oluşturur
   */
  async updateNakitAkis(data: {
    OdmVade: string;
    islmArac: string;
    islmGrup: string;
    islmAltG: string;
    islmTip: string;
    islmTtr: number;
    // islmTkst alanı güncelleme dışında bırakıldı
    islmBilgi: string;
    OdmDrm: boolean;
    ttrDrm: boolean;
    fKasaNo: number; // Güncelleme için gerekli (WHERE koşulu)
    isKismiOdeme?: boolean; // Kısmi ödeme kontrolü için
  }): Promise<{ success: boolean; message: string }> {
      const queryRunner = this.dataSource.createQueryRunner();
      
      try {
        await queryRunner.connect();
      await queryRunner.startTransaction();
      
      // Transaction timeout'u artır (60 saniye)
      await queryRunner.manager.query('SET LOCK_TIMEOUT 60000');
      
      // 1. ÖNCE MEVCUT EK İŞLEM KAYITLARINI SİL
      console.log('🔥 Mevcut ek işlem kayıtları siliniyor, fKasaNo:', data.fKasaNo);
      
      // İşlem Kategorisi = "Diğer(Şirket Ödm.)" kontrolü
      const islemAltGOnEk = data.islmGrup === 'Diğer(Şirket Ödm.)' ? 'pgFON KAYIT:' : 'FON KAYIT:';
      const silinecekIslemAltG = `${islemAltGOnEk} ${data.fKasaNo}`;
      
      console.log('🔥 Silinecek islemAltG pattern:', silinecekIslemAltG);
      
      // tblislem tablosundan mevcut ek işlem kayıtlarını sil
      const tableName = this.dbConfig.getTableName('tblislem');
      const deleteQuery = `
        DELETE FROM ${tableName} 
        WHERE islemAltG = @0
      `;
      
      const deleteParams = [silinecekIslemAltG];
      
      console.log('🔥 DELETE Query:', deleteQuery);
      console.log('🔥 DELETE Params:', deleteParams);
      
      const deleteResult = await queryRunner.manager.query(deleteQuery, deleteParams);
      console.log('🔥 DELETE Result:', deleteResult);
      
      // 2. tblFonKasaY tablosunda UPDATE (islmTkst hariç - readonly alan)
      console.log('🔥 tblFonKasaY kaydı güncelleniyor (islmTkst hariç)');
      
        const fonKasaYTableName = this.dbConfig.getTableName('tblFonKasaY');
        const updateQuery = `
          UPDATE ${fonKasaYTableName} 
          SET 
            OdmVade = @0,
            islmArac = @1,
            islmGrup = @2,
            islmAltG = @3,
            islmTip = @4,
            islmTtr = @5,
            islmBilgi = @6,
            OdmDrm = @7,
            ttrDrm = @8
          WHERE fKasaNo = @9
        `;
        
        const updateParams = [
          data.OdmVade,           // @0 - OdmVade
          data.islmArac,          // @1 - islmArac
          data.islmGrup,          // @2 - islmGrup
          data.islmAltG,          // @3 - islmAltG
          data.islmTip,           // @4 - islmTip
          data.islmTtr,           // @5 - islmTtr
          data.islmBilgi,         // @6 - islmBilgi
          data.OdmDrm ? 1 : 0,    // @7 - OdmDrm (boolean -> int)
          data.ttrDrm ? 1 : 0,    // @8 - ttrDrm (boolean -> int)
          data.fKasaNo,           // @9 - fKasaNo (WHERE clause)
        ];
        
        console.log('🔥 UPDATE Query:', updateQuery);
        console.log('🔥 UPDATE Params:', updateParams);
        
      const updateResult = await queryRunner.manager.query(updateQuery, updateParams);
      console.log('🔥 UPDATE Result:', updateResult);
      
      // 3. YENİ EK İŞLEM KAYITLARINI EKLE (addNakitAkis ile aynı mantık)
      console.log('🔥 Yeni ek işlem kayıtları ekleniyor');
      
      // Bugünün tarihini al
      const bugunTarihi = this.getCurrentTransactionDate();
      
             // Taksit bilgisini kontrol et - mevcut değer direkt kullanılır
       let taksitSayisi = 1;
       let taksitSira = 1;
       
       // Mevcut kayıttan taksit bilgisini al (güncelleme sırasında mevcut değer kullanılır)
       const mevcutKayitQuery = `
         SELECT islmTkst FROM ${fonKasaYTableName} WHERE fKasaNo = @0
       `;
       const mevcutKayitResult = await queryRunner.manager.query(mevcutKayitQuery, [data.fKasaNo]);
       const mevcutTaksit = mevcutKayitResult[0]?.islmTkst || '1';
       
       // Taksit parsing kaldırıldı - mevcut değer direkt kullanılır
       console.log('🔥 Mevcut taksit bilgisi (parsing yapılmadan):', mevcutTaksit);
       
       // Sadece bugünün tarihindeki kayıtlar için ek işlem yap
       const bugunTarihliMi = data.OdmVade === bugunTarihi;
       const ilkTaksitMi = true; // Taksit parsing kaldırıldı, her zaman true
      
      if (bugunTarihliMi && ilkTaksitMi) {
        console.log('🔥 Bugünün tarihinde ve ilk taksit - ek işlem kayıtları oluşturulacak');
        
        // Aktif kullanıcı bilgisini al
        const aktifKullanici = await this.getAktifKullaniciAdi();
        console.log('🔥 Aktif kullanıcı:', aktifKullanici);
        
        // İşlem Kategorisi = "Diğer(Şirket Ödm.)" kontrolü
        if (data.islmGrup === 'Diğer(Şirket Ödm.)') {
          console.log('🔥 İşlem Kategorisi "Diğer(Şirket Ödm.)" - GİDER/GELİR kaydı eklenecek');
          
          // İşlem Tipi "Çıkan" ise "GİDER", "Giren" ise "GELİR" kaydı ekle
          const islemTipi = data.islmTip === 'Çıkan' ? 'GİDER' : 'GELİR';
          
          // Kısmi ödeme kontrolü - İşlemTutar bilgisi "Ödenen" alanından alınacak
          const islemTutari = data.isKismiOdeme ? data.islmTtr : data.islmTtr;
          console.log(`🔥 ${islemTipi} kaydı için İşlemTutar: ${islemTutari} (Kısmi ödeme: ${data.isKismiOdeme ? 'Evet' : 'Hayır'})`);
          
          await this.ekleIslemKaydi(queryRunner, {
            iKytTarihi: bugunTarihi,
            islemKllnc: aktifKullanici,
            islemCrKod: 'AF10001',
            islemOzel1: '',
            islemOzel2: '',
            islemOzel3: '',
            islemOzel4: '',
            islemArac: 'Cari İşlem',
            islemTip: islemTipi,
            islemGrup: data.islmAltG,
            islemAltG: `pgFON KAYIT: ${data.fKasaNo}`,
            islemBilgi: data.islmBilgi,
            islemMiktar: 1.00,
            islemBirim: 'Adet',
            islemTutar: islemTutari,
            islemDoviz: 'TL',
            islemKur: 1.00
          });
          
          console.log(`🔥 ${islemTipi} kaydı eklendi`);
        }
        
                  // Ödendi checkbox true olan kayıtlar için ek kayıt ekle
          if (data.OdmDrm) {
            console.log('🔥 Ödendi checkbox true - ek kayıt eklenecek');
            
            // İşlem Aracına göre islemCrKod belirle
            let islemCrKod = '';
            switch (data.islmArac) {
              case 'Nakit Kasa(TL)':
                islemCrKod = 'PN10000';
                break;
              case 'Banka EFT':
                islemCrKod = 'PB10000';
                break;
              case 'Kredi Kartları':
                islemCrKod = 'PK10000';
                break;
              default:
                islemCrKod = 'PN10000'; // Varsayılan
            }
            
            // islemAltG için ön ek belirle
            const islemAltGOnEk = data.islmGrup === 'Diğer(Şirket Ödm.)' ? 'pgFON KAYIT:' : 'FON KAYIT:';
            
            // Kısmi ödeme kontrolü - İşlemTutar bilgisi "Ödenen" alanından alınacak
            const islemTutari = data.isKismiOdeme ? data.islmTtr : data.islmTtr;
            console.log(`🔥 ${data.islmTip} kaydı için İşlemTutar: ${islemTutari} (Kısmi ödeme: ${data.isKismiOdeme ? 'Evet' : 'Hayır'})`);
            
            await this.ekleIslemKaydi(queryRunner, {
              iKytTarihi: bugunTarihi,
              islemKllnc: aktifKullanici,
              islemCrKod: islemCrKod,
              islemOzel1: '',
              islemOzel2: '',
              islemOzel3: '',
              islemOzel4: '',
              islemArac: data.islmArac,
              islemTip: data.islmTip,
              islemGrup: data.islmAltG,
              islemAltG: `${islemAltGOnEk} ${data.fKasaNo}`,
              islemBilgi: data.islmBilgi,
              islemMiktar: 1.00,
              islemBirim: 'Adet',
              islemTutar: islemTutari,
              islemDoviz: 'TL',
              islemKur: 1.00
            });
            
            console.log(`🔥 ${data.islmTip} kaydı eklendi (islemCrKod: ${islemCrKod})`);
          }
      } else {
        console.log('🔥 Sadece tblFonKasaY güncellemesi - ek işlem yok');
      }
      
      // Transaction'ı commit et
      await queryRunner.commitTransaction();
        
        const response = {
          success: true,
        message: 'Nakit akış kaydı ve ek işlem kayıtları başarıyla güncellendi'
        };
        
        console.log('🔥 Service UPDATE response:', response);
        return response;
        
    } catch (error) {
      console.error('🔥 Hata oluştu, transaction rollback yapılıyor:', error);
      await queryRunner.rollbackTransaction();
      throw new Error(`Nakit akış kaydı güncellenirken hata: ${error.message}`);
      } finally {
        await queryRunner.release();
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
   * Belirli grup için detay kayıtları
   */
  async getGrupDetay(grup: string, islemTip: string, startDDMMYYYY: string, endDDMMYYYY: string): Promise<any[]> {
    try {

      const tableName = this.dbConfig.getTableName('tblislem');

      const query = `
        SELECT 
          iKytTarihi,
          islemKllnc,
          islemArac,
          islemTip,
          islemGrup,
          islemAltG,
          islemBilgi,
          islemMiktar,
          islemTutar
        FROM ${tableName}
        WHERE islemGrup = @0
          AND islemTip = @1
          AND CONVERT(DATE, iKytTarihi, 104) BETWEEN CONVERT(DATE, @2, 104) AND CONVERT(DATE, @3, 104)
        ORDER BY CONVERT(DATE, iKytTarihi, 104) DESC, islemNo DESC
        OPTION (MAXDOP 2);
      `;

      const result = await this.dataSource.query(query, [grup, islemTip, startDDMMYYYY, endDDMMYYYY]);
      return result || [];
    } catch (error) {
      throw new Error(`Grup detay kayıtları alınamadı: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Bar chart detay kayıtları
   */
  async getBarChartDetay(label: string, islemTip: string, startDDMMYYYY: string, endDDMMYYYY: string): Promise<any[]> {
    try {

      const tableName = this.dbConfig.getTableName('tblislem');

      // Label'dan tarih aralığını belirle
      let dateFilter = ''
      const params: any[] = [islemTip]

      if (label.includes('-')) {
        // Haftalık format: "DD.MM-DD.MM"
        const [startPart, endPart] = label.split('-')
        const currentYear = new Date().getFullYear()
        const startDate = `${startPart}.${currentYear}`
        const endDate = `${endPart}.${currentYear}`
        dateFilter = `AND CONVERT(DATE, iKytTarihi, 104) BETWEEN CONVERT(DATE, @1, 104) AND CONVERT(DATE, @2, 104)`
        params.push(startDate, endDate)
      } else if (label.includes('.')) {
        // Günlük format: "DD.MM" veya "DD.MM.YYYY"
        if (label.split('.').length === 2) {
          // "DD.MM" formatı
          const currentYear = new Date().getFullYear()
          const fullDate = `${label}.${currentYear}`
          dateFilter = `AND CONVERT(DATE, iKytTarihi, 104) = CONVERT(DATE, @1, 104)`
          params.push(fullDate)
        } else {
          // "DD.MM.YYYY" formatı
          dateFilter = `AND CONVERT(DATE, iKytTarihi, 104) = CONVERT(DATE, @1, 104)`
          params.push(label)
        }
      } else {
        // Diğer formatlar için genel tarih aralığı
        dateFilter = `AND CONVERT(DATE, iKytTarihi, 104) BETWEEN CONVERT(DATE, @1, 104) AND CONVERT(DATE, @2, 104)`
        params.push(startDDMMYYYY, endDDMMYYYY)
      }

      const query = `
        SELECT 
          iKytTarihi,
          islemKllnc,
          islemArac,
          islemTip,
          islemGrup,
          islemAltG,
          islemBilgi,
          islemMiktar,
          islemTutar
        FROM ${tableName}
        WHERE islemTip = @0
          ${dateFilter}
        ORDER BY CONVERT(DATE, iKytTarihi, 104) DESC, islemNo DESC
        OPTION (MAXDOP 2);
      `;

      const result = await this.dataSource.query(query, params);
      return result || [];
    } catch (error) {
      throw new Error(`Bar chart detay kayıtları alınamadı: ${error instanceof Error ? error.message : String(error)}`);
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
               islemAltG, islemMiktar, islemTutar, Onay
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
               islemAltG, islemMiktar, islemTutar, Onay
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

  /**
   * Tüm ARV kayıtlarını getirir (debug/listeleme amaçlı)
   */
  async getAllArvRecords(): Promise<any[]> {
    try {
      const query = `
        SELECT islemNo, iKytTarihi, islemKllnc, islemOzel1, islemOzel2, 
               islemOzel3, islemOzel4, islemBirim, islemDoviz, islemKur, 
               islemBilgi, islemCrKod, islemArac, islemTip, islemGrup, 
               islemAltG, islemMiktar, islemTutar, Onay
        FROM tblislemARV 
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
      throw new Error(`Tüm ARV kayıtları alınamadı: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
