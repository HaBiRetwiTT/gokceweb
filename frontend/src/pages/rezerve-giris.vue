<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-sm header-line">
      <div class="text-h6">Bekleyen Rezervasyonlar</div>
      <q-btn color="primary" icon="refresh" label="Yenile" dense @click="refresh" :loading="loading" />
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
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn size="sm" flat icon="login" color="primary" @click="emitCheckIn(props.row)" />
            <q-btn size="sm" flat icon="block" color="negative" @click="emitNoShow(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
      await loadData()
    } else {
      const msg: string = data?.data?.message || data?.message || 'Başarısız'
      // API üzerinden state change kapalıysa kullanıcıya lokal işlem teklif et
      if (msg.includes('state_change_is_not_available')) {
        const ok = confirm('HR Portalı bu işlem için API kullanımına izin vermiyor.\n\nMüşteri Rezervasyon Kaydını Lokal Olarak Check-in Yapmak İstiyor musunuz?')
        if (ok) {
          const r = await api.post('/hotelrunner/local-status', { hrResId: row.hrResId, status: 'checked_in' })
          Notify.create({ type: r.data?.success ? 'positive' : 'negative', message: r.data?.message || (r.data?.success ? 'Lokal check-in yapıldı' : 'Lokal işlem başarısız') })
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
</style>


