<template>
  <q-page class="q-pa-md">
    <div class="top-row-container">
      <div class="time-period-container">
        <q-card class="time-period-card">
          <q-card-section class="time-period-section row items-center no-wrap">
            <div class="date-input-section">
              <q-input
                v-model="customStartDate"
                label="Başlangıç Tarihi"
                dense
                outlined
                readonly
                style="width: 160px;"
                class="q-mr-md"
              >
                <template v-slot:append>
                  <q-icon 
                    v-if="customStartDate" 
                    name="close" 
                    @click="clearCustomDate" 
                    class="cursor-pointer text-negative"
                  />
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy ref="datePopup" cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="customStartDate"
                        mask="DD.MM.YYYY"
                        format="DD.MM.YYYY"
                        :options="dateOptions"
                        @update:model-value="onCustomDateSelected"
                      />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="time-period-buttons">
              <q-btn 
                v-for="p in timePeriods" 
                :key="p.value" 
                :label="p.label" 
                :class="{ 'time-btn-active': p.selected && !customStartDate }" 
                dense 
                outline
                rounded
                @click="selectPeriod(p.value)" 
                :disable="!!customStartDate"
                class="time-period-btn"
              />
            </div>
            
            <!-- 🆕 İşlem Tipi Switch Butonu -->
            <q-btn-toggle
              v-model="islemTipMode"
              :options="[
                { label: 'Giren/Çıkan', value: 'kasa' },
                { label: 'GELİR/GİDER', value: 'cari' }
              ]"
              spread
              push
              glossy
              no-caps
              toggle-color="green-7"
              color="grey-3"
              text-color="grey-6"
              class="filter-switch-btn q-ml-xl"
              @update:model-value="onIslemTipModeChange"
            />
            
            <q-space />
            
            <div class="period-net-info">{{ periodNetText }}</div>
            <q-btn
              label="YENİLE"
              icon="refresh"
              dense
              color="primary"
              @click="refreshData"
              class="q-ml-lg refresh-btn"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Ana Row: Sol sütun (Transfer + Tablo) ve Sağ sütun (Grafikler) -->
    <div class="row items-start q-gutter-md q-mt-md" style="position: relative;">
      <!-- Loading overlay -->
      <div v-if="isLoading" class="loading-overlay">
        <q-spinner-dots color="primary" size="60px" />
      </div>

      <!-- Sol Sütun: Kasalar Arası Aktarım + Veri Tablosu -->
      <div class="left-column-wrapper half-width">
        <!-- Kasalar Arası Aktarım Bölümü -->
        <q-card class="transfer-card">
          <q-card-section class="transfer-header-section">
            <div class="transfer-header-content">
              <div class="transfer-title-centered">Kasalar Arası Aktarım</div>
              <q-btn 
                icon="refresh" 
                @click="loadKasaBakiyeleri" 
                flat 
                round 
                dense
                color="primary"
                size="sm"
              >
                <q-tooltip>Bakiyeleri Yenile</q-tooltip>
              </q-btn>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="transfer-card-section">
            <div class="transfer-container-with-balances">
              <!-- Bakiye Etiketleri -->
              <div class="balance-chips">
                <q-chip 
                  color="green-7" 
                  text-color="white" 
                  dense
                  class="balance-chip"
                >
                  Nakit: {{ formatTL(kasaBakiyeleri.nakit) }}
                </q-chip>
                <q-chip 
                  color="blue-7" 
                  text-color="white" 
                  dense
                  class="balance-chip"
                >
                  Kart: {{ formatTL(kasaBakiyeleri.kart) }}
                </q-chip>
                <q-chip 
                  color="orange-7" 
                  text-color="white" 
                  dense
                  class="balance-chip"
                >
                  Banka: {{ formatTL(kasaBakiyeleri.eft) }}
                </q-chip>
                <q-chip 
                  color="purple-7" 
                  text-color="white" 
                  dense
                  class="balance-chip"
                >
                  Acenta: {{ formatTL(kasaBakiyeleri.acenta) }}
                </q-chip>
              </div>
              <!-- Transfer Formu -->
              <div class="transfer-grid">
              <q-select 
                v-model="transferForm.veren" 
                :options="kasaOptions"
                label="Veren Kasa"
                outlined 
                dense 
                emit-value
                map-options
                class="transfer-select"
              />
              <q-input 
                v-model="transferForm.tutar" 
                label="Aktarılacak Tutar"
                outlined 
                dense 
                type="number"
                class="transfer-input"
              />
              <q-select 
                v-model="transferForm.alan" 
                :options="kasaOptions"
                label="Alan Kasa"
                outlined 
                dense 
                emit-value
                map-options
                class="transfer-select"
              />
              <div class="transfer-button-group">
                <q-btn 
                  color="primary" 
                  label="AKTAR" 
                  @click="performTransfer"
                  class="transfer-button-half"
                  size="md"
                  :disable="!transferForm.veren || !transferForm.alan || !transferForm.tutar"
                />
                <q-btn 
                  color="secondary" 
                  label="TEMİZLE" 
                  @click="clearTransferForm"
                  class="transfer-button-half"
                  size="md"
                  outline
                />
              </div>
            </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Veri Tablosu -->
        <q-card class="q-mt-md" :class="{ 'loading-blur': isLoading }">
          <!-- Bar Navigasyon Butonları -->
          <q-card-section class="q-pa-sm">
            <div class="bar-navigation">
              <q-btn 
                icon="chevron_left" 
                flat 
                dense 
                round
                color="primary"
                size="sm"
                :disable="activeBarIndex <= 0 || isLoading"
                @click="navigateToPreviousBar"
              >
                <q-tooltip>Önceki Dönem</q-tooltip>
              </q-btn>
              <div class="bar-label-text">{{ currentBarLabel }}</div>
              <q-btn 
                icon="chevron_right" 
                flat 
                dense 
                round
                color="primary"
                size="sm"
                :disable="activeBarIndex >= seriData.length - 1 || isLoading"
                @click="navigateToNextBar"
              >
                <q-tooltip>Sonraki Dönem</q-tooltip>
              </q-btn>
            </div>
          </q-card-section>
          
          <q-separator />
          
          <q-table
            :rows="rows"
            :columns="columns"
            row-key="grup"
            dense
            flat
            bordered
            separator="cell"
            hide-bottom
            :pagination="{ rowsPerPage: 0 }"
            @row-dblclick="onRowDoubleClick"
          >
            <template v-slot:header-cell-gelirToplam="props">
              <q-th :props="props"><span class="total-header">{{ props.col.label }}</span></q-th>
            </template>
            <template v-slot:header-cell-giderToplam="props">
              <q-th :props="props"><span class="total-header">{{ props.col.label }}</span></q-th>
            </template>
          </q-table>
        </q-card>
      </div>

      <!-- Sağ Sütun: Bar ve Pie Grafikler -->
      <q-card class="chart-card grow-card" :class="{ 'loading-blur': isLoading }">
        <q-card-section class="chart-section">
          <div class="chart-container">
            <canvas ref="barChart"></canvas>
          </div>
          <div class="pie-row q-mt-md">
            <div class="pie-container">
              <canvas ref="pieGelir"></canvas>
            </div>
            <div class="pie-container">
              <canvas ref="pieGider"></canvas>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- İşlem Detayları Modal -->
    <q-dialog v-model="showDetailModal" position="standard" maximized>
      <q-card class="modal-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedGrupName }} - İşlem Detayları</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-table
            :rows="detailRows"
            :columns="detailColumns"
            row-key="islemNo"
            dense
            flat
            bordered
            separator="cell"
            hide-bottom
            :pagination="{ rowsPerPage: 0 }"
            :loading="detailLoading"
            loading-label="Veriler yükleniyor..."
          >
            <template v-slot:body-cell-islemTutar="props">
              <q-td :props="props">
                {{ formatTL(Number(props.value || 0)) }}
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../boot/axios'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title, ArcElement, PieController } from 'chart.js'
import type { Plugin, LegendItem, ChartDataset, ChartEvent, ActiveElement } from 'chart.js'
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title, ArcElement, PieController)

