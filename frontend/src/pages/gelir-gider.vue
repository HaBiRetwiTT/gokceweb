<template>
  <q-page class="q-pa-md light-page-background">
    <div class="text-h6 q-mb-sm text-center">Gelir/Gider Kayıt İşlemi</div>
    
    <!-- Ana Form Container -->
    <div class="ana-form-container">
      <!-- Ana Gider/Gelir/Ödeme Satırı -->
      <div class="gider-tables-row">
      <!-- Giderler Sol -->
      <div class="gider-table-container" :class="{ 'container-disabled': islemTipi === 'gelir' }">
        <div class="gider-section-card">
          <!-- Giderler Sol Tablo -->
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
                  {{ (props.row.miktar * parseTutarDeger(props.row.tutar)).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) }}
                </span>
              </q-td>
            </template>
          </q-table>
        </div>
      </div>
      
      <!-- Giderler Sağ -->
      <div class="gider-table-container" :class="{ 'container-disabled': islemTipi === 'gelir' }">
        <div class="gider-section-card">
          <!-- Giderler Sağ Tablo -->
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
                  {{ (props.row.miktar * parseTutarDeger(props.row.tutar)).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) }}
                </span>
              </q-td>
            </template>
          </q-table>
        </div>
      </div>

      <!-- GELİRLER + ÖDEME ARACI dış container -->
      <div class="gelir-odeme-outer-container">
        <div class="gelir-table-container" :class="{ 'container-disabled': islemTipi === 'gider' }">
          <div class="gelir-section-card">
            <!-- Gelirler Tablo -->
            <q-table
              :rows="gelirRows"
              :columns="gelirColumns"
              row-key="rowKey"
              hide-bottom
              flat
              dense
              bordered
              square
              class="gelir-table"
              :pagination="{ rowsPerPage: 0 }"
              :rows-per-page-options="[0]"
            >
              <!-- Gelir Adı Sütunu (Checkbox) -->
              <template v-slot:body-cell-gelirAdi="props">
                <q-td>
                  <q-checkbox
                    v-model="props.row.selected"
                    :label="props.row.gelirAdi"
                    @update:model-value="onGelirCheckboxChange(props.row)"
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
                      @update:model-value="onGelirMiktarChange(props.row)"
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
                      @update:model-value="onGelirTutarChange(props.row)"
                      @blur="formatGelirTutar(props.row)"
                      @focus="unformatGelirTutar(props.row)"
                    />
                  </div>
                </q-td>
              </template>

              <!-- Toplam Tutar Sütunu -->
              <template v-slot:body-cell-toplamTutar="props">
                <q-td>
                  <span v-if="props.row.selected && props.row.tutar !== null" class="text-weight-medium">
                    {{ (props.row.miktar * parseTutarDeger(props.row.tutar)).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) }}
                  </span>
                </q-td>
              </template>
            </q-table>
          </div>
        </div>
        <!-- ÖDEME ARACI Container -->
        <div class="odeme-araci-container">
          <div class="odeme-araci-card">
            <div class="odeme-araci-column">
              <div class="odeme-araci-item">
                <q-checkbox
                  v-model="odemeAraclari.nakitKasa"
                  label="Nakit Kasa(TL)"
                  :disable="genelToplam === 0"
                  @update:model-value="onNakitKasaChange"
                />
                <q-input
                  v-model="odemeAraclari.nakitKasaTutar"
                  type="text"
                  dense
                  outlined
                  placeholder="Tutar"
                  class="odeme-tutar-input"
                  :disable="!odemeAraclari.nakitKasa"
                  @blur="formatOdemeTutar('nakitKasaTutar')"
                  @focus="unformatOdemeTutar('nakitKasaTutar')"
                />
              </div>
              
              <div class="odeme-araci-item">
                <q-checkbox
                  v-model="odemeAraclari.krediKartlari"
                  label="Kredi Kartları"
                  :disable="genelToplam === 0"
                  @update:model-value="onKrediKartlariChange"
                />
                <q-input
                  v-model="odemeAraclari.krediKartlariTutar"
                  type="text"
                  dense
                  outlined
                  placeholder="Tutar"
                  class="odeme-tutar-input"
                  :disable="!odemeAraclari.krediKartlari"
                  @blur="formatOdemeTutar('krediKartlariTutar')"
                  @focus="unformatOdemeTutar('krediKartlariTutar')"
                />
              </div>
              
              <div class="odeme-araci-item">
                <q-checkbox
                  v-model="odemeAraclari.bankaEft"
                  label="Banka EFT"
                  :disable="genelToplam === 0"
                  @update:model-value="onBankaEftChange"
                />
                <q-input
                  v-model="odemeAraclari.bankaEftTutar"
                  type="text"
                  dense
                  outlined
                  placeholder="Tutar"
                  class="odeme-tutar-input"
                  :disable="!odemeAraclari.bankaEft"
                  @blur="formatOdemeTutar('bankaEftTutar')"
                  @focus="unformatOdemeTutar('bankaEftTutar')"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not ve Ortak Container Yan Yana -->
    <div class="not-ortak-row q-mt-md">
      <!-- Not Alanı -->
      <div class="not-container">
        <q-input
          v-model="giderNotu"
          type="textarea"
          dense
          outlined
          placeholder="Gider kaydı için not ekleyebilirsiniz..."
          class="not-textarea"
        />
      </div>
      
      <!-- Ortak Container - Genel Toplam ve Form Butonları -->
      <div class="ortak-container">
      <!-- Genel Toplam -->
      <div class="genel-toplam-container">
        <div class="genel-toplam-row-wrapper">
          <!-- Combobox -->
          <div class="combobox-container">
            <q-select
              v-model="selectedComboboxValue"
              :options="comboboxOptions"
              dense
              outlined
              placeholder="Seçenek seçin..."
              class="combobox-select"
              style="width: 330px;"
              clearable
              @click="console.log('Combobox clicked, options:', comboboxOptions)"
              @update:model-value="onComboboxChange"
              @clear="onComboboxClear"
            />
          </div>
          
          <!-- Toplam Tablosu -->
          <div class="toplam-table-container">
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
                  <q-td colspan="3" class="text-right text-bold">
                    <div v-if="!selectedComboboxValue" class="odeme-kontrol-label">
                      <span class="kontrol-text" :class="`kontrol-${odemeKontrolDurumu}`">{{ odemeKontrolText }}</span>
                    </div>
                    {{ islemTipi === 'gider' ? 'GİDER TOPLAM' : 'GELİR TOPLAM' }}
                  </q-td>
                  <q-td class="text-bold genel-toplam-cell">
                    <span class="toplam-deger">{{ genelToplamDisplay }}</span>
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </div>
        </div>
      </div>

      <!-- Form Butonları -->
      <div class="form-buttons-container q-mt-md">
        <div class="row justify-center q-gutter-md items-center">
          <!-- Radio Buton Grupları -->
          <div class="radio-group-container">
            <q-option-group
              v-model="islemTipi"
              inline
              dense
              class="radio-group"
              :options="[
                { label: 'GİDER', value: 'gider', color: 'negative' },
                { label: 'GELİR', value: 'gelir', color: 'positive' }
              ]"
              @update:model-value="onIslemTipiChange"
            />
          </div>
          
          <div class="radio-group-container">
            <q-option-group
              v-model="islemTuru"
              inline
              dense
              class="radio-group"
              :options="[
                { label: 'TEDARİKÇİ', value: 'tedarikci', color: 'primary' },
                { label: 'MÜŞTERİ', value: 'musteri', color: 'secondary' }
              ]"
              @update:model-value="onIslemTuruChange"
            />
          </div>
          
          <q-btn 
            color="negative" 
            icon="clear" 
            label="Temizle" 
            @click="temizleForm"
            outline
            size="md"
            class="temizle-btn"
          />
          <q-btn 
            color="primary" 
            icon="save" 
            label="Kaydet" 
            @click="onKaydet"
            :disable="seciliGiderAdedi === 0 || genelToplam === 0 || !odemeKontrolGecerli"
            unelevated
            size="md"
          />
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

