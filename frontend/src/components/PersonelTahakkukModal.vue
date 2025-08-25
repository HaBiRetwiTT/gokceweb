<template>
  <q-dialog v-model="show" persistent>
    <q-card 
      ref="modalCard"
      style="min-width: 350px; max-width: 420px;" 
      class="personel-tahakkuk-modal draggable-modal"
    >
      <q-card-section class="modal-header" style="cursor: move;">
        <div class="modal-title-section">
          <div class="modal-title-left">
            <span class="modal-title">
              <q-icon name="people" class="q-mr-sm" />
              Personel Tahakkuk / Ödeme İşlemleri
            </span>
          </div>
          <div class="modal-title-right">
            <span v-if="selectedPersonelNo" class="personel-no">{{ selectedPersonelNo }}</span>
          </div>
        </div>
      </q-card-section>

      <q-card-section class="q-pt-md modal-body">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-select
                  v-model="selectedPersonel"
                  :options="personelOptions"
                  option-label="label"
                  option-value="value"
                  label="Personel Seçiniz"
                  outlined
                  dense
                  clearable
                  use-input
                  hide-selected
                  fill-input
                  input-debounce="300"
                  @filter="filterPersonel"
                  :loading="loadingPersonel"
                  emit-value
                  map-options
                >
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey">
                        Sonuç bulunamadı
                      </q-item-section>
                    </q-item>
                  </template>
                  
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section>
                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
              
              <div class="col-12">
                <q-select
                  v-model="selectedIslemTipi"
                  :options="islemTipiOptions"
                  label="İşlem Tipi Seçiniz"
                  outlined
                  dense
                  clearable
                  emit-value
                  map-options
                />
              </div>
              
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="selectedOdemeYontemi"
                  :options="odemeYontemiOptions"
                  label="Ödeme Yöntemi..."
                  outlined
                  dense
                  clearable
                  emit-value
                  map-options
                  :readonly="isOdemeYontemiReadonly"
                />
              </div>
              
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="effectiveIslemTutar"
                  label="İşlem Tutarı"
                  outlined
                  dense
                  type="number"
                  step="1"
                  min="0"
                  suffix="TL"
                  :readonly="isIslemTutarReadonly"
                  :rules="[val => val > 0 || 'Tutar 0\'dan büyük olmalıdır']"
                />
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="modal-actions">
        <div class="row full-width items-center justify-between">
          <div class="col-auto">
            <!-- Personel bakiye bilgisi -->
            <div v-if="selectedPersonel" class="personel-bakiye-info">
              <span class="bakiye-label">Bakiye: </span>
              <span v-if="loadingBakiye" class="bakiye-loading">
                <q-spinner size="12px" />
              </span>
              <span v-else class="bakiye-tutar" :class="{ 
                'bakiye-pozitif': personelBakiye && personelBakiye > 0,
                'bakiye-negatif': personelBakiye && personelBakiye < 0,
                'bakiye-sifir': personelBakiye === 0
              }">
                {{ personelBakiye !== null ? personelBakiye.toLocaleString('tr-TR', { 
                  style: 'currency', 
                  currency: 'TRY',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }) : '0,00 ₺' }}
              </span>
            </div>
          </div>
          <div class="col-auto">
            <q-btn
              label="KAYDET"
              color="primary"
              @click="onKaydet"
              :disable="!selectedPersonel || !selectedIslemTipi || (!selectedOdemeYontemi && !isOdemeYontemiReadonly) || !effectiveIslemTutar || effectiveIslemTutar <= 0"
              class="q-mr-sm"
            />
            <q-btn
              label="KAPAT"
              color="secondary"
              @click="onKapat"
            />
          </div>
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { api } from '../boot/axios'

// Props
interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'kaydet': [data: { 
    personel: string
    islemTipi: string
    odemeYontemi: string
    tutar: number
    result?: {
      personel: string
      islemTipi: string
      tutar: number
      tarih: string
    }
  }]
}>()

// Quasar instance
const $q = useQuasar()

