<template>
  <q-page class="q-pa-md light-page-background">
    <div class="text-h6 q-mb-md text-center">Gelir/Gider Kayıt İşlemi</div>
    
    <div class="row">
      <div class="col-12">
        <!-- Form Container -->
        <div class="containers-wrapper">
          <!-- Ana Form -->
          <div class="ana-form-wrapper">
            <div class="ana-form-container">
              <!-- Ana Gider Container -->
              <div class="gider-main-container">
            <!-- İki Bölümlü Gider Tabloları -->
            <div class="gider-tables-row">
              <!-- Sol Bölüm (1-10) -->
              <div class="gider-table-container">
                <div class="gider-section-card">
                                     
                  <q-table
                    :rows="giderRowsSol"
                    :columns="giderColumns"
                    row-key="rowKey"
                    hide-bottom
                    flat
                    dense
                    bordered
                    square
                    class="gider-table"
                    :pagination="{ rowsPerPage: 0 }"
                    :rows-per-page-options="[0]"
                  >
                    <!-- Gider Adı Sütunu (Checkbox) -->
                    <template v-slot:body-cell-giderAdi="props">
                      <q-td>
                        <q-checkbox
                          v-model="props.row.selected"
                          :label="props.row.giderAdi"
                          @update:model-value="onCheckboxChange(props.row)"
                        />
                      </q-td>
                    </template>

                    <!-- Miktar Sütunu -->
                    <template v-slot:body-cell-miktar="props">
                      <q-td class="q-pa-none text-center">
                        <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
                          <q-input
                            v-model.number="props.row.miktar"
                            type="number"
                            :min="1"
                            :max="999"
                            dense
                            :disable="!props.row.selected"
                            style="width:40px; text-align:center;"
                            input-class="text-center"
                            @update:model-value="onMiktarChange(props.row)"
                          />
                        </div>
                      </q-td>
                    </template>

                                         <!-- Tutar Sütunu -->
                     <template v-slot:body-cell-tutar="props">
                       <q-td class="q-pa-none text-center">
                         <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
                           <q-input
                             v-model="props.row.tutar"
                             type="text"
                             dense
                             :disable="!props.row.selected"
                             style="width:100px; text-align:center;"
                             input-class="text-center"
                             @update:model-value="onTutarChange(props.row)"
                             @blur="formatTutar(props.row)"
                             @focus="unformatTutar(props.row)"
                           />
                         </div>
                       </q-td>
                     </template>

                                         <!-- Toplam Tutar Sütunu -->
                     <template v-slot:body-cell-toplamTutar="props">
                       <q-td>
                         <span v-if="props.row.selected && props.row.tutar !== null" class="text-weight-medium">
                           {{ (props.row.miktar * (parseFloat(props.row.tutar.replace(/[^\d.,]/g, '').replace(',', '.')) || 0)).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) }}
                         </span>
                       </q-td>
                     </template>
                  </q-table>
                </div>
              </div>

              <!-- Sağ Bölüm (11-20) -->
              <div class="gider-table-container">
                <div class="gider-section-card">
                                     
                  <q-table
                    :rows="giderRowsSag"
                    :columns="giderColumns"
                    row-key="rowKey"
                    hide-bottom
                    flat
                    dense
                    bordered
                    square
                    class="gider-table"
                    :pagination="{ rowsPerPage: 0 }"
                    :rows-per-page-options="[0]"
                  >
                    <!-- Gider Adı Sütunu (Checkbox) -->
                    <template v-slot:body-cell-giderAdi="props">
                      <q-td>
                        <q-checkbox
                          v-model="props.row.selected"
                          :label="props.row.giderAdi"
                          @update:model-value="onCheckboxChange(props.row)"
                        />
                      </q-td>
                    </template>

                    <!-- Miktar Sütunu -->
                    <template v-slot:body-cell-miktar="props">
                      <q-td class="q-pa-none text-center">
                        <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
                          <q-input
                            v-model.number="props.row.miktar"
                            type="number"
                            :min="1"
                            :max="999"
                            dense
                            :disable="!props.row.selected"
                            style="width:40px; text-align:center;"
                            input-class="text-center"
                            @update:model-value="onMiktarChange(props.row)"
                          />
                        </div>
                      </q-td>
                    </template>

                    <!-- Tutar Sütunu -->
                    <template v-slot:body-cell-tutar="props">
                      <q-td class="q-pa-none text-center">
                        <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
                          <q-input
                            v-model="props.row.tutar"
                            type="text"
                            dense
                            :disable="!props.row.selected"
                            style="width:100px; text-align:center;"
                            input-class="text-center"
                            @update:model-value="onTutarChange(props.row)"
                            @blur="formatTutar(props.row)"
                            @focus="unformatTutar(props.row)"
                          />
                        </div>
                      </q-td>
                    </template>

                    <!-- Toplam Tutar Sütunu -->
                    <template v-slot:body-cell-toplamTutar="props">
                      <q-td>
                        <span v-if="props.row.selected && props.row.tutar !== null" class="text-weight-medium">
                          {{ (props.row.miktar * (parseFloat(props.row.tutar.replace(/[^\d.,]/g, '').replace(',', '.')) || 0)).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) }}
                        </span>
                      </q-td>
                    </template>
                  </q-table>
                </div>
              </div>
            </div>

                                      <!-- Genel Toplam ve Not Satırı -->
             <div class="genel-toplam-not-row q-mt-md">
               <!-- Not Alanı -->
               <div class="not-container">
                 <div class="text-caption text-weight-medium q-mb-sm">Not:</div>
                                   <q-input
                    v-model="giderNotu"
                    type="textarea"
                    dense
                    outlined
                    placeholder="Gider kaydı için not ekleyebilirsiniz..."
                    rows="4"
                    class="not-textarea"
                  />
               </div>
               
                               <!-- Genel Toplam -->
                <div class="genel-toplam-container">
                  <q-table
                    :rows="[]"
                    :columns="giderColumns"
                    hide-bottom
                    hide-header
                    flat
                    dense
                    bordered
                    square
                    class="genel-toplam-table"
                    :pagination="{ rowsPerPage: 0 }"
                    :rows-per-page-options="[0]"
                  >
                    <template v-slot:bottom-row>
                      <q-tr class="genel-toplam-row">
                        <q-td colspan="3" class="text-right text-bold">GENEL TOPLAM</q-td>
                        <q-td class="text-bold genel-toplam-cell">
                          {{ genelToplamDisplay }}
                        </q-td>
                      </q-tr>
                    </template>
                  </q-table>
                  
                  <!-- Form Butonları -->
                  <div class="form-buttons-container q-mt-md">
                    <div class="row justify-center q-gutter-md">
                      <q-btn 
                        color="negative" 
                        icon="clear" 
                        label="Temizle" 
                        @click="temizleForm"
                        outline
                        size="md"
                      />
                                             <q-btn 
                         color="primary" 
                         icon="save" 
                         label="Kaydet" 
                         @click="onKaydet"
                         :disable="seciliGiderAdedi === 0 || genelToplam === 0"
                         unelevated
                         size="md"
                       />
                    </div>
                  </div>
                </div>
              </div>
         </div>
       </div>
     </div>
   </div>
 </div>
