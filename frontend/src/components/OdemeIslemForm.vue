

<template>
  <q-dialog v-model="show" persistent transition-show="fade" transition-hide="fade">
    <q-card style="min-width: 700px; max-width: 98vw;" class="odeme-islem-modal-card">
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6">Müşteri Tahsilat Formu</div>
          <q-btn dense flat round icon="calculate" @click="onOpenCalculator" :title="'Hesap Makinesi'" />
        </div>
        <div class="tahsilat-form-wrapper">
          <div class="row items-center justify-between q-mb-lg">
            <div class="row items-center">
              <div class="text-subtitle1 q-mr-md">Müşteri Adı:</div>
              <div class="text-body1 text-weight-medium">{{ props.musteriAdi }}</div>
            </div>
            <div class="row items-center">
              <div class="text-subtitle1 q-mr-sm">Bakiye:</div>
              <div class="text-h6 text-weight-bold" :class="kalanBakiye >= 0 ? 'text-orange' : 'text-green'">
                {{ formatCurrency(Math.abs(kalanBakiye)) }}
              </div>
            </div>
          </div>
          <div class="q-gutter-md">
            <div v-if="true" :class="['odeme-container q-pa-md q-mb-md', (0 > 0 && !odeme[0]?.tutar) ? 'soluk-renkli' : '']">
              <div class="row items-center q-mb-md">
                <div class="odeme-label text-white q-pa-sm q-mr-md">Ödeme 1</div>
                <q-input v-model="odeme[0]!.tutar" label="Tahsil Edilen (TL)" outlined dense class="tahsilat-input q-mr-md" style="max-width: 160px;" :input-style="{ textAlign: 'right' }" />
                  <div class="row items-center q-gutter-sm tip-group q-mr-lg">
                    <q-radio v-model="odeme[0]!.tip" val="nakit" label="Nakit Kasa(TL)" dense :disable="!odeme[0]!.tutar || (odeme[0]!.odemeTipiGrup ? isComboDisabled('nakit', odeme[0]!.odemeTipiGrup, 0) : false)" />
                    <div class="column items-end kredi-combo">
                      <q-radio v-model="odeme[0]!.tip" val="kredi" label="Kredi Kartları" dense :disable="!odeme[0]!.tutar || (odeme[0]!.odemeTipiGrup ? isComboDisabled('kredi', odeme[0]!.odemeTipiGrup, 0) : false)" />
                      <q-checkbox v-show="odeme[0]?.tip === 'kredi'" v-model="odeme[0]!.acenta" label="acenta" dense size="xs" color="secondary" class="acenta-checkbox" />
                    </div>
                    <q-radio v-model="odeme[0]!.tip" val="banka" label="Banka EFT" dense :disable="!odeme[0]!.tutar || (odeme[0]!.odemeTipiGrup ? isComboDisabled('banka', odeme[0]!.odemeTipiGrup, 0) : false)" />
                </div>
              </div>
              <div class="row items-center q-mb-xs justify-between">
                <div class="q-ml-lg row items-center no-wrap">
                  <q-option-group v-model="odeme[0]!.odemeTipiGrup" :options="odemeTipiGrupOptions.map(opt => ({ ...opt, disable: !odeme[0]!.tutar || !odeme[0]!.tip || (odeme[0]!.tip ? isComboDisabled(odeme[0]!.tip, opt.value, 0) : false) }))" color="secondary" inline dense class="q-mr-md" :disable="!odeme[0]!.tip || !odeme[0]!.tutar" />
                  <q-input v-if="odeme[0]?.odemeTipiGrup === 'ekhizmet'" v-model="odeme[0]!.ekHizmetNotu" dense outlined placeholder="Ek hizmet bilgisi girin..." style="max-width: 380px;" class="q-ml-sm" />
                </div>
                <div class="q-mr-lg">
                  <q-checkbox v-model="odeme[0]!.fis" label="Fiş Kes" class="q-mr-md" color="secondary" dense :disable="!odeme[0]!.tutar" />
                  <q-checkbox v-model="odeme[0]!.komisyon" label="Komisyon" color="secondary" dense :disable="!odeme[0]!.tutar" />
                </div>
              </div>
            </div>
            <transition name="expand-fade">
              <div v-if="showOdeme2" :class="['odeme-container q-pa-md q-mb-md', (1 > 0 && !odeme[1]?.tutar) ? 'soluk-renkli' : '']">
                <div class="row items-center q-mb-md">
                  <div class="odeme-label text-white q-pa-sm q-mr-md">Ödeme 2</div>
                  <q-input v-model="odeme[1]!.tutar" label="Tahsil Edilen (TL)" outlined dense class="tahsilat-input q-mr-md" style="max-width: 160px;" :input-style="{ textAlign: 'right' }" />
                  <div class="row items-center q-gutter-sm tip-group q-mr-lg">
                    <q-radio v-model="odeme[1]!.tip" val="nakit" label="Nakit Kasa(TL)" dense :disable="!odeme[1]?.tutar || (odeme[1]?.odemeTipiGrup ? isComboDisabled('nakit', odeme[1]!.odemeTipiGrup, 1) : false)" />
                    <div class="column items-end kredi-combo">
                      <q-radio v-model="odeme[1]!.tip" val="kredi" label="Kredi Kartları" dense :disable="!odeme[1]?.tutar || (odeme[1]?.odemeTipiGrup ? isComboDisabled('kredi', odeme[1]!.odemeTipiGrup, 1) : false)" />
                      <q-checkbox v-show="odeme[1]?.tip === 'kredi'" v-model="odeme[1]!.acenta" label="acenta" dense size="xs" color="secondary" class="acenta-checkbox" />
                    </div>
                    <q-radio v-model="odeme[1]!.tip" val="banka" label="Banka EFT" dense :disable="!odeme[1]?.tutar || (odeme[1]?.odemeTipiGrup ? isComboDisabled('banka', odeme[1]!.odemeTipiGrup, 1) : false)" />
                  </div>
                </div>
              <div class="row items-center q-mb-xs justify-between">
                <div class="q-ml-lg row items-center no-wrap">
                  <div class="row items-center no-wrap kredi-radio-container">
                    <q-option-group v-model="odeme[1]!.odemeTipiGrup" :options="odemeTipiGrupOptions.map(opt => ({ ...opt, disable: !odeme[1]?.tutar || !odeme[1]?.tip || (odeme[1]?.tip ? isComboDisabled(odeme[1]?.tip, opt.value, 1) : false) }))" color="secondary" inline dense class="q-mr-md" :disable="!odeme[1]?.tip || !odeme[1]?.tutar" />
                  </div>
                  <q-input v-if="odeme[1]?.odemeTipiGrup === 'ekhizmet'" v-model="odeme[1]!.ekHizmetNotu" dense outlined placeholder="Ek hizmet bilgisi girin..." style="max-width: 380px;" class="q-ml-sm" />
                </div>
                <div class="q-mr-lg">
                  <q-checkbox v-model="odeme[1]!.fis" label="Fiş Kes" class="q-mr-md" color="secondary" dense :disable="!odeme[1]?.tutar" />
                  <q-checkbox v-model="odeme[1]!.komisyon" label="Komisyon" color="secondary" dense :disable="!odeme[1]?.tutar" />
                </div>
              </div>
              </div>
            </transition>
            <transition name="expand-fade">
              <div v-if="showOdeme3" :class="['odeme-container q-pa-md q-mb-md', (2 > 0 && !odeme[2]?.tutar) ? 'soluk-renkli' : '']">
                <div class="row items-center q-mb-md">
                  <div class="odeme-label text-white q-pa-sm q-mr-md">Ödeme 3</div>
                  <q-input v-model="odeme[2]!.tutar" label="Tahsil Edilen (TL)" outlined dense class="tahsilat-input q-mr-md" style="max-width: 160px;" :input-style="{ textAlign: 'right' }" />
                  <div class="row items-center q-gutter-sm tip-group q-mr-lg">
                    <q-radio v-model="odeme[2]!.tip" val="nakit" label="Nakit Kasa(TL)" dense :disable="!odeme[2]?.tutar || (odeme[2]?.odemeTipiGrup ? isComboDisabled('nakit', odeme[2]!.odemeTipiGrup, 2) : false)" />
                    <div class="column items-end kredi-combo">
                      <q-radio v-model="odeme[2]!.tip" val="kredi" label="Kredi Kartları" dense :disable="!odeme[2]?.tutar || (odeme[2]?.odemeTipiGrup ? isComboDisabled('kredi', odeme[2]!.odemeTipiGrup, 2) : false)" />
                      <q-checkbox v-show="odeme[2]?.tip === 'kredi'" v-model="odeme[2]!.acenta" label="acenta" dense size="xs" color="secondary" class="acenta-checkbox" />
                    </div>
                    <q-radio v-model="odeme[2]!.tip" val="banka" label="Banka EFT" dense :disable="!odeme[2]?.tutar || (odeme[2]?.odemeTipiGrup ? isComboDisabled('banka', odeme[2]!.odemeTipiGrup, 2) : false)" />
                  </div>
                </div>
              <div class="row items-center q-mb-xs justify-between">
                <div class="q-ml-lg row items-center no-wrap">
                  <div class="row items-center no-wrap kredi-radio-container">
                    <q-option-group v-model="odeme[2]!.odemeTipiGrup" :options="odemeTipiGrupOptions.map(opt => ({ ...opt, disable: !odeme[2]?.tutar || !odeme[2]?.tip || (odeme[2]?.tip ? isComboDisabled(odeme[2]?.tip, opt.value, 2) : false) }))" color="secondary" inline dense class="q-mr-md" :disable="!odeme[2]?.tip || !odeme[2]?.tutar" />
                  </div>
                  <q-input v-if="odeme[2]?.odemeTipiGrup === 'ekhizmet'" v-model="odeme[2]!.ekHizmetNotu" dense outlined placeholder="Ek hizmet bilgisi girin..." style="max-width: 380px;" class="q-ml-sm" />
                </div>
                <div class="q-mr-lg">
                  <q-checkbox v-model="odeme[2]!.fis" label="Fiş Kes" class="q-mr-md" color="secondary" dense :disable="!odeme[2]?.tutar" />
                  <q-checkbox v-model="odeme[2]!.komisyon" label="Komisyon" color="secondary" dense :disable="!odeme[2]?.tutar" />
                </div>
              </div>
              </div>
            </transition>
            <transition name="expand-fade">
              <div v-if="showOdeme4" :class="['odeme-container q-pa-md q-mb-md', (3 > 0 && !odeme[3]?.tutar) ? 'soluk-renkli' : '']">
                <div class="row items-center q-mb-md">
                  <div class="odeme-label text-white q-pa-sm q-mr-md">Ödeme 4</div>
                  <q-input v-model="odeme[3]!.tutar" label="Tahsil Edilen (TL)" outlined dense class="tahsilat-input q-mr-md" style="max-width: 160px;" :input-style="{ textAlign: 'right' }" />
                  <div class="row items-center q-gutter-sm tip-group q-mr-lg">
                    <q-radio v-model="odeme[3]!.tip" val="nakit" label="Nakit Kasa(TL)" dense :disable="!odeme[3]?.tutar || (odeme[3]?.odemeTipiGrup ? isComboDisabled('nakit', odeme[3]!.odemeTipiGrup, 3) : false)" />
                    <div class="column items-end kredi-combo">
                      <q-radio v-model="odeme[3]!.tip" val="kredi" label="Kredi Kartları" dense :disable="!odeme[3]?.tutar || (odeme[3]?.odemeTipiGrup ? isComboDisabled('kredi', odeme[3]!.odemeTipiGrup, 3) : false)" />
                      <q-checkbox v-show="odeme[3]?.tip === 'kredi'" v-model="odeme[3]!.acenta" label="acenta" dense size="xs" color="secondary" class="acenta-checkbox" />
                    </div>
                    <q-radio v-model="odeme[3]!.tip" val="banka" label="Banka EFT" dense :disable="!odeme[3]?.tutar || (odeme[3]?.odemeTipiGrup ? isComboDisabled('banka', odeme[3]!.odemeTipiGrup, 3) : false)" />
                  </div>
                </div>
              <div class="row items-center q-mb-xs justify-between">
                <div class="q-ml-lg row items-center no-wrap">
                  <div class="row items-center no-wrap kredi-radio-container">
                    <q-option-group v-model="odeme[3]!.odemeTipiGrup" :options="odemeTipiGrupOptions.map(opt => ({ ...opt, disable: !odeme[3]?.tutar || !odeme[3]?.tip || (odeme[3]?.tip ? isComboDisabled(odeme[3]?.tip, opt.value, 3) : false) }))" color="secondary" inline dense class="q-mr-md" :disable="!odeme[3]?.tip || !odeme[3]?.tutar" />
                  </div>
                  <q-input v-if="odeme[3]?.odemeTipiGrup === 'ekhizmet'" v-model="odeme[3]!.ekHizmetNotu" dense outlined placeholder="Ek hizmet bilgisi girin..." style="max-width: 380px;" class="q-ml-sm" />
                </div>
                <div class="q-mr-lg">
                  <q-checkbox v-model="odeme[3]!.fis" label="Fiş Kes" class="q-mr-md" color="secondary" dense :disable="!odeme[3]?.tutar" />
                  <q-checkbox v-model="odeme[3]!.komisyon" label="Komisyon" color="secondary" dense :disable="!odeme[3]?.tutar" />
                </div>
              </div>
              </div>
            </transition>
            <transition name="expand-fade">
              <div v-if="showOdeme5" :class="['odeme-container q-pa-md q-mb-md', (4 > 0 && !odeme[4]?.tutar) ? 'soluk-renkli' : '']">
                <div class="row items-center q-mb-md">
                  <div class="odeme-label text-white q-pa-sm q-mr-md">Ödeme 5</div>
                  <q-input v-model="odeme[4]!.tutar" label="Tahsil Edilen (TL)" outlined dense class="tahsilat-input q-mr-md" style="max-width: 160px;" :input-style="{ textAlign: 'right' }" />
                  <div class="row items-center q-gutter-sm tip-group q-mr-lg">
                    <q-radio v-model="odeme[4]!.tip" val="nakit" label="Nakit Kasa(TL)" dense :disable="!odeme[4]?.tutar || (odeme[4]?.odemeTipiGrup ? isComboDisabled('nakit', odeme[4]!.odemeTipiGrup, 4) : false)" />
                    <div class="column items-end kredi-combo">
                      <q-radio v-model="odeme[4]!.tip" val="kredi" label="Kredi Kartları" dense :disable="!odeme[4]?.tutar || (odeme[4]?.odemeTipiGrup ? isComboDisabled('kredi', odeme[4]!.odemeTipiGrup, 4) : false)" />
                      <q-checkbox v-show="odeme[4]?.tip === 'kredi'" v-model="odeme[4]!.acenta" label="acenta" dense size="xs" color="secondary" class="acenta-checkbox" />
                    </div>
                    <q-radio v-model="odeme[4]!.tip" val="banka" label="Banka EFT" dense :disable="!odeme[4]?.tutar || (odeme[4]?.odemeTipiGrup ? isComboDisabled('banka', odeme[4]!.odemeTipiGrup, 4) : false)" />
                  </div>
                </div>
              <div class="row items-center q-mb-xs justify-between">
                <div class="q-ml-lg row items-center no-wrap">
                  <div class="row items-center no-wrap kredi-radio-container">
                    <q-option-group v-model="odeme[4]!.odemeTipiGrup" :options="odemeTipiGrupOptions.map(opt => ({ ...opt, disable: !odeme[4]?.tutar || !odeme[4]?.tip || (odeme[4]?.tip ? isComboDisabled(odeme[4]?.tip, opt.value, 4) : false) }))" color="secondary" inline dense class="q-mr-md" :disable="!odeme[4]?.tip || !odeme[4]?.tutar" />
                  </div>
                  <q-input v-if="odeme[4]?.odemeTipiGrup === 'ekhizmet'" v-model="odeme[4]!.ekHizmetNotu" dense outlined placeholder="Ek hizmet bilgisi girin..." style="max-width: 380px;" class="q-ml-sm" />
                </div>
                <div class="q-mr-lg">
                  <q-checkbox v-model="odeme[4]!.fis" label="Fiş Kes" class="q-mr-md" color="secondary" dense :disable="!odeme[4]?.tutar" />
                  <q-checkbox v-model="odeme[4]!.komisyon" label="Komisyon" color="secondary" dense :disable="!odeme[4]?.tutar" />
                </div>
              </div>
              </div>
            </transition>
            <div class="row items-start justify-center q-mb-md">
              <div class="depozito-container q-pa-md depozito-narrow-container">
                <div class="row items-center">
                  <div class="depozito-label text-white q-pa-sm q-mr-md text-left flex flex-column items-start justify-center" style="min-width: 150px; white-space: pre-line; word-break: break-word;">
                    Depozito<br />İşlemleri
                  </div>
                  <div class="row items-center">
                    <div class="column q-mr-lg">
                      <q-input v-model="depozito.alinan" label="Alınan Depozito" outlined dense class="tahsilat-input depozito-mini-input q-mb-xs" style="max-width: 160px; min-width: 80px; height: 35px; font-size: 0.95em;" :input-style="{ textAlign: 'right', height: '28px', padding: '0 6px' }" />
                      <q-input v-model="depozito.iade" label="Depozito İade" outlined dense class="tahsilat-input depozito-mini-input" style="max-width: 160px; min-width: 80px; height: 35px; font-size: 0.95em;" :input-style="{ textAlign: 'right', height: '28px', padding: '0 6px' }" />
                    </div>
                    <q-option-group v-model="depozito.tip" :options="odemeTipleri" color="primary" dense class="depozito-radio-group column" />
                  </div>
                </div>
              </div>
              <div class="column items-center justify-center q-ml-lg depozito-btns-col">
                <q-btn label="KAYDET" color="primary" class="form-btn q-mb-sm depozito-btn" size="lg" :disabled="isKaydetDisabled || kaydetLoading || isSaving" :loading="kaydetLoading || isSaving" @click="() => executeSave(onKaydet)" />
                <q-btn label="VAZGEÇ" color="secondary" class="form-btn depozito-btn" size="md" flat @click="onClose" />
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits } from 'vue';
import { api } from '../boot/axios';
import { useDoubleClickPrevention } from '../composables/useDoubleClickPrevention';
import { Notify } from 'quasar';
import { printSingleFis } from '../utils/fisPrint';

