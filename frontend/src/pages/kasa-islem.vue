<template>
  <q-page class="q-pa-md light-page-background">
    <!-- Ana Container - İki Sütunlu Layout -->
    <div class="ana-container">
      <div class="layout-grid">
        
                 <!-- Sol Sütun - Radio Button Grupları -->
         <div class="left-column">
                        <q-card class="main-card">
               <q-card-section>
                 <div class="text-h6 q-mb-md text-center">Kasa İşlemleri</div>
                 
                 <!-- Veriyi Yenile Butonu -->
                 <div class="text-center q-mb-md">
                   <q-btn 
                     color="warning" 
                     icon="refresh" 
                     label="VERİYİ YENİLE" 
                     size="md"
                     class="refresh-btn"
                     style="font-size: 12px !important;"
                     @click="refreshData"
                   />
                 </div>
                 
                 <!-- Dış Container -->
                 <div class="radio-groups-container">
                
                <!-- İlk Radio Button Grubu - İşlem Türü -->
                <div class="radio-group-container">
                  <div class="radio-group">
                    <div class="radio-options">
                      <q-radio v-model="selectedIslemTuru" val="cari" label="Cari" @update:model-value="onIslemTuruChange" />
                      <q-radio v-model="selectedIslemTuru" val="nakit" label="Nakit" @update:model-value="onIslemTuruChange" />
                      <q-radio v-model="selectedIslemTuru" val="kart" label="Kart" @update:model-value="onIslemTuruChange" />
                      <q-radio v-model="selectedIslemTuru" val="eft" label="EFT" @update:model-value="onIslemTuruChange" />
                      <q-radio v-model="selectedIslemTuru" val="acenta" label="Acenta" @update:model-value="onIslemTuruChange" />
                      <q-radio v-model="selectedIslemTuru" val="depozito" label="Depozito" @update:model-value="onIslemTuruChange" />
                    </div>
                  </div>
                </div>

                <!-- İkinci Radio Button Grubu - Gelir/Gider veya Giren/Çıkan -->
                <div class="radio-group-container second-radio-group">
                  <div class="radio-group">
                    <div class="radio-options">
                      <q-radio v-model="selectedIslemYonu" val="gelir" :label="firstOptionLabel" />
                      <q-radio v-model="selectedIslemYonu" val="gider" :label="secondOptionLabel" />
                    </div>
                  </div>
                </div>

                <!-- Kasalar Arası Aktarım Bölümü -->
                <div class="transfer-container">
                  <div class="transfer-header">
                    <div class="transfer-title">Kasalar Arası Aktarım</div>
                  </div>
                  <div class="transfer-form">
                    <div class="form-row">
                      <div class="form-label">Veren</div>
                      <q-select 
                        v-model="transferForm.veren" 
                        :options="kasaOptions"
                        outlined 
                        dense 
                        placeholder="Veren kasa seçin"
                        class="transfer-input"
                        emit-value
                        map-options
                      />
                    </div>
                    <div class="form-row">
                      <div class="form-label">Alan</div>
                      <q-select 
                        v-model="transferForm.alan" 
                        :options="kasaOptions"
                        outlined 
                        dense 
                        placeholder="Alan kasa seçin"
                        class="transfer-input"
                        emit-value
                        map-options
                      />
                    </div>
                    <div class="form-row">
                      <div class="form-label">Tutar</div>
                      <q-input 
                        v-model="transferForm.tutar" 
                        outlined 
                        dense 
                        placeholder="0.00"
                        type="number"
                        class="transfer-input"
                      />
                    </div>
                    <div class="form-row">
                      <q-btn 
                        color="primary" 
                        label="AKTAR" 
                        @click="performTransfer"
                        class="transfer-button"
                        size="md"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </q-card-section>
          </q-card>
        </div>

                 <!-- Sağ Sütun - İki Tablo -->
         <div class="right-column">
           <div class="tables-grid">
             <!-- Sol Tablo - Günlük Toplamlar -->
             <q-card class="main-card">
               <q-card-section>
                 <!-- Bakiye Label -->
                 <div class="bakiye-label q-mb-sm">
                   <q-chip 
                     :color="bakiyeLabelText.includes('Güncel Bakiye') ? 'green' : 'orange'" 
                     text-color="white"
                     :label="bakiyeLabelText"
                     class="text-weight-medium"
                   />
                 </div>
                 
                 <!-- Ana Grid Tablo Container -->
                 <div class="main-table-container">
                   <div class="table-container">
                     <q-table
                       :rows="tableData"
                       :columns="columns"
                       :loading="loading"
                       :pagination="pagination"
                       row-key="tarih"
                       flat
                       bordered
                       class="kasa-table"
                       :rows-per-page-options="[7]"
                       :rows-per-page-label="''"
                       :pagination-label="() => ''"
                       :server-side="false"
                       :hide-pagination="true"
                       :rows-per-page="7"
                       @request="onRequest"
                     >
                       <!-- Satır template'i -->
                       <template v-slot:body="props">
                         <q-tr 
                           :props="props" 
                           :class="{ 'selected-row': props.row.tarih === selectedDate }"
                           @click="onRowClick($event, props.row)"
                         >
                           <q-td key="tarih" :props="props" class="cursor-pointer">
                             {{ formatDate(props.row.tarih) }}
                           </q-td>
                           <q-td key="gelir" :props="props" class="text-positive">
                             {{ formatCurrency(props.row.gelir) }}
                           </q-td>
                           <q-td key="gider" :props="props" class="text-negative">
                             {{ formatCurrency(props.row.gider) }}
                           </q-td>
                         </q-tr>
                       </template>
                     </q-table>
                     
                     <!-- Özel Pagination Butonları -->
                     <div class="custom-pagination">
                       <q-btn 
                         :disable="pagination.page <= 1" 
                         @click="changePage(pagination.page - 1)"
                         color="primary"
                         icon="chevron_left"
                         size="sm"
                       />
                       <span class="pagination-info">
                         Sayfa {{ pagination.page }} / {{ Math.ceil(pagination.rowsNumber / pagination.rowsPerPage) }}
                       </span>
                       <q-btn 
                         :disable="pagination.page >= Math.ceil(pagination.rowsNumber / pagination.rowsPerPage)" 
                         @click="changePage(pagination.page + 1)"
                         color="primary"
                         icon="chevron_right"
                         size="sm"
                       />
                     </div>
                   </div>
                   
                   <!-- Kasa Devir Tablo Container -->
                   <div class="kasa-devir-container">
                     <div class="kasa-devir-header">
                       <q-btn 
                         color="primary" 
                         icon="account_balance_wallet" 
                         label="KASA DEVRET" 
                         size="md"
                         class="kasa-devir-btn"
                          @click="onKasaDevretClick"
                       />
                     </div>
                     
                     <div class="kasa-devir-table-container">
                       <q-table
                         :rows="kasaDevirData"
                         :columns="kasaDevirColumns"
                         :loading="kasaDevirLoading"
                         :pagination="kasaDevirPagination"
                         row-key="DevirTarihi"
                         flat
                         bordered
                         class="kasa-devir-table"
                         :rows-per-page-options="[3]"
                         :rows-per-page-label="''"
                         :pagination-label="() => ''"
                         :server-side="true"
                         :hide-pagination="true"
                         :rows-per-page="3"
                         @request="onKasaDevirRequest"
                       >
                         <template v-slot:body-cell-DevirTarihi="props">
                           <q-td :props="props">
                             <span class="text-weight-medium">
                               {{ formatDate(props.value) }}
                             </span>
                           </q-td>
                         </template>
                         
                         <template v-slot:body-cell-KasaYekun="props">
                           <q-td :props="props">
                             <span class="text-weight-medium">
                               {{ formatCurrency(props.value) }}
                             </span>
                           </q-td>
                         </template>
                       </q-table>
                       
                       <!-- Kasa Devir Özel Pagination Butonları -->
                       <div class="custom-pagination">
                         <q-btn 
                           :disable="kasaDevirPagination.page <= 1" 
                           @click="changeKasaDevirPage(kasaDevirPagination.page - 1)"
                           color="primary"
                           icon="chevron_left"
                           size="sm"
                         />
                         <span class="pagination-info">
                           Sayfa {{ kasaDevirPagination.page }} / {{ Math.ceil(kasaDevirPagination.rowsNumber / kasaDevirPagination.rowsPerPage) }}
                         </span>
                         <q-btn 
                           :disable="kasaDevirPagination.page >= Math.ceil(kasaDevirPagination.rowsNumber / kasaDevirPagination.rowsPerPage)" 
                           @click="changeKasaDevirPage(kasaDevirPagination.page + 1)"
                           color="primary"
                           icon="chevron_right"
                           size="sm"
                         />
                       </div>
                     </div>
                   </div>
                 </div>
               </q-card-section>
             </q-card>

             <!-- Sağ Tablo - Detay İşlemler -->
             <q-card class="main-card">
               <q-card-section>
                 <div class="table-container">
                                       <q-table
                      :rows="detailTableData"
                      :columns="detailColumns"
                      :loading="detailLoading"
                      :pagination="detailPagination"
                      row-key="id"
                      flat
                      bordered
                      class="kasa-table detail-table"
                                             :rows-per-page-options="[15]"
                       :rows-per-page-label="''"
                       :pagination-label="() => ''"
                       :server-side="true"
                       :hide-pagination="true"
                       :rows-per-page="15"
                       @request="onDetailRequest"
                    >
                     <!-- Tarih Sütunu -->
                     <template v-slot:body-cell-iKytTarihi="props">
                       <q-td :props="props">
                         {{ formatDate(props.value) }}
                       </q-td>
                     </template>

                     <!-- Tutar Sütunu -->
                     <template v-slot:body-cell-islemTutar="props">
                       <q-td :props="props" class="text-weight-medium">
                         {{ formatCurrency(props.value) }}
                       </q-td>
                     </template>
                   </q-table>
                   
                   <!-- Detay Tablo Özel Pagination Butonları -->
                   <div class="custom-pagination">
                     <q-btn 
                       :disable="detailPagination.page <= 1" 
                       @click="changeDetailPage(detailPagination.page - 1)"
                       color="primary"
                       icon="chevron_left"
                       size="sm"
                     />
                     <span class="pagination-info">
                       Sayfa {{ detailPagination.page }} / {{ Math.ceil(detailPagination.rowsNumber / detailPagination.rowsPerPage) }}
                     </span>
                     <q-btn 
                       :disable="detailPagination.page >= Math.ceil(detailPagination.rowsNumber / detailPagination.rowsPerPage)" 
                       @click="changeDetailPage(detailPagination.page + 1)"
                       color="primary"
                       icon="chevron_right"
                       size="sm"
                     />
                   </div>
                 </div>
               </q-card-section>
             </q-card>
           </div>
         </div>

      </div>
    </div>
  </q-page>

  <!-- Kasa Devret Onay Dialogu -->
  <q-dialog v-model="showKasaDevretDialog">
    <q-card style="min-width: 420px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-subtitle1 text-weight-bold">DİKKAT</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <q-card-section>
        <div class="q-mb-md">
          GÜNCEL NAKİT KASA BAKİYESİ : <span class="text-weight-bold">{{ formatCurrency(currentBakiye) }} TL</span>. TESLİM ALMAK ÜZERESİNİZ!
        </div>
        <div class="text-center text-weight-bold text-uppercase" style="letter-spacing: 3px;">
          SAYARAK TESLİM ALDIĞINIZI ONAYLIYOR MUSUNUZ?
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Evet" color="primary" @click="onKasaDevretOnayla" />
        <q-btn flat label="Hayır" color="negative" @click="() => { showKasaDevretDialog = false }" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, getCurrentInstance } from 'vue'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { isAxiosError } from 'axios'

