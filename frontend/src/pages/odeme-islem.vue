<template>
  <q-page class="q-pa-md light-page-background tahsilat-page-center">
    <div class="text-h6 text-center q-mb-lg">Müşteri Tahsilat Formu</div>
    <div class="tahsilat-form-wrapper">
      <div class="row items-center q-mb-lg">
        <div class="text-subtitle1 q-mr-md">Müşteri Adı:</div>
        <div class="text-body1 text-weight-medium">{{ musteriAdi }}</div>
      </div>

      <div class="q-gutter-md">
        <div v-if="true" :class="['odeme-container q-pa-md q-mb-md', (0 > 0 && !odeme[0]?.tutar) ? 'soluk-renkli' : '']">
          <div class="row items-center q-mb-md">
            <div class="odeme-label text-white q-pa-sm q-mr-md">Ödeme 1</div>
            <q-input
              v-model="odeme[0]!.tutar"
              label="Tahsil Edilen (TL)"
              outlined
              dense
              class="tahsilat-input q-mr-md"
              style="max-width: 160px;"
              :input-style="{ textAlign: 'right' }"
            />
            <q-option-group
              v-model="odeme[0]!.tip"
              :options="odemeTipleri.map(opt => ({
                ...opt,
                disable: odeme[0]!.odemeTipiGrup ? isComboDisabled(opt.value, odeme[0]!.odemeTipiGrup, 0) : false
              }))"
              color="primary"
              inline
              dense
              class="q-mr-lg"
            />
          </div>
          <div class="row items-center q-mb-xs justify-between">
            <div class="q-ml-lg">
              <q-option-group
                v-model="odeme[0]!.odemeTipiGrup"
                :options="odemeTipiGrupOptions.map(opt => ({
                  ...opt,
                  disable: odeme[0]!.tip ? isComboDisabled(odeme[0]!.tip, opt.value, 0) : false
                }))"
                color="secondary"
                inline
                dense
                class="q-mr-lg"
              />
            </div>
            <div class="q-mr-lg">
              <q-checkbox v-model="odeme[0]!.fis" label="Fiş Kes" class="q-mr-md" color="secondary" dense />
              <q-checkbox v-model="odeme[0]!.komisyon" label="Komisyon" color="secondary" dense />
            </div>
          </div>
        </div>
        <transition name="expand-fade">
          <div v-if="showOdeme2" :class="['odeme-container q-pa-md q-mb-md', (1 > 0 && !odeme[1]?.tutar) ? 'soluk-renkli' : '']">
            <div class="row items-center q-mb-md">
              <div class="odeme-label text-white q-pa-sm q-mr-md">Ödeme 2</div>
              <q-input
                v-model="odeme[1]!.tutar"
                label="Tahsil Edilen (TL)"
                outlined
                dense
                class="tahsilat-input q-mr-md"
                style="max-width: 160px;"
                :input-style="{ textAlign: 'right' }"
              />
              <q-option-group
                v-model="odeme[1]!.tip"
                :options="odemeTipleri.map(opt => ({
                  ...opt,
                  disable: odeme[1]?.odemeTipiGrup ? isComboDisabled(opt.value, odeme[1]?.odemeTipiGrup, 1) : false
                }))"
                color="primary"
                inline
                dense
                class="q-mr-lg"
              />
            </div>
            <div class="row items-center q-mb-xs justify-between">
              <div class="q-ml-lg">
                <q-option-group
                  v-model="odeme[1]!.odemeTipiGrup"
                  :options="odemeTipiGrupOptions.map(opt => ({
                    ...opt,
                    disable: odeme[1]?.tip ? isComboDisabled(odeme[1]?.tip, opt.value, 1) : false
                  }))"
                  color="secondary"
                  inline
                  dense
                  class="q-mr-lg"
                />
              </div>
              <div class="q-mr-lg">
                <q-checkbox v-model="odeme[1]!.fis" label="Fiş Kes" class="q-mr-md" color="secondary" dense />
                <q-checkbox v-model="odeme[1]!.komisyon" label="Komisyon" color="secondary" dense />
              </div>
            </div>
          </div>
        </transition>
        <transition name="expand-fade">
          <div v-if="showOdeme3" :class="['odeme-container q-pa-md q-mb-md', (2 > 0 && !odeme[2]?.tutar) ? 'soluk-renkli' : '']">
            <div class="row items-center q-mb-md">
              <div class="odeme-label text-white q-pa-sm q-mr-md">Ödeme 3</div>
              <q-input
                v-model="odeme[2]!.tutar"
                label="Tahsil Edilen (TL)"
                outlined
                dense
                class="tahsilat-input q-mr-md"
                style="max-width: 160px;"
                :input-style="{ textAlign: 'right' }"
              />
              <q-option-group
                v-model="odeme[2]!.tip"
                :options="odemeTipleri.map(opt => ({
                  ...opt,
                  disable: odeme[2]?.odemeTipiGrup ? isComboDisabled(opt.value, odeme[2]?.odemeTipiGrup, 2) : false
                }))"
                color="primary"
                inline
                dense
                class="q-mr-lg"
              />
            </div>
            <div class="row items-center q-mb-xs justify-between">
              <div class="q-ml-lg">
                <q-option-group
                  v-model="odeme[2]!.odemeTipiGrup"
                  :options="odemeTipiGrupOptions.map(opt => ({
                    ...opt,
                    disable: odeme[2]?.tip ? isComboDisabled(odeme[2]?.tip, opt.value, 2) : false
                  }))"
                  color="secondary"
                  inline
                  dense
                  class="q-mr-lg"
                />
              </div>
              <div class="q-mr-lg">
                <q-checkbox v-model="odeme[2]!.fis" label="Fiş Kes" class="q-mr-md" color="secondary" dense />
                <q-checkbox v-model="odeme[2]!.komisyon" label="Komisyon" color="secondary" dense />
              </div>
            </div>
          </div>
        </transition>
        <transition name="expand-fade">
          <div v-if="showOdeme4" :class="['odeme-container q-pa-md q-mb-md', (3 > 0 && !odeme[3]?.tutar) ? 'soluk-renkli' : '']">
            <div class="row items-center q-mb-md">
              <div class="odeme-label text-white q-pa-sm q-mr-md">Ödeme 4</div>
              <q-input
                v-model="odeme[3]!.tutar"
                label="Tahsil Edilen (TL)"
                outlined
                dense
                class="tahsilat-input q-mr-md"
                style="max-width: 160px;"
                :input-style="{ textAlign: 'right' }"
              />
              <q-option-group
                v-model="odeme[3]!.tip"
                :options="odemeTipleri.map(opt => ({
                  ...opt,
                  disable: odeme[3]?.odemeTipiGrup ? isComboDisabled(opt.value, odeme[3]?.odemeTipiGrup, 3) : false
                }))"
                color="primary"
                inline
                dense
                class="q-mr-lg"
              />
            </div>
            <div class="row items-center q-mb-xs justify-between">
              <div class="q-ml-lg">
                <q-option-group
                  v-model="odeme[3]!.odemeTipiGrup"
                  :options="odemeTipiGrupOptions.map(opt => ({
                    ...opt,
                    disable: odeme[3]?.tip ? isComboDisabled(odeme[3]?.tip, opt.value, 3) : false
                  }))"
                  color="secondary"
                  inline
                  dense
                  class="q-mr-lg"
                />
              </div>
              <div class="q-mr-lg">
                <q-checkbox v-model="odeme[3]!.fis" label="Fiş Kes" class="q-mr-md" color="secondary" dense />
                <q-checkbox v-model="odeme[3]!.komisyon" label="Komisyon" color="secondary" dense />
              </div>
            </div>
          </div>
        </transition>
        <transition name="expand-fade">
          <div v-if="showOdeme5" :class="['odeme-container q-pa-md q-mb-md', (4 > 0 && !odeme[4]?.tutar) ? 'soluk-renkli' : '']">
            <div class="row items-center q-mb-md">
              <div class="odeme-label text-white q-pa-sm q-mr-md">Ödeme 5</div>
              <q-input
                v-model="odeme[4]!.tutar"
                label="Tahsil Edilen (TL)"
                outlined
                dense
                class="tahsilat-input q-mr-md"
                style="max-width: 160px;"
                :input-style="{ textAlign: 'right' }"
              />
              <q-option-group
                v-model="odeme[4]!.tip"
                :options="odemeTipleri.map(opt => ({
                  ...opt,
                  disable: odeme[4]?.odemeTipiGrup ? isComboDisabled(opt.value, odeme[4]?.odemeTipiGrup, 4) : false
                }))"
                color="primary"
                inline
                dense
                class="q-mr-lg"
              />
            </div>
            <div class="row items-center q-mb-xs justify-between">
              <div class="q-ml-lg">
                <q-option-group
                  v-model="odeme[4]!.odemeTipiGrup"
                  :options="odemeTipiGrupOptions.map(opt => ({
                    ...opt,
                    disable: odeme[4]?.tip ? isComboDisabled(odeme[4]?.tip, opt.value, 4) : false
                  }))"
                  color="secondary"
                  inline
                  dense
                  class="q-mr-lg"
                />
              </div>
              <div class="q-mr-lg">
                <q-checkbox v-model="odeme[4]!.fis" label="Fiş Kes" class="q-mr-md" color="secondary" dense />
                <q-checkbox v-model="odeme[4]!.komisyon" label="Komisyon" color="secondary" dense />
              </div>
            </div>
          </div>
        </transition>

        <div class="row items-start justify-center q-mb-md">
          <div class="depozito-container q-pa-md depozito-narrow-container">
            <div class="row items-center">
              <div class="depozito-label text-white q-pa-sm q-mr-md text-left flex flex-column items-start justify-center" style="min-width: 150px; white-space: pre-line; word-break: break-word;">
                Depozito
                <br />
                İşlemleri
              </div>
              <div class="row items-center">
                <div class="column q-mr-lg">
                  <q-input
                    v-model="depozito.alinan"
                    label="Alınan Depozito"
                    outlined
                    dense
                    class="tahsilat-input depozito-mini-input q-mb-xs"
                    style="max-width: 160px; min-width: 80px; height: 35px; font-size: 0.95em;"
                    :input-style="{ textAlign: 'right', height: '28px', padding: '0 6px' }"
                  />
                  <q-input
                    v-model="depozito.iade"
                    label="Depozito İade"
                    outlined
                    dense
                    class="tahsilat-input depozito-mini-input"
                    style="max-width: 160px; min-width: 80px; height: 35px; font-size: 0.95em;"
                    :input-style="{ textAlign: 'right', height: '28px', padding: '0 6px' }"
                  />
                </div>
                <q-option-group
                  v-model="depozito.tip"
                  :options="odemeTipleri"
                  color="primary"
                  dense
                  class="depozito-radio-group column"
                />
              </div>
            </div>
          </div>
          <div class="column items-center justify-center q-ml-lg depozito-btns-col">
            <q-btn label="KAYDET" color="primary" class="form-btn q-mb-sm depozito-btn" size="lg" :disabled="isKaydetDisabled" />
            <q-btn label="VAZGEÇ" color="secondary" class="form-btn depozito-btn" size="md" flat @click="resetForm" />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { selectedCustomer } from 'src/stores/selected-customer';

