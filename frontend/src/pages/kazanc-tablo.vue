<template>
  <q-page class="q-pa-md">
    <div class="top-row-container">
      <div class="time-period-container">
        <q-card class="time-period-card">
          <q-card-section class="time-period-section row items-center no-wrap">
            <div class="time-period-buttons">
              <q-btn v-for="p in timePeriods" :key="p.value" :label="p.label" :class="{ 'time-btn-active': p.selected }" dense flat @click="selectPeriod(p.value)" />
            </div>
            <q-space />
            <div class="period-net-info">{{ periodNetText }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row items-start q-gutter-md q-mt-md">
      <q-card class="half-width">
        <q-table
          :rows="rows"
          :columns="columns"
          row-key="grup"
          dense
          flat
          bordered
          separator="cell"
          :pagination="pagination"
          :rows-per-page-options="[10, 25, 50]"
        >
          <template v-slot:header-cell-gelirToplam="props">
            <q-th :props="props"><span class="total-header">{{ props.col.label }}</span></q-th>
          </template>
          <template v-slot:header-cell-giderToplam="props">
            <q-th :props="props"><span class="total-header">{{ props.col.label }}</span></q-th>
          </template>
        </q-table>
      </q-card>

      <q-card class="chart-card grow-card">
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
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../boot/axios'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title, ArcElement, PieController } from 'chart.js'
import type { Plugin, LegendItem, ChartDataset } from 'chart.js'
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title, ArcElement, PieController)

type Row = { gelirGrup?: string; gelirToplam?: number; giderGrup?: string; giderToplam?: number; grup: string }

const $q = useQuasar()
// Dark modda legend metinleri gri olsun
const legendColor = $q.dark.isActive ? '#bdbdbd' : '#222222'

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

const rows = ref<Row[]>([])
const pagination = ref({ page: 1, rowsPerPage: 25 })
const netToplam = ref(0)
const periodNetText = ref('')
const columns = ref<QTableColumn<Row>[]>([
  { name: 'gelirGrup', label: 'GELİRLER (islemGrup)', field: 'gelirGrup', align: 'left', classes: 'narrow-col-85', headerClasses: 'narrow-col-85' },
  { name: 'gelirToplam', label: 'Toplam', field: 'gelirToplam', align: 'right', classes: 'narrow-col', headerClasses: 'narrow-col', format: (val: unknown) => formatTLBlankZero(Number(val || 0)) },
  { name: 'giderGrup', label: 'GİDERLER (islemGrup)', field: 'giderGrup', align: 'left', classes: 'narrow-col-85', headerClasses: 'narrow-col-85' },
  { name: 'giderToplam', label: 'Toplam', field: 'giderToplam', align: 'right', classes: 'narrow-col', headerClasses: 'narrow-col', format: (val: unknown) => formatTLBlankZero(Number(val || 0)) },
])

function getPeriodDates(): { start: string; end: string } {
  const today = new Date()
  const selected = timePeriods.value.find(p => p.selected)?.value || 'gunler'
  const format = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}.${mm}.${yyyy}`
  }
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

const barChart = ref<HTMLCanvasElement | null>(null)
let barInstance: Chart | null = null
const pieGelir = ref<HTMLCanvasElement | null>(null)
const pieGider = ref<HTMLCanvasElement | null>(null)
let pieGelirInstance: Chart | null = null
let pieGiderInstance: Chart | null = null

async function loadData() {
  const { start, end } = getPeriodDates()
  const { data } = await api.get('/islem/kar-zarar-ozet', { params: { start, end } })
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
  periodNetText.value = `${start} - ${end} DÖNEMİ ${netToplam.value >= 0 ? 'KAZANÇ TOPLAMI' : 'ZARAR TOPLAMI'}: ${formatTL(Math.abs(netToplam.value))}`
  const gelirCol = columns.value.find(c => c.name === 'gelirToplam')
  const giderCol = columns.value.find(c => c.name === 'giderToplam')
  if (gelirCol) gelirCol.label = formatTL(gelirSum)
  if (giderCol) giderCol.label = formatTL(giderSum)
  // 12 dilimlik seri verisi (seçilen period)
  const currentPeriod = timePeriods.value.find(p => p.selected)?.value || 'gunler'
  const seriResp = await api.get('/islem/kar-zarar-seri', { params: { period: currentPeriod, end }})
  const seri = (seriResp?.data?.data || []) as Array<{ label: string; gelir: number; gider: number }>
  updateBarChartSeri(seri)

  // Pie chart'ları güncelle
  updatePieCharts(gelir, gider)
}

function selectPeriod(v: string) {
  timePeriods.value.forEach(p => (p.selected = p.value === v))
  void loadData()
}

onMounted(() => { void loadData() })

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

  barInstance = new Chart(barChart.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'GELİR', data: gelirData, backgroundColor: '#2e7d32', barPercentage: 0.9, categoryPercentage: 0.85 },
        { label: 'GİDER', data: giderData, backgroundColor: '#c62828', barPercentage: 0.9, categoryPercentage: 0.85 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' as const, labels: { color: legendColor } },       
        tooltip: { enabled: false }
      },
      layout: { padding: { left: 8, right: 8, top: 0 } },
      scales: { x: { offset: true }, y: { beginAtZero: true, ticks: { display: false } } }
    },
    plugins: [valueLabelsPlugin]
  })
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
              color: '#bdbdbd', // Dark mod için sabit gri
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
                    fontColor: '#bdbdbd' // Legend text rengi zorla
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
                    fontColor: '#bdbdbd' // Legend text rengi zorla
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
.time-period-buttons { display: flex; gap: 6px; flex-wrap: wrap; }
.time-btn-active { background-color: var(--q-primary); color: #fff; border-radius: 4px; }
.period-net-info { font-weight: 700; font-size: 16px; }
.total-header { font-weight: 700; font-size: 14px; }
.narrow-col { max-width: 120px; width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.narrow-col-85 { max-width: 100px; width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.half-width { max-width: 34%; width: 34%; }
.chart-card { flex: 1 1 0; }
.grow-card { width: 100%; }
.chart-section { padding: 8px; }
.chart-container { position: relative; height: 360px; }
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
</style>

