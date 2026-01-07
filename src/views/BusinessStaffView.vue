<script setup>
    import { onMounted, ref } from 'vue'
    import { supabase } from '../supabase'
    import { useAuthStore } from '../stores/auth'
    import DefaultLayout from '../layouts/DefaultLayout.vue'
    import AddStaffModal from '../components/AddStaffModal.vue'
    
    const authStore = useAuthStore()
    const staffList = ref([])
    const business = ref(null)
    const loading = ref(true)
    const isModalOpen = ref(false)
    
    // İşletme ID'sini ve Personeli Çek
    const fetchStaff = async () => {
      loading.value = true
      try {
        // 1. Önce kullanıcının işletmesini bulalım
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('id, name')
          .eq('owner_id', authStore.user.id)
          .single()
    
        if (businessError) throw businessError
        business.value = businessData
    
        // 2. Personel listesini çekelim (Profiles ile Join)
        const { data: staffData, error: staffError } = await supabase
          .from('business_staff')
          .select(`
            id,
            role,
            title,
            profiles:user_id ( full_name, avatar_url, contact_email )
          `)
          .eq('business_id', businessData.id)
    
        if (staffError) throw staffError
        staffList.value = staffData
    
      } catch (error) {
        console.error('Hata:', error.message)
      } finally {
        loading.value = false
      }
    }
    
    // Personel Silme
    const removeStaff = async (staffId) => {
      if (!confirm('Bu uzmanı ekipten çıkarmak istediğinize emin misiniz?')) return
    
      const { error } = await supabase
        .from('business_staff')
        .delete()
        .eq('id', staffId)
      
      if (!error) {
        // Listeden sil (Tekrar istek atmaya gerek yok)
        staffList.value = staffList.value.filter(item => item.id !== staffId)
      }
    }
    
    onMounted(() => {
      fetchStaff()
    })
    </script>
    
    <template>
      <DefaultLayout>
        <div class="max-w-6xl mx-auto px-4 py-8">
          
          <!-- Başlık -->
          <div class="flex justify-between items-center mb-8 border-b pb-4">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Ekip Yönetimi</h1>
              <p class="text-gray-500 text-sm mt-1" v-if="business">
                {{ business.name }} çalışanları
              </p>
            </div>
            <button 
              @click="isModalOpen = true"
              class="bg-gray-900 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-black transition flex items-center gap-2"
            >
              <span>+</span> Yeni Uzman Ekle
            </button>
          </div>
    
          <!-- Loading -->
          <div v-if="loading" class="text-center py-20">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          </div>
    
          <!-- Boş Liste -->
          <div v-else-if="staffList.length === 0" class="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <div class="text-5xl mb-4">👥</div>
            <h3 class="text-lg font-bold text-gray-900">Henüz ekip üyesi yok</h3>
            <p class="text-gray-500 text-sm mt-2">Sağ üstteki butondan ilk uzmanınızı ekleyin.</p>
          </div>
    
          <!-- Liste -->
<div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  
  <!-- 
    DEĞİŞİKLİK BURADA: 
    1. 'div' yerine 'router-link' kullandık.
    2. :to="..." ile adresi verdik.
    3. hover efektleri ekledik (border-primary-500).
  -->
  <router-link 
    v-for="staff in staffList" 
    :key="staff.id" 
    :to="`/my-staff/${staff.id}`"
    class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4 hover:border-primary-500 hover:shadow-md transition cursor-pointer group relative"
  >
    
    <!-- Avatar -->
    <img 
      :src="staff.profiles.avatar_url || 'https://via.placeholder.com/150'" 
      class="w-14 h-14 rounded-full object-cover border border-gray-200 group-hover:border-primary-500 transition"
    >
    
    <!-- Bilgiler -->
    <div class="flex-1">
      <h4 class="font-bold text-gray-900 group-hover:text-primary-600 transition">{{ staff.profiles.full_name }}</h4>
      <p class="text-gray-500 text-sm font-medium">{{ staff.title || 'Uzman' }}</p>
      <p class="text-gray-400 text-xs mt-1">{{ staff.profiles.contact_email }}</p>
    </div>

    <!-- 
      SİL BUTONU (Kritik Nokta)
      @click.prevent.stop kullanıyoruz ki kartın link özelliğini tetiklemesin!
    -->
    <button 
      @click.prevent.stop="removeStaff(staff.id)" 
      class="text-gray-300 hover:text-red-500 transition p-2 z-10"
      title="Ekipten Çıkar"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
    </button>

  </router-link>

</div>
    
          <!-- Modal -->
          <AddStaffModal 
            :isOpen="isModalOpen" 
            :businessId="business?.id"
            @close="isModalOpen = false"
            @refresh="fetchStaff"
          />
    
        </div>
      </DefaultLayout>
    </template>