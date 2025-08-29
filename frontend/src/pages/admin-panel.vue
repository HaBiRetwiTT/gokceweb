<template>
  <q-page class="q-pa-md">
    <!-- Üst Grid: tblislemRST -->
    <q-card class="q-mb-sm">
      <q-card-section class="row items-center no-wrap admin-compact-header">
        <div class="text-subtitle1 text-weight-bold">İşlem Kayıt Değişiklikleri (Orjinal Kayıt)</div>
        <q-space />
        <div class="row items-center q-gutter-sm">
          <q-btn
            dense
            outline
            color="primary"
            :disable="loadingRST || loadingARV"
            @click="onShowHiddenClick"
            :label="'ONAYLANMIŞ KAYITLARI GÖSTER'"
          />
          <q-btn
            dense
            unelevated
            color="primary"
            :disable="loadingRST || loadingARV"
            @click="onRefresh"
            :label="'YENİLE'"
            class="q-ml-md"
          />
        </div>
      </q-card-section>
      <q-table
        :rows="rowsRSTDisplay"
        :columns="columnsRST"
        :visible-columns="visibleColumnsRST"
        row-key="islemNo"
        :loading="loadingRST"
        dense
        flat
        bordered
        separator="cell"
        :pagination="paginationRST"
        :rows-per-page-options="[10, 25]"
        @request="onRequestRST"
        @row-contextmenu="onRstContextMenu"
      >
        <template v-slot:body-cell-diff="props">
          <q-td :props="props" class="text-center" :class="{ 'onayli-cell': normalizeOnay(props.row?.Onay) === 1 }">
            <q-tooltip v-if="rstDiffs[props.row.islemNo] && rstDiffs[props.row.islemNo].length > 0" class="rst-differences-tooltip" :delay="100" :offset="[0,10]">
              <div class="tooltip-content">
                <div class="tooltip-title">Değişiklik Detayları</div>
                <div class="differences-table">
                  <div class="differences-header">
                    <div class="differences-cell">Alan Adı</div>
                    <div class="differences-cell">Orijinal Değer</div>
                    <div class="differences-cell">Değiştirilen Değer</div>
                  </div>
                  <div v-for="diff in rstDiffs[props.row.islemNo]" :key="diff.fieldName" class="differences-row">
                    <div class="differences-cell">{{ diff.fieldName }}</div>
                    <div class="differences-cell">{{ diff.originalValue }}</div>
                    <div class="differences-cell">{{ diff.changedValue }}</div>
                  </div>
                </div>
              </div>
            </q-tooltip>
            <span v-if="rstDiffs[props.row.islemNo] && rstDiffs[props.row.islemNo].length > 0">⚠️</span>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Alt Grid: tblislemARV -->
    <q-card>
      <q-card-section class="text-subtitle1 text-weight-bold admin-compact-header">Silinen İşlem Kayıtları</q-card-section>
      <q-table
        :rows="rowsARVDisplay"
        :columns="columnsARV"
        :visible-columns="visibleColumnsARV"
        row-key="islemNo"
        :loading="loadingARV"
        dense
        flat
        bordered
        separator="cell"
        :pagination="paginationARV"
        :rows-per-page-options="[10, 25]"
        @request="onRequestARV"
        @row-contextmenu="onArvContextMenu"
      >
        <template v-slot:body-cell-islemTutar="props">
          <q-td :props="props" :class="{ 'onayli-cell': normalizeOnay(props.row?.Onay) === 1 }">
            {{ props.value }}
          </q-td>
        </template>
      </q-table>
    </q-card>
    <!-- Context Menu -->
    <div
      v-if="ctxMenu.show"
      class="context-menu"
      ref="ctxMenuEl"
      :style="{
        position: 'fixed',
        left: ctxMenu.x + 'px',
        top: ctxMenu.y + 'px',
        zIndex: 3000,
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }"
      @click.stop
      @mousedown.stop
      @contextmenu.prevent
    >
      <q-list dense padding style="min-width: 180px;">
        <q-item clickable v-close-popup @click="toggleOnay">
          <q-item-section>
            {{ normalizeOnay(ctxMenu.row?.Onay) === 1 ? 'ONAY KALDIR' : 'İŞLEMİ ONAYLA' }}
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { api } from '../boot/axios'
import type { QTableColumn } from 'quasar'

type AnyRow = Record<string, unknown>

