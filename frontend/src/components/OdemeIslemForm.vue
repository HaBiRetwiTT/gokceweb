

<template>
  <q-dialog v-model="show" persistent transition-show="fade" transition-hide="fade">
    <q-card style="min-width: 700px; max-width: 98vw;">
      <q-card-section>
        <div class="text-h6 text-center q-mb-lg">Müşteri Tahsilat Formu</div>
        <div class="tahsilat-form-wrapper">
          <div class="row items-center q-mb-lg">
            <div class="text-subtitle1 q-mr-md">Müşteri Adı:</div>
            <div class="text-body1 text-weight-medium">{{ props.musteriAdi }}</div>
          </div>
          <div class="q-gutter-md">
            <div v-if="true" :class="['odeme-container q-pa-md q-mb-md', (0 > 0 && !odeme[0]?.tutar) ? 'soluk-renkli' : '']">
              <div class="row items-center q-mb-md">
                <div class="odeme-label text-white q-pa-sm q-mr-md">Ödeme 1</div>
                <q-input v-model="odeme[0]!.tutar" label="Tahsil Edilen (TL)" outlined dense class="tahsilat-input q-mr-md" style="max-width: 160px;" :input-style="{ textAlign: 'right' }" />
                <q-option-group v-model="odeme[0]!.tip" :options="odemeTipleri.map(opt => ({ ...opt, disable: !odeme[0]!.tutar || (odeme[0]!.odemeTipiGrup ? isComboDisabled(opt.value, odeme[0]!.odemeTipiGrup, 0) : false) }))" color="primary" inline dense class="q-mr-lg" />
              </div>
              <div class="row items-center q-mb-xs justify-between">
                <div class="q-ml-lg">
                  <q-option-group v-model="odeme[0]!.odemeTipiGrup" :options="odemeTipiGrupOptions.map(opt => ({ ...opt, disable: !odeme[0]!.tutar || !odeme[0]!.tip || (odeme[0]!.tip ? isComboDisabled(odeme[0]!.tip, opt.value, 0) : false) }))" color="secondary" inline dense class="q-mr-lg" :disable="!odeme[0]!.tip || !odeme[0]!.tutar" />
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
                  <q-option-group v-model="odeme[1]!.tip" :options="odemeTipleri.map(opt => ({ ...opt, disable: !odeme[1]?.tutar || (odeme[1]?.odemeTipiGrup ? isComboDisabled(opt.value, odeme[1]?.odemeTipiGrup, 1) : false) }))" color="primary" inline dense class="q-mr-lg" />
                </div>
                <div class="row items-center q-mb-xs justify-between">
                  <div class="q-ml-lg">
                    <q-option-group v-model="odeme[1]!.odemeTipiGrup" :options="odemeTipiGrupOptions.map(opt => ({ ...opt, disable: !odeme[1]?.tutar || !odeme[1]?.tip || (odeme[1]?.tip ? isComboDisabled(odeme[1]?.tip, opt.value, 1) : false) }))" color="secondary" inline dense class="q-mr-lg" :disable="!odeme[1]?.tip || !odeme[1]?.tutar" />
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
                  <q-option-group v-model="odeme[2]!.tip" :options="odemeTipleri.map(opt => ({ ...opt, disable: !odeme[2]?.tutar || (odeme[2]?.odemeTipiGrup ? isComboDisabled(opt.value, odeme[2]?.odemeTipiGrup, 2) : false) }))" color="primary" inline dense class="q-mr-lg" />
                </div>
                <div class="row items-center q-mb-xs justify-between">
                  <div class="q-ml-lg">
                    <q-option-group v-model="odeme[2]!.odemeTipiGrup" :options="odemeTipiGrupOptions.map(opt => ({ ...opt, disable: !odeme[2]?.tutar || !odeme[2]?.tip || (odeme[2]?.tip ? isComboDisabled(odeme[2]?.tip, opt.value, 2) : false) }))" color="secondary" inline dense class="q-mr-lg" :disable="!odeme[2]?.tip || !odeme[2]?.tutar" />
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
                  <q-option-group v-model="odeme[3]!.tip" :options="odemeTipleri.map(opt => ({ ...opt, disable: !odeme[3]?.tutar || (odeme[3]?.odemeTipiGrup ? isComboDisabled(opt.value, odeme[3]?.odemeTipiGrup, 3) : false) }))" color="primary" inline dense class="q-mr-lg" />
                </div>
                <div class="row items-center q-mb-xs justify-between">
                  <div class="q-ml-lg">
                    <q-option-group v-model="odeme[3]!.odemeTipiGrup" :options="odemeTipiGrupOptions.map(opt => ({ ...opt, disable: !odeme[3]?.tutar || !odeme[3]?.tip || (odeme[3]?.tip ? isComboDisabled(odeme[3]?.tip, opt.value, 3) : false) }))" color="secondary" inline dense class="q-mr-lg" :disable="!odeme[3]?.tip || !odeme[3]?.tutar" />
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
                  <q-option-group v-model="odeme[4]!.tip" :options="odemeTipleri.map(opt => ({ ...opt, disable: !odeme[4]?.tutar || (odeme[4]?.odemeTipiGrup ? isComboDisabled(opt.value, odeme[4]?.odemeTipiGrup, 4) : false) }))" color="primary" inline dense class="q-mr-lg" />
                </div>
                <div class="row items-center q-mb-xs justify-between">
                  <div class="q-ml-lg">
                    <q-option-group v-model="odeme[4]!.odemeTipiGrup" :options="odemeTipiGrupOptions.map(opt => ({ ...opt, disable: !odeme[4]?.tutar || !odeme[4]?.tip || (odeme[4]?.tip ? isComboDisabled(odeme[4]?.tip, opt.value, 4) : false) }))" color="secondary" inline dense class="q-mr-lg" :disable="!odeme[4]?.tip || !odeme[4]?.tutar" />
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
                <q-btn label="KAYDET" color="primary" class="form-btn q-mb-sm depozito-btn" size="lg" :disabled="isKaydetDisabled" @click="onKaydet" />
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
import { Notify } from 'quasar';