type Row = { gelirGrup?: string; gelirToplam?: number; giderGrup?: string; giderToplam?: number; grup: string }

type DetailRow = {
  iKytTarihi: string
  islemKllnc: string
  islemArac: string
  islemTip: string
  islemGrup: string
  islemAltG: string
  islemBilgi: string
  islemMiktar: number
  islemTutar: number
}

const $q = useQuasar()
// Dark modda legend metinleri açık gri olsun
const legendColor = $q.dark.isActive ? '#e0e0e0' : '#222222'

// Legend metin rengini global de varsayılan yap (bazı generateLabels senaryolarında daha etkili)
Chart.defaults.plugins.legend.labels.color = legendColor as unknown as string

const timePeriods = ref([
  { value: 'gunler', label: 'GÜNLER', selected: true },
  { value: 'haftalar', label: 'HAFTALAR', selected: false },
  { value: 'aylar', label: 'AYLAR', selected: false },
  { value: 'ceyrekler', label: 'ÇEYREKLER', selected: false },
  { value: 'yari', label: 'YARI YILLAR', selected: false },
  { value: 'yillar', label: 'YILLAR', selected: false },
])

// 🆕 İşlem Tipi Modu (default: kasa - Giren/Çıkan)
const islemTipMode = ref<'kasa' | 'cari'>('kasa')

const rows = ref<Row[]>([])
const netToplam = ref(0)
const periodNetText = ref('')
const customStartDate = ref('')
const isLoading = ref(false)

// Kasalar arası aktarım formu
const transferForm = ref({
  veren: '',
  alan: '',
  tutar: ''
})

// Kasalar arası aktarım yetkisi kontrolü
// Püf Nokta: Sadece HARUN ve SAadmin kullanıcıları kasalar arası aktarım yapabilir
const canTransferBetweenKasalar = computed(() => {
  const username = localStorage.getItem('username') || '';
  return ['HARUN', 'SAadmin'].includes(username);
})

// Kasa seçenekleri
const kasaOptions = [
  { label: 'Nakit', value: 'nakit' },
  { label: 'Kart', value: 'kart' },
  { label: 'EFT', value: 'eft' },
  { label: 'Acenta', value: 'acenta' }
]

// Kasa bakiyeleri
const kasaBakiyeleri = ref({
  nakit: 0,
  kart: 0,
  eft: 0,
  acenta: 0
})

// 🆕 Bar navigasyon için state
const activeBarIndex = ref(11) // Default: Son bar (12. bar)
const seriData = ref<Array<{ label: string; gelir: number; gider: number; dateISO?: string }>>([])
const currentBarLabel = ref('')

// 🔄 Dinamik sütun tanımları
const columns = computed<QTableColumn<Row>[]>(() => {
  const gelirLabel = islemTipMode.value === 'kasa' ? 'GİRENLER' : 'GELİRLER'
  const giderLabel = islemTipMode.value === 'kasa' ? 'ÇIKANLAR' : 'GİDERLER'
  
  return [
    { name: 'gelirGrup', label: gelirLabel, field: 'gelirGrup', align: 'left', headerAlign: 'center' as const, classes: 'narrow-col-85', headerClasses: 'narrow-col-85 grid-header' },
    { name: 'gelirToplam', label: 'Toplam', field: 'gelirToplam', align: 'right', headerAlign: 'center' as const, classes: 'narrow-col', headerClasses: 'narrow-col grid-header', format: (val: unknown) => formatTLBlankZero(Number(val || 0)) },
    { name: 'giderGrup', label: giderLabel, field: 'giderGrup', align: 'left', headerAlign: 'center' as const, classes: 'narrow-col-85', headerClasses: 'narrow-col-85 grid-header' },
    { name: 'giderToplam', label: 'Toplam', field: 'giderToplam', align: 'right', headerAlign: 'center' as const, classes: 'narrow-col', headerClasses: 'narrow-col grid-header', format: (val: unknown) => formatTLBlankZero(Number(val || 0)) },
  ]
})

