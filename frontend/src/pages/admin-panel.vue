<template>
  <q-page class="q-pa-md">
         <!-- Butonlar -->
     <div class="row q-mb-md">
       <div class="col-6">
         <q-btn
           color="secondary"
           icon="visibility"
           :label="gizliKayitlarGosteriliyor ? 'KAYITLARI GİZLE' : 'GİZLENEN KAYITLARI GÖSTER'"
           size="md"
           @click="toggleGizliKayitlar"
         >
           <q-tooltip>Gizli kayıtları göster/gizle</q-tooltip>
         </q-btn>
       </div>
       <div class="col-6 text-right">
         <q-btn
           color="primary"
           icon="save"
           label="GÜNCELLE"
           size="md"
           @click="guncelleKayitlar"
           :loading="guncellemeLoading"
           :disable="guncellemeLoading"
         >
           <q-tooltip>Değiştirilen kayıtları veritabanında güncelle</q-tooltip>
         </q-btn>
       </div>
     </div>

    <!-- Grid Tablo -->
    <div class="row">
      <div class="col-12">
        <q-card>         
          <q-card-section class="q-pa-none">
                         <q-table
               :rows="odaTipLifyatRows"
               :columns="odaTipLifyatColumns"
               row-key="OdTipNo"
               :loading="loading"
               :pagination="{ rowsPerPage: 0 }"
               :rows-per-page-options="[0]"
               flat
               bordered
               dense
               compact
               class="admin-panel-table"
             >
              <!-- Özel sütun template'leri -->
              <template v-slot:body-cell-OdTipAdi="props">
                <q-td :props="props">
                                     <q-input
                     v-model="props.row.OdTipAdi"
                     dense
                     outlined
                     :readonly="true"
                     class="readonly-input compact-input"
                   />
                </q-td>
              </template>

                             <template v-slot:body-cell-OdLfytGun="props">
                 <q-td :props="props">
                                        <q-input
                       v-model.number="props.row.OdLfytGun"
                       dense
                       outlined
                       type="number"
                       step="0.01"
                       min="0"
                       class="writable-input compact-input"
                     />
                 </q-td>
               </template>

               <template v-slot:body-cell-OdLfytHft="props">
                 <q-td :props="props">
                                        <q-input
                       v-model.number="props.row.OdLfytHft"
                       dense
                       outlined
                       type="number"
                       step="0.01"
                       min="0"
                       class="writable-input compact-input"
                     />
                 </q-td>
               </template>

               <template v-slot:body-cell-OdLfytAyl="props">
                 <q-td :props="props">
                                        <q-input
                       v-model.number="props.row.OdLfytAyl"
                       dense
                       outlined
                       type="number"
                       step="0.01"
                       min="0"
                       class="writable-input compact-input"
                     />
                 </q-td>
               </template>

               <template v-slot:body-cell-OdDpzt="props">
                 <q-td :props="props">
                                        <q-input
                       v-model.number="props.row.OdDpzt"
                       dense
                       outlined
                       type="number"
                       step="0.01"
                       min="0"
                       class="writable-input compact-input"
                     />
                 </q-td>
               </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Bilgi Mesajı -->
    <div class="row q-mt-md">
      <div class="col-12">
        <q-banner
          class="bg-info text-white"
          icon="info"
        >
                 <strong>Bilgi:</strong> Sadece Günlük, Haftalık, Aylık Fiyat ve Depozito sütunları düzenlenebilir. 
            Günlük Fiyat değeri 1 olan kayıtlar varsayılan olarak gizlidir. 
            Değişiklikleri kaydetmek için "GÜNCELLE" butonuna tıklayın.
        </q-banner>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { api } from '../boot/axios';

// Interface tanımları
interface OdaTipLifyatRow {
  OdTipNo: number;
  OdTipAdi: string;
  OdLfytGun: number;
  OdLfytHft: number;
  OdLfytAyl: number;
  OdDpzt: number;
}

interface ApiResponse {
  success: boolean;
  data: OdaTipLifyatRow[];
  message: string;
}

const $q = useQuasar();

