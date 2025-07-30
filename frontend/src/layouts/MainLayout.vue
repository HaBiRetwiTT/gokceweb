<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
          @touchend.prevent="handleMenuTouchEnd"
          class="menu-toggle-btn"
        />

        <q-toolbar-title class="logo-container">
          <img 
            :src="logoSrc" 
            alt="GÖKÇE Pansiyon" 
            class="logo-image"
            @error="handleLogoError"
            @load="handleLogoLoad"
          />
          <div class="logo-text-container">
            <span class="logo-text">GÖKÇE Pansiyon</span>
            <span class="system-title">Müşteri Takip Sistemi</span>
          </div>
        </q-toolbar-title>

        <div class="row items-center q-gutter-sm">
          <!-- YENİ: Refresh Butonu -->
          <q-btn
            flat
            dense
            round
            icon="refresh"
            @click="refreshPage"
            aria-label="Yenile"
          >
            <q-tooltip>Yenile (F5)</q-tooltip>
          </q-btn>

          <q-btn
            flat
            dense
            round
            :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
            @click="toggleDarkMode"
          >
            <q-tooltip>{{ $q.dark.isActive ? 'Açık Mod' : 'Karanlık Mod' }}</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            round
            :icon="isFullScreen ? 'close_fullscreen' : 'fullscreen'"
            @click="toggleFullScreen"
            aria-label="Tam ekran"
          >
            <q-tooltip>{{ isFullScreen ? 'Tam ekrandan çık' : 'Tam ekran' }}</q-tooltip>
          </q-btn>
          <q-icon name="person" />
          <span>{{ fullName || username }}</span>
          <q-chip 
            v-if="isAdmin" 
            color="red" 
            text-color="white" 
            dense 
            size="sm"
            class="q-ml-xs"
          >
            Admin
          </q-chip>
          
          <!-- Sürüm Kontrolü Butonu -->
          <q-btn
            flat
            dense
            round
            icon="system_update"
            @click="checkForUpdates"
            :loading="isChecking"
          >
            <q-tooltip>Güncellemeleri Kontrol Et</q-tooltip>
          </q-btn>
          
          <q-btn
            flat
            dense
            round
            icon="logout"
            @click="handleLogout"
          >
            <q-tooltip>Çıkış</q-tooltip>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="222"
      :mini="miniMenu"
    >
      <q-list>
        <q-item-label
          header
          class="menu-header"
          v-show="!miniMenu"
        >
          <div class="menu-title-container">
            <span class="menu-title">ANA MENÜ</span>
            <span :class="versionInfoClass">v.{{ currentVersion }}</span>
          </div>
        </q-item-label>

        <EssentialLink
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
          :mini="miniMenu"
          @action="handleMenuAction"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
    <q-banner
      v-if="showFullScreenBanner"
      class="bg-primary text-white"
      inline-actions
      style="position: fixed; top: 0; left: 0; width: 100%; z-index: 9999;"
    >
      Tam ekran moduna geri dönmek için tıklayın.
      <template v-slot:action>
        <q-btn flat dense color="white" label="Tam Ekran" @click="() => enterFullScreen()" />
      </template>
    </q-banner>
    <!-- Ek Hizmetler Modal -->
    <q-dialog v-model="showEkHizmetlerModal">
      <div
        ref="ekHizmetlerModalRef"
        :style="ekHizmetlerModalStyle"
        class="draggable-ek-hizmetler-modal"
      >
        <q-card style="min-width:520px;max-width:95vw;">
          <q-card-section>
            <div
              class="text-h6 draggable-ek-hizmetler-header"
              @mousedown="onEkHizmetlerDragStart"
              @touchstart="onEkHizmetlerDragStart"
              @mouseenter="ekHizmetlerHeaderHover = true"
              @mouseleave="ekHizmetlerHeaderHover = false"
              :style="ekHizmetlerHeaderHover ? 'cursor: move;' : ''"
            >
              Ek Hizmetler
            </div>
            <div v-if="selectedEkHizmetlerMusteriAdi" class="ekhizmetler-musteri-adi">
              Müşteri Adı: {{ selectedEkHizmetlerMusteriAdi }}
            </div>
            <q-table
              :rows="ekHizmetlerRows"
              :columns="ekHizmetlerColumns"
              row-key="rowKey"
              hide-bottom
              flat
              dense
              bordered
              square
              style="min-width: 500px;"
              :pagination="{ rowsPerPage: 0 }"
              :rows-per-page-options="[0]"
            >
              <template v-slot:body-cell-hizmetAdi="props">
                <q-td>
                  <q-checkbox
                    v-model="props.row.selected"
                    :label="props.row.PrmAdi"
                    @update:model-value="onCheckboxChange(props.row)"
                  />
                </q-td>
              </template>
              <template v-slot:body-cell-birimFiyat="props">
                <q-td>
                  {{ props.row.Prm04.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) }}
                </q-td>
              </template>
              <template v-slot:body-cell-miktar="props">
                <q-td class="q-pa-none text-center">
                  <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
                    <q-input
                      v-model.number="props.row.miktar"
                      type="number"
                      :min="1"
                      :max="99"
                      dense
                      :disable="!props.row.selected"
                      style="width:60px; text-align:center;"
                      input-class="text-center"
                      @update:model-value="onMiktarChange(props.row)"
                    />
                  </div>
                </q-td>
              </template>
              <template v-slot:body-cell-toplamTutar="props">
                <q-td>
                  <span v-if="props.row.selected">
                    {{ (props.row.Prm04 * props.row.miktar).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) }}
                  </span>
                </q-td>
              </template>
              <template v-slot:bottom-row>
                <q-tr class="genel-toplam-row">
                  <q-td colspan="3" class="text-right text-bold">GENEL TOPLAM</q-td>
                  <q-td class="text-bold genel-toplam-cell">
                    {{ genelToplamDisplay }}
                  </q-td>
                </q-tr>
              </template>
            </q-table>
            <div v-if="seciliHizmetAdedi > 0" class="q-mt-md text-caption text-center text-warning ekhizmetler-bilgi-wrap">
              Yukarıda seçili olan {{ seciliHizmetAdedi }} adet hizmet karşılığı toplam {{ genelToplamDisplay }} tutarında GELİR kaydı Müşteri hesabına BORÇ kaydedilecek. ONAYLIYOR MUSUNUZ?
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Vazgeç" color="primary" v-close-popup />
            <q-btn flat label="Kaydet" color="primary" @click="onKaydet" />
          </q-card-actions>
        </q-card>
      </div>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">