// Modal için değişkenler
const showDetailModal = ref(false)
const detailRows = ref<DetailRow[]>([])
const detailLoading = ref(false)
const selectedGrupName = ref('')

// Detail modal sütun tanımları
const detailColumns = ref<QTableColumn<DetailRow>[]>([
  { name: 'iKytTarihi', label: 'Kayıt Tarihi', field: 'iKytTarihi', align: 'left', sortable: true },
  { name: 'islemKllnc', label: 'Kullanıcı', field: 'islemKllnc', align: 'left', sortable: true },
  { name: 'islemArac', label: 'Araç', field: 'islemArac', align: 'left', sortable: true },
  { name: 'islemTip', label: 'Tip', field: 'islemTip', align: 'center', sortable: true },
  { name: 'islemGrup', label: 'Grup', field: 'islemGrup', align: 'left', sortable: true },
  { name: 'islemAltG', label: 'Alt Grup', field: 'islemAltG', align: 'left', sortable: true },
  { name: 'islemBilgi', label: 'Bilgi', field: 'islemBilgi', align: 'left', sortable: true, style: 'max-width: 200px; overflow: hidden; text-overflow: ellipsis;' },
  { name: 'islemMiktar', label: 'Miktar', field: 'islemMiktar', align: 'right', sortable: true },
  { name: 'islemTutar', label: 'Tutar', field: 'islemTutar', align: 'right', sortable: true },
])

function getPeriodDates(): { start: string; end: string } {
  const format = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}.${mm}.${yyyy}`
  }

  // Custom tarih varsa, o tarihi baz al
  if (customStartDate.value) {
    const [day, month, year] = customStartDate.value.split('.').map(Number)
    const customDate = new Date(year, month - 1, day)
    const endDate = new Date(customDate)
    endDate.setDate(customDate.getDate() + 11)
    return { start: format(customDate), end: format(endDate) }
  }

  // Normal period seçimi
  const today = new Date()
  const selected = timePeriods.value.find(p => p.selected)?.value || 'gunler'
  const start = new Date(today)
  switch (selected) {
    case 'gunler':
      start.setDate(today.getDate() - 11)
      break
    case 'haftalar':
      start.setDate(today.getDate() - 7 * 11)
      break
    case 'aylar':
      start.setMonth(today.getMonth() - 11)
      break
    case 'ceyrekler':
      start.setMonth(today.getMonth() - 3 * 11)
      break
    case 'yari':
      start.setMonth(today.getMonth() - 6 * 11)
      break
    case 'yillar':
      start.setFullYear(today.getFullYear() - 11)
      break
    default:
      start.setDate(today.getDate() - 11)
  }
  return { start: format(start), end: format(today) }
}

// Period label'dan başlangıç tarihi hesapla
function getPeriodStartDate(label: string, period: string): string {
  const format = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}.${mm}.${yyyy}`
  }

  const today = new Date()
  
  switch (period) {
    case 'aylar':
      // "MM.YYYY" formatından başlangıç tarihi (örn: "09.2024")
      if (label.includes('.')) {
        const [monthStr, yearStr] = label.split('.')
        const month = parseInt(monthStr) - 1 // JavaScript'te ay 0-11 arası
        const year = parseInt(yearStr)
        if (!isNaN(month) && !isNaN(year)) {
          return format(new Date(year, month, 1))
        }
      }
      break
      
    case 'ceyrekler':
      // "Q4.2022" formatından başlangıç tarihi
      if (label.startsWith('Q')) {
        const [quarterPart, yearStr] = label.split('.')
        const quarter = parseInt(quarterPart.substring(1)) // "Q4" -> 4
        const year = parseInt(yearStr)
        if (!isNaN(quarter) && !isNaN(year)) {
          const startMonth = (quarter - 1) * 3
          return format(new Date(year, startMonth, 1))
        }
      }
      break
      
    case 'yari':
      // "Y1.2020" formatından başlangıç tarihi
      if (label.startsWith('Y')) {
        const [halfPart, yearStr] = label.split('.')
        const half = parseInt(halfPart.substring(1)) // "Y1" -> 1
        const year = parseInt(yearStr)
        if (!isNaN(half) && !isNaN(year)) {
          const startMonth = (half - 1) * 6
          return format(new Date(year, startMonth, 1))
        }
      }
      break
      
    case 'yillar': {
      // "2014" formatından başlangıç tarihi
      const year = parseInt(label)
      if (!isNaN(year)) {
        return format(new Date(year, 0, 1))
      }
      break
    }
  }
  
  // Varsayılan olarak bugünden 11 period öncesi
  const start = new Date(today)
  switch (period) {
    case 'aylar':
      start.setMonth(today.getMonth() - 11)
      break
    case 'ceyrekler':
      start.setMonth(today.getMonth() - 3 * 11)
      break
    case 'yari':
      start.setMonth(today.getMonth() - 6 * 11)
      break
    case 'yillar':
      start.setFullYear(today.getFullYear() - 11)
      break
    default:
      start.setDate(today.getDate() - 11)
  }
  return format(start)
}

