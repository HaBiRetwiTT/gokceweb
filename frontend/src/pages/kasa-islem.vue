<template>
  <q-page class="q-pa-md light-page-background">
    <!-- Ana Container - İki Sütunlu Layout -->
    <div class="ana-container">
      <div class="layout-grid">
        
                 <!-- Sol Sütun - Radio Button Grupları -->
         <div class="left-column">
                        <q-card class="main-card">
               <q-card-section>
                 <div class="text-h6 q-mb-md text-center">Kasa İşlemleri</div>
                 
                 <!-- Veriyi Yenile Butonu -->
                 <div class="text-center q-mb-md">
                   <q-btn 
                     color="warning" 
                     icon="refresh" 
                     label="VERİYİ YENİLE" 
                     size="md"
                     class="refresh-btn"
                     style="font-size: 12px !important;"
                     @click="refreshData"
                   />
                 </div>
                 
                 <!-- Dış Container -->
                 <div class="radio-groups-container">
                
                <!-- İlk Radio Button Grubu - İşlem Türü -->
                <div class="radio-group-container">
                  <div class="radio-group">
                    <div class="radio-options">
                      <div class="radio-with-rst">
                      <q-radio v-model="selectedIslemTuru" val="cari" label="Cari" @update:model-value="onIslemTuruChange" />
                        <div v-if="rstIslemNoList.length > 0 && selectedIslemTuru === 'cari'" class="rst-count-display">
                          <span class="rst-count-number">({{ rstIslemNoList.length }})</span>
                          <span class="rst-count-indicator">⚠️</span>
                        </div>
                      </div>
                      <div class="radio-with-rst">
                      <q-radio v-model="selectedIslemTuru" val="nakit" label="Nakit" @update:model-value="onIslemTuruChange" />
                        <div v-if="rstIslemNoList.length > 0 && selectedIslemTuru === 'nakit'" class="rst-count-display">
                          <span class="rst-count-number">({{ rstIslemNoList.length }})</span>
                          <span class="rst-count-indicator">⚠️</span>
                        </div>
                      </div>
                      <div class="radio-with-rst">
                      <q-radio v-model="selectedIslemTuru" val="kart" label="Kart" @update:model-value="onIslemTuruChange" />
                        <div v-if="rstIslemNoList.length > 0 && selectedIslemTuru === 'kart'" class="rst-count-display">
                          <span class="rst-count-number">({{ rstIslemNoList.length }})</span>
                          <span class="rst-count-indicator">⚠️</span>
                        </div>
                      </div>
                      <div class="radio-with-rst">
                      <q-radio v-model="selectedIslemTuru" val="eft" label="EFT" @update:model-value="onIslemTuruChange" />
                        <div v-if="rstIslemNoList.length > 0 && selectedIslemTuru === 'eft'" class="rst-count-display">
                          <span class="rst-count-number">({{ rstIslemNoList.length }})</span>
                          <span class="rst-count-indicator">⚠️</span>
                        </div>
                      </div>
                      <div class="radio-with-rst">
                      <q-radio v-model="selectedIslemTuru" val="acenta" label="Acenta" @update:model-value="onIslemTuruChange" />
                        <div v-if="rstIslemNoList.length > 0 && selectedIslemTuru === 'acenta'" class="rst-count-display">
                          <span class="rst-count-number">({{ rstIslemNoList.length }})</span>
                          <span class="rst-count-indicator">⚠️</span>
                        </div>
                      </div>
                      <div class="radio-with-rst">
                      <q-radio v-model="selectedIslemTuru" val="depozito" label="Depozito" @update:model-value="onIslemTuruChange" />
                        <div v-if="rstIslemNoList.length > 0 && selectedIslemTuru === 'depozito'" class="rst-count-display">
                          <span class="rst-count-number">({{ rstIslemNoList.length }})</span>
                          <span class="rst-count-indicator">⚠️</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- İkinci Radio Button Grubu - Gelir/Gider veya Giren/Çıkan -->
                <div class="radio-group-container second-radio-group">
                  <div class="radio-group">
                    <div class="radio-options">
                      <q-radio v-model="selectedIslemYonu" val="gelir" :label="firstOptionLabel" />
                      <q-radio v-model="selectedIslemYonu" val="gider" :label="secondOptionLabel" />
                    </div>
                  </div>
                </div>

                <!-- Kasalar Arası Aktarım Bölümü -->
                <div class="transfer-container">
                  <div class="transfer-header">
                    <div class="transfer-title">Kasalar Arası Aktarım</div>
                  </div>
                  <div class="transfer-form">
                    <div class="form-row">
                      <div class="form-label">Veren Kasa</div>
                      <q-select 
                        v-model="transferForm.veren" 
                        :options="kasaOptions"
                        outlined 
                        dense 
                        placeholder="Veren kasa seçin"
                        class="transfer-input"
                        emit-value
                        map-options
                      />
                    </div>
                    <div class="form-row">
                      <div class="form-label">Alan Kasa</div>
                      <q-select 
                        v-model="transferForm.alan" 
                        :options="kasaOptions"
                        outlined 
                        dense 
                        placeholder="Alan kasa seçin"
                        class="transfer-input"
                        emit-value
                        map-options
                      />
                    </div>
                    <div class="form-row">
                      <div class="form-label">Aktarılacak Tutar</div>
                      <q-input 
                        v-model="transferForm.tutar" 
                        outlined 
                        dense 
                        placeholder="0.00"
                        type="number"
                        class="transfer-input"
                      />
                    </div>
                    <div class="form-row">
                      <q-btn 
                        color="primary" 
                        label="AKTAR" 
                        @click="performTransfer"
                        class="transfer-button"
                        size="md"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </q-card-section>
          </q-card>
        </div>

                 <!-- Sağ Sütun - İki Tablo -->
         <div class="right-column">
           <div class="tables-grid">
             <!-- Sol Tablo - Günlük Toplamlar -->
             <q-card class="main-card">
               <q-card-section>
                 <!-- Bakiye Label -->
                  <div class="bakiye-label q-mb-sm">
                    <q-chip 
                      :color="isGuncelBakiyeLabel ? 'green' : 'orange'" 
                      text-color="white"
                      :label="bakiyeLabelText"
                      class="text-weight-medium"
                    />
                  </div>
                 
                 <!-- Ana Grid Tablo Container -->
                 <div class="main-table-container">
                   <div class="table-container">
                     <q-table
                       :rows="tableData"
                       :columns="columns"
                       :loading="loading"
                       :pagination="pagination"
                       row-key="tarih"
                       flat
                       bordered
                       class="kasa-table"
                       :rows-per-page-options="[7]"
                       :rows-per-page-label="''"
                       :pagination-label="() => ''"
                       :server-side="false"
                       :hide-pagination="true"
                       :rows-per-page="7"
                       @request="onRequest"
                     >
                       <!-- Satır template'i -->
                       <template v-slot:body="props">
                         <q-tr 
                           :props="props" 
                           :class="{ 'selected-row': props.row.tarih === selectedDate }"
                           @click="onRowClick($event, props.row)"
                         >
                           <q-td key="tarih" :props="props" class="cursor-pointer">
                             {{ formatDate(props.row.tarih) }}
                           </q-td>
                           <q-td key="gelir" :props="props" class="text-positive">
                             {{ formatCurrency(props.row.gelir) }}
                           </q-td>
                           <q-td key="gider" :props="props" class="text-negative">
                             {{ formatCurrency(props.row.gider) }}
                           </q-td>
                         </q-tr>
                       </template>
                     </q-table>
                     
                     <!-- Özel Pagination Butonları -->
                     <div class="custom-pagination">
                       <q-btn 
                         :disable="pagination.page <= 1" 
                         @click="changePage(pagination.page - 1)"
                         color="primary"
                         icon="chevron_left"
                         size="sm"
                       />
                       <span class="pagination-info">
                         Sayfa {{ pagination.page }} / {{ Math.ceil(pagination.rowsNumber / pagination.rowsPerPage) }}
                       </span>
                       <q-btn 
                         :disable="pagination.page >= Math.ceil(pagination.rowsNumber / pagination.rowsPerPage)" 
                         @click="changePage(pagination.page + 1)"
                         color="primary"
                         icon="chevron_right"
                         size="sm"
                       />
                     </div>
                   </div>
                   
                   <!-- Kasa Devir Tablo Container -->
                   <div class="kasa-devir-container">
                     <div class="kasa-devir-header">
                       <q-btn 
                         color="primary" 
                         icon="account_balance_wallet" 
                         label="KASA DEVRET" 
                         size="md"
                         class="kasa-devir-btn"
                          @click="onKasaDevretClick"
                       />
                     </div>
                     
                     <div class="kasa-devir-table-container">
                        <q-table
                         :rows="kasaDevirData"
                         :columns="kasaDevirColumns"
                         :loading="kasaDevirLoading"
                         :pagination="kasaDevirPagination"
                          row-key="rowKey"
                         flat
                         bordered
                         class="kasa-devir-table"
                         :rows-per-page-options="[3]"
                         :rows-per-page-label="''"
                         :pagination-label="() => ''"
                         :server-side="true"
                         :hide-pagination="true"
                         :rows-per-page="3"
                         @request="onKasaDevirRequest"
                       >
                         <template v-slot:body-cell-DevirTarihi="props">
                           <q-td :props="props">
                             <span class="text-weight-medium">
                               {{ formatDate(props.value) }}
                             </span>
                           </q-td>
                         </template>
                         
                         <template v-slot:body-cell-KasaYekun="props">
                           <q-td :props="props">
                             <span class="text-weight-medium">
                               {{ formatCurrency(props.value) }}
                             </span>
                           </q-td>
                         </template>
                       </q-table>
                       
                       <!-- Kasa Devir Özel Pagination Butonları -->
                       <div class="custom-pagination">
                         <q-btn 
                           :disable="kasaDevirPagination.page <= 1" 
                           @click="changeKasaDevirPage(kasaDevirPagination.page - 1)"
                           color="primary"
                           icon="chevron_left"
                           size="sm"
                         />
                         <span class="pagination-info">
                           Sayfa {{ kasaDevirPagination.page }} / {{ Math.ceil(kasaDevirPagination.rowsNumber / kasaDevirPagination.rowsPerPage) }}
                         </span>
                         <q-btn 
                           :disable="kasaDevirPagination.page >= Math.ceil(kasaDevirPagination.rowsNumber / kasaDevirPagination.rowsPerPage)" 
                           @click="changeKasaDevirPage(kasaDevirPagination.page + 1)"
                           color="primary"
                           icon="chevron_right"
                           size="sm"
                         />
                       </div>
                     </div>
                   </div>
                 </div>
               </q-card-section>
             </q-card>

             <!-- Sağ Tablo - Detay İşlemler -->
             <q-card class="main-card">
               <q-card-section>
                  <!-- Debug Butonu -->

                  
                  <div class="table-container">
                   <q-table
                      :rows="detailTableData"
                      :columns="detailColumns"
                      :loading="detailLoading"
                      :pagination="detailPagination"
                      row-key="id"
                      flat
                      bordered
                      class="kasa-table detail-table"
                      :rows-per-page-options="[15]"
                      :rows-per-page-label="''"
                      :pagination-label="() => ''"
                      :server-side="true"
                      :hide-pagination="true"
                      :rows-per-page="15"
                      :row-class="getStableRowClass"
                      @request="onDetailRequest"
                      @row-dblclick="onDetailRowDblClick"
                    >
                      <!-- Başlık satırında 'Bilgi' sütununun hemen yanında ikon container -->
                      <template v-slot:header-cell-islemBilgi="props">
                        <q-th :props="props">
                          <div class="row items-center no-wrap" style="gap:8px;">
                            <span>Bilgi</span>
                            <div class="report-icons">
                              <q-btn round dense class="pdf-btn" @click="downloadKasaDetayPDF" :loading="kasaPdfLoading">
                                <img src="/icons/adobe-pdf.png" alt="PDF" class="report-icon" />
                              </q-btn>
                              <q-btn round dense class="excel-btn" @click="downloadKasaDetayExcel" :loading="kasaExcelLoading">
                                <img src="/icons/excel-xlsx.png" alt="Excel" class="report-icon" />
                              </q-btn>
                            </div>
                          </div>
                        </q-th>
                      </template>
                     <!-- Tarih Sütunu -->
                     <template v-slot:body-cell-iKytTarihi="props">
                       <q-td :props="props">
                         {{ formatDate(props.value) }}
                       </q-td>
                     </template>

                     <!-- İşlem No Sütunu -->
                     <template v-slot:body-cell-islemNo="props">
                       <q-td :props="props" class="text-weight-medium">
                         <!-- Sadece değişen kayıtlarda indikatör göster -->
                         <q-tooltip v-if="rstIslemNoList.includes(props.row.islemNo)" 
                                   class="rst-differences-tooltip" 
                                   :delay="100"
                                   :offset="[0, 10]">
                           <div class="tooltip-content">
                             <div class="tooltip-title">Değişiklik Detayları</div>
                             <div v-if="rstDifferences[props.row.islemNo]" class="differences-table">
                               <div class="differences-header">
                                 <div class="differences-cell">Alan Adı</div>
                                 <div class="differences-cell">Orijinal Değer</div>
                                 <div class="differences-cell">Değiştirilen Değer</div>
                               </div>
                               <div v-for="diff in rstDifferences[props.row.islemNo]" 
                                    :key="diff.fieldName" 
                                    class="differences-row">
                                 <div class="differences-cell">{{ diff.fieldName }}</div>
                                 <div class="differences-cell">{{ diff.originalValue }}</div>
                                 <div class="differences-cell">{{ diff.changedValue }}</div>
                               </div>
                             </div>
                             <div v-else class="loading-differences">
                               <q-spinner size="16px" color="warning" />
                               <span>Farklar yükleniyor...</span>
                             </div>
                           </div>
                         </q-tooltip>
                         <span v-if="rstIslemNoList.includes(props.row.islemNo)"
                               class="rst-marker-icon"
                               @mouseenter="loadDifferencesOnHover(props.row.islemNo)">
                           ⚠️
                         </span>
                       </q-td>
                     </template>



                     <!-- Tutar Sütunu -->
                     <template v-slot:body-cell-islemTutar="props">
                       <q-td :props="props" class="text-weight-medium">
                         {{ formatCurrency(props.value) }}
                       </q-td>
                     </template>
                   </q-table>
                   
                   <!-- Detay Tablo Özel Pagination Butonları -->
                   <div class="custom-pagination">
                     <q-btn 
                       :disable="detailPagination.page <= 1" 
                       @click="changeDetailPage(detailPagination.page - 1)"
                       color="primary"
                       icon="chevron_left"
                       size="sm"
                     />
                     <span class="pagination-info">
                       Sayfa {{ detailPagination.page }} / {{ Math.ceil(detailPagination.rowsNumber / detailPagination.rowsPerPage) }}
                     </span>
                     <q-btn 
                       :disable="detailPagination.page >= Math.ceil(detailPagination.rowsNumber / detailPagination.rowsPerPage)" 
                       @click="changeDetailPage(detailPagination.page + 1)"
                       color="primary"
                       icon="chevron_right"
                       size="sm"
                     />
                   </div>
                 </div>
               </q-card-section>
             </q-card>
           </div>
         </div>

      </div>
    </div>

         <!-- İşlem Detay Form Modal -->
     <q-dialog v-model="showIslemDetayDialog" persistent>
       <div
         ref="islemDetayModalRef"
         :style="islemDetayModalStyle"
         class="draggable-islem-detay-modal"
       >
         <q-card 
          :style="`min-width: ${modalWidth}px; max-width: ${modalWidth}px; max-height: 90vh; overflow-y: auto;`"
          :class="{ 'modal-dragging': islemDetayModalDragging }"
         >
                       <q-card-section class="row items-center q-pb-none draggable-header"
               @mousedown="onIslemDetayDragStart"
               @touchstart="onIslemDetayDragStart"
             >
              <div class="col-4">
                <div class="text-h6 text-weight-bold">
               İşlem Detayı
             </div>
             <!-- Arşiv navigasyon butonları -->
             <div v-if="isArchiveMode" class="row items-center q-gutter-xs q-mt-sm">
               <q-btn 
                 flat 
                 round 
                 dense 
                 icon="navigate_before" 
                 color="primary"
                 @click="goToPreviousArchiveRecord"
                 :disabled="false"
                 title="Önceki arşiv kaydı"
               />
               <q-btn 
                 flat 
                 round 
                 dense 
                 icon="navigate_next" 
                 color="primary"
                 @click="goToNextArchiveRecord"
                 title="Sonraki arşiv kaydı"
               />
             </div>
              </div>
              <div class="col-8 text-right">
                <!-- Header Container - Kayıt No ve Kullanıcı -->
                <div class="header-container">
                  <div class="row items-center justify-end q-gutter-md">
             <!-- Kayıt No -->
                    <div class="row items-center q-gutter-xs">
                      <div class="text-subtitle2 text-weight-medium" style="line-height: 1;">Kayıt No:</div>
              <q-input 
                v-model="selectedIslemDetay.islemNo" 
                outlined 
                dense 
                readonly
                class="form-input readonly-field"
                        style="min-width: 90px; max-width: 90px;"
              />
            </div>
                    <!-- Kullanıcı -->
                    <div class="row items-center q-gutter-xs">
                      <q-input 
                        v-model="selectedIslemDetay.islemKllnc" 
                        outlined 
                        dense 
                        readonly
                        class="form-input readonly-field"
                        style="min-width: 100px; max-width: 100px;"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
        
                 <q-card-section>
           <q-form ref="islemDetayFormRef">
             <div class="row q-col-gutter-lg">
               <!-- Sol Taraf - Ana Form Elementleri -->
               <div :class="showKaynakIslemContainer ? 'col-12 col-md-6' : 'col-12'" 
                    :style="!showKaynakIslemContainer ? `width: ${Math.round(modalWidth * 1)}px` : ''">
                 <!-- Middle Container - 10 Form Elements -->
                 <div class="middle-container">
                   <div class="row q-col-gutter-sm">
             
             <!-- Kayıt Tarihi -->
             <div class="col-12 col-sm-6">
               <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">Kayıt Tarihi:</div>
               <q-input 
                 v-model="selectedIslemDetay.iKytTarihi" 
                 outlined 
                 dense 
                 class="form-input"
                 readonly
                 required
                 :rules="[val => !!val || 'Kayıt tarihi zorunludur']"
               >
                 <template v-slot:append>
                   <q-icon 
                     name="event" 
                     class="cursor-pointer"
                     :class="{ 'text-grey-6': isArchiveMode }"
                   >
                     <q-popup-proxy cover transition-show="scale" transition-hide="scale" ref="datePopup">
                       <q-date 
                         v-model="selectedIslemDetay.iKytTarihi" 
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
             </div>
             
                       <!-- Satış Kanalı -->
            <div class="col-12 col-sm-6">
                         <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">Satış Kanalı:</div>
                         <q-select
                           v-model="selectedIslemDetay.islemOzel4"
                           :options="satisKanallari"
                outlined 
                dense 
                           class="form-input"
                           :readonly="isArchiveMode"
                           use-input
                           input-debounce="300"
                           @filter="onSatisKanaliFilter"
              />
            </div>
             
             <!-- Konaklama Tipi -->
             <div class="col-12 col-sm-6">
               <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">Konaklama Tipi:</div>
               <q-select
                 v-model="selectedIslemDetay.islemOzel1"
                 :options="konaklamaTipleri"
                 outlined
                 dense
                 class="form-input"
                 :readonly="isArchiveMode"
                 use-input
                 input-debounce="300"
                 @filter="onKonaklamaTipiFilter"
               />
             </div>
             
            <!-- Oda - Yatak -->
            <div class="col-12 col-sm-6">
              <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">Oda - Yatak:</div>
              <q-input 
                v-model="selectedIslemDetay.islemOzel3" 
                outlined 
                dense 
                :readonly="isArchiveMode"
                class="form-input readonly-field"
                           style="min-width: 120px;"
              />
            </div>
             
                       <!-- İşlem Grubu -->
             <div class="col-12 col-sm-6">
                       <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">İşlem Grubu:</div>
               <q-select
                       v-model="selectedIslemDetay.islemGrup"
                       :options="islemGruplari"
                 outlined
                 dense
                           class="form-input islem-grup-combo"
                 :readonly="isArchiveMode"
                 use-input
                 input-debounce="300"
                           hide-selected
                           fill-input
                           required
                           :rules="[val => !!val || 'İşlem grubu zorunludur']"
                           @filter="onIslemGrupFilter"
                           @update:model-value="onIslemGrupChange"
                         />
                       </div>
                       
                       <!-- Cari Hesap Adı -->
                       <div class="col-12 col-sm-6">
                         <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">Cari Hesap Adı:</div>
                         <q-select
                           v-model="selectedIslemDetay.islemAltG"
                           :options="cariHesaplar"
                           outlined
                           dense
                           class="form-input cari-hesap-combo"
                           :readonly="isArchiveMode"
                           use-input
                           input-debounce="300"
                           hide-selected
                           fill-input
                           required
                           :rules="[val => !!val || 'Cari hesap adı zorunludur']"
                           @filter="onCariHesapFilter"
                           @update:model-value="onCariHesapChange"
               />
             </div>
             
             <!-- İşlem Aracı -->
             <div class="col-12 col-sm-6">
               <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">İşlem Aracı:</div>
               <q-select
                 v-model="selectedIslemDetay.islemArac"
                 :options="islemAraclari"
                 outlined
                 dense
                 class="form-input"
                 :readonly="isArchiveMode"
                         required
                         :rules="[val => !!val || 'İşlem aracı zorunludur']"
                 @update:model-value="onIslemAraciChange"
               />
             </div>
             
             <!-- İşlem Tipi -->
             <div class="col-12 col-sm-6">
               <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">İşlem Tipi:</div>
               <q-select
                 v-model="selectedIslemDetay.islemTip"
                 :options="islemTipleri"
                 outlined
                 dense
                 class="form-input"
                 :readonly="isArchiveMode"
                         required
                         :rules="[val => !!val || 'İşlem tipi zorunludur']"
                 @update:model-value="onIslemTipChange"
                   />
                 </div>
                 
                 <!-- İşlem Açıklaması -->
                       <div class="col-12 col-sm-8">
                   <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">İşlem Açıklaması:</div>
                   <q-input 
                     v-model="selectedIslemDetay.islemBilgi" 
                     outlined 
                     dense 
                         class="form-input description-field"
                     type="textarea"
                         rows="3"
                         :readonly="isArchiveMode"
                         required
                         :rules="[val => !!val || 'İşlem açıklaması zorunludur']"
                   />
                 </div>
                 
                 <!-- İşlem Tutarı -->
                       <div class="col-12 col-sm-4">
                   <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">İşlem Tutarı:</div>
                   <q-input 
                     v-model="selectedIslemDetay.islemTutar" 
                     outlined 
                     dense 
                         class="form-input amount-field"
                     type="number"
                     step="0.01"
                         :readonly="isArchiveMode"
                         required
                         :rules="[val => !!val || 'İşlem tutarı zorunludur']"
                         style="min-width: 100px;"
                   />
                 </div>
               </div>
                 </div>
               </div>
                               <!-- Sağ Taraf - Kaynak İşlem (Readonly Display) -->
                <div class="col-12 col-md-6" v-if="showKaynakIslemContainer">
                  <!-- Header Container - Kayıt No ve Kullanıcı -->
                <div class="header-container q-mb-md">
                  <div class="row items-center q-gutter-md justify-end">
                    <div class="text-h8 text-weight-bold q-mb-mx" style="text-align: left;">Kaydın, Kaynak İşlem Bilgileri</div>
                      <!-- Kayıt No -->
                      <div class="row items-center q-gutter-xs">
                        <div class="text-subtitle2 text-weight-medium" style="line-height: 1;">Kayıt No:</div>
                        <q-input
                          v-model="kaynakIslemDetay.islemNo"
                          outlined
                          dense
                          readonly
                          class="form-input readonly-field"
                          style="min-width: 90px; max-width: 90px;"
                        />
                      </div>
                      <!-- Kullanıcı -->
                      <div class="row items-center q-gutter-xs">
                        <q-input
                          v-model="kaynakIslemDetay.islemKllnc"
                          outlined
                          dense
                          readonly
                          class="form-input readonly-field"
                                                  :style="{
                          'min-width': '100px',
                          'max-width': '100px',
                          ...getFieldStyle('islemKllnc').style
                        }"
                        :class="getFieldStyle('islemKllnc').class"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <!-- Middle Container - 10 Form Elements -->
                  <div class="middle-container">
                    <div class="row q-col-gutter-sm">
                    
                    <!-- Kayıt Tarihi -->
                    <div class="col-12 col-sm-6">
                      <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">Kayıt Tarihi:</div>
                      <q-input 
                        v-model="kaynakIslemDetay.iKytTarihi" 
                        outlined 
                        dense 
                        class="form-input readonly-field"
                        readonly
                        :style="getFieldStyle('iKytTarihi').style"
                        :class="getFieldStyle('iKytTarihi').class"
                      />
                    </div>
                    
                    <!-- Satış Kanalı -->
                    <div class="col-12 col-sm-6">
                      <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">Satış Kanalı:</div>
                      <q-input
                        v-model="kaynakIslemDetay.islemOzel4"
                        outlined
                        dense
                        class="form-input readonly-field"
                        readonly
                        :style="getFieldStyle('islemOzel4').style"
                        :class="getFieldStyle('islemOzel4').class"
                      />
                    </div>
                   
                   <!-- Konaklama Tipi -->
                   <div class="col-12 col-sm-6">
                     <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">Konaklama Tipi:</div>
                                          <q-input
                       v-model="kaynakIslemDetay.islemOzel1"
                       outlined
                       dense
                       class="form-input readonly-field"
                       readonly
                       :style="getFieldStyle('islemOzel1').style"
                        :class="getFieldStyle('islemOzel1').class"
                     />
                   </div>
                   
                   <!-- Oda - Yatak -->
                   <div class="col-12 col-sm-6">
                     <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">Oda - Yatak:</div>
                                          <q-input
                       v-model="kaynakIslemDetay.islemOzel3"
                       outlined
                       dense
                       class="form-input readonly-field"
                       readonly
                       :style="getFieldStyle('islemOzel3').style"
                        :class="getFieldStyle('islemOzel3').class"
               />
             </div>
             
             <!-- İşlem Grubu -->
             <div class="col-12 col-sm-6">
               <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">İşlem Grubu:</div>
                                          <q-input
                       v-model="kaynakIslemDetay.islemGrup"
                 outlined
                 dense
                       class="form-input readonly-field"
                       readonly
                       :style="getFieldStyle('islemGrup').style"
                        :class="getFieldStyle('islemGrup').class"
               />
             </div>
             
             <!-- Cari Hesap Adı -->
             <div class="col-12 col-sm-6">
               <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">Cari Hesap Adı:</div>
                     <q-input
                       v-model="kaynakIslemDetay.islemAltG"
                 outlined
                 dense
                       class="form-input readonly-field"
                       readonly
                       :style="getFieldStyle('islemAltG').style"
                        :class="getFieldStyle('islemAltG').class"
               />
             </div>
             
                   <!-- İşlem Aracı -->
             <div class="col-12 col-sm-6">
                     <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">İşlem Aracı:</div>
                     <q-input
                       v-model="kaynakIslemDetay.islemArac"
                       outlined
                       dense
                       class="form-input readonly-field"
                       readonly
                       :style="getFieldStyle('islemArac').style"
                       :class="getFieldStyle('islemArac').class"
                     />
                   </div>
                   
                   <!-- İşlem Tipi -->
                   <div class="col-12 col-sm-6">
                     <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">İşlem Tipi:</div>
                     <q-input
                       v-model="kaynakIslemDetay.islemTip"
                       outlined
                       dense
                       class="form-input readonly-field"
                       readonly
                       :style="getFieldStyle('islemTip').style"
                       :class="getFieldStyle('islemTip').class"
                     />
                   </div>
                   
                   <!-- İşlem Açıklaması -->
                   <div class="col-12 col-sm-8">
               <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">İşlem Açıklaması:</div>
               <q-input 
                       v-model="kaynakIslemDetay.islemBilgi"
                 outlined 
                 dense 
                 type="textarea"
                       rows="3"
                       class="form-input description-field readonly-field"
                       readonly
                       :style="getFieldStyle('islemBilgi').style"
                       :class="getFieldStyle('islemBilgi').class"
               />
             </div>
             
             <!-- İşlem Tutarı -->
                   <div class="col-12 col-sm-4">
               <div class="text-subtitle2 text-weight-medium q-mb-xs form-label">İşlem Tutarı:</div>
               <q-input 
                       v-model="kaynakIslemDetay.islemTutar"
                 outlined 
                 dense 
                 type="number"
                       class="form-input amount-field readonly-field"
                       readonly
                       :style="getFieldStyle('islemTutar').style"
                       :class="getFieldStyle('islemTutar').class"
               />
             </div>
                    
           </div>
                  </div>
                </div>
             </div>
           </q-form>
         </q-card-section>
        

        
        <!-- Bottom Container - Buttons -->
        <div class="bottom-container">
          <q-card-actions align="center">
          <q-btn 
              label="Kaydet" 
            color="primary" 
              icon="save"
              @click="onKaydet"
            :disabled="isArchiveMode"
            class="q-mr-sm"
          />
            
          <q-btn 
            label="Sil" 
            color="negative" 
              icon="delete"
            @click="onDeleteIslem"
            :disabled="isArchiveMode || showKaynakIslemContainer"
            :title="showKaynakIslemContainer ? 'Kaynak işlem bilgileri görünür iken silme işlemi yapılamaz' : 'İşlemi sil'"
              class="q-mr-sm delete-btn"
          />
          <q-btn 
            label="Vazgeç" 
            color="grey" 
            icon="close"
              @click="closeBothForms"
          />
        </q-card-actions>
          <q-card-actions align="center">
            <q-btn
              label="RESET" 
              color="warning" 
              icon="restore"
              @click="onReset"
              :disabled="!showKaynakIslemContainer || isArchiveMode"
              :title="!showKaynakIslemContainer ? 'Kaynak işlem bilgileri görünür olmalıdır' : 'İşlemi orijinal verilerle RESETle'"
              class="q-mr-sm"
            />
            <q-btn 
              :label="isArchiveMode ? 'GERİ AL' : 'ARŞİV'" 
              :color="isArchiveMode ? 'positive' : 'info'"
              :icon="isArchiveMode ? 'restore' : 'archive'"
              @click="onArchiveForm"
              :disabled="showKaynakIslemContainer"
              :title="showKaynakIslemContainer ? 'Kaynak işlem bilgileri görünür iken arşiv işlemi yapılamaz' : 'İşlemi arşivle'"
            />
          </q-card-actions>
        </div>
      </q-card>
    </div>
    </q-dialog>



  <!-- Kasa Devret Onay Dialogu -->
  <q-dialog v-model="showKasaDevretDialog">
    <q-card style="min-width: 420px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-subtitle1 text-weight-bold">DİKKAT</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <q-card-section>
        <div class="q-mb-md">
          GÜNCEL NAKİT KASA BAKİYESİ : <span class="text-weight-bold">{{ formatCurrency(currentBakiye) }} TL</span>. TESLİM ALMAK ÜZERESİNİZ!
        </div>
        <div class="text-center text-weight-bold text-uppercase" style="letter-spacing: 3px;">
          SAYARAK TESLİM ALDIĞINIZI ONAYLIYOR MUSUNUZ?
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Evet" color="primary" @click="onKasaDevretOnayla" />
        <q-btn flat label="Hayır" color="negative" @click="() => { showKasaDevretDialog = false }" />
      </q-card-actions>
    </q-card>
  </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, getCurrentInstance, reactive, nextTick } from 'vue'