// Reactive variables
const loading = ref(false);
const guncellemeLoading = ref(false);
const odaTipLifyatRows = ref<OdaTipLifyatRow[]>([]);
const gizliKayitlarGosteriliyor = ref(false);
const tumKayitlar = ref<OdaTipLifyatRow[]>([]);

// Tablo sütunları
const odaTipLifyatColumns = [
     {
     name: 'OdTipNo',
     label: 'Oda Tip No',
     field: 'OdTipNo',
     align: 'left' as const,
     sortable: true,
     hide: true,
     classes: 'hidden',
     headerClasses: 'hidden'
   },
  {
    name: 'OdTipAdi',
    label: 'Oda Tip Adı',
    field: 'OdTipAdi',
    align: 'left' as const,
    sortable: true,
    style: 'max-width: 200px'
  },
  {
    name: 'OdLfytGun',
    label: 'Günlük Fiyat',
    field: 'OdLfytGun',
    align: 'right' as const,
    sortable: true,
    style: 'max-width: 120px'
  },
  {
    name: 'OdLfytHft',
    label: 'Haftalık Fiyat',
    field: 'OdLfytHft',
    align: 'right' as const,
    sortable: true,
    style: 'max-width: 120px'
  },
  {
    name: 'OdLfytAyl',
    label: 'Aylık Fiyat',
    field: 'OdLfytAyl',
    align: 'right' as const,
    sortable: true,
    style: 'max-width: 120px'
  },
  {
    name: 'OdDpzt',
    label: 'Depozito (Günlük)',
    field: 'OdDpzt',
    align: 'right' as const,
    sortable: true,
    style: 'max-width: 120px'
  }
];

// Sayfa yüklendiğinde verileri getir
onMounted(async () => {
  await getOdaTipLifyatData();
});

// Gizli kayıtları göster/gizle
function toggleGizliKayitlar() {
  gizliKayitlarGosteriliyor.value = !gizliKayitlarGosteriliyor.value;
  
  if (gizliKayitlarGosteriliyor.value) {
    // Tüm kayıtları göster
    odaTipLifyatRows.value = [...tumKayitlar.value];
  } else {
    // Günlük fiyat 1 olanları gizle
    odaTipLifyatRows.value = tumKayitlar.value.filter(row => row.OdLfytGun !== 1);
  }
}

// Oda Tip Lifyat verilerini getir
async function getOdaTipLifyatData() {
  try {
    loading.value = true;
    
         const response = await api.get<ApiResponse>('/admin/oda-tip-lifyat');
     
           if (response.data.success) {
        // Tüm kayıtları parse et ve sakla
        const parsedData = response.data.data.map((row: OdaTipLifyatRow) => ({
          ...row,
          // Sayısal değerleri number olarak parse et
          OdLfytGun: Number(row.OdLfytGun) || 0,
          OdLfytHft: Number(row.OdLfytHft) || 0,
          OdLfytAyl: Number(row.OdLfytAyl) || 0,
          OdDpzt: Number(row.OdDpzt) || 0
        }));
        
        // Tüm kayıtları sakla
        tumKayitlar.value = [...parsedData];
        
        // Varsayılan olarak Günlük fiyat 1 olanları gizle
        odaTipLifyatRows.value = parsedData.filter(row => row.OdLfytGun !== 1);
      
      $q.notify({
        type: 'positive',
        message: `${odaTipLifyatRows.value.length} kayıt başarıyla yüklendi`,
        icon: 'check_circle',
        position: 'top',
        timeout: 3000
      });
    } else {
      throw new Error(response.data.message || 'Veri yüklenirken hata oluştu');
    }
  } catch (error) {
    console.error('Oda Tip Lifyat verileri alınırken hata:', error);
    $q.notify({
      type: 'negative',
      message: 'Veri yüklenirken hata oluştu',
      caption: error instanceof Error ? error.message : 'Bilinmeyen hata',
      icon: 'error',
      position: 'top',
      timeout: 5000
    });
  } finally {
    loading.value = false;
  }
}

