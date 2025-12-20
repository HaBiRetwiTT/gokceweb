<template>
  <q-page class="nakit-tablo-page">
    <div class="nakit-tablo-wrapper">
      <div class="table-container">
        <div class="dual-table-wrapper">
          <!-- Sol Grid Tablo - Tek Sütun -->
          <q-table
            :rows="leftTableData"
            :columns="leftColumns"
            row-key="id"
            flat
            bordered
            square
            dense
            class="nakit-tablo-grid left-table"
            :loading="loading"
            loading-label="Veriler yükleniyor..."
            :row-class-name="getRowClass"
            :no-data-label="'Veri bulunamadı'"
            :no-results-label="'Sonuç bulunamadı'"
            hide-pagination
            :pagination="{ rowsPerPage: 0 }"

          >
            <template v-slot:top>
              <div class="table-actions left-table-actions">
                <div class="devreden-bakiye-section" style="width: 100%;">
                  <label class="devreden-bakiye-label">Devreden Bakiye</label>
                  <q-input
                    :model-value="`₺ ${(devredenBakiye - kartBakiye - acentaBakiye).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`"
                    readonly
                    dense
                    outlined
                    class="devreden-bakiye-input"
                    style="width: 100%;"
                  />
                </div>
              </div>
            </template>
          </q-table>
          
          <!-- Sağ Grid Tablo - Ana Tablo -->
          <q-table
            :rows="filteredData"
            :columns="columns"
            row-key="id"
            flat
            bordered
            square
            dense
            class="nakit-tablo-grid right-table"
            :loading="loading"
            loading-label="Veriler yükleniyor..."
            :row-class-name="getRowClass"
            @row-dblclick="onRowDoubleClick"
            :no-data-label="'Veri bulunamadı'"
            :no-results-label="'Sonuç bulunamadı'"
            hide-pagination
            :pagination="{ rowsPerPage: 0 }"
          >
            <!-- Tutar sütunu için özel template -->
            <template v-slot:body-cell-islmTtr="props">
              <q-td 
                :props="props" 
                :class="{ 'tutar-ttr-drm': props.row.ttrDrm }"
              >
                {{ formatTutar(props.value) }}
              </q-td>
            </template>
            <template v-slot:top>
              <div class="table-actions">
                
                <div class="date-selector">
                  <q-input
                    v-model="selectedDate"
                    label="Başlangıç Tarihi"
                    style="width: 120px;"
                    readonly
                    class="date-input-compact"
                  >
                    <template v-slot:prepend>
                      <q-icon name="event" class="cursor-pointer calendar-icon-compact">
                        <q-popup-proxy 
                          ref="datePopup"
                          cover 
                          transition-show="scale" 
                          transition-hide="scale"
                        >
                          <q-date
                            v-model="selectedDate"
                            mask="DD.MM.YYYY"
                            format="DD.MM.YYYY"
                            @update:model-value="onDateSelected"
                          />
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>
                
                <!-- Refresh ikonu -->
                <q-btn
                  flat
                  round
                  dense
                  icon="refresh"
                  color="primary"
                  class="refresh-btn"
                  @click="refreshPage"
                  title="Sayfayı Yenile"
                />
                
                <!-- Yeni Kayıt Butonu -->
                <q-btn
                  color="primary"
                  icon="add"
                  label="YENİ KAYIT"
                  style="margin-left: 16px;"
                  @click="addNewRecord"
                />
                
                <!-- İşlem Tanımı Filtresi -->
                <div class="filter-selector" style="margin-left: 16px;">
                  <q-input
                    v-model="islemTanimiFilter"
                    label="İşlem Tanımı"
                    style="width: 150px;"
                    dense
                    outlined
                    clearable
                    placeholder="filtre gir..."
                  >
                    <template v-slot:prepend>
                      <q-icon name="filter_list" />
                    </template>
                  </q-input>
                </div>
                
                <!-- Kasa Bakiyeleri Etiketleri -->
                <div class="kasa-bakiyeleri-container" style="margin-left: 16px;">
                  <q-chip
                    color="green-7"
                    text-color="white"
                    dense
                    class="bakiye-chip"
                  >
                    <strong>Nakit:</strong>&nbsp;{{ formatCurrency(nakitBakiye) }}
                  </q-chip>
                  <q-chip
                    color="purple-7"
                    text-color="white"
                    dense
                    class="bakiye-chip"
                  >
                    <strong>Banka:</strong>&nbsp;{{ formatCurrency(bankaBakiye) }}
                  </q-chip>
                  <q-separator vertical class="q-mx-sm" />
                  <q-chip
                    color="deep-purple-9"
                    text-color="white"
                    dense
                    class="bakiye-chip toplam-chip"
                  >
                    <strong>Nakit+Banka:</strong>&nbsp;{{ formatCurrency(nakitBakiye + bankaBakiye) }}
                  </q-chip>
                  <q-separator vertical class="q-mx-sm" />
                  <q-chip
                    color="blue-7"
                    text-color="white"
                    dense
                    class="bakiye-chip"
                  >
                    <strong>Kart:</strong>&nbsp;{{ formatCurrency(kartBakiye) }}
                  </q-chip>
                  <q-chip
                    color="orange-7"
                    text-color="white"
                    dense
                    class="bakiye-chip"
                  >
                    <strong>Acenta:</strong>&nbsp;{{ formatCurrency(acentaBakiye) }}
                  </q-chip>
                </div>
              </div>
            </template>
            
            <template v-slot:no-data>
              <div class="no-data-message">
                <q-icon name="table_chart" size="48px" color="grey-5" />
                <p>Henüz veri bulunmuyor. Yeni kayıt eklemek için "Yeni Kayıt Ekle" butonunu kullanın.</p>
              </div>
            </template>
          </q-table>
        </div>
      </div>
    </div>
    
    <!-- Yeni Kayıt Ekleme Modal -->
    <q-dialog v-model="showNewRecordModal" persistent no-esc-dismiss>
      <q-card 
        ref="modalCard"
        style="min-width: 600px; max-width: 90vw;" 
        class="new-record-modal draggable-modal"
      >
        <q-card-section class="modal-header" style="cursor: move;">
          <div class="modal-title-section" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div class="modal-title-left">
              <span class="modal-title">FON KAYIT İŞLEMLERİ</span>
            </div>
            <q-btn dense flat round icon="calculate" @click="onOpenCalculator" :title="'Hesap Makinesi'" />
          </div>
        </q-card-section>

        <q-card-section class="modal-body">
          <div class="form-grid">
            <!-- İşlem Günü -->
            <div class="form-field">
              <label class="form-label">İşlem Günü</label>
              <q-input
                v-model="newRecord.OdmVade"
                dense
                outlined
                class="form-input"
                readonly
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy ref="islemGunuPopup">
                      <q-date
                        v-model="newRecord.OdmVade"
                        mask="DD.MM.YYYY"
                        format="DD.MM.YYYY"
                        @update:model-value="() => islemGunuPopup?.hide?.()"
                      />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <!-- İşlem Aracı -->
            <div class="form-field">
              <label class="form-label">İşlem Aracı</label>
              <q-select
                v-model="newRecord.islmArac"
                :options="islemAraciOptions"
                dense
                outlined
                class="form-input"
                emit-value
                map-options
              />
            </div>

            <!-- İşlem Tipi -->
            <div class="form-field">
              <label class="form-label">İşlem Tipi</label>
              <q-select
                v-model="newRecord.islmTip"
                :options="islemTipiOptions"
                dense
                outlined
                class="form-input"
                emit-value
                map-options
              />
            </div>

            <!-- İşlem Kategorisi -->
            <div class="form-field">
              <label class="form-label">İşlem Kategorisi</label>
              <q-select
                v-model="newRecord.islmGrup"
                :options="islemKategoriOptions"
                dense
                outlined
                class="form-input"
                emit-value
                map-options
              />
            </div>

            <!-- İşlem Tanımı -->
            <div class="form-field">
              <label class="form-label">İşlem Tanımı</label>
              <q-select
                v-model="islemTanimiModel"
                :options="islemTanimiOptions"
                dense
                outlined
                class="form-input islem-tanimi-select"
                use-input
                hide-dropdown-icon
                input-debounce="300"
                popup-content-class="islem-tanimi-popup"
                style="width: 100%;"
                v-model:input-value="islemTanimiText"
                menu-anchor="bottom left"
                menu-self="top left"
                fit
                :placeholder="islemTanimiModel ? '' : 'İşlem tanımı yazın...'"
                @filter="onFilterIslemTanimi"
                @update:model-value="onIslemTanimiSelect"
                @blur="onIslemTanimiBlur"
                @input="onIslemTanimiInput"
                clearable
                emit-value
                map-options
                :options-dense="true"
                :virtual-scroll="false"
                :menu-offset="[0, 8]"
                :behavior="'menu'"
              >
                <template v-slot:prepend>
                  <q-icon name="search" color="green-6" />
                </template>
                <template v-slot:before-options>
                  <div class="row text-caption text-grey-7 q-px-sm q-pt-sm q-pb-xs islem-tanimi-header">
                    <div class="col-12">İşlem Tanımı</div>
                  </div>
                  <q-separator />
                </template>
                <template v-slot:option="{ opt, selected, toggleOption }">
                  <q-item 
                    dense 
                    clickable 
                    @click="toggleOption(opt)"
                    :active="selected"
                    active-class="bg-primary text-white"
                  >
                    <q-item-section>
                      <div class="islem-tanimi-option">
                        {{ opt }}
                      </div>
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      Sonuç bulunamadı. Yazdığınız değer otomatik olarak eklenir.
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- İşlem Açıklaması -->
            <div class="form-field">
              <label class="form-label">İşlem Açıklaması</label>
              <q-input
                v-model="newRecord.islmBilgi"
                dense
                outlined
                class="form-input"
                type="textarea"
                rows="3"
              />
            </div>

            <!-- Ödeme Tutarı -->
            <div class="form-field payment-amount-field">
              <label class="form-label">Ödeme Tutarı</label>
              <div class="payment-input-group">
                <q-input
                  v-model.number="newRecord.islmTtr"
                  dense
                  outlined
                  class="form-input payment-input"
                  type="number"
                  min="0"
                  step="1"
                />
                <q-checkbox
                  v-model="newRecord.OdmDrm"
                  label="Ödendi"
                  class="form-checkbox payment-checkbox"
                />
                <div class="taksit-group">
                  <label class="taksit-label">Taksit</label>
                  <div class="taksit-input-container">
                  <q-input
                      v-model.number="newRecord.islmTkst"
                    dense
                    outlined
                    class="form-input taksit-input"
                    type="number"
                    min="1"
                      max="120"
                      step="1"
                      inputmode="numeric"
                      placeholder="1"
                      @keydown="onTaksitKeydown"
                      :rules="[
                        val => !!val || 'Taksit bilgisi gerekli',
                        val => val >= 1 || 'Taksit en az 1 olmalı',
                        val => val <= 120 || 'Taksit en fazla 120 olmalı'
                      ]"
                    />
                    <div class="taksit-spin-buttons">
                      <q-btn
                        dense
                        flat
                        size="xs"
                        icon="keyboard_arrow_up"
                        @click="incrementTaksit"
                        class="taksit-spin-btn up"
                        :disable="Number(newRecord.islmTkst) >= 120"
                      />
                      <q-btn
                        dense
                        flat
                        size="xs"
                        icon="keyboard_arrow_down"
                        @click="decrementTaksit"
                        class="taksit-spin-btn down"
                        :disable="Number(newRecord.islmTkst) <= 1"
                      />
                    </div>
                  </div>
                </div>
                <!-- Kayıt Takip Checkbox -->
                <div class="form-field checkbox-field">
                  <q-checkbox
                    v-model="newRecord.ttrDrm"
                    label="Kayıt Takip"
                    class="form-checkbox"
                  />
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions class="modal-actions">
          <div class="action-buttons-container">
            <q-btn
              color="primary"
              icon="add"
              label="YENİ KAYIT EKLE"
              @click="saveNewRecord"
              class="action-btn primary-btn"
            />
            <q-btn
              color="primary"
              icon="close"
              label="KAPAT"
              @click="closeNewRecordModal"
              class="action-btn close-btn"
            />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Düzenleme/Silme Modal -->
    <q-dialog v-model="showEditModal" persistent no-esc-dismiss>
      <q-card 
        ref="modalCard"
        style="min-width: 600px; max-width: 90vw;" 
        class="new-record-modal draggable-modal"
      >
            <q-card-section class="modal-header" style="cursor: move;">
      <div class="modal-title-section" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <div class="modal-title-left">
          <span class="modal-title">SEÇİLEN FON KAYIT DÜZENLEME İŞLEMLERİ</span>
        </div>
        <div class="row items-center" style="gap:8px;">
          <q-input
            v-model="selectedFKasaNo"
            dense
            outlined
            readonly
            class="fKasaNo-label"
            style="width: 120px;"
          />
          <q-btn dense flat round icon="calculate" @click="onOpenCalculator" :title="'Hesap Makinesi'" />
        </div>
      </div>
    </q-card-section>

        <q-card-section class="modal-body">
          <div class="form-grid">
            <!-- İşlem Günü -->
            <div class="form-field">
              <label class="form-label">İşlem Günü</label>
              <q-input
                v-model="newRecord.OdmVade"
                dense
                outlined
                class="form-input"
                readonly
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy ref="islemGunuPopup">
                      <q-date
                        v-model="newRecord.OdmVade"
                        mask="DD.MM.YYYY"
                        format="DD.MM.YYYY"
                        @update:model-value="() => islemGunuPopup?.hide?.()"
                      />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <!-- İşlem Aracı -->
            <div class="form-field">
              <label class="form-label">İşlem Aracı</label>
              <q-select
                v-model="newRecord.islmArac"
                :options="islemAraciOptions"
                dense
                outlined
                class="form-input"
                emit-value
                map-options
              />
            </div>

            <!-- İşlem Tipi -->
            <div class="form-field">
              <label class="form-label">İşlem Tipi</label>
              <q-select
                v-model="newRecord.islmTip"
                :options="islemTipiOptions"
                dense
                outlined
                class="form-input"
                emit-value
                map-options
              />
            </div>

            <!-- İşlem Kategorisi -->
            <div class="form-field">
              <label class="form-label">İşlem Kategorisi</label>
              <q-select
                v-model="newRecord.islmGrup"
                :options="islemKategoriOptions"
                dense
                outlined
                class="form-input"
                emit-value
                map-options
              />
            </div>

            <!-- İşlem Tanımı -->
            <div class="form-field">
              <label class="form-label">İşlem Tanımı</label>
              <q-select
                v-model="islemTanimiModel"
                :options="islemTanimiOptions"
                dense
                outlined
                class="form-input islem-tanimi-select"
                use-input
                hide-dropdown-icon
                input-debounce="300"
                popup-content-class="islem-tanimi-popup"
                style="width: 100%;"
                v-model:input-value="islemTanimiText"
                menu-anchor="bottom left"
                menu-self="top left"
                fit
                :placeholder="islemTanimiModel ? '' : 'İşlem tanımı yazın...'"
                @filter="onFilterIslemTanimi"
                @update:model-value="onIslemTanimiSelect"
                @blur="onIslemTanimiBlur"
                @input="onIslemTanimiInput"
                clearable
                emit-value
                map-options
                :options-dense="true"
                :virtual-scroll="false"
                :menu-offset="[0, 8]"
                :behavior="'menu'"
              >
                <template v-slot:prepend>
                  <q-icon name="search" color="green-6" />
                </template>
                <template v-slot:before-options>
                  <div class="row text-caption text-grey-7 q-px-sm q-pt-sm q-pb-xs islem-tanimi-header">
                    <div class="col-12">İşlem Tanımı</div>
                  </div>
                  <q-separator />
                </template>
                <template v-slot:option="{ opt, selected, toggleOption }">
                  <q-item 
                    dense 
                    clickable 
                    @click="toggleOption(opt)"
                    :active="selected"
                    active-class="bg-primary text-white"
                  >
                    <q-item-section>
                      <div class="islem-tanimi-option">
                        {{ opt }}
                      </div>
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      Sonuç bulunamadı. Yazdığınız değer otomatik olarak eklenir.
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- İşlem Açıklaması -->
            <div class="form-field">
              <label class="form-label">İşlem Açıklaması</label>
              <q-input
                v-model="newRecord.islmBilgi"
                dense
                outlined
                class="form-input"
                type="textarea"
                rows="3"
              />
            </div>

            <!-- Ödeme Tutarı -->
            <div class="form-field payment-amount-field">
              <label class="form-label">Ödeme Tutarı</label>
              <div class="payment-input-group">
                <q-input
                  v-model.number="newRecord.islmTtr"
                  dense
                  outlined
                  class="form-input payment-input"
                  type="number"
                  min="0"
                  step="1"
                />
                <q-checkbox
                  v-model="newRecord.OdmDrm"
                  label="Ödendi"
                  class="form-checkbox payment-checkbox"
                />
                <div class="taksit-group">
                  <label class="taksit-label">Taksit</label>
                  <q-input
                    v-model="newRecord.islmTkst"
                    dense
                    outlined
                    class="form-input taksit-input"
                    type="text"
                    placeholder="1 / 1"
                    readonly
                  />
                </div>
                <!-- Kayıt Takip Checkbox -->
                <div class="form-field checkbox-field">
                  <q-checkbox
                    v-model="newRecord.ttrDrm"
                    label="Kayıt Takip"
                    class="form-checkbox"
                  />
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions class="modal-actions">
          <div class="action-buttons-container">
            <!-- Üst sıra butonlar - yan yana -->
            <div class="button-row">
              <q-btn
                color="primary"
                icon="edit"
                label="ÖDEME BİLGİLERİNİ DÜZENLE"
                @click="saveEditRecord"
                class="action-btn primary-btn wide-edit-btn"
              />
              <q-btn
                color="negative"
                icon="delete"
                label="FON KAYDINI SİL"
                @click="deleteRecord"
                class="action-btn delete-btn wide-delete-btn"
              />
            </div>
            
                        <!-- Textbox'lar - yan yana -->
            <div class="textbox-row">
              <div class="form-field erteleme-field">
                <label class="form-label">Erteleme Tarihi</label>
                <q-input
                  v-model="ertelemeTarihi"
                  dense
                  outlined
                  class="form-input"
                  type="text"
                  placeholder="DD.MM.YYYY"
                  readonly
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy 
                        ref="ertelemeTarihiPopup"
                        cover 
                        transition-show="scale" 
                        transition-hide="scale"
                      >
                                            <q-date
                      v-model="ertelemeTarihi"
                      mask="DD.MM.YYYY"
                      format="DD.MM.YYYY"
                      :options="ertelemeTarihiOptions"
                      @update:model-value="onErtelemeTarihiChange"
                    />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="form-field odenen-field">
                <label class="form-label">Ödenen</label>
                            <q-input
              v-model="odenenTutar"
              dense
              outlined
              class="form-input"
              type="number"
              placeholder="0.00"
              @blur="onOdenenTutarBlur"
            />
              </div>
              <div class="kismi-btn-container">
                <q-btn
                  color="warning"
                  icon="payment"
                  label="KISMİ ÖDEME YAP"
                  @click="kismiOdemeYap"
                  class="action-btn warning-btn wide-kismi-btn"
                />
              </div>
            </div>
            
            <!-- Kapat butonu -->
            <div class="button-row">
              <q-btn
                color="primary"
                icon="close"
                label="KAPAT"
                @click="closeEditModal"
                class="action-btn close-btn wide-close-btn"
              />
            </div>
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';
import { api } from '../boot/axios';
import { getNakitAkisVerileri, getBugunTarih, getFonDevirY, getIslmAltGruplar, type NakitAkisRecord } from '../services/nakit-akis.service';

