<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md text-center">Müşteri İşlemleri Formu</div>
    
    <div class="row">
      <div class="col-12">
        <!-- Form Container -->
      <div class="containers-wrapper">
        <!-- Temel Form -->
        <div class="ana-form-wrapper">
            <q-form @submit.prevent="submitForm" class="q-gutter-xs" ref="formRef">
            
            <!-- Ana Container -->
            <div class="ana-form-container" ref="anaContainerRef">
              <!-- Üst Başlık Satırı -->
              <div class="container-header">
                <div class="hesap-tipi-section">
              <label class="text-subtitle2 text-grey-8 q-mb-sm block">Hesap Tipi</label>
              <q-option-group
                v-model="form.MstrHspTip"
                :options="hesapTipleri"
                color="primary"
                inline
                    dense
                  />
                </div>
                
                <!-- Ek Bilgiler Toggle Butonu -->
                <div class="ek-bilgiler-toggle">
                  <q-btn 
                    @click="toggleExtraFields" 
                    round
                    class="toggle-btn"
                  >
                    <q-icon 
                      :name="showExtraFields ? 'chevron_left' : 'chevron_right'" 
                      class="toggle-icon"
                    />
                    <q-tooltip class="bg-grey-8 text-white text-body2" :delay="500">
                      {{ showExtraFields ? 'Ek Bilgileri Gizle' : 'Ek Bilgileri Göster' }}
                    </q-tooltip>
                  </q-btn>
                </div>
            </div>
            
            <!-- Kurumsal Alanları -->
            <div v-if="form.MstrHspTip === 'Kurumsal'" class="kurumsal-fields">
              <div class="row no-wrap kurumsal-row">
                <!-- Sol Kolon -->
                <div class="col kurumsal-col">
                    <q-select
                    v-model="extraForm.MstrFirma"
                    label="Firma"
                    outlined
                    color="orange-4"
                    label-color="orange-4"
                    dense
                    class="kurumsal-responsive"
                      use-input
                      hide-selected
                      fill-input
                      input-debounce="0"
                      :options="filteredFirmaOptions"
                      @filter="filterFirmaOptions"
                      @input-value="setFirmaInputValue"
                      @blur="onFirmaBlur"
                      @update:model-value="onFirmaSelected"
                    required
                      new-value-mode="add-unique"
                      option-value="value"
                      option-label="label"
                      emit-value
                      map-options
                      options-dense
                      popup-content-class="firma-dropdown-options"
                    >
                      <template v-slot:no-option>
                        <q-item dense>
                          <q-item-section class="text-grey">
                            Mevcut firmaları görmek için yazmaya başlayın
                          </q-item-section>
                        </q-item>
                      </template>
                      <template v-slot:option="scope">
                            <q-item 
                          v-bind="scope.itemProps" 
                          dense
                          class="q-py-xs"
                        >
                          <q-item-section>
                            <q-item-label class="text-body2">{{ scope.opt.label }}</q-item-label>
                          </q-item-section>
                            </q-item>
                    </template>
                    </q-select>
                  <q-input 
                    v-model="extraForm.MstrVD" 
                    label="Vergi Dairesi"
                    outlined
                    color="orange-4"
                    label-color="orange-4"
                    dense
                    class="kurumsal-responsive"
                    @update:model-value="onCorporateFieldChanged"
                  />
                  <q-input 
                    v-model="extraForm.MstrFrmMdr" 
                    label="Firma Müdür"
                    outlined
                    color="orange-4"
                    label-color="orange-4"
                    dense
                    class="kurumsal-responsive"
                    @update:model-value="onCorporateFieldChanged"
                  />
                </div>
                
                <!-- Sağ Kolon -->
                <div class="col kurumsal-col">
                  <q-input 
                    v-model="extraForm.MstrFrmTel" 
                    label="Firma Tel"
                    outlined
                    color="orange-4"
                    label-color="orange-4"
                    dense
                    class="kurumsal-responsive"
                    @update:model-value="onCorporateFieldChanged"
                  />
                  <q-input 
                    v-model="extraForm.MstrVno" 
                    label="Vergi No"
                    outlined
                    color="orange-4"
                    label-color="orange-4"
                    dense
                    class="kurumsal-responsive"
                    @update:model-value="onCorporateFieldChanged"
                  />
                  <q-input 
                    v-model="extraForm.MstrMdrTel" 
                    label="Müdür Tel"
                    outlined
                    color="orange-4"
                    label-color="orange-4"
                    dense
                    class="kurumsal-responsive"
                    @update:model-value="onCorporateFieldChanged"
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
              ref="tcInput"
              v-model="form.MstrTCN" 
              label="TC Kimlik No" 
              required 
                    dense
                    outlined
                    color="primary"
                    label-color="primary"
                    class="kurumsal-responsive"
                    maxlength="11"
                  />
                </div>
                <div class="col musteri-col">
            <q-input 
              v-model="form.MstrTelNo" 
              label="Telefon No"
                    color="primary"
                    label-color="primary"
                    dense
                    outlined
                    class="kurumsal-responsive"
                  />
                </div>
              </div>
              <!-- Müşteri Adı tek başına -->
              <div class="row">
                <div class="col-12">
                  <q-input 
                    v-model="form.MstrAdi" 
                    label="Müşteri Adı" 
                    required 
                    dense
                    outlined
                    color="primary"
                    label-color="primary"
                    class="kurumsal-responsive"
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
                      v-model="form.OdaTipi"
                      :options="odaTipleriOptions"
                      label="Oda Tipi"
                      outlined
                      dense
                      color="green-6"
                      label-color="green-6"
                      @update:model-value="onOdaTipiChanged"
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
                        <q-item v-bind="scope.itemProps" style="min-height: 28px; padding: 2px 12px;">
                          <q-item-section>
                            <q-item-label style="font-size: 0.75rem; line-height: 1.1;">
                              {{ scope.opt }}
                            </q-item-label>
                          </q-item-section>
                        </q-item>
                      </template>
                      <q-tooltip v-if="form.OdaTipi" class="bg-green-6 text-white text-body2" :delay="300">
                        <q-icon name="info" class="q-mr-xs"/>
                        Seçilen oda tipi: {{ form.OdaTipi }}
                      </q-tooltip>
                    </q-select>
                  </div>
                  <div class="col oda-konaklama-col">
                    <q-select
                      v-model="form.OdaYatak"
                      :options="odaYatakOptions"
                      label="Oda No - Yatak No"
                      outlined
                      dense
                      color="green-6"
                      label-color="green-6"
                      :disable="!form.OdaTipi"
                      required
                      class="kurumsal-responsive oda-select-field"
                      style="font-size: 0.75rem;"
                      @update:model-value="onOdaYatakChanged"
                    >
                      <template v-slot:no-option>
                        <q-item dense>
                          <q-item-section class="text-grey">
                            {{ form.OdaTipi ? 'Boş oda/yatak bulunamadı' : 'Önce oda tipi seçin' }}
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
                      <q-tooltip v-if="form.OdaYatak" class="bg-green-6 text-white text-body2" :delay="300">
                        <q-icon name="check_circle" class="q-mr-xs"/>
                        {{ getSelectedOdaYatakTooltip() }}
                      </q-tooltip>
                    </q-select>
                  </div>
                </div>
                
                <!-- Alt Satır: Konaklama Süresi ve Konaklama Tipi -->
                <div class="row no-wrap oda-konaklama-row">
                  <div class="col oda-konaklama-col">
                    <q-input
                      v-model.number="form.KonaklamaSuresi"
                      label="Konaklama Süresi (Gün)"
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
                    />
                  </div>
                  <div class="col oda-konaklama-col">
                    <q-input
                      v-model="form.KonaklamaTipi"
                      label="Konaklama Tipi"
                      outlined
                      color="green-6"
                      label-color="green-6"
                      dense
                      readonly
                      class="kurumsal-responsive konaklama-field konaklama-readonly"
                      :class="{ 'text-weight-medium': form.KonaklamaTipi }"
                    />
                  </div>
                </div>
              </div>
              
              <!-- Bedel Hesaplama ve İşlemler -->
              <div class="bedel-islemler-fields">
                <!-- Üst Satır: Otomatik Hesaplanan Bedel ve Toplam Bedel -->
                <div class="row no-wrap bedel-islemler-row">
                  <div class="col bedel-islemler-col">
                    <q-input
                      v-model.number="form.HesaplananBedel"
                      label="Otomatik Hesaplanan Bedel (TL)"
                      outlined
                      color="purple-6"
                      :label-color="$q.dark.isActive ? 'purple-3' : 'purple-6'"
                      dense
                      readonly
                      class="kurumsal-responsive hesaplanan-bedel-field"
                      :class="{ 'text-weight-medium': form.HesaplananBedel > 0 }"
                    />
                  </div>
                  <div class="col bedel-islemler-col">
                    <q-input
                      v-model.number="form.ToplamBedel"
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
                </div>
                
                <!-- Alt Satır: Butonlar -->
                <div class="row no-wrap bedel-islemler-row">
                  <div class="col bedel-islemler-col">
              <q-btn 
                type="submit" 
                label="Kaydet" 
                color="primary" 
                :loading="loading" 
                      class="kurumsal-responsive"
                      size="md"
              />
                  </div>
                  <div class="col bedel-islemler-col">
              <q-btn 
                @click="clearForm" 
                label="TEMİZLE" 
                color="secondary" 
                outline
                      class="kurumsal-responsive"
                      size="md"
              />
            </div>
                </div>
              </div>
            </div> <!-- Ana Container Kapanış -->
            
            <q-banner v-if="notify" class="q-mt-md" dense>{{ notify }}</q-banner>
          </q-form>
        </div>

        <!-- Ek Bilgiler Container -->
        <div v-if="showExtraFields" class="ek-bilgiler-container" ref="ekBilgilerContainerRef">
          <div class="ek-bilgiler-form">
            <q-input 
              v-model="extraForm.MstrDgmTarihi" 
              label="Doğum Tarihi"
              dense
              outlined
              color="teal-6"
              label-color="teal-7"
              class="text-caption full-width-input"
              readonly
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale" ref="datePopup">
                    <q-date 
                      v-model="extraForm.MstrDgmTarihi" 
                      mask="DD.MM.YYYY"
                      :locale="{
                        days: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
                        daysShort: ['Paz', 'Pts', 'Sal', 'Çar', 'Per', 'Cum', 'Cts'],
                        months: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
                        monthsShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
                      }"
                      minimal
                      @update:model-value="onDateSelected"
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-input 
              v-model="extraForm.MstrTel2" 
              label="2. Telefon No"
              dense
              outlined
              color="teal-6"
              label-color="teal-7"
              class="text-caption full-width-input"
            />
            <q-input 
              v-model="extraForm.MstrEposta" 
              label="E-posta"
              type="email"
              dense
              outlined
              color="teal-6"
              label-color="teal-7"
              class="text-caption full-width-input"
            />
            <q-input 
              v-model="extraForm.MstrMeslek" 
              label="Meslek"
              dense
              outlined
              color="teal-6"
              label-color="teal-7"
              class="text-caption full-width-input"
            />
            <q-input 
              v-model="extraForm.MstrYakini" 
              label="Yakını"
              dense
              outlined
              color="teal-6"
              label-color="teal-7"
              class="text-caption full-width-input"
            />
            <q-input 
              v-model="extraForm.MstrYknTel" 
              label="Yakın Tel"
              dense
              outlined
              color="teal-6"
              label-color="teal-7"
              class="text-caption full-width-input"
            />
            <q-input 
              v-model="extraForm.MstrAdres" 
              label="Adres"
              type="textarea"
                rows="3"
              dense
              outlined
              color="teal-6"
              label-color="teal-7"
              class="text-caption full-width-input"
            />
            <q-input 
              v-model="extraForm.MstrNot" 
                label="Not"
              type="textarea"
              rows="2"
              dense
              outlined
              color="teal-6"
              label-color="teal-7"
              class="text-caption full-width-input"
            />
          </div>
        </div>
        </div>


      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import axios, { AxiosError } from 'axios'

