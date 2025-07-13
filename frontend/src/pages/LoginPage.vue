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
          @keyup.enter="handleLogin"
        />
        
        <q-input
          filled
          v-model="password"
          label="Şifre"
          type="password"
          class="q-mb-md"
          @keyup.enter="handleLogin"
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
import { api } from 'src/boot/axios'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  if (!username.value.trim() || !password.value.trim()) {
    errorMessage.value = 'Kullanıcı adı ve şifre gereklidir!'
    return
  }

  loading.value = true
  errorMessage.value = ''
  
  try {
    const response = await api.post('/auth/login', {
      username: username.value.trim(),
      password: password.value.trim()
    })

    if (response.data.success) {
      // Kullanıcı bilgilerini localStorage'a kaydet
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('username', response.data.user.username)
      localStorage.setItem('fullName', response.data.user.fullName)
      localStorage.setItem('isAdmin', response.data.user.isAdmin.toString())
      localStorage.setItem('userId', response.data.user.id.toString())
      
      // Başarılı giriş mesajı
      console.log('Giriş başarılı:', response.data.message)
      
      // Ana sayfaya yönlendir
      void router.push('/')
    } else {
      errorMessage.value = response.data.message || 'Giriş başarısız!'
    }
  } catch (error: unknown) {
    console.error('Login hatası:', error)
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const err = error as { response?: { data?: { message?: string }, status?: number } };
      if (err.response?.data?.message) {
        errorMessage.value = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage.value = 'Kullanıcı adı veya şifre hatalı!';
      } else {
        errorMessage.value = 'Bağlantı hatası! Lütfen tekrar deneyin.';
      }
    } else {
      errorMessage.value = 'Bilinmeyen bir hata oluştu!';
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.my-card {
  width: 100%;
  max-width: 400px;
}
</style> 