function debugLog(...args: unknown[]) {
  if (import.meta.env.MODE !== 'production') {
    console.log(...args);
  }
}

function onOpenCalculator() {
  window.dispatchEvent(new Event('openCalculator'))
}

// Global müşteri tipi - bu formun ihtiyaç duyduğu asgari alanlar
type GlobalMusteri = {
  MstrNo?: number;
  MstrTCN?: string;
  MstrAdi?: string;
  MstrHspTip?: string;
  KonaklamaTipi?: string;
  KnklmTip?: string;
  OdaYatak?: string;
  KnklmOdaNo?: string;
  KnklmYtkNo?: string;
  CariKod?: string;
  KnklmPlnTrh?: string;
};

const props = defineProps<{ show: boolean; musteriAdi: string }>();
const emit = defineEmits(['update:show', 'bakiyeGuncelle']);
const kaydetLoading = ref(false);

// Çift tıklama önleme
const { isProcessing: isSaving, executeOnce: executeSave } = useDoubleClickPrevention(2000);
const show = ref(props.show);
watch(() => props.show, v => show.value = v);
watch(show, v => emit('update:show', v));

// 🔥 DEBUG: Props değişikliklerini izle
watch(() => props.musteriAdi, (newValue) => {
  debugLog('🔥 OdemeIslemForm - musteriAdi prop değişti:', newValue);
}, { immediate: true });

