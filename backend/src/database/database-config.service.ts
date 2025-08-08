import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseConfigService {
  private readonly tableSchema: string;
  private readonly spSchema: string;

  constructor() {
    // Environment değişkenlerinden schema isimlerini al
    // Production: Tables/Views = harunta, SP = dbo
    // Development: Tables/Views = dbo, SP = dbo
    this.tableSchema =
      process.env.DB_TABLE_SCHEMA ||
      (process.env.NODE_ENV === 'production' ? 'harunta' : 'dbo');
    this.spSchema = process.env.DB_SP_SCHEMA || 'dbo';
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(
        `Database Schema Configuration: Tables=${this.tableSchema}, StoredProcedures=${this.spSchema}`,
      );
    }
  }

  /**
   * Database connection configuration'ını döndürür
   */
  getDatabaseConfig() {
    return {
      type: 'mssql' as const,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '1433'),
      username: process.env.DB_USERNAME || 'harunta',
      password: process.env.DB_PASSWORD || '14531453',
      database: process.env.DB_DATABASE || 'gokcepansiyon2010',
      synchronize: false, // Production'da asla true yapma!
      logging: process.env.NODE_ENV === 'development',
      autoLoadEntities: true,
      options: {
        // VB.NET bağlantı string'ine uygun ayarlar
        encrypt: false, // Production'da false, SSL sertifika sorunu olabilir
        trustServerCertificate: true, // Sertifika güvenlik sorununu çözer
        enableArithAbort: true,
        instanceName: process.env.DB_INSTANCE_NAME || undefined,
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
   * Tablo schema'sını döndürür
   */
  getTableSchema(): string {
    return this.tableSchema;
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
    return tableName; // Sadece tablo adını döndür, schema ayrı olarak kullanılacak
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
    };
  }
}
