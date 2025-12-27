<template>
  <q-page class="q-pa-md">
    <!-- Geç Saat Konaklama Ayarı -->
    <div class="row q-mb-md q-px-sm q-py-sm bg-blue-grey-9 rounded-borders">
      <div class="col-12 row items-center no-wrap" style="gap: 12px;">
        <div class="row items-center no-wrap admin-header-group admin-header-group--gec" style="gap: 6px;">
          <div class="column">
            <div class="row items-center no-wrap">
              <q-icon name="schedule" size="sm" color="blue-3" class="q-mr-xs" />
              <span class="text-h6 text-blue-3">Geç Saat Konaklama Sonu:</span>
            </div>
            <div class="text-caption text-blue-grey-3" style="font-size: 0.7rem;">
              <q-icon name="info" size="16px" class="q-mr-xs" />
              00:00 - {{ gecSaatSonu }} arası 0 gün konaklama geçerlidir
            </div>
          </div>
          
          <div class="row no-wrap items-center" style="gap: 4px;">
            <q-btn
              round
              dense
              unelevated
              size="xs"
              icon="remove"
              color="blue-3"
              text-color="blue-grey-9"
              @click="azaltSaat"
            />
            <q-input
              v-model="gecSaatFormatted"
              type="text"
              outlined
              dense
              dark
              readonly
              style="width: 85px;"
              color="blue-3"
              input-style="color: white; font-size: 1.1rem; text-align: center; font-weight: bold;"
            >
              <template v-slot:prepend>
                <q-icon name="access_time" size="sm" color="blue-3" />
              </template>
            </q-input>
            <q-btn
              round
              dense
              unelevated
              size="xs"
              icon="add"
              color="blue-3"
              text-color="blue-grey-9"
              @click="artirSaat"
            />
          </div>

          <q-btn
            color="blue-3"
            text-color="blue-grey-9"
            icon="save"
            label="KAYDET"
            size="xs"
            @click="kaydetGecSaatSonu"
            :loading="gecSaatSonuLoading"
            :disable="gecSaatSonuLoading"
          />
        </div>

        <div class="row items-center no-wrap q-gutter-x-sm admin-header-group admin-header-group--hizli">
          <div class="text-caption text-weight-bold text-blue-3 q-mr-xs" style="line-height: 1.5; text-align: center;">Hızlı Durum<br>Değişikliği:</div>
          
          <q-input
            v-model="odaNo"
            label="Oda No"
            outlined
            dense
            dark
            color="blue-3"
            label-color="blue-1"
            style="width: 90px"
            maxlength="4"
            @update:model-value="handleOdaNoInput"
          />
          
          <q-input
            v-model="yatakNo"
            label="Yatak No"
            outlined
            dense
            dark
            color="blue-3"
            label-color="blue-1"
            style="width: 80px"
            maxlength="2"
            @update:model-value="handleYatakNoInput"
          />
          
          <q-btn
            icon="close"
            flat
            round
            dense
            size="sm"
            color="red-4"
            @click="temizleOdaYatakInput"
          >
            <q-tooltip>Temizle</q-tooltip>
          </q-btn>
          
          <q-chip
            :color="durumRengi"
            text-color="white"
            class="q-ma-none text-weight-bold"
            :label="odaYatakDurum || 'DURUM'"
            square
            style="min-width: 90px; justify-content: center; height: 40px;"
          />
          
          <q-select
            v-model="yeniDurum"
            :options="availableOptions"
            label="Seçiniz"
            outlined
            dense
            dark
            options-dark
            color="blue-3"
            label-color="blue-1"
            style="width: 130px"
            :disable="!isDurumSelectEnabled"
            options-dense
          />
          
          <q-btn
            label="GÜNCELLE"
            color="blue-3"
            text-color="blue-grey-9"
            icon="save"
            size="md"
            :disable="!yeniDurum"
            :loading="durumGuncelleLoading"
            @click="guncelleOdaYatakDurum"
          />
        </div>
        
        <q-space />
        
        <!-- Sağ Taraf: IP Kısıtlama Butonu -->
        <q-btn
          color="red-7"
          text-color="white"
          icon="security"
          label="IP Kısıtlama Ayarları"
          size="md"
          @click="openIpKisitlamaModal"
          unelevated
        >
          <q-tooltip>IP kısıtlama ayarlarını yönet</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Butonlar ve Oda-Yatak Yönetimi -->
    <div class="row q-mb-md justify-between items-center">
       <!-- Sol Taraf: Gizle Butonu ve Oda-Yatak Kontrol Grubu -->
       <div class="row items-center q-gutter-x-md">
         <q-btn
           color="secondary"
           icon="visibility"
           :label="gizliKayitlarGosteriliyor ? 'KAYITLARI GİZLE' : 'GİZLENEN KAYITLARI GÖSTER'"
           size="md"
           @click="toggleGizliKayitlar"
         >
           <q-tooltip>Gizli kayıtları göster/gizle</q-tooltip>
         </q-btn>

         <q-btn
           color="green-7"
           text-color="white"
           icon="add"
           label="YENİ ODA TİPİ TANIMLA"
           size="md"
           class="q-ml-md"
           @click="openYeniOdaTipModal"
           unelevated
         />

         <q-btn
           color="blue-7"
           text-color="white"
           icon="swap_horiz"
           label="ODA TİPİ DEĞİŞTİR"
           size="md"
           class="q-ml-md"
           @click="openOdaTipDegistirModal"
           unelevated
         />

         <q-btn
           color="deep-purple-7"
           text-color="white"
           icon="meeting_room"
           label="YENİ ODA EKLE"
           size="md"
           class="q-ml-md"
           @click="openYeniOdaEkleModal"
           unelevated
         />
       </div>

       <!-- Sağ Taraf: Tablo Güncelleme Butonu -->
       <div class="text-right">
         <q-btn
           color="primary"
           icon="save"
           label="GÜNCELLE"
           size="md"
           @click="guncelleKayitlar"
           :loading="guncellemeLoading"
           :disable="guncellemeLoading"
         >
           <q-tooltip>Değiştirilen kayıtları veritabanında güncelle</q-tooltip>
         </q-btn>
       </div>
     </div>

    <!-- Grid Tablo -->
    <div class="row">
      <div class="col-12">
        <q-card>         
          <q-card-section class="q-pa-none">
                         <q-table
               :rows="odaTipLifyatRows"
               :columns="odaTipLifyatColumns"
               row-key="OdTipNo"
               :loading="loading"
               :pagination="{ rowsPerPage: 0 }"
               :rows-per-page-options="[0]"
               flat
               bordered
               dense
               compact
               class="admin-panel-table"
             >
              <!-- Özel sütun template'leri -->
              <template v-slot:body-cell-OdTipAdi="props">
                <q-td :props="props">
                                     <q-input
                     v-model="props.row.OdTipAdi"
                     dense
                     outlined
                     :readonly="true"
                     class="readonly-input compact-input"
                   />
                </q-td>
              </template>

                                             <template v-slot:body-cell-OdLfytGun="props">
                  <q-td :props="props">
                                         <q-input
                        v-model="props.row.OdLfytGun"
                        dense
                        outlined
                        type="text"
                        class="writable-input compact-input currency-input"
                        style="text-align: center;"
                        @input="formatCurrency($event, props.row, 'OdLfytGun')"
                        @blur="formatCurrencyOnBlur($event, props.row, 'OdLfytGun')"
                        @focus="formatCurrencyOnFocus($event, props.row, 'OdLfytGun')"
                      />
                  </q-td>
                </template>

                  <template v-slot:body-cell-OdLfytHft="props">
                  <q-td :props="props">
                                         <q-input
                        v-model="props.row.OdLfytHft"
                        dense
                        outlined
                        type="text"
                        class="writable-input compact-input currency-input"
                        style="text-align: center;"
                        @input="formatCurrency($event, props.row, 'OdLfytHft')"
                        @blur="formatCurrencyOnBlur($event, props.row, 'OdLfytHft')"
                        @focus="formatCurrencyOnFocus($event, props.row, 'OdLfytHft')"
                      />
                  </q-td>
                </template>

                               <template v-slot:body-cell-OdLfytAyl="props">
                  <q-td :props="props">
                                         <q-input
                        v-model="props.row.OdLfytAyl"
                        dense
                        outlined
                        type="text"
                        class="writable-input compact-input currency-input"
                        style="text-align: center;"
                        @input="formatCurrency($event, props.row, 'OdLfytAyl')"
                        @blur="formatCurrencyOnBlur($event, props.row, 'OdLfytAyl')"
                        @focus="formatCurrencyOnFocus($event, props.row, 'OdLfytAyl')"
                      />
                  </q-td>
                </template>

                               <template v-slot:body-cell-OdDpzt="props">
                  <q-td :props="props">
                                         <q-input
                        v-model="props.row.OdDpzt"
                        dense
                        outlined
                        type="text"
                        class="writable-input compact-input currency-input"
                        style="text-align: center;"
                        @input="formatCurrency($event, props.row, 'OdDpzt')"
                        @blur="formatCurrencyOnBlur($event, props.row, 'OdDpzt')"
                        @focus="formatCurrencyOnFocus($event, props.row, 'OdDpzt')"
                      />
                  </q-td>
                </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Bilgi Mesajı -->
    <div class="row q-mt-md">
      <div class="col-12">
        <q-banner
          class="bg-info text-white"
          icon="info"
        >
                 <strong>Bilgi:</strong> Sadece Günlük, Haftalık, Aylık Fiyat ve Depozito sütunları düzenlenebilir. 
            Günlük Fiyat değeri 1 olan kayıtlar varsayılan olarak gizlidir. 
            Değişiklikleri kaydetmek için "GÜNCELLE" butonuna tıklayın.
        </q-banner>
      </div>
    </div>

    <!-- IP Kısıtlama Modal -->
    <q-dialog v-model="showIpKisitlamaModal" persistent>
      <q-card 
        ref="ipModalCard"
        style="min-width: 550px; max-width: 650px;" 
        class="ip-modal-card draggable-modal"
      >
        <q-card-section class="row items-center bg-red-8 text-white q-pa-sm modal-header" style="cursor: move;">
          <q-icon name="security" size="sm" class="q-mr-xs" />
          <div class="text-subtitle1 text-weight-bold">IP Kısıtlama Ayarları</div>
          <q-space />
          <q-btn icon="close" flat round dense size="sm" v-close-popup color="white" />
        </q-card-section>

        <q-card-section class="q-pa-sm">
          <!-- IP Kısıtlama Aktif/Pasif Switch -->
          <div class="row items-center q-mb-sm q-pa-sm ip-toggle-section rounded-borders">
            <q-icon name="power_settings_new" size="sm" class="q-mr-sm ip-toggle-icon" />
            <div class="col">
              <div class="text-body2 text-weight-bold">IP Kısıtlama Sistemi</div>
              <div class="text-caption ip-toggle-text">
                {{ ipKisitlamaAktif ? 'Aktif - Sadece listedeki IP\'ler erişebilir' : 'Pasif - Tüm IP\'ler erişebilir' }}
              </div>
            </div>
            <q-toggle
              v-model="ipKisitlamaAktif"
              color="red"
              size="md"
              @update:model-value="toggleIpKisitlama"
              :loading="toggleLoading"
            />
          </div>

          <!-- Mevcut IP Adresi Gösterimi -->
          <div class="row items-center q-mb-sm q-pa-xs ip-current-section rounded-borders">
            <q-icon name="public" size="xs" class="q-mr-xs ip-current-icon" />
            <div class="text-caption">
              <strong>Dış IP (Public):</strong> {{ mevcutIpAdres || 'Yükleniyor...' }}
              <span v-if="localIpAdres && localIpAdres !== mevcutIpAdres" class="q-ml-xs text-grey-6">
                (Local: {{ localIpAdres }})
              </span>
            </div>
          </div>

          <!-- IP Listesi -->
          <div class="q-mb-sm">
            <div class="text-body2 text-weight-medium q-mb-xs">
              <q-icon name="list" size="xs" class="q-mr-xs" />
              Kayıtlı IP Adresleri ({{ ipListesi.length }}/5)
            </div>
            
            <q-list bordered separator dense v-if="ipListesi.length > 0">
              <q-item v-for="ip in ipListesi" :key="ip.IpKstNo" dense>
                <q-item-section avatar style="min-width: 30px;">
                  <q-icon name="computer" color="green-7" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2 text-weight-medium">{{ ip.IpKstAdres }}</q-item-label>
                  <q-item-label caption v-if="ip.IpKstAciklama" lines="1">
                    {{ ip.IpKstAciklama }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    icon="delete"
                    color="red-7"
                    flat
                    round
                    dense
                    size="sm"
                    @click="confirmDeleteIp(ip)"
                    :disable="deleteLoading"
                  >
                    <q-tooltip>Sil</q-tooltip>
                  </q-btn>
                </q-item-section>
              </q-item>
            </q-list>

            <div v-else class="text-center q-pa-sm text-grey-6">
              <q-icon name="info" size="sm" />
              <div class="text-caption">Kayıtlı IP adresi yok</div>
            </div>
          </div>

          <!-- Yeni IP Ekleme -->
          <q-separator class="q-my-sm" />
          <div class="q-mb-sm" v-if="ipListesi.length < 5">
            <div class="text-body2 text-weight-medium q-mb-xs">
              <q-icon name="add_circle" size="xs" class="q-mr-xs" />
              Yeni IP Ekle
            </div>
            
            <div class="row q-col-gutter-xs">
              <div class="col-12">
                <q-input
                  v-model="yeniIpAdres"
                  outlined
                  dense
                  label="Dış IP Adresi (Public)"
                  :placeholder="mevcutIpAdres || 'Örn: 123.45.67.89'"
                  :rules="[ipFormatKontrol]"
                  @keyup.enter="handleIpEnter"
                  hint="Gerçek dış IP adresinizi girin (yukarıda gösterildi)"
                >
                  <template v-slot:prepend>
                    <q-icon name="public" size="xs" />
                  </template>
                  <template v-slot:append>
                    <q-btn
                      flat
                      dense
                      size="xs"
                      icon="content_copy"
                      @click="copyCurrentIp"
                      v-if="mevcutIpAdres && mevcutIpAdres !== 'Alınamadı'"
                    >
                      <q-tooltip>Mevcut IP'yi kopyala</q-tooltip>
                    </q-btn>
                  </template>
                </q-input>
              </div>
              <div class="col-12">
                <q-input
                  v-model="yeniIpAciklama"
                  outlined
                  dense
                  label="Açıklama (Opsiyonel)"
                  placeholder="Örn: Ev internet bağlantısı"
                  @keyup.enter="handleIpEnter"
                >
                  <template v-slot:prepend>
                    <q-icon name="description" size="xs" />
                  </template>
                </q-input>
              </div>
              <div class="col-12">
                <q-btn
                  color="primary"
                  icon="add"
                  label="Ekle"
                  size="sm"
                  @click="addIpAdres"
                  :loading="addLoading"
                  :disable="!yeniIpAdres || addLoading"
                  class="full-width"
                  unelevated
                />
              </div>
            </div>
          </div>

          <!-- Maksimum IP Uyarısı -->
          <q-banner v-if="ipListesi.length >= 5" class="ip-warning-banner q-pa-xs" dense rounded>
            <template v-slot:avatar>
              <q-icon name="warning" color="orange" size="xs" />
            </template>
            <span class="text-caption">Maksimum 5 IP. Yeni eklemek için mevcut IP'yi silin.</span>
          </q-banner>

          <!-- Bilgilendirme -->
          <q-banner class="ip-info-banner q-mt-xs q-pa-xs" dense rounded>
            <template v-slot:avatar>
              <q-icon name="info" color="blue" size="xs" />
            </template>
            <div class="text-caption">
              <strong>Önemli:</strong> IP kısıtlaması aktifken sadece listedeki IP'lerden erişim sağlanır.
              <br />
              <strong>Not:</strong> SAadmin, HARUN ve KADİR kullanıcıları IP kısıtlamasından muaftır ve her zaman erişebilir.
            </div>
          </q-banner>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-xs ip-modal-actions">
          <q-btn label="Kapat" color="grey" flat size="sm" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showYeniOdaTipModal" persistent>
      <q-card
        ref="yeniOdaTipModalCard"
        style="min-width: 400px; max-width: 400px;"
        class="yeni-oda-tip-modal-card draggable-modal"
      >
        <q-card-section class="row items-center bg-green-8 text-white q-pa-sm modal-header" style="cursor: move;">
          <q-icon name="add" size="sm" class="q-mr-xs" />
          <div class="text-subtitle1 text-weight-bold">Yeni Oda Tipi Tanımla</div>
          <q-space />
          <q-btn icon="close" flat round dense size="sm" color="white" @click="closeYeniOdaTipModal" />
        </q-card-section>

        <q-card-section class="q-pa-sm">
          <div class="row items-center q-col-gutter-sm q-mb-sm">
            <div class="col-auto text-body2 text-weight-medium">OdaTipi Adı:</div>
            <div class="col">
              <q-input v-model="yeniOdaTipAdi" outlined dense />
            </div>
          </div>

          <div class="row items-center q-col-gutter-sm q-mb-sm">
            <div class="col-auto text-body2 text-weight-medium">Oda GÜNLÜK Fiyatı (TL):</div>
            <div class="col">
              <q-input
                v-model="yeniOdaTipGunluk"
                outlined
                dense
                inputmode="numeric"
                maxlength="12"
                :rules="[tamsayiRule]"
                @update:model-value="handleYeniOdaTipGunlukInput"
              />
            </div>
          </div>

          <div class="row items-center q-col-gutter-sm q-mb-sm">
            <div class="col-auto text-body2 text-weight-medium">Oda HAFTALIK Fiyatı (TL):</div>
            <div class="col">
              <q-input
                v-model="yeniOdaTipHaftalik"
                outlined
                dense
                inputmode="numeric"
                maxlength="12"
                :rules="[tamsayiRule]"
                @update:model-value="handleYeniOdaTipHaftalikInput"
              />
            </div>
          </div>

          <div class="row items-center q-col-gutter-sm q-mb-sm">
            <div class="col-auto text-body2 text-weight-medium">Oda AYLIK Fiyatı (TL):</div>
            <div class="col">
              <q-input
                v-model="yeniOdaTipAylik"
                outlined
                dense
                inputmode="numeric"
                maxlength="12"
                :rules="[tamsayiRule]"
                @update:model-value="handleYeniOdaTipAylikInput"
              />
            </div>
          </div>

          <div class="row items-center q-col-gutter-sm">
            <div class="col-auto text-body2 text-weight-medium">Oda Depozito Bedeli (GÜNLÜK):</div>
            <div class="col">
              <q-input
                v-model="yeniOdaTipDepozito"
                outlined
                dense
                inputmode="numeric"
                maxlength="12"
                :rules="[tamsayiRule]"
                @update:model-value="handleYeniOdaTipDepozitoInput"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-xs">
          <q-btn label="VAZGEÇ" color="grey" flat size="sm" @click="closeYeniOdaTipModal" />
          <q-btn
            label="KAYDET"
            color="primary"
            unelevated
            size="sm"
            :loading="yeniOdaTipKaydetLoading"
            :disable="yeniOdaTipKaydetLoading"
            @click="yeniOdaTipKaydet"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showOdaTipDegistirModal" persistent>
      <q-card
        ref="odaTipDegistirModalCard"
        style="min-width: 520px; max-width: 650px;"
        class="oda-tip-modal-card draggable-modal"
      >
        <q-card-section class="row items-center bg-blue-8 text-white q-pa-sm modal-header" style="cursor: move;">
          <q-icon name="swap_horiz" size="sm" class="q-mr-xs" />
          <div class="text-subtitle1 text-weight-bold">Oda Tipi Değiştir</div>
          <q-space />
          <q-btn icon="close" flat round dense size="sm" color="white" @click="closeOdaTipDegistirModal" />
        </q-card-section>

        <q-card-section class="q-pa-sm">
          <div class="row items-center q-col-gutter-sm q-mb-sm">
            <div class="col-auto text-body2 text-weight-medium">
              Tip değişikliği yapılacak Oda No
            </div>
            <div class="col-auto">
              <q-input
                v-model="odaTipDegistirOdaNo"
                outlined
                dense
                style="width: 80px"
                maxlength="3"
                inputmode="numeric"
                @update:model-value="handleOdaTipDegistirOdaNoInput"
                @blur="yukleOdaTipDegistirMevcutTip"
              />
            </div>
            <div class="col">
              <q-input
                outlined
                dense
                readonly
                label="Mevcut Oda Tipi"
                :model-value="odaTipDegistirMevcutTipDisplay"
              />
            </div>
          </div>

          <q-select
            v-model="odaTipDegistirSecilenTip"
            :options="odaTipDegistirOptions"
            label="Yeni Oda Tipi"
            outlined
            dense
            emit-value
            map-options
            use-input
            input-debounce="0"
            clearable
            class="q-mb-sm"
            :disable="!odaTipDegistirYeniTipEnabled"
          />

          <div v-if="odaTipDegistirOdaNo.length === 3" class="row q-col-gutter-sm">
            <div class="col-6">
              <div class="oda-tip-table-title">ESKİ ODA TİPİ BİLGİLERİ</div>
              <q-table
                :rows="odaTipDegistirOdaYatakRows"
                :columns="odaTipDegistirOdaYatakColumns"
                row-key="OdYatKod"
                dense
                flat
                bordered
                separator="cell"
                hide-pagination
                :rows-per-page-options="[0]"
                :loading="odaTipDegistirOdaYatakLoading"
                no-data-label="Kayıt bulunamadı"
                class="oda-tip-mini-table"
              >
                <template v-slot:body-cell-OdYatDurum="props">
                  <q-td :props="props" :class="{ 'cell-dolu': odaTipDegistirDurumIsDolu(props.value) }">
                    {{ props.value }}
                  </q-td>
                </template>
              </q-table>
            </div>
            <div class="col-6">
              <div class="oda-tip-table-title">YENİ ODA TİPİ BİLGİLERİ</div>
              <q-table
                :rows="odaTipDegistirYeniOdaYatakRows"
                :columns="odaTipDegistirOdaYatakColumns"
                row-key="RowId"
                dense
                flat
                bordered
                separator="cell"
                hide-pagination
                :rows-per-page-options="[0]"
                :loading="odaTipDegistirOdaYatakLoading"
                no-data-label="Kayıt bulunamadı"
                class="oda-tip-mini-table"
              >
                <template v-slot:body="props">
                  <q-tr :props="props">
                    <q-td
                      v-if="props.row?._deleteMarker"
                      :colspan="odaTipDegistirOdaYatakColumns.length"
                      class="cell-silinecek"
                    >
                      Bu kayıt silinecek!
                    </q-td>
                    <template v-else>
                      <q-td key="OdYatKod" :props="props">
                        {{ props.row.OdYatKod }}
                      </q-td>
                      <q-td key="OdYatYtkNo" :props="props">
                        {{ props.row.OdYatYtkNo }}
                      </q-td>
                      <q-td key="OdYatDurum" :props="props">
                        {{ props.row.OdYatDurum }}
                      </q-td>
                    </template>
                  </q-tr>
                </template>
              </q-table>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-xs">
          <q-btn label="VAZGEÇ" color="grey" flat size="sm" @click="closeOdaTipDegistirModal" />
          <q-btn label="DEĞİŞTİR" color="primary" unelevated size="sm" :disable="!odaTipDegistirDegistirEnabled" @click="odaTipDegistirOnayla" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showYeniOdaEkleModal" persistent>
      <q-card
        ref="yeniOdaEkleModalCard"
        style="min-width: 520px; max-width: 650px;"
        class="yeni-oda-ekle-modal-card draggable-modal"
      >
        <q-card-section class="row items-center bg-deep-purple-8 text-white q-pa-sm modal-header" style="cursor: move;">
          <q-icon name="meeting_room" size="sm" class="q-mr-xs" />
          <div class="text-subtitle1 text-weight-bold">Yeni Oda Ekle</div>
          <q-space />
          <q-btn icon="close" flat round dense size="sm" color="white" @click="closeYeniOdaEkleModal" />
        </q-card-section>

        <q-card-section class="q-pa-sm">
          <q-select
            v-model="yeniOdaEkleOdaTip"
            :options="odaTipDegistirOptions"
            label="Oda Tipi Seçimi"
            outlined
            dense
            emit-value
            map-options
            clearable
            class="q-mb-sm"
            :rules="[(v) => !!v || 'Zorunlu alan']"
          />

          <q-input
            v-model="yeniOdaEkleOdaNo"
            label="Yeni Oda No"
            outlined
            dense
            inputmode="numeric"
            maxlength="3"
            class="q-mb-sm"
            :rules="[yeniOdaNoRule]"
            @update:model-value="handleYeniOdaEkleOdaNoInput"
          />

          <q-input
            v-model="yeniOdaEkleYatakSayisi"
            label="Oda Yatak Sayısı"
            outlined
            dense
            inputmode="numeric"
            maxlength="2"
            class="q-mb-sm"
            :rules="[yeniOdaYatakSayisiRule]"
            @update:model-value="handleYeniOdaEkleYatakSayisiInput"
          />

          <q-table
            :rows="yeniOdaEkleRows"
            :columns="yeniOdaEkleColumns"
            row-key="OdYatKod"
            dense
            flat
            bordered
            separator="cell"
            hide-pagination
            :rows-per-page-options="[0]"
            no-data-label="Bilgileri giriniz"
            class="oda-tip-mini-table"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-xs">
          <q-btn label="VAZGEÇ" color="grey" flat size="sm" @click="closeYeniOdaEkleModal" />
          <q-btn
            label="KAYDET"
            color="primary"
            unelevated
            size="sm"
            :loading="yeniOdaEkleLoading"
            :disable="yeniOdaEkleLoading"
            @click="yeniOdaEkleKaydet"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { api } from '../boot/axios';

// Interface tanımları
interface OdaTipLifyatRow {
  OdTipNo: number;
  OdTipAdi: string;
  OdLfytGun: string | number;
  OdLfytHft: string | number;
  OdLfytAyl: string | number;
  OdDpzt: string | number;
  [key: string]: string | number;
}

interface ApiResponse {
  success: boolean;
  data: OdaTipLifyatRow[];
  message: string;
}

const $q = useQuasar();

// Reactive variables
const loading = ref(false);
const guncellemeLoading = ref(false);
const odaTipLifyatRows = ref<OdaTipLifyatRow[]>([]);
const gizliKayitlarGosteriliyor = ref(false);
const tumKayitlar = ref<OdaTipLifyatRow[]>([]);

const showYeniOdaTipModal = ref(false);
const yeniOdaTipModalCard = ref<{ $el: HTMLElement } | null>(null);
const yeniOdaTipAdi = ref('');
const yeniOdaTipGunluk = ref('');
const yeniOdaTipHaftalik = ref('');
const yeniOdaTipAylik = ref('');
const yeniOdaTipDepozito = ref('');
const yeniOdaTipKaydetLoading = ref(false);

const showOdaTipDegistirModal = ref(false);
const odaTipDegistirModalCard = ref<{ $el: HTMLElement } | null>(null);
const odaTipDegistirOdaNo = ref('');
const odaTipDegistirMevcutTip = ref<string | null>(null);
const odaTipDegistirLoading = ref(false);
const odaTipDegistirSecilenTip = ref<string | null>(null);
const odaTipDegistirOdaNoToTip = ref<Record<string, string>>({});
const odaTipDegistirKatPlanTipleri = ref<string[]>([]);
const odaTipDegistirOdaYatakLoading = ref(false);
const odaTipDegistirOdaYatakRows = ref<Array<{ OdYatKod: string; OdYatYtkNo: string; OdYatDurum: string }>>([]);

const showYeniOdaEkleModal = ref(false);
const yeniOdaEkleModalCard = ref<{ $el: HTMLElement } | null>(null);
const yeniOdaEkleOdaTip = ref<string | null>(null);
const yeniOdaEkleOdaNo = ref('');
const yeniOdaEkleYatakSayisi = ref('');
const yeniOdaEkleLoading = ref(false);

const odaTipDegistirOdaYatakColumns = [
  {
    name: 'OdYatKod',
    label: 'OdYatKod',
    field: 'OdYatKod',
    align: 'center' as const,
    headerStyle: 'width: 120px; text-align: center;',
    style: 'width: 120px; max-width: 120px; white-space: nowrap; text-align: center;'
  },
  {
    name: 'OdYatYtkNo',
    label: 'OdYatYtkNo',
    field: 'OdYatYtkNo',
    align: 'center' as const,
    headerStyle: 'width: 85px; text-align: center;',
    style: 'width: 85px; max-width: 85px; white-space: nowrap; text-align: center;'
  },
  {
    name: 'OdYatDurum',
    label: 'OdYatDurum',
    field: 'OdYatDurum',
    align: 'center' as const,
    headerStyle: 'width: 95px; text-align: center;',
    style: 'width: 95px; max-width: 95px; white-space: nowrap; text-align: center;'
  }
];

const yeniOdaEkleColumns = odaTipDegistirOdaYatakColumns;

const normalizeOdaTipAdiForParse = (v: unknown) => {
  if (typeof v !== 'string') return '';
  let s = v.trim().toLocaleUpperCase('tr-TR');
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return s;
};

const parseYatakSayisiFromOdaTipAdi = (odaTipAdi: unknown): number | null => {
  const s = normalizeOdaTipAdiForParse(odaTipAdi);
  if (!s) return null;
  if (s.includes('TEK')) return 1;
  const m = s.match(/(\d+)\s*KISILIK/);
  const n = m?.[1] ? Number(m[1]) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};

const odaTipDegistirYeniYatakSayisi = computed(() => {
  const base = odaTipDegistirOdaYatakRows.value.length;
  if (!odaTipDegistirSecilenTip.value) return base;
  const parsed = parseYatakSayisiFromOdaTipAdi(odaTipDegistirSecilenTip.value);
  return parsed ?? base;
});

const odaTipDegistirYeniTabloSatirSayisi = computed(() => {
  const base = odaTipDegistirOdaYatakRows.value.length;
  const yeni = odaTipDegistirYeniYatakSayisi.value;
  return Math.max(base, yeni);
});

const pad2 = (n: number) => String(n).padStart(2, '0');

const first10Digits = (v: unknown) => {
  if (typeof v !== 'string') return '';
  const d = v.replace(/\D/g, '');
  if (d.length >= 10) return d.slice(0, 10);
  const s = v.trim();
  return s.length >= 10 ? s.slice(0, 10) : s;
};

const odaTipDegistirYeniOdaYatakRows = computed(() => {
  const oldRows = odaTipDegistirOdaYatakRows.value;
  const oldCount = oldRows.length;
  const yeniCount = odaTipDegistirYeniYatakSayisi.value;
  const displayCount = odaTipDegistirYeniTabloSatirSayisi.value;
  const prefix = first10Digits(oldRows[0]?.OdYatKod);

  return Array.from({ length: displayCount }, (_, idx) => {
    const rowNo = idx + 1;

    if (rowNo <= oldCount && rowNo <= yeniCount) {
      const src = oldRows[idx] || { OdYatKod: '', OdYatYtkNo: '', OdYatDurum: '' };
      return {
        RowId: String(idx),
        _deleteMarker: false,
        OdYatKod: src.OdYatKod,
        OdYatYtkNo: src.OdYatYtkNo,
        OdYatDurum: src.OdYatDurum
      };
    }

    if (rowNo > yeniCount) {
      return {
        RowId: String(idx),
        _deleteMarker: true,
        OdYatKod: '',
        OdYatYtkNo: '',
        OdYatDurum: ''
      };
    }

    const kod = prefix ? `${prefix}${pad2(rowNo)}` : pad2(rowNo);
    return {
      RowId: String(idx),
      _deleteMarker: false,
      OdYatKod: kod,
      OdYatYtkNo: String(rowNo),
      OdYatDurum: 'BOŞ'
    };
  });
});

const normalizeOdaYatakDurum = (v: unknown) => {
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'bigint' || typeof v === 'boolean') {
    return String(v).trim().toLocaleUpperCase('tr-TR');
  }
  return '';
};