watch(() => props.show, (newValue) => {
  debugLog('🔥 OdemeIslemForm - show prop değişti:', newValue);
  if (newValue) {
    debugLog('🔥 OdemeIslemForm - Modal açıldı, musteriAdi:', props.musteriAdi);
  }
}, { immediate: true });

const odemeTipleri = [
  { label: 'Nakit Kasa(TL)', value: 'nakit' },
  { label: 'Kredi Kartları', value: 'kredi' },
  { label: 'Banka EFT', value: 'banka' }
];

type OdemeKalemi = {
  tip: string;
  tutar: string | number;
  fis: boolean;
  komisyon: boolean;
  odemeTipiGrup: string;
  orijinalTutar: string | number;
  ekHizmetNotu: string;
    acenta?: boolean;
};

const getDefaultOdeme = (): OdemeKalemi[] => ([
  { tip: '', tutar: '', fis: false, komisyon: false, odemeTipiGrup: '', orijinalTutar: '', ekHizmetNotu: '', acenta: false },
  { tip: '', tutar: '', fis: false, komisyon: false, odemeTipiGrup: '', orijinalTutar: '', ekHizmetNotu: '', acenta: false },
  { tip: '', tutar: '', fis: false, komisyon: false, odemeTipiGrup: '', orijinalTutar: '', ekHizmetNotu: '', acenta: false },
  { tip: '', tutar: '', fis: false, komisyon: false, odemeTipiGrup: '', orijinalTutar: '', ekHizmetNotu: '', acenta: false },
  { tip: '', tutar: '', fis: false, komisyon: false, odemeTipiGrup: '', orijinalTutar: '', ekHizmetNotu: '', acenta: false }
]);
const getDefaultDepozito = () => ({
  alinan: '',
  iade: '',
  tip: 'nakit'
});

