<script setup>
    import { onMounted, ref, watch } from 'vue'
    import { supabase } from '../supabase'
    import DefaultLayout from '../layouts/DefaultLayout.vue'
    import ExploreBusinessCard from '../components/ExploreBusinessCard.vue'
    
    const businesses = ref([])
    const loading = ref(true)
    
    // Arama Kriterleri
    const search = ref({
      location: '', // Nerede? (İl/İlçe)
      service: '',  // Ne istiyor? (Saç, Makyaj)
      date: ''      // Ne zaman?
    })
    
    // Bugünün tarihi (Min date için)
    const minDate = new Date().toISOString().split('T')[0]
    
    // ARAMA FONKSİYONU
    const fetchBusinesses = async () => {
      loading.value = true
      try {
        // Temel Sorgu
        let query = supabase
          .from('businesses')
          .select(`
            *,
            business_services!inner ( name ) 
          `) 
          // !inner join: Eğer hizmet filtresi yazarsa, sadece o hizmete sahip işletmeleri getirir.
    
        // 1. Lokasyon Filtresi (İl veya İlçe içinde arar)
        if (search.value.location) {
          // Postgres 'or' sözdizimi: city.ilike.%...% OR district.ilike.%...%
          const term = `%${search.value.location}%`
          query = query.or(`city.ilike.${term},district.ilike.${term}`)
        }
    
        // 2. Hizmet Filtresi
        if (search.value.service) {
          query = query.ilike('business_services.name', `%${search.value.service}%`)
        }
    
        // Not: Tarih filtresini client-side (JS tarafında) yapabiliriz veya
        // şimdilik sadece görsel olarak bırakabiliriz. V1 Demo için backend tarih filtresi karmaşıktır.
        // Şimdilik tarih seçilse bile tüm işletmeleri gösteriyoruz (Demo kılıfı: "O gün açık olanlar")
    
        const { data, error } = await query
    
        if (error) throw error
        
        // Benzersiz işletmeleri filtrele (Aynı işletme birden fazla hizmetten dolayı çoklu gelebilir)
        // Map ve Set kullanarak unique ID'leri alıyoruz.
        const uniqueBusinesses = Array.from(new Map(data.map(item => [item['id'], item])).values());
        
        businesses.value = uniqueBusinesses
    
      } catch (error) {
        console.error('Arama hatası:', error)
      } finally {
        loading.value = false
      }
    }
    
    // Inputlarda "Enter"a basınca veya butonla ara
    const handleSearch = () => {
      fetchBusinesses()
    }
    
    onMounted(() => {
      fetchBusinesses() // Sayfa açılınca hepsini getir
    })
    </script>
    
    <template>
      <DefaultLayout>
        
        <!-- ÜST ARAMA BÖLÜMÜ (Sticky Header gibi durabilir) -->
        <div class="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div class="max-w-7xl mx-auto px-4 py-6">
            
            <h1 class="text-2xl font-bold text-gray-900 mb-6 hidden md:block">İşletmeleri Keşfet</h1>
    
            <!-- Arama Çubuğu (Airbnb Style) -->
            <div class="bg-white border border-gray-300 rounded-full shadow-lg p-2 flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-gray-200">
              
              <!-- Nerede? -->
              <div class="flex-1 px-4 py-2 w-full">
                <label class="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Nerede?</label>
                <input 
                  v-model="search.location" 
                  type="text" 
                  placeholder="İl veya İlçe ara..." 
                  class="w-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent font-medium"
                  @keyup.enter="handleSearch"
                >
              </div>
    
              <!-- Ne Zaman? -->
              <div class="flex-1 px-4 py-2 w-full">
                <label class="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Ne Zaman?</label>
                <input 
                  v-model="search.date" 
                  type="date" 
                  :min="minDate"
                  class="w-full text-sm text-gray-700 focus:outline-none bg-transparent font-medium"
                >
              </div>
    
              <!-- Ne İstiyorsun? -->
              <div class="flex-1 px-4 py-2 w-full">
                <label class="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">İşlem?</label>
                <input 
                  v-model="search.service" 
                  type="text" 
                  placeholder="Saç, Makyaj, Bakım..." 
                  class="w-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent font-medium"
                  @keyup.enter="handleSearch"
                >
              </div>
    
              <!-- Ara Butonu -->
              <div class="p-2 w-full md:w-auto">
                <button 
                  @click="handleSearch" 
                  class="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white rounded-full p-3 md:px-6 md:py-3 font-bold transition flex items-center justify-center gap-2"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <span class="md:hidden">Ara</span>
                </button>
              </div>
    
            </div>
    
          </div>
        </div>
    
        <!-- İÇERİK ALANI -->
        <div class="max-w-7xl mx-auto px-4 py-8">
          
          <!-- Yükleniyor -->
          <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="n in 6" :key="n" class="bg-gray-100 rounded-xl h-80 animate-pulse"></div>
          </div>
    
          <!-- Sonuç Yok -->
          <div v-else-if="businesses.length === 0" class="text-center py-20">
            <div class="text-6xl mb-4">🔍</div>
            <h3 class="text-xl font-bold text-gray-900">Sonuç Bulunamadı</h3>
            <p class="text-gray-500 mt-2">Arama kriterlerinizi değiştirerek tekrar deneyin.</p>
            <button @click="search = {location:'', service:'', date:''}; fetchBusinesses()" class="mt-4 text-primary-600 font-bold hover:underline">Filtreleri Temizle</button>
          </div>
    
          <!-- İşletme Listesi -->
          <div v-else>
            <p class="text-sm text-gray-500 mb-6">{{ businesses.length }} işletme bulundu.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ExploreBusinessCard 
                v-for="business in businesses" 
                :key="business.id" 
                :business="business" 
              />
            </div>
          </div>
    
        </div>
    
      </DefaultLayout>
    </template>