<script setup>
    import { ref } from 'vue'
    import { supabase } from '../supabase'
    
    const props = defineProps({
      isOpen: Boolean,
      businessId: String // business_id yerine businessId (type hatası olmasın)
    })
    
    const emit = defineEmits(['close', 'refresh'])
    
    const searchTerm = ref('')
    const loading = ref(false)
    const searchResults = ref([]) // Birden fazla sonuç olabilir
    const message = ref('')
    
    // 1. İSİMLE KULLANICI ARA
    const searchUser = async () => {
      if (searchTerm.value.length < 3) {
        message.value = 'En az 3 harf giriniz.'
        return
      }
      
      loading.value = true
      message.value = ''
      searchResults.value = []
    
      try {
        const { data, error } = await supabase.rpc('search_profiles', {
          search_term: searchTerm.value
        })
    
        if (error) throw error
    
        if (data && data.length > 0) {
          searchResults.value = data
        } else {
          message.value = 'Kullanıcı bulunamadı.'
        }
    
      } catch (error) {
        console.error(error)
        message.value = 'Arama hatası.'
      } finally {
        loading.value = false
      }
    }
    
    // 2. SEÇİLEN KİŞİYİ EKLE
    const addStaff = async (user) => {
      if (!confirm(`${user.full_name} adlı kullanıcıyı eklemek istiyor musunuz?`)) return
    
      loading.value = true
      try {
        // businessId'yi bigint (sayı) olarak gönderiyoruz, string gelirse çeviriyoruz
        const bId = parseInt(props.businessId)
    
        const { error } = await supabase
          .from('business_staff')
          .insert({
            business_id: bId,
            user_id: user.id,
            role: 'staff',
            title: user.profession || 'Uzman'
          })
    
        if (error) {
          if (error.code === '23505') throw new Error('Bu kullanıcı zaten ekli.')
          throw error
        }
    
        emit('refresh')
        closeModal()
        
      } catch (error) {
        alert('Hata: ' + error.message)
      } finally {
        loading.value = false
      }
    }
    
    const closeModal = () => {
      searchTerm.value = ''
      searchResults.value = []
      message.value = ''
      emit('close')
    }
    </script>
    
    <template>
      <div v-if="isOpen" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
          
          <!-- Header -->
          <div class="bg-gray-900 text-white p-5 flex justify-between items-center shrink-0">
            <div>
              <h3 class="font-bold text-lg">Yeni Uzman Ekle</h3>
              <p class="text-gray-400 text-xs mt-1">İsim soyisim ile arama yapın.</p>
            </div>
            <button @click="closeModal" class="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>
    
          <div class="p-6 overflow-y-auto">
            
            <!-- Arama Input -->
            <div class="flex gap-2 mb-4">
              <input 
                v-model="searchTerm" 
                type="text" 
                placeholder="Örn: Ahmet Yılmaz" 
                class="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-primary-500 focus:border-primary-500"
                @keyup.enter="searchUser"
              >
              <button 
                @click="searchUser" 
                :disabled="loading"
                class="bg-gray-100 text-gray-800 px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition"
              >
                {{ loading ? '...' : 'Ara' }}
              </button>
            </div>
    
            <!-- Hata Mesajı -->
            <p v-if="message" class="text-center text-gray-500 text-sm py-4">{{ message }}</p>
    
            <!-- Sonuç Listesi -->
            <div v-if="searchResults.length > 0" class="space-y-3">
              <div v-for="user in searchResults" :key="user.id" class="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition group">
                
                <div class="flex items-center gap-3">
                  <img :src="user.avatar_url || 'https://via.placeholder.com/150'" class="w-10 h-10 rounded-full object-cover border border-gray-200">
                  <div>
                    <h4 class="font-bold text-gray-900 text-sm">{{ user.full_name }}</h4>
                    <p class="text-xs text-gray-500">{{ user.profession || 'Kullanıcı' }}</p>
                  </div>
                </div>
    
                <button 
                  @click="addStaff(user)"
                  class="bg-primary-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-primary-700 shadow-sm"
                >
                  Seç +
                </button>
              </div>
            </div>
    
          </div>
        </div>
      </div>
    </template>