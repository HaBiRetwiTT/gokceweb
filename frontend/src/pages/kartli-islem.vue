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
            <div class="text-h5">{{ stats.ToplamAktifKonaklama || 0 }}</div>
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
      
      <div class="stats-card-wrapper">
        <q-card class="bg-purple text-white compact-card">
          <q-card-section class="q-pa-xs">
            <div class="text-body2">Listelenen Tutar</div>
            <div class="text-h5">{{ formatCurrency(listelenenGelir) }}</div>
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
          :disable="showBorcluTable || showAlacakliTable"
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
          :disable="showBorcluTable || showAlacakliTable"
        />
      </div>

      <div class="col-12 col-sm-3 col-md-2" style="max-width: 250px;" v-show="shouldShowSearchBox">
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
          placeholder="En az 3 karakter girin"
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
        />
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
            Seçilen Müşteri Bakiye:
          </div>
          <div class="text-h6 text-weight-bold" :class="getMusteriBakiyeClass(selectedMusteriBakiye)">
            {{ formatCurrency(selectedMusteriBakiye) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Ana Grid - Normal Müşteri Tablosu -->
    <transition name="table-fade" mode="out-in">
      <q-table
        v-if="!showBorcluTable && !showAlacakliTable"
        :key="`normal-table`"
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

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn 
            flat 
            round 
            dense 
            color="blue" 
            icon="visibility"
            @click="showDetails(props.row)"
          >
            <q-tooltip>Detay Görüntüle</q-tooltip>
          </q-btn>
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
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
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
        <q-td :props="props" :class="{ 'selected-row': selectedBorcluMusteri?.CariKod === props.row.CariKod }">
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
      </q-table>
    </transition>

    <!-- Cari Hareketler Tablosu (Seçilen Müşteri veya Firma Filtresi için) -->
    <transition name="table-fade" mode="out-in">
      <q-table
        ref="cariHareketlerTableRef"
        v-if="(showBorcluTable || showAlacakliTable) && showCariHareketler"
        :key="cariHareketlerKey"
        :rows="displayedCariHareketlerListesi"
        :columns="cariHareketlerColumns"
        :row-key="(row: CariHareket) => `${row.iKytTarihi}-${row.islemTutar}`"
        :loading="cariHareketlerLoading"
        :pagination="cariHareketlerPagination"
        dense
        separator="cell"
        class="dashboard-table compact-table q-mt-sm"
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
          <span v-else-if="selectedBorcluMusteri">{{ selectedBorcluMusteri.CariAdi }} - Cari Hareketler</span>
          <span v-else>Cari Hareketler</span>
          <q-btn
            flat
            round
            dense
            class="pdf-btn"
            @click="() => downloadCariHareketlerPDF()"
            :loading="cariPdfLoading"
          >
            <img src="/icons/adobe-pdf.png" alt="PDF" class="report-icon" />
            <q-tooltip class="bg-blue text-white text-body2" :delay="300">
              Cari Hareketler PDF
            </q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            class="excel-btn"
            @click="() => downloadCariHareketlerExcel()"
            :loading="cariExcelLoading"
          >
            <img src="/icons/excel-xlsx.png" alt="Excel" class="report-icon" />
            <q-tooltip class="bg-green text-white text-body2" :delay="300">
              Cari Hareketler Excel
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
            :label="props.value"
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
      </q-table>
    </transition>

    <!-- Konaklama Geçmişi Tablosu (Seçilen Normal Müşteri veya Firma Filtresi için) -->
    <transition name="table-fade" mode="out-in">
      <q-table
        ref="konaklamaGecmisiTableRef"
        v-if="!showBorcluTable && !showAlacakliTable && showKonaklamaGecmisi"
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
          <span v-else>Konaklama Geçmişi</span>
          <q-btn
            flat
            round
            dense
            class="pdf-btn"
            @click="() => downloadKonaklamaGecmisiPDF()"
            :loading="pdfLoading"
          >
            <img src="/icons/adobe-pdf.png" alt="PDF" class="report-icon" />
            <q-tooltip class="bg-red text-white text-body2" :delay="300">
              PDF Raporu İndir
            </q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            class="excel-btn"
            @click="() => downloadKonaklamaGecmisiExcel()"
            :loading="excelLoading"
          >
            <img src="/icons/excel-xlsx.png" alt="Excel" class="report-icon" />
            <q-tooltip class="bg-green text-white text-body2" :delay="300">
              Excel Raporu İndir
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
          <q-btn 
            flat 
            round 
            dense 
            color="primary" 
            icon="info"
            @click="showKonaklamaDetay(props.row)"
          >
            <q-tooltip>Detayları Görüntüle</q-tooltip>
          </q-btn>
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

    <OdemeIslemForm v-model:show="showOdemeIslemModal" :musteriAdi="selectedNormalMusteri?.MstrAdi || ''" @bakiyeGuncelle="bakiyeGuncelleHandler" />
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
import type { DashboardStats, MusteriKonaklama, BorcluMusteri, AlacakliMusteri, CariHareket, KonaklamaGecmisi } from '../components/models';

// Router instance
const router = useRouter()

// Reactive değişkenler
const loading = ref(false)
const musteriListesi = ref<MusteriKonaklama[]>([])
const borcluMusteriListesi = ref<BorcluMusteri[]>([])
const alacakliMusteriListesi = ref<AlacakliMusteri[]>([])
const showBorcluTable = ref(false)
const showAlacakliTable = ref(false)
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
const filteredCariHareketlerListesi = ref<CariHareket[]>([])

// Dönem yenileme modal için
const showDonemYenilemeModal = ref(false)
const donemYenilemeData = ref<MusteriKonaklama | null>(null)

// Cari hareketler için yeni değişkenler
const selectedBorcluMusteri = ref<BorcluMusteri | AlacakliMusteri | null>(null)
const showCariHareketler = ref(false)
const cariHareketlerListesi = ref<CariHareket[]>([])
const cariHareketlerLoading = ref(false)

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



// 🔥 SEÇİLEN MÜŞTERİ BAKİYE BİLGİSİ
const selectedMusteriBakiye = ref<number>(0)
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
  } else {
    // Normal müşteri tablosu aktifse filtrelenmiş konaklama tutarlarını topla
    return displayedMusteriListesi.value.reduce((total, musteri) => total + (musteri.KnklmNfyt || 0), 0)
  }
})