function debugLog(...args: unknown[]) {
  if (import.meta.env.MODE !== 'production') {
    console.log(...args)
  }
}

const $q = useQuasar()

// Axios instance'ını al
const instance = getCurrentInstance()
const $api = instance?.proxy?.$api

// $api undefined ise hata fırlat
if (!$api) {
  throw new Error('API instance bulunamadı')
}

// Reactive state
const selectedIslemTuru = ref('cari')
const selectedIslemYonu = ref('gelir')
const loading = ref(false)
const detailLoading = ref(false)
const selectedDate = ref('')

interface TableRow {
  tarih: string
  gelir: number
  gider: number
  bakiye: number
}

interface DetailTableRow {
  id: number
  iKytTarihi: string
  islemAltG: string
  islemGrup: string
  islemTutar: number
  islemBilgi: string
}

interface KasaDevirRow {
  DevirTarihi: string
  DevirEden: string
  KasaYekun: number
}

const tableData = ref<TableRow[]>([])
const detailTableData = ref<DetailTableRow[]>([])

// Tüm veriyi saklamak için
const allTableData = ref<TableRow[]>([])
const allDetailTableData = ref<DetailTableRow[]>([])

// Kasa devir verileri
const kasaDevirData = ref<KasaDevirRow[]>([])
const kasaDevirLoading = ref(false)
const showKasaDevretDialog = ref(false)