const odaTipDegistirDurumIsDolu = (v: unknown) => normalizeOdaYatakDurum(v) === 'DOLU';

const odaTipDegistirEskiTablodaDoluVar = computed(() => {
  return odaTipDegistirOdaYatakRows.value.some((r) => odaTipDegistirDurumIsDolu(r.OdYatDurum));
});

const odaTipDegistirYeniTipEnabled = computed(() => {
  if (odaTipDegistirOdaNo.value.length !== 3) return false;
  if (odaTipDegistirOdaYatakLoading.value) return false;
  return !odaTipDegistirEskiTablodaDoluVar.value;
});

const odaTipDegistirDegistirEnabled = computed(() => {
  return odaTipDegistirYeniTipEnabled.value && !!odaTipDegistirSecilenTip.value;
});

const odaTipDegistirOptions = computed(() => {
  const tipSet = new Set<string>();
  for (const row of tumKayitlar.value) {
    const t = String(row?.OdTipAdi ?? '').trim();
    if (t) tipSet.add(t);
  }
  for (const t of odaTipDegistirKatPlanTipleri.value) {
    const tt = String(t ?? '').trim();
    if (tt) tipSet.add(tt);
  }
  return Array.from(tipSet)
    .sort((a, b) => a.localeCompare(b, 'tr'))
    .map((t) => ({ label: t, value: t }));
});

