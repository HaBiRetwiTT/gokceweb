<template>
  <q-page class="q-pa-md">
    <!-- Geç Saat Konaklama Ayarı -->
    <div class="row q-mb-md q-px-sm q-py-sm bg-blue-grey-9 rounded-borders">
      <div class="col-12 row items-center no-wrap" style="gap: 12px;">
        <!-- Sol Taraf: Başlık ve Bilgi Metni (Alt Alta) -->
        <div class="column">
          <div class="row items-center no-wrap">
            <q-icon name="schedule" size="sm" color="blue-3" class="q-mr-xs" />
            <span class="text-h6 text-blue-3">Geç Saat Konaklama Sonu:</span>
          </div>
          <div class="text-caption text-blue-grey-3" style="font-size: 0.7rem;">
            <q-icon name="info" size="16px" class="q-mr-xs" />
            00:00 - {{ gecSaatSonu }} arası 0 gün konaklama geçerlidir
          </div>
        </div>
        
        <!-- Orta: Saat Kontrolleri -->
        <div class="row no-wrap items-center" style="gap: 4px;">
          <q-btn
            round
            dense
            unelevated
            size="xs"
            icon="remove"
            color="blue-3"
            text-color="blue-grey-9"
            @click="azaltSaat"
          />
          <q-input
            v-model="gecSaatFormatted"
            type="text"
            outlined
            dense
            dark
            readonly
            style="width: 85px;"
            color="blue-3"
            input-style="color: white; font-size: 1.1rem; text-align: center; font-weight: bold;"
          >
            <template v-slot:prepend>
              <q-icon name="access_time" size="sm" color="blue-3" />
            </template>
          </q-input>
          <q-btn
            round
            dense
            unelevated
            size="xs"
            icon="add"
            color="blue-3"
            text-color="blue-grey-9"
            @click="artirSaat"
          />
        </div>
        
        <!-- Kaydet Butonu -->
        <q-btn
          color="blue-3"
          text-color="blue-grey-9"
          icon="save"
          label="KAYDET"
          size="xs"
          @click="kaydetGecSaatSonu"
          :loading="gecSaatSonuLoading"
          :disable="gecSaatSonuLoading"
        />
        
        <q-space />
        
        <!-- Sağ Taraf: IP Kısıtlama Butonu -->
        <q-btn
          color="red-7"
          text-color="white"
          icon="security"
          label="IP Kısıtlama Ayarları"
          size="md"
          @click="openIpKisitlamaModal"
          unelevated
        >
          <q-tooltip>IP kısıtlama ayarlarını yönet</q-tooltip>
        </q-btn>
      </div>
    </div>

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
                        v-model="props.row.OdLfytGun"
                        dense
                        outlined
                        type="text"
                        class="writable-input compact-input currency-input"
                        style="text-align: center;"
                        @input="formatCurrency($event, props.row, 'OdLfytGun')"
                        @blur="formatCurrencyOnBlur($event, props.row, 'OdLfytGun')"
                        @focus="formatCurrencyOnFocus($event, props.row, 'OdLfytGun')"
                      />
                  </q-td>
                </template>

                  <template v-slot:body-cell-OdLfytHft="props">
                  <q-td :props="props">
                                         <q-input
                        v-model="props.row.OdLfytHft"
                        dense
                        outlined
                        type="text"
                        class="writable-input compact-input currency-input"
                        style="text-align: center;"
                        @input="formatCurrency($event, props.row, 'OdLfytHft')"
                        @blur="formatCurrencyOnBlur($event, props.row, 'OdLfytHft')"
                        @focus="formatCurrencyOnFocus($event, props.row, 'OdLfytHft')"
                      />
                  </q-td>
                </template>

                               <template v-slot:body-cell-OdLfytAyl="props">
                  <q-td :props="props">
                                         <q-input
                        v-model="props.row.OdLfytAyl"
                        dense
                        outlined
                        type="text"
                        class="writable-input compact-input currency-input"
                        style="text-align: center;"
                        @input="formatCurrency($event, props.row, 'OdLfytAyl')"
                        @blur="formatCurrencyOnBlur($event, props.row, 'OdLfytAyl')"
                        @focus="formatCurrencyOnFocus($event, props.row, 'OdLfytAyl')"
                      />
                  </q-td>
                </template>

                               <template v-slot:body-cell-OdDpzt="props">
                  <q-td :props="props">
                                         <q-input
                        v-model="props.row.OdDpzt"
                        dense
                        outlined
                        type="text"
                        class="writable-input compact-input currency-input"
                        style="text-align: center;"
                        @input="formatCurrency($event, props.row, 'OdDpzt')"
                        @blur="formatCurrencyOnBlur($event, props.row, 'OdDpzt')"
                        @focus="formatCurrencyOnFocus($event, props.row, 'OdDpzt')"
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

    <!-- IP Kısıtlama Modal -->
    <q-dialog v-model="showIpKisitlamaModal" persistent>
      <q-card 
        ref="ipModalCard"
        style="min-width: 550px; max-width: 650px;" 
        class="ip-modal-card draggable-modal"
      >
        <q-card-section class="row items-center bg-red-8 text-white q-pa-sm modal-header" style="cursor: move;">
          <q-icon name="security" size="sm" class="q-mr-xs" />
          <div class="text-subtitle1 text-weight-bold">IP Kısıtlama Ayarları</div>
          <q-space />
          <q-btn icon="close" flat round dense size="sm" v-close-popup color="white" />
        </q-card-section>

        <q-card-section class="q-pa-sm">
          <!-- IP Kısıtlama Aktif/Pasif Switch -->
          <div class="row items-center q-mb-sm q-pa-sm ip-toggle-section rounded-borders">
            <q-icon name="power_settings_new" size="sm" class="q-mr-sm ip-toggle-icon" />
            <div class="col">
              <div class="text-body2 text-weight-bold">IP Kısıtlama Sistemi</div>
              <div class="text-caption ip-toggle-text">
                {{ ipKisitlamaAktif ? 'Aktif - Sadece listedeki IP\'ler erişebilir' : 'Pasif - Tüm IP\'ler erişebilir' }}
              </div>
            </div>
            <q-toggle
              v-model="ipKisitlamaAktif"
              color="red"
              size="md"
              @update:model-value="toggleIpKisitlama"
              :loading="toggleLoading"
            />
          </div>

          <!-- Mevcut IP Adresi Gösterimi -->
          <div class="row items-center q-mb-sm q-pa-xs ip-current-section rounded-borders">
            <q-icon name="public" size="xs" class="q-mr-xs ip-current-icon" />
            <div class="text-caption">
              <strong>Dış IP (Public):</strong> {{ mevcutIpAdres || 'Yükleniyor...' }}
              <span v-if="localIpAdres && localIpAdres !== mevcutIpAdres" class="q-ml-xs text-grey-6">
                (Local: {{ localIpAdres }})
              </span>
            </div>
          </div>

          <!-- IP Listesi -->
          <div class="q-mb-sm">
            <div class="text-body2 text-weight-medium q-mb-xs">
              <q-icon name="list" size="xs" class="q-mr-xs" />
              Kayıtlı IP Adresleri ({{ ipListesi.length }}/5)
            </div>
            
            <q-list bordered separator dense v-if="ipListesi.length > 0">
              <q-item v-for="ip in ipListesi" :key="ip.IpKstNo" dense>
                <q-item-section avatar style="min-width: 30px;">
                  <q-icon name="computer" color="green-7" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2 text-weight-medium">{{ ip.IpKstAdres }}</q-item-label>
                  <q-item-label caption v-if="ip.IpKstAciklama" lines="1">
                    {{ ip.IpKstAciklama }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    icon="delete"
                    color="red-7"
                    flat
                    round
                    dense
                    size="sm"
                    @click="confirmDeleteIp(ip)"
                    :disable="deleteLoading"
                  >
                    <q-tooltip>Sil</q-tooltip>
                  </q-btn>
                </q-item-section>
              </q-item>
            </q-list>

            <div v-else class="text-center q-pa-sm text-grey-6">
              <q-icon name="info" size="sm" />
              <div class="text-caption">Kayıtlı IP adresi yok</div>
            </div>
          </div>

          <!-- Yeni IP Ekleme -->
          <q-separator class="q-my-sm" />
          <div class="q-mb-sm" v-if="ipListesi.length < 5">
            <div class="text-body2 text-weight-medium q-mb-xs">
              <q-icon name="add_circle" size="xs" class="q-mr-xs" />
              Yeni IP Ekle
            </div>
            
            <div class="row q-col-gutter-xs">
              <div class="col-12">
                <q-input
                  v-model="yeniIpAdres"
                  outlined
                  dense
                  label="Dış IP Adresi (Public)"
                  :placeholder="mevcutIpAdres || 'Örn: 123.45.67.89'"
                  :rules="[ipFormatKontrol]"
                  @keyup.enter="handleIpEnter"
                  hint="Gerçek dış IP adresinizi girin (yukarıda gösterildi)"
                >
                  <template v-slot:prepend>
                    <q-icon name="public" size="xs" />
                  </template>
                  <template v-slot:append>
                    <q-btn
                      flat
                      dense
                      size="xs"
                      icon="content_copy"
                      @click="copyCurrentIp"
                      v-if="mevcutIpAdres && mevcutIpAdres !== 'Alınamadı'"
                    >
                      <q-tooltip>Mevcut IP'yi kopyala</q-tooltip>
                    </q-btn>
                  </template>
                </q-input>
              </div>
              <div class="col-12">
                <q-input
                  v-model="yeniIpAciklama"
                  outlined
                  dense
                  label="Açıklama (Opsiyonel)"
                  placeholder="Örn: Ev internet bağlantısı"
                  @keyup.enter="handleIpEnter"
                >
                  <template v-slot:prepend>
                    <q-icon name="description" size="xs" />
                  </template>
                </q-input>
              </div>
              <div class="col-12">
                <q-btn
                  color="primary"
                  icon="add"
                  label="Ekle"
                  size="sm"
                  @click="addIpAdres"
                  :loading="addLoading"
                  :disable="!yeniIpAdres || addLoading"
                  class="full-width"
                  unelevated
                />
              </div>
            </div>
          </div>

          <!-- Maksimum IP Uyarısı -->
          <q-banner v-if="ipListesi.length >= 5" class="ip-warning-banner q-pa-xs" dense rounded>
            <template v-slot:avatar>
              <q-icon name="warning" color="orange" size="xs" />
            </template>
            <span class="text-caption">Maksimum 5 IP. Yeni eklemek için mevcut IP'yi silin.</span>
          </q-banner>

          <!-- Bilgilendirme -->
          <q-banner class="ip-info-banner q-mt-xs q-pa-xs" dense rounded>
            <template v-slot:avatar>
              <q-icon name="info" color="blue" size="xs" />
            </template>
            <div class="text-caption">
              <strong>Önemli:</strong> IP kısıtlaması aktifken sadece listedeki IP'lerden erişim sağlanır.
              <br />
              <strong>Not:</strong> SAadmin ve HARUN kullanıcıları IP kısıtlamasından muaftır ve her zaman erişebilir.
            </div>
          </q-banner>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-xs ip-modal-actions">
          <q-btn label="Kapat" color="grey" flat size="sm" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { api } from '../boot/axios';

// Interface tanımları
interface OdaTipLifyatRow {
  OdTipNo: number;
  OdTipAdi: string;
  OdLfytGun: string | number;
  OdLfytHft: string | number;
  OdLfytAyl: string | number;
  OdDpzt: string | number;
  [key: string]: string | number;
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

// Geç Saat Konaklama değişkenleri
const gecSaatNumara = ref(6);
const gecSaatSonuLoading = ref(false);

// Formatted gösterim (05)
const gecSaatFormatted = ref('06');

// Saat azaltma
function azaltSaat() {
  if (gecSaatNumara.value > 0) {
    gecSaatNumara.value--;
    gecSaatFormatted.value = String(gecSaatNumara.value).padStart(2, '0');
  }
}

// Saat artırma
function artirSaat() {
  if (gecSaatNumara.value < 23) {
    gecSaatNumara.value++;
    gecSaatFormatted.value = String(gecSaatNumara.value).padStart(2, '0');
  }
}

// Computed: gecSaatSonu formatı (bilgi metni için)
const gecSaatSonu = computed(() => {
  return `${String(gecSaatNumara.value).padStart(2, '0')}:00`;
});

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
    align: 'center' as const,
    sortable: true,
    style: 'max-width: 120px'
  },
  {
    name: 'OdLfytHft',
    label: 'Haftalık Fiyat',
    field: 'OdLfytHft',
    align: 'center' as const,
    sortable: true,
    style: 'max-width: 120px'
  },
  {
    name: 'OdLfytAyl',
    label: 'Aylık Fiyat',
    field: 'OdLfytAyl',
    align: 'center' as const,
    sortable: true,
    style: 'max-width: 120px'
  },
  {
    name: 'OdDpzt',
    label: 'Depozito (Günlük)',
    field: 'OdDpzt',
    align: 'center' as const,
    sortable: true,
    style: 'max-width: 140px'
  }
];