const props = defineProps<{ show: boolean; musteriAdi: string }>();
const emit = defineEmits(['update:show', 'bakiyeGuncelle']);
const show = ref(props.show);
watch(() => props.show, v => show.value = v);
watch(show, v => emit('update:show', v));

// 🔥 DEBUG: Props değişikliklerini izle
watch(() => props.musteriAdi, (newValue) => {
  console.log('🔥 OdemeIslemForm - musteriAdi prop değişti:', newValue);
}, { immediate: true });

watch(() => props.show, (newValue) => {
  console.log('🔥 OdemeIslemForm - show prop değişti:', newValue);
  if (newValue) {
    console.log('🔥 OdemeIslemForm - Modal açıldı, musteriAdi:', props.musteriAdi);
  }
}, { immediate: true });

const odemeTipleri = [
  { label: 'Nakit Kasa(TL)', value: 'nakit' },
  { label: 'Kredi Kartları', value: 'kredi' },
  { label: 'Banka EFT', value: 'banka' }
];

const getDefaultOdeme = () => ([
  { tip: '', tutar: '', fis: false, komisyon: false, odemeTipiGrup: '', orijinalTutar: '' },
  { tip: '', tutar: '', fis: false, komisyon: false, odemeTipiGrup: '', orijinalTutar: '' },
  { tip: '', tutar: '', fis: false, komisyon: false, odemeTipiGrup: '', orijinalTutar: '' },
  { tip: '', tutar: '', fis: false, komisyon: false, odemeTipiGrup: '', orijinalTutar: '' },
  { tip: '', tutar: '', fis: false, komisyon: false, odemeTipiGrup: '', orijinalTutar: '' }
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
  if (v) void fetchKomisyonOrani();
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
  const odemeValid = odeme.value.some(item =>
    !!item.tutar && !!item.tip && !!item.odemeTipiGrup
  );
  const depozitoValid =
    (!!depozito.value.alinan || !!depozito.value.iade) && !!depozito.value.tip;
  return !(odemeValid || depozitoValid);
});

// Eski fiş yazdırma fonksiyonu - artık kullanılmıyor, çoklu fiş yazdırma için printMultipleFis kullanılıyor

