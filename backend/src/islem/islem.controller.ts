import { Controller, Post, Body, HttpException, HttpStatus, Get } from '@nestjs/common'
import { IslemService } from './islem.service'

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

@Controller('islem')
export class IslemController {
  constructor(private readonly islemService: IslemService) {}

  @Post('kaydet')
  async kaydetIslem(@Body() body: { kayitlar: IslemKayit[] }) {
    try {
      console.log('Gelen kayıtlar:', body.kayitlar)
      
      if (!body.kayitlar || body.kayitlar.length === 0) {
        throw new HttpException('Kayıt listesi boş olamaz', HttpStatus.BAD_REQUEST)
      }

      const sonuc = await this.islemService.kaydetIslemler(body.kayitlar)
      
      return {
        success: true,
        message: `${body.kayitlar.length} kayıt başarıyla kaydedildi`,
        kayitSayisi: body.kayitlar.length,
        sonuc
      }
    } catch (error) {
      console.error('İşlem kaydetme hatası:', error)
      throw new HttpException(
        error.message || 'İşlem kaydedilirken hata oluştu',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('health')
  async health() {
    return { status: 'OK', message: 'İşlem servisi çalışıyor' }
  }
} 