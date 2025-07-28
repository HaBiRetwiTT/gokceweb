import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({
  name: 'tblPersonel',
  schema: process.env.NODE_ENV === 'production' ? 'harunta' : 'dbo',
})
export class Personel {
  @PrimaryGeneratedColumn({ name: 'PrsnNo' })
  PrsnNo: number;

  @Column({ name: 'PrsnUsrNm', type: 'nvarchar', length: 50 })
  PrsnUsrNm: string;

  @Column({ name: 'PrsnPassw', type: 'nvarchar', length: 50 })
  PrsnPassw: string;

  @Column({ name: 'PrsnAdi', type: 'nvarchar', length: 50, nullable: true })
  PrsnAdi?: string;

  @Column({ name: 'PrsnDurum', type: 'nvarchar', length: 10, nullable: true })
  PrsnDurum?: string;
}
