<template>
  <div class="q-pa-md">
    <!-- Oda Tipi Legend (başlık yerine) -->
    <div class="legend-row q-mb-md">
      <q-btn icon="refresh" round dense flat class="q-mr-sm" @click="reloadPage" />
      <div
        v-for="tip in uniqueOdaTipleri"
        :key="tip"
        class="legend-item"
        :style="{ backgroundColor: getOdaTipColor(tip) }"
        @mouseenter="onLegendMouseEnter(tip)"
        @mouseleave="onLegendMouseLeave()"
      >
        {{ tip }} ({{ getBosYatakSayisi(tip) }})
      </div>
      <div class="legend-spacer"></div>
      <div
        class="legend-item legend-kirli"
        @mouseenter="onKirliHoverEnter()"
        @mouseleave="onKirliHoverLeave()"
      >Kirli ({{ getKirliSayisi() }})</div>
      <div
        class="legend-item legend-ariza"
        @mouseenter="onArizaHoverEnter()"
        @mouseleave="onArizaHoverLeave()"
      >Arıza ({{ getArizaSayisi() }})</div>
      <div
        class="legend-item legend-extra"
        @mouseenter="onSuresiDolanHoverEnter()"
        @mouseleave="onSuresiDolanHoverLeave()"
      >Süresi Dolan ({{ getSuresiDolanSayisi() }})</div>
    </div>
    <div ref="tableScrollRef" class="table-scroll">
    <q-table
      :rows="tableRows"
      :columns="columns"
      row-key="kat"
      hide-bottom
      hide-header
      flat
      bordered
      dense
      :pagination="{ rowsPerPage: 0 }"
      :rows-per-page-options="[0]"
    >
      <template v-slot:body-cell="props">
        <q-td :props="props" :class="props.col.name === 'kat' ? ['kat-sticky-td', rowHasSuresiDolan(props.row) ? 'kat-has-stripe' : ''] : ''">
          <div v-if="props.col.name === 'kat'" class="kat-cell">
            <div class="text-weight-bold">{{ props.row.kat }}.KAT</div>
            <div v-if="countSuresiDolanInRow(props.row) > 0" class="suresi-dolan-count">
              {{ countSuresiDolanInRow(props.row) }}
            </div>
          </div>
          <div v-else class="oda-cell-wrapper">
            <div v-for="room in getAllRoomsInRow(props.row)"
                 :key="room && typeof room === 'object' ? room.odaNo : room"
                 class="oda-chip"
                 :class="{
                   'is-dimmed': shouldDimRoom(room),
                   'has-bottom-stripe': isInSuresiDolan(room),
                    'is-ariza': isAriza(room),
                    'is-kirli': isKirli(room)
                 }"
                 :style="getChipStyle(room)">
              <span class="oda-num-pill" :style="getNumPillStyle(room)">
                {{ room && typeof room === 'object' ? room.odaNo : room }}
              </span>
              <q-tooltip anchor="top middle" self="bottom middle" :delay="200" class="oda-tip-tooltip">
                <div>{{ (room && typeof room === 'object' && 'odaTip' in room) ? (room.odaTip || '-') : '-' }}</div>
                <div>{{ getDolulukText(room) }}</div>
              </q-tooltip>
              <!-- Sağ tık menüsü -->
              <q-menu context-menu touch-position anchor="top left" self="top left" :separate-close-popup="true" class="room-context-menu" :ref="el => setRoomMenuRef(room, el)">
                <div @mouseleave="closeRoomMenu(room)">
                <q-list dense style="min-width: 110px">
                  <!-- KİRLİ İşlemleri -->
                  <q-item v-if="isKirli(room)" clickable v-close-popup @click="onKirliKaldir(room)">
                    <q-item-section>KİRLİ KALDIR</q-item-section>
                  </q-item>
                  <q-item v-else clickable v-close-popup @click="onKirliYap(room)" :disable="hasDolu(room) === false ? false : true">
                    <q-item-section>KİRLİ YAP</q-item-section>
                  </q-item>
                  <q-item v-if="isAriza(room)" clickable v-close-popup @click="onArizaKaldir(room)">
                    <q-item-section>ARIZA KALDIR</q-item-section>
                  </q-item>
                  <q-item v-else clickable v-close-popup @click="onArizaEkle(room)" :disable="hasDolu(room)">
                    <q-item-section>ARIZA EKLE</q-item-section>
                  </q-item>
                </q-list>
                </div>
              </q-menu>
            </div>
          </div>
        </q-td>
      </template>
      </q-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { api } from '../boot/axios'

