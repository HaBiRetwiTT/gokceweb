<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col">
        <h5 class="q-my-none text-primary personel-baslik">Personel İşlemleri</h5>
        <p class="q-my-none text-caption text-grey-6">Giriş - Çıkış - Maaş</p>
      </div>
      <div class="col-auto q-mr-md">
        <q-btn
          color="orange"
          icon="account_balance_wallet"
          label="TOPLU MAAŞ TAHAKKUK"
          size="md"
          class="text-weight-bold"
          @click="onTopluMaasTahakkukClick"
        />
      </div>
      <div class="col-auto">
                 <q-btn
           color="primary"
           icon="refresh"
           label="Yenile"
           @click="() => loadPersonel()"
           :loading="loading"
         />
      </div>
    </div>


    <q-card>
      <q-card-section>
                 <q-table
           :rows="personelList"
           :columns="columns"
           row-key="PrsnTCN"
           :loading="loading"
           :pagination="{ rowsPerPage: 25 }"
           :rows-per-page-options="[10, 25, 50, 100]"
           flat
           bordered
           square
           dense
           class="personel-table"
           @row-dblclick="onRowDblClick"
           @request="onTableRequest"
         >
          <template v-slot:body-cell-cariBakiye="props">
            <q-td :props="props" style="border-right: 2px solid #e0e0e0;">
              <span class="text-weight-bold" :class="getBalanceClass(props.row.cariBakiye)">
                {{ formatCurrency(props.row.cariBakiye) }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-PrsnMaas="props">
            <q-td :props="props">
              <span class="text-weight-medium">
                {{ formatCurrency(props.row.PrsnMaas) }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-PrsnGrsTrh="props">
            <q-td :props="props">
              <span v-if="props.row.PrsnGrsTrh" class="giris-tarihi-text">
                {{ props.row.PrsnGrsTrh }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-PrsnCksTrh="props">
            <q-td :props="props">
              <span v-if="props.row.PrsnCksTrh" class="cikis-tarihi-text">
                {{ props.row.PrsnCksTrh }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-PrsnDurum="props">
            <q-td :props="props">
              <q-chip
                :color="props.row.PrsnDurum === 'ÇALIŞIYOR' ? 'positive' : 'negative'"
                text-color="white"
                size="xs"
                dense
              >
                {{ props.row.PrsnDurum }}
              </q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-PrsnYetki="props">
            <q-td :props="props">
              <q-chip
                color="blue"
                text-color="white"
                size="xs"
                dense
              >
                {{ props.row.PrsnYetki }}
              </q-chip>
            </q-td>
          </template>

          <template v-slot:no-data>
            <div class="full-width row flex-center q-pa-md text-grey-6">
              <q-icon name="people_outline" size="48px" class="q-mb-sm" />
              <div class="text-center">
                <div class="text-h6">Personel Bulunamadı</div>
                <div class="text-caption">Çalışan personel kaydı bulunmamaktadır.</div>
              </div>
            </div>
          </template>

          <template v-slot:loading>
            <q-inner-loading showing color="primary" />
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Personel Bilgileri Modal -->
    <q-dialog v-model="showPersonelModal" persistent>
             <q-card 
         ref="modalCard"
         style="min-width: 400px; max-width: 500px;" 
         class="personel-bilgi-modal draggable-modal"
       >
                 <q-card-section class="modal-header" style="cursor: move;">
          <div class="modal-title-section" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div class="modal-title-left">
              <span class="modal-title">Personel Bilgileri</span>
            </div>
            <div class="row items-center" style="gap:8px;">
              <span class="personel-no">No: {{ selectedPersonel.PrsnNo || '-' }}</span>
              <q-btn dense flat round icon="calculate" @click="onOpenCalculator" :title="'Hesap Makinesi'" />
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-md modal-body">
                     <div class="row q-col-gutter-md">
                          <!-- Tek Kolon -->
              <div class="col-12">
                <div class="row q-col-gutter-sm">
                                  <div class="col-12 col-sm-6">
                   <q-input
                     v-model="selectedPersonel.PrsnTCN"
                     label="TC Kimlik No *"
                     outlined
                     dense
                     readonly
                     required
                   />
                 </div>
                                   <div class="col-12 col-sm-6">
                    <q-input
                      v-model="selectedPersonel.PrsnTelNo"
                      label="Telefon No"
                      outlined
                      dense
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="selectedPersonel.PrsnAdi"
                      label="Adı Soyadı *"
                      outlined
                      dense
                      required
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="selectedPersonel.PrsnGorev"
                      label="Görevi"
                      outlined
                      dense
                    />
                  </div>
                                   <div class="col-12 col-sm-4">
                    <q-select
                      v-model="selectedPersonel.PrsnDurum"
                      :options="durumOptions"
                      label="Durumu"
                      outlined
                      dense
                      emit-value
                      map-options
                    />
                  </div>
                                                                                                                                               <div class="col-12 col-sm-4">
                      <q-input
                        v-model="selectedPersonel.PrsnGrsTrh"
                        label="Giriş Tarihi *"
                        outlined
                        dense
                        required
                      >
                       <template v-slot:append>
                         <q-icon name="event" class="cursor-pointer">
                           <q-popup-proxy ref="girisTarihiPopup" cover transition-show="scale" transition-hide="scale">
                             <q-date
                               v-model="selectedPersonel.PrsnGrsTrh"
                               mask="DD.MM.YYYY"
                               format24h
                               @update:model-value="girisTarihiPopup.hide()"
                             />
                           </q-popup-proxy>
                         </q-icon>
                       </template>
                     </q-input>
                   </div>
                                       <div class="col-12 col-sm-4">
                      <q-input
                        v-model="selectedPersonel.PrsnCksTrh"
                        label="Çıkış Tarihi"
                        outlined
                        dense
                      >
                       <template v-slot:append>
                         <q-icon name="event" class="cursor-pointer">
                           <q-popup-proxy ref="cikisTarihiPopup" cover transition-show="scale" transition-hide="scale">
                             <q-date
                               v-model="selectedPersonel.PrsnCksTrh"
                               mask="DD.MM.YYYY"
                               format24h
                               @update:model-value="cikisTarihiPopup.hide()"
                             />
                           </q-popup-proxy>
                         </q-icon>
                       </template>
                     </q-input>
                   </div>
                                                   <div class="col-12 col-sm-4">
                    <q-input
                      v-model="selectedPersonel.PrsnYetki"
                      label="Yetki Sırası"
                      outlined
                      dense
                      type="number"
                    />
                  </div>
                                     <div class="col-12 col-sm-4">
                     <q-input
                       v-model="selectedPersonel.PrsnMaas"
                       label="Aylık Maaş"
                       outlined
                       dense
                       type="text"
                       placeholder="Boş bırakılabilir"
                     />
                   </div>
                                     <div class="col-12 col-sm-4">
                     <q-input
                       v-model.number="selectedPersonel.PrsnOdGun"
                       label="Ödeme Günü"
                       outlined
                       dense
                       type="number"
                       :min="1"
                       :max="31"
                       :step="1"
                     />
                   </div>
                                                                                                                                           <div class="col-12 col-sm-4">
                     <q-input
                       v-model="selectedPersonel.PrsnOda"
                       label="Oda No"
                       outlined
                       dense
                       type="text"
                       maxlength="3"
                       :rules="[val => /^\d{0,3}$/.test(val) || 'En fazla 3 haneli sayı giriniz']"
                     />
                   </div>
                    <div class="col-12 col-sm-4">
                     <q-input
                       v-model.number="selectedPersonel.PrsnYtk"
                       label="Yatak No"
                       outlined
                       dense
                       type="number"
                       :min="1"
                       :max="9"
                       :step="1"
                       maxlength="1"
                     />
                   </div>
                                   <div class="col-12 col-sm-4">
                    <q-input
                      v-model="selectedPersonel.PrsnYakini"
                      label="Yemek"
                      outlined
                      dense
                    />
                  </div>
                                    <div class="col-12 col-sm-4">
                     <q-input
                       v-model="selectedPersonel.PrsnDuzey"
                       label="Yetki Düzeyi"
                       outlined
                       dense
                     />
                   </div>
                                       <div class="col-12 col-sm-4">
                      <q-input
                        v-model="selectedPersonel.PrsnUsrNm"
                        label="Kullanıcı Adı"
                        outlined
                        dense
                        autocomplete="off"
                      />
                    </div>
                                                           <div class="col-12 col-sm-4">
                                               <q-input
                          v-model="selectedPersonel.PrsnPassw"
                          label="Şifre"
                          outlined
                          dense
                          :type="showPassword ? 'text' : 'password'"
                          autocomplete="new-password"
                        >
                         <template v-slot:append>
                           <q-icon
                             :name="showPassword ? 'visibility_off' : 'visibility'"
                             class="cursor-pointer"
                             @click="showPassword = !showPassword"
                           />
                         </template>
                       </q-input>
                     </div>
                  
                   <!-- Doğum Tarihi, Eğitim, Medeni Durum -->
                                                                                                                                                               <div class="col-12 col-sm-4">
                        <q-input
                          v-model="selectedPersonel.PrsnDgmTarihi"
                          label="Doğum Tarihi"
                          outlined
                          dense
                        >
                         <template v-slot:append>
                           <q-icon name="event" class="cursor-pointer">
                             <q-popup-proxy ref="dogumTarihiPopup" cover transition-show="scale" transition-hide="scale">
                               <q-date
                                 v-model="selectedPersonel.PrsnDgmTarihi"
                                 mask="DD.MM.YYYY"
                                 format24h
                                 @update:model-value="dogumTarihiPopup.hide()"
                               />
                             </q-popup-proxy>
                           </q-icon>
                         </template>
                       </q-input>
                     </div>
                      <div class="col-12 col-sm-4">
                       <q-select
                         v-model="selectedPersonel.PrsnOkul"
                         :options="egitimOptions"
                         label="Eğitim"
                         outlined
                         dense
                         emit-value
                         map-options
                       />
                     </div>
                      <div class="col-12 col-sm-4">
                       <q-select
                         v-model="selectedPersonel.PrsnMedeni"
                         :options="medeniDurumOptions"
                         label="Medeni D."
                         outlined
                         dense
                         emit-value
                         map-options
                       />
                     </div>
                   
                                       <!-- Yakın Telefon ve Adres -->
                    <div class="col-12 col-sm-6">
                      <q-input
                        v-model="selectedPersonel.PrsnYknTel"
                        label="Yakın Telefon"
                        outlined
                        dense
                      />
                    </div>
                                       <div class="col-12 col-sm-6">
                      <q-input
                        v-model="selectedPersonel.PrsnAdres"
                        label="Adres"
                        outlined
                        dense
                      />
                    </div>
                   
                                       <!-- Not -->
                    <div class="col-12">
                      <q-input
                        v-model="selectedPersonel.PrsnBilgi"
                        label="Not"
                        outlined
                        dense
                        type="textarea"
                        rows="2"
                      />
                    </div>
                </div>
              </div>
          </div>
        </q-card-section>

                 <q-card-actions align="right" class="modal-actions">
           <div class="row full-width items-center justify-between">
             <div class="col-auto">
               <q-btn
                 label="TEMİZLE"
                 color="warning"
                 @click="onTemizleClick"
                 :loading="temizleLoading"
               />
             </div>
             <div class="col-auto">
                              <q-btn
                v-if="!isFormTemizlendi"
                label="DÜZENLE"
                color="primary"
                @click="onDuzenleClick"
                :loading="duzenleLoading"
                class="q-mr-sm"
               />
               <q-btn
                v-if="isFormTemizlendi"
                label="PERSONEL EKLE"
                color="positive"
                @click="onPersonelEkleClick"
                :loading="ekleLoading"
                class="q-mr-sm"
               />
               <q-btn
                 label="KAPAT"
                 color="secondary"
                 v-close-popup
               />
             </div>
           </div>
         </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Toplu Maaş Tahakkuk Modal -->
    <q-dialog v-model="showBulkSalaryModal" persistent>
      <q-card style="min-width: 400px; max-width: 500px;">
        <q-card-section class="bg-orange text-white">
          <div class="text-h6">
            <q-icon name="account_balance_wallet" class="q-mr-sm" />
            Toplu Maaş Tahakkuk
          </div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-select
                v-model="selectedMonth"
                :options="monthOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                label="Ay Seçiniz *"
                outlined
                dense
                clearable
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="selectedYear"
                :options="yearOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                label="Yıl Seçiniz *"
                outlined
                dense
              />
            </div>
          </div>
          <div class="q-mt-md text-grey-6">
            <q-icon name="info" class="q-mr-xs" />
            Durumu "ÇALIŞIYOR" ve maaşı 0'dan büyük olan tüm personeller için maaş tahakkuku yapılacaktır.
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            label="İPTAL"
            color="secondary"
            @click="onBulkSalaryCancel"
            :disable="bulkSalaryLoading"
          />
          <q-btn
            label="TOPLU TAHAKKUK YAP"
            color="orange"
            @click="processBulkSalaryAccrual"
            :loading="bulkSalaryLoading"
            :disable="!selectedMonth || !selectedYear"
            class="text-weight-bold"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { Notify } from 'quasar';
import { api } from '../boot/axios';

function onOpenCalculator() {
  window.dispatchEvent(new Event('openCalculator'))
}

interface Personel {
  PrsnNo?: number;
  PrsnTCN: string;
  PrsnAdi: string;
  PrsnDurum: string;
  PrsnTelNo: string;
  PrsnGrsTrh: string;
  PrsnCksTrh: string;
  PrsnGorev: string;
  PrsnYetki: number;
  PrsnMaas?: number | null;
  PrsnOdGun: number;
  PrsnUsrNm?: string;
  PrsnPassw?: string;
  PrsnDuzey?: string;
  PrsnOda: string;
  PrsnYtk: string;
  PrsnDgmTarihi: string;
  PrsnOkul: string;
  PrsnYakini: string;
  PrsnYknTel?: string;
  PrsnMedeni: string;
  PrsnAdres: string;
  PrsnBilgi: string;
  cariBakiye?: number;
}

const loading = ref(false);
const duzenleLoading = ref(false);
const temizleLoading = ref(false);
const personelList = ref<Personel[]>([]);
const showPersonelModal = ref(false);
const selectedPersonel = ref<Personel>({} as Personel);
const modalCard = ref();
const showPassword = ref(false);
const isFormTemizlendi = ref(false);
const ekleLoading = ref(false);

// Bulk salary accrual modal states
const showBulkSalaryModal = ref(false);
const bulkSalaryLoading = ref(false);
const selectedMonth = ref<string>('');
const selectedYear = ref<number>(new Date().getFullYear());

// Date picker popup referansları
const girisTarihiPopup = ref();
const cikisTarihiPopup = ref();
const dogumTarihiPopup = ref();

const durumOptions = [
  { label: 'ÇALIŞIYOR', value: 'ÇALIŞIYOR' },
  { label: 'AYRILDI', value: 'AYRILDI' }
];

const egitimOptions = [
  { label: 'İLKOKUL', value: 'İLKOKUL' },
  { label: 'ORTAOKUL', value: 'ORTAOKUL' },
  { label: 'LİSE', value: 'LİSE' },
  { label: 'ÜNİVERSİTE', value: 'ÜNİVERSİTE' }
];

const medeniDurumOptions = [
  { label: 'EVLİ', value: 'EVLİ' },
  { label: 'BEKAR', value: 'BEKAR' },
  { label: 'NİŞANLI', value: 'NİŞANLI' },
  { label: 'BOŞANMIŞ', value: 'BOŞANMIŞ' }
];

const columns = [
  {
    name: 'cariBakiye',
    label: 'Cari Bakiye',
    field: 'cariBakiye',
    align: 'right' as const,
    sortable: false,
    style: 'width: 120px; border-right: 2px solid #e0e0e0; font-weight: bold;'
  },
  {
    name: 'PrsnTCN',
    label: 'TCN',
    field: 'PrsnTCN',
    align: 'left' as const,
    sortable: false,
    style: 'width: 120px'
  },
  {
    name: 'PrsnAdi',
    label: 'Adı Soyadı',
    field: 'PrsnAdi',
    align: 'left' as const,
    sortable: false,
    style: 'width: 200px'
  },
  {
    name: 'PrsnDurum',
    label: 'Durumu',
    field: 'PrsnDurum',
    align: 'center' as const,
    sortable: false,
    style: 'width: 100px; display: none;',
    headerStyle: 'display: none;'
  },
  {
    name: 'PrsnTelNo',
    label: 'İrtibat No',
    field: 'PrsnTelNo',
    align: 'left' as const,
    sortable: false,
    style: 'width: 120px'
  },
  {
    name: 'PrsnGrsTrh',
    label: 'Giriş T.',
    field: 'PrsnGrsTrh',
    align: 'center' as const,
    sortable: false,
    style: 'width: 100px'
  },
  {
    name: 'PrsnCksTrh',
    label: 'Çıkış T.',
    field: 'PrsnCksTrh',
    align: 'center' as const,
    sortable: false,
    style: 'max-width: 70px; display: none;',
    headerStyle: 'display: none;'
  },
  {
    name: 'PrsnGorev',
    label: 'Görevi',
    field: 'PrsnGorev',
    align: 'left' as const,
    sortable: false,
    style: 'width: 150px'
  },
  {
    name: 'PrsnYetki',
    label: 'Sıra',
    field: 'PrsnYetki',
    align: 'center' as const,
    sortable: false,
    style: 'max-width: 50px; display: none;',
    headerStyle: 'display: none;'
  },
  {
    name: 'PrsnMaas',
    label: 'Aylık Maaş',
    field: 'PrsnMaas',
    align: 'right' as const,
    sortable: false,
    style: 'width: 120px'
  },
  {
    name: 'PrsnOdGun',
    label: 'Öd.Gün',
    field: 'PrsnOdGun',
    align: 'center' as const,
    sortable: false,
    style: 'width: 80px'
  },
     {
     name: 'PrsnOda',
     label: 'Oda No',
     field: 'PrsnOda',
     align: 'center' as const,
     sortable: false,
     style: 'max-width: 50px'
   },
   {
     name: 'PrsnYtk',
     label: 'Ytk.No',
     field: 'PrsnYtk',
     align: 'center' as const,
     sortable: false,
     style: 'max-width: 50px'
   },
  {
    name: 'PrsnDgmTarihi',
    label: 'D.Tarihi',
    field: 'PrsnDgmTarihi',
    align: 'center' as const,
    sortable: false,
    style: 'width: 100px'
  },
  {
    name: 'PrsnOkul',
    label: 'Eğitim',
    field: 'PrsnOkul',
    align: 'left' as const,
    sortable: false,
    style: 'width: 150px'
  },
  {
    name: 'PrsnYakini',
    label: 'İzin Günü',
    field: 'PrsnYakini',
    align: 'center' as const,
    sortable: false,
    style: 'width: 100px'
  },
  {
    name: 'PrsnMedeni',
    label: 'Med.Drm.',
    field: 'PrsnMedeni',
    align: 'center' as const,
    sortable: false,
    style: 'max-width: 70px'
  },
  {
    name: 'PrsnAdres',
    label: 'Adres',
    field: 'PrsnAdres',
    align: 'left' as const,
    sortable: false,
    style: 'width: 200px'
  },
  {
    name: 'PrsnBilgi',
    label: 'Not',
    field: 'PrsnBilgi',
    align: 'left' as const,
    sortable: false,
    style: 'width: 150px'
  }
];

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value === 0) return '-';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(value);
};

const loadPersonel = async (sortBy?: string, sortOrder?: 'ASC' | 'DESC') => {
  try {
    loading.value = true;
    
    // Sıralama parametrelerini URL'e ekle
    const params = new URLSearchParams();
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    
    const url = `/personel/calisanlar${params.toString() ? '?' + params.toString() : ''}`;
    const response = await api.get(url);
    
    if (response.data.success) {
      personelList.value = response.data.data;
      
      // Her personel için bakiye bilgisini yükle
      await loadPersonelBakiyeleri();
      
      Notify.create({
        type: 'positive',
        message: `${personelList.value.length} personel kaydı yüklendi`,
        position: 'top'
      });
    } else {
      throw new Error(response.data.message || 'Personel verileri yüklenemedi');
    }
  } catch (error: unknown) {
    console.error('Personel yükleme hatası:', error);
    let errorMessage = 'Personel verileri yüklenirken hata oluştu';
    
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      }
    }
    
    Notify.create({
      type: 'negative',
      message: errorMessage,
      position: 'top'
    });
  } finally {
    loading.value = false;
  }
};

