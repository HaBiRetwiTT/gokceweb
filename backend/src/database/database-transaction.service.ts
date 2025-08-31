/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class DatabaseTransactionService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource
  ) {}

  private debugLog(...args: unknown[]): void {
    // Production'da logging kapalı
    console.log(...args);
  }

  /**
   * Birden fazla veritabanı operasyonunu tek transaction içinde güvenli çalıştır
   * Herhangi bir hata durumunda tüm işlemler geri alınır (rollback)
   */
  async executeInTransaction<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      // Bağlantı kur ve transaction başlat
      await queryRunner.connect();
      await queryRunner.startTransaction();
      
      this.debugLog('🔒 Transaction başlatıldı');
      
      // İşlemleri çalıştır
      const result = await operation(queryRunner);
      
      // Tüm işlemler başarılıysa commit et
      await queryRunner.commitTransaction();
      this.debugLog('✅ Transaction commit edildi - Tüm işlemler kalıcı hale getirildi');
      
      return result;
      
    } catch (error) {
      // Hata durumunda rollback yap
      try {
        await queryRunner.rollbackTransaction();
        this.debugLog('🔄 Transaction rollback edildi - Tüm değişiklikler geri alındı');
      } catch (rollbackError) {
        console.error('❌ Rollback işlemi başarısız:', rollbackError);
      }
      
      console.error('❌ Transaction hatası:', error);
      throw error;
      
    } finally {
      // Bağlantıyı her durumda temizle
      try {
        await queryRunner.release();
        console.log('🔌 Database bağlantısı temizlendi');
      } catch (releaseError) {
         console.error('⚠️ Bağlantı temizleme hatası:', releaseError);
      }
    }
  }

  /**
   * Tek bir query'yi güvenli çalıştır (transaction içinde)
   */
  async executeQuery(
    queryRunner: QueryRunner,
    query: string,
    parameters?: any[]
  ): Promise<any> {
    try {
      this.debugLog('📝 Query çalıştırılıyor:', query.substring(0, 100) + '...');
      this.debugLog('📊 Parametreler:', parameters);
      
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await queryRunner.query(query, parameters);
      
      this.debugLog('✅ Query başarılı');
       
      return result;
      
    } catch (error) {
      console.error('❌ Query hatası:', {
        query: query.substring(0, 200),
        parameters,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Stored procedure'ü güvenli çalıştır (transaction içinde)
   */
  async executeStoredProcedure(
    queryRunner: QueryRunner,
    spName: string,
    parameters: any[]
  ): Promise<any> {
    try {
      // Parametreleri @0, @1, @2... formatında hazırla
      const paramPlaceholders = parameters.map((_, index) => `@${index}`).join(', ');
      const query = `EXEC ${spName} ${paramPlaceholders}`;
      
      this.debugLog('🔧 Stored Procedure çalıştırılıyor:', spName);
      this.debugLog('📊 Parametreler:', parameters);
      
      // Stored procedure için özel timeout ayarı (60 saniye)
      const timeoutQuery = `SET LOCK_TIMEOUT 60000; ${query}`;
      
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await queryRunner.query(timeoutQuery, parameters);
      
      this.debugLog('✅ Stored Procedure başarılı');
       
      return result;
      
    } catch (error) {
      console.error('❌ Stored Procedure hatası:', {
        spName,
        parameters,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }
} 