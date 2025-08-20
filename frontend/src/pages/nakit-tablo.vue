<template>
  <q-page class="nakit-tablo-page">
    <div class="nakit-tablo-wrapper">
      <div class="table-container">
        <div class="dual-table-wrapper">
          <!-- Sol Grid Tablo - Tek Sütun -->
          <q-table
            :rows="leftTableData"
            :columns="leftColumns"
            row-key="id"
            flat
            bordered
            square
            dense
            class="nakit-tablo-grid left-table"
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
            hide-bottom

          >
            <template v-slot:top>
              <div class="table-actions left-table-actions">
                <div class="devreden-bakiye-section">
                  <label class="devreden-bakiye-label">Devreden Bakiye</label>
                  <q-input
                    :model-value="`₺ ${devredenBakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`"
                    readonly
                    dense
                    outlined
                    class="devreden-bakiye-input"
                    style="width: 150px;"
                  />
                </div>
              </div>
            </template>
          </q-table>
          
          <!-- Sağ Grid Tablo - Ana Tablo -->
          <q-table
            :rows="paginatedData"
            :columns="columns"
            row-key="id"
            flat
            bordered
            square
            dense
            class="nakit-tablo-grid right-table"
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
                  
                  <!-- Refresh ikonu -->
                  <q-btn
                    flat
                    round
                    dense
                    icon="refresh"
                    color="primary"
                    class="refresh-btn"
                    @click="refreshPage"
                    title="Sayfayı Yenile"
                  />
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
    </div>
    
    <!-- Yeni Kayıt Ekleme Modal -->
    <q-dialog v-model="showNewRecordModal" persistent no-esc-dismiss>
      <q-card 
        ref="modalCard"
        style="min-width: 600px; max-width: 90vw;" 
        class="new-record-modal draggable-modal"
      >
        <q-card-section class="modal-header" style="cursor: move;">
          <div class="modal-title-section">
            <div class="modal-title-left">
              <span class="modal-title">FON KAYIT İŞLEMLERİ</span>
            </div>
          </div>
        </q-card-section>

        <q-card-section class="modal-body">
          <div class="form-grid">
            <!-- İşlem Günü -->
            <div class="form-field">
              <label class="form-label">İşlem Günü</label>
              <q-input
                v-model="newRecord.islemGunu"
                dense
                outlined
                class="form-input"
                readonly
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy ref="islemGunuPopup">
                      <q-date
                        v-model="newRecord.islemGunu"
                        mask="DD.MM.YYYY"
                        format="DD.MM.YYYY"
                        @update:model-value="() => islemGunuPopup?.hide?.()"
                      />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <!-- İşlem Aracı -->
            <div class="form-field">
              <label class="form-label">İşlem Aracı</label>
              <q-select
                v-model="newRecord.islemAraci"
                :options="islemAraciOptions"
                dense
                outlined
                class="form-input"
                emit-value
                map-options
              />
            </div>

            <!-- İşlem Tipi -->
            <div class="form-field">
              <label class="form-label">İşlem Tipi</label>
              <q-select
                v-model="newRecord.islemTipi"
                :options="islemTipiOptions"
                dense
                outlined
                class="form-input"
                emit-value
                map-options
              />
            </div>

            <!-- İşlem Kategorisi -->
            <div class="form-field">
              <label class="form-label">İşlem Kategorisi</label>
              <q-select
                v-model="newRecord.islemKategorisi"
                :options="islemKategoriOptions"
                dense
                outlined
                class="form-input"
                emit-value
                map-options
              />
            </div>

            <!-- İşlem Tanımı -->
            <div class="form-field">
              <label class="form-label">İşlem Tanımı</label>
              <q-select
                v-model="islemTanimiModel"
                :options="islemTanimiOptions"
                dense
                outlined
                class="form-input islem-tanimi-select"
                use-input
                hide-dropdown-icon
                input-debounce="300"
                popup-content-class="islem-tanimi-popup"
                style="width: 100%;"
                v-model:input-value="islemTanimiText"
                menu-anchor="bottom left"
                menu-self="top left"
                fit
                placeholder="İşlem tanımı yazın veya seçin..."
                @filter="onFilterIslemTanimi"
                @update:model-value="onIslemTanimiSelect"
                @blur="onIslemTanimiBlur"
                clearable
              >
                <template v-slot:prepend>
                  <q-icon name="search" color="green-6" />
                </template>
                <template v-slot:before-options>
                  <div class="row text-caption text-grey-7 q-px-sm q-pt-sm q-pb-xs islem-tanimi-header">
                    <div class="col-12">İşlem Tanımı</div>
                  </div>
                  <q-separator />
                </template>
                <template v-slot:option="{ opt }">
                  <q-item dense>
                    <q-item-section>
                      <div class="islem-tanimi-option">
                        {{ opt }}
                      </div>
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      Sonuç bulunamadı. Yazdığınız değer otomatik olarak eklenir.
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- İşlem Açıklaması -->
            <div class="form-field">
              <label class="form-label">İşlem Açıklaması</label>
              <q-input
                v-model="newRecord.islemAciklamasi"
                dense
                outlined
                class="form-input"
                type="textarea"
                rows="3"
              />
            </div>

            <!-- Ödeme Tutarı -->
            <div class="form-field payment-amount-field">
              <label class="form-label">Ödeme Tutarı</label>
              <div class="payment-input-group">
                <q-input
                  v-model.number="newRecord.odemeTutari"
                  dense
                  outlined
                  class="form-input payment-input"
                  type="number"
                  min="0"
                  step="0.01"
                />
                <q-checkbox
                  v-model="newRecord.odendi"
                  label="Ödendi"
                  class="form-checkbox payment-checkbox"
                />
                <div class="taksit-group">
                  <label class="taksit-label">Taksit</label>
                  <q-input
                    v-model.number="newRecord.taksitSayisi"
                    dense
                    outlined
                    class="form-input taksit-input"
                    type="number"
                    min="1"
                    max="99"
                  />
                </div>
                <!-- Kayıt Takip Checkbox -->
                <div class="form-field checkbox-field">
                  <q-checkbox
                    v-model="newRecord.kayitTakip"
                    label="Kayıt Takip"
                    class="form-checkbox"
                  />
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions class="modal-actions">
          <div class="action-buttons-container">
            <q-btn
              color="primary"
              icon="add"
              label="YENİ KAYIT EKLE"
              @click="saveNewRecord"
              class="action-btn primary-btn"
            />
            <q-btn
              color="primary"
              icon="close"
              label="KAPAT"
              @click="closeNewRecordModal"
              class="action-btn close-btn"
            />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import { useQuasar } from 'quasar';