// Gelir kategorileri interface'i
interface GelirKategori {
  rowKey: string;
  gelirAdi: string;
  selected: boolean;
  miktar: number;
  tutar: string | null;
}

// Gider kategorileri listesi (görseldeki seçenekler)
const giderKategorileri = [
  'Bakım Onarım',
  'Bilişim',
  'Doğalgaz-Yakıt',
  'Elektrik',
  'İnternet',
  'Kırtasiye',
  'Kiralama',
  'Komisyon',
  'LigTV',
  'Muhasebe',
  'Nalburiye',
  'Sair',
  'Su',
  'Telefon',
  'Temizlik',
  'Vergi-Harc',
  'Yemekhane',
  'Satış Zararı',
  'Kadir Takış',
  'Harun Takış'
]

// Gelir kategorileri listesi (görseldeki seçenekler)
const gelirKategorileri = [
  'Kira',
  'Konaklama',
  'Hizmet',
  'Yemekhane',
  'Komisyon',
  'Sair'
]

// Tablo sütunları
const giderColumns = [
  { name: 'giderAdi', label: 'GİDERLER', field: 'giderAdi', align: 'left' as const },
  { name: 'miktar', label: 'Miktar', field: 'miktar', align: 'center' as const },
  { name: 'tutar', label: 'Tutar', field: 'tutar', align: 'center' as const },
  { name: 'toplamTutar', label: 'Toplam Tutar', field: 'toplamTutar', align: 'right' as const }
]

