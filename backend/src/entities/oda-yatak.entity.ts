/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tblOdaYatak', { schema: 'harunta' })
export class OdaYatak {
  @PrimaryGeneratedColumn({ name: 'OdYatNo', type: 'bigint' })
  OdYatNo: number;

  @Column({ name: 'oKytTarihi', type: 'nchar', length: 10 })
  oKytTarihi: string;

  @Column({ name: 'OdYatKllnc', type: 'nvarchar', length: 50 })
  OdYatKllnc: string;

  @Column({ name: 'OdYatKod', type: 'nchar', length: 12 })
  OdYatKod: string;

  @Column({ name: 'OdYatSube', type: 'nvarchar', length: 50, nullable: true })
  OdYatSube?: string;

  @Column({ name: 'OdYatBlok', type: 'nvarchar', length: 50, nullable: true })
  OdYatBlok?: string;

  @Column({ name: 'OdYatKat', type: 'nvarchar', length: 50, nullable: true })
  OdYatKat?: string;

  @Column({ name: 'OdYatOdaNo', type: 'nvarchar', length: 50 })
  OdYatOdaNo: string;

  @Column({ name: 'OdYatYtkNo', type: 'nvarchar', length: 50 })
  OdYatYtkNo: string;

  @Column({ name: 'OdYatOdaTip', type: 'nvarchar', length: 50 })
  OdYatOdaTip: string;

  @Column({ name: 'OdYatDurum', type: 'nvarchar', length: 50 })
  OdYatDurum: string;
}

@Entity('tblOdaTipLfyt', { schema: 'harunta' })
export class OdaTipLfyt {
  @PrimaryGeneratedColumn({ name: 'OdTipNo', type: 'bigint' })
  OdTipNo: number;

  @Column({ name: 'OdTipAdi', type: 'nvarchar', length: 50 })
  OdTipAdi: string;

  @Column({ name: 'OdLfytGun', type: 'int', nullable: true })
  OdLfytGun?: number;

  @Column({ name: 'OdLfytHft', type: 'int', nullable: true })
  OdLfytHft?: number;

  @Column({ name: 'OdLfytAyl', type: 'int', nullable: true })
  OdLfytAyl?: number;

  @Column({ name: 'OdDpst', type: 'int', nullable: true })
  OdDpst?: number;
} 