// Sayfa yüklendiğinde verileri getir
onMounted(async () => {
  await getOdaTipLifyatData();
  await yukleGecSaatSonu();
});

// Gizli kayıtları göster/gizle
function toggleGizliKayitlar() {
  gizliKayitlarGosteriliyor.value = !gizliKayitlarGosteriliyor.value;
  
  if (gizliKayitlarGosteriliyor.value) {
    // Tüm kayıtları göster
    odaTipLifyatRows.value = [...tumKayitlar.value];
     } else {
           // Günlük fiyat 1 olanları gizle
      odaTipLifyatRows.value = tumKayitlar.value.filter(row => {
        const gunlukFiyat = parseInt(row.OdLfytGun.toString().replace(/\./g, '')) || 0;
        return gunlukFiyat !== 1;
      });
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
          // Sayısal değerleri string olarak parse et ve TL formatında göster
          OdLfytGun: formatCurrencyForDisplay(Number(row.OdLfytGun) || 0),
          OdLfytHft: formatCurrencyForDisplay(Number(row.OdLfytHft) || 0),
          OdLfytAyl: formatCurrencyForDisplay(Number(row.OdLfytAyl) || 0),
          OdDpzt: formatCurrencyForDisplay(Number(row.OdDpzt) || 0)
        }));
        
        // Tüm kayıtları sakla
        tumKayitlar.value = [...parsedData];
        
                          // Varsayılan olarak Günlük fiyat 1 olanları gizle
          odaTipLifyatRows.value = parsedData.filter(row => {
            const gunlukFiyat = parseInt(row.OdLfytGun.toString().replace(/\./g, '')) || 0;
            return gunlukFiyat !== 1;
          });
      
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