const rowsRST = ref<AnyRow[]>([])
const rowsARV = ref<AnyRow[]>([])
const loadingRST = ref(true)
const loadingARV = ref(true)
const rstDiffs = ref<Record<number, Array<{ fieldName: string; originalValue: string; changedValue: string }>>>({})
// Varsayılan: Onay=1 olanlar gizlenecek (yalnızca onaysız kayıtlar gösterilecek)
const showHidden = ref(false)

// Görünür sütunlar (Onay sütunu hariç)
const visibleColumnsRST = ref<string[]>([
  'diff','iKytTarihi','islemKllnc','islemOzel1','islemOzel2','islemOzel3','islemOzel4',
  'islemArac','islemTip','islemGrup','islemAltG','islemBilgi','islemMiktar','islemTutar'
])
const visibleColumnsARV = ref<string[]>([
  'iKytTarihi','islemKllnc','islemOzel1','islemOzel2','islemOzel3','islemOzel4',
  'islemArac','islemTip','islemGrup','islemAltG','islemBilgi','islemMiktar','islemTutar'
])

const columnsRST: QTableColumn<AnyRow>[] = [
  { name: 'diff', label: 'D.', field: 'islemNo', align: 'center' },
  { name: 'iKytTarihi', label: 'Tarihi', field: 'iKytTarihi', align: 'left', sortable: true },
  { name: 'islemKllnc', label: 'Kullanıcı', field: 'islemKllnc', align: 'left', sortable: true },
  { name: 'Onay', label: 'Onay', field: 'Onay', align: 'center', sortable: true },
  { name: 'islemOzel1', label: 'islemOzel1', field: 'islemOzel1', align: 'left' },
  { name: 'islemOzel2', label: 'islemOzel2', field: 'islemOzel2', align: 'left' },
  { name: 'islemOzel3', label: 'islemOzel3', field: 'islemOzel3', align: 'left' },
  { name: 'islemOzel4', label: 'islemOzel4', field: 'islemOzel4', align: 'left' },
  { name: 'islemArac', label: 'İşlem Aracı', field: 'islemArac', align: 'left' },
  { name: 'islemTip', label: 'İşlem Tipi', field: 'islemTip', align: 'left' },
  { name: 'islemGrup', label: 'İşlem Grubu', field: 'islemGrup', align: 'left' },
  { name: 'islemAltG', label: 'Cari Hesap', field: 'islemAltG', align: 'left',
    style: 'max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' },
  { name: 'islemBilgi', label: 'İşlem Notu', field: 'islemBilgi', align: 'left',
    style: 'max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' },
  { name: 'islemMiktar', label: 'Miktar', field: 'islemMiktar', align: 'right' },
  { name: 'islemTutar', label: 'İşlem Tutarı', field: 'islemTutar', align: 'right', sortable: true }
]

const columnsARV: QTableColumn<AnyRow>[] = [
  { name: 'iKytTarihi', label: 'Tarihi', field: 'iKytTarihi', align: 'left', sortable: true },
  { name: 'islemKllnc', label: 'Kullanıcı', field: 'islemKllnc', align: 'left', sortable: true },
  { name: 'Onay', label: 'Onay', field: 'Onay', align: 'center', sortable: true },
  { name: 'islemOzel1', label: 'islemOzel1', field: 'islemOzel1', align: 'left' },
  { name: 'islemOzel2', label: 'islemOzel2', field: 'islemOzel2', align: 'left' },
  { name: 'islemOzel3', label: 'islemOzel3', field: 'islemOzel3', align: 'left' },
  { name: 'islemOzel4', label: 'islemOzel4', field: 'islemOzel4', align: 'left' },
  { name: 'islemArac', label: 'İşlem Aracı', field: 'islemArac', align: 'left' },
  { name: 'islemTip', label: 'İşlem Tipi', field: 'islemTip', align: 'left' },
  { name: 'islemGrup', label: 'İşlem Grubu', field: 'islemGrup', align: 'left' },
  { name: 'islemAltG', label: 'Cari Hesap', field: 'islemAltG', align: 'left',
    style: 'max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' },
  { name: 'islemBilgi', label: 'İşlem Notu', field: 'islemBilgi', align: 'left',
    style: 'max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' },
  { name: 'islemMiktar', label: 'Miktar', field: 'islemMiktar', align: 'right' },
  { name: 'islemTutar', label: 'İşlem Tutarı', field: 'islemTutar', align: 'right', sortable: true }
]

const paginationRST = ref({ page: 1, rowsPerPage: 10 })
const paginationARV = ref({ page: 1, rowsPerPage: 10 })