import { useQuasar, Notify } from 'quasar'
import type { QTableColumn } from 'quasar'
import { isAxiosError } from 'axios'
import type { AxiosResponse } from 'axios'
import { api as apiInstance } from '../boot/axios'
import { api } from '../boot/axios'

function debugLog(...args: unknown[]) {
  if (import.meta.env.MODE !== 'production') {
    console.log(...args)
  }
}

const $q = useQuasar()

// Axios instance'ını al
const instance = getCurrentInstance()
const $api = instance?.proxy?.$api

// $api undefined ise hata fırlat
if (!$api) {
  throw new Error('API instance bulunamadı')
}

// Reactive state
const selectedIslemTuru = ref('cari')
const selectedIslemYonu = ref('gelir')
const loading = ref(false)
const detailLoading = ref(false)
const selectedDate = ref('')

interface TableRow {
  tarih: string
  gelir: number
  gider: number
  bakiye: number
}

interface IslemDetay {
  islemNo: number;
  iKytTarihi: string;
  islemKllnc: string;
  islemOzel1: string;
  islemOzel2: string;
  islemOzel3: string;
  islemOzel4: string;
  islemBirim: string;
  islemDoviz: string;
  islemKur: number;
  islemBilgi: string;
  islemCrKod: string;
  islemArac: string;
  islemTip: string;
  islemGrup: string;
  islemAltG: string;
  islemMiktar: number;
  islemTutar: number;
}

  // Detay tablo PDF indirme
  async function downloadKasaDetayPDF() {
    try {
      kasaPdfLoading.value = true
      const params = new URLSearchParams({
        tarih: selectedDate.value || '',
        islemTuru: selectedIslemTuru.value,
        islemYonu: islemYonuForApi.value,
        selectedYonu: selectedIslemYonu.value
      })
      const response: AxiosResponse<Blob> = await apiInstance.get(`/islem/detay-pdf?${params.toString()}`, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kasa-detay-${selectedDate.value || 'tum'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      /* ignore */
    } finally {
      kasaPdfLoading.value = false
    }
  }

  // Detay tablo Excel indirme
  async function downloadKasaDetayExcel() {
    try {
      kasaExcelLoading.value = true
      const params = new URLSearchParams({
        tarih: selectedDate.value || '',
        islemTuru: selectedIslemTuru.value,
        islemYonu: islemYonuForApi.value,
        selectedYonu: selectedIslemYonu.value
      })
      const response: AxiosResponse<Blob> = await apiInstance.get(`/islem/detay-excel?${params.toString()}`, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kasa-detay-${selectedDate.value || 'tum'}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      /* ignore */
    } finally {
      kasaExcelLoading.value = false
    }
  }

interface KasaDevirRow {
  nKasaNo?: number
  DevirTarihi: string
  DevirEden: string
  KasaYekun: number
  rowKey?: string
}

const tableData = ref<TableRow[]>([])
const detailTableData = ref<IslemDetay[]>([])

// Tüm veriyi saklamak için
const allTableData = ref<TableRow[]>([])
const allDetailTableData = ref<IslemDetay[]>([])

  // Rapor indirme durumları
  const kasaPdfLoading = ref(false)
  const kasaExcelLoading = ref(false)

// Kasa devir verileri
const kasaDevirData = ref<KasaDevirRow[]>([])
const kasaDevirLoading = ref(false)
const showKasaDevretDialog = ref(false)

// İşlem detay form modal için
const showIslemDetayDialog = ref(false)

// Kaynak işlem container görünürlüğü için
const showKaynakIslemContainer = ref(false)

// Arşiv modu için gerekli değişkenler
const isArchiveMode = ref(false)
const currentArchiveRecord = ref<IslemDetay | null>(null)

// İşlem detay modal gezdirme için
const islemDetayModalRef = ref<HTMLElement | null>(null)
const islemDetayFormRef = ref()
const datePopup = ref()

const islemDetayModalPos = reactive({ x: 0, y: 0 })
const islemDetayModalDragging = ref(false)
const islemDetayModalOffset = reactive({ x: 0, y: 0 })

// Modal açıldığında otomatik olarak merkeze konumlandır
watch(showIslemDetayDialog, (newValue) => {
  if (newValue) {
    // Modal'ı ekranın merkezine konumlandır - dinamik genişlik kullan
    const currentWidth = modalWidth.value;
    islemDetayModalPos.x = Math.max(0, (window.innerWidth - currentWidth) / 2);
    islemDetayModalPos.y = Math.max(0, (window.innerHeight - 400) / 2);
    islemDetayModalDragging.value = false;
    
    // Modal render edildikten sonra gerçek genişliği kullanarak pozisyonu yeniden hesapla
    void nextTick(() => {
      if (islemDetayModalRef.value) {
        const actualWidth = islemDetayModalRef.value.offsetWidth;
        islemDetayModalPos.x = Math.max(0, (window.innerWidth - actualWidth) / 2);
      }
    });
  }
})

// showKaynakIslemContainer değiştiğinde modal genişliğini güncelle ve yeniden konumlandır
        watch(showKaynakIslemContainer, () => {
          if (showIslemDetayDialog.value) {
            // Modal açıksa genişlik değişikliğini uygula ve yeniden konumlandır
            void nextTick(() => {
              const currentWidth = modalWidth.value;
              islemDetayModalPos.x = Math.max(0, (window.innerWidth - currentWidth) / 2);
            });
          }
        })

const islemDetayModalStyle = computed(() => {
  return islemDetayModalDragging.value || islemDetayModalPos.x !== 0 || islemDetayModalPos.y !== 0
    ? `position: fixed; left: ${islemDetayModalPos.x}px; top: ${islemDetayModalPos.y}px; z-index: 9999;` : '';
})

// Dinamik modal genişliği hesaplama
const modalWidth = computed(() => {
  if (!showKaynakIslemContainer.value) {
    // Container'lar gizliyse %30 daralt
    return Math.round(1400 * 0.5); // 1400 * 0.5 = 700px
  }
  return 1400; // Normal genişlik
})

function onIslemDetayDragStart(e: MouseEvent | TouchEvent) {
  e.preventDefault();
  e.stopPropagation();
  islemDetayModalDragging.value = true;
  
  let clientX = 0, clientY = 0;
  if (e instanceof MouseEvent) {
    clientX = e.clientX;
    clientY = e.clientY;
    document.addEventListener('mousemove', onIslemDetayDragMove);
    document.addEventListener('mouseup', onIslemDetayDragEnd);
  } else if (e instanceof TouchEvent) {
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    document.addEventListener('touchmove', onIslemDetayDragMove);
    document.addEventListener('touchend', onIslemDetayDragEnd);
  }
  
  // Modal'ın mevcut pozisyonunu al
  const modalElement = islemDetayModalRef.value;
  if (modalElement) {
    const rect = modalElement.getBoundingClientRect();
    islemDetayModalOffset.x = clientX - rect.left;
    islemDetayModalOffset.y = clientY - rect.top;
  } else {
    // Fallback: mevcut pozisyonu kullan
    islemDetayModalOffset.x = clientX - islemDetayModalPos.x;
    islemDetayModalOffset.y = clientY - islemDetayModalPos.y;
  }
}

function onIslemDetayDragMove(e: MouseEvent | TouchEvent) {
  if (!islemDetayModalDragging.value) return;
  e.preventDefault();
  e.stopPropagation();
  
  let clientX = 0, clientY = 0;
  if (e instanceof MouseEvent) {
    clientX = e.clientX;
    clientY = e.clientY;
  } else if (e instanceof TouchEvent) {
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
  }
  
  // Yeni pozisyonu hesapla
  const newX = clientX - islemDetayModalOffset.x;
  const newY = clientY - islemDetayModalOffset.y;
  
  // Ekran sınırlarını kontrol et - dinamik modal genişliğini kullan
  const currentModalWidth = modalWidth.value;
  const maxX = Math.max(0, window.innerWidth - currentModalWidth);
  const maxY = Math.max(0, window.innerHeight - 400); // modal yüksekliği
  
  islemDetayModalPos.x = Math.max(0, Math.min(newX, maxX));
  islemDetayModalPos.y = Math.max(0, Math.min(newY, maxY));
}

function onIslemDetayDragEnd() {
  islemDetayModalDragging.value = false;
  document.removeEventListener('mousemove', onIslemDetayDragMove);
  document.removeEventListener('mouseup', onIslemDetayDragEnd);
  document.removeEventListener('touchmove', onIslemDetayDragMove);
  document.removeEventListener('touchend', onIslemDetayDragEnd);
}



const selectedIslemDetay = ref<IslemDetay>({
  islemNo: 0,
  iKytTarihi: '',
  islemKllnc: '',
  islemOzel1: '',
  islemOzel2: '',
  islemOzel3: '',
  islemOzel4: '',
  islemBirim: '',
  islemDoviz: '',
  islemKur: 0,
  islemBilgi: '',
  islemCrKod: '',
  islemArac: '',
  islemTip: '',
  islemGrup: '',
  islemAltG: '',
  islemMiktar: 0,
  islemTutar: 0
})

// Kaynak İşlem için boş değerler - form yüklenirken boş kalacak
const kaynakIslemDetay = ref<IslemDetay>({
  islemNo: 0,
  iKytTarihi: '',
  islemKllnc: '',
  islemOzel1: '',
  islemOzel2: '',
  islemOzel3: '',
  islemOzel4: '',
  islemBirim: '',
  islemDoviz: '',
  islemKur: 0,
  islemBilgi: '',
  islemCrKod: '',
  islemArac: '',
  islemTip: '',
  islemGrup: '',
  islemAltG: '',
  islemMiktar: 0,
  islemTutar: 0
})



// Orijinal değerleri saklamak için
const originalIslemArac = ref('')
const originalIslemTip = ref('')

// Combo box listeleri
const konaklamaTipleri = ref(['GÜNLÜK', 'HAFTALIK', 'AYLIK'])
const satisKanallari = ref<string[]>([])
// İşlem araçları - 5 seçenek sabit (Depozito yok)
const islemAraclari = ref(['Cari İşlem', 'Nakit Kasa(TL)', 'Kredi Kartları', 'Banka EFT', 'Acenta Tahsilat'])
const islemTipleri = ref<string[]>([])
const islemGruplari = ref<string[]>([])
const cariHesaplar = ref<string[]>([])

// Orijinal verileri saklamak için ref'ler
const originalSatisKanallari = ref<string[]>([])

// İşlem aracı değiştiğinde
const onIslemAraciChange = () => {
  // 1. İşlem tipi listesini güncelle
  if (selectedIslemDetay.value.islemArac === 'Cari İşlem') {
    islemTipleri.value = ['GELİR', 'GİDER']
  } else {
    // Diğer 4 seçenek için: Gelir-Gider
    islemTipleri.value = ['Giren', 'Çıkan']
  }
  
  // 2. Cache sistemi - basit mantık
  if (selectedIslemDetay.value.islemArac === originalIslemArac.value) {
    // Seçilen değer cache'lenen değer ise, işlem tipi cache değeri default yazılacak
    selectedIslemDetay.value.islemTip = originalIslemTip.value
  } else {
    // Yeni değer seçildiyse, işlem tipi boş bırakılacak
    selectedIslemDetay.value.islemTip = ''
  }
}

// İşlem tipi değiştiğinde - HİÇBİR ŞEY YAPILMAYACAK
const onIslemTipChange = () => {
  // Boş fonksiyon - hiçbir işlem yapılmıyor
}

// Filter fonksiyonları
const onKonaklamaTipiFilter = (val: string, update: (callback: () => void) => void) => {
  if (val === '') {
    update(() => {})
    return
  }
  update(() => {
    konaklamaTipleri.value = ['GÜNLÜK', 'HAFTALIK', 'AYLIK'].filter(
      tip => tip.toLowerCase().includes(val.toLowerCase())
    )
  })
}

const onSatisKanaliFilter = (val: string, update: (callback: () => void) => void) => {
  if (val === '') {
    update(() => {
      // Boş değer için orijinal listeyi geri yükle
      satisKanallari.value = [...originalSatisKanallari.value]
    })
    return
  }
  update(() => {
    // Filtrelenmiş sonuçları göster
    satisKanallari.value = originalSatisKanallari.value.filter(
      kanal => kanal.toLowerCase().includes(val.toLowerCase())
    )
  })
}

// Orijinal verileri saklamak için ref'ler
const originalIslemGruplari = ref<string[]>([])
const originalCariHesaplar = ref<string[]>([])

const onIslemGrupFilter = (val: string, update: (callback: () => void) => void) => {
  if (val === '') {
    update(() => {
      // Boş değer için orijinal listeyi geri yükle
      islemGruplari.value = [...originalIslemGruplari.value]
    })
    return
  }
  update(() => {
    // Filtrelenmiş sonuçları göster
    islemGruplari.value = originalIslemGruplari.value.filter(
      grup => grup.toLowerCase().includes(val.toLowerCase())
    )
  })
}

const onCariHesapFilter = (val: string, update: (callback: () => void) => void) => {
  if (val === '') {
    update(() => {
      // Boş değer için orijinal listeyi geri yükle
      cariHesaplar.value = [...originalCariHesaplar.value]
    })
    return
  }
  update(() => {
    // Filtrelenmiş sonuçları göster
    cariHesaplar.value = originalCariHesaplar.value.filter(
      cari => cari.toLowerCase().includes(val.toLowerCase())
    )
  })
}

// İşlem grubu değişiklik kontrolü
const onIslemGrupChange = (val: string) => {
  // Seçilen değer geçerli listede yoksa temizle
  if (val && !islemGruplari.value.includes(val)) {
    selectedIslemDetay.value.islemGrup = ''
  }
}

// Cari hesap değişiklik kontrolü
const onCariHesapChange = (val: string) => {
  // Seçilen değer geçerli listede yoksa temizle
  if (val && !cariHesaplar.value.includes(val)) {
    selectedIslemDetay.value.islemAltG = ''
  }
}

// Combo box verilerini yükle
const loadComboBoxData = async () => {
  try {
    // İşlem grupları - tblislem tablosundan distinct listesi
    const islemGruplariResponse = await api.get('/islem/islem-gruplari')
    if (islemGruplariResponse.data.success) {
      islemGruplari.value = islemGruplariResponse.data.data
      originalIslemGruplari.value = [...islemGruplariResponse.data.data]
    } else {
      // Fallback olarak varsayılan değerler
      islemGruplari.value = ['Konaklama', 'Ek Hizmet']
      originalIslemGruplari.value = ['Konaklama', 'Ek Hizmet']
    }
    
    // Cari hesaplar
    const cariHesaplarResponse = await api.get('/islem/cari-hesaplar')
    if (cariHesaplarResponse.data.success) {
      cariHesaplar.value = cariHesaplarResponse.data.data
      originalCariHesaplar.value = [...cariHesaplarResponse.data.data]
    }
    
    // Satış kanalları (musteri-islem sayfasındaki ile aynı)
    satisKanallari.value = ['AGODA', 'AIRBNB', 'BOOKING', 'DIRECT PLUS', 'EXPEDIA', 'HOTEL COLLECT', 'HOTEL RUNNER', 'KAPIDAN', 'ONLINE']
    originalSatisKanallari.value = [...satisKanallari.value]
  } catch (error) {
    console.error('❌ Combo box verileri yükleme hatası:', error)
    // Hata durumunda varsayılan değerler
    islemGruplari.value = ['Konaklama', 'Ek Hizmet']
    originalIslemGruplari.value = ['Konaklama', 'Ek Hizmet']
  }
}

// Kasa devir pagination ayarları
const kasaDevirPagination = ref({
  sortBy: 'nKasaNo',
  descending: true,
  page: 1,
  rowsPerPage: 3,
  rowsNumber: 0
})

// Kasalar arası aktarım formu
const transferForm = ref({
  veren: '',
  alan: '',
  tutar: ''
})

// Kasa seçenekleri
const kasaOptions = [
  { label: 'Nakit', value: 'nakit' },
  { label: 'Kart', value: 'kart' },
  { label: 'EFT', value: 'eft' },
  { label: 'Acenta', value: 'acenta' }
  // { label: 'Depozito', value: 'depozito' } // Şimdilik gizli
]

// Başlangıç bakiye değerleri (backend'de kullanılıyor)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const baslangicBakiyeleri: Record<string, number> = {
  cari: 28738901,
  nakit: 87800,
  kart: 8008546,
  eft: 0,
  acenta: 0,
  depozito: 107695
}

// Tablo sütunları
const columns = computed((): QTableColumn[] => [
  {
    name: 'tarih',
    label: 'Tarih',
    field: 'tarih',
    align: 'left',
    sortable: true,
    style: 'width: 100px'
  },
  {
    name: 'gelir',
    label: firstOptionLabel.value,
    field: 'gelir',
    align: 'right',
    sortable: false,
    style: 'width: 100px'
  },
  {
    name: 'gider',
    label: secondOptionLabel.value,
    field: 'gider',
    align: 'right',
    sortable: false,
    style: 'width: 100px'
  },

])

// Kasa devir tablo sütunları (3 sütun)
const kasaDevirColumns = computed((): QTableColumn[] => [
  {
    name: 'DevirTarihi',
    label: 'Tarih',
    field: 'DevirTarihi',
    align: 'left',
    sortable: true,
    style: 'width: 120px'
  },
  {
    name: 'DevirEden',
    label: 'Devir E.',
    field: 'DevirEden',
    align: 'left',
    sortable: true,
    style: 'width: 150px'
  },
  {
    name: 'KasaYekun',
    label: 'Kasa Yekün',
    field: 'KasaYekun',
    align: 'right',
    sortable: true,
    style: 'width: 150px'
  }
])

// Pagination ayarları
const pagination = ref({
  sortBy: 'tarih',
  descending: true,
  page: 1,
  rowsPerPage: 7,
  rowsNumber: 100
})

// Detay tablo pagination ayarları
const detailPagination = ref({
  sortBy: 'islemNo',
  descending: true,
  page: 1,
  rowsPerPage: 15,
  rowsNumber: 100
})

// Ana tablo pagination request handler
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onRequest = (props: any) => {
  debugLog('🔍 Ana tablo pagination request:', props)
  
  // Pagination değişikliklerini uygula
  pagination.value = props.pagination
  // Sadece tarih sütunu DESC olarak kalacak
  pagination.value.sortBy = 'tarih'
  pagination.value.descending = true
}

// Detay tablo pagination request handler
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onDetailRequest = (props: any) => {
  debugLog('🔍 Detay tablo pagination request:', props)
  
  // Pagination değişikliklerini uygula
  detailPagination.value = props.pagination
  
  // Sıralama varsa verileri sırala
  if (props.pagination.sortBy) {
    const sortBy = props.pagination.sortBy
    const descending = props.pagination.descending
    
    // Verileri sırala
    allDetailTableData.value.sort((a: IslemDetay, b: IslemDetay) => {
      const sortKey = sortBy as keyof IslemDetay
      const aRaw = a[sortKey]
      const bRaw = b[sortKey]
      let aValue: string | number = aRaw !== undefined ? aRaw : (sortBy === 'islemTutar' || sortBy === 'islemNo' ? 0 : '')
      let bValue: string | number = bRaw !== undefined ? bRaw : (sortBy === 'islemTutar' || sortBy === 'islemNo' ? 0 : '')
      
      // Sayısal alanlar için numara kıyasla
      if (sortBy === 'islemTutar' || sortBy === 'islemNo') {
        aValue = parseFloat(String(aValue)) || 0
        bValue = parseFloat(String(bValue)) || 0
      } else {
        // Diğer sütunlar için string karşılaştırma
        aValue = String(aValue || '').toLowerCase()
        bValue = String(bValue || '').toLowerCase()
      }
      
      if (aValue < bValue) return descending ? 1 : -1
      if (aValue > bValue) return descending ? -1 : 1
      return 0
    })
  }
  
  // Sıralanmış verileri güncelle
  updateDetailTableData()
}

// Ana tablo sayfa değiştirme fonksiyonu
const changePage = (newPage: number) => {
  debugLog('🔍 Ana tablo sayfa değiştiriliyor:', newPage)
  pagination.value.page = newPage
  updateTableData()
}

// Detay tablo sayfa değiştirme fonksiyonu
const changeDetailPage = (newPage: number) => {
  debugLog('🔍 Detay tablo sayfa değiştiriliyor:', newPage)
  detailPagination.value.page = newPage
  updateDetailTableData()
}

// Ana tablo verilerini güncelle (15 satırlık parçalar halinde)
const updateTableData = () => {
  const startIndex = (pagination.value.page - 1) * pagination.value.rowsPerPage
  const endIndex = startIndex + pagination.value.rowsPerPage
  tableData.value = allTableData.value.slice(startIndex, endIndex)
  debugLog('🔍 Ana tablo güncellendi:', startIndex, 'to', endIndex, 'toplam:', allTableData.value.length)
}

// Detay tablo verilerini güncelle (15 satırlık parçalar halinde)
const updateDetailTableData = () => {
  const startIndex = (detailPagination.value.page - 1) * detailPagination.value.rowsPerPage
  const endIndex = startIndex + detailPagination.value.rowsPerPage
  detailTableData.value = allDetailTableData.value.slice(startIndex, endIndex)
  debugLog('🔍 Detay tablo güncellendi:', startIndex, 'to', endIndex, 'toplam:', allDetailTableData.value.length)
}

// Detay tablo satırına çift tık event handler
const onDetailRowDblClick = async (evt: Event, row: IslemDetay) => {
  console.log('🔍 Detay satırına çift tıklandı:', row)
  
  try {
    // Önce tblislemRST tablosunda islemNo kontrolü yap
    const rstCheckResponse = await api.get(`/islem/islem-rst-kontrol/${row.islemNo}`)
    
    if (rstCheckResponse.data.success) {
      const existsInRST = rstCheckResponse.data.exists
      
      if (!existsInRST) {
        // İşlem RST tablosunda bulunamadı - önce aktarım yap
        console.log('📤 İşlem RST tablosuna aktarılıyor...')
        const aktarimResponse = await api.post('/islem/islem-rst-aktar', {
          islemNo: row.islemNo
        })
        
        if (aktarimResponse.data.success) {
          console.log('✅ İşlem RST tablosuna başarıyla aktarıldı')
          
    // tblislem tablosundan veriyi getir
    const response = await api.get(`/islem/detay/${row.islemNo}`)
    
    if (response.data.success) {
            // Önce orijinal veriyi kaynak işlem detayına kopyala (değişiklik kontrolü için)
            kaynakIslemDetay.value = { ...response.data.data }
            console.log('✅ Orijinal veri kaynak işlem detayına kopyalandı:', kaynakIslemDetay.value)
            
            // Sonra form için veriyi ayarla
      selectedIslemDetay.value = response.data.data
      
      // Orijinal değerleri sakla
      originalIslemArac.value = response.data.data.islemArac
      originalIslemTip.value = response.data.data.islemTip
            
            // Sağdaki readonly container'ları gizle
            showKaynakIslemContainer.value = false
      
      showIslemDetayDialog.value = true
    } else {
      Notify.create({
        type: 'negative',
        message: 'İşlem detayı getirilemedi',
              position: 'top'
            })
          }
        } else {
          Notify.create({
            type: 'negative',
            message: 'İşlem RST tablosuna aktarılamadı',
            position: 'top'
          })
        }
      } else {
        // İşlem RST tablosunda mevcut - direkt aç
        console.log('✅ İşlem RST tablosunda mevcut, direkt açılıyor...')
        
        // tblislem tablosundan veriyi getir
        const response = await api.get(`/islem/detay/${row.islemNo}`)
        
        if (response.data.success) {
          selectedIslemDetay.value = response.data.data
          
          // Orijinal değerleri sakla
          originalIslemArac.value = response.data.data.islemArac
          originalIslemTip.value = response.data.data.islemTip
          
          // tblislemRST tablosundan kaynak işlem bilgilerini getir
          const rstResponse = await api.get(`/islem/islem-rst-detay/${row.islemNo}`)
          
          if (rstResponse.data.success) {
            // Kaynak işlem bilgilerini doldur
            kaynakIslemDetay.value = rstResponse.data.data
            console.log('✅ Kaynak işlem bilgileri dolduruldu:', kaynakIslemDetay.value)
          } else {
            console.warn('⚠️ Kaynak işlem bilgileri getirilemedi, boş bırakılıyor')
            // Kaynak işlem bilgilerini temizle
            kaynakIslemDetay.value = {
              islemNo: 0,
              iKytTarihi: '',
              islemKllnc: '',
              islemOzel1: '',
              islemOzel2: '',
              islemOzel3: '',
              islemOzel4: '',
              islemBirim: '',
              islemDoviz: '',
              islemKur: 0,
              islemBilgi: '',
              islemCrKod: '',
              islemArac: '',
              islemTip: '',
              islemGrup: '',
              islemAltG: '',
              islemMiktar: 0,
              islemTutar: 0
            }
          }
          
          // Sağdaki readonly container'ları göster
          showKaynakIslemContainer.value = true
          
          showIslemDetayDialog.value = true
        } else {
          Notify.create({
            type: 'negative',
            message: 'İşlem detayı getirilemedi',
            position: 'top'
          })
        }
      }
    } else {
      Notify.create({
        type: 'negative',
        message: 'İşlem RST kontrolü yapılamadı',
        position: 'top'
      })
    }
  } catch (error) {
    console.error('❌ İşlem detayı getirme hatası:', error)
    Notify.create({
      type: 'negative',
      message: 'İşlem detayı getirilemedi',
      position: 'top'
    })
  }
}

// Kaydet butonu event handler
const onKaydet = async () => {
  console.log('🔍 Kaydet butonu tıklandı:', selectedIslemDetay.value)
  console.log('🔍 Form ref mevcut mu:', !!islemDetayFormRef.value)
  console.log('🔍 selectedIslemDetay değeri:', selectedIslemDetay.value)

  if (!islemDetayFormRef.value) {
    console.error('❌ Form ref bulunamadı')
    return
  }

  if (!selectedIslemDetay.value) {
    console.error('❌ Seçili işlem detayı bulunamadı')
    return
  }

  try {
    // Form validasyonu
    const isValid = await islemDetayFormRef.value.validate()
    if (!isValid) {
      console.log('❌ Form validasyonu başarısız')
      return
    }

    console.log('✅ Form validasyonu başarılı, değişiklik kontrolü yapılıyor...')

    // Değişiklik kontrolü yap
    console.log('🔍 Değişiklik kontrolü çağrılıyor...')
    const hasChanges = checkForChanges()
    console.log('🔍 Değişiklik kontrolü sonucu:', hasChanges)
    
    if (!hasChanges) {
      console.log('ℹ️ Hiçbir değişiklik yapılmamış, sadece tblislemRST kaydı silinecek')
      
      // tblislemRST tablosundan ilgili kaydı sil
      try {
        const deleteResponse = await api.delete(`/islem/islem-rst-sil/${selectedIslemDetay.value.islemNo}`)
        
        if (deleteResponse.data.success) {
          console.log('✅ tblislemRST kaydı başarıyla silindi')
          
          // Modal'ı kapat
          showIslemDetayDialog.value = false
          
          // Tabloyu yenile
          await refreshData()
          
          // Bilgilendirme mesajı göster
          $q.notify({
            type: 'info',
            message: 'Herhangi bir değişiklik yapmadınız. Kaynak işlem bilgileri temizlendi.',
            position: 'top'
          })
        } else {
          console.warn('⚠️ tblislemRST kaydı silinemedi:', deleteResponse.data.message)
          $q.notify({
            type: 'warning',
            message: 'Kaynak işlem bilgileri temizlenemedi',
            position: 'top'
          })
        }
      } catch (deleteError) {
        console.error('❌ tblislemRST silme hatası:', deleteError)
        $q.notify({
      type: 'negative',
          message: 'Kaynak işlem bilgileri temizlenirken hata oluştu',
      position: 'top'
    })
      }
    return
  }
  
    console.log('✅ Değişiklik tespit edildi, güncelleme işlemi başlıyor...')

    // Aktif kullanıcı bilgisini al
    const username = localStorage.getItem('username') || 'Bilinmeyen Kullanıcı'
    console.log('👤 Aktif kullanıcı:', username)

    // Güncellenecek verileri hazırla
    const updateData = {
      iKytTarihi: selectedIslemDetay.value.iKytTarihi,
      islemKllnc: username,
      islemOzel1: selectedIslemDetay.value.islemOzel1,
      islemOzel2: selectedIslemDetay.value.islemOzel2,
      islemOzel3: selectedIslemDetay.value.islemOzel3,
      islemOzel4: selectedIslemDetay.value.islemOzel4,
      islemBirim: selectedIslemDetay.value.islemBirim,
      islemDoviz: selectedIslemDetay.value.islemDoviz,
      islemKur: selectedIslemDetay.value.islemKur,
      islemBilgi: selectedIslemDetay.value.islemBilgi,
      islemCrKod: selectedIslemDetay.value.islemCrKod,
      islemArac: selectedIslemDetay.value.islemArac,
      islemTip: selectedIslemDetay.value.islemTip,
      islemGrup: selectedIslemDetay.value.islemGrup,
      islemAltG: selectedIslemDetay.value.islemAltG,
      islemMiktar: selectedIslemDetay.value.islemMiktar,
      islemTutar: selectedIslemDetay.value.islemTutar
    }

    console.log('📤 Güncellenecek veriler:', updateData)

    // Backend'e güncelleme isteği gönder
    const response = await api.put(`/islem/guncelle/${selectedIslemDetay.value.islemNo}`, updateData)
    
    console.log('✅ Backend yanıtı:', response.data)

    if (response.data.success) {
      // Başarılı güncelleme sonrası işlemler
      console.log('✅ İşlem başarıyla güncellendi')
      
      // Modal'ı kapat
      showIslemDetayDialog.value = false
      
      // Tabloyu yenile
      await refreshData()
      
      // Başarı mesajı göster
      $q.notify({
        type: 'positive',
        message: 'İşlem başarıyla güncellendi!',
        position: 'top'
      })
    } else {
      console.error('❌ Backend güncelleme başarısız:', response.data.message)
      $q.notify({
      type: 'negative',
        message: `Güncelleme başarısız: ${response.data.message}`,
      position: 'top'
    })
    }

  } catch (error: unknown) {
    console.error('❌ Kaydetme hatası:', error)
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata oluştu'
    
    $q.notify({
      type: 'negative',
      message: `Kaydetme hatası: ${errorMessage}`,
      position: 'top'
    })
  }
}

// Sil butonu event handler
const onDeleteIslem = async () => {
  if (!selectedIslemDetay.value) {
    console.error('❌ Seçili işlem detayı bulunamadı')
    return
  }
  
  try {
    console.log('🗑️ Silme işlemi başlıyor... islemNo:', selectedIslemDetay.value.islemNo)

    // Önce tblislemRST tablosunda kayıt var mı kontrol et ve sil
    if (selectedIslemDetay.value.islemNo) {
      try {
        console.log('🔍 tblislemRST kaydı aranıyor...')
        const rstResponse = await api.delete(`/islem/islem-rst-sil/${selectedIslemDetay.value.islemNo}`)
        if (rstResponse.data.success) {
          console.log('✅ tblislemRST kaydı silindi:', selectedIslemDetay.value.islemNo)
        }
      } catch (rstError) {
        console.log('ℹ️ tblislemRST kaydı bulunamadı veya silinemedi:', rstError)
      }
    }

           // Aktif kullanıcı bilgisini al
       const username = localStorage.getItem('username') || 'Bilinmeyen Kullanıcı'
       console.log('👤 Aktif kullanıcı (SİL):', username)

       // Backend'e silme isteği gönder (username ile birlikte)
       const response = await api.post(`/islem/sil/${selectedIslemDetay.value.islemNo}`, { username })
    
    console.log('✅ Silme yanıtı:', response.data)

    if (response.data.success) {
      // Başarılı silme sonrası işlemler
      console.log('✅ İşlem başarıyla arşivlendi ve silindi')
      
      // Modal'ı kapat
      showIslemDetayDialog.value = false
      
      // Tabloyu yenile
      await refreshData()
      
      // Başarı mesajı göster
      $q.notify({
    type: 'positive',
        message: 'İşlem başarıyla arşivlendi ve silindi!',
        position: 'top'
      })
    } else {
      console.error('❌ Backend silme başarısız:', response.data.message)
      $q.notify({
        type: 'negative',
        message: `Silme başarısız: ${response.data.message}`,
    position: 'top'
  })
}

  } catch (error: unknown) {
    console.error('❌ Silme hatası:', error)
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata oluştu'
    
    $q.notify({
      type: 'negative',
      message: `Silme hatası: ${errorMessage}`,
      position: 'top'
    })
  }
}

// Reset butonu event handler
const onReset = async () => {
  if (!selectedIslemDetay.value) {
    console.error('❌ Seçili işlem detayı bulunamadı')
    return
  }
  
  try {
    console.log('🔄 Reset işlemi başlıyor... islemNo:', selectedIslemDetay.value.islemNo)

    // Backend'e reset isteği gönder
    const response = await api.post('/islem/islem-rst-reset', {
      islemNo: selectedIslemDetay.value.islemNo
    })
    
    console.log('✅ Reset yanıtı:', response.data)

    if (response.data.success) {
      // Başarılı reset sonrası işlemler
      console.log('✅ İşlem başarıyla reset edildi')
      
      // tblislemRST tablosundan ilgili kaydı sil
      try {
        console.log('🗑️ tblislemRST tablosundan kayıt siliniyor...')
        const deleteResponse = await api.delete(`/islem/islem-rst-sil/${selectedIslemDetay.value.islemNo}`)
        
        if (deleteResponse.data.success) {
          console.log('✅ İşlem RST tablosundan başarıyla silindi')
        } else {
          console.warn('⚠️ İşlem RST tablosundan silinemedi:', deleteResponse.data.message)
        }
      } catch (deleteError) {
        console.error('❌ İşlem RST silme hatası:', deleteError)
      }
      
      // Modal'ı kapat
      showIslemDetayDialog.value = false
      
      // Tabloyu yenile
      await refreshData()
      
      // Başarı mesajı göster
      $q.notify({
    type: 'positive',
        message: 'İşlem Kaydı Bilgileri Orijinal Verilerle RESETlenmiştir!',
        position: 'top'
      })
    } else {
      console.error('❌ Backend reset başarısız:', response.data.message)
      $q.notify({
        type: 'negative',
        message: `Reset başarısız: ${response.data.message}`,
    position: 'top'
  })
}

  } catch (error: unknown) {
    console.error('❌ Reset hatası:', error)
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata oluştu'
    
    $q.notify({
      type: 'negative',
      message: `Reset hatası: ${errorMessage}`,
      position: 'top'
    })
  }
}

// Arşiv butonu event handler
const onArchiveForm = async () => {
  try {
    // ARŞİV butonuna basıldığında, tblislemRST tablosunda islemNo = Kayıt No olan kaydı sil
    if (selectedIslemDetay.value?.islemNo) {
      try {
        console.log('🗑️ tblislemRST kaydı siliniyor, islemNo:', selectedIslemDetay.value.islemNo)
        const deleteResponse = await api.delete(`/islem/islem-rst-sil/${selectedIslemDetay.value.islemNo}`)
        
        if (deleteResponse.data.success) {
          console.log('✅ tblislemRST kaydı başarıyla silindi')
        } else {
          console.warn('⚠️ tblislemRST kaydı silinemedi:', deleteResponse.data.message)
        }
      } catch (deleteError) {
        console.warn('⚠️ tblislemRST kaydı silinirken hata oluştu:', deleteError)
        // Bu hata arşiv işlemini durdurmaz, sadece log'lanır
      }
    }

    if (!isArchiveMode.value) {
      // Arşiv modunu aktifleştir
      console.log('🔍 Arşiv modu aktifleştiriliyor...')
      
      // En büyük islemNo'ya sahip arşiv kaydını getir
      const response = await api.get('/islem/islem-arv-en-buyuk')
      
      if (response.data.success && response.data.sonuc) {
        console.log('✅ En büyük arşiv kaydı getirildi:', response.data.sonuc)
        
        // Arşiv modunu aktifleştir
        isArchiveMode.value = true
        currentArchiveRecord.value = response.data.sonuc
        
        // Sağdaki container'ları gizle (arşiv modunda sadece arşiv verileri görünsün)
        showKaynakIslemContainer.value = false
        
        // Form alanlarını readonly yap ve arşiv verisiyle doldur
        populateFormWithArchiveData(response.data.sonuc)
        
        // KAYDET ve SİL butonlarını pasif yap
        // (Bu butonlar template'te :disabled ile kontrol edilecek)
        
        console.log('✅ Arşiv modu aktifleştirildi, sağdaki container\'lar gizlendi')
      } else {
        console.warn('⚠️ Arşiv kaydı bulunamadı')
        $q.notify({
          type: 'warning',
          message: 'Arşiv kaydı bulunamadı',
          position: 'top'
        })
      }
    } else {
      // Arşiv modundan çık
      console.log('🔍 Arşiv modundan çıkılıyor...')
      
      // Mevcut arşiv kaydını tblislem tablosuna geri yükle
      if (currentArchiveRecord.value) {
        const response = await api.post('/islem/islem-arv-geri-yukle', {
          islemNo: currentArchiveRecord.value.islemNo
        })
        
        if (response.data.success) {
          console.log('✅ Arşiv kaydı başarıyla geri yüklendi')
          
          // Modal'ı kapat
          showIslemDetayDialog.value = false
          
          // Tabloyu yenile
          await refreshData()
          
          // Başarı mesajı göster
          $q.notify({
            type: 'positive',
            message: 'Arşiv kaydı başarıyla geri yüklendi!',
            position: 'top'
          })
        } else {
          console.error('❌ Arşiv kaydı geri yüklenemedi:', response.data.message)
          $q.notify({
            type: 'negative',
            message: `Geri yükleme başarısız: ${response.data.message}`,
            position: 'top'
          })
        }
      }
      
      // Arşiv modunu deaktifleştir
      isArchiveMode.value = false
      currentArchiveRecord.value = null
      
      // Form alanlarını normal haline getir
      restoreFormToNormal()
    }
  } catch (error) {
    console.error('❌ Arşiv işlemi hatası:', error)
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata oluştu'
    
    $q.notify({
      type: 'negative',
      message: `Arşiv işlemi hatası: ${errorMessage}`,
      position: 'top'
    })
  }
}

// Değerleri normalize eden yardımcı fonksiyon
const normalizeValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return value.toString()
  return String(value)
}

// Değişiklik kontrolü yapan fonksiyon
const checkForChanges = (): boolean => {
  console.log('🔍 Değişiklik kontrolü başlatılıyor...')
  console.log('🔍 selectedIslemDetay:', selectedIslemDetay.value)
  console.log('🔍 kaynakIslemDetay:', kaynakIslemDetay.value)
  
  if (!selectedIslemDetay.value || !kaynakIslemDetay.value) {
    console.log('ℹ️ Karşılaştırılacak veri bulunamadı')
    console.log('ℹ️ selectedIslemDetay mevcut mu:', !!selectedIslemDetay.value)
    console.log('ℹ️ kaynakIslemDetay mevcut mu:', !!kaynakIslemDetay.value)
    return false
  }

  // Karşılaştırılacak alanlar
  const fieldsToCompare = [
    'iKytTarihi', 'islemOzel1', 'islemOzel2', 'islemOzel3', 'islemOzel4',
    'islemBirim', 'islemDoviz', 'islemKur', 'islemBilgi', 'islemCrKod',
    'islemArac', 'islemTip', 'islemGrup', 'islemAltG', 'islemMiktar', 'islemTutar'
  ]

  console.log('🔍 Karşılaştırılacak alanlar:', fieldsToCompare)

  for (const field of fieldsToCompare) {
    const currentValue = selectedIslemDetay.value[field as keyof IslemDetay]
    const originalValue = kaynakIslemDetay.value[field as keyof IslemDetay]
    
    // normalizeValue fonksiyonunu kullanarak karşılaştır
    const normalizedCurrent = normalizeValue(currentValue)
    const normalizedOriginal = normalizeValue(originalValue)
    
    console.log(`🔍 Alan: ${field}`, {
      current: currentValue,
      original: originalValue,
      normalizedCurrent,
      normalizedOriginal,
      isEqual: normalizedCurrent === normalizedOriginal
    })
    
    if (normalizedCurrent !== normalizedOriginal) {
      console.log(`🔍 Değişiklik tespit edildi: ${field}`, {
        current: normalizedCurrent,
        original: normalizedOriginal
      })
      return true
    }
  }

  console.log('ℹ️ Hiçbir değişiklik tespit edilmedi')
  return false
}

// Arşiv verisiyle form alanlarını doldur
const populateFormWithArchiveData = (archiveData: IslemDetay) => {
  console.log('🔍 Form alanları arşiv verisiyle dolduruluyor:', archiveData)
  
  // Form alanlarını arşiv verisiyle doldur
  if (selectedIslemDetay.value) {
    selectedIslemDetay.value.islemNo = archiveData.islemNo
    selectedIslemDetay.value.iKytTarihi = archiveData.iKytTarihi
    selectedIslemDetay.value.islemKllnc = archiveData.islemKllnc
    selectedIslemDetay.value.islemOzel1 = archiveData.islemOzel1
    selectedIslemDetay.value.islemOzel2 = archiveData.islemOzel2
    selectedIslemDetay.value.islemOzel3 = archiveData.islemOzel3
    selectedIslemDetay.value.islemOzel4 = archiveData.islemOzel4
    selectedIslemDetay.value.islemBirim = archiveData.islemBirim
    selectedIslemDetay.value.islemDoviz = archiveData.islemDoviz
    selectedIslemDetay.value.islemKur = archiveData.islemKur
    selectedIslemDetay.value.islemBilgi = archiveData.islemBilgi
    selectedIslemDetay.value.islemCrKod = archiveData.islemCrKod
    selectedIslemDetay.value.islemArac = archiveData.islemArac
    selectedIslemDetay.value.islemTip = archiveData.islemTip
    selectedIslemDetay.value.islemGrup = archiveData.islemGrup
    selectedIslemDetay.value.islemAltG = archiveData.islemAltG
    selectedIslemDetay.value.islemMiktar = archiveData.islemMiktar
    selectedIslemDetay.value.islemTutar = archiveData.islemTutar
  }
}

// Form alanlarını normal haline getir
const restoreFormToNormal = () => {
  console.log('🔍 Form alanları normal haline getiriliyor')
  
  // Sağdaki container'ların görünürlüğünü eski haline getir
  // Eğer orijinal veri varsa (kaynak işlem bilgileri) container'ları göster
  if (kaynakIslemDetay.value && kaynakIslemDetay.value.islemNo) {
    showKaynakIslemContainer.value = true
    console.log('✅ Sağdaki container\'lar tekrar görünür yapıldı')
  } else {
    showKaynakIslemContainer.value = false
    console.log('ℹ️ Sağdaki container\'lar gizli kalacak (orijinal veri yok)')
  }
  
  // Form alanlarını temizle (orijinal veri varsa onu kullan)
  if (selectedIslemDetay.value) {
    // Orijinal veri varsa onu kullan, yoksa temizle
    if (kaynakIslemDetay.value && kaynakIslemDetay.value.islemNo) {
      // Orijinal veriyi geri yükle
      selectedIslemDetay.value.islemNo = kaynakIslemDetay.value.islemNo
      selectedIslemDetay.value.iKytTarihi = kaynakIslemDetay.value.iKytTarihi
      selectedIslemDetay.value.islemKllnc = kaynakIslemDetay.value.islemKllnc
      selectedIslemDetay.value.islemOzel1 = kaynakIslemDetay.value.islemOzel1
      selectedIslemDetay.value.islemOzel2 = kaynakIslemDetay.value.islemOzel2
      selectedIslemDetay.value.islemOzel3 = kaynakIslemDetay.value.islemOzel3
      selectedIslemDetay.value.islemOzel4 = kaynakIslemDetay.value.islemOzel4
      selectedIslemDetay.value.islemBirim = kaynakIslemDetay.value.islemBirim
      selectedIslemDetay.value.islemDoviz = kaynakIslemDetay.value.islemDoviz
      selectedIslemDetay.value.islemKur = kaynakIslemDetay.value.islemKur
      selectedIslemDetay.value.islemBilgi = kaynakIslemDetay.value.islemBilgi
      selectedIslemDetay.value.islemCrKod = kaynakIslemDetay.value.islemCrKod
      selectedIslemDetay.value.islemArac = kaynakIslemDetay.value.islemArac
      selectedIslemDetay.value.islemTip = kaynakIslemDetay.value.islemTip
      selectedIslemDetay.value.islemGrup = kaynakIslemDetay.value.islemGrup
      selectedIslemDetay.value.islemAltG = kaynakIslemDetay.value.islemAltG
      selectedIslemDetay.value.islemMiktar = kaynakIslemDetay.value.islemMiktar
      selectedIslemDetay.value.islemTutar = kaynakIslemDetay.value.islemTutar
    } else {
      // Orijinal veri yoksa temizle
      selectedIslemDetay.value.islemNo = 0
      selectedIslemDetay.value.iKytTarihi = ''
      selectedIslemDetay.value.islemKllnc = ''
      selectedIslemDetay.value.islemOzel1 = ''
      selectedIslemDetay.value.islemOzel2 = ''
      selectedIslemDetay.value.islemOzel3 = ''
      selectedIslemDetay.value.islemOzel4 = ''
      selectedIslemDetay.value.islemBirim = ''
      selectedIslemDetay.value.islemDoviz = ''
      selectedIslemDetay.value.islemKur = 0
      selectedIslemDetay.value.islemBilgi = ''
      selectedIslemDetay.value.islemCrKod = ''
      selectedIslemDetay.value.islemArac = ''
      selectedIslemDetay.value.islemTip = ''
      selectedIslemDetay.value.islemGrup = ''
      selectedIslemDetay.value.islemAltG = ''
      selectedIslemDetay.value.islemMiktar = 0
      selectedIslemDetay.value.islemTutar = 0
    }
  }
}

// Arşiv kayıtları arasında ileri git
const goToNextArchiveRecord = async () => {
  try {
    if (!currentArchiveRecord.value) return
    
    console.log('🔍 Sonraki arşiv kaydına gidiliyor... islemNo:', currentArchiveRecord.value.islemNo)
    
    const response = await api.get(`/islem/islem-arv-sonraki/${currentArchiveRecord.value.islemNo}`)
    
    if (response.data.success && response.data.sonuc) {
      console.log('✅ Sonraki arşiv kaydı getirildi:', response.data.sonuc)
      
      // currentArchiveRecord'ı doğrudan backend'den gelen yeni kayıtla güncelle
      currentArchiveRecord.value = response.data.sonuc
      
      // Form alanlarını yeni arşiv verisiyle doldur
      populateFormWithArchiveData(response.data.sonuc)
      
      // Başarı mesajı göster
      $q.notify({
        type: 'positive',
        message: `Sonraki arşiv kaydına gidildi (Kayıt No: ${response.data.sonuc.islemNo})`,
        position: 'top'
      })
    } else {
      console.log('ℹ️ Sonraki arşiv kaydı bulunamadı - bu son kayıt')
      $q.notify({
        type: 'info',
        message: 'Bu son arşiv kaydı - daha fazla kayıt bulunmuyor',
        position: 'top'
      })
    }
  } catch (error) {
    console.error('❌ Sonraki arşiv kaydına gitme hatası:', error)
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata oluştu'
    
    $q.notify({
      type: 'negative',
      message: `Sonraki kayda gitme hatası: ${errorMessage}`,
      position: 'top'
    })
  }
}

// Arşiv kayıtları arasında geri git
const goToPreviousArchiveRecord = async () => {
  try {
    if (!currentArchiveRecord.value) return
    
    console.log('🔍 Önceki arşiv kaydına gidiliyor... islemNo:', currentArchiveRecord.value.islemNo)
    
    const response = await api.get(`/islem/islem-arv-onceki/${currentArchiveRecord.value.islemNo}`)
    
    if (response.data.success && response.data.sonuc) {
      console.log('✅ Önceki arşiv kaydı getirildi:', response.data.sonuc)
      
      // currentArchiveRecord'ı doğrudan backend'den gelen yeni kayıtla güncelle
      currentArchiveRecord.value = response.data.sonuc
      
      // Form alanlarını önceki arşiv verisiyle doldur
      populateFormWithArchiveData(response.data.sonuc)
      
      // Başarı mesajı göster
      $q.notify({
        type: 'positive',
        message: `Önceki arşiv kaydına gidildi (Kayıt No: ${response.data.sonuc.islemNo})`,
        position: 'top'
      })
    } else {
      console.log('ℹ️ Önceki arşiv kaydı bulunamadı - bu ilk kayıt')
      $q.notify({
        type: 'info',
        message: 'Bu ilk arşiv kaydı - daha önce kayıt bulunmuyor',
        position: 'top'
      })
    }
  } catch (error) {
    console.error('❌ Önceki arşiv kaydına gitme hatası:', error)
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata oluştu'
    
    $q.notify({
      type: 'negative',
      message: `Önceki kayda gitme hatası: ${errorMessage}`,
      position: 'top'
    })
  }
}

// Form'u kapat
const closeBothForms = async () => {
  try {
    // Eğer sağdaki container'lar gizliyse (yeni eklenen kayıt) ve VAZGEÇ ile kapatılıyorsa
    // tblislemRST tablosundan kaydı sil
    if (!showKaynakIslemContainer.value && selectedIslemDetay.value?.islemNo) {
      console.log('🗑️ Yeni eklenen kayıt VAZGEÇ ile kapatılıyor, tblislemRST tablosundan siliniyor...')
      
      const response = await api.delete(`/islem/islem-rst-sil/${selectedIslemDetay.value.islemNo}`)
      
      if (response.data.success) {
        console.log('✅ İşlem RST tablosundan başarıyla silindi')
      } else {
        console.warn('⚠️ İşlem RST tablosundan silinemedi:', response.data.message)
      }
    } else {
      console.log('ℹ️ Mevcut kayıt kapatılıyor veya sağ container görünür, silme işlemi yapılmıyor')
    }
  } catch (error) {
    console.error('❌ Form kapatma hatası:', error)
  } finally {
    // Arşiv modunu sıfırla
    if (isArchiveMode.value) {
      isArchiveMode.value = false
      currentArchiveRecord.value = null

      restoreFormToNormal()
    }
    
    // Her durumda formu kapat
    showIslemDetayDialog.value = false
  }
}









// Detay tablo sütunları
const detailColumns: QTableColumn[] = [
  {
    name: 'iKytTarihi',
    label: 'Tarih',
    field: 'iKytTarihi',
    align: 'left',
    sortable: true,
    style: 'width: 100px'
  },
          {
          name: 'islemNo',
          label: 'D.',
          field: 'islemNo',
          align: 'center',
          sortable: true,
          style: 'max-width: 40px'
  },
  {
    name: 'islemAltG',
    label: 'Cari Adı',
    field: 'islemAltG',
    align: 'left',
    sortable: true,
    style: 'min-width: 200px; max-width: 250px; word- wrap: break-word; white-space: normal;'
  },
  {
    name: 'islemGrup',
    label: 'Grup',
    field: 'islemGrup',
    align: 'left',
    sortable: false,
    style: 'width: 100px'
  },
  {
    name: 'islemTutar',
    label: 'Tutar',
    field: 'islemTutar',
    align: 'right',
    sortable: true,
    style: 'width: 100px'
  },
  {
    name: 'islemBilgi',
    label: 'Bilgi',
    field: 'islemBilgi',
    align: 'left',
    sortable: false,
    style: 'min-width:440px; max-width: 510px; word-wrap: break-word; white-space: normal;'
  }
]

// Computed properties for dynamic labels
const firstOptionLabel = computed(() => {
  return selectedIslemTuru.value === 'cari' ? 'GELİR' : 'Giren'
})

const secondOptionLabel = computed(() => {
  return selectedIslemTuru.value === 'cari' ? 'GİDER' : 'Çıkan'
})

// İşlem yönü değerini backend'e göndermek için computed property
const islemYonuForApi = computed(() => {
  return selectedIslemTuru.value === 'cari' ? 'gelir-gider' : 'giren-cikan'
})

// Satır tıklama event handler
const onRowClick = (evt: Event, row: TableRow) => {
  debugLog('🔍 Satır tıklandı:', row)
  debugLog('🔍 Seçilen tarih:', row.tarih)
  selectedDate.value = row.tarih
  void loadDetailTableData(row.tarih)
  
  // Sadece 1. sayfanın ilk satırında güncel bakiye, aksi halde seçilen gün bakiyesi
  const isIlkSayfaVeIlkSatir =
    pagination.value.page === 1 &&
    tableData.value.length > 0 &&
    row.tarih === tableData.value[0].tarih
  if (isIlkSayfaVeIlkSatir) void loadGuncelBakiye()
  else void loadSecilenGunBakiyesi(row.tarih)
}

// Event handler for radio group change
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const onIslemTuruChange = (_value: string) => {
  // İşlem türü değiştiğinde tabloyu yeniden yükle
  void loadTableData()
  
  // Eğer seçili tarih varsa detay tabloyu otomatik olarak güncelle
  if (selectedDate.value) {
    debugLog('🔍 İşlem türü değişti, seçili tarih korunuyor ve detay tablo güncelleniyor:', selectedDate.value)
    void loadDetailTableData(selectedDate.value)
  } else {
    // Seçili tarih yoksa detay tabloyu temizle
    allDetailTableData.value = []
    detailTableData.value = []
    detailPagination.value.page = 1
    detailPagination.value.rowsNumber = 0
  }
}
// Detay tablo verilerini yükle
const loadDetailTableData = async (tarih: string) => {
  if (!tarih) return
  
  detailLoading.value = true
  try {
    debugLog('Detay tablo verisi yükleniyor...')
    debugLog('Seçilen tarih:', tarih)
    debugLog('Seçilen işlem türü:', selectedIslemTuru.value)
    debugLog('Seçilen işlem yönü:', islemYonuForApi.value)
    
    // Axios instance kullanarak API çağrısı yap
    const response = await $api.get('/islem/detay-islemler', {
      params: {
        tarih: tarih,
        islemTuru: selectedIslemTuru.value,
        islemYonu: islemYonuForApi.value,
        selectedYonu: selectedIslemYonu.value,
        page: 1,
        rowsPerPage: 1000
      }
    })
    debugLog('Detay Response status:', response.status)
    
    const result = response.data
    debugLog('Detay API Response:', result)
    
    if (result.success) {
       debugLog('Detay veri sayısı:', result.data?.length || 0)
       debugLog('Detay toplam kayıt sayısı:', result.totalRecords)
       // Backend'den gelen veriyi kullan
       allDetailTableData.value = result.data || []
       
       // Verileri islemNo'ya göre azalan sırala (fallback: islemTutar)
       allDetailTableData.value.sort((a: IslemDetay, b: IslemDetay) => {
         const aNo = a.islemNo ?? 0
         const bNo = b.islemNo ?? 0
         if (aNo !== 0 || bNo !== 0) {
           return (bNo) - (aNo)
         }
         const aVal = parseFloat(String(a.islemTutar)) || 0
         const bVal = parseFloat(String(b.islemTutar)) || 0
         return bVal - aVal
       })
       
       // Detay tablo pagination için toplam kayıt sayısını ayarla
       detailPagination.value.rowsNumber = allDetailTableData.value.length
       // İlk sayfayı göster
       detailPagination.value.page = 1
       updateDetailTableData()
        debugLog('Detay pagination rowsNumber güncellendi:', detailPagination.value.rowsNumber)
        debugLog('Detay tablo verisi güncellendi:', detailTableData.value)
     } else {
      console.error('Detay API hatası:', result.message)
      detailTableData.value = []
    }
  } catch (error) {
    console.error('Detay veri yükleme hatası:', error)
    detailTableData.value = []
  } finally {
    detailLoading.value = false
  }
}

// Bakiye hesaplama fonksiyonları
const currentBakiye = ref(0)
const kasaLabel = computed(() => {
  switch (selectedIslemTuru.value) {
    case 'cari':
      return 'Cari';
    case 'nakit':
      return 'Nakit';
    case 'kart':
      return 'Kart';
    case 'eft':
      return 'EFT';
    case 'acenta':
      return 'Acenta';
    case 'depozito':
      return 'Depozito';
    default:
      return 'Kasa';
  }
})

const isGuncelBakiyeLabel = computed(() => {
  if (!selectedDate.value) return true
  return (
    pagination.value.page === 1 &&
    tableData.value.length > 0 &&
    selectedDate.value === tableData.value[0].tarih
  )
})

const bakiyeLabelText = computed(() => {
  const prefix = isGuncelBakiyeLabel.value ? `Güncel ${kasaLabel.value} Bakiye` : `Seçilen Gün ${kasaLabel.value} Bakiye`
  return `${prefix}: ${formatCurrency(currentBakiye.value)}`
})

// Seçime göre güncel/seçilen gün bakiyesini hesapla
const recomputeCurrentBakiyeForSelection = async () => {
  if (!selectedDate.value) {
    await loadGuncelBakiye()
    return
  }
  const isIlkSayfaVeIlkSatir =
    pagination.value.page === 1 &&
    tableData.value.length > 0 &&
    selectedDate.value === tableData.value[0].tarih
  if (isIlkSayfaVeIlkSatir) {
    await loadGuncelBakiye()
  } else {
    await loadSecilenGunBakiyesi(selectedDate.value)
  }
}

// Kasalar arası aktarım fonksiyonu
const performTransfer = async () => {
  debugLog('🔄 Kasalar arası aktarım başlatılıyor...')
  
  // Form validasyonu
  if (!transferForm.value.veren || !transferForm.value.alan || !transferForm.value.tutar) {
    console.error('❌ Form alanları eksik')
    return
  }
  
  const tutar = parseFloat(transferForm.value.tutar)
  if (isNaN(tutar) || tutar <= 0) {
    console.error('❌ Geçersiz tutar')
    return
  }
  
  if (transferForm.value.veren === transferForm.value.alan) {
    console.error('❌ Aynı kasa seçilemez')
    return
  }
  
  try {
    debugLog('📤 Aktarım verileri:', {
      veren: transferForm.value.veren,
      alan: transferForm.value.alan,
      tutar: tutar
    })
    
    // Backend API çağrısı
    const response = await $api.post('/islem/kasa-aktarimi', {
      veren: transferForm.value.veren,
      alan: transferForm.value.alan,
      tutar: tutar
    })
    
    if (response.data.success) {
      debugLog('✅ Aktarım başarılı:', response.data.message)
      
      // Form temizle
      transferForm.value.veren = ''
      transferForm.value.alan = ''
      transferForm.value.tutar = ''
      
      // Verileri yenile
      await refreshData()
      
      // Başarı mesajı göster
      $q.notify({
        type: 'positive',
        message: response.data.message,
        position: 'top',
        timeout: 5000,
        html: true
      })
    } else {
      console.error('❌ Aktarım başarısız:', response.data.message)
      
      // Hata mesajı göster
      $q.notify({
        type: 'negative',
        message: response.data.message || 'Kasa aktarımı başarısız!',
        position: 'top',
        timeout: 8000,
        html: true
      })
    }
    
  } catch (error) {
    console.error('❌ Aktarım hatası:', error)
  }
}

// Kasa devir verilerini yükle
const loadKasaDevirVerileri = async () => {
  try {
    debugLog('🔄 Kasa devir verileri yükleniyor...')
    kasaDevirLoading.value = true
    
    const response = await $api.get('/islem/kasa-devir-verileri', {
      params: {
        page: kasaDevirPagination.value.page,
        rowsPerPage: kasaDevirPagination.value.rowsPerPage
      }
    })
    
    if (response.data.success) {
      const page = kasaDevirPagination.value.page
      const limit = kasaDevirPagination.value.rowsPerPage
      const rawRows = (response.data.data || []) as KasaDevirRow[]
      // Sıralama: nKasaNo DESC öncelikli; yoksa DevirTarihi DESC fallback
      rawRows.sort((a, b) => {
        const an = a.nKasaNo ?? 0
        const bn = b.nKasaNo ?? 0
        if (an !== 0 || bn !== 0) return bn - an
        // fallback: tarih formatı DD.MM.YYYY -> YYYYMMDD kıyaslaması
        const toNum = (d: string) => {
          const p = (d || '').split('.')
          return p.length === 3 ? Number(`${p[2]}${p[1]}${p[0]}`) : 0
        }
        return toNum(b.DevirTarihi) - toNum(a.DevirTarihi)
      })
      // Güvenli dilimleme ve benzersiz satır anahtarı üretimi
      kasaDevirData.value = rawRows.slice(0, limit).map((row, idx) => ({
        ...row,
        rowKey: `${row.nKasaNo ?? ''}|${row.DevirTarihi}|${row.DevirEden}|${row.KasaYekun}|p${page}-i${idx}`
      }))
      kasaDevirPagination.value.rowsNumber = response.data.totalRecords
      debugLog('✅ Kasa devir verileri yüklendi:', kasaDevirData.value.length, 'kayıt')
    } else {
      console.error('❌ Kasa devir verileri yüklenemedi:', response.data.message)
      $q.notify({
        type: 'negative',
        message: response.data.message || 'Kasa devir verileri yüklenemedi!',
        position: 'top',
        timeout: 5000
      })
    }
  } catch (error) {
    console.error('❌ Kasa devir verileri yükleme hatası:', error)
    $q.notify({
      type: 'negative',
      message: 'Kasa devir verileri yüklenirken hata oluştu!',
      position: 'top',
      timeout: 5000
    })
  } finally {
    kasaDevirLoading.value = false
  }
}

// Kasa devret tıklama
const onKasaDevretClick = async () => {
  // Sadece Nakit seçiliyken izin ver
  if (selectedIslemTuru.value !== 'nakit') {
    $q.notify({
      type: 'warning',
      message: 'Kasa devri için önce 6\'lı seçimden Nakit kasayı seçiniz.',
      position: 'top'
    })
    return
  }
  // Bakiye tazele ve popup aç
  await loadGuncelBakiye()
  showKasaDevretDialog.value = true
}

// Kasa devret onayla -> tblKasaDevir'e kaydet ve grid'i yenile
const onKasaDevretOnayla = async () => {
  try {
    // Kasa yekun normalizasyonu: number ise direkt yuvarla; string ise TR/EN formatlarına göre dönüştür
    const normalizeYekun = (val: unknown): number => {
      if (typeof val === 'number' && Number.isFinite(val)) {
        return Number(val.toFixed(2))
      }
      const raw = typeof val === 'string' ? val.trim() : ''
      if (!raw) return 0
      const cleaned = raw.replace(/[₺\s]/g, '')
      let parsed = 0
      if (cleaned.includes(',') && cleaned.match(/,\d{1,2}$/)) {
        // TR biçimi: 161.310,48 → 161310.48
        parsed = Number(cleaned.replace(/\./g, '').replace(',', '.'))
      } else {
        // EN biçimi: 161310.48 veya 161,310.48 → 161310.48
        const noThousands = cleaned.replace(/,(?=\d{3}(?:\D|$))/g, '')
        parsed = Number(noThousands)
      }
      return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0
    }

    const kasaYekun = normalizeYekun(currentBakiye.value)
    const kullaniciAdi = localStorage.getItem('username') || ''
    const response = await $api.post('/islem/kasa-devret', { kasaYekun, kullaniciAdi })
    if (response.data && response.data.success) {
      showKasaDevretDialog.value = false
      $q.notify({ type: 'positive', message: 'Kasa devri kaydedildi', position: 'top' })
      await loadKasaDevirVerileri()
    } else {
      $q.notify({ type: 'negative', message: response.data?.message || 'Kasa devri kaydedilemedi', position: 'top' })
    }
  } catch (error: unknown) {
    console.error('Kasa devret hatası:', error)
    let msg = 'Kasa devri sırasında hata oluştu'
    if (isAxiosError(error)) {
      const data = error.response?.data as { message?: string } | undefined
      msg = data?.message ?? error.message
    } else if (error instanceof Error) {
      msg = error.message
    }
    $q.notify({ type: 'negative', message: msg, position: 'top', timeout: 7000 })
  }
}

// Kasa devir tablo pagination request handler
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onKasaDevirRequest = (props: any) => {
  debugLog('🔍 Kasa devir tablo pagination request:', props)
  
  // Pagination değişikliklerini uygula ve sıralamayı nKasaNo DESC'e sabitle
  kasaDevirPagination.value = props.pagination
  // Sıralamayı backend nKasaNo DESC olarak sağlıyor, UI'da görüntü sütunlarını bozmayalım
  kasaDevirPagination.value.sortBy = 'DevirTarihi'
  kasaDevirPagination.value.descending = true
  
  // Verileri yeniden yükle
  void loadKasaDevirVerileri()
}

// Kasa devir sayfa değiştirme fonksiyonu
const changeKasaDevirPage = async (newPage: number) => {
  debugLog('🔄 Kasa devir sayfa değiştiriliyor:', newPage)
  kasaDevirPagination.value.page = newPage
  await loadKasaDevirVerileri()
}

// Veriyi yenile fonksiyonu
const refreshData = async () => {
  debugLog('🔄 Veri yenileniyor...')
  
  // Mevcut seçili tarihi sakla
  const mevcutSeciliTarih = selectedDate.value
  
  // Detay tablo verilerini temizle
  allDetailTableData.value = []
  detailTableData.value = []
  detailPagination.value.page = 1
  detailPagination.value.rowsNumber = 0
  
  // Ana tablo verilerini yeniden yükle
  await loadTableData()
  
  // Tarih seçili ise o tarih için detay tablo, değilse ilk tarih seçilsin
  if (mevcutSeciliTarih && tableData.value.some((row: TableRow) => row.tarih === mevcutSeciliTarih)) {
    // Mevcut seçili tarih hala geçerliyse onu kullan
    selectedDate.value = mevcutSeciliTarih
    await loadDetailTableData(mevcutSeciliTarih)
  } else if (tableData.value.length > 0) {
    // İlk tarih seçilsin ve detay tablo sorgulansın
    const ilkTarih = tableData.value[0].tarih
    selectedDate.value = ilkTarih
    await loadDetailTableData(ilkTarih)
  }
  
  // Güncel bakiyeyi hesapla
  await loadGuncelBakiye()
  // Kasa devir verilerini de yenile
  await loadKasaDevirVerileri()
  
  debugLog('✅ Veri yenileme tamamlandı')
}

// Güncel bakiye hesapla
const loadGuncelBakiye = async () => {
  try {
    const response = await $api.get('/islem/guncel-bakiye', {
      params: {
        islemTuru: selectedIslemTuru.value,
        islemYonu: islemYonuForApi.value
      }
    })
    
    if (response.data.success) {
      currentBakiye.value = response.data.bakiye
      debugLog('💰 Güncel bakiye yüklendi:', currentBakiye.value)
    }
  } catch (error) {
    console.error('❌ Güncel bakiye yükleme hatası:', error)
    currentBakiye.value = 0
  }
}

// Seçilen gün bakiyesi hesapla
const loadSecilenGunBakiyesi = async (tarih: string) => {
  try {
    const response = await $api.get('/islem/secilen-gun-bakiyesi', {
      params: {
        islemTuru: selectedIslemTuru.value,
        islemYonu: islemYonuForApi.value,
        secilenTarih: tarih
      }
    })
    
    if (response.data.success) {
      currentBakiye.value = response.data.bakiye
      debugLog('💰 Seçilen gün bakiyesi yüklendi:', currentBakiye.value)
    }
  } catch (error) {
    console.error('❌ Seçilen gün bakiyesi yükleme hatası:', error)
    currentBakiye.value = 0
  }
}

// Tarih formatı
const formatDate = (date: string) => {
  if (!date) return ''
  
  // Backend'den gelen tarih formatı: DD.MM.YYYY
  if (date.includes('.')) {
    const parts = date.split('.')
    if (parts.length === 3) {
      const day = parts[0]
      const month = parts[1]
      const year = parts[2]
      return `${day}.${month}.${year}`
    }
  }
  
  // ISO format için
  const d = new Date(date)
  return d.toLocaleDateString('tr-TR')
}

// Para formatı
const formatCurrency = (amount: number) => {
  if (!amount) return '0,00'
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Tablo verilerini yükle (direct call - test endpoints kaldırıldı)
const loadTableData = async () => {
  loading.value = true
  try {
    const response = await $api.get('/islem/kasa-islemleri', {
      params: {
        islemTuru: selectedIslemTuru.value,
        islemYonu: islemYonuForApi.value,
        page: 1,
        rowsPerPage: 1000
      }
    })
    const result = response.data
    if (result.success) {
      allTableData.value = result.data || []
      pagination.value.rowsNumber = allTableData.value.length
      pagination.value.page = 1
      updateTableData()
    } else {
      tableData.value = []
    }
  } catch (error) {
    console.error('Veri yükleme hatası:', error)
    tableData.value = []
  } finally {
    loading.value = false
  }
}

// Sayfa yüklendiğinde veriyi yükle
onMounted(async () => {
  await loadTableData()
  // Sayfa ilk yüklendiğinde güncel bakiyeyi hesapla
  await loadGuncelBakiye()
  
  // Kasa devir verilerini otomatik olarak yükle
  await loadKasaDevirVerileri()
  
  // Combo box verilerini yükle
  await loadComboBoxData()
  
  // İlk tarih seçili olsun ve detay tablo sorgulansın
  if (tableData.value.length > 0) {
    const ilkTarih = tableData.value[0].tarih
    selectedDate.value = ilkTarih
    await loadDetailTableData(ilkTarih)
    // 1. sayfanın ilk satırında olduğumuz için güncel bakiye
    await loadGuncelBakiye()
  }
})

// İşlem türü değiştiğinde tabloyu yeniden yükle
watch(selectedIslemTuru, async () => {
  await loadTableData()
  void recomputeCurrentBakiyeForSelection()
})

// İşlem yönü değiştiğinde detay tabloyu güncelle
watch(selectedIslemYonu, () => {
  debugLog('🔍 selectedIslemYonu değişti:', selectedIslemYonu.value)
  debugLog('🔍 islemYonuForApi değeri:', islemYonuForApi.value)
  if (selectedDate.value) {
    debugLog('🔍 Detay tablo güncelleniyor...')
    void loadDetailTableData(selectedDate.value)
  } else {
    debugLog('🔍 Seçili tarih yok, detay tablo güncellenmiyor')
  }
  
  // İşlem yönü değiştiğinde bakiye hesaplaması yap
  void recomputeCurrentBakiyeForSelection()
})

// İşlem detay modal açıldığında pozisyonu ortala
watch(showIslemDetayDialog, (val) => {
  if (val) {
    // Modal açıldığında ortala
    islemDetayModalPos.x = window.innerWidth / 2 - 200;
    islemDetayModalPos.y = window.innerHeight / 2 - 300;
  }
})

// Get field style based on field name - yellow background when data differs
const getFieldStyle = (fieldName: string) => {
  // Only apply styling when right containers are visible and not in archive mode
  if (!showKaynakIslemContainer.value || isArchiveMode.value) {
    return {}
  }

  // Get the corresponding field value from the left container using type assertion
  const leftValue = selectedIslemDetay.value?.[fieldName as keyof IslemDetay]
  const rightValue = kaynakIslemDetay.value?.[fieldName as keyof IslemDetay]

  const normalizedLeft = normalizeValue(leftValue)
  const normalizedRight = normalizeValue(rightValue)

  // Debug logging for Kayıt Tarihi field
  if (fieldName === 'iKytTarihi') {
    console.log('🔍 Kayıt Tarihi karşılaştırması:', {
      fieldName,
      leftValue,
      rightValue,
      normalizedLeft,
      normalizedRight,
      areEqual: normalizedLeft === normalizedRight,
      leftType: typeof leftValue,
      rightType: typeof rightValue
    })
  }

  // Debug logging for all fields when they differ
  if (normalizedLeft !== normalizedRight) {
    console.log(`🔍 Field ${fieldName} differs:`, {
      leftValue,
      rightValue,
      normalizedLeft,
      normalizedRight
    })
  }

  // Compare normalized values and return yellow background with black text if they differ
  if (normalizedLeft !== normalizedRight) {
    const style = {
      'background-color': '#fff3cd', // Light yellow background
      'color': '#000000', // Black font color
      'font-weight': '500' // Make text more readable
    }
    console.log(`🎨 Applied style for ${fieldName}:`, style)
    return { style, class: 'yellow-background-field' }
  }
  return { style: {}, class: '' }
}

// Date picker'dan tarih seçildiğinde popup'ı otomatik kapat
const onDateSelected = (date: string) => {
  console.log('🔍 Tarih seçildi:', date);
  console.log('🔍 Mevcut selectedIslemDetay.iKytTarihi:', selectedIslemDetay.value.iKytTarihi);
  
  // Popup'ı otomatik kapat
  if (datePopup.value) {
    datePopup.value.hide();
  }
  
  console.log('✅ Tarih güncellendi ve popup kapatıldı:', date);
}

// tblislemRST tablosundaki islemNo değerlerini saklamak için
const rstIslemNoList = ref<number[]>([])

// RST farkları için ref
const rstDifferences = ref<Record<number, Array<{
  fieldName: string
  originalValue: string
  changedValue: string
}>>>({})

// tblislemRST tablosundan tüm islemNo değerlerini getir
const loadRstIslemNoList = async () => {
  try {
    // Eğer ana detay tablo verisi yoksa, önce onu yükle
    if (allDetailTableData.value.length === 0) {
      return
    }
    
    // Tüm islemNo değerlerini topla
    const allIslemNoList = allDetailTableData.value.map(row => row.islemNo).filter((no): no is number => no !== undefined)
    
    if (allIslemNoList.length === 0) {
      rstIslemNoList.value = []
      return
    }
    
    // Her bir islemNo için tblislemRST kontrolü yap
    const rstList: number[] = []
    for (const islemNo of allIslemNoList) {
      try {
        const response = await api.get(`/islem/islem-rst-kontrol/${islemNo}`)
        if (response.data.success && response.data.exists) {
          rstList.push(islemNo)
        }
      } catch {
        // Hata durumunda sessizce devam et
      }
    }
    
    // Sadece gerçekten değiştiyse güncelle
    const newList = rstList.sort()
    const currentList = [...rstIslemNoList.value].sort()
    
    if (JSON.stringify(newList) !== JSON.stringify(currentList)) {
      rstIslemNoList.value = rstList
      console.log('✅ rstIslemNoList güncellendi, highlighting uygulanacak')
      
      // Hemen highlighting uygula
      await nextTick()
      applyDirectHighlighting()
    }
    
  } catch {
    rstIslemNoList.value = []
  }
}

// tblislemRST ve tblislem arasındaki farkları getir
const getRstDifferences = async (islemNo: number) => {
  try {
    console.log(`🔍 Farklar yükleniyor, islemNo: ${islemNo}`)
    
    // tblislemRST kontrolü yap
    const rstCheckResponse = await api.get(`/islem/islem-rst-kontrol/${islemNo}`)
    if (!rstCheckResponse.data.success || !rstCheckResponse.data.exists) {
      console.log(`ℹ️ islemNo ${islemNo} tblislemRST'de bulunamadı`)
      return null
    }
    
    // tblislemRST tablosundan orijinal kaydı getir
    const rstResponse = await api.get(`/islem/islem-rst-detay/${islemNo}`)
    if (!rstResponse.data.success) {
      console.log(`❌ islemNo ${islemNo} için tblislemRST kaydı getirilemedi`)
      return null
    }
    
    const originalRecord = rstResponse.data.data
    
    // tblislem tablosundan güncel kaydı doğrudan backend'den getir
    const currentResponse = await api.get(`/islem/detay/${islemNo}`)
    if (!currentResponse.data.success) {
      console.log(`❌ islemNo ${islemNo} için tblislem kaydı getirilemedi`)
      return null
    }
    
    const currentRecord = currentResponse.data.data
    
    // Gerçek farkları hesapla - her alanı karşılaştır
    const differences: Array<{
      fieldName: string
      originalValue: string
      changedValue: string
    }> = []
    
    // Karşılaştırılacak alanlar (islemBilgi hariç)
    const fieldsToCompare: Array<{ key: keyof IslemDetay, displayName: string }> = [
      { key: 'iKytTarihi', displayName: 'Kayıt Tarihi' },
      { key: 'islemKllnc', displayName: 'İşlem Kullanıcı' },
      { key: 'islemOzel1', displayName: 'İşlem Özel 1' },
      { key: 'islemOzel2', displayName: 'İşlem Özel 2' },
      { key: 'islemOzel3', displayName: 'İşlem Özel 3' },
      { key: 'islemOzel4', displayName: 'İşlem Özel 4' },
      { key: 'islemBirim', displayName: 'İşlem Birim' },
      { key: 'islemDoviz', displayName: 'İşlem Döviz' },
      { key: 'islemKur', displayName: 'İşlem Kur' },
      { key: 'islemCrKod', displayName: 'İşlem Cari Kod' },
      { key: 'islemArac', displayName: 'İşlem Aracı' },
      { key: 'islemTip', displayName: 'İşlem Tipi' },
      { key: 'islemGrup', displayName: 'İşlem Grubu' },
      { key: 'islemAltG', displayName: 'İşlem Alt Grubu' },
      { key: 'islemMiktar', displayName: 'İşlem Miktar' },
      { key: 'islemTutar', displayName: 'İşlem Tutar' }
    ]
    
    // Her alanı karşılaştır
    fieldsToCompare.forEach(field => {
      const originalValue = originalRecord[field.key]
      const currentValue = currentRecord[field.key]
      
      // Değerleri normalize et
      const normalizedOriginal = normalizeValue(originalValue)
      const normalizedCurrent = normalizeValue(currentValue)
      
      // Eğer farklıysa listeye ekle
      if (normalizedOriginal !== normalizedCurrent) {
        differences.push({
          fieldName: field.displayName,
          originalValue: String(originalValue || ''),
          changedValue: String(currentValue || '')
        })
      }
    })
    
    console.log(`✅ Farklar hesaplandı: ${differences.length} alan`)
    console.log(`📋 Orijinal kayıt (tblislemRST):`, originalRecord)
    console.log(`📋 Güncel kayıt (tblislem):`, currentRecord)
    console.log(`📋 Bulunan farklar:`, differences)
    
    return differences
    
  } catch (error) {
    console.error('❌ Fark bilgileri alınırken hata:', error)
    return null
  }
}

// Bu fonksiyonlar şu anda kullanılmıyor, gerektiğinde tekrar eklenebilir

// Hover'da farkları yükle
const loadDifferencesOnHover = async (islemNo: number) => {
  console.log(`🖱️ Hover event tetiklendi, islemNo: ${islemNo}`)
  
  // Eğer farklar zaten yüklenmişse tekrar yükleme
  if (rstDifferences.value[islemNo]) {
    console.log(`✅ Farklar zaten yüklenmiş: ${islemNo}`)
    return
  }
  
  console.log(`🔄 Farklar yükleniyor...`)
  // Farkları yükle
  const differences = await getRstDifferences(islemNo)
  if (differences) {
    rstDifferences.value[islemNo] = differences
    console.log(`✅ Farklar yüklendi ve cache'e eklendi:`, differences)
  } else {
    console.log(`❌ Farklar yüklenemedi`)
  }
}



// Ana detay tablo verisi (allDetailTableData) değiştiğinde tblislemRST listesini güncelle
// Sadece gerçek veri değişikliklerinde çalışır, pagination değişikliklerinde çalışmaz
watch(allDetailTableData, async (newData, oldData) => {
  // Eğer veri gerçekten değiştiyse çalışsın
  if (newData.length > 0 && (!oldData || newData.length !== oldData.length || 
      JSON.stringify(newData.map(item => item.islemNo).sort()) !== 
      JSON.stringify(oldData.map(item => item.islemNo).sort()))) {
    await loadRstIslemNoList()
  }
}, { deep: true })

// rstIslemNoList değiştiğinde highlighting uygula
watch(rstIslemNoList, async (newList, oldList) => {
  console.log(`🔄 rstIslemNoList güncellendi: ${newList.length} kayıt`)
  console.log(`📋 Yeni liste:`, newList)
  console.log(`📋 Eski liste:`, oldList)
  
  // Force table re-render to ensure highlighting is applied
  await nextTick()
  console.log('🔄 nextTick completed, table should be re-rendered')
  
  // DOM manipülasyonu ile highlighting uygula
  applyDirectHighlighting()
}, { deep: true })



// DOM manipülasyonu ile highlighting uygula (sadece sol kenar için)
const applyDirectHighlighting = () => {
  const tableElement = document.querySelector('.detail-table')
  if (!tableElement) {
    console.log('❌ .detail-table bulunamadı')
    return
  }
  
  // Tüm satırları temizle
  const allRows = tableElement.querySelectorAll('tr')
  console.log(`🔍 Toplam ${allRows.length} satır bulundu`)
  
  allRows.forEach((row: Element) => {
    row.classList.remove('rst-row-with-marker')
  })
  
  console.log('🧹 Tüm satırlardan rst-row-with-marker class temizlendi')
  console.log('📋 rstIslemNoList:', rstIslemNoList.value)
  
  // Şimdi sadece gerekli satırlara marker class'ı ekle
  allRows.forEach((row: Element, index: number) => {
    if (index === 0) return // Header satırını atla
    
    // islemNo hücresini bul - tüm hücreleri kontrol et
    const cells = row.querySelectorAll('td')
    let islemNoFound = false
    
    cells.forEach((cell: Element) => {
      if (islemNoFound) return // Zaten bulundu
      
      const cellText = cell.textContent?.trim()
      if (cellText) {
        const islemNo = parseInt(cellText)
        if (!isNaN(islemNo) && rstIslemNoList.value.includes(islemNo)) {
          row.classList.add('rst-row-with-marker')
          console.log(`✅ Satır ${index} için rst-row-with-marker class eklendi, islemNo: ${islemNo}`)
          islemNoFound = true
        }
      }
    })
  })
  
  console.log('💡 Sol kenar çizgisi ve marker uygulandı')
}



// Highlighting için daha stabil row class fonksiyonu
const getStableRowClass = (props: { row: IslemDetay }) => {
  // Artık sadece sol kenar çizgisi için kullanılıyor
  const isHighlighted = rstIslemNoList.value.includes(props.row.islemNo)
  if (isHighlighted) {
    console.log(`🎨 Row class applied for islemNo ${props.row.islemNo}: rst-row-with-marker`)
    return 'rst-row-with-marker'
  }
  return ''
}




</script>

<style scoped>
.report-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}
.pdf-btn,
.excel-btn {
  padding: 8px !important;
}
.light-page-background {
  background: #f5f5f5;
  min-height: 100vh;
}

/* Dark mode için sayfa zemin rengi */
.body--dark .light-page-background {
  background: #121212;
}

/* Veriyi Yenile butonu font boyutu */
.refresh-btn {
  font-size: 12px !important;
}

/* Daha spesifik seçici */
.q-btn.refresh-btn {
  font-size: 12px !important;
}

/* İkinci radio grup aralığı */
.second-radio-group {
  margin-top: 6px;
}

/* Kasalar Arası Aktarım Container */
.transfer-container {

  background: linear-gradient(180deg, rgba(230, 245, 255, 0.95), rgba(220, 236, 255, 0.95));
  border-radius: 10px;
  padding: 4px;
  border: 1px solid rgba(25, 118, 210, 0.25);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.12);
}

