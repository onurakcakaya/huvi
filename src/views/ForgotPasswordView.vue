<script setup>
    import { ref } from 'vue'
    import { supabase } from '../supabase'
    import { RouterLink } from 'vue-router'
    
    const email = ref('')
    const loading = ref(false)
    const message = ref('')
    const errorMsg = ref('')
    
    const handleReset = async () => {
      try {
        loading.value = true
        message.value = ''
        errorMsg.value = ''
    
        // Şifre sıfırlama maili gönder
        // redirectTo: Kullanıcı maildeki linke tıklayınca nereye gitsin?
        const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
          redirectTo: window.location.origin + '/update-password',
        })
    
        if (error) throw error
    
        message.value = 'Sıfırlama bağlantısı e-posta adresine gönderildi. Lütfen kutunu kontrol et (Spam klasörüne de bak).'
        
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
            <h2 class="text-2xl font-bold text-gray-900">Şifreni mi Unuttun?</h2>
            <p class="text-gray-500 text-sm mt-2">Endişelenme, e-posta adresini gir, sana bir sıfırlama bağlantısı gönderelim.</p>
          </div>
    
          <!-- Başarılı Mesajı -->
          <div v-if="message" class="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
            {{ message }}
          </div>
    
          <!-- Hata Mesajı -->
          <div v-if="errorMsg" class="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-200">
            {{ errorMsg }}
          </div>
    
          <form v-if="!message" @submit.prevent="handleReset" class="space-y-6">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">E-posta Adresi</label>
              <input 
                v-model="email" 
                type="email" 
                required 
                placeholder="ornek@mail.com"
                class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
              >
            </div>
    
            <button 
              type="submit" 
              :disabled="loading"
              class="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50"
            >
              {{ loading ? 'Gönderiliyor...' : 'Bağlantı Gönder' }}
            </button>
          </form>
    
          <div class="mt-6 text-center">
            <RouterLink to="/login" class="text-sm text-gray-600 hover:text-primary-600 font-medium">
              ← Giriş ekranına dön
            </RouterLink>
          </div>
    
        </div>
      </div>
    </template>