type KatPlanRoom = { odaNo: number; odaTip: string; yatak?: number; dolu?: number; ariza?: boolean; kirli?: boolean }
type KatPlanResponse = { floors: number[]; floorToRooms: Record<string, KatPlanRoom[]>; maxCols: number }

const columns = ref<{ name: string; label: string; field: string; align: 'left' | 'center'; index?: number; headerStyle?: string; style?: string }[]>([
  { name: 'kat', label: 'Kat', field: 'kat', align: 'left', headerStyle: 'width: 50px; min-width:50px; max-width:50px;', style: 'width:92px;' }
])

type TableRow = { kat: number; odas: KatPlanRoom[][] }
const tableRows = ref<TableRow[]>([])
const uniqueOdaTipleri = ref<string[]>([])
const hoveredTip = ref<string | null>(null)
const hoveredKirli = ref<boolean>(false)
const hoveredAriza = ref<boolean>(false)
const hoveredSuresiDolan = ref<boolean>(false)
const tableScrollRef = ref<HTMLElement | null>(null)
const sweepDelayTimerId = ref<number | null>(null)
const sweepBackTimerId = ref<number | null>(null)
const suresiDolanOdaSet = ref<Set<number>>(new Set())
const sweepRafId = ref<number | null>(null)

onMounted(async () => {
  const { data } = await api.get('/konaklama-takvim/kat-oda-plan')
  const payload = data as KatPlanResponse
  // Legend için benzersiz oda tipleri
  const tipSet = new Set<string>()
  for (const key of Object.keys(payload.floorToRooms || {})) {
    const arr = (payload.floorToRooms as Record<string, Array<{ odaTip: string }>>)[key] || []
    for (const r of arr) {
      const t = (r && typeof r === 'object' ? String((r as { odaTip?: string }).odaTip || '') : '').trim()
      if (t) tipSet.add(t)
    }
  }
  uniqueOdaTipleri.value = Array.from(tipSet).sort((a, b) => a.localeCompare(b, 'tr'))
  // Tek bir oda kolonu ekle (tüm odalar burada gösterilecek)
  columns.value.push({
    name: 'odalar',
    label: 'Odalar',
    field: 'odalar',
    align: 'left',
    headerStyle: 'padding: 6px 8px;',
    style: 'padding: 6px 8px;'
  })
  // Satırları oluştur (geriye dönük uyum: sayı listesi dönerse objeye çevir)
  tableRows.value = payload.floors.map((k) => {
  const raw = (payload.floorToRooms[String(k)] || []) as Array<unknown>
  const normalized: KatPlanRoom[] = raw
    .map(toKatPlanRoom)
    .filter((r): r is KatPlanRoom => !!r && r.odaNo > 0)
    .sort((a, b) => {
      const ra = (typeof a.yatak === 'number' && a.yatak > 0) ? (Number(a.dolu ?? 0) / a.yatak) : 0
      const rb = (typeof b.yatak === 'number' && b.yatak > 0) ? (Number(b.dolu ?? 0) / b.yatak) : 0
      if (ra !== rb) return ra - rb
      return a.odaNo - b.odaNo
    })

    // Odaları kolona böl: her hücreye bir liste (soldan sağa doldurma)
    const odas: KatPlanRoom[][] = []
    for (let i = 0; i < payload.maxCols; i++) odas.push([])
    normalized.forEach((o, idx) => {
      const col = Math.min(idx, payload.maxCols - 1)
      odas[col].push(o)
    })
    return { kat: k, odas }
  })
  // Süresi dolan odaları yükle ve işaretle
  await loadSuresiDolanOdalari()
})

onBeforeUnmount(() => {
  cancelScheduledSweep()
})

// Bir satırdaki tüm odaları düz liste olarak döndür
function getAllRoomsInRow(row: TableRow): KatPlanRoom[] {
  const allRooms: KatPlanRoom[] = []
  if (row && Array.isArray(row.odas)) {
    for (const cell of row.odas) {
      if (Array.isArray(cell)) {
        allRooms.push(...cell)
      }
    }
  }
  return allRooms
}

// remove unused legacy tooltip helper