/* Dark mode için transfer container */
.body--dark .transfer-container {
  background: linear-gradient(180deg, rgba(10, 20, 35, 0.96), rgba(8, 16, 28, 0.96));
  border: 1px solid rgba(100, 181, 246, 0.6);
  box-shadow: 0 4px 14px rgba(33, 150, 243, 0.28);
}

.transfer-header {
  margin-bottom: 15px;
}

.transfer-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-align: center;
  word-wrap: break-word;
  white-space: normal;
  line-height: 1.3;
}

/* Dark mode için transfer başlık rengi */
.body--dark .transfer-title {
  color: #90caf9;
}

.transfer-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 12px;
  font-weight: 500;
  color: #555;
  margin-bottom: 2px;
}

/* Dark mode için form label rengi */
.body--dark .form-label {
  color: #e0e0e0;
}

.transfer-input {
  width: 100%;
}

.transfer-button {
  margin-top: 8px;
  width: 100%;
}

/* Combobox seçenek font boyutu */
.transfer-input .q-field__native {
  font-size: 8px;
}

/* Ana Grid Tablo Container */
.main-table-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Kasa Devir Container */
.kasa-devir-container {
  background: linear-gradient(180deg, rgba(242, 248, 240, 0.96), rgba(235, 246, 235, 0.96));
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(76, 175, 80, 0.25);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);
}

