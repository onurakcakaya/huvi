<script setup>
    import { ref } from 'vue'
    import { useRouter } from 'vue-router'
    import { supabase } from '../supabase'
    import { useAuthStore } from '../stores/auth'
    
    const router = useRouter()
    const authStore = useAuthStore()
    
    const name = ref('')
    const city = ref('')
    const address = ref('')
    const phone = ref('')
    const loading = ref(false)
    const message = ref('')
    
    // Slug Oluşturucu (Türkçe karakter temizliği)
    const createSlug = (text) => {
      return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Boşlukları tire yap
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^\w\-]+/g, '')       // Alfanümerik olmayanları sil
        .replace(/\-\-+/g, '-')         // Çoklu tireleri tek yap
    }
    
    const handleCreate = async () => {
      try {
        loading.value = true
        message.value = ''
    
        if (!name.value || !city.value) {
          throw new Error('İşletme adı ve şehir zorunludur.')
        }
    
        const slug = createSlug(name.value) + '-' + Math.floor(Math.random() * 1000)
    
        const { data, error } = await supabase
          .from('businesses')
          .insert({
            name: name.value,
            slug: slug,
            city: city.value,
            address: address.value,
            phone: phone.value,
            owner_id: authStore.user.id
          })
          .select()
          .single()
    
        if (error) throw error
    
        message.value = 'İşletmeniz başarıyla kuruldu! Yönlendiriliyorsunuz... 🎉'
        
        // İşletme Dashboardına Yönlendir (Bir sonraki adımda yapacağız)
        setTimeout(() => router.push('/dashboard'), 2000)
    
      } catch (error) {
        message.value = 'Hata: ' + error.message
      } finally {
        loading.value = false
      }
    }
    </script>
    
    <template>
      <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div class="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          
          <div class="text-center mb-8">
            <div class="text-4xl mb-4">🏢</div>
            <h1 class="text-2xl font-bold text-gray-900">İşletmeni Oluştur</h1>
            <p class="text-gray-500 text-sm mt-2">
              Salonunu, stüdyonu veya kliniğini Huvi'ye taşı, müşterilerine ulaş.
            </p>
          </div>
    
          <div v-if="message" class="mb-6 p-4 rounded-lg font-bold text-sm bg-green-100 text-green-700">
            {{ message }}
          </div>
    
          <form @submit.prevent="handleCreate" class="space-y-6">
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">İşletme Adı</label>
              <input v-model="name" type="text" required placeholder="Örn: Gold Hair Studio" class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
            </div>
    
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Şehir</label>
              <input v-model="city" type="text" required placeholder="İstanbul" class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
            </div>
    
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Adres</label>
              <textarea v-model="address" rows="2" placeholder="Açık adres..." class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"></textarea>
            </div>
    
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Telefon</label>
              <input v-model="phone" type="text" placeholder="0212..." class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
            </div>
    
            <div class="pt-4">
              <button type="submit" :disabled="loading" class="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 flex justify-center">
                <span v-if="loading">Kuruluyor...</span>
                <span v-else>Hemen Başla 🚀</span>
              </button>
            </div>
    
          </form>
        </div>
      </div>
    </template>