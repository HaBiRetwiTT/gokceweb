<template>
  <q-dialog 
    :model-value="modelValue" 
    @update:model-value="closeModal" 
    no-esc-dismiss
    no-backdrop-dismiss
    class="floating-dialog"
  >
    <q-card class="q-pa-sm draggable-card" style="width: 900px; max-width: 95vw; border-radius: 28px;">
      <q-card-section class="row items-center q-pb-sm q-pt-sm">
        <div class="text-subtitle1 text-grey-8 text-weight-medium">{{ modalTitle }}</div>
        <q-space />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="containers-wrapper">
          <!-- Temel Form -->
          <div class="ana-form-wrapper">
            <q-form @submit.prevent class="q-gutter-xs">
              
              <!-- Ana Container -->
              <div class="ana-form-container">
                <!-- Hesap Tipi ve Firma Bilgileri - Birleşik Container -->
                <div class="hesap-firma-container">
                  <div class="row no-wrap hesap-firma-row">
                    <!-- Sol Kolon - Hesap Tipi -->
                    <div class="col hesap-firma-col">
                      <q-input
                        v-model="formData.MstrHspTip"
                        label="Hesap Tipi"
                        outlined
                        dense
                        readonly
                        color="orange-4"
                        label-color="orange-4"
                        class="kurumsal-responsive"
                      />
                    </div>
                    
                    <!-- Sağ Kolon - Firma -->
                    <div class="col hesap-firma-col">
                      <q-input
                        v-model="formData.MstrFirma"
                        label="Firma"
                        outlined
                        color="orange-4"
                        label-color="orange-4"
                        dense
                        readonly
                        class="kurumsal-responsive"
                        :placeholder="formData.MstrHspTip === 'Bireysel' ? 'Bireysel müşteri' : 'Firma bilgisi yok'"
                      />
                    </div>
                  </div>
                </div>
                
                <!-- Müşteri Bilgileri -->
                <div class="musteri-fields">
                  <div class="row no-wrap musteri-row">
                    <!-- TC Kimlik No ve Telefon No -->
                    <div class="col musteri-col">
                      <q-input 
                        v-model="formData.MstrTCN" 
                        label="TC Kimlik No / Pasaport No" 
                        dense
                        outlined
                        color="primary"
                        label-color="primary"
                        class="kurumsal-responsive"
                        readonly
                      />
                    </div>
                    <div class="col musteri-col">
                      <q-input 
                        v-model="formData.MstrTelNo" 
                        label="Telefon No"
                        color="primary"
                        label-color="primary"
                        dense
                        outlined
                        readonly
                        class="kurumsal-responsive"
                      />
                    </div>
                  </div>
                  <!-- Müşteri Adı tek başına -->
                  <div class="row">
                    <div class="col-12">
                      <q-input 
                        v-model="formData.MstrAdi" 
                        label="Müşteri Adı" 
                        dense
                        outlined
                        color="primary"
                        label-color="primary"
                        class="kurumsal-responsive"
                        readonly
                      />
                    </div>
                  </div>
                </div>
                
                <!-- Oda ve Konaklama Bilgileri -->
                <div class="oda-konaklama-fields">
                  <!-- Üst Satır: Oda Tipi ve Oda No-Yatak No -->
                  <div class="row no-wrap oda-konaklama-row">
                    <div class="col oda-konaklama-col">
                      <q-select
                        v-model="formData.KnklmOdaTip"
                        :options="odaTipleriFormatted"
                        option-value="value"
                        option-label="label"
                        emit-value
                        map-options
                        label="Oda Tipi"
                        outlined
                        dense
                        color="green-6"
                        label-color="green-6"
                        @update:model-value="onOdaTipiChange"
                        required
                        class="kurumsal-responsive oda-select-field"
                        style="font-size: 0.75rem;"
                      >
                        <template v-slot:no-option>
                          <q-item dense>
                            <q-item-section class="text-grey">
                              Oda tipi bulunamadı
                            </q-item-section>
                          </q-item>
                        </template>
                        <template v-slot:option="scope">
                          <q-item v-bind="scope.itemProps" style="min-height: 32px; padding: 4px 12px;">
                            <q-item-section>
                              <q-item-label style="font-size: 0.75rem; line-height: 1.1; font-weight: 500;">
                                {{ scope.opt.value }}
                              </q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                                          <q-chip 
                              size="sm" 
                              color="green-1" 
                              text-color="green-8"
                              :label="scope.opt.bosOdaSayisi + ' boş'"
                              dense
                            />
                            </q-item-section>
                          </q-item>
                        </template>
                        <q-tooltip v-if="formData.KnklmOdaTip" class="bg-green-6 text-white text-body2" :delay="300">
                          <q-icon name="info" class="q-mr-xs"/>
                          Seçilen oda tipi: {{ formData.KnklmOdaTip }}
                        </q-tooltip>
                      </q-select>
                    </div>
                    <div class="col oda-konaklama-col">
                      <q-select
                        v-model="formData.OdaYatak"
                        :options="bosOdalar"
                        label="Oda No - Yatak No"
                        outlined
                        dense
                        color="green-6"
                        label-color="green-6"
                        :disable="!formData.KnklmOdaTip"
                        required
                        class="kurumsal-responsive oda-select-field"
                        style="font-size: 0.75rem;"
                        @update:model-value="onOdaYatakChange"
                      >
                        <template v-slot:no-option>
                          <q-item dense>
                            <q-item-section class="text-grey">
                              {{ formData.KnklmOdaTip ? 'Boş oda/yatak bulunamadı' : 'Önce oda tipi seçin' }}
                            </q-item-section>
                          </q-item>
                        </template>
                        <template v-slot:option="scope">
                          <q-item v-bind="scope.itemProps" style="min-height: 28px; padding: 2px 12px;">
                            <q-item-section>
                              <q-item-label style="font-size: 0.75rem; line-height: 1.1;" :title="scope.opt.label">
                                {{ scope.opt.label }}
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                        </template>
                        <q-tooltip v-if="formData.OdaYatak" class="bg-green-6 text-white text-body2" :delay="300">
                          <q-icon name="check_circle" class="q-mr-xs"/>
                          Seçilen oda-yatak: {{ formData.OdaYatak }}
                        </q-tooltip>
                      </q-select>
                    </div>
                  </div>
                  
                  <!-- Alt Satır: Konaklama Süresi, Konaklama Tipi ve Planlanan Çıkış Tarihi -->
                  <div class="row no-wrap oda-konaklama-row">
                    <div class="col-4 oda-konaklama-col">
                      <q-input
                        v-model.number="formData.KonaklamaSuresi"
                        :label="konaklamaSuresiLabel"
                        outlined
                        color="green-6"
                        label-color="green-6"
                        dense
                        type="number"
                        :min="1"
                        :max="30"
                        @update:model-value="onKonaklamaSuresiChanged"
                        required
                        class="kurumsal-responsive konaklama-field"
                        :readonly="konaklamaSuresiReadonly"
                      />
                    </div>
                    <div class="col-4 oda-konaklama-col">
                      <q-input
                        v-model="formData.KonaklamaTipi"
                        label="Konaklama Tipi"
                        outlined
                        color="green-6"
                        label-color="green-6"
                        dense
                        readonly
                        class="kurumsal-responsive konaklama-field konaklama-readonly"
                        :class="{ 'text-weight-medium': formData.KonaklamaTipi }"
                      />
                    </div>
                    <div class="col-4 oda-konaklama-col">
                      <q-input
                        v-if="donemYenileButtonLabel === 'ODA DEĞİŞİKLİ'"
                        :model-value="props.selectedData?.KnklmPlnTrh || ''"
                        label="Planlanan Çıkış Tarihi"
                        outlined
                        color="teal-6"
                        label-color="teal-6"
                        dense
                        readonly
                        class="kurumsal-responsive konaklama-field"
                      />
                      <q-input
                        v-else
                        v-model="formData.KnklmPlnTrh"
                        label="Planlanan Çıkış Tarihi"
                        outlined
                        color="teal-6"
                        label-color="teal-6"
                        dense
                        readonly
                        class="kurumsal-responsive konaklama-field"
                      />
                    </div>
                  </div>
                </div>
                
                <!-- Bedel Hesaplama ve İşlemler -->
                <div class="bedel-islemler-fields">
                  <!-- Üst Satır: Otomatik Hesaplanan Bedel, Toplam Bedel ve Ödeme Vadesi -->
                  <div class="row no-wrap bedel-islemler-row">
                    <div class="col bedel-islemler-col">
                      <q-input
                        v-model.number="formData.HesaplananBedel"
                        label="Otomatik Hesaplanan Bedel (TL)"
                        outlined
                        color="purple-6"
                        :label-color="$q.dark.isActive ? 'purple-3' : 'purple-6'"
                        dense
                        readonly
                        class="kurumsal-responsive hesaplanan-bedel-field"
                        :class="{ 'text-weight-medium': formData.HesaplananBedel > 0 }"
                      />
                    </div>
                    <div class="col bedel-islemler-col">
                      <q-input
                        v-model.number="formData.ToplamBedel"
                        label="Toplam Konaklama Bedeli (TL)"
                        outlined
                        color="orange-6"
                        label-color="orange-6"
                        dense
                        type="number"
                        :min="0"
                        @update:model-value="onToplamBedelChanged"
                        required
                        class="kurumsal-responsive bedel-field"
                      />
                    </div>
                    <div class="col bedel-islemler-col">
                      <q-input
                        v-model="formData.OdemeVadesi"
                        label="Ödeme Vadesi"
                        outlined
                        color="teal-6"
                        label-color="teal-6"
                        dense
                        readonly
                        class="kurumsal-responsive odeme-vadesi-field"
                      >
                        <template v-slot:append>
                          <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale" ref="odemeVadesiPopup">
                              <q-date 
                                v-model="formData.OdemeVadesi" 
                                mask="DD.MM.YYYY"
                                :locale="{
                                  days: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
                                  daysShort: ['Paz', 'Pts', 'Sal', 'Çar', 'Per', 'Cum', 'Cts'],
                                  months: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
                                  monthsShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
                                }"
                                minimal
                                @update:model-value="onOdemeVadesiSelected"
                              />
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                    </div>
                  </div>
                  
                  <!-- Alt Satır: Butonlar -->
                  <div class="row bedel-islemler-row items-center justify-evenly q-mt-sm">
                    <div class="bedel-islemler-item">
                      <q-btn 
                        @click="openEkBilgilerDialog" 
                        label="Ek Bilgiler" 
                        color="orange" 
                        outline
                        icon="room_service"
                        class="proportional-btn ek-bilgiler-btn"
                        size="md"
                      />
                    </div>
                    <div class="bedel-islemler-item">
                      <q-btn 
                        @click="saveDonemYenileme"
                        :label="donemYenileButtonLabel" 
                        color="blue" 
                        :loading="saving" 
                        class="proportional-btn donem-yenile-btn"
                        size="md"
                        icon="autorenew"
                      />
                    </div>
                    <div class="bedel-islemler-item">
                      <q-btn 
                        @click="handleCikisYap"
                        :label="cikisYapButtonLabel" 
                        color="red" 
                        :loading="saving"
                        class="proportional-btn cikis-yap-btn"
                        size="md"
                        icon="logout"
                      />
                    </div>
                    <div class="bedel-islemler-item kara-liste-item">
                      <q-checkbox 
                        v-model="karaListe"
                        label="Kara Liste" 
                        color="red"
                        class="kara-liste-checkbox"
                        dense
                      />
                    </div>
                    <div class="bedel-islemler-item">
                      <q-btn 
                        @click="closeModal" 
                        label="İPTAL" 
                        color="grey" 
                        outline
                        class="proportional-btn iptal-btn"
                        size="md"
                      />
                    </div>
                  </div>
                  
                  <!-- Kara Liste Detay Textbox -->
                  <div v-if="karaListe" class="row q-mt-sm">
                    <div class="col-12">
                      <q-input
                        v-model="karaListeDetay"
                        outlined
                        color="red-6"
                        label-color="red-6"
                        dense
                        type="textarea"
                        rows="3"
                        placeholder="Kara listeye alınma sebebini detaylandırın... (En az 10 karakter zorunlu)"
                        class="kurumsal-responsive kara-liste-textbox"
                      />
                    </div>
                  </div>
                </div>
                
                <!-- Ek Notlar Container -->
                <div class="ek-notlar-fields">
                  <q-input
                    v-model="ekNotlar"
                    @input="ekNotKilitli = true"
                    label="Ek Notlar"
                    outlined
                    color="indigo-6"
                    label-color="indigo-6"
                    dense
                    class="kurumsal-responsive"
                  />
                </div>
              </div> <!-- Ana Container Kapanış -->
            </q-form>
          </div>
        </div>
      </q-card-section>

      <!-- Ek Bilgiler Dialog -->
      <q-dialog 
        v-model="showEkBilgilerDialog" 
        no-esc-dismiss
        no-backdrop-dismiss
        class="floating-dialog"
      >
        <q-card class="ek-bilgiler-dialog draggable-card" style="width: 300px; max-width: 300px;">
          <q-card-section class="q-pt-sm">
            <div class="ek-bilgiler-container">
              <div class="column q-gutter-sm">
                <q-checkbox 
                  v-model="ekBilgiler.kahvaltiDahil" 
                  label="Kahvaltı Dahil" 
                  color="primary"
                  :disable="formData.KonaklamaTipi !== 'GÜNLÜK'"
                />
                <q-checkbox 
                  v-model="ekBilgiler.havluVerildi" 
                  label="Havlu Verildi" 
                  color="primary"
                />
                <q-checkbox 
                  v-model="ekBilgiler.prizVerildi" 
                  label="Priz Verildi" 
                  color="primary"
                />
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="İptal" color="grey" @click="cancelEkBilgiler" />
            <q-btn flat label="Tamam" color="primary" @click="saveEkBilgiler" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-card>
  </q-dialog>

  <q-dialog v-model="showOdaDegisikligiDialog">
    <q-card style="min-width:350px;max-width:95vw">
      <q-card-section>
        <div class="text-h6">ODA DEĞİŞİKLİĞİ HESAPLAMA</div>
        <div class="q-mt-md">
          <div><b>Eski Günlük Konaklama Bedeli:</b> {{ formatCurrency(odaDegisikligiDialogData.gunlukBedel) }}</div>
          <div><b>Çıkışa Kalan Gün:</b> {{ odaDegisikligiDialogData.kalanGun }} gün</div>
          <div><b>GİDER Yazılacak Bedel:</b> {{ formatCurrency(odaDegisikligiDialogData.giderBedel) }}</div>
          <div><b>Yeni Oda Tipi Günlük Bedel:</b> {{ formatCurrency(odaDegisikligiDialogData.yeniOdaTipiGunlukBedel) }}</div>
          <div><b>GELİR Yazılacak Bedel:</b> {{ formatCurrency(odaDegisikligiDialogData.gelirBedel) }}</div>
          <template v-if="odaDegisikligiDialogData.tahsilEdilecekBedel > 0">
            <div style="height: 1em;"></div>
            <div><b>TAHSİL EDİLECEK BEDEL:</b> {{ formatCurrency(odaDegisikligiDialogData.tahsilEdilecekBedel) }}</div>
          </template>
          <template v-else-if="odaDegisikligiDialogData.tahsilEdilecekBedel < 0">
            <div style="height: 1em;"></div>
            <div><b>İADE EDİLECEK BEDEL:</b> {{ formatCurrency(Math.abs(odaDegisikligiDialogData.tahsilEdilecekBedel)) }}</div>
          </template>
        </div>
        
        <!-- Ek Notlar Bölümü -->
        <div class="q-mt-lg" v-if="odaDegisikligiDialogData.ekNotlar">
          <label class="text-subtitle2 text-weight-bold text-primary">Ek Notlar:</label>
          <label class="eknotlar-icerik-label">
            {{ odaDegisikligiDialogData.ekNotlar }}
          </label>
        </div>
        
        <div class="q-mt-lg text-bold">ODA DEĞİŞİKLİĞİNİ ONAYLIYOR MUSUNUZ?</div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Hayır" color="negative" @click="showOdaDegisikligiDialog = false" />
        <q-btn flat label="Evet" color="positive" @click="onOdaDegisikligiOnayla" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Erken çıkış hesaplama dialogu -->
  <q-dialog v-model="showErkenCikisDialog">
    <q-card style="min-width:350px;max-width:95vw">
      <q-card-section>
        <div class="text-h6">ERKEN ÇIKIŞ HESAPLAMA</div>
        <div class="q-mt-md">
          <div><b>Oda Günlük Konaklama Bedeli:</b> {{ formatCurrency(erkenCikisDialogData.gunlukBedel) }}</div>
          <div><b>Çıkışa Kalan Gün:</b> {{ erkenCikisDialogData.kalanGun }} gün</div>
          <div><b>Gider yazılacak bedel:</b> {{ formatCurrency(erkenCikisDialogData.giderBedel) }}</div>
          <div style="height: 1em;"></div>
          <div><b>İADE EDİLECEK BEDEL:</b> {{ formatCurrency(erkenCikisDialogData.iadeBedel) }}</div>
          <div style="height: 1em;"></div>
          <!-- Ek Notlar label ve içeriği -->
          <div class="q-mt-lg" v-if="erkenCikisDialogData.ekNotlar">
            <label class="text-subtitle2 text-weight-bold text-primary">Ek Notlar:</label>
            <label class="eknotlar-icerik-label">
              {{ erkenCikisDialogData.ekNotlar }}
            </label>
          </div>
        </div>
        <div class="q-mt-lg text-bold">ERKEN ÇIKIŞ İŞLEMİNİ ONAYLIYOR MUSUNUZ?</div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="İPTAL" color="grey" @click="showErkenCikisDialog = false" />
        <q-btn flat label="İADESİZ ÇIKIŞ" color="negative" @click="onErkenCikisIadesizCikis" />
        <q-btn flat label="İADELİ ÇIKIŞ" color="primary" @click="onErkenCikisDialogOnayla" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { api } from '../boot/axios';
