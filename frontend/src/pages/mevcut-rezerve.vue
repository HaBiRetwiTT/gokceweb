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
                  :loading="syncing"
                  :disable="syncing"
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
                  <div class="konaklama-toplam">
                    Rezervasyonlar: {{ odaTipi as any && (odaTipi as any).totalRezervasyonSayisi !== undefined ? (odaTipi as any).totalRezervasyonSayisi : getTotalRezervasyon(odaTipi) }}
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
              >
                <div class="doluluk-indicator">
                  <!-- Ana İçerik - Sadece dolu hücrelerde göster -->
                  <div v-if="doluluk.dolu" class="hucre-content">
                    <div class="cell-top" :style="getTopStyle(doluluk)">
                      <div class="dolu-sayisi">D: {{ doluluk.konaklamaDetaylari.length }}</div>
                      <div class="bos-sayisi" :class="{ 'sifir-deger': doluluk.bosYatakSayisi === 0 }">B: {{ doluluk.bosYatakSayisi }}</div>
                      <!-- Tooltip: YALNIZCA ÜST BÖLÜMDE AKTİF -->
                      <q-tooltip 
                        :key="'kon-' + tooltipKey + '-' + doluluk.tarih + '-' + odaTipi.odaTipi"
                        v-if="doluluk.konaklamaDetaylari.length > 0"
                        anchor="center right" 
                        self="center left"
                        :offset="[10, 0]"
                        class="bg-dark text-white shadow-2 custom-large-tooltip"
                        style="font-size: 0.65rem;"
                        :content-style="{ width: '600px' }"
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
                    <div class="cell-bottom" :style="getBottomStyle(doluluk)">
                      <div 
                        v-if="(doluluk as any).rezervasyonSayisi && (doluluk as any).rezervasyonSayisi > 0"
                        class="rezerve-sayisi neutral-stat"
                      >
                        R: {{ (doluluk as any).rezervasyonSayisi }}
                      </div>
                      <div 
                        v-if="(doluluk as any).rezervasyonSayisi && (doluluk as any).rezervasyonSayisi > 0"
                        class="toplam-sayisi neutral-stat"
                        :class="{ 'k-critical': Number((doluluk as any).toplamBosEksiRez ?? 0) < 10 }"
                      >
                        K: {{ (doluluk as any).toplamBosEksiRez ?? 0 }}
                      </div>
                      <!-- Alt bölüm tooltip: yalnızca R>0 iken rezervasyon detaylarını göster -->
                      <q-tooltip 
                        v-if="(doluluk as any).rezervasyonSayisi && (doluluk as any).rezervasyonSayisi > 0"
                        anchor="center right" 
                        self="center left"
                        :offset="[10, 0]"
                        class="bg-dark text-white shadow-2 custom-large-tooltip"
                        style="font-size: 0.65rem;"
                        :content-style="{ width: '600px' }"
                        :max-height="null"
                        :max-width="null"
                      >
                        <div class="konaklama-tooltip">
                          <div class="tooltip-header q-mb-xs">
                            <strong>{{ formatTarihDetay(doluluk.tarih) }} • Rezervasyonlar</strong>
                          </div>
                          <div class="tooltip-columns">
                            <div class="tooltip-column">
                              <div 
                                v-for="(rez, idx) in (doluluk as any).rezervasyonDetaylari"
                                :key="idx"
                                class="tooltip-item q-mb-xs"
                              >
                                <div class="tooltip-row">
                                  <div class="oda-yatak-col">{{ rez.kanal || '-' }}</div>
                                  <div class="tip-col">{{ rez.hrResId }}</div>
                                  <div class="musteri-col">
                                    {{ rez.adSoyad }}<span v-if="rez.ulkeKodu && rez.ulkeKodu !== 'TR'"> ({{ rez.ulkeKodu }})</span>
                                    — <span class="nowrap">{{ shortDate(rez.grsTrh) }}→{{ shortDate(rez.cksTrh) }}</span>
                                    <span v-if="Number(rez.ucret) > 0 && rez.odemeDoviz" class="nowrap"> • {{ Number(rez.ucret).toFixed(2) }} {{ rez.odemeDoviz }}</span>
                                    <span v-if="rez.paidStatus" class="nowrap"> • {{ String(rez.paidStatus).toUpperCase() }}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </q-tooltip>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <q-inner-loading :showing="syncing">
          <q-spinner-dots size="48px" color="indigo-6" />
        </q-inner-loading>
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

// Rezervasyon alanlarını da içeren doluluk hücresi tipi (alt bölümde kullanılır)
type DolulukCell = TakvimData['odaTipleri'][0]['dolulukTarihleri'][0] & {
  rezervasyonSayisi?: number
  toplamBosEksiRez?: number
  rezervasyonDetaylari?: Array<{
    hrResId: string
    adSoyad: string
    grsTrh: string
    cksTrh: string
    kanal?: string
    paidStatus?: string
    ulkeKodu?: string
    ucret?: number
    odemeDoviz?: string
  }>
}

