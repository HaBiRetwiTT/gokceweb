import { Controller, Get, Put, Body } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('oda-tip-lifyat')
  async getOdaTipLifyat() {
    try {
      const data = await this.adminService.getOdaTipLifyat();
      return {
        success: true,
        data,
        message: 'Oda tip lifyat verileri başarıyla getirildi'
      };
    } catch (error) {
      console.error('Oda tip lifyat getirme hatası:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      };
    }
  }

  @Put('oda-tip-lifyat-guncelle')
  async updateOdaTipLifyat(@Body() body: { kayitlar: any[] }) {
    try {
      const result = await this.adminService.updateOdaTipLifyat(body.kayitlar);
      return {
        success: true,
        data: result,
        message: `${result.length} kayıt başarıyla güncellendi`
      };
    } catch (error) {
      console.error('Oda tip lifyat güncelleme hatası:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      };
    }
  }
}