// Personel bakiyelerini yükle
const loadPersonelBakiyeleri = async () => {
  try {
    const bakiyePromises = personelList.value.map(async (personel) => {
      if (personel.PrsnNo) {
        try {
          const response = await api.get(`/personel/bakiye/${personel.PrsnNo}`);
          if (response.data.success) {
            personel.cariBakiye = response.data.bakiye;
          } else {
            personel.cariBakiye = 0;
          }
        } catch (error) {
          console.error(`Personel ${personel.PrsnNo} bakiye yükleme hatası:`, error);
          personel.cariBakiye = 0;
        }
      } else {
        personel.cariBakiye = 0;
      }
    });
    
    await Promise.all(bakiyePromises);
  } catch (error) {
    console.error('Bakiye yükleme hatası:', error);
  }
};

// Bakiye renk sınıfını belirle
const getBalanceClass = (balance: number | null | undefined): string => {
  if (balance === null || balance === undefined) return 'text-grey-6';
  if (balance > 0) return 'text-positive';
  if (balance < 0) return 'text-negative';
  return 'text-grey-6';
};

// Ay seçenekleri
const monthOptions = [
  { label: 'Ocak', value: 'Ocak' },
  { label: 'Şubat', value: 'Şubat' },
  { label: 'Mart', value: 'Mart' },
  { label: 'Nisan', value: 'Nisan' },
  { label: 'Mayıs', value: 'Mayıs' },
  { label: 'Haziran', value: 'Haziran' },
  { label: 'Temmuz', value: 'Temmuz' },
  { label: 'Ağustos', value: 'Ağustos' },
  { label: 'Eylül', value: 'Eylül' },
  { label: 'Ekim', value: 'Ekim' },
  { label: 'Kasım', value: 'Kasım' },
  { label: 'Aralık', value: 'Aralık' }
];

