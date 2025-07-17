<template>
  <q-page class="dashboard-page q-pa-md">
    <!-- Yapım Aşamasında Mesajı -->
    <div class="construction-container">
      <!-- Ana İkon ve Başlık -->
      <div class="text-center q-mb-xl">
        <div class="construction-icon">
          <q-icon name="construction" size="8rem" color="orange-6" />
      </div>
        <h2 class="text-h2 text-weight-light q-mt-lg q-mb-md text-white">
          🚧 Dashboard Yapım Aşamasında
        </h2>
        <p class="text-h6 text-white opacity-80 q-mb-lg">
          İstatistiksel analiz ve grafikler yakında hazır olacak
        </p>
      </div>
      
      <!-- İlerleme Durumu -->
      <div class="progress-section q-mb-xl">
        <div class="text-center q-mb-md">
          <div class="text-h5 text-white q-mb-sm">Geliştirme Durumu</div>
          <q-linear-progress 
            :value="0.35" 
            color="orange-6" 
            size="lg"
            class="q-mb-sm"
            rounded
          />
          <div class="text-caption text-white opacity-70">%35 Tamamlandı</div>
      </div>
      </div>
      
      <!-- Özellik Listesi -->
      <div class="features-section q-mb-xl">
        <div class="row justify-center">
          <div class="col-12 col-md-8">
            <q-card class="features-card" flat>
              <q-card-section>
                <h5 class="text-h5 text-center q-mb-lg text-grey-8">
                  🎯 Planlanan Özellikler
                </h5>
                <div class="row q-gutter-md">
                  <div class="col-12 col-sm-6">
                    <div class="feature-item">
                      <q-icon name="analytics" color="blue-6" size="md" class="q-mr-sm" />
                      <span class="text-body1">Gerçek zamanlı istatistikler</span>
      </div>
                    <div class="feature-item">
                      <q-icon name="trending_up" color="green-6" size="md" class="q-mr-sm" />
                      <span class="text-body1">Gelir trend analizleri</span>
      </div>
                    <div class="feature-item">
                      <q-icon name="pie_chart" color="purple-6" size="md" class="q-mr-sm" />
                      <span class="text-body1">Konaklama tipi dağılımları</span>
      </div>
    </div>
                  <div class="col-12 col-sm-6">
                    <div class="feature-item">
                      <q-icon name="people" color="orange-6" size="md" class="q-mr-sm" />
                      <span class="text-body1">Müşteri demografik analizi</span>
      </div>
                    <div class="feature-item">
                      <q-icon name="schedule" color="teal-6" size="md" class="q-mr-sm" />
                      <span class="text-body1">Doluluk oranı takibi</span>
      </div>
                    <div class="feature-item">
                      <q-icon name="notifications" color="red-6" size="md" class="q-mr-sm" />
                      <span class="text-body1">Akıllı uyarı sistemi</span>
      </div>
      </div>
          </div>
            </q-card-section>
          </q-card>
          </div>
          </div>
        </div>

      <!-- Hızlı Erişim Butonları -->
      <div class="quick-access-section">
        <div class="text-center q-mb-lg">
          <h5 class="text-h5 text-white q-mb-md">🚀 Mevcut Özellikler</h5>
          <p class="text-body1 text-white opacity-80">
            Dashboard hazırlanırken bu sayfaları kullanabilirsiniz
          </p>
        </div>
        
        <div class="row justify-center q-gutter-md">
        <div class="col-auto">
          <q-btn 
            color="primary"
            icon="dashboard"
            label="Kartlarla Hızlı İşlemler"
            @click="goToKartliIslem"
            unelevated
            size="lg"
              class="q-mb-sm"
          />
          </div>
          <div class="col-auto">
          <q-btn 
            color="secondary"
            icon="person_add"
            label="Müşteri İşlemleri"
            @click="goToMusteriIslem"
            outline
              size="lg"
            class="q-mb-sm"
            />
          </div>
        </div>
      </div>

      <!-- Sürüm Kontrolü -->
      <div class="version-section q-mt-xl">
        <div class="text-center">
          <q-card class="version-card" flat>
            <q-card-section>
              <div class="text-h6 text-grey-8 q-mb-md">📱 Uygulama Bilgileri</div>
              <div class="row justify-center q-gutter-md">
                <div class="col-auto">
                  <q-chip 
                    color="blue-6" 
                    text-color="white" 
                    icon="info"
                    size="md"
                  >
                    Sürüm: {{ currentVersion }}
                  </q-chip>
                </div>
                <div class="col-auto">
                  <q-btn 
                    color="green-6"
                    icon="refresh"
                    label="Güncellemeleri Kontrol Et"
                    @click="checkForUpdates"
                    outline
                    size="md"
                    :loading="isChecking"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Tahmini Tamamlanma -->
      <div class="completion-section q-mt-xl">
        <div class="text-center">
          <q-chip 
            color="orange-6" 
            text-color="white" 
            icon="schedule"
            size="lg"
          >
            Tahmini Tamamlanma: 2-3 Hafta
          </q-chip>
            </div>
            </div>
            </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'
import { versionChecker } from '../services/version-checker.service'

const router = useRouter()
const isChecking = ref(false)
const currentVersion = ref(versionChecker.getCurrentVersion())

// Navigasyon fonksiyonları
function goToKartliIslem() {
  void router.push('/kartli-islem')
}

function goToMusteriIslem() {
  void router.push('/musteri-islem')
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
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.construction-container {
  max-width: 800px;
  width: 100%;
  padding: 2rem;
}

.construction-icon {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
}
  40% {
    transform: translateY(-10px);
  }
  60% {
  transform: translateY(-5px);
}
}

.features-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.feature-item:last-child {
  border-bottom: none;
}

.progress-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  backdrop-filter: blur(10px);
}

.quick-access-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  backdrop-filter: blur(10px);
}

.completion-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
}

.version-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
}

.version-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Dark mode desteği */
.body--dark .features-card {
  background: rgba(0, 0, 0, 0.8);
  color: white;
}

.body--dark .feature-item {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

/* Responsive tasarım */
@media (max-width: 600px) {
  .construction-container {
    padding: 1rem;
  }
  
  .text-h2 {
    font-size: 1.5rem;
}

  .text-h5 {
    font-size: 1.1rem;
  }
}
</style> 
