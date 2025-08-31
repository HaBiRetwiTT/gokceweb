import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parametre } from './entities/parametre.entity';

@Injectable()
export class ParametreAlternativeService {
  constructor(
    @InjectRepository(Parametre)
    private readonly parametreRepository: Repository<Parametre>,
  ) {}

  // TypeORM entity kullanarak - schema otomatik olarak doğru belirlenir
  async getEkHizmetlerWithEntity(): Promise<Parametre[]> {
    console.log('🔥 ENTITY METHOD - Using TypeORM entity with auto-schema');

    try {
      const result = await this.parametreRepository.find({
        select: ['Prm01', 'PrmAdi', 'Prm04'],
        where: {
          Prm01: ['1', '2', '3', '4', '5', '6'] as any, // IN operation için
        },
        order: {
          Prm01: 'ASC',
        },
      });

      console.log('🔥 ENTITY METHOD - Result:', result);
      return result;
    } catch (error) {
      console.error('🔥 ENTITY METHOD - ERROR:', error);

      // Fallback: QB kullanarak
      const fallbackResult = await this.parametreRepository
        .createQueryBuilder('p')
        .select(['p.Prm01', 'p.PrmAdi', 'p.Prm04'])
        .where('p.Prm01 IN (:...values)', {
          values: ['1', '2', '3', '4', '5', '6'],
        })
        .orderBy('p.Prm01', 'ASC')
        .getMany();
      
      return fallbackResult;
    }
  }

  async getKomisyonOraniWithEntity(): Promise<number | null> {
    console.log('🔥 ENTITY KOMISYON - Using TypeORM entity with auto-schema');

    try {
      const result = await this.parametreRepository.findOne({
        select: ['Prm04'],
        where: { Prm01: '8' },
      });

      console.log('🔥 ENTITY KOMISYON - Result:', result);
      return result?.Prm04 ?? null;
    } catch (error) {
      console.error('🔥 ENTITY KOMISYON - ERROR:', error);
      throw error;
    }
  }
}
