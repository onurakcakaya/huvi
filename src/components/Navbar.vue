<script setup>
  import { useAuthStore } from '../stores/auth'
  import { ref } from 'vue'
  import { RouterLink, useRouter } from 'vue-router'
  
  const authStore = useAuthStore()
  const router = useRouter()
  const isMenuOpen = ref(false)
  const searchQuery = ref('')
  
  const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value
  }
  
  const emit = defineEmits(['toggleSidebar'])
  </script>
  
  <template>
    <nav class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          
          <!-- SOL TARAFI (Hamburger + Logo) -->
          <div class="flex items-center flex-shrink-0 gap-4">
            
            <!-- Hamburger İkonu -->
            <button @click="$emit('toggleSidebar')" class="p-2 rounded-full text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition focus:outline-none">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
  
            <!-- Logo ve İsim (DÜZELTİLDİ: sm:flex yapıldı) -->
            <RouterLink to="/" class="hidden sm:flex items-center gap-2 group">
              <!-- Logo Resmi -->
              <img src="/vite.svg" alt="Logo" class="h-8 w-auto transition transform group-hover:scale-110" /> 
              <!-- İsim -->
              <span class="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition font-serif tracking-wide">
                Aura
              </span>
            </RouterLink>
          </div>
  
          <!-- SAĞ TARAF (Menüler) -->
          <div class="flex items-center space-x-3">
            <!-- Giriş Yapmamış -->
            <template v-if="!authStore.user">
              <RouterLink to="/login" class="text-gray-600 hover:text-primary-600 font-medium text-sm px-3 py-2 transition">Giriş</RouterLink>
              <RouterLink to="/register" class="bg-gray-900 text-white px-5 py-2 rounded-full hover:bg-primary-600 transition text-sm font-medium shadow-md hover:shadow-lg transform active:scale-95">Kayıt Ol</RouterLink>
            </template>
  
            <!-- Giriş Yapmış -->
            <div v-else class="relative ml-2">
              <button @click="toggleMenu" class="flex items-center space-x-2 focus:outline-none group">
                <div class="text-right hidden md:block">
                  <span class="block text-sm font-bold text-gray-700 group-hover:text-primary-600 transition">
                    {{ authStore.profile?.full_name }}
                  </span>
                </div>
                
                <!-- Avatar Yuvarlağı -->
                <div class="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-primary-400 to-gray-200 group-hover:from-primary-600 group-hover:to-primary-300 transition">
                  <div class="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                     <img v-if="authStore.profile?.avatar_url" :src="authStore.profile.avatar_url" class="w-full h-full object-cover">
                     <span v-else class="text-primary-600 font-bold text-lg">{{ authStore.profile?.full_name?.[0] || 'U' }}</span>
                  </div>
                </div>
              </button>
              
              <!-- Dropdown Menü -->
              <div v-if="isMenuOpen" class="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl py-2 border border-gray-100 z-50 ring-1 ring-black ring-opacity-5">
                
                <div class="px-4 py-2 border-b border-gray-100 mb-1">
                  <p class="text-xs text-gray-500">Hoşgeldin,</p>
                  <p class="text-sm font-bold text-gray-800 truncate">{{ authStore.user.email }}</p>
                </div>
  
                <RouterLink v-if="['publisher', 'business'].includes(authStore.profile?.role)" to="/dashboard" class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition">
                  <span class="mr-2">⚡</span> Yönetim Paneli
                </RouterLink>
                
                <RouterLink to="/account" class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition">
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