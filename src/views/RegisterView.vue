<script setup>
    import { ref } from 'vue'
    import { useAuthStore } from '../stores/auth'
    import { RouterLink } from 'vue-router'
    
    const authStore = useAuthStore()
    
    const fullName = ref('')
    const email = ref('')
    const password = ref('')
    const errorMessage = ref('')
    
    const handleRegister = async () => {
  try {
    errorMessage.value = ''
    
    // Kayıt isteği gönder
    const { data, error } = await authStore.register(email.value, password.value, fullName.value)
    
    if (error) throw error

    // DİKKAT: Artık direkt yönlendirmiyoruz.
    // Kullanıcıya bilgi veriyoruz.
    // Eğer session yoksa (yani email onayı gerekiyorsa) bu mesajı göster:
    if (!data.session) {
      alert('Kayıt başarılı! 🚀\n\nLütfen e-posta adresinize gönderilen doğrulama linkine tıklayın. Ardından giriş yapabilirsiniz.')
      router.push('/login') // Login sayfasına gönder
    } else {
      // Eğer email onayı kapalıysa direkt girer (Test için)
      router.push('/')
    }

  } catch (error) {
    errorMessage.value = error.message
  }
}
    </script>
    
    <template>
      <div class="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          
          <!-- Başlık -->
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900">Hesap Oluştur</h2>
            <p class="text-gray-600 mt-2">Aramıza katıl, keşfetmeye başla.</p>
          </div>
    
          <!-- Hata Kutusu -->
          <div v-if="errorMessage" class="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {{ errorMessage }}
          </div>
    
          <!-- Form -->
          <form @submit.prevent="handleRegister" class="space-y-6">
            
            <!-- Ad Soyad -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Ad Soyad</label>
              <input 
                v-model="fullName"
                type="text" 
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Örn: Onur Yılmaz"
              />
            </div>
    
            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700">E-posta Adresi</label>
              <input 
                v-model="email"
                type="email" 
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="ornek@mail.com"
              />
            </div>
    
            <!-- Şifre -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Şifre</label>
              <input 
                v-model="password"
                type="password" 
                autocomplete="new-password"
                required
                minlength="6"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="******"
              />
            </div>
    
            <!-- Buton -->
            <button 
              type="submit" 
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition"
            >
              Kayıt Ol
            </button>
          </form>
    
          <!-- Alt Link -->
          <div class="mt-6 text-center text-sm">
            <span class="text-gray-600">Zaten hesabın var mı?</span>
            <RouterLink to="/login" class="font-medium text-primary-600 hover:text-primary-500 ml-1">
              Giriş Yap
            </RouterLink>
          </div>
    
        </div>
      </div>
    </template>