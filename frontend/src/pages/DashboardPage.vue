<template>
  <q-page class="dashboard-page q-pa-md">
    <!-- Dashboard Container - Sola yaslanmış -->
    <div class="dashboard-container">
      
      <!-- Main Content Area -->
      <div class="dashboard-content">
        <!-- Single Column Layout -->
        <div class="dashboard-single-column">
          
          <!-- Main Filter Container Card -->
          <q-card class="filter-container-card">
            <q-card-section>
              
              <!-- Date Selection Section -->
              <div class="date-selection-section q-mb-lg">
                
                <!-- Start Date Only -->
                <div class="date-field q-mb-sm">
                  <div class="date-label">Başlangıç Tarihi (Opsiyonel)</div>
                  <q-input
                    v-model="startDate"
                    outlined
                    dense
                    dark
                    readonly
                    :disable="checkboxLoading"
                    placeholder=""
                    class="date-input"
                  >
                    <template v-slot:append>
                      <q-icon 
                        v-if="startDate" 
                        name="close" 
                        class="cursor-pointer date-icon q-mr-sm" 
                        @click="!checkboxLoading && clearStartDate()"
                        :class="{ 'disabled': checkboxLoading }"
                      />
                      <q-icon name="event" class="cursor-pointer date-icon">
                        <q-popup-proxy ref="startPicker" cover transition-show="scale" transition-hide="scale">
                          <q-date 
                            v-model="startDate" 
                            mask="DD.MM.YYYY" 
                            :options="dateOptions"
                            @update:model-value="() => startPicker?.hide()"
                          />
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>
              </div>
              
              <!-- Accommodation Type Section -->
              <div class="accommodation-section q-mb-md">
                <div class="section-header">
                  <span class="section-title">Konaklama Tipi</span>
                  <q-checkbox
                    v-model="allAccommodationSelected"
                    @update:model-value="toggleAllAccommodation"
                    class="q-ml-auto"
                    :disable="checkboxLoading"
                    color="primary"
                  />
                </div>
                
                <div class="options-grid">
                  <div 
                    v-for="option in accommodationOptions" 
                    :key="option.value"
                    class="option-item"
                    :class="{ selected: option.selected }"
                  >
                    <q-checkbox
                      v-model="option.selected"
                      @update:model-value="updateAccommodationSelection"
                      color="primary"
                      :disable="checkboxLoading"
                      class="q-mr-sm"
                    />
                    <q-icon :name="option.icon" :color="option.color" size="sm" class="q-mr-sm" />
                    <span>{{ option.label }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Room Type Section -->
              <div class="room-section">
                <div class="section-header">
                  <span class="section-title">Oda Tipi</span>
                  <q-checkbox
                    v-model="allRoomTypesSelected"
                    @update:model-value="toggleAllRoomTypes"
                    class="q-ml-auto"
                    color="primary"
                    :disable="checkboxLoading"
                  />
                </div>
                
                <div class="options-grid">
                  <div 
                    v-for="option in roomTypeOptions" 
                    :key="option.value"
                    class="option-item"
                    :class="{ selected: option.selected }"
                  >
                    <q-checkbox
                      v-model="option.selected"
                      @update:model-value="updateRoomTypeSelection"
                      color="primary"
                      :disable="checkboxLoading"
                      class="q-mr-sm"
                    />
                    <q-icon 
                      v-if="option.icon" 
                      :name="option.icon" 
                      :color="option.color" 
                      size="sm" 
                      class="q-mr-sm" 
                    />
                    <span>{{ option.label }}</span>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
              </div>
              
                <!-- Top Row: Time Period + Pie Charts -->
        <div class="top-row-container">
          <!-- Time Period Container -->
          <div class="time-period-container">
            <q-card class="time-period-card">
              <q-card-section class="time-period-section">
                <div class="time-period-buttons">
                  <q-btn
                    v-for="period in timePeriods"
                    :key="period.value"
                    :label="period.label"
                    :color="period.color"
                    :class="{ 'time-btn-active': period.selected }"
                    :disable="!!startDate || checkboxLoading"
                    class="time-period-btn"
                    @click="selectTimePeriod(period.value)"
                    flat
                    dense
                  />
                </div>
            </q-card-section>
          </q-card>
          </div>

          <!-- Pie Charts Container - Period container'ın sağında -->
          <div v-if="shouldShowChart" class="pie-charts-top-container">
            
            <!-- Konaklama Tipi Pie Chart -->
            <q-card class="chart-card pie-chart-top">
              <q-card-section class="chart-section">
                <div class="chart-container">
                  <canvas ref="pieChartAccommodation"></canvas>
        </div>
              </q-card-section>
            </q-card>

            <!-- Oda Tipi Pie Chart -->
            <q-card class="chart-card pie-chart-top">
              <q-card-section class="chart-section">
                <div class="chart-container">
                  <canvas ref="pieChartRoomType"></canvas>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Bar Charts Container - Period container'ın altında alt alta -->
        <div v-if="shouldShowChart" class="bar-charts-container q-mt-lg">
          <!-- Bar Chart Container - Konaklama Sayısı -->
          <q-card class="chart-card bar-chart-single q-mb-lg">
            <q-card-section class="chart-section">
                <div class="chart-container">
                  <canvas ref="chartCanvas" width="400" height="200"></canvas>
                </div>
            </q-card-section>
          </q-card>

          <!-- Row: Toplam Konaklama Günleri (sol) + Toplam Konaklama Tutarı (sağ) -->
          <div class="bar-charts-row q-mb-lg">
            <q-card class="chart-card bar-chart-left">
              <q-card-section class="chart-section">
                  <div class="chart-container">
                    <canvas ref="chartCanvasDays" width="400" height="200"></canvas>
                  </div>
              </q-card-section>
            </q-card>

            <q-card class="chart-card bar-chart-right">
              <q-card-section class="chart-section">
                  <div class="chart-container">
                    <canvas ref="chartCanvasAmount" width="400" height="200"></canvas>
                  </div>
              </q-card-section>
            </q-card>
          </div>
        </div>



        <!-- Seçim Uyarısı -->
        <q-card v-if="!shouldShowChart" class="chart-card q-mt-md">
          <q-card-section class="chart-section">
            <div class="empty-state">
              <q-icon name="warning" size="3rem" color="orange" class="q-mb-md" />
              <div class="empty-text">
                En az bir Konaklama Tipi ve bir Oda Tipi seçmelisiniz
              </div>
            </div>
          </q-card-section>
        </q-card>

      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import type { QPopupProxy } from 'quasar'
import axios from 'axios'
import Chart from 'chart.js/auto'
import type { LegendItem, Chart as ChartType, TooltipItem } from 'chart.js'

// Date state - başlangıç tarihi boş başlar
const startDate = ref<string>('')

// Yardımcı: Bar üstü etiketleri için K formatı (küsuratsız)
const formatToK = (n: number): string => {
  if (!isFinite(n)) return '0'
  const abs = Math.abs(n)
  if (abs >= 1000) return `${Math.round(n / 1000)}K`
  return `${Math.round(n)}`
}

// Popup references with proper typing
const startPicker = ref<QPopupProxy | null>(null)

// Chart related refs
const chartCanvas = ref<HTMLCanvasElement | null>(null)
const chartInstance = ref<ChartType | null>(null)
const chartCanvasDays = ref<HTMLCanvasElement | null>(null)
const chartInstanceDays = ref<ChartType | null>(null)
const chartCanvasAmount = ref<HTMLCanvasElement | null>(null)
const chartInstanceAmount = ref<ChartType | null>(null)
const pieChartAccommodation = ref<HTMLCanvasElement | null>(null)
const pieChartAccommodationInstance = ref<ChartType | null>(null)
const pieChartRoomType = ref<HTMLCanvasElement | null>(null)
const pieChartRoomTypeInstance = ref<ChartType | null>(null)
const chartLoading = ref(false)
const checkboxLoading = ref(false) // Checkbox değişiklik koruması

// Accommodation options
const accommodationOptions = ref([
  { value: 'GÜNLÜK', label: 'GÜNLÜK', icon: 'event', color: 'orange', selected: true },
  { value: 'HAFTALIK', label: 'HAFTALIK', icon: 'event', color: 'blue', selected: true },
  { value: 'AYLIK', label: 'AYLIK', icon: 'event', color: 'green', selected: true }
])

// Room type options
const roomTypeOptions = ref([
  { value: 'Tek Kişilik', label: 'Tek Kişilik', icon: 'person', color: 'light-blue', selected: true },
  { value: '2 Kişilik', label: '2 Kişilik', icon: 'group', color: 'green', selected: true },
  { value: '4 Kişilik', label: '4 Kişilik', icon: 'group', color: 'purple', selected: true },
  { value: 'Dormitory', label: 'Dormitory', icon: 'apartment', color: 'orange', selected: true },
  { value: 'Camsız', label: 'Camsız', icon: 'block', color: 'grey', selected: true },
  { value: 'Camlı', label: 'Camlı', icon: 'window', color: 'blue', selected: true },
  { value: '(A)', label: '(A) Tipi', icon: 'star', color: 'yellow', selected: true },
  { value: '+TV', label: '+TV Lüks', icon: 'tv', color: 'red', selected: true }
])

// Time period options
const timePeriods = ref([
  { value: 'gunler', label: 'GÜNLER', color: 'blue', selected: true },
  { value: 'haftalar', label: 'HAFTALAR', color: 'green', selected: false },
  { value: 'aylar', label: 'AYLAR', color: 'orange', selected: false },
  { value: 'ceyrekler', label: 'ÇEYREKLER', color: 'purple', selected: false },
  { value: 'yarı-yillar', label: 'YARI YILLAR', color: 'red', selected: false },
  { value: 'yillar', label: 'YILLAR', color: 'teal', selected: false }
])

// Time period selection method
const selectTimePeriod = async (periodValue: string) => {
  // Tarih seçili ise buton disabled olmalı, bu fonksiyon çalışmamalı
  if (startDate.value) {
    return
  }
  
  timePeriods.value.forEach(period => {
    period.selected = period.value === periodValue
  })
  
  // Load chart data when time period changes
  await loadChartData()
}

// Chart data loading method
const loadChartData = async () => {
  if (checkboxLoading.value) {
    console.log('⏳ Checkbox değişikliği devam ediyor, yeni istek iptal edildi')
    return
  }
  
  if (!chartCanvas.value) return
  
  // Eğer hiç seçim yoksa chart yükleme
  if (!shouldShowChart.value) {
    console.log('❌ Hiç seçim yok, chart yüklenmiyor')
    return
  }
  
  checkboxLoading.value = true
  chartLoading.value = true
  
  try {
    // Get selected accommodation types
    const selectedAccommodationTypes = accommodationOptions.value
      .filter(option => option.selected)
      .map(option => option.value)
    
    // Get selected room types
    const selectedRoomTypes = roomTypeOptions.value
      .filter(option => option.selected)
      .map(option => option.value)
    
    // Başlangıç tarihi seçili ise sadece 'gunler' periyodu kullan
    let currentTimePeriod = 'gunler'
    if (!startDate.value) {
      // Başlangıç tarihi boş ise seçili periyodu kullan
      currentTimePeriod = timePeriods.value.find(period => period.selected)?.value || 'gunler'
    }
    
    console.log('📊 Chart yükleniyor:', {
      startDate: startDate.value,
      hasStartDate: !!startDate.value,
      currentTimePeriod,
      selectedPeriods: timePeriods.value.filter(p => p.selected).map(p => p.value),
      buttonsDisabled: !!startDate.value
    })
    
    // Convert date format if start date is provided
    let sqlStartDate = ''
    if (startDate.value) {
      const convertDateForSQL = (dateString: string) => {
        const [day, month, year] = dateString.split('.')
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
      sqlStartDate = convertDateForSQL(startDate.value)
    }
    
    console.log('📅 Tarih bilgisi:', {
      original: startDate.value,
      sql: sqlStartDate,
      timePeriod: currentTimePeriod
    })
    
    // Make API call with environment variable
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
    const response = await axios.get(`${apiBaseUrl}/dashboard/chart`, {
      params: {
        timePeriod: currentTimePeriod,
        accommodationTypes: selectedAccommodationTypes.join(','),
        roomTypes: selectedRoomTypes.join(','),
        startDate: sqlStartDate  // ✅ Boş string veya dönüştürülmüş tarih
      }
    })
    
    // Debug: API response'u kontrol et
    console.log('🔍 API Response:', response)
    console.log('🔍 Response Data:', response.data)
    console.log('🔍 Data Type:', typeof response.data)
    console.log('🔍 Is Array:', Array.isArray(response.data))

    // Update chart with new data
    updateChart(response.data, currentTimePeriod)
    
    // Load pie chart data
    console.log('🥧 Bar chart yüklendi, şimdi pie chart yüklenecek...')
    console.log('🥧 shouldShowChart:', shouldShowChart.value)
    console.log('🥧 Pie chart canvas elements:', {
      accommodation: !!pieChartAccommodation.value,
      roomType: !!pieChartRoomType.value
    })
    await loadPieChartData()
    
  } catch (error) {
    console.error('Error loading chart data:', error)
  } finally {
    chartLoading.value = false
    // Minimum 1 saniye disable süresi
    setTimeout(() => {
      checkboxLoading.value = false
    }, 1000)
  }
}

// Chart update method
const updateChart = (data: Array<{ Date?: string; Year?: number; WeekNumber?: number; MonthNumber?: number; QuarterNumber?: number; HalfYear?: number; Count: number; TotalDays: number; TotalAmount?: number }>, timePeriod: string) => {
  console.log('🎨 updateChart çağrıldı:', { dataLength: data?.length, timePeriod, hasCanvas: !!chartCanvas.value })
  
  if (!chartCanvas.value) {
    console.error('❌ Canvas bulunamadı!')
    return
  }
  
  // Data validation ekle
  if (!data || !Array.isArray(data)) {
    console.error('❌ Invalid chart data:', data)
    return
  }
  
  if (data.length === 0) {
    console.log('ℹ️ Chart data boş')
    return
  }
  
  // Destroy existing charts if exist
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
  if (chartInstanceDays.value) {
    chartInstanceDays.value.destroy()
  }
  if (chartInstanceAmount.value) {
    chartInstanceAmount.value.destroy()
  }
  
  // Prepare chart data
  const labels = data.map(item => {
    switch (timePeriod) {
      case 'gunler':
        return item.Date ? new Date(item.Date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) : 'N/A'
      case 'haftalar':
        return item.Year && item.WeekNumber ? `${item.Year}-H${item.WeekNumber}` : 'N/A'
      case 'aylar':
        return item.Year && item.MonthNumber ? new Date(item.Year, item.MonthNumber - 1).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }) : 'N/A'
      case 'ceyrekler':
        return item.Year && item.QuarterNumber ? `${item.Year}-Q${item.QuarterNumber}` : 'N/A'
      case 'yarı-yillar':
        return item.Year && item.HalfYear ? `${item.Year}-Y${item.HalfYear}` : 'N/A'
      case 'yillar':
        return item.Year ? item.Year.toString() : 'N/A'
      default:
        return item.Date || item.Year || 'N/A'
    }
  })  // ✅ reverse() kaldırıldı - tarihi artan sırada göster
  
  const counts = data.map(item => item.Count)  // ✅ reverse() kaldırıldı
  const totalDays = data.map(item => item.TotalDays)  // Konaklama günleri
  const totalAmount = data.map(item => Number(item.TotalAmount || 0)) // Toplam tutar
  
  // Create new chart
  const ctx = chartCanvas.value.getContext('2d')
  if (ctx) {
    chartInstance.value = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Konaklama Sayısı',
          data: counts,
          backgroundColor: [
            'rgba(54, 162, 235, 0.85)',
            'rgba(255, 99, 132, 0.85)',
            'rgba(255, 205, 86, 0.85)',
            'rgba(75, 192, 192, 0.85)',
            'rgba(153, 102, 255, 0.85)',
            'rgba(255, 159, 64, 0.85)',
            'rgba(201, 203, 207, 0.85)',
            'rgba(255, 99, 255, 0.85)',
            'rgba(99, 255, 132, 0.85)',
            'rgba(132, 99, 255, 0.85)',
            'rgba(255, 132, 99, 0.85)',
            'rgba(99, 132, 255, 0.85)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(201, 203, 207, 1)',
            'rgba(255, 99, 255, 1)',
            'rgba(99, 255, 132, 1)',
            'rgba(132, 99, 255, 1)',
            'rgba(255, 132, 99, 1)',
            'rgba(99, 132, 255, 1)'
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          title: {
            display: true,
            text: 'Konaklama Sayısı',
            color: '#ffffff',
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: {
              top: 2,
              bottom: 10
            },
            align: 'start'
          },
          legend: {
            display: false
          },
                          tooltip: {
                  enabled: false // Tooltip'leri devre dışı bırak
                }
        },
        scales: {
          x: {
            ticks: {
              color: '#ffffff',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#ffffff',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              lineWidth: 1
            }
          }
        },
        animation: {
          duration: 1200,
          easing: 'easeInOutQuart'
        }
      },
      plugins: [{
        // Custom plugin for data labels (bar üstünde sayılar)
        id: 'dataLabels',
        afterDatasetsDraw: function(chart: ChartType) {
          const ctx = chart.ctx
          chart.data.datasets.forEach((dataset: unknown, i: number) => {
            const meta = chart.getDatasetMeta(i)
            if (!meta.hidden) {
              meta.data.forEach((element: unknown, index: number) => {
                const point = element as { x: number; y: number }
                if (point && point.x !== undefined && point.y !== undefined) {
                  // 3D shadow effect için gölge
                  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
                  ctx.shadowOffsetX = 2
                  ctx.shadowOffsetY = 2
                  ctx.shadowBlur = 4
                  
                  // Bar üstünde beyaz sayılar
                  ctx.fillStyle = '#ffffff'
                  ctx.font = 'bold 13px Arial'
                  ctx.textAlign = 'center'
                  ctx.textBaseline = 'bottom'
                  
                  const series = dataset as { data: Array<number | string> }
                  const dataValue = Number(series.data[index] ?? 0)
                  if (dataValue !== null && dataValue !== undefined) {
                    const dataString = formatToK(dataValue)
                    ctx.fillText(dataString, point.x, point.y - 8)
                  }
                  
                  // Shadow'u temizle
                  ctx.shadowColor = 'transparent'
                  ctx.shadowOffsetX = 0
                  ctx.shadowOffsetY = 0
                  ctx.shadowBlur = 0
                }
              })
            }
          })
        }
      }]
    })
  }

  // Create second chart for total days
  const ctxDays = chartCanvasDays.value?.getContext('2d')
  if (ctxDays) {
    chartInstanceDays.value = new Chart(ctxDays, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Konaklama Günleri',
          data: totalDays,
          backgroundColor: [
            'rgba(34, 197, 94, 0.85)',
            'rgba(168, 85, 247, 0.85)',
            'rgba(251, 146, 60, 0.85)',
            'rgba(14, 165, 233, 0.85)',
            'rgba(236, 72, 153, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(139, 92, 246, 0.85)',
            'rgba(239, 68, 68, 0.85)',
            'rgba(16, 185, 129, 0.85)',
            'rgba(99, 102, 241, 0.85)',
            'rgba(217, 70, 239, 0.85)',
            'rgba(6, 182, 212, 0.85)'
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(168, 85, 247, 1)',
            'rgba(251, 146, 60, 1)',
            'rgba(14, 165, 233, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(99, 102, 241, 1)',
            'rgba(217, 70, 239, 1)',
            'rgba(6, 182, 212, 1)'
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          title: {
            display: true,
            text: 'Toplam Konaklama Günleri',
            color: '#ffffff',
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: {
              top: 2,
              bottom: 10
            },
            align: 'start'
          },
          legend: {
            display: false
          },
                              tooltip: {
                      enabled: false // Tooltip'leri devre dışı bırak
                    }
        },
        scales: {
          x: {
            ticks: {
              color: '#ffffff',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#ffffff',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              lineWidth: 1
            }
          }
        },
        animation: {
          duration: 1200,
          easing: 'easeInOutQuart'
        }
      },
      plugins: [{
        // Custom plugin for data labels (bar üstünde sayılar)
        id: 'dataLabelsDays',
        afterDatasetsDraw: function(chart: ChartType) {
          const ctx = chart.ctx
          chart.data.datasets.forEach((dataset: unknown, i: number) => {
            const meta = chart.getDatasetMeta(i)
            if (!meta.hidden) {
              meta.data.forEach((element: unknown, index: number) => {
                const point = element as { x: number; y: number }
                if (point && point.x !== undefined && point.y !== undefined) {
                  // 3D shadow effect için gölge
                  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
                  ctx.shadowOffsetX = 2
                  ctx.shadowOffsetY = 2
                  ctx.shadowBlur = 4
                  
                  // Bar üstünde beyaz sayılar
                  ctx.fillStyle = '#ffffff'
                  ctx.font = 'bold 13px Arial'
                  ctx.textAlign = 'center'
                  ctx.textBaseline = 'bottom'
                  
                  const series = dataset as { data: Array<number | string> }
                  const dataValue = Number(series.data[index] ?? 0)
                  if (dataValue !== null && dataValue !== undefined) {
                    const dataString = formatToK(dataValue)
                    ctx.fillText(dataString, point.x, point.y - 8)
                  }
                  
                  // Shadow'u temizle
                  ctx.shadowColor = 'transparent'
                  ctx.shadowOffsetX = 0
                  ctx.shadowOffsetY = 0
                  ctx.shadowBlur = 0
                }
              })
            }
          })
        }
      }]
    })
  }

  // Create third chart for total amount
  const ctxAmount = chartCanvasAmount.value?.getContext('2d')
  if (ctxAmount) {
    chartInstanceAmount.value = new Chart(ctxAmount, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Toplam Tutar (₺)',
          data: totalAmount,
          backgroundColor: [
            'rgba(59, 130, 246, 0.85)',
            'rgba(16, 185, 129, 0.85)',
            'rgba(234, 179, 8, 0.85)',
            'rgba(99, 102, 241, 0.85)',
            'rgba(244, 63, 94, 0.85)',
            'rgba(52, 211, 153, 0.85)',
            'rgba(250, 204, 21, 0.85)',
            'rgba(147, 51, 234, 0.85)',
            'rgba(251, 113, 133, 0.85)',
            'rgba(20, 184, 166, 0.85)',
            'rgba(99, 102, 241, 0.85)',
            'rgba(234, 179, 8, 0.85)'
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(234, 179, 8, 1)',
            'rgba(99, 102, 241, 1)',
            'rgba(244, 63, 94, 1)',
            'rgba(52, 211, 153, 1)',
            'rgba(250, 204, 21, 1)',
            'rgba(147, 51, 234, 1)',
            'rgba(251, 113, 133, 1)',
            'rgba(20, 184, 166, 1)',
            'rgba(99, 102, 241, 1)',
            'rgba(234, 179, 8, 1)'
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          title: {
            display: true,
            text: 'Toplam Konaklama Tutarı',
            color: '#ffffff',
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: { top: 2, bottom: 10 },
            align: 'start'
          },
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: {
            ticks: { color: '#ffffff', font: { size: 12, weight: 'bold' } },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#ffffff', font: { size: 12, weight: 'bold' } },
            grid: { color: 'rgba(255, 255, 255, 0.1)', lineWidth: 1 }
          }
        },
        animation: { duration: 1200, easing: 'easeInOutQuart' }
      },
      plugins: [{
        id: 'dataLabelsAmount',
        afterDatasetsDraw: function(chart: ChartType) {
          const ctx = chart.ctx
          // Değerleri K formatında (küsuratsız) yaz
          chart.data.datasets.forEach((dataset: unknown, i: number) => {
            const meta = chart.getDatasetMeta(i)
            if (!meta.hidden) {
              meta.data.forEach((element: unknown, index: number) => {
                const point = element as { x: number; y: number }
                if (point && point.x !== undefined && point.y !== undefined) {
                  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
                  ctx.shadowOffsetX = 2
                  ctx.shadowOffsetY = 2
                  ctx.shadowBlur = 4

                  ctx.fillStyle = '#ffffff'
                  ctx.font = 'bold 12px Arial'
                  ctx.textAlign = 'center'
                  ctx.textBaseline = 'bottom'

                  const series = dataset as { data: Array<number | string> }
                  const dataValue = Number(series.data[index] ?? 0)
                  const dataString = formatToK(dataValue)
                  ctx.fillText(dataString, point.x, point.y - 8)

                  ctx.shadowColor = 'transparent'
                  ctx.shadowOffsetX = 0
                  ctx.shadowOffsetY = 0
                  ctx.shadowBlur = 0
                }
              })
            }
          })
        }
      }]
    })
  }
}

