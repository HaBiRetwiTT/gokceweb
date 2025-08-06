<template>
  <div class="ai-agent-container">
    <!-- AI Agent Header -->
    <div class="ai-agent-header">
      <q-card class="ai-header-card">
        <q-card-section class="ai-header-section">
          <div class="ai-header-content">
            <q-icon name="smart_toy" size="2rem" color="primary" />
            <div class="ai-header-text">
              <h3 class="ai-title">GÖKÇE AI Asistan</h3>
              <p class="ai-subtitle">Akıllı pansiyon yönetimi önerileri</p>
            </div>
            <q-badge 
              :color="agentStatus === 'active' ? 'positive' : 'grey'" 
              :label="agentStatus === 'active' ? 'Çevrimiçi' : 'Çevrimdışı'"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- AI Agent Features -->
    <div class="ai-features-grid">
      <!-- Müşteri Analizi -->
      <q-card class="ai-feature-card" @click="openCustomerAnalysis">
        <q-card-section class="ai-feature-section">
          <div class="ai-feature-icon">
            <q-icon name="people" size="2rem" color="blue" />
          </div>
          <h4 class="ai-feature-title">Müşteri Analizi</h4>
          <p class="ai-feature-description">
            Müşteri tercihlerini analiz eder ve kişiselleştirilmiş öneriler sunar
          </p>
        </q-card-section>
      </q-card>

      <!-- Fiyat Optimizasyonu -->
      <q-card class="ai-feature-card" @click="openPricingOptimization">
        <q-card-section class="ai-feature-section">
          <div class="ai-feature-icon">
            <q-icon name="trending_up" size="2rem" color="green" />
          </div>
          <h4 class="ai-feature-title">Fiyat Optimizasyonu</h4>
          <p class="ai-feature-description">
            Piyasa koşullarına göre optimal fiyatlandırma önerileri
          </p>
        </q-card-section>
      </q-card>

      <!-- Oda Yönetimi -->
      <q-card class="ai-feature-card" @click="openRoomManagement">
        <q-card-section class="ai-feature-section">
          <div class="ai-feature-icon">
            <q-icon name="hotel" size="2rem" color="orange" />
          </div>
          <h4 class="ai-feature-title">Oda Yönetimi</h4>
          <p class="ai-feature-description">
            Oda doluluk oranları ve bakım planlaması önerileri
          </p>
        </q-card-section>
      </q-card>

      <!-- Finansal Analiz -->
      <q-card class="ai-feature-card" @click="openFinancialAnalysis">
        <q-card-section class="ai-feature-section">
          <div class="ai-feature-icon">
            <q-icon name="analytics" size="2rem" color="purple" />
          </div>
          <h4 class="ai-feature-title">Finansal Analiz</h4>
          <p class="ai-feature-description">
            Gelir analizi ve karlılık optimizasyonu önerileri
          </p>
        </q-card-section>
      </q-card>
    </div>

    <!-- AI Agent Dialog -->
    <q-dialog v-model="showAgentDialog" persistent maximized>
      <q-card class="ai-dialog-card">
        <q-card-section class="ai-dialog-header">
          <div class="ai-dialog-title">
            <q-icon :name="currentFeature.icon" size="1.5rem" :color="currentFeature.color" />
            <span>{{ currentFeature.title }}</span>
          </div>
          <q-btn icon="close" flat round dense @click="closeAgentDialog" />
        </q-card-section>

        <q-card-section class="ai-dialog-content">
          <!-- Loading State -->
          <div v-if="isLoading" class="ai-loading">
            <q-spinner-dots size="3rem" color="primary" />
            <p>AI analizi yapılıyor...</p>
          </div>

          <!-- Results -->
          <div v-else-if="agentResult" class="ai-results">
            <div class="ai-result-section">
              <h5>Analiz Sonuçları</h5>
              <div class="ai-result-data">
                <pre>{{ JSON.stringify(agentResult?.data, null, 2) }}</pre>
              </div>
            </div>

            <div class="ai-suggestions-section">
              <h5>AI Önerileri</h5>
              <q-list>
                <q-item v-for="(suggestion, index) in agentResult?.suggestions || []" :key="index">
                  <q-item-section avatar>
                    <q-icon name="lightbulb" color="amber" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ suggestion }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>

          <!-- Input Form -->
          <div v-else class="ai-input-form">
            <component 
              :is="currentFeature.component" 
              @submit="handleFeatureSubmit"
              @cancel="closeAgentDialog"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Task Status -->
    <q-dialog v-model="showTaskStatus" persistent>
      <q-card class="task-status-card">
        <q-card-section>
          <div class="task-status-header">
            <h5>Görev Durumu</h5>
            <q-btn icon="close" flat round dense @click="showTaskStatus = false" />
          </div>
          
          <div v-if="currentTask" class="task-status-content">
            <div class="task-info">
              <p><strong>Görev ID:</strong> {{ currentTask?.id }}</p>
              <p><strong>Tip:</strong> {{ getTaskTypeName(currentTask?.type || '') }}</p>
              <p><strong>Durum:</strong> 
                <q-badge 
                  :color="getTaskStatusColor(currentTask?.status || '')" 
                  :label="getTaskStatusName(currentTask?.status || '')"
                />
              </p>
              <p><strong>Oluşturulma:</strong> {{ formatDate(currentTask?.createdAt || new Date()) }}</p>
              <p v-if="currentTask?.completedAt">
                <strong>Tamamlanma:</strong> {{ formatDate(currentTask.completedAt) }}
              </p>
            </div>

            <div v-if="currentTask?.result" class="task-result">
              <h6>Sonuç:</h6>
              <pre>{{ JSON.stringify(currentTask.result, null, 2) }}</pre>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';