// Çoklu fiş yazdırma fonksiyonu - tek pencerede tüm fişleri yazdırır
async function printMultipleFis(fisliOdemeler: Array<{ tutar: string | number; tip: string; odemeTipiGrup: string; index: number; komisyon?: boolean; orijinalTutar?: string | number; }>, islemNoList: number[], musteri: { MstrAdi?: string; OdaYatak?: string; KnklmOdaNo?: string; KnklmYtkNo?: string; }, islemKllnc: string, maxIslemno: number) {
  console.log('🖨️ Çoklu fiş yazdırma başlıyor...');
  
  // Tüm fişlerin HTML'ini hazırla
  let allFisHTML = '';
  
  // Başlangıç bakiyesi
  const baslangicBakiye = (window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye || 0;
  let guncelBakiye = baslangicBakiye;
  
  console.log(`💰 Başlangıç bakiyesi: ${baslangicBakiye}`);
  
  for (let i = 0; i < fisliOdemeler.length; i++) {
    const od = fisliOdemeler[i];
    console.log(`📄 Fiş ${i + 1}/${fisliOdemeler.length} hazırlanıyor:`, od);
    
    // Radio group seçimlerini al
    const odemeTipiLabel = odemeTipleri.find(tip => tip.value === od.tip)?.label || 'Nakit Kasa(TL)';
    const odemeTipiGrupLabel = odemeTipiGrupOptions.find(grup => grup.value === od.odemeTipiGrup)?.label || 'Konaklama';
    
    // Kalan borç hesabı - komisyon checkbox'ına göre
    const odemeTutari = Number(od.tutar);
    let komisyonTutari = 0;

    // Eğer komisyon checkbox TRUE ise, komisyon tutarını hesapla
    if (od.komisyon && od.orijinalTutar) {
      komisyonTutari = odemeTutari - Number(od.orijinalTutar);
      console.log(`💰 Komisyon hesaplama: ${odemeTutari} - ${od.orijinalTutar} = ${komisyonTutari}`);
    }

    // Kalan borç hesaplama - komisyon durumuna göre
    const kalanBorc = guncelBakiye - odemeTutari + komisyonTutari;
    
    console.log(`💳 Fiş ${i + 1} hesaplama: ${guncelBakiye} - ${odemeTutari} + ${komisyonTutari} = ${kalanBorc}`);
    
    // Bir sonraki fiş için bakiyeyi güncelle
    guncelBakiye = kalanBorc;
    
    // Fiş numarasını hesapla - (max islemno) + 1 + index
    const fisNo = maxIslemno + i;
    console.log(`🔢 Fiş ${i + 1} için fiş no:`, fisNo, `(maxIslemno: ${maxIslemno} + 1 + index: ${i})`);
    
    // Fiş için gerekli verileri hazırla
    const fisProps = {
      musteriAdi: musteri.MstrAdi || 'Bilinmeyen Müşteri',
      odaBilgisi: musteri.OdaYatak || (musteri.KnklmOdaNo && musteri.KnklmYtkNo ? `${musteri.KnklmOdaNo} - ${musteri.KnklmYtkNo}` : ''),
      aciklama: odemeTipiGrupLabel,
      tutar: od.tutar,
      kalanBorc: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(kalanBorc),
      sonOdemeTarihi: new Date().toLocaleDateString('tr-TR'),
      tarih: new Date().toLocaleDateString('tr-TR'),
      islemYapan: islemKllnc,
      fisNo: fisNo.toString(),
      odemeSekli: odemeTipiLabel
    };
    
    // Fiş HTML'ini oluştur - Görseldeki şablona uygun
    const fisHTML = `
      <div class="fis-container">
        
        <!-- Üst Bilgi Satırı -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2mm; font-size: 1.8mm;">
          <span>TARİH: ${fisProps.tarih}</span>
          <span>İŞLEMİ YAPAN: ${fisProps.islemYapan}</span>
          <span>FİŞ NO: ${fisProps.fisNo}</span>
        </div>
        
        <!-- Logo ve Firma Adı -->
        <div style="display: flex; align-items: center; margin-bottom: 3mm;">
          <div style="width: 12mm; height: 12mm; display: flex; align-items: center; justify-content: center; margin-right: 2mm;">
            <img src="/gokce-logo.png" style="width: 10mm; height: 10mm; object-fit: contain;" />
          </div>
          <div style="flex: 1;">
            <div style="font-weight: bold; font-size: 3.5mm; text-align: center; margin-bottom: 0.5mm;">GÖKÇE PANSİYON®</div>
            <div style="font-size: 1.8mm; text-align: center; font-style: italic;">İstanbul'daki Eviniz</div>
          </div>
        </div>
        
        <!-- Tahsilat Makbuzu Başlığı -->
        <div style="border: 2px solid #000; background: #f0f0f0; padding: 2mm; margin-bottom: 3mm; text-align: center;">
          <div style="font-weight: bold; font-size: 3.2mm; text-transform: uppercase;">TAHSİLAT MAKBUZU</div>
        </div>
        
        <!-- Müşteri Bilgileri -->
        <div style="margin-bottom: 2mm; display: flex; align-items: center;">
          <span style="font-weight: bold; font-size: 2.2mm; display: inline-block; width: 10mm;">SAYIN</span>
          <div style="border: 2px solid #000; padding: 1.5mm; flex: 1; font-weight: bold; font-size: 2.5mm; display: flex; align-items: center; justify-content: center; background: white;">${fisProps.musteriAdi}</div>
        </div>
        
        <!-- Oda Bilgileri -->
        <div style="margin-bottom: 2mm; display: flex; align-items: center;">
          <span style="font-weight: bold; font-size: 2.2mm; display: inline-block; width: 10mm;">ODA</span>
          <div style="border: 2px solid #000; padding: 1.5mm; flex: 1; font-weight: bold; font-size: 2.5mm; display: flex; align-items: center; justify-content: center; background: white;">${fisProps.odaBilgisi}</div>
        </div>
        
        <!-- Ek Hizmet -->
        <div style="margin-bottom: 2mm;">
          <div style="border: 2px solid #000; padding: 1.5mm; font-weight: bold; font-size: 2.5mm; display: flex; align-items: center; justify-content: center; background: white;">${fisProps.aciklama}</div>
        </div>
        
        <!-- Tutar -->
        <div style="margin-bottom: 2mm; display: flex; align-items: center;">
          <span style="font-weight: bold; font-size: 2.2mm; display: inline-block; width: 10mm;">TUTAR</span>
          <div style="border: 2px solid #000; padding: 1.5mm; flex: 1; text-align: right; font-weight: bold; font-size: 3mm; display: flex; align-items: center; justify-content: flex-end; background: white;">₺${fisProps.tutar}</div>
        </div>
        
        <!-- Ödeme Şekli -->
        <div style="text-align: center; font-size: 2mm; margin-bottom: 2mm; font-weight: bold;">${fisProps.odemeSekli} TAHSİL EDİLMİŞTİR.</div>
        
        <!-- Kalan Borç ve Son Ödeme Tarihi -->
        <div style="margin-bottom: 2mm; display: flex; align-items: center;">
          <span style="font-weight: bold; font-size: 2mm; display: inline-block; width: 8mm;">KALAN BORÇ</span>
          <div style="border: 2px solid #000; padding: 1.5mm; flex: 1; font-weight: bold; font-size: 2.2mm; display: flex; align-items: center; background: white;">${fisProps.kalanBorc}</div>
          <span style="font-weight: bold; font-size: 2mm; display: inline-block; width: 8mm; margin-left: 1mm;">SON ÖDEME</span>
          <div style="border: 2px solid #000; padding: 1.5mm; flex: 1; font-weight: bold; font-size: 2.2mm; display: flex; align-items: center; justify-content: center; background: white;">${fisProps.sonOdemeTarihi}</div>
        </div>
        
        <!-- Bilgilendirme Kutusu -->
        <div style="border: 2px solid #000; background: #f0f0f0; padding: 2mm; margin-bottom: 2mm;">
          <div style="font-weight: bold; font-size: 2.2mm; text-align: center; margin-bottom: 1.5mm;">BİLGİLENDİRME</div>
          <div style="font-size: 1.6mm; line-height: 1.3;">
            <div>WIFI ŞİFRESİ: GOKCE2010gokce</div>
            <div>GÜNLÜK KALIMLARDA ODA ÇIKIŞ SAATİ ÖĞLEN 12:00</div>
            <div>LÜTFEN FİŞİ VE PARANIZI KONTROL EDEREK ALINIZ</div>
            <div>BU BELGENİN MALİ BİR DEĞERİ YOKTUR</div>
          </div>
          
          <div style="text-align: center; margin-top: 2mm;">
            <div style="font-weight: bold; font-size: 1.8mm;">DAHA İYİ HİZMET VEREBİLMEMİZ İÇİN</div>
            <div style="font-weight: bold; font-size: 1.8mm;">İSTEK, ÖNERİ VE ŞİKAYETLERİNİZİ</div>
            <div style="font-weight: bold; font-size: 1.8mm;">LÜTFEN BİZE İLETİNİZ...</div>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-top: 2mm; font-size: 1.4mm;">
            <div>
              <div>TEL: 0 (212) 296 66 60</div>
              <div>GSM: 0 (545) 296 66 60</div>
            </div>
            <div style="text-align: right;">
              <div>MAIL: bilgi@gokcepansiyon.com</div>
              <div>WEB: www.gokcepansiyon.com</div>
            </div>
          </div>
        </div>
        
        <!-- Alt Çizgi -->
        <div style="background: #000; color: white; text-align: center; padding: 1mm; font-size: 1.6mm; font-weight: bold;">
          ${fisProps.fisNo}
        </div>
      </div>
    `;
    
    allFisHTML += fisHTML;
  }
  
  // Tek pencerede tüm fişleri yazdır
  return new Promise<void>((resolve, reject) => {
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Müşteri Tahsilat Fişleri - ${fisliOdemeler.length} Adet</title>
              <style>
                @page {
                  size: 78mm 165mm;
                  margin: 0;
                  padding: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                  background: white;
                  font-family: Arial, sans-serif;
                }
                .fis-container {
                  width: 78mm;
                  height: 165mm;
                  margin: 0;
                  padding: 1.5mm;
                  background: white;
                  box-sizing: border-box;
                  font-family: Arial, sans-serif;
                  font-size: 2.2mm;
                  line-height: 1.2;
                  color: black;
                  page-break-after: always;
                }
                .fis-container:last-child {
                  page-break-after: avoid;
                }
                @media print {
                  .fis-container {
                    width: 78mm !important;
                    height: 165mm !important;
                    transform: none !important;
                    scale: 1 !important;
                    page-break-after: always !important;
                  }
                  .fis-container:last-child {
                    page-break-after: avoid !important;
                  }
                  * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                  }
                }
              </style>
            </head>
            <body>
              ${allFisHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            console.log(`✅ ${fisliOdemeler.length} adet fiş yazdırma başlatıldı`);
            
            setTimeout(() => {
              printWindow.close();
              console.log('🔒 Fiş yazdırma penceresi kapatıldı');
              resolve();
            }, 3000);
          }, 500);
        };
      } else {
        reject(new Error('Yeni pencere açılamadı'));
      }
    } catch (error) {
      console.error('❌ Çoklu fiş yazdırma hatası:', error);
      Notify.create({ type: 'negative', message: 'Fiş yazdırma hatası: ' + String(error) });
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

async function onKaydet() {
  const musteri = window.kartliIslemSelectedNormalMusteri;
  if (!musteri || typeof musteri !== 'object') {
    Notify.create({ type: 'warning', message: 'Seçili müşteri bulunamadı.' });
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
        islemArac: odemeTipleri.find(o => o.value === od.tip)?.label || od.tip,
        islemTip: 'Giren',
        islemGrup: odemeTipiGrupOptions.find(o => o.value === od.odemeTipiGrup)?.label || od.odemeTipiGrup,
        islemBilgi: 'Cari hesaba mahsuben tahsil edilen...',
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
    return;
  }

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
      
            if (fisliOdemeler.length > 0) {
        console.log('🎫 Fiş yazdırma başlıyor...');
        
        // Backend'den dönen islemno listesini al
        const islemNoList = response.data.islemNoList || [];
        console.log('📊 Backend islemno listesi:', islemNoList);
        
              // Maksimum islemno değerini backend'den al
      let maxIslemno = 0;
      try {
        const maxIslemnoResponse = await api.get('/odeme-islem/max-islemno');
        maxIslemno = maxIslemnoResponse.data.maxIslemno || 0;
        console.log('🔢 Backend\'den alınan maksimum islemno:', maxIslemno);
      } catch (error) {
        console.error('❌ Maksimum islemno alınamadı:', error);
        // Hata durumunda varsayılan değer kullan
        maxIslemno = 0;
      }
      
      // Tüm fişleri tek seferde yazdırmak için toplu yazdırma fonksiyonu
      await printMultipleFis(fisliOdemeler, islemNoList, musteri, islemKllnc, maxIslemno);
        
        console.log('🎉 Tüm fiş yazdırma işlemleri tamamlandı');
      } else {
        console.log('❌ Fiş yazdırılacak ödeme bulunamadı');
      }
      
      // Form resetleme işlemini en sona al
      resetForm();
      console.log('BAKİYE GÜNCELLE EMIT', musteri);
      emit('bakiyeGuncelle', musteri);
      show.value = false;
    } else {
      Notify.create({ type: 'negative', message: response.data.message || 'Tahsilat işlemleri kaydedilemedi.' });
    }
  } catch (err) {
    Notify.create({ type: 'negative', message: 'Sunucu hatası: ' + (err instanceof Error ? err.message : String(err)) });
  }

  // Fiş yazdırma işlemi artık API başarılı olduktan sonra yapılıyor
}

function onClose() {
  resetForm();
  show.value = false;
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
</style> 