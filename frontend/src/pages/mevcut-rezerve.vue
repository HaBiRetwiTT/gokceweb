<template>
  <q-page class="mevcut-rezerve-page q-pa-md">


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
                  color="lime-2"
                  @click="refreshAll"
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
                <!-- Oda tipi hover tooltip: Boş oda-yatak listesi -->
                <q-tooltip 
                  :key="'bos-' + tooltipKey + '-' + odaTipi.odaTipi"
                  anchor="center right" 
                  self="center left" 
                  :offset="[10, 0]"
                  class="bos-odalar-tooltip bg-dark text-white shadow-2"
                  :max-width="null"
                  @before-show="() => ensureBosOdalar(odaTipi.odaTipi)"
                >
                  <div class="bos-odalar-tooltip-content">
                    <div class="q-mb-xs text-weight-bold">Boş Oda-Yataklar</div>
                    <div v-if="bosOdalarLoading[odaTipi.odaTipi]" class="row items-center q-gutter-sm">
                      <q-spinner-dots size="16px" color="white" />
                      <span>Yükleniyor...</span>
                    </div>
                    <div v-else>
                      <div v-if="(bosOdalarCache[odaTipi.odaTipi] || []).length === 0" class="text-italic">
                        Uygun boş yatak bulunamadı
                      </div>
                      <div v-else class="kat-columns">
                        <div class="kat-column" v-for="kat in getKats(odaTipi.odaTipi)" :key="kat">
                          <div class="kat-header">Kat {{ kat }}</div>
                          <ul class="bos-odalar-list">
                            <li v-for="(item, idx) in getBosListByKat(odaTipi.odaTipi, kat)" :key="`${kat}-${idx}`">
                              {{ (item.label || item.value) + (item.durum ? ' / ' + item.durum : '') }}
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-tooltip>
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
                    <div class="bos-sayisi" :class="{ 'sifir-deger': doluluk.bosYatakSayisi === 0 }">
                      B: {{ doluluk.bosYatakSayisi }}
                    </div>
                    
                    <!-- Rezerve Sayısı -->
                    <div class="rezerve-sayisi sifir-deger">
                      R: 0
                    </div>
                    
                    <!-- Toplam Sayısı -->
                    <div class="toplam-sayisi sifir-deger">
                      T: 0
                    </div>
                  </div>
                  
                  <!-- Tooltip -->
                  <q-tooltip 
                    :key="'kon-' + tooltipKey + '-' + doluluk.tarih + '-' + odaTipi.odaTipi"
                    v-if="doluluk.dolu && doluluk.konaklamaDetaylari.length > 0"
                    anchor="center right" 
                    self="center left"
                    :offset="[10, 0]"
                    class="bg-dark text-white shadow-2 custom-large-tooltip"
                    style="font-size: 0.65rem;"
                    :max-height="null"
                    :max-width="null"
                  >
                    <div class="konaklama-tooltip">
                      <div class="tooltip-header q-mb-xs">
                        <strong>{{ formatTarihDetay(doluluk.tarih) }}</strong>
                      </div>
                      <div class="tooltip-columns">
                        <div 
                          v-for="columnIndex in getColumnCount(doluluk.konaklamaDetaylari)"
                          :key="columnIndex"
                          class="tooltip-column"
                        >
                          <div 
                            v-for="(detay, index) in doluluk.konaklamaDetaylari.slice((columnIndex - 1) * 28, columnIndex * 28)" 
                            :key="(columnIndex - 1) * 28 + index"
                            class="tooltip-item q-mb-xs"
                            :class="{ 'aylik-konaklama-satir': detay.konaklamaTipi?.toUpperCase() === 'AYLIK' }"
                          >
                            <div class="tooltip-row">
                              <div class="oda-yatak-col">
                                {{ detay.odaNo }}-{{ detay.yatakNo }}
                              </div>
                              <div class="tip-col">
                                <span 
                                  :class="{ 'aylik-konaklama': detay.konaklamaTipi?.toUpperCase() === 'AYLIK' || detay.konaklamaTipi === 'Aylık' }"
                                >
                                  {{ detay.konaklamaTipi }}
                                </span>
                              </div>
                              <div class="musteri-col">
                                {{ detay.musteriAdi }}
                              </div>
                            </div>
                          </div>
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

