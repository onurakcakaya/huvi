<script setup>
  import { useAuthStore } from '../stores/auth'
  import { ref } from 'vue'
  import { RouterLink, useRouter } from 'vue-router'
  
  const authStore = useAuthStore()
  const router = useRouter()
  const isMenuOpen = ref(false)
  
  const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value
  }
  
  const emit = defineEmits(['toggleSidebar'])
  </script>
  
  <template>
    <nav class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          
          <!-- SOL TARAF (Hamburger + Logo + Keşfet) -->
          <div class="flex items-center flex-shrink-0 gap-2 sm:gap-4">
            
            <!-- Hamburger İkonu -->
            <button @click="$emit('toggleSidebar')" class="p-2 rounded-full text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition focus:outline-none">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
  
            <!-- Logo ve İsim -->
            <!-- DÜZELTME: 'hidden sm:flex' yerine 'flex' yaptık ki mobilde logo görünsün -->
            <RouterLink to="/" class="flex items-center gap-2 group">
              <img src="/vite.svg" alt="Logo" class="h-8 w-auto transition transform group-hover:scale-110" /> 
              <!-- Mobilde yer kalsın diye sadece yazıyı gizliyoruz (hidden sm:block) -->
              <span class="hidden sm:block text-xl font-bold text-gray-900 group-hover:text-primary-600 transition font-serif tracking-wide">
                Huvi
              </span>
            </RouterLink>
  
            <!-- Dikey Ayraç (Sadece masaüstünde şık durur) -->
            <div class="hidden sm:block h-6 w-px bg-gray-200 mx-1"></div>
  
            <!-- İşletmeleri Keşfet Linki -->
            <!-- DÜZELTME: Artık mobilde de görünüyor. Mobilde yazı küçük, masaüstünde normal. -->
            <router-link 
              to="/explore" 
              class="text-gray-600 hover:text-primary-600 font-medium transition flex items-center gap-1"
            >
              <!-- Mobilde büyüteç ikonu koyalım ki az yer kaplasın -->
              <svg class="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              
              <!-- Yazı: Mobilde 'Keşfet', Masaüstünde 'İşletmeleri Keşfet' -->
              <span class="text-sm sm:text-base">
                <span class="hidden sm:inline">İşletmeleri </span>Keşfet
              </span>
            </router-link>
  
          </div>
  
          <!-- SAĞ TARAF (Menüler) -->
          <div class="flex items-center space-x-2 sm:space-x-3">
            
            <!-- Giriş Yapmamış -->
            <template v-if="!authStore.user">
              <!-- Mobilde sadece 'Giriş' yazısı veya ikonu sığar, butonları küçülttük -->
              <RouterLink to="/login" class="text-gray-600 hover:text-primary-600 font-medium text-xs sm:text-sm px-2 sm:px-3 py-2 transition">Giriş</RouterLink>
              <RouterLink to="/register" class="bg-gray-900 text-white px-3 sm:px-5 py-2 rounded-full hover:bg-primary-600 transition text-xs sm:text-sm font-medium shadow-md">
                <span class="sm:hidden">Kayıt</span>
                <span class="hidden sm:inline">Kayıt Ol</span>
              </RouterLink>
            </template>
  
            <!-- Giriş Yapmış -->
            <div v-else class="relative ml-1 sm:ml-2">
              <button @click="toggleMenu" class="flex items-center space-x-2 focus:outline-none group">
                <div class="text-right hidden md:block">
                  <span class="block text-sm font-bold text-gray-700 group-hover:text-primary-600 transition">
                    {{ authStore.profile?.full_name }}
                  </span>
                </div>
                
                <!-- Avatar -->
                <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full p-0.5 bg-gradient-to-tr from-primary-400 to-gray-200 group-hover:from-primary-600 transition">
                  <div class="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                     <img v-if="authStore.profile?.avatar_url" :src="authStore.profile.avatar_url" class="w-full h-full object-cover">
                     <span v-else class="text-primary-600 font-bold text-sm sm:text-lg">{{ authStore.profile?.full_name?.[0] || 'U' }}</span>
                  </div>
                </div>
              </button>
              
              <!-- Dropdown Menü -->
              <div v-if="isMenuOpen" class="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl py-2 border border-gray-100 z-50 ring-1 ring-black ring-opacity-5">
                
                <div class="px-4 py-2 border-b border-gray-100 mb-1">
                  <p class="text-xs text-gray-500">Hoşgeldin,</p>
                  <p class="text-sm font-bold text-gray-800 truncate">{{ authStore.user.email }}</p>
                </div>
  
                <!-- Publisher ise Dashboard Linki -->
                <RouterLink v-if="['publisher'].includes(authStore.profile?.role)" to="/dashboard" class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition">
                  <span class="mr-2">⚡</span> Yönetim Paneli
                </RouterLink>
                
                <RouterLink to="/settings/publisher" class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition">
                  <span class="mr-2">👤</span> Profil Ayarları
                </RouterLink>
                
                <div class="border-t border-gray-100 my-1"></div>
                
                <button @click="authStore.logout" class="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
                  <span class="mr-2">🚪</span> Çıkış Yap
                </button>
              </div>
            </div>
          </div>
  
        </div>
      </div>
    </nav>
  </template>