// Quasar instance
const $q = useQuasar();

// Reactive data
const agentStatus = ref('active');
const showAgentDialog = ref(false);
const showTaskStatus = ref(false);
const isLoading = ref(false);
// Tip tanımlamaları
interface AgentResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  suggestions?: string[];
}

interface AgentTask {
  id: string;
  type: 'customer_analysis' | 'pricing_optimization' | 'room_management' | 'financial_report';
  parameters: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: Record<string, unknown>;
  createdAt: Date;
  completedAt?: Date;
}

const agentResult = ref<AgentResponse | null>(null);
const currentTask = ref<AgentTask | null>(null);

// Current feature data
const currentFeature = reactive({
  title: '',
  icon: '',
  color: '',
  component: null as string | null
});

// Feature configurations
const features = {
  customer: {
    title: 'Müşteri Analizi',
    icon: 'people',
    color: 'blue',
    component: 'CustomerAnalysisForm'
  },
  pricing: {
    title: 'Fiyat Optimizasyonu',
    icon: 'trending_up',
    color: 'green',
    component: 'PricingOptimizationForm'
  },
  rooms: {
    title: 'Oda Yönetimi',
    icon: 'hotel',
    color: 'orange',
    component: 'RoomManagementForm'
  },
  financial: {
    title: 'Finansal Analiz',
    icon: 'analytics',
    color: 'purple',
    component: 'FinancialAnalysisForm'
  }
};

// Methods
const openCustomerAnalysis = () => {
  currentFeature.title = features.customer.title;
  currentFeature.icon = features.customer.icon;
  currentFeature.color = features.customer.color;
  currentFeature.component = features.customer.component;
  showAgentDialog.value = true;
};

const openPricingOptimization = () => {
  currentFeature.title = features.pricing.title;
  currentFeature.icon = features.pricing.icon;
  currentFeature.color = features.pricing.color;
  currentFeature.component = features.pricing.component;
  showAgentDialog.value = true;
};

const openRoomManagement = () => {
  currentFeature.title = features.rooms.title;
  currentFeature.icon = features.rooms.icon;
  currentFeature.color = features.rooms.color;
  currentFeature.component = features.rooms.component;
  showAgentDialog.value = true;
};

const openFinancialAnalysis = () => {
  currentFeature.title = features.financial.title;
  currentFeature.icon = features.financial.icon;
  currentFeature.color = features.financial.color;
  currentFeature.component = features.financial.component;
  showAgentDialog.value = true;
};

const closeAgentDialog = () => {
  showAgentDialog.value = false;
  agentResult.value = null;
  isLoading.value = false;
};