// Period label'dan bitiş tarihi hesapla
function getPeriodEndDate(label: string, period: string): string {
  const format = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}.${mm}.${yyyy}`
  }

  const today = new Date()
  
  switch (period) {
    case 'aylar':
      // "MM.YYYY" formatından bitiş tarihi (örn: "08.2025")
      if (label.includes('.')) {
        const [monthStr, yearStr] = label.split('.')
        const month = parseInt(monthStr) - 1 // JavaScript'te ay 0-11 arası
        const year = parseInt(yearStr)
        if (!isNaN(month) && !isNaN(year)) {
          const lastDay = new Date(year, month + 1, 0).getDate()
          return format(new Date(year, month, lastDay))
        }
      }
      break
      
    case 'ceyrekler':
      // "Q3.2025" formatından bitiş tarihi
      if (label.startsWith('Q')) {
        const [quarterPart, yearStr] = label.split('.')
        const quarter = parseInt(quarterPart.substring(1)) // "Q3" -> 3
        const year = parseInt(yearStr)
        if (!isNaN(quarter) && !isNaN(year)) {
          const endMonth = quarter * 3 - 1
          const lastDay = new Date(year, endMonth + 1, 0).getDate()
          return format(new Date(year, endMonth, lastDay))
        }
      }
      break
      
    case 'yari':
      // "Y2.2025" formatından bitiş tarihi
      if (label.startsWith('Y')) {
        const [quarterPart, yearStr] = label.split('.')
        const half = parseInt(quarterPart.substring(1)) // "Y2" -> 2
        const year = parseInt(yearStr)
        if (!isNaN(half) && !isNaN(year)) {
          const endMonth = half * 6 - 1
          const lastDay = new Date(year, endMonth + 1, 0).getDate()
          return format(new Date(year, endMonth, lastDay))
        }
      }
      break
      
    case 'yillar': {
      // "2025" formatından bitiş tarihi
      const year = parseInt(label)
      if (!isNaN(year)) {
        return format(new Date(year, 11, 31))
      }
      break
    }
  }
  
  // Varsayılan olarak bugün
  return format(today)
}

const barChart = ref<HTMLCanvasElement | null>(null)
let barInstance: Chart | null = null
const pieGelir = ref<HTMLCanvasElement | null>(null)
const pieGider = ref<HTMLCanvasElement | null>(null)
let pieGelirInstance: Chart | null = null
let pieGiderInstance: Chart | null = null
const datePopup = ref<{ hide: () => void } | null>(null)

// 🆕 Bar'ın tarih aralığını hesapla
function getBarDateRange(bar: { label: string; dateISO?: string }): { start: string; end: string } {
  const currentPeriod = customStartDate.value ? 'gunler' : (timePeriods.value.find(p => p.selected)?.value || 'gunler')
  const label = bar.label
  
  let barStartDate = ''
  let barEndDate = ''
  
  if (label.includes('-')) {
    // Haftalık format: "DD.MM-DD.MM"
    const [startPart, endPart] = label.split('-')
    const currentYear = new Date().getFullYear()
    barStartDate = `${startPart}.${currentYear}`
    barEndDate = `${endPart}.${currentYear}`
  } else if (label.includes('.')) {
    // AYLAR, ÇEYREKLER, YARI YILLAR için
    if (currentPeriod === 'aylar' || currentPeriod === 'ceyrekler' || currentPeriod === 'yari' || currentPeriod === 'yillar') {
      barStartDate = getPeriodStartDate(label, currentPeriod)
      barEndDate = getPeriodEndDate(label, currentPeriod)
    } else if (label.split('.').length === 2) {
      // Günlük format: "DD.MM"
      const currentYear = new Date().getFullYear()
      barStartDate = `${label}.${currentYear}`
      barEndDate = `${label}.${currentYear}`
    } else {
      // "DD.MM.YYYY" formatı
      barStartDate = label
      barEndDate = label
    }
  } else {
    // YILLAR için
    barStartDate = getPeriodStartDate(label, currentPeriod)
    barEndDate = getPeriodEndDate(label, currentPeriod)
  }
  
  return { start: barStartDate, end: barEndDate }
}

// 🆕 Belirli bir tarihi içeren bar'ın index'ini bul
function findBarIndexContainingDate(seri: Array<{ label: string; gelir: number; gider: number; dateISO?: string }>, targetDate: string): number {
  // targetDate: "DD.MM.YYYY" formatında
  const [day, month, year] = targetDate.split('.').map(Number)
  const target = new Date(year, month - 1, day)
  
  for (let i = 0; i < seri.length; i++) {
    const bar = seri[i]
    const { start, end } = getBarDateRange(bar)
    
    // Start ve end tarihlerini Date objesine çevir
    const [startDay, startMonth, startYear] = start.split('.').map(Number)
    const [endDay, endMonth, endYear] = end.split('.').map(Number)
    const startDate = new Date(startYear, startMonth - 1, startDay)
    const endDate = new Date(endYear, endMonth - 1, endDay)
    
    // Target tarih bu aralıkta mı?
    if (target >= startDate && target <= endDate) {
      return i
    }
  }
  
  return -1 // Bulunamadı
}

async function loadData() {
  isLoading.value = true
  
  try {
    const { end } = getPeriodDates()
    
    console.log('🔍 [Frontend loadData] islemTipMode:', islemTipMode.value)
    
    // 12 dilimlik seri verisi (seçilen period veya custom tarih için günler)
    const currentPeriod = customStartDate.value ? 'gunler' : (timePeriods.value.find(p => p.selected)?.value || 'gunler')
    const seriResp = await api.get('/islem/kar-zarar-seri', { params: { period: currentPeriod, end, islemTipMode: islemTipMode.value }})
    const seri = (seriResp?.data?.data || []) as Array<{ label: string; gelir: number; gider: number; dateISO?: string }>
    
    // Seri verisini sakla
    seriData.value = seri
    
    // Aktif bar index'i ayarla
    if (seri.length > 0) {
      if (customStartDate.value) {
        // Başlangıç tarihi seçilmişse, o tarihi içeren bar'ı bul
        const targetIndex = findBarIndexContainingDate(seri, customStartDate.value)
        activeBarIndex.value = targetIndex >= 0 ? targetIndex : seri.length - 1
      } else {
        // Başlangıç tarihi yoksa, son bar default
        activeBarIndex.value = seri.length - 1
      }
    }
    
    // Bar chart'ı güncelle
    updateBarChartSeri(seri)
    
    // Aktif bar için tablo verisini yükle
    await loadTableDataForBar(activeBarIndex.value)
  } finally {
    isLoading.value = false
  }
}

// 🆕 Belirli bir bar için tablo verilerini yükle
async function loadTableDataForBar(barIndex: number) {
  if (!seriData.value || seriData.value.length === 0 || barIndex < 0 || barIndex >= seriData.value.length) {
    return
  }
  
  const bar = seriData.value[barIndex]
  currentBarLabel.value = bar.label
  
  // Bar'ın tarih aralığını hesapla
  const { start: barStartDate, end: barEndDate } = getBarDateRange(bar)
  
  console.log('🔍 [loadTableDataForBar] barIndex:', barIndex, '| label:', bar.label, '| dateRange:', barStartDate, '-', barEndDate)
  
  // O bar için özet verisini çek
  const { data } = await api.get('/islem/kar-zarar-ozet', { 
    params: { 
      start: barStartDate, 
      end: barEndDate, 
      islemTipMode: islemTipMode.value 
    } 
  })
  
  const gelir = (data?.data?.gelir || []) as Array<{ islemGrup: string; toplam: number }>
  const gider = (data?.data?.gider || []) as Array<{ islemGrup: string; toplam: number }>
  
  const maxLen = Math.max(gelir.length, gider.length)
  const result: Row[] = []
  for (let i = 0; i < maxLen; i++) {
    result.push({
      grup: `${i}`,
      gelirGrup: gelir[i]?.islemGrup || '',
      gelirToplam: gelir[i]?.toplam || 0,
      giderGrup: gider[i]?.islemGrup || '',
      giderToplam: gider[i]?.toplam || 0,
    })
  }
  
  // Sıfır toplamlı satırları gizle
  rows.value = result.filter(r => (Number(r.gelirToplam) || 0) > 0 || (Number(r.giderToplam) || 0) > 0)
  
  // Başlıklarda toplamları göster
  const gelirSum = result.reduce((acc, r) => acc + (Number(r.gelirToplam) || 0), 0)
  const giderSum = result.reduce((acc, r) => acc + (Number(r.giderToplam) || 0), 0)
  netToplam.value = gelirSum - giderSum
  
  periodNetText.value = `${barStartDate} - ${barEndDate} ${netToplam.value >= 0 ? 'KAZANÇ' : 'ZARAR'}: ${formatTL(Math.abs(netToplam.value))}`
  const gelirCol = columns.value.find(c => c.name === 'gelirToplam')
  const giderCol = columns.value.find(c => c.name === 'giderToplam')
  if (gelirCol) gelirCol.label = formatTL(gelirSum)
  if (giderCol) giderCol.label = formatTL(giderSum)
  
  // Pie chart'ları güncelle
  updatePieCharts(gelir, gider)
}

function selectPeriod(v: string) {
  if (customStartDate.value) return // Custom tarih varken period seçimi devre dışı
  timePeriods.value.forEach(p => (p.selected = p.value === v))
  void loadData()
}

const refreshData = () => {
  void loadData()
}

// 🆕 İşlem tipi modu değiştiğinde veriyi yenile
const onIslemTipModeChange = () => {
  void loadData()
}

// 🆕 Önceki bar'a git
const navigateToPreviousBar = async () => {
  if (activeBarIndex.value > 0) {
    activeBarIndex.value--
    updateBarChartSeri(seriData.value) // Önce chart'ı güncelle (aktif bar rengi için)
    await loadTableDataForBar(activeBarIndex.value)
  }
}

// 🆕 Sonraki bar'a git
const navigateToNextBar = async () => {
  if (activeBarIndex.value < seriData.value.length - 1) {
    activeBarIndex.value++
    updateBarChartSeri(seriData.value) // Önce chart'ı güncelle (aktif bar rengi için)
    await loadTableDataForBar(activeBarIndex.value)
  }
}

// Tarih seçimi için date options
function dateOptions(date: string) {
  const today = new Date()
  const maxDate = new Date(today)
  maxDate.setDate(today.getDate() - 12) // En fazla 12 gün öncesi
  
  const [year, month, day] = date.split('/').map(Number)
  const inputDate = new Date(year, month - 1, day)
  
  return inputDate <= maxDate
}

function onCustomDateSelected() {
  // Custom tarih seçildiğinde tüm period butonlarını deaktif et
  timePeriods.value.forEach(p => (p.selected = false))
  // Popup'ı kapat
  if (datePopup.value) {
    datePopup.value.hide()
  }
  void loadData()
}

function clearCustomDate() {
  customStartDate.value = ''
  // GÜNLER butonunu aktif et
  timePeriods.value.forEach(p => (p.selected = p.value === 'gunler'))
  void loadData()
}

// Grid satırına çift tıklama
function onRowDoubleClick(evt: Event, row: Row) {
  // Tıklanan sütunu tespit et
  const target = evt.target as HTMLElement
  const cell = target.closest('td')
  if (!cell) return
  
  const cellIndex = Array.from(cell.parentElement?.children || []).indexOf(cell)
  
  let grupName = ''
  let islemTip = ''
  
  // 1. sütun (GELİRLER/GİRENLER) tıklandıysa
  if (cellIndex === 0 && row.gelirGrup) {
    grupName = row.gelirGrup
    islemTip = islemTipMode.value === 'kasa' ? 'Giren' : 'GELİR'
  }
  // 3. sütun (GİDERLER/ÇIKANLAR) tıklandıysa  
  else if (cellIndex === 2 && row.giderGrup) {
    grupName = row.giderGrup
    islemTip = islemTipMode.value === 'kasa' ? 'Çıkan' : 'GİDER'
  }
  
  if (!grupName) return
  
  selectedGrupName.value = `${grupName} (${islemTip})`
  void loadDetailData(grupName, islemTip)
  showDetailModal.value = true
}

// Detay verilerini yükle - Aktif bar'ın tarih aralığını kullan
async function loadDetailData(grupName: string, islemTip: string) {
  try {
    detailLoading.value = true
    
    // Aktif bar'ın tarih aralığını kullan
    let start = ''
    let end = ''
    
    if (seriData.value && seriData.value.length > 0 && activeBarIndex.value >= 0 && activeBarIndex.value < seriData.value.length) {
      const bar = seriData.value[activeBarIndex.value]
      const dateRange = getBarDateRange(bar)
      start = dateRange.start
      end = dateRange.end
    } else {
      // Fallback: Tüm period'un tarih aralığı
      const dates = getPeriodDates()
      start = dates.start
      end = dates.end
    }
    
    // Backend'den belirli grup ve işlem tipi için işlem kayıtlarını getir
    const response = await api.get('/islem/grup-detay', {
      params: {
        grup: grupName,
        islemTip,
        start,
        end
      }
    })
    
    detailRows.value = response.data?.data || []
    selectedGrupName.value = `${grupName} (${islemTip}) - ${start} / ${end} Dönemi`
  } catch (error) {
    console.error('Detay verileri yüklenirken hata:', error)
    detailRows.value = []
  } finally {
    detailLoading.value = false
  }
}

// Kasalar arası aktarım fonksiyonu
const performTransfer = async () => {
  // Yetki kontrolü - Sadece HARUN ve SAadmin aktarım yapabilir
  if (!canTransferBetweenKasalar.value) {
    const username = localStorage.getItem('username') || 'Bilinmeyen';
    $q.notify({
      type: 'negative',
      message: 'Kasalar arası aktarım yetkisi yok',
      caption: `${username} kullanıcısının bu işlemi yapma yetkisi yoktur. Sadece HARUN ve SAadmin kullanıcıları kasalar arası aktarım yapabilir.`,
      icon: 'lock',
      position: 'top',
      timeout: 5000
    });
    console.warn(`❌ Yetkisiz aktarım denemesi: ${username}`);
    return;
  }
  
  // Form validasyonu
  if (!transferForm.value.veren || !transferForm.value.alan || !transferForm.value.tutar) {
    $q.notify({
      type: 'warning',
      message: 'Lütfen tüm alanları doldurun',
      position: 'top',
      timeout: 3000
    });
    return;
  }
  
  const tutar = parseFloat(transferForm.value.tutar);
  if (isNaN(tutar) || tutar <= 0) {
    $q.notify({
      type: 'warning',
      message: 'Geçerli bir tutar girin',
      position: 'top',
      timeout: 3000
    });
    return;
  }
  
  if (transferForm.value.veren === transferForm.value.alan) {
    $q.notify({
      type: 'warning',
      message: 'Veren ve alan kasa aynı olamaz',
      position: 'top',
      timeout: 3000
    });
    return;
  }
  
  try {
    // Backend API çağrısı
    const response = await api.post('/islem/kasa-aktarimi', {
      veren: transferForm.value.veren,
      alan: transferForm.value.alan,
      tutar: tutar
    });
    
    if (response.data.success) {
      // Form temizle
      transferForm.value.veren = '';
      transferForm.value.alan = '';
      transferForm.value.tutar = '';
      
      // Verileri yenile
      refreshData();
      
      // Kasa bakiyelerini yenile
      void loadKasaBakiyeleri();
      
      // Başarı mesajı göster
      $q.notify({
        type: 'positive',
        message: response.data.message || 'Kasa aktarımı başarıyla tamamlandı',
        position: 'top',
        timeout: 5000
      });
    } else {
      $q.notify({
        type: 'negative',
        message: response.data.message || 'Kasa aktarımı başarısız!',
        position: 'top',
        timeout: 8000
      });
    }
  } catch (error) {
    console.error('❌ Aktarım hatası:', error);
    $q.notify({
      type: 'negative',
      message: 'Kasa aktarımı sırasında hata oluştu',
      position: 'top',
      timeout: 5000
    });
  }
}

// Transfer formu temizleme fonksiyonu
const clearTransferForm = () => {
  transferForm.value.veren = '';
  transferForm.value.alan = '';
  transferForm.value.tutar = '';
}

// Güncel kasa bakiyelerini yükle
const loadKasaBakiyeleri = async () => {
  try {
    // Nakit bakiye
    const nakitResponse = await api.get('/islem/guncel-bakiye', {
      params: { islemArac: 'nakit', islemTip: 'Giren' }
    });
    if (nakitResponse.data.success) {
      kasaBakiyeleri.value.nakit = nakitResponse.data.bakiye || 0;
    }

    // Kart bakiye
    const kartResponse = await api.get('/islem/guncel-bakiye', {
      params: { islemArac: 'kart', islemTip: 'Giren' }
    });
    if (kartResponse.data.success) {
      kasaBakiyeleri.value.kart = kartResponse.data.bakiye || 0;
    }

    // EFT bakiye
    const eftResponse = await api.get('/islem/guncel-bakiye', {
      params: { islemArac: 'eft', islemTip: 'Giren' }
    });
    if (eftResponse.data.success) {
      kasaBakiyeleri.value.eft = eftResponse.data.bakiye || 0;
    }

    // Acenta bakiye
    const acentaResponse = await api.get('/islem/guncel-bakiye', {
      params: { islemArac: 'acenta', islemTip: 'Giren' }
    });
    if (acentaResponse.data.success) {
      kasaBakiyeleri.value.acenta = acentaResponse.data.bakiye || 0;
    }
  } catch (error) {
    console.error('❌ Kasa bakiyeleri yükleme hatası:', error);
  }
}

onMounted(() => { 
  void loadData();
  void loadKasaBakiyeleri();
})

function formatTL(value: number): string {
  const n = Number.isFinite(value) ? Math.trunc(value) : 0
  return `₺ ${n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatTLBlankZero(value: number): string {
  if (!value || value <= 0) return ''
  return formatTL(value)
}

function formatK(val: number): string {
  const n = Math.trunc(val)
  if (n >= 1000) return `${Math.round(n / 1000)}K`
  return `${n}`
}

function updateBarChartSeri(
  seri: Array<{ label: string; gelir: number; gider: number }>
) {
  const labels = seri.map(s => s.label)
  const gelirData = seri.map(s => Math.trunc(Number(s.gelir || 0)))
  const giderData = seri.map(s => Math.trunc(Number(s.gider || 0)))

  if (barInstance) {
    barInstance.destroy()
    barInstance = null
  }
  if (!barChart.value) return

  // Etiket yazdırma plugin'i
  const valueLabelsPlugin: Plugin<'bar'> = {
    id: 'valueLabels',
    afterDatasetsDraw: (chart) => {
      const ctx = chart.ctx
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.font = '12px sans-serif'
      const metaGelir = chart.getDatasetMeta(0)
      const metaGider = chart.getDatasetMeta(1)
      metaGelir.data.forEach((el, i) => {
        if (labels[i] === '' || gelirData[i] == null) return
        const val = Number(gelirData[i] || 0)
        const label = formatK(val)
        const pt = el as unknown as { x: number; y: number }
        ctx.fillStyle = '#2e7d32'
        ctx.fillText(label, pt.x, pt.y - 4)
      })
      metaGider.data.forEach((el, i) => {
        if (labels[i] === '' || giderData[i] == null) return
        const val = Number(giderData[i] || 0)
        const label = formatK(val)
        const pt = el as unknown as { x: number; y: number }
        ctx.fillStyle = '#c62828'
        ctx.fillText(label, pt.x, pt.y - 4)
      })
      ctx.restore()
    }
  }
  
  // 🔄 Dinamik label'lar
  const gelirLabel = islemTipMode.value === 'kasa' ? 'GİREN' : 'GELİR'
  const giderLabel = islemTipMode.value === 'kasa' ? 'ÇIKAN' : 'GİDER'
  
  barInstance = new Chart(barChart.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: gelirLabel, data: gelirData, backgroundColor: '#2e7d32', barPercentage: 0.9, categoryPercentage: 0.85 },
        { label: giderLabel, data: giderData, backgroundColor: '#c62828', barPercentage: 0.9, categoryPercentage: 0.85 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' as const, labels: { color: legendColor } },       
        tooltip: { enabled: false }
      },
      layout: { padding: { left: 8, right: 8, top: 0, bottom: 8 } },
      scales: { 
        x: { 
          offset: true,
          ticks: {
            display: true,
            color: (context) => {
              // Aktif bar'ın label'ı mavi
              return context.index === activeBarIndex.value ? '#2196f3' : (legendColor as string)
            },
            font: (context) => {
              // Aktif bar'ın label'ı 1 derece daha büyük ve bold
              return {
                weight: context.index === activeBarIndex.value ? 'bold' : 'normal',
                size: context.index === activeBarIndex.value ? 12 : 11
              }
            }
          }
        }, 
        y: { beginAtZero: true, ticks: { display: false } } 
      },
      // Chart genişliğini sınırla
      aspectRatio: 2.5
    },
    plugins: [valueLabelsPlugin]
  })

  // Bar chart click event'ini ekle - Tıklanan bar'ı soldaki tabloda göster
  barInstance.options.onClick = (event: ChartEvent, elements: ActiveElement[]) => {
    if (elements.length > 0) {
      const element = elements[0]
      const dataIndex = element.index
      // Tıklanan bar'ın index'ini aktif yap
      activeBarIndex.value = dataIndex
      // Chart'ı güncelle (aktif bar label rengi için)
      updateBarChartSeri(seriData.value)
      // Tablo verisini yükle
      void loadTableDataForBar(dataIndex)
    }
  }
}