function toKatPlanRoom(it: unknown): KatPlanRoom | null {
  if (typeof it === 'object' && it !== null) {
    const obj = it as Record<string, unknown>
    const no = obj.odaNo ?? obj.OdaNo
    const tipRaw = obj.odaTip ?? obj.OdaTip ?? ''
    const yatakRaw = obj.yatak ?? obj.Yatak ?? obj.YatakSayisi
    const doluRaw = obj.dolu ?? obj.Dolu ?? obj.DoluSayisi
    const arizaRaw = obj.ariza ?? obj.Ariza ?? obj.HasAriza
    const kirliRaw = obj.kirli ?? obj.Kirli ?? obj.HasKirli
    const num = Number(typeof no === 'string' || typeof no === 'number' ? no : '')
    const tip = typeof tipRaw === 'string' ? tipRaw : (typeof tipRaw === 'number' ? String(tipRaw) : '')
    const yatak = typeof yatakRaw === 'number' ? yatakRaw : Number(yatakRaw ?? 0) || 0
    const dolu = typeof doluRaw === 'number' ? doluRaw : Number(doluRaw ?? 0) || 0
    const ariza = typeof arizaRaw === 'boolean' ? arizaRaw : (Number(arizaRaw ?? 0) > 0)
    const kirli = typeof kirliRaw === 'boolean' ? kirliRaw : (Number(kirliRaw ?? 0) > 0)
    if (isFinite(num) && num > 0) {
      return { odaNo: num, odaTip: tip, yatak, dolu, ariza, kirli }
    }
  }
  if (typeof it === 'string' || typeof it === 'number') {
    const num = Number(String(it).replace(/\D/g, ''))
    if (isFinite(num) && num > 0) return { odaNo: num, odaTip: '', yatak: 0, dolu: 0 }
  }
  return null
}

// Oda tipine göre renk belirle
function getOdaTipColor(tip: string | undefined): string {
  const raw = (tip || '').toString().trim()
  if (!raw) return '#90a4ae' // grey
  const norm = raw.toLocaleUpperCase('tr-TR')
  const ascii = norm.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  // SADECE bu iki tip için renk değiştir: Tek Kişilik Camsız ve Tek Kişilik Camsız (A)
  if (
    ascii.includes('TEK') && ascii.includes('KISILIK') && ascii.includes('CAMSIZ') && ascii.includes('(A)') &&
    !ascii.includes('CAML') && !ascii.includes('TV')
  ) {
    return '#b71c1c' // Tek Kişilik Camsız (A): koyu kırmızı
  }
  if (
    ascii.includes('TEK') && ascii.includes('KISILIK') && ascii.includes('CAMSIZ') &&
    !ascii.includes('CAML') && !ascii.includes('TV') && !ascii.includes('(A)')
  ) {
    return '#e65100' // Tek Kişilik Camsız: koyu turuncu
  }
  // SADECE bu tip için renk değiştir: 4 Kişilik Camlı -> mor ton
  if (
    (ascii.includes('4') || ascii.includes('DORT')) &&
    ascii.includes('KISILIK') &&
    ascii.includes('CAML')
  ) {
    return '#7e57c2' // mor ton
  }
  // Başka özel eşleşme yok; kalan tüm tipler mevcut map veya hash-tabanlı renge gider
  const map: Record<string, string> = {
    'STANDART': '#42a5f5',
    'DELUXE': '#66bb6a',
    'DELUX': '#66bb6a',
    'SUIT': '#ab47bc',
    'SUITE': '#ab47bc',
    'EKONOMI': '#ffa726',
    'EKONOMİ': '#ffa726',
    'AILE': '#ef5350',
    'AİLE': '#ef5350'
  }
  if (map[norm]) return map[norm]
  // Bilinmeyen tipler için stabil fakat farklı renk üret
  let hash = 5381
  for (let i = 0; i < norm.length; i++) {
    hash = ((hash << 5) + hash) + norm.charCodeAt(i)
    hash |= 0
  }
  const hue = Math.abs(hash) % 360
  const saturation = 65
  const lightness = 45
  return `hsl(${hue} ${saturation}% ${lightness}%)`
}

function normalizeTip(tip: string | undefined): string | null {
  const raw = (tip || '').toString().trim()
  if (!raw) return null
  return raw.toLocaleUpperCase('tr-TR')
}

function getRoomTipNormalized(room: unknown): string | null {
  if (room && typeof room === 'object' && 'odaTip' in (room as Record<string, unknown>)) {
    const tip = (room as { odaTip?: string }).odaTip || ''
    return normalizeTip(tip)
  }
  return null
}

