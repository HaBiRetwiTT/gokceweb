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

        <q-toolbar-title>
          GÖKÇE Pansiyon
        </q-toolbar-title>

        <div class="row items-center q-gutter-sm">
          <q-btn
            flat
            dense
            round
            :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
            @click="toggleDarkMode"
          >
            <q-tooltip>{{ $q.dark.isActive ? 'Açık Mod' : 'Karanlık Mod' }}</q-tooltip>
          </q-btn>
          <q-icon name="person" />
          <span>{{ username }}</span>
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
    >
      <q-list>
        <q-item-label
          header
        >
          ANA MENÜ
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
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import EssentialLink, { type EssentialLinkProps } from 'components/EssentialLink.vue';

const router = useRouter();
const $q = useQuasar();

const linksList: EssentialLinkProps[] = [
  {
    title: 'Dashboard',
    caption: 'Genel Bakış',
    icon: 'login',
    link: '/login'
  },
  {
    title: 'Müşteri İşlemleri',
    caption: 'Kaydet - Seç - Düzenle - Sil',
    icon: 'person_add',
    link: '/musteri-islem'
  }
];

const leftDrawerOpen = ref(false);
const username = ref('');

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function handleLogout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('username');
  void router.push('/login');
}

function toggleDarkMode() {
  $q.dark.toggle();
  // Kullanıcı tercihini kaydet
  localStorage.setItem('darkMode', $q.dark.isActive.toString());
}

onMounted(() => {
  username.value = localStorage.getItem('username') || 'Kullanıcı';
  
  // Kaydedilmiş dark mode tercihini yükle
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode === 'true') {
    $q.dark.set(true);
  } else if (savedDarkMode === 'false') {
    $q.dark.set(false);
  }
  // savedDarkMode null ise sistem tercihini kullan (default)
});
</script>
