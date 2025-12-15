import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tblMusteri', { schema: 'dbo' })
export class Firewall {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  mstrTCN: string;

  @Column()
  MstrDurum: string;
}