function debugLog(...args: unknown[]) {
  if (import.meta.env.MODE !== 'production') {
    console.log(...args)
  }
}

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
  // Tooltip yenileme anahtarı
  const tooltipKey = ref(0)

  // Boş odalar tooltip cache ve yükleme durumları
  const bosOdalarCache = ref<Record<string, Array<{ label?: string; value: string; durum?: string }>>>({})
  const bosOdalarLoading = ref<Record<string, boolean>>({})

  async function ensureBosOdalar(odaTipi: string) {
    try {
      if (!odaTipi) return
      if (bosOdalarCache.value[odaTipi] && bosOdalarCache.value[odaTipi].length > 0) return
      if (bosOdalarLoading.value[odaTipi]) return
      bosOdalarLoading.value = { ...bosOdalarLoading.value, [odaTipi]: true }
      // Basit SQL mantığı backend'de uygulanıyor.
      // Doğru endpoint: GET /musteri/bos-odalar/:odaTipi
      const response = await api.get(`/musteri/bos-odalar/${encodeURIComponent(odaTipi)}`)
      const rows = ((response.data?.data || []) as Array<{ label?: string; value: string; durum?: string }>)
        .map((r) => ({ label: r.label || r.value, value: r.value, durum: r.durum }))
      bosOdalarCache.value = { ...bosOdalarCache.value, [odaTipi]: rows }
    } catch {
      bosOdalarCache.value = { ...bosOdalarCache.value, [odaTipi]: [] }
    } finally {
      bosOdalarLoading.value = { ...bosOdalarLoading.value, [odaTipi]: false }
    }
  }

  function extractKatFromItem(item: { label?: string; value: string; durum?: string }): string {
    const text = String(item.label ?? item.value ?? '')
    // "101-1" gibi ifadede odaNo ilk digit katı verir
    const odaNoPart = text.split('-')[0]
    const digits = odaNoPart.match(/\d+/)?.[0] ?? ''
    return digits.charAt(0) || '0'
  }

  function getKats(odaTipi: string): string[] {
    const list = bosOdalarCache.value[odaTipi] || []
    const set = new Set<string>()
    for (const it of list) set.add(extractKatFromItem(it))
    return Array.from(set).sort((a, b) => Number(a) - Number(b))
  }

  function getBosListByKat(odaTipi: string, kat: string): Array<{ label?: string; value: string; durum?: string }> {
    const list = bosOdalarCache.value[odaTipi] || []
    return list.filter((it) => extractKatFromItem(it) === kat)
  }


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
    
    debugLog('Takvim verileri yüklendi:', takvimData.value)
    debugLog('Gün sayısı:', takvimData.value?.gunler?.length)
    debugLog('İlk tarih:', takvimData.value?.gunler?.[0])
    debugLog('Son tarih:', takvimData.value?.gunler?.[takvimData.value.gunler.length - 1])
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



