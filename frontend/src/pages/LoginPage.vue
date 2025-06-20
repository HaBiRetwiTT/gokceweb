<template>
  <div class="fullscreen bg-blue text-white flex flex-center">
    <q-card class="my-card">
      <q-card-section>
        <div class="text-h6">GÖKÇE Pansiyon</div>
        <div class="text-subtitle2">Giriş Yapın</div>
      </q-card-section>

      <q-card-section>
        <q-input
          filled
          v-model="username"
          label="Kullanıcı Adı"
          class="q-mb-md"
        />
        
        <q-input
          filled
          v-model="password"
          label="Şifre"
          type="password"
          class="q-mb-md"
        />
        
        <q-btn
          @click="handleLogin"
          color="primary"
          label="Giriş Yap"
          class="full-width"
          :loading="loading"
        />
        
        <div v-if="errorMessage" class="text-red q-mt-md">
          {{ errorMessage }}
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

function handleLogin() {
  loading.value = true
  errorMessage.value = ''
  
  setTimeout(() => {
    if (username.value === 'admin' && password.value === 'admin123') {
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('username', username.value)
      void router.push('/')
    } else {
      errorMessage.value = 'Kullanıcı adı veya şifre hatalı!'
    }
    loading.value = false
  }, 500)
}
</script>

<style scoped>
.my-card {
  width: 100%;
  max-width: 400px;
}
</style> 