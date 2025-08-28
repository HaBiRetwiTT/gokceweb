import { api } from 'boot/axios'
import type { AccommodationType, DashboardResponse, DashboardCustomerData } from '../types/accommodation'

export class DashboardApiService {
  private static readonly BASE_URL = '/dashboard'

  /**
   * Get accommodation types from database for the grid
   */
  static async getAccommodationTypesForGrid(): Promise<AccommodationType[]> {
    try {
      const response = await api.get<{
        success: boolean
        data: Array<{
          id: number
          value: string
          label: string
          icon: string
          color: string
          count: number
        }>
      }>(`${this.BASE_URL}/konaklama-tipleri-grid`)
      
      if (response.data.success) {
        return response.data.data.map(item => ({
          id: item.id,
          value: item.value,
          label: item.label,
          icon: item.icon,
          color: item.color
        }))
      }
      throw new Error('Failed to get accommodation types')
    } catch (error) {
      console.error('Error fetching accommodation types for grid:', error)
      // Return default types if API fails
      return [
        { id: 1, value: 'GUNLUK', label: 'GÜNLÜK', icon: 'today', color: 'orange' },
        { id: 2, value: 'HAFTALIK', label: 'HAFTALIK', icon: 'date_range', color: 'blue' },
        { id: 3, value: 'AYLIK', label: 'AYLIK', icon: 'calendar_month', color: 'green' }
      ]
    }
  }

  /**
   * Get customer list by accommodation type
   */
  static async getMusteriListesi(tip: string = 'TÜMÜ'): Promise<DashboardResponse> {
    try {
      const response = await api.get<DashboardResponse>(`${this.BASE_URL}/musteri-listesi`, {
        params: { tip }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching customer list:', error)
      throw error
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<Record<string, unknown>> {
    try {
      const response = await api.get<{
        success: boolean
        data: Record<string, unknown>
      }>(`${this.BASE_URL}/stats`)
      
      if (response.data.success) {
        return response.data.data
      }
      throw new Error('Failed to get dashboard stats')
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }
  }

  /**
   * Get active accommodations by type and room type
   */
  static async getToplamAktifMusteri(
    tip: string = 'TÜMÜ', 
    odaTip: string = 'TÜMÜ'
  ): Promise<DashboardResponse> {
    try {
      const response = await api.get<DashboardResponse>(`${this.BASE_URL}/toplam-aktif`, {
        params: { tip, odaTip }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching active customers:', error)
      throw error
    }
  }

  /**
   * Clear dashboard cache
   */
  static async clearCache(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.put<{ success: boolean; message: string }>(`${this.BASE_URL}/clear-cache`)
      return response.data
    } catch (error) {
      console.error('Error clearing cache:', error)
      throw error
    }
  }

  /**
   * Search accommodations globally
   */
  static async searchMusteriKonaklama(
    query: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    success: boolean
    data: DashboardCustomerData[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const response = await api.get(`${this.BASE_URL}/musteri-konaklama-search`, {
        params: { q: query, page, limit }
      })
      return response.data
    } catch (error) {
      console.error('Error searching accommodations:', error)
      throw error
    }
  }
}