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

  private debugLog(...args: unknown[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  }

  /**
   * Kasa işlemleri için günlük toplamları getirir
   */
  async getKasaIslemleri(
    islemTuru: string,
    islemYonu?: string,
    page: number = 1,
    rowsPerPage: number = 15,
  ): Promise<{ data: KasaGunlukOzet[]; totalRecords: number }> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislem');

      // Tarih aralığı (son 1 yıl)
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

      this.debugLog('🔍 Debug bilgileri:');
      this.debugLog('- Schema:', schemaName);
      this.debugLog('- Tablo:', tableName);
      this.debugLog('- İşlem türü:', islemTuru);
      this.debugLog('- İşlem yönü:', islemYonu);
      this.debugLog('- Tarih aralığı:', baslangicTarihi, 'ile', bitisTarihi);

      // Gereksiz ağır debug sorguları kaldırıldı

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

      const countResultUnknown = (await this.dataSource.query(countQuery, [
        baslangicTarihi,
        bitisTarihi,
      ])) as unknown;
      const countResult = countResultUnknown as Array<{ total: number }>;
      const totalRecords = Number(countResult[0]?.total || 0);
      this.debugLog('🔍 Count Query sonucu:', countResult);
      this.debugLog('🔍 Toplam kayıt sayısı:', totalRecords);

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

      this.debugLog('🔍 SQL Sorgusu:', query);
      this.debugLog('🔍 Parametreler:', params);

      const resultUnknown = (await this.dataSource.query(
        query,
        params,
      )) as unknown;
      const result = resultUnknown as Array<{
        tarih: string;
        gelir: number | string | null;
        gider: number | string | null;
      }>;

      // Sadece 3 sütun döndür (bakiye hesaplama kaldırıldı)
      const processedData: KasaGunlukOzet[] = result.map((row) => ({
        tarih: row.tarih,
        gelir: Number(row.gelir) || 0,
        gider: Number(row.gider) || 0,
      }));

      return {
        data: processedData,
        totalRecords: totalRecords,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Kasa işlemleri getirme hatası:', message);
      throw new Error('Kasa işlemleri getirilemedi');
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
        this.debugLog('📝 KasaDevir INSERT (IDENTITY) sorgusu:', insertQuery);
        this.debugLog('📝 Parametreler:', params);
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
        this.debugLog(
          '📝 KasaDevir INSERT (manuel nKasaNo) sorgusu:',
          insertQuery,
        );
        this.debugLog('📝 Parametreler:', params);
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
    islemTuru: string,
    islemYonu: string,
    selectedYonu?: string,
    page: number = 1,
    rowsPerPage: number = 15,
  ): Promise<{ data: DetayIslem[]; totalRecords: number }> {
    try {
      const schemaName = this.dbConfig.getTableSchema();
      const tableName = this.dbConfig.getTableName('tblislem');

      this.debugLog('🔍 Detay işlemler debug bilgileri:');
      this.debugLog('- Schema:', schemaName);
      this.debugLog('- Tablo:', tableName);
      this.debugLog('- Tarih:', tarih);
      this.debugLog('- İşlem türü:', islemTuru);
      this.debugLog('- İşlem yönü:', islemYonu);
      this.debugLog('- Seçilen yön:', selectedYonu);

      // İşlem türüne göre islemArac filtresi
      let islemAracFilter = '';
      switch (islemTuru) {
        case 'cari':
          islemAracFilter = "i.islemArac = 'Cari İşlem'";
          break;
        case 'nakit':
          islemAracFilter = "i.islemArac = 'Nakit Kasa(TL)'";
          break;
        case 'kart':
          islemAracFilter = "i.islemArac = 'Kredi Kartları'";
          break;
        case 'eft':
          islemAracFilter = "i.islemArac = 'Banka EFT'";
          break;
        case 'acenta':
          islemAracFilter = "i.islemArac = 'Acenta Tahsilat'";
          break;
        case 'depozito':
          islemAracFilter =
            "(i.islemBilgi LIKE '%=DEPOZİTO TAHSİLATI=%' OR i.islemBilgi LIKE '%=DEPOZİTO İADESİ=%')";
          break;
        default:
          islemAracFilter = "i.islemArac = 'Cari İşlem'";
      }

      // İşlem yönüne göre islemTip filtresi
      let islemTipFilter = '';
      if (islemYonu === 'gelir-gider') {
        // Cari seçildiğinde GELİR/GİDER
        islemTipFilter =
          selectedYonu === 'gelir'
            ? "i.islemTip = 'GELİR'"
            : "i.islemTip = 'GİDER'";
      } else {
        // Diğer seçimlerde Giren/Çıkan
        islemTipFilter =
          selectedYonu === 'gelir'
            ? "i.islemTip = 'Giren'"
            : "i.islemTip = 'Çıkan'";
      }

      this.debugLog('🔍 islemTipFilter:', islemTipFilter);

      // Önce toplam kayıt sayısını al
      const countQuery = `
        SELECT COUNT(*) as total
        FROM ${schemaName}.${tableName} i
        WHERE ${islemAracFilter}
        AND ${islemTipFilter}
        AND i.iKytTarihi = @0
      `;

      const countDetayUnknown = (await this.dataSource.query(countQuery, [
        tarih,
      ])) as unknown;
      const countDetay = countDetayUnknown as Array<{ total: number }>;
      const totalRecords = Number(countDetay[0]?.total || 0);
      this.debugLog('🔍 Detay Count Query sonucu:', countDetay);
      this.debugLog('🔍 Detay toplam kayıt sayısı:', totalRecords);

      // Pagination için OFFSET hesapla
      const offset = (page - 1) * rowsPerPage;

      const query = `
        SELECT 
          ROW_NUMBER() OVER (ORDER BY i.islemNo DESC) as id,
          i.islemNo,
          i.iKytTarihi,
          i.islemAltG,
          i.islemGrup,
          i.islemTutar,
          i.islemBilgi
        FROM ${schemaName}.${tableName} i
        WHERE ${islemAracFilter}
        AND ${islemTipFilter}
        AND i.iKytTarihi = @0
        ORDER BY i.islemNo DESC
        OFFSET @1 ROWS
        FETCH NEXT @2 ROWS ONLY
      `;

      this.debugLog('🔍 Detay SQL Sorgusu:', query);
      this.debugLog('🔍 Parametreler:', [tarih, offset, rowsPerPage]);

      const resultUnknown2 = (await this.dataSource.query(query, [
        tarih,
        offset,
        rowsPerPage,
      ])) as unknown;
      const result = resultUnknown2 as Array<{
        id: number | string;
        islemNo?: number | string;
        iKytTarihi: string;
        islemAltG: string;
        islemGrup: string;
        islemTutar: number | string;
        islemBilgi: string;
      }>;
      this.debugLog('📊 Detay işlemler sonucu:', result);

      const typed: DetayIslem[] = (
        result as Array<{
          id: number;
          islemNo?: number | string;
          iKytTarihi: string;
          islemAltG: string;
          islemGrup: string;
          islemTutar: number | string;
          islemBilgi: string;
        }>
      ).map((row) => ({
        id: Number(row.id),
        islemNo: row.islemNo !== undefined ? Number(row.islemNo) : undefined,
        iKytTarihi: row.iKytTarihi,
        islemAltG: row.islemAltG,
        islemGrup: row.islemGrup,
        islemTutar: Number(row.islemTutar) || 0,
        islemBilgi: row.islemBilgi,
      }));

      return {
        data: typed,
        totalRecords: totalRecords,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Detay işlemler getirme hatası:', message);
      throw new Error('Detay işlemler getirilemedi');
    }
  }

  // Detay PDF üretimi
  async generateDetayPDF(
    tarih: string,
    islemTuru: string,
    islemYonu: string,
    selectedYonu: string,
  ): Promise<Buffer> {
    const data = await this.getDetayIslemler(
      tarih,
      islemTuru,
      islemYonu,
      selectedYonu,
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
        turLabelMap[String(islemTuru).toLowerCase()] || islemTuru;
      const yonLabel =
        String(islemYonu) === 'gelir-gider'
          ? String(selectedYonu) === 'gelir'
            ? 'GELİR'
            : 'GİDER'
          : String(selectedYonu) === 'gelir'
            ? 'Giren'
            : 'Çıkan';
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
    islemTuru: string,
    islemYonu: string,
    selectedYonu: string,
  ): Promise<Buffer> {
    const data = await this.getDetayIslemler(
      tarih,
      islemTuru,
      islemYonu,
      selectedYonu,
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

      this.debugLog(`📝 ${kayitlar.length} kayıt veritabanına yazılıyor...`);

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

          this.debugLog(
            `➡️ [${i + 1}/${kayitlar.length}] islemEkle çağrılıyor`,
            {
              iKytTarihi,
              islemKllnc,
              islemCrKod,
              islemArac,
              islemTip,
              islemGrup,
              islemAltG,
              islemTutar,
            },
          );

          await queryRunner.query(execQuery, params);
          results.push({ index: i, success: true, message: 'OK' });
        }

        await queryRunner.commitTransaction();
        this.debugLog(`✅ ${kayitlar.length} kayıt veritabanına yazıldı`);
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
    islemTuru: string,
    islemYonu?: string,
  ): Promise<number> {
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
        AND i.islemBilgi NOT LIKE '%=DEPOZİTO ALACAĞI=%'
      `;

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

      this.debugLog(`💰 Güncel bakiye hesaplandı (${islemTuru}):`, {
        toplamGelir,
        toplamGider,
        guncelBakiye,
      });

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
    islemTuru: string,
    islemYonu: string,
    secilenTarih: string,
  ): Promise<number> {
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

      this.debugLog(
        `💰 Seçilen gün bakiyesi hesaplandı (${islemTuru}, ${secilenTarih}):`,
        {
          toplamGelir,
          toplamGider,
          secilenGunBakiyesi,
        },
      );

      return secilenGunBakiyesi;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Seçilen gün bakiyesi hesaplama hatası:', message);
      return 0;
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
      this.debugLog(
        '📊 Kasa devir verileri alındı:',
        result.length,
        'kayıt (sayfa:',
        page,
        ')',
      );

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

      this.debugLog('👤 Aktif kullanıcı bilgisi alındı:', kullaniciAdi);
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
      this.debugLog('🔄 Kasa aktarımı başlatılıyor:', { veren, alan, tutar });

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

        this.debugLog('📤 Veren kasadan çıkış işlemi gerçekleştiriliyor...');
        await queryRunner.query(verenIslemQuery, verenIslemParams);
        this.debugLog('✅ Veren kasadan çıkış işlemi kaydedildi');

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

        this.debugLog('📥 Alan kasaya giriş işlemi gerçekleştiriliyor...');
        await queryRunner.query(verenIslemQuery, alanIslemParams);
        this.debugLog('✅ Alan kasaya giriş işlemi kaydedildi');

        // Transaction'ı commit et
        await queryRunner.commitTransaction();

        const basariliMesaj = `✅ Kasa aktarımı başarıyla tamamlandı!\n\n💰 ${verenParametreleri.islemArac} → ${alanParametreleri.islemArac}\n💵 Tutar: ${tutar.toLocaleString('tr-TR')} TL\n👤 İşlemi Yapan: ${islemKllnc}\n📅 Tarih: ${iKytTarihi}`;

        this.debugLog('✅ Kasa aktarımı başarıyla tamamlandı');

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
        this.debugLog('🔒 Transaction kaynakları serbest bırakıldı');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Kasa aktarımı genel hatası:', message);
      throw error; // Zaten formatlanmış hata mesajını tekrar formatlamaya gerek yok
    }
  }
}