import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, Notify } from 'quasar';
import EssentialLink, { type EssentialLinkProps } from '../components/EssentialLink.vue';
import { versionChecker } from '../services/version-checker.service';
import { fetchEkHizmetler, saveEkHizmetler } from '../services/ek-hizmetler.service';
import { api } from '../boot/axios';

const router = useRouter();
const $q = useQuasar();

const linksList: EssentialLinkProps[] = [
  {
    title: 'Dashboard',
    caption: 'Grafik / İstatistik',
    icon: 'analytics',
    link: '/dashboard'
  },
  {
    title: 'Müşteri Kayıt İşlemi',
    caption: 'Kaydet - Güncelle',
    icon: 'person_add',
    link: '/musteri-islem'
  },
  {
    title: 'Kartlı Hızlı İşlemler',
    caption: 'Konaklama - Cari',
    icon: 'dashboard',
    link: '/kartli-islem'
  },
  {
    title: 'Ek Hizmetler',
    caption: 'Çamaşır - Ütü vb.',
    icon: 'room_service',
    action: 'showEkHizmetlerModal'
  },
  {
    title: 'Müşteri Tahsilat',
    caption: 'Ödeme - Depozito',
    icon: 'payments',
    action: 'showOdemeIslemModal'
  },
  {
    title: 'Oda Tip Takvim',
    caption: 'Mevcut - Rezerve',
    icon: 'calendar_month',
    link: '/mevcut-rezerve'
  }
];

const leftDrawerOpen = ref(false);
const miniMenu = ref(true);
const username = ref('');
const fullName = ref('');
const isAdmin = ref(false);
const showFallbackText = ref(false);
const logoSrc = ref('/gokce-logo.png');
const isFullScreen = ref(false);
const showFullScreenBanner = ref(false);
const isChecking = ref(false);
const currentVersion = ref('');
const pendingUpdate = ref(false);
const showEkHizmetlerModal = ref(false);

interface KartliIslemMusteri {
  MstrNo?: number;
  MstrAdi?: string;
  KonaklamaTipi?: string;
  KnklmTip?: string;
  OdaYatak?: string;
  OdaNo?: string;
  YatakNo?: string;
  KnklmOdaNo?: string;
  KnklmYtkNo?: string;
  MstrHspTip?: string;
  MstrTCN?: string;
}