const showOdemeIslemModal = ref(false);
// Filtrelenmiş veriler - tablo için kullanılacak
const displayedMusteriListesi = computed(() => {
  let baseList = musteriListesi.value;
  
  // Arama filtresi uygula
  if (searchText.value && searchText.value.length >= 3) {
    baseList = filteredMusteriListesi.value;
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
  if (searchText.value && searchText.value.length >= 3) {
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
  if (!searchText.value || searchText.value.length < 3) {
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
  if (searchText.value && searchText.value.length >= 3) {
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

const displayedKonaklamaGecmisiListesi = computed(() => {
  return konaklamaGecmisiListesi.value
})

// 🔥 Arama kutusu görünürlük kontrolü
const searchInputRef = ref<{ focus: () => void } | null>(null)
const isSearchFocused = ref<boolean>(false)

// 🔥 Alt grid animasyon kontrolü
const cariHareketlerKey = ref<string>('cari-empty')
const konaklamaGecmisiKey = ref<string>('konaklama-empty')

// 🔥 Tek tıklama gecikme kontrolü
const normalMusteriClickTimeout = ref<number | null>(null)
const borcluMusteriClickTimeout = ref<number | null>(null)
const alacakliMusteriClickTimeout = ref<number | null>(null)

const shouldShowSearchBox = computed(() => {
  // DEBUG logları kaldırıldı
  if (isSearchFocused.value || (searchText.value && searchText.value.trim().length > 0)) {
    return true;
  }
  if (showBorcluTable.value) {
    return borcluMusteriListesi.value.length > borcluPagination.value.rowsPerPage;
  }
  if (showAlacakliTable.value) {
    return alacakliMusteriListesi.value.length > alacakliPagination.value.rowsPerPage;
  }
  return musteriListesi.value.length > pagination.value.rowsPerPage;
});

// Arama kutusu focus event handler
function onSearchFocus() {
  isSearchFocused.value = true
  console.log('Arama kutusu focus oldu - görünür kalacak')
}

// Arama kutusu blur event handler
function onSearchBlur() {
  isSearchFocused.value = false
  console.log('Arama kutusu blur oldu - normal görünürlük kuralları uygulanacak')
}

// Pagination izleyicisi - sıralama değişikliklerinde API çağrısı yapma
let sortingInProgress = false

watch(
  () => [pagination.value.sortBy, pagination.value.descending],
  () => {
    if (!sortingInProgress) {
      console.log('Pagination izleyici tetiklendi - sıralama API çağrısı engelleniyor')
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
      selectedFirmaBakiye.value = 0
      console.log('Dönem yenileme modal kapandı - müşteri ve firma bakiyesi sıfırlandı')
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

// Tablo konfigürasyonu
const columns = [
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
    name: 'actions',
    label: 'Detaylar',
    align: 'center' as const,
    field: 'actions'
  }
]

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
      sortable: true
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
      console.log(`${response.data.count} kayıt yüklendi (${currentFilter.value || 'varsayılan'} filtresi)`)
      console.log('Yüklenen veriler:', musteriListesi.value.length, 'kayıt')
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
      console.log(`${response.data.count} çıkış yapan müşteri yüklendi`)
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
    console.log('🔥 Dinamik konaklama tipleri yükleniyor... Kart tipi:', kartTip)
    
    const response = await api.get(`/dashboard/dinamik-konaklama-tipleri?kartTip=${encodeURIComponent(kartTip)}`)
    if (response.data.success) {
      dinamikKonaklamaTipleri.value = response.data.data
      // Dinamik listeyi filtrelenmiş listeye ata
      filteredKonaklamaTipleri.value = response.data.data
      console.log('✅ Dinamik konaklama tipleri yüklendi:', response.data.data)
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
    console.log('🔥 Dinamik oda tipleri yükleniyor... Kart tipi:', kartTip)
    
    const response = await api.get(`/dashboard/dinamik-oda-tipleri?kartTip=${encodeURIComponent(kartTip)}`)
    if (response.data.success) {
      dinamikOdaTipleri.value = response.data.data
      // Dinamik listeyi filtrelenmiş listeye ata
      filteredOdaTipleri.value = response.data.data
      console.log('✅ Dinamik oda tipleri yüklendi:', response.data.data)
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

async function loadBorcluMusteriler(page: number = 1, limit: number = 100) {
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

async function loadAlacakliMusteriler(page: number = 1, limit: number = 100) {
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
      console.log(`${cleanCariKod} için ${response.data.data.length} cari hareket yüklendi`)
      
      // Tablo yüklendikten sonra scroll pozisyonunu sıfırla
      await nextTick()
      if (cariHareketlerTableRef.value) {
        const tableElement = cariHareketlerTableRef.value.$el
        if (tableElement) {
          tableElement.scrollTop = 0
        }
      }
    } else {
      console.log(`${cleanCariKod} için cari hareket bulunamadı`)
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

async function refreshData() {
  // Konaklama geçmişi tablosunu gizle (modal işlemlerinden sonra güncel olmayabilir)
  showKonaklamaGecmisi.value = false
  selectedNormalMusteri.value = null
  window.kartliIslemSelectedNormalMusteri = null
  selectedCustomer.value = null
  window.dispatchEvent(new Event('ekHizmetlerMusteriChanged'));
  
  sortingInProgress = false  // Manuel yenileme için API çağrısına izin ver
  
  // Önce tüm istatistikleri yükle
  await Promise.all([
    loadStats(),
    loadKonaklamaTipleri(),
    loadOdaTipleri(),
    loadCikisYapanlarSayisi()
  ])
  
  // 🔥 DİNAMİK LİSTELERİ YÜKLE (eğer aktif filtre varsa)
  if (currentFilter.value) {
    await loadDinamikKonaklamaTipleri()
    await loadDinamikOdaTipleri()
  }
  
  // Eğer aktif filtre yoksa veya seçili kartın değeri 0 ise, akıllı kart seçimi yap
  if (!currentFilter.value || getCurrentCardValue() === 0) {
    await selectBestCard()
  } else {
    // Aktif filtre varsa sadece o kartın verilerini yenile
    void loadSelectedCardData(currentFilter.value)
  }
  selectedNormalMusteri.value = null;
  window.kartliIslemSelectedNormalMusteri = null;
  window.dispatchEvent(new Event('ekHizmetlerMusteriChanged'));
}

// Modal başarılı işlem sonrası güncelleme fonksiyonu
function onModalSuccess() {
  console.log('🎉 Modal başarılı işlem tamamlandı - Sayfa güncelleniyor...');
  
  // Modal kapatıldıktan sonra kısa bir gecikme ile verileri yenile
  setTimeout(() => {
    void refreshData();
    console.log('✅ Sayfa başarıyla güncellendi');
  }, 500);
}



function showDetails(row: MusteriKonaklama) {
  selectedRow.value = row
  showDetailDialog.value = true
}

// Çift tıklama event handler
function onRowDoubleClick(evt: Event, row: MusteriKonaklama) {
  // 🔥 Tek tıklama timeout'unu iptal et
  if (normalMusteriClickTimeout.value) {
    clearTimeout(normalMusteriClickTimeout.value)
    normalMusteriClickTimeout.value = null
  }
  
  console.log('Row double click:', row);
  
  // 🔥 Önce seçimi güncelle (grid tabloda aktif hale getir)
  selectedNormalMusteri.value = row;
  window.kartliIslemSelectedNormalMusteri = {
    ...row,
    OdaYatak: (row.KnklmOdaNo && row.KnklmYtkNo) ? `${row.KnklmOdaNo}-${row.KnklmYtkNo}` : '',
    KonaklamaTipi: row.KnklmTip
  };
  selectedCustomer.value = {
    id: row.MstrTCN,
    name: row.MstrAdi,
    ...row,
    OdaYatak: (row.KnklmOdaNo && row.KnklmYtkNo) ? `${row.KnklmOdaNo}-${row.KnklmYtkNo}` : '',
    KonaklamaTipi: row.KnklmTip
  };
  window.dispatchEvent(new Event('ekHizmetlerMusteriChanged'));
  
  if (currentFilter.value === 'cikis-yapanlar' || currentFilter.value === 'bugun-cikan') {
    sessionStorage.setItem('autoFillTCKimlik', row.MstrTCN);
    void router.push('/musteri-islem');
  } else {
    // Modal açılış akışı - ödeme vadesi hesaplama
    const modalAcilisAkisi = async () => {
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
      console.log('🔥 Backend\'den gelen ödeme vadesi (ham):', odemeVadesi);
      console.log('🔥 Formatlanmış ödeme vadesi:', convertDateFormat(odemeVadesi));
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
    console.log('Borçlu müşteri satırına tek tıklandı:', realRow);
    selectedBorcluMusteri.value = realRow;
    showCariHareketler.value = true;
    void loadCariHareketler(realRow.CariKod);
    // 🔥 Seçilen müşteri bakiyesini hesapla
    void hesaplaMusteriBakiye(realRow);
    // 🔥 Borçlu müşteri için firma bakiyesini hesapla ve selectedNormalMusteri'yi güncelle
    void hesaplaBorcluMusteriFirmaBakiye(realRow);
    // 🔥 Firma filtresi aktifse sadece o müşterinin verilerini yükle, filtreyi kapatma
    if (firmaFiltresiAktif.value && selectedFirmaAdi.value) {
      // Firma filtresi aktifken bireysel müşteri seçimi - sadece o müşterinin cari hareketlerini göster
      console.log('Firma filtresi aktifken borçlu müşteri seçildi:', realRow.CariAdi);
      // Firma filtresi açık kalacak, sadece seçilen müşterinin verileri gösterilecek
    } else {
      // Normal durum - firma filtresini sıfırla (ama hesaplaBorcluMusteriFirmaBakiye zaten uygun şekilde ayarlıyor)
      // firmaFiltresiAktif.value = false; // Bu satırı kaldırıyoruz çünkü hesaplaBorcluMusteriFirmaBakiye zaten hallediyor
    }
    borcluMusteriClickTimeout.value = null
  }, 300)
}

// Borçlu müşteri çift tıklama event handler
function onBorcluMusteriDoubleClick(evt: Event, row: BorcluMusteri) {
  // 🔥 Tek tıklama timeout'unu iptal et
  if (borcluMusteriClickTimeout.value) {
    clearTimeout(borcluMusteriClickTimeout.value)
    borcluMusteriClickTimeout.value = null
  }
  
  console.log('Borçlu müşteri satırına çift tıklandı:', row);
  selectedBorcluMusteri.value = row;
  showCariHareketler.value = true;
  void loadCariHareketler(row.CariKod);
  
  // 🔥 Seçilen müşteri bakiyesini hesapla
  void hesaplaMusteriBakiye(row);
  
  // 🔥 Borçlu müşteri için firma bakiyesini hesapla ve selectedNormalMusteri'yi güncelle
  void hesaplaBorcluMusteriFirmaBakiye(row);
  
  // 🔥 Firma filtresi aktifse sadece o müşterinin verilerini yükle, filtreyi kapatma
  if (firmaFiltresiAktif.value && selectedFirmaAdi.value) {
    // Firma filtresi aktifken bireysel müşteri seçimi - sadece o müşterinin cari hareketlerini göster
    console.log('Firma filtresi aktifken borçlu müşteri seçildi:', row.CariAdi);
    // Firma filtresi açık kalacak, sadece seçilen müşterinin verileri gösterilecek
  } else {
    // Normal durum - firma filtresini sıfırla (ama hesaplaBorcluMusteriFirmaBakiye zaten uygun şekilde ayarlıyor)
    // firmaFiltresiAktif.value = false; // Bu satırı kaldırıyoruz çünkü hesaplaBorcluMusteriFirmaBakiye zaten hallediyor
  }
  
  // 🔥 Modal açma işlemi - borçlu müşteri için dönem yenileme modal'ı
  const modalAcilisAkisi = async () => {
    let odemeVadesi = '';
    
    // 1. Önce borçlu müşteri listesinden TC ile eşleştirme yap
    const borcluMusteriVadesi = borcluMusteriListesi.value.find(b => b.CariVTCN === row.CariVTCN)?.OdemeVadesi;
    
    if (borcluMusteriVadesi && borcluMusteriVadesi.trim() !== '') {
      odemeVadesi = borcluMusteriVadesi;
    } else {
      // 2. Borçlu müşteri listesinde bulunamazsa dashboard servisten hesaplat
      try {
        const vadeResponse = await api.get(`/dashboard/musteri-odeme-vadesi/${encodeURIComponent(row.CariVTCN || '')}`);
        if (vadeResponse.data.success && vadeResponse.data.data?.odemeVadesi) {
          odemeVadesi = vadeResponse.data.data.odemeVadesi;
        }
      } catch (error) {
        console.error('Ödeme vadesi hesaplama hatası:', error);
      }
    }
    
    // Modal'ı aç - ödeme vadesi formatını düzelt
    console.log('🔥 Borçlu müşteri modal açılıyor - Backend\'den gelen ödeme vadesi (ham):', odemeVadesi);
    console.log('🔥 Borçlu müşteri modal açılıyor - Formatlanmış ödeme vadesi:', convertDateFormat(odemeVadesi));
    
    // Borçlu müşteri verilerini normal müşteri formatına çevir
    const modalData = {
      MstrTCN: row.CariVTCN || '',
      MstrAdi: row.CariAdi,
      MstrTelNo: row.CariTelNo || '',
      MstrHspTip: row.MstrHspTip || 'Bireysel',
      MstrFirma: row.MstrFirma || '',
      KnklmOdaTip: '',
      KnklmOdaNo: '',
      KnklmYtkNo: '',
      KnklmTip: '',
      KnklmNfyt: 0,
      KnklmGrsTrh: '',
      KnklmPlnTrh: '',
      KnklmNot: '',
      OdemeVadesi: convertDateFormat(odemeVadesi)
    };
    
    donemYenilemeData.value = modalData;
    showDonemYenilemeModal.value = true;
  };
  
  void modalAcilisAkisi();
}



function formatCurrency(value: number | undefined): string {
  if (!value) return '0 ₺'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(value)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  // DD.MM.YYYY formatında gelen tarihi düzenle
  return dateStr
}

// Tarih formatını MM.DD.YYYY'den DD.MM.YYYY'ye çevir
function convertDateFormat(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') return '';
  
  console.log('🔥 convertDateFormat giriş:', dateStr);
  
  // MM.DD.YYYY formatını kontrol et ve DD.MM.YYYY'ye çevir
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const firstPart = parseInt(parts[0] || '0');
      const secondPart = parseInt(parts[1] || '0');
      
      console.log('🔥 Tarih parçaları:', { firstPart, secondPart, parts });
      
      // Eğer ikinci kısım 12'den büyükse, bu MM.DD.YYYY formatıdır (ay 12'den büyük olamaz)
      if (secondPart > 12) {
        const result = `${parts[1]}.${parts[0]}.${parts[2]}`;
        console.log('🔥 MM.DD.YYYY -> DD.MM.YYYY dönüşümü (ay > 12):', result);
        return result;
      }
      // Eğer ilk kısım 12'den büyükse, bu MM.DD.YYYY formatıdır (gün > 12)
      else if (firstPart > 12) {
        const result = `${parts[1]}.${parts[0]}.${parts[2]}`;
        console.log('🔥 MM.DD.YYYY -> DD.MM.YYYY dönüşümü (gün > 12):', result);
        return result;
      }
      // Eğer her ikisi de 12'den küçükse, varsayılan olarak MM.DD.YYYY kabul et
      else {
        const result = `${parts[1]}.${parts[0]}.${parts[2]}`;
        console.log('🔥 Varsayılan MM.DD.YYYY -> DD.MM.YYYY dönüşümü:', result);
        return result;
      }
    }
  }
  
  // Farklı formatlar için kontrol
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    // YYYY-MM-DD formatı
    const parts = dateStr.split('-');
    const result = `${parts[2]}.${parts[1]}.${parts[0]}`;
    console.log('🔥 YYYY-MM-DD -> DD.MM.YYYY dönüşümü:', result);
    return result;
  }
  
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    // MM/DD/YYYY formatı
    const parts = dateStr.split('/');
    const result = `${parts[1]}.${parts[0]}.${parts[2]}`;
    console.log('🔥 MM/DD/YYYY -> DD.MM.YYYY dönüşümü:', result);
    return result;
  }
  
  console.log('🔥 Format tanınmadı, olduğu gibi döndürülüyor:', dateStr);
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

function getIslemTipColor(tip: string): string {
  switch (tip) {
    case 'GELİR': return 'green'
    case 'Çıkan': return 'green'
    case 'GİDER': return 'red'
    case 'Giren': return 'red'
    default: return 'blue'
  }
}

function getIslemTutarClass(tip: string): string {
  switch (tip) {
    case 'GELİR': return 'text-green'
    case 'Çıkan': return 'text-green'
    case 'GİDER': return 'text-red'
    case 'Giren': return 'text-red'
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
      const response = await api.get(`/musteri-bilgi/${musteri.MstrTCN}`);
      
      if (response.data.success && response.data.data) {
        const mstrNo = response.data.data.MstrNo;
        const hspTip = response.data.data.MstrHspTip || musteri.MstrHspTip;
        cariKod = hspTip === 'Kurumsal' ? `MK${mstrNo}` : `MB${mstrNo}`;
      }
    }
    
    if (!cariKod) {
      selectedMusteriBakiye.value = 0;
      (window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye = 0;
      return;
    }
    
    // Backend'den bakiye bilgisini al
    const bakiyeResponse = await api.get(`/dashboard/musteri-bakiye/${cariKod}`);
    
    if (bakiyeResponse.data.success) {
      selectedMusteriBakiye.value = bakiyeResponse.data.bakiye || 0;
      // Global erişim için window objesine ata
      (window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye = bakiyeResponse.data.bakiye || 0;
    } else {
      selectedMusteriBakiye.value = 0;
      (window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye = 0;
    }
  } catch (error: unknown) {
    console.error('Müşteri bakiye hesaplama hatası:', error);
    selectedMusteriBakiye.value = 0;
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
        
        // Müşteri bakiyesini alacak tutarı olarak ata (negatif değer)
        const alacakTutari = -(row.AlacakTutari || 0);
        selectedMusteriBakiye.value = alacakTutari;
        // Global erişim için window objesine ata
        (window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye = alacakTutari;
        
        // Firma bakiyesini hesapla
        await hesaplaAlacakliMusteriFirmaBakiye(row)
        
        // Cari hareketler tablosunu göster
        showCariHareketler.value = true
        void loadCariHareketler(row.CariKod)
        console.log('Alacaklı müşteri için cari hareketler yükleniyor:', row.CariKod)
      } catch (error) {
        console.error('Alacaklı müşteri seçme hatası:', error)
      }
      
      alacakliMusteriClickTimeout.value = null
    })()
  }, 300)
}

// 🔥 ALACAKLI MÜŞTERİ DOUBLE CLICK FONKSİYONU
async function onAlacakliMusteriDoubleClick(evt: Event, row: AlacakliMusteri) {
  // 🔥 Tek tıklama timeout'unu iptal et
  if (alacakliMusteriClickTimeout.value) {
    clearTimeout(alacakliMusteriClickTimeout.value)
    alacakliMusteriClickTimeout.value = null
  }
  
  try {
    // Önceki seçimi temizle
    selectedBorcluMusteri.value = null
    
    console.log('Alacaklı müşteri çift tıklandı:', row)
    selectedBorcluMusteri.value = row // Alacaklı müşteri de aynı yapıda olduğu için
    
    // Müşteri bakiyesini alacak tutarı olarak ata (negatif değer)
    const alacakTutari2 = -(row.AlacakTutari || 0);
    selectedMusteriBakiye.value = alacakTutari2;
    // Global erişim için window objesine ata
    (window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye = alacakTutari2;
    
    // Firma bakiyesini hesapla
    await hesaplaAlacakliMusteriFirmaBakiye(row)
    
    // Cari hareketler tablosunu göster
    showCariHareketler.value = true
    void loadCariHareketler(row.CariKod)
    console.log('Alacaklı müşteri için cari hareketler yükleniyor:', row.CariKod)
  } catch (error) {
    console.error('Alacaklı müşteri seçme hatası:', error)
  }
  
  // 🔥 Modal açma işlemi - alacaklı müşteri için dönem yenileme modal'ı
  const modalAcilisAkisi = async () => {
    let odemeVadesi = '';
    
    // Alacaklı müşteri için sadece backend'den ödeme vadesi çek
    try {
      const vadeResponse = await api.get(`/dashboard/musteri-odeme-vadesi/${encodeURIComponent(row.CariVTCN || '')}`);
      if (vadeResponse.data.success && vadeResponse.data.data?.odemeVadesi) {
        odemeVadesi = vadeResponse.data.data.odemeVadesi;
      }
    } catch (error) {
      console.error('Ödeme vadesi hesaplama hatası:', error);
    }
    
    // Modal'ı aç - ödeme vadesi formatını düzelt
    console.log('🔥 Alacaklı müşteri modal açılıyor - Backend\'den gelen ödeme vadesi (ham):', odemeVadesi);
    console.log('🔥 Alacaklı müşteri modal açılıyor - Formatlanmış ödeme vadesi:', convertDateFormat(odemeVadesi));
    
    // Alacaklı müşteri verilerini normal müşteri formatına çevir
    const modalData = {
      MstrTCN: row.CariVTCN || '',
      MstrAdi: row.CariAdi,
      MstrTelNo: row.CariTelNo || '',
      MstrHspTip: row.MstrHspTip || 'Bireysel',
      MstrFirma: row.MstrFirma || '',
      KnklmOdaTip: '',
      KnklmOdaNo: '',
      KnklmYtkNo: '',
      KnklmTip: '',
      KnklmNfyt: 0,
      KnklmGrsTrh: '',
      KnklmPlnTrh: '',
      KnklmNot: '',
      OdemeVadesi: convertDateFormat(odemeVadesi)
    };
    
    donemYenilemeData.value = modalData;
    showDonemYenilemeModal.value = true;
  };
  
  void modalAcilisAkisi();
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
  
  if (date < today) {
    return 'text-red text-weight-bold' // Geçmiş tarih
  } else if (date.toDateString() === today.toDateString()) {
    return 'text-orange text-weight-bold' // Bugün
  } else {
    return 'text-green' // Gelecek tarih
  }
}

// Arama fonksiyonu
function performSearch(searchValue: string) {
  if (!searchValue || searchValue.length < 3) {
    filteredMusteriListesi.value = []
    filteredBorcluMusteriListesi.value = []
    filteredCariHareketlerListesi.value = []
    return
  }
  
  const searchLower = searchValue.toLowerCase()
  
  // Normal müşteri listesi için arama
  filteredMusteriListesi.value = musteriListesi.value.filter(musteri => {
    return Object.values(musteri).some(value => {
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(searchLower)
    })
  })
  
  // Borçlu müşteri listesi için arama
  filteredBorcluMusteriListesi.value = borcluMusteriListesi.value.filter(musteri => {
    return Object.values(musteri).some(value => {
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(searchLower)
    })
  })
  
  // Cari hareketler listesi için arama
  filteredCariHareketlerListesi.value = cariHareketlerListesi.value.filter(hareket => {
    return Object.values(hareket).some(value => {
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(searchLower)
    })
  })
}

// Arama değişikliği event handler
function onSearchChange(newValue: string | number | null) {
  const searchValue = newValue ? String(newValue) : ''
  searchText.value = searchValue
  
  // 🔥 Arama metni temizlendiğinde focus durumunu kontrol et
  if (!searchValue || searchValue.trim().length === 0) {
    // Arama metni temizlendi, focus durumuna göre görünürlük belirlenecek
    console.log('Arama metni temizlendi - görünürlük focus durumuna göre belirlenecek')
  }
  
  performSearch(searchValue)
}

async function loadFilteredData(filter: string) {
  currentFilter.value = filter  
  // 🔥 Seçilen kartı session storage'a kaydet
  sessionStorage.setItem('kartliIslemLastCard', filter)
  
  sortingInProgress = false  // Filtre değiştiğinde yeni veri çek
  
  // 🔥 DİNAMİK LİSTELERİ YÜKLE
  await loadDinamikKonaklamaTipleri()
  await loadDinamikOdaTipleri()
  
  // Yeni kart seçildiğinde arama metnini temizle ve filtreyi kaldır
  searchText.value = ''
  filteredMusteriListesi.value = []
  filteredBorcluMusteriListesi.value = []
  filteredCariHareketlerListesi.value = []
  
  // Konaklama geçmişi tablosunu gizle ve seçimi temizle
  showKonaklamaGecmisi.value = false
  selectedNormalMusteri.value = null
  
  // 🔥 Müşteri bakiyesini sıfırla
  selectedMusteriBakiye.value = 0;
  selectedFirmaBakiye.value = 0;
  // Global erişim için window objesini de sıfırla
  (window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye = 0;
  
  // 🔥 Firma filtresini temizle
  firmaFiltresiAktif.value = false
  selectedFirmaAdi.value = ''
  
  if (filter === 'borclu-musteriler') {
    // Borçlu müşteriler tablosunu göster
    showBorcluTable.value = true
    showAlacakliTable.value = false
    selectedBorcluMusteri.value = null  // Seçimi temizle
    showCariHareketler.value = false    // Cari hareketler tablosunu gizle
    void loadBorcluMusteriler().then(() => {
      // Eğer borçlu müşteri listesi boşsa, akıllı kart seçimi yap
      if (borcluMusteriListesi.value.length === 0) {
        console.log('🔥 Borçlu müşteri listesi boş, akıllı kart seçimi yapılıyor')
        void selectBestCard()
      }
    })
    borcluPagination.value.page = 1
    borcluPagination.value.rowsPerPage = 5
  } else if (filter === 'alacakli-musteriler') {
    // Alacaklı müşteriler tablosunu göster
    showBorcluTable.value = false
    showAlacakliTable.value = true
    selectedBorcluMusteri.value = null  // Seçimi temizle
    showCariHareketler.value = false    // Cari hareketler tablosunu gizle
    void loadAlacakliMusteriler().then(() => {
      // Eğer alacaklı müşteri listesi boşsa, akıllı kart seçimi yap
      if (alacakliMusteriListesi.value.length === 0) {
        void selectBestCard()
      }
    })
  } else if (filter === 'cikis-yapanlar') {
    // Çıkış yapanlar listesini göster
    showBorcluTable.value = false
    showAlacakliTable.value = false
    void loadCikisYapanlarListesi()
  } else {
    // Normal müşteri tablosunu göster
    showBorcluTable.value = false
    showAlacakliTable.value = false
    void refreshData()
  }
  selectedNormalMusteri.value = null;
  window.kartliIslemSelectedNormalMusteri = null;
  selectedCustomer.value = null;
  window.dispatchEvent(new Event('ekHizmetlerMusteriChanged'));
}

// 🔥 FİLTRE TEMİZLEME FONKSİYONU
function clearFilters() {
  console.log('🔥 Filtreler temizleniyor...')
  
  // Her iki combobox'ı da TÜMÜ yap
  selectedTip.value = 'TÜMÜ'
  selectedOdaTip.value = 'TÜMÜ'
  
  // Dinamik listeleri yeniden yükle
  void loadDinamikKonaklamaTipleri()
  void loadDinamikOdaTipleri()
  
  // Seçili kartın verilerini yenile
  if (currentFilter.value) {
    void loadSelectedCardData(currentFilter.value)
  }
  
  console.log('✅ Filtreler temizlendi')
  selectedNormalMusteri.value = null
  window.kartliIslemSelectedNormalMusteri = null
  selectedCustomer.value = null;
  window.dispatchEvent(new Event('ekHizmetlerMusteriChanged'));
}

//  KOORDİNELİ ÇALIŞMA EVENT HANDLER'LARI
async function onKonaklamaTipiChange(newValue: string) {
  console.log('🔥 Konaklama tipi değişti:', newValue)
  
  // Eğer oda tipi zaten TÜMÜ dışında bir seçim yapılmışsa, oda tipi listesini değiştirme
  if (selectedOdaTip.value !== 'TÜMÜ' && selectedOdaTip.value !== undefined) {
    console.log('Oda tipi zaten seçili olduğu için oda tipi listesi değiştirilmiyor:', selectedOdaTip.value)
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
  console.log('🔥🔥🔥 ODA TİPİ DEĞİŞTİ - FONKSİYON ÇALIŞIYOR:', newValue)
  
  // Eğer konaklama tipi zaten TÜMÜ dışında bir seçim yapılmışsa, konaklama tipi listesini değiştirme
  if (selectedTip.value !== 'TÜMÜ' && selectedTip.value !== undefined) {
    console.log('Konaklama tipi zaten seçili olduğu için konaklama tipi listesi değiştirilmiyor:', selectedTip.value)
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
      console.log('🔥 API çağrısı yapılıyor...')
      try {
        const response = await api.get(`/dashboard/konaklama-tipleri-by-oda?odaTip=${encodeURIComponent(newValue)}&kartTip=${currentFilter.value}`)
        console.log('🔥 API response:', response.data)
        if (response.data.success) {
          filteredKonaklamaTipleri.value = response.data.data
          console.log('Oda tipi filtrelendi - Konaklama tipleri:', response.data.data)
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
    showKonaklamaGecmisi.value = true;
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

// Konaklama detay dialog'unu göster
function showKonaklamaDetay(row: KonaklamaGecmisi) {
  selectedKonaklamaDetay.value = row;
  showKonaklamaDetayDialog.value = true;
}

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

// 🔥 MEVCUT KART DEĞERİNİ ALMA FONKSİYONU
function getCurrentCardValue(): number {
  if (!currentFilter.value) return 0
  
  const cardValues: Record<string, number> = {
    'suresi-dolan': stats.value.SuresiGecentKonaklama || 0,
    'borclu-musteriler': stats.value.BorcluMusteriSayisi || 0,
    'alacakli-musteriler': stats.value.AlacakliMusteriSayisi || 0,
    'toplam-aktif': stats.value.ToplamAktifKonaklama || 0,
    'yeni-musteri': stats.value.YeniMusteriKonaklama || 0,
    'yeni-giris': stats.value.YeniGirisKonaklama || 0,
    'bugun-cikan': stats.value.BugünCikanKonaklama || 0,
    'cikis-yapanlar': cikisYapanlarSayisi.value || 0
  }
  
  return cardValues[currentFilter.value] || 0
}

// 🔥 AKILLI KART SEÇİM FONKSİYONU (asenkron)
async function selectBestCard() {
  // 🔥 ÖNCELİK SIRASI: Süresi dolan kartlar her zaman öncelikli!
  
  // 1. Önce süresi dolan kartları kontrol et
  const suresiDolanList = await loadMusteriListesiReturn('suresi-dolan');
  const suresiDolanSayisi = suresiDolanList ? suresiDolanList.length : 0;
  
  // Süresi dolan kart sayısı > 0 ise daima bu kart seçilir
  if (suresiDolanSayisi > 0) {
    void loadFilteredData('suresi-dolan');
    return;
  }
  
  // 2. Süresi dolan kart yoksa diğer kartları kontrol et
  const cardTypes = [
    'alacakli-musteriler',
    'borclu-musteriler', 
    'toplam-aktif',
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
  const response = await api.get('/dashboard/alacakli-musteriler');
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
  
  // 🔥 DİNAMİK LİSTELERİ YÜKLE
  await loadDinamikKonaklamaTipleri()
  await loadDinamikOdaTipleri()
  
  if (cardType === 'borclu-musteriler') {
    // Borçlu müşteriler tablosunu göster
    console.log('Borçlu müşteriler tablosu gösteriliyor')
    showBorcluTable.value = true
    showAlacakliTable.value = false
    selectedBorcluMusteri.value = null
    showCariHareketler.value = false
    void loadBorcluMusteriler()
  } else if (cardType === 'alacakli-musteriler') {
    // Alacaklı müşteriler tablosunu göster
    console.log('Alacaklı müşteriler tablosu gösteriliyor')
    showBorcluTable.value = false
    showAlacakliTable.value = true
    selectedBorcluMusteri.value = null
    showCariHareketler.value = false
    void loadAlacakliMusteriler()
  } else if (cardType === 'cikis-yapanlar') {
    // Çıkış yapanlar listesini göster
    console.log('Çıkış yapanlar listesi gösteriliyor')
    showBorcluTable.value = false
    showAlacakliTable.value = false
    void loadCikisYapanlarListesi()
  } else {
    // Normal müşteri tablosunu göster
    console.log('Normal müşteri tablosu gösteriliyor')
    showBorcluTable.value = false
    showAlacakliTable.value = false
    void loadMusteriListesi()
  }
}

// Lifecycle
onMounted(() => {
  // Sayfa yüklendiğinde akıllı kart seçimi yap
  void (async () => {
    await refreshData();
    await selectBestCard();
  })();

  // Tahsilat sonrası bakiye güncelleme event listener
  window.addEventListener('refreshSelectedMusteriBakiye', (e) => {
    const customEvent = e as CustomEvent;
    const musteri = customEvent.detail || selectedNormalMusteri.value;
    console.log('EVENT YAKALANDI', musteri);
    if (musteri) {
      void hesaplaMusteriBakiye(musteri);
    }
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
      (window as { selectedMusteriBakiye?: number }).selectedMusteriBakiye = 0;
    });
  } else {
    // Filtre kapandığında tümünü temizle
    selectedNormalMusteri.value = null;
    selectedBorcluMusteri.value = null;
    showKonaklamaGecmisi.value = false;
    showCariHareketler.value = false;
    selectedMusteriBakiye.value = 0;
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
    const url = `/konaklama-gecmisi-pdf?${queryString}`;
    
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
  } catch (error) {
    console.error('PDF raporu indirme hatası:', error)
    // Hata mesajını göster
    alert('PDF raporu indirilemedi: ' + (error as Error).message)
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
    const url = `/konaklama-gecmisi-excel?${queryString}`;
    
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
  } catch (error) {
    console.error('Excel raporu indirme hatası:', error)
    // Hata mesajını göster
    alert('Excel raporu indirilemedi: ' + (error as Error).message)
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
    const url = `/cari-hareketler-pdf?${queryString}`;
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
    link.download = `cari-hareketler-${Date.now()}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
    
    console.log('Cari hareketler PDF raporu başarıyla indirildi')
  } catch (error) {
    console.error('Cari hareketler PDF raporu indirme hatası:', error)
    // Hata mesajını göster
    alert('PDF raporu indirilemedi: ' + (error as Error).message)
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
    const url = `/cari-hareketler-excel?${queryString}`;
    
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
    link.download = `cari-hareketler-${Date.now()}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
    
    console.log('Cari hareketler Excel raporu başarıyla indirildi')
  } catch (error) {
    console.error('Cari hareketler Excel raporu indirme hatası:', error)
    // Hata mesajını göster
    alert('Excel raporu indirilemedi: ' + (error as Error).message)
  } finally {
    cariExcelLoading.value = false
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

watch(currentFilter, (val) => {
  window.kartliIslemCurrentFilter = val ?? '';
});
watch(selectedNormalMusteri, (val) => {
  window.kartliIslemSelectedNormalMusteri = val ?? null;
});

const showEkHizmetlerModal = ref(false);

onMounted(() => {
  const ekHizmetHandler = () => { showEkHizmetlerModal.value = true; };
  const odemeHandler = () => { showOdemeIslemModal.value = true; };
  window.addEventListener('showEkHizmetlerModal', ekHizmetHandler);
  window.addEventListener('showOdemeIslemModal', odemeHandler);
  onBeforeUnmount(() => {
    window.removeEventListener('showEkHizmetlerModal', ekHizmetHandler);
    window.removeEventListener('showOdemeIslemModal', odemeHandler);
  });
});

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
}

</script>

<style scoped>
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
</style> 