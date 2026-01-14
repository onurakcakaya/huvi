<script setup>
  import { ref } from 'vue'
  import { useAuthStore } from '../stores/auth'
  import { RouterLink } from 'vue-router'
  
  const authStore = useAuthStore()
  
  const email = ref('')
  const password = ref('')
  const errorMessage = ref('')
  const isLoading = ref(false)
  
  const handleLogin = async () => {
    if (isLoading.value) return
  
    try {
      isLoading.value = true
      errorMessage.value = ''
      await authStore.login(email.value, password.value)
    } catch (error) {
      // Burada o bahsettiğimiz iyileştirmeyi yaptık
      if (error.message.includes('Email not confirmed')) {
        errorMessage.value = 'Lütfen önce e-posta adresinizi doğrulayın.'
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage.value = 'E-posta veya şifre hatalı.'
      } else {
        errorMessage.value = 'Giriş yapılamadı: ' + error.message
      }
    } finally {
      isLoading.value = false
    }
  }
  </script>
  
  <template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900">Tekrar Hoşgeldin</h2>
          <p class="text-gray-600 mt-2">Hesabına giriş yap.</p>
        </div>
  
        <div v-if="errorMessage" class="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-100">
          {{ errorMessage }}
        </div>
  
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700">E-posta</label>
            <input 
              v-model="email" 
              type="email" 
              required 
              autocomplete="username" 
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" 
            />
          </div>
  
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">Şifre</label>
            </div>
            <input 
              v-model="password" 
              type="password" 
              required 
              autocomplete="current-password" 
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" 
            />
          </div>
  
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading" class="animate-spin h-5 w-5 border-b-2 border-white rounded-full"></span>
            <span v-else>Giriş Yap</span>
          </button>
        </form>
  
        <div class="mt-6 text-center text-sm">
          <span class="text-gray-600">Hesabın yok mu?</span>
          <RouterLink to="/register" class="font-medium text-primary-600 hover:text-primary-500 ml-1">
            Hemen Kayıt Ol
          </RouterLink>
        </div>
      </div>
    </div>
  </template>