const $q = useQuasar()

const hesapTipleri = [
  { label: 'Bireysel', value: 'Bireysel' },
  { label: 'Kurumsal', value: 'Kurumsal' }
]

const form = ref({
  MstrAdi: '',
  MstrHspTip: 'Bireysel',
  MstrTCN: '',
  MstrTelNo: '',
  OdaTipi: '',
  OdaYatak: '',
  KonaklamaSuresi: 1,
  KonaklamaTipi: 'GÜNLÜK',
  ToplamBedel: 0,
  HesaplananBedel: 0
})

const loading = ref(false)
const notify = ref('')
const tcInput = ref()
const showExtraFields = ref(false)
const datePopup = ref()
const formRef = ref()
const anaContainerRef = ref()
const ekBilgilerContainerRef = ref()
const extraForm = ref({
  MstrDgmTarihi: '',
  MstrTel2: '',
  MstrEposta: '',
  MstrMeslek: '',
  MstrYakini: '',
  MstrYknTel: '',
  MstrFirma: '',
  MstrVD: '',
  MstrVno: '',
  MstrFrmTel: '',
  MstrFrmMdr: '',
  MstrMdrTel: '',
  MstrAdres: '',
  MstrNot: ''
})

// Firma dropdown için değişkenler
const firmaList = ref<string[]>([])
const filteredFirmaOptions = ref<{label: string, value: string}[]>([])
const originalFirmaDetails = ref<{
  MstrVD?: string
  MstrVno?: string
  MstrFrmTel?: string
  MstrFrmMdr?: string
  MstrMdrTel?: string
} | null>(null)