const odaTipDegistirMevcutTipDisplay = computed(() => {
  if (!odaTipDegistirOdaNo.value || odaTipDegistirOdaNo.value.length < 1) return '';
  if (odaTipDegistirLoading.value) return 'Yükleniyor...';
  return odaTipDegistirMevcutTip.value?.trim() ? odaTipDegistirMevcutTip.value : 'Bulunamadı';
});

type KatPlanRoomMinimal = { odaNo: number; odaTip: string }
type KatPlanResponseMinimal = { floorToRooms?: Record<string, unknown[]> }

let yeniOdaTipDraggableAttached = false;
const yeniOdaTipDragState = {
  isDragging: false,
  currentX: 0,
  currentY: 0,
  initialX: 0,
  initialY: 0,
  xOffset: 0,
  yOffset: 0
};

const digitsOnly = (val: string | number | null) => {
  if (val === null) return '';
  return String(val).replace(/\D/g, '').slice(0, 12);
};

const tamsayiRule = (val: unknown) => {
  if (val === null || val === undefined) return true;
  if (val === '') return true;
  if (typeof val === 'number') return (Number.isInteger(val) && val >= 0) || 'Sadece tamsayı giriniz';
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return true;
    return /^\d+$/.test(s) || 'Sadece tamsayı giriniz';
  }
  return 'Sadece tamsayı giriniz';
};

const handleYeniOdaTipGunlukInput = (val: string | number | null) => {
  yeniOdaTipGunluk.value = digitsOnly(val);
};

const handleYeniOdaTipHaftalikInput = (val: string | number | null) => {
  yeniOdaTipHaftalik.value = digitsOnly(val);
};

const handleYeniOdaTipAylikInput = (val: string | number | null) => {
  yeniOdaTipAylik.value = digitsOnly(val);
};

const handleYeniOdaTipDepozitoInput = (val: string | number | null) => {
  yeniOdaTipDepozito.value = digitsOnly(val);
};

function setupYeniOdaTipModalDraggable() {
  if (yeniOdaTipDraggableAttached) return
  yeniOdaTipDraggableAttached = true

  function dragStart(e: MouseEvent | TouchEvent) {
    if (!showYeniOdaTipModal.value) return
    if (!e.target || !(e.target as HTMLElement).closest('.yeni-oda-tip-modal-card .modal-header')) return

    yeniOdaTipDragState.isDragging = true
    if (e instanceof MouseEvent) {
      yeniOdaTipDragState.initialX = e.clientX - yeniOdaTipDragState.xOffset
      yeniOdaTipDragState.initialY = e.clientY - yeniOdaTipDragState.yOffset
    } else if (e instanceof TouchEvent) {
      yeniOdaTipDragState.initialX = e.touches[0].clientX - yeniOdaTipDragState.xOffset
      yeniOdaTipDragState.initialY = e.touches[0].clientY - yeniOdaTipDragState.yOffset
    }
  }

  function drag(e: MouseEvent | TouchEvent) {
    if (!yeniOdaTipDragState.isDragging) return
    e.preventDefault()

    if (e instanceof MouseEvent) {
      yeniOdaTipDragState.currentX = e.clientX - yeniOdaTipDragState.initialX
      yeniOdaTipDragState.currentY = e.clientY - yeniOdaTipDragState.initialY
    } else if (e instanceof TouchEvent) {
      yeniOdaTipDragState.currentX = e.touches[0].clientX - yeniOdaTipDragState.initialX
      yeniOdaTipDragState.currentY = e.touches[0].clientY - yeniOdaTipDragState.initialY
    }

    yeniOdaTipDragState.xOffset = yeniOdaTipDragState.currentX
    yeniOdaTipDragState.yOffset = yeniOdaTipDragState.currentY

    if (yeniOdaTipModalCard.value?.$el) {
      yeniOdaTipModalCard.value.$el.style.transform = `translate(${yeniOdaTipDragState.currentX}px, ${yeniOdaTipDragState.currentY}px)`
    }
  }

  function dragEnd() {
    yeniOdaTipDragState.isDragging = false
  }

  document.addEventListener('mousedown', dragStart)
  document.addEventListener('mousemove', drag)
  document.addEventListener('mouseup', dragEnd)
  document.addEventListener('touchstart', dragStart)
  document.addEventListener('touchmove', drag)
  document.addEventListener('touchend', dragEnd)
}

