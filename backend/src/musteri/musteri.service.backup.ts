/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Musteri } from '../entities/musteri.entity';
import { CreateMusteriDto } from '../dto/create-musteri.dto';
import { DatabaseConfigService } from '../database/database-config.service';

@Injectable()
export class MusteriService {
  constructor(
    @InjectRepository(Musteri)
    private musteriRepository: Repository<Musteri>,
    private dbConfig: DatabaseConfigService,
  ) {}

  async create(createMusteriDto: CreateMusteriDto) {
    console.log('=== Musteri Create Operation Started ===');
    console.log('Input data:', createMusteriDto);
    
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
}