// Oda-Yatak dropdown için değişkenler
const odaTipleriOptions = ref<string[]>([])
const bosOdalarOptions = ref<{label: string, value: string}[]>([])
const odaYatakOptions = computed(() => bosOdalarOptions.value)
const odaTipFiyatlari = ref<{Gunluk: number, Haftalik: number, Aylik: number} | null>(null)

// Fiyat hesaplama fonksiyonu
async function hesaplaBedel() {
  if (!form.value.OdaTipi || !form.value.KonaklamaSuresi || !form.value.KonaklamaTipi) {
    form.value.HesaplananBedel = 0
    form.value.ToplamBedel = 0
    return
  }

  try {
    // Oda tip fiyatlarını getir
    const response = await axios.get(`http://localhost:3000/oda-tip-fiyatlari/${encodeURIComponent(form.value.OdaTipi)}`)
    if (response.data.success && response.data.data) {
      odaTipFiyatlari.value = response.data.data
      
      let hesaplananFiyat = 0
      const sure = form.value.KonaklamaSuresi
      const tip = form.value.KonaklamaTipi
      
      if (tip === 'GÜNLÜK') {
        hesaplananFiyat = (odaTipFiyatlari.value?.Gunluk || 0) * sure
      } else if (tip.includes('HAFTALIK')) {
        const haftaSayisi = Math.round(sure / 7)
        hesaplananFiyat = (odaTipFiyatlari.value?.Haftalik || 0) * haftaSayisi
      } else if (tip === 'AYLIK') {
        hesaplananFiyat = odaTipFiyatlari.value?.Aylik || 0
      }
      
      form.value.HesaplananBedel = hesaplananFiyat
      form.value.ToplamBedel = hesaplananFiyat
    }
  } catch (error) {
    console.error('Fiyat hesaplama hatası:', error)
    form.value.HesaplananBedel = 0
    form.value.ToplamBedel = 0
  }
}