// Reactive data
const loadingPersonel = ref(false)
const selectedPersonel = ref<string | null>(null)
const selectedPersonelNo = ref<number | null>(null)
const selectedIslemTipi = ref<string | null>(null)
const selectedOdemeYontemi = ref<string | null>(null)
const islemTutar = ref<number>(0)
const personelList = ref<Array<{ PrsnAdi: string, PrsnNo: number }>>([])
const filteredPersonelList = ref<Array<{ PrsnAdi: string, PrsnNo: number }>>([])  
const modalCard = ref()
const personelBakiye = ref<number | null>(null)
const loadingBakiye = ref(false)

// Computed
const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const personelOptions = computed(() => {
  return filteredPersonelList.value.map(personel => ({
    label: personel.PrsnAdi,
    value: personel.PrsnAdi
  })).sort((a, b) => a.label.localeCompare(b.label, 'tr', { sensitivity: 'base' }))
})

const islemTipiOptions = computed(() => [
  { label: 'Maaş Tahakkuk', value: 'maas_tahakkuk' },
  { label: 'İkramiye Tahakkuk', value: 'ikramiye_tahakkuk' },
  { label: 'Maaş Ödemesi', value: 'maas_odeme' },
  { label: 'İkramiye Ödemesi', value: 'ikramiye_odeme' },
  { label: 'Avans Ödemesi', value: 'avans_odeme' },
  { label: 'Borç Verme', value: 'borc_verme' },
  { label: 'Borç İadesi', value: 'borc_iade' },
  { label: 'Çıkış Hesap Kapama', value: 'cikis_hesap_kapama' }
])

const odemeYontemiOptions = computed(() => [
  { label: 'Nakit Kasa(TL)', value: 'nakit_kasa' },
  { label: 'Banka EFT', value: 'banka_eft' }
])

const isOdemeYontemiReadonly = computed(() => {
  return selectedIslemTipi.value === 'maas_tahakkuk' || selectedIslemTipi.value === 'ikramiye_tahakkuk'
})

const isCikisHesapKapama = computed(() => {
  return selectedIslemTipi.value === 'cikis_hesap_kapama'
})

const isIslemTutarReadonly = computed(() => {
  return isCikisHesapKapama.value
})

const effectiveIslemTutar = computed({
  get: () => {
    if (isCikisHesapKapama.value && personelBakiye.value !== null) {
      return Math.abs(personelBakiye.value)
    }
    return islemTutar.value
  },
  set: (value) => {
    if (!isCikisHesapKapama.value) {
      islemTutar.value = value
    }
  }
})

// İşlem tipi label'ını almak için computed property
const selectedIslemTipiLabel = computed(() => {
  if (!selectedIslemTipi.value) return null
  const foundOption = islemTipiOptions.value.find(option => option.value === selectedIslemTipi.value)
  return foundOption?.label || null
})

// Methods
async function loadPersonelBakiye(personelNo: number) {
  try {
    loadingBakiye.value = true
    console.log('💰 Personel bakiyesi yüklüyor, Personel No:', personelNo)
    
    const response = await api.get(`/personel/bakiye/${personelNo}`)
    
    if (response.data.success) {
      personelBakiye.value = response.data.bakiye
      console.log('✨ Personel bakiyesi yüklendi:', personelBakiye.value)
    } else {
      throw new Error(response.data.message || 'Personel bakiyesi yüklenemedi')
    }
  } catch (error: unknown) {
    console.error('❌ Personel bakiyesi yükleme hatası:', error)
    personelBakiye.value = 0
    
    // Kullanıcıya hata bildirimi gösterme (sessiz hata)
    // $q.notify({
    //   type: 'warning',
    //   message: 'Personel bakiyesi yüklenemedi',
    //   position: 'top'
    // })
  } finally {
    loadingBakiye.value = false
  }
}

