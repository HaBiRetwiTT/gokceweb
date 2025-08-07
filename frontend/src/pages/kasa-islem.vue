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
                 <div class="bakiye-label q-mb-md">
                   <q-chip 
                     :color="bakiyeLabelText.includes('Güncel Bakiye') ? 'green' : 'orange'" 
                     text-color="white"
                     :label="bakiyeLabelText"
                     class="text-weight-medium"
                   />
                 </div>
                 
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, getCurrentInstance } from 'vue'
import type { QTableColumn } from 'quasar'

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

const tableData = ref<TableRow[]>([])
const detailTableData = ref<DetailTableRow[]>([])

// Tüm veriyi saklamak için
const allTableData = ref<TableRow[]>([])
const allDetailTableData = ref<DetailTableRow[]>([])

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
  console.log('🔍 Ana tablo pagination request:', props)
  
  // Pagination değişikliklerini uygula
  pagination.value = props.pagination
  // Sadece tarih sütunu DESC olarak kalacak
  pagination.value.sortBy = 'tarih'
  pagination.value.descending = true
}

// Detay tablo pagination request handler
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onDetailRequest = (props: any) => {
  console.log('🔍 Detay tablo pagination request:', props)
  
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
  console.log('🔍 Ana tablo sayfa değiştiriliyor:', newPage)
  pagination.value.page = newPage
  updateTableData()
}

// Detay tablo sayfa değiştirme fonksiyonu
const changeDetailPage = (newPage: number) => {
  console.log('🔍 Detay tablo sayfa değiştiriliyor:', newPage)
  detailPagination.value.page = newPage
  updateDetailTableData()
}

// Ana tablo verilerini güncelle (15 satırlık parçalar halinde)
const updateTableData = () => {
  const startIndex = (pagination.value.page - 1) * pagination.value.rowsPerPage
  const endIndex = startIndex + pagination.value.rowsPerPage
  tableData.value = allTableData.value.slice(startIndex, endIndex)
  console.log('🔍 Ana tablo güncellendi:', startIndex, 'to', endIndex, 'toplam:', allTableData.value.length)
}

// Detay tablo verilerini güncelle (15 satırlık parçalar halinde)
const updateDetailTableData = () => {
  const startIndex = (detailPagination.value.page - 1) * detailPagination.value.rowsPerPage
  const endIndex = startIndex + detailPagination.value.rowsPerPage
  detailTableData.value = allDetailTableData.value.slice(startIndex, endIndex)
  console.log('🔍 Detay tablo güncellendi:', startIndex, 'to', endIndex, 'toplam:', allDetailTableData.value.length)
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
  console.log('🔍 Satır tıklandı:', row)
  console.log('🔍 Seçilen tarih:', row.tarih)
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
    console.log('🔍 İşlem türü değişti, seçili tarih korunuyor ve detay tablo güncelleniyor:', selectedDate.value)
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
    console.log('Detay tablo verisi yükleniyor...')
    console.log('Seçilen tarih:', tarih)
    console.log('Seçilen işlem türü:', selectedIslemTuru.value)
    console.log('Seçilen işlem yönü:', islemYonuForApi.value)
    
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
    console.log('Detay Response status:', response.status)
    
    const result = response.data
    console.log('Detay API Response:', result)
    
    if (result.success) {
       console.log('Detay veri sayısı:', result.data?.length || 0)
       console.log('Detay toplam kayıt sayısı:', result.totalRecords)
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
       console.log('Detay pagination rowsNumber güncellendi:', detailPagination.value.rowsNumber)
       console.log('Detay tablo verisi güncellendi:', detailTableData.value)
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

// Veriyi yenile fonksiyonu
const refreshData = () => {
  console.log('🔄 Veri yenileniyor...')
  
  // Seçili tarihi temizle
  selectedDate.value = ''
  
  // Detay tablo verilerini temizle
  allDetailTableData.value = []
  detailTableData.value = []
  detailPagination.value.page = 1
  detailPagination.value.rowsNumber = 0
  
  // Ana tablo verilerini yeniden yükle
  void loadTableData()
  
  // Güncel bakiyeyi hesapla
  void loadGuncelBakiye()
  
  console.log('✅ Veri yenileme tamamlandı')
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
      console.log('💰 Güncel bakiye yüklendi:', currentBakiye.value)
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
      console.log('💰 Seçilen gün bakiyesi yüklendi:', currentBakiye.value)
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

// Tablo verilerini yükle
const loadTableData = async () => {
  loading.value = true
  try {
    console.log('API çağrısı başlatılıyor...')
    console.log('Seçilen işlem türü:', selectedIslemTuru.value)
    
    // Test endpoint'i deneyelim
    const testResponse = await $api.get('/islem/test')
    console.log('Test Response status:', testResponse.status)
    
    const testResult = testResponse.data
    console.log('Test API Response:', testResult)
    
    // Test başarılıysa gerçek API'yi çağır
    if (testResult.success) {
      console.log('Test başarılı, gerçek API çağrılıyor...')
      
      const realResponse = await $api.get('/islem/kasa-islemleri', {
        params: {
          islemTuru: selectedIslemTuru.value,
          islemYonu: islemYonuForApi.value,
          page: 1,
          rowsPerPage: 1000
        }
      })
      console.log('Real Response status:', realResponse.status)
      
      const realResult = realResponse.data
      console.log('Real API Response:', realResult)
      
      if (realResult.success) {
         console.log('Gelen veri sayısı:', realResult.data?.length || 0)
         console.log('Toplam kayıt sayısı:', realResult.totalRecords)
         // Backend'den gelen veriyi kullan
         allTableData.value = realResult.data || []
         // Pagination için toplam kayıt sayısını ayarla
         pagination.value.rowsNumber = allTableData.value.length
         // İlk sayfayı göster
         pagination.value.page = 1
         updateTableData()
         console.log('Pagination rowsNumber güncellendi:', pagination.value.rowsNumber)
         console.log('Tablo verisi güncellendi:', tableData.value)
       } else {
        console.error('Gerçek API hatası:', realResult.message)
        tableData.value = []
      }
    } else {
      console.error('Test API hatası:', testResult.message)
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
onMounted(() => {
  void loadTableData()
  // Sayfa ilk yüklendiğinde güncel bakiyeyi hesapla
  void loadGuncelBakiye()
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
  console.log('🔍 selectedIslemYonu değişti:', selectedIslemYonu.value)
  console.log('🔍 islemYonuForApi değeri:', islemYonuForApi.value)
  if (selectedDate.value) {
    console.log('🔍 Detay tablo güncelleniyor...')
    void loadDetailTableData(selectedDate.value)
  } else {
    console.log('🔍 Seçili tarih yok, detay tablo güncellenmiyor')
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