// Sayfa yüklendiğinde firma listesini getir
async function loadFirmaList() {
  try {
    const response = await axios.get('http://localhost:3000/firma-listesi')
    if (response.data.success) {
      firmaList.value = response.data.data
      // Dropdown için uygun format
      filteredFirmaOptions.value = firmaList.value.map(firma => ({
        label: firma,
        value: firma
      }))
    }
  } catch (error) {
    console.error('Firma listesi yüklenemedi:', error)
  }
}

// Oda tiplerini getir
async function loadOdaTipleri() {
  try {
    console.log('Oda tipleri yükleniyor...')
    const response = await axios.get('http://localhost:3000/oda-tipleri')
    console.log('Oda tipleri response:', response.data)
    if (response.data.success) {
      odaTipleriOptions.value = response.data.data
      console.log('Oda tipleri yüklendi:', odaTipleriOptions.value)
    } else {
      console.error('Oda tipleri yüklenirken hata:', response.data)
    }
  } catch (error) {
    console.error('Oda tipleri yüklenemedi:', error)
  }
}

// Boş odaları getir
async function loadBosOdalar(odaTipi: string) {
  try {
    console.log('Boş odalar yükleniyor, oda tipi:', odaTipi)
    if (!odaTipi) {
      bosOdalarOptions.value = []
      return
    }
    const response = await axios.get(`http://localhost:3000/bos-odalar/${encodeURIComponent(odaTipi)}`)
    console.log('Boş odalar response:', response.data)
    if (response.data.success) {
      bosOdalarOptions.value = response.data.data
      console.log('Boş odalar yüklendi:', bosOdalarOptions.value)
    } else {
      console.error('Boş odalar yüklenirken hata:', response.data)
    }
  } catch (error) {
    console.error('Boş odalar yüklenemedi:', error)
    bosOdalarOptions.value = []
  }
}

// Dropdown filtreleme fonksiyonu
function filterFirmaOptions(val: string, update: (fn: () => void) => void) {
  update(() => {
    if (val === '') {
      filteredFirmaOptions.value = firmaList.value.map(firma => ({
        label: firma,
        value: firma
      }))
    } else {
      const needle = val.toLowerCase()
      filteredFirmaOptions.value = firmaList.value
        .filter(firma => firma.toLowerCase().includes(needle))
        .map(firma => ({
          label: firma,
          value: firma
        }))
    }
  })
}

// Input değeri değiştiğinde
function setFirmaInputValue(val: string) {
  extraForm.value.MstrFirma = val
}

// Blur olayında firma seçimi kontrolü
function onFirmaBlur() {
  const currentFirma = extraForm.value.MstrFirma
  if (currentFirma) {
    void onFirmaSelected(currentFirma)
  }
}

// Firma seçildiğinde detayları getir
async function onFirmaSelected(firmaName: string) {
  if (!firmaName || firmaName.trim() === '') {
    // Boş değer, alanları temizle
    extraForm.value.MstrVD = ''
    extraForm.value.MstrVno = ''
    extraForm.value.MstrFrmTel = ''
    extraForm.value.MstrFrmMdr = ''
    extraForm.value.MstrMdrTel = ''
    originalFirmaDetails.value = null
    return
  }

  const trimmedName = firmaName.trim()
  extraForm.value.MstrFirma = trimmedName

  if (!firmaList.value.includes(trimmedName)) {
    // Yeni firma giriliyor, alanları temizle
    extraForm.value.MstrVD = ''
    extraForm.value.MstrVno = ''
    extraForm.value.MstrFrmTel = ''
    extraForm.value.MstrFrmMdr = ''
    extraForm.value.MstrMdrTel = ''
    originalFirmaDetails.value = null
    return
  }

  try {
    const response = await axios.get(`http://localhost:3000/firma-detay/${encodeURIComponent(trimmedName)}`)
    if (response.data.success && response.data.data) {
      const details = response.data.data
      extraForm.value.MstrVD = details.MstrVD || ''
      extraForm.value.MstrVno = details.MstrVno || ''
      extraForm.value.MstrFrmTel = details.MstrFrmTel || ''
      extraForm.value.MstrFrmMdr = details.MstrFrmMdr || ''
      extraForm.value.MstrMdrTel = details.MstrMdrTel || ''
      originalFirmaDetails.value = { ...details }
    }
  } catch (error) {
    console.error('Firma detayları alınamadı:', error)
  }
}