async function loadPersonelList() {
  try {
    loadingPersonel.value = true
    console.log('🔍 Aktif personel listesi yükleniyor...')
    
    const response = await api.get('/personel/calisanlar')
    
    if (response.data.success) {
      personelList.value = response.data.data
      filteredPersonelList.value = response.data.data
      console.log('✅ Aktif personel listesi yüklendi:', personelList.value.length, 'kayıt')
    } else {
      throw new Error(response.data.message || 'Personel listesi yüklenemedi')
    }
  } catch (error: unknown) {
    console.error('❌ Personel listesi yükleme hatası:', error)
    let errorMessage = 'Personel listesi yüklenirken hata oluştu'
    
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response?: { data?: { message?: string } } }
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message
      }
    }
    
    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top'
    })
  } finally {
    loadingPersonel.value = false
  }
}

function filterPersonel(val: string, update: (callback: () => void) => void) {
  update(() => {
    if (val === '') {
      filteredPersonelList.value = personelList.value
    } else {
      const needle = val.toLowerCase()
      filteredPersonelList.value = personelList.value.filter(personel => 
        personel.PrsnAdi.toLowerCase().indexOf(needle) > -1
      )
    }
  })
}

async function onKaydet() {
  if (!selectedPersonel.value) {
    $q.notify({
      type: 'warning',
      message: 'Lütfen bir personel seçiniz',
      position: 'top'
    })
    return
  }

  if (!selectedIslemTipi.value) {
    $q.notify({
      type: 'warning',
      message: 'Lütfen bir işlem tipi seçiniz',
      position: 'top'
    })
    return
  }

  // Çıkış Hesap Kapama için özel kontrol
  if (isCikisHesapKapama.value) {
    if (personelBakiye.value === 0) {
      $q.notify({
        type: 'warning',
        message: 'Personel Cari Bakiyesi YOK!',
        position: 'top'
      })
      // Form'u kapat
      emit('update:modelValue', false)
      return
    }
  }

  if (!selectedOdemeYontemi.value && !isOdemeYontemiReadonly.value) {
    $q.notify({
      type: 'warning',
      message: 'Lütfen bir ödeme yöntemi seçiniz',
      position: 'top'
    })
    return
  }

  if (!effectiveIslemTutar.value || effectiveIslemTutar.value <= 0) {
    $q.notify({
      type: 'warning',
      message: 'Lütfen geçerli bir tutar giriniz',
      position: 'top'
    })
    return
  }

  try {
    console.log('🚀 Personel tahakkuk/ödeme kaydı başlatılıyor...')
    
    // Loading state'i göster
    loadingPersonel.value = true
    
    // İşlem tipini belirle (Çıkış Hesap Kapama için özel logic)
    let finalIslemTipi = selectedIslemTipi.value
    let islemGrup = undefined
    
    if (isCikisHesapKapama.value && personelBakiye.value !== null) {
      console.log('🔍 Çıkış Hesap Kapama logic:', {
        isCikisHesapKapama: isCikisHesapKapama.value,
        personelBakiye: personelBakiye.value,
        originalIslemTipi: selectedIslemTipi.value
      })
      
      // Çıkış Hesap Kapama için, backend'in ödeme işlemi olarak tanıması için
      // islemTipi'ni değiştiriyoruz ve islemGrup ekliyoruz
      if (personelBakiye.value < 0) {
        // Personel borç vermiş (negatif bakiye) - personelden çıkan
        finalIslemTipi = 'cikis_hesap_kapama_cikan'
      } else {
        // Personele borçluyuz (pozitif bakiye) - personele giren
        finalIslemTipi = 'cikis_hesap_kapama_giren'
      }
      
      islemGrup = 'Çıkış Hesap Kapama'
      
      console.log('📋 Belirlenen final işlem tipi:', {
        condition: personelBakiye.value < 0 ? 'bakiye < 0 (personelden çıkan)' : 'bakiye >= 0 (personele giren)',
        finalIslemTipi: finalIslemTipi,
        islemGrup: islemGrup
      })
    }
    
    // Backend'e gönderilecek veriyi hazırla
    const requestData = {
      personel: selectedPersonel.value,
      islemTipi: finalIslemTipi,
      odemeYontemi: selectedOdemeYontemi.value || 'tahakkuk',
      tutar: effectiveIslemTutar.value,
      islemBilgi: selectedIslemTipiLabel.value, // Daima işlem tipi label bilgisini gönder
      ...(islemGrup && { islemGrup: islemGrup })
    }
    
    console.log('📝 Gönderilecek veri:', requestData)
    
    // Backend API'sine istek gönder
    const response = await api.post('/personel/tahakkuk-odeme', requestData)
    
    if (response.data.success) {
      // Başarı mesajı göster
      $q.notify({
        type: 'positive',
        message: response.data.message || 'Personel tahakkuk/ödeme kaydı başarıyla oluşturuldu',
        position: 'top',
        timeout: 4000
      })
      
      // Parent component'e bildiri gönder
      emit('kaydet', {
        personel: selectedPersonel.value,
        islemTipi: finalIslemTipi,
        odemeYontemi: selectedOdemeYontemi.value || 'tahakkuk',
        tutar: effectiveIslemTutar.value,
        result: response.data.data
      })
      
      // Modal'i kapat
      emit('update:modelValue', false)
      
      console.log('✅ Personel tahakkuk/ödeme kaydı başarıyla tamamlandı')
      
    } else {
      throw new Error(response.data.message || 'Kayıt işlemi başarısız')
    }
    
  } catch (error: unknown) {
    console.error('❌ Personel tahakkuk/ödeme kaydetme hatası:', error)
    
    let errorMessage = 'Personel tahakkuk/ödeme kaydı sırasında hata oluştu'
    
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response?: { data?: { message?: string } } }
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    
    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
      timeout: 5000
    })
    
  } finally {
    loadingPersonel.value = false
  }
}

