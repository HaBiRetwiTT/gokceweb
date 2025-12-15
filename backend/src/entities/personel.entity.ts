/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tblPersonel', { schema: 'dbo' })
export class Personel {
  @PrimaryGeneratedColumn({ name: 'PrsnNo', type: 'bigint' })
  PrsnNo: number;

  @Column({ name: 'pKytTarihi', type: 'nchar', length: 10 })
  pKytTarihi: string;

  @Column({ name: 'PrsnKllnc', type: 'nvarchar', length: 10 })
  PrsnKllnc: string;

  @Column({ name: 'PrsnTCN', type: 'nvarchar', length: 17 })
  PrsnTCN: string;

  @Column({ name: 'PrsnAdi', type: 'nvarchar', length: 50 })
  PrsnAdi: string;

  @Column({ name: 'PrsnDurum', type: 'nvarchar', length: 50, nullable: true })
  PrsnDurum?: string;

  @Column({ name: 'PrsnTelNo', type: 'nvarchar', length: 15, nullable: true })
  PrsnTelNo?: string;



  @Column({ name: 'PrsnUsrNm', type: 'nvarchar', length: 50, nullable: true })
  PrsnUsrNm?: string;

  @Column({ name: 'PrsnPassw', type: 'nvarchar', length: 50, nullable: true })
  PrsnPassw?: string;

  @Column({ name: 'PrsnDuzey', type: 'nvarchar', length: 20, nullable: true })
  PrsnDuzey?: string;

  @Column({ name: 'PrsnOda', type: 'nvarchar', length: 10, nullable: true })
  PrsnOda?: string;

  @Column({ name: 'PrsnYtk', type: 'nvarchar', length: 10, nullable: true })
  PrsnYtk?: string;

  @Column({ name: 'PrsnDgmTarihi', type: 'nchar', length: 10, nullable: true })
  PrsnDgmTarihi?: string;
}