// Değiştirilen kayıtları güncelle
async function guncelleKayitlar() {
  try {
    guncellemeLoading.value = true;
    
         // Değiştirilen kayıtları filtrele (basit kontrol)
     const guncellenecekKayitlar = odaTipLifyatRows.value.filter(row => 
       row.OdLfytGun !== undefined || 
       row.OdLfytHft !== undefined || 
       row.OdLfytAyl !== undefined || 
       row.OdDpzt !== undefined
     );
    
    if (guncellenecekKayitlar.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'Güncellenecek kayıt bulunamadı',
        icon: 'warning',
        position: 'top',
        timeout: 3000
      });
      return;
    }
    
    const response = await api.put('/admin/oda-tip-lifyat-guncelle', {
      kayitlar: guncellenecekKayitlar
    });
    
         if (response.data.success) {
       $q.notify({
         type: 'positive',
         message: `${guncellenecekKayitlar.length} kayıt başarıyla güncellendi`,
         icon: 'check_circle',
         position: 'top',
         timeout: 5000
       });
       
       // Verileri yeniden yükle
       await getOdaTipLifyatData();
       
       // Güncelleme sonrası gizli kayıtları tekrar gizle (eğer gizli mod aktifse)
       if (!gizliKayitlarGosteriliyor.value) {
         odaTipLifyatRows.value = tumKayitlar.value.filter(row => row.OdLfytGun !== 1);
       }
     } else {
      throw new Error(response.data.message || 'Güncelleme sırasında hata oluştu');
    }
  } catch (error) {
    console.error('Kayıtlar güncellenirken hata:', error);
    $q.notify({
      type: 'negative',
      message: 'Güncelleme sırasında hata oluştu',
      caption: error instanceof Error ? error.message : 'Bilinmeyen hata',
      icon: 'error',
      position: 'top',
      timeout: 5000
    });
  } finally {
    guncellemeLoading.value = false;
  }
}
</script>

<style scoped>
.admin-panel-table {
  font-size: 0.8rem;
}

.readonly-input .q-field__control {
  background-color: #f5f5f5;
  color: #666;
}

.readonly-input .q-field__control input {
  color: #666;
  cursor: not-allowed;
}

.writable-input .q-field__control {
  background-color: #ffffff;
}

.writable-input .q-field__control input {
  color: #333;
}

/* Dark mode desteği */
.body--dark .readonly-input .q-field__control {
  background-color: #424242;
  color: #aaa;
}

.body--dark .readonly-input .q-field__control input {
  color: #aaa;
}

.body--dark .writable-input .q-field__control {
  background-color: #424242;
}

.body--dark .writable-input .q-field__control input {
  color: #fff;
}

/* Tablo stilleri */
.admin-panel-table .q-table th {
  background-color: #f0f0f0;
  font-weight: bold;
  color: #333;
}

.body--dark .admin-panel-table .q-table th {
  background-color: #424242;
  color: #fff;
}

.admin-panel-table .q-table td {
  padding: 4px;
}

/* Input alanları için özel stiller */
.admin-panel-table .q-input {
  margin: 2px;
}

.admin-panel-table .q-input .q-field__control {
  min-height: 28px;
}

.admin-panel-table .q-input .q-field__control input {
  padding: 4px 8px;
  font-size: 0.8rem;
}

/* Compact input stilleri */
.compact-input .q-field__control {
  min-height: 24px !important;
}

.compact-input .q-field__control input {
  padding: 2px 6px !important;
  font-size: 0.75rem !important;
}

.compact-input .q-field__prepend,
.compact-input .q-field__append {
  padding: 0 4px !important;
}

/* Tablo header'ı da compact yap */
.admin-panel-table .q-table th {
  padding: 6px 4px !important;
  font-size: 0.8rem !important;
}

/* Gizli sütunlar için */
.hidden {
  display: none !important;
}

/* Sütun genişlik sınırlamaları */
.admin-panel-table .q-table td,
.admin-panel-table .q-table th {
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Sütun genişlikleri için özel stiller */
.admin-panel-table .q-table td:nth-child(2) { /* OdTipAdi */
  max-width: 200px;
}

.admin-panel-table .q-table td:nth-child(3), /* OdLfytGun */
.admin-panel-table .q-table td:nth-child(4), /* OdLfytHft */
.admin-panel-table .q-table td:nth-child(5)  /* OdLfytAyl */
.admin-panel-table .q-table td:nth-child(6) { /* OdDpzt */
  max-width: 120px;
}
</style>