// Yıl seçenekleri (son 2 yıl + gelecek 1 yıl)
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  return [
    { label: (currentYear - 2).toString(), value: currentYear - 2 },
    { label: (currentYear - 1).toString(), value: currentYear - 1 },
    { label: currentYear.toString(), value: currentYear },
    { label: (currentYear + 1).toString(), value: currentYear + 1 }
  ];
});

// Toplu maaş tahakkuk işlemi
const processBulkSalaryAccrual = async () => {
  if (!selectedMonth.value) {
    Notify.create({
      type: 'warning',
      message: 'Lütfen bir ay seçiniz',
      position: 'top'
    });
    return;
  }

  if (!selectedYear.value) {
    Notify.create({
      type: 'warning',
      message: 'Lütfen bir yıl seçiniz',
      position: 'top'
    });
    return;
  }

  try {
    bulkSalaryLoading.value = true;
    
    // Çalışan ve maaşı > 0 olan personelleri filtrele
    const eligiblePersonnel = personelList.value.filter(p => 
      p.PrsnDurum === 'ÇALIŞIYOR' && p.PrsnMaas && p.PrsnMaas > 0
    );
    
    if (eligiblePersonnel.length === 0) {
      Notify.create({
        type: 'warning',
        message: 'Maaş tahakkuku yapılacak çalışan personel bulunamadı',
        position: 'top'
      });
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    const islemBilgi = `${selectedMonth.value} ${selectedYear.value} ÜCRET TAHAKKUKU`;
    
    // Her personel için tahakkuk işlemi yap
    for (const personel of eligiblePersonnel) {
      try {
        const requestData = {
          personel: personel.PrsnAdi,
          islemTipi: 'maas_tahakkuk',
          islemGrup: 'Maaş Tahakkuku',
          odemeYontemi: 'tahakkuk',
          tutar: personel.PrsnMaas,
          islemBilgi: islemBilgi
        };
        
        const response = await api.post('/personel/tahakkuk-odeme', requestData);
        
        if (response.data.success) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Personel ${personel.PrsnAdi} tahakkuk hatası:`, response.data.message);
        }
      } catch (error) {
        errorCount++;
        console.error(`Personel ${personel.PrsnAdi} tahakkuk hatası:`, error);
      }
    }
    
    // Sonuç mesajı
    const message = `Toplam ${successCount} Adet Personel için MAAŞ TAHAKKUK işlemi yapılmıştır.`;
    
    Notify.create({
      type: successCount > 0 ? 'positive' : 'warning',
      message: errorCount > 0 ? `${message} (${errorCount} hata)` : message,
      position: 'top',
      timeout: 5000
    });
    
    // Modalı kapat ve tabloyu güncelle
    showBulkSalaryModal.value = false;
    await loadPersonel();
    
  } catch (error) {
    console.error('Toplu maaş tahakkuk hatası:', error);
    Notify.create({
      type: 'negative',
      message: 'Toplu maaş tahakkuk işlemi sırasında hata oluştu',
      position: 'top'
    });
  } finally {
    bulkSalaryLoading.value = false;
  }
};

// Bulk modal kapat handler
const onBulkSalaryCancel = () => {
  showBulkSalaryModal.value = false;
  selectedMonth.value = '';
  selectedYear.value = new Date().getFullYear();
};

// Toplu Maaş Tahakkuk butonu click handler
const onTopluMaasTahakkukClick = () => {
  showBulkSalaryModal.value = true;
};

// Çift tık event handler
const onRowDblClick = (evt: Event, row: Personel) => {
  selectedPersonel.value = { ...row };
  showPersonelModal.value = true;
  // Modal açıldığında şifreyi gizle ve form durumunu sıfırla
  showPassword.value = false;
  isFormTemizlendi.value = false;
};

// Tarih validasyonu için yardımcı fonksiyon
const validateGirisTarihi = (girisTarihi: string): { isValid: boolean; message: string } => {
  if (!girisTarihi || girisTarihi.trim() === '') {
    return { isValid: true, message: '' }; // Boş tarih kabul edilir
  }

  // Tarih formatını kontrol et (DD.MM.YYYY)
  const tarihRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
  if (!tarihRegex.test(girisTarihi)) {
    return { isValid: false, message: 'Giriş tarihi DD.MM.YYYY formatında olmalıdır' };
  }

  const [, gun, ay, yil] = girisTarihi.match(tarihRegex)!;
  const girisDate = new Date(parseInt(yil), parseInt(ay) - 1, parseInt(gun));
  
  // Geçerli tarih kontrolü
  if (isNaN(girisDate.getTime())) {
    return { isValid: false, message: 'Geçersiz giriş tarihi' };
  }

  // Bugünün tarihi
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);

  // Giriş tarihi bugünden ileri mi?
  if (girisDate > bugun) {
    return { isValid: false, message: 'Giriş tarihi bugünden ileri olamaz' };
  }

  // Doğum tarihi varsa, giriş tarihi doğum tarihinden önce mi?
  if (selectedPersonel.value.PrsnDgmTarihi && selectedPersonel.value.PrsnDgmTarihi.trim() !== '') {
    const dogumRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    if (dogumRegex.test(selectedPersonel.value.PrsnDgmTarihi)) {
      const [, dGun, dAy, dYil] = selectedPersonel.value.PrsnDgmTarihi.match(dogumRegex)!;
      const dogumDate = new Date(parseInt(dYil), parseInt(dAy) - 1, parseInt(dGun));
      
      if (girisDate < dogumDate) {
        return { isValid: false, message: 'Giriş tarihi doğum tarihinden önce olamaz' };
      }
    }
  }

  return { isValid: true, message: '' };
};

// Çıkış tarihi validasyonu için yardımcı fonksiyon
const validateCikisTarihi = (cikisTarihi: string, girisTarihi: string): { isValid: boolean; message: string } => {
  if (!cikisTarihi || cikisTarihi.trim() === '') {
    return { isValid: true, message: '' }; // Boş tarih kabul edilir
  }

  // Tarih formatını kontrol et (DD.MM.YYYY)
  const tarihRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
  if (!tarihRegex.test(cikisTarihi)) {
    return { isValid: false, message: 'Çıkış tarihi DD.MM.YYYY formatında olmalıdır' };
  }

  const [, gun, ay, yil] = cikisTarihi.match(tarihRegex)!;
  const cikisDate = new Date(parseInt(yil), parseInt(ay) - 1, parseInt(gun));
  
  // Geçerli tarih kontrolü
  if (isNaN(cikisDate.getTime())) {
    return { isValid: false, message: 'Geçersiz çıkış tarihi' };
  }

  // Bugünün tarihi
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);

  // Çıkış tarihi bugünden ileri mi?
  if (cikisDate > bugun) {
    return { isValid: false, message: 'Çıkış tarihi bugünden ileri olamaz' };
  }

  // Giriş tarihi varsa, çıkış tarihi giriş tarihinden önce mi?
  if (girisTarihi && girisTarihi.trim() !== '') {
    const girisRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    if (girisRegex.test(girisTarihi)) {
      const [, gGun, gAy, gYil] = girisTarihi.match(girisRegex)!;
      const girisDate = new Date(parseInt(gYil), parseInt(gAy) - 1, parseInt(gGun));
      
      if (cikisDate < girisDate) {
        return { isValid: false, message: 'Çıkış tarihi giriş tarihinden önce olamaz' };
      }
    }
  }

  return { isValid: true, message: '' };
};

// Aylık maaş validasyonu için yardımcı fonksiyon
const validateAylikMaas = (maas: string | number | null | undefined): { isValid: boolean; message: string } => {
  // Boş değer kabul edilir
  if (maas === null || maas === undefined || maas === '') {
    return { isValid: true, message: '' };
  }

  // String'e çevir
  const maasStr = String(maas).trim();
  
  // Sadece sayısal karakterler ve nokta içermeli
  const sayisalRegex = /^[0-9]+(\.[0-9]+)?$/;
  if (!sayisalRegex.test(maasStr)) {
    return { isValid: false, message: 'Aylık maaş sadece sayısal değer içermelidir' };
  }

  // Sayıya çevir ve kontrol et
  const maasNumber = parseFloat(maasStr);
  if (isNaN(maasNumber)) {
    return { isValid: false, message: 'Aylık maaş geçerli bir sayı olmalıdır' };
  }

  // Negatif değer kontrolü
  if (maasNumber < 0) {
    return { isValid: false, message: 'Aylık maaş negatif olamaz' };
  }

  // Çok büyük değer kontrolü (1 milyon TL üzeri)
  if (maasNumber > 1000000) {
    return { isValid: false, message: 'Aylık maaş 1.000.000 TL üzerinde olamaz' };
  }

  return { isValid: true, message: '' };
};

// Zorunlu alan validation
const validateZorunluAlanlar = (tcNo: string | null | undefined, adi: string | null | undefined, girisTarihi: string | null | undefined): { isValid: boolean; message: string } => {
  if (!tcNo || tcNo === '' || tcNo === null || tcNo === undefined) {
    return { isValid: false, message: 'TC Kimlik No alanı zorunludur' };
  }
  
  if (!adi || adi === '' || adi === null || adi === undefined) {
    return { isValid: false, message: 'Adı Soyadı alanı zorunludur' };
  }

  if (!girisTarihi || girisTarihi === '' || girisTarihi === null || girisTarihi === undefined) {
    return { isValid: false, message: 'Giriş Tarihi alanı zorunludur' };
  }
  
  return { isValid: true, message: '' };
};

// Oda No ve Yatak No validasyonu için yardımcı fonksiyon
const validateOdaYatak = (odaNo: string | number | null | undefined, yatakNo: string | number | null | undefined): { isValid: boolean; message: string } => {
  // Her iki alan da boş olabilir (ikisi de girilmemiş)
  if ((!odaNo || odaNo === '' || odaNo === null || odaNo === undefined) && 
      (!yatakNo || yatakNo === '' || yatakNo === null || yatakNo === undefined)) {
    return { isValid: true, message: '' };
  }

  // Sadece Oda No girilmiş, Yatak No girilmemiş
  if ((odaNo && odaNo !== '' && odaNo !== null && odaNo !== undefined) && 
      (!yatakNo || yatakNo === '' || yatakNo === null || yatakNo === undefined)) {
    return { isValid: false, message: 'Oda No girildiğinde Yatak No da girilmelidir' };
  }

  // Sadece Yatak No girilmiş, Oda No girilmemiş
  if ((!odaNo || odaNo === '' || odaNo === null || odaNo === undefined) && 
      (yatakNo && yatakNo !== '' && yatakNo !== null && yatakNo !== undefined)) {
    return { isValid: false, message: 'Yatak No girildiğinde Oda No da girilmelidir' };
  }

  // Her iki alan da dolu - geçerli
  return { isValid: true, message: '' };
};

// Temizle butonu click handler
const onTemizleClick = () => {
  try {
    temizleLoading.value = true;
    
    // Seçili personel bilgilerini temizle
    selectedPersonel.value = {
      PrsnTCN: '',
      PrsnAdi: '',
      PrsnDurum: 'ÇALIŞIYOR',
      PrsnTelNo: '',
      PrsnGrsTrh: '24.08.2025', // Bugünün tarihi (zorunlu alan)
      PrsnCksTrh: '',
      PrsnGorev: '',
      PrsnYetki: 0,
      PrsnMaas: 0.00,
      PrsnOdGun: 1,
      PrsnUsrNm: '',
      PrsnPassw: '',
      PrsnDuzey: '',
      PrsnOda: '',
      PrsnYtk: '',
      PrsnDgmTarihi: '',
      PrsnOkul: '',
      PrsnYakini: '',
      PrsnYknTel: '',
      PrsnMedeni: '',
      PrsnAdres: '',
      PrsnBilgi: ''
    };
    
    // Şifreyi gizle
    showPassword.value = false;
    
    // Form temizlendi durumunu aktif et
    isFormTemizlendi.value = true;
    
    Notify.create({
      type: 'positive',
      message: 'Form temizlendi',
      position: 'top'
    });
    
  } catch (error) {
    console.error('Form temizleme hatası:', error);
    Notify.create({
      type: 'negative',
      message: 'Form temizlenirken hata oluştu',
      position: 'top'
    });
  } finally {
    temizleLoading.value = false;
  }
};

// Düzenle butonu click handler
const onDuzenleClick = async () => {
  try {
    // Zorunlu alan validasyonu
    const zorunluAlanValidation = validateZorunluAlanlar(selectedPersonel.value.PrsnTCN, selectedPersonel.value.PrsnAdi, selectedPersonel.value.PrsnGrsTrh);
    if (!zorunluAlanValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: zorunluAlanValidation.message,
        position: 'top'
      });
      return; // Güncelleme yapma, sadece uyarı ver
    }

    // Giriş tarihi validasyonu
    const girisTarihiValidation = validateGirisTarihi(selectedPersonel.value.PrsnGrsTrh);
    if (!girisTarihiValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: girisTarihiValidation.message,
        position: 'top'
      });
      return; // Güncelleme yapma, sadece uyarı ver
    }

    // Çıkış tarihi validasyonu
    const cikisTarihiValidation = validateCikisTarihi(selectedPersonel.value.PrsnCksTrh, selectedPersonel.value.PrsnGrsTrh);
    if (!cikisTarihiValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: cikisTarihiValidation.message,
        position: 'top'
      });
      return; // Güncelleme yapma, sadece uyarı ver
    }

    // Aylık maaş validasyonu
    const aylikMaasValidation = validateAylikMaas(selectedPersonel.value.PrsnMaas);
    if (!aylikMaasValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: aylikMaasValidation.message,
        position: 'top'
      });
      return; // Güncelleme yapma, sadece uyarı ver
    }

    // Oda No ve Yatak No validasyonu
    const odaYatakValidation = validateOdaYatak(selectedPersonel.value.PrsnOda, selectedPersonel.value.PrsnYtk);
    if (!odaYatakValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: odaYatakValidation.message,
        position: 'top'
      });
      return; // Güncelleme yapma, sadece uyarı ver
    }

    duzenleLoading.value = true;
    
    console.log('🔍 Personel güncelleme başlatılıyor:', selectedPersonel.value);
    
    // Backend'e güncelleme isteği gönder
    const response = await api.put('/personel/guncelle', selectedPersonel.value);
    
    if (response.data.success) {
      // Başarılı güncelleme
      Notify.create({
        type: 'positive',
        message: 'Personel bilgileri başarıyla güncellendi',
        position: 'top'
      });
      
      // Modal'ı kapat
      showPersonelModal.value = false;
      
      // Grid listeyi yenile
      await loadPersonel('PrsnYetki', 'ASC');
      
    } else {
      throw new Error(response.data.message || 'Güncelleme başarısız');
    }
    
  } catch (error: unknown) {
    console.error('Personel güncelleme hatası:', error);
    console.log('🔍 Hata türü:', typeof error);
    console.log('🔍 Hata detayı:', error);
    
    let errorMessage = 'Personel güncellenirken hata oluştu';
    
    // Axios error response kontrolü
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      console.log('🔍 API Error response:', apiError.response);
      console.log('🔍 API Error data:', apiError.response?.data);
      
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
        console.log('✅ Backend hata mesajı yakalandı:', errorMessage);
      } else {
        console.log('❌ Backend hata mesajı bulunamadı');
      }
    } 
    // Standart Error object kontrolü
    else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error as { message: string }).message;
      console.log('✅ Standart hata mesajı yakalandı:', errorMessage);
    } else {
      console.log('❌ Hiçbir hata mesajı yakalanamadı');
    }
    
    // Hata mesajını göster
    Notify.create({
      type: 'warning', // DOLU yatak için warning tipi kullan
      message: errorMessage,
      position: 'top'
    });
    
    console.log('⚠️ Kullanıcıya gösterilen hata mesajı:', errorMessage);
  } finally {
    duzenleLoading.value = false;
  }
};

// Personel Ekle butonu click handler
const onPersonelEkleClick = async () => {
  try {
    // Zorunlu alan validasyonu
    const zorunluAlanValidation = validateZorunluAlanlar(selectedPersonel.value.PrsnTCN, selectedPersonel.value.PrsnAdi, selectedPersonel.value.PrsnGrsTrh);
    if (!zorunluAlanValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: zorunluAlanValidation.message,
        position: 'top'
      });
      return; // Ekleme yapma, sadece uyarı ver
    }

    // Giriş tarihi validasyonu
    const girisTarihiValidation = validateGirisTarihi(selectedPersonel.value.PrsnGrsTrh);
    if (!girisTarihiValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: girisTarihiValidation.message,
        position: 'top'
      });
      return; // Ekleme yapma, sadece uyarı ver
    }

    // Çıkış tarihi validasyonu
    const cikisTarihiValidation = validateCikisTarihi(selectedPersonel.value.PrsnCksTrh, selectedPersonel.value.PrsnGrsTrh);
    if (!cikisTarihiValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: cikisTarihiValidation.message,
        position: 'top'
      });
      return; // Ekleme yapma, sadece uyarı ver
    }

    // Aylık maaş validasyonu
    const aylikMaasValidation = validateAylikMaas(selectedPersonel.value.PrsnMaas);
    if (!aylikMaasValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: aylikMaasValidation.message,
        position: 'top'
      });
      return; // Ekleme yapma, sadece uyarı ver
    }

    // Oda No ve Yatak No validasyonu
    const odaYatakValidation = validateOdaYatak(selectedPersonel.value.PrsnOda, selectedPersonel.value.PrsnYtk);
    if (!odaYatakValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: odaYatakValidation.message,
        position: 'top'
      });
      return; // Ekleme yapma, sadece uyarı ver
    }

    ekleLoading.value = true;
    
    console.log('🔍 Personel ekleme başlatılıyor:', selectedPersonel.value);
    
    // Backend'e ekleme isteği gönder
    const response = await api.post('/personel/ekle', selectedPersonel.value);
    
    if (response.data.success) {
      // Başarılı ekleme
      Notify.create({
        type: 'positive',
        message: 'Personel başarıyla eklendi',
        position: 'top'
      });
      
      // Modal'ı kapat
      showPersonelModal.value = false;
      
      // Grid listeyi yenile
      await loadPersonel('PrsnYetki', 'ASC');
      
    } else {
      throw new Error(response.data.message || 'Ekleme başarısız');
    }
    
  } catch (error: unknown) {
    console.error('Personel ekleme hatası:', error);
    console.log('🔍 Hata türü:', typeof error);
    console.log('🔍 Hata detayı:', error);
    
    let errorMessage = 'Personel eklenirken hata oluştu';
    
    // Axios error response kontrolü
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      console.log('🔍 API Error response:', apiError.response);
      console.log('🔍 API Error data:', apiError.response?.data);
      
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
        console.log('✅ Backend hata mesajı yakalandı:', errorMessage);
      } else {
        console.log('❌ Backend hata mesajı bulunamadı');
      }
    } 
    // Standart Error object kontrolü
    else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error as { message: string }).message;
      console.log('✅ Standart hata mesajı yakalandı:', errorMessage);
    } else {
      console.log('❌ Hiçbir hata mesajı yakalanamadı');
    }
    
    // Hata mesajını göster
    Notify.create({
      type: 'warning',
      message: errorMessage,
      position: 'top'
    });
    
    console.log('⚠️ Kullanıcıya gösterilen hata mesajı:', errorMessage);
  } finally {
    ekleLoading.value = false;
  }
};

// Tablo sıralama event handler
interface TableRequestProps {
  pagination?: {
    sortBy?: string;
    descending?: boolean;
  };
}

const onTableRequest = (props: TableRequestProps) => {
  if (props.pagination && props.pagination.sortBy) {
    const sortBy = props.pagination.sortBy;
    const sortOrder = props.pagination.descending ? 'DESC' : 'ASC';
    
    console.log('🔍 Table sorting request:', { sortBy, sortOrder });
    
    // PrsnYetki sütunu için özel sıralama parametresi gönder
    if (sortBy === 'PrsnYetki') {
      console.log('✅ PrsnYetki sütunu - INT cast ile sıralama yapılacak');
      // Backend'de INT cast ile sıralama yapılacak
      void loadPersonel('PrsnYetki', sortOrder);
    } else {
      console.log('📝 Diğer sütun - normal sıralama yapılacak');
      // Diğer sütunlar için normal sıralama
      void loadPersonel(sortBy, sortOrder);
    }
  }
};

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
  document.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
  document.addEventListener('touchstart', dragStart);
  document.addEventListener('touchmove', drag);
  document.addEventListener('touchend', dragEnd);
}

// Çıkış tarihi değiştiğinde durumu otomatik güncelle
watch(() => selectedPersonel.value.PrsnCksTrh, (newCikisTarihi) => {
  if (newCikisTarihi && newCikisTarihi.trim() !== '') {
    // Çıkış tarihi doldurulduğunda durumu AYRILDI yap
    selectedPersonel.value.PrsnDurum = 'AYRILDI';
    console.log('🔍 Çıkış tarihi dolduruldu, durum AYRILDI olarak güncellendi');
  } else {
    // Çıkış tarihi boşaltıldığında durumu ÇALIŞIYOR yap
    selectedPersonel.value.PrsnDurum = 'ÇALIŞIYOR';
    console.log('🔍 Çıkış tarihi boşaltıldı, durum ÇALIŞIYOR olarak güncellendi');
  }
});

// Sayfa yüklendiğinde draggable modal özelliğini ayarla
onMounted(() => {
  // Varsayılan sıralama: PrsnYetki ASC ile veriyi yükle
  void loadPersonel('PrsnYetki', 'ASC');
  // Modal draggable özelliğini ayarla
  setupModalDraggable();
});
</script>

<style scoped>
.personel-table {
  font-size: 0.875rem;
}

/* Başlık font boyutu optimizasyonu */
.personel-baslik {
  font-size: 1.25rem !important;
  font-weight: 600;
  margin-bottom: 4px;
}

/* Tablo satır yüksekliği optimizasyonu */
.personel-table .q-table tbody tr {
  height: 32px;
  min-height: 32px;
}

.personel-table .q-table__top {
  padding: 8px 16px;
}

.personel-table .q-table__bottom {
  padding: 8px 16px;
}

.personel-table .q-table th {
  font-weight: 600;
  background-color: #f5f5f5;
  padding: 6px 8px;
  height: 36px;
  line-height: 1.2;
  text-align: center !important;
}

/* Daha spesifik selector ile header merkezleme */
.personel-table .q-table__thead th {
  text-align: center !important;
}

/* Quasar table header override */
.q-table th {
  text-align: center !important;
}

.personel-table .q-table td {
  padding: 4px 8px;
  height: 32px;
  line-height: 1.2;
}

.personel-table .q-table tbody tr:hover {
  background-color: #f8f9fa;
}

/* q-chip boyut optimizasyonu */
.personel-table .q-chip {
  height: 20px;
  font-size: 0.75rem;
  padding: 0 6px;
}

/* Giriş Tarihi yazı fontu artırıldı */
.giris-tarihi-text {
  font-size: 0.8rem;
  font-weight: 500;
  color: #2e7d32;
}

/* Çıkış Tarihi zemin rengi kaldırıldı */
.cikis-tarihi-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #d32f2f;
}

/* Modal Form Stilleri */
.personel-bilgi-modal {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
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

 .modal-title-right {
   flex: 0 0 auto;
 }

 .modal-title {
   font-size: 1.1rem;
   font-weight: 600;
   text-align: center;
 }

 .personel-no {
   font-size: 0.9rem;
   font-weight: 400;
   opacity: 0.8;
   color: rgba(255, 255, 255, 0.9);
   background: rgba(255, 255, 255, 0.1);
   padding: 4px 8px;
   border-radius: 4px;
   backdrop-filter: blur(2px);
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
  background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
}

/* Dark mode için modal header */
body.body--dark .modal-header {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
}

body.body--dark .modal-header:hover {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
}

/* Modal'ın ekran sınırlarında kalması için */
.q-dialog {
  overflow: visible !important;
}

.q-dialog .q-card {
  position: relative !important;
  z-index: 2000 !important;
  cursor: default !important;
}

/* Modal header için daha güçlü stil */
.modal-header * {
  pointer-events: auto !important;
}

.modal-header .q-btn {
  pointer-events: auto !important;
}

/* Modal body stilleri */
.modal-body {
  padding: 24px;
  background: #f8f9fa;
}

/* Dark mode için modal body */
body.body--dark .modal-body {
  background: #2c3e50;
}

/* Modal actions stilleri */
.modal-actions {
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  padding: 16px 24px;
}

/* Dark mode için modal actions */
body.body--dark .modal-actions {
  background: #34495e;
  border-top: 1px solid #495057;
}

/* Responsive padding */
@media (max-width: 768px) {
  .modal-actions .q-btn + .q-btn {
    margin-left: 8px;
  }
}
  
/* Modal actions butonları arası padding */
.modal-actions .q-btn + .q-btn {
  margin-left: 12px;
}

/* Responsive padding */
@media (max-width: 768px) {
  .modal-actions .q-btn + .q-btn {
    margin-left: 8px;
  }
}

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

/* Cari Bakiye sütunu için border stilleri */
.personel-table .q-table th:first-child,
.personel-table .q-table td:first-child {
  border-right: 2px solid #e0e0e0;
}

/* Dark mode için border rengi */
body.body--dark .personel-table .q-table th:first-child,
body.body--dark .personel-table .q-table td:first-child {
  border-right: 2px solid #424242;
}
</style>