</div>
</q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// Gider kategorileri interface'i
interface GiderKategori {
  rowKey: string;
  giderAdi: string;
  selected: boolean;
  miktar: number;
  tutar: string | null;
}

// Gider kategorileri listesi (görseldeki seçenekler)
const giderKategorileri = [
  'Bakım Onarım',
  'Bilişim Giderleri',
  'Doğalgaz-Yakıt',
  'Elektrik Gideri',
  'İnternet Gideri',
  'Kırtasiye Gideri',
  'Kiralama Giderleri',
  'Komisyon Gideri',
  'LigTV Gideri',
  'Muhasebe Gideri',
  'Nalburiye Gideri',
  'Sair Giderler',
  'Su Gideri',
  'Telefon Giderleri',
  'Temizlik Giderleri',
  'Vergi-Harc Giderleri',
  'Yemekhane Gideri',
  'Tahsil Edilemeyen',
  'Kadir Takış',
  'Harun Takış'
]

// Tablo sütunları
const giderColumns = [
  { name: 'giderAdi', label: 'Giderler', field: 'giderAdi', align: 'left' as const },
  { name: 'miktar', label: 'Miktar', field: 'miktar', align: 'center' as const },
  { name: 'tutar', label: 'Tutar', field: 'tutar', align: 'center' as const },
  { name: 'toplamTutar', label: 'Toplam Tutar', field: 'toplamTutar', align: 'right' as const }
]