function onLegendMouseEnter(tip: string) {
  hoveredTip.value = normalizeTip(tip)
  hoveredKirli.value = false
  hoveredAriza.value = false
  hoveredSuresiDolan.value = false
  scheduleHorizontalSweep()
}

function onLegendMouseLeave() {
  hoveredTip.value = null
  cancelScheduledSweep()
  resetScrollToStart()
}

function onKirliHoverEnter() {
  hoveredKirli.value = true
  hoveredTip.value = null
  hoveredAriza.value = false
  hoveredSuresiDolan.value = false
  scheduleHorizontalSweep()
}

function onKirliHoverLeave() {
  hoveredKirli.value = false
  cancelScheduledSweep()
  resetScrollToStart()
}

function onArizaHoverEnter() {
  hoveredAriza.value = true
  hoveredTip.value = null
  hoveredKirli.value = false
  hoveredSuresiDolan.value = false
  scheduleHorizontalSweep()
}

function onArizaHoverLeave() {
  hoveredAriza.value = false
  cancelScheduledSweep()
  resetScrollToStart()
}

function onSuresiDolanHoverEnter() {
  hoveredSuresiDolan.value = true
  hoveredTip.value = null
  hoveredKirli.value = false
  hoveredAriza.value = false
  scheduleHorizontalSweep()
}

function onSuresiDolanHoverLeave() {
  hoveredSuresiDolan.value = false
  cancelScheduledSweep()
  resetScrollToStart()
}

function scheduleHorizontalSweep() {
  cancelScheduledSweep()
  // 3 saniye bekle, sonra sağa ve sola kaydır
  sweepDelayTimerId.value = window.setTimeout(() => {
    performHorizontalSweep()
  }, 3000)
}

function cancelScheduledSweep() {
  if (sweepDelayTimerId.value !== null) {
    clearTimeout(sweepDelayTimerId.value)
    sweepDelayTimerId.value = null
  }
  if (sweepBackTimerId.value !== null) {
    clearTimeout(sweepBackTimerId.value)
    sweepBackTimerId.value = null
  }
  if (sweepRafId.value !== null) {
    cancelAnimationFrame(sweepRafId.value)
    sweepRafId.value = null
  }
}

function getScrollContainer(): HTMLElement | null {
  const host = tableScrollRef.value
  if (!host) return null
  const middle = host.querySelector('.q-table__middle')
  if (middle && middle instanceof HTMLElement) return middle
  const inner = host.querySelector('.q-table__container')
  if (inner && inner instanceof HTMLElement) return inner
  const asTable = host.querySelector('.q-table')
  if (asTable && asTable instanceof HTMLElement) return asTable
  return host
}

function performHorizontalSweep() {
  const container = getScrollContainer()
  if (!container) return
  const maxScrollLeft = container.scrollWidth - container.clientWidth
  if (maxScrollLeft <= 0) return
  // Yavaş animasyon: ileri ve geri 5sn
  const forwardMs = 5000
  const backwardMs = 5000
  animateScroll(container, container.scrollLeft, maxScrollLeft, forwardMs)
    .then(() => {
      // Sonda 3 saniye bekle
      if (sweepBackTimerId.value !== null) {
        clearTimeout(sweepBackTimerId.value)
      }
      sweepBackTimerId.value = window.setTimeout(() => {
        animateScroll(container, container.scrollLeft, 0, backwardMs).catch(() => { /* ignore */ })
        sweepBackTimerId.value = null
      }, 3000)
    })
    .catch(() => {
      // ignore
    })
}

function animateScroll(container: HTMLElement, from: number, to: number, durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now()
    const distance = to - from
    const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
    const step = (now: number) => {
      const elapsed = now - start
      const ratio = durationMs > 0 ? Math.min(1, Math.max(0, elapsed / durationMs)) : 1
      const eased = easeInOutCubic(ratio)
      container.scrollLeft = from + distance * eased
      if (ratio < 1) {
        sweepRafId.value = requestAnimationFrame(step)
      } else {
        sweepRafId.value = null
        resolve()
      }
    }
    sweepRafId.value = requestAnimationFrame(step)
  })
}

function resetScrollToStart() {
  const container = getScrollContainer()
  if (!container) return
  if (container.scrollLeft <= 0) return
  // Dönüşü kısa ve akıcı yap
  animateScroll(container, container.scrollLeft, 0, 600).catch(() => { /* ignore */ })
}