const odeme = ref<OdemeKalemi[]>(getDefaultOdeme());
const odemeTipiGrupOptions = [
  { label: 'Konaklama', value: 'konaklama' },
  { label: 'Ek Hizmet', value: 'ekhizmet' }
];

const depozito = ref(getDefaultDepozito());

// Müşterinin mevcut bakiyesi (depozito hariç)
const musteriBakiyesi = ref<number>(0);
// ✅ Yeni eklenen GELİR tutarı (cache'den gelecek - müşteri adı ile birlikte tutuluyor)
const yeniGelirTutari = ref<number>(0);
// ✅ Mevcut müşteri adı (cache temizleme için)
const currentMusteriAdi = ref<string>('');

// Modal açıldığında bakiyeyi ve GELİR tutarını al
watch(() => props.show, (newValue) => {
  if (newValue) {
    const win = window as { 
      selectedMusteriBakiye?: number;
      kartliIslemYeniGelirTutari?: number | { [musteriAdi: string]: number }; // ✅ Müşteri adı ile cache
    };
    musteriBakiyesi.value = win.selectedMusteriBakiye || 0;
    
    // ✅ Müşteri adı ile cache'den tutarı al
    currentMusteriAdi.value = props.musteriAdi || '';
    
    // Cache yapısını kontrol et - obje ise müşteri adına göre al, değilse eski yapıyı kullan
    if (win.kartliIslemYeniGelirTutari && typeof win.kartliIslemYeniGelirTutari === 'object' && !Array.isArray(win.kartliIslemYeniGelirTutari)) {
      // Yeni yapı: { [musteriAdi]: tutar }
      yeniGelirTutari.value = (win.kartliIslemYeniGelirTutari as { [key: string]: number })[currentMusteriAdi.value] || 0;
    } else {
      // Eski yapı: direkt sayı (geriye dönük uyumluluk)
      yeniGelirTutari.value = (typeof win.kartliIslemYeniGelirTutari === 'number') ? win.kartliIslemYeniGelirTutari : 0;
    }
    
    debugLog('🔥 OdemeIslemForm - Bakiye:', musteriBakiyesi.value, 'GELİR tutarı:', yeniGelirTutari.value, 'Müşteri:', currentMusteriAdi.value);
  } else {
    // ✅ Modal kapandığında sadece local state'i temizle, cache'i KAYDET/VAZGEÇ butonları temizleyecek
    yeniGelirTutari.value = 0;
    currentMusteriAdi.value = '';
  }
});

// Dinamik kalan bakiye hesaplama (depozito hariç, sadece ödemeler)
// ✅ GELİR tutarı bakiyeye ekleniyor
// ✅ Komisyon tutarı da bakiyeye ekleniyor (komisyon GELİR olarak kaydediliyor)
const kalanBakiye = computed(() => {
  let toplamOdeme = 0;
  let toplamKomisyon = 0;
  
  for (let i = 0; i < 5; i++) {
    const od = odeme.value[i];
    if (od && od.tutar) {
      toplamOdeme += Number(od.tutar);
      
      // Komisyon tutarını hesapla (varsa)
      if (od.komisyon && od.orijinalTutar && Number(od.tutar) > Number(od.orijinalTutar)) {
        const komisyonTutari = Number(od.tutar) - Number(od.orijinalTutar);
        if (komisyonTutari > 0) {
          toplamKomisyon += komisyonTutari;
        }
      }
    }
  }
  
  // ✅ GELİR tutarı ve komisyon tutarı bakiyeye ekleniyor: (Mevcut bakiye + Yeni GELİR + Komisyon) - Ödemeler
  return (musteriBakiyesi.value + yeniGelirTutari.value + toplamKomisyon) - toplamOdeme;
});

