<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { versionChecker } from './services/version-checker.service'

function debugLog(...args: unknown[]) {
  if (import.meta.env.MODE !== 'production') {
    console.log(...args)
  }
}

// Uygulama başladığında sürüm kontrolünü başlat
onMounted(() => {
  // Sadece production ortamında sürüm kontrolü yap
  if (import.meta.env.PROD) {
    versionChecker.startVersionCheck()
    debugLog('🔄 Sürüm kontrolü başlatıldı')
  }
})

// Uygulama kapanırken sürüm kontrolünü durdur
onUnmounted(() => {
  versionChecker.stopVersionCheck()
  debugLog('⏹️ Sürüm kontrolü durduruldu')
})
</script>