// Chip bar rengi: odaTip varsa onu kullan, yoksa kat numarasına göre üret
function getChipBarColor(room: unknown): string {
  if (room && typeof room === 'object' && 'odaTip' in (room as Record<string, unknown>)) {
    const tip = (room as { odaTip?: string }).odaTip || ''
    const c = getOdaTipColor(tip)
    if (c) return c
  }
  // Fallback: odaNo'dan kat hanesini alıp renk üret
  let odaNo: number | undefined
  if (room && typeof room === 'object' && 'odaNo' in (room as Record<string, unknown>)) {
    const n = (room as { odaNo?: number | string }).odaNo
    const num = typeof n === 'number' ? n : Number(String(n).replace(/\D/g, ''))
    odaNo = isFinite(num) ? num : undefined
  } else if (typeof room === 'string' || typeof room === 'number') {
    const num = Number(String(room).replace(/\D/g, ''))
    odaNo = isFinite(num) ? num : undefined
  }
  const floorDigit = typeof odaNo === 'number' && odaNo > 0 ? Number(String(odaNo).charAt(0)) : 0
  const hue = (floorDigit * 35) % 360
  return `hsl(${hue} 55% 48%)`
}

function getChipStyle(room: unknown): Record<string, string> {
  const bar = getChipBarColor(room)
  // Yalnızca üst bar rengi kontrolü; chip zemini ek renklendirme yapmaz
  return { '--bar-color': bar }
}

function getNumPillStyle(room: unknown): Record<string, string> {
  let ratio = -1
  let yatak = 0
  if (room && typeof room === 'object') {
    const obj = room as Record<string, unknown>
    yatak = typeof obj.yatak === 'number' ? obj.yatak : Number(obj.yatak ?? 0) || 0
    const dolu = typeof obj.dolu === 'number' ? obj.dolu : Number(obj.dolu ?? 0) || 0
    if (yatak > 0 && dolu >= 0) ratio = Math.min(1, Math.max(0, dolu / yatak))
  }
  const base: Record<string, string> = {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '9999px',
    fontWeight: '600',
    color: '#111'
  }
  if (yatak > 0 && ratio >= 0) {
    const green = '#66bb6a'  // belirgin yeşil
    const orange = '#ff7043' // turuncuya yakın kırmızı (daha sıcak)
    const splitGreen = Math.round((1 - ratio) * 100)
    base.backgroundImage = `linear-gradient(90deg, ${green} 0%, ${green} ${splitGreen}%, ${orange} ${splitGreen}%, ${orange} 100%)`
  } else {
    base.backgroundColor = 'rgba(255,255,255,0.08)'
    base.color = '#ffffff'
  }
  return base
}

// İki hex rengi orana göre karıştır
// mixHex artık kullanılmıyor; ileride ihtiyaç olursa geri eklenebilir
// Süresi dolan kartındaki odaları getirip sete doldur
async function loadSuresiDolanOdalari(): Promise<void> {
  try {
    const { data } = await api.get('/dashboard/suresi-dolan')
    const list = Array.isArray(data?.data) ? data.data : []
    const set = new Set<number>()
    for (const row of list as Array<Record<string, unknown>>) {
      const no = row['KnklmOdaNo']
      const num = Number(typeof no === 'string' || typeof no === 'number' ? String(no).replace(/\D/g, '') : '')
      if (isFinite(num) && num > 0) set.add(num)
    }
    suresiDolanOdaSet.value = set
  } catch {
    // sessiz geç
  }
}

function isInSuresiDolan(room: unknown): boolean {
  const set = suresiDolanOdaSet.value
  if (!set || set.size === 0) return false
  let odaNo: number | null = null
  if (room && typeof room === 'object' && 'odaNo' in (room as Record<string, unknown>)) {
    const n = (room as { odaNo?: number | string }).odaNo
    const num = Number(typeof n === 'number' ? n : String(n ?? '').replace(/\D/g, ''))
    odaNo = isFinite(num) ? num : null
  } else if (typeof room === 'string' || typeof room === 'number') {
    const num = Number(String(room).replace(/\D/g, ''))
    odaNo = isFinite(num) ? num : null
  }
  return typeof odaNo === 'number' && set.has(odaNo)
}

