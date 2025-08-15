<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-sm header-line">
      <div class="text-h6">Bekleyen Rezervasyonlar</div>
      <div class="row items-center q-gutter-sm">
        <q-select
          v-model="searchModel"
          use-input
          hide-dropdown-icon
          input-debounce="300"
          dense
          outlined
          :options="searchOptions"
          option-disable="disable"
          option-label="MstrAdi"
          option-value="MstrTCN"
          popup-content-class="reservation-search-popup"
          style="min-width: 520px; max-width: 720px;"
          v-model:input-value="searchText"
          menu-anchor="bottom left"
          menu-self="top left"
          fit
          placeholder="3 rakam(oda arama) yada en az 7 karakter giriniz"
          @filter="onSearchFilter"
          @update:model-value="onSearchSelect"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
          <template v-slot:before-options>
            <div class="row text-caption text-grey-7 q-px-sm q-pt-sm q-pb-xs reservation-search-header">
              <div class="col-4">Ad Soyad</div>
              <div class="col-2">Giriş</div>
              <div class="col-2">Plan Çıkış</div>
              <div class="col-2">Çıkış</div>
              <div class="col-2 text-right">Net Bedel</div>
            </div>
            <q-separator />
          </template>
          <template v-slot:option="{ opt }">
            <q-item :disable="true" dense>
              <q-item-section>
                <div class="row items-center reservation-search-row">
                  <div class="col-4 ellipsis">{{ opt.MstrAdi }}</div>
                  <div class="col-2">{{ opt.KnklmGrsTrh || '' }}</div>
                  <div class="col-2">{{ opt.KnklmPlnTrh || '' }}</div>
                  <div class="col-2">{{ opt.KnklmCksTrh || '' }}</div>
                  <div class="col-2 text-right">{{ formatCurrency(opt.KnklmNfyt) }}</div>
                </div>
              </q-item-section>
            </q-item>
          </template>
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">Sonuç yok</q-item-section>
            </q-item>
          </template>
        </q-select>
        
        <!-- Temizleme Butonu -->
        <q-btn 
          v-show="searchText && searchText.length > 0"
          color="grey-6" 
          icon="clear" 
          size="sm"
          flat
          dense
          @click="clearSearch"
        >
          <q-tooltip class="bg-grey-7 text-white text-body2" :delay="300">
            Arama metnini ve sonuçları temizle
          </q-tooltip>
        </q-btn>
        
        <q-btn color="primary" icon="refresh" label="Yenile" dense @click="refresh" :loading="loading" />
      </div>
    </div>

    <q-card flat bordered>
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="hrResId"
        :loading="loading"
        flat
        bordered
        square
        dense
        :pagination="{ sortBy: 'grsTrh', descending: false, rowsPerPage: 20 }"
      >
        <template v-slot:body-cell-adSoyad="props">
          <q-td :props="props">
            <span v-if="props.row.ulkeKodu">({{ props.row.ulkeKodu }})  -  </span>{{ props.row.adSoyad }}
          </q-td>
        </template>
        <template v-slot:body-cell-grsTrh="props">
          <q-td :props="props">
            <span v-if="props.row.grsTrh" :class="['date-pill', isOnOrBeforeToday(props.row.grsTrh) ? 'date-pill-green' : '']">{{ props.row.grsTrh }}</span>
          </q-td>
        </template>
        <template v-slot:body-cell-cksTrh="props">
          <q-td :props="props">
            <span v-if="props.row.cksTrh" :class="['date-pill', isBeforeToday(props.row.cksTrh) ? 'date-pill-orange' : '']">{{ props.row.cksTrh }}</span>
          </q-td>
        </template>
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              size="sm"
              flat
              icon="login"
              color="primary"
              @click="emitCheckIn(props.row)"
              :disable="isOnOrBeforeToday(props.row.cksTrh) || isAfterToday(props.row.grsTrh)"
            >
              <q-tooltip v-if="isOnOrBeforeToday(props.row.cksTrh) || isAfterToday(props.row.grsTrh)" class="bg-orange text-white text-body2" :delay="300">
                {{ getCheckInTooltip(props.row) }}
              </q-tooltip>
            </q-btn>
            <q-btn size="sm" flat icon="block" color="negative" @click="emitNoShow(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../boot/axios'
import { Notify } from 'quasar'

interface PendingRow {
  hrResId: string
  hrNumber?: string
  adSoyad?: string
  ulkeKodu?: string
  grsTrh?: string
  grsKey?: string
  cksTrh?: string
  cksKey?: string
  odaTipiProj?: string
  kanal?: string
  paidStatus?: string
  ucret?: number
  odemeDoviz?: string
  durum?: string
}