/* Dark mode için kasa devir container */
.body--dark .kasa-devir-container {
  background: linear-gradient(180deg, rgba(12, 28, 18, 0.96), rgba(8, 22, 14, 0.96));
  border: 1px solid rgba(129, 199, 132, 0.6);
  box-shadow: 0 4px 14px rgba(76, 175, 80, 0.28);
}

.kasa-devir-header {
  text-align: center;
  margin-bottom: 20px;
}

.kasa-devir-btn {
  font-weight: 600;
  font-size: 14px;
  padding: 2px 16px;
  min-height: 28px;
  height: 28px;
}

.kasa-devir-table-container {
  margin-top: 15px;
}

.kasa-devir-table {
  background: transparent;
}

.kasa-devir-table .q-table__top {
  background: rgba(0, 0, 0, 0.02);
}

/* Dark mode için tablo başlık */
.body--dark .kasa-devir-table .q-table__top {
  background: rgba(255, 255, 255, 0.05);
}

/* Kasa devir tablosu satır aralıklarını azalt */
.kasa-devir-table .q-table__tbody tr {
  height: 24px;
}

.kasa-devir-table .q-table__tbody td {
  padding: 2px 4px;
}

.kasa-devir-table .q-table__thead th {
  padding: 3px 4px;
  height: 24px;
}