// Gelir tablo sütunları
const gelirColumns = [
  { name: 'gelirAdi', label: 'GELİRLER', field: 'gelirAdi', align: 'left' as const },
  { name: 'miktar', label: 'Miktar', field: 'miktar', align: 'center' as const },
  { name: 'tutar', label: 'Tutar', field: 'tutar', align: 'center' as const },
  { name: 'toplamTutar', label: 'Toplam Tutar', field: 'toplamTutar', align: 'right' as const }
]

// Gider satırları - iki ayrı bölüm
const giderRowsSol = ref<GiderKategori[]>([])
const giderRowsSag = ref<GiderKategori[]>([])

// Gelir satırları
const gelirRows = ref<GelirKategori[]>([])

// Gider notu
const giderNotu = ref<string>('')

// Ödeme araçları interface'i
interface OdemeAraclari {
  nakitKasa: boolean;
  nakitKasaTutar: string;
  krediKartlari: boolean;
  krediKartlariTutar: string;
  bankaEft: boolean;
  bankaEftTutar: string;
}

// Ödeme araçları
const odemeAraclari = ref<OdemeAraclari>({
  nakitKasa: false,
  nakitKasaTutar: '',
  krediKartlari: false,
  krediKartlariTutar: '',
  bankaEft: false,
  bankaEftTutar: ''
})

// İşlem tipi (GELİR/GİDER)
const islemTipi = ref<'gelir' | 'gider'>('gider')

// İşlem tipi değiştiğinde seçili checkbox'ları temizle
function onIslemTipiChange() {
  // Gider checkbox'larını temizle
  giderRowsSol.value.forEach(row => {
    row.selected = false
    row.miktar = 1
    row.tutar = null
  })
  
  giderRowsSag.value.forEach(row => {
    row.selected = false
    row.miktar = 1
    row.tutar = null
  })
  
  // Gelir checkbox'larını temizle
  gelirRows.value.forEach(row => {
    row.selected = false
    row.miktar = 1
    row.tutar = null
  })
  
  // Not alanını temizle
  giderNotu.value = ''
  
  // Ödeme araçlarını temizle
  odemeAraclari.value = {
    nakitKasa: false,
    nakitKasaTutar: '',
    krediKartlari: false,
    krediKartlariTutar: '',
    bankaEft: false,
    bankaEftTutar: ''
  }
}

// İşlem türü (TEDARİKÇİ/MÜŞTERİ)
const islemTuru = ref<'tedarikci' | 'musteri'>('tedarikci')

// İşlem türü değiştiğinde combobox listesini güncelle
function onIslemTuruChange() {
  if (islemTuru.value === 'tedarikci') {
    comboboxOptions.value = tedarikciListesi.value
  } else {
    comboboxOptions.value = musteriListesi.value
  }
  // Seçili değeri temizle
  selectedComboboxValue.value = ''
}

// Combobox seçimi değiştiğinde kontrol et
function onComboboxChange() {
  // Eğer combobox'ta seçim yapılmaya çalışılıyorsa ve birden fazla checkbox seçiliyse
  if (selectedComboboxValue.value) {
    const seciliGiderCheckboxlar = tumGiderRows.value.filter(row => row.selected)
    const seciliGelirCheckboxlar = gelirRows.value.filter(row => row.selected)
    const toplamSeciliCheckbox = seciliGiderCheckboxlar.length + seciliGelirCheckboxlar.length
    
    if (toplamSeciliCheckbox > 1) {
      // Uyarı göster ve combobox seçimini engelle
      $q.notify({
        type: 'warning',
        message: 'BİR CARİ HESABA AYNI ANDA TEK BİR GELİR/GİDER KAYDI YAPILABİLİR',
        position: 'top',
        timeout: 3000
      })
      
      // Combobox seçimini temizle
      selectedComboboxValue.value = ''
      return
    }
  }
}