function updatePieCharts(
  gelir: Array<{ islemGrup: string; toplam: number }>,
  gider: Array<{ islemGrup: string; toplam: number }>
) {
  // Mevcutlar varsa temizle
  if (pieGelirInstance) { pieGelirInstance.destroy(); pieGelirInstance = null }
  if (pieGiderInstance) { pieGiderInstance.destroy(); pieGiderInstance = null }
  if (!pieGelir.value || !pieGider.value) return

  const palette = ['#1976d2', '#26a69a', '#9c27b0', '#ef6c00', '#5e35b1', '#2e7d32', '#ad1457', '#00897b', '#6d4c41', '#c62828']

  const buildPie = (ctx: HTMLCanvasElement, list: Array<{ islemGrup: string; toplam: number }>) => {
    // Ham veriler
    const rawLabels = list.map(x => String(x.islemGrup || ''))
    const rawData = list.map(x => Math.max(0, Math.trunc(Number(x.toplam || 0))))
    const rawTotal = rawData.reduce((a, b) => a + b, 0)

    // %10 altını gizle
    const THRESHOLD = 0.5
    const pairs = rawLabels.map((lbl, i) => ({ label: lbl, value: rawData[i] }))
    let filtered = pairs.filter(p => rawTotal > 0 ? ((p.value * 100) / rawTotal) >= THRESHOLD : false)
    if (filtered.length === 0 && pairs.length > 0) {
      // Tamamı %10 altındaysa en büyük değeri göster
      filtered = [...pairs].sort((a, b) => b.value - a.value).slice(0, 1)
    }

    const labels = filtered.map(p => p.label)
    const data = filtered.map(p => p.value)
    const total = data.reduce((a, b) => a + b, 0)
    const colors = labels.map((_, i) => palette[i % palette.length])

    return new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [
          { data, backgroundColor: colors, borderColor: '#fff', borderWidth: 1 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#e0e0e0', // Dark mod için açık gri
              generateLabels: (chart) => {
                const ds = chart.data.datasets?.[0] as ChartDataset<'pie', number[]> | undefined
                const lbls = (chart.data.labels || []) as string[]
                if (!ds) {
                  return lbls.map((lbl, i): LegendItem => ({
                    text: `${lbl} — 0 (0%)`,
                    fillStyle: '#999',
                    strokeStyle: '#fff',
                    lineWidth: 1,
                    hidden: false,
                    index: i,
                    fontColor: '#e0e0e0' // Legend text rengi zorla
                  } as LegendItem))
                }
                return lbls.map((lbl, i): LegendItem => {
                  const val = Number(ds.data[i] ?? 0)
                  const pct = total > 0 ? Math.round((val * 100) / total) : 0
                  const fillRaw = Array.isArray(ds.backgroundColor) ? ds.backgroundColor[i] : ds.backgroundColor
                  const resolvedFill = fillRaw ?? '#999'
                  return {
                    text: `${lbl} — ${val} (${pct}%)`,
                    fillStyle: resolvedFill,
                    strokeStyle: '#fff',
                    lineWidth: 1,
                    hidden: false,
                    index: i,
                    fontColor: '#e0e0e0' // Legend text rengi zorla
                  } as LegendItem
                })
              }
            }
          },
          tooltip: {
            enabled: true,
            titleColor: $q.dark.isActive ? '#f0f0f0' : '#111111',
            bodyColor: $q.dark.isActive ? '#f0f0f0' : '#111111',
            callbacks: {
              label: (ctx) => {
                const val = Number(ctx.parsed || 0)
                const pct = total > 0 ? Math.round((val * 100) / total) : 0
                const lbl = String(ctx.label || '')
                return `${lbl}: ${val} (${pct}%)`
              }
            }
          }
        }
      }
    })
  }

  pieGelirInstance = buildPie(pieGelir.value, gelir)
  pieGiderInstance = buildPie(pieGider.value, gider)
}
</script>