// Kasa devir pagination ayarları
const kasaDevirPagination = ref({
  sortBy: 'DevirTarihi',
  descending: true,
  page: 1,
  rowsPerPage: 3,
  rowsNumber: 0
})

// Kasalar arası aktarım formu
const transferForm = ref({
  veren: '',
  alan: '',
  tutar: ''
})

// Kasa seçenekleri
const kasaOptions = [
  { label: 'Nakit', value: 'nakit' },
  { label: 'Kart', value: 'kart' },
  { label: 'EFT', value: 'eft' },
  { label: 'Acenta', value: 'acenta' }
  // { label: 'Depozito', value: 'depozito' } // Şimdilik gizli
]

// Başlangıç bakiye değerleri (backend'de kullanılıyor)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const baslangicBakiyeleri: Record<string, number> = {
  cari: 28738901,
  nakit: 87800,
  kart: 8008546,
  eft: 0,
  acenta: 0,
  depozito: 107695
}

// Tablo sütunları
const columns = computed((): QTableColumn[] => [
  {
    name: 'tarih',
    label: 'Tarih',
    field: 'tarih',
    align: 'left',
    sortable: true,
    style: 'width: 100px'
  },
  {
    name: 'gelir',
    label: firstOptionLabel.value,
    field: 'gelir',
    align: 'right',
    sortable: false,
    style: 'width: 100px'
  },
  {
    name: 'gider',
    label: secondOptionLabel.value,
    field: 'gider',
    align: 'right',
    sortable: false,
    style: 'width: 100px'
  },

])

// Kasa devir tablo sütunları
const kasaDevirColumns = computed((): QTableColumn[] => [
  {
    name: 'DevirTarihi',
    label: 'Tarih',
    field: 'DevirTarihi',
    align: 'left',
    sortable: true,
    style: 'width: 120px'
  },
  {
    name: 'DevirEden',
    label: 'Devir E.',
    field: 'DevirEden',
    align: 'left',
    sortable: true,
    style: 'width: 150px'
  },
  {
    name: 'KasaYekun',
    label: 'Kasa Yekün',
    field: 'KasaYekun',
    align: 'right',
    sortable: true,
    style: 'width: 150px'
  }
])

// Pagination ayarları
const pagination = ref({
  sortBy: 'tarih',
  descending: true,
  page: 1,
  rowsPerPage: 7,
  rowsNumber: 100
})

// Detay tablo pagination ayarları
const detailPagination = ref({
  sortBy: 'islemTutar',
  descending: true,
  page: 1,
  rowsPerPage: 15,
  rowsNumber: 100
})

// Ana tablo pagination request handler
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onRequest = (props: any) => {
  debugLog('🔍 Ana tablo pagination request:', props)
  
  // Pagination değişikliklerini uygula
  pagination.value = props.pagination
  // Sadece tarih sütunu DESC olarak kalacak
  pagination.value.sortBy = 'tarih'
  pagination.value.descending = true
}

// Detay tablo pagination request handler
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onDetailRequest = (props: any) => {
  debugLog('🔍 Detay tablo pagination request:', props)
  
  // Pagination değişikliklerini uygula
  detailPagination.value = props.pagination
  
  // Sıralama varsa verileri sırala
  if (props.pagination.sortBy) {
    const sortBy = props.pagination.sortBy
    const descending = props.pagination.descending
    
    // Verileri sırala
    allDetailTableData.value.sort((a: DetailTableRow, b: DetailTableRow) => {
      let aValue: string | number = a[sortBy as keyof DetailTableRow]
      let bValue: string | number = b[sortBy as keyof DetailTableRow]
      
      // Tutar sütunu için sayısal karşılaştırma
      if (sortBy === 'islemTutar') {
        aValue = parseFloat(String(aValue)) || 0
        bValue = parseFloat(String(bValue)) || 0
      } else {
        // Diğer sütunlar için string karşılaştırma
        aValue = String(aValue || '').toLowerCase()
        bValue = String(bValue || '').toLowerCase()
      }
      
      if (aValue < bValue) return descending ? 1 : -1
      if (aValue > bValue) return descending ? -1 : 1
      return 0
    })
  }
  
  // Sıralanmış verileri güncelle
  updateDetailTableData()
}

// Ana tablo sayfa değiştirme fonksiyonu
const changePage = (newPage: number) => {
  debugLog('🔍 Ana tablo sayfa değiştiriliyor:', newPage)
  pagination.value.page = newPage
  updateTableData()
}