// Ek Hizmetler Modalı için
interface EkHizmet {
  Prm01: string;
  PrmAdi: string;
  Prm04: number;
  selected: boolean;
  miktar: number;
}

const ekHizmetlerRows = ref<EkHizmet[]>([]);
const ekHizmetlerColumns = [
  { name: 'hizmetAdi', label: 'Hizmet Adı', field: 'PrmAdi', align: 'left' as const },
  { name: 'birimFiyat', label: 'Birim Fiyat', field: 'Prm04', align: 'right' as const },
  { name: 'miktar', label: 'Miktar', field: 'miktar', align: 'center' as const },
  { name: 'toplamTutar', label: 'Toplam Tutar', field: 'toplamTutar', align: 'right' as const }
];

const genelToplam = computed<number>(() => {
  return ekHizmetlerRows.value
    .filter(row => row.selected)
    .reduce((sum, row) => sum + (row.Prm04 * row.miktar), 0);
});

const versionInfoClass = computed(() => {
  return pendingUpdate.value ? 'version-info version-warning' : 'version-info';
});

const genelToplamDisplay = computed(() =>
  genelToplam.value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
);

const seciliHizmetAdedi = computed(() => ekHizmetlerRows.value.filter(row => row.selected).length);

const selectedEkHizmetlerMusteriAdi = computed(() => {
  // ekHizmetlerMusteriRefresh.value'ya bağımlı!
  void ekHizmetlerMusteriRefresh.value;
  const musteri = window.kartliIslemSelectedNormalMusteri ? { ...(window.kartliIslemSelectedNormalMusteri as { MstrAdi?: string }) } : undefined;
  return musteri && typeof musteri === 'object' && musteri.MstrAdi ? musteri.MstrAdi : '';
});

const ekHizmetlerMusteriRefresh = ref(0);

const ekHizmetlerModalRef = ref<HTMLElement|null>(null);
const ekHizmetlerHeaderHover = ref(false);
const ekHizmetlerModalPos = reactive({ x: 0, y: 0 });
const ekHizmetlerModalDragging = ref(false);
const ekHizmetlerModalOffset = reactive({ x: 0, y: 0 });

const ekHizmetlerModalStyle = computed(() => {
  return ekHizmetlerModalDragging.value || ekHizmetlerModalPos.x !== 0 || ekHizmetlerModalPos.y !== 0
    ? `position: fixed; left: ${ekHizmetlerModalPos.x}px; top: ${ekHizmetlerModalPos.y}px; z-index: 9999;` : '';
});

function onEkHizmetlerDragStart(e: MouseEvent | TouchEvent) {
  ekHizmetlerModalDragging.value = true;
  let clientX = 0, clientY = 0;
  if (e instanceof MouseEvent) {
    clientX = e.clientX;
    clientY = e.clientY;
    document.addEventListener('mousemove', onEkHizmetlerDragMove);
    document.addEventListener('mouseup', onEkHizmetlerDragEnd);
  } else if (e instanceof TouchEvent) {
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    document.addEventListener('touchmove', onEkHizmetlerDragMove);
    document.addEventListener('touchend', onEkHizmetlerDragEnd);
  }
  const rect = ekHizmetlerModalRef.value ? ekHizmetlerModalRef.value.getBoundingClientRect() : undefined;
  ekHizmetlerModalOffset.x = clientX - (rect?.left ?? 0);
  ekHizmetlerModalOffset.y = clientY - (rect?.top ?? 0);
}

function onEkHizmetlerDragMove(e: MouseEvent | TouchEvent) {
  if (!ekHizmetlerModalDragging.value) return;
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
  ekHizmetlerModalPos.x = clientX - ekHizmetlerModalOffset.x;
  ekHizmetlerModalPos.y = clientY - ekHizmetlerModalOffset.y;
}

function onEkHizmetlerDragEnd() {
  ekHizmetlerModalDragging.value = false;
  document.removeEventListener('mousemove', onEkHizmetlerDragMove);
  document.removeEventListener('mouseup', onEkHizmetlerDragEnd);
  document.removeEventListener('touchmove', onEkHizmetlerDragMove);
  document.removeEventListener('touchend', onEkHizmetlerDragEnd);
}

