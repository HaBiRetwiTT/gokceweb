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
                  size="sm"
                  color="white"
                  @click="loadTakvimData"
                  class="refresh-btn q-mr-sm"
                />
                Oda Tipi
              </th>
              <th 
                v-for="gun in takvimData.gunler" 
                :key="gun"
                class="tarih-header"
              >
                <div class="tarih-cell">
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
                  <div v-if="odaTipi.maxPlanlananTarih" class="max-tarih">
                    Son: {{ odaTipi.maxPlanlananTarih }}
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
              >
                <div class="doluluk-indicator">
                  <!-- Ana İçerik -->
                  <div class="hucre-content">
                    <q-icon 
                      v-if="doluluk.dolu" 
                      name="hotel" 
                      size="1rem" 
                      color="white"
                      class="yatak-icon"
                    />
                    
                    <!-- Konaklama Sayısı -->
                    <div 
                      v-if="doluluk.dolu && doluluk.konaklamaDetaylari.length > 0"
                      class="konaklama-sayisi"
                    >
                      {{ doluluk.konaklamaDetaylari.length }}
                    </div>
                  </div>
                  
                  <!-- Tooltip -->
                  <q-tooltip 
                    v-if="doluluk.dolu && doluluk.konaklamaDetaylari.length > 0"
                    anchor="center right" 
                    self="center left"
                    :offset="[10, 0]"
                    class="bg-dark text-white shadow-2"
                    style="font-size: 0.85rem; max-width: 300px;"
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
import { ref, onMounted } from 'vue'
import { api } from '../boot/axios'
import { Notify } from 'quasar'

interface KonaklamaDetay {
  musteriAdi: string
  odaNo: string
  yatakNo: string
}

interface TakvimData {
  gunler: string[]
  odaTipleri: Array<{
    odaTipi: string
    dolulukTarihleri: Array<{
      tarih: string
      dolu: boolean
      konaklamaDetaylari: KonaklamaDetay[]
    }>
    maxPlanlananTarih: string | null
  }>
}

// Reactive state
const loading = ref(true)
const error = ref<string | null>(null)
const takvimData = ref<TakvimData | null>(null)

// Takvim verilerini yükle
async function loadTakvimData() {
  try {
    loading.value = true
    error.value = null
    
    const response = await api.get('/konaklama-takvim/oda-doluluk', {
      params: {
        gunSayisi: 30 // 30 gün göster
      }
    })
    
    takvimData.value = response.data
    console.log('Takvim verileri yüklendi:', takvimData.value)
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
    return `${parts[0]}.${parts[1]}`
  }
  return tarih
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

// Component mount olduğunda veri yükle
onMounted(() => {
  void loadTakvimData()
})
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
  /* Yatay kaydırma çubuğunu gizle */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE ve Edge */
}

.table-wrapper::-webkit-scrollbar {
  display: none; /* Chrome, Safari ve Opera */
}

.calendar-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px; /* 30 gün için daha geniş */
  font-size: 0.85rem; /* Daha kompakt görünüm */
}

/* Başlık Stilleri */
.oda-tipi-header {
  background: #3949ab;
  color: white;
  padding: 0.75rem 0.5rem;
  text-align: center;
  font-weight: 600;
  position: sticky;
  left: 0;
  z-index: 10;
  width: 140px; /* Sabit genişlik - daraltıldı */
  max-width: 140px;
  min-width: 140px;
  border-right: 2px solid #e0e0e0;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn {
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.refresh-btn:hover {
  opacity: 1;
}

.tarih-header {
  background: #5c6bc0;
  color: white;
  padding: 0.4rem 0.2rem;
  text-align: center;
  width: 50px; /* Daha dar hücreler */
  max-width: 50px;
  min-width: 50px;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 0.75rem;
}



.tarih-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.gun-adi {
  font-size: 0.65rem;
  font-weight: 500;
  line-height: 1;
}

.tarih {
  font-size: 0.6rem;
  opacity: 0.9;
  line-height: 1;
}

/* Veri Satırları */
.oda-tipi-row:nth-child(even) {
  background: rgba(0, 0, 0, 0.02);
}

.oda-tipi-cell {
  background: #f8f9fa;
  padding: 0.75rem 0.5rem;
  border-right: 2px solid #e0e0e0;
  position: sticky;
  left: 0;
  z-index: 5;
  width: 140px; /* Sabit genişlik - daraltıldı */
  max-width: 140px;
  min-width: 140px;
}

.oda-tipi-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.oda-tipi-adi {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.8rem;
  line-height: 1.1;
  word-wrap: break-word;
}

.max-tarih {
  font-size: 0.65rem;
  color: #7b1fa2;
  font-weight: 500;
  line-height: 1;
}

/* Doluluk Hücreleri */
.doluluk-cell {
  width: 50px; /* Dar hücreler */
  height: 45px; /* Daha düşük */
  border: 1px solid #e0e0e0;
  padding: 0;
  position: relative;
}

.doluluk-cell.dolu {
  background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
}

.doluluk-cell.bos {
  background: #f5f5f5;
}



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
  gap: 0.2rem;
  height: 100%;
}

.yatak-icon {
  flex-shrink: 0;
}

.konaklama-sayisi {
  background: rgba(255, 255, 255, 0.9);
  color: #2e7d32;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
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



/* Dark Mode Desteği */
.body--dark .mevcut-rezerve-page {
  background: #121212;
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

.body--dark .doluluk-cell.bos {
  background: #333;
}

.body--dark .konaklama-sayisi {
  background: rgba(0, 0, 0, 0.8);
  color: #81c784;
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
    width: 120px;
    min-width: 120px;
    max-width: 120px;
  }
  

}

@media (max-width: 480px) {
  .calendar-table {
    min-width: 900px; /* 30 gün için mobilde */
    font-size: 0.8rem;
  }
  
  .tarih-header {
    width: 40px;
    min-width: 40px;
    max-width: 40px;
    padding: 0.3rem 0.1rem;
  }
  
  .doluluk-cell {
    width: 40px;
    height: 40px;
  }

  .oda-tipi-header,
  .oda-tipi-cell {
    width: 100px;
    min-width: 100px;
    max-width: 100px;
  }

  .gun-adi {
    font-size: 0.6rem;
  }

  .tarih {
    font-size: 0.55rem;
  }

  .konaklama-sayisi {
    width: 14px;
    height: 14px;
    font-size: 0.65rem;
  }
}
</style>