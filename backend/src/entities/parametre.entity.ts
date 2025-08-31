/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tblParametreler', { schema: 'harunta' })
export class Parametre {
  @PrimaryGeneratedColumn({ name: 'PrmNo', type: 'bigint' })
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
  Prm04?: number;
}
