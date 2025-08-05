import { Injectable } from '@nestjs/common'
import { DatabaseConfigService } from '../database/database-config.service'
import { DatabaseTransactionService } from '../database/database-transaction.service'

interface IslemKayit {
  iKytTarihi: string
  islemKllnc: string
  islemOzel1: string
  islemOzel2: string
  islemOzel3: string
  islemOzel4: string
  islemBirim: string
  islemDoviz: string
  islemKur: number
  islemBilgi: string
  islemCrKod: string
  islemArac: string
  islemTip: string
  islemGrup: string
  islemAltG: string
  islemMiktar: number
  islemTutar: number
}

@Injectable()
export class IslemService {
  constructor(
    private readonly databaseConfigService: DatabaseConfigService,
    private readonly databaseTransactionService: DatabaseTransactionService
  ) {}

  async kaydetIslemler(kayitlar: IslemKayit[]) {
    return await this.databaseTransactionService.executeInTransaction(async (queryRunner) => {
      const sonuclar: any[] = []
      
      for (const kayit of kayitlar) {
        const sonuc = await this.islemEkleStoredProcedure(queryRunner, kayit)
        sonuclar.push(sonuc)
      }
      
      console.log(`${kayitlar.length} kayıt başarıyla kaydedildi`)
      return sonuclar
    })
  }

  private async islemEkleStoredProcedure(queryRunner: any, kayit: IslemKayit) {
    const spName = this.databaseConfigService.getStoredProcedures().islemEkle
    
    // Stored procedure parametrelerini doğru sırada hazırla
    // [iKytTarihi], [islemKllnc], [islemCrKod], [islemOzel1], [islemOzel2], [islemOzel3], [islemOzel4], [islemArac], [islemTip], [islemGrup], [islemAltG], [islemBilgi], [islemMiktar], [islemBirim], [islemTutar], [islemDoviz], [islemKur]
    const params = [
      kayit.iKytTarihi,        // @iKytTarihi - nchar(10)
      kayit.islemKllnc,        // @islemKllnc - nvarchar(50)
      kayit.islemCrKod,        // @islemCrKod - nvarchar(20)
      kayit.islemOzel1,        // @islemOzel1 - nvarchar(50)
      kayit.islemOzel2,        // @islemOzel2 - nvarchar(50)
      kayit.islemOzel3,        // @islemOzel3 - nvarchar(50)
      kayit.islemOzel4,        // @islemOzel4 - nvarchar(50)
      kayit.islemArac,         // @islemArac - nvarchar(50)
      kayit.islemTip,          // @islemTip - nvarchar(20)
      kayit.islemGrup,         // @islemGrup - nvarchar(50)
      kayit.islemAltG,         // @islemAltG - nvarchar(100)
      kayit.islemBilgi,        // @islemBilgi - nvarchar(500)
      kayit.islemMiktar,       // @islemMiktar - decimal(18,2) - number olarak gönder
      kayit.islemBirim,        // @islemBirim - nvarchar(20)
      kayit.islemTutar,        // @islemTutar - decimal(18,2) - number olarak gönder
      kayit.islemDoviz,        // @islemDoviz - nvarchar(10)
      kayit.islemKur           // @islemKur - decimal(18,2) - number olarak gönder
    ]

    console.log('Stored procedure çağrısı:', {
      spName,
      params,
      kayit
    })

    return await this.databaseTransactionService.executeStoredProcedure(queryRunner, spName, params)
  }
} 