// Detay tablo sayfa değiştirme fonksiyonu
const changeDetailPage = (newPage: number) => {
  debugLog('🔍 Detay tablo sayfa değiştiriliyor:', newPage)
  detailPagination.value.page = newPage
  updateDetailTableData()
}

// Ana tablo verilerini güncelle (15 satırlık parçalar halinde)
const updateTableData = () => {
  const startIndex = (pagination.value.page - 1) * pagination.value.rowsPerPage
  const endIndex = startIndex + pagination.value.rowsPerPage
  tableData.value = allTableData.value.slice(startIndex, endIndex)
  debugLog('🔍 Ana tablo güncellendi:', startIndex, 'to', endIndex, 'toplam:', allTableData.value.length)
}

// Detay tablo verilerini güncelle (15 satırlık parçalar halinde)
const updateDetailTableData = () => {
  const startIndex = (detailPagination.value.page - 1) * detailPagination.value.rowsPerPage
  const endIndex = startIndex + detailPagination.value.rowsPerPage
  detailTableData.value = allDetailTableData.value.slice(startIndex, endIndex)
  debugLog('🔍 Detay tablo güncellendi:', startIndex, 'to', endIndex, 'toplam:', allDetailTableData.value.length)
}



// Detay tablo sütunları
const detailColumns: QTableColumn[] = [
  {
    name: 'iKytTarihi',
    label: 'Tarih',
    field: 'iKytTarihi',
    align: 'left',
    sortable: true,
    style: 'width: 100px'
  },
  {
    name: 'islemAltG',
    label: 'Cari Adı',
    field: 'islemAltG',
    align: 'left',
    sortable: true,
    style: 'min-width: 200px; max-width: 250px; word- wrap: break-word; white-space: normal;'
  },
  {
    name: 'islemGrup',
    label: 'Grup',
    field: 'islemGrup',
    align: 'left',
    sortable: false,
    style: 'width: 100px'
  },
  {
    name: 'islemTutar',
    label: 'Tutar',
    field: 'islemTutar',
    align: 'right',
    sortable: true,
    style: 'width: 100px'
  },
  {
    name: 'islemBilgi',
    label: 'Bilgi',
    field: 'islemBilgi',
    align: 'left',
    sortable: false,
    style: 'min-width:440px; max-width: 510px; word-wrap: break-word; white-space: normal;'
  }
]

// Computed properties for dynamic labels
const firstOptionLabel = computed(() => {
  return selectedIslemTuru.value === 'cari' ? 'GELİR' : 'Giren'
})

const secondOptionLabel = computed(() => {
  return selectedIslemTuru.value === 'cari' ? 'GİDER' : 'Çıkan'
})

// İşlem yönü değerini backend'e göndermek için computed property
const islemYonuForApi = computed(() => {
  return selectedIslemTuru.value === 'cari' ? 'gelir-gider' : 'giren-cikan'
})

// Satır tıklama event handler
const onRowClick = (evt: Event, row: TableRow) => {
  debugLog('🔍 Satır tıklandı:', row)
  debugLog('🔍 Seçilen tarih:', row.tarih)
  selectedDate.value = row.tarih
  void loadDetailTableData(row.tarih)
  
  // En üst satır (en yeni tarih) seçildiğinde güncel bakiyeyi hesapla
  const isEnUstSatir = tableData.value.length > 0 && row.tarih === tableData.value[0].tarih
  if (isEnUstSatir) {
    void loadGuncelBakiye()
  } else {
    void loadSecilenGunBakiyesi(row.tarih)
  }
}

// Event handler for radio group change
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const onIslemTuruChange = (_value: string) => {
  // İşlem türü değiştiğinde tabloyu yeniden yükle
  void loadTableData()
  
  // Eğer seçili tarih varsa detay tabloyu otomatik olarak güncelle
  if (selectedDate.value) {
    debugLog('🔍 İşlem türü değişti, seçili tarih korunuyor ve detay tablo güncelleniyor:', selectedDate.value)
    void loadDetailTableData(selectedDate.value)
  } else {
    // Seçili tarih yoksa detay tabloyu temizle
    allDetailTableData.value = []
    detailTableData.value = []
    detailPagination.value.page = 1
    detailPagination.value.rowsNumber = 0
  }
}



// Detay tablo verilerini yükle
const loadDetailTableData = async (tarih: string) => {
  if (!tarih) return
  
  detailLoading.value = true
  try {
    debugLog('Detay tablo verisi yükleniyor...')
    debugLog('Seçilen tarih:', tarih)
    debugLog('Seçilen işlem türü:', selectedIslemTuru.value)
    debugLog('Seçilen işlem yönü:', islemYonuForApi.value)
    
    // Axios instance kullanarak API çağrısı yap
    const response = await $api.get('/islem/detay-islemler', {
      params: {
        tarih: tarih,
        islemTuru: selectedIslemTuru.value,
        islemYonu: islemYonuForApi.value,
        selectedYonu: selectedIslemYonu.value,
        page: 1,
        rowsPerPage: 1000
      }
    })
    debugLog('Detay Response status:', response.status)
    
    const result = response.data
    debugLog('Detay API Response:', result)
    
    if (result.success) {
       debugLog('Detay veri sayısı:', result.data?.length || 0)
       debugLog('Detay toplam kayıt sayısı:', result.totalRecords)
       // Backend'den gelen veriyi kullan
       allDetailTableData.value = result.data || []
       
       // Verileri tutar sütununa göre azalan sırala
       allDetailTableData.value.sort((a: DetailTableRow, b: DetailTableRow) => {
         const aValue = parseFloat(String(a.islemTutar)) || 0
         const bValue = parseFloat(String(b.islemTutar)) || 0
         return bValue - aValue // Azalan sıralama (büyükten küçüğe)
       })
       
       // Detay tablo pagination için toplam kayıt sayısını ayarla
       detailPagination.value.rowsNumber = allDetailTableData.value.length
       // İlk sayfayı göster
       detailPagination.value.page = 1
       updateDetailTableData()
        debugLog('Detay pagination rowsNumber güncellendi:', detailPagination.value.rowsNumber)
        debugLog('Detay tablo verisi güncellendi:', detailTableData.value)
     } else {
      console.error('Detay API hatası:', result.message)
      detailTableData.value = []
    }
  } catch (error) {
    console.error('Detay veri yükleme hatası:', error)
    detailTableData.value = []
  } finally {
    detailLoading.value = false
  }
}

