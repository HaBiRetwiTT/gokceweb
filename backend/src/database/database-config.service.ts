import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseConfigService {
  private readonly tableSchema: string;
  private readonly spSchema: string;

  constructor() {
    // Environment variables'dan schema bilgisini al, yoksa dbo kullan
    this.tableSchema = process.env.DB_TABLE_SCHEMA || 'dbo';
    this.spSchema = process.env.DB_SP_SCHEMA || 'dbo';

    console.log(
      `Database Schema Configuration: Tables=${this.tableSchema}, StoredProcedures=${this.spSchema}`,
    );
  }

  /**
   * Database connection configuration'ını döndürür
   */
  getDatabaseConfig() {
    // Environment variables kontrol et
    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT;
    const dbUsername = process.env.DB_USERNAME;
    const dbPassword = process.env.DB_PASSWORD;
    const dbDatabase = process.env.DB_DATABASE;
    const dbInstanceName = process.env.DB_INSTANCE_NAME;

    // Kritik environment variables eksikse uygulama başlamasın
    if (!dbHost || !dbUsername || !dbPassword || !dbDatabase) {
      const errorMessage = '❌ Kritik veritabanı environment variables eksik!';
      const details = `
📁 .env.production dosyası oluşturulmalı ve şu değerler tanımlanmalı:
   DB_HOST=${dbHost ? '✅' : '❌'} (${dbHost || 'eksik'})
   DB_USERNAME=${dbUsername ? '✅' : '❌'} (${dbUsername || 'eksik'})
   DB_PASSWORD=${dbPassword ? '✅' : '❌'} (${dbPassword ? '***' : 'eksik'})
   DB_DATABASE=${dbDatabase ? '✅' : '❌'} (${dbDatabase || 'eksik'})
   DB_PORT=${dbPort ? '✅' : '❌'} (${dbPort || '1433'})
      `;

      console.error(errorMessage);
      console.error(details);
      throw new Error(
        'Veritabanı konfigürasyonu eksik! .env.production dosyası oluşturulmalı.',
      );
    }

    return {
      type: 'mssql' as const,
      host: dbHost,
      port: parseInt(dbPort || '1433'),
      username: dbUsername,
      password: dbPassword,
      database: dbDatabase,
      synchronize: false, // Production'da asla true yapma!
      logging: false, // Production'da logging kapalı
      autoLoadEntities: true,
      options: {
        // VB.NET bağlantı string'ine uygun ayarlar
        encrypt: false, // Production'da false, SSL sertifika sorunu olabilir
        trustServerCertificate: true, // Sertifika güvenlik sorununu çözer
        enableArithAbort: true,
        instanceName: dbInstanceName || undefined,
        // Unicode desteği
        charset: 'utf8',
        // Windows Authentication kullanmıyor
        domain: undefined,
        // Bağlantı timeout ayarları
        connectionTimeout: 30000,
        requestTimeout: 30000,
        // Pool ayarları
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
        },
      },
    };
  }

  /**
   * Stored Procedure schema'sını döndürür
   */
  getSpSchema(): string {
    return this.spSchema;
  }

  /**
   * Tam tablo adını döndürür (schema + tablo)
   */
  getTableName(tableName: string): string {
    return `[${this.tableSchema}].[${tableName}]`;
  }

  /**
   * Tam stored procedure adını döndürür (schema + sp)
   */
  getSpName(spName: string): string {
    return `[${this.spSchema}].[${spName}]`;
  }

  /**
   * Yaygın tablo isimlerini döndürür
   */
  getTables() {
    return {
      musteri: this.getTableName('tblMusteri'),
      cari: this.getTableName('tblCari'),
      odaYatak: this.getTableName('tblOdaYatak'),
      odaTipLfyt: this.getTableName('tblOdaTipLfyt'),
      konaklama: this.getTableName('tblKonaklama'),
      islem: this.getTableName('tblislem'),
      parametreler: this.getTableName('tblParametreler'),
      personel: this.getTableName('tblPersonel'),
    };
  }

  /**
   * Yaygın view isimlerini döndürür (views de table schema'sını kullanır)
   */
  getViews() {
    return {
      musteriKonaklama: this.getTableName('v_MusteriKonaklama'),
    };
  }

  /**
   * Yaygın stored procedure isimlerini döndürür
   */
  getStoredProcedures() {
    return {
      musteriEkle: this.getSpName('spr_MusteriEkle'),
      cariEkle: this.getSpName('spr_CariEkle'),
      konaklamaEkle: this.getSpName('spr_KonaklamaEkle'),
      islemEkle: this.getSpName('spr_islemEkleYn'),
      fonDokumY: this.getSpName('sp_FonDokumY'),
      fonDevirY: this.getSpName('sp_FonDevirY'),
    };
  }
}