// Gider satırları - iki ayrı bölüm
const giderRowsSol = ref<GiderKategori[]>([])
const giderRowsSag = ref<GiderKategori[]>([])

// Gider notu
const giderNotu = ref<string>('')

// Tüm gider satırlarını birleştiren computed
const tumGiderRows = computed(() => [...giderRowsSol.value, ...giderRowsSag.value])

// Computed değerler
const genelToplam = computed<number>(() => {
  return tumGiderRows.value
    .filter(row => row.selected && row.tutar !== null)
    .reduce((sum, row) => {
      const numericValue = parseFloat(row.tutar?.replace(/[^\d.,]/g, '').replace(',', '.') || '0')
      return sum + (row.miktar * (isNaN(numericValue) ? 0 : numericValue))
    }, 0)
})

const genelToplamDisplay = computed(() =>
  genelToplam.value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
)

const seciliGiderAdedi = computed(() => tumGiderRows.value.filter(row => row.selected).length)

// Gider verilerini yükle
function loadGiderKategorileri() {
  // Sol bölüm (1-10)
  giderRowsSol.value = giderKategorileri.slice(0, 10).map((giderAdi, idx) => ({
    rowKey: `gider_sol_${idx}`,
    giderAdi,
    selected: false,
    miktar: 1,
    tutar: null
  }))

  // Sağ bölüm (11-20)
  giderRowsSag.value = giderKategorileri.slice(10, 20).map((giderAdi, idx) => ({
    rowKey: `gider_sag_${idx}`,
    giderAdi,
    selected: false,
    miktar: 1,
    tutar: null
  }))
}

// Event handlers
function onCheckboxChange(row: GiderKategori) {
  // Checkbox kaldırıldığında değerleri sıfırla
  if (!row.selected) {
    row.miktar = 1
    row.tutar = null
  }
  console.log('Checkbox değişti:', row.giderAdi, row.selected)
}

function onMiktarChange(row: GiderKategori) {
  // Miktar değiştiğinde yapılacak işlemler
  console.log('Miktar değişti:', row.giderAdi, row.miktar)
}

function onTutarChange(row: GiderKategori) {
  // Tutar değiştiğinde yapılacak işlemler
  console.log('Tutar değişti:', row.giderAdi, row.tutar)
}

function formatTutar(row: GiderKategori) {
  if (row.tutar && typeof row.tutar === 'string') {
    const numericValue = parseFloat(row.tutar.replace(/[^\d.,]/g, '').replace(',', '.'))
    if (!isNaN(numericValue)) {
      row.tutar = numericValue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
    }
  }
}

function unformatTutar(row: GiderKategori) {
  if (row.tutar && typeof row.tutar === 'string') {
    const numericValue = parseFloat(row.tutar.replace(/[^\d.,]/g, '').replace(',', '.'))
    if (!isNaN(numericValue)) {
      row.tutar = numericValue.toString()
    }
  }
}

function temizleForm() {
  // Sol bölümü temizle
  giderRowsSol.value.forEach(row => {
    row.selected = false
    row.miktar = 1
    row.tutar = null
  })
  
  // Sağ bölümü temizle
  giderRowsSag.value.forEach(row => {
    row.selected = false
    row.miktar = 1
    row.tutar = null
  })
  
  // Not alanını temizle
  giderNotu.value = ''
  
  $q.notify({
    type: 'info',
    message: 'Form temizlendi'
  })
}

