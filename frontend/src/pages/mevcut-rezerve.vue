<template>
  <q-page class="mevcut-rezerve-page q-pa-md">
    <!-- Başlık -->
    <div class="page-header q-mb-lg">
      <q-icon name="calendar_month" size="2rem" color="indigo-6" class="q-mr-sm" />
      <span class="text-h4 text-weight-medium">Oda Tip Takvim</span>
      <span class="text-subtitle1 text-grey-6 q-ml-sm">Mevcut - Rezerve</span>
    </div>

    <!-- Yükleme İndikatörü -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner-dots size="3rem" color="indigo-6" />
      <div class="text-subtitle1 q-mt-md">Konaklama verileri yükleniyor...</div>
    </div>

    <!-- Takvim Tablosu -->
    <div v-else-if="takvimData" class="calendar-container">
      <!-- Responsive Tablo -->
      <div class="table-wrapper">
        <table class="calendar-table">
          <!-- Başlık Satırı -->
          <thead>
            <tr>
              <th class="oda-tipi-header">
                <q-btn 
                  icon="refresh" 
                  flat 
                  dense 
                  round 
                  size="xs"
                  @click="loadTakvimData"
                  class="refresh-btn"
                />
                Oda Tipi
              </th>
              <th 
                v-for="(gun, index) in takvimData.gunler" 
                :key="gun"
                class="tarih-header"
                :class="{ 
                  'month-change': isMonthChange(gun, index),
                  'first-of-month': formatTarihKisa(gun) === '1'
                }"
              >
                <div class="tarih-cell">
                  <!-- Ay değişimi göstergesi -->
                  <div 
                    v-if="isMonthChange(gun, index)" 
                    class="month-indicator"
                  >
                    {{ getMonthName(gun) }}
                  </div>
                  
                  <div class="gun-adi">{{ getGunAdi(gun) }}</div>
                  <div class="tarih">{{ formatTarihKisa(gun) }}</div>
                </div>
              </th>
            </tr>
          </thead>

          <!-- Veri Satırları -->
          <tbody>
            <tr 
              v-for="odaTipi in takvimData.odaTipleri" 
              :key="odaTipi.odaTipi"
              class="oda-tipi-row"
            >
              <!-- Oda Tipi Sütunu -->
              <td class="oda-tipi-cell">
                <div class="oda-tipi-content">
                  <div class="oda-tipi-adi">{{ odaTipi.odaTipi }}</div>
                  <div class="konaklama-toplam">
                    Toplam Konaklama: {{ getTotalKonaklama(odaTipi) }}
                  </div>
                </div>
              </td>

              <!-- Tarih Hücreleri -->
              <td 
                v-for="doluluk in odaTipi.dolulukTarihleri" 
                :key="doluluk.tarih"
                class="doluluk-cell"
                :class="{ 
                  'dolu': doluluk.dolu,
                  'bos': !doluluk.dolu
                }"
                :style="getHucreStyle(doluluk)"
                :data-gradient-color="doluluk.dolu ? calculateGradientColor(doluluk.bosYatakSayisi, doluluk.konaklamaDetaylari.length) : ''"
              >
                <div class="doluluk-indicator">
                  <!-- Ana İçerik - Sadece dolu hücrelerde göster -->
                  <div v-if="doluluk.dolu" class="hucre-content">
                    <!-- Dolu Yatak Sayısı -->
                    <div class="dolu-sayisi">
                      D: {{ doluluk.konaklamaDetaylari.length }}
                    </div>
                    
                    <!-- Boş Yatak Sayısı -->
                    <div class="bos-sayisi">
                      B: {{ doluluk.bosYatakSayisi }}
                    </div>
                  </div>
                  
                  <!-- Tooltip -->
                  <q-tooltip 
                    v-if="doluluk.dolu && doluluk.konaklamaDetaylari.length > 0"
                    anchor="center right" 
                    self="center left"
                    :offset="[10, 0]"
                    class="bg-dark text-white shadow-2"
                    style="font-size: 0.65rem; max-width: 300px;"
                  >
                    <div class="konaklama-tooltip">
                      <div class="tooltip-header q-mb-xs">
                        <strong>{{ formatTarihDetay(doluluk.tarih) }}</strong>
                      </div>
                      <div 
                        v-for="(detay, index) in doluluk.konaklamaDetaylari" 
                        :key="index"
                        class="tooltip-item q-mb-xs"
                      >
                        <div class="oda-bilgi">
                          {{ detay.odaNo }}-{{ detay.yatakNo }}:
                        </div>
                        <div class="musteri-adi">
                          {{ detay.musteriAdi }} 
                          <span 
                            :class="{ 'aylik-konaklama': detay.konaklamaTipi?.toUpperCase() === 'AYLIK' || detay.konaklamaTipi === 'Aylık' }"
                            class="konaklama-tipi"
                          >
                            ({{ detay.konaklamaTipi }})
                          </span>
                        </div>
                      </div>
                    </div>
                  </q-tooltip>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- Hata Durumu -->
    <div v-else-if="error" class="error-container text-center q-pa-xl">
      <q-icon name="error" size="3rem" color="negative" />
      <div class="text-h6 q-mt-md">Veri Yüklenirken Hata Oluştu</div>
      <div class="text-body1 q-mt-sm">{{ error }}</div>
      <q-btn 
        color="negative" 
        label="Tekrar Dene" 
        @click="loadTakvimData"
        class="q-mt-md"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, watch } from 'vue'