const $q = useQuasar();

// Axios instance'ını al
const instance = getCurrentInstance()
const $api = instance?.proxy?.$api

// $api undefined ise normal api kullan
const apiInstance = $api || api

function onOpenCalculator() {
  window.dispatchEvent(new Event('openCalculator'))
}

// Reactive data
const tableData = ref<NakitAkisRecord[]>([]);
const loading = ref(false);
const selectedDate = ref('');
const datePopup = ref();
const devredenBakiye = ref(0);

// İşlem Tanımı filtreleme için
const islemTanimiFilter = ref('');

// Kasa bakiyeleri
const nakitBakiye = ref(0);
const kartBakiye = ref(0);
const bankaBakiye = ref(0);
const acentaBakiye = ref(0);
const depozitoBakiye = ref(0);

// Edit modal için gerekli ref'ler
const showEditModal = ref(false);
const editRecord = ref({
  OdmVade: '',
  islmArac: '',
  islmTip: '',
  islmGrup: '',
  islmAltG: '',
  islmTtr: 0,
  OdmDrm: false,
  islmTkst: 1,
  islmBilgi: '',
  ttrDrm: false
});
const editIslemTanimiModel = ref<string | null>(null);
const editIslemTanimiText = ref('');
const ertelemeTarihi = ref('');
const odenenTutar = ref(0);
const eskiTutar = ref(0); // Güncelleme öncesi eski tutar bilgisi

// Form initialize flag'i - form initialize edilirken kategori değişikliği temizleme işlemini bypass etmek için
const isFormInitializing = ref(false);