function shouldDimRoom(room: unknown): boolean {
  // Tip hover: SADECE o oda tipi gösterilsin (kirli ve arıza da dahil)
  if (hoveredTip.value !== null) {
    return getRoomTipNormalized(room) !== hoveredTip.value
  }
  // Kirli hover: SADECE kirli odalar gösterilsin
  if (hoveredKirli.value) {
    return !isKirli(room)
  }
  // Arıza hover: SADECE arıza odaları gösterilsin
  if (hoveredAriza.value) {
    return !isAriza(room)
  }
  // Süresi dolan hover: SADECE süresi dolan odalar gösterilsin
  if (hoveredSuresiDolan.value) {
    return !isInSuresiDolan(room)
  }
  return false
}

function getDolulukText(room: unknown): string {
  if (room && typeof room === 'object') {
    const obj = room as Record<string, unknown>
    const yatak = typeof obj.yatak === 'number' ? obj.yatak : Number(obj.yatak ?? 0) || 0
    const dolu = typeof obj.dolu === 'number' ? obj.dolu : Number(obj.dolu ?? 0) || 0
    const ariza = typeof obj.ariza === 'boolean' ? obj.ariza : (Number(obj.ariza ?? 0) > 0)
    const kirli = typeof obj.kirli === 'boolean' ? obj.kirli : (Number(obj.kirli ?? 0) > 0)
    if (yatak > 0) {
      const flags: string[] = []
      if (ariza) flags.push('ARIZALI')
      if (kirli) flags.push('KİRLİ')
      return `${dolu} / ${yatak}${flags.length ? ' - ' + flags.join(' - ') : ''}`
    }
  }
  return '-'
}

function isAriza(room: unknown): boolean {
  if (room && typeof room === 'object') {
    const obj = room as Record<string, unknown>
    return typeof obj.ariza === 'boolean' ? obj.ariza : (Number(obj.ariza ?? 0) > 0)
  }
  return false
}

function hasDolu(room: unknown): boolean {
  if (room && typeof room === 'object') {
    const obj = room as Record<string, unknown>
    const yatak = typeof obj.yatak === 'number' ? obj.yatak : Number(obj.yatak ?? 0) || 0
    const dolu = typeof obj.dolu === 'number' ? obj.dolu : Number(obj.dolu ?? 0) || 0
    return yatak > 0 && dolu > 0
  }
  return false
}

// 🔥 Oda tipine göre boş yatak toplamını hesapla
function getBosYatakSayisi(odaTip: string): number {
  let toplamBosYatak = 0
  for (const row of tableRows.value) {
    const allRooms = getAllRoomsInRow(row)
    for (const room of allRooms) {
      if (room && typeof room === 'object' && 'odaTip' in room) {
        const tip = (room as { odaTip?: string }).odaTip || ''
        if (tip.trim() === odaTip.trim()) {
          const yatak = typeof room.yatak === 'number' ? room.yatak : Number(room.yatak ?? 0) || 0
          const dolu = typeof room.dolu === 'number' ? room.dolu : Number(room.dolu ?? 0) || 0
          const bosYatak = Math.max(0, yatak - dolu)
          toplamBosYatak += bosYatak
        }
      }
    }
  }
  return toplamBosYatak
}

// 🔥 Kirli oda sayısını hesapla
function getKirliSayisi(): number {
  let count = 0
  for (const row of tableRows.value) {
    const allRooms = getAllRoomsInRow(row)
    for (const room of allRooms) {
      if (isKirli(room)) {
        count++
      }
    }
  }
  return count
}

// 🔥 Arızalı oda sayısını hesapla
function getArizaSayisi(): number {
  let count = 0
  for (const row of tableRows.value) {
    const allRooms = getAllRoomsInRow(row)
    for (const room of allRooms) {
      if (isAriza(room)) {
        count++
      }
    }
  }
  return count
}

// 🔥 Süresi dolan oda sayısını hesapla
function getSuresiDolanSayisi(): number {
  return suresiDolanOdaSet.value.size
}

function isKirli(room: unknown): boolean {
  if (room && typeof room === 'object') {
    const obj = room as Record<string, unknown>
    return typeof obj.kirli === 'boolean' ? obj.kirli : (Number(obj.kirli ?? 0) > 0)
  }
  return false
}

async function onKirliYap(room: unknown): Promise<void> {
  try {
    const odaNo = getOdaNo(room)
    if (!odaNo) return
    const { data } = await api.post('/konaklama-takvim/oda-kirli', { odaNo, kirli: true })
    if (data && data.success) {
      location.reload()
    } else {
      const msg = (data && data.message) ? String(data.message) : 'İşlem gerçekleştirilemedi'
      alert(msg)
    }
  } catch {
    alert('İşlem sırasında hata oluştu')
  }
}