function openYeniOdaTipModal() {
  showYeniOdaTipModal.value = true
  yeniOdaTipAdi.value = ''
  yeniOdaTipGunluk.value = ''
  yeniOdaTipHaftalik.value = ''
  yeniOdaTipAylik.value = ''
  yeniOdaTipDepozito.value = ''
  yeniOdaTipKaydetLoading.value = false

  yeniOdaTipDragState.isDragging = false
  yeniOdaTipDragState.currentX = 0
  yeniOdaTipDragState.currentY = 0
  yeniOdaTipDragState.initialX = 0
  yeniOdaTipDragState.initialY = 0
  yeniOdaTipDragState.xOffset = 0
  yeniOdaTipDragState.yOffset = 0
  if (yeniOdaTipModalCard.value?.$el) yeniOdaTipModalCard.value.$el.style.transform = ''

  setTimeout(() => {
    setupYeniOdaTipModalDraggable()
  }, 100)
}

function closeYeniOdaTipModal() {
  showYeniOdaTipModal.value = false
  yeniOdaTipAdi.value = ''
  yeniOdaTipGunluk.value = ''
  yeniOdaTipHaftalik.value = ''
  yeniOdaTipAylik.value = ''
  yeniOdaTipDepozito.value = ''
  yeniOdaTipKaydetLoading.value = false
  yeniOdaTipDragState.isDragging = false
}

async function yeniOdaTipKaydet() {
  const odaTipAdi = yeniOdaTipAdi.value.trim()
  if (!odaTipAdi) {
    $q.notify({ type: 'negative', message: 'OdaTipi Adı boş olamaz', icon: 'error' })
    return
  }

  const checkInt = (label: string, val: string) => {
    const s = String(val ?? '').trim()
    if (!s) return true
    if (/^\d+$/.test(s)) return true
    $q.notify({ type: 'negative', message: `${label} sadece tamsayı olmalı`, icon: 'error' })
    return false
  }

  if (
    !checkInt('Oda GÜNLÜK Fiyatı (TL)', yeniOdaTipGunluk.value) ||
    !checkInt('Oda HAFTALIK Fiyatı (TL)', yeniOdaTipHaftalik.value) ||
    !checkInt('Oda AYLIK Fiyatı (TL)', yeniOdaTipAylik.value) ||
    !checkInt('Oda Depozito Bedeli (GÜNLÜK)', yeniOdaTipDepozito.value)
  ) {
    return
  }

  const toNumber = (s: string) => {
    const n = Number(String(s || '').replace(/\D/g, ''))
    return Number.isFinite(n) ? n : 0
  }

  yeniOdaTipKaydetLoading.value = true
  try {
    const res = await api.post('/admin/oda-tip-lifyat-ekle', {
      OdTipAdi: odaTipAdi,
      OdLfytGun: toNumber(yeniOdaTipGunluk.value),
      OdLfytHft: toNumber(yeniOdaTipHaftalik.value),
      OdLfytAyl: toNumber(yeniOdaTipAylik.value),
      OdDpzt: toNumber(yeniOdaTipDepozito.value)
    })

    if (res.data?.success) {
      $q.notify({ type: 'positive', message: res.data?.message || 'Oda tipi başarıyla eklendi', icon: 'check_circle' })
      closeYeniOdaTipModal()
      await getOdaTipLifyatData()
      if (gizliKayitlarGosteriliyor.value) {
        odaTipLifyatRows.value = [...tumKayitlar.value]
      }
      return
    }

    $q.notify({ type: 'negative', message: res.data?.message || 'Kayıt eklenemedi', icon: 'error' })
  } catch (e) {
    console.error('Oda tipi eklenemedi:', e)
    $q.notify({ type: 'negative', message: 'Kayıt eklenemedi', icon: 'error' })
  } finally {
    yeniOdaTipKaydetLoading.value = false
  }
}

let yeniOdaEkleDraggableAttached = false;
const yeniOdaEkleDragState = {
  isDragging: false,
  currentX: 0,
  currentY: 0,
  initialX: 0,
  initialY: 0,
  xOffset: 0,
  yOffset: 0
};

function setupYeniOdaEkleModalDraggable() {
  if (yeniOdaEkleDraggableAttached) return
  yeniOdaEkleDraggableAttached = true

  function dragStart(e: MouseEvent | TouchEvent) {
    if (!showYeniOdaEkleModal.value) return
    if (!e.target || !(e.target as HTMLElement).closest('.yeni-oda-ekle-modal-card .modal-header')) return

    yeniOdaEkleDragState.isDragging = true
    if (e instanceof MouseEvent) {
      yeniOdaEkleDragState.initialX = e.clientX - yeniOdaEkleDragState.xOffset
      yeniOdaEkleDragState.initialY = e.clientY - yeniOdaEkleDragState.yOffset
    } else if (e instanceof TouchEvent) {
      yeniOdaEkleDragState.initialX = e.touches[0].clientX - yeniOdaEkleDragState.xOffset
      yeniOdaEkleDragState.initialY = e.touches[0].clientY - yeniOdaEkleDragState.yOffset
    }
  }

  function drag(e: MouseEvent | TouchEvent) {
    if (!yeniOdaEkleDragState.isDragging) return
    e.preventDefault()

    if (e instanceof MouseEvent) {
      yeniOdaEkleDragState.currentX = e.clientX - yeniOdaEkleDragState.initialX
      yeniOdaEkleDragState.currentY = e.clientY - yeniOdaEkleDragState.initialY
    } else if (e instanceof TouchEvent) {
      yeniOdaEkleDragState.currentX = e.touches[0].clientX - yeniOdaEkleDragState.initialX
      yeniOdaEkleDragState.currentY = e.touches[0].clientY - yeniOdaEkleDragState.initialY
    }

    yeniOdaEkleDragState.xOffset = yeniOdaEkleDragState.currentX
    yeniOdaEkleDragState.yOffset = yeniOdaEkleDragState.currentY

    if (yeniOdaEkleModalCard.value?.$el) {
      yeniOdaEkleModalCard.value.$el.style.transform = `translate(${yeniOdaEkleDragState.currentX}px, ${yeniOdaEkleDragState.currentY}px)`
    }
  }

  function dragEnd() {
    yeniOdaEkleDragState.isDragging = false
  }

  document.addEventListener('mousedown', dragStart)
  document.addEventListener('mousemove', drag)
  document.addEventListener('mouseup', dragEnd)
  document.addEventListener('touchstart', dragStart)
  document.addEventListener('touchmove', drag)
  document.addEventListener('touchend', dragEnd)
}

const yeniOdaNoRule = (val: unknown) => {
  const raw = typeof val === 'string' || typeof val === 'number' ? String(val) : ''
  const s = raw.replace(/\D/g, '').slice(0, 3)
  if (!s) return 'Zorunlu alan'
  if (s.length !== 3) return '3 haneli oda no giriniz'
  return true
}

const yeniOdaYatakSayisiRule = (val: unknown) => {
  const raw = typeof val === 'string' || typeof val === 'number' ? String(val) : ''
  const s = raw.replace(/\D/g, '').slice(0, 2)
  if (!s) return 'Zorunlu alan'
  const n = Number(s)
  if (!Number.isFinite(n) || n < 1 || n > 99) return '1-99 aralığında olmalı'
  return true
}

const handleYeniOdaEkleOdaNoInput = (val: string | number | null) => {
  yeniOdaEkleOdaNo.value = String(val ?? '').replace(/\D/g, '').slice(0, 3)
}

const handleYeniOdaEkleYatakSayisiInput = (val: string | number | null) => {
  yeniOdaEkleYatakSayisi.value = String(val ?? '').replace(/\D/g, '').slice(0, 2)
}

const buildYeniOdaEkleOdYatKod = (odaNoStr: string, yatakNo: number) => {
  const firstDigit = Number.parseInt(odaNoStr.charAt(0), 10)
  const blok = Number.isFinite(firstDigit) && firstDigit < 5 ? 'A' : 'B'
  const katPart = `0${odaNoStr.charAt(0)}`
  const odaPart = `0${odaNoStr}`
  const ytkPart = String(yatakNo).padStart(2, '0')
  return `MER${blok}${katPart}${odaPart}${ytkPart}`
}

const yeniOdaEkleRows = computed(() => {
  const odaNoStr = String(yeniOdaEkleOdaNo.value || '').replace(/\D/g, '').slice(0, 3)
  const yatakSayisi = Number(String(yeniOdaEkleYatakSayisi.value || '').replace(/\D/g, '').slice(0, 2))
  if (odaNoStr.length !== 3) return []
  if (!Number.isFinite(yatakSayisi) || yatakSayisi < 1 || yatakSayisi > 99) return []
  if (!yeniOdaEkleOdaTip.value) return []

  return Array.from({ length: yatakSayisi }, (_, idx) => {
    const ytkNo = idx + 1
    return {
      OdYatKod: buildYeniOdaEkleOdYatKod(odaNoStr, ytkNo),
      OdYatYtkNo: String(ytkNo),
      OdYatDurum: 'BOŞ'
    }
  })
})

function openYeniOdaEkleModal() {
  showYeniOdaEkleModal.value = true
  yeniOdaEkleOdaTip.value = null
  yeniOdaEkleOdaNo.value = ''
  yeniOdaEkleYatakSayisi.value = ''
  yeniOdaEkleLoading.value = false

  yeniOdaEkleDragState.isDragging = false
  yeniOdaEkleDragState.currentX = 0
  yeniOdaEkleDragState.currentY = 0
  yeniOdaEkleDragState.initialX = 0
  yeniOdaEkleDragState.initialY = 0
  yeniOdaEkleDragState.xOffset = 0
  yeniOdaEkleDragState.yOffset = 0
  if (yeniOdaEkleModalCard.value?.$el) yeniOdaEkleModalCard.value.$el.style.transform = ''

  setTimeout(() => {
    setupYeniOdaEkleModalDraggable()
  }, 100)
}

function closeYeniOdaEkleModal() {
  showYeniOdaEkleModal.value = false
  yeniOdaEkleOdaTip.value = null
  yeniOdaEkleOdaNo.value = ''
  yeniOdaEkleYatakSayisi.value = ''
  yeniOdaEkleLoading.value = false
  yeniOdaEkleDragState.isDragging = false
}

async function yeniOdaEkleKaydet() {
  const odaTipAdi = String(yeniOdaEkleOdaTip.value ?? '').trim()
  const odaNoStr = String(yeniOdaEkleOdaNo.value ?? '').replace(/\D/g, '').slice(0, 3)
  const yatakSayisiNum = Number(String(yeniOdaEkleYatakSayisi.value ?? '').replace(/\D/g, '').slice(0, 2))

  if (!odaTipAdi) {
    $q.notify({ type: 'negative', message: 'Oda tipi seçiniz', icon: 'error' })
    return
  }
  if (odaNoStr.length !== 3) {
    $q.notify({ type: 'negative', message: 'Yeni Oda No 3 haneli olmalıdır', icon: 'error' })
    return
  }
  if (!Number.isFinite(yatakSayisiNum) || yatakSayisiNum < 1 || yatakSayisiNum > 99) {
    $q.notify({ type: 'negative', message: 'Oda Yatak Sayısı 1-99 aralığında olmalıdır', icon: 'error' })
    return
  }

  yeniOdaEkleLoading.value = true
  try {
    const res = await api.post('/konaklama-takvim/oda-ekle', {
      odaNo: odaNoStr,
      odaTipAdi,
      odaYatakSayisi: yatakSayisiNum
    })

    if (res.data?.success) {
      $q.notify({ type: 'positive', message: res.data?.message || 'Oda başarıyla eklendi', icon: 'check_circle' })
      closeYeniOdaEkleModal()
      void yukleOdaTipDegistirKatPlan()
      return
    }

    $q.notify({ type: 'negative', message: res.data?.message || 'Oda eklenemedi', icon: 'error' })
  } catch (e) {
    console.error('Oda eklenemedi:', e)
    $q.notify({ type: 'negative', message: 'Oda eklenemedi', icon: 'error' })
  } finally {
    yeniOdaEkleLoading.value = false
  }
}