import { getNakitAkisVerileri, getBugunTarih, getOrnekVeriler, getFonDevirY, getIslmAltGruplar, type NakitAkisRecord } from '../services/nakit-akis.service';

const $q = useQuasar();

// Reactive data
const tableData = ref<NakitAkisRecord[]>([]);
const loading = ref(false);
const selectedDate = ref('');
const datePopup = ref();
const devredenBakiye = ref(0);

// Devreden bakiye güncelleme fonksiyonu
async function updateDevredenBakiye(tarih: string) {
  try {
    const devirBakiye = await getFonDevirY(tarih);
    
    // Number olarak sakla
    devredenBakiye.value = devirBakiye;
    
  } catch (error) {
    console.error('Devreden bakiye güncellenirken hata:', error);
    
    // Hata durumunda varsayılan değer
    devredenBakiye.value = 0;
    
    $q.notify({
      type: 'warning',
      message: `Devreden bakiye alınamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
    });
  }
}

// Sol tablo için veri ve sütunlar
const leftTableData = computed(() => {
  return paginatedData.value.map((row, index) => {
    if (index === 0) {
      // İlk satır - Sayfa devir bakiyesi + Ana tablo 1. satır işlemi
      let bakiye = getPageDevirBakiyesi();
      
      // Ana tablonun ilk satırındaki işlem tipine göre hesapla
      if (paginatedData.value.length > 0) {
        const firstRow = paginatedData.value[0];
        const islemTipi = firstRow.tip;
        const tutar = Number(firstRow.tutar) || 0;
        
        if (islemTipi === 'Çıkan') {
          bakiye -= tutar;
        } else if (islemTipi === 'Giren') {
          bakiye += tutar;
        }
      }
      
      return {
        id: `left-${index}`,
        index: bakiye.toFixed(2)
      };
    } else {
      // 2. ve sonraki satırlar - Bir üst satır sonucu + Ana tablo işlemi
      let bakiye = 0;
      
      // Bir üst satırın sonucunu hesapla
      if (index > 0 && index <= paginatedData.value.length) {
        let previousBakiye = getPageDevirBakiyesi();
        
        // Bir üst satıra kadar olan tüm işlemleri hesapla
        for (let i = 0; i < index; i++) {
          const currentRow = paginatedData.value[i];
          const islemTipi = currentRow.tip;
          const tutar = Number(currentRow.tutar) || 0;
          
          if (islemTipi === 'Çıkan') {
            previousBakiye -= tutar;
          } else if (islemTipi === 'Giren') {
            previousBakiye += tutar;
          }
        }
        
        // Şimdi mevcut satır için işlem yap
        const currentRow = paginatedData.value[index];
        const islemTipi = currentRow.tip;
        const tutar = Number(currentRow.tutar) || 0;
        
        if (islemTipi === 'Çıkan') {
          bakiye = previousBakiye - tutar;
        } else if (islemTipi === 'Giren') {
          bakiye = previousBakiye + tutar;
        } else {
          bakiye = previousBakiye; // İşlem tipi belirsizse sadece devir
        }
      }
      
      return {
        id: `left-${index}`,
        index: bakiye.toFixed(2)
      };
    }
  });
});

// Sayfa devir bakiyesini hesaplayan fonksiyon
function getPageDevirBakiyesi(): number {
  const currentPage = pagination.value.page;
  
  if (currentPage === 1) {
    // İlk sayfa - Devreden Bakiye'den başla
    return devredenBakiye.value || 0;
  } else {
    // 2. ve sonraki sayfalar - Önceki sayfanın son satırından devir al
    const previousPage = currentPage - 1;
    const previousPageStartIndex = (previousPage - 1) * pagination.value.rowsPerPage;
    const previousPageEndIndex = previousPageStartIndex + pagination.value.rowsPerPage;
    
    // Önceki sayfadaki tüm işlemleri hesapla
    let previousPageBakiye = devredenBakiye.value || 0;
    
    for (let i = 0; i < previousPageEndIndex; i++) {
      if (i < tableData.value.length) {
        const currentRow = tableData.value[i];
        const islemTipi = currentRow.tip;
        const tutar = Number(currentRow.tutar) || 0;
        
        if (islemTipi === 'Çıkan') {
          previousPageBakiye -= tutar;
        } else if (islemTipi === 'Giren') {
          previousPageBakiye += tutar;
        }
      }
    }
    
    return previousPageBakiye;
  }
}

const leftColumns = [
  {
    name: 'index',
    label: 'Bakiye',
    field: 'index',
    align: 'center' as const,
    sortable: false,
    style: 'width: 80px',
    format: (val: string | number) => {
      if (typeof val === 'string' && !isNaN(Number(val))) {
        // İlk satır için bakiye formatı
        return `₺ ${Number(val).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      } else {
        // Diğer satırlar için sıra numarası
        return val.toString();
      }
    }
  }
];

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
    style: 'width: 80px'
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
    style: 'width: 180px'
  }
  // Ödeme Durumu ve Tutar Durumu sütunları kaldırıldı
];