// Bakiye hesaplama fonksiyonları
const currentBakiye = ref(0)
const bakiyeLabelText = computed(() => {
  if (selectedDate.value) {
    // En üst satır (en yeni tarih) seçildiğinde güncel bakiye göster
    const isEnUstSatir = tableData.value.length > 0 && selectedDate.value === tableData.value[0].tarih
    if (isEnUstSatir) {
      return `Güncel Bakiye: ${formatCurrency(currentBakiye.value)}`
    } else {
      return `Seçilen Gün Bakiye: ${formatCurrency(currentBakiye.value)}`
    }
  } else {
    return `Güncel Bakiye: ${formatCurrency(currentBakiye.value)}`
  }
})

// Kasalar arası aktarım fonksiyonu
const performTransfer = async () => {
  debugLog('🔄 Kasalar arası aktarım başlatılıyor...')
  
  // Form validasyonu
  if (!transferForm.value.veren || !transferForm.value.alan || !transferForm.value.tutar) {
    console.error('❌ Form alanları eksik')
    return
  }
  
  const tutar = parseFloat(transferForm.value.tutar)
  if (isNaN(tutar) || tutar <= 0) {
    console.error('❌ Geçersiz tutar')
    return
  }
  
  if (transferForm.value.veren === transferForm.value.alan) {
    console.error('❌ Aynı kasa seçilemez')
    return
  }
  
  try {
    debugLog('📤 Aktarım verileri:', {
      veren: transferForm.value.veren,
      alan: transferForm.value.alan,
      tutar: tutar
    })
    
    // Backend API çağrısı
    const response = await $api.post('/islem/kasa-aktarimi', {
      veren: transferForm.value.veren,
      alan: transferForm.value.alan,
      tutar: tutar
    })
    
    if (response.data.success) {
      debugLog('✅ Aktarım başarılı:', response.data.message)
      
      // Form temizle
      transferForm.value.veren = ''
      transferForm.value.alan = ''
      transferForm.value.tutar = ''
      
      // Verileri yenile
      await refreshData()
      
      // Başarı mesajı göster
      $q.notify({
        type: 'positive',
        message: response.data.message,
        position: 'top',
        timeout: 5000,
        html: true
      })
    } else {
      console.error('❌ Aktarım başarısız:', response.data.message)
      
      // Hata mesajı göster
      $q.notify({
        type: 'negative',
        message: response.data.message || 'Kasa aktarımı başarısız!',
        position: 'top',
        timeout: 8000,
        html: true
      })
    }
    
  } catch (error) {
    console.error('❌ Aktarım hatası:', error)
  }
}

// Kasa devir verilerini yükle
const loadKasaDevirVerileri = async () => {
  try {
    debugLog('🔄 Kasa devir verileri yükleniyor...')
    kasaDevirLoading.value = true
    
    const response = await $api.get('/islem/kasa-devir-verileri', {
      params: {
        page: kasaDevirPagination.value.page,
        rowsPerPage: kasaDevirPagination.value.rowsPerPage
      }
    })
    
    if (response.data.success) {
      kasaDevirData.value = response.data.data
      kasaDevirPagination.value.rowsNumber = response.data.totalRecords
      debugLog('✅ Kasa devir verileri yüklendi:', kasaDevirData.value.length, 'kayıt')
    } else {
      console.error('❌ Kasa devir verileri yüklenemedi:', response.data.message)
      $q.notify({
        type: 'negative',
        message: response.data.message || 'Kasa devir verileri yüklenemedi!',
        position: 'top',
        timeout: 5000
      })
    }
  } catch (error) {
    console.error('❌ Kasa devir verileri yükleme hatası:', error)
    $q.notify({
      type: 'negative',
      message: 'Kasa devir verileri yüklenirken hata oluştu!',
      position: 'top',
      timeout: 5000
    })
  } finally {
    kasaDevirLoading.value = false
  }
}

// Kasa devret tıklama
const onKasaDevretClick = async () => {
  // Sadece Nakit seçiliyken izin ver
  if (selectedIslemTuru.value !== 'nakit') {
    $q.notify({
      type: 'warning',
      message: 'Kasa devri için önce 6\'lı seçimden Nakit kasayı seçiniz.',
      position: 'top'
    })
    return
  }
  // Bakiye tazele ve popup aç
  await loadGuncelBakiye()
  showKasaDevretDialog.value = true
}

// Kasa devret onayla -> tblKasaDevir'e kaydet ve grid'i yenile
const onKasaDevretOnayla = async () => {
  try {
    const response = await $api.post('/islem/kasa-devret', { kasaYekun: currentBakiye.value })
    if (response.data && response.data.success) {
      showKasaDevretDialog.value = false
      $q.notify({ type: 'positive', message: 'Kasa devri kaydedildi', position: 'top' })
      await loadKasaDevirVerileri()
    } else {
      $q.notify({ type: 'negative', message: response.data?.message || 'Kasa devri kaydedilemedi', position: 'top' })
    }
  } catch (error: unknown) {
    console.error('Kasa devret hatası:', error)
    let msg = 'Kasa devri sırasında hata oluştu'
    if (isAxiosError(error)) {
      const data = error.response?.data as { message?: string } | undefined
      msg = data?.message ?? error.message
    } else if (error instanceof Error) {
      msg = error.message
    }
    $q.notify({ type: 'negative', message: msg, position: 'top', timeout: 7000 })
  }
}

