import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({
  name: 'tblCari',
  schema: process.env.NODE_ENV === 'production' ? 'harunta' : 'dbo',
})
export class Cari {
  @PrimaryGeneratedColumn('increment', { name: 'CariNo' })
  CariNo: number;

  @Column({ name: 'cKytTarihi', type: 'nchar', length: 10 })
  cKytTarihi: string;

  @Column({ name: 'CariKllnc', type: 'nvarchar', length: 10 })
  CariKllnc: string;

  @Column({ name: 'CariKod', type: 'nvarchar', length: 10 })
  CariKod: string;

  @Column({ name: 'CariTip', type: 'nvarchar', length: 10 })
  CariTip: string;

  @Column({ name: 'CariAdi', type: 'nvarchar', length: 50 })
  CariAdi: string;

  @Column({ name: 'CariVD', type: 'nvarchar', length: 25, nullable: true })
  CariVD: string;

  @Column({ name: 'CariVTCN', type: 'nvarchar', length: 20, nullable: true })
  CariVTCN: string;

  @Column({ name: 'CariYetkili', type: 'nvarchar', length: 20, nullable: true })
  CariYetkili: string;

  @Column({ name: 'CariTelNo', type: 'nvarchar', length: 15, nullable: true })
  CariTelNo: string;

  @Column({ name: 'CariEposta', type: 'nvarchar', length: 30, nullable: true })
  CariEposta: string;

  @Column({ name: 'CariAdres', type: 'nvarchar', length: 200, nullable: true })
  CariAdres: string;
}
