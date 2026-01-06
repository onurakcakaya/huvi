<script setup>
    import { ref, onMounted, computed } from 'vue'
    import { supabase } from '../../supabase'
    import { useAuthStore } from '../../stores/auth'
    
    const authStore = useAuthStore()
    
    // State'ler
    const loading = ref(true)
    const business = ref(null)
    const staffList = ref([])
    const message = ref('')
    
    // Modal ve Arama State'leri
    const showAddModal = ref(false)
    const searchEmail = ref('')
    const searching = ref(false)
    const foundUser = ref(null) // Bulunan kullanıcı burada saklanacak
    const newStaffTitle = ref('') // User ise girilen unvan
    const adding = ref(false)
    
    // 1. İşletme ve Personel Listesini Çek
    const fetchData = async () => {
      try {
        loading.value = true
        
        // Önce kullanıcının işletmesini bul (Business ID lazım)
        const { data: busData, error: busError } = await supabase
          .from('businesses')
          .select('id, name')
          .eq('owner_id', authStore.user.id)
          .single()
    
        if (busError) throw busError
        business.value = busData
    
        // Şimdi bu işletmenin personellerini çek (İlişkili Tablo: profiles)
        const { data: staffData, error: staffError } = await supabase
          .from('business_staff')
          .select(`
            id,
            custom_title,
            is_active,
            created_at,
            profiles:user_id (id, full_name, avatar_url, role, profession)
          `)
          .eq('business_id', busData.id)
          .eq('is_active', true) // Sadece aktifleri getir (İsteğe bağlı)
    
        if (staffError) throw staffError
        staffList.value = staffData
    
      } catch (error) {
        console.error('Veri çekme hatası:', error)
      } finally {
        loading.value = false
      }
    }
    
    // 2. E-Posta ile Kullanıcı Ara (RPC Fonksiyonu)
    const handleSearch = async () => {
      if (!searchEmail.value) return
      
      try {
        searching.value = true
        foundUser.value = null
        message.value = ''
    
        const { data, error } = await supabase.rpc('get_profile_by_email', {
          email_input: searchEmail.value
        })
    
        if (error) throw error
    
        // RPC bir array döner, ilk elemanı alalım
        if (data && data.length > 0) {
          const user = data[0]
          
          // KENDİNİ EKLEMESİNİ ENGELLE
          if (user.id === authStore.user.id) {
            message.value = 'Kendinizi personel olarak ekleyemezsiniz.'
            return
          }
    
          // ZATEN EKLİ Mİ KONTROL ET
          const isAlreadyAdded = staffList.value.some(staff => staff.profiles.id === user.id)
          if (isAlreadyAdded) {
            message.value = 'Bu kullanıcı zaten ekibinizde ekli.'
            return
          }
    
          foundUser.value = user
          
          // Eğer Publisher ise unvanı otomatik kendi mesleği olsun
          if (user.role === 'publisher') {
            newStaffTitle.value = user.profession || 'Uzman'
          } else {
            newStaffTitle.value = '' // User ise boş gelsin, işletme sahibi yazsın
          }
    
        } else {
          message.value = 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.'
        }
    
      } catch (error) {
        message.value = 'Arama hatası: ' + error.message
      } finally {
        searching.value = false
      }
    }
    
    // 3. Ekibe Dahil Et (Insert)
    const addStaffMember = async () => {
      if (!foundUser.value) return
    
      try {
        adding.value = true
        
        // Publisher ise unvanı boş gönderelim (Vitrin profilinden çekeceksek)
        // Ya da veritabanına kaydedelim, tercih senin. Kodda kaydediyoruz.
        
        const { error } = await supabase
          .from('business_staff')
          .insert({
            business_id: business.value.id,
            user_id: foundUser.value.id,
            custom_title: newStaffTitle.value, // Girilen unvan
            is_active: true
          })
    
        if (error) throw error
    
        // Başarılı! Modalı kapat ve listeyi yenile
        showAddModal.value = false
        searchEmail.value = ''
        foundUser.value = null
        await fetchData()
        alert('Personel başarıyla eklendi! 🎉')
    
      } catch (error) {
        alert('Hata: ' + error.message)
      } finally {
        adding.value = false
      }
    }
    
    // 4. Personeli Çıkar (Sil)
    const removeStaff = async (staffId) => {
      if (!confirm('Bu personeli ekipten çıkarmak istediğinize emin misiniz?')) return
    
      try {
        const { error } = await supabase
          .from('business_staff')
          .delete()
          .eq('id', staffId)
    
        if (error) throw error
        
        // Listeden sil (Tekrar fetch yapmaya gerek yok)
        staffList.value = staffList.value.filter(item => item.id !== staffId)
    
      } catch (error) {
        alert('Silme hatası: ' + error.message)
      }
    }
    
    onMounted(() => {
      fetchData()
    })
    </script>
    
    <template>
      <div class="p-6 max-w-6xl mx-auto">
        
        <!-- Başlık ve Buton -->
        <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Ekip Yönetimi</h1>
            <p class="text-gray-500 text-sm mt-1">İşletmenizde hizmet veren uzmanları buradan yönetin.</p>
          </div>
          <button 
            @click="showAddModal = true"
            class="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg"
          >
            <span>+</span> Yeni Personel Ekle
          </button>
        </div>
    
        <!-- Yükleniyor -->
        <div v-if="loading" class="text-center py-20">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
    
        <!-- Personel Listesi (Grid) -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <!-- Personel Kartı -->
          <div v-for="staff in staffList" :key="staff.id" class="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition p-6 relative group">
            
            <!-- Silme Butonu (Hoverda çıkar) -->
            <button 
              @click="removeStaff(staff.id)"
              class="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
              title="Ekipten Çıkar"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
    
            <div class="flex items-center gap-4">
              <!-- Avatar -->
              <img 
                :src="staff.profiles.avatar_url || 'https://via.placeholder.com/150'" 
                class="w-16 h-16 rounded-full object-cover border-2 border-gray-50"
              >
              
              <!-- Bilgiler -->
              <div>
                <h3 class="font-bold text-gray-900">{{ staff.profiles.full_name }}</h3>
                
                <!-- Rol Rozeti -->
                <div class="flex items-center gap-2 mt-1">
                  <span v-if="staff.profiles.role === 'publisher'" class="bg-primary-50 text-primary-600 text-xs px-2 py-0.5 rounded font-bold border border-primary-100">
                    ⭐ Uzman
                  </span>
                  <span v-else class="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded font-bold border border-gray-200">
                    Personel
                  </span>
                </div>
    
                <!-- Unvan (Publisher ise kendi mesleği, User ise atanan unvan) -->
                <p class="text-sm text-gray-500 mt-1">
                  {{ staff.profiles.role === 'publisher' ? staff.profiles.profession : staff.custom_title }}
                </p>
              </div>
            </div>
          </div>
    
          <!-- Liste Boşsa -->
          <div v-if="staffList.length === 0" class="col-span-full text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p class="text-gray-500">Henüz ekibinizde kimse yok. <br> Yeni personel ekleyerek başlayın.</p>
          </div>
    
        </div>
    
        <!-- MODAL (PERSONEL EKLEME) -->
        <div v-if="showAddModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            
            <!-- Kapat -->
            <button @click="showAddModal = false" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
    
            <h2 class="text-xl font-bold mb-1">Yeni Personel Ekle</h2>
            <p class="text-gray-500 text-sm mb-6">Kullanıcının sisteme kayıtlı e-posta adresini girin.</p>
    
            <!-- Adım 1: Arama -->
            <div class="flex gap-2 mb-4">
              <input 
                v-model="searchEmail" 
                @keyup.enter="handleSearch"
                type="email" 
                placeholder="örnek@gmail.com" 
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
              <button 
                @click="handleSearch" 
                :disabled="searching || !searchEmail"
                class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 disabled:opacity-50"
              >
                {{ searching ? '...' : 'Ara' }}
              </button>
            </div>
    
            <!-- Hata/Bilgi Mesajı -->
            <p v-if="message" class="text-sm text-red-500 mb-4 bg-red-50 p-2 rounded">{{ message }}</p>
    
            <!-- Adım 2: Sonuç Bulunduysa -->
            <div v-if="foundUser" class="bg-green-50 border border-green-100 rounded-xl p-4 animate-fade-in-up">
              <div class="flex items-center gap-3 mb-3">
                <img :src="foundUser.avatar_url || 'https://via.placeholder.com/50'" class="w-10 h-10 rounded-full bg-white">
                <div>
                  <p class="font-bold text-gray-900 text-sm">{{ foundUser.full_name }}</p>
                  <span v-if="foundUser.role === 'publisher'" class="text-xs text-primary-600 font-bold">Doğrulanmış Uzman</span>
                  <span v-else class="text-xs text-gray-500">Kullanıcı</span>
                </div>
              </div>
    
              <!-- Unvan Girişi -->
              <div class="mb-4">
                <label class="block text-xs font-bold text-gray-700 mb-1">
                  {{ foundUser.role === 'publisher' ? 'Uzmanlık Alanı (Otomatik)' : 'İşletmedeki Unvanı' }}
                </label>
                <input 
                  v-model="newStaffTitle" 
                  type="text" 
                  :disabled="foundUser.role === 'publisher'"
                  :placeholder="foundUser.role === 'publisher' ? '' : 'Örn: Çırak, Asistan...'"
                  class="w-full px-3 py-2 border border-green-200 rounded bg-white text-sm focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
              </div>
    
              <button 
                @click="addStaffMember" 
                :disabled="adding"
                class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold text-sm transition"
              >
                {{ adding ? 'Ekleniyor...' : 'Ekibe Dahil Et' }}
              </button>
            </div>
    
          </div>
        </div>
    
      </div>
    </template>