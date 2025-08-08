<template>
  <q-page class="q-pa-md light-page-background">
    <div class="text-h6 q-mb-md text-center">Müşteri İşlemleri Formu</div>
    
    <div class="row">
      <div class="col-12">
        <!-- Form Container -->
      <div class="containers-wrapper">
        <!-- Temel Form -->
        <div class="ana-form-wrapper">
            <q-form @submit.prevent class="q-gutter-xs" ref="formRef">
            
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
              label="TC Kimlik No / Pasaport No" 
              required 
                    dense
                    outlined
                    color="primary"
                    label-color="primary"
                    class="kurumsal-responsive"
                    :readonly="guncellemeModuAktif"
                    :disable="guncellemeModuAktif"
                    @focus="onTCNFocus"
                    @input="onTCNInput"
                    @blur="onTCNBlur"
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
                    required
                    class="kurumsal-responsive"
                    @update:model-value="updateEkNotlar"
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
                    @update:model-value="updateEkNotlar"
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
                      @update:model-value="onOdaTipiChanged"
                      required
                      :readonly="guncellemeModuAktif"
                      :disable="guncellemeModuAktif"
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
                      :disable="!form.OdaTipi || guncellemeModuAktif"
                      :readonly="guncellemeModuAktif"
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
                
                <!-- Alt Satır: Konaklama Süresi, Konaklama Tipi, Planlanan Çıkış ve Ö.T.G. -->
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
                      :readonly="guncellemeModuAktif || !form.OdaTipi"
                      :disable="guncellemeModuAktif || !form.OdaTipi"
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
                  <div class="col oda-konaklama-col">
                    <q-input
                      v-model="planlananCikisTarihi"
                      label="Planlanan Çıkış"
                      outlined
                      color="green-6"
                      label-color="green-6"
                      dense
                      readonly
                      class="kurumsal-responsive konaklama-field konaklama-readonly"
                      :class="{ 'text-weight-medium': planlananCikisTarihi }"
                    />
                  </div>
                  <!-- Ö.T.G. (Ödeme Takvim Günü) - Sadece konaklama süresi 30 iken görünür -->
                  <div v-if="form.KonaklamaSuresi === 30" class="col oda-konaklama-col">
                    <q-input
                      v-model.number="form.OdemeTakvimGunu"
                      label="Ö.T.G."
                      outlined
                      color="green-6"
                      label-color="green-6"
                      dense
                      type="number"
                      :min="1"
                      :max="31"
                      readonly
                      disable
                      class="kurumsal-responsive konaklama-field"
                      @update:model-value="onOdemeTakvimGunuChanged"
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
                      :readonly="guncellemeModuAktif"
                      :disable="guncellemeModuAktif"
                      class="kurumsal-responsive bedel-field"
                    />
                  </div>
                  <!-- 🔥 Ö.T.G. Checkbox - Toplam Bedel ile Ödeme Vadesi arasında -->
                  <div class="col-auto bedel-islemler-col">
                    <q-checkbox
                      v-model="form.OtgCheckbox"
                      label="Ö.T.G."
                      color="green-6"
                      dense
                      :disable="!isOtgCheckboxEnabled || guncellemeModuAktif"
                      class="otg-checkbox"
                      @update:model-value="onOtgCheckboxChanged"
                    />
                  </div>
                  <div class="col bedel-islemler-col">
                    <q-input
                      v-model="form.OdemeVadesi"
                      label="Ödeme Vadesi *"
                      outlined
                      color="green-6"
                      label-color="green-6"
                      dense
                      readonly
                      required
                      :disable="guncellemeModuAktif"
                      class="kurumsal-responsive odeme-vadesi-field"
                    >
                      <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale" ref="odemeVadesiPopup">
                            <q-date 
                              v-model="form.OdemeVadesi" 
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
                <div class="row no-wrap bedel-islemler-row">
                  <div class="col-auto bedel-islemler-col">
              <q-btn 
                @click="showEkBilgilerDialog = true" 
                label="Ek Bilgiler" 
                color="orange" 
                outline
                icon="room_service"
                      class="compact-btn"
                      size="sm"
                      dense
                      :disable="guncellemeModuAktif"
              />
                  </div>
                  <div class="col bedel-islemler-col">
              <q-btn 
                @click="submitForm"
                :label="guncellemeModuAktif ? 'GÜNCELLE' : 'KAYDET'" 
                color="primary" 
                :loading="loading" 
                      class="kurumsal-responsive"
                      size="md"
              />
                  </div>
                  <div class="col-auto bedel-islemler-col">
              <q-btn 
                @click="clearForm" 
                label="TEMİZLE" 
                color="secondary" 
                outline
                      class="compact-btn"
                      size="sm"
                      dense
              />
            </div>
                </div>
              </div>
              
              <!-- Ek Notlar Container -->
              <div class="ek-notlar-fields">
                <q-input
                  v-model="ekNotlar"
                  label="Ek Notlar"
                  outlined
                  color="indigo-6"
                  label-color="indigo-6"
                  dense
                  class="kurumsal-responsive"
                  :class="{ 'konaklama-readonly': guncellemeModuAktif }"
                  :readonly="guncellemeModuAktif"
                  :disable="guncellemeModuAktif"
                />
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

    <!-- Ek Bilgiler Dialog -->
    <q-dialog 
      v-model="showEkBilgilerDialog" 
      no-esc-dismiss
      no-backdrop-dismiss
    >
      <q-card class="ek-bilgiler-dialog" style="width: 350px; max-width: 350px;">
        <!-- Depozito Bedeli Container (En Üstte) -->
        <q-card-section class="q-pb-xs">
          <div class="depozito-container">
            <div class="row items-center justify-center q-gutter-sm">
              <q-checkbox 
                v-model="depozito.dahil" 
                label="Depozito Bedeli:" 
                color="orange"
                dense
                class="text-orange-7 text-weight-medium"
                @update:model-value="updateEkNotlar"
              />
              <q-input
                v-model.number="depozito.bedel"
                type="number"
                suffix="₺"
                dense
                outlined
                color="orange"
                :disable="!depozito.dahil"
                style="width: 120px;"
                class="depozito-input"
                @update:model-value="updateEkNotlar"
              />
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-sm">
          <div class="ek-bilgiler-container">
            <div class="column q-gutter-sm">
              <q-checkbox 
                v-model="ekBilgiler.kahvaltiDahil" 
                label="Kahvaltı Dahil" 
                color="primary"
                :disable="form.KonaklamaTipi !== 'GÜNLÜK'"
                @update:model-value="updateEkNotlar"
              />
              <q-checkbox 
                v-model="ekBilgiler.havluVerildi" 
                label="Havlu Verildi" 
                color="primary"
                @update:model-value="updateEkNotlar"
              />
              <q-checkbox 
                v-model="ekBilgiler.prizVerildi" 
                label="Priz Verildi" 
                color="primary"
                @update:model-value="updateEkNotlar"
              />
              <q-checkbox 
                v-model="ekBilgiler.geceKonaklama" 
                label="Geç Saat Konaklama" 
                color="primary"
                :disable="form.KonaklamaSuresi > 1 || !isGeceKonaklamaSaati"
                @update:model-value="updateEkNotlar"
              >
                <q-tooltip v-if="!isGeceKonaklamaSaati" class="bg-orange text-white text-body2" :delay="500">
                  <q-icon name="schedule" class="q-mr-xs"/>
                  Geç Saat Konaklama sadece 00:00 - 04:00 saatleri arasında seçilebilir
                </q-tooltip>
                <q-tooltip v-else-if="form.KonaklamaSuresi > 1" class="bg-orange text-white text-body2" :delay="500">
                  <q-icon name="info" class="q-mr-xs"/>
                  Geç Saat Konaklama sadece 1 günlük konaklamalarda seçilebilir
                </q-tooltip>
              </q-checkbox>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="İptal" color="grey" @click="cancelEkBilgiler" />
          <q-btn flat label="Tamam" color="primary" @click="saveEkBilgiler" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 🚨 KARA LİSTE UYARI DIALOG - YENİ VERSİYON -->
    <q-dialog v-model="showKaraListeDialog" persistent class="floating-dialog">
      <q-card style="min-width: 500px; max-width: 600px" class="draggable-card">
        <q-card-section class="row items-center q-pb-none bg-red text-white cursor-move q-card__section--head" @mousedown="startDrag">
          <q-icon name="block" size="md" class="q-mr-sm" />
          <div class="text-h6">🚨 KARA LİSTE MÜŞTERİSİ</div>
        </q-card-section>

        <q-card-section v-if="selectedKaraListeMusteri">
          <div class="text-center q-mb-md">
            <q-icon name="warning" size="4rem" color="red-6" />
          </div>
          
          <div class="text-h6 text-center text-red-6 q-mb-md">
            Müşteri kara listeden çıkarılmadan işlem yapılamaz.
          </div>
          
          <div class="text-body1 text-center q-mb-md">
            Kara listeden çıkarmayı onaylıyor musunuz?
          </div>

          <div class="q-mb-md">
            <strong>Müşteri Bilgileri:</strong>
            <ul class="q-pl-md">
              <li><strong>TC:</strong> {{ selectedKaraListeMusteri.MstrTCN }}</li>
              <li><strong>Adı:</strong> {{ selectedKaraListeMusteri.MstrAdi }}</li>
              <li v-if="selectedKaraListeMusteri.MstrTelNo"><strong>Telefon:</strong> {{ selectedKaraListeMusteri.MstrTelNo }}</li>
              <li v-if="selectedKaraListeMusteri.MstrFirma"><strong>Firma:</strong> {{ selectedKaraListeMusteri.MstrFirma }}</li>
            </ul>
          </div>

          <div class="q-mb-md" v-if="selectedKaraListeMusteri.KnklmNot">
            <strong>Kara Liste Sebebi:</strong>
            <div class="q-mt-sm q-pa-sm text-red rounded-borders" style="background: transparent;">
              {{ selectedKaraListeMusteri.KnklmNot }}
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="center" class="q-gutter-sm">
          <q-btn 
            label="EVET" 
            color="green" 
            style="min-width: 120px"
            @click="onaylaKaraListedenCikar" 
            :loading="karaListeProcessing"
          />
          <q-btn 
            label="HAYIR" 
            color="red" 
            outlined
            style="min-width: 120px"
            @click="iptalKaraListeIslemi"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>


<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { api } from '../boot/axios'
import { QForm } from 'quasar'
import type { AxiosError } from 'axios';
import { Notify } from 'quasar';

function debugLog(...args: unknown[]) {
  if (import.meta.env.MODE !== 'production') {
    console.log(...args)
  }
}

const $q = useQuasar()
const router = useRouter()

// Helper function to safely extract value from OdaYatak field
function getOdaYatakValue(odaYatak: string | { value: string; label: string } | null | undefined): string {
  if (typeof odaYatak === 'string') {
    return odaYatak
  }
  if (odaYatak && typeof odaYatak === 'object' && 'value' in odaYatak) {
    return odaYatak.value || ''
  }
  return ''
}