.transfer-input .q-item {
  font-size: 8px;
  min-height: 24px;
}

.ana-container {
  max-width: 1000px;
  margin: 0;
  padding: 0 20px 20px 0;
}

/* Detay tablo için maksimum genişlik */
.detail-table {
  max-width: 1900px;
}

.layout-grid {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 20px;
  align-items: start;
}

.left-column {
  position: sticky;
  top: 20px;
}

.right-column {
  min-height: 400px;
}

.tables-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.selected-row {
  background-color: #e3f2fd !important;
  border-left: 4px solid #1976d2 !important;
  font-weight: bold !important;
}

.selected-row:hover {
  background-color: #bbdefb !important;
}

.q-tr {
  cursor: pointer;
}

.q-tr:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* Dark mode için seçili satır */
.body--dark .selected-row {
  background-color: rgba(25, 118, 210, 0.2) !important;
  border-left: 4px solid #42a5f5 !important;
}

.body--dark .selected-row:hover {
  background-color: rgba(25, 118, 210, 0.3) !important;
}

.main-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.radio-groups-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.radio-group-container {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  padding: 2px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.radio-group {
  width: 100%;
}

.radio-options {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.radio-options .q-radio {
  margin-bottom: 2px;
}



.table-container {
  overflow-x: auto;
}

.kasa-table {
  font-size: 12px;
}

.kasa-table .q-table__top {
  display: none;
}

.kasa-table .q-table__bottom {
  padding: 8px;
}

/* Sayfa başına kayıt seçiciyi gizle */
.kasa-table .q-table__bottom .q-table__control {
  display: none !important;
}

/* Pagination butonlarını görünür yap */
.kasa-table .q-table__bottom {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  min-height: 40px !important;
  padding: 8px !important;
  border-top: 1px solid rgba(0, 0, 0, 0.12) !important;
  background-color: #f5f5f5 !important;
}

.kasa-table .q-table__bottom .q-pagination {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  width: 100% !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 4px !important;
}

 .kasa-table .q-table__bottom .q-pagination .q-btn {
   display: inline-flex !important;
   visibility: visible !important;
   opacity: 1 !important;
   margin: 0 2px !important;
   min-width: 28px !important;
   height: 24px !important;
   background-color: #1976d2 !important;
   color: white !important;
   border-radius: 3px !important;
   font-weight: bold !important;
   box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
 }

.kasa-table .q-table__bottom .q-pagination .q-btn--disabled {
  display: inline-flex !important;
  visibility: visible !important;
  opacity: 0.6 !important;
  pointer-events: auto !important;
  background-color: #ccc !important;
  color: #666 !important;
  box-shadow: none !important;
}

.kasa-table .q-table__bottom .q-pagination .q-btn:hover {
  background-color: #1565c0 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
}

.kasa-table .q-table__bottom .q-pagination .q-btn--disabled:hover {
  background-color: #ccc !important;
  transform: none !important;
  box-shadow: none !important;
}

/* Pagination butonlarının kesinlikle görünmesi için ek kurallar */
.kasa-table .q-table__bottom .q-pagination .q-btn__content {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  justify-content: center !important;
  align-items: center !important;
  width: 100% !important;
  height: 100% !important;
}

.kasa-table .q-table__bottom .q-pagination .q-btn__content .q-icon {
  display: inline-flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  font-size: 16px !important;
}

/* Pagination sayfa numaralarını görünür yap */
.kasa-table .q-table__bottom .q-pagination .q-btn--standard {
  background-color: #1976d2 !important;
  color: white !important;
  font-weight: bold !important;
}

.kasa-table .q-table__bottom .q-pagination .q-btn--standard.q-btn--active {
  background-color: #0d47a1 !important;
  color: white !important;
  font-weight: bold !important;
}

/* Pagination butonlarının kesinlikle görünmesi için ek kurallar */
.kasa-table .q-table__bottom .q-pagination {
  position: relative !important;
  z-index: 1000 !important;
}

.kasa-table .q-table__bottom .q-pagination * {
  pointer-events: auto !important;
}

/* Pagination butonlarının içeriğini görünür yap */
.kasa-table .q-table__bottom .q-pagination .q-btn span {
  display: inline-block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

 /* Pagination butonlarının sayfa numaralarını görünür yap */
 .kasa-table .q-table__bottom .q-pagination .q-btn--standard {
   min-width: 28px !important;
   height: 24px !important;
   font-size: 12px !important;
   font-weight: bold !important;
 }

/* Özel pagination butonları */
.custom-pagination {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 8px !important;
  background-color: #f5f5f5 !important;
  border-top: 1px solid rgba(0, 0, 0, 0.12) !important;
  margin-top: 8px !important;
}

.pagination-info {
  font-weight: bold !important;
  color: #1976d2 !important;
  font-size: 12px !important;
  min-width: 100px !important;
  text-align: center !important;
}

 .custom-pagination .q-btn {
   background-color: #1976d2 !important;
   color: white !important;
   border-radius: 3px !important;
   font-weight: bold !important;
   box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
   min-width: 28px !important;
   height: 22px !important;
   font-size: 11px !important;
 }

.custom-pagination .q-btn:hover {
  background-color: #1565c0 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;
}

.custom-pagination .q-btn--disabled {
  background-color: #ccc !important;
  color: #666 !important;
  box-shadow: none !important;
  transform: none !important;
}

.custom-pagination .q-btn--disabled:hover {
  background-color: #ccc !important;
  transform: none !important;
  box-shadow: none !important;
}

/* Dark mode için pagination butonları */
.body--dark .custom-pagination {
  background-color: #2d2d2d !important;
  border-top: 1px solid rgba(255, 255, 255, 0.12) !important;
}

.body--dark .pagination-info {
  color: #42a5f5 !important;
}

.body--dark .custom-pagination .q-btn {
  background-color: #42a5f5 !important;
  color: white !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4) !important;
}

.body--dark .custom-pagination .q-btn:hover {
  background-color: #1976d2 !important;
  box-shadow: 0 2px 6px rgba(0,0,0,0.5) !important;
}

.body--dark .custom-pagination .q-btn--disabled {
  background-color: #555 !important;
  color: #888 !important;
}

.body--dark .custom-pagination .q-btn--disabled:hover {
  background-color: #555 !important;
}

.kasa-table .q-table tbody tr {
  height: 16px;
}

.kasa-table .q-table th {
  padding: 1px 6px;
  font-size: 11px;
}

.kasa-table .q-table td {
  padding: 1px 6px;
}

/* Bilgi sütunu için word wrap */
.kasa-table .q-table td[data-col="islemBilgi"] {
  word-wrap: break-word !important;
  white-space: normal !important;
  min-width: 600px !important;
  max-width: 1000px !important;
  overflow-wrap: break-word !important;
}

/* Dark mode için */
.body--dark .main-card {
  background: rgba(30, 30, 30, 0.95);
  color: white;
}

.body--dark .radio-group-container {
  background: rgba(50, 50, 50, 0.8);
  border-color: rgba(255, 255, 255, 0.1);
}

 .body--dark .text-grey-6 {
   color: #b0b0b0 !important;
 }

/* Form modal dark mode stilleri */
.body--dark .form-label {
  color: #e0e0e0 !important;
}

.body--dark .form-input .q-field__native {
  color: #ffffff !important;
  background-color: rgba(50, 50, 50, 0.8) !important;
}

.body--dark .form-input .q-field__control {
  background-color: rgba(50, 50, 50, 0.8) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

.body--dark .form-input .q-field__control:hover {
  border-color: rgba(255, 255, 255, 0.4) !important;
}

.body--dark .form-input .q-field__control--focused {
  border-color: #42a5f5 !important;
}

/* Readonly textbox'lar için koyu gri zemin */
.body--dark .form-input .q-field__control--readonly {
  background-color: rgba(40, 40, 40, 0.9) !important;
  color: #b0b0b0 !important;
}

/* Readonly textbox'lar için koyu gri zemin - Daha güçlü CSS */
.body--dark .form-input .q-field__control--readonly {
  background-color: rgba(35, 35, 35, 0.95) !important;
  color: #b0b0b0 !important;
}

.body--dark .form-input .q-field__control--readonly .q-field__native {
  background-color: rgba(35, 35, 35, 0.95) !important;
  color: #b0b0b0 !important;
}

/* bg-color="grey-2" için özel stil */
.body--dark .form-input .q-field__control[data-bg-color="grey-2"] {
  background-color: rgba(35, 35, 35, 0.95) !important;
}

.body--dark .form-input .q-field__control[data-bg-color="grey-2"] .q-field__native {
  background-color: rgba(35, 35, 35, 0.95) !important;
}

/* Readonly attribute için özel stil */
.body--dark .form-input .q-field__control[readonly] {
  background-color: rgba(35, 35, 35, 0.95) !important;
}

.body--dark .form-input .q-field__control[readonly] .q-field__native {
  background-color: rgba(35, 35, 35, 0.95) !important;
}

/* Tüm readonly alanlar için genel stil */
.body--dark .q-field--readonly .q-field__control {
  background-color: rgba(35, 35, 35, 0.95) !important;
}

.body--dark .q-field--readonly .q-field__native {
  background-color: rgba(35, 35, 35, 0.95) !important;
}

  /* Draggable modal header stilleri */
  .draggable-header {
    cursor: move !important;
    user-select: none !important;
    padding: 12px 16px !important;
    border-bottom: 1px solid #e0e0e0 !important;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
    transition: all 0.2s ease !important;
    position: relative !important;
  }

  .draggable-header:hover {
    background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  }

  /* Dark mode için draggable header */
  .body--dark .draggable-header {
    background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%) !important;
    border-bottom: 1px solid #4a5568 !important;
  }

  .body--dark .draggable-header:hover {
    background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
  }

  /* Modal sürükleme sırasında görsel geri bildirim */
  .q-dialog--dragging .q-card,
  .modal-dragging {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
    transform: none !important;
    transition: none !important;
  }

  /* Modal sürükleme sırasında header vurgusu */
  .modal-dragging .draggable-header {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%) !important;
    color: white !important;
  }

  .body--dark .modal-dragging .draggable-header {
    background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%) !important;
    color: #e2e8f0 !important;
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

  /* Modal'ın gezdirilebilir olması için ek kurallar */
  .q-dialog--dragging {
    cursor: default !important;
  }

  .q-dialog--dragging .q-card {
    cursor: default !important;
    user-select: none !important;
  }

  /* Draggable header için daha güçlü stil */
  .draggable-header * {
    pointer-events: auto !important;
  }

  .draggable-header .q-btn {
    pointer-events: auto !important;
  }

  /* İşlem detay modal gezdirme stilleri */
  .draggable-islem-detay-modal {
    z-index: 9999;
    user-select: none;
    position: fixed;
    overflow: visible;
  }

  .draggable-islem-detay-modal .q-card {
    position: relative;
    overflow: visible;
    transform: none;
    transition: none;
  }

  /* Header'daki Kayıt No alanı için özel stil */
  .draggable-header .form-input {
    pointer-events: auto !important;
  }

  .draggable-header .form-input .q-field__control {
    background-color: rgba(255, 255, 255, 0.9) !important;
    border-color: rgba(0, 123, 255, 0.3) !important;
    padding: 4px 8px !important;
  }

  .draggable-header .form-input .q-field__native {
    font-size: 12px !important;
    padding: 2px 4px !important;
  }

  .body--dark .draggable-header .form-input .q-field__control {
    background-color: rgba(50, 50, 50, 0.9) !important;
    border-color: rgba(66, 165, 245, 0.3) !important;
  }

  /* Modal sürükleme sırasında görsel geri bildirim */
  .draggable-islem-detay-modal .q-card.modal-dragging {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
    transform: none !important;
    transition: none !important;
  }

  /* Modal sürükleme sırasında header vurgusu */
  .draggable-islem-detay-modal .q-card.modal-dragging .draggable-islem-detay-header {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%) !important;
    color: white !important;
  }

  .body--dark .draggable-islem-detay-modal .q-card.modal-dragging .draggable-islem-detay-header {
    background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%) !important;
    color: #e2e8f0 !important;
  }

  /* Sürükleme sırasında form boyutlarının değişmemesi için */
  .draggable-islem-detay-modal .q-card {
    /* Genişlik artık dinamik olarak hesaplanıyor */
    resize: none !important;
    overflow: visible !important;
  }

  /* Sürükleme sırasında scrollbar'ların görünmemesi için */
  .draggable-islem-detay-modal .q-card.modal-dragging {
    overflow: hidden !important;
  }

  /* Header alanının tamamında sürükleme aktif */
  .draggable-header {
    cursor: grab !important;
    user-select: none !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
  }

  .draggable-header:hover {
    cursor: move !important;
  }

  /* Header içindeki tüm elementler için pointer events */
  .draggable-header * {
    pointer-events: auto !important;
  }

  /* Header içindeki form elementlerinin etkileşimini koru */
  .draggable-header .q-input,
  .draggable-header .q-select {
    pointer-events: auto !important;
  }

  /* Header içindeki elementlerin hizalama için */
  .draggable-header .col-4 {
    display: flex !important;
    align-items: center !important;
  }

  .draggable-header .col-4.text-center {
    justify-content: center !important;
  }

  .draggable-header .col-4.text-right {
    justify-content: flex-end !important;
  }

    /* Readonly field için özel stil */
  .body--dark .readonly-field .q-field__control {
    background-color: rgba(35, 35, 35, 0.95) !important;
  }

  .body--dark .readonly-field .q-field__native {
    background-color: rgba(35, 35, 35, 0.95) !important;
    color: #b0b0b0 !important;
  }

  .body--dark .readonly-field .q-field__control--readonly {
    background-color: rgba(35, 35, 35, 0.95) !important;
  }

  /* Form düzeni için ek stiller */
  .form-input {
    transition: all 0.2s ease;
  }

  .form-input:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .form-label {
    color: #2c3e50;
    font-weight: 500;
    margin-bottom: 2px;
  }

  .body--dark .form-label {
    color: #e2e8f0;
  }

  /* Form alanları için simetrik düzen */
  .q-col-gutter-md > div {
    margin-bottom: 2px;
  }

  /* Textarea alanı için özel stil */
  .q-field--with-bottom {
    margin-bottom: 2px;
  }

  /* Form alanları için daha iyi hizalama */
  .q-input, .q-select {
    border-radius: 16px;
  }

  /* Sayısal alanlar için özel stil */
  .q-input[type="number"] {
    text-align: right;
  }

  /* Form alanları arasında tutarlı boşluk */
  .q-card-section .row > div {
    margin-bottom: 2px;
  }

  /* Header alanındaki form elemanları için özel stil */
  .draggable-header .q-input,
  .draggable-header .q-select {
    border-radius: 6px;
    font-size: 12px;
  }

  /* Header label ve input hizalaması için */
  .draggable-header .text-subtitle2 {
    display: flex;
    align-items: center;
    height: 40px;
    margin: 0;
    padding: 0;
  }

  .draggable-header .q-input {
    margin: 0;
    padding: 0;
  }

  /* Form alanları arası boşlukları azalt */
  .q-col-gutter-sm > div {
    margin-bottom: 2px;
  }

  .q-col-gutter-sm > div:last-child {
    margin-bottom: 2px;
  }

  /* Form label'ları için daha iyi hizalama */
  .form-label {
    display: flex;
    align-items: center;
    height: 20px;
    margin-bottom: 2px;
  }

  /* Buton alanı için ortalama */
  .q-card-actions[align="center"] {
    justify-content: center;
    padding: 10px 20px;
  }

  .q-card-actions[align="center"] .q-btn {
    margin: 0 8px;
  }

  .q-card-actions[align="center"] .q-btn:first-child {
    margin-left: 0;
  }

  .q-card-actions[align="center"] .q-btn:last-child {
    margin-right: 0;
  }

  /* Açıklama alanı font boyutu küçültme */
  .description-field .q-field__control {
    font-size: 10px;
  }

  /* Tutar alanı ortalanması */
  .amount-field .q-field__control {
    text-align: center;
  }

  /* Sil butonu X ikonu kontur çizimi */
  .delete-btn .q-icon {
    stroke: currentColor;
    stroke-width: 2px;
    fill: none;
  }

  /* Cari Hesap Adı combobox yüksekliği - İşlem Grubu ile eşit */
  .cari-hesap-combo .q-field__control {
    height: 40px;
  }

  /* İşlem Grubu combobox yüksekliği - Cari Hesap Adı ile eşit */
  .islem-grup-combo .q-field__control {
    height: 40px;
  }

  /* Form validasyon stilleri */
  .q-field--error .q-field__control {
    border-color: #c10015;
  }

  .q-field--error .q-field__label {
    color: #c10015;
  }

  .q-field--error .q-field__messages {
    color: #c10015;
    font-size: 12px;
    margin-top: 4px;
  }

