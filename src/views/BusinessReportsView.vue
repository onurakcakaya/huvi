<script setup>
    import { onMounted, ref, computed } from 'vue'
    import { supabase } from '../supabase'
    import { useAuthStore } from '../stores/auth'
    import DefaultLayout from '../layouts/DefaultLayout.vue'
    
    const authStore = useAuthStore()
    const loading = ref(true)
    const appointments = ref([])
    const dateFilter = ref('month') // 'month' (Bu Ay) | 'all' (Tüm Zamanlar)
    
    // VERİ ÇEKME
    const fetchCompletedAppointments = async () => {
      loading.value = true
      try {
        const userId = authStore.user.id
        
        // 1. İşletme ID Bul
        const { data: ownerData } = await supabase.from('businesses').select('id').eq('owner_id', userId).single()
        if (!ownerData) throw new Error('Yetkisiz erişim.')
    
        // 2. Sadece "Completed" randevuları çek
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            final_price,
            payment_method,
            appointment_date,
            business_services ( name ),
            business_staff ( 
              profiles ( full_name, avatar_url )
            )
          `)
          .eq('business_id', ownerData.id)
          .eq('status', 'completed') // Sadece tamamlananlar para kazandırır
    
        if (error) throw error
        appointments.value = data
    
      } catch (error) {
        console.error('Rapor hatası:', error)
      } finally {
        loading.value = false
      }
    }
    
    // ----------------------------------------------------
    // HESAPLAMA MOTORU (COMPUTED) 🧮
    // ----------------------------------------------------
    
    // 1. Filtrelenmiş Liste (Tarihe Göre)
    const filteredList = computed(() => {
      if (dateFilter.value === 'all') return appointments.value
    
      // Bu Ayın başı ve sonu
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    
      return appointments.value.filter(a => a.appointment_date >= startOfMonth && a.appointment_date <= endOfMonth)
    })
    
    // 2. Finansal Özet
    const financialStats = computed(() => {
      const totalRevenue = filteredList.value.reduce((sum, item) => sum + (item.final_price || 0), 0)
      const cashRevenue = filteredList.value.filter(i => i.payment_method === 'cash').reduce((sum, item) => sum + (item.final_price || 0), 0)
      const cardRevenue = filteredList.value.filter(i => i.payment_method === 'credit_card').reduce((sum, item) => sum + (item.final_price || 0), 0)
      const totalCount = filteredList.value.length
    
      return { totalRevenue, cashRevenue, cardRevenue, totalCount }
    })
    
    // 3. Personel Performansı
    const staffPerformance = computed(() => {
      const stats = {}
      
      filteredList.value.forEach(app => {
        const name = app.business_staff?.profiles?.full_name || 'Bilinmiyor'
        const avatar = app.business_staff?.profiles?.avatar_url
        const price = app.final_price || 0
    
        if (!stats[name]) stats[name] = { name, avatar, revenue: 0, count: 0 }
        stats[name].revenue += price
        stats[name].count += 1
      })
    
      // Ciroya göre sırala (En çok kazandıran en üstte)
      return Object.values(stats).sort((a, b) => b.revenue - a.revenue)
    })
    
    // 4. Hizmet Popülaritesi
    const serviceStats = computed(() => {
      const stats = {}
      
      filteredList.value.forEach(app => {
        const name = app.business_services?.name || 'Silinmiş Hizmet'
        if (!stats[name]) stats[name] = 0
        stats[name] += 1
      })
    
      // Sayıya göre sırala
      return Object.entries(stats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5) // İlk 5 hizmet
    })
    
    onMounted(() => {
      fetchCompletedAppointments()
    })
    </script>
    
    <template>
      <DefaultLayout>
        <div class="max-w-6xl mx-auto px-4 py-8 pb-24">
          
          <!-- Header -->
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span class="text-3xl">📈</span> Kasa & Raporlar
              </h1>
              <p class="text-gray-500 mt-1">İşletmenizin finansal durumunu inceleyin.</p>
            </div>
    
            <!-- Filtre -->
            <div class="bg-gray-100 p-1 rounded-lg flex">
              <button 
                @click="dateFilter = 'month'"
                class="px-4 py-2 rounded-md text-sm font-bold transition"
                :class="dateFilter === 'month' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'"
              >
                Bu Ay
              </button>
              <button 
                @click="dateFilter = 'all'"
                class="px-4 py-2 rounded-md text-sm font-bold transition"
                :class="dateFilter === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'"
              >
                Tüm Zamanlar
              </button>
            </div>
          </div>
    
          <!-- Loading -->
          <div v-if="loading" class="flex justify-center py-20">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
    
          <div v-else>
            
            <!-- 1. BÜYÜK KARTLAR (Scorecards) -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <!-- Toplam Ciro -->
              <div class="bg-gray-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                <div class="relative z-10">
                  <p class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Toplam Ciro</p>
                  <h2 class="text-4xl font-bold">₺{{ financialStats.totalRevenue.toLocaleString() }}</h2>
                  <p class="text-gray-400 text-sm mt-2">{{ financialStats.totalCount }} işlem tamamlandı</p>
                </div>
                <div class="absolute right-[-20px] bottom-[-20px] text-8xl opacity-10">💰</div>
              </div>
    
              <!-- Nakit -->
              <div class="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <p class="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Nakit Kasa</p>
                  <h2 class="text-3xl font-bold text-green-600">₺{{ financialStats.cashRevenue.toLocaleString() }}</h2>
                </div>
                <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">💵</div>
              </div>
    
              <!-- Kart -->
              <div class="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <p class="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Kredi Kartı</p>
                  <h2 class="text-3xl font-bold text-blue-600">₺{{ financialStats.cardRevenue.toLocaleString() }}</h2>
                </div>
                <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">💳</div>
              </div>
            </div>
    
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <!-- 2. PERSONEL PERFORMANSI -->
              <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 class="font-bold text-gray-900 text-lg mb-4">🏆 Personel Performansı</h3>
                
                <div class="space-y-4">
                  <div v-for="(staff, index) in staffPerformance" :key="staff.name" class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <span class="text-gray-400 font-bold text-sm w-4">{{ index + 1 }}.</span>
                      <img :src="staff.avatar || 'https://via.placeholder.com/150'" class="w-10 h-10 rounded-full object-cover border border-gray-100">
                      <div>
                        <p class="font-bold text-gray-900 text-sm">{{ staff.name }}</p>
                        <p class="text-xs text-gray-500">{{ staff.count }} işlem</p>
                      </div>
                    </div>
                    <span class="font-bold text-gray-900">₺{{ staff.revenue.toLocaleString() }}</span>
                  </div>
    
                  <div v-if="staffPerformance.length === 0" class="text-gray-400 text-sm text-center py-4">
                    Henüz veri yok.
                  </div>
                </div>
              </div>
    
              <!-- 3. HİZMET POPÜLARİTESİ -->
              <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 class="font-bold text-gray-900 text-lg mb-4">🔥 Popüler Hizmetler</h3>
                
                <div class="space-y-3">
                  <div v-for="service in serviceStats" :key="service.name" class="group">
                    <div class="flex justify-between text-sm mb-1">
                      <span class="font-medium text-gray-700">{{ service.name }}</span>
                      <span class="font-bold text-gray-900">{{ service.count }} kez</span>
                    </div>
                    <!-- Basit Progress Bar -->
                    <div class="w-full bg-gray-100 rounded-full h-2.5">
                      <div 
                        class="bg-primary-600 h-2.5 rounded-full transition-all duration-1000" 
                        :style="`width: ${(service.count / filteredList.length) * 100}%`"
                      ></div>
                    </div>
                  </div>
    
                  <div v-if="serviceStats.length === 0" class="text-gray-400 text-sm text-center py-4">
                    Henüz veri yok.
                  </div>
                </div>
              </div>
    
            </div>
    
          </div>
        </div>
      </DefaultLayout>
    </template>