// SessionStorage'dan TC kimlik auto-fill kontrolü
async function checkAndApplyAutoFillTCKimlik() {
  const autoFillTC = sessionStorage.getItem('autoFillTCKimlik');
  if (autoFillTC) {
    // SessionStorage'dan TC kimlik numarasını sil (tek kullanımlık)
    sessionStorage.removeItem('autoFillTCKimlik');
    
    // TC kimlik numarasını input alanına yaz
    form.value.MstrTCN = autoFillTC;
    
    // DOM güncellemesini bekle
    await nextTick();
    
    if (tcInput.value) {
      // Input alanına focus ver
      tcInput.value.focus();
      
      // Kısa bir süre bekle ve blur event'ini tetikle
      setTimeout(() => {
        void (async () => {
          if (tcInput.value) {
            // Blur event'ini manuel tetikle
            tcInput.value.blur();
            
            // onTCNBlur fonksiyonunu da direkt çağır
            await onTCNBlur().catch(console.error);
          }
        })();
      }, 100);
    }
  }
}

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
  HesaplananBedel: 0,
  OdemeVadesi: '', // 🔥 Yeni alan - Ödeme Vadesi
  OdemeTakvimGunu: null as number | null, // 🔥 Yeni alan - Ödeme Takvim Günü
  OtgCheckbox: false // 🔥 Yeni alan - Ö.T.G. Checkbox
})

const loading = ref(false)
const notify = ref('')
const tcInput = ref()
const showExtraFields = ref(false)
const datePopup = ref()
const odemeVadesiPopup = ref() // 🔥 Ödeme vadesi popup ref'i
const formRef = ref()
const anaContainerRef = ref()
const ekBilgilerContainerRef = ref()

// Ek Bilgiler Dialog
const showEkBilgilerDialog = ref(false)
const ekBilgiler = ref({
  kahvaltiDahil: false,
  havluVerildi: false,
  prizVerildi: false,
  geceKonaklama: false
})

// Depozito Bedeli
const depozito = ref({
  dahil: true, // Default olarak işaretli
  bedel: 0
})

// Ek Notlar
const ekNotlar = ref('')

// Gerçek zamanlı saat takibi için reactive değişken
const currentTime = ref(new Date())

// Bugünün tarihini DD.MM.YYYY formatında al
const bugunTarihi = computed(() => {
  const today = currentTime.value
  const day = today.getDate().toString().padStart(2, '0')
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const year = today.getFullYear()
  return `${day}.${month}.${year}`
})

// Geç Saat Konaklama saat kontrolü (00:00 - 04:00 aralığı)
const isGeceKonaklamaSaati = computed(() => {
  const currentHour = currentTime.value.getHours()
  return currentHour >= 0 && currentHour <= 4
})

// Müşteri durumu
const musteriDurumu = ref('')
const guncellemeModuAktif = ref(false)
const veriYukleniyor = ref(false) // Veri yükleme sırasında watchers'ları disable etmek için
// TC değişiklik kontrolü için orijinal değer
const originalTCN = ref('')
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
const odaTipleriOptions = ref<{odaTipi: string, bosOdaSayisi: number}[]>([])
const odaTipleriFormatted = ref<{value: string, label: string, bosOdaSayisi: number}[]>([])
const bosOdalarOptions = ref<{label: string, value: string}[]>([])
const odaYatakOptions = computed(() => bosOdalarOptions.value)
const odaTipFiyatlari = ref<{OdLfytGun: number, OdLfytHft: number, OdLfytAyl: number, OdDpzt?: number} | null>(null)

// 🔥 Ö.T.G. Checkbox için computed property'ler
const isOtgCheckboxEnabled = computed(() => {
  // Otomatik hesaplanan bedel ile toplam bedel farklı ise checkbox aktif olsun
  return form.value.HesaplananBedel !== form.value.ToplamBedel
})

// Planlanan çıkış tarihini hesapla (bugünün tarihi + konaklama süresi)
const planlananCikisTarihi = computed(() => {
  if (!form.value.KonaklamaSuresi || form.value.KonaklamaSuresi < 1) {
    return ''
  }
  
  const bugun = new Date()
  let cikisTarihi: Date
  
  // 30 günlük konaklama için özel hesaplama
  if (form.value.KonaklamaSuresi === 30) {
    // Gün değeri aynı kalır, sadece ay +1 olur
    const gun = bugun.getDate()
    const ay = bugun.getMonth() + 1 // 0-based olduğu için +1
    const yil = bugun.getFullYear()
    
    // Yeni ay hesaplama (12'yi geçerse yıl +1)
    let yeniAy = ay + 1
    let yeniYil = yil
    
    if (yeniAy > 12) {
      yeniAy = 1
      yeniYil = yil + 1
    }
    
    cikisTarihi = new Date(yeniYil, yeniAy - 1, gun) // Ay için 0-based index kullanılır
  } else {
    // Normal hesaplama (1-29 gün için)
    cikisTarihi = new Date(bugun)
    cikisTarihi.setDate(bugun.getDate() + form.value.KonaklamaSuresi)
  }
  
  const day = cikisTarihi.getDate().toString().padStart(2, '0')
  const month = (cikisTarihi.getMonth() + 1).toString().padStart(2, '0')
  const year = cikisTarihi.getFullYear()
  
  return `${day}.${month}.${year}`
})

// 🚨 KARA LİSTE UYARI SİSTEMİ
const showKaraListeDialog = ref<boolean>(false)
const karaListeProcessing = ref<boolean>(false)
const selectedKaraListeMusteri = ref<{
  MstrTCN: string
  MstrAdi: string
  MstrTelNo?: string
  MstrFirma?: string
  KnklmNot?: string
  knklmNo?: number
} | null>(null)