const komisyonOrani = ref<number>(0);

async function fetchKomisyonOrani() {
  try {
    const response = await api.get('/parametre/komisyon-orani');
    if (response.data.success && response.data.oran) {
      komisyonOrani.value = Number(response.data.oran);
    }
  } catch {
    komisyonOrani.value = 0;
  }
}

watch(show, (v) => {
  if (v) {
    void fetchKomisyonOrani();
  } else {
    // 🔥 MODAL KAPATILDIĞINDA STATS GÜNCELLEME EVENT'İNİ TETİKLE
    window.dispatchEvent(new Event('statsNeedsUpdate'));
  }
});

// Komisyon checkbox değiştiğinde textbox değerini oranla çarp/böl
for (let i = 0; i < 5; i++) {
  watch(
    () => odeme.value[i]?.komisyon,
    (yeni, eski) => {
      const odemeItem = odeme.value[i];
      if (!odemeItem || !komisyonOrani.value) return;
      if (yeni) {
        // Komisyon işaretlendi: mevcut tutarı sakla ve oranla çarp
        odemeItem.orijinalTutar = odemeItem.tutar;
        const tutar = Number(odemeItem.tutar);
        if (!tutar) return;
        odemeItem.tutar = String(Math.floor(tutar * (1 + komisyonOrani.value)));
      } else if (eski) {
        // Komisyon kaldırıldı: saklanan değeri geri yaz
        if (odemeItem.orijinalTutar !== undefined && odemeItem.orijinalTutar !== '') {
          odemeItem.tutar = odemeItem.orijinalTutar;
        }
      }
    }
  );
}

watch(() => depozito.value.alinan, (yeni) => {
  if (yeni && depozito.value.iade) {
    depozito.value.iade = '';
  }
});
watch(() => depozito.value.iade, (yeni) => {
  if (yeni && depozito.value.alinan) {
    depozito.value.alinan = '';
  }
});

// Tutar girildiğinde fiş kes checkbox'ı otomatik true olsun
for (let i = 0; i < 5; i++) {
  watch(
    () => odeme.value[i]?.tutar,
    (yeni, eski) => {
      const odemeItem = odeme.value[i];
      if (!odemeItem) return;
      if (yeni && !eski) {
        odemeItem.fis = true;
        console.log(`✅ Ödeme ${i + 1} için fiş kes otomatik aktifleştirildi`);
      }
      if (!yeni) {
        odemeItem.fis = false;
        console.log(`❌ Ödeme ${i + 1} için fiş kes deaktifleştirildi`);
      }
    }
  );
  
  // Fiş kes checkbox'ının değişimini izle
  watch(
    () => odeme.value[i]?.fis,
    (yeni, eski) => {
      const odemeItem = odeme.value[i];
      if (!odemeItem) return;
      console.log(`🔄 Ödeme ${i + 1} fiş kes değişti: ${eski} -> ${yeni}`);
    }
  );
}

const resetForm = () => {
  odeme.value = getDefaultOdeme();
  depozito.value = getDefaultDepozito();
};
const isComboDisabled = (tip: string, odemeTipiGrup: string, idx: number) => {
  if (!tip || !odemeTipiGrup) return false;
  return odeme.value.some((item, i) =>
    i !== idx && item.tip === tip && item.odemeTipiGrup === odemeTipiGrup
  );
};
function isOdemeValid(idx: number) {
  const item = odeme.value[idx];
  if (!item) return false;
  return !!item.tutar && !!item.tip && !!item.odemeTipiGrup;
}
const showOdeme2 = computed(() => isOdemeValid(0));
const showOdeme3 = computed(() => isOdemeValid(1));
const showOdeme4 = computed(() => isOdemeValid(2));
const showOdeme5 = computed(() => isOdemeValid(3));

const isKaydetDisabled = computed(() => {
  // En az bir geçerli ödeme
  const hasValidOdeme = odeme.value.some(item => !!item.tutar && !!item.tip && !!item.odemeTipiGrup);

  // Herhangi bir ödeme container'ında eksik/parsiyel bilgi var mı?
  const hasPartialInvalidOdeme = odeme.value.some(item => {
    const f1 = !!item.tutar;
    const f2 = !!item.tip;
    const f3 = !!item.odemeTipiGrup;
    const anyFilled = f1 || f2 || f3;
    const allFilled = f1 && f2 && f3;
    return anyFilled && !allFilled; // kısmi doldurulmuş ise geçersiz
  });

  // Depozito geçerli mi?
  const depoAnyAmount = !!depozito.value.alinan || !!depozito.value.iade;
  const depoTip = !!depozito.value.tip;
  const depozitoValid = depoAnyAmount && depoTip;
  // Ödeme konteynerlerinden herhangi biri kullanılıyor mu?
  const paymentAnyFilled = odeme.value.some(item => !!item.tutar || !!item.tip || !!item.odemeTipiGrup);
  // Depozito parsiyel/eksik mi? YALNIZCA hiçbir ödeme konteyneri kullanılmıyorken kontrol et
  const validateDepositOnly = !paymentAnyFilled;
  const depozitoPartialInvalid = validateDepositOnly && ((depoAnyAmount || depoTip) && !depozitoValid);

  // Kural: herhangi bir parsiyel veri varsa buton devre dışı; aksi halde en az bir geçerli giriş olmalı
  if (hasPartialInvalidOdeme || depozitoPartialInvalid) return true;
  // En az bir geçerli ödeme veya (hiç ödeme yoksa) geçerli depozito olmalı
  if (hasValidOdeme) return false;
  if (validateDepositOnly && depozitoValid) return false;
  return true;
});

// Tek fiş yazdırma fonksiyonu artık utils/fisPrint.ts'de
// Burada kullanmak için import edildi