// Kurumsal alan değiştiğinde güncelleme
async function onCorporateFieldChanged() {
  const currentFirma = extraForm.value.MstrFirma
  
  // Sadece listede var olan firma ise güncelle
  if (!currentFirma || !firmaList.value.includes(currentFirma)) {
    return
  }

  // Değişiklik var mı kontrol et
  if (originalFirmaDetails.value) {
    const hasChanges = (
      extraForm.value.MstrVD !== (originalFirmaDetails.value.MstrVD || '') ||
      extraForm.value.MstrVno !== (originalFirmaDetails.value.MstrVno || '') ||
      extraForm.value.MstrFrmTel !== (originalFirmaDetails.value.MstrFrmTel || '') ||
      extraForm.value.MstrFrmMdr !== (originalFirmaDetails.value.MstrFrmMdr || '') ||
      extraForm.value.MstrMdrTel !== (originalFirmaDetails.value.MstrMdrTel || '')
    )

    if (hasChanges) {
      try {
        await axios.post('http://localhost:3000/firma-guncelle', {
          firmaName: currentFirma,
          MstrVD: extraForm.value.MstrVD,
          MstrVno: extraForm.value.MstrVno,
          MstrFrmTel: extraForm.value.MstrFrmTel,
          MstrFrmMdr: extraForm.value.MstrFrmMdr,
          MstrMdrTel: extraForm.value.MstrMdrTel
        })
        // Başarılı güncelleme sonrası original değerleri güncelle
        originalFirmaDetails.value = {
          MstrVD: extraForm.value.MstrVD,
          MstrVno: extraForm.value.MstrVno,
          MstrFrmTel: extraForm.value.MstrFrmTel,
          MstrFrmMdr: extraForm.value.MstrFrmMdr,
          MstrMdrTel: extraForm.value.MstrMdrTel
        }
      } catch (error) {
        console.error('Firma bilgileri güncellenemedi:', error)
      }
    }
  }
}

// Sayfa yüklendiğinde firma listesini yükle
void loadFirmaList()
// Sayfa yüklendiğinde oda tiplerini yükle
void loadOdaTipleri()
// Başlangıç konaklama tipini ayarla
onKonaklamaSuresiChanged()

// Hesap tipi değişikliklerini izle
watch(() => form.value.MstrHspTip, (newType) => {
  if (newType === 'Bireysel') {
    // Bireysel seçildiğinde kurumsal alanları temizle
    extraForm.value.MstrFirma = ''
    extraForm.value.MstrVD = ''
    extraForm.value.MstrVno = ''
    extraForm.value.MstrFrmTel = ''
    extraForm.value.MstrFrmMdr = ''
    extraForm.value.MstrMdrTel = ''
    originalFirmaDetails.value = null
  } else if (newType === 'Kurumsal') {
    // Kurumsal seçildiğinde firma listesini yenile (çoklu kullanıcı ortamı için)
    void loadFirmaList()
  }
})

// Oda tipi değişikliklerini izle
watch(() => form.value.OdaTipi, (newOdaTipi) => {
  if (newOdaTipi) {
    form.value.OdaTipi = newOdaTipi
    form.value.OdaYatak = '' // Oda tipi değiştiğinde oda seçimini temizle
    void loadBosOdalar(newOdaTipi)
    // Gelişmiş popup bildirim
    showOdaTipiNotification(newOdaTipi)
    // Fiyat hesapla
    void hesaplaBedel()
  } else {
    form.value.OdaTipi = ''
    form.value.OdaYatak = ''
    bosOdalarOptions.value = []
    form.value.HesaplananBedel = 0
    form.value.ToplamBedel = 0
  }
})

async function submitForm() {
  loading.value = true
  notify.value = ''
  
  // Required alanların kontrolü
  if (!form.value.MstrTCN) {
    notify.value = 'TC Kimlik No zorunludur'
    loading.value = false
    return
  }
  
  if (!form.value.MstrAdi) {
    notify.value = 'Müşteri Adı zorunludur'
    loading.value = false
    return
  }
  
  if (!form.value.OdaTipi) {
    notify.value = 'Oda Tipi seçimi zorunludur'
    loading.value = false
    return
  }
  
  if (!form.value.OdaYatak) {
    notify.value = 'Oda No - Yatak No seçimi zorunludur'
    loading.value = false
    return
  }
  
  if (form.value.MstrHspTip === 'Kurumsal' && !extraForm.value.MstrFirma) {
    notify.value = 'Firma seçimi zorunludur'
    loading.value = false
    return
  }
  
  try {
    // Kullanıcı adını localStorage'dan al ve MstrKllnc'ye ata
    const username = localStorage.getItem('username') || 'admin'
    const formData = {
      ...form.value,
      ...extraForm.value,
      MstrKllnc: username,
      MstrDurum: 'KALIYOR'
    }
    
    const response = await axios.post('http://localhost:3000/musteri-islem', formData)
    if (response.data.success) {
      notify.value = response.data.message || 'Kayıt başarıyla eklendi!'
      // Form temizle
      form.value = { MstrAdi: '', MstrHspTip: 'Bireysel', MstrTCN: '', MstrTelNo: '', OdaTipi: '', OdaYatak: '', KonaklamaSuresi: 1, KonaklamaTipi: 'GÜNLÜK', ToplamBedel: 0, HesaplananBedel: 0 }
      extraForm.value = {
        MstrDgmTarihi: '',
        MstrTel2: '',
        MstrEposta: '',
        MstrMeslek: '',
        MstrYakini: '',
        MstrYknTel: '',
        MstrFirma: '',
        MstrVD: '',
        MstrVno: '',
        MstrFrmTel: '',
        MstrFrmMdr: '',
        MstrMdrTel: '',
        MstrAdres: '',
        MstrNot: ''
      }
      // Dropdown'ları temizle
      bosOdalarOptions.value = []
      // Ek bilgiler alanını gizle
      showExtraFields.value = false
      // 3 saniye sonra mesajı temizle
      setTimeout(() => {
        notify.value = ''
      }, 3000)
    } else {
      notify.value = 'Kayıt sırasında hata oluştu!'
    }
  } catch (error) {
    console.error('Error:', error)
    if (error instanceof AxiosError && error.response?.data?.message) {
      const errorMessage = error.response.data.message
      notify.value = errorMessage
      
      // TC kimlik hatası ise özel işlem
      if (errorMessage.includes('Müşteri TCN Kayıtlarda Mevcut')) {
        // TC alanını hemen temizle ve focus yap
        form.value.MstrTCN = ''
        setTimeout(() => {
          tcInput.value?.focus()
        }, 100)
        
        // 3 saniye sonra uyarı mesajını temizle
        setTimeout(() => {
          notify.value = ''
        }, 3000)
      }
    } else {
      notify.value = 'Kayıt sırasında hata oluştu!'
    }
  } finally {
    loading.value = false
  }
}