// Fiyat hesaplama fonksiyonu
async function hesaplaBedel() {
  if (!form.value.OdaTipi || !form.value.KonaklamaSuresi || !form.value.KonaklamaTipi) {
    form.value.HesaplananBedel = 0
    form.value.ToplamBedel = 0
    return
  }

  try {
    // Oda tip fiyatlarını getir
    const response = await api.get(`/musteri/oda-tip-fiyatlari/${encodeURIComponent(form.value.OdaTipi)}`)
    if (response.data.success && response.data.data) {
      odaTipFiyatlari.value = response.data.data
      
      // Depozito tutarını güncelle (OdDpzt alanından) ve konaklama tipine göre çarpan uygula
      const bazDepozito = Number(odaTipFiyatlari.value?.OdDpzt) || 0
      const tipForDepozito = form.value.KonaklamaTipi
      let depozitoCarpan = 1
      if (tipForDepozito === 'GÜNLÜK') {
        depozitoCarpan = 1
      } else if (tipForDepozito === '1 HAFTALIK' || tipForDepozito === '2 HAFTALIK' || tipForDepozito === '3 HAFTALIK' || tipForDepozito === 'HAFTALIK') {
        depozitoCarpan = 5
      } else if (tipForDepozito === 'AYLIK') {
        depozitoCarpan = 10
      }
      depozito.value.bedel = Math.round(bazDepozito * depozitoCarpan)
      // console.log(`Depozito tutarı güncellendi: ${depozitoBedeli} TL`)
      
      let hesaplananFiyat = 0
      const sure = form.value.KonaklamaSuresi
      const tip = form.value.KonaklamaTipi
      
      // Fiyat bilgilerini al
      const gunlukFiyat = Number(odaTipFiyatlari.value?.OdLfytGun) || 0
      const haftalikFiyat = Number(odaTipFiyatlari.value?.OdLfytHft) || 0
      const aylikFiyat = Number(odaTipFiyatlari.value?.OdLfytAyl) || 0
      
      if (tip === 'GÜNLÜK') {
        hesaplananFiyat = gunlukFiyat * sure
      } else if (tip === '1 HAFTALIK') {
        if (sure > 7) {
          hesaplananFiyat = (sure - 7) * gunlukFiyat + haftalikFiyat
        } else {
          hesaplananFiyat = haftalikFiyat
        }
      } else if (tip === '2 HAFTALIK') {
        if (sure > 14) {
          hesaplananFiyat = (sure - 14) * gunlukFiyat + 2 * haftalikFiyat
        } else {
          hesaplananFiyat = 2 * haftalikFiyat
        }
      } else if (tip === '3 HAFTALIK') {
        if (sure > 21) {
          hesaplananFiyat = (sure - 21) * gunlukFiyat + 3 * haftalikFiyat
        } else {
          hesaplananFiyat = 3 * haftalikFiyat
        }
      } else if (tip === 'AYLIK') {
        hesaplananFiyat = aylikFiyat
      }
      
      // Aylık fiyat kontrolü - hesaplanan fiyat aylık fiyatı geçerse aylık fiyat uygula
      if (hesaplananFiyat > aylikFiyat) {
        hesaplananFiyat = aylikFiyat
        // console.log(`Bedel hesaplaması: ${tip} hesaplandı ${hesaplananFiyat} TL, ama aylık fiyat uygulandı: ${aylikFiyat} TL`)
      } else {
        // console.log(`Bedel hesaplaması: ${tip} = ${hesaplananFiyat} TL`)
      }
      // 🔽 Onlar basamağına aşağı yuvarla
      hesaplananFiyat = Math.floor(hesaplananFiyat / 10) * 10
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
    const response = await api.get('/musteri/firma-listesi')
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

// Oda tiplerini getir (sadece boş odaların bulunduğu tipler)
async function loadOdaTipleri() {
  try {
    debugLog('Boş oda tipleri yükleniyor...')
    const response = await api.get('/musteri/bos-oda-tipleri')
    debugLog('Boş oda tipleri response:', response.data)
    if (response.data.success) {
      odaTipleriOptions.value = response.data.data
      // Formatted options'u oluştur - dropdown'da boş oda sayısı gösterimi için
      odaTipleriFormatted.value = response.data.data.map((item: {odaTipi: string, bosOdaSayisi: number}) => ({
        value: item.odaTipi,
        label: item.odaTipi, // Seçildiğinde sadece oda tipi görünsün
        bosOdaSayisi: item.bosOdaSayisi
      }))
      debugLog('Boş oda tipleri yüklendi:', odaTipleriOptions.value)
      debugLog('Formatted oda tipleri:', odaTipleriFormatted.value)
    } else {
      console.error('Boş oda tipleri yüklenirken hata:', response.data)
    }
  } catch (error) {
    console.error('Boş oda tipleri yüklenemedi:', error)
  }
}

// Boş odaları getir
async function loadBosOdalar(odaTipi: string) {
  try {
    debugLog('Boş odalar yükleniyor, oda tipi:', odaTipi)
    if (!odaTipi) {
      bosOdalarOptions.value = []
      return
    }
    const response = await api.get(`/musteri/bos-odalar/${encodeURIComponent(odaTipi)}`)
    debugLog('Boş odalar response:', response.data)
    if (response.data.success) {
      bosOdalarOptions.value = response.data.data
      debugLog('Boş odalar yüklendi:', bosOdalarOptions.value)
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
    const response = await api.get(`/musteri/firma-detay/${encodeURIComponent(trimmedName)}`)
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
        await api.post('/musteri/firma-guncelle', {
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
void onKonaklamaSuresiChanged()
// Sayfa yüklendiğinde ek notları güncelle
updateEkNotlar()

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
    
    // Güncelleme modunda ise backend'e boş string gönder
    if (guncellemeModuAktif.value) {
      // MstrFirma'yı explicit olarak boş yaparak backend'e gönder
      extraForm.value.MstrFirma = ''
    }
  } else if (newType === 'Kurumsal') {
    // Kurumsal seçildiğinde firma listesini yenile (çoklu kullanıcı ortamı için)
    void loadFirmaList()
  }
})

// Oda tipi değişikliklerini izle
watch(() => form.value.OdaTipi, (newOdaTipi) => {
  // Veri yükleme sırasında watcher'ı çalıştırma
  if (veriYukleniyor.value) {
    debugLog('Veri yükleniyor - onOdaTipiChanged atlandı')
    return
  }
  
  // Güncelleme modunda oda tipi değişiklik kontrollerini yapma
  if (guncellemeModuAktif.value) {
    debugLog('Güncelleme modunda - Oda tipi değişiklik kontrolleri atlandı')
    return
  }

  if (newOdaTipi) {
    form.value.OdaTipi = newOdaTipi
    form.value.OdaYatak = '' // Oda tipi değiştiğinde oda seçimini temizle
    void loadBosOdalar(newOdaTipi)
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

// Konaklama tipi değişikliklerini izle (Kahvaltı otomatik seçimi için)
watch(() => form.value.KonaklamaTipi, (newTip) => {
  if (newTip === 'GÜNLÜK') {
    // Günlük konaklama seçildiğinde kahvaltı default false kalsın
    ekBilgiler.value.kahvaltiDahil = false
  } else {
    // Haftalık ve aylık konaklamalarda kahvaltı seçilemez
    ekBilgiler.value.kahvaltiDahil = false
  }
  updateEkNotlar()
})

// Konaklama süresi değişikliklerini izle (Geç Saat Konaklama kontrolü için)
watch(() => form.value.KonaklamaSuresi, (newSure) => {
  if (newSure > 1 || !isGeceKonaklamaSaati.value) {
    // Konaklama süresi 1'den büyükse veya saat 00:00-04:00 aralığında değilse Geç Saat Konaklama seçilemez
    ekBilgiler.value.geceKonaklama = false
  }
  updateEkNotlar()
})

// Bedel değişikliklerini izle (İskonto/Artış hesabı için)
watch([() => form.value.HesaplananBedel, () => form.value.ToplamBedel], () => {
  // Güncelleme modunda ek notları otomatik değiştirme
  if (!guncellemeModuAktif.value) {
    updateEkNotlar()
  }
  
  // 🔥 Ö.T.G. otomatik temizleme mantığı
  // Hesaplanan bedel ile toplam bedel eşitlendiğinde Ö.T.G. checkbox'ını otomatik temizle
  // ANCAK (ÖTG) ifadesini ek notlardan kaldırma - sadece checkbox kaldırıldığında silinmeli
  if (form.value.HesaplananBedel === form.value.ToplamBedel && form.value.HesaplananBedel > 0) {
    if (form.value.OtgCheckbox) {
      // Sadece Ö.T.G. checkbox'ını temizle
      // (ÖTG) ifadesini ek notlardan kaldırma - kullanıcı manuel olarak checkbox'ı kaldırırsa o zaman silinsin
      form.value.OtgCheckbox = false
    }
  }
})

// Ek Bilgiler değişikliklerini izle
watch(() => ekBilgiler.value, () => {
  updateEkNotlar()
}, { deep: true })

// Depozito değişikliklerini izle
watch(() => depozito.value, () => {
  updateEkNotlar()
}, { deep: true })

// Saat değişikliklerini izle (her dakika kontrol et ve Geç Saat Konaklama seçimini temizle)
watch(() => isGeceKonaklamaSaati.value, (newValue) => {
  if (!newValue && ekBilgiler.value.geceKonaklama) {
    // Saat aralığı dışına çıkıldığında Geç Saat Konaklama seçimini temizle
    ekBilgiler.value.geceKonaklama = false
    updateEkNotlar()
  }
})

// Timer için referans
let timeUpdateTimer: NodeJS.Timeout | null = null

// Sayfa yüklendiğinde timer'ı başlat
onMounted(async () => {  
  // 🔥 Sayfa yüklendiğinde ek notları temizle
  ekNotlar.value = ''
  
  // 🔥 Ödeme vadesi alanına bugünün tarihini default olarak ata
  form.value.OdemeVadesi = bugunTarihi.value
  
  // SessionStorage'dan TC kimlik auto-fill kontrolü (her zaman)
  await checkAndApplyAutoFillTCKimlik()

  // Sadece önceki sayfa kartli-islem ise müşteri otomatik yüklensin
  const prevPage = sessionStorage.getItem('prevPage')
  if (prevPage === 'kartli-islem') {
    await checkAndApplySelectedMusteriFromKartliIslem()
  } else if (sessionStorage.getItem('autoFillTCKimlik')) {
    // Eski akış desteği: sadece TC auto-fill geldiğinde seçili müşteri yükleme denenebilir
    await checkAndApplySelectedMusteriFromKartliIslem()
  } else {
    debugLog('🔍 Önceki sayfa kartli-islem değil, otomatik müşteri yükleme atlandı. prevPage=', prevPage)
  }
  
  await loadOdaTipleri()
  void loadFirmaList()
  
  // Her 60 saniyede bir zamanı güncelle (saat kontrolü için)
  timeUpdateTimer = setInterval(() => {
    currentTime.value = new Date()
  }, 60000) // 60 saniye = 1 dakika
  
  // 🔥 Test için ek notları güncelle
  setTimeout(() => {
    updateEkNotlar()
  }, 2000)
})

async function submitForm() {
  loading.value = true
  notify.value = ''
  
  // GÜNCELLEME MODU: Sadece müşteri bilgilerini güncelle
  if (guncellemeModuAktif.value) {
    // Güncelleme modunda sadece temel alanları kontrol et
    if (!form.value.MstrTCN) {
      notify.value = 'TC Kimlik No / Pasaport No zorunludur'
      loading.value = false
      return
    }
    
    if (!form.value.MstrTelNo) {
      notify.value = 'Telefon No zorunludur'
      loading.value = false
      return
    }
    
    if (!form.value.MstrAdi) {
      notify.value = 'Müşteri Adı zorunludur'
      loading.value = false
      return
    }
    
    if (form.value.MstrHspTip === 'Kurumsal' && !extraForm.value.MstrFirma) {
      notify.value = 'Firma seçimi zorunludur'
      loading.value = false
      return
    }
    
    // 🔥 Ödeme vadesi kontrolü (Güncelleme modunda)
    if (!form.value.OdemeVadesi || form.value.OdemeVadesi.trim() === '') {
      notify.value = 'Ödeme Vadesi zorunludur'
      loading.value = false
      return
    }
    
    try {
      const updateData = {
        ...extraForm.value,
        MstrAdi: form.value.MstrAdi,
        MstrTelNo: form.value.MstrTelNo,
        MstrHspTip: form.value.MstrHspTip
      }
      
      const response = await api.post(`/musteri/musteri-guncelle/${form.value.MstrTCN}`, updateData)
      if (response.data.success) {
        notify.value = response.data.message || 'Müşteri bilgileri başarıyla güncellendi!'
        
        // 🔥 STATS GÜNCELLEME EVENT'İ GÖNDER
        window.dispatchEvent(new Event('statsNeedsUpdate'));
        
        // 3 saniye sonra mesajı temizle ve formu sıfırla
        setTimeout(() => {
          notify.value = ''
          // Güncelleme sonrası formu tamamen temizle ve yeni kayda hazır hale getir
          clearForm()
        }, 3000)
      } else {
        notify.value = 'Güncelleme sırasında hata oluştu!'
      }
    } catch (error) {
      console.error('Güncelleme hatası:', error)
      
      if (
        isAxiosError(error) &&
        error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data &&
        typeof (error.response.data as { message: unknown }).message === 'string'
      ) {
        notify.value = (error.response.data as { message: string }).message;
      } else if (error instanceof Error && typeof error.message === 'string') {
        notify.value = error.message;
      } else {
        notify.value = 'Güncelleme sırasında hata oluştu!';
      }
    } finally {
      loading.value = false
    }
    return
  }
  
  // NORMAL MOD: Yeni kayıt veya ayrılmış müşteri kaydı
  // Required alanların kontrolü
  if (!form.value.MstrTCN) {
    notify.value = 'TC Kimlik No / Pasaport No zorunludur'
    loading.value = false
    return
  }
  
  if (!form.value.MstrTelNo) {
    notify.value = 'Telefon No zorunludur'
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
  
  // 🔥 Ödeme vadesi kontrolü
  if (!form.value.OdemeVadesi || form.value.OdemeVadesi.trim() === '') {
    notify.value = 'Ödeme Vadesi zorunludur'
    loading.value = false
    return
  }
  
  // 🔥 Ö.T.G. kontrolü - konaklama süresi 30 iken zorunlu
  if (form.value.KonaklamaSuresi === 30) {
    if (!form.value.OdemeTakvimGunu || form.value.OdemeTakvimGunu < 1 || form.value.OdemeTakvimGunu > 31) {
      notify.value = 'Konaklama süresi 30 gün iken Ö.T.G. (1-31 arası) zorunludur'
      loading.value = false
      return
    }
  }
  
  try {
    // Kullanıcı adını localStorage'dan al ve MstrKllnc'ye ata
    const username = localStorage.getItem('username') || 'admin'
    
    // 🔥 Depozito dahil değilse bedeli sıfırla
    const depozitoData = {
      ...depozito.value,
      bedel: depozito.value.dahil ? depozito.value.bedel : 0
    }
    
    const formData = {
      ...form.value,
      ...extraForm.value,
      MstrKllnc: username,
      MstrDurum: 'KALIYOR',
      planlananCikisTarihi: planlananCikisTarihi.value, // Planlanan çıkış tarihini ekle
      ekNotlar: ekNotlar.value,
      ekBilgiler: ekBilgiler.value,
      depozito: depozitoData
    }
    
    const response = await api.post('/musteri/musteri-islem', formData)
    if (response.data.success) {
      notify.value = response.data.message || 'Kayıt başarıyla eklendi!'
      
      // 🔥 STATS GÜNCELLEME EVENT'İ GÖNDER
      window.dispatchEvent(new Event('statsNeedsUpdate'));
      
      // 🔥 KAYIT BAŞARILI - KARTLI İŞLEM SAYFASINA YÖNLENDİR VE TAHSİLAT MODALINI AÇ
      const savedMusteriData = {
        MstrTCN: form.value.MstrTCN,
        MstrAdi: form.value.MstrAdi,
        MstrHspTip: form.value.MstrHspTip,
        MstrTelNo: form.value.MstrTelNo,
        MstrFirma: extraForm.value.MstrFirma || '',
        MstrVD: extraForm.value.MstrVD || '',
        MstrDurum: 'KALIYOR',
        KnklmOdaTip: form.value.OdaTipi,
        KnklmOdaNo: getOdaYatakValue(form.value.OdaYatak).split('-')[0] || '',
        KnklmYtkNo: getOdaYatakValue(form.value.OdaYatak).split('-')[1] || '',
        KnklmNfyt: form.value.ToplamBedel,
        KnklmGrsTrh: bugunTarihi.value,
        KnklmPlnTrh: planlananCikisTarihi.value,
        KnklmNot: ekNotlar.value,
        OdemeVadesi: form.value.OdemeVadesi,
        // 🔥 KART SEÇİMİ İÇİN NOT BİLGİSİNİ EKLE
        customerNote: ekNotlar.value
      }
      
      // Global window objesine kaydedilen müşteri bilgilerini set et
      window.kartliIslemSelectedNormalMusteri = savedMusteriData
      
      // 2 saniye sonra kartli-islem sayfasına yönlendir
      setTimeout(() => {
        Notify.create({
          type: 'positive',
          message: 'Kayıt başarılı! Kartlı işlem sayfasına yönlendiriliyor ve tahsilat formu açılıyor...',
          position: 'top',
          timeout: 2000
        })
        
        void router.push('/kartli-islem?autoOpenModal=true')
        
        // Kartli-islem sayfası yüklendikten sonra tahsilat modalını aç
        setTimeout(() => {
          // DOM'un tamamen güncellendiğinden emin ol
          void nextTick().then(() => {
            debugLog('🔥 showOdemeIslemModal event dispatched')
            window.dispatchEvent(new Event('showOdemeIslemModal'))
          })
        }, 1000)
      }, 2000)
      
      // Form temizle
      form.value = { MstrAdi: '', MstrHspTip: 'Bireysel', MstrTCN: '', MstrTelNo: '', OdaTipi: '', OdaYatak: '', KonaklamaSuresi: 1, KonaklamaTipi: 'GÜNLÜK', ToplamBedel: 0, HesaplananBedel: 0, OdemeVadesi: bugunTarihi.value, OdemeTakvimGunu: null, OtgCheckbox: false }
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
  // Ek Bilgileri temizle
  ekBilgiler.value = {
    kahvaltiDahil: false,
    havluVerildi: false,
    prizVerildi: false,
    geceKonaklama: false
  }
      // Depozito'yu temizle
      depozito.value = {
        dahil: true, // Default olarak işaretli
        bedel: 0
      }
      // Ek notları temizle
      ekNotlar.value = ''
      // Müşteri durumunu temizle
      musteriDurumu.value = ''
      guncellemeModuAktif.value = false
      // Dropdown'ları temizle
      bosOdalarOptions.value = []
      // Ek bilgiler alanını gizle
      showExtraFields.value = false
    } else {
      notify.value = 'Kayıt sırasında hata oluştu!'
    }
  } catch (error) {
    console.error('Error:', error)
    if (
      isAxiosError(error) &&
      error.response &&
      error.response.data &&
      typeof error.response.data === 'object' &&
      'message' in error.response.data &&
      typeof (error.response.data as { message: unknown }).message === 'string'
    ) {
      const errorMessage = (error.response.data as { message: string }).message;
      notify.value = errorMessage;
      if (errorMessage.includes('artık dolu') || errorMessage.includes('bulunamadı')) {
        await clearOdaYatakAndRefresh();
      }
    } else if (
      isAxiosError(error) &&
      error.response &&
      error.response.data &&
      typeof error.response.data === 'object' &&
      'error' in error.response.data &&
      typeof (error.response.data as { error: unknown }).error === 'string'
    ) {
      notify.value = (error.response.data as { error: string }).error;
      if ((error.response.data as { error: string }).error.includes('artık dolu') || (error.response.data as { error: string }).error.includes('bulunamadı')) {
        await clearOdaYatakAndRefresh();
      }
    } else if (error instanceof Error && typeof error.message === 'string') {
      notify.value = error.message
    } else {
      notify.value = 'Kayıt sırasında hata oluştu!'
    }
  } finally {
    loading.value = false
  }
}

function clearForm() {
  form.value = { MstrAdi: '', MstrHspTip: 'Bireysel', MstrTCN: '', MstrTelNo: '', OdaTipi: '', OdaYatak: '', KonaklamaSuresi: 1, KonaklamaTipi: 'GÜNLÜK', ToplamBedel: 0, HesaplananBedel: 0, OdemeVadesi: bugunTarihi.value, OdemeTakvimGunu: null, OtgCheckbox: false }
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
  // Ek Bilgileri temizle
  ekBilgiler.value = {
    kahvaltiDahil: false,
    havluVerildi: false,
    prizVerildi: false,
    geceKonaklama: false
  }
  // Depozito'yu temizle
  depozito.value = {
    dahil: true, // Default olarak işaretli
    bedel: 0
  }
  // Ek notları temizle
  ekNotlar.value = ''
  // Müşteri durumunu temizle
  musteriDurumu.value = ''
  guncellemeModuAktif.value = false
  // Veri yükleme flagını sıfırla
  veriYukleniyor.value = false
  // Ek bilgiler container'ını gizle
  showExtraFields.value = false
  // Dropdown'ları temizle
  bosOdalarOptions.value = []
  notify.value = '' // Uyarı mesajını da temizle
}

function toggleExtraFields() {
  showExtraFields.value = !showExtraFields.value
}

function saveEkBilgiler() {
  // Ek Bilgileri kaydet ve dialog'u kapat
  showEkBilgilerDialog.value = false
  
  // Seçilen bilgileri göster
  const secilenBilgiler = []
  if (depozito.value.dahil) secilenBilgiler.push(`Depozito: ${depozito.value.bedel}₺`)
  if (ekBilgiler.value.kahvaltiDahil) secilenBilgiler.push('Kahvaltı Dahil')
  if (ekBilgiler.value.havluVerildi) secilenBilgiler.push('Havlu Verildi')
  if (ekBilgiler.value.prizVerildi) secilenBilgiler.push('Priz Verildi')
  if (ekBilgiler.value.geceKonaklama) secilenBilgiler.push('Geç Saat Konaklama')
  
  // Ek notları güncelle
  updateEkNotlar()
}

function cancelEkBilgiler() {
  // Seçenekleri mevcut konaklama tipine ve saat koşullarına göre sıfırla ve dialog'u kapat
  ekBilgiler.value = {
    kahvaltiDahil: form.value.KonaklamaTipi === 'GÜNLÜK',
    havluVerildi: false,
    prizVerildi: false,
    geceKonaklama: false // Saat ve süre koşullarına bakılmaksızın false yapılıyor
  }
  
  // Depozito durumunu varsayılan değerlere döndür
  depozito.value.dahil = true
  
  showEkBilgilerDialog.value = false
}

// Ek notları otomatik güncelle
function updateEkNotlar() {
  // Güncelleme modunda mevcut ek notları koru
  if (guncellemeModuAktif.value) {
    return // Güncelleme modunda ek notları otomatik değiştirme
  }
  
  // 🔥 Mevcut (ÖTG) ifadesini koru
  const mevcutNotlar = ekNotlar.value || ''
  const otgPrefix = mevcutNotlar.includes('(ÖTG)') ? '(ÖTG) ' : ''
  
  const notlar = []
  
  // 0. Müşteri durumuna göre prefix ekle
  if (musteriDurumu.value === 'AYRILAN_MUSTERI') {
    notlar.push('Yeni Giriş:')
  } else if (musteriDurumu.value === 'YENI') {
    notlar.push('Yeni Müşteri:')
  }
  // KALIYOR müşteriler için prefix eklenmez
  
  // 1. Depozito bilgisi (önemli olduğu için başta)
  if (depozito.value.dahil && depozito.value.bedel > 0) {
    notlar.push(`Depozito: ${depozito.value.bedel}₺`)
  } else if (!depozito.value.dahil) {
    notlar.push('Depozito Alınmadı')
  }
  
  // 2. İskonto/Artış hesabı - (ÖTG) prefix'i ile birlikte
  if (form.value.HesaplananBedel > 0 && form.value.ToplamBedel > 0) {
    const hesaplanan = form.value.HesaplananBedel
    const toplam = form.value.ToplamBedel
    
    if (toplam < hesaplanan) {
      // İskonto yapıldı
      const iskontoOrani = Math.round(((hesaplanan - toplam) / hesaplanan) * 100)
      notlar.push(`${otgPrefix}İskonto Yapıldı: %${iskontoOrani}`)
    } else if (toplam > hesaplanan) {
      // Artış yapıldı
      const artisOrani = Math.round(((toplam - hesaplanan) / hesaplanan) * 100)
      notlar.push(`${otgPrefix}Artış Yapıldı: %${artisOrani}`)
    }
  }
  
  // 3. Kahvaltı durumu
  if (form.value.KonaklamaTipi === 'GÜNLÜK') {
    if (ekBilgiler.value.kahvaltiDahil) {
      notlar.push('Kahvaltı Verildi')
    }
  }
  
  // 4. Ek Bilgiler
  if (ekBilgiler.value.havluVerildi) {
    notlar.push('Havlu Verildi')
  }
  
  if (ekBilgiler.value.prizVerildi) {
    notlar.push('Priz Verildi')
  }
  
  if (ekBilgiler.value.geceKonaklama) {
    notlar.push('Geç Saat Konaklama')
  }
  
  // Notları birleştir
  const finalNotlar = notlar.length > 0 ? ' - ' + notlar.join(' -/- ') : ''
  ekNotlar.value = finalNotlar
}

function onDateSelected(date: string) {
  extraForm.value.MstrDgmTarihi = date
  // Popup'ı otomatik kapat
  if (datePopup.value) {
    datePopup.value.hide()
  }
}

// 🔥 Ödeme vadesi seçimi
function onOdemeVadesiSelected(date: string) {
  // Seçilen tarihi güvenli şekilde Date objesine çevir
  const parts = date.split('.')
  let gun = Number(parts[0])
  let ay = Number(parts[1])
  let yil = Number(parts[2])
  const bugun = new Date()
  bugun.setHours(0,0,0,0)

  // Eğer tarih eksikse bugünün tarihi kullan
  if (!gun || !ay || !yil) {
    gun = bugun.getDate()
    ay = bugun.getMonth() + 1
    yil = bugun.getFullYear()
  }
  const secilen = new Date(yil, ay - 1, gun)

  if (secilen < bugun) {
    Notify.create({
      type: 'warning',
      message: 'Geçmiş bir tarih seçilemez! Ödeme vadesi bugünün tarihi olarak ayarlandı.'
    })
    const d = bugun.getDate().toString().padStart(2, '0')
    const m = (bugun.getMonth() + 1).toString().padStart(2, '0')
    const y = bugun.getFullYear()
    form.value.OdemeVadesi = `${d}.${m}.${y}`
  } else {
  form.value.OdemeVadesi = date
  }
  // Popup'ı otomatik kapat
  if (odemeVadesiPopup.value) {
    odemeVadesiPopup.value.hide()
  }
}

// TC kimlik no focus - orijinal değeri kaydet
function onTCNFocus() {
  // TC input'a odaklanıldığında orijinal değeri kaydet
  originalTCN.value = form.value.MstrTCN || ''
}

// TC kimlik no değişikliği - form temizleme kontrolü
function onTCNInput() {
  // Eğer form dolu ve TC değiştiriliyorsa önce temizle
  const formDolu = form.value.MstrAdi || 
                   form.value.MstrTelNo || 
                   form.value.OdaTipi || 
                   form.value.OdaYatak ||
                   extraForm.value.MstrDgmTarihi ||
                   extraForm.value.MstrTel2 ||
                   extraForm.value.MstrEposta ||
                   extraForm.value.MstrMeslek ||
                   extraForm.value.MstrYakini ||
                   extraForm.value.MstrYknTel ||
                   extraForm.value.MstrFirma ||
                   extraForm.value.MstrAdres ||
                   extraForm.value.MstrNot
                   
  if (formDolu || guncellemeModuAktif.value) {
    // Mevcut TC'yi koruyarak formu temizle
    const mevcutTC = form.value.MstrTCN
    clearForm()
    form.value.MstrTCN = mevcutTC
    
    notify.value = 'Form temizlendi - Yeni TC kimlik kontrolü için alanı terk edin'
    setTimeout(() => {
      notify.value = ''
    }, 2500)
  }
}

// 🔥 localStorage'dan kartli-islem sayfasından gelen seçili müşteri bilgilerini kontrol et ve yükle
async function checkAndApplySelectedMusteriFromKartliIslem() {
  try {
    debugLog('🔥 checkAndApplySelectedMusteriFromKartliIslem fonksiyonu çağrıldı')
    // Güvenlik: kartli-islem menşei YOKSA sadece TC auto-fill varsa devam et
    const prevPage = sessionStorage.getItem('prevPage')
    const hasAutoFillTC = !!sessionStorage.getItem('autoFillTCKimlik')
    if (prevPage !== 'kartli-islem' && !hasAutoFillTC) {
      debugLog('🔍 prevPage != kartli-islem ve autoFill yok, otomatik yükleme yapılmayacak')
      return
    }
    const selectedMusteriData = localStorage.getItem('selectedMusteriForIslem')
    debugLog('🔥 localStorage\'dan alınan veri:', selectedMusteriData)
    
    if (selectedMusteriData) {
      const musteriData = JSON.parse(selectedMusteriData)
      debugLog('🔥 Parse edilen müşteri verisi:', musteriData)
      
      // Sadece belirli kartlardan gelen müşteriler için işlem yap
      const allowedFilters = ['yeni-musteri', 'yeni-giris', 'toplam-aktif', 'suresi-dolan']
      debugLog('🔥 Müşteri kartı:', musteriData.currentFilter, 'İzin verilen kartlar:', allowedFilters)
      
      if (allowedFilters.includes(musteriData.currentFilter)) {
        debugLog('🔥 kartli-islem sayfasından seçili müşteri bulundu:', musteriData)
        
        // Sadece müşteri bilgilerini doldur (tblMusteri tablosundaki bilgiler)
        form.value.MstrTCN = musteriData.MstrTCN || ''
        form.value.MstrAdi = musteriData.MstrAdi || ''
        form.value.MstrTelNo = musteriData.MstrTelNo || ''
        form.value.MstrHspTip = musteriData.MstrHspTip || 'Bireysel'
        debugLog('🔥 Hesap Tipi set edildi:', form.value.MstrHspTip, 'Orijinal veri:', musteriData.MstrHspTip)
        
        // Konaklama bilgilerini readonly olarak göster (değiştirilemez)
        form.value.OdaTipi = musteriData.KnklmOdaTip || ''
        form.value.OdaYatak = musteriData.OdaYatak || ''
        form.value.KonaklamaTipi = musteriData.KonaklamaTipi || 'GÜNLÜK'
        form.value.ToplamBedel = parseFloat(musteriData.KnklmNfyt) || 0
        form.value.HesaplananBedel = parseFloat(musteriData.KnklmLfyt) || 0
        
        // Konaklama süresini hesapla (readonly)
        if (musteriData.KnklmGrsTrh && musteriData.KnklmPlnTrh) {
          const giris = new Date(musteriData.KnklmGrsTrh.split('.').reverse().join('-'))
          const cikis = new Date(musteriData.KnklmPlnTrh.split('.').reverse().join('-'))
          const diffTime = Math.abs(cikis.getTime() - giris.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          form.value.KonaklamaSuresi = diffDays > 0 ? diffDays : 1
        } else {
          form.value.KonaklamaSuresi = 1
        }
        
        // Ek form alanlarını doldur
        extraForm.value.MstrDgmTarihi = musteriData.MstrDgmTarihi || ''
        extraForm.value.MstrTel2 = musteriData.MstrTel2 || ''
        extraForm.value.MstrEposta = musteriData.MstrEposta || ''
        extraForm.value.MstrMeslek = musteriData.MstrMeslek || ''
        extraForm.value.MstrYakini = musteriData.MstrYakini || ''
        extraForm.value.MstrYknTel = musteriData.MstrYknTel || ''
        extraForm.value.MstrAdres = musteriData.MstrAdres || ''
        extraForm.value.MstrNot = musteriData.MstrNot || ''
        
        // Kurumsal alanları doldur
        if (musteriData.MstrHspTip === 'Kurumsal') {
          extraForm.value.MstrFirma = musteriData.MstrFirma || ''
          extraForm.value.MstrVD = musteriData.MstrVD || ''
          extraForm.value.MstrVno = musteriData.MstrVno || ''
          extraForm.value.MstrFrmTel = musteriData.MstrFrmTel || ''
          extraForm.value.MstrFrmMdr = musteriData.MstrFrmMdr || ''
          extraForm.value.MstrMdrTel = musteriData.MstrMdrTel || ''
          
          // Kurumsal alanları görünür yap
          showExtraFields.value = true
        } else {
          // Bireysel müşteri için kurumsal alanları temizle
          extraForm.value.MstrFirma = ''
          extraForm.value.MstrVD = ''
          extraForm.value.MstrVno = ''
          extraForm.value.MstrFrmTel = ''
          extraForm.value.MstrFrmMdr = ''
          extraForm.value.MstrMdrTel = ''
        }
        
        // Ek notları yükle
        ekNotlar.value = musteriData.KnklmNot || ''
        
        // Güncelleme modunu aktif et
        musteriDurumu.value = musteriData.musteriDurumu || 'KALIYOR'
        guncellemeModuAktif.value = true
        
        // Ek bilgiler formunu aç
        showExtraFields.value = true
        
        // Orijinal TC değerini güncelle
        originalTCN.value = musteriData.MstrTCN || ''
        
        // Ödeme vadesini yükle
        try {
          const vadeResponse = await api.get(`/musteri/musteri-odeme-vadesi/${musteriData.MstrTCN}`)
          if (vadeResponse.data.success && vadeResponse.data.odemeVadesi) {
            form.value.OdemeVadesi = vadeResponse.data.odemeVadesi
          }
        } catch (error) {
          console.error('Ödeme vadesi yüklenirken hata:', error)
        }
        
        notify.value = 'Kartlı İşlem sayfasından seçili müşteri bilgileri yüklendi - Güncelleme modu aktif'
        
        // localStorage ve prevPage işaretini temizle
        localStorage.removeItem('selectedMusteriForIslem')
        sessionStorage.removeItem('prevPage')
        
        setTimeout(() => {
          notify.value = ''
        }, 3000)
      }
    }
  } catch (error) {
    console.error('Kartlı işlem sayfasından müşteri bilgileri yüklenirken hata:', error)
  }
}

// TC kimlik no blur kontrolü - 3 aşamalı sistem
async function onTCNBlur() {
  const currentTCN = form.value.MstrTCN?.trim() || ''
  
  // 🚨 KARA LİSTE KONTROLÜ - TC girilir girilmez kontrol et
  if (currentTCN && currentTCN.length >= 5) {
    await checkKaraListeDurumu(currentTCN)
  }
  
  // TC kimlik no durumuna göre ek notları yönetim (sadece form temizleme sırasında)
  // TC boş olsa bile ek notları hemen temizleme, form dolu olabilir
  
  // Eğer TC değeri değişti ve form dolu ise önce temizle
  if (currentTCN !== originalTCN.value) {
    const formDolu = form.value.MstrAdi || 
                     form.value.MstrTelNo || 
                     form.value.MstrHspTip || 
                     form.value.OdaTipi || 
                     form.value.OdaYatak ||
                     extraForm.value.MstrDgmTarihi ||
                     extraForm.value.MstrTel2 ||
                     extraForm.value.MstrEposta ||
                     extraForm.value.MstrMeslek ||
                     extraForm.value.MstrYakini ||
                     extraForm.value.MstrYknTel ||
                     extraForm.value.MstrFirma ||
                     extraForm.value.MstrAdres ||
                     extraForm.value.MstrNot ||
                     ekNotlar.value
                     
    if (formDolu || guncellemeModuAktif.value) {
      // TC kimlik no hariç tüm alanları temizle
      form.value.MstrAdi = ''
      form.value.MstrTelNo = ''
      form.value.MstrHspTip = 'Bireysel'
      form.value.OdaTipi = ''
      form.value.OdaYatak = ''
      form.value.KonaklamaSuresi = 1
      form.value.KonaklamaTipi = 'GÜNLÜK'
      form.value.ToplamBedel = 0
      form.value.HesaplananBedel = 0
      form.value.OdemeTakvimGunu = null // 🔥 Ö.T.G. alanını temizle
      
      // Ek form alanlarını temizle
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
      
      // Ek Bilgileri temizle
      ekBilgiler.value = {
        kahvaltiDahil: true,
        havluVerildi: false,
        prizVerildi: false,
        geceKonaklama: false
      }
      
      // Depozito'yu temizle
      depozito.value = {
        dahil: true,
        bedel: 0
      }
      
      // Ek notları temizle
      ekNotlar.value = ''
      
      // Container'ları gizle
      showExtraFields.value = false
      
      // Müşteri durumunu temizle
      musteriDurumu.value = ''
      guncellemeModuAktif.value = false
      
      // Dropdown'ları temizle
      bosOdalarOptions.value = []
      
      notify.value = 'TC değişikliği algılandı - Form temizlendi'
      setTimeout(() => {
        notify.value = ''
      }, 2500)
    }
  }
  
  const tcn = currentTCN
  if (!tcn || tcn.length < 5) {
    musteriDurumu.value = ''
    guncellemeModuAktif.value = false
    return
  }

  try {
    // Müşteri durum kontrolü yap
    const response = await api.get(`/musteri/musteri-durum-kontrol/${tcn}`)
    
    if (response.data.success && response.data.data) {
      const durumData = response.data.data
      
      if (!durumData.exists) {
        // AŞAMA 1: Müşteri tabloda yok - yeni müşteri
        musteriDurumu.value = 'YENI'
        guncellemeModuAktif.value = false
        notify.value = ''
        
        // 🔥 Yeni müşteri için ek notlar prefixini ekle
        ekNotlar.value = 'Yeni Müşteri: '
      } else if (durumData.durum === 'AYRILDI') {
        // AŞAMA 2: Müşteri tabloda var ama durumu AYRILDI - yeni giriş
        musteriDurumu.value = 'AYRILAN_MUSTERI'
        guncellemeModuAktif.value = false
        notify.value = 'Müşteri daha önce kayıtlı ancak ayrılmış - Bilgiler yükleniyor...'
        
        // Ek Notlar alanına "Yeni Giriş: " ekle
        ekNotlar.value = 'Yeni Giriş: '
      
        try {
          // Müşteri bilgilerini getir
          const musteriResponse = await api.get(`/musteri/musteri-bilgi/${tcn}`)
          if (musteriResponse.data.success && musteriResponse.data.data) {
            const musteriData = musteriResponse.data.data
            
            // Ana form alanlarını doldur
            form.value.MstrAdi = musteriData.MstrAdi || ''
            form.value.MstrTelNo = musteriData.MstrTelNo || ''
            form.value.MstrHspTip = musteriData.MstrHspTip || 'Bireysel'
            
            // Ek form alanlarını doldur
            extraForm.value.MstrDgmTarihi = musteriData.MstrDgmTarihi || ''
            extraForm.value.MstrTel2 = musteriData.MstrTel2 || ''
            extraForm.value.MstrEposta = musteriData.MstrEposta || ''
            extraForm.value.MstrMeslek = musteriData.MstrMeslek || ''
            extraForm.value.MstrYakini = musteriData.MstrYakini || ''
            extraForm.value.MstrYknTel = musteriData.MstrYknTel || ''
            extraForm.value.MstrAdres = musteriData.MstrAdres || ''
            extraForm.value.MstrNot = musteriData.MstrNot || ''
            
            // Kurumsal alanları doldur
            if (musteriData.MstrHspTip === 'Kurumsal') {
              extraForm.value.MstrFirma = musteriData.MstrFirma || ''
              extraForm.value.MstrVD = musteriData.MstrVD || ''
              extraForm.value.MstrVno = musteriData.MstrVno || ''
              extraForm.value.MstrFrmTel = musteriData.MstrFrmTel || ''
              extraForm.value.MstrFrmMdr = musteriData.MstrFrmMdr || ''
              extraForm.value.MstrMdrTel = musteriData.MstrMdrTel || ''
            }
            
            notify.value = 'Ayrılmış müşteri bilgileri yüklendi'
          }
        } catch (bilgiError) {
          console.error('Müşteri bilgileri alınamadı:', bilgiError)
          notify.value = 'Ayrılmış müşteri bilgileri alınamadı'
        }
        
        setTimeout(() => {
          notify.value = ''
        }, 3000)
      } else if (durumData.durum === 'KALIYOR') {
        // AŞAMA 3: Müşteri tabloda var ve durumu KALIYOR - güncelleme modu
        musteriDurumu.value = 'KALIYOR'
        guncellemeModuAktif.value = true
        notify.value = 'Güncelleme moduna geçiliyor - Mevcut konaklama bilgileri yükleniyor...'
        
        try {
          // Veri yükleme başlangıcı - watchers'ları disable et
          veriYukleniyor.value = true
          
          // Mevcut konaklama endpoint'i modül ile birlikte olmalı
          const konaklamaResponse = await api.get(`/musteri/mevcut-konaklama/${tcn}`)
          
          if (konaklamaResponse.data.success && konaklamaResponse.data.data) {
            const konaklamaData = konaklamaResponse.data.data
            
            // Ana form alanlarını doldur
            form.value.MstrAdi = konaklamaData.MstrAdi || ''
            form.value.MstrTelNo = konaklamaData.MstrTelNo || ''
            form.value.MstrHspTip = konaklamaData.MstrHspTip || 'Bireysel'
            
            // Konaklama bilgilerini doldur (READ-ONLY)
            form.value.OdaTipi = konaklamaData.KnklmOdaTip || ''
            form.value.OdaYatak = `Oda: ${konaklamaData.KnklmOdaNo} - Yatak: ${konaklamaData.KnklmYtkNo}`
            form.value.KonaklamaTipi = konaklamaData.KnklmTip || 'GÜNLÜK'
            
            // Konaklama süresini tarihlerden hesapla
            if (konaklamaData.KnklmGrsTrh && konaklamaData.KnklmPlnTrh) {
                const giris = new Date(konaklamaData.KnklmGrsTrh.split('.').reverse().join('-'));
                const cikis = new Date(konaklamaData.KnklmPlnTrh.split('.').reverse().join('-'));
                const diffTime = Math.abs(cikis.getTime() - giris.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                form.value.KonaklamaSuresi = diffDays > 0 ? diffDays : 1;
            } else {
                form.value.KonaklamaSuresi = 1;
            }

            form.value.ToplamBedel = parseFloat(konaklamaData.KnklmNfyt) || 0
            form.value.HesaplananBedel = parseFloat(konaklamaData.KnklmLfyt) || 0
            
            // Ek notları ve ödeme vadesini yükle
            ekNotlar.value = konaklamaData.KnklmNot || ''
            const vadeResponse = await api.get(`/musteri/musteri-odeme-vadesi/${tcn}`)
            if (vadeResponse.data.success && vadeResponse.data.odemeVadesi) {
                form.value.OdemeVadesi = vadeResponse.data.odemeVadesi
            } else {
                form.value.OdemeVadesi = bugunTarihi.value
            }

            // Ek form alanlarını doldur
            extraForm.value.MstrDgmTarihi = konaklamaData.MstrDgmTarihi || ''
            extraForm.value.MstrTel2 = konaklamaData.MstrTel2 || ''
            extraForm.value.MstrEposta = konaklamaData.MstrEposta || ''
            extraForm.value.MstrMeslek = konaklamaData.MstrMeslek || ''
            extraForm.value.MstrYakini = konaklamaData.MstrYakini || ''
            extraForm.value.MstrYknTel = konaklamaData.MstrYknTel || ''
            extraForm.value.MstrAdres = konaklamaData.MstrAdres || ''
            extraForm.value.MstrNot = konaklamaData.MstrNot || ''
            
            // Kurumsal alanları doldur
            if (konaklamaData.MstrHspTip === 'Kurumsal') {
              extraForm.value.MstrFirma = konaklamaData.MstrFirma || ''
              extraForm.value.MstrVD = konaklamaData.MstrVD || ''
              extraForm.value.MstrVno = konaklamaData.MstrVno || ''
              extraForm.value.MstrFrmTel = konaklamaData.MstrFrmTel || ''
              extraForm.value.MstrFrmMdr = konaklamaData.MstrFrmMdr || ''
              extraForm.value.MstrMdrTel = konaklamaData.MstrMdrTel || ''
            }
            
            showExtraFields.value = true // Ek bilgiler formunu otomatik aç
            
            notify.value = 'Güncelleme modu - Mevcut konaklama bilgileri yüklendi'
            
            // Veri yükleme tamamlandı - watchers'ları tekrar aktif et
            setTimeout(() => {
              veriYukleniyor.value = false
              debugLog('Veri yükleme tamamlandı - watchers tekrar aktif')
            }, 100)
          }
        } catch (konaklamaError) {
          console.error('Mevcut konaklama bilgileri alınamadı:', konaklamaError)
          notify.value = 'Güncelleme modu - Konaklama bilgileri alınamadı'
          
          // Hata durumunda da watchers'ları tekrar aktif et
          veriYukleniyor.value = false
        }
        
        setTimeout(() => {
          notify.value = ''
        }, 3000)
      } else {
        // Beklenmeyen durum - varsayılan olarak yeni müşteri kabul et
        console.warn('Beklenmeyen müşteri durumu:', durumData.durum)
        musteriDurumu.value = 'YENI'
        guncellemeModuAktif.value = false
        notify.value = ''
      }
    } else {
      // API yanıtı beklenenden farklı - yeni müşteri olarak kabul et
      musteriDurumu.value = 'YENI'
      guncellemeModuAktif.value = false
    }
  } catch (error) {
    console.error('TC kimlik kontrolü hatası:', error)
    musteriDurumu.value = 'YENI' // Hata durumunda yeni müşteri olarak kabul et
    guncellemeModuAktif.value = false
  }
  
  // Ek notları güncelle
  updateEkNotlar()
}

// 🚨 KARA LİSTE DURUMU KONTROLÜ
async function checkKaraListeDurumu(tcKimlik: string) {
  try {
    debugLog('🚨 Kara liste kontrolü başlatılıyor:', tcKimlik)
    const response = await api.get(`/dashboard/kara-liste-kontrol/${tcKimlik}`)
    
    if (response.data.success && response.data.data) {
      const karaListeData = response.data.data
      
      if (karaListeData.isKaraListe) {
        debugLog('🚨 KARA LİSTE MÜŞTERİSİ TESPİT EDİLDİ!')
        // Kara liste popup'ını göster - Backend'den gelen müşteri bilgilerini kullan
        selectedKaraListeMusteri.value = {
          MstrTCN: tcKimlik,
          MstrAdi: karaListeData.musteriAdi || 'Bilinmiyor',
          MstrTelNo: karaListeData.musteriTelNo || '',
          MstrFirma: karaListeData.musteriFirma || '',
          KnklmNot: karaListeData.karaListeNot || '',
          knklmNo: karaListeData.knklmNo
        }
        showKaraListeDialog.value = true
      }
    }
  } catch (error) {
    console.error('Kara liste kontrolü hatası:', error)
  }
}

// 🚨 KARA LİSTEDEN ÇIKARMA ONAY FONKSİYONU
async function onaylaKaraListedenCikar() {
  if (!selectedKaraListeMusteri.value?.MstrTCN) return
  
  karaListeProcessing.value = true
  
  try {
    const response = await api.put(`/dashboard/kara-listeden-cikar/${selectedKaraListeMusteri.value.MstrTCN}`)
    
    if (response.data.success) {
      // Başarılı mesaj göster
      notify.value = '✅ Müşteri kara listeden başarıyla çıkarıldı. İşleme devam edebilirsiniz.'
      
      // Dialog'u kapat
      showKaraListeDialog.value = false
      selectedKaraListeMusteri.value = null
      
      // 3 saniye sonra bildirim mesajını temizle
      setTimeout(() => {
        notify.value = ''
      }, 3000)
    } else {
      throw new Error(response.data.message || 'Kara listeden çıkarma işlemi başarısız')
    }
  } catch (error) {
    console.error('Kara listeden çıkarma hatası:', error)
    const errorMessage = error instanceof Error 
      ? error.message || 'Sunucu hatası' 
      : 'Bilinmeyen hata'
    notify.value = `❌ Hata: ${errorMessage}`
    
    setTimeout(() => {
      notify.value = ''
    }, 5000)
  } finally {
    karaListeProcessing.value = false
  }
}

// 🚨 KARA LİSTE İŞLEMİ İPTAL FONKSİYONU - FULL TEMİZLE
function iptalKaraListeIslemi() {
  // Dialog'u kapat
  showKaraListeDialog.value = false
  selectedKaraListeMusteri.value = null
  
  // *** TÜM FORM ALANLARINI TEMİZLE ***
  
  // Ana form alanları
  form.value.MstrAdi = ''
  form.value.MstrHspTip = 'Bireysel'
  form.value.MstrTCN = ''
  form.value.MstrTelNo = ''
  form.value.OdaTipi = ''
  form.value.OdaYatak = ''
  form.value.KonaklamaSuresi = 1
  form.value.KonaklamaTipi = 'GÜNLÜK'
  form.value.ToplamBedel = 0
  form.value.HesaplananBedel = 0
  form.value.OdemeTakvimGunu = null // 🔥 Ö.T.G. alanını temizle
  
  // Ek form alanlarını temizle
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
  
  // Ek Bilgileri temizle
  ekBilgiler.value = {
    kahvaltiDahil: true, // Default değeri koru
    havluVerildi: false,
    prizVerildi: false,
    geceKonaklama: false
  }
  
  // Depozito'yu temizle
  depozito.value = {
    dahil: true, // Default değeri koru
    bedel: 0
  }
  
  // Ek notları temizle
  ekNotlar.value = ''
  
  // Container'ları gizle
  showExtraFields.value = false
  
  // Müşteri durumunu temizle
  musteriDurumu.value = ''
  guncellemeModuAktif.value = false
  
  // Dropdown'ları temizle
  bosOdalarOptions.value = []
  filteredFirmaOptions.value = []
  odaTipFiyatlari.value = null
  
  // Orijinal TC değerini temizle
  originalTCN.value = ''
  
  // Bildirim göster
  notify.value = '❌ İşlem iptal edildi. Tüm form alanları temizlendi.'
  
  setTimeout(() => {
    notify.value = ''
  }, 3000)
  
  // TC input alanına focus ver
  if (tcInput.value) {
    tcInput.value.focus()
  }
}

// 🎯 DIALOG SÜRÜKLEME FONKSİYONLARI
let isDragging = false;
const dragOffset = { x: 0, y: 0 };

function startDrag(event: MouseEvent) {
  isDragging = true;
  const rect = (event.target as HTMLElement).closest('.draggable-card')?.getBoundingClientRect();
  if (rect) {
    dragOffset.x = event.clientX - rect.left;
    dragOffset.y = event.clientY - rect.top;
  }
  
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  event.preventDefault();
}

function onDrag(event: MouseEvent) {
  if (!isDragging) return;
  
  const dialog = document.querySelector('.draggable-card') as HTMLElement;
  if (dialog) {
    const x = event.clientX - dragOffset.x;
    const y = event.clientY - dragOffset.y;
    
    dialog.style.position = 'fixed';
    dialog.style.left = `${Math.max(0, Math.min(x, window.innerWidth - dialog.offsetWidth))}px`;
    dialog.style.top = `${Math.max(0, Math.min(y, window.innerHeight - dialog.offsetHeight))}px`;
    dialog.style.transform = 'none';
  }
}

function stopDrag() {
  isDragging = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
}

function onOdaTipiChanged(odaTipi: string | null) {
  // Veri yükleme sırasında onchange handler'ı çalıştırma
  if (veriYukleniyor.value) {
    debugLog('Veri yükleniyor - onOdaTipiChanged atlandı')
    return
  }
  
  // Güncelleme modunda oda tipi değişiklik kontrollerini yapma
  if (guncellemeModuAktif.value) {
    debugLog('Güncelleme modunda - Oda tipi değişiklik kontrolleri atlandı')
    return
  }

  if (odaTipi) {
    form.value.OdaTipi = odaTipi
    form.value.OdaYatak = '' // Oda tipi değiştiğinde oda seçimini temizle
    void loadBosOdalar(odaTipi)
    // Fiyat hesapla
    void hesaplaBedel()
    // Ek notları güncelle
    updateEkNotlar()
  } else {
    form.value.OdaTipi = ''
    form.value.OdaYatak = ''
    bosOdalarOptions.value = []
    form.value.HesaplananBedel = 0
    form.value.ToplamBedel = 0
    // Ek notları güncelle
    updateEkNotlar()
  }
}

function onOdaYatakChanged(odaYatak: string | null) {
  // Güncelleme modunda oda-yatak değişiklik kontrollerini yapma
  if (guncellemeModuAktif.value) {
    debugLog('Güncelleme modunda - Oda-yatak değişiklik kontrolleri atlandı')
    return
  }

  if (odaYatak) {
    form.value.OdaYatak = odaYatak
    // Ek notları güncelle
    updateEkNotlar()
  }
}

// Ödeme Takvim Günü değişiklik fonksiyonu
function onOdemeTakvimGunuChanged() {
  const gun = form.value.OdemeTakvimGunu
  
  // Güncelleme modunda işlem yapma
  if (guncellemeModuAktif.value) {
    debugLog('Güncelleme modunda - Ödeme takvim günü değişikliği atlandı')
    return
  }
  
  // Gün kontrolü (1-31 arası)
  if (gun && (gun < 1 || gun > 31)) {
    form.value.OdemeTakvimGunu = null
    notify.value = 'Ödeme takvim günü 1-31 arasında olmalıdır.'
    setTimeout(() => {
      notify.value = ''
    }, 3000)
    return
  }
  
  debugLog('Ödeme takvim günü güncellendi:', gun)
}

async function onKonaklamaSuresiChanged() {
  // Güncelleme modunda konaklama süresi hesaplamalarını yapma
  if (guncellemeModuAktif.value) {
    debugLog('Güncelleme modunda - Konaklama süresi hesaplamaları atlandı')
    return
  }

  const sure = form.value.KonaklamaSuresi
  
  // 🔥 Ö.T.G. default değer ayarlama - konaklama süresi 30 iken bugünün gün değeri
  if (sure === 30 && form.value.OdemeTakvimGunu === null) {
    const bugun = new Date()
    const gunDegeri = bugun.getDate()
    form.value.OdemeTakvimGunu = gunDegeri
    debugLog('Ö.T.G. default değer ayarlandı:', gunDegeri)
  } else if (sure !== 30) {
    // Konaklama süresi 30 değilse Ö.T.G. değerini temizle
    form.value.OdemeTakvimGunu = null
  }
  
  // Konaklama süresi kontrolü
  if (sure < 1 || sure > 30) {
    form.value.KonaklamaSuresi = 1
    form.value.KonaklamaTipi = 'GÜNLÜK'
    form.value.OdemeTakvimGunu = null // Geçersiz süre için Ö.T.G. temizle
    return
  }
  
  // Oda tipi fiyatları yoksa önce getir
  if (!odaTipFiyatlari.value && form.value.OdaTipi) {
    try {
      const response = await api.get(`/musteri/oda-tip-fiyatlari/${encodeURIComponent(form.value.OdaTipi)}`)
      if (response.data.success && response.data.data) {
        odaTipFiyatlari.value = response.data.data
      }
    } catch (error) {
      console.error('Fiyat bilgileri alınamadı:', error)
      form.value.KonaklamaTipi = 'GÜNLÜK'
      return
    }
  }
  
  // Eğer fiyat bilgileri yoksa varsayılan
  if (!odaTipFiyatlari.value) {
    form.value.KonaklamaTipi = 'GÜNLÜK'
    return
  }
  
  // Fiyat bilgilerini al
  const gunlukFiyat = Number(odaTipFiyatlari.value.OdLfytGun) || 0
  const haftalikFiyat = Number(odaTipFiyatlari.value.OdLfytHft) || 0
  const aylikFiyat = Number(odaTipFiyatlari.value.OdLfytAyl) || 0
  
  debugLog('Fiyat analizi:', { sure, gunlukFiyat, haftalikFiyat, aylikFiyat })
  
  // Yeni formulasyon ile konaklama tipini hesapla
  let hesaplananTip = ''
  let hesaplananTutar = 0
  
  if (sure <= 7 && sure * gunlukFiyat <= haftalikFiyat) {
    hesaplananTip = 'GÜNLÜK'
    hesaplananTutar = sure * gunlukFiyat
    debugLog('Günlük seçildi:', { gunlukToplam: hesaplananTutar, haftalikFiyat })
  } else if (sure > 7 && sure <= 14 && (sure - 7) * gunlukFiyat + haftalikFiyat <= 2 * haftalikFiyat) {
    hesaplananTip = '1 HAFTALIK'
    hesaplananTutar = (sure - 7) * gunlukFiyat + haftalikFiyat
    debugLog('1 Haftalık seçildi:', { hesaplanan: hesaplananTutar, ikiHaftalik: 2 * haftalikFiyat })
  } else if (sure > 14 && sure <= 21 && (sure - 14) * gunlukFiyat + 2 * haftalikFiyat <= 3 * haftalikFiyat) {
    hesaplananTip = '2 HAFTALIK'
    hesaplananTutar = (sure - 14) * gunlukFiyat + 2 * haftalikFiyat
    debugLog('2 Haftalık seçildi:', { hesaplanan: hesaplananTutar, ucHaftalik: 3 * haftalikFiyat })
  } else if (sure > 21 && (sure - 21) * gunlukFiyat + 3 * haftalikFiyat <= aylikFiyat) {
    hesaplananTip = '3 HAFTALIK'
    hesaplananTutar = (sure - 21) * gunlukFiyat + 3 * haftalikFiyat
    debugLog('3 Haftalık seçildi:', { hesaplanan: hesaplananTutar, aylikFiyat })
  } else if (sure <= 7) {
    hesaplananTip = '1 HAFTALIK'
    hesaplananTutar = haftalikFiyat
    debugLog('1 Haftalık seçildi (6-7 gün için):', { gunlukToplam: sure * gunlukFiyat, haftalikFiyat })
  } else if (sure <= 14) {
    hesaplananTip = '2 HAFTALIK'
    hesaplananTutar = 2 * haftalikFiyat
    debugLog('2 Haftalık seçildi (backup):', { sure, hesaplanan: hesaplananTutar })
  } else if (sure <= 21) {
    hesaplananTip = '3 HAFTALIK'
    hesaplananTutar = 3 * haftalikFiyat
    debugLog('3 Haftalık seçildi (backup):', { sure, hesaplanan: hesaplananTutar })
  } else {
    hesaplananTip = 'AYLIK'
    hesaplananTutar = aylikFiyat
    debugLog('Aylık seçildi:', { sure, aylikFiyat })
  }
  
  // Aylık fiyat kontrolü - hesaplanan tutar aylık fiyatı geçerse aylık yap
  if (hesaplananTutar > aylikFiyat) {
    form.value.KonaklamaTipi = 'AYLIK'
    debugLog('Aylık fiyat sınırı aşıldı, aylık seçildi:', { hesaplananTutar, aylikFiyat })
  } else {
    form.value.KonaklamaTipi = hesaplananTip
  }
  
  // Fiyat hesapla
  void hesaplaBedel()
  
  // Ek notları güncelle
  updateEkNotlar()
}

function onToplamBedelChanged(yeniBedel: string | number | null) {
  if (typeof yeniBedel === 'number' && yeniBedel >= 0) {
    form.value.ToplamBedel = yeniBedel
  } else if (typeof yeniBedel === 'string' && !isNaN(Number(yeniBedel))) {
    form.value.ToplamBedel = Number(yeniBedel)
  } else {
    form.value.ToplamBedel = 0
  }
  
  // Ek notları güncelle
  updateEkNotlar()
}

// 🔥 Ö.T.G. Checkbox değişiklik fonksiyonu
function onOtgCheckboxChanged(isChecked: boolean) {
  debugLog('Ö.T.G. checkbox değişti:', isChecked)
  
  if (isChecked) {
    // Checkbox tıklandığında ek notlara sadece (ÖTG) ifadesi ekle
    const currentNotlar = ekNotlar.value || ''
    
    // Eğer hesaplanan bedel ile toplam bedel farklıysa
    if (form.value.HesaplananBedel !== form.value.ToplamBedel) {
      // Mevcut notlarda iskonto/artış kelimesini bul ve başına (ÖTG) ekle
      if (currentNotlar.includes('İskonto Yapıldı:')) {
        // İskonto kelimesinin başına (ÖTG) ekle
        ekNotlar.value = currentNotlar.replace('İskonto Yapıldı:', '(ÖTG) İskonto Yapıldı:')
      } else if (currentNotlar.includes('Artış Yapıldı:')) {
        // Artış kelimesinin başına (ÖTG) ekle
        ekNotlar.value = currentNotlar.replace('Artış Yapıldı:', '(ÖTG) Artış Yapıldı:')
      } else {
        // Eğer ek notlar boşsa direkt ekle
        if (currentNotlar.trim() === '') {
          if (form.value.ToplamBedel > form.value.HesaplananBedel) {
            ekNotlar.value = '(ÖTG) Artış Yapıldı: %' + Math.round(((form.value.ToplamBedel - form.value.HesaplananBedel) / form.value.HesaplananBedel) * 100)
          } else {
            ekNotlar.value = '(ÖTG) İskonto Yapıldı: %' + Math.round(((form.value.HesaplananBedel - form.value.ToplamBedel) / form.value.HesaplananBedel) * 100)
          }
        }
      }
    }
  } else {
    // Checkbox kaldırıldığında ek notlardan (ÖTG) ifadesini çıkar
    const currentNotlar = ekNotlar.value || ''
    if (currentNotlar.includes('(ÖTG)')) {
      // (ÖTG) ifadesini kaldır
      ekNotlar.value = currentNotlar
        .replace('(ÖTG) İskonto Yapıldı:', 'İskonto Yapıldı:')
        .replace('(ÖTG) Artış Yapıldı:', 'Artış Yapıldı:')
    }
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



// Oda-yatak alanını temizle ve listeyi güncelle
async function clearOdaYatakAndRefresh() {
  // Oda-yatak seçimini temizle
  form.value.OdaYatak = ''
  
  // Eğer oda tipi seçiliyse, boş odalar listesini yenile
  if (form.value.OdaTipi) {
    try {
      await loadBosOdalar(form.value.OdaTipi)
      debugLog('Oda-yatak listesi güncellendi')
    } catch (error) {
      console.error('Oda listesi güncellenirken hata:', error)
    }
  }
}

// Yükseklik eşitleme fonksiyonu
function adjustContainerHeights() {
  void nextTick(() => {
    if (anaContainerRef.value && ekBilgilerContainerRef.value && showExtraFields.value) {
      // Önce otomatik yükseklik ayarla
      ekBilgilerContainerRef.value.style.height = 'auto'
      
      // Biraz bekle ve ana container yüksekliğini al
      setTimeout(() => {
        if (anaContainerRef.value && ekBilgilerContainerRef.value) {
          const anaHeight = anaContainerRef.value.offsetHeight
          ekBilgilerContainerRef.value.style.height = `${anaHeight}px`
          debugLog('Container yükseklikleri senkronize edildi:', { anaHeight })
        }
      }, 50)
    } else if (ekBilgilerContainerRef.value && !showExtraFields.value) {
      // Ek alanlar kapalıysa yüksekliği sıfırla
      ekBilgilerContainerRef.value.style.height = 'auto'
    }
  })
}

// ResizeObserver ile dinamik yükseklik takibi
let resizeObserver: ResizeObserver | null = null

function setupResizeObserver() {
  if (typeof ResizeObserver !== 'undefined' && anaContainerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (showExtraFields.value) {
        adjustContainerHeights()
      }
    })
    resizeObserver.observe(anaContainerRef.value)
  }
}

function cleanupResizeObserver() {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
}

// Sayfa yüklendiğinde ve ek alanlar açıldığında yükseklik eşitleme
onMounted(() => {
  adjustContainerHeights()
  setupResizeObserver()
})

// Component mounted lifecycle
onMounted(async () => {
  await loadOdaTipleri();
  // Boş oda listesini önceden yüklemek yerine oda tipi seçildiğinde yükleyeceğiz
})

// Component unmount edildiğinde temizlik
onUnmounted(() => {
  cleanupResizeObserver()
  // Timer'ı da temizle
  if (timeUpdateTimer) {
    clearInterval(timeUpdateTimer)
    timeUpdateTimer = null
  }
})

// showExtraFields değişikliklerini izle
watch(showExtraFields, () => {
  adjustContainerHeights()
  if (showExtraFields.value) {
    setupResizeObserver()
  } else {
    cleanupResizeObserver()
  }
})

// Form değişikliklerini izle ve yükseklik ayarla
watch([
  () => form.value.MstrHspTip,
  () => form.value.OdaTipi,
  () => form.value.KonaklamaSuresi,
  () => notify.value
], () => {
  if (showExtraFields.value) {
    setTimeout(() => adjustContainerHeights(), 100)
  }
}, { flush: 'post' })

function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError === true;
}
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
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.12) 0%, rgba(255, 193, 7, 0.08) 100%);
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
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.12) 0%, rgba(33, 150, 243, 0.08) 100%);
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
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.12) 0%, rgba(129, 199, 132, 0.08) 100%);
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
  background: linear-gradient(135deg, rgba(156, 39, 176, 0.12) 0%, rgba(186, 104, 200, 0.08) 100%);
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

/* Dark mode support for form sections */
.body--dark .kurumsal-fields {
  border-color: #ffb74d;
  background: linear-gradient(135deg, rgba(255, 183, 77, 0.15) 0%, rgba(255, 193, 7, 0.12) 100%);
}

.body--dark .musteri-fields {
  border-color: #64b5f6;
  background: linear-gradient(135deg, rgba(100, 181, 246, 0.15) 0%, rgba(33, 150, 243, 0.12) 100%);
}

.body--dark .oda-konaklama-fields {
  border-color: #81c784;
  background: linear-gradient(135deg, rgba(129, 199, 132, 0.15) 0%, rgba(76, 175, 80, 0.12) 100%);
}

.body--dark .bedel-islemler-fields {
  border-color: #ba68c8;
  background: linear-gradient(135deg, rgba(186, 104, 200, 0.15) 0%, rgba(156, 39, 176, 0.12) 100%);
}

/* Ek notlar alanları için düzenleme */
.ek-notlar-fields {
  width: 100%;
  border: 1px solid #3f51b5;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, rgba(63, 81, 181, 0.12) 0%, rgba(92, 107, 192, 0.08) 100%);
}

.body--dark .ek-notlar-fields {
  border-color: #7986cb;
  background: linear-gradient(135deg, rgba(121, 134, 203, 0.15) 0%, rgba(63, 81, 181, 0.12) 100%);
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
  background: linear-gradient(135deg, rgba(38, 166, 154, 0.12) 0%, rgba(38, 166, 154, 0.18) 100%);
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
  background: linear-gradient(135deg, rgba(77, 182, 172, 0.15) 0%, rgba(77, 182, 172, 0.22) 100%);
  box-shadow: 0 4px 12px rgba(77, 182, 172, 0.25);
}

.body--dark .ek-bilgiler-container:hover {
  box-shadow: 0 6px 20px rgba(77, 182, 172, 0.35);
}

/* Compact button styles */
.compact-btn {
  min-width: 100px !important;
  padding: 8px 12px !important;
}

/* Ek Bilgiler Dialog Styles */
.ek-bilgiler-dialog {
  border-radius: 16px !important;
  overflow: hidden;
}

/* Depozito Container Styles */
.depozito-container {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.08) 0%, rgba(245, 124, 0, 0.05) 100%);
  border: 1px solid rgba(255, 152, 0, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  margin: 8px 0;
}

.depozito-input {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
}

/* Dark mode support for depozito container */
.body--dark .depozito-container {
  background: linear-gradient(135deg, rgba(255, 183, 77, 0.12) 0%, rgba(255, 152, 0, 0.08) 100%);
  border-color: rgba(255, 183, 77, 0.4);
}

.body--dark .depozito-input {
  background: rgba(30, 30, 30, 0.9);
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

/* Büyük font boyutu için özel sınıflar */
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

/* Konaklama alanları için yan yana düzenleme - tüm kutucuklar eşit genişlik */
.oda-konaklama-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: 100%;
}

.oda-konaklama-col {
  flex: 1;
  min-width: 0;
  max-width: calc(50% - 6px); /* Her kutucuk container'ın yarısından biraz az (gap için) */
}

/* Alt satır için özel düzenleme - konaklama süresi oda tipi ile aynı genişlik */
.oda-konaklama-row:nth-child(2) .oda-konaklama-col:nth-child(1) {
  flex: 0 0 calc(50% - 6px); /* Konaklama süresi oda tipi ile aynı genişlik */
  max-width: calc(50% - 6px);
}

.oda-konaklama-row:nth-child(2) .oda-konaklama-col:nth-child(2) {
  flex: 1; /* Konaklama tipi kalan alanı kullanır */
  max-width: none;
}

/* Ö.T.G. görünür olduğunda konaklama tipi ile eşit paylaşım */
.oda-konaklama-row:nth-child(2) .oda-konaklama-col:nth-child(3) {
  flex: 1; /* Ö.T.G. konaklama tipi ile eşit genişlik */
  max-width: none;
}

.oda-konaklama-col:last-child .konaklama-field :deep(.q-field__label) {
  font-size: 0.9rem !important;
  font-weight: 600 !important;
  color: #4caf50 !important;
}

.oda-konaklama-col:last-child .konaklama-field :deep(.q-field__control) {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.05) 100%);
  border-color: rgba(76, 175, 80, 0.3) !important;
}

/* Dark mode support for Ö.T.G. field */
.body--dark .oda-konaklama-col:last-child .konaklama-field :deep(.q-field__control) {
  background: linear-gradient(135deg, rgba(129, 199, 132, 0.12) 0%, rgba(76, 175, 80, 0.08) 100%);
  border-color: rgba(129, 199, 132, 0.4) !important;
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

/* Ek notlar alanı için büyük font */
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

/* 🔥 Ödeme vadesi alanı için özel stil */
.odeme-vadesi-field :deep(.q-field__label) {
  font-size: 0.95rem !important;
  font-weight: 500 !important;
  line-height: 1.2 !important;
}

.odeme-vadesi-field :deep(.q-field__native) {
  font-size: 0.9rem !important;
  font-weight: 500 !important;
  padding-left: 8px !important;
}

.odeme-vadesi-field :deep(.q-field__control) {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.05) 100%);
}

