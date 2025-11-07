<template>
  <q-page class="q-pa-sm light-page-background">
    <!-- İstatistik Kartları - Tek Satır Görünüm -->
    <div class="stats-cards-container">
      <div class="stats-card-wrapper">
        <q-card 
          class="bg-grey-7 text-white compact-card clickable-card"
          :class="{ 'active-filter': currentFilter === 'cikis-yapanlar' }"
          @click="loadFilteredData('cikis-yapanlar')"
        >
          <q-card-section class="q-pa-xs">
            <div class="text-body2">Eski Müşteri</div>
            <div class="text-h5">{{ cikisYapanlarSayisi || 0 }}</div>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="stats-card-wrapper">
        <q-card 
          class="bg-green text-white compact-card clickable-card"
          :class="{ 'active-filter': currentFilter === 'bugun-cikan' }"
          @click="loadFilteredData('bugun-cikan')"
        >
          <q-card-section class="q-pa-xs">
            <div class="text-body2">Bugün Çıkan</div>
            <div class="text-h5">{{ stats.BugünCikanKonaklama || 0 }}</div>
          </q-card-section>
        </q-card>
      </div>
      
      <!-- 🔥 YENİ KART: Yeni Müşteri -->
      <div class="stats-card-wrapper">
        <q-card 
          class="bg-pink text-white compact-card clickable-card"
          :class="{ 'active-filter': currentFilter === 'yeni-musteri' }"
          @click="loadFilteredData('yeni-musteri')"
        >
          <q-card-section class="q-pa-xs">
            <div class="text-body2">Yeni Müşteri</div>
            <div class="text-h5">{{ stats.YeniMusteriKonaklama || 0 }}</div>
          </q-card-section>
        </q-card>
      </div>
      
      <!-- 🔥 YENİ KART: Yeni Giriş -->
      <div class="stats-card-wrapper">
        <q-card 
          class="bg-teal text-white compact-card clickable-card"
          :class="{ 'active-filter': currentFilter === 'yeni-giris' }"
          @click="loadFilteredData('yeni-giris')"
        >
          <q-card-section class="q-pa-xs">
            <div class="text-body2">Yeni Giriş</div>
            <div class="text-h5">{{ stats.YeniGirisKonaklama || 0 }}</div>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="stats-card-wrapper">
        <q-card 
          class="bg-primary text-white compact-card clickable-card" 
          :class="{ 'active-filter': currentFilter === 'toplam-aktif' }"
          @click="loadFilteredData('toplam-aktif')"
        >
          <q-card-section class="q-pa-xs">
            <div class="text-body2">Devam Eden</div>
            <div class="text-h5">{{ stats.DevamEdenKonaklama || 0 }}</div>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="stats-card-wrapper">
        <q-card 
          class="bg-orange text-white compact-card clickable-card"
          :class="{ 'active-filter': currentFilter === 'suresi-dolan' }"
          @click="loadFilteredData('suresi-dolan')"
        >
          <q-card-section class="q-pa-xs">
            <div class="text-body2">Süresi Dolan</div>
            <div class="text-h5">{{ stats.SuresiGecentKonaklama || 0 }}</div>
          </q-card-section>
        </q-card>
      </div>
      
      <!-- 🔥 GRUP AYIRICI - İlk 6 kart ile sonraki 3 kart arası -->
      <div class="stats-group-divider"></div>
      
      <div class="stats-card-wrapper">
        <q-card 
          class="bg-red text-white compact-card clickable-card"
          :class="{ 'active-filter': currentFilter === 'borclu-musteriler' }"
          @click="loadFilteredData('borclu-musteriler')"
          v-if="true" 
        >
          <q-card-section class="q-pa-xs">
            <div class="text-body2">Borçlu Müşteriler</div>
            <div class="text-h5">{{ stats.BorcluMusteriSayisi || 0 }}</div>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="stats-card-wrapper">
        <q-card 
          class="bg-indigo text-white compact-card clickable-card"
          :class="{ 'active-filter': currentFilter === 'alacakli-musteriler' }"
          @click="loadFilteredData('alacakli-musteriler')"
          v-if="true"
        >
          <q-card-section class="q-pa-xs">
            <div class="text-body2">Alacaklı Müşteriler</div>
            <div class="text-h5">{{ stats.AlacakliMusteriSayisi || 0 }}</div>
          </q-card-section>
        </q-card>
      </div>
      
      <!-- 🔥 YENİ KART: Bakiyesiz Hesaplar -->
      <div class="stats-card-wrapper">
        <q-card 
          class="bg-grey-6 text-white compact-card clickable-card"
          :class="{ 'active-filter': currentFilter === 'bakiyesiz-hesaplar' }"
          @click="loadFilteredData('bakiyesiz-hesaplar')"
          v-if="true"
        >
          <q-card-section class="q-pa-xs">
            <div class="text-body2">Bakiyesiz Hesaplar</div>
            <div class="text-h5">{{ stats.BakiyesizHesaplarSayisi || 0 }}</div>
          </q-card-section>
        </q-card>
      </div>
      
      <!-- 🔥 GRUP AYIRICI - Bakiyesiz Hesaplar ile Listelenen Tutar arası -->
      <div class="stats-group-divider"></div>
      
      <div class="stats-card-wrapper">
        <q-card class="bg-purple text-white compact-card">
          <q-card-section class="q-pa-xs">
            <div class="text-body2">Listelenen Tutar</div>
            <div class="text-h5">{{ formatIntegerCurrency(listelenenGelir) }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Filtreler - Kompakt -->
    <div class="row q-gutter-sm q-mb-sm items-center">
      <div class="col-12 col-sm-3 col-md-2" style="max-width: 150px;">
        <q-select
          v-model="selectedTip"
          :options="filteredKonaklamaTipleri"
          label="Konaklama Tipi"
          outlined
          dense
          @update:model-value="onKonaklamaTipiChange"
          :disable="showBorcluTable || showAlacakliTable || showBakiyesizHesaplarTable"
        />
      </div>

      <!-- 🔥 FİLTRE TEMİZLE BUTONU -->
      <div class="col-auto flex items-center">
        <q-btn
          flat
          round
          dense
          color="orange-6"
          icon="filter_alt_off"
          size="sm"
          @click="clearFilters"
          :disable="selectedTip === 'TÜMÜ' && selectedOdaTip === 'TÜMÜ'"
        >
          <q-tooltip class="bg-orange text-white text-body2" :delay="300">
            Filtre Temizle
          </q-tooltip>
        </q-btn>
      </div>

      <div class="col-12 col-sm-3 col-md-3" style="max-width: 185px;">
        <q-select
          v-model="selectedOdaTip"
          :options="filteredOdaTipleri"
          label="Oda Tipi"
          outlined
          dense
          @update:model-value="onOdaTipiChange"
          :disable="showBorcluTable || showAlacakliTable || showBakiyesizHesaplarTable"
        />
      </div>

      <div class="col-12 col-sm-3 col-md-2" style="max-width: 180px;">
        <q-input
          ref="searchInputRef"
          v-model="searchText"
          label="Arama"
          outlined
          dense
          clearable
          @update:model-value="onSearchChange"
          @focus="onSearchFocus"
          @blur="onSearchBlur"
          debounce="300"
          placeholder="3 rakam yada en az 7 karakter"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      
      <div class="col-auto">
        <q-btn 
          color="primary" 
          icon="refresh" 
          label="Yenile" 
          size="sm"
          @click="refreshData"
          :loading="loading"
          class="refresh-btn"
        >
          <q-tooltip class="bg-primary text-white text-body2" :delay="300">
            Kart sayımlarını ve listeleri yenile
          </q-tooltip>
        </q-btn>
      </div>
      

      

      
      <!-- 🔥 FİRMA FİLTRESİ VE BAKİYE BİLGİLERİ KONTEYNER -->
      <div class="col-auto q-ml-auto row items-center q-gutter-md">
        <!-- FİRMA FİLTRESİ TOGGLE -->
        <div v-if="(selectedNormalMusteri && selectedNormalMusteri.MstrHspTip === 'Kurumsal') || (firmaFiltresiAktif && selectedFirmaAdi)" class="row items-center q-gutter-sm">
          <q-toggle
            v-model="firmaFiltresiAktif"
            color="primary"
            size="sm"
            @update:model-value="onFirmaFiltresiChange"
          />
          <div class="text-body3 text-grey-6">
            Sadece Firma
          </div>
        </div>
        
        <!-- SEÇİLEN FİRMA BAKİYE BİLGİSİ (Sadece Kurumsal Müşteriler İçin) -->
        <div v-if="(selectedNormalMusteri && selectedNormalMusteri.MstrHspTip === 'Kurumsal') || (firmaFiltresiAktif && selectedFirmaAdi)" class="row items-center q-gutter-sm">
          <div class="text-body1 text-grey-5">
            Seçilen Firma Bakiye:
          </div>
          <div class="text-h6 text-weight-bold" :class="getMusteriBakiyeClass(selectedFirmaBakiye)">
            {{ formatCurrency(selectedFirmaBakiye) }}
          </div>
        </div>

        <!-- SEÇİLEN MÜŞTERİ BAKİYE BİLGİSİ -->
        <div class="row items-center q-gutter-sm">
          <div class="text-body1 text-grey-5">
            Bakiye:
          </div>
          <div class="text-h6 text-weight-bold" :class="getMusteriBakiyeClass(selectedMusteriBakiye)">
            {{ formatCurrency(selectedMusteriBakiye) }}
          </div>
        </div>

        <!-- SEÇİLEN MÜŞTERİ DEPOZİTO BİLGİSİ -->
        <div class="row items-center q-gutter-sm">
          <div class="text-body1 text-grey-5">
            Depozito:
          </div>
          <div class="text-h6 text-weight-bold" :class="getMusteriBakiyeClass(selectedMusteriDepozito)">
            {{ formatCurrency(selectedMusteriDepozito) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Ana Grid - Normal Müşteri Tablosu -->
    <transition name="table-fade" mode="out-in">
      <q-table
        v-if="!showBorcluTable && !showAlacakliTable && !showBakiyesizHesaplarTable"
        :key="`normal-table-${currentFilter || 'default'}`"
        :rows="displayedMusteriListesi"
        :columns="columns"
        :row-key="(row: MusteriKonaklama) => `${row.MstrTCN}-${row.KnklmOdaNo}-${row.KnklmYtkNo}`"
        :loading="loading"
        :pagination="pagination"
        :selected="selectedNormalMusteri ? [selectedNormalMusteri] : []"
        selection="single"
        dense
        bordered
        separator="cell"
        class="dashboard-table compact-table"
        @row-click="onNormalMusteriClick"
        @row-dblclick="onRowDoubleClick"
        :rows-per-page-options="[10, 15, 25, 50]"
        rows-per-page-label="Sayfa Başına Kayıt"
        table-style="width: 100%"
        :disable-sort="false"
        flat
        :no-data-label="loading ? 'Veriler Yükleniyor...' : 'Listelenecek Kayıt Bulunamadı'"
      >
      <!-- Özel hücre şablonları -->
      <template v-slot:body-cell-MstrAdi="props">
        <q-td :props="props">
          <div class="flex items-center">
            <!-- 🚨 KARA LİSTE UYARI İKONU -->
            <q-icon 
              v-if="props.row.KnklmKrLst === 'EVET'"
              name="warning"
              color="red-6"
              size="md"
              class="q-mr-sm cursor-pointer"
              @click="showKaraListeUyarisi(props.row)"
            >
              <q-tooltip class="bg-red text-white text-body2" :delay="300">
                🚨 KARA LİSTE MÜŞTERİSİ - Detaylar için tıklayın
              </q-tooltip>
            </q-icon>
            <div class="text-weight-bold" :class="props.row.KnklmKrLst === 'EVET' ? 'text-red-6' : ''">
              {{ props.value }}
            </div>
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-KnklmOdaNo="props">
        <q-td :props="props">
          <q-chip 
            color="blue" 
            text-color="white" 
            dense
          >
            {{ props.row.KnklmOdaNo }}-{{ props.row.KnklmYtkNo }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-KnklmTip="props">
        <q-td :props="props">
          <q-badge 
            :color="getTipColor(props.value)" 
            :label="props.value"
          />
        </q-td>
      </template>

      <template v-slot:body-cell-KnklmNfyt="props">
        <q-td :props="props">
          <div class="text-weight-bold text-green">
            {{ formatCurrency(props.value) }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-KnklmPlnTrh="props">
        <q-td :props="props">
          <div :class="getDateClass(props.value)">
            {{ formatDate(props.value) }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-KnklmCksTrh="props">
        <q-td :props="props">
          <div :class="getDateClass(props.value)">
            {{ formatDate(props.value) }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-icon 
            name="visibility"
            color="blue-6"
            size="sm"
            class="cursor-help"
          >
            <q-tooltip class="bg-blue text-white text-body2" :delay="300">
              <div style="white-space: pre-line; max-width: 300px;">
                {{ getMusteriTooltipContent(props.row) }}
              </div>
            </q-tooltip>
          </q-icon>
        </q-td>
      </template>
      </q-table>
    </transition>

    <!-- Borçlu Müşteriler Tablosu -->
    <transition name="table-fade" mode="out-in">
      <q-table
        v-if="showBorcluTable"
        :key="`borclu-table`"
        :rows="displayedBorcluMusteriListesi"
        :columns="borcluColumns"
        :row-key="(row: BorcluMusteri) => row.CariKod"
        :loading="loading"
        :pagination="borcluPagination"
        :selected="selectedBorcluMusteri ? [selectedBorcluMusteri] : []"
        selection="single"
        dense
        bordered
        separator="cell"
        class="dashboard-table compact-table"
        @row-click="onBorcluMusteriClick"
        @row-dblclick="onBorcluMusteriDoubleClick"
        :rows-per-page-options="[5, 10, 15]"
        rows-per-page-label="Sayfa Başına Kayıt"
        table-style="width: 100%"
        :disable-sort="false"
        flat
        :no-data-label="loading ? 'Veriler Yükleniyor...' : 'Borçlu Müşteri Bulunamadı'"
      >
      <!-- Borçlu müşteri özel hücre şablonları -->
      <template v-slot:body-cell-cKytTarihi="props">
        <q-td :props="props" :class="{ 
          'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod
        }">
          {{ formatDate(props.value) }}
        </q-td>
      </template>

      <template v-slot:body-cell-CariKllnc="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-CariKod="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-CariAdi="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          <div class="text-weight-bold">{{ props.value }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-CariVD="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-CariVTCN="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-CariYetkili="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-CariTelNo="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-BorcTutari="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          <div class="text-weight-bold text-red">
            {{ formatCurrency(props.value) }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-odemeVadesi="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          <!-- Eğer ödeme vadesi yoksa '-' göster -->
          <span :class="{ 'text-red': !props.value }">
            {{ props.value ? formatDate(props.value) : '-' }}
          </span>
        </q-td>
      </template>

      <template v-slot:body-cell-CikisTarihi="props">
        <q-td :props="props" :class="{ 
          'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod
        }">
          <span :class="{ 
            'text-grey': !props.value,
            'exit-date-highlight': props.row.MstrDurum === 'AYRILDI' && props.value,
            'planned-date-highlight': props.row.MstrDurum === 'KALIYOR' && props.value
          }">
            {{ props.value ? formatDate(props.value) : '-' }}
          </span>
        </q-td>
      </template>
      </q-table>
    </transition>

    <!-- Alacaklı Müşteriler Tablosu -->
    <transition name="table-fade" mode="out-in">
      <q-table
        v-if="showAlacakliTable"
        :key="`alacakli-table`"
        :rows="displayedAlacakliMusteriListesi"
        :columns="alacakliColumns"
        :row-key="(row: AlacakliMusteri) => row.CariKod"
        :loading="loading"
        :pagination="alacakliPagination"
        :selected="selectedBorcluMusteri ? [selectedBorcluMusteri] : []"
        selection="single"
        dense
        bordered
        separator="cell"
        class="dashboard-table compact-table"
        @row-click="onAlacakliMusteriClick"
        @row-dblclick="onAlacakliMusteriDoubleClick"
        :rows-per-page-options="[5, 10, 15]"
        rows-per-page-label="Sayfa Başına Kayıt"
        table-style="width: 100%"
        :disable-sort="false"
        flat
        :no-data-label="loading ? 'Veriler Yükleniyor...' : 'Alacaklı Müşteri Bulunamadı'"
      >
      <!-- Alacaklı müşteri özel hücre şablonları -->
      <template v-slot:body-cell-cKytTarihi="props">
        <q-td :props="props" :class="{ 
          'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod
        }">
          {{ formatDate(props.value) }}
        </q-td>
      </template>

      <template v-slot:body-cell-CariKllnc="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-CariKod="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-CariAdi="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          <div class="text-weight-bold">{{ props.value }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-CariVD="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-CariVTCN="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-CariYetkili="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-CariTelNo="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-AlacakTutari="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          <div class="text-weight-bold text-green">
            {{ formatCurrency(props.value) }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-CikisTarihi="props">
        <q-td :props="props" :class="{ 
          'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod
        }">
          <span :class="{ 
            'text-grey': !props.value,
            'exit-date-highlight': props.row.MstrDurum === 'AYRILDI' && props.value,
            'planned-date-highlight': props.row.MstrDurum === 'KALIYOR' && props.value
          }">
            {{ props.value ? formatDate(props.value) : '-' }}
          </span>
        </q-td>
      </template>
      </q-table>
    </transition>

    <!-- 🔥 Bakiyesiz Hesaplar Tablosu -->
    <transition name="table-fade" mode="out-in">
      <q-table
        v-if="showBakiyesizHesaplarTable"
        :key="`bakiyesiz-table`"
        :rows="displayedBakiyesizHesaplarListesi"
        :columns="bakiyesizHesaplarColumns"
        :row-key="(row: BakiyesizHesaplar) => row.CariKod"
        :loading="bakiyesizHesaplarLoading"
        :pagination="bakiyesizHesaplarPagination"
        dense
        bordered
        separator="cell"
        class="dashboard-table compact-table"
        @row-click="onBakiyesizHesaplarClick"
        @row-dblclick="onBakiyesizHesaplarDoubleClick"
        @request="onBakiyesizHesaplarRequest"
        :rows-per-page-options="[5, 10, 20]"
        rows-per-page-label="Sayfa Başına Kayıt"
        table-style="width: 100%"
        :disable-sort="false"
        flat
        :no-data-label="bakiyesizHesaplarLoading ? 'Veriler Yükleniyor...' : 'Bakiyesiz Hesap Bulunamadı'"
      >
      <!-- Bakiyesiz hesaplar özel hücre şablonları -->
      <template v-slot:body-cell-cKytTarihi="props">
        <q-td :props="props" :class="{ 
          'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod
        }">
          {{ formatDate(props.value) }}
        </q-td>
      </template>

      <template v-slot:body-cell-CariKllnc="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-CariKod="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-CariAdi="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          <div class="text-weight-bold">{{ props.value }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-CariVD="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-CariVTCN="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-CariYetkili="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-CariTelNo="props">
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
          {{ props.value }}
        </q-td>
      </template>

                      <template v-slot:body-cell-BorcTutari="props">
                  <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
                    <div class="text-weight-bold text-grey-6">
                      {{ formatCurrency(props.value) }}
                    </div>
                  </q-td>
                </template>

                <template v-slot:body-cell-CksPlnTrh="props">
                  <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
                    <div :class="getDateClass(props.value)">
                      {{ props.value ? formatDate(props.value) : '-' }}
                    </div>
                  </q-td>
                </template>

      <template v-slot:body-cell-CikisTarihi="props">
        <q-td :props="props" :class="{ 
          'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod
        }">
          <span :class="{ 
            'text-grey': !props.value,
            'exit-date-highlight': props.row.MstrDurum === 'AYRILDI' && props.value,
            'planned-date-highlight': props.row.MstrDurum === 'KALIYOR' && props.value
          }">
            {{ props.value ? formatDate(props.value) : '-' }}
          </span>
        </q-td>
      </template>
      </q-table>
    </transition>

    <!-- Cari Hareketler Tablosu (Seçilen Müşteri veya Firma Filtresi için) -->
    <transition name="table-fade" mode="out-in">
      <q-table
        ref="cariHareketlerTableRef"
        v-if="showCariHareketler"
        :key="cariHareketlerKey"
        :rows="displayedCariHareketlerListesi"
        :columns="cariHareketlerColumns"
        :row-key="(row: CariHareket) => `${row.iKytTarihi}-${row.islemTutar}`"
        :loading="cariHareketlerLoading"
        :pagination="cariHareketlerPagination"
        dense
        bordered
        separator="cell"
        class="dashboard-table compact-table q-mt-sm cari-hareketler-table"
        :rows-per-page-options="[15, 25, 50]"
        rows-per-page-label="Sayfa Başına Kayıt"
        table-style="width: 100%"
        :disable-sort="false"
        flat
        :no-data-label="cariHareketlerLoading ? 'Veriler Yükleniyor...' : 'Cari Hareket Bulunamadı'"
      >
      <template v-slot:top>
        <div class="text-h6 text-primary table-header-row">
          <span v-if="firmaFiltresiAktif && selectedFirmaAdi">{{ selectedFirmaAdi }} - Firma Cari Hareketler</span>
          <span v-else-if="selectedNormalMusteri">{{ selectedNormalMusteri.MstrAdi }} - Cari Hareketler</span>
          <span v-else-if="selectedBorcluMusteri">{{ selectedBorcluMusteri.CariAdi }} - Cari Hareketler</span>
          <span v-else>Cari Hareketler</span>
          
          <!-- 🔥 DİNAMİK BUTON: Cari Hareketler/Konaklama Geçmişi arasında geçiş -->
          <q-btn
            v-if="showToggleButton"
            unelevated
            color="deep-orange"
            text-color="white"
            @click="toggleAltTable"
            class="q-mr-md toggle-button"
            size="md"
            :icon="currentAltTableType === 'cari' ? 'swap_horiz' : 'swap_horiz'"
            :label="toggleButtonLabel"
          />
          
          <q-btn
            flat
            round
            dense
            class="pdf-btn"
            @click="() => downloadCurrentAltTablePDF()"
            :loading="cariPdfLoading"
          >
            <img src="/icons/adobe-pdf.png" alt="PDF" class="report-icon" />
            <q-tooltip class="bg-blue text-white text-body2" :delay="300">
              {{ currentAltTableType === 'cari' ? 'Cari Hareketler PDF' : 'Konaklama Geçmişi PDF' }}
            </q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            class="excel-btn"
            @click="() => downloadCurrentAltTableExcel()"
            :loading="cariExcelLoading"
          >
            <img src="/icons/excel-xlsx.png" alt="Excel" class="report-icon" />
            <q-tooltip class="bg-green text-white text-body2" :delay="300">
              {{ currentAltTableType === 'cari' ? 'Cari Hareketler Excel' : 'Konaklama Geçmişi Excel' }}
            </q-tooltip>
          </q-btn>
        </div>
      </template>

      <!-- Cari hareket özel hücre şablonları -->
      <template v-slot:body-cell-CariAdi="props">
        <q-td :props="props">
          <div class="text-weight-bold">
            {{ props.value || (firmaFiltresiAktif && selectedBorcluMusteri?.CariAdi) || (firmaFiltresiAktif && selectedNormalMusteri?.MstrAdi) || 'N/A' }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-iKytTarihi="props">
        <q-td :props="props">
          {{ formatDate(props.value) }}
        </q-td>
      </template>

      <template v-slot:body-cell-islemTip="props">
        <q-td :props="props">
          <q-badge 
            :color="getIslemTipColor(props.value)" 
            :text-color="getIslemTipTextColor(props.value)"
            :label="props.value"
            class="islem-tip-badge text-weight-bold"
          />
        </q-td>
      </template>

      <template v-slot:body-cell-islemTutar="props">
        <q-td :props="props">
          <div class="text-weight-bold" :class="getIslemTutarClass(props.row.islemTip)">
            {{ formatCurrency(props.value) }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-islemBilgi="props">
        <q-td :props="props">
          <div class="text-wrap" style="max-width: 374px; white-space: normal; word-wrap: break-word; line-height: 1.2;">
            {{ props.value }}
          </div>
        </q-td>
      </template>
      </q-table>
    </transition>

    <!-- Konaklama Geçmişi Tablosu (Seçilen Normal Müşteri veya Firma Filtresi için) -->
    <transition name="table-fade" mode="out-in">
      <q-table
        ref="konaklamaGecmisiTableRef"
        v-if="showKonaklamaGecmisi"
        :key="konaklamaGecmisiKey"
        :rows="displayedKonaklamaGecmisiListesi"
        :columns="konaklamaGecmisiColumns"
        :row-key="(row: any) => `${row.knklmNo}`"
        :loading="konaklamaGecmisiLoading"
        :pagination="konaklamaGecmisiPagination"
        dense
        bordered
        separator="cell"
        class="dashboard-table compact-table q-mt-md"
        :rows-per-page-options="[10, 15, 25]"
        rows-per-page-label="Sayfa Başına Kayıt"
        table-style="width: 100%"
        :disable-sort="false"
        flat
        :no-data-label="konaklamaGecmisiLoading ? 'Veriler Yükleniyor...' : 'Konaklama Geçmişi Bulunamadı'"
      >
      <template v-slot:top>
        <div class="text-h6 text-primary table-header-row">
          <span v-if="firmaFiltresiAktif && selectedFirmaAdi">{{ selectedFirmaAdi }} - Firma Konaklama Geçmişi</span>
          <span v-else-if="selectedNormalMusteri">{{ selectedNormalMusteri.MstrAdi }} - Konaklama Geçmişi</span>
          <span v-else-if="selectedBorcluMusteri">{{ selectedBorcluMusteri.CariAdi }} - Konaklama Geçmişi</span>
          <span v-else>Konaklama Geçmişi</span>
          
          <!-- 🔥 DİNAMİK BUTON: Cari Hareketler/Konaklama Geçmişi arasında geçiş -->
          <q-btn
            v-if="showToggleButton"
            unelevated
            color="deep-orange"
            text-color="white"
            @click="toggleAltTable"
            class="q-mr-md toggle-button"
            size="md"
            :icon="currentAltTableType === 'cari' ? 'swap_horiz' : 'swap_horiz'"
            :label="toggleButtonLabel"
          />
          
          <q-btn
            flat
            round
            dense
            class="pdf-btn"
            @click="() => downloadCurrentAltTablePDF()"
            :loading="pdfLoading"
          >
            <img src="/icons/adobe-pdf.png" alt="PDF" class="report-icon" />
            <q-tooltip class="bg-red text-white text-body2" :delay="300">
              {{ currentAltTableType === 'cari' ? 'Cari Hareketler PDF' : 'Konaklama Geçmişi PDF' }}
            </q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            class="excel-btn"
            @click="() => downloadCurrentAltTableExcel()"
            :loading="excelLoading"
          >
            <img src="/icons/excel-xlsx.png" alt="Excel" class="report-icon" />
            <q-tooltip class="bg-green text-white text-body2" :delay="300">
              {{ currentAltTableType === 'cari' ? 'Cari Hareketler Excel' : 'Konaklama Geçmişi Excel' }}
            </q-tooltip>
          </q-btn>
        </div>
      </template>

      <!-- Konaklama geçmişi özel hücre şablonları -->
      <template v-slot:body-cell-MstrAdi="props">
        <q-td :props="props">
          <div class="flex items-center">
            <!-- 🚨 KARA LİSTE UYARI İKONU -->
            <q-icon 
              v-if="props.row.KnklmKrLst === 'EVET'"
              name="warning"
              color="red-6"
              size="md"
              class="q-mr-sm cursor-pointer"
              @click="showKaraListeUyarisi(props.row)"
            >
              <q-tooltip class="bg-red text-white text-body2" :delay="300">
                🚨 KARA LİSTE MÜŞTERİSİ - Detaylar için tıklayın
              </q-tooltip>
            </q-icon>
            <div class="text-weight-bold" :class="props.row.KnklmKrLst === 'EVET' ? 'text-red-6' : ''">
            {{ props.value || (firmaFiltresiAktif && selectedNormalMusteri?.MstrAdi) || 'N/A' }}
            </div>
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-kKytTarihi="props">
        <q-td :props="props">
          {{ formatDate(props.value) }}
        </q-td>
      </template>

      <template v-slot:body-cell-KnklmOdaNo="props">
        <q-td :props="props">
          <q-chip 
            color="blue" 
            text-color="white" 
            dense
          >
            {{ props.row.KnklmOdaNo }}-{{ props.row.KnklmYtkNo }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-KnklmTip="props">
        <q-td :props="props">
          <q-badge 
            :color="getTipColor(props.value)" 
            :label="props.value"
          />
        </q-td>
      </template>

      <template v-slot:body-cell-KnklmNfyt="props">
        <q-td :props="props">
          <div class="text-weight-bold text-green">
            {{ formatCurrency(props.value) }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-KnklmGrsTrh="props">
        <q-td :props="props">
          {{ formatDate(props.value) }}
        </q-td>
      </template>

      <template v-slot:body-cell-KnklmPlnTrh="props">
        <q-td :props="props">
          {{ formatDate(props.value) }}
        </q-td>
      </template>

      <template v-slot:body-cell-KnklmCksTrh="props">
        <q-td :props="props">
          {{ formatDate(props.value) }}
        </q-td>
      </template>

      <template v-slot:body-cell-Detaylar="props">
        <q-td :props="props">
          <q-icon 
            name="visibility"
            color="blue-6"
            size="sm"
            class="cursor-pointer"
          >
            <q-tooltip class="bg-blue text-white text-body2" :delay="300">
              <div style="white-space: pre-line; max-width: 300px;">
                {{ getKonaklamaTooltipContent(props.row) }}
              </div>
            </q-tooltip>
          </q-icon>
        </q-td>
      </template>
      </q-table>
    </transition>

    <!-- Detay Dialog -->
    <q-dialog v-model="showDetailDialog" persistent class="floating-dialog">
      <q-card style="min-width: 500px" class="draggable-card">
        <q-card-section class="row items-center q-pb-none bg-primary text-white cursor-move q-card__section--head" @mousedown="startDrag">
          <div class="text-h6">Müşteri Detayları</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedRow">
          <div class="row q-gutter-md">
            <div class="col-12">
              <strong>Müşteri Adı:</strong> {{ selectedRow.MstrAdi }}
            </div>
            <div class="col-12">
              <strong>TC Kimlik:</strong> {{ selectedRow.MstrTCN }}
            </div>
            <div class="col-12">
              <strong>Telefon:</strong> {{ selectedRow.MstrTelNo }}
            </div>
            <div class="col-12">
              <strong>Firma:</strong> {{ selectedRow.MstrFirma || 'Bireysel' }}
            </div>
            <div class="col-12">
              <strong>Oda:</strong> {{ selectedRow.KnklmOdaNo }}-{{ selectedRow.KnklmYtkNo }} ({{ selectedRow.KnklmOdaTip }})
            </div>
            <div class="col-12">
              <strong>Konaklama Tipi:</strong> {{ selectedRow.KnklmTip }}
            </div>
            <div class="col-12">
              <strong>Tutar:</strong> {{ formatCurrency(selectedRow.KnklmNfyt) }}
            </div>
            <div class="col-12">
              <strong>Giriş Tarihi:</strong> {{ formatDate(selectedRow.KnklmGrsTrh) }}
            </div>
            <div class="col-12">
              <strong>Planlanan Çıkış:</strong> {{ formatDate(selectedRow.KnklmPlnTrh) }}
            </div>
            <div class="col-12" v-if="selectedRow.KnklmNot">
              <strong>Not:</strong> {{ selectedRow.KnklmNot }}
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Kapat" color="primary" @click="showDetailDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Konaklama Detay Dialog -->
    <q-dialog v-model="showKonaklamaDetayDialog" persistent class="floating-dialog">
      <q-card style="min-width: 600px" class="draggable-card">
        <q-card-section class="row items-center q-pb-none bg-primary text-white cursor-move q-card__section--head" @mousedown="startDrag">
          <div class="text-h6">Konaklama Detayları</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedKonaklamaDetay">
          <div class="row q-gutter-md">
            <div class="col-12">
              <q-input
                v-model="selectedKonaklamaDetay.KnklmKllnc"
                label="Kullanıcı"
                outlined
                readonly
                dense
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="selectedKonaklamaDetay.KnklmLfyt"
                label="Liste Fiyatı"
                outlined
                readonly
                dense
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="selectedKonaklamaDetay.Knklmisk"
                label="İskonto"
                outlined
                readonly
                dense
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="selectedKonaklamaDetay.KnklmOdmTkvGun"
                label="Ödeme Takvim Günü"
                outlined
                readonly
                dense
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="selectedKonaklamaDetay.KnklmKrLst"
                label="Kara Liste"
                outlined
                readonly
                dense
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="selectedKonaklamaDetay.KnklmNot"
                label="Not"
                outlined
                readonly
                dense
                type="textarea"
                rows="3"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Kapat" color="primary" @click="showKonaklamaDetayDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Loading overlay -->
    <q-inner-loading :showing="loading">
      <q-spinner-gears size="50px" color="primary" />
    </q-inner-loading>

    <!-- 🚨 KARA LİSTE UYARI DIALOG -->
    <q-dialog v-model="showKaraListeDialog" persistent class="floating-dialog">
      <q-card style="min-width: 500px; max-width: 600px" class="draggable-card">
        <q-card-section class="row items-center q-pb-none bg-red text-white cursor-move q-card__section--head" @mousedown="startDrag">
          <q-icon name="warning" size="md" class="q-mr-sm" />
          <div class="text-h6">🚨 KARA LİSTE MÜŞTERİSİ UYARI</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedKaraListeMusteri">
          <div class="text-center q-mb-md">
            <q-icon name="report_problem" size="4rem" color="red-6" />
          </div>
          
          <div class="text-h6 text-center text-red-6 q-mb-md">
            ⚠️ DİKKAT: Bu müşteri kara listede yer almaktadır!
          </div>
          
          <div class="q-mb-md">
            <strong>Müşteri Bilgileri:</strong>
            <ul class="q-pl-md">
              <li><strong>Adı:</strong> {{ (selectedKaraListeMusteri as any).MstrAdi || 'N/A' }}</li>
              <li><strong>TC:</strong> {{ (selectedKaraListeMusteri as any).MstrTCN || 'N/A' }}</li>
              <li v-if="(selectedKaraListeMusteri as any).MstrTelNo"><strong>Telefon:</strong> {{ (selectedKaraListeMusteri as any).MstrTelNo }}</li>
              <li v-if="(selectedKaraListeMusteri as any).MstrFirma"><strong>Firma:</strong> {{ (selectedKaraListeMusteri as any).MstrFirma }}</li>
              <li v-if="(selectedKaraListeMusteri as any).KnklmNot"><strong>Kara Liste Sebebi:</strong> {{ (selectedKaraListeMusteri as any).KnklmNot }}</li>
              <li v-else><strong>Kara Liste Sebebi:</strong> <em>Açıklama bulunmuyor</em></li>
            </ul>
          </div>

          <q-banner class="bg-red-1 text-red-8 q-mb-md" rounded>
            <template v-slot:avatar>
              <q-icon name="info" color="red-6" />
            </template>
            Bu müşteriyle ilgili işlemler yapmadan önce lütfen kara listeye alınma sebebini inceleyin.
          </q-banner>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="ANLADIM" color="red" @click="showKaraListeDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>



    <!-- Dönem Yenileme Modal -->
    <DonemYenilemeModal 
      v-model="showDonemYenilemeModal"
      :selected-data="donemYenilemeData"
      :active-filter="currentFilter"
      @saved="refreshData"
      @refresh="refreshData"
      @success="onModalSuccess"
    />

    <OdemeIslemForm v-model:show="showOdemeIslemModal" :musteriAdi="odemeMusteriAdi" @bakiyeGuncelle="bakiyeGuncelleHandler" />
    
    <!-- 🔥 DEBUG: Seçili müşteri bilgisi -->
    <div v-if="false" style="position: fixed; top: 10px; right: 10px; background: white; padding: 10px; border: 1px solid black; z-index: 9999;">
      <div>selectedNormalMusteri: {{ selectedNormalMusteri?.MstrAdi || 'BOŞ' }}</div>
      <div>showOdemeIslemModal: {{ showOdemeIslemModal }}</div>
    </div>
    <EkHizmetlerForm v-model:show="showEkHizmetlerModal" />

    <!-- DEBUG LOGS -->
    <!-- <q-banner v-if="showBorcluTable" dense class="bg-grey-2 text-grey-8 q-mb-xs">
      borcluMusteriListesi.length: {{ borcluMusteriListesi.length }} | borcluPagination.rowsPerPage: {{ borcluPagination.rowsPerPage }} | shouldShowSearchBox: {{ shouldShowSearchBox }}
    </q-banner> -->
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../boot/axios'
import DonemYenilemeModal from '../components/DonemYenilemeModal.vue'
import { selectedCustomer } from '../stores/selected-customer';
import OdemeIslemForm from '../components/OdemeIslemForm.vue';
//import EkHizmetlerForm from '../components/EkHizmetlerForm.vue';

// Tip tanımları
import type { DashboardStats, MusteriKonaklama, BorcluMusteri, AlacakliMusteri, BakiyesizHesaplar, CariHareket, KonaklamaGecmisi } from '../components/models';
type SearchMusteriKonaklama = Partial<MusteriKonaklama> & { targetKart?: string };

// QTable pagination event tipi
// Quasar'ın bazı sürümlerinde QTableRequest tipi export edilmiyor, bu yüzden elle tanımlıyoruz
// Eğer Quasar güncellenirse, import ile kullanılabilir
// https://quasar.dev/vue-components/table#pagination-and-sorting

// Router instance
const router = useRouter()

// Reactive değişkenler
const loading = ref(false)
const musteriListesi = ref<MusteriKonaklama[]>([])
const borcluMusteriListesi = ref<BorcluMusteri[]>([])
const alacakliMusteriListesi = ref<AlacakliMusteri[]>([])
const bakiyesizHesaplarListesi = ref<BakiyesizHesaplar[]>([])
const showBorcluTable = ref(false)
const showAlacakliTable = ref(false)
const showBakiyesizHesaplarTable = ref(false)
const stats = ref<DashboardStats>({})
const konaklamaTipleri = ref<string[]>(['TÜMÜ'])
const selectedTip = ref('TÜMÜ')
const odaTipleri = ref<string[]>(['TÜMÜ'])
const selectedOdaTip = ref('TÜMÜ')
const showDetailDialog = ref(false)
const selectedRow = ref<MusteriKonaklama | null>(null)
const currentFilter = ref<string | null>(null)
const cikisYapanlarSayisi = ref<number>(0)

// Arama için yeni değişkenler
const searchText = ref('')
const filteredMusteriListesi = ref<MusteriKonaklama[]>([])
const filteredBorcluMusteriListesi = ref<BorcluMusteri[]>([])
const filteredBakiyesizHesaplarListesi = ref<BakiyesizHesaplar[]>([])
const filteredCariHareketlerListesi = ref<CariHareket[]>([])

// Dönem yenileme modal için
const showDonemYenilemeModal = ref(false)
const donemYenilemeData = ref<MusteriKonaklama | null>(null)

// Cari hareketler için yeni değişkenler
const selectedBorcluMusteri = ref<BorcluMusteri | AlacakliMusteri | null>(null)
const showCariHareketler = ref(false)
const cariHareketlerListesi = ref<CariHareket[]>([])
const cariHareketlerLoading = ref(false)
const bakiyesizHesaplarLoading = ref(false)

// 🔥 Cari hareketler tablosu için ref
const cariHareketlerTableRef = ref<{ $el: HTMLElement } | null>(null)

// 🔥 Konaklama geçmişi tablosu için ref
const konaklamaGecmisiTableRef = ref<{ $el: HTMLElement } | null>(null)

// Konaklama geçmişi için yeni değişkenler
const selectedNormalMusteri = ref<MusteriKonaklama | null>(null)
const showKonaklamaGecmisi = ref(false)
const konaklamaGecmisiListesi = ref<KonaklamaGecmisi[]>([])
const konaklamaGecmisiLoading = ref(false)
const showKonaklamaDetayDialog = ref(false)
const selectedKonaklamaDetay = ref<KonaklamaGecmisi | null>(null)

// 🔥 DİNAMİK BUTON SİSTEMİ
const showToggleButton = ref(false)
const currentAltTableType = ref<'konaklama' | 'cari'>('konaklama')



// 🔥 SEÇİLEN MÜŞTERİ BAKİYE BİLGİSİ
const selectedMusteriBakiye = ref<number>(0)
const selectedMusteriDepozito = ref<number>(0)
const selectedFirmaBakiye = ref<number>(0)

// 🔥 FİRMA FİLTRESİ
const firmaFiltresiAktif = ref<boolean>(false)
const selectedFirmaAdi = ref<string>('')

// 🚨 KARA LİSTE UYARI SİSTEMİ
const showKaraListeDialog = ref<boolean>(false)
const selectedKaraListeMusteri = ref<MusteriKonaklama | KonaklamaGecmisi | null>(null)

// 📊 RAPOR İNDİRME SİSTEMİ
const pdfLoading = ref<boolean>(false)
const excelLoading = ref<boolean>(false)
const cariPdfLoading = ref(false)
const cariExcelLoading = ref(false)

// Pagination konfigürasyonu
const pagination = ref({
  sortBy: 'KnklmPlnTrh',
  descending: false,
  page: 1,
  rowsPerPage: 10
})

// Konaklama geçmişi pagination
const konaklamaGecmisiPagination = ref({
  sortBy: 'knklmNo',
  descending: true,
  page: 1,
  rowsPerPage: 10
})



// Listelenen müşterilerin tutar toplamını hesapla
const listelenenGelir = computed(() => {
  if (showBorcluTable.value) {
    // Borçlu müşteriler tablosu aktifse filtrelenmiş borç tutarlarını topla
    return displayedBorcluMusteriListesi.value.reduce((total, musteri) => total + (musteri.BorcTutari || 0), 0)
  } else if (showAlacakliTable.value) {
    // Alacaklı müşteriler tablosu aktifse filtrelenmiş alacak tutarlarını topla (negatif değer)
    return -(displayedAlacakliMusteriListesi.value.reduce((total, musteri) => total + (musteri.AlacakTutari || 0), 0))
  } else if (showBakiyesizHesaplarTable.value) {
    // Bakiyesiz hesaplar tablosu aktifse toplam 0 (çünkü tüm hesapların bakiyesi 0)
    return 0
  } else {
    // Normal müşteri tablosu aktifse filtrelenmiş konaklama tutarlarını topla
    return displayedMusteriListesi.value.reduce((total, musteri) => total + (musteri.KnklmNfyt || 0), 0)
  }
})

const showOdemeIslemModal = ref(false);
const odemeMusteriAdi = computed(() => {
  const fromSelected = selectedNormalMusteri.value?.MstrAdi;
  const fromWindow = (window as Window & { kartliIslemSelectedNormalMusteri?: { MstrAdi?: string } }).kartliIslemSelectedNormalMusteri?.MstrAdi;
  return fromSelected || fromWindow || '';
});
// Filtrelenmiş veriler - tablo için kullanılacak
const displayedMusteriListesi = computed(() => {
  let baseList = musteriListesi.value;
  
  // Arama filtresi uygula - 3 haneli oda araması veya 7+ karakter araması
  if (searchText.value && (searchText.value.length >= 7 || /^\d{3}$/.test(searchText.value.trim()))) {
    baseList = filteredMusteriListesi.value as unknown as MusteriKonaklama[];
  }
  
  // Firma filtresi uygula
  if (firmaFiltresiAktif.value && selectedFirmaAdi.value) {
    baseList = baseList.filter(musteri => musteri.MstrFirma === selectedFirmaAdi.value);
  }
  
  return baseList;
})

const displayedBorcluMusteriListesi = computed(() => {
  let baseList = borcluMusteriListesi.value;
  
  // Arama filtresi uygula
  if (searchText.value && searchText.value.length >= 7) {
    baseList = filteredBorcluMusteriListesi.value;
  }
  
  // Firma filtresi uygula - borçlu müşteriler için MstrFirma ile eşleştir
  if (firmaFiltresiAktif.value && selectedFirmaAdi.value) {
    baseList = baseList.filter(musteri => {
      // MstrFirma alanında firma adı eşleşen müşterileri filtrele
      return musteri.MstrFirma && musteri.MstrFirma === selectedFirmaAdi.value;
    });
  }
  
  return baseList;
})

// Alacaklı müşteri filtreleme computed property
const filteredAlacakliMusteriListesi = computed(() => {
  // 3 haneli sayı ise oda araması (istisna)
  if (/^\d{3}$/.test(searchText.value.trim())) {
    return alacakliMusteriListesi.value
  } else if (!searchText.value || searchText.value.length < 7) {
    // 3 haneli sayı değilse en az 7 karakter gerekli
    return alacakliMusteriListesi.value
  }
  
  const searchLower = searchText.value.toLowerCase()
  return alacakliMusteriListesi.value.filter(musteri => {
    return Object.values(musteri).some(value => {
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(searchLower)
    })
  })
})

const displayedAlacakliMusteriListesi = computed(() => {
  let baseList = alacakliMusteriListesi.value;
  
  // Arama filtresi uygula
  if (searchText.value && searchText.value.length >= 7) {
    baseList = filteredAlacakliMusteriListesi.value;
  }
  
  // Firma filtresi uygula - alacaklı müşteriler için MstrFirma ile eşleştir
  if (firmaFiltresiAktif.value && selectedFirmaAdi.value) {
    baseList = baseList.filter(musteri => {
      // MstrFirma alanında firma adı eşleşen müşterileri filtrele
      return musteri.MstrFirma && musteri.MstrFirma === selectedFirmaAdi.value;
    });
  }
  
  return baseList;
})

const displayedCariHareketlerListesi = computed(() => {
  return cariHareketlerListesi.value;
})
function getIslemTipColor(val?: string | null): string {
  const raw = (val ?? '').toString().trim();
  if (!raw) return 'grey-5';

  // Türkçe büyük harfe dönüştür ve diakritikleri kaldır (İ, ı, Ç vb.)
  const upperTr = raw.toLocaleUpperCase('tr-TR');
  const normalized = upperTr
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // diakritikleri temizle

  switch (normalized) {
    case 'GELIR':
      return 'green-9'; // koyu yeşil
    case 'GIDER':
      return 'deep-orange-9'; // koyu turuncu
    case 'GIREN':
      return 'deep-orange-5'; // 🔥 SWAP: GİREN artık turuncu
    case 'CIKAN':
      return 'green-5'; // 🔥 SWAP: ÇIKAN artık yeşil
    default:
      return 'grey-5';
  }
}

function getIslemTipTextColor(val?: string | null): string {
  const raw = (val ?? '').toString().trim();
  if (!raw) return 'white';

  const upperTr = raw.toLocaleUpperCase('tr-TR');
  const normalized = upperTr
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Açık zeminlerde koyu metin, koyu zeminlerde beyaz metin
  switch (normalized) {
    case 'GELIR':
      return 'white'; // green-9 koyu -> beyaz metin
    case 'GIDER':
      return 'white'; // deep-orange-9 koyu -> beyaz metin
    case 'GIREN':
      return 'white'; // green-7 koyu -> beyaz metin
    case 'CIKAN':
      return 'white'; // deep-orange-7 koyu -> beyaz metin
    default:
      return 'white';
  }
}

const displayedBakiyesizHesaplarListesi = computed(() => {
  let baseList = bakiyesizHesaplarListesi.value;
  
  // Arama filtresi uygula
  if (searchText.value && searchText.value.length >= 7) {
    baseList = filteredBakiyesizHesaplarListesi.value;
  }
  
  return baseList;
})

// 🔥 DİNAMİK BUTON COMPUTED PROPERTY'LERİ
const toggleButtonLabel = computed(() => {
  if (currentAltTableType.value === 'konaklama') {
    return 'Cari Hareketler'
  } else {
    return 'Konaklama Geçmişi'
  }
})

const displayedKonaklamaGecmisiListesi = computed(() => {
  return konaklamaGecmisiListesi.value
})

// 🔥 Arama kutusu kontrol referansları
const searchInputRef = ref<{ focus: () => void } | null>(null)
const isSearchFocused = ref<boolean>(false)
// Arama isteklerini kontrol etmek için sıralı kimlik ve AbortController
let searchRequestSeq = 0
let activeSearchController: AbortController | null = null

// 🔥 Alt grid animasyon kontrolü
const cariHareketlerKey = ref<string>('cari-empty')
const konaklamaGecmisiKey = ref<string>('konaklama-empty')
const bakiyesizHesaplarKey = ref<string>('bakiyesiz-empty')

// 🔥 Tek tıklama gecikme kontrolü
const normalMusteriClickTimeout = ref<number | null>(null)
const borcluMusteriClickTimeout = ref<number | null>(null)
const alacakliMusteriClickTimeout = ref<number | null>(null)
const bakiyesizHesaplarClickTimeout = ref<number | null>(null)

// Arama kutusu focus event handler
function onSearchFocus() {
  isSearchFocused.value = true
  
}

// Arama kutusu blur event handler
function onSearchBlur() {
  isSearchFocused.value = false
  
}

// Pagination izleyicisi - sıralama değişikliklerinde API çağrısı yapma
let sortingInProgress = false

watch(
  () => [pagination.value.sortBy, pagination.value.descending],
  () => {
    if (!sortingInProgress) {
      
      sortingInProgress = true
    }
  }
)

// 🔥 Dönem yenileme modal kapanma izleyicisi
watch(
  () => showDonemYenilemeModal.value,
  (newValue, oldValue) => {
    // Modal kapandığında (true'dan false'a geçtiğinde) bakiyeyi sıfırla
    if (oldValue === true && newValue === false) {
      selectedMusteriBakiye.value = 0
      selectedMusteriDepozito.value = 0
      selectedFirmaBakiye.value = 0
      
    }
  }
)

// Watch fonksiyonları kaldırıldı - event handler'lar kullanılıyor

// Tarih alanları için sıralama fonksiyonu
function sortByDate(a: string, b: string): number {
  const dateA = parseDateString(a)
  const dateB = parseDateString(b)
  return dateA.getTime() - dateB.getTime()
}

// DD.MM.YYYY formatındaki string'i Date objesine çevir
function parseDateString(dateStr: string): Date {
  if (!dateStr) return new Date(0) // Boş tarih için epoch başlangıcı
  
  // Önce DD.MM.YYYY formatını dene
  const parts = dateStr.split('.')
  if (parts.length === 3) {
    const day = parseInt(parts[0] || '0', 10)
    const month = parseInt(parts[1] || '0', 10) - 1 // JavaScript ay indexi 0'dan başlar
    const year = parseInt(parts[2] || '0', 10)
    
    // Geçerli tarih kontrolü
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day)
    }
  }
  
  // DD.MM.YYYY formatı başarısız olursa, direkt Date constructor'ını dene
  try {
    const dateObj = new Date(dateStr)
    if (!isNaN(dateObj.getTime())) {
      return dateObj
    }
  } catch (error) {
    console.error('Tarih parse hatası:', error, 'Tarih string:', dateStr)
  }
  
  return new Date(0) // Hata durumunda epoch başlangıcı
}

// 🔥 DİNAMİK TABLO KONFİGÜRASYONU - Çıkış tarihi sütunu sadece çıkış yapan kartlarda görünür
const columns = computed(() => {
  const baseColumns = [
  {
    name: 'MstrTCN',
    required: true,
    label: 'TC Kimlik',
    align: 'left' as const,
    field: 'MstrTCN',
    sortable: true,
    sort: (a: string, b: string, rowA: MusteriKonaklama, rowB: MusteriKonaklama) => {
      // Önce TC kimliğe göre sırala
      if (a !== b) return a.localeCompare(b);
      // TC kimlik aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.KnklmGrsTrh);
      const tarihB = parseDateString(rowB.KnklmGrsTrh);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'MstrAdi',
    required: true,
    label: 'Müşteri Adı',
    align: 'left' as const,
    field: 'MstrAdi',
    sortable: true,
    sort: (a: string, b: string, rowA: MusteriKonaklama, rowB: MusteriKonaklama) => {
      // Önce müşteri adına göre sırala
      if (a !== b) return a.localeCompare(b);
      // Müşteri adı aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.KnklmGrsTrh);
      const tarihB = parseDateString(rowB.KnklmGrsTrh);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'MstrFirma',
    label: 'Firma',
    align: 'left' as const,
    field: 'MstrFirma',
    sortable: true,
    sort: (a: string, b: string, rowA: MusteriKonaklama, rowB: MusteriKonaklama) => {
      // Önce firma adına göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // Firma adı aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.KnklmGrsTrh);
      const tarihB = parseDateString(rowB.KnklmGrsTrh);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'MstrTelNo',
    label: 'Telefon',
    align: 'left' as const,
    field: 'MstrTelNo',
    sortable: true,
    sort: (a: string, b: string, rowA: MusteriKonaklama, rowB: MusteriKonaklama) => {
      // Önce telefon numarasına göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // Telefon aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.KnklmGrsTrh);
      const tarihB = parseDateString(rowB.KnklmGrsTrh);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'KnklmOdaTip',
    label: 'Oda Tipi',
    align: 'center' as const,
    field: 'KnklmOdaTip',
    sortable: true,
    sort: (a: string, b: string, rowA: MusteriKonaklama, rowB: MusteriKonaklama) => {
      // Önce oda tipine göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // Oda tipi aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.KnklmGrsTrh);
      const tarihB = parseDateString(rowB.KnklmGrsTrh);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'KnklmOdaNo',
    label: 'Oda-Yatak',
    align: 'center' as const,
    field: 'KnklmOdaNo',
    sortable: true,
    sort: (a: string, b: string, rowA: MusteriKonaklama, rowB: MusteriKonaklama) => {
      // Önce oda numarasına göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // Oda numarası aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.KnklmGrsTrh);
      const tarihB = parseDateString(rowB.KnklmGrsTrh);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'KnklmTip',
    label: 'Konaklama Tipi',
    align: 'center' as const,
    field: 'KnklmTip',
    sortable: true,
    sort: (a: string, b: string, rowA: MusteriKonaklama, rowB: MusteriKonaklama) => {
      // Önce konaklama tipine göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // Konaklama tipi aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.KnklmGrsTrh);
      const tarihB = parseDateString(rowB.KnklmGrsTrh);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'KnklmNfyt',
    label: 'Tutar',
    align: 'right' as const,
    field: 'KnklmNfyt',
    sortable: true,
    sort: (a: number, b: number, rowA: MusteriKonaklama, rowB: MusteriKonaklama) => {
      // Önce tutara göre sırala
      if (a !== b) return a - b;
      // Tutar aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.KnklmGrsTrh);
      const tarihB = parseDateString(rowB.KnklmGrsTrh);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'KnklmGrsTrh',
    label: 'Giriş Tarihi',
    align: 'center' as const,
    field: 'KnklmGrsTrh',
    sortable: true,
    format: (val: string) => formatDate(val),
    sort: sortByDate
  },
  {
    name: 'KnklmPlnTrh',
    label: 'Planlanan Çıkış',
    align: 'center' as const,
    field: 'KnklmPlnTrh',
    sortable: true,
    sort: sortByDate
  },
  {
    name: 'KnklmCksTrh',
    label: 'Çıkış Tarihi',
    align: 'center' as const,
    field: 'KnklmCksTrh',
    sortable: true,
    sort: sortByDate
  },
  {
    name: 'actions',
    label: 'Detaylar',
    align: 'center' as const,
    field: 'actions'
  }
  ]
  
  // İstek: Üst gridde de "Çıkış Tarihi" sütunu her zaman görünsün
  return baseColumns
})

// Borçlu müşteriler tablosu için
const borcluColumns = [
  {
    name: 'cKytTarihi',
    label: 'Kayıt Tarihi',
    align: 'center' as const,
    field: 'cKytTarihi',
    sortable: true,
    format: (val: string) => formatDate(val),
    sort: sortByDate
  },
  {
    name: 'CariKllnc',
    label: 'Kullanıcı',
    align: 'left' as const,
    field: 'CariKllnc',
    sortable: true,
    sort: (a: string, b: string, rowA: BorcluMusteri, rowB: BorcluMusteri) => {
      // Önce kullanıcı adına göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // Kullanıcı adı aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.cKytTarihi);
      const tarihB = parseDateString(rowB.cKytTarihi);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'CariKod',
    label: 'Cari Kod',
    align: 'left' as const,
    field: 'CariKod',
    sortable: true,
    sort: (a: string, b: string, rowA: BorcluMusteri, rowB: BorcluMusteri) => {
      // Önce cari koduna göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // Cari kodu aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.cKytTarihi);
      const tarihB = parseDateString(rowB.cKytTarihi);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'CariAdi',
    label: 'Müşteri Adı',
    align: 'left' as const,
    field: 'CariAdi',
    sortable: true,
    sort: (a: string, b: string, rowA: BorcluMusteri, rowB: BorcluMusteri) => {
      // Önce müşteri adına göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // Müşteri adı aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.cKytTarihi);
      const tarihB = parseDateString(rowB.cKytTarihi);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'CariVD',
    label: 'Vergi Dairesi',
    align: 'left' as const,
    field: 'CariVD',
    sortable: true,
    sort: (a: string, b: string, rowA: BorcluMusteri, rowB: BorcluMusteri) => {
      // Önce vergi dairesine göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // Vergi dairesi aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.cKytTarihi);
      const tarihB = parseDateString(rowB.cKytTarihi);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'CariVTCN',
    label: 'VDNo/TC No',
    align: 'left' as const,
    field: 'CariVTCN',
    sortable: true,
    sort: (a: string, b: string, rowA: BorcluMusteri, rowB: BorcluMusteri) => {
      // Önce VDNo/TC numarasına göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // VDNo/TC numarası aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.cKytTarihi);
      const tarihB = parseDateString(rowB.cKytTarihi);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'CariYetkili',
    label: 'Yetkili',
    align: 'left' as const,
    field: 'CariYetkili',
    sortable: true,
    sort: (a: string, b: string, rowA: BorcluMusteri, rowB: BorcluMusteri) => {
      // Önce yetkili adına göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // Yetkili adı aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.cKytTarihi);
      const tarihB = parseDateString(rowB.cKytTarihi);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'CariTelNo',
    label: 'Telefon',
    align: 'left' as const,
    field: 'CariTelNo',
    sortable: true,
    sort: (a: string, b: string, rowA: BorcluMusteri, rowB: BorcluMusteri) => {
      // Önce telefon numarasına göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // Telefon numarası aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.cKytTarihi);
      const tarihB = parseDateString(rowB.cKytTarihi);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'BorcTutari',
    label: 'Borç Tutarı',
    align: 'right' as const,
    field: 'BorcTutari',
    sortable: true,
    sort: (a: number, b: number, rowA: BorcluMusteri, rowB: BorcluMusteri) => {
      // Önce borç tutarına göre sırala
      if (a !== b) return a - b;
      // Borç tutarı aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.cKytTarihi);
      const tarihB = parseDateString(rowB.cKytTarihi);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'odemeVadesi',
    label: 'Ödeme Vadesi',
    align: 'center' as const,
    field: 'odemeVadesi',
    sortable: true,
    format: (val: string) => val ? formatDate(val) : '-',
    // Çoklu sıralama: önce ödeme vadesi, eşitse borç tutarı büyükten küçüğe, sonra kayıt tarihi DESC
    sort: (a: string, b: string, rowA: BorcluMusteri, rowB: BorcluMusteri) => {
      if (!a && !b) {
        // Her ikisi de boşsa kayıt tarihine göre DESC sırala
        const tarihA = parseDateString(rowA.cKytTarihi);
        const tarihB = parseDateString(rowB.cKytTarihi);
        return tarihB.getTime() - tarihA.getTime();
      }
      if (!a) return 1;
      if (!b) return -1;
      const [gA, aA, yA] = (a || '').split('.').map(Number);
      const [gB, aB, yB] = (b || '').split('.').map(Number);
      const tA = yA && aA && gA ? new Date(yA, aA - 1, gA).getTime() : 0;
      const tB = yB && aB && gB ? new Date(yB, aB - 1, gB).getTime() : 0;
      if (tA !== tB) return tA - tB;
      // 2. kademe: Borç tutarı büyükten küçüğe
      const borcFarki = (rowB.BorcTutari || 0) - (rowA.BorcTutari || 0);
      if (borcFarki !== 0) return borcFarki;
      // 3. kademe: Kayıt tarihi DESC
      const tarihA = parseDateString(rowA.cKytTarihi);
      const tarihB = parseDateString(rowB.cKytTarihi);
      return tarihB.getTime() - tarihA.getTime();
    }
  },
  {
    name: 'CikisTarihi',
    label: 'Çkş. / Pln. Tarihi',
    align: 'center' as const,
    field: 'CikisTarihi',
    sortable: true,
    format: (val: string) => val ? formatDate(val) : '-',
    sort: (a: string, b: string) => {
      if (!a && !b) return 0;
      if (!a) return 1;
      if (!b) return -1;
      const tarihA = parseDateString(a);
      const tarihB = parseDateString(b);
      return tarihA.getTime() - tarihB.getTime();
    }
  }
]

// Alacaklı müşteriler tablosu için
const alacakliColumns = [
  {
    name: 'cKytTarihi',
    label: 'Kayıt Tarihi',
    align: 'center' as const,
    field: 'cKytTarihi',
    sortable: true,
    format: (val: string) => formatDate(val),
    sort: sortByDate
  },
  {
    name: 'CariKllnc',
    label: 'Kullanıcı',
    align: 'left' as const,
    field: 'CariKllnc',
    sortable: true,
    sort: (a: string, b: string, rowA: AlacakliMusteri, rowB: AlacakliMusteri) => {
      // Önce kullanıcı adına göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // Kullanıcı adı aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.cKytTarihi);
      const tarihB = parseDateString(rowB.cKytTarihi);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'CariKod',
    label: 'Cari Kod',
    align: 'left' as const,
    field: 'CariKod',
    sortable: true,
    sort: (a: string, b: string, rowA: AlacakliMusteri, rowB: AlacakliMusteri) => {
      // Önce cari koduna göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // Cari kodu aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.cKytTarihi);
      const tarihB = parseDateString(rowB.cKytTarihi);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'CariAdi',
    label: 'Müşteri Adı',
    align: 'left' as const,
    field: 'CariAdi',
    sortable: true,
    sort: (a: string, b: string, rowA: AlacakliMusteri, rowB: AlacakliMusteri) => {
      // Önce müşteri adına göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // Müşteri adı aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.cKytTarihi);
      const tarihB = parseDateString(rowB.cKytTarihi);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'CariVD',
    label: 'Vergi Dairesi',
    align: 'left' as const,
    field: 'CariVD',
    sortable: true,
    sort: (a: string, b: string, rowA: AlacakliMusteri, rowB: AlacakliMusteri) => {
      // Önce vergi dairesine göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // Vergi dairesi aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.cKytTarihi);
      const tarihB = parseDateString(rowB.cKytTarihi);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'CariVTCN',
    label: 'VDNo/TC No',
    align: 'left' as const,
    field: 'CariVTCN',
    sortable: true,
    sort: (a: string, b: string, rowA: AlacakliMusteri, rowB: AlacakliMusteri) => {
      // Önce VDNo/TC numarasına göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // VDNo/TC numarası aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.cKytTarihi);
      const tarihB = parseDateString(rowB.cKytTarihi);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'CariYetkili',
    label: 'Yetkili',
    align: 'left' as const,
    field: 'CariYetkili',
    sortable: true,
    sort: (a: string, b: string, rowA: AlacakliMusteri, rowB: AlacakliMusteri) => {
      // Önce yetkili adına göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // Yetkili adı aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.cKytTarihi);
      const tarihB = parseDateString(rowB.cKytTarihi);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'CariTelNo',
    label: 'Telefon',
    align: 'left' as const,
    field: 'CariTelNo',
    sortable: true,
    sort: (a: string, b: string, rowA: AlacakliMusteri, rowB: AlacakliMusteri) => {
      // Önce telefon numarasına göre sırala
      if (a !== b) return (a || '').localeCompare(b || '');
      // Telefon numarası aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.cKytTarihi);
      const tarihB = parseDateString(rowB.cKytTarihi);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'AlacakTutari',
    label: 'Alacak Tutarı',
    align: 'right' as const,
    field: 'AlacakTutari',
    sortable: true,
    sort: (a: number, b: number, rowA: AlacakliMusteri, rowB: AlacakliMusteri) => {
      // Önce alacak tutarına göre sırala
      if (a !== b) return a - b;
      // Alacak tutarı aynıysa kayıt tarihine göre DESC sırala
      const tarihA = parseDateString(rowA.cKytTarihi);
      const tarihB = parseDateString(rowB.cKytTarihi);
      return tarihB.getTime() - tarihA.getTime(); // DESC sıralama
    }
  },
  {
    name: 'CikisTarihi',
    label: 'Çkş. / Pln. Tarihi',
    align: 'center' as const,
    field: 'CikisTarihi',
    sortable: true,
    format: (val: string) => val ? formatDate(val) : '-',
    sort: (a: string, b: string) => {
      if (!a && !b) return 0;
      if (!a) return 1;
      if (!b) return -1;
      const tarihA = parseDateString(a);
      const tarihB = parseDateString(b);
      return tarihA.getTime() - tarihB.getTime();
    }
  }
]

// 🔥 Bakiyesiz hesaplar tablosu için (sıralama backend'de yapılıyor)
const bakiyesizHesaplarColumns = [
  {
    name: 'cKytTarihi',
    label: 'Kayıt Tarihi',
    align: 'center' as const,
    field: 'cKytTarihi',
    sortable: true,
    format: (val: string) => formatDate(val),
    sort: sortByDate
  },
  {
    name: 'CariKllnc',
    label: 'Kullanıcı',
    align: 'left' as const,
    field: 'CariKllnc',
    sortable: true
  },
  {
    name: 'CariKod',
    label: 'Cari Kod',
    align: 'left' as const,
    field: 'CariKod',
    sortable: true
  },
  {
    name: 'CariAdi',
    label: 'Müşteri Adı',
    align: 'left' as const,
    field: 'CariAdi',
    sortable: true
  },
  {
    name: 'CariVD',
    label: 'Vergi Dairesi',
    align: 'left' as const,
    field: 'CariVD',
    sortable: true
  },
  {
    name: 'CariVTCN',
    label: 'VDNo/TC No',
    align: 'left' as const,
    field: 'CariVTCN',
    sortable: true
  },
  {
    name: 'CariYetkili',
    label: 'Yetkili',
    align: 'left' as const,
    field: 'CariYetkili',
    sortable: true
  },
  {
    name: 'CariTelNo',
    label: 'Telefon',
    align: 'left' as const,
    field: 'CariTelNo',
    sortable: true
  },
  {
    name: 'BorcTutari',
    label: 'Bakiye',
    align: 'right' as const,
    field: 'BorcTutari',
    sortable: true,
    format: (val: number) => formatCurrency(val)
  },
  {
    name: 'CksPlnTrh',
    label: 'Çkş. / Pln. Tarihi',
    align: 'center' as const,
    field: 'CksPlnTrh',
    sortable: true,
    format: (val: string) => val ? formatDate(val) : '-',
    sort: sortByDate
  }
]

// Borçlu müşteriler için
const borcluPagination = ref({
  sortBy: 'odemeVadesi', // 1. kademe: ödeme vadesi
  descending: false,     // Küçükten büyüğe
  page: 1,
  rowsPerPage: 5 // Default 10
})

// Alacaklı müşteriler için
const alacakliPagination = ref({
  sortBy: 'AlacakTutari',
  descending: true,  // Büyükten küçüğe sıralama
  page: 1,
  rowsPerPage: 5
})

// 🔥 Bakiyesiz hesaplar için (Alacaklı Müşteriler gibi basit)
const bakiyesizHesaplarPagination = ref({
  sortBy: 'cKytTarihi',
  descending: false,  // Eskiden yeniye sıralama
  page: 1,
  rowsPerPage: 10
})



// Cari hareketler için
const cariHareketlerPagination = ref({
  sortBy: 'iKytTarihi',
  descending: true,  // Büyükten küçüğe sıralama
  page: 1,
  rowsPerPage: 50
})

// Cari hareketler tablosu için sütunlar - computed ile firma filtresine göre dinamik
const cariHareketlerColumns = computed(() => {
  const baseColumns = [
    {
      name: 'iKytTarihi',
      label: 'Kayıt Tarihi',
      align: 'center' as const,
      field: 'iKytTarihi',
      sortable: true,
      format: (val: string) => formatDate(val),
      sort: sortByDate
    },
    {
      name: 'islemKllnc',
      label: 'Kullanıcı',
      align: 'left' as const,
      field: 'islemKllnc',
      sortable: true
    },
    {
      name: 'islemOzel1',
      label: 'Özel 1',
      align: 'left' as const,
      field: 'islemOzel1',
      sortable: true
    },
    {
      name: 'islemOzel2',
      label: 'Özel 2',
      align: 'left' as const,
      field: 'islemOzel2',
      sortable: true
    },
    {
      name: 'islemOzel3',
      label: 'Özel 3',
      align: 'left' as const,
      field: 'islemOzel3',
      sortable: true
    },
    {
      name: 'islemArac',
      label: 'Araç',
      align: 'left' as const,
      field: 'islemArac',
      sortable: true
    },
    {
      name: 'islemTip',
      label: 'İşlem Tipi',
      align: 'center' as const,
      field: 'islemTip',
      sortable: true
    },
    {
      name: 'islemGrup',
      label: 'Grup',
      align: 'left' as const,
      field: 'islemGrup',
      sortable: true
    },
    {
      name: 'islemBilgi',
      label: 'Bilgi',
      align: 'left' as const,
      field: 'islemBilgi',
      sortable: true,
      style: 'max-width: 250px; white-space: normal; word-wrap: break-word;'
    },
    {
      name: 'islemTutar',
      label: 'Tutar',
      align: 'right' as const,
      field: 'islemTutar',
      sortable: true
    }
  ]

  // 💡 Eğer "Sadece Bu Firma" butonu aktifse, müşteri adı sütununu en başa ekle
  if (firmaFiltresiAktif.value) {
    baseColumns.unshift({
      name: 'CariAdi',
      label: 'Müşteri Adı',
      align: 'left' as const,
      field: 'CariAdi',
      sortable: true
    })
  }

  return baseColumns
})

// Konaklama geçmişi tablosu için sütunlar - computed ile firma filtresine göre dinamik
const konaklamaGecmisiColumns = computed(() => {
  const columns = []

  // 💡 Eğer "Sadece Bu Firma" butonu aktifse, müşteri adı sütununu en başa ekle
  if (firmaFiltresiAktif.value) {
    columns.push({
      name: 'MstrAdi',
      label: 'Müşteri Adı',
      align: 'left' as const,
      field: 'MstrAdi',
      sortable: true
    })
  }

  columns.push(
    {
      name: 'kKytTarihi',
      label: 'Kayıt Tarihi',
      align: 'center' as const,
      field: 'kKytTarihi',
      sortable: true,
      format: (val: string) => formatDate(val),
      sort: sortByDate
    },
    {
      name: 'KnklmOdaTip',
      label: 'Oda Tipi',
      align: 'center' as const,
      field: 'KnklmOdaTip',
      sortable: true
    },
    {
      name: 'KnklmOdaNo',
      label: 'Oda-Yatak',
      align: 'center' as const,
      field: 'KnklmOdaNo',
      sortable: true
    },
    {
      name: 'KnklmTip',
      label: 'Konaklama Tipi',
      align: 'center' as const,
      field: 'KnklmTip',
      sortable: true
    },
    {
      name: 'KnklmNfyt',
      label: 'Tutar',
      align: 'right' as const,
      field: 'KnklmNfyt',
      sortable: true
    },
    {
      name: 'KnklmGrsTrh',
      label: 'Giriş Tarihi',
      align: 'center' as const,
      field: 'KnklmGrsTrh',
      sortable: true,
      format: (val: string) => formatDate(val),
      sort: sortByDate
    },
    {
      name: 'KnklmPlnTrh',
      label: 'Planlanan Çıkış',
      align: 'center' as const,
      field: 'KnklmPlnTrh',
      sortable: true,
      format: (val: string) => formatDate(val),
      sort: sortByDate
    },
    {
      name: 'KnklmCksTrh',
      label: 'Çıkış Tarihi',
      align: 'center' as const,
      field: 'KnklmCksTrh',
      sortable: true,
      format: (val: string) => formatDate(val),
      sort: sortByDate
    },
    {
      name: 'Detaylar',
      label: 'Detaylar',
      align: 'center' as const,
      field: 'Detaylar'
    }
  )

  return columns
})

// Fonksiyonlar
async function loadMusteriListesi() {
  // Eğer sadece sıralama yapılıyorsa API çağrısı yapma
  if (sortingInProgress) {
    console.log('Sıralama sırasında API çağrısı engellendi')
    sortingInProgress = false
    return
  }

  loading.value = true
  try {
    let endpoint = 'musteri-listesi'
    
    // Aktif filtreye göre endpoint seç
    if (currentFilter.value) {
      switch (currentFilter.value) {
        case 'yeni-musteri':
          endpoint = 'yeni-musteri'
          break
        case 'yeni-giris':
          endpoint = 'yeni-giris'
          break
        default:
          endpoint = currentFilter.value
          break
      }
    }
    
    const response = await api.get(`/dashboard/${endpoint}?tip=${selectedTip.value}&odaTip=${selectedOdaTip.value}`)
    if (response.data.success) {
      // Array'i tamamen yenile, append etme
      musteriListesi.value = [...response.data.data]
      
    }
  } catch (error) {
    console.error('Müşteri listesi yüklenemedi:', error)
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const response = await api.get('/dashboard/stats')
    if (response.data.success) {
      stats.value = response.data.data
    }
  } catch (error) {
    console.error('İstatistikler yüklenemedi:', error)
  }
}

async function loadCikisYapanlarSayisi() {
  try {
    const response = await api.get('/dashboard/cikis-yapanlar-sayisi')
    if (response.data.success) {
      cikisYapanlarSayisi.value = response.data.data
    }
  } catch (error) {
    console.error('Çıkış yapanlar sayısı yüklenemedi:', error)
  }
}

async function loadCikisYapanlarListesi() {
  loading.value = true
  try {
    const response = await api.get(`/dashboard/cikis-yapanlar?tip=${selectedTip.value}&odaTip=${encodeURIComponent(selectedOdaTip.value)}`)
    if (response.data.success) {
      musteriListesi.value = [...response.data.data]
      // 🔥 Filtrelenmiş listeyi de güncelle - bu kritik!
      filteredMusteriListesi.value = [...response.data.data]
      
    }
  } catch (error) {
    console.error('Çıkış yapanlar listesi yüklenemedi:', error)
  } finally {
    loading.value = false
  }
}

async function loadKonaklamaTipleri() {
  try {
    const response = await api.get('/dashboard/konaklama-tipleri')
    if (response.data.success) {
      tumKonaklamaTipleri.value = response.data.data
      konaklamaTipleri.value = response.data.data
      // İlk yüklemede filtrelenmiş listeleri de güncelle
      filteredKonaklamaTipleri.value = response.data.data
    }
  } catch (error) {
    console.error('Konaklama tipleri yüklenemedi:', error)
  }
}

async function loadOdaTipleri() {
  try {
    const response = await api.get('/dashboard/oda-tipleri')
    if (response.data.success) {
      tumOdaTipleri.value = response.data.data
      odaTipleri.value = response.data.data
      // İlk yüklemede filtrelenmiş listeleri de güncelle
      filteredOdaTipleri.value = response.data.data
    }
  } catch (error) {
    console.error('Oda tipleri yüklenemedi:', error)
  }
}

// 🔥 DİNAMİK LİSTE YÜKLEME FONKSİYONLARI
async function loadDinamikKonaklamaTipleri() {
  try {
    // Eğer currentFilter yoksa varsayılan olarak toplam-aktif kullan
    const kartTip = currentFilter.value || 'toplam-aktif'
    
    const response = await api.get(`/dashboard/dinamik-konaklama-tipleri?kartTip=${encodeURIComponent(kartTip)}`)
    if (response.data.success) {
      dinamikKonaklamaTipleri.value = response.data.data
      // Dinamik listeyi filtrelenmiş listeye ata
      filteredKonaklamaTipleri.value = response.data.data
    } else {
      console.error('❌ Dinamik konaklama tipleri API hatası:', response.data)
      // Hata durumunda statik listeyi kullan
      filteredKonaklamaTipleri.value = [...tumKonaklamaTipleri.value]
    }
  } catch (error) {
    console.error('❌ Dinamik konaklama tipleri yüklenemedi:', error)
    // Hata durumunda statik listeyi kullan
    filteredKonaklamaTipleri.value = [...tumKonaklamaTipleri.value]
  }
}

async function loadDinamikOdaTipleri() {
  try {
    // Eğer currentFilter yoksa varsayılan olarak toplam-aktif kullan
    const kartTip = currentFilter.value || 'toplam-aktif'
    
    const response = await api.get(`/dashboard/dinamik-oda-tipleri?kartTip=${encodeURIComponent(kartTip)}`)
    if (response.data.success) {
      dinamikOdaTipleri.value = response.data.data
      // Dinamik listeyi filtrelenmiş listeye ata
      filteredOdaTipleri.value = response.data.data
    } else {
      console.error('❌ Dinamik oda tipleri API hatası:', response.data)
      // Hata durumunda statik listeyi kullan
      filteredOdaTipleri.value = [...tumOdaTipleri.value]
    }
  } catch (error) {
    console.error('❌ Dinamik oda tipleri yüklenemedi:', error)
    // Hata durumunda statik listeyi kullan
    filteredOdaTipleri.value = [...tumOdaTipleri.value]
  }
}

async function loadBorcluMusteriler(page: number = 1, limit: number = 1000) {
  loading.value = true
  try {
    const response = await api.get(`/dashboard/borclu-musteriler?page=${page}&limit=${limit}`)
    if (response.data.success) {
      borcluMusteriListesi.value = [...response.data.data]
      // Pagination bilgilerini güncelle
      borcluPagination.value.page = response.data.page;
    }
  } catch (error) {
    console.error('Borçlu müşteri listesi yüklenemedi:', error)
  } finally {
    loading.value = false
  }
}

async function loadAlacakliMusteriler(page: number = 1, limit: number = 1000) {
  loading.value = true
  try {
    const response = await api.get(`/dashboard/alacakli-musteriler?page=${page}&limit=${limit}`)
    if (response.data.success) {
      alacakliMusteriListesi.value = [...response.data.data]
      // Pagination bilgilerini güncelle
      alacakliPagination.value.page = response.data.page;
    }
  } catch (error) {
    console.error('🔥 Alacaklı müşteri listesi yüklenemedi:', error)
  } finally {
    loading.value = false
  }
}

async function loadBakiyesizHesaplar(page: number = 1, limit: number = 1000) {
  bakiyesizHesaplarLoading.value = true
  try {
    const response = await api.get(`/dashboard/bakiyesiz-hesaplar?page=${page}&limit=${limit}`)
    if (response.data.success) {
      bakiyesizHesaplarListesi.value = [...response.data.data]
      // Pagination bilgilerini güncelle
      bakiyesizHesaplarPagination.value.page = response.data.page;
    }
  } catch (error) {
    console.error('🔥 Bakiyesiz hesaplar listesi yüklenemedi:', error)
  } finally {
    bakiyesizHesaplarLoading.value = false
  }
}

// 🔥 Bakiyesiz hesaplar request event handler
function onBakiyesizHesaplarRequest(props: { pagination: { page: number; rowsPerPage: number; sortBy?: string; descending?: boolean } }) {
  // Pagination state'ini güncelle
  bakiyesizHesaplarPagination.value.page = props.pagination.page;
  bakiyesizHesaplarPagination.value.rowsPerPage = props.pagination.rowsPerPage;
  
  // Optional değerleri kontrol et
  if (props.pagination.sortBy !== undefined) {
    bakiyesizHesaplarPagination.value.sortBy = props.pagination.sortBy;
  }
  if (props.pagination.descending !== undefined) {
    bakiyesizHesaplarPagination.value.descending = props.pagination.descending;
  }
}



async function loadCariHareketler(cariKod: string) {
  cariHareketlerLoading.value = true
  
  // 🔥 ÖNEMLİ: Önceki müşterinin cari hareketlerini temizle
  cariHareketlerListesi.value = []
  filteredCariHareketlerListesi.value = []
  
  // 🔥 Pagination'ı sıfırla
  cariHareketlerPagination.value.page = 1
  
  // CariKod'u temizle ve büyük harfe çevir
  const cleanCariKod = (cariKod || '').trim().toUpperCase()
  
  // Key'i sadece farklı müşteri seçildiğinde güncelle
  const newKey = `cari-${cleanCariKod}`
  if (cariHareketlerKey.value !== newKey) {
    cariHareketlerKey.value = newKey
  }
  
  try {
    const response = await api.get(`/dashboard/cari-hareketler?cariKod=${encodeURIComponent(cleanCariKod)}`)
    if (response.data.success) {
      cariHareketlerListesi.value = [...response.data.data]
      
      
      // Tablo yüklendikten sonra scroll pozisyonunu sıfırla
      await nextTick()
      if (cariHareketlerTableRef.value) {
        const tableElement = cariHareketlerTableRef.value.$el
        if (tableElement) {
          tableElement.scrollTop = 0
        }
      }
    } else {
      // Başarısız yanıt geldiğinde listeyi temizle
      cariHareketlerListesi.value = []
      filteredCariHareketlerListesi.value = []
    }
  } catch (error) {
    console.error('Cari hareketler yüklenemedi:', error)
    // Hata durumunda da listeleri temizle
    cariHareketlerListesi.value = []
    filteredCariHareketlerListesi.value = []
  } finally {
    cariHareketlerLoading.value = false
  }
}

// TC Kimlik ile cari hareketler yükleme fonksiyonu
async function loadCariHareketlerByTC(tcKimlik: string) {
  
  cariHareketlerLoading.value = true
  
  // 🔥 ÖNEMLİ: Önceki müşterinin cari hareketlerini temizle
  cariHareketlerListesi.value = []
  filteredCariHareketlerListesi.value = []
  
  // 🔥 Pagination'ı sıfırla
  cariHareketlerPagination.value.page = 1
  
  // TC Kimlik'i temizle
  const cleanTCKimlik = (tcKimlik || '').trim()
  
  // Key'i sadece farklı müşteri seçildiğinde güncelle
  const newKey = `cari-tc-${cleanTCKimlik}`
  if (cariHareketlerKey.value !== newKey) {
    cariHareketlerKey.value = newKey
  }
  
  try {
    
    const response = await api.get(`/dashboard/cari-hareketler-tc?tcKimlik=${encodeURIComponent(cleanTCKimlik)}`)
    
    
    if (response.data.success) {
      cariHareketlerListesi.value = [...response.data.data]
      
      
      // Tablo yüklendikten sonra scroll pozisyonunu sıfırla
      await nextTick()
      if (cariHareketlerTableRef.value) {
        const tableElement = cariHareketlerTableRef.value.$el
        if (tableElement) {
          tableElement.scrollTop = 0
        }
      }
    } else {
      // Başarısız yanıt geldiğinde listeyi temizle
      cariHareketlerListesi.value = []
      filteredCariHareketlerListesi.value = []
    }
  } catch (error) {
    console.error('🔄 Cari hareketler yüklenemedi:', error)
    // Hata durumunda da listeleri temizle
    cariHareketlerListesi.value = []
    filteredCariHareketlerListesi.value = []
  } finally {
    cariHareketlerLoading.value = false
    
  }
}

// 🔥 BACKEND STATS CACHE'İNİ TEMİZLE
async function clearBackendStatsCache() {
  try {
    await api.post('/dashboard/clear-stats-cache');
  } catch (error) {
    console.error('❌ Backend stats cache temizleme hatası:', error);
  }
}

// 🔥 OTOMATİK STATS GÜNCELLEME FONKSİYONU
async function updateStatsOnly() {
  try {
    await Promise.all([
      loadStats(),
      loadCikisYapanlarSayisi()
    ]);
    
    // 🔥 SEÇİLİ KARTIN LİSTESİNİ DE YENİLE
    if (currentFilter.value) {
      await loadSelectedCardData(currentFilter.value);
    }
  } catch (error) {
    console.error('❌ Stats güncelleme hatası:', error);
  }
}

// 🔥 VERİ DEĞİŞİKLİK EVENT LISTENER'LARI
function setupDataChangeListeners() {
  // Modal başarılı işlem sonrası stats güncelleme
  window.addEventListener('statsNeedsUpdate', () => {
    // 🔥 BACKEND CACHE'İ TEMİZLE VE STATS GÜNCELLE
    void clearBackendStatsCache();
    void updateStatsOnly();
  });

  // Header'daki yenile butonundan gelen event
  window.addEventListener('refreshKartliIslemStats', () => {
    
    void updateStatsOnly();
  });

  // Sayfa görünür olduğunda stats güncelleme (focus/blur events)
  window.addEventListener('focus', () => {
    
    void updateStatsOnly();
  });

  // Tab değişikliği sonrası stats güncelleme
  window.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      
      void updateStatsOnly();
    }
  });
}

// 🔥 EVENT LISTENER'LARI TEMİZLEME
function cleanupDataChangeListeners() {
  window.removeEventListener('statsNeedsUpdate', () => void updateStatsOnly());
  window.removeEventListener('refreshKartliIslemStats', () => void updateStatsOnly());
  window.removeEventListener('focus', () => void updateStatsOnly());
  window.removeEventListener('visibilitychange', () => void updateStatsOnly());
}

// 🔥 PERİYODİK STATS GÜNCELLEME (5 dakikada bir)
// 🔥 PERİYODİK STATS GÜNCELLEME DEVRE DIŞI
// let statsRefreshInterval: number | null = null;

// function startPeriodicStatsRefresh() {
//   // Eğer zaten çalışıyorsa temizle
//   if (statsRefreshInterval) {
//     clearInterval(statsRefreshInterval);
//   }
//   
//   // 5 dakikada bir stats güncelle
//   statsRefreshInterval = window.setInterval(() => {
//     console.log('🕐 Periyodik stats güncelleme...');
//     void updateStatsOnly();
//   }, 5 * 60 * 1000); // 5 dakika
// }

// function stopPeriodicStatsRefresh() {
//   if (statsRefreshInterval) {
//     clearInterval(statsRefreshInterval);
//     statsRefreshInterval = null;
//   }
// }

async function refreshData() {
  // Konaklama geçmişi tablosunu gizle (modal işlemlerinden sonra güncel olmayabilir)
  showKonaklamaGecmisi.value = false
  // 🔥 Cari hareketler tablosunu da gizle (yenileme sırasında her durumda gizlensin)
  showCariHareketler.value = false
  selectedNormalMusteri.value = null
  window.kartliIslemSelectedNormalMusteri = null
  selectedCustomer.value = null
  window.dispatchEvent(new Event('ekHizmetlerMusteriChanged'));
  // 🔥 Yenilemede bakiye/depozito göstergelerini de sıfırla
  selectedMusteriBakiye.value = 0
  selectedMusteriDepozito.value = 0
  selectedFirmaBakiye.value = 0
  ;(window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye = 0
  
  sortingInProgress = false  // Manuel yenileme için API çağrısına izin ver
  

  
  // 🔥 PERFORMANS İYİLEŞTİRMESİ: Tüm API çağrılarını paralel yap
  loading.value = true
  try {
    await Promise.all([
      loadStats(),
      loadKonaklamaTipleri(),
      loadOdaTipleri(),
      loadCikisYapanlarSayisi()
    ])
    
    // 🔥 DİNAMİK LİSTELERİ YÜKLE (eğer aktif filtre varsa)
    if (currentFilter.value) {
      await Promise.all([
        loadDinamikKonaklamaTipleri(),
        loadDinamikOdaTipleri()
      ])
    }
    
    // Seçili kartın verilerini yükle
    if (currentFilter.value) {
      await loadSelectedCardData(currentFilter.value)
    }
  } catch (error) {
    console.error('Veri yenileme hatası:', error)
  } finally {
    loading.value = false
  }
}

// Modal başarılı işlem sonrası güncelleme fonksiyonu
function onModalSuccess() {
  
  
  // Modal kapatıldıktan sonra kısa bir gecikme ile stats'ı güncelle
  setTimeout(() => {
    void updateStatsOnly();
    
  }, 500);
}



// Müşteri bilgilerini tooltip için formatlayan fonksiyon
function getMusteriTooltipContent(row: MusteriKonaklama): string {
  const bilgiler = [
    `👤 Müşteri: ${row.MstrAdi}`,
    `🆔 TC/VD No: ${row.MstrTCN}`,
    `📞 Telefon: ${row.MstrTelNo || 'Belirtilmemiş'}`,
    `🏢 Firma: ${row.MstrFirma || 'Bireysel'}`,
    `🏠 Oda: ${row.KnklmOdaNo}-${row.KnklmYtkNo}`,
    `📋 Konaklama Tipi: ${row.KnklmTip}`,
    `💰 Net Fiyat: ${formatCurrency(row.KnklmNfyt)}`,
    `📅 Giriş: ${formatDate(row.KnklmGrsTrh)}`,
    `📅 Çıkış Planı: ${formatDate(row.KnklmPlnTrh)}`,
    `📝 Not: ${row.KnklmNot || 'Not yok'}`
  ]
  
  // Kara liste uyarısı
  if (row.KnklmKrLst === 'EVET') {
    bilgiler.unshift('🚨 KARA LİSTE MÜŞTERİSİ')
  }
  
  return bilgiler.join('\n')
}

// Konaklama geçmişi tooltip içeriği oluşturma fonksiyonu
function getKonaklamaTooltipContent(row: KonaklamaGecmisi & { MstrAdi?: string; MstrTCN?: string; MstrTelNo?: string; MstrFirma?: string }): string {
  const bilgiler = [
    `🏠 Oda: ${row.KnklmOdaNo}-${row.KnklmYtkNo} (${row.KnklmOdaTip})`,
    `📋 Konaklama Tipi: ${row.KnklmTip}`,
    `💰 Net Fiyat: ${formatCurrency(row.KnklmNfyt)}`,
    `📅 Giriş: ${formatDate(row.KnklmGrsTrh)}`,
    `📅 Çıkış Planı: ${formatDate(row.KnklmPlnTrh)}`,
    `📅 Çıkış: ${row.KnklmCksTrh ? formatDate(row.KnklmCksTrh) : 'Henüz çıkış yapılmadı'}`,
    `📝 Not: ${row.KnklmNot || 'Not yok'}`
  ]
  
  // Kara liste uyarısı
  if (row.KnklmKrLst === 'EVET') {
    bilgiler.unshift('🚨 KARA LİSTE MÜŞTERİSİ')
  }
  
  return bilgiler.join('\n')
}

// Çift tıklama event handler
function onRowDoubleClick(evt: Event, row: MusteriKonaklama) {
  // 🔥 Tek tıklama timeout'unu iptal et
  if (normalMusteriClickTimeout.value) {
    clearTimeout(normalMusteriClickTimeout.value)
    normalMusteriClickTimeout.value = null
  }
  
  
  
  // 🔥 Önce seçimi güncelle (grid tabloda aktif hale getir)
  selectedNormalMusteri.value = row;
  window.kartliIslemSelectedNormalMusteri = {
    ...row,
    OdaYatak: (row.KnklmOdaNo && row.KnklmYtkNo) ? `${row.KnklmOdaNo}-${row.KnklmYtkNo}` : '',
    KonaklamaTipi: row.KnklmTip
  };
  
  // 🔥 Seçili müşteri bilgilerini localStorage'a kaydet (musteri-islem sayfası için)
  const musteriDataForIslem = {
    ...row,
    OdaYatak: (row.KnklmOdaNo && row.KnklmYtkNo) ? `${row.KnklmOdaNo}-${row.KnklmYtkNo}` : '',
    KonaklamaTipi: row.KnklmTip,
    currentFilter: currentFilter.value,
    musteriDurumu: 'KALIYOR' // Güncelleme modu için
  };
  
  localStorage.setItem('selectedMusteriForIslem', JSON.stringify(musteriDataForIslem));
  sessionStorage.setItem('prevPage', 'kartli-islem');
  if (row?.MstrTCN) sessionStorage.setItem('autoFillTCKimlik', row.MstrTCN);
  
  selectedCustomer.value = {
    id: row.MstrTCN,
    name: row.MstrAdi,
    ...row,
    OdaYatak: (row.KnklmOdaNo && row.KnklmYtkNo) ? `${row.KnklmOdaNo}-${row.KnklmYtkNo}` : '',
    KonaklamaTipi: row.KnklmTip
  };
  window.dispatchEvent(new Event('ekHizmetlerMusteriChanged'));
  
  // 🔥 DİNAMİK TABLO GÖSTERİMİ: Hangi kart seçiliyse ona göre tablo göster
  const ilk6Kart = ['cikis-yapanlar', 'bugun-cikan', 'yeni-musteri', 'yeni-giris', 'toplam-aktif', 'suresi-dolan']
  const son3Kart = ['borclu-musteriler', 'alacakli-musteriler', 'bakiyesiz-hesaplar']
  
  if (ilk6Kart.includes(currentFilter.value || '')) {
    // İlk 6 kart için konaklama geçmişi göster
    showKonaklamaGecmisi.value = true
    showCariHareketler.value = false
    currentAltTableType.value = 'konaklama'
    void loadKonaklamaGecmisi(row.MstrTCN)
  } else if (son3Kart.includes(currentFilter.value || '')) {
    // Son 3 kart için cari hareketler göster
    showKonaklamaGecmisi.value = false
    showCariHareketler.value = true
    currentAltTableType.value = 'cari'
    void loadCariHareketler(row.MstrTCN)
  }
  
  if (currentFilter.value === 'cikis-yapanlar' || currentFilter.value === 'bugun-cikan') {
    sessionStorage.setItem('autoFillTCKimlik', row.MstrTCN);
    sessionStorage.setItem('prevPage', 'kartli-islem');
    void router.push('/musteri-islem');
  } else {
    // Modal açılışından ÖNCE aktif konaklama kontrolü yap
    const modalAcilisAkisi = async () => {
      try {
        // Backend'den doğrudan aktif konaklama (KnklmCksTrh boş) kontrolü
        const tcn = row.MstrTCN || ''
        const aktifKonaklamaResp = await api.get(`/musteri/mevcut-konaklama/${encodeURIComponent(tcn)}`)
        const aktifKonaklama = aktifKonaklamaResp?.data?.data || null
        // Eğer aktif konaklama YOKSA (null/undefined), dönem yenileme modalını açma; musteri-islem'e yönlendir
        if (!aktifKonaklama) {
          // Aktif konaklama yok → musteri-islem sayfasına yönlendir ve yeni giriş hazırlığı yap
          // Seçili müşteri bilgisini global state'e koy
          window.kartliIslemSelectedNormalMusteri = {
            MstrTCN: row.MstrTCN,
            MstrAdi: row.MstrAdi,
            MstrTelNo: row.MstrTelNo || '',
            MstrDurum: 'AYRILDI',
            customerNote: 'Yeni Giriş Hazırlığı'
          } as { MstrTCN: string; MstrAdi: string; MstrTelNo: string; MstrDurum: string; customerNote: string };
          sessionStorage.setItem('prevPage', 'kartli-islem');
          await router.push('/musteri-islem');
          return;
        }

        // Aktif konaklama var: PlnTrh kontrolü ile mod seçim ipucu gönder
        const parseDate = (val: string | null | undefined): Date | null => {
          if (!val) return null
          const [g, a, y] = val.split('.').map(n => Number(n) || 0)
          if (!g || !a || !y) return null
          const d = new Date(y, a - 1, g)
          d.setHours(0,0,0,0)
          return isNaN(d.getTime()) ? null : d
        }
        const today = new Date(); today.setHours(0,0,0,0)
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
        const pln = parseDate(row.KnklmPlnTrh)
        const odaDegisikligiMi = Boolean(pln && pln.getTime() >= tomorrow.getTime())
        // Modal içindeki buton seçiminde kullanılması için işaret bırak
        // Not: DonemYenilemeModal zaten selectedData üzerinden karar verecek. Burada sadece geleceğe dönük genişletme için bayrak saklanabilir.
        const rowWithHint = row as MusteriKonaklama & { __odaDegisikligiModeHint?: boolean };
        rowWithHint.__odaDegisikligiModeHint = odaDegisikligiMi
      } catch {
        // Sessiz geç; hata durumunda mevcut akışla devam et
      }
      let odemeVadesi = '';
      
      // 1. Önce borçlu müşteri listesinden TC ile eşleştirme yap
      const borcluMusteriVadesi = borcluMusteriListesi.value.find(b => b.CariVTCN === row.MstrTCN)?.OdemeVadesi;
      
      if (borcluMusteriVadesi && borcluMusteriVadesi.trim() !== '') {
        odemeVadesi = borcluMusteriVadesi;
      } else {
        // 2. Borçlu müşteri listesinde bulunamazsa dashboard servisten hesaplat
        try {
          const vadeResponse = await api.get(`/dashboard/musteri-odeme-vadesi/${encodeURIComponent(row.MstrTCN)}`);
          if (vadeResponse.data.success && vadeResponse.data.data?.odemeVadesi) {
            odemeVadesi = vadeResponse.data.data.odemeVadesi;
          }
        } catch (error) {
          console.error('Ödeme vadesi hesaplama hatası:', error);
        }
      }
      
      // Modal'ı aç - ödeme vadesi formatını düzelt
      
      donemYenilemeData.value = { ...row, OdemeVadesi: convertDateFormat(odemeVadesi) };
      showDonemYenilemeModal.value = true;
    };
    
    void modalAcilisAkisi();
  }
}

// Borçlu müşteri gecikmeli tek tıklama event handler
function onBorcluMusteriClick(evt: Event, row: BorcluMusteri) {
  // 🔥 Önceki timeout'u temizle
  if (borcluMusteriClickTimeout.value) {
    clearTimeout(borcluMusteriClickTimeout.value)
  }
  
  // 🔥 300ms gecikme ile tek tıklama işlemini başlat
  borcluMusteriClickTimeout.value = window.setTimeout(() => {
    // Arama sonrası tıklamada, orijinal listeden gerçek nesneyi bul
    const realRow = borcluMusteriListesi.value.find(b => b.CariKod === row.CariKod) || row;
    
    selectedBorcluMusteri.value = realRow;
    
    // 🔥 DİNAMİK TABLO GÖSTERİMİ: Borçlu müşteri kartı için cari hareketler göster
    showCariHareketler.value = true;
    showKonaklamaGecmisi.value = false;
    currentAltTableType.value = 'cari';
    void loadCariHareketler(realRow.CariKod);
    
    // 🔥 Seçilen müşteri bakiyesini hesapla
    void hesaplaMusteriBakiye(realRow);
    // 🔥 Borçlu müşteri için firma bakiyesini hesapla ve selectedNormalMusteri'yi güncelle
    void hesaplaBorcluMusteriFirmaBakiye(realRow);
    // 🔥 Firma filtresi aktifse sadece o müşterinin verilerini yükle, filtreyi kapatma
    if (firmaFiltresiAktif.value && selectedFirmaAdi.value) {
      // Firma filtresi aktifken bireysel müşteri seçimi - sadece o müşterinin cari hareketlerini göster
      
      // Firma filtresi açık kalacak, sadece seçilen müşterinin verileri gösterilecek
    } else {
      // Normal durum - firma filtresini sıfırla (ama hesaplaBorcluMusteriFirmaBakiye zaten uygun şekilde ayarlıyor)
      // firmaFiltresiAktif.value = false; // Bu satırı kaldırıyoruz çünkü hesaplaBorcluMusteriFirmaBakiye zaten hallediyor
    }
    borcluMusteriClickTimeout.value = null
  }, 300)
}

// 🔥 BORÇLU MÜŞTERİ DOUBLE-CLICK FONKSİYONU - MÜŞTERİ TAHSİLAT MODALI AÇAR
function onBorcluMusteriDoubleClick(evt: Event, row: BorcluMusteri) {
  // 🔥 Önceki timeout'u temizle (tek tıklama işlemini iptal et)
  if (borcluMusteriClickTimeout.value) {
    clearTimeout(borcluMusteriClickTimeout.value)
    borcluMusteriClickTimeout.value = null
  }
  
  // 🔥 Müşteri bilgisini global state'e aktar
  window.kartliIslemSelectedNormalMusteri = {
    MstrTCN: row.CariVTCN || '',
    MstrAdi: row.CariAdi || '',
    MstrTelNo: row.CariTelNo || '',
    MstrDurum: 'KALIYOR',
    customerNote: 'Borçlu Müşteri'
  } as { MstrTCN: string; MstrAdi: string; MstrTelNo: string; MstrDurum: string; customerNote: string };
  
  // 🔥 OTOMATİK MODAL AÇMA FLAG'İNİ SET ET
  (window as Window & { kartliIslemAutoOpenModal?: boolean }).kartliIslemAutoOpenModal = true;
  
  // 🔥 Müşteri Tahsilat modalını aç
  window.dispatchEvent(new Event('showOdemeIslemModal'));
}

function formatCurrency(value: number | undefined | string | null): string {
  if (value === null || value === undefined || value === '') return '0 ₺'
  
  // String'i number'a çevir
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  // NaN kontrolü
  if (isNaN(numValue)) {
    return '0 ₺'
  }
  
  // Ondalık küsuratları yuvarla (2 basamak)
  const roundedValue = Math.round(numValue * 100) / 100
  
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(roundedValue)
}

// Tam sayı tutar formatlama fonksiyonu (ondalık küsurat göstermez)
function formatIntegerCurrency(value: number | undefined | string | null): string {
  if (value === null || value === undefined || value === '') return '0 ₺'
  
  // String'i number'a çevir
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  // NaN kontrolü
  if (isNaN(numValue)) {
    return '0 ₺'
  }
  
  // Tam sayıya yuvarla (ondalık kısmı kaldır)
  const integerValue = Math.round(numValue)
  
  // Manuel formatlama ile kesinlik sağla
  const formattedNumber = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(integerValue)
  
  return `${formattedNumber} ₺`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  // DD.MM.YYYY formatında gelen tarihi düzenle
  return dateStr
}

// Tarih formatını MM.DD.YYYY'den DD.MM.YYYY'ye çevir
function convertDateFormat(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') return '';
  
  // MM.DD.YYYY formatını kontrol et ve DD.MM.YYYY'ye çevir
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const firstPart = parseInt(parts[0] || '0');
      const secondPart = parseInt(parts[1] || '0');
      
      // Eğer ikinci kısım 12'den büyükse, bu MM.DD.YYYY formatıdır (ay 12'den büyük olamaz)
      if (secondPart > 12) {
        const result = `${parts[1]}.${parts[0]}.${parts[2]}`;
        return result;
      }
      // Eğer ilk kısım 12'den büyükse, bu MM.DD.YYYY formatıdır (gün > 12)
      else if (firstPart > 12) {
        const result = `${parts[1]}.${parts[0]}.${parts[2]}`;
        return result;
      }
      // Eğer her ikisi de 12'den küçükse, varsayılan olarak MM.DD.YYYY kabul et
      else {
        const result = `${parts[1]}.${parts[0]}.${parts[2]}`;
        return result;
      }
    }
  }
  
  // Farklı formatlar için kontrol
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    // YYYY-MM-DD formatı
    const parts = dateStr.split('-');
    const result = `${parts[2]}.${parts[1]}.${parts[0]}`;
    return result;
  }
  
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    // MM/DD/YYYY formatı
    const parts = dateStr.split('/');
    const result = `${parts[1]}.${parts[0]}.${parts[2]}`;
    return result;
  }
  
  return dateStr; // Değiştirilemezse olduğu gibi döndür
}

function getTipColor(tip: string): string {
  switch (tip) {
    case 'GÜNLÜK': return 'blue'
    case 'HAFTALIK': return 'orange'
    case 'AYLIK': return 'green'
    default: return 'grey'
  }
}

// Eski getIslemTipColor fonksiyonu kaldırıldı; yukarıdaki yeni sürüm kullanılıyor

function getIslemTutarClass(tip: string): string {
  switch (tip) {
    case 'GELİR': return 'text-green'
    case 'Çıkan': return 'text-green' // 🔥 SWAP: Çıkan artık yeşil
    case 'GİDER': return 'text-red'
    case 'Giren': return 'text-orange' // 🔥 SWAP: Giren artık turuncu
    default: return 'text-blue'
  }
}

// 🔥 MÜŞTERİ BAKİYE HESAPLAMA FONKSİYONU
async function hesaplaMusteriBakiye(musteri: MusteriKonaklama | BorcluMusteri | AlacakliMusteri) {
  try {
    // Cari kodu belirle
    let cariKod = '';
    
    if ('CariKod' in musteri) {
      // Borçlu/Alacaklı müşteri tablosundan geliyorsa
      cariKod = musteri.CariKod;
    } else {
      // Normal müşteri tablosundan geliyorsa - cari kodu oluştur
      // MstrNo'yu TC'den bulmamız gerekiyor, backend'den alacağız
      const response = await api.get(`/musteri/musteri-bilgi/${musteri.MstrTCN}`);
      
      if (response.data.success && response.data.data) {
        const mstrNo = response.data.data.MstrNo;
        const hspTip = response.data.data.MstrHspTip || musteri.MstrHspTip;
        cariKod = hspTip === 'Kurumsal' ? `MK${mstrNo}` : `MB${mstrNo}`;
      }
    }
    
    if (!cariKod) {
      console.log('🔥 CariKod bulunamadı, bakiyeler sıfırlanıyor');
      selectedMusteriBakiye.value = 0;
      selectedMusteriDepozito.value = 0;
      (window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye = 0;
      return;
    }
    
    // Backend'den bakiye ve depozito bilgilerini paralel olarak al
    console.log('🔥 Bakiye hesaplama başladı, cariKod:', cariKod);
    const [bakiyeResponse, depozitoResponse] = await Promise.all([
      api.get(`/dashboard/musteri-bakiye/${cariKod}`),
      api.get(`/dashboard/musteri-depozito-bakiye/${cariKod}`)
    ]);
    
    console.log('🔥 Bakiye response:', bakiyeResponse.data);
    console.log('🔥 Depozito response:', depozitoResponse.data);
    
    if (bakiyeResponse.data.success) {
      const hamBakiye = bakiyeResponse.data.bakiye || 0;
      selectedMusteriBakiye.value = hamBakiye;
      // Global erişim için window objesine ata
      (window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye = hamBakiye;
      console.log('🔥 Ham bakiye set edildi:', hamBakiye);
    } else {
      selectedMusteriBakiye.value = 0;
      (window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye = 0;
      console.log('🔥 Bakiye response başarısız');
    }

    if (depozitoResponse.data.success) {
      selectedMusteriDepozito.value = depozitoResponse.data.depozitoBakiye || 0;
      console.log('🔥 Depozito bakiyesi set edildi:', depozitoResponse.data.depozitoBakiye);
    } else {
      selectedMusteriDepozito.value = 0;
      console.log('🔥 Depozito response başarısız');
    }

    // 🔥 DEPOZİTO BAKİYESİNİ ANA BAKİYEDEN ÇIKAR
    // Depozito bakiyesi pozitif ise (müşterinin depozitosu var), ana bakiyeden çıkar
    // Depozito bakiyesi negatif ise (müşteriye depozito iadesi yapılmış), ana bakiyeye ekle
    const depozitoBakiye = selectedMusteriDepozito.value;
    const hamBakiye = selectedMusteriBakiye.value;
    
    console.log('🔥 Depozito bakiyesi:', depozitoBakiye);
    console.log('🔥 Ham bakiye:', hamBakiye);
    
    // Net bakiye = Ham bakiye - Depozito bakiyesi
    const netBakiye = hamBakiye //- depozitoBakiye;
    
    console.log('🔥 Net bakiye hesaplandı:', netBakiye);
    
    selectedMusteriBakiye.value = netBakiye;
    (window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye = netBakiye;
  } catch (error: unknown) {
    console.error('Müşteri bakiye hesaplama hatası:', error);
    console.log('🔥 Hata durumunda bakiyeler sıfırlanıyor');
    selectedMusteriBakiye.value = 0;
    selectedMusteriDepozito.value = 0;
    (window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye = 0;
  }
}

// 🔥 BAKİYE RENK SINIFI FONKSİYONU
function getMusteriBakiyeClass(bakiye: number): string {
  if (bakiye > 0) {
    return 'text-red'; // Borçlu müşteri - kırmızı
  } else if (bakiye < 0) {
    return 'text-green'; // Alacaklı müşteri - yeşil
  } else {
    return 'text-grey-6'; // Sıfır bakiye - gri
  }
}

// 🔥 FİRMA BAKİYE HESAPLAMA FONKSİYONU
async function hesaplaFirmaBakiye(musteri: MusteriKonaklama) {
  try {
    if (!musteri.MstrFirma || musteri.MstrHspTip !== 'Kurumsal') {
      selectedFirmaBakiye.value = 0;
      return;
    }

    const encodedFirmaAdi = encodeURIComponent(musteri.MstrFirma);
    
    // Backend'den firma bakiyesini al
    const response = await api.get(`/dashboard/firma-bakiye/${encodedFirmaAdi}`);
    
    if (response.data.success) {
      selectedFirmaBakiye.value = response.data.bakiye || 0;
    } else {
      selectedFirmaBakiye.value = 0;
    }
  } catch (error: unknown) {
    console.error('Firma bakiye hesaplama hatası:', error);
    selectedFirmaBakiye.value = 0;
  }
}

// 🔥 ALACAKLI MÜŞTERİ GECİKMELİ TEK TIKLAMA FONKSİYONU
function onAlacakliMusteriClick(evt: Event, row: AlacakliMusteri) {
  // 🔥 Önceki timeout'u temizle
  if (alacakliMusteriClickTimeout.value) {
    clearTimeout(alacakliMusteriClickTimeout.value)
  }
  
  // 🔥 300ms gecikme ile tek tıklama işlemini başlat
  alacakliMusteriClickTimeout.value = window.setTimeout(() => {
    void (async () => {
      try {
        // Önceki seçimi temizle
        selectedBorcluMusteri.value = null
        
        console.log('Alacaklı müşteri tek tıklandı:', row)
        selectedBorcluMusteri.value = row // Alacaklı müşteri de aynı yapıda olduğu için
        
        // 🔥 Seçilen müşteri bakiyesini hesapla (depozito dahil)
        await hesaplaMusteriBakiye(row);
        
        // Firma bakiyesini hesapla
        await hesaplaAlacakliMusteriFirmaBakiye(row)
        
        // 🔥 DİNAMİK TABLO GÖSTERİMİ: Alacaklı müşteri kartı için cari hareketler göster
        showCariHareketler.value = true
        showKonaklamaGecmisi.value = false
        currentAltTableType.value = 'cari'
        void loadCariHareketler(row.CariKod)
        console.log('Alacaklı müşteri için cari hareketler yükleniyor:', row.CariKod)
      } catch (error) {
        console.error('Alacaklı müşteri seçme hatası:', error)
      }
      
      alacakliMusteriClickTimeout.value = null
    })()
  }, 300)
}

// 🔥 ALACAKLI MÜŞTERİ DOUBLE-CLICK FONKSİYONU - MÜŞTERİ TAHSİLAT MODALI AÇAR
function onAlacakliMusteriDoubleClick(evt: Event, row: AlacakliMusteri) {
  // 🔥 Önceki timeout'u temizle (tek tıklama işlemini iptal et)
  if (alacakliMusteriClickTimeout.value) {
    clearTimeout(alacakliMusteriClickTimeout.value)
    alacakliMusteriClickTimeout.value = null
  }
  
  // 🔥 Müşteri bilgisini global state'e aktar
  window.kartliIslemSelectedNormalMusteri = {
    MstrTCN: row.CariVTCN || '',
    MstrAdi: row.CariAdi || '',
    MstrTelNo: row.CariTelNo || '',
    MstrDurum: 'KALIYOR',
    customerNote: 'Alacaklı Müşteri'
  } as { MstrTCN: string; MstrAdi: string; MstrTelNo: string; MstrDurum: string; customerNote: string };
  
  // 🔥 OTOMATİK MODAL AÇMA FLAG'İNİ SET ET
  (window as Window & { kartliIslemAutoOpenModal?: boolean }).kartliIslemAutoOpenModal = true;
  
  // 🔥 Müşteri Tahsilat modalını aç
  window.dispatchEvent(new Event('showOdemeIslemModal'));
}

// 🔥 BAKİYESİZ HESAPLAR GECİKMELİ TEK TIKLAMA FONKSİYONU
function onBakiyesizHesaplarClick(evt: Event, row: BakiyesizHesaplar) {
  // 🔥 Önceki timeout'u temizle
  if (bakiyesizHesaplarClickTimeout.value) {
    clearTimeout(bakiyesizHesaplarClickTimeout.value)
  }
  
  // 🔥 300ms gecikme ile tek tıklama işlemini başlat
  bakiyesizHesaplarClickTimeout.value = window.setTimeout(() => {
    void (async () => {
      try {
        // Önceki seçimi temizle
        selectedBorcluMusteri.value = null
        
        selectedBorcluMusteri.value = row // Bakiyesiz hesap da aynı yapıda olduğu için
        
        // 🔥 Seçilen müşteri bakiyesini hesapla (depozito dahil)
        await hesaplaMusteriBakiye(row);
        
        // Firma bakiyesini hesapla
        await hesaplaBakiyesizHesaplarFirmaBakiye(row)
        
        // 🔥 DİNAMİK TABLO GÖSTERİMİ: Bakiyesiz hesaplar kartı için cari hareketler göster
        showCariHareketler.value = true
        showKonaklamaGecmisi.value = false
        currentAltTableType.value = 'cari'
        void loadCariHareketler(row.CariKod)
      } catch (error) {
        console.error('Bakiyesiz hesap seçme hatası:', error)
      }
      
      bakiyesizHesaplarClickTimeout.value = null
    })()
  }, 300)
}

// 🔥 BAKİYESİZ HESAPLAR DOUBLE-CLICK FONKSİYONU - MÜŞTERİ TAHSİLAT MODALI AÇAR
function onBakiyesizHesaplarDoubleClick(evt: Event, row: BakiyesizHesaplar) {
  // 🔥 Önceki timeout'u temizle (tek tıklama işlemini iptal et)
  if (bakiyesizHesaplarClickTimeout.value) {
    clearTimeout(bakiyesizHesaplarClickTimeout.value)
    bakiyesizHesaplarClickTimeout.value = null
  }
  
  // 🔥 Müşteri bilgisini global state'e aktar
  window.kartliIslemSelectedNormalMusteri = {
    MstrTCN: row.CariVTCN || '',
    MstrAdi: row.CariAdi || '',
    MstrTelNo: row.CariTelNo || '',
    MstrDurum: 'KALIYOR',
    customerNote: 'Bakiyesiz Hesap'
  } as { MstrTCN: string; MstrAdi: string; MstrTelNo: string; MstrDurum: string; customerNote: string };
  
  // 🔥 OTOMATİK MODAL AÇMA FLAG'İNİ SET ET
  (window as Window & { kartliIslemAutoOpenModal?: boolean }).kartliIslemAutoOpenModal = true;
  
  // 🔥 Müşteri Tahsilat modalını aç
  window.dispatchEvent(new Event('showOdemeIslemModal'));
}

// 🔥 ALACAKLI MÜŞTERİ İÇİN FİRMA BAKİYE HESAPLAMA FONKSİYONU
async function hesaplaAlacakliMusteriFirmaBakiye(alacakliMusteri: AlacakliMusteri) {
  try {
    // 🔥 selectedNormalMusteri'yi güncelle (UI'da firma bakiye setinin görünmesi için)
    const alacakliMusteriData = {
      MstrTCN: '', // Alacaklı müşteri tablosunda TC bilgisi yok
      MstrHspTip: alacakliMusteri.MstrHspTip || 'Bireysel',
      MstrFirma: alacakliMusteri.MstrFirma || '',
      MstrAdi: alacakliMusteri.CariAdi || '',
      MstrTelNo: alacakliMusteri.CariTelNo || '',
      KnklmOdaTip: '',
      KnklmOdaNo: '',
      KnklmYtkNo: '',
      KnklmTip: '',
      KnklmNfyt: 0,
      KnklmGrsTrh: '',
      KnklmPlnTrh: '',
      KnklmNot: '',
      CariKod: alacakliMusteri.CariKod // Alacaklı müşteri için CariKod bilgisini ekle
    };
    
    selectedNormalMusteri.value = alacakliMusteriData;
    
    // 🔥 window.kartliIslemSelectedNormalMusteri'yi de güncelle (Müşteri Tahsilat formu için)
    window.kartliIslemSelectedNormalMusteri = alacakliMusteriData;
    
    // Kurumsal müşteri değilse firma bakiyesi sıfır
    if (!alacakliMusteri.MstrFirma || alacakliMusteri.MstrHspTip !== 'Kurumsal') {
      selectedFirmaBakiye.value = 0;
      // Firma filtresi aktif değilse firma adını da temizle
      if (!firmaFiltresiAktif.value) {
        selectedFirmaAdi.value = '';
      }
      // Bireysel müşteri için firma filtresini kapat (sadece filtre aktif değilse)
      if (!firmaFiltresiAktif.value) {
        firmaFiltresiAktif.value = false;
      }
      return;
    }
    
    // 🔥 Firma adını güncelle (sadece filtre aktif değilse)
    if (!firmaFiltresiAktif.value) {
      selectedFirmaAdi.value = alacakliMusteri.MstrFirma;
    }
    
    // Firma bakiyesini hesapla
    const firmaResponse = await api.get(`/dashboard/firma-bakiye/${encodeURIComponent(alacakliMusteri.MstrFirma)}`);
    if (firmaResponse.data.success) {
      selectedFirmaBakiye.value = firmaResponse.data.bakiye || 0;
    } else {
      selectedFirmaBakiye.value = 0;
    }
  } catch (error) {
    console.error('Alacaklı müşteri firma bakiye hesaplama hatası:', error);
    selectedFirmaBakiye.value = 0;
    selectedFirmaAdi.value = '';
    selectedNormalMusteri.value = null;
  }
}

// 🔥 BAKİYESİZ HESAPLAR İÇİN FİRMA BAKİYE HESAPLAMA FONKSİYONU
async function hesaplaBakiyesizHesaplarFirmaBakiye(bakiyesizHesaplar: BakiyesizHesaplar) {
  try {
    // 🔥 selectedNormalMusteri'yi güncelle (UI'da firma bakiye setinin görünmesi için)
    const bakiyesizHesaplarData = {
      MstrTCN: '', // Bakiyesiz hesaplar tablosunda TC bilgisi yok
      MstrHspTip: bakiyesizHesaplar.MstrHspTip || 'Bireysel',
      MstrFirma: bakiyesizHesaplar.MstrFirma || '',
      MstrAdi: bakiyesizHesaplar.CariAdi || '',
      MstrTelNo: bakiyesizHesaplar.CariTelNo || '',
      KnklmOdaTip: '',
      KnklmOdaNo: '',
      KnklmYtkNo: '',
      KnklmTip: '',
      KnklmNfyt: 0,
      KnklmGrsTrh: '',
      KnklmPlnTrh: '',
      KnklmNot: '',
      CariKod: bakiyesizHesaplar.CariKod // Bakiyesiz hesaplar için CariKod bilgisini ekle
    };
    
    selectedNormalMusteri.value = bakiyesizHesaplarData;
    
    // 🔥 window.kartliIslemSelectedNormalMusteri'yi de güncelle (Müşteri Tahsilat formu için)
    window.kartliIslemSelectedNormalMusteri = bakiyesizHesaplarData;
    
    // Kurumsal müşteri değilse firma bakiyesi sıfır
    if (!bakiyesizHesaplar.MstrFirma || bakiyesizHesaplar.MstrHspTip !== 'Kurumsal') {
      selectedFirmaBakiye.value = 0;
      // Firma filtresi aktif değilse firma adını da temizle
      if (!firmaFiltresiAktif.value) {
        selectedFirmaAdi.value = '';
      }
      // Bireysel müşteri için firma filtresini kapat (sadece filtre aktif değilse)
      if (!firmaFiltresiAktif.value) {
        firmaFiltresiAktif.value = false;
      }
      return;
    }
    
    // 🔥 Firma adını güncelle (sadece filtre aktif değilse)
    if (!firmaFiltresiAktif.value) {
      selectedFirmaAdi.value = bakiyesizHesaplar.MstrFirma;
    }
    
    // Firma bakiyesini hesapla
    const firmaResponse = await api.get(`/dashboard/firma-bakiye/${encodeURIComponent(bakiyesizHesaplar.MstrFirma)}`);
    if (firmaResponse.data.success) {
      selectedFirmaBakiye.value = firmaResponse.data.bakiye || 0;
    } else {
      selectedFirmaBakiye.value = 0;
    }
  } catch (error) {
    console.error('Bakiyesiz hesaplar firma bakiye hesaplama hatası:', error);
    selectedFirmaBakiye.value = 0;
    selectedFirmaAdi.value = '';
    selectedNormalMusteri.value = null;
  }
}

// 🔥 BORÇLU MÜŞTERİ İÇİN FİRMA BAKİYE HESAPLAMA FONKSİYONU
async function hesaplaBorcluMusteriFirmaBakiye(borcluMusteri: BorcluMusteri) {
  try {
    // 🔥 selectedNormalMusteri'yi güncelle (UI'da firma bakiye setinin görünmesi için)
    const borcluMusteriData = {
      MstrTCN: '', // Borçlu müşteri tablosunda TC bilgisi yok
      MstrHspTip: borcluMusteri.MstrHspTip || 'Bireysel',
      MstrFirma: borcluMusteri.MstrFirma || '',
      MstrAdi: borcluMusteri.CariAdi || '',
      MstrTelNo: borcluMusteri.CariTelNo || '',
      KnklmOdaTip: '',
      KnklmOdaNo: '',
      KnklmYtkNo: '',
      KnklmTip: '',
      KnklmNfyt: 0,
      KnklmGrsTrh: '',
      KnklmPlnTrh: '',
      KnklmNot: '',
      CariKod: borcluMusteri.CariKod // Borçlu müşteri için CariKod bilgisini ekle
    };
    
    selectedNormalMusteri.value = borcluMusteriData;
    
    // 🔥 window.kartliIslemSelectedNormalMusteri'yi de güncelle (Müşteri Tahsilat formu için)
    window.kartliIslemSelectedNormalMusteri = borcluMusteriData;
    
    // Kurumsal müşteri değilse firma bakiyesi sıfır
    if (!borcluMusteri.MstrFirma || borcluMusteri.MstrHspTip !== 'Kurumsal') {
      selectedFirmaBakiye.value = 0;
      // Firma filtresi aktif değilse firma adını da temizle
      if (!firmaFiltresiAktif.value) {
        selectedFirmaAdi.value = '';
      }
      // Bireysel müşteri için firma filtresini kapat (sadece filtre aktif değilse)
      if (!firmaFiltresiAktif.value) {
        firmaFiltresiAktif.value = false;
      }
      return;
    }
    
    // 🔥 Firma adını güncelle (sadece filtre aktif değilse)
    if (!firmaFiltresiAktif.value) {
      selectedFirmaAdi.value = borcluMusteri.MstrFirma;
    }
    
    // Firma bakiyesini hesapla
    const firmaResponse = await api.get(`/dashboard/firma-bakiye/${encodeURIComponent(borcluMusteri.MstrFirma)}`);
    if (firmaResponse.data.success) {
      selectedFirmaBakiye.value = firmaResponse.data.bakiye || 0;
    } else {
      selectedFirmaBakiye.value = 0;
    }
  } catch (error) {
    console.error('Borçlu müşteri firma bakiye hesaplama hatası:', error);
    selectedFirmaBakiye.value = 0;
    selectedFirmaAdi.value = '';
    selectedNormalMusteri.value = null;
  }
}

function getDateClass(dateStr: string): string {
  if (!dateStr) return ''
  
  // Tarihi parse et (DD.MM.YYYY formatında)
  const parts = dateStr.split('.')
  if (parts.length !== 3) return ''
  
  const year = parts[2] ? parseInt(parts[2]) : 0
  const month = parts[1] ? parseInt(parts[1]) - 1 : 0
  const day = parts[0] ? parseInt(parts[0]) : 0
  
  const date = new Date(year, month, day)
  const today = new Date()
  
  // Bugünün başlangıcını al (saat 00:00:00)
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  
  console.log('🔥 getDateClass Debug:', {
    dateStr,
    parts,
    year,
    month,
    day,
    date: date.toDateString(),
    today: today.toDateString(),
    todayStart: todayStart.toDateString(),
    isPast: date < todayStart,
    isToday: date.toDateString() === today.toDateString()
  })

  
  
  if (date < todayStart) {
    console.log('🔥 Geçmiş tarih - past-date-highlight')
    return 'past-date-highlight' // Geçmiş tarih - eliptik kırmızı
  } else if (date.toDateString() === today.toDateString()) {
    console.log('🔥 Bugün - today-date-highlight')
    return 'today-date-highlight' // Bugün - eliptik turuncu
  } else {
    console.log('🔥 Gelecek tarih - future-date-highlight')
    return 'future-date-highlight' // Gelecek tarih - eliptik yeşil
  }
}



// Global arama (backend) fonksiyonu
async function performSearch(searchValue: string) {
  console.log('🔍 performSearch çağrıldı:', searchValue);
  
  // Bu isteğe bir sıra numarası ata ve önceki isteği iptal et
  const mySeq = ++searchRequestSeq
  if (activeSearchController) {
    try { activeSearchController.abort() } catch { /* no-op */ }
  }
  activeSearchController = new AbortController()
  
  // 3 haneli sayı değilse en az 7 karakter gerekli
  if (!/^\d{3}$/.test(searchValue.trim()) && (!searchValue || searchValue.trim().length < 7)) {
    console.log('❌ Arama kriterleri karşılanmıyor:', searchValue);
    filteredMusteriListesi.value = []
    filteredBorcluMusteriListesi.value = []
    filteredBakiyesizHesaplarListesi.value = []
    filteredCariHareketlerListesi.value = []
    return
  }
  
  console.log('✅ Arama kriterleri karşılandı, devam ediliyor');
  // 3 haneli sayısal ise: oda no araması (tek kayıt)
  const trimmed = searchValue.trim()
  if (/^\d{3}$/.test(trimmed)) {
    console.log('🔍 3 haneli oda araması yapılıyor:', trimmed);
    showKonaklamaGecmisi.value = false
    showCariHareketler.value = false
    try {
      console.log('🔍 Oda araması API çağrısı:', `/dashboard/musteri-konaklama-search-by-oda?odaNo=${trimmed}`);
      const { data } = await api.get('/dashboard/musteri-konaklama-search-by-oda', {
        params: { odaNo: trimmed },
        signal: activeSearchController.signal
      })
      if (data && data.success) {
        console.log('🔍 Oda araması API yanıtı:', data);
        const rows: SearchMusteriKonaklama[] = (data.data || []) as SearchMusteriKonaklama[]
        console.log('🔍 Bulunan oda kayıtları:', rows.length);
        
        // Yalnızca en güncel isteğin sonucunu uygula
        if (mySeq !== searchRequestSeq) return
        filteredMusteriListesi.value = rows.map((x) => ({
          MstrTCN: x.MstrTCN || '',
          MstrHspTip: x.MstrHspTip || '',
          MstrFirma: x.MstrFirma || '',
          MstrAdi: x.MstrAdi || '',
          MstrTelNo: x.MstrTelNo || '',
          KnklmOdaTip: x.KnklmOdaTip || '',
          KnklmOdaNo: x.KnklmOdaNo || '',
          KnklmYtkNo: x.KnklmYtkNo || '',
          KnklmTip: x.KnklmTip || '',
          KnklmNfyt: Number(x.KnklmNfyt || 0),
          KnklmGrsTrh: x.KnklmGrsTrh || '',
          KnklmPlnTrh: x.KnklmPlnTrh || '',
          KnklmCksTrh: x.KnklmCksTrh || '',
          KnklmNot: x.KnklmNot || ''
        })) as unknown as MusteriKonaklama[]
        console.log('🔍 filteredMusteriListesi güncellendi:', filteredMusteriListesi.value.length);
        
        filteredBorcluMusteriListesi.value = []
        filteredBakiyesizHesaplarListesi.value = []
        filteredCariHareketlerListesi.value = []
        return
      }
      if (mySeq !== searchRequestSeq) return
      filteredMusteriListesi.value = []
      return
    } catch (err) {
      // İptal hatalarını sessizce yut
      if (err && typeof err === 'object' && 'name' in err && (err as { name?: string }).name === 'CanceledError') {
        return
      }
      console.error('Oda no araması hatası:', err)
      if (mySeq !== searchRequestSeq) return
      filteredMusteriListesi.value = []
      return
    }
  }
  // Arama aktifken alt grid tablolarını gizle
  showKonaklamaGecmisi.value = false
  showCariHareketler.value = false
  try {
    const { data } = await api.get('/dashboard/musteri-konaklama-search', {
      params: { q: searchValue.trim(), page: 1, limit: 50 },
      signal: activeSearchController.signal
    })
    if (data && data.success) {
      // Backend global arama sonuçları kart bağımsızdır. Normal tablo için direkt gösteriyoruz.
      // Tip uyumu için yalnızca ortak alanları kullanıyoruz.
      const rows: SearchMusteriKonaklama[] = (data.data || []) as SearchMusteriKonaklama[];
      // Yalnızca en güncel isteğin sonucunu uygula
      if (mySeq !== searchRequestSeq) return
      filteredMusteriListesi.value = rows.map((x) => ({
        MstrTCN: x.MstrTCN || '',
        MstrHspTip: x.MstrHspTip || '',
        MstrFirma: x.MstrFirma || '',
        MstrAdi: x.MstrAdi || '',
        MstrTelNo: x.MstrTelNo || '',
        KnklmOdaTip: x.KnklmOdaTip || '',
        KnklmOdaNo: x.KnklmOdaNo || '',
        KnklmYtkNo: x.KnklmYtkNo || '',
        KnklmTip: x.KnklmTip || '',
        KnklmNfyt: Number(x.KnklmNfyt || 0),
        KnklmGrsTrh: x.KnklmGrsTrh || '',
        KnklmPlnTrh: x.KnklmPlnTrh || '',
        KnklmCksTrh: x.KnklmCksTrh || '',
        KnklmNot: x.KnklmNot || ''
      })) as unknown as MusteriKonaklama[]
      // Diğer tablolar global arama kapsamı dışında tutulur
      filteredBorcluMusteriListesi.value = []
      filteredBakiyesizHesaplarListesi.value = []
      filteredCariHareketlerListesi.value = []
    } else {
      if (mySeq !== searchRequestSeq) return
      filteredMusteriListesi.value = []
    }
  } catch (err) {
    if (err && typeof err === 'object' && 'name' in err && (err as { name?: string }).name === 'CanceledError') {
      return
    }
    console.error('Global arama hatası:', err)
    if (mySeq !== searchRequestSeq) return
    filteredMusteriListesi.value = []
  }
}

// Arama değişikliği event handler
function onSearchChange(newValue: string | number | null) {
  const searchValue = newValue ? String(newValue) : ''
  searchText.value = searchValue
  
  // 🔥 Arama metni temizlendiğinde focus durumunu kontrol et
  if (!searchValue || searchValue.trim().length === 0) {
    // Arama metni temizlendi, focus durumuna göre görünürlük belirlenecek
    console.log('Arama metni temizlendi - görünürlük focus durumuna göre belirlenecek')
    // Arama kapandıysa alt gridler eski davranışına dönebilir
    showKonaklamaGecmisi.value = false
    showCariHareketler.value = false
    // Arama temizlenince filtrelenmiş listeleri de boşalt
    filteredMusteriListesi.value = []
    filteredBorcluMusteriListesi.value = []
    filteredBakiyesizHesaplarListesi.value = []
    filteredCariHareketlerListesi.value = []

    // 🔥 Seçimi ve bakiyeleri de sıfırla
    selectedNormalMusteri.value = null
    selectedMusteriBakiye.value = 0
    selectedMusteriDepozito.value = 0
    selectedFirmaBakiye.value = 0
    ;(window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye = 0
  }
  
  void performSearch(searchValue)
}

// 🔥 DİNAMİK BUTON FONKSİYONU
function toggleAltTable() {
  console.log('🔄 toggleAltTable başladı, currentAltTableType:', currentAltTableType.value)
  console.log('🔄 selectedNormalMusteri:', selectedNormalMusteri.value?.MstrAdi)
  console.log('🔄 selectedBorcluMusteri:', selectedBorcluMusteri.value?.CariAdi)
  console.log('🔄 currentFilter:', currentFilter.value)
  
  if (currentAltTableType.value === 'konaklama') {
    // Konaklama geçmişinden Cari hareketlere geç
    console.log('🔄 Konaklama → Cari Hareketler geçişi')
    currentAltTableType.value = 'cari'
    
    // 🔥 ÖNEMLİ: Önce tüm alt tabloları gizle, sonra sadece cari hareketleri göster
    showKonaklamaGecmisi.value = false
    showCariHareketler.value = true
    
    // 🔥 ÖNEMLİ: Cari hareketler listesini temizle
    cariHareketlerListesi.value = []
    filteredCariHareketlerListesi.value = []
    console.log('🔄 Cari hareketler listesi temizlendi')
    
    // İlk 6 kart için selectedNormalMusteri, son 3 kart için selectedBorcluMusteri kullan
    if (currentFilter.value && ['normal-musteriler', 'suresi-dolan', 'bugun-cikan', 'yeni-musteri', 'yeni-giris', 'toplam-aktif'].includes(currentFilter.value)) {
      // İlk 6 kart için TC kimlik ile cari hareketler yükle
      if (selectedNormalMusteri.value) {
        console.log('🔄 loadCariHareketlerByTC çağrılıyor:', selectedNormalMusteri.value.MstrTCN)
        void loadCariHareketlerByTC(selectedNormalMusteri.value.MstrTCN)
      }
    } else {
      // Son 3 kart için cari kod ile cari hareketler yükle
      if (selectedBorcluMusteri.value) {
        console.log('🔄 loadCariHareketler çağrılıyor:', selectedBorcluMusteri.value.CariKod)
        void loadCariHareketler(selectedBorcluMusteri.value.CariKod)
      }
    }
  } else {
    // Cari hareketlerden Konaklama geçmişine geç
    console.log('🔄 Cari Hareketler → Konaklama geçişi')
    currentAltTableType.value = 'konaklama'
    
    // 🔥 ÖNEMLİ: Önce tüm alt tabloları gizle, sonra sadece konaklama geçmişini göster
    showCariHareketler.value = false
    showKonaklamaGecmisi.value = true
    
    // 🔥 ÖNEMLİ: Konaklama geçmişi listesini temizle
    konaklamaGecmisiListesi.value = []
    console.log('🔄 Konaklama geçmişi listesi temizlendi')
    
    // İlk 6 kart için selectedNormalMusteri, son 3 kart için selectedBorcluMusteri kullan
    if (currentFilter.value && ['normal-musteriler', 'suresi-dolan', 'bugun-cikan', 'yeni-musteri', 'yeni-giris', 'toplam-aktif'].includes(currentFilter.value)) {
      // İlk 6 kart için TC kimlik ile konaklama geçmişi yükle
      if (selectedNormalMusteri.value) {
        console.log('🔄 loadKonaklamaGecmisi çağrılıyor:', selectedNormalMusteri.value.MstrTCN)
        void loadKonaklamaGecmisi(selectedNormalMusteri.value.MstrTCN)
      }
    } else {
      // Son 3 kart için TC kimlik ile konaklama geçmişi yükle
      if (selectedBorcluMusteri.value) {
        console.log('🔄 Son 3 kart - selectedBorcluMusteri:', selectedBorcluMusteri.value)
        console.log('🔄 CariVTCN:', selectedBorcluMusteri.value.CariVTCN)
        
        if (selectedBorcluMusteri.value.CariVTCN && selectedBorcluMusteri.value.CariVTCN.trim() !== '') {
          console.log('🔄 loadKonaklamaGecmisi çağrılıyor:', selectedBorcluMusteri.value.CariVTCN)
          void loadKonaklamaGecmisi(selectedBorcluMusteri.value.CariVTCN)
        } else {
          console.log('🔄 CariVTCN boş, konaklama geçmişi yüklenemiyor')
        }
      }
    }
  }
  
  console.log('🔄 toggleAltTable bitti, showKonaklamaGecmisi:', showKonaklamaGecmisi.value, 'showCariHareketler:', showCariHareketler.value)
}

async function loadFilteredData(filter: string) {
  currentFilter.value = filter  
  // 🔥 Seçilen kartı session storage'a kaydet
  sessionStorage.setItem('kartliIslemLastCard', filter)
  
  // 🔥 Global değişkeni güncelle (MainLayout için)
;(window as { kartliIslemCurrentFilter?: string }).kartliIslemCurrentFilter = filter
  
  sortingInProgress = false  // Filtre değiştiğinde yeni veri çek
  
  // 🔥 PERFORMANS İYİLEŞTİRMESİ: Dinamik listeleri paralel yükle
  await Promise.all([
    loadDinamikKonaklamaTipleri(),
    loadDinamikOdaTipleri()
  ])
  
  // Yeni kart seçildiğinde arama metnini temizle ve filtreyi kaldır
  searchText.value = ''
  filteredMusteriListesi.value = []
  filteredBorcluMusteriListesi.value = []
  filteredBakiyesizHesaplarListesi.value = []
  filteredCariHareketlerListesi.value = []
  
  // 🔥 ALT GRID TABLOLARI GİZLE VE SEÇİMLERİ TEMİZLE
  showKonaklamaGecmisi.value = false
  showCariHareketler.value = false
  selectedNormalMusteri.value = null
  
  // 🔥 Müşteri bakiyesini sıfırla
  selectedMusteriBakiye.value = 0;
  selectedMusteriDepozito.value = 0;
  selectedFirmaBakiye.value = 0;
  // Global erişim için window objesini de sıfırla
  (window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye = 0;
  
  // 🔥 Firma filtresini temizle
  firmaFiltresiAktif.value = false
  selectedFirmaAdi.value = ''
  
  // 🔥 DİNAMİK BUTON AYARLARI
  const ilk6Kart = ['cikis-yapanlar', 'bugun-cikan', 'yeni-musteri', 'yeni-giris', 'toplam-aktif', 'suresi-dolan']
  const son3Kart = ['borclu-musteriler', 'alacakli-musteriler', 'bakiyesiz-hesaplar']
  
  if (ilk6Kart.includes(filter)) {
    // İlk 6 kart için dinamik buton göster ve default konaklama geçmişi
    showToggleButton.value = true
    currentAltTableType.value = 'konaklama'
  } else if (son3Kart.includes(filter)) {
    // Son 3 kart için dinamik buton göster ve default cari hareketler
    showToggleButton.value = true
    currentAltTableType.value = 'cari'
  } else {
    // Diğer durumlar için buton gizle
    showToggleButton.value = false
  }
  
  if (filter === 'borclu-musteriler') {
    // Borçlu müşteriler tablosunu göster
    showBorcluTable.value = true
    showAlacakliTable.value = false
    showBakiyesizHesaplarTable.value = false
    selectedBorcluMusteri.value = null  // Seçimi temizle
    showCariHareketler.value = false    // Cari hareketler tablosunu gizle
    void loadBorcluMusteriler().then(() => {
      // Eğer borçlu müşteri listesi boşsa, akıllı kart seçimi yap
      if (borcluMusteriListesi.value.length === 0) {
        void selectBestCard()
      }
    })
    borcluPagination.value.page = 1
    borcluPagination.value.rowsPerPage = 5
  } else if (filter === 'alacakli-musteriler') {
    // Alacaklı müşteriler tablosunu göster
    showBorcluTable.value = false
    showAlacakliTable.value = true
    showBakiyesizHesaplarTable.value = false
    selectedBorcluMusteri.value = null  // Seçimi temizle
    showCariHareketler.value = false    // Cari hareketler tablosunu gizle
    void loadAlacakliMusteriler().then(() => {
      // Eğer alacaklı müşteri listesi boşsa, akıllı kart seçimi yap
      if (alacakliMusteriListesi.value.length === 0) {
        void selectBestCard()
      }
    })
    // 🔥 Pagination'ı sıfırla - ilk sayfadan başla
    alacakliPagination.value.page = 1
    alacakliPagination.value.rowsPerPage = 5
  } else if (filter === 'bakiyesiz-hesaplar') {
    // 🔥 Bakiyesiz hesaplar tablosunu göster
    currentFilter.value = 'bakiyesiz-hesaplar'
    showBorcluTable.value = false
    showAlacakliTable.value = false
    showBakiyesizHesaplarTable.value = true
    selectedBorcluMusteri.value = null  // Seçimi temizle
    showCariHareketler.value = false    // Cari hareketler tablosunu gizle
    
    // Bakiyesiz hesapları yükle ve hata durumunda bile tabloyu göster
    try {
      // Tablo key'ini güncelle
      bakiyesizHesaplarKey.value = `bakiyesiz-${Date.now()}`
      
      await loadBakiyesizHesaplar()
    } catch (error) {
      console.error('Bakiyesiz hesaplar yüklenirken hata:', error)
      // Hata durumunda bile tabloyu göster, selectBestCard çağırma
    }
    
    // 🔥 Pagination'ı sıfırla - ilk sayfadan başla
    bakiyesizHesaplarPagination.value.page = 1
    bakiyesizHesaplarPagination.value.rowsPerPage = 10
    
    // Session storage'a kaydet
    sessionStorage.setItem('kartliIslemLastCard', 'bakiyesiz-hesaplar')
  } else if (filter === 'cikis-yapanlar') {
    // Çıkış yapanlar listesini göster
    showBorcluTable.value = false
    showAlacakliTable.value = false
    showBakiyesizHesaplarTable.value = false
    void loadCikisYapanlarListesi()
  } else {
    // Normal müşteri tablosunu göster
    showBorcluTable.value = false
    showAlacakliTable.value = false
    showBakiyesizHesaplarTable.value = false
    
    // 🔥 İlk 6 kart için pagination'ı önce sıfırla
    console.log('🔥 İlk 6 kart pagination sıfırlanıyor:', {
      before: { page: pagination.value.page, rowsPerPage: pagination.value.rowsPerPage },
      filter: filter
    })
    
    pagination.value.page = 1
    pagination.value.rowsPerPage = 10
    
    console.log('🔥 İlk 6 kart pagination sıfırlandı:', {
      after: { page: pagination.value.page, rowsPerPage: pagination.value.rowsPerPage }
    })
    
    // Pagination değişikliğinin DOM'a yansıması için nextTick kullan
    await nextTick()
    
    void refreshData()
  }
  selectedNormalMusteri.value = null;
  window.kartliIslemSelectedNormalMusteri = null;
  selectedCustomer.value = null;
  window.dispatchEvent(new Event('ekHizmetlerMusteriChanged'));
}

// 🔥 FİLTRE TEMİZLEME FONKSİYONU
function clearFilters() {
  // Her iki combobox'ı da TÜMÜ yap
  selectedTip.value = 'TÜMÜ'
  selectedOdaTip.value = 'TÜMÜ'
  
  // Dinamik listeleri paralel yükle
  void Promise.all([
    loadDinamikKonaklamaTipleri(),
    loadDinamikOdaTipleri()
  ])
  
  // Seçili kartın verilerini yenile
  if (currentFilter.value) {
    void loadSelectedCardData(currentFilter.value)
  }
  
  selectedNormalMusteri.value = null
  window.kartliIslemSelectedNormalMusteri = null
  selectedCustomer.value = null;
  window.dispatchEvent(new Event('ekHizmetlerMusteriChanged'));
}

//  KOORDİNELİ ÇALIŞMA EVENT HANDLER'LARI
async function onKonaklamaTipiChange(newValue: string) {
  // Eğer oda tipi zaten TÜMÜ dışında bir seçim yapılmışsa, oda tipi listesini değiştirme
  if (selectedOdaTip.value !== 'TÜMÜ' && selectedOdaTip.value !== undefined) {
    void refreshData()
    return
  }
  
  if (newValue === 'TÜMÜ') {
    // TÜMÜ seçildiğinde tüm oda tiplerini göster
    filteredOdaTipleri.value = [...tumOdaTipleri.value]
    console.log('Konaklama tipi TÜMÜ - Tüm oda tipleri gösteriliyor')
      } else {
      // Belirli bir konaklama tipi seçildiğinde, o konaklama tipine uygun oda tiplerini getir
      try {
        const response = await api.get(`/dashboard/oda-tipleri-by-konaklama?konaklamaTip=${encodeURIComponent(newValue)}&kartTip=${currentFilter.value}`)
        if (response.data.success) {
          filteredOdaTipleri.value = response.data.data
          console.log('Konaklama tipi filtrelendi - Oda tipleri:', response.data.data)
        } else {
          filteredOdaTipleri.value = [...tumOdaTipleri.value]
        }
      } catch (error) {
        console.error('Oda tipleri alınırken hata:', error)
        filteredOdaTipleri.value = [...tumOdaTipleri.value]
      }
    }
  
  // Verileri yenile
  void refreshData()
}

async function onOdaTipiChange(newValue: string) {
  // Eğer konaklama tipi zaten TÜMÜ dışında bir seçim yapılmışsa, konaklama tipi listesini değiştirme
  if (selectedTip.value !== 'TÜMÜ' && selectedTip.value !== undefined) {
    // Sadece seçili kartın verilerini yenile (refreshData çağırma, dinamik listeleri sıfırlar)
    if (currentFilter.value) {
      void loadSelectedCardData(currentFilter.value)
    }
    return
  }
  
  if (newValue === 'TÜMÜ') {
    // TÜMÜ seçildiğinde tüm konaklama tiplerini göster
    filteredKonaklamaTipleri.value = [...tumKonaklamaTipleri.value]
    console.log('Oda tipi TÜMÜ - Tüm konaklama tipleri gösteriliyor')
      } else {
      // Belirli bir oda tipi seçildiğinde, o oda tipine uygun konaklama tiplerini getir
      try {
        const response = await api.get(`/dashboard/konaklama-tipleri-by-oda?odaTip=${encodeURIComponent(newValue)}&kartTip=${currentFilter.value}`)
        if (response.data.success) {
          filteredKonaklamaTipleri.value = response.data.data
        } else {
          filteredKonaklamaTipleri.value = [...tumKonaklamaTipleri.value]
        }
      } catch (error) {
        console.error('Konaklama tipleri alınırken hata:', error)
        filteredKonaklamaTipleri.value = [...tumKonaklamaTipleri.value]
      }
    }
  
  // Sadece seçili kartın verilerini yenile (refreshData çağırma, dinamik listeleri sıfırlar)
  if (currentFilter.value) {
    void loadSelectedCardData(currentFilter.value)
  }
}



// Normal müşteri satırına gecikmeli tek tıklama - konaklama geçmişi göster
function onNormalMusteriClick(evt: Event, row: MusteriKonaklama) {
  selectedNormalMusteri.value = row;
  window.kartliIslemSelectedNormalMusteri = {
    ...row,
    OdaYatak: (row.KnklmOdaNo && row.KnklmYtkNo) ? `${row.KnklmOdaNo}-${row.KnklmYtkNo}` : '',
    KonaklamaTipi: row.KnklmTip
  };
  
  // 🔥 Seçili müşteri bilgilerini localStorage'a kaydet (musteri-islem sayfası için)
  const musteriDataForIslem = {
    ...row,
    OdaYatak: (row.KnklmOdaNo && row.KnklmYtkNo) ? `${row.KnklmOdaNo}-${row.KnklmYtkNo}` : '',
    KonaklamaTipi: row.KnklmTip,
    currentFilter: currentFilter.value,
    musteriDurumu: 'KALIYOR' // Güncelleme modu için
  };
  
  console.log('🔥 MstrHspTip değeri:', musteriDataForIslem.MstrHspTip);
  localStorage.setItem('selectedMusteriForIslem', JSON.stringify(musteriDataForIslem));
  sessionStorage.setItem('prevPage', 'kartli-islem');
  if (row?.MstrTCN) sessionStorage.setItem('autoFillTCKimlik', row.MstrTCN);
  
  
  selectedCustomer.value = {
    id: row.MstrTCN,
    name: row.MstrAdi,
    ...row,
    OdaYatak: (row.KnklmOdaNo && row.KnklmYtkNo) ? `${row.KnklmOdaNo}-${row.KnklmYtkNo}` : '',
    KonaklamaTipi: row.KnklmTip
  };
  window.dispatchEvent(new Event('ekHizmetlerMusteriChanged'));
  // 🔥 Önceki timeout'u temizle
  if (normalMusteriClickTimeout.value) {
    clearTimeout(normalMusteriClickTimeout.value)
  }
  
  // 🔥 300ms gecikme ile tek tıklama işlemini başlat
  normalMusteriClickTimeout.value = window.setTimeout(() => {
    selectedNormalMusteri.value = row;
    
    // 🔥 ÖNEMLİ: Sadece konaklama geçmişini göster, cari hareketleri gizle
    showKonaklamaGecmisi.value = true;
    showCariHareketler.value = false;
    currentAltTableType.value = 'konaklama';
    
    void loadKonaklamaGecmisi(row.MstrTCN);
    
    // 🔥 Seçilen müşteri bakiyesini hesapla
    void hesaplaMusteriBakiye(row);
    
    // 🔥 Firma filtresi aktifse sadece o müşterinin verilerini yükle, filtreyi kapatma
    if (firmaFiltresiAktif.value && selectedFirmaAdi.value) {
      // Firma filtresi aktifken bireysel müşteri seçimi - sadece o müşterinin konaklama geçmişini göster
      // Firma filtresi açık kalacak, sadece seçilen müşterinin verileri gösterilecek
    } else {
      // Normal durum - firma filtresini sıfırla
      firmaFiltresiAktif.value = false;
    }
    
    // 🔥 Kurumsal müşteri ise firma bakiyesini de hesapla ve firma adını güncelle
    if (row.MstrHspTip === 'Kurumsal') {
      void hesaplaFirmaBakiye(row);
      selectedFirmaAdi.value = row.MstrFirma || '';
    } else {
      // Bireysel müşteri seçildiğinde firma bilgilerini temizle (sadece firma filtresi aktif değilse)
      if (!firmaFiltresiAktif.value) {
        selectedFirmaBakiye.value = 0;
        selectedFirmaAdi.value = '';
      }
    }
    
    normalMusteriClickTimeout.value = null
  }, 300)
}

// Müşterinin konaklama geçmişini yükle
async function loadKonaklamaGecmisi(tcKimlik: string) {
  konaklamaGecmisiLoading.value = true;
  
  // 🔥 ÖNEMLİ: Önceki müşterinin konaklama geçmişini temizle
  konaklamaGecmisiListesi.value = []
  
  // 🔥 Pagination'ı sıfırla
  konaklamaGecmisiPagination.value.page = 1
  
  // 🔥 Key'i sadece farklı müşteri seçildiğinde güncelle
  const newKey = `konaklama-${tcKimlik}`
  if (konaklamaGecmisiKey.value !== newKey) {
    konaklamaGecmisiKey.value = newKey
  }
  
  try {
    const response = await api.get(`/dashboard/musteri-konaklama-gecmisi/${tcKimlik}`);
    if (response.data.success) {
      konaklamaGecmisiListesi.value = response.data.data;
      console.log(`${tcKimlik} için ${response.data.data.length} konaklama geçmişi kaydı yüklendi`);
      
      // 🔥 Tablo yüklendikten sonra scroll pozisyonunu sıfırla
      await nextTick()
      if (konaklamaGecmisiTableRef.value) {
        const tableElement = konaklamaGecmisiTableRef.value.$el
        if (tableElement) {
          tableElement.scrollTop = 0
        }
      }
    } else {
      console.log(`${tcKimlik} için konaklama geçmişi bulunamadı`);
    }
  } catch (error) {
    console.error('Konaklama geçmişi yüklenemedi:', error);
    // Hata durumunda da listeyi temizle
    konaklamaGecmisiListesi.value = []
  } finally {
    konaklamaGecmisiLoading.value = false;
  }
}

// Konaklama detay dialog'unu göster - artık kullanılmıyor (tooltip ile değiştirildi)
// function showKonaklamaDetay(row: KonaklamaGecmisi) {
//   selectedKonaklamaDetay.value = row;
//   showKonaklamaDetayDialog.value = true;
// }

// Dialog sürükleme fonksiyonları
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



// 🔥 AKILLI KART SEÇİM FONKSİYONU (asenkron)
async function selectBestCard() {
  // 🔥 ÖNCELİK SIRASI: Süresi dolan kartlar her zaman öncelikli!
  
  // 1. Önce süresi dolan kartlarını kontrol et
  const suresiDolanList = await loadMusteriListesiReturn('suresi-dolan');
  const suresiDolanSayisi = suresiDolanList ? suresiDolanList.length : 0;
  
  // Süresi dolan kart sayısı > 0 ise daima bu kart seçilir
  if (suresiDolanSayisi > 0) {
    void loadFilteredData('suresi-dolan');
    return;
  }
  
  // 2. Süresi dolan kart yoksa (stats verisi 0 ise) devam eden kartını seç
  const devamEdenList = await loadMusteriListesiReturn('toplam-aktif');
  const devamEdenSayisi = devamEdenList ? devamEdenList.length : 0;
  
  if (devamEdenSayisi > 0) {
    void loadFilteredData('toplam-aktif');
    return;
  }
  
  // 3. Diğer kartları kontrol et (devam eden kartı zaten kontrol ettik)
  const cardTypes = [
    'alacakli-musteriler',
    'borclu-musteriler', 
    'yeni-musteri',
    'yeni-giris',
    'bugun-cikan',
    'cikis-yapanlar'
  ];

  let bestCard = null;
  let maxCount = 0;

  for (const cardType of cardTypes) {
    let list = [];
    if (cardType === 'borclu-musteriler') {
      list = await loadBorcluMusterilerReturn();
    } else if (cardType === 'alacakli-musteriler') {
      list = await loadAlacakliMusterilerReturn();
    } else if (cardType === 'cikis-yapanlar') {
      list = await loadCikisYapanlarListesiReturn();
    } else {
      list = await loadMusteriListesiReturn(cardType);
    }
    
    if (list && list.length > maxCount) {
      maxCount = list.length;
      bestCard = cardType;
    }
  }

  if (bestCard) {
    currentFilter.value = bestCard;
    sessionStorage.setItem('kartliIslemLastCard', bestCard);
    void loadSelectedCardData(bestCard);
  }
}

// Her API için "return" eden versiyonunu yazın:
async function loadBorcluMusterilerReturn() {
  const response = await api.get('/dashboard/borclu-musteriler');
  return response.data.success ? response.data.data : [];
}
async function loadAlacakliMusterilerReturn() {
  const response = await api.get('/dashboard/alacakli-musteriler?page=1&limit=1000');
  return response.data.success ? response.data.data : [];
}
async function loadCikisYapanlarListesiReturn() {
  const response = await api.get('/dashboard/cikis-yapanlar?tip=TÜMÜ');
  return response.data.success ? response.data.data : [];
}
async function loadMusteriListesiReturn(cardType: string) {
  const endpoint = cardType === 'yeni-musteri' ? 'yeni-musteri'
    : cardType === 'yeni-giris' ? 'yeni-giris'
    : cardType;
  const response = await api.get(`/dashboard/${endpoint}?tip=TÜMÜ&odaTip=TÜMÜ`);
  return response.data.success ? response.data.data : [];
}

// 🔥 SEÇİLEN KARTIN VERİLERİNİ YÜKLEME FONKSİYONU
async function loadSelectedCardData(cardType: string) {
  console.log(`Seçilen kart verileri yükleniyor: ${cardType}`)
  
  // 🔥 Global değişkeni güncelle (MainLayout için)
  ;(window as { kartliIslemCurrentFilter?: string }).kartliIslemCurrentFilter = cardType
  
  // 🔥 PERFORMANS İYİLEŞTİRMESİ: Dinamik listeleri paralel yükle
  await Promise.all([
    loadDinamikKonaklamaTipleri(),
    loadDinamikOdaTipleri()
  ])
  
  if (cardType === 'borclu-musteriler') {
    // Borçlu müşteriler tablosunu göster
    console.log('Borçlu müşteriler tablosu gösteriliyor')
    showBorcluTable.value = true
    showAlacakliTable.value = false
    showBakiyesizHesaplarTable.value = false
    selectedBorcluMusteri.value = null
    showCariHareketler.value = false
    void loadBorcluMusteriler()
    // 🔥 Pagination'ı sıfırla - ilk sayfadan başla
    borcluPagination.value.page = 1
    borcluPagination.value.rowsPerPage = 5
  } else if (cardType === 'alacakli-musteriler') {
    // Alacaklı müşteriler tablosunu göster
    console.log('Alacaklı müşteriler tablosu gösteriliyor')
    showBorcluTable.value = false
    showAlacakliTable.value = true
    showBakiyesizHesaplarTable.value = false
    selectedBorcluMusteri.value = null
    showCariHareketler.value = false
    void loadAlacakliMusteriler()
    // 🔥 Pagination'ı sıfırla - ilk sayfadan başla
    alacakliPagination.value.page = 1
    alacakliPagination.value.rowsPerPage = 5
  } else if (cardType === 'bakiyesiz-hesaplar') {
    // 🔥 Bakiyesiz hesaplar tablosunu göster
    showBorcluTable.value = false
    showAlacakliTable.value = false
    showBakiyesizHesaplarTable.value = true
    selectedBorcluMusteri.value = null
    showCariHareketler.value = false
    void loadBakiyesizHesaplar()
    // 🔥 Pagination'ı sıfırla - ilk sayfadan başla
    bakiyesizHesaplarPagination.value.page = 1
    bakiyesizHesaplarPagination.value.rowsPerPage = 10
  } else if (cardType === 'cikis-yapanlar') {
    // Çıkış yapanlar listesini göster
    console.log('Çıkış yapanlar listesi gösteriliyor')
    showBorcluTable.value = false
    showAlacakliTable.value = false
    showBakiyesizHesaplarTable.value = false
    void loadCikisYapanlarListesi()
    // 🔥 Pagination'ı sıfırla - ilk sayfadan başla
    pagination.value.page = 1
    pagination.value.rowsPerPage = 10
  } else {
    // Normal müşteri tablosunu göster
    console.log('Normal müşteri tablosu gösteriliyor')
    showBorcluTable.value = false
    showAlacakliTable.value = false
    showBakiyesizHesaplarTable.value = false
    
    // 🔥 İlk 6 kart için pagination'ı önce sıfırla
    pagination.value.page = 1
    pagination.value.rowsPerPage = 10
    
    // Pagination değişikliğinin DOM'a yansıması için nextTick kullan
    await nextTick()
    
    void loadMusteriListesi()
    // Eğer global arama aktifse (≥3 karakter), arama sonuçlarını (kart bağımsız) yansıt
    if (searchText.value && searchText.value.trim().length >= 3) {
      void performSearch(searchText.value)
    }
  }
}

// Lifecycle
onMounted(() => {
  // 🔥 Global değişkeni başlangıçta ayarla (MainLayout için)
  ;(window as { kartliIslemCurrentFilter?: string | null }).kartliIslemCurrentFilter = null
  
  // 🔥 URL'den autoOpenModal parametresini kontrol et
  const urlParams = new URLSearchParams(window.location.search);
  const shouldAutoOpenModal = urlParams.get('autoOpenModal') === 'true';
  
  // 🔥 EĞER MUSTERI-ISLEM SAYFASINDAN GELİNİYORSA, SEÇİLİ MÜŞTERİYİ AYARLA
  if (window.kartliIslemSelectedNormalMusteri && shouldAutoOpenModal) {
    console.log('🔥 kartli-islem sayfası yüklendi, seçili müşteri bulundu:', window.kartliIslemSelectedNormalMusteri)
    console.log('🔥 Otomatik modal açma aktif - musteri-islem sayfasından gelindi')
    
    // Yeni kayıt edilen müşteri bilgilerini al
    const newCustomer = window.kartliIslemSelectedNormalMusteri as { MstrTCN: string; MstrAdi: string; MstrTelNo: string; MstrDurum?: string; customerNote?: string };
    
    // 🔥 MÜŞTERİ NOTUNA GÖRE HANGİ KARTIN SEÇİLECEĞİNİ BELİRLE
    let targetCard = 'toplam-aktif'; // Varsayılan
    
    if (newCustomer.customerNote?.includes('Yeni Müşteri:')) {
      // Eğer müşteri "Yeni Müşteri: " notu ile kaydedildiyse, "Yeni Müşteri" kartını seç
      targetCard = 'yeni-musteri';
    } else if (newCustomer.customerNote?.includes('Yeni Giriş:')) {
      // Eğer müşteri "Yeni Giriş: " notu ile kaydedildiyse, "Yeni Giriş" kartını seç
      targetCard = 'yeni-giris';
    } else if (newCustomer.MstrDurum === 'AYRILDI') {
      // Eğer müşteri ayrıldıysa, "Çıkış Yapanlar" kartını seç
      targetCard = 'cikis-yapanlar';
    }
    
    console.log('🎯 Hedef kart belirlendi:', targetCard, 'Müşteri durumu:', newCustomer.MstrDurum);
    
    // Hedef kartı seç ve verileri yükle
    void loadFilteredData(targetCard).then(async () => {
      // Veriler yüklendikten sonra yeni müşteriyi bul ve seç
      await findAndSelectNewCustomer(newCustomer);
    });
  } else {
    // 🔥 NORMAL SAYFA GİRİŞİ - Varsayılan davranış
    console.log('🔥 Normal sayfa girişi - otomatik modal açma devre dışı')
    
    // Eğer musteri-islem sayfasından gelindi ama manuel geçiş ise, global state'i temizle
    if (window.kartliIslemSelectedNormalMusteri && !shouldAutoOpenModal) {
      console.log('🔥 Manuel geçiş tespit edildi, global state temizleniyor')
      window.kartliIslemSelectedNormalMusteri = null;
    }
    
    void (async () => {
      await refreshData();
      await selectBestCard();
    })();

    // 🔥 OTOMATİK STATS GÜNCELLEME EVENT LISTENER'LARINI KUR
    setupDataChangeListeners();
    
    // 🔥 PERİYODİK STATS GÜNCELLEME DEVRE DIŞI
    // startPeriodicStatsRefresh();

    // Tahsilat sonrası bakiye güncelleme event listener
    window.addEventListener('refreshSelectedMusteriBakiye', (e) => {
      const customEvent = e as CustomEvent;
      const musteri = customEvent.detail || selectedNormalMusteri.value;
      console.log('EVENT YAKALANDI', musteri);
      if (musteri) {
        void hesaplaMusteriBakiye(musteri);
      }
    });
  }
  
  const ekHizmetHandler = () => { showEkHizmetlerModal.value = true; };
  const odemeHandler = () => { 
    console.log('🔥 showOdemeIslemModal event received, opening modal...')
    const globalMusteri = window.kartliIslemSelectedNormalMusteri as MusteriKonaklama | null | undefined
    if (!globalMusteri || typeof globalMusteri !== 'object') {
      console.warn('❌ Global müşteri bilgisi bulunamadı, modal açılışı iptal edildi')
      return
    }
    // Global state'i selected'e aktar
    selectedNormalMusteri.value = globalMusteri
    console.log('🔥 selectedNormalMusteri set:', selectedNormalMusteri.value?.MstrAdi)
    // Reactive güncelleme için kısa bekleme, sonra modal aç
      setTimeout(() => {
      if (!selectedNormalMusteri.value) {
        console.warn('❌ Modal açılışı sırasında müşteri kayboldu, açılmayacak')
        return
      }
      showOdemeIslemModal.value = true
    }, 300)
  };
  window.addEventListener('showEkHizmetlerModal', ekHizmetHandler);
  window.addEventListener('showOdemeIslemModal', odemeHandler);
  onBeforeUnmount(() => {
    window.removeEventListener('showEkHizmetlerModal', ekHizmetHandler);
    window.removeEventListener('showOdemeIslemModal', odemeHandler);
    
    // 🔥 OTOMATİK STATS GÜNCELLEME EVENT LISTENER'LARINI TEMİZLE
    cleanupDataChangeListeners();
    
    // 🔥 PERİYODİK STATS GÜNCELLEME DEVRE DIŞI
    // stopPeriodicStatsRefresh();
  });
})

// 🔥 FİRMA FİLTRESİ DEĞİŞİKLİK FONKSİYONU
function onFirmaFiltresiChange(newValue: boolean) {
  console.log('Firma filtresi değişti:', newValue, 'Firma adı:', selectedFirmaAdi.value);

  if (newValue && selectedFirmaAdi.value) {
    // Önce firma geneli verilerini yükle
    void loadFirmaGenelVerileri().then(() => {
      // Sonra mevcut seçimleri temizle (ama firma bilgilerini koru)
      selectedNormalMusteri.value = null;
      selectedBorcluMusteri.value = null;
      selectedMusteriBakiye.value = 0;
      selectedMusteriDepozito.value = 0;
      (window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye = 0;
    });
  } else {
    // Filtre kapandığında tümünü temizle
    selectedNormalMusteri.value = null;
    selectedBorcluMusteri.value = null;
    showKonaklamaGecmisi.value = false;
    showCariHareketler.value = false;
    selectedMusteriBakiye.value = 0;
    selectedMusteriDepozito.value = 0;
    selectedFirmaBakiye.value = 0;
    (window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye = 0;
    selectedFirmaAdi.value = '';
  }
}

// 🔥 FİRMA GENELİ VERİLERİNİ YÜKLEME FONKSİYONU
async function loadFirmaGenelVerileri() {
  if (!selectedFirmaAdi.value) return;
  
  try {
    console.log('Firma geneli veriler yükleniyor:', selectedFirmaAdi.value, 'Borçlu tablo:', showBorcluTable.value);
    
    if (showBorcluTable.value) {
      // Borçlu müşteriler kartında - firma geneli cari hareketleri yükle
      await loadFirmaGenelCariHareketler(selectedFirmaAdi.value);
      showCariHareketler.value = true;
      showKonaklamaGecmisi.value = false;
    } else {
      // Normal müşteri kartlarında - firma geneli konaklama geçmişi yükle
      await loadFirmaGenelKonaklamaGecmisi(selectedFirmaAdi.value);
      showKonaklamaGecmisi.value = true;
      showCariHareketler.value = false;
    }
    
    console.log('Firma geneli veriler yüklendi. Konaklama:', showKonaklamaGecmisi.value, 'Cari:', showCariHareketler.value);
  } catch (error) {
    console.error('Firma genel verileri yüklenirken hata:', error);
  }
}

// 🔥 FİRMA GENELİ KONAKLAMA GEÇMİŞİ YÜKLEME FONKSİYONU
async function loadFirmaGenelKonaklamaGecmisi(firmaAdi: string) {
  konaklamaGecmisiLoading.value = true;
  
  // 🔥 ÖNEMLİ: Önceki firma konaklama geçmişini temizle
  konaklamaGecmisiListesi.value = []
  
  // �� Pagination'ı sıfırla
  konaklamaGecmisiPagination.value.page = 1
  
  try {
    const response = await api.get(`/dashboard/firma-konaklama-gecmisi/${encodeURIComponent(firmaAdi)}`);
    if (response.data.success) {
      konaklamaGecmisiListesi.value = response.data.data;
      console.log(`Firma ${firmaAdi} konaklama geçmişi: ${response.data.data.length} kayıt yüklendi`);
      
      // 🔥 Tablo yüklendikten sonra scroll pozisyonunu sıfırla
      await nextTick()
      if (konaklamaGecmisiTableRef.value) {
        const tableElement = konaklamaGecmisiTableRef.value.$el
        if (tableElement) {
          tableElement.scrollTop = 0
        }
      }
    } else {
      console.log(`Firma ${firmaAdi} için konaklama geçmişi bulunamadı`);
    }
  } catch (error) {
    console.error('Firma genel konaklama geçmişi yüklenemedi:', error);
    // Hata durumunda da listeyi temizle
    konaklamaGecmisiListesi.value = []
  } finally {
    konaklamaGecmisiLoading.value = false;
  }
}

// 🔥 FİRMA GENELİ CARİ HAREKETLER YÜKLEME FONKSİYONU
async function loadFirmaGenelCariHareketler(firmaAdi: string) {
  cariHareketlerLoading.value = true;
  
  // 🔥 ÖNEMLİ: Önceki firma cari hareketlerini temizle
  cariHareketlerListesi.value = []
  filteredCariHareketlerListesi.value = []
  
  // 🔥 Pagination'ı sıfırla
  cariHareketlerPagination.value.page = 1
  
  try {
    const response = await api.get(`/dashboard/firma-cari-hareketler/${encodeURIComponent(firmaAdi)}`);
    if (response.data.success) {
      cariHareketlerListesi.value = response.data.data;
      console.log(`Firma ${firmaAdi} cari hareketler: ${response.data.data.length} kayıt yüklendi`);
      
      // 🔥 Tablo yüklendikten sonra scroll pozisyonunu sıfırla
      await nextTick()
      if (cariHareketlerTableRef.value) {
        const tableElement = cariHareketlerTableRef.value.$el
        if (tableElement) {
          tableElement.scrollTop = 0
        }
      }
    } else {
      console.log(`Firma ${firmaAdi} için cari hareket bulunamadı`);
    }
  } catch (error) {
    console.error('Firma genel cari hareketler yüklenemedi:', error);
    // Hata durumunda da listeleri temizle
    cariHareketlerListesi.value = []
    filteredCariHareketlerListesi.value = []
  } finally {
    cariHareketlerLoading.value = false;
  }
}

// 🚨 KARA LİSTE UYARI FONKSİYONU
function showKaraListeUyarisi(musteri: MusteriKonaklama | KonaklamaGecmisi) {
  console.log('🚨 Kara liste uyarısı gösteriliyor:', musteri)
  selectedKaraListeMusteri.value = musteri
  showKaraListeDialog.value = true
}

// 📊 RAPOR İNDİRME FONKSİYONLARI
async function downloadKonaklamaGecmisiPDF() {
  try {
    pdfLoading.value = true
    
    const params = [];
    if (firmaFiltresiAktif.value && selectedFirmaAdi.value) {
      params.push(`firmaAdi=${encodeURIComponent(selectedFirmaAdi.value)}`);
    } else if (selectedNormalMusteri.value?.MstrTCN) {
      params.push(`tcNo=${encodeURIComponent(selectedNormalMusteri.value.MstrTCN)}`);
    } else {
      throw new Error('Rapor için gerekli bilgiler bulunamadı');
    }
    const queryString = params.join('&');
    const url = `/musteri/konaklama-gecmisi-pdf?${queryString}`;
    
    // PDF dosyasını indir
    const response = await api.get(url, {
      responseType: 'blob'
    })
    
    // Dosyayı indir
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    
    // Dosya adını belirle
    let fileName = 'konaklama-gecmisi'
    if (firmaFiltresiAktif.value && selectedFirmaAdi.value) {
      fileName = `${selectedFirmaAdi.value}-firma-konaklama-gecmisi`
    } else if (selectedNormalMusteri.value?.MstrAdi) {
      fileName = `${selectedNormalMusteri.value.MstrAdi}-konaklama-gecmisi`
    }
    fileName += `-${new Date().toISOString().split('T')[0]}.pdf`
    
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
    
    console.log('PDF raporu başarıyla indirildi')
  } catch (error: unknown) {
    console.error('PDF raporu indirme hatası:', error)
    
    let errorMessage = 'Bilinmeyen hata';
    
    // Type-safe error handling
    if (error && typeof error === 'object' && 'message' in error) {
      const errorObj = error as { 
        message: string; 
        response?: { 
          status: number; 
          statusText: string; 
          data?: { message?: string }; 
        }; 
        config?: unknown; 
      };
      
      if (errorObj.response?.data?.message) {
        errorMessage = errorObj.response.data.message;
      } else if (errorObj.response?.status) {
        errorMessage = `HTTP Error ${errorObj.response.status}: ${errorObj.response.statusText}`;
      } else if (errorObj.message) {
        errorMessage = errorObj.message;
      }
      
      // Console'a detaylı hata bilgisi
      console.error('PDF Error Details:', {
        message: errorObj.message,
        status: errorObj.response?.status,
        data: errorObj.response?.data,
        config: errorObj.config
      });
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Detaylı hata mesajını göster
    alert(`PDF raporu indirilemedi: ${errorMessage}`);
  } finally {
    pdfLoading.value = false
  }
}

async function downloadKonaklamaGecmisiExcel() {
  try {
    excelLoading.value = true
    
    const params = [];
    if (firmaFiltresiAktif.value && selectedFirmaAdi.value) {
      params.push(`firmaAdi=${encodeURIComponent(selectedFirmaAdi.value)}`);
    } else if (selectedNormalMusteri.value?.MstrTCN) {
      params.push(`tcNo=${encodeURIComponent(selectedNormalMusteri.value.MstrTCN)}`);
    } else {
      throw new Error('Rapor için gerekli bilgiler bulunamadı');
    }
    const queryString = params.join('&');
    const url = `/musteri/konaklama-gecmisi-excel?${queryString}`;
    
    // Excel dosyasını indir
    const response = await api.get(url, {
      responseType: 'blob'
    })
    
    // Dosyayı indir
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    
    // Dosya adını belirle
    let fileName = 'konaklama-gecmisi'
    if (firmaFiltresiAktif.value && selectedFirmaAdi.value) {
      fileName = `${selectedFirmaAdi.value}-firma-konaklama-gecmisi`
    } else if (selectedNormalMusteri.value?.MstrAdi) {
      fileName = `${selectedNormalMusteri.value.MstrAdi}-konaklama-gecmisi`
    }
    fileName += `-${new Date().toISOString().split('T')[0]}.xlsx`
    
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
    
    console.log('Excel raporu başarıyla indirildi')
  } catch (error: unknown) {
    console.error('Excel raporu indirme hatası:', error)
    
    let errorMessage = 'Bilinmeyen hata';
    
    // Type-safe error handling
    if (error && typeof error === 'object' && 'message' in error) {
      const errorObj = error as { 
        message: string; 
        response?: { 
          status: number; 
          statusText: string; 
          data?: { message?: string }; 
        }; 
      };
      
      if (errorObj.response?.data?.message) {
        errorMessage = errorObj.response.data.message;
      } else if (errorObj.response?.status) {
        errorMessage = `HTTP Error ${errorObj.response.status}: ${errorObj.response.statusText}`;
      } else if (errorObj.message) {
        errorMessage = errorObj.message;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    alert(`Excel raporu indirilemedi: ${errorMessage}`);
  } finally {
    excelLoading.value = false
  }
}

async function downloadCariHareketlerPDF() {
  try {
    cariPdfLoading.value = true
    const params = [];
    if (firmaFiltresiAktif.value && selectedFirmaAdi.value) {
      params.push(`firmaAdi=${encodeURIComponent(selectedFirmaAdi.value)}`);
    } else if (selectedBorcluMusteri.value?.CariVTCN) {
      params.push(`tcNo=${encodeURIComponent(selectedBorcluMusteri.value.CariVTCN)}`);
    } else {
      throw new Error('Rapor için gerekli bilgiler bulunamadı');
    }
    const queryString = params.join('&');
    const url = `/dashboard/cari-hareketler-pdf?${queryString}`;
    console.log('PDF için gönderilen cariKod:', selectedBorcluMusteri.value?.CariKod);
    // Axios ile indir (authentication için)
    const response = await api.get(url, {
      responseType: 'blob'
    })
    
    // Dosyayı indir
    const blob = new Blob([response.data], { 
      type: 'application/pdf' 
    })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    // Dosya adını belirle
    let fileName = 'cari-hareketler'
    if (selectedBorcluMusteri.value?.CariAdi) {
      fileName = `${selectedBorcluMusteri.value.CariAdi}-cari-hareketler`
    } else if (selectedBorcluMusteri.value?.CariVTCN) {
      fileName = `${selectedBorcluMusteri.value.CariVTCN}-cari-hareketler`
    }
    fileName += `-${new Date().toISOString().split('T')[0]}.pdf`
    
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
    
    console.log('Cari hareketler PDF raporu başarıyla indirildi')
  } catch (error: unknown) {
    console.error('Cari hareketler PDF raporu indirme hatası:', error)
    
    let errorMessage = 'Bilinmeyen hata';
    
    // Type-safe error handling
    if (error && typeof error === 'object' && 'message' in error) {
      const errorObj = error as { 
        message: string; 
        response?: { 
          status: number; 
          statusText: string; 
          data?: { message?: string }; 
        }; 
      };
      
      if (errorObj.response?.data?.message) {
        errorMessage = errorObj.response.data.message;
      } else if (errorObj.response?.status) {
        errorMessage = `HTTP Error ${errorObj.response.status}: ${errorObj.response.statusText}`;
      } else if (errorObj.message) {
        errorMessage = errorObj.message;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    alert(`Cari hareketler PDF raporu indirilemedi: ${errorMessage}`);
  } finally {
    cariPdfLoading.value = false
  }
}

async function downloadCariHareketlerExcel() {
  try {
    cariExcelLoading.value = true
    const params = [];
    if (firmaFiltresiAktif.value && selectedFirmaAdi.value) {
      params.push(`firmaAdi=${encodeURIComponent(selectedFirmaAdi.value)}`);
    } else if (selectedBorcluMusteri.value?.CariVTCN) {
      params.push(`tcNo=${encodeURIComponent(selectedBorcluMusteri.value.CariVTCN)}`);
    } else {
      throw new Error('Rapor için gerekli bilgiler bulunamadı');
    }
    const queryString = params.join('&');
    const url = `/dashboard/cari-hareketler-tc-excel?${queryString}`;
    
    // Axios ile indir (authentication için)
    const response = await api.get(url, {
      responseType: 'blob'
    })
    
    // Dosyayı indir
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    // Dosya adını belirle
    let fileName = 'cari-hareketler'
    if (selectedBorcluMusteri.value?.CariAdi) {
      fileName = `${selectedBorcluMusteri.value.CariAdi}-cari-hareketler`
    } else if (selectedBorcluMusteri.value?.CariVTCN) {
      fileName = `${selectedBorcluMusteri.value.CariVTCN}-cari-hareketler`
    }
    fileName += `-${new Date().toISOString().split('T')[0]}.xlsx`
    
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
    
    console.log('Cari hareketler Excel raporu başarıyla indirildi')
  } catch (error: unknown) {
    console.error('Cari hareketler Excel raporu indirme hatası:', error)
    
    let errorMessage = 'Bilinmeyen hata';
    
    // Type-safe error handling
    if (error && typeof error === 'object' && 'message' in error) {
      const errorObj = error as { 
        message: string; 
        response?: { 
          status: number; 
          statusText: string; 
          data?: { message?: string }; 
        }; 
      };
      
      if (errorObj.response?.data?.message) {
        errorMessage = errorObj.response.data.message;
      } else if (errorObj.response?.status) {
        errorMessage = `HTTP Error ${errorObj.response.status}: ${errorObj.response.statusText}`;
      } else if (errorObj.message) {
        errorMessage = errorObj.message;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    alert(`Cari hareketler Excel raporu indirilemedi: ${errorMessage}`);
  } finally {
    cariExcelLoading.value = false
  }
}

// 🔥 DİNAMİK RAPOR İNDİRME FONKSİYONLARI
async function downloadCurrentAltTablePDF() {
  console.log('🔄 downloadCurrentAltTablePDF başladı, currentAltTableType:', currentAltTableType.value)
  
  if (currentAltTableType.value === 'cari') {
    // İlk 6 kart için TC kimlik ile cari hareketler PDF
    if (currentFilter.value && ['normal-musteriler', 'suresi-dolan', 'bugun-cikan', 'yeni-musteri', 'yeni-giris', 'toplam-aktif'].includes(currentFilter.value)) {
      if (selectedNormalMusteri.value) {
        console.log('🔄 İlk 6 kart - Cari Hareketler PDF indiriliyor, TC:', selectedNormalMusteri.value.MstrTCN)
        await downloadCariHareketlerByTCPDF(selectedNormalMusteri.value.MstrTCN)
      } else {
        throw new Error('Rapor için seçili müşteri bulunamadı')
      }
    } else {
      // Son 3 kart için cari kod ile cari hareketler PDF
      console.log('🔄 Son 3 kart - Cari Hareketler PDF indiriliyor')
      await downloadCariHareketlerPDF()
    }
  } else {
    // Konaklama Geçmişi PDF
    if (currentFilter.value && ['normal-musteriler', 'suresi-dolan', 'bugun-cikan', 'yeni-musteri', 'yeni-giris', 'toplam-aktif'].includes(currentFilter.value)) {
      if (selectedNormalMusteri.value) {
        console.log('🔄 İlk 6 kart - Konaklama Geçmişi PDF indiriliyor, TC:', selectedNormalMusteri.value.MstrTCN)
        await downloadKonaklamaGecmisiPDF()
      } else {
        throw new Error('Rapor için seçili müşteri bulunamadı')
      }
    } else {
      // Son 3 kart için TC kimlik ile konaklama geçmişi PDF
      if (selectedBorcluMusteri.value?.CariVTCN) {
        console.log('🔄 Son 3 kart - Konaklama Geçmişi PDF indiriliyor, TC:', selectedBorcluMusteri.value.CariVTCN)
        await downloadKonaklamaGecmisiByTCPDF(selectedBorcluMusteri.value.CariVTCN)
      } else {
        throw new Error('Rapor için TC kimlik bulunamadı')
      }
    }
  }
}

async function downloadCurrentAltTableExcel() {
  console.log('🔄 downloadCurrentAltTableExcel başladı, currentAltTableType:', currentAltTableType.value)
  
  if (currentAltTableType.value === 'cari') {
    // İlk 6 kart için TC kimlik ile cari hareketler Excel
    if (currentFilter.value && ['normal-musteriler', 'suresi-dolan', 'bugun-cikan', 'yeni-musteri', 'yeni-giris', 'toplam-aktif'].includes(currentFilter.value)) {
      if (selectedNormalMusteri.value) {
        console.log('🔄 İlk 6 kart - Cari Hareketler Excel indiriliyor, TC:', selectedNormalMusteri.value.MstrTCN)
        await downloadCariHareketlerByTCExcel(selectedNormalMusteri.value.MstrTCN)
      } else {
        throw new Error('Rapor için seçili müşteri bulunamadı')
      }
    } else {
      // Son 3 kart için cari kod ile cari hareketler Excel
      console.log('🔄 Son 3 kart - Cari Hareketler Excel indiriliyor')
      await downloadCariHareketlerExcel()
    }
  } else {
    // Konaklama Geçmişi Excel
    if (currentFilter.value && ['normal-musteriler', 'suresi-dolan', 'bugun-cikan', 'yeni-musteri', 'yeni-giris', 'toplam-aktif'].includes(currentFilter.value)) {
      if (selectedNormalMusteri.value) {
        console.log('🔄 İlk 6 kart - Konaklama Geçmişi Excel indiriliyor, TC:', selectedNormalMusteri.value.MstrTCN)
        await downloadKonaklamaGecmisiExcel()
      } else {
        throw new Error('Rapor için seçili müşteri bulunamadı')
      }
    } else {
      // Son 3 kart için TC kimlik ile konaklama geçmişi Excel
      if (selectedBorcluMusteri.value?.CariVTCN) {
        console.log('🔄 Son 3 kart - Konaklama Geçmişi Excel indiriliyor, TC:', selectedBorcluMusteri.value.CariVTCN)
        await downloadKonaklamaGecmisiByTCExcel(selectedBorcluMusteri.value.CariVTCN)
      } else {
        throw new Error('Rapor için TC kimlik bulunamadı')
      }
    }
  }
}

// 🔥 TC KİMLİK İLE CİRİ HAREKETLER PDF İNDİRME
async function downloadCariHareketlerByTCPDF(tcKimlik: string) {
  try {
    cariPdfLoading.value = true
    const url = `/dashboard/cari-hareketler-tc-pdf?tcKimlik=${encodeURIComponent(tcKimlik)}`
    console.log('🔄 TC ile Cari Hareketler PDF indiriliyor:', url)
    
    const response = await api.get(url, {
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data], { 
      type: 'application/pdf' 
    })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    
    let fileName = 'cari-hareketler'
    if (selectedNormalMusteri.value?.MstrAdi) {
      fileName = `${selectedNormalMusteri.value.MstrAdi}-cari-hareketler`
    } else if (tcKimlik) {
      fileName = `${tcKimlik}-cari-hareketler`
    }
    fileName += `-${new Date().toISOString().split('T')[0]}.pdf`
    
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
    
    console.log('🔄 TC ile Cari Hareketler PDF başarıyla indirildi')
  } catch (error: unknown) {
    console.error('🔄 TC ile Cari Hareketler PDF indirme hatası:', error)
    let errorMessage = 'Bilinmeyen hata'
    
    if (error && typeof error === 'object' && 'message' in error) {
      const errorObj = error as { 
        message: string; 
        response?: { 
          status: number; 
          statusText: string; 
          data?: { message?: string }; 
        }; 
      }
      
      if (errorObj.response?.data?.message) {
        errorMessage = errorObj.response.data.message
      } else if (errorObj.response?.status) {
        errorMessage = `HTTP Error ${errorObj.response.status}: ${errorObj.response.statusText}`
      } else if (errorObj.message) {
        errorMessage = errorObj.message
      }
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    alert(`TC ile Cari Hareketler PDF indirilemedi: ${errorMessage}`)
  } finally {
    cariPdfLoading.value = false
  }
}

// 🔥 TC KİMLİK İLE CİRİ HAREKETLER EXCEL İNDİRME
async function downloadCariHareketlerByTCExcel(tcKimlik: string) {
  try {
    cariExcelLoading.value = true
    const url = `/dashboard/cari-hareketler-tc-excel?tcKimlik=${encodeURIComponent(tcKimlik)}`
    console.log('🔄 TC ile Cari Hareketler Excel indiriliyor:', url)
    
    const response = await api.get(url, {
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    
    let fileName = 'cari-hareketler'
    if (selectedNormalMusteri.value?.MstrAdi) {
      fileName = `${selectedNormalMusteri.value.MstrAdi}-cari-hareketler`
    } else if (tcKimlik) {
      fileName = `${tcKimlik}-cari-hareketler`
    }
    fileName += `-${new Date().toISOString().split('T')[0]}.xlsx`
    
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
    
    console.log('🔄 TC ile Cari Hareketler Excel başarıyla indirildi')
  } catch (error: unknown) {
    console.error('🔄 TC ile Cari Hareketler Excel indirme hatası:', error)
    let errorMessage = 'Bilinmeyen hata'
    
    if (error && typeof error === 'object' && 'message' in error) {
      const errorObj = error as { 
        message: string; 
        response?: { 
          status: number; 
          statusText: string; 
          data?: { message?: string }; 
        }; 
      }
      
      if (errorObj.response?.data?.message) {
        errorMessage = errorObj.response.data.message
      } else if (errorObj.response?.status) {
        errorMessage = `HTTP Error ${errorObj.response.status}: ${errorObj.response.statusText}`
      } else if (errorObj.message) {
        errorMessage = errorObj.message
      }
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    alert(`TC ile Cari Hareketler Excel indirilemedi: ${errorMessage}`)
  } finally {
    cariExcelLoading.value = false
  }
}

// 🔥 TC KİMLİK İLE KONAKLAMA GEÇMİŞİ PDF İNDİRME
async function downloadKonaklamaGecmisiByTCPDF(tcKimlik: string) {
  try {
    pdfLoading.value = true
    const url = `/dashboard/konaklama-gecmisi-tc-pdf?tcKimlik=${encodeURIComponent(tcKimlik)}`
    console.log('🔄 TC ile Konaklama Geçmişi PDF indiriliyor:', url)
    
    const response = await api.get(url, {
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data], { 
      type: 'application/pdf' 
    })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    
    let fileName = 'konaklama-gecmisi'
    if (selectedBorcluMusteri.value?.CariAdi) {
      fileName = `${selectedBorcluMusteri.value.CariAdi}-konaklama-gecmisi`
    } else if (tcKimlik) {
      fileName = `${tcKimlik}-konaklama-gecmisi`
    }
    fileName += `-${new Date().toISOString().split('T')[0]}.pdf`
    
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
    
    console.log('🔄 TC ile Konaklama Geçmişi PDF başarıyla indirildi')
  } catch (error: unknown) {
    console.error('🔄 TC ile Konaklama Geçmişi PDF indirme hatası:', error)
    let errorMessage = 'Bilinmeyen hata'
    
    if (error && typeof error === 'object' && 'message' in error) {
      const errorObj = error as { 
        message: string; 
        response?: { 
          status: number; 
          statusText: string; 
          data?: { message?: string }; 
        }; 
      }
      
      if (errorObj.response?.data?.message) {
        errorMessage = errorObj.response.data.message
      } else if (errorObj.response?.status) {
        errorMessage = `HTTP Error ${errorObj.response.status}: ${errorObj.response.statusText}`
      } else if (errorObj.message) {
        errorMessage = errorObj.message
      }
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    alert(`TC ile Konaklama Geçmişi PDF indirilemedi: ${errorMessage}`)
  } finally {
    pdfLoading.value = false
  }
}

// 🔥 TC KİMLİK İLE KONAKLAMA GEÇMİŞİ EXCEL İNDİRME
async function downloadKonaklamaGecmisiByTCExcel(tcKimlik: string) {
  try {
    excelLoading.value = true
    const url = `/dashboard/konaklama-gecmisi-tc-excel?tcKimlik=${encodeURIComponent(tcKimlik)}`
    console.log('🔄 TC ile Konaklama Geçmişi Excel indiriliyor:', url)
    
    const response = await api.get(url, {
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    
    let fileName = 'konaklama-gecmisi'
    if (selectedBorcluMusteri.value?.CariAdi) {
      fileName = `${selectedBorcluMusteri.value.CariAdi}-konaklama-gecmisi`
    } else if (tcKimlik) {
      fileName = `${tcKimlik}-konaklama-gecmisi`
    }
    fileName += `-${new Date().toISOString().split('T')[0]}.xlsx`
    
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
    
    console.log('🔄 TC ile Konaklama Geçmişi Excel başarıyla indirildi')
  } catch (error: unknown) {
    console.error('🔄 TC ile Konaklama Geçmişi Excel indirme hatası:', error)
    let errorMessage = 'Bilinmeyen hata'
    
    if (error && typeof error === 'object' && 'message' in error) {
      const errorObj = error as { 
        message: string; 
        response?: { 
          status: number; 
          statusText: string; 
          data?: { message?: string }; 
        }; 
      }
      
      if (errorObj.response?.data?.message) {
        errorMessage = errorObj.response.data.message
      } else if (errorObj.response?.status) {
        errorMessage = `HTTP Error ${errorObj.response.status}: ${errorObj.response.statusText}`
      } else if (errorObj.message) {
        errorMessage = errorObj.message
      }
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    alert(`TC ile Konaklama Geçmişi Excel indirilemedi: ${errorMessage}`)
  } finally {
    excelLoading.value = false
  }
}

// 🔥 KOORDİNELİ ÇALIŞMA İÇİN YENİ DEĞİŞKENLER
const tumKonaklamaTipleri = ref<string[]>(['TÜMÜ'])
const tumOdaTipleri = ref<string[]>(['TÜMÜ'])
const filteredKonaklamaTipleri = ref<string[]>(['TÜMÜ'])
const filteredOdaTipleri = ref<string[]>(['TÜMÜ'])

// 🔥 DİNAMİK LİSTE İÇİN YENİ DEĞİŞKENLER
const dinamikKonaklamaTipleri = ref<string[]>(['TÜMÜ'])
const dinamikOdaTipleri = ref<string[]>(['TÜMÜ'])

// 🔥 KOORDİNELİ ÇALIŞMA FONKSİYONLARI
// Bu fonksiyon artık kullanılmıyor - watch fonksiyonları kullanılıyor

// 🔥 YENİ KAYIT EDİLEN MÜŞTERİYİ BUL VE SEÇ FONKSİYONU
async function findAndSelectNewCustomer(newCustomer: { MstrTCN: string; MstrAdi: string; MstrTelNo: string; MstrDurum?: string; customerNote?: string }) {
  console.log('🔍 Yeni müşteri aranıyor:', newCustomer);
  
  // Kısa bir bekleme süresi ekle (verilerin yüklenmesi için)
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Hangi listeyi kontrol edeceğimizi belirle
  let customerList: unknown[] = [];
  let isBorcluTable = false;
  let isAlacakliTable = false;
  
  if (showBorcluTable.value) {
    customerList = borcluMusteriListesi.value;
    isBorcluTable = true;
  } else if (showAlacakliTable.value) {
    customerList = alacakliMusteriListesi.value;
    isAlacakliTable = true;
  } else {
    customerList = musteriListesi.value;
  }
  
  console.log('📋 Kontrol edilecek liste:', customerList.length, 'kayıt');
  
  // Yeni müşteriyi listede ara
  const foundCustomer = customerList.find(customer => {
    const cust = customer as { MstrTCN?: string; MstrAdi?: string; MstrTelNo?: string; CariAdi?: string };
    
    // TC kimlik numarası ile eşleştir
    if (cust.MstrTCN === newCustomer.MstrTCN) {
      return true;
    }
    
    // Eğer TC kimlik yoksa, müşteri adı ve telefon ile eşleştir
    if (!cust.MstrTCN && !newCustomer.MstrTCN) {
      return cust.MstrAdi === newCustomer.MstrAdi && 
             cust.MstrTelNo === newCustomer.MstrTelNo;
    }
    
    return false;
  });
  
  if (foundCustomer) {
    console.log('✅ Yeni müşteri bulundu:', foundCustomer);
    
    // Müşteriyi seç
    if (isBorcluTable) {
      selectedBorcluMusteri.value = foundCustomer as BorcluMusteri;
      // Borçlu müşteri seçildiğinde cari hareketleri yükle
      const borcluCustomer = foundCustomer as BorcluMusteri;
      void loadCariHareketler(borcluCustomer.CariKod);
    } else if (isAlacakliTable) {
      selectedBorcluMusteri.value = foundCustomer as BorcluMusteri;
      // Alacaklı müşteri seçildiğinde cari hareketleri yükle
      const alacakliCustomer = foundCustomer as BorcluMusteri;
      void loadCariHareketler(alacakliCustomer.CariKod);
    } else {
      selectedNormalMusteri.value = foundCustomer as MusteriKonaklama;
      // Normal müşteri seçildiğinde konaklama geçmişini yükle
      const normalCustomer = foundCustomer as MusteriKonaklama;
      void loadKonaklamaGecmisi(normalCustomer.MstrTCN);
    }
    
    // 🔥 GLOBAL WINDOW OBJESİNİ GÜNCELLE - MÜŞTERİ ADINI DA EKLE
    const customerWithName = {
      ...foundCustomer,
      MstrAdi: newCustomer.MstrAdi // Yeni kayıt edilen müşterinin adını kullan
    };
    window.kartliIslemSelectedNormalMusteri = customerWithName;
    
    // Müşteri bakiyesini hesapla
    void hesaplaMusteriBakiye(foundCustomer as MusteriKonaklama | BorcluMusteri | AlacakliMusteri);
    
    // Kısa bir bekleme sonrası modalı aç
    setTimeout(() => {
      console.log('🎯 Müşteri seçildi, modal açılıyor...');
      showOdemeIslemModal.value = true;
    }, 1000);
    
  } else {
    console.log('❌ Yeni müşteri listede bulunamadı');
    // 🔥 MÜŞTERİ BULUNAMADIYSA, YİNE DE GLOBAL VERİYİ GÜNCELLE VE MODALI AÇ
    const customerWithName = {
      ...newCustomer,
      MstrAdi: newCustomer.MstrAdi // Yeni kayıt edilen müşterinin adını kullan
    };
    window.kartliIslemSelectedNormalMusteri = customerWithName;
    
    // 🔥 SELECTED NORMAL MÜŞTERİYİ DE AYARLA (MODAL İÇİN)
    selectedNormalMusteri.value = customerWithName as MusteriKonaklama;
    
    setTimeout(() => {
      console.log('🎯 Müşteri bulunamadı, global veri ile modal açılıyor...');
      showOdemeIslemModal.value = true;
    }, 1000);
  }
}

watch(currentFilter, (val) => {
  window.kartliIslemCurrentFilter = val ?? '';
});
watch(selectedNormalMusteri, (val) => {
  window.kartliIslemSelectedNormalMusteri = val ?? null;
  console.log('🔥 selectedNormalMusteri değişti:', val?.MstrAdi || 'BOŞ');
  
  // 🔥 Hiç müşteri seçili değilse bakiye ve depozito göstergelerini temizle
  if (!val) {
    selectedMusteriBakiye.value = 0;
    selectedMusteriDepozito.value = 0;
    selectedFirmaBakiye.value = 0;
    (window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye = 0;
  }

  // 🔥 Eğer Cari Hareketler tablosu görünüyorsa ve müşteri değiştiyse, tabloyu güncelle
  if (showCariHareketler.value && val && currentFilter.value && ['normal-musteriler', 'suresi-dolan', 'bugun-cikan', 'yeni-musteri', 'yeni-giris', 'toplam-aktif'].includes(currentFilter.value)) {
    console.log('🔥 Cari Hareketler tablosu güncelleniyor, yeni müşteri:', val.MstrAdi);
    void loadCariHareketlerByTC(val.MstrTCN);
  }
});

// 🔥 selectedBorcluMusteri için watch ekle
watch(selectedBorcluMusteri, (val) => {
  console.log('🔥 selectedBorcluMusteri değişti:', val?.CariAdi || 'BOŞ');
  
  // 🔥 Eğer Cari Hareketler tablosu görünüyorsa ve müşteri değiştiyse, tabloyu güncelle
  if (showCariHareketler.value && val && currentFilter.value && ['borclu-musteriler', 'alacakli-musteriler', 'bakiyesiz-hesaplar'].includes(currentFilter.value)) {
    console.log('🔥 Cari Hareketler tablosu güncelleniyor, yeni müşteri:', val.CariAdi);
    void loadCariHareketler(val.CariKod);
  }
  
  // 🔥 Eğer Konaklama Geçmişi tablosu görünüyorsa ve müşteri değiştiyse, tabloyu güncelle
  if (showKonaklamaGecmisi.value && val && currentFilter.value && ['borclu-musteriler', 'alacakli-musteriler', 'bakiyesiz-hesaplar'].includes(currentFilter.value)) {
    console.log('🔥 Konaklama Geçmişi tablosu güncelleniyor, yeni müşteri:', val.CariAdi);
    if (val.CariVTCN && val.CariVTCN.trim() !== '') {
      void loadKonaklamaGecmisi(val.CariVTCN);
    }
  }
});

const showEkHizmetlerModal = ref(false);

onMounted(() => {
  // 🔥 EĞER MUSTERI-ISLEM SAYFASINDAN GELİNİYORSA, SEÇİLİ MÜŞTERİYİ AYARLA
  if (window.kartliIslemSelectedNormalMusteri) {
    console.log('🔥 kartli-islem sayfası yüklendi, seçili müşteri bulundu:', window.kartliIslemSelectedNormalMusteri)
    selectedNormalMusteri.value = window.kartliIslemSelectedNormalMusteri as MusteriKonaklama;
  }
  
  const ekHizmetHandler = () => { showEkHizmetlerModal.value = true; };
  const odemeHandler = () => { 
    console.log('🔥 showOdemeIslemModal event received, opening modal...')
    
    // 🔥 DÖNEM YENİLEME MODALINDAN GELEN MÜŞTERİ BİLGİSİNİ AKTAR
    if (window.kartliIslemSelectedNormalMusteri) {
      console.log('🔥 Global state\'den müşteri bilgisi alınıyor:', window.kartliIslemSelectedNormalMusteri)
      selectedNormalMusteri.value = window.kartliIslemSelectedNormalMusteri as MusteriKonaklama;
      console.log('🔥 selectedNormalMusteri güncellendi:', selectedNormalMusteri.value)
      console.log('🔥 Müşteri adı:', selectedNormalMusteri.value?.MstrAdi)
      
      // 🔥 KISA BİR BEKLEME SONRASI MODALI AÇ - REACTIVE UPDATE İÇİN
      setTimeout(() => {
        console.log('🔥 Modal açılıyor, son kontrol - Müşteri adı:', selectedNormalMusteri.value?.MstrAdi)
        showOdemeIslemModal.value = true;
      }, 100);
    } else {
      console.log('❌ window.kartliIslemSelectedNormalMusteri bulunamadı')
      showOdemeIslemModal.value = true; 
    }
  };
  window.addEventListener('showEkHizmetlerModal', ekHizmetHandler);
  window.addEventListener('showOdemeIslemModal', odemeHandler);
  onBeforeUnmount(() => {
    window.removeEventListener('showEkHizmetlerModal', ekHizmetHandler);
    window.removeEventListener('showOdemeIslemModal', odemeHandler);
    
    // 🔥 OTOMATİK STATS GÜNCELLEME EVENT LISTENER'LARINI TEMİZLE
    cleanupDataChangeListeners();
    
    // 🔥 PERİYODİK STATS GÜNCELLEME DEVRE DIŞI
    // stopPeriodicStatsRefresh();
  });
})

watch([showBorcluTable, showAlacakliTable], ([newBorclu, newAlacakli]) => {
  if (newBorclu || newAlacakli) {
    selectedTip.value = 'TÜMÜ';
    selectedOdaTip.value = 'TÜMÜ';
  }
});

function bakiyeGuncelleHandler() {
  if (selectedNormalMusteri.value) {
    void hesaplaMusteriBakiye(selectedNormalMusteri.value);
  }
  
  // 🔥 STATS GÜNCELLEME EVENT'İNİ TETİKLE
  window.dispatchEvent(new Event('statsNeedsUpdate'));
}

</script>

<style scoped>
.islem-tip-badge {
  padding: 4px 8px;
  border-radius: 6px;
}
.dashboard-table {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.dashboard-table .q-table__top {
  padding: 8px;
}

.dashboard-table .q-table__bottom {
  padding: 8px;
}

.compact-card {
  min-height: 60px;
  transition: transform 0.2s ease;
  backface-visibility: hidden;
  transform-style: preserve-3d;
}

.compact-card:hover {
  transform: translateY(-2px);
}

.stats-cards-container {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  align-items: center;
}

/* 🔥 GRUP AYIRICI - İlk 6 kart ile sonraki 3 kart arası */
.stats-group-divider {
  width: 3px;
  height: 60px;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.8) 0%, 
    rgba(255, 255, 255, 0.4) 50%, 
    rgba(255, 255, 255, 0.8) 100%
  );
  border-radius: 2px;
  margin: 0 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 5;
}

/* Dark mode için ayırıcı */
.body--dark .stats-group-divider {
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.3) 0%, 
    rgba(255, 255, 255, 0.1) 50%, 
    rgba(255, 255, 255, 0.3) 100%
  );
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Ayırıcıya hover efekti */
.stats-group-divider:hover {
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 1) 0%, 
    rgba(255, 255, 255, 0.6) 50%, 
    rgba(255, 255, 255, 1) 100%
  );
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transform: scaleY(1.1);
  transition: all 0.3s ease;
}

/* Süresi Dolan kartı aktifken Oda-Yatak chip altına ince sarı çizgi */


.body--dark .stats-group-divider:hover {
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.5) 0%, 
    rgba(255, 255, 255, 0.2) 50%, 
    rgba(255, 255, 255, 0.5) 100%
  );
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.stats-card-wrapper {
  flex: 1;
  position: relative;
  z-index: 1;
  min-width: 0;
  isolation: isolate;
  contain: layout style;
  padding: 2px;
}

.clickable-card {
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
  overflow: hidden;
  will-change: transform;
}

.clickable-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.15);
  z-index: 10;
}

.active-filter {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8) !important;
  transform: translateY(-2px) !important;
  z-index: 15 !important;
}

.compact-card .q-card__section {
  padding: 6px 8px !important;
}

.compact-table .q-table tbody td {
  padding: 1px 4px !important;
  height: 20px !important;
  line-height: 1.1 !important;
  font-size: 12px !important;
}

/* Önemli sütunlar için compact-table override */
.compact-table.dashboard-table .q-table tbody td:nth-child(4),  /* KnklmOdaTip */
.compact-table.dashboard-table .q-table tbody td:nth-child(5),  /* KnklmOdaNo-KnklmYtkNo */
.compact-table.dashboard-table .q-table tbody td:nth-child(6)   /* KnklmTip */ {
  font-size: 16px !important;
  font-weight: 600 !important;
  height: auto !important;
  padding: 6px 8px !important;
  line-height: 1.3 !important;
}

.compact-table .q-table thead th {
  padding: 2px 4px !important;
  height: 24px !important;
  line-height: 1.1 !important;
  font-size: 12px !important;
  font-weight: 600 !important;
}

.compact-table .q-table tbody tr {
  height: 20px !important;
}

.compact-table .q-table .q-table__container {
  border-spacing: 0 !important;
}

.compact-table .q-chip {
  font-size: 10px !important;
  padding: 1px 4px !important;
  min-height: 16px !important;
  height: 16px !important;
}

.compact-table .q-btn {
  min-height: 18px !important;
  min-width: 18px !important;
  padding: 1px !important;
  font-size: 10px !important;
}

.compact-table .q-badge {
  font-size: 10px !important;
  padding: 1px 4px !important;
  min-height: 14px !important;
}

/* Seçili satır için stil */
.selected-row {
  background-color: rgba(25, 118, 210, 0.12) !important;
  border-left: 3px solid #1976d2 !important;
}

/* Dark tema için özel renkler - en açık gri tonlar */
body.body--dark .dashboard-table .q-table__bottom {
  color: #f5f5f5 !important;
  background-color: rgba(0, 0, 0, 0.3) !important;
  border-top: 1px solid rgba(245, 245, 245, 0.15) !important;
}

body.body--dark .dashboard-table .q-table__bottom .q-btn {
  color: #f5f5f5 !important;
  border: 2px solid #eeeeee !important;
  background-color: rgba(238, 238, 238, 0.12) !important;
  box-shadow: 0 0 6px rgba(245, 245, 245, 0.15) !important;
}

body.body--dark .dashboard-table .q-table__bottom .q-btn:hover {
  background-color: #eeeeee !important;
  color: #000 !important;
  border-color: #f5f5f5 !important;
  box-shadow: 0 0 10px rgba(245, 245, 245, 0.3) !important;
}

body.body--dark .dashboard-table .q-table__bottom .q-btn.disabled {
  color: rgba(245, 245, 245, 0.25) !important;
  border-color: rgba(238, 238, 238, 0.15) !important;
  background-color: transparent !important;
  box-shadow: none !important;
}

body.body--dark .dashboard-table .q-table__bottom .q-field {
  color: #f5f5f5 !important;
  background-color: rgba(238, 238, 238, 0.08) !important;
  border: 1px solid #eeeeee !important;
}

/* Pagination text için en açık gri görünüm */
body.body--dark .dashboard-table .q-table__bottom-item {
  color: #f5f5f5 !important;
  text-shadow: 0 0 3px rgba(245, 245, 245, 0.2) !important;
}

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



/* Input alanları için dark mode */
.body--dark .draggable-card .q-input {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.body--dark .draggable-card .q-field--outlined .q-field__control {
  background-color: rgba(255, 255, 255, 0.05);
}

.body--dark .draggable-card .q-field--outlined .q-field__control:before {
  border-color: rgba(255, 255, 255, 0.24);
}

.body--dark .draggable-card .q-field--outlined.q-field--focused .q-field__control:before {
  border-color: var(--q-primary);
}

/* Header başlık alanı */
.draggable-card .q-card__section--head {
  background: linear-gradient(135deg, var(--q-primary) 0%, rgba(var(--q-primary-rgb), 0.8) 100%);
  color: white;
  border-radius: 8px 8px 0 0;
}

.body--dark .draggable-card .q-card__section--head {
  background: linear-gradient(135deg, var(--q-primary) 0%, rgba(var(--q-primary-rgb), 0.9) 100%);
}

.cursor-move {
  cursor: move;
}

/* Oda-Yatak ve Konaklama Tipi sütunları için büyük font - field name ile hedefleme */
.dashboard-table tbody td[data-field="KnklmOdaNo"],
.dashboard-table tbody td[data-field="KnklmTip"],
.konaklama-gecmisi-table tbody td[data-field="KnklmOdaTip"],
.konaklama-gecmisi-table tbody td[data-field="KnklmOdaNo"],
.konaklama-gecmisi-table tbody td[data-field="KnklmTip"] {
  font-size: 16px !important;
  font-weight: 600 !important;
  line-height: 1.3 !important;
  height: 32px !important;
  padding: 6px 8px !important;
}

/* Badge'ler ve chip'ler için büyük font */
.dashboard-table tbody td[data-field="KnklmOdaNo"] .q-chip,
.dashboard-table tbody td[data-field="KnklmTip"] .q-badge,
.konaklama-gecmisi-table tbody td[data-field="KnklmOdaTip"] .q-badge,
.konaklama-gecmisi-table tbody td[data-field="KnklmOdaNo"] .q-chip,
.konaklama-gecmisi-table tbody td[data-field="KnklmTip"] .q-badge {
  font-size: 15px !important;
  font-weight: 600 !important;
  padding: 6px 10px !important;
  min-height: 26px !important;
  height: 26px !important;
}

/* Konaklama geçmişi tablosunda da aynı özellik */
.konaklama-gecmisi-table tbody td[data-col="KnklmOdaTip"],
.konaklama-gecmisi-table tbody td[data-col="KnklmOdaNo-KnklmYtkNo"],
.konaklama-gecmisi-table tbody td[data-col="KnklmTip"] {
  font-size: 16px !important;
  font-weight: 600 !important;
  line-height: 1.3 !important;
  height: 28px !important;
  padding: 4px 8px !important;
}

/* Cari hareketler ve borçlu müşteriler tablosu için font artışı */
.borclu-table tbody td[data-col="CariAdi"],
.cari-hareketler-table tbody td[data-col="islemAciklama"] {
  font-size: 15px !important;
  font-weight: 500 !important;
}

/* Column header hedefleme ile daha güçlü seçici */
.dashboard-table .q-table tbody td:nth-child(4),  /* KnklmOdaTip */
.dashboard-table .q-table tbody td:nth-child(5),  /* KnklmOdaNo-KnklmYtkNo */
.dashboard-table .q-table tbody td:nth-child(6),  /* KnklmTip */
.konaklama-gecmisi-table .q-table tbody td:nth-child(2),  /* KnklmOdaTip */
.konaklama-gecmisi-table .q-table tbody td:nth-child(3),  /* KnklmOdaNo-KnklmYtkNo */
.konaklama-gecmisi-table .q-table tbody td:nth-child(4)   /* KnklmTip */ {
  font-size: 16px !important;
  font-weight: 600 !important;
  line-height: 1.4 !important;
  height: auto !important;
  padding: 8px !important;
}

/* Oda Tipi sütunu için de büyük font (4. sütun) */
.dashboard-table .q-table tbody td:nth-child(4) {
  font-size: 16px !important;
  font-weight: 600 !important;
}



/* Badge ve chip'ler için daha büyük font */
.dashboard-table .q-table tbody td:nth-child(5) .q-chip,  /* Oda-Yatak chip */
.dashboard-table .q-table tbody td:nth-child(6) .q-badge, /* Konaklama tipi badge */
.konaklama-gecmisi-table .q-table tbody td:nth-child(2) .q-badge,
.konaklama-gecmisi-table .q-table tbody td:nth-child(3) .q-chip,
.konaklama-gecmisi-table .q-table tbody td:nth-child(4) .q-badge {
  font-size: 15px !important;
  font-weight: 600 !important;
  padding: 8px 12px !important;
  min-height: 28px !important;
  height: auto !important;
  line-height: 1.2 !important;
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

/* 📊 TABLO BAŞLIK SATIRI VE İKONLAR */
.table-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.table-header-row span {
  flex: 1;
  min-width: 200px;
}

.report-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  background: transparent;
  transition: transform 0.2s, opacity 0.2s;
  opacity: 0.85;
}

.report-icon:hover {
  opacity: 1;
  transform: scale(1.1);
}

.pdf-btn {
  background: transparent !important;
  border: 1px solid transparent !important;
  transition: all 0.2s ease !important;
  padding: 4px !important;
  border-radius: 6px !important;
}

.pdf-btn:hover {
  transform: scale(1.1) !important;
  box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3) !important;
  background: rgba(255, 0, 0, 0.08) !important;
  border-color: rgba(255, 0, 0, 0.2) !important;
}

.excel-btn {
  background: transparent !important;
  border: 1px solid transparent !important;
  transition: all 0.2s ease !important;
  padding: 4px !important;
  border-radius: 6px !important;
}

.excel-btn:hover {
  transform: scale(1.1) !important;
  box-shadow: 0 4px 12px rgba(33, 115, 70, 0.3) !important;
  background: rgba(33, 115, 70, 0.08) !important;
  border-color: rgba(33, 115, 70, 0.2) !important;
}

/* Loading durumunda ikonları gizle */
.pdf-btn.q-loading .report-icon,
.excel-btn.q-loading .report-icon {
  opacity: 0.3;
}

/* Dark mode desteği */
.body--dark .report-icon {
  filter: brightness(1.1);
}

/* Responsive tasarım için */
@media (max-width: 768px) {
  .table-header-row {
    gap: 8px;
  }
  
  .table-header-row span {
    min-width: 150px;
    font-size: 1rem;
  }
  
  .report-icon {
    width: 20px;
    height: 20px;
  }
}

.body--dark .pdf-btn:hover {
  box-shadow: 0 6px 16px rgba(255, 0, 0, 0.5) !important;
}

.body--dark .excel-btn:hover {
  box-shadow: 0 6px 16px rgba(33, 115, 70, 0.5) !important;
}

.konaklama-header-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 18px;
}
.report-container {
  display: inline-flex;
  width: auto;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 10px 16px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  margin-left: 18px;
}
.body--dark .report-container {
  background: rgba(30, 30, 30, 0.95);
  border-color: #404040;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.4);
}
.report-icons {
  display: flex;
  gap: 12px;
  align-items: center;
}
.report-icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  background: transparent;
  transition: transform 0.2s, box-shadow 0.2s;
}
.pdf-btn {
  background: transparent !important;
  border: 2px solid transparent !important;
  transition: all 0.2s ease !important;
  padding: 6px !important;
}
.pdf-btn:hover {
  transform: scale(1.15) !important;
  box-shadow: 0 6px 16px rgba(255, 0, 0, 0.4) !important;
  background: rgba(255, 0, 0, 0.1) !important;
  border-radius: 8px !important;
}
.pdf-btn:hover .report-icon,
.excel-btn:hover .report-icon {
  transform: scale(1.08);
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
}
.excel-btn {
  background: transparent !important;
  border: 2px solid transparent !important;
  transition: all 0.2s ease !important;
  padding: 6px !important;
}
.excel-btn:hover {
  transform: scale(1.15) !important;
  box-shadow: 0 6px 16px rgba(33, 115, 70, 0.4) !important;
  background: rgba(33, 115, 70, 0.1) !important;
  border-radius: 8px !important;
}
.excel-btn:hover .report-icon {
  filter: brightness(1.3);
}
.pdf-btn.q-loading .report-icon,
.excel-btn.q-loading .report-icon {
  opacity: 0.3;
}
.body--dark .report-icon {
  filter: brightness(1.1);
}
.body--dark .pdf-btn:hover {
  box-shadow: 0 6px 16px rgba(255, 0, 0, 0.5) !important;
}
.body--dark .excel-btn:hover {
  box-shadow: 0 6px 16px rgba(33, 115, 70, 0.5) !important;
}

/* 🔥 TABLE FADE TRANSITION - FADE-OUT/FADE-IN ANİMASYONU */
.table-fade-enter-active,
.table-fade-leave-active {
  transition: all 0.15s ease-in-out !important;
}

.table-fade-enter-from {
  opacity: 0 !important;
  transform: translateY(20px) scale(0.95) !important;
}

.table-fade-leave-to {
  opacity: 0 !important;
  transform: translateY(-20px) scale(0.95) !important;
}

.table-fade-enter-to,
.table-fade-leave-from {
  opacity: 1 !important;
  transform: translateY(0) scale(1) !important;
}

/* Tablo container için smooth geçiş */
.table-fade-enter-active .q-table__container,
.table-fade-leave-active .q-table__container {
  transition: all 0.15s ease-in-out !important;
}

/* Loading durumunda ek efektler */
.table-fade-enter-active .q-loading,
.table-fade-leave-active .q-loading {
  transition: all 0.1s ease-in-out !important;
}

/* Dark mode desteği */
.body--dark .table-fade-enter-from,
.body--dark .table-fade-leave-to {
  background: rgba(255, 255, 255, 0.02) !important;
}

/* Responsive tasarım */
@media (max-width: 768px) {
  .table-fade-enter-from,
  .table-fade-leave-to {
    transform: translateY(10px) scale(0.98) !important;
  }
}

/* 🔥 REFRESH BUTTON STYLING */
.refresh-btn {
  transition: all 0.3s ease !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
}

.refresh-btn:hover {
  transform: scale(1.05) !important;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3) !important;
}

.refresh-btn:active {
  transform: scale(0.95) !important;
}

.refresh-btn.q-loading {
  opacity: 0.7 !important;
}

/* Dark mode refresh button */
.body--dark .refresh-btn:hover {
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.5) !important;
}

/* 🔥 Çıkış tarihi vurgulama - AYRILDI durumu için eliptik kırmızı-turuncu arka plan */
.exit-date-highlight {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%) !important;
  color: white !important;
  padding: 2px 8px !important;
  border-radius: 12px !important;
  font-weight: 600 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
  box-shadow: 0 2px 4px rgba(255, 107, 53, 0.3) !important;
  display: inline-block !important;
  line-height: 1.2 !important;
}

/* Dark mode için çıkış tarihi vurgulama */
.body--dark .exit-date-highlight {
  background: linear-gradient(135deg, #ff5722 0%, #ff7043 50%, #ff8a65 100%) !important;
  box-shadow: 0 2px 6px rgba(255, 87, 34, 0.4) !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5) !important;
}

/* 🔥 Planlanan tarih vurgulama - KALIYOR durumu için eliptik fıstık yeşili arka plan */
.planned-date-highlight {
  background: linear-gradient(135deg, #90EE90 0%, #98FB98 50%, #ADFF2F 100%) !important;
  color: #2E7D32 !important;
  padding: 2px 8px !important;
  border-radius: 12px !important;
  font-weight: 600 !important;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8) !important;
  box-shadow: 0 2px 4px rgba(144, 238, 144, 0.4) !important;
  display: inline-block !important;
  line-height: 1.2 !important;
}

/* Dark mode için planlanan tarih vurgulama */
.body--dark .planned-date-highlight {
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 50%, #81C784 100%) !important;
  color: white !important;
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.4) !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5) !important;
}

/* 🔥 Bakiyesiz Hesaplar için tarih vurgulama - Geçmiş tarihler için eliptik kırmızı arka plan */
.past-date-highlight {
  background: linear-gradient(135deg, #ff4444 0%, #ff6666 50%, #ff8888 100%) !important;
  color: white !important;
  padding: 2px 8px !important;
  border-radius: 12px !important;
  font-weight: 600 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
  box-shadow: 0 2px 4px rgba(255, 68, 68, 0.3) !important;
  display: inline-block !important;
  line-height: 1.2 !important;
}

/* 🔥 Bakiyesiz Hesaplar için tarih vurgulama - Bugün için eliptik turuncu arka plan */
.today-date-highlight {
  background: linear-gradient(135deg, #ff9800 0%, #ffb74d 50%, #ffcc80 100%) !important;
  color: white !important;
  padding: 2px 8px !important;
  border-radius: 12px !important;
  font-weight: 600 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
  box-shadow: 0 2px 4px rgba(255, 152, 0, 0.3) !important;
  display: inline-block !important;
  line-height: 1.2 !important;
}

/* 🔥 Bakiyesiz Hesaplar için tarih vurgulama - Gelecek tarihler için eliptik yeşil arka plan */
.future-date-highlight {
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 50%, #81C784 100%) !important;
  color: white !important;
  padding: 2px 8px !important;
  border-radius: 12px !important;
  font-weight: 600 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3) !important;
  display: inline-block !important;
  line-height: 1.2 !important;
}

/* Dark mode için bakiyesiz hesaplar tarih vurgulama */
.body--dark .past-date-highlight {
  background: linear-gradient(135deg, #d32f2f 0%, #f44336 50%, #ef5350 100%) !important;
  box-shadow: 0 2px 6px rgba(211, 47, 47, 0.4) !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5) !important;
}

.body--dark .today-date-highlight {
  background: linear-gradient(135deg, #f57c00 0%, #ff9800 50%, #ffb74d 100%) !important;
  box-shadow: 0 2px 6px rgba(245, 124, 0, 0.4) !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5) !important;
}

.body--dark .future-date-highlight {
  background: linear-gradient(135deg, #388e3c 0%, #4caf50 50%, #66bb6a 100%) !important;
  box-shadow: 0 2px 6px rgba(56, 142, 60, 0.4) !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5) !important;
}

/* 🔥 Cari Hareketler tablosu genişlik sabitleme */
.cari-hareketler-table {
  width: 100% !important;
  max-width: 100% !important;
  table-layout: fixed !important;
}

.cari-hareketler-table .q-table__container {
  width: 100% !important;
  max-width: 100% !important;
}

.cari-hareketler-table .q-table__top {
  width: 100% !important;
  max-width: 100% !important;
}

.cari-hareketler-table .q-table__bottom {
  width: 100% !important;
  max-width: 100% !important;
}

/* 🔥 TOGGLE BUTON STİLİ */
.toggle-button {
  background: linear-gradient(135deg, #ff5722 0%, #ff7043 50%, #ff8a65 100%) !important;
  border: 6px solid #300c01 !important;
  border-radius: 6px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
  box-shadow: 0 4px 8px rgba(255, 87, 34, 0.3) !important;
  transition: all 0.3s ease !important;
  min-width: 300px !important;
  padding: 8px 16px !important;
  height: 25px !important;
}

.toggle-button:hover {
  background: linear-gradient(135deg, #e64a19 0%, #f4511e 50%, #ff5722 100%) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 12px rgba(255, 87, 34, 0.4) !important;
}

.toggle-button:active {
  transform: translateY(0) !important;
  box-shadow: 0 2px 4px rgba(255, 87, 34, 0.3) !important;
}

/* Dark mode için toggle buton */
.body--dark .toggle-button {
  background: linear-gradient(135deg, #d84315 0%, #e64a19 50%, #f4511e 100%) !important;
  border: 2px solid #bf360c !important;
  box-shadow: 0 4px 8px rgba(246, 192, 175, 0.4) !important;
}

.body--dark .toggle-button:hover {
  background: linear-gradient(135deg, #bf360c 0%, #d84315 50%, #e64a19 100%) !important;
  box-shadow: 0 6px 12px rgba(243, 139, 139, 0.642) !important;
}
</style> 