<script setup>
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  
  const props = defineProps({
    post: {
      type: Object,
      required: true
    }
  })
  
  // Tarihi formatla
  const formattedDate = computed(() => {
    return new Date(props.post.created_at).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long'
    })
  })
  
  const goToDetail = () => {
    router.push({ name: 'post-detail', params: { id: props.post.id } })
  }
  </script>
  
  <template>
    <!-- 
      ÖNEMLİ DEĞİŞİKLİKLER:
      1. 'mb-6': Alt alta gelen kartlar birbirine yapışmasın diye boşluk.
      2. 'break-inside-avoid': Kartımız sütun geçerken ikiye bölünmesin.
    -->
    <div 
      @click="goToDetail"
      class="relative mb-6 break-inside-avoid bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer group"
    >
      
      <!-- Kapak Resmi (Artık sabit boyutta değil, resim neyse o!) -->
      <div class="relative w-full">
        <img 
          :src="post.media_url" 
          :alt="post.title" 
          class="w-full h-auto object-cover block" 
          loading="lazy"
        />
        
        <!-- Hover Overlay (Pinterest gibi karartma) -->
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
  
        <!-- Kategori Etiketi (Sol Üst) -->
        <span class="absolute top-3 left-3 bg-white/95 backdrop-blur text-[10px] font-bold px-2 py-1 rounded-full text-gray-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {{ post.categories?.name }}
        </span>
  
        <!-- Kaydet Butonu (Sağ Üst - Süs) -->
        <div class="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
        </div>
      </div>
  
      <!-- İçerik Bilgileri -->
      <div class="p-4">
        <h3 class="font-bold text-gray-900 text-sm leading-snug mb-2 group-hover:text-primary-600 transition-colors">
          {{ post.title }}
        </h3>
        
        <!-- Alt Kısım: Yazar -->
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <div class="flex items-center space-x-2">
            <!-- Avatar -->
            <img v-if="post.profiles?.avatar_url" :src="post.profiles.avatar_url" class="w-6 h-6 rounded-full object-cover">
            <div v-else class="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center text-[10px] font-bold text-primary-600">
              {{ post.profiles?.full_name?.[0] || 'U' }}
            </div>
            
            <span class="text-xs text-gray-600 truncate max-w-[100px]">
              {{ post.profiles?.full_name }}
            </span>
          </div>
  
          <!-- Beğeni -->
          <div class="flex items-center text-gray-400 text-xs gap-1">
            <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <span>{{ post.likes_count || 0 }}</span>
          </div>
        </div>
      </div>
  
    </div>
  </template>