/* Dark mode support for ödeme vadesi field */
.body--dark .odeme-vadesi-field :deep(.q-field__control) {
  background: linear-gradient(135deg, rgba(129, 199, 132, 0.12) 0%, rgba(76, 175, 80, 0.08) 100%);
}

/* 🎯 DRAGGABLE DIALOG STİLLERİ */
.floating-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.draggable-card {
  background-color: var(--q-surface);
  color: var(--q-on-surface);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  width: 80%;
  max-width: 600px;
  position: relative;
  border: 1px solid var(--q-separator-color);
}

/* Dark mode support */
.body--dark .draggable-card {
  background-color: var(--q-dark);
  color: var(--q-dark-text);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
}

.body--dark .floating-dialog {
  background-color: rgba(0, 0, 0, 0.7);
}

/* Header başlık alanı */
.draggable-card .q-card__section--head {
  background: linear-gradient(135deg, var(--q-red) 0%, rgba(244, 67, 54, 0.8) 100%);
  color: white;
  border-radius: 8px 8px 0 0;
}

.body--dark .draggable-card .q-card__section--head {
  background: linear-gradient(135deg, var(--q-red) 0%, rgba(244, 67, 54, 0.9) 100%);
}

.cursor-move {
  cursor: move;
}

/* 🔥 LIGHT MOD ZEMİN RENGİ - BELİRGİN BUZ BEYAZI */
.light-page-background {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%) !important;
  min-height: 100vh;
}

/* Dark mode'da normal zemin rengini koru */
.body--dark .light-page-background {
  background: var(--q-dark) !important;
}

/* 🔥 Ö.T.G. Checkbox için özel stiller */
.otg-checkbox {
  margin-top: 8px;
}

.otg-checkbox :deep(.q-checkbox__label) {
  font-size: 0.9rem !important;
  font-weight: 600 !important;
  color: #4caf50 !important;
}

.otg-checkbox :deep(.q-checkbox__inner) {
  color: #4caf50 !important;
}

/* Dark mode support for Ö.T.G. checkbox */
.body--dark .otg-checkbox :deep(.q-checkbox__label) {
  color: #81c784 !important;
}

.body--dark .otg-checkbox :deep(.q-checkbox__inner) {
  color: #81c784 !important;
}

</style> 