/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tblIPKisitlama', { schema: 'dbo' })
export class IPKisitlama {
  @PrimaryGeneratedColumn({ name: 'IpKstNo', type: 'bigint' })
  IpKstNo: number;

  @Column({ name: 'IpKstAdres', type: 'nvarchar', length: 15 })
  IpKstAdres: string;

  @Column({ name: 'IpKstAktif', type: 'bit', default: true })
  IpKstAktif: boolean;

  @Column({ name: 'IpKstKytTarihi', type: 'nchar', length: 10 })
  IpKstKytTarihi: string;

  @Column({ name: 'IpKstKllnc', type: 'nvarchar', length: 10 })
  IpKstKllnc: string;

  @Column({ name: 'IpKstAciklama', type: 'nvarchar', length: 100, nullable: true })
  IpKstAciklama?: string;
}