// Currency formatlama fonksiyonları
function formatCurrencyForDisplay(value: number): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function formatCurrency(event: Event, row: OdaTipLifyatRow, field: keyof OdaTipLifyatRow) {
  const target = event.target as HTMLInputElement;
  let value = target.value;
  
  // Sadece sayıları kabul et (nokta karakterini kaldır)
  value = value.replace(/[^\d]/g, '');
  
  row[field] = value;
}

function formatCurrencyOnBlur(event: Event, row: OdaTipLifyatRow, field: keyof OdaTipLifyatRow) {
  const target = event.target as HTMLInputElement;
  const value = target.value;
  
  if (value && value !== '') {
    // Sayıyı parse et
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      // TL formatında göster (örn: 1.500)
      const formattedValue = numValue.toLocaleString('tr-TR');
      row[field] = formattedValue;
    }
  }
}

function formatCurrencyOnFocus(event: Event, row: OdaTipLifyatRow, field: keyof OdaTipLifyatRow) {
  const value = row[field];
  
  if (typeof value === 'string' && value.includes(',')) {
    // TL formatından sayıya çevir (örn: 1.500 -> 1500)
    const cleanValue = value.replace(/\./g, '');
    const numValue = parseInt(cleanValue);
    if (!isNaN(numValue)) {
      row[field] = numValue.toString();
    }
  }
}