const loading = ref(false)
const rows = ref<PendingRow[]>([])
const router = useRouter()



// Global arama combobox state
type SearchResult = {
  MstrTCN: string
  MstrAdi: string
  KnklmGrsTrh?: string | null
  KnklmPlnTrh?: string | null
  KnklmCksTrh?: string | null
  KnklmNfyt?: number | null
  disable?: boolean
}

const searchModel = ref<string | null>(null)
const searchOptions = ref<SearchResult[]>([])
const searchText = ref('')
// 🔥 Arama istekleri için abort kontrol ve sırayla uygulama
let searchSeq = 0
let searchAbort: AbortController | null = null

const columns = [
  { name: 'actions', label: 'İşlem', field: 'actions', align: 'left' as const, sortable: false },
  { name: 'kanal', label: 'Acenta', field: 'kanal', align: 'left' as const, sortable: true },
  { name: 'hrNumber', label: 'HR No', field: 'hrNumber', align: 'left' as const, sortable: true },
  { name: 'adSoyad', label: 'Ad Soyad', field: 'adSoyad', align: 'left' as const, sortable: true },
  { name: 'odaTipiProj', label: 'Oda Tipi', field: 'odaTipiProj', align: 'left' as const, sortable: true },
  { name: 'grsTrh', label: 'Giriş', field: 'grsTrh', align: 'left' as const, sortable: true, sort: (a: string, b: string, rowA: PendingRow, rowB: PendingRow) => (rowA.grsKey || '').localeCompare(rowB.grsKey || '') },
  { name: 'cksTrh', label: 'Çıkış', field: 'cksTrh', align: 'left' as const, sortable: true, sort: (a: string, b: string, rowA: PendingRow, rowB: PendingRow) => (rowA.cksKey || '').localeCompare(rowB.cksKey || '') },
  {
    name: 'ucret',
    label: 'Ücret',
    field: (r: PendingRow) => Number(r.ucret || 0),
    format: (val: number, r: PendingRow) => `${val.toFixed(2)} ${r.odemeDoviz || ''}`,
    align: 'right' as const,
    sortable: true,
    sort: (a: number, b: number) => a - b
  },
  { name: 'paidStatus', label: 'Ödeme', field: 'paidStatus', align: 'left' as const, sortable: true },
]

async function loadData() {
  try {
    loading.value = true
    const { data } = await api.get('/hotelrunner/pending-reservations')
    rows.value = data?.data || []
  } catch {
    Notify.create({ type: 'negative', message: 'Liste yüklenemedi' })
  } finally {
    loading.value = false
  }
}

// Kartlı işlem sayfasındaki global arama ile aynı backend uçları kullanılır
async function performGlobalSearch(term: string) {
  const mySeq = ++searchSeq
  if (searchAbort) {
    try { searchAbort.abort() } catch { /* no-op */ }
  }
  searchAbort = new AbortController()
  const query = term?.trim() || ''
  
  // 3 haneli sayı ise oda araması (istisna)
  if (/^\d{3}$/.test(query)) {
    // Oda araması için devam et
  } else if (query.length < 7) {
    // 3 haneli sayı değilse en az 7 karakter gerekli
    searchOptions.value = []
    return
  }

  // 3 haneli sayı ise oda araması
  if (/^\d{3}$/.test(query)) {
    try {
      const { data } = await api.get('/dashboard/musteri-konaklama-search-by-oda', { params: { odaNo: query }, signal: searchAbort.signal })
      if (data?.success) {
        const rows: SearchResult[] = (data?.data || [])
        if (mySeq !== searchSeq) return
        searchOptions.value = rows.map((x) => ({
          MstrTCN: x.MstrTCN || '',
          MstrAdi: x.MstrAdi || '',
          KnklmGrsTrh: x.KnklmGrsTrh || '',
          KnklmPlnTrh: x.KnklmPlnTrh || '',
          KnklmCksTrh: x.KnklmCksTrh || '',
          KnklmNfyt: Number(x.KnklmNfyt || 0),
          disable: true
        })) as SearchResult[]
        return
      }
      if (mySeq !== searchSeq) return
      searchOptions.value = []
      return
    } catch (err) {
      if (err && typeof err === 'object' && 'name' in err && (err as { name?: string }).name === 'CanceledError') {
        return
      }
      if (mySeq !== searchSeq) return
      searchOptions.value = []
      return
    }
  }

  try {
    const { data } = await api.get('/dashboard/musteri-konaklama-search', { params: { q: query, page: 1, limit: 50 }, signal: searchAbort.signal })
    if (data?.success) {
      const rows: SearchResult[] = (data?.data || [])
      if (mySeq !== searchSeq) return
      searchOptions.value = rows.map((x) => ({
        MstrTCN: x.MstrTCN || '',
        MstrAdi: x.MstrAdi || '',
        KnklmGrsTrh: x.KnklmGrsTrh || '',
        KnklmPlnTrh: x.KnklmPlnTrh || '',
        KnklmCksTrh: x.KnklmCksTrh || '',
        KnklmNfyt: Number(x.KnklmNfyt || 0),
        disable: true
      })) as SearchResult[]
    } else {
      if (mySeq !== searchSeq) return
      searchOptions.value = []
    }
  } catch (err) {
    if (err && typeof err === 'object' && 'name' in err && (err as { name?: string }).name === 'CanceledError') {
      return
    }
    if (mySeq !== searchSeq) return
    searchOptions.value = []
  }
}

