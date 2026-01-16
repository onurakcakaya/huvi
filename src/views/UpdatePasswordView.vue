<script setup>
  import { ref, onMounted } from 'vue'
  import { supabase } from '../supabase'
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  const password = ref('')
  const loading = ref(false)
  const errorMsg = ref('')
  const successMsg = ref('') // Başarı mesajı için eklendi
  
  // Sayfa açıldığında session kontrolü
  onMounted(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      // Link bozuksa login'e at
      router.push('/login')
    }
  })
  
  const updatePassword = async () => {
    try {
      loading.value = true
      errorMsg.value = ''
      successMsg.value = ''
  
      const { error } = await supabase.auth.updateUser({
        password: password.value
      })
  
      if (error) throw error
  
      // Alert yerine bu mesajı gösteriyoruz
      successMsg.value = 'Şifreniz başarıyla güncellendi! Anasayfaya yönlendiriliyorsunuz...'
      
      // Kullanıcı mesajı okusun diye 2 saniye bekleyip öyle atıyoruz
      setTimeout(() => {
        router.push('/') 
      }, 2000)
  
    } catch (error) {
      errorMsg.value = 'Hata: ' + error.message
    } finally {
      loading.value = false
    }
  }
  </script>
  
  <template>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-gray-900">Yeni Şifre Belirle</h2>
          <p class="text-gray-500 text-sm mt-2">Lütfen hesabınız için yeni bir şifre girin.</p>
        </div>
  
        <!-- Hata Mesajı -->
        <div v-if="errorMsg" class="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {{ errorMsg }}
        </div>
  
        <!-- Başarı Mesajı (YENİ) -->
        <div v-if="successMsg" class="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200 font-medium">
          {{ successMsg }}
        </div>
  
        <!-- Form (Başarı mesajı varsa formu gizle) -->
        <form v-if="!successMsg" @submit.prevent="updatePassword" class="space-y-6">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">Yeni Şifre</label>
            <input 
              v-model="password" 
              type="password" 
              required 
              minlength="6"
              placeholder="******"
              class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
            >
          </div>
  
          <button 
            type="submit" 
            :disabled="loading"
            class="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50"
          >
            {{ loading ? 'Güncelleniyor...' : 'Şifreyi Kaydet' }}
          </button>
        </form>
  
      </div>
    </div>
  </template>