function clearForm() {
  form.value = { MstrAdi: '', MstrHspTip: 'Bireysel', MstrTCN: '', MstrTelNo: '', OdaTipi: '', OdaYatak: '', KonaklamaSuresi: 1, KonaklamaTipi: 'GÜNLÜK', ToplamBedel: 0, HesaplananBedel: 0 }
  extraForm.value = {
    MstrDgmTarihi: '',
    MstrTel2: '',
    MstrEposta: '',
    MstrMeslek: '',
    MstrYakini: '',
    MstrYknTel: '',
    MstrFirma: '',
    MstrVD: '',
    MstrVno: '',
    MstrFrmTel: '',
    MstrFrmMdr: '',
    MstrMdrTel: '',
    MstrAdres: '',
    MstrNot: ''
  }
  // Dropdown'ları temizle
  bosOdalarOptions.value = []
  notify.value = '' // Uyarı mesajını da temizle
}

function toggleExtraFields() {
  showExtraFields.value = !showExtraFields.value
}

function onDateSelected(date: string) {
  extraForm.value.MstrDgmTarihi = date
  // Popup'ı otomatik kapat
  if (datePopup.value) {
    datePopup.value.hide()
  }
}

function onOdaTipiChanged(odaTipi: string | null) {
  if (odaTipi) {
    form.value.OdaTipi = odaTipi
    form.value.OdaYatak = '' // Oda tipi değiştiğinde oda seçimini temizle
    void loadBosOdalar(odaTipi)
    // Gelişmiş popup bildirim
    showOdaTipiNotification(odaTipi)
    // Fiyat hesapla
    void hesaplaBedel()
  } else {
    form.value.OdaTipi = ''
    form.value.OdaYatak = ''
    bosOdalarOptions.value = []
    form.value.HesaplananBedel = 0
    form.value.ToplamBedel = 0
  }
}

function onOdaYatakChanged(odaYatak: string | null) {
  if (odaYatak) {
    form.value.OdaYatak = odaYatak
    // Gelişmiş popup bildirim
    showOdaYatakNotification(odaYatak)
  }
}

function onKonaklamaSuresiChanged() {
  const sure = form.value.KonaklamaSuresi
  
  // Konaklama süresi kontrolü
  if (sure < 1 || sure > 30) {
    form.value.KonaklamaSuresi = 1
    form.value.KonaklamaTipi = 'GÜNLÜK'
    return
  }
  
  // Konaklama tipini hesapla
  if (sure >= 1 && sure <= 4) {
    form.value.KonaklamaTipi = 'GÜNLÜK'
  } else if (sure >= 5 && sure <= 17) {
    const hafta = Math.round(sure / 7)
    form.value.KonaklamaTipi = `${hafta} HAFTALIK`
  } else if (sure >= 18) {
    form.value.KonaklamaTipi = 'AYLIK'
  }
  
  // Fiyat hesapla
  void hesaplaBedel()
}

function onToplamBedelChanged(yeniBedel: string | number | null) {
  if (typeof yeniBedel === 'number' && yeniBedel >= 0) {
    form.value.ToplamBedel = yeniBedel
  } else if (typeof yeniBedel === 'string' && !isNaN(Number(yeniBedel))) {
    form.value.ToplamBedel = Number(yeniBedel)
  } else {
    form.value.ToplamBedel = 0
  }
}

// Seçilen oda-yatak kombinasyonu için tooltip metni oluşturucu
function getSelectedOdaYatakTooltip(): string {
  if (!form.value.OdaYatak) return ''
  
  const selected = bosOdalarOptions.value.find(
    option => option.value === form.value.OdaYatak
  )
  
  return selected ? `Seçilen: ${selected.label}` : ''
}

// Oda tipi seçimi popup bildirimi
function showOdaTipiNotification(odaTipi: string) {
  notify.value = `✓ ${odaTipi} oda tipi seçildi. Boş odalar yükleniyor...`
  setTimeout(() => {
    if (bosOdalarOptions.value.length > 0) {
      notify.value = `✓ ${bosOdalarOptions.value.length} adet boş oda bulundu.`
    } else {
      notify.value = `⚠ ${odaTipi} için boş oda bulunamadı.`
    }
    setTimeout(() => {
      notify.value = ''
    }, 3000)
  }, 1500)
}

// Oda-yatak seçimi popup bildirimi
function showOdaYatakNotification(odaYatak: string) {
  const selectedOda = bosOdalarOptions.value.find(option => option.value === odaYatak)
  if (selectedOda) {
    notify.value = `✓ ${selectedOda.label} seçildi!`
    setTimeout(() => {
      notify.value = ''
    }, 2500)
  }
}

