import { Controller, Post, Body, Get } from '@nestjs/common';
import { OdemeIslemService } from './odeme-islem.service';
import { CreateOdemeIslemDto } from './dto/create-odeme-islem.dto';

@Controller('odeme-islem')
export class OdemeIslemController {
  constructor(private readonly odemeIslemService: OdemeIslemService) {}

  @Post()
  async create(@Body() dto: CreateOdemeIslemDto) {
    return this.odemeIslemService.kaydetIslemler(dto);
  }

  @Get('max-islemno')
  async getMaxIslemno() {
    return this.odemeIslemService.getMaxIslemno();
  }
}
