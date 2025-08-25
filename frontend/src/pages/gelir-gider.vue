<template>
  <q-page class="q-pa-md light-page-background">
    <div class="text-h6 q-mb-sm text-center">Gelir/Gider - Tahsilat/Tediye Kayıt İşlemi</div>
    
    <!-- Ana Form Container -->
    <div class="ana-form-container">
      <!-- Ana Gider/Gelir/Ödeme Satırı -->
      <div class="gider-tables-row">
      <!-- Giderler Sol -->
      <div class="gider-table-container" :class="{ 'container-disabled': islemTipi === 'gelir' || islemTipi === null }">
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
      <div class="gider-table-container" :class="{ 'container-disabled': islemTipi === 'gelir' || islemTipi === null }">
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
        <div class="gelir-table-container" :class="{ 'container-disabled': islemTipi === 'gider' || islemTipi === null }">
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
                  :disable="!odemeContainerKullanilabilir"
                  :key="`nakit-kasa-${odemeContainerKullanilabilir}-${odemeAraclari.nakitKasa}`"
                  @update:model-value="onNakitKasaChange"
                  @click="undefined"
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
                  :disable="!odemeContainerKullanilabilir"
                  :key="`kredi-kartlari-${odemeContainerKullanilabilir}-${odemeAraclari.krediKartlari}`"
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
                  :disable="!odemeContainerKullanilabilir"
                  :key="`banka-eft-${odemeContainerKullanilabilir}-${odemeAraclari.bankaEft}`"
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
          v-model="giderNotuDisplay"
          type="textarea"
          dense
          outlined
          placeholder="Yapılan Kayıt(lar) için Detaylı Not Ekleyebilirsiniz..."
          class="not-textarea"
          :rows="8"
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
              :options="comboboxOptionsFiltered"
              dense
              outlined
              :placeholder="comboboxPlaceholder"
              class="combobox-select"
              style="width: 400px;"
              clearable
              use-input
              input-debounce="0"
              v-model:input-value="comboboxFilter"
              @filter="onComboboxFilter"
              @popup-show="comboboxPopup = true"
              @popup-hide="() => { comboboxPopup = false; comboboxFilter = '' }"
              @click="undefined"
              @update:model-value="onComboboxChange"
              @clear="onComboboxClear"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <!-- 1. Sütun: Adı (müşteri/tedarikçi) -->
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>
                      Bakiye: {{ scope.opt.bakiye ? formatBakiye(scope.opt.bakiye) : 'N/A' }}
                    </q-item-label>
                  </q-item-section>
                  <!-- 2. Sütun: Müşteri için TC No, Tedarikçi için VNo -->
                  <q-item-section>
                    <q-item-label caption>
                      {{ islemArac === 'musteri' ? 'TC No:' : 'VNo:' }} {{ scope.opt && scope.opt.vtc ? scope.opt.vtc : '-' }}
                    </q-item-label>
                  </q-item-section>
                  <!-- 3. Sütun: Kod -->
                  <q-item-section side>
                    <q-item-label caption>Kod: {{ scope.opt.value }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
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
                    {{ getToplamLabel() }}
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
          <!-- Sol Container - Radio Buton Grupları -->
          <div class="radio-groups-left-container">
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
            
            <div class="radio-group-container q-mt-sm">
              <q-option-group
                v-model="cikanGiren"
                inline
                dense
                class="radio-group"
                :options="[
                  { label: 'Çıkan', value: 'cikan', color: 'negative' },
                  { label: 'Giren', value: 'giren', color: 'positive' }
                ]"
                @update:model-value="onCikanGirenChange"
              />
            </div>
          </div>
          
          <!-- Sağ Container - Diğer Radio Buton ve Butonlar -->
          <div class="right-controls-container">
            <div class="radio-group-container">
              <q-option-group
                v-model="islemArac"
                inline
                dense
                class="radio-group"
                :options="[
                  { label: 'TEDARİKÇİ', value: 'tedarikci', color: 'primary' },
                  { label: 'MÜŞTERİ', value: 'musteri', color: 'secondary' }
                ]"
                @update:model-value="onislemAracChange"
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
              :disable="saving || seciliGiderAdedi === 0 || genelToplam === 0 || !odemeKontrolGecerli"
              :loading="saving"
              unelevated
              size="md"
            />
          </div>
          <q-btn 
          color="secondary" 
          icon="people" 
          label="PERSONEL TAHAKKUK / ÖDEME İŞLEMLERİ" 
          @click="onPersonelTahakkukClick"
          outline
          size="md"
          class="personel-tahakkuk-btn"
          />
        </div>
      </div>
        </div>
      </div>
    </div>
    
    <!-- Personel Tahakkuk Modal -->
    <PersonelTahakkukModal 
      v-model="showPersonelTahakkukModal"
      @kaydet="onPersonelTahakkukKaydet"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from '../boot/axios'
import PersonelTahakkukModal from '../components/PersonelTahakkukModal.vue'
const saving = ref(false)

// Personel Tahakkuk Modal kontrolü
const showPersonelTahakkukModal = ref(false)

function debugLog(...args: unknown[]) {
  if (import.meta.env.MODE !== 'production') {
    console.log(...args)
  }
}