// Yükseklik eşitleme fonksiyonu
let adjustTimeoutId: ReturnType<typeof setTimeout> | null = null

function adjustContainerHeights() {
  // Throttling ile performans optimizasyonu
  if (adjustTimeoutId) {
    clearTimeout(adjustTimeoutId)
  }
  
  adjustTimeoutId = setTimeout(() => {
    void nextTick(() => {
      if (anaContainerRef.value && ekBilgilerContainerRef.value && showExtraFields.value) {
        const anaHeight = anaContainerRef.value.offsetHeight
        ekBilgilerContainerRef.value.style.height = `${anaHeight}px`
      }
    })
  }, 100) // 100ms throttle
}

// Sayfa yüklendiğinde ve ek alanlar açıldığında yükseklik eşitleme
onMounted(() => {
  adjustContainerHeights()
})

// showExtraFields değişikliklerini izle
watch(showExtraFields, () => {
  adjustContainerHeights()
})

// Hesap tipi değişikliklerini izle ve yükseklik eşitleme yap
watch(() => form.value.MstrHspTip, () => {
  // nextTick ile DOM güncellemesi tamamlandıktan sonra yükseklik eşitle
  void nextTick(() => {
    adjustContainerHeights()
  })
})

// Form değişikliklerini genel olarak izle (ana container yükseklik değişiklikleri için)
watch(form, () => {
  if (showExtraFields.value) {
    void nextTick(() => {
      adjustContainerHeights()
    })
  }
}, { deep: true })
</script>

<style scoped>
/* Form gutter ve spacing */
.q-gutter-xs > * + * {
  margin-top: 8px;
}

.q-gutter-xs > .row {
  margin-left: -4px;
  margin-right: -4px;
}

.q-gutter-xs > .row > * {
  padding-left: 4px;
  padding-right: 4px;
}

/* Kurumsal alanlar için düzenleme */
.kurumsal-fields {
  width: 100%;
  border: 1px solid #ff9800;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  background: rgba(255, 152, 0, 0.05);
}

.kurumsal-row {
  gap: 16px;
}

.kurumsal-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Müşteri bilgileri alanları için düzenleme */
.musteri-fields {
  width: 100%;
  border: 1px solid #1976d2;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  background: rgba(25, 118, 210, 0.05);
}

.musteri-row {
  gap: 16px;
  margin-bottom: 8px;
}

.musteri-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Oda ve konaklama bilgileri alanları için düzenleme */
.oda-konaklama-fields {
  width: 100%;
  border: 1px solid #4caf50;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  background: rgba(76, 175, 80, 0.05);
}

.oda-konaklama-row {
  gap: 16px;
  margin-bottom: 8px;
}

.oda-konaklama-row:last-child {
  margin-bottom: 0;
}

.oda-konaklama-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Bedel ve işlemler alanları için düzenleme */
.bedel-islemler-fields {
  width: 100%;
  border: 1px solid #9c27b0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  background: rgba(156, 39, 176, 0.05);
}

.bedel-islemler-row {
  gap: 16px;
  margin-bottom: 8px;
}

.bedel-islemler-row:last-child {
  margin-bottom: 0;
}

.bedel-islemler-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  width: 800px;
  max-width: 800px;
  min-width: 600px;
  margin: 0;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  background: rgba(250, 250, 250, 0.95);
  position: relative;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

/* Dark mode adaptasyonu */
.body--dark .ana-form-container {
  border-color: #424242;
  background: rgba(45, 45, 45, 0.95);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.body--dark .container-header {
  border-bottom-color: #424242;
}

/* Responsive Breakpoints */
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
  
  .ek-bilgiler-container {
    width: 350px;
    min-width: 300px;
  }
}

