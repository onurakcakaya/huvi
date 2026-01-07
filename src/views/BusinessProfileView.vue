<script setup>
    import { onMounted, ref } from 'vue'
    import { useRoute } from 'vue-router'
    import { supabase } from '../supabase'
    import DefaultLayout from '../layouts/DefaultLayout.vue'
    
    const route = useRoute()
    const business = ref(null)
    const loading = ref(true)
    
    onMounted(async () => {
      try {
        const slug = route.params.slug
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('slug', slug)
          .single()
    
        if (error) throw error
        business.value = data
      } catch (error) {
        console.error('İşletme bulunamadı:', error)
      } finally {
        loading.value = false
      }
    })
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
          <p class="text-gray-500 text-lg">Aradığınız işletme bulunamadı veya kapanmış olabilir.</p>
          <router-link to="/" class="mt-6 text-primary-600 font-medium hover:underline">Anasayfaya Dön</router-link>
        </div>
    
        <!-- VİTRİN İÇERİĞİ -->
        <div v-else class="pb-20">
          
          <!-- 1. KAPAK GÖRSELİ (Hero Section) -->
          <div class="relative h-64 md:h-96 w-full bg-gray-200 overflow-hidden group">
            <img 
              v-if="business.cover_url" 
              :src="business.cover_url" 
              class="w-full h-full object-cover transition duration-700 group-hover:scale-105"
              alt="Kapak Fotoğrafı"
            >
            <!-- Kapak Yoksa Varsayılan -->
            <div v-else class="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center">
              <span class="text-white/10 text-6xl font-bold tracking-widest uppercase select-none">{{ business.name }}</span>
            </div>
            
            <!-- Karartma (Gradient Overlay) -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          </div>
    
          <!-- 2. BAŞLIK VE LOGO ALANI -->
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div class="flex flex-col md:flex-row items-start gap-6 -mt-20 mb-8">
              
              <!-- Logo -->
              <div class="relative z-10 w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white p-1.5 shadow-xl flex-shrink-0">
                <img 
                  v-if="business.logo_url" 
                  :src="business.logo_url" 
                  class="w-full h-full object-cover rounded-xl bg-gray-50 border border-gray-100"
                  alt="Logo"
                >
                <div v-else class="w-full h-full rounded-xl bg-primary-50 flex items-center justify-center text-5xl border border-primary-100">
                  🏢
                </div>
              </div>
    
              <!-- İsim ve Özet Bilgiler -->
              <div class="flex-1 pt-2 md:pt-24 w-full">
                <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  
                  <!-- Sol Taraf: İsim ve Konum -->
                  <div>
                    <h1 class="text-3xl md:text-4xl font-bold text-gray-900 font-serif leading-tight">
                      {{ business.name }}
                    </h1>
                    
                    <div class="flex items-center gap-2 mt-2 text-gray-500 font-medium">
                      <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      
                      <span>
                        {{ business.district ? business.district + ' /' : '' }} {{ business.city }}
                      </span>
                    </div>
    
                    <!-- Açıklama -->
                    <p v-if="business.description" class="mt-4 text-gray-600 leading-relaxed max-w-2xl">
                      {{ business.description }}
                    </p>
                  </div>
    
                  <!-- Sağ Taraf: Aksiyon Butonları (Responsive Grid) -->
                  <div class="flex flex-wrap gap-3 mt-2 w-full md:w-auto">
                    
                    <!-- WhatsApp -->
<a v-if="business.phone" :href="`https://wa.me/${business.phone.replace(/\s+/g, '').replace('+', '')}`" target="_blank" class="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#25D366] text-white hover:bg-[#128C7E] px-5 py-2.5 rounded-lg font-bold transition shadow-md shadow-green-100">
  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.001.572 2.135.911 3.26.911h.001c3.181 0 5.767-2.586 5.768-5.766.001-3.18-2.585-5.769-5.765-5.769zM12 18.916c-1.189 0-2.352-.318-3.369-.92l-.241-.144-2.503.656.668-2.437-.156-.249c-.655-1.045-1.002-2.261-1.002-3.494 0-3.666 2.981-6.648 6.648-6.648 3.666 0 6.648 2.982 6.648 6.648 0 3.666-2.981 6.648-6.648 6.648z"/></svg>
  WhatsApp
</a>
    
                    <!-- Harita -->
                    <a v-if="business.maps_url" :href="business.maps_url" target="_blank" class="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-primary-600 px-5 py-2.5 rounded-lg font-medium transition shadow-sm">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                      Yol Tarifi
                    </a>
    
                    <!-- Instagram -->
                    <a v-if="business.instagram_url" :href="business.instagram_url" target="_blank" class="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-pink-600 px-5 py-2.5 rounded-lg font-medium transition shadow-sm" title="Instagram">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
    
                    <!-- Website -->
                    <a v-if="business.website_url" :href="business.website_url" target="_blank" class="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-blue-600 px-5 py-2.5 rounded-lg font-medium transition shadow-sm" title="Web Sitesi">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                    </a>
    
                  </div>
                </div>
    
                <!-- Açık Adres -->
                <div v-if="business.address" class="mt-6 pt-6 border-t border-gray-100">
                  <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Adres</h3>
                  <p class="text-gray-600 text-sm">{{ business.address }}</p>
                </div>
    
              </div>
            </div>
          </div>
    
          <!-- 3. ALT SEKMELER (Hizmetler, Ekip, Ürünler) -->
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            
            <!-- Sekme Başlıkları -->
            <div class="border-b border-gray-200 mb-8 overflow-x-auto">
              <nav class="flex space-x-8 min-w-max">
                <button class="border-b-2 border-primary-600 text-primary-700 px-2 pb-4 font-bold text-sm">Hizmetler & Fiyatlar</button>
                <button class="border-transparent text-gray-500 hover:text-gray-700 px-2 pb-4 font-medium text-sm transition">Uzman Kadromuz</button>
                <button class="border-transparent text-gray-500 hover:text-gray-700 px-2 pb-4 font-medium text-sm transition">Ürün Önerileri</button>
                <button class="border-transparent text-gray-500 hover:text-gray-700 px-2 pb-4 font-medium text-sm transition">Değerlendirmeler</button>
              </nav>
            </div>
    
            <!-- İÇERİK ALANI (Şimdilik Boş) -->
            <div class="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <div class="text-5xl mb-4">✨</div>
              <h3 class="text-xl font-bold text-gray-900">Bu özellikler çok yakında!</h3>
              <p class="text-gray-500 mt-2 max-w-md mx-auto">
                Hizmet listesi, randevu sistemi ve ürün vitrini hazırlık aşamasında. Şimdilik işletmeyle telefon veya WhatsApp üzerinden iletişime geçebilirsiniz.
              </p>
            </div>
    
          </div>
    
        </div>
      </DefaultLayout>
    </template>