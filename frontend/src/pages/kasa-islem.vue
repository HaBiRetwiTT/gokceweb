<template>
  <q-page class="q-pa-md light-page-background">
    <div class="text-h6 q-mb-sm text-center">Kasa Kayıtları - Raporlar ve Devirler</div>
    
    <!-- Ana Container -->
    <div class="ana-container">
      <q-card class="main-card">
        <q-card-section class="text-center">
          <q-icon name="construction" size="100px" color="orange" />
          <div class="text-h5 q-mt-md">Yapım Aşamasında...</div>
          <div class="text-body1 q-mt-sm text-grey-6">
            Bu sayfa yakında kullanıma açılacaktır.
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
// Sayfa başlığı template içinde kullanılıyor
</script>

<style scoped>
.light-page-background {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.ana-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.main-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Dark mode için */
.body--dark .main-card {
  background: rgba(30, 30, 30, 0.95);
  color: white;
}

.body--dark .text-grey-6 {
  color: #b0b0b0 !important;
}
</style> 