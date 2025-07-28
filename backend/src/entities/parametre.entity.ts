import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({
  name: 'tblParametreler',
  schema: process.env.NODE_ENV === 'production' ? 'harunta' : 'dbo',
})
export class Parametre {
  @PrimaryGeneratedColumn('increment', { name: 'PrmNo' })
  PrmNo: number;

  @Column({ name: 'Prm01', type: 'nvarchar', length: 60 })
  Prm01: string;

  @Column({ name: 'PrmAdi', type: 'nvarchar', length: 50 })
  PrmAdi: string;

  @Column({
    name: 'Prm04',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  Prm04: number;
}