function onSearchFilter(val: string, update: (cb: () => void) => void) {
  update(() => {
    searchText.value = val
    void performGlobalSearch(val)
  })
}

// Seçim yapılmayacak, olası tıklamada modeli temizle
function onSearchSelect() {
  searchModel.value = null
}

// Arama metnini ve sonuçları temizle
function clearSearch() {
  searchText.value = ''
  searchOptions.value = []
  searchModel.value = null
}

function formatCurrency(v?: number | null): string {
  const n = Number(v || 0)
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}



function parseDateDDMMYYYY(s?: string | null): Date | null {
  if (!s) return null
  const parts = String(s).split('.')
  if (parts.length !== 3) return null
  const d = parseInt(parts[0] || '0', 10)
  const m = parseInt(parts[1] || '0', 10) - 1
  const y = parseInt(parts[2] || '0', 10)
  const date = new Date(y, m, d)
  return isNaN(date.getTime()) ? null : date
}

function isOnOrBeforeToday(s?: string | null): boolean {
  const date = parseDateDDMMYYYY(s)
  if (!date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date.getTime() <= today.getTime()
}

function isBeforeToday(s?: string | null): boolean {
  const date = parseDateDDMMYYYY(s)
  if (!date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date.getTime() < today.getTime()
}

function isAfterToday(s?: string | null): boolean {
  const date = parseDateDDMMYYYY(s)
  if (!date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date.getTime() > today.getTime()
}

function getCheckInTooltip(row: PendingRow): string {
  if (isAfterToday(row.grsTrh)) return 'Giriş tarihi gelecekte: Günü gelince check-in yapılabilir'
  if (isOnOrBeforeToday(row.cksTrh)) return 'Çıkış tarihi bugün/öncesi: Check-in yerine No Show yapın'
  return ''
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function syncHotelRunnerForCurrentWindow(): Promise<void> {
  const from = new Date()
  const to = new Date()
  to.setDate(to.getDate() + 31)
  try {
    await api.get('/hotelrunner/sync-reservations', {
      params: { from: toISODate(from), to: toISODate(to) }
    })
  } catch {
    // Sessiz geç
  }
}

async function refresh() {
  try {
    loading.value = true
    Notify.create({ type: 'info', message: 'HOTEL RUNNER Portalından Rezervasyonlar Sorgulanıyor...', position: 'top', timeout: 1200 })
    await syncHotelRunnerForCurrentWindow()
    await loadData()
  } finally {
    loading.value = false
  }
}

async function emitCheckIn(row: PendingRow) {
  try {
    loading.value = true
    const { data } = await api.post('/hotelrunner/check-in', { hrResId: row.hrResId })
    if (data?.success) {
      Notify.create({ type: 'positive', message: data?.message || 'Check-in bildirildi', caption: JSON.stringify(data?.data) })
      // Başarılı senaryoda: musteri-islem sayfasına yönlendir ve formu önceden doldur
      await proceedToMusteriIslemWithPrefill(row)
    } else {
      const msg: string = data?.data?.message || data?.message || 'Başarısız'
      // Yeni iş akışı: Lokal statü değişikliği YAPMA. Kullanıcı EVET derse musteri-islem'e yönlendir.
      if (msg.includes('state_change_is_not_available')) {
        const ok = confirm('HR Portalı bu işlem için API kullanımına izin vermiyor.\n\nRezervasyon bilgileriyle musteri-islem sayfasına geçerek işlemi tamamlamak ister misiniz?')
        if (ok) {
          await proceedToMusteriIslemWithPrefill(row)
          return
        }
      }
      Notify.create({ type: 'negative', message: data?.message || 'Başarısız', caption: JSON.stringify(data?.data || {}) })
    }
  } catch (err) {
    Notify.create({ type: 'negative', message: err instanceof Error ? err.message : 'Hata' })
  } finally {
    loading.value = false
  }
}

function diffDaysDDMMYYYY(from?: string, to?: string): number {
  const parse = (s?: string) => {
    if (!s) return null
    const p = s.split('.')
    if (p.length !== 3) return null
    const d = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]))
    return isNaN(d.getTime()) ? null : d
  }
  const d1 = parse(from)
  const d2 = parse(to)
  if (!d1 || !d2) return 1
  const ms = d2.getTime() - d1.getTime()
  const days = Math.round(ms / (1000 * 60 * 60 * 24))
  return days > 0 ? days : 1
}

async function proceedToMusteriIslemWithPrefill(row: PendingRow) {
  // Prefill payload: Acenta(kanal), Ad Soyad, Oda Tipi, Süre(cks-grs), Toplam Bedel
  const payload = {
    from: 'rezerve-giris',
    hrResId: row.hrResId,
    kanal: row.kanal || '',
    adSoyad: row.adSoyad || '',
    odaTipiProj: row.odaTipiProj || '',
    // Konaklama süresi: çıkış tarihi - bugünün tarihi
    konaklamaSuresi: diffDaysDDMMYYYY(new Date().toLocaleDateString('tr-TR'), row.cksTrh),
    toplamBedel: Number(row.ucret || 0)
  }
  try {
    // 🔥 REZERVASYON PREFILL ÖNCESİNDE KARTLI-ISLEM VERISINI TEMIZLE
    localStorage.removeItem('selectedMusteriForIslem')
    sessionStorage.setItem('reservationCheckIn', JSON.stringify(payload))
    sessionStorage.setItem('prevPage', 'rezerve-giris')
  } catch { /* ignore */ }
  await router.push('/musteri-islem')
}
async function emitNoShow(row: PendingRow) {
  await noShow(row)
}

onMounted(() => {
  void loadData()
})

async function noShow(row: PendingRow) {
  try {
    loading.value = true
    const { data } = await api.post('/hotelrunner/no-show', { hrResId: row.hrResId })
    if (data?.success) {
      Notify.create({ type: 'positive', message: data?.message || 'No-Show bildirildi', caption: JSON.stringify(data?.data) })
      await loadData()
    } else {
      const msg: string = data?.data?.message || data?.message || 'Başarısız'
      if (msg.includes('state_change_is_not_available')) {
        const ok = confirm('HR Portalı bu işlem için API kullanımına izin vermiyor.\n\nMüşteri Rezervasyon Kaydını Lokal Olarak No Show Yapmak İstiyor musunuz?')
        if (ok) {
          const r = await api.post('/hotelrunner/local-status', { hrResId: row.hrResId, status: 'no_show' })
          Notify.create({ type: r.data?.success ? 'positive' : 'negative', message: r.data?.message || (r.data?.success ? 'Lokal No Show yapıldı' : 'Lokal işlem başarısız') })
          await loadData()
          return
        }
      }
      Notify.create({ type: 'negative', message: data?.message || 'Başarısız', caption: JSON.stringify(data?.data || {}) })
    }
  } catch (err) {
    Notify.create({ type: 'negative', message: err instanceof Error ? err.message : 'Hata' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.q-table {
  font-size: 0.85rem;
}

/* Satır yüksekliklerini azalt */
.q-table thead th,
.q-table tbody td {
  padding: 2px 3px !important;
  line-height: 1.0 !important;
}

/* Satırları daha kompakt yap */
.q-table .q-tr > .q-td,
.q-table .q-tr > .q-th {
  height: auto !important;
}

.reservation-search-popup {
  min-width: 520px;
  max-width: 720px;
  left: 0 !important;
}
.reservation-search-header {
  font-weight: 600;
}
.reservation-search-row > div {
  padding: 2px 6px;
}

/* Tarih kapsülleri */
.date-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 12px;
  line-height: 1;
}
.date-pill-green {
  background: #21ba45; /* Quasar green-5 */
  color: #fff;
}
.date-pill-orange {
  background: #f2c037; /* Quasar orange-5 */
  color: #3a3a3a;
}
</style>