// Değiştirilen kayıtları güncelle
async function guncelleKayitlar() {
  try {
    guncellemeLoading.value = true;
    
                                       // Değiştirilen kayıtları filtrele ve sayısal değerlere çevir
       const guncellenecekKayitlar = odaTipLifyatRows.value.map(row => ({
         ...row,
         OdLfytGun: parseInt(row.OdLfytGun.toString().replace(/\./g, '')) || 0,
         OdLfytHft: parseInt(row.OdLfytHft.toString().replace(/\./g, '')) || 0,
         OdLfytAyl: parseInt(row.OdLfytAyl.toString().replace(/\./g, '')) || 0,
         OdDpzt: parseInt(row.OdDpzt.toString().replace(/\./g, '')) || 0
       }));
    
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
           odaTipLifyatRows.value = tumKayitlar.value.filter(row => {
             const gunlukFiyat = parseInt(row.OdLfytGun.toString().replace(/\./g, '')) || 0;
             return gunlukFiyat !== 1;
           });
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

// Geç Saat Konaklama fonksiyonları
async function yukleGecSaatSonu() {
  try {
    const response = await api.get('/parametre/gec-saat-sonu')
    if (response.data.success) {
      // Backend'den gelen sayıyı direkt kullan
      gecSaatNumara.value = response.data.saat
      gecSaatFormatted.value = String(response.data.saat).padStart(2, '0')
    }
  } catch (error) {
    console.error('Geç saat sonu yüklenemedi:', error)
    $q.notify({
      type: 'negative',
      message: 'Geç Saat Konaklama ayarı yüklenemedi',
      position: 'top'
    })
  }
}

async function kaydetGecSaatSonu() {
  gecSaatSonuLoading.value = true
  try {
    const response = await api.put('/parametre/gec-saat-sonu', {
      saat: gecSaatNumara.value
    })
    
    if (response.data.success) {
      $q.notify({
        type: 'positive',
        message: '✅ Geç Saat Konaklama sonu güncellendi!',
        caption: `Yeni değer: ${gecSaatSonu.value}`,
        position: 'top',
        timeout: 3000
      })
    } else {
      throw new Error(response.data.message)
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '❌ Güncelleme başarısız!',
      caption: String(error),
      position: 'top',
      timeout: 3000
    })
  } finally {
    gecSaatSonuLoading.value = false
  }
}

// IP Kısıtlama değişkenleri ve fonksiyonları
interface IPKisitlamaItem {
  IpKstNo: number;
  IpKstAdres: string;
  IpKstAktif: boolean;
  IpKstKytTarihi: string;
  IpKstKllnc: string;
  IpKstAciklama?: string;
}

const showIpKisitlamaModal = ref(false);
const ipKisitlamaAktif = ref(false);
const ipListesi = ref<IPKisitlamaItem[]>([]);
const mevcutIpAdres = ref(''); // External/Public IP
const localIpAdres = ref(''); // Local IP
const yeniIpAdres = ref('');
const yeniIpAciklama = ref('');
const toggleLoading = ref(false);
const addLoading = ref(false);
const deleteLoading = ref(false);
const ipModalCard = ref<{ $el: HTMLElement } | null>(null);

/**
 * IP format kontrolü
 * Püf Nokta: IPv4 format validasyonu (xxx.xxx.xxx.xxx)
 */
function ipFormatKontrol(val: string) {
  const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = val.match(ipRegex);
  
  if (!match) {
    return 'Geçersiz IP formatı (örn: 192.168.1.100)';
  }
  
  // Her oktetin 0-255 aralığında olduğunu kontrol et
  for (let i = 1; i <= 4; i++) {
    const octet = parseInt(match[i], 10);
    if (octet < 0 || octet > 255) {
      return 'IP adresi her bölümü 0-255 arasında olmalıdır';
    }
  }
  
  return true;
}

/**
 * IP kısıtlama bilgilerini yükler
 */
async function yukleIpKisitlamaBilgileri() {
  try {
    const response = await api.get('/admin/ip-restrictions');
    console.log('IP Restrictions Response:', response.data);
    if (response.data.success) {
      ipKisitlamaAktif.value = response.data.data.aktif;
      ipListesi.value = response.data.data.ipListesi;
      console.log('IP kısıtlama bilgileri yüklendi:', { aktif: ipKisitlamaAktif.value, count: ipListesi.value.length });
    } else {
      throw new Error(response.data.message || 'Başarısız response');
    }
  } catch (error: unknown) {
    console.error('IP kısıtlama bilgileri yüklenemedi:', error);
    const axiosError = error as { response?: { status?: number; data?: unknown } };
    const errorMessage = axiosError?.response?.status === 500
      ? 'Veritabanı hatası. Backend loglarını kontrol edin.'
      : axiosError?.response?.status === 404
      ? 'Endpoint bulunamadı. Backend yeniden başlatılmalı.'
      : 'IP kısıtlama bilgileri yüklenemedi. Backend çalışıyor mu?';
    
    $q.notify({
      type: 'negative',
      message: errorMessage,
      caption: `Status: ${axiosError?.response?.status || 'Network Error'}`,
      position: 'top',
      timeout: 6000
    });
    
    // Hata durumunda varsayılan değerler
    ipKisitlamaAktif.value = false;
    ipListesi.value = [];
  }
}

/**
 * Mevcut IP adresini alır
 * Püf Nokta: Hem external (public) hem de local IP adresleri gösterilir
 */
async function yukleMevcutIp() {
  try {
    const response = await api.get('/admin/current-ip');
    console.log('Current IP Response:', response.data);
    if (response.data.success && response.data.data) {
      // External IP'yi öncelikli göster
      mevcutIpAdres.value = response.data.data.externalIp || response.data.data.ip || 'Alınamadı';
      localIpAdres.value = response.data.data.localIp || '';
      
      console.log('IP adresleri yüklendi:', { 
        external: mevcutIpAdres.value, 
        local: localIpAdres.value 
      });
    } else {
      console.warn('IP adresi response içinde bulunamadı:', response.data);
      mevcutIpAdres.value = 'Alınamadı';
    }
  } catch (error) {
    console.error('Mevcut IP adresi alınamadı:', error);
    mevcutIpAdres.value = 'Alınamadı';
  }
}

/**
 * IP kısıtlama sistemini aktif/pasif yapar
 * Püf Nokta: Kullanıcı kendi IP'sini listede olmadan aktifleştirirse uyarı gösterilir
 */
async function toggleIpKisitlama(aktif: boolean) {
  // Eğer aktif hale getiriliyorsa ve listedeki IP sayısı 0 ise uyar
  if (aktif && ipListesi.value.length === 0) {
    $q.dialog({
      title: 'Uyarı',
      message: 'IP listesinde hiç kayıt yok! Sistemi aktif hale getirirseniz kimse erişemeyecek. Devam etmek istiyor musunuz?',
      cancel: true,
      persistent: true
    }).onCancel(() => {
      // Toggle'ı geri al
      ipKisitlamaAktif.value = !aktif;
    }).onOk(() => {
      void toggleIpKisitlamaOnay(aktif);
    });
    return;
  }
  
  // Eğer aktif hale getiriliyorsa ve mevcut IP listede yoksa uyar
  if (aktif && mevcutIpAdres.value) {
    const mevcutIpListede = ipListesi.value.some(ip => ip.IpKstAdres === mevcutIpAdres.value);
    if (!mevcutIpListede) {
      $q.dialog({
        title: 'Dikkat!',
        message: `Mevcut IP adresiniz (${mevcutIpAdres.value}) listede bulunmuyor! Sistemi aktif hale getirirseniz erişiminiz kesilecek. Devam etmek istiyor musunuz?`,
        cancel: true,
        persistent: true,
        color: 'negative'
      }).onCancel(() => {
        // Toggle'ı geri al
        ipKisitlamaAktif.value = !aktif;
      }).onOk(() => {
        void toggleIpKisitlamaOnay(aktif);
      });
      return;
    }
  }
  
  await toggleIpKisitlamaOnay(aktif);
}

async function toggleIpKisitlamaOnay(aktif: boolean) {
  toggleLoading.value = true;
  try {
    const kullaniciAdi = localStorage.getItem('username') || 'SYSTEM';
    const response = await api.patch('/admin/ip-restrictions/toggle', {
      aktif,
      kullaniciAdi
    });
    
    if (response.data.success) {
      $q.notify({
        type: 'positive',
        message: `IP kısıtlama ${aktif ? 'aktif' : 'pasif'} edildi`,
        icon: aktif ? 'lock' : 'lock_open',
        position: 'top',
        timeout: 3000
      });
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('IP kısıtlama toggle hatası:', error);
    // Toggle'ı geri al
    ipKisitlamaAktif.value = !aktif;
    $q.notify({
      type: 'negative',
      message: 'IP kısıtlama durumu değiştirilemedi',
      position: 'top'
    });
  } finally {
    toggleLoading.value = false;
  }
}

/**
 * Enter tuşu ile IP ekleme
 * Püf Nokta: Sadece IP adresi doluysa ekle, boşsa placeholder eklenmez
 */
function handleIpEnter() {
  if (yeniIpAdres.value && yeniIpAdres.value.trim()) {
    void addIpAdres();
  }
}

/**
 * Mevcut IP'yi input alanına kopyalar
 */
function copyCurrentIp() {
  if (mevcutIpAdres.value && mevcutIpAdres.value !== 'Alınamadı') {
    yeniIpAdres.value = mevcutIpAdres.value;
    $q.notify({
      type: 'positive',
      message: 'IP adresi kopyalandı',
      position: 'top',
      timeout: 2000
    });
  }
}

/**
 * Yeni IP adresi ekler
 */
async function addIpAdres() {
  // Boş kontrol
  if (!yeniIpAdres.value || !yeniIpAdres.value.trim()) {
    $q.notify({
      type: 'warning',
      message: 'Lütfen bir IP adresi girin',
      position: 'top'
    });
    return;
  }
  
  // Validasyon
  const validationResult = ipFormatKontrol(yeniIpAdres.value);
  if (validationResult !== true) {
    $q.notify({
      type: 'warning',
      message: validationResult,
      position: 'top'
    });
    return;
  }
  
  // Local IP uyarısı (opsiyonel - sadece uyarı ver, engelleme)
  const ipParts = yeniIpAdres.value.split('.');
  if (ipParts.length === 4) {
    const firstOctet = parseInt(ipParts[0], 10);
    const secondOctet = parseInt(ipParts[1], 10);
    
    // Private IP range kontrolü (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const isPrivateIp = 
      firstOctet === 192 && secondOctet === 168 ||
      firstOctet === 10 ||
      firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31 ||
      firstOctet === 127; // localhost
    
    if (isPrivateIp) {
      // Uyarı ver ama yine de eklemeye izin ver
      const confirm = await new Promise<boolean>((resolve) => {
        $q.dialog({
          title: 'Dikkat',
          message: `${yeniIpAdres.value} bir local/private IP adresi gibi görünüyor. IP kısıtlaması için genellikle dış IP (public IP) kullanılır. Yine de eklemek istiyor musunuz?`,
          cancel: { label: 'İptal', flat: true, color: 'grey' },
          persistent: true,
          ok: { label: 'Evet, Ekle', color: 'primary', unelevated: true }
        }).onOk(() => resolve(true))
          .onCancel(() => resolve(false));
      });
      
      if (!confirm) return;
    }
  }
  
  addLoading.value = true;
  try {
    const kullaniciAdi = localStorage.getItem('username') || 'SYSTEM';
    const response = await api.post('/admin/ip-restrictions', {
      ipAdres: yeniIpAdres.value,
      aciklama: yeniIpAciklama.value,
      kullaniciAdi
    });
    
    if (response.data.success) {
      $q.notify({
        type: 'positive',
        message: 'IP adresi başarıyla eklendi',
        icon: 'check_circle',
        position: 'top',
        timeout: 3000
      });
      
      // Formu temizle
      yeniIpAdres.value = '';
      yeniIpAciklama.value = '';
      
      // Listeyi yenile
      await yukleIpKisitlamaBilgileri();
    } else {
      throw new Error(response.data.message);
    }
  } catch (error: unknown) {
    console.error('IP ekleme hatası:', error);
    const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'IP adresi eklenemedi';
    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top'
    });
  } finally {
    addLoading.value = false;
  }
}