// Yeni kayıt modalı durumu
const showNewRecordModal = ref(false);

// Yeni kayıt bilgileri
const newRecord = ref({
  islemGunu: '',
  islemAraci: '',
  islemTipi: '',
  islemKategorisi: '',
  islemTanimi: '',
  odemeTutari: 0,
  odendi: false,
  taksitSayisi: 1,
  islemAciklamasi: '',
  kayitTakip: true,
});

// Date picker popup ref'leri
const islemGunuPopup = ref();
const modalCard = ref();

// İşlem Aracı seçenekleri
const islemAraciOptions = ['Nakit Kasa(TL)', 'Banka EFT', 'Kredi Kartları'];
const islemTipiOptions = ['Çıkan', 'Giren'];
const islemKategoriOptions = ['Kredi Kartları', 'Krediler', 'Ev Kiraları', 'Ev Faturaları', 'Senet-Çek', 'Genel Fon Ödm.', 'Diğer(Şirket Ödm.)'];

// İşlem Tanımı seçenekleri (dinamik olarak güncellenir)
const islemTanimiOptions = ref<string[]>([]);
// 🔥 Orijinal işlem tanımı seçenekleri (arama için)
const originalIslemTanimiOptions = ref<string[]>([]);
// İşlem tanımı input text'i için
const islemTanimiText = ref('');
// İşlem tanımı seçim modeli için
const islemTanimiModel = ref<string | null>(null);

// Sayfa yüklendiğinde çalışır
onMounted(async () => {
  // Bugünün tarihini otomatik seç
  selectedDate.value = getBugunTarih();
  
  // Devreden bakiyeyi güncelle
  await updateDevredenBakiye(selectedDate.value);
  
  // Veriyi yükle
  await loadData();
  
  // Tablo başlık satırını stillendir
  await nextTick();
  applyHeaderStyling();
  
  // MutationObserver ile DOM değişikliklerini dinle
  setupMutationObserver();
  
  // Modal draggable özelliğini ayarla
  setupModalDraggable();
});