// Devreden bakiye güncelleme fonksiyonu
async function updateDevredenBakiye(tarih: string) {
  try {
    const devirBakiye = await getFonDevirY(tarih);
    
    // Number olarak sakla
    devredenBakiye.value = devirBakiye;
    
  } catch (error) {
    console.error('Devreden bakiye güncellenirken hata:', error);
    
    // Hata durumunda varsayılan değer
    devredenBakiye.value = 0;
    
    $q.notify({
      type: 'warning',
      message: `Devreden bakiye alınamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
    });
  }
}

// Sol tablo için veri ve sütunlar
const leftTableData = computed(() => {
  return filteredData.value.map((row, index) => {
    if (index === 0) {
      // İlk satır - Devir bakiyesi + Ana tablo 1. satır işlemi
      let bakiye = getPageDevirBakiyesi();
      
      // Ana tablonun ilk satırındaki işlem tipine göre hesapla
      if (filteredData.value.length > 0) {
        const firstRow = filteredData.value[0];
        const islmTip = firstRow.islmTip;
        const islmTtr = Number(firstRow.islmTtr) || 0;
        
        if (islmTip === 'Çıkan') {
          bakiye -= islmTtr;
        } else if (islmTip === 'Giren') {
          bakiye += islmTtr;
        }
      }
      
      return {
        id: `left-${index}`,
        index: bakiye.toFixed(2)
      };
    } else {
      // 2. ve sonraki satırlar - Bir üst satır sonucu + Ana tablo işlemi
      let bakiye = 0;
      
      // Bir üst satırın sonucunu hesapla
      if (index > 0 && index <= filteredData.value.length) {
        let previousBakiye = getPageDevirBakiyesi();
        
        // Bir üst satıra kadar olan tüm işlemleri hesapla
        for (let i = 0; i < index; i++) {
          const currentRow = filteredData.value[i];
          const islmTip = currentRow.islmTip;
          const islmTtr = Number(currentRow.islmTtr) || 0;
          
          if (islmTip === 'Çıkan') {
            previousBakiye -= islmTtr;
          } else if (islmTip === 'Giren') {
            previousBakiye += islmTtr;
          }
        }
        
        // Şimdi mevcut satır için işlem yap
        const currentRow = filteredData.value[index];
        const islmTip = currentRow.islmTip;
        const islmTtr = Number(currentRow.islmTtr) || 0;
        
        if (islmTip === 'Çıkan') {
          bakiye = previousBakiye - islmTtr;
        } else if (islmTip === 'Giren') {
          bakiye = previousBakiye + islmTtr;
        } else {
          bakiye = previousBakiye; // İşlem tipi belirsizse sadece devir
        }
      }
      
      return {
        id: `left-${index}`,
        index: bakiye.toFixed(2)
      };
    }
  });
});

// Devir bakiyesini hesaplayan fonksiyon (pagination olmadan, tüm veriler üzerinden)
function getPageDevirBakiyesi(): number {
  // Devreden Bakiye'den başla (Kart ve Acenta bakiyeleri düşülmüş)
  return (devredenBakiye.value || 0) - kartBakiye.value - acentaBakiye.value;
}

const leftColumns = [
  {
    name: 'index',
    label: 'Bakiye',
    field: 'index',
    align: 'center' as const,
    sortable: false,
    style: 'width: 80px',
    format: (val: string | number) => {
      if (typeof val === 'string' && !isNaN(Number(val))) {
        // İlk satır için bakiye formatı
        return `₺ ${Number(val).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      } else {
        // Diğer satırlar için sıra numarası
        return val.toString();
      }
    }
  }
];

// Filtrelenmiş veri
const filteredData = computed(() => {
  if (islemTanimiFilter.value && islemTanimiFilter.value.trim() !== '') {
    const filterText = islemTanimiFilter.value.trim().toLowerCase();
    return tableData.value.filter((row) => {
      const islmAltG = (row.islmAltG || '').toLowerCase();
      return islmAltG.includes(filterText);
    });
  }
  return tableData.value;
});

// Tablo sütunları
const columns = [
  {
    name: 'odmVade',
    label: 'Ödeme Vadesi',
    field: 'OdmVade',
    align: 'left' as const,
    sortable: true,
    style: 'width: 100px'
  },
  {
    name: 'islmArac',
    label: 'İşlem Aracı',
    field: 'islmArac',
    align: 'left' as const,
    sortable: true,
    style: 'width: 100px'
  },
  {
    name: 'islmGrup',
    label: 'İşlem Grubu',
    field: 'islmGrup',
    align: 'left' as const,
    sortable: true,
    style: 'width: 100px'
  },
  {
    name: 'islmAltG',
    label: 'İşlem Tanımı',
    field: 'islmAltG',
    align: 'left' as const,
    sortable: true,
    style: 'width: 180px'
  },
  {
    name: 'islmTip',
    label: 'İşlem Tipi',
    field: 'islmTip',
    align: 'center' as const,
    sortable: true,
    style: 'width: 80px'
  },
  {
    name: 'islmTtr',
    label: 'Tutar',
    field: 'islmTtr',
    align: 'right' as const,
    sortable: true,
    style: 'width: 100px',
    format: (val: number) => `₺ ${val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  {
    name: 'islmTkst',
    label: 'Taksit',
    field: 'islmTkst',
    align: 'center' as const,
    sortable: true,
    style: 'width: 70px'
  },
  {
    name: 'islmBilgi',
    label: 'Diğer Bilgiler',
    field: 'islmBilgi',
    align: 'left' as const,
    sortable: false,
    style: 'max-width: 700px'
  }
  // Ödeme Durumu ve Tutar Durumu sütunları kaldırıldı
];

// Yeni kayıt modalı durumu
const showNewRecordModal = ref(false);

// Yeni kayıt bilgileri
const newRecord = ref<{
  OdmVade: string;
  islmArac: string;
  islmTip: string;
  islmGrup: string;
  islmAltG: string;
  islmTtr: number;
  OdmDrm: boolean;
  islmTkst: string | number; // String veya number olabilir (örn: "1 / 1" veya 1)
  islmBilgi: string;
  ttrDrm: boolean;
}>({
  OdmVade: '',
  islmArac: '',
  islmTip: '',
  islmGrup: '',
  islmAltG: '',
  islmTtr: 0,
  OdmDrm: false,
  islmTkst: 1,
  islmBilgi: '',
  ttrDrm: true,
});

// Seçilen kaydın fKasaNo'sunu saklamak için
const selectedFKasaNo = ref(0);

// Erteleme tarihi için minimum tarih (bugün + 1 gün)
const ertelemeTarihiOptions = computed(() => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate());
  
  return (date: string) => {
    const selectedDate = new Date(date.split('.').reverse().join('-'));
    return selectedDate >= tomorrow;
  };
});

// Date picker popup ref'leri
const islemGunuPopup = ref();
const ertelemeTarihiPopup = ref();
const modalCard = ref();

// İşlem Aracı seçenekleri
const islemAraciOptions = ['Nakit Kasa(TL)', 'Banka EFT', 'Kredi Kartları'];
const islemTipiOptions = ['Çıkan', 'Giren'];
const islemKategoriOptions = ['Kredi Kartları', 'Krediler', 'Ev Kiraları', 'Ev Faturaları', 'Senet-Çek', 'Genel Fon Ödm.', 'Diğer(Şirket Ödm.)'];

// İşlem Tanımı seçenekleri (dinamik olarak güncellenir)
const islemTanimiOptions = ref<string[]>([]);
// 🔥 Orijinal işlem tanımı seçenekleri (arama için)
const originalIslemTanimiOptions = ref<string[]>([]);
// İşlem tanımı input text'i için
const islemTanimiText = ref('');
// İşlem tanımı seçim modeli için
const islemTanimiModel = ref<string | null>(null);

// Sayfa yüklendiğinde çalışır
onMounted(async () => {
  // Bugünün tarihini otomatik seç
  selectedDate.value = getBugunTarih();
  
  // Eski OdmVade kayıtlarını güncelle
  try {
    const updateResponse = await api.get('/nakit-akis/guncelle-eski-odmvade');
    if (updateResponse.data.success && updateResponse.data.updatedCount > 0) {
      console.log(`✅ ${updateResponse.data.updatedCount} kayıt güncellendi`);
      
      $q.notify({
        type: 'positive',
        message: `${updateResponse.data.updatedCount} adet gecikmiş ödeme tarihi güncellendi.`,
        position: 'top',
        timeout: 3000
      });

      // Eğer bir update yapıldıysa sayfayı yenile
      await refreshPage();
      return; // refreshPage zaten tüm verileri yükleyecek
    }
  } catch (error) {
    console.error('Eski OdmVade kayıtları güncellenirken hata:', error);
    // Hata olsa bile normal akışa devam et
  }
  
  // Devreden bakiyeyi güncelle
  await updateDevredenBakiye(selectedDate.value);
  
  // Veriyi yükle
  await loadData();
  
  // Kasa bakiyelerini yükle
  await loadKasaBakiyeleri(selectedDate.value);
  
  // Tablo başlık satırını stillendir
  await nextTick();
  applyHeaderStyling();
  
  // MutationObserver ile DOM değişikliklerini dinle
  setupMutationObserver();
  
  // Modal draggable özelliğini ayarla
  setupModalDraggable();
});

// Bileşen unmount olduğunda nakit-tablo özel stillerini temizle
onUnmounted(() => {
  const borderRemovalStyle = document.getElementById('nakit-tablo-border-removal');
  if (borderRemovalStyle) {
    borderRemovalStyle.remove();
  }
  
  const headerBorderRemovalStyle = document.getElementById('nakit-tablo-header-border-removal');
  if (headerBorderRemovalStyle) {
    headerBorderRemovalStyle.remove();
  }
});

// Sayfayı yenileme fonksiyonu
async function refreshPage() {
  try {
    loading.value = true;
    
    // Devreden bakiyeyi güncelle
    await updateDevredenBakiye(selectedDate.value);
    
    // Veriyi yeniden yükle
    await loadData();
    
    // Kasa bakiyelerini güncelle
    await loadKasaBakiyeleri(selectedDate.value);
    
    // Tablo başlık satırını stillendir
    await nextTick();
    applyHeaderStyling();
    
    $q.notify({
      type: 'positive',
      message: 'Sayfa başarıyla yenilendi!'
    });
    
  } catch (error) {
    console.error('Sayfa yenilenirken hata:', error);
    
    $q.notify({
      type: 'negative',
      message: `Sayfa yenilenirken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
    });
  } finally {
    loading.value = false;
  }
}

// Tablo başlık satırını stillendiren fonksiyon
function applyHeaderStyling() {
  // Quasar'ın CSS'ini override etmek için gecikme ekle
  setTimeout(() => {
    const headerRows = document.querySelectorAll('.nakit-tablo-grid .q-table__thead th, .q-table__thead th, .q-table th');
    headerRows.forEach((headerCell) => {
      const headerElement = headerCell as HTMLElement;
      const isDarkMode = document.body.classList.contains('body--dark');
      
      if (isDarkMode) {
        headerElement.style.setProperty('background-color', '#0a0a0a', 'important');
        headerElement.style.setProperty('color', '#ffffff', 'important');
        headerElement.style.setProperty('border-bottom', '1px solid #34495e', 'important');
      } else {
        headerElement.style.setProperty('background-color', '#000000', 'important');
        headerElement.style.setProperty('color', '#ffffff', 'important');
        headerElement.style.setProperty('border-bottom', '1px solid #34495e', 'important');
      }
      headerElement.style.setProperty('font-weight', '600', 'important');
    });
    
    // Tarih seçimi altındaki çizgiyi JavaScript ile de kaldır - SADECE NAKIT-TABLO SAYFASINDA
    const nakitTabloPage = document.querySelector('.nakit-tablo-page');
    if (nakitTabloPage) {
      const tableActions = nakitTabloPage.querySelectorAll('.table-actions');
      tableActions.forEach((actionElement) => {
        const element = actionElement as HTMLElement;
        element.style.setProperty('border-bottom', 'none', 'important');
        element.style.setProperty('border', 'none', 'important');
        element.style.setProperty('outline', 'none', 'important');
        element.style.setProperty('box-shadow', 'none', 'important');
      });
      
      // Sadece nakit-tablo sayfasındaki tarih input'undaki çizgiyi kaldır
      const dateInputs = nakitTabloPage.querySelectorAll('.table-actions .q-input, .table-actions .q-input .q-field__control, .table-actions .q-input .q-field__native, .table-actions .q-input .q-field__control-container');
      dateInputs.forEach((inputElement) => {
        const element = inputElement as HTMLElement;
        element.style.setProperty('border-bottom', 'none', 'important');
        element.style.setProperty('border', 'none', 'important');
        element.style.setProperty('outline', 'none', 'important');
        element.style.setProperty('box-shadow', 'none', 'important');
        element.style.setProperty('border-radius', '0', 'important');
      });
    }
    
    // Pseudo element'leri sadece nakit-tablo sayfası için kaldır
    const existingStyle = document.getElementById('nakit-tablo-header-border-removal');
    if (!existingStyle) {
      const styleElement = document.createElement('style');
      styleElement.id = 'nakit-tablo-header-border-removal';
      styleElement.textContent = `
        .nakit-tablo-page .table-actions .q-input .q-field__control::before,
        .nakit-tablo-page .table-actions .q-input .q-field__control::after,
        .nakit-tablo-page .table-actions .q-input .q-field__control:before,
        .nakit-tablo-page .table-actions .q-input .q-field__control:after {
          border-bottom: none !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          border-radius: 0 !important;
        }
      `;
      document.head.appendChild(styleElement);
    }
  }, 100); // 100ms gecikme
}

// MutationObserver ile DOM değişikliklerini dinle
function setupMutationObserver() {
  const tableContainer = document.querySelector('.nakit-tablo-grid');
  if (!tableContainer) return;
  
  const observer = new MutationObserver((mutations) => {
    let shouldReapply = false;
    
    mutations.forEach((mutation) => {
      // Tablo satırları eklendi/çıkarıldı mı kontrol et
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'TR' || element.querySelector('tr')) {
              shouldReapply = true;
            }
          }
        });
        
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'TR' || element.querySelector('tr')) {
              shouldReapply = true;
            }
          }
        });
      }
    });
    
    // Eğer tablo satırları değiştiyse CSS sınıflarını yeniden uygula
    if (shouldReapply) {
      void nextTick().then(() => {
        void applyRowStyling(filteredData.value);
        applyHeaderStyling(); // Tablo başlık satırını da stillendir
      });
    }
  });
  
  // Tablo container'ını gözlemle
  observer.observe(tableContainer, {
    childList: true,
    subtree: true
  });
}

// Satır sınıf adını belirleyen fonksiyon
function getRowClass(row: NakitAkisRecord) {
  // Boolean true kontrolü
  if (row.OdmDrm === true) {
    return 'odenen-satir';
  }
  
  return '';
}

// Ekran boyutu değişikliklerini dinle
watch(() => $q.screen.gt.sm, async () => {
  await applyRowStyling(filteredData.value);
  applyHeaderStyling(); // Tablo başlık satırını da stillendir
});

// Tablo verisi değiştiğinde CSS sınıflarını uygula
watch(tableData, async () => {
  await applyRowStyling(filteredData.value);
  applyHeaderStyling(); // Tablo başlık satırını da stillendir
}, { deep: true });

// İslm kategorisi değiştiğinde işlem tanımı seçeneklerini güncelle ve işlem tanımı alanını temizle
watch(() => newRecord.value.islmGrup, async (newKategori, oldKategori) => {
  // Form initialize edilirken temizleme işlemini bypass et
  if (isFormInitializing.value) {
    return;
  }
  
  // İşlem kategorisi değiştiğinde işlem tanımı alanını temizle
  if (newKategori !== oldKategori) {
    // İşlem tanımı modelini temizle
    islemTanimiModel.value = '';
    // İşlem tanımı text input'unu temizle
    islemTanimiText.value = '';
    // newRecord.islmAltG alanını da temizle
    newRecord.value.islmAltG = '';
  }
  
  if (newKategori) {
    try {
      const altGruplar = await getIslmAltGruplar(newKategori);
      islemTanimiOptions.value = altGruplar;
      // 🔥 Orijinal listeyi de güncelle (arama için)
      originalIslemTanimiOptions.value = [...altGruplar];
    } catch (error) {
      console.error('İslm alt grupları alınırken hata:', error);
      islemTanimiOptions.value = [];
      originalIslemTanimiOptions.value = [];
    }
  } else {
    islemTanimiOptions.value = [];
    originalIslemTanimiOptions.value = [];
  }
}, { immediate: false });

