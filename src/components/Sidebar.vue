<script setup>
  import { RouterLink } from 'vue-router'
  import { useAuthStore } from '../stores/auth'
  
  const props = defineProps({
    isOpen: Boolean // Açık mı kapalı mı bilgisini Layout'tan alacak
  })
  
  const emit = defineEmits(['close']) // Kapatma isteğini yukarı bildirecek
  const authStore = useAuthStore()
  
  const closeSidebar = () => {
    emit('close')
  }
  </script>
  
  <template>
    <div>
      <!-- 1. KARARTMA PERDESİ (Overlay) -->
      <div 
        v-if="isOpen" 
        @click="closeSidebar"
        class="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
      ></div>
  
      <!-- 2. SIDEBAR KUTUSU -->
      <aside 
        class="fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col"
        :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        
        <!-- Üst Kısım: Başlık ve Kapat Butonu -->
        <div class="p-5 border-b border-gray-100 flex justify-between items-center bg-primary-600 text-white">
          <div class="flex items-center gap-2">
            <!-- Logo Küçük -->
            <span class="font-serif text-xl font-bold tracking-wide">Aura</span>
          </div>
          <button @click="closeSidebar" class="focus:outline-none hover:bg-primary-700 rounded-full p-1 transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
  
        <!-- Menü Linkleri -->
        <div class="py-4 overflow-y-auto flex-1">
          <ul class="space-y-1">
            
            <!-- GENEL -->
            <li>
              <RouterLink to="/" @click="closeSidebar" class="flex items-center px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition border-l-4 border-transparent hover:border-primary-600">
                <span class="mr-3 text-lg">🏠</span> Anasayfa
              </RouterLink>
            </li>
  
            <!-- KULLANICI MENÜSÜ -->
            <template v-if="authStore.user">
              <li>
                <RouterLink to="/saved" @click="closeSidebar" class="flex items-center px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition border-l-4 border-transparent hover:border-primary-600">
                  <span class="mr-3 text-lg">🔖</span> Kaydettiklerim
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/liked" @click="closeSidebar" class="flex items-center px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition border-l-4 border-transparent hover:border-primary-600">
                  <span class="mr-3 text-lg">❤️</span> Beğendiklerim
                </RouterLink>
              </li>
            </template>
  
            <li class="border-t border-gray-100 my-2 pt-2"></li>
  
            <!-- YAYINCI MENÜSÜ (Eğer Yetkili İse) -->
            <template v-if="['publisher', 'business'].includes(authStore.profile?.role)">
              <li class="px-6 py-2">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Yönetim Paneli</span>
              </li>
  
              <li>
                <RouterLink to="/dashboard" @click="closeSidebar" class="flex items-center px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition border-l-4 border-transparent hover:border-primary-600">
                  <span class="mr-3 text-lg">📊</span> Genel Bakış
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/dashboard/posts" @click="closeSidebar" class="flex items-center px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition border-l-4 border-transparent hover:border-primary-600">
                  <span class="mr-3 text-lg">📝</span> Yayınlarım
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/dashboard/settings" @click="closeSidebar" class="flex items-center px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition border-l-4 border-transparent hover:border-primary-600">
                  <span class="mr-3 text-lg">⚙️</span> Profil Ayarları
                </RouterLink>
              </li>
            </template>
  
          </ul>
        </div>
        
        <!-- Alt Kısım: Çıkış -->
        <div v-if="authStore.user" class="p-4 border-t border-gray-100">
          <button @click="authStore.logout(); closeSidebar()" class="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Çıkış Yap
          </button>
        </div>
  
      </aside>
    </div>
  </template>