// Görüntülenecek satırlar (Onay filtresi uygulanmış)
const rowsRSTDisplay = computed(() => {
  if (showHidden.value) return rowsRST.value
  return rowsRST.value.filter(r => {
    const onayRaw = r?.Onay ?? r?.onay ?? r?.onayli ?? r?.Onayli
    return normalizeOnay(onayRaw) === 0
  })
})

const rowsARVDisplay = computed(() => {
  if (showHidden.value) return rowsARV.value
  return rowsARV.value.filter(r => {
    const onayRaw = r?.Onay ?? r?.onay ?? r?.onayli ?? r?.Onayli
    return normalizeOnay(onayRaw) === 0
  })
})

// Context menu state
const ctxMenu = ref({ show: false, x: 0, y: 0, type: '' as 'RST' | 'ARV' | '', row: null as AnyRow | null })
const ctxMenuEl = ref<HTMLElement | null>(null)

function closeCtx() { ctxMenu.value.show = false; ctxMenu.value.row = null; ctxMenu.value.type = '' }

function onRstContextMenu(evt: Event, row: AnyRow) {
  evt.preventDefault()
  const me = evt as unknown as MouseEvent
  ctxMenu.value = { show: true, x: me.clientX, y: me.clientY, type: 'RST', row }
}

function onArvContextMenu(evt: Event, row: AnyRow) {
  evt.preventDefault()
  const me = evt as unknown as MouseEvent
  ctxMenu.value = { show: true, x: me.clientX, y: me.clientY, type: 'ARV', row }
}

async function toggleOnay() {
  if (!ctxMenu.value.row || !ctxMenu.value.type) return
  const islemNo = Number(ctxMenu.value.row.islemNo)
  const current = normalizeOnay(ctxMenu.value.row?.Onay)
  const next = current === 1 ? 0 : 1
  try {
    if (ctxMenu.value.type === 'RST') {
      await api.post('/islem/rst-onay-guncelle', { islemNo, onay: next })
    } else {
      await api.post('/islem/arv-onay-guncelle', { islemNo, onay: next })
    }
    // Sağ tık işlemi sonrası her iki tabloyu da DEFAULT moda (Onay=0) getirip yenile
    showHidden.value = false
    await Promise.all([fetchRST(), fetchARV()])
  } finally {
    closeCtx()
  }
}

function onDocumentClick(e: MouseEvent) {
  if (!ctxMenu.value.show) return
  const target = e.target as Node | null
  const el = ctxMenuEl.value
  if (el && target && !el.contains(target)) {
    closeCtx()
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && ctxMenu.value.show) closeCtx()
}

async function fetchRST() {
  loadingRST.value = true
  try {
    const { data } = await api.get('/islem/rst-records-all')
    rowsRST.value = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
    // Yeniden -> eskiye sırala (islemNo desc)
    rowsRST.value.sort((a: AnyRow, b: AnyRow) => Number(b.islemNo ?? 0) - Number(a.islemNo ?? 0))
    // RST farklarını sırayla hesapla
    for (const row of rowsRST.value) {
      const islemNo = Number(row.islemNo)
      if (!isNaN(islemNo)) {
        rstDiffs.value[islemNo] = await getRstDifferences(islemNo)
      }
    }
  } finally {
    loadingRST.value = false
  }
}

async function fetchARV() {
  loadingARV.value = true
  try {
    const { data } = await api.get('/islem/arv-records-all')
    rowsARV.value = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
    // Yeniden -> eskiye sırala (islemNo desc)
    rowsARV.value.sort((a: AnyRow, b: AnyRow) => Number(b.islemNo ?? 0) - Number(a.islemNo ?? 0))
  } finally {
    loadingARV.value = false
  }
}

function onRequestRST() { void fetchRST() }
function onRequestARV() { void fetchARV() }

onMounted(async () => {
  await Promise.all([fetchRST(), fetchARV()])
  document.addEventListener('click', onDocumentClick, true)
  document.addEventListener('keydown', onKeyDown, true)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick, true)
  document.removeEventListener('keydown', onKeyDown, true)
})

function onShowHiddenClick() {
  showHidden.value = true
}

async function onRefresh() {
  // YENİLE: varsayılan moda dön (Onay=1 gizli)
  showHidden.value = false
  await Promise.all([fetchRST(), fetchARV()])
}

