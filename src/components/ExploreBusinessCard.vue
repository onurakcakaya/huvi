<script setup>
    const props = defineProps({
      business: Object
    })
    </script>
    
    <template>
      <router-link 
        :to="`/business/${business.slug}`"
        class="block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition group"
      >
        <!-- Kapak Fotoğrafı -->
        <div class="h-48 bg-gray-100 relative overflow-hidden">
          <img 
            v-if="business.cover_url" 
            :src="business.cover_url" 
            class="w-full h-full object-cover group-hover:scale-105 transition duration-700"
          >
          <div v-else class="w-full h-full flex items-center justify-center text-4xl bg-gray-200">🏢</div>
          
          <!-- Logo (Üstüne biniyor) -->
          <div class="absolute bottom-4 left-4 w-16 h-16 rounded-lg bg-white p-1 shadow-lg">
            <img 
              :src="business.logo_url || 'https://via.placeholder.com/100'" 
              class="w-full h-full object-cover rounded"
            >
          </div>
        </div>
    
        <!-- Bilgiler -->
        <div class="p-5 pt-4">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-bold text-gray-900 text-lg group-hover:text-primary-600 transition">{{ business.name }}</h3>
              <p class="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                {{ business.district }}, {{ business.city }}
              </p>
            </div>
            <!-- Puan (Şimdilik Statik/Demo) -->
            <div class="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded text-yellow-700 text-xs font-bold">
              <span>⭐ 5.0</span>
            </div>
          </div>
    
          <div class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
            <span class="text-xs text-gray-400 font-medium">{{ business.type || 'Güzellik Merkezi' }}</span>
            <span class="text-sm font-bold text-primary-600 group-hover:underline">Randevu Al →</span>
          </div>
        </div>
      </router-link>
    </template>