function onKaydet() {
  const seciliGiderler = tumGiderRows.value.filter(r => r.selected)
  
  if (seciliGiderler.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'Lütfen en az bir gider kategorisi seçin'
    })
    return
  }

     // HENÜZ GELİR/GİDER KAYDI YAPILAMIYOR...1 uyarısı
   $q.notify({
     type: 'warning',
     message: 'HENÜZ GELİR/GİDER KAYDI YAPILAMIYOR...',
     icon: 'warning',
     position: 'top',
     timeout: 3000
   })

  // Backend kaydetme işlemi şimdilik devre dışı
  console.log('Kaydedilecek giderler:', seciliGiderler)
  console.log('Genel toplam:', genelToplam.value)
}



// Component mount olduğunda gider kategorilerini yükle
onMounted(() => {
  loadGiderKategorileri()
})
</script>

<style scoped>
/* 🔥 LIGHT MOD ZEMİN RENGİ - BELİRGİN BUZ BEYAZI */
.light-page-background {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%) !important;
  min-height: 100vh;
}

/* Dark mode'da normal zemin rengini koru */
.body--dark .light-page-background {
  background: var(--q-dark) !important;
}

/* Container Wrapper - Ana layout için */
.containers-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 20px;
  width: 100%;
  min-height: 100vh;
  padding: 20px;
}

.ana-form-wrapper {
  flex: 0 0 auto;
}

/* Ana Form Container */
.ana-form-container {
  width: 1200px;
  max-width: 1200px;
  min-width: 1000px;
  margin: 0;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(248, 249, 250, 0.98) 0%, rgba(241, 245, 249, 0.95) 100%);
  position: relative;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

/* Dark mode adaptasyonu */
.body--dark .ana-form-container {
  border-color: #424242;
  background: linear-gradient(135deg, rgba(45, 45, 45, 0.98) 0%, rgba(38, 38, 38, 0.95) 100%);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.gider-main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.gider-tables-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.gider-table-container {
  flex: 1;
  min-width: 0;
}

.gider-section-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 0.75rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

/* Dark mode support */
.body--dark .gider-section-card {
  background: rgba(40, 40, 40, 0.8);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.gider-table {
  min-width: 100%;
}

.genel-toplam-not-row {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.not-container {
  flex: 1;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 0.75rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

/* Dark mode support */
.body--dark .not-container {
  background: rgba(30, 30, 30, 0.9);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.not-textarea {
  width: 100%;
}

.genel-toplam-container {
  flex: 1;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 0.75rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

/* Dark mode support */
.body--dark .genel-toplam-container {
  background: rgba(30, 30, 30, 0.9);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.genel-toplam-table {
  min-width: 100%;
}

.genel-toplam-row {
  background-color: #f0f0f0;
  font-weight: bold;
}

/* Dark mode support for genel toplam row */
.body--dark .genel-toplam-row {
  background-color: #2d2d2d;
  color: #ffffff;
}

.genel-toplam-cell {
  background-color: #e8f5e8;
  color: #2e7d32;
}

/* Dark mode support for genel toplam cell */
.body--dark .genel-toplam-cell {
  background-color: #1e3a1e;
  color: #4caf50;
}

.gider-bilgi-wrap {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-top: 16px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}



/* Form Buttons Container */
.form-buttons-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px 0;
}

/* Responsive tasarım */
@media (max-width: 1400px) {
  .containers-wrapper {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  
  .ana-form-container {
    width: 1100px;
    min-width: 900px;
  }
}

@media (max-width: 900px) {
  .ana-form-container {
    width: 1000px;
    min-width: 800px;
  }
}

@media (max-width: 768px) {
  .containers-wrapper {
    padding: 16px;
  }
  
  .ana-form-container {
    width: 95vw;
    min-width: 600px;
    padding: 16px;
  }
  
  .gider-table {
    min-width: 100%;
    font-size: 0.8rem;
  }
  
  .gider-tables-row {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .gider-table-container {
    margin-bottom: 0.5rem;
  }
  
  .gider-section-card {
    margin-bottom: 0.5rem;
  }
  
  .genel-toplam-not-row {
    flex-direction: column;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .containers-wrapper {
    padding: 12px;
  }
  
  .ana-form-container {
    width: 98vw;
    min-width: 500px;
    padding: 12px;
  }
}
</style> 