watch(showEkHizmetlerModal, (val) => {
  if (val) {
    // Modal açıldığında ortala
    ekHizmetlerModalPos.x = window.innerWidth / 2 - 300;
    ekHizmetlerModalPos.y = window.innerHeight / 2 - 200;
  }
});

async function fetchVersion() {
  try {
    const response = await fetch('/version.json', { cache: 'no-store' })
    if (response.ok) {
      const data = await response.json()
      currentVersion.value = data.version
      // Eğer kullanılan sürüm son sürüm ise pendingUpdate flag'ini sil
      if (localStorage.getItem('lastCheckedVersion') === data.version) {
        localStorage.removeItem('pendingUpdate')
        pendingUpdate.value = false
      }
    }
  } catch {
    // Hata yönetimi: sessiz geç
  }
}

onMounted(() => {
  // ...
  // Sürüm bilgisini sadece ilk yüklemede çek
  void fetchVersion()
  pendingUpdate.value = localStorage.getItem('pendingUpdate') === 'true';
});

async function loadEkHizmetler() {
  const data = await fetchEkHizmetler();
  ekHizmetlerRows.value = data.map((item: Omit<EkHizmet, 'selected' | 'miktar' | 'rowKey'>, idx: number) => ({
    ...item,
    rowKey: `${item.Prm01}_${idx}`, // Benzersiz anahtar
    selected: false,
    miktar: 1
  }));
  // window.ekHizmetlerRows = ekHizmetlerRows; // debug için eklenmişti, kaldırıldı
}

watch(showEkHizmetlerModal, (val) => {
  if (val) void loadEkHizmetler();
});

function toggleLeftDrawer() {
  // Android browser uyumluluğu için timeout eklendi
  setTimeout(() => {
    miniMenu.value = !miniMenu.value;
    // Force re-render için
    leftDrawerOpen.value = !leftDrawerOpen.value;
    // Geri al
    setTimeout(() => {
      leftDrawerOpen.value = !leftDrawerOpen.value;
    }, 10);
  }, 50);
}

// Android browser için ayrı touch handler
function handleMenuTouchEnd(event: TouchEvent) {
  // Touch event'in gereksiz duplicate'ini önle
  event.preventDefault();
  event.stopPropagation();
  
  // Android browser'da daha güvenilir toggle için
  miniMenu.value = !miniMenu.value;
  
  // Visual feedback için kısa animation trigger
  const btn = event.target as HTMLElement;
  if (btn) {
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = '';
    }, 150);
  }
}

function handleLogout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('username');
  localStorage.removeItem('fullName');
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('userId');
  void router.push('/login');
}

function toggleDarkMode() {
  $q.dark.toggle();
  // Kullanıcı tercihini kaydet
  localStorage.setItem('darkMode', $q.dark.isActive.toString());
}

function handleLogoError() {
  console.log('Logo yüklenemedi, fallback text gösteriliyor');
  showFallbackText.value = true;
}

function handleLogoLoad() {
  console.log('Logo başarıyla yüklendi');
  // Logo yüklendikten sonra background ekleyerek test edelim
  const img = document.querySelector('.logo-image') as HTMLImageElement;
  if (img) {
    console.log('Logo boyutları:', img.naturalWidth, 'x', img.naturalHeight);
  }
}