import { useQuasar, Notify } from 'quasar';
import type { MusteriKonaklama } from './models';

interface Props {
  modelValue: boolean;
  selectedData: MusteriKonaklama | null;
  activeFilter?: string | null;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'refresh'): void;
  (e: 'saved'): void;
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const $q = useQuasar();

// Popup referansı
const odemeVadesiPopup = ref();

// Fonksiyonları önce tanımla
onMounted(() => {
  setEkNotlarPrefixFromKnklmNot();
});

// Tutar formatlama fonksiyonu (ondalık küsuratları yuvarlar)
function formatCurrency(value: number | undefined | string | null): string {
  if (value === null || value === undefined || value === '') return '0 ₺'
  
  // String'i number'a çevir
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  // NaN kontrolü
  if (isNaN(numValue)) {
    return '0 ₺'
  }
  
  // Ondalık küsuratları yuvarla (2 basamak)
  const roundedValue = Math.round(numValue * 100) / 100
  
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(roundedValue)
}

const saving = ref(false);
const veriYukleniyor = ref(false); // Veri yükleme sırasında watchers'ları disable etmek için
const odaTipleri = ref<{odaTipi: string, bosOdaSayisi: number}[]>([]);
const odaTipleriFormatted = ref<{value: string, label: string, bosOdaSayisi: number}[]>([]);

// 🔥 Dinamik buton isimleri - aktif karta göre değişir
const donemYenileButtonLabel = computed(() => {
  if (
    props.activeFilter === 'yeni-musteri' ||
    props.activeFilter === 'yeni-giris' ||
    props.activeFilter === 'toplam-aktif'
  ) {
    return 'ODA DEĞİŞİKLİ';
  }
  return 'DÖNEM YENİLE';
});

const cikisYapButtonLabel = computed(() => {
  if (
    props.activeFilter === 'yeni-musteri' ||
    props.activeFilter === 'yeni-giris' ||
    props.activeFilter === 'toplam-aktif'
  ) {
    return 'ERKEN ÇIKIŞ';
  }
  return 'ÇIKIŞ YAP';
});

const konaklamaSuresiReadonly = ref(false);

const modalTitle = computed(() => `${donemYenileButtonLabel.value} / ${cikisYapButtonLabel.value}`);

const konaklamaSuresiLabel = computed(() => {
  return donemYenileButtonLabel.value === 'ODA DEĞİŞİKLİ'
    ? 'Kalan Konaklama Süresi (Gün)'
    : 'Konaklama Süresi (Gün)';
});

async function saveDonemYenileme() {

  // ODA DEĞİŞİKLİĞİ özel kontrolü
  if (donemYenileButtonLabel.value === 'ODA DEĞİŞİKLİ') {
    if (karaListe.value) {
      $q.notify({
        color: 'negative',
        icon: 'warning',
        message: 'Kara Liste Seçilmiş İken Oda Değişimi Yapılamaz',
        position: 'top',
        timeout: 3000
      });
      return;
    }
    konaklamaSuresiReadonly.value = true;
    formData.value.KnklmNot = '';
    // Oda No - Yatak No seçimi kontrolü
    if (!formData.value.OdaYatak || (typeof formData.value.OdaYatak === 'string' && !formData.value.OdaYatak) || (typeof formData.value.OdaYatak === 'object' && !formData.value.OdaYatak.value)) {
      $q.notify({
        color: 'warning',
        icon: 'info',
        message: 'Oda No - Yatak No seçimi yapılmadı!',
        position: 'top',
        timeout: 3000
      });
      return;
    }
    if (formData.value.KnklmOdaTip === props.selectedData?.KnklmOdaTip) {
      $q.notify({
        color: 'warning',
        icon: 'info',
        message: 'Henüz Bir Oda Değişilkliği Yapmadınız!',
        position: 'top',
        timeout: 3000
      });
      return;
    } else {
      // 🔥 ODA DEĞİŞİKLİĞİ TARİH KONTROLÜ - Konaklama giriş tarihi ile karşılaştır
      const bugun = new Date();
      const girisTarihi = props.selectedData?.KnklmGrsTrh;
      
      if (girisTarihi) {
        const [gun = 0, ay = 0, yil = 0] = girisTarihi.split('.').map(s => Number(s) || 0);
        const girisTarihiObj = new Date(yil, ay - 1, gun);
        
        // Bugün giriş tarihi ile aynı gün mü kontrol et
        const bugunGun = bugun.getDate();
        const bugunAy = bugun.getMonth() + 1;
        const bugunYil = bugun.getFullYear();
        
        const girisGun = girisTarihiObj.getDate();
        const girisAy = girisTarihiObj.getMonth() + 1;
        const girisYil = girisTarihiObj.getFullYear();
        
        const ayniGun = (bugunGun === girisGun && bugunAy === girisAy && bugunYil === girisYil);
        
        if (ayniGun) {
          // 🔥 KONAKLAMANIN İLK GÜNÜ - Direkt işlem yap
          await direktOdaDegisikligiYap();
          return;
        } else {
          // 🔥 KONAKLAMANIN DEVAM EDEN GÜNLERİ - Detaylı hesaplama gerekli
          hesaplaVeGosterOdaDegisikligiDialog();
          return;
        }
      } else {
        // Giriş tarihi yoksa varsayılan olarak detaylı hesaplama yap
        hesaplaVeGosterOdaDegisikligiDialog();
        return;
      }
    }
  } else {
    konaklamaSuresiReadonly.value = false;
  }
  
  // 🚨 KARA LİSTE KONTROLÜ - Dönem yenileme işlemi engellensin
  if (karaListe.value) {
    $q.notify({
      color: 'negative',
      icon: 'warning',
      message: 'Kara Liste seçimi tespit edildi, işleme devam edilemiyor.',
      position: 'top',
      timeout: 3000 // 3 saniye göster
    });
    return; // İşlemi durdur - saving state'i değiştirme
  }
  
  saving.value = true;
  
  try {
    
    // OdaYatak objesini oluştur (backend'in beklediği format)
    let odaYatakStr: string;
    if (typeof formData.value.OdaYatak === 'string') {
      odaYatakStr = formData.value.OdaYatak.replace(' (mevcut)', '');
    } else if (formData.value.OdaYatak && typeof formData.value.OdaYatak === 'object' && 'value' in formData.value.OdaYatak) {
      odaYatakStr = (formData.value.OdaYatak as { value: string }).value.replace(' (mevcut)', '');
    } else {
      throw new Error('OdaYatak verisi geçersiz format');
    }
    
    const [odaNo, yatakNo] = odaYatakStr.split('-');
    const odaYatakObj = {
      value: odaYatakStr,
      label: `Oda: ${odaNo} - Yatak: ${yatakNo}`
    };
    
    // Backend'e gönderilecek data
    const requestData = {
      ...formData.value,
      OdaYatak: odaYatakObj,
      eskiKnklmPlnTrh: formData.value.eskiKnklmPlnTrh,
      ekBilgiler: ekBilgiler.value,
      MstrKllnc: 'admin' // Varsayılan kullanıcı adı
    };
    
    const response = await api.post('/musteri/donem-yenileme', requestData);

    if (response.data.success) {
      Notify.create({
        type: 'positive',
        message: 'Dönem yenileme başarıyla tamamlandı!',
        position: 'top',
        timeout: 3000, // 3 saniye göster
        actions: [
          {
            icon: 'close',
            color: 'white',
            handler: () => { /* dismiss */ }
          }
        ]
      });
      
      // 🔥 STATS GÜNCELLEME EVENT'İ GÖNDER
      window.dispatchEvent(new Event('statsNeedsUpdate'));
      
      // 3 saniye sonra modal'ı kapat ve parent'ı güncelle
      setTimeout(() => {
        emit('saved');
        closeModal();
        
        // 🔥 MÜŞTERİ BİLGİSİNİ GLOBAL STATE'E AKTAR VE TAHSİLAT MODALINI AÇ
        setTimeout(() => {
          // Müşteri bilgisini global state'e aktar
          if (props.selectedData) {
            console.log('🔥 saveDonemYenileme - props.selectedData:', props.selectedData)
            console.log('🔥 saveDonemYenileme - MstrAdi:', props.selectedData.MstrAdi)
            window.kartliIslemSelectedNormalMusteri = {
              ...props.selectedData,
              MstrAdi: props.selectedData.MstrAdi || ''
            };
            console.log('🔥 saveDonemYenileme - window.kartliIslemSelectedNormalMusteri set:', window.kartliIslemSelectedNormalMusteri)
          } else {
            console.log('❌ saveDonemYenileme - props.selectedData bulunamadı')
          }
          // 🔥 OTOMATİK MODAL AÇMA FLAG'İNİ SET ET
          (window as Window & { kartliIslemAutoOpenModal?: boolean }).kartliIslemAutoOpenModal = true;
          window.dispatchEvent(new Event('showOdemeIslemModal'));
        }, 500);
      }, 3000);
      
    } else {
      throw new Error(response.data.message || 'Bilinmeyen hata');
    }
  } catch (error: unknown) {
    console.error('Dönem yenileme hatası:', error);
    
    Notify.create({
      type: 'negative',
      message: (error as Error & { response?: { data?: { message?: string } } }).response?.data?.message || 'Dönem yenileme sırasında hata oluştu',
      position: 'top'
    });
  } finally {
    saving.value = false;
  }
}

function closeModal() {
  // 🔥 İPTAL BUTONUNDA TÜM FORM ALANLARINI SIFIRLA
  karaListe.value = false;
  karaListeDetay.value = '';
  ekBilgiler.value = {
    kahvaltiDahil: true,
    havluVerildi: false,
    prizVerildi: false
  };
  formData.value = {
    MstrTCN: '',
    MstrAdi: '',
    MstrTelNo: '',
    MstrHspTip: '',
    MstrFirma: '',
    KnklmOdaTip: '',
    OdaYatak: '' as string | {value: string, label: string},
    KonaklamaSuresi: 1,
    KonaklamaTipi: '',
    HesaplananBedel: 0,
    ToplamBedel: 0,
    KnklmPlnTrh: '',
    KnklmNot: '',
    OdemeVadesi: '', // 🔥 Ödeme vadesi alanı sıfırlandı
    eskiKnklmPlnTrh: '',
    eskiOdaYatak: ''
  };
  bosOdalar.value = [];
  odaTipFiyatlari.value = null;
  ekNotlar.value = '';
  ekNotKilitli.value = false; // Modal kapanınca kilidi kaldır

  // Modal'ı kapat ve parent'a bildir
  showModal.value = false;
  emit('update:modelValue', false);
}



