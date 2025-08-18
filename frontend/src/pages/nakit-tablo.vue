<template>
  <q-page class="nakit-tablo-page">
    <div class="nakit-tablo-wrapper">
      <div class="table-container">
        <q-table
          :rows="paginatedData"
          :columns="columns"
          row-key="id"
          flat
          bordered
          square
          dense
          class="nakit-tablo-grid"
          :pagination="pagination"
          :rows-per-page-options="[10, 20, 50, 100]"
          :loading="loading"
          loading-label="Veriler yükleniyor..."
          :row-class-name="getRowClass"
          @request="onTableRequest"
          @update:pagination="onPaginationUpdate"
          :rows-per-page-label="'Sayfa başına kayıt:'"
          :no-data-label="'Veri bulunamadı'"
          :no-results-label="'Sonuç bulunamadı'"
        >
          <template v-slot:top>
            <div class="table-actions">
              <div class="date-selector">
                <q-input
                  v-model="selectedDate"
                  label="Bir Başlangıç Tarihi Seçiniz"
                  style="width: 200px;"
                  readonly
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy 
                        ref="datePopup"
                        cover 
                        transition-show="scale" 
                        transition-hide="scale"
                      >
                        <q-date
                          v-model="selectedDate"
                          mask="DD.MM.YYYY"
                          format="DD.MM.YYYY"
                          @update:model-value="onDateSelected"
                        />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              
              <div class="action-buttons">
                <q-btn
                  color="primary"
                  icon="add"
                  label="Yeni Kayıt Ekle"
                  @click="addNewRecord"
                />
              </div>
            </div>
          </template>
          
          <template v-slot:no-data>
            <div class="no-data-message">
              <q-icon name="table_chart" size="48px" color="grey-5" />
              <p>Henüz veri bulunmuyor. Yeni kayıt eklemek için "Yeni Kayıt Ekle" butonunu kullanın.</p>
            </div>
          </template>
        </q-table>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import { useQuasar } from 'quasar';
import { getNakitAkisVerileri, getBugunTarih, getOrnekVeriler, type NakitAkisRecord } from '../services/nakit-akis.service';

const $q = useQuasar();

// Reactive data
const tableData = ref<NakitAkisRecord[]>([]);
const loading = ref(false);
const selectedDate = ref('');
const datePopup = ref();

// Pagination state
const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0
});

// Paginated data - sadece mevcut sayfadaki kayıtları göster
const paginatedData = computed(() => {
  const startIndex = (pagination.value.page - 1) * pagination.value.rowsPerPage;
  const endIndex = startIndex + pagination.value.rowsPerPage;
  const paginated = tableData.value.slice(startIndex, endIndex);
  
  console.log(`📊 Pagination: Sayfa ${pagination.value.page}, ${pagination.value.rowsPerPage} kayıt/sayfa`);
  console.log(`📊 Toplam kayıt: ${tableData.value.length}, Gösterilen: ${startIndex + 1}-${Math.min(endIndex, tableData.value.length)}`);
  console.log(`📊 Paginated data uzunluğu: ${paginated.length}`);
  
  return paginated;
});