const handleFeatureSubmit = async (data: Record<string, unknown>) => {
  try {
    isLoading.value = true;
    
    let endpoint = '';
    let requestData = {};
    
    switch (currentFeature.title) {
      case 'Müşteri Analizi':
        endpoint = '/agent/analyze-customer';
        requestData = data;
        break;
      case 'Fiyat Optimizasyonu':
        endpoint = '/agent/optimize-pricing';
        requestData = { roomData: data.roomData, marketData: data.marketData };
        break;
      case 'Oda Yönetimi':
        endpoint = '/agent/manage-rooms';
        requestData = data;
        break;
      case 'Finansal Analiz':
        endpoint = '/agent/analyze-financial';
        requestData = data;
        break;
    }
    
    const response = await axios.post(`http://localhost:3000${endpoint}`, requestData);
    agentResult.value = response.data;
    
    $q.notify({
      type: 'positive',
      message: 'AI analizi başarıyla tamamlandı!',
      position: 'top'
    });
    
  } catch (error) {
    console.error('AI analizi hatası:', error);
    $q.notify({
      type: 'negative',
      message: 'AI analizi sırasında hata oluştu!',
      position: 'top'
    });
  } finally {
    isLoading.value = false;
  }
};



const getTaskTypeName = (type: string): string => {
  const typeNames: Record<string, string> = {
    'customer_analysis': 'Müşteri Analizi',
    'pricing_optimization': 'Fiyat Optimizasyonu',
    'room_management': 'Oda Yönetimi',
    'financial_report': 'Finansal Rapor'
  };
  return typeNames[type] || type;
};

const getTaskStatusName = (status: string): string => {
  const statusNames: Record<string, string> = {
    'pending': 'Bekliyor',
    'processing': 'İşleniyor',
    'completed': 'Tamamlandı',
    'failed': 'Başarısız'
  };
  return statusNames[status] || status;
};

const getTaskStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    'pending': 'grey',
    'processing': 'blue',
    'completed': 'positive',
    'failed': 'negative'
  };
  return statusColors[status] || 'grey';
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleString('tr-TR');
};

// Lifecycle
onMounted(async () => {
  try {
    // AI agent sağlık kontrolü
    const healthResponse = await axios.get('http://localhost:3000/agent/health');
    if (healthResponse.data.status === 'healthy') {
      agentStatus.value = 'active';
    } else {
      agentStatus.value = 'inactive';
    }
  } catch (error) {
    console.error('AI agent sağlık kontrolü hatası:', error);
    agentStatus.value = 'inactive';
  }
});
</script>

<style scoped>
.ai-agent-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.ai-agent-header {
  margin-bottom: 30px;
}

.ai-header-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.ai-header-section {
  padding: 20px;
}

.ai-header-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.ai-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.ai-subtitle {
  margin: 5px 0 0 0;
  opacity: 0.9;
  font-size: 0.9rem;
}

.ai-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.ai-feature-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.ai-feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border-color: var(--q-primary);
}

.ai-feature-section {
  text-align: center;
  padding: 25px;
}

.ai-feature-icon {
  margin-bottom: 15px;
}

.ai-feature-title {
  margin: 0 0 10px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--q-primary);
}

.ai-feature-description {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.ai-dialog-card {
  width: 90vw;
  max-width: 800px;
}

.ai-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--q-primary);
  color: white;
  padding: 15px 20px;
}

.ai-dialog-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2rem;
  font-weight: 600;
}

.ai-dialog-content {
  padding: 20px;
  min-height: 400px;
}

.ai-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 20px;
}

.ai-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ai-result-section,
.ai-suggestions-section {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
}

.ai-result-section h5,
.ai-suggestions-section h5 {
  margin: 0 0 15px 0;
  color: var(--q-primary);
  font-weight: 600;
}

.ai-result-data {
  background: white;
  padding: 15px;
  border-radius: 5px;
  border: 1px solid #ddd;
  max-height: 200px;
  overflow-y: auto;
}

.ai-result-data pre {
  margin: 0;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-input-form {
  padding: 20px 0;
}

.task-status-card {
  width: 90vw;
  max-width: 600px;
}

.task-status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.task-status-header h5 {
  margin: 0;
  color: var(--q-primary);
}

.task-info {
  margin-bottom: 20px;
}

.task-info p {
  margin: 8px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-result {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
}

.task-result h6 {
  margin: 0 0 10px 0;
  color: var(--q-primary);
}

.task-result pre {
  margin: 0;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-word;
  background: white;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ddd;
}

/* Responsive Design */
@media (max-width: 768px) {
  .ai-features-grid {
    grid-template-columns: 1fr;
  }
  
  .ai-header-content {
    flex-direction: column;
    text-align: center;
  }
  
  .ai-dialog-card {
    width: 95vw;
  }
}
</style> 