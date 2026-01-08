<script setup>
  import { onMounted, ref } from 'vue'
  import { RouterLink } from 'vue-router'
  import { useAuthStore } from '../stores/auth'
  import { supabase } from '../supabase'
  
  const props = defineProps({
    isOpen: Boolean
  })
  
  const emit = defineEmits(['close'])
  const authStore = useAuthStore()
  
  // Yetki Durumları
  const isPublisher = ref(false)
  const hasBusinessAccess = ref(false) // Owner veya Staff
  
  const closeSidebar = () => {
    emit('close')
  }
  
  // Sidebar açılınca yetkileri kontrol et
  onMounted(async () => {
    if (!authStore.user) return
  
    // 1. Publisher Kontrolü (Profilde role sütunu)
    if (authStore.profile?.role === 'publisher') {
      isPublisher.value = true
    }
  
    // 2. İşletme Erişimi Kontrolü (Owner veya Staff)
    try {
      // Owner mi?
      const { data: owner } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', authStore.user.id)
        .maybeSingle()
      
      if (owner) {
        hasBusinessAccess.value = true
      } else {
        // Staff mi?
        const { data: staff } = await supabase
          .from('business_staff')
          .select('id')
          .eq('user_id', authStore.user.id)
          .maybeSingle()
        
        if (staff) hasBusinessAccess.value = true
      }
    } catch (error) {
      console.error('Sidebar yetki hatası:', error)
    }
  })
  </script>
  
  <template>
    <div>
      <!-- Overlay -->
      <div 
        v-if="isOpen" 
        @click="closeSidebar"
        class="fixed inset-0 bg-black/50 z-40 transition-opacity backdrop-blur-sm"
      ></div>
  
      <!-- Sidebar -->
      <aside 
        class="fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-gray-200"
        :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        
        <!-- Header -->
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
          <span class="font-serif text-2xl font-bold tracking-wide">HUVI</span>
          <button @click="closeSidebar" class="hover:bg-gray-800 rounded-full p-1 transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
  
        <!-- Menü -->
        <div class="py-4 overflow-y-auto flex-1 px-3">
          <ul class="space-y-1">
            
            <!-- HERKESİN GÖRDÜĞÜ -->
            <li>
              <RouterLink to="/" @click="closeSidebar" class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition">
                <span class="mr-3 text-xl">🏠</span> Anasayfa
              </RouterLink>
            </li>
  
            <!-- USER MENÜSÜ -->
            <template v-if="authStore.user">
              <li>
                <RouterLink to="/saved" @click="closeSidebar" class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition">
                  <span class="mr-3 text-xl">🔖</span> Kaydettiklerim
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/liked" @click="closeSidebar" class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition">
                  <span class="mr-3 text-xl">❤️</span> Beğendiklerim
                </RouterLink>
              </li>
              <li>
  <RouterLink to="/my-appointments" @click="closeSidebar" class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition">
    <span class="mr-3 text-xl">📅</span> Randevularım
  </RouterLink>
</li>
            </template>
  
            <li class="border-t border-gray-200 my-3"></li>
  
            <!-- ============================================= -->
            <!-- YETKİ BAZLI MENÜLER (DİNAMİK) -->
            <!-- ============================================= -->
  
            <!-- 1. YAYINCI (PUBLISHER) MENÜSÜ -->
            <template v-if="isPublisher">
              <li class="px-4 py-2">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">İçerik Üreticisi</span>
              </li>
  
              <li>
                <RouterLink to="/dashboard" @click="closeSidebar" class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-purple-50 hover:text-purple-700 transition">
                  <span class="mr-3 text-xl">📊</span> Panel (Genel)
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/my-posts" @click="closeSidebar" class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-purple-50 hover:text-purple-700 transition">
                  <span class="mr-3 text-xl">📝</span> İçeriklerim
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/settings/publisher" @click="closeSidebar" class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-purple-50 hover:text-purple-700 transition">
                  <span class="mr-3 text-xl">⚙️</span> Yayıncı Ayarları
                </RouterLink>
              </li>
            </template>
  
            <!-- 2. İŞLETME (BUSINESS) MENÜSÜ -->
            <template v-if="hasBusinessAccess">
              <li class="px-4 py-2 mt-2">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">İşletme Yönetimi</span>
              </li>
              
              <!-- Eğer publisher değilse Dashboard linkini burada gösterelim ki erişebilsin -->
              <li v-if="!isPublisher">
                 <RouterLink to="/dashboard" @click="closeSidebar" class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition">
                  <span class="mr-3 text-xl">📊</span> İşletme Paneli
                </RouterLink>
              </li>
  
              <li>
                <RouterLink to="/my-staff" @click="closeSidebar" class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition">
                  <span class="mr-3 text-xl">👥</span> Ekip & Uzmanlar
                </RouterLink>
              </li>
              <li>
                 <a href="#" class="flex items-center px-4 py-3 text-gray-400 cursor-not-allowed rounded-lg">
                  <span class="mr-3 text-xl">📅</span> Randevular <span class="ml-2 text-[10px] bg-gray-200 px-1 rounded">Yakında</span>
                </a>
              </li>
            </template>
  
          </ul>
        </div>
        
        <!-- Footer -->
        <div v-if="authStore.user" class="p-4 border-t border-gray-200 bg-gray-50">
          <button @click="authStore.logout(); closeSidebar()" class="flex items-center justify-center w-full px-4 py-3 text-red-600 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 rounded-lg transition font-bold shadow-sm">
            Çıkış Yap
          </button>
        </div>
  
      </aside>
    </div>
  </template>