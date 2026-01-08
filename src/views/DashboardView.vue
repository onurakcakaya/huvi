<script setup>
  import { onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { supabase } from '../supabase'
  import { useAuthStore } from '../stores/auth'
  import DefaultLayout from '../layouts/DefaultLayout.vue'
  
  const authStore = useAuthStore()
  const router = useRouter()
  const loading = ref(true)
  
  // Görüntüleme Durumları
  const showBusinessSection = ref(false)
  const showPublisherSection = ref(false)
  
  // Veriler
  const business = ref(null)
  const userRole = ref(null) // 'owner' | 'staff'
  const publisherStats = ref(null)
  
  const fetchDashboardData = async () => {
    loading.value = true
    const userId = authStore.user.id
  
    try {
      // ---------------------------------------------
      // 1. İŞLETME YETKİSİ KONTROLÜ
      // ---------------------------------------------
      let { data: bData } = await supabase.from('businesses').select('*').eq('owner_id', userId).maybeSingle()
      
      if (bData) {
        business.value = bData
        userRole.value = 'owner'
        showBusinessSection.value = true
      } else {
        const { data: sData } = await supabase.from('business_staff').select('role, businesses (*)').eq('user_id', userId).maybeSingle()
        if (sData) {
          business.value = sData.businesses
          userRole.value = sData.role
          showBusinessSection.value = true
        }
      }
  
      // ---------------------------------------------
      // 2. YAYINCI YETKİSİ KONTROLÜ
      // ---------------------------------------------
      if (authStore.profile?.role === 'publisher') {
        showPublisherSection.value = true
        
        const { data: posts } = await supabase.from('posts').select('likes_count, saves_count').eq('user_id', userId)
        if (posts) {
          publisherStats.value = {
            totalPosts: posts.length,
            totalLikes: posts.reduce((a, b) => a + (b.likes_count || 0), 0),
            totalSaves: posts.reduce((a, b) => a + (b.saves_count || 0), 0)
          }
        }
      }
  
      // ---------------------------------------------
      // 3. YETKİ YOKSA -> ŞUTLA 🚫
      // ---------------------------------------------
      if (!showBusinessSection.value && !showPublisherSection.value) {
        router.replace('/') 
      }
  
    } catch (error) {
      console.error('Dashboard hatası:', error)
    } finally {
      loading.value = false
    }
  }
  
  onMounted(() => {
    if (authStore.user) {
      fetchDashboardData()
    } else {
      router.replace('/login')
    }
  })
  </script>
  
  <template>
    <DefaultLayout>
      <div class="max-w-7xl mx-auto px-4 py-8 pb-24">
        
        <!-- YÜKLENİYOR -->
        <div v-if="loading" class="flex justify-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
  
        <div v-else class="space-y-12">
  
          <!-- ================================================= -->
          <!-- BÖLÜM 1: YÖNETİM PANELİ (İşletme) -->
          <!-- ================================================= -->
          <section v-if="showBusinessSection" class="animate-fade-in">
            <div class="flex items-center gap-3 mb-6">
              <span class="text-3xl">💼</span>
              <div>
                <!-- BAŞLIK GÜNCELLENDİ -->
                <h2 class="text-2xl font-bold text-gray-900">Yönetim Paneli</h2>
                <p class="text-gray-500 text-sm">İşletmenizin kontrol merkezi.</p>
              </div>
            </div>
  
            <!-- İşletme Kartı -->
            <div class="bg-gray-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center gap-6">
              <div class="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/20 overflow-hidden">
                <img v-if="business?.logo_url" :src="business.logo_url" class="w-full h-full object-cover">
                <span v-else class="text-2xl">🏢</span>
              </div>
              <div class="flex-1 text-center md:text-left">
                <h1 class="text-2xl font-bold">{{ business?.name }}</h1>
                <p class="text-gray-400 text-xs mt-1 uppercase tracking-wide font-bold">
                  {{ userRole === 'owner' ? 'Yönetici' : 'Personel' }} Modu
                </p>
              </div>
              <div class="flex gap-3">
                <router-link :to="`/business/${business?.slug}`" target="_blank" class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold transition">Vitrin</router-link>
                <router-link v-if="userRole === 'owner'" to="/settings/business" class="bg-white text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-bold transition">Ayarlar</router-link>
              </div>
            </div>
  
            <!-- Araçlar Menüsü (Grid) -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              
              <!-- 1. RANDEVULAR (Herkes Görür) -->
              <router-link 
                to="/business/appointments" 
                class="p-5 bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-md transition text-left group"
              >
                <span class="text-2xl mb-2 block group-hover:scale-110 transition">📅</span>
                <span class="font-bold text-gray-900 block text-sm">Randevular</span>
              </router-link>
  
              <!-- 2. EKİP (Sadece Owner) -->
              <router-link 
                v-if="userRole === 'owner'" 
                to="/my-staff" 
                class="p-5 bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-md transition text-left group"
              >
                <span class="text-2xl mb-2 block group-hover:scale-110 transition">👥</span>
                <span class="font-bold text-gray-900 block text-sm">Ekip & Uzmanlar</span>
              </router-link>
              
              <!-- 3. HİZMETLER (Sadece Owner) -->
              <router-link 
                v-if="userRole === 'owner'"
                to="/my-services" 
                class="p-5 bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-md transition text-left group"
              >
                <span class="text-2xl mb-2 block group-hover:scale-110 transition">✂️</span>
                <span class="font-bold text-gray-900 block text-sm">Hizmetler & Fiyatlar</span>
              </router-link>
  
              <!-- 4. RAPORLAR (Sadece Owner) - YENİ EKLENDİ -->
              <router-link 
                v-if="userRole === 'owner'"
                to="/business/reports" 
                class="p-5 bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-md transition text-left group"
              >
                <span class="text-2xl mb-2 block group-hover:scale-110 transition">📈</span>
                <span class="font-bold text-gray-900 block text-sm">Kasa & Raporlar</span>
              </router-link>
  
            </div>
          </section>
  
          <!-- ================================================= -->
          <!-- BÖLÜM 2: İÇERİK STÜDYOSU (Yayıncı) -->
          <!-- ================================================= -->
          <section v-if="showPublisherSection" class="animate-fade-in">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-3">
                <span class="text-3xl">✨</span>
                <div>
                  <h2 class="text-2xl font-bold text-gray-900">İçerik Stüdyosu</h2>
                  <p class="text-gray-500 text-sm">Yayıncı istatistikleri.</p>
                </div>
              </div>
              <router-link to="/my-posts" class="text-primary-600 font-bold hover:underline text-sm">Yönet</router-link>
            </div>
  
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p class="text-gray-500 text-xs font-bold uppercase">Paylaşım</p>
                <p class="text-3xl font-bold text-gray-900">{{ publisherStats?.totalPosts || 0 }}</p>
              </div>
              <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p class="text-gray-500 text-xs font-bold uppercase">Beğeni</p>
                <p class="text-3xl font-bold text-gray-900">{{ publisherStats?.totalLikes || 0 }}</p>
              </div>
              <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p class="text-gray-500 text-xs font-bold uppercase">Kaydedilme</p>
                <p class="text-3xl font-bold text-gray-900">{{ publisherStats?.totalSaves || 0 }}</p>
              </div>
            </div>
          </section>
  
        </div>
      </div>
    </DefaultLayout>
  </template>