// Kasa devir tablo pagination request handler
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onKasaDevirRequest = (props: any) => {
  debugLog('🔍 Kasa devir tablo pagination request:', props)
  
  // Pagination değişikliklerini uygula
  kasaDevirPagination.value = props.pagination
  // Sadece tarih sütunu DESC olarak kalacak
  kasaDevirPagination.value.sortBy = 'DevirTarihi'
  kasaDevirPagination.value.descending = true
  
  // Verileri yeniden yükle
  void loadKasaDevirVerileri()
}

// Kasa devir sayfa değiştirme fonksiyonu
const changeKasaDevirPage = async (newPage: number) => {
  debugLog('🔄 Kasa devir sayfa değiştiriliyor:', newPage)
  kasaDevirPagination.value.page = newPage
  await loadKasaDevirVerileri()
}

// Veriyi yenile fonksiyonu
const refreshData = async () => {
  debugLog('🔄 Veri yenileniyor...')
  
  // Mevcut seçili tarihi sakla
  const mevcutSeciliTarih = selectedDate.value
  
  // Detay tablo verilerini temizle
  allDetailTableData.value = []
  detailTableData.value = []
  detailPagination.value.page = 1
  detailPagination.value.rowsNumber = 0
  
  // Ana tablo verilerini yeniden yükle
  await loadTableData()
  
  // Tarih seçili ise o tarih için detay tablo, değilse ilk tarih seçilsin
  if (mevcutSeciliTarih && tableData.value.some(row => row.tarih === mevcutSeciliTarih)) {
    // Mevcut seçili tarih hala geçerliyse onu kullan
    selectedDate.value = mevcutSeciliTarih
    await loadDetailTableData(mevcutSeciliTarih)
  } else if (tableData.value.length > 0) {
    // İlk tarih seçilsin ve detay tablo sorgulansın
    const ilkTarih = tableData.value[0].tarih
    selectedDate.value = ilkTarih
    await loadDetailTableData(ilkTarih)
  }
  
  // Güncel bakiyeyi hesapla
  await loadGuncelBakiye()
  
  debugLog('✅ Veri yenileme tamamlandı')
}

// Güncel bakiye hesapla
const loadGuncelBakiye = async () => {
  try {
    const response = await $api.get('/islem/guncel-bakiye', {
      params: {
        islemTuru: selectedIslemTuru.value,
        islemYonu: islemYonuForApi.value
      }
    })
    
    if (response.data.success) {
      currentBakiye.value = response.data.bakiye
      debugLog('💰 Güncel bakiye yüklendi:', currentBakiye.value)
    }
  } catch (error) {
    console.error('❌ Güncel bakiye yükleme hatası:', error)
    currentBakiye.value = 0
  }
}

// Seçilen gün bakiyesi hesapla
const loadSecilenGunBakiyesi = async (tarih: string) => {
  try {
    const response = await $api.get('/islem/secilen-gun-bakiyesi', {
      params: {
        islemTuru: selectedIslemTuru.value,
        islemYonu: islemYonuForApi.value,
        secilenTarih: tarih
      }
    })
    
    if (response.data.success) {
      currentBakiye.value = response.data.bakiye
      debugLog('💰 Seçilen gün bakiyesi yüklendi:', currentBakiye.value)
    }
  } catch (error) {
    console.error('❌ Seçilen gün bakiyesi yükleme hatası:', error)
    currentBakiye.value = 0
  }
}

// Tarih formatı
const formatDate = (date: string) => {
  if (!date) return ''
  
  // Backend'den gelen tarih formatı: DD.MM.YYYY
  if (date.includes('.')) {
    const parts = date.split('.')
    if (parts.length === 3) {
      const day = parts[0]
      const month = parts[1]
      const year = parts[2]
      return `${day}.${month}.${year}`
    }
  }
  
  // ISO format için
  const d = new Date(date)
  return d.toLocaleDateString('tr-TR')
}