async function onKirliKaldir(room: unknown): Promise<void> {
  try {
    const odaNo = getOdaNo(room)
    if (!odaNo) return
    const { data } = await api.post('/konaklama-takvim/oda-kirli', { odaNo, kirli: false })
    if (data && data.success) {
      location.reload()
    } else {
      const msg = (data && data.message) ? String(data.message) : 'İşlem gerçekleştirilemedi'
      alert(msg)
    }
  } catch {
    alert('İşlem sırasında hata oluştu')
  }
}

async function onArizaEkle(room: unknown): Promise<void> {
  try {
    const odaNo = getOdaNo(room)
    if (!odaNo) return
    const { data } = await api.post('/konaklama-takvim/oda-ariza', { odaNo, ariza: true })
    if (data && data.success) {
      location.reload()
    } else {
      // Hata mesajını kullanıcıya bildir
      const msg = (data && data.message) ? String(data.message) : 'İşlem gerçekleştirilemedi'
      alert(msg)
    }
  } catch {
    alert('İşlem sırasında hata oluştu')
  }
}

async function onArizaKaldir(room: unknown): Promise<void> {
  try {
    const odaNo = getOdaNo(room)
    if (!odaNo) return
    await api.post('/konaklama-takvim/oda-ariza', { odaNo, ariza: false })
    await loadSuresiDolanOdalari()
    location.reload()
  } catch {
    // sessiz geç
  }
}

function getOdaNo(room: unknown): number | null {
  if (room && typeof room === 'object' && 'odaNo' in (room as Record<string, unknown>)) {
    const n = (room as { odaNo?: number | string }).odaNo
    const num = Number(typeof n === 'number' ? n : String(n ?? '').replace(/\D/g, ''))
    return isFinite(num) ? num : null
  }
  if (typeof room === 'string' || typeof room === 'number') {
    const num = Number(String(room).replace(/\D/g, ''))
    return isFinite(num) ? num : null
  }
  return null
}

// Sağ tık menüsünü oda bazında kapatabilmek için referans tutucu
const roomMenuMap = new WeakMap<object, { hide: () => void }>()
function setRoomMenuRef(room: unknown, el: unknown) {
  if (room && typeof room === 'object' && el && typeof el === 'object' && 'hide' in (el as Record<string, unknown>)) {
    roomMenuMap.set(room, (el as { hide: () => void }))
  }
}
function closeRoomMenu(room: unknown) {
  if (room && typeof room === 'object') {
    const ref = roomMenuMap.get(room)
    if (ref && typeof ref.hide === 'function') {
      ref.hide()
    }
  }
}



function rowHasSuresiDolan(row: { odas: Array<Array<{ odaNo: number }>> } | Record<string, unknown>): boolean {
  try {
    const arr = (row as Record<string, unknown>).odas as Array<Array<{ odaNo: number }>>
    if (!Array.isArray(arr)) return false
    for (const cell of arr) {
      if (!Array.isArray(cell)) continue
      for (const room of cell) {
        if (room && typeof room === 'object' && typeof room.odaNo === 'number') {
          if (suresiDolanOdaSet.value.has(room.odaNo)) return true
        }
      }
    }
    return false
  } catch {
    return false
  }
}

function countSuresiDolanInRow(row: { odas: Array<Array<{ odaNo: number }>> } | Record<string, unknown>): number {
  try {
    const arr = (row as Record<string, unknown>).odas as Array<Array<{ odaNo: number }>>
    if (!Array.isArray(arr)) return 0
    let count = 0
    for (const cell of arr) {
      if (!Array.isArray(cell)) continue
      for (const room of cell) {
        if (room && typeof room === 'object' && typeof room.odaNo === 'number') {
          if (suresiDolanOdaSet.value.has(room.odaNo)) count++
        }
      }
    }
    return count
  } catch {
    return 0
  }
}

function reloadPage(): void {
  location.reload()
}
</script>

<style scoped>
.kat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}