// Debug: Sütun sayısını konsola yazdır
function getColumnCount(detaylar: KonaklamaDetay[]) {
  const count = Math.ceil(detaylar.length / 28)
  console.log(`📊 ${detaylar.length} kayıt için ${count} sütun hesaplandı`)
  return count
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

  function refreshAll() {
    // Veriyi yenile
    void loadTakvimData()
    // Tooltipleri zorla yeniden oluştur
    tooltipKey.value++
    // Boş odalar tooltip cache'ini temizle ve tüm oda tipleri için yeniden yüklemeye izin ver
    bosOdalarCache.value = {}
    bosOdalarLoading.value = {}
  }
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

.refresh-btn {
  margin-right: 8px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  border: 1px solid rgba(255, 255, 255, 0.5);
  transform: scale(1.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.refresh-btn .q-btn__content i {
  color: white !important;
  font-size: 1.2rem;
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
  padding: 1.35rem;
  width: 135px;
  border-right: 1px solid #e0e0e0; /* Tarih sütunu ile arasında border */
  border-bottom: 1px solid rgba(224, 224, 224, 0.3); /* Satırlar arası hafif border */
  cursor: pointer; /* Tooltip hedefinde el işareti */
}

/* Boş odalar tooltip içerik stilleri */
.bos-odalar-tooltip-content {}

.bos-odalar-list {
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
  padding-left: 16px;
}

.kat-columns {
  display: flex;
  gap: 12px;
  flex-wrap: wrap; /* 2’den fazla katı yan yana gösterebilmek ve sığmazsa alta geçmek */
  max-width: none; /* genişlik sınırı yok */
}

.kat-column {
  min-width: 100px;
  flex: 0 0 100px; /* sütunları biraz daralt ve sabitle */
}

.kat-header {
  font-weight: 700;
  margin-bottom: 6px;
}

/* Global aggressive tooltip override'larını aşmak için daha spesifik seçici */
:deep(.bos-odalar-tooltip .q-tooltip__content) {
  max-height: 340px !important;
  max-width: none !important; /* genişlik sınırlamasını kaldır */
  overflow: auto !important;  /* hem yatay hem dikey kaydırma mümkün olsun */
  white-space: normal !important;
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
  border-bottom: 1px solid rgba(224, 224, 224, 0.3); /* Satırlar arası hafif border */
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

/* Tooltip Stilleri - Quasar Override */
.custom-large-tooltip {
  max-width: none !important;
  max-height: none !important;
  width: auto !important;
  height: auto !important;
}

:deep(.custom-large-tooltip .q-tooltip__content) {
  max-width: none !important;
  max-height: none !important;
  width: auto !important;
  height: auto !important;
  overflow: hidden !important;
}

.konaklama-tooltip {
  padding: 0.5rem;
  line-height: 1.4;
  max-height: none !important;
  min-height: auto;
  overflow: hidden !important;
  width: auto !important;
}

.tooltip-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  padding-bottom: 0.25rem;
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 0.5rem;
}

.tooltip-columns {
  display: flex;
  gap: 1rem;
  flex-wrap: nowrap;
  align-items: flex-start;
  width: auto !important;
  height: auto !important;
}

.tooltip-column {
  flex: 0 0 auto;
  min-width: 200px;
  max-width: 300px;
  width: 250px;
  max-height: none !important;
  overflow: hidden !important;
}

.tooltip-item {
  display: block;
  margin-bottom: 0.2rem;
}

.tooltip-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.65rem;
  line-height: 1.2;
}

.oda-yatak-col {
  font-weight: 600;
  color: #81c784;
  min-width: 50px;
  flex-shrink: 0;
}

.tip-col {
  color: #ffffff;
  font-size: 0.6rem;
  font-weight: 400;
  min-width: 70px;
  text-align: left;
  flex-shrink: 0;
}

.musteri-col {
  color: #ffffff;
  flex: 1;
  word-break: break-word;
  font-weight: 500;
}



.aylik-konaklama {
  color: #4caf50 !important; /* Yeşil renk */
  font-weight: 600;
}

/* Aylık konaklama satırları silik ton */
.tooltip-item:has(.aylik-konaklama) {
  opacity: 0.3;
}

/* Alternatif - CSS :has() desteklenmiyorsa */
.aylik-konaklama-satir {
  opacity: 0.3;
}



/* Dark Mode Desteği */
.body--dark .mevcut-rezerve-page {
  background: #121212;
}

.body--dark .aylik-konaklama {
  color: #81c784 !important; /* Dark mode için açık yeşil */
  font-weight: 600;
}

/* Global Quasar Tooltip Override - Force no height limits */
.q-tooltip {
  max-height: none !important;
  height: auto !important;
}

.q-tooltip .q-tooltip__content {
  max-height: none !important;
  height: auto !important;
  overflow: hidden !important;
}

/* Viewport constraint override */
.q-tooltip--style-default {
  max-height: none !important;
}

/* Force override viewport constraints */
.q-tooltip__content {
  max-height: 100vh !important;
  overflow-y: hidden !important;
}

.q-tooltip .q-tooltip__content > div {
  max-height: none !important;
  overflow: hidden !important;
}

/* Override any inherited height restrictions */
* .q-tooltip,
* .q-tooltip__content {
  max-height: none !important;
  height: auto !important;
}

/* AGGRESSIVE SCROLLBAR ELIMINATION */
.q-tooltip,
.q-tooltip *,
.custom-large-tooltip,
.custom-large-tooltip *,
.konaklama-tooltip,
.konaklama-tooltip * {
  overflow: hidden !important;
  overflow-x: hidden !important;
  overflow-y: hidden !important;
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.q-tooltip::-webkit-scrollbar,
.custom-large-tooltip::-webkit-scrollbar,
.konaklama-tooltip::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
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

.rezerve-sayisi {
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 800;
  opacity: 1;
  line-height: 1;
  text-align: center;
}

.toplam-sayisi {
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 800;
  opacity: 1;
  line-height: 1;
  text-align: center;
}

.body--dark .rezerve-sayisi {
  color: #ffffff;
  opacity: 1;
}

.body--dark .toplam-sayisi {
  color: #ffffff;
  opacity: 1;
}

/* Sıfır değerli satırlar için silik renk */
.sifir-deger {
  opacity: 0.4 !important;
  color: #cccccc !important;
}

.body--dark .sifir-deger {
  color: #666666 !important;
  opacity: 0.4 !important;
}

/* Dark mode için doluluk cell shadow */
.body--dark .doluluk-cell {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1); /* Dark mode için açık shadow */
  border-bottom: 1px solid rgba(255, 255, 255, 0.2); /* Dark mode için açık border */
}

.body--dark .oda-tipi-cell {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2); /* Dark mode için açık border */
}

.body--dark .refresh-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.body--dark .refresh-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.4);
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