function handleCikisYap() {
  if (!props.selectedData) return;

  // Eğer buton label'ı ERKEN ÇIKIŞ ise özel fonksiyona yönlendir
  if (cikisYapButtonLabel.value === 'ERKEN ÇIKIŞ') {
    handleErkenCikisYap();
    return;
  }

  // 🔥 KARA LİSTE KONTROLÜ
  if (karaListe.value) {
    // Kara liste açıklama kontrolü - en az 10 karakter
    if (!karaListeDetay.value || karaListeDetay.value.trim().length < 10) {
      $q.notify({
        color: 'negative',
        icon: 'warning',
        message: 'Kara liste işaretli iken açıklama alanına en az 10 karakter girmelisiniz!',
        position: 'top',
        timeout: 4000
      });
      return; // İşlemi durdur
    }
  }

  $q.dialog({
    title: 'Onay',
    message: 'Müşterinin çıkışını yapmak istediğinizden emin misiniz? Bu işlem odayı boşaltacak ve konaklamayı sonlandıracaktır.',
    cancel: {
      label: 'İptal',
      color: 'grey'
    },
    ok: {
      label: 'Evet, Çıkış Yap',
      color: 'negative',
      flat: false
    },
    persistent: true
  }).onOk(() => {
    const performCikis = async () => {
      saving.value = true;
      try {
        const cikisData = {
          tcNo: props.selectedData!.MstrTCN,
          plnTrh: props.selectedData!.KnklmPlnTrh,
          odaYatak: {
            label: `Oda: ${props.selectedData!.KnklmOdaNo} - Yatak: ${props.selectedData!.KnklmYtkNo}`,
            value: `${props.selectedData!.KnklmOdaNo}-${props.selectedData!.KnklmYtkNo}`
          },
          // 🔥 KARA LİSTE VERİLERİNİ EKLE
          ...(karaListe.value && {
            knklmKrLst: 'EVET',
            knklmNot: karaListeDetay.value.trim()
          })
        };

        const response = await api.post('/musteri/cikis-yap', cikisData);

        if (response.data.success) {
    Notify.create({
      type: 'positive',
            message: response.data.message || 'Çıkış işlemi başarıyla tamamlandı!',
            position: 'top',
            timeout: 3000,
            actions: [{ icon: 'close', color: 'white', handler: () => { /* dismiss */ } }]
          });
          
          // 🔥 STATS GÜNCELLEME EVENT'İ GÖNDER
          window.dispatchEvent(new Event('statsNeedsUpdate'));
          
          setTimeout(() => {
            emit('refresh');
            closeModal();
            
            // 🔥 MÜŞTERİ BİLGİSİNİ GLOBAL STATE'E AKTAR VE TAHSİLAT MODALINI AÇ
            setTimeout(() => {
              // Müşteri bilgisini global state'e aktar
              if (props.selectedData) {
                console.log('🔥 handleCikisYap - props.selectedData:', props.selectedData)
                console.log('🔥 handleCikisYap - MstrAdi:', props.selectedData.MstrAdi)
                window.kartliIslemSelectedNormalMusteri = {
                  ...props.selectedData,
                  MstrAdi: props.selectedData.MstrAdi || ''
                };
                console.log('🔥 handleCikisYap - window.kartliIslemSelectedNormalMusteri set:', window.kartliIslemSelectedNormalMusteri)
              } else {
                console.log('❌ handleCikisYap - props.selectedData bulunamadı')
              }
              // 🔥 OTOMATİK MODAL AÇMA FLAG'İNİ SET ET
              (window as Window & { kartliIslemAutoOpenModal?: boolean }).kartliIslemAutoOpenModal = true;
              window.dispatchEvent(new Event('showOdemeIslemModal'));
            }, 500);
          }, 3000);

        } else {
          throw new Error(response.data.message || 'Bilinmeyen bir hata oluştu.');
        }
      } catch (error) {
        let errorMessage = 'Bir hata oluştu';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        $q.notify({
          color: 'negative',
          icon: 'error',
          message: `Çıkış işlemi başarısız: ${errorMessage}`,
          position: 'top',
          timeout: 4000
        });
      } finally {
        saving.value = false;
      }
    };
    void performCikis();
  });
}

// ERKEN ÇIKIŞ işlemleri için ana fonksiyon (detaylar eklenecek)
function handleErkenCikisYap() {
  if (!props.selectedData) return;

  // İşlem tarihi (bugün)
  const bugun = new Date();
  // Konaklama giriş tarihi (DD.MM.YYYY formatında)
  const girisTarihiStr = props.selectedData.KnklmGrsTrh;
  if (!girisTarihiStr) return;
  const [grsGun = 0, grsAy = 0, grsYil = 0] = girisTarihiStr.split('.').map(s => Number(s) || 0);
  const girisTarihi = new Date(grsYil, grsAy - 1, grsGun);

  // Tarih karşılaştırma püf noktası: Sadece gün, ay, yıl karşılaştırılır
  const bugunGun = bugun.getDate();
  const bugunAy = bugun.getMonth() + 1;
  const bugunYil = bugun.getFullYear();
  const girisGun = girisTarihi.getDate();
  const girisAy = girisTarihi.getMonth() + 1;
  const girisYil = girisTarihi.getFullYear();

  const ayniGun = (bugunGun === girisGun && bugunAy === girisAy && bugunYil === girisYil);

  if (ayniGun) {
    // 1- İşlem tarihi = giriş tarihi: Sadece onay dialogu aç
    // Onaylandığında işlemleri başlat
    erkenCikisOnayDialoguAc();
  } else {
    // 2- İşlem tarihi > giriş tarihi: Hesaplama dialogu aç
    erkenCikisHesaplamaDialoguAc();
  }
}

// Erken çıkış onay dialogu (aynı gün çıkış için)
function erkenCikisOnayDialoguAc() {
  // Sadece "Çıkışı onaylıyor musunuz?" dialogu açılır
  $q.dialog({
    title: 'Onay',
    message: 'Müşterinin çıkışını yapmak istediğinizden emin misiniz? Bu işlem odayı boşaltacak ve konaklamayı sonlandıracaktır.',
    cancel: {
      label: 'İptal',
      color: 'grey'
    },
    ok: {
      label: 'Evet, Çıkışı Yap',
      color: 'negative',
      flat: false
    },
    persistent: true
  }).onOk(() => {
    // Onaylandığında işlemleri başlat
    void erkenCikisIslemleriYap({
      giderTutar: Number(props.selectedData?.KnklmNfyt) || 0, // knklmNfyt
      hesaplananEkNot: 'ERKEN ÇIKIŞ FARKI',
      dialogdanMi: false // dialogdan gelmedi, direkt işlem
    });
  });
}




const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const bosOdalar = ref<{value: string, label: string}[]>([]);
const odaTipFiyatlari = ref<{
  OdLfytGun?: number;
  OdLfytHft?: number;
  OdLfytAyl?: number;
} | null>(null);

// Ek Bilgiler Dialog
const showEkBilgilerDialog = ref(false);
const ekBilgiler = ref({
  kahvaltiDahil: true,
  havluVerildi: false,
  prizVerildi: false
});

// Ek Bilgilerin orijinal durumunu saklamak için
const originalEkBilgiler = ref({
  kahvaltiDahil: true,
  havluVerildi: false,
  prizVerildi: false
});

// Ek Notlar (otomatik güncellenen)
const ekNotlar = ref('');

// Loading state (Transaction işlemleri için)
const loading = ref(false);

// Hesaplama detayları (oda değişikliği işlemleri için)
const hesaplamaDetay = ref<{ onaylanmisFiyat: number } | null>(null);

// Oda-yatak parsing fonksiyonu
function parseOdaYatak(odaYatakStr: string | { value?: string, label?: string }) {
  let odaYatakValue = '';
  if (typeof odaYatakStr === 'string') {
    odaYatakValue = odaYatakStr;
  } else if (odaYatakStr && typeof odaYatakStr === 'object') {
    odaYatakValue = odaYatakStr.value || '';
  }
  
  const parts = odaYatakValue.split('-');
  const eskiOdaNo = props.selectedData?.KnklmOdaNo || '';
  const eskiYatakNo = props.selectedData?.KnklmYtkNo || '';
  const yeniOdaNo = parts[0] || '';
  const yeniYatakNo = parts[1] || '';
  
  return {
    eskiOdaNo,
    eskiYatakNo,
    yeniOdaNo, 
    yeniYatakNo
  };
}

// Dialog hide fonksiyonu
function onDialogHide() {
  emit('update:modelValue', false);
}

// Kara Liste checkbox
const karaListe = ref(false);
const karaListeDetay = ref('');

const formData = ref({
  MstrTCN: '',
  MstrAdi: '',
  MstrTelNo: '',
  MstrHspTip: '',
  MstrFirma: '',
  KnklmOdaTip: '',
  OdaYatak: '' as string | {value: string, label: string},
  KonaklamaSuresi: 1,
  KonaklamaTipi: '',
  HesaplananBedel: 0,
  ToplamBedel: 0,
  KnklmPlnTrh: '',
  KnklmNot: '',
  OdemeVadesi: '', // 🔥 Ödeme vadesi alanı eklendi
  eskiKnklmPlnTrh: '',
  eskiOdaYatak: ''
});

// Ödeme vadesi geçmiş tarih kontrolü helper fonksiyonu
function validateOdemeVadesi(dateStr: string, showNotification: boolean = true): string {
  if (!dateStr || dateStr.trim() === '') {
    // Boş tarih için bugünün tarihini döndür
    const bugun = new Date();
    const d = bugun.getDate().toString().padStart(2, '0');
    const m = (bugun.getMonth() + 1).toString().padStart(2, '0');
    const y = bugun.getFullYear();
    return `${d}.${m}.${y}`;
  }

  // Seçilen tarihi güvenli şekilde Date objesine çevir
  const parts = dateStr.split('.');
  let gun = Number(parts[0]);
  let ay = Number(parts[1]);
  let yil = Number(parts[2]);
  const bugun = new Date();
  bugun.setHours(0,0,0,0);

  // Eğer tarih eksikse bugünün tarihi kullan
  if (!gun || !ay || !yil) {
    gun = bugun.getDate();
    ay = bugun.getMonth() + 1;
    yil = bugun.getFullYear();
  }
  const secilen = new Date(yil, ay - 1, gun);

  if (secilen < bugun) {
    if (showNotification) {
      Notify.create({
        type: 'warning',
        message: 'Geçmiş bir tarih seçilemez! Ödeme vadesi bugünün tarihi olarak ayarlandı.'
      });
    }
    const d = bugun.getDate().toString().padStart(2, '0');
    const m = (bugun.getMonth() + 1).toString().padStart(2, '0');
    const y = bugun.getFullYear();
    return `${d}.${m}.${y}`;
  }

  return dateStr;
}

// Ödeme vadesi seçildiğinde popup'ı kapat
function onOdemeVadesiSelected(date: string) {
  const validatedDate = validateOdemeVadesi(date, true);
  formData.value.OdemeVadesi = validatedDate;
  
  if (odemeVadesiPopup.value) {
    odemeVadesiPopup.value.hide();
  }
}

// Tarih formatını MM.DD.YYYY'den DD.MM.YYYY'ye çevir
function convertDateFormat(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') return '';
  

  
  // MM.DD.YYYY formatını kontrol et ve DD.MM.YYYY'ye çevir
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const firstPart = parseInt(parts[0] || '0');
      const secondPart = parseInt(parts[1] || '0');
      

      
      // Eğer ikinci kısım 12'den büyükse, bu MM.DD.YYYY formatıdır (ay 12'den büyük olamaz)
      if (secondPart > 12) {
        const result = `${parts[1]}.${parts[0]}.${parts[2]}`;

        return result;
      }
      // Eğer ilk kısım 12'den büyükse, bu MM.DD.YYYY formatıdır (gün > 12)
      else if (firstPart > 12) {
        const result = `${parts[1]}.${parts[0]}.${parts[2]}`;

        return result;
      }
      // Eğer her ikisi de 12'den küçükse, varsayılan olarak MM.DD.YYYY kabul et
      else {
        const result = `${parts[1]}.${parts[0]}.${parts[2]}`;

        return result;
      }
    }
  }
  
  // Farklı formatlar için kontrol
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    // YYYY-MM-DD formatı
    const parts = dateStr.split('-');
    const result = `${parts[2]}.${parts[1]}.${parts[0]}`;

    return result;
  }
  
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    // MM/DD/YYYY formatı
    const parts = dateStr.split('/');
    const result = `${parts[1]}.${parts[0]}.${parts[2]}`;

    return result;
  }
  

  return dateStr; // Değiştirilemezse olduğu gibi döndür
}

// 🔥 Konaklama süresini KnklmPlnTrh ve KnklmGrsTrh'den hesapla
function calculateKonaklamaSuresi(plnTrh: string, grsTrh: string): number {
  if (!plnTrh || !grsTrh) {
    return 1; // Varsayılan değer
  }
  
  try {
    // Planlanan çıkış tarihini parse et
    const [plnGun = 0, plnAy = 0, plnYil = 0] = plnTrh.split('.').map(s => Number(s) || 0);
    const plnTarih = new Date(plnYil, plnAy - 1, plnGun);
    
    // Giriş tarihini parse et
    const [grsGun = 0, grsAy = 0, grsYil = 0] = grsTrh.split('.').map(s => Number(s) || 0);
    const grsTarih = new Date(grsYil, grsAy - 1, grsGun);
    
    // Gün farkını hesapla (milisaniye cinsinden)
    const gunFarki = plnTarih.getTime() - grsTarih.getTime();
    const gunSayisi = Math.ceil(gunFarki / (1000 * 60 * 60 * 24));
    

    
    return Math.max(1, gunSayisi); // En az 1 gün
  } catch (error) {
    console.error('Konaklama süresi hesaplanırken hata:', error);
    return 1; // Hata durumunda varsayılan değer
  }
}

