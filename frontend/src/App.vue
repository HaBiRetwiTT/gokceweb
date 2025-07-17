<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { versionChecker } from './services/version-checker.service'

// Uygulama başladığında sürüm kontrolünü başlat
onMounted(() => {
  // Sadece production ortamında sürüm kontrolü yap
  if (import.meta.env.PROD) {
    versionChecker.startVersionCheck()
    console.log('🔄 Sürüm kontrolü başlatıldı')
  }
})

// Uygulama kapanırken sürüm kontrolünü durdur
onUnmounted(() => {
  versionChecker.stopVersionCheck()
  console.log('⏹️ Sürüm kontrolü durduruldu')
})
</script>
