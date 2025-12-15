/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tblislem', { schema: 'dbo' })
export class Islem {
  @PrimaryGeneratedColumn({ name: 'islemNo', type: 'bigint' })
  islemNo: number;

  @Column({ name: 'iKytTarihi', type: 'nchar', length: 10 })
  iKytTarihi: string;

  @Column({ name: 'islemKllnc', type: 'nvarchar', length: 10 })
  islemKllnc: string;

  @Column({ name: 'islemArac', type: 'nvarchar', length: 10, nullable: true })
  islemArac?: string;

  @Column({ name: 'islemTip', type: 'nvarchar', length: 10, nullable: true })
  islemTip?: string;

  @Column({ name: 'islemGrup', type: 'nvarchar', length: 10, nullable: true })
  islemGrup?: string;

  @Column({ name: 'islemAltG', type: 'nvarchar', length: 10, nullable: true })
  islemAltG?: string;

  @Column({ name: 'islemBilgi', type: 'nvarchar', length: 'MAX', nullable: true })
  islemBilgi?: string;

  @Column({ name: 'islemMiktar', type: 'decimal', precision: 18, scale: 2, nullable: true })
  islemMiktar?: number;

  @Column({ name: 'islemTutar', type: 'decimal', precision: 18, scale: 2, nullable: true })
  islemTutar?: number;

  @Column({ name: 'islemCrKod', type: 'nvarchar', length: 10, nullable: true })
  islemCrKod?: string;

  @Column({ name: 'islemCrTip', type: 'nvarchar', length: 10, nullable: true })
  islemCrTip?: string;

  @Column({ name: 'islemCrAdi', type: 'nvarchar', length: 50, nullable: true })
  islemCrAdi?: string;

  @Column({ name: 'islemCrVD', type: 'nvarchar', length: 25, nullable: true })
  islemCrVD?: string;

  @Column({ name: 'islemCrVTCN', type: 'nvarchar', length: 20, nullable: true })
  islemCrVTCN?: string;

  @Column({ name: 'islemCrYetkili', type: 'nvarchar', length: 20, nullable: true })
  islemCrYetkili?: string;

  @Column({ name: 'islemCrTelNo', type: 'nvarchar', length: 15, nullable: true })
  islemCrTelNo?: string;

  @Column({ name: 'islemCrEposta', type: 'nvarchar', length: 30, nullable: true })
  islemCrEposta?: string;

  @Column({ name: 'islemCrAdres', type: 'nvarchar', length: 200, nullable: true })
  islemCrAdres?: string;

  @Column({ name: 'islemDurum', type: 'nvarchar', length: 10, nullable: true })
  islemDurum?: string;

  @Column({ name: 'islemNot', type: 'nvarchar', length: 'MAX', nullable: true })
  islemNot?: string;
}
