<script setup>
    import { onMounted, ref } from 'vue'
    import { useAuthStore } from '../stores/auth'
    
    const authStore = useAuthStore()
    const loading = ref(false)
    const message = ref('')
    
    // Form verileri (Sadece İsim)
    const fullName = ref('')
    
    // Sayfa açılınca mevcut bilgileri doldur
    onMounted(() => {
      if (authStore.profile) {
        fullName.value = authStore.profile.full_name || ''
      }
    })
    
    const updateProfile = async () => {
      try {
        loading.value = true
        message.value = ''
    
        // Sadece ismi güncelliyoruz
        const updates = {
          full_name: fullName.value,
          updated_at: new Date(),
        }
    
        await authStore.updateProfile(updates)
        message.value = 'Profil bilgileri güncellendi! ✅'
      } catch (error) {
        message.value = 'Hata: ' + error.message
      } finally {
        loading.value = false
      }
    }
    </script>
    
    <template>
      <div class="max-w-xl mx-auto py-10 px-4">
        <div class="bg-white shadow rounded-lg p-8">
          
          <div class="border-b pb-4 mb-6">
            <h1 class="text-2xl font-bold text-gray-800">Hesap Bilgileri</h1>
            <p class="text-gray-600">Kişisel bilgilerinizi buradan güncelleyebilirsiniz.</p>
          </div>
    
          <!-- Bildirim Mesajı -->
          <div v-if="message" class="mb-6 p-4 rounded-md text-sm font-medium transition-all" 
               :class="message.includes('Hata') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'">
            {{ message }}
          </div>
    
          <form @submit.prevent="updateProfile" class="space-y-6">
            
            <!-- Email (Salt Okunur) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">E-posta Adresi</label>
              <div class="relative">
                <input type="text" disabled :value="authStore.user?.email" 
                       class="block w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500 sm:text-sm cursor-not-allowed">
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  🔒
                </div>
              </div>
              <p class="mt-1 text-xs text-gray-500">Güvenlik gereği e-posta adresi değiştirilemez.</p>
            </div>
    
            <!-- Ad Soyad -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
              <input v-model="fullName" type="text" required minlength="3"
                     class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                     placeholder="Adınız Soyadınız">
            </div>
    
            <!-- Kaydet Butonu -->
            <div class="flex justify-end pt-4">
              <button type="submit" :disabled="loading"
                      class="flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition">
                {{ loading ? 'Kaydediliyor...' : 'Kaydet' }}
              </button>
            </div>
    
          </form>
        </div>
      </div>
    </template>