let odaTipDegistirDraggableAttached = false;
const odaTipDegistirDragState = {
  isDragging: false,
  currentX: 0,
  currentY: 0,
  initialX: 0,
  initialY: 0,
  xOffset: 0,
  yOffset: 0
};

function normalizeKatPlanRoom(it: unknown): KatPlanRoomMinimal | null {
  if (typeof it === 'object' && it !== null) {
    const obj = it as Record<string, unknown>
    const noRaw = obj.odaNo ?? obj.OdaNo
    const tipRaw = obj.odaTip ?? obj.OdaTip ?? ''
    const no = Number(typeof noRaw === 'string' || typeof noRaw === 'number' ? noRaw : '')
    const tip = typeof tipRaw === 'string' ? tipRaw : (typeof tipRaw === 'number' ? String(tipRaw) : '')
    if (isFinite(no) && no > 0) return { odaNo: no, odaTip: tip }
  }
  return null
}

async function yukleOdaTipDegistirKatPlan() {
  try {
    const { data } = await api.get('/konaklama-takvim/kat-oda-plan')
    const payload = data as KatPlanResponseMinimal

    const odaNoToTip: Record<string, string> = {}
    const tipSet = new Set<string>()

    for (const key of Object.keys(payload.floorToRooms || {})) {
      const arr = payload.floorToRooms?.[key] || []
      for (const it of arr) {
        const r = normalizeKatPlanRoom(it)
        if (!r) continue
        const tip = String(r.odaTip ?? '').trim()
        if (tip) {
          odaNoToTip[String(r.odaNo)] = tip
          tipSet.add(tip)
        }
      }
    }

    odaTipDegistirOdaNoToTip.value = odaNoToTip
    odaTipDegistirKatPlanTipleri.value = Array.from(tipSet).sort((a, b) => a.localeCompare(b, 'tr'))
  } catch (e) {
    console.error('Kat oda planı yüklenemedi:', e)
    odaTipDegistirOdaNoToTip.value = {}
    odaTipDegistirKatPlanTipleri.value = []
  }
}

function setupOdaTipDegistirModalDraggable() {
  if (odaTipDegistirDraggableAttached) return
  odaTipDegistirDraggableAttached = true

  function dragStart(e: MouseEvent | TouchEvent) {
    if (!showOdaTipDegistirModal.value) return
    if (!e.target || !(e.target as HTMLElement).closest('.oda-tip-modal-card .modal-header')) return

    odaTipDegistirDragState.isDragging = true
    if (e instanceof MouseEvent) {
      odaTipDegistirDragState.initialX = e.clientX - odaTipDegistirDragState.xOffset
      odaTipDegistirDragState.initialY = e.clientY - odaTipDegistirDragState.yOffset
    } else if (e instanceof TouchEvent) {
      odaTipDegistirDragState.initialX = e.touches[0].clientX - odaTipDegistirDragState.xOffset
      odaTipDegistirDragState.initialY = e.touches[0].clientY - odaTipDegistirDragState.yOffset
    }
  }

  function drag(e: MouseEvent | TouchEvent) {
    if (!odaTipDegistirDragState.isDragging) return
    e.preventDefault()

    if (e instanceof MouseEvent) {
      odaTipDegistirDragState.currentX = e.clientX - odaTipDegistirDragState.initialX
      odaTipDegistirDragState.currentY = e.clientY - odaTipDegistirDragState.initialY
    } else if (e instanceof TouchEvent) {
      odaTipDegistirDragState.currentX = e.touches[0].clientX - odaTipDegistirDragState.initialX
      odaTipDegistirDragState.currentY = e.touches[0].clientY - odaTipDegistirDragState.initialY
    }

    odaTipDegistirDragState.xOffset = odaTipDegistirDragState.currentX
    odaTipDegistirDragState.yOffset = odaTipDegistirDragState.currentY

    if (odaTipDegistirModalCard.value?.$el) {
      odaTipDegistirModalCard.value.$el.style.transform = `translate(${odaTipDegistirDragState.currentX}px, ${odaTipDegistirDragState.currentY}px)`
    }
  }

  function dragEnd() {
    odaTipDegistirDragState.isDragging = false
  }

  document.addEventListener('mousedown', dragStart)
  document.addEventListener('mousemove', drag)
  document.addEventListener('mouseup', dragEnd)
  document.addEventListener('touchstart', dragStart)
  document.addEventListener('touchmove', drag)
  document.addEventListener('touchend', dragEnd)
}

function openOdaTipDegistirModal() {
  showOdaTipDegistirModal.value = true
  odaTipDegistirOdaNo.value = ''
  odaTipDegistirMevcutTip.value = null
  odaTipDegistirSecilenTip.value = null
  odaTipDegistirLoading.value = false
  odaTipDegistirOdaYatakLoading.value = false
  odaTipDegistirOdaYatakRows.value = []

  odaTipDegistirDragState.isDragging = false
  odaTipDegistirDragState.currentX = 0
  odaTipDegistirDragState.currentY = 0
  odaTipDegistirDragState.initialX = 0
  odaTipDegistirDragState.initialY = 0
  odaTipDegistirDragState.xOffset = 0
  odaTipDegistirDragState.yOffset = 0
  if (odaTipDegistirModalCard.value?.$el) odaTipDegistirModalCard.value.$el.style.transform = ''

  void yukleOdaTipDegistirKatPlan()
  setTimeout(() => {
    setupOdaTipDegistirModalDraggable()
  }, 100)
}

function closeOdaTipDegistirModal() {
  showOdaTipDegistirModal.value = false
  odaTipDegistirOdaNo.value = ''
  odaTipDegistirMevcutTip.value = null
  odaTipDegistirSecilenTip.value = null
  odaTipDegistirLoading.value = false
  odaTipDegistirOdaYatakLoading.value = false
  odaTipDegistirOdaYatakRows.value = []
  odaTipDegistirDragState.isDragging = false
}

const handleOdaTipDegistirOdaNoInput = (val: string | number | null) => {
  if (val === null) return
  odaTipDegistirOdaNo.value = String(val).replace(/\D/g, '').slice(0, 3)
  odaTipDegistirSecilenTip.value = null
  if (odaTipDegistirOdaNo.value.length === 3) {
    void yukleOdaTipDegistirMevcutTip()
    void yukleOdaTipDegistirOdaYatakList()
  } else {
    odaTipDegistirMevcutTip.value = null
    odaTipDegistirOdaYatakRows.value = []
  }
}

async function yukleOdaTipDegistirMevcutTip() {
  if (odaTipDegistirOdaNo.value.length !== 3) {
    odaTipDegistirMevcutTip.value = null
    return
  }

  odaTipDegistirLoading.value = true
  try {
    const res = await api.get('/konaklama-takvim/oda-tip', {
      params: { odaNo: odaTipDegistirOdaNo.value }
    })

    if (res.data?.success) {
      const tip = typeof res.data?.odaTip === 'string' ? res.data.odaTip.trim() : ''
      odaTipDegistirMevcutTip.value = tip ? tip : null
      return
    }

    if (!Object.keys(odaTipDegistirOdaNoToTip.value).length) {
      await yukleOdaTipDegistirKatPlan()
    }
    const tip = odaTipDegistirOdaNoToTip.value[odaTipDegistirOdaNo.value]
    odaTipDegistirMevcutTip.value = tip?.trim() ? tip : null
  } catch (e) {
    console.error('Oda tipi yüklenemedi:', e)
    odaTipDegistirMevcutTip.value = null
  } finally {
    odaTipDegistirLoading.value = false
  }
}

async function yukleOdaTipDegistirOdaYatakList() {
  if (odaTipDegistirOdaNo.value.length !== 3) {
    odaTipDegistirOdaYatakRows.value = []
    return
  }

  odaTipDegistirOdaYatakLoading.value = true
  try {
    const res = await api.get('/konaklama-takvim/oda-yatak-list', {
      params: { odaNo: odaTipDegistirOdaNo.value }
    })
    if (res.data?.success && Array.isArray(res.data?.data)) {
      const safeCell = (v: unknown) => {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'bigint' || typeof v === 'boolean') {
          return String(v)
        }
        return ''
      }
      odaTipDegistirOdaYatakRows.value = res.data.data.map((r: unknown) => {
        const obj = (r && typeof r === 'object') ? (r as Record<string, unknown>) : {}
        return {
          OdYatKod: safeCell(obj.OdYatKod),
          OdYatYtkNo: safeCell(obj.OdYatYtkNo),
          OdYatDurum: safeCell(obj.OdYatDurum)
        }
      })
    } else {
      odaTipDegistirOdaYatakRows.value = []
    }
  } catch (e) {
    console.error('Oda-yatak listesi yüklenemedi:', e)
    odaTipDegistirOdaYatakRows.value = []
  } finally {
    odaTipDegistirOdaYatakLoading.value = false
  }
}

async function odaTipDegistirOnayla() {
  if (odaTipDegistirOdaNo.value.length !== 3) return
  if (!odaTipDegistirSecilenTip.value) return

  if (odaTipDegistirEskiTablodaDoluVar.value) {
    $q.notify({
      type: 'negative',
      message: 'Odada DOLU yatak varken oda tipi değiştirilemez.',
      icon: 'error'
    })
    return
  }

  const odaNoLocal = odaTipDegistirOdaNo.value
  const yeniOdaTipAdi = odaTipDegistirSecilenTip.value
  const oldRows = odaTipDegistirOdaYatakRows.value
  const oldCount = oldRows.length

  if (!oldCount) {
    $q.notify({
      type: 'negative',
      message: 'Oda için mevcut oda-yatak kaydı bulunamadı.',
      icon: 'error'
    })
    return
  }

  const yeniCount = odaTipDegistirYeniYatakSayisi.value
  const silinecekOdYatKodlar =
    yeniCount < oldCount ? oldRows.slice(yeniCount).map((r) => String(r?.OdYatKod ?? '').trim()).filter((x) => !!x) : []

  const eklenecekSatirlar =
    yeniCount > oldCount
      ? odaTipDegistirYeniOdaYatakRows.value
          .slice(oldCount, yeniCount)
          .filter((r) => !r?._deleteMarker)
          .map((r) => ({
            OdYatKod: String(r?.OdYatKod ?? '').trim(),
            OdYatYtkNo: String(r?.OdYatYtkNo ?? '').trim()
          }))
          .filter((r) => !!r.OdYatKod && !!r.OdYatYtkNo)
      : []

  odaTipDegistirOdaYatakLoading.value = true
  try {
    const res = await api.post('/konaklama-takvim/oda-tipi-degistir', {
      odaNo: odaNoLocal,
      yeniOdaTipAdi,
      silinecekOdYatKodlar,
      eklenecekSatirlar
    })

    if (res.data?.success) {
      $q.notify({
        type: 'positive',
        message: res.data?.message || 'Oda tipi başarıyla değiştirildi.',
        icon: 'check_circle'
      })
      closeOdaTipDegistirModal()
      return
    }

    $q.notify({
      type: 'negative',
      message: res.data?.message || 'Oda tipi değiştirilemedi.',
      icon: 'error'
    })
  } catch (e) {
    console.error('Oda tipi değiştirilemedi:', e)
    $q.notify({
      type: 'negative',
      message: 'Oda tipi değiştirilemedi.',
      icon: 'error'
    })
  } finally {
    odaTipDegistirOdaYatakLoading.value = false
  }
}

// Oda-Yatak Hızlı Yönetim Değişkenleri
const odaNo = ref('');
const yatakNo = ref('');
const odaYatakDurum = ref<string | null>(null);
const odaYatakBulunamadi = ref(false);
const yeniDurum = ref<string | null>(null);
const durumGuncelleLoading = ref(false);
const durumSecenekleri = ['BOŞ', 'DOLU', 'KİRLİ', 'ARIZA'];

// Oda-Yatak Durum Rengi
const durumRengi = computed(() => {
  if (odaYatakBulunamadi.value) return 'red';
  if (!odaYatakDurum.value) return 'grey';
  
  const d = odaYatakDurum.value.toUpperCase().trim();
  if (d === 'BOŞ') return 'green';
  if (['KİRLİ', 'KIRLI', 'ARIZALI', 'ARIZA', 'DOLU'].includes(d)) return 'orange';
  return 'grey';
});