import { api } from '../boot/axios'
import { Notify } from 'quasar'
import { useRoute } from 'vue-router'

interface KonaklamaDetay {
  musteriAdi: string
  odaNo: string
  yatakNo: string
  konaklamaTipi: string
}

interface TakvimData {
  gunler: string[]
  odaTipleri: Array<{
    odaTipi: string
    dolulukTarihleri: Array<{
      tarih: string
      dolu: boolean
      konaklamaDetaylari: KonaklamaDetay[]
      bosYatakSayisi: number
    }>
    maxPlanlananTarih: string | null
  }>
}

// Reactive state
const loading = ref(true)
const error = ref<string | null>(null)
const takvimData = ref<TakvimData | null>(null)
const route = useRoute()


// Takvim verilerini yükle
async function loadTakvimData() {
  try {
    loading.value = true
    error.value = null
    
    const response = await api.get('/konaklama-takvim/oda-doluluk', {
      params: {
        gunSayisi: 32 // 32 gün göster
      }
    })
    
    takvimData.value = response.data
    
    console.log('Takvim verileri yüklendi:', takvimData.value)
    console.log('Gün sayısı:', takvimData.value?.gunler?.length)
    console.log('İlk tarih:', takvimData.value?.gunler?.[0])
    console.log('Son tarih:', takvimData.value?.gunler?.[takvimData.value.gunler.length - 1])
  } catch (err) {
    console.error('Takvim verileri yüklenirken hata:', err)
    error.value = 'Takvim verileri yüklenemedi. Lütfen tekrar deneyin.'
    
    Notify.create({
      type: 'negative',
      message: 'Takvim verileri yüklenirken hata oluştu',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

// Tarih yardımcı fonksiyonları
function parseDate(dateStr: string): Date {
  const parts = dateStr.split('.')
  if (parts.length === 3) {
    // DD.MM.YYYY formatını parse et
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
  }
  return new Date(dateStr)
}

function getGunAdi(tarih: string): string {
  const date = parseDate(tarih)
  const gunler = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
  return gunler[date.getDay()]
}

function formatTarihKisa(tarih: string): string {
  const parts = tarih.split('.')
  if (parts.length === 3) {
    return parts[0] // Sadece gün sayısı
  }
  return tarih
}

function isMonthChange(tarih: string, index: number): boolean {
  if (!takvimData.value || index === 0) return false
  
  const currentDate = parseDate(tarih)
  const prevDate = parseDate(takvimData.value.gunler[index - 1])
  
  return currentDate.getMonth() !== prevDate.getMonth()
}

function getMonthName(tarih: string): string {
  const date = parseDate(tarih)
  const aylar = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 
                 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
  return aylar[date.getMonth()]
}

function formatTarihDetay(tarih: string): string {
  const date = parseDate(tarih)
  const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
  const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
  
  const gun = gunler[date.getDay()]
  const ay = aylar[date.getMonth()]
  const gunSayisi = date.getDate()
  
  return `${gun}, ${gunSayisi} ${ay}`
}

// Oda tipindeki toplam konaklama sayısını hesapla
function getTotalKonaklama(odaTipi: TakvimData['odaTipleri'][0]): number {
  return odaTipi.dolulukTarihleri.reduce((total: number, doluluk: TakvimData['odaTipleri'][0]['dolulukTarihleri'][0]) => {
    return total + (doluluk.konaklamaDetaylari?.length || 0)
  }, 0)
}

// Boş yatak oranına göre gradient renk hesapla (red -> orange -> yellow -> green)
function calculateGradientColor(bosYatak: number, doluYatak: number): string {
  const toplamKapasite = bosYatak + doluYatak
  
  if (toplamKapasite === 0) {
    return '#ff4444' // Red (boş kapasite)
  }
  
  const bosOrani = bosYatak / toplamKapasite
  
  // 4 aşamalı sistem: Red -> Orange -> Yellow (dar) -> Green
  // Yellow sadece %40-60 arası dar aralıkta
  
  if (bosOrani <= 0.4) {
    // %0-40: Red -> Orange
    const localRatio = bosOrani / 0.4 // 0-1 arası normalize et
    const r = Math.round(255 + (255 - 255) * localRatio) // 255 sabit
    const g = Math.round(68 + (152 - 68) * localRatio)   // 68 -> 152
    const b = Math.round(68 + (0 - 68) * localRatio)     // 68 -> 0
    return `rgb(${r}, ${g}, ${b})`
  } else if (bosOrani <= 0.6) {
    // %40-60: Orange -> Yellow (dar aralık)
    const localRatio = (bosOrani - 0.4) / 0.2 // 0-1 arası normalize et
    const r = Math.round(255 + (255 - 255) * localRatio) // 255 sabit
    const g = Math.round(152 + (235 - 152) * localRatio) // 152 -> 235
    const b = Math.round(0 + (59 - 0) * localRatio)      // 0 -> 59
    return `rgb(${r}, ${g}, ${b})`
  } else {
    // %60-100: Yellow -> Green
    const localRatio = (bosOrani - 0.6) / 0.4 // 0-1 arası normalize et
    const r = Math.round(255 + (76 - 255) * localRatio)  // 255 -> 76
    const g = Math.round(235 + (175 - 235) * localRatio) // 235 -> 175
    const b = Math.round(59 + (80 - 59) * localRatio)    // 59 -> 80
    return `rgb(${r}, ${g}, ${b})`
  }
}

// Hücre için gradient background style hesapla
function getHucreStyle(doluluk: TakvimData['odaTipleri'][0]['dolulukTarihleri'][0]): Record<string, string> {
  if (!doluluk.dolu) {
    return {} // Boş hücreler için stil yok
  }
  
  const doluSayisi = doluluk.konaklamaDetaylari.length
  const bosSayisi = doluluk.bosYatakSayisi
  const gradientColor = calculateGradientColor(bosSayisi, doluSayisi)
  
  return {
    backgroundColor: gradientColor,
    background: `${gradientColor} !important`,
    backgroundImage: `linear-gradient(135deg, ${gradientColor} 0%, ${gradientColor}dd 100%) !important`
  }
}

// Component mount olduğunda veri yükle
onMounted(() => {
  void loadTakvimData()
})

// Sayfa her aktif olduğunda (geri gelindi / navigate edildi) yenile
onActivated(() => {
  void loadTakvimData()
})

// Route değişikliklerini izle (programmatik navigation için)
watch(() => route.path, (newPath, oldPath) => {
  if (newPath === '/mevcut-rezerve' && newPath !== oldPath) {
    void loadTakvimData()
  }
}, { immediate: false })
</script>

<style scoped>
.mevcut-rezerve-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}





.table-wrapper {
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  /* Yatay kaydırma çubuğunu gizle ama kaydırmayı etkin tut */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE ve Edge */
}



.table-wrapper::-webkit-scrollbar {
  display: none; /* Chrome, Safari ve Opera */
}



.calendar-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 995px; /* 960px + 35px (oda tipi artışı) */
  font-size: 0.8rem; /* Daha kompakt görünüm */
}

/* Başlık Stilleri */
.oda-tipi-header {
  background: #5c6bc0;
  color: white;
  padding: 0.75rem;
  text-align: center;
  font-weight: 600;
  width: 135px;
  font-size: 0.85rem;
  border-right: 1px solid rgba(255, 255, 255, 0.2); /* Tarih sütunu ile arasında border */
}





.tarih-header {
  background: #5c6bc0;
  color: white;
  padding: 0.3rem 0.15rem;
  text-align: center;
  width: 36px; /* Çok dar hücreler */
  max-width: 36px;
  min-width: 36px;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 0.7rem;
  position: relative;
}

/* Ay değişimi göstergesi */
.tarih-header.month-change {
  border-left: 3px solid #ff9800;
  background: linear-gradient(135deg, #ff9800 0%, #5c6bc0 100%);
}

.month-indicator {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff9800;
  color: white;
  font-size: 0.6rem;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 3px;
  white-space: nowrap;
  z-index: 10;
}

.first-of-month {
  background: #7986cb !important;
  font-weight: 600;
}



.tarih-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.gun-adi {
  font-size: 0.6rem;
  font-weight: 500;
  line-height: 1;
}

.tarih {
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1;
}

/* Veri Satırları */
.oda-tipi-row:nth-child(even) {
  background: rgba(0, 0, 0, 0.02);
}

.oda-tipi-cell {
  background: #f8f9fa;
  padding: 0.75rem;
  width: 135px;
  border-right: 1px solid #e0e0e0; /* Tarih sütunu ile arasında border */
}

.oda-tipi-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.oda-tipi-adi {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.8rem; /* 0.75rem'den 0.8rem'e artırıldı */
  line-height: 1.1;
  word-wrap: break-word;
}

.konaklama-toplam {
  font-size: 0.65rem; /* 0.6rem'den 0.65rem'e artırıldı */
  color: #7b1fa2;
  font-weight: 500;
  line-height: 1;
}

/* Doluluk Hücreleri */
.doluluk-cell {
  width: 36px; /* Çok dar hücreler */
  height: 40px; /* Daha düşük */
  border: none; /* Border kaldırıldı */
  box-shadow: 0 0 0 1px rgba(224, 224, 224, 0.5); /* Border yerine shadow */
  padding: 0;
  position: relative;
}

.doluluk-cell.bos {
  background: #f5f5f5;
}

/* Gradient inline style için hazırlık */



.doluluk-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  cursor: pointer;
}

.hucre-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
  height: 100%;
  width: 100%;
}

.dolu-sayisi {
  color: #ffffff;
  font-size: 0.8rem; /* 0.7rem'den 0.8rem'e artırıldı */
  font-weight: 600; /* 700'den 400'e düşürüldü - daha silik */
  line-height: 1;
  text-align: center;
  opacity: 0.6; /* Daha silik görünüm */
}

.bos-sayisi {
  color: #ffffff;
  font-size: 0.8rem; /* 0.7rem'den 0.8rem'e artırıldı */
  font-weight: 800; /* 700'den 800'e artırıldı - daha belirgin */
  line-height: 1;
  text-align: center;
  opacity: 1; /* Tam opak - daha belirgin */
}

/* Tooltip Stilleri */
.konaklama-tooltip {
  padding: 0.5rem;
  line-height: 1.4;
}

.tooltip-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  padding-bottom: 0.25rem;
  font-size: 0.9rem;
}