.suresi-dolan-count {
  font-size: 11px;
  font-weight: 700; /* koyu */
  color: #000000; /* koyu renk */
}
.oda-cell-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: flex-start;
}
.oda-chip {
  background: #263238;
  color: #ffffff !important;
  padding: 9px 6px;
  border-radius: 4px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-shadow: 0 0 2px rgba(0,0,0,0.6);
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
}
.oda-num-pill {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 9999px;
  font-size: 12px; /* oda no yazısını 1 derece büyüt */
}

/* İnce üst renk çubuğu */
.oda-chip::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: var(--bar-color, #90a4ae);
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}
/* Satır yüksekliği daha fazla olsun */
.q-table tbody tr > td {
  height: 74px; /* çok az artırıldı */
}
.q-table thead tr > th {
  height: 50px;
}

.oda-tip-tooltip {
  font-size: 1.3em;
  text-align: center !important;
  display: block;
}
.oda-tip-tooltip > div {
  text-align: center !important;
}

.legend-row {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap; /* Chipleri aynı satırda tut */
  overflow-x: auto; /* Gerekirse yatay scroll */
  align-items: center;
}
.kat-sticky-td {
  position: sticky;
  left: 0;
  z-index: 3;
  background: #1e272c; /* ana tablo zeminine uyumlu sabit arka plan */
  overflow: visible;
}
.q-table__middle tbody td.kat-sticky-td {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  background: #1e272c;
}
/* Şerit etkisi :before ile verildiği için sınıfın kendisi zemin rengi vermez */
.kat-has-stripe { position: relative; }
.kat-has-stripe::before {
  content: '';
  position: absolute;
  left: 6px;
  right: 6px;
  top: 4px;
  height: 60px; /* iki satırı kapsayacak yükseklik (başlık + alt sayı) */
  background: #fdd835; /* sarı şerit */
  border-radius: 4px;
  z-index: 0;
  pointer-events: none;
}
/* Kat hücresi içeriği şeridin üzerinde kalsın */
.kat-sticky-td > * {
  position: relative;
  z-index: 1;
}
/* Kat stripe aktifken yazı rengi koyu olsun */
.kat-has-stripe .text-weight-bold {
  color: #000 !important;
}
.legend-spacer {
  width: 24px;
}
.table-scroll {
  overflow-x: auto;
  /* QTable kendi kapsayıcısını oluşturuyor; yatay scroll'u garanti etmek için min-width */
  width: 100%;
  scroll-behavior: smooth;
}
/* Scrollbar görünür; arka plan sayfa zemini ile aynı (koyu) */
.table-scroll::-webkit-scrollbar {
  height: 10px;
}
.table-scroll::-webkit-scrollbar-track {
  background: #12171a; /* sayfa zemini ile uyumlu koyu renk */
}
.table-scroll::-webkit-scrollbar-thumb {
  background-color: #2a343a;
  border-radius: 8px;
  border: 2px solid #12171a; /* track ile bütünleşsin */
}
/* Firefox */
.table-scroll {
  scrollbar-color: #2a343a #12171a;
  scrollbar-width: thin;
}
.legend-item {
  color: #fff;
  padding: 6px 10px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.75rem; /* 1 kademe küçültüldü (14px -> ~14px, varsayılan 16px'den küçük) */
  text-shadow: 0 1px 2px rgba(0,0,0,0.45);
  cursor: pointer;
  flex-shrink: 0; /* Chipleri küçültme, aynı satırda tut */
  white-space: nowrap; /* Metni tek satırda tut */
}
.no-scrollbar {
  overflow: hidden !important;
}
.legend-kirli {
  background: #5d4037; /* kahverengi */
  color: #fff;
}
.legend-ariza {
  background: #6d1b1b; /* bordo */
  color: #fff;
}
.legend-extra {
  background: #fdd835; /* belirgin sarı */
  color: #000; /* kontrast için siyah metin */
}
.room-context-menu .q-item {
  font-size: 11px; /* bir derece küçük */
}
.has-bottom-stripe {
  position: relative;
}
.has-bottom-stripe::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px; /* üstteki bar ile aynı yükseklik */
  background: #fdd835; /* belirgin sarı */
  border-bottom-left-radius: 4px; /* üst barın radius'una uyum */
  border-bottom-right-radius: 4px;
}

/* ARIZALI odalar: bordo zemin ve açık metin rengi */
.is-ariza {
  background-color: #6d1b1b !important; /* bordo */
  color: #fff !important;
}
.is-kirli {
  background-color: #5d4037 !important; /* kahverengi */
  color: #fff !important;
}

.is-dimmed {
  display: none !important;
}
</style>


