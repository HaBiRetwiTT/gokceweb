import { Notify } from 'quasar'

export interface VersionInfo {
  version: string
  buildTime: string
  hash: string
}

class VersionCheckerService {
  private currentVersion: string
  private checkInterval: number = 5 * 60 * 1000 // 5 dakika
  private intervalId: number | null = null
  private isChecking: boolean = false
  private lastCheckedVersion: string = ''

  constructor() {
    this.currentVersion = import.meta.env.VITE_APP_VERSION || '0.0.1'
  }

  /**
   * Sürüm kontrolünü başlatır
   * Bu metod, belirli aralıklarla sunucudan yeni sürüm kontrolü yapar
   */
  startVersionCheck(): void {
    if (this.intervalId) {
      return // Zaten çalışıyor
    }

    // İlk kontrolü hemen yap
    void this.checkForUpdates()

    // Periyodik kontrolü başlat
    this.intervalId = window.setInterval(() => {
      void this.checkForUpdates()
    }, this.checkInterval)
  }

  /**
   * Sürüm kontrolünü durdurur
   */
  stopVersionCheck(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Sunucudan sürüm bilgisini alır ve güncelleme kontrolü yapar
   */
  private async checkForUpdates(): Promise<void> {
    if (this.isChecking) {
      return // Zaten kontrol ediliyor
    }

    this.isChecking = true

    try {
      // Sunucudan sürüm bilgisini al
      const response = await fetch('/version.json', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error('Sürüm bilgisi alınamadı')
      }

      const versionInfo: VersionInfo = await response.json()
      
      // Aynı sürümü tekrar kontrol etmeyi engelle
      if (versionInfo.version === this.lastCheckedVersion) {
        return
      }
      
      // Sürüm karşılaştırması yap
      if (this.isNewVersionAvailable(versionInfo.version)) {
        this.lastCheckedVersion = versionInfo.version
        this.showUpdateNotification(versionInfo)
      } else {
        // Güncel sürümü de kaydet
        this.lastCheckedVersion = versionInfo.version
      }
    } catch (error) {
      console.warn('Sürüm kontrolü sırasında hata:', error)
    } finally {
      this.isChecking = false
    }
  }

  /**
   * Yeni sürüm olup olmadığını kontrol eder
   */
  private isNewVersionAvailable(serverVersion: string): boolean {
    return this.compareVersions(serverVersion, this.currentVersion) > 0
  }

  /**
   * İki sürümü karşılaştırır
   * @returns 1: serverVersion daha yeni, 0: eşit, -1: currentVersion daha yeni
   */
  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number)
    const v2Parts = version2.split('.').map(Number)

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0

      if (v1Part > v2Part) return 1
      if (v1Part < v2Part) return -1
    }

    return 0
  }

  /**
   * Güncelleme bildirimini gösterir
   */
  private showUpdateNotification(versionInfo: VersionInfo): void {
    Notify.create({
      type: 'info',
      message: 'Yeni bir sürüm mevcut!',
      caption: `Sürüm ${versionInfo.version} yayınlandı. Güncellemeleri almak için sayfayı yenileyin.`,
      icon: 'system_update',
      position: 'top',
      timeout: 0, // Otomatik kapanmaz
      actions: [
        {
          label: 'Yenile',
          color: 'white',
          handler: () => {
            this.refreshApplication()
          }
        },
        {
          label: 'Daha Sonra',
          color: 'white',
          handler: () => {
            // Bildirimi kapat
          }
        }
      ],
      classes: 'version-update-notification'
    })
  }

  /**
   * Uygulamayı yeniler
   */
  private refreshApplication(): void {
    // Service Worker varsa onu güncelle
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.update()
        })
      })
    }

    // Cache'i temizle
    if ('caches' in window) {
      void caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName)
          })
        )
      })
    }

    // Hard refresh yap (Ctrl+F5 benzeri)
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  /**
   * Manuel sürüm kontrolü yapar
   */
  async manualCheck(): Promise<boolean> {
    try {
      const response = await fetch('/version.json', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error('Sürüm bilgisi alınamadı')
      }

      const versionInfo: VersionInfo = await response.json()
      
      // Aynı sürümü tekrar kontrol etmeyi engelle
      if (versionInfo.version === this.lastCheckedVersion) {
        return false
      }
      
      const hasUpdate = this.isNewVersionAvailable(versionInfo.version)
      
      if (hasUpdate) {
        this.lastCheckedVersion = versionInfo.version
      }
      
      return hasUpdate
    } catch (error) {
      console.error('Manuel sürüm kontrolü hatası:', error)
      return false
    }
  }

  /**
   * Mevcut sürümü döndürür
   */
  getCurrentVersion(): string {
    return this.currentVersion
  }
}

// Singleton instance
export const versionChecker = new VersionCheckerService() 