.tooltip-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.oda-bilgi {
  font-weight: 600;
  color: #81c784;
  min-width: 60px;
}

.musteri-adi {
  color: #ffffff;
  word-break: break-word;
}

.konaklama-tipi {
  color: #ffffff;
}

.aylik-konaklama {
  color: #4caf50 !important; /* Yeşil renk */
  font-weight: 600;
}



/* Dark Mode Desteği */
.body--dark .mevcut-rezerve-page {
  background: #121212;
}

.body--dark .aylik-konaklama {
  color: #81c784 !important; /* Dark mode için açık yeşil */
  font-weight: 600;
}

.body--dark .page-header,
.body--dark .table-wrapper {
  background: #1e1e1e;
  color: white;
}

.body--dark .oda-tipi-cell {
  background: #2a2a2a;
}

.body--dark .oda-tipi-adi {
  color: #e0e0e0;
}

.body--dark .konaklama-toplam {
  color: #bb86fc; /* Dark mode için daha açık mor ton */
}

.body--dark .doluluk-cell.bos {
  background: #333;
}

.body--dark .dolu-sayisi {
  color: #fdfafa; /* Daha silik gri ton */
  opacity: 0.5; /* Dark modda daha da silik */
}

.body--dark .bos-sayisi {
  color: #ffffff; /* Belirgin beyaz */
  opacity: 1; /* Tam opak - daha belirgin */
}