// Watch for checkbox changes to reload chart
watch([accommodationOptions, roomTypeOptions], async () => {
  await loadChartData()
}, { deep: true })

// Watch for start date changes
watch(startDate, async (newDate) => {
  if (newDate) {
    // Tarih seçildiğinde tüm periyot butonlarını deaktive et
    timePeriods.value.forEach(period => {
      period.selected = false
    })
    console.log('📅 Tarih seçildi, butonlar deaktive edildi:', newDate)
  } else {
    // Tarih temizlendiğinde GÜNLER butonunu aktive et
    timePeriods.value.forEach(period => {
      period.selected = period.value === 'gunler'
    })
    console.log('📅 Tarih temizlendi, GÜNLER aktive edildi')
  }
  await loadChartData()
})

// Date picker options - bugünden 12 gün öncesine kadar seçilebilir
const dateOptions = (date: string) => {
  const today = new Date()
  today.setHours(23, 59, 59, 999) // Bugünün sonuna ayarla
  
  // 12 gün öncesine kadar seçilebilir (28 Ağustos - 12 = 16 Ağustos ve öncesi)
  const maxSelectableDate = new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000)
  
  // date formatı "YYYY/MM/DD" şeklinde geliyor
  const selectedDate = new Date(date)
  
  console.log('📅 Date picker kontrolü:', {
    date,
    selectedDate: selectedDate.toISOString().split('T')[0],
    maxSelectableDate: maxSelectableDate.toISOString().split('T')[0],
    canSelect: selectedDate <= maxSelectableDate
  })
  
  return selectedDate <= maxSelectableDate
}