// Yeni Durum Seçenekleri (Mevcut durum hariç)
const availableOptions = computed(() => {
  if (!odaYatakDurum.value) return [];
  const current = odaYatakDurum.value.toUpperCase().trim();
  // Veritabanındaki değeri UI seçeneklerine eşle
  // Örn: ARIZA -> ARIZALI
  return durumSecenekleri.filter(opt => {
    // Eşleşme kontrolü (basit string match)
    // Eğer mevcut durum 'ARIZA' ise 'ARIZALI' seçeneğini gösterme
    if (current === 'ARIZA' && opt === 'ARIZALI') return false;
    if (current === 'KIRLI' && opt === 'KİRLİ') return false;
    return opt !== current;
  });
});

const isDurumSelectEnabled = computed(() => {
  // Checkbox (Select) kontrolü: Durum etiketi yeşil veya sarı olduğunda enabled
  // Yani kayıt bulunduysa ve durum belirlendiyse
  return !!odaYatakDurum.value && !odaYatakBulunamadi.value;
});

// Oda No Input Handler
const handleOdaNoInput = (val: string | number | null) => {
   if(val === null) return;
   // Sadece rakam ve max 4 hane
   odaNo.value = String(val).replace(/\D/g, '').slice(0, 4);
   void checkOdaYatakDurum();
}

// Yatak No Input Handler
const handleYatakNoInput = (val: string | number | null) => {
   if(val === null) return;
   // Sadece rakam ve max 2 hane
   yatakNo.value = String(val).replace(/\D/g, '').slice(0, 2);
   void checkOdaYatakDurum();
}

// Durum Sorgulama
const checkOdaYatakDurum = async () => {
   yeniDurum.value = null; // Seçimi sıfırla
   
   // Her iki input da doluysa sorgula
   if (odaNo.value.length > 0 && yatakNo.value.length > 0) {
      try {
        const res = await api.get('/konaklama-takvim/oda-yatak-durum', { 
          params: { 
            odaNo: odaNo.value, 
            yatakNo: yatakNo.value 
          }
        });
        
        if (res.data.success) {
           if (res.data.exists) {
             odaYatakDurum.value = res.data.odYatDurum;
             odaYatakBulunamadi.value = false;
           } else {
             odaYatakDurum.value = 'KAYIT YOK';
             odaYatakBulunamadi.value = true;
           }
        }
      } catch (e) {
        console.error('Oda durumu sorgulama hatası:', e);
      }
   } else {
     odaYatakDurum.value = null;
     odaYatakBulunamadi.value = false;
   }
}

// Temizle Butonu
const temizleOdaYatakInput = () => {
  odaNo.value = '';
  yatakNo.value = '';
  yeniDurum.value = null;
  odaYatakDurum.value = null;
  odaYatakBulunamadi.value = false;
}

// Durum Güncelleme
const guncelleOdaYatakDurum = async () => {
  if (!yeniDurum.value || !odaNo.value || !yatakNo.value) return;
  
  durumGuncelleLoading.value = true;
  try {
     const res = await api.post('/konaklama-takvim/oda-yatak-durum', {
        odaNo: odaNo.value,
        yatakNo: yatakNo.value,
        durum: yeniDurum.value
     });
     
     if (res.data.success) {
        $q.notify({ 
          type: 'positive', 
          message: 'İşlem Başarılı: Oda-Yatak durumu güncellendi.',
          icon: 'check_circle'
        });
        // Durumu yenile
        await checkOdaYatakDurum();
     } else {
        $q.notify({ 
          type: 'negative', 
          message: res.data.message || 'Güncelleme başarısız',
          icon: 'error'
        });
     }
  } catch (e) {
     console.error('Güncelleme hatası:', e);
     $q.notify({ type: 'negative', message: 'Hata oluştu' });
  } finally {
     durumGuncelleLoading.value = false;
  }
}

const gecSaatNumara = ref(6);
const gecSaatSonuLoading = ref(false);

// Formatted gösterim (05)
const gecSaatFormatted = ref('06');

// Saat azaltma
function azaltSaat() {
  if (gecSaatNumara.value > 0) {
    gecSaatNumara.value--;
    gecSaatFormatted.value = String(gecSaatNumara.value).padStart(2, '0');
  }
}

// Saat artırma
function artirSaat() {
  if (gecSaatNumara.value < 23) {
    gecSaatNumara.value++;
    gecSaatFormatted.value = String(gecSaatNumara.value).padStart(2, '0');
  }
}

// Computed: gecSaatSonu formatı (bilgi metni için)
const gecSaatSonu = computed(() => {
  return `${String(gecSaatNumara.value).padStart(2, '0')}:00`;
});

// Tablo sütunları
const odaTipLifyatColumns = [
     {
     name: 'OdTipNo',
     label: 'Oda Tip No',
     field: 'OdTipNo',
     align: 'left' as const,
     sortable: true,
     hide: true,
     classes: 'hidden',
     headerClasses: 'hidden'
   },
  {
    name: 'OdTipAdi',
    label: 'Oda Tip Adı',
    field: 'OdTipAdi',
    align: 'left' as const,
    sortable: true,
    style: 'max-width: 200px'
  },
  {
    name: 'OdLfytGun',
    label: 'Günlük Fiyat',
    field: 'OdLfytGun',
    align: 'center' as const,
    sortable: true,
    style: 'max-width: 120px'
  },
  {
    name: 'OdLfytHft',
    label: 'Haftalık Fiyat',
    field: 'OdLfytHft',
    align: 'center' as const,
    sortable: true,
    style: 'max-width: 120px'
  },
  {
    name: 'OdLfytAyl',
    label: 'Aylık Fiyat',
    field: 'OdLfytAyl',
    align: 'center' as const,
    sortable: true,
    style: 'max-width: 120px'
  },
  {
    name: 'OdDpzt',
    label: 'Depozito (Günlük)',
    field: 'OdDpzt',
    align: 'center' as const,
    sortable: true,
    style: 'max-width: 140px'
  }
];

// Sayfa yüklendiğinde verileri getir
onMounted(async () => {
  await getOdaTipLifyatData();
  await yukleGecSaatSonu();
});

// Gizli kayıtları göster/gizle
function toggleGizliKayitlar() {
  gizliKayitlarGosteriliyor.value = !gizliKayitlarGosteriliyor.value;
  
  if (gizliKayitlarGosteriliyor.value) {
    // Tüm kayıtları göster
    odaTipLifyatRows.value = [...tumKayitlar.value];
     } else {
           // Günlük fiyat 1 olanları gizle
      odaTipLifyatRows.value = tumKayitlar.value.filter(row => {
        const gunlukFiyat = parseInt(row.OdLfytGun.toString().replace(/\./g, '')) || 0;
        return gunlukFiyat !== 1;
      });
   }
}

// Oda Tip Lifyat verilerini getir
async function getOdaTipLifyatData() {
  try {
    loading.value = true;
    
         const response = await api.get<ApiResponse>('/admin/oda-tip-lifyat');
     
           if (response.data.success) {
        // Tüm kayıtları parse et ve sakla
        const parsedData = response.data.data.map((row: OdaTipLifyatRow) => ({
          ...row,
          // Sayısal değerleri string olarak parse et ve TL formatında göster
          OdLfytGun: formatCurrencyForDisplay(Number(row.OdLfytGun) || 0),
          OdLfytHft: formatCurrencyForDisplay(Number(row.OdLfytHft) || 0),
          OdLfytAyl: formatCurrencyForDisplay(Number(row.OdLfytAyl) || 0),
          OdDpzt: formatCurrencyForDisplay(Number(row.OdDpzt) || 0)
        }));
        
        // Tüm kayıtları sakla
        tumKayitlar.value = [...parsedData];
        
                          // Varsayılan olarak Günlük fiyat 1 olanları gizle
          odaTipLifyatRows.value = parsedData.filter(row => {
            const gunlukFiyat = parseInt(row.OdLfytGun.toString().replace(/\./g, '')) || 0;
            return gunlukFiyat !== 1;
          });
      
      $q.notify({
        type: 'positive',
        message: `${odaTipLifyatRows.value.length} kayıt başarıyla yüklendi`,
        icon: 'check_circle',
        position: 'top',
        timeout: 3000
      });
    } else {
      throw new Error(response.data.message || 'Veri yüklenirken hata oluştu');
    }
  } catch (error) {
    console.error('Oda Tip Lifyat verileri alınırken hata:', error);
    $q.notify({
      type: 'negative',
      message: 'Veri yüklenirken hata oluştu',
      caption: error instanceof Error ? error.message : 'Bilinmeyen hata',
      icon: 'error',
      position: 'top',
      timeout: 5000
    });
  } finally {
    loading.value = false;
  }
}

// Currency formatlama fonksiyonları
function formatCurrencyForDisplay(value: number): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function formatCurrency(event: Event, row: OdaTipLifyatRow, field: keyof OdaTipLifyatRow) {
  const target = event.target as HTMLInputElement;
  let value = target.value;
  
  // Sadece sayıları kabul et (nokta karakterini kaldır)
  value = value.replace(/[^\d]/g, '');
  
  row[field] = value;
}

function formatCurrencyOnBlur(event: Event, row: OdaTipLifyatRow, field: keyof OdaTipLifyatRow) {
  const target = event.target as HTMLInputElement;
  const value = target.value;
  
  if (value && value !== '') {
    // Sayıyı parse et
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      // TL formatında göster (örn: 1.500)
      const formattedValue = numValue.toLocaleString('tr-TR');
      row[field] = formattedValue;
    }
  }
}

function formatCurrencyOnFocus(event: Event, row: OdaTipLifyatRow, field: keyof OdaTipLifyatRow) {
  const value = row[field];
  
  if (typeof value === 'string' && value.includes(',')) {
    // TL formatından sayıya çevir (örn: 1.500 -> 1500)
    const cleanValue = value.replace(/\./g, '');
    const numValue = parseInt(cleanValue);
    if (!isNaN(numValue)) {
      row[field] = numValue.toString();
    }
  }
}

// Değiştirilen kayıtları güncelle
async function guncelleKayitlar() {
  try {
    guncellemeLoading.value = true;
    
                                       // Değiştirilen kayıtları filtrele ve sayısal değerlere çevir
       const guncellenecekKayitlar = odaTipLifyatRows.value.map(row => ({
         ...row,
         OdLfytGun: parseInt(row.OdLfytGun.toString().replace(/\./g, '')) || 0,
         OdLfytHft: parseInt(row.OdLfytHft.toString().replace(/\./g, '')) || 0,
         OdLfytAyl: parseInt(row.OdLfytAyl.toString().replace(/\./g, '')) || 0,
         OdDpzt: parseInt(row.OdDpzt.toString().replace(/\./g, '')) || 0
       }));
    
    if (guncellenecekKayitlar.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'Güncellenecek kayıt bulunamadı',
        icon: 'warning',
        position: 'top',
        timeout: 3000
      });
      return;
    }
    
    const response = await api.put('/admin/oda-tip-lifyat-guncelle', {
      kayitlar: guncellenecekKayitlar
    });
    
         if (response.data.success) {
       $q.notify({
         type: 'positive',
         message: `${guncellenecekKayitlar.length} kayıt başarıyla güncellendi`,
         icon: 'check_circle',
         position: 'top',
         timeout: 5000
       });
       
       // Verileri yeniden yükle
       await getOdaTipLifyatData();
       
                               // Güncelleme sonrası gizli kayıtları tekrar gizle (eğer gizli mod aktifse)
         if (!gizliKayitlarGosteriliyor.value) {
           odaTipLifyatRows.value = tumKayitlar.value.filter(row => {
             const gunlukFiyat = parseInt(row.OdLfytGun.toString().replace(/\./g, '')) || 0;
             return gunlukFiyat !== 1;
           });
         }
     } else {
      throw new Error(response.data.message || 'Güncelleme sırasında hata oluştu');
    }
  } catch (error) {
    console.error('Kayıtlar güncellenirken hata:', error);
    $q.notify({
      type: 'negative',
      message: 'Güncelleme sırasında hata oluştu',
      caption: error instanceof Error ? error.message : 'Bilinmeyen hata',
      icon: 'error',
      position: 'top',
      timeout: 5000
    });
  } finally {
    guncellemeLoading.value = false;
  }
}

// Geç Saat Konaklama fonksiyonları
async function yukleGecSaatSonu() {
  try {
    const response = await api.get('/parametre/gec-saat-sonu')
    if (response.data.success) {
      // Backend'den gelen sayıyı direkt kullan
      gecSaatNumara.value = response.data.saat
      gecSaatFormatted.value = String(response.data.saat).padStart(2, '0')
    }
  } catch (error) {
    console.error('Geç saat sonu yüklenemedi:', error)
    $q.notify({
      type: 'negative',
      message: 'Geç Saat Konaklama ayarı yüklenemedi',
      position: 'top'
    })
  }
}

