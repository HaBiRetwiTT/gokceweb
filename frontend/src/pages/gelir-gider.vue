<template>
  <q-page class="gelir-gider-page q-pa-md">
    <!-- Yapım Aşamasında Mesajı -->
    <div class="construction-container">
      <!-- Ana İkon ve Başlık -->
      <div class="text-center q-mb-xl">
        <div class="construction-icon">
          <q-icon name="construction" size="8rem" color="orange-6" />
        </div>
        <h2 class="text-h2 text-weight-light q-mt-lg q-mb-md text-white">
          🚧 Gelir/Gider Kayıt İşlemi Yapım Aşamasında
        </h2>
        <p class="text-h6 text-white opacity-80 q-mb-lg">
          Gelir ve gider kayıt sistemi yakında hazır olacak
        </p>
      </div>
      
      <!-- İlerleme Durumu -->
      <div class="progress-section q-mb-xl">
        <div class="text-center q-mb-md">
          <div class="text-h5 text-white q-mb-sm">Geliştirme Durumu</div>
          <q-linear-progress 
            :value="0.10" 
            color="orange-6" 
            size="lg"
            class="q-mb-sm"
            rounded
          />
          <div class="text-caption text-white opacity-70">%10 Tamamlandı</div>
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
                      <q-icon name="trending_up" color="green-6" size="md" class="q-mr-sm" />
                      <span class="text-body1">Gelir kayıtları</span>
                    </div>
                    <div class="feature-item">
                      <q-icon name="trending_down" color="red-6" size="md" class="q-mr-sm" />
                      <span class="text-body1">Gider kayıtları</span>
                    </div>
                    <div class="feature-item">
                      <q-icon name="category" color="blue-6" size="md" class="q-mr-sm" />
                      <span class="text-body1">Kategori yönetimi</span>
                    </div>
                  </div>
                  <div class="col-12 col-sm-6">
                    <div class="feature-item">
                      <q-icon name="account_balance" color="purple-6" size="md" class="q-mr-sm" />
                      <span class="text-body1">Hesap takibi</span>
                    </div>
                    <div class="feature-item">
                      <q-icon name="report" color="orange-6" size="md" class="q-mr-sm" />
                      <span class="text-body1">Finansal raporlar</span>
                    </div>
                    <div class="feature-item">
                      <q-icon name="analytics" color="teal-6" size="md" class="q-mr-sm" />
                      <span class="text-body1">Kar/zarar analizi</span>
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
            Gelir/Gider sistemi hazırlanırken bu sayfaları kullanabilirsiniz
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
            Tahmini Tamamlanma: 4-5 Hafta
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
</script>

<style scoped>
.gelir-gider-page {
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
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.feature-item:last-child {
  border-bottom: none;
}

.quick-access-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  margin: 2rem 0;
}

.completion-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1rem;
}
</style> 