const router = useRouter();

onMounted(() => {
  if (!selectedCustomer.value) {
    void router.replace('/kartli-islem');
  }
});

const musteriAdi = computed(() => selectedCustomer.value?.name || '');

const odemeTipleri = [
  { label: 'Nakit Kasa(TL)', value: 'nakit' },
  { label: 'Kredi Kartları', value: 'kredi' },
  { label: 'Banka EFT', value: 'banka' }
];

const getDefaultOdeme = () => ([
  { tip: '', tutar: '', fis: false, komisyon: false, odemeTipiGrup: '' },
  { tip: '', tutar: '', fis: false, komisyon: false, odemeTipiGrup: '' },
  { tip: '', tutar: '', fis: false, komisyon: false, odemeTipiGrup: '' },
  { tip: '', tutar: '', fis: false, komisyon: false, odemeTipiGrup: '' },
  { tip: '', tutar: '', fis: false, komisyon: false, odemeTipiGrup: '' }
]);
const getDefaultDepozito = () => ({
  alinan: '',
  iade: '',
  tip: 'nakit'
});

const odeme = ref(getDefaultOdeme());
const odemeTipiGrupOptions = [
  { label: 'Konaklama', value: 'konaklama' },
  { label: 'Ek Hizmet', value: 'ekhizmet' }
];

const depozito = ref(getDefaultDepozito());

const resetForm = () => {
  odeme.value = getDefaultOdeme();
  depozito.value = getDefaultDepozito();
};
// Diğer gruplarda seçili olan tipleri disable etmek için fonksiyon
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
  // Ödeme container'larında en az birinde hem textbox dolu hem de iki radio seçili mi?
  const odemeValid = odeme.value.some(item =>
    !!item.tutar && !!item.tip && !!item.odemeTipiGrup
  );
  // Depozito işlemlerinde textbox dolu ve 3'lü radio seçili mi?
  const depozitoValid =
    (!!depozito.value.alinan || !!depozito.value.iade) && !!depozito.value.tip;
  return !(odemeValid || depozitoValid);
});
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
/* Depozito işlemleri için küçük inputlar */
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
</style>

<style scoped>
.tahsilat-page-center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
</style>

<style scoped>
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
</style> 