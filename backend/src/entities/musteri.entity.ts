/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// Schema production'da harunta, development'ta dbo olacak
@Entity('tblMusteri')
export class Musteri {
  @PrimaryGeneratedColumn({ name: 'MstrNo', type: 'bigint' })
  MstrNo: number;

  @Column({ name: 'MstrKllnc', type: 'nvarchar', length: 10 })
  MstrKllnc: string;

  @Column({ name: 'MstrHspTip', type: 'nvarchar', length: 10 })
  MstrHspTip: string;

  @Column({ name: 'MstrTCN', type: 'nvarchar', length: 17 })
  MstrTCN: string;

  @Column({ name: 'MstrAdi', type: 'nvarchar', length: 50 })
  MstrAdi: string;

  @Column({ name: 'MstrDgmTarihi', type: 'nchar', length: 10, nullable: true })
  MstrDgmTarihi?: string;

  @Column({ name: 'MstrTelNo', type: 'nvarchar', length: 15, nullable: true })
  MstrTelNo?: string;

  @Column({ name: 'MstrTel2', type: 'nvarchar', length: 15, nullable: true })
  MstrTel2?: string;

  @Column({ name: 'MstrEposta', type: 'nvarchar', length: 30, nullable: true })
  MstrEposta?: string;

  @Column({ name: 'MstrMeslek', type: 'nvarchar', length: 20, nullable: true })
  MstrMeslek?: string;

  @Column({ name: 'MstrYakini', type: 'nvarchar', length: 20, nullable: true })
  MstrYakini?: string;

  @Column({ name: 'MstrYknTel', type: 'nvarchar', length: 15, nullable: true })
  MstrYknTel?: string;

  @Column({ name: 'MstrDurum', type: 'nvarchar', length: 10, nullable: true })
  MstrDurum?: string;

  @Column({ name: 'MstrFirma', type: 'nvarchar', length: 50, nullable: true })
  MstrFirma?: string;

  @Column({ name: 'MstrVD', type: 'nvarchar', length: 25, nullable: true })
  MstrVD?: string;

  @Column({ name: 'MstrVno', type: 'nvarchar', length: 11, nullable: true })
  MstrVno?: string;

  @Column({ name: 'MstrFrmTel', type: 'nvarchar', length: 15, nullable: true })
  MstrFrmTel?: string;

  @Column({ name: 'MstrFrmMdr', type: 'nvarchar', length: 20, nullable: true })
  MstrFrmMdr?: string;

  @Column({ name: 'MstrMdrTel', type: 'nvarchar', length: 15, nullable: true })
  MstrMdrTel?: string;

  @Column({ name: 'MstrAdres', type: 'nvarchar', length: 200, nullable: true })
  MstrAdres?: string;

  @Column({ name: 'MstrResim', type: 'varbinary', nullable: true })
  MstrResim?: Buffer;

  @Column({ name: 'MstrNot', type: 'nvarchar', length: 'MAX', nullable: true })
  MstrNot?: string;  
}