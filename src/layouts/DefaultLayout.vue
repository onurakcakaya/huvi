<script setup>
  import Navbar from '../components/Navbar.vue'
  import Sidebar from '../components/Sidebar.vue' // Sidebar'ı çağır
  import { ref, onMounted } from 'vue'
  import { useAuthStore } from '../stores/auth'
  
  const authStore = useAuthStore()
  const isSidebarOpen = ref(false) // Menü açık/kapalı durumu
  
  // Menüyü aç/kapat fonksiyonu
  const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value
  }
  
  onMounted(() => {
    authStore.initialize()
  })
  </script>
  
  <template>
    <div class="min-h-screen bg-gray-50">
      
      <!-- Navbar'a toggle emrini dinlemesini söylüyoruz -->
      <Navbar @toggleSidebar="toggleSidebar" />

      <div 
  v-if="authStore.user && !authStore.user.email_confirmed_at" 
  class="bg-yellow-50 border-b border-yellow-200 p-4 text-center text-yellow-800 text-sm"
>
  ⚠️ Hesabınız henüz doğrulanmadı. Tam erişim için lütfen e-posta kutunuzu kontrol edin.
</div>
      
      <!-- Sidebar'ı yerleştiriyoruz -->
      <Sidebar :isOpen="isSidebarOpen" @close="isSidebarOpen = false" />
      
      <main>
        <slot />
      </main>
    </div>
  </template>