// Combobox temizleme butonuna tıklandığında
function onComboboxClear() {
  // Combobox seçimi temizlendiğinde sadece ödeme araçlarını temizle
  odemeAraclari.value = {
    nakitKasa: false,
    nakitKasaTutar: '',
    krediKartlari: false,
    krediKartlariTutar: '',
    bankaEft: false,
    bankaEftTutar: ''
  }
  
  console.log('Combobox temizlendi, sadece ödeme araçları sıfırlandı')
}

// Ödeme aracı değiştiğinde
function onOdemeAraciChange() {
  console.log('Ödeme aracı değişti:', odemeAraclari.value)
  
  // Eğer toplam tutar 0 ise ödeme araçlarını temizle
  if (genelToplam.value === 0) {
    odemeAraclari.value = {
      nakitKasa: false,
      nakitKasaTutar: '',
      krediKartlari: false,
      krediKartlariTutar: '',
      bankaEft: false,
      bankaEftTutar: ''
    }
  }
}

// Nakit kasa checkbox değiştiğinde
function onNakitKasaChange() {
  if (!odemeAraclari.value.nakitKasa) {
    odemeAraclari.value.nakitKasaTutar = ''
  }
  onOdemeAraciChange()
}

// Kredi kartları checkbox değiştiğinde
function onKrediKartlariChange() {
  if (!odemeAraclari.value.krediKartlari) {
    odemeAraclari.value.krediKartlariTutar = ''
  }
  onOdemeAraciChange()
}

// Banka EFT checkbox değiştiğinde
function onBankaEftChange() {
  if (!odemeAraclari.value.bankaEft) {
    odemeAraclari.value.bankaEftTutar = ''
  }
  onOdemeAraciChange()
}

// Ödeme tutarı formatla
function formatOdemeTutar(fieldName: keyof OdemeAraclari) {
  const value = odemeAraclari.value[fieldName]
  if (value && typeof value === 'string') {
    const numericValue = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'))
    if (!isNaN(numericValue)) {
      (odemeAraclari.value[fieldName] as string) = numericValue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
    }
  }
}

// Ödeme tutarı unformat
function unformatOdemeTutar(fieldName: keyof OdemeAraclari) {
  const value = odemeAraclari.value[fieldName]
  if (value && typeof value === 'string') {
    const numericValue = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'))
    if (!isNaN(numericValue)) {
      (odemeAraclari.value[fieldName] as string) = numericValue.toString()
    }
  }
}

// Combobox seçenekleri
const comboboxOptions = ref<Array<{ label: string; value: string }>>([])

// Seçili combobox değeri
const selectedComboboxValue = ref<string>('')

// Tedarikçi listesi
const tedarikciListesi = ref<Array<{ label: string; value: string }>>([])

// Müşteri listesi
const musteriListesi = ref<Array<{ label: string; value: string }>>([])

// API response interface
interface CariResponse {
  CariKod: string;
  CariAdi: string;
}



// Tüm gider satırlarını birleştiren computed
const tumGiderRows = computed(() => [...giderRowsSol.value, ...giderRowsSag.value])

// Computed değerler
const genelToplam = computed<number>(() => {
  if (islemTipi.value === 'gider') {
    // GİDER seçili ise gider satırlarını hesapla
    return tumGiderRows.value
      .filter(row => row.selected && row.tutar !== null)
      .reduce((sum, row) => {
        return sum + (row.miktar * parseTutarDeger(row.tutar))
      }, 0)
  } else {
    // GELİR seçili ise gelir satırlarını hesapla
    return gelirRows.value
      .filter(row => row.selected && row.tutar !== null)
      .reduce((sum, row) => {
        return sum + (row.miktar * parseTutarDeger(row.tutar))
      }, 0)
  }
})

const genelToplamDisplay = computed(() =>
  genelToplam.value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
)

const seciliGiderAdedi = computed(() => {
  if (islemTipi.value === 'gider') {
    return tumGiderRows.value.filter(row => row.selected).length
  } else {
    return gelirRows.value.filter(row => row.selected).length
  }
})

