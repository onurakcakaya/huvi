<script setup>
    import { onMounted, ref, computed } from 'vue'
    import { supabase } from '../supabase'
    import { useAuthStore } from '../stores/auth'
    import DefaultLayout from '../layouts/DefaultLayout.vue'
    import AppointmentCalendar from '../components/AppointmentCalendar.vue' // BİLEŞENİ ÇAĞIRDIK
    
    const authStore = useAuthStore()
    const loading = ref(true)
    const appointments = ref([])
    const activeTab = ref('pending') 
    const filterMyStaffOnly = ref(false)
    const selectedDateFilter = ref(null) // Takvimden gelen veri burada tutulacak
    
    // İstatistikler
    const stats = computed(() => {
      return {
        pending: appointments.value.filter(a => a.status === 'pending').length,
        approved: appointments.value.filter(a => a.status === 'approved').length
      }
    })
    
    // Takvimden Gelen Filtreleme İsteği
    const handleCalendarFilter = (date) => {
      selectedDateFilter.value = date
    }
    
    // VERİLERİ ÇEK
    const fetchBusinessAppointments = async () => {
      loading.value = true
      try {
        const userId = authStore.user.id
        let businessId = null
        
        const { data: ownerData } = await supabase.from('businesses').select('id').eq('owner_id', userId).maybeSingle()
        if (ownerData) businessId = ownerData.id
        
        if (!businessId) {
          const { data: staffData } = await supabase.from('business_staff').select('business_id').eq('user_id', userId).maybeSingle()
          if (staffData) businessId = staffData.business_id
        }
    
        if (!businessId) throw new Error('İşletme yetkisi bulunamadı.')
    
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            profiles:customer_id ( full_name, avatar_url, contact_email ),
            business_services ( name, price, duration ),
            business_staff ( id, user_id, title, profiles ( full_name ) )
          `)
          .eq('business_id', businessId)
          .order('appointment_date', { ascending: true })
          .order('start_time', { ascending: true })
    
        if (error) throw error
        appointments.value = data
    
      } catch (error) {
        console.error('Veri hatası:', error.message)
      } finally {
        loading.value = false
      }
    }
    
    // LİSTEYİ FİLTRELEME
    const filteredAppointments = computed(() => {
      let list = appointments.value
    
      // 1. Tarih Filtresi (Takvimden geldiyse)
      if (selectedDateFilter.value) {
        list = list.filter(a => a.appointment_date === selectedDateFilter.value)
      }
    
      // 2. Durum Filtresi (Sekmeler)
      if (activeTab.value === 'pending') {
        list = list.filter(a => a.status === 'pending')
      } else if (activeTab.value === 'approved') {
        list = list.filter(a => a.status === 'approved')
      } else {
        list = list.filter(a => ['completed', 'rejected', 'cancelled'].includes(a.status))
      }
    
      // 3. Personel Filtresi
      if (filterMyStaffOnly.value) {
        list = list.filter(a => a.business_staff.user_id === authStore.user.id)
      }
    
      return list
    })
    
    const updateStatus = async (id, newStatus) => {
      if (newStatus === 'rejected' && !confirm('Randevuyu reddetmek istediğinize emin misiniz?')) return
      if (newStatus === 'completed' && !confirm('Hizmet tamamlandı olarak işaretlensin mi?')) return
    
      try {
        const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id)
        if (error) throw error
        const index = appointments.value.findIndex(a => a.id === id)
        if (index !== -1) appointments.value[index].status = newStatus
      } catch (error) {
        alert('Hata: ' + error.message)
      }
    }
    
    const formatDate = (dateString) => {
      const options = { weekday: 'short', month: 'long', day: 'numeric' }
      return new Date(dateString).toLocaleDateString('tr-TR', options)
    }
    
    onMounted(() => {
      fetchBusinessAppointments()
    })
    </script>
    
    <template>
      <DefaultLayout>
        <div class="max-w-6xl mx-auto px-4 py-8 pb-24">
          
          <!-- Header -->
          <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span class="text-3xl">📅</span> Randevu Yönetimi
              </h1>
              <p class="text-gray-500 mt-1">Gelen talepleri yönetin ve takviminizi planlayın.</p>
            </div>
    
            <label class="flex items-center gap-3 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm cursor-pointer hover:border-gray-300 select-none">
              <span class="text-sm font-bold text-gray-700">Sadece Bana Atananlar</span>
              <div class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="filterMyStaffOnly" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </div>
            </label>
          </div>
    
          <!-- Loading -->
          <div v-if="loading" class="flex justify-center py-20">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
    
          <div v-else>
            
            <!-- YENİ BİLEŞEN: TAKVİM -->
            <!-- randevuları gönderiyoruz, filtreleme emrini dinliyoruz -->
            <AppointmentCalendar 
              :appointments="appointments" 
              @filter="handleCalendarFilter"
            />
    
            <!-- Sekmeler (Tabs) -->
            <div class="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6 w-full md:w-fit overflow-x-auto">
              <button 
                @click="activeTab = 'pending'"
                class="px-6 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 whitespace-nowrap"
                :class="activeTab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'"
              >
                Bekleyenler
                <span v-if="stats.pending > 0" class="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">{{ stats.pending }}</span>
              </button>
              
              <button 
                @click="activeTab = 'approved'"
                class="px-6 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 whitespace-nowrap"
                :class="activeTab === 'approved' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'"
              >
                Onaylananlar
                <span v-if="stats.approved > 0" class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{{ stats.approved }}</span>
              </button>
    
              <button 
                @click="activeTab = 'history'"
                class="px-6 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap"
                :class="activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'"
              >
                Geçmiş
              </button>
            </div>
    
            <!-- BOŞ DURUM -->
            <div v-if="filteredAppointments.length === 0" class="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
              <p class="text-5xl mb-4">📭</p>
              <p class="text-gray-500 font-medium">Bu kriterlere uygun randevu bulunmuyor.</p>
              <button v-if="selectedDateFilter" @click="selectedDateFilter = null" class="mt-2 text-primary-600 font-bold hover:underline">Tümünü Göster</button>
            </div>
    
            <!-- LİSTE -->
            <div v-else class="grid grid-cols-1 gap-4">
              <div 
                v-for="app in filteredAppointments" 
                :key="app.id"
                class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                :class="{'border-l-4 border-l-yellow-400': app.status === 'pending', 'border-l-4 border-l-green-500': app.status === 'approved'}"
              >
                <!-- (Liste İçeriği Aynı Kaldı) -->
                 <div class="flex items-center gap-4">
                  <img :src="app.profiles?.avatar_url || 'https://via.placeholder.com/150'" class="w-14 h-14 rounded-full object-cover border border-gray-100">
                  <div>
                    <h3 class="font-bold text-gray-900 text-lg">{{ app.profiles?.full_name }}</h3>
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mt-0.5">
                      <span class="font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded">{{ app.business_services?.name }}</span>
                      <span>•</span>
                      <span>{{ app.business_services?.duration }} dk</span>
                      <span>•</span>
                      <span>₺{{ app.business_services?.price }}</span>
                    </div>
                    <p v-if="app.customer_note" class="text-xs text-gray-400 italic mt-1 bg-gray-50 inline-block px-2 py-1 rounded">
                      "{{ app.customer_note }}"
                    </p>
                  </div>
                </div>
    
                <div class="flex flex-col md:items-end gap-1 text-gray-700">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">🗓️</span>
                    <span class="font-bold">{{ formatDate(app.appointment_date) }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-sm">
                    <span class="text-lg">⏰</span>
                    <span>{{ app.start_time.slice(0,5) }} - {{ app.end_time.slice(0,5) }}</span>
                  </div>
                  <div class="text-xs text-gray-400 mt-1 md:text-right">
                    Uzman: <span class="text-gray-600 font-bold">{{ app.business_staff?.profiles?.full_name }}</span>
                  </div>
                </div>
    
                <div class="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                  <template v-if="app.status === 'pending'">
                    <button @click="updateStatus(app.id, 'rejected')" class="flex-1 md:flex-none px-4 py-2 border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 transition text-sm">Reddet</button>
                    <button @click="updateStatus(app.id, 'approved')" class="flex-1 md:flex-none px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition shadow-lg shadow-green-200 text-sm">Onayla ✅</button>
                  </template>
    
                  <template v-if="app.status === 'approved'">
                    <button @click="updateStatus(app.id, 'cancelled')" class="flex-1 md:flex-none px-4 py-2 text-gray-400 hover:text-red-500 text-xs font-medium">İptal Et</button>
                    <button @click="updateStatus(app.id, 'completed')" class="flex-1 md:flex-none px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition text-sm flex items-center gap-2">
                      <span>Tamamla</span>
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    </button>
                  </template>
    
                  <span v-if="['completed'].includes(app.status)" class="text-green-600 font-bold text-sm flex items-center gap-1">
                    Tamamlandı <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </span>
                  <span v-if="['rejected', 'cancelled'].includes(app.status)" class="text-gray-400 font-medium text-sm">
                    {{ app.status === 'rejected' ? 'Reddedildi' : 'İptal Edildi' }}
                  </span>
                </div>
              </div>
            </div>
    
          </div>
        </div>
      </DefaultLayout>
    </template>