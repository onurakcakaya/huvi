<script setup>
import { onMounted, ref } from 'vue'
import { supabase } from '../supabase'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import ExploreBusinessCard from '../components/ExploreBusinessCard.vue'

const businesses = ref([])
const loading = ref(true)

// Arama Kriterleri
const search = ref({
  location: '', 
  service: '',  
  date: ''      
})

const minDate = new Date().toISOString().split('T')[0]

const fetchBusinesses = async () => {
  loading.value = true
  try {
    let query = supabase
      .from('businesses')
      .select(`*, business_services!inner ( name )`) 

    if (search.value.location) {
      const term = `%${search.value.location}%`
      query = query.or(`city.ilike.${term},district.ilike.${term}`)
    }

    if (search.value.service) {
      query = query.ilike('business_services.name', `%${search.value.service}%`)
    }

    const { data, error } = await query

    if (error) throw error
    
    // Benzersiz işletmeleri filtrele
    const uniqueBusinesses = Array.from(new Map(data.map(item => [item['id'], item])).values());
    businesses.value = uniqueBusinesses

  } catch (error) {
    console.error('Arama hatası:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchBusinesses()
}

onMounted(() => {
  fetchBusinesses() 
})
</script>

<template>
  <DefaultLayout>
    
    <!-- ÜST ARAMA BÖLÜMÜ (Sticky & Responsive) -->
    <div class="bg-white border-b border-gray-200 sticky top-16 z-20 shadow-sm py-4">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h1 class="text-2xl font-bold text-gray-900 mb-4 hidden md:block">İşletmeleri Keşfet</h1>

        <!-- ARAMA KUTUSU (YENİLENMİŞ TASARIM) -->
        <div class="bg-white border border-gray-300 rounded-2xl shadow-lg p-2 flex flex-col md:flex-row md:items-center md:divide-x divide-gray-200 gap-2 md:gap-0">
          
          <!-- 1. Nerede? -->
          <div class="flex-1 px-4 py-2 hover:bg-gray-50 rounded-xl transition cursor-text group">
            <label class="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Nerede?</label>
            <input 
              v-model="search.location" 
              type="text" 
              placeholder="İl veya İlçe ara..." 
              class="w-full text-sm text-gray-700 placeholder-gray-400 bg-transparent font-medium focus:outline-none group-hover:bg-gray-50 transition"
              @keyup.enter="handleSearch"
            >
          </div>

          <!-- 2. Ne Zaman? -->
          <div class="flex-1 px-4 py-2 hover:bg-gray-50 rounded-xl transition cursor-text group border-t md:border-t-0 border-gray-100">
            <label class="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Ne Zaman?</label>
            <input 
              v-model="search.date" 
              type="date" 
              :min="minDate"
              class="w-full text-sm text-gray-700 bg-transparent font-medium focus:outline-none group-hover:bg-gray-50 transition"
            >
          </div>

          <!-- 3. Ne İşlem? -->
          <div class="flex-1 px-4 py-2 hover:bg-gray-50 rounded-xl transition cursor-text group border-t md:border-t-0 border-gray-100">
            <label class="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">İşlem?</label>
            <input 
              v-model="search.service" 
              type="text" 
              placeholder="Saç, Makyaj, Bakım..." 
              class="w-full text-sm text-gray-700 placeholder-gray-400 bg-transparent font-medium focus:outline-none group-hover:bg-gray-50 transition"
              @keyup.enter="handleSearch"
            >
          </div>

          <!-- 4. Ara Butonu -->
          <div class="p-2 w-full md:w-auto">
            <button 
              @click="handleSearch" 
              class="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white rounded-xl md:rounded-full py-3 md:px-8 font-bold transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform active:scale-95"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <span>Ara</span>
            </button>
          </div>

        </div>

      </div>
    </div>

    <!-- İÇERİK ALANI -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      
      <!-- Yükleniyor -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div v-for="n in 6" :key="n" class="bg-gray-100 rounded-2xl h-80 animate-pulse"></div>
      </div>

      <!-- Sonuç Yok -->
      <div v-else-if="businesses.length === 0" class="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-xl font-bold text-gray-900">Sonuç Bulunamadı</h3>
        <p class="text-gray-500 mt-2">Arama kriterlerinizi değiştirerek tekrar deneyin.</p>
        <button @click="search = {location:'', service:'', date:''}; fetchBusinesses()" class="mt-6 text-primary-600 font-bold hover:underline bg-white px-6 py-2 rounded-full shadow-sm border border-gray-200 hover:border-primary-300 transition">
          Filtreleri Temizle
        </button>
      </div>

      <!-- İşletme Listesi -->
      <div v-else>
        <p class="text-sm text-gray-500 mb-6 font-medium">{{ businesses.length }} işletme bulundu.</p>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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