function onKapat() {
  // Reset form
  selectedPersonel.value = null
  selectedPersonelNo.value = null
  selectedIslemTipi.value = null
  selectedOdemeYontemi.value = null
  islemTutar.value = 0
  personelBakiye.value = null
  // Close modal
  emit('update:modelValue', false)
}

// Watch for modal visibility changes
watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    // Modal opened, load personnel list
    loadPersonelList().catch((error) => {
      console.error('Error loading personnel list in watch:', error)
    })
    
    // Initialize draggable after DOM is ready
    await nextTick()
    initializeDraggable()
  } else {
    // Modal closed, reset form
    selectedPersonel.value = null
    selectedPersonelNo.value = null
    selectedIslemTipi.value = null
    selectedOdemeYontemi.value = null
    islemTutar.value = 0
    personelBakiye.value = null
  }
})

// Watch for personnel selection to update personnel number and load balance
watch(() => selectedPersonel.value, async (newPersonel) => {
  if (newPersonel) {
    const foundPersonel = personelList.value.find(p => p.PrsnAdi === newPersonel)
    selectedPersonelNo.value = foundPersonel?.PrsnNo || null
    
    // Load personnel balance using personnel number
    if (foundPersonel?.PrsnNo) {
      await loadPersonelBakiye(foundPersonel.PrsnNo)
    }
  } else {
    selectedPersonelNo.value = null
    personelBakiye.value = null
  }
})

// Watch for transaction type changes to clear payment method when readonly
watch(() => selectedIslemTipi.value, (newValue) => {
  if (newValue === 'maas_tahakkuk' || newValue === 'ikramiye_tahakkuk') {
    // Clear payment method when it becomes readonly
    selectedOdemeYontemi.value = null
  }
  
  // Çıkış Hesap Kapama seçildiğinde tutarı otomatik doldur
  if (newValue === 'cikis_hesap_kapama' && personelBakiye.value !== null) {
    // Tutar otomatik olarak computed property ile doldurulacak
    console.log('🔄 Çıkış Hesap Kapama seçildi, tutar otomatik dolduruldu:', Math.abs(personelBakiye.value))
  }
})

// Load personnel list on component mount
onMounted(async () => {
  if (props.modelValue) {
    loadPersonelList().catch((error) => {
      console.error('Error loading personnel list on mount:', error)
    })
    
    // Initialize draggable after DOM is ready
    await nextTick()
    initializeDraggable()
  }
})