async function kaydetGecSaatSonu() {
  gecSaatSonuLoading.value = true
  try {
    const response = await api.put('/parametre/gec-saat-sonu', {
      saat: gecSaatNumara.value
    })
    
    if (response.data.success) {
      $q.notify({
        type: 'positive',
        message: '✅ Geç Saat Konaklama sonu güncellendi!',
        caption: `Yeni değer: ${gecSaatSonu.value}`,
        position: 'top',
        timeout: 3000
      })
    } else {
      throw new Error(response.data.message)
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '❌ Güncelleme başarısız!',
      caption: String(error),
      position: 'top',
      timeout: 3000
    })
  } finally {
    gecSaatSonuLoading.value = false
  }
}

// IP Kısıtlama değişkenleri ve fonksiyonları
interface IPKisitlamaItem {
  IpKstNo: number;
  IpKstAdres: string;
  IpKstAktif: boolean;
  IpKstKytTarihi: string;
  IpKstKllnc: string;
  IpKstAciklama?: string;
}

const showIpKisitlamaModal = ref(false);
const ipKisitlamaAktif = ref(false);
const ipListesi = ref<IPKisitlamaItem[]>([]);
const mevcutIpAdres = ref(''); // External/Public IP
const localIpAdres = ref(''); // Local IP
const yeniIpAdres = ref('');
const yeniIpAciklama = ref('');
const toggleLoading = ref(false);
const addLoading = ref(false);
const deleteLoading = ref(false);
const ipModalCard = ref<{ $el: HTMLElement } | null>(null);

/**
 * IP format kontrolü
 * Püf Nokta: IPv4 format validasyonu (xxx.xxx.xxx.xxx)
 */
function ipFormatKontrol(val: string) {
  const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = val.match(ipRegex);
  
  if (!match) {
    return 'Geçersiz IP formatı (örn: 192.168.1.100)';
  }
  
  // Her oktetin 0-255 aralığında olduğunu kontrol et
  for (let i = 1; i <= 4; i++) {
    const octet = parseInt(match[i], 10);
    if (octet < 0 || octet > 255) {
      return 'IP adresi her bölümü 0-255 arasında olmalıdır';
    }
  }
  
  return true;
}

/**
 * IP kısıtlama bilgilerini yükler
 */
async function yukleIpKisitlamaBilgileri() {
  try {
    const response = await api.get('/admin/ip-restrictions');
    console.log('IP Restrictions Response:', response.data);
    if (response.data.success) {
      ipKisitlamaAktif.value = response.data.data.aktif;
      ipListesi.value = response.data.data.ipListesi;
      console.log('IP kısıtlama bilgileri yüklendi:', { aktif: ipKisitlamaAktif.value, count: ipListesi.value.length });
    } else {
      throw new Error(response.data.message || 'Başarısız response');
    }
  } catch (error: unknown) {
    console.error('IP kısıtlama bilgileri yüklenemedi:', error);
    const axiosError = error as { response?: { status?: number; data?: unknown } };
    const errorMessage = axiosError?.response?.status === 500
      ? 'Veritabanı hatası. Backend loglarını kontrol edin.'
      : axiosError?.response?.status === 404
      ? 'Endpoint bulunamadı. Backend yeniden başlatılmalı.'
      : 'IP kısıtlama bilgileri yüklenemedi. Backend çalışıyor mu?';
    
    $q.notify({
      type: 'negative',
      message: errorMessage,
      caption: `Status: ${axiosError?.response?.status || 'Network Error'}`,
      position: 'top',
      timeout: 6000
    });
    
    // Hata durumunda varsayılan değerler
    ipKisitlamaAktif.value = false;
    ipListesi.value = [];
  }
}

/**
 * Mevcut IP adresini alır
 * Püf Nokta: Hem external (public) hem de local IP adresleri gösterilir
 */
async function yukleMevcutIp() {
  try {
    const response = await api.get('/admin/current-ip');
    console.log('Current IP Response:', response.data);
    if (response.data.success && response.data.data) {
      // External IP'yi öncelikli göster
      mevcutIpAdres.value = response.data.data.externalIp || response.data.data.ip || 'Alınamadı';
      localIpAdres.value = response.data.data.localIp || '';
      
      console.log('IP adresleri yüklendi:', { 
        external: mevcutIpAdres.value, 
        local: localIpAdres.value 
      });
    } else {
      console.warn('IP adresi response içinde bulunamadı:', response.data);
      mevcutIpAdres.value = 'Alınamadı';
    }
  } catch (error) {
    console.error('Mevcut IP adresi alınamadı:', error);
    mevcutIpAdres.value = 'Alınamadı';
  }
}

/**
 * IP kısıtlama sistemini aktif/pasif yapar
 * Püf Nokta: Kullanıcı kendi IP'sini listede olmadan aktifleştirirse uyarı gösterilir
 */
async function toggleIpKisitlama(aktif: boolean) {
  // Eğer aktif hale getiriliyorsa ve listedeki IP sayısı 0 ise uyar
  if (aktif && ipListesi.value.length === 0) {
    $q.dialog({
      title: 'Uyarı',
      message: 'IP listesinde hiç kayıt yok! Sistemi aktif hale getirirseniz kimse erişemeyecek. Devam etmek istiyor musunuz?',
      cancel: true,
      persistent: true
    }).onCancel(() => {
      // Toggle'ı geri al
      ipKisitlamaAktif.value = !aktif;
    }).onOk(() => {
      void toggleIpKisitlamaOnay(aktif);
    });
    return;
  }
  
  // Eğer aktif hale getiriliyorsa ve mevcut IP listede yoksa uyar
  if (aktif && mevcutIpAdres.value) {
    const mevcutIpListede = ipListesi.value.some(ip => ip.IpKstAdres === mevcutIpAdres.value);
    if (!mevcutIpListede) {
      $q.dialog({
        title: 'Dikkat!',
        message: `Mevcut IP adresiniz (${mevcutIpAdres.value}) listede bulunmuyor! Sistemi aktif hale getirirseniz erişiminiz kesilecek. Devam etmek istiyor musunuz?`,
        cancel: true,
        persistent: true,
        color: 'negative'
      }).onCancel(() => {
        // Toggle'ı geri al
        ipKisitlamaAktif.value = !aktif;
      }).onOk(() => {
        void toggleIpKisitlamaOnay(aktif);
      });
      return;
    }
  }
  
  await toggleIpKisitlamaOnay(aktif);
}

async function toggleIpKisitlamaOnay(aktif: boolean) {
  toggleLoading.value = true;
  try {
    const kullaniciAdi = localStorage.getItem('username') || 'SYSTEM';
    const response = await api.patch('/admin/ip-restrictions/toggle', {
      aktif,
      kullaniciAdi
    });
    
    if (response.data.success) {
      $q.notify({
        type: 'positive',
        message: `IP kısıtlama ${aktif ? 'aktif' : 'pasif'} edildi`,
        icon: aktif ? 'lock' : 'lock_open',
        position: 'top',
        timeout: 3000
      });
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('IP kısıtlama toggle hatası:', error);
    // Toggle'ı geri al
    ipKisitlamaAktif.value = !aktif;
    $q.notify({
      type: 'negative',
      message: 'IP kısıtlama durumu değiştirilemedi',
      position: 'top'
    });
  } finally {
    toggleLoading.value = false;
  }
}

/**
 * Enter tuşu ile IP ekleme
 * Püf Nokta: Sadece IP adresi doluysa ekle, boşsa placeholder eklenmez
 */
function handleIpEnter() {
  if (yeniIpAdres.value && yeniIpAdres.value.trim()) {
    void addIpAdres();
  }
}

/**
 * Mevcut IP'yi input alanına kopyalar
 */
function copyCurrentIp() {
  if (mevcutIpAdres.value && mevcutIpAdres.value !== 'Alınamadı') {
    yeniIpAdres.value = mevcutIpAdres.value;
    $q.notify({
      type: 'positive',
      message: 'IP adresi kopyalandı',
      position: 'top',
      timeout: 2000
    });
  }
}

/**
 * Yeni IP adresi ekler
 */
async function addIpAdres() {
  // Boş kontrol
  if (!yeniIpAdres.value || !yeniIpAdres.value.trim()) {
    $q.notify({
      type: 'warning',
      message: 'Lütfen bir IP adresi girin',
      position: 'top'
    });
    return;
  }
  
  // Validasyon
  const validationResult = ipFormatKontrol(yeniIpAdres.value);
  if (validationResult !== true) {
    $q.notify({
      type: 'warning',
      message: validationResult,
      position: 'top'
    });
    return;
  }
  
  // Local IP uyarısı (opsiyonel - sadece uyarı ver, engelleme)
  const ipParts = yeniIpAdres.value.split('.');
  if (ipParts.length === 4) {
    const firstOctet = parseInt(ipParts[0], 10);
    const secondOctet = parseInt(ipParts[1], 10);
    
    // Private IP range kontrolü (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const isPrivateIp = 
      firstOctet === 192 && secondOctet === 168 ||
      firstOctet === 10 ||
      firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31 ||
      firstOctet === 127; // localhost
    
    if (isPrivateIp) {
      // Uyarı ver ama yine de eklemeye izin ver
      const confirm = await new Promise<boolean>((resolve) => {
        $q.dialog({
          title: 'Dikkat',
          message: `${yeniIpAdres.value} bir local/private IP adresi gibi görünüyor. IP kısıtlaması için genellikle dış IP (public IP) kullanılır. Yine de eklemek istiyor musunuz?`,
          cancel: { label: 'İptal', flat: true, color: 'grey' },
          persistent: true,
          ok: { label: 'Evet, Ekle', color: 'primary', unelevated: true }
        }).onOk(() => resolve(true))
          .onCancel(() => resolve(false));
      });
      
      if (!confirm) return;
    }
  }
  
  addLoading.value = true;
  try {
    const kullaniciAdi = localStorage.getItem('username') || 'SYSTEM';
    const response = await api.post('/admin/ip-restrictions', {
      ipAdres: yeniIpAdres.value,
      aciklama: yeniIpAciklama.value,
      kullaniciAdi
    });
    
    if (response.data.success) {
      $q.notify({
        type: 'positive',
        message: 'IP adresi başarıyla eklendi',
        icon: 'check_circle',
        position: 'top',
        timeout: 3000
      });
      
      // Formu temizle
      yeniIpAdres.value = '';
      yeniIpAciklama.value = '';
      
      // Listeyi yenile
      await yukleIpKisitlamaBilgileri();
    } else {
      throw new Error(response.data.message);
    }
  } catch (error: unknown) {
    console.error('IP ekleme hatası:', error);
    const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'IP adresi eklenemedi';
    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top'
    });
  } finally {
    addLoading.value = false;
  }
}

/**
 * IP silme onayı ister
 * Püf Nokta: Kullanıcı kendi IP'sini silmeye çalışırsa ekstra uyarı gösterilir
 */
function confirmDeleteIp(ip: IPKisitlamaItem) {
  const kendi = ip.IpKstAdres === mevcutIpAdres.value;
  
  $q.dialog({
    title: kendi ? '⚠️ Dikkat!' : 'IP Silme Onayı',
    message: kendi 
      ? `Bu IP adresi (${ip.IpKstAdres}) mevcut IP adresiniz! Silmek istediğinize emin misiniz? IP kısıtlaması aktifse erişiminiz kesilecek.`
      : `${ip.IpKstAdres} IP adresini silmek istediğinize emin misiniz?`,
    cancel: true,
    persistent: true,
    color: kendi ? 'negative' : 'primary'
  }).onOk(() => {
    void deleteIpAdres(ip.IpKstNo);
  });
}

/**
 * IP adresini siler
 */