// Ödeme araçları toplamını hesaplayan computed
const odemeAraclariToplam = computed(() => {
  let toplam = 0
  
  if (odemeAraclari.value.nakitKasa && odemeAraclari.value.nakitKasaTutar) {
    toplam += parseTutarDeger(odemeAraclari.value.nakitKasaTutar)
  }
  
  if (odemeAraclari.value.krediKartlari && odemeAraclari.value.krediKartlariTutar) {
    toplam += parseTutarDeger(odemeAraclari.value.krediKartlariTutar)
  }
  
  if (odemeAraclari.value.bankaEft && odemeAraclari.value.bankaEftTutar) {
    toplam += parseTutarDeger(odemeAraclari.value.bankaEftTutar)
  }
  
  return toplam
})

// Ödeme kontrolü geçerli mi computed
const odemeKontrolGecerli = computed(() => {
  // Eğer combobox boşsa, ödeme araçları toplamı genel toplama eşit olmalı
  if (!selectedComboboxValue.value) {
    return Math.abs(odemeAraclariToplam.value - genelToplam.value) < 0.01 // Küçük farklar için tolerans
  }
  // Combobox doluysa kontrol gerekmez
  return true
})

// Ödeme kontrol metni computed
const odemeKontrolText = computed(() => {
  // Combobox doluysa metin gösterme
  if (selectedComboboxValue.value) {
    return ''
  }
  
  // Genel toplam 0 ise, combobox dolu iken hangi statüde ise aynı metni göster
  if (genelToplam.value === 0) {
    return '✓ Ödeme Toplamı Eşit' // Varsayılan olarak success metni
  }
  
  // Genel toplam > 0 ise normal kontrol yap
  const fark = genelToplam.value - odemeAraclariToplam.value
  if (Math.abs(fark) < 0.01) {
    return '✓ Ödeme Toplamı Eşit'
  } else if (fark > 0) {
    return `✗ Eksik: ${fark.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`
  } else {
    return `✗ Fazla: ${Math.abs(fark).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`
  }
})

// Ödeme kontrol durumu computed (CSS class için)
const odemeKontrolDurumu = computed(() => {
  // Combobox doluysa kontrol gerekmez, boş string döndür
  if (selectedComboboxValue.value) {
    return ''
  }
  
  // Genel toplam 0 ise, combobox dolu iken hangi statüde ise aynı statüyü kullan
  if (genelToplam.value === 0) {
    return 'success' // Varsayılan olarak success statüsü
  }
  
  // Genel toplam > 0 ise normal kontrol yap
  const fark = genelToplam.value - odemeAraclariToplam.value
  if (Math.abs(fark) < 0.01) {
    return 'success'
  } else {
    return 'error'
  }
})

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

// Gelir verilerini yükle
function loadGelirKategorileri() {
  gelirRows.value = gelirKategorileri.map((gelirAdi, idx) => ({
    rowKey: `gelir_${idx}`,
    gelirAdi,
    selected: false,
    miktar: 1,
    tutar: null
  }))
}

