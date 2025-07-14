/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CikisYapDto {
  @IsString()
  @IsNotEmpty()
  tcNo: string;

  @IsString()
  @IsNotEmpty()
  plnTrh: string;

  @IsNotEmpty()
  odaYatak: any; // Allow string or object

  // 🔥 KARA LİSTE ALANLARI
  @IsOptional()
  @IsString()
  knklmKrLst?: string; // 'EVET' değeri gelecek

  @IsOptional()
  @IsString()
  knklmNot?: string; // Kara liste açıklama
} 