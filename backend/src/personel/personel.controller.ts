import { Controller, Get, Put, Post, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PersonelService } from './personel.service';

@Controller('personel')
export class PersonelController {
  constructor(private readonly personelService: PersonelService) {}

  @Get('calisanlar')
  async getCalisanPersonel(
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ) {
    return this.personelService.getCalisanPersonel(sortBy, sortOrder);
  }

    @Put('guncelle')
    async guncellePersonel(@Body() personelData: any) {
    try {
      return await this.personelService.guncellePersonel(personelData);
    } catch (error) {
      // Service'den gelen hata mesajını yakala ve HTTP exception olarak fırlat
      if (error instanceof Error) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            statusCode: HttpStatus.BAD_REQUEST
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // Genel hata durumu
      throw new HttpException(
        {
          success: false,
          message: 'Personel güncellenirken beklenmeyen bir hata oluştu',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('ekle')
  async eklePersonel(@Body() personelData: any) {
    try {
      return await this.personelService.eklePersonel(personelData);
    } catch (error) {
      // Service'den gelen hata mesajını yakala ve HTTP exception olarak fırlat
      if (error instanceof Error) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            statusCode: HttpStatus.BAD_REQUEST
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // Genel hata durumu
      throw new HttpException(
        {
          success: false,
          message: 'Personel eklenirken beklenmeyen bir hata oluştu',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
