import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { AgentService, AgentResponse } from './agent.service';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  /**
   * Müşteri analizi endpoint'i
   */
  @Post('analyze-customer')
  async analyzeCustomer(@Body() customerData: any): Promise<AgentResponse> {
    return await this.agentService.analyzeCustomer(customerData);
  }

  /**
   * Fiyat optimizasyonu endpoint'i
   */
  @Post('optimize-pricing')
  async optimizePricing(
    @Body() data: { roomData: any; marketData: any },
  ): Promise<AgentResponse> {
    return await this.agentService.optimizePricing(
      data.roomData,
      data.marketData,
    );
  }

  /**
   * Oda yönetimi endpoint'i
   */
  @Post('manage-rooms')
  async manageRooms(@Body() roomStatus: any): Promise<AgentResponse> {
    return await this.agentService.manageRooms(roomStatus);
  }

  /**
   * Finansal rapor analizi endpoint'i
   */
  @Post('analyze-financial')
  async analyzeFinancial(@Body() financialData: any): Promise<AgentResponse> {
    return await this.agentService.analyzeFinancialReport(financialData);
  }

  /**
   * Asenkron görev oluşturma endpoint'i
   */
  @Post('create-task')
  async createTask(
    @Body() data: { type: string; parameters: any },
  ): Promise<{ taskId: string }> {
    const taskId = await this.agentService.createTask(
      data.type as any,
      data.parameters,
    );
    return { taskId };
  }

  /**
   * Görev durumu kontrol endpoint'i
   */
  @Get('task/:taskId')
  async getTaskStatus(@Param('taskId') taskId: string) {
    return this.agentService.getTaskStatus(taskId);
  }

  /**
   * Tüm görevleri listeleme endpoint'i
   */
  @Get('tasks')
  async getAllTasks() {
    return this.agentService.getAllTasks();
  }

  /**
   * Genel AI önerileri endpoint'i
   */
  @Get('recommendations')
  async getRecommendations(@Query('type') type: string) {
    const recommendations = {
      customer: [
        'Müşteri sadakat programı başlatın',
        'Kişiselleştirilmiş hizmetler sunun',
        'Online rezervasyon kolaylığı sağlayın',
      ],
      pricing: [
        'Sezonsal fiyatlandırma uygulayın',
        'Erken rezervasyon indirimleri sunun',
        'Paket fiyatlandırma seçenekleri ekleyin',
      ],
      operations: [
        'Oda temizlik süreçlerini optimize edin',
        'Bakım planlamasını otomatikleştirin',
        'Kapasite kullanımını artırın',
      ],
      financial: [
        'Gelir analizi yapın',
        'Maliyet optimizasyonu uygulayın',
        'Yatırım planlaması geliştirin',
      ],
    };

    return {
      success: true,
      data: recommendations[type] || recommendations,
      suggestions: [
        'AI önerilerini düzenli olarak kontrol edin',
        'Önerileri iş süreçlerinize entegre edin',
        'Sonuçları takip ederek sürekli iyileştirme yapın',
      ],
    };
  }

  /**
   * Sistem durumu kontrol endpoint'i
   */
  @Get('health')
  async getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      features: [
        'Müşteri Analizi',
        'Fiyat Optimizasyonu',
        'Oda Yönetimi',
        'Finansal Analiz',
        'Asenkron Görev Yönetimi',
      ],
    };
  }
}
