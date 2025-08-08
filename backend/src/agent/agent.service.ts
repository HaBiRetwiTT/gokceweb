import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface AgentTask {
  id: string;
  type:
    | 'customer_analysis'
    | 'pricing_optimization'
    | 'room_management'
    | 'financial_report';
  parameters: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  createdAt: Date;
  completedAt?: Date;
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  suggestions?: string[];
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private tasks: Map<string, AgentTask> = new Map();

  constructor(private readonly httpService: HttpService) {}

  /**
   * Müşteri analizi yapar ve öneriler sunar
   */
  async analyzeCustomer(customerData: any): Promise<AgentResponse> {
    try {
      this.logger.log('Müşteri analizi başlatılıyor...');

      // Müşteri verilerini analiz et
      const analysis = await this.performCustomerAnalysis(customerData);

      return {
        success: true,
        data: analysis,
        suggestions: [
          'Müşteri tercihlerine göre oda önerisi',
          'Fiyat optimizasyonu önerileri',
          'Konaklama süresi tahminleri',
        ],
      };
    } catch (error) {
      this.logger.error('Müşteri analizi hatası:', error);
      return {
        success: false,
        error: 'Müşteri analizi sırasında hata oluştu',
      };
    }
  }

  /**
   * Fiyat optimizasyonu önerileri sunar
   */
  async optimizePricing(
    roomData: any,
    marketData: any,
  ): Promise<AgentResponse> {
    try {
      this.logger.log('Fiyat optimizasyonu başlatılıyor...');

      const optimization = await this.performPricingOptimization(
        roomData,
        marketData,
      );

      return {
        success: true,
        data: optimization,
        suggestions: [
          'Rekabetçi fiyatlandırma önerileri',
          'Sezonsal fiyat ayarlamaları',
          'Özel kampanya önerileri',
        ],
      };
    } catch (error) {
      this.logger.error('Fiyat optimizasyonu hatası:', error);
      return {
        success: false,
        error: 'Fiyat optimizasyonu sırasında hata oluştu',
      };
    }
  }

  /**
   * Oda yönetimi önerileri sunar
   */
  async manageRooms(roomStatus: any): Promise<AgentResponse> {
    try {
      this.logger.log('Oda yönetimi analizi başlatılıyor...');

      const management = await this.performRoomManagement(roomStatus);

      return {
        success: true,
        data: management,
        suggestions: [
          'Oda temizlik planlaması',
          'Bakım öncelikleri',
          'Kapasite optimizasyonu',
        ],
      };
    } catch (error) {
      this.logger.error('Oda yönetimi hatası:', error);
      return {
        success: false,
        error: 'Oda yönetimi analizi sırasında hata oluştu',
      };
    }
  }

  /**
   * Finansal rapor analizi yapar
   */
  async analyzeFinancialReport(financialData: any): Promise<AgentResponse> {
    try {
      this.logger.log('Finansal rapor analizi başlatılıyor...');

      const analysis = await this.performFinancialAnalysis(financialData);

      return {
        success: true,
        data: analysis,
        suggestions: [
          'Gelir artırma önerileri',
          'Maliyet optimizasyonu',
          'Yatırım önerileri',
        ],
      };
    } catch (error) {
      this.logger.error('Finansal analiz hatası:', error);
      return {
        success: false,
        error: 'Finansal analiz sırasında hata oluştu',
      };
    }
  }

  /**
   * Asenkron görev oluşturur
   */
  async createTask(type: AgentTask['type'], parameters: any): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const task: AgentTask = {
      id: taskId,
      type,
      parameters,
      status: 'pending',
      createdAt: new Date(),
    };

    this.tasks.set(taskId, task);

    // Görevi arka planda işle
    this.processTask(taskId);

    return taskId;
  }

  /**
   * Görev durumunu kontrol eder
   */
  getTaskStatus(taskId: string): AgentTask | null {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Tüm görevleri listeler
   */
  getAllTasks(): AgentTask[] {
    return Array.from(this.tasks.values());
  }

  private async processTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      task.status = 'processing';
      this.tasks.set(taskId, task);

      let result;
      switch (task.type) {
        case 'customer_analysis':
          result = await this.analyzeCustomer(task.parameters);
          break;
        case 'pricing_optimization':
          result = await this.optimizePricing(
            task.parameters.roomData,
            task.parameters.marketData,
          );
          break;
        case 'room_management':
          result = await this.manageRooms(task.parameters);
          break;
        case 'financial_report':
          result = await this.analyzeFinancialReport(task.parameters);
          break;
        default:
          throw new Error('Bilinmeyen görev tipi');
      }

      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date();
    } catch (error) {
      task.status = 'failed';
      task.result = { error: error.message };
      task.completedAt = new Date();
    }

    this.tasks.set(taskId, task);
  }

  private async performCustomerAnalysis(customerData: any): Promise<any> {
    // Müşteri analizi algoritması
    const analysis = {
      customerType: customerData.type === 'Bireysel' ? 'Bireysel' : 'Kurumsal',
      preferences: this.analyzePreferences(customerData),
      riskScore: this.calculateRiskScore(customerData),
      recommendations: this.generateCustomerRecommendations(customerData),
    };

    return analysis;
  }

  private async performPricingOptimization(
    roomData: any,
    marketData: any,
  ): Promise<any> {
    // Fiyat optimizasyonu algoritması
    const optimization = {
      currentPrice: roomData.price,
      suggestedPrice: this.calculateOptimalPrice(roomData, marketData),
      marketAnalysis: this.analyzeMarketConditions(marketData),
      seasonalAdjustments: this.calculateSeasonalAdjustments(),
    };

    return optimization;
  }

  private async performRoomManagement(roomStatus: any): Promise<any> {
    // Oda yönetimi algoritması
    const management = {
      occupancyRate: this.calculateOccupancyRate(roomStatus),
      maintenanceSchedule: this.generateMaintenanceSchedule(roomStatus),
      cleaningPriority: this.determineCleaningPriority(roomStatus),
      capacityOptimization: this.optimizeCapacity(roomStatus),
    };

    return management;
  }

  private async performFinancialAnalysis(financialData: any): Promise<any> {
    // Finansal analiz algoritması
    const analysis = {
      revenueAnalysis: this.analyzeRevenue(financialData),
      costAnalysis: this.analyzeCosts(financialData),
      profitabilityMetrics: this.calculateProfitabilityMetrics(financialData),
      growthProjections: this.projectGrowth(financialData),
    };

    return analysis;
  }

  // Yardımcı metodlar
  private analyzePreferences(customerData: any): any {
    return {
      roomType: customerData.odaTipi || 'Standart',
      duration: customerData.konaklamaSuresi || 1,
      budget: customerData.butce || 'Orta',
    };
  }

  private calculateRiskScore(customerData: any): number {
    // Risk skoru hesaplama algoritması
    let score = 50; // Başlangıç skoru

    if (customerData.type === 'Kurumsal') score += 20;
    if (customerData.odemeGecmisi === 'İyi') score += 15;
    if (customerData.konaklamaSuresi > 30) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private generateCustomerRecommendations(customerData: any): string[] {
    const recommendations: string[] = [];

    if (customerData.type === 'Bireysel') {
      recommendations.push('Bireysel müşteri için özel kampanya önerisi');
    } else {
      recommendations.push('Kurumsal müşteri için toplu indirim önerisi');
    }

    if (customerData.konaklamaSuresi > 7) {
      recommendations.push('Uzun konaklama için haftalık indirim önerisi');
    }

    return recommendations;
  }

  private calculateOptimalPrice(roomData: any, marketData: any): number {
    const basePrice = roomData.price;
    const marketAverage = marketData.averagePrice || basePrice;
    const demandFactor = marketData.demandFactor || 1;

    return Math.round(basePrice * demandFactor * 0.95); // %5 indirim ile başla
  }

  private analyzeMarketConditions(marketData: any): any {
    return {
      demandLevel: marketData.demandLevel || 'Orta',
      competitionLevel: marketData.competitionLevel || 'Orta',
      seasonalFactor: marketData.seasonalFactor || 1,
    };
  }

  private calculateSeasonalAdjustments(): any {
    const currentMonth = new Date().getMonth();
    const seasonalRates = {
      summer: [5, 6, 7, 8], // Haziran-Eylül
      winter: [11, 0, 1, 2], // Aralık-Mart
      spring: [3, 4], // Nisan-Mayıs
      autumn: [9, 10], // Ekim-Kasım
    };

    let adjustment = 1;
    if (seasonalRates.summer.includes(currentMonth)) adjustment = 1.2;
    else if (seasonalRates.winter.includes(currentMonth)) adjustment = 0.8;

    return { adjustment, season: this.getSeasonName(currentMonth) };
  }

  private getSeasonName(month: number): string {
    if ([5, 6, 7, 8].includes(month)) return 'Yaz';
    if ([11, 0, 1, 2].includes(month)) return 'Kış';
    if ([3, 4].includes(month)) return 'İlkbahar';
    return 'Sonbahar';
  }

  private calculateOccupancyRate(roomStatus: any): number {
    const totalRooms = roomStatus.totalRooms || 1;
    const occupiedRooms = roomStatus.occupiedRooms || 0;
    return Math.round((occupiedRooms / totalRooms) * 100);
  }

  private generateMaintenanceSchedule(roomStatus: any): any[] {
    return (
      roomStatus.rooms?.map((room: any) => ({
        roomId: room.id,
        lastMaintenance: room.lastMaintenance,
        nextMaintenance: this.calculateNextMaintenance(room.lastMaintenance),
        priority: room.maintenancePriority || 'Normal',
      })) || []
    );
  }

  private calculateNextMaintenance(lastMaintenance: string): string {
    const lastDate = new Date(lastMaintenance);
    const nextDate = new Date(lastDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 gün sonra
    return nextDate.toLocaleDateString('tr-TR');
  }

  private determineCleaningPriority(roomStatus: any): any[] {
    return (
      roomStatus.rooms?.map((room: any) => ({
        roomId: room.id,
        priority: room.cleaningPriority || 'Normal',
        lastCleaning: room.lastCleaning,
        nextCleaning: this.calculateNextCleaning(room.lastCleaning),
      })) || []
    );
  }

  private calculateNextCleaning(lastCleaning: string): string {
    const lastDate = new Date(lastCleaning);
    const nextDate = new Date(lastDate.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 gün sonra
    return nextDate.toLocaleDateString('tr-TR');
  }

  private optimizeCapacity(roomStatus: any): any {
    const occupancyRate = this.calculateOccupancyRate(roomStatus);

    return {
      currentCapacity: occupancyRate,
      recommendedCapacity: Math.min(85, occupancyRate + 10), // %85'e kadar artır
      optimizationSuggestions:
        occupancyRate < 70
          ? ['Kapasite artırma kampanyası başlat', 'Fiyat indirimi önerisi']
          : ['Mevcut kapasite optimal seviyede'],
    };
  }

  private analyzeRevenue(financialData: any): any {
    return {
      totalRevenue: financialData.totalRevenue || 0,
      monthlyGrowth: this.calculateGrowthRate(financialData.monthlyRevenue),
      revenueByRoomType: financialData.revenueByRoomType || {},
      averageRevenuePerGuest: this.calculateAverageRevenue(financialData),
    };
  }

  private analyzeCosts(financialData: any): any {
    return {
      totalCosts: financialData.totalCosts || 0,
      costBreakdown: financialData.costBreakdown || {},
      costEfficiency: this.calculateCostEfficiency(financialData),
      costOptimizationSuggestions:
        this.generateCostOptimizationSuggestions(financialData),
    };
  }

  private calculateProfitabilityMetrics(financialData: any): any {
    const revenue = financialData.totalRevenue || 0;
    const costs = financialData.totalCosts || 0;
    const profit = revenue - costs;

    return {
      grossProfit: profit,
      profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
      roi: this.calculateROI(financialData),
      breakEvenPoint: this.calculateBreakEvenPoint(financialData),
    };
  }

  private projectGrowth(financialData: any): any {
    const currentRevenue = financialData.totalRevenue || 0;
    const growthRate = this.calculateGrowthRate(financialData.monthlyRevenue);

    return {
      projectedRevenue: currentRevenue * (1 + growthRate / 100),
      growthRate: growthRate,
      growthFactors: this.identifyGrowthFactors(financialData),
      growthRecommendations: this.generateGrowthRecommendations(financialData),
    };
  }

  private calculateGrowthRate(monthlyRevenue: any[]): number {
    if (!monthlyRevenue || monthlyRevenue.length < 2) return 0;

    const current = monthlyRevenue[monthlyRevenue.length - 1];
    const previous = monthlyRevenue[monthlyRevenue.length - 2];

    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  }

  private calculateAverageRevenue(financialData: any): number {
    const revenue = financialData.totalRevenue || 0;
    const guests = financialData.totalGuests || 1;
    return revenue / guests;
  }

  private calculateCostEfficiency(financialData: any): number {
    const revenue = financialData.totalRevenue || 0;
    const costs = financialData.totalCosts || 0;
    return revenue > 0 ? (costs / revenue) * 100 : 0;
  }

  private generateCostOptimizationSuggestions(financialData: any): string[] {
    const suggestions: string[] = [];
    const costEfficiency = this.calculateCostEfficiency(financialData);

    if (costEfficiency > 80) {
      suggestions.push('Maliyet optimizasyonu gerekli');
      suggestions.push('Enerji tasarrufu önlemleri alın');
    }

    return suggestions;
  }

  private calculateROI(financialData: any): number {
    const profit =
      (financialData.totalRevenue || 0) - (financialData.totalCosts || 0);
    const investment = financialData.totalInvestment || 1;
    return (profit / investment) * 100;
  }

  private calculateBreakEvenPoint(financialData: any): number {
    const fixedCosts = financialData.fixedCosts || 0;
    const variableCosts = financialData.variableCosts || 0;
    const pricePerUnit = financialData.pricePerUnit || 1;

    return fixedCosts / (pricePerUnit - variableCosts);
  }

  private identifyGrowthFactors(financialData: any): string[] {
    const factors: string[] = [];

    if (financialData.seasonalDemand) factors.push('Sezonsal talep artışı');
    if (financialData.marketingCampaigns)
      factors.push('Pazarlama kampanyaları');
    if (financialData.customerSatisfaction > 4)
      factors.push('Yüksek müşteri memnuniyeti');

    return factors;
  }

  private generateGrowthRecommendations(financialData: any): string[] {
    const recommendations: string[] = [];

    recommendations.push('Müşteri sadakat programı başlat');
    recommendations.push('Online rezervasyon sistemini geliştir');
    recommendations.push('Sosyal medya pazarlamasını artır');

    return recommendations;
  }
}