// Draggable functionality
function initializeDraggable() {
  if (!modalCard.value) {
    console.log('Modal card ref not found')
    return
  }
  
  // Get the actual DOM element (Quasar component has $el property)
  const modal = modalCard.value.$el || modalCard.value
  const header = modal.querySelector('.modal-header')
  
  if (!header) {
    console.log('Modal header not found')
    return
  }
  
  console.log('Initializing draggable functionality')
  
  let isDragging = false
  let currentX = 0
  let currentY = 0
  let initialX = 0
  let initialY = 0
  let xOffset = 0
  let yOffset = 0
  
  // Remove existing listeners to prevent duplicates
  header.removeEventListener('mousedown', dragStart)
  document.removeEventListener('mousemove', drag)
  document.removeEventListener('mouseup', dragEnd)
  
  // Add event listeners
  header.addEventListener('mousedown', dragStart)
  document.addEventListener('mousemove', drag)
  document.addEventListener('mouseup', dragEnd)
  
  function dragStart(e: MouseEvent) {
    isDragging = true
    modal.style.position = 'fixed'
    modal.style.zIndex = '9999'
    
    initialX = e.clientX - xOffset
    initialY = e.clientY - yOffset
    
    document.body.style.userSelect = 'none'
    console.log('Drag started')
  }
  
  function drag(e: MouseEvent) {
    if (isDragging) {
      e.preventDefault()
      
      currentX = e.clientX - initialX
      currentY = e.clientY - initialY
      
      xOffset = currentX
      yOffset = currentY
      
      modal.style.transform = `translate(${currentX}px, ${currentY}px)`
    }
  }
  
  function dragEnd() {
    if (isDragging) {
      isDragging = false
      document.body.style.userSelect = ''
      console.log('Drag ended')
    }
  }
}
</script>

<style scoped>
/* Modal Form Stilleri */
.personel-tahakkuk-modal {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
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
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  user-select: none;
}

.modal-header:hover {
  background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
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
  font-size: 1.0rem;
  font-weight: 600;
  text-align: center;
}

.modal-title-right {
  flex: 0 0 auto;
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

/* Modal body stilleri */
.modal-body {
  padding: 24px;
  background: #f8f9fa;
}

/* Modal actions stilleri */
.modal-actions {
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  padding: 16px 24px;
}

/* Personel bakiye bilgisi stilleri */
.personel-bakiye-info {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
}

.bakiye-label {
  color: #666;
  font-weight: 500;
}

.bakiye-loading {
  display: flex;
  align-items: center;
}

.bakiye-tutar {
  font-weight: 600;
  transition: color 0.2s ease;
}

.bakiye-pozitif {
  color: #4caf50; /* Yeşil - alacaklı */
}

.bakiye-negatif {
  color: #f44336; /* Kırmızı - borçlu */
}

.bakiye-sifir {
  color: #666; /* Gri - sıfır bakiye */
}

/* Modal actions butonları arası padding */
.modal-actions .q-btn + .q-btn {
  margin-left: 12px;
}

/* Dark mode support */
.body--dark .personel-tahakkuk-modal {
  background-color: #1e1e1e;
  color: #ffffff;
}

.body--dark .modal-header {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
}

.body--dark .modal-header:hover {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
}

.body--dark .modal-body {
  background: #2c3e50;
}

.body--dark .modal-actions {
  background: #34495e;
  border-top: 1px solid #495057;
}

/* Dark mode için personel bakiye bilgisi renkleri */
.body--dark .bakiye-label {
  color: #e0e0e0; /* Açık gri - dark mode için daha görünür */
}

.body--dark .bakiye-pozitif {
  color: #66bb6a; /* Açık yeşil - dark mode için daha parlak */
}

.body--dark .bakiye-negatif {
  color: #ef5350; /* Açık kırmızı - dark mode için daha parlak */
}

.body--dark .bakiye-sifir {
  color: #bdbdbd; /* Açık gri - dark mode için daha görünür */
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

/* Responsive padding */
@media (max-width: 768px) {
  .modal-actions .q-btn + .q-btn {
    margin-left: 8px;
  }
}
</style>