// Sayfayı yenileme fonksiyonu
async function refreshPage() {
  try {
    loading.value = true;
    
    // Devreden bakiyeyi güncelle
    await updateDevredenBakiye(selectedDate.value);
    
    // Veriyi yeniden yükle
    await loadData();
    
    // Tablo başlık satırını stillendir
    await nextTick();
    applyHeaderStyling();
    
    $q.notify({
      type: 'positive',
      message: 'Sayfa başarıyla yenilendi!'
    });
    
  } catch (error) {
    console.error('Sayfa yenilenirken hata:', error);
    
    $q.notify({
      type: 'negative',
      message: `Sayfa yenilenirken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
    });
  } finally {
    loading.value = false;
  }
}

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
}

// Satır sınıf adını belirleyen fonksiyon
function getRowClass(row: NakitAkisRecord) {
  // Boolean true kontrolü
  if (row.odemeDurumu === true) {
    return 'odenen-satir';
  }
  
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
  await applyRowStyling(paginatedData.value);
  applyHeaderStyling(); // Tablo başlık satırını da stillendir
});

// Tablo verisi değiştiğinde CSS sınıflarını uygula
watch(tableData, async () => {
  await applyRowStyling(paginatedData.value);
  applyHeaderStyling(); // Tablo başlık satırını da stillendir
}, { deep: true });

// İslm kategorisi değiştiğinde işlem tanımı seçeneklerini güncelle
watch(() => newRecord.value.islemKategorisi, async (newKategori) => {
  if (newKategori) {
    try {
      const altGruplar = await getIslmAltGruplar(newKategori);
      islemTanimiOptions.value = altGruplar;
      // 🔥 Orijinal listeyi de güncelle (arama için)
      originalIslemTanimiOptions.value = [...altGruplar];
    } catch (error) {
      console.error('İslm alt grupları alınırken hata:', error);
      islemTanimiOptions.value = [];
      originalIslemTanimiOptions.value = [];
    }
  } else {
    islemTanimiOptions.value = [];
    originalIslemTanimiOptions.value = [];
  }
});

// CSS sınıflarını uygulayan fonksiyon - daha güçlü
async function applyRowStyling(data: NakitAkisRecord[]) {
  if (!data || data.length === 0) return;
  
  // Next tick'te DOM güncellemesini bekle
  await nextTick();
  
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
  
  // Her satır için CSS sınıfını manuel olarak uygula
  data.forEach((row, dataIndex) => {
    if (row.odemeDurumu === true) {
      // Tablo satırını bul - data-index attribute'u ile eşleştir
      const tableRows = document.querySelectorAll('.nakit-tablo-grid tbody tr');
      
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
      }
    }
  });
}

// Veri yükleme fonksiyonu
async function loadData() {
  try {
    loading.value = true;
    
    // Nakit akış verilerini getir
    const veriler = await getNakitAkisVerileri(selectedDate.value);
    
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
  showNewRecordModal.value = true;
  newRecord.value = {
    islemGunu: getBugunTarih(),
    islemAraci: 'Banka EFT', // Default: Banka EFT
    islemTipi: 'Çıkan', // Default: Çıkan
    islemKategorisi: 'Genel Fon Ödm.', // Default: Genel Fon Ödm.
    islemTanimi: '', // Boş string olarak başlat
    odemeTutari: 0,
    odendi: false,
    taksitSayisi: 1,
    islemAciklamasi: '',
    kayitTakip: true,
  };
  // İşlem tanımı input text'ini temizle
  islemTanimiText.value = '';
  // İşlem tanımı model'ini temizle
  islemTanimiModel.value = null;
};

// Yeni kayıt kaydetme fonksiyonu
function saveNewRecord() {
  if (!newRecord.value.islemAraci || !newRecord.value.islemTipi || newRecord.value.odemeTutari === 0) {
    $q.notify({
      type: 'warning',
      message: 'Lütfen tüm alanları doldurun ve ödeme tutarını 0\'dan büyük girin.',
      position: 'top'
    });
    return;
  }

  const newRecordData: NakitAkisRecord = {
    id: Date.now(), // Yeni kayıtlar için benzersiz bir ID
    OdmVade: newRecord.value.islemGunu,
    odemeAraci: newRecord.value.islemAraci,
    kategori: newRecord.value.islemKategorisi || '',
    aciklama: newRecord.value.islemAciklamasi,
    tip: newRecord.value.islemTipi,
    tutar: newRecord.value.odemeTutari,
    taksit: newRecord.value.taksitSayisi.toString(),
    digerBilgiler: `Kayıt Takip: ${newRecord.value.kayitTakip}`,
    odemeDurumu: newRecord.value.odendi,
  };

  tableData.value.push(newRecordData);
  pagination.value.rowsNumber = tableData.value.length;
  pagination.value.page = 1; // Yeni kayıt eklenince ilk sayfaya dön

  $q.notify({
    type: 'positive',
    message: 'Yeni kayıt başarıyla eklendi!',
    position: 'top'
  });

  showNewRecordModal.value = false;
  
  // İşlem tanımı input text'ini temizle
  islemTanimiText.value = '';
}

// Yeni kayıt modalını kapatma fonksiyonu
function closeNewRecordModal() {
  showNewRecordModal.value = false;
  
  // İşlem tanımı input text'ini temizle
  islemTanimiText.value = '';
}


// 🔥 Gelişmiş arama fonksiyonu - Listede olmayanı da kabul eder
function onFilterIslemTanimi(val: string, update: (callback: () => void) => void) {
  update(() => {
    if (val === '') {
      // Boş değer için tüm seçenekleri göster
      islemTanimiOptions.value = [...originalIslemTanimiOptions.value];
      return;
    }

    // Büyük/küçük harf duyarsız arama
    const searchTerm = val.toLowerCase().trim();
    
    // Orijinal listeden filtreleme yap
    const filtered = originalIslemTanimiOptions.value.filter((option) => 
      option.toLowerCase().includes(searchTerm)
    );
    
    // 🔥 Yazılan değer listede yoksa, onu da geçici olarak göster
    if (val.trim() && !originalIslemTanimiOptions.value.some(opt => opt.toLowerCase() === val.trim().toLowerCase())) {
      filtered.unshift(`${val.trim()} (Yeni)`); // En üste ekle
    }
    
    islemTanimiOptions.value = filtered;
  });
}

// İşlem tanımı değişikliği fonksiyonu - artık kullanılmıyor, onIslemTanimiSelect kullanılıyor
// function onIslemTanimiChange(value: string) {
//   // İşlem tanımı değiştiğinde yapılacak işlemler
//   console.log('İşlem tanımı değişti:', value);
// }

// İşlem tanımı seçimi yapıldığında
function onIslemTanimiSelect(value: string | null) {
  if (value) {
    // Eğer "(Yeni)" etiketi varsa, onu kaldır
    const cleanValue = value.replace(' (Yeni)', '');
    
    // Hem model'i hem de newRecord'u güncelle
    islemTanimiModel.value = cleanValue;
    newRecord.value.islemTanimi = cleanValue;
    
    console.log('İşlem tanımı seçildi:', cleanValue);
    
    // Eğer bu yeni bir değer ise, orijinal listeye ekle
    if (!originalIslemTanimiOptions.value.some(opt => opt === cleanValue)) {
      originalIslemTanimiOptions.value.push(cleanValue);
      console.log('Yeni işlem tanımı orijinal listeye eklenip kaydedildi:', cleanValue);
    }
    
    // 🔥 Seçim yapıldıktan sonra input'u blur yap ve listeyi kapat
    const inputElement = document.querySelector('.islem-tanimi-select input') as HTMLInputElement;
    if (inputElement) {
      inputElement.blur();
      // Input text'i temizle
      islemTanimiText.value = '';
    }
  }
}

// 🔥 Enter'a basınca input'u tamamen temizle ve değeri kabul et - artık kullanılmıyor
// function onIslemTanimiEnter() {
//   // Eğer input'ta yazılan değer varsa
//   if (islemTanimiText.value) {
//     // Değeri orijinal listeye ekle (eğer yoksa)
//     const newOption = { label: islemTanimiText.value, value: islemTanimiText.value };
//     if (!originalIslemTanimiOptions.value.some(opt => opt.value === islemTanimiText.value)) {
//       originalIslemTanimiOptions.value.push(newOption);
//     }
//     
//     // Seçenekleri güncelle
//     islemTanimiOptions.value = [...originalIslemTanimiOptions.value];
//     
//     // Input'u tamamen temizle
//     islemTanimiText.value = '';
//     
//     console.log('🔥 Enter ile değer kabul edildi ve input tamamen temizlendi');
//   }
// }

// 🔥 İşlem tanımı input'undan çıkıldığında (blur)
function onIslemTanimiBlur() {
  // Input text'i temizle
  islemTanimiText.value = '';
  
  // Seçenekleri orijinal listeye geri döndür
  islemTanimiOptions.value = [...originalIslemTanimiOptions.value];
  
  console.log('İşlem tanımı input\'undan çıkıldı, temizlik yapıldı');
}

// Tarih değişikliği fonksiyonu
async function onDateSelected() {
  if (selectedDate.value && selectedDate.value.length === 10) {
    // Date picker popup'ını kapat
    if (datePopup.value) {
      datePopup.value.hide();
    }
    
    // Devreden bakiyeyi güncelle
    await updateDevredenBakiye(selectedDate.value);
    
    // Veriyi yükle
    await loadData();
  }
}

// Tabloyu yenileme fonksiyonu kaldırıldı - artık gerekli değil

// Modal'ı draggable yapan fonksiyon
function setupModalDraggable() {
  let isDragging = false;
  let currentX: number;
  let currentY: number;
  let initialX: number;
  let initialY: number;
  let xOffset = 0;
  let yOffset = 0;

  function dragStart(e: MouseEvent | TouchEvent) {
    if (e.target && (e.target as HTMLElement).closest('.modal-header')) {
      isDragging = true;
      
      if (e instanceof MouseEvent) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
      } else if (e instanceof TouchEvent) {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
      }
    }
  }

  function drag(e: MouseEvent | TouchEvent) {
    if (isDragging) {
      e.preventDefault();
      
      if (e instanceof MouseEvent) {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      } else if (e instanceof TouchEvent) {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      }

      xOffset = currentX;
      yOffset = currentY;

      if (modalCard.value && modalCard.value.$el) {
        const modalElement = modalCard.value.$el as HTMLElement;
        modalElement.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    }
  }

  function dragEnd() {
    isDragging = false;
  }

  // Event listener'ları ekle
  document.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
  document.addEventListener('touchstart', dragStart);
  document.addEventListener('touchmove', drag);
  document.addEventListener('touchend', dragEnd);
}

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
  height: 29px !important;
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
  max-width: 1600px;
  margin: 0 auto;
}

.table-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.dual-table-wrapper {
  display: flex;
  width: 100%;
}

.left-table {
  flex: 0 0 80px; /* 100px'den 80px'e azaltıldı */
  border-right: 1px solid #dee2e6 !important;
}

.right-table {
  flex: 1;
  border-left: none !important;
}

/* Sol tablo için özel stiller */
.left-table .q-table__container {
  border-right: 1px solid #dee2e6;
}

.left-table .q-table__thead th {
  height: 29px !important;
  padding: 6px 4px !important;
  text-align: center;
  font-weight: 600;
  background-color: #000000 !important;
  color: #ffffff !important;
  border-bottom: 1px solid #34495e !important;
}

.left-table .q-table__tbody td {
  padding: 6px 4px !important;
  text-align: center;
  font-weight: 500;
  color: #6c757d;
}

/* Sol tablo son satırının altına çizgi ekle */
.left-table .q-table__tbody tr:last-child td {
  border-bottom: 1px solid #dee2e6 !important;
}

/* Sağ tablo için özel stiller */
.right-table .q-table__container {
  border-left: 1px solid #dee2e6;
}

.table-actions {
  padding: 2px 12px;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  border-bottom: none !important;
  min-height: 29px; /* Eşit yükseklik için artırıldı */
}

.left-table-actions {
  justify-content: center; /* Sol tablo için ortala */
  padding: 2px 8px; /* Sol tablo için daha az padding */
  min-height: 29px; /* Sağ tablo ile aynı yükseklik */
}

.devreden-bakiye-section {
  display: flex;
  flex-direction: column; /* Label ve input'u alt alta yerleştir */
  align-items: center; /* Yatay ortalama */
  justify-content: center; /* Dikey ortalama */
  gap: 8px; /* Label ve input arasındaki boşluğu azalt */
}

.devreden-bakiye-label {
  font-size: 0.8rem; /* 0.9rem'den 0.8rem'e azaltıldı */
  color: #555;
  font-weight: 500;
  text-align: center; /* Yatay ortalama */
  display: flex; /* Flexbox için */
  align-items: center; /* Dikey ortalama */
  justify-content: center; /* Yatay ortalama */
  width: 100%; /* Tam genişlik */
}

.devreden-bakiye-input {
  background-color: #f8f9fa; /* Table-actions ile aynı zemin rengi */
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 1px 8px;
  font-size: 0.9rem;
  color: #333;
  height: 29px;
  min-height: 29px;
  max-height: 29px;
  display: flex; /* Flexbox için */
  align-items: center; /* Dikey ortalama */
  justify-content: center; /* Yatay ortalama - metni ortala */
  text-align: center; /* CSS text-align ile de ortalama */
}

.date-selector {
  display: flex;
  align-items: center;
  gap: 8px; /* Date picker ile refresh ikonu arasında boşluk */
}

/* Refresh butonu stili */
.refresh-btn {
  margin-left: 4px; /* Date picker'dan biraz uzak */
}

.refresh-btn:hover {
  background-color: rgba(0, 123, 255, 0.1); /* Hover efekti */
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
  min-height: 29px;
}

.nakit-tablo-grid .q-table__container .q-table__tbody td .q-btn {
  height: 29px;
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

.body--dark .dual-table-wrapper {
  background: rgba(30, 30, 30, 0.95);
}

.body--dark .left-table .q-table__container {
  border-right: 1px solid #495057;
}

.body--dark .left-table .q-table__thead th {
  background-color: #0a0a0a !important;
  color: #ffffff !important;
  border-bottom: 1px solid #34495e !important;
}

.body--dark .right-table .q-table__container {
  border-left: 1px solid #495057;
}

.body--dark .left-table .q-table__tbody td {
  color: #adb5bd;
}

.body--dark .table-actions {
  background: #2c3e50;
  padding: 2px 12px;
  min-height: 29px; /* Eşit yükseklik için artırıldı */
}

.body--dark .left-table-actions {
  background: #2c3e50; /* Sol tablo için dark mode arka plan */
  min-height: 29px; /* Sağ tablo ile aynı yükseklik */
}

.body--dark .devreden-bakiye-label {
  color: #e0e0e0;
}

.body--dark .devreden-bakiye-input {
  background-color: #2c3e50; /* Table-actions ile aynı zemin rengi */
  border-color: #495057;
  color: #e0e0e0;
  height: 29px;
  min-height: 29px;
  max-height: 29px;
  display: flex; /* Flexbox için */
  align-items: center; /* Dikey ortalama */
  justify-content: center; /* Yatay ortalama - metni ortala */
  text-align: center; /* CSS text-align ile de ortalama */
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
  
  .devreden-bakiye-section {
    width: 100%;
    justify-content: center;
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

/* Modal Form Stilleri */
.new-record-modal {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.modal-title-left {
  flex: 1;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
}

.modal-title-right {
  background: #FFD700;
  padding: 8px 16px;
  border-radius: 6px;
}

.other-transactions {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.modal-body {
  padding: 24px;
  background: #f8f9fa;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field.checkbox-field {
  grid-column: 1 / -1;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.form-field.payment-amount-field {
  grid-column: 1 / -1;
}

.payment-input-group {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.payment-input {
  flex: 0 0 150px; /* Biraz daha geniş */
  max-width: 150px;
}

.payment-checkbox {
  flex-shrink: 0;
  margin-right: 16px;
}

.taksit-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.taksit-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.taksit-input {
  flex: 0 0 60px; /* 2 karakter sayı için optimize edilmiş genişlik */
  max-width: 60px;
  min-width: 60px;
  height: 40px; /* Diğer textbox'larla aynı yükseklik */
  min-height: 40px;
  max-height: 40px;
  margin-right: 16px;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

.form-input {
  background: #ffffff;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.form-input:hover {
  border-color: #4CAF50;
}

.form-input:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.form-checkbox {
  color: #4CAF50;
}

.modal-actions {
  padding: 20px 24px;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

.action-buttons-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.action-btn {
  height: 40px;
  font-weight: 500;
  border-radius: 6px;
}

.primary-btn {
  background: #4CAF50;
  color: white;
}

.primary-btn:hover {
  background: #45a049;
}

.secondary-btn {
  background: #6c757d;
  color: white;
}

.close-btn {
  background: #dc3545;
  color: white;
}

.close-btn:hover {
  background: #c82333;
}

/* Dark mode için modal stilleri */
.body--dark .new-record-modal {
  background: #2c3e50;
}

.body--dark .modal-header {
  background: linear-gradient(135deg, #2E7D32 0%, #388E3C 100%);
}

.body--dark .modal-body {
  background: #34495e;
}

.body--dark .form-label {
  color: #ecf0f1;
}

.body--dark .taksit-label {
  color: #ecf0f1;
}

.body--dark .form-input {
  background: #2c3e50;
  border-color: #495057;
  color: #ecf0f1;
}

.body--dark .form-input:hover {
  border-color: #4CAF50;
}

.body--dark .form-input:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
}

.body--dark .modal-actions {
  background: #34495e;
}

/* Draggable modal stilleri */
.draggable-modal {
  user-select: none;
  transition: box-shadow 0.2s ease;
}

.draggable-modal:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.modal-header {
  cursor: move;
  user-select: none;
}

.modal-header:hover {
  background: linear-gradient(135deg, #2E7D32 0%, #388E3C 100%);
}

/* Responsive modal tasarımı */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .action-buttons-container {
    gap: 8px;
  }
  
  .action-btn {
    height: 44px;
    font-size: 0.9rem;
  }
}

/* 🔥 İşlem Tanımı q-select için satır aralıklarını azalt - EN GÜÇLÜ SELECTOR'LAR */
/* Global override - tüm q-select dropdown'ları için */
body .q-select__dropdown .q-item,
html body .q-select__dropdown .q-item,
.q-select__dropdown .q-item,
.q-select .q-item,
.q-item {
  min-height: 20px !important; /* Çok daha az */
  padding: 0px 16px !important; /* Üst-alt padding'i sıfırla */
  margin: 0 !important; /* Margin'i sıfırla */
}

/* İşlem tanımı popup stilleri */
.islem-tanimi-popup {
  max-height: 300px !important;
}

.islem-tanimi-header {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.islem-tanimi-option {
  font-size: 0.9rem;
  color: #333;
}

/* Dark mode için */
.body--dark .islem-tanimi-header {
  background-color: #2c3e50;
  color: #ecf0f1;
}

.body--dark .islem-tanimi-option {
  color: #ecf0f1;
}

body .q-select__dropdown .q-item__label,
html body .q-select__dropdown .q-item__label,
.q-select__dropdown .q-item__label,
.q-select .q-item__label,
.q-item__label {
  line-height: 1 !important; /* Satır yüksekliğini minimize et */
  padding: 0 !important; /* Tüm padding'i sıfırla */
  margin: 0 !important; /* Tüm margin'i sıfırla */
}

/* Modal form içindeki q-select için özel stil - EN GÜÇLÜ */
.new-record-modal .q-select__dropdown .q-item,
.new-record-modal .q-select .q-item,
.new-record-modal .q-item {
  min-height: 16px !important; /* Çok daha az */
  padding: 0px 16px !important; /* Üst-alt padding'i sıfırla */
  margin: 0 !important; /* Margin'i sıfırla */
}

.new-record-modal .q-select__dropdown .q-item__label,
.new-record-modal .q-select .q-item__label,
.new-record-modal .q-item__label {
  line-height: 0.8 !important; /* Çok daha az */
  padding: 0 !important; /* Tüm padding'i sıfırla */
  margin: 0 !important; /* Tüm margin'i sıfırla */
}

/* 🔥 EN GÜÇLÜ OVERRIDE - Quasar'ın tüm CSS'ini kesinlikle override et */
html body .q-select__dropdown .q-item,
html body .q-select .q-item,
html body .q-item,
body .q-select__dropdown .q-item,
body .q-select .q-item,
body .q-item {
  min-height: 18px !important; /* Minimum yükseklik */
  padding: 0px 16px !important; /* Sadece yatay padding */
  margin: 0 !important; /* Margin sıfır */
  height: auto !important; /* Yüksekliği otomatik yap */
}

html body .q-select__dropdown .q-item__label,
html body .q-select .q-item__label,
html body .q-item__label,
body .q-select__dropdown .q-item__label,
body .q-select .q-item__label,
body .q-item__label {
  line-height: 0.9 !important; /* Minimum satır yüksekliği */
  padding: 0 !important; /* Padding sıfır */
  margin: 0 !important; /* Margin sıfır */
  height: auto !important; /* Yüksekliği otomatik yap */
}

/* 🔥 İşlem Tanımı q-select için özel CSS - EN GÜÇLÜ */
.islem-tanimi-select .q-select__dropdown .q-item,
.islem-tanimi-select .q-select .q-item,
.islem-tanimi-select .q-item,
.islem-tanimi-select .q-select__dropdown .q-item__label,
.islem-tanimi-select .q-select .q-item__label,
.islem-tanimi-select .q-item__label {
  min-height: 16px !important; /* Çok daha az */
  padding: 0px 16px !important; /* Sadece yatay padding */
  margin: 0 !important; /* Margin sıfır */
  height: auto !important; /* Yüksekliği otomatik yap */
  line-height: 0.8 !important; /* Minimum satır yüksekliği */
}

/* 🔥 İşlem Tanımı q-select dropdown için özel CSS */
.islem-tanimi-select .q-select__dropdown {
  max-height: 200px !important; /* Dropdown yüksekliğini sınırla */
}

.islem-tanimi-select .q-select__dropdown .q-item {
  min-height: 16px !important; /* Minimum yükseklik */
  padding: 0px 16px !important; /* Sadece yatay padding */
  margin: 0 !important; /* Margin sıfır */
  height: auto !important; /* Yüksekliği otomatik yap */
}

.islem-tanimi-select .q-select__dropdown .q-item__label {
  line-height: 0.8 !important; /* Minimum satır yüksekliği */
  padding: 0 !important; /* Padding sıfır */
  margin: 0 !important; /* Margin sıfır */
  height: auto !important; /* Yüksekliği otomatik yap */
}

/* 🔥 GLOBAL OVERRIDE - Tüm q-select dropdown'ları için */
/* Quasar'ın tüm CSS'ini kesinlikle override et */
* .q-select__dropdown .q-item,
* .q-select .q-item,
* .q-item {
  min-height: 16px !important; /* Minimum yükseklik */
  padding: 0px 16px !important; /* Sadece yatay padding */
  margin: 0 !important; /* Margin sıfır */
  height: auto !important; /* Yüksekliği otomatik yap */
}

* .q-select__dropdown .q-item__label,
* .q-select .q-item__label,
* .q-item__label {
  line-height: 0.8 !important; /* Minimum satır yüksekliği */
  padding: 0 !important; /* Padding sıfır */
  margin: 0 !important; /* Margin sıfır */
  height: auto !important; /* Yüksekliği otomatik yap */
}

/* 🔥 EN GÜÇLÜ - Tüm elementler için */
.q-select__dropdown .q-item,
.q-select .q-item,
.q-item {
  min-height: 16px !important; /* Minimum yükseklik */
  padding: 0px 16px !important; /* Sadece yatay padding */
  margin: 0 !important; /* Margin sıfır */
  height: auto !important; /* Yüksekliği otomatik yap */
}

.q-select__dropdown .q-item__label,
.q-select .q-item__label,
.q-item__label {
  line-height: 0.8 !important; /* Minimum satır yüksekliği */
  padding: 0 !important; /* Padding sıfır */
  margin: 0 !important; /* Margin sıfır */
  height: auto !important; /* Yüksekliği otomatik yap */
}

</style>
