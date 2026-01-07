<script setup>
    import { onMounted, ref } from 'vue'
    import { supabase } from '../supabase'
    import { useAuthStore } from '../stores/auth'
    import DefaultLayout from '../layouts/DefaultLayout.vue'
    import AddServiceModal from '../components/AddServiceModal.vue'
    
    const authStore = useAuthStore()
    const services = ref([])
    const staffList = ref([]) // Modal için gerekli
    const business = ref(null)
    const loading = ref(true)
    const isModalOpen = ref(false)
    
    // VERİLERİ ÇEK
    const fetchData = async () => {
      loading.value = true
      try {
        const userId = authStore.user.id
    
        // 1. İşletme ID'sini bul
        const { data: bData } = await supabase
          .from('businesses')
          .select('id, name')
          .eq('owner_id', userId)
          .single()
        
        if (!bData) throw new Error('İşletme bulunamadı.')
        business.value = bData
    
        // 2. Personelleri Çek (Modal için lazım)
        const { data: sData } = await supabase
          .from('business_staff')
          .select('id, title, profiles(full_name, avatar_url)')
          .eq('business_id', bData.id)
        
        staffList.value = sData
    
        // 3. Hizmetleri Çek (İlişkili personellerle beraber!)
        // Sorgu Açıklaması: Hizmetleri getir, içindeki link tablosunu getir, onun içindeki personeli, onun da profilini getir.
        const { data: serviceData, error: serviceError } = await supabase
          .from('business_services')
          .select(`
            *,
            service_staff_link (
              staff_id,
              business_staff (
                profiles ( avatar_url, full_name )
              )
            )
          `)
          .eq('business_id', bData.id)
          .order('created_at', { ascending: false })
    
        if (serviceError) throw serviceError
        services.value = serviceData
    
      } catch (error) {
        console.error('Veri hatası:', error)
      } finally {
        loading.value = false
      }
    }
    
    // HİZMET SİLME
    const deleteService = async (id) => {
      if (!confirm('Bu hizmeti silmek istediğinize emin misiniz?')) return
    
      const { error } = await supabase
        .from('business_services')
        .delete()
        .eq('id', id)
    
      if (!error) {
        services.value = services.value.filter(s => s.id !== id)
      }
    }
    
    onMounted(() => {
      fetchData()
    })
    </script>
    
    <template>
      <DefaultLayout>
        <div class="max-w-6xl mx-auto px-4 py-8 pb-24">
          
          <!-- Başlık -->
          <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b pb-4">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Hizmetler & Fiyatlar</h1>
              <p class="text-gray-500 text-sm mt-1" v-if="business">{{ business.name }} fiyat listesi yönetimi.</p>
            </div>
            <button 
              @click="isModalOpen = true"
              class="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-black transition flex items-center gap-2 shadow-lg"
            >
              <span>+</span> Yeni Hizmet Ekle
            </button>
          </div>
    
          <!-- Loading -->
          <div v-if="loading" class="flex justify-center py-20">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
    
          <!-- Boş Durum -->
          <div v-else-if="services.length === 0" class="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <div class="text-5xl mb-4">✂️</div>
            <h3 class="text-lg font-bold text-gray-900">Henüz hizmet eklenmemiş</h3>
            <p class="text-gray-500 text-sm mt-2">Müşterilerin randevu alabilmesi için hizmetlerinizi ekleyin.</p>
          </div>
    
          <!-- Hizmet Listesi -->
          <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div v-for="service in services" :key="service.id" class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-primary-500 hover:shadow-md transition group">
              
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-bold text-lg text-gray-900">{{ service.name }}</h3>
                  <p class="text-gray-500 text-sm line-clamp-1">{{ service.description || 'Açıklama yok' }}</p>
                  
                  <div class="flex items-center gap-4 mt-3">
                    <span class="flex items-center gap-1 text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                      🕒 {{ service.duration }} dk
                    </span>
                    <span class="flex items-center gap-1 text-lg font-bold text-primary-600">
                      ₺{{ service.price }}
                    </span>
                  </div>
                </div>
    
                <button 
                  @click="deleteService(service.id)"
                  class="text-gray-300 hover:text-red-500 transition p-1"
                  title="Sil"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
    
              <hr class="border-gray-100 my-4">
    
              <!-- İlişkili Personeller (Avatarlar) -->
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-gray-400 uppercase">Uzmanlar:</span>
                <div class="flex -space-x-2">
                  <img 
                    v-for="link in service.service_staff_link" 
                    :key="link.staff_id"
                    :src="link.business_staff?.profiles?.avatar_url || 'https://via.placeholder.com/150'" 
                    :title="link.business_staff?.profiles?.full_name"
                    class="w-8 h-8 rounded-full border-2 border-white object-cover"
                  >
                </div>
                <span v-if="service.service_staff_link.length === 0" class="text-xs text-red-400 italic">Kimse atanmamış</span>
              </div>
    
            </div>
          </div>
    
          <!-- Modal -->
          <AddServiceModal 
            :isOpen="isModalOpen" 
            :businessId="business?.id"
            :existingStaff="staffList"
            @close="isModalOpen = false"
            @refresh="fetchData"
          />
    
        </div>
      </DefaultLayout>
    </template>