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
      :width="250"
    >
      <q-list>
        <q-item-label
          header
          class="menu-header"
        >
          <div class="menu-title-container">
            <span class="menu-title">ANA MENÜ</span>
            <span class="version-info">v.{{ currentVersion }}</span>
          </div>
        </q-item-label>

        <EssentialLink
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
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
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { Notify } from 'quasar';
import EssentialLink, { type EssentialLinkProps } from 'components/EssentialLink.vue';
import { versionChecker } from '../services/version-checker.service';

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
  }
];

const leftDrawerOpen = ref(false);
const username = ref('');
const fullName = ref('');
const isAdmin = ref(false);
const showFallbackText = ref(false);
const logoSrc = ref('/gokce-logo.png');
const isFullScreen = ref(false);
const showFullScreenBanner = ref(false);
const isChecking = ref(false);
const currentVersion = ref('');

async function fetchVersion() {
  try {
    const response = await fetch('/version.json', { cache: 'no-store' })
    if (response.ok) {
      const data = await response.json()
      currentVersion.value = data.version
    }
  } catch {
    // Hata yönetimi: sessiz geç
  }
}

onMounted(() => {
  // ...
  // Sürüm bilgisini sadece ilk yüklemede çek
  void fetchVersion()
});

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value;
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

/* Dark mode için sürüm bilgisi */
.body--dark .version-info {
  color: rgba(255, 255, 255, 0.4);
}
</style>
