<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col">
        <h5 class="q-my-none text-primary personel-baslik">Personel İşlemleri</h5>
        <p class="q-my-none text-caption text-grey-6">Giriş - Çıkış - Maaş</p>
      </div>
      <div class="col-auto q-mr-md">
        <q-btn
          color="orange"
          icon="account_balance_wallet"
          label="TOPLU MAAŞ TAHAKKUK"
          size="md"
          class="text-weight-bold"
          @click="onTopluMaasTahakkukClick"
        />
      </div>
      <div class="col-auto">
                 <q-btn
           color="primary"
           icon="refresh"
           label="Yenile"
           @click="() => loadPersonel()"
           :loading="loading"
         />
      </div>
    </div>


    <q-card>
      <q-card-section>
                 <q-table
           :rows="personelList"
           :columns="columns"
           row-key="PrsnTCN"
           :loading="loading"
           :pagination="{ rowsPerPage: 25 }"
           :rows-per-page-options="[10, 25, 50, 100]"
           flat
           bordered
           square
           dense
           class="personel-table"
           @row-dblclick="onRowDblClick"
           @row-contextmenu="onPersonelContextMenu"
           @request="onTableRequest"
         >
          <template v-slot:body-cell-cariBakiye="props">
            <q-td :props="props" style="border-right: 2px solid #e0e0e0;">
              <span class="text-weight-bold" :class="getBalanceClass(props.row.cariBakiye)">
                {{ formatCurrency(props.row.cariBakiye) }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-PrsnMaas="props">
            <q-td :props="props">
              <span class="text-weight-medium">
                {{ formatCurrency(props.row.PrsnMaas) }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-PrsnGrsTrh="props">
            <q-td :props="props">
              <span v-if="props.row.PrsnGrsTrh" class="giris-tarihi-text">
                {{ props.row.PrsnGrsTrh }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-PrsnCksTrh="props">
            <q-td :props="props">
              <span v-if="props.row.PrsnCksTrh" class="cikis-tarihi-text">
                {{ props.row.PrsnCksTrh }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-PrsnDurum="props">
            <q-td :props="props">
              <q-chip
                :color="props.row.PrsnDurum === 'ÇALIŞIYOR' ? 'positive' : 'negative'"
                text-color="white"
                size="xs"
                dense
              >
                {{ props.row.PrsnDurum }}
              </q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-PrsnYetki="props">
            <q-td :props="props">
              <q-chip
                color="blue"
                text-color="white"
                size="xs"
                dense
              >
                {{ props.row.PrsnYetki }}
              </q-chip>
            </q-td>
          </template>

          <template v-slot:no-data>
            <div class="full-width row flex-center q-pa-md text-grey-6">
              <q-icon name="people_outline" size="48px" class="q-mb-sm" />
              <div class="text-center">
                <div class="text-h6">Personel Bulunamadı</div>
                <div class="text-caption">Çalışan personel kaydı bulunmamaktadır.</div>
              </div>
            </div>
          </template>

          <template v-slot:loading>
            <q-inner-loading showing color="primary" />
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Personel Bilgileri Modal -->
    <q-dialog v-model="showPersonelModal" persistent>
             <q-card 
         ref="modalCard"
         style="min-width: 400px; max-width: 500px;" 
         class="personel-bilgi-modal draggable-modal"
       >
                 <q-card-section class="modal-header" style="cursor: move;">
          <div class="modal-title-section" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div class="modal-title-left">
              <span class="modal-title">Personel Bilgileri</span>
            </div>
            <div class="row items-center" style="gap:8px;">
              <span class="personel-no">No: {{ selectedPersonel.PrsnNo || '-' }}</span>
              <q-btn dense flat round icon="calculate" @click="onOpenCalculator" :title="'Hesap Makinesi'" />
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-md modal-body">
                     <div class="row q-col-gutter-md">
                          <!-- Tek Kolon -->
              <div class="col-12">
                <div class="row q-col-gutter-sm">
                                  <div class="col-12 col-sm-6">
                   <q-input
                     v-model="selectedPersonel.PrsnTCN"
                     label="TC Kimlik No *"
                     outlined
                     dense
                     :readonly="!isFormTemizlendi"
                     required
                   />
                 </div>
                                   <div class="col-12 col-sm-6">
                    <q-input
                      v-model="selectedPersonel.PrsnTelNo"
                      label="Telefon No"
                      outlined
                      dense
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="selectedPersonel.PrsnAdi"
                      label="Adı Soyadı *"
                      outlined
                      dense
                      required
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="selectedPersonel.PrsnGorev"
                      label="Görevi"
                      outlined
                      dense
                    />
                  </div>
                                   <div class="col-12 col-sm-4">
                    <q-select
                      v-model="selectedPersonel.PrsnDurum"
                      :options="durumOptions"
                      label="Durumu"
                      outlined
                      dense
                      emit-value
                      map-options
                    />
                  </div>
                                                                                                                                               <div class="col-12 col-sm-4">
                      <q-input
                        v-model="selectedPersonel.PrsnGrsTrh"
                        label="Giriş Tarihi *"
                        outlined
                        dense
                        required
                      >
                       <template v-slot:append>
                         <q-icon name="event" class="cursor-pointer">
                           <q-popup-proxy ref="girisTarihiPopup" cover transition-show="scale" transition-hide="scale">
                             <q-date
                               v-model="selectedPersonel.PrsnGrsTrh"
                               mask="DD.MM.YYYY"
                               format24h
                               @update:model-value="girisTarihiPopup.hide()"
                             />
                           </q-popup-proxy>
                         </q-icon>
                       </template>
                     </q-input>
                   </div>
                                       <div class="col-12 col-sm-4">
                      <q-input
                        v-model="selectedPersonel.PrsnCksTrh"
                        label="Çıkış Tarihi"
                        outlined
                        dense
                      >
                       <template v-slot:append>
                         <q-icon name="event" class="cursor-pointer">
                           <q-popup-proxy ref="cikisTarihiPopup" cover transition-show="scale" transition-hide="scale">
                             <q-date
                               v-model="selectedPersonel.PrsnCksTrh"
                               mask="DD.MM.YYYY"
                               format24h
                               @update:model-value="cikisTarihiPopup.hide()"
                             />
                           </q-popup-proxy>
                         </q-icon>
                       </template>
                     </q-input>
                   </div>
                                                   <div class="col-12 col-sm-4">
                    <q-input
                      v-model="selectedPersonel.PrsnYetki"
                      label="Yetki Sırası"
                      outlined
                      dense
                      type="number"
                    />
                  </div>
                                     <div class="col-12 col-sm-4">
                     <q-input
                       v-model="selectedPersonel.PrsnMaas"
                       label="Aylık Maaş"
                       outlined
                       dense
                       type="text"
                       placeholder="Boş bırakılabilir"
                     />
                   </div>
                                     <div class="col-12 col-sm-4">
                     <q-input
                       v-model.number="selectedPersonel.PrsnOdGun"
                       label="Ödeme Günü"
                       outlined
                       dense
                       type="number"
                       :min="1"
                       :max="31"
                       :step="1"
                     />
                   </div>
                                                                                                                                           <div class="col-12 col-sm-4">
                     <q-input
                       v-model="selectedPersonel.PrsnOda"
                       label="Oda No"
                       outlined
                       dense
                       type="text"
                       maxlength="3"
                       :rules="[val => /^\d{0,3}$/.test(val) || 'En fazla 3 haneli sayı giriniz']"
                     />
                   </div>
                    <div class="col-12 col-sm-4">
                     <q-input
                       v-model.number="selectedPersonel.PrsnYtk"
                       label="Yatak No"
                       outlined
                       dense
                       type="number"
                       :min="1"
                       :max="9"
                       :step="1"
                       maxlength="1"
                     />
                   </div>
                                   <div class="col-12 col-sm-4">
                    <q-input
                      v-model="selectedPersonel.PrsnYakini"
                      label="Yemek"
                      outlined
                      dense
                    />
                  </div>
                                    <div class="col-12 col-sm-4">
                     <q-input
                       v-model="selectedPersonel.PrsnDuzey"
                       label="Yetki Düzeyi"
                       outlined
                       dense
                     />
                   </div>
                                       <div class="col-12 col-sm-4">
                      <q-input
                        v-model="selectedPersonel.PrsnUsrNm"
                        label="Kullanıcı Adı"
                        outlined
                        dense
                        autocomplete="off"
                      />
                    </div>
                                                           <div class="col-12 col-sm-4">
                                               <q-input
                          v-model="selectedPersonel.PrsnPassw"
                          label="Şifre"
                          outlined
                          dense
                          :type="showPassword ? 'text' : 'password'"
                          autocomplete="new-password"
                        >
                         <template v-slot:append>
                           <q-icon
                             :name="showPassword ? 'visibility_off' : 'visibility'"
                             class="cursor-pointer"
                             @click="showPassword = !showPassword"
                           />
                         </template>
                       </q-input>
                     </div>
                  
                   <!-- Doğum Tarihi, Eğitim, Medeni Durum -->
                                                                                                                                                               <div class="col-12 col-sm-4">
                        <q-input
                          v-model="selectedPersonel.PrsnDgmTarihi"
                          label="Doğum Tarihi"
                          outlined
                          dense
                        >
                         <template v-slot:append>
                           <q-icon name="event" class="cursor-pointer">
                             <q-popup-proxy ref="dogumTarihiPopup" cover transition-show="scale" transition-hide="scale">
                               <q-date
                                 v-model="selectedPersonel.PrsnDgmTarihi"
                                 mask="DD.MM.YYYY"
                                 format24h
                                 @update:model-value="dogumTarihiPopup.hide()"
                               />
                             </q-popup-proxy>
                           </q-icon>
                         </template>
                       </q-input>
                     </div>
                      <div class="col-12 col-sm-4">
                       <q-select
                         v-model="selectedPersonel.PrsnOkul"
                         :options="egitimOptions"
                         label="Eğitim"
                         outlined
                         dense
                         emit-value
                         map-options
                       />
                     </div>
                      <div class="col-12 col-sm-4">
                       <q-select
                         v-model="selectedPersonel.PrsnMedeni"
                         :options="medeniDurumOptions"
                         label="Medeni D."
                         outlined
                         dense
                         emit-value
                         map-options
                       />
                     </div>
                   
                                       <!-- Yakın Telefon ve Adres -->
                    <div class="col-12 col-sm-6">
                      <q-input
                        v-model="selectedPersonel.PrsnYknTel"
                        label="Yakın Telefon"
                        outlined
                        dense
                      />
                    </div>
                                       <div class="col-12 col-sm-6">
                      <q-input
                        v-model="selectedPersonel.PrsnAdres"
                        label="Adres"
                        outlined
                        dense
                      />
                    </div>
                   
                                       <!-- Not -->
                    <div class="col-12">
                      <q-input
                        v-model="selectedPersonel.PrsnBilgi"
                        label="Not"
                        outlined
                        dense
                        type="textarea"
                        rows="2"
                      />
                    </div>
                </div>
              </div>
          </div>
        </q-card-section>

                 <q-card-actions align="right" class="modal-actions">
           <div class="row full-width items-center justify-between">
             <div class="col-auto">
               <q-btn
                 label="TEMİZLE"
                 color="warning"
                 @click="onTemizleClick"
                 :loading="temizleLoading"
               />
             </div>
             <div class="col-auto row q-gutter-sm">
               <q-btn
                 v-if="!isFormTemizlendi"
                 label="MAAŞ TAHAKKUK"
                 color="orange"
                 icon="account_balance_wallet"
                 @click="onSingleMaasTahakkukClick"
                 class="text-weight-bold"
               />
               <q-btn
                 v-if="!isFormTemizlendi"
                 label="DÜZENLE"
                 color="primary"
                 @click="() => executeUpdate(onDuzenleClick)"
                 :loading="duzenleLoading || isUpdating"
                 :disable="duzenleLoading || isUpdating"
               />
               <q-btn
                 v-if="isFormTemizlendi"
                 label="PERSONEL EKLE"
                 color="positive"
                 @click="() => executeAdd(onPersonelEkleClick)"
                 :loading="ekleLoading || isAdding"
                 :disable="ekleLoading || isAdding"
               />
               <q-btn
                 label="KAPAT"
                 color="secondary"
                 v-close-popup
               />
             </div>
           </div>
         </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Toplu Maaş Tahakkuk Modal -->
    <q-dialog v-model="showBulkSalaryModal" persistent>
      <q-card style="min-width: 700px; max-width: 900px;">
        <q-card-section class="bg-orange text-white q-pa-sm">
          <div class="text-h6">
            <q-icon name="account_balance_wallet" class="q-mr-sm" />
            Toplu Maaş Tahakkuk
          </div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-sm-6">
              <q-select
                v-model="selectedMonth"
                :options="monthOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                label="Ay Seçiniz *"
                outlined
                dense
                clearable
                @update:model-value="updateBulkSalaryPreview"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="selectedYear"
                :options="yearOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                label="Yıl Seçiniz *"
                outlined
                dense
                @update:model-value="updateBulkSalaryPreview"
              />
            </div>
          </div>

          <!-- Personel Listesi ve Hesaplamalar -->
          <div v-if="eligiblePersonnelList.length > 0">
            <div class="text-subtitle2 q-mb-xs">
              <q-icon name="people" size="sm" class="q-mr-xs" />
              Tahakkuk Yapılacak Personeller ({{ eligiblePersonnelList.length }})
            </div>
            
            <q-list bordered separator dense style="max-height: 350px; overflow-y: auto;">
              <q-item v-for="(item, index) in eligiblePersonnelList" :key="index" dense>
                <q-item-section avatar style="min-width: 30px;">
                  <q-icon name="person" color="primary" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2">{{ item.personel.PrsnAdi }}</q-item-label>
                  <q-item-label caption v-if="item.calculatedSalary < (item.personel.PrsnMaas || 0)">
                    Giriş: {{ item.personel.PrsnGrsTrh || '-' }} | Çıkış: {{ item.personel.PrsnCksTrh || '-' }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side style="min-width: 150px;">
                  <div class="text-right">
                    <div class="text-caption text-grey-6">Aylık: {{ formatCurrency(item.personel.PrsnMaas) }}</div>
                    <div class="text-body2 text-weight-bold" :class="item.calculatedSalary < (item.personel.PrsnMaas || 0) ? 'text-orange-9' : 'text-primary'">
                      {{ selectedMonth && selectedYear ? formatCurrency(item.calculatedSalary) : '-' }}
                    </div>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>

            <!-- Toplam Özet -->
            <div class="q-mt-md q-pa-sm bg-blue-grey-1 rounded-borders" v-if="selectedMonth && selectedYear">
              <div class="row items-center">
                <div class="col">
                  <span class="text-body2 text-weight-bold">TOPLAM TAHAKKUK:</span>
                </div>
                <div class="col-auto">
                  <span class="text-h6 text-weight-bold text-orange-9">
                    {{ formatCurrency(totalBulkSalary) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center q-pa-md text-grey-6">
            <q-icon name="info" size="md" />
            <div>Tahakkuk yapılacak personel bulunmamaktadır</div>
            <div class="text-caption">(Durum: ÇALIŞIYOR ve Maaş > 0 olmalı)</div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-sm">
          <q-btn
            label="İPTAL"
            color="secondary"
            @click="onBulkSalaryCancel"
            :disable="bulkSalaryLoading"
          />
          <q-btn
            label="TOPLU TAHAKKUK YAP"
            color="orange"
            icon="account_balance_wallet"
            @click="processBulkSalaryAccrual"
            :loading="bulkSalaryLoading"
            :disable="!selectedMonth || !selectedYear || eligiblePersonnelList.length === 0"
            class="text-weight-bold"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Tek Personel Maaş Tahakkuk Modal -->
    <q-dialog v-model="showSingleSalaryModal" persistent>
      <q-card style="min-width: 400px; max-width: 500px;">
        <q-card-section class="bg-orange text-white">
          <div class="text-h6">
            <q-icon name="account_balance_wallet" class="q-mr-sm" />
            Maaş Tahakkuk - {{ selectedPersonel.PrsnAdi }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-select
                v-model="singleSelectedMonth"
                :options="monthOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                label="Ay Seçiniz *"
                outlined
                dense
                clearable
                @update:model-value="updateSingleSalaryPreview"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="singleSelectedYear"
                :options="yearOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                label="Yıl Seçiniz *"
                outlined
                dense
                @update:model-value="updateSingleSalaryPreview"
              />
            </div>
          </div>
          <div class="q-mt-md">
            <q-banner class="bg-blue-1 text-grey-8" dense rounded>
              <template v-slot:avatar>
                <q-icon name="person" color="primary" />
              </template>
              <div>
                <strong>Personel:</strong> {{ selectedPersonel.PrsnAdi }}<br />
                <strong>Aylık Maaş:</strong> {{ formatCurrency(selectedPersonel.PrsnMaas) }}<br />
                <strong v-if="singleSelectedMonth && singleSelectedYear && previewSingleSalary > 0" class="text-orange-9">
                  Hesaplanan Tahakkuk: {{ formatCurrency(previewSingleSalary) }}
                </strong>
                <strong v-else-if="singleSelectedMonth && singleSelectedYear && previewSingleSalary === 0" class="text-grey-6">
                  Hesaplanan Tahakkuk: ₺0,00 (Bu dönemde çalışmamış)
                </strong>
              </div>
            </q-banner>
          </div>
          <div class="q-mt-md text-grey-6">
            <q-icon name="info" class="q-mr-xs" />
            <span v-if="previewSingleSalary < (selectedPersonel.PrsnMaas || 0) && singleSelectedMonth">
              Giriş/çıkış tarihine göre günlük orantılı hesaplama yapılacaktır.
            </span>
            <span v-else>
              Seçili personel için maaş tahakkuku yapılacaktır.
            </span>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            label="İPTAL"
            color="secondary"
            @click="onSingleSalaryCancel"
            :disable="singleSalaryLoading"
          />
          <q-btn
            label="TAHAKKUK YAP"
            color="orange"
            @click="processSingleSalaryAccrual"
            :loading="singleSalaryLoading"
            :disable="!singleSelectedMonth || !singleSelectedYear"
            class="text-weight-bold"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Hesap Ekstresi Modal -->
    <q-dialog v-model="showHesapEkstresiModal" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Hesap Ekstresi - {{ selectedPersonelForEkstre?.PrsnAdi || '' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <q-table
            :rows="hesapHareketleri"
            :columns="hesapEkstresiColumns"
            :loading="hesapEkstresiLoading"
            row-key="islemNo"
            flat
            bordered
            dense
            :pagination="{ rowsPerPage: 50 }"
            :rows-per-page-options="[25, 50, 100, 200]"
          >
            <template v-slot:body-cell-iKytTarihi="props">
              <q-td :props="props">
                {{ formatDate(props.value) }}
              </q-td>
            </template>
            <template v-slot:body-cell-islemTutar="props">
              <q-td :props="props" :class="getIslemTutarClass(props.row.islemTip)">
                {{ formatCurrency(props.value) }}
              </q-td>
            </template>
            <template v-slot:no-data>
              <div class="full-width row flex-center q-pa-md text-grey-6">
                <q-icon name="receipt_long" size="48px" class="q-mb-sm" />
                <div class="text-center">
                  <div class="text-h6">Hesap Hareketi Bulunamadı</div>
                  <div class="text-caption">Bu personel için hesap hareketi kaydı bulunmamaktadır.</div>
                </div>
              </div>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Sağ-click Menü -->
    <div
      v-if="ctxMenu.show"
      class="context-menu"
      ref="ctxMenuEl"
      :style="{
        position: 'fixed',
        left: ctxMenu.x + 'px',
        top: ctxMenu.y + 'px',
        zIndex: 3000,
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }"
      @click.stop
      @mousedown.stop
      @contextmenu.prevent
    >
      <q-list dense padding style="min-width: 180px;">
        <q-item clickable v-close-popup @click="onHesapEkstresiClick">
          <q-item-section>
            Hesap Ekstresi
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue';
import { Notify } from 'quasar';
import { api } from '../boot/axios';
import { useDoubleClickPrevention } from '../composables/useDoubleClickPrevention';

function onOpenCalculator() {
  window.dispatchEvent(new Event('openCalculator'))
}

interface Personel {
  PrsnNo?: number;
  PrsnTCN: string;
  PrsnAdi: string;
  PrsnDurum: string;
  PrsnTelNo: string;
  PrsnGrsTrh: string;
  PrsnCksTrh: string;
  PrsnGorev: string;
  PrsnYetki: number;
  PrsnMaas?: number | null;
  PrsnOdGun: number;
  PrsnUsrNm?: string;
  PrsnPassw?: string;
  PrsnDuzey?: string;
  PrsnOda: string;
  PrsnYtk: string;
  PrsnDgmTarihi: string;
  PrsnOkul: string;
  PrsnYakini: string;
  PrsnYknTel?: string;
  PrsnMedeni: string;
  PrsnAdres: string;
  PrsnBilgi: string;
  cariBakiye?: number;
}

interface HesapHareketi {
  iKytTarihi: string;
  islemKllnc: string;
  islemOzel1: string | null;
  islemOzel2: string | null;
  islemOzel3: string | null;
  islemArac: string;
  islemTip: string;
  islemGrup: string;
  islemBilgi: string;
  islemTutar: number;
  islemNo: number;
}

const loading = ref(false);
const duzenleLoading = ref(false);
const temizleLoading = ref(false);
const personelList = ref<Personel[]>([]);
const showPersonelModal = ref(false);
const selectedPersonel = ref<Personel>({} as Personel);
const modalCard = ref();
const showPassword = ref(false);
const isFormTemizlendi = ref(false);
const ekleLoading = ref(false);

// Çift tıklama önleme
const { isProcessing: isUpdating, executeOnce: executeUpdate } = useDoubleClickPrevention(2000);
const { isProcessing: isAdding, executeOnce: executeAdd } = useDoubleClickPrevention(2000);

// Bulk salary accrual modal states
const showBulkSalaryModal = ref(false);
const bulkSalaryLoading = ref(false);
const selectedMonth = ref<string>('');
const selectedYear = ref<number>(new Date().getFullYear());

// Toplu tahakkuk için personel listesi ve hesaplamalar
interface BulkSalaryItem {
  personel: Personel;
  calculatedSalary: number;
}
const eligiblePersonnelList = ref<BulkSalaryItem[]>([]);
const totalBulkSalary = ref<number>(0);

// Single personel salary accrual modal states
const showSingleSalaryModal = ref(false);
const singleSalaryLoading = ref(false);
const singleSelectedMonth = ref<string>('');
const singleSelectedYear = ref<number>(new Date().getFullYear());
const previewSingleSalary = ref<number>(0);

// Date picker popup referansları
const girisTarihiPopup = ref();
const cikisTarihiPopup = ref();
const dogumTarihiPopup = ref();

// Hesap Ekstresi Modal
const showHesapEkstresiModal = ref(false);
const hesapEkstresiLoading = ref(false);
const hesapHareketleri = ref<HesapHareketi[]>([]);
const selectedPersonelForEkstre = ref<Personel | null>(null);

// Sağ-click menü
const ctxMenu = ref({ show: false, x: 0, y: 0, row: null as Personel | null });
const ctxMenuEl = ref<HTMLElement | null>(null);

// Hesap Ekstresi Tablo Kolonları
const hesapEkstresiColumns = [
  {
    name: 'iKytTarihi',
    label: 'Tarih',
    field: 'iKytTarihi',
    align: 'center' as const,
    sortable: true,
    style: 'width: 120px'
  },
  {
    name: 'islemKllnc',
    label: 'Kullanıcı',
    field: 'islemKllnc',
    align: 'left' as const,
    sortable: true,
    style: 'width: 120px'
  },
  {
    name: 'islemTip',
    label: 'İşlem Tipi',
    field: 'islemTip',
    align: 'center' as const,
    sortable: true,
    style: 'width: 120px'
  },
  {
    name: 'islemGrup',
    label: 'İşlem Grubu',
    field: 'islemGrup',
    align: 'left' as const,
    sortable: true,
    style: 'width: 150px'
  },
  {
    name: 'islemArac',
    label: 'İşlem Aracı',
    field: 'islemArac',
    align: 'left' as const,
    sortable: true,
    style: 'width: 150px'
  },
  {
    name: 'islemBilgi',
    label: 'Bilgi',
    field: 'islemBilgi',
    align: 'left' as const,
    sortable: false
  },
  {
    name: 'islemTutar',
    label: 'Tutar',
    field: 'islemTutar',
    align: 'right' as const,
    sortable: true,
    style: 'width: 120px'
  }
];

const durumOptions = [
  { label: 'ÇALIŞIYOR', value: 'ÇALIŞIYOR' },
  { label: 'AYRILDI', value: 'AYRILDI' }
];

const egitimOptions = [
  { label: 'İLKOKUL', value: 'İLKOKUL' },
  { label: 'ORTAOKUL', value: 'ORTAOKUL' },
  { label: 'LİSE', value: 'LİSE' },
  { label: 'ÜNİVERSİTE', value: 'ÜNİVERSİTE' }
];

const medeniDurumOptions = [
  { label: 'EVLİ', value: 'EVLİ' },
  { label: 'BEKAR', value: 'BEKAR' },
  { label: 'NİŞANLI', value: 'NİŞANLI' },
  { label: 'BOŞANMIŞ', value: 'BOŞANMIŞ' }
];

const columns = [
  {
    name: 'cariBakiye',
    label: 'Cari Bakiye',
    field: 'cariBakiye',
    align: 'right' as const,
    sortable: false,
    style: 'width: 120px; border-right: 2px solid #e0e0e0; font-weight: bold;'
  },
  {
    name: 'PrsnTCN',
    label: 'TCN',
    field: 'PrsnTCN',
    align: 'left' as const,
    sortable: false,
    style: 'width: 120px'
  },
  {
    name: 'PrsnAdi',
    label: 'Adı Soyadı',
    field: 'PrsnAdi',
    align: 'left' as const,
    sortable: false,
    style: 'width: 200px'
  },
  {
    name: 'PrsnDurum',
    label: 'Durumu',
    field: 'PrsnDurum',
    align: 'center' as const,
    sortable: false,
    style: 'width: 100px; display: none;',
    headerStyle: 'display: none;'
  },
  {
    name: 'PrsnTelNo',
    label: 'İrtibat No',
    field: 'PrsnTelNo',
    align: 'left' as const,
    sortable: false,
    style: 'width: 120px'
  },
  {
    name: 'PrsnGrsTrh',
    label: 'Giriş T.',
    field: 'PrsnGrsTrh',
    align: 'center' as const,
    sortable: false,
    style: 'width: 100px'
  },
  {
    name: 'PrsnCksTrh',
    label: 'Çıkış T.',
    field: 'PrsnCksTrh',
    align: 'center' as const,
    sortable: false,
    style: 'max-width: 70px; display: none;',
    headerStyle: 'display: none;'
  },
  {
    name: 'PrsnGorev',
    label: 'Görevi',
    field: 'PrsnGorev',
    align: 'left' as const,
    sortable: false,
    style: 'width: 150px'
  },
  {
    name: 'PrsnYetki',
    label: 'Sıra',
    field: 'PrsnYetki',
    align: 'center' as const,
    sortable: false,
    style: 'max-width: 50px; display: none;',
    headerStyle: 'display: none;'
  },
  {
    name: 'PrsnMaas',
    label: 'Aylık Maaş',
    field: 'PrsnMaas',
    align: 'right' as const,
    sortable: false,
    style: 'width: 120px'
  },
  {
    name: 'PrsnOdGun',
    label: 'Öd.Gün',
    field: 'PrsnOdGun',
    align: 'center' as const,
    sortable: false,
    style: 'width: 80px'
  },
     {
     name: 'PrsnOda',
     label: 'Oda No',
     field: 'PrsnOda',
     align: 'center' as const,
     sortable: false,
     style: 'max-width: 50px'
   },
   {
     name: 'PrsnYtk',
     label: 'Ytk.No',
     field: 'PrsnYtk',
     align: 'center' as const,
     sortable: false,
     style: 'max-width: 50px'
   },
  {
    name: 'PrsnDgmTarihi',
    label: 'D.Tarihi',
    field: 'PrsnDgmTarihi',
    align: 'center' as const,
    sortable: false,
    style: 'width: 100px'
  },
  {
    name: 'PrsnOkul',
    label: 'Eğitim',
    field: 'PrsnOkul',
    align: 'left' as const,
    sortable: false,
    style: 'width: 150px'
  },
  {
    name: 'PrsnYakini',
    label: 'İzin Günü',
    field: 'PrsnYakini',
    align: 'center' as const,
    sortable: false,
    style: 'width: 100px'
  },
  {
    name: 'PrsnMedeni',
    label: 'Med.Drm.',
    field: 'PrsnMedeni',
    align: 'center' as const,
    sortable: false,
    style: 'max-width: 70px'
  },
  {
    name: 'PrsnAdres',
    label: 'Adres',
    field: 'PrsnAdres',
    align: 'left' as const,
    sortable: false,
    style: 'width: 200px'
  },
  {
    name: 'PrsnBilgi',
    label: 'Not',
    field: 'PrsnBilgi',
    align: 'left' as const,
    sortable: false,
    style: 'width: 150px'
  }
];

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value === 0) return '-';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(value);
};

const loadPersonel = async (sortBy?: string, sortOrder?: 'ASC' | 'DESC') => {
  try {
    loading.value = true;
    
    // Sıralama parametrelerini URL'e ekle
    const params = new URLSearchParams();
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    
    const url = `/personel/calisanlar${params.toString() ? '?' + params.toString() : ''}`;
    const response = await api.get(url);
    
    if (response.data.success) {
      personelList.value = response.data.data;
      
      // Her personel için bakiye bilgisini yükle
      await loadPersonelBakiyeleri();
      
      Notify.create({
        type: 'positive',
        message: `${personelList.value.length} personel kaydı yüklendi`,
        position: 'top'
      });
    } else {
      throw new Error(response.data.message || 'Personel verileri yüklenemedi');
    }
  } catch (error: unknown) {
    console.error('Personel yükleme hatası:', error);
    let errorMessage = 'Personel verileri yüklenirken hata oluştu';
    
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      }
    }
    
    Notify.create({
      type: 'negative',
      message: errorMessage,
      position: 'top'
    });
  } finally {
    loading.value = false;
  }
};

// Personel bakiyelerini yükle
const loadPersonelBakiyeleri = async () => {
  try {
    const bakiyePromises = personelList.value.map(async (personel) => {
      if (personel.PrsnNo) {
        try {
          const response = await api.get(`/personel/bakiye/${personel.PrsnNo}`);
          if (response.data.success) {
            personel.cariBakiye = response.data.bakiye;
          } else {
            personel.cariBakiye = 0;
          }
        } catch (error) {
          console.error(`Personel ${personel.PrsnNo} bakiye yükleme hatası:`, error);
          personel.cariBakiye = 0;
        }
      } else {
        personel.cariBakiye = 0;
      }
    });
    
    await Promise.all(bakiyePromises);
  } catch (error) {
    console.error('Bakiye yükleme hatası:', error);
  }
};

// Bakiye renk sınıfını belirle
const getBalanceClass = (balance: number | null | undefined): string => {
  if (balance === null || balance === undefined) return 'text-grey-6';
  if (balance > 0) return 'text-positive';
  if (balance < 0) return 'text-negative';
  return 'text-grey-6';
};

// Tarih formatla
const formatDate = (date: string | null | undefined): string => {
  if (!date) return '-';
  // DD.MM.YYYY formatında geliyorsa direkt döndür
  if (typeof date === 'string' && date.includes('.')) {
    return date;
  }
  // ISO formatındaysa DD.MM.YYYY'ye çevir
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return date;
  }
};

// İşlem tutarı renk sınıfını belirle
const getIslemTutarClass = (islemTip: string | null | undefined): string => {
  if (!islemTip) return '';
  // GELİR veya Çıkan ise pozitif (yeşil)
  if (islemTip === 'GELİR' || islemTip === 'Çıkan') {
    return 'text-positive text-weight-bold';
  }
  // GİDER veya Giren ise negatif (kırmızı)
  if (islemTip === 'GİDER' || islemTip === 'Giren') {
    return 'text-negative text-weight-bold';
  }
  return '';
};

// Seçilen personel bilgisini sakla (menü kapanmadan önce)
let selectedPersonelForContextMenu: Personel | null = null;

// Sağ-click menü fonksiyonları
function onPersonelContextMenu(evt: Event, row: Personel) {
  evt.preventDefault();
  const me = evt as unknown as MouseEvent;
  selectedPersonelForContextMenu = row; // Row bilgisini sakla
  ctxMenu.value = { show: true, x: me.clientX, y: me.clientY, row };
}

function closeCtx() {
  ctxMenu.value.show = false;
  ctxMenu.value.row = null;
  selectedPersonelForContextMenu = null; // Temizle
}

// Sağ-click menü için event listener'lar
function onDocumentClick(e: MouseEvent) {
  if (!ctxMenu.value.show) return;
  const el = ctxMenuEl.value;
  if (el && !el.contains(e.target as Node)) {
    closeCtx();
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && ctxMenu.value.show) {
    closeCtx();
  }
}

// Hesap Ekstresi yükleme fonksiyonu
const loadHesapHareketleri = async (personelNo: number) => {
  try {
    hesapEkstresiLoading.value = true;
    console.log('🔍 Hesap hareketleri yükleniyor, Personel No:', personelNo);
    console.log('🔍 Oluşturulacak cari kod: CP' + personelNo);
    
    const response = await api.get(`/personel/hesap-hareketleri/${personelNo}`);
    console.log('🔍 API Response:', response.data);
    
    if (response.data.success) {
      hesapHareketleri.value = response.data.data || [];
      console.log('🔍 Yüklenen hesap hareketleri:', hesapHareketleri.value);
      
      if (hesapHareketleri.value.length > 0) {
        Notify.create({
          type: 'positive',
          message: `${hesapHareketleri.value.length} hesap hareketi yüklendi`,
          position: 'top'
        });
      } else {
        Notify.create({
          type: 'info',
          message: 'Bu personel için hesap hareketi bulunamadı',
          position: 'top'
        });
      }
    } else {
      throw new Error(response.data.message || 'Hesap hareketleri yüklenemedi');
    }
  } catch (error: unknown) {
    console.error('❌ Hesap hareketleri yükleme hatası:', error);
    let errorMessage = 'Hesap hareketleri yüklenirken hata oluştu';
    
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response?: { data?: { message?: string; statusCode?: number } } };
      console.error('❌ API Error Details:', apiError.response);
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      }
    }
    
    Notify.create({
      type: 'negative',
      message: errorMessage,
      position: 'top'
    });
    
    hesapHareketleri.value = [];
  } finally {
    hesapEkstresiLoading.value = false;
  }
};

// Hesap Ekstresi butonu click handler
const onHesapEkstresiClick = async () => {
  // Önce saklanan row bilgisini kontrol et, yoksa ctxMenu'den al
  const personel = selectedPersonelForContextMenu || ctxMenu.value.row;
  
  if (!personel || !personel.PrsnNo) {
    Notify.create({
      type: 'warning',
      message: 'Personel numarası bulunamadı',
      position: 'top'
    });
    closeCtx();
    return;
  }
  
  selectedPersonelForEkstre.value = personel;
  showHesapEkstresiModal.value = true;
  closeCtx();
  
  await loadHesapHareketleri(personel.PrsnNo);
};

// Event listener'ları ekle/kaldır
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('keydown', onKeyDown);
});