// Para formatı
const formatCurrency = (amount: number) => {
  if (!amount) return '0,00'
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Tablo verilerini yükle (direct call - test endpoints kaldırıldı)
const loadTableData = async () => {
  loading.value = true
  try {
    const response = await $api.get('/islem/kasa-islemleri', {
      params: {
        islemTuru: selectedIslemTuru.value,
        islemYonu: islemYonuForApi.value,
        page: 1,
        rowsPerPage: 1000
      }
    })
    const result = response.data
    if (result.success) {
      allTableData.value = result.data || []
      pagination.value.rowsNumber = allTableData.value.length
      pagination.value.page = 1
      updateTableData()
    } else {
      tableData.value = []
    }
  } catch (error) {
    console.error('Veri yükleme hatası:', error)
    tableData.value = []
  } finally {
    loading.value = false
  }
}

// Sayfa yüklendiğinde veriyi yükle
onMounted(async () => {
  await loadTableData()
  // Sayfa ilk yüklendiğinde güncel bakiyeyi hesapla
  await loadGuncelBakiye()
  
  // Kasa devir verilerini otomatik olarak yükle
  await loadKasaDevirVerileri()
  
  // İlk tarih seçili olsun ve detay tablo sorgulansın
  if (tableData.value.length > 0) {
    const ilkTarih = tableData.value[0].tarih
    selectedDate.value = ilkTarih
    await loadDetailTableData(ilkTarih)
    await loadGuncelBakiye()
  }
})

// İşlem türü değiştiğinde tabloyu yeniden yükle
watch(selectedIslemTuru, () => {
  void loadTableData()
  // İşlem türü değiştiğinde bakiye hesaplaması yap
  if (selectedDate.value) {
    // En üst satır seçildiğinde güncel bakiyeyi hesapla
    const isEnUstSatir = tableData.value.length > 0 && selectedDate.value === tableData.value[0].tarih
    if (isEnUstSatir) {
      void loadGuncelBakiye()
    } else {
      void loadSecilenGunBakiyesi(selectedDate.value)
    }
  } else {
    void loadGuncelBakiye()
  }
})

// İşlem yönü değiştiğinde detay tabloyu güncelle
watch(selectedIslemYonu, () => {
  debugLog('🔍 selectedIslemYonu değişti:', selectedIslemYonu.value)
  debugLog('🔍 islemYonuForApi değeri:', islemYonuForApi.value)
  if (selectedDate.value) {
    debugLog('🔍 Detay tablo güncelleniyor...')
    void loadDetailTableData(selectedDate.value)
  } else {
    debugLog('🔍 Seçili tarih yok, detay tablo güncellenmiyor')
  }
  
  // İşlem yönü değiştiğinde bakiye hesaplaması yap
  if (selectedDate.value) {
    // En üst satır seçildiğinde güncel bakiyeyi hesapla
    const isEnUstSatir = tableData.value.length > 0 && selectedDate.value === tableData.value[0].tarih
    if (isEnUstSatir) {
      void loadGuncelBakiye()
    } else {
      void loadSecilenGunBakiyesi(selectedDate.value)
    }
  } else {
    void loadGuncelBakiye()
  }
})
</script>

<style scoped>
.light-page-background {
  background: #f5f5f5;
  min-height: 100vh;
}

/* Dark mode için sayfa zemin rengi */
.body--dark .light-page-background {
  background: #121212;
}

/* Veriyi Yenile butonu font boyutu */
.refresh-btn {
  font-size: 12px !important;
}

/* Daha spesifik seçici */
.q-btn.refresh-btn {
  font-size: 12px !important;
}

/* İkinci radio grup aralığı */
.second-radio-group {
  margin-top: 6px;
}

/* Kasalar Arası Aktarım Container */
.transfer-container {
  margin-top: 2px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  padding: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* Dark mode için transfer container */
.body--dark .transfer-container {
  background: rgba(30, 30, 30, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.transfer-header {
  margin-bottom: 15px;
}

.transfer-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-align: center;
  word-wrap: break-word;
  white-space: normal;
  line-height: 1.3;
}

/* Dark mode için transfer başlık rengi */
.body--dark .transfer-title {
  color: #ffffff;
}

.transfer-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 12px;
  font-weight: 500;
  color: #555;
  margin-bottom: 2px;
}

/* Dark mode için form label rengi */
.body--dark .form-label {
  color: #e0e0e0;
}

.transfer-input {
  width: 100%;
}

.transfer-button {
  margin-top: 8px;
  width: 100%;
}

/* Combobox seçenek font boyutu */
.transfer-input .q-field__native {
  font-size: 8px;
}

/* Ana Grid Tablo Container */
.main-table-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Kasa Devir Container */
.kasa-devir-container {
  background: rgba(222, 232, 222, 0.95);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(70, 130, 180, 0.2);
  box-shadow: 0 2px 8px rgba(70, 130, 180, 0.15);
}

/* Dark mode için kasa devir container */
.body--dark .kasa-devir-container {
  background: rgba(20, 30, 40, 0.95);
  border: 1px solid rgba(100, 150, 200, 0.3);
  box-shadow: 0 2px 8px rgba(100, 150, 200, 0.2);
}

.kasa-devir-header {
  text-align: center;
  margin-bottom: 20px;
}

.kasa-devir-btn {
  font-weight: 600;
  font-size: 14px;
  padding: 2px 16px;
  min-height: 28px;
  height: 28px;
}

.kasa-devir-table-container {
  margin-top: 15px;
}

.kasa-devir-table {
  background: transparent;
}

.kasa-devir-table .q-table__top {
  background: rgba(0, 0, 0, 0.02);
}

/* Dark mode için tablo başlık */
.body--dark .kasa-devir-table .q-table__top {
  background: rgba(255, 255, 255, 0.05);
}

/* Kasa devir tablosu satır aralıklarını azalt */
.kasa-devir-table .q-table__tbody tr {
  height: 24px;
}

.kasa-devir-table .q-table__tbody td {
  padding: 2px 4px;
}

.kasa-devir-table .q-table__thead th {
  padding: 3px 4px;
  height: 24px;
}

.transfer-input .q-item {
  font-size: 8px;
  min-height: 24px;
}

.ana-container {
  max-width: 1000px;
  margin: 0;
  padding: 0 20px 20px 0;
}

/* Detay tablo için maksimum genişlik */
.detail-table {
  max-width: 1900px;
}

.layout-grid {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 20px;
  align-items: start;
}

.left-column {
  position: sticky;
  top: 20px;
}

.right-column {
  min-height: 400px;
}

.tables-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.selected-row {
  background-color: #e3f2fd !important;
  border-left: 4px solid #1976d2 !important;
  font-weight: bold !important;
}

.selected-row:hover {
  background-color: #bbdefb !important;
}

.q-tr {
  cursor: pointer;
}

.q-tr:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* Dark mode için seçili satır */
.body--dark .selected-row {
  background-color: rgba(25, 118, 210, 0.2) !important;
  border-left: 4px solid #42a5f5 !important;
}

.body--dark .selected-row:hover {
  background-color: rgba(25, 118, 210, 0.3) !important;
}



.main-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.radio-groups-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.radio-group-container {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  padding: 2px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.radio-group {
  width: 100%;
}

.radio-options {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.radio-options .q-radio {
  margin-bottom: 2px;
}

.table-container {
  overflow-x: auto;
}

.kasa-table {
  font-size: 12px;
}

.kasa-table .q-table__top {
  display: none;
}

.kasa-table .q-table__bottom {
  padding: 8px;
}

/* Sayfa başına kayıt seçiciyi gizle */
.kasa-table .q-table__bottom .q-table__control {
  display: none !important;
}

/* Pagination butonlarını görünür yap */
.kasa-table .q-table__bottom {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  min-height: 40px !important;
  padding: 8px !important;
  border-top: 1px solid rgba(0, 0, 0, 0.12) !important;
  background-color: #f5f5f5 !important;
}

.kasa-table .q-table__bottom .q-pagination {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  width: 100% !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 4px !important;
}

 .kasa-table .q-table__bottom .q-pagination .q-btn {
   display: inline-flex !important;
   visibility: visible !important;
   opacity: 1 !important;
   margin: 0 2px !important;
   min-width: 28px !important;
   height: 24px !important;
   background-color: #1976d2 !important;
   color: white !important;
   border-radius: 3px !important;
   font-weight: bold !important;
   box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
 }

.kasa-table .q-table__bottom .q-pagination .q-btn--disabled {
  display: inline-flex !important;
  visibility: visible !important;
  opacity: 0.6 !important;
  pointer-events: auto !important;
  background-color: #ccc !important;
  color: #666 !important;
  box-shadow: none !important;
}

.kasa-table .q-table__bottom .q-pagination .q-btn:hover {
  background-color: #1565c0 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
}

.kasa-table .q-table__bottom .q-pagination .q-btn--disabled:hover {
  background-color: #ccc !important;
  transform: none !important;
  box-shadow: none !important;
}

/* Pagination butonlarının kesinlikle görünmesi için ek kurallar */
.kasa-table .q-table__bottom .q-pagination .q-btn__content {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  justify-content: center !important;
  align-items: center !important;
  width: 100% !important;
  height: 100% !important;
}

.kasa-table .q-table__bottom .q-pagination .q-btn__content .q-icon {
  display: inline-flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  font-size: 16px !important;
}

/* Pagination sayfa numaralarını görünür yap */
.kasa-table .q-table__bottom .q-pagination .q-btn--standard {
  background-color: #1976d2 !important;
  color: white !important;
  font-weight: bold !important;
}

.kasa-table .q-table__bottom .q-pagination .q-btn--standard.q-btn--active {
  background-color: #0d47a1 !important;
  color: white !important;
  font-weight: bold !important;
}

/* Pagination butonlarının kesinlikle görünmesi için ek kurallar */
.kasa-table .q-table__bottom .q-pagination {
  position: relative !important;
  z-index: 1000 !important;
}

.kasa-table .q-table__bottom .q-pagination * {
  pointer-events: auto !important;
}

/* Pagination butonlarının içeriğini görünür yap */
.kasa-table .q-table__bottom .q-pagination .q-btn span {
  display: inline-block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

 /* Pagination butonlarının sayfa numaralarını görünür yap */
 .kasa-table .q-table__bottom .q-pagination .q-btn--standard {
   min-width: 28px !important;
   height: 24px !important;
   font-size: 12px !important;
   font-weight: bold !important;
 }

/* Özel pagination butonları */
.custom-pagination {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 8px !important;
  background-color: #f5f5f5 !important;
  border-top: 1px solid rgba(0, 0, 0, 0.12) !important;
  margin-top: 8px !important;
}

.pagination-info {
  font-weight: bold !important;
  color: #1976d2 !important;
  font-size: 12px !important;
  min-width: 100px !important;
  text-align: center !important;
}

 .custom-pagination .q-btn {
   background-color: #1976d2 !important;
   color: white !important;
   border-radius: 3px !important;
   font-weight: bold !important;
   box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
   min-width: 28px !important;
   height: 22px !important;
   font-size: 11px !important;
 }

.custom-pagination .q-btn:hover {
  background-color: #1565c0 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;
}

.custom-pagination .q-btn--disabled {
  background-color: #ccc !important;
  color: #666 !important;
  box-shadow: none !important;
  transform: none !important;
}

.custom-pagination .q-btn--disabled:hover {
  background-color: #ccc !important;
  transform: none !important;
  box-shadow: none !important;
}

/* Dark mode için pagination butonları */
.body--dark .custom-pagination {
  background-color: #2d2d2d !important;
  border-top: 1px solid rgba(255, 255, 255, 0.12) !important;
}

.body--dark .pagination-info {
  color: #42a5f5 !important;
}

.body--dark .custom-pagination .q-btn {
  background-color: #42a5f5 !important;
  color: white !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4) !important;
}

.body--dark .custom-pagination .q-btn:hover {
  background-color: #1976d2 !important;
  box-shadow: 0 2px 6px rgba(0,0,0,0.5) !important;
}

.body--dark .custom-pagination .q-btn--disabled {
  background-color: #555 !important;
  color: #888 !important;
}

.body--dark .custom-pagination .q-btn--disabled:hover {
  background-color: #555 !important;
}

.kasa-table .q-table tbody tr {
  height: 24px;
}

.kasa-table .q-table th {
  padding: 2px 6px;
  font-size: 11px;
}

.kasa-table .q-table td {
  padding: 2px 6px;
}

/* Bilgi sütunu için word wrap */
.kasa-table .q-table td[data-col="islemBilgi"] {
  word-wrap: break-word !important;
  white-space: normal !important;
  min-width: 600px !important;
  max-width: 1000px !important;
  overflow-wrap: break-word !important;
}

/* Dark mode için */
.body--dark .main-card {
  background: rgba(30, 30, 30, 0.95);
  color: white;
}

.body--dark .radio-group-container {
  background: rgba(50, 50, 50, 0.8);
  border-color: rgba(255, 255, 255, 0.1);
}

.body--dark .text-grey-6 {
  color: #b0b0b0 !important;
}

/* Responsive tasarım */
@media (max-width: 768px) {
  .layout-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .left-column {
    position: static;
  }
  
  .ana-container {
    max-width: 100%;
    padding: 10px;
  }
}
</style> 