// Event handlers
function onCheckboxChange(row: GiderKategori) {
  // Eğer combobox'ta bir seçim yapılmışsa ve başka bir checkbox seçilmeye çalışılıyorsa
  if (selectedComboboxValue.value && row.selected) {
    // Mevcut seçili checkbox'ları kontrol et
    const seciliCheckboxlar = tumGiderRows.value.filter(r => r.selected && r.rowKey !== row.rowKey)
    
    if (seciliCheckboxlar.length > 0) {
      // Uyarı göster ve seçimi engelle
      $q.notify({
        type: 'warning',
        message: 'BİR CARİ HESABA AYNI ANDA TEK BİR GELİR/GİDER KAYDI YAPILABİLİR',
        position: 'top',
        timeout: 3000
      })
      
      // Checkbox'ı seçili yapma
      row.selected = false
      return
    }
  }
  
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

// Gelir event handlers
function onGelirCheckboxChange(row: GelirKategori) {
  // Eğer combobox'ta bir seçim yapılmışsa ve başka bir checkbox seçilmeye çalışılıyorsa
  if (selectedComboboxValue.value && row.selected) {
    // Mevcut seçili gelir checkbox'larını kontrol et
    const seciliGelirCheckboxlar = gelirRows.value.filter(r => r.selected && r.rowKey !== row.rowKey)
    
    if (seciliGelirCheckboxlar.length > 0) {
      // Uyarı göster ve seçimi engelle
      $q.notify({
        type: 'warning',
        message: 'BİR CARİ HESABA AYNI ANDA TEK BİR GELİR/GİDER KAYDI YAPILABİLİR',
        position: 'top',
        timeout: 3000
      })
      
      // Checkbox'ı seçili yapma
      row.selected = false
      return
    }
  }
  
  // Checkbox kaldırıldığında değerleri sıfırla
  if (!row.selected) {
    row.miktar = 1
    row.tutar = null
  }
  console.log('Gelir checkbox değişti:', row.gelirAdi, row.selected)
}

function onGelirMiktarChange(row: GelirKategori) {
  // Miktar değiştiğinde yapılacak işlemler
  console.log('Gelir miktar değişti:', row.gelirAdi, row.miktar)
}

function onGelirTutarChange(row: GelirKategori) {
  // Tutar değiştiğinde yapılacak işlemler
  console.log('Gelir tutar değişti:', row.gelirAdi, row.tutar)
}

function formatGelirTutar(row: GelirKategori) {
  if (row.tutar && typeof row.tutar === 'string') {
    const numericValue = parseFloat(row.tutar.replace(/[^\d.,]/g, '').replace(',', '.'))
    if (!isNaN(numericValue)) {
      row.tutar = numericValue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
    }
  }
}

function unformatGelirTutar(row: GelirKategori) {
  if (row.tutar && typeof row.tutar === 'string') {
    const numericValue = parseFloat(row.tutar.replace(/[^\d.,]/g, '').replace(',', '.'))
    if (!isNaN(numericValue)) {
      row.tutar = numericValue.toString()
    }
  }
}

// Tutar değerini parse eden helper fonksiyon
function parseTutarDeger(tutar: string | null): number {
  if (!tutar || typeof tutar !== 'string') return 0
  
  // Türkçe para formatını temizle (₺, boşluk, nokta, virgül)
  const temizlenmis = tutar.replace(/[₺\s]/g, '').replace(/\./g, '').replace(',', '.')
  const numericValue = parseFloat(temizlenmis)
  
  return isNaN(numericValue) ? 0 : numericValue
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
  
  // Gelir bölümünü temizle
  gelirRows.value.forEach(row => {
    row.selected = false
    row.miktar = 1
    row.tutar = null
  })
  
  // Not alanını temizle
  giderNotu.value = ''
  
     // İşlem tipini varsayılan değere sıfırla
   islemTipi.value = 'gider'
   
   // İşlem türünü varsayılan değere sıfırla
   islemTuru.value = 'tedarikci'
   
   // Combobox değerini temizle
   selectedComboboxValue.value = ''
   
     // Varsayılan olarak tedarikçi listesini yükle
  comboboxOptions.value = tedarikciListesi.value
  
  // Ödeme araçlarını temizle
  odemeAraclari.value = {
    nakitKasa: false,
    nakitKasaTutar: '',
    krediKartlari: false,
    krediKartlariTutar: '',
    bankaEft: false,
    bankaEftTutar: ''
  }
  
  $q.notify({
    type: 'info',
    message: 'Form temizlendi'
  })
}

function onKaydet() {
  if (seciliGiderAdedi.value === 0) {
    $q.notify({
      type: 'warning',
      message: islemTipi.value === 'gider' ? 'Lütfen en az bir gider kategorisi seçin' : 'Lütfen en az bir gelir kategorisi seçin'
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
  console.log('Kaydedilecek veriler:', islemTipi.value === 'gider' ? tumGiderRows.value.filter(r => r.selected) : gelirRows.value.filter(r => r.selected))
  console.log('Genel toplam:', genelToplam.value)
}



// Tedarikçi listesini yükle
async function loadTedarikciListesi() {
  try {
    console.log('Tedarikçi listesi yükleniyor...')

    // Production'da Railway backend URL'ini kullan, development'ta proxy kullan
    const baseUrl = import.meta.env.PROD 
      ? 'https://gokceweb-production.up.railway.app'
      : ''
    const response = await fetch(`${baseUrl}/cari/tedarikci`)
    console.log('Tedarikçi response status:', response.status)
    console.log('Tedarikçi response headers:', response.headers)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Tedarikçi response error text:', errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const data = await response.json()
    console.log('Tedarikçi API response:', data)
    console.log('Tedarikçi data type:', typeof data)
    console.log('Tedarikçi data length:', Array.isArray(data) ? data.length : 'Not an array')

    if (!Array.isArray(data)) {
      throw new Error('Tedarikçi API response is not an array')
    }

    tedarikciListesi.value = data.map((item: CariResponse) => ({
      label: item.CariAdi,
      value: item.CariKod
    }))

    // Varsayılan olarak tedarikçi listesini yükle
    comboboxOptions.value = tedarikciListesi.value
    console.log('Tedarikçi listesi yüklendi:', tedarikciListesi.value)

  } catch (error) {
    console.error('Tedarikçi listesi yüklenirken hata:', error)
    console.error('Hata detayı:', error instanceof Error ? error.message : String(error))
    console.error('Hata stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Hata durumunda test verilerini kullan
    const testData = [
      { CariKod: 'CT10001', CariAdi: 'TEST TEDARİKÇİ 1' },
      { CariKod: 'CT10002', CariAdi: 'TEST TEDARİKÇİ 2' },
      { CariKod: 'CT10003', CariAdi: 'TEST TEDARİKÇİ 3' },
      { CariKod: 'AF10000', CariAdi: 'TEST TEDARİKÇİ 4' }
    ]

    tedarikciListesi.value = testData.map((item) => ({
      label: item.CariAdi,
      value: item.CariKod
    }))

    comboboxOptions.value = tedarikciListesi.value
    console.log('Test verileri kullanılıyor:', tedarikciListesi.value)
  }
}

// Müşteri listesini yükle
async function loadMusteriListesi() {
  try {
    console.log('Müşteri listesi yükleniyor...')

    // Production'da Railway backend URL'ini kullan, development'ta proxy kullan
    const baseUrl = import.meta.env.PROD 
      ? 'https://gokceweb-production.up.railway.app'
      : ''
    const response = await fetch(`${baseUrl}/cari/musteri`)
    console.log('Müşteri response status:', response.status)
    console.log('Müşteri response headers:', response.headers)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Müşteri response error text:', errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const data = await response.json()
    console.log('Müşteri API response:', data)
    console.log('Müşteri data type:', typeof data)
    console.log('Müşteri data length:', Array.isArray(data) ? data.length : 'Not an array')

    if (!Array.isArray(data)) {
      throw new Error('Müşteri API response is not an array')
    }

    musteriListesi.value = data.map((item: CariResponse) => ({
      label: item.CariAdi,
      value: item.CariKod
    }))

    console.log('Müşteri listesi yüklendi:', musteriListesi.value)

  } catch (error) {
    console.error('Müşteri listesi yüklenirken hata:', error)
    console.error('Hata detayı:', error instanceof Error ? error.message : String(error))
    console.error('Hata stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Hata durumunda test verilerini kullan
    const testData = [
      { CariKod: 'M10001', CariAdi: 'TEST MÜŞTERİ 1' },
      { CariKod: 'M10002', CariAdi: 'TEST MÜŞTERİ 2' },
      { CariKod: 'M10003', CariAdi: 'TEST MÜŞTERİ 3' },
      { CariKod: 'M10004', CariAdi: 'TEST MÜŞTERİ 4' }
    ]

    musteriListesi.value = testData.map((item) => ({
      label: item.CariAdi,
      value: item.CariKod
    }))

    console.log('Test verileri kullanılıyor:', musteriListesi.value)
  }
}

// API bağlantısını test eden fonksiyon
async function testApiConnection() {
  try {
    console.log('API bağlantısı test ediliyor...')
    
    // Production'da Railway backend URL'ini kullan, development'ta proxy kullan
    const baseUrl = import.meta.env.PROD 
      ? 'https://gokceweb-production.up.railway.app'
      : ''
    
    // Health check endpoint'ini test et
    const healthResponse = await fetch(`${baseUrl}/cari/health`)
    console.log('Health check response status:', healthResponse.status)
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      console.log('Health check data:', healthData)
    }
    
    // Tedarikçi endpoint'ini test et
    const tedarikciResponse = await fetch(`${baseUrl}/cari/tedarikci`)
    console.log('Tedarikçi endpoint response status:', tedarikciResponse.status)
    
    if (tedarikciResponse.ok) {
      const tedarikciData = await tedarikciResponse.json()
      console.log('Tedarikçi endpoint data length:', tedarikciData.length)
    }
    
  } catch (error) {
    console.error('API bağlantı testi hatası:', error)
  }
}

// Component mount olduğunda gider kategorilerini yükle
onMounted(async () => {
  loadGiderKategorileri()
  loadGelirKategorileri()
  
  // API bağlantısını test et
  await testApiConnection()
  
  await loadTedarikciListesi()
  await loadMusteriListesi()

  // Debug için console log'ları
  console.log('Tedarikçi listesi:', tedarikciListesi.value)
  console.log('Müşteri listesi:', musteriListesi.value)
  console.log('Combobox options:', comboboxOptions.value)
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
  padding: 20px;
}

.ana-form-wrapper {
  flex: 0 0 auto;
}

/* Ana Form Container */
.ana-form-container {
  width: 100%;
  max-width: 1550px;
  min-width: 1150px;
  margin: 0 auto;
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
  flex-direction: row;
  gap: 0.25rem;
}

.gider-table-container,
.gelir-odeme-outer-container {
  min-width: 0 !important;
  width: 100%;
  flex: 1 1 0;
}
.gider-table,
.gelir-table {
  min-width: 0 !important;
  width: 100%;
  table-layout: fixed;
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

.gelir-table-container {
  flex: 1;
  min-width: 0;
}

.gelir-section-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 0.75rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

/* Ödeme aracı container stilleri */
.odeme-araci-container {
  width: 100%;
}

/* Not ve Ortak Container Yan Yana */
.not-ortak-row {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

/* Not Container */
.not-container {
  width: 41%;
  display: flex;
  align-items: stretch;
}

.not-textarea {
  height: 100%;
}

.not-textarea .q-field__control {
  height: 100%;
}

.not-textarea .q-field__control-container {
  height: 100%;
}

.not-textarea .q-field__native {
  height: 100%;
  resize: none;
}

/* Ortak Container - Genel Toplam ve Form Butonları */
.ortak-container {
  width: 49%;
}

.odeme-araci-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 0.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.odeme-araci-column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.odeme-araci-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.15rem 0;
}

.odeme-tutar-input {
  width: 120px;
  margin-left: auto;
}

/* Dark mode adaptasyonu */
.body--dark .odeme-araci-card {
  background: rgba(45, 45, 45, 0.8);
  border: 1px solid #424242;
}

/* Dark mode support */
.body--dark .gelir-section-card {
  background: rgba(40, 40, 40, 0.8);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

 .gelir-table {
   min-width: 100%;
 }
 
 /* Container Disabled State */
 .container-disabled {
   opacity: 0.4;
   pointer-events: none;
   filter: grayscale(50%);
   transition: all 0.3s ease;
 }
 
 .container-disabled .gider-section-card,
 .container-disabled .gelir-section-card {
   background: rgba(200, 200, 200, 0.3) !important;
 }
 
 /* Dark mode support for disabled containers */
 .body--dark .container-disabled .gider-section-card,
 .body--dark .container-disabled .gelir-section-card {
   background: rgba(80, 80, 80, 0.3) !important;
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
 
 .genel-toplam-row-wrapper {
   display: flex;
   align-items: center;
   gap: 1rem;
 }
 
 .combobox-container {
   flex-shrink: 0;
 }
 
 .combobox-select {
   background: rgba(255, 255, 255, 0.8);
   border-radius: 8px;
 }
 
 /* Dark mode support for combobox */
 .body--dark .combobox-select {
   background: rgba(40, 40, 40, 0.8);
 }
 
 .toplam-table-container {
   flex: 1;
   min-width: 0;
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
 
 .toplam-deger {
   font-size: 1.4rem;
   font-weight: 700;
   letter-spacing: 0.5px;
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

/* Radio Group Container */
.radio-group-container {
  margin-right: 16px;
}

 .radio-group {
   display: flex;
   gap: 8px;
 }

.radio-group .q-radio {
  margin-right: 8px;
}

/* Responsive tasarım */
@media (max-width: 1650px) {
  .containers-wrapper {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  
  .ana-form-container {
    width: 1350px;
    min-width: 1150px;
  }
}

@media (max-width: 1500px) {
  .ana-form-container {
    width: 1250px;
    min-width: 1050px;
  }
}

@media (max-width: 1400px) {
  .ana-form-container {
    width: 1300px;
    min-width: 1100px;
  }
}

@media (max-width: 1200px) {
  .ana-form-container {
    width: 1200px;
    min-width: 1000px;
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
.gelir-odeme-outer-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 0.25rem;
  justify-content: stretch;
}

/* Temizle butonu genişliği */
.temizle-btn {
  width: 130px;
  min-width: 90px;
  font-size: 0.8rem;
}

/* Ödeme kontrol label stilleri */
.odeme-kontrol-label {
  margin-bottom: 4px;
}

.kontrol-text {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

.kontrol-success {
  color: #21ba45;
  background-color: rgba(33, 186, 69, 0.1);
}

.kontrol-error {
  color: #c10015;
  background-color: rgba(193, 0, 21, 0.1);
}
</style> 