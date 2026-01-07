<script setup>
  import { onMounted, ref, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { supabase } from '../supabase'
  import DefaultLayout from '../layouts/DefaultLayout.vue'
  
  const route = useRoute()
  const business = ref(null)
  const services = ref([])
  const staffList = ref([])
  const loading = ref(true)
  
  // Sekme Yönetimi
  const activeTab = ref('services') // 'services', 'staff', 'products', 'reviews'
  
  onMounted(async () => {
    try {
      const slug = route.params.slug
      
      // 1. İŞLETME DETAYI
      const { data: bData, error: bError } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', slug)
        .single()
  
      if (bError) throw bError
      business.value = bData
  
      // 2. HİZMETLERİ ÇEK (Sadece aktif olanlar)
      const { data: sData } = await supabase
        .from('business_services')
        .select('*')
        .eq('business_id', bData.id)
        .eq('is_active', true)
        .order('price', { ascending: true })
      
      if (sData) services.value = sData
  
      // 3. PERSONELİ ÇEK (Profil bilgileriyle birlikte)
      const { data: stData } = await supabase
        .from('business_staff')
        .select(`
          id,
          title,
          working_hours,
          profiles:user_id ( id, full_name, avatar_url, role, profession )
        `)
        .eq('business_id', bData.id)
        .eq('is_active', true)
      
      if (stData) staffList.value = stData
  
    } catch (error) {
      console.error('Veri hatası:', error)
    } finally {
      loading.value = false
    }
  })
  
  // Uzman Publisher mı kontrolü
  const isPublisher = (staffMember) => {
    return staffMember.profiles?.role === 'publisher'
  }
  </script>
  
  <template>
    <DefaultLayout>
      
      <!-- YÜKLENİYOR -->
      <div v-if="loading" class="flex justify-center items-center h-screen">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
  
      <!-- BULUNAMADI -->
      <div v-else-if="!business" class="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <h1 class="text-4xl font-bold text-gray-300 mb-2">404</h1>
        <p class="text-gray-500 text-lg">Aradığınız işletme bulunamadı.</p>
        <router-link to="/" class="mt-6 text-primary-600 font-medium hover:underline">Anasayfaya Dön</router-link>
      </div>
  
      <!-- VİTRİN İÇERİĞİ -->
      <div v-else class="pb-24">
        
        <!-- HERO & HEADER (Aynı kaldı) -->
        <div class="relative h-64 md:h-96 w-full bg-gray-200 overflow-hidden group">
          <img v-if="business.cover_url" :src="business.cover_url" class="w-full h-full object-cover transition duration-700 group-hover:scale-105">
          <div v-else class="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center">
            <span class="text-white/10 text-6xl font-bold tracking-widest uppercase select-none">{{ business.name }}</span>
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </div>
  
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div class="flex flex-col md:flex-row items-start gap-6 -mt-20 mb-8">
            <div class="relative z-10 w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white p-1.5 shadow-xl flex-shrink-0">
              <img v-if="business.logo_url" :src="business.logo_url" class="w-full h-full object-cover rounded-xl bg-gray-50 border border-gray-100">
              <div v-else class="w-full h-full rounded-xl bg-primary-50 flex items-center justify-center text-5xl border border-primary-100">🏢</div>
            </div>
  
            <div class="flex-1 pt-2 md:pt-24 w-full">
              <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <h1 class="text-3xl md:text-4xl font-bold text-gray-900 font-serif leading-tight">{{ business.name }}</h1>
                  <div class="flex items-center gap-2 mt-2 text-gray-500 font-medium">
                    <span>📍 {{ business.district ? business.district + ' /' : '' }} {{ business.city }}</span>
                  </div>
                  <p v-if="business.description" class="mt-4 text-gray-600 leading-relaxed max-w-2xl">{{ business.description }}</p>
                </div>
  
                <div class="flex flex-wrap gap-3 mt-2 w-full md:w-auto">
                  <a v-if="business.phone" :href="`tel:${business.phone}`" class="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-bold transition shadow-md shadow-primary-200">Ara</a>
                  <a v-if="business.phone" :href="`https://wa.me/${business.phone.replace(/\s+/g, '').replace('+', '')}`" target="_blank" class="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#25D366] text-white hover:bg-[#128C7E] px-5 py-2.5 rounded-lg font-bold transition shadow-md shadow-green-100">WhatsApp</a>
                  <a v-if="business.maps_url" :href="business.maps_url" target="_blank" class="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-primary-600 px-5 py-2.5 rounded-lg font-medium transition shadow-sm">Yol Tarifi</a>
                  <a v-if="business.instagram_url" :href="business.instagram_url" target="_blank" class="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-pink-600 px-5 py-2.5 rounded-lg font-medium transition shadow-sm">IG</a>
                </div>
              </div>
              
              <div v-if="business.address" class="mt-6 pt-6 border-t border-gray-100">
                <p class="text-gray-600 text-sm">📍 {{ business.address }}</p>
              </div>
            </div>
          </div>
        </div>
  
        <!-- 3. ALT SEKMELER VE İÇERİK -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          
          <!-- Sekme Butonları -->
          <div class="border-b border-gray-200 mb-8 overflow-x-auto">
            <nav class="flex space-x-8 min-w-max">
              <button 
                @click="activeTab = 'services'"
                class="pb-4 font-bold text-sm border-b-2 transition"
                :class="activeTab === 'services' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
              >
                Hizmetler & Fiyatlar
              </button>
              <button 
                @click="activeTab = 'staff'"
                class="pb-4 font-bold text-sm border-b-2 transition"
                :class="activeTab === 'staff' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
              >
                Uzman Kadromuz
              </button>
              <!-- Gelecek özellikler için pasif butonlar -->
              <button class="border-transparent text-gray-400 px-2 pb-4 font-medium text-sm cursor-not-allowed">Ürünler (Yakında)</button>
              <button class="border-transparent text-gray-400 px-2 pb-4 font-medium text-sm cursor-not-allowed">Yorumlar (Yakında)</button>
            </nav>
          </div>
  
          <!-- TAB 1: HİZMETLER -->
          <div v-if="activeTab === 'services'" class="animate-fade-in">
            <div v-if="services.length === 0" class="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p class="text-gray-500">Bu işletme henüz hizmet listesi eklememiş.</p>
            </div>
  
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="service in services" :key="service.id" class="bg-white border border-gray-100 rounded-xl p-5 hover:border-primary-200 hover:shadow-md transition flex justify-between items-center group">
                <div>
                  <h3 class="font-bold text-gray-900 group-hover:text-primary-600 transition">{{ service.name }}</h3>
                  <p class="text-sm text-gray-500 mt-1">{{ service.duration }} dk • {{ service.description }}</p>
                </div>
                <div class="text-right">
                  <span class="block text-lg font-bold text-gray-900">₺{{ service.price }}</span>
                  <!-- Randevu Butonu (Şimdilik işlevsiz, V2'de aktif olacak) -->
                  <button class="mt-2 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-md font-bold hover:bg-primary-600 transition">
                    Randevu Al
                  </button>
                </div>
              </div>
            </div>
          </div>
  
          <!-- TAB 2: UZMAN KADROSU -->
          <div v-if="activeTab === 'staff'" class="animate-fade-in">
            <div v-if="staffList.length === 0" class="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p class="text-gray-500">Henüz uzman eklenmemiş.</p>
            </div>
  
            <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <!-- 
                DİNAMİK COMPONENT KULLANIMI:
                Eğer publisher ise 'router-link', değilse 'div' olur.
              -->
              <component 
                :is="isPublisher(staff) ? 'router-link' : 'div'"
                v-for="staff in staffList" 
                :key="staff.id"
                :to="isPublisher(staff) ? `/profile/${staff.profiles.id}` : null"
                class="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition group relative"
                :class="isPublisher(staff) ? 'cursor-pointer hover:border-primary-300' : 'cursor-default'"
              >
                <!-- Avatar -->
                <div class="aspect-square bg-gray-100 relative">
                  <img 
                    :src="staff.profiles.avatar_url || 'https://via.placeholder.com/300'" 
                    class="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  >
                  <!-- Publisher Rozeti -->
                  <div v-if="isPublisher(staff)" class="absolute top-2 right-2 bg-white/90 backdrop-blur text-primary-600 text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
                    Yayıncı ✨
                  </div>
                </div>
                
                <!-- Bilgiler -->
                <div class="p-4 text-center">
                  <h3 class="font-bold text-gray-900">{{ staff.profiles.full_name }}</h3>
                  <p class="text-primary-600 text-sm font-medium mb-2">{{ staff.title || staff.profiles.profession }}</p>
                  
                  <!-- Link Uyarısı (Sadece Publisher ise görünür) -->
                  <span v-if="isPublisher(staff)" class="text-xs text-gray-400 group-hover:text-primary-500 transition flex items-center justify-center gap-1">
                    Profili İncele <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                  </span>
                </div>
              </component>
            </div>
          </div>
  
        </div>
  
      </div>
    </DefaultLayout>
  </template>