// CSS sınıflarını uygulayan fonksiyon - daha güçlü
async function applyRowStyling(data: NakitAkisRecord[]) {
  if (!data || data.length === 0) return;
  
  // Next tick'te DOM güncellemesini bekle
  await nextTick();
  
  // Tablo başlık satırını manuel olarak stillendir
  const headerRows = document.querySelectorAll('.nakit-tablo-grid .q-table__thead th, .q-table__thead th, .q-table th');
  headerRows.forEach((headerCell) => {
    const headerElement = headerCell as HTMLElement;
    const isDarkMode = document.body.classList.contains('body--dark');
    
    if (isDarkMode) {
      headerElement.style.setProperty('background-color', '#0a0a0a', 'important');
      headerElement.style.setProperty('color', '#ffffff', 'important');
      headerElement.style.setProperty('border-bottom', '1px solid #34495e', 'important');
    } else {
      headerElement.style.setProperty('background-color', '#000000', 'important');
      headerElement.style.setProperty('color', '#ffffff', 'important');
      headerElement.style.setProperty('border-bottom', '1px solid #34495e', 'important');
    }
    headerElement.style.setProperty('font-weight', '600', 'important');
  });
  
  // Tarih seçimi altındaki çizgiyi JavaScript ile de kaldır - SADECE NAKIT-TABLO SAYFASINDA
  const nakitTabloPage = document.querySelector('.nakit-tablo-page');
  if (nakitTabloPage) {
    const tableActions = nakitTabloPage.querySelectorAll('.table-actions');
    tableActions.forEach((actionElement) => {
      const element = actionElement as HTMLElement;
      element.style.setProperty('border-bottom', 'none', 'important');
      element.style.setProperty('border', 'none', 'important');
      element.style.setProperty('outline', 'none', 'important');
      element.style.setProperty('box-shadow', 'none', 'important');
    });
    
    // Sadece nakit-tablo sayfasındaki tarih input'undaki çizgiyi kaldır
    const dateInputs = nakitTabloPage.querySelectorAll('.table-actions .q-input, .table-actions .q-input .q-field__control, .table-actions .q-input .q-field__native, .table-actions .q-input .q-field__control-container');
    dateInputs.forEach((inputElement) => {
      const element = inputElement as HTMLElement;
      element.style.setProperty('border-bottom', 'none', 'important');
      element.style.setProperty('border', 'none', 'important');
      element.style.setProperty('outline', 'none', 'important');
      element.style.setProperty('box-shadow', 'none', 'important');
      element.style.setProperty('border-radius', '0', 'important');
    });
  }
  
  // Pseudo element'leri sadece nakit-tablo sayfası için kaldır
  const existingStyle = document.getElementById('nakit-tablo-border-removal');
  if (!existingStyle) {
    const styleElement = document.createElement('style');
    styleElement.id = 'nakit-tablo-border-removal';
    styleElement.textContent = `
      .nakit-tablo-page .table-actions .q-input .q-field__control::before,
      .nakit-tablo-page .table-actions .q-input .q-field__control::after,
      .nakit-tablo-page .table-actions .q-input .q-field__control:before,
      .nakit-tablo-page .table-actions .q-input .q-field__control:after {
        border-bottom: none !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
    `;
    document.head.appendChild(styleElement);
  }
  
  // Önce tüm satırlardan eski CSS sınıflarını temizle
  const allTableRows = document.querySelectorAll('.nakit-tablo-grid tbody tr');
  allTableRows.forEach(row => {
    row.classList.remove('odenen-satir');
    const rowElement = row as HTMLElement;
    rowElement.style.backgroundColor = '';
    rowElement.style.borderLeft = '';
  });
  
  // Her satır için CSS sınıfını manuel olarak uygula
  data.forEach((row, dataIndex) => {
    if (row.OdmDrm === true) {
      // Tablo satırını bul - data-index attribute'u ile eşleştir
      const tableRows = document.querySelectorAll('.nakit-tablo-grid tbody tr');
      
      // Satırı bul - data-index veya sıra ile eşleştir
      let targetRow: Element | null = null;
      
      // Method 1: data-index attribute ile eşleştir
      targetRow = document.querySelector(`.nakit-tablo-grid tbody tr[data-index="${dataIndex}"]`);
      
      // Method 2: Eğer data-index yoksa, sıra ile eşleştir
      if (!targetRow && tableRows[dataIndex]) {
        targetRow = tableRows[dataIndex];
      }
      
      // Method 3: Satır içeriğini kontrol ederek eşleştir
      if (!targetRow) {
        for (let i = 0; i < tableRows.length; i++) {
          const rowContent = tableRows[i].textContent;
          if (rowContent && rowContent.includes(row.OdmVade)) {
            targetRow = tableRows[i];
            break;
          }
        }
      }
      
      if (targetRow) {
        // CSS sınıfını ekle
        targetRow.classList.add('odenen-satir');
        
        // Inline style olarak da ekle (CSS override'ı için)
        const rowElement = targetRow as HTMLElement;
        
        // Dark mode kontrolü
        const isDarkMode = document.body.classList.contains('body--dark');
        
        if (isDarkMode) {
          // Dark mode için renkler
          rowElement.style.backgroundColor = '#3a3a3a'; // Dark mode tablo zemininden bir ton açık
          rowElement.style.borderLeft = '4px solid #6c757d'; // Sol kenar gri çizgi
        } else {
          // Light mode için renkler
          rowElement.style.backgroundColor = '#f8f9fa'; // Light mode tablo zemininden bir ton açık
          rowElement.style.borderLeft = '4px solid #6c757d'; // Sol kenar gri çizgi
        }
      }
    }
  });
}