/* Responsive tasarım */
@media (max-width: 768px) {
  .layout-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .left-column {
    position: static;
  }
  
  .ana-container {
    max-width: 100%;
    padding: 10px;
  }

  /* Mobil cihazlarda modal boyutları */
  .q-dialog .q-card {
    min-width: 95vw !important;
    max-width: 95vw !important;
    margin: 10px !important;
      cursor: default !important;
  }

  /* İşlem detay modal mobil boyutları */
  .draggable-islem-detay-modal .q-card {
    min-width: 95vw !important;
    max-width: 95vw !important;
    margin: 10px !important;
  }

  .draggable-header {
    padding: 8px 12px !important;
  }
}

/* Tablet cihazlar için */
@media (min-width: 769px) and (max-width: 1024px) {
  .q-dialog .q-card {
    min-width: 80vw !important;
    max-width: 80vw !important;
  }

  /* İşlem detay modal tablet boyutları */
  .draggable-islem-detay-modal .q-card {
    min-width: 70vw !important;
    max-width: 70vw !important;
  }
}

/* Modal'ın ekran dışına çıkmasını engelleme */
.q-dialog {
  max-width: 100vw !important;
  max-height: 100vh !important;
}

.q-dialog .q-card {
  max-width: calc(100vw - 40px) !important;
  max-height: calc(100vh - 40px) !important;
}

