<script setup>
  import { onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router' // Router eklendi
  import { supabase } from '../supabase'
  import { useAuthStore } from '../stores/auth'
  import DefaultLayout from '../layouts/DefaultLayout.vue'
  
  const authStore = useAuthStore()
  const router = useRouter() // Yönlendirmeler için
  
  const loading = ref(true)
  const business = ref(null)
  const userRole = ref(null) // 'owner' veya 'staff'
  
  const fetchDashboardData = async () => {
    loading.value = true
    try {
      const userId = authStore.user.id
  
      // 1. ADIM: İŞLETME SAHİBİ Mİ? (Owner Kontrolü)
      const { data: ownerData, error: ownerError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', userId)
        .single()
  
      if (ownerData) {
        business.value = ownerData
        userRole.value = 'owner'
        loading.value = false
        return // Bulduk, çıkabiliriz
      }
  
      // 2. ADIM: İŞLETME ÇALIŞANI MI? (Staff Kontrolü)
      // Sütun adı düzeltildi: 'user_id' kullanıyoruz (profile_id değil)
      const { data: staffData, error: staffError } = await supabase
        .from('business_staff')
        .select(`
          role,
          businesses (*) 
        `)
        .eq('user_id', userId) // <-- HATA BURADAYDI, DÜZELDİ
        .single()
  
      if (staffData) {
        business.value = staffData.businesses
        userRole.value = staffData.role // 'staff' veya 'manager'
      }
  
    } catch (error) {
      console.error('Veri çekme hatası:', error.message)
    } finally {
      loading.value = false
    }
  }
  
  onMounted(() => {
    if (authStore.user) {
      fetchDashboardData()
    }
  })
  </script>
  
  <template>
    <DefaultLayout>
      <div class="max-w-7xl mx-auto px-4 py-8">
        
        <!-- YÜKLENİYOR -->
        <div v-if="loading" class="flex justify-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
  
        <!-- DURUM 1: İŞLETMESİ YOKSA (BAŞVURU EKRANI) -->
        <div v-else-if="!business" class="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div class="text-6xl mb-4">🚀</div>
          <h1 class="text-3xl font-bold text-gray-900">İşletmenizi HUVI'ye Taşıyın</h1>
          <p class="text-gray-500 mt-3 max-w-lg mx-auto">
            Binlerce kullanıcıya ulaşmak, randevularınızı yönetmek ve vitrininizi oluşturmak için hemen başvurun.
          </p>
          <router-link 
            to="/apply-business" 
            class="mt-8 inline-block bg-gray-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-black transition shadow-lg"
          >
            İşletme Oluştur
          </router-link>
        </div>
  
        <!-- DURUM 2: İŞLETME VARSA (DASHBOARD) -->
        <div v-else>
          
          <!-- Üst Bilgi Kartı -->
          <div class="bg-gray-900 text-white rounded-2xl p-8 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-3xl font-bold">{{ business.name }}</h1>
                <span v-if="userRole === 'owner'" class="bg-primary-500 text-xs px-2 py-1 rounded font-bold uppercase tracking-wide">Yönetici</span>
                <span v-else class="bg-blue-500 text-xs px-2 py-1 rounded font-bold uppercase tracking-wide">Personel</span>
              </div>
              <p class="text-gray-400 mt-2">
                {{ business.city }} • {{ userRole === 'owner' ? 'Tüm yetkilere sahipsiniz.' : 'Yetkili personel girişi yapıldı.' }}
              </p>
            </div>
            
            <div class="flex gap-3">
               <router-link 
                :to="`/business/${business.slug}`" 
                target="_blank"
                class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                Vitrinimi Gör ↗
              </router-link>
              <router-link 
                to="/settings/business" 
                class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-bold transition shadow-lg shadow-primary-900/50"
              >
                Düzenle
              </router-link>
            </div>
          </div>
  
          <!-- İstatistikler (Örnek) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <span class="text-gray-500 text-sm font-medium">Toplam Randevu</span>
              <p class="text-3xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <span class="text-gray-500 text-sm font-medium">Vitrin Görüntülenme</span>
              <p class="text-3xl font-bold text-gray-900 mt-1">128</p>
            </div>
            <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <span class="text-gray-500 text-sm font-medium">Favoriye Ekleyenler</span>
              <p class="text-3xl font-bold text-gray-900 mt-1">12</p>
            </div>
            <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <span class="text-gray-500 text-sm font-medium">Puan Ortalaması</span>
              <p class="text-3xl font-bold text-gray-900 mt-1">5.0</p>
            </div>
          </div>
  
          <!-- YÖNETİM BUTONLARI -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            
            <!-- Randevular -->
            <button class="p-6 bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-md transition text-left group">
              <span class="text-3xl mb-2 block group-hover:scale-110 transition duration-300">📅</span>
              <span class="font-bold text-gray-900 block">Randevular</span>
              <span class="text-xs text-gray-500">Takvimi yönet</span>
            </button>
  
            <!-- Ekip Yönetimi (Sadece OWNER Girebilir) -->
            <router-link 
              v-if="userRole === 'owner'"
              to="/my-staff"
              class="p-6 bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-md transition text-left group"
            >
              <span class="text-3xl mb-2 block group-hover:scale-110 transition duration-300">👥</span>
              <span class="font-bold text-gray-900 block">Ekip & Uzmanlar</span>
              <span class="text-xs text-gray-500">Personel ekle/çıkar</span>
            </router-link>
  
            <!-- Hizmetler (Yakında) -->
             <button class="p-6 bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-md transition text-left group">
              <span class="text-3xl mb-2 block group-hover:scale-110 transition duration-300">✂️</span>
              <span class="font-bold text-gray-900 block">Hizmetler</span>
              <span class="text-xs text-gray-500">Fiyat listesi</span>
            </button>
  
          </div>
  
        </div>
      </div>
    </DefaultLayout>
  </template>