async function onKaydet() {
  if (kaydetLoading.value) return;
  kaydetLoading.value = true;
  const win = window as Window & {
    kartliIslemSelectedNormalMusteri?: GlobalMusteri | null;
    selectedNormalMusteri?: GlobalMusteri | null;
  };
  const musteri: GlobalMusteri | null | undefined = win.kartliIslemSelectedNormalMusteri ?? win.selectedNormalMusteri ?? null;
  if (!musteri) {
    Notify.create({ type: 'warning', message: 'Seçili müşteri bulunamadı.' });
    kaydetLoading.value = false;
    return;
  }
  
  console.log('🔍 Seçili müşteri bilgileri:', musteri);
  console.log('🔍 Musteri objesi tüm özellikleri:', Object.keys(musteri));
  console.log('🔍 Musteri objesi JSON:', JSON.stringify(musteri, null, 2));
  
  // Borçlu/Alacaklı müşteriler için Cari Kod kontrolü
  const MstrTCN = musteri.MstrTCN || '';
  let musteriNo = musteri.MstrNo;
  
  // Eğer MstrTCN boş ve CariKod varsa, CariKod'dan müşteri numarasını çıkar
  const musteriAny = musteri as unknown as { CariKod?: string };
  if (!MstrTCN && musteriAny.CariKod) {
    const cariKodMatch = musteriAny.CariKod.match(/^[A-Z]{2}(\d+)$/);
    if (cariKodMatch) {
      musteriNo = parseInt(cariKodMatch[1]);
      console.log('🔢 Cari koddan çıkarılan müşteri no:', musteriNo);
    }
  }
  
  console.log('🔍 Kullanılacak MstrTCN:', MstrTCN);
  console.log('🔍 Kullanılacak musteriNo:', musteriNo);

  const islemKllnc = localStorage.getItem('username') || 'admin';
  const islemKayitlari = [];

  // 5 ödeme container'ı için
  for (let i = 0; i < 5; i++) {
    const od = odeme.value[i];
    if (od && od.tutar && od.tip && od.odemeTipiGrup) {
      islemKayitlari.push({
        musteriNo: musteriNo,
        MstrTCN,
        MstrAdi: musteri.MstrAdi,
        islemKllnc,
        islemArac: (od.tip === 'kredi' && od.acenta) ? 'Acenta Tahsilat' : (odemeTipleri.find(o => o.value === od.tip)?.label || od.tip),
        islemTip: 'Giren',
        islemGrup: odemeTipiGrupOptions.find(o => o.value === od.odemeTipiGrup)?.label || od.odemeTipiGrup,
        islemBilgi: od.odemeTipiGrup === 'ekhizmet' && od.ekHizmetNotu
          ? `Ek Hizmet - ${od.ekHizmetNotu}`
          : 'Cari hesaba mahsuben tahsil edilen...',
        islemTutar: Number(od.tutar),
        MstrHspTip: musteri.MstrHspTip,
        MstrKnklmTip: musteri.KonaklamaTipi || musteri.KnklmTip,
        MstrOdaYatak: musteri.OdaYatak || (musteri.KnklmOdaNo && musteri.KnklmYtkNo ? `${musteri.KnklmOdaNo}-${musteri.KnklmYtkNo}` : ''),
      });
      // Komisyon kaydı ekle
      if (od.komisyon && od.orijinalTutar && Number(od.tutar) > Number(od.orijinalTutar)) {
        const komisyonTutari = Number(od.tutar) - Number(od.orijinalTutar);
        if (komisyonTutari > 0) {
          islemKayitlari.push({
            musteriNo: musteriNo,
            MstrTCN,
            MstrAdi: musteri.MstrAdi,
            islemKllnc,
            islemArac: 'Cari İşlem',
            islemTip: 'GELİR',
            islemGrup: 'Komisyon Geliri',
            islemBilgi: (odemeTipleri.find(o => o.value === od.tip)?.label || od.tip) + ' Komisyon Geliri',
            islemTutar: komisyonTutari,
            MstrHspTip: musteri.MstrHspTip,
            MstrKnklmTip: musteri.KonaklamaTipi || musteri.KnklmTip,
            MstrOdaYatak: musteri.OdaYatak || (musteri.KnklmOdaNo && musteri.KnklmYtkNo ? `${musteri.KnklmOdaNo}-${musteri.KnklmYtkNo}` : ''),
          });
        }
      }
    }
  }

  // Depozito işlemleri için
  if (depozito.value.alinan && depozito.value.tip) {
    islemKayitlari.push({
      musteriNo: musteriNo,
      MstrTCN,
      MstrAdi: musteri.MstrAdi,
      islemKllnc,
      islemArac: odemeTipleri.find(o => o.value === depozito.value.tip)?.label || depozito.value.tip,
      islemTip: 'Giren',
      islemGrup: 'Konaklama',
      islemBilgi: 'Müşteri =DEPOZİTO TAHSİLATI=',
      islemTutar: Number(depozito.value.alinan),
      MstrHspTip: musteri.MstrHspTip,
      MstrKnklmTip: musteri.KonaklamaTipi || musteri.KnklmTip,
      MstrOdaYatak: musteri.OdaYatak || (musteri.KnklmOdaNo && musteri.KnklmYtkNo ? `${musteri.KnklmOdaNo}-${musteri.KnklmYtkNo}` : ''),
    });
  }
  if (depozito.value.iade && depozito.value.tip) {
    islemKayitlari.push({
      musteriNo: musteriNo,
      MstrTCN,
      MstrAdi: musteri.MstrAdi,
      islemKllnc,
      islemArac: odemeTipleri.find(o => o.value === depozito.value.tip)?.label || depozito.value.tip,
      islemTip: 'Çıkan',
      islemGrup: 'Konaklama',
      islemBilgi: 'Müşteri =DEPOZİTO İADESİ=',
      islemTutar: Number(depozito.value.iade),
      MstrHspTip: musteri.MstrHspTip,
      MstrKnklmTip: musteri.KonaklamaTipi || musteri.KnklmTip,
      MstrOdaYatak: musteri.OdaYatak || (musteri.KnklmOdaNo && musteri.KnklmYtkNo ? `${musteri.KnklmOdaNo}-${musteri.KnklmYtkNo}` : ''),
    });
  }

  if (islemKayitlari.length === 0) {
    Notify.create({ type: 'warning', message: 'En az bir tahsilat veya depozito işlemi girmelisiniz.' });
    kaydetLoading.value = false;
    return;
  }

  // Yeni eklenen GELİR kayıtlarının toplamını hesapla (tahsilat ve depozito hariç)
  // GELİR ve Çıkan kayıtları müşterinin borcudur
  // Giren kayıtları tahsilattır (buraya dahil olmamalı)
  const yeniGelirToplami = islemKayitlari
    .filter(k => (k.islemTip === 'GELİR' || k.islemTip === 'Çıkan') 
      && !k.islemBilgi.includes('=DEPOZİTO TAHSİLATI=')
      && !k.islemBilgi.includes('=DEPOZİTO İADESİ='))
    .reduce((sum, k) => sum + (k.islemTutar || 0), 0);
  
  console.log('🔍 Yeni eklenen GELİR toplamı:', yeniGelirToplami);
  console.log('🔍 İşlem kayıtları detayı:', islemKayitlari.map(k => ({ islemTip: k.islemTip, islemTutar: k.islemTutar, islemBilgi: k.islemBilgi })));

  try {
    //const response = await api.post('/islem-ekle', { islemler: islemKayitlari });
    const response = await api.post('/odeme-islem', { islemler: islemKayitlari });
    if (response.data.success) {
      Notify.create({ type: 'positive', message: response.data.message || 'Tahsilat işlemleri başarıyla kaydedildi.' });
      
      // Fiş yazdırma işlemini form resetlenmeden önce yap
      console.log('🎯 API başarılı, fiş yazdırma kontrolü yapılıyor...');
      
      // Fiş yazdırılacak ödemeleri bul
      const fisliOdemeler = odeme.value
        .map((od, i) => ({ ...od, index: i }))
        .filter(od => od.tutar && od.fis);
      
      console.log('🔍 Fiş yazdırma kontrolü:', {
        toplamOdeme: odeme.value.length,
        fisliOdemeler: fisliOdemeler.length,
        odemeDetaylari: odeme.value.map((od, i) => ({
          index: i,
          tutar: od.tutar,
          fis: od.fis,
          tip: od.tip,
          odemeTipiGrup: od.odemeTipiGrup,
          komisyon: od.komisyon
        }))
      });
      
      // Her ödeme için detaylı kontrol
      odeme.value.forEach((od, i) => {
        console.log(`📋 Ödeme ${i + 1}:`, {
          tutar: od.tutar,
          fis: od.fis,
          tip: od.tip,
          odemeTipiGrup: od.odemeTipiGrup,
          komisyon: od.komisyon,
          tutarVar: !!od.tutar,
          fisVar: !!od.fis,
          tipVar: !!od.tip,
          grupVar: !!od.odemeTipiGrup
        });
      });
      
      // Fiş yazdırma kontrolü - Ödeme VEYA depozito varsa fiş bas
      if (fisliOdemeler.length > 0 || (depozito.value.alinan && depozito.value.tip)) {
        console.log('🎫 Tek fiş yazdırma başlıyor...');
        
        // Maksimum islemno değerini backend'den al
        let fisNo = 0;
        try {
          const maxIslemnoResponse = await api.get('/odeme-islem/max-islemno');
          fisNo = (maxIslemnoResponse.data.maxIslemno || 0) + 1;
          console.log('🔢 Fiş numarası:', fisNo);
        } catch (error) {
          console.error('❌ Maksimum islemno alınamadı:', error);
          fisNo = 1;
        }
        
        // TEK FİŞ YAZDIR
        await printSingleFis(
          fisliOdemeler,
          {
            MstrAdi: musteri.MstrAdi,
            OdaYatak: musteri.OdaYatak,
            KnklmOdaNo: musteri.KnklmOdaNo,
            KnklmYtkNo: musteri.KnklmYtkNo,
            MstrNo: musteri.MstrNo,
            MstrTCN: musteri.MstrTCN,
            MstrHspTip: musteri.MstrHspTip,
            CariKod: musteri.CariKod,
            KnklmPlnTrh: musteri.KnklmPlnTrh
          },
          islemKllnc,
          fisNo,
          depozito.value.alinan ? Number(depozito.value.alinan) : undefined,
          depozito.value.tip ? odemeTipleri.find(o => o.value === depozito.value.tip)?.label : undefined,
          yeniGelirToplami,
          kalanBakiye.value
        );
        
        console.log('🎉 Tek fiş yazdırma tamamlandı');
      } else {
        console.log('❌ Fiş yazdırılacak ödeme veya depozito bulunamadı');
      }
      
      // Form resetleme işlemini en sona al
      resetForm();
      console.log('BAKİYE GÜNCELLE EMIT', musteri);
      emit('bakiyeGuncelle', musteri);
      
      // ✅ KAYDET butonu ile kapatıldığında müşteri adına göre cache'i temizle
      const win = window as Window & { kartliIslemYeniGelirTutari?: number | { [musteriAdi: string]: number } };
      if (win.kartliIslemYeniGelirTutari && typeof win.kartliIslemYeniGelirTutari === 'object' && !Array.isArray(win.kartliIslemYeniGelirTutari)) {
        // Yeni yapı: müşteri adına göre temizle
        const cacheObj = win.kartliIslemYeniGelirTutari as { [key: string]: number };
        if (currentMusteriAdi.value && cacheObj[currentMusteriAdi.value] !== undefined) {
          delete cacheObj[currentMusteriAdi.value];
          debugLog('🔥 KAYDET - Cache temizlendi:', currentMusteriAdi.value);
        }
        // Eğer cache objesi boşaldıysa tamamen sil
        if (Object.keys(cacheObj).length === 0) {
          delete win.kartliIslemYeniGelirTutari;
        }
      } else {
        // Eski yapı: direkt sil
        if (win.kartliIslemYeniGelirTutari !== undefined) {
          delete win.kartliIslemYeniGelirTutari;
        }
      }
      
      // 🔥 STATS GÜNCELLEME EVENT'İNİ TETİKLE
      window.dispatchEvent(new Event('statsNeedsUpdate'));
      
      show.value = false;
    } else {
      Notify.create({ type: 'negative', message: response.data.message || 'Tahsilat işlemleri kaydedilemedi.' });
    }
  } catch (err) {
    Notify.create({ type: 'negative', message: 'Sunucu hatası: ' + (err instanceof Error ? err.message : String(err)) });
  }
  finally {
    kaydetLoading.value = false;
  }

  // Fiş yazdırma işlemi artık API başarılı olduktan sonra yapılıyor
}

