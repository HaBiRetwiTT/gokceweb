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
        :pagination="{ rowsPerPage: 20 }"
      >
        <template v-slot:body-cell-adSoyad="props">
          <q-td :props="props">
            {{ props.row.adSoyad }}<span v-if="props.row.ulkeKodu"> ({{ props.row.ulkeKodu }})</span>
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
  adSoyad?: string
  ulkeKodu?: string
  grsTrh?: string
  cksTrh?: string
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
  { name: 'actions', label: 'İşlem', field: 'actions', align: 'left' as const },
  { name: 'hrResId', label: 'HR No', field: 'hrResId', align: 'left' as const },
  { name: 'adSoyad', label: 'Ad Soyad', field: 'adSoyad', align: 'left' as const },
  { name: 'odaTipiProj', label: 'Oda Tipi', field: 'odaTipiProj', align: 'left' as const },
  { name: 'kanal', label: 'Kanal', field: 'kanal', align: 'left' as const },
  { name: 'grsTrh', label: 'Giriş', field: 'grsTrh', align: 'left' as const },
  { name: 'cksTrh', label: 'Çıkış', field: 'cksTrh', align: 'left' as const },
  { name: 'ucret', label: 'Ücret', field: (r: PendingRow) => `${Number(r.ucret||0).toFixed(2)} ${r.odemeDoviz||''}`, align: 'right' as const },
  { name: 'paidStatus', label: 'Ödeme', field: 'paidStatus', align: 'left' as const },
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