/**
 * IP silme onayı ister
 * Püf Nokta: Kullanıcı kendi IP'sini silmeye çalışırsa ekstra uyarı gösterilir
 */
function confirmDeleteIp(ip: IPKisitlamaItem) {
  const kendi = ip.IpKstAdres === mevcutIpAdres.value;
  
  $q.dialog({
    title: kendi ? '⚠️ Dikkat!' : 'IP Silme Onayı',
    message: kendi 
      ? `Bu IP adresi (${ip.IpKstAdres}) mevcut IP adresiniz! Silmek istediğinize emin misiniz? IP kısıtlaması aktifse erişiminiz kesilecek.`
      : `${ip.IpKstAdres} IP adresini silmek istediğinize emin misiniz?`,
    cancel: true,
    persistent: true,
    color: kendi ? 'negative' : 'primary'
  }).onOk(() => {
    void deleteIpAdres(ip.IpKstNo);
  });
}

/**
 * IP adresini siler
 */
async function deleteIpAdres(id: number) {
  deleteLoading.value = true;
  try {
    const response = await api.delete(`/admin/ip-restrictions/${id}`);
    
    if (response.data.success) {
      $q.notify({
        type: 'positive',
        message: 'IP adresi başarıyla silindi',
        icon: 'check_circle',
        position: 'top',
        timeout: 3000
      });
      
      // Listeyi yenile
      await yukleIpKisitlamaBilgileri();
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('IP silme hatası:', error);
    $q.notify({
      type: 'negative',
      message: 'IP adresi silinemedi',
      position: 'top'
    });
  } finally {
    deleteLoading.value = false;
  }
}

/**
 * Modal'ı açar ve verileri yükler
 * Püf Nokta: Verileri modal açılırken yükleyerek gereksiz API çağrılarını önleriz
 */
function openIpKisitlamaModal() {
  showIpKisitlamaModal.value = true;
  // Modal açılınca verileri yükle
  void yukleIpKisitlamaBilgileri();
  void yukleMevcutIp();
  
  // Modal açıldıktan sonra draggable özelliğini ekle
  setTimeout(() => {
    setupIpModalDraggable();
  }, 100);
}

/**
 * Modal'ı sürüklenebilir yapar
 * Püf Nokta: Modal header'ından tutup ekranda gezdirebilirsiniz
 */
function setupIpModalDraggable() {
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

      if (ipModalCard.value && ipModalCard.value.$el) {
        const modalElement = ipModalCard.value.$el;
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
.admin-panel-table .q-table td:nth-child(5), /* OdLfytAyl */
.admin-panel-table .q-table td:nth-child(6) { /* OdDpzt */
  max-width: 120px;
  text-align: center;
}

/* Fiyat sütunlarındaki input alanlarını centered yap */
.admin-panel-table .q-table td:nth-child(3) .q-input, /* OdLfytGun */
.admin-panel-table .q-table td:nth-child(4) .q-input, /* OdLfytHft */
.admin-panel-table .q-table td:nth-child(5) .q-input, /* OdLfytAyl */
.admin-panel-table .q-table td:nth-child(6) .q-input { /* OdDpzt */
  text-align: center;
}

.admin-panel-table .q-table td:nth-child(3) .q-input input, /* OdLfytGun */
.admin-panel-table .q-table td:nth-child(4) .q-input input, /* OdLfytHft */
.admin-panel-table .q-table td:nth-child(5) .q-input input, /* OdLfytAyl */
.admin-panel-table .q-table td:nth-child(6) .q-input input { /* OdDpzt */
  text-align: center !important;
}

/* Daha spesifik seçiciler ile input alanlarını centered yap */
.admin-panel-table .q-table td:nth-child(3) .q-field__control input, /* OdLfytGun */
.admin-panel-table .q-table td:nth-child(4) .q-field__control input, /* OdLfytHft */
.admin-panel-table .q-table td:nth-child(5) .q-field__control input, /* OdLfytAyl */
.admin-panel-table .q-table td:nth-child(6) .q-field__control input { /* OdDpzt */
  text-align: center !important;
}

/* Compact input için de centered yap */
.admin-panel-table .q-table td:nth-child(3) .compact-input .q-field__control input, /* OdLfytGun */
.admin-panel-table .q-table td:nth-child(4) .compact-input .q-field__control input, /* OdLfytHft */
.admin-panel-table .q-table td:nth-child(5) .compact-input .q-field__control input, /* OdLfytAyl */
.admin-panel-table .q-table td:nth-child(6) .compact-input .q-field__control input { /* OdDpzt */
  text-align: center !important;
}

/* Writable input için de centered yap */
.admin-panel-table .q-table td:nth-child(3) .writable-input .q-field__control input, /* OdLfytGun */
.admin-panel-table .q-table td:nth-child(4) .writable-input .q-field__control input, /* OdLfytHft */
.admin-panel-table .q-table td:nth-child(5) .writable-input .q-field__control input, /* OdLfytAyl */
.admin-panel-table .q-table td:nth-child(6) .writable-input .q-field__control input { /* OdDpzt */
  text-align: center !important;
}

/* En güçlü seçici ile tüm input alanlarını centered yap */
.admin-panel-table .q-table td:nth-child(3) input[type="number"], /* OdLfytGun */
.admin-panel-table .q-table td:nth-child(4) input[type="number"], /* OdLfytHft */
.admin-panel-table .q-table td:nth-child(5) input[type="number"], /* OdLfytAyl */
.admin-panel-table .q-table td:nth-child(6) input[type="number"] { /* OdDpzt */
  text-align: center !important;
}

/* Global input centered override */
.admin-panel-table input[type="number"] {
  text-align: center !important;
}

/* En güçlü CSS override - tüm input'ları centered yap */
.admin-panel-table input {
  text-align: center !important;
}

/* Quasar'ın varsayılan stillerini override et */
.admin-panel-table .q-field__control input {
  text-align: center !important;
}

/* Inline style ile override */
.admin-panel-table input[style*="text-align"] {
  text-align: center !important;
}

/* En güçlü override - tüm input'ları zorla centered yap */
.admin-panel-table input,
.admin-panel-table .q-field__control input,
.admin-panel-table .q-input input,
.admin-panel-table .q-field input {
  text-align: center !important;
}

/* Quasar'ın tüm stillerini override et */
.admin-panel-table .q-field__control input[type="number"],
.admin-panel-table .q-field__control input[type="text"] {
  text-align: center !important;
}

/* Global override - tüm sayfa için */
.admin-panel-table * {
  text-align: center !important;
}

/* Sadece Oda Tip Adı sütunu left align olsun */
.admin-panel-table .q-table td:nth-child(2),
.admin-panel-table .q-table th:nth-child(2) {
  text-align: left !important;
}

/* Currency input stilleri */
.currency-input input {
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.currency-input .q-field__control {
  background-color: #fff3cd !important;
  border-color: #ffeaa7 !important;
}

.currency-input:focus-within .q-field__control {
  background-color: #fff8e1 !important;
  border-color: #ffd54f !important;
}

/* IP Kısıtlama Modal Stilleri - Compact Tasarım */
/* Light Mode */
.ip-modal-card {
  background-color: #ffffff;
}

.ip-modal-card .q-card__section {
  padding: 8px !important;
}

.ip-toggle-section {
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
}

.ip-toggle-icon {
  color: #c62828;
}

.ip-toggle-text {
  color: #616161;
  line-height: 1.2;
}

.ip-current-section {
  background-color: #e3f2fd;
  border: 1px solid #90caf9;
}

.ip-current-icon {
  color: #1976d2;
}

.ip-warning-banner {
  background-color: #fff3e0;
  color: #e65100;
  padding: 4px 8px !important;
}

.ip-info-banner {
  background-color: #e3f2fd;
  color: #1565c0;
  padding: 4px 8px !important;
}

.ip-modal-actions {
  border-top: 1px solid #e0e0e0;
  padding: 4px 8px !important;
}

/* Dark Mode */
.body--dark .ip-modal-card {
  background-color: #1e1e1e;
}

.body--dark .ip-toggle-section {
  background-color: #2d2d2d;
  border: 1px solid #424242;
}

.body--dark .ip-toggle-icon {
  color: #ef5350;
}

.body--dark .ip-toggle-text {
  color: #b0b0b0;
}

.body--dark .ip-current-section {
  background-color: #0d47a1;
  border: 1px solid #1976d2;
}

.body--dark .ip-current-icon {
  color: #64b5f6;
}

.body--dark .ip-warning-banner {
  background-color: #4a2c0c;
  color: #ffb74d;
}

.body--dark .ip-info-banner {
  background-color: #0d47a1;
  color: #90caf9;
}

.body--dark .ip-modal-actions {
  border-top: 1px solid #424242;
}

.body--dark .q-card {
  background-color: #1e1e1e;
  color: #ffffff;
}

.body--dark .q-list {
  background-color: #2d2d2d;
  border-color: #424242;
}

.body--dark .q-item {
  color: #ffffff;
}

.body--dark .q-separator {
  background-color: #424242;
}

/* Compact list item spacing */
.ip-modal-card .q-item {
  min-height: 36px;
  padding: 4px 8px;
}

.ip-modal-card .q-item__section--avatar {
  min-width: 30px;
  padding-right: 8px;
}

/* Draggable modal stilleri */
.draggable-modal {
  position: relative;
  user-select: none;
}

.draggable-modal .modal-header {
  cursor: move !important;
  user-select: none;
}

.draggable-modal .modal-header * {
  cursor: move !important;
}

.draggable-modal .modal-header .q-btn {
  cursor: pointer !important;
}

/* Dark mode draggable header */
.body--dark .draggable-modal .modal-header {
  background-color: #b71c1c !important;
}

/* Modal sürükleme efekti */
.draggable-modal:active {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
}
</style>