async function deleteIpAdres(id: number) {
  deleteLoading.value = true;
  try {
    const response = await api.delete(`/admin/ip-restrictions/${id}`);
    
    if (response.data.success) {
      $q.notify({
        type: 'positive',
        message: 'IP adresi başarıyla silindi',
        icon: 'check_circle',
        position: 'top',
        timeout: 3000
      });
      
      // Listeyi yenile
      await yukleIpKisitlamaBilgileri();
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('IP silme hatası:', error);
    $q.notify({
      type: 'negative',
      message: 'IP adresi silinemedi',
      position: 'top'
    });
  } finally {
    deleteLoading.value = false;
  }
}

/**
 * Modal'ı açar ve verileri yükler
 * Püf Nokta: Verileri modal açılırken yükleyerek gereksiz API çağrılarını önleriz
 */
function openIpKisitlamaModal() {
  showIpKisitlamaModal.value = true;
  // Modal açılınca verileri yükle
  void yukleIpKisitlamaBilgileri();
  void yukleMevcutIp();
  
  // Modal açıldıktan sonra draggable özelliğini ekle
  setTimeout(() => {
    setupIpModalDraggable();
  }, 100);
}

/**
 * Modal'ı sürüklenebilir yapar
 * Püf Nokta: Modal header'ından tutup ekranda gezdirebilirsiniz
 */
function setupIpModalDraggable() {
  let isDragging = false;
  let currentX: number;
  let currentY: number;
  let initialX: number;
  let initialY: number;
  let xOffset = 0;
  let yOffset = 0;

  function dragStart(e: MouseEvent | TouchEvent) {
    if (!showIpKisitlamaModal.value) return;
    if (e.target && (e.target as HTMLElement).closest('.ip-modal-card .modal-header')) {
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

      if (ipModalCard.value && ipModalCard.value.$el) {
        const modalElement = ipModalCard.value.$el;
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
</script>

<style scoped>
.admin-panel-table {
  font-size: 0.8rem;
}

.admin-header-group {
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background-color: rgba(255, 255, 255, 0.04);
}

.admin-header-group--gec {
  border-color: rgba(33, 150, 243, 0.5);
  background-color: rgba(33, 150, 243, 0.08);
}

.admin-header-group--hizli {
  border-color: rgba(0, 150, 136, 0.5);
  background-color: rgba(0, 150, 136, 0.08);
}

.body--dark .admin-header-group {
  border-color: rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.03);
}

.body--dark .admin-header-group--gec {
  border-color: rgba(33, 150, 243, 0.5);
  background-color: rgba(33, 150, 243, 0.07);
}

.body--dark .admin-header-group--hizli {
  border-color: rgba(0, 150, 136, 0.5);
  background-color: rgba(0, 150, 136, 0.07);
}

.readonly-input .q-field__control {
  background-color: #f5f5f5;
  color: #666;
}

.readonly-input .q-field__control input {
  color: #666;
  cursor: not-allowed;
}

.writable-input .q-field__control {
  background-color: #ffffff;
}

.writable-input .q-field__control input {
  color: #333;
}

/* Dark mode desteği */
.body--dark .readonly-input .q-field__control {
  background-color: #424242;
  color: #aaa;
}

.body--dark .readonly-input .q-field__control input {
  color: #aaa;
}

.body--dark .writable-input .q-field__control {
  background-color: #424242;
}

.body--dark .writable-input .q-field__control input {
  color: #fff;
}

/* Tablo stilleri */
.admin-panel-table .q-table th {
  background-color: #f0f0f0;
  font-weight: bold;
  color: #333;
}

.body--dark .admin-panel-table .q-table th {
  background-color: #424242;
  color: #fff;
}

.admin-panel-table .q-table td {
  padding: 4px;
}

/* Input alanları için özel stiller */
.admin-panel-table .q-input {
  margin: 2px;
}

.admin-panel-table .q-input .q-field__control {
  min-height: 28px;
}

.admin-panel-table .q-input .q-field__control input {
  padding: 4px 8px;
  font-size: 0.8rem;
}

/* Compact input stilleri */
.compact-input .q-field__control {
  min-height: 24px !important;
}

.compact-input .q-field__control input {
  padding: 2px 6px !important;
  font-size: 0.75rem !important;
}

.compact-input .q-field__prepend,
.compact-input .q-field__append {
  padding: 0 4px !important;
}

/* Tablo header'ı da compact yap */
.admin-panel-table .q-table th {
  padding: 6px 4px !important;
  font-size: 0.8rem !important;
}

/* Gizli sütunlar için */
.hidden {
  display: none !important;
}

/* Sütun genişlik sınırlamaları */
.admin-panel-table .q-table td,
.admin-panel-table .q-table th {
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Sütun genişlikleri için özel stiller */
.admin-panel-table .q-table td:nth-child(2) { /* OdTipAdi */
  max-width: 200px;
}

.admin-panel-table .q-table td:nth-child(3), /* OdLfytGun */
.admin-panel-table .q-table td:nth-child(4), /* OdLfytHft */
.admin-panel-table .q-table td:nth-child(5), /* OdLfytAyl */
.admin-panel-table .q-table td:nth-child(6) { /* OdDpzt */
  max-width: 120px;
  text-align: center;
}

/* Fiyat sütunlarındaki input alanlarını centered yap */
.admin-panel-table .q-table td:nth-child(3) .q-input, /* OdLfytGun */
.admin-panel-table .q-table td:nth-child(4) .q-input, /* OdLfytHft */
.admin-panel-table .q-table td:nth-child(5) .q-input, /* OdLfytAyl */
.admin-panel-table .q-table td:nth-child(6) .q-input { /* OdDpzt */
  text-align: center;
}

.admin-panel-table .q-table td:nth-child(3) .q-input input, /* OdLfytGun */
.admin-panel-table .q-table td:nth-child(4) .q-input input, /* OdLfytHft */
.admin-panel-table .q-table td:nth-child(5) .q-input input, /* OdLfytAyl */
.admin-panel-table .q-table td:nth-child(6) .q-input input { /* OdDpzt */
  text-align: center !important;
}

/* Daha spesifik seçiciler ile input alanlarını centered yap */
.admin-panel-table .q-table td:nth-child(3) .q-field__control input, /* OdLfytGun */
.admin-panel-table .q-table td:nth-child(4) .q-field__control input, /* OdLfytHft */
.admin-panel-table .q-table td:nth-child(5) .q-field__control input, /* OdLfytAyl */
.admin-panel-table .q-table td:nth-child(6) .q-field__control input { /* OdDpzt */
  text-align: center !important;
}

/* Compact input için de centered yap */
.admin-panel-table .q-table td:nth-child(3) .compact-input .q-field__control input, /* OdLfytGun */
.admin-panel-table .q-table td:nth-child(4) .compact-input .q-field__control input, /* OdLfytHft */
.admin-panel-table .q-table td:nth-child(5) .compact-input .q-field__control input, /* OdLfytAyl */
.admin-panel-table .q-table td:nth-child(6) .compact-input .q-field__control input { /* OdDpzt */
  text-align: center !important;
}

/* Writable input için de centered yap */
.admin-panel-table .q-table td:nth-child(3) .writable-input .q-field__control input, /* OdLfytGun */
.admin-panel-table .q-table td:nth-child(4) .writable-input .q-field__control input, /* OdLfytHft */
.admin-panel-table .q-table td:nth-child(5) .writable-input .q-field__control input, /* OdLfytAyl */
.admin-panel-table .q-table td:nth-child(6) .writable-input .q-field__control input { /* OdDpzt */
  text-align: center !important;
}

/* En güçlü seçici ile tüm input alanlarını centered yap */
.admin-panel-table .q-table td:nth-child(3) input[type="number"], /* OdLfytGun */
.admin-panel-table .q-table td:nth-child(4) input[type="number"], /* OdLfytHft */
.admin-panel-table .q-table td:nth-child(5) input[type="number"], /* OdLfytAyl */
.admin-panel-table .q-table td:nth-child(6) input[type="number"] { /* OdDpzt */
  text-align: center !important;
}

/* Global input centered override */
.admin-panel-table input[type="number"] {
  text-align: center !important;
}

/* En güçlü CSS override - tüm input'ları centered yap */
.admin-panel-table input {
  text-align: center !important;
}

/* Quasar'ın varsayılan stillerini override et */
.admin-panel-table .q-field__control input {
  text-align: center !important;
}

/* Inline style ile override */
.admin-panel-table input[style*="text-align"] {
  text-align: center !important;
}

/* En güçlü override - tüm input'ları zorla centered yap */
.admin-panel-table input,
.admin-panel-table .q-field__control input,
.admin-panel-table .q-input input,
.admin-panel-table .q-field input {
  text-align: center !important;
}

/* Quasar'ın tüm stillerini override et */
.admin-panel-table .q-field__control input[type="number"],
.admin-panel-table .q-field__control input[type="text"] {
  text-align: center !important;
}

/* Global override - tüm sayfa için */
.admin-panel-table * {
  text-align: center !important;
}

/* Sadece Oda Tip Adı sütunu left align olsun */
.admin-panel-table .q-table td:nth-child(2),
.admin-panel-table .q-table th:nth-child(2) {
  text-align: left !important;
}

/* Currency input stilleri */
.currency-input input {
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.currency-input .q-field__control {
  background-color: #fff3cd !important;
  border-color: #ffeaa7 !important;
}

.currency-input:focus-within .q-field__control {
  background-color: #fff8e1 !important;
  border-color: #ffd54f !important;
}

/* IP Kısıtlama Modal Stilleri - Compact Tasarım */
/* Light Mode */
.ip-modal-card {
  background-color: #ffffff;
}

.ip-modal-card .q-card__section {
  padding: 8px !important;
}

.ip-toggle-section {
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
}

.ip-toggle-icon {
  color: #c62828;
}

.ip-toggle-text {
  color: #616161;
  line-height: 1.2;
}

.ip-current-section {
  background-color: #e3f2fd;
  border: 1px solid #90caf9;
}

.ip-current-icon {
  color: #1976d2;
}

.ip-warning-banner {
  background-color: #fff3e0;
  color: #e65100;
  padding: 4px 8px !important;
}

.ip-info-banner {
  background-color: #e3f2fd;
  color: #1565c0;
  padding: 4px 8px !important;
}

.ip-modal-actions {
  border-top: 1px solid #e0e0e0;
  padding: 4px 8px !important;
}

/* Dark Mode */
.body--dark .ip-modal-card {
  background-color: #1e1e1e;
}

.body--dark .ip-toggle-section {
  background-color: #2d2d2d;
  border: 1px solid #424242;
}

.body--dark .ip-toggle-icon {
  color: #ef5350;
}

.body--dark .ip-toggle-text {
  color: #b0b0b0;
}

.body--dark .ip-current-section {
  background-color: #0d47a1;
  border: 1px solid #1976d2;
}

.body--dark .ip-current-icon {
  color: #64b5f6;
}

.body--dark .ip-warning-banner {
  background-color: #4a2c0c;
  color: #ffb74d;
}

.body--dark .ip-info-banner {
  background-color: #0d47a1;
  color: #90caf9;
}

.body--dark .ip-modal-actions {
  border-top: 1px solid #424242;
}

.body--dark .q-card {
  background-color: #1e1e1e;
  color: #ffffff;
}

.body--dark .q-list {
  background-color: #2d2d2d;
  border-color: #424242;
}

.body--dark .q-item {
  color: #ffffff;
}

.body--dark .q-separator {
  background-color: #424242;
}

/* Compact list item spacing */
.ip-modal-card .q-item {
  min-height: 36px;
  padding: 4px 8px;
}

.ip-modal-card .q-item__section--avatar {
  min-width: 30px;
  padding-right: 8px;
}

/* Draggable modal stilleri */
.draggable-modal {
  position: relative;
  user-select: none;
}

.draggable-modal .modal-header {
  cursor: move !important;
  user-select: none;
}

.draggable-modal .modal-header * {
  cursor: move !important;
}

.draggable-modal .modal-header .q-btn {
  cursor: pointer !important;
}

/* Dark mode draggable header */
.body--dark .ip-modal-card .modal-header {
  background-color: #b71c1c !important;
}

.body--dark .oda-tip-modal-card .modal-header {
  background-color: #1565c0 !important;
}

/* Modal sürükleme efekti */
.draggable-modal:active {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
}

.oda-tip-table-title {
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  padding: 6px 8px;
  text-align: center;
  font-weight: 700;
  letter-spacing: 0.4px;
  margin-bottom: 6px;
}

.body--dark .oda-tip-table-title {
  border-color: rgba(255, 255, 255, 0.22);
}

.oda-tip-mini-table .q-td,
.oda-tip-mini-table .q-th {
  padding: 4px 6px;
  font-size: 12px;
}

.oda-tip-mini-table .cell-dolu {
  background-color: #c62828;
  color: #ffffff;
  font-weight: 700;
}

.oda-tip-mini-table .cell-silinecek {
  color: #c62828;
  font-weight: 700;
  text-align: center;
}
</style>