function fillFormFromSelectedData(newData: MusteriKonaklama) {
  if (!newData) return;
  isInitializing.value = true;
  veriYukleniyor.value = true;
  const mevcutOdaYatak = `${newData.KnklmOdaNo}-${newData.KnklmYtkNo}`;
  const mevcutOdaYatakObj = {
    value: mevcutOdaYatak,
    label: `${mevcutOdaYatak} (mevcut)`
  };
  bosOdalar.value = [mevcutOdaYatakObj];

  // 🔥 ODA DEĞİŞİKLİĞİ modunda kalan gün hesabı
  let hesaplananKonaklamaSuresi = calculateKonaklamaSuresi(newData.KnklmPlnTrh || '', newData.KnklmGrsTrh || '');
  if (donemYenileButtonLabel.value === 'ODA DEĞİŞİKLİ') {
    const today = new Date();
    const [plnGun = 0, plnAy = 0, plnYil = 0] = (newData.KnklmPlnTrh || '').split('.').map(s => Number(s) || 0);
    const plnTarih = new Date(plnYil, plnAy - 1, plnGun);
    const gunFarki = Math.max(1, Math.ceil((plnTarih.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    hesaplananKonaklamaSuresi = gunFarki;
  }


  // Konaklama süresi hesaplama (sadece Bugün Giren ve Devam Eden için)
  let readonlySure = false;
  if (
    (props.activeFilter === 'bugun-giren' || props.activeFilter === 'toplam-aktif') &&
    newData.KnklmPlnTrh && newData.KnklmGrsTrh
  ) {
    readonlySure = true;
  }

  formData.value = {
    MstrTCN: newData.MstrTCN || '',
    MstrAdi: newData.MstrAdi || '',
    MstrTelNo: newData.MstrTelNo || '',
    MstrHspTip: newData.MstrHspTip || '',
    MstrFirma: newData.MstrFirma || '',
    KnklmOdaTip: newData.KnklmOdaTip || '',
    OdaYatak: mevcutOdaYatakObj,
    KonaklamaSuresi: hesaplananKonaklamaSuresi, // 🔥 Kalan gün veya normal hesap
    KonaklamaTipi: newData.KonaklamaTipi || '',
    HesaplananBedel: Number(newData.HesaplananBedel) || 0,
    ToplamBedel: Number(newData.KnklmNfyt) || 0, // 🔥 Sadece initialize'da set edilir
    KnklmPlnTrh: newData.KnklmPlnTrh || '',
    KnklmNot: newData.KnklmNot || '',
    OdemeVadesi: (() => {
      const formatted = convertDateFormat(newData.OdemeVadesi || '');
      // Geçmiş tarih kontrolü uygula (notification gösterme)
      const validated = validateOdemeVadesi(formatted, false);
      return validated;
    })(), // 🔥 Tarih formatını düzelt ve geçmiş tarih kontrolü yap
    eskiKnklmPlnTrh: newData.KnklmPlnTrh,
    eskiOdaYatak: mevcutOdaYatak
  };
  konaklamaSuresiReadonly.value = readonlySure;
  setTimeout(() => { isInitializing.value = false; }, 100); // <-- Initialize bittiğinde false
}

watch(() => props.selectedData, async (newData) => {
  if (newData) {
    fillFormFromSelectedData(newData);
    await loadOdaTipleri();
    calculatePlannedDate();
    await onKonaklamaSuresiChanged();
    await onOdaYatakChange();
    ekNotlar.value = newData.KnklmNot || '';
    parseEkBilgilerFromNotes(ekNotlar.value);
    
    // 🔥 Ödeme vadesi öncelik sırası: 1. Frontend'den geçirilen değer, 2. Backend'den çekilen değer
    if (newData.OdemeVadesi && newData.OdemeVadesi.trim() !== '') {
      // Frontend'den ödeme vadesi değeri gelmiş (ağırlıklı ortalama)
      const formatted = convertDateFormat(newData.OdemeVadesi);
      formData.value.OdemeVadesi = validateOdemeVadesi(formatted, false);
      
    } else {
      // Frontend'den gelmemişse backend'den çekmeye çalış
      try {
        const vadeRes = await api.get(`dashboard/musteri-odeme-vadesi/${encodeURIComponent(newData.MstrTCN)}`);
        if (vadeRes.data.success && vadeRes.data.data && vadeRes.data.data.odemeVadesi) {
          const formatted = convertDateFormat(vadeRes.data.data.odemeVadesi);
          formData.value.OdemeVadesi = validateOdemeVadesi(formatted, false);
        } else {
          formData.value.OdemeVadesi = validateOdemeVadesi('', false);
        }
      } catch {
        formData.value.OdemeVadesi = validateOdemeVadesi('', false);
      }
    }
    
    setTimeout(() => { veriYukleniyor.value = false; }, 100);
    if (donemYenileButtonLabel.value === 'ODA DEĞİŞİKLİ') {
      konaklamaSuresiReadonly.value = true;
      formData.value.KnklmNot = '';
    } else {
      konaklamaSuresiReadonly.value = false;
    }
  }
}, { immediate: true });

watch(() => props.modelValue, async (yeni) => {
  if (yeni && props.selectedData) {
    fillFormFromSelectedData(props.selectedData);
    await loadOdaTipleri();
    calculatePlannedDate();
    await onKonaklamaSuresiChanged();
    await onOdaYatakChange();
    ekNotlar.value = props.selectedData.KnklmNot || '';
    parseEkBilgilerFromNotes(ekNotlar.value);
    
    // 🔥 Ödeme vadesi öncelik sırası: 1. Frontend'den geçirilen değer, 2. Backend'den çekilen değer
    if (props.selectedData.OdemeVadesi && props.selectedData.OdemeVadesi.trim() !== '') {
      // Frontend'den ödeme vadesi değeri gelmiş (ağırlıklı ortalama)
      const formatted = convertDateFormat(props.selectedData.OdemeVadesi);
      formData.value.OdemeVadesi = validateOdemeVadesi(formatted, false);
    } else {
      // Frontend'den gelmemişse backend'den çekmeye çalış
      try {
        const vadeRes = await api.get(`dashboard/musteri-odeme-vadesi/${encodeURIComponent(props.selectedData.MstrTCN)}`);
        if (vadeRes.data.success && vadeRes.data.data && vadeRes.data.data.odemeVadesi) {
          const formatted = convertDateFormat(vadeRes.data.data.odemeVadesi);
          formData.value.OdemeVadesi = validateOdemeVadesi(formatted, false);
        } else {
          formData.value.OdemeVadesi = validateOdemeVadesi('', false);
        }
      } catch {
        formData.value.OdemeVadesi = validateOdemeVadesi('', false);
      }
    }
    
    setTimeout(() => { veriYukleniyor.value = false; }, 100);
    if (donemYenileButtonLabel.value === 'ODA DEĞİŞİKLİ') {
      konaklamaSuresiReadonly.value = true;
      formData.value.KnklmNot = '';
    } else {
      konaklamaSuresiReadonly.value = false;
    }
  }
});

// Watch for KonaklamaSuresi changes to trigger calculations
watch(() => formData.value.KonaklamaSuresi, (newSure, oldSure) => {
  if (newSure !== oldSure && newSure >= 1) {
    void onKonaklamaSuresiChanged();
  }
});

// Watch for KnklmOdaTip changes to trigger calculations  
watch(() => formData.value.KnklmOdaTip, (newTip, oldTip) => {
  // Veri yükleme sırasında watcher'ı çalıştırma
  if (veriYukleniyor.value) {
    return
  }
  
  if (newTip !== oldTip) {
    void onOdaTipiChange();
  }
});

// Watch for OdaYatak changes to trigger calculations
watch(() => formData.value.OdaYatak, (newOdaYatak, oldOdaYatak) => {
  // Veri yükleme sırasında watcher'ı çalıştırma
  if (veriYukleniyor.value) {
    return
  }
  
  if (newOdaYatak !== oldOdaYatak && newOdaYatak) {
    
    // Oda değişikliği kontrolü ve not yönetimi
    const yeniOdaYatakValue = typeof newOdaYatak === 'string' ? newOdaYatak : newOdaYatak.value;
    const eskiOdaYatakValue = formData.value.eskiOdaYatak;
    
    // Mevcut notu al
    const mevcutNot = formData.value.KnklmNot || '';
    const odaDegisikligiRegex = /Oda Değişti, Eski Oda: [^-/]+/;
    
    // Eğer kullanıcı eski odayı seçerse (geri alma)
    if (yeniOdaYatakValue && eskiOdaYatakValue && 
        yeniOdaYatakValue.replace(' (mevcut)', '') === eskiOdaYatakValue) {
      
              // Oda değişikliği notunu sil
        if (odaDegisikligiRegex.test(mevcutNot)) {
          let yeniNot = mevcutNot.replace(odaDegisikligiRegex, '').trim();
          // Gereksiz ayırıcıları temizle
          yeniNot = yeniNot.replace(/\s*-\s*$/, '').replace(/^\s*-\s*/, '').replace(/\s*-\/- -\/- /, ' -/- ');
          formData.value.KnklmNot = yeniNot;
        }
    }
    // Eğer farklı bir oda seçerse (yeni değişiklik)
    else if (yeniOdaYatakValue && eskiOdaYatakValue && 
             yeniOdaYatakValue.replace(' (mevcut)', '') !== eskiOdaYatakValue) {
      
      // Önce mevcut oda değişikliği notunu sil (varsa)
      let temizlenmisMot = mevcutNot;
      if (odaDegisikligiRegex.test(mevcutNot)) {
        temizlenmisMot = mevcutNot.replace(odaDegisikligiRegex, '').trim();
        temizlenmisMot = temizlenmisMot.replace(/\s*-\s*$/, '').replace(/^\s*-\s*/, '').replace(/\s*-\/- -\/- /, ' -/- ');
      }
      
      // Yeni oda değişikliği notunu ekle
      const odaDegisikligiNotu = `Oda Değişti, Eski Oda: ${eskiOdaYatakValue}`;
      
      if (temizlenmisMot) {
        // Mevcut not varsa, sonuna ekle
        formData.value.KnklmNot = `${temizlenmisMot} -/- ${odaDegisikligiNotu}`;
      } else {
        // Mevcut not yoksa, direkt ekle
        formData.value.KnklmNot = odaDegisikligiNotu;
      }
    }
    
    void onOdaYatakChange();
  }
});

// Watch for KonaklamaTipi changes to update checkboxes (Kahvaltı otomatik seçimi için)
watch(() => formData.value.KonaklamaTipi, (newTip) => {
  if (newTip === 'GÜNLÜK') {
    // Günlük konaklamalarda kahvaltı otomatik seçili
    ekBilgiler.value.kahvaltiDahil = true;
  } else {
    // Haftalık ve aylık konaklamalarda kahvaltı seçilemez
    ekBilgiler.value.kahvaltiDahil = false;
  }
});



// Watch for ekBilgiler changes to update notes (Ek Bilgiler değişikliklerini izle)
watch(() => ekBilgiler.value, () => {
  // Veri yükleme sırasında watcher'ı çalıştırma
  if (veriYukleniyor.value) {
    return
  }
  
  // Ek Bilgiler değiştiğinde notları güncelle
  updateEkNotlar();
}, { deep: true });

// Watch for ToplamBedel changes to update notes (Bedel değişikliklerini izle)
watch([() => formData.value.HesaplananBedel, () => formData.value.ToplamBedel], () => {
  if (veriYukleniyor.value) {
    return
  }
  if (donemYenileButtonLabel.value === 'ODA DEĞİŞİKLİ' && ekNotKilitli.value) return;
  updateEkNotlar();
});

async function loadOdaTipleri() {
  try {
    const response = await api.get('/musteri/bos-oda-tipleri');
    if (response.data.success) {
      odaTipleri.value = response.data.data;
      // Formatted options'u oluştur - dropdown'da boş oda sayısı gösterimi için
      odaTipleriFormatted.value = response.data.data.map((item: {odaTipi: string, bosOdaSayisi: number}) => ({
        value: item.odaTipi,
        label: item.odaTipi, // Seçildiğinde sadece oda tipi görünsün
        bosOdaSayisi: item.bosOdaSayisi
      }));
      // Dönem yenileme özel durumu: Mevcut müşterinin oda tipi her zaman listede bulunmalı
      if (props.selectedData && props.selectedData.KnklmOdaTip) {
        const mevcutOdaTipi = props.selectedData.KnklmOdaTip;
        // Mevcut oda tipi listede var mı kontrol et
        const mevcutTipVarMi = odaTipleri.value.some(item => item.odaTipi === mevcutOdaTipi);
        if (!mevcutTipVarMi) {
          // Mevcut oda tipi listede yoksa listenin başına ekle (boş oda sayısı 0 ile)
          odaTipleri.value.unshift({odaTipi: mevcutOdaTipi, bosOdaSayisi: 0});
          odaTipleriFormatted.value.unshift({
            value: mevcutOdaTipi,
            label: mevcutOdaTipi, // Seçildiğinde sadece oda tipi görünsün
            bosOdaSayisi: 0
          });
        }
      }
      // Dönem yenileme formunda ilk yüklemede loadBosOdalar çalıştırma
      // Bu fonksiyon sadece oda tipi değiştirildiğinde çalışacak
    }
  } catch (error) {
    console.error('Boş oda tipleri yüklenemedi:', error);
  }
}

async function loadBosOdalar() {
  if (!formData.value.KnklmOdaTip) {
    bosOdalar.value = [];
    return;
  }
  
  try {
    const response = await api.get(`/musteri/bos-odalar/${encodeURIComponent(formData.value.KnklmOdaTip)}`);
    if (response.data.success) {
      bosOdalar.value = response.data.data;
      
      // Mevcut oda-yatak kombinasyonunu listeye ekle (dönem yenileme özel ayrıcalığı)
      if (props.selectedData) {
        const mevcutOdaYatak = `${props.selectedData.KnklmOdaNo}-${props.selectedData.KnklmYtkNo}`;
        const mevcutOdaTipi = props.selectedData.KnklmOdaTip;
        
        // Sadece aynı oda tipindeyse ve listede yoksa ekle
        if (mevcutOdaTipi === formData.value.KnklmOdaTip) {
          const mevcutVarMi = bosOdalar.value.some(oda => oda.value === mevcutOdaYatak);
          let mevcutOdaYatakOption: {value: string, label: string};
          
          if (!mevcutVarMi) {
            // Mevcut oda-yatak'ı listenin başına ekle
            mevcutOdaYatakOption = {
              value: mevcutOdaYatak,
              label: `${mevcutOdaYatak} (mevcut)`
            };
            bosOdalar.value.unshift(mevcutOdaYatakOption);
          } else {
            // Mevcut oda-yatak listede varsa, o referansı kullan
            mevcutOdaYatakOption = bosOdalar.value.find(oda => oda.value === mevcutOdaYatak)!;
          }
          
          // FormData'daki OdaYatak'ı doğru obje referansıyla güncelle
          if (formData.value.OdaYatak && 
              typeof formData.value.OdaYatak === 'object' && 
              formData.value.OdaYatak.value === mevcutOdaYatak) {
            formData.value.OdaYatak = mevcutOdaYatakOption;
          }
        }
      }
    } else {
      console.error('Boş odalar yüklenirken hata:', response.data);
      bosOdalar.value = [];
    }
  } catch (error) {
    console.error('Boş odalar yüklenemedi:', error);
    bosOdalar.value = [];
  }
}

async function onOdaTipiChange() {
  // Veri yükleme sırasında onchange handler'ı çalıştırma
  if (veriYukleniyor.value) {
    return
  }
  
  // Oda seçimini ve bedelleri temizle
  formData.value.OdaYatak = '';
  formData.value.HesaplananBedel = 0;
  formData.value.ToplamBedel = 0;
  odaTipFiyatlari.value = null;
  
  // Boş odaları yükle
  await loadBosOdalar();
  
  // Oda tipi varsa ve konaklama süresi 1'den büyükse hesaplama yap
  if (formData.value.KnklmOdaTip && formData.value.KonaklamaSuresi >= 1) {
    // Önce konaklama tipini hesapla (bu fiyat bilgilerini de çeker)
    await onKonaklamaSuresiChanged();
  }
}

async function onOdaYatakChange() {
  // Veri yükleme sırasında onchange handler'ı çalıştırma
  if (veriYukleniyor.value) {
    return
  }
  
  if (formData.value.KnklmOdaTip && formData.value.KonaklamaSuresi > 0) {
    await calculateBedel();
  }
}

async function onKonaklamaSuresiChanged() {
  const sure = formData.value.KonaklamaSuresi;
  
  // Konaklama süresi kontrolü
  if (sure < 1 || sure > 30) {
    formData.value.KonaklamaSuresi = 1;
    formData.value.KonaklamaTipi = 'GÜNLÜK';
    return;
  }
  
  // Oda tipi fiyatları yoksa önce getir
  if (!odaTipFiyatlari.value && formData.value.KnklmOdaTip) {
    try {
      const response = await api.get(`/musteri/oda-tip-fiyatlari/${encodeURIComponent(formData.value.KnklmOdaTip)}`);
      if (response.data.success && response.data.data) {
        odaTipFiyatlari.value = response.data.data;
      }
    } catch (error) {
      console.error('Fiyat bilgileri alınamadı:', error);
      formData.value.KonaklamaTipi = 'GÜNLÜK';
      return;
    }
  }
  
  // Eğer fiyat bilgileri yoksa varsayılan
  if (!odaTipFiyatlari.value) {
    formData.value.KonaklamaTipi = 'GÜNLÜK';
    return;
  }
  
  // Fiyat bilgilerini al
  const gunlukFiyat = Number(odaTipFiyatlari.value.OdLfytGun) || 0;
  const haftalikFiyat = Number(odaTipFiyatlari.value.OdLfytHft) || 0;
  const aylikFiyat = Number(odaTipFiyatlari.value.OdLfytAyl) || 0;
  

  
  // Yeni formulasyon ile konaklama tipini hesapla
  let hesaplananTip = '';
  let hesaplananTutar = 0;
  
  if (sure <= 7 && sure * gunlukFiyat <= haftalikFiyat) {
    hesaplananTip = 'GÜNLÜK';
    hesaplananTutar = sure * gunlukFiyat;
  } else if (sure > 7 && sure <= 14 && (sure - 7) * gunlukFiyat + haftalikFiyat <= 2 * haftalikFiyat) {
    hesaplananTip = '1 HAFTALIK';
    hesaplananTutar = (sure - 7) * gunlukFiyat + haftalikFiyat;
  } else if (sure > 14 && sure <= 21 && (sure - 14) * gunlukFiyat + 2 * haftalikFiyat <= 3 * haftalikFiyat) {
    hesaplananTip = '2 HAFTALIK';
    hesaplananTutar = (sure - 14) * gunlukFiyat + 2 * haftalikFiyat;
  } else if (sure > 21 && (sure - 21) * gunlukFiyat + 3 * haftalikFiyat <= aylikFiyat) {
    hesaplananTip = '3 HAFTALIK';
    hesaplananTutar = (sure - 21) * gunlukFiyat + 3 * haftalikFiyat;
  } else if (sure <= 7) {
    hesaplananTip = '1 HAFTALIK';
    hesaplananTutar = haftalikFiyat;
  } else if (sure <= 14) {
    hesaplananTip = '2 HAFTALIK';
    hesaplananTutar = 2 * haftalikFiyat;
  } else if (sure <= 21) {
    hesaplananTip = '3 HAFTALIK';
    hesaplananTutar = 3 * haftalikFiyat;
  } else {
    hesaplananTip = 'AYLIK';
    hesaplananTutar = aylikFiyat;
  }
  
  // Aylık fiyat kontrolü - hesaplanan tutar aylık fiyatı geçerse aylık yap
  if (hesaplananTutar > aylikFiyat) {
    formData.value.KonaklamaTipi = 'AYLIK';
  } else {
    formData.value.KonaklamaTipi = hesaplananTip;
  }
  
  calculatePlannedDate();
  await calculateBedel();
  updateEkNotlar(); // Konaklama süresi değiştiğinde notları güncelle
}

function onToplamBedelChanged(yeniBedel: string | number | null) {
  if (typeof yeniBedel === 'number' && yeniBedel >= 0) {
    formData.value.ToplamBedel = yeniBedel;
  } else if (typeof yeniBedel === 'string' && !isNaN(Number(yeniBedel))) {
    formData.value.ToplamBedel = Number(yeniBedel);
  } else {
    formData.value.ToplamBedel = 0;
  }
}

// Fiyat hesaplama fonksiyonu - musteri-islem.vue ile aynı mantık
async function calculateBedel() {
  
  if (!formData.value.KnklmOdaTip || !formData.value.KonaklamaSuresi || !formData.value.KonaklamaTipi) {
    formData.value.HesaplananBedel = 0;
    if (isInitializing.value) {
      formData.value.ToplamBedel = 0;
    }
    return;
  }

  try {
    // Oda tip fiyatlarını getir
    const response = await api.get(`/musteri/oda-tip-fiyatlari/${encodeURIComponent(formData.value.KnklmOdaTip)}`);
    if (response.data.success && response.data.data) {
      odaTipFiyatlari.value = response.data.data;
      
      let hesaplananFiyat = 0;
      const sure = formData.value.KonaklamaSuresi;
      const tip = formData.value.KonaklamaTipi;
      
      // Fiyat bilgilerini al
      const gunlukFiyat = Number(odaTipFiyatlari.value?.OdLfytGun) || 0;
      const haftalikFiyat = Number(odaTipFiyatlari.value?.OdLfytHft) || 0;
      const aylikFiyat = Number(odaTipFiyatlari.value?.OdLfytAyl) || 0;
      
      if (tip === 'GÜNLÜK') {
        hesaplananFiyat = gunlukFiyat * sure;
      } else if (tip === '1 HAFTALIK') {
        if (sure > 7) {
          hesaplananFiyat = (sure - 7) * gunlukFiyat + haftalikFiyat;
        } else {
          hesaplananFiyat = haftalikFiyat;
        }
      } else if (tip === '2 HAFTALIK') {
        if (sure > 14) {
          hesaplananFiyat = (sure - 14) * gunlukFiyat + 2 * haftalikFiyat;
        } else {
          hesaplananFiyat = 2 * haftalikFiyat;
        }
      } else if (tip === '3 HAFTALIK') {
        if (sure > 21) {
          hesaplananFiyat = (sure - 21) * gunlukFiyat + 3 * haftalikFiyat;
        } else {
          hesaplananFiyat = 3 * haftalikFiyat;
        }
      } else if (tip === 'AYLIK') {
        hesaplananFiyat = aylikFiyat;
      }
      // Aylık fiyat kontrolü - hesaplanan fiyat aylık fiyatı geçerse aylık fiyat uygula
      if (hesaplananFiyat > aylikFiyat) {
        hesaplananFiyat = aylikFiyat;
      }
      // 🔽 Onlar basamağına aşağı yuvarla
      hesaplananFiyat = Math.floor(hesaplananFiyat / 10) * 10;
      formData.value.HesaplananBedel = hesaplananFiyat;
      if (!isInitializing.value) {
        formData.value.ToplamBedel = hesaplananFiyat;
      }
      // Oda değişikliği sırasında ToplamBedel güncellenmez!
    }
  } catch (error) {
    console.error('Fiyat hesaplama hatası:', error);
    formData.value.HesaplananBedel = 0;
    if (isInitializing.value) {
      formData.value.ToplamBedel = 0;
    }
  }
}

function calculatePlannedDate() {
  if (!formData.value.eskiKnklmPlnTrh) return;
  
  const parts = formData.value.eskiKnklmPlnTrh.split('.');
  if (parts.length !== 3) return;
  
  const baseDate = new Date(
    parseInt(parts[2] || '0'),
    parseInt(parts[1] || '0') - 1,
    parseInt(parts[0] || '0')
  );
  
  const newDate = new Date(baseDate);
  newDate.setDate(newDate.getDate() + formData.value.KonaklamaSuresi);
  
  const day = String(newDate.getDate()).padStart(2, '0');
  const month = String(newDate.getMonth() + 1).padStart(2, '0');
  const year = newDate.getFullYear();
  
  formData.value.KnklmPlnTrh = `${day}.${month}.${year}`;
}

// Ek Bilgiler fonksiyonları
function openEkBilgilerDialog() {
  // Dialog açılmadan önce mevcut durumu kaydet
  originalEkBilgiler.value = {
    kahvaltiDahil: ekBilgiler.value.kahvaltiDahil,
    havluVerildi: ekBilgiler.value.havluVerildi,
    prizVerildi: ekBilgiler.value.prizVerildi
  };
  showEkBilgilerDialog.value = true;
}

function cancelEkBilgiler() {
  // İptal edildiğinde orijinal duruma geri dön
  ekBilgiler.value = {
    kahvaltiDahil: originalEkBilgiler.value.kahvaltiDahil,
    havluVerildi: originalEkBilgiler.value.havluVerildi,
    prizVerildi: originalEkBilgiler.value.prizVerildi
  };
  showEkBilgilerDialog.value = false;
}

function saveEkBilgiler() {
  // Değişiklikleri kabul et ve dialog'u kapat
  showEkBilgilerDialog.value = false;
}

// Ek notları otomatik güncelle - musteri-islem.vue ile aynı mantık
function updateEkNotlar() {
  if (ekNotKilitli.value) return; // Kullanıcı elle yazdıysa otomatik güncelleme yapma
  const notlar = [];
  
  // 0. Dönem yenileme durumu (en başta)
  notlar.push('Dönem Yenileme: ');
  
  // 1. Oda değişikliği bilgisi (dönem yenilemeden hemen sonra sabit konum)
  const mevcutNot = formData.value.KnklmNot || '';
  const odaDegisikligiMatch = mevcutNot.match(/Oda Değişti, Eski Oda: [^-/]+/);
  
  if (odaDegisikligiMatch) {
    const yeniOdaYatakValue = typeof formData.value.OdaYatak === 'string' ? 
      formData.value.OdaYatak : 
      (formData.value.OdaYatak && typeof formData.value.OdaYatak === 'object' ? formData.value.OdaYatak.value : '');
    const eskiOdaYatakValue = formData.value.eskiOdaYatak;
    
    // Sadece hala farklı bir oda seçiliyse notu ekle
    if (yeniOdaYatakValue && eskiOdaYatakValue && 
        yeniOdaYatakValue.replace(' (mevcut)', '') !== eskiOdaYatakValue) {
      notlar.push(odaDegisikligiMatch[0]);
    }
  }
  
  // 2. İskonto/Artış hesabı
  if (formData.value.HesaplananBedel > 0 && formData.value.ToplamBedel > 0) {
    const hesaplanan = formData.value.HesaplananBedel;
    const toplam = formData.value.ToplamBedel;
    
    if (toplam < hesaplanan) {
      // İskonto yapıldı
      const iskontoOrani = Math.round(((hesaplanan - toplam) / hesaplanan) * 100);
      notlar.push(`İskonto Yapıldı: %${iskontoOrani}`);
    } else if (toplam > hesaplanan) {
      // Artış yapıldı
      const artisOrani = Math.round(((toplam - hesaplanan) / hesaplanan) * 100);
      notlar.push(`Artış Yapıldı: %${artisOrani}`);
    }
  }
  
  // 3. Kahvaltı durumu
  if (formData.value.KonaklamaTipi === 'GÜNLÜK' && !ekBilgiler.value.kahvaltiDahil) {
    notlar.push('Kahvaltısız');
  }
  
  // 4. Ek Bilgiler
  if (ekBilgiler.value.havluVerildi) {
    notlar.push('Havlu Verildi');
  }
  
  if (ekBilgiler.value.prizVerildi) {
    notlar.push('Priz Verildi');
  }
  

  
  // Dönem yenileme için notları direkt ayarla
  const otomatikNotlar = notlar.length > 0 ? notlar.join(' -/- ') : 'Dönem Yenileme: ';
  
  formData.value.KnklmNot = otomatikNotlar;
  ekNotlar.value = otomatikNotlar;
}


// Notlardan Ek Bilgileri parse et ve checkbox'ları ayarla
function parseEkBilgilerFromNotes(notlar: string) {
  // Ek Bilgileri sıfırla
  ekBilgiler.value = {
    kahvaltiDahil: formData.value.KonaklamaTipi === 'GÜNLÜK',
    havluVerildi: false,
    prizVerildi: false
  };
  
  // Notlardan Ek Bilgileri çıkar
  if (notlar.includes('Havlu Verildi')) {
    ekBilgiler.value.havluVerildi = true;
  }
  
  if (notlar.includes('Priz Verildi')) {
    ekBilgiler.value.prizVerildi = true;
  }
  
  if (notlar.includes('Kahvaltısız')) {
    ekBilgiler.value.kahvaltiDahil = false;
  } else if (formData.value.KonaklamaTipi === 'GÜNLÜK') {
    ekBilgiler.value.kahvaltiDahil = true;
  }
}

// Oda değişikliği onay dialogu için reactive değişkenler
const showOdaDegisikligiDialog = ref(false);
const odaDegisikligiDialogData = ref({
  gunlukBedel: 0,
  kalanGun: 0,
  giderBedel: 0,
  yeniOdaTipiGunlukBedel: 0,
  gelirBedel: 0,
  tahsilEdilecekBedel: 0,
  ekNotlar: ''
});

// 🔥 2 basamaklı finansal yuvarlama fonksiyonu
function roundTo2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

// En üste ekle:
const eskiOdaNetFiyat = ref(0);

function hesaplaVeGosterOdaDegisikligiDialog() {
  // Dialog açılmadan hemen önce eski oda net fiyatını, her zaman eski kayıttan al
  eskiOdaNetFiyat.value = Number(props.selectedData?.KnklmNfyt) || 0;
  // 🔥 KONAKLAMANIN DEVAM EDEN GÜNLERİNDE ODA DEĞİŞİKLİĞİ HESAPLAMA
  // Bu fonksiyon, müşteri zaten bir süre konakladıktan sonra oda değişikliği yapıldığında çalışır
  // Geriye dönük hesaplama gerekli olduğu için detaylı analiz yapılır
  
  // 1. Eski Günlük Konaklama Bedeli (Mevcut odanın günlük bedeli)
  const toplamBedel = eskiOdaNetFiyat.value; // 🔥 her zaman eski oda net fiyatı
  const konaklamaSuresi = calculateKonaklamaSuresi(props.selectedData?.KnklmPlnTrh || '', props.selectedData?.KnklmGrsTrh || '');
  const gunlukBedel = konaklamaSuresi > 0 ? Math.floor(toplamBedel / konaklamaSuresi) : 0; // 🔥 küsuratsız böl

  // 2. Çıkışa Kalan Gün (Planlanan çıkış tarihine kalan gün sayısı)
  const plnCikis = props.selectedData?.KnklmPlnTrh;
  const bugun = new Date();
  let kalanGun = 0;
  if (plnCikis) {
    const [gun = 0, ay = 0, yil = 0] = plnCikis.split('.').map(s => Number(s) || 0);
    const cikisTarihi = new Date(yil, ay - 1, gun);
    kalanGun = Math.max(0, Math.ceil((cikisTarihi.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24)));
  }

  // 3. GİDER Yazılacak Bedel (Mevcut odadan çıkış için yazılacak gider)
  let giderBedel = gunlukBedel * kalanGun;
  giderBedel = roundTo2(giderBedel);

  // 4. Yeni Oda Tipi Günlük Bedel (formData.ToplamBedel / konaklama süresi)
  let yeniOdaTipiGunlukBedel = 0;
  let gelirBedel = 0;
  let tahsilEdilecekBedel = 0;
  if (konaklamaSuresi > 0) {
    yeniOdaTipiGunlukBedel = Math.floor(Number(formData.value.ToplamBedel) / formData.value.KonaklamaSuresi);
    yeniOdaTipiGunlukBedel = roundTo2(yeniOdaTipiGunlukBedel);
    gelirBedel = yeniOdaTipiGunlukBedel * kalanGun;
    gelirBedel = roundTo2(gelirBedel);
    tahsilEdilecekBedel = gelirBedel - giderBedel;
    tahsilEdilecekBedel = roundTo2(tahsilEdilecekBedel);
  }

  // formData.value.HesaplananBedel = tahsilEdilecekBedelYuvarlanmis; // ARTIK YAZILMIYOR
  // formData.value.ToplamBedel = formData.value.HesaplananBedel; // ARTIK YAZILMIYOR

  // 🔥 ODA DEĞİŞİMİ VE BEDEL FARKI NOTU OLUŞTURMA - Dialog yüklenirken yapılır
  const eski = props.selectedData ? `${props.selectedData.KnklmOdaNo} - ${props.selectedData.KnklmYtkNo}` : '';
  let yeni = '';
  if (typeof formData.value.OdaYatak === 'object' && formData.value.OdaYatak) {
    yeni = String(formData.value.OdaYatak.value).split('-').join(' - ');
  } else if (typeof formData.value.OdaYatak === 'string') {
    yeni = formData.value.OdaYatak.split('-').join(' - ');
  }
  
  const mevcutNot = formData.value.KnklmNot || '';
  const odaDegisimiNotu = `ODA DEĞİŞİMİ: eski ${eski} ---> yeni ${yeni}`;
  let bedelNotu = '';
  if (tahsilEdilecekBedel > 0) {
    bedelNotu = `ODA DEĞİŞİMİ - TAHSİL EDİLECEK BEDEL: ${tahsilEdilecekBedel.toFixed(2)} TL`;
  } else if (tahsilEdilecekBedel < 0) {
    bedelNotu = `ODA DEĞİŞİMİ - İADE EDİLECEK BEDEL: ${Math.abs(tahsilEdilecekBedel).toFixed(2)} TL`;
  }
  
  let yeniNot = odaDegisimiNotu;
  if (bedelNotu) {
    yeniNot += ' -/- ' + bedelNotu;
  }
  if (mevcutNot && !mevcutNot.includes(odaDegisimiNotu)) {
    yeniNot = mevcutNot + ' -/- ' + yeniNot;
  }
  
  // --- TEKRAR EDEN "ODA DEĞİŞİMİ" İFADELERİNİ TEMİZLE ---
  // Sadece baştaki "ODA DEĞİŞİMİ" ifadesi kalsın, diğerlerini sil
  yeniNot = yeniNot.replace(/( -\/- )?ODA DEĞİŞİMİ[^-]*/g, (match, p1, offset) => {
    // Sadece ilk bulunuşu bırak, diğerlerini sil
    return offset === 0 ? match : '';
  });
  yeniNot = yeniNot.replace(/( -\/- )+/g, ' -/- '); // Çoklu ayraçları sadeleştir
  yeniNot = yeniNot.replace(/^ -\/- /, ''); // Baştaki ayraçları sil
  yeniNot = yeniNot.trim();

  // Notları form ve ekNotlar'a kaydet
  formData.value.KnklmNot = yeniNot;
  ekNotlar.value = formData.value.KnklmNot;

  odaDegisikligiDialogData.value = {
    gunlukBedel,
    kalanGun,
    giderBedel,
    yeniOdaTipiGunlukBedel,
    gelirBedel,
    tahsilEdilecekBedel,
    ekNotlar: yeniNot // Dialog'da gösterilecek not
  };
  showOdaDegisikligiDialog.value = true;
}

const ekNotKilitli = ref(false);

async function onOdaDegisikligiOnayla() {
  
  try {
    loading.value = true;
    
    // 🔒 Transaction güvenliği bilgisi
    $q.notify({
      message: 'Oda değişikliği onaylanıyor... Tüm işlemler güvenli transaction ile yapılıyor.',
      color: 'info',
      position: 'top',
      timeout: 2000
    });

    // Oda-yatak bilgilerini parse et
    const yeniOdaYatakValue = typeof formData.value.OdaYatak === 'string' ? 
      formData.value.OdaYatak : 
      (formData.value.OdaYatak && typeof formData.value.OdaYatak === 'object' ? formData.value.OdaYatak.value : '');
    
    const [yeniOdaNo, yeniYatakNo] = yeniOdaYatakValue.replace(' (mevcut)', '').split('-');
    const [eskiOdaNo, eskiYatakNo] = (props.selectedData?.KnklmOdaNo + '-' + props.selectedData?.KnklmYtkNo).split('-');

    // Backend'e gönderilecek veri
    const requestData = {
      tcNo: props.selectedData?.MstrTCN || '',
      eskiOdaNo: eskiOdaNo,
      eskiYatakNo: eskiYatakNo,
      yeniOdaNo: yeniOdaNo,
      yeniYatakNo: yeniYatakNo,
      yeniOdaTip: formData.value.KnklmOdaTip,
      yeniOdaYatak: yeniOdaYatakValue,
      konaklamaSuresi: odaDegisikligiDialogData.value.kalanGun, // dialogdan kalan gün
      konaklamaTipi: formData.value.KonaklamaTipi,
      hesaplananBedel: formData.value.HesaplananBedel,
      toplamBedel: formData.value.ToplamBedel,
      giderBedel: odaDegisikligiDialogData.value.giderBedel,
      gelirBedel: odaDegisikligiDialogData.value.gelirBedel,
      eskiPlnTrh: props.selectedData?.KnklmPlnTrh || '',
      ekNotlar: formData.value.KnklmNot
    };

    const response = await api.post('/musteri/oda-degisikligi-onayla', requestData);

    if (response.data.success) {
      // Başarılı işlem mesajı
      $q.notify({
        message: '✅ ' + response.data.message,
        color: 'positive',
        position: 'top',
        timeout: 3000,
        actions: [
          {
            icon: 'close',
            color: 'white',
            handler: () => { /* dismiss */ }
          }
        ]
      });
      
      // 🔥 ODA DEĞİŞİKLİĞİ BAŞARILI - TÜM İŞLEMLERİ TAMAMLA
      setTimeout(() => {
        // 1. Dialog'u kapat
        showOdaDegisikligiDialog.value = false;
        
        // 2. Ana modal'ı kapat
        closeModal();
        
        // 3. Kartlı işlem sayfasını güncelle
        emit('refresh');
        
        // 4. Başarı sinyali gönder
        emit('success');
        
        // 🔥 MÜŞTERİ BİLGİSİNİ GLOBAL STATE'E AKTAR VE TAHSİLAT MODALINI AÇ
        setTimeout(() => {
          // Müşteri bilgisini global state'e aktar
          if (props.selectedData) {
            window.kartliIslemSelectedNormalMusteri = {
              ...props.selectedData,
              MstrAdi: props.selectedData.MstrAdi || ''
            };
          }
          // 🔥 OTOMATİK MODAL AÇMA FLAG'İNİ SET ET
          (window as Window & { kartliIslemAutoOpenModal?: boolean }).kartliIslemAutoOpenModal = true;
          window.dispatchEvent(new Event('showOdemeIslemModal'));
        }, 500);
        
      }, 3000);
      
    } else {
      throw new Error(response.data.message || 'Oda değişikliği onaylama işlemi başarısız');
    }

  } catch (error: unknown) {
    console.error('onOdaDegisikligiOnayla hatası:', error);
    
    let errorMessage = 'Oda değişikliği onaylanırken beklenmeyen bir hata oluştu';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    $q.notify({
      message: `❌ ${errorMessage}\n\n🔒 Veri güvenliği için hiçbir değişiklik kaydedilmedi.`,
      color: 'negative',
      position: 'top',
      timeout: 5000,
      multiLine: true
    });
  } finally {
    loading.value = false;
  }
}

// 🔥 KONAKLAMA SÜRESİ 1 GÜNLÜK ODA DEĞİŞİKLİĞİ DİREKT İŞLEM
// Bu fonksiyon, oda değişikliği konaklamanın başladığı gün yapıldığında çalışır
// Geriye dönük hesaplama gerekmediği için basit ve hızlı işlem yapılır
async function direktOdaDegisikligiYap() {
  try {
    loading.value = true;
    
    // 🔒 Transaction güvenliği bilgisi
    $q.notify({
      message: 'Oda değişikliği işlemi güvenli transaction ile başlatılıyor...',
      color: 'info',
      position: 'top',
      timeout: 2000
    });

    // Hesaplama yapılmışsa onaylanmış fiyat kullan, yoksa 0
    const hesaplananBedel = hesaplamaDetay.value?.onaylanmisFiyat || 0;
    
    // Oda-yatak bilgisini parse et
    const odaYatakParsed = parseOdaYatak(formData.value.OdaYatak);
    
    // Notları birleştir ve "Dönem Yenileme: " prefix'ini kaldır
    let kombinedNot = formData.value.KnklmNot || '';
    
    // Eğer not "Dönem Yenileme: " ile başlıyorsa, bu kısmı kaldır
    if (kombinedNot.startsWith('Dönem Yenileme: ')) {
      kombinedNot = kombinedNot.substring('Dönem Yenileme: '.length);
    }
    
    // Ücret farkı bilgisini not'a ekle
    if (hesaplananBedel !== 0) {
      const farkAciklama = hesaplananBedel > 0 
        ? `Tahsil edilecek: ${hesaplananBedel} TL` 
        : `İade edilecek: ${Math.abs(hesaplananBedel)} TL`;
      kombinedNot = kombinedNot ? `${kombinedNot} - ${farkAciklama}` : farkAciklama;
    }
    
    const requestPayload = {
      tcNo: props.selectedData?.MstrTCN || '',
      eskiOdaNo: odaYatakParsed.eskiOdaNo,
      eskiYatakNo: odaYatakParsed.eskiYatakNo,
      yeniOdaTip: formData.value.KnklmOdaTip,
      yeniOdaNo: odaYatakParsed.yeniOdaNo,
      yeniYatakNo: odaYatakParsed.yeniYatakNo,
      yeniOdaYatak: formData.value.OdaYatak,
      konaklamaNot: formData.value.KnklmNot || '', // Modal formundaki "Ek Notlar" alanı
      toplamBedel: formData.value.ToplamBedel || 0, // Modal formundaki "Toplam Konaklama Bedeli" alanı
      hesaplananBedel: hesaplananBedel // Ücret farkı hesaplaması için
    };

    // 🔥 Konaklamanın ilk günü kontrolü - Endpoint seçimi
    const girisTarihi = props.selectedData?.KnklmGrsTrh;
    let isIlkGun = false;
    
    if (girisTarihi) {
      const [gun = 0, ay = 0, yil = 0] = girisTarihi.split('.').map(s => Number(s) || 0);
      const girisTarihiObj = new Date(yil, ay - 1, gun);
      
      const bugunGun = new Date().getDate();
      const bugunAy = new Date().getMonth() + 1;
      const bugunYil = new Date().getFullYear();
      
      const girisGun = girisTarihiObj.getDate();
      const girisAy = girisTarihiObj.getMonth() + 1;
      const girisYil = girisTarihiObj.getFullYear();
      
      isIlkGun = (bugunGun === girisGun && bugunAy === girisAy && bugunYil === girisYil);
    }
    
    // Endpoint seçimi - İlk gün ise özel endpoint, değilse normal endpoint
    const endpoint = isIlkGun 
      ? '/musteri/direkt-oda-degisikligi-konaklama-suresi-1'
      : '/musteri/direkt-oda-degisikligi';
    
    const response = await api.post(endpoint, requestPayload);

    if (response.data.success) {
      $q.notify({
        message: '✅ Oda değişikliği başarıyla tamamlandı! Tüm işlemler güvenli bir şekilde kaydedildi.',
        color: 'positive',
        position: 'top',
        timeout: 3000
      });
      
      // Emit success event to parent
      emit('success');
      onDialogHide();
      
      // 🔥 MÜŞTERİ BİLGİSİNİ GLOBAL STATE'E AKTAR VE TAHSİLAT MODALINI AÇ
      setTimeout(() => {
        // Müşteri bilgisini global state'e aktar
        if (props.selectedData) {
          window.kartliIslemSelectedNormalMusteri = {
            ...props.selectedData,
            MstrAdi: props.selectedData.MstrAdi || ''
          };
        }
        // 🔥 OTOMATİK MODAL AÇMA FLAG'İNİ SET ET
        (window as Window & { kartliIslemAutoOpenModal?: boolean }).kartliIslemAutoOpenModal = true;
        window.dispatchEvent(new Event('showOdemeIslemModal'));
      }, 500);
    } else {
      throw new Error(response.data.message || 'Oda değişikliği işlemi başarısız');
    }

  } catch (error) {
    console.error('direktOdaDegisikligiYap hatası:', error);
    
    let errorMessage = 'Oda değişikliği sırasında beklenmeyen bir hata oluştu';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    $q.notify({
      message: `❌ ${errorMessage}\n\n🔒 Veri güvenliği için hiçbir değişiklik kaydedilmedi.`,
      color: 'negative',
      position: 'top',
      timeout: 5000,
      multiLine: true
    });
  } finally {
    loading.value = false;
  }
}

function setEkNotlarPrefixFromKnklmNot() {
  const knklmNot = props.selectedData?.KnklmNot || '';
  let prefix = '';
  if (knklmNot.startsWith('%- Yeni Giriş: ')) {
    prefix = '%- Yeni Giriş: ';
  } else if (knklmNot.startsWith('%- Yeni Müşteri: ')) {
    prefix = '%- Yeni Müşteri: ';
  } else if (knklmNot.startsWith('Dönem Yenileme: ')) {
    prefix = 'Dönem Yenileme: ';
  }
  // Sadece prefix'i ekle, devamına eski notları ekle
  if (prefix) {
    if (!ekNotlar.value.startsWith(prefix)) {
      ekNotlar.value = prefix + (ekNotlar.value.replace(/^(- Yeni Giriş: | - Yeni Müşteri: |Dönem Yenileme: )/, ''));
    }
    if (!formData.value.KnklmNot.startsWith(prefix)) {
      formData.value.KnklmNot = prefix + (formData.value.KnklmNot.replace(/^(- Yeni Giriş: | - Yeni Müşteri: |Dönem Yenileme: )/, ''));
    }
  }
}

onMounted(() => {
  setEkNotlarPrefixFromKnklmNot();
});

// --- 1. isInitializing flag'i ekle ---
const isInitializing = ref(false);

watch(() => formData.value.ToplamBedel, () => {
  // Watch for ToplamBedel changes
});

watch(() => formData.value.HesaplananBedel, () => {
  // Watch for HesaplananBedel changes
});

// Yeni oda tipi günlük bedel: ana formdaki HesaplananBedel / KonaklamaSuresi (kalan gün)
//let yeniGunlukBedel = 0;
//if (formData.value.KonaklamaSuresi > 0) {
//  yeniGunlukBedel = Math.round(Number(formData.value.HesaplananBedel) / Number(formData.value.KonaklamaSuresi));
//}
//odaDegisikligiDialogData.value.yeniOdaTipiGunlukBedel = yeniGunlukBedel;

// Erken çıkış hesaplama dialogu için reactive değişkenler
defineExpose();
const showErkenCikisDialog = ref(false);
const erkenCikisDialogData = ref({
  gunlukBedel: 0,
  kalanGun: 0,
  giderBedel: 0,
  iadeBedel: 0,
  ekNotlar: ''
});

function erkenCikisHesaplamaDialoguAc() {
  // Oda değişikliği dialogundaki gibi hesaplamalar yapılacak
  // 1. Eski Günlük Konaklama Bedeli (Mevcut odanın günlük bedeli)
  const toplamBedel = Number(props.selectedData?.KnklmNfyt) || 0;
  const girisTarihiStr = props.selectedData?.KnklmGrsTrh || '';
  const plnCikisStr = props.selectedData?.KnklmPlnTrh || '';
  const bugun = new Date();
  // Konaklama süresi (giriş-çıkış arası gün)
  const konaklamaSuresi = calculateKonaklamaSuresi(plnCikisStr, girisTarihiStr);
  const gunlukBedel = konaklamaSuresi > 0 ? Math.floor(toplamBedel / konaklamaSuresi) : 0;
  // Çıkışa kalan gün
  let kalanGun = 0;
  if (plnCikisStr) {
    const [gun = 0, ay = 0, yil = 0] = plnCikisStr.split('.').map(s => Number(s) || 0);
    const cikisTarihi = new Date(yil, ay - 1, gun);
    kalanGun = Math.max(0, Math.ceil((cikisTarihi.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24)));
  }
  // Gider yazılacak bedel = kalan gün * günlük bedel
  const giderBedel = kalanGun * gunlukBedel;
  // İade edilecek bedel = gider yazılacak bedel
  const iadeBedel = giderBedel;
  // Ek notlar
  const ekNotlarStr = `ERKEN ÇIKIŞ - İADE EDİLECEK BEDEL: ${iadeBedel} TL`;
  // Dialog datasını doldur
  erkenCikisDialogData.value = {
    gunlukBedel,
    kalanGun,
    giderBedel,
    iadeBedel,
    ekNotlar: ekNotlarStr
  };
  // Ek Notlar'ı ana formda da göster
  ekNotlar.value = ekNotlarStr;
  formData.value.KnklmNot = ekNotlarStr;
  // Dialogu aç
  showErkenCikisDialog.value = true;
}

// Erken çıkış hesaplama dialogunda onay fonksiyonu
function onErkenCikisDialogOnayla() {
  showErkenCikisDialog.value = false;
  // Dialogdan gelen tutar ve not ile işlemleri başlat
  void erkenCikisIslemleriYap({
    giderTutar: erkenCikisDialogData.value.giderBedel,
    hesaplananEkNot: erkenCikisDialogData.value.ekNotlar,
    dialogdanMi: true
  });
}

// Yeni method ekle:
function onErkenCikisIadesizCikis() {
  // EVET kodunu çalıştır ama gider kaydı yapılmasın
  void erkenCikisIslemleriYap({
    giderTutar: Number(erkenCikisDialogData.value.giderBedel) || 0,
    hesaplananEkNot: 'ERKEN ÇIKIŞ FARKI',
    dialogdanMi: true,
    giderKaydiOlmasin: true // backend'e bu parametreyi gönder
  });
  showErkenCikisDialog.value = false;
}

// erkenCikisIslemleriYap fonksiyonunda requestData'ya giderKaydiOlmasin parametresi ekle:
async function erkenCikisIslemleriYap({ giderTutar, hesaplananEkNot, dialogdanMi, giderKaydiOlmasin = false }: { giderTutar: number, hesaplananEkNot: string, dialogdanMi: boolean, giderKaydiOlmasin?: boolean }) {
  saving.value = true;
  try {
    const requestData = {
      tcNo: props.selectedData?.MstrTCN,
      odaYatak: {
        label: `Oda: ${props.selectedData?.KnklmOdaNo} - Yatak: ${props.selectedData?.KnklmYtkNo}`,
        value: `${props.selectedData?.KnklmOdaNo}-${props.selectedData?.KnklmYtkNo}`
      },
      islemTarihi: new Date().toISOString(),
      giderTutar,
      ekNot: hesaplananEkNot,
      dialogdanMi,
      giderKaydiOlmasin // yeni parametre
    };
    const response = await api.post('/musteri/erken-cikis-yap', requestData);
    if (response.data.success) {
      Notify.create({
        type: 'positive',
        message: response.data.message || 'Erken çıkış işlemi başarıyla tamamlandı!',
        position: 'top',
        timeout: 3000,
        actions: [{ icon: 'close', color: 'white', handler: () => { /* dismiss */ } }]
      });
      
      // 🔥 STATS GÜNCELLEME EVENT'İ GÖNDER
      window.dispatchEvent(new Event('statsNeedsUpdate'));
      
      setTimeout(() => {
        emit('refresh');
        closeModal();
        
        // 🔥 MÜŞTERİ BİLGİSİNİ GLOBAL STATE'E AKTAR VE TAHSİLAT MODALINI AÇ
        setTimeout(() => {
          // Müşteri bilgisini global state'e aktar
          if (props.selectedData) {
            console.log('🔥 direktOdaDegisikligiYap - props.selectedData:', props.selectedData)
            console.log('🔥 direktOdaDegisikligiYap - MstrAdi:', props.selectedData.MstrAdi)
            window.kartliIslemSelectedNormalMusteri = {
              ...props.selectedData,
              MstrAdi: props.selectedData.MstrAdi || ''
            };
            console.log('🔥 direktOdaDegisikligiYap - window.kartliIslemSelectedNormalMusteri set:', window.kartliIslemSelectedNormalMusteri)
          } else {
            console.log('❌ direktOdaDegisikligiYap - props.selectedData bulunamadı')
          }
          // 🔥 OTOMATİK MODAL AÇMA FLAG'İNİ SET ET
          (window as Window & { kartliIslemAutoOpenModal?: boolean }).kartliIslemAutoOpenModal = true;
          window.dispatchEvent(new Event('showOdemeIslemModal'));
        }, 500);
      }, 3000);
    } else {
      throw new Error(response.data.message || 'Bilinmeyen bir hata oluştu.');
    }
  } catch (error) {
    let errorMessage = 'Bir hata oluştu';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    $q.notify({
      color: 'negative',
      icon: 'error',
      message: `Erken çıkış işlemi başarısız: ${errorMessage}`,
      position: 'top',
      timeout: 4000
    });
  } finally {
    saving.value = false;
  }
}

</script>

<style scoped>
/* Dönem Yenileme Dialog Card Styling */
.donem-yenileme-card {
  max-width: 95vw !important;
  max-height: 95vh !important;
  width: auto !important;
  height: auto !important;
  overflow-y: auto !important;
  border-radius: 16px !important;
  overflow: hidden !important;
}

/* Dark mode adaptif CSS stilleri */
.containers-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 20px;
  width: 100%;
  padding: 20px;
}

.ana-form-wrapper {
  flex: 0 0 auto;
}

.ana-form-container {
  width: 860px;
  max-width: 860px;
  min-width: 600px;
  margin: 0;
  border: 2px solid var(--q-border-color);
  border-radius: 20px;
  padding: 20px;
  background: var(--q-background-gradient);
  box-shadow: var(--q-shadow);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

/* Light mode */
body:not(.body--dark) .ana-form-container {
  --q-border-color: #e0e0e0;
  --q-background-gradient: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  --q-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* Dark mode */
body.body--dark .ana-form-container {
  --q-border-color: #424242;
  --q-background-gradient: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
  --q-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.container-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--q-separator-color);
  transition: border-color 0.3s ease;
}

/* Light mode separator */
body:not(.body--dark) .container-header {
  --q-separator-color: #e0e0e0;
}

/* Dark mode separator */
body.body--dark .container-header {
  --q-separator-color: #424242;
}

.hesap-tipi-section {
  flex: 1;
}

.kurumsal-fields {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--q-kurumsal-bg);
  border-radius: 8px;
  border-left: 4px solid var(--q-kurumsal-border);
  transition: all 0.3s ease;
}

/* Light mode kurumsal */
body:not(.body--dark) .kurumsal-fields {
  --q-kurumsal-bg: rgba(255, 152, 0, 0.05);
  --q-kurumsal-border: #ff9800;
}

/* Dark mode kurumsal */
body.body--dark .kurumsal-fields {
  --q-kurumsal-bg: rgba(255, 152, 0, 0.15);
  --q-kurumsal-border: #ffb74d;
}

.kurumsal-row {
  gap: 1rem;
}

.kurumsal-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.musteri-fields {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--q-musteri-bg);
  border-radius: 8px;
  border-left: 4px solid var(--q-musteri-border);
  transition: all 0.3s ease;
}

/* Light mode musteri */
body:not(.body--dark) .musteri-fields {
  --q-musteri-bg: rgba(33, 150, 243, 0.05);
  --q-musteri-border: #2196f3;
}

/* Dark mode musteri */
body.body--dark .musteri-fields {
  --q-musteri-bg: rgba(33, 150, 243, 0.15);
  --q-musteri-border: #64b5f6;
}

.musteri-row {
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.musteri-col {
  flex: 1;
}

.oda-konaklama-fields {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--q-oda-bg);
  border-radius: 8px;
  border-left: 4px solid var(--q-oda-border);
  transition: all 0.3s ease;
}

/* Light mode oda */
body:not(.body--dark) .oda-konaklama-fields {
  --q-oda-bg: rgba(76, 175, 80, 0.05);
  --q-oda-border: #4caf50;
}

/* Dark mode oda */
body.body--dark .oda-konaklama-fields {
  --q-oda-bg: rgba(76, 175, 80, 0.15);
  --q-oda-border: #81c784;
}

.oda-konaklama-row {
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.oda-konaklama-col {
  flex: 1;
}

.bedel-islemler-fields {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--q-bedel-bg);
  border-radius: 8px;
  border-left: 4px solid var(--q-bedel-border);
  transition: all 0.3s ease;
}

/* Light mode bedel */
body:not(.body--dark) .bedel-islemler-fields {
  --q-bedel-bg: rgba(156, 39, 176, 0.05);
  --q-bedel-border: #9c27b0;
}

/* Dark mode bedel */
body.body--dark .bedel-islemler-fields {
  --q-bedel-bg: rgba(156, 39, 176, 0.15);
  --q-bedel-border: #ba68c8;
}

.bedel-islemler-row {
  gap: 16px;
  padding: 0 8px;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: center;
}

.bedel-islemler-item {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.bedel-islemler-col {
  flex: 1;
}

.ek-notlar-fields {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--q-notlar-bg);
  border-radius: 8px;
  border-left: 4px solid var(--q-notlar-border);
  transition: all 0.3s ease;
}

/* Light mode notlar */
body:not(.body--dark) .ek-notlar-fields {
  --q-notlar-bg: rgba(63, 81, 181, 0.05);
  --q-notlar-border: #3f51b5;
}

/* Dark mode notlar */
body.body--dark .ek-notlar-fields {
  --q-notlar-bg: rgba(63, 81, 181, 0.15);
  --q-notlar-border: #7986cb;
}

.kurumsal-responsive {
  width: 100%;
}

.oda-select-field {
  font-size: 0.75rem;
}

/* Büyük font boyutu için özel sınıflar - musteri-islem.vue ile aynı */
.konaklama-field :deep(.q-field__label) {
  font-size: 0.95rem !important;
  font-weight: 500 !important;
  line-height: 1.2 !important;
}

.konaklama-field :deep(.q-field__native) {
  font-size: 0.9rem !important;
  font-weight: 500 !important;
  padding-left: 8px !important;
}

.bedel-field :deep(.q-field__label),
.hesaplanan-bedel-field :deep(.q-field__label) {
  font-size: 0.95rem !important;
  font-weight: 500 !important;
  line-height: 1.2 !important;
}

.bedel-field :deep(.q-field__native),
.hesaplanan-bedel-field :deep(.q-field__native) {
  font-size: 0.9rem !important;
  font-weight: 500 !important;
  padding-left: 8px !important;
}

.konaklama-readonly {
  background-color: var(--q-readonly-bg);
  transition: background-color 0.3s ease;
}

/* Light mode readonly */
body:not(.body--dark) .konaklama-readonly {
  --q-readonly-bg: rgba(0, 0, 0, 0.02);
}

/* Dark mode readonly */
body.body--dark .konaklama-readonly {
  --q-readonly-bg: rgba(255, 255, 255, 0.05);
}

.hesaplanan-bedel-field {
  background-color: var(--q-hesaplanan-bg);
  transition: background-color 0.3s ease;
}

/* Light mode hesaplanan */
body:not(.body--dark) .hesaplanan-bedel-field {
  --q-hesaplanan-bg: rgba(156, 39, 176, 0.05);
}

/* Dark mode hesaplanan */
body.body--dark .hesaplanan-bedel-field {
  --q-hesaplanan-bg: rgba(156, 39, 176, 0.15);
}

/* Ek notlar alanı için büyük font - musteri-islem.vue ile aynı */
.ek-notlar-fields :deep(.q-field__label) {
  font-size: 0.95rem !important;
  font-weight: 500 !important;
  line-height: 1.2 !important;
}

.ek-notlar-fields :deep(.q-field__native) {
  font-size: 0.9rem !important;
  font-weight: 500 !important;
  padding-left: 8px !important;
}

.compact-btn {
  min-width: 100px !important;
  padding: 8px 12px !important;
}

.proportional-btn {
  width: 100% !important;
  min-height: 40px !important;
  padding: 8px 12px !important;
  font-size: 0.875rem !important;
  font-weight: 500 !important;
}

.text-weight-medium {
  font-weight: 500;
}

/* Ek Bilgiler Dialog Styles - musteri-islem.vue ile aynı */
.ek-bilgiler-dialog {
  border-radius: 16px !important;
  overflow: hidden;
}

.ek-bilgiler-container {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(25, 118, 210, 0.05) 100%);
  border: 1px solid rgba(33, 150, 243, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin: 8px 0;
}

/* Dark mode support for Ek Bilgiler dialog */
.body--dark .ek-bilgiler-container {
  background: linear-gradient(135deg, rgba(100, 181, 246, 0.12) 0%, rgba(33, 150, 243, 0.08) 100%);
  border-color: rgba(100, 181, 246, 0.3);
}

/* Dark mode için checkbox stilleri */
body.body--dark .q-checkbox__inner {
  color: var(--q-primary);
}

/* Dark mode için checkbox text stilleri */
body.body--dark .q-checkbox__label {
  color: rgba(255, 255, 255, 0.87) !important;
}

/* Light mode için checkbox text stilleri */
body:not(.body--dark) .q-checkbox__label {
  color: rgba(0, 0, 0, 0.87) !important;
}

/* Dark mode için dialog card stilleri */
body.body--dark .ek-bilgiler-dialog {
  background-color: #1e1e1e !important;
  color: rgba(255, 255, 255, 0.87) !important;
}

/* Light mode için dialog card stilleri */
body:not(.body--dark) .ek-bilgiler-dialog {
  background-color: #ffffff !important;
  color: rgba(0, 0, 0, 0.87) !important;
}

/* Dark mode için dialog title */
body.body--dark .ek-bilgiler-dialog .text-h7 {
  color: rgba(255, 255, 255, 0.87) !important;
}

/* Light mode için dialog title */
body:not(.body--dark) .ek-bilgiler-dialog .text-h7 {
  color: rgba(0, 0, 0, 0.87) !important;
}

/* Dark mode için buton stilleri */
body.body--dark .q-btn--outline {
  border-color: currentColor;
}

/* Dark mode için dialog butonları */
body.body--dark .ek-bilgiler-dialog .q-btn {
  color: rgba(255, 255, 255, 0.87);
}

/* Light mode için dialog butonları */
body:not(.body--dark) .ek-bilgiler-dialog .q-btn {
  color: rgba(0, 0, 0, 0.87);
}

/* Modal başlık stilleri */
.text-subtitle1.text-grey-8 {
  font-size: 1.1rem !important;
  font-weight: 500 !important;
}

/* Dark mode için modal başlık rengi */
body.body--dark .text-grey-8 {
  color: rgba(255, 255, 255, 0.87) !important;
}

/* Dark mode geçiş animasyonları */
* {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

/* Responsive Breakpoints - musteri-islem.vue ile aynı */
@media (max-width: 1400px) {
  .containers-wrapper {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  
  .ana-form-container {
    width: 700px;
    min-width: 500px;
  }
}

@media (max-width: 900px) {
  .ana-form-container {
    width: 600px;
    min-width: 400px;
  }
}

@media (max-width: 768px) {
  .containers-wrapper {
    padding: 16px;
  }
  
  .ana-form-container {
    width: 85vw;
    min-width: 350px;
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .containers-wrapper {
    padding: 12px;
  }
  
  .ana-form-container {
    width: 95vw;
    min-width: 320px;
    padding: 12px;
  }
  
  .container-header {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  
  .hesap-tipi-section {
    text-align: center;
  }
}

/* Floating Dialog Styles */
.floating-dialog {
  position: fixed !important;
  z-index: 9000 !important;
}

.floating-dialog :deep(.q-dialog__inner) {
  padding: 32px !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  display: flex !important;
  align-items: flex-start !important;
  justify-content: center !important;
  overflow: hidden !important;
}

.floating-dialog :deep(.q-dialog__backdrop) {
  background: rgba(0, 0, 0, 0.3) !important;
  backdrop-filter: blur(4px) !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
}

.draggable-card {
  pointer-events: auto !important;
  transition: box-shadow 0.3s ease !important;
  position: relative !important;
  z-index: 9001 !important;
  margin: auto !important;
  /* Sürüklenirken smooth hareket */
  transition: none !important;
}

.draggable-card.dragging {
  transition: none !important;
  user-select: none !important;
}

.draggable-card:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.q-card__section--head {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  border-radius: 28px 28px 0 0;
  padding: 16px 24px;
  min-height: 60px;
  user-select: none;
}

.q-card__section--head:hover {
  background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
}

/* Dark mode support */
body.body--dark .q-card__section--head {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
}

body.body--dark .q-card__section--head:hover {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
}

body.body--dark .floating-dialog :deep(.q-dialog__backdrop) {
  background: rgba(0, 0, 0, 0.5);
}

.cursor-move {
  cursor: move;
}

/* Close button styling */
.q-card__section--head .q-btn {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transition: all 0.3s ease;
  pointer-events: auto;
  z-index: 1;
}

.q-card__section--head .q-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

/* Ek Bilgiler dialog header için özel stil */
.bg-orange.q-card__section--head {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
}

.bg-orange.q-card__section--head:hover {
  background: linear-gradient(135deg, #f57c00 0%, #ef6c00 100%);
}

body.body--dark .bg-orange.q-card__section--head {
  background: linear-gradient(135deg, #ffb74d 0%, #ff9800 100%);
}

body.body--dark .bg-orange.q-card__section--head:hover {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
}

/* Ek Bilgiler dialog'u için özel positioning */
.ek-bilgiler-dialog.draggable-card {
  width: 300px !important;
  max-width: 300px !important;
  position: relative !important;
  z-index: 9001 !important;
  margin: auto !important;
}

/* Hesap Tipi ve Firma Container Stilleri */
.hesap-firma-container {
  width: 100%;
  border: 1px solid #ff9800;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.12) 0%, rgba(255, 193, 7, 0.08) 100%);
}

.hesap-firma-row {
  gap: 16px;
}

.hesap-firma-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Dark mode support for hesap-firma container */
.body--dark .hesap-firma-container {
  border-color: #ffb74d;
  background: linear-gradient(135deg, rgba(255, 183, 77, 0.15) 0%, rgba(255, 193, 7, 0.12) 100%);
}

/* Responsive adjustments for hesap-firma container */
@media (max-width: 768px) {
  .hesap-firma-row {
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .hesap-firma-container {
    padding: 8px;
  }
  
  .hesap-firma-row {
    flex-direction: column;
    gap: 12px;
  }
}

/* Kara Liste Checkbox Stilleri */
.kara-liste-item {
  min-width: 120px;
  justify-content: center;
  min-height: 40px;
  display: flex;
  align-items: center;
}

.kara-liste-checkbox {
  white-space: nowrap;
  font-weight: 500;
  color: #d32f2f;
}

.kara-liste-checkbox :deep(.q-checkbox__label) {
  font-size: 0.85rem;
  font-weight: 500;
  color: #d32f2f;
}

/* Dark mode support for kara liste */
.body--dark .kara-liste-checkbox {
  color: #f48fb1;
}

.body--dark .kara-liste-checkbox :deep(.q-checkbox__label) {
  color: #f48fb1;
}

/* Uniform button height for all buttons */
.bedel-islemler-row .proportional-btn {
  min-height: 40px !important;
  height: 40px !important;
  padding: 8px 16px !important;
  font-size: 0.875rem !important;
  font-weight: 500 !important;
}

/* Responsive adjustments for buttons and checkbox */
@media (max-width: 768px) {
  .bedel-islemler-row {
    gap: 12px;
    padding: 0 4px;
  }
  
  .kara-liste-checkbox :deep(.q-checkbox__label) {
    font-size: 0.8rem;
  }
  
  .bedel-islemler-row .proportional-btn {
    min-height: 36px !important;
    height: 36px !important;
    padding: 6px 12px !important;
    font-size: 0.8rem !important;
  }
  
  .ek-bilgiler-btn {
    min-width: 140px !important;
    width: 140px !important;
  }
  
  .donem-yenile-btn {
    min-width: 150px !important;
    width: 150px !important;
  }
  
  .cikis-yap-btn {
    min-width: 120px !important;
    width: 120px !important;
  }
  
  .iptal-btn {
    min-width: 80px !important;
    width: 80px !important;
  }
  
  .kara-liste-item {
    min-width: 90px;
    min-height: 36px;
  }
}

@media (max-width: 480px) {
  .bedel-islemler-row {
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
  
  .bedel-islemler-item {
    margin: 4px;
  }
  
  .kara-liste-item {
    order: 1;
    min-width: 80px;
    min-height: 32px;
  }
  
  .kara-liste-checkbox :deep(.q-checkbox__label) {
    font-size: 0.75rem;
  }
  
  .bedel-islemler-row .proportional-btn {
    min-height: 32px !important;
    height: 32px !important;
    padding: 4px 8px !important;
    font-size: 0.75rem !important;
  }
  
  .ek-bilgiler-btn {
    min-width: 110px !important;
    width: 110px !important;
  }
  
  .donem-yenile-btn {
    min-width: 120px !important;
    width: 120px !important;
  }
  
  .cikis-yap-btn {
    min-width: 100px !important;
    width: 100px !important;
  }
  
  .iptal-btn {
    min-width: 68px !important;
    width: 68px !important;
  }
}

/* Ek Bilgiler ve Dönem Yenile butonları için özel genişlik */
.ek-bilgiler-btn {
  min-width: 165px !important;
  width: 165px !important;
}

.donem-yenile-btn {
  min-width: 168px !important;
  width: 168px !important;
}

.cikis-yap-btn {
  min-width: 158px !important;
  width: 158px !important;
}

.iptal-btn {
  min-width: 100px !important;
  width: 100px !important;
}

/* Responsive adjustments for special buttons */
@media (max-width: 768px) {
  .ek-bilgiler-btn {
    min-width: 120px !important;
    width: 120px !important;
  }
  
  .donem-yenile-btn {
    min-width: 140px !important;
    width: 140px !important;
  }
}

@media (max-width: 480px) {
  .ek-bilgiler-btn {
    min-width: 100px !important;
    width: 100px !important;
  }
  
  .donem-yenile-btn {
    min-width: 120px !important;
    width: 120px !important;
  }
}

/* Label-based selector alternative (daha uyumlu) */
.bedel-islemler-row .q-btn:nth-child(1) .proportional-btn,
.bedel-islemler-row .bedel-islemler-col:nth-child(1) .proportional-btn {
  min-width: 140px !important; /* Ek Bilgiler */
}

.bedel-islemler-row .q-btn:nth-child(2) .proportional-btn,
.bedel-islemler-row .bedel-islemler-col:nth-child(2) .proportional-btn {
  min-width: 160px !important; /* Dönem Yenile */
}

.ek-bilgiler-btn {
  background-color: #ff9800 !important;
  color: #ffffff !important;
  border-color: #ff9800 !important;
}

.ek-bilgiler-btn:hover {
  background-color: #f57c00 !important;
  border-color: #f57c00 !important;
}

.donem-yenile-btn {
  background-color: #2196f3 !important;
  color: #ffffff !important;
  border-color: #2196f3 !important;
}

.donem-yenile-btn:hover {
  background-color: #1976d2 !important;
  border-color: #1976d2 !important;
}

/* Kara Liste Textbox Styles */
.kara-liste-textbox {
  margin-top: 8px;
  animation: slideInFromTop 0.3s ease-out;
}

.kara-liste-textbox :deep(.q-field__control) {
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.08) 0%, rgba(211, 47, 47, 0.05) 100%);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 8px;
}

.kara-liste-textbox :deep(.q-field__label) {
  color: #d32f2f !important;
  font-weight: 500;
}

.kara-liste-textbox :deep(.q-field__native) {
  color: #d32f2f;
  font-size: 0.9rem;
  min-height: 60px;
}

.kara-liste-textbox :deep(.q-field__native)::placeholder {
  color: rgba(211, 47, 47, 0.6);
  font-style: italic;
}

/* Dark mode support for kara liste textbox */
.body--dark .kara-liste-textbox :deep(.q-field__control) {
  background: linear-gradient(135deg, rgba(244, 143, 177, 0.12) 0%, rgba(233, 30, 99, 0.08) 100%);
  border: 1px solid rgba(244, 143, 177, 0.4);
}

.body--dark .kara-liste-textbox :deep(.q-field__label) {
  color: #f48fb1 !important;
}

.body--dark .kara-liste-textbox :deep(.q-field__native) {
  color: #f48fb1;
}

.body--dark .kara-liste-textbox :deep(.q-field__native)::placeholder {
  color: rgba(244, 143, 177, 0.6);
}

/* Animation for smooth appearance */
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.eknotlar-icerik-label {
  display: block;
  background: #111;
  color: #fff;
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 6px;
  font-size: 0.98rem;
  font-family: inherit;
  word-break: break-word;
  text-align: left !important;
}
</style> 