function onClose() {
  resetForm();
  
  // ✅ VAZGEÇ butonu ile kapatıldığında müşteri adına göre cache'i temizle
  const win = window as Window & { kartliIslemYeniGelirTutari?: number | { [musteriAdi: string]: number } };
  if (win.kartliIslemYeniGelirTutari && typeof win.kartliIslemYeniGelirTutari === 'object' && !Array.isArray(win.kartliIslemYeniGelirTutari)) {
    // Yeni yapı: müşteri adına göre temizle
    const cacheObj = win.kartliIslemYeniGelirTutari as { [key: string]: number };
    if (currentMusteriAdi.value && cacheObj[currentMusteriAdi.value] !== undefined) {
      delete cacheObj[currentMusteriAdi.value];
      debugLog('🔥 VAZGEÇ - Cache temizlendi:', currentMusteriAdi.value);
    }
    // Eğer cache objesi boşaldıysa tamamen sil
    if (Object.keys(cacheObj).length === 0) {
      delete win.kartliIslemYeniGelirTutari;
    }
  } else {
    // Eski yapı: direkt sil
    if (win.kartliIslemYeniGelirTutari !== undefined) {
      delete win.kartliIslemYeniGelirTutari;
    }
  }
  
  // 🔥 VAZGEÇ DURUMUNDA DA STATS GÜNCELLEME EVENT'İNİ TETİKLE
  window.dispatchEvent(new Event('statsNeedsUpdate'));
  
  show.value = false;
}

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
</script>

