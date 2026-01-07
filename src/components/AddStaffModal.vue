<script setup>
    import { ref } from 'vue'
    import { supabase } from '../supabase'
    
    const props = defineProps({
      isOpen: Boolean,
      businessId: String
    })
    
    const emit = defineEmits(['close', 'refresh'])
    
    const email = ref('')
    const loading = ref(false)
    const searchResult = ref(null) // Bulunan kullanıcı
    const message = ref('')
    
    // 1. KULLANICI ARA
    const searchUser = async () => {
      if (!email.value) return
      loading.value = true
      message.value = ''
      searchResult.value = null
    
      try {
        // Yazdığımız RPC fonksiyonunu çağırıyoruz
        const { data, error } = await supabase.rpc('find_user_by_email', {
          email_input: email.value
        })
    
        if (error) throw error
    
        if (data && data.length > 0) {
          searchResult.value = data[0]
          message.value = 'Kullanıcı bulundu! 🎉'
        } else {
          message.value = 'Kullanıcı bulunamadı. Lütfen kayıtlı e-posta giriniz.'
        }
    
      } catch (error) {
        console.error(error)
        message.value = 'Arama hatası.'
      } finally {
        loading.value = false
      }
    }
    
    // 2. İŞLETMEYE EKLE
    const addStaff = async () => {
      if (!searchResult.value) return
      loading.value = true
    
      try {
        const { error } = await supabase
          .from('business_staff')
          .insert({
            business_id: props.businessId,
            user_id: searchResult.value.id,
            role: 'staff',
            title: 'Uzman' // Varsayılan ünvan
          })
    
        if (error) {
          if (error.code === '23505') throw new Error('Bu kullanıcı zaten ekli.')
          throw error
        }
    
        // Başarılı
        emit('refresh') // Listeyi yenile
        closeModal()
        
      } catch (error) {
        alert(error.message)
      } finally {
        loading.value = false
      }
    }
    
    const closeModal = () => {
      email.value = ''
      searchResult.value = null
      message.value = ''
      emit('close')
    }
    </script>
    
    <template>
      <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
          
          <div class="bg-gray-900 text-white p-4 flex justify-between items-center">
            <h3 class="font-bold">Yeni Uzman Ekle</h3>
            <button @click="closeModal" class="text-gray-400 hover:text-white">✕</button>
          </div>
    
          <div class="p-6">
            <p class="text-sm text-gray-500 mb-4">
              Eklemek istediğiniz uzmanın sisteme kayıtlı e-posta adresini giriniz.
            </p>
    
            <!-- Arama Alanı -->
            <div class="flex gap-2">
              <input 
                v-model="email" 
                type="email" 
                placeholder="ornek@mail.com" 
                class="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500"
                @keyup.enter="searchUser"
              >
              <button 
                @click="searchUser" 
                :disabled="loading"
                class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200"
              >
                {{ loading ? '...' : 'Ara' }}
              </button>
            </div>
    
            <!-- Mesaj -->
            <p v-if="message" class="text-sm mt-3" :class="searchResult ? 'text-green-600' : 'text-red-500'">
              {{ message }}
            </p>
    
            <!-- Bulunan Kullanıcı Kartı -->
            <div v-if="searchResult" class="mt-6 border border-primary-100 bg-primary-50 rounded-lg p-4 flex items-center gap-4">
              <img 
                :src="searchResult.avatar_url || 'https://via.placeholder.com/150'" 
                class="w-12 h-12 rounded-full object-cover border border-white shadow-sm"
              >
              <div>
                <h4 class="font-bold text-gray-900">{{ searchResult.full_name }}</h4>
                <p class="text-xs text-gray-500">{{ searchResult.role === 'publisher' ? 'Yayıncı / Uzman' : 'Kullanıcı' }}</p>
              </div>
            </div>
    
            <!-- Ekle Butonu -->
            <button 
              v-if="searchResult" 
              @click="addStaff"
              :disabled="loading"
              class="w-full mt-6 bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition"
            >
              {{ loading ? 'Ekleniyor...' : 'Ekibe Ekle' }}
            </button>
    
          </div>
        </div>
      </div>
    </template>