<style scoped>
.time-period-card { padding: 0; }
.time-period-section { padding: 6px 8px; }
.time-period-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
.time-period-btn { 
  border: 1px solid var(--q-primary); 
  color: var(--q-primary); 
  background-color: transparent;
  transition: all 0.2s ease;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 700;
}
.time-period-btn:hover {
  background-color: var(--q-primary);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.time-btn-active { 
  background-color: var(--q-primary) !important; 
  color: white !important; 
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Switch Butonu - Kompakt boyut */
.filter-switch-btn {
  min-width: 230px;
}

.filter-switch-btn :deep(.q-btn) {
  font-size: 11px !important;
  padding: 3px 12px !important;
  min-height: 26px !important;
}

/* SEÇİLİ buton - YEŞİL ve BOLD olsun */
.filter-switch-btn :deep(.q-btn--active) {
  font-weight: bold !important;
  color: #4caf50 !important;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3) !important;
}

/* Loading overlay */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  border-radius: 4px;
}

.loading-blur {
  filter: blur(2px);
  opacity: 0.5;
  pointer-events: none;
}

/* Bar navigasyon */
.bar-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 8px;
}

.bar-label-text {
  font-weight: 700;
  font-size: 14px;
  color: var(--q-primary);
  flex: 1;
  text-align: center;
  min-width: 120px;
}

