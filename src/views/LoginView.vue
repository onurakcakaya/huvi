<script setup>
    import { ref } from 'vue'
    import { useAuthStore } from '../stores/auth'
    import { RouterLink } from 'vue-router'
    
    const authStore = useAuthStore()
    
    const email = ref('')
    const password = ref('')
    const errorMessage = ref('')
    
    const handleLogin = async () => {
      try {
        errorMessage.value = ''
        await authStore.login(email.value, password.value)
      } catch (error) {
        // Supabase genelde "Invalid login credentials" hatası döner
        errorMessage.value = 'E-posta veya şifre hatalı.'
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
    
          <div v-if="errorMessage" class="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {{ errorMessage }}
          </div>
    
          <form @submit.prevent="handleLogin" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700">E-posta</label>
              <input 
                v-model="email"
                type="email" 
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
    
            <div>
              <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">Şifre</label>
              <RouterLink to="/forgot-password" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
      Şifremi Unuttum?
    </RouterLink>
  </div>
              <input 
                v-model="password"
                type="password" 
                autocomplete="current-password" 
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
    
            <button 
              type="submit" 
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition"
            >
              Giriş Yap
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