// Ay seçenekleri
const monthOptions = [
  { label: 'Ocak', value: 'Ocak', month: 1 },
  { label: 'Şubat', value: 'Şubat', month: 2 },
  { label: 'Mart', value: 'Mart', month: 3 },
  { label: 'Nisan', value: 'Nisan', month: 4 },
  { label: 'Mayıs', value: 'Mayıs', month: 5 },
  { label: 'Haziran', value: 'Haziran', month: 6 },
  { label: 'Temmuz', value: 'Temmuz', month: 7 },
  { label: 'Ağustos', value: 'Ağustos', month: 8 },
  { label: 'Eylül', value: 'Eylül', month: 9 },
  { label: 'Ekim', value: 'Ekim', month: 10 },
  { label: 'Kasım', value: 'Kasım', month: 11 },
  { label: 'Aralık', value: 'Aralık', month: 12 }
];

// Yıl seçenekleri (son 2 yıl + gelecek 1 yıl)
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  return [
    { label: (currentYear - 2).toString(), value: currentYear - 2 },
    { label: (currentYear - 1).toString(), value: currentYear - 1 },
    { label: currentYear.toString(), value: currentYear },
    { label: (currentYear + 1).toString(), value: currentYear + 1 }
  ];
});

// Toplu maaş tahakkuk işlemi
const processBulkSalaryAccrual = async () => {
  if (!selectedMonth.value) {
    Notify.create({
      type: 'warning',
      message: 'Lütfen bir ay seçiniz',
      position: 'top'
    });
    return;
  }

  if (!selectedYear.value) {
    Notify.create({
      type: 'warning',
      message: 'Lütfen bir yıl seçiniz',
      position: 'top'
    });
    return;
  }

  try {
    bulkSalaryLoading.value = true;
    
    // Hesaplanmış listeden personelleri al (zaten filtrelenmiş ve hesaplanmış)
    if (eligiblePersonnelList.value.length === 0) {
      Notify.create({
        type: 'warning',
        message: 'Maaş tahakkuku yapılacak personel bulunamadı',
        position: 'top'
      });
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    const islemBilgi = `${selectedMonth.value} ${selectedYear.value} ÜCRET TAHAKKUKU`;
    
    // Her personel için tahakkuk işlemi yap
    for (const item of eligiblePersonnelList.value) {
      try {
        const requestData = {
          personel: item.personel.PrsnAdi,
          islemTipi: 'maas_tahakkuk',
          islemGrup: 'Maaş Tahakkuku',
          odemeYontemi: 'tahakkuk',
          tutar: item.calculatedSalary,
          islemBilgi: islemBilgi
        };
        
        const response = await api.post('/personel/tahakkuk-odeme', requestData);
        
        if (response.data.success) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Personel ${item.personel.PrsnAdi} tahakkuk hatası:`, response.data.message);
        }
      } catch (error) {
        errorCount++;
        console.error(`Personel ${item.personel.PrsnAdi} tahakkuk hatası:`, error);
      }
    }
    
    // Sonuç mesajı
    const message = `Toplam ${successCount} Adet Personel için MAAŞ TAHAKKUK işlemi yapılmıştır.`;
    const captionText = `Toplam Tutar: ${formatCurrency(totalBulkSalary.value)}${errorCount > 0 ? ` (${errorCount} hata)` : ''}`;
    
    Notify.create({
      type: successCount > 0 ? 'positive' : 'warning',
      message: message,
      caption: captionText,
      position: 'top',
      timeout: 5000
    });
    
    // Modalı kapat ve tabloyu güncelle
    showBulkSalaryModal.value = false;
    await loadPersonel();
    
  } catch (error) {
    console.error('Toplu maaş tahakkuk hatası:', error);
    Notify.create({
      type: 'negative',
      message: 'Toplu maaş tahakkuk işlemi sırasında hata oluştu',
      position: 'top'
    });
  } finally {
    bulkSalaryLoading.value = false;
  }
};

// Bulk modal kapat handler
const onBulkSalaryCancel = () => {
  showBulkSalaryModal.value = false;
  selectedMonth.value = '';
  selectedYear.value = new Date().getFullYear();
  eligiblePersonnelList.value = [];
  totalBulkSalary.value = 0;
};

/**
 * Günlük orantılı maaş hesaplama fonksiyonu
 * BASİT MANTIK:
 * - Giriş/çıkış tarihi tahakkuk ayında DEĞİLSE → TAM MAAŞ
 * - Giriş/çıkış tarihi tahakkuk ayında İSE → Çalışılan gün / 30 × Maaş
 * 
 * @param aylikMaas - Personelin aylık maaşı
 * @param girisTarihi - Personelin giriş tarihi (DD.MM.YYYY)
 * @param cikisTarihi - Personelin çıkış tarihi (DD.MM.YYYY veya boş)
 * @param tahakkukAy - Tahakkuk yapılacak ay (1-12)
 * @param tahakkukYil - Tahakkuk yapılacak yıl
 * @returns Hesaplanan maaş (tam sayı, ondalık yok)
 */
const calculateProRatedSalary = (
  aylikMaas: number | null | undefined,
  girisTarihi: string | null | undefined,
  cikisTarihi: string | null | undefined,
  tahakkukAy: number,
  tahakkukYil: number
): number => {
  // Maaş bilgisi yoksa veya 0 ise
  if (!aylikMaas || aylikMaas <= 0) {
    return 0;
  }
  
  // Giriş ve çıkış tarihlerini parse et
  let girisAy = 0, girisYil = 0, girisGun = 1;
  if (girisTarihi && girisTarihi.trim()) {
    const parts = girisTarihi.split('.');
    if (parts.length === 3) {
      girisGun = parseInt(parts[0]);
      girisAy = parseInt(parts[1]);
      girisYil = parseInt(parts[2]);
    }
  }
  
  let cikisAy = 0, cikisYil = 0, cikisGun = 30;
  if (cikisTarihi && cikisTarihi.trim()) {
    const parts = cikisTarihi.split('.');
    if (parts.length === 3) {
      cikisGun = parseInt(parts[0]);
      cikisAy = parseInt(parts[1]);
      cikisYil = parseInt(parts[2]);
    }
  }
  
  // Basit kontrol: Giriş veya çıkış tahakkuk ayında mı?
  const girisTahakkukAyinda = (girisAy === tahakkukAy && girisYil === tahakkukYil);
  const cikisTahakkukAyinda = (cikisAy === tahakkukAy && cikisYil === tahakkukYil);
  
  // Tam maaş durumları
  if (!girisTahakkukAyinda && !cikisTahakkukAyinda) {
    // Ne giriş ne de çıkış tahakkuk ayında → TAM MAAŞ
    console.log(`✅ Tam Maaş - Ay: ${tahakkukAy}/${tahakkukYil}, Tutar: ${aylikMaas}`);
    return aylikMaas;
  }
  
  // Orantılı hesaplama gerekli
  let calisilangGun = 30;
  
  if (girisTahakkukAyinda && cikisTahakkukAyinda) {
    // Hem giriş hem çıkış aynı ayda
    calisilangGun = cikisGun - girisGun + 1;
  } else if (girisTahakkukAyinda) {
    // Sadece giriş tahakkuk ayında (ay sonuna kadar çalıştı)
    calisilangGun = 30 - girisGun + 1;
  } else if (cikisTahakkukAyinda) {
    // Sadece çıkış tahakkuk ayında (ay başından çıkış gününe kadar)
    calisilangGun = cikisGun;
  }
  
  // Günlük orantılı maaş hesapla (ondalık küsurat yok)
  const hesaplananMaas = Math.floor((aylikMaas / 30) * calisilangGun);
  
  console.log(`✅ Orantılı Maaş - Ay: ${tahakkukAy}/${tahakkukYil}, Çalışılan: ${calisilangGun} gün, Tutar: ${hesaplananMaas}`);
  
  return hesaplananMaas;
};

// Toplu tahakkuk personel listesini günceller ve hesaplar
const updateBulkSalaryPreview = () => {
  // Uygun personelleri filtrele
  const eligible = personelList.value.filter(p => 
    p.PrsnDurum === 'ÇALIŞIYOR' && p.PrsnMaas && p.PrsnMaas > 0
  );
  
  if (!selectedMonth.value || !selectedYear.value) {
    // Ay/yıl seçilmemişse sadece listeyi göster, hesaplama yapma
    eligiblePersonnelList.value = eligible.map(p => ({
      personel: p,
      calculatedSalary: 0
    }));
    totalBulkSalary.value = 0;
    return;
  }
  
  // Ay ve yıl seçiliyse hesapla
  const tahakkukAy = monthOptions.find(m => m.label === selectedMonth.value)?.month;
  
  if (!tahakkukAy) {
    console.warn('Ay numarası bulunamadı:', selectedMonth.value);
    return;
  }
  
  const tahakkukYil = selectedYear.value;
  
  // Her personel için hesaplama yap
  eligiblePersonnelList.value = eligible.map(p => {
    const calculatedSalary = calculateProRatedSalary(
      p.PrsnMaas,
      p.PrsnGrsTrh,
      p.PrsnCksTrh,
      tahakkukAy,
      tahakkukYil
    );
    
    return {
      personel: p,
      calculatedSalary: calculatedSalary
    };
  }).filter(item => item.calculatedSalary > 0); // 0 olanları filtrele
  
  // Toplam hesapla
  totalBulkSalary.value = eligiblePersonnelList.value.reduce((sum, item) => sum + item.calculatedSalary, 0);
  
  console.log(`📊 Toplu tahakkuk önizleme:`, {
    personelSayisi: eligiblePersonnelList.value.length,
    toplam: totalBulkSalary.value
  });
};

// Toplu Maaş Tahakkuk butonu click handler
const onTopluMaasTahakkukClick = () => {
  showBulkSalaryModal.value = true;
  // Modal açıldığında listeyi hazırla
  updateBulkSalaryPreview();
};

// Tek personel maaş önizlemesini günceller
const updateSingleSalaryPreview = () => {
  if (singleSelectedMonth.value && singleSelectedYear.value) {
    const tahakkukAy = monthOptions.find(m => m.label === singleSelectedMonth.value)?.month;
    
    if (!tahakkukAy) {
      console.warn('Ay numarası bulunamadı:', singleSelectedMonth.value);
      previewSingleSalary.value = 0;
      return;
    }
    
    const tahakkukYil = singleSelectedYear.value;
    
    const hesaplanan = calculateProRatedSalary(
      selectedPersonel.value.PrsnMaas,
      selectedPersonel.value.PrsnGrsTrh,
      selectedPersonel.value.PrsnCksTrh,
      tahakkukAy,
      tahakkukYil
    );
    
    previewSingleSalary.value = hesaplanan;
    console.log('Önizleme hesaplandı:', { ay: tahakkukAy, yil: tahakkukYil, tutar: hesaplanan });
  } else {
    previewSingleSalary.value = 0;
  }
};

// Tek Personel Maaş Tahakkuk butonu click handler
const onSingleMaasTahakkukClick = () => {
  // Personel maaşı kontrolü
  if (!selectedPersonel.value.PrsnMaas || selectedPersonel.value.PrsnMaas <= 0) {
    Notify.create({
      type: 'warning',
      message: 'Bu personelin maaş bilgisi tanımlı değil',
      position: 'top'
    });
    return;
  }
  
  // Personel durumu kontrolü
  if (selectedPersonel.value.PrsnDurum !== 'ÇALIŞIYOR') {
    Notify.create({
      type: 'warning',
      message: 'Sadece çalışan personel için maaş tahakkuku yapılabilir',
      position: 'top'
    });
    return;
  }
  
  // Modal açıldığında önizleme hesapla
  showSingleSalaryModal.value = true;
  updateSingleSalaryPreview();
};

// Tek Personel Maaş Tahakkuk işlemi
const processSingleSalaryAccrual = async () => {
  if (!singleSelectedMonth.value || !singleSelectedYear.value) {
    Notify.create({
      type: 'warning',
      message: 'Lütfen ay ve yıl seçiniz',
      position: 'top'
    });
    return;
  }

  try {
    singleSalaryLoading.value = true;
    
    const islemBilgi = `${singleSelectedMonth.value} ${singleSelectedYear.value} ÜCRET TAHAKKUKU`;
    
    // Tahakkuk dönemi ay ve yıl bilgisi
    const tahakkukAy = monthOptions.find(m => m.label === singleSelectedMonth.value)?.month || 1;
    const tahakkukYil = singleSelectedYear.value;
    
    // Günlük orantılama ile maaş hesapla
    const hesaplananMaas = calculateProRatedSalary(
      selectedPersonel.value.PrsnMaas,
      selectedPersonel.value.PrsnGrsTrh,
      selectedPersonel.value.PrsnCksTrh,
      tahakkukAy,
      tahakkukYil
    );
    
    // Eğer hesaplanan maaş 0 ise uyar
    if (hesaplananMaas === 0) {
      Notify.create({
        type: 'warning',
        message: 'Personel bu dönemde çalışmamış',
        position: 'top'
      });
      singleSalaryLoading.value = false;
      return;
    }
    
    const requestData = {
      personel: selectedPersonel.value.PrsnAdi,
      islemTipi: 'maas_tahakkuk',
      islemGrup: 'Maaş Tahakkuku',
      odemeYontemi: 'tahakkuk',
      tutar: hesaplananMaas,
      islemBilgi: islemBilgi
    };
    
    const response = await api.post('/personel/tahakkuk-odeme', requestData);
    
    if (response.data.success) {
      const tamMaasMi = hesaplananMaas === selectedPersonel.value.PrsnMaas;
      Notify.create({
        type: 'positive',
        message: `${selectedPersonel.value.PrsnAdi} için maaş tahakkuku başarıyla yapıldı`,
        caption: tamMaasMi 
          ? `Tutar: ${formatCurrency(hesaplananMaas)} (Tam ay)` 
          : `Tutar: ${formatCurrency(hesaplananMaas)} (Günlük orantılı)`,
        position: 'top',
        timeout: 5000
      });
      
      // Modalı kapat ve tabloyu güncelle
      showSingleSalaryModal.value = false;
      await loadPersonel();
      
      // Personel modal'ını da kapat
      showPersonelModal.value = false;
    } else {
      throw new Error(response.data.message || 'Tahakkuk işlemi başarısız');
    }
    
  } catch (error) {
    console.error('Maaş tahakkuk hatası:', error);
    Notify.create({
      type: 'negative',
      message: 'Maaş tahakkuk işlemi sırasında hata oluştu',
      position: 'top'
    });
  } finally {
    singleSalaryLoading.value = false;
  }
};

// Tek Personel Maaş Tahakkuk modal kapat handler
const onSingleSalaryCancel = () => {
  showSingleSalaryModal.value = false;
  singleSelectedMonth.value = '';
  singleSelectedYear.value = new Date().getFullYear();
  previewSingleSalary.value = 0;
};

// Çift tık event handler
const onRowDblClick = (evt: Event, row: Personel) => {
  selectedPersonel.value = { ...row };
  showPersonelModal.value = true;
  // Modal açıldığında şifreyi gizle ve form durumunu sıfırla
  showPassword.value = false;
  isFormTemizlendi.value = false;
};

// Tarih validasyonu için yardımcı fonksiyon
const validateGirisTarihi = (girisTarihi: string): { isValid: boolean; message: string } => {
  if (!girisTarihi || girisTarihi.trim() === '') {
    return { isValid: true, message: '' }; // Boş tarih kabul edilir
  }

  // Tarih formatını kontrol et (DD.MM.YYYY)
  const tarihRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
  if (!tarihRegex.test(girisTarihi)) {
    return { isValid: false, message: 'Giriş tarihi DD.MM.YYYY formatında olmalıdır' };
  }

  const [, gun, ay, yil] = girisTarihi.match(tarihRegex)!;
  const girisDate = new Date(parseInt(yil), parseInt(ay) - 1, parseInt(gun));
  
  // Geçerli tarih kontrolü
  if (isNaN(girisDate.getTime())) {
    return { isValid: false, message: 'Geçersiz giriş tarihi' };
  }

  // Bugünün tarihi
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);

  // Giriş tarihi bugünden ileri mi?
  if (girisDate > bugun) {
    return { isValid: false, message: 'Giriş tarihi bugünden ileri olamaz' };
  }

  // Doğum tarihi varsa, giriş tarihi doğum tarihinden önce mi?
  if (selectedPersonel.value.PrsnDgmTarihi && selectedPersonel.value.PrsnDgmTarihi.trim() !== '') {
    const dogumRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    if (dogumRegex.test(selectedPersonel.value.PrsnDgmTarihi)) {
      const [, dGun, dAy, dYil] = selectedPersonel.value.PrsnDgmTarihi.match(dogumRegex)!;
      const dogumDate = new Date(parseInt(dYil), parseInt(dAy) - 1, parseInt(dGun));
      
      if (girisDate < dogumDate) {
        return { isValid: false, message: 'Giriş tarihi doğum tarihinden önce olamaz' };
      }
    }
  }

  return { isValid: true, message: '' };
};

// Çıkış tarihi validasyonu için yardımcı fonksiyon
const validateCikisTarihi = (cikisTarihi: string, girisTarihi: string): { isValid: boolean; message: string } => {
  if (!cikisTarihi || cikisTarihi.trim() === '') {
    return { isValid: true, message: '' }; // Boş tarih kabul edilir
  }

  // Tarih formatını kontrol et (DD.MM.YYYY)
  const tarihRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
  if (!tarihRegex.test(cikisTarihi)) {
    return { isValid: false, message: 'Çıkış tarihi DD.MM.YYYY formatında olmalıdır' };
  }

  const [, gun, ay, yil] = cikisTarihi.match(tarihRegex)!;
  const cikisDate = new Date(parseInt(yil), parseInt(ay) - 1, parseInt(gun));
  
  // Geçerli tarih kontrolü
  if (isNaN(cikisDate.getTime())) {
    return { isValid: false, message: 'Geçersiz çıkış tarihi' };
  }

  // Bugünün tarihi
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);

  // Çıkış tarihi bugünden ileri mi?
  if (cikisDate > bugun) {
    return { isValid: false, message: 'Çıkış tarihi bugünden ileri olamaz' };
  }

  // Giriş tarihi varsa, çıkış tarihi giriş tarihinden önce mi?
  if (girisTarihi && girisTarihi.trim() !== '') {
    const girisRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    if (girisRegex.test(girisTarihi)) {
      const [, gGun, gAy, gYil] = girisTarihi.match(girisRegex)!;
      const girisDate = new Date(parseInt(gYil), parseInt(gAy) - 1, parseInt(gGun));
      
      if (cikisDate < girisDate) {
        return { isValid: false, message: 'Çıkış tarihi giriş tarihinden önce olamaz' };
      }
    }
  }

  return { isValid: true, message: '' };
};

// Aylık maaş validasyonu için yardımcı fonksiyon
const validateAylikMaas = (maas: string | number | null | undefined): { isValid: boolean; message: string } => {
  // Boş değer kabul edilir
  if (maas === null || maas === undefined || maas === '') {
    return { isValid: true, message: '' };
  }

  // String'e çevir
  const maasStr = String(maas).trim();
  
  // Sadece sayısal karakterler ve nokta içermeli
  const sayisalRegex = /^[0-9]+(\.[0-9]+)?$/;
  if (!sayisalRegex.test(maasStr)) {
    return { isValid: false, message: 'Aylık maaş sadece sayısal değer içermelidir' };
  }

  // Sayıya çevir ve kontrol et
  const maasNumber = parseFloat(maasStr);
  if (isNaN(maasNumber)) {
    return { isValid: false, message: 'Aylık maaş geçerli bir sayı olmalıdır' };
  }

  // Negatif değer kontrolü
  if (maasNumber < 0) {
    return { isValid: false, message: 'Aylık maaş negatif olamaz' };
  }

  // Çok büyük değer kontrolü (1 milyon TL üzeri)
  if (maasNumber > 1000000) {
    return { isValid: false, message: 'Aylık maaş 1.000.000 TL üzerinde olamaz' };
  }

  return { isValid: true, message: '' };
};

// Zorunlu alan validation
const validateZorunluAlanlar = (tcNo: string | null | undefined, adi: string | null | undefined, girisTarihi: string | null | undefined): { isValid: boolean; message: string } => {
  if (!tcNo || tcNo === '' || tcNo === null || tcNo === undefined) {
    return { isValid: false, message: 'TC Kimlik No alanı zorunludur' };
  }
  
  if (!adi || adi === '' || adi === null || adi === undefined) {
    return { isValid: false, message: 'Adı Soyadı alanı zorunludur' };
  }

  if (!girisTarihi || girisTarihi === '' || girisTarihi === null || girisTarihi === undefined) {
    return { isValid: false, message: 'Giriş Tarihi alanı zorunludur' };
  }
  
  return { isValid: true, message: '' };
};

// Oda No ve Yatak No validasyonu için yardımcı fonksiyon
const validateOdaYatak = (odaNo: string | number | null | undefined, yatakNo: string | number | null | undefined): { isValid: boolean; message: string } => {
  // Her iki alan da boş olabilir (ikisi de girilmemiş)
  if ((!odaNo || odaNo === '' || odaNo === null || odaNo === undefined) && 
      (!yatakNo || yatakNo === '' || yatakNo === null || yatakNo === undefined)) {
    return { isValid: true, message: '' };
  }

  // Sadece Oda No girilmiş, Yatak No girilmemiş
  if ((odaNo && odaNo !== '' && odaNo !== null && odaNo !== undefined) && 
      (!yatakNo || yatakNo === '' || yatakNo === null || yatakNo === undefined)) {
    return { isValid: false, message: 'Oda No girildiğinde Yatak No da girilmelidir' };
  }

  // Sadece Yatak No girilmiş, Oda No girilmemiş
  if ((!odaNo || odaNo === '' || odaNo === null || odaNo === undefined) && 
      (yatakNo && yatakNo !== '' && yatakNo !== null && yatakNo !== undefined)) {
    return { isValid: false, message: 'Yatak No girildiğinde Oda No da girilmelidir' };
  }

  // Her iki alan da dolu - geçerli
  return { isValid: true, message: '' };
};

// Temizle butonu click handler
const onTemizleClick = () => {
  try {
    temizleLoading.value = true;
    
    // Seçili personel bilgilerini temizle
    selectedPersonel.value = {
      PrsnTCN: '',
      PrsnAdi: '',
      PrsnDurum: 'ÇALIŞIYOR',
      PrsnTelNo: '',
      PrsnGrsTrh: '24.08.2025', // Bugünün tarihi (zorunlu alan)
      PrsnCksTrh: '',
      PrsnGorev: '',
      PrsnYetki: 0,
      PrsnMaas: 0.00,
      PrsnOdGun: 1,
      PrsnUsrNm: '',
      PrsnPassw: '',
      PrsnDuzey: '',
      PrsnOda: '',
      PrsnYtk: '',
      PrsnDgmTarihi: '',
      PrsnOkul: '',
      PrsnYakini: '',
      PrsnYknTel: '',
      PrsnMedeni: '',
      PrsnAdres: '',
      PrsnBilgi: ''
    };
    
    // Şifreyi gizle
    showPassword.value = false;
    
    // Form temizlendi durumunu aktif et
    isFormTemizlendi.value = true;
    
    Notify.create({
      type: 'positive',
      message: 'Form temizlendi',
      position: 'top'
    });
    
  } catch (error) {
    console.error('Form temizleme hatası:', error);
    Notify.create({
      type: 'negative',
      message: 'Form temizlenirken hata oluştu',
      position: 'top'
    });
  } finally {
    temizleLoading.value = false;
  }
};

// Düzenle butonu click handler
const onDuzenleClick = async () => {
  try {
    // Zorunlu alan validasyonu
    const zorunluAlanValidation = validateZorunluAlanlar(selectedPersonel.value.PrsnTCN, selectedPersonel.value.PrsnAdi, selectedPersonel.value.PrsnGrsTrh);
    if (!zorunluAlanValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: zorunluAlanValidation.message,
        position: 'top'
      });
      return; // Güncelleme yapma, sadece uyarı ver
    }

    // Giriş tarihi validasyonu
    const girisTarihiValidation = validateGirisTarihi(selectedPersonel.value.PrsnGrsTrh);
    if (!girisTarihiValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: girisTarihiValidation.message,
        position: 'top'
      });
      return; // Güncelleme yapma, sadece uyarı ver
    }

    // Çıkış tarihi validasyonu
    const cikisTarihiValidation = validateCikisTarihi(selectedPersonel.value.PrsnCksTrh, selectedPersonel.value.PrsnGrsTrh);
    if (!cikisTarihiValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: cikisTarihiValidation.message,
        position: 'top'
      });
      return; // Güncelleme yapma, sadece uyarı ver
    }

    // Aylık maaş validasyonu
    const aylikMaasValidation = validateAylikMaas(selectedPersonel.value.PrsnMaas);
    if (!aylikMaasValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: aylikMaasValidation.message,
        position: 'top'
      });
      return; // Güncelleme yapma, sadece uyarı ver
    }

    // Oda No ve Yatak No validasyonu
    const odaYatakValidation = validateOdaYatak(selectedPersonel.value.PrsnOda, selectedPersonel.value.PrsnYtk);
    if (!odaYatakValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: odaYatakValidation.message,
        position: 'top'
      });
      return; // Güncelleme yapma, sadece uyarı ver
    }

    duzenleLoading.value = true;
    
    console.log('🔍 Personel güncelleme başlatılıyor:', selectedPersonel.value);
    
    // Backend'e güncelleme isteği gönder
    const response = await api.put('/personel/guncelle', selectedPersonel.value);
    
    if (response.data.success) {
      // Başarılı güncelleme
      Notify.create({
        type: 'positive',
        message: 'Personel bilgileri başarıyla güncellendi',
        position: 'top'
      });
      
      // Modal'ı kapat
      showPersonelModal.value = false;
      
      // Grid listeyi yenile
      await loadPersonel('PrsnYetki', 'ASC');
      
    } else {
      throw new Error(response.data.message || 'Güncelleme başarısız');
    }
    
  } catch (error: unknown) {
    console.error('Personel güncelleme hatası:', error);
    console.log('🔍 Hata türü:', typeof error);
    console.log('🔍 Hata detayı:', error);
    
    let errorMessage = 'Personel güncellenirken hata oluştu';
    
    // Axios error response kontrolü
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      console.log('🔍 API Error response:', apiError.response);
      console.log('🔍 API Error data:', apiError.response?.data);
      
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
        console.log('✅ Backend hata mesajı yakalandı:', errorMessage);
      } else {
        console.log('❌ Backend hata mesajı bulunamadı');
      }
    } 
    // Standart Error object kontrolü
    else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error as { message: string }).message;
      console.log('✅ Standart hata mesajı yakalandı:', errorMessage);
    } else {
      console.log('❌ Hiçbir hata mesajı yakalanamadı');
    }
    
    // Hata mesajını göster
    Notify.create({
      type: 'warning', // DOLU yatak için warning tipi kullan
      message: errorMessage,
      position: 'top'
    });
    
    console.log('⚠️ Kullanıcıya gösterilen hata mesajı:', errorMessage);
  } finally {
    duzenleLoading.value = false;
  }
};

// Personel Ekle butonu click handler
const onPersonelEkleClick = async () => {
  try {
    // Zorunlu alan validasyonu
    const zorunluAlanValidation = validateZorunluAlanlar(selectedPersonel.value.PrsnTCN, selectedPersonel.value.PrsnAdi, selectedPersonel.value.PrsnGrsTrh);
    if (!zorunluAlanValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: zorunluAlanValidation.message,
        position: 'top'
      });
      return; // Ekleme yapma, sadece uyarı ver
    }

    // Giriş tarihi validasyonu
    const girisTarihiValidation = validateGirisTarihi(selectedPersonel.value.PrsnGrsTrh);
    if (!girisTarihiValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: girisTarihiValidation.message,
        position: 'top'
      });
      return; // Ekleme yapma, sadece uyarı ver
    }

    // Çıkış tarihi validasyonu
    const cikisTarihiValidation = validateCikisTarihi(selectedPersonel.value.PrsnCksTrh, selectedPersonel.value.PrsnGrsTrh);
    if (!cikisTarihiValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: cikisTarihiValidation.message,
        position: 'top'
      });
      return; // Ekleme yapma, sadece uyarı ver
    }

    // Aylık maaş validasyonu
    const aylikMaasValidation = validateAylikMaas(selectedPersonel.value.PrsnMaas);
    if (!aylikMaasValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: aylikMaasValidation.message,
        position: 'top'
      });
      return; // Ekleme yapma, sadece uyarı ver
    }

    // Oda No ve Yatak No validasyonu
    const odaYatakValidation = validateOdaYatak(selectedPersonel.value.PrsnOda, selectedPersonel.value.PrsnYtk);
    if (!odaYatakValidation.isValid) {
      Notify.create({
        type: 'warning',
        message: odaYatakValidation.message,
        position: 'top'
      });
      return; // Ekleme yapma, sadece uyarı ver
    }

    ekleLoading.value = true;
    
    console.log('🔍 Personel ekleme başlatılıyor:', selectedPersonel.value);
    
    // Backend'e ekleme isteği gönder
    const response = await api.post('/personel/ekle', selectedPersonel.value);
    
    if (response.data.success) {
      // Başarılı ekleme
      Notify.create({
        type: 'positive',
        message: 'Personel başarıyla eklendi',
        position: 'top'
      });
      
      // Modal'ı kapat
      showPersonelModal.value = false;
      
      // Grid listeyi yenile
      await loadPersonel('PrsnYetki', 'ASC');
      
    } else {
      throw new Error(response.data.message || 'Ekleme başarısız');
    }
    
  } catch (error: unknown) {
    console.error('Personel ekleme hatası:', error);
    console.log('🔍 Hata türü:', typeof error);
    console.log('🔍 Hata detayı:', error);
    
    let errorMessage = 'Personel eklenirken hata oluştu';
    
    // Axios error response kontrolü
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      console.log('🔍 API Error response:', apiError.response);
      console.log('🔍 API Error data:', apiError.response?.data);
      
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
        console.log('✅ Backend hata mesajı yakalandı:', errorMessage);
      } else {
        console.log('❌ Backend hata mesajı bulunamadı');
      }
    } 
    // Standart Error object kontrolü
    else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error as { message: string }).message;
      console.log('✅ Standart hata mesajı yakalandı:', errorMessage);
    } else {
      console.log('❌ Hiçbir hata mesajı yakalanamadı');
    }
    
    // Hata mesajını göster
    Notify.create({
      type: 'warning',
      message: errorMessage,
      position: 'top'
    });
    
    console.log('⚠️ Kullanıcıya gösterilen hata mesajı:', errorMessage);
  } finally {
    ekleLoading.value = false;
  }
};

// Tablo sıralama event handler
interface TableRequestProps {
  pagination?: {
    sortBy?: string;
    descending?: boolean;
  };
}

const onTableRequest = (props: TableRequestProps) => {
  if (props.pagination && props.pagination.sortBy) {
    const sortBy = props.pagination.sortBy;
    const sortOrder = props.pagination.descending ? 'DESC' : 'ASC';
    
    console.log('🔍 Table sorting request:', { sortBy, sortOrder });
    
    // PrsnYetki sütunu için özel sıralama parametresi gönder
    if (sortBy === 'PrsnYetki') {
      console.log('✅ PrsnYetki sütunu - INT cast ile sıralama yapılacak');
      // Backend'de INT cast ile sıralama yapılacak
      void loadPersonel('PrsnYetki', sortOrder);
    } else {
      console.log('📝 Diğer sütun - normal sıralama yapılacak');
      // Diğer sütunlar için normal sıralama
      void loadPersonel(sortBy, sortOrder);
    }
  }
};

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
  document.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
  document.addEventListener('touchstart', dragStart);
  document.addEventListener('touchmove', drag);
  document.addEventListener('touchend', dragEnd);
}

// Çıkış tarihi değiştiğinde durumu otomatik güncelle
watch(() => selectedPersonel.value.PrsnCksTrh, (newCikisTarihi) => {
  if (newCikisTarihi && newCikisTarihi.trim() !== '') {
    // Çıkış tarihi doldurulduğunda durumu AYRILDI yap
    selectedPersonel.value.PrsnDurum = 'AYRILDI';
    console.log('🔍 Çıkış tarihi dolduruldu, durum AYRILDI olarak güncellendi');
  } else {
    // Çıkış tarihi boşaltıldığında durumu ÇALIŞIYOR yap
    selectedPersonel.value.PrsnDurum = 'ÇALIŞIYOR';
    console.log('🔍 Çıkış tarihi boşaltıldı, durum ÇALIŞIYOR olarak güncellendi');
  }
});

// Sayfa yüklendiğinde draggable modal özelliğini ayarla
onMounted(() => {
  // Varsayılan sıralama: PrsnYetki ASC ile veriyi yükle
  void loadPersonel('PrsnYetki', 'ASC');
  // Modal draggable özelliğini ayarla
  setupModalDraggable();
  // Sağ-click menü için event listener'ları ekle
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onKeyDown);
});
</script>

<style scoped>
.context-menu {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  backdrop-filter: blur(2px);
}

.body--dark .context-menu {
  background: #424242;
  border-color: #616161;
}

.personel-table {
  font-size: 0.875rem;
}

/* Başlık font boyutu optimizasyonu */
.personel-baslik {
  font-size: 1.25rem !important;
  font-weight: 600;
  margin-bottom: 4px;
}

/* Tablo satır yüksekliği optimizasyonu */
.personel-table .q-table tbody tr {
  height: 32px;
  min-height: 32px;
}

.personel-table .q-table__top {
  padding: 8px 16px;
}

.personel-table .q-table__bottom {
  padding: 8px 16px;
}

.personel-table .q-table th {
  font-weight: 600;
  background-color: #f5f5f5;
  padding: 6px 8px;
  height: 36px;
  line-height: 1.2;
  text-align: center !important;
}

/* Daha spesifik selector ile header merkezleme */
.personel-table .q-table__thead th {
  text-align: center !important;
}

/* Quasar table header override */
.q-table th {
  text-align: center !important;
}

.personel-table .q-table td {
  padding: 4px 8px;
  height: 32px;
  line-height: 1.2;
}

.personel-table .q-table tbody tr:hover {
  background-color: #f8f9fa;
}

/* q-chip boyut optimizasyonu */
.personel-table .q-chip {
  height: 20px;
  font-size: 0.75rem;
  padding: 0 6px;
}

/* Giriş Tarihi yazı fontu artırıldı */
.giris-tarihi-text {
  font-size: 0.8rem;
  font-weight: 500;
  color: #2e7d32;
}

/* Çıkış Tarihi zemin rengi kaldırıldı */
.cikis-tarihi-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #d32f2f;
}

/* Modal Form Stilleri */
.personel-bilgi-modal {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
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

 .modal-title-right {
   flex: 0 0 auto;
 }

 .modal-title {
   font-size: 1.1rem;
   font-weight: 600;
   text-align: center;
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
  background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
}

/* Dark mode için modal header */
body.body--dark .modal-header {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
}

body.body--dark .modal-header:hover {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
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

/* Modal body stilleri */
.modal-body {
  padding: 24px;
  background: #f8f9fa;
}

/* Dark mode için modal body */
body.body--dark .modal-body {
  background: #2c3e50;
}

/* Modal actions stilleri */
.modal-actions {
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  padding: 16px 24px;
}

/* Dark mode için modal actions */
body.body--dark .modal-actions {
  background: #34495e;
  border-top: 1px solid #495057;
}

/* Dark mode için maaş tahakkuk banner */
body.body--dark .bg-blue-1 {
  background-color: #1e3a5f !important;
}

body.body--dark .text-grey-8 {
  color: #e0e0e0 !important;
}

body.body--dark .text-orange-9 {
  color: #ffb74d !important;
}

/* Toplu tahakkuk listesi dark mode */
body.body--dark .bg-blue-grey-1 {
  background-color: #2d3748 !important;
  color: #e0e0e0 !important;
}

body.body--dark .q-list {
  background-color: #2d2d2d;
  border-color: #424242;
}

body.body--dark .q-item {
  color: #ffffff;
}

/* Responsive padding */
@media (max-width: 768px) {
  .modal-actions .q-btn + .q-btn {
    margin-left: 8px;
  }
}
  
/* Modal actions butonları arası padding */
.modal-actions .q-btn + .q-btn {
  margin-left: 12px;
}

/* Responsive padding */
@media (max-width: 768px) {
  .modal-actions .q-btn + .q-btn {
    margin-left: 8px;
  }
}

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

/* Cari Bakiye sütunu için border stilleri */
.personel-table .q-table th:first-child,
.personel-table .q-table td:first-child {
  border-right: 2px solid #e0e0e0;
}

/* Dark mode için border rengi */
body.body--dark .personel-table .q-table th:first-child,
body.body--dark .personel-table .q-table td:first-child {
  border-right: 2px solid #424242;
}
</style>
