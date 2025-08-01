import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tblMusteri')
export class Firewall {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  mstrTCN: string;

  @Column()
  MstrDurum: string;
}