/* Dark mode için doluluk cell shadow */
.body--dark .doluluk-cell {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1); /* Dark mode için açık shadow */
}



/* Responsive Tasarım */
@media (max-width: 768px) {
  .mevcut-rezerve-page {
    padding: 0.5rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .oda-tipi-header,
  .oda-tipi-cell {
    width: 120px; /* 135px'in tablet karşılığı */
    min-width: 120px;
    max-width: 120px;
  }
  

}

@media (max-width: 480px) {
  .calendar-table {
    min-width: 790px; /* 760px + 30px (mobil oda tipi artışı) */
    font-size: 0.75rem;
  }
  
  .tarih-header {
    width: 32px;
    min-width: 32px;
    max-width: 32px;
    padding: 0.25rem 0.1rem;
  }
  
  .doluluk-cell {
    width: 32px;
    height: 36px;
  }

  .oda-tipi-header,
  .oda-tipi-cell {
    width: 110px; /* 135px'in mobil karşılığı */
    min-width: 110px;
    max-width: 110px;
  }

  .gun-adi {
    font-size: 0.6rem;
  }

  .tarih {
    font-size: 0.55rem;
  }

  .konaklama-sayisi {
    width: 12px;
    height: 12px;
    font-size: 0.6rem;
  }

  .month-indicator {
    font-size: 0.55rem;
    padding: 1px 2px;
  }
}
</style>