function toggleFullScreen() {
  if (!isFullScreen.value) {
    // Tam ekran moduna geç
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      void elem.requestFullscreen();
    } else if ((elem as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
      void (elem as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
    } else if ((elem as unknown as { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen) {
      void (elem as unknown as { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen();
    }
    isFullScreen.value = true;
  } else {
    // Tam ekrandan çık
    if (document.exitFullscreen) {
      void document.exitFullscreen();
    } else if ((document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
      void (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
    } else if ((document as unknown as { msExitFullscreen?: () => Promise<void> }).msExitFullscreen) {
      void (document as unknown as { msExitFullscreen: () => Promise<void> }).msExitFullscreen();
    }
    isFullScreen.value = false;
  }
}

function enterFullScreen() {
  const elem = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  };

  if (elem.requestFullscreen) {
    void elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    void elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    void elem.msRequestFullscreen();
  }
  showFullScreenBanner.value = false;
  isFullScreen.value = true;
}

// Tam ekran değişimini dinle (F11 veya ESC ile çıkışta ikon güncellensin)
if (typeof window !== 'undefined') {
  document.addEventListener('fullscreenchange', () => {
    isFullScreen.value = !!document.fullscreenElement;
  });
}

function refreshPage() {
  // Eğer tam ekran ise, localStorage'a kaydet
  if (isFullScreen.value) {
    localStorage.setItem('restoreFullScreen', 'true');
  } else {
    localStorage.removeItem('restoreFullScreen');
  }
  window.location.reload();
}

// Sürüm kontrolü fonksiyonu
async function checkForUpdates() {
  isChecking.value = true
  
  try {
    const hasUpdate = await versionChecker.manualCheck()
    
    if (hasUpdate) {
      Notify.create({
        type: 'positive',
        message: 'Yeni sürüm mevcut!',
        caption: 'Güncellemeleri almak için sayfayı yenileyin.',
        icon: 'system_update',
        position: 'top',
        timeout: 5000
      })
    } else {
      Notify.create({
        type: 'info',
        message: 'Güncel sürüm',
        caption: 'Uygulamanız en son sürümde.',
        icon: 'check_circle',
        position: 'top',
        timeout: 3000
      })
    }
  } catch {
    Notify.create({
      type: 'negative',
      message: 'Kontrol hatası',
      caption: 'Sürüm kontrolü sırasında bir hata oluştu.',
      icon: 'error',
      position: 'top',
      timeout: 3000
    })
  } finally {
    isChecking.value = false
  }
}

// window global tipini genişlet

declare global {
  interface Window {
    kartliIslemCurrentFilter?: string;
    kartliIslemSelectedNormalMusteri: KartliIslemMusteri | null;
  }
}

function handleMenuAction(action: string) {
  if (action === 'showEkHizmetlerModal') {
    if (router.currentRoute.value.path === '/kartli-islem') {
      // Kartlı işlem sayfasında, currentFilter ve seçili müşteri kontrolü
      const selectedNormalMusteri = window.kartliIslemSelectedNormalMusteri;
      const currentFilter = window.kartliIslemCurrentFilter;
      if (!currentFilter || !['yeni-musteri', 'yeni-giris', 'toplam-aktif'].includes(currentFilter)) {
        Notify.create({
          type: 'warning',
          message: 'Ek Hizmetler formu sadece -Yeni Müşteri- -Yeni Giriş- -Devam Eden- kartlarından biri seçili iken kullanılır.'
        });
        return;
      }
      if (!selectedNormalMusteri || typeof selectedNormalMusteri !== 'object' || Array.isArray(selectedNormalMusteri) || Object.keys(selectedNormalMusteri).length === 0) {
        Notify.create({
          type: 'warning',
          message: 'Ek Hizmetler formunu açmak için önce bir müşteri seçmelisiniz.'
        });
        return;
      }
      showEkHizmetlerModal.value = true;
    } else {
      Notify.create({
        type: 'warning',
        message: 'Ek Hizmetler formu sadece -Kartlı Hızlı İşlemler- sayfasında kullanılır.'
      });
    }
  }
  if (action === 'showOdemeIslemModal') {
    if (router.currentRoute.value.path !== '/kartli-islem') {
      Notify.create({
        type: 'warning',
        message: 'Müşteri Tahsilat formu sadece -Kartlı Hızlı İşlemler- sayfasında açılabilir'
      });
      return;
    }
    const selectedNormalMusteri = window.kartliIslemSelectedNormalMusteri;
    const currentFilter = window.kartliIslemCurrentFilter;
    if (!currentFilter || !['yeni-musteri', 'yeni-giris', 'toplam-aktif', 'suresi-dolan'].includes(currentFilter)) {
      Notify.create({
        type: 'warning',
        message: 'Müşteri Tahsilat formu sadece -Yeni Müşteri- -Yeni Giriş- -Devam Eden- -Süresi Dolan- kartlarından biri seçili iken kullanılabilir.'
      });
      return;
    }
    if (!selectedNormalMusteri || typeof selectedNormalMusteri !== 'object' || Array.isArray(selectedNormalMusteri) || Object.keys(selectedNormalMusteri).length === 0) {
      Notify.create({
        type: 'warning',
        message: 'Müşteri Tahsilat formunu açmak için önce bir Müşteri seçmelisiniz.'
      });
      return;
    }
    window.dispatchEvent(new Event('showOdemeIslemModal'));
    return;
  }
}

function onCheckboxChange(row: EkHizmet) {
  if (!row.selected) row.miktar = 1;
}
function onMiktarChange(row: EkHizmet) {
  if (row.miktar < 1) row.miktar = 1;
  if (row.miktar > 99) row.miktar = 99;
}
async function onKaydet() {
  const seciliHizmetler = ekHizmetlerRows.value.filter(r => r.selected);
  if (seciliHizmetler.length === 0) {
    Notify.create({ type: 'warning', message: 'En az bir hizmet seçmelisiniz.' });
    return;
  }
  // Seçili müşteri ve kart bilgileri window'dan alınacak
  const musteriRaw = window.kartliIslemSelectedNormalMusteri as KartliIslemMusteri;
  const musteri = {
    MstrNo: musteriRaw.MstrNo,
    MstrAdi: musteriRaw.MstrAdi,
    MstrTCN: musteriRaw.MstrTCN,
    KonaklamaTipi: musteriRaw.KonaklamaTipi || musteriRaw.KnklmTip,
    OdaYatak: musteriRaw.KnklmOdaNo + '-' + musteriRaw.KnklmYtkNo,
    MstrHspTip: musteriRaw.MstrHspTip
  };
  // Eğer MstrNo yoksa, backend'den TCN ile bul
  if (!musteri.MstrNo && musteri.MstrTCN) {
    try {
      const response = await api.get(`/musteri-bilgi/${musteri.MstrTCN}`);
      if (response.data.success && response.data.data && response.data.data.MstrNo) {
        musteri.MstrNo = response.data.data.MstrNo;
      } else {
        Notify.create({ type: 'warning', message: 'Müşteri numarası bulunamadı.' });
        return;
      }
    } catch (err) {
      Notify.create({ type: 'warning', message: 'Müşteri numarası alınamadı. ' + (err instanceof Error ? err.message : '') });
      return;
    }
  }
  if (!musteri || !musteri.MstrNo || !musteri.MstrAdi || !musteri.KonaklamaTipi || !musteri.OdaYatak || !musteri.MstrHspTip) {
    Notify.create({ type: 'warning', message: 'Müşteri veya kart bilgileri eksik.' });
    return;
  }
  try {
    const payload = {
      musteriNo: musteri.MstrNo,
      MstrAdi: musteri.MstrAdi,
      MstrKllnc: localStorage.getItem('username') || 'admin',
      MstrHspTip: musteri.MstrHspTip,
      MstrKnklmTip: musteri.KonaklamaTipi,
      MstrOdaYatak: musteri.OdaYatak,
      ekHizmetler: seciliHizmetler.map(h => ({
        label: h.PrmAdi,
        miktar: h.miktar,
        toplamTutar: h.Prm04 * h.miktar
      }))
    };
    const result = await saveEkHizmetler(payload);
    if (result.success) {
      Notify.create({ type: 'positive', message: result.message || 'Ek hizmetler başarıyla kaydedildi.' });
      showEkHizmetlerModal.value = false;
    } else {
      Notify.create({ type: 'negative', message: result.message || 'Ek hizmetler kaydedilemedi.' });
    }
  } catch (err) {
    Notify.create({ type: 'negative', message: 'Sunucu hatası: ' + (err instanceof Error ? err.message : String(err)) });
  }
}

onMounted(() => {
  username.value = localStorage.getItem('username') || 'Kullanıcı';
  fullName.value = localStorage.getItem('fullName') || '';
  isAdmin.value = localStorage.getItem('isAdmin') === 'true';
  // Kaydedilmiş dark mode tercihini yükle
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode === 'true') {
    $q.dark.set(true);
  } else if (savedDarkMode === 'false') {
    $q.dark.set(false);
  }
  // savedDarkMode null ise sistem tercihini kullan (default)
  // Sayfa yenilendiyse ve tam ekran flag'i varsa, otomatik tam ekran yap
  if (localStorage.getItem('restoreFullScreen') === 'true') {
    localStorage.removeItem('restoreFullScreen');
    showFullScreenBanner.value = true;
  }
  // Sürüm bilgisini sadece ilk yüklemede çek
  void fetchVersion()
  pendingUpdate.value = localStorage.getItem('pendingUpdate') === 'true';
  
  window.addEventListener('ekHizmetlerMusteriChanged', () => {
    ekHizmetlerMusteriRefresh.value++;
  });
  
  // Android browser detection ve drawer fix
  if (typeof window !== 'undefined' && /Android/i.test(navigator.userAgent)) {
    // Android browser için drawer başlangıç durumu fix
    setTimeout(() => {
      const drawerElement = document.querySelector('.q-drawer');
      if (drawerElement) {
        drawerElement.classList.add('android-drawer-fix');
      }
    }, 100);
  }
  
  // showOdemeIslemModal ile ilgili event listener ve state tanımı kaldırıldı.
});

</script>

<style scoped>
.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
}

.logo-image {
  height: 35px;
  max-width: 150px;
  object-fit: contain;
  display: block;
}

.logo-text-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.logo-text {
  font-size: 1.15rem;
  font-weight: 600;
  color: white;
  letter-spacing: 0.5px;
  line-height: 1;
}

.system-title {
  font-size: 0.79rem;
  font-weight: 500;
  color: #e3f2fd;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  background: linear-gradient(10deg, #425af5 0%, #1e21e5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  padding-bottom: 0px;
}

/* Dark mode için özel stil */
.body--dark .system-title {
  background: linear-gradient(135deg, #90caf9 0%, #42a5f5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  border-bottom-color: rgba(255,255,255,0.3);
}

/* Responsive tasarım */
@media (max-width: 768px) {
  .logo-container {
    gap: 8px;
  }
  
  .logo-text {
    font-size: 1.1rem;
  }
  
  .system-title {
    font-size: 0.75rem;
  }
}

/* Sürüm bilgisi stilleri */
.menu-header {
  padding: 12px 16px;
}

.menu-title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.menu-title {
  font-weight: 600;
  color: var(--q-primary);
  font-size: 0.9rem;
  letter-spacing: 0.5px;
}

.version-info {
  font-size: 0.7rem;
  color: rgba(0, 0, 0, 0.4);
  font-weight: 400;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.2px;
}

.version-warning {
  color: #e53935 !important;
  font-weight: 600;
}

/* Dark mode için sürüm bilgisi */
.body--dark .version-info {
  color: rgba(255, 255, 255, 0.4);
}
.body--dark .version-warning {
  color: #ff5252 !important;
}
.q-table th, .q-table td {
  border: 1px solid #444 !important;
}
.q-table thead th {
  background: #222;
  color: #fff;
  font-weight: bold;
}
.q-table tbody tr {
  background: #181818;
}
.q-table .q-td {
  vertical-align: middle !important;
}
.ekhizmetler-bilgi-wrap {
  white-space: pre-line;
  word-break: break-word;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}
.draggable-ek-hizmetler-modal {
  z-index: 9999;
  user-select: none;
}
.draggable-ek-hizmetler-header {
  cursor: grab;
  user-select: none;
  transition: background 0.2s;
}
.draggable-ek-hizmetler-header:hover {
  cursor: move;
}
.ekhizmetler-musteri-adi {
  font-size: 0.95rem;
  color: #888;
  margin-bottom: 8px;
  margin-top: 2px;
  text-align: left;
  font-style: italic;
}
.genel-toplam-row {
  background: #f5f5f5 !important; /* Açık gri arka plan */
}
.genel-toplam-row .q-td,
.genel-toplam-cell {
  color: #010000 !important;         /* Koyu yazı rengi */
  font-weight: bold;
}
body.body--light .genel-toplam-row {
  background: #f5f5f5 !important;
  color: #222 !important;
}
body.body--dark .genel-toplam-row {
  background: #aaaaaa !important;
  color: #fff !important;
}

/* Android browser menü toggle fix */
.menu-toggle-btn {
  /* Touch event optimizasyonu */
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  transition: transform 0.15s ease;
}

.menu-toggle-btn:active {
  transform: scale(0.95);
}

/* Android browser için özel mobile CSS */
@media (max-width: 768px) and (hover: none) {
  .menu-toggle-btn {
    /* Android touch için daha büyük hit area */
    min-width: 48px;
    min-height: 48px;
    padding: 8px;
  }
  
  /* Android browser'da drawer animation iyileştirme */
  .q-drawer {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
  }
  
  /* Android'de mini state transition */
  .q-drawer .q-item {
    transition: all 0.3s ease !important;
  }
}

/* Android browser için özel fix class */
.android-drawer-fix {
  /* Android browser'da drawer render sorunu için */
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
</style>