@media (max-width: 900px) {
  .ana-form-container {
    width: 600px;
    min-width: 400px;
  }
  
  .ek-bilgiler-container {
    width: 300px;
    min-width: 280px;
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
  
  .ek-bilgiler-container {
    width: 75vw;
    min-width: 300px;
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
  
  .ek-bilgiler-container {
    width: 90vw;
    min-width: 250px;
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

/* Container Header */
.container-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.hesap-tipi-section {
  flex: 1;
}

/* Ek bilgiler toggle butonu */
.ek-bilgiler-toggle {
  display: flex;
  align-items: center;
}

.toggle-btn {
  width: 48px !important;
  height: 48px !important;
  background: linear-gradient(135deg, #ff4081 0%, #e91e63 100%) !important;
  border: none !important;
  box-shadow: 0 4px 16px rgba(233, 30, 99, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.toggle-btn:hover {
  background: linear-gradient(135deg, #f50057 0%, #c2185b 100%) !important;
  box-shadow: 0 6px 20px rgba(233, 30, 99, 0.6);
  transform: translateY(-2px) scale(1.08);
}

.toggle-btn:active {
  transform: translateY(0) scale(0.95);
  box-shadow: 0 2px 8px rgba(233, 30, 99, 0.4);
}

.toggle-icon {
  color: white !important;
  font-size: 28px !important;
  font-weight: 900 !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.toggle-btn::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  background: linear-gradient(45deg, #ff4081, #e91e63, #f50057);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.toggle-btn:hover::before {
  opacity: 0.3;
}

/* Firma dropdown stil */
.firma-dropdown-options .q-item {
  min-height: 28px;
  padding: 2px 12px;
}

.firma-dropdown-options .q-item-section {
  font-size: 0.85rem;
  line-height: 1.1;
}

/* Oda seçimi kompakt stil */
.oda-select-field .q-field__control {
  min-height: 32px;
}

.oda-select-field .q-field__marginal {
  height: 32px;
}

.oda-select-field .q-field__label {
  font-size: 0.75rem;
}

/* Konaklama alanları stil */
.konaklama-field {
  font-size: 0.8rem;
}

.konaklama-readonly {
  background-color: rgba(76, 175, 80, 0.05);
  font-weight: 500;
}

/* Bedel alanları stil */
.bedel-field .q-field__control {
  background: rgba(255, 152, 0, 0.08);
}

.hesaplanan-bedel-field .q-field__control {
  background: rgba(156, 39, 176, 0.08);
}

/* Dark mode support for hesaplanan bedel field */
.body--dark .hesaplanan-bedel-field .q-field__label,
.body--dark .hesaplanan-bedel-field .q-field__native,
.body--dark .hesaplanan-bedel-field .q-field__control .q-field__label {
  color: #ce93d8 !important;
}

.body--dark .hesaplanan-bedel-field .q-field__control {
  background: rgba(206, 147, 216, 0.15);
}

/* Additional override for Quasar's label color system */
.body--dark .q-field--labeled.hesaplanan-bedel-field .q-field__label {
  color: #ce93d8 !important;
}

.body--dark .q-field--float.hesaplanan-bedel-field .q-field__label {
  color: #ce93d8 !important;
}

/* Responsive font size */
@media (max-width: 600px) {
  .oda-select-field .q-field__label,
  .oda-select-field .q-item-label {
    font-size: 0.7rem;
  }
  
  .konaklama-field .q-field__label {
    font-size: 0.75rem;
  }
}

/* Tooltip hover effects */
.oda-select-field:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

/* Banner notification styling */
.q-banner {
  border-radius: 8px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-left: 4px solid #2196f3;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);
  backdrop-filter: blur(10px);
  animation: slideInFromTop 0.3s ease-out;
  color: #1565c0 !important;
  font-weight: 500;
}

/* Dark mode banner styling */
.body--dark .q-banner {
  background: linear-gradient(135deg, #263238 0%, #37474f 100%) !important;
  border-left: 4px solid #64b5f6 !important;
  color: #e3f2fd !important;
  box-shadow: 0 2px 12px rgba(100, 181, 246, 0.3) !important;
}

/* Banner text contrast enhancement */
.q-banner .q-banner__content {
  color: inherit !important;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Textual overflow and ellipsis */
.q-item-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Grid layout düzenlemeleri */
.row.q-gutter-xs {
  margin-left: -4px;
  margin-right: -4px;
}

.row.q-gutter-xs :deep(.col-6) {
  padding-left: 4px;
  padding-right: 4px;
}

/* Layout fix for 2x2 grid */
.q-mb-xs {
  margin-bottom: 4px !important;
}

/* Tüm input elementleri için responsive genişlik */
.tc-responsive {
  width: 50%;
  max-width: 50%;
  min-width: 160px;
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .tc-responsive {
    max-width: 50%;
    min-width: 140px;
  }
}

@media (max-width: 480px) {
  .tc-responsive {
    max-width: 50%;
    min-width: 50%;
  }
}

/* Container içindeki elementler için tam genişlik */
.full-width-input {
  width: 100%;
  max-width: 100%;
  min-width: 100px;
}

/* Eski kurumsal-responsive sınıfı - artık full-width-input kullanılıyor */
.kurumsal-responsive {
  width: 100%;
  max-width: 100%;
  min-width: 100px;
}

/* Responsive breakpoints for full-width elements */
@media (max-width: 768px) {
  .full-width-input,
  .kurumsal-responsive {
    max-width: 100%;
    min-width: 80px;
  }
}

@media (max-width: 480px) {
  .full-width-input,
  .kurumsal-responsive {
    max-width: 100%;
    min-width: 60px;
  }
}

/* Ek Bilgiler Container Stilleri */
.ek-bilgiler-container {
  width: 400px;
  margin: 0;
  max-width: 400px;
  min-width: 300px;
  padding: 20px;
  border: 2px solid #26a69a;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(38, 166, 154, 0.03) 0%, rgba(38, 166, 154, 0.08) 100%);
  box-shadow: 0 4px 12px rgba(38, 166, 154, 0.15);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  flex: 0 0 auto;
}

.ek-bilgiler-container:hover {
  box-shadow: 0 6px 20px rgba(38, 166, 154, 0.25);
  transform: translateY(-2px);
}

.ek-bilgiler-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Dark mode support for ek bilgiler */
.body--dark .ek-bilgiler-container {
  border: 2px solid #4db6ac;
  background: linear-gradient(135deg, rgba(77, 182, 172, 0.08) 0%, rgba(77, 182, 172, 0.15) 100%);
  box-shadow: 0 4px 12px rgba(77, 182, 172, 0.25);
}

.body--dark .ek-bilgiler-container:hover {
  box-shadow: 0 6px 20px rgba(77, 182, 172, 0.35);
}


</style> 