// Clear start date function
const clearStartDate = () => {
  startDate.value = ''
  // Chart watch tarafından otomatik yüklenecek ve GÜNLER seçili olacak
  console.log('🧹 Başlangıç tarihi temizlendi')
}

// Dashboard başlatma işlemleri
onMounted(async () => {
  console.log('Dashboard sayfası yüklendi - Filtre container hazır')
  
  // Load initial chart data
  await loadChartData()
})

// Computed properties for select all functionality
const allAccommodationSelected = computed({
  get: () => accommodationOptions.value.every(option => option.selected),
  set: (value: boolean) => {
    accommodationOptions.value.forEach(option => option.selected = value)
  }
})

const allRoomTypesSelected = computed({
  get: () => roomTypeOptions.value.every(option => option.selected),
  set: (value: boolean) => {
    roomTypeOptions.value.forEach(option => option.selected = value)
  }
})

// Chart gösterilmesi gerekip gerekmediğini kontrol et
const shouldShowChart = computed(() => {
  const hasAccommodationSelected = accommodationOptions.value.some(option => option.selected)
  const hasRoomTypeSelected = roomTypeOptions.value.some(option => option.selected)
  return hasAccommodationSelected && hasRoomTypeSelected
})

// Methods for select all functionality
const toggleAllAccommodation = async (value: boolean) => {
  accommodationOptions.value.forEach(option => option.selected = value)
  console.log('🔄 All accommodation selection değişti:', value)
  // DOM güncellemesini bekle
  await nextTick()
  await loadChartData()
}

