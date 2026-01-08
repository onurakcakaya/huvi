<script setup>
    import { onMounted, ref, computed } from 'vue'
    import { supabase } from '../supabase'
    import { useAuthStore } from '../stores/auth'
    import DefaultLayout from '../layouts/DefaultLayout.vue'
    
    const authStore = useAuthStore()
    const loading = ref(true)
    const appointments = ref([])
    const activeTab = ref('active') // 'active' (Gelecek) | 'past' (Geçmiş)
    
    // DURUM RENKLERİ VE METİNLERİ
    const statusConfig = {
      pending:   { label: 'Onay Bekliyor', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      approved:  { label: 'Onaylandı',     class: 'bg-green-100 text-green-800 border-green-200' },
      rejected:  { label: 'Reddedildi',    class: 'bg-red-100 text-red-800 border-red-200' },
      cancelled: { label: 'İptal Edildi',  class: 'bg-gray-100 text-gray-600 border-gray-200' },
      completed: { label: 'Tamamlandı',    class: 'bg-blue-100 text-blue-800 border-blue-200' }
    }
    
    // VERİ ÇEKME
    const fetchAppointments = async () => {
      loading.value = true
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            businesses ( name, slug, city, district, logo_url ),
            business_services ( name, price, duration ),
            business_staff ( 
              title,
              profiles ( full_name, avatar_url )
            )
          `)
          .eq('customer_id', authStore.user.id)
          .order('appointment_date', { ascending: false }) // En yeni en üstte
          .order('start_time', { ascending: false })
    
        if (error) throw error
        appointments.value = data
    
      } catch (error) {
        console.error('Randevu hatası:', error.message)
      } finally {
        loading.value = false
      }
    }
    
    // LİSTELERİ AYIRMA (Computed)
    const activeAppointments = computed(() => {
      return appointments.value.filter(app => ['pending', 'approved'].includes(app.status))
    })
    
    const pastAppointments = computed(() => {
      return appointments.value.filter(app => ['completed', 'rejected', 'cancelled'].includes(app.status))
    })
    
    // RANDEVU İPTAL ETME
    const cancelAppointment = async (id) => {
      if (!confirm('Randevuyu iptal etmek istediğinize emin misiniz?')) return
    
      try {
        const { error } = await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', id)
    
        if (error) throw error
    
        // Listeyi yerel olarak güncelle (Tekrar istek atma)
        const index = appointments.value.findIndex(a => a.id === id)
        if (index !== -1) {
          appointments.value[index].status = 'cancelled'
        }
    
      } catch (error) {
        alert('Hata: ' + error.message)
      }
    }
    
    // Tarih Formatlayıcı
    const formatDate = (dateString) => {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      return new Date(dateString).toLocaleDateString('tr-TR', options)
    }
    
    // Saat Formatlayıcı (HH:MM:SS -> HH:MM)
    const formatTime = (timeString) => {
      return timeString?.slice(0, 5)
    }
    
    onMounted(() => {
      if (authStore.user) fetchAppointments()
    })
    </script>
    
    <template>
      <DefaultLayout>
        <div class="max-w-4xl mx-auto px-4 py-8 pb-24">
          
          <!-- Başlık -->
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span class="text-3xl">📅</span> Randevularım
            </h1>
            <p class="text-gray-500 mt-2">Oluşturduğunuz tüm randevu talepleri ve geçmiş işlemler.</p>
          </div>
    
          <!-- Yükleniyor -->
          <div v-if="loading" class="flex justify-center py-20">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
    
          <div v-else>
            
            <!-- Sekmeler -->
            <div class="flex gap-6 border-b border-gray-200 mb-6">
              <button 
                @click="activeTab = 'active'"
                class="pb-3 text-sm font-bold transition border-b-2"
                :class="activeTab === 'active' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
              >
                Yaklaşan Randevular ({{ activeAppointments.length }})
              </button>
              <button 
                @click="activeTab = 'past'"
                class="pb-3 text-sm font-bold transition border-b-2"
                :class="activeTab === 'past' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
              >
                Geçmiş & İptaller ({{ pastAppointments.length }})
              </button>
            </div>
    
            <!-- LİSTE -->
            <div class="space-y-4">
              
              <!-- Hangi listeyi göstereceğiz? -->
              <div v-if="activeTab === 'active' && activeAppointments.length === 0" class="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                <p class="text-gray-500 text-lg">Aktif bir randevunuz bulunmuyor.</p>
                <router-link to="/" class="mt-4 inline-block text-primary-600 font-bold hover:underline">Hizmetleri Keşfet</router-link>
              </div>
    
              <div v-else-if="activeTab === 'past' && pastAppointments.length === 0" class="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                <p class="text-gray-500 text-lg">Geçmiş randevunuz yok.</p>
              </div>
    
              <div 
                v-for="app in (activeTab === 'active' ? activeAppointments : pastAppointments)" 
                :key="app.id"
                class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition group"
              >
                
                <!-- Üst Kısım: İşletme ve Durum -->
                <div class="flex justify-between items-start mb-4">
                  <div class="flex items-center gap-3">
                    <!-- İşletme Logo -->
                    <img 
                      :src="app.businesses.logo_url || 'https://via.placeholder.com/100'" 
                      class="w-12 h-12 rounded-lg object-cover border border-gray-100"
                    >
                    <div>
                      <h3 class="font-bold text-gray-900 group-hover:text-primary-700 transition">
                        <router-link :to="`/business/${app.businesses.slug}`">{{ app.businesses.name }}</router-link>
                      </h3>
                      <p class="text-xs text-gray-500">{{ app.businesses.district }}, {{ app.businesses.city }}</p>
                    </div>
                  </div>
    
                  <!-- Durum Rozeti -->
                  <span 
                    class="px-3 py-1 rounded-full text-xs font-bold border"
                    :class="statusConfig[app.status]?.class"
                  >
                    {{ statusConfig[app.status]?.label }}
                  </span>
                </div>
    
                <hr class="border-gray-100 mb-4">
    
                <!-- Orta Kısım: Detaylar -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  
                  <!-- Tarih & Saat -->
                  <div class="flex items-center gap-2 text-gray-700">
                    <span class="text-lg">🗓️</span>
                    <div>
                      <p class="font-bold">{{ formatDate(app.appointment_date) }}</p>
                      <p class="text-gray-500">{{ formatTime(app.start_time) }} - {{ formatTime(app.end_time) }}</p>
                    </div>
                  </div>
    
                  <!-- Hizmet -->
                  <div class="flex items-center gap-2 text-gray-700">
                    <span class="text-lg">✂️</span>
                    <div>
                      <p class="font-bold">{{ app.business_services.name }}</p>
                      <p class="text-gray-500">{{ app.business_services.duration }} dk • ₺{{ app.business_services.price }}</p>
                    </div>
                  </div>
    
                  <!-- Uzman -->
                  <div class="flex items-center gap-2 text-gray-700">
                    <img :src="app.business_staff.profiles.avatar_url || 'https://via.placeholder.com/50'" class="w-8 h-8 rounded-full border border-white shadow-sm">
                    <div>
                      <p class="font-bold">{{ app.business_staff.profiles.full_name }}</p>
                      <p class="text-gray-500 text-xs">{{ app.business_staff.title }}</p>
                    </div>
                  </div>
                </div>
    
                <!-- Alt Kısım: Not ve Aksiyon -->
                <div class="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-100 border-dashed">
                  <p v-if="app.customer_note" class="text-xs text-gray-500 italic max-w-md">
                    "{{ app.customer_note }}"
                  </p>
                  <p v-else class="text-xs text-gray-400">Not eklenmemiş.</p>
    
                  <!-- İptal Butonu (Sadece Aktifse) -->
                  <button 
                    v-if="['pending', 'approved'].includes(app.status)"
                    @click="cancelAppointment(app.id)"
                    class="text-red-500 text-sm font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition border border-transparent hover:border-red-100"
                  >
                    Randevuyu İptal Et
                  </button>
                </div>
    
              </div>
    
            </div>
    
          </div>
        </div>
      </DefaultLayout>
    </template>