// Tablo sütunları
const columns = [
  {
    name: 'odmVade',
    label: 'Ödeme Vadesi',
    field: 'OdmVade',
    align: 'left' as const,
    sortable: true,
    style: 'width: 100px'
  },
  {
    name: 'odemeAraci',
    label: 'Ödeme Aracı',
    field: 'odemeAraci',
    align: 'left' as const,
    sortable: true,
    style: 'width: 100px'
  },
  {
    name: 'kategori',
    label: 'Kategori',
    field: 'kategori',
    align: 'left' as const,
    sortable: true,
    style: 'width: 100px'
  },
  {
    name: 'aciklama',
    label: 'İşlem Açıklaması',
    field: 'aciklama',
    align: 'left' as const,
    sortable: true,
    style: 'width: 180px'
  },
  {
    name: 'tip',
    label: 'İşlem Tipi',
    field: 'tip',
    align: 'center' as const,
    sortable: true,
    style: 'width: 100px'
  },
  {
    name: 'tutar',
    label: 'Tutar',
    field: 'tutar',
    align: 'right' as const,
    sortable: true,
    style: 'width: 100px',
    format: (val: number) => `₺ ${val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  {
    name: 'taksit',
    label: 'Taksit',
    field: 'taksit',
    align: 'center' as const,
    sortable: true,
    style: 'width: 70px'
  },
  {
    name: 'digerBilgiler',
    label: 'Diğer Bilgiler',
    field: 'digerBilgiler',
    align: 'left' as const,
    sortable: false,
    style: 'width: 150px'
  }
  // Ödeme Durumu ve Tutar Durumu sütunları kaldırıldı
];

// Sayfa yüklendiğinde çalışır
onMounted(async () => {
  // Bugünün tarihini otomatik seç
  selectedDate.value = getBugunTarih();
  
  // Veriyi yükle
  await loadData();
  
  // Tablo başlık satırını stillendir
  await nextTick();
  applyHeaderStyling();
  
  // MutationObserver ile DOM değişikliklerini dinle
  setupMutationObserver();
});

// Tablo başlık satırını stillendiren fonksiyon
function applyHeaderStyling() {
  // Quasar'ın CSS'ini override etmek için gecikme ekle
  setTimeout(() => {
    const headerRows = document.querySelectorAll('.nakit-tablo-grid .q-table__thead th, .q-table__thead th, .q-table th');
    headerRows.forEach((headerCell) => {
      const headerElement = headerCell as HTMLElement;
      const isDarkMode = document.body.classList.contains('body--dark');
      
      if (isDarkMode) {
        headerElement.style.setProperty('background-color', '#0a0a0a', 'important');
        headerElement.style.setProperty('color', '#ffffff', 'important');
        headerElement.style.setProperty('border-bottom', '1px solid #34495e', 'important');
      } else {
        headerElement.style.setProperty('background-color', '#000000', 'important');
        headerElement.style.setProperty('color', '#ffffff', 'important');
        headerElement.style.setProperty('border-bottom', '1px solid #34495e', 'important');
      }
      headerElement.style.setProperty('font-weight', '600', 'important');
    });
    
    // Tarih seçimi altındaki çizgiyi JavaScript ile de kaldır
    const tableActions = document.querySelectorAll('.table-actions');
    tableActions.forEach((actionElement) => {
      const element = actionElement as HTMLElement;
      element.style.setProperty('border-bottom', 'none', 'important');
      element.style.setProperty('border', 'none', 'important');
      element.style.setProperty('outline', 'none', 'important');
      element.style.setProperty('box-shadow', 'none', 'important');
    });
    
    // Tarih input'undaki çizgiyi de kaldır
    const dateInputs = document.querySelectorAll('.q-input, .q-input .q-field__control, .q-input .q-field__native, .q-input .q-field__control-container');
    dateInputs.forEach((inputElement) => {
      const element = inputElement as HTMLElement;
      element.style.setProperty('border-bottom', 'none', 'important');
      element.style.setProperty('border', 'none', 'important');
      element.style.setProperty('outline', 'none', 'important');
      element.style.setProperty('box-shadow', 'none', 'important');
      element.style.setProperty('border-radius', '0', 'important');
    });
    
    // Pseudo element'leri de kaldır
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .q-input .q-field__control::before,
      .q-input .q-field__control::after,
      .q-input .q-field__control:before,
      .q-input .q-field__control:after {
        border-bottom: none !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    console.log('🎨 Tablo başlık satırı stillendirildi (setTimeout ile)');
    console.log('🧹 Tarih seçimi altındaki çizgi JavaScript ile de kaldırıldı');
  }, 100); // 100ms gecikme
}

// MutationObserver ile DOM değişikliklerini dinle
function setupMutationObserver() {
  const tableContainer = document.querySelector('.nakit-tablo-grid');
  if (!tableContainer) return;
  
  const observer = new MutationObserver((mutations) => {
    let shouldReapply = false;
    
    mutations.forEach((mutation) => {
      // Tablo satırları eklendi/çıkarıldı mı kontrol et
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'TR' || element.querySelector('tr')) {
              shouldReapply = true;
            }
          }
        });
        
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'TR' || element.querySelector('tr')) {
              shouldReapply = true;
            }
          }
        });
      }
    });
    
    // Eğer tablo satırları değiştiyse CSS sınıflarını yeniden uygula
    if (shouldReapply) {
      console.log('🔄 DOM değişikliği tespit edildi, CSS sınıfları yeniden uygulanıyor...');
      void nextTick().then(() => {
        void applyRowStyling(paginatedData.value);
        applyHeaderStyling(); // Tablo başlık satırını da stillendir
      });
    }
  });
  
  // Tablo container'ını gözlemle
  observer.observe(tableContainer, {
    childList: true,
    subtree: true
  });
  
  console.log('🔍 MutationObserver kuruldu - DOM değişiklikleri dinleniyor...');
}

// Satır sınıf adını belirleyen fonksiyon
function getRowClass(row: NakitAkisRecord) {
  // Debug: Satır verilerini kontrol et
  console.log(`🔍 getRowClass çağrıldı - Satır ID: ${row.id}`);
  console.log(`🔍 odemeDurumu değeri: ${row.odemeDurumu} (tip: ${typeof row.odemeDurumu})`);
  console.log(`🔍 Ham veri:`, row);
  
  // Boolean true kontrolü
  if (row.odemeDurumu === true) {
    console.log(`✅ Satır ${row.id} ödenmiş olarak işaretlendi - 'odenen-satir' sınıfı eklendi`);
    return 'odenen-satir';
  }
  
  console.log(`❌ Satır ${row.id} ödenmemiş - normal zemin rengi`);
  return '';
}

// Tablo pagination event'ini dinle
function onTableRequest(requestProp: { 
  pagination: { 
    sortBy: string; 
    descending: boolean; 
    page: number; 
    rowsPerPage: number; 
    rowsNumber?: number; 
  }; 
  filter?: string | null; 
  getCellValue: (col: { field: string; name: string }, row: NakitAkisRecord) => string | number; 
}) {
  console.log('🔄 Tablo pagination değişti:', requestProp);
  
  // Pagination state'ini güncelle
  pagination.value = {
    page: requestProp.pagination.page,
    rowsPerPage: requestProp.pagination.rowsPerPage,
    rowsNumber: requestProp.pagination.rowsNumber || 0
  };
  
  // Pagination değiştiğinde CSS sınıflarını yeniden uygula
  void nextTick().then(() => {
    void applyRowStyling(paginatedData.value);
    applyHeaderStyling(); // Tablo başlık satırını da stillendir
  });
}

// Pagination güncellemelerini dinle
function onPaginationUpdate(newPagination: { 
  page: number; 
  rowsPerPage: number; 
  rowsNumber?: number; 
}) {
  console.log('🔄 Pagination güncellendi:', newPagination);
  
  // Pagination state'ini güncelle
  pagination.value = {
    page: newPagination.page,
    rowsPerPage: newPagination.rowsPerPage,
    rowsNumber: newPagination.rowsNumber || 0
  };
  
  // Pagination güncellendiğinde CSS sınıflarını yeniden uygula
  void nextTick().then(() => {
    void applyRowStyling(paginatedData.value);
    applyHeaderStyling(); // Tablo başlık satırını da stillendir
  });
}

// Pagination değişikliklerini dinle - daha kapsamlı
watch(() => $q.screen.gt.sm, async () => {
  console.log('🔄 Screen size değişti, CSS sınıfları yeniden uygulanıyor...');
  await applyRowStyling(paginatedData.value);
  applyHeaderStyling(); // Tablo başlık satırını da stillendir
});

// Tablo verisi değiştiğinde CSS sınıflarını uygula
watch(tableData, async () => {
  console.log('🔄 tableData değişti, CSS sınıfları uygulanıyor...');
  await applyRowStyling(paginatedData.value);
  applyHeaderStyling(); // Tablo başlık satırını da stillendir
}, { deep: true });

// CSS sınıflarını uygulayan fonksiyon - daha güçlü
async function applyRowStyling(data: NakitAkisRecord[]) {
  if (!data || data.length === 0) return;
  
  // Next tick'te DOM güncellemesini bekle
  await nextTick();
  console.log('🔄 DOM güncellendi, CSS sınıfları kontrol ediliyor...');
  
  // Tablo başlık satırını manuel olarak stillendir
  const headerRows = document.querySelectorAll('.nakit-tablo-grid .q-table__thead th, .q-table__thead th, .q-table th');
  headerRows.forEach((headerCell) => {
    const headerElement = headerCell as HTMLElement;
    const isDarkMode = document.body.classList.contains('body--dark');
    
    if (isDarkMode) {
      headerElement.style.setProperty('background-color', '#0a0a0a', 'important');
      headerElement.style.setProperty('color', '#ffffff', 'important');
      headerElement.style.setProperty('border-bottom', '1px solid #34495e', 'important');
    } else {
      headerElement.style.setProperty('background-color', '#000000', 'important');
      headerElement.style.setProperty('color', '#ffffff', 'important');
      headerElement.style.setProperty('border-bottom', '1px solid #34495e', 'important');
    }
    headerElement.style.setProperty('font-weight', '600', 'important');
  });
  
  // Tarih seçimi altındaki çizgiyi JavaScript ile de kaldır
  const tableActions = document.querySelectorAll('.table-actions');
  tableActions.forEach((actionElement) => {
    const element = actionElement as HTMLElement;
    element.style.setProperty('border-bottom', 'none', 'important');
    element.style.setProperty('border', 'none', 'important');
    element.style.setProperty('outline', 'none', 'important');
    element.style.setProperty('box-shadow', 'none', 'important');
  });
  
  // Tarih input'undaki çizgiyi de kaldır
  const dateInputs = document.querySelectorAll('.q-input, .q-input .q-field__control, .q-input .q-field__native, .q-input .q-field__control-container');
  dateInputs.forEach((inputElement) => {
    const element = inputElement as HTMLElement;
    element.style.setProperty('border-bottom', 'none', 'important');
    element.style.setProperty('border', 'none', 'important');
    element.style.setProperty('outline', 'none', 'important');
    element.style.setProperty('box-shadow', 'none', 'important');
    element.style.setProperty('border-radius', '0', 'important');
  });
  
  // Pseudo element'leri de kaldır
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .q-input .q-field__control::before,
    .q-input .q-field__control::after,
    .q-input .q-field__control:before,
    .q-input .q-field__control:after {
      border-bottom: none !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }
  `;
  document.head.appendChild(styleElement);
  
  // Önce tüm satırlardan eski CSS sınıflarını temizle
  const allTableRows = document.querySelectorAll('.nakit-tablo-grid tbody tr');
  allTableRows.forEach(row => {
    row.classList.remove('odenen-satir');
    const rowElement = row as HTMLElement;
    rowElement.style.backgroundColor = '';
    rowElement.style.borderLeft = '';
  });
  console.log('🧹 Tüm satırlardan eski CSS sınıfları temizlendi');
  
  // Her satır için CSS sınıfını manuel olarak uygula
  data.forEach((row, dataIndex) => {
    if (row.odemeDurumu === true) {
      console.log(`✅ Satır ${dataIndex + 1} için 'odenen-satir' sınıfı uygulanıyor...`);
      console.log(`🔍 Satır verisi: odemeDurumu = ${row.odemeDurumu}`);
      
      // Tablo satırını bul - data-index attribute'u ile eşleştir
      const tableRows = document.querySelectorAll('.nakit-tablo-grid tbody tr');
      console.log(`🔍 Bulunan tablo satırları: ${tableRows.length}`);
      
      // Satırı bul - data-index veya sıra ile eşleştir
      let targetRow: Element | null = null;
      
      // Method 1: data-index attribute ile eşleştir
      targetRow = document.querySelector(`.nakit-tablo-grid tbody tr[data-index="${dataIndex}"]`);
      
      // Method 2: Eğer data-index yoksa, sıra ile eşleştir
      if (!targetRow && tableRows[dataIndex]) {
        targetRow = tableRows[dataIndex];
      }
      
      // Method 3: Satır içeriğini kontrol ederek eşleştir
      if (!targetRow) {
        for (let i = 0; i < tableRows.length; i++) {
          const rowContent = tableRows[i].textContent;
          if (rowContent && rowContent.includes(row.OdmVade)) {
            targetRow = tableRows[i];
            break;
          }
        }
      }
      
      if (targetRow) {
        // CSS sınıfını ekle
        targetRow.classList.add('odenen-satir');
        console.log(`✅ Satır ${dataIndex + 1} için 'odenen-satir' sınıfı eklendi`);
        
        // CSS sınıfının gerçekten eklenip eklenmediğini kontrol et
        const hasClass = targetRow.classList.contains('odenen-satir');
        console.log(`🔍 Satır ${dataIndex + 1} CSS sınıfı kontrol: ${hasClass}`);
        
        // Inline style olarak da ekle (CSS override'ı için)
        const rowElement = targetRow as HTMLElement;
        
        // Dark mode kontrolü
        const isDarkMode = document.body.classList.contains('body--dark');
        
        if (isDarkMode) {
          // Dark mode için renkler
          rowElement.style.backgroundColor = '#3a3a3a'; // Dark mode tablo zemininden bir ton açık
          rowElement.style.borderLeft = '4px solid #6c757d'; // Sol kenar gri çizgi
        } else {
          // Light mode için renkler
          rowElement.style.backgroundColor = '#f8f9fa'; // Light mode tablo zemininden bir ton açık
          rowElement.style.borderLeft = '4px solid #6c757d'; // Sol kenar gri çizgi
        }
        
        console.log(`✅ Satır ${dataIndex + 1} için inline style eklendi (Dark mode: ${isDarkMode})`);
        
        // Satır elementinin computed style'ını kontrol et
        const computedStyle = window.getComputedStyle(targetRow);
        console.log(`🔍 Satır ${dataIndex + 1} computed background-color:`, computedStyle.backgroundColor);
        
      } else {
        console.log(`❌ Satır ${dataIndex + 1} bulunamadı!`);
      }
    } else {
      console.log(`❌ Satır ${dataIndex + 1} ödenmemiş - odemeDurumu: ${row.odemeDurumu}`);
    }
  });
  
  // Tüm tablo satırlarını kontrol et
  console.log('🔍 Tüm tablo satırları:');
  const allRows = document.querySelectorAll('.nakit-tablo-grid tbody tr');
  allRows.forEach((row, index) => {
    console.log(`  Satır ${index}:`, row.className, row.outerHTML.substring(0, 100));
  });
}

// Debug: Fonksiyon tanımlandı mı kontrol et
console.log('🔍 getRowClass fonksiyonu tanımlandı:', typeof getRowClass);
console.log('🔍 watch fonksiyonu tanımlandı:', typeof watch);

// Veri yükleme fonksiyonu
async function loadData() {
  try {
    loading.value = true;
    
    // SP'ye seçilen tarihi doğrudan gönder
    console.log(`🔍 SP'ye gönderilen tarih: "${selectedDate.value}"`);
    console.log(`🔍 Tarih uzunluğu: ${selectedDate.value.length}`);
    console.log(`🔍 Tarih formatı kontrol: ${/^\d{2}\.\d{2}\.\d{4}$/.test(selectedDate.value)}`);
    
    // Nakit akış verilerini getir
    const veriler = await getNakitAkisVerileri(selectedDate.value);
    
    // Debug: Gelen veriyi kontrol et
    console.log('🔍 Backend\'den gelen veri:', veriler);
    if (veriler.length > 0) {
      console.log('🔍 İlk kayıt:', veriler[0]);
      console.log('🔍 İlk kayıt alanları:', Object.keys(veriler[0]));
      console.log('🔍 OdmVade değeri:', veriler[0].OdmVade);
      console.log('🔍 OdmVade tipi:', typeof veriler[0].OdmVade);
      console.log('🔍 OdmVade uzunluğu:', veriler[0].OdmVade?.length);
      
      // İlk 3 kayıt için OdmVade değerlerini kontrol et
      for (let i = 0; i < Math.min(3, veriler.length); i++) {
        console.log(`🔍 Satır ${i + 1} OdmVade: "${veriler[i].OdmVade}"`);
      }
    }
    
    tableData.value = veriler;
    
    // Pagination'ı güncelle - toplam kayıt sayısını set et
    pagination.value.rowsNumber = veriler.length;
    pagination.value.page = 1; // İlk sayfaya dön
    
    if (veriler.length === 0) {
      $q.notify({
        type: 'info',
        message: `${selectedDate.value} tarihi için veri bulunamadı. Örnek veriler gösteriliyor.`,
        position: 'top'
      });
      // Örnek verileri göster
      tableData.value = getOrnekVeriler();
    }
    
  } catch (error) {
    console.error('Veri yüklenirken hata:', error);
    $q.notify({
      type: 'negative',
      message: `Veri yüklenemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
      position: 'top'
    });
    
    // Hata durumunda örnek verileri göster
    tableData.value = getOrnekVeriler();
  } finally {
    loading.value = false;
  }
}

// Yeni kayıt ekleme fonksiyonu
const addNewRecord = () => {
  $q.notify({
    type: 'info',
    message: 'Yeni kayıt ekleme özelliği yakında eklenecek',
    position: 'top'
  });
};

// Tarih değişikliği fonksiyonu
async function onDateSelected() {
  if (selectedDate.value && selectedDate.value.length === 10) {
    // Date picker popup'ını kapat
    if (datePopup.value) {
      datePopup.value.hide();
    }
    
    // Veriyi yükle
    await loadData();
  }
}

// Tabloyu yenileme fonksiyonu kaldırıldı - artık gerekli değil

</script>

<style>
/* GLOBAL CSS - Quasar'ı override etmek için scoped kaldırıldı */

/* EN GÜÇLÜ SELECTOR'LAR - Quasar'ı kesinlikle override edecek */
.nakit-tablo-grid .q-table__container .q-table__thead th,
.q-table__container .q-table__thead th,
.q-table__thead th,
th,
.q-table th,
.q-table__thead th,
.q-table__container .q-table__thead th,
.nakit-tablo-grid th {
  height: 32px !important;
  padding: 6px 12px !important;
  background-color: #000000 !important; /* Tam siyah zemin */
  color: #ffffff !important; /* Beyaz yazı rengi */
  font-weight: 600 !important; /* Kalın yazı */
  border-bottom: 1px solid #34495e !important; /* Kenar çizgisi */
}

/* Quasar'ın tüm CSS'ini override et - daha güçlü */
.q-table__container .q-table__thead th,
.q-table__thead th,
.q-table th {
  background-color: #000000 !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  border-bottom: 1px solid #34495e !important;
}

/* Global override - en güçlü */
body .q-table__thead th,
body .q-table th,
html body .q-table__thead th,
html body .q-table th {
  background-color: #000000 !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  border-bottom: 1px solid #34495e !important;
}

/* Sayfa tasarımı */
.nakit-tablo-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.nakit-tablo-wrapper {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.table-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-actions {
  padding: 12px;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  border-bottom: none !important;
}

.date-selector {
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nakit-tablo-grid {
  background: transparent;
}

/* Tablo satır stilleri */
.nakit-tablo-grid .q-table__container .q-table__tbody tr {
  height: 45px !important;
}

.nakit-tablo-grid .q-table__container .q-table__tbody td {
  padding: 6px 12px !important;
  vertical-align: middle;
}

/* Tablo hücre içeriğini daha kompakt yap */
.nakit-tablo-grid .q-table__container .q-table__tbody td .q-field__control {
  min-height: 32px;
}

.nakit-tablo-grid .q-table__container .q-table__tbody td .q-btn {
  height: 28px;
  padding: 0 8px;
}

/* Ödenmiş satırlar için CSS sınıfı - EN GÜÇLÜ */
.nakit-tablo-grid .q-table__container .q-table__tbody tr.odenen-satir {
  background-color: #f8f9fa !important; /* Tablo zemininden bir ton açık */
  border-left: 4px solid #6c757d !important; /* Sol kenar gri çizgi */
}

.nakit-tablo-grid .q-table__container .q-table__tbody tr.odenen-satir:hover {
  background-color: #e9ecef !important; /* Hover'da biraz daha koyu */
}

/* Quasar tablosunun CSS'ini override et */
.q-table__container .q-table__tbody tr.odenen-satir {
  background-color: #f8f9fa !important;
  border-left: 4px solid #6c757d !important;
}

.q-table__container .q-table__tbody tr.odenen-satir:hover {
  background-color: #e9ecef !important;
}

/* Alternatif seçiciler - daha güçlü */
tr.odenen-satir {
  background-color: #f8f9fa !important; /* Tablo zemininden bir ton açık */
  border-left: 4px solid #6c757d !important;
}

tr.odenen-satir:hover {
  background-color: #e9ecef !important;
}

/* En güçlü selector - global */
body tr.odenen-satir {
  background-color: #f8f9fa !important;
  border-left: 4px solid #6c757d !important;
}

body tr.odenen-satir:hover {
  background-color: #e9ecef !important;
}

/* Dark mode uyumu */
.body--dark .nakit-tablo-page {
  background: var(--q-dark);
}

.body--dark .table-container {
  background: rgba(30, 30, 30, 0.95);
}

.body--dark .table-actions {
  background: #2c3e50;
}

/* Dark mode için ödenmiş satırlar - tablo zemininden bir ton açık */
.body--dark .nakit-tablo-grid .q-table__container .q-table__tbody tr.odenen-satir {
  background-color: #3a3a3a !important; /* Dark mode tablo zemininden bir ton açık */
  border-left: 4px solid #6c757d !important; /* Sol kenar gri çizgi */
}

.body--dark .nakit-tablo-grid .q-table__container .q-table__tbody tr.odenen-satir:hover {
  background-color: #4a4a4a !important; /* Hover'da biraz daha açık */
}

/* Dark mode için tablo başlık satırı - EN GÜÇLÜ */
.body--dark .nakit-tablo-grid .q-table__container .q-table__thead th,
.body--dark .q-table__container .q-table__thead th,
.body--dark .q-table__thead th,
.body--dark th,
.body--dark .q-table th {
  background-color: #0a0a0a !important; /* Dark mode'da çok daha koyu */
  color: #ffffff !important; /* Beyaz yazı rengi */
  border-bottom: 1px solid #34495e !important; /* Koyu kenar çizgisi */
}

/* Dark mode global override */
body.body--dark .q-table__thead th,
body.body--dark .q-table th {
  background-color: #0a0a0a !important;
  color: #ffffff !important;
  border-bottom: 1px solid #34495e !important;
}

.body--dark tr.odenen-satir {
  background-color: #3a3a3a !important;
  border-left: 4px solid #6c757d !important;
}

.body--dark tr.odenen-satir:hover {
  background-color: #4a4a4a !important;
}

.body--dark body tr.odenen-satir {
  background-color: #3a3a3a !important;
  border-left: 4px solid #6c757d !important;
}

.body--dark body tr.odenen-satir:hover {
  background-color: #4a4a4a !important;
}

/* Tarih seçimi altındaki çizgiyi tamamen kaldır - EN GÜÇLÜ */
.table-actions,
.nakit-tablo-grid .table-actions,
body .table-actions,
html body .table-actions,
.q-table .table-actions,
.q-table__container .table-actions,
.nakit-tablo-page .table-actions,
.nakit-tablo-wrapper .table-actions,
.table-container .table-actions,
.q-page .table-actions,
.q-page .nakit-tablo-wrapper .table-actions,
body .nakit-tablo-page .table-actions,
html body .nakit-tablo-page .table-actions,
.body--dark .table-actions,
.body--dark .nakit-tablo-page .table-actions,
body.body--dark .table-actions,
.q-input,
.q-input .q-field__control,
.q-input .q-field__native,
.q-input .q-field__control-container,
.q-input .q-field__control::before,
.q-input .q-field__control::after,
.q-input .q-field__control:before,
.q-input .q-field__control:after {
  border-bottom: none !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}

/* Quasar'ın varsayılan border'larını da kaldır - daha güçlü */
.q-table .table-actions,
.q-table__container .table-actions,
.q-page .table-actions,
.q-page .nakit-tablo-wrapper .table-actions,
.q-input,
.q-input .q-field__control,
.q-input .q-field__native,
.q-input .q-field__control-container {
  border-bottom: none !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}

/* Global override - en güçlü */
body .table-actions,
html body .table-actions,
body .nakit-tablo-page .table-actions,
html body .nakit-tablo-page .table-actions,
body .q-input,
html body .q-input,
body .q-input .q-field__control,
html body .q-input .q-field__control {
  border-bottom: none !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}

/* Dark mode için de aynı */
.body--dark .table-actions,
.body--dark .nakit-tablo-page .table-actions,
body.body--dark .table-actions,
.body--dark .q-input,
.body--dark .q-input .q-field__control,
body.body--dark .q-input,
body.body--dark .q-input .q-field__control {
  border-bottom: none !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}

/* En agresif override - tüm olası durumları kapsa */
* .table-actions,
* .q-input,
* .q-input .q-field__control,
* .q-input .q-field__native,
* .q-input .q-field__control-container {
  border-bottom: none !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}

/* Diğer stiller */
.no-data-message {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.no-data-message p {
  margin: 16px 0 0 0;
  font-size: 1.1rem;
}

/* Responsive tasarım */
@media (max-width: 768px) {
  .nakit-tablo-wrapper {
    padding: 10px;
  }
  
  .table-actions {
    flex-direction: column;
    gap: 16px;
  }
  
  .date-selector {
    width: 100%;
    justify-content: center;
  }
  
  .action-buttons {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }
  
  .action-buttons .q-btn {
    width: 100%;
  }
}
</style>
