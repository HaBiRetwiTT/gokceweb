/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tblSistemAyar', { schema: 'dbo' })
export class SistemAyar {
  @PrimaryGeneratedColumn({ name: 'SysAyrNo', type: 'bigint' })
  SysAyrNo: number;

  @Column({ name: 'SysAyrAnahtar', type: 'nvarchar', length: 50, unique: true })
  SysAyrAnahtar: string;

  @Column({ name: 'SysAyrDeger', type: 'nvarchar', length: 255 })
  SysAyrDeger: string;

  @Column({ name: 'SysAyrAciklama', type: 'nvarchar', length: 255, nullable: true })
  SysAyrAciklama?: string;

  @Column({ name: 'SysAyrGncTarihi', type: 'nchar', length: 10 })
  SysAyrGncTarihi: string;

  @Column({ name: 'SysAyrKllnc', type: 'nvarchar', length: 10 })
  SysAyrKllnc: string;
}