/* İşlem Detay Modal için özel genişlik kuralları */
.draggable-islem-detay-modal .q-card {
  /* Genişlik artık dinamik olarak hesaplanıyor, burada sadece temel stiller */
  max-height: 90vh !important;
  overflow-y: auto !important;
}



  /* Container stilleri */
  .header-container {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 8px 12px;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  .body--dark .header-container {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .middle-container {
    background: rgba(248, 249, 250, 0.3);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    margin: 0px 0;
  }

  .body--dark .middle-container {
    background: rgba(45, 55, 72, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .bottom-container {
    background: rgba(248, 249, 250, 0.2);
    border-radius: 12px;
    padding: 8px 16px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    margin-top: 0px;
  }

  .body--dark .bottom-container {
    background: rgba(45, 55, 72, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  /* Container başlıkları için stil */
  .header-container .text-subtitle2 {
    font-weight: 600;
    color: #495057;
  }

  .body--dark .header-container .text-subtitle2 {
    color: #e2e8f0;
  }

  /* Container içindeki butonlar için özel stil */
  .bottom-container .q-card-actions {
    margin: 4px 0;
  }

  .bottom-container .q-card-actions:first-child {
    margin-top: 0;
  }

  .bottom-container .q-card-actions:last-child {
    margin-bottom: 0;
  }

  /* Yellow background field class - highest specificity */
  .yellow-background-field .q-field__control {
    background-color: #fff3cd !important;
  }

  .yellow-background-field .q-field__native {
    background-color: #fff3cd !important;
    color: #000000 !important;
    font-weight: 500 !important;
  }

  .yellow-background-field .q-field__control--readonly {
    background-color: #fff3cd !important;
  }

  /* Dark mode override for yellow background class - ULTRA HIGH SPECIFICITY */
  .body--dark .yellow-background-field .q-field__control {
    background-color: #fff3cd !important;
  }

  .body--dark .yellow-background-field .q-field__native {
    background-color: #fff3cd !important;
    color: #000000 !important;
    font-weight: 500 !important;
  }

  .body--dark .yellow-background-field .q-field__control--readonly {
    background-color: #fff3cd !important;
  }

  /* Additional specificity for yellow background fields */
  .readonly-field.yellow-background-field .q-field__control {
    background-color: #fff3cd !important;
  }

  .readonly-field.yellow-background-field .q-field__native {
    background-color: #fff3cd !important;
    color: #000000 !important;
    font-weight: 500 !important;
  }

  .readonly-field.yellow-background-field .q-field__control--readonly {
    background-color: #fff3cd !important;
  }

  /* ULTRA HIGH SPECIFICITY OVERRIDES FOR DARK MODE */
  .body--dark .readonly-field.yellow-background-field .q-field__control {
    background-color: #fff3cd !important;
  }

  .body--dark .readonly-field.yellow-background-field .q-field__native {
    background-color: #fff3cd !important;
    color: #000000 !important;
    font-weight: 500 !important;
  }

  .body--dark .readonly-field.yellow-background-field .q-field__control--readonly {
    background-color: #fff3cd !important;
  }

  /* Force override for any Quasar dark mode styles */
  .body--dark .q-field.yellow-background-field .q-field__control {
    background-color: #fff3cd !important;
  }

  .body--dark .q-field.yellow-background-field .q-field__native {
    background-color: #fff3cd !important;
    color: #000000 !important;
    font-weight: 500 !important;
  }

  .body--dark .q-field.yellow-background-field .q-field__control--readonly {
    background-color: #fff3cd !important;
  }

  /* Additional Quasar component overrides */
  .body--dark .q-input.yellow-background-field .q-field__control {
    background-color: #fff3cd !important;
  }

  .body--dark .q-input.yellow-background-field .q-field__native {
    background-color: #fff3cd !important;
    color: #000000 !important;
    font-weight: 500 !important;
  }

  .body--dark .q-input.yellow-background-field .q-field__control--readonly {
    background-color: #fff3cd !important;
  }

  /* ULTIMATE OVERRIDE - Target q-input directly */
  .body--dark .q-input.yellow-background-field {
    background-color: #fff3cd !important;
  }

  .body--dark .q-input.yellow-background-field .q-field__control,
  .body--dark .q-input.yellow-background-field .q-field__native,
  .body--dark .q-input.yellow-background-field .q-field__control--readonly {
    background-color: #fff3cd !important;
    color: #000000 !important;
    font-weight: 500 !important;
  }

  /* Force override for any remaining Quasar styles */
  .body--dark .yellow-background-field * {
    color: #000000 !important;
  }

  .body--dark .yellow-background-field .q-field__native {
    color: #000000 !important;
  }

  /* Radio button with RST count display layout */
  .radio-with-rst {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: 16px;
  }

  /* RST Kayıt Sayısı Gösterimi Stilleri */
  .rst-count-display {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 6px;
    background-color: rgba(255, 193, 7, 0.1);
    border-radius: 4px;
    border: 1px solid rgba(255, 193, 7, 0.3);
    margin-left: 4px;
  }

  .rst-count-number {
    font-size: 11px;
    font-weight: 500;
    color: #333;
  }

  .rst-count-indicator {
    font-size: 12px;
  }

  /* Dark mode için RST count display stilleri */
  .body--dark .rst-count-display {
    background-color: rgba(255, 193, 7, 0.15);
    border-color: rgba(255, 193, 7, 0.4);
  }

  .body--dark .rst-count-number {
    color: #fff;
  }

  /* tblislemRST'de bulunan kayıtlar için sadece sol kenar marker */
  /* Full row background/font coloring removed as per user request */

  /* Alternative visual marker for highlighted rows */
  .rst-row-with-marker {
    position: relative;
    border-left: 4px solid #ffc107 !important;
  }

  /* Marker icon styling */
  .rst-marker-icon {
    background-color: #ffc107;
    color: #000;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  /* Dark mode marker */
  .body--dark .rst-row-with-marker {
    border-left: 4px solid #ffc107 !important;
  }

  .body--dark .rst-marker-icon {
    background-color: #ffc107;
    color: #000;
  }

  /* RST Differences Tooltip Styles */
  .rst-differences-tooltip {
    max-width: 600px !important;
  }

  .tooltip-content {
    padding: 8px;
  }

  .tooltip-title {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 8px;
    color: #333;
    text-align: center;
  }

  .body--dark .tooltip-title {
    color: #fff;
  }

  .differences-table {
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
  }

  .differences-header {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    background-color: #f5f5f5;
    font-weight: bold;
    font-size: 12px;
  }

  .body--dark .differences-header {
    background-color: #424242;
  }

  .differences-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    border-top: 1px solid #ddd;
    font-size: 11px;
  }

  .differences-cell {
    padding: 4px 6px;
    border-right: 1px solid #ddd;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .differences-cell:last-child {
    border-right: none;
  }

  .differences-row:nth-child(even) {
    border-top: 1px solid #ddd;
    background-color: #fafafa;
  }

  .body--dark .differences-row:nth-child(even) {
    background-color: #2a2a2a;
  }

  .loading-differences {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
    padding: 16px;
    color: #666;
    font-size: 12px;
  }

  .body--dark .loading-differences {
    color: #ccc;
  }


</style> 