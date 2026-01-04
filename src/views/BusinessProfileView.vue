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
        
        <div v-if="loading" class="flex justify-center py-40">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    
        <div v-else-if="!business" class="text-center py-40 text-gray-500">
          <h1 class="text-2xl font-bold">404</h1>
          <p>Böyle bir işletme bulunamadı.</p>
        </div>
    
        <div v-else>
          
          <!-- 1. KAPAK & LOGO ALANI -->
          <div class="relative">
            <!-- Kapak Resmi -->
            <div class="h-64 md:h-80 w-full bg-gray-200 overflow-hidden">
              <img v-if="business.cover_url" :src="business.cover_url" class="w-full h-full object-cover">
              <div v-else class="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center text-white/20 text-4xl font-bold">
                {{ business.name }}
              </div>
            </div>
    
            <!-- İçerik Container (Yukarı Kaydırılmış) -->
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-16">
              <div class="bg-white rounded-xl shadow-lg p-6 md:p-8 flex flex-col md:flex-row items-start md:items-end gap-6">
                
                <!-- Logo -->
                <div class="w-32 h-32 rounded-xl bg-white p-1 shadow-md -mt-20 md:-mt-0 flex-shrink-0">
                  <img v-if="business.logo_url" :src="business.logo_url" class="w-full h-full object-cover rounded-lg bg-gray-50">
                  <div v-else class="w-full h-full rounded-lg bg-primary-100 flex items-center justify-center text-4xl">🏢</div>
                </div>
    
                <!-- İsim ve Butonlar -->
                <div class="flex-1 w-full">
                  <div class="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                      <h1 class="text-3xl font-bold text-gray-900">{{ business.name }}</h1>
                      <p class="text-gray-500 flex items-center gap-1 mt-1">
                        <span>📍</span> {{ business.city }} <span v-if="business.address">• {{ business.address }}</span>
                      </p>
                      <p v-if="business.description" class="text-gray-600 mt-3 text-sm max-w-2xl leading-relaxed">
                        {{ business.description }}
                      </p>
                    </div>
    
                    <!-- Aksiyon Butonları -->
                    <div class="flex gap-3">
                      <a v-if="business.instagram_url" :href="business.instagram_url" target="_blank" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition text-sm">
                        Instagram
                      </a>
                      <a v-if="business.maps_url" :href="business.maps_url" target="_blank" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition text-sm">
                        Yol Tarifi
                      </a>
                      <a v-if="business.phone" :href="`tel:${business.phone}`" class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-bold transition text-sm shadow-md">
                        📞 Ara
                      </a>
                    </div>
                  </div>
                </div>
    
              </div>
            </div>
          </div>
    
          <!-- 2. ALT SEKMELER (Hizmetler, Ekip, Ürünler) -->
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            <div class="border-b border-gray-200 mb-8">
              <nav class="flex space-x-8">
                <button class="border-b-2 border-primary-600 text-primary-600 px-1 pb-4 font-bold text-sm">Hizmetler</button>
                <button class="border-transparent text-gray-500 hover:text-gray-700 px-1 pb-4 font-medium text-sm">Ekibimiz</button>
                <button class="border-transparent text-gray-500 hover:text-gray-700 px-1 pb-4 font-medium text-sm">Ürünler</button>
              </nav>
            </div>
    
            <!-- Geçici Boş Durum -->
            <div class="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p class="text-gray-500 text-lg">Hizmetler ve randevu sistemi çok yakında burada! 💇‍♀️</p>
              <p class="text-sm text-gray-400 mt-2">Şimdilik iletişim butonlarını kullanarak ulaşabilirsiniz.</p>
            </div>
    
          </div>
    
        </div>
      </DefaultLayout>
    </template>