// Veri yükleme fonksiyonu
async function loadData() {
  try {
    loading.value = true;
    console.log('Veri yükleniyor, tarih:', selectedDate.value);
    
    // Nakit akış verilerini getir
    const veriler = await getNakitAkisVerileri(selectedDate.value);
    console.log('API\'den gelen veriler:', veriler);
    
    tableData.value = veriler;
    
    if (veriler.length === 0) {
      $q.notify({
        type: 'info',
        message: `${selectedDate.value} tarihi için veri bulunamadı.`,
        position: 'top'
      });
      // Boş array göster
      tableData.value = [];
    } else {
      console.log(`${veriler.length} kayıt başarıyla yüklendi`);
    }
    
  } catch (error) {
    console.error('Veri yüklenirken hata:', error);
    $q.notify({
      type: 'negative',
      message: `Veri yüklenemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
      position: 'top'
    });
    
    // Hata durumunda boş array göster
    tableData.value = [];
  } finally {
    loading.value = false;
  }
}

// Taksit tarihi hesaplama fonksiyonu
const hesaplaTaksitTarihi = (baslangicTarihi: string, ayFarki: number): string => {
  const [gun, ay, yil] = baslangicTarihi.split('.');
  const tarih = new Date(Number(yil), Number(ay) - 1 + ayFarki, Number(gun));
  
  const yeniGun = String(tarih.getDate()).padStart(2, '0');
  const yeniAy = String(tarih.getMonth() + 1).padStart(2, '0');
  const yeniYil = tarih.getFullYear();
  
  return `${yeniGun}.${yeniAy}.${yeniYil}`;
};

// Yeni kayıt ekleme fonksiyonu
const addNewRecord = () => {
  showNewRecordModal.value = true;
  newRecord.value = {
    OdmVade: getBugunTarih(),
    islmArac: 'Banka EFT', // Default: Banka EFT
    islmTip: 'Çıkan', // Default: Çıkan
    islmGrup: 'Genel Fon Ödm.', // Default: Genel Fon Ödm.
    islmAltG: '', // Boş string olarak başlat
    islmTtr: 0,
    OdmDrm: false,
    islmTkst: 1,
    islmBilgi: '',
    ttrDrm: true,
  };
  
  // İşlem tanımı alanlarını temizle
  islemTanimiText.value = '';
  islemTanimiModel.value = null;
  
  // İşlem tanımı options'ları da temizle
  islemTanimiOptions.value = [...originalIslemTanimiOptions.value];
};

// Yeni kayıt kaydetme fonksiyonu
async function saveNewRecord() {
  if (!newRecord.value.islmArac || !newRecord.value.islmTip || !newRecord.value.islmAltG || 
      newRecord.value.islmTtr === 0 || !newRecord.value.islmTkst) {
    $q.notify({
      type: 'warning',
      message: 'Lütfen tüm alanları doldurun.',
      position: 'top'
    });
    return;
  }

  try {
    loading.value = true;
    
    // 🔥 DEBUG: Gönderilecek veriyi logla
    const requestData = {
      OdmVade: newRecord.value.OdmVade,
      islmArac: newRecord.value.islmArac,
      islmGrup: newRecord.value.islmGrup,
      islmAltG: newRecord.value.islmAltG,
      islmTip: newRecord.value.islmTip,
      islmTtr: newRecord.value.islmTtr,
      islmTkst: newRecord.value.islmTkst, // 🔥 Modal'daki değeri direkt gönder
      islmBilgi: newRecord.value.islmBilgi,
      OdmDrm: newRecord.value.OdmDrm,
      ttrDrm: newRecord.value.ttrDrm,
    };
    
    // 🔥 DEBUG: Sadece gerekli alanları gönder
    console.log('🔥 Gönderilecek alanlar:', Object.keys(requestData));
    console.log('🔥 Tüm alanlar:', requestData);
    
    console.log('🔥 Frontend\'den gönderilen veri:', requestData);
    
    // Taksit sistemi için kayıt ekleme
    const taksitSayisi = Number(newRecord.value.islmTkst);
    const taksitTutari = newRecord.value.islmTtr / taksitSayisi;
    
    console.log('🔥 Taksit sistemi:', {
      taksitSayisi,
      taksitTutari,
      toplamTutar: newRecord.value.islmTtr
    });
    
    let response: { data?: { fKasaNo?: number; success?: boolean; message?: string }; status: number } | null = null;
    
    // Tek taksit ise direkt kaydet
    if (taksitSayisi === 1) {
      // Manuel girilen bilgiyi direkt kullan (Kalan(TL): ekleme)
      let tekTaksitAciklama = '';
      
      // Eğer manuel bilgi varsa, onu direkt kullan
      if (newRecord.value.islmBilgi && newRecord.value.islmBilgi.trim()) {
        tekTaksitAciklama = newRecord.value.islmBilgi.trim();
      }
      
      const tekTaksitData = {
        ...requestData,
        islmTkst: '1 / 1',
        islmBilgi: tekTaksitAciklama
      };
      
      console.log('🔥 Tek taksit kaydı ekleniyor:', tekTaksitData);
      
      // Backend'e tek taksit kaydı ekle
      const tekTaksitResponse = await api.post('/islem/nakit-akis-ekle', tekTaksitData);
      
      if (tekTaksitResponse.status !== 201 && tekTaksitResponse.status !== 200) {
        throw new Error('Tek taksit kaydı eklenemedi');
      }
      
      // Backend'den gelen fKasaNo bilgisini logla
      if (tekTaksitResponse.data && tekTaksitResponse.data.fKasaNo) {
        console.log('🔥 Backend\'den gelen fKasaNo:', tekTaksitResponse.data.fKasaNo);
      }
      
      // Response'u kullan
      response = tekTaksitResponse;
      
    } else {
      // Çoklu taksit için her taksit için ayrı kayıt ekle
      let lastResponse = null;
      
      for (let i = 1; i <= taksitSayisi; i++) {
        const taksitTarihi = hesaplaTaksitTarihi(newRecord.value.OdmVade, i - 1);
        
        // Kalan tutarı hesapla (bu taksit ödendikten sonra kalan)
        const kalanTutar = newRecord.value.islmTtr - (taksitTutari * i);
        
        // Manuel girilen bilgiyi en başa ekle
        let taksitAciklama = '';
        
        // Eğer manuel bilgi varsa, onu en başa ekle
        if (newRecord.value.islmBilgi && newRecord.value.islmBilgi.trim()) {
          taksitAciklama = newRecord.value.islmBilgi.trim();
        }
        
        // Otomatik taksit bilgilerini ekle
        if (taksitAciklama) {
          taksitAciklama += ' -/- ';
        }
        taksitAciklama += `- Kalan(TL): ${kalanTutar}`;
        
        // Son taksit değilse Son Vade bilgisini ekle
        if (i < taksitSayisi) {
          const sonVadeTarihi = hesaplaTaksitTarihi(newRecord.value.OdmVade, taksitSayisi - 1);
          taksitAciklama += ` - Son Vade: ${sonVadeTarihi}`;
        }
        
        const taksitData = {
          ...requestData,
          islmTtr: taksitTutari,
          islmTkst: `${i} / ${taksitSayisi}`,
          OdmVade: taksitTarihi,
          islmBilgi: taksitAciklama
        };
        
        console.log(`🔥 ${i}. taksit kaydı ekleniyor:`, taksitData);
        
        // Backend'e taksit kaydı ekle
        const taksitResponse = await api.post('/islem/nakit-akis-ekle', taksitData);
        
        if (taksitResponse.status !== 201 && taksitResponse.status !== 200) {
          throw new Error(`${i}. taksit kaydı eklenemedi`);
        }
        
        // Son response'u sakla
        lastResponse = taksitResponse;
        
        // İlk taksit için fKasaNo bilgisini logla
        if (i === 1 && taksitResponse.data && taksitResponse.data.fKasaNo) {
          console.log('🔥 İlk taksit için Backend\'den gelen fKasaNo:', taksitResponse.data.fKasaNo);
        }
      }
      
      // Son taksit response'unu kullan
      response = lastResponse;
    }
    
    // 🔥 DEBUG: Backend response'unu logla
    console.log('🔥 Backend response:', response);
    
    if (!response) {
      throw new Error('Backend response alınamadı');
    }
    
    console.log('🔥 Response status:', response.status);
    console.log('🔥 Response data:', response.data);
    
    // 🔥 Backend success kontrolü - öncelikli kontrol
    if (response.data && 'success' in response.data && response.data.success === false) {
      // Backend'den hata geldi
      throw new Error(response.data.message || 'Backend\'den hata mesajı alınamadı');
    }
    
    // 🔥 HTTP status kontrolü - 201 Created veya 200 OK ise başarılı
    if (response.status === 201 || response.status === 200) {
      // Başarı mesajı
      $q.notify({
        type: 'positive',
        message: 'Yeni kayıt başarıyla eklendi!',
        position: 'top'
      });

      // Modal'ı kapat
      showNewRecordModal.value = false;
      
      // İşlem tanımı alanlarını temizle
      islemTanimiText.value = '';
      islemTanimiModel.value = null;
      islemTanimiOptions.value = [...originalIslemTanimiOptions.value];
      
      // Backend'den güncel veriyi çek
      await loadData();
      
      console.log('🔥 Yeni kayıt backend\'e eklendi ve tablo güncellendi');
    } else if (response.data && 'success' in response.data && response.data.success === true) {
      // Alternatif olarak response.data.success kontrolü
      $q.notify({
        type: 'positive',
        message: 'Yeni kayıt başarıyla eklendi!',
        position: 'top'
      });

      // Modal'ı kapat
      showNewRecordModal.value = false;
      
      // İşlem tanımı alanlarını temizle
      islemTanimiText.value = '';
      islemTanimiModel.value = null;
      islemTanimiOptions.value = [...originalIslemTanimiOptions.value];
      
      // Backend'den güncel veriyi çek
      await loadData();
      
      console.log('🔥 Yeni kayıt backend\'e eklendi ve tablo güncellendi');
    } else {
      // 🔥 DEBUG: Başarısız response detayını logla
      console.error('🔥 Backend başarısız response:', response.data);
      console.error('🔥 Response status:', response.status);
      throw new Error('Kayıt eklenemedi - Backend response format hatası');
    }
    
  } catch (error: unknown) {
    // 🔥 DEBUG: Hata detayını logla
    console.error('🔥 Kayıt ekleme hatası detayı:', error);
    
    let errorMessage = 'Bilinmeyen hata';
    
    // Type-safe error handling
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string }, status?: number, statusText?: string } };
      
      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      } else if (axiosError.response?.status) {
        errorMessage = `HTTP ${axiosError.response.status}: ${axiosError.response.statusText || ''}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    $q.notify({
      type: 'negative',
      message: `Kayıt eklenirken hata oluştu: ${errorMessage}`,
      position: 'top',
      timeout: 5000
    });
  } finally {
    loading.value = false;
  }
}

// Yeni kayıt modalını kapatma fonksiyonu
function closeNewRecordModal() {
  showNewRecordModal.value = false;
  
  // İşlem tanımı alanlarını temizle
  islemTanimiText.value = '';
  islemTanimiModel.value = null;
  islemTanimiOptions.value = [...originalIslemTanimiOptions.value];
}

// Satır double-click edildiğinde
function onRowDoubleClick(evt: Event, row: NakitAkisRecord) {
  // Edit modal'ı aç
  showEditModal.value = true;
  
  // Form initialize flag'ini aktif et
  isFormInitializing.value = true;
  
  // Seçilen kaydın bilgilerini form elementlerine yaz
  newRecord.value = {
    OdmVade: row.OdmVade || '',
    islmArac: row.islmArac || '',
    islmGrup: row.islmGrup || '',
    islmAltG: row.islmAltG || '',
    islmTip: row.islmTip || '',
    islmTtr: Number(row.islmTtr) || 0,
    islmTkst: row.islmTkst || 1, // Orijinal taksit bilgisini koru
    islmBilgi: row.islmBilgi || '',
    OdmDrm: Boolean(row.OdmDrm) || false,
    ttrDrm: Boolean(row.ttrDrm) || false
  };
  
  // İşlem tanımı model'ini güncelle
  islemTanimiModel.value = row.islmAltG || null;
  islemTanimiText.value = row.islmAltG || '';
  
  // fKasaNo'yu global ref'e sakla (güncelleme için)
  selectedFKasaNo.value = row.fKasaNo || 0;
  
  // Form initialize tamamlandı, flag'i kapat
  void nextTick(() => {
    isFormInitializing.value = false;
  });
  
  // Erteleme tarihi ve ödenen tutarı sıfırla
  ertelemeTarihi.value = '';
  odenenTutar.value = 0;
  
  // Eski tutarı sakla (güncelleme için)
  eskiTutar.value = Number(row.islmTtr) || 0;
}

// Edit modal için gerekli fonksiyonlar
// onEditIslemKategorisiChange fonksiyonu kaldırıldı

// onEditIslemTanimiInput fonksiyonu kaldırıldı

// onEditIslemTanimiChange fonksiyonu kaldırıldı

async function saveEditRecord() {
  try {
    console.log('🔥 Güncellenecek kayıt bilgileri:', newRecord.value);
    
    // Tutar değişikliği kontrolü
    const yeniTutar = Number(newRecord.value.islmTtr) || 0;
    const tutarDegisti = yeniTutar !== eskiTutar.value;
    
    // islmBilgi alanını güncelle
    let guncelIslmBilgi = newRecord.value.islmBilgi || '';
    
    if (tutarDegisti) {
      // Eski tutar bilgisini en başa ekle
      let eskiTutarNotu = `Eski Tutar: ${eskiTutar.value}`;
      
      // Manuel girilen bilgi varsa onu ekle
      if (guncelIslmBilgi && guncelIslmBilgi.trim()) {
        eskiTutarNotu += ' -/- ' + guncelIslmBilgi.trim();
      }
      
      // Mevcut otomatik bilgileri koru (Kalan(TL): ... gibi)
      const mevcutOtomatikBilgiler = guncelIslmBilgi.match(/- Kalan\(TL\):.*/);
      if (mevcutOtomatikBilgiler) {
        // Eğer manuel bilgi yoksa, eski tutar ile otomatik bilgiler arasına ayırıcı ekle
        if (!guncelIslmBilgi.trim() || guncelIslmBilgi.trim() === mevcutOtomatikBilgiler[0]) {
          eskiTutarNotu += ' -/- ' + mevcutOtomatikBilgiler[0];
        }
      }
      
      guncelIslmBilgi = eskiTutarNotu;
    }
    
    // Güncelleme için gerekli verileri hazırla (islmTkst hariç)
    const updateData = {
      fKasaNo: selectedFKasaNo.value, // Çift tıklama sırasında saklanan fKasaNo
      OdmVade: newRecord.value.OdmVade,
      islmArac: newRecord.value.islmArac,
      islmGrup: newRecord.value.islmGrup,
      islmAltG: newRecord.value.islmAltG,
      islmTip: newRecord.value.islmTip,
      islmTtr: newRecord.value.islmTtr,
      // islmTkst alanı güncellenmesin - veri tabanında korunsun
      islmBilgi: guncelIslmBilgi,
      OdmDrm: newRecord.value.OdmDrm,
      ttrDrm: newRecord.value.ttrDrm
    };
    
    console.log('🔥 Backend\'e gönderilecek güncelleme verisi:', updateData);
    
    // Backend'e güncelleme isteği gönder
    const response = await api.put('/islem/nakit-akis-guncelle', updateData);
    
    console.log('🔥 Güncelleme response:', response);
    
    if (response.status === 200 || response.status === 201) {
      // Başarılı güncelleme
      $q.notify({
        type: 'positive',
        message: 'Kayıt başarıyla güncellendi',
        position: 'top'
      });
      
      // Modal'ı kapat
      showEditModal.value = false;
      
      // Grid'i yenile
      const veriler = await getNakitAkisVerileri(selectedDate.value);
      tableData.value = veriler;
      
    } else {
      throw new Error('Güncelleme işlemi başarısız');
    }
    
  } catch (error: unknown) {
    console.error('🔥 Kayıt güncelleme hatası:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    
    $q.notify({
      type: 'negative',
      message: `Kayıt güncellenirken hata: ${errorMessage}`,
      position: 'top'
    });
  }
}

async function deleteRecord() {
  try {
    console.log('🔥 Silinecek kayıt bilgileri:', newRecord.value);
    
    // Silme için gerekli verileri hazırla
    const deleteData = {
      fKasaNo: selectedFKasaNo.value, // Çift tıklama sırasında saklanan fKasaNo
    };
    
    console.log('🔥 Backend\'e gönderilecek silme verisi:', deleteData);
    
    // Backend'e silme isteği gönder
    const response = await api.delete('/islem/nakit-akis-sil', {
      data: deleteData
    });
    
    console.log('🔥 Silme response:', response);
    
    if (response.status === 200 || response.status === 201) {
      // Başarılı silme
      $q.notify({
        type: 'positive',
        message: 'Kayıt başarıyla silindi',
        position: 'top'
      });
      
      // Modal'ı kapat
      showEditModal.value = false;
      
      // Grid'i yenile
      const veriler = await getNakitAkisVerileri(selectedDate.value);
      tableData.value = veriler;
      
    } else {
      throw new Error('Silme işlemi başarısız');
    }
    
  } catch (error: unknown) {
    console.error('🔥 Kayıt silme hatası:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    
    $q.notify({
      type: 'negative',
      message: `Kayıt silinirken hata: ${errorMessage}`,
      position: 'top'
    });
  }
}

async function kismiOdemeYap() {
  try {
    // Validasyon kontrolleri
    if (!ertelemeTarihi.value || !odenenTutar.value || odenenTutar.value <= 0) {
      $q.notify({
        type: 'warning',
        message: 'Lütfen erteleme tarihi ve ödenen tutarı giriniz.',
        position: 'top'
      });
      return;
    }

    const odenen = Number(odenenTutar.value);
    const mevcutTutar = Number(newRecord.value.islmTtr);
    
    if (odenen >= mevcutTutar) {
      $q.notify({
        type: 'warning',
        message: 'Ödenen tutar ödeme tutarına eşit veya büyük olamaz.',
        position: 'top'
      });
      return;
    }

    console.log('🔥 Kısmi ödeme yapılıyor:', {
      mevcutTutar,
      odenen,
      kalanTutar: mevcutTutar - odenen,
      ertelemeTarihi: ertelemeTarihi.value
    });

    // Kısmi ödeme verilerini hazırla
    const kismiOdemeData = {
      odenenTutar: odenen,
      ertelemeTarihi: ertelemeTarihi.value,
      mevcutKayit: {
        fKasaNo: selectedFKasaNo.value,
        OdmVade: newRecord.value.OdmVade,
        islmArac: newRecord.value.islmArac,
        islmGrup: newRecord.value.islmGrup,
        islmAltG: newRecord.value.islmAltG,
        islmTip: newRecord.value.islmTip,
        islmTtr: newRecord.value.islmTtr,
        islmTkst: newRecord.value.islmTkst,
        islmBilgi: newRecord.value.islmBilgi,
        OdmDrm: newRecord.value.OdmDrm,
        ttrDrm: newRecord.value.ttrDrm
      }
    };

    // Backend'e kısmi ödeme isteği gönder
    console.log('🔥 Backend\'e gönderilen kısmi ödeme verisi:', kismiOdemeData);
    
    let response;
    try {
      response = await api.post('/islem/kismi-odeme-yap', kismiOdemeData);
      console.log('🔥 Kısmi ödeme response:', response);
    } catch (apiError: unknown) {
      console.error('🔥 API hatası:', apiError);
      if (apiError && typeof apiError === 'object' && 'response' in apiError) {
        const errorResponse = apiError as { response?: { data?: unknown } };
        console.error('🔥 API hata detayı:', errorResponse.response?.data);
      }
      throw apiError;
    }
    
    if (response.status === 200 || response.status === 201) {
      // Başarılı kısmi ödeme
      $q.notify({
        type: 'positive',
        message: 'Kısmi ödeme başarıyla yapıldı',
        position: 'top'
      });
      
      // Modal'ı kapat
      showEditModal.value = false;
      
      // Grid'i yenile
      const veriler = await getNakitAkisVerileri(selectedDate.value);
      tableData.value = veriler;
      
    } else {
      throw new Error('Kısmi ödeme işlemi başarısız');
    }
    
  } catch (error: unknown) {
    console.error('🔥 Kısmi ödeme hatası:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    
    $q.notify({
      type: 'negative',
      message: `Kısmi ödeme yapılırken hata: ${errorMessage}`,
      position: 'top'
    });
  }
}

// Erteleme tarihi değiştiğinde validasyon yap
function onErtelemeTarihiChange(date: string) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate());
  
  const selectedDate = new Date(date.split('.').reverse().join('-'));
  
  if (selectedDate < tomorrow) {
    // Geçersiz tarih seçildi, bugün + 1 günü ata
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const yyyy = tomorrow.getFullYear();
    ertelemeTarihi.value = `${dd}.${mm}.${yyyy}`;
    
    // Uyarı ver
    $q.notify({
      type: 'warning',
      message: 'Erteleme tarihi bugünden en az 1 gün ileri olmalıdır. Bugün + 1 gün atandı.',
      position: 'top'
    });
  }
  
  // Date picker'ı kapat
  if (ertelemeTarihiPopup.value && typeof ertelemeTarihiPopup.value.hide === 'function') {
    ertelemeTarihiPopup.value.hide();
  }
}

// Ödenen tutar blur olduğunda validasyon yap
function onOdenenTutarBlur() {
  const odenen = Number(odenenTutar.value) || 0;
  const odemeTutari = Number(newRecord.value.islmTtr) || 0;
  
  if (odenen >= odemeTutari) {
    // Ödenen tutar ödeme tutarına eşit veya büyük olamaz
    odenenTutar.value = 0;
    
    $q.notify({
      type: 'warning',
      message: 'Ödenen tutar ödeme tutarına eşit veya büyük olamaz. Değer sıfırlandı.',
      position: 'top'
    });
  }
}

// Taksit input için keyboard event handler
function onTaksitKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLInputElement;
  const currentValue = Number(target.value) || 1;
  
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (currentValue < 120) {
      newRecord.value.islmTkst = currentValue + 1;
    }
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (currentValue > 1) {
      newRecord.value.islmTkst = currentValue - 1;
    }
  }
}

// Taksit artırma fonksiyonu
function incrementTaksit() {
  const currentTaksit = Number(newRecord.value.islmTkst) || 1;
  if (currentTaksit < 120) {
    newRecord.value.islmTkst = currentTaksit + 1;
  }
}

// Taksit azaltma fonksiyonu
function decrementTaksit() {
  const currentTaksit = Number(newRecord.value.islmTkst) || 1;
  if (currentTaksit > 1) {
    newRecord.value.islmTkst = currentTaksit - 1;
  }
}

function closeEditModal() {
  // Edit modal'ı kapat
  showEditModal.value = false;
  
  // Form initialize flag'ini sıfırla
  isFormInitializing.value = false;
  
  // Form verilerini temizle
  editRecord.value = {
    OdmVade: '',
    islmArac: '',
    islmGrup: '',
    islmAltG: '',
    islmTip: '',
    islmTtr: 0,
    islmTkst: 1,
    islmBilgi: '',
    OdmDrm: false,
    ttrDrm: false
  };
  
  editIslemTanimiModel.value = null;
  editIslemTanimiText.value = '';
  ertelemeTarihi.value = '';
  odenenTutar.value = 0;
  eskiTutar.value = 0; // Eski tutarı sıfırla
}


// 🔥 Gelişmiş arama fonksiyonu - Listede olmayanı da kabul eder
function onFilterIslemTanimi(val: string, update: (callback: () => void) => void) {
  console.log('Filter fonksiyonu çağrıldı:', val);
  
  update(() => {
    if (val === '') {
      // Boş değer için tüm seçenekleri göster
      islemTanimiOptions.value = [...originalIslemTanimiOptions.value];
      return;
    }

    // Büyük/küçük harf duyarsız arama
    const searchTerm = val.toLowerCase().trim();
    
    // Orijinal listeden filtreleme yap
    const filtered = originalIslemTanimiOptions.value.filter((option) => 
      option.toLowerCase().includes(searchTerm)
    );
    
    // 🔥 Yazılan değer listede yoksa, onu da geçici olarak göster
    if (val.trim() && !originalIslemTanimiOptions.value.some(opt => opt.toLowerCase() === val.trim().toLowerCase())) {
      filtered.unshift(`${val.trim()} (Yeni)`); // En üste ekle
    }
    
    islemTanimiOptions.value = filtered;
    console.log('Filtrelenmiş seçenekler:', filtered);
  });
}

// İşlem tanımı değişikliği fonksiyonu - artık kullanılmıyor, onIslemTanimiSelect kullanılıyor
// function onIslemTanimiChange(value: string) {
//   // İşlem tanımı değiştiğinde yapılacak işlemler
//   console.log('İşlem tanımı değişti:', value);
// }

// İşlem tanımı seçimi yapıldığında
function onIslemTanimiSelect(value: string | null) {
  console.log('İşlem tanımı seçimi yapıldı:', value);
  
  if (value) {
    // Eğer "(Yeni)" etiketi varsa, onu kaldır
    const cleanValue = value.replace(' (Yeni)', '');
    
    // Hem model'i hem de newRecord'u güncelle
    islemTanimiModel.value = cleanValue;
    newRecord.value.islmAltG = cleanValue;
    
    console.log('İşlem tanımı seçildi:', cleanValue);
    
    // Eğer bu yeni bir değer ise, orijinal listeye ekle
    if (!originalIslemTanimiOptions.value.some(opt => opt === cleanValue)) {
      originalIslemTanimiOptions.value.push(cleanValue);
      console.log('Yeni işlem tanımı orijinal listeye eklenip kaydedildi:', cleanValue);
    }
    
    // 🔥 Seçim yapıldıktan sonra input'u blur yap ve listeyi kapat
    const inputElement = document.querySelector('.islem-tanimi-select input') as HTMLInputElement;
    if (inputElement) {
      inputElement.blur();
      // Input text'i temizle
      islemTanimiText.value = '';
    }
    
    // Dropdown'ı kapat - Quasar otomatik olarak kapatır
    // Manuel kapatmaya gerek yok
  } else {
    // Seçim kaldırıldığında (clearable ile)
    islemTanimiModel.value = null;
    newRecord.value.islmAltG = '';
    islemTanimiText.value = '';
    console.log('İşlem tanımı seçimi kaldırıldı');
  }
}

// 🔥 Enter'a basınca input'u tamamen temizle ve değeri kabul et - artık kullanılmıyor
// function onIslemTanimiEnter() {
//   // Eğer input'ta yazılan değer varsa
//   if (islemTanimiText.value) {
//     // Değeri orijinal listeye ekle (eğer yoksa)
//     const newOption = { label: islemTanimiText.value, value: islemTanimiText.value };
//     if (!originalIslemTanimiOptions.value.some(opt => opt.value === islemTanimiText.value)) {
//       originalIslemTanimiOptions.value.push(newOption);
//     }
//     
//     // Seçenekleri güncelle
//     islemTanimiOptions.value = [...originalIslemTanimiOptions.value];
//     
//     // Input'u tamamen temizle
//     islemTanimiText.value = '';
//     
//     console.log('🔥 Enter ile değer kabul edildi ve input tamamen temizlendi');
//   }
// }

// 🔥 İşlem tanımı input'undan çıkıldığında (blur)
function onIslemTanimiBlur() {
  // Input text'i temizle
  islemTanimiText.value = '';
  
  // Seçenekleri orijinal listeye geri döndür
  islemTanimiOptions.value = [...originalIslemTanimiOptions.value];
  
  // Eğer seçim yapılmamışsa, placeholder'ı tekrar göster
  if (!islemTanimiModel.value) {
    // Placeholder zaten dinamik olarak kontrol ediliyor
    console.log('İşlem tanımı input\'undan çıkıldı, placeholder tekrar gösterildi');
  }
  
  console.log('İşlem tanımı input\'undan çıkıldı, temizlik yapıldı');
}

// 🔥 İşlem tanımı input değişikliği
function onIslemTanimiInput(value: string | number | null | undefined) {
  // Input değeri değiştiğinde yapılacak işlemler
  console.log('İşlem tanımı input değişti:', value);
  
  // value'nun string olduğundan emin ol
  const stringValue = typeof value === 'string' ? value : String(value || '');
  
  // Eğer input'ta yazılan değer varsa ve listede yoksa, geçici olarak göster
  if (stringValue && stringValue.trim()) {
    const searchTerm = stringValue.toLowerCase().trim();
    const filtered = originalIslemTanimiOptions.value.filter((option) => 
      option.toLowerCase().includes(searchTerm)
    );
    
    // Yazılan değer listede yoksa, onu da geçici olarak göster
    if (!originalIslemTanimiOptions.value.some(opt => opt.toLowerCase() === searchTerm)) {
      filtered.unshift(`${stringValue.trim()} (Yeni)`);
    }
    
    islemTanimiOptions.value = filtered;
  } else {
    // Boş değer için tüm seçenekleri göster
    islemTanimiOptions.value = [...originalIslemTanimiOptions.value];
  }
}

/**
 * Para formatı - Bakiye gösterimi için (ondalık yok)
 */
function formatCurrency(amount: number): string {
  if (!amount) return '₺0';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Kasa bakiyelerini yükler
 * Püf Nokta: Tüm kasa türleri için bakiyeler seçilen tarihe göre hesaplanır
 */
async function loadKasaBakiyeleri(tarih: string) {
  console.log('🔄 Kasa bakiyeleri yükleniyor, tarih:', tarih);
  
  try {
    // 5 kasa türü için paralel bakiye hesaplama
    // Püf Nokta: islemTip 'Giren' olarak gönderilmeli (büyük harfle başlamalı)
    const [nakitRes, bankaRes, kartRes, acentaRes, depozitoRes] = await Promise.all([
      apiInstance.get('/islem/secilen-gun-bakiyesi', {
        params: { islemArac: 'nakit', islemTip: 'Giren', secilenTarih: tarih }
      }),
      apiInstance.get('/islem/secilen-gun-bakiyesi', {
        params: { islemArac: 'eft', islemTip: 'Giren', secilenTarih: tarih }
      }),
      apiInstance.get('/islem/secilen-gun-bakiyesi', {
        params: { islemArac: 'kart', islemTip: 'Giren', secilenTarih: tarih }
      }),
      apiInstance.get('/islem/secilen-gun-bakiyesi', {
        params: { islemArac: 'acenta', islemTip: 'Giren', secilenTarih: tarih }
      }),
      apiInstance.get('/islem/secilen-gun-bakiyesi', {
        params: { islemArac: 'depozito', islemTip: 'Giren', secilenTarih: tarih }
      })
    ]);
    
    nakitBakiye.value = nakitRes.data?.success ? (nakitRes.data.bakiye || 0) : 0;
    bankaBakiye.value = bankaRes.data?.success ? (bankaRes.data.bakiye || 0) : 0;
    kartBakiye.value = kartRes.data?.success ? (kartRes.data.bakiye || 0) : 0;
    acentaBakiye.value = acentaRes.data?.success ? (acentaRes.data.bakiye || 0) : 0;
    depozitoBakiye.value = depozitoRes.data?.success ? (depozitoRes.data.bakiye || 0) : 0;
    
    console.log('💰 Kasa bakiyeleri güncellendi:', {
      nakit: nakitBakiye.value,
      banka: bankaBakiye.value,
      kart: kartBakiye.value,
      acenta: acentaBakiye.value,
      depozito: depozitoBakiye.value
    });
  } catch (error) {
    console.error('❌ Kasa bakiyeleri yükleme hatası:', error);
    // Hata durumunda sıfırla
    nakitBakiye.value = 0;
    bankaBakiye.value = 0;
    kartBakiye.value = 0;
    acentaBakiye.value = 0;
    depozitoBakiye.value = 0;
  }
}

// Tarih değişikliği fonksiyonu
async function onDateSelected() {
  if (selectedDate.value && selectedDate.value.length === 10) {
    // Date picker popup'ını kapat
    if (datePopup.value) {
      datePopup.value.hide();
    }
    
    // Devreden bakiyeyi güncelle
    await updateDevredenBakiye(selectedDate.value);
    
    // Veriyi yükle
    await loadData();
    
    // Kasa bakiyelerini güncelle
    await loadKasaBakiyeleri(selectedDate.value);
  }
}

// Tabloyu yenileme fonksiyonu kaldırıldı - artık gerekli değil

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
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
  document.addEventListener('touchstart', dragStart);
  document.addEventListener('touchmove', drag);
  document.addEventListener('touchend', dragEnd);
}

// Tutar formatı fonksiyonu
function formatTutar(val: number): string {
  return `₺ ${val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

</script>

<style>
/* GLOBAL CSS - Quasar'ı override etmek için scoped kaldırıldı */

/* EN GÜÇLÜ SELECTOR'LAR - Quasar'ı kesinlikle override edecek */
.nakit-tablo-grid .q-table__container .q-table__thead th,
.q-table__container .q-table__thead th,
.q-table__thead th,
th,
.q-table th,
.q-table__thead th,
.q-table__container .q-table__thead th,
.nakit-tablo-grid th {
  height: 29px !important;
  padding: 6px 12px !important;
  background-color: #000000 !important; /* Tam siyah zemin */
  color: #ffffff !important; /* Beyaz yazı rengi */
  font-weight: 600 !important; /* Kalın yazı */
  border-bottom: 1px solid #34495e !important; /* Kenar çizgisi */
}

/* Quasar'ın tüm CSS'ini override et - daha güçlü */
.q-table__container .q-table__thead th,
.q-table__thead th,
.q-table th {
  background-color: #000000 !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  border-bottom: 1px solid #34495e !important;
}

/* Global override - en güçlü */
body .q-table__thead th,
body .q-table th,
html body .q-table__thead th,
html body .q-table th {
  background-color: #000000 !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  border-bottom: 1px solid #34495e !important;
}

/* Sayfa tasarımı */
.nakit-tablo-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.nakit-tablo-wrapper {
  padding: 15px;
  max-width: 1800px;
  margin: 0 auto;
}

.table-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.dual-table-wrapper {
  display: flex;
  width: 100%;
}

.left-table {
  flex: 0 0 170px; /* Genişletildi - Devreden bakiye taşmasını önlemek için */
  border-right: 1px solid #dee2e6 !important;
}

.right-table {
  flex: 1;
  border-left: none !important;
}

/* Sol tablo için özel stiller */
.left-table .q-table__container {
  border-right: 1px solid #dee2e6;
}

.left-table .q-table__thead th {
  height: 29px !important;
  padding: 6px 4px !important;
  text-align: center;
  font-weight: 600;
  background-color: #000000 !important;
  color: #ffffff !important;
  border-bottom: 1px solid #34495e !important;
}

.left-table .q-table__tbody td {
  padding: 6px 4px !important;
  text-align: center;
  font-weight: 500;
  color: #6c757d;
}

/* Sol tablo son satırının altına çizgi ekle */
.left-table .q-table__tbody tr:last-child td {
  border-bottom: 1px solid #dee2e6 !important;
}

/* Sağ tablo için özel stiller */
.right-table .q-table__container {
  border-left: 1px solid #dee2e6;
}

.table-actions {
  padding: 2px 12px;
  background: #f8f9fa;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: nowrap;
  gap: 12px;
  border-bottom: none !important;
  min-height: 29px; /* Eşit yükseklik için artırıldı */
}

.left-table-actions {
  justify-content: center; /* Sol tablo için ortala */
  padding: 2px 8px; /* Sol tablo için daha az padding */
  min-height: 29px; /* Sağ tablo ile aynı yükseklik */
}

.devreden-bakiye-section {
  display: flex;
  flex-direction: column; /* Label ve input'u alt alta yerleştir */
  align-items: center; /* Yatay ortalama */
  justify-content: center; /* Dikey ortalama */
  gap: 8px; /* Label ve input arasındaki boşluğu azalt */
}

.devreden-bakiye-label {
  font-size: 0.8rem; /* 0.9rem'den 0.8rem'e azaltıldı */
  color: #555;
  font-weight: 500;
  text-align: center; /* Yatay ortalama */
  display: flex; /* Flexbox için */
  align-items: center; /* Dikey ortalama */
  justify-content: center; /* Yatay ortalama */
  width: 100%; /* Tam genişlik */
}

.devreden-bakiye-input {
  background-color: #f8f9fa; /* Table-actions ile aynı zemin rengi */
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 1px 2px; /* Padding azaltıldı */
  font-size: 0.8rem; /* Font küçültüldü */
  color: #333;
  height: 29px;
  min-height: 29px;
  max-height: 29px;
  display: flex; /* Flexbox için */
  align-items: center; /* Dikey ortalama */
  justify-content: center; /* Yatay ortalama - metni ortala */
  text-align: center; /* CSS text-align ile de ortalama */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.date-selector {
  display: flex;
  align-items: center;
  gap: 8px; /* Date picker ile refresh ikonu arasında boşluk */
}

/* Takvim ikonunu sola yaklaştır */
.date-input-compact .q-field__append {
  padding-left: 4px !important;
}

.calendar-icon-compact {
  margin-left: -8px;
}

/* Refresh butonu stili */
.refresh-btn {
  margin-left: 4px; /* Date picker'dan biraz uzak */
}

.refresh-btn:hover {
  background-color: rgba(0, 123, 255, 0.1); /* Hover efekti */
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Kasa bakiyeleri container */
.kasa-bakiyeleri-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.kasa-bakiyeleri-container .q-separator {
  height: 24px;
  align-self: center;
}

.bakiye-chip {
  font-size: 0.85rem;
  padding: 4px 10px;
}

.bakiye-chip strong {
  margin-right: 4px;
}

.toplam-chip {
  font-size: 0.9rem;
  font-weight: bold;
  padding: 5px 12px;
}

.nakit-tablo-grid {
  background: transparent;
}

/* Tablo satır stilleri */
.nakit-tablo-grid .q-table__container .q-table__tbody tr {
  height: 45px !important;
}

.nakit-tablo-grid .q-table__container .q-table__tbody td {
  padding: 6px 12px !important;
  vertical-align: middle;
}

/* Tablo hücre içeriğini daha kompakt yap */
.nakit-tablo-grid .q-table__container .q-table__tbody td .q-field__control {
  min-height: 29px;
}

.nakit-tablo-grid .q-table__container .q-table__tbody td .q-btn {
  height: 29px;
  padding: 0 8px;
}

/* Ödenmiş satırlar için CSS sınıfı - EN GÜÇLÜ */
.nakit-tablo-grid .q-table__container .q-table__tbody tr.odenen-satir {
  background-color: #f8f9fa !important; /* Tablo zemininden bir ton açık */
  border-left: 4px solid #6c757d !important; /* Sol kenar gri çizgi */
}

.nakit-tablo-grid .q-table__container .q-table__tbody tr.odenen-satir:hover {
  background-color: #e9ecef !important; /* Hover'da biraz daha koyu */
}

/* Quasar tablosunun CSS'ini override et */
.q-table__container .q-table__tbody tr.odenen-satir {
  background-color: #f8f9fa !important;
  border-left: 4px solid #6c757d !important;
}

.q-table__container .q-table__tbody tr.odenen-satir:hover {
  background-color: #e9ecef !important;
}

/* Alternatif seçiciler - daha güçlü */
tr.odenen-satir {
  background-color: #f8f9fa !important; /* Tablo zemininden bir ton açık */
  border-left: 4px solid #6c757d !important;
}

tr.odenen-satir:hover {
  background-color: #e9ecef !important;
}

/* En güçlü selector - global */
body tr.odenen-satir {
  background-color: #f8f9fa !important;
  border-left: 4px solid #6c757d !important;
}

body tr.odenen-satir:hover {
  background-color: #e9ecef !important;
}

/* Dark mode uyumu */
.body--dark .nakit-tablo-page {
  background: var(--q-dark);
}

.body--dark .table-container {
  background: rgba(30, 30, 30, 0.95);
}

.body--dark .dual-table-wrapper {
  background: rgba(30, 30, 30, 0.95);
}

.body--dark .left-table .q-table__container {
  border-right: 1px solid #495057;
}

.body--dark .left-table .q-table__thead th {
  background-color: #0a0a0a !important;
  color: #ffffff !important;
  border-bottom: 1px solid #34495e !important;
}

.body--dark .right-table .q-table__container {
  border-left: 1px solid #495057;
}

.body--dark .left-table .q-table__tbody td {
  color: #adb5bd;
}

.body--dark .table-actions {
  background: #2c3e50;
  padding: 2px 12px;
  min-height: 29px; /* Eşit yükseklik için artırıldı */
}

.body--dark .left-table-actions {
  background: #2c3e50; /* Sol tablo için dark mode arka plan */
  min-height: 29px; /* Sağ tablo ile aynı yükseklik */
}

.body--dark .devreden-bakiye-label {
  color: #e0e0e0;
}

.body--dark .devreden-bakiye-input {
  background-color: #2c3e50; /* Table-actions ile aynı zemin rengi */
  border-color: #495057;
  color: #e0e0e0;
  height: 29px;
  min-height: 29px;
  max-height: 29px;
  display: flex; /* Flexbox için */
  align-items: center; /* Dikey ortalama */
  justify-content: center; /* Yatay ortalama - metni ortala */
  text-align: center; /* CSS text-align ile de ortalama */
}

/* Dark mode için ödenmiş satırlar - tablo zemininden bir ton açık */
.body--dark .nakit-tablo-grid .q-table__container .q-table__tbody tr.odenen-satir {
  background-color: #3a3a3a !important; /* Dark mode tablo zemininden bir ton açık */
  border-left: 4px solid #6c757d !important; /* Sol kenar gri çizgi */
}

.body--dark .nakit-tablo-grid .q-table__container .q-table__tbody tr.odenen-satir:hover {
  background-color: #4a4a4a !important; /* Hover'da biraz daha açık */
}

/* Dark mode için tablo başlık satırı - EN GÜÇLÜ */
.body--dark .nakit-tablo-grid .q-table__container .q-table__thead th,
.body--dark .q-table__container .q-table__thead th,
.body--dark .q-table__thead th,
.body--dark th,
.body--dark .q-table th {
  background-color: #0a0a0a !important; /* Dark mode'da çok daha koyu */
  color: #ffffff !important; /* Beyaz yazı rengi */
  border-bottom: 1px solid #34495e !important; /* Koyu kenar çizgisi */
}

/* Dark mode global override */
body.body--dark .q-table__thead th,
body.body--dark .q-table th {
  background-color: #0a0a0a !important;
  color: #ffffff !important;
  border-bottom: 1px solid #34495e !important;
}

.body--dark tr.odenen-satir {
  background-color: #3a3a3a !important;
  border-left: 4px solid #6c757d !important;
}

.body--dark tr.odenen-satir:hover {
  background-color: #4a4a4a !important;
}

.body--dark body tr.odenen-satir {
  background-color: #3a3a3a !important;
  border-left: 4px solid #6c757d !important;
}

.body--dark body tr.odenen-satir:hover {
  background-color: #4a4a4a !important;
}

/* Tarih seçimi altındaki çizgiyi tamamen kaldır - SADECE NAKIT-TABLO SAYFASINDA */
.nakit-tablo-page .table-actions,
.nakit-tablo-page .table-actions .q-input,
.nakit-tablo-page .table-actions .q-input .q-field__control,
.nakit-tablo-page .table-actions .q-input .q-field__native,
.nakit-tablo-page .table-actions .q-input .q-field__control-container,
.nakit-tablo-page .table-actions .q-input .q-field__control::before,
.nakit-tablo-page .table-actions .q-input .q-field__control::after,
.nakit-tablo-page .table-actions .q-input .q-field__control:before,
.nakit-tablo-page .table-actions .q-input .q-field__control:after {
  border-bottom: none !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}

/* Dark mode için de aynı - SADECE NAKIT-TABLO SAYFASINDA */
.body--dark .nakit-tablo-page .table-actions,
.body--dark .nakit-tablo-page .table-actions .q-input,
.body--dark .nakit-tablo-page .table-actions .q-input .q-field__control {
  border-bottom: none !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}

/* Diğer stiller */
.no-data-message {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.no-data-message p {
  margin: 16px 0 0 0;
  font-size: 1.1rem;
}

/* Responsive tasarım */
@media (max-width: 768px) {
  .nakit-tablo-wrapper {
    padding: 8px;
  }
  
  .table-actions {
    flex-direction: column;
    gap: 16px;
  }
  
  .devreden-bakiye-section {
    width: 100%;
    justify-content: center;
  }

  .date-selector {
    width: 100%;
    justify-content: center;
  }
  
  .action-buttons {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }
  
  .action-buttons .q-btn {
    width: 100%;
  }
  
  .kasa-bakiyeleri-container {
    width: 100%;
    flex-wrap: wrap;
    margin-left: 0;
    margin-top: 8px;
  }
  
  .bakiye-chip {
    flex: 1 1 auto;
  }
}

/* Modal Form Stilleri */
.new-record-modal {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
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

.modal-title {
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
}

.modal-title-right {
  flex-shrink: 0;
  margin-left: auto;
}

.fKasaNo-label {
  background: transparent;
  border: 1px solid #ddd;
}

.fKasaNo-label .q-field__control {
  background: transparent;
  color: #666;
  font-weight: 600;
  justify-content: flex-end !important;
}

.other-transactions {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.modal-body {
  padding: 24px;
  background: #f8f9fa;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field.checkbox-field {
  grid-column: 1 / -1;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.form-field.payment-amount-field {
  grid-column: 1 / -1;
}

.payment-input-group {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.payment-input {
  flex: 0 0 150px; /* Biraz daha geniş */
  max-width: 150px;
}

.payment-checkbox {
  flex-shrink: 0;
  margin-right: 16px;
}

.taksit-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.taksit-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.taksit-input {
  flex: 0 0 60px; /* 2 karakter sayı için optimize edilmiş genişlik */
  max-width: 60px;
  min-width: 60px;
  height: 40px; /* Diğer textbox'larla aynı yükseklik */
  min-height: 40px;
  max-height: 40px;
  margin-right: 16px;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

.form-input {
  background: #ffffff;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.form-input:hover {
  border-color: #4CAF50;
}

.form-input:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.form-checkbox {
  color: #4CAF50;
}

.modal-actions {
  padding: 20px 24px;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

.action-buttons-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.button-row {
  display: flex;
  gap: 20px;
  justify-content: space-between;
}

.textbox-row {
  display: flex !important;
  gap: 20px !important;
  justify-content: flex-start !important;
  margin-left: 0 !important;
  padding-left: 0 !important;
  width: 100% !important;
  align-items: flex-start !important;
}

.textbox-row .form-field {
  flex: 1;
  max-width: 200px;
}

.erteleme-field {
  flex: 1 !important;
  max-width: 200px !important;
  width: 200px !important;
  text-align: left;
  margin-left: 0;
  padding-left: 0;
  justify-self: start;
}

.erteleme-field .form-label {
  text-align: left;
  justify-content: flex-start;
  max-width: 160px !important;
  width: 160px !important;  
}

.erteleme-field .form-input {
  justify-content: flex-start;
  max-width: 160px !important;
  width: 160px !important;
}

.odenen-field {
  flex: 1 !important;
  max-width: 130px !important;
  width: 130px !important;
  text-align: left;
  margin-left: 0;
  padding-left: 0;
  justify-self: end;
}

.odenen-field .form-label {
  text-align: left;
}

.odenen-field .form-input {
  max-width: 130px !important;
  width: 130px !important;
  justify-content: flex-start;
}

.kismi-btn-container {
  display: flex;
  align-items: flex-end;
  margin-left: auto;
}

.kismi-btn-container .wide-kismi-btn {
  height: 68px !important;
  min-height: 50px !important;
}

.action-btn {
  height: 40px;
  font-weight: 500;
  border-radius: 6px;
}

.primary-btn {
  background: #4CAF50;
  color: white;
}

.primary-btn:hover {
  background: #45a049;
}

.secondary-btn {
  background: #6c757d;
  color: white;
}

.close-btn {
  background: #dc3545;
  color: white;
}

.close-btn:hover {
  background: #c82333;
}

.wide-close-btn {
  min-width: 600px;
  width: 100%;
  max-width: 600px;
}

.wide-edit-btn {
  min-width: 300px;
  width: 100%;
  max-width: 300px;
  justify-self: start;
}

.wide-delete-btn {
  min-width: 300px;
  width: 100%;
  max-width: 300px;
  justify-self: end;
}

.wide-kismi-btn {
  min-width: 200px;
  width: 100%;
  max-width: 200px;
  justify-self: end;
  margin-left: auto;
}

/* Dark mode için modal stilleri */
.body--dark .new-record-modal {
  background: #2c3e50;
}

.body--dark .modal-header {
  background: linear-gradient(135deg, #2E7D32 0%, #388E3C 100%);
}

.body--dark .modal-body {
  background: #34495e;
}

.body--dark .form-label {
  color: #ecf0f1;
}

.body--dark .taksit-label {
  color: #ecf0f1;
}

.body--dark .form-input {
  background: #2c3e50;
  border-color: #495057;
  color: #ecf0f1;
}

.body--dark .form-input:hover {
  border-color: #4CAF50;
}

.body--dark .form-input:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
}

.body--dark .modal-actions {
  background: #34495e;
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
  background: linear-gradient(135deg, #2E7D32 0%, #388E3C 100%);
}

/* Responsive modal tasarımı */
@media (max-width: 768px) {
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
}

/* 🔥 İşlem Tanımı q-select için satır aralıklarını azalt - EN GÜÇLÜ SELECTOR'LAR */
/* Global override - tüm q-select dropdown'ları için */
body .q-select__dropdown .q-item,
html body .q-select__dropdown .q-item,
.q-select__dropdown .q-item,
.q-select .q-item,
.q-item {
  min-height: 20px !important; /* Çok daha az */
  padding: 0px 16px !important; /* Üst-alt padding'i sıfırla */
  margin: 0 !important; /* Margin'i sıfırla */
}

/* İşlem tanımı popup stilleri */
.islem-tanimi-popup {
  max-height: 300px !important;
}

.islem-tanimi-header {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.islem-tanimi-option {
  font-size: 0.9rem;
  color: #333;
}

/* Dark mode için */
.body--dark .islem-tanimi-header {
  background-color: #2c3e50;
  color: #ecf0f1;
}

.body--dark .islem-tanimi-option {
  color: #ecf0f1;
}

body .q-select__dropdown .q-item__label,
html body .q-select__dropdown .q-item__label,
.q-select__dropdown .q-item__label,
.q-select .q-item__label,
.q-item__label {
  line-height: 1 !important; /* Satır yüksekliğini minimize et */
  padding: 0 !important; /* Tüm padding'i sıfırla */
  margin: 0 !important; /* Tüm margin'i sıfırla */
}

/* Modal form içindeki q-select için özel stil - EN GÜÇLÜ */
.new-record-modal .q-select__dropdown .q-item,
.new-record-modal .q-select .q-item,
.new-record-modal .q-item {
  min-height: 16px !important; /* Çok daha az */
  padding: 0px 16px !important; /* Üst-alt padding'i sıfırla */
  margin: 0 !important; /* Margin'i sıfırla */
}

.new-record-modal .q-select__dropdown .q-item__label,
.new-record-modal .q-select .q-item__label,
.new-record-modal .q-item__label {
  line-height: 0.8 !important; /* Çok daha az */
  padding: 0 !important; /* Tüm padding'i sıfırla */
  margin: 0 !important; /* Tüm margin'i sıfırla */
}

/* 🔥 EN GÜÇLÜ OVERRIDE - Quasar'ın tüm CSS'ini kesinlikle override et */
html body .q-select__dropdown .q-item,
html body .q-select .q-item,
html body .q-item,
body .q-select__dropdown .q-item,
body .q-select .q-item,
body .q-item {
  min-height: 18px !important; /* Minimum yükseklik */
  padding: 0px 16px !important; /* Sadece yatay padding */
  margin: 0 !important; /* Margin sıfır */
  height: auto !important; /* Yüksekliği otomatik yap */
}

html body .q-select__dropdown .q-item__label,
html body .q-select .q-item__label,
html body .q-item__label,
body .q-select__dropdown .q-item__label,
body .q-select .q-item__label,
body .q-item__label {
  line-height: 0.9 !important; /* Minimum satır yüksekliği */
  padding: 0 !important; /* Padding sıfır */
  margin: 0 !important; /* Margin sıfır */
  height: auto !important; /* Yüksekliği otomatik yap */
}

/* 🔥 İşlem Tanımı q-select için özel CSS - EN GÜÇLÜ */
.islem-tanimi-select .q-select__dropdown .q-item,
.islem-tanimi-select .q-select .q-item,
.islem-tanimi-select .q-item,
.islem-tanimi-select .q-select__dropdown .q-item__label,
.islem-tanimi-select .q-select .q-item__label,
.islem-tanimi-select .q-item__label {
  min-height: 16px !important; /* Çok daha az */
  padding: 0px 16px !important; /* Sadece yatay padding */
  margin: 0 !important; /* Margin sıfır */
  height: auto !important; /* Yüksekliği otomatik yap */
  line-height: 0.8 !important; /* Minimum satır yüksekliği */
}

/* 🔥 İşlem Tanımı q-select dropdown için özel CSS */
.islem-tanimi-select .q-select__dropdown {
  max-height: 200px !important; /* Dropdown yüksekliğini sınırla */
  z-index: 9999 !important; /* Yüksek z-index */
  position: relative !important;
  min-width: 264px !important; /* Minimum genişlik */
  max-width: 26px !important;
  width: auto !important; /* Otomatik genişlik */
}

/* 🔥 İşlem Tanımı q-select field için sabit genişlik */
.islem-tanimi-select .q-field__control {
  min-width: 264px !important; /* Minimum genişlik */
  max-width: 264px !important;
  width: 100% !important; /* Tam genişlik */
}

.islem-tanimi-select .q-field__native {
  min-width: 264px !important; /* Minimum genişlik */
  max-width: 264px !important;
  width: 100% !important; /* Tam genişlik */
}

/* 🔥 İşlem Tanımı q-select container için sabit genişlik */
.islem-tanimi-select {
  min-width: 264px !important; /* Minimum genişlik */
  max-width: 264px !important;
  width: 100% !important; /* Tam genişlik */
}

/* 🔥 Dropdown menü z-index ve görünürlük sorunlarını çöz */
.q-select__dropdown,
.q-select .q-menu,
.q-menu {
  z-index: 9999 !important;
  position: fixed !important;
  background: white !important;
  border: 1px solid #ddd !important;
  border-radius: 4px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
}

/* Dark mode için dropdown */
.body--dark .q-select__dropdown,
.body--dark .q-select .q-menu,
.body--dark .q-menu {
  background: #2c3e50 !important;
  border-color: #495057 !important;
  color: #ecf0f1 !important;
}

/* 🔥 İşlem tanımı popup stilleri - z-index ile */
.islem-tanimi-popup {
  max-height: 300px !important;
  z-index: 9999 !important;
  position: fixed !important;
  background: white !important;
  border: 1px solid #ddd !important;
  border-radius: 4px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
}

.body--dark .islem-tanimi-popup {
  background: #2c3e50 !important;
  border-color: #495057 !important;
  color: #ecf0f1 !important;
}

/* 🔥 İşlem Tanımı q-select container için sabit genişlik */
.islem-tanimi-select {
  min-width: 264px !important; /* Minimum genişlik */
  max-width: 264px !important;
  width: 100% !important; /* Tam genişlik */
}

/* 🔥 İşlem Tanımı q-select dropdown item'ları için hover efektleri */
.islem-tanimi-select .q-select__dropdown .q-item {
  min-height: 16px !important; /* Minimum yükseklik */
  padding: 0px 16px !important; /* Sadece yatay padding */
  margin: 0 !important; /* Margin sıfır */
  height: auto !important; /* Yüksekliği otomatik yap */
  cursor: pointer !important; /* Tıklanabilir olduğunu göster */
}

.islem-tanimi-select .q-select__dropdown .q-item:hover {
  background-color: #e3f2fd !important; /* Hover efekti */
}

.islem-tanimi-select .q-select__dropdown .q-item__label {
  line-height: 0.8 !important; /* Minimum satır yüksekliği */
  padding: 0 !important; /* Padding sıfır */
  margin: 0 !important; /* Margin sıfır */
  height: auto !important; /* Yüksekliği otomatik yap */
  cursor: pointer !important; /* Tıklanabilir olduğunu göster */
}

/* 🔥 Taksit input container ve spin button'ları için CSS */
.taksit-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

/* Taksit input'un kendi spin button'larını gizle */
.taksit-input input[type="number"]::-webkit-outer-spin-button,
.taksit-input input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}

.taksit-input input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}

.taksit-spin-buttons {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.taksit-spin-btn {
  min-width: 20px !important;
  max-height: 16px !important;
  padding: 0 !important;
  margin: 0 !important;
  border-radius: 3px !important;
  background: rgba(0, 0, 0, 0.15) !important;
  color: #333 !important;
  border: 1px solid rgba(0, 0, 0, 0.2) !important;
}

.taksit-spin-btn .q-icon {
  font-size: 14px !important;
}

.taksit-spin-btn:hover {
  background: rgba(0, 0, 0, 0.25) !important;
  border-color: rgba(0, 0, 0, 0.4) !important;
  transform: scale(1.05) !important;
  transition: all 0.2s ease !important;
}

.taksit-spin-btn:disabled {
  opacity: 0.3 !important;
  cursor: not-allowed !important;
}

.taksit-spin-btn.up {
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

.taksit-spin-btn.down {
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
}

/* Dark mode için taksit spin button'ları */
.body--dark .taksit-spin-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  color: #ecf0f1 !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}

.body--dark .taksit-spin-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  transform: scale(1.05) !important;
  transition: all 0.2s ease !important;
}

.body--dark .taksit-spin-btn:disabled {
  opacity: 0.2 !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

/* ttrDrm: true olan satırların tutar sütunu için sarı zemin + siyah yazı */
.tutar-ttr-drm {
  background-color: #ffff00 !important; /* Sarı zemin */
  color: #000000 !important; /* Siyah yazı */
  font-weight: bold !important; /* Kalın yazı */
}

/* Dark mode için de aynı stil (sarı zemin + siyah yazı korunacak) */
.body--dark .tutar-ttr-drm {
  background-color: #ffff00 !important; /* Sarı zemin */
  color: #000000 !important; /* Siyah yazı */
  font-weight: bold !important; /* Kalın yazı */
}

</style>