// Reactive state
const loading = ref(true)
const syncing = ref(false)
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

// YYYY-MM-DD (ISO) formatında tarih üret
function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// HR rezervasyonlarını günün tarihine uygun aralıkla senkronize et (bugün → bugün+31)
async function syncHotelRunnerForCurrentWindow(): Promise<void> {
  try {
    const from = new Date()
    const to = new Date()
    to.setDate(to.getDate() + 31)
    await api.get('/hotelrunner/sync-reservations', {
      params: {
        from: toISODate(from),
        to: toISODate(to)
      }
    })
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error('HR senkron hatası:', e.message)
    } else {
      console.error('HR senkron hatası:', e)
    }
    // Sessiz geç; takvim yine de yüklensin
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

// Sadece tooltipte kullanılan kısa tarih: DD.MM.YY
function shortDate(dateStr: string | number | null | undefined): string {
  if (!dateStr) return ''
  const s = String(dateStr)
  const parts = s.split('.')
  if (parts.length === 3) {
    const dd = parts[0].padStart(2, '0')
    const mm = parts[1].padStart(2, '0')
    const yy = parts[2].slice(-2)
    return `${dd}.${mm}.${yy}`
  }
  // Fallback ISO -> DD.MM.YY
  const d = new Date(s)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${dd}.${mm}.${yy}`
}

// Oda tipindeki toplam konaklama sayısını hesapla
function getTotalKonaklama(odaTipi: TakvimData['odaTipleri'][0]): number {
  return odaTipi.dolulukTarihleri.reduce((total: number, doluluk: TakvimData['odaTipleri'][0]['dolulukTarihleri'][0]) => {
    return total + (doluluk.konaklamaDetaylari?.length || 0)
  }, 0)
}

// Oda tipi için toplam rezervasyon (32 günlük penceredeki tüm günlerin toplamı)
function getTotalRezervasyon(odaTipi: TakvimData['odaTipleri'][0]): number {
  const cells = odaTipi.dolulukTarihleri as unknown as DolulukCell[]
  let sum = 0
  for (const cell of cells) {
    const r = Number(cell.rezervasyonSayisi ?? 0)
    if (Number.isFinite(r)) sum += r
  }
  return sum
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

// Üst bölüm için zemin (gradient) stili hesapla

// Üst bölüm için zemin (gradient) stili hesapla
function getTopStyle(doluluk: TakvimData['odaTipleri'][0]['dolulukTarihleri'][0]): Record<string, string> {
  if (!doluluk.dolu) return {};
  const doluSayisi = doluluk.konaklamaDetaylari.length
  const bosSayisi = doluluk.bosYatakSayisi
  const gradientColor = calculateGradientColor(bosSayisi, doluSayisi)
  return {
    backgroundColor: gradientColor,
    background: `${gradientColor} !important`,
    backgroundImage: `linear-gradient(135deg, ${gradientColor} 0%, ${gradientColor}dd 100%) !important`
  }
}

// Alt bölüm için zemin (gradient) stili hesapla (R>0 ise K değerine göre)
function getBottomStyle(doluluk: DolulukCell): Record<string, string> {
  const r = Number(doluluk?.rezervasyonSayisi || 0)
  if (r <= 0) {
    // Sayfa zemini ile aynı: şeffaf bırak
    return { background: 'transparent' }
  }
  const k = Number(doluluk?.toplamBosEksiRez || 0)
  const d = Number(Array.isArray(doluluk?.konaklamaDetaylari) ? doluluk.konaklamaDetaylari.length : 0)
  // Kapasiteyi üst bölümdeki hesap mantığına benzer şekilde tahmin etmek için B+ D = kapasite varsayımı
  const b = Number(doluluk?.bosYatakSayisi || 0)
  const kapasite = Math.max(1, b + d) // 0 bölmeye karşı koruma
  // K, yeni boşluk sayısı olarak kabul edilir; dolu = kapasite - K
  const yeniDolu = Math.max(0, kapasite - k)
  const renk = calculateGradientColor(k, yeniDolu)
  return {
    backgroundColor: renk,
    background: `${renk} !important`,
    backgroundImage: `linear-gradient(135deg, ${renk} 0%, ${renk}dd 100%) !important`
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

  async function refreshAll() {
    try {
      syncing.value = true
      Notify.create({ type: 'info', message: 'HOTEL RUNNER Portalından Rezervasyonlar Sorgulanıyor...', position: 'top', timeout: 1200 })
      await syncHotelRunnerForCurrentWindow()
    } finally {
      // Veriyi yenile
      await loadTakvimData()
      // Tooltipleri zorla yeniden oluştur
      tooltipKey.value++
      // Boş odalar tooltip cache'ini temizle ve tüm oda tipleri için yeniden yüklemeye izin ver
      bosOdalarCache.value = {}
      bosOdalarLoading.value = {}
      Notify.create({ type: 'positive', message: 'Takvim güncellendi', position: 'top', timeout: 1000 })
      syncing.value = false
    }
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
  padding: 1.13rem;
  width: 135px;
  border-right: 1px solid #e0e0e0; /* Tarih sütunu ile arasında border */
  border-bottom: 2px solid rgba(224, 224, 224, 0.6); /* Satırlar arası daha belirgin border */
  cursor: pointer; /* Tooltip hedefinde el işareti */
}

/* Boş odalar tooltip içerik stilleri */


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
  height: 74px !important; /* Satır yüksekliği azaltıldı */
  border: none; /* Border kaldırıldı */
  border-bottom: 2px solid rgba(224, 224, 224, 0.6); /* Satırlar arası daha belirgin border */
  box-shadow: 0 0 0 1px rgba(224, 224, 224, 0.5); /* Border yerine shadow */
  padding: 0;
  position: relative;
  box-sizing: border-box;
  background: transparent !important; /* Hücre zemini tamamen şeffaf */
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
  background: transparent !important;
}

.hucre-content {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
  gap: 0;
  height: 100%;
  width: 100%;
  background: transparent !important;
}

.cell-top,
.cell-bottom {
  width: 100%;
  height: 50%;
  display: flex;
  flex-direction: column; /* D/B ve R/T ayrı satırlarda */
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.cell-top {
  display: grid;
  grid-template-rows: 1fr 1fr; /* D ve B ayrı satırlar */
  place-items: center;
}

.cell-bottom {
  background: transparent !important; /* kesinlikle zemin yok */
  border-top: 2px solid rgba(0, 0, 0, 0.37); /* Üst ve alt bölüm arasına daha belirgin çizgi */
}

.dolu-sayisi {
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  opacity: 0.85;
  width: 100%;
}

.bos-sayisi {
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1;
  text-align: center;
  opacity: 1;
  width: 100%;
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
  width: 640px !important; /* Sabit genişlik */
  min-width: 640px !important;
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

/* Rezervasyonlar arasında ince ayırıcı çizgi */
.tooltip-item:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 6px;
  margin-bottom: 6px;
}

.tooltip-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.65rem;
  line-height: 1.2;
}

.nowrap {
  white-space: nowrap;
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
  color: #263238;
  font-size: 0.78rem;
  font-weight: 700;
  opacity: 1;
  line-height: 1;
  text-align: center;
}

.toplam-sayisi {
  color: #263238;
  font-size: 0.78rem;
  font-weight: 800;
  opacity: 1;
  line-height: 1;
  text-align: center;
}

/* K kritik (K < 10) olduğunda kırmızıya boya */
.k-critical {
  color: #eff532 !important;
  font-weight: 900 !important;
}

/* Nötr sınıf daha baskın olduğundan özgüllüğü artır */
.neutral-stat.k-critical {
  color: #eff532 !important;
  font-weight: 900 !important;
}

.body--dark .neutral-stat.k-critical {
  color: #eff532 !important; /* dark mod için daha canlı kırmızı */
  text-shadow: 0 1px 2px rgba(0,0,0,0.8) !important;
  font-weight: 900 !important;
}

/* R ve T satırlarını D/B renklendirmesinden muaf tutmak için nötr tema */
.neutral-stat {
  opacity: 1 !important;
  color: #3d39a1 !important; /* daha koyu sarı */
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.35) !important;
  filter: none !important;
  mix-blend-mode: normal !important;
  font-weight: 300;
}

/* Dark mode'da R/T metinlerini belirginleştir */
.body--dark .neutral-stat {
  color: #3d39a1 !important; /* daha koyu sarı */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85) !important; /* koyu zeminde okunabilirlik */
  font-weight: 300;
}

/* Koyu zemin varyantı kaldırıldı; R/T her zaman sayfa zemininde görünecek */

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
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) !important; /* Dark mode için açık shadow */
  border-bottom: 2px solid rgba(255, 255, 255, 0.25) !important; /* Dark mode için daha belirgin border */
  background: transparent !important; /* dark modda da zemin yok */
}

.body--dark .oda-tipi-cell {
  border-bottom: 2px solid rgba(255, 255, 255, 0.25); /* Dark mode için daha belirgin border */
}

/* Dark mode'da üst-alt bölüm ayracı görünür olsun */
.body--dark .cell-bottom {
  border-top: 2px solid rgba(255, 255, 255, 0.39);
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