// RST fark hesaplama - kasa-islem sayfasındaki mantığın sadeleştirilmiş hali
async function getRstDifferences(islemNo: number): Promise<Array<{ fieldName: string; originalValue: string; changedValue: string }>> {
  try {
    const originalResp = await api.get(`/islem/islem-rst-detay/${islemNo}`)
    if (!originalResp.data?.success || !originalResp.data?.data) return []
    const originalRecord = originalResp.data.data as AnyRow
    const currentResp = await api.get(`/islem/detay/${islemNo}`)
    if (!currentResp.data?.success || !currentResp.data?.data) return []
    const currentRecord = currentResp.data.data as AnyRow

    const fields: Array<{ key: string; displayName: string }> = [
      { key: 'iKytTarihi', displayName: 'Tarih' },
      { key: 'islemKllnc', displayName: 'Kullanıcı' },
      { key: 'islemOzel1', displayName: 'Özel 1' },
      { key: 'islemOzel2', displayName: 'Özel 2' },
      { key: 'islemOzel3', displayName: 'Özel 3' },
      { key: 'islemOzel4', displayName: 'Özel 4' },
      { key: 'islemBirim', displayName: 'Birim' },
      { key: 'islemDoviz', displayName: 'Döviz' },
      { key: 'islemKur', displayName: 'Kur' },
      { key: 'islemBilgi', displayName: 'Bilgi' },
      { key: 'islemCrKod', displayName: 'Cari Kod' },
      { key: 'islemArac', displayName: 'Araç' },
      { key: 'islemTip', displayName: 'Tip' },
      { key: 'islemGrup', displayName: 'Grup' },
      { key: 'islemAltG', displayName: 'Alt Grup' },
      { key: 'islemMiktar', displayName: 'Miktar' },
      { key: 'islemTutar', displayName: 'Tutar' }
    ]

    const diffs: Array<{ fieldName: string; originalValue: string; changedValue: string }> = []
    fields.forEach(f => {
      const ov = originalRecord[f.key]
      const cv = currentRecord[f.key]
      const nOv = safeToString(ov).trim()
      const nCv = safeToString(cv).trim()
      if (nOv !== nCv) {
        diffs.push({ fieldName: f.displayName, originalValue: nOv, changedValue: nCv })
      }
    })
    return diffs
  } catch {
    return []
  }
}

function safeToString(value: unknown): string {
  if (value === null || value === undefined) return ''
  const t = typeof value
  if (t === 'string') return value as string
  if (t === 'number') return `${value as number}`
  if (t === 'boolean') return (value as boolean) ? 'true' : 'false'
  if (value instanceof Date) return value.toLocaleString('tr-TR')
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

function normalizeOnay(value: unknown): 0 | 1 {
  if (value === undefined || value === null) return 0
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'number') return value === 1 ? 1 : 0
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase()
    if (s === '1' || s === 'true' || s === 'on' || s === 'yes') return 1
    return 0
  }
  // Diğer tiplerde (object vs.) onay bilgisini 0 kabul et
  return 0
}
</script>

<style scoped>
/* Kasa-islem detay grid tooltip stili ile uyumlu */
.rst-differences-tooltip {
  max-width: 600px !important;
}
.tooltip-content {
  min-width: 300px;
}
.tooltip-title {
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 13px;
}
.differences-table {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}
.differences-header {
  display: grid;
  grid-template-columns: 100px 250px 250px;
  background-color: #f5f5f5;
  font-weight: 600;
  padding: 1px 2px;
  font-size: 12px;
  align-items: center;
}
.differences-row {
  display: grid;
  grid-template-columns: 100px 250px 250px;
  border-top: 1px solid #ddd;
  font-size: 11px;
  min-height: 26px;
  align-items: center;
}
.differences-cell {
  padding: 1px 2px;
  padding-left: 10px;
  border-right: 1px solid #ddd;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
}
.differences-cell:last-child {
  border-right: none;
}
.differences-row:nth-child(even) {
  border-top: 1px solid #ddd;
  background-color: #fafafa;
}
.body--dark .differences-header {
  background-color: #424242;
}
.body--dark .differences-row:nth-child(even) {
  background-color: #2a2a2a;
}

/* Maksimum sütun genişliklerini daralt */
/* Grid genişliği sabit tanımlandığı için ayrı max-width kurallarına gerek yok */

/* Context menu theme */
.context-menu {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
}
.body--dark .context-menu {
  background-color: #1e1e1e;
  border: 1px solid #3a3a3a;
}

/* Onaylı satırlar için D. hücresi yeşil zemin */
.onayli-cell {
  background-color: #33a05f;
}
.body--dark .onayli-cell {
  background-color: #33a05f;
}

/* Alt başlık satırı için kompakt görünüm */
.admin-compact-header {
  padding: 4px 8px !important;
  font-size: 13px;
  line-height: 1.15;
}
.admin-compact-header .text-subtitle1 {
  font-size: 13px !important;
}
</style>

