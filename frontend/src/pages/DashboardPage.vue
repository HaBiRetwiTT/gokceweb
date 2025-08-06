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
          <div class="col-auto">
          <q-btn 
            color="positive"
            icon="calendar_month"
            label="Oda Tip Takvim"
            @click="goToMevcutRezerve"
            outline
              size="lg"
            class="q-mb-sm"
            />
          </div>
          <div class="col-auto">
          <q-btn 
            color="warning"
            icon="receipt"
            label="Gider İşlemleri"
            @click="goToGelirGider"
            outline
              size="lg"
            class="q-mb-sm"
            />
          </div>
          <div class="col-auto">
          <q-btn 
            color="deep-purple"
            icon="account_balance"
            label="Kasa Kayıtları"
            @click="goToKasaIslem"
            outline
              size="lg"
            class="q-mb-sm"
            />
          </div>
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
import { useRouter } from 'vue-router'

const router = useRouter()

// Navigasyon fonksiyonları
function goToKartliIslem() {
  void router.push('/kartli-islem')
}

function goToMusteriIslem() {
  void router.push('/musteri-islem')
}

function goToMevcutRezerve() {
  void router.push('/mevcut-rezerve')
}

function goToGelirGider() {
  void router.push('/gelir-gider')
}

function goToKasaIslem() {
  void router.push('/kasa-islem')
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