const toggleAllRoomTypes = async (value: boolean) => {
  roomTypeOptions.value.forEach(option => option.selected = value)
  console.log('🔄 All room types selection değişti:', value)
  // DOM güncellemesini bekle
  await nextTick()
  await loadChartData()
}

// Methods for individual selection updates
const updateAccommodationSelection = async () => {
  console.log('🔄 Accommodation selection değişti')
  // DOM güncellemesini bekle
  await nextTick()
  await loadChartData()
}

const updateRoomTypeSelection = async () => {
  console.log('🔄 Room type selection değişti')
  // DOM güncellemesini bekle
  await nextTick()
  await loadChartData()
}

// Load pie chart data from API
const loadPieChartData = async () => {
  try {
    // Get selected accommodation types
    const selectedAccommodationTypes = accommodationOptions.value
      .filter(option => option.selected)
      .map(option => option.value)
    
    // Get selected room types
    const selectedRoomTypes = roomTypeOptions.value
      .filter(option => option.selected)
      .map(option => option.value)
    
    // Başlangıç tarihi seçili ise sadece 'gunler' periyodu kullan
    let currentTimePeriod = 'gunler'
    if (!startDate.value) {
      // Başlangıç tarihi boş ise seçili periyodu kullan
      currentTimePeriod = timePeriods.value.find(period => period.selected)?.value || 'gunler'
    }
    
    console.log('🥧 Loading pie chart data:', { 
      accommodationTypes: selectedAccommodationTypes.join(','),
      roomTypes: selectedRoomTypes.join(','),
      timePeriod: currentTimePeriod,
      startDate: startDate.value
    })
    
    // API base URL fallback ve başlangıç tarihini SQL formatına çevir
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
    let sqlStartDateForPie = ''
    if (startDate.value) {
      const [day, month, year] = startDate.value.split('.')
      sqlStartDateForPie = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    console.log('🥧 API URL:', `${apiBaseUrl}/dashboard/pie-data`)
    const response = await axios.get(`${apiBaseUrl}/dashboard/pie-data`, {
      params: {
        timePeriod: currentTimePeriod,
        accommodationTypes: selectedAccommodationTypes.join(','),
        roomTypes: selectedRoomTypes.join(','),
        startDate: sqlStartDateForPie
      }
    })
    
    console.log('🥧 Pie chart API Response:', response.data)
    
    // Update pie charts
    updatePieCharts(response.data)
    
  } catch (error) {
    console.error('🥧 Error loading pie chart data:', error)
    if (error instanceof Error) {
      // Axios error has additional properties
      const axiosError = error as Error & {
        response?: { data: unknown; status: number }
        config?: { url: string }
      }
      console.error('🥧 Error details:', {
        message: error.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
        url: axiosError.config?.url
      })
    }
  }
}

// Update pie charts
const updatePieCharts = (data: { accommodation: Array<{ Type: string; Count: number }>, roomType: Array<{ Type: string; Count: number }> }) => {
  console.log('🥧 updatePieCharts çağrıldı:', data)
  console.log('🥧 Accommodation data length:', data.accommodation?.length || 0)
  console.log('🥧 Room type data length:', data.roomType?.length || 0)
  console.log('🥧 Pie chart elements ready:', {
    accommodation: !!pieChartAccommodation.value,
    roomType: !!pieChartRoomType.value
  })
  
  // Destroy existing pie charts
  if (pieChartAccommodationInstance.value) {
    pieChartAccommodationInstance.value.destroy()
  }
  if (pieChartRoomTypeInstance.value) {
    pieChartRoomTypeInstance.value.destroy()
  }
  
  // Create accommodation pie chart
  if (pieChartAccommodation.value && data.accommodation.length > 0) {
    const accommodationCtx = pieChartAccommodation.value.getContext('2d')
    if (accommodationCtx) {
      
      pieChartAccommodationInstance.value = new Chart(accommodationCtx, {
        type: 'pie',
        data: {
          labels: data.accommodation.map(item => item.Type),
          datasets: [{
            data: data.accommodation.map(item => item.Count),
            backgroundColor: [
              '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          radius: '100%',
          plugins: {
            title: {
              display: true,
              text: 'Konaklama Tipi Dağılımı',
              color: '#ffffff',
              font: { size: 14, weight: 'bold' },
              padding: { top: 2, bottom: 10 }
            },
            legend: {
              position: 'bottom',
              labels: {
                color: '#ffffff',
                font: { size: 11 },
                padding: 15,
                boxWidth: 25,
                generateLabels(chart: ChartType) {
                  const dataset = chart.data.datasets?.[0]
                  const values = (dataset?.data || []) as unknown as Array<number>
                  const totalLocal = values.reduce((s, v) => s + Number(v || 0), 0)
                  const base: LegendItem[] = (Chart.defaults.plugins.legend.labels.generateLabels as (c: unknown) => LegendItem[])(chart as unknown)
                  return base.map((item, i) => {
                    const baseLabel = chart.data.labels?.[i]
                    const labelStr = typeof baseLabel === 'string' || typeof baseLabel === 'number' ? String(baseLabel) : ''
                    const value = Number(values[i] || 0)
                    const pctNum = totalLocal > 0 ? (value / totalLocal) * 100 : 0
                    const pctText = ` (${pctNum.toFixed(1)}%)`
                    return { ...item, text: `${labelStr} — ${value}${pctText}` } as LegendItem
                  })
                }
              }
            },
            tooltip: {
              enabled: true,
              callbacks: {
                label(context: TooltipItem<'pie'>) {
                  const dataset = context.dataset
                  const rawValues = (dataset.data ?? []) as Array<number | string>
                  const values = rawValues.map(v => Number(v ?? 0))
                  const total: number = values.reduce((sum: number, v: number) => sum + v, 0)
                  const value: number = Number((context.parsed as unknown) ?? 0)
                  const pct: number = total > 0 ? (value / total) * 100 : 0
                  const label = typeof context.label === 'string' || typeof context.label === 'number' ? String(context.label) : ''
                  return `${label}: ${value} (${pct.toFixed(1)}%)`
                }
              }
            }
          },
          animation: {
            duration: 1200,
            easing: 'easeInOutQuart'
          }
        },
        plugins: []
      })
    }
  }
  
  // Create room type pie chart
  if (pieChartRoomType.value && data.roomType.length > 0) {
    const roomTypeCtx = pieChartRoomType.value.getContext('2d')
    if (roomTypeCtx) {
      
      pieChartRoomTypeInstance.value = new Chart(roomTypeCtx, {
        type: 'pie',
        data: {
          labels: data.roomType.map(item => item.Type),
          datasets: [{
            data: data.roomType.map(item => item.Count),
            backgroundColor: [
              '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E'
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          radius: '100%',
          plugins: {
            title: {
              display: true,
              text: 'Oda Tipi Dağılımı',
              color: '#ffffff',
              font: { size: 14, weight: 'bold' },
              padding: { top: 2, bottom: 10 }
            },
            legend: {
              position: 'bottom',
              labels: {
                color: '#ffffff',
                font: { size: 12 },
                padding: 15,
                boxWidth: 25,
                generateLabels(chart: ChartType) {
                  const dataset = chart.data.datasets?.[0]
                  const values = (dataset?.data || []) as unknown as Array<number>
                  const totalLocal = values.reduce((s, v) => s + Number(v || 0), 0)
                  const base: LegendItem[] = (Chart.defaults.plugins.legend.labels.generateLabels as (c: unknown) => LegendItem[])(chart as unknown)
                  return base.map((item, i) => {
                    const baseLabel = chart.data.labels?.[i]
                    const labelStr = typeof baseLabel === 'string' || typeof baseLabel === 'number' ? String(baseLabel) : ''
                    const value = Number(values[i] || 0)
                    const pctNum = totalLocal > 0 ? (value / totalLocal) * 100 : 0
                    const pctText = ` (${pctNum.toFixed(1)}%)`
                    return { ...item, text: `${labelStr} — ${value}${pctText}` } as LegendItem
                  })
                }
              }
            },
            tooltip: {
              enabled: true,
              callbacks: {
                label(context: TooltipItem<'pie'>) {
                  const dataset = context.dataset
                  const rawValues = (dataset.data ?? []) as Array<number | string>
                  const values = rawValues.map(v => Number(v ?? 0))
                  const total: number = values.reduce((sum: number, v: number) => sum + v, 0)
                  const value: number = Number((context.parsed as unknown) ?? 0)
                  const pct: number = total > 0 ? (value / total) * 100 : 0
                  const label = typeof context.label === 'string' || typeof context.label === 'number' ? String(context.label) : ''
                  return `${label}: ${value} (${pct.toFixed(1)}%)`
                }
              }
            }
          },
          animation: {
            duration: 1200,
            easing: 'easeInOutQuart'
          }
        },
        plugins: []
      })
    }
  }
}

// Dashboard başlatma işlemleri
onMounted(() => {
  console.log('Dashboard sayfası yüklendi - Filtre container hazır')
})

// Pie legend yüzde gösterimi: tüm öğeler için göster
</script>

<style scoped>
.dashboard-page {
  background: #2d3748;
  min-height: 100vh;
}

.dashboard-container {
  max-width: 1200px;
  margin: 0;
  padding-left: 1rem;
}

.dashboard-content {
  display: flex;
  justify-content: flex-start;
  width: 100%;
}

.dashboard-single-column {
  width: 100%;
  max-width: 220px;
}

.time-period-container {
  flex: 1;
  padding-left: 20px;
  min-width: 600px;
  max-width: 600px;
  max-height: 25px;
}

.pie-charts-top-container {
  display: flex;
  gap: 1rem;
  flex: 1;
  min-width: 650px;
  margin-left: 39rem;
  margin-top: -1.5rem;
}

/* Controls removed */

.pie-chart-top {
  flex: 1;
  min-width: 370px;
  width: 370px;
  min-height: 380px;
  height: 380px;
}

.pie-chart-top .chart-container {
  height: 300px;
  width: 100%;
}

.pie-chart-top .chart-container canvas {
  width: 100% !important;
  height: 100% !important;
}

.chart-card {
  background: #4a5568;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.chart-section {
  padding: 16px;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.chart-title {
  color: #ffffff;
  font-weight: 600;
  font-size: 1rem;
}

.chart-container {
  height: 300px;
  position: relative;
}

.time-period-card {
  background: #4a5568;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  height: fit-content;
}

.time-period-section {
  padding: 12px;
}

.time-period-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.time-period-btn {
  flex: 1;
  min-width: 80px;
  max-width: 130px;
  height: 36px;
  font-size: 0.8rem;
  font-weight: 900;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.time-period-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.time-btn-active {
  background: rgba(255, 255, 255, 0.2) !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
}

.filter-container-card {
  background: #4a5568;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.4rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  max-height: 25px;
}

.section-title {
  color: #ffffff;
  font-weight: 500;
  font-size: 0.9rem;
}

.date-selection-section {
  background-color: #5a6c7d;
  border-radius: 12px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.date-label {
  color: #e2e8f0;
  font-size: 0.75rem;
  margin-bottom: 0.2rem;
  font-weight: 500;
}

.date-input {
  background: #4a5568;
}

.date-input :deep(.q-field__control) {
  background: #4a5568;
  color: #ffffff;
}

.date-input :deep(.q-field__native) {
  color: #ffffff;
  font-weight: bold;
  font-size: 0.9rem;
}

.date-icon {
  color: #63b3ed;
}

.date-icon.disabled {
  color: #718096;
  cursor: not-allowed;
}

.accommodation-section,
.room-section {
  background-color: #5a6c7d;
  border-radius: 8px;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.options-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  color: #ffffff;
  font-weight: 500;
  max-height: 40px;
  transition: background-color 0.2s ease;
}

.option-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.option-item.selected {
  background: rgba(59, 130, 246, 0.25);
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.option-item.selected:hover {
  background: rgba(59, 130, 246, 0.35);
  border-color: rgba(59, 130, 246, 0.5);
}

/* Empty state styles */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: #e2e8f0;
}

.empty-text {
  font-size: 1.1rem;
  font-weight: 500;
  color: #cbd5e0;
}

/* Bar charts container - alt alta düzen */
.bar-charts-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-left: -85rem;
  margin-top: 4.9rem;
  min-width: 581px;
  max-width: 581px;
}

.bar-chart-single {
  width: 100%;
}

.bar-charts-row {
  display: flex;
  gap: 1.4rem;
  margin-bottom: -15px;
}

.bar-chart-left {
  flex: 1;
  min-width: 581px;
  min-height: 200px;
  margin-top: -7px;
  margin-bottom: 10px;
}

.bar-chart-right {
  flex: 1.4; /* sağ grafiği daha geniş yap */
  min-width: 760px;
  min-height: 200px;
  margin-top: -37px;
  margin-bottom: 10px;
}

.bar-chart-single:last-child {
  margin-bottom: 0;
}

/* Charts row layout - eski yapı için korundu */
.charts-row {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  width: 100%;
}

.bar-chart {
  flex: 1.5;
  min-width: 0;
  min-height: 400px;
}

.pie-charts-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 350px;
  min-height: 360px;
  height: 360px;
}

.pie-chart {
  min-height: 360px;
  height: 360px;
}

.pie-chart .chart-container {
  height: 360px;
  width: 100%;
}

/* Responsive design */
@media (max-width: 1200px) {
  .top-row-container {
    flex-direction: column;
  }
  
  .pie-charts-top-container {
    min-width: auto;
  }
  
  .bar-charts-container {
    width: 100%;
  }
  
  .charts-row {
    flex-direction: column;
  }
  
  .pie-charts-container {
    flex-direction: row;
    gap: 1rem;
    min-width: auto;
  }
  
  .pie-chart {
    flex: 1;
    min-height: 360px;
    height: 360px;
  }
  
  .pie-chart .chart-container {
    height: 360px;
  }
  .pie-chart .chart-container canvas { width: 100% !important; height: 100% !important; }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .dashboard-single-column {
    max-width: 100%;
  }

  .top-row-container {
    flex-direction: column;
  }

  .pie-charts-top-container {
    flex-direction: column;
  }

  .charts-row {
    flex-direction: column;
  }

  .pie-charts-container {
    flex-direction: column;
  }
  
  .pie-chart {
    min-height: 360px;
    height: 360px;
  }
  
  .pie-chart .chart-container {
    height: 360px;
  }
  .pie-chart .chart-container canvas { width: 100% !important; height: 100% !important; }
}
</style>