.period-net-info { font-weight: 700; font-size: 16px; }
.total-header { font-weight: 700; font-size: 14px; }
.grid-header { 
  background-color: var(--q-primary) !important; 
  color: white !important; 
  font-weight: 700 !important; 
  font-size: 13px !important;
  text-align: center !important;
}
.narrow-col { max-width: 120px; width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.narrow-col-85 { max-width: 100px; width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.half-width { max-width: 34%; width: 34%; }
.chart-card { flex: 1 1 0; }
.grow-card { width: 100%; }
.chart-section { padding: 8px; }
.chart-container { 
  position: relative; 
  height: 360px; 
  max-width: 1047px; 
  width: 100%;
  overflow: hidden;
}

.chart-container canvas {
  max-width: 1047px !important;
  width: 100% !important;
  height: auto !important;
}

/* Chart card'ın da genişliğini sınırla */
.chart-card {
  max-width: 1047px !important;
  flex: 1 1 1047px !important;
}
.pie-row { display: flex; gap: 12px; align-items: stretch; }
.pie-container { position: relative; height: 290px; flex: 1 1 0; }

/* Dark mod için pie chart legend yazılarını gri yap */
.body--dark .pie-container canvas,
.body--dark .pie-container canvas + *,
.body--dark .pie-container div,
.body--dark .pie-container span,
.body--dark .pie-container li {
  color: #bdbdbd !important;
}

/* Chart.js legend elementleri için daha spesifik seçici */
.body--dark .pie-container * {
  color: #bdbdbd !important;
}

/* Vue deep selector ile Chart.js legend */
.body--dark .pie-container :deep(span),
.body--dark .pie-container :deep(div),
.body--dark .pie-container :deep(li) {
  color: #bdbdbd !important;
}

/* Kasalar Arası Aktarım Stilleri */
.transfer-card {
  background: linear-gradient(180deg, rgba(230, 245, 255, 0.95), rgba(220, 236, 255, 0.95));
  border: 1px solid rgba(25, 118, 210, 0.25);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.12);
  border-radius: 12px;
}

.body--dark .transfer-card {
  background: linear-gradient(180deg, rgba(10, 20, 35, 0.96), rgba(8, 16, 28, 0.96));
  border: 1px solid rgba(100, 181, 246, 0.6);
  box-shadow: 0 4px 14px rgba(33, 150, 243, 0.28);
}

.transfer-header-section {
  padding: 12px 24px;
  background: rgba(25, 118, 210, 0.08);
}

.body--dark .transfer-header-section {
  background: rgba(100, 181, 246, 0.12);
}

.transfer-header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.transfer-header-content .q-btn {
  position: absolute;
  right: 0;
}

.transfer-card-section {
  padding: 16px 24px;
}

.transfer-title-centered {
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  color: #1976d2;
  letter-spacing: 0.5px;
  flex: 1;
}

.body--dark .transfer-title-centered {
  color: #90caf9;
}

.transfer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
  align-items: end;
}

.transfer-select,
.transfer-input {
  width: 100%;
}

.transfer-button-group {
  display: flex;
  gap: 8px;
  width: 100%;
}

.transfer-button-half {
  flex: 1;
  height: 30px;
  font-weight: 600;
}

/* Transfer container with balances */
.transfer-container-with-balances {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.balance-chips {
  display: flex;
  flex-direction: column;
  gap: 0px;
  min-width: 140px;
  align-items: flex-end;
}

.balance-chip {
  font-size: 13px;
  font-weight: 800;
  padding: 8px 12px;
  white-space: nowrap;
}

/* Sol sütun wrapper */
.left-column-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Responsive design için küçük ekranlarda dikey düzen */
@media (max-width: 768px) {
  .transfer-grid {
    grid-template-columns: 1fr;
  }
  
  .transfer-container-with-balances {
    flex-direction: column;
  }
  
  .balance-chips {
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
  }
}
</style>