const $q = useQuasar()

// Gider kategorileri interface'i
interface GiderKategori {
  rowKey: string;
  giderAdi: string;
  selected: boolean;
  miktar: number;
  tutar: string | null;
  selectedAt?: number;
}

// Gelir kategorileri interface'i
interface GelirKategori {
  rowKey: string;
  gelirAdi: string;
  selected: boolean;
  miktar: number;
  tutar: string | null;
  selectedAt?: number;
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

// Notlar: kullanıcı (manuel) ve otomatik (seçimlerden)
const userNotes = ref<string>('')
const autoNotes = ref<string>('')
// Tek textbox gösterimi için birleştirilmiş computed
const giderNotuDisplay = computed<string>({
  get: () => {
    const user = (userNotes.value || '').trim()
    const auto = (autoNotes.value || '').trim()
    if (!auto && !user) return ''
    if (!auto) return user
    if (!user) return auto
    return `${auto} -/- ${user}`
  },
  set: (val: string) => {
    const currentAuto = (autoNotes.value || '').trim()
    let incoming = (val || '').trim()
    if (!currentAuto) {
      userNotes.value = incoming
      return
    }
    // Eğer metin currentAuto ile başlıyorsa onu çıkar ve '-/-' ayracını temizle
    if (incoming.startsWith(currentAuto)) {
      incoming = incoming.slice(currentAuto.length).trim()
      if (incoming.startsWith('-/-')) {
        incoming = incoming.slice(3).trim()
      }
    }
    // Başta/sonda kalmış olası ayracı temizle
    if (incoming.startsWith('-/-')) incoming = incoming.slice(3).trim()
    if (incoming.endsWith('-/-')) incoming = incoming.slice(0, -3).trim()
    userNotes.value = incoming
  }
})

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
const islemTipi = ref<'gelir' | 'gider' | null>(null)

// İşlem tipi değiştiğinde seçili checkbox'ları temizle
function onIslemTipiChange() {
  // Eğer GİDER/GELİR seçildiyse Çıkan/Giren seçimini temizle
  if (islemTipi.value) {
    cikanGiren.value = null
  }
  
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
  userNotes.value = ''
  autoNotes.value = ''
  
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

// Çıkan/Giren değiştiğinde
function onCikanGirenChange() {
  // Eğer Çıkan/Giren seçildiyse GİDER/GELİR seçimini temizle
  if (cikanGiren.value) {
    islemTipi.value = null
  }
  
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
  userNotes.value = ''
  autoNotes.value = ''
  
  // Ödeme araçlarını temizleme - Çıkan/Giren seçiminde temizleme
  // odemeAraclari.value = {
  //   nakitKasa: false,
  //   nakitKasaTutar: '',
  //   krediKartlari: false,
  //   krediKartlariTutar: '',
  //   bankaEft: false,
  //   bankaEftTutar: ''
  // }
  refreshAutoNotes()
}

// İşlem türü (TEDARİKÇİ/MÜŞTERİ) - Default seçimsiz
const islemArac = ref<'tedarikci' | 'musteri' | null>(null)

// Çıkan/Giren seçimi
const cikanGiren = ref<'cikan' | 'giren' | null>(null)

// İşlem türü değiştiğinde combobox listesini güncelle
function onislemAracChange() {
  if (islemArac.value === 'tedarikci') {
    comboboxOptions.value = tedarikciListesi.value
    comboboxOptionsFiltered.value = tedarikciListesi.value
  } else if (islemArac.value === 'musteri') {
    comboboxOptions.value = musteriListesi.value
    comboboxOptionsFiltered.value = musteriListesi.value
  } else {
    // Hiçbir seçim yoksa combobox'ı temizle
    comboboxOptions.value = []
    comboboxOptionsFiltered.value = []
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
  // Seçim yapıldıysa filtre alanını temizle (placeholder görünmeyecek, input boş kalsın)
  comboboxFilter.value = ''
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
  
  debugLog('Combobox temizlendi, sadece ödeme araçları sıfırlandı')
}

// Ödeme aracı değiştiğinde
function onOdemeAraciChange() {
  debugLog('Ödeme aracı değişti:', odemeAraclari.value)
  
  // Çıkan/Giren seçili ve combobox dolu ise ödeme araçlarını temizleme
  if (cikanGiren.value && selectedComboboxValue.value) {
    debugLog('Primer koşul sağlandı, ödeme araçları temizlenmeyecek')
    return
  }
  
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
  // Otomatik notları güncelle
  refreshAutoNotes()
}

// QSelect filter handler: yazdıkça filtrele
function onComboboxFilter(val: string, update: (cb: () => void) => void) {
  update(() => {
    const needle = (val || '').toLocaleLowerCase('tr-TR')
    if (!needle) {
      comboboxOptionsFiltered.value = [...comboboxOptions.value]
    } else {
      comboboxOptionsFiltered.value = comboboxOptions.value.filter(opt =>
        (opt.label || '').toLocaleLowerCase('tr-TR').includes(needle) ||
        (opt.value || '').toLocaleLowerCase('tr-TR').includes(needle)
      )
    }
    // Seçim sonrası input alanındaki metni temizlemesin, yazmaya devam edilsin
    comboboxFilter.value = val || ''
  })
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
  refreshAutoNotes()
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
const comboboxOptions = ref<Array<{ label: string; value: string; bakiye?: string }>>([])
const comboboxOptionsFiltered = ref<Array<{ label: string; value: string; bakiye?: string }>>([])
const comboboxFilter = ref('')
const comboboxPopup = ref(false)
const comboboxPlaceholder = computed(() => comboboxPopup.value ? 'Yazarak Arama Yapabilirsiniz...' : '')

// Seçili combobox değeri
const selectedComboboxValue = ref<{ label: string; value: string } | string>('')

// Tedarikçi listesi
const tedarikciListesi = ref<Array<{ label: string; value: string; bakiye?: string }>>([])

// Müşteri listesi
const musteriListesi = ref<Array<{ label: string; value: string; bakiye?: string }>>([])

// API response interface
interface CariResponse {
  CariKod: string;
  CariAdi: string;
  CariBakiye: string;
  CariVTCN?: string; // API'de olabilir: birey için TCN, kurumsal için VNo
}



// Tüm gider satırlarını birleştiren computed
const tumGiderRows = computed(() => [...giderRowsSol.value, ...giderRowsSag.value])

// Liste geç yüklenirse, aktif seçime göre combobox seçeneklerini güncelle
watch(musteriListesi, (yeni) => {
  if (islemArac.value === 'musteri') {
    comboboxOptions.value = yeni
    comboboxOptionsFiltered.value = yeni
  }
})
watch(tedarikciListesi, (yeni) => {
  if (islemArac.value === 'tedarikci') {
    comboboxOptions.value = yeni
    comboboxOptionsFiltered.value = yeni
  }
})

// Computed değerler
const genelToplam = computed<number>(() => {
  // Çıkan/Giren seçili ve combobox dolu ise ödeme araçları toplamını göster
  if (cikanGiren.value && selectedComboboxValue.value) {
    return odemeAraclariToplam.value
  }
  
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
  // Çıkan/Giren seçili ve combobox dolu ise primer koşul - en az bir seçim var gibi davran
  if (cikanGiren.value && selectedComboboxValue.value) {
    return 1
  }
  
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

// TOPLAM label'ını döndüren fonksiyon
function getToplamLabel() {
  // Çıkan/Giren seçili ve combobox dolu ise Çıkan/Giren label'ını göster
  if (cikanGiren.value && selectedComboboxValue.value) {
    return cikanGiren.value === 'cikan' ? 'Çıkan TOPLAM' : 'Giren TOPLAM'
  }
  
  // Diğer durumlarda normal label'ları göster
  if (islemTipi.value === 'gider') {
    return 'GİDER TOPLAM'
  } else if (islemTipi.value === 'gelir') {
    return 'GELİR TOPLAM'
  } else {
    return 'TOPLAM'
  }
}

// Ödeme container'ının kullanılabilir olması için computed
const odemeContainerKullanilabilir = computed(() => {
  // Çıkan/Giren seçili ve combobox dolu ise primer koşul - kullanılabilir
  if (cikanGiren.value && selectedComboboxValue.value) {
    debugLog('Ödeme container kullanılabilir: Primer koşul sağlandı', {
      cikanGiren: cikanGiren.value,
      selectedComboboxValue: selectedComboboxValue.value,
      genelToplam: genelToplam.value
    })
    return true
  }
  
  // Diğer durumlarda genel toplam > 0 ise kullanılabilir
  const result = genelToplam.value > 0
  debugLog('Ödeme container kullanılabilir:', result, 'Genel toplam:', genelToplam.value)
  return result
})

// GİDER/GELİR radio buton grubunun disable durumu - artık disable etmiyoruz
// const islemTipiDisabled = computed(() => {
//   return cikanGiren.value !== null
// })

// Çıkan/Giren radio buton grubunun disable durumu - artık disable etmiyoruz
// const cikanGirenDisabled = computed(() => {
//   return islemTipi.value !== null
// })

// Gider verilerini yükle
function loadGiderKategorileri() {
  // Sol bölüm (1-10)
  giderRowsSol.value = giderKategorileri.slice(0, 10).map((giderAdi, idx) => ({
    rowKey: `gider_sol_${idx}`,
    giderAdi,
    selected: false,
    miktar: 1,
    tutar: null,
    selectedAt: 0
  }))

  // Sağ bölüm (11-20)
  giderRowsSag.value = giderKategorileri.slice(10, 20).map((giderAdi, idx) => ({
    rowKey: `gider_sag_${idx}`,
    giderAdi,
    selected: false,
    miktar: 1,
    tutar: null,
    selectedAt: 0
  }))
}

// Gelir verilerini yükle
function loadGelirKategorileri() {
  gelirRows.value = gelirKategorileri.map((gelirAdi, idx) => ({
    rowKey: `gelir_${idx}`,
    gelirAdi,
    selected: false,
    miktar: 1,
    tutar: null,
    selectedAt: 0
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
    row.selectedAt = 0
  }
  if (row.selected) {
    row.selectedAt = Date.now()
  }
  debugLog('Checkbox değişti:', row.giderAdi, row.selected)
  refreshAutoNotes()
}

function onMiktarChange(row: GiderKategori) {
  // Miktar değiştiğinde yapılacak işlemler
  debugLog('Miktar değişti:', row.giderAdi, row.miktar)
  refreshAutoNotes()
}

function onTutarChange(row: GiderKategori) {
  // Tutar değiştiğinde yapılacak işlemler
  debugLog('Tutar değişti:', row.giderAdi, row.tutar)
  refreshAutoNotes()
}

function formatTutar(row: GiderKategori) {
  if (row.tutar && typeof row.tutar === 'string') {
    const numericValue = parseFloat(row.tutar.replace(/[^\d.,]/g, '').replace(',', '.'))
    if (!isNaN(numericValue)) {
      row.tutar = numericValue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
    }
  }
  refreshAutoNotes()
}

function unformatTutar(row: GiderKategori) {
  if (row.tutar && typeof row.tutar === 'string') {
    const numericValue = parseFloat(row.tutar.replace(/[^\d.,]/g, '').replace(',', '.'))
    if (!isNaN(numericValue)) {
      row.tutar = numericValue.toString()
    }
  }
  // Notları unformat sırasında değiştirmeyelim; gerçek değer değişince güncellenecek
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
    row.selectedAt = 0
  }
  if (row.selected) {
    row.selectedAt = Date.now()
  }
  debugLog('Gelir checkbox değişti:', row.gelirAdi, row.selected)
  refreshAutoNotes()
}

function onGelirMiktarChange(row: GelirKategori) {
  // Miktar değiştiğinde yapılacak işlemler
  debugLog('Gelir miktar değişti:', row.gelirAdi, row.miktar)
  refreshAutoNotes()
}

function onGelirTutarChange(row: GelirKategori) {
  // Tutar değiştiğinde yapılacak işlemler
  debugLog('Gelir tutar değişti:', row.gelirAdi, row.tutar)
  refreshAutoNotes()
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

// Bakiye değerini formatla
function formatBakiye(bakiye: string): string {
  const numericValue = parseFloat(bakiye)
  if (isNaN(numericValue)) return 'N/A'
  
  const formattedValue = Math.abs(numericValue).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  
  const sign = numericValue >= 0 ? '+' : '-'
  return `${sign}${formattedValue} TL`
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
  userNotes.value = ''
  autoNotes.value = ''
  
     // İşlem tipini seçimsiz yap
   islemTipi.value = null
   
   // İşlem türünü seçimsiz yap
   islemArac.value = null
   
   // Çıkan/Giren seçimini temizle
   cikanGiren.value = null
   
   // Combobox değerini temizle
   selectedComboboxValue.value = ''
   
   // Combobox seçeneklerini temizle
   comboboxOptions.value = []
  
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
  refreshAutoNotes()
}

async function onKaydet() {
  if (saving.value) return
  saving.value = true
  try {
    // GELİR/GİDER seçimi kontrolü - Giren/Çıkan seçildiğinde bu kontrol yapılmayacak
    if (!islemTipi.value && !cikanGiren.value) {
      $q.notify({
        type: 'warning',
        message: 'Lütfen önce GELİR/GİDER veya Giren/Çıkan seçimi yapın'
      })
      return
    }

    // Giren/Çıkan seçimi kontrolü - GELİR/GİDER seçimine göre otomatik belirlenir
    if (!cikanGiren.value) {
      // GELİR/GİDER seçimine göre otomatik Giren/Çıkan seçimi yap
      if (islemTipi.value === 'gelir') {
        cikanGiren.value = 'giren'
      } else if (islemTipi.value === 'gider') {
        cikanGiren.value = 'cikan'
      }
    } else {
      // Giren/Çıkan seçildiğinde GELİR/GİDER seçimini temizle
      islemTipi.value = null
    }

    // GELİR/GİDER seçimi durumu
    if (islemTipi.value === 'gider' || islemTipi.value === 'gelir') {
      await handleGelirGiderKaydet()
    }
    // Giren/Çıkan seçimi durumu
    else if (cikanGiren.value === 'giren' || cikanGiren.value === 'cikan') {
      await handleGirenCikanKaydet()
    }
    // Hiçbiri seçilmemiş
    else {
      $q.notify({
        type: 'warning',
        message: 'Lütfen GELİR/GİDER veya Giren/Çıkan seçimi yapın'
      })
    }

  } catch (error) {
    console.error('Kaydetme hatası:', error)
    $q.notify({
      type: 'negative',
      message: 'Kaydetme işlemi sırasında hata oluştu',
      timeout: 3000
    })
  } finally {
    saving.value = false
  }
}

// Personel Tahakkuk butonu click handler
function onPersonelTahakkukClick() {
  console.log('PERSONEL TAHAKKUK / ÖDEME İŞLEMLERİ butonuna tıklandı')
  showPersonelTahakkukModal.value = true
}

// Personel Tahakkuk Modal kaydet handler
function onPersonelTahakkukKaydet(data: { 
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
}) {
  console.log('✅ Personel tahakkuk/ödeme işlemi başarıyla tamamlandı:', data)
  
  // Modal zaten kapalı, sadece log yapıp onay mesajı göster
  if (data.result) {
    console.log('📊 İşlem detayları:', data.result)
  }
  
  // Başarı bildirimi (ek bilgilendirme)
  $q.notify({
    type: 'info',
    message: `${data.personel} için ${data.islemTipi} işlemi başarıyla kaydedildi`,
    position: 'top',
    timeout: 2000
  })
}

// GELİR/GİDER kayıt işlemi
async function handleGelirGiderKaydet() {
  const kayitlar = []
  const bugun = new Date().toLocaleDateString('tr-TR') // DD.MM.YYYY formatında
  // Aktif kullanıcı bilgisi - login sayfasından alınacak
  const aktifKullanici = sessionStorage.getItem('username') || localStorage.getItem('username') || 'admin'
  debugLog('Aktif kullanıcı bilgisi:', {
    sessionStorage: sessionStorage.getItem('username'),
    localStorage: localStorage.getItem('username'),
    final: aktifKullanici
  })

  // Ortak parametreler
  const ortakParametreler = {
    iKytTarihi: bugun,
    islemKllnc: aktifKullanici,
    islemOzel1: '',
    islemOzel2: '',
    islemOzel3: '',
    islemOzel4: '',
    islemBirim: 'Adet',
    islemDoviz: 'TL',
    islemKur: 1.00,
    // Tek kaynak: not textbox içeriği (giderNotuDisplay)
    islemBilgi: (giderNotuDisplay.value || '').trim()
  }

  // 1. GELİR/GİDER kayıtları - Giren/Çıkan seçildiğinde bu kısım çalışmayacak
  let seciliGelirGiderler: (GiderKategori | GelirKategori)[] = []
  
  if (selectedComboboxValue.value) {
    // Combobox dolu - sadece 1 gelir/gider kaydı
    const seciliGelirGider = islemTipi.value === 'gider' 
      ? tumGiderRows.value.find(row => row.selected)
      : gelirRows.value.find(row => row.selected)

    if (seciliGelirGider) {
      kayitlar.push({
        ...ortakParametreler,
        islemCrKod: typeof selectedComboboxValue.value === 'object' ? selectedComboboxValue.value.value : selectedComboboxValue.value,
        islemArac: 'Cari İşlem',
        islemTip: islemTipi.value === 'gelir' ? 'GELİR' : 'GİDER',
        islemGrup: islemTipi.value === 'gider' ? (seciliGelirGider as GiderKategori).giderAdi : (seciliGelirGider as GelirKategori).gelirAdi,
        islemAltG: typeof selectedComboboxValue.value === 'object' ? selectedComboboxValue.value.label : selectedComboboxValue.value,
        islemMiktar: seciliGelirGider.miktar,
        islemTutar: seciliGelirGider.miktar * parseTutarDeger(seciliGelirGider.tutar)
      })
    }
  } else {
    // Combobox boş - birden fazla gelir/gider kaydı
    seciliGelirGiderler = islemTipi.value === 'gider'
      ? tumGiderRows.value.filter(row => row.selected)
      : gelirRows.value.filter(row => row.selected)

    seciliGelirGiderler.forEach(row => {
      kayitlar.push({
        ...ortakParametreler,
        islemCrKod: 'PC10000',
        islemArac: 'Cari İşlem',
        islemTip: islemTipi.value === 'gelir' ? 'GELİR' : 'GİDER',
        islemGrup: islemTipi.value === 'gider' ? (row as GiderKategori).giderAdi : (row as GelirKategori).gelirAdi,
        islemAltG: '',
        islemMiktar: row.miktar,
        islemTutar: row.miktar * parseTutarDeger(row.tutar)
      })
    })
  }

  // 2. Ödeme kayıtları
  const seciliOdemeAraclari = []
  if (odemeAraclari.value.nakitKasa && odemeAraclari.value.nakitKasaTutar) {
    seciliOdemeAraclari.push({
      islemCrKod: 'PN10000',
      islemArac: 'Nakit Kasa(TL)',
      islemTutar: parseTutarDeger(odemeAraclari.value.nakitKasaTutar)
    })
  }
  if (odemeAraclari.value.krediKartlari && odemeAraclari.value.krediKartlariTutar) {
    seciliOdemeAraclari.push({
      islemCrKod: 'PK10000',
      islemArac: 'Kredi Kartları',
      islemTutar: parseTutarDeger(odemeAraclari.value.krediKartlariTutar)
    })
  }
  if (odemeAraclari.value.bankaEft && odemeAraclari.value.bankaEftTutar) {
    seciliOdemeAraclari.push({
      islemCrKod: 'PB10000',
      islemArac: 'Banka EFT',
      islemTutar: parseTutarDeger(odemeAraclari.value.bankaEftTutar)
    })
  }

  // Ödeme kayıtlarını ekle
  seciliOdemeAraclari.forEach(odeme => {
    kayitlar.push({
      ...ortakParametreler,
      islemCrKod: odeme.islemCrKod,
      islemArac: odeme.islemArac,
      islemTip: islemTipi.value === 'gelir' ? 'Giren' : 'Çıkan',
      islemGrup: seciliGelirGiderler && seciliGelirGiderler.length > 1 
        ? (islemTipi.value === 'gider' ? 'Sair Giderler' : 'Sair Gelirler')
        : (seciliGelirGiderler?.[0] ? (islemTipi.value === 'gider' ? (seciliGelirGiderler[0] as GiderKategori).giderAdi : (seciliGelirGiderler[0] as GelirKategori).gelirAdi) : 'Sair Giderler') || 'Sair Giderler',
      islemAltG: typeof selectedComboboxValue.value === 'object' ? selectedComboboxValue.value.label : selectedComboboxValue.value || '',
      islemMiktar: 1,
      islemTutar: odeme.islemTutar
    })
  })

  // Kayıtları backend'e gönder
  debugLog('Kaydedilecek kayıtlar:', kayitlar)
  
  try {
    const response = await api.post('/islem/kaydet', { kayitlar })
    debugLog('Backend yanıtı:', response.data)
  } catch (error) {
    console.error('Backend kayıt hatası:', error)
    throw new Error('Kayıt işlemi başarısız')
  }
  
  $q.notify({
    type: 'positive',
    message: `${kayitlar.length} kayıt başarıyla kaydedildi`,
    timeout: 3000
  })

  // Formu temizle
  temizleForm()
}

// Giren/Çıkan kayıt işlemi
async function handleGirenCikanKaydet() {
  const kayitlar: Array<{
    iKytTarihi: string
    islemKllnc: string
    islemOzel1: string
    islemOzel2: string
    islemOzel3: string
    islemOzel4: string
    islemBirim: string
    islemDoviz: string
    islemKur: number
    islemBilgi: string
    islemCrKod: string
    islemArac: string
    islemTip: string
    islemGrup: string
    islemAltG: string
    islemMiktar: number
    islemTutar: number
  }> = []
  const bugun = new Date().toLocaleDateString('tr-TR') // DD.MM.YYYY formatında
  
  // Aktif kullanıcı bilgisi - login sayfasından alınacak
  const aktifKullanici = sessionStorage.getItem('username') || localStorage.getItem('username') || 'admin'
  debugLog('Aktif kullanıcı bilgisi:', {
    sessionStorage: sessionStorage.getItem('username'),
    localStorage: localStorage.getItem('username'),
    final: aktifKullanici
  })

  // Ortak parametreler
  const ortakParametreler = {
    iKytTarihi: bugun,
    islemKllnc: aktifKullanici,
    islemOzel1: '',
    islemOzel2: '',
    islemOzel3: '',
    islemOzel4: '',
    islemBirim: 'Adet',
    islemDoviz: 'TL',
    islemKur: 1.00,
    // Tek kaynak: not textbox içeriği (giderNotuDisplay)
    islemBilgi: (giderNotuDisplay.value || '').trim()
  }

  // Combobox kontrolü
  if (!selectedComboboxValue.value) {
    $q.notify({
      type: 'warning',
      message: 'Giren/Çıkan işlemi için cari seçimi zorunludur'
    })
    return
  }

  // Seçili ödeme araçlarını bul
  const seciliOdemeAraclari = []
  if (odemeAraclari.value.nakitKasa && odemeAraclari.value.nakitKasaTutar) {
    seciliOdemeAraclari.push({
      islemCrKod: 'PN10000',
      islemArac: 'Nakit Kasa(TL)',
      islemTutar: parseTutarDeger(odemeAraclari.value.nakitKasaTutar)
    })
  }
  if (odemeAraclari.value.krediKartlari && odemeAraclari.value.krediKartlariTutar) {
    seciliOdemeAraclari.push({
      islemCrKod: 'PK10000',
      islemArac: 'Kredi Kartları',
      islemTutar: parseTutarDeger(odemeAraclari.value.krediKartlariTutar)
    })
  }
  if (odemeAraclari.value.bankaEft && odemeAraclari.value.bankaEftTutar) {
    seciliOdemeAraclari.push({
      islemCrKod: 'PB10000',
      islemArac: 'Banka EFT',
      islemTutar: parseTutarDeger(odemeAraclari.value.bankaEftTutar)
    })
  }

  // En az bir ödeme aracı seçili olmalı
  if (seciliOdemeAraclari.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'En az bir ödeme aracı seçilmelidir'
    })
    return
  }

  // Ödeme kayıtlarını oluştur - Giren/Çıkan seçildiğinde sadece bu kayıtlar yapılacak
  // Kaydetmeden hemen önce otomatik notları güncelle
  refreshAutoNotes()
  // Combobox doluysa islemCrKod olarak seçilen cari kodu kullanılacak
  const comboboxDolu = Boolean(selectedComboboxValue.value);
  const seciliCariKod = comboboxDolu
    ? (typeof selectedComboboxValue.value === 'object'
        ? selectedComboboxValue.value.value
        : selectedComboboxValue.value)
    : '';

  seciliOdemeAraclari.forEach(odeme => {
    kayitlar.push({
      ...ortakParametreler,
      // Combobox dolu iken islemCrKod = seçilen Tedarikçi/Müşteri Cari Kodu, değilse ödeme aracının hesabı
      islemCrKod: comboboxDolu ? seciliCariKod : odeme.islemCrKod,
      islemArac: odeme.islemArac,
      islemTip: cikanGiren.value === 'giren' ? 'Giren' : 'Çıkan',
      islemGrup: cikanGiren.value === 'giren' ? 'Sair Gelirler' : 'Sair Giderler',
      islemAltG: typeof selectedComboboxValue.value === 'object' ? selectedComboboxValue.value.label : selectedComboboxValue.value,
      islemMiktar: 1,
      islemTutar: odeme.islemTutar
    })
  })

  // Kayıtları backend'e gönder
  debugLog('Giren/Çıkan kaydedilecek kayıtlar:', kayitlar)
  
  try {
    const response = await api.post('/islem/kaydet', { kayitlar })
    debugLog('Backend yanıtı:', response.data)
  } catch (error) {
    console.error('Backend kayıt hatası:', error)
    throw new Error('Kayıt işlemi başarısız')
  }
  
  $q.notify({
    type: 'positive',
    message: `${kayitlar.length} Giren/Çıkan kayıt başarıyla kaydedildi`,
    timeout: 3000
  })

  // Formu temizle
  temizleForm()
}

// Yardımcı: Para formatı
function formatTRY(value: number): string {
  return Number(value || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

// Otomatik not üretici
function buildAutoNotes(): string {
  const parts: string[] = []

  // Sadece GELİR/GİDER modunda detay listeleri göster
  if (islemTipi.value === 'gider') {
    const secili = tumGiderRows.value
      .filter(r => r.selected && r.tutar !== null)
      .sort((a, b) => (b.selectedAt || 0) - (a.selectedAt || 0))
    secili.forEach(r => {
      const satirTutar = r.miktar * parseTutarDeger(r.tutar)
      parts.push(`(${r.giderAdi} - ${formatTRY(satirTutar)})`)
    })
  } else if (islemTipi.value === 'gelir') {
    const secili = gelirRows.value
      .filter(r => r.selected && r.tutar !== null)
      .sort((a, b) => (b.selectedAt || 0) - (a.selectedAt || 0))
    secili.forEach(r => {
      const satirTutar = r.miktar * parseTutarDeger(r.tutar)
      parts.push(`(${r.gelirAdi} - ${formatTRY(satirTutar)})`)
    })
  }

  return parts.join(' ')
}

function refreshAutoNotes() {
  autoNotes.value = buildAutoNotes()
}

// İşlem tipi değiştiğinde notları güncelle
watch(islemTipi, () => {
  refreshAutoNotes()
})



// Tedarikçi listesini yükle
async function loadTedarikciListesi() {
  try {
    debugLog('Tedarikçi listesi yükleniyor...')

    // Production'da Railway backend URL'ini kullan, development'ta proxy kullan
    const baseUrl = import.meta.env.PROD 
      ? 'https://gokceweb-production.up.railway.app'
      : ''
    const response = await fetch(`${baseUrl}/cari/tedarikci`)
    debugLog('Tedarikçi response status:', response.status)
    debugLog('Tedarikçi response headers:', response.headers)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Tedarikçi response error text:', errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const data = await response.json()
    debugLog('Tedarikçi API response:', data)
    debugLog('Tedarikçi data type:', typeof data)
    debugLog('Tedarikçi data length:', Array.isArray(data) ? data.length : 'Not an array')

    if (!Array.isArray(data)) {
      throw new Error('Tedarikçi API response is not an array')
    }

    tedarikciListesi.value = data.map((item: CariResponse) => ({
      label: item.CariAdi,
      value: item.CariKod,
      bakiye: item.CariBakiye ? item.CariBakiye.toString() : '0.00',
      vtc: item.CariVTCN || ''
    }))

    debugLog('Tedarikçi listesi yüklendi:', tedarikciListesi.value)

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

    tedarikciListesi.value = testData.map((item, index) => ({
      label: item.CariAdi,
      value: item.CariKod,
      bakiye: ((Math.random() + index * 0.3) * 10000 - 5000).toFixed(2),
      vtc: 'V' + (1000000000 + Math.floor(Math.random() * 900000000)).toString()
    }))

    debugLog('Test verileri kullanılıyor:', tedarikciListesi.value)
  }
}

// Müşteri listesini yükle
async function loadMusteriListesi() {
  try {
    debugLog('Müşteri listesi yükleniyor...')

    // Production'da Railway backend URL'ini kullan, development'ta proxy kullan
    const baseUrl = import.meta.env.PROD 
      ? 'https://gokceweb-production.up.railway.app'
      : ''
    const response = await fetch(`${baseUrl}/cari/musteri`)
    debugLog('Müşteri response status:', response.status)
    debugLog('Müşteri response headers:', response.headers)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Müşteri response error text:', errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const data = await response.json()
    debugLog('Müşteri API response:', data)
    debugLog('Müşteri data type:', typeof data)
    debugLog('Müşteri data length:', Array.isArray(data) ? data.length : 'Not an array')

    if (!Array.isArray(data)) {
      throw new Error('Müşteri API response is not an array')
    }

    musteriListesi.value = data.map((item: CariResponse) => ({
      label: item.CariAdi,
      value: item.CariKod,
      bakiye: item.CariBakiye ? item.CariBakiye.toString() : '0.00',
      vtc: item.CariVTCN || ''
    }))

    debugLog('Müşteri listesi yüklendi:', musteriListesi.value)

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

    musteriListesi.value = testData.map((item, index) => ({
      label: item.CariAdi,
      value: item.CariKod,
      bakiye: ((Math.random() + index * 0.3) * 10000 - 5000).toFixed(2),
      vtc: (10000000000 + Math.floor(Math.random() * 90000000000)).toString()
    }))

    debugLog('Test verileri kullanılıyor:', musteriListesi.value)
  }
}

// API bağlantısını test eden fonksiyon
async function testApiConnection() {
  try {
    debugLog('API bağlantısı test ediliyor...')
    
    // Production'da Railway backend URL'ini kullan, development'ta proxy kullan
    const baseUrl = import.meta.env.PROD 
      ? 'https://gokceweb-production.up.railway.app'
      : ''
    
    // Health check endpoint'ini test et
    const healthResponse = await fetch(`${baseUrl}/cari/health`)
    debugLog('Health check response status:', healthResponse.status)
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      debugLog('Health check data:', healthData)
    }
    
    // Tedarikçi endpoint'ini test et
    const tedarikciResponse = await fetch(`${baseUrl}/cari/tedarikci`)
    debugLog('Tedarikçi endpoint response status:', tedarikciResponse.status)
    
    if (tedarikciResponse.ok) {
      const tedarikciData = await tedarikciResponse.json()
      debugLog('Tedarikçi endpoint data length:', tedarikciData.length)
    }
    
  } catch (error) {
    console.error('API bağlantı testi hatası:', error)
  }
}

// Component mount olduğunda gider kategorilerini yükle
onMounted(async () => {
  loadGiderKategorileri()
  loadGelirKategorileri()
  
  // İşlem tipini başlangıçta seçimsiz yap
  islemTipi.value = null
  
  // İşlem türünü başlangıçta seçimsiz yap
  islemArac.value = null
  
  // Çıkan/Giren seçimini başlangıçta seçimsiz yap
  cikanGiren.value = null
  
  // Combobox'ı başlangıçta boş yap
  comboboxOptions.value = []
  
  // API bağlantısını test et
  await testApiConnection()
  
  await loadTedarikciListesi()
  await loadMusteriListesi()

  // Debug için console log'ları
  debugLog('Tedarikçi listesi:', tedarikciListesi.value)
  debugLog('Müşteri listesi:', musteriListesi.value)
  debugLog('Combobox options:', comboboxOptions.value)
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

/* Checkbox elementleri arasındaki mesafeleri azalt */
.gider-table .q-table tbody tr,
.gelir-table .q-table tbody tr {
  height: 24px;
  min-height: 24px;
}

.gider-table .q-table td,
.gelir-table .q-table td {
  padding: 1px 2px;
  height: 24px;
  line-height: 1.1;
}

.gider-table .q-table th,
.gelir-table .q-table th {
  padding: 2px 2px;
  height: 28px;
  line-height: 1.1;
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
  min-height: 80px;
}

.not-textarea .q-field__control-container {
  height: 100%;
  min-height: 80px;
}

.not-textarea .q-field__native {
  height: 100%;
  min-height: 80px;
  resize: none;
}

/* Ortak Container - Genel Toplam ve Form Butonları */
.ortak-container {
  width: 49%;
}

.odeme-araci-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 0.75rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  border: none;
  transition: all 0.3s ease;
}

/* Dark mode adaptasyonu */
.body--dark .odeme-araci-card {
  background: rgba(40, 40, 40, 0.8);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  border: none;
}

.odeme-araci-column {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.odeme-araci-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.05rem 0;
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
 
 /* Ödeme Container Disabled State - pointer-events olmadan */
 .odeme-container-disabled {
   opacity: 0.4;
   filter: grayscale(50%);
   transition: all 0.3s ease;
 }
 
 /* Ödeme container içindeki checkbox'ları her zaman tıklanabilir yap */
.odeme-container-disabled .q-checkbox {
  pointer-events: auto !important;
  opacity: 1 !important;
}

/* Checkbox elementlerini daha kompakt yap */
.gider-table .q-checkbox,
.gelir-table .q-checkbox {
  margin: 0;
  padding: 0;
}

.gider-table .q-checkbox :deep(.q-checkbox__inner),
.gelir-table .q-checkbox :deep(.q-checkbox__inner) {
  transform: scale(0.9);
}

.gider-table .q-checkbox :deep(.q-checkbox__label),
.gelir-table .q-checkbox :deep(.q-checkbox__label) {
  font-size: 0.85rem;
  line-height: 1.1;
  margin-left: 4px;
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
  padding: 8px 0;
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

.personel-tahakkuk-btn {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-left: 222px;
  margin-top: -20px;
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

/* Sol Container - Radio Buton Grupları */
.radio-groups-left-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 200px;
  max-width: 250px;
}

/* Sağ Container - Diğer Kontroller */
.right-controls-container {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: -16px;
}

/* Radio Group Container - TEDARİKÇİ/MÜŞTERİ için */
.right-controls-container .radio-group-container {
  margin-top: 0;
}

/* Butonlar için ek yukarı çekme */
.right-controls-container .q-btn {
  margin-top: -8px;
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