<style scoped>
.tahsilat-form-wrapper {
  max-width: 700px;
  margin: 24px auto 0 auto;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1.5px 6px rgba(0,0,0,0.04);
  padding: 16px 12px 20px 12px;
  border: 1.5px solid #e0e7ef;
}
.odeme-container {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1.5px solid #1976d2; /* Mavi ton */
  padding: 10px 8px 8px 8px;
}
.depozito-container {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1.5px solid #546e7a; /* Gri-mavi ton */
  padding: 10px 8px 8px 8px;
}
.odeme-label {
  background: linear-gradient(135deg, #1976d2 0%, #64b5f6 100%);
  border-radius: 10px;
  min-width: 80px;
  text-align: center;
  font-weight: 600;
  letter-spacing: 1px;
  font-size: 1.1rem;
  box-shadow: 0 1px 4px rgba(25,118,210,0.08);
}
.depozito-label {
  background: linear-gradient(135deg, #546e7a 0%, #b0bec5 100%);
  border-radius: 10px;
  min-width: 120px;
  text-align: center;
  font-weight: 600;
  letter-spacing: 1px;
  font-size: 1.1rem;
  box-shadow: 0 1px 4px rgba(84,110,122,0.08);
}
.tahsilat-input :deep(.q-field__control) {
  border-radius: 8px;
}
.form-btn {
  min-width: 160px;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 1px;
}
.kredi-radio-container { align-items: center; }
.acenta-checkbox { margin-left: 8px; }
.depozito-mini-input :deep(.q-field__control) {
  min-height: 28px !important;
  height: 28px !important;
  font-size: 0.95em !important;
  padding: 0 6px !important;
}
.depozito-narrow-container {
  min-width: 500px;
  max-width: 555px;
  margin-left: auto;
  margin-right: auto;
}
.depozito-btns-col {
  min-width: 150px;
}
.depozito-btn {
  min-width: 90px;
  width: 100%;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 600;
  letter-spacing: 1px;
}
.tahsilat-input :deep(.q-field__label),
.depozito-mini-input :deep(.q-field__label) {
  color: #b0b8c1 !important;
}
.tahsilat-input input::placeholder,
.depozito-mini-input input::placeholder {
  color: #b0b8c1 !important;
  opacity: 1;
}
.odeme-container.soluk-renkli {
  opacity: 0.15;
  filter: grayscale(0.5) brightness(1.15);
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 60%, #f1f5f9 100%) !important;
}
.expand-fade-enter-active, .expand-fade-leave-active {
  transition: max-height 0.9s cubic-bezier(.9,0,.9,1), opacity 0.9s cubic-bezier(.9,0,.9,1);
  overflow: hidden;
}
.expand-fade-enter-from, .expand-fade-leave-to {
  max-height: 0;
  opacity: 0;
}
.expand-fade-enter-to, .expand-fade-leave-from {
  max-height: 600px;
  opacity: 1;
}
.tahsilat-page-center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.body--dark .tahsilat-form-wrapper {
  background: linear-gradient(135deg, #23272f 0%, #181c22 100%) !important;
  border: 1.5px solid #2d3748;
  color: #e0e7ef;
}
.body--dark .odeme-container {
  background: linear-gradient(135deg, #23272f 0%, #181c22 100%) !important;
  border: 1.5px solid #64b5f6; /* Açık mavi ton */
  color: #e0e7ef;
}
.body--dark .depozito-container {
  background: linear-gradient(135deg, #23272f 0%, #181c22 100%) !important;
  border: 1.5px solid #b0bec5; /* Açık gri-mavi ton */
  color: #e0e7ef;
}
.body--dark .odeme-label {
  background: linear-gradient(135deg, #1976d2 0%, #64b5f6 100%);
  color: #fff;
}
.body--dark .depozito-label {
  background: linear-gradient(135deg, #546e7a 0%, #b0bec5 100%);
  color: #fff;
}
.body--dark .form-btn {
  background: #23272f;
  color: #e0e7ef;
  border: 1px solid #2d3748;
}
.body--dark .tahsilat-input :deep(.q-field__label),
.body--dark .depozito-mini-input :deep(.q-field__label) {
  color: #7a869a !important;
}
.body--dark .tahsilat-input input::placeholder,
.body--dark .depozito-mini-input input::placeholder {
  color: #7a869a !important;
  opacity: 1;
}
/* Kredi Kartları + acenta dikey container ve küçük checkbox */
.kredi-combo { min-width: 119px; margin-left: 1px; }
.acenta-checkbox :deep(.q-checkbox__inner) { transform: scale(0.85); }
.acenta-checkbox :deep(.q-checkbox__label) { font-size: 0.85em; }
.tip-group {
  max-width: 374px;
  flex-wrap: nowrap;
  align-items: center;
  gap: 1px;
}

/* Müşteri Tahsilat Modal zemin rengi - Dark mode için bir ton açık */
.odeme-islem-modal-card {
  background: #ffffff;
}

body.body--dark .odeme-islem-modal-card {
  background: #424242 !important; /* Dark mode için bir ton açık */
}
</style> 